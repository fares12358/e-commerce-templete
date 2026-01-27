"use client";

import { motion } from "framer-motion";

export default function StatCard({ title, value, icon, color, index = 0 }) {
  return (
    <motion.div
      initial={{ y: 30 }}
      animate={{ y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1, // each card appears after the previous
        ease: "easeInOut",
      }}
      className="bg-white shadow-sm hover:scale-105 transition-all duration-300 ease-in-out rounded-md p-4 relative">
      <motion.div
        className={`bg-gradient-to-br ${color} shadow-md text-white rotate-12 md:w-20 w-16 h-16 md:h-20 flex items-center justify-center rounded-xl -translate-y-5 -translate-x-5`}
        animate={{
          rotate: [12, 20, 0, 20, 0, 12],
          x: [-20, -20],
          y: [-20, -20]
        }}
        transition={{
          delay: 1,
          duration: 1,
          repeat: Infinity,
          repeatDelay: 5,
          ease: "easeInOut",
        }}
      >
        <span className="-rotate-12 text-2xl">
          {icon}
        </span>
      </motion.div>

      <p className="text-md text-gray-800 font-semibold">{title}</p>
      <p className="mt-2 text-2xl font-medium text-black">{value}</p>
    </motion.div>
  );
}
