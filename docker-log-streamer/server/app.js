'use strict';

const express = require('express');
const cors = require('cors');

const containersRouter = require('./routes/containers');
const actionsRouter = require('./routes/actions');
const statsRouter = require('./routes/stats');

const app = express();
app.use(cors());
app.use(express.json());

// mount API routes
// list: GET  /api/containers
// actions: POST /api/containers/:id/start|stop|restart
// stats: GET /api/containers/:id/stats
app.use('/api/containers', containersRouter);
app.use('/api/containers', actionsRouter);
app.use('/api/containers', statsRouter);

// health endpoint
app.get('/healthz', (req, res) => res.json({ ok: true }));

module.exports = app;
