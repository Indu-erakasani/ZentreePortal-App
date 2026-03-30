import React, { useEffect, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress, Alert,
  Avatar, AvatarGroup, LinearProgress, List, ListItem, ListItemAvatar,
  ListItemText, Divider, Button, AppBar, Toolbar, IconButton, Tooltip
} from "@mui/material";
import { Group, Pending, Assignment, PersonAdd, CheckCircle, Schedule, TrendingUp, StarRate, Logout, ManageAccounts } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

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

const StatCard = ({ title, value, icon, color, sub }) => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="text.secondary" fontSize={13} fontWeight={600}>{title}</Typography>
          <Typography variant="h3" fontWeight={800} mt={0.5} color={color}>{value}</Typography>
          {sub && <Typography fontSize={12} color="text.secondary" mt={0.5}>{sub}</Typography>}
        </Box>
        <Box sx={{ width: 50, height: 50, borderRadius: 3, bgcolor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const mockApprovals = [
  { name: "Priya Sharma → Frontend Lead",   type: "Offer Approval", urgent: true  },
  { name: "New Headcount: Data Team",        type: "Requisition",    urgent: false },
  { name: "Rahul Verma → Salary Revision",  type: "Compensation",   urgent: true  },
  { name: "Anjali Nair → Promotion",        type: "Promotion",      urgent: false },
  { name: "New Intern Batch Q2",            type: "Requisition",    urgent: false },
];
const teamColors = ["#7b1fa2","#0277bd","#2e7d32","#e65100","#c62828","#00838f","#558b2f","#37474f"];

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const handleLogout = async () => {
    // ── Inline API Call: logout ────────────────────────────────────────────────
    await authFetch(`${API_URL}/auth/logout`, { method: "POST" }).catch(() => {});
    // ──────────────────────────────────────────────────────────────────────────
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    (async () => {
      try {
        // ── Inline API Call: manager dashboard ─────────────────────────────────
        const res  = await authFetch(`${API_URL}/user/manager/dashboard`);
        const json = await res.json();
        // ──────────────────────────────────────────────────────────────────────
        if (json.success) setData(json.dashboard);
        else setError(json.message);
      } catch { setError("Failed to load dashboard"); }
      finally   { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Box display="flex" justifyContent="center" alignItems="center" mt={12}><CircularProgress size={48} /></Box>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <AppBar position="sticky" elevation={0} sx={{ background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)" }}>
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <ManageAccounts sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>ZentreeLabs Portal— Manager</Typography>
          <Chip label="Manager" size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 700, mr: 2 }} />
          <Tooltip title="Logout"><IconButton color="inherit" onClick={handleLogout}><Logout /></IconButton></Tooltip>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight={800} color="primary.dark">Manager Portal</Typography>
          <Typography color="text.secondary">Hello, {user?.first_name}! You have {data?.stats?.pending_approvals || 5} pending approvals today.</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        <Grid container spacing={3} mb={4}>
          <Grid item xs={6} md={3}><StatCard title="Team Members"      value={data?.stats?.team_members || 8}       icon={<Group />}      color="#2e7d32" sub="Direct reports" /></Grid>
          <Grid item xs={6} md={3}><StatCard title="Pending Approvals" value={data?.stats?.pending_approvals || 5}  icon={<Pending />}    color="#e65100" sub="Needs attention" /></Grid>
          <Grid item xs={6} md={3}><StatCard title="Open Requisitions" value={data?.stats?.open_requisitions || 3}  icon={<Assignment />} color="#0277bd" sub="Active hiring" /></Grid>
          <Grid item xs={6} md={3}><StatCard title="Hires This Month"  value={data?.stats?.hires_this_month || 2}   icon={<PersonAdd />}  color="#7b1fa2" sub="Onboarding" /></Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={700}>Pending Approvals</Typography>
                  <Chip label="5 Pending" size="small" color="warning" sx={{ fontWeight: 700 }} />
                </Box>
                <List disablePadding>
                  {mockApprovals.map((item, i) => (
                    <React.Fragment key={i}>
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: item.urgent ? "#c62828" : "#455a64", width: 36, height: 36 }}>
                            {item.urgent ? <Schedule fontSize="small" /> : <CheckCircle fontSize="small" />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography fontWeight={600} fontSize={14}>{item.name}</Typography>}
                          secondary={<Typography fontSize={12} color="text.secondary">{item.type}</Typography>}
                        />
                        <Box display="flex" gap={1}>
                          {item.urgent && <Chip label="Urgent" size="small" sx={{ bgcolor: "#c6282818", color: "#c62828", fontWeight: 700, fontSize: 11 }} />}
                          <Button size="small" variant="outlined" sx={{ borderRadius: 2, minWidth: 70, fontSize: 12 }}>Review</Button>
                        </Box>
                      </ListItem>
                      {i < mockApprovals.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  <Group sx={{ mr: 1, verticalAlign: "middle", color: "#2e7d32" }} />Your Team
                </Typography>
                <AvatarGroup max={8} sx={{ justifyContent: "flex-start", mb: 2 }}>
                  {teamColors.map((color, i) => (
                    <Avatar key={i} sx={{ bgcolor: color, width: 40, height: 40, fontSize: 14, fontWeight: 700 }}>
                      {String.fromCharCode(65+i)}
                    </Avatar>
                  ))}
                </AvatarGroup>
                <Typography fontSize={13} color="text.secondary">8 direct reports · 3 contractors</Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  <TrendingUp sx={{ mr: 1, verticalAlign: "middle", color: "#7b1fa2" }} />Q2 Hiring Goals
                </Typography>
                {[
                  { label:"Engineering",  current:3, target:5, color:"#0277bd" },
                  { label:"Design",       current:1, target:2, color:"#7b1fa2" },
                  { label:"Data Science", current:2, target:3, color:"#2e7d32" },
                ].map(({ label, current, target, color }) => (
                  <Box key={label} mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography fontSize={13} fontWeight={600}>{label}</Typography>
                      <Typography fontSize={13} color="text.secondary">{current}/{target}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={(current/target)*100}
                      sx={{ height: 8, borderRadius: 4, bgcolor: `${color}18`, "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4 } }} />
                  </Box>
                ))}
                <Box sx={{ mt: 2, p: 1.5, bgcolor: "#7b1fa208", borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <StarRate sx={{ color: "#f57f17", fontSize: 20 }} />
                  <Typography fontSize={13} fontWeight={600} color="#7b1fa2">60% of Q2 goal achieved</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ManagerDashboard;
