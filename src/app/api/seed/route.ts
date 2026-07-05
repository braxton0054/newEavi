import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: new Headers() });
    // No session required for seed — it's a one-off setup endpoint
    const admins = [
      { email: "super@eavi-college.edu", password: "admin123", name: "Super Admin", role: "SUPER_ADMIN" as const },
      { email: "main@eavi-college.edu", password: "admin123", name: "Main Campus Admin", role: "ADMIN" as const, campus: "MAIN" as const },
      { email: "west@eavi-college.edu", password: "admin123", name: "West Campus Admin", role: "ADMIN" as const, campus: "WEST" as const },
    ];

    const results: any[] = [];
    for (const admin of admins) {
      const existing = await prisma.user.findUnique({ where: { email: admin.email } });
      if (existing) {
        results.push({ email: admin.email, status: "already exists" });
        continue;
      }

      try {
        const { user } = await auth.api.signUpEmail({
          body: {
            email: admin.email,
            password: admin.password,
            name: admin.name,
            role: admin.role,
            campus: admin.campus,
          },
        });

        results.push({ email: admin.email, role: admin.role, campus: admin.campus });
      } catch (err: any) {
        results.push({ email: admin.email, error: err?.message || String(err) });
      }
    }

    const courseSeed = [
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

    let coursesCreated = 0;
    for (const c of courseSeed) {
      const exists = await prisma.course.findUnique({ where: { name: c.name } });
      if (!exists) {
        await prisma.course.create({ data: { ...c, minGrade: "TBD" } });
        coursesCreated++;
      }
    }

    // Audit log (fire-and-forget — seed often runs without a real session)
    audit({
      userId: session?.user?.id || "seed-script",
      email: session?.user?.email || "seed@system",
      role: session?.user?.role || "SYSTEM",
      campus: null,
      action: "seed.run",
      target: "database",
      detail: JSON.stringify({ adminsCreated: results.length, coursesCreated }),
    });

    return NextResponse.json({ data: results, coursesCreated }, { status: 201 });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
