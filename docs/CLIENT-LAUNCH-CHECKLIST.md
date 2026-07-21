# Client Launch Checklist & Playbook

Everything learned building/launching from the **Be Secure Locksmith** template.
This is the "don't rediscover it one 404 at a time" doc. Work top to bottom for
each new client site cloned from this template.

> Stack recap: **Astro (static) + Tailwind → Cloudflare Workers static assets**
> (NOT Pages). Deploy with **`wrangler deploy`** (not `wrangler pages deploy`).
> Config that changes per client lives in `src/config/` + `src/content/`.

---

## 1. Redirects (`public/_redirects`)

Cloudflare serves `public/_redirects` (copied verbatim to `dist/` on build). This
is the single place to fix **any 404** by mapping an old/broken URL to a real one.

### Format
```
<from-path>   <to-path>   <status>
/old-page/    /new-page/   301
```
- **301** = permanent (passes SEO equity). Always type it — default is 302.
- First matching rule wins (top-to-bottom).

### ⚠️ Hard-won rules (these caused real failed deploys)

1. **Static rules FIRST, dynamic (splat/placeholder) rules LAST.**
   A dynamic rule (`*` or `:name`) placed *above* static rules makes Cloudflare
   classify **every following rule as dynamic**, blowing the **100-dynamic-rule
   limit** (`code: 100324`). Keep all plain `/a/ /b/ 301` rules at the top and any
   `*`/`:name` rules at the bottom. Limits: **2,000 static + 100 dynamic = 2,100**.

2. **A splat `*` may only appear at the END of the `from` path.**
   `/wp-content/* / 301` ✅   `/*/foo/ /bar/ 301` ❌ (invalid).
   This is why mid-path-varying URLs (e.g. `/service-areas/locksmith-<hood>-ocala-fl/`)
   need one exact rule each — they can't be wildcarded.

3. **`auto-trailing-slash` does NOT rescue redirect sources.**
   The site is `trailingSlash: 'always'`. A request to bare `/foo` (no slash) is
   NOT auto-normalized before redirect matching — it just 404s unless you add an
   explicit bare rule. So for short/citation paths, add BOTH `/foo/` and `/foo`.
   Keep bare twins limited to short single-segment paths (they're the ones people
   type/cite); deep URLs are practically always linked with the trailing slash.

4. **Trailing slashes must match** the built URL form (`/services/x/`, not `/services/x`).

### Common redirect buckets for a locksmith migration
- **Root-level service slugs → canonical:** `/emergency-lockouts/ → /services/emergency-lockouts/`
  (GBP, Yelp, and directory citations frequently link the root-level form).
- **Old hyperlocal/neighborhood service-area pages → parent city page:**
  `/service-areas/locksmith-<neighborhood>-ocala-fl/ → /service-areas/locksmith-ocala-fl/`.
- **Stale WordPress media → homepage:** one wildcard `/wp-content/* / 301` kills
  every old image hotlink at once.
- **Renamed/removed pages → closest live page** (`/schedule-an-appointment/ → /contact-us/`).
- **Spam-injected backlink paths** (random segments + real slug, e.g.
  `/WLfcZ/.../247-emergency-lockout-service/`): exact rules only (can't wildcard a
  prefix). If these proliferate, handle at the **Cloudflare WAF** instead.

### How to find what needs redirecting
1. **Google Search Console → Pages → "Not indexed"** (esp. *"Page with redirect"*
   and *"Not found (404)"*). Export the table (zip with `Table.csv`).
2. Diff old sitemaps (`docs/migration/*.xml`) against current built routes:
   `find dist -name index.html` → the pages that exist now.
3. A URL needs a redirect if it's in the old set / GSC report but is **neither** a
   built route **nor** already a redirect source.

### Deploy a redirect change
```
npm run build && npx wrangler deploy
```
Then verify (edge propagation can lag ~10–15s):
```
curl -sS -o /dev/null -D - "https://<domain>/<old-path>/" | grep -iE '^HTTP|^location'
```

### When you outgrow `_redirects`
At ~2,000 static rules, switch to **Cloudflare Bulk Redirects** (account-level) or
a small redirect **Worker** (unlimited, map-based). Not needed for a single site.

---

## 2. Custom 404 page

- Page lives at `src/pages/404.astro` → builds to `dist/404.html`. Reuse the
  `thank-you` page composition (BaseLayout + PromoBar + NavBar + Footer). Set
  `robots="noindex, follow"`. Include Call / Book CTAs + popular-page links so a
  lost visitor still converts.
- **Required config:** `wrangler.jsonc → assets.not_found_handling: "404-page"`,
  or Cloudflare serves a blank default 404 instead of your page.

---

## 3. Forms & email (Cloudflare Worker + Resend)

- Static assets can't run server code. Form endpoints are a **separate Worker**
  (`contact-worker/`) mapped onto the same domain via `routes` in its
  `wrangler.jsonc` (e.g. `besecurelocksmith.com/api/contact`). The `functions/`
  dir is a **Pages** convention and is NOT used by this Workers-assets deploy.
- **Per-client variables in the worker:** `to` recipient, `from`
  (`noreply@<domain>`), and secrets `RESEND_API_KEY` + `TURNSTILE_SECRET_KEY`
  (set via `wrangler secret put`). `reply_to` = the submitter's email.
- Spam protection: hidden **honeypot** field (`bsl_hp`) + Cloudflare **Turnstile**.
- **Every form's `action`/`fetch` path needs a matching worker route** — an
  endpoint with no route silently 404s and the submission is lost. Verify each
  form end-to-end at launch (see the employment-form bug we hit: the page posted
  to `/api/employment` but no such route/handler existed).

---

## 4. Analytics
- GA4 is injected in `src/layouts/BaseLayout.astro`, **production-only**
  (`import.meta.env.PROD`) so local `astro dev` stays out of the data. Swap the
  `G-XXXX` measurement ID per client.

---

## 5. Deploy quick reference
```
npm run build          # -> dist/ (also copies public/_redirects, _headers, 404.html)
npx wrangler deploy    # static-assets Worker; custom domain serves the new version
```
- `wrangler.jsonc`: `assets.directory: ./dist`, `html_handling: auto-trailing-slash`,
  `not_found_handling: "404-page"`, `workers_dev: false` (custom domain only).
- "No targets deployed" in deploy output is normal here (workers.dev disabled).

---

## Per-client launch checklist (copy per site)
- [ ] `src/config/site.ts` — name, phones, address, hours, license, socials, booking URL
- [ ] `src/config/offices.ts` + `schema-data.ts` — locations / schema
- [ ] `src/content/` — services, service-areas, faqs, reviews, blog
- [ ] `public/img/` — logo, photos, client/press logos (run image optimize scripts)
- [ ] GA4 measurement ID in `BaseLayout.astro`
- [ ] Contact worker: `to`/`from` + `RESEND_API_KEY` + `TURNSTILE_SECRET_KEY`; route added
- [ ] Employment worker/route (if the site has an employment page) + resume email
- [ ] `wrangler.jsonc`: `not_found_handling: "404-page"`, custom domain/route
- [ ] `public/_redirects`: root-service slugs, `/wp-content/*`, renamed pages,
      then run the GSC 404 sweep (static first, splats last)
- [ ] Verify every form submits and lands in the right inbox
- [ ] Verify sample redirects + real page (200) + junk URL (404 page) live
