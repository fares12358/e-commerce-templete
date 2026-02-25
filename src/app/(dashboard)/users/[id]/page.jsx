"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getUserDetails } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import StatCard from "@/components/ui/StatCard";
import OrderCard from "@/components/orders/OrderCard";
import { toast } from "react-toastify";
import {
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaBoxOpen,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaTimesCircle,
  FaArrowLeft
} from "react-icons/fa";

/* ================= PAGE ================= */

export default function UserDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await getUserDetails(id);

      if (res.success) setData(res.data);
    } catch {
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 w-full h-screen">
        <Loader />
      </div>
    );
  }

  const { user, orders, stats } = data;

  return (
    <div className="space-y-8">

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="flex items-center shadow-sm gap-2 text-sm bg-gradient-to-br from-zinc-600 to-zinc-400 text-white font-semibold py-3 px-5 rounded-md hover:-translate-y-1 duration-300 transition-all"

      >
        <FaArrowLeft /> Back
      </button>

      {/* ================= USER INFO ================= */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border rounded-md p-5 flex flex-wrap gap-6 items-center justify-between"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <FaUser className="text-gray-400" />
            {user.name}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaEnvelope /> {user.email}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaCalendarAlt />
            Joined: {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>

        <span
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            user.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {user.isActive ? "Active" : "Suspended"}
        </span>
      </motion.div>

      {/* ================= STATS ================= */}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

        <StatCard title="Total" value={stats.total} icon={<FaBoxOpen />} color="from-gray-700 to-gray-400" />
        <StatCard title="Pending" value={stats.pending} icon={<FaClock />} color="from-yellow-700 to-yellow-400" />
        <StatCard title="Confirmed" value={stats.confirmed} icon={<FaCheckCircle />} color="from-blue-700 to-blue-400" />
        <StatCard title="Shipped" value={stats.shipped} icon={<FaTruck />} color="from-purple-700 to-purple-400" />
        <StatCard title="Delivered" value={stats.delivered} icon={<FaBoxOpen />} color="from-green-700 to-green-400" />
        <StatCard title="Cancelled" value={stats.cancelled} icon={<FaTimesCircle />} color="from-rose-700 to-rose-400" />

      </div>

      {/* ================= ORDERS ================= */}

      {orders.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No orders yet
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map((order, i) => (
            <OrderCard key={order._id} order={order} index={i} />
          ))}
        </div>
      )}

    </div>
  );
}
