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

## Editing a mockup

Change the text in the matching `NN.html` and re-render. Use the classes in `base.css` (`kpi`,
`card`, `pill`, `note` and the rest), not inline colours, so that the next theme change still carries
through. Status pills use `warn` for anything that needs caution, `ok` for positive or categorical
labels, and `tint` for informational ones.

These mockups are BCHC deployment content. The template's showcase screenshots (under `_showcase/`
and `assets/images/showcase/`) are template-owned and are not rendered from here.
