
const mongoose = require("mongoose");
const Emergency = require("../models/Emergency");
const Company = require("../models/Company");

const {
  uploadEvidenceToCloudinary,
} = require("../services/evidenceUpload.service");

// Record an action in the emergency response history
const addResponseHistory = (emergency, action, performedBy, note = "") => {
  emergency.responseHistory.push({
    action,
    performedBy,
    note,
    timestamp: new Date(),
  });
};

// Create Emergency Report
const createEmergency = async (req, res) => {
  try {
    const { type, description, location } = req.body;

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

// Upload evidence to an emergency
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

// Cancel an emergency reported by the logged-in employee
const cancelEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    // Validate emergency ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency ID.",
      });
    }

    // Validate cancellation reason
    if (
      typeof cancellationReason !== "string" ||
      cancellationReason.trim().length < 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a cancellation reason of at least 5 characters.",
      });
    }

    if (cancellationReason.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason cannot exceed 500 characters.",
      });
    }

    // Find only the employee's own emergency within their company
    const emergency = await Emergency.findOne({
      _id: id,
      company: req.user.company,
      reportedBy: req.user._id,
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found.",
      });
    }

    // Only triggered emergencies can be cancelled
    if (emergency.status !== "triggered") {
      return res.status(400).json({
        success: false,
        message:
          "This emergency cannot be cancelled because its status is no longer triggered.",
      });
    }

    // Update the existing record instead of deleting it
    emergency.status = "cancelled";
    emergency.cancellationReason = cancellationReason.trim();

    await emergency.save();

    return res.status(200).json({
      success: true,
      message: "Emergency cancelled successfully.",
      data: { emergency },
    });
  } catch (error) {
    console.error("Cancel Emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel emergency.",
    });
  }
};

// Get all emergencies belonging to the logged-in Company Admin's company
const getCompanyEmergencies = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    // Validate pagination
    const currentPage = Number(page);
    const pageLimit = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      !Number.isInteger(pageLimit) ||
      currentPage < 1 ||
      pageLimit < 1 ||
      pageLimit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters.",
      });
    }

    // Validate status filter
    const allowedStatuses = [
      "triggered",
      "alert_created",
      "response_in_progress",
      "resolved",
      "closed",
      "cancelled",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency status.",
      });
    }

    // Validate emergency type filter
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

    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency type.",
      });
    }

    // Company isolation
    const filter = {
      company: req.user.company,
    };

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    const skip = (currentPage - 1) * pageLimit;

    const [emergencies, total] = await Promise.all([
      Emergency.find(filter)
        .populate("reportedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      Emergency.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: emergencies.length,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageLimit),
      data: {
        emergencies,
      },
    });
  } catch (error) {
    console.error("Get company emergencies error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve company emergencies.",
    });
  }
};

// Acknowledge an emergency
const acknowledgeEmergency = async (req, res) => {
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
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found.",
      });
    }

    if (emergency.status !== "triggered") {
      return res.status(400).json({
        success: false,
        message: "Only triggered emergencies can be acknowledged.",
      });
    }

    emergency.status = "alert_created";
    emergency.acknowledgedBy = req.user._id;
    emergency.acknowledgedAt = new Date();

    addResponseHistory(
      emergency,
      "acknowledged",
      req.user._id,
      "Emergency acknowledged by Company Admin."
    );

    await emergency.save();

    return res.status(200).json({
      success: true,
      message: "Emergency acknowledged successfully.",
      data: { emergency },
    });
  } catch (error) {
    console.error("Acknowledge Emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to acknowledge emergency.",
    });
  }
};

// Start emergency response
const startEmergencyResponse = async (req, res) => {
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
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found.",
      });
    }

    if (emergency.status !== "alert_created") {
      return res.status(400).json({
        success: false,
        message: "Only acknowledged emergencies can enter response.",
      });
    }

    emergency.status = "response_in_progress";
    emergency.responseStartedBy = req.user._id;
    emergency.responseStartedAt = new Date();

    addResponseHistory(
      emergency,
      "response_started",
      req.user._id,
      "Emergency response initiated."
    );

    await emergency.save();

    return res.status(200).json({
      success: true,
      message: "Emergency response started successfully.",
      data: { emergency },
    });
  } catch (error) {
    console.error("Start Emergency Response error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start emergency response.",
    });
  }
};

// Resolve an emergency
const resolveEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency ID.",
      });
    }

    if (note !== undefined && typeof note !== "string") {
      return res.status(400).json({
        success: false,
        message: "Resolution note must be a string.",
      });
    }

    if (typeof note === "string" && note.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Resolution note cannot exceed 1000 characters.",
      });
    }

    const emergency = await Emergency.findOne({
      _id: id,
      company: req.user.company,
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found.",
      });
    }

    if (emergency.status !== "response_in_progress") {
      return res.status(400).json({
        success: false,
        message: "Only emergencies with an active response can be resolved.",
      });
    }

    emergency.status = "resolved";
    emergency.resolvedBy = req.user._id;
    emergency.resolvedAt = new Date();

    addResponseHistory(
      emergency,
      "resolved",
      req.user._id,
      note ? note.trim() : "Emergency marked as resolved."
    );

    await emergency.save();

    return res.status(200).json({
      success: true,
      message: "Emergency resolved successfully.",
      data: { emergency },
    });
  } catch (error) {
    console.error("Resolve Emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resolve emergency.",
    });
  }
};

// Close a resolved emergency
const closeEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency ID.",
      });
    }

    if (note !== undefined && typeof note !== "string") {
      return res.status(400).json({
        success: false,
        message: "Closure note must be a string.",
      });
    }

    if (typeof note === "string" && note.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Closure note cannot exceed 1000 characters.",
      });
    }

    const emergency = await Emergency.findOne({
      _id: id,
      company: req.user.company,
    });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found.",
      });
    }

    if (emergency.status !== "resolved") {
      return res.status(400).json({
        success: false,
        message: "Only resolved emergencies can be closed.",
      });
    }

    emergency.status = "closed";
    emergency.closedBy = req.user._id;
    emergency.closedAt = new Date();

    addResponseHistory(
      emergency,
      "closed",
      req.user._id,
      note ? note.trim() : "Emergency formally closed."
    );

    await emergency.save();

    return res.status(200).json({
      success: true,
      message: "Emergency closed successfully.",
      data: { emergency },
    });
  } catch (error) {
    console.error("Close Emergency error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to close emergency.",
    });
  }
};

// Export all controller functions
module.exports = {
  createEmergency,
  getMyEmergencies,
  getEmergencyById,
  uploadEmergencyEvidence,
  cancelEmergency,
  getCompanyEmergencies,
  acknowledgeEmergency,
  startEmergencyResponse,
  resolveEmergency,
  closeEmergency,
};