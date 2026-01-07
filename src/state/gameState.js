// This object acts as a "Singleton" shared memory across all files
const state = {
  gameState: {
    currentRound: 0,
    currentQuestionIndex: -1,
  },
  gamePhase: 'LOBBY',
  lastMinorityResult: null,
  currentVotes: {}, // Map: { playerId: answer }
  adminSocketId: null
};

module.exports = state;