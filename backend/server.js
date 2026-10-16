require("node:dns").setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Import routes
const employeeRoutes = require("./routes/employeeRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const facilityRoutes = require("./routes/facilityRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const fireExtinguisherRoutes = require("./routes/fireExtinguisherRoutes");
const firstAidKitRoutes = require("./routes/firstAidKitRoutes");
const inspectionRoutes = require("./routes/inspectionRoutes");
const correctiveActionRoutes = require("./routes/correctiveActionRoutes");
const emergencyResourceRoutes = require("./routes/emergencyResourceRoutes");
const trainingProgramRoutes = require("./routes/trainingProgramRoutes");
const trainingSessionRoutes = require("./routes/trainingSessionRoutes");
const trainingAttendanceRoutes = require("./routes/trainingAttendanceRoutes");
const trainingDashboardRoutes = require("./routes/trainingDashboardRoutes");
const drillRoutes = require("./routes/drillRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const companyRoutes = require("./routes/companyRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Shield API is running.",
  });
});

// API routes
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/fire-extinguishers", fireExtinguisherRoutes);
app.use("/api/first-aid-kits", firstAidKitRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/corrective-actions", correctiveActionRoutes);
app.use("/api/emergency-resources", emergencyResourceRoutes);
app.use("/api/training-programs", trainingProgramRoutes);
app.use("/api/training-sessions", trainingSessionRoutes);
app.use("/api/training-attendance", trainingAttendanceRoutes);
app.use("/api/training-dashboard", trainingDashboardRoutes);
app.use("/api/drills", drillRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5000;

// Connect to MongoDB before starting the API server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`[Shield API] Listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("[Shield API] Startup failed:", error.message);
    process.exit(1);
  }
};

startServer();