# frozen_string_literal: true

# Unit tests for _plugins/text_filters.rb.
#
#   npm run test:ruby     (or: ruby -Itest test/plugins/text_filters_test.rb)

require "minitest/autorun"
require "liquid"

require_relative "../../_plugins/text_filters"

class TextFiltersHost
  include CatalogTemplate::TextFilters
end

class TextFiltersTest < Minitest::Test
  def setup
    @filters = TextFiltersHost.new
  end

  def test_with_article_uses_a_before_consonants
    assert_equal "a use case", @filters.with_article("use case")
    assert_equal "a resource", @filters.with_article("Resource".downcase)
    assert_equal "a unit", @filters.with_article("unit")
    assert_equal "a one-pager", @filters.with_article("one-pager")
  end

  def test_with_article_uses_an_before_vowels
    assert_equal "an entry", @filters.with_article("entry")
    assert_equal "an Event", @filters.with_article("Event")
    assert_equal "an hour", @filters.with_article("hour")
    assert_equal "an umbrella", @filters.with_article("umbrella")
  end

  def test_with_article_returns_empty_for_blank_input
    assert_equal "", @filters.with_article(nil)
    assert_equal "", @filters.with_article("  ")
  end

  def test_downcase_first_lowers_only_the_first_letter
    assert_equal "slide deck or one-pager (PDF)", @filters.downcase_first("Slide deck or one-pager (PDF)")
    assert_equal "area of work", @filters.downcase_first("Area of work")
    assert_equal "screenshots", @filters.downcase_first("  Screenshots ")
    assert_equal "équipe", @filters.downcase_first("Équipe")
  end

  def test_downcase_first_leaves_a_leading_acronym_alone
    assert_equal "AI tools", @filters.downcase_first("AI tools")
    assert_equal "PDF deck", @filters.downcase_first("PDF deck")
    assert_equal "GIS/mapping layers", @filters.downcase_first("GIS/mapping layers")
    assert_equal "U.S. states served", @filters.downcase_first("U.S. states served")
    assert_equal "A/B tests", @filters.downcase_first("A/B tests")
    assert_equal "R&D projects", @filters.downcase_first("R&D projects")
    # One capital letter is a word, not an acronym.
    assert_equal "a note", @filters.downcase_first("A note")
  end

  def test_downcase_first_returns_empty_for_blank_input
    assert_equal "", @filters.downcase_first(nil)
    assert_equal "", @filters.downcase_first("   ")
  end

  # The templates call it exactly like this (index.md, _layouts/catalog.html), so
  # the registration and the filter chain are worth one end-to-end assertion.
  def test_registered_filter_renders_in_a_liquid_template
    template = Liquid::Template.parse("Submit {{ singular | downcase | with_article }}")
    assert_equal "Submit a use case", template.render("singular" => "Use case")
    assert_equal "Submit an entry", template.render("singular" => "Entry")
  end
end
