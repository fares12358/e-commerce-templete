"use client";

import { useRouter } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";
import { FaShoppingBag, FaTimes } from "react-icons/fa";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function CustomNotification() {
  const router = useRouter();
  const { notifications, removeNotification } = useNotification();
  const { notificationCache } = useAuth();

  useEffect(() => {
    if (notifications.length > 0) {
      if (!notificationCache?.notifySound) return;
      const audio = new Audio("/notification.wav");
      audio.play().catch(() => {});
    }
  }, [notifications]);

  return (
    <div className="fixed top-4 right-4 flex flex-col gap-2.5 z-[999] pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="pointer-events-auto animate-slideIn bg-white rounded-xl shadow-xl border overflow-hidden w-72 cursor-pointer"
          style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
          onClick={() => {
            router.push(`/orders/${notification.orderId}`);
            removeNotification(notification.id);
          }}
        >
          {/* Accent top bar */}
          <div className="h-0.5 w-full" style={{ background: "var(--accent)" }} />

          <div className="px-4 py-3 relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded-full transition-colors duration-150 cursor-pointer border-none bg-transparent"
              style={{ color: "var(--text-subtle)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-subtle)"}
            >
              <FaTimes size={10} />
            </button>

            <div className="flex items-center gap-2.5 pr-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#eff6ff" }}
              >
                <FaShoppingBag size={13} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                  New Order
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  #{notification.orderNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 w-full" style={{ background: "var(--border)" }}>
            <div
              className="h-full animate-progress"
              style={{ background: "var(--accent)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
