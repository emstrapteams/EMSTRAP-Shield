
const mongoose = require("mongoose");
const User = require("../models/User");
const Company = require("../models/Company");

// Create Employee Account
const createEmployeeAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    // Validate input types
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid input types.",
      });
    }

    if (name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email cannot be empty.",
      });
    }

    // Company is derived from the authenticated Company Admin
    const companyId = req.user.company;

    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Company association is missing or invalid.",
      });
    }

    // Verify that the company exists and is active
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found.",
      });
    }

    if (company.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot create employees for an inactive company.",
      });
    }

    // Prevent duplicate accounts
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    // Create employee with server-controlled role and company
    const employee = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "employee",
      company: company._id,
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Employee account created successfully.",
      data: {
        user: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          company: employee.company,
          status: employee.status,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    console.error("Create Employee Account error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create employee account.",
    });
  }
};

module.exports = { createEmployeeAccount };