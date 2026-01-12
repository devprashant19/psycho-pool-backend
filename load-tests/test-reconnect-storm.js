const { io } = require("socket.io-client");

const URL = "https://psycho-pool-backend.onrender.com";
const TOTAL_CLIENTS = 500;
let clients = [];

async function setup() {
  console.log("Phase 1: Normal Join...");
  for (let i = 0; i < TOTAL_CLIENTS; i++) {
    const socket = io(URL, { transports: ["websocket"], forceNew: true });
    clients.push(socket);
    if(i % 100 === 0) process.stdout.write(`.`);
    await new Promise(r => setTimeout(r, 5));
  }
  
  console.log("\n\n🔌 Phase 2: SIMULATING WIFI CRASH (Disconnect All)");
  clients.forEach(s => s.disconnect());
  clients = []; // Clear memory
  
  await new Promise(r => setTimeout(r, 2000));

  console.log("⚡ Phase 3: RECONNECT STORM (All 500 connect instantly)");
  
  let reconnected = 0;
  for (let i = 0; i < TOTAL_CLIENTS; i++) {
    // No await here = Instant storm
    const socket = io(URL, { transports: ["websocket"] });
    socket.on("connect", () => {
      reconnected++;
      if (reconnected % 50 === 0) console.log(`Recovered: ${reconnected}/500`);
    });
  }
}

setup();