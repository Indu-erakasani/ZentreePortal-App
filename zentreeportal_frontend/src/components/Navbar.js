import React, { useState } from "react";
import {
  AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem,
  IconButton, Chip, Divider, ListItemIcon, Tooltip
} from "@mui/material";
import {
  Dashboard, Person, Lock, Logout, Menu as MenuIcon,
  AdminPanelSettings, Work, ManageAccounts
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleColors = { admin: "#7b1fa2", recruiter: "#0277bd", manager: "#2e7d32" };
const roleIcons = {
  admin: <AdminPanelSettings fontSize="small" />,
  recruiter: <Work fontSize="small" />,
  manager: <ManageAccounts fontSize="small" />,
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate("/login");
  };

  const getDashboardPath = () => {
    if (user?.role === "admin") return "/admin/dashboard";
    if (user?.role === "recruiter") return "/recruiter/dashboard";
    if (user?.role === "manager") return "/manager/dashboard";
    return "/";
  };

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "?";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
        {/* Logo */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", flexGrow: 1 }}
          onClick={() => navigate(getDashboardPath())}
        >
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <AdminPanelSettings sx={{ color: "white", fontSize: 22 }} />
          </Box>
          <Typography variant="h6" sx={{ color: "white", fontWeight: 800, letterSpacing: "-0.5px" }}>
            AuthPortal
          </Typography>
        </Box>

        {/* Nav Links */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, mr: 2 }}>
          <Button
            startIcon={<Dashboard />}
            onClick={() => navigate(getDashboardPath())}
            sx={{ color: "rgba(255,255,255,0.85)", "&:hover": { color: "white", background: "rgba(255,255,255,0.1)" } }}
          >
            Dashboard
          </Button>
        </Box>

        {/* Role Chip */}
        {user && (
          <Chip
            icon={roleIcons[user.role]}
            label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            size="small"
            sx={{
              mr: 2,
              bgcolor: roleColors[user.role],
              color: "white",
              fontWeight: 700,
              "& .MuiChip-icon": { color: "white" },
              display: { xs: "none", sm: "flex" },
            }}
          />
        )}

        {/* Avatar Menu */}
        <Tooltip title="Account">
          <IconButton onClick={handleMenu} sx={{ p: 0 }}>
            <Avatar
              sx={{
                bgcolor: roleColors[user?.role] || "#1a237e",
                width: 38, height: 38,
                fontWeight: 700, fontSize: 15,
                border: "2px solid rgba(255,255,255,0.4)",
              }}
            >
              {initials}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            elevation: 4,
            sx: { mt: 1.5, minWidth: 220, borderRadius: 3, overflow: "visible",
              "&:before": {
                content: '""', display: "block", position: "absolute",
                top: 0, right: 14, width: 10, height: 10,
                bgcolor: "background.paper", transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleClose(); navigate("/profile"); }}>
            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
            My Profile
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); navigate("/change-password"); }}>
            <ListItemIcon><Lock fontSize="small" /></ListItemIcon>
            Change Password
          </MenuItem>
          {user?.role === "admin" && (
            <MenuItem onClick={() => { handleClose(); navigate("/admin/users"); }}>
              <ListItemIcon><AdminPanelSettings fontSize="small" /></ListItemIcon>
              Manage Users
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
            <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
