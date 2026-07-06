const store = require('../data/store');
const { ApiError } = require('./errors');

const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const VALID_STATUSES = ['open', 'investigating', 'resolved'];

function listIncidents() {
  return store.incidents;
}

function listOpenIncidents() {
  return store.incidents.filter((i) => i.status !== 'resolved');
}

function listIncidentsForShift(shiftId) {
  const shift = store.findShift(shiftId);
  if (!shift) throw new ApiError(404, `Shift ${shiftId} not found`);
  return store.incidentsForShift(shiftId);
}

function createIncident(shiftId, body) {
  const shift = store.findShift(shiftId);
  if (!shift) throw new ApiError(404, `Shift ${shiftId} not found`);

  const { title, description, severity, assignedEmployeeId } = body;

  if (!title) throw new ApiError(400, 'title is required');
  if (!VALID_SEVERITIES.includes(severity)) {
    throw new ApiError(400, `severity must be one of: ${VALID_SEVERITIES.join(', ')}`);
  }

  if (assignedEmployeeId) {
    if (!shift.assignedEmployeeIds.includes(assignedEmployeeId)) {
      throw new ApiError(
        400,
        'assignedEmployeeId must belong to an employee assigned to this shift'
      );
    }
  }

  const incident = {
    id: store.nextId('inc'),
    shiftId,
    title,
    description: description || '',
    severity,
    status: 'open',
    assignedEmployeeId: assignedEmployeeId || null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  store.incidents.push(incident);
  return incident;
}

function updateStatus(id, newStatus) {
  const incident = store.findIncident(id);
  if (!incident) throw new ApiError(404, `Incident ${id} not found`);

  if (!VALID_STATUSES.includes(newStatus)) {
    throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (newStatus === 'resolved') {
    incident.resolvedAt = new Date().toISOString();
  } else {
    incident.resolvedAt = null;
  }

  incident.status = newStatus;
  return incident;
}

module.exports = {
  listIncidents,
  listOpenIncidents,
  listIncidentsForShift,
  createIncident,
  updateStatus,
};
