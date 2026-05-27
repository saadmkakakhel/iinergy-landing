# iinergy regional landing pages — v3

Cold-traffic lead capture for paid social. Premium editorial type + lead-cap conversion mechanics — form in the hero, sticky CTA in the header, stat bar after hero, trust strip + review cards.

## Files

```
iinergy-landing/
├── brisbane.html        Brisbane LP (v3 — current)
├── thank-you.html       Post-submit confirmation
├── shared/
│   ├── styles.css       Design system (Fraunces + Inter, cream + ink, green CTA only)
│   └── form.js          Form handler (multi-instance) + lite video facade (YT fallback)
├── _v1/                 Parked first build (AI-slop reference)
└── README.md
```

Gold Coast variant is built after Brisbane v3 is signed off.

## What changed v2 → v3 (the bug sweep + restructure)

| v2 issue | v3 fix |
|---|---|
| Hero banner cropped wrong (text bleeding off right edge) | Hero photo = clean Petero JPEG; banner asset moves to a full-width strip below hero in natural aspect |
| Press strip looked empty (one logo, one line, acres of whitespace) | Stat bar with 4 hairline-separated proofs — 7 News, Petero, QLD-owned, $4k rebate |
| Process step photos duplicated cats strip photos | Process is now typographic — large step numbers + headlines + body, no images. Cats keeps all 5 photos |
| "Up to $4,000" layout broken (split across columns) | Two stacked elements: small-caps leader above giant italic number, marker highlight on the dollar figure |
| Petero video thumbnail showed the still + quote (text baked in) | Swapped to clean JPEG thumb; quote moves to `<blockquote>` caption below the video |
| One 7 News thumbnail loaded as the gray broken YouTube placeholder | `form.js` adds an `onerror` handler that falls back from `maxresdefault.jpg` → `hqdefault.jpg` (always exists) |
| Form buried 10 sections deep | **Hero form card** above the fold (4 inline fields + CTA, SolarWise pattern); second instance at the bottom for late scrollers |
| No persistent CTA after hero scrolled out | Sticky header now: logo · phone · green "Get my quote →" button |
| No top-of-page hook | Thin utility bar across the top: "Up to $4,000 off — federal rebate handled in-call" + phone right |

## Hosting

Plain static files. Drag the folder onto Netlify/Vercel, or upload to `info.iinergy.com.au` next to `bookcall-297427`. URLs become `/brisbane` and `/gold-coast`.

Local preview:
```
cd iinergy-landing && python3 -m http.server 8766
# open http://localhost:8766/brisbane.html
```

## Form schema (current)

Both hero + bottom forms collect the same fields. **All required** — no field is optional. Make sure the Jotform mirror sets each field as Required too.

| Field | Type | Notes |
|---|---|---|
| `firstName` | text | min 2 chars |
| `lastName` | text | min 2 chars |
| `phone` | tel | AU-style validation |
| `email` | email | standard email validation |
| `postcode` | text | 4 digits |
| `serviceArea` | select | Brisbane page = 8 QLD cities iinergy ads target. Gold Coast page (when forked) = "Gold Coast" only |
| `bill` | select | Monthly power bill range |
| `currentSetup` | select | What the homeowner currently has (none / solar only / solar + battery) |
| `region` | (added by `form.js` from `data-region`) | `brisbane` or `gold-coast` — drives the post-submit calendar |

Submitted payload to webhook:

```json
{
  "firstName": "...",
  "lastName": "...",
  "phone": "...",
  "email": "...",
  "postcode": "...",
  "serviceArea": "brisbane",
  "bill": "400-600",
  "currentSetup": "solar-only",
  "region": "brisbane",
  "source": "/brisbane.html",
  "submittedAt": "..."
}
```

### Brisbane service-area dropdown

Brisbane LP serves the 8 QLD cities iinergy targets in their Meta ads (Gold Coast is explicitly excluded — it has its own page):

`Brisbane · Bundaberg · Cairns · Gympie · Hervey Bay · Rockhampton · Toowoomba · Townsville · Other QLD`

### Wiring to Matus (GHL) — webhook approach

`shared/form.js` line 3:

```js
const WEBHOOK_URL = ''; // <-- paste Matus/GHL inbound webhook URL here
```

When `WEBHOOK_URL` is filled in, both forms POST the JSON payload above to that URL on submit, then redirect.

### Wiring to Jotform — alternative

Jotform-Claude integration is only available in the claude.ai web app, not Claude Code, so the form has to be created manually in your Jotform dashboard. To wire it up:

1. In Jotform, create a form with these fields (match names exactly, **all set to Required**):
   - First Name (Short Text)
   - Last Name (Short Text)
   - Phone Number (Phone)
   - Email (Email)
   - Postcode (Short Text, 4-char max)
   - Your Area (Dropdown — 8 QLD cities + Other QLD)
   - Monthly Power Bill (Dropdown — Under $200 / $200–$400 / $400–$600 / $600+)
   - Current Setup (Dropdown — Nothing yet / Solar panels only / Solar + battery already)
2. Get your Jotform Form ID from the URL (`form.jotform.com/{FORM_ID}`).
3. Either:
   - **Direct submit:** replace `WEBHOOK_URL` in `form.js` with `https://submit.jotform.com/submit/{FORM_ID}` and field names will need to be remapped to Jotform's `q{N}_fieldName` format (Jotform's docs cover this); OR
   - **Iframe embed:** drop Jotform's iframe snippet into the page and remove our HTML form. We lose the design polish but get Jotform's submission infrastructure for free.

## Region-aware thank-you calendar

After form submit, `form.js` redirects to `thank-you.html?region={brisbane|gold-coast}`. The thank-you page reads that param and swaps the embedded GHL booking iframe:

- `brisbane` → `kh5hIJuSQtCLCLxWJEQK`
- `gold-coast` → `88mLViYvl1uL33Wwhmp3`

Default (no param) = Brisbane. To add more regions later, add an entry to the `CALENDARS` object in `thank-you.html`.

## Lite video facade

Petero MP4 and all four YouTube embeds use a click-to-play facade — no 60MB video or YT iframe loads until the user clicks. `form.js` also wires a poster `onerror` that swaps `maxresdefault.jpg` → `hqdefault.jpg` automatically (covers videos that don't have a maxres thumb).

```html
<!-- MP4 (Petero) -->
<div class="video-wrap" data-mp4="..." data-poster="..." data-label="...">
  <img class="poster" src="..." alt="..." loading="lazy">
  <div class="video-wrap__play"><span><svg>...</svg></span></div>
</div>

<!-- YouTube -->
<div class="video-wrap" data-youtube="VIDEO_ID" data-label="...">
  <img class="poster" src="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg" alt="..." loading="lazy">
  <div class="video-wrap__play"><span><svg>...</svg></span></div>
</div>
```

## Page architecture (top → bottom)

1. Utility bar — `$4,000 off` + phone
2. Sticky header — logo · phone · "Get my quote →" button
3. Hero (split 7/5) — copy left, Petero photo right
4. **Hero form card** — full-width white card overlapping hero/below boundary
5. Banner strip — full-width horizontal banner asset in natural aspect
6. Stat bar — 4 proofs separated by hairlines
7. Process — typographic 3-step (no photos)
8. Category strip — 5 install photos
9. Villain section — dark paper, 3-bullet "you're renting your house from the power companies"
10. Rebate — fixed `$4,000` composition + bordered list of kWh tiers
11. Petero video — clean JPEG poster, click-to-play MP4, quote as blockquote caption
12. Customer reviews — two video facades restyled as Google-review-style cards (5★ + quote + attribution)
13. 7 News press — both YouTube features, badge above
14. Bottom form — single-column re-prompt, second instance
15. Footer — sign-off, phone, ABN line

## Assets

All hosted on `assets.cdn.filesafe.space` and `img.youtube.com`. Pages reference URLs directly — nothing to download or bundle. If the CDN ever moves, swap URLs in `brisbane.html` only (search for `filesafe.space`).

## Pending from the user before final ship

1. **Customer names + suburbs** for the two YouTube customer testimonials — currently captioned "iinergy customer · South-East Queensland". v3 already swapped the bare label for pulled quote fragments, but a real name + suburb makes it ironclad.
2. **Matus/GHL webhook URL** for `form.js` line 3.
3. **Optional numerical proofs** (install count, years-in-business). If supplied, swap into the stat bar in place of one of the verbal claims.

## Design system

- **Type:** Fraunces (display serif, variable, 300–700 italic + roman) + Inter (body sans). Both Google Fonts.
- **Colors:**
  - Cream `#FAF7F0` — page background
  - Ink `#0A0A0A` — text
  - Navy `#0F3D86` — italic accent in headlines, link hover, hero label
  - Green `#5EB434` — **button only** (never decorative)
  - Gold `#F4B942` — star ratings + utility bar emphasis
- **Spacing:** section padding `clamp(56px, 8vw, 112px)` (tighter than v2 — references run denser)
- **Hairlines** for dividers, no card backgrounds except the two form cards (where the card framing is the conversion mechanic)
- **Grid:** hero 7/5 split (copy + photo), hero form card spans full width, section heads use a single column for tighter rhythm
