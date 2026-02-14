'use strict';

const express = require('express');
const router = express.Router();
const docker = require('../docker');

/**
 * POST /api/containers/:id/start
 * POST /api/containers/:id/stop
 * POST /api/containers/:id/restart
 *
 * No auth (local use). Returns { ok: true } or { error: '...' }.
 */

router.post('/:id/start', async (req, res) => {
    const id = req.params.id;
    try {
        const container = docker.getContainer(id);
        await container.start();
        res.json({ ok: true });
    } catch (err) {
        console.error('start error', err);
        res.status(500).json({ error: String(err) });
    }
});

router.post('/:id/stop', async (req, res) => {
    const id = req.params.id;
    try {
        const container = docker.getContainer(id);
        await container.stop();
        res.json({ ok: true });
    } catch (err) {
        console.error('stop error', err);
        res.status(500).json({ error: String(err) });
    }
});

router.post('/:id/restart', async (req, res) => {
    const id = req.params.id;
    try {
        const container = docker.getContainer(id);
        await container.restart();
        res.json({ ok: true });
    } catch (err) {
        console.error('restart error', err);
        res.status(500).json({ error: String(err) });
    }
});

module.exports = router;
