// ---- Admin placeholder data layer ----
// Wraps localStorage behind functions shaped like the future Supabase calls
// (listLeads, createLead, updateLead, moveLead, deleteLead, and the Tasks
// equivalents). This is the one file that should need rewriting once a real
// backend is provisioned — admin.js should keep working unchanged.

const LEADS_KEY = 'admin_leads';
const TASKS_KEY = 'admin_tasks';

const LEAD_STAGES = [
  { id: 'new', label: 'New Inquiry' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'meeting', label: 'Meeting / Site Visit' },
  { id: 'proposal', label: 'Proposal Sent' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
];

const TASK_STATUSES = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

const ASSIGNEES = ['Mar Anthony', 'Samantha'];

function uid() {
  return (crypto.randomUUID && crypto.randomUUID()) || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readAll(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function writeAll(key, rows) {
  localStorage.setItem(key, JSON.stringify(rows));
}

function seedIfEmpty() {
  if (localStorage.getItem(LEADS_KEY) === null) {
    const now = new Date().toISOString();
    writeAll(LEADS_KEY, [
      { id: uid(), name: 'Juan Dela Cruz', company: 'Coastal Rise Developers', phone: '0917 000 0000', email: 'juan@coastalrise.ph', source: 'Referral', stage: 'new', assignedTo: 'Mar Anthony', notes: 'Sample lead — edit or delete.', createdAt: now, updatedAt: now },
      { id: uid(), name: 'Ana Reyes', company: 'Reyes Family Residence', phone: '0917 111 1111', email: 'ana@example.com', source: 'Website inquiry', stage: 'contacted', assignedTo: 'Samantha', notes: 'Sample lead — edit or delete.', createdAt: now, updatedAt: now },
    ]);
  }
  if (localStorage.getItem(TASKS_KEY) === null) {
    const now = new Date().toISOString();
    writeAll(TASKS_KEY, [
      { id: uid(), title: 'Follow up with Coastal Rise on soil report', assignedTo: 'Mar Anthony', targetDate: '', status: 'todo', notes: 'Sample task — edit or delete.', createdAt: now, updatedAt: now },
    ]);
  }
}

const Store = {
  LEAD_STAGES, TASK_STATUSES, ASSIGNEES,

  init() { seedIfEmpty(); },

  listLeads() { return readAll(LEADS_KEY); },
  createLead(data) {
    const now = new Date().toISOString();
    const rows = readAll(LEADS_KEY);
    const lead = { stage: 'new', assignedTo: ASSIGNEES[0], notes: '', ...data, id: uid(), createdAt: now, updatedAt: now };
    rows.push(lead);
    writeAll(LEADS_KEY, rows);
    return lead;
  },
  updateLead(id, patch) {
    const rows = readAll(LEADS_KEY);
    const i = rows.findIndex(r => r.id === id);
    if (i === -1) return null;
    rows[i] = { ...rows[i], ...patch, updatedAt: new Date().toISOString() };
    writeAll(LEADS_KEY, rows);
    return rows[i];
  },
  moveLead(id, stage) { return this.updateLead(id, { stage }); },
  deleteLead(id) {
    writeAll(LEADS_KEY, readAll(LEADS_KEY).filter(r => r.id !== id));
  },

  listTasks() { return readAll(TASKS_KEY); },
  createTask(data) {
    const now = new Date().toISOString();
    const rows = readAll(TASKS_KEY);
    const task = { status: 'todo', assignedTo: ASSIGNEES[0], targetDate: '', notes: '', ...data, id: uid(), createdAt: now, updatedAt: now };
    rows.push(task);
    writeAll(TASKS_KEY, rows);
    return task;
  },
  updateTask(id, patch) {
    const rows = readAll(TASKS_KEY);
    const i = rows.findIndex(r => r.id === id);
    if (i === -1) return null;
    rows[i] = { ...rows[i], ...patch, updatedAt: new Date().toISOString() };
    writeAll(TASKS_KEY, rows);
    return rows[i];
  },
  moveTask(id, status) { return this.updateTask(id, { status }); },
  deleteTask(id) {
    writeAll(TASKS_KEY, readAll(TASKS_KEY).filter(r => r.id !== id));
  },
};

Store.init();
