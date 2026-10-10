
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

let socket = null;

export const connectSocket = (token) => {
  if (!token) {
    return null;
  }

  // Reuse an existing connection when the token hasn't changed.
  if (socket?.connected && socket.auth?.token === token) {
    return socket;
  }

  // Replace an old connection if the authenticated user changes.
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
