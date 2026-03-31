


import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import theme from "../src/components/utils/theme";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/RecruiterPages/Layout";

// ── Auth / public pages ──────────────────────────────────────────────────────
import LoginPage        from "./components/authonticationPages/LoginPage";
import RegisterPage     from "./components/authonticationPages/RegisterPage";
import UnauthorizedPage from "./components/authonticationPages/UnauthorizedPage";
import { ProfilePage, ChangePasswordPage } from "./components/authonticationPages/ProfilePage";

// ── Dashboard pages (role-based views rendered inside shared Layout) ──────────
import AdminDashboard     from "./components/AdminPages/AdminDashboard";
import RecruiterDashboard from "./components/RecruiterPages/RecruiterDashboard";
import ManagerDashboard   from "./components/ManagerPages/ManagerDashboard";
import RecruiterReportsPage from "./components/ManagerPages/RecruiterReportsPage";

// ── Feature pages (shared across roles, shown inside Layout sidebar) ──────────
import Clients    from "./components/RecruiterPages/Clients";
import Jobs       from "./components/RecruiterPages/Jobs";
import Resumes    from "./components/RecruiterPages/Resumes";
import Tracking   from "./components/RecruiterPages/Tracking";
import Placements from "./components/RecruiterPages/Placements";
import Skills     from "./components/RecruiterPages/Skills";
import Reports    from "./components/RecruiterPages/Report";
import BenchPeople from "./components/RecruiterPages/Benchpeople";
import Employees   from "./components/RecruiterPages/EmployeesPage";

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter>
      <Routes>

        {/* ── Public routes ─────────────────────────────────────────────── */}
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/register"     element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ── Protected shell — renders sidebar Layout for all roles ──── */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard — role decides which component renders */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={["manager", "admin"]}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Feature pages — accessible to all authenticated roles ─── */}
          <Route path="/clients"    element={<Clients />} />
          <Route path="/jobs"       element={<Jobs />} />
          <Route path="/resumes"    element={<Resumes />} />
          <Route path="/tracking"   element={<Tracking />} />
          <Route path="/placements" element={<Placements />} />
          <Route path="/skills"     element={<Skills />} />
          <Route path="/reports"    element={<Reports />} />  
          <Route path="/manager/recruiters" element={<RecruiterReportsPage />} />
          <Route path="/bench"     element={<BenchPeople />} />
          <Route path="/employees" element={<Employees />} />

          {/* ── Profile & password ─────────────────────────────────────── */}
          <Route path="/profile"         element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
        </Route>

        {/* ── Fallback redirects ─────────────────────────────────────────── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;