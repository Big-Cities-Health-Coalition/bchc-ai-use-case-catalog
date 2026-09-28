/**
 * Colour helpers used by the setup wizards and the preset contrast tests.
 * Light mode only — the template has no dark palette.
 */

/**
 * Parse `#rgb` / `#rrggbb`.
 * @param {string} hex
 * @returns {{r: number, g: number, b: number}|null} 0-255 channels, or null.
 */
export function parseHexColor(hex) {
  const value = String(hex ?? '')
    .trim()
    .replace(/^#/, '');
  const expanded =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

/** `{r,g,b}` back to `#rrggbb`. */
export function toHexColor({ r, g, b }) {
  const channel = (value) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

function relativeLuminance({ r, g, b }) {
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * WCAG 2.1 contrast ratio between two hex colours.
 * @returns {number|null} 1–21, or null when either colour is unparseable.
 */
export function contrastRatio(foreground, background) {
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (!fg || !bg) return null;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [light, dark] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * WCAG AA for normal-size text (4.5:1). Large text and non-text contrast use
 * lower thresholds; pass `threshold` when checking those.
 */
export function meetsAA(foreground, background, threshold = 4.5) {
  const ratio = contrastRatio(foreground, background);
  return ratio !== null && ratio >= threshold;
}

/** True for a strict `#rrggbb` value — what the wizards accept. */
export function isHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value ?? '').trim());
}

/**
 * The colour pairs the rendered site actually puts on top of each other, with
 * the WCAG threshold each one has to clear. One list, two consumers: the setup
 * wizards check it interactively and `npm run validate` checks it on the
 * hand-edited `_data/theme.yml`, so there is no path that skips it.
 *
 * `fg` and `bg` are `theme.colors` keys, or a literal `#rrggbb` where the CSS
 * hard-codes a colour (`.btn-primary` paints `text-white`, not `on_dark`).
 * `level: 'warn'` is for pairs a fork can reasonably trade away — the accent is
 * decorative and only carries text inside `.badge[data-tone="accent"]`.
 *
 * @type {{fg: string, bg: string, min: number, level: 'error'|'warn', what: string}[]}
 */
export const THEME_CONTRAST_PAIRS = [
  { fg: 'ink', bg: 'card', min: 4.5, level: 'error', what: 'body text on cards' },
  { fg: 'ink', bg: 'surface', min: 4.5, level: 'error', what: 'body text on the page background' },
  { fg: 'muted', bg: 'card', min: 4.5, level: 'error', what: 'secondary text on cards' },
  { fg: 'muted', bg: 'surface', min: 4.5, level: 'error', what: 'secondary text on the page background' },
  { fg: 'ink', bg: 'surface_tint', min: 4.5, level: 'error', what: 'body text on tinted panels' },
  { fg: 'muted', bg: 'surface_tint', min: 4.5, level: 'error', what: 'secondary text on tinted panels' },
  { fg: 'primary', bg: 'surface_tint', min: 4.5, level: 'error', what: 'links on tinted panels' },
  { fg: 'primary', bg: 'card', min: 4.5, level: 'error', what: 'links and ghost buttons on cards' },
  { fg: 'primary', bg: 'surface', min: 4.5, level: 'error', what: 'links on the page background' },
  { fg: 'secondary', bg: 'card', min: 4.5, level: 'error', what: 'the supporting colour on cards' },
  { fg: 'warn', bg: 'card', min: 4.5, level: 'error', what: 'caution text on cards' },
  {
    fg: 'on_dark',
    bg: 'primary_dark',
    min: 4.5,
    level: 'error',
    what: 'text and focus rings on the hero and footer',
  },
  { fg: 'on_dark', bg: 'primary', min: 4.5, level: 'error', what: 'text on a primary-filled surface' },
  { fg: '#FFFFFF', bg: 'primary', min: 4.5, level: 'error', what: 'the label on a primary button' },
  // Non-text contrast (WCAG 1.4.11): control borders only have to reach 3:1.
  { fg: 'line_strong', bg: 'card', min: 3, level: 'error', what: 'input and pill borders on cards' },
  { fg: 'ink', bg: 'accent', min: 4.5, level: 'warn', what: 'the label on an accent badge' },
];

/**
 * Run {@link THEME_CONTRAST_PAIRS} over a `theme.colors` mapping.
 *
 * Unparseable and missing colours are reported as failures rather than skipped:
 * `hex_to_rgb` (_plugins/theme_filters.rb) turns anything it cannot read into
 * `0 0 0`, so a typo silently paints the site black instead of erroring.
 *
 * @param {Record<string, string>} colors
 * @returns {{fg: string, bg: string, min: number, level: string, what: string,
 *            ratio: number|null, ok: boolean}[]} one result per pair, in order.
 */
export function checkThemeContrast(colors) {
  const resolve = (name) => (name.startsWith('#') ? name : (colors ?? {})[name]);
  return THEME_CONTRAST_PAIRS.map((pair) => {
    const ratio = contrastRatio(resolve(pair.fg), resolve(pair.bg));
    return { ...pair, ratio, ok: ratio !== null && ratio >= pair.min };
  });
}

/**
 * A darker companion for a primary colour, used as the hero/footer background
 * when the admin has not chosen one. Scales each channel toward black until the
 * result carries `on_dark` text at AA.
 *
 * @param {string} primary `#rrggbb`
 * @param {string} [onDark] the text colour that must sit on the result
 * @returns {string} `#rrggbb`, or the input when it cannot be parsed.
 */
export function derivePrimaryDark(primary, onDark = '#F7F9FC') {
  const rgb = parseHexColor(primary);
  if (!rgb) return String(primary ?? '');
  for (let factor = 0.62; factor >= 0.1; factor -= 0.04) {
    const candidate = toHexColor({ r: rgb.r * factor, g: rgb.g * factor, b: rgb.b * factor });
    if (meetsAA(onDark, candidate, 7)) return candidate;
  }
  return '#111827';
}
