const { io } = require("socket.io-client");

// ⚠️ UPDATE THIS URL
const URL = "https://psycho-pool-backend.onrender.com"; 
// const URL = "https://your-app.onrender.com";

const TOTAL_CLIENTS = 500;
const JOIN_INTERVAL_MS = 10; // Very fast joining (100 per second)

const clients = [];

console.log(`🚀 STARTING LOBBY CRASH TEST: ${TOTAL_CLIENTS} users...`);

let joinedCount = 0;

function connectClient(i) {
  const socket = io(URL, {
    transports: ["websocket"],
    reconnection: false, // Don't auto-reconnect, we want to see it fail
  });

  socket.on("connect", () => {
    socket.emit("join_game", { name: `Bot_${i}` });
  });

  socket.on("join_success", () => {
    joinedCount++;
    process.stdout.write(`\r✅ Joined: ${joinedCount}/${TOTAL_CLIENTS}`);
  });

  socket.on("disconnect", () => {
    console.log(`\n❌ Bot_${i} Disconnected (Server likely crashed)`);
  });

  clients.push(socket);
}

// Stagger the joins slightly to avoid crashing your LAPTOP
for (let i = 0; i < TOTAL_CLIENTS; i++) {
  setTimeout(() => connectClient(i), i * JOIN_INTERVAL_MS);
}