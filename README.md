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
- **Backend:** [Supabase](https://supabase.com) — provisioned for a future CRM/admin section (inquiries, project management, etc.). Not yet wired into the site.

## Roadmap: Supabase / CRM

Supabase is planned as the backend for a future CRM/admin section (e.g. storing contact-form inquiries, managing portfolio content). Not yet provisioned — the HexaSolve org is currently at its free-tier active-project limit (2), so creating `alimo-ot-ilejay-crm` is blocked until a slot is freed (pause/delete an existing project) or the org upgrades.

Planned details once created:

- Project name: `alimo-ot-ilejay-crm`
- Region: Southeast Asia (Singapore)

Once created, record the project URL and anon/publishable key in the deployment environment (the anon key is safe to expose client-side once Row Level Security policies are in place). Do not commit the Supabase **service_role** key anywhere in this repo.
