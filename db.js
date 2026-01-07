const { Sequelize } = require('sequelize');
require('dotenv').config();

// 1. Get the Database URL from Environment
const dbUrl = process.env.DATABASE_URL;

// 2. Define if we are in Production
const isProduction = !!dbUrl; 

// 3. Fallback for Local Development ONLY
// If we are on Render (Production) but dbUrl is missing, this usually breaks.
// But we'll let it try to connect or fail clearly.
const connectionString = dbUrl || 'postgresql://postgres:$#@!ManaviSharma1234@db.algailnlyceqsjyfqytq.supabase.co:5432/postgres';

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
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
      rejectUnauthorized: false // ✅ Crucial for Supabase
    }
  } : {} // ✅ Empty for Localhost
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(isProduction ? '✅ Cloud Database Connected' : '✅ Local Database Connected');
    await sequelize.sync(); 
    console.log('✅ Tables Synced');
  } catch (error) {
    console.error('❌ Database Connection Error:', error);
  }
};

module.exports = { sequelize, connectDB };