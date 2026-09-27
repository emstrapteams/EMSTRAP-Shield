const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      process.env.SHIELD_DB_URI
    );

    console.log(
      `Shield MongoDB connected: ${connection.connection.host}`
    );

    console.log(
      `Shield Database: ${connection.connection.name}`
    );
  } catch (error) {
    console.error(
      "Shield MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

module.exports = connectDB;