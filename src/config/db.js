const { Sequelize } = require('sequelize');
require('dotenv').config();

// 1. Detect if we are running on Google Cloud Run
const isGCP = process.env.K_SERVICE !== undefined || process.env.CLOUD_RUN_SERVICE_NAME !== undefined;

let sequelize;

if (isGCP) {
  // ☁️ GOOGLE CLOUD CONFIGURATION (Unix Socket)
  console.log('☁️ Environment: Google Cloud Detected. Connecting via Socket...');
  
  sequelize = new Sequelize(
    process.env.DB_NAME,     // game_db
    process.env.DB_USER,     // postgres
    process.env.DB_PASS,     // Prashant1901Database
    {
      dialect: 'postgres',
      host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
      pool: {
        max: 20, 
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      logging: false,
      dialectOptions: {
        // Crucial: This tells the driver to use the Unix Socket
        socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
      }
    }
  );

} else {
  // 💻 LOCAL CONFIGURATION (Standard TCP)
  console.log('💻 Environment: Local/Standard Detected. Connecting via TCP...');

  const dbUrl = process.env.DATABASE_URL;
  const connectionString = dbUrl || 'postgres://postgres:password@localhost:5432/quizgame';
  
  const useSSL = !!dbUrl && !dbUrl.includes('localhost');

  sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 8,
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
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database Connected successfully via ${isGCP ? 'Cloud Socket' : 'TCP'}.`);

    // 👇 CRITICAL FIX: Run this in PRODUCTION too!
    // This creates the 'Players' table if it is missing.
    await sequelize.sync({ alter: true }); 
    console.log('✅ Tables Synced and Ready.');

  } catch (error) {
    console.error('❌ FATAL DB CONNECTION ERROR:', error);
    // Print details to help debug if it fails
    if (isGCP) {
        console.error(`Attempted Socket Path: /cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`);
    }
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };