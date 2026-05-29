"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  FaBullhorn, FaDolly, FaSignOutAlt, FaStore, FaTags,
  FaThLarge, FaUser, FaUserCog, FaFileAlt
} from "react-icons/fa";
import ConfirmModal from "../ui/ConfirmModal";
import { useState } from "react";

const links = [
  { name: "Dashboard",   href: "/dashboard",  icon: FaThLarge },
  { name: "Categories",  href: "/categories", icon: FaStore },
  { name: "Products",    href: "/products",   icon: FaTags },
  { name: "Orders",      href: "/orders",     icon: FaDolly },
  { name: "Users",       href: "/users",      icon: FaUser },
  { name: "Ads",         href: "/ads",        icon: FaBullhorn },
  { name: "Content",     href: "/content",    icon: FaFileAlt },
  { name: "Profile",     href: "/profile",    icon: FaUserCog },
];

function SidebarContent({ onClose }) {
  const pathname = usePathname();
  const { logout, admin } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div
      className="h-full w-60 flex flex-col"
      style={{ background: "var(--sidebar-bg)" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--accent)" }}
          >
            <FaThLarge size={13} className="text-white" />
          </div>
          <div>
            <p className="text-white text-[13px] font-semibold leading-none">Admin Panel</p>
            <p className="text-white/40 text-[11px] mt-0.5 truncate max-w-[120px]">
              {admin?.name || "Admin"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-white/30 text-[10px] font-semibold tracking-widest uppercase px-2 mb-3">
          Navigation
        </p>
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onClose}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
              style={{
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.55)",
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.background = "var(--sidebar-hover)";
                if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.85)";
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.background = "transparent";
                if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.55)";
              }}
            >
              <Icon size={14} className="shrink-0" />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10 shrink-0">
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer border-none"
          style={{ color: "rgba(255,255,255,0.55)", background: "transparent" }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(239,68,68,0.15)";
            e.currentTarget.style.color = "#f87171";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.55)";
          }}
        >
          <FaSignOutAlt size={13} className="shrink-0" />
          Logout
        </button>
      </div>

      <ConfirmModal
        open={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={logout}
      />
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex shrink-0">
        <SidebarContent onClose={() => {}} />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed left-0 top-0 z-50 h-full md:hidden"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <SidebarContent onClose={onClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
