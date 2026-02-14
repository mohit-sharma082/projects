'use strict';

const express = require('express');
const router = express.Router();
const docker = require('../docker');

/**
 * GET /api/containers/:id/stats
 * Returns a single snapshot (stream: false) with computed CPU% and memory%.
 */

router.get('/:id/stats', async (req, res) => {
  const id = req.params.id;
  try {
    const container = docker.getContainer(id);
    // request single snapshot
    container.stats({ stream: false }, (err, data) => {
      if (err) {
        console.error('stats error', err);
        return res.status(500).json({ error: String(err) });
      }

      try {
        const cpuStats = data.cpu_stats || {};
        const precpuStats = data.precpu_stats || {};
        const cpuDelta = (cpuStats.cpu_usage?.total_usage || 0) - (precpuStats.cpu_usage?.total_usage || 0);
        const systemDelta = (cpuStats.system_cpu_usage || 0) - (precpuStats.system_cpu_usage || 0);
        const cpuCount = cpuStats.online_cpus || (cpuStats.cpu_usage?.percpu_usage?.length || 1);
        let cpuPercent = 0;
        if (systemDelta > 0 && cpuDelta > 0) {
          cpuPercent = (cpuDelta / systemDelta) * cpuCount * 100.0;
        }

        const memUsage = data.memory_stats?.usage || 0;
        const memLimit = data.memory_stats?.limit || 0;
        const memPercent = memLimit ? (memUsage / memLimit) * 100.0 : 0;

        // network totals
        let netRx = 0, netTx = 0;
        if (data.networks) {
          for (const k of Object.keys(data.networks)) {
            netRx += data.networks[k].rx_bytes || 0;
            netTx += data.networks[k].tx_bytes || 0;
          }
        } else if (data.network) {
          netRx = data.network.rx_bytes || 0;
          netTx = data.network.tx_bytes || 0;
        }

        // blkio totals (read/write)
        let blkRead = 0, blkWrite = 0;
        if (Array.isArray(data.blkio_stats?.io_service_bytes_recursive)) {
          for (const rec of data.blkio_stats.io_service_bytes_recursive) {
            if (rec.op === 'Read') blkRead += rec.value || 0;
            if (rec.op === 'Write') blkWrite += rec.value || 0;
          }
        }

        const out = {
          cpu: { percent: Number(cpuPercent.toFixed(2)), cores: cpuCount },
          memory: { usage: memUsage, limit: memLimit, percent: Number(memPercent.toFixed(2)) },
          network: { rx_bytes: netRx, tx_bytes: netTx },
          blkio: { read: blkRead, write: blkWrite },
          raw: data
        };

        res.json(out);
      } catch (procErr) {
        console.error('stats processing error', procErr);
        res.status(500).json({ error: String(procErr) });
      }
    });
  } catch (err) {
    console.error('container stats error', err);
    res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
