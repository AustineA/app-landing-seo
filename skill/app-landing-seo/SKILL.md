---
name: app-landing-seo
description: SEO-optimize a landing page for a mobile app end to end — pull App Store/Play listing data and assets, run keyword research (primary + long-tail), build an SEO landing page with guide pages per keyword, GPT Image-generated landscape feature images, FAQ with schema, sitemap/robots, and de-slopped copy. Invoke when the user asks to "SEO optimise my landing page", "do keyword research for my app", "create SEO guides/content", "add structured data", "remove AI slop from my copy", or similar.
---

# App Landing Page SEO

End-to-end workflow for turning an app's store listing into a high-converting, SEO-optimized landing site with long-tail guide pages. Default stack: **Vite + React with build-time prerendering** (architecture in Phase 3). If the repo already has a web framework (Next.js, Astro), build inside that instead and adapt the output paths. Every phase ends with verification.

This skill depends on the separately installed **`gpt-image`** skill included in the same repository. When guide images are needed, load that skill and follow its instructions. Do not assume its helper lives inside this skill's directory.

## Phase 1 — Pull the store listing (source of truth)

1. Fetch full metadata from the iTunes lookup API (no auth needed):
   ```bash
   curl -s "https://itunes.apple.com/lookup?id=<APP_ID>&country=us"
   ```
   Extract: name, bundleId, description, price/IAP terms, genres, rating count, screenshots, icon, version, seller. Check for a Google Play listing too (`play.google.com/store/apps/details?id=<bundleId>`) — don't assume iOS-only.

2. Download assets at high resolution by rewriting the mzstatic thumb suffix:
   - Icon: replace `512x512bb.jpg` with `1024x1024bb.png`
   - Screenshots: replace `392x696bb.jpg` with `1284x2282bb.png` (falls back gracefully; verify with `file`)

3. **Read every screenshot with the Read tool.** Captions, guide topics and landing copy must describe what the screens actually show. Also extract the brand palette and type style from them.

4. Write `app.md` at the repo root: identity table, verbatim description, feature list derived from listing + screenshots, asset manifest, then the keyword research (Phase 2) and placement map. This file is the contract for everything that follows.

## Phase 2 — Keyword research that converts

- If the `astro` MCP tools are connected, use `get_keyword_suggestions` and `search_app_store` for App Store popularity/difficulty and current rank. Record where the app ranks today.
- Use WebSearch to validate Google-side long-tails (the landing page ranks on Google, not the App Store).
- Structure the output in `app.md`:
  - **Primary keywords** (3–5 head terms) → title tag, H1, hero copy, meta description
  - **Secondary** → section H2s, feature copy
  - **Long-tail** (6–10 question/task phrases) → one guide page each
- Rules that matter:
  - Every long-tail must map to a pain the app demonstrably solves — ideally one visible in a screenshot. That's what makes the traffic convert.
  - Check the actual SERP for each head term and skip poisoned ones (e.g. "stock tracker" returns stock-market apps; "inventory management software" returns enterprise vendors).
  - Prefer how-to phrasings where blogs rank — an app page with HowTo/FAQ schema can beat them.

## Phase 3 — Landing page on-page SEO

### Vite + React SSG architecture (default)

An SPA is invisible to crawlers without JS rendering, so ship prerendered static HTML. No SSG framework needed — a ~30-line prerender script does it, and the pages usually need **zero client JS** (FAQ accordions are native `<details>`; don't hydrate what has no interactivity):

```
landing/
  package.json          # build: vite build --ssr src/entry-server.tsx --outDir dist-ssr && node scripts/prerender.mjs
  vite.config.ts        # plugins: [react()], ssr: { noExternal: true }  ← bundles react into dist-ssr so prerender.mjs imports it standalone
  index.html            # dev-only shell: <div id="root"> + /src/entry-client.tsx
  public/               # style.css, assets/ (copied verbatim into dist/)
  src/
    data.ts             # ALL content: FAQ entries, guide bodies, titles, descriptions. Single source of truth.
    seo.ts              # PageMeta type + JSON-LD builders (homeJsonld, guideJsonld, breadcrumbJsonld) reading from data.ts
    components.tsx      # Header, Footer, StoreBadge, FaqItem, GuideCard, CtaCallout
    pages/              # Home.tsx, GuidePage.tsx, GuidesIndex.tsx
    routes.tsx          # ROUTES: [{ meta: PageMeta, element }] — one entry per page, guides spread from data.ts
    entry-server.tsx    # renderRoute(route): full HTML document string — head tags + JSON-LD + renderToStaticMarkup(body)
    entry-client.tsx    # dev only: matchRoute(location.pathname) → createRoot().render()
  scripts/prerender.mjs # imports dist-ssr/entry-server.js; writes dist/<path>/index.html per route + sitemap.xml + robots.txt; cpSync public/ → dist/
```

Key decisions baked into this shape:
- **`renderToStaticMarkup`, not `renderToString`** — no hydration markers, clean HTML, since no client bundle ships.
- **Clean URLs**: route paths end in `/` (`/guides/<slug>/`) and prerender writes `<path>/index.html`. Internal links are site-absolute (`/guides/…/`), which also makes dev-server navigation work.
- Dev experience: `vite` serves `entry-client.tsx` with HMR; the client entry is never shipped to production.
- `esc()` attribute values in the hand-built head template; JSON-LD via `JSON.stringify` (no escaping issues).
- React attribute is `fetchPriority` (camelCase) — lowercase `fetchpriority` warns.

### On-page rules (any stack)

Sections: hero, download, screenshots, how it works, guides, FAQ, CTA, footer.

- Exactly **one H1**, carrying the primary keyword. Section headings are H2 ("Available On"-style headings must not be H1s).
- `<title>` ≈ "Brand — Primary Keyword for Audience" (≤60 chars). Meta description ≤155 chars with primary keyword + top differentiators.
- Canonical URL per page, OG + Twitter cards, `apple-itunes-app` meta (smart app banner). In the Vite setup these live in `entry-server.tsx`; Next.js: `metadataBase`, `alternates.canonical`, title `template`, `itunes.appId`.
- JSON-LD on the homepage: `SoftwareApplication` (with `offers`, `installUrl`; skip `aggregateRating` under ~50 ratings), `FAQPage`, `WebSite`. Build the objects in `seo.ts` from `data.ts` so schema and visible copy share one source.
- Store badges/download CTA **above the fold**, plus a repeat CTA section lower.
- Screenshots get keyword-bearing `alt` text describing the actual screen. Recompress store PNGs (often 1–2 MB each) to ≤200 KB JPEGs (`sips -Z 1386 -s format jpeg -s formatOptions 80`); keep originals in `public/assets/full/`.
- FAQ: 8–10 questions, each one a real search query, answered in 2–3 sentences, each with a "Learn more →" link to its matching guide. **The FAQPage JSON-LD must contain the same Q/A text as the visible FAQ** — both render from the same `data.ts` array.
- `sitemap.xml` + `robots.txt`: generated by `scripts/prerender.mjs` from the ROUTES list, so new guides appear automatically.

## Phase 4 — Guide pages (one per long-tail keyword)

Store guide content in the one data module (`src/data.ts` in the Vite setup; `lib/guides.ts` in Next.js) and render through a single template component so schema, cards, footer links and sitemap all derive from the same list. Model each guide as structured data, not HTML blobs: `{ slug, title, description, h1, intro, featureImage: { src, alt, width, height }, howto?, sections: [{ h2, paras, cta?, figure? }], faq, related }` — the CTA callout and figures become components, and paragraphs stay searchable strings (inline `<em>`-level HTML via `dangerouslySetInnerHTML` is fine).

### GPT Image feature-image workflow

Every guide article gets its own landscape feature image. Load and use the **`gpt-image`** skill, which calls OpenAI's `gpt-image-2`; do not substitute stock imagery, CSS gradients, screenshots, or another image model unless the user explicitly asks. If `gpt-image` is not installed, stop before image generation and tell the user to install the sibling skill from this repository.

1. After guide titles and slugs are final, make one image brief per guide from its search intent, concrete subject, and the app's visual identity captured in `app.md`. The concepts must be meaningfully different, not palette swaps of one composition.
2. Prompt for an editorial feature image in the app's brand palette. Describe the subject, setting, composition, lighting, materials, camera/viewpoint, and where visual breathing room should sit. End every prompt with: `Landscape editorial feature image, 3:2 composition. Absolutely no text, words, letters, numbers, captions, watermarks, interface labels, or logos.` Do not ask the model to render the article title.
3. Resolve `GPT_IMAGE_SKILL_DIR` to the installed directory containing the `gpt-image` skill's `SKILL.md`, then run its generator with a deterministic destination:
   ```bash
   "$GPT_IMAGE_SKILL_DIR/scripts/generate_image.py" "<guide-specific prompt>" \
     --model gpt-image-2 \
     --aspect-ratio 3:2 \
     --quality high \
     --background opaque \
     --format webp \
     --output "<site-public-dir>/assets/guides/<slug>-feature.webp"
   ```
   This produces a 1536×1024 landscape source. Create the destination directory first when needed. Preserve the generated source; use the framework's image pipeline for smaller responsive variants rather than repeatedly recompressing it.
4. Inspect every image at full size before wiring it in. Check for accidental text/glyphs, malformed objects, copied app UI, unintended logos, irrelevant subject matter, and poor crop safety at desktop and card aspect ratios. Regenerate only failed images, changing the prompt to address the observed defect; stop after two failed regenerations for the same guide and report the remaining issue instead of spending indefinitely.
5. Add the image to the guide's structured record with `width: 1536`, `height: 1024`, and concise descriptive alt text based on what the image actually contains. Render it as the article's above-the-fold feature image, the guide-card thumbnail, and the page's `og:image`/`twitter:image`. Add it to `Article.image` JSON-LD as an absolute URL. Do not use the search keyword as boilerplate alt text when it does not describe the pixels.

Per guide:
- URL slug = the keyword (`/guides/how-to-keep-track-of-inventory-small-business`)
- **Answer-first opening**: the first paragraph directly answers the searched question (featured-snippet bait), then the body teaches the task with the app woven in as the tool — teach first, pitch second.
- H2s carry secondary phrasings of the keyword. 600–900 words of substance, no filler.
- A relevant app screenshot with descriptive caption, a CTA callout mid-page, and a 2-question FAQ unique to that guide (don't duplicate homepage FAQ questions — schema duplication).
- JSON-LD: `Article` + `BreadcrumbList` + `FAQPage`, plus `HowTo` when the guide is step-shaped.
- Cross-link guides to each other and back to the homepage sections.
- The generated GPT Image feature asset is present, unique to the article, and wired into the hero, card, social metadata, and `Article.image` JSON-LD. Use responsive `srcset`/framework image optimization and set explicit dimensions to prevent layout shift; do not lazy-load the above-the-fold feature image.

## Phase 5 — De-slop the copy (Wikipedia: Signs of AI writing)

Run this pass on ALL content you wrote (guides, FAQ answers, hero/section copy) before shipping. The tells, in order of loudness:

1. **Em dashes** — the #1 tell. Budget: a handful across the whole site, not per paragraph. Replace with periods, commas, colons, parentheses.
2. **Negative parallelisms** — "It's not X, it's Y", "not just X but Y", "X, not Y". Max one per site, and only if it earns its place.
3. **Rule of three** — "no A, no B, no C", "adj, adj, adj". Break into pairs or real lists.
4. **Formulaic structure** — identical openings across pages (e.g. every guide starting with the same bold-thesis template). Vary: direct answer, scenario, plain claim.
5. **Uniform punchy cadence** — sentence after short sentence landing a zinger. Vary sentence length; let some sentences just carry information.
6. **Vocabulary blacklist**: delve, tapestry, testament, pivotal, crucial, vibrant, seamless, effortless, boasts, leverage, elevate, robust, meticulous, landscape, underscore, showcase, foster, transformative, game-changing, revolutionize, empower, streamline, "killer feature", "single source of truth", "with confidence", repeated "Here's how/Here's the...".
7. **Copula avoidance** — "serves as", "stands as", "represents" where "is" works. Use "is".
8. **Superficial-analysis participles** — "...highlighting", "...underscoring", "...reflecting" clauses bolted to sentence ends.
9. Replace aphorisms with concrete specifics (a price, a month, a named object). Specifics read human; generalities read generated.

Mechanical check (adapt paths):
```bash
grep -o "—" <content files> | wc -l   # target: single digits site-wide
grep -inE "delve|tapestry|testament|pivotal|crucial|vibrant|seamless|effortless|boasts|leverage|elevate|robust|meticulous|landscape|underscore|showcas|foster|transformativ|game.chang|revolutioniz|empower|streamlin|serves as|stands as|it's not just|isn't just|not only" <content files>
```
CSS class names (e.g. `transition-transform`) will false-positive; ignore those. What you keep must survive the question "would a busy human write this sentence?"

Keep intact while de-slopping: slugs, headings/keywords, internal links, schema (regenerate schema from the rewritten source so visible text and JSON-LD stay identical).

## Phase 6 — Verify

- `npm run build` must pass, then run a scripted check over `dist/**/index.html`: exactly one H1 per page, canonical present, every `<script type="application/ld+json">` parses, every internal href/src resolves to a file in dist (map trailing-slash URLs to `<path>/index.html`), every sitemap `<loc>` maps to a real file, and the homepage's visible FAQ questions equal the FAQPage JSON-LD `name`s.
- Verify every guide record has a distinct landscape feature image, every file exists in the built output, intrinsic dimensions are wider than tall, HTML width/height attributes match the source, and each guide's Open Graph, Twitter, and `Article.image` URLs resolve to that same asset.
- Serve `dist/` locally (`python3 -m http.server` — `npx serve` needs a network fetch) and confirm `/sitemap.xml` and `/robots.txt` return 200. Clean URLs mean pages can't be verified over `file://` (site-absolute links break there).
- Smoke-test the dev server too: `vite`, curl `/`, confirm the client entry loads — it's a separate code path from the SSG build.
- Screenshot desktop AND narrow viewport with headless Chrome and **read the screenshots**.
  - Gotcha: Chrome (old and new headless) clamps window width to a ~500px minimum. A `--window-size=390,...` capture renders a 500px layout cropped to 390 and looks like a broken/overflowing page. Capture at 500px and verify narrower widths arithmetically (sum fixed widths + padding) or with real device emulation.
  - Gotcha: Tailwind preflight strips `ol`/`ul` markers — restore `list-style` in long-form article CSS.
  - Gotcha: SVG logos without a `viewBox` crop instead of scale when CSS-resized; pass `viewBox` through props.
- After deploy, remind the user to submit the sitemap in Google Search Console.

## Bonus: ASO recommendations for app.md

While the listing data is fresh, note: subtitle keyword opportunities, keyword-field suggestions (skip words already in title/subtitle), and the rating-count conversion blocker (an in-app review prompt at a success milestone beats an onboarding prompt — iOS grants ~3 prompts/year, don't spend them pre-value).
