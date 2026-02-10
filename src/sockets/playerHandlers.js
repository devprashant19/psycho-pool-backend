const Player = require('../models/Player');
const state = require('../state/gameState');
const { QUESTIONS } = require('../config/constants');

// 👇 1. GLOBAL QUEUE: Forces users to join single-file, not all at once.
let joinQueue = Promise.resolve();

module.exports = (io, socket) => {
  
  // --- JOIN GAME (With Queue Protection) ---
  socket.on("join_game", (data) => {
    const { name } = data;
    
    // 👇 2. Add this request to the end of the line
    joinQueue = joinQueue.then(async () => {
      try {
        console.log(`👤 Joining Queue: ${name} (${socket.id})`);

        // Database Call (Safe now because it's sequential)
        const newPlayer = await Player.create({ 
            name, 
            score: 0, 
            socketId: socket.id, 
            history: [] 
        });

        socket.emit("join_success", { playerId: newPlayer.id });
        
        // Optional: Update count less frequently in index.js instead of here
        // io.emit("player_count_update", io.engine.clientsCount);

        // 👇 3. BREATHING ROOM: Wait 10ms before letting the next person in.
        await new Promise(r => setTimeout(r, 10));

      } catch (err) { 
        console.error(`❌ Join Error for ${name}:`, err);
        socket.emit("error", { message: "Could not join. Please try again." });
      }
    });
  });

  // --- SUBMIT ANSWER ---
  socket.on('submit_answer', (data) => {
    // Voting is fast (Memory), so no queue needed here.
    if (!state.currentVotes) state.currentVotes = {};
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