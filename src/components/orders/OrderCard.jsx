"use client";
import { motion } from "framer-motion";
import { FaUser, FaBox, FaArrowRight, FaClock, FaCheckCircle, FaTruck, FaBoxOpen, FaTimesCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";

const statusStyles = {
  pending: "from-amber-600 to-amber-300",
  confirmed: "from-blue-700 to-blue-400",
  shipped: "from-purple-700 to-purple-400",
  delivered: "from-green-700 to-green-400",
  cancelled: "from-red-700 to-red-400",
};

const borderStyles = {
  pending: "border-yellow-500",
  confirmed: "border-blue-500",
  shipped: "border-purple-500",
  delivered: "border-green-500",
  cancelled: "border-red-500",
};

const iconStyles = {
  pending: <FaClock className="drop-shadow-md" />,
  confirmed: <FaCheckCircle className="drop-shadow-md" />,
  shipped: <FaTruck className="drop-shadow-md" />,
  delivered: <FaBoxOpen className="drop-shadow-md" />,
  cancelled: <FaTimesCircle className="drop-shadow-md" />,
};

export default function OrderCard({ order, index ,email }) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}

      className={`rounded-md relative mt-5 border-t-2 ${borderStyles[order.status]} p-4 shadow-md transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white`}
    >
      {/* Left */}
      <div className="flex flex-col gap-2">
        <div
          onClick={(e) => {
            if(email) return
            e.stopPropagation();
            router.push(`/users/${order.userId?._id}`);
          }}
          className="flex items-center gap-2 text-md font-semibold text-gray-700 hover:underline cursor-pointer hover:text-black transition-all duration-300 ease-in-out"
        >
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-blue-600 to-blue-300 shadow-md text-white flex items-center justify-center">
            <FaUser className="text-md" />
          </div>

          {order?.userId?.email || email || "Unknown user"}
        </div>

        <div
          className="flex items-center gap-2 text-md font-black text-black transition-all duration-300 ease-in-out"
        >
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-lime-600 to-lime-300 shadow-md text-white flex items-center justify-center">
            <FaBox className="text-md" />
          </div>
          {order.items?.length || 0}
        </div>
      </div>
      {/* Status */}

      <span
        className={`flex absolute bottom-full left-1/2 -translate-x-1/2 items-center justify-center  gap-2 text-sm px-8 py-1 rounded-tl-3xl rounded-tr-3xl font-medium capitalize bg-gradient-to-br text-white w-fit ${statusStyles[order.status]}`}
      >
        {iconStyles[order.status]}{order.status}
      </span>

      {/* Price + arrow */}
      <div className="flex items-center justify-evenly gap-2 h-full w-fit flex-col mx-auto md:ml-auto md:mr-0">

        <div className="relative inline-flex items-center hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-default">
          {/* Frosted glass layer */}
          <div className="relative flex items-center gap-2 px-3 py-2 rounded-md  
                  bg-gradient-to-br from-sky-200 to-sky-50 backdrop-blur-md shadow-md border border-white/30">
            <FaClock className="text-sky-500" />
            <span className="text-sm font-medium text-gray-900">
              {new Date(order.createdAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
        </div>

        <div
          onClick={() => router.push(`/orders/${order._id}`)}
          className="w-full h-fit cursor-pointer rounded-md bg-gradient-to-br from-zinc-600 to-zinc-400 shadow-md text-white flex items-center justify-center gap-2 py-2 px-4 hover:-translate-y-1 transition-all duration-300 ease-in-out">
          <span className="font-semibold text-sm">
            {order.totalPrice.toLocaleString()}
          </span>
          <FaArrowRight className="-rotate-45" />
        </div>
      </div>
    </motion.div>
  );
}
