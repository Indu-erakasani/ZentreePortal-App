
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Alert, LinearProgress, Avatar, List, ListItem, ListItemAvatar,
  ListItemText, Divider, Button, Table, TableHead, TableBody,
  TableRow, TableCell, Paper, Tooltip,
} from "@mui/material";
import {
  People, Work, CheckCircle, TrendingUp, AccessTime,
  Star, Add, Description, MonetizationOn, Business,
  WorkOutline, PersonOff,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

// ── API ───────────────────────────────────────────────────────────────────────
const BASE = process.env.REACT_APP_API_BASE_URL;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const authFetch = (url) =>
  fetch(url, { headers: getHeaders() })
    .then(async r => {
      if (r.status === 401) { localStorage.clear(); window.location.href = "/login"; }
      const d = await r.json();
      if (!r.ok) throw d;
      return d;
    });

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (!v && v !== 0) return "—";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${Number(v).toLocaleString("en-IN")}`;
};

// Convert ISO timestamp → "X hours ago / X days ago"
const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

// ── Sub-components ────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color, sub, progress }) => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Box>
          <Typography fontSize={11} fontWeight={700} color="text.secondary"
            textTransform="uppercase" letterSpacing={0.6}>{title}</Typography>
          <Typography variant="h3" fontWeight={800} mt={0.5} sx={{ color }}>{value ?? "—"}</Typography>
          {sub && (
            <Typography fontSize={12} color="text.secondary" mt={0.4}>{sub}</Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}18`, color, width: 52, height: 52 }}>{icon}</Avatar>
      </Box>
      {progress !== undefined && (
        <LinearProgress variant="determinate" value={Math.min(progress, 100)}
          sx={{ height: 5, borderRadius: 3, bgcolor: `${color}18`,
            "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }} />
      )}
    </CardContent>
  </Card>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIORITY_COLOR = { Critical: "error", High: "warning", Medium: "info", Low: "default" };

const ACTIVITY_STYLE = {
  placement: { bg: "#e8f5e9", color: "#2e7d32", label: "✓"  },
  interview: { bg: "#e3f2fd", color: "#0277bd", label: "📅" },
  client:    { bg: "#ede7f6", color: "#6a1b9a", label: "🏢" },
  job:       { bg: "#fff3e0", color: "#e65100", label: "💼" },
  candidate: { bg: "#f5f5f5", color: "#616161", label: "👤" },
};

// Candidate status → pipeline display config
const STAGE_COLORS = {
  "New":          "#546e7a",
  "In Review":    "#e65100",
  "Shortlisted":  "#0277bd",
  "Interviewed":  "#7b1fa2",
  "Offered":      "#f57f17",
  "Hired":        "#2e7d32",
  "Rejected":     "#c62828",
  "On Hold":      "#795548",
  // tracking stages
  "Screening":           "#546e7a",
  "Shortlisting":        "#0277bd",
  "Technical Interview": "#7b1fa2",
  "HR Interview":        "#e65100",
  "Final Interview":     "#f57f17",
  "Offer":               "#2e7d32",
  "Negotiation":         "#00838f",
  "Joined":              "#1b5e20",
  "Dropped":             "#c62828",
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RecruiterDashboard() {
  const [dash,    setDash]    = useState(null);   // /api/dashboard/
  const [myData,  setMyData]  = useState(null);   // /api/dashboard/recruiter
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      // Call both endpoints in parallel
      const [main, recruiter] = await Promise.all([
        authFetch(`${BASE}/dashboard/`),
        authFetch(`${BASE}/dashboard/recruiter`).catch(() => null),
      ]);
      if (main.success)      setDash(main.dashboard);
      if (recruiter?.success) setMyData(recruiter.dashboard);
    } catch (e) {
      setError(e?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={48} />
      </Box>
    );

  // ── Destructure real data with safe fallbacks ──────────────────────────────
  const kpis            = dash?.kpis             || {};
  const stageCountsRaw  = dash?.stage_counts     || [];   // [{stage, count}] — tracking
  const pipelineRaw     = dash?.pipeline         || {};   // {status:count} — resume_bank
  const highPriorityJobs= dash?.high_priority_jobs || [];
  const recruiterPerf   = dash?.recruiter_perf   || [];
  const clientRevenue   = dash?.client_revenue   || [];
  const recentActivity  = dash?.recent_activity  || [];

  // My scoped data (recruiter endpoint)
  const myStats      = myData?.stats       || {};
  const myPipeline   = myData?.my_pipeline || [];   // [{stage, count}]
  const myCandidates = myData?.my_candidates || [];
  const myJobs       = myData?.my_jobs     || [];

  // Build pipeline display — prefer tracking stage_counts, fallback to resume_bank pipeline
  const pipelineDisplay = stageCountsRaw.length > 0
    ? stageCountsRaw
    : Object.entries(pipelineRaw).map(([stage, count]) => ({ stage, count }));

  const maxPipelineCount = Math.max(...pipelineDisplay.map(p => p.count), 1);

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="warning" onClose={() => setError("")}>{error}</Alert>}

      {/* ── Welcome banner ── */}
      <Card sx={{
        background: "linear-gradient(135deg, #1a237e 0%, #0277bd 100%)",
        color: "#fff",
      }}>
        <CardContent sx={{ p: 3, display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Welcome back{myData?.recruiter_name ? `, ${myData.recruiter_name.split(" ")[0]}` : ""}! 👋
            </Typography>
            <Typography sx={{ opacity: 0.85, mt: 0.5, fontSize: 14 }}>
              {kpis.open_jobs ?? 0} open positions · {kpis.total_candidates ?? 0} candidates · {kpis.placements_mtd ?? 0} placements this month
            </Typography>
          </Box>
          <Box display="flex" gap={1.5}>
            <Button component={Link} to="/jobs" variant="contained" startIcon={<Add />}
              sx={{ bgcolor: "#fff", color: "#fff", fontWeight: 700,
                "&:hover": { bgcolor: "#e8eaf6" } }}>
              Post Job
            </Button>
            <Button component={Link} to="/resumes" variant="outlined"
              sx={{ borderColor: "rgba(255,255,255,0.6)", color: "#fff",
                "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}>
              Resume Bank
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── KPI cards — all real data ── */}
      <Grid container spacing={2.5}>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Active Clients"
            value={kpis.active_clients ?? 0}
            icon={<Business />} color="#1a237e"
            sub={`${kpis.total_clients ?? 0} total`}
            progress={kpis.total_clients ? (kpis.active_clients / kpis.total_clients) * 100 : 0}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Open Positions"
            value={kpis.open_jobs ?? 0}
            icon={<Work />} color="#0277bd"
            sub={`${kpis.total_jobs ?? 0} total jobs`}
            progress={kpis.total_jobs ? (kpis.open_jobs / kpis.total_jobs) * 100 : 0}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Total Candidates"
            value={kpis.total_candidates ?? 0}
            icon={<People />} color="#e65100"
            sub="in resume bank"
            progress={70}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            title="Placements MTD"
            value={kpis.placements_mtd ?? 0}
            icon={<CheckCircle />} color="#2e7d32"
            sub={`Fill rate ${kpis.fill_rate ?? 0}%`}
            progress={kpis.fill_rate ?? 0}
          />
        </Grid>
      </Grid>

      {/* ── Revenue + Avg Days + Fill Rate summary bar ── */}
      <Card>
        <CardContent sx={{ py: 2, px: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {[
              { icon: <MonetizationOn />, value: fmt(kpis.revenue_mtd),     label: "Revenue MTD",       color: "#1a237e" },
              { icon: <CheckCircle />,    value: `${kpis.fill_rate ?? 0}%`, label: "Fill Rate",         color: "#2e7d32" },
              { icon: <AccessTime />,     value: `${kpis.avg_days_to_fill ?? 0}d`, label: "Avg Days to Fill", color: "#e65100" },
              { icon: <WorkOutline />,    value: kpis.placements_total ?? 0, label: "Total Placements",  color: "#0277bd" },
            ].map(({ icon, value, label, color }, i) => (
              <Grid item xs={6} md={3} key={label}>
                <Box display="flex" alignItems="center" gap={1.5}
                  sx={{ borderRight: i < 3 ? { md: "1px solid #e0e0e0" } : "none", pr: { md: 2 } }}>
                  <Avatar sx={{ bgcolor: `${color}18`, color, width: 40, height: 40 }}>{icon}</Avatar>
                  <Box>
                    <Typography fontWeight={800} fontSize="1.15rem" color={color}>{value}</Typography>
                    <Typography fontSize={11} color="text.secondary">{label}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* ── Middle row: Pipeline + My recent candidates ── */}
      <Grid container spacing={2.5}>

        {/* Active Pipeline — real tracking stage counts */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2.5}>
                <TrendingUp sx={{ color: "#0277bd" }} />
                <Typography variant="h6" fontWeight={700}>Active Pipeline</Typography>
                <Chip label={`${pipelineDisplay.reduce((s, p) => s + p.count, 0)} total`}
                  size="small" sx={{ ml: "auto", fontSize: 11 }} />
              </Box>

              {pipelineDisplay.length === 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={1}>
                  <PersonOff sx={{ fontSize: 40, color: "#bdbdbd" }} />
                  <Typography fontSize={13} color="text.disabled">No active candidates yet</Typography>
                </Box>
              ) : (
                pipelineDisplay.map(({ stage, count }) => (
                  <Box key={stage} mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography fontSize={13} fontWeight={600}>{stage}</Typography>
                      <Typography fontSize={13} color="text.secondary" fontWeight={700}>{count}</Typography>
                    </Box>
                    <LinearProgress variant="determinate"
                      value={(count / maxPipelineCount) * 100}
                      sx={{
                        height: 7, borderRadius: 4,
                        bgcolor: `${STAGE_COLORS[stage] || "#546e7a"}18`,
                        "& .MuiLinearProgress-bar": {
                          bgcolor: STAGE_COLORS[stage] || "#546e7a",
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                ))
              )}

              {/* Conversion rate from kpis */}
              {kpis.fill_rate !== undefined && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#e3f2fd", borderRadius: 2, border: "1px solid #bbdefb" }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Star sx={{ color: "#f57f17", fontSize: 18 }} />
                    <Typography fontWeight={700} fontSize={13}>Fill Rate</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={800} color="#0277bd">{kpis.fill_rate}%</Typography>
                  <Typography fontSize={12} color="text.secondary">Placements / Open Positions</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* My Recent Candidates (from recruiter endpoint) */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>My Recent Candidates</Typography>
                <Button component={Link} to="/resumes" size="small" sx={{ fontSize: 12 }}>
                  View All →
                </Button>
              </Box>

              {myCandidates.length === 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" py={5} gap={1}>
                  <People sx={{ fontSize: 48, color: "#bdbdbd" }} />
                  <Typography fontSize={13} color="text.disabled">No candidates linked to your jobs yet</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {myCandidates.slice(0, 6).map((c, i) => (
                    <React.Fragment key={c._id || i}>
                      <ListItem sx={{ px: 0, py: 1.2 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: "#1a237e", fontWeight: 700, fontSize: 13, width: 36, height: 36 }}>
                            {nameInitials(c.name)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography fontWeight={600} fontSize={13}>{c.name}</Typography>}
                          secondary={
                            <Typography fontSize={11} color="text.secondary">
                              {c.linked_job_title || "No job linked"}
                            </Typography>
                          }
                        />
                        <Chip label={c.status || "New"} size="small"
                          sx={{
                            fontSize: 10, fontWeight: 700,
                            bgcolor: `${STAGE_COLORS[c.status] || "#546e7a"}18`,
                            color:   STAGE_COLORS[c.status] || "#546e7a",
                          }} />
                      </ListItem>
                      {i < myCandidates.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── High Priority Jobs ── */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={700}>High Priority Jobs</Typography>
            <Button component={Link} to="/jobs" size="small" sx={{ fontSize: 12 }}>View All →</Button>
          </Box>

          {highPriorityJobs.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={5} gap={1}>
              <WorkOutline sx={{ fontSize: 48, color: "#bdbdbd" }} />
              <Typography fontSize={13} color="text.disabled">No high priority open jobs</Typography>
            </Box>
          ) : (
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f7fa" }}>
                    {["Job ID","Position","Client","Openings","Priority","Status"].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#546e7a" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {highPriorityJobs.map(job => (
                    <TableRow key={job._id} hover>
                      <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>{job.job_id}</TableCell>
                      <TableCell>
                        <Typography fontWeight={600} fontSize={13}>{job.title}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Business sx={{ fontSize: 13, color: "#0277bd" }} />
                          {job.client_name}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{job.openings}</TableCell>
                      <TableCell>
                        <Chip label={job.priority}
                          color={PRIORITY_COLOR[job.priority] || "default"}
                          size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={job.status || "Open"} size="small"
                          sx={{ fontWeight: 700, fontSize: 11,
                            bgcolor: "#e8f5e9", color: "#2e7d32" }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* ── Bottom row: Recruiter Performance + Recent Activity ── */}
      <Grid container spacing={2.5}>

        {/* Recruiter Performance — real data */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Recruiter Performance</Typography>

              {recruiterPerf.length === 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" py={5} gap={1}>
                  <People sx={{ fontSize: 48, color: "#bdbdbd" }} />
                  <Typography fontSize={13} color="text.disabled">No placement data yet</Typography>
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f5f7fa" }}>
                        {["Recruiter","Jobs","Interviews","Placements","Revenue","Rate"].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#546e7a" }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recruiterPerf.slice(0, 6).map((r, i) => (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: 10, fontWeight: 700,
                                bgcolor: ["#1a237e","#0277bd","#2e7d32","#e65100","#7b1fa2","#00838f"][i % 6] }}>
                                {nameInitials(r.name)}
                              </Avatar>
                              <Typography fontSize={12} fontWeight={600}>{r.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{r.jobs_posted ?? 0}</TableCell>
                          <TableCell sx={{ fontSize: 12 }}>{r.interviews ?? 0}</TableCell>
                          <TableCell>
                            <Chip label={r.placements} size="small" color="success"
                              sx={{ fontWeight: 700, fontSize: 10 }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{fmt(r.revenue)}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <LinearProgress variant="determinate"
                                value={Math.min(r.conversion_rate || 0, 100)}
                                sx={{ width: 50, height: 5, borderRadius: 3,
                                  "& .MuiLinearProgress-bar": {
                                    bgcolor: (r.conversion_rate || 0) >= 30 ? "#2e7d32" : "#0277bd"
                                  }
                                }} />
                              <Typography fontSize={10} color="text.secondary">
                                {r.conversion_rate ?? 0}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity — real data with relative timestamps */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Recent Activity</Typography>

              {recentActivity.length === 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" py={5} gap={1}>
                  <AccessTime sx={{ fontSize: 48, color: "#bdbdbd" }} />
                  <Typography fontSize={13} color="text.disabled">No recent activity</Typography>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={2}>
                  {recentActivity.slice(0, 7).map((a, i) => {
                    const s = ACTIVITY_STYLE[a.type] || ACTIVITY_STYLE.candidate;
                    return (
                      <Box key={i} display="flex" gap={1.5} alignItems="flex-start">
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13,
                          bgcolor: s.bg, color: s.color, flexShrink: 0 }}>
                          {s.label}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Typography fontSize={13} color="text.primary" sx={{ lineHeight: 1.4 }}>
                            {a.message}
                          </Typography>
                          <Typography fontSize={11} color="text.secondary" mt={0.3}>
                            {a.time ? timeAgo(a.time) : ""}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Client Revenue ── */}
      {clientRevenue.length > 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2.5}>Client Revenue Overview</Typography>
            <Grid container spacing={2}>
              {clientRevenue.map((c, i) => {
                const maxRev = Math.max(...clientRevenue.map(x => x.revenue), 1);
                const colors = ["#1a237e","#0277bd","#2e7d32","#e65100","#7b1fa2","#00838f"];
                const color  = colors[i % colors.length];
                return (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Box p={2} bgcolor="#f8fbff" borderRadius={2}
                      border="1px solid #e3f2fd">
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Business sx={{ fontSize: 16, color }} />
                        <Typography fontSize={13} fontWeight={700} noWrap>{c.client}</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight={800} color={color}>
                        {fmt(c.revenue)}
                      </Typography>
                      {c.placements !== undefined && (
                        <Typography fontSize={11} color="text.secondary">
                          {c.placements} placement{c.placements !== 1 ? "s" : ""}
                        </Typography>
                      )}
                      <LinearProgress variant="determinate"
                        value={(c.revenue / maxRev) * 100}
                        sx={{ mt: 1.5, height: 5, borderRadius: 3,
                          bgcolor: `${color}18`,
                          "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 }
                        }} />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

    </Box>
  );
}