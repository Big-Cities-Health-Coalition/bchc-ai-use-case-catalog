---
layout: default
title: "Submit"
summary: "Propose a new entry for the catalog."
permalink: /submit/
scripts:
  - "/assets/js/submit/fields.js"
  - "/assets/js/submit/validate.js"
  - "/assets/js/submit/repeatable.js"
  - "/assets/js/submit/preview.js"
  - "/assets/js/submit/draft.js"
  - "/assets/js/submit/handoff.js"
  - "/assets/js/submit/review.js"
  - "/assets/js/submit/steps.js"
  - "/assets/js/submit/shortform.js"
  - "/assets/js/submit.js"
---
{%- comment -%}
  The submission form. Every control is generated from _data/schema.yml — no
  field key appears below. `prompt` is the visible question, `label` is the
  heading the GitHub issue form uses (and the one the scaffolder reads back),
  and `f.key` is the query-parameter name shared by both.

  Data attributes read by assets/js/submit*.js:
    [data-submit-form]        the form; carries repo/template/copy configuration
    [data-field=<key>]        one field wrapper
      data-type               schema type
      data-required           "true" when an answer is needed
      data-label              schema label (issue-form heading + error summary)
      data-question           the visible question, for error messages
      data-error              schema `error:` override, "" when unset
      data-slot               card slot: badge | chip | meta | icon | line
      data-weight             schema weight, for card slot truncation order
      data-prefill            "false" when GitHub cannot prefill this control
    [data-preview-panel]      the card preview; hidden until the JS opens it, so
                              it never appears as a dead panel without scripts
    [data-section=<key>]      one form step
      [data-step-nav]         its Back / Next bar; assets/js/submit/steps.js
                              shows one section at a time and drives these
                              (data-step-action="back|next"). Ships hidden and
                              is removed when the schema has a single section.
    [data-step-finish]        the submit controls (check-your-answers, email,
                              copy buttons); the stepper shows it on the last
                              step only. The status live regions, draft buttons
                              and fallback sit outside it on purpose — hiding a
                              role="status" region silences it
    [data-shortform]          the hide-optional-questions bar, with
                              [data-shortform-toggle] and [data-shortform-note]
                              (assets/js/submit/shortform.js); removed at boot
                              when every question is required
    [data-review]             empty container the "check your answers" step and
                              the confirmation panel are rendered into
    [data-review-next]        <template> holding the full "what happens next"
    [data-form-chrome]        parts of the form hidden while the review shows
    [data-option-view=k__i]   <template> for option i of field k on the card
    [data-line-view=<key>]    <template> for a `card: line` field
      data-role               "title" / "summary" — the two reserved keys every
                              entry has (see _data/schema.yml header), used by
                              the card preview
{%- endcomment -%}
{%- assign cfg = site.data.site -%}
{%- assign schema = site.data.schema -%}
{%- assign singular = schema.entry.singular | default: 'Entry' -%}
{%- assign ff = schema.fields | form_fields -%}
{%- assign form_groups = schema.groups | groups_for: ff -%}
{%- comment -%} The first `links` question the form asks, in schema order: a `file`
question sends a file the upload cannot take (over 25 MB, or kept in a shared
workspace) there as a link. No such question, no sentence. The GitHub issue
form says the same (assets/js/configurator/issue-template.js). {%- endcomment -%}
{%- assign file_link_label = '' -%}
{%- assign file_link_fields = schema.fields | where: 'type', 'links' -%}
{%- for file_link_field in file_link_fields -%}
  {%- assign file_link_candidate = file_link_field.label | strip -%}
  {%- if file_link_field.form != false and file_link_candidate != '' -%}{%- assign file_link_label = file_link_candidate -%}{%- break -%}{%- endif -%}
{%- endfor -%}
{%- assign badge_fields = ff | card_fields: 'badge' -%}
{%- assign badge_field = badge_fields | first -%}
{%- assign chip_fields = ff | card_fields: 'chip' -%}
{%- assign chip_field = chip_fields | first -%}
{%- assign line_fields = ff | card_fields: 'line' -%}
{%- assign icon_fields = ff | card_fields: 'icon' -%}
{%- assign fallback_email = cfg.submit.fallback_email | default: cfg.organization.contact_email | default: '' -%}
{%- comment -%}
  The catalog's repository, and with it the whole GitHub route: the form's
  no-script action, the prefilled issue, the "press Submit new issue" step. A
  site can be published without one — the showcase examples are built that way
  on purpose (see docs/showcase-plan.md), and a fork that has not filled in
  `github.repository` yet is in the same position. Rather than hand out a link
  to `github.com//issues/new`, the page says there is nowhere to send answers
  and keeps everything that still works: the questions, the card preview, the
  copy-out buttons and the email fallback. Tested with `!= ''`, not for
  truthiness — an empty string is truthy in Liquid.
{%- endcomment -%}
{%- assign gh_repo = cfg.github.repository | default: '' -%}

{%- comment -%}
  `submit.accepting: false` pauses intake without removing the page: readers get
  a clear notice (and the email route when one is configured) instead of a form
  whose submissions nobody will review. Distinct from `modules.submit`, which
  removes the page and its links from the build entirely. A site.yml written
  before the key existed has no `accepting` at all, which is not `false`, so
  older deployments keep accepting.
{%- endcomment -%}
{%- if cfg.submit.accepting == false -%}
<section class="max-w-prose">
  <span class="eyebrow">Contribute</span>
  <h1 class="page-title mt-2">Submissions are paused</h1>
</section>
<div class="mt-8 max-w-xl">
  {%- assign sub_closed_msg = cfg.submit.closed_message | default: '' -%}
  {%- if sub_closed_msg == '' -%}{%- capture sub_closed_msg -%}The maintainers are not taking new {{ singular | downcase }} submissions right now. Check back soon — everything already published stays available.{%- endcapture -%}{%- endif -%}
  {% include empty-state.html icon='clock' image=cfg.submit.closed_image title='Not accepting submissions right now' body=sub_closed_msg %}
  {%- if fallback_email != '' -%}
  <p class="mt-4 text-sm text-brand-muted">Working on something time-sensitive? <a class="font-medium text-brand-primary underline-offset-2 hover:underline" href="mailto:{{ fallback_email }}?subject={{ singular | prepend: '[' | append: '] New entry' | uri_escape }}">Email the maintainers</a> and they will pick it up when intake reopens.</p>
  {%- endif -%}
</div>
{%- else -%}

{%- assign sub_art = cfg.submit.image | default: '' -%}
<section{% if sub_art != '' %} class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center"{% endif %}>
  <div class="max-w-prose">
  <span class="eyebrow">Contribute</span>
  <h1 class="page-title mt-2">Submit {{ singular | downcase | with_article }}</h1>
  <p class="mt-4 text-lg text-brand-muted">{{ cfg.submit.intro | default: 'Tell us about your work. Maintainers review every submission before it is published.' }}</p>
  <p class="mt-3 text-sm text-brand-muted">Nothing is sent from this page. Your answers stay in this browser until you press a button.{% if gh_repo != '' %}{% if fallback_email != '' %} You'll need a free GitHub account — or use <em>Email it instead</em>.{% else %} You'll need a free GitHub account.{% endif %}{% endif %}</p>
  {%- if gh_repo != '' -%}
  <ol class="mt-4 space-y-1 text-sm text-brand-muted" data-form-chrome>
    <li><strong class="text-brand-ink">1.</strong> Answer the questions below.</li>
    <li><strong class="text-brand-ink">2.</strong> Check your answers, then send them to GitHub.</li>
    <li><strong class="text-brand-ink">3.</strong> Press <em>Submit new issue</em> on GitHub — that is what actually submits it.</li>
  </ol>
  {%- else -%}
  <p class="mt-4 flex items-start gap-1.5 rounded-lg border border-brand-line bg-surface-base p-4 text-sm text-brand-ink" data-form-chrome>
    {% include icon.html name='warning' size='sm' class='mt-0.5 shrink-0' %}<span>This site has no catalog repository behind it, so nothing here can be submitted. The questions, the card preview and the copy buttons all work — the last step, which on a published catalog opens a prefilled GitHub issue for a maintainer to review, has nowhere to go{% if fallback_email != '' %}, so <em>Email it instead</em> is the way out of this page{% endif %}.</span>
  </p>
  {%- endif -%}
  {%- if cfg.modules.governance -%}
  <p class="mt-3 text-sm text-brand-muted">Before you start, the <a class="font-medium text-brand-primary underline-offset-2 hover:underline" href="{{ '/governance/' | relative_url }}">governance page</a> has the five things reviewers check and the rules on privacy and licensing — you keep ownership of anything you share.</p>
  {%- endif -%}
  </div>
  {% if sub_art != '' %}<div class="page-art hidden lg:block" aria-hidden="true">{% include picture.html src=sub_art alt='' sizes="256px" class="h-auto w-full" %}</div>{% endif %}
</section>

{%- comment -%}
  Without scripts there is no validation, no preview and no repeatable link
  rows, but the form itself still works: it is a plain GET to GitHub's issue
  form, and the field names are the issue-form input ids. The skeleton below is
  the same `### Label` shape assets/js/submit/handoff.js builds, for anyone who
  would rather paste than fill in.
{%- endcomment -%}
<noscript>
  <div class="mt-8 rounded-lg border border-brand-line bg-surface-base p-4 text-sm text-brand-ink">
    <p class="font-semibold">JavaScript is off, so this page cannot check your answers, preview your card or save a draft.</p>{% if gh_repo != '' %}
    <p class="mt-2 text-brand-muted">The form still works. Fill it in and press <em>Check your answers</em>: without scripts that goes straight to the GitHub issue form with your answers carried across, where you can read them over before pressing <em>Submit new issue</em>. Questions that ask for several links can only be answered on GitHub.</p>{% else %}
    <p class="mt-2 text-brand-muted">And this site has no catalog repository behind it, so there is nothing the form can be sent to either. The questions below are still the real ones — the outline underneath is what a submission looks like.</p>{% endif %}{% if fallback_email != '' %}
    <p class="mt-2 text-brand-muted">Or <a class="font-semibold text-brand-primary underline underline-offset-2 hover:no-underline" href="mailto:{{ fallback_email }}?subject={{ singular | prepend: '[' | append: '] New entry' | uri_escape }}">email it instead</a> and paste your answers into the message.</p>{% endif %}
    <p class="mt-3 font-semibold">{% if gh_repo != '' %}Or draft it here first{% else %}What a submission looks like{% endif %}</p>
    <p class="mt-1 text-brand-muted">{% if gh_repo != '' %}These are the same headings the GitHub form asks under. Write your answers under each one, then <a class="font-semibold text-brand-primary underline underline-offset-2 hover:no-underline" href="https://github.com/{{ gh_repo }}/issues/new?template=new-entry.yml">open the issue form</a> and paste each answer into its matching question.{% else %}An entry arrives as a GitHub issue in this shape: one heading per question, the answer underneath. The automation reads exactly this format.{% endif %}</p>
    <textarea class="field-input mt-2 min-h-[10rem] font-mono text-xs" rows="12" readonly aria-label="Issue outline to copy">{% for ng in form_groups %}{% assign ng_fields = ff | fields_in_group: ng.key %}{% for nf in ng_fields %}{% unless nf.type == 'file' %}### {{ nf.label }}

{% endunless %}{% endfor %}{% endfor %}</textarea>
  </div>
</noscript>

<div class="mt-10 grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)_19rem]">

  <nav class="hidden lg:col-start-1 lg:row-start-1 lg:block" aria-label="Form sections" data-form-chrome>
    <div class="progress-rail lg:sticky lg:top-24">
      <p class="progress-count" data-progress-count>0 of {{ form_groups.size }} sections complete</p>
      <ul class="mt-3">
        {%- for g in form_groups %}
        <li class="progress-step">
          <a class="progress-link" href="#section-{{ g.key }}" data-progress-link="{{ g.key }}" data-done="false">
            <span class="progress-dot" aria-hidden="true"><span class="progress-num">{{ forloop.index }}</span>{% include icon.html name='check' size='xs' class='progress-check' %}</span>
            <span class="pt-0.5">{{ g.title }}<span class="sr-only" data-progress-state> — not started</span></span>
            {%- comment -%}Filled in by assets/js/submit.js when a submit attempt finds problems in this section.{%- endcomment -%}
            <span class="ml-auto shrink-0 pt-0.5 text-xs font-semibold text-brand-accent" data-progress-errors hidden></span>
          </a>
        </li>
        {%- endfor %}
      </ul>
    </div>
  </nav>

  <div class="lg:col-start-3 lg:row-start-1">
    <details class="preview-panel lg:sticky lg:top-24" data-preview-panel hidden>
      <summary class="preview-summary">
        <span>Card preview</span>
        {% include icon.html name='chevron-down' size='sm' %}
      </summary>
      <p class="mt-3 hidden text-xs font-semibold uppercase tracking-[0.12em] text-brand-muted lg:block">Card preview</p>
      <p class="mt-1 text-xs text-brand-muted">This is how your entry will look in the catalog.</p>

      {%- comment -%}
        Structure and class names are copied from _includes/entry-card.html so
        the preview inherits the real card's styling, including the meta-line
        separator the stylesheet draws. The title is a <p>, not an <h3>: this is
        a picture of a card, and a heading here would sit under the panel's own
        heading level and break the page's heading order.
      {%- endcomment -%}
      <article class="entry-card mt-3" data-preview>
        <div class="entry-media" data-preview-media hidden>
          <img class="h-full w-full object-cover" alt="" referrerpolicy="no-referrer" data-preview-image>
        </div>
        <div class="entry-body">
          <p class="entry-meta" data-preview-meta hidden></p>
          <p class="entry-title line-clamp-2" data-preview-title>Your title appears here</p>
          <p class="entry-line" data-preview-line hidden></p>
          <p class="entry-summary" data-preview-summary hidden>Your one-sentence summary appears here.</p>
          <ul class="entry-chips" data-preview-chips hidden></ul>
        </div>
        <div class="entry-foot" data-preview-foot hidden>
          <div class="signal-strip" data-preview-signals></div>
        </div>
      </article>

      {%- if cfg.submit.review_note -%}
      <p class="mt-4 flex items-start gap-1.5 border-t border-brand-line pt-4 text-xs text-brand-ink">
        {% include icon.html name='warning' size='sm' class='mt-0.5 shrink-0' %}<span>{{ cfg.submit.review_note }}</span>
      </p>
      {%- endif -%}
    </details>
  </div>

  {%- comment -%}
    `action`/`method` are the no-JS route: GitHub's issue form reads the query
    string, and every control's `name` is the schema key, which is also the
    issue-form input id. With scripts on, the submit handler calls
    preventDefault() and builds the same URL itself (so it can validate first
    and drop anything GitHub cannot prefill). `novalidate` is *not* set here —
    assets/js/submit.js sets it at boot, so the browser's own required-field
    messages are the fallback when the script never runs.

    Without a repository there is no route to write down: the form is left with
    no `action`, and `data-repo` stays empty so the scripts take the same
    branch (assets/js/submit.js hands back the copy-out text instead of opening
    an issue).
  {%- endcomment -%}
  <form class="min-w-0 space-y-10 lg:col-start-2 lg:row-start-1"
        {% if gh_repo != '' %}action="https://github.com/{{ gh_repo }}/issues/new"
        method="get"
        {% endif %}data-submit-form
        data-repo="{{ gh_repo }}"
        data-template="new-entry.yml"
        data-title-prefix="[{{ singular }}] "
        data-fallback-email="{{ fallback_email }}"
        data-singular="{{ singular }}"
        data-entry-path="{{ schema.entry.path | default: 'catalog' }}"
        data-draft-key="{{ cfg.name | default: 'catalog' | slugify }}"
        data-section-count="{{ form_groups.size }}">

    <input type="hidden" name="template" value="new-entry.yml">

    <div class="draft-bar" data-draft-restore hidden data-form-chrome>
      <div>
        <p><strong>You have an unfinished draft</strong> <span data-draft-saved>saved on this device</span>.</p>
        <p class="text-xs text-brand-muted" data-draft-count></p>
      </div>
      <div class="flex gap-2">
        <button type="button" class="btn-secondary btn-sm" data-draft-action="restore">Restore it</button>
        <button type="button" class="btn-ghost btn-sm" data-draft-action="discard">Delete it and start fresh</button>
      </div>
    </div>

    {%- comment -%}
      Shown instead of the draft bar when the browser refuses localStorage.
      Private browsing is the common cause; a full quota is the other.
    {%- endcomment -%}
    <p class="draft-bar draft-bar--warn" data-draft-unavailable hidden>This browser will not save a draft — you may be in a private window. Copy your answers somewhere safe before you leave this page.</p>

    {%- comment -%}
      Small screens have no sticky rail, so this is the only place the
      submitter can see where they are in a long form. It rides just under the
      site header (h-16), below it in the stacking order.
    {%- endcomment -%}
    <div class="sticky top-16 z-20 -mx-4 border-b border-brand-line bg-surface-base/95 px-4 py-2 shadow-e2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden" data-form-chrome>
      <p class="truncate font-heading text-sm font-semibold text-brand-primary-dark" data-progress-section>{{ form_groups.first.title }}</p>
      <p class="progress-count" data-progress-line>0 of {{ form_groups.size }} sections complete</p>
    </div>

    {%- comment -%}
      The short form: one button hides every optional question, for anyone
      daunted by the full form (assets/js/submit/shortform.js). A scripting
      feature — removed at boot when every question is required.
    {%- endcomment -%}
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1" data-shortform data-js-only hidden data-form-chrome>
      <button type="button" class="btn-secondary btn-sm" data-shortform-toggle>Hide the optional questions</button>
      <p class="text-xs text-brand-muted" role="status" data-shortform-note hidden></p>
    </div>

    {%- comment -%}
      No `role="alert"`: the panel takes focus the moment it fills, so an
      assistive technology reads it as the new focus target. Announcing it as a
      live region as well makes it arrive twice.
    {%- endcomment -%}
    <div class="error-summary" tabindex="-1" data-error-summary hidden>
      <p class="error-summary-title">{% include icon.html name='warning' size='sm' %}<span data-error-summary-title>There is a problem</span></p>
      <ul class="mt-2 space-y-1 pl-6" data-error-summary-list></ul>
    </div>

    {%- comment -%}
      "Check your answers" and, after the hand-off, the confirmation panel are
      rendered here by assets/js/submit/review.js. Empty and hidden until then.
    {%- endcomment -%}
    <div data-review hidden></div>

    {%- for g in form_groups %}
    {%- assign group_fields = ff | fields_in_group: g.key %}
    <section class="form-section" id="section-{{ g.key }}" aria-labelledby="heading-{{ g.key }}" data-section="{{ g.key }}">
      <p class="eyebrow">Section {{ forloop.index }} of {{ form_groups.size }}</p>
      {%- comment -%}
        tabindex="-1": the stepper moves focus here on every step change, so
        the change itself is the announcement — no live region needed.
      {%- endcomment -%}
      <h2 class="section-title focus-target mt-1" id="heading-{{ g.key }}" tabindex="-1">{{ g.title }}</h2>
      {%- if g.description %}<p class="section-lead mt-1">{{ g.description }}</p>{% endif %}

      <div class="mt-6 space-y-7">
        {%- for f in group_fields %}
        {%- assign fid = 'f-' | append: f.key -%}
        {%- assign slot = f | card_slot -%}
        {%- assign describedby = fid | append: '-help ' | append: fid | append: '-error' -%}
        {%- assign question = f.prompt | default: f.label -%}
        {%- comment -%}
          Every control the generator emits is an input, a textarea or a
          dropdown — GitHub prefills all three from the query string. Nothing is
          unprefillable today, but the plumbing that says so is kept: change one
          field back to `checkboxes` and the form starts warning about it again.
        {%- endcomment -%}
        {%- assign prefillable = 'true' -%}
        <div class="field" id="{{ fid }}-field" data-field="{{ f.key }}" data-type="{{ f.type }}" data-required="{{ f.required | default: false }}"
             data-label="{{ f.label | escape }}" data-question="{{ question | escape }}" data-error="{{ f.error | escape }}"
             data-slot="{{ slot }}" data-weight="{{ f.weight | default: 5 }}"
             data-prefill="{{ prefillable }}" data-role="{% if f.key == 'title' %}title{% elsif f.key == 'summary' %}summary{% endif %}">

          {%- case f.type -%}
          {%- when 'select' or 'multiselect' -%}
            <fieldset>
              <legend class="field-label" id="{{ fid }}-legend">{{ question }}{% unless f.required %}<span class="font-normal text-brand-muted"> (optional)</span>{% endunless %}</legend>
              <p class="field-help mt-1" id="{{ fid }}-help">{{ f.description }}</p>
              {%- if f.type == 'select' and f.options.size > 6 -%}
                {%- comment -%} A legend does not name a <select>; point the control at it explicitly. {%- endcomment -%}
                <select class="field-input mt-2" id="{{ fid }}" name="{{ f.key }}" aria-labelledby="{{ fid }}-legend" aria-describedby="{{ describedby }}" {% if f.required %}required{% endif %}>
                  <option value="">Choose one…</option>
                  {%- for o in f.options -%}{%- assign om = f | option_meta: o -%}
                  <option value="{{ o | escape }}" data-option-index="{{ forloop.index0 }}" data-short="{{ om.short | escape }}">{{ o }}</option>
                  {%- endfor -%}
                </select>
              {%- else -%}
                <div class="{% if f.options.size > 6 %}field-options-wide{% else %}field-options{% endif %} mt-2">
                  {%- for o in f.options -%}{%- assign om = f | option_meta: o -%}
                  <label class="field-option">
                    <input class="{% if f.type == 'select' %}radio{% else %}checkbox{% endif %}"
                           type="{% if f.type == 'select' %}radio{% else %}checkbox{% endif %}"
                           id="{{ fid }}-{{ forloop.index0 }}" name="{{ f.key }}" value="{{ o | escape }}"
                           data-option-index="{{ forloop.index0 }}" data-short="{{ om.short | escape }}"
                           {% comment %}HTML has no way to say "tick at least one", so a required multiselect keeps aria-required and is checked by script only.{% endcomment %}
                           {% if f.required %}{% if f.type == 'select' %}required{% else %}aria-required="true"{% endif %}{% endif %} aria-describedby="{{ describedby }}">
                    <span><span class="font-medium">{{ o }}</span>{% if om.description != '' %}<span class="field-option-desc">{{ om.description }}</span>{% endif %}</span>
                  </label>
                  {%- endfor -%}
                  {%- comment -%}
                    Radio buttons cannot be un-picked, so an optional group of
                    them needs an explicit way out. Tick boxes already have one.
                  {%- endcomment -%}
                  {%- if f.type == 'select' and f.required != true -%}
                  <label class="field-option">
                    <input class="radio" type="radio" name="{{ f.key }}" value="" data-clear>
                    <span><span class="font-medium">Skip this one</span></span>
                  </label>
                  {%- endif -%}
                </div>
              {%- endif -%}
            </fieldset>

          {%- when 'links' -%}
            <fieldset>
              <legend class="field-label">{{ question }}{% unless f.required %}<span class="font-normal text-brand-muted"> (optional)</span>{% endunless %}</legend>
              <p class="field-help mt-1" id="{{ fid }}-help">{{ f.description }}</p>
              <div class="mt-2 space-y-2" data-links-rows></div>
              <template data-links-template>
                <div class="links-row">
                  <label class="block text-xs font-medium text-brand-muted">Label
                    <input class="field-input mt-1" type="text" data-links-label placeholder="Evaluation report">
                  </label>
                  <label class="block text-xs font-medium text-brand-muted">Link
                    <input class="field-input mt-1" type="url" data-links-url placeholder="https://example.org/report.pdf">
                  </label>
                  <button type="button" class="btn-ghost btn-sm justify-self-start" data-links-remove>Remove</button>
                </div>
              </template>
              <button type="button" class="btn-secondary btn-sm mt-2" data-links-add>Add another link</button>
            </fieldset>

          {%- when 'images' -%}
            <label class="field-label" for="{{ fid }}">{{ question }}{% unless f.required %}<span class="font-normal text-brand-muted"> (optional)</span>{% endunless %}</label>
            <p class="field-help" id="{{ fid }}-help">{{ f.description }}</p>
            <p class="field-note" id="{{ fid }}-note">You can drag image files straight into the GitHub issue on the next screen. If your images are already online, paste their addresses here instead — one per line, optionally followed by <code>| alt text</code>. PNG, JPEG, GIF and WebP images are copied into the repository; anything else is left as a link for a maintainer.</p>
            <textarea class="field-input min-h-[6rem]" id="{{ fid }}" name="{{ f.key }}" rows="3"
                      aria-describedby="{{ describedby }} {{ fid }}-note" {% if f.required %}required{% endif %}
                      placeholder="https://example.org/screenshot.png | The daily brief queue"></textarea>
            <ul class="image-previews" data-image-previews hidden></ul>

          {%- when 'markdown' -%}
            <label class="field-label" for="{{ fid }}">{{ question }}{% unless f.required %}<span class="font-normal text-brand-muted"> (optional)</span>{% endunless %}</label>
            <p class="field-help" id="{{ fid }}-help">{{ f.description }}{% unless f.description contains 'arkdown' %} Markdown is supported — use <code>##</code> for headings.{% endunless %}</p>
            <textarea class="field-input min-h-[18rem] font-mono text-sm" id="{{ fid }}" name="{{ f.key }}" rows="16"
                      aria-describedby="{{ describedby }}" {% if f.required %}required{% endif %}>{{ f.placeholder }}</textarea>

          {%- when 'textarea' -%}
            <label class="field-label" for="{{ fid }}">{{ question }}{% unless f.required %}<span class="font-normal text-brand-muted"> (optional)</span>{% endunless %}</label>
            <p class="field-help" id="{{ fid }}-help">{{ f.description }}</p>
            <textarea class="field-input min-h-[6rem]" id="{{ fid }}" name="{{ f.key }}" rows="3"
                      aria-describedby="{{ describedby }}" {% if f.required %}required{% endif %}
                      placeholder="{{ f.placeholder | escape }}"></textarea>

          {%- when 'list' -%}
            <label class="field-label" for="{{ fid }}">{{ question }}{% unless f.required %}<span class="font-normal text-brand-muted"> (optional)</span>{% endunless %}</label>
            <p class="field-help" id="{{ fid }}-help">{{ f.description }} One per line, or separated by commas.</p>
            <textarea class="field-input min-h-[5rem]" id="{{ fid }}" name="{{ f.key }}" rows="3"
                      aria-describedby="{{ describedby }}" {% if f.required %}required{% endif %}
                      placeholder="{{ f.placeholder | escape }}"></textarea>

          {%- when 'file' -%}
            <p class="field-label">{{ question }}</p>
            <p class="field-help" id="{{ fid }}-help">{{ f.description }}</p>
            <p class="field-note">Files can't be attached from this page. Drag <code>{{ f.filename | default: 'the file' }}</code> into the GitHub issue on the next screen and a maintainer will add it to your entry.{% if file_link_label != '' %} Over 25 MB, or kept in a shared workspace? Paste a link in “{{ file_link_label | escape }}” instead.{% endif %}</p>

          {%- when 'boolean' -%}
            <label class="field-option">
              <input class="checkbox" type="checkbox" id="{{ fid }}" name="{{ f.key }}" value="true" aria-describedby="{{ describedby }}">
              <span><span class="font-medium">{{ question }}</span>{% if f.description %}<span class="field-option-desc">{{ f.description }}</span>{% endif %}</span>
            </label>
            <p class="sr-only" id="{{ fid }}-help">{{ f.description }}</p>

          {%- else -%}
            {%- assign input_type = 'text' -%}
            {%- if f.type == 'url' or f.type == 'image' -%}{%- assign input_type = 'url' -%}{%- endif -%}
            {%- if f.type == 'email' -%}{%- assign input_type = 'email' -%}{%- endif -%}
            {%- if f.type == 'date' -%}{%- assign input_type = 'date' -%}{%- endif -%}
            {%- if f.type == 'number' -%}{%- assign input_type = 'number' -%}{%- endif -%}
            <label class="field-label" for="{{ fid }}">{{ question }}{% unless f.required %}<span class="font-normal text-brand-muted"> (optional)</span>{% endunless %}</label>
            <p class="field-help" id="{{ fid }}-help">{{ f.description }}</p>
            <input class="field-input" type="{{ input_type }}" id="{{ fid }}" name="{{ f.key }}"
                   aria-describedby="{{ describedby }}" {% if f.required %}required{% endif %}
                   {% if input_type == 'email' %}autocomplete="email"{% endif %}
                   placeholder="{{ f.placeholder | escape }}">
          {%- endcase -%}

          <p class="field-error" id="{{ fid }}-error" hidden>{% include icon.html name='warning' size='sm' %}<span data-error-text></span></p>
        </div>
        {%- endfor %}
      </div>

      {%- comment -%}
        Stepped navigation (assets/js/submit/steps.js). Without scripts the
        form is one long page, so this ships hidden; the container carries the
        data-js-only reveal, and the stepper manages the two buttons itself.
      {%- endcomment -%}
      <div class="mt-8 flex flex-wrap items-center gap-3" data-step-nav data-js-only hidden>
        <button type="button" class="btn-secondary" data-step-action="back">Back</button>
        <button type="button" class="btn-primary" data-step-action="next">Next section {% include icon.html name='arrow-right' size='sm' %}</button>
      </div>
    </section>
    {%- endfor %}

    <div class="space-y-4 border-t border-brand-line pt-6" data-form-chrome>
      <p class="field-note" role="status" data-length-note hidden></p>

      {%- comment -%}
        Only the submit controls wait for the last step. The live regions, the
        draft buttons and the fallback stay outside [data-step-finish]: hiding
        a role="status" region silences it, and autosave feedback, the length
        warning and the submit status (which the fallback's copy button also
        writes to, from any step) belong to every step, not just the send-off.
      {%- endcomment -%}
      <div class="rounded-lg border border-brand-line bg-surface-base p-4 text-sm text-brand-muted" role="status" data-submit-status hidden></div>

      <div class="space-y-4" data-step-finish>
        <div class="flex flex-wrap items-center gap-3">
          {%- comment -%}With no repository this button only leads to the review panel, which
          is a scripting feature — so without scripts it leads nowhere and ships hidden, like
          the copy and draft buttons below it.{%- endcomment -%}
          <button type="submit" class="btn-primary"{% if gh_repo == '' %} data-js-only hidden{% endif %}>Check your answers {% include icon.html name='arrow-right' size='sm' %}</button>
          {%- comment -%}Only offered when there is somewhere for the email to go.{%- endcomment -%}
          {%- if fallback_email != '' %}
          <button type="button" class="btn-secondary" data-action="email" data-js-only hidden>Email it instead</button>
          {%- endif %}
        </div>
        <div class="flex flex-wrap items-center gap-2" data-js-only hidden>
          <button type="button" class="btn-ghost btn-sm" data-action="copy-markdown">Copy as Markdown</button>
          <button type="button" class="btn-ghost btn-sm" data-action="copy-yaml">Copy as YAML front matter</button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2" data-js-only hidden>
        <button type="button" class="btn-ghost btn-sm" data-draft-action="save">Save and come back later</button>
        <button type="button" class="btn-ghost btn-sm" data-draft-action="clear">Delete the saved draft</button>
      </div>
      <p class="draft-status" role="status" aria-live="polite" data-draft-status></p>

      <div class="space-y-2" data-fallback hidden>
        <label class="field-label" for="fallback-body">{% if gh_repo != '' %}Your answers, ready for the GitHub form{% else %}Your answers, in the shape a submission takes{% endif %}</label>
        <p class="field-help">{% if gh_repo != '' %}Each heading below matches a question on the GitHub issue form. If your answers did not travel with the link, paste each one into its matching question, then press <em>Submit new issue</em>.{% else %}On a published catalog this is what the maintainers receive: one heading per question, your answer underneath.{% endif %}</p>
        <textarea class="field-input min-h-[10rem] font-mono text-xs" id="fallback-body" readonly rows="10" data-fallback-body></textarea>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="btn-secondary btn-sm" data-action="copy-fallback">Copy to clipboard</button>
          {%- comment -%}Shown with a prefilled link after a blocked popup, or an empty-form link when the answers were too long to carry.{%- endcomment -%}
          <a class="btn-ghost btn-sm" href="#" target="_blank" rel="noopener" data-fallback-link hidden>Open the issue form on GitHub {% include icon.html name='arrow-right' size='sm' %}</a>
        </div>
      </div>
    </div>
  </form>
</div>

{%- comment -%}
  Pre-rendered fragments the preview clones. Rendering them with Liquid keeps
  every icon and tone decision in the schema, and lets the JS use cloneNode +
  textContent instead of building HTML from strings.
{%- endcomment -%}
<div hidden data-preview-templates>
  {%- comment -%}
    The long "what happens next", shown in the review panel. It lives in Liquid
    so _data/site.yml keeps owning the words.
  {%- endcomment -%}
  <template data-review-next>
    <p class="font-semibold text-brand-ink">What happens next</p>
    <ol class="mt-2 space-y-1.5 text-sm text-brand-muted">
      {%- if gh_repo != '' %}
      <li>1. Sending opens a GitHub issue with your answers already filled in. Nothing is submitted until you press <em>Submit new issue</em> there.</li>
      {%- else %}
      <li>1. On a published catalog this is where your answers open a prefilled GitHub issue. This site has no repository behind it, so the button hands you the text instead.</li>
      {%- endif %}
      <li>2. Automation turns the issue into a draft page and opens a pull request.</li>
      <li>3. {{ cfg.submit.turnaround | default: 'A maintainer reviews it — usually within a few days.' }}</li>
    </ol>
    {%- if cfg.submit.review_note %}
    <p class="mt-3 flex items-start gap-1.5 rounded-md bg-brand-accent/10 p-2 text-sm text-brand-ink">
      {% include icon.html name='warning' size='sm' class='mt-0.5 shrink-0' %}<span>{{ cfg.submit.review_note }}</span>
    </p>
    {%- endif %}
  </template>

  {%- if badge_field -%}
  {%- for o in badge_field.options -%}{%- assign om = badge_field | option_meta: o -%}
  <template data-option-view="{{ badge_field.key }}__{{ forloop.index0 }}"><span class="badge" data-tone="{{ om.tone }}">{% if om.icon != '' %}{% include icon.html name=om.icon size='xs' %}{% endif %}<span>{{ om.short }}</span></span></template>
  {%- endfor -%}
  {%- endif -%}

  {%- if chip_field -%}
  {%- for o in chip_field.options -%}{%- assign om = chip_field | option_meta: o -%}
  <template data-option-view="{{ chip_field.key }}__{{ forloop.index0 }}"><li><span class="chip" title="{{ o | escape }}">{{ om.short }}</span></li></template>
  {%- endfor -%}
  {%- endif -%}

  {%- for f in icon_fields -%}
  {%- for o in f.options -%}{%- assign om = f | option_meta: o -%}
  <template data-option-view="{{ f.key }}__{{ forloop.index0 }}"><span class="{% if om.tone == 'warn' %}signal-warn{% else %}signal{% endif %}" title="{{ f.label | escape }}: {{ o | escape }}">{% if om.icon != '' %}{% include icon.html name=om.icon size='xs' %}{% endif %}<span aria-hidden="true">{{ om.short }}</span><span class="sr-only">{{ f.label }}: {{ o }}</span></span></template>
  {%- endfor -%}
  {%- endfor -%}

  {%- for f in line_fields -%}
  <template data-line-view="{{ f.key }}">{% include icon.html name=f.icon size='sm' class='mt-0.5 text-brand-primary' %}<span class="line-clamp-2" data-line-text></span></template>
  {%- endfor -%}

  <template data-chip-overflow><li><span class="chip-neutral" data-overflow-text></span></li></template>
  {%- comment -%}One trailing "+n" for the signal strip, matching the card's cap of four items in total.{%- endcomment -%}
  <template data-signal-overflow><span class="signal" data-overflow-text></span></template>
</div>
{%- endif -%}
