"use client";

import { useRouter } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";
import { FaShoppingCart, FaTimes } from "react-icons/fa";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function CustomNotification() {
  const router = useRouter();
  const { notifications, removeNotification } = useNotification();
  const { notificationCache } = useAuth()
  // 🔔 Sound effect
  useEffect(() => {
    if (notifications.length > 0) {
      if(!notificationCache?.notifySound) return
      const audio = new Audio("/notification.wav");
      audio.play().catch(() => { });
    }
  }, [notifications]);

  return (
    <div className="fixed top-5 right-5 flex flex-col gap-3 z-50">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          dir="rtl"
          className="relative bg-gradient-to-br from-sky-600 to-sky-400 text-white px-6 py-3 rounded-lg shadow-lg w-72 animate-slideIn cursor-pointer"
          onClick={() => {
            router.push(`/orders/${notification.orderId}`);
            removeNotification(notification.id);
          }}
        >
          {/* زر الإغلاق */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
            className="absolute top-2 left-2 text-white hover:text-gray-200"
          >
            <FaTimes size={12} />
          </button>

          <p className="font-semibold flex items-center gap-2">
            <FaShoppingCart />
            طلب جديد
          </p>

          <p className="text-xs mt-1">
            رقم الطلب : {notification.orderNumber}
          </p>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full overflow-hidden rounded-b-lg">
            <div className="h-full bg-white animate-progress" />
          </div>
        </div>
      ))}
    </div>
  );
}