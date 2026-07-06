const express = require('express');
const path = require('path');

const employeesRouter = require('./routes/employees');
const shiftsRouter = require('./routes/shifts');
const incidentsRouter = require('./routes/incidents');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/employees', employeesRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/incidents', incidentsRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, () => {
  console.log(`ShiftForge running at http://localhost:${PORT}`);
});
