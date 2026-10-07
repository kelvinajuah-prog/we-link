# Deploy WE-LINK on Netlify

This project is a **static multi-page site** (HTML, CSS, JS at the repo root). There is no Vite/webpack build for the main app. Supabase runs in the browser via `js/config.js`.

## Prerequisites

1. **Supabase project** with migrations applied (`supabase db push` or run files under `supabase/migrations/`).
2. **Git repository** connected to Netlify (recommended), or manual deploy of the publish folder.

## Netlify site settings

| Setting | Value |
|--------|--------|
| **Build command** | `npm run build:netlify` (from `netlify.toml`) |
| **Publish directory** | `.` (repository root) |
| **Node version** | 20 (set in `netlify.toml`) |

## Required environment variables

In **Site configuration → Environment variables**, add:

| Variable | Description |
|----------|-------------|
| `WELINK_SUPABASE_URL` | Project URL, e.g. `https://xxxx.supabase.co` |
| `WELINK_SUPABASE_ANON_KEY` | **Anon / publishable** key (not the service role secret) |

The build runs `scripts/generate-config.js`, which writes `js/config.js` during deploy. That file is gitignored locally.

### Local development

```bash
copy js\config.example.js js\config.js
# edit js/config.js with your Supabase URL and anon key
npx serve . -l 5173
```

Or generate from env:

```bash
set WELINK_SUPABASE_URL=https://....supabase.co
set WELINK_SUPABASE_ANON_KEY=eyJ...
node scripts/generate-config.js
```

## Supabase Auth (required for login)

In [Supabase Dashboard → Authentication → URL configuration](https://supabase.com/dashboard/project/_/auth/url-configuration):

1. **Site URL**: `https://YOUR-SITE.netlify.app` (or your custom domain).
2. **Redirect URLs** (add each you use):
   - `https://YOUR-SITE.netlify.app/**`
   - `http://localhost:5173/**` (local dev)

Without this, sign-in can fail or redirect incorrectly on production.

## Optional build step

`npm run build:netlify` also runs `build:invite-ui`, which rebuilds the pro invite widget into `assets/welink-invite/`. Prebuilt assets are already in the repo; skip failures in CI only if you never change that widget.

## What gets excluded from upload

See `.netlifyignore` (`.cursor/`, `node_modules/`, etc.). The live site needs `index.html`, `css/`, `js/`, `img/`, and other HTML entry points.

## Post-deploy checklist

- [ ] Home page loads over **HTTPS**
- [ ] Guest/pro/admin **login** works
- [ ] **Dashboard** loads data (RLS + anon key)
- [ ] **Admin** charts and realtime (Supabase realtime enabled for relevant tables)
- [ ] Landing **chatbot** (uses public Pollinations API from the browser)

## Custom domain

Add the domain in Netlify, then add the same domain to Supabase **Site URL** and **Redirect URLs**.

## Security notes

- The anon key in `js/config.js` is **expected** for Supabase SPAs; protect data with **RLS**, not by hiding the anon key.
- Never put the **service role** key in Netlify env vars consumed by the static site build unless you add a serverless function (this project does not).
