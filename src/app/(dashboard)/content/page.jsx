"use client";

import { useEffect, useState } from "react";
import {
    getContent,
    updateMainContent,
    addContentSection,
    updateContentSection,
    deleteContentSection,
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";

export default function ContentManagementPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Main Content States
    const [aboutTitle, setAboutTitle] = useState("");
    const [aboutDescription, setAboutDescription] = useState("");
    const [aboutSecondary, setAboutSecondary] = useState("");

    const [visionTitle, setVisionTitle] = useState("");
    const [visionDescription, setVisionDescription] = useState("");

    const [missionTitle, setMissionTitle] = useState("");
    const [missionDescription, setMissionDescription] = useState("");

    // Terms & Privacy States
    const [termsOfUse, setTermsOfUse] = useState([]);
    const [privacyPolicy, setPrivacyPolicy] = useState([]);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("");
    const [modalMode, setModalMode] = useState("");
    const [editingSection, setEditingSection] = useState(null);
    const [modalTitle, setModalTitle] = useState("");
    const [modalDescription, setModalDescription] = useState("");

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            setLoading(true);
            const res = await getContent();
            
            if (res.success) {
                const { aboutUs, vision, mission, termsOfUse, privacyPolicy } = res.data;

                setAboutTitle(aboutUs?.title || "");
                setAboutDescription(aboutUs?.description || "");
                setAboutSecondary(aboutUs?.secondaryDescription || "");

                setVisionTitle(vision?.title || "");
                setVisionDescription(vision?.description || "");

                setMissionTitle(mission?.title || "");
                setMissionDescription(mission?.description || "");

                setTermsOfUse(termsOfUse || []);
                setPrivacyPolicy(privacyPolicy || []);
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.response?.data?.message || "فشل تحميل المحتوى");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMainContent = async (e) => {
        e.preventDefault();

        if (!aboutTitle || !aboutDescription || !visionTitle || !visionDescription || !missionTitle || !missionDescription) {
            return toast.error("جميع الحقول الأساسية مطلوبة");
        }

        try {
            setSaving(true);
            const res = await updateMainContent({
                aboutUs: {
                    title: aboutTitle,
                    description: aboutDescription,
                    secondaryDescription: aboutSecondary
                },
                vision: {
                    title: visionTitle,
                    description: visionDescription
                },
                mission: {
                    title: missionTitle,
                    description: missionDescription
                }
            });

            if (res.success) {
                toast.success("تم تحديث المحتوى بنجاح");
                fetchContent();
            } else {
                toast.error(res.message || "فشل تحديث المحتوى");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.response?.data?.message || "حدث خطأ أثناء التحديث");
        } finally {
            setSaving(false);
        }
    };

    const openAddModal = (type) => {
        setModalType(type);
        setModalMode("add");
        setModalTitle("");
        setModalDescription("");
        setShowModal(true);
    };

    const openEditModal = (type, section) => {
        setModalType(type);
        setModalMode("edit");
        setEditingSection(section);
        setModalTitle(section.title);
        setModalDescription(section.description);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType("");
        setModalMode("");
        setEditingSection(null);
        setModalTitle("");
        setModalDescription("");
    };

    const handleSaveSection = async () => {
        if (!modalTitle || !modalDescription) {
            return toast.error("العنوان والوصف مطلوبان");
        }

        try {
            setSaving(true);

            if (modalMode === "add") {
                const res = await addContentSection({
                    type: modalType,
                    title: modalTitle,
                    description: modalDescription
                });

                if (res.success) {
                    toast.success("تم إضافة القسم بنجاح");
                    fetchContent();
                    closeModal();
                } else {
                    toast.error(res.message || "فشل إضافة القسم");
                }
            } else if (modalMode === "edit") {
                const res = await updateContentSection({
                    type: modalType,
                    sectionId: editingSection._id,
                    title: modalTitle,
                    description: modalDescription
                });

                if (res.success) {
                    toast.success("تم تحديث القسم بنجاح");
                    fetchContent();
                    closeModal();
                } else {
                    toast.error(res.message || "فشل تحديث القسم");
                }
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.response?.data?.message || "حدث خطأ أثناء الحفظ");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSection = async (type, sectionId) => {
        if (!confirm("هل أنت متأكد من حذف هذا القسم؟")) return;

        try {
            const res = await deleteContentSection({
                type,
                sectionId
            });

            if (res.success) {
                toast.success("تم حذف القسم بنجاح");
                fetchContent();
            } else {
                toast.error(res.message || "فشل حذف القسم");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.response?.data?.message || "حدث خطأ أثناء الحذف");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 h-full w-full">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl">
            {/* Main Content Form */}
            <div className="bg-white shadow-sm rounded-md p-6">
                <h2 className="text-2xl font-bold mb-6">المحتوى الأساسي</h2>

                <form onSubmit={handleSaveMainContent} className="space-y-6">
                    {/* About Us */}
                    <div className="border-b pb-6">
                        <h3 className="text-lg font-semibold mb-4">من نحن</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">العنوان</label>
                                <input
                                    type="text"
                                    className="border px-3 py-2 w-full rounded-md"
                                    value={aboutTitle}
                                    onChange={(e) => setAboutTitle(e.target.value)}
                                    placeholder="من نحن"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">الوصف الرئيسي</label>
                                <textarea
                                    className="border px-3 py-2 w-full rounded-md min-h-[120px]"
                                    value={aboutDescription}
                                    onChange={(e) => setAboutDescription(e.target.value)}
                                    placeholder="الوصف الرئيسي..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">الوصف الثانوي</label>
                                <textarea
                                    className="border px-3 py-2 w-full rounded-md min-h-[100px]"
                                    value={aboutSecondary}
                                    onChange={(e) => setAboutSecondary(e.target.value)}
                                    placeholder="الوصف الثانوي..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vision */}
                    <div className="border-b pb-6">
                        <h3 className="text-lg font-semibold mb-4">رؤيتنا</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">العنوان</label>
                                <input
                                    type="text"
                                    className="border px-3 py-2 w-full rounded-md"
                                    value={visionTitle}
                                    onChange={(e) => setVisionTitle(e.target.value)}
                                    placeholder="رؤيتنا"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">الوصف</label>
                                <textarea
                                    className="border px-3 py-2 w-full rounded-md min-h-[120px]"
                                    value={visionDescription}
                                    onChange={(e) => setVisionDescription(e.target.value)}
                                    placeholder="الوصف..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mission */}
                    <div className="border-b pb-6">
                        <h3 className="text-lg font-semibold mb-4">مهمتنا</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">العنوان</label>
                                <input
                                    type="text"
                                    className="border px-3 py-2 w-full rounded-md"
                                    value={missionTitle}
                                    onChange={(e) => setMissionTitle(e.target.value)}
                                    placeholder="مهمتنا"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">الوصف</label>
                                <textarea
                                    className="border px-3 py-2 w-full rounded-md min-h-[120px]"
                                    value={missionDescription}
                                    onChange={(e) => setMissionDescription(e.target.value)}
                                    placeholder="الوصف..."
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-gradient-to-br from-black to-black/70 text-white px-6 py-3 rounded-md flex items-center gap-2 disabled:opacity-60 hover:-translate-y-1 transition-all"
                    >
                        {saving ? (
                            <>
                                <Loader size={16} color="#fff" /> جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <FaSave /> حفظ المحتوى الأساسي
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Terms of Use */}
            <div className="bg-white shadow-sm rounded-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">شروط الاستخدام</h2>
                    <button
                        onClick={() => openAddModal("termsOfUse")}
                        className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-black/80 transition-all"
                    >
                        <FaPlus /> إضافة قسم
                    </button>
                </div>

                <div className="space-y-4">
                    {termsOfUse.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا توجد أقسام بعد</p>
                    ) : (
                        termsOfUse.map((term) => (
                            <div key={term._id} className="border rounded-md p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg">{term.title}</h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal("termsOfUse", term)}
                                            className="text-blue-600 hover:text-blue-800 p-2"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSection("termsOfUse", term._id)}
                                            className="text-red-600 hover:text-red-800 p-2"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-gray-700">{term.description}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Privacy Policy */}
            <div className="bg-white shadow-sm rounded-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">سياسة الخصوصية</h2>
                    <button
                        onClick={() => openAddModal("privacyPolicy")}
                        className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-black/80 transition-all"
                    >
                        <FaPlus /> إضافة قسم
                    </button>
                </div>

                <div className="space-y-4">
                    {privacyPolicy.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا توجد أقسام بعد</p>
                    ) : (
                        privacyPolicy.map((policy) => (
                            <div key={policy._id} className="border rounded-md p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg">{policy.title}</h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal("privacyPolicy", policy)}
                                            className="text-blue-600 hover:text-blue-800 p-2"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSection("privacyPolicy", policy._id)}
                                            className="text-red-600 hover:text-red-800 p-2"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-gray-700">{policy.description}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">
                                    {modalMode === "add" ? "إضافة قسم جديد" : "تعديل القسم"}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">العنوان</label>
                                    <input
                                        type="text"
                                        className="border px-3 py-2 w-full rounded-md"
                                        value={modalTitle}
                                        onChange={(e) => setModalTitle(e.target.value)}
                                        placeholder="عنوان القسم"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">الوصف</label>
                                    <textarea
                                        className="border px-3 py-2 w-full rounded-md min-h-[200px]"
                                        value={modalDescription}
                                        onChange={(e) => setModalDescription(e.target.value)}
                                        placeholder="وصف القسم..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleSaveSection}
                                    disabled={saving}
                                    className="flex-1 bg-black text-white px-4 py-3 rounded-md flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-black/80 transition-all"
                                >
                                    {saving ? (
                                        <>
                                            <Loader size={16} color="#fff" /> جاري الحفظ...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave /> حفظ
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-md hover:bg-gray-300 transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}