'use strict';

/**
 * Small utilities for socket handling and safe emission
 */

function safeEmit(socket, ev, payload) {
  try {
    socket.emit(ev, payload);
  } catch (e) {
    // swallow emission errors
    console.warn('emit failed', e);
  }
}

function ensureSocketMap(activeStreams, socketId) {
  if (!activeStreams[socketId]) activeStreams[socketId] = Object.create(null);
  return activeStreams[socketId];
}

module.exports = {
  safeEmit,
  ensureSocketMap,
};
