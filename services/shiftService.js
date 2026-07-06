const store = require('../data/store');
const { ApiError } = require('./errors');

const VALID_STATUSES = ['planned', 'active', 'completed'];

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function shiftsOverlap(a, b) {
  if (a.date !== b.date) return false;
  const aStart = toMinutes(a.startTime);
  const aEnd = toMinutes(a.endTime);
  const bStart = toMinutes(b.startTime);
  const bEnd = toMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

function summarizeShift(shift) {
  const assignedEmployees = shift.assignedEmployeeIds
    .map((id) => store.findEmployee(id))
    .filter(Boolean);

  const shiftIncidents = store.incidentsForShift(shift.id);
  const openIncidents = shiftIncidents.filter((i) => i.status !== 'resolved');
  const criticalIncidents = openIncidents.filter((i) => i.severity === 'critical');

  return {
    ...shift,
    assignedEmployees,
    totalIncidents: shiftIncidents.length,
    openIncidents: openIncidents.length,
    criticalIncidents: criticalIncidents.length,
  };
}

function listShifts() {
  return store.shifts.map(summarizeShift);
}

function getShiftDetail(id) {
  const shift = store.findShift(id);
  if (!shift) throw new ApiError(404, `Shift ${id} not found`);
  return {
    ...summarizeShift(shift),
    incidents: store.incidentsForShift(shift.id),
  };
}

function createShift(body) {
  const { title, date, startTime, endTime, handoverNotes } = body;
  const assignedEmployeeIds = body.assignedEmployeeIds || [];

  if (!title) throw new ApiError(400, 'title is required');
  if (!date) throw new ApiError(400, 'date is required');
  if (!startTime) throw new ApiError(400, 'startTime is required');
  if (!endTime) throw new ApiError(400, 'endTime is required');

  if (assignedEmployeeIds.length === 0) {
    throw new ApiError(400, 'A shift must have at least one assigned employee');
  }

  for (const empId of assignedEmployeeIds) {
    const employee = store.findEmployee(empId);
    if (!employee) throw new ApiError(400, `Employee ${empId} does not exist`);
    if (!employee.active) {
      throw new ApiError(400, `Employee ${employee.name} is not active and cannot be assigned`);
    }
  }

  const candidate = { date, startTime, endTime };
  for (const empId of assignedEmployeeIds) {
    const clash = store.shifts.find(
      (s) => s.assignedEmployeeIds.includes(empId) && shiftsOverlap(candidate, s)
    );
    if (clash) {
      const employee = store.findEmployee(empId);
      throw new ApiError(
        400,
        `${employee.name} is already booked on an overlapping shift ("${clash.title}") on ${date}`
      );
    }
  }

  const shift = {
    id: store.nextId('shift'),
    title,
    date,
    startTime,
    endTime,
    status: 'planned',
    assignedEmployeeIds: [...assignedEmployeeIds],
    handoverNotes: handoverNotes || '',
    createdAt: new Date().toISOString(),
  };

  store.shifts.push(shift);
  return summarizeShift(shift);
}

function updateStatus(id, newStatus) {
  const shift = store.findShift(id);
  if (!shift) throw new ApiError(404, `Shift ${id} not found`);

  if (!VALID_STATUSES.includes(newStatus)) {
    throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const allowed = {
    planned: ['active'],
    active: ['completed'],
    completed: [],
  };

  if (newStatus === shift.status) {
    throw new ApiError(400, `Shift is already ${shift.status}`);
  }
  if (!allowed[shift.status].includes(newStatus)) {
    throw new ApiError(400, `Cannot change status from ${shift.status} to ${newStatus}`);
  }

  if (newStatus === 'active' && shift.assignedEmployeeIds.length === 0) {
    throw new ApiError(400, 'Cannot activate a shift with no assigned employees');
  }

  if (newStatus === 'completed') {
    const blockers = store
      .incidentsForShift(shift.id)
      .filter((i) => i.severity === 'critical' && i.status !== 'resolved');
    if (blockers.length > 0) {
      throw new ApiError(
        400,
        `Cannot complete shift: ${blockers.length} unresolved critical incident(s) remain`
      );
    }
  }

  shift.status = newStatus;
  return summarizeShift(shift);
}

function updateHandoverNotes(id, handoverNotes) {
  const shift = store.findShift(id);
  if (!shift) throw new ApiError(404, `Shift ${id} not found`);

  if (typeof handoverNotes !== 'string') {
    throw new ApiError(400, 'handoverNotes must be a string');
  }

  shift.handoverNotes = handoverNotes;
  return summarizeShift(shift);
}

module.exports = {
  listShifts,
  getShiftDetail,
  createShift,
  updateStatus,
  updateHandoverNotes,
  summarizeShift,
};
