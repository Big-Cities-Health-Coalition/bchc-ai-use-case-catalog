#!/usr/bin/env node
/**
 * Re-render the sample entries' slide decks in the current site theme.
 *
 *   node docs/bchc/screenshots-src/render-decks.mjs                     render all of them
 *   node docs/bchc/screenshots-src/render-decks.mjs <slug> ...          render only these entries
 *   node docs/bchc/screenshots-src/render-decks.mjs --theme <path> ...  use another theme file
 *
 * Each `decks/<slug>/deck.html` beside this file holds one deck, one
 * `<section class="slide">` per page. The script wraps it in a page whose
 * colours and fonts come from the theme file (default `_data/theme.yml`, read
 * now, not copied in), styles it with `decks/deck.css`, and prints it with
 * Puppeteer to `catalog/<slug>/deck.pdf` at 1280x720 CSS pixels (960x540 pt,
 * 13.333x7.5 in) per page. The entry's `thumb.jpg` is the deck's first page,
 * which the "Generate entry media" workflow re-renders on the pull request.
 *
 * Theme and font handling is shared with render.mjs (see theme.mjs), so it
 * also refuses to write a deck in a fallback font. Bundled families are
 * embedded as static instances at WEIGHTS, which keeps each PDF to a few tens
 * of kilobytes; the first run sets up fonttools in a Python venv to cut them.
 */

/* global document -- only inside tab.evaluate(), which runs in the page */

import console from 'node:console';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import puppeteer from 'puppeteer';

import { HERE, ROOT, assertFontsLoaded, fontMarkup, page, parseArgs, readTheme, shown } from './theme.mjs';

const DECKS = path.join(HERE, 'decks');
/** Must match `.slide` and `@page` in decks/deck.css. */
const WIDTH = 1280;
const HEIGHT = 720;
/** The font weights decks/deck.css uses; each bundled family is embedded once per weight. */
const WEIGHTS = [400, 700];

/** Every `decks/<slug>/deck.html`, optionally limited to the slugs given on the command line. */
function sources(only) {
  const found = [];
  for (const slug of fs.readdirSync(DECKS).sort()) {
    const file = path.join(DECKS, slug, 'deck.html');
    if (!fs.existsSync(file)) continue;
    if (only.length && !only.includes(slug)) continue;
    found.push({ slug, file });
  }
  const missing = only.filter((slug) => !found.some((source) => source.slug === slug));
  if (missing.length) throw new Error(`No deck sources for: ${missing.join(', ')}`);
  return found;
}

async function main() {
  const { themePath, slugs } = parseArgs(process.argv.slice(2));
  const theme = readTheme(themePath);
  const fonts = fontMarkup(theme.fonts, themePath, { weights: WEIGHTS });
  const css = fs.readFileSync(path.join(DECKS, 'deck.css'), 'utf8');
  const todo = sources(slugs);
  console.log(`theme ${shown(themePath)}: ${theme.fonts.heading} / ${theme.fonts.body}`);

  const browser = await puppeteer.launch();
  try {
    const tab = await browser.newPage();
    await tab.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

    for (const { slug, file } of todo) {
      const entry = path.join(ROOT, 'catalog', slug);
      if (!fs.existsSync(entry)) {
        throw new Error(`catalog/${slug} does not exist; rename or remove ${path.relative(ROOT, file)}.`);
      }

      await tab.setContent(page(fs.readFileSync(file, 'utf8'), theme, fonts, css), { waitUntil: 'load' });
      await assertFontsLoaded(tab, theme.fonts, slug);

      // The first heading becomes the PDF's title. Text that no longer fits
      // its slide or card is an error rather than a silently clipped page.
      const { slides, overflowing } = await tab.evaluate(() => {
        document.title = document.querySelector('h1')?.textContent.trim() || '';
        const boxes = [...document.querySelectorAll('.slide, .fact')];
        return {
          slides: document.querySelectorAll('.slide').length,
          overflowing: boxes
            .filter((box) => box.scrollHeight > box.clientHeight || box.scrollWidth > box.clientWidth)
            .map((box) => box.textContent.trim().split('\n')[0]),
        };
      });
      if (!slides) throw new Error(`${slug}: no <section class="slide"> in ${path.relative(ROOT, file)}`);
      if (overflowing.length) {
        throw new Error(`${slug}: content overflows its box: ${overflowing.join('; ')}`);
      }

      const out = path.join(entry, 'deck.pdf');
      await tab.pdf({
        path: out,
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        printBackground: true,
        preferCSSPageSize: true,
      });
      console.log(`wrote ${path.relative(ROOT, out)} (${slides} slides, ${fs.statSync(out).size} bytes)`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
