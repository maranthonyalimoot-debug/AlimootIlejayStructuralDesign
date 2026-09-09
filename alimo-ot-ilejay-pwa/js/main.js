// ---- Service worker registration ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}

// ---- Header scroll state ----
const header = document.getElementById('siteHeader');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
document.addEventListener('scroll', onScroll, {passive:true});
onScroll();

// ---- Mobile drawer ----
const menuToggle = document.getElementById('menuToggle');
const drawer = document.getElementById('mobileDrawer');
const drawerClose = document.getElementById('drawerClose');
const openDrawer = () => { drawer.classList.add('open'); menuToggle.setAttribute('aria-expanded', true); };
const closeDrawer = () => { drawer.classList.remove('open'); menuToggle.setAttribute('aria-expanded', false); };
menuToggle.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

// ---- Reveal on scroll ----
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, {threshold:.15});
revealEls.forEach(el => io.observe(el));

// ---- Footer year ----
document.getElementById('year').textContent = new Date().getFullYear();

// ---- Contact form (prototype only — no backend wired up) ----
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  // TODO: replace with a real submission, e.g.:
  // const data = Object.fromEntries(new FormData(e.target));
  // fetch('/api/inquiries', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
  alert('Thanks — your inquiry has been received. We\'ll follow up within 1 business day.');
  e.target.reset();
});

// ---- Portfolio data + rendering ----
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

const grid = document.getElementById('projectGrid');
const seedColors = ["#3d5a80","#b9702e","#232327","#7d9cc0"];

function cardSvg(seed){
  const c1 = seedColors[seed % seedColors.length];
  const c2 = seedColors[(seed+2) % seedColors.length];
  return `<svg viewBox="0 0 300 375" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="pg${seed}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="#0a0a0c"/>
    </linearGradient></defs>
    <rect width="300" height="375" fill="url(#pg${seed})"/>
    <g stroke="${c2}" stroke-width="1" opacity=".5">
      ${Array.from({length:6}).map((_,i)=>`<rect x="${20+i*45}" y="${120 - (i%3)*30}" width="26" height="${255 + (i%3)*30}" fill="none"/>`).join('')}
    </g>
  </svg>`;
}

function render(filter){
  grid.innerHTML = '';
  PROJECTS.forEach((p, i) => {
    if (filter !== 'all' && p.cat !== filter) return;
    const card = document.createElement('div');
    card.className = 'project-card reveal in';
    const media = p.photo
      ? `<img src="${p.photo}" alt="${p.name}" loading="lazy">`
      : cardSvg(i);
    card.innerHTML = `
      <div class="project-media">${media}</div>
      <div class="project-scrim"></div>
      <div class="project-info">
        <span class="dev">${p.dev}</span>
        <h3>${p.name}</h3>
        <span class="scope">${p.scope}</span>
        ${p.lead ? `<span class="lead">${p.lead}</span>` : ''}
      </div>`;
    grid.appendChild(card);
  });
}
render('all');

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(btn.dataset.filter);
  });
});
