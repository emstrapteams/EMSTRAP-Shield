
require("dotenv").config();

const mongoose = require("mongoose");
const readline = require("readline");
const User = require("./src/models/User");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

async function resetEmployeePassword() {
  try {
    await mongoose.connect(process.env.SHIELD_DB_URI);

    console.log("\nConnected to Shield database.\n");

    const email = (await ask("Enter employee email: "))
      .trim()
      .toLowerCase();

    const newPassword = await ask("Enter new password (minimum 8 characters): ");

    if (newPassword.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    const employee = await User.findOne({
      email,
      role: "employee",
    });

    if (!employee) {
      throw new Error(
        "Employee account not found. Please check the email."
      );
    }

    employee.password = newPassword;

    // The User model's pre-save hook automatically hashes the password.
    await employee.save();

    console.log("\nPassword reset successfully!");
    console.log("Employee:", employee.name);
    console.log("Email:", employee.email);
    console.log("Role:", employee.role);
    console.log("\nYou can now log in using the new password.");
  } catch (error) {
    console.error("\nError:", error.message);
  } finally {
    await mongoose.disconnect();
    rl.close();
  }
}

resetEmployeePassword();