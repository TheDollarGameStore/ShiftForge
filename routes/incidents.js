const express = require('express');
const incidentService = require('../services/incidentService');
const { ApiError } = require('../services/errors');

const router = express.Router();

function sendError(res, err) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}

router.get('/', (req, res) => {
  res.json(incidentService.listIncidents());
});

router.get('/open', (req, res) => {
  res.json(incidentService.listOpenIncidents());
});

router.patch('/:id/status', (req, res) => {
  try {
    res.json(incidentService.updateStatus(req.params.id, req.body.status));
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
