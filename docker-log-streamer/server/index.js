'use strict';

const http = require('http');
const app = require('./app');
const docker = require('./docker');
const { initSockets } = require('./socket');

const PORT = parseInt(process.env.PORT || '5010', 10);

const server = http.createServer(app);

// initialize socket handling (attaches Socket.IO to `server`)
initSockets(server, docker);

server.listen(PORT, () => {
  console.log(`Docker log streamer running on port ${PORT}`);
});
