"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();

  const [email, setEmail] = useState("fares.dev.m@gmail.com");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      const res = await loginAdmin({ email, password });
      if (res.success) {
        toast.success(res.message || "Login successful");
        await checkAuth();
        router.replace("/");
      } else {
        toast.error(res.message || "Login failed");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm rounded-md bg-white p-6"
      >
        <h1 className="mb-6 text-center text-xl font-medium text-black">
          Admin Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-black rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password with toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full border border-gray-300 px-3 py-2 pr-10 outline-none focus:border-black rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
            >
              {showPassword ? <FaEye /> :<FaEyeSlash /> }
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-black to-black/70 py-2 text-white disabled:opacity-60 rounded-md hover:-translate-y-1 transition-all duration-300 ease-in-out"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Forget password */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/auth/forget-password")}
            className="text-sm text-gray-600 hover:text-black"
          >
            Forgot password ?
          </button>
        </div>
      </motion.div>
    </div>
  );
}
