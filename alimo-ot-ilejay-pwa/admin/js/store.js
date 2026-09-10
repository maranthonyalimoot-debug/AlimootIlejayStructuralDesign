// ---- Admin data layer (Supabase-backed) ----
// Same function names/shapes as the original localStorage placeholder
// (listLeads, createLead, updateLead, moveLead, deleteLead, and the Tasks
// equivalents) so admin.js didn't need to change its field logic — only
// await these calls, since they're now async. DB rows are snake_case;
// everything crossing this boundary into admin.js is camelCase.

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

// Only maps keys actually present on `lead` — a partial patch like
// {stage: 'won'} (from moveLead/drag-and-drop) must not turn the *other*,
// unmentioned fields into explicit nulls that overwrite existing data.
function leadToRow(lead) {
  const row = {};
  if ('name' in lead) row.name = lead.name;
  if ('company' in lead) row.company = lead.company || null;
  if ('phone' in lead) row.phone = lead.phone || null;
  if ('email' in lead) row.email = lead.email || null;
  if ('source' in lead) row.source = lead.source || null;
  if ('stage' in lead) row.stage = lead.stage;
  if ('assignedTo' in lead) row.assigned_to = lead.assignedTo;
  if ('notes' in lead) row.notes = lead.notes || null;
  return row;
}
function rowToLead(row) {
  return {
    id: row.id, name: row.name, company: row.company, phone: row.phone,
    email: row.email, source: row.source, stage: row.stage,
    assignedTo: row.assigned_to, notes: row.notes,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

// Same partial-patch safety as leadToRow above.
function taskToRow(task) {
  const row = {};
  if ('title' in task) row.title = task.title;
  if ('assignedTo' in task) row.assigned_to = task.assignedTo;
  if ('targetDate' in task) row.target_date = task.targetDate || null;
  if ('status' in task) row.status = task.status;
  if ('notes' in task) row.notes = task.notes || null;
  return row;
}
function rowToTask(row) {
  return {
    id: row.id, title: row.title, assignedTo: row.assigned_to, targetDate: row.target_date,
    status: row.status, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function orThrow({ data, error }) {
  if (error) throw error;
  return data;
}

const Store = {
  LEAD_STAGES, TASK_STATUSES, ASSIGNEES,

  async listLeads() {
    const rows = orThrow(await sb.from('leads').select('*').order('created_at', { ascending: true }));
    return rows.map(rowToLead);
  },
  async createLead(data) {
    const row = { stage: 'new', assignedTo: ASSIGNEES[0], notes: '', ...data };
    const rows = orThrow(await sb.from('leads').insert(leadToRow(row)).select());
    return rowToLead(rows[0]);
  },
  async updateLead(id, patch) {
    const rows = orThrow(
      await sb.from('leads').update({ ...leadToRow({ ...patch }), updated_at: new Date().toISOString() })
        .eq('id', id).select()
    );
    return rows[0] ? rowToLead(rows[0]) : null;
  },
  moveLead(id, stage) { return this.updateLead(id, { stage }); },
  async deleteLead(id) { orThrow(await sb.from('leads').delete().eq('id', id)); },

  async listTasks() {
    const rows = orThrow(await sb.from('tasks').select('*').order('created_at', { ascending: true }));
    return rows.map(rowToTask);
  },
  async createTask(data) {
    const row = { status: 'todo', assignedTo: ASSIGNEES[0], targetDate: '', notes: '', ...data };
    const rows = orThrow(await sb.from('tasks').insert(taskToRow(row)).select());
    return rowToTask(rows[0]);
  },
  async updateTask(id, patch) {
    const rows = orThrow(
      await sb.from('tasks').update({ ...taskToRow({ ...patch }), updated_at: new Date().toISOString() })
        .eq('id', id).select()
    );
    return rows[0] ? rowToTask(rows[0]) : null;
  },
  moveTask(id, status) { return this.updateTask(id, { status }); },
  async deleteTask(id) { orThrow(await sb.from('tasks').delete().eq('id', id)); },
};
