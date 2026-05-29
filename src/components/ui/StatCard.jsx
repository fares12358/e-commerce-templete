"use client";

import { motion, AnimatePresence } from "framer-motion";
import Loader from "./Loader";

export default function StatCard({ title, value, icon, color, index = 0 }) {
  // Map gradient string to a single accent color for the icon bg
  const colorMap = {
    "from-blue-800 to-blue-400":     { bg: "#eff6ff", color: "#2563eb" },
    "from-fuchsia-800 to-fuchsia-400": { bg: "#fdf4ff", color: "#a21caf" },
    "from-pink-800 to-pink-400":     { bg: "#fff0f3", color: "#e11d48" },
    "from-teal-800 to-teal-400":     { bg: "#f0fdf4", color: "#0f766e" },
    "from-gray-700 to-gray-400":     { bg: "#f8fafc", color: "#475569" },
    "from-yellow-700 to-yellow-400": { bg: "#fefce8", color: "#a16207" },
    "from-blue-700 to-blue-400":     { bg: "#eff6ff", color: "#1d4ed8" },
    "from-fuchsia-700 to-fuchsia-400": { bg: "#fdf4ff", color: "#a21caf" },
    "from-green-700 to-green-400":   { bg: "#f0fdf4", color: "#15803d" },
    "from-rose-700 to-rose-400":     { bg: "#fff1f2", color: "#be123c" },
    "from-purple-700 to-purple-400": { bg: "#faf5ff", color: "#7e22ce" },
    "from-amber-700 to-amber-400":   { bg: "#fffbeb", color: "#b45309" },
  };

  const scheme = colorMap[color] || { bg: "#f0f9ff", color: "#0369a1" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      className="stat-card"
    >
      <div
        className="stat-icon"
        style={{ background: scheme.bg, color: scheme.color }}
      >
        <span style={{ color: scheme.color }}>{icon}</span>
      </div>
      <div className="stat-value">{value ?? 0}</div>
      <div className="stat-label">{title}</div>
    </motion.div>
  );
}
