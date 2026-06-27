import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex flex-col items-center gap-8 text-center px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
          EAVI COLLEGE Admission Portal
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            href="/apply"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Apply Now
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </main>
    </div>
  );
}
