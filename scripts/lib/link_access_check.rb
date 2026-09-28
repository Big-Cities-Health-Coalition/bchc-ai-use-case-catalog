# frozen_string_literal: true

# Validation for the optional `link_access` block of _data/site.yml and for the
# `access:` key a links item (or a _data/resources.yml item) may carry.
# scripts/check_front_matter.rb calls it; stdlib only, like that script.
#
# What a URL resolves to is decided by CatalogTemplate::LinkAccess, the same
# module the site's `link_access` Liquid filter uses, so "every link on this
# entry needs a sign-in" here means exactly what the rendered page shows.

require "yaml"
require_relative "../../_plugins/link_access"

# Checks for site.yml `link_access` and the `access:` values that point into it.
module LinkAccessCheck
  # A level name is a YAML key an item's `access:` repeats, so keep it plain.
  LEVEL_NAME = /\A[a-z0-9][a-z0-9_-]*\z/
  # A DNS host name: dot-separated labels of letters, digits and inner hyphens.
  HOST_NAME = /\A[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\z/
  LEVEL_TEXT_KEYS = %w[label icon note request_url].freeze
  WHERE = "_data/site.yml: `link_access"

  # The icon names _includes/icon.html can draw, read off its "Names:" line.
  # @param root [String] repository root
  # @return [Array<String>, nil] nil when the file (or the line) is missing, so the icon check is skipped
  def self.icon_names(root)
    path = File.join(root, "_includes", "icon.html")
    return nil unless File.file?(path)

    line = File.foreach(path).find { |text| text.start_with?("Names:") }
    line&.delete_prefix("Names:")&.split
  end

  # The configured levels, or {} when there are none (or the block is malformed).
  # @param config [Object]
  # @return [Hash]
  def self.levels(config)
    config.is_a?(Hash) && config["levels"].is_a?(Hash) ? config["levels"] : {}
  end

  # @param value [String]
  # @return [Boolean] true for an http(s) URL, the same test check_front_matter.rb applies
  def self.http_url?(value)
    value.to_s.match?(%r{\Ahttps?://[^\s"'<>]+\z})
  end

  # Shape of the whole block. nil (no block) is fine: the feature is optional.
  # @param config [Object] site.yml's `link_access` value
  # @param icons [Array<String>, nil] drawable icon names, nil to skip the icon check
  # @return [Array<String>] failures
  def self.config_failures(config, icons = nil)
    return [] if config.nil?
    return ["#{WHERE}` must be a mapping with `levels` and/or `hosts`, got #{config.inspect}"] unless config.is_a?(Hash)

    failures = []
    if !config["levels"].nil? && !config["levels"].is_a?(Hash)
      failures << "#{WHERE}.levels` must be a mapping of level name to {label, icon, note, request_url}"
    end
    levels(config).each { |name, level| failures.concat(level_failures(name, level, icons)) }

    hosts = config["hosts"]
    if !hosts.nil? && !hosts.is_a?(Array)
      failures << "#{WHERE}.hosts` must be a list of {match, name, access, download} rules"
    elsif hosts
      hosts.each_with_index { |rule, index| failures.concat(rule_failures(rule, index, levels(config))) }
    end
    failures
  end

  # @param name [String] the level's key
  # @param level [Object]
  # @param icons [Array<String>, nil]
  # @return [Array<String>] failures
  def self.level_failures(name, level, icons)
    spot = "#{WHERE}.levels.#{name}`"
    failures = []
    unless name.to_s.match?(LEVEL_NAME)
      failures << "#{spot}: a level name must be lowercase letters, digits, `-` or `_` — an item's `access:` repeats it"
    end
    return failures << "#{spot} must be a mapping of {label, icon, note, request_url}, got #{level.inspect}" unless level.is_a?(Hash)

    LEVEL_TEXT_KEYS.each do |key|
      failures << "#{spot}: `#{key}` must be text, got #{level[key].class}" unless level[key].nil? || level[key].is_a?(String)
    end
    failures << "#{spot} needs a `label` — it is the chip a reader sees beside the link" if level["label"].to_s.strip.empty?

    icon = level["icon"].to_s.strip
    if !icon.empty? && icons && !icons.include?(icon)
      failures << "#{spot}: `icon` #{icon.inspect} is not in _includes/icon.html (see the Names: line there)"
    end

    request_url = level["request_url"].to_s.strip
    unless request_url.empty? || http_url?(request_url) || request_url.match?(/\Amailto:[^\s"'<>]+\z/)
      failures << "#{spot}: `request_url` must be an http(s) or mailto: URL, or blank (got #{request_url.inspect})"
    end
    failures
  end

  # @param rule [Object] one `hosts` item
  # @param index [Integer]
  # @param levels [Hash] the configured levels
  # @return [Array<String>] failures
  def self.rule_failures(rule, index, levels)
    spot = "#{WHERE}.hosts[#{index}]`"
    return ["#{spot} must be a mapping of {match, name, access, download}, got #{rule.inspect}"] unless rule.is_a?(Hash)

    failures = []
    match = rule["match"]
    if !match.is_a?(String) || match.strip.empty?
      failures << "#{spot} needs a `match`: a host, optionally with a path prefix (`example.org`, `example.org/p/`)"
    elsif match.include?("://")
      failures << "#{spot}: `match` is a host and an optional path, without the scheme (got #{match.inspect})"
    elsif match.strip.match?(/\s/) || !CatalogTemplate::LinkAccess.split_match(match).first.match?(HOST_NAME)
      failures << "#{spot}: `match` #{match.inspect} does not start with a host name (`example.org`, `example.org/p/`)"
    end

    failures << "#{spot}: `name` must be text, got #{rule['name'].class}" unless rule["name"].nil? || rule["name"].is_a?(String)
    unless rule["access"].nil? || (rule["access"].is_a?(String) && levels.key?(rule["access"].strip))
      failures << "#{spot}: `access` is #{rule['access'].inspect}, which is not a level under `link_access.levels`#{known(levels)}"
    end
    failures << "#{spot}: `download` must be true or false, got #{rule['download'].inspect}" unless [nil, true, false].include?(rule["download"])
    failures
  end

  # " (members, staff)", or " (none are configured)".
  # @param levels [Hash]
  # @return [String]
  def self.known(levels)
    levels.empty? ? " (none are configured)" : " (#{levels.keys.join(', ')})"
  end

  # The failure for one item's `access:` value, or nil when it names a level.
  # @param value [Object] the item's `access`
  # @param config [Object] site.yml's `link_access` value
  # @param spot [String] where the value is, for the message ("x/index.md:9: `resources[0].access`")
  # @return [String, nil]
  def self.item_access_failure(value, config, spot)
    return nil if value.is_a?(String) && levels(config).key?(value.strip)

    "#{spot} is #{value.inspect}, which is not a level under _data/site.yml `link_access.levels`#{known(levels(config))}"
  end

  # An item's `access:` overrides its host rule, so it has to name a level that
  # exists: a typo would silently drop the "Members only" chip. A site with no
  # `link_access` block is not checked at all: there the key is one more key
  # check_links passes through unread, and the site renders as it always did.
  # @param value [Object] a `links` field value
  # @param config [Object] site.yml's `link_access` value
  # @param prefix [String] "x/index.md:9: `resources", completed with "[0].access`"
  # @return [Array<String>] failures
  def self.links_access_failures(value, config, prefix)
    return [] if config.nil?

    Array(value).each_with_index.filter_map do |item, index|
      next unless item.is_a?(Hash) && item.key?("access")

      item_access_failure(item["access"], config, "#{prefix}[#{index}].access`")
    end
  end

  # Every link an entry offers a reader, with the item's own `access` if any:
  # each non-blank `url` field and each `links` item.
  # @param data [Hash] front matter
  # @param fields [Array<Hash>] schema fields
  # @return [Array(String, Object)] [url, access] pairs
  def self.entry_links(data, fields)
    fields.flat_map do |field|
      value = data[field["key"].to_s]
      case field["type"].to_s
      when "url"
        value.to_s.strip.empty? ? [] : [[value.to_s.strip, nil]]
      when "links"
        next [] unless value.is_a?(Array)

        value.filter_map do |item|
          if item.is_a?(String)
            [item.strip, nil] unless item.strip.empty?
          elsif item.is_a?(Hash) && !item["url"].to_s.strip.empty?
            [item["url"].to_s.strip, item["access"]]
          end
        end
      else
        []
      end
    end
  end

  # True when the entry has links and every one of them resolves to an access
  # level: a reader outside the organization could open none of them.
  # @param config [Object] site.yml's `link_access` value
  # @param links [Array(String, Object)] from #entry_links
  # @return [Boolean]
  def self.no_public_link?(config, links)
    return false if links.empty? || !config.is_a?(Hash)

    links.all? do |url, access|
      meta = CatalogTemplate::LinkAccess.resolve(config, url, access)
      meta && !meta["access"].empty?
    end
  end

  # `access:` on _data/resources.yml items must name a level too — once the site
  # has a `link_access` block (see #links_access_failures).
  # @param root [String] repository root
  # @param config [Object] site.yml's `link_access` value
  # @return [Array<String>] failures
  def self.resources_failures(root, config)
    return [] if config.nil?

    path = File.join(root, "_data", "resources.yml")
    return [] unless File.file?(path)

    groups = YAML.safe_load(File.read(path), permitted_classes: [Date, Time], aliases: true)
    return [] unless groups.is_a?(Array)

    groups.each_with_index.flat_map do |group, group_index|
      next [] unless group.is_a?(Hash) && group["items"].is_a?(Array)

      group["items"].each_with_index.filter_map do |item, item_index|
        next unless item.is_a?(Hash) && item.key?("access")

        item_access_failure(item["access"], config, "_data/resources.yml: group #{group_index + 1} (#{group['group'].to_s.inspect}) item #{item_index + 1} `access`")
      end
    end
  rescue Psych::SyntaxError
    [] # validate.mjs reports unparseable YAML in _data/ on its own
  end
end
