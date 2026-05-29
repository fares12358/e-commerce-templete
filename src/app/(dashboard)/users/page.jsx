"use client";

import { useEffect, useState } from "react";
import { getUsers, toggleUserStatus } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import UserCard from "@/components/users/UserCard";
import { toast } from "react-toastify";
import { FaFilter, FaSync } from "react-icons/fa";
import CustomSelect from "@/components/ui/CustomSelect";
import { useAuth } from "@/context/AuthContext";

const generateKey = (f) => JSON.stringify({ email: f.email, isActive: f.isActive, sort: f.sort, page: f.page });

const getVisiblePages = (current, total) => {
  const delta = 1;
  const range = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) range.push(i);
  if (current - delta > 2) range.unshift("...");
  if (current + delta < total - 1) range.push("...");
  const pages = [1, ...range];
  if (total > 1) pages.push(total);
  return pages;
};

export default function UsersPage() {
  const { usersCache, setUsersCache } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ email: "", isActive: "", sort: "desc", page: 1 });
  const [tempFilters, setTempFilters] = useState(filters);

  const fetchUsers = async (isFilter = false, cache = true) => {
    const key = generateKey(filters);
    if (usersCache[key] && cache) { setUsers(usersCache[key]); return; }
    try {
      if (isFilter) setFilterLoading(true);
      else if (!refreshing) setLoading(true);
      const res = await getUsers({ email: filters.email || undefined, isActive: filters.isActive || undefined, sort: filters.sort || "desc", page: filters.page || 1 });
      if (res.success) { setUsers(res.data); setUsersCache(prev => ({ ...prev, [key]: res.data })); }
    } catch { toast.error("Failed to load users"); }
    finally {
      if (isFilter) setFilterLoading(false);
      else if (!refreshing) setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(false); }, []);
  useEffect(() => { fetchUsers(true); }, [filters]);
  useEffect(() => {
    const el = document.getElementById("dashboard-scroll-container");
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
  }, [filters.page]);

  const handleToggleStatus = async (user) => {
    try {
      setStatusLoadingId(user._id);
      await toggleUserStatus(user._id);
      toast.success("User updated");
      setUsersCache({});
      fetchUsers(false, false);
    } catch { toast.error("Update failed"); }
    finally { setStatusLoadingId(null); }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setUsersCache({});
    try { await fetchUsers(false, false); toast.success("Refreshed"); }
    finally { setRefreshing(false); }
  };

  if (loading && !refreshing) return (
    <div className="flex justify-center items-center py-20 h-full w-full"><Loader /></div>
  );

  return (
    <div className="space-y-5">

      {/* Filter */}
      <div className="d-card">
        <p className="section-label mb-3">Filter Users</p>
        <div className="flex flex-wrap gap-2.5 items-end">
          <input
            placeholder="Search by email..."
            className="d-input flex-1 min-w-[200px]"
            value={tempFilters.email}
            onChange={e => setTempFilters({ ...tempFilters, email: e.target.value })}
          />
          <CustomSelect
            placeholder="Sort"
            value={tempFilters.sort}
            onChange={v => setTempFilters({ ...tempFilters, sort: v })}
            options={[{ label: "Newest", value: "desc" }, { label: "Oldest", value: "asc" }]}
          />
          <CustomSelect
            placeholder="Status"
            value={tempFilters.isActive}
            onChange={v => setTempFilters({ ...tempFilters, isActive: v })}
            options={[{ label: "All status", value: "" }, { label: "Active", value: "true" }, { label: "Suspended", value: "false" }]}
          />
          <div className="flex gap-2">
            <button onClick={() => setFilters({ ...tempFilters })} className="d-btn d-btn-primary gap-1.5">
              <FaFilter size={10} /> Apply
            </button>
            <button onClick={() => { const c = { email:"", isActive:"", sort:"desc", page:1 }; setTempFilters(c); setFilters(c); }} className="d-btn d-btn-outline">
              Clear
            </button>
            <button onClick={handleRefresh} disabled={refreshing} className="d-btn d-btn-outline" title="Refresh">
              <FaSync size={11} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filterLoading ? (
        <div className="flex items-center justify-center py-20"><Loader /></div>
      ) : !users?.users?.length ? (
        <div className="d-empty">No users found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {users.users.map(u => (
            <UserCard key={u._id} user={u} loading={statusLoadingId === u._id} onToggle={handleToggleStatus} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {users?.pagination?.totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          <button disabled={users.pagination.page === 1} onClick={() => setFilters({ ...filters, page: users.pagination.page - 1 })} className="d-page-btn">Prev</button>
          {getVisiblePages(users.pagination.page, users.pagination.totalPages).map((p, i) =>
            p === "..." ? <span key={i} className="d-page-btn border-none">…</span> :
            <button key={i} onClick={() => setFilters({ ...filters, page: p })} className={`d-page-btn ${p === users.pagination.page ? "active" : ""}`}>{p}</button>
          )}
          <button disabled={users.pagination.page === users.pagination.totalPages} onClick={() => setFilters({ ...filters, page: users.pagination.page + 1 })} className="d-page-btn">Next</button>
        </div>
      )}
    </div>
  );
}
