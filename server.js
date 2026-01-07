require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Imports from new structure
const { connectDB } = require('./src/config/db');
const socketManager = require('./src/sockets'); // Imports index.js automatically

// App Setup
const app = express();
app.use(cors());
const server = http.createServer(app);

// Socket Setup
const io = new Server(server, { 
  cors: { origin: "*" } 
});

// Initialize Systems
connectDB();
socketManager(io); // 👈 Passes control to the socket folder

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));