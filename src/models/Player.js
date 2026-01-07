const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // 👈 Updated path

const Player = sequelize.define('Player', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Auto-generate unique IDs
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  socketId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Store answer history as JSONB (Postgres specific feature - very powerful)
  history: {
    type: DataTypes.JSONB, 
    defaultValue: [] 
  }
});

module.exports = Player;