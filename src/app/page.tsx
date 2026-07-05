"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";

export default function Home() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);

  const LONG_PRESS_MS = 1200;
  const PROGRESS_STEP_MS = 12; // ~100 ticks over 1200ms

  const startPress = useCallback(() => {
    setPressing(true);
    setProgress(0);

    // Progress animation
    let p = 0;
    progressRef.current = setInterval(() => {
      p += 1;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        if (progressRef.current) clearInterval(progressRef.current);
      }
    }, PROGRESS_STEP_MS);

    // Navigate after hold duration
    timerRef.current = setTimeout(() => {
      if (progressRef.current) clearInterval(progressRef.current);
      setPressing(false);
      setProgress(0);
      router.push("/login");
    }, LONG_PRESS_MS);
  }, [router]);

  const clearPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
    setPressing(false);
    setProgress(0);
  }, []);

  // Keyboard hold support
  const keyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [keyPressing, setKeyPressing] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      setKeyPressing(true);
      let p = 0;
      keyProgressRef.current = setInterval(() => {
        p += 1;
        setProgress(Math.min(p, 100));
      }, PROGRESS_STEP_MS);
      keyTimerRef.current = setTimeout(() => {
        if (keyProgressRef.current) clearInterval(keyProgressRef.current);
        setKeyPressing(false);
        setProgress(0);
        router.push("/login");
      }, LONG_PRESS_MS);
    },
    [router],
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      if (keyTimerRef.current) {
        clearTimeout(keyTimerRef.current);
        keyTimerRef.current = null;
      }
      if (keyProgressRef.current) {
        clearInterval(keyProgressRef.current);
        keyProgressRef.current = null;
      }
      setKeyPressing(false);
      setProgress(0);
    },
    [],
  );

  // SVG ring dimensions
  const ringRadius = 44;
  const ringStroke = 3;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const dashOffset = ringCircumference - (progress / 100) * ringCircumference;

  const isActive = pressing || keyPressing;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950 flex flex-col">
      <header className="bg-white dark:bg-zinc-950 border-b-2 border-[#d81e6f]/20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col items-center text-center">
          {/* Logo — long-press target */}
          <div
            className="relative"
            onMouseDown={startPress}
            onMouseUp={clearPress}
            onMouseLeave={clearPress}
            onTouchStart={(e) => {
              e.preventDefault();
              startPress();
            }}
            onTouchEnd={clearPress}
            onTouchCancel={clearPress}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            tabIndex={0}
            role="button"
            aria-label="College logo. Long-press for admin access."
          >
            {/* Progress ring */}
            <svg
              className={`absolute -inset-2 pointer-events-none transition-opacity duration-200 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
              width={isActive ? ringRadius * 2 + ringStroke * 2 + 8 : 0}
              height={isActive ? ringRadius * 2 + ringStroke * 2 + 8 : 0}
              viewBox={`0 0 ${ringRadius * 2 + ringStroke * 2 + 8} ${ringRadius * 2 + ringStroke * 2 + 8}`}
              style={{ overflow: "visible" }}
            >
              <circle
                cx={ringRadius + ringStroke / 2 + 4}
                cy={ringRadius + ringStroke / 2 + 4}
                r={ringRadius}
                fill="none"
                stroke="rgba(216, 30, 111, 0.15)"
                strokeWidth={ringStroke}
              />
              <circle
                cx={ringRadius + ringStroke / 2 + 4}
                cy={ringRadius + ringStroke / 2 + 4}
                r={ringRadius}
                fill="none"
                stroke="#d81e6f"
                strokeWidth={ringStroke}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${ringRadius + ringStroke / 2 + 4} ${ringRadius + ringStroke / 2 + 4})`}
                className="transition-[stroke-dashoffset] duration-75 ease-linear"
              />
            </svg>

            {/* Logo image */}
            <div
              className={`w-20 sm:w-24 aspect-square relative mx-auto mb-3 transition-transform duration-200 ${
                isActive ? "scale-95" : "scale-100"
              }`}
            >
              <Image
                src="/images/eavi-logo.jpg"
                alt="East Africa Vision Institute Logo"
                fill
                className="shadow-lg object-cover ring-2 ring-[#d81e6f]/10"
                priority
              />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1a3d63] tracking-wide">
            EAST AFRICA VISION INSTITUTE
          </h1>
          <div className="mt-3 bg-[#d81e6f] px-5 py-1.5 rounded-sm">
            <span className="text-white text-xs sm:text-sm font-semibold tracking-wider uppercase">
              Leading the Leaders
            </span>
          </div>
          <p className="mt-2 text-sm text-[#1a3d63]/70 dark:text-zinc-400 italic font-medium">
            Nurturing quality and affordable education
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Apply Now button first — the primary action */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/apply"
              className="rounded-lg bg-[#d81e6f] px-6 py-3 font-semibold text-white hover:bg-[#b8185e] transition-colors text-center shadow-sm"
            >
              Apply Now
            </Link>
          </div>

          {/* Welcome text below the button */}
          <p className="text-gray-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
            Welcome to the EAVI College Admission Portal. Apply for admission,
            check your application status, and manage your academic journey.
          </p>
        </div>
      </main>

      <footer className="bg-[#1a3d63] text-white">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center text-sm space-y-1">
          <p className="font-semibold tracking-wide">EAST AFRICA VISION INSTITUTE</p>
          <div className="w-8 h-0.5 bg-[#d81e6f] mx-auto my-3 rounded-full" />
          <p className="text-gray-300">Main Campus — Eldoret · West Campus — Eldoret</p>
          <p className="text-gray-300">Main: 0726022044 | West: 0748022044 | Email: admissions@eavicollege.ac.ke</p>
          <p className="text-gray-400 text-xs mt-4">&copy; {new Date().getFullYear()} EAVI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
