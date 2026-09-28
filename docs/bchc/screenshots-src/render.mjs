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

/* global document -- only inside tab.evaluate(), which runs in the page */

import console from 'node:console';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import * as yaml from 'js-yaml';
import puppeteer from 'puppeteer';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');
const WIDTH = 1280;
const HEIGHT = 800;

/** The families the site ships in assets/fonts/ (see assets/css/components/base.css). */
const BUNDLED = {
  'PHCT Sans': 'PHCTSans-Variable.woff2',
  'PHCT Serif': 'PHCTSerif-Variable.woff2',
  Inter: 'Inter-Variable.woff2',
};
/** Pre-1.9 names, normalised exactly as _includes/theme.html does. */
const ALIASES = { 'Source Sans 3': 'PHCT Sans', 'Source Serif 4': 'PHCT Serif' };
/** _includes/theme.html's defaults for a theme that leaves a family unset. */
const DEFAULTS = { heading: 'PHCT Serif', body: 'Inter' };

/** A path relative to the repository root when it is inside it, else as given. */
function shown(file) {
  const relative = path.relative(ROOT, file);
  return relative && !relative.startsWith('..') ? relative : file;
}

function parseArgs(argv) {
  let themePath = path.join(ROOT, '_data', 'theme.yml');
  const slugs = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--theme') {
      if (!argv[i + 1]) throw new Error('--theme needs a path.');
      themePath = path.resolve(argv[(i += 1)]);
    } else if (arg.startsWith('--theme=')) {
      themePath = path.resolve(arg.slice('--theme='.length));
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option ${arg}`);
    } else {
      slugs.push(arg);
    }
  }
  return { themePath, slugs };
}

function readTheme(themePath) {
  const theme = yaml.load(fs.readFileSync(themePath, 'utf8')) || {};
  const fonts = theme.fonts || {};
  const family = (role) => {
    const name = String(fonts[role] || DEFAULTS[role]).trim();
    return ALIASES[name] || name;
  };
  return {
    colors: theme.colors || {},
    fonts: {
      heading: family('heading'),
      body: family('body'),
      googleUrl: String(fonts.google_fonts_url || '').trim(),
    },
  };
}

/**
 * `<link>` and `@font-face` markup for the theme's two families. Bundled files
 * are inlined as data URLs, because the page is set from a string and has no
 * origin that could fetch `file://` fonts.
 */
function fontMarkup({ heading, body, googleUrl }, themePath) {
  const families = [...new Set([heading, body])];
  const remote = families.filter((family) => !BUNDLED[family]);
  if (remote.length && !googleUrl) {
    throw new Error(
      `${shown(themePath)}: ${remote.join(', ')} is not a bundled family ` +
        `(${Object.keys(BUNDLED).join(', ')}), so fonts.google_fonts_url must be set.`
    );
  }
  const faces = families
    .filter((family) => BUNDLED[family])
    .map((family) => {
      const data = fs.readFileSync(path.join(ROOT, 'assets', 'fonts', BUNDLED[family])).toString('base64');
      return `@font-face { font-family: "${family}"; src: url(data:font/woff2;base64,${data}) format("woff2"); font-weight: 400 700; font-style: normal; }`;
    });
  const link = remote.length ? `<link rel="stylesheet" href="${googleUrl}">` : '';
  return `${link}<style>${faces.join('\n')}</style>`;
}

/** `primary_dark: "#171717"` becomes `--primary-dark: #171717;`. */
function cssVariables({ colors, fonts }) {
  const lines = Object.entries(colors).map(([key, value]) => `--${key.replace(/_/g, '-')}: ${value};`);
  lines.push(`--font-heading: "${fonts.heading}";`, `--font-body: "${fonts.body}";`);
  return `:root { ${lines.join(' ')} }`;
}

/** Every `<slug>/NN.html`, optionally limited to the slugs given on the command line. */
function sources(only) {
  const found = [];
  for (const slug of fs.readdirSync(HERE).sort()) {
    const dir = path.join(HERE, slug);
    if (!fs.statSync(dir).isDirectory()) continue;
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

function page(body, theme, fonts, css) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${fonts}
<style>${cssVariables(theme)}</style>
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;
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
      // Load every face of the theme's two families up front (a face's load()
      // rejects on a failed fetch), and refuse to shoot a fallback font.
      const unloaded = await tab.evaluate(
        async (families) => {
          const faces = [...document.fonts].filter((face) =>
            families.includes(face.family.replace(/["']/g, ''))
          );
          await Promise.all(faces.map((face) => face.load()));
          await document.fonts.ready;
          return families.filter(
            (family) => !faces.some((face) => face.family.replace(/["']/g, '') === family)
          );
        },
        [theme.fonts.heading, theme.fonts.body]
      );
      if (unloaded.length) {
        throw new Error(`${slug}/${name}: font not loaded: ${unloaded.join(', ')}`);
      }

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
