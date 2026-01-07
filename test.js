const { io } = require("socket.io-client");

// ⚠️ CHANGE THIS TO YOUR RENDER URL (e.g., https://myapp.onrender.com)
// ⚠️ START WITH LOCALHOST FIRST to make sure the script works!
const URL = "https://psycho-pool-backend.onrender.com"; 

const MAX_CLIENTS = 200;
const CLIENT_CREATION_INTERVAL = 50; // Add a bot every 50ms (prevents crashing your own PC)

let clientCount = 0;

const connectClient = (id) => {
  const socket = io(URL, {
    transports: ["websocket"], // Force WebSocket to avoid polling overhead
    reconnection: true
  });

  socket.on("connect", () => {
    // 1. Join the Game
    const name = `Bot_${id}`;
    socket.emit("join_game", { name: name });
    console.log(`✅ [${id}] Connected & Joined`);
  });

  // 2. Listen for Questions & Vote Instantly
  socket.on("new_question", (data) => {
    console.log(`📩 [${id}] Received Question. Voting...`);
    
    // Pick a random answer (Option 0, 1, 2, or 3)
    const randomOption = data.options[Math.floor(Math.random() * data.options.length)];
    
    socket.emit("submit_answer", {
      playerId: null, // The server uses socket.id usually, but if your server relies on DB ID, we rely on server handling session
      // NOTE: In your current server code, you track votes by socket ID in `currentVotes[playerId]`. 
      // Since bots don't save localstorage, we need to ensure the server knows who they are.
      // Actually, your join_game returns a playerId. We should capture that.
    });
  });

  // 3. Handle the Join Success to get our Real ID
  socket.on("join_success", (data) => {
    // Now we know our DB ID. Let's store it for voting.
    socket.playerId = data.playerId; 
  });

  // 4. Update the Vote Logic
  socket.on("new_question", (qData) => {
    if (!socket.playerId) return;
    
    const randomOption = qData.options[Math.floor(Math.random() * qData.options.length)];
    
    // Simulate "thinking time" between 1s and 5s so they don't ALL hit exactly at millisecond 0
    // (Or remove setTimeout to test the "Thundering Herd" crash)
    const delay = Math.random() * 2000; 
    
    setTimeout(() => {
      socket.emit("submit_answer", {
        playerId: socket.playerId,
        questionId: qData.id,
        answer: randomOption
      });
    }, delay);
  });
  
  socket.on("disconnect", () => console.log(`❌ [${id}] Disconnected`));
};

const start = () => {
  const interval = setInterval(() => {
    if (clientCount >= MAX_CLIENTS) {
      clearInterval(interval);
      console.log("🚀 All bots launched!");
      return;
    }
    connectClient(clientCount++);
  }, CLIENT_CREATION_INTERVAL);
};

start();