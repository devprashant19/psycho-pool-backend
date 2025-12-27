const { Sequelize } = require('sequelize');
require('dotenv').config();

// Replace with your local Postgres credentials
// Format: 'postgres://username:password@localhost:5432/database_name'
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/quizgame', {
  logging: false, // Set to console.log to see raw SQL queries
  pool: {
    max: 10,      // Max concurrent connections
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected');
    // Sync models (creates tables if they don't exist)
    await sequelize.sync(); 
    console.log('✅ Tables Synced');
  } catch (error) {
    console.error('❌ Database Connection Error:', error);
  }
};

module.exports = { sequelize, connectDB };