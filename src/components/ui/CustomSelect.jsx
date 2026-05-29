"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";

export default function CustomSelect({ value, options, onChange, placeholder, className = "" }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className={`relative min-w-[160px] w-fit ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border px-3 py-2 rounded-lg bg-white flex items-center justify-between gap-2 text-[13px] transition-all duration-150 cursor-pointer"
        style={{
          borderColor: open ? "var(--accent)" : "var(--border)",
          boxShadow: open ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
          color: selected ? "var(--text)" : "var(--text-subtle)",
        }}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <FaChevronDown
          size={10}
          className="shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "var(--text-subtle)" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto"
              style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
            >
              {options.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="px-3 py-2 text-[13px] cursor-pointer transition-colors duration-100"
                  style={{
                    background: opt.value === value ? "#eff6ff" : "transparent",
                    color: opt.value === value ? "var(--accent)" : "var(--text)",
                    fontWeight: opt.value === value ? 500 : 400,
                  }}
                  onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = "transparent"; }}
                >
                  {opt.label}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
