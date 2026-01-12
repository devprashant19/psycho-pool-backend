const Player = require('../models/Player');
const state = require('../state/gameState'); // Import mutable state
const { QUESTIONS, ADMIN_PASSWORD } = require('../config/constants');
const { Op } = require('sequelize'); // Needed for bulk update

module.exports = (io, socket) => {

  const isAdmin = () => socket.id === state.adminSocketId;

  // --- 1. TOGGLE MODE ---
  socket.on('admin_toggle_mode', () => {
    if (!isAdmin()) return;
    
    // Switch between MINORITY and MAJORITY
    state.winningMode = state.winningMode === 'MINORITY' ? 'MAJORITY' : 'MINORITY';
    
    console.log(`🔄 Mode Switched to: ${state.winningMode}`);
    
    // Tell the Admin UI to update the button color/text
    socket.emit('admin_mode_update', state.winningMode);
  });

  // --- LOGIN ---
  socket.on('admin_login', (password) => {
    if (password === ADMIN_PASSWORD) {
      state.adminSocketId = socket.id;
      socket.emit('admin_login_success');
      
      // Send current sync state
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

  // --- GAME CONTROL ---
  socket.on('admin_start_round', ({ roundNumber }) => {
    if (!isAdmin()) return;
    if (!QUESTIONS[roundNumber]) return;

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
        id: q.id, 
        text: q.text, 
        options: q.options, 
        timeLimit: q.timeLimit,
        mode: state.winningMode // 👈 ADD THIS LINE
      });
    } else {
      state.gamePhase = 'LOBBY'; 
      io.emit('round_over');
    }
  });

  // --- REVEAL RESULT ---
  socket.on('admin_reveal_results', async () => {
    if (!isAdmin()) return;

    const voteCounts = {};
    Object.values(state.currentVotes).forEach(vote => {
      voteCounts[vote] = (voteCounts[vote] || 0) + 1;
    });

    const counts = Object.values(voteCounts);
    
    if (counts.length === 0) {
      io.emit('minority_result', { voteCounts: {}, winningOptions: [] });
      return;
    }

    // Check mode
    let targetCount;
    if (state.winningMode === 'MAJORITY') {
       targetCount = Math.max(...counts);
    } else {
       targetCount = Math.min(...counts);
    }

    const winningOptions = Object.keys(voteCounts).filter(opt => voteCounts[opt] === targetCount);

    // Calculate Winners
    const winningPlayerIds = [];
    for (const [playerId, playerVote] of Object.entries(state.currentVotes)) {
      if (winningOptions.includes(playerVote)) {
        winningPlayerIds.push(playerId);
      }
    }

    // Bulk Update DB
    if (winningPlayerIds.length > 0) {
      try {
        console.log(`🏆 Bulk Updating ${winningPlayerIds.length} winners (${state.winningMode} Mode)...`);
        await Player.increment({ score: 10 }, { where: { id: winningPlayerIds } });
      } catch (err) { console.error("Score Update Error:", err); }
    }

    const resultData = { voteCounts, winningOptions, mode: state.winningMode };
    state.gamePhase = 'WAITING_RESULT';
    state.lastMinorityResult = resultData;
    io.emit('minority_result', resultData);
  });

  // --- LEADERBOARD (UPDATED) ---
  socket.on('admin_show_leaderboard', async () => {
    if (!isAdmin()) return;
    state.gamePhase = 'LEADERBOARD';
    
    // 1. Fetch Top 30 Players
    const players = await Player.findAll({ 
      order: [['score', 'DESC']], 
      limit: 30 
    });
    
    // 2. Calculate Ranks with Logic (1st, 1st, 3rd...)
    const formattedBoard = [];
    
    for (let i = 0; i < players.length; i++) {
      let rank;
      
      if (i === 0) {
        rank = 1;
      } else {
        // If score is same as previous player, share rank
        if (players[i].score === players[i - 1].score) {
          rank = formattedBoard[i - 1].rank;
        } else {
          // Otherwise, rank is actual position (i + 1)
          rank = i + 1;
        }
      }

      formattedBoard.push({ 
        userId: players[i].id, 
        name: players[i].name, 
        score: players[i].score, 
        rank: rank // 👈 Added Rank
      });
    }
    
    io.emit('show_leaderboard', formattedBoard);
  });

  socket.on('admin_end_round', () => {
    if (!isAdmin()) return;
    state.gamePhase = 'LOBBY';
    io.emit('round_over');
  });

  socket.on('admin_reset_game', async () => {
    if (!isAdmin()) return;
    await Player.destroy({ where: {}, truncate: true });
    
    state.gameState.currentRound = 0;
    state.gameState.currentQuestionIndex = -1;
    state.currentVotes = {}; 
    state.gamePhase = 'LOBBY'; 
    state.lastMinorityResult = null;
    
    io.emit('player_count_update', 0); 
    io.emit('game_reset'); 
  });
};