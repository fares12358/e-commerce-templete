"use client";

import { useAuth } from "@/context/AuthContext";
import { FiMenu } from "react-icons/fi";
import { usePathname } from "next/navigation";

const pageTitles = {
  "/dashboard":  { title: "Dashboard",   sub: "Overview & analytics" },
  "/categories": { title: "Categories",  sub: "Manage product categories" },
  "/products":   { title: "Products",    sub: "Manage your product catalog" },
  "/orders":     { title: "Orders",      sub: "Track and manage orders" },
  "/users":      { title: "Users",       sub: "Customer accounts" },
  "/ads":        { title: "Ads",         sub: "Promotional banners" },
  "/content":    { title: "Content",     sub: "Site content & pages" },
  "/profile":    { title: "Profile",     sub: "Account & store settings" },
};

export default function Navbar({ onMenuClick }) {
  const { admin } = useAuth();
  const pathname = usePathname();

  const match = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + "/")
  );
  const page = match ? match[1] : { title: "Dashboard", sub: "" };

  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 border-b"
      style={{ background: "#fff", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition cursor-pointer"
        >
          <FiMenu size={16} />
        </button>

        <div>
          <h1 className="text-[14px] font-semibold text-slate-900 leading-none">{page.title}</h1>
          {page.sub && (
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">{page.sub}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
          style={{ background: "var(--accent)" }}
        >
          {admin?.name?.charAt(0)?.toUpperCase() || "A"}
        </div>
        <span className="text-[13px] text-slate-600 font-medium hidden sm:block">
          {admin?.name || "Admin"}
        </span>
      </div>
    </header>
  );
}
