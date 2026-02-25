"use client";

import { useEffect, useState } from "react";
import {
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    getConfig,
    updateConfig,
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

export default function AdminProfilePage() {
    const { setAdmin, adminProfileCache,
        setAdminProfileCache,
        configCache,
        setConfigCache } = useAuth();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [configLoading, setConfigLoading] = useState(false);

    /* ================= PROFILE ================= */
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    /* ================= PASSWORD ================= */
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    /* ================= CONFIG ================= */
    const [vat, setVat] = useState("");
    const [deliveryDays, setDeliveryDays] = useState("");
    const [deliveryHours, setDeliveryHours] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [whatsappLink, setWhatsappLink] = useState(""); // Changed to whatsappLink
    const [address, setAddress] = useState("");
    const [shipment, setShipment] = useState("");
    const [simple, setSimple] = useState("");

    const [facebook, setFacebook] = useState("");
    const [twitter, setTwitter] = useState("");
    const [instagram, setInstagram] = useState("");
    const [youtube, setYoutube] = useState("");
    const [telegram, setTelegram] = useState("");
    const [tiktok, setTiktok] = useState("");

    /* ================= LOAD DATA ================= */
    const fetchProfile = async () => {
        try {
            // ✅ Use cache if exists
            if (adminProfileCache) {
                setName(adminProfileCache.name || "");
                setEmail(adminProfileCache.email || "");
                return;
            }

            const res = await getAdminProfile();

            if (res.success) {
                setName(res.data.name || "");
                setEmail(res.data.email || "");
                setAdmin(res.data);

                // 🔥 Save to cache
                setAdminProfileCache(res.data);
            }
        } catch {
            toast.error("Failed to load admin data");
        }
    };

    const applyConfig = (data) => {
        setVat(data.vat ?? "");

        const minutes = data.sendTime || 0;
        const days = Math.floor(minutes / (24 * 60));
        const hours = Math.floor((minutes % (24 * 60)) / 60);

        setDeliveryDays(days);
        setDeliveryHours(hours);

        setContactEmail(data.contact?.email ?? "");
        setContactPhone(data.contact?.phone ?? "");
        setWhatsappLink(data.contact?.whatsappLink ?? "");

        setAddress(data.address ?? "");
        setShipment(data.shipment ?? "");
        setSimple(data.simple ?? "");

        setFacebook(data.socialMedia?.facebook ?? "");
        setTwitter(data.socialMedia?.twitter ?? "");
        setInstagram(data.socialMedia?.instagram ?? "");
        setYoutube(data.socialMedia?.youtube ?? "");
        setTelegram(data.socialMedia?.telegram ?? "");
        setTiktok(data.socialMedia?.tiktok ?? "");
    };

    const fetchConfig = async () => {
        try {
            // ✅ Use cache if exists
            if (configCache) {
                applyConfig(configCache);
                return;
            }

            const res = await getConfig();

            if (res.success) {
                applyConfig(res.data);

                // 🔥 Save to cache
                setConfigCache(res.data);
            }
        } catch {
            toast.error("Failed to load settings");
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchProfile(), fetchConfig()]);
            setLoading(false);
        };

        loadAll();
    }, []);

    /* ================= UPDATE PROFILE ================= */
    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        if (!name.trim()) return toast.error("الاسم مطلوب");

        try {
            setSubmitting(true);
            await updateAdminProfile({ name, email });
            toast.success("تم تحديث البيانات بنجاح");
            setAdminProfileCache(null);
            fetchProfile();
        } catch {
            toast.error("فشل تحديث البيانات");
        } finally {
            setSubmitting(false);
        }
    };

    /* ================= CHANGE PASSWORD ================= */
    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (!currentPassword || !newPassword)
            return toast.error("جميع الحقول مطلوبة");

        if (newPassword !== confirmPassword)
            return toast.error("كلمتا المرور غير متطابقتين");

        try {
            setPasswordLoading(true);
            await changeAdminPassword({
                currentPassword,
                newPassword,
            });

            toast.success("تم تغيير كلمة المرور بنجاح");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            toast.error("فشل تغيير كلمة المرور");
        } finally {
            setPasswordLoading(false);
        }
    };

    /* ================= UPDATE CONFIG ================= */
    const handleConfigUpdate = async (e) => {
        e.preventDefault();

        const totalMinutes =
            Number(deliveryDays || 0) * 24 * 60 +
            Number(deliveryHours || 0) * 60;

        if (!contactEmail || !contactPhone)
            return toast.error("بيانات التواصل مطلوبة");

        if (isNaN(vat) || isNaN(deliveryDays) || isNaN(deliveryHours))
            return toast.error("القيم يجب أن تكون أرقام صحيحة");

        // Validate WhatsApp link format (optional but recommended)
        if (whatsappLink && !whatsappLink.includes('wa.me') && !whatsappLink.includes('whatsapp.com')) {
            return toast.error("رابط واتساب غير صحيح. استخدم صيغة: https://wa.me/...");
        }
        // Validate shipment range (format: 20 80)
        let formattedShipment = "";

        if (shipment) {
            const value = shipment.trim();

            // الحالة 1: المستخدم كتب 20~80
            if (value.includes('~')) {
                const parts = value.split('~');

                if (parts.length !== 2)
                    return toast.error("صيغة الشحن غير صحيحة");

                const min = Number(parts[0]);
                const max = Number(parts[1]);

                if (isNaN(min) || isNaN(max))
                    return toast.error("سعر الشحن يجب أن يكون أرقام فقط");

                if (min >= max)
                    return toast.error("الحد الأدنى يجب أن يكون أقل من الحد الأعلى");

                formattedShipment = `${min}~${max}`;
            }

            // الحالة 2: المستخدم كتب 20 80
            else {
                const parts = value.split(/\s+/);

                if (parts.length !== 2)
                    return toast.error("اكتب رقمين فقط وبينهما مسافة. مثال: 20 80");

                const min = Number(parts[0]);
                const max = Number(parts[1]);

                if (isNaN(min) || isNaN(max))
                    return toast.error("سعر الشحن يجب أن يكون أرقام فقط");

                if (min >= max)
                    return toast.error("الحد الأدنى يجب أن يكون أقل من الحد الأعلى");

                formattedShipment = `${min}~${max}`;
            }
        }

        try {
            setConfigLoading(true);

            await updateConfig({
                vat: Number(vat),
                sendTime: totalMinutes,
                shipment: formattedShipment,
                simple: simple,
                contact: {
                    email: contactEmail,
                    phone: contactPhone,
                    whatsappLink: whatsappLink, // Changed
                },
                address: address,
                socialMedia: {
                    facebook: facebook,
                    twitter: twitter,
                    instagram: instagram,
                    youtube: youtube,
                    telegram: telegram,
                    tiktok: tiktok,
                },

            });

            toast.success("تم تحديث الإعدادات بنجاح");
            setConfigCache(null);
            fetchConfig();
        } catch {
            toast.error("فشل تحديث الإعدادات");
        } finally {
            setConfigLoading(false);
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
        <div className="space-y-8 max-w-2xl">
            {/* ================= PROFILE ================= */}
            <div className="bg-white shadow-sm rounded-md p-4">
                <h2 className="mb-4 font-medium">بيانات الحساب</h2>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <input
                        type="text"
                        placeholder="الاسم"
                        className="border px-3 py-2 w-full rounded-md"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <input
                        type="email"
                        placeholder="البريد الإلكتروني"
                        className="border px-3 py-2 w-full rounded-md"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <button
                        disabled={submitting}
                        className="bg-gradient-to-br from-black to-black/70 text-white px-4 py-2 rounded-md flex gap-2 disabled:opacity-60 hover:-translate-y-1 transition-all duration-300 ease-in-out"
                    >
                        {submitting ? (
                            <>
                                <Loader size={16} color="#fff" /> جاري الحفظ
                            </>
                        ) : (
                            "حفظ التعديلات"
                        )}
                    </button>
                </form>
            </div>

            {/* ================= PASSWORD ================= */}
            <div className="bg-white shadow-sm rounded-md p-4">
                <h2 className="mb-4 font-medium">تغيير كلمة المرور</h2>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <input
                        type="password"
                        placeholder="كلمة المرور الحالية"
                        className="border px-3 py-2 w-full rounded-md"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="كلمة المرور الجديدة"
                        className="border px-3 py-2 w-full rounded-md"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="تأكيد كلمة المرور"
                        className="border px-3 py-2 w-full rounded-md"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    <button
                        disabled={passwordLoading}
                        className="bg-gradient-to-br from-black to-black/70 text-white px-4 py-2 rounded-md flex gap-2 disabled:opacity-60 hover:-translate-y-1 transition-all duration-300 ease-in-out"
                    >
                        {passwordLoading ? (
                            <>
                                <Loader size={16} color="#fff" /> جاري التحديث
                            </>
                        ) : (
                            "تغيير كلمة المرور"
                        )}
                    </button>
                </form>
            </div>

            {/* ================= CONFIG ================= */}
            <div className="bg-white shadow-sm rounded-md p-4">
                <h2 className="mb-4 font-medium">إعدادات النظام</h2>

                <form onSubmit={handleConfigUpdate} className="space-y-4">
                    {/* VAT */}
                    <div className="flex flex-col items-start justify-start gap-2">
                        <label htmlFor="vat">نسبة الضريبة (%)</label>
                        <input
                            type="number"
                            placeholder="نسبة الضريبة (%)"
                            className="border px-3 py-2 w-full rounded-md"
                            value={vat}
                            onChange={(e) => setVat(e.target.value)}
                        />
                    </div>
                    {/* simple */}
                    <div className="flex flex-col items-start justify-start gap-2">
                        <label htmlFor="simple">رمز العملة</label>
                        <input
                            type="text"
                            placeholder="رمز العملة"
                            className="border px-3 py-2 w-full rounded-md"
                            value={simple}
                            onChange={(e) => setSimple(e.target.value)}
                        />
                    </div>
                    {/* Shipment Range */}
                    <div className="flex flex-col items-start justify-start gap-2">
                        <label htmlFor="shipment">سعر الشحن (من إلى)</label>
                        <input
                            type="text"
                            placeholder="مثال: 20 80"
                            className="border px-3 py-2 w-full rounded-md"
                            value={shipment}
                            onChange={(e) => setShipment(e.target.value)}
                        />
                        <small className="text-gray-500 text-sm">
                            اكتب رقمين وبينهما مسافة فقط: 20 80 (من 20 إلى 80)
                        </small>
                    </div>

                    {/* Delivery Time */}
                    <div className="flex flex-col items-start justify-start gap-2">
                        <label>وقت التوصيل المتوقع</label>
                        <div className="flex gap-2 w-full">
                            <div className="flex flex-col gap-2 items-start justify-start flex-1">
                                <label htmlFor="days">أيام</label>
                                <input
                                    type="number"
                                    placeholder="أيام"
                                    className="border px-3 py-2 w-full rounded-md"
                                    value={deliveryDays}
                                    onChange={(e) => setDeliveryDays(e.target.value)}
                                    min="0"
                                />
                            </div>
                            <div className="flex flex-col gap-2 items-start justify-start flex-1">
                                <label htmlFor="hours">ساعات</label>
                                <input
                                    type="number"
                                    placeholder="ساعات"
                                    className="border px-3 py-2 w-full rounded-md"
                                    value={deliveryHours}
                                    onChange={(e) => setDeliveryHours(e.target.value)}
                                    min="0"
                                    max="23"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-col items-start justify-start gap-2">
                        <label htmlFor="email">بريد التواصل</label>
                        <input
                            type="email"
                            placeholder="بريد التواصل"
                            className="border px-3 py-2 w-full rounded-md"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col items-start justify-start gap-2">
                        <label htmlFor="phone">هاتف التواصل</label>
                        <input
                            type="text"
                            placeholder="هاتف التواصل"
                            className="border px-3 py-2 w-full rounded-md"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col items-start justify-start gap-2">
                        <label htmlFor="whatsapp">رابط واتساب</label>
                        <input
                            type="url"
                            placeholder="https://wa.me/1234567890"
                            className="border px-3 py-2 w-full rounded-md"
                            value={whatsappLink}
                            onChange={(e) => setWhatsappLink(e.target.value)}
                        />
                        <small className="text-gray-500 text-sm">
                            استخدم صيغة: https://wa.me/1234567890 أو https://wa.me/1234567890?text=مرحبا
                        </small>
                    </div>

                    <div className="flex flex-col items-start justify-start gap-2">
                        <label htmlFor="address">عنوان الموقع</label>
                        <input
                            type="text"
                            placeholder="عنوان الموقع"
                            className="border px-3 py-2 w-full rounded-md"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    {/* Social Media */}
                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-medium mb-4">روابط التواصل الاجتماعي</h3>

                        <div className="space-y-4">
                            <div className="flex flex-col items-start justify-start gap-2">
                                <label htmlFor="facebook">رابط فيسبوك</label>
                                <input
                                    type="url"
                                    placeholder="https://facebook.com/..."
                                    className="border px-3 py-2 w-full rounded-md"
                                    value={facebook}
                                    onChange={(e) => setFacebook(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col items-start justify-start gap-2">
                                <label htmlFor="twitter">رابط تويتر</label>
                                <input
                                    type="url"
                                    placeholder="https://twitter.com/..."
                                    className="border px-3 py-2 w-full rounded-md"
                                    value={twitter}
                                    onChange={(e) => setTwitter(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col items-start justify-start gap-2">
                                <label htmlFor="instagram">رابط إنستغرام</label>
                                <input
                                    type="url"
                                    placeholder="https://instagram.com/..."
                                    className="border px-3 py-2 w-full rounded-md"
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col items-start justify-start gap-2">
                                <label htmlFor="youtube">رابط يوتيوب</label>
                                <input
                                    type="url"
                                    placeholder="https://youtube.com/..."
                                    className="border px-3 py-2 w-full rounded-md"
                                    value={youtube}
                                    onChange={(e) => setYoutube(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col items-start justify-start gap-2">
                                <label htmlFor="telegram">رابط تليجرام</label>
                                <input
                                    type="url"
                                    placeholder="https://t.me/..."
                                    className="border px-3 py-2 w-full rounded-md"
                                    value={telegram}
                                    onChange={(e) => setTelegram(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col items-start justify-start gap-2">
                                <label htmlFor="tiktok">رابط تيك توك</label>
                                <input
                                    type="url"
                                    placeholder="https://tiktok.com/@..."
                                    className="border px-3 py-2 w-full rounded-md"
                                    value={tiktok}
                                    onChange={(e) => setTiktok(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={configLoading}
                        className="bg-gradient-to-br from-black to-black/70 text-white px-4 py-2 rounded-md flex gap-2 disabled:opacity-60 hover:-translate-y-1 transition-all"
                    >
                        {configLoading ? (
                            <>
                                <Loader size={16} color="#fff" /> جاري الحفظ
                            </>
                        ) : (
                            "حفظ الإعدادات"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}