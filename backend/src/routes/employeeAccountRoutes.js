const express = require("express");
const {
  createEmployeeAccount,
} = require("../controllers/employeeAccountController");

const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

// Only authenticated Company Admins can access these routes
router.use(protect);
router.use(authorize("company_admin"));

// Create an employee account
router.post("/accounts", createEmployeeAccount);

module.exports = router;