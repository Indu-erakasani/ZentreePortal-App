
// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
//   Alert, LinearProgress, Avatar, List, ListItem, ListItemAvatar,
//   ListItemText, Divider, Button, Table, TableHead, TableBody,
//   TableRow, TableCell, Paper, Tooltip,
// } from "@mui/material";
// import {
//   People, Work, CheckCircle, TrendingUp, AccessTime,
//   Star, Add, Description, MonetizationOn, Business,
//   WorkOutline, PersonOff,
// } from "@mui/icons-material";
// import { Link } from "react-router-dom";
// import { Schedule, VideoCall } from "@mui/icons-material";
// // ── API ───────────────────────────────────────────────────────────────────────
// const BASE = process.env.REACT_APP_API_BASE_URL;

// const getHeaders = () => ({
//   "Content-Type": "application/json",
//   Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
// });

// const authFetch = (url) =>
//   fetch(url, { headers: getHeaders() })
//     .then(async r => {
//       if (r.status === 401) { localStorage.clear(); window.location.href = "/login"; }
//       const d = await r.json();
//       if (!r.ok) throw d;
//       return d;
//     });

// // ── Helpers ───────────────────────────────────────────────────────────────────
// const fmt = (v) => {
//   if (!v && v !== 0) return "—";
//   if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
//   if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
//   return `₹${Number(v).toLocaleString("en-IN")}`;
// };

// // Convert ISO timestamp → "X hours ago / X days ago"
// const timeAgo = (iso) => {
//   if (!iso) return "";
//   const diff = (Date.now() - new Date(iso).getTime()) / 1000;
//   if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
//   if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
//   return `${Math.floor(diff / 86400)} days ago`;
// };

// const nameInitials = (name = "") =>
//   name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

// // ── Sub-components ────────────────────────────────────────────────────────────
// const StatCard = ({ title, value, icon, color, sub, progress }) => (
//   <Card>
//     <CardContent sx={{ p: 3 }}>
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
//         <Box>
//           <Typography fontSize={11} fontWeight={700} color="text.secondary"
//             textTransform="uppercase" letterSpacing={0.6}>{title}</Typography>
//           <Typography variant="h3" fontWeight={800} mt={0.5} sx={{ color }}>{value ?? "—"}</Typography>
//           {sub && (
//             <Typography fontSize={12} color="text.secondary" mt={0.4}>{sub}</Typography>
//           )}
//         </Box>
//         <Avatar sx={{ bgcolor: `${color}18`, color, width: 52, height: 52 }}>{icon}</Avatar>
//       </Box>
//       {progress !== undefined && (
//         <LinearProgress variant="determinate" value={Math.min(progress, 100)}
//           sx={{ height: 5, borderRadius: 3, bgcolor: `${color}18`,
//             "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }} />
//       )}
//     </CardContent>
//   </Card>
// );

// // ── Constants ─────────────────────────────────────────────────────────────────
// const PRIORITY_COLOR = { Critical: "error", High: "warning", Medium: "info", Low: "default" };

// const ACTIVITY_STYLE = {
//   placement: { bg: "#e8f5e9", color: "#2e7d32", label: "✓"  },
//   interview: { bg: "#e3f2fd", color: "#0277bd", label: "📅" },
//   client:    { bg: "#ede7f6", color: "#6a1b9a", label: "🏢" },
//   job:       { bg: "#fff3e0", color: "#e65100", label: "💼" },
//   candidate: { bg: "#f5f5f5", color: "#616161", label: "👤" },
// };

// // Candidate status → pipeline display config
// const STAGE_COLORS = {
//   "New":          "#546e7a",
//   "In Review":    "#e65100",
//   "Shortlisted":  "#0277bd",
//   "Interviewed":  "#7b1fa2",
//   "Offered":      "#f57f17",
//   "Hired":        "#2e7d32",
//   "Rejected":     "#c62828",
//   "On Hold":      "#795548",
//   // tracking stages
//   "Screening":           "#546e7a",
//   "Shortlisting":        "#0277bd",
//   "Technical Interview": "#7b1fa2",
//   "HR Interview":        "#e65100",
//   "Final Interview":     "#f57f17",
//   "Offer":               "#2e7d32",
//   "Negotiation":         "#00838f",
//   "Joined":              "#1b5e20",
//   "Dropped":             "#c62828",
// };

// // ── Main ──────────────────────────────────────────────────────────────────────
// export default function RecruiterDashboard() {
//   const [dash,    setDash]    = useState(null); 
//   const [myData,  setMyData]  = useState(null);  
//   const [loading, setLoading] = useState(true);
//   const [error,   setError]   = useState("");
//   const [todayInterviews, setTodayInterviews] = useState([]);

//   // const load = useCallback(async () => {
//   //   setLoading(true); setError("");
//   //   try {
//   //     // Call both endpoints in parallel
//   //     const [main, recruiter] = await Promise.all([
//   //       authFetch(`${BASE}/dashboard/`),
//   //       authFetch(`${BASE}/dashboard/recruiter`).catch(() => null),
//   //     ]);
//   //     if (main.success)      setDash(main.dashboard);
//   //     if (recruiter?.success) setMyData(recruiter.dashboard);
//   //   } catch (e) {
//   //     setError(e?.message || "Failed to load dashboard data");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // }, []);

//   const load = useCallback(async () => {
//     setLoading(true); setError("");
//     try {
//       const [main, recruiter, interviews] = await Promise.all([
//         authFetch(`${BASE}/dashboard/`),
//         authFetch(`${BASE}/dashboard/recruiter`).catch(() => null),
//         authFetch(`${BASE}/tracking/upcoming`).catch(() => ({ data: [] })),
//       ]);

//       if (main.success)       setDash(main.dashboard);
//       if (recruiter?.success) setMyData(recruiter.dashboard);

//       const today = new Date().toDateString();
//       setTodayInterviews(
//         (interviews.data || []).filter(ev =>
//           new Date(ev.scheduled_at).toDateString() === today
//         )
//       );
//     } catch (e) {
//       setError(e?.message || "Failed to load dashboard data");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { load(); }, [load]);

//   if (loading)
//     return (
//       <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
//         <CircularProgress size={48} />
//       </Box>
//     );

//   // ── Destructure real data with safe fallbacks ──────────────────────────────
//   const kpis            = dash?.kpis             || {};
//   const stageCountsRaw  = dash?.stage_counts     || [];   // [{stage, count}] — tracking
//   const pipelineRaw     = dash?.pipeline         || {};   // {status:count} — candidate_processing
//   const highPriorityJobs= dash?.high_priority_jobs || [];
//   const recruiterPerf   = dash?.recruiter_perf   || [];
//   const clientRevenue   = dash?.client_revenue   || [];
//   const recentActivity  = dash?.recent_activity  || [];

//   // My scoped data (recruiter endpoint)
//   const myStats      = myData?.stats       || {};
//   const myPipeline   = myData?.my_pipeline || [];   // [{stage, count}]
//   const myCandidates = myData?.my_candidates || [];
//   const myJobs       = myData?.my_jobs     || [];

//   // Build pipeline display — prefer tracking stage_counts, fallback to candidate_processing pipeline
//   const pipelineDisplay = stageCountsRaw.length > 0
//     ? stageCountsRaw
//     : Object.entries(pipelineRaw).map(([stage, count]) => ({ stage, count }));

//   const maxPipelineCount = Math.max(...pipelineDisplay.map(p => p.count), 1);

//   return (
//     <Box display="flex" flexDirection="column" gap={3}>

//       {error && <Alert severity="warning" onClose={() => setError("")}>{error}</Alert>}

//       {/* ── Welcome banner ── */}
//       <Card sx={{
//         background: "linear-gradient(135deg, #1a237e 0%, #0277bd 100%)",
//         color: "#fff",
//       }}>
//         <CardContent sx={{ p: 3, display: "flex", justifyContent: "space-between",
//           alignItems: "center", flexWrap: "wrap", gap: 2 }}>
//           <Box>
//             <Typography variant="h5" fontWeight={800}>
//               Welcome back{myData?.recruiter_name ? `, ${myData.recruiter_name.split(" ")[0]}` : ""}! 👋
//             </Typography>
//             <Typography sx={{ opacity: 0.85, mt: 0.5, fontSize: 14 }}>
//               {kpis.open_jobs ?? 0} open positions · {kpis.total_candidates ?? 0} candidates · {kpis.placements_mtd ?? 0} placements this month
//             </Typography>
//           </Box>
//           <Box display="flex" gap={1.5}>
//             <Button component={Link} to="/jobs" variant="contained" startIcon={<Add />}
//               sx={{ bgcolor: "#fff", color: "#fff", fontWeight: 700,
//                 "&:hover": { bgcolor: "#e8eaf6" } }}>
//               Post Job
//             </Button>
//             <Button component={Link} to="/resumes" variant="outlined"
//               sx={{ borderColor: "rgba(255,255,255,0.6)", color: "#fff",
//                 "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}>
//               Resume Bank
//             </Button>
//           </Box>
//         </CardContent>
//       </Card>
// {/* ── Today's Interviews ── */}
// {todayInterviews.length > 0 && (
//   <Card sx={{ border: "1.5px solid #90caf9" }}>
//     <CardContent sx={{ p: 3 }}>
//       <Box display="flex" alignItems="center" gap={1} mb={2}>
//         <Schedule sx={{ color: "#0277bd" }} />
//         <Typography variant="h6" fontWeight={700} color="#0277bd">
//           Today's Interviews
//         </Typography>
//         <Chip label={todayInterviews.length} size="small"
//           sx={{ bgcolor: "#0277bd", color: "#fff", fontWeight: 700 }} />
//       </Box>
//       <Box display="flex" flexDirection="column" gap={1.5}>
//         {todayInterviews.map((ev, i) => (
//           <Box key={i} sx={{
//             p: 2, bgcolor: "#f8fbff", borderRadius: 2,
//             border: "1px solid #e3f2fd",
//             display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
//           }}>
//             <Avatar sx={{ bgcolor: "#1a237e", fontWeight: 700, fontSize: 13, width: 38, height: 38 }}>
//               {(ev.candidate_name || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
//             </Avatar>
//             <Box flex={1}>
//               <Typography fontWeight={700} fontSize={14}>{ev.candidate_name}</Typography>
//               <Typography fontSize={12} color="text.secondary">
//                 {ev.job_title} · {ev.client_name}
//               </Typography>
//               <Box display="flex" gap={0.8} mt={0.4} flexWrap="wrap">
//                 <Chip label={ev.stage} size="small"
//                   sx={{ fontSize: 10, bgcolor: "#e8eaf6", color: "#1a237e" }} />
//                 <Chip label={ev.interview_type} size="small" variant="outlined" sx={{ fontSize: 10 }} />
//                 <Typography fontSize={11} color="#0277bd" fontWeight={700} alignSelf="center">
//                   {new Date(ev.scheduled_at).toLocaleTimeString("en-IN", {
//                     hour: "2-digit", minute: "2-digit"
//                   })}
//                   {" — "}{ev.duration_minutes} min
//                 </Typography>
//                 <Typography fontSize={11} color="text.secondary" alignSelf="center">
//                   👤 {ev.interviewer_name}
//                 </Typography>
//               </Box>
//             </Box>
//             {ev.meeting_link && (
//               <Button
//                 variant="contained" size="small"
//                 href={ev.meeting_link} target="_blank"
//                 startIcon={<VideoCall />}
//                 sx={{ bgcolor: "#34a853", "&:hover": { bgcolor: "#2e7d32" },
//                   textTransform: "none", fontSize: 12 }}>
//                 Join Meet
//               </Button>
//             )}
//           </Box>
//         ))}
//       </Box>
//     </CardContent>
//   </Card>
// )}
//       {/* ── KPI cards — all real data ── */}
//       <Grid container spacing={2.5}>
//         <Grid item xs={6} md={3}>
//           <StatCard
//             title="Active Clients"
//             value={kpis.active_clients ?? 0}
//             icon={<Business />} color="#1a237e"
//             sub={`${kpis.total_clients ?? 0} total`}
//             progress={kpis.total_clients ? (kpis.active_clients / kpis.total_clients) * 100 : 0}
//           />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <StatCard
//             title="Open Positions"
//             value={kpis.open_jobs ?? 0}
//             icon={<Work />} color="#0277bd"
//             sub={`${kpis.total_jobs ?? 0} total jobs`}
//             progress={kpis.total_jobs ? (kpis.open_jobs / kpis.total_jobs) * 100 : 0}
//           />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <StatCard
//             title="Total Candidates"
//             value={kpis.total_candidates ?? 0}
//             icon={<People />} color="#e65100"
//             sub="in resume bank"
//             progress={70}
//           />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <StatCard
//             title="Placements MTD"
//             value={kpis.placements_mtd ?? 0}
//             icon={<CheckCircle />} color="#2e7d32"
//             sub={`Fill rate ${kpis.fill_rate ?? 0}%`}
//             progress={kpis.fill_rate ?? 0}
//           />
//         </Grid>
//       </Grid>

//       {/* ── Revenue + Avg Days + Fill Rate summary bar ── */}
//       <Card>
//         <CardContent sx={{ py: 2, px: 3 }}>
//           <Grid container spacing={2} alignItems="center">
//             {[
//               { icon: <MonetizationOn />, value: fmt(kpis.revenue_mtd),     label: "Revenue MTD",       color: "#1a237e" },
//               { icon: <CheckCircle />,    value: `${kpis.fill_rate ?? 0}%`, label: "Fill Rate",         color: "#2e7d32" },
//               { icon: <AccessTime />,     value: `${kpis.avg_days_to_fill ?? 0}d`, label: "Avg Days to Fill", color: "#e65100" },
//               { icon: <WorkOutline />,    value: kpis.placements_total ?? 0, label: "Total Placements",  color: "#0277bd" },
//             ].map(({ icon, value, label, color }, i) => (
//               <Grid item xs={6} md={3} key={label}>
//                 <Box display="flex" alignItems="center" gap={1.5}
//                   sx={{ borderRight: i < 3 ? { md: "1px solid #e0e0e0" } : "none", pr: { md: 2 } }}>
//                   <Avatar sx={{ bgcolor: `${color}18`, color, width: 40, height: 40 }}>{icon}</Avatar>
//                   <Box>
//                     <Typography fontWeight={800} fontSize="1.15rem" color={color}>{value}</Typography>
//                     <Typography fontSize={11} color="text.secondary">{label}</Typography>
//                   </Box>
//                 </Box>
//               </Grid>
//             ))}
//           </Grid>
//         </CardContent>
//       </Card>

//       {/* ── Middle row: Pipeline + My recent candidates ── */}
//       <Grid container spacing={2.5}>

//         {/* Active Pipeline — real tracking stage counts */}
//         <Grid item xs={12} md={5}>
//           <Card sx={{ height: "100%" }}>
//             <CardContent sx={{ p: 3 }}>
//               <Box display="flex" alignItems="center" gap={1} mb={2.5}>
//                 <TrendingUp sx={{ color: "#0277bd" }} />
//                 <Typography variant="h6" fontWeight={700}>Active Pipeline</Typography>
//                 <Chip label={`${pipelineDisplay.reduce((s, p) => s + p.count, 0)} total`}
//                   size="small" sx={{ ml: "auto", fontSize: 11 }} />
//               </Box>

//               {pipelineDisplay.length === 0 ? (
//                 <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={1}>
//                   <PersonOff sx={{ fontSize: 40, color: "#bdbdbd" }} />
//                   <Typography fontSize={13} color="text.disabled">No active candidates yet</Typography>
//                 </Box>
//               ) : (
//                 pipelineDisplay.map(({ stage, count }) => (
//                   <Box key={stage} mb={2}>
//                     <Box display="flex" justifyContent="space-between" mb={0.5}>
//                       <Typography fontSize={13} fontWeight={600}>{stage}</Typography>
//                       <Typography fontSize={13} color="text.secondary" fontWeight={700}>{count}</Typography>
//                     </Box>
//                     <LinearProgress variant="determinate"
//                       value={(count / maxPipelineCount) * 100}
//                       sx={{
//                         height: 7, borderRadius: 4,
//                         bgcolor: `${STAGE_COLORS[stage] || "#546e7a"}18`,
//                         "& .MuiLinearProgress-bar": {
//                           bgcolor: STAGE_COLORS[stage] || "#546e7a",
//                           borderRadius: 4,
//                         },
//                       }}
//                     />
//                   </Box>
//                 ))
//               )}

//               {/* Conversion rate from kpis */}
//               {kpis.fill_rate !== undefined && (
//                 <Box sx={{ mt: 2, p: 2, bgcolor: "#e3f2fd", borderRadius: 2, border: "1px solid #bbdefb" }}>
//                   <Box display="flex" alignItems="center" gap={1} mb={0.5}>
//                     <Star sx={{ color: "#f57f17", fontSize: 18 }} />
//                     <Typography fontWeight={700} fontSize={13}>Fill Rate</Typography>
//                   </Box>
//                   <Typography variant="h4" fontWeight={800} color="#0277bd">{kpis.fill_rate}%</Typography>
//                   <Typography fontSize={12} color="text.secondary">Placements / Open Positions</Typography>
//                 </Box>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* My Recent Candidates (from recruiter endpoint) */}
//         <Grid item xs={12} md={7}>
//           <Card sx={{ height: "100%" }}>
//             <CardContent sx={{ p: 3 }}>
//               <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//                 <Typography variant="h6" fontWeight={700}>My Recent Candidates</Typography>
//                 <Button component={Link} to="/resumes" size="small" sx={{ fontSize: 12 }}>
//                   View All →
//                 </Button>
//               </Box>

//               {myCandidates.length === 0 ? (
//                 <Box display="flex" flexDirection="column" alignItems="center" py={5} gap={1}>
//                   <People sx={{ fontSize: 48, color: "#bdbdbd" }} />
//                   <Typography fontSize={13} color="text.disabled">No candidates linked to your jobs yet</Typography>
//                 </Box>
//               ) : (
//                 <List disablePadding>
//                   {myCandidates.slice(0, 6).map((c, i) => (
//                     <React.Fragment key={c._id || i}>
//                       <ListItem sx={{ px: 0, py: 1.2 }}>
//                         <ListItemAvatar>
//                           <Avatar sx={{ bgcolor: "#1a237e", fontWeight: 700, fontSize: 13, width: 36, height: 36 }}>
//                             {nameInitials(c.name)}
//                           </Avatar>
//                         </ListItemAvatar>
//                         <ListItemText
//                           primary={<Typography fontWeight={600} fontSize={13}>{c.name}</Typography>}
//                           secondary={
//                             <Typography fontSize={11} color="text.secondary">
//                               {c.linked_job_title || "No job linked"}
//                             </Typography>
//                           }
//                         />
//                         <Chip label={c.status || "New"} size="small"
//                           sx={{
//                             fontSize: 10, fontWeight: 700,
//                             bgcolor: `${STAGE_COLORS[c.status] || "#546e7a"}18`,
//                             color:   STAGE_COLORS[c.status] || "#546e7a",
//                           }} />
//                       </ListItem>
//                       {i < myCandidates.length - 1 && <Divider />}
//                     </React.Fragment>
//                   ))}
//                 </List>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* ── High Priority Jobs ── */}
//       <Card>
//         <CardContent sx={{ p: 3 }}>
//           <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//             <Typography variant="h6" fontWeight={700}>High Priority Jobs</Typography>
//             <Button component={Link} to="/jobs" size="small" sx={{ fontSize: 12 }}>View All →</Button>
//           </Box>

//           {highPriorityJobs.length === 0 ? (
//             <Box display="flex" flexDirection="column" alignItems="center" py={5} gap={1}>
//               <WorkOutline sx={{ fontSize: 48, color: "#bdbdbd" }} />
//               <Typography fontSize={13} color="text.disabled">No high priority open jobs</Typography>
//             </Box>
//           ) : (
//             <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//               <Table size="small">
//                 <TableHead>
//                   <TableRow sx={{ bgcolor: "#f5f7fa" }}>
//                     {["Job ID","Position","Client","Openings","Priority","Status"].map(h => (
//                       <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#546e7a" }}>{h}</TableCell>
//                     ))}
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {highPriorityJobs.map(job => (
//                     <TableRow key={job._id} hover>
//                       <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>{job.job_id}</TableCell>
//                       <TableCell>
//                         <Typography fontWeight={600} fontSize={13}>{job.title}</Typography>
//                       </TableCell>
//                       <TableCell sx={{ fontSize: 12 }}>
//                         <Box display="flex" alignItems="center" gap={0.5}>
//                           <Business sx={{ fontSize: 13, color: "#0277bd" }} />
//                           {job.client_name}
//                         </Box>
//                       </TableCell>
//                       <TableCell sx={{ fontSize: 12 }}>{job.openings}</TableCell>
//                       <TableCell>
//                         <Chip label={job.priority}
//                           color={PRIORITY_COLOR[job.priority] || "default"}
//                           size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                       </TableCell>
//                       <TableCell>
//                         <Chip label={job.status || "Open"} size="small"
//                           sx={{ fontWeight: 700, fontSize: 11,
//                             bgcolor: "#e8f5e9", color: "#2e7d32" }} />
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </Paper>
//           )}
//         </CardContent>
//       </Card>

//       {/* ── Bottom row: Recruiter Performance + Recent Activity ── */}
//       <Grid container spacing={2.5}>

//         {/* Recruiter Performance — real data */}
//         <Grid item xs={12} md={7}>
//           <Card>
//             <CardContent sx={{ p: 3 }}>
//               <Typography variant="h6" fontWeight={700} mb={2}>Recruiter Performance</Typography>

//               {recruiterPerf.length === 0 ? (
//                 <Box display="flex" flexDirection="column" alignItems="center" py={5} gap={1}>
//                   <People sx={{ fontSize: 48, color: "#bdbdbd" }} />
//                   <Typography fontSize={13} color="text.disabled">No placement data yet</Typography>
//                 </Box>
//               ) : (
//                 <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//                   <Table size="small">
//                     <TableHead>
//                       <TableRow sx={{ bgcolor: "#f5f7fa" }}>
//                         {["Recruiter","Jobs","Interviews","Placements","Revenue","Rate"].map(h => (
//                           <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#546e7a" }}>{h}</TableCell>
//                         ))}
//                       </TableRow>
//                     </TableHead>
//                     <TableBody>
//                       {recruiterPerf.slice(0, 6).map((r, i) => (
//                         <TableRow key={i} hover>
//                           <TableCell>
//                             <Box display="flex" alignItems="center" gap={1}>
//                               <Avatar sx={{ width: 28, height: 28, fontSize: 10, fontWeight: 700,
//                                 bgcolor: ["#1a237e","#0277bd","#2e7d32","#e65100","#7b1fa2","#00838f"][i % 6] }}>
//                                 {nameInitials(r.name)}
//                               </Avatar>
//                               <Typography fontSize={12} fontWeight={600}>{r.name}</Typography>
//                             </Box>
//                           </TableCell>
//                           <TableCell sx={{ fontSize: 12 }}>{r.jobs_posted ?? 0}</TableCell>
//                           <TableCell sx={{ fontSize: 12 }}>{r.interviews ?? 0}</TableCell>
//                           <TableCell>
//                             <Chip label={r.placements} size="small" color="success"
//                               sx={{ fontWeight: 700, fontSize: 10 }} />
//                           </TableCell>
//                           <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{fmt(r.revenue)}</TableCell>
//                           <TableCell>
//                             <Box display="flex" alignItems="center" gap={0.5}>
//                               <LinearProgress variant="determinate"
//                                 value={Math.min(r.conversion_rate || 0, 100)}
//                                 sx={{ width: 50, height: 5, borderRadius: 3,
//                                   "& .MuiLinearProgress-bar": {
//                                     bgcolor: (r.conversion_rate || 0) >= 30 ? "#2e7d32" : "#0277bd"
//                                   }
//                                 }} />
//                               <Typography fontSize={10} color="text.secondary">
//                                 {r.conversion_rate ?? 0}%
//                               </Typography>
//                             </Box>
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </Paper>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Recent Activity — real data with relative timestamps */}
//         <Grid item xs={12} md={5}>
//           <Card sx={{ height: "100%" }}>
//             <CardContent sx={{ p: 3 }}>
//               <Typography variant="h6" fontWeight={700} mb={2}>Recent Activity</Typography>

//               {recentActivity.length === 0 ? (
//                 <Box display="flex" flexDirection="column" alignItems="center" py={5} gap={1}>
//                   <AccessTime sx={{ fontSize: 48, color: "#bdbdbd" }} />
//                   <Typography fontSize={13} color="text.disabled">No recent activity</Typography>
//                 </Box>
//               ) : (
//                 <Box display="flex" flexDirection="column" gap={2}>
//                   {recentActivity.slice(0, 7).map((a, i) => {
//                     const s = ACTIVITY_STYLE[a.type] || ACTIVITY_STYLE.candidate;
//                     return (
//                       <Box key={i} display="flex" gap={1.5} alignItems="flex-start">
//                         <Avatar sx={{ width: 32, height: 32, fontSize: 13,
//                           bgcolor: s.bg, color: s.color, flexShrink: 0 }}>
//                           {s.label}
//                         </Avatar>
//                         <Box flex={1} minWidth={0}>
//                           <Typography fontSize={13} color="text.primary" sx={{ lineHeight: 1.4 }}>
//                             {a.message}
//                           </Typography>
//                           <Typography fontSize={11} color="text.secondary" mt={0.3}>
//                             {a.time ? timeAgo(a.time) : ""}
//                           </Typography>
//                         </Box>
//                       </Box>
//                     );
//                   })}
//                 </Box>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* ── Client Revenue ── */}
//       {clientRevenue.length > 0 && (
//         <Card>
//           <CardContent sx={{ p: 3 }}>
//             <Typography variant="h6" fontWeight={700} mb={2.5}>Client Revenue Overview</Typography>
//             <Grid container spacing={2}>
//               {clientRevenue.map((c, i) => {
//                 const maxRev = Math.max(...clientRevenue.map(x => x.revenue), 1);
//                 const colors = ["#1a237e","#0277bd","#2e7d32","#e65100","#7b1fa2","#00838f"];
//                 const color  = colors[i % colors.length];
//                 return (
//                   <Grid item xs={12} sm={6} md={4} key={i}>
//                     <Box p={2} bgcolor="#f8fbff" borderRadius={2}
//                       border="1px solid #e3f2fd">
//                       <Box display="flex" alignItems="center" gap={1} mb={1}>
//                         <Business sx={{ fontSize: 16, color }} />
//                         <Typography fontSize={13} fontWeight={700} noWrap>{c.client}</Typography>
//                       </Box>
//                       <Typography variant="h5" fontWeight={800} color={color}>
//                         {fmt(c.revenue)}
//                       </Typography>
//                       {c.placements !== undefined && (
//                         <Typography fontSize={11} color="text.secondary">
//                           {c.placements} placement{c.placements !== 1 ? "s" : ""}
//                         </Typography>
//                       )}
//                       <LinearProgress variant="determinate"
//                         value={(c.revenue / maxRev) * 100}
//                         sx={{ mt: 1.5, height: 5, borderRadius: 3,
//                           bgcolor: `${color}18`,
//                           "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 }
//                         }} />
//                     </Box>
//                   </Grid>
//                 );
//               })}
//             </Grid>
//           </CardContent>
//         </Card>
//       )}

//     </Box>
//   );
// }

















import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Alert, LinearProgress, Avatar, Divider, Button, Table, TableHead,
  TableBody, TableRow, TableCell, Paper, IconButton, Tooltip,
} from "@mui/material";
import {
  People, Work, CheckCircle, TrendingUp, AccessTime,
  Star, Add, MonetizationOn, Business, WorkOutline,
  PersonOff, Schedule, VideoCall, NavigateBefore, NavigateNext,
  Today, CalendarMonth, BarChart, ArrowUpward, ArrowForward,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

const BASE = process.env.REACT_APP_API_BASE_URL;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const authFetch = (url) =>
  fetch(url, { headers: getHeaders() }).then(async (r) => {
    if (r.status === 401) { localStorage.clear(); window.location.href = "/login"; }
    const d = await r.json();
    if (!r.ok) throw d;
    return d;
  });

const fmt = (v) => {
  if (!v && v !== 0) return "—";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${Number(v).toLocaleString("en-IN")}`;
};

const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const PRIORITY_COLOR = { Critical: "error", High: "warning", Medium: "info", Low: "default" };

const STAGE_COLORS = {
  "Screening":         "#64748b",
  "Technical Round 1": "#0369a1",
  "Technical Round 2": "#075985",
  "HR Round":          "#c2410c",
  "Manager Round":     "#7e22ce",
  "Final Round":       "#9d174d",
  "Offer Stage":       "#1d4ed8",
  "Negotiation":       "#b45309",
  "Offer Accepted":    "#15803d",
  "Joined":            "#14532d",
  "Rejected":          "#991b1b",
  "New":               "#475569",
  "In Review":         "#c2410c",
  "Shortlisted":       "#0369a1",
  "Interviewed":       "#6d28d9",
  "Offered":           "#a16207",
  "Hired":             "#15803d",
  "On Hold":           "#78716c",
};

const ACTIVITY_ICON = {
  placement: { emoji: "✅", bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
  interview: { emoji: "📅", bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
  client:    { emoji: "🏢", bg: "#faf5ff", border: "#e9d5ff", text: "#6b21a8" },
  job:       { emoji: "💼", bg: "#fff7ed", border: "#fed7aa", text: "#9a3412" },
  candidate: { emoji: "👤", bg: "#f8fafc", border: "#e2e8f0", text: "#475569" },
};

// ── Palette & tokens ────────────────────────────────────────────────────────
const COLORS = {
  navy:    "#0f172a",
  blue:    "#1d4ed8",
  indigo:  "#4f46e5",
  teal:    "#0d9488",
  amber:   "#d97706",
  green:   "#15803d",
  red:     "#dc2626",
  slate:   "#64748b",
  surface: "#f8fafc",
};

// ── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, accent, sub, progress, trend }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: "16px",
      border: "1px solid #e2e8f0",
      background: "#fff",
      position: "relative",
      overflow: "hidden",
      transition: "box-shadow 0.2s, transform 0.2s",
      "&:hover": { boxShadow: "0 8px 32px rgba(15,23,42,0.10)", transform: "translateY(-2px)" },
    }}
  >
    {/* Accent bar top */}
    <Box sx={{ height: 3, background: accent, borderRadius: "16px 16px 0 0" }} />
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            sx={{ fontSize: 11, fontWeight: 700, color: "#94a3b8",
              textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.8 }}
          >
            {title}
          </Typography>
          <Typography
            sx={{ fontSize: "2rem", fontWeight: 800, color: COLORS.navy, lineHeight: 1.1 }}
          >
            {value ?? "—"}
          </Typography>
          {sub && (
            <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.5 }}>{sub}</Typography>
          )}
          {trend !== undefined && (
            <Box display="flex" alignItems="center" gap={0.4} mt={0.6}>
              <ArrowUpward sx={{ fontSize: 12, color: "#15803d" }} />
              <Typography sx={{ fontSize: 11, color: "#15803d", fontWeight: 700 }}>
                {trend}%
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>vs last month</Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            width: 46, height: 46, borderRadius: "12px",
            background: `${accent}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {React.cloneElement(icon, { sx: { color: accent, fontSize: 22 } })}
        </Box>
      </Box>
      {progress !== undefined && (
        <Box mt={2}>
          <LinearProgress
            variant="determinate"
            value={Math.min(progress, 100)}
            sx={{
              height: 5, borderRadius: 8,
              bgcolor: `${accent}15`,
              "& .MuiLinearProgress-bar": { bgcolor: accent, borderRadius: 8 },
            }}
          />
        </Box>
      )}
    </CardContent>
  </Card>
);

// ── Mini Calendar ──────────────────────────────────────────────────────────
function MiniCalendar({ allInterviews, onDaySelect, selectedDay, calYear, calMonth, onPrev, onNext, onToday }) {
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const today       = new Date();

  const dayMap = {};
  allInterviews.forEach((ev) => {
    const d = new Date(ev.scheduled_at);
    if (d.getMonth() === calMonth && d.getFullYear() === calYear) {
      const key = d.getDate();
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(ev);
    }
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Box>
      {/* Month nav */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <IconButton size="small" onClick={onPrev} sx={{ "&:hover": { bgcolor: "#f1f5f9" } }}>
          <NavigateBefore fontSize="small" />
        </IconButton>
        <Typography sx={{ fontWeight: 700, fontSize: 13, color: COLORS.navy }}>
          {MONTHS[calMonth]} {calYear}
        </Typography>
        <IconButton size="small" onClick={onNext} sx={{ "&:hover": { bgcolor: "#f1f5f9" } }}>
          <NavigateNext fontSize="small" />
        </IconButton>
      </Box>

      <Button
        size="small" fullWidth onClick={onToday} startIcon={<Today fontSize="small" />}
        variant="outlined"
        sx={{ mb: 1.5, textTransform: "none", fontSize: 11, borderRadius: "10px",
          borderColor: "#e2e8f0", color: "#475569",
          "&:hover": { borderColor: "#1d4ed8", color: "#1d4ed8", bgcolor: "#eff6ff" } }}
      >
        Go to Today
      </Button>

      {/* Day headers */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", mb: 0.5 }}>
        {DAYS.map((d) => (
          <Typography key={d} sx={{ fontSize: 10, fontWeight: 700, color: "#94a3b8",
            textAlign: "center", py: 0.3 }}>{d}</Typography>
        ))}
      </Box>

      {/* Cells */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px" }}>
        {cells.map((day, i) => {
          if (!day) return <Box key={i} />;
          const hasEvents  = !!dayMap[day];
          const count      = dayMap[day]?.length || 0;
          const isToday    = today.getDate() === day && today.getMonth() === calMonth && today.getFullYear() === calYear;
          const isSelected = selectedDay === day;

          return (
            <Box
              key={i}
              onClick={() => hasEvents && onDaySelect(day)}
              sx={{
                aspectRatio: "1", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                borderRadius: "8px", cursor: hasEvents ? "pointer" : "default",
                bgcolor: isSelected ? "#1d4ed8" : isToday ? "#eff6ff" : "transparent",
                border: isToday && !isSelected ? "1.5px solid #bfdbfe" : "1.5px solid transparent",
                transition: "all 0.15s",
                "&:hover": hasEvents ? { bgcolor: isSelected ? "#1d4ed8" : "#f1f5f9" } : {},
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: isToday || isSelected ? 700 : 400,
                color: isSelected ? "#fff" : isToday ? "#1d4ed8" : "#334155" }}>
                {day}
              </Typography>
              {hasEvents && (
                <Box sx={{
                  width: count > 1 ? 14 : 5, height: 5, borderRadius: 4, mt: "2px",
                  bgcolor: isSelected ? "#fff" : "#1d4ed8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {count > 1 && (
                    <Typography sx={{ fontSize: 8, color: isSelected ? "#1d4ed8" : "#fff",
                      fontWeight: 700, lineHeight: 1 }}>{count}</Typography>
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Box mt={2} pt={1.5} sx={{ borderTop: "1px solid #f1f5f9" }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#1d4ed8" }} />
          <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>Has interviews</Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export default function RecruiterDashboard() {
  const [dash,          setDash]          = useState(null);
  const [myData,        setMyData]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [allInterviews, setAllInterviews] = useState([]);
  const [selectedDay,   setSelectedDay]   = useState(null);
  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [main, recruiter, upcoming] = await Promise.all([
        authFetch(`${BASE}/dashboard/`),
        authFetch(`${BASE}/dashboard/recruiter`).catch(() => null),
        authFetch(`${BASE}/tracking/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
          .catch(() => ({ data: [] })),
      ]);
      if (main.success)       setDash(main.dashboard);
      if (recruiter?.success) setMyData(recruiter.dashboard);
      setAllInterviews(upcoming.data || []);
      const todayStr = new Date().toDateString();
      const todayHas = (upcoming.data || []).some((ev) =>
        new Date(ev.scheduled_at).toDateString() === todayStr
      );
      setSelectedDay(todayHas ? new Date().getDate() : null);
    } catch (e) {
      setError(e?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCalendar = useCallback(async () => {
    try {
      const res = await authFetch(
        `${BASE}/tracking/calendar?year=${calYear}&month=${calMonth + 1}`
      ).catch(() => ({ data: [] }));
      setAllInterviews(res.data || []);
      setSelectedDay(null);
    } catch {}
  }, [calYear, calMonth]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCalendar(); }, [calMonth, calYear]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };
  const goToday = () => { setCalYear(now.getFullYear()); setCalMonth(now.getMonth()); setSelectedDay(now.getDate()); };

  const selectedDayInterviews = selectedDay
    ? allInterviews
        .filter((ev) => {
          const d = new Date(ev.scheduled_at);
          return d.getDate() === selectedDay && d.getMonth() === calMonth && d.getFullYear() === calYear;
        })
        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    : allInterviews
        .filter((ev) => {
          const d = new Date(ev.scheduled_at);
          return d.getMonth() === calMonth && d.getFullYear() === calYear;
        })
        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

  const todayCount = allInterviews.filter((ev) =>
    new Date(ev.scheduled_at).toDateString() === new Date().toDateString()
  ).length;

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" flexDirection="column" gap={2}>
        <CircularProgress size={40} sx={{ color: COLORS.blue }} />
        <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>Loading dashboard…</Typography>
      </Box>
    );

  const kpis             = dash?.kpis              || {};
  const stageCountsRaw   = dash?.stage_counts      || [];
  const pipelineRaw      = dash?.pipeline          || {};
  const highPriorityJobs = dash?.high_priority_jobs || [];
  const recruiterPerf    = dash?.recruiter_perf    || [];
  const clientRevenue    = dash?.client_revenue    || [];
  const recentActivity   = dash?.recent_activity   || [];
  const myCandidates     = myData?.my_candidates   || [];

  const pipelineDisplay = stageCountsRaw.length > 0
    ? stageCountsRaw
    : Object.entries(pipelineRaw).map(([stage, count]) => ({ stage, count }));
  const maxPipelineCount = Math.max(...pipelineDisplay.map((p) => p.count), 1);

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const firstName = myData?.recruiter_name?.split(" ")[0] || "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pb: 4 }}>

      {error && (
        <Alert severity="warning" onClose={() => setError("")} sx={{ borderRadius: "12px" }}>
          {error}
        </Alert>
      )}

      {/* ── Hero Banner ── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: "20px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)",
          overflow: "hidden", position: "relative",
        }}
      >
        {/* Decorative circles */}
        <Box sx={{
          position: "absolute", top: -40, right: -40,
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }} />
        <Box sx={{
          position: "absolute", bottom: -60, right: 120,
          width: 160, height: 160, borderRadius: "50%",
          background: "rgba(255,255,255,0.03)",
        }} />
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 12, mb: 0.5, letterSpacing: "0.05em" }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </Typography>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.5rem", lineHeight: 1.2 }}>
                {firstName ? `Good to see you, ${firstName} 👋` : "Welcome back 👋"}
              </Typography>
              <Box display="flex" alignItems="center" gap={1.5} mt={1.2} flexWrap="wrap">
                {[
                  { label: `${kpis.open_jobs ?? 0} Open Positions` },
                  { label: `${kpis.total_candidates ?? 0} Candidates` },
                  { label: `${kpis.placements_mtd ?? 0} Placements MTD` },
                ].map(({ label }) => (
                  <Chip
                    key={label}
                    label={label}
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#fff",
                      fontWeight: 600, fontSize: 11, backdropFilter: "blur(4px)",
                      border: "1px solid rgba(255,255,255,0.15)" }}
                  />
                ))}
                {todayCount > 0 && (
                  <Chip
                    label={`🗓 ${todayCount} interview${todayCount > 1 ? "s" : ""} today`}
                    size="small"
                    sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: 11 }}
                  />
                )}
              </Box>
            </Box>
            <Box display="flex" gap={1.5}>
              <Button
                component={Link} to="/jobs" variant="contained" startIcon={<Add />}
                sx={{
                  bgcolor: "#fff", color: COLORS.navy, fontWeight: 700, fontSize: 13,
                  borderRadius: "10px", px: 2.5, textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#f1f5f9", boxShadow: "none" },
                }}
              >
                Post Job
              </Button>
              <Button
                component={Link} to="/resumes" variant="outlined"
                sx={{
                  borderColor: "rgba(255,255,255,0.35)", color: "#fff", fontWeight: 600,
                  fontSize: 13, borderRadius: "10px", px: 2.5, textTransform: "none",
                  "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                Resume Bank
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── KPI Cards ── */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <StatCard title="Active Clients" value={kpis.active_clients ?? 0}
            icon={<Business />} accent={COLORS.indigo}
            sub={`${kpis.total_clients ?? 0} total clients`}
            progress={kpis.total_clients ? (kpis.active_clients / kpis.total_clients) * 100 : 0} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Open Positions" value={kpis.open_jobs ?? 0}
            icon={<Work />} accent={COLORS.blue}
            sub={`${kpis.total_jobs ?? 0} total posted`}
            progress={kpis.total_jobs ? (kpis.open_jobs / kpis.total_jobs) * 100 : 0} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Total Candidates" value={kpis.total_candidates ?? 0}
            icon={<People />} accent={COLORS.teal}
            sub="in resume bank" progress={70} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Placements MTD" value={kpis.placements_mtd ?? 0}
            icon={<CheckCircle />} accent={COLORS.green}
            sub={`Fill rate ${kpis.fill_rate ?? 0}%`}
            progress={kpis.fill_rate ?? 0} />
        </Grid>
      </Grid>

      {/* ── Metrics Strip ── */}
      <Card
        elevation={0}
        sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", bgcolor: "#fff" }}
      >
        <CardContent sx={{ py: 2, px: 3 }}>
          <Grid container spacing={2} alignItems="center" divider={<Divider orientation="vertical" flexItem />}>
            {[
              { icon: <MonetizationOn />, value: fmt(kpis.revenue_mtd),           label: "Revenue MTD",       accent: COLORS.indigo },
              { icon: <CheckCircle />,    value: `${kpis.fill_rate ?? 0}%`,       label: "Fill Rate",         accent: COLORS.green  },
              { icon: <AccessTime />,     value: `${kpis.avg_days_to_fill ?? 0}d`,label: "Avg Days to Fill",  accent: COLORS.amber  },
              { icon: <WorkOutline />,    value: kpis.placements_total ?? 0,      label: "Total Placements",  accent: COLORS.blue   },
            ].map(({ icon, value, label, accent }, i) => (
              <Grid item xs={6} md={3} key={label}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: `${accent}12`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {React.cloneElement(icon, { sx: { color: accent, fontSize: 18 } })}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: COLORS.navy }}>{value}</Typography>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>{label}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* ── Main Row: Calendar + Pipeline + Candidates ── */}
      <Grid container spacing={2.5}>

        {/* Calendar */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#eff6ff",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CalendarMonth sx={{ color: COLORS.blue, fontSize: 17 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: COLORS.navy }}>
                  Interview Calendar
                </Typography>
                {todayCount > 0 && (
                  <Chip label={`${todayCount} today`} size="small"
                    sx={{ ml: "auto", bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 10 }} />
                )}
              </Box>

              <MiniCalendar
                allInterviews={allInterviews}
                onDaySelect={(d) => setSelectedDay((prev) => prev === d ? null : d)}
                selectedDay={selectedDay}
                calYear={calYear}
                calMonth={calMonth}
                onPrev={prevMonth}
                onNext={nextMonth}
                onToday={goToday}
              />

              <Divider sx={{ my: 2 }} />

              {/* Interview list */}
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.2 }}>
                  {selectedDay
                    ? `${selectedDay} ${MONTHS[calMonth]} · ${selectedDayInterviews.length} scheduled`
                    : `${MONTHS[calMonth]} · ${selectedDayInterviews.length} scheduled`}
                </Typography>

                {selectedDayInterviews.length === 0 ? (
                  <Box textAlign="center" py={2.5}>
                    <CalendarMonth sx={{ fontSize: 32, color: "#e2e8f0", mb: 0.5 }} />
                    <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>
                      {selectedDay ? "No interviews this day" : "No interviews this month"}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    display="flex" flexDirection="column" gap={1}
                    sx={{ maxHeight: 260, overflowY: "auto",
                      "&::-webkit-scrollbar": { width: 4 },
                      "&::-webkit-scrollbar-thumb": { bgcolor: "#e2e8f0", borderRadius: 4 } }}
                  >
                    {selectedDayInterviews.map((ev, i) => {
                      const evDate = new Date(ev.scheduled_at);
                      const isNow  = Math.abs(evDate - new Date()) < 30 * 60 * 1000;
                      return (
                        <Box
                          key={i}
                          sx={{
                            p: 1.5, borderRadius: "10px",
                            bgcolor: isNow ? "#f0fdf4" : "#f8fafc",
                            border: `1px solid ${isNow ? "#bbf7d0" : "#f1f5f9"}`,
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ width: 3, height: 38, borderRadius: 4, flexShrink: 0,
                              bgcolor: STAGE_COLORS[ev.current_stage] || COLORS.blue }} />
                            <Box flex={1} minWidth={0}>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.navy }} noWrap>
                                {ev.candidate_name}
                              </Typography>
                              <Typography sx={{ fontSize: 10, color: "#94a3b8" }} noWrap>
                                {ev.stage} · {ev.interview_type}
                              </Typography>
                              <Typography sx={{ fontSize: 11, color: COLORS.blue, fontWeight: 600 }}>
                                {evDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                {" · "}{ev.duration_minutes}min
                              </Typography>
                            </Box>
                            {ev.meeting_link && (
                              <Tooltip title="Join Meeting">
                                <IconButton
                                  size="small" component="a"
                                  href={ev.meeting_link} target="_blank"
                                  sx={{ color: "#15803d", bgcolor: "#f0fdf4",
                                    "&:hover": { bgcolor: "#dcfce7" } }}
                                >
                                  <VideoCall sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                {selectedDay && (
                  <Button
                    size="small" onClick={() => setSelectedDay(null)}
                    sx={{ mt: 1, fontSize: 10, textTransform: "none", color: "#64748b" }}
                  >
                    Show full month
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={8}>
          <Box display="flex" flexDirection="column" gap={2.5} height="100%">

            {/* Pipeline */}
            <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#eff6ff",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BarChart sx={{ color: COLORS.blue, fontSize: 17 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: COLORS.navy }}>
                    Active Pipeline
                  </Typography>
                  <Chip
                    label={`${pipelineDisplay.reduce((s, p) => s + p.count, 0)} total`}
                    size="small"
                    sx={{ ml: "auto", bgcolor: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 11 }}
                  />
                </Box>

                {pipelineDisplay.length === 0 ? (
                  <Box display="flex" alignItems="center" justifyContent="center" py={3} gap={1}>
                    <PersonOff sx={{ color: "#cbd5e1" }} />
                    <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No active candidates</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={1.5}>
                    {pipelineDisplay.slice(0, 8).map(({ stage, count }) => (
                      <Grid item xs={6} key={stage}>
                        <Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.4}>
                            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#475569",
                              maxWidth: "75%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {stage}
                            </Typography>
                            <Typography sx={{ fontSize: 11, fontWeight: 800,
                              color: STAGE_COLORS[stage] || "#475569" }}>
                              {count}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(count / maxPipelineCount) * 100}
                            sx={{
                              height: 6, borderRadius: 8,
                              bgcolor: `${STAGE_COLORS[stage] || "#64748b"}15`,
                              "& .MuiLinearProgress-bar": {
                                bgcolor: STAGE_COLORS[stage] || "#64748b", borderRadius: 8,
                              },
                            }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {kpis.fill_rate !== undefined && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: "#f0fdf4", borderRadius: "10px",
                    border: "1px solid #bbf7d0", display: "flex",
                    alignItems: "center", justifyContent: "space-between" }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Star sx={{ color: COLORS.amber, fontSize: 16 }} />
                      <Typography sx={{ fontWeight: 700, fontSize: 12, color: "#166534" }}>
                        Overall Fill Rate
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", color: COLORS.green }}>
                      {kpis.fill_rate}%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Recent Candidates */}
            <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", flex: 1 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#f0fdf4",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <People sx={{ color: COLORS.green, fontSize: 17 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: COLORS.navy }}>
                      My Recent Candidates
                    </Typography>
                  </Box>
                  <Button
                    component={Link} to="/resumes" size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                    sx={{ fontSize: 11, textTransform: "none", color: COLORS.blue,
                      "&:hover": { bgcolor: "#eff6ff" }, borderRadius: "8px" }}
                  >
                    View All
                  </Button>
                </Box>

                {myCandidates.length === 0 ? (
                  <Box display="flex" alignItems="center" justifyContent="center" py={3} gap={1}>
                    <People sx={{ color: "#cbd5e1" }} />
                    <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No candidates linked yet</Typography>
                  </Box>
                ) : (
                  <Box>
                    {myCandidates.slice(0, 5).map((c, i) => (
                      <React.Fragment key={c._id || i}>
                        <Box display="flex" alignItems="center" gap={1.5} py={1.2}>
                          <Avatar
                            sx={{ bgcolor: COLORS.indigo, fontWeight: 700, fontSize: 12, width: 34, height: 34 }}
                          >
                            {nameInitials(c.name)}
                          </Avatar>
                          <Box flex={1} minWidth={0}>
                            <Typography sx={{ fontWeight: 600, fontSize: 13, color: COLORS.navy }} noWrap>
                              {c.name}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: "#94a3b8" }} noWrap>
                              {c.linked_job_title || "No job linked"}
                            </Typography>
                          </Box>
                          <Chip
                            label={c.status || "New"}
                            size="small"
                            sx={{
                              fontSize: 10, fontWeight: 700, flexShrink: 0,
                              bgcolor: `${STAGE_COLORS[c.status] || "#64748b"}12`,
                              color: STAGE_COLORS[c.status] || "#475569",
                            }}
                          />
                        </Box>
                        {i < Math.min(myCandidates.length, 5) - 1 && (
                          <Divider sx={{ opacity: 0.5 }} />
                        )}
                      </React.Fragment>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* ── High Priority Jobs ── */}
      {highPriorityJobs.length > 0 && (
        <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#fef9c3",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Star sx={{ color: COLORS.amber, fontSize: 17 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: COLORS.navy }}>
                  High Priority Jobs
                </Typography>
              </Box>
              <Button
                component={Link} to="/jobs" size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                sx={{ fontSize: 11, textTransform: "none", color: COLORS.blue,
                  "&:hover": { bgcolor: "#eff6ff" }, borderRadius: "8px" }}
              >
                View All
              </Button>
            </Box>
            <Paper variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #f1f5f9" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    {["Job ID", "Position", "Client", "Openings", "Priority", "Status"].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#94a3b8",
                        textTransform: "uppercase", letterSpacing: "0.05em", py: 1.2 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {highPriorityJobs.map((job) => (
                    <TableRow
                      key={job._id}
                      sx={{ "&:hover": { bgcolor: "#f8fafc" }, transition: "background 0.15s" }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: COLORS.blue, fontSize: 12 }}>
                        {job.job_id}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 13, color: COLORS.navy }}>
                        {job.title}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "#475569" }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Business sx={{ fontSize: 12, color: "#94a3b8" }} />
                          {job.client_name}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "#475569" }}>{job.openings}</TableCell>
                      <TableCell>
                        <Chip label={job.priority} color={PRIORITY_COLOR[job.priority] || "default"}
                          size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={job.status || "Open"} size="small"
                          sx={{ fontWeight: 700, fontSize: 11, bgcolor: "#f0fdf4", color: "#15803d" }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </CardContent>
        </Card>
      )}

      {/* ── Recruiter Perf + Recent Activity ── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#eff6ff",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp sx={{ color: COLORS.blue, fontSize: 17 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: COLORS.navy }}>
                  Recruiter Performance
                </Typography>
              </Box>

              {recruiterPerf.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" py={4} gap={1}>
                  <People sx={{ color: "#cbd5e1" }} />
                  <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No placement data yet</Typography>
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #f1f5f9" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        {["Recruiter", "Jobs", "Interviews", "Placements", "Revenue", "Rate"].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#94a3b8",
                            textTransform: "uppercase", letterSpacing: "0.05em", py: 1.2 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recruiterPerf.slice(0, 6).map((r, i) => {
                        const avatarColors = [COLORS.indigo, COLORS.blue, COLORS.green, COLORS.amber, "#7e22ce", COLORS.teal];
                        return (
                          <TableRow key={i} sx={{ "&:hover": { bgcolor: "#f8fafc" }, transition: "background 0.15s" }}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1.2}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: 10, fontWeight: 700,
                                  bgcolor: avatarColors[i % avatarColors.length] }}>
                                  {nameInitials(r.name)}
                                </Avatar>
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.navy }}>{r.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontSize: 12, color: "#475569" }}>{r.jobs_posted ?? 0}</TableCell>
                            <TableCell sx={{ fontSize: 12, color: "#475569" }}>{r.interviews ?? 0}</TableCell>
                            <TableCell>
                              <Chip label={r.placements} size="small" color="success"
                                sx={{ fontWeight: 700, fontSize: 10 }} />
                            </TableCell>
                            <TableCell sx={{ fontSize: 12, fontWeight: 600, color: COLORS.navy }}>
                              {fmt(r.revenue)}
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={0.8}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(r.conversion_rate || 0, 100)}
                                  sx={{
                                    width: 50, height: 5, borderRadius: 4,
                                    "& .MuiLinearProgress-bar": {
                                      bgcolor: (r.conversion_rate || 0) >= 30 ? COLORS.green : COLORS.blue,
                                      borderRadius: 4,
                                    },
                                  }}
                                />
                                <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>
                                  {r.conversion_rate ?? 0}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#fff7ed",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AccessTime sx={{ color: COLORS.amber, fontSize: 17 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: COLORS.navy }}>
                  Recent Activity
                </Typography>
              </Box>

              {recentActivity.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" py={4} gap={1}>
                  <AccessTime sx={{ color: "#cbd5e1" }} />
                  <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No recent activity</Typography>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {recentActivity.slice(0, 7).map((a, i) => {
                    const s = ACTIVITY_ICON[a.type] || ACTIVITY_ICON.candidate;
                    return (
                      <Box key={i} display="flex" gap={1.5} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 32, height: 32, borderRadius: "8px",
                            bgcolor: s.bg, border: `1px solid ${s.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, fontSize: 14,
                          }}
                        >
                          {s.emoji}
                        </Box>
                        <Box flex={1} minWidth={0}>
                          <Typography sx={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>
                            {a.message}
                          </Typography>
                          <Typography sx={{ fontSize: 10, color: "#94a3b8", mt: 0.2 }}>
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
        <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#faf5ff",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MonetizationOn sx={{ color: COLORS.indigo, fontSize: 17 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: COLORS.navy }}>
                Client Revenue Overview
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {clientRevenue.map((c, i) => {
                const maxRev = Math.max(...clientRevenue.map((x) => x.revenue), 1);
                const accents = [COLORS.indigo, COLORS.blue, COLORS.green, COLORS.amber, "#7e22ce", COLORS.teal];
                const accent  = accents[i % accents.length];
                return (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Box
                      sx={{
                        p: 2, borderRadius: "12px",
                        border: "1px solid #f1f5f9", bgcolor: "#f8fafc",
                        transition: "box-shadow 0.2s",
                        "&:hover": { boxShadow: "0 4px 16px rgba(15,23,42,0.08)" },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={0.8}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: accent, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.navy }} noWrap>
                          {c.client}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", color: accent }}>
                        {fmt(c.revenue)}
                      </Typography>
                      {c.placements !== undefined && (
                        <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>
                          {c.placements} placement{c.placements !== 1 ? "s" : ""}
                        </Typography>
                      )}
                      <LinearProgress
                        variant="determinate"
                        value={(c.revenue / maxRev) * 100}
                        sx={{
                          mt: 1.2, height: 4, borderRadius: 8,
                          bgcolor: `${accent}15`,
                          "& .MuiLinearProgress-bar": { bgcolor: accent, borderRadius: 8 },
                        }}
                      />
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







