# frozen_string_literal: true

# Unit tests for _plugins/theme_filters.rb's Liquid filters.
#
#   npm run test:ruby     (or: ruby -Itest test/plugins/theme_filters_test.rb)
#
# `jekyll` (for Jekyll::Utils.slugify) and `liquid` (register_filter target)
# must be loaded before the plugin file. The filters are plain instance
# methods on `CatalogTemplate::ThemeFilters`, exercised here via a throwaway
# host class rather than a full Liquid template/context.

require "minitest/autorun"
require "jekyll"
require "liquid"

require_relative "../../_plugins/theme_filters"

class ThemeFiltersHost
  include CatalogTemplate::ThemeFilters
end

class ThemeFiltersTest < Minitest::Test
  def setup
    @filters = ThemeFiltersHost.new
  end

  # -- hex_to_rgb ---------------------------------------------------------

  def test_hex_to_rgb_converts_six_digit_hex
    assert_equal "29 78 137", @filters.hex_to_rgb("#1D4E89")
  end

  def test_hex_to_rgb_accepts_missing_leading_hash
    assert_equal "29 78 137", @filters.hex_to_rgb("1D4E89")
  end

  def test_hex_to_rgb_expands_three_digit_shorthand
    assert_equal "255 0 0", @filters.hex_to_rgb("#f00")
  end

  def test_hex_to_rgb_falls_back_to_black_for_unparsable_input
    assert_equal "0 0 0", @filters.hex_to_rgb("not-a-color")
    assert_equal "0 0 0", @filters.hex_to_rgb(nil)
    assert_equal "0 0 0", @filters.hex_to_rgb("")
  end

  # -- facet_values / slugify_list -----------------------------------------

  def test_facet_values_joins_slugified_values_with_commas
    assert_equal "in-production,pilot", @filters.facet_values(["In production", "Pilot"])
  end

  def test_facet_values_handles_scalar_and_blank_entries
    assert_equal "public-facing", @filters.facet_values("Public-facing")
    assert_equal "", @filters.facet_values(nil)
    assert_equal "", @filters.facet_values([])
    assert_equal "a", @filters.facet_values(["a", "", nil, "  "])
  end

  def test_slugify_list_returns_an_array_not_a_joined_string
    assert_equal %w[in-production pilot], @filters.slugify_list(["In production", "Pilot"])
    assert_equal [], @filters.slugify_list(nil)
  end

  # -- link_host -------------------------------------------------------------

  def test_link_host_strips_leading_www
    assert_equal "github.com", @filters.link_host("https://www.github.com/org/repo")
  end

  def test_link_host_keeps_non_www_host_as_is
    assert_equal "example.org", @filters.link_host("https://example.org/docs")
  end

  def test_link_host_returns_empty_string_for_unparsable_or_hostless_url
    assert_equal "", @filters.link_host("not a url")
    assert_equal "", @filters.link_host(nil)
    assert_equal "", @filters.link_host("mailto:person@example.org")
  end

  # -- http_url ---------------------------------------------------------------

  def test_http_url_accepts_http_and_https_urls
    assert_equal true, @filters.http_url("https://example.org/deck.pdf")
    assert_equal true, @filters.http_url("http://example.org/")
  end

  def test_http_url_rejects_paths_other_schemes_and_attribute_breaking_characters
    assert_equal false, @filters.http_url("/catalog/a/deck.pdf")
    assert_equal false, @filters.http_url("ftp://example.org/deck.pdf")
    assert_equal false, @filters.http_url("xhttp://example.org/")
    assert_equal false, @filters.http_url("https://example.org/a\"onmouseover=\"x")
    assert_equal false, @filters.http_url("")
    assert_equal false, @filters.http_url(nil)
  end

  # -- query_encode ------------------------------------------------------------

  def test_query_encode_percent_encodes_spaces_not_plus
    assert_equal "a%20b", @filters.query_encode("a b")
  end

  def test_query_encode_escapes_reserved_query_characters
    assert_equal "a%26b%3Dc", @filters.query_encode("a&b=c")
  end

  def test_query_encode_is_nil_safe
    assert_equal "", @filters.query_encode(nil)
  end

  # -- facet_options -----------------------------------------------------------

  def test_facet_options_collects_unique_values_case_insensitively_sorted
    entries = [
      { "area" => ["Outreach", "Translation"] },
      { "area" => "Translation" },
      { "area" => ["benefits"] }
    ]
    # Sorted on the downcased value, so "benefits" leads rather than trailing
    # the capitalized ones as a plain `sort` would put it.
    assert_equal %w[benefits Outreach Translation], @filters.facet_options(entries, "area")
  end

  def test_facet_options_drops_blanks_and_missing_values
    entries = [{ "area" => ["A", "", nil, "  "] }, { "other" => "B" }, {}]
    assert_equal ["A"], @filters.facet_options(entries, "area")
  end

  def test_facet_options_is_nil_safe
    assert_equal [], @filters.facet_options(nil, "area")
  end

  # -- static_file -------------------------------------------------------------

  # static_file reads the site off the Liquid context, so it needs a real one.
  # @param paths [Array<String>] relative_path of each static file in the site
  # @param value [String] the path to test
  # @return [Object] the filter's return value
  def static_file(paths, value)
    site = Struct.new(:static_files).new(paths.map { |path| Struct.new(:relative_path).new(path) })
    host = ThemeFiltersHost.new
    host.instance_variable_set(:@context, Liquid::Context.new({}, {}, { site: site }))
    host.static_file(value)
  end

  def test_static_file_finds_a_file_jekyll_is_copying
    assert_equal true, static_file(["/catalog/a/deck.pdf"], "/catalog/a/deck.pdf")
  end

  def test_static_file_accepts_a_path_without_a_leading_slash
    assert_equal true, static_file(["/catalog/a/deck.pdf"], "catalog/a/deck.pdf")
  end

  def test_static_file_is_false_for_a_missing_file_or_a_blank_path
    assert_equal false, static_file(["/catalog/a/deck.pdf"], "/catalog/a/other.pdf")
    assert_equal false, static_file(["/catalog/a/deck.pdf"], "")
    assert_equal false, static_file(["/catalog/a/deck.pdf"], nil)
  end

  def test_static_file_scans_the_site_only_once
    site = Struct.new(:static_files).new([Struct.new(:relative_path).new("/a.pdf")])
    host = ThemeFiltersHost.new
    host.instance_variable_set(:@context, Liquid::Context.new({}, {}, { site: site }))
    host.static_file("/a.pdf")
    # The cache, not the site, answers from here on — proven by emptying the site.
    site.static_files = []

    assert_equal true, host.static_file("/a.pdf")
  end

  def test_static_file_is_false_without_a_site_in_the_context
    host = ThemeFiltersHost.new
    host.instance_variable_set(:@context, Liquid::Context.new({}, {}, {}))

    assert_equal false, host.static_file("/a.pdf")
  end

  # -- link_access -------------------------------------------------------------

  LINK_ACCESS = {
    "levels" => {
      "members" => { "label" => "Members only", "icon" => "lock", "note" => "Sign-in required.",
                     "request_url" => "https://example.org/join" }
    },
    "hosts" => [
      { "match" => "files.example.org/p/", "name" => "Shared drive" },
      { "match" => "files.example.org", "name" => "Shared drive", "access" => "members" },
      { "match" => "github.com/org/repo/releases/download/", "name" => "File library", "download" => true }
    ]
  }.freeze

  # link_access reads `site.data.site.link_access` off the Liquid context.
  # @param config [Hash, nil] the link_access block, nil for a site without one
  # @return [ThemeFiltersHost]
  def link_access_host(config)
    data = { "site" => config.nil? ? {} : { "link_access" => config } }
    site = Struct.new(:data).new(data)
    host = ThemeFiltersHost.new
    host.instance_variable_set(:@context, Liquid::Context.new({}, {}, { site: site }))
    host
  end

  def test_link_access_is_nil_without_a_link_access_block
    assert_nil link_access_host(nil).link_access("https://files.example.org/x")
  end

  def test_link_access_is_nil_without_a_site_or_with_a_malformed_site_yml
    no_site = ThemeFiltersHost.new
    no_site.instance_variable_set(:@context, Liquid::Context.new)
    assert_nil no_site.link_access("https://files.example.org/x")

    # A site.yml that parsed to a list, not a mapping, has no link_access to read.
    list_site = ThemeFiltersHost.new
    site = Struct.new(:data).new({ "site" => ["link_access"] })
    list_site.instance_variable_set(:@context, Liquid::Context.new({}, {}, { site: site }))
    assert_nil list_site.link_access("https://files.example.org/x")
  end

  def test_link_access_merges_the_host_rule_with_its_level
    meta = link_access_host(LINK_ACCESS).link_access("https://files.example.org/projects/1")

    assert_equal "Shared drive", meta["name"]
    assert_equal "members", meta["access"]
    assert_equal "Members only", meta["label"]
    assert_equal "lock", meta["icon"]
    assert_equal "Sign-in required.", meta["note"]
    assert_equal "https://example.org/join", meta["request_url"]
    assert_equal false, meta["download"]
  end

  def test_link_access_matches_subdomains_but_not_lookalike_hosts
    host = link_access_host(LINK_ACCESS)

    assert_equal "members", host.link_access("https://eu.files.example.org/x")["access"]
    assert_equal "members", host.link_access("https://FILES.example.org/x")["access"]
    assert_nil host.link_access("https://notfiles.example.org/x")
    assert_nil host.link_access("https://files.example.org.evil.test/x")
  end

  def test_link_access_first_matching_rule_wins_so_a_path_rule_can_carve_out_a_public_link
    meta = link_access_host(LINK_ACCESS).link_access("https://files.example.org/p/abc123")

    assert_equal "Shared drive", meta["name"]
    assert_equal "", meta["access"], "the /p/ rule names no level, so the link is public"
    assert_equal "", meta["label"]
  end

  def test_link_access_path_prefix_must_match_from_the_start_of_the_path
    host = link_access_host(LINK_ACCESS)

    meta = host.link_access("https://github.com/org/repo/releases/download/files/big.zip")
    assert_equal "File library", meta["name"]
    assert_equal true, meta["download"]
    assert_nil host.link_access("https://github.com/org/repo/blob/main/releases/download/x")
    assert_nil host.link_access("https://github.com/other/org/repo/releases/download/x")
  end

  def test_link_access_item_level_access_overrides_the_host_rule
    host = link_access_host(LINK_ACCESS)

    # A carved-out public path marked members-only by the item itself.
    assert_equal "members", host.link_access("https://files.example.org/p/abc", "members")["access"]
    # An item on a host no rule covers still gets its level, with no rule name.
    meta = host.link_access("https://intranet.example.net/page", "members")
    assert_equal "", meta["name"]
    assert_equal "Members only", meta["label"]
  end

  def test_link_access_ignores_an_unknown_level_and_blank_override
    host = link_access_host(LINK_ACCESS)

    assert_nil host.link_access("https://example.net/x", "nobody")
    assert_equal "members", host.link_access("https://files.example.org/x", "")["access"]
    assert_equal "members", host.link_access("https://files.example.org/x", nil)["access"]
  end

  def test_link_access_is_nil_for_non_http_relative_or_unparsable_urls
    host = link_access_host(LINK_ACCESS)

    assert_nil host.link_access("/assets/files/agenda.pdf")
    assert_nil host.link_access("mailto:files.example.org")
    assert_nil host.link_access("not a url")
    assert_nil host.link_access(nil)
  end

  # A URL Ruby's strict parser rejects still opens in a browser, on the same
  # host, so it must keep its chip rather than read as public.
  def test_link_access_matches_urls_the_strict_parser_rejects
    host = link_access_host(LINK_ACCESS)

    [
      "https://files.example.org/Bericht-ü.pdf",
      "https://files.example.org/a|b",
      "https://files.example.org/{x}",
      "https://files.example.org./x",
      "https://files%2Eexample.org/x",
      "HTTPS://files.example.org/x",
      "https://files.example.org\\@evil.test/x" # a browser reads "\\" as "/": the host is files.example.org
    ].each do |url|
      assert_equal "members", host.link_access(url)&.fetch("access"), url
    end
  end

  # A browser removes dot segments before it requests the page, so a URL that
  # starts with a public carve-out's prefix and climbs out of it lands on the
  # gated path, and must be labelled as that path.
  def test_link_access_removes_dot_segments_before_the_path_prefix_test
    host = link_access_host(
      "levels" => { "members" => { "label" => "Members only" } },
      "hosts" => [
        { "match" => "docs.example.org/public/", "name" => "Docs" },
        { "match" => "docs.example.org", "name" => "Docs", "access" => "members" }
      ]
    )

    %w[
      https://docs.example.org/public/../secret
      https://docs.example.org/public/%2e%2e/secret
      https://docs.example.org/public/%2E%2E/secret
      https://docs.example.org/public/.%2e/secret
      https://docs.example.org/public/./../secret?x=1
      https://docs.example.org/public/a/../../secret#top
      https://docs.example.org/public/..
    ].each do |url|
      assert_equal "members", host.link_access(url)&.fetch("access"), url
    end
    %w[
      https://docs.example.org/public/./report.pdf
      https://docs.example.org/public/a/../report.pdf
      https://docs.example.org/public/..report.pdf
    ].each do |url|
      assert_equal "", host.link_access(url)&.fetch("access"), url
    end
  end

  def test_link_access_keeps_userinfo_port_and_lookalike_protections
    host = link_access_host(LINK_ACCESS)

    assert_nil host.link_access("https://files.example.org@evil.test/x")
    assert_nil host.link_access("https://files.example.org:pw@evil.test/files.example.org/x")
    assert_nil host.link_access("https://evil.test/files.example.org/x")
    assert_nil host.link_access("https://files.example.org.evil.test./x")
    assert_nil host.link_access("https://evil.test/?u=https://files.example.org/x")
    assert_nil host.link_access("https://files.example.org%C3%A9.test/x"), "a non-ASCII escape is not decoded into a match"
    assert_equal "members", host.link_access("https://someone@files.example.org/x")["access"]
    assert_equal "members", host.link_access("https://a@b@files.example.org/x")["access"]
    assert_equal "members", host.link_access("https://files.example.org:8443/x")["access"]
  end

  def test_link_access_tolerates_a_malformed_block
    assert_nil link_access_host({ "hosts" => "files.example.org" }).link_access("https://files.example.org/x")
    assert_nil link_access_host("yes").link_access("https://files.example.org/x")
    meta = link_access_host({ "hosts" => [nil, { "match" => "files.example.org", "access" => "members" }] })
           .link_access("https://files.example.org/x")
    assert_equal "", meta["access"], "a rule naming a level that is not configured labels nothing"
  end
end
