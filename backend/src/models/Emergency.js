const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
  {
    // Company that owns this emergency
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    // Employee who reported the emergency
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Category of emergency
    type: {
      type: String,
      enum: [
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
      ],
      required: true,
    },

    // Brief description
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // GPS coordinates
    location: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
      accuracy: {
        type: Number,
        min: 0,
        default: null,
      },
      address: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // Evidence attached to the emergency
    evidence: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: null,
        },
        mediaType: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Emergency lifecycle
    status: {
      type: String,
      enum: [
        "triggered",
        "alert_created",
        "response_in_progress",
        "resolved",
        "closed",
        "cancelled",
      ],
      default: "triggered",
      index: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Efficient queries for company dashboards and employee history
emergencySchema.index({ company: 1, createdAt: -1 });
emergencySchema.index({ reportedBy: 1, createdAt: -1 });

module.exports = mongoose.model("Emergency", emergencySchema);