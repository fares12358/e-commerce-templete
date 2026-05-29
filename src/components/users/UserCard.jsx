"use client";

import { motion } from "framer-motion";
import Loader from "@/components/ui/Loader";
import { FaLink, FaExternalLinkAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";

const statColors = {
  Orders:    { bg: "#f8fafc", color: "#475569" },
  Pending:   { bg: "#fefce8", color: "#a16207" },
  Confirmed: { bg: "#eff6ff", color: "#1d4ed8" },
  Shipped:   { bg: "#faf5ff", color: "#7e22ce" },
  Delivered: { bg: "#f0fdf4", color: "#15803d" },
  Cancelled: { bg: "#fff1f2", color: "#be123c" },
};

export default function UserCard({ user, onToggle, loading }) {
  const router = useRouter();
  const s = user.orderStats;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 relative"
      style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      {/* Link */}
      <button
        onClick={() => router.push(`/users/${user._id}`)}
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer border-none"
        style={{ background: "#eff6ff", color: "var(--accent)" }}
        title="View user"
      >
        <FaExternalLinkAlt size={10} />
      </button>

      {/* Header */}
      <div className="pr-8 mb-3">
        <div className="font-semibold text-[14px] text-slate-900 truncate">{user.name}</div>
        <div className="text-[12px] text-slate-500 truncate">{user.email}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Joined {new Date(user.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
        </div>
      </div>

      {/* Status + toggle */}
      <div className="flex items-center justify-between mb-3">
        <span className={`status-badge ${user.isActive ? "status-active" : "status-suspended"}`}>
          {user.isActive ? "Active" : "Suspended"}
        </span>
        <button
          onClick={() => onToggle(user)}
          disabled={loading}
          className="d-btn text-[12px] px-3 py-1.5"
          style={{
            background: user.isActive ? "#fee2e2" : "#dcfce7",
            color: user.isActive ? "#b91c1c" : "#15803d",
            border: "none",
          }}
        >
          {loading
            ? <Loader size={14} color={user.isActive ? "#b91c1c" : "#15803d"} />
            : user.isActive ? "Suspend" : "Activate"}
        </button>
      </div>

      {/* Order stats */}
      <div className="grid grid-cols-3 gap-1.5">
        {["Orders","Pending","Confirmed","Shipped","Delivered","Cancelled"].map(label => {
          const keyMap = {
            Orders:"total", Pending:"pending", Confirmed:"confirmed",
            Shipped:"shipped", Delivered:"delivered", Cancelled:"cancelled"
          };
          const scheme = statColors[label];
          return (
            <div
              key={label}
              className="rounded-lg px-2 py-2 text-center"
              style={{ background: scheme.bg }}
            >
              <div className="text-[13px] font-bold" style={{ color: scheme.color }}>
                {s?.[keyMap[label]] ?? 0}
              </div>
              <div className="text-[10px] font-medium" style={{ color: scheme.color, opacity: 0.8 }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
