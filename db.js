const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determine if we are in Production (using a cloud URL)
const isProduction = !!process.env.DATABASE_URL;

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/quizgame', {
  dialect: 'postgres', // Explicitly state the dialect
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: isProduction ? {
    ssl: {
      require: true,
      rejectUnauthorized: false // Required for Supabase to accept the connection
    }
  } : {}
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected');
    await sequelize.sync(); 
    console.log('✅ Tables Synced');
  } catch (error) {
    console.error('❌ Database Connection Error:', error);
  }
};

module.exports = { sequelize, connectDB };