"use client";

import { motion } from "framer-motion";
import Loader from "@/components/ui/Loader";
import { FaLink } from "react-icons/fa";
import { useRouter } from "next/navigation";
const borderStyles = {
    Orders: "border-black",
    Pending: "border-yellow-500",
    Confirmed: "border-blue-500",
    Shipped: "border-purple-500",
    Delivered: "border-green-500",
    Cancelled: "border-red-500",
};

export default function UserCard({
    user,
    onToggle,
    loading
}) {
    const router = useRouter()
    const s = user.orderStats;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-md p-4 space-y-3 shadow-sm hover:shadow transition relative"
        >
            <div className="ab absolute top-0 left-0 p-2 shadow-md rounded-br-md cursor-pointer" onClick={() => { router.push(`/users/${user._id}`) }}>
                <FaLink size={15} className="text-blue-400 drop-shadow-md" />
            </div>
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-400">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                </div>

                <button
                    onClick={() => onToggle(user)}
                    disabled={loading}
                    className={`px-4 py-1 rounded-md text-sm transition ${user.isActive
                        ? "bg-gradient-to-br from-green-800 to-green-400 text-white"
                        : "bg-gradient-to-br from-red-800 to-red-400 text-white"
                        }`}
                >
                    {loading ? <Loader size={15} color="#fff" /> : user.isActive ? "Active" : "Suspended"}
                </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-center">
                <Stat label="Orders" value={s.total} />
                <Stat label="Pending" value={s.pending} />
                <Stat label="Confirmed" value={s.confirmed} />
                <Stat label="Shipped" value={s.shipped} />
                <Stat label="Delivered" value={s.delivered} />
                <Stat label="Cancelled" value={s.cancelled} />
            </div>
        </motion.div>
    );
}

const Stat = ({ label, value }) => (
    <div className={` shadow-sm border-t-2 rounded-md p-2 ${borderStyles[label]}`}>
        <div className="font-medium">{value}</div>
        <div className="text-gray-500">{label}</div>
    </div>
);
