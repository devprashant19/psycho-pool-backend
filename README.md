# Psycho Pool Backend

A real-time backend service for the Psycho Pool Quiz application, built with Node.js, Express, Socket.io, and PostgreSQL.

## 🚀 Features

- **Real-Time Interaction**: Powered by [Socket.io](https://socket.io/) for instant player-admin communication.
- **Database Integration**: Uses **PostgreSQL** with [Sequelize](https://sequelize.org/) ORM.
- **Dual Environment Support**:
  - **Local Development**: Standard TCP connection to local Postgres.
  - **Google Cloud Run**: Optimized Unix Socket connection for Cloud SQL.
- **Scalable Architecture**: Modular handler structure for socket events (`playerHandlers`, `adminHandlers`).
- **Data Persistence**: Tracks player scores and history.

## 🔗 Related Repositories

- **Frontend**: [Psycho Pool Frontend](https://github.com/devprashant19/psycho-pool-frontend)

## 🌐 Live Deployment

- **Frontend**: [Deployed on Vercel](https://psycho-pool-frontend.vercel.app)
- **Backend**: Deployed on **Google Cloud Run**

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express](https://expressjs.com/)
- **WebSocket**: [Socket.io](https://socket.io/)
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Deployment**: Google Cloud Run (Dockerized)

## 📂 Project Structure

```
├── src
│   ├── config
│   │   └── db.js          # Database connection (Local & GCP)
│   ├── models
│   │   └── Player.js      # Sequelize model for Player
│   ├── sockets
│   │   ├── index.js       # Main socket entry point
│   │   ├── adminHandlers.js # Admin-specific socket events
│   │   └── playerHandlers.js # Player-specific socket events
│   └── state
│       └── gameState.js   # In-memory game state management
├── server.js              # Application entry point
├── Dockerfile             # Container configuration
└── package.json           # Dependencies and scripts
```

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL installed and running locally

### 2. Clone and Install
```bash
git clone https://github.com/devprashant19/psycho-pool-backend.git
cd psycho-pool-backend
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:

```env
# Server
PORT=4000

# Database (Local)
DATABASE_URL=postgres://postgres:password@localhost:5432/quizgame

# Database (Google Cloud Run - Optional)
# DB_NAME=game_db
# DB_USER=postgres
# DB_PASS=your_password
# INSTANCE_CONNECTION_NAME=project:region:instance
```

### 4. Run Locally
Development mode with nodemon:
```bash
npm run dev
```

Start production server:
```bash
npm start
```

## ☁️ Deployment (Google Cloud Run)

The application is configured to detect Cloud Run environments automatically. It switches from TCP to Unix Socket connection for Cloud SQL when `K_SERVICE` or `CLOUD_RUN_SERVICE_NAME` env vars are present.

1. **Build Container**:
   ```bash
   docker build -t gcr.io/[PROJECT-ID]/quiz-backend .
   ```
2. **Push to Registry**:
   ```bash
   docker push gcr.io/[PROJECT-ID]/quiz-backend
   ```
3. **Deploy**:
   Ensure your Cloud Run service has the Cloud SQL Client role and the correct SQL connection setup.

## 🔌 Socket Events

### Global
- `connection`: Client connected
- `disconnect`: Client disconnected
- `player_count_update`: Broadcasts current active connections

### Player Handlers
- Events handled in `src/sockets/playerHandlers.js` responsible for player actions.

### Admin Handlers
- Events handled in `src/sockets/adminHandlers.js` responsible for game controls.

## 📄 License
ISC
