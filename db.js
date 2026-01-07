const { Sequelize } = require('sequelize');
require('dotenv').config();

// 1. Get the URL
const dbUrl = process.env.DATABASE_URL;

// 2. DEBUGGING: Print status to Render Logs (Masking password for safety)
if (!dbUrl) {
  console.log("⚠️ WARNING: process.env.DATABASE_URL is undefined.");
} else {
  console.log(`✅ Found DATABASE_URL: ${dbUrl.substring(0, 20)}...`);
}

// 3. Select Connection String
// On Render, we MUST use dbUrl. If it's missing, we crash intentionally to warn you.
// On Local, we use the fallback.
const connectionString = dbUrl || 'postgres://postgres:password@localhost:5432/quizgame';

// 4. Determine SSL Setting
// If we found a Cloud URL, we assume we need SSL.
const useSSL = !!dbUrl;

// 5. Initialize
const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: useSSL ? {
    ssl: {
      require: true,
      rejectUnauthorized: false 
    }
  } : {}
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected Successfully.');
    await sequelize.sync(); 
    console.log('✅ Tables Synced.');
  } catch (error) {
    console.error('❌ FATAL DB CONNECTION ERROR:', error);
  }
};

module.exports = { sequelize, connectDB };