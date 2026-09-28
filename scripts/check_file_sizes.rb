#!/usr/bin/env ruby
# frozen_string_literal: true

# GitHub rejects pushes containing files over 100 MB and Pages artifacts get
# unwieldy long before that. Fail hard at 50 MB, nudge at 10 MB.
#
# Images get a much lower nudge (2 MB), because 10 MB is nowhere near the size
# at which a screenshot starts hurting: a retina PNG straight out of a phone or
# a 5K display lands at 2-4 MB and is painted into a 356px box. `npm run images`
# writes the AVIF/WebP variants that keep that off the wire, but the original is
# still what a reader on a browser without them downloads, and it is still what
# every clone of the repository carries.
#
# Walks the whole repo tree (skipping .git, node_modules, vendor, _site) and
# reports any file over the thresholds.
#
# Invoked by: `npm run validate` (scripts/validate.mjs, via `ruby
# scripts/check_file_sizes.rb`) and directly as a step in
# .github/workflows/smoke.yml. No env vars; inputs are the files on disk.
# Output: warnings/failures to stderr, "File size check passed." to stdout,
# exit 1 when any file exceeds FAIL_BYTES.

require "find"

MEGABYTE = 1024 * 1024
FAIL_BYTES = 50 * MEGABYTE
WARN_BYTES = 10 * MEGABYTE
IMAGE_WARN_BYTES = 2 * MEGABYTE
IMAGE_EXTENSIONS = %w[.png .jpg .jpeg .gif .webp .avif .tif .tiff .bmp].freeze
SKIP_DIRS = %w[.git node_modules vendor _site].freeze

root = File.expand_path("..", __dir__)
failures = []
warnings = []
image_warnings = []

Find.find(root) do |path|
  if File.directory?(path)
    Find.prune if SKIP_DIRS.include?(File.basename(path))
    next
  end

  next if File.symlink?(path)

  size = File.size(path)
  rel = path.delete_prefix("#{root}/")
  megabytes = format("%.1f MB", size / MEGABYTE.to_f)

  if size > FAIL_BYTES
    failures << "#{rel} is #{megabytes} (limit 50 MB)"
  elsif size > WARN_BYTES
    warnings << "#{rel} is #{megabytes}"
  elsif size > IMAGE_WARN_BYTES && IMAGE_EXTENSIONS.include?(File.extname(path).downcase)
    image_warnings << "#{rel} is #{megabytes}"
  end
end

warnings.each { |warning| warn "Warning: large file — #{warning}" }

if image_warnings.any?
  warn "Warning: large source images — re-export these smaller, or crop them; " \
       "`npm run images` writes the responsive variants but cannot shrink the original:"
  image_warnings.each { |warning| warn "  - #{warning}" }
end

if failures.any?
  warn "File size check failed:"
  failures.each { |failure| warn "  - #{failure}" }
  warn "Files this big do not belong in the repository: upload them to the repository's file release " \
       "and link them instead — see \"Large files\" in docs/admin-guide.md (#large-files)."
  exit 1
end

puts "File size check passed."
