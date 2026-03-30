// import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
// import { authAPI } from "../utils/api";

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // ── Initialize: check existing token ───────────────────────────────────────
//   useEffect(() => {
//     const initAuth = async () => {
//       const token = localStorage.getItem("access_token");
//       if (!token) {
//         setLoading(false);
//         return;
//       }
//       try {
//         const res = await authAPI.getMe();
//         if (res.data.success) setUser(res.data.user);
//       } catch {
//         localStorage.removeItem("access_token");
//         localStorage.removeItem("refresh_token");
//       } finally {
//         setLoading(false);
//       }
//     };
//     initAuth();
//   }, []);

//   // ── Register ────────────────────────────────────────────────────────────────
//   const register = useCallback(async (formData) => {
//     setError(null);
//     const res = await authAPI.register(formData);
//     return res.data;
//   }, []);

//   // ── Login ───────────────────────────────────────────────────────────────────
//   const login = useCallback(async (email, password) => {
//     setError(null);
//     const res = await authAPI.login({ email, password });
//     const { access_token, refresh_token, user: userData } = res.data;
//     localStorage.setItem("access_token", access_token);
//     localStorage.setItem("refresh_token", refresh_token);
//     setUser(userData);
//     return userData;
//   }, []);

//   // ── Logout ──────────────────────────────────────────────────────────────────
//   const logout = useCallback(async () => {
//     try {
//       await authAPI.logout();
//     } catch {}
//     localStorage.removeItem("access_token");
//     localStorage.removeItem("refresh_token");
//     setUser(null);
//   }, []);

//   // ── Change Password ─────────────────────────────────────────────────────────
//   const changePassword = useCallback(async (current_password, new_password) => {
//     const res = await authAPI.changePassword({ current_password, new_password });
//     return res.data;
//   }, []);

//   // ── Update local user state ─────────────────────────────────────────────────
//   const updateUser = useCallback((updatedUser) => {
//     setUser(updatedUser);
//   }, []);

//   const value = {
//     user,
//     loading,
//     error,
//     isAuthenticated: !!user,
//     isAdmin: user?.role === "admin",
//     isRecruiter: user?.role === "recruiter",
//     isManager: user?.role === "manager",
//     register,
//     login,
//     logout,
//     changePassword,
//     updateUser,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
//   return ctx;
// };

// export default AuthContext;