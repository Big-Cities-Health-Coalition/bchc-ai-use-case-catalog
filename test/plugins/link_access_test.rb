# frozen_string_literal: true

# Unit tests for _plugins/link_access.rb, the matcher behind the `link_access`
# Liquid filter and the validator's link_access checks.
#
#   npm run test:ruby     (or: ruby -Itest test/plugins/link_access_test.rb)
#
# theme_filters_test.rb covers the filter end to end; these pin the URL
# reading underneath it, where a wrong answer shows a members-only link as
# public.

require "minitest/autorun"

require_relative "../../_plugins/link_access"

class LinkAccessTest < Minitest::Test
  LA = CatalogTemplate::LinkAccess

  CONFIG = {
    "levels" => { "members" => { "label" => "Members only", "icon" => "lock" } },
    "hosts" => [
      { "match" => "files.example.org/p/", "name" => "Shared drive" },
      { "match" => "Files.Example.org", "name" => "Shared drive", "access" => "members" },
      { "match" => "github.com/org/repo/releases/download/", "download" => true }
    ]
  }.freeze

  # -- split_match ---------------------------------------------------------------

  def test_split_match_separates_a_lower_cased_host_from_a_case_kept_path_prefix
    assert_equal ["example.org", ""], LA.split_match("example.org")
    assert_equal ["example.org", "/P/"], LA.split_match("  Example.ORG/P/  ")
    assert_equal ["github.com", "/org/repo/releases/download/"], LA.split_match("github.com/org/repo/releases/download/")
    assert_equal ["", ""], LA.split_match(nil)
  end

  # -- remove_dot_segments -----------------------------------------------------------

  def test_remove_dot_segments_resolves_the_path_a_browser_requests
    {
      "" => "/",
      "/" => "/",
      "/a/b" => "/a/b",
      "/a/./b" => "/a/b",
      "/a/../b" => "/b",
      "/a/b/.." => "/a/",
      "/a/b/." => "/a/b/",
      "/../../x" => "/x",
      "/p/%2e%2e/secret" => "/secret",
      "/p/%2E./secret" => "/secret",
      "/p/.%2E/secret" => "/secret",
      "/p/%2e/x" => "/p/x",
      "/p/...x" => "/p/...x",
      "/p/..x/y" => "/p/..x/y",
      "/p/%2e%2e%2fsecret" => "/p/%2e%2e%2fsecret",
      "/a//b" => "/a//b"
    }.each do |path, expected|
      assert_equal expected, LA.remove_dot_segments(path), path.inspect
    end
  end

  # -- host_and_path -----------------------------------------------------------------

  def test_host_and_path_reads_the_host_and_path_a_browser_would
    {
      "https://files.example.org/x" => ["files.example.org", "/x"],
      "https://files.example.org" => ["files.example.org", "/"],
      "https://files.example.org?q=1#f" => ["files.example.org", "/"],
      "HTTP://FILES.Example.ORG/Case/Kept" => ["files.example.org", "/Case/Kept"],
      "https://user:pw@files.example.org:8443/x" => ["files.example.org", "/x"],
      "https://a@b@files.example.org/x" => ["files.example.org", "/x"],
      "https://files.example.org./x" => ["files.example.org", "/x"],
      "https://files%2eexample.org/x" => ["files.example.org", "/x"],
      "https://files.example.org\\x\\..\\y" => ["files.example.org", "/y"],
      "https:////files.example.org/x" => ["files.example.org", "/x"], # a browser skips extra slashes…
      "https:///x" => ["x", "/"], # …even when that leaves the path as the host
      "https://files.exa\tmple.org/x\n" => ["files.example.org", "/x"],
      "https://files.example.org/Bericht-ü.pdf" => ["files.example.org", "/Bericht-ü.pdf"]
    }.each do |url, expected|
      assert_equal expected, LA.host_and_path(url), url.inspect
    end
  end

  def test_host_and_path_is_nil_for_anything_but_an_http_url_with_a_host
    [
      nil, "", "not a url", "/catalog/x/deck.pdf", "mailto:files.example.org",
      "ftp://files.example.org/x", "javascript:alert(1)", "https://", "https://user@/x"
    ].each do |url|
      assert_nil LA.host_and_path(url), url.inspect
    end
  end

  # -- rule_for -------------------------------------------------------------------------

  def test_rule_for_returns_the_first_rule_covering_the_url
    assert_equal "files.example.org/p/", LA.rule_for(CONFIG, "https://files.example.org/p/abc")["match"]
    assert_equal "Files.Example.org", LA.rule_for(CONFIG, "https://files.example.org/p/../abc")["match"]
    assert_equal "Files.Example.org", LA.rule_for(CONFIG, "https://eu.files.example.org/x")["match"]
    assert_nil LA.rule_for(CONFIG, "https://example.org/x"), "a parent domain is not covered by a subdomain rule"
    assert_nil LA.rule_for(CONFIG, "https://github.com/org/repo/blob/main/x")
  end

  def test_rule_for_skips_malformed_rules_and_a_missing_hosts_list
    config = { "hosts" => [nil, "files.example.org", { "match" => "" }, { "match" => "files.example.org", "name" => "Drive" }] }
    assert_equal "Drive", LA.rule_for(config, "https://files.example.org/x")["name"]
    assert_nil LA.rule_for({ "hosts" => "files.example.org" }, "https://files.example.org/x")
    assert_nil LA.rule_for({}, "https://files.example.org/x")
  end

  # -- resolve --------------------------------------------------------------------------

  def test_resolve_gives_strings_for_every_key_and_a_boolean_download
    meta = LA.resolve(CONFIG, "https://github.com/org/repo/releases/download/files/big.zip")
    assert_equal(
      { "name" => "", "access" => "", "label" => "", "icon" => "", "note" => "", "request_url" => "", "download" => true },
      meta
    )

    gated = LA.resolve(CONFIG, "https://files.example.org/x")
    assert_equal "members", gated["access"]
    assert_equal "", gated["note"], "a level without a note gives \"\", which a template tests with != ''"
    assert_equal false, gated["download"]
  end

  def test_resolve_download_is_true_only_for_a_literal_true
    config = { "hosts" => [{ "match" => "example.org", "download" => "yes" }] }
    assert_equal false, LA.resolve(config, "https://example.org/x")["download"]
  end

  def test_resolve_is_nil_when_nothing_applies_or_the_block_is_not_a_mapping
    assert_nil LA.resolve(CONFIG, "https://example.net/x")
    assert_nil LA.resolve(CONFIG, "https://example.net/x", "nobody")
    assert_nil LA.resolve(nil, "https://files.example.org/x")
    assert_nil LA.resolve(["files.example.org"], "https://files.example.org/x")
    assert_nil LA.resolve({ "levels" => "members" }, "https://example.net/x", "members")
  end

  def test_resolve_trims_an_item_access_before_looking_it_up
    assert_equal "members", LA.resolve(CONFIG, "https://example.net/x", "  members ")["access"]
  end
end
