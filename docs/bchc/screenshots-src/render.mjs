#!/usr/bin/env node
/**
 * Re-render the sample entries' mock-app screenshots in the current site theme.
 *
 *   node docs/bchc/screenshots-src/render.mjs                     render all of them
 *   node docs/bchc/screenshots-src/render.mjs <slug> ...          render only these entries
 *   node docs/bchc/screenshots-src/render.mjs --theme <path> ...  use another theme file
 *
 * Each `<slug>/NN.html` beside this file is the body of one mockup. The script
 * wraps it in a page whose colours and fonts come from the theme file (default
 * `_data/theme.yml`, read now, not copied in), styles it with `base.css`, and
 * writes a 1280x800 PNG to `catalog/<slug>/screenshots/NN.png`. Run
 * `npm run images` afterwards to rebuild the AVIF/WebP derivatives.
 *
 * Fonts resolve the way the site does: the bundled families load from
 * `assets/fonts/`, anything else from the theme's `google_fonts_url` (which
 * needs network access). It fails rather than write a screenshot in a
 * fallback font.
 */

import console from 'node:console';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import puppeteer from 'puppeteer';
import sharp from 'sharp';

import { HERE, ROOT, assertFontsLoaded, fontMarkup, page, parseArgs, readTheme, shown } from './theme.mjs';

const WIDTH = 1280;
const HEIGHT = 800;
/** Folders beside this script that hold something other than screenshot mockups. */
const NOT_MOCKUPS = new Set(['decks']);

/** Every `<slug>/NN.html`, optionally limited to the slugs given on the command line. */
function sources(only) {
  const found = [];
  for (const slug of fs.readdirSync(HERE).sort()) {
    const dir = path.join(HERE, slug);
    if (NOT_MOCKUPS.has(slug) || !fs.statSync(dir).isDirectory()) continue;
    if (only.length && !only.includes(slug)) continue;
    for (const file of fs.readdirSync(dir).sort()) {
      if (!/^\d{2}\.html$/.test(file)) continue;
      found.push({ slug, name: file.replace(/\.html$/, ''), file: path.join(dir, file) });
    }
  }
  const missing = only.filter((slug) => !found.some((source) => source.slug === slug));
  if (missing.length) throw new Error(`No mockup sources for: ${missing.join(', ')}`);
  return found;
}

async function main() {
  const { themePath, slugs } = parseArgs(process.argv.slice(2));
  const theme = readTheme(themePath);
  const fonts = fontMarkup(theme.fonts, themePath);
  const css = fs.readFileSync(path.join(HERE, 'base.css'), 'utf8');
  const todo = sources(slugs);
  console.log(`theme ${shown(themePath)}: ${theme.fonts.heading} / ${theme.fonts.body}`);

  const browser = await puppeteer.launch();
  try {
    const tab = await browser.newPage();
    await tab.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

    for (const { slug, name, file } of todo) {
      const outDir = path.join(ROOT, 'catalog', slug, 'screenshots');
      if (!fs.existsSync(path.join(ROOT, 'catalog', slug))) {
        throw new Error(`catalog/${slug} does not exist; rename or remove ${path.relative(ROOT, file)}.`);
      }
      fs.mkdirSync(outDir, { recursive: true });

      await tab.setContent(page(fs.readFileSync(file, 'utf8'), theme, fonts, css), { waitUntil: 'load' });
      await assertFontsLoaded(tab, theme.fonts, `${slug}/${name}`);

      const out = path.join(outDir, `${name}.png`);
      const shot = await tab.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
      // Flat UI fits a 256-colour palette with no visible change, at about 40%
      // of Chrome's truecolour PNG size (each channel moves by a few levels at most).
      await sharp(shot)
        .png({ palette: true, quality: 100, colours: 256, dither: 0, compressionLevel: 9 })
        .toFile(out);
      console.log(`wrote ${path.relative(ROOT, out)}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
