# Alimo-ot Ilejay Structural Design

Marketing website for Alimo-ot Ilejay Structural Design, a structural engineering firm.

## Repo layout

- **`alimo-ot-ilejay-pwa/`** — the live site. A plain static HTML/CSS/JS Progressive Web App (no framework, no build step). This is what gets deployed.
- **`alimo-ot-ilejay-prototype/`** — an earlier single-file draft, kept for historical reference only. Not deployed.
- **`vscode-build-prompt.md`** — the original build spec used to generate the PWA.

## Local development

```bash
cd alimo-ot-ilejay-pwa
npm install
npm run dev
```

This starts a local static server (via `http-server`) at `http://localhost:5500`.

## Deployment

- **Hosting:** Vercel, deployed from this GitHub repo with the project root set to `alimo-ot-ilejay-pwa` (static site, no build command).
- **Backend:** [Supabase](https://supabase.com) project `alimo-ot-ilejay-crm` (org "Alimo-ot Ilejay Structural Design", region ap-southeast-1), backing `/admin`'s leads pipeline and task tracker.

## `/admin`: lead pipeline + task tracker

`alimo-ot-ilejay-pwa/admin/` is an internal dashboard (unlinked from the public nav, `noindex`'d) for tracking leads by stage and tasks by status, shared between Mar Anthony and Samantha.

- **Data:** Supabase Postgres tables `leads` and `tasks` (see `admin/js/store.js` for the schema mapping). Row Level Security restricts all access to an explicit email allow-list (`maranthonyalimoot@gmail.com`, `ilejaysamantha@gmail.com`) — not just "any authenticated user" — since the publishable key is inherently client-visible.
- **Auth:** Supabase Auth (email/password). Accounts for both emails already exist; manage/reset them from the Supabase dashboard under Authentication → Users.
- **Realtime:** both tables are in the `supabase_realtime` publication, so the board auto-refreshes when either person makes a change.
- The publishable key in `admin/js/supabaseClient.js` is safe to commit — it's meaningless without a matching RLS-allowed session. Never commit the project's **service_role** key anywhere in this repo.
