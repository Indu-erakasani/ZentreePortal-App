import React, { useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, Avatar,
  Alert, CircularProgress, Divider, InputAdornment, IconButton, Chip,
  AppBar, Toolbar, Tooltip
} from "@mui/material";
import { Person, Email, Lock, Visibility, VisibilityOff, Save, Edit, Logout, AdminPanelSettings, Work, ManageAccounts, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";
const roleColors = { admin: "#7b1fa2", recruiter: "#0277bd", manager: "#2e7d32" };
const roleIcons  = { admin: <AdminPanelSettings />, recruiter: <Work />, manager: <ManageAccounts /> };

// ── helper: authenticated fetch ───────────────────────────────────────────────
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("access_token");
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; }
  return res;
};

const getDashboard = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "recruiter") return "/recruiter/dashboard";
  return "/manager/dashboard";
};

// ─── Profile Page ──────────────────────────────────────────────────────────────
export const ProfilePage = () => {
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem("user") || "{}");
  const [form, setForm]     = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]   = useState("");
  const [editing, setEditing] = useState(false);

  const handleLogout = async () => {
    await authFetch(`${API_URL}/auth/logout`, { method: "POST" }).catch(() => {});
    localStorage.clear();
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) { setError("Name fields are required"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      // ── Inline API Call: update profile ───────────────────────────────────────
      const res  = await authFetch(`${API_URL}/user/profile`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      // ──────────────────────────────────────────────────────────────────────────
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setSuccess("Profile updated successfully!");
        setEditing(false);
      } else { setError(data.message); }
    } catch { setError("Network error"); }
    finally   { setLoading(false); }
  };

  const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase();

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* <AppBar position="sticky" elevation={0} sx={{ background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)" }}>
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <Tooltip title="Back to Dashboard">
            <IconButton color="inherit" onClick={() => navigate(getDashboard(user?.role))} sx={{ mr: 1 }}><ArrowBack /></IconButton>
          </Tooltip>
          <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>My Profile</Typography>
          <Tooltip title="Logout"><IconButton color="inherit" onClick={handleLogout}><Logout /></IconButton></Tooltip>
        </Toolbar>
      </AppBar> */}

      <Box sx={{ maxWidth: 700, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" gap={3} mb={4}>
              <Avatar sx={{ width: 80, height: 80, fontSize: 28, fontWeight: 800, bgcolor: roleColors[user?.role] || "#1a237e", boxShadow: `0 8px 24px ${roleColors[user?.role] || "#1a237e"}40` }}>
                {initials}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800}>{user?.first_name} {user?.last_name}</Typography>
                <Typography color="text.secondary" mb={1}>{user?.email}</Typography>
                <Chip icon={roleIcons[user?.role]} label={user?.role?.charAt(0).toUpperCase()+user?.role?.slice(1)}
                  sx={{ bgcolor: `${roleColors[user?.role]}18`, color: roleColors[user?.role], fontWeight: 700 }} />
              </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />
            {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
            {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="First Name" name="first_name" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} disabled={!editing}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Last Name" name="last_name" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} disabled={!editing}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }} />
                </Grid>
              </Grid>
              <TextField fullWidth label="Email Address" value={user?.email || ""} disabled sx={{ mb: 3 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }} />
              <Box display="flex" gap={2}>
                {editing ? (
                  <>
                    <Button type="submit" variant="contained" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={loading} sx={{ borderRadius: 2 }}>
                      {loading ? "Saving…" : "Save Changes"}
                    </Button>
                    <Button variant="outlined" onClick={() => setEditing(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditing(true)} sx={{ borderRadius: 2 }}>Edit Profile</Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Account Information</Typography>
            {[
              { label: "Role",           value: user?.role },
              { label: "Account Status", value: user?.is_active ? "Active" : "Inactive" },
              { label: "Member Since",   value: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { year:"numeric", month:"long", day:"numeric" }) : "—" },
              { label: "Last Login",     value: user?.last_login ? new Date(user.last_login).toLocaleString("en-IN") : "—" },
            ].map(({ label, value }) => (
              <Box key={label} display="flex" justifyContent="space-between" py={1}
                sx={{ borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
                <Typography color="text.secondary" fontSize={14}>{label}</Typography>
                <Typography fontWeight={600} fontSize={14}>{value}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

// ─── Change Password Page ──────────────────────────────────────────────────────
export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const [form, setForm]       = useState({ current_password: "", new_password: "", confirm_new: "" });
  const [show, setShow]       = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  const handleLogout = async () => {
    await authFetch(`${API_URL}/auth/logout`, { method: "POST" }).catch(() => {});
    localStorage.clear();
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.current_password || !form.new_password || !form.confirm_new) { setError("All fields are required"); return; }
    if (form.new_password !== form.confirm_new) { setError("New passwords do not match"); return; }
    if (form.new_password.length < 8 || !/[A-Z]/.test(form.new_password) || !/[0-9]/.test(form.new_password)) {
      setError("New password must be 8+ chars with uppercase and a digit"); return;
    }
    setLoading(true); setError(""); setSuccess("");
    try {
      // ── Inline API Call: change password ─────────────────────────────────────
      const res  = await authFetch(`${API_URL}/auth/change-password`, {
        method: "PUT",
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
      });
      const data = await res.json();
      // ──────────────────────────────────────────────────────────────────────────
      if (data.success) {
        setSuccess("Password changed successfully!");
        setForm({ current_password: "", new_password: "", confirm_new: "" });
      } else { setError(data.message); }
    } catch { setError("Network error"); }
    finally   { setLoading(false); }
  };

  const passField = (label, key, showKey) => (
    <TextField fullWidth label={label} name={key} type={show[showKey] ? "text" : "password"} value={form[key]}
      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} sx={{ mb: 2 }}
      InputProps={{
        startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
        endAdornment: <InputAdornment position="end">
          <IconButton onClick={() => setShow(p => ({ ...p, [showKey]: !p[showKey] }))} edge="end">
            {show[showKey] ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      }} />
  );

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* <AppBar position="sticky" elevation={0} sx={{ background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)" }}>
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <Tooltip title="Back">
            <IconButton color="inherit" onClick={() => navigate(getDashboard(user?.role))} sx={{ mr: 1 }}><ArrowBack /></IconButton>
          </Tooltip>
          <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>Change Password</Typography>
          <Tooltip title="Logout"><IconButton color="inherit" onClick={handleLogout}><Logout /></IconButton></Tooltip>
        </Toolbar>
      </AppBar> */}

      <Box sx={{ maxWidth: 520, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}
            {error   && <Alert severity="error"   sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              {passField("Current Password", "current_password", "current")}
              <Divider sx={{ my: 2 }} />
              {passField("New Password", "new_password", "new")}
              {passField("Confirm New Password", "confirm_new", "confirm")}
              <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, mb: 3 }}>
                <Typography fontSize={12} color="text.secondary" fontWeight={600} mb={0.5}>Password requirements:</Typography>
                {["At least 8 characters","One uppercase letter","One number"].map(r => (
                  <Typography key={r} fontSize={12} color="text.secondary">• {r}</Typography>
                ))}
              </Box>
              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ borderRadius: 3, py: 1.5 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Update Password"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
