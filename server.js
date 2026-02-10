require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// ❌ REDIS REMOVED (Not needed for Single Server)
// const { createClient } = require("redis"); 
// const { createAdapter } = require("@socket.io/redis-adapter");

// Imports from new structure
const { connectDB } = require('./src/config/db');
const socketManager = require('./src/sockets');

// App Setup
const app = express();
app.use(cors());
const server = http.createServer(app);

// Socket Setup
const io = new Server(server, { 
  cors: {
    // 👇 ALLOW YOUR VERCEL DOMAIN AND LOCALHOST
    origin: [
      "https://psycho-pool-frontend.vercel.app", 
      "https://psycho-pool-frontend.vercel.app/admin", 
      "http://localhost:5173", 
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  } 
});

// Initialize Systems
connectDB();

// --- 🟢 SINGLE SERVER MODE (NO REDIS) ---
// Since we are running on 1 Cloud Run instance, we use the default memory adapter.
console.log("✅ Single Server Mode Active: Running without Redis.");

// Pass control to your socket logic immediately
socketManager(io);
// -----------------------------------------------------------

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));