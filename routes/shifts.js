const express = require('express');
const shiftService = require('../services/shiftService');
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
  res.json(shiftService.listShifts());
});

router.get('/:id', (req, res) => {
  try {
    res.json(shiftService.getShiftDetail(req.params.id));
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/', (req, res) => {
  try {
    res.status(201).json(shiftService.createShift(req.body));
  } catch (err) {
    sendError(res, err);
  }
});

router.patch('/:id/status', (req, res) => {
  try {
    res.json(shiftService.updateStatus(req.params.id, req.body.status));
  } catch (err) {
    sendError(res, err);
  }
});

router.patch('/:id/handover', (req, res) => {
  try {
    res.json(shiftService.updateHandoverNotes(req.params.id, req.body.handoverNotes));
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/:id/incidents', (req, res) => {
  try {
    res.json(incidentService.listIncidentsForShift(req.params.id));
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/:id/incidents', (req, res) => {
  try {
    res.status(201).json(incidentService.createIncident(req.params.id, req.body));
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
