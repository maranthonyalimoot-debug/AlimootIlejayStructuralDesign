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
// Photo credits: developer/project marketing photos, used for portfolio reference only.
const PROJECTS = [
  {name:"Park Central Towers", dev:"Ayala Land Premier", devLogo:"assets/logos/AyalaLandPremier.png", photo:"assets/buildings/PCT.jpg", creditUrl:"https://www.ayalalandpremier.com/properties/park-central-towers"},
  {name:"Sentria Storeys Vermosa", dev:"Avida Land", devLogo:"assets/logos/Avida.png", photo:"assets/buildings/Vermosa.jpg", creditUrl:"https://www.avidaland.com/properties/sentria-storeys-vermosa"},
  {name:"The Heights Katipunan", dev:"Avida Land", devLogo:"assets/logos/Avida.png", photo:"assets/buildings/TheHeights.jpg", creditUrl:"https://peopleasia.ph/avida-lands-the-heights-to-rise-in-katipunan/"},
  {name:"The East Village at Davao Global Township", dev:"Cebu Land Inc.", devLogo:"assets/logos/CebuLand.png", photo:"assets/buildings/DGT.jpg", creditUrl:"https://www.dgt.com.ph/the-east-village/"},
  {name:"Bauhinia Tower", dev:"Shang Properties", devLogo:"assets/logos/Shang.png", photo:"assets/buildings/Bauhinia.jpg", creditUrl:"https://shangpropertiesinternationalsales.com"},
  {name:"Parklinks South Tower", dev:"Ayala Land Premier", devLogo:"assets/logos/AyalaLandPremier.png", photo:"assets/buildings/PST.jpg", creditUrl:"https://www.ayalalandpremier.com/properties/parklinks-north-and-south-towers"},
  {name:"Park McKinley West", dev:"Megaworld", devLogo:"assets/logos/Megaworld.png", photo:"assets/buildings/ParkMcKinley.jpg", creditUrl:"https://www.ayalalandpremier.com/properties/park-central-towers"},
  {name:"Parklinks Retail", dev:"Ayala Land Premier", devLogo:"assets/logos/AyalaLandPremier.png", photo:"assets/buildings/ParklinksRetail.jpg", creditUrl:"https://ayalaland.com/blog/parklinks-mall-to-open-in-2027"},
  {name:"Banyan Tree Residences Manila Bay", dev:"Federal Land", devLogo:"assets/logos/FederalLand.png", photo:"assets/buildings/BanyanTree.jpg", creditUrl:"https://www.banyantree-manilabay.com/"},
  {name:"La Cassia Residences", dev:"Megaworld", devLogo:"assets/logos/Megaworld.png", photo:"assets/buildings/LaCassia.jpg", creditUrl:"https://megaworldprojectsph.com/la-cassia-residences/"},
  {name:"Zadia Tower 4", dev:"Greenfield Development Corp.", devLogo:"assets/logos/Greenfield.png", photo:"assets/buildings/Zadia.jpg", creditUrl:"https://www.ayalalandpremier.com/properties/parklinks-north-and-south-towers"},
];

const grid = document.getElementById('projectGrid');

function creditLabel(url){
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

function render(){
  grid.innerHTML = '';
  PROJECTS.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card reveal in';
    card.innerHTML = `
      <div class="project-media"><img src="${p.photo}" alt="${p.name}" loading="lazy"></div>
      <div class="project-info">
        <div class="project-name-row">
          <img class="dev-logo" src="${p.devLogo}" alt="${p.dev} logo" loading="lazy">
          <div class="project-name-col">
            <h3>${p.name}</h3>
            <span class="dev-name">${p.dev}</span>
          </div>
        </div>
        <a class="photo-credit" href="${p.creditUrl}" target="_blank" rel="noopener noreferrer">Photo: ${creditLabel(p.creditUrl)}</a>
      </div>`;
    grid.appendChild(card);
  });
}
render();
