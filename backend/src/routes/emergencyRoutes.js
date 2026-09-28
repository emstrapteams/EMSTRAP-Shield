const express = require("express");
const router = express.Router();

const uploadEvidence = require("../middleware/uploadEvidence");

const {
  createEmergency,
  getMyEmergencies,
  getEmergencyById,
  uploadEmergencyEvidence,
} = require("../controllers/emergencyController");

const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

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

// Employee uploads evidence to their own emergency
router.post(
  "/:id/evidence",
  authorize("employee"),
  uploadEvidence,
  uploadEmergencyEvidence
);

// Employee or Company Admin views emergency details
router.get(
  "/:id",
  authorize("employee", "company_admin"),
  getEmergencyById
);

module.exports = router;