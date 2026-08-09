const { PrismaClient } = require("@prisma/client");
const matchService = require("./src/services/match.service");
const dotenv = require("dotenv");

dotenv.config();
const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findFirst({
      where: { role: "USER", status: "ACTIVE" }
    });
    if (!user) {
      console.log("No user found");
      return;
    }
    console.log("Testing matches for user:", user.id);
    const result = await matchService.listCompatibleMatches(user.id, { page: 1, limit: 10 });
    console.log(`Found ${result.meta.total} matches`);
    if (result.items.length > 0) {
      console.log("Top match:", result.items[0].id, "ML Score:", result.items[0].mlScore, "Reason:", result.items[0].mlReason);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}
run();
