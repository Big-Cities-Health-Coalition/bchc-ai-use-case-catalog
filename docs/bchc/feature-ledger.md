# Feature ledger

The public record of where the catalog is going: what is being built now, what has
been requested and is waiting on a decision, and the design questions that have to be
answered before certain features are safe to build. It exists because the August 2026
coalition presentation generated exactly the kind of ideas, questions and feedback a
catalog like this should collect — and a request that lives in one person's inbox is a
request that gets lost.

**To propose something:** for a capability of the catalog software — search, forms,
pages, automation — open a
[feature request](https://github.com/Big-Cities-Health-Coalition/bchc-ai-use-case-catalog/issues/new?template=feature.yml);
that form asks you to confirm the idea is reusable template behavior, because that is
where the software is built. For BCHC-specific ideas — coalition policy, content,
taxonomy, how the catalog is governed — email
[info@bigcitieshealth.org](mailto:info@bigcitieshealth.org) and maintainers will record
the request in this file, so it is tracked here rather than in an inbox. Either way the
request lands on this page: items move down it as they progress, *under consideration* →
*in progress* → *shipped*, or into *design questions* when what blocks them is a
decision rather than code.

Because this site is built on the [PHCT template](https://github.com/crypticpy/phct),
most features are built there and arrive here through a template update; this ledger
tracks them from BCHC's point of view regardless of which repository the work lands in.

## In progress (2026-08)

- **Search that holds up at scale.** The search index currently ships every entry's
  full write-up and builds the search engine in the browser on page load. The build
  moves to CI, the payload splits so the heavy text loads lazily, and keystroke
  latency gets measured at 500 and 1,000 entries so the supported catalog size is a
  tested number, not a hope.
- **Concept matching in search.** A query should find entries that are *about* the
  words, not just entries that contain them — "chatbot" should surface a chat
  assistant entry that never uses the word. First pass is a concept map derived from
  the catalog's own text at build time: no new dependencies, no behavior change for
  exact matches, purely additive ranking.
- **Refresh reminders.** Entries already carry `published` / `updated` / `verified`
  dates and go visibly stale after a year. What's new: submissions collect an optional
  GitHub handle, and the monthly sweep opens a dedicated refresh issue per stale entry
  that mentions the submitter and the maintainers, with one-click links to confirm
  "still accurate" or submit what changed.
- **"Also deployed by."** An organization that implemented a cataloged use case can
  attach itself to the entry — organization name, link, an optional contact email if
  they want to publish one, and an optional note — through an issue form, without
  writing a full entry of their own. Entries that *do* have their own entry already
  get this via "Adapted from" / "Adopted by".
- **Security signals and review status.** The catalog links to code, it does not host
  or audit it — and it should never imply otherwise. Three layers, none of which
  claims code is "safe": an automated monthly sweep of every linked public repository
  (repository hygiene, [OpenSSF Scorecard](https://scorecard.dev), known-vulnerability
  lookup via [OSV](https://osv.dev)) rendered on the entry as dated observations; a
  maintainer-set review status (*coalition security-reviewed / automated checks only /
  not reviewed*); and a plain disclaimer on entries with external links telling peers
  to run their own security review before deploying.

- **Instant search on every device.** The search engine is built in the reader's
  browser, which is what keeps the catalog serverless and private — and what makes the
  first search slow on a weak phone once the catalog is large. The plan: build the
  index in a background thread while the reader is still looking at the page, cache
  the built index in the browser keyed to the catalog's content so repeat visits skip
  the work entirely, and on devices too weak to hide the cost, replace the silent stall
  with an honest **Load full search** button and a real progress readout. A public
  "How search works" page explains the trade: nothing the reader types ever leaves
  their device, because there is no server to send it to.

## Under consideration

- **The search scaling ladder.** Recorded now so the growth path is a decision already
  made, not a scramble later. **Rung 1 (current):** in-browser index with the
  performance work above — measured to 1,000 entries. **Rung 2
  ([Pagefind](https://pagefind.app)):** if the catalog outgrows that, switch the index
  build to CI with Pagefind, which pre-shards the index into static files so the
  browser downloads only the fragments a query touches — still no server, still
  private, comfortable into the tens of thousands of pages. **Rung 3 (sponsored search
  sidecar):** if the catalog outgrows *that*, or the coalition wants semantic search,
  stand up a small hosted search service on sponsored infrastructure
  (Railway, Supabase, or Azure — Microsoft is a coalition sponsor). This is the first
  rung where a reader's query leaves their device, so it comes with a privacy
  write-up, not just a deploy.

## Design questions to settle before building

These were raised in August 2026 and deliberately **recorded instead of built**: each
one adds process weight or identity assumptions that deserve a worked-out answer
first.

- **Submitter self-service updates.** The person who submitted an entry should be able
  to update it easily. What proves that the person opening the update *is* the
  submitter (or a colleague at the same organization)? The recorded GitHub handle is
  the obvious anchor, but handles change and people share drafting duties.
- **Ownership remapping.** The original submitter leaves the organization. Who can
  claim the entry, who approves the transfer, and what happens to entries nobody
  claims? Likely shape: a "transfer ownership" issue type that a maintainer approves,
  but the approval rules need writing.
- **Escalation when nobody answers.** A refresh reminder mentions the submitter and
  the maintainers. If the submitter is gone and no maintainer acts within some window,
  what happens — does the entry get a stronger staleness banner, get demoted further,
  get marked unmaintained? Pick the window and the consequence.
- **Security review checklist.** What the coalition actually checks before an entry
  earns *coalition security-reviewed*, who on the governance committee does it, and
  how often it must be renewed. The automated signals (above) ship first precisely so
  this human tier has data to stand on.
- **Embedding-based semantic search.** A stronger upgrade to concept matching:
  precompute text embeddings in CI and rank by meaning. Deferred until the
  corpus-derived concept map proves insufficient — it adds a model dependency to the
  build and real payload weight. Decided in August 2026: no AI runs in the reader's
  browser and no model dependency enters the build — the catalog's design premise is
  low resource use on whatever device a coalition member has. If meaning-aware search
  ever needs more than the concept map, it lives in the sponsored sidecar (rung 3 of
  the scaling ladder above), where its cost is the service's, not the reader's.

## Shipped

*(Features move here with the date and release they arrived in.)*
