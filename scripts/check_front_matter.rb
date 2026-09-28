#!/usr/bin/env ruby
# frozen_string_literal: true

# Validates catalog entry front matter against _data/schema.yml, plus a light
# structural check of cohort event pages. Ruby stdlib only so it can run on a
# bare `ruby/setup-ruby` runner without `bundle install`.
#
# Run directly (`ruby scripts/check_front_matter.rb`) or require it and call
# FrontMatterCheck.run — test/scripts/check_front_matter_test.rb does the latter.
#
# Invoked by: `npm run validate` (scripts/validate.mjs) and directly as a step
# in .github/workflows/smoke.yml and .github/workflows/validate.yml. No env
# vars; inputs are `_data/schema.yml`, the optional `link_access` block of
# `_data/site.yml` (with `_data/resources.yml`'s `access:` values, checked
# against it by scripts/lib/link_access_check.rb), plus every
# `<entry path>/*/index.md` and `cohorts/*/events/*/index.md` under the repo root. Output: warnings/failures
# to stderr, "Front matter validation passed." to stdout, exit 1 on failure.

require "yaml"
require "date"
require_relative "lib/link_access_check"

# Schema-driven front matter validation for catalog entries and cohort events.
module FrontMatterCheck
  DEFAULT_ROOT = File.expand_path("..", __dir__)

  module_function

  # Repository root every path is reported relative to (overridable in tests).
  # @return [String]
  def root
    @root ||= DEFAULT_ROOT
  end

  # @param value [String]
  def root=(value)
    @root = File.expand_path(value)
  end

  # Parse YAML with the same restrictions Jekyll's safe loader applies.
  # @param text [String]
  # @param source [String] path used in the error message
  # @param aliases [Boolean] allow YAML anchors/aliases, as Jekyll does for _data files
  # @return [Hash]
  def load_yaml(text, source, aliases: false)
    YAML.safe_load(text, permitted_classes: [Date, Time], permitted_symbols: [], aliases: aliases) || {}
  rescue Psych::SyntaxError => e
    raise "#{source} has invalid YAML: #{e.message}"
  end

  # Split "---\nfront matter\n---\nbody" into [hash, body, front_matter_text].
  # @param path [String]
  # @return [Array(Hash, String, String)]
  def split_document(path)
    content = File.read(path)
    match = content.match(/\A---\s*\n(.*?)\n---\s*(?:\n(.*))?\z/m)
    raise "#{path} is missing YAML front matter" unless match

    parsed = load_yaml(match[1], path)
    raise "#{path}: front matter must be a mapping of keys to values, got #{parsed.class}" unless parsed.is_a?(Hash)

    [parsed, (match[2] || ""), match[1]]
  end

  # @param value [Object]
  # @return [Boolean] true for nil, an empty array/hash, or whitespace-only text
  def blank?(value)
    return true if value.nil?
    return value.empty? if value.is_a?(Array) || value.is_a?(Hash)

    value.to_s.strip.empty?
  end

  # @param value [Object]
  # @return [Boolean] true when the value parses as an ISO-8601 date
  def date?(value)
    return true if value.is_a?(Date) || value.is_a?(Time)

    Date.iso8601(value.to_s)
    true
  rescue ArgumentError, Date::Error, TypeError
    false
  end

  # 1-based line of `key:` inside the file (front matter starts on line 2), or
  # nil when the key is absent. Gives errors a "file:12" style anchor.
  # @param front_matter [String]
  # @param key [String]
  # @return [Integer, nil]
  def line_of(front_matter, key)
    index = front_matter.to_s.lines.index { |line| line.start_with?("#{key}:") }
    index && index + 2
  end

  # "catalog/x/index.md:7" when the key is present, "catalog/x/index.md" otherwise.
  # @param rel [String] file path, relative to `root`
  # @param front_matter [String]
  # @param key [String]
  # @return [String]
  def where(rel, front_matter, key)
    line = line_of(front_matter, key)
    line ? "#{rel}:#{line}" : rel
  end

  # @param value [Object]
  # @return [Boolean] true for http:// or https:// URLs
  #
  # These values are printed into `href`/`src` attributes, so a quote, angle
  # bracket or space would break out of the attribute. Reject them here rather
  # than relying on every template to escape.
  def http_url?(value)
    value.to_s.match?(%r{\Ahttps?://[^\s"'<>]+\z})
  end

  # Normalise an `images` item to {"src" =>, "alt" =>}; nil when unusable.
  # @param item [Object]
  # @return [Hash, nil]
  def image_item(item)
    return { "src" => item.to_s, "alt" => "" } if item.is_a?(String)
    return { "src" => item["src"].to_s, "alt" => item["alt"].to_s } if item.is_a?(Hash)

    nil
  end

  # Validate one `images` field value.
  # @param value [Object] the front matter value
  # @param ctx [Hash] {rel:, entry_dir:, key:, where:}
  # @param failures [Array<String>]
  # @param warnings [Array<String>]
  def check_images(value, ctx, failures, warnings)
    unless value.is_a?(Array)
      failures << "#{ctx[:where]}: `#{ctx[:key]}` must be a YAML list of images (a string src, or `{src, alt}`)"
      return
    end

    value.each_with_index do |raw, index|
      item = image_item(raw)
      if item.nil?
        failures << "#{ctx[:where]}: `#{ctx[:key]}[#{index}]` must be a string or a `{src, alt}` mapping, got #{raw.class}"
        next
      end

      src = item["src"].strip
      if src.empty?
        failures << "#{ctx[:where]}: `#{ctx[:key]}[#{index}]` has no `src`"
        next
      end

      if http_url?(src)
        warnings << "#{ctx[:where]}: `#{ctx[:key]}[#{index}]` points at a remote host (#{src}) — copy the file into the entry folder so the page keeps working"
      elsif src.start_with?("/")
        # Site-absolute paths resolve from the repository root; the file must be
        # inside this entry's folder so it travels with the entry.
        disk = File.join(root, src.delete_prefix("/"))
        if !File.file?(disk)
          failures << "#{ctx[:where]}: `#{ctx[:key]}[#{index}]` points at #{src}, which does not exist"
        elsif !File.expand_path(disk).start_with?("#{File.expand_path(ctx[:entry_dir])}/")
          failures << "#{ctx[:where]}: `#{ctx[:key]}[#{index}]` points outside the entry folder (#{src})"
        end
      else
        disk = File.join(ctx[:entry_dir], src)
        failures << "#{ctx[:where]}: `#{ctx[:key]}[#{index}]` points at #{src}, which does not exist in the entry folder" unless File.file?(disk)
      end

      warnings << "#{ctx[:where]}: `#{ctx[:key]}[#{index}]` has no `alt` text — screen readers will announce a fallback" if item["alt"].strip.empty?
    end
  end

  # Warn when a `file` field points at a path that is not in the repository.
  # @param value [Object] the front matter value (a site-absolute or entry-relative path)
  # @param ctx [Hash] {entry_dir:, key:, where:}
  # @param warnings [Array<String>]
  def check_file_path(value, ctx, warnings)
    path = value.to_s.strip
    return if path.empty? || http_url?(path)

    disk = path.start_with?("/") ? File.join(root, path.delete_prefix("/")) : File.join(ctx[:entry_dir], path)
    return if File.file?(disk)

    warnings << "#{ctx[:where]}: `#{ctx[:key]}` points at #{path}, which is not in the repository yet — " \
                "add the file or clear the field before merging"
  end

  # Validate one `links` field value.
  #
  # An item is `{label, url}`, both required, and may also carry `email` (a
  # contact address for that link) and `note` (one sentence about it). Both are
  # optional, so an item written before they existed still validates; only their
  # shape is checked, never their presence. Any further key is passed through
  # untouched, which is the posture everywhere else in this file — nothing here
  # rejects a mapping for carrying a key it does not read.
  #
  # @param value [Object]
  # @param ctx [Hash] {key:, where:}
  # @param failures [Array<String>]
  def check_links(value, ctx, failures)
    unless value.is_a?(Array)
      failures << "#{ctx[:where]}: `#{ctx[:key]}` must be a YAML list of links (`{label, url}`)"
      return
    end

    value.each_with_index do |raw, index|
      if raw.is_a?(String)
        failures << "#{ctx[:where]}: `#{ctx[:key]}[#{index}]` is not a URL (#{raw.inspect}); use `{label, url}`" unless http_url?(raw) || raw.start_with?("mailto:")
        next
      end
      unless raw.is_a?(Hash)
        failures << "#{ctx[:where]}: `#{ctx[:key]}[#{index}]` must be a `{label, url}` mapping, got #{raw.class}"
        next
      end

      url = raw["url"].to_s.strip
      failures << "#{ctx[:where]}: `#{ctx[:key]}[#{index}]` has no `label`" if raw["label"].to_s.strip.empty?
      if url.empty?
        failures << "#{ctx[:where]}: `#{ctx[:key]}[#{index}]` has no `url`"
      elsif !http_url?(url) && !url.start_with?("mailto:")
        failures << "#{ctx[:where]}: `#{ctx[:key]}[#{index}]` must be an http(s) or mailto: URL (got #{url.inspect})"
      end

      # The same test an `email` FIELD gets: an address is published as a
      # mailto link, and "@" is what separates one from a name someone typed.
      email = raw["email"].to_s.strip
      unless email.empty? || email.include?("@")
        failures << "#{ctx[:where]}: `#{ctx[:key]}[#{index}].email` does not look like an email address (#{email.inspect})"
      end
      unless raw["note"].nil? || raw["note"].is_a?(String)
        failures << "#{ctx[:where]}: `#{ctx[:key]}[#{index}].note` must be text, got #{raw['note'].class}"
      end
    end
  end

  # Does the entry give a reader anywhere to go — a `url` field with a value,
  # or a `links` field with at least one item? The minimum documentation bar:
  # a resource nobody can reach cannot be evaluated or adopted.
  # @param data [Hash] front matter
  # @param fields [Array<Hash>] schema fields
  # @return [Boolean]
  def linked?(data, fields)
    fields.any? do |field|
      value = data[field["key"].to_s]
      case field["type"].to_s
      when "url" then !blank?(value)
      when "links" then value.is_a?(Array) && value.any? { |item| item.is_a?(Hash) && !blank?(item["url"]) }
      else false
      end
    end
  end

  # Validate a single entry file.
  # @param file [String] absolute path to <entry path>/<slug>/index.md
  # @param fields [Array<Hash>] schema fields
  # @param entry [Hash] the schema's `entry` block (`require_link` and `require_public_link` are read here)
  # @param slugs [Array<String>] every entry folder name, for `links_entries` fields
  # @param link_access [Hash, nil] site.yml's `link_access` block, for `access:` values and the public-link check
  # @return [Array(Array<String>, Array<String>)] failures and warnings
  def validate_entry(file, fields, entry = {}, slugs = [], link_access = nil)
    failures = []
    warnings = []
    rel = file.delete_prefix("#{root}/")
    folder = File.basename(File.dirname(file))
    entry_dir = File.dirname(file)

    begin
      data, body, front_matter = split_document(file)
    rescue StandardError => e
      return [[e.message], warnings]
    end

    # `summary` is a schema field and is checked by the field loop below; only
    # the two keys the site itself relies on are hardcoded here.
    %w[title slug].each do |key|
      failures << "#{where(rel, front_matter, key)}: `#{key}` is missing or empty" if blank?(data[key])
    end

    # Entry bodies are markdown a submitter wrote. Without this flag Jekyll runs
    # them through Liquid at build time, so a `{% include %}` in a write-up
    # would execute. The scaffolder emits it; hand-written entries must too.
    unless data["render_with_liquid"] == false
      failures << "#{where(rel, front_matter, 'render_with_liquid')}: add `render_with_liquid: false` so the page body is not run through Liquid"
    end

    if data["slug"].to_s != folder
      failures << "#{where(rel, front_matter, 'slug')}: `slug` is #{data['slug'].inspect} but the folder is #{folder.inspect}"
    end
    unless date?(data["published"])
      failures << "#{where(rel, front_matter, 'published')}: `published` (#{data['published'].inspect}) is not a YYYY-MM-DD date"
    end
    # `updated` and `verified` are both optional reserved date keys. `verified`
    # is stronger than `updated` — a maintainer re-checked the facts with the
    # contact, rather than someone fixing a typo — and the entry page and the
    # monthly sweep both measure staleness from whichever is newer, so a
    # malformed one silently reads as absent. Catch it here instead.
    %w[updated verified].each do |key|
      next unless data.key?(key)
      next if blank?(data[key])
      next if date?(data[key])

      failures << "#{where(rel, front_matter, key)}: `#{key}` (#{data[key].inspect}) is not a YYYY-MM-DD date"
    end

    # The submitter's GitHub username, when the schema names the field holding
    # it (`entry.submitter_key`) and this entry filled it in. A warning, never a
    # failure: all a malformed handle costs is the @mention on a refresh
    # reminder a year from now, and refusing to publish an entry over a pasted
    # profile URL would be out of all proportion. A leading `@` is fine — people
    # type it — so it is stripped before the shape is checked.
    submitter_key = entry["submitter_key"].to_s
    unless submitter_key.empty? || blank?(data[submitter_key])
      handle = data[submitter_key].to_s.strip.sub(/\A@+/, "")
      unless handle.match?(/\A[A-Za-z0-9-]{1,39}\z/)
        warnings << "#{where(rel, front_matter, submitter_key)}: `#{submitter_key}` (#{data[submitter_key].inspect}) " \
                    "does not look like a GitHub username, so the refresh reminder will not be able to mention them — " \
                    "use the username alone (`jordan-lee`), not an email address or a profile URL"
      end
    end

    # Named once, outside the type switch below, so the switch keeps branching
    # on field types and nothing else (test/configurator/schema-parity.test.mjs).
    entry_path = (entry["path"] || "catalog").to_s

    fields.each do |field|
      key = field["key"].to_s
      type = field["type"].to_s
      value = data[key]
      spot = where(rel, front_matter, key)

      if type == "markdown"
        failures << "#{rel}: the page body is empty but `#{key}` (#{field['label']}) is required" if field["required"] && body.strip.empty?
        next
      end

      if field["required"] && blank?(value)
        failures << "#{spot}: `#{key}` (#{field['label']}) is required but missing or empty"
      end

      options = Array(field["options"]).map(&:to_s)

      case type
      when "select"
        unless blank?(value) || options.empty? || options.include?(value.to_s)
          failures << "#{spot}: `#{key}` value #{value.inspect} is not one of the allowed options (#{options.join(', ')})"
        end
      when "multiselect", "list"
        if !value.nil? && !value.is_a?(Array)
          failures << "#{spot}: `#{key}` must be a YAML list"
        elsif type == "multiselect" && value.is_a?(Array) && !options.empty?
          extra = value.map(&:to_s) - options
          failures << "#{spot}: `#{key}` has values outside the allowed options: #{extra.join(', ')}" if extra.any?
        elsif type == "list" && field["links_entries"] && value.is_a?(Array)
          # A `links_entries` value is a slug, and the entry page renders a slug
          # it cannot resolve as plain text rather than a dead link — which is
          # exactly why the typo has to be caught here instead.
          value.map(&:to_s).reject { |slug| slugs.include?(slug) }.each do |slug|
            failures << "#{spot}: `#{key}` names #{slug.inspect}, which is not an entry — expected #{entry_path}/#{slug}/index.md"
          end
        end
      when "images"
        check_images(value, { rel: rel, entry_dir: entry_dir, key: key, where: spot }, failures, warnings) unless value.nil?
      when "links"
        check_links(value, { key: key, where: spot }, failures) unless value.nil?
        failures.concat(LinkAccessCheck.links_access_failures(value, link_access, "#{spot}: `#{key}")) unless value.nil?
      when "url"
        unless blank?(value) || http_url?(value)
          failures << "#{spot}: `#{key}` must start with http:// or https:// (got #{value.inspect})"
        end
      when "email"
        unless blank?(value) || value.to_s.include?("@")
          failures << "#{spot}: `#{key}` does not look like an email address (#{value.inspect})"
        end
      when "file"
        # A warning, never a failure: the scaffolder writes the attachment path
        # from the issue before the file itself has been committed, so a
        # generated pull request legitimately arrives with a dangling path. The
        # reviewer is the one who has to notice it, which is exactly what a line
        # in the validate output is for.
        check_file_path(value, { entry_dir: entry_dir, key: key, where: spot }, warnings) unless blank?(value)
      end
    end

    # The minimum documentation bar. A warning by default; `entry.require_link:
    # true` in the schema makes it a failure. Only checked when the schema has
    # somewhere a link could go, so a preset with no url/links fields is silent.
    linkable = fields.any? { |field| %w[url links].include?(field["type"].to_s) }
    if linkable && !linked?(data, fields)
      message = "#{rel}: no link anywhere — every `url` field is empty and no `links` field has an item; " \
                "a reader has nowhere to go to evaluate or adopt this"
      if entry["require_link"] == true
        failures << message
      else
        warnings << message
      end
    end

    # The same bar for a reader outside the organization: when site.yml
    # `link_access` labels every link this entry has (a members-only host, an
    # item's own `access:`), nobody without a sign-in can open any of it. A
    # warning by default; `entry.require_public_link: true` makes it a failure.
    if LinkAccessCheck.no_public_link?(link_access, LinkAccessCheck.entry_links(data, fields))
      message = "#{rel}: no public link — every link on this entry needs access a reader outside the organization " \
                "may not have (site.yml `link_access`); add one that opens for anyone, such as a public share link"
      if entry["require_public_link"] == true
        failures << message
      else
        warnings << message
      end
    end

    [failures, warnings]
  end

  # Schema-level checks that do not depend on any one entry: an `escalate_on`
  # list must name values the field can actually hold, or the scaffolder's
  # closer-review flag can never fire and nobody notices; `links_entries` only
  # means anything on a list of slugs.
  # @param fields [Array<Hash>] schema fields
  # @return [Array<String>] failures
  def validate_schema(fields)
    failures = []
    fields.each do |field|
      if field["links_entries"] && field["type"].to_s != "list"
        failures << "_data/schema.yml: `#{field['key']}.links_entries` is only valid on a `list` field " \
                    "(`#{field['key']}` is #{field['type'].inspect})"
      end

      next unless field.key?("escalate_on")

      key = field["key"].to_s
      list = field["escalate_on"]
      unless list.is_a?(Array) && !list.empty?
        failures << "_data/schema.yml: `#{key}.escalate_on` must be a non-empty YAML list"
        next
      end
      options = Array(field["options"]).map(&:to_s)
      case field["type"].to_s
      when "select", "multiselect"
        extra = list.map(&:to_s) - options
        failures << "_data/schema.yml: `#{key}.escalate_on` names values that are not options: #{extra.join(', ')}" if extra.any?
      when "boolean"
        bad = list.reject { |v| [true, false].include?(v) }
        failures << "_data/schema.yml: `#{key}.escalate_on` on a boolean field must be true or false" if bad.any?
      end
    end
    failures
  end

  # Structural check for cohort event pages.
  # @param file [String]
  # @return [Array<String>] failures
  def validate_event(file)
    rel = file.delete_prefix("#{root}/")
    begin
      data, = split_document(file)
    rescue StandardError => e
      return [e.message]
    end

    %w[title cohort event_id].filter_map do |key|
      "#{rel}: `#{key}` is missing or empty" if blank?(data[key])
    end
  end

  # Validate every entry and cohort event under `root`.
  # @param root [String] repository root
  # @return [Array(Array<String>, Array<String>)] failures and warnings
  def run(dir = root)
    self.root = dir
    schema_path = File.join(root, "_data", "schema.yml")
    raise "Missing _data/schema.yml; cannot validate entries." unless File.exist?(schema_path)

    schema = load_yaml(File.read(schema_path), "_data/schema.yml")
    fields = Array(schema["fields"])
    entry = schema["entry"].is_a?(Hash) ? schema["entry"] : {}
    entry_path = (entry["path"] || "catalog").to_s

    failures = validate_schema(fields)
    warnings = []

    # The optional `link_access` block: its own shape, then the `access:` values
    # in _data/resources.yml that point into it. Entries are checked below.
    site_path = File.join(root, "_data", "site.yml")
    site = File.exist?(site_path) ? load_yaml(File.read(site_path), "_data/site.yml", aliases: true) : {}
    link_access = site.is_a?(Hash) ? site["link_access"] : nil
    failures.concat(LinkAccessCheck.config_failures(link_access, LinkAccessCheck.icon_names(root)))
    failures.concat(LinkAccessCheck.resources_failures(root, link_access))

    entry_files = Dir.glob(File.join(root, entry_path, "*", "index.md")).sort
    # Every entry folder name, so a `links_entries` field can be checked against
    # the entries that exist rather than against a second list someone maintains.
    slugs = entry_files.map { |file| File.basename(File.dirname(file)) }

    entry_files.each do |file|
      entry_failures, entry_warnings = validate_entry(file, fields, entry, slugs, link_access)
      failures.concat(entry_failures)
      warnings.concat(entry_warnings)
    end

    Dir.glob(File.join(root, "cohorts", "*", "events", "*", "index.md")).sort.each do |file|
      failures.concat(validate_event(file))
    end

    [failures, warnings]
  end
end

if $PROGRAM_NAME == __FILE__
  begin
    failures, warnings = FrontMatterCheck.run
  rescue StandardError => e
    warn e.message
    exit 1
  end

  warnings.each { |warning| warn "Warning: #{warning}" }

  if failures.any?
    warn "Front matter validation failed:"
    failures.each { |failure| warn "  - #{failure}" }
    exit 1
  end

  puts "Front matter validation passed."
end
