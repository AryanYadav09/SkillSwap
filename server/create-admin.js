const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@skillswap.dev" },
    update: { password: hashedPassword, role: "ADMIN" },
    create: {
      email: "admin@skillswap.dev",
      name: "System Admin",
      password: hashedPassword,
      role: "ADMIN",
      department: "IT",
      designation: "Administrator",
      contact: "0000000000",
      reputation: 9999
    }
  });

  console.log("Admin created successfully:", admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
