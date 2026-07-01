import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_COURSES = [
  { name: "Diploma in Information Communication Technology", minGrade: "C+" },
  { name: "Certificate in Information Communication Technology", minGrade: "C-" },
  { name: "Diploma in Business Management", minGrade: "C+" },
  { name: "Certificate in Business Management", minGrade: "C-" },
  { name: "Diploma in Early Childhood Education", minGrade: "C" },
  { name: "Certificate in Early Childhood Education", minGrade: "D+" },
  { name: "Diploma in Social Work and Community Development", minGrade: "C" },
  { name: "Certificate in Social Work", minGrade: "D+" },
  { name: "Diploma in Counselling Psychology", minGrade: "C+" },
  { name: "Certificate in Counselling Psychology", minGrade: "C-" },
  { name: "Artisan in Hair Dressing and Beauty Therapy", minGrade: "D" },
  { name: "Artisan in Fashion Design and Garment Making", minGrade: "D" },
];

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

  for (const c of SEED_COURSES) {
    const exists = await prisma.course.findUnique({ where: { name: c.name } });
    if (!exists) {
      await prisma.course.create({ data: c });
      console.log("Seeded course:", c.name);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
