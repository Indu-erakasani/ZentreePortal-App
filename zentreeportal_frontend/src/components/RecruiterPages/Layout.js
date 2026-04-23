



// import React, { useState } from "react";
// import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
// import {
//   Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
//   ListItemIcon, ListItemText, Typography, IconButton, Avatar,
//   Tooltip, Divider, Chip, useMediaQuery, useTheme,
//   Menu, MenuItem,
// } from "@mui/material";
// import {
//   Dashboard, People, Work, Assessment, Description, Psychology,
//   Menu as MenuIcon, Logout, ChevronLeft, ChevronRight,
//   AccountTree, Stars, AccountCircle, Lock, KeyboardArrowDown,ArrowBack, 
//   PersonOutline, BadgeOutlined,
// } from "@mui/icons-material";
// import GlobalNotifications from "./GlobalNotifications";

// const DRAWER_WIDTH      = 260;
// const DRAWER_MINI_WIDTH = 72;

// const NAV_ITEMS = [
//   { label: "Dashboard",           icon: <Dashboard />,     paths: ["/admin/dashboard", "/recruiter/dashboard", "/manager/dashboard"] },
//   { label: "Recruiter Analytics", icon: <People />,        paths: ["/manager/recruiters"] },
//   { label: "Clients",             icon: <People />,        paths: ["/clients"]      },
//   { label: "Jobs",                icon: <Work />,          paths: ["/jobs"]         },
//   { label: "Candidates",          icon: <Description />,   paths: ["/resumes"]      },
//   // { label: "Candidate Tracking",  icon: <AccountTree />,   paths: ["/tracking"]     },
//   { label: "Placements",          icon: <Stars />,         paths: ["/placements"]   },
//   { label: "Skills",              icon: <Psychology />,    paths: ["/skills"]       },
//   { label: "Bench People",        icon: <PersonOutline />, paths: ["/bench"]        },
//   { label: "Employees",           icon: <BadgeOutlined />, paths: ["/employees"]    },
//   { label: "Reports",             icon: <Assessment />,    paths: ["/reports"]      },
// ];

// const getUser = () => {
//   try { return JSON.parse(localStorage.getItem("user") || "{}"); }
//   catch { return {}; }
// };

// const BASE = process.env.REACT_APP_API_BASE_URL;
// const logoutApi = () =>
//   fetch(`${BASE}/auth/logout`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
//     },
//   }).catch(() => {});

// const getDashboardPath = (role) => {
//   if (role === "admin")   return "/admin/dashboard";
//   if (role === "manager") return "/manager/dashboard";
//   return "/recruiter/dashboard";
// };

// // ── Tokens ──────────────────────────────────────────────────────────────────
// const NAVY   = "#0f172a";
// const INDIGO = "#1a237e";
// const BLUE   = "#1d4ed8";
// const SLATE  = "#64748b";

// export default function Layout() {
//   const theme    = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down("md"));
//   const navigate = useNavigate();
//   const location = useLocation();
//   const user     = getUser();

//   const [open,       setOpen]       = useState(true);
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [anchorEl,   setAnchorEl]   = useState(null);
//   const menuOpen = Boolean(anchorEl);
//   const openMenu  = (e) => setAnchorEl(e.currentTarget);
//   const closeMenu = () => setAnchorEl(null);

//   const handleLogout = async () => {
//     closeMenu();
//     await logoutApi();
//     localStorage.clear();
//     navigate("/login", { replace: true });
//   };

//   const isActive = (item) => item.paths.some((p) => location.pathname.startsWith(p));
//   const navTo    = (item) => item.label === "Dashboard" ? getDashboardPath(user?.role) : item.paths[0];

//   const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User";
//   const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "?";
//   const collapsed = !open && !isMobile;
//   const drawerW   = collapsed ? DRAWER_MINI_WIDTH : DRAWER_WIDTH;

//   // ── Sidebar ────────────────────────────────────────────────────────────────
//   const SidebarContent = () => (
//     <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

//       {/* Logo */}
//       <Box
//         sx={{
//           px: collapsed ? 1.5 : 3, py: 2.5,
//           display: "flex", alignItems: "center", gap: 1.5, minHeight: 72,
//           background: "linear-gradient(135deg, #0d1b4b 0%, #1a237e 100%)",
//         }}
//       >
//         <Box
//           sx={{
//             width: 40, height: 40, borderRadius: "10px", flexShrink: 0,
//             background: "linear-gradient(135deg, #60a5fa, #1d4ed8)",
//             display: "flex", alignItems: "center", justifyContent: "center",
//             boxShadow: "0 4px 12px rgba(29,78,216,0.4)",
//           }}
//         >
//           <Work sx={{ color: "#fff", fontSize: 20 }} />
//         </Box>
//         {!collapsed && (
//           <Box>
//             <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem", lineHeight: 1.2 }}>
//               ZentreeLabs
//             </Typography>
//             <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.62rem",
//               letterSpacing: "0.1em", textTransform: "uppercase" }}>
//               Recruitment Portal
//             </Typography>
//           </Box>
//         )}
//       </Box>

//       <Divider sx={{ borderColor: "#f1f5f9" }} />

//       {/* Nav items */}
//       <List sx={{ px: collapsed ? 1 : 1.5, py: 1.5, flexGrow: 1, overflowY: "auto",
//         "&::-webkit-scrollbar": { width: 0 } }}>
//         {NAV_ITEMS.map((item) => {
//           const active = isActive(item);
//           return (
//             <ListItem key={item.label} disablePadding sx={{ mb: 0.3 }}>
//               <Tooltip title={collapsed ? item.label : ""} placement="right">
//                 <ListItemButton
//                   component={Link}
//                   to={navTo(item)}
//                   onClick={() => isMobile && setMobileOpen(false)}
//                   sx={{
//                     borderRadius: "10px",
//                     px: collapsed ? 1.5 : 2, py: 1, minHeight: 44,
//                     justifyContent: collapsed ? "center" : "flex-start",
//                     bgcolor: active ? "#e8eaf6" : "transparent",
//                     "&:hover": {
//                       bgcolor: active ? "#e8eaf6" : "#f8fafc",
//                     },
//                     transition: "background 0.15s",
//                     "& .MuiListItemIcon-root": {
//                       color: active ? INDIGO : SLATE,
//                       minWidth: collapsed ? 0 : 36,
//                     },
//                   }}
//                 >
//                   <ListItemIcon sx={{ "& svg": { fontSize: 20 } }}>{item.icon}</ListItemIcon>
//                   {!collapsed && (
//                     <ListItemText
//                       primary={item.label}
//                       primaryTypographyProps={{
//                         fontSize: 13.5,
//                         fontWeight: active ? 700 : 500,
//                         color: active ? INDIGO : "#334155",
//                       }}
//                     />
//                   )}
//                   {!collapsed && active && (
//                     <Box sx={{ width: 3, height: 22, bgcolor: INDIGO, borderRadius: 4, ml: 1, flexShrink: 0 }} />
//                   )}
//                 </ListItemButton>
//               </Tooltip>
//             </ListItem>
//           );
//         })}
//       </List>

//       <Divider sx={{ borderColor: "#f1f5f9" }} />

//       {/* Logout */}
//       <List sx={{ px: collapsed ? 1 : 1.5, py: 1 }}>
//         <ListItem disablePadding>
//           <Tooltip title={collapsed ? "Logout" : ""} placement="right">
//             <ListItemButton
//               onClick={handleLogout}
//               sx={{
//                 borderRadius: "10px",
//                 px: collapsed ? 1.5 : 2, py: 1,
//                 justifyContent: collapsed ? "center" : "flex-start",
//                 "&:hover": { bgcolor: "#fef2f2" },
//                 "& .MuiListItemIcon-root": { color: "#ef4444", minWidth: collapsed ? 0 : 36 },
//               }}
//             >
//               <ListItemIcon><Logout sx={{ fontSize: 20 }} /></ListItemIcon>
//               {!collapsed && (
//                 <ListItemText
//                   primary="Logout"
//                   primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500, color: "#ef4444" }}
//                 />
//               )}
//             </ListItemButton>
//           </Tooltip>
//         </ListItem>
//       </List>
//     </Box>
//   );

//   return (
//     <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>

//       {/* Mobile drawer */}
//       {isMobile && (
//         <Drawer
//           variant="temporary"
//           open={mobileOpen}
//           onClose={() => setMobileOpen(false)}
//           ModalProps={{ keepMounted: true }}
//           sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, border: "none",
//             boxShadow: "4px 0 24px rgba(15,23,42,0.08)" } }}
//         >
//           <SidebarContent />
//         </Drawer>
//       )}

//       {/* Desktop drawer */}
//       {!isMobile && (
//         <Drawer
//           variant="permanent"
//           sx={{
//             width: drawerW, flexShrink: 0, transition: "width 0.2s",
//             "& .MuiDrawer-paper": {
//               width: drawerW, boxSizing: "border-box", border: "none",
//               boxShadow: "2px 0 16px rgba(15,23,42,0.06)",
//               transition: "width 0.2s", overflowX: "hidden",
//             },
//           }}
//         >
//           <SidebarContent />
//         </Drawer>
//       )}

//       {/* Main area */}
//       <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

//         {/* ── Top AppBar ─────────────────────────────────────────────────── */}
//         <AppBar
//           position="sticky"
//           elevation={0}
//           sx={{
//             bgcolor: "#fff",
//             borderBottom: "1px solid #e2e8f0",
//             color: "inherit",
//           }}
//         >
//           <Toolbar sx={{ px: { xs: 2, md: 3 }, gap: 1.5, minHeight: "60px !important" }}>

//             {/* Sidebar toggle */}
//             <IconButton
//               size="small"
//               onClick={() => isMobile ? setMobileOpen(true) : setOpen((p) => !p)}
//               sx={{
//                 color: SLATE, bgcolor: "#f8fafc", border: "1px solid #e2e8f0",
//                 "&:hover": { bgcolor: "#f1f5f9", borderColor: "#cbd5e1" },
//                 borderRadius: "8px", width: 34, height: 34,
//               }}
//             >
//               {isMobile ? <MenuIcon fontSize="small" /> : open ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
//             </IconButton>
// {/* Back button */}
// <IconButton
//   size="small"
//   onClick={() => navigate(-1)}
//   sx={{
//     color: SLATE, bgcolor: "#f8fafc", border: "1px solid #e2e8f0",
//     "&:hover": { bgcolor: "#f1f5f9", borderColor: "#cbd5e1" },
//     borderRadius: "8px", width: 34, height: 34,
//   }}
// >
//   <ArrowBack fontSize="small" />
// </IconButton>
//             {/* Page title */}
//             <Typography
//               sx={{ fontWeight: 700, color: NAVY, fontSize: "1rem", flexGrow: 1 }}
//             >
//               {NAV_ITEMS.find((n) => isActive(n))?.label ?? "Portal"}
//             </Typography>

//             {/* ── Notification Bell ───────────────────────────────────────── */}
//             <GlobalNotifications />

//             {/* Divider */}
//             <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: "#e2e8f0" }} />

//             {/* ── Avatar + dropdown ───────────────────────────────────────── */}
//             <Box
//               display="flex" alignItems="center" gap={0.8}
//               onClick={openMenu}
//               sx={{
//                 cursor: "pointer", px: 1, py: 0.5, borderRadius: "10px",
//                 "&:hover": { bgcolor: "#f8fafc" },
//                 transition: "background 0.15s",
//                 border: menuOpen ? "1px solid #e2e8f0" : "1px solid transparent",
//               }}
//             >
//               <Avatar
//                 sx={{
//                   width: 32, height: 32, bgcolor: INDIGO,
//                   fontSize: 12, fontWeight: 800,
//                   boxShadow: "0 2px 8px rgba(26,35,126,0.25)",
//                 }}
//               >
//                 {initials}
//               </Avatar>
//               {!isMobile && (
//                 <Box sx={{ lineHeight: 1 }}>
//                   <Typography sx={{ fontWeight: 700, fontSize: 13, color: NAVY }} noWrap>
//                     {fullName}
//                   </Typography>
//                   <Typography sx={{ fontSize: 10, color: SLATE }} noWrap>
//                     {(user?.role || "").toUpperCase()}
//                   </Typography>
//                 </Box>
//               )}
//               <KeyboardArrowDown
//                 sx={{
//                   fontSize: 17, color: SLATE,
//                   transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
//                   transition: "transform 0.2s",
//                 }}
//               />
//             </Box>

//             {/* ── Dropdown menu ─────────────────────────────────────────── */}
//             <Menu
//               anchorEl={anchorEl}
//               open={menuOpen}
//               onClose={closeMenu}
//               onClick={closeMenu}
//               transformOrigin={{ horizontal: "right", vertical: "top" }}
//               anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
//               PaperProps={{
//                 elevation: 0,
//                 sx: {
//                   mt: 1.5, minWidth: 230, borderRadius: "14px",
//                   border: "1px solid #e2e8f0",
//                   boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
//                   overflow: "visible",
//                   "&::before": {
//                     content: '""', display: "block", position: "absolute",
//                     top: 0, right: 20, width: 10, height: 10,
//                     bgcolor: "background.paper",
//                     transform: "translateY(-50%) rotate(45deg)",
//                     border: "1px solid #e2e8f0",
//                     borderBottom: "none", borderRight: "none",
//                     zIndex: 0,
//                   },
//                 },
//               }}
//             >
//               {/* User header */}
//               <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
//                 <Box display="flex" alignItems="center" gap={1.5} mb={1}>
//                   <Avatar sx={{ width: 40, height: 40, bgcolor: INDIGO, fontSize: 14, fontWeight: 800 }}>
//                     {initials}
//                   </Avatar>
//                   <Box>
//                     <Typography sx={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{fullName}</Typography>
//                     <Typography sx={{ fontSize: 11, color: SLATE }}>{user?.email || ""}</Typography>
//                   </Box>
//                 </Box>
//                 <Chip
//                   label={(user?.role || "user").toUpperCase()}
//                   size="small"
//                   sx={{ height: 20, fontSize: 10, fontWeight: 700,
//                     bgcolor: "#e8eaf6", color: INDIGO, borderRadius: "6px" }}
//                 />
//               </Box>

//               <Divider sx={{ borderColor: "#f1f5f9" }} />

//               <Box sx={{ p: 0.75 }}>
//                 <MenuItem
//                   component={Link} to="/profile"
//                   sx={{ py: 1.2, px: 1.5, gap: 1.5, borderRadius: "8px" }}
//                 >
//                   <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#eff6ff",
//                     display: "flex", alignItems: "center", justifyContent: "center" }}>
//                     <AccountCircle sx={{ color: BLUE, fontSize: 18 }} />
//                   </Box>
//                   <Box>
//                     <Typography sx={{ fontSize: 13, fontWeight: 600, color: NAVY }}>My Profile</Typography>
//                     <Typography sx={{ fontSize: 11, color: SLATE }}>View & edit your profile</Typography>
//                   </Box>
//                 </MenuItem>

//                 <MenuItem
//                   component={Link} to="/change-password"
//                   sx={{ py: 1.2, px: 1.5, gap: 1.5, borderRadius: "8px" }}
//                 >
//                   <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#eff6ff",
//                     display: "flex", alignItems: "center", justifyContent: "center" }}>
//                     <Lock sx={{ color: BLUE, fontSize: 18 }} />
//                   </Box>
//                   <Box>
//                     <Typography sx={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Change Password</Typography>
//                     <Typography sx={{ fontSize: 11, color: SLATE }}>Update your password</Typography>
//                   </Box>
//                 </MenuItem>
//               </Box>

//               <Divider sx={{ borderColor: "#f1f5f9" }} />

//               <Box sx={{ p: 0.75 }}>
//                 <MenuItem
//                   onClick={handleLogout}
//                   sx={{ py: 1.2, px: 1.5, gap: 1.5, borderRadius: "8px",
//                     "&:hover": { bgcolor: "#fef2f2" } }}
//                 >
//                   <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#fef2f2",
//                     display: "flex", alignItems: "center", justifyContent: "center" }}>
//                     <Logout sx={{ color: "#ef4444", fontSize: 18 }} />
//                   </Box>
//                   <Box>
//                     <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#ef4444" }}>Logout</Typography>
//                     <Typography sx={{ fontSize: 11, color: SLATE }}>Sign out of portal</Typography>
//                   </Box>
//                 </MenuItem>
//               </Box>
//             </Menu>

//           </Toolbar>
//         </AppBar>

//         {/* Page outlet */}
//         <Box
//           component="main"
//           sx={{
//             flexGrow: 1,
//             p: { xs: 2, md: 3 },
//             overflowY: "auto",
//             bgcolor: "#f8fafc",
//           }}
//         >
//           <Outlet />
//         </Box>
//       </Box>
//     </Box>
//   );
// }


import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, IconButton, Avatar,
  Tooltip, Divider, Chip, useMediaQuery, useTheme,
  Menu, MenuItem,
} from "@mui/material";
import {
  Dashboard, People, Work, Assessment, Description, Psychology,
  Menu as MenuIcon, Logout, ChevronLeft, ChevronRight,
  AccountTree, Stars, AccountCircle, Lock, KeyboardArrowDown, ArrowBack,
  PersonOutline, BadgeOutlined, AssignmentInd,              // ← AssignmentInd added
} from "@mui/icons-material";
import GlobalNotifications from "./GlobalNotifications";

const DRAWER_WIDTH      = 260;
const DRAWER_MINI_WIDTH = 72;

// ── Each item declares which roles can see it ────────────────────────────────
const NAV_ITEMS = [
  {
    label: "Dashboard",
    icon:  <Dashboard />,
    paths: [
      "/admin/dashboard",
      "/recruiter/dashboard",
      "/manager/dashboard",
      "/hr/dashboard",
    ],
    roles: ["admin", "recruiter", "manager", "hr"],
  },
  {
    label: "Recruiter Analytics",
    icon:  <People />,
    paths: ["/manager/recruiters"],
    roles: ["admin", "manager"],
  },
  {
    label: "Clients",
    icon:  <People />,
    paths: ["/clients"],
    roles: ["admin", "recruiter", "manager"],
  },
  {
    label: "Jobs",
    icon:  <Work />,
    paths: ["/jobs"],
    roles: ["admin", "recruiter", "manager"],
  },
  {
    label: "Candidates",
    icon:  <Description />,
    paths: ["/resumes"],
    // HR can access /resumes but the backend returns only "Hired" records for them
    roles: ["admin", "recruiter", "manager", "hr"],
  },
  {
    label: "Placements",
    icon:  <Stars />,
    paths: ["/placements"],
    roles: ["admin", "recruiter", "manager"],
  },
  {
    label: "Skills",
    icon:  <Psychology />,
    paths: ["/skills"],
    roles: ["admin", "recruiter"],
  },
  {
    label: "Bench People",
    icon:  <PersonOutline />,
    paths: ["/bench"],
    roles: ["admin", "hr", "manager"],
  },
  {
    label: "Employees",
    icon:  <BadgeOutlined />,
    paths: ["/employees"],
    roles: ["admin", "hr", "manager"],
  },
  {
    label: "Onboarding",
    icon:  <AssignmentInd />,
    paths: ["/onboarding"],
    roles: ["admin", "hr"],
  },
  {
    label: "Reports",
    icon:  <Assessment />,
    paths: ["/reports"],
    roles: ["admin", "manager", "hr"],
  },
];

const getUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
};

const BASE = process.env.REACT_APP_API_BASE_URL;
const logoutApi = () =>
  fetch(`${BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
  }).catch(() => {});

// ── Returns the correct dashboard path per role ──────────────────────────────
const getDashboardPath = (role) => {
  if (role === "admin")   return "/admin/dashboard";
  if (role === "manager") return "/manager/dashboard";
  if (role === "hr")      return "/hr/dashboard";        // ← HR dashboard
  return "/recruiter/dashboard";
};

// ── Design tokens ────────────────────────────────────────────────────────────
const NAVY   = "#0f172a";
const INDIGO = "#1a237e";
const BLUE   = "#1d4ed8";
const SLATE  = "#64748b";

export default function Layout() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const user     = getUser();

  const [open,       setOpen]       = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl,   setAnchorEl]   = useState(null);
  const menuOpen = Boolean(anchorEl);
  const openMenu  = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleLogout = async () => {
    closeMenu();
    await logoutApi();
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const isActive = (item) => item.paths.some((p) => location.pathname.startsWith(p));

  // For Dashboard, always route to the role-appropriate dashboard
  const navTo = (item) =>
    item.label === "Dashboard" ? getDashboardPath(user?.role) : item.paths[0];

  // ── Filter nav items by the logged-in user's role ────────────────────────
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User";
  const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "?";
  const collapsed = !open && !isMobile;
  const drawerW   = collapsed ? DRAWER_MINI_WIDTH : DRAWER_WIDTH;

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Logo */}
      <Box
        sx={{
          px: collapsed ? 1.5 : 3, py: 2.5,
          display: "flex", alignItems: "center", gap: 1.5, minHeight: 72,
          background: "linear-gradient(135deg, #0d1b4b 0%, #1a237e 100%)",
        }}
      >
        <Box
          sx={{
            width: 40, height: 40, borderRadius: "10px", flexShrink: 0,
            background: "linear-gradient(135deg, #60a5fa, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(29,78,216,0.4)",
          }}
        >
          <Work sx={{ color: "#fff", fontSize: 20 }} />
        </Box>
        {!collapsed && (
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem", lineHeight: 1.2 }}>
              ZentreeLabs
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.62rem",
              letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {user?.role === "hr" ? "HR Portal" : "Recruitment Portal"}
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: "#f1f5f9" }} />

      {/* Nav items — filtered by role */}
      <List sx={{ px: collapsed ? 1 : 1.5, py: 1.5, flexGrow: 1, overflowY: "auto",
        "&::-webkit-scrollbar": { width: 0 } }}>
        {visibleNavItems.map((item) => {
          const active = isActive(item);
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.3 }}>
              <Tooltip title={collapsed ? item.label : ""} placement="right">
                <ListItemButton
                  component={Link}
                  to={navTo(item)}
                  onClick={() => isMobile && setMobileOpen(false)}
                  sx={{
                    borderRadius: "10px",
                    px: collapsed ? 1.5 : 2, py: 1, minHeight: 44,
                    justifyContent: collapsed ? "center" : "flex-start",
                    bgcolor: active ? "#e8eaf6" : "transparent",
                    "&:hover": { bgcolor: active ? "#e8eaf6" : "#f8fafc" },
                    transition: "background 0.15s",
                    "& .MuiListItemIcon-root": {
                      color: active ? INDIGO : SLATE,
                      minWidth: collapsed ? 0 : 36,
                    },
                  }}
                >
                  <ListItemIcon sx={{ "& svg": { fontSize: 20 } }}>{item.icon}</ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 13.5,
                        fontWeight: active ? 700 : 500,
                        color: active ? INDIGO : "#334155",
                      }}
                    />
                  )}
                  {!collapsed && active && (
                    <Box sx={{ width: 3, height: 22, bgcolor: INDIGO, borderRadius: 4, ml: 1, flexShrink: 0 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "#f1f5f9" }} />

      {/* Logout */}
      <List sx={{ px: collapsed ? 1 : 1.5, py: 1 }}>
        <ListItem disablePadding>
          <Tooltip title={collapsed ? "Logout" : ""} placement="right">
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: "10px",
                px: collapsed ? 1.5 : 2, py: 1,
                justifyContent: collapsed ? "center" : "flex-start",
                "&:hover": { bgcolor: "#fef2f2" },
                "& .MuiListItemIcon-root": { color: "#ef4444", minWidth: collapsed ? 0 : 36 },
              }}
            >
              <ListItemIcon><Logout sx={{ fontSize: 20 }} /></ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500, color: "#ef4444" }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, border: "none",
            boxShadow: "4px 0 24px rgba(15,23,42,0.08)" } }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {/* Desktop drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerW, flexShrink: 0, transition: "width 0.2s",
            "& .MuiDrawer-paper": {
              width: drawerW, boxSizing: "border-box", border: "none",
              boxShadow: "2px 0 16px rgba(15,23,42,0.06)",
              transition: "width 0.2s", overflowX: "hidden",
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {/* Main area */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Top AppBar ─────────────────────────────────────────────────── */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: "#fff", borderBottom: "1px solid #e2e8f0", color: "inherit" }}
        >
          <Toolbar sx={{ px: { xs: 2, md: 3 }, gap: 1.5, minHeight: "60px !important" }}>

            {/* Sidebar toggle */}
            <IconButton
              size="small"
              onClick={() => isMobile ? setMobileOpen(true) : setOpen((p) => !p)}
              sx={{
                color: SLATE, bgcolor: "#f8fafc", border: "1px solid #e2e8f0",
                "&:hover": { bgcolor: "#f1f5f9", borderColor: "#cbd5e1" },
                borderRadius: "8px", width: 34, height: 34,
              }}
            >
              {isMobile
                ? <MenuIcon fontSize="small" />
                : open
                  ? <ChevronLeft fontSize="small" />
                  : <ChevronRight fontSize="small" />}
            </IconButton>

            {/* Back button */}
            <IconButton
              size="small"
              onClick={() => navigate(-1)}
              sx={{
                color: SLATE, bgcolor: "#f8fafc", border: "1px solid #e2e8f0",
                "&:hover": { bgcolor: "#f1f5f9", borderColor: "#cbd5e1" },
                borderRadius: "8px", width: 34, height: 34,
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>

            {/* Page title */}
            <Typography sx={{ fontWeight: 700, color: NAVY, fontSize: "1rem", flexGrow: 1 }}>
              {visibleNavItems.find((n) => isActive(n))?.label ?? "Portal"}
            </Typography>

            {/* Notification Bell */}
            <GlobalNotifications />

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: "#e2e8f0" }} />

            {/* Avatar + dropdown */}
            <Box
              display="flex" alignItems="center" gap={0.8}
              onClick={openMenu}
              sx={{
                cursor: "pointer", px: 1, py: 0.5, borderRadius: "10px",
                "&:hover": { bgcolor: "#f8fafc" },
                transition: "background 0.15s",
                border: menuOpen ? "1px solid #e2e8f0" : "1px solid transparent",
              }}
            >
              <Avatar
                sx={{
                  width: 32, height: 32, bgcolor: INDIGO,
                  fontSize: 12, fontWeight: 800,
                  boxShadow: "0 2px 8px rgba(26,35,126,0.25)",
                }}
              >
                {initials}
              </Avatar>
              {!isMobile && (
                <Box sx={{ lineHeight: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: NAVY }} noWrap>
                    {fullName}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: SLATE }} noWrap>
                    {(user?.role || "").toUpperCase()}
                  </Typography>
                </Box>
              )}
              <KeyboardArrowDown
                sx={{
                  fontSize: 17, color: SLATE,
                  transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </Box>

            {/* Dropdown menu */}
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={closeMenu}
              onClick={closeMenu}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 1.5, minWidth: 230, borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
                  overflow: "visible",
                  "&::before": {
                    content: '""', display: "block", position: "absolute",
                    top: 0, right: 20, width: 10, height: 10,
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) rotate(45deg)",
                    border: "1px solid #e2e8f0",
                    borderBottom: "none", borderRight: "none",
                    zIndex: 0,
                  },
                },
              }}
            >
              {/* User header */}
              <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: INDIGO, fontSize: 14, fontWeight: 800 }}>
                    {initials}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{fullName}</Typography>
                    <Typography sx={{ fontSize: 11, color: SLATE }}>{user?.email || ""}</Typography>
                  </Box>
                </Box>
                <Chip
                  label={(user?.role || "user").toUpperCase()}
                  size="small"
                  sx={{ height: 20, fontSize: 10, fontWeight: 700,
                    bgcolor: "#e8eaf6", color: INDIGO, borderRadius: "6px" }}
                />
              </Box>

              <Divider sx={{ borderColor: "#f1f5f9" }} />

              <Box sx={{ p: 0.75 }}>
                <MenuItem
                  component={Link} to="/profile"
                  sx={{ py: 1.2, px: 1.5, gap: 1.5, borderRadius: "8px" }}
                >
                  <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#eff6ff",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AccountCircle sx={{ color: BLUE, fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: NAVY }}>My Profile</Typography>
                    <Typography sx={{ fontSize: 11, color: SLATE }}>View & edit your profile</Typography>
                  </Box>
                </MenuItem>

                <MenuItem
                  component={Link} to="/change-password"
                  sx={{ py: 1.2, px: 1.5, gap: 1.5, borderRadius: "8px" }}
                >
                  <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#eff6ff",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Lock sx={{ color: BLUE, fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: NAVY }}>Change Password</Typography>
                    <Typography sx={{ fontSize: 11, color: SLATE }}>Update your password</Typography>
                  </Box>
                </MenuItem>
              </Box>

              <Divider sx={{ borderColor: "#f1f5f9" }} />

              <Box sx={{ p: 0.75 }}>
                <MenuItem
                  onClick={handleLogout}
                  sx={{ py: 1.2, px: 1.5, gap: 1.5, borderRadius: "8px",
                    "&:hover": { bgcolor: "#fef2f2" } }}
                >
                  <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#fef2f2",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Logout sx={{ color: "#ef4444", fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#ef4444" }}>Logout</Typography>
                    <Typography sx={{ fontSize: 11, color: SLATE }}>Sign out of portal</Typography>
                  </Box>
                </MenuItem>
              </Box>
            </Menu>

          </Toolbar>
        </AppBar>

        {/* Page outlet */}
        <Box
          component="main"
          sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, overflowY: "auto", bgcolor: "#f8fafc" }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}