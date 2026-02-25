"use client";

import { useEffect, useRef, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryStatus,
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import { compressImage } from "@/utils/helper";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { motion } from "framer-motion";
import { FaImage, FaTrash, FaEdit, FaStore } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import CustomSelect from "@/components/ui/CustomSelect";

export default function CategoriesPage() {
  const { categories, setCategories } = useAuth()
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("new"); // new | old
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
      const res = await getCategories();
      if (res.success) setCategories(res.data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories
    .filter((cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "new") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Category name is required");
    if (!editingId && !image) return toast.error("Category image is required");

    const formData = new FormData();
    formData.append("name", name);
    if (image) formData.append("image", image);

    try {
      setSubmitting(true);

      editingId
        ? await updateCategory(editingId, formData)
        : await createCategory(formData);

      toast.success(editingId ? "Updated successfully" : "Created successfully");

      setName("");
      setImage(null);
      setPreview(null);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat._id);
    setName(cat.name);
    nameInputRef.current?.focus();
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteCategory(deleteId);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Category linked with products");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const toggleStatus = async (id) => {
    try {
      setStatusLoadingId(id);
      await CategoryStatus(id);
      fetchCategories();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusLoadingId(null);
    }
  };

  useEffect(() => {
    if (categories.length > 0) return
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 h-full w-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* ===== ADD FORM ===== */}
      <div className="bg-white border rounded-md p-5">
        <h2 className="font-medium mb-4">

          <div className="bg-gradient-to-br from-teal-800 to-teal-400 shadow-md text-white rotate-12 w-16 h-16 flex items-center justify-center rounded-xl -translate-y-5 -translate-x-5">
            <span className="-rotate-12 text-2xl">
              <FaStore className="drop-shadow-md" size={30} />
            </span>
          </div>
          {editingId ? "Edit Category" : "Add Category"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            ref={nameInputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="w-full border rounded-md px-3 py-2 outline-none"
          />

          {/* Custom Upload */}
          <div
            onClick={() => fileRef.current.click()}
            className="flex items-center gap-2 border rounded-md px-4 py-2 cursor-pointer hover:bg-gray-50 w-fit"
          >
            <FaImage />
            <span>Upload image</span>
          </div>

          <input
            ref={fileRef}
            type="file"
            hidden
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;

              setPreview(URL.createObjectURL(file));
              const compressed = await compressImage(file);
              setImage(compressed || file);
            }}
          />

          {preview && (
            <img
              src={preview}
              className="h-20 w-20 object-cover border rounded"
            />
          )}

          <button
            disabled={submitting}
            className="bg-gradient-to-br from-black to-black/70 text-white px-5 py-2 rounded-md hover:-translate-y-1 transition duration-300"
          >
            {submitting ? "Processing..." : editingId ? "Update" : "Create"}
          </button>
        </form>
      </div>


      {/* ===== FILTER & SORT ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border rounded-md p-4">

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="border rounded-md px-3 py-2 outline-none w-full"
        />

        {/* Sort using CustomSelect */}
        <CustomSelect
          className={'ml-auto mr-0'}
          value={sortOrder}
          placeholder="Sort"
          onChange={setSortOrder}
          options={[
            { label: "Newest First", value: "new" },
            { label: "Oldest First", value: "old" }
          ]}
        />

      </div>

      {/* ===== CATEGORIES GRID ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {filteredCategories.length == 0 ?
          <div className="w-full h-fit py-5 flex items-center justify-center text-gray-500 font-semibold col-span-3 bg-white rounded-md border">
            No Category Found
          </div>
          :
          filteredCategories.map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-start gap-4 rounded-md p-4 shadow-md bg-white border"
            >
              <img
                src={cat.image?.url}
                className="size-20 md:size-28 object-cover rounded-md"
              />

              <div className="flex items-start justify-evenly h-full flex-col">
                <h3 className="font-medium mb-2 max-w-full overflow-hidden">{cat.name}</h3>

                {/* Status */}
                <button
                  onClick={() => toggleStatus(cat._id)}
                  disabled={statusLoadingId === cat._id}
                  className={`text-xs font-semibold px-5 py-2 rounded-md hover:-translate-y-1 transition duration-300 ${cat.isActive ? "bg-gradient-to-br from-green-700 to-green-400 text-white" : "bg-gradient-to-br from-red-700 to-red-400 text-white"
                    }`}
                >
                  {statusLoadingId === cat._id ? "..." : cat.isActive ? "Active" : "Disabled"}
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center justify-evenly h-full ml-auto mr-0">
                <button
                  onClick={() => handleEdit(cat)}
                  className="flex items-center gap-1 bg-gradient-to-br from-blue-700 to-blue-400 text-white text-xs font-semibold px-5 py-2 rounded-md hover:-translate-y-1 transition duration-300"
                >
                  <FaEdit />
                </button>

                <button
                  onClick={() => setDeleteId(cat._id)}
                  className="flex items-center gap-1 bg-gradient-to-br from-red-700 to-red-400 text-white text-xs font-semibold px-5 py-2 rounded-md hover:-translate-y-1 transition duration-300"
                >
                  <FaTrash />
                </button>
              </div>
            </motion.div>
          ))}

      </div>

      {/* ===== CONFIRM DELETE ===== */}
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
