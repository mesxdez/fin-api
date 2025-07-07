const { Sequelize } = require("sequelize");

// InfinityFree Database Configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || "yourusername_fin_api",
  process.env.DB_USER || "yourusername_dbuser",
  process.env.DB_PASSWORD || "your_password",
  {
    host: process.env.DB_HOST || "sql.infinityfree.com",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 3,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    dialectOptions: {
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
      ssl: false,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    retry: {
      max: 5,
      timeout: 5000,
    },
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
  }
);

const connectDB = async () => {
  try {
    console.log("Connecting to InfinityFree MySQL...");
    await sequelize.authenticate();
    console.log("✅ InfinityFree MySQL Connected successfully.");

    // Sync all models with alter option
    console.log("Synchronizing database schema...");
    await sequelize.sync({ alter: true });
    console.log("✅ Database synchronized successfully.");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);

    // แสดงข้อผิดพลาดที่เฉพาะเจาะจง
    if (error.code === "ECONNREFUSED") {
      console.error("❌ Connection refused. Please check:");
      console.error("   - Database host is correct");
      console.error("   - Database is running");
      console.error("   - Firewall settings");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("❌ Access denied. Please check:");
      console.error("   - Username and password are correct");
      console.error("   - User has proper permissions");
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.error("❌ Database does not exist. Please check:");
      console.error("   - Database name is correct");
      console.error("   - Database was created in InfinityFree");
    }

    console.error("Full error:", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
