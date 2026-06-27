import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const superAdmin = await prisma.user.upsert({
    where: { email: "super@eavi-college.edu" },
    update: {},
    create: {
      email: "super@eavi-college.edu",
      name: "Super Admin",
      role: "SUPER_ADMIN",
    },
  });

  const mainAdmin = await prisma.user.upsert({
    where: { email: "main@eavi-college.edu" },
    update: {},
    create: {
      email: "main@eavi-college.edu",
      name: "Main Campus Admin",
      role: "ADMIN",
      campus: "MAIN",
    },
  });

  const westAdmin = await prisma.user.upsert({
    where: { email: "west@eavi-college.edu" },
    update: {},
    create: {
      email: "west@eavi-college.edu",
      name: "West Campus Admin",
      role: "ADMIN",
      campus: "WEST",
    },
  });

  console.log("Seeded users:", { superAdmin: superAdmin.email, mainAdmin: mainAdmin.email, westAdmin: westAdmin.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
