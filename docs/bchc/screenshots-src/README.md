# Sample-entry screenshot sources

The screenshots on the sample catalog entries (`catalog/<slug>/screenshots/NN.png`) are mock app
screens, rendered from the HTML in this folder so they match the site theme.

- `<slug>/NN.html` is the body of one mockup. It becomes `catalog/<slug>/screenshots/NN.png`.
- `base.css` holds the shared styles. It uses CSS variables only, with no colour values of its own.
- `render.mjs` reads the colours and fonts from the theme (`_data/theme.yml` unless you pass
  `--theme`) each time it runs, and writes each PNG at 1280×800 (device scale factor 1) with
  Puppeteer, saved as a 256-colour PNG with sharp to keep the files small.

## Re-render after a theme change

From the repository root:

```sh
node docs/bchc/screenshots-src/render.mjs                         # all mockups
node docs/bchc/screenshots-src/render.mjs epi-signal-triage       # one entry
node docs/bchc/screenshots-src/render.mjs --theme /tmp/theme.yml  # a theme file not yet on disk here
npm run images                                                    # rebuild the AVIF/WebP derivatives
```

Then commit the PNGs, their derivatives and `_data/derivatives.json` together.
`node scripts/derive_images.mjs --check` is the CI gate that catches a skipped `npm run images`.

`--theme` renders against another theme file without editing `_data/theme.yml`, for example one
taken from an open pull request: `git show origin/<branch>:_data/theme.yml > /tmp/theme.yml`.

## Fonts

The script resolves `fonts.heading` and `fonts.body` the way the site does:

- **Bundled families** load from `assets/fonts/` with no network: `PHCT Sans`
  (`PHCTSans-Variable.woff2`), `PHCT Serif` (`PHCTSerif-Variable.woff2`) and `Inter`
  (`Inter-Variable.woff2`). The pre-1.9 names `Source Sans 3` and `Source Serif 4` map to PHCT Sans
  and PHCT Serif, as `_includes/theme.html` does. A family left unset falls back to that template's
  defaults, PHCT Serif for headings and Inter for body.
- **Any other family** loads from `fonts.google_fonts_url`, which then needs network access. If the
  theme names a non-bundled family and leaves that URL blank, the script stops before rendering.

Either way it checks that both configured families actually loaded, and stops with an error if not,
so it never writes a screenshot in a fallback font.

## Slide decks

Three sample entries also have a two-slide `deck.pdf`. Its first page is the entry's card image on
the browse page. The deck sources are in `decks/`:

- `decks/<slug>/deck.html` is one deck, with one `<section class="slide">` per page. It becomes
  `catalog/<slug>/deck.pdf`.
- `decks/deck.css` holds the slide styles, again using CSS variables only.
- `render-decks.mjs` reads the theme the same way as `render.mjs` (both use `theme.mjs`) and takes
  the same `--theme` and slug arguments. It prints each deck with Puppeteer at 1280×720 CSS pixels a
  page (960×540 pt, the 16:9 size of the original decks), and stops if any text overflows a slide
  or card.

```sh
node docs/bchc/screenshots-src/render-decks.mjs --theme /tmp/theme.yml   # all decks
```

In a PDF, Chrome embeds a variable font as Type 3 outlines, repeated for every font size, and that
makes a deck about five times bigger. So the script embeds a static instance of each bundled family
at the two weights `deck.css` uses (400 and 700), cut with fonttools. The first run needs `python3`
and network access, because it installs fonttools into a venv under `$FONT_WORK_DIR` (by default a
folder in the system temp directory), as `scripts/build_fonts.sh` does. With the bundled fonts a
deck comes out at about 22 KB. A variable font loaded from `google_fonts_url` is not instanced, so
it still renders, but the PDF is larger.

The script does not write `thumb.jpg`. The "Generate entry media" workflow
(`.github/workflows/thumbnails.yml`) renders it, and its AVIF/WebP variants, from the deck's first
page.

Neither script is a root dependency. Install Puppeteer at the version pinned in
`quality/package.json` with `npm install --no-save puppeteer@<version>`.

## Editing a mockup

Change the text in the matching `NN.html` and re-render. Use the classes in `base.css` (`kpi`,
`card`, `pill`, `note` and the rest), not inline colours, so that the next theme change still carries
through. Status pills use `warn` for anything that needs caution, `ok` for positive or categorical
labels, and `tint` for informational ones.

These mockups are BCHC deployment content. The template's showcase screenshots (under `_showcase/`
and `assets/images/showcase/`) are template-owned and are not rendered from here.
