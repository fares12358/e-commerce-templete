"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { FaBullhorn, FaDolly, FaSignOutAlt, FaStore, FaTags, FaThLarge, FaUser, FaUserCog, FaUserShield } from "react-icons/fa";
import ConfirmModal from "../ui/ConfirmModal";
import { useState } from "react";
const links = [
  { name: "Dashboard", href: "/dashboard", icon: FaThLarge },
  { name: "Categories", href: "/categories", icon: FaStore },
  { name: "Products", href: "/products", icon: FaTags },
  { name: "Orders", href: "/orders", icon: FaDolly },
  { name: "Users", href: "/users", icon: FaUser },
  { name: "Ads", href: "/ads", icon: FaBullhorn },
  { name: "Profile", href: "/profile", icon: FaUserCog },
  { name: "Content", href: "/content", icon: FaUserCog },
];
export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [confirmLogout, setconfirmLogout] = useState(false)

  const SidebarContent = (
    <div className="h-full w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
      <h2 className="mb-8 text-lg font-semibold flex items-center gap-2">
        <div
          className='bg-gradient-to-br from-blue-800 to-purple-400 shadow-md text-white rotate-12 size-10 flex items-center justify-center rounded-xl'
        >
          <span className="-rotate-12">
            <FaUserShield size={20} className="drop-shadow-md" />
          </span>
        </div>
        Admin Dashboard
      </h2>

      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onClose}
              className={`rounded px-3 py-2 text-sm flex items-center gap-2 transition ${active
                ? "bg-gradient-to-br from-indigo-600 to-indigo-300 text-white"
                : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <div className="">
                <Icon
                  className={`text-lg ${active ? "text-white text-2xl p-1 rounded-sm shadow-md -translate-y-3 rotate-12 -translate-x-3 scale-[200%] transition-all duration-500 ease-in-out drop-shadow-md backdrop-blur-sm" : "text-black"
                    }`}
                />
              </div>
              {link.name}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setconfirmLogout(true)}
        className="mt-auto bg-gradient-to-br from-red-800 to-red-400 text-white py-3 px-2 rounded-md flex items-center justify-center gap-2 hover:-translate-y-1 transition-all ease-in-out duration-300"
      >
        <FaSignOutAlt />
        Logout
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        {SidebarContent}
      </div>

      {/* Mobile */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/30 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Slide sidebar */}
            <motion.div
              className="fixed left-0 top-0 z-50 h-full md:hidden"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ConfirmModal open={confirmLogout} title="Logout" message="DO you want to logout" onCancel={() => setconfirmLogout(false)} onConfirm={logout} />
    </>
  );
}
