const http = require("http");

const app = require("./src/app");
const env = require("./src/config/env");
const prisma = require("./src/config/db");
const { initializeSocketServer } = require("./src/sockets");

const server = http.createServer(app);

initializeSocketServer(server);

// Export the server for serverless environments (like Vercel)
module.exports = app;

if (require.main === module) {
  const startServer = async () => {
    server.listen(env.PORT, "0.0.0.0", () => {
      console.log(`SkillSwap API running on port ${env.PORT}`);
    });

    try {
      await prisma.$connect();
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Warning: Initial database connection failed:", error.message);
      console.error("The server is running, but database queries will fail until a valid database is connected.");
    }
  };

  const shutdown = async () => {
    try {
      await prisma.$disconnect();
    } catch (_e) {
      // ignore
    }
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  startServer();
}
