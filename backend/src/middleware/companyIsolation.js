const mongoose = require("mongoose");

const companyIsolation = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Safely get any requested company ID
    const requestedCompanyId =
      req.params?.companyId ||
      req.body?.company ||
      req.body?.companyId ||
      req.query?.companyId;

    // -----------------------------------------
    // Company Admin / Employee
    // -----------------------------------------
    if (
      req.user.role === "company_admin" ||
      req.user.role === "employee"
    ) {
      if (!req.user.company) {
        return res.status(403).json({
          success: false,
          message: "User is not associated with a company.",
        });
      }

      const userCompanyId = req.user.company.toString();

      // Prevent company switching
      if (
        requestedCompanyId &&
        requestedCompanyId.toString() !== userCompanyId
      ) {
        return res.status(403).json({
          success: false,
          message: "Access to this company is not permitted.",
        });
      }

      // Server-controlled company scope
      req.companyId = req.user.company;

      return next();
    }

    // -----------------------------------------
    // Super Admin
    // -----------------------------------------
    if (req.user.role === "super_admin") {
      // No company specified = platform-wide access
      if (!requestedCompanyId) {
        req.companyId = null;
        return next();
      }

      // Validate company ID
      if (!mongoose.Types.ObjectId.isValid(requestedCompanyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid company ID.",
        });
      }

      req.companyId = new mongoose.Types.ObjectId(
        requestedCompanyId
      );

      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Invalid user role.",
    });
  } catch (error) {
    console.error("Company isolation error:", error);

    return res.status(500).json({
      success: false,
      message: "Company access validation failed.",
    });
  }
};

module.exports = companyIsolation;