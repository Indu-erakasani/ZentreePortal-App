


import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Card, CardContent, CardHeader, Typography, Button, MenuItem,
  TextField, Tab, Tabs, Table, TableHead, TableBody, TableRow,
  TableCell, Paper, Chip, Avatar, CircularProgress, Alert, Grid,
  LinearProgress, Divider, IconButton, Tooltip,
} from "@mui/material";
import {
  Dashboard, People, Business, TrendingUp, Source,
  Download, Refresh, WorkOutline, CheckCircle,
  AccessTime, MonetizationOn, BarChart,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip as ChartTooltip,
  Legend, Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, ChartTooltip, Legend, Filler
);

// ── API ───────────────────────────────────────────────────────────────────────
const BASE = process.env.REACT_APP_API_BASE_URL ;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const fetchReport = (endpoint, period) =>
  fetch(`${BASE}/reports/${endpoint}?period=${period}`, { headers: getHeaders() })
    .then(r => r.json());

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (!v) return "—";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
};

// ── Chart defaults ────────────────────────────────────────────────────────────
const BAR_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 11 } } },
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
  },
};

const DONUT_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "right", labels: { padding: 14, usePointStyle: true, font: { size: 12 } } },
  },
  cutout: "62%",
};

const COLORS = ["#1a237e","#0277bd","#00838f","#2e7d32","#e65100","#6a1b9a","#c62828","#558b2f"];
const SOFT   = COLORS.map(c => c + "cc");

// ── Sub-components ────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, sub, icon, color }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography fontSize={11} fontWeight={700} color="text.secondary"
            textTransform="uppercase" letterSpacing={0.6}>{title}</Typography>
          <Typography variant="h4" fontWeight={800} mt={0.5} sx={{ color }}>{value}</Typography>
          {sub && <Typography fontSize={12} color="text.secondary" mt={0.5}>{sub}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: `${color}18`, color, width: 46, height: 46 }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, height = 280, children }) => (
  <Card>
    <CardHeader title={<Typography fontWeight={700} fontSize="0.95rem">{title}</Typography>}
      sx={{ pb: 0, borderBottom: "1px solid #f0f0f0" }} />
    <CardContent sx={{ pt: 2.5 }}>
      <Box height={height}>{children}</Box>
    </CardContent>
  </Card>
);

const SectionLabel = ({ children }) => (
  <Typography fontSize={11} fontWeight={700} color="text.secondary"
    textTransform="uppercase" letterSpacing={0.7} mb={1.5}>{children}</Typography>
);

// ── Fallback data (shown when API has no real data yet) ───────────────────────
const FALLBACK = {
  overview: {
    total_jobs: 0, open_jobs: 0, total_candidates: 0, total_placements: 0,
    fill_rate: 0, avg_time_to_fill: 0, revenue: 0,
    job_status_counts: {}, candidate_counts: {},
  },
  funnel: [
    { stage: "Sourced",     count: 0, conversion: "100%" },
    { stage: "Screened",    count: 0, conversion: "0%"   },
    { stage: "Interviewed", count: 0, conversion: "0%"   },
    { stage: "Offered",     count: 0, conversion: "0%"   },
    { stage: "Placed",      count: 0, conversion: "0%"   },
  ],
  recruiters: [],
  clients:    [],
  sources:    [],
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Reports() {
  const [tab,     setTab]     = useState(0);
  const [period,  setPeriod]  = useState("thisMonth");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [data,    setData]    = useState(FALLBACK);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [ov, fn, rec, cli, src] = await Promise.all([
        fetchReport("overview",              period),
        fetchReport("funnel",                period),
        fetchReport("recruiter-performance", period),
        fetchReport("client-wise",           period),
        fetchReport("source-effectiveness",  period),
      ]);
      setData({
        overview:   ov.data  || FALLBACK.overview,
        funnel:     fn.data  || FALLBACK.funnel,
        recruiters: rec.data || [],
        clients:    cli.data || [],
        sources:    src.data || [],
      });
    } catch (e) {
      setError("Failed to load report data — showing cached values");
      setData(FALLBACK);
    } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  // ── Chart data ──────────────────────────────────────────────────────────────
  const funnelChart = {
    labels: data.funnel.map(f => f.stage),
    datasets: [{
      data: data.funnel.map(f => f.count),
      backgroundColor: SOFT,
      borderColor: COLORS,
      borderWidth: 1,
      borderRadius: 5,
    }],
  };

  const recruiterChart = {
    labels: data.recruiters.map(r => r.name.split(" ")[0]),
    datasets: [
      { label: "Interviews", data: data.recruiters.map(r => r.interviews),  backgroundColor: SOFT[0], borderRadius: 4 },
      { label: "Offers",     data: data.recruiters.map(r => r.offers),      backgroundColor: SOFT[2], borderRadius: 4 },
      { label: "Placements", data: data.recruiters.map(r => r.placements),  backgroundColor: SOFT[3], borderRadius: 4 },
    ],
  };

  const clientRevenueChart = {
    labels: data.clients.map(c => c.name),
    datasets: [{
      data: data.clients.map(c => c.revenue),
      backgroundColor: SOFT,
      borderWidth: 0,
    }],
  };

  const clientFillChart = {
    labels: data.clients.map(c => c.name),
    datasets: [{
      data: data.clients.map(c => c.fill_rate),
      backgroundColor: SOFT[0],
      borderRadius: 5,
    }],
  };

  const sourceLineChart = {
    labels: data.sources.map(s => s.source),
    datasets: [
      {
        label: "Candidates",
        data: data.sources.map(s => s.candidates),
        borderColor: COLORS[0], backgroundColor: COLORS[0] + "18",
        fill: true, tension: 0.4, pointRadius: 5,
      },
      {
        label: "Hires",
        data: data.sources.map(s => s.hires),
        borderColor: COLORS[3], backgroundColor: COLORS[3] + "18",
        fill: true, tension: 0.4, pointRadius: 5,
      },
    ],
  };

  const TABS = [
    { label: "Overview",              icon: <Dashboard fontSize="small" /> },
    { label: "Recruiter Performance", icon: <People    fontSize="small" /> },
    { label: "Client Analysis",       icon: <Business  fontSize="small" /> },
    { label: "Source Effectiveness",  icon: <Source    fontSize="small" /> },
  ];

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={48} />
      </Box>
    );

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="warning" onClose={() => setError("")}>{error}</Alert>}

      {/* ── Header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" color="primary.dark">Reports &amp; Analytics</Typography>
          <Typography color="text.secondary" mt={0.5}>
            Comprehensive recruitment insights and performance metrics
          </Typography>
        </Box>
        <Box display="flex" gap={1.5} alignItems="center">
          <TextField select value={period} onChange={e => setPeriod(e.target.value)}
            size="small" sx={{ minWidth: 150 }}>
            <MenuItem value="thisWeek">This Week</MenuItem>
            <MenuItem value="thisMonth">This Month</MenuItem>
            <MenuItem value="lastMonth">Last Month</MenuItem>
            <MenuItem value="thisQuarter">This Quarter</MenuItem>
            <MenuItem value="thisYear">This Year</MenuItem>
          </TextField>
          <Tooltip title="Refresh">
            <IconButton onClick={load} size="small"><Refresh /></IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<Download />} size="small">
            Export
          </Button>
        </Box>
      </Box>

      {/* ── Tabs ── */}
      <Card sx={{ borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ px: 2, borderBottom: "1px solid #f0f0f0" }}
          variant="scrollable" scrollButtons="auto">
          {TABS.map((t, i) => (
            <Tab key={i} icon={t.icon} iconPosition="start" label={t.label}
              sx={{ textTransform: "none", fontWeight: 600, fontSize: 13, minHeight: 52 }} />
          ))}
        </Tabs>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          TAB 0 — OVERVIEW
         ══════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <Box display="flex" flexDirection="column" gap={3}>

          {/* KPI row */}
          <Grid container spacing={2.5}>
            <Grid item xs={6} md={3}>
              <KpiCard title="Total Jobs"    value={data.overview.total_jobs}
                icon={<WorkOutline />}      color="#1a237e"
                sub={`${data.overview.open_jobs} open`} />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard title="Placements"    value={data.overview.total_placements}
                icon={<CheckCircle />}      color="#2e7d32"
                sub={`Fill rate ${data.overview.fill_rate}%`} />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard title="Candidates"    value={data.overview.total_candidates}
                icon={<People />}           color="#0277bd"
                sub={`${data.overview.total_candidates || 0} total`} />
            </Grid>
            <Grid item xs={6} md={3}>
              <KpiCard title="Avg Time to Fill" value={`${data.overview.avg_time_to_fill || 0} days`}
                icon={<AccessTime />}       color="#e65100"
                sub="across all positions" />
            </Grid>
          </Grid>

          {/* Charts row */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <ChartCard title="Recruitment Funnel" height={300}>
                <Bar data={funnelChart} options={BAR_OPTS} />
              </ChartCard>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ height: "100%" }}>
                <CardHeader title={<Typography fontWeight={700} fontSize="0.95rem">Pipeline Summary</Typography>}
                  sx={{ pb: 0, borderBottom: "1px solid #f0f0f0" }} />
                <CardContent>
                  {data.funnel.map((f, i) => (
                    <Box key={i} mb={1.8}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography fontSize={13} fontWeight={600}>{f.stage}</Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          <Typography fontSize={13} fontWeight={700}>{f.count}</Typography>
                          <Chip label={f.conversion} size="small"
                            sx={{ fontSize: 10, height: 18, bgcolor: "#e8eaf6", color: "#1a237e" }} />
                        </Box>
                      </Box>
                      <LinearProgress variant="determinate"
                        value={data.funnel[0]?.count ? (f.count / data.funnel[0].count) * 100 : 0}
                        sx={{ height: 6, borderRadius: 3,
                          bgcolor: "#f0f0f0",
                          "& .MuiLinearProgress-bar": { bgcolor: COLORS[i] } }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Revenue + Fill Rate KPIs */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: "#1a237e", color: "#fff", height: "100%" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography fontSize={12} fontWeight={600} sx={{ opacity: 0.7 }}
                    textTransform="uppercase" letterSpacing={0.6}>Total Revenue</Typography>
                  <Typography variant="h3" fontWeight={800} mt={1}>
                    {fmt(data.overview.revenue)}
                  </Typography>
                  <Typography fontSize={12} sx={{ opacity: 0.7 }} mt={1}>
                    This period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: "#2e7d32", color: "#fff", height: "100%" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography fontSize={12} fontWeight={600} sx={{ opacity: 0.7 }}
                    textTransform="uppercase" letterSpacing={0.6}>Fill Rate</Typography>
                  <Typography variant="h3" fontWeight={800} mt={1}>
                    {data.overview.fill_rate}%
                  </Typography>
                  <LinearProgress variant="determinate" value={data.overview.fill_rate}
                    sx={{ mt: 2, bgcolor: "rgba(255,255,255,0.2)",
                      "& .MuiLinearProgress-bar": { bgcolor: "#fff" }, height: 6, borderRadius: 3 }} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: "#e65100", color: "#fff", height: "100%" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography fontSize={12} fontWeight={600} sx={{ opacity: 0.7 }}
                    textTransform="uppercase" letterSpacing={0.6}>Avg Days to Fill</Typography>
                  <Typography variant="h3" fontWeight={800} mt={1}>
                    {data.overview.avg_time_to_fill || 0}
                  </Typography>
                  <Typography fontSize={12} sx={{ opacity: 0.7 }} mt={1}>
                    days per position
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 1 — RECRUITER PERFORMANCE
         ══════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Box display="flex" flexDirection="column" gap={3}>

          {data.recruiters.length === 0 ? (
            <Card>
              <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
                <People sx={{ fontSize: 56, color: "#bdbdbd" }} />
                <Typography color="text.secondary" fontWeight={600}>No recruiter data yet</Typography>
                <Typography fontSize={13} color="text.disabled">
                  Data will appear once placements and tracking records are added
                </Typography>
              </Box>
            </Card>
          ) : (
            <>
              <ChartCard title="Recruiter Activity Comparison" height={320}>
                <Bar data={recruiterChart}
                  options={{ ...BAR_OPTS, plugins: { legend: { display: true, position: "top" } } }} />
              </ChartCard>

              <Card>
                <CardHeader title={<Typography fontWeight={700} fontSize="0.95rem">Performance Breakdown</Typography>}
                  sx={{ borderBottom: "1px solid #f0f0f0" }} />
                <Paper variant="outlined" sx={{ m: 2, mt: 0, borderRadius: 1.5, overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f5f7fa" }}>
                        {["Recruiter","Jobs Posted","Interviews","Offers","Placements","Revenue","Conversion","Performance"].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#546e7a" }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.recruiters.map((r, i) => (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.2}>
                              <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700,
                                bgcolor: COLORS[i % COLORS.length] }}>
                                {r.name.split(" ").map(w => w[0]).join("").slice(0,2)}
                              </Avatar>
                              <Typography fontWeight={600} fontSize={13}>{r.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{r.jobs_posted ?? 0}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{r.interviews}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{r.offers}</TableCell>
                          <TableCell>
                            <Chip label={r.placements} size="small" color="success"
                              sx={{ fontWeight: 700, fontSize: 11 }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{fmt(r.revenue)}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{r.conversion_rate}%</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1} width={100}>
                              <LinearProgress variant="determinate" value={Math.min(r.conversion_rate, 100)}
                                sx={{ flex: 1, height: 6, borderRadius: 3,
                                  "& .MuiLinearProgress-bar": {
                                    bgcolor: r.conversion_rate >= 30 ? "#2e7d32"
                                           : r.conversion_rate >= 15 ? "#0277bd" : "#e65100"
                                  }
                                }} />
                              <Typography fontSize={10} fontWeight={700} color="text.secondary">
                                {r.conversion_rate}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Card>
            </>
          )}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2 — CLIENT ANALYSIS
         ══════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <Box display="flex" flexDirection="column" gap={3}>

          {data.clients.length === 0 ? (
            <Card>
              <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
                <Business sx={{ fontSize: 56, color: "#bdbdbd" }} />
                <Typography color="text.secondary" fontWeight={600}>No client data yet</Typography>
                <Typography fontSize={13} color="text.disabled">
                  Data will appear once jobs and placements are linked to clients
                </Typography>
              </Box>
            </Card>
          ) : (
            <>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={5}>
                  <ChartCard title="Revenue by Client" height={280}>
                    <Doughnut data={clientRevenueChart} options={DONUT_OPTS} />
                  </ChartCard>
                </Grid>
                <Grid item xs={12} md={7}>
                  <ChartCard title="Client Fill Rates (%)" height={280}>
                    <Bar data={clientFillChart}
                      options={{ ...BAR_OPTS, scales: { ...BAR_OPTS.scales, y: { ...BAR_OPTS.scales.y, max: 100 } } }} />
                  </ChartCard>
                </Grid>
              </Grid>

              <Card>
                <CardHeader title={<Typography fontWeight={700} fontSize="0.95rem">Client Summary</Typography>}
                  sx={{ borderBottom: "1px solid #f0f0f0" }} />
                <Paper variant="outlined" sx={{ m: 2, mt: 0, borderRadius: 1.5, overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f5f7fa" }}>
                        {["Client","Active Jobs","Pipeline","Placements","Revenue","Fill Rate"].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#546e7a" }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.clients.map((c, i) => (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.2}>
                              <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700,
                                bgcolor: COLORS[i % COLORS.length] }}>
                                {c.name.slice(0, 2).toUpperCase()}
                              </Avatar>
                              <Typography fontWeight={600} fontSize={13}>{c.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{c.jobs}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{c.active_pipeline ?? 0}</TableCell>
                          <TableCell>
                            <Chip label={c.placements} size="small" color="primary"
                              sx={{ fontWeight: 700, fontSize: 11 }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{fmt(c.revenue)}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <LinearProgress variant="determinate" value={c.fill_rate}
                                sx={{ width: 60, height: 6, borderRadius: 3,
                                  "& .MuiLinearProgress-bar": {
                                    bgcolor: c.fill_rate >= 60 ? "#2e7d32"
                                           : c.fill_rate >= 30 ? "#e65100" : "#c62828"
                                  }
                                }} />
                              <Chip label={`${c.fill_rate}%`} size="small"
                                color={c.fill_rate >= 60 ? "success" : c.fill_rate >= 30 ? "warning" : "error"}
                                sx={{ fontWeight: 700, fontSize: 10, ml: 0.5 }} />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Card>
            </>
          )}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 3 — SOURCE EFFECTIVENESS
         ══════════════════════════════════════════════════════════ */}
      {tab === 3 && (
        <Box display="flex" flexDirection="column" gap={3}>

          {data.sources.length === 0 ? (
            <Card>
              <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
                <Source sx={{ fontSize: 56, color: "#bdbdbd" }} />
                <Typography color="text.secondary" fontWeight={600}>No source data yet</Typography>
                <Typography fontSize={13} color="text.disabled">
                  Data will appear once candidates have source values assigned
                </Typography>
              </Box>
            </Card>
          ) : (
            <>
              <ChartCard title="Source Performance — Candidates vs Hires" height={300}>
                <Line data={sourceLineChart}
                  options={{ ...BAR_OPTS, plugins: { legend: { display: true, position: "top" } } }} />
              </ChartCard>

              {/* Insight cards */}
              {(() => {
                const best    = [...data.sources].sort((a, b) => b.efficiency - a.efficiency)[0];
                const volume  = [...data.sources].sort((a, b) => b.candidates - a.candidates)[0];
                const mostHires = [...data.sources].sort((a, b) => b.hires - a.hires)[0];
                return (
                  <Grid container spacing={2}>
                    {[
                      { label: "Best Efficiency",  value: best?.source,     stat: `${best?.efficiency}%`,     color: "#2e7d32", icon: <TrendingUp /> },
                      { label: "Volume Leader",     value: volume?.source,   stat: `${volume?.candidates} candidates`, color: "#0277bd", icon: <People /> },
                      { label: "Most Hires",        value: mostHires?.source,stat: `${mostHires?.hires} hires`, color: "#e65100", icon: <CheckCircle /> },
                    ].map((ins, i) => (
                      <Grid item xs={12} md={4} key={i}>
                        <Card sx={{ border: `1px solid ${ins.color}22`, bgcolor: `${ins.color}08` }}>
                          <CardContent sx={{ p: 2.5 }}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar sx={{ bgcolor: `${ins.color}18`, color: ins.color }}>
                                {ins.icon}
                              </Avatar>
                              <Box>
                                <Typography fontSize={11} fontWeight={700} color="text.secondary"
                                  textTransform="uppercase">{ins.label}</Typography>
                                <Typography fontWeight={700} fontSize={15}>{ins.value}</Typography>
                                <Typography fontSize={12} color="text.secondary">{ins.stat}</Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                );
              })()}

              <Card>
                <CardHeader title={<Typography fontWeight={700} fontSize="0.95rem">Source Breakdown</Typography>}
                  sx={{ borderBottom: "1px solid #f0f0f0" }} />
                <Paper variant="outlined" sx={{ m: 2, mt: 0, borderRadius: 1.5, overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f5f7fa" }}>
                        {["Source","Candidates","Shortlisted","Interviewed","Hires","Efficiency"].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#546e7a" }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.sources.map((s, i) => (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Chip label={s.source} size="small"
                              sx={{ fontWeight: 700, bgcolor: COLORS[i % COLORS.length] + "18",
                                color: COLORS[i % COLORS.length] }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{s.candidates}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{s.shortlisted}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{s.interviewed}</TableCell>
                          <TableCell>
                            <Chip label={s.hires} size="small" color="success"
                              sx={{ fontWeight: 700, fontSize: 11 }} />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <LinearProgress variant="determinate" value={s.efficiency}
                                sx={{ width: 70, height: 6, borderRadius: 3,
                                  "& .MuiLinearProgress-bar": {
                                    bgcolor: s.efficiency >= 80 ? "#2e7d32"
                                           : s.efficiency >= 50 ? "#0277bd" : "#e65100"
                                  }
                                }} />
                              <Typography fontSize={11} fontWeight={700} color="text.secondary">
                                {s.efficiency}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Card>
            </>
          )}
        </Box>
      )}

    </Box>
  );
}