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

const TASK_CATEGORIES = [
  { id: 'admin', label: 'Admin' },
  { id: 'technical', label: 'Technical' },
];

const INQUIRY_STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'converted', label: 'Converted' },
  { id: 'archived', label: 'Archived' },
];

const ASSIGNEES = ['Mar Anthony', 'Samantha'];

const PROJECT_STATUSES = [
  { id: 'idecad_model', label: 'ideCAD Model Stage' },
  { id: 'etabs', label: 'ETABS Stage' },
  { id: 'cad', label: 'CAD Stage' },
  { id: 'report_generation', label: 'Report Generation' },
  { id: 'for_printing', label: 'For Printing' },
  { id: 'closed', label: 'Closed' },
];

const PROJECT_SERVICES = [
  { id: 'design_analysis', label: 'Structural Design and Analysis (Schematic to Construction Drawings)' },
  { id: 'design_analysis_review', label: 'Structural Design and Analysis Review (New Project)' },
];

const PROJECT_ROLES = ['Architect', 'Owner', 'Engineer', 'Others'];

// Maps a Supabase auth email to the display name shown on notes/comments —
// mirrors the emails allowed by the "Admins manage ..." RLS policies.
const MEMBER_NAMES = {
  'maranthonyalimoot@gmail.com': 'Mar Anthony',
  'ilejaysamantha@gmail.com': 'Samantha',
};
function nameForEmail(email) {
  return MEMBER_NAMES[(email || '').toLowerCase()] || email || 'Unknown';
}

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
  if ('category' in task) row.category = task.category;
  if ('notes' in task) row.notes = task.notes || null;
  return row;
}
function rowToTask(row) {
  return {
    id: row.id, title: row.title, assignedTo: row.assigned_to, targetDate: row.target_date,
    status: row.status, category: row.category, notes: row.notes,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

// Inquiries are read-only on the way in (the public form inserts them
// directly) — admin.js only ever patches status/adminNotes, so this is the
// one write path we need, kept partial-patch-safe like leadToRow/taskToRow.
function inquiryToRow(patch) {
  const row = {};
  if ('status' in patch) row.status = patch.status;
  if ('adminNotes' in patch) row.admin_notes = patch.adminNotes || null;
  if ('convertedLeadId' in patch) row.converted_lead_id = patch.convertedLeadId || null;
  return row;
}
function rowToInquiry(row) {
  return {
    id: row.id, status: row.status,
    firstName: row.first_name, lastName: row.last_name,
    email: row.email, phone: row.phone, company: row.company, role: row.role,
    projectName: row.project_name, projectLocation: row.project_location,
    structuralSystem: row.structural_system, structureType: row.structure_type,
    storeys: row.storeys, floorArea: row.floor_area,
    scope: row.scope, geotech: row.geotech,
    archPlans: row.arch_plans, archName: row.arch_name,
    electricalPlans: row.electrical_plans, electricalName: row.electrical_name,
    plumbingPlans: row.plumbing_plans, plumbingName: row.plumbing_name,
    startDate: row.start_date, drawingsDate: row.drawings_date,
    notes: row.notes, source: row.source, referrer: row.referrer,
    adminNotes: row.admin_notes, convertedLeadId: row.converted_lead_id,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

// Folds everything a lead card doesn't have its own column for into a
// readable notes block, so converting an inquiry doesn't lose context.
function inquirySummary(inq) {
  const lines = [];
  if (inq.role) lines.push(`Role: ${inq.role}`);
  if (inq.projectName) lines.push(`Project: ${inq.projectName}`);
  if (inq.projectLocation) lines.push(`Location: ${inq.projectLocation}`);
  const size = [inq.structuralSystem, inq.structureType].filter(Boolean).join(', ');
  if (size) lines.push(`Structure: ${size}`);
  if (inq.storeys) lines.push(`Storeys: ${inq.storeys}`);
  if (inq.floorArea) lines.push(`Floor area: ${inq.floorArea} sq.m.`);
  if (inq.scope) lines.push(`Scope: ${inq.scope}`);
  if (inq.geotech) lines.push(`Geotech: ${inq.geotech}`);
  if (inq.archPlans) lines.push(`Architectural plans: ${inq.archPlans}${inq.archName ? ` (${inq.archName})` : ''}`);
  if (inq.electricalPlans) lines.push(`Electrical plans: ${inq.electricalPlans}${inq.electricalName ? ` (${inq.electricalName})` : ''}`);
  if (inq.plumbingPlans) lines.push(`Plumbing plans: ${inq.plumbingPlans}${inq.plumbingName ? ` (${inq.plumbingName})` : ''}`);
  if (inq.startDate) lines.push(`Target start: ${inq.startDate}`);
  if (inq.drawingsDate) lines.push(`Drawings needed by: ${inq.drawingsDate}`);
  if (inq.referrer) lines.push(`Referred by: ${inq.referrer}`);
  if (inq.notes) lines.push(`Notes: ${inq.notes}`);
  return lines.join('\n');
}

// Same partial-patch safety as leadToRow/taskToRow above.
function projectToRow(project) {
  const row = {};
  if ('projectId' in project) row.project_code = project.projectId;
  if ('principalOfRecord' in project) row.principal_of_record = project.principalOfRecord || null;
  if ('projectName' in project) row.project_name = project.projectName;
  if ('clientName' in project) row.client_name = project.clientName;
  if ('description' in project) row.description = project.description || null;
  if ('serviceAvailed' in project) row.service_availed = project.serviceAvailed;
  if ('contractCost' in project) row.contract_cost = project.contractCost || null;
  if ('downpayment' in project) row.downpayment = project.downpayment || null;
  if ('downpaymentDate' in project) row.downpayment_date = project.downpaymentDate || null;
  if ('finalPayment' in project) row.final_payment = project.finalPayment || null;
  if ('finalPaymentDate' in project) row.final_payment_date = project.finalPaymentDate || null;
  if ('submissionDate' in project) row.submission_date = project.submissionDate || null;
  if ('status' in project) row.status = project.status;
  if ('printingDeliveryCost' in project) row.printing_delivery_cost = project.printingDeliveryCost || null;
  return row;
}
function rowToProject(row) {
  return {
    id: row.id, projectId: row.project_code, principalOfRecord: row.principal_of_record,
    projectName: row.project_name, clientName: row.client_name, description: row.description,
    serviceAvailed: row.service_availed, contractCost: row.contract_cost,
    downpayment: row.downpayment, downpaymentDate: row.downpayment_date,
    finalPayment: row.final_payment, finalPaymentDate: row.final_payment_date,
    submissionDate: row.submission_date, status: row.status,
    printingDeliveryCost: row.printing_delivery_cost,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

// Same partial-patch safety as leadToRow/taskToRow above.
function noteToRow(note) {
  const row = {};
  if ('title' in note) row.title = note.title;
  if ('body' in note) row.body = note.body ?? '';
  if ('meetingDate' in note) row.meeting_date = note.meetingDate || null;
  if ('createdBy' in note) row.created_by = note.createdBy;
  if ('updatedBy' in note) row.updated_by = note.updatedBy;
  return row;
}
function rowToNote(row) {
  return {
    id: row.id, title: row.title, body: row.body, meetingDate: row.meeting_date,
    createdBy: row.created_by, updatedBy: row.updated_by,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function commentToRow(comment) {
  return {
    note_id: comment.noteId, author_email: comment.authorEmail,
    author_name: comment.authorName, body: comment.body,
  };
}
function rowToComment(row) {
  return {
    id: row.id, noteId: row.note_id, authorEmail: row.author_email,
    authorName: row.author_name, body: row.body, createdAt: row.created_at,
  };
}

function orThrow({ data, error }) {
  if (error) throw error;
  return data;
}

const Store = {
  LEAD_STAGES, TASK_STATUSES, TASK_CATEGORIES, INQUIRY_STATUSES, ASSIGNEES,
  PROJECT_STATUSES, PROJECT_SERVICES, PROJECT_ROLES,

  // Set from the Supabase auth session right after sign-in so notes/comments
  // can be attributed to a human name instead of a raw login email.
  currentUser: { email: null, name: null },
  setCurrentUser(email) {
    this.currentUser = { email, name: nameForEmail(email) };
  },

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
    const row = { status: 'todo', category: 'admin', assignedTo: ASSIGNEES[0], targetDate: '', notes: '', ...data };
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

  async listInquiries() {
    const rows = orThrow(await sb.from('inquiries').select('*').order('created_at', { ascending: false }));
    return rows.map(rowToInquiry);
  },
  async updateInquiry(id, patch) {
    const rows = orThrow(
      await sb.from('inquiries').update({ ...inquiryToRow(patch), updated_at: new Date().toISOString() })
        .eq('id', id).select()
    );
    return rows[0] ? rowToInquiry(rows[0]) : null;
  },
  moveInquiry(id, status) { return this.updateInquiry(id, { status }); },
  async deleteInquiry(id) { orThrow(await sb.from('inquiries').delete().eq('id', id)); },

  async listProjects() {
    const rows = orThrow(await sb.from('projects').select('*').order('created_at', { ascending: true }));
    return rows.map(rowToProject);
  },
  async createProject(data) {
    const row = { status: 'idecad_model', serviceAvailed: PROJECT_SERVICES[0].id, ...data };
    const rows = orThrow(await sb.from('projects').insert(projectToRow(row)).select());
    return rowToProject(rows[0]);
  },
  async updateProject(id, patch) {
    const rows = orThrow(
      await sb.from('projects').update({ ...projectToRow({ ...patch }), updated_at: new Date().toISOString() })
        .eq('id', id).select()
    );
    return rows[0] ? rowToProject(rows[0]) : null;
  },
  moveProject(id, status) { return this.updateProject(id, { status }); },
  async deleteProject(id) { orThrow(await sb.from('projects').delete().eq('id', id)); },

  // ---- Meeting notes: shared Notion-style pages + attributed comments ----
  async listNotes() {
    const rows = orThrow(await sb.from('meeting_notes').select('*').order('updated_at', { ascending: false }));
    return rows.map(rowToNote);
  },
  async createNote(data) {
    const who = this.currentUser.name;
    const row = { title: data.title, body: '', meetingDate: data.meetingDate || null, createdBy: who, updatedBy: who };
    const rows = orThrow(await sb.from('meeting_notes').insert(noteToRow(row)).select());
    return rowToNote(rows[0]);
  },
  async updateNote(id, patch) {
    const row = { ...patch, updatedBy: this.currentUser.name };
    const rows = orThrow(
      await sb.from('meeting_notes').update({ ...noteToRow(row), updated_at: new Date().toISOString() })
        .eq('id', id).select()
    );
    return rows[0] ? rowToNote(rows[0]) : null;
  },
  async deleteNote(id) { orThrow(await sb.from('meeting_notes').delete().eq('id', id)); },

  async listComments(noteId) {
    const rows = orThrow(
      await sb.from('meeting_note_comments').select('*').eq('note_id', noteId).order('created_at', { ascending: true })
    );
    return rows.map(rowToComment);
  },
  async addComment(noteId, body) {
    const row = { noteId, authorEmail: this.currentUser.email, authorName: this.currentUser.name, body };
    const rows = orThrow(await sb.from('meeting_note_comments').insert(commentToRow(row)).select());
    return rowToComment(rows[0]);
  },
  async deleteComment(id) { orThrow(await sb.from('meeting_note_comments').delete().eq('id', id)); },

  // Turns a triaged inquiry into a workable lead card, folding the extra
  // fields into notes, and marks the inquiry converted so it isn't worked twice.
  async convertInquiryToLead(inquiry) {
    const lead = await this.createLead({
      name: `${inquiry.firstName} ${inquiry.lastName}`.trim(),
      company: inquiry.company || '',
      phone: inquiry.phone || '',
      email: inquiry.email || '',
      source: inquiry.source || 'Website inquiry',
      notes: inquirySummary(inquiry),
    });
    await this.updateInquiry(inquiry.id, { status: 'converted', convertedLeadId: lead.id });
    return lead;
  },
};
