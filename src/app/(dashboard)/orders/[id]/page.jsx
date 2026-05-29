"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  getOrderById, updateOrderStatus, cancelOrderAdmin,
  approveRefund, rejectRefund,
  markProductReceived, markMoneyRefunded,
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import {
  FaUser, FaWhatsapp, FaTruck, FaTimesCircle, FaArrowLeft,
  FaMapMarkerAlt, FaClock, FaCheckCircle, FaBoxOpen, FaDollarSign,
  FaCopy, FaLink, FaPhone, FaLocationArrow, FaBox, FaUndo,
  FaMoneyBillWave, FaShippingFast,
} from "react-icons/fa";
import Link from "next/link";

/* ─── order status helpers ─────────────────────────────── */
const STATUS_FLOW = { pending: "confirmed", confirmed: "shipped", shipped: "delivered" };

const statusMeta = {
  pending:   { cls: "status-pending",   label: "Pending" },
  confirmed: { cls: "status-confirmed", label: "Confirmed" },
  shipped:   { cls: "status-shipped",   label: "Shipped" },
  delivered: { cls: "status-delivered", label: "Delivered" },
  cancelled: { cls: "status-cancelled", label: "Cancelled" },
};

const nextBtnStyle = {
  confirmed: { bg: "#dbeafe", color: "#1d4ed8" },
  shipped:   { bg: "#ede9fe", color: "#6d28d9" },
  delivered: { bg: "#dcfce7", color: "#15803d" },
};

/* ─── refund step config ───────────────────────────────────
   Full lifecycle:
   none → requested → approved → product_received → money_refunded
                    ↘ rejected  (terminal)
──────────────────────────────────────────────────────────── */
const REFUND_STEPS = [
  { key: "requested",        label: "Requested",         color: "#b45309", bg: "#fef3c7", border: "#fbbf24" },
  { key: "approved",         label: "Approved",          color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd" },
  { key: "product_received", label: "Product Received",  color: "#6d28d9", bg: "#ede9fe", border: "#c4b5fd" },
  { key: "money_refunded",   label: "Money Refunded ✓",  color: "#15803d", bg: "#dcfce7", border: "#4ade80" },
];

const REFUND_STEP_IDX = Object.fromEntries(REFUND_STEPS.map((s, i) => [s.key, i]));

/* ─── small reusable components ─────────────────────────── */
function RefundStepTracker({ status }) {
  const currentIdx = REFUND_STEP_IDX[status] ?? -1;
  if (status === "rejected" || currentIdx < 0) return null;
  return (
    <div className="flex items-center gap-0 w-full mb-4 overflow-x-auto pb-1">
      {REFUND_STEPS.map((step, i) => {
        const done   = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all"
                style={done
                  ? { background: step.bg, border: `2px solid ${step.border}`, color: step.color }
                  : { background: "#f1f5f9", border: "2px solid #e2e8f0", color: "#94a3b8" }}
              >
                {done ? (i < currentIdx ? "✓" : i + 1) : i + 1}
              </div>
              <span className="text-[10px] mt-1 text-center leading-tight"
                style={{ color: done ? step.color : "#94a3b8", fontWeight: active ? 700 : 400 }}>
                {step.label}
              </span>
            </div>
            {i < REFUND_STEPS.length - 1 && (
              <div className="h-[2px] flex-1 mx-1 mt-[-14px] transition-colors"
                style={{ background: i < currentIdx ? "#4ade80" : "#e2e8f0" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 text-[13px]">
      <span className="text-slate-400 w-36 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  );
}

/* ─── main page ────────────────────────────────────────── */
export default function OrderDetailsPage() {
  const { id } = useParams();
  const router  = useRouter();

  const [order,         setOrder]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [message,       setMessage]       = useState("");
  const [resetStock,    setResetStock]    = useState(true);

  /* refund panel */
  const [refundNote,          setRefundNote]          = useState("");
  const [refundRestoreStock,  setRefundRestoreStock]  = useState(false);
  const [refundActionLoading, setRefundActionLoading] = useState(false);
  const [refundedAmount,      setRefundedAmount]      = useState(""); // [v1.0.7]

  /* ── fetch ── */
  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await getOrderById(id);
      if (res.success) setOrder(res.data);
    } catch { toast.error("Failed to load order"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrder(); }, []);

  /* ── derived ── */
  const nextStatus = STATUS_FLOW[order?.status];
  const meta       = statusMeta[order?.status] || statusMeta.pending;
  const nextStyle  = nextBtnStyle[nextStatus];

  /* build WhatsApp message */
  useEffect(() => {
    if (!order?.location?.phone) return;
    const itemsText = order.items.map(item =>
      `• ${item.name}\n  الكمية: ${item.quantity}\n  السعر: ${item.price.toLocaleString()}\n  الإجمالي: ${(item.price * item.quantity).toLocaleString()}`
    ).join("\n\n");
    setMessage(
      `مرحباً 👋\n\nبنأكد مع حضرتك بيانات الطلب رقم:\n#${order.orderNumber}\n\n` +
      `━━━━━━━━━━━━\n🛒 تفاصيل الطلب:\n━━━━━━━━━━━━\n\n${itemsText}\n\n` +
      `💰 إجمالي الطلب: ${order.totalPrice.toLocaleString()}\n` +
      `💳 طريقة الدفع: ${order.paymentMethod}\n\n` +
      `📍 عنوان التوصيل:\n` +
      `المحافظة: ${order.location.government}\n` +
      `المدينة: ${order.location.city}\n` +
      `شارع: ${order.location.strName}\n` +
      `تفاصيل: ${order.location.locationDescription}\n` +
      `📞 ${order.location.phone}\n\n` +
      `━━━━━━━━━━━━\nبرجاء تأكيد الطلب للبدء في التجهيز 🚚✨`
    );
  }, [order]);

  /* ── action handlers ── */
  const handleConfirmAction = async () => {
    try {
      setActionLoading(true);
      if (confirmAction.type === "status") {
        await updateOrderStatus(order._id, nextStatus);
        toast.success("Order updated");
      }
      if (confirmAction.type === "cancel") {
        await cancelOrderAdmin(order._id, { reset: resetStock });
        toast.success("Order cancelled");
      }
      fetchOrder();
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(false); setConfirmAction(null); }
  };

  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); toast.success("Copied!"); }
    catch { toast.error("Copy failed"); }
  };

  /* generic refund action with loading/error/refresh */
  const doRefundAction = async (fn, successMsg) => {
    try {
      setRefundActionLoading(true);
      await fn();
      toast.success(successMsg);
      setRefundNote("");
      setRefundRestoreStock(false);
      setRefundedAmount(""); // [v1.0.7]
      fetchOrder();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setRefundActionLoading(false);
    }
  };

  /* ── loading / empty ── */
  if (loading) return (
    <div className="flex justify-center items-center py-20 h-full w-full"><Loader /></div>
  );
  if (!order) return (
    <div className="flex justify-center items-center py-20">
      <p className="text-slate-400">Order not found</p>
    </div>
  );

  const refundStatus = order.refund?.status || "none";
  const hasRefund    = refundStatus !== "none";

  return (
    <div className="space-y-4 max-w-3xl">

      {/* Back */}
      <button onClick={() => router.back()} className="d-btn d-btn-outline gap-2 mb-2">
        <FaArrowLeft size={11} /> Back
      </button>

      {/* ── Order header ── */}
      <div className="d-card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-label">Order</p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => copyText(order.orderNumber)}
              className="d-btn-ghost p-1 rounded cursor-pointer border-none bg-transparent"
              title="Copy order number"
            >
              <FaCopy size={11} style={{ color: "var(--accent)" }} />
            </button>
            <span className="font-semibold text-[15px] text-slate-900">{order.orderNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`status-badge ${meta.cls}`}>{meta.label}</span>
          {/* Show refund badge in header too */}
          {hasRefund && (
            <span className={`status-badge ${
              refundStatus === "requested"        ? "status-pending"   :
              refundStatus === "approved"         ? "status-confirmed" :
              refundStatus === "product_received" ? "status-shipped"   :
              refundStatus === "money_refunded"   ? "status-delivered" :
              "status-cancelled"
            } flex items-center gap-1`}>
              <FaUndo size={8} />
              {refundStatus === "requested"        ? "Refund Requested"        :
               refundStatus === "approved"         ? "Refund Approved"         :
               refundStatus === "product_received" ? "Product Received"        :
               refundStatus === "money_refunded"   ? "Money Refunded ✓"        :
               "Refund Rejected"}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
            <FaClock size={10} />
            {new Date(order.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
          </div>
        </div>
      </div>

      {/* ── Customer ── */}
      <div className="d-card flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
            <FaUser size={14} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            {order?.userId ? (
              <>
                <Link
                  href={`/users/${order.userId._id}`}
                  className="text-[13px] font-semibold flex items-center gap-1.5 mb-0.5"
                  style={{ color: "var(--accent)" }}
                >
                  <FaLink size={10} /> {order.userId.name}
                </Link>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{order.userId.email}</p>
              </>
            ) : (
              <p className="text-[13px] font-medium text-red-500">Deleted user</p>
            )}
            {order?.location?.phone && (
              <p className="text-[12px] mt-0.5" style={{ color: "var(--text-subtle)" }}>{order.location.phone}</p>
            )}
          </div>
        </div>
        {order?.location?.phone && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                const url = `https://wa.me/${order.location.phone}?text=${encodeURIComponent(message)}`;
                window.open(url, "_blank");
              }}
              className="d-btn gap-2"
              style={{ background: "#dcfce7", color: "#15803d", border: "none" }}
            >
              <FaWhatsapp size={13} /> WhatsApp
            </button>
            <button
              onClick={() => window.open(`tel:${order.location.phone}`)}
              className="d-btn gap-2"
              style={{ background: "#eff6ff", color: "var(--accent)", border: "none" }}
            >
              <FaPhone size={12} /> Call
            </button>
          </div>
        )}
      </div>

      {/* ── Shipping address ── */}
      {order?.location && (
        <div className="d-card space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#faf5ff" }}>
              <FaMapMarkerAlt size={11} style={{ color: "#7e22ce" }} />
            </div>
            <p className="font-semibold text-[13px] text-slate-900">Shipping Address</p>
          </div>
          <InfoRow label="Location"             value={order.location.locationDescription} />
          <InfoRow label="Country / City / Gov" value={[order.location.country, order.location.city, order.location.government].filter(Boolean).join(", ")} />
          <InfoRow label="Street"               value={order.location.strName} />
          <InfoRow label="Phone"                value={order.location.phone} />
          {order.location.locationLink && (
            <button
              onClick={() => window.open(order.location.locationLink, "_blank")}
              className="d-btn gap-1.5 text-[12px] mt-1"
              style={{ background: "#eff6ff", color: "var(--accent)", border: "none" }}
            >
              <FaLocationArrow size={10} /> Open Map
            </button>
          )}
        </div>
      )}

      {/* ── Order meta ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Payment",  icon: <FaDollarSign size={13} style={{ color: "#15803d" }} />,    val: order.paymentMethod },
          { label: "Shipping", icon: <FaTruck size={12}      style={{ color: "#6d28d9" }} />,    val: order.shippingFee || "—" },
          { label: "Total",    icon: <FaBoxOpen size={12}    style={{ color: "var(--accent)" }}/>, val: order.totalPrice?.toLocaleString() },
        ].map(({ label, icon, val }) => (
          <div key={label} className="d-card text-center py-3">
            <div className="flex justify-center mb-1">{icon}</div>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="font-bold text-[14px] text-slate-900 capitalize">{val}</p>
          </div>
        ))}
      </div>

      {/* ── Items ── */}
      <div className="d-card">
        <p className="section-label mb-3">Order Items ({order.items.length})</p>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-3 p-3 rounded-xl relative"
              style={{
                background: "#f8fafc",
                border: `1px solid ${!item.productId?._id ? "#fca5a5" : "var(--border)"}`,
              }}
            >
              {item.productId?._id && (
                <button
                  className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center cursor-pointer border-none"
                  style={{ background: "#eff6ff" }}
                  onClick={() => router.push(`/products/${item.productId._id}`)}
                  title="View product"
                >
                  <FaLink size={9} style={{ color: "var(--accent)" }} />
                </button>
              )}
              <img
                src={item.productId?.images?.[0]?.url || "/placeholder.png"}
                className="w-16 h-16 rounded-lg object-cover shrink-0"
                style={{ border: "1px solid var(--border)" }}
              />
              <div className="flex-1 pr-6 space-y-1">
                {!item.productId?._id && <p className="text-[11px] text-red-500 font-medium">Product deleted</p>}
                <p className="font-medium text-[13px] text-slate-900">{item.name}</p>
                <div className="flex flex-wrap gap-3 text-[12px]" style={{ color: "var(--text-muted)" }}>
                  <span>Price: <strong>{item.price?.toLocaleString()}</strong></span>
                  <span>Qty: <strong>{item.quantity}</strong></span>
                  <span>Total: <strong>{(item.price * item.quantity).toLocaleString()}</strong></span>
                </div>
                {item.selections?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.selections.map((s, si) => (
                      <span
                        key={si}
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "#eff6ff", color: "var(--accent)" }}
                      >
                        {s.name}: {s.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Order actions (status update / cancel) ── */}
      {order.status !== "delivered" && order.status !== "cancelled" && order?.userId && (
        <div className="flex flex-wrap gap-2">
          {nextStatus && nextStyle && (
            <button
              disabled={actionLoading}
              onClick={() => setConfirmAction({
                type: "status",
                title: "Update Status",
                message: `Change from "${order.status}" to "${nextStatus}"?`,
              })}
              className="d-btn gap-2"
              style={{ background: nextStyle.bg, color: nextStyle.color, border: "none" }}
            >
              <FaTruck size={12} /> Mark as {nextStatus}
            </button>
          )}
          <button
            disabled={actionLoading}
            onClick={() => { setResetStock(true); setConfirmAction({ type: "cancel", title: "Cancel Order", message: "Cancel this order?" }); }}
            className="d-btn d-btn-danger gap-2"
          >
            <FaTimesCircle size={12} /> Cancel Order
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          REFUND PANEL — full 5-step lifecycle
          Shown whenever refund.status !== 'none'
      ══════════════════════════════════════════════════════ */}
      {hasRefund && (
        <div
          className="d-card space-y-4"
          style={{
            borderColor:
              refundStatus === "requested"        ? "#fbbf24" :
              refundStatus === "approved"         ? "#93c5fd" :
              refundStatus === "product_received" ? "#c4b5fd" :
              refundStatus === "money_refunded"   ? "#4ade80" : "#f87171",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background:
                  refundStatus === "requested"        ? "#fef3c7" :
                  refundStatus === "approved"         ? "#dbeafe" :
                  refundStatus === "product_received" ? "#ede9fe" :
                  refundStatus === "money_refunded"   ? "#dcfce7" : "#fee2e2",
              }}
            >
              <FaUndo
                size={14}
                style={{
                  color:
                    refundStatus === "requested"        ? "#b45309" :
                    refundStatus === "approved"         ? "#1d4ed8" :
                    refundStatus === "product_received" ? "#6d28d9" :
                    refundStatus === "money_refunded"   ? "#15803d" : "#b91c1c",
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="page-title">
                {refundStatus === "requested"        ? "Refund Request — Pending Review"   :
                 refundStatus === "approved"         ? "Refund Approved — Awaiting Return" :
                 refundStatus === "product_received" ? "Product Received — Refund Money"   :
                 refundStatus === "money_refunded"   ? "Refund Complete ✓"                 :
                 "Refund Rejected"}
              </h2>
              {order.refund?.requestedAt && (
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-subtle)" }}>
                  Requested {new Date(order.refund.requestedAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
                </p>
              )}
            </div>
          </div>

          {/* Progress tracker (not shown for rejected) */}
          {refundStatus !== "rejected" && <RefundStepTracker status={refundStatus} />}

          {/* Customer reason */}
          {order.refund?.reason && (
            <div className="rounded-lg p-3" style={{ background: "#f8fafc", border: "1px solid var(--border)" }}>
              <p className="section-label mb-1">Customer Reason</p>
              <p className="text-[13px] text-slate-700 leading-relaxed">{order.refund.reason}</p>
            </div>
          )}

          {/* Admin note (any resolved step) */}
          {order.refund?.adminNote && (
            <div className="rounded-lg p-3" style={{ background: "#f8fafc", border: "1px solid var(--border)" }}>
              <p className="section-label mb-1">Admin Note</p>
              <p className="text-[13px] text-slate-700 leading-relaxed">{order.refund.adminNote}</p>
            </div>
          )}

          {/* ── STEP 1: requested → approve or reject ── */}
          {refundStatus === "requested" && (
            <div className="space-y-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Step 1 — Review Request</p>
              <div>
                <label className="section-label block mb-1.5">
                  Admin Note <span className="font-normal text-slate-400">(optional — emailed to customer)</span>
                </label>
                <textarea
                  className="d-input"
                  rows={2}
                  placeholder="e.g. We reviewed your request and will process the refund..."
                  value={refundNote}
                  onChange={e => setRefundNote(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  disabled={refundActionLoading}
                  onClick={() => doRefundAction(
                    () => approveRefund(order._id, { adminNote: refundNote.trim() }),
                    "Refund approved — customer notified to return product"
                  )}
                  className="d-btn gap-2"
                  style={{ background: "#dbeafe", color: "#1d4ed8", border: "none" }}
                >
                  {refundActionLoading ? <Loader size={13} color="#1d4ed8" /> : <FaCheckCircle size={12} />}
                  Approve — Ask to Return Product
                </button>
                <button
                  disabled={refundActionLoading}
                  onClick={() => doRefundAction(
                    () => rejectRefund(order._id, { adminNote: refundNote.trim() }),
                    "Refund rejected"
                  )}
                  className="d-btn d-btn-danger gap-2"
                >
                  {refundActionLoading ? <Loader size={13} color="#fff" /> : <FaTimesCircle size={12} />}
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: approved → mark product received ── */}
          {refundStatus === "approved" && (
            <div className="space-y-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Step 2 — Confirm Product Returned</p>
              <p className="text-[13px] text-slate-600">
                Once you physically receive the returned product from the customer, click below.
              </p>
              <div>
                <label className="section-label block mb-1.5">Admin Note <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea
                  className="d-input"
                  rows={2}
                  placeholder="e.g. Product received in good condition..."
                  value={refundNote}
                  onChange={e => setRefundNote(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={refundRestoreStock}
                  onChange={e => setRefundRestoreStock(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-[13px] text-slate-700">Restore stock when marking received</span>
              </label>
              <button
                disabled={refundActionLoading}
                onClick={() => doRefundAction(
                  () => markProductReceived(order._id, {
                    restoreStock: refundRestoreStock,
                    adminNote: refundNote.trim(),
                  }),
                  "Product received — customer notified, money refund pending"
                )}
                className="d-btn gap-2 w-fit"
                style={{ background: "#ede9fe", color: "#6d28d9", border: "none" }}
              >
                {refundActionLoading ? <Loader size={13} color="#6d28d9" /> : <FaShippingFast size={12} />}
                Mark Product Received
              </button>
            </div>
          )}

          {/* ── STEP 3: product_received → mark money refunded ── */}
          {refundStatus === "product_received" && (
            <div className="space-y-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Step 3 — Confirm Money Sent to Customer</p>
              <p className="text-[13px] text-slate-600">
                Once you have manually sent the refund to the customer, enter the exact amount sent and confirm below.
              </p>

              {/* [v1.0.7] Refund amount input — required, may be less than order total */}
              <div
                className="rounded-xl p-3 space-y-2"
                style={{ background: "#fffbeb", border: "1px solid #fbbf24" }}
              >
                <div className="flex items-center justify-between">
                  <label className="section-label" style={{ marginBottom: 0 }}>
                    Refund Amount <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px]" style={{ color: "var(--text-subtle)" }}>
                    Order total: <strong>{order.totalPrice?.toLocaleString()}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={order.totalPrice}
                  className="d-input"
                  placeholder={`Max ${order.totalPrice?.toLocaleString()}`}
                  value={refundedAmount}
                  onChange={e => setRefundedAmount(e.target.value)}
                />
                {refundedAmount && Number(refundedAmount) < order.totalPrice && (
                  <p className="text-[11px]" style={{ color: "#b45309" }}>
                    ⚠️ Partial refund — returning {Number(refundedAmount).toLocaleString()} of {order.totalPrice?.toLocaleString()} total.
                    The customer will be notified of the partial amount.
                  </p>
                )}
              </div>

              <div>
                <label className="section-label block mb-1.5">Admin Note <span className="font-normal text-slate-400">(optional — included in email)</span></label>
                <textarea
                  className="d-input"
                  rows={2}
                  placeholder="e.g. Refund of 250 EGP sent via Instapay on 31 Mar..."
                  value={refundNote}
                  onChange={e => setRefundNote(e.target.value)}
                />
              </div>

              <button
                disabled={refundActionLoading || !refundedAmount || Number(refundedAmount) <= 0}
                onClick={() => {
                  const amt = Number(refundedAmount);
                  if (!amt || amt <= 0) return toast.error("Enter the amount sent to the customer");
                  if (amt > order.totalPrice) return toast.error(`Amount cannot exceed order total (${order.totalPrice})`);
                  doRefundAction(
                    () => markMoneyRefunded(order._id, {
                      refundedAmount: amt,
                      adminNote: refundNote.trim(),
                    }),
                    `Refund of ${amt.toLocaleString()} confirmed — customer notified`
                  );
                }}
                className="d-btn gap-2 w-fit"
                style={{ background: "#dcfce7", color: "#15803d", border: "none" }}
              >
                {refundActionLoading ? <Loader size={13} color="#15803d" /> : <FaMoneyBillWave size={12} />}
                Confirm Money Refunded
              </button>
            </div>
          )}

          {/* ── TERMINAL STATES ── */}
          {refundStatus === "money_refunded" && (() => {
            const paid    = order.refund?.refundedAmount;
            const isPartial = paid !== null && paid !== undefined && paid < order.totalPrice;
            return (
              <div className="rounded-lg p-3 flex items-start gap-3" style={{ background: "#dcfce7", border: "1px solid #4ade80" }}>
                <FaCheckCircle size={16} style={{ color: "#15803d", flexShrink: 0, marginTop: 2 }} />
                <div className="space-y-0.5">
                  <p className="text-[13px] font-semibold text-green-800">Refund fully completed</p>
                  {/* Actual refunded amount [v1.0.7] */}
                  {paid !== null && paid !== undefined ? (
                    <p className="text-[12px] text-green-700">
                      Amount refunded: <strong>{Number(paid).toLocaleString()}</strong>
                      {isPartial && (
                        <span className="ml-1.5 text-[11px] font-normal" style={{ color: "#92400e" }}>
                          (partial — order total was {order.totalPrice?.toLocaleString()})
                        </span>
                      )}
                    </p>
                  ) : null}
                  {order.refund?.moneyRefundedAt && (
                    <p className="text-[11px] text-green-700">
                      Completed {new Date(order.refund.moneyRefundedAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
                    </p>
                  )}
                  {order.refund?.stockRestored && (
                    <p className="text-[11px] text-green-700">· Stock restored</p>
                  )}
                </div>
              </div>
            );
          })()}

          {refundStatus === "rejected" && (
            <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "#fee2e2", border: "1px solid #f87171" }}>
              <FaTimesCircle size={16} style={{ color: "#b91c1c", flexShrink: 0 }} />
              <div>
                <p className="text-[13px] font-semibold text-red-800">Refund request rejected</p>
                {order.refund?.resolvedAt && (
                  <p className="text-[11px] text-red-700 mt-0.5">
                    On {new Date(order.refund.resolvedAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timestamps footer */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: "var(--text-subtle)" }}>
            {order.refund?.requestedAt       && <span>Requested: {new Date(order.refund.requestedAt).toLocaleDateString("en-GB")}</span>}
            {order.refund?.productReceivedAt && <span>· Product received: {new Date(order.refund.productReceivedAt).toLocaleDateString("en-GB")}</span>}
            {order.refund?.moneyRefundedAt   && <span>· Money refunded: {new Date(order.refund.moneyRefundedAt).toLocaleDateString("en-GB")}</span>}
            {order.refund?.refundedAmount != null && (
              <span>· Amount: <strong>{Number(order.refund.refundedAmount).toLocaleString()}</strong>
                {order.refund.refundedAmount < order.totalPrice && ` (partial of ${order.totalPrice?.toLocaleString()})`}
              </span>
            )}
            {order.refund?.resolvedAt && refundStatus === "rejected" && <span>· Rejected: {new Date(order.refund.resolvedAt).toLocaleDateString("en-GB")}</span>}
          </div>
        </div>
      )}

      {/* ── Confirm modal ── */}
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        loading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        showResetOption={confirmAction?.type === "cancel"}
        resetValue={resetStock}
        setResetValue={setResetStock}
      />
    </div>
  );
}
