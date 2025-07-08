const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    define: {
      charset: "utf8",
      collate: "utf8_general_ci",
    },
  }
);

// ฟังก์ชันสำหรับเชื่อมต่อ + sync DB
const connectDB = async () => {
  try {
    console.log("🔌 Connecting to Neon PostgreSQL...");
    await sequelize.authenticate();
    console.log("✅ Connected to Neon!");

    // Sync model กับ database
    console.log("🔄 Syncing models...");
    await sequelize.sync({ alter: true });
    console.log("✅ Database schema synchronized.");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
