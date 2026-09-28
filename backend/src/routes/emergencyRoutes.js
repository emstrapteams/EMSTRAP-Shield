const express = require("express");

const {
  createEmergency,
  getMyEmergencies,
  getEmergencyById,
} = require("../controllers/emergencyController");

const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

// All emergency routes require authentication
router.use(protect);

// Employee creates an emergency report
router.post(
  "/",
  authorize("employee"),
  createEmergency
);

// Employee views their own emergency reports
router.get(
  "/my",
  authorize("employee"),
  getMyEmergencies
);

// Employee or Company Admin views emergency details
router.get(
  "/:id",
  authorize("employee", "company_admin"),
  getEmergencyById
);

module.exports = router;