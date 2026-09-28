# frozen_string_literal: true

# Liquid filters used to turn _data/theme.yml into CSS custom properties and to
# help layouts render schema-driven content.
#
# Registered globally via `Liquid::Template.register_filter` below, so every
# layout/include can call these as Liquid filters from the moment Jekyll
# starts rendering templates at build time. Input: whatever value/args Liquid
# passes in (theme hex colors, field values, URLs). Output: plain strings
# Liquid can print directly into CSS/HTML attributes.
module CatalogTemplate
  module ThemeFilters
    # "#1D4E89" -> "29 78 137" (RGB channel triple for `rgb(var(--x) / alpha)`).
    # @param hex [String] a 3- or 6-digit hex color, with or without leading "#"
    # @return [String] "R G B" channel triple, or "0 0 0" when unparsable
    # @example
    #   :root { --brand: {{ site.data.theme.colors.brand | hex_to_rgb }}; }
    def hex_to_rgb(hex)
      value = hex.to_s.strip.delete_prefix("#")
      value = value.chars.map { |c| c * 2 }.join if value.length == 3
      return "0 0 0" unless value.match?(/\A\h{6}\z/)

      value.scan(/../).map { |pair| pair.to_i(16) }.join(" ")
    end

    # Turn a schema field value into a comma-separated list of slugs for
    # data-facet-* attributes. Accepts strings, arrays, or nil.
    # @param value [Object] a scalar, array, or nil field value
    # @return [String] comma-separated slugs, "" when the value is empty
    # @example
    #   <div data-facet-status="{{ entry.status | facet_values }}">
    def facet_values(value)
      Array(value).flatten.compact.map(&:to_s).reject { |v| v.strip.empty? }.map { |v| Jekyll::Utils.slugify(v) }.join(",")
    end

    # Alias so templates read naturally.
    # @param value [Object] a scalar, array, or nil field value
    # @return [Array<String>] slugified values
    # @example
    #   {% for slug in entry.tags | slugify_list %}
    def slugify_list(value)
      Array(value).flatten.compact.map(&:to_s).reject { |v| v.strip.empty? }.map { |v| Jekyll::Utils.slugify(v) }
    end

    # Human-readable label for a URL host: "github.com" -> "GitHub"
    # @param url [String] an http(s) URL
    # @return [String] the host with a leading "www." stripped, "" when unparsable
    # @example
    #   {{ link.url | link_host }}
    def link_host(url)
      host = URI.parse(url.to_s).host.to_s.sub(/\Awww\./, "")
      return "" if host.empty?

      host
    rescue URI::InvalidURIError
      ""
    end

    # True for an http(s) URL — the same test scripts/check_front_matter.rb's
    # `http_url?` applies, so a value the validator accepts as a link is the
    # value a template renders as one. A `file` field holds either a path in
    # the repository or such a URL (a file too big for GitHub, or kept in a
    # shared workspace), and this is how a template tells the two apart.
    # @param value [String]
    # @return [Boolean]
    # @example
    #   {% assign is_link = entry.deck_pdf | http_url %}{% if is_link %}…{% endif %}
    def http_url(value)
      value.to_s.match?(%r{\Ahttps?://[^\s"'<>]+\z})
    end

    # Who can open a link, from the optional `link_access` block of
    # _data/site.yml: the first host rule the URL matches, merged with the
    # access level it names (see _plugins/link_access.rb). nil when the site has
    # no `link_access` block, or when no rule and no level applies — which is
    # how a site without the block renders exactly as it did before it existed.
    # @param url [String] an http(s) URL
    # @param access [String, nil] the link item's own `access:`, overriding its host rule
    # @return [Hash, nil] name, access, label, icon, note, request_url, download
    # @example
    #   {% assign meta = link.url | link_access: link.access %}
    def link_access(url, access = nil)
      site = @context.registers[:site]
      return nil unless site

      site_data = site.data["site"]
      return nil unless site_data.is_a?(Hash)

      CatalogTemplate::LinkAccess.resolve(site_data["link_access"], url, access)
    end

    # Encode a string for use in a URL query component (Liquid's url_encode
    # turns spaces into +, which GitHub does not decode inside issue form fields).
    # @param value [String]
    # @return [String] percent-encoded string
    # @example
    #   href="https://github.com/.../issues/new?title={{ entry.title | query_encode }}"
    def query_encode(value)
      ERB::Util.url_encode(value.to_s)
    end

    # True when `path` is a file Jekyll is copying into the site (a screenshot,
    # a deck, a generated thumbnail). Replaces `site.static_files | where:
    # 'path', x | size > 0`, which allocates and scans the whole static-file
    # array on every call — that pattern ran 1,872 times in a 260-entry build.
    # The path set is built once per site and cached on the site object.
    # @param path [String] site-relative path, with or without a leading "/"
    # @return [Boolean]
    # @example
    #   {% assign found = entry.deck_pdf | static_file %}{% if found %}…{% endif %}
    #   (no trailing "?" in the name: Liquid's lax variable parser matches a
    #   filter name with /\w+/, so `static_file?` silently resolves to no filter
    #   at all and passes the path straight through as a truthy string. Liquid's
    #   `if` tag takes no filters either, hence the `assign` first.)
    def static_file(path)
      site = @context.registers[:site]
      return false unless site

      paths = site.instance_variable_get(:@_catalog_static_paths)
      unless paths
        paths = Set.new(site.static_files.map(&:relative_path))
        site.instance_variable_set(:@_catalog_static_paths, paths)
      end
      value = path.to_s
      return false if value.empty?

      paths.include?(value.start_with?("/") ? value : "/#{value}")
    end

    # Every distinct value of one field across a set of entries, case-insensitively
    # sorted. Replaces building the same list with `assign x = x | push: v` inside
    # a loop, which copies the whole array on every iteration.
    # @param entries [Array] entry pages (Liquid drops) or plain hashes
    # @param key [String] schema field key
    # @return [Array<String>] unique, non-blank values
    # @example
    #   {% assign options = entries | facet_options: field.key %}
    def facet_options(entries, key)
      key = key.to_s
      Array(entries).flat_map { |entry| Array(entry[key]).flatten }
                    .compact.map { |value| value.to_s.strip }.reject(&:empty?)
                    .uniq.sort_by(&:downcase)
    end
  end
end

require "erb"
require "set"
require_relative "link_access"
Liquid::Template.register_filter(CatalogTemplate::ThemeFilters)
