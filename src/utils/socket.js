import { io } from "socket.io-client";

let socket;

export function connectSocket({ token }) {
  socket = io(import.meta.env.VITE_WS_URL || "http://localhost:5000", {
    transports: ["websocket"],
    auth: token ? { token } : undefined,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
}
