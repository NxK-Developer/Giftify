# Firebase Production Deployment Checklist (₹0 / Spark plan)

Exact, ordered runbook for deploying **NxK Greetings** from this repository.
Legend:

- 🖐 **MANUAL — Firebase Console** (only you, in a browser, with your Google account)
- 💻 **CLI — your machine** (commands that need your Google login; the agent cannot authenticate to Google)
- 🤖 **AGENT-EXECUTABLE in this workspace** (no credentials needed — build, verify, preview, git/PR, and live-URL smoke tests once you paste the URL)

> The repository already ships `firebase.json`, `firestore.rules` and
> `firestore.indexes.json`. **Do not run `firebase init`** — it can overwrite
> those files. `firebase use --add` is enough to bind a project.

---

## 1. Prerequisites

| # | Item | Who |
| - | ---- | --- |
| 1 | Node 20+ and npm on the deploying machine | 💻 |
| 2 | `npm install -g firebase-tools` | 💻 |
| 3 | A Google account; create the Firebase project on the **Spark (free) plan** — no billing card required | 🖐 |
| 4 | Repo cloned, `npm install` done | 🤖 or 💻 |

---

## 2. Firebase Console configuration (🖐 manual, in this order)

1. **Create the project** — [console.firebase.google.com](https://console.firebase.google.com) → *Add project* → name e.g. `nxxk-greetings`.
   - **Skip Google Analytics** (not used by the app; keeps the bundle and quota clean).
2. **Register a Web app** — Project overview → *Web* (`</>`) icon → nickname `NxK Greetings` → *Register app*.
   - Copy the `firebaseConfig` values — they become the env vars in §3.
3. **Authentication → Sign-in method** — enable exactly two providers:
   - **Email/Password** ✔
   - **Anonymous** ✔ (guest mode + guest→email upgrade depend on it)
   - (Optional) *Settings → User-facing app name / support email* so password-reset mails look right.
4. **Firestore Database → Create database**
   - Mode: **Start in production mode** (locked by default; our rules deploy in §5).
   - Location: pick once — **it cannot be changed later**. For an Indian audience: `asia-south1` (Mumbai).
5. **Hosting → Get started** — just enables Hosting for the project (deploys happen from CLI).
6. **Authentication → Settings → Authorized domains** — confirm these are present:
   - `localhost` (dev), `<PROJECT_ID>.firebaseapp.com`, `<PROJECT_ID>.web.app` (added automatically when Hosting is enabled).
   - Add your **custom domain** here *and* in Hosting → *Add custom domain* if you use one.
7. *(Optional, recommended)* **Billing → Budgets & alerts** — even on Spark, create a ₹0/$1 budget alert so you hear about any unexpected usage immediately.

Nothing else in the console is required. Collections (`users`, `greetings`,
`reports`, `templates`) are created automatically by the app on first write —
**do not pre-create them or add documents by hand** (except the admin role in §6).

---

## 3. Environment variables (🖐 copy values → 💻/🤖 write `.env.local`)

Source of every value: **Project settings (⚙) → General → Your apps → Web app → SDK setup and configuration**.

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `VITE_FIREBASE_API_KEY` | ✅ | Public identifier; security comes from `firestore.rules` |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | `<PROJECT_ID>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | |
| `VITE_FIREBASE_STORAGE_BUCKET` | ⛔ accepted, **unused** | v1 never imports Firebase Storage; leave as-is for the future |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | |
| `VITE_FIREBASE_APP_ID` | ✅ | |
| `VITE_APP_URL` | optional | Canonical origin for SEO/OG/share links. Set to `https://<PROJECT_ID>.web.app` **before building** (Vite inlines `VITE_*` at build time); defaults to `window.location.origin` when unset |

```bash
cp .env.example .env.local   # then paste the values
```

`.env.local` is gitignored — never commit real keys. Missing vars = honest
**Demo Mode**, never a crash.

---

## 4. Build & verification (🤖 agent-executable right now)

```bash
npm install          # or npm ci
npm run typecheck    # tsc -b --noEmit
npm run lint         # 0 errors expected (5 react-refresh warnings are intentional)
npm run build        # emits dist/
npm run preview      # local production smoke test on :4173
npm run icons        # only if brand assets ever need regeneration (deterministic)
```

The agent can also `curl`-smoke-test any live URL you paste (§7, block A).

---

## 5. Deployment commands (💻 CLI on a Google-authenticated machine)

```bash
firebase login                                  # Google OAuth — agent cannot do this
firebase use --add                              # pick the project, alias "default"; writes .firebaserc
npm run build                                   # MUST happen after .env.local exists (§3)

# Security first, then the app:
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only hosting
```

- Order matters: rules/indexes live **before** the first user can reach the UI.
- `firebase.json` already points at `firestore.rules`, `firestore.indexes.json`
  and `dist/`, and defines SPA rewrites + CSP/HSTS/caching headers — nothing to edit.
- Optionally commit the generated `.firebaserc` (project id only, no secrets) so future deploys skip `firebase use`.
- First deploy output gives the live URL: `https://<PROJECT_ID>.web.app`.

---

## 6. Admin bootstrap (🖐 manual, one time, after the first deploy)

1. Open the live site → **Sign up** with your own email/password (this creates `users/{yourUid}` via `ensureUserProfile`).
2. Console → **Firestore Database → `users` → your uid document** → *Add field*:
   - name `role`, type `string`, value `admin` → Save.
3. Hard-refresh the app → `/admin` unlocks (role is read server-side by the rules on every request).
4. Every later admin is granted/revoked in **/admin/users** — that write is itself rules-gated to existing admins. No client path can self-promote.

---

## 7. Post-deployment smoke tests

### Block A — HTTP/headers (🤖 agent-executable against the live URL, or 💻)

```bash
URL=https://<PROJECT_ID>.web.app
curl -s -o /dev/null -w '%{http_code}\n' $URL/                      # 200
curl -s -o /dev/null -w '%{http_code}\n' $URL/some/unknown/route    # 200 (SPA rewrite)
curl -sI $URL/ | grep -i content-security-policy                    # CSP header present
curl -sI $URL/sw.js | grep -i cache-control                         # no-cache
curl -sI $URL/manifest.webmanifest | grep -i content-type           # application/manifest+json
curl -sI $URL/assets/$(ls dist/assets | grep '^index-.*js$' | head -1) | grep -i cache-control   # immutable
curl -s -o /dev/null -w '%{http_code}\n' $URL/icons/icon-512.png     # 200
```

### Block B — product flows (🖐 browser, ~10 min)

1. **Landing** `/` renders; no "Demo Mode" badge anywhere (env is live).
2. **Sign up** with email → create a greeting end-to-end → **Share** screen: copy link, download QR PNG, native/share-fallback links work.
3. Open `/g/<id>` in an **incognito window** → experience plays; music starts on tap; pause/replay/progress work; back in the dashboard the **views counter** became 1 (reloading incognito once more must *not* double-count — session dedupe).
4. **Guest flow**: Continue as guest → create → upgrade guest→email → the guest greeting is still owned by you (same uid).
5. **Password gate**: create a greeting with a password → incognito shows the lock; wrong passwords are refused (8 attempts/session).
6. **Schedule gate**: schedule +2 min → incognito shows the countdown, then opens.
7. **Privacy**: set a greeting *private* → incognito (stranger) sees "not found"; you still see it.
8. **Reports**: from a greeting page file a report → appears in `/admin/reports`; *Disable greeting* → incognito now sees "not found"; re-enable restores it.
9. **Admin negative test**: signed in as a *non-admin* account, `/admin/users` shows the permission-denied error state (never fake tables).
10. **PWA**: DevTools → Application → manifest valid, SW active; enable Offline → shell still loads and network-dependent screens fail with honest messages.
11. **Console cleanliness**: no CSP violations, no 404 assets, no Firestore `permission-denied` spam in DevTools during the above.

### Block C — data integrity (🖐 console spot-checks)

- `greetings/<id>`: `views` incremented by exactly 1 per new session; `shares` +1 per share action.
- `users/<uid>`: `greetingCount` matches the dashboard; `role` untouched (`user`) for non-admins.
- Firestore → Usage: reads/writes stay within Spark daily quota (bounded queries by design).

---

## 8. Rollback & ops notes

- **Hosting**: redeploy the previous git commit (`git checkout <sha> && npm run build && firebase deploy --only hosting`); releases are also listed under Hosting → *Releases* for reference.
- **Rules/indexes**: `git checkout <sha> -- firestore.rules firestore.indexes.json && firebase deploy --only firestore:rules,firestore:indexes`.
- **Bad template live?** `/admin/templates` → disable it (Firestore override, instant, no redeploy; existing greetings keep playing).
- **Spark quotas** (design constraints already respected by the code): Firestore ≈ 50k reads / 20k writes / 20k deletes per day; Hosting ≈ 10 GB egress per month; no Cloud Functions, no Storage.
- Expired greetings are **gated in the UI, not auto-deleted** (no Functions tier on ₹0) — storage stays bounded by creator/admin deletion.
