"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getAdminMe, logoutAdmin } from "@/lib/api";
import { toast } from "react-toastify";


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [LogOutloading, setLogOutLoading] = useState(false);

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

  const logout = async () => {
    try {
      setLogOutLoading(true)
      const res = await logoutAdmin();
      if (res.success) {
        setAdmin(null);
        setIsAuth(false);
        setDashboardStats({})
        setCategories([])
        setProductsCache({})
        setOrdersCache({})
        setAds([])
        setUsersCache({})
        setAdminProfileCache(null)
        setConfigCache(null)
        setContentCache(null)
        setNotificationCache(null)
        setUserOrdersCache({})
      }
    } catch (err) {
      toast.error(err.message || 'حدث خطأ اثناء تسجيل الخروج')
      // ignore error
    } finally {
      setLogOutLoading(false)
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
