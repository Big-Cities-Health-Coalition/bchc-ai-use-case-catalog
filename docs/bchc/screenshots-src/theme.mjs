/**
 * Theme and font handling shared by render.mjs (screenshots) and
 * render-decks.mjs (slide decks), so both read the theme the same way.
 *
 * Fonts resolve the way the site does: the bundled families load from
 * `assets/fonts/`, anything else from the theme's `google_fonts_url` (which
 * needs network access). `assertFontsLoaded` fails rather than let a caller
 * render in a fallback font.
 *
 * A PDF needs static fonts: Chrome embeds a variable font as Type 3 outlines,
 * repeated for every font size used, which roughly quintuples a deck. So
 * `fontMarkup(..., { weights })` embeds a static instance of each bundled
 * family per weight instead, cut with fonttools the way scripts/build_fonts.sh
 * cuts the fonts themselves: in a Python venv it creates on first use under
 * `$FONT_WORK_DIR` (default: a folder in the system temp directory).
 */

/* global document -- only inside tab.evaluate(), which runs in the page */

import { execFileSync } from 'node:child_process';
import console from 'node:console';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import * as yaml from 'js-yaml';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..', '..', '..');

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
export function shown(file) {
  const relative = path.relative(ROOT, file);
  return relative && !relative.startsWith('..') ? relative : file;
}

/** `--theme <path>` (default `_data/theme.yml`) and the remaining positional slugs. */
export function parseArgs(argv) {
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

export function readTheme(themePath) {
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

/** fonttools from the venv under FONT_WORK_DIR, installed there on first use. */
function fonttools(work) {
  const venv = path.join(work, '.venv');
  const bin = path.join(venv, 'bin', 'fonttools');
  if (!fs.existsSync(bin)) {
    console.log(`installing fonttools + brotli into ${venv} (first run only)`);
    fs.mkdirSync(work, { recursive: true });
    execFileSync('python3', ['-m', 'venv', venv], { stdio: 'inherit' });
    execFileSync(path.join(venv, 'bin', 'pip'), ['install', '--quiet', 'fonttools', 'brotli'], {
      stdio: 'inherit',
    });
  }
  return bin;
}

/** A static instance of a bundled variable font at one weight, cached by the source file's digest. */
function staticInstance(file, weight) {
  const work = process.env.FONT_WORK_DIR || path.join(os.tmpdir(), 'phct-font-work');
  const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 12);
  const out = path.join(work, 'instances', `${path.basename(file, '.woff2')}-${digest}-${weight}.woff2`);
  if (!fs.existsSync(out)) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    // Written beside the target and renamed, so an interrupted run leaves no half-written cache entry.
    const partial = `${out}.${process.pid}.tmp.woff2`;
    const args = ['varLib.instancer', '--static', '--quiet', file, `wght=${weight}`, '-o', partial];
    execFileSync(fonttools(work), args, { stdio: 'inherit' });
    fs.renameSync(partial, out);
  }
  return out;
}

/**
 * `<link>` and `@font-face` markup for the theme's two families. Bundled files
 * are inlined as data URLs, because the page is set from a string and has no
 * origin that could fetch `file://` fonts. With `weights`, each bundled family
 * gets one static face per weight rather than the variable file.
 */
export function fontMarkup({ heading, body, googleUrl }, themePath, { weights } = {}) {
  const families = [...new Set([heading, body])];
  const remote = families.filter((family) => !BUNDLED[family]);
  if (remote.length && !googleUrl) {
    throw new Error(
      `${shown(themePath)}: ${remote.join(', ')} is not a bundled family ` +
        `(${Object.keys(BUNDLED).join(', ')}), so fonts.google_fonts_url must be set.`
    );
  }
  const face = (family, file, weight) => {
    const data = fs.readFileSync(file).toString('base64');
    return `@font-face { font-family: "${family}"; src: url(data:font/woff2;base64,${data}) format("woff2"); font-weight: ${weight}; font-style: normal; }`;
  };
  const faces = families
    .filter((family) => BUNDLED[family])
    .flatMap((family) => {
      const file = path.join(ROOT, 'assets', 'fonts', BUNDLED[family]);
      return weights
        ? weights.map((weight) => face(family, staticInstance(file, weight), weight))
        : [face(family, file, '400 700')];
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

/** A complete document: theme variables, then `css`, then `body`. */
export function page(body, theme, fonts, css) {
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

/**
 * Load every face of the theme's two families up front (a face's load()
 * rejects on a failed fetch), and throw if either family is missing, so
 * nothing is ever written in a fallback font.
 */
export async function assertFontsLoaded(tab, fonts, label) {
  const unloaded = await tab.evaluate(
    async (families) => {
      const faces = [...document.fonts].filter((face) => families.includes(face.family.replace(/["']/g, '')));
      await Promise.all(faces.map((face) => face.load()));
      await document.fonts.ready;
      return families.filter((family) => !faces.some((face) => face.family.replace(/["']/g, '') === family));
    },
    [fonts.heading, fonts.body]
  );
  if (unloaded.length) {
    throw new Error(`${label}: font not loaded: ${unloaded.join(', ')}`);
  }
}
