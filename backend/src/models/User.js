const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["super_admin", "company_admin", "employee"],
      required: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});
// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Validate role and company relationship
userSchema.pre("validate", function () {
  // Super Admin must not belong to a company
  if (this.role === "super_admin" && this.company) {
    this.invalidate(
      "company",
      "Super Admin cannot be associated with a company."
    );
  }

  // Company Admin and Employee must belong to a company
  if (
    (this.role === "company_admin" || this.role === "employee") &&
    !this.company
  ) {
    this.invalidate(
      "company",
      `${this.role} must be associated with a company.`
    );
  }
});

module.exports = mongoose.model("User", userSchema);
module.exports = mongoose.model("User", userSchema);