# frozen_string_literal: true

# Tests for the `link_access` checks in scripts/check_front_matter.rb (the rules
# themselves live in scripts/lib/link_access_check.rb).
#
#   npm run test:ruby     (or: ruby -Itest test/scripts/link_access_check_test.rb)
#
# Like check_front_matter_test.rb, every fixture is written into a temporary
# directory, so Jekyll never sees a stray entry page.

require "minitest/autorun"
require "tmpdir"
require "fileutils"

require_relative "../../scripts/check_front_matter"

class LinkAccessCheckTest < Minitest::Test
  SCHEMA = <<~YAML
    entry:
      path: catalog
    fields:
      - key: title
        label: Title
        type: text
        required: true
      - key: summary
        label: Summary
        type: textarea
      - key: repo_url
        label: Repo
        type: url
      - key: resources
        label: Resources
        type: links
      - key: body
        label: Write-up
        type: markdown
  YAML

  SITE = <<~YAML
    name: Test
    link_access:
      levels:
        members:
          label: "Members only"
          icon: lock
          note: "Sign-in required."
          request_url: "https://example.org/join"
      hosts:
        - { match: "files.example.org/p/", name: "Shared drive" }
        - { match: "files.example.org", name: "Shared drive", access: members }
        - { match: "github.com/org/repo/releases/download/", name: "File library", download: true }
  YAML

  def setup
    @root = Dir.mktmpdir("link-access-test")
    FileUtils.mkdir_p(File.join(@root, "_data"))
    FileUtils.mkdir_p(File.join(@root, "_includes"))
    File.write(File.join(@root, "_data", "schema.yml"), SCHEMA)
    # The validator reads the icon list off icon.html's "Names:" line.
    File.write(File.join(@root, "_includes", "icon.html"), "{%- comment -%}\nNames: download link lock\n{%- endcomment -%}\n")
  end

  def teardown
    FileUtils.remove_entry(@root)
    FrontMatterCheck.root = FrontMatterCheck::DEFAULT_ROOT
  end

  def write_site(text)
    File.write(File.join(@root, "_data", "site.yml"), text)
  end

  # A valid entry whose only links are the given `resources` items, plus any
  # extra front matter lines.
  def write_entry(slug, resources_yaml, extra = "")
    dir = File.join(@root, "catalog", slug)
    FileUtils.mkdir_p(dir)
    items = resources_yaml.strip.lines.map { |line| "  #{line.chomp}" }.join("\n")
    front_matter = [
      "title: T", "slug: #{slug}", "render_with_liquid: false", "summary: S", "published: \"2026-01-05\"",
      extra, "resources:", items
    ].reject(&:empty?).join("\n")
    File.write(File.join(dir, "index.md"), "---\n#{front_matter}\n---\n\nBody.\n")
  end

  def run_check
    FrontMatterCheck.run(@root)
  end

  # -- the config block ---------------------------------------------------------

  def test_a_valid_block_and_entries_pass_silently
    write_site(SITE)
    write_entry("mixed", <<~YAML)
      - label: Members folder
        url: https://files.example.org/projects/1
      - label: Public share
        url: https://files.example.org/p/abc
    YAML

    failures, warnings = run_check
    assert_empty failures
    assert_empty warnings
  end

  # Jekyll reads _data files with aliases on, so a deployment may use anchors in
  # site.yml or resources.yml; the validator must read them the same way.
  def test_yaml_aliases_in_site_and_resources_data_are_accepted
    write_site(<<~YAML)
      org: &org Example Org
      footer_owner: *org
      #{SITE}
    YAML
    File.write(File.join(@root, "_data", "resources.yml"), <<~YAML)
      - title: Guides
        items:
          - &guide { title: Guide, url: "https://files.example.org/g", access: members }
          - *guide
    YAML

    failures, warnings = run_check
    assert_empty failures
    assert_empty warnings
  end

  def test_a_site_without_the_block_is_not_checked
    write_site("name: Test\n")
    write_entry("plain", "- label: Report\n  url: https://files.example.org/x")

    failures, warnings = run_check
    assert_empty failures
    assert_empty warnings
  end

  def test_the_block_must_be_a_mapping
    write_site("name: Test\nlink_access: yes\n")

    failures, = run_check
    assert(failures.any? { |f| f.include?("`link_access` must be a mapping") }, failures.inspect)
  end

  def test_levels_are_checked_for_shape_label_icon_and_request_url
    write_site(<<~YAML)
      link_access:
        levels:
          Members:
            label: "Members"
          staff:
            icon: rocket
            request_url: "javascript:alert(1)"
          broken: "Members only"
    YAML

    failures, = run_check
    assert(failures.any? { |f| f.include?("levels.Members") && f.include?("lowercase") }, failures.inspect)
    assert(failures.any? { |f| f.include?("levels.staff") && f.include?("`label`") }, failures.inspect)
    assert(failures.any? { |f| f.include?("levels.staff") && f.include?("\"rocket\" is not in _includes/icon.html") }, failures.inspect)
    assert(failures.any? { |f| f.include?("levels.staff") && f.include?("`request_url`") }, failures.inspect)
    assert(failures.any? { |f| f.include?("levels.broken") && f.include?("must be a mapping") }, failures.inspect)
  end

  def test_host_rules_are_checked_for_match_access_and_download
    write_site(<<~YAML)
      link_access:
        levels:
          members: { label: "Members only" }
        hosts:
          - { name: "No match" }
          - { match: "https://files.example.org", access: members }
          - { match: "files example.org" }
          - { match: "files.example.org", access: staff }
          - { match: "github.com/o/r/releases/download/", download: "yes" }
          - "files.example.org"
    YAML

    failures, = run_check
    assert(failures.any? { |f| f.include?("hosts[0]") && f.include?("needs a `match`") }, failures.inspect)
    assert(failures.any? { |f| f.include?("hosts[1]") && f.include?("without the scheme") }, failures.inspect)
    assert(failures.any? { |f| f.include?("hosts[2]") && f.include?("host name") }, failures.inspect)
    assert(failures.any? { |f| f.include?("hosts[3]") && f.include?("\"staff\"") && f.include?("members") }, failures.inspect)
    assert(failures.any? { |f| f.include?("hosts[4]") && f.include?("`download`") }, failures.inspect)
    assert(failures.any? { |f| f.include?("hosts[5]") && f.include?("must be a mapping") }, failures.inspect)
  end

  def test_hosts_must_be_a_list
    write_site("link_access:\n  hosts:\n    match: files.example.org\n")

    failures, = run_check
    assert(failures.any? { |f| f.include?("`link_access.hosts` must be a list") }, failures.inspect)
  end

  # -- an item's own `access` ------------------------------------------------------

  def test_an_item_access_must_name_a_configured_level
    write_site(SITE)
    write_entry("typo", <<~YAML)
      - label: Folder
        url: https://example.net/x
        access: member
      - label: Public
        url: https://example.net/y
    YAML

    failures, = run_check
    assert(
      failures.any? { |f| f.include?("typo/index.md") && f.include?("`resources[0].access` is \"member\"") && f.include?("members") },
      failures.inspect
    )
  end

  # A site that never configured link_access sees no change: an `access:` key
  # passes through like any other key check_links does not read.
  def test_an_item_access_without_any_block_is_not_checked
    write_site("name: Test\n")
    write_entry("orphan", "- label: Folder\n  url: https://example.net/x\n  access: members")
    File.write(File.join(@root, "_data", "resources.yml"), <<~YAML)
      - group: "Toolkits"
        items:
          - { title: "Folder", url: "https://example.net/x", access: staff }
    YAML

    failures, warnings = run_check
    assert_empty failures
    assert_empty warnings
  end

  def test_a_resources_item_access_must_name_a_configured_level
    write_site(SITE)
    File.write(File.join(@root, "_data", "resources.yml"), <<~YAML)
      - group: "Toolkits"
        items:
          - { title: "Folder", url: "https://example.net/x", access: staff }
          - { title: "Fine", url: "https://example.net/y", access: members }
    YAML

    failures, = run_check
    assert(failures.any? { |f| f.include?("_data/resources.yml") && f.include?("\"staff\"") }, failures.inspect)
    assert_equal 1, failures.count { |f| f.include?("_data/resources.yml") }
  end

  # -- no public link ------------------------------------------------------------------

  def test_an_entry_whose_every_link_needs_access_warns
    write_site(SITE)
    write_entry("locked", <<~YAML)
      - label: Folder
        url: https://files.example.org/projects/1
      - label: Override
        url: https://example.net/page
        access: members
    YAML

    failures, warnings = run_check
    assert(failures.none? { |f| f.include?("locked/index.md") }, failures.inspect)
    assert(warnings.any? { |w| w.include?("locked/index.md") && w.include?("no public link") }, warnings.inspect)
  end

  def test_require_public_link_makes_it_a_failure
    write_site(SITE)
    File.write(File.join(@root, "_data", "schema.yml"), SCHEMA.sub("  path: catalog\n", "  path: catalog\n  require_public_link: true\n"))
    write_entry("locked", "- label: Folder\n  url: https://files.example.org/projects/1")

    failures, warnings = run_check
    assert(failures.any? { |f| f.include?("locked/index.md") && f.include?("no public link") }, failures.inspect)
    assert(warnings.none? { |w| w.include?("no public link") }, warnings.inspect)
  end

  # The validator resolves through the same matcher as the page, so a gated link
  # cannot be disguised as public: not by climbing out of the public carve-out
  # with dot segments, nor by a character Ruby's URI parser refuses.
  def test_require_public_link_cannot_be_bypassed_by_an_unusual_spelling
    write_site(SITE)
    File.write(File.join(@root, "_data", "schema.yml"), SCHEMA.sub("  path: catalog\n", "  path: catalog\n  require_public_link: true\n"))
    {
      "climb" => "https://files.example.org/p/../projects/1",
      "encoded" => "https://files.example.org/p/%2e%2e/projects/1",
      "umlaut" => "https://files.example.org/Bericht-ü.pdf",
      "dot" => "https://files.example.org./projects/1"
    }.each { |slug, url| write_entry(slug, "- label: Folder\n  url: #{url}") }

    failures, = run_check
    %w[climb encoded umlaut dot].each do |slug|
      assert(failures.any? { |f| f.include?("#{slug}/index.md") && f.include?("no public link") }, "#{slug}: #{failures.inspect}")
    end
  end

  # -- the helpers, directly --------------------------------------------------------

  def test_entry_links_collects_url_fields_and_links_items_with_their_access
    fields = YAML.safe_load(SCHEMA)["fields"]
    data = {
      "repo_url" => " https://github.com/org/repo ",
      "summary" => "https://not-a-link-field.example",
      "resources" => [
        "https://bare.example.org/x",
        "  ",
        { "label" => "Folder", "url" => "https://files.example.org/1", "access" => "members" },
        { "label" => "No URL" },
        42
      ]
    }
    assert_equal(
      [["https://github.com/org/repo", nil], ["https://bare.example.org/x", nil], ["https://files.example.org/1", "members"]],
      LinkAccessCheck.entry_links(data, fields)
    )
    assert_empty LinkAccessCheck.entry_links({ "repo_url" => "", "resources" => "not a list" }, fields)
  end

  def test_no_public_link_needs_links_and_a_block
    config = YAML.safe_load(SITE)["link_access"]
    gated = [["https://files.example.org/1", nil]]
    assert LinkAccessCheck.no_public_link?(config, gated)
    refute LinkAccessCheck.no_public_link?(config, gated + [["https://example.net/open", nil]])
    refute LinkAccessCheck.no_public_link?(config, []), "no links at all is require_link's business"
    refute LinkAccessCheck.no_public_link?(nil, gated)
  end

  def test_known_lists_the_configured_levels_for_a_message
    assert_equal " (members, staff)", LinkAccessCheck.known({ "members" => {}, "staff" => {} })
    assert_equal " (none are configured)", LinkAccessCheck.known({})
  end

  def test_icon_names_reads_the_names_line_or_skips_the_icon_check
    assert_equal %w[download link lock], LinkAccessCheck.icon_names(@root)
    File.write(File.join(@root, "_includes", "icon.html"), "no names line here\n")
    assert_nil LinkAccessCheck.icon_names(@root)
    FileUtils.rm(File.join(@root, "_includes", "icon.html"))
    assert_nil LinkAccessCheck.icon_names(@root)
  end

  def test_the_shipped_icon_list_has_the_documented_example_icon
    assert_includes LinkAccessCheck.icon_names(FrontMatterCheck::DEFAULT_ROOT), "lock"
  end

  def test_one_public_link_anywhere_is_enough
    write_site(SITE)
    write_entry(
      "open-repo",
      "- label: Folder\n  url: https://files.example.org/projects/1",
      "repo_url: https://github.com/org/repo"
    )
    # A download rule names no level, so a release asset is a public link.
    write_entry(
      "release",
      "- label: Folder\n  url: https://files.example.org/projects/1\n- label: Big file\n  url: https://github.com/org/repo/releases/download/files/big.zip"
    )

    _, warnings = run_check
    assert(warnings.none? { |w| w.include?("no public link") }, warnings.inspect)
  end
end
