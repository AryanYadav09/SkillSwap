const { Server } = require("socket.io");

const env = require("../config/env");
const { verifyAccessToken } = require("../utils/tokens");
const chatService = require("../services/chat.service");
const {
  setSocketServer,
  registerUserSocket,
  unregisterUserSocket,
  broadcastPresence,
  emitToUser,
} = require("./realtime");

const initializeSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  setSocketServer(io);

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const payload = verifyAccessToken(token);
      socket.user = {
        id: payload.sub,
        role: payload.role,
      };

      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    registerUserSocket(socket.user.id, socket.id);
    socket.join(`user:${socket.user.id}`);
    broadcastPresence(socket.user.id, true);

    socket.on("chat:typing", ({ chatId }) => {
      socket.broadcast.emit("chat:typing", {
        chatId,
        userId: socket.user.id,
      });
    });

    socket.on("chat:stop-typing", ({ chatId }) => {
      socket.broadcast.emit("chat:stop-typing", {
        chatId,
        userId: socket.user.id,
      });
    });

    socket.on("message:send", async ({ chatId, message }) => {
      try {
        await chatService.createMessage({
          userId: socket.user.id,
          chatId,
          message,
        });
      } catch (error) {
        socket.emit("socket:error", {
          message: error.message,
        });
      }
    });

    socket.on("message:seen", async ({ chatId }) => {
      try {
        await chatService.markChatAsSeen(socket.user.id, chatId);
      } catch (error) {
        socket.emit("socket:error", {
          message: error.message,
        });
      }
    });

    // ── WebRTC signaling ──────────────────────────────────

    socket.on("call:initiate", ({ targetUserId, callerName, sessionId }) => {
      emitToUser(targetUserId, "call:incoming", {
        callerId: socket.user.id,
        callerName,
        sessionId,
      });
    });

    socket.on("call:accept", ({ callerId }) => {
      emitToUser(callerId, "call:accepted", {
        calleeId: socket.user.id,
      });
    });

    socket.on("call:reject", ({ callerId }) => {
      emitToUser(callerId, "call:rejected", {
        calleeId: socket.user.id,
      });
    });

    socket.on("call:offer", ({ targetUserId, offer }) => {
      emitToUser(targetUserId, "call:offer", {
        callerId: socket.user.id,
        offer,
      });
    });

    socket.on("call:answer", ({ targetUserId, answer }) => {
      emitToUser(targetUserId, "call:answer", {
        calleeId: socket.user.id,
        answer,
      });
    });

    socket.on("call:ice-candidate", ({ targetUserId, candidate }) => {
      emitToUser(targetUserId, "call:ice-candidate", {
        userId: socket.user.id,
        candidate,
      });
    });

    socket.on("call:end", ({ targetUserId }) => {
      emitToUser(targetUserId, "call:ended", {
        userId: socket.user.id,
      });
    });

    // ── Meeting room signaling ─────────────────────────

    socket.on("meeting:join", async ({ meetingToken }) => {
      try {
        const bookingService = require("../services/booking.service");
        const meetingInfo = await bookingService.getMeetingByToken(socket.user.id, meetingToken);

        if (!meetingInfo) {
          socket.emit("meeting:error", { message: "Meeting not found" });
          return;
        }

        const roomId = `meeting:${meetingInfo.meetingToken}`;
        socket.join(roomId);
        socket.meetingRoom = roomId;
        socket.meetingToken = meetingToken;

        // Notify others in the room
        socket.to(roomId).emit("meeting:participant-joined", {
          userId: socket.user.id,
          meetingToken,
        });

        // Send room info back to joiner
        const roomSockets = await io.in(roomId).fetchSockets();
        const participants = roomSockets.map((s) => s.user.id);
        socket.emit("meeting:joined", {
          meetingToken,
          participants,
          meetingInfo,
        });
      } catch (error) {
        socket.emit("meeting:error", { message: error.message || "Failed to join meeting" });
      }
    });

    socket.on("meeting:leave", () => {
      if (socket.meetingRoom) {
        socket.to(socket.meetingRoom).emit("meeting:participant-left", {
          userId: socket.user.id,
        });
        socket.leave(socket.meetingRoom);
        socket.meetingRoom = null;
        socket.meetingToken = null;
      }
    });

    socket.on("meeting:offer", ({ targetUserId, offer }) => {
      if (socket.meetingRoom) {
        socket.to(socket.meetingRoom).emit("meeting:offer", {
          callerId: socket.user.id,
          offer,
        });
      }
    });

    socket.on("meeting:answer", ({ targetUserId, answer }) => {
      if (socket.meetingRoom) {
        socket.to(socket.meetingRoom).emit("meeting:answer", {
          calleeId: socket.user.id,
          answer,
        });
      }
    });

    socket.on("meeting:ice-candidate", ({ candidate }) => {
      if (socket.meetingRoom) {
        socket.to(socket.meetingRoom).emit("meeting:ice-candidate", {
          userId: socket.user.id,
          candidate,
        });
      }
    });

    socket.on("meeting:participant-state", ({ micOn, camOn }) => {
      if (socket.meetingRoom) {
        socket.to(socket.meetingRoom).emit("meeting:participant-state", {
          userId: socket.user.id,
          micOn,
          camOn,
        });
      }
    });

    socket.on("meeting:chat", ({ message }) => {
      if (socket.meetingRoom) {
        io.to(socket.meetingRoom).emit("meeting:chat", {
          userId: socket.user.id,
          message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on("meeting:end", () => {
      if (socket.meetingRoom) {
        io.to(socket.meetingRoom).emit("meeting:ended", {
          userId: socket.user.id,
        });
      }
    });

    // ── Disconnect ────────────────────────────────────────

    socket.on("disconnect", () => {
      // Notify meeting room if in one
      if (socket.meetingRoom) {
        socket.to(socket.meetingRoom).emit("meeting:participant-left", {
          userId: socket.user.id,
        });
      }

      unregisterUserSocket(socket.user.id, socket.id);
      broadcastPresence(socket.user.id, false);
    });
  });

  return io;
};

module.exports = {
  initializeSocketServer,
};
