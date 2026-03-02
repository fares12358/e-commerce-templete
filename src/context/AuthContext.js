"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getAdminMe, logoutAdmin } from "@/lib/api";
import { toast } from "react-toastify";
import api from "@/lib/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await getAdminMe();
      if (res.success) {
        setAdmin(res.data);
        setIsAuth(true);
      } else {
        setAdmin(null);
        setIsAuth(false);
      }
    } catch (err) {
      setAdmin(null);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!admin?.id) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      const subId = OneSignal.User.PushSubscription.id;
      if (!subId) {
        return;
      }
      try {
        await api.post("/admin/save-subscription", {
          subscriptionId: subId,
        });
      } catch (error) {
        toast.error('Error saving subscription')
      }
    });

  }, [admin]);

  const logout = async () => {
    try {
      await logoutAdmin();
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {

        const subId = OneSignal.User.PushSubscription.id;

        if (subId) {
          // احذف subscription من الباك
          await api.post("/admin/save-subscription", {
            subscriptionId: null,
          });
        }
        // أوقف استقبال الإشعارات لهذا الجهاز
        await OneSignal.User.PushSubscription.optOut();
      });

    } catch (err) {
      toast.error(err.message || 'حدث خطأ اثناء تسجيل الخروج')
      // ignore error
    } finally {
      setAdmin(null);
      setIsAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const [dashboardStats, setDashboardStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [productsCache, setProductsCache] = useState({});
  const [ordersCache, setOrdersCache] = useState({});
  const [ads, setAds] = useState([]);
  const [usersCache, setUsersCache] = useState({});
  const [adminProfileCache, setAdminProfileCache] = useState(null);
  const [configCache, setConfigCache] = useState(null);
  const [contentCache, setContentCache] = useState(null);
  const [notificationCache, setNotificationCache] = useState(null);
  const [userOrdersCache, setUserOrdersCache] = useState({});

  return (
    <AuthContext.Provider
      value={{
        admin,
        setAdmin,
        isAuth, setIsAuth,
        loading,
        checkAuth,
        logout,
        dashboardStats, setDashboardStats,
        categories, setCategories,
        productsCache, setProductsCache,
        ordersCache, setOrdersCache,
        ads, setAds,
        usersCache, setUsersCache,
        adminProfileCache,
        setAdminProfileCache,
        configCache,
        setConfigCache,
        contentCache, setContentCache,
        notificationCache, setNotificationCache,
        userOrdersCache, setUserOrdersCache
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
