// app/not-found.tsx
"use client";

import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6 font-[family-name:var(--font-alexandria)]">
        <div className="relative animate-fade-in">
          <div className="w-40 h-40 mx-auto rounded-full bg-[#5187f6] bg-opacity-10 flex items-center justify-center">
            <span className="text-white text-7xl font-bold">404</span>
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#5187f6]">Page Not Found</h1>
        <p className="text-sm md:text-base text-gray-600">
          Sorry, the page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link href="/">
          <button className="mt-2 inline-flex items-center cursor-pointer px-5 py-2.5 text-sm font-semibold text-white bg-[#5187f6] rounded-lg shadow hover:bg-[#3d6ee6] transition duration-300">
            <FaArrowLeft className="mr-2" /> Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
