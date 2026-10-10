
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Authenticate every socket connection using the existing JWT.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.userId).select("-password");

      if (!user || user.status !== "active") {
        return next(new Error("Invalid or inactive user account."));
      }

      // Use the verified database user, never a client-supplied company ID.
      socket.data.user = user;

      next();
    } catch (error) {
      if (
        error.name === "TokenExpiredError" ||
        error.name === "JsonWebTokenError"
      ) {
        return next(new Error("Invalid or expired authentication token."));
      }

      console.error("Socket authentication error:", error);
      next(new Error("Socket authentication failed."));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    // Company-specific rooms prevent cross-company broadcasts.
    if (user.company) {
      socket.join(`company:${user.company.toString()}`);
    }

    console.log(`Authenticated socket connected: ${user._id}`);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${user._id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized.");
  }

  return io;
};
const emitEmergencyEvent = (companyId, event, emergency) => {
  getIO()
    .to(`company:${companyId.toString()}`)
    .emit(event, {
      emergency,
    });
};

module.exports = {
  initializeSocket,
  getIO,
  emitEmergencyEvent,
};
