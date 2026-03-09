"use client";

import { useEffect, useState, useRef } from "react";
import {
  getAds,
  createAd,
  updateAd,
  deleteAd
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FaBullhorn } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { compressImage } from "@/utils/helper";

export default function AdsPage() {
  const { ads, setAds } = useAuth()
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const tagInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [tag, setTag] = useState("");
  const [link, setLink] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [preview, setPreview] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false)

  const fetchAds = async () => {
    try {
      setLoading(true)
      const res = await getAds();
      if (res.success) setAds(res.data);
    } catch (err) {
      toast.error(err.message || "Failed to load ads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ads.length > 0) return
    fetchAds();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImage(null);
    setPreview(null);
    setEditingId(null);
    setTag("");
    setLink('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description)
      return toast.error("All fields are required");

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("tag", tag);
      formData.append("link", link);

      if (image) formData.append("image", image);

      if (editingId) {
        await updateAd(editingId, formData);
        toast.success("Ad updated successfully");
      } else {
        if (!image) return toast.error("Image is required");
        await createAd(formData);
        toast.success("Ad added successfully");
      }

      resetForm();
      fetchAds();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };
  
  const handleEdit = (ad) => {
    setEditingId(ad._id);
    setTitle(ad.title);
    setDescription(ad.description);
    setTag(ad.tag || "");
    setPreview(ad.image.url);

    // 🔥 Scroll to top (dashboard container)
    const container = document.getElementById("dashboard-scroll-container");
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    // 🔥 Focus after slight delay (wait for render)
    setTimeout(() => {
      tagInputRef.current?.focus();
    }, 300);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true)
      await deleteAd(deleteId);
      toast.success("Ad deleted successfully");
      fetchAds();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false)
      setShowConfirm(false);
      setDeleteId(null);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 h-screen w-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">

      {/* ===== FORM ===== */}
      <div className="bg-white p-4 rounded-md shadow-sm">

        <h2 className="mb-4 font-medium">
          <div
            className='bg-gradient-to-br from-teal-800 to-teal-400 shadow-md text-white rotate-12 w-16 h-16 flex items-center justify-center rounded-xl -translate-y-5 -translate-x-5'
          >
            <span className="-rotate-12">
              <FaBullhorn
                size={25} className="drop-shadow-md" />
            </span>
          </div>
          {editingId ? "Edit Ad" : "Add New Ad"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={tagInputRef}
            className="border px-3 py-2 w-full rounded-md"
            placeholder="Tag (example: Special Offer)"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />

          <input
            className="border px-3 py-2 w-full rounded-md"
            placeholder="Product ID (optional link)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />

          <input
            className="border px-3 py-2 w-full rounded-md"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="border px-3 py-2 w-full rounded-md"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;

              // Show instant preview
              setPreview(URL.createObjectURL(file));

              // Compress image before saving
              const compressed = await compressImage(file, 1600, 1);

              setImage(compressed || file);
            }}
          />

          <button
            type="button"
            onClick={() => fileRef.current.click()}
            className="border px-4 py-2 rounded-md hover:bg-gray-100 transition w-fit block"
          >
            {preview ? "Change Image" : "Select Ad Image"}

          </button>

          {preview && (
            <img
              src={preview}
              className="w-24 h-24 object-contain rounded-md border"
            />
          )}

          <div className="gap-2 flex items-center justify-start">
            <button
              disabled={saving}
              className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Add"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="border px-4 py-2 rounded-md hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>

      {/* ===== ADS LIST ===== */}
      <div className="grid xl:grid-cols-2 grid-cols-1 gap-4 items-start justify-start w-full">
        {ads.map((ad) => (
          <div
            key={ad._id}
            className="bg-white p-4 rounded-md shadow-sm flex flex-col md:flex-row items-start justify-start gap-4"
          >
            <img
              src={ad.image.url}
              className="w-24 h-16 object-cover rounded-md"
            />

            <div className="flex-1 gap-1 flex flex-col">
              {ad.tag && (
                <span className="text-xs bg-gray-200 w-fit px-2 py-1 rounded-md">
                  {ad.tag}
                </span>
              )}
              <h3 className="font-medium">{ad.title}</h3>
              <p className="text-sm text-gray-600">{ad.description}</p>
              <p className="text-sm text-gray-600">{ad.link}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(ad)}
                className="px-4 py-1 rounded-md bg-gradient-to-br from-blue-800 to-blue-400 text-white hover:-translate-y-1 ease-in-out duration-300 transition"
              >
                Edite
              </button>

              <button
                onClick={() => handleDeleteClick(ad._id)}
                className="px-4 py-1 rounded-md bg-gradient-to-br from-red-800 to-red-400 text-white hover:-translate-y-1 ease-in-out duration-300 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmModal
        open={showConfirm}
        title="Confirm Delete"
        message="Are you sure you want to delete this ad?"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
        loading={deleting}
      />
    </div>
  );
}
