"use client";

import { motion } from "framer-motion";
import {
  FaUser, FaBox, FaArrowRight, FaClock,
  FaCheckCircle, FaTruck, FaBoxOpen, FaTimesCircle, FaUndo,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

const statusMeta = {
  pending:   { label: "Pending",   cls: "status-pending" },
  confirmed: { label: "Confirmed", cls: "status-confirmed" },
  shipped:   { label: "Shipped",   cls: "status-shipped" },
  delivered: { label: "Delivered", cls: "status-delivered" },
  cancelled: { label: "Cancelled", cls: "status-cancelled" },
};

// [v1.0.5] refund badge — full 5-step lifecycle
const refundMeta = {
  requested:        { label: "Refund Req.",    cls: "status-pending"   },
  approved:         { label: "Return Product", cls: "status-confirmed" },
  product_received: { label: "Prod. Received", cls: "status-shipped"   },
  money_refunded:   { label: "Refunded ✓",      cls: "status-delivered" },
  rejected:         { label: "Ref. Rejected",  cls: "status-cancelled" },
};

export default function OrderCard({ order, index, email }) {
  const router = useRouter();
  const meta       = statusMeta[order.status] || statusMeta.pending;
  const refund     = order.refund?.status && order.refund.status !== "none"
                       ? refundMeta[order.refund.status]
                       : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="bg-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-default"
      style={{ border: `1px solid ${
        refund?.cls === "status-pending"   ? "#fbbf24" :   // requested  → amber
        refund?.cls === "status-confirmed" ? "#93c5fd" :   // approved   → blue
        refund?.cls === "status-shipped"   ? "#c4b5fd" :   // prod_rcvd  → purple
        "var(--border)"
      }`, boxShadow: "var(--shadow-sm)" }}
    >
      {/* Left — user + item count */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div
          onClick={(e) => {
            if (email) return;
            e.stopPropagation();
            router.push(`/users/${order.userId?._id}`);
          }}
          className="flex items-center gap-2 text-[13px] font-medium truncate"
          style={{ color: email ? "var(--text)" : "var(--accent)", cursor: email ? "default" : "pointer" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#eff6ff" }}
          >
            <FaUser size={10} style={{ color: "var(--accent)" }} />
          </div>
          <span className="truncate">{order?.userId?.email || email || "Unknown user"}</span>
        </div>

        <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "#f0fdf4" }}
          >
            <FaBox size={9} style={{ color: "#15803d" }} />
          </div>
          {order.items?.length || 0} items
        </div>

        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-subtle)" }}>
          <FaClock size={9} />
          {new Date(order.createdAt).toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
          })}
        </div>
      </div>

      {/* Right — status + refund badge + price + link */}
      <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-2">
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* [v1.0.4] Refund badge — shown when a refund exists */}
          {refund && (
            <span className={`status-badge ${refund.cls} flex items-center gap-1`}>
              <FaUndo size={8} />{refund.label}
            </span>
          )}
          <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
        </div>

        <button
          onClick={() => router.push(`/orders/${order._id}`)}
          className="d-btn d-btn-outline text-[12px] px-3 py-1.5 gap-1"
        >
          <span className="font-semibold">{order.totalPrice?.toLocaleString()}</span>
          <FaArrowRight size={9} />
        </button>
      </div>
    </motion.div>
  );
}
