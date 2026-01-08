const Player = require('../models/Player');
const state = require('../state/gameState');
const { QUESTIONS } = require('../config/constants');

module.exports = (io, socket) => {
  
  // --- JOIN GAME ---
  socket.on("join_game", async (data) => {
    try {
      const { name } = data;
      const newPlayer = await Player.create({ name, score: 0, socketId: socket.id, history: [] });
      socket.emit("join_success", { playerId: newPlayer.id });
      // io.emit("player_count_update", io.engine.clientsCount);
    } catch (err) { console.error(err); }
  });

  // --- SUBMIT ANSWER ---
  socket.on('submit_answer', (data) => {
    state.currentVotes[data.playerId] = data.answer;
  });

  // --- RECONNECT ---
  socket.on('player_reconnect', async (playerId) => {
    try {
      const player = await Player.findByPk(playerId);
      if (player) {
        console.log(`♻️ Player Reconnected: ${player.name}`);
        player.socketId = socket.id;
        await player.save();

        // Reconstruct current question data
        let currentQData = null;
        if (state.gameState.currentRound > 0 && QUESTIONS[state.gameState.currentRound]) {
           const roundQs = QUESTIONS[state.gameState.currentRound];
           if (state.gameState.currentQuestionIndex >= 0 && state.gameState.currentQuestionIndex < roundQs.length) {
              const q = roundQs[state.gameState.currentQuestionIndex];
              currentQData = { id: q.id, text: q.text, options: q.options, timeLimit: q.timeLimit };
           }
        }

        socket.emit('player_reconnect_success', {
          playerId: player.id,
          name: player.name,
          score: player.score,
          phase: state.gamePhase,
          round: state.gameState.currentRound,
          question: currentQData,
          result: state.lastMinorityResult
        });
      } else {
        socket.emit('player_reconnect_fail');
      }
    } catch (err) {
      console.error("Reconnect Error:", err);
      socket.emit('player_reconnect_fail');
    }
  });
};