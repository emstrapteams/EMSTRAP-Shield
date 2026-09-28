
const mongoose = require("mongoose");
const Emergency = require("../models/Emergency");
const Company = require("../models/Company");
const {
  uploadEvidenceToCloudinary,
} = require("../services/evidenceUpload.service");

// Create Emergency Report
const createEmergency = async (req, res) => {
  try {
    const { type, description, location } = req.body;

    // Validate emergency type
    const allowedTypes = [
      "medical",
      "fire",
      "accident",
      "electrical",
      "chemical",
      "gas",
      "vehicle",
      "equipment",
      "security",
      "other",
    ];

    if (!type || !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "A valid emergency type is required.",
      });
    }

    // Validate location
    if (
      !location ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid GPS coordinates are required.",
      });
    }

    if (
      location.latitude < -90 ||
      location.latitude > 90 ||
      location.longitude < -180 ||
      location.longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "GPS coordinates are out of range.",
      });
    }

    // Get company and employee from authenticated user
    const companyId = req.user.company;
    const employeeId = req.user._id;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "User is not associated with a company.",
      });
    }

    // Verify company is active
    const company = await Company.findById(companyId);

    if (!company || company.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Company is inactive or unavailable.",
      });
    }

    // Create emergency record
    const emergency = await Emergency.create({
      company: companyId,
      reportedBy: employeeId,
      type,
      description:
        typeof description === "string" ? description.trim() : "",
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy:
          typeof location.accuracy === "number"
            ? location.accuracy
            : null,
        address:
          typeof location.address === "string"
            ? location.address.trim()
            : "",
      },
      status: "triggered",
    });

    return res.status(201).json({
      success: true,
      message: "Emergency report created successfully.",
      data: { emergency },
    });
  } catch (error) {
    console.error("Create Emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create emergency report.",
    });
  }
};

// Get emergencies reported by the logged-in employee
const getMyEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      reportedBy: req.user._id,
      company: req.user.company,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: emergencies.length,
      data: { emergencies },
    });
  } catch (error) {
    console.error("Get My Emergencies error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve emergencies.",
    });
  }
};

// Get a specific emergency
const getEmergencyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency ID.",
      });
    }

    const emergency = await Emergency.findOne({
      _id: id,
      company: req.user.company,
    }).populate("reportedBy", "name email");

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found.",
      });
    }

    // Employees can only view their own reports
    if (
      req.user.role === "employee" &&
      emergency.reportedBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this emergency.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { emergency },
    });
  } catch (error) {
    console.error("Get Emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve emergency.",
    });
  }
};
const uploadEmergencyEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Validate emergency ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency ID",
      });
    }

    // Find emergency within the employee's company
    const emergency = await Emergency.findOne({
      _id: id,
      company: user.company,
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    // Employees can only upload evidence to their own emergencies
    if (
      user.role === "employee" &&
      emergency.reportedBy.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only upload evidence to your own emergencies",
      });
    }

    // Ensure files were provided
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one evidence file is required",
      });
    }

    // Prevent exceeding the evidence limit
    if (emergency.evidence.length + req.files.length > 5) {
      return res.status(400).json({
        success: false,
        message: "An emergency can have a maximum of 5 evidence files",
      });
    }

    // Upload files to Cloudinary
    const uploadedFiles = await Promise.all(
      req.files.map((file) => uploadEvidenceToCloudinary(file))
    );

    // Attach uploaded evidence to emergency
    emergency.evidence.push(...uploadedFiles);

    await emergency.save();

    return res.status(200).json({
      success: true,
      message: "Emergency evidence uploaded successfully",
      evidence: emergency.evidence,
    });
  } catch (error) {
    console.error("Evidence upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload emergency evidence",
    });
  }
};

module.exports = {
  createEmergency,
  getMyEmergencies,
  getEmergencyById,
  uploadEmergencyEvidence,
};