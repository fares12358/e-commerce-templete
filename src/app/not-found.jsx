"use client";

import { useRouter } from "next/navigation";
import { FaExclamationTriangle, FaHome } from "react-icons/fa";
import { motion } from "framer-motion";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-lg rounded-xl p-10 max-w-md"
      >
        <FaExclamationTriangle className="text-red-500 mx-auto mb-4" size={50} />

        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-gray-600 mb-6">
          Oops! The page you’re looking for doesn’t exist.
        </p>

        <button
          onClick={() => router.push("/")}
          className="bg-gradient-to-br from-black to-black/70 text-white px-6 py-3 rounded-md hover:-translate-y-1 transition duration-300 ease-in-out"
        >
          <FaHome className="inline mr-2" /> Go Home
        </button>
      </motion.div>

    </div>
  );
}
