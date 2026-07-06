const express = require('express');
const store = require('../data/store');

const router = express.Router();

const VALID_ROLES = ['Support Agent', 'Senior Support Agent', 'Team Lead', 'Incident Commander'];
const VALID_SKILL_LEVELS = ['Junior', 'Intermediate', 'Senior'];

router.get('/', (req, res) => {
  res.json(store.employees);
});

router.get('/active', (req, res) => {
  res.json(store.employees.filter((e) => e.active));
});

router.post('/', (req, res) => {
  const { name, role, skillLevel } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
  }
  if (!VALID_SKILL_LEVELS.includes(skillLevel)) {
    return res
      .status(400)
      .json({ error: `skillLevel must be one of: ${VALID_SKILL_LEVELS.join(', ')}` });
  }

  const employee = {
    id: store.nextId('emp'),
    name,
    role,
    skillLevel,
    active: true,
  };

  store.employees.push(employee);
  res.status(201).json(employee);
});

module.exports = router;
