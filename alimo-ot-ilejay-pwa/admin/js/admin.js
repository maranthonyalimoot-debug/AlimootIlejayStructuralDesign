// ---- Admin dashboard ----
let activeTab = 'leads'; // 'leads' | 'tasks'
let activeFilter = 'all';
let editingId = null; // id currently being edited, or null when adding

const tabButtons = document.querySelectorAll('.tab-btn');
const board = document.getElementById('board');
const addBtn = document.getElementById('addBtn');
const filterSelect = document.getElementById('filterSelect');
const modalOverlay = document.getElementById('modalOverlay');
const modalForm = document.getElementById('modalForm');
const modalFields = document.getElementById('modalFields');
const modalTitle = document.getElementById('modalTitle');
const modalDeleteBtn = document.getElementById('modalDeleteBtn');
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

function columnsFor(tab) {
  return tab === 'leads' ? Store.LEAD_STAGES : Store.TASK_STATUSES;
}

function stageKey(tab) {
  return tab === 'leads' ? 'stage' : 'status';
}

function rowsFor(tab) {
  const rows = tab === 'leads' ? Store.listLeads() : Store.listTasks();
  return activeFilter === 'all' ? rows : rows.filter(r => r.assignedTo === activeFilter);
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
}

function cardHtml(item) {
  const moveOptions = (activeTab === 'leads' ? Store.LEAD_STAGES : Store.TASK_STATUSES)
    .map(s => `<option value="${s.id}" ${s.id === item[stageKey(activeTab)] ? 'selected' : ''}>${s.label}</option>`)
    .join('');

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

  return `
    <div class="card" draggable="true" data-id="${item.id}">
      <div class="card-title">${escapeHtml(item.title)}</div>
      <div class="card-meta">
        <span class="chip">${escapeHtml(item.assignedTo)}</span>
        ${item.targetDate ? `<span class="chip chip-muted">Due ${formatDate(item.targetDate)}</span>` : ''}
      </div>
      ${item.notes ? `<div class="card-notes">${escapeHtml(item.notes)}</div>` : ''}
      <select class="move-select" data-id="${item.id}">${moveOptions}</select>
    </div>`;
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
    sel.addEventListener('change', () => {
      if (activeTab === 'leads') Store.moveLead(sel.dataset.id, sel.value);
      else Store.moveTask(sel.dataset.id, sel.value);
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
    colBody.addEventListener('drop', (e) => {
      e.preventDefault();
      colBody.classList.remove('drag-over');
      if (!dragId) return;
      if (activeTab === 'leads') Store.moveLead(dragId, colBody.dataset.col);
      else Store.moveTask(dragId, colBody.dataset.col);
      dragId = null;
      renderBoard();
    });
  });
}

// ---- Tabs ----
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    tabButtons.forEach(b => b.classList.toggle('active', b === btn));
    addBtn.textContent = activeTab === 'leads' ? '+ Add lead' : '+ Add task';
    renderBoard();
  });
});

// ---- Filter ----
filterSelect.addEventListener('change', () => {
  activeFilter = filterSelect.value;
  renderBoard();
});

// ---- Modal (shared for add + edit, fields depend on active tab) ----
function fieldsHtmlFor(type, item) {
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
    <label>Target finish date<input type="date" name="targetDate" value="${escapeHtml(item?.targetDate)}"></label>
    <label>Status<select name="status">${Store.TASK_STATUSES.map(s => `<option value="${s.id}" ${item && s.id === item.status ? 'selected' : ''}>${s.label}</option>`).join('')}</select></label>
    <label>Notes<textarea name="notes" rows="3">${escapeHtml(item?.notes)}</textarea></label>
  `;
}

function openModal(id) {
  editingId = id || null;
  const rows = activeTab === 'leads' ? Store.listLeads() : Store.listTasks();
  const item = editingId ? rows.find(r => r.id === editingId) : null;
  modalTitle.textContent = editingId
    ? (activeTab === 'leads' ? 'Edit lead' : 'Edit task')
    : (activeTab === 'leads' ? 'Add lead' : 'Add task');
  modalFields.innerHTML = fieldsHtmlFor(activeTab, item);
  modalDeleteBtn.hidden = !editingId;
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

modalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(modalForm));
  if (activeTab === 'leads') {
    editingId ? Store.updateLead(editingId, data) : Store.createLead(data);
  } else {
    editingId ? Store.updateTask(editingId, data) : Store.createTask(data);
  }
  closeModal();
  renderBoard();
});

modalDeleteBtn.addEventListener('click', () => {
  if (!editingId) return;
  if (!confirm('Delete this item? This cannot be undone.')) return;
  if (activeTab === 'leads') Store.deleteLead(editingId);
  else Store.deleteTask(editingId);
  closeModal();
  renderBoard();
});

// ---- Init ----
renderBoard();
