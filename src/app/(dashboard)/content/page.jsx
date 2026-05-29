"use client";

import { useEffect, useState } from "react";
import {
  getContent, updateMainContent,
  addContentSection, updateContentSection, deleteContentSection,
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import ConfirmModal from "@/components/ui/ConfirmModal";

/* ─── tiny field wrapper ─────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="section-label block">{label}</label>
      {children}
    </div>
  );
}

export default function ContentManagementPage() {
  const { contentCache, setContentCache } = useAuth();
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  /* main content */
  const [aboutTitle,       setAboutTitle]       = useState("");
  const [aboutDescription, setAboutDescription] = useState("");
  const [aboutSecondary,   setAboutSecondary]   = useState("");
  const [visionTitle,      setVisionTitle]      = useState("");
  const [visionDescription,setVisionDescription]= useState("");
  const [missionTitle,     setMissionTitle]     = useState("");
  const [missionDescription,setMissionDescription]=useState("");

  /* sections */
  const [termsOfUse,    setTermsOfUse]    = useState([]);
  const [privacyPolicy, setPrivacyPolicy] = useState([]);

  /* confirm */
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [confirmType,   setConfirmType]   = useState(null);
  const [confirmData,   setConfirmData]   = useState(null);
  const [confirmLoading,setConfirmLoading]= useState(false);

  /* modal */
  const [showModal,         setShowModal]         = useState(false);
  const [modalType,         setModalType]         = useState("");
  const [modalMode,         setModalMode]         = useState("");
  const [editingSection,    setEditingSection]    = useState(null);
  const [modalTitle,        setModalTitle]        = useState("");
  const [modalDescription,  setModalDescription]  = useState("");

  /* ─── helpers ─── */
  const applyContent = (data) => {
    const { aboutUs, vision, mission, termsOfUse: t, privacyPolicy: p } = data;
    setAboutTitle(aboutUs?.title || ""); setAboutDescription(aboutUs?.description || ""); setAboutSecondary(aboutUs?.secondaryDescription || "");
    setVisionTitle(vision?.title || ""); setVisionDescription(vision?.description || "");
    setMissionTitle(mission?.title || ""); setMissionDescription(mission?.description || "");
    setTermsOfUse(t || []); setPrivacyPolicy(p || []);
  };

  const fetchContent = async () => {
    try {
      setLoading(true);
      if (contentCache) { applyContent(contentCache); return; }
      const res = await getContent();
      if (res.success) { applyContent(res.data); setContentCache(res.data); }
    } catch { toast.error("Failed to load content"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContent(); }, []);

  /* ─── save main ─── */
  const handleSaveMainContent = async (e) => {
    e.preventDefault();
    if (!aboutTitle || !aboutDescription || !visionTitle || !visionDescription || !missionTitle || !missionDescription)
      return toast.error("All main fields are required");
    try {
      setSaving(true);
      const res = await updateMainContent({
        aboutUs:  { title: aboutTitle, description: aboutDescription, secondaryDescription: aboutSecondary },
        vision:   { title: visionTitle,  description: visionDescription },
        mission:  { title: missionTitle, description: missionDescription },
      });
      if (res.success) {
        toast.success("Content updated");
        const fresh = await getContent();
        if (fresh.success) { applyContent(fresh.data); setContentCache(fresh.data); }
      }
    } catch { toast.error("Failed to update content"); }
    finally { setSaving(false); }
  };

  /* ─── section modal ─── */
  const openAddModal  = (type) => { setModalType(type); setModalMode("add"); setModalTitle(""); setModalDescription(""); setShowModal(true); };
  const openEditModal = (type, section) => { setModalType(type); setModalMode("edit"); setEditingSection(section); setModalTitle(section.title); setModalDescription(section.description); setShowModal(true); };
  const closeModal    = () => { setShowModal(false); setModalType(""); setModalMode(""); setEditingSection(null); setModalTitle(""); setModalDescription(""); };

  const handleSaveSection = async () => {
    if (!modalTitle || !modalDescription) return toast.error("Title and description required");
    try {
      setSaving(true);
      if (modalMode === "add") {
        const res = await addContentSection({ type: modalType, title: modalTitle, description: modalDescription });
        if (res.success) { toast.success("Section added"); }
      } else {
        const res = await updateContentSection({ type: modalType, sectionId: editingSection._id, title: modalTitle, description: modalDescription });
        if (res.success) { toast.success("Section updated"); }
      }
      const fresh = await getContent();
      if (fresh.success) { applyContent(fresh.data); setContentCache(fresh.data); }
      closeModal();
    } catch { toast.error("Failed to save section"); }
    finally { setSaving(false); }
  };

  /* ─── delete section ─── */
  const handleDeleteSection = (type, sectionId) => { setConfirmType("delete"); setConfirmData({ type, sectionId }); setShowConfirm(true); };

  const handleConfirmAction = async () => {
    if (!confirmType) return;
    try {
      setConfirmLoading(true);
      if (confirmType === "delete") {
        const res = await deleteContentSection({ type: confirmData.type, sectionId: confirmData.sectionId });
        if (res.success) {
          toast.success("Section deleted");
          const fresh = await getContent();
          if (fresh.success) { applyContent(fresh.data); setContentCache(fresh.data); }
        }
      }
    } catch { toast.error("Action failed"); }
    finally { setConfirmLoading(false); setShowConfirm(false); setConfirmType(null); setConfirmData(null); }
  };

  if (loading) return <div className="flex justify-center items-center py-20 h-full w-full"><Loader /></div>;

  /* ─── section list renderer ─── */
  const SectionList = ({ title, type, items }) => (
    <div className="d-card space-y-4">
      <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="page-title">{title}</h2>
        <button onClick={() => openAddModal(type)} className="d-btn d-btn-primary gap-1.5 text-[12px]">
          <FaPlus size={9} /> Add Section
        </button>
      </div>

      {!items.length ? (
        <div className="d-empty">No sections yet</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-semibold text-[13px] text-slate-900 flex-1">{item.title}</h4>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditModal(type, item)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none"
                    style={{ background: "#eff6ff", color: "var(--accent)" }}
                    title="Edit"
                  >
                    <FaEdit size={11} />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(type, item._id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none"
                    style={{ background: "#fee2e2", color: "#b91c1c" }}
                    title="Delete"
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              </div>
              <p className="text-[12px] text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">

      {/* ─── Main Content ─── */}
      <div className="d-card space-y-5">
        <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="page-title">Main Content</h2>
          <p className="page-subtitle">About us, vision, and mission</p>
        </div>

        <form onSubmit={handleSaveMainContent} className="space-y-6">

          {/* About */}
          <div className="space-y-3">
            <p className="text-[12px] font-semibold text-slate-700 uppercase tracking-wide">About Us</p>
            <Field label="Title">
              <input type="text" className="d-input" value={aboutTitle} onChange={e => setAboutTitle(e.target.value)} placeholder="من نحن" />
            </Field>
            <Field label="Main Description">
              <textarea className="d-input" rows={4} value={aboutDescription} onChange={e => setAboutDescription(e.target.value)} placeholder="الوصف الرئيسي..." />
            </Field>
            <Field label="Secondary Description">
              <textarea className="d-input" rows={3} value={aboutSecondary} onChange={e => setAboutSecondary(e.target.value)} placeholder="الوصف الثانوي..." />
            </Field>
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* Vision */}
          <div className="space-y-3">
            <p className="text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Vision</p>
            <Field label="Title">
              <input type="text" className="d-input" value={visionTitle} onChange={e => setVisionTitle(e.target.value)} placeholder="رؤيتنا" />
            </Field>
            <Field label="Description">
              <textarea className="d-input" rows={3} value={visionDescription} onChange={e => setVisionDescription(e.target.value)} placeholder="الوصف..." />
            </Field>
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* Mission */}
          <div className="space-y-3">
            <p className="text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Mission</p>
            <Field label="Title">
              <input type="text" className="d-input" value={missionTitle} onChange={e => setMissionTitle(e.target.value)} placeholder="مهمتنا" />
            </Field>
            <Field label="Description">
              <textarea className="d-input" rows={3} value={missionDescription} onChange={e => setMissionDescription(e.target.value)} placeholder="الوصف..." />
            </Field>
          </div>

          <button type="submit" disabled={saving} className="d-btn d-btn-primary gap-2">
            {saving ? <><Loader size={14} color="#fff" /> Saving...</> : <><FaSave size={11} /> Save Main Content</>}
          </button>
        </form>
      </div>

      {/* ─── Terms of Use ─── */}
      <SectionList title="Terms of Use" type="termsOfUse" items={termsOfUse} />

      {/* ─── Privacy Policy ─── */}
      <SectionList title="Privacy Policy" type="privacyPolicy" items={privacyPolicy} />

      {/* ─── Section Modal ─── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="page-title">
                  {modalMode === "add" ? "Add Section" : "Edit Section"}
                </h3>
                <button onClick={closeModal} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer border-none" style={{ background: "#f8fafc", color: "var(--text-muted)" }}>
                  <FaTimes size={12} />
                </button>
              </div>

              <div className="space-y-3">
                <Field label="Title">
                  <input type="text" className="d-input" value={modalTitle} onChange={e => setModalTitle(e.target.value)} placeholder="Section title" />
                </Field>
                <Field label="Description">
                  <textarea className="d-input" rows={6} value={modalDescription} onChange={e => setModalDescription(e.target.value)} placeholder="Section content..." />
                </Field>
              </div>

              <div className="flex gap-2.5 mt-5">
                <button onClick={handleSaveSection} disabled={saving} className="d-btn d-btn-primary flex-1 gap-2">
                  {saving ? <><Loader size={14} color="#fff" /> Saving...</> : <><FaSave size={11} /> Save</>}
                </button>
                <button onClick={closeModal} className="d-btn d-btn-outline flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm delete ─── */}
      <ConfirmModal
        open={showConfirm}
        title="Delete Section"
        message="Are you sure you want to delete this section?"
        onConfirm={handleConfirmAction}
        onCancel={() => setShowConfirm(false)}
        loading={confirmLoading}
      />
    </div>
  );
}
