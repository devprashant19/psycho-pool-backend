const { io } = require("socket.io-client");
const URL = "https://psycho-pool-backend.onrender.com"; // Or your Render URL
const CLIENTS = 500;
const sockets = [];

console.log(`🤖 STARTING FULL SIMULATION FOR ${CLIENTS} BOTS...`);

// 1. Slow Ramp Up (Lobby Phase)
let connected = 0;
const interval = setInterval(() => {
  if (connected >= CLIENTS) {
    clearInterval(interval);
    console.log("\n✅ All Bots Joined. Waiting for Game Start...");
    startRoundLogic();
    return;
  }
  
  const i = connected++;
  const socket = io(URL, { transports: ["websocket"], forceNew: true });
  
  // Store player ID for later voting
  socket.on("join_success", (data) => { socket.playerId = data.playerId; });
  
  socket.emit("join_game", { name: `Bot_${i}` });
  sockets.push(socket);
  process.stdout.write(`\rJoined: ${connected}`);
}, 10); // 10ms delay between joins

async function startRoundLogic() {
  // 2. Simulate "Thinking Time" (Everyone waits 10s)
  await new Promise(r => setTimeout(r, 5000));
  
  console.log("\n🗳️  Round Started! Bots submitting answers...");

  // 3. The Vote Spike (Everyone votes within 2 seconds)
  sockets.forEach((socket, i) => {
    setTimeout(() => {
      if (socket.playerId) {
        socket.emit("submit_answer", { 
          playerId: socket.playerId, 
          questionId: "q1", 
          answer: Math.random() > 0.5 ? "Red" : "Blue" 
        });
      }
    }, Math.random() * 2000); // Random delay between 0-2000ms
  });

  console.log("✅ Votes Submitted. Waiting for Results...");
}