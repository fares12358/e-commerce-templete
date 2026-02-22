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

export default function AdsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef();

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
      const res = await getAds();
      if (res.success) setAds(res.data);
    } catch {
      toast.error("فشل تحميل الإعلانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      return toast.error("جميع الحقول مطلوبة");

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
        toast.success("تم تحديث الإعلان");
      } else {
        if (!image) return toast.error("الصورة مطلوبة");
        await createAd(formData);
        toast.success("تم إضافة الإعلان");
      }

      resetForm();
      fetchAds();
    } catch {
      toast.error("حدث خطأ");
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

  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true)
      await deleteAd(deleteId);
      toast.success("تم حذف الإعلان");
      fetchAds();
    } catch {
      toast.error("فشل الحذف");
    } finally {
      setDeleting(false)
      setShowConfirm(false);
      setDeleteId(null);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">

      {/* ===== FORM ===== */}
      <div className="bg-white p-4 rounded-md shadow-sm">
        <h2 className="mb-4 font-medium">
          {editingId ? "تعديل إعلان" : "إضافة إعلان جديد"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="border px-3 py-2 w-full rounded-md"
            placeholder="التصنيف (مثال: عرض خاص)"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />

          <input
            dir="rtl"
            className="border px-3 py-2 w-full rounded-md"
            placeholder="id الخاص بالمنتج"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />

          <input
            className="border px-3 py-2 w-full rounded-md"
            placeholder="العنوان"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="border px-3 py-2 w-full rounded-md"
            placeholder="الوصف"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              setImage(file);

              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result);
                reader.readAsDataURL(file);
              }
            }}
          />

          <button
            type="button"
            onClick={() => fileRef.current.click()}
            className="border px-4 py-2 rounded-md hover:bg-gray-100 transition w-fit block"
          >
            {preview ? "تغيير الصورة" : "اختيار صورة الإعلان"}

          </button>

          {preview && (
            <img
              src={preview}
              className="w-40 h-24 object-cover rounded-md border"
            />
          )}

          <div className="gap-2 flex items-center justify-start">
            <button
              disabled={saving}
              className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : editingId ? "تحديث" : "إضافة"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="border px-4 py-2 rounded-md hover:bg-gray-100 transition"
            >
              إلغاء
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
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(ad)}
                className="px-3 py-1 border rounded-md"
              >
                تعديل
              </button>

              <button
                onClick={() => handleDeleteClick(ad._id)}
                className="px-3 py-1 border text-red-600 rounded-md"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmModal
        open={showConfirm}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا الإعلان؟"
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
        loading={deleting}
      />
    </div>
  );
}
