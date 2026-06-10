
import React, { useEffect, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Alert, Avatar, LinearProgress, List, ListItem, ListItemText,
  Divider, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Paper,
} from "@mui/material";
import {
  Work, CheckCircle, AttachMoney, Schedule, Person, TrendingUp,
  FiberManualRecord, Circle,
} from "@mui/icons-material";

const API_URL = process.env.REACT_APP_API_BASE_URL;

const authFetch = async (url, opts = {}) => {
  const token = localStorage.getItem("access_token");
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; }
  return res;
};

const fmtCurrency = (v = 0) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString()}`;
};

const fmtDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

const PALETTE = ["#4f46e5","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#0284c7","#65a30d"];
const aColor  = (i) => PALETTE[i % PALETTE.length];

const PRIORITY_CONFIG = {
  Critical: { bg: "#fef2f2", color: "#b91c1c", dotColor: "#ef4444" },
  High:     { bg: "#fff7ed", color: "#c2410c", dotColor: "#f97316" },
  Medium:   { bg: "#eff6ff", color: "#1d4ed8", dotColor: "#3b82f6" },
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, icon, accent }) => (
  <Card
    elevation={0}
    sx={{
      border: "1px solid #f1f5f9",
      borderRadius: 3,
      position: "relative",
      overflow: "hidden",
      transition: "transform .15s, box-shadow .15s",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,.07)" },
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Typography
          sx={{ fontSize: 11, fontWeight: 700, color: "#64748b",
                textTransform: "uppercase", letterSpacing: ".04em" }}
        >
          {label}
        </Typography>
        <Box
          sx={{ width: 36, height: 36, borderRadius: 2, display: "flex",
                alignItems: "center", justifyContent: "center",
                bgcolor: `${accent}1a`, color: accent, flexShrink: 0 }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 20 } })}
        </Box>
      </Box>
      <Typography sx={{ fontSize: 30, fontWeight: 800, color: "#0f172a", lineHeight: 1, mb: .75 }}>
        {value ?? "—"}
      </Typography>
      {sub && <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>{sub}</Typography>}
    </CardContent>
    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, bgcolor: accent, opacity: .7 }} />
  </Card>
);

// ── Section wrapper ────────────────────────────────────────────────────────
const SectionCard = ({ title, badge, children, sx = {} }) => (
  <Card elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, ...sx }}>
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center"
           mb={2} pb={1.5} sx={{ borderBottom: "1px solid #f1f5f9" }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{title}</Typography>
        {badge != null && (
          <Chip label={badge} size="small"
                sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 11 }} />
        )}
      </Box>
      {children}
    </CardContent>
  </Card>
);

// ── Empty state ────────────────────────────────────────────────────────────
const Empty = ({ msg }) => (
  <Box textAlign="center" py={4}>
    <CheckCircle sx={{ fontSize: 40, color: "#cbd5e1", mb: 1 }} />
    <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>{msg}</Typography>
  </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
const ManagerDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [kpis, setKpis]                    = useState(null);
  const [stageCounts, setStageCounts]      = useState([]);
  const [highJobs, setHighJobs]            = useState([]);
  const [recruiterPerf, setRecruiterPerf]  = useState([]);
  const [clientRevenue, setClientRevenue]  = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading]              = useState(true);
  const [error, setError]                  = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res  = await authFetch(`${API_URL}/dashboard/`);
        const json = await res.json();
        if (!json.success) { setError(json.message || "Failed to load"); return; }
        const d = json.dashboard;
        setKpis(d.kpis               ?? {});
        setStageCounts(d.stage_counts       ?? []);
        setHighJobs(d.high_priority_jobs  ?? []);
        setRecruiterPerf(d.recruiter_perf     ?? []);
        setClientRevenue(d.client_revenue     ?? []);
        setRecentActivity(d.recent_activity    ?? []);
      } catch { setError("Network error — could not load dashboard."); }
      finally   { setLoading(false); }
    })();
  }, []);

  const maxPlacements = Math.max(1, ...recruiterPerf.map(r => r.placements));
  const maxRevenue    = Math.max(1, ...clientRevenue.map(c => c.revenue));
  const maxStage      = Math.max(1, ...stageCounts.map(s => s.count));
  const fillColor     = (kpis?.fill_rate ?? 0) >= 70 ? "#059669"
                      : (kpis?.fill_rate ?? 0) >= 40 ? "#d97706" : "#dc2626";

  if (loading) return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh">
      <CircularProgress size={48} />
    </Box>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", p: { xs: 2, md: 3 } }}>

      {/* ── Page header ── */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#0f172a">
          Good {greeting}, {user.first_name}! 👋
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#64748b", mt: .5 }}>
          Here's what's happening across your recruitment pipeline today.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ── KPI row ── */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Open Jobs",          value: kpis?.open_jobs,       sub: `of ${kpis?.total_jobs ?? 0} total`,          icon: <Work />,         accent: "#4f46e5" },
          { label: "Placements (MTD)",   value: kpis?.placements_mtd,  sub: `${kpis?.placements_total ?? 0} all-time`,    icon: <CheckCircle />,  accent: "#059669" },
          { label: "Revenue (MTD)",      value: fmtCurrency(kpis?.revenue_mtd), sub: "Billing this month",                icon: <AttachMoney />,  accent: "#0891b2" },
          { label: "Avg. Days to Fill",  value: kpis?.avg_days_to_fill != null ? `${kpis.avg_days_to_fill}d` : "—",
                                         sub: `Fill rate: ${kpis?.fill_rate ?? 0}%`,                                      icon: <Schedule />,     accent: fillColor  },
          { label: "Active Candidates",  value: kpis?.total_candidates, sub: "In resume bank",                            icon: <Person />,       accent: "#7c3aed" },
          { label: "Active Clients",     value: kpis?.active_clients,   sub: `of ${kpis?.total_clients ?? 0} total`,      icon: <TrendingUp />,   accent: "#d97706" },
        ].map((c) => (
          <Grid item xs={6} sm={4} md={2} key={c.label}>
            <KPICard {...c} />
          </Grid>
        ))}
      </Grid>

      {/* ── Row 2: Pipeline + High Priority Jobs ── */}
      <Grid container spacing={2.5} mb={2.5}>
        <Grid item xs={12} md={5}>
          <SectionCard
            title="Candidate Pipeline"
            badge={stageCounts.reduce((s, x) => s + x.count, 0)}
            sx={{ height: "100%" }}
          >
            {stageCounts.length === 0 ? <Empty msg="No active pipeline data." /> : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {stageCounts.map((item, i) => (
                  <Box key={item.stage}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: aColor(i), flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
                          {item.stage}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.count}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(item.count / maxStage) * 100}
                      sx={{
                        height: 7, borderRadius: 99,
                        bgcolor: `${aColor(i)}22`,
                        "& .MuiLinearProgress-bar": { bgcolor: aColor(i), borderRadius: 99 },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={7}>
          <SectionCard
            title="High Priority Open Jobs"
            badge={`${highJobs.length} open`}
            sx={{ height: "100%" }}
          >
            {highJobs.length === 0 ? <Empty msg="No critical or high-priority jobs open." /> : (
              <Box display="flex" flexDirection="column" gap={1}>
                {highJobs.map((job, i) => {
                  const cfg = PRIORITY_CONFIG[job.priority] ?? PRIORITY_CONFIG.Medium;
                  return (
                    <Box key={job._id ?? i}
                      sx={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                            gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: "#f8fafc",
                            border: "1px solid #f1f5f9",
                            "&:hover": { bgcolor: "#f1f5f9" }, transition: "background .15s" }}
                    >
                      <Box flex={1} overflow="hidden">
                        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a",
                                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {job.title}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#64748b", mt: .25 }}>
                          {job.client_name}{job.location ? ` · ${job.location}` : ""}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} flexShrink={0}>
                        <Chip label={`${job.openings} open`} size="small"
                              sx={{ fontSize: 11, fontWeight: 600, bgcolor: "#fff",
                                    border: "1px solid #e2e8f0", color: "#475569" }} />
                        <Chip
                          icon={<FiberManualRecord sx={{ fontSize: "8px !important", color: `${cfg.dotColor} !important` }} />}
                          label={job.priority} size="small"
                          sx={{ fontSize: 11, fontWeight: 700, bgcolor: cfg.bg, color: cfg.color, border: "none" }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </SectionCard>
        </Grid>
      </Grid>

      {/* ── Row 3: Recruiter Performance table ── */}
      <SectionCard title="Recruiter Performance" sx={{ mb: 2.5 }}>
        {recruiterPerf.length === 0 ? <Empty msg="No recruiter data yet." /> : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  {["Recruiter","Jobs Posted","Interviews","Offers","Placements","Conversion","Revenue"].map(h => (
                    <TableCell key={h}
                      sx={{ fontSize: 11, fontWeight: 700, color: "#64748b",
                            textTransform: "uppercase", letterSpacing: ".04em",
                            borderBottom: "1px solid #e2e8f0", py: 1.25 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {recruiterPerf.map((r, i) => (
                  <TableRow key={r.name ?? i}
                    sx={{ "&:hover": { bgcolor: "#f8fafc" }, "&:last-child td": { border: 0 },
                          transition: "background .12s" }}>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box display="flex" alignItems="center" gap={1.25}>
                        <Avatar sx={{ bgcolor: aColor(i), width: 32, height: 32, fontSize: 12, fontWeight: 700 }}>
                          {(r.name || "?")[0].toUpperCase()}
                        </Avatar>
                        <Typography sx={{ fontWeight: 600, fontSize: 13.5, color: "#0f172a" }}>{r.name}</Typography>
                        {i === 0 && (
                          <Chip label="TOP" size="small"
                                sx={{ fontSize: 9, fontWeight: 800, bgcolor: "#fef3c7", color: "#d97706",
                                      height: 18, ".MuiChip-label": { px: .75 } }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{r.jobs_posted}</TableCell>
                    <TableCell sx={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{r.interviews}</TableCell>
                    <TableCell sx={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{r.offers}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#059669", mb: .5 }}>
                          {r.placements}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(r.placements / maxPlacements) * 100}
                          sx={{ height: 4, borderRadius: 99, width: 80,
                                bgcolor: "#e2e8f0",
                                "& .MuiLinearProgress-bar": { bgcolor: aColor(i), borderRadius: 99 } }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={`${r.conversion_rate}%`} size="small"
                            sx={{
                              fontSize: 12, fontWeight: 700,
                              bgcolor: r.conversion_rate >= 50 ? "#f0fdf4" : r.conversion_rate >= 25 ? "#fff7ed" : "#fef2f2",
                              color:   r.conversion_rate >= 50 ? "#15803d" : r.conversion_rate >= 25 ? "#c2410c" : "#b91c1c",
                            }} />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>
                        {fmtCurrency(r.revenue)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      {/* ── Row 4: Client Revenue + Recent Activity ── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Top Clients by Revenue">
            {clientRevenue.length === 0 ? <Empty msg="No client revenue data yet." /> : (
              <Box display="flex" flexDirection="column" gap={2}>
                {clientRevenue.map((c, i) => (
                  <Box key={c.client ?? i} display="flex" alignItems="flex-start" gap={1.5}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", width: 22, pt: .25 }}>
                      #{i + 1}
                    </Typography>
                    <Box flex={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={.75}>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a",
                                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>
                          {c.client}
                        </Typography>
                        <Box textAlign="right">
                          <Typography sx={{ fontSize: 14, fontWeight: 800, color: "#7c3aed" }}>
                            {fmtCurrency(c.revenue)}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>
                            {c.placements} placement{c.placements !== 1 ? "s" : ""}
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(c.revenue / maxRevenue) * 100}
                        sx={{ height: 6, borderRadius: 99,
                              bgcolor: `${aColor(i)}22`,
                              "& .MuiLinearProgress-bar": { bgcolor: aColor(i), borderRadius: 99 } }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="Recent Activity" badge={recentActivity.length}>
            {recentActivity.length === 0 ? <Empty msg="No recent activity." /> : (
              <List disablePadding>
                {recentActivity.map((item, i) => (
                  <React.Fragment key={i}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{ px: 1, py: 1.25, borderRadius: 2,
                            "&:hover": { bgcolor: "#f8fafc" }, transition: "background .12s" }}
                    >
                      <Box
                        sx={{ width: 34, height: 34, borderRadius: 2, mr: 1.5, flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              bgcolor: item.type === "placement" ? "#f0fdf4" : "#eff6ff",
                              color:   item.type === "placement" ? "#059669"  : "#4f46e5" }}
                      >
                        {item.type === "placement"
                          ? <CheckCircle sx={{ fontSize: 18 }} />
                          : <Person      sx={{ fontSize: 18 }} />}
                      </Box>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#0f172a", lineHeight: 1.4 }}>
                            {item.message}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: .25 }}>
                            {fmtDate(item.time)}
                          </Typography>
                        }
                      />
                      <Chip
                        label={item.type === "placement" ? "Placed" : "New"}
                        size="small"
                        sx={{
                          fontSize: 11, fontWeight: 700, ml: 1, mt: .5, flexShrink: 0,
                          bgcolor: item.type === "placement" ? "#f0fdf4" : "#eff6ff",
                          color:   item.type === "placement" ? "#15803d"  : "#4338ca",
                        }}
                      />
                    </ListItem>
                    {i < recentActivity.length - 1 && <Divider sx={{ mx: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ManagerDashboard;