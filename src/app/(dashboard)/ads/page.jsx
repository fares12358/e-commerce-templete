"use client";

import { useEffect, useState, useRef } from "react";
import { getAds, createAd, updateAd, deleteAd } from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FaBullhorn, FaEdit, FaTrash, FaTimes, FaImage, FaLink } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { compressImage } from "@/utils/helper";

export default function AdsPage() {
  const { ads, setAds } = useAuth();
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
  const [deleting, setDeleting] = useState(false);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const res = await getAds();
      if (res.success) setAds(res.data);
    } catch (err) { toast.error(err.message || "Failed to load ads"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (ads.length > 0) return; fetchAds(); }, []);

  const resetForm = () => { setTitle(""); setDescription(""); setImage(null); setPreview(null); setEditingId(null); setTag(""); setLink(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return toast.error("All fields are required");
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("tag", tag);
      formData.append("link", link);
      if (image) formData.append("image", image);
      if (editingId) { await updateAd(editingId, formData); toast.success("Ad updated"); }
      else { if (!image) return toast.error("Image is required"); await createAd(formData); toast.success("Ad added"); }
      resetForm(); fetchAds();
    } catch (err) { toast.error(err.message || "Something went wrong"); }
    finally { setSaving(false); }
  };

  const handleEdit = (ad) => {
    setEditingId(ad._id); setTitle(ad.title); setDescription(ad.description);
    setTag(ad.tag || ""); setPreview(ad.image.url); setLink(ad.link || "");
    const el = document.getElementById("dashboard-scroll-container");
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => tagInputRef.current?.focus(), 300);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteAd(deleteId);
      toast.success("Ad deleted");
      fetchAds();
    } catch (err) { toast.error(err.message || "Delete failed"); }
    finally { setDeleting(false); setShowConfirm(false); setDeleteId(null); }
  };

  if (loading) return <div className="flex justify-center items-center py-20 h-screen w-full"><Loader /></div>;

  return (
    <div className="space-y-5">

      {/* Form */}
      <div className="d-card">
        <h2 className="page-title mb-4">{editingId ? "Edit Ad" : "Add New Ad"}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="section-label block mb-1.5">Tag (optional)</label>
              <input ref={tagInputRef} className="d-input" placeholder="e.g. Special Offer" value={tag} onChange={e => setTag(e.target.value)} />
            </div>
            <div>
              <label className="section-label block mb-1.5">Product ID Link (optional)</label>
              <input className="d-input" placeholder="Product ID" value={link} onChange={e => setLink(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="section-label block mb-1.5">Title</label>
            <input className="d-input" placeholder="Ad title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="section-label block mb-1.5">Description</label>
            <textarea className="d-input" rows={3} placeholder="Ad description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          {/* Image upload */}
          <div>
            <label className="section-label block mb-1.5">Image</label>
            <input type="file" ref={fileRef} accept="image/*" className="hidden"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                setPreview(URL.createObjectURL(file));
                const compressed = await compressImage(file, 1600, 1);
                setImage(compressed || file);
              }}
            />
            <button type="button" onClick={() => fileRef.current.click()} className="d-btn d-btn-outline gap-2">
              <FaImage size={12} /> {preview ? "Change Image" : "Select Image"}
            </button>
            {preview && (
              <div className="relative w-fit mt-2">
                <img src={preview} className="w-28 h-20 object-cover rounded-lg border" style={{ borderColor: "var(--border)" }} />
                <button type="button" onClick={() => { setPreview(null); setImage(null); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer border-none">
                  <FaTimes size={9} />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button disabled={saving} className="d-btn d-btn-primary gap-2">
              {saving ? <><Loader size={14} color="#fff" /> Saving...</> : editingId ? "Update Ad" : "Add Ad"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="d-btn d-btn-outline">Cancel</button>
            )}
          </div>
        </form>
      </div>

      {/* Ads list */}
      {!ads.length ? (
        <div className="d-empty">No ads yet</div>
      ) : (
        <div className="grid xl:grid-cols-2 grid-cols-1 gap-3">
          {ads.map((ad) => (
            <div key={ad._id} className="d-card flex items-start gap-3">
              <img src={ad.image.url} className="w-24 h-16 object-cover rounded-lg shrink-0" style={{ border: "1px solid var(--border)" }} />
              <div className="flex-1 min-w-0">
                {ad.tag && (
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1"
                    style={{ background: "#eff6ff", color: "var(--accent)" }}>
                    {ad.tag}
                  </span>
                )}
                <p className="font-semibold text-[13px] text-slate-900 truncate">{ad.title}</p>
                <p className="text-[12px] text-slate-500 line-clamp-2 mt-0.5">{ad.description}</p>
                {ad.link && (
                  <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: "var(--accent)" }}>
                    <FaLink size={9} /> {ad.link}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => handleEdit(ad)} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none" style={{ background: "#eff6ff", color: "var(--accent)" }} title="Edit">
                  <FaEdit size={11} />
                </button>
                <button onClick={() => { setDeleteId(ad._id); setShowConfirm(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none" style={{ background: "#fee2e2", color: "#b91c1c" }} title="Delete">
                  <FaTrash size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={showConfirm}
        title="Delete Ad"
        message="Are you sure you want to delete this ad?"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
        loading={deleting}
      />
    </div>
  );
}
