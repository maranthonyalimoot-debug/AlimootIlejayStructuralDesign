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

## Public inquiry form

The "Contact" section on the site (`index.html`) is a multi-step wizard that submits directly to the Supabase `inquiries` table via `js/supabaseClient.js` (same project/key as `/admin` — safe to expose, since anonymous access to `inquiries` is INSERT-only). A hidden honeypot field (`companyWebsite`) quietly drops obvious bot submissions client-side without alerting the bot.

## `/admin`: inquiries, lead pipeline + task tracker

`alimo-ot-ilejay-pwa/admin/` is an internal dashboard (unlinked from the public nav, `noindex`'d) for triaging inquiries, tracking leads by stage, and tasks by status — shared between Mar Anthony and Samantha.

- **Data:** Supabase Postgres tables `inquiries`, `leads`, and `tasks` (see `admin/js/store.js` for the schema mapping). Row Level Security restricts admin access (read/update/delete, and insert on `leads`/`tasks`) to an explicit email allow-list (`maranthonyalimoot@gmail.com`, `ilejaysamantha@gmail.com`) — not just "any authenticated user" — since the publishable key is inherently client-visible. `inquiries` additionally has an anonymous INSERT-only policy so the public form can submit without an authenticated session. New inquiries can be triaged (status, internal notes) or converted into a lead card from the **Inquiries** tab; conversion folds the inquiry's extra fields into the lead's notes and links back via `converted_lead_id`.
- **Auth:** Supabase Auth (email/password). Accounts for both emails already exist; manage/reset them from the Supabase dashboard under Authentication → Users.
- **Realtime:** all three tables are in the `supabase_realtime` publication, so the board auto-refreshes when either person makes a change, or a new inquiry comes in.
- The publishable key in `admin/js/supabaseClient.js` (and `js/supabaseClient.js` on the public site) is safe to commit — it's meaningless without a matching RLS-allowed session. Never commit the project's **service_role** key anywhere in this repo.
