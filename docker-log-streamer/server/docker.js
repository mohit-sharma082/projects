'use strict';

/**
 * docker client wrapper
 * Exports a single Docker instance configured via env var DOCKER_SOCKET.
 */

const Docker = require('dockerode');

const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
});

module.exports = docker;
