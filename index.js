require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const { connectDB } = require("./config/database");
const User = require("./models/User");
const Content = require("./models/Content");
const { Op } = require("sequelize");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES_IN = 3600;

connectDB();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing token" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

async function initializeAdmin() {
  let retries = 3;
  while (retries > 0) {
    try {
      const adminExists = await User.findOne({ where: { username: "admin" } });
      if (!adminExists) {
        await User.create({
          username: "admin",
          password: "password123",
          name: "John Doe",
        });
        console.log("✅ Default admin user created");
      } else {
        console.log("ℹ️ Admin user already exists");
      }
      break;
    } catch (error) {
      retries--;
      console.error(
        `❌ Error creating admin user (${retries} retries left):`,
        error.message
      );
      if (retries === 0) {
        console.error("❌ Failed to create admin user after all retries");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
}

async function initializeContent() {
  let retries = 3;
  while (retries > 0) {
    try {
      const contentExists = await Content.findOne({
        where: { title: "Getting Started with React" },
      });
      if (!contentExists) {
        await Content.create({
          title: "Getting Started with React",
          textHtml: "<p>Learn the basics of React development...</p>",
          banner: "/images/products/s4.jpg",
          createdBy: "John Doe",
          updatedBy: "John Doe",
          status: "Published",
        });
        console.log("✅ Default content created");
      } else {
        console.log("ℹ️ Default content already exists");
      }
      break;
    } catch (error) {
      retries--;
      console.error(
        `❌ Error creating default content (${retries} retries left):`,
        error.message
      );
      if (retries === 0) {
        console.error("❌ Failed to create default content after all retries");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
}

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ where: { username, password } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign(
      { username: user.username, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.json({ accessToken, expiresIn: JWT_EXPIRES_IN });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/admin/contents", authenticateToken, async (req, res) => {
  try {
    let { page = 1, limit = 10, status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    let whereClause = {};
    if (status && ["Draft", "Published", "Archived"].includes(status)) {
      whereClause.status = status;
    }

    const { count, rows } = await Content.findAndCountAll({
      where: whereClause,
      limit,
      offset: (page - 1) * limit,
      order: [["createdAt", "DESC"]],
    });

    res.json({ data: rows, meta: { page, limit, total: count } });
  } catch (error) {
    console.error("Get contents error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/admin/contents", authenticateToken, async (req, res) => {
  try {
    const { title, textHtml, banner, status } = req.body;

    if (
      !title ||
      !textHtml ||
      !banner ||
      !["Draft", "Published", "Archived"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid content data" });
    }

    const content = await Content.create({
      title,
      textHtml,
      banner,
      createdBy: req.user.name,
      updatedBy: req.user.name,
      status,
    });

    res.status(201).json(content);
  } catch (error) {
    console.error("Create content error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/admin/contents/:id", authenticateToken, async (req, res) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json(content);
  } catch (error) {
    console.error("Get content by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/admin/contents/:id", authenticateToken, async (req, res) => {
  try {
    const { title, textHtml, banner, status } = req.body;

    if (
      !title ||
      !textHtml ||
      !banner ||
      !["Draft", "Published", "Archived"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid content data" });
    }

    const content = await Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    await content.update({
      title,
      textHtml,
      banner,
      status,
      updatedBy: req.user.name,
    });

    res.json(content);
  } catch (error) {
    console.error("Update content error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/admin/contents/:id", authenticateToken, async (req, res) => {
  try {
    const content = await Content.findByPk(req.params.id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    await content.destroy();
    res.status(204).send();
  } catch (error) {
    console.error("Delete content error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/contents", async (req, res) => {
  try {
    let { page = 1, limit = 10, search } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    let whereClause = { status: "Published" };
    if (search && search.trim()) {
      whereClause.title = { [Op.like]: `%${search.trim()}%` };
    }

    const data = await Content.findAll({
      where: whereClause,
      limit,
      offset: (page - 1) * limit,
      order: [["createdAt", "DESC"]],
    });

    res.json(data);
  } catch (error) {
    console.error("Get public contents error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/contents/:id", async (req, res) => {
  try {
    const content = await Content.findOne({
      where: {
        id: req.params.id,
        status: "Published",
      },
    });
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json(content);
  } catch (error) {
    console.error("Get public content by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: "Neon PostgreSQL",
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: Neon PostgreSQL`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);

  setTimeout(async () => {
    await initializeAdmin();
    await initializeContent();
  }, 2000);
});
