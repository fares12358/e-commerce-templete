"use client";

import { useEffect, useState } from "react";
import { getUsers, toggleUserStatus } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import UserCard from "@/components/users/UserCard";
import { toast } from "react-toastify";
import { FaFilter } from "react-icons/fa";
import CustomSelect from "@/components/ui/CustomSelect";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [filterLoading, setFilterLoading] = useState(false)
  // actual applied filters
  const [filters, setFilters] = useState({
    email: "",
    isActive: "",
    sort: "desc", // newest default
  });

  // UI temp filters
  const [tempFilters, setTempFilters] = useState(filters);

  /* ================= FETCH ================= */

  const fetchUsers = async (isFilter = false) => {
    try {
      if (isFilter) {
        setFilterLoading(true);
      } else {
        setLoading(true);
      }

      const res = await getUsers({
        email: filters.email || undefined,
        isActive: filters.isActive || undefined,
        sort: filters.sort || "desc",
      });

      if (res.success) setUsers(res.data);
      console.log(res.data);
      
    } catch {
      toast.error("Failed to load users");
    } finally {
      if (isFilter) {
        setFilterLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUsers(false); // full page loader
  }, []);
  
  useEffect(() => {
    fetchUsers(true); // small loader
  }, [filters]);
  

  /* ================= APPLY / CLEAR ================= */

  const applyFilters = () => {
    setFilters({ ...tempFilters });
  };

  const clearFilters = () => {
    const clean = { email: "", isActive: "" };
    setTempFilters(clean);
    setFilters(clean);
  };

  /* ================= TOGGLE ================= */

  const handleToggleStatus = async (user) => {
    try {
      setStatusLoadingId(user._id);
      await toggleUserStatus(user._id);
      toast.success("User updated");
      fetchUsers();
    } catch {
      toast.error("Update failed");
    } finally {
      setStatusLoadingId(null);
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
    <div className="space-y-6">

      {/* FILTER BAR */}
      <div className="bg-white shadow-sm rounded-md p-4 flex flex-wrap gap-3 items-center">

        <input
          placeholder="Search by email"
          className="border px-3 py-2 rounded-md"
          value={tempFilters.email}
          onChange={e =>
            setTempFilters({ ...tempFilters, email: e.target.value })
          }
        />

        <CustomSelect
          placeholder="Sort by date"
          value={tempFilters.sort}
          onChange={(val) =>
            setTempFilters({ ...tempFilters, sort: val })
          }
          options={[
            { label: "Newest", value: "desc" },
            { label: "Oldest", value: "asc" },
          ]}
        />

        <CustomSelect
          placeholder="User status"
          value={tempFilters.isActive}
          onChange={(val) =>
            setTempFilters({ ...tempFilters, isActive: val })
          }
          options={[
            { label: "All status", value: "" },
            { label: "Active", value: "true" },
            { label: "Suspended", value: "false" },
          ]}
        />

        <button
          onClick={applyFilters}
          className="flex items-center justify-center gap-2 bg-gradient-to-br from-black to-black/70 text-white px-4 py-2 rounded-md hover:-translate-y-1 transition duration-300 ease-in-out"
        >
          <FaFilter />
          Apply
        </button>

        <button
          onClick={clearFilters}
          className="border px-4 py-2 rounded-md hover:bg-gray-50 hover:-translate-y-1 transition duration-300 ease-in-out"
        >
          Clear
        </button>

      </div>

      {/* USERS GRID */}
      {users.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No users found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {
            filterLoading ?
              <div className="w-full min-h-[50vh] col-span-3 flex items-center justify-center">
                <Loader size={30} />
              </div>
              :
              users.map((u) => (
                <UserCard
                  key={u._id}
                  user={u}
                  loading={statusLoadingId === u._id}
                  onToggle={handleToggleStatus}
                />
              ))}
        </div>
      )}
    </div>
  );
}
