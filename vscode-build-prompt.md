# Build Prompt — Alimo-ot Ilejay Structural Design (PWA)

Paste everything below into your AI coding assistant in VS Code (Copilot Chat, Claude, Cursor, etc.) as a single instruction.

---

Build a production-ready Progressive Web App that is an EXACT rebuild of the site described below — same copy, same layout, same design system, same interactions — but structured as a proper multi-file PWA instead of a single HTML file.

## 1. File structure to create

```
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── manifest.json
├── sw.js
├── assets/
│   ├── hero-makati.jpg          (Makati skyline photo, used as hero background)
│   ├── buildings/
│   │   ├── PCT.jpg
│   │   ├── ParklinksRetail.jpg
│   │   ├── Bauhinia.jpg
│   │   ├── BanyanTree.jpg
│   │   ├── Vermosa.jpg
│   │   ├── TheHeights.jpg
│   │   ├── LaCassia.jpg
│   │   └── ParkMcKinley.jpg
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── icon-maskable-512.png
```

I already have the images in `assets/` — reference them with normal relative paths (`assets/hero-makati.jpg`, `assets/buildings/PCT.jpg`, etc.), do NOT inline them as base64. If an image path has no photo yet, fall back to a simple gradient/placeholder `<div>` (no external SVG generation library needed).

## 2. Brand & content

**Firm name:** Alimo-ot Ilejay Structural Design
**Tagline / eyebrow:** Structural Design Engineers · Philippines
**Founders:**
- Mar Anthony Alimo-ot — Licensed Civil Engineer. B.S. Civil Engineering, Central Philippine University (Cum Laude). Registered Civil Engineer (RCE), PRC Philippines, since Nov. 2019.
- Samantha Ilejay — Licensed Civil Engineer. B.S. Civil Engineering, Central Philippine University. M.B.A., Hult International Business School, UK (With Academic Distinction). Registered Civil Engineer (RCE), PRC Philippines, since Nov. 2019.

**Contact:** hello@alimootilejay.com · Metro Manila, Philippines · Response time: within 1 business day

## 3. Design system (implement as CSS custom properties on `:root`)

```css
:root{
  --bg:#ffffff;
  --bg-alt:#f5f4f1;
  --ink:#0a0a0c;
  --ink-soft:#232327;
  --body:#4d4d52;
  --muted:#8b8b90;
  --line:rgba(10,10,12,.13);
  --line-strong:rgba(10,10,12,.4);
  --copper:#b9702e;
  --copper-soft:#e7c9a3;
  --steel:#3d5a80;
  --radius:1px;
  --sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif;
  --serif:Georgia,'Iowan Old Style','Times New Roman',Times,serif;
  --maxw:1220px;
}
```

Global rules:
- `html{scroll-behavior:smooth;}`
- Body font: `var(--sans)`, color `var(--body)`, background `var(--bg)`, `-webkit-font-smoothing:antialiased`.
- Headings (`h1,h2,h3,h4`): `font-family:var(--sans)`, `font-weight:800`, `color:var(--ink)`, `letter-spacing:-.01em`.
- Paragraphs: `line-height:1.7`, `color:var(--body)`.
- Container: `.wrap{max-width:var(--maxw);margin:0 auto;padding:0 32px;}`
- `.eyebrow`: small uppercase copper label, `font-size:12px`, `letter-spacing:.16em`, `font-weight:700`, with a 26×1.5px copper rule before it (`::before`).
- Buttons (`.btn`): uppercase, `font-size:13px`, `font-weight:700`, `letter-spacing:.06em`, `padding:16px 28px`, sharp corners (`--radius:1px`).
  - `.btn-primary`: ink background, white text, hovers to copper background.
  - `.btn-outline`: ink border/text, hovers to filled ink background + white text.
  - `.btn-outline-light`: white/translucent border for use on dark hero background, hovers to solid white.
- Whole site uses a sharp-edged, editorial, high-contrast black/white/copper aesthetic — no rounded corners, no drop shadows, generous whitespace, serif accents optional but sans-serif is the primary typeface throughout.

Reproduce the rest of the visual system (header, nav, mobile drawer, hero, mission cards, service cards, team cards, portfolio grid + filters, contact form, footer) to match the section specs below, using the same restrained, high-contrast, engineering-firm aesthetic: thin 1px hairline borders (`var(--line)`), no shadows, sharp corners, generous padding (100–130px vertical section padding), 3-column grids on desktop collapsing to 1 column on mobile.

## 4. Site structure & exact copy

### Header (sticky, adds `.scrolled` class + subtle shadow/border after 40px scroll)
- Logo: "Alimo-ot Ilejay" (bold) / "Structural Design" (small, below)
- Nav links: Services, About Us, Portfolio, Contact (Services/About Us/Portfolio have a small chevron icon)
- Right side: search icon button, "Get in touch" outline button (links to #contact), hamburger menu toggle (mobile)
- Mobile drawer: same links stacked, plus a primary "Get in touch" button, close (X) button

### Hero
- Full-bleed background: Makati skyline photo (`assets/hero-makati.jpg`) with a dark scrim overlay for text contrast
- Eyebrow (light): "Structural Design Engineers · Philippines"
- H1: "Structure engineered to **endure.**" (last word in copper accent color)
- Subhead: "We deliver efficient and reliable structural engineering solutions, from analysis and design to comprehensive structural design and analysis reports — spanning steel and reinforced concrete structures, designed with safety, efficiency, and constructability in mind."
- Buttons: "Start a Project →" (primary, links #contact), "View Portfolio" (outline-light, links #portfolio)
- Stat row: 13 High-Rise Projects · 7 Years Combined Experience · 2 Licensed Principals

### Mission — "Our Goal" (id="mission")
- Eyebrow: "Our Goal"
- H2: "Structures designed to ensure life safety."
- Subtext: "Every member we design is sized for exactly what it needs to carry — no more, no less — so it performs safely for its full intended service life without inflating cost or construction time."
- 3-column card grid, each numbered 01/02/03:
  1. **Safety First** — "Every design follows all applicable requirements of NSCP 2015, ACI 318, and AISC 360 — in full, not just the minimums."
  2. **Engineered Economy** — "Members are sized from first-principles analysis and hand-verified calculations — trimming excess concrete and steel that add cost without adding capacity."
  3. **Fast, Not Careless** — "We use commercially licensed software and have built our own in-house tools to speed through repetitive calculations without cutting corners."

### Services — "What We Do" (id="services")
- Eyebrow: "What We Do"
- H2: "Structural engineering, scoped to your project."
- Subtext: "Full structural design support for reinforced concrete and steel systems — from analysis and design through to signed and sealed construction drawings — engaged as a specialist consultant on individual members or as part of a project's broader design team."
- 3-column card grid with hairline dividers between cards, each with a line-icon, numbered 01/02/03:
  1. **Structural Analysis & Design** — "Slabs, beams, girders, columns, shear walls, mat foundations, and pile foundations, for both reinforced concrete and steel structures — designed for safety, efficiency, and constructability under NSCP 2015, ACI 318, and AISC 360."
  2. **Design & Analysis Reports** — "Comprehensive structural design and analysis reports prepared for permitting, peer review, and coordination with architects and MEP consultants."
  3. **Complete Structural Plans** — "Full sets of structural construction drawings — signed and sealed, ready for permitting and construction."

(No "Sectors Served" strip — keep this section ending right after the 3-card grid.)

### About Us (id="about")
- Eyebrow: "About Us"
- H2 (normal case, not uppercase): "Two licensed engineers. One standard for the work."
- Subtext: "We're a young firm — but our team's experience isn't. We were trained at the Philippines' leading structural consultancy, intensively involved in the design of mid- to high-rise developments across Metro Manila, and now bring that same rigor directly to your project."
- Two team cards side by side (photo placeholder + name + role + credentials bullet list) for Mar Anthony Alimo-ot and Samantha Ilejay, using the bios above.

### Portfolio (id="portfolio")
- Eyebrow: "Prior Experience"
- H2: "Structural design experience gained across the metro skyline."
- Subtext: "These developments were not designed under Alimo-ot Ilejay Structural Design. They reflect projects our principals worked on as structural engineers employed by Sysquared + Associates Inc., shown here as a record of hands-on experience on real, built structures."
- Filter buttons: All Projects (active) / Ayala Land / Megaworld / Other Developers
- Project grid (3 columns desktop), each card = photo, developer name (small caps), project name (bold), scope of work, and — where applicable — a "lead" line with the engineer's name and employment dates. Data set (render via JS from an array, filterable by `cat`):

```js
const PROJECTS = [
  {name:"Park Central Towers", dev:"Ayala Land Premier", cat:"ayala", scope:"Steel design & detailing of ramp canopy, glass wall & cladding support", lead:"Mar Anthony Alimo-ot · Nov 2022 – Sept 2025", photo:"assets/buildings/PCT.jpg"},
  {name:"Parklinks South Tower", dev:"Ayala Land Premier", cat:"ayala", scope:"Column & foundation design"},
  {name:"Parklinks Retail", dev:"Ayala Land Premier", cat:"ayala", scope:"Steel canopy design", photo:"assets/buildings/ParklinksRetail.jpg"},
  {name:"Bauhinia Tower", dev:"Shang Properties", cat:"other", scope:"Slab & beam design", photo:"assets/buildings/Bauhinia.jpg"},
  {name:"Banyan Tree Residences Manila Bay", dev:"Federal Land", cat:"other", scope:"Diaphragm reinforcement", photo:"assets/buildings/BanyanTree.jpg"},
  {name:"Sentria Storeys Vermosa", dev:"Avida Land", cat:"other", scope:"Foundation design", photo:"assets/buildings/Vermosa.jpg"},
  {name:"The Heights Katipunan", dev:"Avida Land", cat:"other", scope:"Column & shear wall design", photo:"assets/buildings/TheHeights.jpg"},
  {name:"La Cassia Residences", dev:"Megaworld", cat:"megaworld", scope:"Steel canopy, slab, stairs, beams & shear wall design", lead:"Samantha Ilejay · Sept 2022 – June 2023", photo:"assets/buildings/LaCassia.jpg"},
  {name:"Park McKinley West", dev:"Megaworld", cat:"megaworld", scope:"Podium structural design", photo:"assets/buildings/ParkMcKinley.jpg"},
  {name:"Brittany Eastlake", dev:"Vista Land", cat:"other", scope:"RC structural design"},
  {name:"The East Village, Davao Global Township", dev:"Cebu Land Inc.", cat:"other", scope:"Flat slab, diaphragm & pile foundation design, Towers 1–6", lead:"Mar Anthony Alimo-ot · Feb 2022 – Sept 2025", photo:"assets/buildings/DGT.jpg"},
  {name:"Zadia Tower 4", dev:"Greenfield Development Corp.", cat:"other", scope:"Column & slab design"},
];
```
For entries with no `photo`, render a dark gradient placeholder instead of an `<img>`.

- Below the grid, a disclosure paragraph (smaller, muted text): "Project imagery courtesy of respective developer and project websites, used for portfolio reference only. These are not Alimo-ot Ilejay Structural Design projects — the structural work shown was completed under Sysquared + Associates Inc., where our principals were employed at the time, scoped to specific structural members and not sole design authorship."

### Contact (id="contact")
- Eyebrow: "Design With Us"
- H2 (normal case): "Tell us your goals. We'll craft the plan."
- Subtext: "Send over your project scope, drawings, or a rough idea — we'll follow up within one business day to discuss fit, timeline, and next steps."
- Contact details list: Email hello@alimootilejay.com / Location Metro Manila, Philippines / Response Time Within 1 business day
- Social icons: Facebook, Instagram, TikTok (link placeholders `#`)
- Form fields: First Name*, Last Name*, Email*, Phone, Project Type (select: Reinforced Concrete Structure / Steel Structure / Mixed / Not Sure Yet / Design Review / Analysis Report), Project Goals* (textarea), Submit button "Send Inquiry"
- On submit: `preventDefault()` and show a placeholder alert/toast — no backend wired yet, but structure the JS so a real fetch()-to-API call can be dropped in later.

### Footer
- "© [current year] Alimo-ot Ilejay Structural Design. All rights reserved." (year injected via JS, `Date().getFullYear()`)

## 5. Interactive behavior (vanilla JS, no frameworks)

- Header gets a `.scrolled` class (subtle border/shadow) after `window.scrollY > 40`.
- Mobile hamburger opens/closes a slide-in drawer; drawer links close it on click.
- Scroll-reveal: elements with class `.reveal` fade/slide in via `IntersectionObserver` (threshold 0.15), adding class `.in` when visible.
- Portfolio filter buttons re-render the grid client-side by `cat` with no page reload.
- Smooth-scroll anchor navigation (`html{scroll-behavior:smooth}` is sufficient).

## 6. PWA requirements

- `manifest.json`:
```json
{
  "name": "Alimo-ot Ilejay Structural Design",
  "short_name": "Alimo-ot Ilejay",
  "description": "Structural design engineering — reinforced concrete and steel design for mid- to high-rise developments.",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#14181f",
  "theme_color": "#14181f",
  "icons": [
    {"src":"assets/icons/icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},
    {"src":"assets/icons/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"},
    {"src":"assets/icons/icon-maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}
  ]
}
```
- `<head>` meta tags: `theme-color`, `mobile-web-app-capable`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title="Alimo-ot Ilejay"`, `<link rel="manifest" href="manifest.json">`, `<link rel="apple-touch-icon" href="assets/icons/icon-192.png">`.
- `sw.js`: a service worker that precaches the app shell (`index.html`, `css/styles.css`, `js/main.js`, `manifest.json`, key images) on `install`, serves cache-first with network fallback on `fetch`, and cleans up old cache versions on `activate`.
- Register the service worker in `main.js`:
```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
```
- Must pass a basic Lighthouse PWA audit: installable, works offline for the cached app shell, has a valid manifest with icons, has a theme-color meta tag.
- Must be fully responsive (mobile-first breakpoints matching the current desktop 3-column → mobile 1-column grid collapses described above).

## 7. Constraints

- No CSS/JS frameworks (no Tailwind, Bootstrap, React) — plain HTML/CSS/JS, matching the original prototype's stack.
- Keep all copy exactly as written above — do not paraphrase or "improve" the wording.
- Keep the sharp-cornered, high-contrast black/white/copper editorial design language throughout; do not soften it into a generic rounded-corner SaaS look.
