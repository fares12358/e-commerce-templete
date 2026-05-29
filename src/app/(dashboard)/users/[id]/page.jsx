"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { deleteUserAccount, getUserDetails } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import StatCard from "@/components/ui/StatCard";
import OrderCard from "@/components/orders/OrderCard";
import { toast } from "react-toastify";
import { FaUser, FaEnvelope, FaCalendarAlt, FaBoxOpen, FaClock, FaCheckCircle, FaTruck, FaTimesCircle, FaArrowLeft, FaSync, FaTrash } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { motion } from "framer-motion";

const getVisiblePages = (current, total) => {
  const delta = 1;
  const range = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) range.push(i);
  if (current - delta > 2) range.unshift("...");
  if (current + delta < total - 1) range.push("...");
  const pages = [1, ...range];
  if (total > 1) pages.push(total);
  return pages;
};

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { userOrdersCache, setUserOrdersCache } = useAuth();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUser = async () => {
    try {
      if (!userOrdersCache[id]?.[page] && !refreshing) setLoading(true);
      if (userOrdersCache[id]?.[page]) { setData(userOrdersCache[id][page]); setLoading(false); return; }
      const res = await getUserDetails(id, page);
      if (res.success) {
        setData(res.data);
        setUserOrdersCache(prev => ({ ...prev, [id]: { ...prev[id], [page]: res.data } }));
      }
    } catch { toast.error("Failed to load user"); setData(null); }
    finally { if (!refreshing) setLoading(false); }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setUserOrdersCache({});
    try { await fetchUser(); toast.success("Refreshed"); }
    finally { setRefreshing(false); }
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const res = await deleteUserAccount(id);
      if (res.success) { toast.success(res.message); setDeleteModalOpen(false); router.push("/users"); }
    } catch (err) { toast.error(err.message); }
    finally { setDeleteLoading(false); }
  };

  useEffect(() => { fetchUser(); }, [page]);

  if (loading && !refreshing) return <div className="flex justify-center items-center py-20 w-full h-screen"><Loader /></div>;
  if (!data) return <div className="d-empty">User not found</div>;

  const { user, orders, stats, pagination } = data;

  return (
    <div className="space-y-5">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => router.back()} className="d-btn d-btn-outline gap-2">
          <FaArrowLeft size={11} /> Back
        </button>
        <div className="flex gap-2">
          <button onClick={() => setDeleteModalOpen(true)} className="d-btn d-btn-danger gap-1.5 text-[12px]">
            <FaTrash size={10} /> Delete Account
          </button>
          <button onClick={handleRefresh} disabled={refreshing} className="d-btn d-btn-outline gap-1.5" title="Refresh">
            <FaSync size={11} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="d-card flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
            <FaUser size={14} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="font-semibold text-[14px] text-slate-900">{user.name}</p>
            <p className="text-[12px] flex items-center gap-1.5 mt-0.5" style={{ color: "var(--text-muted)" }}>
              <FaEnvelope size={10} /> {user.email}
            </p>
            <p className="text-[11px] flex items-center gap-1.5 mt-0.5" style={{ color: "var(--text-subtle)" }}>
              <FaCalendarAlt size={9} /> Joined {new Date(user.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}
            </p>
          </div>
        </div>
        <span className={`status-badge ${user.isActive ? "status-active" : "status-suspended"}`}>
          {user.isActive ? "Active" : "Suspended"}
        </span>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard title="Total"     value={stats.total}     icon={<FaBoxOpen size={14}/>}     color="from-gray-700 to-gray-400" />
        <StatCard title="Pending"   value={stats.pending}   icon={<FaClock size={14}/>}       color="from-yellow-700 to-yellow-400" />
        <StatCard title="Confirmed" value={stats.confirmed} icon={<FaCheckCircle size={14}/>} color="from-blue-700 to-blue-400" />
        <StatCard title="Shipped"   value={stats.shipped}   icon={<FaTruck size={14}/>}       color="from-fuchsia-700 to-fuchsia-400" />
        <StatCard title="Delivered" value={stats.delivered} icon={<FaBoxOpen size={14}/>}     color="from-green-700 to-green-400" />
        <StatCard title="Cancelled" value={stats.cancelled} icon={<FaTimesCircle size={14}/>} color="from-rose-700 to-rose-400" />
      </div>

      {/* Orders */}
      {!orders.length ? (
        <div className="d-empty">No orders yet</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {orders.map((order, i) => <OrderCard key={order._id} order={order} email={user.email} index={i} />)}
        </div>
      )}

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <div className="flex justify-center flex-wrap gap-1.5">
          <button disabled={pagination.page === 1} onClick={() => setPage(pagination.page - 1)} className="d-page-btn">Prev</button>
          {getVisiblePages(pagination.page, pagination.totalPages).map((p, i) =>
            p === "..." ? <span key={i} className="d-page-btn border-none">…</span> :
            <button key={i} onClick={() => setPage(p)} className={`d-page-btn ${p === pagination.page ? "active" : ""}`}>{p}</button>
          )}
          <button disabled={pagination.page === pagination.totalPages} onClick={() => setPage(pagination.page + 1)} className="d-page-btn">Next</button>
        </div>
      )}

      <ConfirmModal
        open={deleteModalOpen}
        loading={deleteLoading}
        title="Delete Account"
        message="Are you sure you want to permanently delete this account? This cannot be undone."
        onCancel={() => { if (!deleteLoading) setDeleteModalOpen(false); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
