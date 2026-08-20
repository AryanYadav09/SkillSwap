const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const skillRoutes = require("./routes/skill.routes");
const learningSkillRoutes = require("./routes/learning-skill.routes");
const matchRoutes = require("./routes/match.routes");
const chatRoutes = require("./routes/chat.routes");
const messageRoutes = require("./routes/message.routes");
const sessionRoutes = require("./routes/session.routes");
const reviewRoutes = require("./routes/review.routes");
const notificationRoutes = require("./routes/notification.routes");
const bookmarkRoutes = require("./routes/bookmark.routes");
const reportRoutes = require("./routes/report.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const adminRoutes = require("./routes/admin.routes");
const availabilityRoutes = require("./routes/availability.routes");
const slotRoutes = require("./routes/slot.routes");
const meetingRoutes = require("./routes/booking.routes");

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  env.CLIENT_URL,
  ...env.CLIENT_URLS.split(",").map((origin) => origin.trim()).filter(Boolean),
  ...(env.NODE_ENV === "development"
    ? ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]
    : []),
];

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin || 
        allowedOrigins.includes(origin) || 
        (origin && origin.endsWith('.vercel.app'))
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(compression());
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SkillSwap API is healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/learning-skills", learningSkillRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/users", slotRoutes);
app.use("/api/meetings", meetingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
