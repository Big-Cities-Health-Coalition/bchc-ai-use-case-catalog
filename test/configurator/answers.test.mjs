import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyAnswers,
  answersFromConfig,
  navigationFromSite,
  COLOR_QUESTIONS,
} from '../../assets/js/configurator/answers.js';
import { defaultConfig } from '../../assets/js/configurator/default-config.js';
import { MOTION_PRESETS } from '../../assets/js/configurator/motion.js';
import { BUNDLED_FONT_NAMES, normalizeBundledFontName } from '../../assets/js/configurator/fonts.js';
import { renderFiles } from '../../assets/js/configurator/render-files.js';
import {
  slugify,
  snakeKey,
  githubEditFileUrl,
  githubNewFileUrl,
  prefillNoticeIfTooLong,
} from '../../assets/js/configurator/strings.js';
import * as jsYaml from 'js-yaml';
import {
  contrastRatio,
  derivePrimaryDark,
  isHexColor,
  meetsAA,
  parseHexColor,
} from '../../assets/js/configurator/color.js';

test('answers overwrite the base config, blanks and all', () => {
  const config = applyAnswers(defaultConfig(), {
    siteName: 'City Catalog',
    tagline: '',
    orgShort: 'CC',
    repository: 'city/catalog',
    entrySingular: 'Project',
    entryPlural: 'Projects',
  });
  assert.equal(config.site.name, 'City Catalog');
  assert.equal(config.site.tagline, '');
  assert.equal(config.site.organization.short_name, 'CC');
  assert.equal(config.site.github.repository, 'city/catalog');
  assert.equal(config.schema.entry.singular, 'Project');
});

test('missing answers keep the base value', () => {
  const base = defaultConfig();
  const config = applyAnswers(base, { siteName: undefined, tagline: null });
  assert.equal(config.site.name, base.site.name);
  assert.equal(config.site.tagline, base.site.tagline);
});

test('applyAnswers never mutates the config it was given', () => {
  const base = defaultConfig();
  const before = JSON.stringify(base);
  applyAnswers(base, { siteName: 'Elsewhere', modules: { events: true } });
  assert.equal(JSON.stringify(base), before);
});

test('every colour question writes its theme token', () => {
  const answers = Object.fromEntries(COLOR_QUESTIONS.map((q, i) => [q.key, `#00000${i}`]));
  const { theme } = applyAnswers(defaultConfig(), answers);
  for (const [i, question] of COLOR_QUESTIONS.entries()) {
    assert.equal(theme.colors[question.path], `#00000${i}`, question.path);
  }
});

test('the colour questions cover the v2 tokens and read as plain language', () => {
  const paths = COLOR_QUESTIONS.map((q) => q.path);
  assert.deepEqual(paths, ['primary', 'primary_dark', 'secondary', 'accent', 'line_strong', 'warn']);
  for (const question of COLOR_QUESTIONS) {
    assert.ok(question.label.trim() && question.help.trim(), question.path);
    assert.doesNotMatch(`${question.label} ${question.help}`, /_|CSS|hex code|variable/i, question.path);
  }
});

test('module toggles merge rather than replace', () => {
  const { site } = applyAnswers(defaultConfig(), { modules: { events: true } });
  assert.equal(site.modules.events, true);
  assert.equal(site.modules.catalog, true, 'untouched toggles survive');
});

test('navigation follows the entry path and plural label', () => {
  const nav = navigationFromSite({}, { entry: { plural: 'Team projects', path: 'projects' } });
  const catalog = nav.find((item) => item.module === 'catalog');
  assert.equal(catalog.label, 'Team projects');
  assert.equal(catalog.url, '/projects/');
  assert.equal(nav.at(-1).style, 'button', 'submit stays the call to action');
});

test('applied answers regenerate the navigation and the hero link', () => {
  const config = applyAnswers(defaultConfig(), { entryPlural: 'Resources' });
  assert.equal(config.navigation.find((item) => item.module === 'catalog').label, 'Resources');
  assert.equal(config.site.hero.primary_cta.url, `/${config.schema.entry.path}/`);
});

test('answersFromConfig round-trips through applyAnswers', () => {
  const base = defaultConfig();
  const rebuilt = applyAnswers(base, answersFromConfig(base));
  const expectedTheme = structuredClone(base.theme);
  expectedTheme.fonts.heading = normalizeBundledFontName(expectedTheme.fonts.heading);
  expectedTheme.fonts.body = normalizeBundledFontName(expectedTheme.fonts.body);
  assert.deepEqual(rebuilt.site, base.site);
  assert.deepEqual(rebuilt.theme, expectedTheme);
});

test('legacy bundled font names normalize without changing custom families', () => {
  assert.equal(normalizeBundledFontName('Source Serif 4'), BUNDLED_FONT_NAMES.serif);
  assert.equal(normalizeBundledFontName('Source Sans 3'), BUNDLED_FONT_NAMES.sans);
  assert.equal(normalizeBundledFontName('Atkinson Hyperlegible'), 'Atkinson Hyperlegible');

  const base = defaultConfig();
  base.theme.fonts = {
    heading: 'Source Serif 4',
    body: 'Source Sans 3',
    google_fonts_url: '',
  };
  const answers = answersFromConfig(base);
  assert.equal(answers.headingFont, BUNDLED_FONT_NAMES.serif);
  assert.equal(answers.bodyFont, BUNDLED_FONT_NAMES.sans);
  assert.deepEqual(applyAnswers(base, {}).theme.fonts, {
    heading: BUNDLED_FONT_NAMES.serif,
    body: BUNDLED_FONT_NAMES.sans,
    google_fonts_url: '',
  });
});

/* --- theme.motion --------------------------------------------------------- */

test('the shipped motion block survives a round trip through the wizard', () => {
  const base = defaultConfig();
  assert.deepEqual(base.theme.motion, MOTION_PRESETS.find((p) => p.id === 'default').motion);
  const answers = answersFromConfig(base);
  assert.deepEqual(answers.motion, base.theme.motion);
  const written = jsYaml.load(renderFiles(applyAnswers(base, answers))['_data/theme.yml']);
  assert.deepEqual(written.motion, base.theme.motion);
});

test('a hand-written motion block is written back exactly as it was found', () => {
  const base = defaultConfig();
  // Not one of the named speeds, and in seconds rather than milliseconds: both
  // are legal CSS and neither is the wizard's spelling.
  base.theme.motion = { fast: '0.1s', base: '0.2s', slow: '0.3s', ease: 'ease-out' };
  const config = applyAnswers(base, answersFromConfig(base));
  assert.deepEqual(config.theme.motion, { fast: '0.1s', base: '0.2s', slow: '0.3s', ease: 'ease-out' });
});

test('choosing a named speed replaces the whole block, and an absent one stays absent', () => {
  const calm = MOTION_PRESETS.find((preset) => preset.id === 'calm');
  const chosen = applyAnswers(defaultConfig(), { motion: { ...calm.motion } });
  assert.deepEqual(chosen.theme.motion, calm.motion);

  const bare = defaultConfig();
  delete bare.theme.motion;
  const answers = answersFromConfig(bare);
  assert.equal(answers.motion, null);
  assert.equal('motion' in applyAnswers(bare, answers).theme, false);
});

/* --- keys no question asks about ------------------------------------------ */

test('site keys the wizard never asks about survive the round trip', () => {
  const base = defaultConfig();
  // `demo` is answered by no question (it ships as `true` and a fork turns it
  // off); `contact.ask_in_open` is the same shape one level down. Neither may
  // be dropped by a merge that only knows about the questions.
  base.site.demo = true;
  base.site.contact = { ...(base.site.contact || {}), ask_in_open: true };

  const config = applyAnswers(base, { ...answersFromConfig(base), siteName: 'Renamed' });
  const written = jsYaml.load(renderFiles(config)['_data/site.yml']);
  assert.equal(written.name, 'Renamed');
  assert.equal(written.demo, true);
  assert.equal(written.contact.ask_in_open, true);

  // And a fork that turned the demo banner off keeps it off.
  const off = defaultConfig();
  off.site.demo = false;
  assert.equal(jsYaml.load(renderFiles(applyAnswers(off, {}))['_data/site.yml']).demo, false);
});

test('a site.yml link_access block survives the wizard round trip', () => {
  // No question asks about link access, so a merge that only knows the
  // questions must carry the block (levels mapping, hosts list of mappings)
  // through untouched — the /setup/ wizard starts from the current site.yml.
  const base = defaultConfig();
  base.site.link_access = {
    levels: { members: { label: 'Members only', icon: 'lock', note: 'Sign-in required.', request_url: '' } },
    hosts: [
      { match: 'workspace.example.org/p/', name: 'Workspace' },
      { match: 'workspace.example.org', name: 'Workspace', access: 'members' },
      { match: 'github.com/o/r/releases/download/', name: 'File library', download: true },
    ],
  };

  const config = applyAnswers(base, { ...answersFromConfig(base), siteName: 'Renamed' });
  const written = jsYaml.load(renderFiles(config)['_data/site.yml']);
  assert.equal(written.name, 'Renamed');
  assert.deepEqual(written.link_access, base.site.link_access);
});

test('the submission page copy is answerable in the wizard', () => {
  const answers = answersFromConfig(defaultConfig());
  assert.equal(typeof answers.submitTurnaround, 'string');
  assert.ok(answers.submitTurnaround.trim() !== '', 'the shipped config promises a turnaround');
  assert.equal(typeof answers.submitReviewNote, 'string');

  const config = applyAnswers(defaultConfig(), {
    submitTurnaround: 'A coach reviews it within a week.',
    submitReviewNote: 'Do not send us patient data.',
  });
  assert.equal(config.site.submit.turnaround, 'A coach reviews it within a week.');
  assert.equal(config.site.submit.review_note, 'Do not send us patient data.');
});

test('new fields and groups replace the base schema wholesale', () => {
  const config = applyAnswers(defaultConfig(), {
    groups: [{ key: 'only', title: 'Only' }],
    fields: [{ key: 'title', label: 'Title', type: 'text' }],
  });
  assert.equal(config.schema.fields.length, 1);
  assert.deepEqual(config.schema.groups, [{ key: 'only', title: 'Only' }]);
});

test('slugify and snakeKey normalise human input', () => {
  assert.equal(slugify('Épidémiologie & Surveillance!'), 'epidemiologie-surveillance');
  assert.equal(snakeKey('Data sources'), 'data_sources');
  assert.equal(snakeKey('AI Tools & Models'), 'ai_tools_models');
  assert.equal(snakeKey('2024 cohort'), 'field_2024_cohort');
  assert.equal(snakeKey('  '), '');
});

test('GitHub URLs escape the branch and the path', () => {
  assert.equal(
    githubEditFileUrl('org/repo', 'main', '_data/site.yml'),
    'https://github.com/org/repo/edit/main/_data/site.yml'
  );
  assert.equal(githubEditFileUrl('', 'main', 'x'), '', 'no repository, no link');
  assert.match(
    githubNewFileUrl('org/repo', 'main', '_data/site.yml', 'name: x'),
    /\?filename=_data%2Fsite\.yml&value=name/
  );
  assert.equal(prefillNoticeIfTooLong('x'.repeat(7001)), true);
  assert.equal(prefillNoticeIfTooLong('x'), false);
});

test('colour helpers implement WCAG contrast', () => {
  assert.deepEqual(parseHexColor('#FFF'), { r: 255, g: 255, b: 255 });
  assert.equal(parseHexColor('not a colour'), null);
  assert.equal(contrastRatio('#000000', '#FFFFFF'), 21);
  assert.equal(contrastRatio('#FFFFFF', '#FFFFFF'), 1);
  assert.equal(contrastRatio('#zzz', '#FFFFFF'), null);
  assert.equal(meetsAA('#5A6573', '#FFFFFF'), true);
  assert.equal(meetsAA('#CCCCCC', '#FFFFFF'), false);
  assert.equal(isHexColor('#1D4E89'), true);
  assert.equal(isHexColor('#1D4'), false, 'the wizards insist on six digits');
});

test('derivePrimaryDark produces a banner colour that carries light text', () => {
  for (const primary of ['#1D4E89', '#44499C', '#1F6F50', '#475569', '#FF8F00']) {
    const dark = derivePrimaryDark(primary);
    assert.equal(isHexColor(dark), true, primary);
    assert.ok(meetsAA('#F7F9FC', dark, 7), `${dark} derived from ${primary}`);
  }
  assert.equal(derivePrimaryDark('nonsense'), 'nonsense');
});
