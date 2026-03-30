
// import React, { useState } from "react";
// import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
// import {
//   Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
//   ListItemIcon, ListItemText, Typography, IconButton, Avatar,
//   Tooltip, Divider, Chip, useMediaQuery, useTheme,
// } from "@mui/material";
// import {
//   Dashboard, People, Work, Assessment, Description, Psychology,
//   Menu, Logout, ChevronLeft, ChevronRight, AccountTree, Stars,
// } from "@mui/icons-material";

// const DRAWER_WIDTH      = 260;
// const DRAWER_MINI_WIDTH = 72;

// const NAV_ITEMS = [
//   { label: "Dashboard",  icon: <Dashboard />,  paths: ["/admin/dashboard", "/recruiter/dashboard", "/manager/dashboard"] },
//   { label: "Clients",    icon: <People />,     paths: ["/clients"]     },
//   { label: "Jobs",       icon: <Work />,       paths: ["/jobs"]        },
//   { label: "Resumes",    icon: <Description />,paths: ["/resumes"]     },
//   { label: "Tracking",   icon: <AccountTree />,paths: ["/tracking"]    },
//   { label: "Placements", icon: <Stars />,      paths: ["/placements"]  },
//   { label: "Skills",     icon: <Psychology />, paths: ["/skills"]      },
//   { label: "Reports",    icon: <Assessment />, paths: ["/reports"]     },
// ];

// // ── Read user from localStorage (no context needed) ───────────────────────────
// const getUser = () => {
//   try {
//     return JSON.parse(localStorage.getItem("user") || "{}");
//   } catch {
//     return {};
//   }
// };

// // ── Logout: clear storage + navigate to /login ────────────────────────────────
// const BASE = "http://localhost:5000/api";
// const logoutApi = () =>
//   fetch(`${BASE}/auth/logout`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
//     },
//   }).catch(() => {});   // ignore network errors on logout

// // ── Resolve which dashboard path to use based on role ─────────────────────────
// const getDashboardPath = (role) => {
//   if (role === "admin")     return "/admin/dashboard";
//   if (role === "manager")   return "/manager/dashboard";
//   return "/recruiter/dashboard";
// };

// export default function Layout() {
//   const theme    = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down("md"));
//   const navigate = useNavigate();
//   const location = useLocation();
//   const user     = getUser();

//   const [open,       setOpen]       = useState(true);
//   const [mobileOpen, setMobileOpen] = useState(false);

//   const collapsed = !open && !isMobile;
//   const drawerW   = collapsed ? DRAWER_MINI_WIDTH : DRAWER_WIDTH;

//   // ── Logout handler ─────────────────────────────────────────────────────────
//   const handleLogout = async () => {
//     await logoutApi();
//     localStorage.clear();
//     navigate("/login", { replace: true });
//   };

//   // ── Active nav check ───────────────────────────────────────────────────────
//   const isActive = (item) =>
//     item.paths.some(p => location.pathname.startsWith(p));

//   // ── Nav link target: dashboard goes to role-specific path ─────────────────
//   const navTo = (item) =>
//     item.label === "Dashboard"
//       ? getDashboardPath(user?.role)
//       : item.paths[0];

//   // ── Sidebar ────────────────────────────────────────────────────────────────
//   const SidebarContent = () => (
//     <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

//       {/* Logo */}
//       <Box sx={{
//         px: collapsed ? 1.5 : 3, py: 2.5,
//         display: "flex", alignItems: "center", gap: 1.5, minHeight: 72,
//         background: "linear-gradient(135deg, #0d1b4b 0%, #1a237e 100%)",
//       }}>
//         <Box sx={{
//           width: 40, height: 40, borderRadius: 2, flexShrink: 0,
//           background: "linear-gradient(135deg, #42a5f5, #1565c0)",
//           display: "flex", alignItems: "center", justifyContent: "center",
//           boxShadow: "0 4px 12px rgba(66,165,245,0.4)",
//         }}>
//           <Work sx={{ color: "#fff", fontSize: 20 }} />
//         </Box>
//         {!collapsed && (
//           <Box>
//             <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem", lineHeight: 1.2 }}>
//               ZentreeLabs
//             </Typography>
//             <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem", letterSpacing: "0.08em" }}>
//               RECRUITMENT PORTAL
//             </Typography>
//           </Box>
//         )}
//       </Box>

//       {/* User info */}
//       {!collapsed && (
//         <Box sx={{ px: 2.5, py: 1.8, bgcolor: "#f0f4f8" }}>
//           <Box display="flex" alignItems="center" gap={1.5}>
//             <Avatar sx={{ width: 36, height: 36, bgcolor: "#1a237e", fontSize: 13, fontWeight: 700 }}>
//               {user?.first_name?.[0]}{user?.last_name?.[0]}
//             </Avatar>
//             <Box sx={{ overflow: "hidden" }}>
//               <Typography fontWeight={700} fontSize={13} noWrap>
//                 {user?.first_name} {user?.last_name}
//               </Typography>
//               <Chip
//                 label={(user?.role || "user").toUpperCase()}
//                 size="small"
//                 sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: "#e8eaf6", color: "#1a237e", mt: 0.2 }}
//               />
//             </Box>
//           </Box>
//         </Box>
//       )}

//       <Divider />

//       {/* Nav items */}
//       <List sx={{ px: collapsed ? 1 : 1.5, py: 1.5, flexGrow: 1 }}>
//         {NAV_ITEMS.map((item) => {
//           const active = isActive(item);
//           return (
//             <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
//               <Tooltip title={collapsed ? item.label : ""} placement="right">
//                 <ListItemButton
//                   component={Link}
//                   to={navTo(item)}
//                   onClick={() => isMobile && setMobileOpen(false)}
//                   sx={{
//                     borderRadius: 2,
//                     px: collapsed ? 1.5 : 2,
//                     py: 1.1,
//                     minHeight: 46,
//                     justifyContent: collapsed ? "center" : "flex-start",
//                     bgcolor: active ? "#e8eaf6" : "transparent",
//                     "&:hover": { bgcolor: active ? "#e8eaf6" : "#f5f5f5" },
//                     "& .MuiListItemIcon-root": {
//                       color: active ? "#1a237e" : "#78909c",
//                       minWidth: collapsed ? 0 : 38,
//                     },
//                   }}
//                 >
//                   <ListItemIcon>{item.icon}</ListItemIcon>
//                   {!collapsed && (
//                     <ListItemText
//                       primary={item.label}
//                       primaryTypographyProps={{
//                         fontSize: 14,
//                         fontWeight: active ? 700 : 500,
//                         color: active ? "#1a237e" : "#37474f",
//                       }}
//                     />
//                   )}
//                   {!collapsed && active && (
//                     <Box sx={{ width: 4, height: 28, bgcolor: "#1a237e", borderRadius: 2, ml: 1 }} />
//                   )}
//                 </ListItemButton>
//               </Tooltip>
//             </ListItem>
//           );
//         })}
//       </List>

//       <Divider />

//       {/* Logout */}
//       <List sx={{ px: collapsed ? 1 : 1.5, py: 1 }}>
//         <ListItem disablePadding>
//           <Tooltip title={collapsed ? "Logout" : ""} placement="right">
//             <ListItemButton
//               onClick={handleLogout}
//               sx={{
//                 borderRadius: 2,
//                 px: collapsed ? 1.5 : 2, py: 1,
//                 justifyContent: collapsed ? "center" : "flex-start",
//                 "&:hover": { bgcolor: "#ffebee" },
//                 "& .MuiListItemIcon-root": { color: "#e53935", minWidth: collapsed ? 0 : 38 },
//               }}
//             >
//               <ListItemIcon><Logout /></ListItemIcon>
//               {!collapsed && (
//                 <ListItemText
//                   primary="Logout"
//                   primaryTypographyProps={{ fontSize: 14, fontWeight: 500, color: "#e53935" }}
//                 />
//               )}
//             </ListItemButton>
//           </Tooltip>
//         </ListItem>
//       </List>

//     </Box>
//   );

//   return (
//     <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>

//       {/* Mobile drawer */}
//       {isMobile && (
//         <Drawer
//           variant="temporary"
//           open={mobileOpen}
//           onClose={() => setMobileOpen(false)}
//           ModalProps={{ keepMounted: true }}
//           sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, border: "none" } }}
//         >
//           <SidebarContent />
//         </Drawer>
//       )}

//       {/* Desktop drawer */}
//       {!isMobile && (
//         <Drawer
//           variant="permanent"
//           sx={{
//             width: drawerW, flexShrink: 0,
//             transition: "width 0.2s",
//             "& .MuiDrawer-paper": {
//               width: drawerW,
//               boxSizing: "border-box",
//               border: "none",
//               boxShadow: "2px 0 16px rgba(0,0,0,0.06)",
//               transition: "width 0.2s",
//               overflowX: "hidden",
//             },
//           }}
//         >
//           <SidebarContent />
//         </Drawer>
//       )}

//       {/* Main content area */}
//       <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

//         {/* Top AppBar */}
//         <AppBar
//           position="sticky" elevation={0}
//           sx={{ bgcolor: "#fff", borderBottom: "1px solid #e0e0e0", color: "inherit" }}
//         >
//           <Toolbar sx={{ px: { xs: 2, md: 3 }, gap: 2 }}>
//             <IconButton
//               size="small"
//               sx={{ color: "#546e7a" }}
//               onClick={() => isMobile ? setMobileOpen(true) : setOpen(p => !p)}
//             >
//               {isMobile ? <Menu /> : open ? <ChevronLeft /> : <ChevronRight />}
//             </IconButton>

//             <Typography fontWeight={700} color="primary.dark" sx={{ flexGrow: 1, fontSize: "1.05rem" }}>
//               {NAV_ITEMS.find(n => isActive(n))?.label ?? "Portal"}
//             </Typography>

//             <Tooltip title={`${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Profile"}>
//               <Avatar
//                 sx={{ width: 34, height: 34, bgcolor: "#1a237e", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
//               >
//                 {user?.first_name?.[0]}{user?.last_name?.[0]}
//               </Avatar>
//             </Tooltip>
//           </Toolbar>
//         </AppBar>

//         {/* Page outlet */}
//         <Box
//           component="main"
//           sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, overflowY: "auto", bgcolor: "background.default" }}
//         >
//           <Outlet />
//         </Box>

//       </Box>
//     </Box>
//   );
// }


// src/components/Layout.jsx
import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, IconButton, Avatar,
  Tooltip, Divider, Chip, useMediaQuery, useTheme,
  Menu, MenuItem, ListItemAvatar,
} from "@mui/material";
import {
  Dashboard, People, Work, Assessment, Description, Psychology,
  Menu as MenuIcon, Logout, ChevronLeft, ChevronRight,
  AccountTree, Stars, AccountCircle, Lock, KeyboardArrowDown,
} from "@mui/icons-material";

const DRAWER_WIDTH      = 260;
const DRAWER_MINI_WIDTH = 72;

const NAV_ITEMS = [
  { label: "Dashboard",  icon: <Dashboard />,  paths: ["/admin/dashboard", "/recruiter/dashboard", "/manager/dashboard"] },
  { label: "Recruiter analytics",    icon: <People />,     paths: ["/manager/recruiters"]     },
  { label: "Clients",    icon: <People />,     paths: ["/clients"]     },
  { label: "Jobs",       icon: <Work />,       paths: ["/jobs"]        },
  { label: "Resumes",    icon: <Description />,paths: ["/resumes"]     },
  { label: "Tracking",   icon: <AccountTree />,paths: ["/tracking"]    },
  { label: "Placements", icon: <Stars />,      paths: ["/placements"]  },
  { label: "Skills",     icon: <Psychology />, paths: ["/skills"]      },
  { label: "Reports",    icon: <Assessment />, paths: ["/reports"]     },
];

const getUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
};

const BASE = "http://localhost:5000/api";
const logoutApi = () =>
  fetch(`${BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
    },
  }).catch(() => {});

const getDashboardPath = (role) => {
  if (role === "admin")   return "/admin/dashboard";
  if (role === "manager") return "/manager/dashboard";
  return "/recruiter/dashboard";
};

export default function Layout() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const user     = getUser();

  const [open,       setOpen]       = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Avatar dropdown menu state ────────────────────────────────────────────
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const openMenu  = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = ()  => setAnchorEl(null);

  const handleLogout = async () => {
    closeMenu();
    await logoutApi();
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const isActive = (item) => item.paths.some(p => location.pathname.startsWith(p));

  const navTo = (item) =>
    item.label === "Dashboard" ? getDashboardPath(user?.role) : item.paths[0];

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User";
  const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() || "?";

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Logo */}
      <Box sx={{
        px: collapsed ? 1.5 : 3, py: 2.5,
        display: "flex", alignItems: "center", gap: 1.5, minHeight: 72,
        background: "linear-gradient(135deg, #0d1b4b 0%, #1a237e 100%)",
      }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, flexShrink: 0,
          background: "linear-gradient(135deg, #42a5f5, #1565c0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(66,165,245,0.4)",
        }}>
          <Work sx={{ color: "#fff", fontSize: 20 }} />
        </Box>
        {!collapsed && (
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem", lineHeight: 1.2 }}>
              ZentreeLabs
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem", letterSpacing: "0.08em" }}>
              RECRUITMENT PORTAL
            </Typography>
          </Box>
        )}
      </Box>

      {/* User info strip */}
      {/* {!collapsed && (
        <Box sx={{ px: 2.5, py: 1.8, bgcolor: "#f0f4f8" }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "#1a237e", fontSize: 13, fontWeight: 700 }}>
              {initials}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography fontWeight={700} fontSize={13} noWrap>{fullName}</Typography>
              <Chip
                label={(user?.role || "user").toUpperCase()}
                size="small"
                sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: "#e8eaf6", color: "#1a237e", mt: 0.2 }}
              />
            </Box>
          </Box>
        </Box>
      )} */}

      <Divider />

      {/* Nav items */}
      <List sx={{ px: collapsed ? 1 : 1.5, py: 1.5, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.label : ""} placement="right">
                <ListItemButton
                  component={Link}
                  to={navTo(item)}
                  onClick={() => isMobile && setMobileOpen(false)}
                  sx={{
                    borderRadius: 2,
                    px: collapsed ? 1.5 : 2, py: 1.1, minHeight: 46,
                    justifyContent: collapsed ? "center" : "flex-start",
                    bgcolor: active ? "#e8eaf6" : "transparent",
                    "&:hover": { bgcolor: active ? "#e8eaf6" : "#f5f5f5" },
                    "& .MuiListItemIcon-root": {
                      color: active ? "#1a237e" : "#78909c",
                      minWidth: collapsed ? 0 : 38,
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: active ? 700 : 500,
                        color: active ? "#1a237e" : "#37474f",
                      }}
                    />
                  )}
                  {!collapsed && active && (
                    <Box sx={{ width: 4, height: 28, bgcolor: "#1a237e", borderRadius: 2, ml: 1 }} />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Logout */}
      <List sx={{ px: collapsed ? 1 : 1.5, py: 1 }}>
        <ListItem disablePadding>
          <Tooltip title={collapsed ? "Logout" : ""} placement="right">
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                px: collapsed ? 1.5 : 2, py: 1,
                justifyContent: collapsed ? "center" : "flex-start",
                "&:hover": { bgcolor: "#ffebee" },
                "& .MuiListItemIcon-root": { color: "#e53935", minWidth: collapsed ? 0 : 38 },
              }}
            >
              <ListItemIcon><Logout /></ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 500, color: "#e53935" }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  const collapsed = !open && !isMobile;
  const drawerW   = collapsed ? DRAWER_MINI_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, border: "none" } }}
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
              boxShadow: "2px 0 16px rgba(0,0,0,0.06)",
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
          position="sticky" elevation={0}
          sx={{ bgcolor: "#fff", borderBottom: "1px solid #e0e0e0", color: "inherit" }}
        >
          <Toolbar sx={{ px: { xs: 2, md: 3 }, gap: 2 }}>

            {/* Sidebar toggle */}
            <IconButton
              size="small" sx={{ color: "#546e7a" }}
              onClick={() => isMobile ? setMobileOpen(true) : setOpen(p => !p)}
            >
              {isMobile ? <MenuIcon /> : open ? <ChevronLeft /> : <ChevronRight />}
            </IconButton>

            {/* Page title */}
            <Typography fontWeight={700} color="primary.dark" sx={{ flexGrow: 1, fontSize: "1.05rem" }}>
              {NAV_ITEMS.find(n => isActive(n))?.label ?? "Portal"}
            </Typography>

            {/* ── Avatar + dropdown trigger ──────────────────────────────── */}
            <Box
              display="flex" alignItems="center" gap={0.8}
              onClick={openMenu}
              sx={{
                cursor: "pointer", px: 1, py: 0.5, borderRadius: 2,
                "&:hover": { bgcolor: "#f5f5f5" },
                transition: "background 0.15s",
              }}
            >
              <Avatar sx={{ width: 34, height: 34, bgcolor: "#1a237e", fontSize: 13, fontWeight: 700 }}>
                {initials}
              </Avatar>
              {/* Show name on desktop */}
              {!isMobile && (
                <Box sx={{ lineHeight: 1 }}>
                  <Typography fontWeight={700} fontSize={13} color="text.primary" noWrap>
                    {fullName}
                  </Typography>
                  <Typography fontSize={11} color="text.secondary" noWrap>
                    {(user?.role || "").toUpperCase()}
                  </Typography>
                </Box>
              )}
              <KeyboardArrowDown
                sx={{
                  fontSize: 18, color: "#78909c",
                  transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </Box>

            {/* ── Dropdown menu ──────────────────────────────────────────── */}
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={closeMenu}
              onClick={closeMenu}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              PaperProps={{
                elevation: 4,
                sx: {
                  mt: 1, minWidth: 220, borderRadius: 2,
                  overflow: "visible",
                  filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.12))",
                  "&::before": {            // little arrow caret
                    content: '""',
                    display: "block",
                    position: "absolute",
                    top: 0, right: 18,
                    width: 10, height: 10,
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) rotate(45deg)",
                    zIndex: 0,
                  },
                },
              }}
            >
              {/* User header inside menu */}
              <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <Typography fontWeight={700} fontSize={14}>{fullName}</Typography>
                <Typography fontSize={12} color="text.secondary">{user?.email || ""}</Typography>
                <Chip
                  label={(user?.role || "user").toUpperCase()}
                  size="small"
                  sx={{ mt: 0.8, height: 18, fontSize: 10, fontWeight: 700, bgcolor: "#e8eaf6", color: "#1a237e" }}
                />
              </Box>

              <Divider sx={{ my: 0.5 }} />

              {/* Profile */}
              <MenuItem
                component={Link}
                to="/profile"
                sx={{ py: 1.2, px: 2, gap: 1.5, borderRadius: 1, mx: 0.5 }}
              >
                <AccountCircle sx={{ color: "#1a237e", fontSize: 20 }} />
                <Box>
                  <Typography fontSize={14} fontWeight={600}>My Profile</Typography>
                  <Typography fontSize={11} color="text.secondary">View &amp; edit your profile</Typography>
                </Box>
              </MenuItem>

              {/* Change Password */}
              <MenuItem
                component={Link}
                to="/change-password"
                sx={{ py: 1.2, px: 2, gap: 1.5, borderRadius: 1, mx: 0.5 }}
              >
                <Lock sx={{ color: "#0277bd", fontSize: 20 }} />
                <Box>
                  <Typography fontSize={14} fontWeight={600}>Change Password</Typography>
                  <Typography fontSize={11} color="text.secondary">Update your password</Typography>
                </Box>
              </MenuItem>

              <Divider sx={{ my: 0.5 }} />

              {/* Logout */}
              <MenuItem
                onClick={handleLogout}
                sx={{ py: 1.2, px: 2, gap: 1.5, borderRadius: 1, mx: 0.5, mb: 0.5,
                      "&:hover": { bgcolor: "#ffebee" } }}
              >
                <Logout sx={{ color: "#e53935", fontSize: 20 }} />
                <Box>
                  <Typography fontSize={14} fontWeight={600} color="error.main">Logout</Typography>
                  <Typography fontSize={11} color="text.secondary">Sign out of portal</Typography>
                </Box>
              </MenuItem>
            </Menu>

          </Toolbar>
        </AppBar>

        {/* Page outlet */}
        <Box
          component="main"
          sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, overflowY: "auto", bgcolor: "background.default" }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}