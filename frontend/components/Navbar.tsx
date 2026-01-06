"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/60 border-b border-white/30 shadow-lg shadow-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-[#2271B1] drop-shadow-sm">
              Clari AI
            </Link>
            <div className="hidden md:flex gap-2">
              <Link
                href="/interview"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive("/interview")
                    ? "text-[#2271B1] bg-white/50 backdrop-blur-sm shadow-sm"
                    : "text-gray-700 hover:text-[#2271B1] hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                Upload
              </Link>
              <Link
                href="/interview/history"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive("/interview/history")
                    ? "text-[#2271B1] bg-white/50 backdrop-blur-sm shadow-sm"
                    : "text-gray-700 hover:text-[#2271B1] hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                History
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <span className="text-sm text-gray-700 hidden sm:inline font-medium">
                  {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors font-medium rounded-lg hover:bg-white/30 backdrop-blur-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-[#2271B1] text-white rounded-lg hover:bg-[#1a5a8a] transition-all shadow-md hover:shadow-lg text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

