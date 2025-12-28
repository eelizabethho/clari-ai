"use client";

import Link from "next/link";
import BlurText from "@/components/BlurText";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/claribackground.png')" }}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" />

      {/* content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto text-center px-6">
        
        <BlurText
          text="Clariティ"
          animateBy="letters"
          delay={70}
          direction="top"
          className="text-6xl sm:text-8xl font-bold tracking-wide text-[#2271B1] mx-auto justify-center"
        />

        <p className="mt-6 text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto">
          An intelligent interview companion that helps you practice, reflect,
          and improve through real-time feedback.
        </p>

        <div className="mt-10 flex justify-center">
        <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/interview")}
        className="inline-flex items-center justify-center rounded-full bg-[#2271B1] px-10 py-4 text-white font-medium shadow-md transition-all duration-300 ease-out hover:opacity-90"
      >
        Start Interview
      </motion.button>
    </div>

        <p className="mt-6 text-sm text-slate-500 text-center">
          Text or voice • Structured feedback • Progress dashboard
        </p>
      </div>
    </main>
  );
}
