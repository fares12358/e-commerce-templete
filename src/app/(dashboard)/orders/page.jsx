"use client";

import { useEffect, useState } from "react";
import { getOrders, getOrderStats } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import StatCard from "@/components/ui/StatCard";
import OrderCard from "@/components/orders/OrderCard";
import CustomSelect from "@/components/ui/CustomSelect";
import { toast } from "react-toastify";
import {
  FaBoxOpen, FaClock, FaCheckCircle, FaFilter,
  FaTruck, FaTimesCircle, FaSync, FaUndo,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

/* ─── filter option lists ──────────────────────── */
const statusOptions = [
  { value: "",          label: "All status" },
  { value: "pending",   label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped",   label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

// [v1.0.5] refund filter — full 5-step lifecycle
const refundStatusOptions = [
  { value: "",                label: "All refunds" },
  { value: "requested",       label: "Requested" },
  { value: "approved",        label: "Approved (awaiting return)" },
  { value: "product_received", label: "Product received" },
  { value: "money_refunded",  label: "Money refunded ✓" },
  { value: "rejected",        label: "Rejected" },
];

const dateOptions = [
  { value: "",            label: "All time" },
  { value: "today",       label: "Today" },
  { value: "week",        label: "Last week" },
  { value: "month",       label: "Last month" },
  { value: "threeMonths", label: "Last 3 months" },
];
const searchOptions = [
  { value: "orderId", label: "Order Number" },
  { value: "email",   label: "Email" },
];
const sortOptions = [
  { value: "desc", label: "Newest first" },
  { value: "asc",  label: "Oldest first" },
];

/* ─── helpers ────────────────────────────────────── */
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

// [v1.0.4] — refundStatus added to cache key
const generateKey = (f) => JSON.stringify({
  status: f.status,
  refundStatus: f.refundStatus,
  date: f.date,
  email: f.email,
  orderId: f.orderId,
  searchBy: f.searchBy,
  page: f.page,
  sort: f.sort,
});

/* ─── page ───────────────────────────────────────── */
export default function OrdersPage() {
  const { ordersCache, setOrdersCache } = useAuth();
  const [refreshing,    setRefreshing]    = useState(false);
  const [orders,        setOrders]        = useState(null);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  const defaultFilters = {
    status: "", refundStatus: "", date: "",
    email: "", orderId: "", searchBy: "email",
    page: 1, sort: "desc",
  };
  const [filters,     setFilters]     = useState(defaultFilters);
  const [tempFilters, setTempFilters] = useState(defaultFilters);

  /* ─── fetch ─── */
  const fetchAll = async (isFilter = false, force = false) => {
    const key = generateKey(filters);
    if (!force && ordersCache[key]) {
      setOrders(ordersCache[key].orders);
      setStats(ordersCache[key].stats);
      return;
    }
    try {
      if (isFilter) setFilterLoading(true);
      else if (!refreshing) setLoading(true);

      // Build clean params — only include non-empty values
      const params = {};
      if (filters.status)       params.status       = filters.status;
      if (filters.refundStatus) params.refundStatus = filters.refundStatus; // [v1.0.4]
      if (filters.date)         params.date         = filters.date;
      if (filters.searchBy === "email"   && filters.email)   params.email    = filters.email;
      if (filters.searchBy === "orderId" && filters.orderId) params.orderId  = filters.orderId;
      params.searchBy = filters.searchBy;
      params.page     = filters.page;
      params.sort     = filters.sort;

      const [o, s] = await Promise.all([getOrders(params), getOrderStats()]);
      if (o.success && s.success) {
        setOrders(o.data);
        setStats(s.data);
        setOrdersCache(prev => ({ ...prev, [key]: { orders: o.data, stats: s.data } }));
      }
    } catch { toast.error("Failed to load orders"); }
    finally {
      if (isFilter) setFilterLoading(false);
      else if (!refreshing) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setOrdersCache({});
    try { await fetchAll(false, true); toast.success("Refreshed"); }
    finally { setRefreshing(false); }
  };

  const applyFilters  = () => setFilters({ ...tempFilters, page: 1 });
  const clearFilters  = () => { setTempFilters(defaultFilters); setFilters(defaultFilters); };

  useEffect(() => { fetchAll(false); }, []);
  useEffect(() => { fetchAll(true);  }, [filters]);
  useEffect(() => {
    const el = document.getElementById("dashboard-scroll-container");
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
  }, [filters.page]);

  if (loading && !refreshing) return (
    <div className="flex justify-center items-center py-20 h-full w-full"><Loader /></div>
  );

  /* ─── refund badge colours (for stats row) ─── */
  const refundBadge = {
    requested: "status-pending",
    approved:  "status-delivered",
    rejected:  "status-cancelled",
  };

  return (
    <div className="space-y-5">

      {/* ─── Order stats ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard title="Total"     value={stats?.total     || 0} icon={<FaBoxOpen size={15}/>}      color="from-gray-700 to-gray-400"       index={0} />
        <StatCard title="Pending"   value={stats?.pending   || 0} icon={<FaClock size={15}/>}        color="from-yellow-700 to-yellow-400"   index={1} />
        <StatCard title="Confirmed" value={stats?.confirmed || 0} icon={<FaCheckCircle size={15}/>}  color="from-blue-700 to-blue-400"       index={2} />
        <StatCard title="Shipped"   value={stats?.shipped   || 0} icon={<FaTruck size={15}/>}        color="from-fuchsia-700 to-fuchsia-400" index={3} />
        <StatCard title="Delivered" value={stats?.delivered || 0} icon={<FaBoxOpen size={15}/>}      color="from-green-700 to-green-400"     index={4} />
        <StatCard title="Cancelled" value={stats?.cancelled || 0} icon={<FaTimesCircle size={15}/>}  color="from-rose-700 to-rose-400"       index={5} />
      </div>

      {/* ─── [v1.0.4] Refund stats row ─── */}
      {(stats?.refundRequested || stats?.refundApproved || stats?.refundRejected) ? (
        <div className="d-card flex flex-wrap items-center gap-4 py-3">
          <div className="flex items-center gap-2 shrink-0">
            <FaUndo size={12} style={{ color: "var(--text-subtle)" }} />
            <span className="section-label" style={{ marginBottom: 0 }}>Refunds</span>
          </div>
          {[
            { label: "Requested",         val: stats?.refundRequested         || 0, cls: "status-pending",   key: "requested" },
            { label: "Approved",          val: stats?.refundApproved          || 0, cls: "status-confirmed", key: "approved" },
            { label: "Prod. Received",    val: stats?.refundProductReceived   || 0, cls: "status-shipped",   key: "product_received" },
            { label: "Money Refunded",    val: stats?.refundMoneyRefunded     || 0, cls: "status-delivered", key: "money_refunded" },
            { label: "Rejected",          val: stats?.refundRejected          || 0, cls: "status-cancelled", key: "rejected" },
          ].map(({ label, val, cls, key }) => (
            <button
              key={label}
              onClick={() => {
                const next = { ...defaultFilters, refundStatus: key, page: 1 };
                setTempFilters(next);
                setFilters(next);
              }}
              className="flex items-center gap-2 cursor-pointer border-none bg-transparent"
              title={`Filter by refund ${label.toLowerCase()}`}
            >
              <span className={`status-badge ${cls}`}>{label}</span>
              <span className="text-[13px] font-bold text-slate-800">{val}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* ─── Filter bar ─── */}
      <div className="d-card">
        <p className="section-label mb-3">Filter Orders</p>
        <div className="flex flex-wrap gap-2.5 items-end">
          <input
            placeholder={tempFilters.searchBy === "orderId" ? "Search by order number..." : "Search by email..."}
            value={tempFilters.searchBy === "orderId" ? tempFilters.orderId : tempFilters.email}
            onChange={(e) => {
              const v = e.target.value;
              setTempFilters({
                ...tempFilters,
                email:   tempFilters.searchBy === "email"   ? v : "",
                orderId: tempFilters.searchBy === "orderId" ? v : "",
              });
            }}
            className="d-input flex-1 min-w-[180px]"
          />
          <CustomSelect
            value={tempFilters.searchBy}
            options={searchOptions}
            placeholder="Search by"
            onChange={v => setTempFilters({ ...tempFilters, searchBy: v, email: "", orderId: "" })}
          />
          <CustomSelect
            value={tempFilters.sort}
            options={sortOptions}
            placeholder="Sort"
            onChange={v => setTempFilters({ ...tempFilters, sort: v })}
          />
          <CustomSelect
            value={tempFilters.status}
            options={statusOptions}
            placeholder="Status"
            onChange={v => setTempFilters({ ...tempFilters, status: v })}
          />
          <CustomSelect
            value={tempFilters.date}
            options={dateOptions}
            placeholder="Date range"
            onChange={v => setTempFilters({ ...tempFilters, date: v })}
          />
          {/* [v1.0.4] Refund status filter */}
          <CustomSelect
            value={tempFilters.refundStatus}
            options={refundStatusOptions}
            placeholder="Refund status"
            onChange={v => setTempFilters({ ...tempFilters, refundStatus: v })}
          />

          <div className="flex items-center gap-2">
            <button onClick={applyFilters} className="d-btn d-btn-primary gap-1.5">
              <FaFilter size={10} /> Apply
            </button>
            <button onClick={clearFilters} className="d-btn d-btn-outline">
              Clear
            </button>
            <button onClick={handleRefresh} disabled={refreshing} className="d-btn d-btn-outline gap-1.5" title="Refresh">
              <FaSync size={11} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Orders grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filterLoading ? (
          <div className="col-span-2 flex items-center justify-center py-20"><Loader /></div>
        ) : !orders?.orders?.length ? (
          <div className="col-span-2 d-empty">No orders found</div>
        ) : (
          orders.orders.map((order, i) => <OrderCard key={order._id} order={order} index={i} />)
        )}
      </div>

      {/* ─── Pagination ─── */}
      {orders?.pagination?.totalPages > 1 && (
        <div className="flex justify-center flex-wrap gap-1.5">
          <button
            disabled={orders.pagination.page === 1}
            onClick={() => setFilters({ ...filters, page: orders.pagination.page - 1 })}
            className="d-page-btn"
          >
            Prev
          </button>
          {getVisiblePages(orders.pagination.page, orders.pagination.totalPages).map((p, i) =>
            p === "..." ? (
              <span key={i} className="d-page-btn border-none">…</span>
            ) : (
              <button
                key={i}
                onClick={() => setFilters({ ...filters, page: p })}
                className={`d-page-btn ${p === orders.pagination.page ? "active" : ""}`}
              >
                {p}
              </button>
            )
          )}
          <button
            disabled={orders.pagination.page === orders.pagination.totalPages}
            onClick={() => setFilters({ ...filters, page: orders.pagination.page + 1 })}
            className="d-page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
