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

// ---- Contact form: step-by-step wizard (prototype only — no backend wired up) ----
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.form-section'));
  const progressFill = document.getElementById('wizardProgressFill');
  const stepLabel = document.getElementById('wizardStepLabel');
  const backBtn = document.getElementById('formBack');
  const nextBtn = document.getElementById('formNext');
  const submitBtn = document.getElementById('formSubmit');
  let current = 0;

  function showStep(i) {
    steps.forEach((step, idx) => step.classList.toggle('active', idx === i));
    // Set explicit values (not '') so these always win over the CSS default
    // of display:none — clearing to '' just falls back to the stylesheet.
    backBtn.style.display = i === 0 ? 'none' : 'inline-flex';
    nextBtn.style.display = i === steps.length - 1 ? 'none' : 'inline-flex';
    submitBtn.style.display = i === steps.length - 1 ? 'inline-flex' : 'none';
    progressFill.style.width = `${((i + 1) / steps.length) * 100}%`;
    stepLabel.textContent = `Step ${i + 1} of ${steps.length}`;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function stepIsValid(i) {
    const requiredFields = steps[i].querySelectorAll('[required]');
    for (const field of requiredFields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  nextBtn.addEventListener('click', () => {
    if (!stepIsValid(current)) return;
    current = Math.min(current + 1, steps.length - 1);
    showStep(current);
  });

  backBtn.addEventListener('click', () => {
    current = Math.max(current - 1, 0);
    showStep(current);
  });

  showStep(current);

  // ---- Scope of Work: show what's included when a service is picked ----
  const scopeSelect = document.getElementById('scope');
  const scopeNote = document.getElementById('scopeNote');
  const scopeDeliverables = {
    'Structural Design and Analysis (Schematic to Construction Drawings)':
      'Includes: structural system design from schematic layout through complete construction drawings — structural analysis, member sizing, foundation design, and signed & sealed structural plans ready for permitting and construction.',
    'Structural Design and Analysis Review (New Project)':
      'Includes: independent review of a structural design and analysis already prepared for your project — checking code compliance, structural adequacy, and coordination issues, with a written report of findings and recommendations.',
  };
  if (scopeSelect && scopeNote) {
    scopeSelect.addEventListener('change', () => {
      scopeNote.textContent = scopeDeliverables[scopeSelect.value] || '';
    });
  }

  // ---- Allied plans (architectural/electrical/plumbing): only relevant when
  // the client isn't the architect themselves — otherwise they're covering it ----
  const roleSelect = document.getElementById('role');
  const alliedPlansGroup = document.getElementById('alliedPlansGroup');

  function updateAlliedPlansVisibility() {
    if (!roleSelect || !alliedPlansGroup) return;
    alliedPlansGroup.hidden = roleSelect.value === '' || roleSelect.value === 'Architect';
  }
  if (roleSelect) roleSelect.addEventListener('change', updateAlliedPlansVisibility);
  updateAlliedPlansVisibility();

  // For each plan type, only ask who prepared it once they say plans are ready.
  function wirePlanNameToggle(planSelectId, nameFieldId, nameInputId) {
    const planSelect = document.getElementById(planSelectId);
    const nameField = document.getElementById(nameFieldId);
    const nameInput = document.getElementById(nameInputId);
    if (!planSelect || !nameField) return;
    planSelect.addEventListener('change', () => {
      const showName = planSelect.value === 'Plans are ready';
      nameField.hidden = !showName;
      if (!showName && nameInput) nameInput.value = '';
    });
  }
  wirePlanNameToggle('archPlans', 'archNameField', 'archName');
  wirePlanNameToggle('electricalPlans', 'electricalNameField', 'electricalName');
  wirePlanNameToggle('plumbingPlans', 'plumbingNameField', 'plumbingName');

  // Auto-summary: list which plans they want coordinated via partner
  // professionals, built from whichever discipline(s) are "Need this arranged".
  const coordinationSummary = document.getElementById('coordinationSummary');
  const planFields = [
    { select: 'archPlans', label: 'Architectural Plans', kind: 'architect' },
    { select: 'electricalPlans', label: 'Electrical Plans', kind: 'engineer' },
    { select: 'plumbingPlans', label: 'Plumbing Plans', kind: 'engineer' },
  ];
  function updateCoordinationSummary() {
    if (!coordinationSummary) return;
    const needed = planFields.filter((p) => document.getElementById(p.select)?.value === 'Need this arranged');
    if (!needed.length) {
      coordinationSummary.textContent = '';
      return;
    }
    const needsArchitect = needed.some((p) => p.kind === 'architect');
    const needsEngineer = needed.some((p) => p.kind === 'engineer');
    // Only name the professional(s) actually needed — no mention of an
    // architect if it's just Electrical/Plumbing that need arranging.
    let professionals;
    if (needsArchitect && needsEngineer) professionals = 'partner architect and engineers';
    else if (needsArchitect) professionals = 'partner architect';
    else professionals = 'partner engineers';
    const neededLabels = needed.map((p) => p.label);
    coordinationSummary.textContent = `We'll also coordinate: ${neededLabels.join(', ')} — through our ${professionals}.`;
  }
  planFields.forEach((p) => {
    const el = document.getElementById(p.select);
    if (el) el.addEventListener('change', updateCoordinationSummary);
  });

  // ---- "How did you hear about us?": ask who referred them, only if relevant ----
  const sourceSelect = document.getElementById('source');
  const referrerField = document.getElementById('referrerField');
  const referrerInput = document.getElementById('referrer');
  if (sourceSelect && referrerField) {
    sourceSelect.addEventListener('change', () => {
      const showReferrer = sourceSelect.value === 'Referral';
      referrerField.hidden = !showReferrer;
      if (!showReferrer && referrerInput) referrerInput.value = '';
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // TODO: replace with a real submission, e.g.:
    // const data = Object.fromEntries(new FormData(e.target));
    // fetch('/api/inquiries', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
    alert('Thanks — your inquiry has been received. We\'ll follow up within 1 business day.');
    form.reset();
    if (scopeNote) scopeNote.textContent = '';
    if (referrerField) referrerField.hidden = true;
    updateAlliedPlansVisibility();
    document.getElementById('archNameField').hidden = true;
    document.getElementById('electricalNameField').hidden = true;
    document.getElementById('plumbingNameField').hidden = true;
    if (coordinationSummary) coordinationSummary.textContent = '';
    current = 0;
    showStep(current);
  });
})();

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
