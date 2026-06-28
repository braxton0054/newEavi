/**
 * Education Qualification Options
 * Used across all application forms, admin panels, and reports.
 * These are NOT hard-coded in UI — import from here.
 */
export const EDUCATION_QUALIFICATIONS = [
  // KCSE Grades (ordered highest to lowest)
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "E",
  // Non-KCSE Entry Qualifications
  "Birth Certificate",
  "National ID",
  "Passport",
  "KCPE Certificate",
  "Other",
] as const;

export type EducationQualification = (typeof EDUCATION_QUALIFICATIONS)[number];

/**
 * Grade ranking for comparison purposes.
 * Higher number = higher qualification level.
 * Non-KCSE qualifications are treated as below D- for ranking,
 * but each has special handling in validation.
 */
export const GRADE_RANK: Record<string, number> = {
  A: 13,
  "A-": 12,
  "B+": 11,
  B: 10,
  "B-": 9,
  "C+": 8,
  C: 7,
  "C-": 6,
  "D+": 5,
  D: 4,
  "D-": 3,
  E: 2,
  "KCPE Certificate": 1,
  "Birth Certificate": 0,
  "National ID": 0,
  Passport: 0,
  Other: 0,
};

/**
 * Check if a qualification meets or exceeds a minimum requirement.
 * Returns true if applicantQualification >= minRequired.
 */
export function meetsQualification(
  applicantQualification: string,
  minRequired: string | null
): boolean {
  if (!minRequired) return true; // No minimum required
  const applicantRank = GRADE_RANK[applicantQualification] ?? 0;
  const requiredRank = GRADE_RANK[minRequired] ?? 0;
  return applicantRank >= requiredRank;
}
