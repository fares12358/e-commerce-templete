"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  getOrders,
  getOrderStats,
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import StatCard from "@/components/ui/StatCard";
import OrderCard from "@/components/orders/OrderCard";
import CustomSelect from "@/components/ui/CustomSelect";
import { toast } from "react-toastify";
import {
  FaBoxOpen,
  FaClock,
  FaCheckCircle,
  FaFilter,
  FaTruck,
  FaTimesCircle,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

const statusOptions = [
  { value: "", label: "All status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const dateOptions = [
  { value: "", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last week" },
  { value: "month", label: "Last month" },
  { value: "threeMonths", label: "Last 3 months" },
];

const searchOptions = [
  { value: "orderId", label: "Search by Order Number" },
  { value: "email", label: "Search byEmail" },
];
const sortOptions = [
  { value: "desc", label: "Newest first" },
  { value: "asc", label: "Oldest first" },
];

const getVisiblePages = (current, total) => {
  const delta = 1;
  const pages = [];

  const range = [];
  for (
    let i = Math.max(2, current - delta);
    i <= Math.min(total - 1, current + delta);
    i++
  ) {
    range.push(i);
  }

  if (current - delta > 2) {
    range.unshift("...");
  }

  if (current + delta < total - 1) {
    range.push("...");
  }

  pages.push(1);
  pages.push(...range);
  if (total > 1) pages.push(total);

  return pages;
};

const generateKey = (filters) => {
  return JSON.stringify({
    status: filters.status,
    date: filters.date,
    email: filters.email,
    orderId: filters.orderId,
    searchBy: filters.searchBy,
    page: filters.page,
    sort: filters.sort,
  });
};

/* ================= PAGE ================= */

export default function OrdersPage() {
  const router = useRouter();
  const { ordersCache, setOrdersCache } = useAuth()

  const [orders, setOrders] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    date: "",
    email: "",
    orderId: "",
    searchBy: 'email',
    page: 1,
    sort: "desc",
  });

  const [tempFilters, setTempFilters] = useState(filters);

  /* ================= FETCH ================= */

  const fetchAll = async (isFilter = false) => {
    const key = generateKey(filters);

    // 🔥 If cached → use it
    if (ordersCache[key]) {
      setOrders(ordersCache[key].orders);
      setStats(ordersCache[key].stats);
      return;
    }

    try {
      if (isFilter) {
        setFilterLoading(true);
      } else {
        setLoading(true);
      }

      const [o, s] = await Promise.all([
        getOrders(filters),
        getOrderStats(),
      ]);

      if (o.success && s.success) {
        setOrders(o.data);
        setStats(s.data);

        // 🔥 Save in cache
        setOrdersCache((prev) => ({
          ...prev,
          [key]: {
            orders: o.data,
            stats: s.data,
          },
        }));
      }

    } catch {
      toast.error("Failed to load orders");
    } finally {
      if (isFilter) {
        setFilterLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAll(false); // initial full load
  }, []);

  useEffect(() => {
    fetchAll(true);   // filter/pagination change
  }, [filters]);


  /* ================= APPLY FILTER ================= */

  const applyFilters = () => {
    setFilters({ ...tempFilters, page: 1 });
  };

  const clearFilters = () => {
    const clean = {
      status: "",
      date: "",
      email: "",
      orderId: "",
      searchBy: 'email',
      page: 1,
      sort: "desc",
    };
    setTempFilters(clean);
    setFilters(clean);
  };

  useEffect(() => {
    const container = document.getElementById("dashboard-scroll-container");

    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [filters.page]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 h-full w-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-full">
      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total"
          value={stats?.total || 0}
          icon={<FaBoxOpen size={28} className="drop-shadow-md" />}
          color="from-gray-700 to-gray-400"
          index={0}
        />
        <StatCard
          title="Pending"
          value={stats?.pending || 0}
          icon={<FaClock size={28} className="drop-shadow-md" />}
          color="from-yellow-700 to-yellow-400"
          index={0}
        />
        <StatCard
          title="Confirmed"
          value={stats?.confirmed || 0}
          icon={<FaCheckCircle size={28} className="drop-shadow-md" />}
          color="from-blue-700 to-blue-400"
          index={1}
        />
        <StatCard
          title="Shipped"
          value={stats?.shipped || 0}
          icon={<FaTruck size={28} className="drop-shadow-md" />}
          color="from-fuchsia-700 to-fuchsia-400"
          index={2}
        />
        <StatCard
          title="Delivered"
          value={stats?.delivered || 0}
          icon={<FaBoxOpen size={28} className="drop-shadow-md" />}
          color="from-green-700 to-green-400"
          index={3}
        />
        <StatCard
          title="Cancelled"
          value={stats?.cancelled || 0}
          icon={<FaTimesCircle size={28} className="drop-shadow-md" />}
          color="from-rose-700 to-rose-400"
          index={4}
        />
      </div>

      {/* ================= FILTER BAR ================= */}

      <div className="bg-white shadow-sm rounded-md p-4 flex flex-wrap gap-3 items-center w-full">

        <input
          placeholder={
            tempFilters.searchBy === "orderId"
              ? "Search by Order Number"
              : "Search by Email"
          }
          value={
            tempFilters.searchBy === "orderId"
              ? tempFilters.orderId
              : tempFilters.email
          }
          onChange={(e) => {
            const value = e.target.value;

            setTempFilters({
              ...tempFilters,
              email: tempFilters.searchBy === "email" ? value : "",
              orderId: tempFilters.searchBy === "orderId" ? value : "",
            });
          }}
          className="border px-3 py-2 rounded-md w-full"
        />


        <CustomSelect
          value={tempFilters.searchBy}
          options={searchOptions}
          placeholder="Search by"
          onChange={(val) =>
            setTempFilters({
              ...tempFilters,
              searchBy: val,
              email: "",
              orderId: "",
            })
          }
        />

        <CustomSelect
          value={tempFilters.sort}
          options={sortOptions}
          placeholder="Sort by date"
          onChange={(val) =>
            setTempFilters({ ...tempFilters, sort: val })
          }
        />

        <CustomSelect
          value={tempFilters.status}
          options={statusOptions}
          placeholder="Order status"
          onChange={(val) =>
            setTempFilters({ ...tempFilters, status: val })
          }
        />
        <CustomSelect
          value={tempFilters.date}
          options={dateOptions}
          placeholder="Date range"
          onChange={(val) =>
            setTempFilters({ ...tempFilters, date: val })
          }
        />

        <div className="w-fit flex items-center justify-center gap-4">
          <button
            onClick={applyFilters}
            className="bg-gradient-to-br from-black to-black/70 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:-translate-y-1 transition duration-300"
          >
            <FaFilter /> Apply
          </button>
          <button
            onClick={clearFilters}
            className="border px-4 py-2 rounded-md hover:bg-gray-50 hover:-translate-y-1 transition duration-300"
          >
            Clear
          </button>
        </div>

      </div>

      {/* ================= ORDERS ================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">

        {
          filterLoading ?
            <div className="w-full min-h-[40vh] flex items-center justify-center col-span-2">
              <Loader size={30} />
            </div>
            :
            orders?.orders.length == 0 ?
              <div className="w-full flex items-center justify-center text-gray-500 col-span-2 bg-white py-4 rounded-md border min-h-[25vh]">No Orders found</div>
              :
              orders?.orders?.map((order, i) => (
                <OrderCard key={order._id} order={order} index={i} />
              ))
        }

      </div>

      {/* ================= PAGINATION ================= */}

      {orders?.pagination?.totalPages > 1 && (
        <div className="flex justify-center flex-wrap gap-2 pt-6">

          <button
            disabled={orders.pagination.page === 1}
            onClick={() =>
              setFilters({
                ...filters,
                page: orders.pagination.page - 1,
              })
            }
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>

          {getVisiblePages(
            orders.pagination.page,
            orders.pagination.totalPages
          ).map((page, index) =>
            page === "..." ? (
              <span key={index} className="px-3 py-1">
                ...
              </span>
            ) : (
              <button
                key={index}
                onClick={() => setFilters({ ...filters, page })}
                className={`px-3 py-1 border rounded ${page === orders.pagination.page
                  ? "bg-black text-white"
                  : ""
                  }`}
              >
                {page}
              </button>
            )
          )}

          <button
            disabled={
              orders.pagination.page ===
              orders.pagination.totalPages
            }
            onClick={() =>
              setFilters({
                ...filters,
                page: orders.pagination.page + 1,
              })
            }
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>

        </div>
      )}

    </div>
  );
}
