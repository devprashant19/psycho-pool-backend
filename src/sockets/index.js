const registerAdminHandlers = require('./adminHandlers');
const registerPlayerHandlers = require('./playerHandlers');
const state = require('../state/gameState');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // Register all event listeners for this socket
    registerAdminHandlers(io, socket);
    registerPlayerHandlers(io, socket);

    // Global Disconnect Logic
    socket.on('disconnect', () => {
      io.emit('player_count_update', io.engine.clientsCount);
      if (socket.id === state.adminSocketId) {
        state.adminSocketId = null;
        console.log("⚠️ Admin disconnected");
      }
    });
  });
  setInterval(async () => {
    try {
      // Fetch all sockets across all nodes
      const sockets = await io.fetchSockets();
      const totalCount = sockets.length;
      
      io.emit('player_count_update', totalCount);
    } catch (e) {
      console.error("Error fetching player count:", e);
    }
  }, 5000);
};