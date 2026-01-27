"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { resetPassword } from "@/lib/api";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      return toast.error("All fields are required");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);

      const res = await resetPassword(token, { password });

      if (res.success) {
        toast.success(res.message || "Password reset successful");
        router.replace("/auth/login");
      } else {
        toast.error(res.message || "Reset failed");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm rounded-md bg-white p-6 border border-gray-200"
      >
        <h1 className="mb-2 text-center text-xl font-medium text-black">
          Reset Password
        </h1>

        <p className="mb-6 text-center text-sm text-gray-600">
          Enter your new password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              className="w-full border border-gray-300 px-3 py-2 pr-10 outline-none focus:border-black rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Confirm password */}
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              className="w-full border border-gray-300 px-3 py-2 pr-10 outline-none focus:border-black rounded-md"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-black to-black/70 py-2 text-white disabled:opacity-60 rounded-md hover:-translate-y-1 transition-all duration-300 ease-in-out"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/auth/login")}
            className="text-sm text-gray-600 hover:text-black"
          >
            Back to login ?
          </button>
        </div>
        </form>
      </motion.div>
    </div>
  );
}
