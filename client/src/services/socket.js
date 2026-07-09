import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket;

export function getSocket(accessToken) {
  if (!accessToken) {
    return null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: {
        token: accessToken,
      },
    });
  }

  socket.auth = {
    token: accessToken,
  };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
