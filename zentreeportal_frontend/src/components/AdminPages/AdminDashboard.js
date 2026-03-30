import React, { useEffect, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, Avatar, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, CircularProgress, Alert, Switch,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, InputAdornment, AppBar, Toolbar
} from "@mui/material";
import { People, AdminPanelSettings, Work, ManageAccounts, Delete, Refresh, Search, PersonAdd, Logout, Dashboard } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";
const roleColors = { admin: "#7b1fa2", recruiter: "#0277bd", manager: "#2e7d32" };
const roleIcons  = { admin: <AdminPanelSettings fontSize="small" />, recruiter: <Work fontSize="small" />, manager: <ManageAccounts fontSize="small" /> };

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

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: "100%", position: "relative", overflow: "hidden" }}>
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="text.secondary" fontSize={13} fontWeight={600} mb={0.5}>{title}</Typography>
          <Typography variant="h3" fontWeight={800} color={color}>{value}</Typography>
        </Box>
        <Box sx={{ width: 52, height: 52, borderRadius: 3, bgcolor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const navigate   = useNavigate();
  const user       = JSON.parse(localStorage.getItem("user") || "{}");
  const [users, setUsers]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null, name: "" });
  const [actionLoading, setActionLoading] = useState({});

  const handleLogout = async () => {
    // ── Inline API Call: logout ────────────────────────────────────────────────
    await authFetch(`${API_URL}/auth/logout`, { method: "POST" }).catch(() => {});
    // ──────────────────────────────────────────────────────────────────────────
    localStorage.clear();
    navigate("/login");
  };

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      // ── Inline API Calls: users + stats ───────────────────────────────────
      const [usersRes, statsRes] = await Promise.all([
        authFetch(`${API_URL}/admin/users`),
        authFetch(`${API_URL}/admin/stats`),
      ]);
      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      // ──────────────────────────────────────────────────────────────────────
      if (usersData.success) setUsers(usersData.users);
      if (statsData.success) setStats(statsData.stats);
    } catch { setError("Failed to load dashboard data"); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggleStatus = async (userId) => {
    setActionLoading(p => ({ ...p, [userId]: true }));
    try {
      // ── Inline API Call: toggle status ───────────────────────────────────
      const res  = await authFetch(`${API_URL}/admin/users/${userId}/toggle-status`, { method: "PATCH" });
      const data = await res.json();
      // ─────────────────────────────────────────────────────────────────────
      if (data.success) setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: data.is_active } : u));
      else setError(data.message);
    } catch { setError("Failed to update status"); }
    finally   { setActionLoading(p => ({ ...p, [userId]: false })); }
  };

  const handleDelete = async () => {
    const { userId } = deleteDialog;
    setDeleteDialog({ open: false, userId: null, name: "" });
    setActionLoading(p => ({ ...p, [userId]: true }));
    try {
      // ── Inline API Call: delete user ─────────────────────────────────────
      const res  = await authFetch(`${API_URL}/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      // ─────────────────────────────────────────────────────────────────────
      if (data.success) setUsers(prev => prev.filter(u => u.id !== userId));
      else setError(data.message);
    } catch { setError("Failed to delete user"); }
    finally   { setActionLoading(p => ({ ...p, [userId]: false })); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole   = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Navbar */}
      <AppBar position="sticky" elevation={0} sx={{ background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)" }}>
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <AdminPanelSettings sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>ZentreeLabs Portal— Admin</Typography>
          <Chip label="Admin" size="small" sx={{ bgcolor: "#7b1fa2", color: "white", fontWeight: 700, mr: 2 }} />
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout}><Logout /></IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="primary.dark">Admin Dashboard</Typography>
            <Typography color="text.secondary">Welcome back, {user?.first_name}! Manage your team below.</Typography>
          </Box>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => navigate("/register")} sx={{ borderRadius: 3, display: { xs: "none", sm: "flex" } }}>
            Add User
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>{error}</Alert>}

        {stats && (
          <Grid container spacing={3} mb={4}>
            <Grid item xs={6} sm={3}><StatCard title="Total Users"  value={stats.total_users}        icon={<People />}              color="#1a237e" /></Grid>
            <Grid item xs={6} sm={3}><StatCard title="Admins"       value={stats.by_role.admin}      icon={<AdminPanelSettings />}  color="#7b1fa2" /></Grid>
            <Grid item xs={6} sm={3}><StatCard title="Recruiters"   value={stats.by_role.recruiter}  icon={<Work />}                color="#0277bd" /></Grid>
            <Grid item xs={6} sm={3}><StatCard title="Managers"     value={stats.by_role.manager}    icon={<ManageAccounts />}      color="#2e7d32" /></Grid>
          </Grid>
        )}

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
              <Typography variant="h6" fontWeight={700}>All Users</Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <TextField size="small" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} sx={{ width: 220 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Filter Role</InputLabel>
                  <Select value={roleFilter} label="Filter Role" onChange={e => setRoleFilter(e.target.value)}>
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="recruiter">Recruiter</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                  </Select>
                </FormControl>
                <Tooltip title="Refresh"><IconButton onClick={fetchData} disabled={loading}><Refresh /></IconButton></Tooltip>
              </Box>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                      {["User","Email","Role","Status","Joined","Actions"].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 13, color: "text.secondary" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>No users found</TableCell></TableRow>
                    ) : filtered.map(u => (
                      <TableRow key={u.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ bgcolor: roleColors[u.role], width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
                              {u.first_name?.[0]}{u.last_name?.[0]}
                            </Avatar>
                            <Typography fontWeight={600} fontSize={14}>{u.first_name} {u.last_name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography fontSize={13} color="text.secondary">{u.email}</Typography></TableCell>
                        <TableCell>
                          <Chip icon={roleIcons[u.role]} label={u.role.charAt(0).toUpperCase()+u.role.slice(1)} size="small"
                            sx={{ bgcolor: `${roleColors[u.role]}18`, color: roleColors[u.role], fontWeight: 700, "& .MuiChip-icon": { color: roleColors[u.role] } }} />
                        </TableCell>
                        <TableCell>
                          <Switch size="small" checked={u.is_active} onChange={() => handleToggleStatus(u.id)}
                            disabled={u.id === user?.id || actionLoading[u.id]} color="success" />
                        </TableCell>
                        <TableCell><Typography fontSize={12} color="text.secondary">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</Typography></TableCell>
                        <TableCell>
                          <Tooltip title="Delete User"><span>
                            <IconButton size="small" color="error"
                              disabled={u.id === user?.id || actionLoading[u.id]}
                              onClick={() => setDeleteDialog({ open: true, userId: u.id, name: `${u.first_name} ${u.last_name}` })}>
                              {actionLoading[u.id] ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                            </IconButton>
                          </span></Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, userId: null, name: "" })} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete <strong>{deleteDialog.name}</strong>? This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteDialog({ open: false, userId: null, name: "" })} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
