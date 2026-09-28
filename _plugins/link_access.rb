# frozen_string_literal: true

# Access labels for links that leave the site, from the optional `link_access`
# block of _data/site.yml:
#
#   link_access:
#     levels:
#       members: { label: "Members only", icon: lock, note: "Sign-in required.", request_url: "" }
#     hosts:          # first match wins
#       - { match: "files.example.org", name: "Shared drive", access: members }
#       - { match: "github.com/org/repo/releases/download/", name: "File library", download: true }
#
# A rule's `match` is a host plus an optional path prefix. The host matches
# itself and any subdomain of itself, never a look-alike ("notexample.org" is
# not "example.org"); the path prefix, when there is one, must start the URL's
# path. A links item's own `access:` overrides whatever its host rule says.
#
# Plain Ruby, stdlib only: the `link_access` Liquid filter in theme_filters.rb
# renders from it, and scripts/lib/link_access_check.rb validates from it, so
# the page and `npm run validate` can never disagree about what a URL resolves
# to. Nothing here registers with Jekyll.
module CatalogTemplate
  module LinkAccess
    # "example.org/p/" -> ["example.org", "/p/"]; "example.org" -> ["example.org", ""].
    # @param match [String] a host rule's `match`
    # @return [Array(String, String)] lower-cased host, path prefix ("" for none)
    def self.split_match(match)
      text = match.to_s.strip
      slash = text.index("/")
      return [text.downcase, ""] unless slash

      [text[0...slash].downcase, text[slash..]]
    end

    # "https://user@Files.Example.org.:8443/p/../x?q#f" -> ["files.example.org", "/x"]
    #
    # Read the way a browser reads it, not the way URI.parse does: URI.parse
    # refuses a URL a browser opens without complaint (a non-ASCII path, `|`,
    # `{}`), and a URL that resolves to no host resolves to no rule, which would
    # show a members-only link as public. So the host and path come from an
    # anchored pattern instead:
    #
    #   - tabs and newlines inside the URL are dropped, as a browser drops them;
    #   - the scheme is http or https in any case; `\` counts as `/`;
    #   - the authority runs to the first `/`, `\`, `?` or `#`; everything up
    #     to its last `@` is userinfo, and a trailing `:port` is dropped;
    #   - the host's ASCII escapes are decoded ("files%2Eexample.org"), then it
    #     is lower-cased and loses one trailing dot
    #     ("files.example.org." is the same DNS name);
    #   - dot segments (".", "..", and their %2e spellings) are removed from the
    #     path, so "/public/../secret" is tested as the "/secret" the browser
    #     actually requests.
    #
    # @param url [String]
    # @return [Array(String, String), nil] lower-cased host and normalized path, nil unless http(s) with a host
    def self.host_and_path(url)
      text = url.to_s.strip.delete("\t\n\r")
      found = %r{\Ahttps?:[/\\]*([^/\\?#]*)([^?#]*)}i.match(text)
      return nil unless found

      host = found[1].rpartition("@").last.sub(/:\d*\z/, "")
      host = host.gsub(/%[0-7]\h/) { |escape| escape[1..].hex.chr }.downcase.delete_suffix(".")
      return nil if host.empty?

      [host, remove_dot_segments(found[2].tr("\\", "/"))]
    end

    # "/public/../secret" -> "/secret", "/a/./b/" -> "/a/b/", "" -> "/".
    # The WHATWG URL path rules: "." and "%2e" are the current segment, ".."
    # and any mix of "." and "%2e" in two characters is the parent; a final
    # dot segment leaves a trailing slash.
    # @param path [String] a URL path, "/" separated
    # @return [String]
    def self.remove_dot_segments(path)
      segments = path.split("/", -1)
      segments.shift # the empty string before the leading "/"
      kept = []
      segments.each_with_index do |segment, index|
        last = index == segments.size - 1
        case segment.gsub(/%2e/i, ".")
        when "."
          kept << "" if last
        when ".."
          kept.pop
          kept << "" if last
        else
          kept << segment
        end
      end
      "/#{kept.join('/')}"
    end

    # The first host rule covering `url`, or nil.
    # @param config [Hash] the link_access block
    # @param url [String]
    # @return [Hash, nil]
    def self.rule_for(config, url)
      rules = config["hosts"]
      return nil unless rules.is_a?(Array)

      host, path = host_and_path(url)
      return nil unless host

      rules.find do |rule|
        next false unless rule.is_a?(Hash)

        rule_host, prefix = split_match(rule["match"])
        next false if rule_host.empty?

        (host == rule_host || host.end_with?(".#{rule_host}")) && path.start_with?(prefix)
      end
    end

    # What a reader should be told about a link, or nil when nothing applies.
    #
    # Every value is a string except `download`, and a missing one is "" rather
    # than nil, so a template can test it with `!= ''` (Liquid treats an empty
    # string as truthy, and nil prints as nothing either way).
    #
    # @param config [Object] the link_access block (anything else yields nil)
    # @param url [String]
    # @param access [String, nil] the item's own `access:`, overriding its host rule
    # @return [Hash, nil] name, access, label, icon, note, request_url, download
    def self.resolve(config, url, access = nil)
      return nil unless config.is_a?(Hash)

      rule = rule_for(config, url)
      levels = config["levels"].is_a?(Hash) ? config["levels"] : {}
      key = access.to_s.strip
      key = rule["access"].to_s.strip if key.empty? && rule
      level = key.empty? ? nil : levels[key]
      level = nil unless level.is_a?(Hash)
      return nil if rule.nil? && level.nil?

      {
        "name" => rule ? rule["name"].to_s.strip : "",
        "access" => level ? key : "",
        "label" => level ? level["label"].to_s.strip : "",
        "icon" => level ? level["icon"].to_s.strip : "",
        "note" => level ? level["note"].to_s.strip : "",
        "request_url" => level ? level["request_url"].to_s.strip : "",
        "download" => rule ? rule["download"] == true : false
      }
    end
  end
end
