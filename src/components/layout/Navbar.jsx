"use client";

import { useAuth } from "@/context/AuthContext";
import { FiMenu } from "react-icons/fi";

export default function Navbar({ onMenuClick }) {
  const { admin } = useAuth();

  return (
    <header className="h-14 border-b border-gray-200 bg-white px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="md:hidden text-gray-700 hover:text-black"
        >
          <FiMenu size={20} />
        </button>

        <span className="text-lg text-gray-600">
          Welcome,{" "}
          <span className="font-medium text-black">
            {admin?.name}
          </span>
        </span>
      </div>
    </header>
  );
}
