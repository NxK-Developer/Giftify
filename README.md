# NxK Greetings — Cinematic Personalized Greetings Platform

> **Make Someone's Day Special ✨** — create a beautiful personalized greeting they will never forget:
> cinematic scenes, particle hearts, generative music, and one unique shareable link.
>
> Created with **NxK Developer** · Founder — **Nishant Singh** · Co-Founder — **Khushi**

NxK Greetings is a complete, production-quality web app that turns a few typed lines into a
**cinematic digital surprise**. The creator walks an 8-step wizard (occasion → template → personalize →
theme → animation → music → preview → generate), and the recipient opens a short link (`/g/Ab7Kx92`)
that plays a staged, animated, musical experience built entirely in the browser — canvas particles,
heart formations, terminal code intros, typewriter reveals and **procedurally synthesized music**
(no audio files, no CDN, no paid APIs).

Everything runs on the **Firebase Spark (₹0) plan**: Authentication + Cloud Firestore + Hosting.
Nothing else. No Firebase Storage, no Cloud Functions, no third-party SDKs, no stock assets.

---

## Table of contents

1. [Feature tour](#feature-tour)
2. [Tech stack](#tech-stack)
3. [Quick start](#quick-start)
4. [Environment variables](#environment-variables)
5. [Demo Mode (honest offline mode)](#demo-mode-honest-offline-mode)
6. [Creator flow & routes](#creator-flow--routes)
7. [The recipient experience](#the-recipient-experience)
8. [Data model & security rules](#data-model--security-rules)
9. [Admin panel](#admin-panel)
10. [Creator dashboard & accounts](#creator-dashboard--accounts)
11. [₹0 architecture notes](#0-architecture-notes)
12. [Performance & accessibility](#performance--accessibility)
13. [PWA, SEO & brand assets](#pwa-seo--brand-assets)
14. [Project structure](#project-structure)
15. [Scripts](#scripts)
16. [Deploying to Firebase Hosting](#deploying-to-firebase-hosting)
17. [Troubleshooting](#troubleshooting)
18. [Roadmap (v2)](#roadmap-v2)
19. [Credits](#credits)

---

## Feature tour

**Creator wizard**

- **12 occasions** — birthday, love, friendship, congratulations, anniversary, thank-you, sorry,
  good morning, good night, "just because", festival, new year.
- **18 templates** — config-driven (`TemplateConfig`): each pre-tunes occasion, theme, animation,
  music, accent emoji and opening words. Admins can disable any template live via Firestore.
- **Personalization** — recipient name, sender name, nickname, relationship, special date, and a
  message with live counters and input sanitization (no `innerHTML`, no `eval`, anywhere).
- **7 themes** — Galaxy, Blossom, Heart, Matrix, Sunset, Celebration, Minimal. Each theme is pure
  data (palette, particle kind, glow, font tone) that re-skins every animation engine.
- **6 animation styles** — cinematic terminal code intro, heart formation (`x = 16sin³t`,
  `y = 13cos t − 5cos 2t − 2cos 3t − cos 4t`), petal bloom, digital rain, confetti burst, classic reveal.
- **6 music moods** — Dreamy, Romantic, Calm, Celebration, Emotional, or silence. All music is
  **generated with the Web Audio API** (lookahead scheduler, per-mood timbres). Nothing is downloaded.
- **Preview & generate** — full-screen rehearsal, then publish to Firestore (or to the on-device
  store in Demo Mode) with scheduling, expiration, privacy and optional password protection.
- **Share screen** — "Your surprise is ready! 🎉", the link, one-click copy, **QR code PNG download
  (generated locally)**, native Web Share with honest fallbacks, and WhatsApp / X / Facebook /
  Telegram / email deep links.

**Recipient experience (`/g/:id`)**

- Staged cinematic playback: gate → intro → formation → message → finale credits
  ("Created with NxK Developer · Founder — Nishant Singh · Co-Founder — Khushi").
- Controls: pause / replay / progress bar / music toggle / volume, all keyboard-accessible.
- Music starts on the first tap (autoplay-policy compliant); tab-hidden pauses every engine.
- Password-protected greetings show a lock screen (PBKDF2-SHA256, 8-attempt session limit).
- Scheduled greetings show a live countdown; expired/disabled/private show honest states.
- Reporting (spam / harassment / inappropriate / abuse / other) on every greeting.

**Platform**

- Email+password accounts, anonymous guest mode, and guest → email upgrade that keeps your data.
- Creator dashboard: stats with animated count-ups, greeting cards with search / filter / sort,
  open / edit / duplicate / share / QR / delete, and "Save to Cloud" for demo-mode creations.
- Admin panel (7 sections) gated by server-side role checks: Overview, Users, Greetings, Reports,
  Templates, Analytics, Settings.
- PWA: installable manifest, hand-rolled service worker, generated icons.
- Dark cinematic design system (glassmorphism), mobile-first from 320 px, reduced-motion respected.

---

## Tech stack

| Layer      | Choice | Why |
| ---------- | ------ | --- |
| UI         | React 19 + TypeScript (strict) | Modern hooks, typed domain model |
| Build      | Vite 8 | Instant dev, hashed immutable assets |
| Styling    | Tailwind CSS v4 (`@tailwindcss/vite`) | Design tokens via `@theme`, zero runtime |
| Routing    | React Router v7 | Lazy route-level code splitting |
| Icons      | lucide-react | Tree-shakeable, consistent stroke set |
| QR         | `qrcode` | Generated 100% locally |
| Animation  | Canvas API (custom engines) | No GSAP/Lottie cost; full perf control |
| Audio      | Web Audio API | Generative music, zero audio files |
| Backend    | Firebase Auth + Cloud Firestore + Hosting | Entirely within the ₹0 Spark plan |
| Fonts      | `@fontsource-variable/*` | Self-hosted, offline-friendly, free |

Firebase is **lazily imported**: the SDK chunks load only on routes that need them, so a visitor who
only reads a greeting never downloads Auth/Firestore code paths they don't use. Only
`firebase/app`, `firebase/auth` and `firebase/firestore` are imported — **Firebase Storage is never
imported or called in v1**, even if `VITE_FIREBASE_STORAGE_BUCKET` is present in the environment.

---

## Quick start

```bash
# 1. Install (Node 20+ recommended)
npm install

# 2. Configure environment (optional — see Demo Mode below)
cp .env.example .env.local
#    fill in the VITE_FIREBASE_* values from your Firebase web app

# 3. Develop
npm run dev

# 4. Production build (type-checks first)
npm run build
npm run preview
```

First run without any env file? The app boots into **Demo Mode** and says so in the UI — see below.

---

## Environment variables

Copy `.env.example` → `.env.local`:

| Variable | Purpose |
| -------- | ------- |
| `VITE_FIREBASE_API_KEY` | Firebase web app API key (public identifier; rules do the protecting) |
| `VITE_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project id |
| `VITE_FIREBASE_STORAGE_BUCKET` | Accepted for the future — **unused in v1** |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender id |
| `VITE_FIREBASE_APP_ID` | App id |
| `VITE_APP_URL` | Optional public origin used for canonical/OG/share URLs |

In Firebase Console → Authentication, enable **Email/Password** and **Anonymous** providers, and add
your hosting domain to *Authorized domains*.

---

## Demo Mode (honest offline mode)

When the Firebase env vars are missing, the app still works end-to-end — but **never pretends**:

- A visible **Demo Mode** badge appears in the header, dashboard and share screens.
- Greetings are stored in `localStorage` on your device; the share link still plays for anyone using
  *that browser* (the id resolves locally), and the UI explains this in plain words.
- Auth becomes a clearly-labeled local demo identity — no fake accounts, no fake cloud saves.
- Analytics counters come from a device-local stats store, labeled as "on this device".
- Admin tools, reporting and cloud analytics throw friendly errors instead of inventing data.
- After signing in for real, demo greetings can be promoted to Firestore with **Save to Cloud**.

This is a design commitment: *no fake auth, no fake saves, no fake analytics.*

---

## Creator flow & routes

```
/                Landing (hero, live experience preview, occasions, how-it-works, FAQ, footer)
/create          Wizard entry (resume draft / start fresh)
/occasion        12 occasion cards
/templates       18 template cards (admin-disabled ones hidden)
/personalize     Names, nickname, relationship, date, message (+ emoji picker, draft autosave)
/theme           7 live-animated theme cards
/animation       6 animation previews
/music           6 generative moods with instant audition
/preview         Full rehearsal with the exact recipient staging
/generate        Publish (validation, rate limits, privacy, schedule, password)
/share           Link, copy, QR PNG, Web Share, platform links
/g/:id           Recipient experience
/demo            The sample greeting (recipient: Aarav, from "Your Best Friend")
/login /signup   Email + password, guest mode, guest→email upgrade
/dashboard       Stats + recent greetings      /dashboard/greetings   /dashboard/settings
/admin           Overview   /admin/users   /admin/greetings   /admin/reports
                 /admin/templates   /admin/analytics   /admin/settings
/404             Cinematic not-found (also catches `*`)
```

Drafts autosave to `localStorage` on every wizard change and offer **Restore / Discard** on return.

---

## The recipient experience

Stages are timed by a pause-aware `stageTimer` (timestamps, not accumulated deltas), so pause/resume
and tab-visibility are exact:

1. **Gate** — tap to begin (unlocks audio), or password screen when protected.
2. **Intro** — terminal code reveal / typewriter, themed particles rising.
3. **Formation** — particles gather into the heart curve (`x = 16sin³t`), burst into confetti.
4. **Message** — the personalized letter, script or display type, flourish canvas behind.
5. **Finale** — credits card with the NxK Developer founder lines and share-back actions.

Every engine honors a performance tier (`high / medium / low`, auto-detected via an FPS probe and
device heuristics, overridable in Settings) and `prefers-reduced-motion` (instant, calm rendering).

---

## Data model & security rules

```
users/{uid}        email, displayName, role: 'user' | 'admin', createdAt, lastLoginAt, greetingCount
greetings/{id}     ownerId, occasion, templateId, recipientName, senderName, nickname, relationship,
                   specialDate, message, theme, animation, music, privacy: public|unlisted|private,
                   status: active|disabled, views, shares, scheduledAt, expiresAt,
                   passwordHash, passwordSalt, createdAt, updatedAt, lastViewedAt
reports/{id}       greetingId, reason, details, reporterUid|null, status: pending|reviewed|dismissed, createdAt
templates/{id}     { enabled?: boolean } overrides for bundled template configs
themes/{id}        { enabled?: boolean } overrides (reserved)
```

`firestore.rules` enforces (there is **no `allow true`** anywhere):

- **Roles are server-side**: profile create forces `role == 'user'`; self-updates may never change
  `role`; only an existing admin (read from `users/{uid}` inside the rule) can grant/revoke.
- **Ownership**: greetings list/update/delete require `ownerId == request.auth.uid` (or admin).
- **Privacy**: `get` on a greeting requires `status == 'active' && privacy != 'private'` for
  strangers; private greetings are readable only by owner/admin; disabled greetings vanish for
  recipients (they surface as "not found").
- **Counter integrity**: `views`/`shares` may only change via `+1` diffs touching exactly those
  fields (`increment()` shape); `greetingCount` may move by ±1 per write.
- **Field validation**: every string length mirrors `src/constants/limits.ts`; enums are whitelisted;
  ids must match `^[A-Za-z0-9]{4,16}$`.
- **Reports**: anyone can file (shape-locked, `status` starts `pending`); read/moderation is
  admin-only, and status transitions are limited to the whitelist.

Known, documented limitation: on the ₹0 plan there is no Cloud Functions tier, so rate limits
(create/report cooldowns, password attempts) are enforced client-side as best-effort abuse friction.
Password checks are client-side PBKDF2-SHA256 (150k iterations + per-greeting salt) — strong against
casual snooping of shared links, not a substitute for server-side auth on truly sensitive content.

---

## Admin panel

Bootstrap (one-time, from the **Firebase Console**, never from the client):

1. Sign in to the app once so `users/{uid}` exists.
2. Firestore → `users` → your uid → add field `role` (string) = `admin`.
3. Refresh — the `/admin` routes unlock.

From there: grant/revoke admins (Users), disable/re-enable or delete greetings (Greetings),
triage reports (disable-with-one-click, mark reviewed, dismiss), flip template `enabled` overrides
(Templates), read aggregate analytics sampled from the 500 newest greetings (Analytics), and review
backend status / limits / deploy checklist (Settings). In Demo Mode every admin tool explains that
it needs the live backend instead of showing empty fake tables.

---

## Creator dashboard & accounts

- Sign-up / login with email+password; **Continue as guest** uses Firebase anonymous auth (or a
  labeled local identity in Demo Mode). Upgrading guest → email links the credential and **keeps the
  same uid**, so guest-created greetings stay yours.
- Dashboard stats: greetings created, total views, total shares, completion rate (with the exact
  definition in a tooltip), animated count-ups, recent-greeting grid.
- Greetings table: search, occasion/status filters, four sorts, and per-card actions
  (open, edit, duplicate, share, QR, delete with confirm).
- Settings: display name, performance tier, force-reduced-motion, volume, clear draft, clear
  on-device greetings, and an honest backend-status card.

---

## ₹0 architecture notes

- **No Storage bucket usage.** QR codes, icons and OG images are generated locally or committed as
  static assets; uploads are simply not part of v1. The future path (v2) is documented below.
- **No Cloud Functions.** Aggregations use `getCountFromServer` + bounded 500-doc samples; view/share
  counters use atomic `increment(1)`.
- **No paid APIs or assets.** Fonts are self-hosted variable fonts; music is synthesized; particles
  are drawn with canvas sprites; icons come from `scripts/generate-icons.mjs` (pure Node + zlib).
- **Bounded reads by design.** Admin analytics/overview never scan unbounded collections.
- **Static everything.** One `dist/` folder on Hosting; the service worker keeps the shell offline.

---

## Performance & accessibility

- Route-level lazy loading; Firebase chunks only where needed; canvas engines share one rAF-driven
  base class with sprite-cached glows (no per-particle `shadowBlur`).
- Performance tiers scale particle counts, DPR and effects; the FPS probe downgrades automatically;
  hidden tabs pause every engine and the audio scheduler.
- `prefers-reduced-motion` (system or forced in Settings) collapses animations to calm, instant states.
- Semantic landmarks, focus-visible rings, modal focus trap + ESC, `role="status"` loaders,
  labeled controls, 44 px touch targets where possible, and color-contrast-checked tokens.
- Mobile-first from 320 px; the wizard, dashboard and admin all collapse to single-column layouts.

---

## PWA, SEO & brand assets

- `public/manifest.webmanifest` — installable, shortcuts for Create / Demo / Dashboard, maskable icons.
- `public/sw.js` — hand-rolled: precached shell, network-first navigations with offline fallback,
  cache-first hashed assets, stale-while-revalidate for the rest. Registered in production only.
- `public/icon.svg` + `public/icons/*.png` — generated by `npm run icons` (pure Node PNG encoder,
  SDF-rendered monogram; deterministic output, no dependencies).
- SEO: per-route titles/descriptions/canonicals via `useSeo`, Open Graph + Twitter cards,
  `robots.txt` that keeps `/g/*`, dashboard and admin out of crawlers, `noindex` on private routes.

---

## Project structure

```
src/
  animations/        canvas engines (particles, matrix, heart, flower, confetti),
                     CodeReveal/Typewriter controllers, perf tiers, canvas math
  components/
    admin/           AdminLayout
    animations/      React wrappers (TerminalIntro, HeartCanvas, MatrixCanvas, …)
    background/      ParticleBackground, GradientBlobs
    common/          Button, Modal, Input/Select/Textarea, Toggle, Badge, Toasts, guards…
    creator/         WizardShell, TemplateCard, LivePreviewCard, SharePanel, QRCodePanel
    dashboard/       DashboardLayout, GreetingCard
    landing/         hero → footer sections
    recipient/       stages, RecipientControls, RecipientExperience, GreetingGate
  constants/         brand, occasions, templates, themes, animations, music, limits, emojis
  hooks/             useSeo, useCountUp, useMediaQuery, usePageVisibility, useMyGreetings
  lib/               env (Demo Mode detection), lazy firebase bootstrap
  pages/             every route (wizard, share, greeting, auth, dashboard/*, admin/*)
  services/          auth, user, greeting, analytics, report, share, qr, music, admin, template, draft
  store/             Auth / Creator / Settings / Toast contexts
  utils/             sanitize, format, storage, hash, id, validate, stageTimer, cn
scripts/
  generate-icons.mjs dependency-free PNG/SVG brand asset generator
public/              manifest, sw.js, robots.txt, icon.svg, icons/*
firestore.rules      security rules (see above)
firestore.indexes.json  composite indexes for dashboard/admin queries
firebase.json        hosting + headers (CSP, HSTS, caching) + rules/indexes pointers
```

---

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` type-check + production bundle |
| `npm run preview` | Serve the production bundle locally |
| `npm run lint` / `lint:fix` | ESLint (flat config, typescript-eslint, react-hooks) |
| `npm run typecheck` | Type-check without emitting |
| `npm run icons` | Regenerate `public/icon.svg` + `public/icons/*.png` (no deps) |

---

## Deploying to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init          # pick Hosting (dist), Firestore rules + indexes; accept firebase.json
npm run build
firebase deploy --only firestore:rules,firestore:indexes   # security first
firebase deploy --only hosting
```

Then set `role: "admin"` on your `users/{uid}` document in the console (see Admin panel).

---

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| App shows **Demo Mode** | Expected without `VITE_FIREBASE_*` in `.env.local`. Add them and rebuild. |
| "permission-denied" on admin pages | Your `users/{uid}.role` isn't `admin`; set it in the console. |
| Sign-in popup blocked / auth errors | Add your domain (incl. `localhost`) to Auth → Authorized domains. |
| No music | Browsers require a gesture: tap "Begin" on the gate. Volume lives in Settings + player. |
| QR download does nothing | Rare browsers block programmatic downloads; the Share panel falls back to a right-click-save image. |
| Old UI after a deploy | The SW updates on navigation; DevTools → Application → Service Workers → Update, or send `SKIP_WAITING`. |
| Composite-index error in console | Run `firebase deploy --only firestore:indexes` (the CLI also prints a one-click link). |
| Greeting link 404s for others | In Demo Mode links only resolve on the creating device — that's the honest fallback, labeled in the UI. |

---

## Roadmap (v2)

- **Firebase Storage** (the documented future path): photo uploads in greetings, with resized
  derivatives via an extension or a client-side canvas pipeline to stay cheap.
- Cloud Function aggregations once budget allows (replacing bounded samples).
- Comments/reactions on greetings, remixable public templates, and localized occasions.

---

## Credits

Built and maintained by **NxK Developer**.

- **Founder — Nishant Singh**
- **Co-Founder — Khushi**

Free forever, made with love (and a lot of canvas particles). 💜
