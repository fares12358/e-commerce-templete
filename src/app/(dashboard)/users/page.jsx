"use client";

import { useEffect, useState } from "react";
import { getUsers, toggleUserStatus } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import UserCard from "@/components/users/UserCard";
import { toast } from "react-toastify";
import { FaFilter, FaSyncAlt } from "react-icons/fa";
import CustomSelect from "@/components/ui/CustomSelect";
import { useAuth } from "@/context/AuthContext";
const generateKey = (filters) => {
  return JSON.stringify({
    email: filters.email,
    isActive: filters.isActive,
    sort: filters.sort,
    page: filters.page,
  });
};
const getVisiblePages = (current, total) => {
  const delta = 1;
  const pages = [];

  const range = [];
  for (
    let i = Math.max(2, current - delta);
    i <= Math.min(total - 1, current + delta);
    i++
  ) {
    range.push(i);
  }

  if (current - delta > 2) range.unshift("...");
  if (current + delta < total - 1) range.push("...");

  pages.push(1);
  pages.push(...range);
  if (total > 1) pages.push(total);

  return pages;
};
export default function UsersPage() {
  const { usersCache, setUsersCache } = useAuth()
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [filterLoading, setFilterLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false);

  // actual applied filters
  const [filters, setFilters] = useState({
    email: "",
    isActive: "",
    sort: "desc",
    page: 1,
  });
  // UI temp filters
  const [tempFilters, setTempFilters] = useState(filters);

  /* ================= FETCH ================= */

  const fetchUsers = async (isFilter = false, cache = true) => {
    const key = generateKey(filters);

    // ✅ Return from cache if exists
    if (usersCache[key] && cache) {
      setUsers(usersCache[key]);
      return;
    }

    try {
      if (isFilter) {
        setFilterLoading(true);
      } else if (!refreshing) {
        setLoading(true);
      }

      const res = await getUsers({
        email: filters.email || undefined,
        isActive: filters.isActive || undefined,
        sort: filters.sort || "desc",
        page: filters.page || 1,
      });

      if (res.success) {
        setUsers(res.data);

        // 🔥 Save to cache
        setUsersCache((prev) => ({
          ...prev,
          [key]: res.data,
        }));
      }

    } catch {
      toast.error("Failed to load users");
    } finally {
      if (isFilter) {
        setFilterLoading(false);
      } else if (!refreshing) {
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
    const clean = {
      email: "",
      isActive: "",
      sort: "desc",
      page: 1,
    };
    setTempFilters(clean);
    setFilters(clean);
  };

  /* ================= TOGGLE ================= */

  const handleToggleStatus = async (user) => {
    try {
      setStatusLoadingId(user._id);
      await toggleUserStatus(user._id);
      toast.success("User updated");
      setUsersCache({});
      fetchUsers(false, false);
    } catch {
      toast.error("Update failed");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setUsersCache({});
    try {
      await fetchUsers(false, false); // force real request
      toast.success("Users refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const container = document.getElementById("dashboard-scroll-container");

    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [filters.page]);

  /* ================= LOADING ================= */

  if (loading && !refreshing) {
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
          className="border px-3 py-2 rounded-md w-full"
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
        <div className="w-fit flex items-center gap-4">
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

      </div>

      <div className="w-full flex items-center justify-end">
        <button onClick={handleRefresh} disabled={refreshing} className="ml-auto mr-0 bg-gradient-to-br from-cyan-600 to-cyan-300 p-3 w-fit rounded-md text-white cursor-pointer group">
          <FaSyncAlt className={`${refreshing ? 'animate-spin' : ''} group-hover:rotate-180 duration-300 ease-in-out`} />
        </button>
      </div>

      {/* USERS GRID */}
      {users?.users?.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-white rounded-md border font-medium">
          No users found
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {
            filterLoading ?
              <div className="w-full min-h-[50vh] col-span-3 flex items-center justify-center">
                <Loader size={30} />
              </div>
              :
              users?.users?.map((u) => (
                <UserCard
                  key={u._id}
                  user={u}
                  loading={statusLoadingId === u._id}
                  onToggle={handleToggleStatus}
                />
              ))}
        </div>
      )}
      {users?.pagination?.totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2 pt-6">

          <button
            disabled={users.pagination.page === 1}
            onClick={() =>
              setFilters({
                ...filters,
                page: users.pagination.page - 1,
              })
            }
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>

          {getVisiblePages(
            users.pagination.page,
            users.pagination.totalPages
          ).map((page, index) =>
            page === "..." ? (
              <span key={index} className="px-3 py-1">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => setFilters({ ...filters, page })}
                className={`px-3 py-1 border rounded ${page === users.pagination.page
                  ? "bg-black text-white"
                  : ""
                  }`}
              >
                {page}
              </button>
            )
          )}

          <button
            disabled={
              users.pagination.page === users.pagination.totalPages
            }
            onClick={() =>
              setFilters({
                ...filters,
                page: users.pagination.page + 1,
              })
            }
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>

        </div>
      )}
    </div>
  );
}
