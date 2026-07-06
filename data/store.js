const employees = [
  { id: 'emp-1', name: 'Maya Pillay', role: 'Team Lead', skillLevel: 'Senior', active: true },
  { id: 'emp-2', name: 'Johan Meyer', role: 'Support Agent', skillLevel: 'Intermediate', active: true },
  { id: 'emp-3', name: 'Thabo Nkosi', role: 'Incident Commander', skillLevel: 'Senior', active: true },
  { id: 'emp-4', name: 'Priya Naidoo', role: 'Senior Support Agent', skillLevel: 'Senior', active: true },
  { id: 'emp-5', name: 'Liam Botha', role: 'Support Agent', skillLevel: 'Junior', active: true },
  { id: 'emp-6', name: 'Aisha Khan', role: 'Support Agent', skillLevel: 'Intermediate', active: true },
  { id: 'emp-7', name: 'Daniel Smith', role: 'Support Agent', skillLevel: 'Junior', active: false },
  { id: 'emp-8', name: 'Zanele Dlamini', role: 'Senior Support Agent', skillLevel: 'Senior', active: true },
];

const shifts = [
  {
    id: 'shift-1',
    title: 'Early Morning Support',
    date: '2026-07-05',
    startTime: '06:00',
    endTime: '14:00',
    status: 'completed',
    assignedEmployeeIds: ['emp-1', 'emp-2', 'emp-4'],
    handoverNotes: 'Quiet shift. Payment retries cleared. Nothing outstanding for the next team.',
    createdAt: '2026-07-05T05:30:00.000Z',
  },
  {
    id: 'shift-2',
    title: 'Day Support Shift',
    date: '2026-07-06',
    startTime: '08:00',
    endTime: '16:00',
    status: 'active',
    assignedEmployeeIds: ['emp-3', 'emp-4', 'emp-6'],
    handoverNotes: 'Database latency still being monitored. Payment gateway incident is critical.',
    createdAt: '2026-07-06T07:30:00.000Z',
  },
  {
    id: 'shift-3',
    title: 'Evening Support Shift',
    date: '2026-07-06',
    startTime: '16:00',
    endTime: '23:00',
    status: 'planned',
    assignedEmployeeIds: ['emp-1', 'emp-5'],
    handoverNotes: '',
    createdAt: '2026-07-06T07:45:00.000Z',
  },
  {
    id: 'shift-4',
    title: 'Morning Support Shift',
    date: '2026-07-07',
    startTime: '08:00',
    endTime: '16:00',
    status: 'planned',
    assignedEmployeeIds: ['emp-2', 'emp-8'],
    handoverNotes: '',
    createdAt: '2026-07-06T08:00:00.000Z',
  },
];

const incidents = [
  {
    id: 'inc-1',
    shiftId: 'shift-1',
    title: 'Login page slow to load',
    description: 'Customers reported 5-8s load times on the login page during peak.',
    severity: 'medium',
    status: 'resolved',
    assignedEmployeeId: 'emp-2',
    createdAt: '2026-07-05T06:40:00.000Z',
    resolvedAt: '2026-07-05T08:10:00.000Z',
  },
  {
    id: 'inc-2',
    shiftId: 'shift-1',
    title: 'Card payment retries failing',
    description: 'A batch of card payment retries were rejected by the processor.',
    severity: 'high',
    status: 'resolved',
    assignedEmployeeId: 'emp-4',
    createdAt: '2026-07-05T07:15:00.000Z',
    resolvedAt: '2026-07-05T09:30:00.000Z',
  },
  {
    id: 'inc-3',
    shiftId: 'shift-1',
    title: 'Email notifications delayed',
    description: 'Outbound email queue backed up by ~20 minutes.',
    severity: 'low',
    status: 'resolved',
    assignedEmployeeId: 'emp-1',
    createdAt: '2026-07-05T10:00:00.000Z',
    resolvedAt: '2026-07-05T10:45:00.000Z',
  },
  {
    id: 'inc-4',
    shiftId: 'shift-2',
    title: 'Payment gateway timeout',
    description: 'Users are reporting failed card payments across all regions.',
    severity: 'critical',
    status: 'open',
    assignedEmployeeId: 'emp-3',
    createdAt: '2026-07-06T09:05:00.000Z',
    resolvedAt: null,
  },
  {
    id: 'inc-5',
    shiftId: 'shift-2',
    title: 'Database read latency spike',
    description: 'Read replicas showing elevated latency, dashboards loading slowly.',
    severity: 'high',
    status: 'investigating',
    assignedEmployeeId: 'emp-6',
    createdAt: '2026-07-06T09:20:00.000Z',
    resolvedAt: null,
  },
  {
    id: 'inc-6',
    shiftId: 'shift-2',
    title: 'Search results missing images',
    description: 'Thumbnails intermittently missing from search results.',
    severity: 'low',
    status: 'resolved',
    assignedEmployeeId: 'emp-4',
    createdAt: '2026-07-06T10:10:00.000Z',
    resolvedAt: '2026-07-06T11:00:00.000Z',
  },
  {
    id: 'inc-7',
    shiftId: 'shift-2',
    title: 'Mobile app push notifications flaky',
    description: 'Some Android users not receiving order status push notifications.',
    severity: 'medium',
    status: 'open',
    assignedEmployeeId: 'emp-3',
    createdAt: '2026-07-06T11:30:00.000Z',
    resolvedAt: null,
  },
  {
    id: 'inc-8',
    shiftId: 'shift-3',
    title: 'Report export timing out',
    description: 'Large CSV report exports time out for enterprise customers.',
    severity: 'medium',
    status: 'open',
    assignedEmployeeId: 'emp-5',
    createdAt: '2026-07-06T16:20:00.000Z',
    resolvedAt: null,
  },
];

const counters = { emp: 8, shift: 4, inc: 8 };

function nextId(prefix) {
  counters[prefix] += 1;
  return `${prefix}-${counters[prefix]}`;
}

function findEmployee(id) {
  return employees.find((e) => e.id === id);
}

function findShift(id) {
  return shifts.find((s) => s.id === id);
}

function findIncident(id) {
  return incidents.find((i) => i.id === id);
}

function incidentsForShift(shiftId) {
  return incidents.filter((i) => i.shiftId === shiftId);
}

module.exports = {
  employees,
  shifts,
  incidents,
  nextId,
  findEmployee,
  findShift,
  findIncident,
  incidentsForShift,
};
