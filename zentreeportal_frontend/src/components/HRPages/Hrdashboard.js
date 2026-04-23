import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip,
  CircularProgress, Divider, LinearProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Tooltip,
} from "@mui/material";
import {
  BadgeOutlined, PersonOutline, AssignmentInd, VerifiedUser,
  TrendingUp, Groups, HourglassTop, CheckCircleOutline,
  ArrowForward, Refresh,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// ── Design tokens (matching Layout.jsx) ─────────────────────────────────────
const NAVY   = "#0f172a";
const INDIGO = "#1a237e";
const BLUE   = "#1d4ed8";
const SLATE  = "#64748b";

const BASE = process.env.REACT_APP_API_BASE_URL;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

// ── Reusable stat card ───────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, loading }) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        bgcolor: "#fff",
        height: "100%",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(15,23,42,0.08)" },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography sx={{ fontSize: 12, color: SLATE, fontWeight: 500, mb: 0.5 }}>
              {label}
            </Typography>
            {loading ? (
              <CircularProgress size={20} sx={{ color: color }} />
            ) : (
              <Typography sx={{ fontSize: 28, fontWeight: 800, color: NAVY, lineHeight: 1 }}>
                {value ?? 0}
              </Typography>
            )}
            {sub && (
              <Typography sx={{ fontSize: 11, color: SLATE, mt: 0.5 }}>{sub}</Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: "12px",
              bgcolor: `${color}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── BGV status chip ──────────────────────────────────────────────────────────
const BGV_COLORS = {
  "Not Initiated": { bg: "#f1f5f9", color: SLATE },
  "Initiated":     { bg: "#eff6ff", color: BLUE },
  "In Progress":   { bg: "#fef9c3", color: "#854d0e" },
  "Completed":     { bg: "#dcfce7", color: "#166534" },
  "Failed":        { bg: "#fee2e2", color: "#991b1b" },
};

function BgvChip({ status }) {
  const c = BGV_COLORS[status] || BGV_COLORS["Not Initiated"];
  return (
    <Chip
      label={status || "Not Initiated"}
      size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: 10, height: 20, borderRadius: "5px" }}
    />
  );
}

// ── Screening status chip ────────────────────────────────────────────────────
function StatusChip({ status }) {
  const map = {
    Hired:      { bg: "#dcfce7", color: "#166534" },
    Onboarding: { bg: "#eff6ff", color: BLUE },
    default:    { bg: "#f1f5f9", color: SLATE },
  };
  const c = map[status] || map.default;
  return (
    <Chip
      label={status}
      size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: 10, height: 20, borderRadius: "5px" }}
    />
  );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, action, onAction }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
      <Typography sx={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{title}</Typography>
      {action && (
        <Typography
          onClick={onAction}
          sx={{ fontSize: 12, color: BLUE, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 0.3,
            "&:hover": { textDecoration: "underline" } }}
        >
          {action} <ArrowForward sx={{ fontSize: 13 }} />
        </Typography>
      )}
    </Box>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
export default function HRDashboard() {
  const navigate = useNavigate();

  const [loading,    setLoading]    = useState(true);
  const [stats,      setStats]      = useState({});
  const [hired,      setHired]      = useState([]);
  const [onboarding, setOnboarding] = useState([]);
  const [bench,      setBench]      = useState([]);

  // ── Fetch all dashboard data ───────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, hiredRes, benchRes] = await Promise.allSettled([
        fetch(`${BASE}/employees/?per_page=100`, { headers: authHeaders() }),
        fetch(`${BASE}/resumes/?status=Hired&per_page=10`, { headers: authHeaders() }),
        fetch(`${BASE}/bench/?per_page=100`, { headers: authHeaders() }),
      ]);

      // Employees total
      let totalEmployees = 0;
      if (empRes.status === "fulfilled" && empRes.value.ok) {
        const d = await empRes.value.json();
        totalEmployees = d.total ?? (d.data?.length ?? 0);
      }

      // Hired candidates (recent)
      let hiredList = [];
      let totalHired = 0;
      if (hiredRes.status === "fulfilled" && hiredRes.value.ok) {
        const d = await hiredRes.value.json();
        hiredList  = d.data  ?? [];
        totalHired = d.total ?? hiredList.length;
      }

      // Bench count
      let benchCount = 0;
      if (benchRes.status === "fulfilled" && benchRes.value.ok) {
        const d = await benchRes.value.json();
        benchCount = d.total ?? (d.data?.length ?? 0);
      }

      // Derive onboarding pending from hired list (no onboarding record yet = pending)
      const onboardingPending = hiredList.filter(
        (c) => !c.onboarding_complete
      ).length;

      setStats({
        totalEmployees,
        totalHired,
        onboardingPending,
        benchCount,
      });
      setHired(hiredList.slice(0, 8));

    } catch (err) {
      console.error("HR Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Checklist progress mock (replace with real onboarding API if available) ─
  const checklistGroups = [
    { label: "Document Collection",  done: 8,  total: 12, color: BLUE   },
    { label: "BGV Initiated",        done: 6,  total: 10, color: "#7c3aed" },
    { label: "System Access",        done: 9,  total: 10, color: "#059669" },
    { label: "Payroll Enrolment",    done: 5,  total: 10, color: "#d97706" },
  ];

  return (
    <Box>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: NAVY }}>
            HR Dashboard
          </Typography>
          <Typography sx={{ fontSize: 13, color: SLATE, mt: 0.25 }}>
            Employee lifecycle · Onboarding · BGV tracking
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton
            onClick={fetchData}
            size="small"
            sx={{
              border: "1px solid #e2e8f0", borderRadius: "8px",
              bgcolor: "#fff", "&:hover": { bgcolor: "#f1f5f9" },
            }}
          >
            <Refresh fontSize="small" sx={{ color: SLATE }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<BadgeOutlined />}
            label="Total Employees"
            value={stats.totalEmployees}
            sub="Active headcount"
            color={INDIGO}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<AssignmentInd />}
            label="Onboarding Pending"
            value={stats.onboardingPending}
            sub="Hired, not yet onboarded"
            color={BLUE}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<VerifiedUser />}
            label="Hired (Total)"
            value={stats.totalHired}
            sub="All-time placements"
            color="#7c3aed"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<PersonOutline />}
            label="Bench Strength"
            value={stats.benchCount}
            sub="Available resources"
            color="#059669"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Main grid: recently hired + checklist progress ────────────────── */}
      <Grid container spacing={2.5} mb={2.5}>

        {/* Recently hired candidates */}
        <Grid item xs={12} lg={7}>
          <Card
            elevation={0}
            sx={{ border: "1px solid #e2e8f0", borderRadius: "14px", bgcolor: "#fff" }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <SectionHeader
                title="Recently Hired Candidates"
                action="View all"
                onAction={() => navigate("/resumes")}
              />
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={28} sx={{ color: INDIGO }} />
                </Box>
              ) : hired.length === 0 ? (
                <Box
                  display="flex" flexDirection="column" alignItems="center"
                  justifyContent="center" py={4} sx={{ color: SLATE }}
                >
                  <Groups sx={{ fontSize: 36, mb: 1, opacity: 0.35 }} />
                  <Typography sx={{ fontSize: 13 }}>No hired candidates yet</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {["Name", "Role", "Experience", "Notice", "Status"].map((h) => (
                          <TableCell
                            key={h}
                            sx={{ fontSize: 11, fontWeight: 700, color: SLATE,
                              borderBottom: "1px solid #f1f5f9", py: 1, px: 1.5 }}
                          >
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {hired.map((c, i) => (
                        <TableRow
                          key={c._id || i}
                          hover
                          sx={{
                            cursor: "pointer",
                            "&:hover": { bgcolor: "#f8fafc" },
                            "&:last-child td": { borderBottom: 0 },
                          }}
                          onClick={() => navigate("/resumes")}
                        >
                          <TableCell sx={{ py: 1.2, px: 1.5, borderBottom: "1px solid #f8fafc" }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar
                                sx={{
                                  width: 28, height: 28, fontSize: 11, fontWeight: 700,
                                  bgcolor: INDIGO,
                                }}
                              >
                                {(c.name || "?")[0].toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: NAVY }}>
                                  {c.name}
                                </Typography>
                                <Typography sx={{ fontSize: 11, color: SLATE }}>
                                  {c.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 1.2, px: 1.5, fontSize: 12, color: "#334155", borderBottom: "1px solid #f8fafc" }}>
                            {c.current_role || "—"}
                          </TableCell>
                          <TableCell sx={{ py: 1.2, px: 1.5, fontSize: 12, color: "#334155", borderBottom: "1px solid #f8fafc" }}>
                            {c.experience ? `${c.experience} yrs` : "—"}
                          </TableCell>
                          <TableCell sx={{ py: 1.2, px: 1.5, fontSize: 12, color: "#334155", borderBottom: "1px solid #f8fafc" }}>
                            {c.notice_period || "—"}
                          </TableCell>
                          <TableCell sx={{ py: 1.2, px: 1.5, borderBottom: "1px solid #f8fafc" }}>
                            <StatusChip status={c.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Onboarding checklist progress */}
        <Grid item xs={12} lg={5}>
          <Card
            elevation={0}
            sx={{ border: "1px solid #e2e8f0", borderRadius: "14px", bgcolor: "#fff", height: "100%" }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <SectionHeader
                title="Onboarding Progress"
                action="Manage"
                onAction={() => navigate("/employees")}
              />
              <Box display="flex" flexDirection="column" gap={2.5} mt={1}>
                {checklistGroups.map((g) => {
                  const pct = Math.round((g.done / g.total) * 100);
                  return (
                    <Box key={g.label}>
                      <Box display="flex" justifyContent="space-between" mb={0.6}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: NAVY }}>
                          {g.label}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: SLATE }}>
                          {g.done}/{g.total}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 6, borderRadius: 4,
                          bgcolor: "#f1f5f9",
                          "& .MuiLinearProgress-bar": { bgcolor: g.color, borderRadius: 4 },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>

              <Divider sx={{ my: 2.5, borderColor: "#f1f5f9" }} />

              {/* Quick action links */}
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: SLATE, mb: 1.5,
                textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.8}>
                {[
                  { label: "View Employees",    icon: <BadgeOutlined />,   path: "/employees" },
                  { label: "Bench People",      icon: <PersonOutline />,   path: "/bench"     },
                  { label: "Onboarding Tracker",icon: <HourglassTop />,    path: "/employees" },
                  { label: "Reports",           icon: <TrendingUp />,      path: "/reports"   },
                ].map((item) => (
                  <Box
                    key={item.label}
                    display="flex" alignItems="center" gap={1.2}
                    onClick={() => navigate(item.path)}
                    sx={{
                      px: 1.5, py: 1, borderRadius: "8px", cursor: "pointer",
                      "&:hover": { bgcolor: "#f8fafc" },
                      transition: "background 0.15s",
                    }}
                  >
                    <Box
                      sx={{
                        width: 30, height: 30, borderRadius: "8px",
                        bgcolor: "#e8eaf6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {React.cloneElement(item.icon, { sx: { fontSize: 16, color: INDIGO } })}
                    </Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
                      {item.label}
                    </Typography>
                    <ArrowForward sx={{ fontSize: 14, color: SLATE, ml: "auto" }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── BGV pipeline summary ─────────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{ border: "1px solid #e2e8f0", borderRadius: "14px", bgcolor: "#fff" }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <SectionHeader title="BGV Pipeline" />
          <Grid container spacing={2}>
            {[
              { label: "Not Initiated", count: 4, color: SLATE    },
              { label: "Initiated",     count: 3, color: BLUE     },
              { label: "In Progress",   count: 5, color: "#d97706"},
              { label: "Completed",     count: 8, color: "#059669"},
              { label: "Failed",        count: 1, color: "#dc2626"},
            ].map((s) => (
              <Grid item xs={6} sm={4} md key={s.label}>
                <Box
                  sx={{
                    p: 2, borderRadius: "10px", border: "1px solid #f1f5f9",
                    bgcolor: "#f8fafc", textAlign: "center",
                  }}
                >
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color: s.color }}>
                    {s.count}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: SLATE, mt: 0.25 }}>
                    {s.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}