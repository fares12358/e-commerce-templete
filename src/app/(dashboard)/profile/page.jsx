"use client";

import { useEffect, useState } from "react";
import {
  getAdminProfile, updateAdminProfile, changeAdminPassword,
  getConfig, updateConfig, getNotification, updateNotification,
  getRefundFlag, updateRefundFlag,   // [v1.0.4]
} from "@/lib/api";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { FaBell, FaCog, FaLock, FaUser, FaSave } from "react-icons/fa";

/* ─── Re-usable local Switch ───────────────────────────── */
function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`d-switch ${checked ? "d-switch-on" : "d-switch-off"}`}
    >
      <div className="d-switch-thumb" />
    </button>
  );
}

/* ─── Section card wrapper ──────────────────────────────── */
function Section({ icon: Icon, title, children, iconBg = "#eff6ff", iconColor = "var(--accent)" }) {
  return (
    <div className="d-card space-y-5">
      <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
        <h2 className="page-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ─── Field wrapper ─────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="section-label block">{label}</label>
      {children}
    </div>
  );
}

export default function AdminProfilePage() {
  const { setAdmin, adminProfileCache, setAdminProfileCache, configCache, setConfigCache, notificationCache, setNotificationCache } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  /* Profile */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  /* Password */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* Config */
  const [vat, setVat] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [deliveryHours, setDeliveryHours] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [address, setAddress] = useState("");
  const [shipment, setShipment] = useState("");
  const [simple, setSimple] = useState("");
  const [refundWindowDays,   setRefundWindowDays]   = useState(7);     // [v1.0.4]
  const [refundEnabled,      setRefundEnabled]      = useState(false); // [v1.0.4]
  const [refundFlagLoading,  setRefundFlagLoading]  = useState(false); // [v1.0.4]
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [telegram, setTelegram] = useState("");
  const [tiktok, setTiktok] = useState("");

  /* Notification */
  const [notif, setNotif] = useState({
    adminChatId: "", telegramEnabled: false, notifyOnNewOrder: false,
    notifySound: false, sectionNotify: false, SmtpServer: false,
    email: "", appPassword: "", host: "", port: "", secure: false,
  });

  const setN = (key, val) => setNotif(prev => ({ ...prev, [key]: val }));

  /* ── Load ── */
  const fetchProfile = async () => {
    if (adminProfileCache) { setName(adminProfileCache.name || ""); setEmail(adminProfileCache.email || ""); return; }
    setLoading(true);
    const res = await getAdminProfile();
    if (res.success) { setName(res.data.name || ""); setEmail(res.data.email || ""); setAdmin(res.data); setAdminProfileCache(res.data); }
  };

  const applyConfig = (d) => {
    setVat(d.vat ?? "");
    const mins = d.sendTime || 0;
    setDeliveryDays(Math.floor(mins / 1440));
    setDeliveryHours(Math.floor((mins % 1440) / 60));
    setContactEmail(d.contact?.email ?? ""); setContactPhone(d.contact?.phone ?? ""); setWhatsappLink(d.contact?.whatsappLink ?? "");
    setAddress(d.address ?? ""); setShipment(d.shipment ?? ""); setSimple(d.simple ?? "");
    setRefundWindowDays(d.refundWindowDays ?? 7); // [v1.0.4]
    setFacebook(d.socialMedia?.facebook ?? ""); setTwitter(d.socialMedia?.twitter ?? "");
    setInstagram(d.socialMedia?.instagram ?? ""); setYoutube(d.socialMedia?.youtube ?? "");
    setTelegram(d.socialMedia?.telegram ?? ""); setTiktok(d.socialMedia?.tiktok ?? "");
  };

  const fetchConfig = async () => {
    if (configCache) { applyConfig(configCache); return; }
    const res = await getConfig();
    if (res.success) { applyConfig(res.data); setConfigCache(res.data); }
  };

  const fetchNotification = async () => {
    if (notificationCache) { setNotif(notificationCache); return; }
    setLoading(true);
    const res = await getNotification();
    if (res.success) {
      const d = { adminChatId: res.data.adminChatId||"", telegramEnabled: !!res.data.telegramEnabled, notifyOnNewOrder: !!res.data.notifyOnNewOrder, notifySound: !!res.data.notifySound, sectionNotify: !!res.data.sectionNotify, SmtpServer: !!res.data.SmtpServer, email: res.data.email||"", appPassword: res.data.appPassword||"", host: res.data.host||"", port: res.data.port||"", secure: !!res.data.secure };
      setNotif(d); setNotificationCache(d);
    }
  };

  useEffect(() => {
    // [v1.0.4] also fetch the refund feature flag alongside other init calls
    const fetchRefundFlag = async () => {
      try {
        // axios interceptor unwraps response.data, so res IS the body: { success, data: { refund } }
        const res = await getRefundFlag();
        if (res?.success) setRefundEnabled(res.data?.refund ?? false);
      } catch { /* silent — flag stays false */ }
    };

    Promise.all([
      fetchProfile(),
      fetchConfig(),
      fetchNotification(),
      fetchRefundFlag(),
    ]).finally(() => setLoading(false));
  }, []);

  /* ── Handlers ── */
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    try {
      setSubmitting(true);
      await updateAdminProfile({ name, email });
      toast.success("Profile updated");
      setAdminProfileCache(null); fetchProfile();
    } catch { toast.error("Update failed"); }
    finally { setSubmitting(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return toast.error("All fields required");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    try {
      setPasswordLoading(true);
      await changeAdminPassword({ currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch { toast.error("Password change failed"); }
    finally { setPasswordLoading(false); }
  };

  const handleConfigUpdate = async (e) => {
    e.preventDefault();
    const totalMinutes = Number(deliveryDays || 0) * 1440 + Number(deliveryHours || 0) * 60;
    if (!contactEmail || !contactPhone) return toast.error("Contact info required");
    let formattedShipment = "";
    if (shipment) {
      const v = shipment.trim();
      const sep = v.includes("~") ? "~" : " ";
      const parts = v.split(sep).map(s => s.trim()).filter(Boolean);
      if (parts.length !== 2) return toast.error("Shipment: enter two numbers (e.g. 20 80)");
      const [min, max] = parts.map(Number);
      if (isNaN(min) || isNaN(max)) return toast.error("Shipment values must be numbers");
      if (min >= max) return toast.error("Min must be less than max");
      formattedShipment = `${min}~${max}`;
    }
    try {
      setConfigLoading(true);
      await updateConfig({ vat: Number(vat), sendTime: totalMinutes, shipment: formattedShipment, simple, refundWindowDays: Number(refundWindowDays), contact: { email: contactEmail, phone: contactPhone, whatsappLink }, address, socialMedia: { facebook, twitter, instagram, youtube, telegram, tiktok } }); // [v1.0.4] refundWindowDays included
      toast.success("Settings saved");
      setConfigCache(null); fetchConfig();
    } catch { toast.error("Failed to save settings"); }
    finally { setConfigLoading(false); }
  };

  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    try {
      setNotificationLoading(true);
      const res = await updateNotification(notif);
      if (res.success) { toast.success("Notification settings saved"); setNotificationCache(notif); }
    } catch { toast.error("Failed to save notifications"); }
    finally { setNotificationLoading(false); }
  };

  if (loading) return <div className="flex justify-center items-center py-20 h-full w-full"><Loader /></div>;

  return (
    <div className="space-y-5 max-w-2xl">

      {/* ── Profile ── */}
      <Section icon={FaUser} title="Account Info">
        <form onSubmit={handleProfileUpdate} className="space-y-3">
          <Field label="Name">
            <input type="text" className="d-input" placeholder="Admin name" value={name} onChange={e => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" className="d-input" placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <button disabled={submitting} className="d-btn d-btn-primary gap-2">
            {submitting ? <><Loader size={14} color="#fff" /> Saving...</> : <><FaSave size={11} /> Save Changes</>}
          </button>
        </form>
      </Section>

      {/* ── Password ── */}
      <Section icon={FaLock} title="Change Password" iconBg="#f8fafc" iconColor="#475569">
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <Field label="Current Password">
            <input type="password" className="d-input" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </Field>
          <Field label="New Password">
            <input type="password" className="d-input" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </Field>
          <Field label="Confirm New Password">
            <input type="password" className="d-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </Field>
          <button disabled={passwordLoading} className="d-btn d-btn-primary gap-2">
            {passwordLoading ? <><Loader size={14} color="#fff" /> Updating...</> : "Update Password"}
          </button>
        </form>
      </Section>

      {/* ── Notifications ── */}
      <Section icon={FaBell} title="Notification Settings" iconBg="#fdf4ff" iconColor="#a21caf">
        <form onSubmit={handleNotificationUpdate} className="space-y-4">
          <Field label="Admin Telegram Chat ID">
            <input type="text" className="d-input" placeholder="e.g. 123456789" value={notif.adminChatId} onChange={e => setN("adminChatId", e.target.value)} />
          </Field>
          {[
            ["telegramEnabled",  "Enable Telegram notifications"],
            ["notifyOnNewOrder", "Notify on new order"],
            ["notifySound",      "Notification sound"],
            ["sectionNotify",    "Browser push notification"],
            ["SmtpServer",       "Use custom SMTP server"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-[13px] text-slate-700">{label}</span>
              <Switch checked={!!notif[key]} onChange={v => setN(key, v)} />
            </div>
          ))}
          <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <p className="section-label mb-3">Email / SMTP</p>
            <div className="space-y-3">
              <Field label="Sender Email">
                <input type="email" className="d-input" value={notif.email} onChange={e => setN("email", e.target.value)} />
              </Field>
              <Field label="App Password">
                <input type="password" className="d-input" value={notif.appPassword} onChange={e => setN("appPassword", e.target.value)} />
              </Field>
              {notif.SmtpServer && (
                <>
                  <Field label="SMTP Host"><input type="text" className="d-input" value={notif.host} onChange={e => setN("host", e.target.value)} /></Field>
                  <Field label="SMTP Port"><input type="number" className="d-input" value={notif.port} onChange={e => setN("port", e.target.value)} /></Field>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-slate-700">Secure (SSL)</span>
                    <Switch checked={!!notif.secure} onChange={v => setN("secure", v)} />
                  </div>
                </>
              )}
            </div>
          </div>
          <button disabled={notificationLoading} className="d-btn d-btn-primary gap-2">
            {notificationLoading ? <><Loader size={14} color="#fff" /> Saving...</> : <><FaSave size={11} /> Save Notifications</>}
          </button>
        </form>
      </Section>

      {/* ── Store Config ── */}
      <Section icon={FaCog} title="Store Settings" iconBg="#f0fdf4" iconColor="#15803d">
        <form onSubmit={handleConfigUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="VAT (%)"><input type="number" className="d-input" value={vat} onChange={e => setVat(e.target.value)} /></Field>
            <Field label="Currency Symbol"><input type="text" className="d-input" placeholder="e.g. $" value={simple} onChange={e => setSimple(e.target.value)} /></Field>
          </div>
          <Field label="Shipping Price (e.g. 20 80)">
            <input type="text" className="d-input" placeholder="20 80" value={shipment} onChange={e => setShipment(e.target.value)} />
            <p className="text-[11px] text-slate-400 mt-1">Enter two numbers separated by a space: min max</p>
          </Field>

          {/* [v1.0.4] Refund window */}
          <Field label="Refund Window (days after delivery)">
            <input
              type="number"
              min="0"
              className="d-input"
              placeholder="7"
              value={refundWindowDays}
              onChange={e => setRefundWindowDays(e.target.value)}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Number of days after delivery in which customers may request a refund. Set to 0 to disable the window limit.
            </p>
          </Field>

          {/* [v1.0.4] Refund feature flag — live toggle, saves immediately */}
          <div
            className="flex items-center justify-between gap-4 p-3 rounded-xl"
            style={{ background: "#f8fafc", border: "1px solid var(--border)" }}
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-800">Enable Refund Feature</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Allow customers to request refunds on delivered orders
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {refundFlagLoading && <Loader size={14} color="var(--accent)" />}
              <Switch
                checked={refundEnabled}
                onChange={async (val) => {
                  try {
                    setRefundFlagLoading(true);
                    // axios interceptor unwraps response.data, so res IS the body
                    const res = await updateRefundFlag({ refund: val });
                    if (res?.success) {
                      setRefundEnabled(val);
                      toast.success(val ? "Refund feature enabled" : "Refund feature disabled");
                    }
                  } catch {
                    toast.error("Failed to update refund flag");
                  } finally {
                    setRefundFlagLoading(false);
                  }
                }}
              />
            </div>
          </div>
          <div>
            <p className="section-label mb-2">Delivery Time</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Days"><input type="number" min="0" className="d-input" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)} /></Field>
              <Field label="Hours"><input type="number" min="0" max="23" className="d-input" value={deliveryHours} onChange={e => setDeliveryHours(e.target.value)} /></Field>
            </div>
          </div>
          <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <p className="section-label mb-3">Contact Info</p>
            <div className="space-y-3">
              <Field label="Contact Email"><input type="email" className="d-input" value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></Field>
              <Field label="Contact Phone"><input type="text" className="d-input" value={contactPhone} onChange={e => setContactPhone(e.target.value)} /></Field>
              <Field label="WhatsApp Link"><input type="url" className="d-input" placeholder="https://wa.me/..." value={whatsappLink} onChange={e => setWhatsappLink(e.target.value)} /></Field>
              <Field label="Address"><input type="text" className="d-input" value={address} onChange={e => setAddress(e.target.value)} /></Field>
            </div>
          </div>
          <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <p className="section-label mb-3">Social Media</p>
            <div className="space-y-3">
              {[["Facebook", facebook, setFacebook],["Twitter", twitter, setTwitter],["Instagram", instagram, setInstagram],["YouTube", youtube, setYoutube],["Telegram", telegram, setTelegram],["TikTok", tiktok, setTiktok]].map(([label, val, setter]) => (
                <Field key={label} label={label}>
                  <input type="url" className="d-input" placeholder={`https://...`} value={val} onChange={e => setter(e.target.value)} />
                </Field>
              ))}
            </div>
          </div>
          <button disabled={configLoading} className="d-btn d-btn-primary gap-2">
            {configLoading ? <><Loader size={14} color="#fff" /> Saving...</> : <><FaSave size={11} /> Save Settings</>}
          </button>
        </form>
      </Section>
    </div>
  );
}
