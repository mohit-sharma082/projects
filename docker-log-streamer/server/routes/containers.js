'use strict';

const express = require('express');
const router = express.Router();
const docker = require('../docker');

/**
 * GET /api/containers
 * Lists running containers (simplified fields)
 */
router.get('/', async (req, res) => {
  try {
    // list only running containers
    const containers = await docker.listContainers({ all: false });
    const simplified = containers.map((c) => ({
      Id: c.Id,
      Names: c.Names,
      Image: c.Image,
      State: c.State,
      Status: c.Status,
    }));
    res.json(simplified);
  } catch (err) {
    console.error('listContainers error', err);
    res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
