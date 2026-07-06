'use strict';

const state = {
  shifts: [],
  activeEmployees: [],
  selectedShiftId: null,
  selectedShift: null,
};

async function api(path, method = 'GET', body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`/api${path}`, options);
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

const $ = (sel) => document.querySelector(sel);

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

let toastTimer;
function showToast(message, type = 'success') {
  const toast = $('#toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

async function loadEverything() {
  try {
    const [shifts, employees] = await Promise.all([
      api('/shifts'),
      api('/employees/active'),
    ]);
    state.shifts = shifts;
    state.activeEmployees = employees;
    renderSummary();
    renderShiftList();
    renderEmployeeCheckboxes();
    if (state.selectedShiftId) {
      await loadShiftDetail(state.selectedShiftId);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadShiftDetail(id) {
  try {
    state.selectedShift = await api(`/shifts/${id}`);
    state.selectedShiftId = id;
    renderDetail();
    renderShiftList();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderSummary() {
  const shifts = state.shifts;
  const byStatus = (s) => shifts.filter((x) => x.status === s).length;

  const openIncidents = shifts.reduce((sum, s) => sum + s.openIncidents, 0);
  const criticalOpen = shifts.reduce((sum, s) => sum + s.criticalIncidents, 0);

  let busiest = null;
  for (const s of shifts) {
    if (s.totalIncidents > 0 && (!busiest || s.totalIncidents > busiest.totalIncidents)) {
      busiest = s;
    }
  }

  $('#m-total-shifts').textContent = shifts.length;
  $('#m-planned').textContent = byStatus('planned');
  $('#m-active').textContent = byStatus('active');
  $('#m-completed').textContent = byStatus('completed');
  $('#m-open-incidents').textContent = openIncidents;
  $('#m-critical').textContent = criticalOpen;
  $('#m-busiest').textContent = busiest
    ? `${busiest.title} (${busiest.totalIncidents})`
    : 'None';
}

function renderShiftList() {
  const container = $('#shift-list');
  if (state.shifts.length === 0) {
    container.innerHTML = '<p class="empty-state">No shifts yet.</p>';
    return;
  }

  container.innerHTML = state.shifts
    .map((s) => {
      const names = s.assignedEmployees.map((e) => e.name).join(', ') || 'No one assigned';
      const selected = s.id === state.selectedShiftId ? ' selected' : '';
      return `
        <div class="shift-card${selected}" data-id="${s.id}">
          <div class="shift-card-top">
            <span class="shift-card-title">${esc(s.title)}</span>
            <span class="badge status-${s.status}">${s.status}</span>
          </div>
          <div class="shift-card-meta">${esc(s.date)} · ${esc(s.startTime)}–${esc(s.endTime)}</div>
          <div class="shift-card-emps">👥 ${esc(names)}</div>
          <div class="shift-card-stats">
            <span>Total <b>${s.totalIncidents}</b></span>
            <span>Open <b>${s.openIncidents}</b></span>
            <span class="stat-critical">Critical <b>${s.criticalIncidents}</b></span>
          </div>
        </div>`;
    })
    .join('');

  container.querySelectorAll('.shift-card').forEach((card) => {
    card.addEventListener('click', () => loadShiftDetail(card.dataset.id));
  });
}

function renderEmployeeCheckboxes() {
  const container = $('#employee-checkboxes');
  container.innerHTML = state.activeEmployees
    .map(
      (e) => `
      <label>
        <input type="checkbox" name="employee" value="${e.id}" />
        ${esc(e.name)} <small>(${esc(e.role)})</small>
      </label>`
    )
    .join('');
}

function renderDetail() {
  const shift = state.selectedShift;
  $('#detail-empty').hidden = true;
  const content = $('#detail-content');
  content.hidden = false;

  const emps = shift.assignedEmployees
    .map((e) => `<span class="emp-chip">${esc(e.name)} <small>${esc(e.role)}</small></span>`)
    .join('');

  const criticalBlocked = shift.status === 'active' && shift.criticalIncidents > 0;
  const warning = criticalBlocked
    ? `<div class="warning">⚠ This shift has ${shift.criticalIncidents} unresolved critical incident(s) and cannot be completed until they are resolved.</div>`
    : '';

  let actionBtn = '';
  if (shift.status === 'planned') {
    actionBtn = `<button class="btn btn-primary btn-sm" id="activate-btn">Activate shift</button>`;
  } else if (shift.status === 'active') {
    actionBtn = `<button class="btn btn-success btn-sm" id="complete-btn" ${criticalBlocked ? 'disabled' : ''}>Complete shift</button>`;
  }

  const readOnlyNote = shift.status === 'completed'
    ? '<p class="detail-sub">This shift is completed and read-only, except for handover notes.</p>'
    : '';

  content.innerHTML = `
    <div class="detail-head">
      <div>
        <h2>${esc(shift.title)}</h2>
        <p class="detail-sub">${esc(shift.date)} · ${esc(shift.startTime)}–${esc(shift.endTime)}</p>
      </div>
      <span class="badge status-${shift.status}">${shift.status}</span>
    </div>
    ${readOnlyNote}

    <div class="detail-section">
      <h3>Assigned employees</h3>
      <div class="emp-chips">${emps || '<span class="detail-sub">None</span>'}</div>
    </div>

    <div class="action-row">${actionBtn}</div>
    ${warning}

    <div class="detail-section">
      <h3>Handover notes</h3>
      <textarea id="handover-text" rows="3">${esc(shift.handoverNotes)}</textarea>
      <div class="action-row">
        <button class="btn btn-ghost btn-sm" id="save-handover-btn">Save handover notes</button>
      </div>
    </div>

    <div class="detail-section">
      <h3>Incidents (${shift.incidents.length})</h3>
      <div id="incident-list">${renderIncidents(shift)}</div>
    </div>

    <div class="detail-section">
      <h3>Log new incident</h3>
      ${renderNewIncidentForm(shift)}
    </div>
  `;

  wireDetailEvents(shift);
}

function renderIncidents(shift) {
  if (shift.incidents.length === 0) {
    return '<p class="detail-sub">No incidents logged for this shift.</p>';
  }
  return shift.incidents
    .map((inc) => {
      const assignee = shift.assignedEmployees.find((e) => e.id === inc.assignedEmployeeId);
      const options = ['open', 'investigating', 'resolved']
        .map((s) => `<option value="${s}" ${s === inc.status ? 'selected' : ''}>${s}</option>`)
        .join('');
      return `
        <div class="incident">
          <div class="incident-top">
            <span class="incident-title">${esc(inc.title)}</span>
            <span class="incident-badges">
              <span class="badge sev-${inc.severity}">${inc.severity}</span>
              <span class="badge istatus-${inc.status}">${inc.status}</span>
            </span>
          </div>
          <p class="incident-desc">${esc(inc.description) || '<em>No description</em>'}</p>
          <div class="incident-meta">
            <span>Assignee: ${esc(assignee ? assignee.name : 'Unassigned')}</span>
            <span>Created: ${formatDateTime(inc.createdAt)}</span>
            ${inc.resolvedAt ? `<span>Resolved: ${formatDateTime(inc.resolvedAt)}</span>` : ''}
          </div>
          <div class="incident-actions">
            <label>Status
              <select data-incident="${inc.id}" class="incident-status">${options}</select>
            </label>
          </div>
        </div>`;
    })
    .join('');
}

function renderNewIncidentForm(shift) {
  if (shift.status === 'completed') {
    return '<p class="detail-sub">Completed shift — new incidents cannot be logged.</p>';
  }
  const assigneeOptions = shift.assignedEmployees
    .map((e) => `<option value="${e.id}">${esc(e.name)}</option>`)
    .join('');
  return `
    <form id="new-incident-form" class="new-incident">
      <label>Title<input type="text" name="title" placeholder="Payment gateway timeout" required /></label>
      <label>Description<textarea name="description" rows="2" placeholder="What is happening?"></textarea></label>
      <div class="form-row">
        <label>Severity
          <select name="severity">
            <option value="low">low</option>
            <option value="medium" selected>medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </label>
        <label>Assign to
          <select name="assignedEmployeeId">
            <option value="">Unassigned</option>
            ${assigneeOptions}
          </select>
        </label>
      </div>
      <button class="btn btn-primary btn-sm" type="submit">Log incident</button>
    </form>`;
}

function wireDetailEvents(shift) {
  const activateBtn = $('#activate-btn');
  if (activateBtn) {
    activateBtn.addEventListener('click', () => changeShiftStatus(shift.id, 'active'));
  }

  const completeBtn = $('#complete-btn');
  if (completeBtn) {
    completeBtn.addEventListener('click', () => changeShiftStatus(shift.id, 'completed'));
  }

  $('#save-handover-btn').addEventListener('click', () => saveHandover(shift.id));

  $('#incident-list')
    .querySelectorAll('.incident-status')
    .forEach((sel) => {
      sel.addEventListener('change', () =>
        changeIncidentStatus(sel.dataset.incident, sel.value)
      );
    });

  const newIncidentForm = $('#new-incident-form');
  if (newIncidentForm) {
    newIncidentForm.addEventListener('submit', (e) => submitNewIncident(e, shift.id));
  }
}

async function changeShiftStatus(id, status) {
  try {
    await api(`/shifts/${id}/status`, 'PATCH', { status });
    showToast(`Shift ${status === 'active' ? 'activated' : 'completed'}.`);
    await loadEverything();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function saveHandover(id) {
  try {
    const handoverNotes = $('#handover-text').value;
    await api(`/shifts/${id}/handover`, 'PATCH', { handoverNotes });
    showToast('Handover notes saved.');
    await loadShiftDetail(id);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function changeIncidentStatus(incidentId, status) {
  try {
    await api(`/incidents/${incidentId}/status`, 'PATCH', { status });
    showToast('Incident updated.');
    await loadEverything();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitNewIncident(event, shiftId) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    severity: form.severity.value,
    assignedEmployeeId: form.assignedEmployeeId.value || undefined,
  };
  try {
    await api(`/shifts/${shiftId}/incidents`, 'POST', payload);
    showToast('Incident logged.');
    form.reset();
    await loadEverything();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitNewShift(event) {
  event.preventDefault();
  const form = event.target;
  const assignedEmployeeIds = [...form.querySelectorAll('input[name="employee"]:checked')].map(
    (cb) => cb.value
  );
  const payload = {
    title: form.title.value.trim(),
    date: form.date.value,
    startTime: form.startTime.value,
    endTime: form.endTime.value,
    assignedEmployeeIds,
    handoverNotes: form.handoverNotes.value.trim(),
  };
  try {
    const created = await api('/shifts', 'POST', payload);
    showToast('Shift created.');
    form.reset();
    await loadEverything();
    await loadShiftDetail(created.id);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

$('#create-shift-form').addEventListener('submit', submitNewShift);
$('#refresh-btn').addEventListener('click', loadEverything);

loadEverything();
