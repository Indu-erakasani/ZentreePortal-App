


// import React from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { ThemeProvider } from "@mui/material/styles";
// import CssBaseline from "@mui/material/CssBaseline";

// import theme from "../src/components/utils/theme";
// import ProtectedRoute from "./components/ProtectedRoute";
// import Layout from "./components/RecruiterPages/Layout";

// // ── Auth / public pages ──────────────────────────────────────────────────────
// import LoginPage        from "./components/authonticationPages/LoginPage";
// import RegisterPage     from "./components/authonticationPages/RegisterPage";
// import UnauthorizedPage from "./components/authonticationPages/UnauthorizedPage";
// import { ProfilePage, ChangePasswordPage } from "./components/authonticationPages/ProfilePage";

// // ── Dashboard pages (role-based views rendered inside shared Layout) ──────────
// import AdminDashboard     from "./components/AdminPages/AdminDashboard";
// import RecruiterDashboard from "./components/RecruiterPages/RecruiterDashboard";
// import ManagerDashboard   from "./components/ManagerPages/ManagerDashboard";
// import RecruiterReportsPage from "./components/ManagerPages/RecruiterReportsPage";

// // ── Feature pages (shared across roles, shown inside Layout sidebar) ──────────
// import Clients    from "./components/RecruiterPages/Clients";
// import Jobs       from "./components/RecruiterPages/Jobs";
// import Resumes    from "./components/RecruiterPages/Resumes";
// import Tracking   from "./components/RecruiterPages/Tracking";
// import Placements from "./components/RecruiterPages/Placements";
// import Skills     from "./components/RecruiterPages/Skills";
// import Reports    from "./components/RecruiterPages/Report";
// import BenchPeople from "./components/RecruiterPages/Benchpeople";
// import Employees   from "./components/RecruiterPages/EmployeePages/EmployeesPage";
// import ExamPage from "./components/RecruiterPages/ExamPage";
// import InterviewFeedback from "./components/RecruiterPages/InterviewFeedback";
// const App = () => (
//   <ThemeProvider theme={theme}>
//     <CssBaseline />
//     <BrowserRouter>
//       <Routes>

//         {/* ── Public routes ─────────────────────────────────────────────── */}
//         <Route path="/login"        element={<LoginPage />} />
//         <Route path="/register"     element={<RegisterPage />} />
//         <Route path="/unauthorized" element={<UnauthorizedPage />} />
//         <Route path="/exam/:token" element={<ExamPage />} />
//         <Route path="/interview/feedback/:trackingId/:scheduleId" element={<InterviewFeedback />}/>

//         {/* ── Protected shell — renders sidebar Layout for all roles ──── */}
//         <Route
//           element={
//             <ProtectedRoute>
//               <Layout />
//             </ProtectedRoute>
//           }
//         >
//           {/* Dashboard — role decides which component renders */}
//           <Route
//             path="/admin/dashboard"
//             element={
//               <ProtectedRoute allowedRoles={["admin"]}>
//                 <AdminDashboard />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/recruiter/dashboard"
//             element={
//               <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
//                 <RecruiterDashboard />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/manager/dashboard"
//             element={
//               <ProtectedRoute allowedRoles={["manager", "admin"]}>
//                 <ManagerDashboard />
//               </ProtectedRoute>
//             }
//           />

//           {/* ── Feature pages — accessible to all authenticated roles ─── */}
//           <Route path="/clients"    element={<Clients />} />
//           <Route path="/jobs"       element={<Jobs />} />
//           <Route path="/resumes"    element={<Resumes />} />
//           <Route path="/tracking"   element={<Tracking />} />
//           <Route path="/placements" element={<Placements />} />
//           <Route path="/skills"     element={<Skills />} />
//           <Route path="/reports"    element={<Reports />} />  
//           <Route path="/manager/recruiters" element={<RecruiterReportsPage />} />
//           <Route path="/bench"     element={<BenchPeople />} />
//           <Route path="/employees" element={<Employees />} />

//           {/* ── Profile & password ─────────────────────────────────────── */}
//           <Route path="/profile"         element={<ProfilePage />} />
//           <Route path="/change-password" element={<ChangePasswordPage />} />
//         </Route>

//         {/* ── Fallback redirects ─────────────────────────────────────────── */}
//         <Route path="/" element={<Navigate to="/login" replace />} />
//         <Route path="*" element={<Navigate to="/login" replace />} />

//       </Routes>
//     </BrowserRouter>
//   </ThemeProvider>
// );

// export default App;











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

// ── Dashboard pages ───────────────────────────────────────────────────────────
import AdminDashboard     from "./components/AdminPages/AdminDashboard";
import RecruiterDashboard from "./components/RecruiterPages/RecruiterDashboard";
import ManagerDashboard   from "./components/ManagerPages/ManagerDashboard";
import HRDashboard        from "./components/HRPages/Hrdashboard";        
import RecruiterReportsPage from "./components/ManagerPages/RecruiterReportsPage";

// ── Feature pages ─────────────────────────────────────────────────────────────
import Clients    from "./components/RecruiterPages/Clients";
import Jobs       from "./components/RecruiterPages/Jobs";
import Resumes    from "./components/RecruiterPages/Resumes";
import Tracking   from "./components/RecruiterPages/Tracking";
import Placements from "./components/RecruiterPages/Placements";
import Skills     from "./components/RecruiterPages/Skills";
import Reports    from "./components/RecruiterPages/Report";
import BenchPeople from "./components/RecruiterPages/Benchpeople";
import Employees   from "./components/RecruiterPages/EmployeePages/EmployeesPage";
import ExamPage from "./components/RecruiterPages/ExamPage";
import InterviewFeedback from "./components/RecruiterPages/InterviewFeedback";
import OnboardingPage from "./components/HRPages/OnboardingPage";

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter>
      <Routes>

        {/* ── Public routes ─────────────────────────────────────────────── */}
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/register"     element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/exam/:token"  element={<ExamPage />} />
        <Route
          path="/interview/feedback/:trackingId/:scheduleId"
          element={<InterviewFeedback />}
        />

        {/* ── Protected shell — renders sidebar Layout for all roles ──── */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* ── Dashboards (role-gated) ────────────────────────────────── */}
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
          <Route
            path="/hr/dashboard"
            element={
              <ProtectedRoute allowedRoles={["hr", "admin"]}>
                <HRDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Recruiter / manager feature pages ─────────────────────── */}
          <Route
            path="/clients"
            element={
              <ProtectedRoute allowedRoles={["admin", "recruiter", "manager"]}>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute allowedRoles={["admin", "recruiter", "manager"]}>
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resumes"
            element={
              <ProtectedRoute allowedRoles={["admin", "recruiter", "manager", "hr"]}>
                <Resumes />
              </ProtectedRoute>
            }
          />
          <Route path="/tracking"   element={<Tracking />} />
          <Route
            path="/placements"
            element={
              <ProtectedRoute allowedRoles={["admin", "recruiter", "manager"]}>
                <Placements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <ProtectedRoute allowedRoles={["admin", "recruiter"]}>
                <Skills />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager", "hr"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/recruiters"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <RecruiterReportsPage />
              </ProtectedRoute>
            }
          />

          {/* ── HR + shared feature pages ─────────────────────────────── */}
          <Route
            path="/bench"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr", "manager"]}>
                <BenchPeople />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={["admin", "hr", "manager"]}>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding" element={
              <ProtectedRoute allowedRoles={["admin", "hr"]}>
                <OnboardingPage />
              </ProtectedRoute>
            } />

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