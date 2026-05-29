"use client";

import { motion, AnimatePresence } from "framer-motion";
import Loader from "./Loader";

export default function ConfirmModal({
  open,
  title = "Confirm action",
  message,
  onConfirm,
  onCancel,
  loading = false,
  showResetOption = false,
  resetValue,
  setResetValue,
}) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
          style={{ border: "1px solid var(--border)" }}
        >
          <h3 className="text-[15px] font-semibold text-slate-900 mb-1.5">{title}</h3>
          <p className="text-[13px] text-slate-500 mb-5">{message}</p>

          {showResetOption && (
            <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={resetValue}
                onChange={(e) => setResetValue(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-[13px] text-slate-600">
                Reset stock (return products to inventory)
              </span>
            </label>
          )}

          <div className="flex gap-2.5 justify-end">
            <button
              disabled={loading}
              onClick={onCancel}
              className="d-btn d-btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="d-btn d-btn-danger"
            >
              {loading && <Loader size={14} color="#fff" />}
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
