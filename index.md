---
layout: default
title: "Home"
include_carousel: true
full_width: true
---
{%- comment -%}
Home page. Above the fold: what the collection is, a search box that submits into
the catalog, and browse-by tiles built from the card-facing facet fields. Then
featured/recent cards and an honest stat line — every number is counted from the
entries, never invented. All labels come from _data/schema.yml.

On a showcase landing build (scripts/build_showcase.mjs writes `showcase.role`
into _config; see docs/showcase-plan.md) this page is the landing that
introduces the template and its examples instead, and the catalog it would
otherwise link to is not in that build at all. Every other build — a fork,
`jekyll serve`, CI, and each of the examples themselves — takes the else branch.
{%- endcomment -%}
{%- if site.showcase.role == 'landing' -%}
{% include showcase-landing.html %}
{%- else -%}
{%- assign cfg = site.data.site -%}
{%- assign schema = site.data.schema -%}
{%- assign plural = schema.entry.plural | default: 'Entries' -%}
{%- assign singular = schema.entry.singular | default: 'Entry' -%}
{%- assign epath = schema.entry.path | default: 'catalog' -%}
{%- assign catalog_url = '/' | append: epath | append: '/' -%}
{%- assign entries = site.pages | where: 'layout', 'entry' | sort: 'published', 'first' | reverse -%}
{%- comment -%} Deprecated entries (schema `entry.status_key`) still count in the stats —
they happened — but they do not get featured, listed beside the hero or shown as recent. {%- endcomment -%}
{%- assign live = entries | live_entries: schema -%}
{%- assign total = entries | size -%}
{%- assign featured = live | where: 'featured', true -%}
{%- assign featured_count = cfg.home.featured_count | default: 6 -%}
{%- if featured.size < featured_count -%}
  {%- assign fill = featured_count | minus: featured.size -%}
  {%- assign others = live | where_exp: 'e', 'e.featured != true' | slice: 0, fill -%}
  {%- assign featured = featured | concat: others -%}
{%- endif -%}
{%- assign featured = featured | slice: 0, featured_count -%}
{%- comment -%} The carousel, when it renders, sits above the "Recently added" grid at
every width, so its first card holds the page's one LCP candidate and the grid's does
not. {%- endcomment -%}
{%- assign home_has_carousel = false -%}
{%- if cfg.modules.carousel and featured.size > 0 -%}{%- assign home_has_carousel = true -%}{%- endif -%}
{%- assign facet_fields = schema.fields | facet_fields -%}

{%- comment -%}
Browse-by: up to four facet fields with fixed options. Fields that also appear on the
card as a badge, chip or signal glyph come first, in schema order — those are the taxonomy the site
leads with; remaining facets fill in only if fewer than four qualify.
{%- endcomment -%}
{%- assign browse_fields = "" | split: "" -%}
{%- for f in schema.fields -%}
  {%- if f.facet and f.options and f.card and f.card != 'meta' and browse_fields.size < 4 -%}{%- assign browse_fields = browse_fields | push: f -%}{%- endif -%}
{%- endfor -%}
{%- for f in facet_fields -%}
  {%- if f.options and browse_fields.size < 4 -%}
    {%- unless browse_fields contains f -%}{%- assign browse_fields = browse_fields | push: f -%}{%- endunless -%}
  {%- endif -%}
{%- endfor -%}

{%- comment -%} Honest stats, counted from the entries. {%- endcomment -%}
{%- assign meta_field = schema.fields | card_fields: 'meta' | first -%}
{%- assign meta_values = "" | split: "" -%}
{%- if meta_field -%}
  {%- for e in entries -%}
    {%- assign vals = e[meta_field.key] | as_list -%}
    {%- for x in vals -%}{%- assign meta_values = meta_values | push: x -%}{%- endfor -%}
  {%- endfor -%}
{%- endif -%}
{%- assign meta_count = meta_values | uniq | size -%}
{%- assign meta_label = meta_field.label | downcase_first -%}
{%- assign meta_last = meta_label | slice: -1 -%}
{%- unless meta_last == 's' -%}{%- assign meta_label = meta_label | append: 's' -%}{%- endunless -%}
{%- assign url_field = schema.fields | where: 'type', 'url' | first -%}
{%- assign url_count = 0 -%}
{%- if url_field -%}
  {%- for e in entries -%}
    {%- assign uv = e[url_field.key] -%}
    {%- if uv and uv != '' -%}{%- assign url_count = url_count | plus: 1 -%}{%- endif -%}
  {%- endfor -%}
{%- endif -%}
{%- assign upcoming = site.data.events_all | where: 'past', false -%}

{%- assign hero_latest_count = cfg.home.hero_latest_count | default: 3 -%}
{%- assign hero_latest = "" | split: "" -%}
{%- if cfg.modules.catalog and hero_latest_count > 0 -%}{%- assign hero_latest = live | slice: 0, hero_latest_count -%}{%- endif -%}
{%- assign hero_meta_field = schema.fields | card_fields: 'meta' | first -%}

<section class="hero">
  {%- comment -%} Optional illustration layer: sits above the dot grid and below the
  copy, masked with the same 112° fade so the left half stays a calm ground for the
  headline. Decorative — the hero copy carries the meaning. {%- endcomment -%}
  {% if cfg.hero.image and cfg.hero.image != '' %}<div class="hero-art" aria-hidden="true">{% include picture.html src=cfg.hero.image alt='' sizes="100vw" class="hero-art-img" eager=true %}</div>{% endif %}
  <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
    <div class="max-w-prose">
      {% if cfg.hero.eyebrow %}<p class="eyebrow-on-dark">{{ cfg.hero.eyebrow }}</p>{% endif %}
      <h1 class="hero-title mt-4">{{ cfg.hero.title | default: cfg.name }}</h1>
      {% if cfg.hero.lead %}<p class="mt-5 text-lg leading-7 text-brand-on-dark/90">{{ cfg.hero.lead }}</p>{% endif %}

      {% if cfg.modules.catalog %}
      {%- comment -%} One pill, not two: the Search button sits inside the field's right end
      so the form reads as a single control and the hero keeps one solid CTA below it. {%- endcomment -%}
      <form class="hero-search mt-6" action="{{ catalog_url | relative_url }}" method="get" role="search">
        <label class="sr-only" for="home-search">Search {{ plural | downcase }}</label>
        <span class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-brand-muted">{% include icon.html name='search' size='sm' %}</span>
        <input class="hero-search-input" id="home-search" type="search" name="q" placeholder="Search {{ plural | downcase }}…" autocomplete="off">
        <button class="hero-search-btn" type="submit">Search</button>
      </form>
      {% endif %}

      <div class="mt-6 flex flex-wrap gap-3">
        {%- comment -%} A CTA with `module:` only renders while that module is on (same key navigation items use). {%- endcomment -%}
        {% assign hero_pri = cfg.hero.primary_cta %}{% assign hero_pri_on = true %}{% if hero_pri.module %}{% assign hero_pri_on = cfg.modules[hero_pri.module] %}{% endif %}
        {% if hero_pri.label and hero_pri_on %}<a class="btn-on-dark-solid" href="{{ hero_pri.url | relative_url }}">{{ hero_pri.label }} {% include icon.html name='arrow-right' size='sm' %}</a>{% endif %}
        {% assign hero_sec = cfg.hero.secondary_cta %}{% assign hero_sec_on = true %}{% if hero_sec.module %}{% assign hero_sec_on = cfg.modules[hero_sec.module] %}{% endif %}
        {% if hero_sec.label and hero_sec_on %}<a class="btn-on-dark" href="{{ hero_sec.url | relative_url }}">{{ hero_sec.label }}</a>{% endif %}
      </div>

      {% if cfg.modules.stats and total > 0 %}
      <p class="mt-10 text-sm text-brand-on-dark/80">
        <span class="font-semibold text-white tabular">{{ total }}</span> {{ plural | downcase }}
        {% if meta_field and meta_count > 0 %}<span class="hero-stat"><span class="font-semibold text-white tabular">{{ meta_count }}</span> {{ meta_label }}</span>{% endif %}
        {% if url_field and url_count > 0 %}<span class="hero-stat"><span class="font-semibold text-white tabular">{{ url_count }}</span> with {{ url_field.label | downcase_first }}</span>{% endif %}
      </p>
      {% endif %}
    </div>

    {%- if hero_latest.size > 0 %}
    <aside class="hero-latest hidden lg:block" aria-labelledby="hero-latest-heading">
      <p class="eyebrow-on-dark" id="hero-latest-heading">Latest additions</p>
      <ul role="list" class="mt-3 divide-y divide-white/10">
        {%- for hl in hero_latest %}
        {%- assign hl_meta = '' -%}
        {%- if hero_meta_field -%}{%- assign hl_vals = hl[hero_meta_field.key] | as_list -%}{%- if hl_vals.size > 0 -%}{%- assign hl_meta = hero_meta_field | option_short: hl_vals[0] -%}{%- endif -%}{%- endif -%}
        <li class="hero-latest-item">
          <a class="hero-latest-link" href="{{ hl.url | relative_url }}">
            <span class="hero-latest-title">{{ hl.title | escape }}</span>
            <span class="hero-latest-meta">{% if hl_meta != '' %}<span>{{ hl_meta | escape }}</span>{% endif %}<time datetime="{{ hl.published | date: '%Y-%m-%d' }}">{{ hl.published | date: '%b %-d, %Y' }}</time></span>
          </a>
        </li>
        {%- endfor %}
      </ul>
      <a class="section-link mt-4 gap-1 text-sm font-semibold text-white underline-offset-4 hover:underline" href="{{ catalog_url | relative_url }}">See all {{ total }} {{ plural | downcase }} {% include icon.html name='arrow-right' size='sm' %}</a>
    </aside>
    {%- endif %}
  </div>
</section>

{% if cfg.modules.catalog and browse_fields.size > 0 %}
{%- comment -%} A tinted band straight under the hero: the tiles are white cards on it, so
the eye reads "here is how the collection is organised" before the first entry. {%- endcomment -%}
<section class="band" aria-labelledby="browse-heading">
  <div class="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
    <div class="section-head">
      <p class="eyebrow">Browse by</p>
      <h2 id="browse-heading" class="section-title">Find {{ plural | downcase }} the way you think about them</h2>
    </div>
    <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {% for bf in browse_fields %}
        {% assign bkey = bf.key | replace: '_', '-' %}
        {%- comment -%} flex-col + mt-auto on the terminal link: tiles hold 5 or 6 options, and
        the "open the catalog" line sits on the same baseline across the row either way. The
        option labels are ink, not link-blue — a column of 22 blue lines reads as a link
        farm; the row hit area and the hover wash carry the affordance, and only the terminal
        link keeps `primary`. The icon gutter is reserved even for fields without option
        icons so labels start at the same x in every tile. {%- endcomment -%}
        <div class="card flex flex-col p-5">
          <h3 class="flex items-center gap-2 font-heading text-base font-semibold text-brand-primary-dark">{% include icon.html name=bf.icon size='sm' class='text-brand-primary' %}{{ bf.label }}</h3>
          <ul role="list" class="mt-3 space-y-1">
            {% for opt in bf.options limit: 6 %}
              {% assign om = bf | option_meta: opt %}{% assign own = bf.option_meta[opt] %}
              <li><a class="browse-option" href="{{ catalog_url | relative_url }}?{{ bkey }}={{ opt | slugify }}" title="{{ opt | escape }}"><span class="inline-flex w-4 shrink-0 justify-center text-brand-muted" aria-hidden="true">{% if own.icon %}{% include icon.html name=own.icon size='xs' %}{% endif %}</span>{{ om.short }}</a></li>
            {% endfor %}
          </ul>
          <a class="browse-all" href="{{ catalog_url | relative_url }}">{% if bf.options.size > 6 %}All {{ bf.options.size }} options{% else %}Open the catalog{% endif %}</a>
        </div>
      {% endfor %}
    </div>
  </div>
</section>
{% endif %}

<div class="mx-auto w-full max-w-7xl space-y-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">

  {% if home_has_carousel %}
  <section aria-labelledby="featured-heading" data-carousel>
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h2 id="featured-heading" class="section-title">Featured {{ plural | downcase }}</h2>
      <div class="flex items-center gap-4">
        {%- comment -%} The only browse-all link above the fold at lg+, where the
        "Recently added" section (which also carries one) is hidden. {%- endcomment -%}
        <a class="section-link gap-1 text-sm font-semibold text-brand-primary hover:underline" href="{{ catalog_url | relative_url }}">Browse all {{ total }} {{ plural | downcase }} {% include icon.html name='arrow-right' size='sm' %}</a>
        <div class="flex items-center gap-2">
          <button type="button" class="icon-btn border border-brand-line-strong" data-carousel-prev aria-label="Previous">{% include icon.html name='chevron-left' size='sm' %}</button>
          <button type="button" class="icon-btn border border-brand-line-strong" data-carousel-next aria-label="Next">{% include icon.html name='chevron-right' size='sm' %}</button>
        </div>
      </div>
    </div>
    <ul role="list" class="no-scrollbar -mx-4 flex list-none snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth scroll-pl-4 px-4 pb-4 sm:mx-0 sm:scroll-pl-0 sm:px-0 [&>li]:w-[85%] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[calc((100%-1.5rem)/2)] xl:[&>li]:w-[calc((100%-3rem)/3)]" data-carousel-track tabindex="0" aria-label="Featured {{ plural | downcase }}">
      {% for e in featured %}{% assign home_lcp = false %}{% if forloop.first %}{% assign home_lcp = true %}{% endif %}{% include entry-card.html entry=e eager=home_lcp fetchpriority=home_lcp %}{% endfor %}
    </ul>
  </section>
  {% endif %}

  {% if cfg.modules.catalog %}
  {%- comment -%} At lg+ the hero already lists the newest entries and the carousel
  shows cards, so this section would say "new" a third time above the fold; it
  stays for narrow screens, where the hero list is hidden. {%- endcomment -%}
  {%- assign recent_hidden_lg = false -%}
  {%- if hero_latest.size > 0 and home_has_carousel -%}{%- assign recent_hidden_lg = true -%}{%- endif -%}
  <section aria-labelledby="recent-heading"{% if recent_hidden_lg %} class="lg:hidden"{% endif %}>
    <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h2 id="recent-heading" class="section-title">Recently added</h2>
      <a class="section-link gap-1 text-sm font-semibold text-brand-primary hover:underline" href="{{ catalog_url | relative_url }}">Browse all {{ total }} {{ plural | downcase }} {% include icon.html name='arrow-right' size='sm' %}</a>
    </div>
    {% assign recent_count = cfg.home.recent_count | default: 6 %}
    <ul role="list" class="entry-grid">
      {%- comment -%} With no carousel above it, the first card in this grid's first row
      that has a picture is the LCP candidate — see the note in _layouts/catalog.html.
      {%- endcomment -%}
      {%- assign home_r_lcp_url = '' -%}
      {%- assign home_r_probe_n = recent_count | at_most: 3 -%}{%- unless home_has_carousel -%}{%- for e in live limit: home_r_probe_n -%}{%- capture home_r_probe -%}{% include entry-thumb.html entry=e %}{%- endcapture -%}{%- assign home_r_probe = home_r_probe | strip -%}{%- if home_r_probe != '' -%}{%- assign home_r_lcp_url = e.url -%}{%- break -%}{%- endif -%}{%- endfor -%}{%- endunless %}
      {% for e in live limit: recent_count %}{% assign home_r_lcp = false %}{% if e.url == home_r_lcp_url %}{% assign home_r_lcp = true %}{% endif %}{% include entry-card.html entry=e eager=home_r_lcp fetchpriority=home_r_lcp %}{% endfor %}
    </ul>
    {%- comment -%} No CTA when submissions are off: _plugins/modules.rb drops /submit/
    from the build, and an empty catalog makes "browse the catalog" a second dead end.
    {%- endcomment -%}
    {% assign home_empty_cta = '' %}
    {% if cfg.modules.submit %}{% assign home_empty_cta = '/submit/' %}{% endif %}
    {%- comment -%} The grid lists live entries, so it can be empty while the catalog
    is not (everything deprecated); that case points at the catalog, which keeps
    deprecated entries for the record. {%- endcomment -%}
    {% if total == 0 %}{% include empty-state.html icon='sparkles' image=cfg.images.empty_catalog title='Nothing published yet' body='Once the first entries are approved they will show up here.' cta_url=home_empty_cta cta_label='Submit the first one' %}
    {% elsif live.size == 0 %}{% include empty-state.html icon='sparkles' image=cfg.images.empty_catalog title='Nothing current right now' body='Every entry is marked deprecated. They are kept for the record in the catalog.' cta_url=catalog_url cta_label='Browse the catalog' %}{% endif %}
  </section>
  {% endif %}

  {% if cfg.modules.events or cfg.modules.cohorts %}
  <section class="grid gap-8 lg:grid-cols-2">
    {% if cfg.modules.events %}
    <div class="card" aria-labelledby="events-heading">
      <div class="card-header flex items-center justify-between"><h2 id="events-heading" class="card-title">Upcoming events</h2><a class="text-sm font-semibold text-brand-primary hover:underline" href="{{ '/events/' | relative_url }}">Full calendar</a></div>
      <div class="px-6">
        {% if upcoming.size > 0 %}{% include event-list.html events=upcoming limit=4 compact=true %}{% else %}<p class="py-6 text-sm text-brand-muted">No upcoming events scheduled.</p>{% endif %}
      </div>
    </div>
    {% endif %}
    {% if cfg.modules.cohorts %}
    <div class="card" aria-labelledby="cohorts-heading">
      <div class="card-header flex items-center justify-between"><h2 id="cohorts-heading" class="card-title">Cohorts</h2><a class="text-sm font-semibold text-brand-primary hover:underline" href="{{ '/cohorts/' | relative_url }}">All cohorts</a></div>
      <ul class="divide-y divide-brand-line px-6">
        {% assign cohorts = site.data.cohorts | sort %}
        {% for c in cohorts reversed limit: 4 %}
          {% assign year = c[0] %}{% assign n = entries | where: 'cohort', year | size %}
          <li class="flex items-center justify-between py-4"><a class="font-semibold text-brand-primary-dark hover:text-brand-primary hover:underline" href="{{ '/cohorts/' | append: year | append: '/' | relative_url }}">Cohort {{ year }}</a><span class="chip-neutral">{{ n }} {{ plural | downcase }}</span></li>
        {% endfor %}
      </ul>
    </div>
    {% endif %}
  </section>
  {% endif %}

  {% if cfg.home.highlights and cfg.home.highlights.size > 0 %}
  <section aria-label="About this catalog">
    <div class="value-props">
      {% for h in cfg.home.highlights %}
        <div>
          <h2 class="value-prop-title">{{ h.title }}</h2>
          <p class="value-prop-body">{{ h.body }}</p>
        </div>
      {% endfor %}
    </div>
  </section>
  {% endif %}

  {% if cfg.modules.submit %}
  <section class="cta-panel flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
    <div class="max-w-prose">
      <h2 class="section-title">Share {{ singular | downcase | with_article }}</h2>
      <p class="mt-3 text-base leading-6 text-brand-muted">Fill out a short form. Maintainers review every submission before it goes live.</p>
    </div>
    <a class="btn-primary shrink-0" href="{{ '/submit/' | relative_url }}">Submit {{ singular | downcase | with_article }} {% include icon.html name='arrow-right' size='sm' %}</a>
  </section>
  {% endif %}
</div>
{%- endif -%}
