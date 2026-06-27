import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  secret: "dev-secret-key-for-seeding-only",
  baseURL: "http://localhost:3000",
});

const admins = [
  { email: "super@eavi-college.edu", password: "admin123", name: "Super Admin", role: "SUPER_ADMIN" },
  { email: "main@eavi-college.edu", password: "admin123", name: "Main Campus Admin", role: "ADMIN", campus: "MAIN" },
  { email: "west@eavi-college.edu", password: "admin123", name: "West Campus Admin", role: "ADMIN", campus: "WEST" },
];

async function main() {
  for (const admin of admins) {
    const existing = await prisma.user.findUnique({ where: { email: admin.email } });
    if (existing) {
      console.log(`Already exists: ${admin.email}`);
      continue;
    }

    try {
      const { user } = await auth.api.signUpEmail({
        body: {
          email: admin.email,
          password: admin.password,
          name: admin.name,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: admin.role,
          campus: admin.campus,
        },
      });

      console.log(`Created: ${admin.email} (${admin.role})`);
    } catch (err) {
      console.error(`Failed: ${admin.email}`, err);
    }
  }

  await prisma.$disconnect();
  console.log("Seed complete!");
}

main();
