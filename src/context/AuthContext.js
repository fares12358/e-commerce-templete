"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getAdminMe, logoutAdmin } from "@/lib/api";

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

  const logout = async () => {
    try {
      await logoutAdmin();
    } catch (err) {
      // ignore error
    } finally {
      setAdmin(null);
      setIsAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        setAdmin,
        isAuth,
        loading,
        checkAuth,
        logout,
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
