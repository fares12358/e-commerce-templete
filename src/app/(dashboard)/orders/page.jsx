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
  FaSearch,
  FaFilter,
  FaTruck,
  FaTimesCircle,
} from "react-icons/fa";

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
  { value: "orderId", label: "Order Number" },
  { value: "email", label: "Email" },
];
const sortOptions = [
  { value: "desc", label: "Newest first" },
  { value: "asc", label: "Oldest first" },
];



/* ================= PAGE ================= */

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
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

      if (o.success) setOrders(o.data);
      if (s.success) setStats(s.data);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 h-full w-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<FaClock size={28} className="drop-shadow-md" />}
          color="from-yellow-700 to-yellow-400"
          index={0}
        />
        <StatCard
          title="Confirmed"
          value={stats.confirmed}
          icon={<FaCheckCircle size={28} className="drop-shadow-md" />}
          color="from-blue-700 to-blue-400"
          index={1}
        />
        <StatCard
          title="Shipped"
          value={stats.shipped}
          icon={<FaTruck size={28} className="drop-shadow-md" />}
          color="from-fuchsia-700 to-fuchsia-400"
          index={2}
        />
        <StatCard
          title="Delivered"
          value={stats.delivered}
          icon={<FaBoxOpen size={28} className="drop-shadow-md" />}
          color="from-green-700 to-green-400"
          index={3}
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          icon={<FaTimesCircle size={28} className="drop-shadow-md" />}
          color="from-rose-700 to-rose-400"
          index={4}
        />
      </div>

      {/* ================= FILTER BAR ================= */}

      <div className="bg-white shadow-sm rounded-md p-4 flex flex-wrap gap-3 items-center">

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
          className="border px-3 py-2 rounded-md"
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

      {/* ================= ORDERS ================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {
          filterLoading ?
            <div className="w-full min-h-[40vh] flex items-center justify-center col-span-2">
              <Loader size={30} />
            </div>
            :
            orders.orders.map((order, i) => (
              <OrderCard key={order._id} order={order} index={i} />
            ))
        }

      </div>

      {/* ================= PAGINATION ================= */}

      {orders.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-6">

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

          {Array.from({
            length: orders.pagination.totalPages,
          }).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setFilters({ ...filters, page })}
                className={`px-3 py-1 border rounded ${page === orders.pagination.page
                  ? "bg-black text-white"
                  : ""
                  }`}
              >
                {page}
              </button>
            );
          })}

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
