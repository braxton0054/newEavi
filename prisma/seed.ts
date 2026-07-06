import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MIN_GRADE = "D-";

const courses = [
  // ── Health Sciences ──
  { name: "Peri-operative Theater Technology", department: "Health Sciences" },
  { name: "Orthopaedic and Trauma Medicine", department: "Health Sciences" },
  { name: "Dental Assistant", department: "Health Sciences" },
  { name: "Phlebotomy", department: "Health Sciences" },
  { name: "Certified Nurse Assistant (CNA)", department: "Health Sciences" },
  { name: "Morgue Attendant", department: "Health Sciences" },
  { name: "Basic Life Support (BLS)", department: "Health Sciences" },
  { name: "Mortuary Science", department: "Health Sciences" },
  { name: "Home Care Nursing", department: "Health Sciences" },
  { name: "Health Services Support", department: "Health Sciences" },
  { name: "Health Care Assistant", department: "Health Sciences" },
  { name: "Individual Support", department: "Health Sciences" },
  { name: "Caregiver", department: "Health Sciences" },
  { name: "Nurse Aide", department: "Health Sciences" },
  { name: "Patient Attendant", department: "Health Sciences" },
  { name: "Midwifery", department: "Health Sciences" },
  { name: "Child Care and Protection", department: "Health Sciences" },
  { name: "Health Records Management with ICT", department: "Health Sciences" },
  { name: "Community Health Assistant / Public Health", department: "Health Sciences" },
  { name: "Community Health and Social Work", department: "Health Sciences" },
  { name: "Nutrition and Dietetics", department: "Health Sciences" },
  { name: "Nutrition Management Skills", department: "Health Sciences" },
  { name: "Medical Engineering and Lab Technology", department: "Health Sciences" },
  { name: "HIV/AIDS Management", department: "Health Sciences" },
  { name: "HIV/AIDS Testing & Counseling (HTC)", department: "Health Sciences" },

  // ── Beauty, Fashion & Design ──
  { name: "Hairdressing and Beauty Therapy", department: "Beauty, Fashion & Design" },
  { name: "Fashion and Design", department: "Beauty, Fashion & Design" },
  { name: "Garment Making", department: "Beauty, Fashion & Design" },

  // ── Business, Management & Finance ──
  { name: "Secretarial", department: "Business, Management & Finance" },
  { name: "Business Administration and Management (Finance & Banking / Sales and Marketing / Entrepreneurship)", department: "Business, Management & Finance" },
  { name: "Human Resource Management (HRM)", department: "Business, Management & Finance" },
  { name: "Logistics and Procurement Management", department: "Business, Management & Finance" },
  { name: "Store Keeping", department: "Business, Management & Finance" },
  { name: "Purchasing & Supply Management", department: "Business, Management & Finance" },
  { name: "Financial Management for NGOs", department: "Business, Management & Finance" },
  { name: "NGOs Management", department: "Business, Management & Finance" },
  { name: "Project Management", department: "Business, Management & Finance" },
  { name: "Monitoring and Evaluation of Projects", department: "Business, Management & Finance" },
  { name: "Public Administration and Relations", department: "Business, Management & Finance" },

  // ── ICT & Computer Studies ──
  { name: "Computer Packages / IT / ICT / Information Science", department: "ICT & Computer Studies" },
  { name: "All Computer Packages", department: "ICT & Computer Studies" },

  // ── Education & Training ──
  { name: "Teacher Education", department: "Education & Training" },
  { name: "Training of Trainers (TOT)", department: "Education & Training" },
  { name: "Leadership Skills Development", department: "Education & Training" },
  { name: "Guidance and Counseling Skills Development", department: "Education & Training" },
  { name: "Counseling Psychology", department: "Education & Training" },
  { name: "Counseling", department: "Education & Training" },

  // ── Engineering & Technical ──
  { name: "Electrical Engineering", department: "Engineering & Technical" },
  { name: "Civil/Building/Survey", department: "Engineering & Technical" },
  { name: "Water Engineering / Plumbing", department: "Engineering & Technical" },
  { name: "Mechanical/Automotive", department: "Engineering & Technical" },

  // ── Hospitality & Tourism ──
  { name: "Catering / Food and Beverage Management / Culinary Arts", department: "Hospitality & Tourism" },
  { name: "Hotel and Hospitality Management", department: "Hospitality & Tourism" },
  { name: "Tourism Management", department: "Hospitality & Tourism" },
  { name: "Customer Care / Front Office Management", department: "Hospitality & Tourism" },

  // ── Social Work & Development ──
  { name: "Social Work and Nurse Aide", department: "Social Work & Development" },
  { name: "Community Development and Social Work", department: "Social Work & Development" },
  { name: "Gender and Development Studies", department: "Social Work & Development" },
  { name: "Conflict Management and Peace Building", department: "Social Work & Development" },
  { name: "Disaster Management", department: "Social Work & Development" },

  // ── Security & Safety ──
  { name: "Security Management", department: "Security & Safety" },
  { name: "Criminology", department: "Security & Safety" },
  { name: "First Aid", department: "Security & Safety" },
  { name: "Firefighting and Extinguisher Use", department: "Security & Safety" },
];

async function seedUsers() {
  console.log("Seeding default users...");

  const users = [
    { email: "eavi@gmail.com", password: "MAIN1234", name: "Super Admin", role: "SUPER_ADMIN", campus: null },
    { email: "eastafriav@gmail.com", password: "MAIN1234", name: "Main Campus Admin", role: "ADMIN", campus: "MAIN" },
    { email: "west@eavicollege.ac.ke", password: "West1234", name: "West Campus Admin", role: "ADMIN", campus: "WEST" },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`  ${u.role}: ${u.email} — already exists, skipping`);
      continue;
    }

    try {
      // Use Better Auth's sign-up API via internal HTTP call
      // (must use a trusted origin to pass Better Auth's CSRF check)
      const res = await fetch("http://localhost:4000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Origin": "https://eavi.college.eavi.shop" },
        body: JSON.stringify(u),
      });
      const data = await res.json();
      if (res.ok) {
        // Mark email as verified (Better Auth doesn't auto-verify on sign-up)
        const created = await prisma.user.findUnique({ where: { email: u.email } });
        if (created) {
          await prisma.user.update({ where: { id: created.id }, data: { emailVerified: true } });
        }
        console.log(`  ${u.role}: ${u.email} / ${u.password}`);
      } else {
        console.error(`  ${u.role}: ${u.email} — ${data?.message || res.status}`);
      }
    } catch (err: any) {
      console.error(`  ${u.role}: ${u.email} — error: ${err?.message || err}`);
    }
  }
}

async function main() {
  await seedUsers();
  console.log("");

  console.log(`Seeding ${courses.length} courses...`);

  for (const course of courses) {
    await prisma.course.upsert({
      where: { name: course.name },
      update: { department: course.department, minGrade: MIN_GRADE },
      create: { name: course.name, department: course.department, minGrade: MIN_GRADE },
    });
  }

  const total = await prisma.course.count();
  console.log(`Done. ${total} courses in database (all minGrade: ${MIN_GRADE})`);

  const byDept = await prisma.course.groupBy({
    by: ["department"],
    _count: { id: true },
    orderBy: { department: "asc" },
  });
  for (const d of byDept) {
    console.log(`  ${d.department}: ${d._count.id} courses`);
  }
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
