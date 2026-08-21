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
    try {
      await prisma.$connect();

      server.listen(env.PORT, () => {
        console.log(`SkillSwap API running on port ${env.PORT}`);
      });
    } catch (error) {
      console.error("Failed to start server", error);
      process.exit(1);
    }
  };

  const shutdown = async () => {
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  startServer();
}
