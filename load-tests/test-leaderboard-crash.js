const { io } = require("socket.io-client");

const URL = "https://psycho-pool-backend.onrender.com";
const TOTAL_CLIENTS = 500;
const clients = [];

// We need an Admin to trigger the broadcast
const ADMIN_PASSWORD = "admin123"; 

console.log("🚀 Setting up Leaderboard Stress Test...");

for (let i = 0; i < TOTAL_CLIENTS; i++) {
  const socket = io(URL, { transports: ["websocket"] });
  clients.push(socket);
  
  if (i === 0) {
    // This is the Admin Bot
    socket.on("connect", () => {
      console.log("🔑 Admin Connected");
      socket.emit("admin_login", ADMIN_PASSWORD);
      
      setTimeout(() => {
        console.log("💣 TRIGGERING LEADERBOARD BROADCAST TO 500 USERS...");
        socket.emit("admin_show_leaderboard");
      }, 5000); // Trigger after 5 seconds
    });
  }

  // Measure latency
  socket.on("show_leaderboard", (data) => {
    if (i === TOTAL_CLIENTS - 1) {
      console.log(`✅ Last Client Received Leaderboard! Payload size: ${JSON.stringify(data).length} bytes`);
    }
  });
}