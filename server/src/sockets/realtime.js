const activeUsers = new Map();

let ioInstance = null;

const setSocketServer = (io) => {
  ioInstance = io;
};

const registerUserSocket = (userId, socketId) => {
  const currentSockets = activeUsers.get(userId) || new Set();
  currentSockets.add(socketId);
  activeUsers.set(userId, currentSockets);
};

const unregisterUserSocket = (userId, socketId) => {
  const currentSockets = activeUsers.get(userId);

  if (!currentSockets) {
    return;
  }

  currentSockets.delete(socketId);

  if (!currentSockets.size) {
    activeUsers.delete(userId);
    return;
  }

  activeUsers.set(userId, currentSockets);
};

const emitToUser = (userId, event, payload) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(`user:${userId}`).emit(event, payload);
};

const broadcastPresence = (userId, isOnline) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.emit("presence:update", {
    userId,
    isOnline,
  });
};

const isUserOnline = (userId) => activeUsers.has(userId);

module.exports = {
  setSocketServer,
  registerUserSocket,
  unregisterUserSocket,
  emitToUser,
  broadcastPresence,
  isUserOnline,
};
