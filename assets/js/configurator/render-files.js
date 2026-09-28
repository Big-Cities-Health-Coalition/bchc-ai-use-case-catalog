/**
 * Turn a configuration into the exact set of files the configurator owns.
 * Both wizards call this and nothing else to produce output.
 */

import { toYaml } from './yaml-emit.js';
import { navigationFromSite } from './answers.js';
import { issueTemplateFromSchema } from './issue-template.js';
import { renderIssueChooser } from './issue-chooser.js';
import { jekyllConfig } from './jekyll-config.js';

const REGEN_NOTE = 'Regenerate this file with `npm run setup` or the /setup/ page on the deployed site.';

/** Comment headers written at the top of each generated data file. */
export const HEADERS = {
  site:
    'Site configuration: branding, contact details, and which modules are on.\n' +
    'Navigation, home page blocks and workflows adapt to the `modules` toggles.\n' +
    REGEN_NOTE,
  theme:
    'Theme: colors and typography.\n' +
    'Colors are hex values exposed as CSS variables and consumed by Tailwind, so\n' +
    'changing them re-themes the whole site on the next build. Keep text/background\n' +
    'pairs at WCAG AA contrast (4.5:1 for body text). `line_strong` outlines\n' +
    'interactive controls (keep it >= 3:1 on card) and `warn` is reserved for\n' +
    'sensitive-data indicators and validation errors. The optional `motion` block\n' +
    'sets the transition durations and easing (fast <= base <= slow, up to 1000ms);\n' +
    'delete it and the built-in defaults apply.\n' +
    REGEN_NOTE,
  schema:
    'Content model for catalog entries. Everything derives from this file: the entry\n' +
    'page and cards, the filter panel and search index, the /submit/ web form, the\n' +
    'GitHub issue form, the issue -> pull request scaffolder and CI validation.\n' +
    '\n' +
    'Field spec: key (snake_case, unique) · label (unique, matched by the issue\n' +
    'parser) · prompt (question-style label for the forms) · type (text | textarea |\n' +
    'markdown | url | email | select | multiselect | list | date | number | boolean |\n' +
    'file | image | images | links) · required · description · placeholder · options\n' +
    '(select/multiselect) · option_meta (per-option short/icon/tone/description) ·\n' +
    'facet (filter panel) · card (true | false | badge | chip | meta | icon | line) ·\n' +
    'weight (1-9, ordering) · icon · group (key from `groups`) · search (search\n' +
    'index) · form: false (hidden from the\n' +
    'submission forms) · filename + thumbnail (file fields) · escalate_on (values\n' +
    'that call for closer review; the scaffolded pull request says so).\n' +
    'Under `entry`, status_key / deprecated_value / status_scaffold_value /\n' +
    'status_approved_value point at the review-status field, require_link\n' +
    'makes "no link anywhere" a validation failure (require_public_link does the\n' +
    'same for "no link a visitor can open"), and contributor_key names the\n' +
    'field the monthly metrics count contributing organizations from.\n' +
    'Only one field may be `markdown` — it becomes the page body. `title`, `slug`,\n' +
    '`summary`, `published`, `updated`, `thumbnail` and `featured` always exist on\n' +
    'every entry.\n' +
    '\n' +
    'After hand-editing, run `npm run generate` to rebuild the GitHub issue form.\n' +
    REGEN_NOTE,
  navigation:
    'Primary navigation. Derived from the module toggles and the entry labels, but\n' +
    'safe to hand-edit. Items with `module` only appear when that module is enabled\n' +
    'in _data/site.yml.\n' +
    REGEN_NOTE,
};

/**
 * Render every file the configurator owns.
 *
 * @param {{site: object, theme: object, schema: object, navigation?: object[]}} config
 * @param {{url?: string, baseurl?: string}} [options]
 * @returns {Record<string, string>} path -> file contents
 */
export function renderFiles(config, options = {}) {
  const site = config?.site ?? {};
  const theme = config?.theme ?? {};
  const schema = config?.schema ?? {};
  const navigation = Array.isArray(config?.navigation) ? config.navigation : navigationFromSite(site, schema);

  return {
    '_data/site.yml': toYaml(site, { header: HEADERS.site }),
    '_data/theme.yml': toYaml(theme, { header: HEADERS.theme }),
    '_data/schema.yml': toYaml(schema, { header: HEADERS.schema }),
    '_data/navigation.yml': toYaml(navigation, { header: HEADERS.navigation }),
    '_config.yml': jekyllConfig(site, { url: options.url ?? '', baseurl: options.baseurl ?? '' }),
    '.github/ISSUE_TEMPLATE/new-entry.yml': issueTemplateFromSchema(schema, site),
    '.github/ISSUE_TEMPLATE/config.yml': renderIssueChooser(
      site.github?.repository ?? '',
      site.github?.branch
    ),
  };
}
