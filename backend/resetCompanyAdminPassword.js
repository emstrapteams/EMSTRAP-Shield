
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

async function main() {
  try {
    await mongoose.connect(process.env.SHIELD_DB_URI);
    console.log("Connected to Shield database.");

    const email = (await ask("Company Admin email: "))
      .trim()
      .toLowerCase();

    const password = await ask("New password (minimum 8 characters): ");

    if (!email || password.length < 8) {
      throw new Error("Email is required and password must be at least 8 characters.");
    }

    const user = await User.findOne({
      email,
      role: "company_admin",
    });

    if (!user) {
      throw new Error("Company Admin account not found.");
    }

    user.password = password;
    await user.save();

    console.log(`Password updated for ${user.email}.`);
  } catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
    rl.close();
  }
}

main();
