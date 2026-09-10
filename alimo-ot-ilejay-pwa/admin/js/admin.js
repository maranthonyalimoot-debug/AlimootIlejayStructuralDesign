// ---- Admin dashboard ----
let activeTab = 'leads'; // 'leads' | 'tasks' | 'inquiries'
let activeFilter = 'all';
let editingId = null; // id currently being edited, or null when adding
let leadsCache = [];
let tasksCache = [];
let inquiriesCache = [];
let realtimeChannel = null;

const tabsEl = document.getElementById('tabs');
const tabButtons = document.querySelectorAll('.tab-btn');
const board = document.getElementById('board');
const taskSummary = document.getElementById('taskSummary');
const addBtn = document.getElementById('addBtn');
const filterSelect = document.getElementById('filterSelect');
const banner = document.getElementById('banner');
const dashboardMain = document.getElementById('dashboardMain');
const logoutBtn = document.getElementById('logoutBtn');
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const modalOverlay = document.getElementById('modalOverlay');
const modalForm = document.getElementById('modalForm');
const modalFields = document.getElementById('modalFields');
const modalTitle = document.getElementById('modalTitle');
const modalDeleteBtn = document.getElementById('modalDeleteBtn');
const modalConvertBtn = document.getElementById('modalConvertBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function assigneeOptions(selected) {
  return Store.ASSIGNEES.map(a => `<option value="${a}" ${a === selected ? 'selected' : ''}>${a}</option>`).join('');
}

// Local YYYY-MM-DD "today", comparable lexically against the date-only
// targetDate string straight from the DB — no timezone parsing needed.
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isOverdue(task) {
  return !!task.targetDate && task.targetDate < todayStr() && task.status !== 'done';
}

function columnsFor(tab) {
  if (tab === 'leads') return Store.LEAD_STAGES;
  if (tab === 'inquiries') return Store.INQUIRY_STATUSES;
  return Store.TASK_STATUSES;
}

function stageKey(tab) {
  return tab === 'leads' ? 'stage' : 'status';
}

function rowsFor(tab) {
  const rows = cacheFor(tab);
  // Inquiries have no assignee (they haven't been picked up by anyone yet) —
  // the assignee filter only applies to leads/tasks.
  if (tab === 'inquiries') return rows;
  return activeFilter === 'all' ? rows : rows.filter(r => r.assignedTo === activeFilter);
}

async function refreshData() {
  [leadsCache, tasksCache, inquiriesCache] = await Promise.all([
    Store.listLeads(), Store.listTasks(), Store.listInquiries(),
  ]);
}

function cacheFor(tab) {
  if (tab === 'leads') return leadsCache;
  if (tab === 'inquiries') return inquiriesCache;
  return tasksCache;
}

// Patch the local cache from a mutation's own response instead of
// round-tripping through refreshData() — that extra fetch can race/fail
// (e.g. a transient 401 right after sign-in) and silently leave the board
// looking like nothing saved, even though the write already succeeded.
function upsertInCache(tab, item) {
  if (!item) return;
  const cache = cacheFor(tab);
  const idx = cache.findIndex(r => r.id === item.id);
  if (idx === -1) cache.push(item); else cache[idx] = item;
}

function removeFromCache(tab, id) {
  const cache = cacheFor(tab);
  const idx = cache.findIndex(r => r.id === id);
  if (idx !== -1) cache.splice(idx, 1);
}

// ---- Board rendering ----
function renderBoard() {
  const cols = columnsFor(activeTab);
  const key = stageKey(activeTab);
  const rows = rowsFor(activeTab);

  board.innerHTML = cols.map(col => {
    const items = rows.filter(r => r[key] === col.id);
    return `
      <div class="board-col">
        <div class="board-col-head">
          <span>${col.label}</span>
          <span class="count">${items.length}</span>
        </div>
        <div class="board-col-body" data-col="${col.id}">
          ${items.map(cardHtml).join('') || '<div class="empty-hint">No items</div>'}
        </div>
      </div>`;
  }).join('');

  attachColumnDnD();
  attachCardHandlers();
  renderTaskSummary();
}

// ---- Task summary (To Do / In Progress / Overdue counts) ----
function renderTaskSummary() {
  taskSummary.hidden = activeTab !== 'tasks';
  if (activeTab !== 'tasks') return;
  const rows = rowsFor('tasks');
  const todo = rows.filter(r => r.status === 'todo').length;
  const inProgress = rows.filter(r => r.status === 'inprogress').length;
  const overdue = rows.filter(isOverdue).length;
  taskSummary.innerHTML = `
    <div class="summary-stat"><span class="summary-num">${todo}</span><span class="summary-label">To Do</span></div>
    <div class="summary-stat"><span class="summary-num">${inProgress}</span><span class="summary-label">In Progress</span></div>
    <div class="summary-stat summary-stat-danger"><span class="summary-num">${overdue}</span><span class="summary-label">Overdue</span></div>
  `;
}

function cardHtml(item) {
  const moveOptions = columnsFor(activeTab)
    .map(s => `<option value="${s.id}" ${s.id === item[stageKey(activeTab)] ? 'selected' : ''}>${s.label}</option>`)
    .join('');

  if (activeTab === 'inquiries') {
    const size = [item.structureType, item.storeys ? `${item.storeys} storeys` : '', item.floorArea ? `${item.floorArea} sq.m.` : '']
      .filter(Boolean).join(' &middot; ');
    return `
      <div class="card" draggable="true" data-id="${item.id}">
        <div class="card-title">${escapeHtml(`${item.firstName} ${item.lastName}`.trim())}</div>
        ${item.company ? `<div class="card-sub">${escapeHtml(item.company)}${item.role ? ` &middot; ${escapeHtml(item.role)}` : ''}</div>` : ''}
        <div class="card-meta">
          ${item.scope ? `<span class="chip">${escapeHtml(item.scope)}</span>` : ''}
          ${size ? `<span class="chip chip-muted">${size}</span>` : ''}
        </div>
        ${item.notes ? `<div class="card-notes">${escapeHtml(item.notes)}</div>` : ''}
        <select class="move-select" data-id="${item.id}">${moveOptions}</select>
      </div>`;
  }

  if (activeTab === 'leads') {
    return `
      <div class="card" draggable="true" data-id="${item.id}">
        <div class="card-title">${escapeHtml(item.name)}</div>
        ${item.company ? `<div class="card-sub">${escapeHtml(item.company)}</div>` : ''}
        <div class="card-meta">
          <span class="chip">${escapeHtml(item.assignedTo)}</span>
          ${item.source ? `<span class="chip chip-muted">${escapeHtml(item.source)}</span>` : ''}
        </div>
        ${item.notes ? `<div class="card-notes">${escapeHtml(item.notes)}</div>` : ''}
        <select class="move-select" data-id="${item.id}">${moveOptions}</select>
      </div>`;
  }

  const overdue = isOverdue(item);
  const titleClass = item.category === 'technical' ? 'card-title-technical' : 'card-title-admin';
  return `
    <div class="card" draggable="true" data-id="${item.id}">
      <div class="card-title ${titleClass}">${escapeHtml(item.title)}</div>
      <div class="card-meta">
        ${item.targetDate ? `<span class="chip ${overdue ? 'chip-danger' : 'chip-muted'}">Due ${formatDate(item.targetDate)}</span>` : ''}
      </div>
    </div>`;
}

function moveItem(tab, id, value) {
  if (tab === 'leads') return Store.moveLead(id, value);
  if (tab === 'inquiries') return Store.moveInquiry(id, value);
  return Store.moveTask(id, value);
}

// ---- Card interactions: click to edit, select to move ----
function attachCardHandlers() {
  board.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.move-select')) return;
      openModal(card.dataset.id);
    });
  });
  board.querySelectorAll('.move-select').forEach(sel => {
    sel.addEventListener('click', e => e.stopPropagation());
    sel.addEventListener('change', async () => {
      const tab = activeTab;
      try {
        const updated = await moveItem(tab, sel.dataset.id, sel.value);
        upsertInCache(tab, updated);
      } catch (err) {
        alert(`Could not move this item: ${err.message || err}`);
      }
      renderBoard();
    });
  });
}

// ---- Drag and drop between columns ----
let dragId = null;
function attachColumnDnD() {
  board.querySelectorAll('.card').forEach(card => {
    card.addEventListener('dragstart', () => { dragId = card.dataset.id; card.classList.add('dragging'); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
  board.querySelectorAll('.board-col-body').forEach(colBody => {
    colBody.addEventListener('dragover', (e) => { e.preventDefault(); colBody.classList.add('drag-over'); });
    colBody.addEventListener('dragleave', () => colBody.classList.remove('drag-over'));
    colBody.addEventListener('drop', async (e) => {
      e.preventDefault();
      colBody.classList.remove('drag-over');
      if (!dragId) return;
      const id = dragId;
      const tab = activeTab;
      dragId = null;
      try {
        const updated = await moveItem(tab, id, colBody.dataset.col);
        upsertInCache(tab, updated);
      } catch (err) {
        alert(`Could not move this item: ${err.message || err}`);
      }
      renderBoard();
    });
  });
}

// ---- Tabs ----
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    tabButtons.forEach(b => b.classList.toggle('active', b === btn));
    // Inquiries only ever arrive via the public form — there's no "add" for them.
    addBtn.hidden = activeTab === 'inquiries';
    addBtn.textContent = activeTab === 'leads' ? '+ Add lead' : '+ Add task';
    renderBoard();
  });
});

// ---- Filter ----
filterSelect.addEventListener('change', () => {
  activeFilter = filterSelect.value;
  renderBoard();
});

// A single read-only row in the inquiry detail view — omitted entirely when empty.
function readonlyField(label, value) {
  if (!value) return '';
  return `<div class="field field-readonly"><label>${escapeHtml(label)}</label><div class="field-value">${escapeHtml(value)}</div></div>`;
}

// ---- Modal (shared for add + edit, fields depend on active tab) ----
function fieldsHtmlFor(type, item) {
  if (type === 'inquiries') {
    // Inquiries are a submitted record, not something admins hand-edit — every
    // field is read-only except the triage bits (status, internal notes).
    const size = [item.structuralSystem, item.structureType].filter(Boolean).join(', ');
    return `
      ${readonlyField('Name', `${item.firstName} ${item.lastName}`.trim())}
      ${readonlyField('Email', item.email)}
      ${readonlyField('Phone', item.phone)}
      ${readonlyField('Company / Firm', item.company)}
      ${readonlyField('Role', item.role)}
      ${readonlyField('Project', item.projectName)}
      ${readonlyField('Location', item.projectLocation)}
      ${readonlyField('Structural system / type', size)}
      ${readonlyField('Storeys', item.storeys)}
      ${readonlyField('Floor area (sq.m.)', item.floorArea)}
      ${readonlyField('Scope of work', item.scope)}
      ${readonlyField('Geotechnical report', item.geotech)}
      ${readonlyField('Architectural plans', item.archPlans ? `${item.archPlans}${item.archName ? ` (${item.archName})` : ''}` : '')}
      ${readonlyField('Electrical plans', item.electricalPlans ? `${item.electricalPlans}${item.electricalName ? ` (${item.electricalName})` : ''}` : '')}
      ${readonlyField('Plumbing plans', item.plumbingPlans ? `${item.plumbingPlans}${item.plumbingName ? ` (${item.plumbingName})` : ''}` : '')}
      ${readonlyField('Target start date', formatDate(item.startDate))}
      ${readonlyField('Drawings needed by', formatDate(item.drawingsDate))}
      ${readonlyField('How they heard about us', item.source)}
      ${readonlyField('Referred by', item.referrer)}
      ${readonlyField('Notes from client', item.notes)}
      <label>Status<select name="status">${Store.INQUIRY_STATUSES.map(s => `<option value="${s.id}" ${s.id === item.status ? 'selected' : ''}>${s.label}</option>`).join('')}</select></label>
      <label>Internal notes<textarea name="adminNotes" rows="3">${escapeHtml(item.adminNotes)}</textarea></label>
    `;
  }
  if (type === 'leads') {
    return `
      <label>Name<input name="name" required value="${escapeHtml(item?.name)}"></label>
      <label>Company / Project<input name="company" value="${escapeHtml(item?.company)}"></label>
      <label>Phone<input name="phone" value="${escapeHtml(item?.phone)}"></label>
      <label>Email<input type="email" name="email" value="${escapeHtml(item?.email)}"></label>
      <label>Source<input name="source" placeholder="Referral, website, ..." value="${escapeHtml(item?.source)}"></label>
      <label>Assigned to<select name="assignedTo">${assigneeOptions(item?.assignedTo)}</select></label>
      <label>Stage<select name="stage">${Store.LEAD_STAGES.map(s => `<option value="${s.id}" ${item && s.id === item.stage ? 'selected' : ''}>${s.label}</option>`).join('')}</select></label>
      <label>Notes<textarea name="notes" rows="3">${escapeHtml(item?.notes)}</textarea></label>
    `;
  }
  return `
    <label>Task<input name="title" required value="${escapeHtml(item?.title)}"></label>
    <label>Assigned to<select name="assignedTo">${assigneeOptions(item?.assignedTo)}</select></label>
    <label>Category<select name="category">${Store.TASK_CATEGORIES.map(c => `<option value="${c.id}" ${item ? (c.id === item.category ? 'selected' : '') : (c.id === 'admin' ? 'selected' : '')}>${c.label}</option>`).join('')}</select></label>
    <label>Target finish date<input type="date" name="targetDate" value="${escapeHtml(item?.targetDate)}"></label>
    <label>Status<select name="status">${Store.TASK_STATUSES.map(s => `<option value="${s.id}" ${item && s.id === item.status ? 'selected' : ''}>${s.label}</option>`).join('')}</select></label>
    <label>Notes<textarea name="notes" rows="3">${escapeHtml(item?.notes)}</textarea></label>
  `;
}

const modalTitles = { leads: 'lead', tasks: 'task', inquiries: 'inquiry' };

function openModal(id) {
  editingId = id || null;
  const rows = cacheFor(activeTab);
  const item = editingId ? rows.find(r => r.id === editingId) : null;
  modalTitle.textContent = activeTab === 'inquiries'
    ? 'Inquiry details'
    : (editingId ? `Edit ${modalTitles[activeTab]}` : `Add ${modalTitles[activeTab]}`);
  modalFields.innerHTML = fieldsHtmlFor(activeTab, item);
  // Inquiries are never hand-deleted (archive via status instead, so the
  // original submission stays on record) and only offer Convert-to-Lead.
  modalDeleteBtn.hidden = !editingId || activeTab === 'inquiries';
  modalConvertBtn.hidden = !(activeTab === 'inquiries' && item && item.status !== 'converted');
  modalOverlay.hidden = false;
}

function closeModal() {
  modalOverlay.hidden = true;
  modalForm.reset();
  editingId = null;
}

addBtn.addEventListener('click', () => openModal(null));
modalCancelBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

modalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(modalForm));
  const tab = activeTab;
  const id = editingId;
  try {
    let saved;
    if (tab === 'leads') saved = id ? await Store.updateLead(id, data) : await Store.createLead(data);
    else if (tab === 'inquiries') saved = await Store.updateInquiry(id, data);
    else saved = id ? await Store.updateTask(id, data) : await Store.createTask(data);
    upsertInCache(tab, saved);
    closeModal();
    renderBoard();
  } catch (err) {
    // Leave the modal open so the user's input isn't lost and they can retry.
    alert(`Could not save: ${err.message || err}`);
  }
});

modalDeleteBtn.addEventListener('click', async () => {
  if (!editingId) return;
  if (!confirm('Delete this item? This cannot be undone.')) return;
  const tab = activeTab;
  const id = editingId;
  try {
    if (tab === 'leads') await Store.deleteLead(id);
    else await Store.deleteTask(id);
    removeFromCache(tab, id);
    closeModal();
    renderBoard();
  } catch (err) {
    alert(`Could not delete: ${err.message || err}`);
  }
});

modalConvertBtn.addEventListener('click', async () => {
  if (!editingId) return;
  const inquiry = inquiriesCache.find(r => r.id === editingId);
  if (!inquiry) return;
  try {
    const lead = await Store.convertInquiryToLead(inquiry);
    upsertInCache('leads', lead);
    upsertInCache('inquiries', { ...inquiry, status: 'converted', convertedLeadId: lead.id });
    closeModal();
    renderBoard();
    alert(`Converted — "${lead.name}" was added to Leads.`);
  } catch (err) {
    alert(`Could not convert this inquiry: ${err.message || err}`);
  }
});

// ---- Auth gate ----
function showDashboard() {
  loginOverlay.hidden = true;
  tabsEl.hidden = false;
  logoutBtn.hidden = false;
  banner.hidden = false;
  dashboardMain.hidden = false;
}

function showLogin() {
  loginOverlay.hidden = false;
  tabsEl.hidden = true;
  logoutBtn.hidden = true;
  banner.hidden = true;
  dashboardMain.hidden = true;
}

async function onSignedIn() {
  showDashboard();
  board.innerHTML = '<div class="empty-hint">Loading…</div>';
  await refreshData();
  renderBoard();
  subscribeRealtime();
}

function onSignedOut() {
  showLogin();
  loginForm.reset();
  if (realtimeChannel) { sb.removeChannel(realtimeChannel); realtimeChannel = null; }
}

function subscribeRealtime() {
  if (realtimeChannel) return;
  realtimeChannel = sb.channel('admin-board')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, async () => { await refreshData(); renderBoard(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async () => { await refreshData(); renderBoard(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, async () => { await refreshData(); renderBoard(); })
    .subscribe();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const { email, password } = Object.fromEntries(new FormData(loginForm));
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = 'Sign-in failed — check your email and password.';
    loginError.hidden = false;
  }
});

logoutBtn.addEventListener('click', () => sb.auth.signOut());

sb.auth.onAuthStateChange((event, session) => {
  if (session) onSignedIn();
  else onSignedOut();
});
