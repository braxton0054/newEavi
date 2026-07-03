import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b-4 border-[#d81e6f] shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col items-center text-center">
          <div className="w-16 sm:w-20 md:w-24 aspect-square relative mx-auto mb-3">
            <Image
              src="/images/eavi-logo.jpg"
              alt="East Africa Vision Institute Logo"
              fill
              className="rounded-full shadow-md object-cover"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1a3d63] tracking-wide">
            EAST AFRICA VISION INSTITUTE
          </h1>
          <div className="mt-2 bg-[#2d8a4e] px-4 py-1 rounded-sm">
            <span className="text-white text-xs sm:text-sm font-semibold tracking-wider uppercase">
              Leading the Leaders
            </span>
          </div>
          <p className="mt-2 text-sm text-[#d81e6f] italic font-medium">
            Nurturing quality and affordable education
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full text-center space-y-6">
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Welcome to the EAVI College Admission Portal. Apply for admission,
            check your application status, and manage your academic journey.
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-left space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Our Campuses</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium text-gray-800">Main Campus</span> — Eldoret</p>
              <p><span className="font-medium text-gray-800">West Campus</span> — Eldoret</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/apply"
              className="rounded-lg bg-[#2d8a4e] px-6 py-3 font-semibold text-white hover:bg-[#236d3c] transition-colors text-center"
            >
              Apply Now
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-center"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-[#1a3d63] text-white">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center text-sm space-y-1">
          <p className="font-semibold">East Africa Vision Institute</p>
          <p className="text-gray-300">Main Campus — Eldoret | West Campus — Eldoret</p>
          <p className="text-gray-300">Phone: +254 700 000 000 | Email: admissions@eavicollege.ac.ke</p>
          <p className="text-gray-400 text-xs mt-2">&copy; {new Date().getFullYear()} EAVI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
