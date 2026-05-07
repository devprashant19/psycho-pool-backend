const Player = require('../models/Player');
const state = require('../state/gameState');
const { QUESTIONS, ADMIN_PASSWORD } = require('../config/constants');

module.exports = (io, socket) => {

  const isAdmin = () => socket.id === state.adminSocketId;


  socket.on('admin_toggle_mode', () => {
    if (!isAdmin()) return;
    state.winningMode = state.winningMode === 'MINORITY' ? 'MAJORITY' : 'MINORITY';
    socket.emit('admin_mode_update', state.winningMode);
  });


  socket.on('admin_login', (password) => {
    if (password === ADMIN_PASSWORD) {
      state.adminSocketId = socket.id;
      socket.emit('admin_login_success');
      
      // Sync State logic
      let currentQData = null;
      if (state.gameState.currentRound > 0 && QUESTIONS[state.gameState.currentRound]) {
         const roundQs = QUESTIONS[state.gameState.currentRound];
         if (state.gameState.currentQuestionIndex >= 0 && state.gameState.currentQuestionIndex < roundQs.length) {
            const q = roundQs[state.gameState.currentQuestionIndex];
            currentQData = { id: q.id, text: q.text, options: q.options, timeLimit: q.timeLimit };
         }
      }

      socket.emit('admin_state_sync', {
        phase: state.gamePhase,
        round: state.gameState.currentRound,
        question: currentQData,
        result: state.lastMinorityResult,
        winningMode: state.winningMode 
      });
    } else {
      socket.emit('admin_login_fail');
    }
  });


  socket.on('admin_start_round', ({ roundNumber }) => {
    if (!isAdmin()) return;
    state.gameState.currentRound = roundNumber;
    state.gameState.currentQuestionIndex = -1; 
    state.gamePhase = 'ROUND_LOADING'; 
    io.emit('round_start', { round: roundNumber });
  });

  socket.on('admin_next_question', () => {
    if (!isAdmin()) return;

    state.currentVotes = {}; 
    state.lastMinorityResult = null; 
    
    const roundQ = QUESTIONS[state.gameState.currentRound];
    if (!roundQ) return;

    state.gameState.currentQuestionIndex++; 
    
    if (state.gameState.currentQuestionIndex < roundQ.length) {
      const q = roundQ[state.gameState.currentQuestionIndex];
      state.gamePhase = 'QUESTION_ACTIVE'; 
      io.emit('new_question', {
        id: q.id, text: q.text, options: q.options, timeLimit: q.timeLimit, mode: state.winningMode
      });
    } else {
      state.gamePhase = 'LOBBY'; 
      io.emit('round_over');
    }
  });


  socket.on('admin_reveal_results', async () => {
    if (!isAdmin()) return;

    if (state.gamePhase !== 'QUESTION_ACTIVE') {
        console.warn(`⚠️ Attempted to reveal results during ${state.gamePhase} phase.`);
        return;
    }

    try {
        const voteCounts = {};
        Object.values(state.currentVotes).forEach(vote => {
        voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        });

        const counts = Object.values(voteCounts);
        
        // Handle 0 votes case
        if (counts.length === 0) {
        console.log("⚠️ No votes recorded.");
        io.emit('minority_result', { voteCounts: {}, winningOptions: [], mode: state.winningMode });
        return;
        }

        let targetCount;
        if (state.winningMode === 'MAJORITY') {
            targetCount = Math.max(...counts);
        } else {
            targetCount = Math.min(...counts);
        }

        const winningOptions = Object.keys(voteCounts).filter(opt => voteCounts[opt] === targetCount);

        const winningPlayerIds = [];
        for (const [playerId, playerVote] of Object.entries(state.currentVotes)) {
            if (winningOptions.includes(playerVote)) {
                winningPlayerIds.push(playerId);
            }
        }



        if (winningPlayerIds.length > 0) {
            try {
                await Player.increment({ score: 10 }, { where: { id: winningPlayerIds } });
            } catch (dbErr) {
                console.error("❌ DB UPDATE ERROR:", dbErr);
            }
        }


        try {
            for (const [pId, pVote] of Object.entries(state.currentVotes)) {
                const isCorrect = winningOptions.includes(pVote);
                const player = await Player.findByPk(pId);
                if (player) {
                    const newHistory = [...(player.history || []), {
                        round: state.gameState.currentRound,
                        questionIndex: state.gameState.currentQuestionIndex,
                        answer: pVote,
                        isCorrect
                    }];
                    await player.update({ history: newHistory });
                }
            }
        } catch (histErr) {
            console.error("❌ HISTORY UPDATE ERROR:", histErr);
        }

        const resultData = { voteCounts, winningOptions, mode: state.winningMode };
        state.gamePhase = 'WAITING_RESULT';
        state.lastMinorityResult = resultData;
        io.emit('minority_result', resultData);


        

        const allSockets = await io.fetchSockets();
        allSockets.forEach(s => {
            if (s.playerId && state.currentVotes[s.playerId]) {
                const playerVote = state.currentVotes[s.playerId];
                const isCorrect = winningOptions.includes(playerVote);
                s.emit('answer_result', { 
                    isCorrect, 
                    winningOptions,
                    scoreDelta: isCorrect ? 10 : 0 
                });
            }
        });

    } catch (err) {
        console.error("❌ FATAL REVEAL ERROR:", err);
    }
  });


  socket.on('admin_show_leaderboard', async () => {
    if (!isAdmin()) return;
    
    try {
        state.gamePhase = 'LEADERBOARD';
        
        console.log("📊 Fetching Leaderboard...");
        

        const players = await Player.findAll({ 
            order: [['score', 'DESC']], 
            limit: 30 
        });
        
        let currentRank = 1;
        const formattedBoard = players.map((p, i) => {
            if (i > 0 && p.score < players[i - 1].score) {
                currentRank = i + 1;
            }
            return { userId: p.id, name: p.name, score: p.score, rank: currentRank };
        });
        
        io.emit('show_leaderboard', formattedBoard);
        console.log(`✅ Sent Leaderboard with ${formattedBoard.length} entries.`);

    } catch (err) {
        console.error("❌ LEADERBOARD CRASH ERROR:", err);
        // Send empty list so admin doesn't freeze
        socket.emit('show_leaderboard', []); 
    }
  });

  socket.on('admin_end_round', () => {
    if (!isAdmin()) return;
    state.gamePhase = 'LOBBY';
    io.emit('round_over');
  });

  socket.on('admin_reset_game', async () => {
    if (!isAdmin()) return;
    try {
        await Player.destroy({ where: {}, truncate: true });
    } catch(err) { console.error("Reset DB Error", err); }

    state.gameState.currentRound = 0;
    state.gameState.currentQuestionIndex = -1;
    state.currentVotes = {}; 
    state.gamePhase = 'LOBBY'; 
    state.lastMinorityResult = null;
    io.emit('player_count_update', 0); 
    io.emit('game_reset'); 
  });
};