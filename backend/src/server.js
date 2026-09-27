const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { protect } = require("./middleware/auth");

const app = express();

connectDB();

const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");

// -----------------------------
// Middleware
// -----------------------------

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------------
// Routes
// -----------------------------

app.use("/api/auth", authRoutes);

app.get("/api/auth/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        company: req.user.company,
        status: req.user.status,
      },
    },
  });
});
app.use("/api/companies", companyRoutes);

// -----------------------------
// Health Check
// -----------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EMSTRAP Shield backend is running"
  });
});

// -----------------------------
// 404 Handler
// -----------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// -----------------------------
// Start Server
// -----------------------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`EMSTRAP Shield server running on port ${PORT}`);
});