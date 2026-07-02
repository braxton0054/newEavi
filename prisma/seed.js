const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(4).toString("hex");
  const hash = crypto.createHash("md5").update(password + salt).digest("hex");
  return `${hash}:${salt}`;
}

const ADMINS = [
  { email: "super@eavi-college.edu", password: "admin123", name: "Super Admin", role: "SUPER_ADMIN" },
  { email: "main@eavi-college.edu", password: "admin123", name: "Main Campus Admin", role: "ADMIN", campus: "MAIN" },
  { email: "west@eavi-college.edu", password: "admin123", name: "West Campus Admin", role: "ADMIN", campus: "WEST" },
];

const COURSES = [
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
  { name: "Hairdressing and Beauty Therapy", department: "Beauty, Fashion & Design" },
  { name: "Fashion and Design", department: "Beauty, Fashion & Design" },
  { name: "Garment Making", department: "Beauty, Fashion & Design" },
  { name: "Secretarial", department: "Business, Management & Finance" },
  { name: "Business Administration and Management", department: "Business, Management & Finance" },
  { name: "Human Resource Management (HRM)", department: "Business, Management & Finance" },
  { name: "Logistics and Procurement Management", department: "Business, Management & Finance" },
  { name: "Store Keeping", department: "Business, Management & Finance" },
  { name: "Purchasing & Supply Management", department: "Business, Management & Finance" },
  { name: "Financial Management for NGOs", department: "Business, Management & Finance" },
  { name: "NGOs Management", department: "Business, Management & Finance" },
  { name: "Project Management", department: "Business, Management & Finance" },
  { name: "Monitoring and Evaluation of Projects", department: "Business, Management & Finance" },
  { name: "Public Administration and Relations", department: "Business, Management & Finance" },
  { name: "Computer Packages / IT / ICT / Information Science", department: "ICT & Computer Studies" },
  { name: "All Computer Packages (Ksh 1,800 only)", department: "ICT & Computer Studies" },
  { name: "Teacher Education", department: "Education & Training" },
  { name: "Training of Trainers (TOT)", department: "Education & Training" },
  { name: "Leadership Skills Development", department: "Education & Training" },
  { name: "Guidance and Counseling Skills Development", department: "Education & Training" },
  { name: "Counseling Psychology", department: "Education & Training" },
  { name: "Counseling", department: "Education & Training" },
  { name: "Electrical Engineering", department: "Engineering & Technical" },
  { name: "Civil/Building/Survey", department: "Engineering & Technical" },
  { name: "Water Engineering / Plumbing", department: "Engineering & Technical" },
  { name: "Mechanical/Automotive", department: "Engineering & Technical" },
  { name: "Catering / Food and Beverage Management / Culinary Arts", department: "Hospitality & Tourism" },
  { name: "Hotel and Hospitality Management", department: "Hospitality & Tourism" },
  { name: "Tourism Management", department: "Hospitality & Tourism" },
  { name: "Customer Care / Front Office Management", department: "Hospitality & Tourism" },
  { name: "Social Work and Nurse Aide", department: "Social Work & Development" },
  { name: "Community Development and Social Work", department: "Social Work & Development" },
  { name: "Gender and Development Studies", department: "Social Work & Development" },
  { name: "Conflict Management and Peace Building", department: "Social Work & Development" },
  { name: "Disaster Management", department: "Social Work & Development" },
  { name: "Security Management", department: "Security & Safety" },
  { name: "Criminology", department: "Security & Safety" },
  { name: "First Aid", department: "Security & Safety" },
  { name: "Firefighting and Extinguisher Use", department: "Security & Safety" },
  { name: "General Agriculture", department: "Agriculture" },
];

async function main() {
  console.log("Seeding admin users...");
  for (const a of ADMINS) {
    const existing = await prisma.user.findUnique({ where: { email: a.email } });
    if (existing) {
      console.log(`  SKIP ${a.email} — already exists`);
      continue;
    }
    const user = await prisma.user.create({
      data: { email: a.email, name: a.name, role: a.role, campus: a.campus || null },
    });
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "email",
        password: hashPassword(a.password),
        type: "email",
      },
    });
    console.log(`  OK ${a.email} (${a.role})`);
  }

  console.log("Seeding courses...");
  let created = 0;
  for (const c of COURSES) {
    const exists = await prisma.course.findUnique({ where: { name: c.name } });
    if (exists) continue;
    await prisma.course.create({ data: { name: c.name, department: c.department, minGrade: "TBD" } });
    created++;
  }
  console.log(`  ${created} courses created`);

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
