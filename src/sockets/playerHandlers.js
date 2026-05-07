const Player = require('../models/Player');
const state = require('../state/gameState');
const { QUESTIONS } = require('../config/constants');

// GLOBAL QUEUE: Forces users to join single-file, not all at once.
let joinQueue = Promise.resolve();

module.exports = (io, socket) => {
  

  socket.on("join_game", (data) => {
    const { name } = data;
    

    joinQueue = joinQueue.then(async () => {
      try {
        console.log(`👤 Joining Queue: ${name} (${socket.id})`);

        // Check for duplicate name
        const existingPlayer = await Player.findOne({ where: { name } });
        if (existingPlayer) {
          console.warn(`⚠️ Name already taken: ${name}`);
          socket.emit("join_fail", { message: "This name is already taken. Please choose another." });
          return;
        }


        const newPlayer = await Player.create({ 
            name, 
            score: 0, 
            socketId: socket.id, 
            history: [] 
        });
        
        socket.playerId = newPlayer.id;

        socket.emit("join_success", { playerId: newPlayer.id });
        



        await new Promise(r => setTimeout(r, 10));

      } catch (err) { 
        console.error(`❌ Join Error for ${name}:`, err);
        socket.emit("error", { message: "Could not join. Please try again." });
      }
    });
  });


  socket.on('submit_answer', (data) => {
    if (!socket.playerId) {
      console.warn(`⚠️ Unauthenticated vote attempt from socket ${socket.id}`);
      return;
    }
    

    if (state.currentVotes[socket.playerId]) {
      return;
    }

    if (!state.currentVotes) state.currentVotes = {};
    state.currentVotes[socket.playerId] = data.answer;
  });


  socket.on('player_reconnect', async (playerId) => {
    try {
      const player = await Player.findByPk(playerId);
      if (player) {
        console.log(`♻️ Player Reconnected: ${player.name}`);
        player.socketId = socket.id;
        await player.save();
        socket.playerId = player.id;

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