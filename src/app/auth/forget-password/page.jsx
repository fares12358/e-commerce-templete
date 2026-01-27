"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { forgotPassword } from "@/lib/api";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

export default function ForgetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);

      const res = await forgotPassword({ email });

      if (res.success) {
        toast.success(res.message || "Reset link sent to your email");
        router.push("/auth/login");
      } else {
        toast.error(res.message || "Failed to send reset link");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm rounded-md bg-white p-6 border border-gray-200"
      >
        <h1 className="mb-2 text-center text-xl font-medium text-black">
          Forgot Password
        </h1>

        <p className="mb-6 text-center text-sm text-gray-600">
          Enter your email to receive a reset link
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 px-3 py-2 outline-none focus:border-black rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-black to-black/70 py-2 text-white disabled:opacity-60 rounded-md hover:-translate-y-1 transition-all duration-300 ease-in-out"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/auth/login")}
            className="text-sm text-gray-600 hover:text-black"
          >
            Back to login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
