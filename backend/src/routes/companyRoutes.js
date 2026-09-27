const express = require("express");

const {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  updateCompanyStatus,
} = require("../controllers/companyController");

const { protect } = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.use(protect);
router.use(authorize("super_admin"));

router.post("/", createCompany);
router.get("/", getCompanies);
router.get("/:id", getCompanyById);
router.put("/:id", updateCompany);
router.patch("/:id/status", updateCompanyStatus);

module.exports = router;