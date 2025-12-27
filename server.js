require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { connectDB } = require('./db');
const Player = require('./models/Player');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

connectDB();

// --- 🔒 SECURITY ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; 
let adminSocketId = null; 

// --- GAME CONTENT ---
const QUESTIONS = {
  1: [
    { id: 'q1', text: "Vote for the LEAST popular color:", options: ["Red", "Blue", "Green", "Yellow"], timeLimit: 20 },
    { id: 'q2', text: "Which number will be picked the least?", options: ["1", "2", "3", "4"], timeLimit: 20 },
  ],
  2: [
    { id: 'q3', text: "Who is the Impostor?", options: ["Player A", "Player B", "Player C", "Player D"], timeLimit: 20 },
    { id: 'q4', text: "Pick the minority food:", options: ["Pizza", "Burger", "Sushi", "Salad"], timeLimit: 20 },
  ],
  3: [
    { id: 'q5', text: "Which season is the least liked?", options: ["Spring", "Summer", "Autumn", "Winter"], timeLimit: 15 },
    { id: 'q6', text: "Least popular pet?", options: ["Cat", "Dog", "Bird", "Fish"], timeLimit: 15 },
  ],
  4: [
    { id: 'q7', text: "Minority Strategy: Go High or Low?", options: ["High", "Low", "Middle", "None"], timeLimit: 15 },
    { id: 'q8', text: "Pick a direction:", options: ["North", "South", "East", "West"], timeLimit: 15 },
  ],
  5: [
    { id: 'q9', text: "Final Round: Pick the Minority Suit", options: ["Hearts", "Diamonds", "Clubs", "Spades"], timeLimit: 20 },
    { id: 'q10', text: "The Ultimate Choice", options: ["A", "B", "C", "D"], timeLimit: 20 },
  ]
};

// --- GLOBAL STATE ---
let gameState = {
  currentRound: 0,
  currentQuestionIndex: -1, 
};

let gamePhase = 'LOBBY'; 
let lastMinorityResult = null; 
let currentVotes = {}; 

io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // --- 🔒 1. ADMIN LOGIN ---
  socket.on('admin_login', (password) => {
    if (password === ADMIN_PASSWORD) {
      adminSocketId = socket.id; 
      socket.emit('admin_login_success');
      
      let currentQData = null;
      if (gameState.currentRound > 0 && QUESTIONS[gameState.currentRound]) {
         const roundQs = QUESTIONS[gameState.currentRound];
         if (gameState.currentQuestionIndex >= 0 && gameState.currentQuestionIndex < roundQs.length) {
            const q = roundQs[gameState.currentQuestionIndex];
            currentQData = { id: q.id, text: q.text, options: q.options, timeLimit: q.timeLimit };
         }
      }

      socket.emit('admin_state_sync', {
        phase: gamePhase,
        round: gameState.currentRound,
        question: currentQData,
        result: lastMinorityResult
      });

    } else {
      socket.emit('admin_login_fail');
    }
  });

  const isAdmin = () => socket.id === adminSocketId;

  // --- 2. PLAYER RECONNECT ---
  socket.on('player_reconnect', async (playerId) => {
    try {
      const player = await Player.findByPk(playerId);

      if (player) {
        console.log(`♻️ Player Reconnected: ${player.name} (${player.id})`);
        player.socketId = socket.id;
        await player.save();

        let currentQData = null;
        if (gameState.currentRound > 0 && QUESTIONS[gameState.currentRound]) {
           const roundQs = QUESTIONS[gameState.currentRound];
           if (gameState.currentQuestionIndex >= 0 && gameState.currentQuestionIndex < roundQs.length) {
              const q = roundQs[gameState.currentQuestionIndex];
              currentQData = { id: q.id, text: q.text, options: q.options, timeLimit: q.timeLimit };
           }
        }

        socket.emit('player_reconnect_success', {
          playerId: player.id,
          name: player.name,
          score: player.score,
          phase: gamePhase,
          round: gameState.currentRound,
          question: currentQData,
          result: lastMinorityResult
        });
      } else {
        socket.emit('player_reconnect_fail');
      }
    } catch (err) {
      console.error("Reconnect Error:", err);
      socket.emit('player_reconnect_fail');
    }
  });

  // -- JOIN GAME --
  socket.on("join_game", async (data) => {
    try {
      const { name } = data;
      const newPlayer = await Player.create({ name, score: 0, socketId: socket.id, history: [] });
      socket.emit("join_success", { playerId: newPlayer.id });
      io.emit("player_count_update", io.engine.clientsCount);
    } catch (err) { console.error(err); }
  });

  // -- START ROUND --
  socket.on('admin_start_round', ({ roundNumber }) => {
    if (!isAdmin()) return;
    if (!QUESTIONS[roundNumber]) return;

    gameState.currentRound = roundNumber;
    gameState.currentQuestionIndex = -1; 
    gamePhase = 'ROUND_LOADING'; 
    io.emit('round_start', { round: roundNumber });
  });

  // -- NEXT QUESTION --
  socket.on('admin_next_question', () => {
    if (!isAdmin()) return;

    currentVotes = {}; 
    lastMinorityResult = null; 
    
    const roundQ = QUESTIONS[gameState.currentRound];
    if (!roundQ) return;

    gameState.currentQuestionIndex++; 
    const index = gameState.currentQuestionIndex;

    if (index < roundQ.length) {
      const q = roundQ[index];
      gamePhase = 'QUESTION_ACTIVE'; 
      io.emit('new_question', {
        id: q.id, text: q.text, options: q.options, timeLimit: q.timeLimit
      });
    } else {
      gamePhase = 'LOBBY'; 
      io.emit('round_over');
    }
  });

  socket.on('submit_answer', (data) => {
    currentVotes[data.playerId] = data.answer;
  });

  // -- REVEAL RESULT (Optimized Bulk Update) --
  socket.on('admin_reveal_results', async () => {
    if (!isAdmin()) return;

    const voteCounts = {};
    Object.values(currentVotes).forEach(vote => {
      voteCounts[vote] = (voteCounts[vote] || 0) + 1;
    });

    let minCount = Infinity;
    const counts = Object.values(voteCounts);
    
    if (counts.length === 0) {
      io.emit('minority_result', { voteCounts: {}, winningOptions: [] });
      return;
    }

    counts.forEach(c => { if (c < minCount) minCount = c; });
    const winningOptions = Object.keys(voteCounts).filter(opt => voteCounts[opt] === minCount);

    // Optimized Score Update
    const winningPlayerIds = [];
    for (const [playerId, playerVote] of Object.entries(currentVotes)) {
      if (winningOptions.includes(playerVote)) {
        winningPlayerIds.push(playerId);
      }
    }

    if (winningPlayerIds.length > 0) {
      try {
        console.log(`🏆 Bulk Updating ${winningPlayerIds.length} winners...`);
        await Player.increment({ score: 10 }, { where: { id: winningPlayerIds } });
      } catch (err) { console.error("Score Update Error:", err); }
    }

    const resultData = { voteCounts, winningOptions };
    gamePhase = 'WAITING_RESULT';
    lastMinorityResult = resultData;
    io.emit('minority_result', resultData);
  });

  // --- 📉 LEADERBOARD OPTIMIZATION (Issue 2 Fix) ---
  socket.on('admin_show_leaderboard', async () => {
    if (!isAdmin()) return;
    
    gamePhase = 'LEADERBOARD';
    
    // Fetch ONLY the top 30 players
    const players = await Player.findAll({ 
      order: [['score', 'DESC']], 
      limit: 30 // <--- CHANGED FROM 10 TO 30
    });
    
    const formattedBoard = players.map(p => ({ userId: p.id, name: p.name, score: p.score }));
    io.emit('show_leaderboard', formattedBoard);
  });

  socket.on('admin_end_round', () => {
    if (!isAdmin()) return;
    gamePhase = 'LOBBY';
    io.emit('round_over');
  });

  socket.on('disconnect', () => {
    io.emit('player_count_update', io.engine.clientsCount);
    if (socket.id === adminSocketId) adminSocketId = null;
  });

  socket.on('admin_reset_game', async () => {
    if (!isAdmin()) return;
    await Player.destroy({ where: {}, truncate: true });
    
    gameState.currentRound = 0;
    gameState.currentQuestionIndex = -1;
    currentVotes = {}; 
    gamePhase = 'LOBBY'; 
    lastMinorityResult = null;
    
    io.emit('player_count_update', 0); 
    io.emit('game_reset'); 
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));