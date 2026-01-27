"use client";

import { useEffect, useState } from "react";
import {
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

export default function AdminProfilePage() {
    const {  setAdmin } = useAuth()
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    /* ================= PROFILE ================= */

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    /* ================= PASSWORD ================= */

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    /* ================= FETCH ================= */

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await getAdminProfile();
            if (res.success) {
                setName(res.data.name);
                setEmail(res.data.email);
                setAdmin(res.data)
            }
        } catch {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    /* ================= UPDATE PROFILE ================= */

    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            return toast.error("Name is required");
        }

        try {
            setSubmitting(true);
            await updateAdminProfile({ name, email });
            toast.success("Profile updated");
            fetchProfile();
        } catch {
            toast.error("Failed to update profile");
        } finally {
            setSubmitting(false);
        }
    };

    /* ================= CHANGE PASSWORD ================= */

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (!currentPassword || !newPassword) {
            return toast.error("All password fields are required");
        }

        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match");
        }

        try {
            setPasswordLoading(true);
            await changeAdminPassword({
                currentPassword,
                newPassword,
            });

            toast.success("Password changed successfully");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            toast.error("Failed to change password");
        } finally {
            setPasswordLoading(false);
        }
    };

    /* ================= LOADING ================= */

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 h-full w-full">
                <Loader />
            </div>
        );
    }

    /* ================= UI ================= */

    return (
        <div className="space-y-8 max-w-2xl">
            {/* ================= PROFILE INFO ================= */}
            <div className="bg-white shadow-sm rounded-md p-4">
                <h2 className="mb-4 font-medium">Profile Information</h2>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Name"
                        className="border px-3 py-2 w-full rounded-md"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        className="border px-3 py-2 w-full rounded-md"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <button
                        disabled={submitting}
                        className="bg-gradient-to-br from-black to-black/70 text-white px-4 py-2 rounded-md flex gap-2 disabled:opacity-60 hover:-translate-y-1 transition-all duration-300 ease-in-out"
                    >
                        {submitting ? (
                            <>
                                <Loader size={16} color="#fff" /> Saving
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </form>
            </div>

            {/* ================= CHANGE PASSWORD ================= */}
            <div className="bg-white shadow-sm rounded-md p-4">
                <h2 className="mb-4 font-medium">Change Password</h2>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Current password"
                        className="border px-3 py-2 w-full rounded-md"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="New password"
                        className="border px-3 py-2 w-full rounded-md"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Confirm new password"
                        className="border px-3 py-2 w-full rounded-md"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    <button
                        disabled={passwordLoading}
                        className="bg-gradient-to-br from-black to-black/70 text-white px-4 py-2 rounded-md flex gap-2 disabled:opacity-60 hover:-translate-y-1 transition-all duration-300 ease-in-out"
                    >
                        {passwordLoading ? (
                            <>
                                <Loader size={16} color="#fff" /> Updating
                            </>
                        ) : (
                            "Change Password"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
