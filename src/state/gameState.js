// This object acts as a "Singleton" shared memory across all files
const state = {
  gameState: {
    currentRound: 0,
    currentQuestionIndex: -1,
  },
  gamePhase: 'LOBBY',
  lastMinorityResult: null,
  currentVotes: {}, // Map: { playerId: answer }
  adminSocketId: null,

  // 👇 NEW: Default to 'MINORITY' (Least votes wins)
  // This changes when you click the toggle button in Admin Panel.
  winningMode: 'MINORITY' 
};

module.exports = state;