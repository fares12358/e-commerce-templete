"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash, FaThLarge } from "react-icons/fa";
import Loader from "@/components/ui/Loader";

export default function LoginPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();

  const [email, setEmail] = useState("admin@gmail.com");
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
        await checkAuth();
        toast.success(res.message || "Login successful");
        router.replace("/dashboard");
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <FaThLarge size={18} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-[18px] font-semibold text-slate-900">Admin Login</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">Sign in to your dashboard</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-xl p-6"
          style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="section-label block mb-1.5">Email</label>
              <input
                type="email"
                placeholder="admin@example.com"
                className="d-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="section-label block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="d-input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer border-none bg-transparent"
                  style={{ color: "var(--text-subtle)" }}
                >
                  {showPassword ? <FaEye size={13} /> : <FaEyeSlash size={13} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="d-btn d-btn-primary w-full h-10 mt-2"
            >
              {loading ? <><Loader size={16} color="#fff" /> Signing in...</> : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/auth/forget-password")}
              className="text-[12px] cursor-pointer border-none bg-transparent"
              style={{ color: "var(--accent)" }}
            >
              Forgot password?
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
