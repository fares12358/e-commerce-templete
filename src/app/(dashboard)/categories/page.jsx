"use client";

import { useEffect, useRef, useState } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory, CategoryStatus } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import { compressImage } from "@/utils/helper";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { motion } from "framer-motion";
import { FaImage, FaTrash, FaEdit, FaTimes, FaCheck } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import CustomSelect from "@/components/ui/CustomSelect";

export default function CategoriesPage() {
  const { categories, setCategories } = useAuth();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("new");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileRef = useRef(null);
  const nameInputRef = useRef(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await getCategories();
      if (res.success) setCategories(res.data);
    } catch { toast.error("Failed to load categories"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (categories.length > 0) return; fetchCategories(); }, []);

  const filteredCategories = categories
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortOrder === "new"
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : new Date(a.createdAt) - new Date(b.createdAt));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Category name is required");
    if (!editingId && !image) return toast.error("Category image is required");
    const formData = new FormData();
    formData.append("name", name);
    if (image) formData.append("image", image);
    try {
      setSubmitting(true);
      editingId ? await updateCategory(editingId, formData) : await createCategory(formData);
      toast.success(editingId ? "Updated successfully" : "Created successfully");
      setName(""); setImage(null); setPreview(null); setEditingId(null);
      fetchCategories();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (cat) => {
    setEditingId(cat._id); setName(cat.name);
    nameInputRef.current?.focus();
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteCategory(deleteId);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) { toast.error(err.message || "Category linked with products"); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  const toggleStatus = async (id) => {
    try {
      setStatusLoadingId(id);
      await CategoryStatus(id);
      fetchCategories();
    } catch { toast.error("Failed to update status"); }
    finally { setStatusLoadingId(null); }
  };

  if (loading) return <div className="flex justify-center items-center py-20 h-full w-full"><Loader /></div>;

  return (
    <div className="space-y-5">

      {/* Form */}
      <div className="d-card">
        <h2 className="page-title mb-4">{editingId ? "Edit Category" : "Add Category"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="section-label block mb-1.5">Category Name</label>
            <input
              ref={nameInputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Electronics"
              className="d-input"
            />
          </div>

          <div>
            <label className="section-label block mb-1.5">Image</label>
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              className="d-btn d-btn-outline gap-2"
            >
              <FaImage size={12} />
              {preview ? "Change Image" : "Upload Image"}
            </button>
            <input
              ref={fileRef} type="file" hidden accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                setPreview(URL.createObjectURL(file));
                const compressed = await compressImage(file);
                setImage(compressed || file);
              }}
            />
            {preview && (
              <div className="mt-2 relative w-fit">
                <img src={preview} className="h-20 w-20 object-cover rounded-lg border" style={{ borderColor: "var(--border)" }} />
                <button
                  type="button"
                  onClick={() => { setPreview(null); setImage(null); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer border-none"
                >
                  <FaTimes size={9} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button disabled={submitting} className="d-btn d-btn-primary gap-2">
              {submitting ? <><Loader size={14} color="#fff" /> Processing...</> : editingId ? <><FaCheck size={11} /> Update</> : "Create"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setName(""); setPreview(null); setImage(null); }} className="d-btn d-btn-outline">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filter */}
      <div className="d-card flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="d-input flex-1"
        />
        <CustomSelect
          value={sortOrder}
          placeholder="Sort"
          onChange={setSortOrder}
          options={[{ label: "Newest First", value: "new" }, { label: "Oldest First", value: "old" }]}
        />
      </div>

      {/* Grid */}
      {!filteredCategories.length ? (
        <div className="d-empty">No categories found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredCategories.map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-xl p-3 flex items-center gap-3"
              style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <img src={cat.image?.url} className="w-14 h-14 object-cover rounded-lg shrink-0" style={{ border: "1px solid var(--border)" }} />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-[13px] text-slate-900 truncate mb-1.5">{cat.name}</p>
                <button
                  onClick={() => toggleStatus(cat._id)}
                  disabled={statusLoadingId === cat._id}
                  className="d-btn text-[11px] px-3 py-1"
                  style={{
                    background: cat.isActive ? "#dcfce7" : "#fee2e2",
                    color: cat.isActive ? "#15803d" : "#b91c1c",
                    border: "none",
                  }}
                >
                  {statusLoadingId === cat._id ? <Loader size={12} color={cat.isActive ? "#15803d" : "#b91c1c"} /> : cat.isActive ? "Active" : "Disabled"}
                </button>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => handleEdit(cat)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none transition-colors"
                  style={{ background: "#eff6ff", color: "var(--accent)" }}
                  title="Edit"
                >
                  <FaEdit size={11} />
                </button>
                <button
                  onClick={() => setDeleteId(cat._id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none transition-colors"
                  style={{ background: "#fee2e2", color: "#b91c1c" }}
                  title="Delete"
                >
                  <FaTrash size={11} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="Delete category"
        message="This category may be linked to products. Continue?"
        loading={deleteLoading}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
