const { io } = require("socket.io-client");

const URL = "https://psycho-pool-backend.onrender.com";
const TOTAL_CLIENTS = 500;
const clients = [];

async function start() {
  console.log("Phase 1: Connecting 500 users quietly...");

  // 1. Connect everyone first
  for (let i = 0; i < TOTAL_CLIENTS; i++) {
    const socket = io(URL, { transports: ["websocket"] });
    
    socket.on("connect", () => {
      // Must join to have a valid Player ID in DB
      socket.emit("join_game", { name: `Voter_${i}` });
    });

    // Store socket for step 2
    clients.push(socket);
    
    // Slight delay to prevent join crash
    await new Promise(r => setTimeout(r, 10)); 
    process.stdout.write(`\rConnected: ${i + 1}/${TOTAL_CLIENTS}`);
  }

  console.log("\n\n⚠️ PREPARE FOR IMPACT: Submitting 500 votes INSTANTLY...");
  await new Promise(r => setTimeout(r, 2000)); // Wait 2s for calm

  // 2. The Attack: Fire all events at once (Promise.all)
  const votePromises = clients.map((socket, index) => {
    return new Promise((resolve) => {
      // Fake a question ID for testing
      socket.emit("submit_answer", { 
        playerId: `some-uuid-${index}`, // In real test, use real ID from join_success
        questionId: "q1", 
        answer: "Red" 
      });
      resolve();
    });
  });

  await Promise.all(votePromises);
  console.log("🚀 500 Votes Sent! Check Server Logs for 'SequelizeConnectionError'.");
}

start();