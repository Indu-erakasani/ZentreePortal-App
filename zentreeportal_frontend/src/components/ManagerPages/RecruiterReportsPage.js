

// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import {
//   Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
//   Alert, Avatar, LinearProgress, TextField, InputAdornment,
//   Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
//   TableSortLabel, Collapse, Button, ToggleButtonGroup, ToggleButton,
//   Tabs, Tab, Paper, Divider,
// } from "@mui/material";
// import {
//   Search, Close, GridView, TableRows, ExpandMore, ExpandLess,
//   WorkOutline, CheckCircleOutline, AttachMoney, PeopleAlt,
//   TrendingUp, SwapVert, Person, Business, Star,
// } from "@mui/icons-material";
// import {
//   Chart as ChartJS,
//   ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
//   BarElement, Title,
// } from "chart.js";
// import { Doughnut, Bar } from "react-chartjs-2";

// ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// // ── API ──────────────────────────────────────────────────────────────────────
// const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

// const authFetch = async (url, opts = {}) => {
//   const token = localStorage.getItem("access_token") || "";
//   const res = await fetch(url, {
//     ...opts,
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//       ...opts.headers,
//     },
//   });
//   if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; }
//   return res;
// };

// // ── Helpers ───────────────────────────────────────────────────────────────────
// const fmtSalary = (v = 0) => {
//   if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
//   if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
//   if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}K`;
//   return `₹${Number(v).toLocaleString()}`;
// };

// const nameInitials = (name = "") =>
//   name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

// const getCurrentUser = () => {
//   try {
//     const user = JSON.parse(localStorage.getItem("user") || "{}");
//     return {
//       name:     `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Unknown",
//       role:     user.role || "recruiter",
//       email:    user.email || "",
//       id:       user.id   || "",
//     };
//   } catch { return { name: "Unknown", role: "recruiter", email: "", id: "" }; }
// };

// // ── Period config ─────────────────────────────────────────────────────────────
// const PERIODS = [
//   { key: "thisWeek",    label: "This Week"    },
//   { key: "thisMonth",   label: "This Month"   },
//   { key: "lastMonth",   label: "Last Month"   },
//   { key: "thisQuarter", label: "This Quarter" },
//   { key: "thisYear",    label: "This Year"    },
//   { key: "all",         label: "All Time"     },
// ];

// const getPeriodStart = (key) => {
//   const d = new Date();
//   switch (key) {
//     case "thisWeek":    d.setDate(d.getDate() - 7); return d;
//     case "thisMonth":   d.setDate(1); return d;
//     case "lastMonth": {
//       const s = new Date(); s.setDate(1); s.setMonth(s.getMonth() - 1);
//       return s;
//     }
//     case "thisQuarter": {
//       const q = Math.floor(d.getMonth() / 3);
//       d.setMonth(q * 3); d.setDate(1); return d;
//     }
//     case "thisYear":    d.setMonth(0); d.setDate(1); return d;
//     default:            return null;
//   }
// };

// const inPeriod = (dateStr, periodKey) => {
//   if (!dateStr || periodKey === "all") return true;
//   const from = getPeriodStart(periodKey);
//   return from ? new Date(dateStr) >= from : true;
// };

// // ── Stage / status config ─────────────────────────────────────────────────────
// const STAGE_ORDER = [
//   "Screening", "Technical Round 1", "Technical Round 2",
//   "HR Round", "Manager Round", "Final Round",
//   "Offer Stage", "Negotiation", "Offer Accepted",
//   "Offer Declined", "Joined", "Rejected", "Withdrawn",
// ];

// const STAGE_COLORS = {
//   "Screening":        "#6366f1",
//   "Technical Round 1":"#3b82f6",
//   "Technical Round 2":"#0ea5e9",
//   "HR Round":         "#f59e0b",
//   "Manager Round":    "#8b5cf6",
//   "Final Round":      "#ec4899",
//   "Offer Stage":      "#0891b2",
//   "Negotiation":      "#f97316",
//   "Offer Accepted":   "#22c55e",
//   "Offer Declined":   "#ef4444",
//   "Joined":           "#15803d",
//   "Rejected":         "#b91c1c",
//   "Withdrawn":        "#64748b",
// };

// const STATUS_COLORS = {
//   New:          "#6366f1",
//   "In Review":  "#0891b2",
//   Shortlisted:  "#3b82f6",
//   Interviewed:  "#f59e0b",
//   Offered:      "#8b5cf6",
//   Hired:        "#22c55e",
//   Rejected:     "#ef4444",
//   "On Hold":    "#f97316",
// };

// const JOB_STATUS_COLORS = {
//   Open:      "#22c55e",
//   "On Hold": "#f59e0b",
//   Closed:    "#64748b",
//   Filled:    "#4f46e5",
// };

// const PALETTE = ["#4f46e5","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#0284c7","#65a30d","#db2777"];

// const SORT_COLS = [
//   { key: "jobs_posted",     label: "Jobs Posted"  },
//   { key: "candidates",      label: "Candidates"   },
//   { key: "interviews",      label: "Interviews"   },
//   { key: "offers",          label: "Offers"       },
//   { key: "placements",      label: "Placed"       },
//   { key: "conversion_rate", label: "Conversion %"  },
// ];

// // ── Sub-components ─────────────────────────────────────────────────────────────

// const KPICard = ({ label, value, sub, color, icon }) => (
//   <Card elevation={0} sx={{
//     border: "1px solid", borderColor: "divider", borderRadius: 2,
//     position: "relative", overflow: "hidden",
//     transition: "transform .15s, box-shadow .15s",
//     "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
//   }}>
//     <CardContent sx={{ p: 2 }}>
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
//         <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary",
//           textTransform: "uppercase", letterSpacing: ".05em" }}>
//           {label}
//         </Typography>
//         <Box sx={{ width: 32, height: 32, borderRadius: 1.5,
//           bgcolor: `${color}20`, color, display: "flex", alignItems: "center", justifyContent: "center" }}>
//           {React.cloneElement(icon, { sx: { fontSize: 17 } })}
//         </Box>
//       </Box>
//       <Typography sx={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1, mb: .5 }}>
//         {value}
//       </Typography>
//       {sub && <Typography sx={{ fontSize: 11, color: "text.disabled" }}>{sub}</Typography>}
//     </CardContent>
//     <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, bgcolor: color, opacity: .6 }} />
//   </Card>
// );

// const FunnelBar = ({ label, count, maxCount, color, pct }) => (
//   <Box display="flex" alignItems="center" gap={1} mb={.75}>
//     <Typography sx={{ fontSize: 11, color: "text.secondary", width: 110, flexShrink: 0 }}>
//       {label}
//     </Typography>
//     <Box sx={{ flex: 1, bgcolor: "action.hover", borderRadius: 1, height: 22, overflow: "hidden" }}>
//       <Box sx={{
//         width: `${Math.max(4, (count / Math.max(1, maxCount)) * 100)}%`,
//         height: "100%", bgcolor: color, borderRadius: 1,
//         display: "flex", alignItems: "center", px: 1,
//         transition: "width .6s ease",
//       }}>
//         {count > 0 && <Typography sx={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{count}</Typography>}
//       </Box>
//     </Box>
//     <Typography sx={{ fontSize: 11, color: "text.disabled", width: 36, textAlign: "right" }}>
//       {pct}%
//     </Typography>
//   </Box>
// );

// // ── Main Dashboard ─────────────────────────────────────────────────────────────
// export default function RecruiterAnalytics() {
//   const [period, setPeriod]       = useState("thisMonth");
//   const [search, setSearch]       = useState("");
//   const [sortBy, setSortBy]       = useState("placements");
//   const [sortDir, setSortDir]     = useState("desc");
//   const [viewMode, setViewMode]   = useState("my");   // "my" | "team"
//   const [loading, setLoading]     = useState(true);
//   const [error, setError]         = useState("");
//   const [expanded, setExpanded]   = useState(null);

//   const [allJobs,     setAllJobs]     = useState([]);
//   const [allResumes,  setAllResumes]  = useState([]);
//   const [allTracking, setAllTracking] = useState([]);
//   const [allUsers,    setAllUsers]    = useState([]);

//   const currentUser = useMemo(() => getCurrentUser(), []);

//   const loadData = useCallback(async () => {
//     setLoading(true); setError("");
//     try {
//       const [rJ, rR, rT, rU] = await Promise.all([
//         authFetch(`${BASE}/jobs/?per_page=500`),
//         authFetch(`${BASE}/resumes/?per_page=500`),
//         authFetch(`${BASE}/tracking/?per_page=1000`),
//         authFetch(`${BASE}/user/`),
//       ]);
//       const [dJ, dR, dT, dU] = await Promise.all([rJ.json(), rR.json(), rT.json(), rU.json()]);
//       setAllJobs(dJ.data     || []);
//       setAllResumes(dR.data  || []);
//       setAllTracking(dT.data || []);
//       setAllUsers((dU.data   || []).filter(u => u.role === "recruiter"));
//     } catch (e) {
//       setError("Failed to load data. Check your connection.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { loadData(); }, [loadData]);

//   // ── My data filtered by period ──────────────────────────────────────────────
//   const myName = currentUser.name.toLowerCase();

//   const myJobs     = useMemo(() => allJobs.filter(j =>
//     (j.posted_by_name || "").toLowerCase() === myName && inPeriod(j.created_at, period)
//   ), [allJobs, myName, period]);

//   const myResumes  = useMemo(() => allResumes.filter(r =>
//     inPeriod(r.created_at, period)
//   ), [allResumes, period]);

//   const myTracking = useMemo(() => allTracking.filter(t =>
//     (t.recruiter || "").toLowerCase() === myName && inPeriod(t.created_at, period)
//   ), [allTracking, myName, period]);

//   // ── My KPIs ────────────────────────────────────────────────────────────────
//   const myKPIs = useMemo(() => {
//     const placed     = myTracking.filter(t => t.current_stage === "Joined").length;
//     const offered    = myTracking.filter(t =>
//       ["Offer Stage", "Offer Accepted", "Negotiation", "Joined"].includes(t.current_stage)).length;
//     const interviews = myTracking.filter(t =>
//       !["Screening", "Rejected", "Withdrawn"].includes(t.current_stage)).length;
//     const active     = myTracking.filter(t => t.pipeline_status === "Active").length;
//     const convRate   = myTracking.length
//       ? Math.round((placed / myTracking.length) * 100) : 0;
//     const totalSal   = myTracking
//       .filter(t => t.salary_offered > 0)
//       .reduce((s, t) => s + Number(t.salary_offered || 0), 0);
//     return { placed, offered, interviews, active, convRate, totalSal };
//   }, [myTracking]);

//   // ── Funnel data ─────────────────────────────────────────────────────────────
//   const funnelStages = [
//     { label: "Screening",        key: "Screening"         },
//     { label: "Tech Round 1",     key: "Technical Round 1" },
//     { label: "HR Round",         key: "HR Round"          },
//     { label: "Manager Round",    key: "Manager Round"     },
//     { label: "Final Round",      key: "Final Round"       },
//     { label: "Offer Stage",      key: "Offer Stage"       },
//     { label: "Offer Accepted",   key: "Offer Accepted"    },
//     { label: "Joined",           key: "Joined"            },
//   ];

//   const funnelData = useMemo(() =>
//     funnelStages.map(s => ({
//       ...s,
//       count: myTracking.filter(t => t.current_stage === s.key).length,
//     }))
//   , [myTracking]);

//   const funnelMax = Math.max(1, ...funnelData.map(f => f.count));
//   const funnelTop = Math.max(1, funnelData[0]?.count || 1);

//   // ── Status chart ────────────────────────────────────────────────────────────
//   const statusChartData = useMemo(() => {
//     const statuses = Object.keys(STATUS_COLORS);
//     const counts   = statuses.map(s => myResumes.filter(r => r.status === s).length);
//     const nonZero  = statuses.filter((_, i) => counts[i] > 0);
//     return {
//       labels: nonZero,
//       datasets: [{
//         data:            nonZero.map(s => myResumes.filter(r => r.status === s).length),
//         backgroundColor: nonZero.map(s => STATUS_COLORS[s]),
//         borderWidth: 0,
//       }],
//     };
//   }, [myResumes]);

//   // ── Stage bar chart ─────────────────────────────────────────────────────────
//   const stageChartData = useMemo(() => {
//     const stages = STAGE_ORDER.filter(s => myTracking.some(t => t.current_stage === s));
//     return {
//       labels: stages,
//       datasets: [{
//         label: "Candidates",
//         data:            stages.map(s => myTracking.filter(t => t.current_stage === s).length),
//         backgroundColor: stages.map(s => STAGE_COLORS[s] || "#6366f1"),
//         borderRadius: 4,
//       }],
//     };
//   }, [myTracking]);

//   // ── Job status chart ────────────────────────────────────────────────────────
//   const jobStatusChartData = useMemo(() => {
//     const statuses = Object.keys(JOB_STATUS_COLORS);
//     return {
//       labels: statuses,
//       datasets: [{
//         data:            statuses.map(s => myJobs.filter(j => j.status === s).length),
//         backgroundColor: statuses.map(s => JOB_STATUS_COLORS[s]),
//         borderRadius: 4,
//       }],
//     };
//   }, [myJobs]);

//   // ── Client breakdown ────────────────────────────────────────────────────────
//   const clientBreakdown = useMemo(() => {
//     const map = {};
//     myJobs.forEach(j => {
//       const k = j.client_name || "Unknown";
//       if (!map[k]) map[k] = { open: 0, filled: 0, total: 0 };
//       map[k].total++;
//       if (j.status === "Open")   map[k].open++;
//       if (j.status === "Filled") map[k].filled++;
//     });
//     return Object.entries(map)
//       .sort((a, b) => b[1].total - a[1].total)
//       .slice(0, 8);
//   }, [myJobs]);

//   // ── Team view: per-recruiter stats ──────────────────────────────────────────
//   const teamStats = useMemo(() => {
//     const recruiters = [...new Set([
//       ...allTracking.map(t => t.recruiter).filter(Boolean),
//       ...allJobs.map(j => j.posted_by_name).filter(Boolean),
//     ])];
//     return recruiters.map(name => {
//       const nameLower = name.toLowerCase();
//       const jobs     = allJobs.filter(j =>
//         (j.posted_by_name || "").toLowerCase() === nameLower && inPeriod(j.created_at, period));
//       const tracking = allTracking.filter(t =>
//         (t.recruiter || "").toLowerCase() === nameLower && inPeriod(t.created_at, period));
//       const placed   = tracking.filter(t => t.current_stage === "Joined").length;
//       const offered  = tracking.filter(t => ["Offer Stage","Offer Accepted","Negotiation","Joined"].includes(t.current_stage)).length;
//       const interviews = tracking.filter(t => !["Screening","Rejected","Withdrawn"].includes(t.current_stage)).length;
//       const conv     = tracking.length ? Math.round((placed / tracking.length) * 100) : 0;
//       return {
//         name,
//         jobs_posted:     jobs.length,
//         candidates:      tracking.length,
//         interviews,
//         offers:          offered,
//         placements:      placed,
//         conversion_rate: conv,
//         isMe:            nameLower === myName,
//       };
//     });
//   }, [allJobs, allTracking, period, myName]);

//   const filteredTeam = useMemo(() => {
//     let list = teamStats.filter(r =>
//       !search || r.name.toLowerCase().includes(search.toLowerCase()));
//     return [...list].sort((a, b) => {
//       const av = a[sortBy] ?? 0, bv = b[sortBy] ?? 0;
//       return sortDir === "desc" ? bv - av : av - bv;
//     });
//   }, [teamStats, search, sortBy, sortDir]);

//   const handleSort = (key) => {
//     if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
//     else { setSortBy(key); setSortDir("desc"); }
//   };

//   const chartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: { legend: { display: false } },
//     scales: {
//       y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
//       x: { ticks: { font: { size: 11 }, maxRotation: 35, autoSkip: false } },
//     },
//   };

//   if (loading)
//     return (
//       <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
//         <CircularProgress size={40} />
//       </Box>
//     );

//   return (
//     <Box display="flex" flexDirection="column" gap={3}>

//       {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

//       {/* ── Header ── */}
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
//         <Box>
//           <Typography variant="h4" color="primary.dark">Recruiter Analytics</Typography>
//           <Typography color="text.secondary" mt={0.5}>
//             Real-time performance dashboard — pipeline, conversions & placements
//           </Typography>
//         </Box>
//         <Box display="flex" alignItems="center" gap={1.5}
//           sx={{ px: 2, py: 1, bgcolor: "action.hover", borderRadius: 2 }}>
//           <Avatar sx={{ width: 36, height: 36, bgcolor: "#4f46e5", fontSize: 13, fontWeight: 600 }}>
//             {nameInitials(currentUser.name)}
//           </Avatar>
//           <Box>
//             <Typography fontSize={13} fontWeight={600}>{currentUser.name}</Typography>
//             <Typography fontSize={11} color="text.secondary" sx={{ textTransform: "capitalize" }}>
//               {currentUser.role}
//             </Typography>
//           </Box>
//         </Box>
//       </Box>

//       {/* ── Period + view toggle ── */}
//       <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
//         <Tabs
//           value={period}
//           onChange={(_, v) => setPeriod(v)}
//           sx={{
//             bgcolor: "action.hover", borderRadius: 2, p: 0.5, minHeight: "unset",
//             "& .MuiTabs-indicator": { display: "none" },
//           }}
//         >
//           {PERIODS.map(p => (
//             <Tab key={p.key} value={p.key} label={p.label}
//               sx={{
//                 minHeight: 34, px: 1.5, py: 0.5, borderRadius: 1.5,
//                 fontSize: 12, fontWeight: 600, textTransform: "none", color: "text.secondary",
//                 "&.Mui-selected": { bgcolor: "background.paper", color: "primary.main",
//                   boxShadow: "0 1px 4px rgba(0,0,0,.1)" },
//               }}
//             />
//           ))}
//         </Tabs>
//         <ToggleButtonGroup value={viewMode} exclusive size="small"
//           onChange={(_, v) => v && setViewMode(v)}>
//           <ToggleButton value="my"><Person fontSize="small" sx={{ mr: .5 }} /> My stats</ToggleButton>
//           <ToggleButton value="team"><PeopleAlt fontSize="small" sx={{ mr: .5 }} /> Team</ToggleButton>
//         </ToggleButtonGroup>
//       </Box>

//       {viewMode === "my" && (
//         <>
//           {/* ── KPI cards ── */}
//           <Grid container spacing={2}>
//             {[
//               { label: "Jobs Posted",    value: myJobs.length,          sub: "in period",            color: "#4f46e5", icon: <WorkOutline /> },
//               { label: "Candidates",     value: myResumes.length,       sub: "in resume bank",       color: "#0891b2", icon: <PeopleAlt /> },
//               { label: "In Pipeline",    value: myTracking.length,      sub: `${myKPIs.active} active`, color: "#7c3aed", icon: <TrendingUp /> },
//               { label: "Interviews",     value: myKPIs.interviews,      sub: "conducted",            color: "#f59e0b", icon: <Star /> },
//               { label: "Offers",         value: myKPIs.offered,         sub: "extended",             color: "#8b5cf6", icon: <AttachMoney /> },
//               { label: "Placements",     value: myKPIs.placed,          sub: "candidates joined",    color: "#059669", icon: <CheckCircleOutline /> },
//               { label: "Conversion",
//                 value: `${myKPIs.convRate}%`,
//                 sub: "pipeline → placed",
//                 color: myKPIs.convRate >= 40 ? "#059669" : myKPIs.convRate >= 20 ? "#f59e0b" : "#dc2626",
//                 icon: <TrendingUp /> },
//               { label: "Salary Value",   value: myKPIs.totalSal > 0 ? fmtSalary(myKPIs.totalSal) : "—",
//                 sub: "total offered",      color: "#0f172a", icon: <AttachMoney /> },
//             ].map(k => (
//               <Grid item xs={6} sm={4} md={3} key={k.label}>
//                 <KPICard {...k} />
//               </Grid>
//             ))}
//           </Grid>

//           {/* ── Funnel + Status ── */}
//           <Grid container spacing={2}>
//             <Grid item xs={12} md={7}>
//               <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
//                 <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
//                   Interview pipeline funnel
//                 </Typography>
//                 {funnelData.map(f => (
//                   <FunnelBar
//                     key={f.key}
//                     label={f.label}
//                     count={f.count}
//                     maxCount={funnelMax}
//                     color={STAGE_COLORS[f.key] || "#6366f1"}
//                     pct={Math.round((f.count / funnelTop) * 100)}
//                   />
//                 ))}
//               </Card>
//             </Grid>
//             <Grid item xs={12} md={5}>
//               <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
//                 <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
//                   Candidates by status
//                 </Typography>
//                 <Box sx={{ position: "relative", height: 180 }}>
//                   <Doughnut
//                     data={statusChartData}
//                     options={{ responsive: true, maintainAspectRatio: false,
//                       plugins: { legend: { display: false } }, cutout: "65%" }}
//                   />
//                 </Box>
//                 <Box display="flex" flexWrap="wrap" gap={1} mt={1.5}>
//                   {statusChartData.labels.map((s, i) => (
//                     <Box key={s} display="flex" alignItems="center" gap={0.5}>
//                       <Box sx={{ width: 10, height: 10, borderRadius: 1,
//                         bgcolor: statusChartData.datasets[0].backgroundColor[i] }} />
//                       <Typography fontSize={11} color="text.secondary">
//                         {s} {statusChartData.datasets[0].data[i]}
//                       </Typography>
//                     </Box>
//                   ))}
//                 </Box>
//               </Card>
//             </Grid>
//           </Grid>

//           {/* ── Stage breakdown ── */}
//           <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
//             <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
//               Candidates by current stage
//             </Typography>
//             <Box sx={{ position: "relative", height: 220 }}>
//               {stageChartData.labels.length > 0
//                 ? <Bar data={stageChartData} options={chartOptions} />
//                 : <Typography color="text.disabled" fontSize={13} textAlign="center" pt={6}>
//                     No pipeline data for this period
//                   </Typography>
//               }
//             </Box>
//           </Card>

//           {/* ── Client breakdown + Job status ── */}
//           <Grid container spacing={2}>
//             <Grid item xs={12} md={7}>
//               <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
//                 <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
//                   Jobs by client
//                 </Typography>
//                 {clientBreakdown.length === 0
//                   ? <Typography color="text.disabled" fontSize={13}>No jobs posted in this period</Typography>
//                   : clientBreakdown.map(([name, d], i) => (
//                     <Box key={name} display="flex" alignItems="center" justifyContent="space-between"
//                       sx={{ py: 1, borderBottom: i < clientBreakdown.length - 1 ? "1px solid" : "none",
//                         borderColor: "divider" }}>
//                       <Box display="flex" alignItems="center" gap={1}>
//                         <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 600,
//                           bgcolor: PALETTE[i % PALETTE.length], borderRadius: 1 }}>
//                           {nameInitials(name)}
//                         </Avatar>
//                         <Typography fontSize={13}>{name}</Typography>
//                       </Box>
//                       <Box display="flex" gap={1} alignItems="center">
//                         <Chip label={`${d.open} open`} size="small"
//                           sx={{ fontSize: 10, bgcolor: "#e8f5e9", color: "#1b5e20" }} />
//                         {d.filled > 0 && (
//                           <Chip label={`${d.filled} filled`} size="small"
//                             sx={{ fontSize: 10, bgcolor: "#ede9fe", color: "#4f46e5" }} />
//                         )}
//                         <Typography fontSize={11} color="text.disabled">{d.total} total</Typography>
//                       </Box>
//                     </Box>
//                   ))
//                 }
//               </Card>
//             </Grid>
//             <Grid item xs={12} md={5}>
//               <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
//                 <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
//                   My jobs by status
//                 </Typography>
//                 <Box sx={{ position: "relative", height: 180 }}>
//                   <Bar data={jobStatusChartData}
//                     options={{ ...chartOptions, scales: {
//                       y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
//                       x: { ticks: { font: { size: 11 } } },
//                     }}} />
//                 </Box>
//                 <Box display="flex" flexWrap="wrap" gap={1} mt={1.5}>
//                   {Object.entries(JOB_STATUS_COLORS).map(([s, c]) => (
//                     <Box key={s} display="flex" alignItems="center" gap={0.5}>
//                       <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: c }} />
//                       <Typography fontSize={11} color="text.secondary">
//                         {s} {myJobs.filter(j => j.status === s).length}
//                       </Typography>
//                     </Box>
//                   ))}
//                 </Box>
//               </Card>
//             </Grid>
//           </Grid>

//           {/* ── Conversion metrics ── */}
//           <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
//             <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
//               Conversion metrics
//             </Typography>
//             <Grid container spacing={2}>
//               {[
//                 { label: "Screened → Interviewed",
//                   a: myTracking.filter(t => t.current_stage === "Screening").length,
//                   b: myTracking.filter(t => !["Screening","Rejected","Withdrawn"].includes(t.current_stage)).length,
//                   color: "#4f46e5" },
//                 { label: "Interviewed → Offered",
//                   a: myTracking.filter(t => !["Screening","Rejected","Withdrawn"].includes(t.current_stage)).length,
//                   b: myTracking.filter(t => ["Offer Stage","Offer Accepted","Negotiation","Joined"].includes(t.current_stage)).length,
//                   color: "#f59e0b" },
//                 { label: "Offered → Joined",
//                   a: myTracking.filter(t => ["Offer Stage","Offer Accepted","Negotiation","Joined"].includes(t.current_stage)).length,
//                   b: myTracking.filter(t => t.current_stage === "Joined").length,
//                   color: "#059669" },
//                 { label: "Overall (Pipeline → Placed)",
//                   a: myTracking.length,
//                   b: myTracking.filter(t => t.current_stage === "Joined").length,
//                   color: "#7c3aed" },
//               ].map(m => {
//                 const pct = m.a > 0 ? Math.round((m.b / m.a) * 100) : 0;
//                 return (
//                   <Grid item xs={12} sm={6} md={3} key={m.label}>
//                     <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
//                       <Typography fontSize={11} color="text.secondary" mb={1}>{m.label}</Typography>
//                       <Typography fontSize={22} fontWeight={600} sx={{ color: m.color }}>{pct}%</Typography>
//                       <LinearProgress variant="determinate" value={pct}
//                         sx={{ mt: 1, height: 5, borderRadius: 3, bgcolor: "divider",
//                           "& .MuiLinearProgress-bar": { bgcolor: m.color } }} />
//                       <Typography fontSize={11} color="text.disabled" mt={0.5}>{m.b} of {m.a}</Typography>
//                     </Box>
//                   </Grid>
//                 );
//               })}
//             </Grid>
//           </Card>
//         </>
//       )}

//       {/* ══ TEAM VIEW ══ */}
//       {viewMode === "team" && (
//         <>
//           {/* Team summary KPIs */}
//           <Grid container spacing={2}>
//             {[
//               { label: "Total Recruiters", value: filteredTeam.length,                              color: "#4f46e5", icon: <PeopleAlt /> },
//               { label: "Total Placements", value: filteredTeam.reduce((s,r)=>s+r.placements,0),    color: "#059669", icon: <CheckCircleOutline /> },
//               { label: "Total Interviews", value: filteredTeam.reduce((s,r)=>s+r.interviews,0),    color: "#f59e0b", icon: <Star /> },
//               { label: "Avg Conversion",
//                 value: filteredTeam.length
//                   ? `${Math.round(filteredTeam.reduce((s,r)=>s+r.conversion_rate,0)/filteredTeam.length)}%`
//                   : "—",
//                 color: "#7c3aed", icon: <TrendingUp /> },
//             ].map(k => (
//               <Grid item xs={6} md={3} key={k.label}>
//                 <KPICard {...k} sub="" />
//               </Grid>
//             ))}
//           </Grid>

//           {/* Search + sort */}
//           <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
//             <TextField
//               placeholder="Search recruiter…"
//               value={search}
//               onChange={e => setSearch(e.target.value)}
//               size="small"
//               sx={{ minWidth: 240 }}
//               InputProps={{
//                 startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
//                 endAdornment: search ? (
//                   <InputAdornment position="end">
//                     <Close sx={{ fontSize: 16, cursor: "pointer" }} onClick={() => setSearch("")} />
//                   </InputAdornment>
//                 ) : null,
//               }}
//             />
//             <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
//               <SwapVert fontSize="small" color="disabled" />
//               {SORT_COLS.map(s => (
//                 <Chip key={s.key}
//                   label={sortBy === s.key ? `${s.label} ${sortDir === "desc" ? "↓" : "↑"}` : s.label}
//                   size="small"
//                   onClick={() => handleSort(s.key)}
//                   sx={{
//                     cursor: "pointer", fontSize: 12, fontWeight: 600,
//                     bgcolor: sortBy === s.key ? "#ede9fe" : "action.hover",
//                     color:   sortBy === s.key ? "#4f46e5" : "text.secondary",
//                   }}
//                 />
//               ))}
//             </Box>
//           </Box>

//           {/* Team table */}
//           <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
//             <TableContainer>
//               <Table>
//                 <TableHead>
//                   <TableRow sx={{ bgcolor: "action.hover" }}>
//                     <TableCell sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary",
//                       textTransform: "uppercase", width: 36 }}>#</TableCell>
//                     <TableCell sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary",
//                       textTransform: "uppercase" }}>Recruiter</TableCell>
//                     {SORT_COLS.map(col => (
//                       <TableCell key={col.key}
//                         sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase" }}>
//                         <TableSortLabel
//                           active={sortBy === col.key}
//                           direction={sortBy === col.key ? sortDir : "desc"}
//                           onClick={() => handleSort(col.key)}
//                         >
//                           {col.label}
//                         </TableSortLabel>
//                       </TableCell>
//                     ))}
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {filteredTeam.length === 0 ? (
//                     <TableRow>
//                       <TableCell colSpan={8} align="center" sx={{ py: 5, color: "text.disabled" }}>
//                         No recruiters found
//                       </TableCell>
//                     </TableRow>
//                   ) : filteredTeam.map((r, i) => (
//                     <TableRow key={r.name} hover
//                       sx={{
//                         bgcolor: r.isMe ? "primary.50" : "transparent",
//                         "&:last-child td": { border: 0 },
//                       }}>
//                       <TableCell>
//                         <Typography fontSize={13} fontWeight={700}
//                           sx={{ color: i === 0 ? "#d97706" : i === 1 ? "#64748b" : i === 2 ? "#b45309" : "#cbd5e1" }}>
//                           {i + 1}
//                         </Typography>
//                       </TableCell>
//                       <TableCell>
//                         <Box display="flex" alignItems="center" gap={1.5}>
//                           <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 600,
//                             bgcolor: PALETTE[i % PALETTE.length] }}>
//                             {nameInitials(r.name)}
//                           </Avatar>
//                           <Box>
//                             <Box display="flex" alignItems="center" gap={1}>
//                               <Typography fontSize={13} fontWeight={600}>{r.name}</Typography>
//                               {r.isMe && <Chip label="You" size="small"
//                                 sx={{ fontSize: 10, height: 18, bgcolor: "#ede9fe", color: "#4f46e5" }} />}
//                               {i === 0 && <Chip label="★ Top" size="small"
//                                 sx={{ fontSize: 10, height: 18, bgcolor: "#fef3c7", color: "#d97706" }} />}
//                             </Box>
//                           </Box>
//                         </Box>
//                       </TableCell>
//                       <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{r.jobs_posted}</TableCell>
//                       <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{r.candidates}</TableCell>
//                       <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{r.interviews}</TableCell>
//                       <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{r.offers}</TableCell>
//                       <TableCell>
//                         <Typography fontSize={13} fontWeight={700} color="success.main">
//                           {r.placements}
//                         </Typography>
//                       </TableCell>
//                       <TableCell>
//                         <Chip label={`${r.conversion_rate}%`} size="small"
//                           sx={{
//                             fontWeight: 700, fontSize: 12,
//                             bgcolor: r.conversion_rate >= 40 ? "#e8f5e9" : r.conversion_rate >= 20 ? "#fff7ed" : "#fef2f2",
//                             color:   r.conversion_rate >= 40 ? "#1b5e20" : r.conversion_rate >= 20 ? "#c2410c" : "#b91c1c",
//                           }} />
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           </Card>

//           {/* Team bar chart */}
//           {filteredTeam.length > 0 && (
//             <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
//               <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
//                 Placements comparison
//               </Typography>
//               <Box sx={{ position: "relative", height: Math.max(200, filteredTeam.length * 40) }}>
//                 <Bar
//                   data={{
//                     labels: filteredTeam.map(r => r.name.split(" ")[0]),
//                     datasets: [
//                       { label: "Placements", data: filteredTeam.map(r => r.placements),
//                         backgroundColor: filteredTeam.map((_, i) => PALETTE[i % PALETTE.length]), borderRadius: 4 },
//                       { label: "Interviews", data: filteredTeam.map(r => r.interviews),
//                         backgroundColor: filteredTeam.map(() => "#e2e8f0"), borderRadius: 4 },
//                     ],
//                   }}
//                   options={{
//                     responsive: true, maintainAspectRatio: false,
//                     plugins: { legend: { display: true, position: "top",
//                       labels: { font: { size: 11 }, boxWidth: 12, padding: 12 } } },
//                     scales: {
//                       y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
//                       x: { ticks: { font: { size: 11 } } },
//                     },
//                   }}
//                 />
//               </Box>
//             </Card>
//           )}
//         </>
//       )}
//     </Box>
//   );
// }





import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Alert, Avatar, LinearProgress, TextField, InputAdornment,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TableSortLabel, Button, ToggleButtonGroup, ToggleButton,
  Tabs, Tab, Paper, MenuItem, Divider, Collapse, IconButton, Tooltip,
} from "@mui/material";
import {
  Search, PeopleAlt, TrendingUp, CheckCircleOutline,
  AttachMoney, Star, SwapVert, WorkOutline, Business,
  ExpandMore, ExpandLess, Person, FilterList,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  ArcElement, Tooltip as ChartTooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement, ChartTooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
);

// ── API ───────────────────────────────────────────────────────────────────────
const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const authFetch = async (url, opts = {}) => {
  const token = localStorage.getItem("access_token") || "";
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...opts.headers,
    },
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; }
  return res;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtSalary = (v = 0) => {
  if (!v) return "—";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${Number(v).toLocaleString()}`;
};

const nameInitials = (name = "") =>
  name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const getCurrentUser = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      name:  `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Unknown",
      role:  u.role  || "recruiter",
      email: u.email || "",
      id:    u.id    || "",
    };
  } catch { return { name: "Unknown", role: "recruiter", email: "", id: "" }; }
};

// ── Constants ─────────────────────────────────────────────────────────────────
const PERIODS = [
  { key: "thisWeek",    label: "This Week"    },
  { key: "thisMonth",   label: "This Month"   },
  { key: "lastMonth",   label: "Last Month"   },
  { key: "thisQuarter", label: "This Quarter" },
  { key: "thisYear",    label: "This Year"    },
  { key: "all",         label: "All Time"     },
];

const getPeriodStart = (key) => {
  const d = new Date();
  switch (key) {
    case "thisWeek":    d.setDate(d.getDate() - 7); return d;
    case "thisMonth":   d.setDate(1); return d;
    case "lastMonth": {
      const s = new Date(); s.setDate(1); s.setMonth(s.getMonth() - 1); return s;
    }
    case "thisQuarter": {
      const q = Math.floor(d.getMonth() / 3); d.setMonth(q * 3); d.setDate(1); return d;
    }
    case "thisYear":    d.setMonth(0); d.setDate(1); return d;
    default:            return null;
  }
};

const inPeriod = (dateStr, periodKey) => {
  if (!dateStr || periodKey === "all") return true;
  const from = getPeriodStart(periodKey);
  return from ? new Date(dateStr) >= from : true;
};

const STAGE_ORDER = [
  "Screening", "Technical Round 1", "Technical Round 2",
  "HR Round", "Manager Round", "Final Round",
  "Offer Stage", "Negotiation", "Offer Accepted",
  "Offer Declined", "Joined", "Rejected", "Withdrawn",
];

const STAGE_COLORS = {
  "Screening":         "#6366f1",
  "Technical Round 1": "#3b82f6",
  "Technical Round 2": "#0ea5e9",
  "HR Round":          "#f59e0b",
  "Manager Round":     "#8b5cf6",
  "Final Round":       "#ec4899",
  "Offer Stage":       "#0891b2",
  "Negotiation":       "#f97316",
  "Offer Accepted":    "#22c55e",
  "Offer Declined":    "#ef4444",
  "Joined":            "#15803d",
  "Rejected":          "#b91c1c",
  "Withdrawn":         "#64748b",
};

const STAGE_BG = {
  "Screening":         "#ede9fe",
  "Technical Round 1": "#dbeafe",
  "Technical Round 2": "#e0f2fe",
  "HR Round":          "#fef3c7",
  "Manager Round":     "#ede9fe",
  "Final Round":       "#fce7f3",
  "Offer Stage":       "#cffafe",
  "Negotiation":       "#ffedd5",
  "Offer Accepted":    "#dcfce7",
  "Offer Declined":    "#fee2e2",
  "Joined":            "#d1fae5",
  "Rejected":          "#fee2e2",
  "Withdrawn":         "#f1f5f9",
};

const STATUS_COLORS = {
  New:          "#6366f1",
  "In Review":  "#0891b2",
  Shortlisted:  "#3b82f6",
  Interviewed:  "#f59e0b",
  Offered:      "#8b5cf6",
  Hired:        "#22c55e",
  Rejected:     "#ef4444",
  "On Hold":    "#f97316",
};

const JOB_STATUS_COLORS = {
  Open:      "#22c55e",
  "On Hold": "#f59e0b",
  Closed:    "#64748b",
  Filled:    "#4f46e5",
};

const PALETTE = ["#4f46e5","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#0284c7","#65a30d","#db2777"];

const SORT_COLS = [
  { key: "jobs_posted",     label: "Jobs"       },
  { key: "candidates",      label: "Candidates" },
  { key: "interviews",      label: "Interviews" },
  { key: "offers",          label: "Offers"     },
  { key: "placements",      label: "Placed"     },
  { key: "conversion_rate", label: "Conversion" },
];

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, color, icon }) => (
  <Card elevation={0} sx={{
    border: "1px solid", borderColor: "divider", borderRadius: 2,
    position: "relative", overflow: "hidden",
    transition: "transform .15s, box-shadow .15s",
    "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
  }}>
    <CardContent sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary",
          textTransform: "uppercase", letterSpacing: ".05em" }}>
          {label}
        </Typography>
        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: `${color}20`,
          color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.cloneElement(icon, { sx: { fontSize: 17 } })}
        </Box>
      </Box>
      <Typography sx={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1, mb: .5 }}>
        {value}
      </Typography>
      {sub && <Typography sx={{ fontSize: 11, color: "text.disabled" }}>{sub}</Typography>}
    </CardContent>
    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, bgcolor: color, opacity: .6 }} />
  </Card>
);

// ── Funnel Bar ────────────────────────────────────────────────────────────────
const FunnelBar = ({ label, count, maxCount, color, pct }) => (
  <Box display="flex" alignItems="center" gap={1} mb={.75}>
    <Typography sx={{ fontSize: 11, color: "text.secondary", width: 120, flexShrink: 0 }}>
      {label}
    </Typography>
    <Box sx={{ flex: 1, bgcolor: "action.hover", borderRadius: 1, height: 22, overflow: "hidden" }}>
      <Box sx={{
        width: `${Math.max(4, (count / Math.max(1, maxCount)) * 100)}%`,
        height: "100%", bgcolor: color, borderRadius: 1,
        display: "flex", alignItems: "center", px: 1, transition: "width .6s ease",
      }}>
        {count > 0 && <Typography sx={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{count}</Typography>}
      </Box>
    </Box>
    <Typography sx={{ fontSize: 11, color: "text.disabled", width: 36, textAlign: "right" }}>
      {pct}%
    </Typography>
  </Box>
);

// ── Stage-wise Candidate Card ─────────────────────────────────────────────────
const StageCandidateCard = ({ stage, candidates, resumeMap = {} }) => {
  const [open, setOpen] = useState(true);
  const color = STAGE_COLORS[stage] || "#6366f1";
  const bg    = STAGE_BG[stage]    || "#f8fafc";
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 1.5, overflow: "hidden" }}>
      {/* Stage header */}
      <Box
        display="flex" alignItems="center" justifyContent="space-between"
        sx={{ px: 2, py: 1.2, bgcolor: bg, cursor: "pointer", borderLeft: `4px solid ${color}` }}
        onClick={() => setOpen(o => !o)}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Chip label={stage} size="small"
            sx={{ bgcolor: color, color: "#fff", fontWeight: 700, fontSize: 11 }} />
          <Chip
            label={`${candidates.length} candidate${candidates.length !== 1 ? "s" : ""}`}
            size="small" variant="outlined"
            sx={{ fontSize: 11, borderColor: color, color }}
          />
        </Box>
        <IconButton size="small">
          {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>

      {/* Candidate table */}
      <Collapse in={open}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                {/* {["Candidate", "Job", "Client", "Recruiter", "Pipeline Status", "Expected Salary", "Last Updated"].map(h => ( */}
                  {["Candidate", "Job", "Client", "Recruiter", "Pipeline Status", "Expected Salary", "Salary Offered", "Last Updated"].map(h => (
                  <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary",
                    textTransform: "uppercase", py: 0.8, whiteSpace: "nowrap" }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {candidates.map((c, i) => (
                <TableRow key={c._id || i} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 600,
                        bgcolor: color, opacity: .85 }}>
                        {nameInitials(c.candidate_name)}
                      </Avatar>
                      <Box>
                        <Typography fontSize={13} fontWeight={600}>{c.candidate_name}</Typography>
                        <Typography fontSize={11} color="text.secondary">{c.resume_id}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={12} fontWeight={600}>{c.job_id || "—"}</Typography>
                    <Typography fontSize={11} color="text.secondary">{c.job_title}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{c.client_name || "—"}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{c.recruiter || "—"}</TableCell>
                  <TableCell>
                    <Chip label={c.pipeline_status || "Active"} size="small"
                      sx={{ fontSize: 10,
                        bgcolor: c.pipeline_status === "Active" ? "#e8f5e9"
                          : c.pipeline_status === "On Hold" ? "#fff7ed"
                          : c.pipeline_status === "Completed" ? "#ede9fe" : "#f1f5f9",
                        color: c.pipeline_status === "Active" ? "#1b5e20"
                          : c.pipeline_status === "On Hold" ? "#c2410c"
                          : c.pipeline_status === "Completed" ? "#4f46e5" : "#475569",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    {/* Expected salary from resume bank */}
                    {fmtSalary(resumeMap[c.resume_id]?.expected_salary)}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    {/* Salary offered in this pipeline record */}
                    {fmtSalary(c.salary_offered)}
                  </TableCell>
                  <TableCell sx={{ fontSize: 11, color: "text.secondary" }}>
                    {fmtDate(c.updated_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Card>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function RecruiterAnalytics() {
  const [period,      setPeriod]      = useState("thisMonth");
  const [search,      setSearch]      = useState("");
  const [sortBy,      setSortBy]      = useState("placements");
  const [sortDir,     setSortDir]     = useState("desc");
  const [viewMode,    setViewMode]    = useState("my");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  // Filters
  const [filterJob,    setFilterJob]    = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterStage,  setFilterStage]  = useState("");

  // Data
  const [allJobs,     setAllJobs]     = useState([]);
  const [allResumes,  setAllResumes]  = useState([]);
  const [allTracking, setAllTracking] = useState([]);

  const currentUser = useMemo(() => getCurrentUser(), []);
  const myName      = useMemo(() => currentUser.name.toLowerCase(), [currentUser.name]);

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [rJ, rR, rT] = await Promise.all([
        authFetch(`${BASE}/jobs/?per_page=500`),
        authFetch(`${BASE}/resumes/?per_page=500`),
        authFetch(`${BASE}/tracking/?per_page=1000`),
      ]);
      const [dJ, dR, dT] = await Promise.all([rJ.json(), rR.json(), rT.json()]);
      setAllJobs(dJ.data     || []);
      setAllResumes(dR.data  || []);
      setAllTracking(dT.data || []);
    } catch { setError("Failed to load data. Check your API connection."); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── My scoped data ───────────────────────────────────────────────────────────
  const myJobs = useMemo(() => allJobs.filter(j =>
    (j.posted_by_name || "").toLowerCase() === myName && inPeriod(j.created_at, period)
  ), [allJobs, myName, period]);

  const myResumes = useMemo(() => allResumes.filter(r =>
    inPeriod(r.created_at, period)
  ), [allResumes, period]);


  const resumeMap = useMemo(() => {
    const map = {};
    allResumes.forEach(r => { map[r.resume_id] = r; });
    return map;
  }, [allResumes]);


  const myTracking = useMemo(() => allTracking.filter(t =>
    (t.recruiter || "").toLowerCase() === myName && inPeriod(t.created_at, period)
  ), [allTracking, myName, period]);

  // ── Filter dropdown options ──────────────────────────────────────────────────
  const jobOptions = useMemo(() => {
    const seen = new Set();
    return myTracking
      .filter(t => t.job_id && !seen.has(t.job_id) && seen.add(t.job_id))
      .map(t => ({ job_id: t.job_id, job_title: t.job_title || t.job_id }));
  }, [myTracking]);

  const clientOptions = useMemo(() =>
    [...new Set(myTracking.map(t => t.client_name).filter(Boolean))]
  , [myTracking]);

  // ── Filtered tracking (apply all 3 filters + search) ─────────────────────────
  const filteredTracking = useMemo(() => {
    return myTracking.filter(t => {
      const mJ = !filterJob    || t.job_id       === filterJob;
      const mC = !filterClient || t.client_name  === filterClient;
      const mS = !filterStage  || t.current_stage === filterStage;
      const mQ = !search       ||
        t.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.job_title?.toLowerCase().includes(search.toLowerCase()) ||
        t.client_name?.toLowerCase().includes(search.toLowerCase());
      return mJ && mC && mS && mQ;
    });
  }, [myTracking, filterJob, filterClient, filterStage, search]);

  // ── Stage groups for breakdown table ─────────────────────────────────────────
  const stageGroups = useMemo(() => {
    const groups = {};
    filteredTracking.forEach(t => {
      const s = t.current_stage || "Unknown";
      if (!groups[s]) groups[s] = [];
      groups[s].push(t);
    });
    return STAGE_ORDER
      .filter(s => groups[s]?.length > 0)
      .map(s => ({ stage: s, candidates: groups[s] }));
  }, [filteredTracking]);

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  // const myKPIs = useMemo(() => {
  //   const t      = filteredTracking;
  //   const placed = t.filter(x => x.current_stage === "Joined").length;
  //   const offered= t.filter(x => ["Offer Stage","Offer Accepted","Negotiation","Joined"].includes(x.current_stage)).length;
  //   const interviews = t.filter(x => !["Screening","Rejected","Withdrawn"].includes(x.current_stage)).length;
  //   const active = t.filter(x => x.pipeline_status === "Active").length;
  //   const conv   = t.length ? Math.round((placed / t.length) * 100) : 0;
  //   const totalSal = t.filter(x => x.salary_offered > 0).reduce((s, x) => s + Number(x.salary_offered || 0), 0);
  //   return { placed, offered, interviews, active, conv, totalSal, total: t.length };
  // }, [filteredTracking]);

  const myKPIs = useMemo(() => {
    const t        = filteredTracking;
    const placed   = t.filter(x => x.current_stage === "Joined").length;
    const offered  = t.filter(x =>
      ["Offer Stage","Offer Accepted","Negotiation","Joined"].includes(x.current_stage)).length;
    const interviews = t.filter(x =>
      !["Screening","Rejected","Withdrawn"].includes(x.current_stage)).length;
    const active   = t.filter(x => x.pipeline_status === "Active").length;
    const conv     = t.length ? Math.round((placed / t.length) * 100) : 0;
    const totalSalOffered = t.filter(x => x.salary_offered > 0)
      .reduce((s, x) => s + Number(x.salary_offered || 0), 0);
    // ← Expected salary from resume bank for candidates in pipeline
    const totalExpected = t.reduce((s, x) => {
      const resume = resumeMap[x.resume_id];
      return s + Number(resume?.expected_salary || 0);
    }, 0);
    return { placed, offered, interviews, active, conv,
      totalSal: totalSalOffered, totalExpected, total: t.length };
  }, [filteredTracking, resumeMap]);   // ← add resumeMap dependency

  // ── Funnel ───────────────────────────────────────────────────────────────────
  const funnelStages = [
    { label: "Screening",      key: "Screening"         },
    { label: "Tech Round 1",   key: "Technical Round 1" },
    { label: "HR Round",       key: "HR Round"          },
    { label: "Manager Round",  key: "Manager Round"     },
    { label: "Final Round",    key: "Final Round"       },
    { label: "Offer Stage",    key: "Offer Stage"       },
    { label: "Offer Accepted", key: "Offer Accepted"    },
    { label: "Joined",         key: "Joined"            },
  ];
  const funnelData = useMemo(() =>
    funnelStages.map(s => ({
      ...s,
      count: filteredTracking.filter(t => t.current_stage === s.key).length,
    }))
  , [filteredTracking]);
  const funnelMax = Math.max(1, ...funnelData.map(f => f.count));
  const funnelTop = Math.max(1, funnelData[0]?.count || 1);

  // ── Charts ────────────────────────────────────────────────────────────────────
  const statusChartData = useMemo(() => {
    const nonZero = Object.keys(STATUS_COLORS).filter(s => myResumes.some(r => r.status === s));
    return {
      labels: nonZero,
      datasets: [{
        data:            nonZero.map(s => myResumes.filter(r => r.status === s).length),
        backgroundColor: nonZero.map(s => STATUS_COLORS[s]),
        borderWidth: 0,
      }],
    };
  }, [myResumes]);

  const stageChartData = useMemo(() => {
    const stages = STAGE_ORDER.filter(s => filteredTracking.some(t => t.current_stage === s));
    return {
      labels: stages,
      datasets: [{
        label: "Candidates",
        data:            stages.map(s => filteredTracking.filter(t => t.current_stage === s).length),
        backgroundColor: stages.map(s => STAGE_COLORS[s] || "#6366f1"),
        borderRadius: 4,
      }],
    };
  }, [filteredTracking]);

  const jobStatusChartData = useMemo(() => ({
    labels: Object.keys(JOB_STATUS_COLORS),
    datasets: [{
      data:            Object.keys(JOB_STATUS_COLORS).map(s => myJobs.filter(j => j.status === s).length),
      backgroundColor: Object.values(JOB_STATUS_COLORS),
      borderRadius: 4,
    }],
  }), [myJobs]);

  // ── Client breakdown ──────────────────────────────────────────────────────────
  const clientBreakdown = useMemo(() => {
    const map = {};
    myJobs.forEach(j => {
      const k = j.client_name || "Unknown";
      if (!map[k]) map[k] = { open: 0, filled: 0, total: 0 };
      map[k].total++;
      if (j.status === "Open")   map[k].open++;
      if (j.status === "Filled") map[k].filled++;
    });
    return Object.entries(map)
      .map(([name, d]) => ({
        name, ...d,
        candidates: filteredTracking.filter(t => t.client_name === name).length,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [myJobs, filteredTracking]);

  // ── Team stats ────────────────────────────────────────────────────────────────
  const teamStats = useMemo(() => {
    const names = [...new Set([
      ...allTracking.map(t => t.recruiter).filter(Boolean),
      ...allJobs.map(j => j.posted_by_name).filter(Boolean),
    ])];
    return names.map(name => {
      const nl   = name.toLowerCase();
      const jobs = allJobs.filter(j => (j.posted_by_name || "").toLowerCase() === nl && inPeriod(j.created_at, period));
      const trk  = allTracking.filter(t => (t.recruiter || "").toLowerCase() === nl && inPeriod(t.created_at, period));
      const placed = trk.filter(t => t.current_stage === "Joined").length;
      const offered= trk.filter(t => ["Offer Stage","Offer Accepted","Negotiation","Joined"].includes(t.current_stage)).length;
      const interviews = trk.filter(t => !["Screening","Rejected","Withdrawn"].includes(t.current_stage)).length;
      const conv   = trk.length ? Math.round((placed / trk.length) * 100) : 0;
      return { name, jobs_posted: jobs.length, candidates: trk.length,
        interviews, offers: offered, placements: placed, conversion_rate: conv, isMe: nl === myName };
    });
  }, [allJobs, allTracking, period, myName]);

  const filteredTeam = useMemo(() => {
    let list = teamStats.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));
    return [...list].sort((a, b) => {
      const av = a[sortBy] ?? 0, bv = b[sortBy] ?? 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [teamStats, search, sortBy, sortDir]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const isFiltered = filterJob || filterClient || filterStage || search;
  const activeFilterCount = [filterJob, filterClient, filterStage, search].filter(Boolean).length;

  const clearFilters = () => { setFilterJob(""); setFilterClient(""); setFilterStage(""); setSearch(""); };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
      x: { ticks: { font: { size: 11 }, maxRotation: 35, autoSkip: false } },
    },
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} />
      </Box>
    );

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {/* ── Header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" color="primary.dark">Recruiter Analytics</Typography>
          <Typography color="text.secondary" mt={0.5}>
            Real-time performance — pipeline, conversions &amp; placements
          </Typography>
        </Box>

      </Box>

      {/* ── Period + View toggle ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Tabs value={period} onChange={(_, v) => setPeriod(v)}
          sx={{ bgcolor: "action.hover", borderRadius: 2, p: .5, minHeight: "unset",
            "& .MuiTabs-indicator": { display: "none" } }}>
          {PERIODS.map(p => (
            <Tab key={p.key} value={p.key} label={p.label}
              sx={{ minHeight: 34, px: 1.5, py: .5, borderRadius: 1.5, fontSize: 12,
                fontWeight: 600, textTransform: "none", color: "text.secondary",
                "&.Mui-selected": { bgcolor: "background.paper", color: "primary.main",
                  boxShadow: "0 1px 4px rgba(0,0,0,.1)" } }}
            />
          ))}
        </Tabs>
        <ToggleButtonGroup value={viewMode} exclusive size="small"
          onChange={(_, v) => v && setViewMode(v)}>
          <ToggleButton value="my">
            <Person fontSize="small" sx={{ mr: .5 }} />My Stats
          </ToggleButton>
          <ToggleButton value="team">
            <PeopleAlt fontSize="small" sx={{ mr: .5 }} />Team
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ════════════ MY STATS VIEW ════════════ */}
      {viewMode === "my" && (
        <>
          {/* ── Filter bar ── */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <FilterList fontSize="small" color="action" />
              <Typography fontSize={13} fontWeight={600} color="text.secondary">
                Filter candidates
              </Typography>
              {activeFilterCount > 0 && (
                <Chip label={`${activeFilterCount} active`} size="small" color="primary"
                  onDelete={clearFilters} sx={{ fontSize: 11 }} />
              )}
            </Box>

            <Box display="flex" gap={1.5} flexWrap="wrap">
              {/* Search */}
              <TextField
                placeholder="Search candidate, job, client…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                size="small"
                sx={{ minWidth: 220, flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Job filter */}
              <TextField select label="Filter by Job" value={filterJob}
                onChange={e => setFilterJob(e.target.value)} size="small" sx={{ minWidth: 200 }}>
                <MenuItem value="">All Jobs</MenuItem>
                {jobOptions.map(j => (
                  <MenuItem key={j.job_id} value={j.job_id}>
                    <Box>
                      <Typography fontSize={13} fontWeight={600}>{j.job_id}</Typography>
                      <Typography fontSize={11} color="text.secondary">{j.job_title}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              {/* Client filter */}
              <TextField select label="Filter by Client" value={filterClient}
                onChange={e => setFilterClient(e.target.value)} size="small" sx={{ minWidth: 180 }}>
                <MenuItem value="">All Clients</MenuItem>
                {clientOptions.map(c => (
                  <MenuItem key={c} value={c}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Business fontSize="small" sx={{ color: "#0277bd" }} />{c}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              {/* Stage filter — all 13 stages */}
              <TextField select label="Filter by Stage" value={filterStage}
                onChange={e => setFilterStage(e.target.value)} size="small" sx={{ minWidth: 180 }}>
                <MenuItem value="">All Stages</MenuItem>
                {STAGE_ORDER.map(s => (
                  <MenuItem key={s} value={s}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%",
                        bgcolor: STAGE_COLORS[s], flexShrink: 0 }} />
                      {s}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>

              {isFiltered && (
                <Button size="small" variant="outlined" color="inherit" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
            </Box>

            {/* Active filter chips */}
            {isFiltered && (
              <Box display="flex" gap={1} mt={1.5} flexWrap="wrap" alignItems="center">
                {filterJob && (
                  <Chip label={`Job: ${filterJob}`} size="small" color="primary" variant="outlined"
                    onDelete={() => setFilterJob("")} sx={{ fontSize: 11 }} />
                )}
                {filterClient && (
                  <Chip label={`Client: ${filterClient}`} size="small" color="primary" variant="outlined"
                    onDelete={() => setFilterClient("")} sx={{ fontSize: 11 }} />
                )}
                {filterStage && (
                  <Chip label={`Stage: ${filterStage}`} size="small" variant="outlined"
                    onDelete={() => setFilterStage("")}
                    sx={{ fontSize: 11, borderColor: STAGE_COLORS[filterStage],
                      color: STAGE_COLORS[filterStage] }}
                  />
                )}
                {search && (
                  <Chip label={`"${search}"`} size="small" variant="outlined"
                    onDelete={() => setSearch("")} sx={{ fontSize: 11 }} />
                )}
                <Typography fontSize={12} color="text.secondary">
                  → {filteredTracking.length} candidate{filteredTracking.length !== 1 ? "s" : ""} matched
                </Typography>
              </Box>
            )}
          </Card>

          {/* ── KPI Cards ── */}
          <Grid container spacing={2}>
            {[
              { label: "Jobs Posted",  value: myJobs.length,      sub: "in period",               color: "#4f46e5", icon: <WorkOutline /> },
              { label: "In Pipeline",  value: myKPIs.total,       sub: `${myKPIs.active} active`,  color: "#7c3aed", icon: <TrendingUp /> },
              { label: "Interviews",   value: myKPIs.interviews,  sub: "conducted",               color: "#f59e0b", icon: <Star /> },
              { label: "Offers",       value: myKPIs.offered,     sub: "extended",                color: "#8b5cf6", icon: <AttachMoney /> },
              { label: "Placements",   value: myKPIs.placed,      sub: "candidates joined",       color: "#059669", icon: <CheckCircleOutline /> },
              { label: "Conversion",
                value: `${myKPIs.conv}%`,
                sub: "pipeline → placed",
                color: myKPIs.conv >= 40 ? "#059669" : myKPIs.conv >= 20 ? "#f59e0b" : "#dc2626",
                icon: <TrendingUp /> },
              { label: "Salary Value", value: fmtSalary(myKPIs.totalSal), sub: "total offered",   color: "#0f172a", icon: <AttachMoney /> },
              { label: "Candidates",   value: myResumes.length,   sub: "in resume bank",          color: "#0891b2", icon: <PeopleAlt /> },
            ].map(k => (
              <Grid item xs={6} sm={4} md={3} key={k.label}>
                <KPICard {...k} />
              </Grid>
            ))}
          </Grid>

          {/* ── Stage-wise Candidate Breakdown (main feature) ── */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
              <Box>
                <Typography fontSize={15} fontWeight={600}>
                  Stage-wise candidate breakdown
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {isFiltered
                    ? `${filteredTracking.length} candidate${filteredTracking.length !== 1 ? "s" : ""} matching filters`
                    : `All ${myTracking.length} candidates in your pipeline`}
                </Typography>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                {filterJob    && <Chip icon={<WorkOutline sx={{ fontSize: 14 }} />} label={filterJob}    size="small" color="primary" />}
                {filterClient && <Chip icon={<Business   sx={{ fontSize: 14 }} />} label={filterClient} size="small" color="info" />}
                {filterStage  && (
                  <Chip label={filterStage} size="small"
                    sx={{ bgcolor: STAGE_COLORS[filterStage], color: "#fff", fontWeight: 700, fontSize: 11 }} />
                )}
              </Box>
            </Box>

            {stageGroups.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1}>
                <PeopleAlt sx={{ fontSize: 48, color: "#e0e0e0" }} />
                <Typography color="text.secondary" fontWeight={600}>No candidates found</Typography>
                <Typography fontSize={13} color="text.disabled">
                  {isFiltered ? "Try adjusting your filters" : "No pipeline data for this period"}
                </Typography>
                {isFiltered && (
                  <Button size="small" variant="outlined" onClick={clearFilters} sx={{ mt: 1 }}>
                    Clear filters
                  </Button>
                )}
              </Box>
            ) : (
              stageGroups.map(({ stage, candidates }) => (
                <StageCandidateCard key={stage} stage={stage} candidates={candidates} resumeMap={resumeMap} />
              ))
            )}
          </Card>

          {/* ── Funnel + Status charts ── */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
                <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
                  Pipeline funnel
                </Typography>
                {funnelData.map(f => (
                  <FunnelBar key={f.key} label={f.label} count={f.count}
                    maxCount={funnelMax} color={STAGE_COLORS[f.key] || "#6366f1"}
                    pct={Math.round((f.count / funnelTop) * 100)} />
                ))}
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
                <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
                  Candidates by status
                </Typography>
                <Box sx={{ position: "relative", height: 180 }}>
                  <Doughnut data={statusChartData}
                    options={{ responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { display: false } }, cutout: "65%" }} />
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1} mt={1.5}>
                  {statusChartData.labels.map((s, i) => (
                    <Box key={s} display="flex" alignItems="center" gap={.5}>
                      <Box sx={{ width: 10, height: 10, borderRadius: 1,
                        bgcolor: statusChartData.datasets[0].backgroundColor[i] }} />
                      <Typography fontSize={11} color="text.secondary">
                        {s} {statusChartData.datasets[0].data[i]}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* ── Stage bar + Job status ── */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
                <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
                  Candidates per stage
                </Typography>
                <Box sx={{ position: "relative", height: 220 }}>
                  {stageChartData.labels.length > 0
                    ? <Bar data={stageChartData} options={chartOptions} />
                    : <Typography color="text.disabled" fontSize={13} textAlign="center" pt={6}>No data</Typography>
                  }
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
                <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
                  My jobs by status
                </Typography>
                <Box sx={{ position: "relative", height: 180 }}>
                  <Bar data={jobStatusChartData}
                    options={{ ...chartOptions,
                      scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
                        x: { ticks: { font: { size: 11 } } },
                      }}} />
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1} mt={1.5}>
                  {Object.entries(JOB_STATUS_COLORS).map(([s, c]) => (
                    <Box key={s} display="flex" alignItems="center" gap={.5}>
                      <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: c }} />
                      <Typography fontSize={11} color="text.secondary">
                        {s} {myJobs.filter(j => j.status === s).length}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* ── Client breakdown table ── */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
            <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
              Jobs &amp; candidates by client
            </Typography>
            {clientBreakdown.length === 0
              ? <Typography color="text.disabled" fontSize={13}>No data for this period</Typography>
              : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      {["Client", "Open Jobs", "Filled Jobs", "Total Jobs", "Pipeline Candidates"].map(h => (
                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700,
                          color: "text.secondary", textTransform: "uppercase" }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientBreakdown.map((d, i) => (
                      <TableRow key={d.name} hover sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 600,
                              bgcolor: PALETTE[i % PALETTE.length], borderRadius: 1 }}>
                              {nameInitials(d.name)}
                            </Avatar>
                            <Typography fontSize={13} fontWeight={600}
                              sx={{ cursor: "pointer", color: "primary.main",
                                "&:hover": { textDecoration: "underline" } }}
                              onClick={() => setFilterClient(d.name)}>
                              {d.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={d.open} size="small"
                            sx={{ bgcolor: "#e8f5e9", color: "#1b5e20", fontWeight: 700 }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={d.filled} size="small"
                            sx={{ bgcolor: "#ede9fe", color: "#4f46e5", fontWeight: 700 }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{d.total}</TableCell>
                        <TableCell>
                          <Chip label={d.candidates} size="small"
                            sx={{ bgcolor: "#e0f2fe", color: "#0277bd", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => setFilterClient(d.name)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            }
          </Card>

          {/* ── Conversion metrics ── */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
            <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
              Conversion metrics
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: "Screened → Interviewed",
                  a: filteredTracking.filter(t => t.current_stage === "Screening").length,
                  b: filteredTracking.filter(t => !["Screening","Rejected","Withdrawn"].includes(t.current_stage)).length,
                  color: "#4f46e5" },
                { label: "Interviewed → Offered",
                  a: filteredTracking.filter(t => !["Screening","Rejected","Withdrawn"].includes(t.current_stage)).length,
                  b: filteredTracking.filter(t => ["Offer Stage","Offer Accepted","Negotiation","Joined"].includes(t.current_stage)).length,
                  color: "#f59e0b" },
                { label: "Offered → Joined",
                  a: filteredTracking.filter(t => ["Offer Stage","Offer Accepted","Negotiation","Joined"].includes(t.current_stage)).length,
                  b: filteredTracking.filter(t => t.current_stage === "Joined").length,
                  color: "#059669" },
                { label: "Overall (Pipeline → Placed)",
                  a: filteredTracking.length,
                  b: filteredTracking.filter(t => t.current_stage === "Joined").length,
                  color: "#7c3aed" },
              ].map(m => {
                const pct = m.a > 0 ? Math.round((m.b / m.a) * 100) : 0;
                return (
                  <Grid item xs={12} sm={6} md={3} key={m.label}>
                    <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
                      <Typography fontSize={11} color="text.secondary" mb={1}>{m.label}</Typography>
                      <Typography fontSize={22} fontWeight={600} sx={{ color: m.color }}>{pct}%</Typography>
                      <LinearProgress variant="determinate" value={pct}
                        sx={{ mt: 1, height: 5, borderRadius: 3, bgcolor: "divider",
                          "& .MuiLinearProgress-bar": { bgcolor: m.color } }} />
                      <Typography fontSize={11} color="text.disabled" mt={.5}>{m.b} of {m.a}</Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Card>
        </>
      )}

      {/* ════════════ TEAM VIEW ════════════ */}
      {viewMode === "team" && (
        <>
          <Grid container spacing={2}>
            {[
              { label: "Total Recruiters", value: filteredTeam.length,
                color: "#4f46e5", icon: <PeopleAlt />, sub: "in team" },
              { label: "Total Placements",
                value: filteredTeam.reduce((s, r) => s + r.placements, 0),
                color: "#059669", icon: <CheckCircleOutline />, sub: "combined" },
              { label: "Total Interviews",
                value: filteredTeam.reduce((s, r) => s + r.interviews, 0),
                color: "#f59e0b", icon: <Star />, sub: "combined" },
              { label: "Avg Conversion",
                value: filteredTeam.length
                  ? `${Math.round(filteredTeam.reduce((s, r) => s + r.conversion_rate, 0) / filteredTeam.length)}%`
                  : "—",
                color: "#7c3aed", icon: <TrendingUp />, sub: "team average" },
            ].map(k => (
              <Grid item xs={6} md={3} key={k.label}>
                <KPICard {...k} />
              </Grid>
            ))}
          </Grid>

          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <TextField placeholder="Search recruiter…" value={search}
              onChange={e => setSearch(e.target.value)} size="small" sx={{ minWidth: 240 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <SwapVert fontSize="small" color="disabled" />
              {SORT_COLS.map(s => (
                <Chip key={s.key}
                  label={sortBy === s.key ? `${s.label} ${sortDir === "desc" ? "↓" : "↑"}` : s.label}
                  size="small" onClick={() => handleSort(s.key)}
                  sx={{ cursor: "pointer", fontSize: 12, fontWeight: 600,
                    bgcolor: sortBy === s.key ? "#ede9fe" : "action.hover",
                    color:   sortBy === s.key ? "#4f46e5" : "text.secondary" }}
                />
              ))}
            </Box>
          </Box>

          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary",
                      textTransform: "uppercase", width: 36 }}>#</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary",
                      textTransform: "uppercase" }}>Recruiter</TableCell>
                    {SORT_COLS.map(col => (
                      <TableCell key={col.key} sx={{ fontSize: 11, fontWeight: 700,
                        color: "text.secondary", textTransform: "uppercase" }}>
                        <TableSortLabel active={sortBy === col.key}
                          direction={sortBy === col.key ? sortDir : "desc"}
                          onClick={() => handleSort(col.key)}>
                          {col.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTeam.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 5, color: "text.disabled" }}>
                        No recruiters found
                      </TableCell>
                    </TableRow>
                  ) : filteredTeam.map((r, i) => (
                    <TableRow key={r.name} hover
                      sx={{ bgcolor: r.isMe ? "#f5f0ff" : "transparent", "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={700}
                          sx={{ color: i===0?"#d97706":i===1?"#64748b":i===2?"#b45309":"#cbd5e1" }}>
                          {i + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 600,
                            bgcolor: PALETTE[i % PALETTE.length] }}>
                            {nameInitials(r.name)}
                          </Avatar>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontSize={13} fontWeight={600}>{r.name}</Typography>
                            {r.isMe && <Chip label="You" size="small"
                              sx={{ fontSize: 10, height: 18, bgcolor: "#ede9fe", color: "#4f46e5" }} />}
                            {i === 0 && <Chip label="★ Top" size="small"
                              sx={{ fontSize: 10, height: 18, bgcolor: "#fef3c7", color: "#d97706" }} />}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{r.jobs_posted}</TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{r.candidates}</TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{r.interviews}</TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{r.offers}</TableCell>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={700} color="success.main">
                          {r.placements}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${r.conversion_rate}%`} size="small"
                          sx={{ fontWeight: 700, fontSize: 12,
                            bgcolor: r.conversion_rate>=40?"#e8f5e9":r.conversion_rate>=20?"#fff7ed":"#fef2f2",
                            color:   r.conversion_rate>=40?"#1b5e20":r.conversion_rate>=20?"#c2410c":"#b91c1c" }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {filteredTeam.length > 0 && (
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5 }}>
              <Typography fontSize={14} fontWeight={600} color="text.secondary" mb={2}>
                Placements comparison
              </Typography>
              <Box sx={{ position: "relative", height: Math.max(220, filteredTeam.length * 40) }}>
                <Bar
                  data={{
                    labels: filteredTeam.map(r => r.name.split(" ")[0]),
                    datasets: [
                      { label: "Placements",
                        data: filteredTeam.map(r => r.placements),
                        backgroundColor: filteredTeam.map((_, i) => PALETTE[i % PALETTE.length]),
                        borderRadius: 4 },
                      { label: "Interviews",
                        data: filteredTeam.map(r => r.interviews),
                        backgroundColor: "#e2e8f0", borderRadius: 4 },
                    ],
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: "top",
                      labels: { font: { size: 11 }, boxWidth: 12, padding: 12 } } },
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
                      x: { ticks: { font: { size: 11 } } },
                    },
                  }}
                />
              </Box>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}