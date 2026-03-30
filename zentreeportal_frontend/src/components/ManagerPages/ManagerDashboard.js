// import React, { useEffect, useState } from "react";
// import {
//   Box, Grid, Card, CardContent, Typography, Chip, CircularProgress, Alert,
//   Avatar, AvatarGroup, LinearProgress, List, ListItem, ListItemAvatar,
//   ListItemText, Divider, Button, AppBar, Toolbar, IconButton, Tooltip
// } from "@mui/material";
// import { Group, Pending, Assignment, PersonAdd, CheckCircle, Schedule, TrendingUp, StarRate, Logout, ManageAccounts } from "@mui/icons-material";
// import { useNavigate } from "react-router-dom";

// const API_URL = "http://localhost:5000/api";

// // ── helper: authenticated fetch ───────────────────────────────────────────────
// const authFetch = async (url, options = {}) => {
//   const token = localStorage.getItem("access_token");
//   const res = await fetch(url, {
//     ...options,
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
//   });
//   if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; }
//   return res;
// };

// const StatCard = ({ title, value, icon, color, sub }) => (
//   <Card>
//     <CardContent sx={{ p: 3 }}>
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start">
//         <Box>
//           <Typography color="text.secondary" fontSize={13} fontWeight={600}>{title}</Typography>
//           <Typography variant="h3" fontWeight={800} mt={0.5} color={color}>{value}</Typography>
//           {sub && <Typography fontSize={12} color="text.secondary" mt={0.5}>{sub}</Typography>}
//         </Box>
//         <Box sx={{ width: 50, height: 50, borderRadius: 3, bgcolor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
//           {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
//         </Box>
//       </Box>
//     </CardContent>
//   </Card>
// );

// const mockApprovals = [
//   { name: "Priya Sharma → Frontend Lead",   type: "Offer Approval", urgent: true  },
//   { name: "New Headcount: Data Team",        type: "Requisition",    urgent: false },
//   { name: "Rahul Verma → Salary Revision",  type: "Compensation",   urgent: true  },
//   { name: "Anjali Nair → Promotion",        type: "Promotion",      urgent: false },
//   { name: "New Intern Batch Q2",            type: "Requisition",    urgent: false },
// ];
// const teamColors = ["#7b1fa2","#0277bd","#2e7d32","#e65100","#c62828","#00838f","#558b2f","#37474f"];

// const ManagerDashboard = () => {
//   const navigate = useNavigate();
//   const user     = JSON.parse(localStorage.getItem("user") || "{}");
//   const [data, setData]       = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError]     = useState("");

//   const handleLogout = async () => {
//     // ── Inline API Call: logout ────────────────────────────────────────────────
//     await authFetch(`${API_URL}/auth/logout`, { method: "POST" }).catch(() => {});
//     // ──────────────────────────────────────────────────────────────────────────
//     localStorage.clear();
//     navigate("/login");
//   };

//   useEffect(() => {
//     (async () => {
//       try {
//         // ── Inline API Call: manager dashboard ─────────────────────────────────
//         const res  = await authFetch(`${API_URL}/user/manager/dashboard`);
//         const json = await res.json();
//         // ──────────────────────────────────────────────────────────────────────
//         if (json.success) setData(json.dashboard);
//         else setError(json.message);
//       } catch { setError("Failed to load dashboard"); }
//       finally   { setLoading(false); }
//     })();
//   }, []);

//   if (loading) return (
//     <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
//       <Box display="flex" justifyContent="center" alignItems="center" mt={12}><CircularProgress size={48} /></Box>
//     </Box>
//   );

//   return (
//     <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>


//       <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
//         <Box mb={4}>
//           <Typography variant="h4" fontWeight={800} color="primary.dark">Manager Portal</Typography>
//           <Typography color="text.secondary">Hello, {user?.first_name}! You have {data?.stats?.pending_approvals || 5} pending approvals today.</Typography>
//         </Box>

//         {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

//         <Grid container spacing={3} mb={4}>
//           <Grid item xs={6} md={3}><StatCard title="Team Members"      value={data?.stats?.team_members || 8}       icon={<Group />}      color="#2e7d32" sub="Direct reports" /></Grid>
//           <Grid item xs={6} md={3}><StatCard title="Pending Approvals" value={data?.stats?.pending_approvals || 5}  icon={<Pending />}    color="#e65100" sub="Needs attention" /></Grid>
//           <Grid item xs={6} md={3}><StatCard title="Open Requisitions" value={data?.stats?.open_requisitions || 3}  icon={<Assignment />} color="#0277bd" sub="Active hiring" /></Grid>
//           <Grid item xs={6} md={3}><StatCard title="Hires This Month"  value={data?.stats?.hires_this_month || 2}   icon={<PersonAdd />}  color="#7b1fa2" sub="Onboarding" /></Grid>
//         </Grid>

//         <Grid container spacing={3}>
//           <Grid item xs={12} md={7}>
//             <Card>
//               <CardContent sx={{ p: 3 }}>
//                 <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//                   <Typography variant="h6" fontWeight={700}>Pending Approvals</Typography>
//                   <Chip label="5 Pending" size="small" color="warning" sx={{ fontWeight: 700 }} />
//                 </Box>
//                 <List disablePadding>
//                   {mockApprovals.map((item, i) => (
//                     <React.Fragment key={i}>
//                       <ListItem sx={{ px: 0, py: 1.5 }}>
//                         <ListItemAvatar>
//                           <Avatar sx={{ bgcolor: item.urgent ? "#c62828" : "#455a64", width: 36, height: 36 }}>
//                             {item.urgent ? <Schedule fontSize="small" /> : <CheckCircle fontSize="small" />}
//                           </Avatar>
//                         </ListItemAvatar>
//                         <ListItemText
//                           primary={<Typography fontWeight={600} fontSize={14}>{item.name}</Typography>}
//                           secondary={<Typography fontSize={12} color="text.secondary">{item.type}</Typography>}
//                         />
//                         <Box display="flex" gap={1}>
//                           {item.urgent && <Chip label="Urgent" size="small" sx={{ bgcolor: "#c6282818", color: "#c62828", fontWeight: 700, fontSize: 11 }} />}
//                           <Button size="small" variant="outlined" sx={{ borderRadius: 2, minWidth: 70, fontSize: 12 }}>Review</Button>
//                         </Box>
//                       </ListItem>
//                       {i < mockApprovals.length - 1 && <Divider />}
//                     </React.Fragment>
//                   ))}
//                 </List>
//               </CardContent>
//             </Card>
//           </Grid>

//           <Grid item xs={12} md={5}>
//             <Card sx={{ mb: 3 }}>
//               <CardContent sx={{ p: 3 }}>
//                 <Typography variant="h6" fontWeight={700} mb={2}>
//                   <Group sx={{ mr: 1, verticalAlign: "middle", color: "#2e7d32" }} />Your Team
//                 </Typography>
//                 <AvatarGroup max={8} sx={{ justifyContent: "flex-start", mb: 2 }}>
//                   {teamColors.map((color, i) => (
//                     <Avatar key={i} sx={{ bgcolor: color, width: 40, height: 40, fontSize: 14, fontWeight: 700 }}>
//                       {String.fromCharCode(65+i)}
//                     </Avatar>
//                   ))}
//                 </AvatarGroup>
//                 <Typography fontSize={13} color="text.secondary">8 direct reports · 3 contractors</Typography>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardContent sx={{ p: 3 }}>
//                 <Typography variant="h6" fontWeight={700} mb={2}>
//                   <TrendingUp sx={{ mr: 1, verticalAlign: "middle", color: "#7b1fa2" }} />Q2 Hiring Goals
//                 </Typography>
//                 {[
//                   { label:"Engineering",  current:3, target:5, color:"#0277bd" },
//                   { label:"Design",       current:1, target:2, color:"#7b1fa2" },
//                   { label:"Data Science", current:2, target:3, color:"#2e7d32" },
//                 ].map(({ label, current, target, color }) => (
//                   <Box key={label} mb={2}>
//                     <Box display="flex" justifyContent="space-between" mb={0.5}>
//                       <Typography fontSize={13} fontWeight={600}>{label}</Typography>
//                       <Typography fontSize={13} color="text.secondary">{current}/{target}</Typography>
//                     </Box>
//                     <LinearProgress variant="determinate" value={(current/target)*100}
//                       sx={{ height: 8, borderRadius: 4, bgcolor: `${color}18`, "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4 } }} />
//                   </Box>
//                 ))}
//                 <Box sx={{ mt: 2, p: 1.5, bgcolor: "#7b1fa208", borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
//                   <StarRate sx={{ color: "#f57f17", fontSize: 20 }} />
//                   <Typography fontSize={13} fontWeight={600} color="#7b1fa2">60% of Q2 goal achieved</Typography>
//                 </Box>
//               </CardContent>
//             </Card>
//           </Grid>
//         </Grid>
//       </Box>
//     </Box>
//   );
// };

// export default ManagerDashboard;






















// import React, { useEffect, useState } from "react";
// import {
//   Box, Grid, Card, CardContent, Typography, Chip, CircularProgress, Alert,
//   List, ListItem, ListItemText, Divider, LinearProgress, Avatar,
// } from "@mui/material";
// import {
//   Work, AttachMoney, Schedule, Person, CheckCircle, TrendingUp,
// } from "@mui/icons-material";
// import { useNavigate } from "react-router-dom";

// const API_URL = "http://localhost:5000/api";

// // ── authenticated fetch ───────────────────────────────────────────────────────
// const authFetch = async (url, options = {}) => {
//   const token = localStorage.getItem("access_token");
//   const res = await fetch(url, {
//     ...options,
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//       ...options.headers,
//     },
//   });
//   if (res.status === 401) {
//     localStorage.clear();
//     window.location.href = "/login";
//   }
//   return res;
// };

// // ── helpers ───────────────────────────────────────────────────────────────────
// const fmtCurrency = (v = 0) => {
//   if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
//   if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
//   if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
//   return `₹${v.toLocaleString()}`;
// };

// const priorityColor = (p) =>
//   p === "Critical" ? "#c62828" : p === "High" ? "#e65100" : "#0277bd";

// const COLORS = ["#7b1fa2","#0277bd","#2e7d32","#e65100","#c62828","#00838f","#558b2f","#37474f"];
// const avatarColor = (i) => COLORS[i % COLORS.length];

// // ── stat card ─────────────────────────────────────────────────────────────────
// const StatCard = ({ title, value, icon, color, sub }) => (
//   <Card>
//     <CardContent sx={{ p: 3 }}>
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start">
//         <Box>
//           <Typography color="text.secondary" fontSize={13} fontWeight={600}>{title}</Typography>
//           <Typography variant="h3" fontWeight={800} mt={0.5} color={color}>{value ?? "—"}</Typography>
//           {sub && <Typography fontSize={12} color="text.secondary" mt={0.5}>{sub}</Typography>}
//         </Box>
//         <Box sx={{ width: 50, height: 50, borderRadius: 3, bgcolor: `${color}18`,
//                    display: "flex", alignItems: "center", justifyContent: "center" }}>
//           {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
//         </Box>
//       </Box>
//     </CardContent>
//   </Card>
// );

// // ── component ─────────────────────────────────────────────────────────────────
// const ManagerDashboard = () => {
//   const navigate = useNavigate();
//   const user = JSON.parse(localStorage.getItem("user") || "{}");

//   const [kpis, setKpis]                       = useState(null);
//   const [stageCounts, setStageCounts]          = useState([]);
//   const [highPriorityJobs, setHighPriorityJobs] = useState([]);
//   const [recruiterPerf, setRecruiterPerf]      = useState([]);
//   const [clientRevenue, setClientRevenue]      = useState([]);
//   const [recentActivity, setRecentActivity]    = useState([]);
//   const [loading, setLoading]                  = useState(true);
//   const [error, setError]                      = useState("");

//   // ── fetch from /api/dashboard/ ─────────────────────────────────────────────
//   useEffect(() => {
//     (async () => {
//       try {
//         const res  = await authFetch(`${API_URL}/dashboard/`);
//         const json = await res.json();

//         if (!json.success) {
//           setError(json.message || "Failed to load dashboard");
//           return;
//         }

//         const d = json.dashboard;
//         setKpis(d.kpis                  ?? {});
//         setStageCounts(d.stage_counts          ?? []);
//         setHighPriorityJobs(d.high_priority_jobs   ?? []);
//         setRecruiterPerf(d.recruiter_perf       ?? []);
//         setClientRevenue(d.client_revenue       ?? []);
//         setRecentActivity(d.recent_activity      ?? []);
//       } catch {
//         setError("Network error — could not load dashboard.");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   // ── derived ────────────────────────────────────────────────────────────────
//   const fillRateColor =
//     (kpis?.fill_rate ?? 0) >= 70 ? "#2e7d32" :
//     (kpis?.fill_rate ?? 0) >= 40 ? "#e65100" : "#c62828";

//   const maxPlacements = Math.max(1, ...recruiterPerf.map((r) => r.placements));

//   if (loading)
//     return (
//       <Box sx={{ bgcolor: "background.default", minHeight: "100vh",
//                  display: "flex", alignItems: "center", justifyContent: "center" }}>
//         <CircularProgress size={48} />
//       </Box>
//     );

//   return (
//     <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
//       <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>

//         {/* ── Header ── */}
//         <Box mb={4}>
//           <Typography variant="h4" fontWeight={800} color="primary.dark">Manager Portal</Typography>
//           <Typography color="text.secondary">
//             Hello, {user?.first_name}! Here's your live recruitment overview.
//           </Typography>
//         </Box>

//         {error && (
//           <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>
//             {error}
//           </Alert>
//         )}

//         {/* ── Stat cards ── */}
//         <Grid container spacing={3} mb={4}>
//           <Grid item xs={6} md={3}>
//             <StatCard
//               title="Open Jobs"
//               value={kpis?.open_jobs}
//               icon={<Work />}
//               color="#0277bd"
//               sub={`${kpis?.total_jobs ?? 0} total jobs`}
//             />
//           </Grid>
//           <Grid item xs={6} md={3}>
//             <StatCard
//               title="Placements This Month"
//               value={kpis?.placements_mtd}
//               icon={<CheckCircle />}
//               color="#2e7d32"
//               sub={`${kpis?.placements_total ?? 0} total all-time`}
//             />
//           </Grid>
//           <Grid item xs={6} md={3}>
//             <StatCard
//               title="Revenue (MTD)"
//               value={fmtCurrency(kpis?.revenue_mtd)}
//               icon={<AttachMoney />}
//               color="#7b1fa2"
//               sub="Billing this month"
//             />
//           </Grid>
//           <Grid item xs={6} md={3}>
//             <StatCard
//               title="Avg. Days to Fill"
//               value={kpis?.avg_days_to_fill != null ? `${kpis.avg_days_to_fill}d` : "—"}
//               icon={<Schedule />}
//               color={fillRateColor}
//               sub={`Fill rate: ${kpis?.fill_rate ?? 0}%`}
//             />
//           </Grid>
//         </Grid>

//         {/* ── Row 2: Pipeline + High Priority Jobs ── */}
//         <Grid container spacing={3} mb={3}>

//           {/* Candidate Pipeline */}
//           <Grid item xs={12} md={5}>
//             <Card sx={{ height: "100%" }}>
//               <CardContent sx={{ p: 3 }}>
//                 <Typography variant="h6" fontWeight={700} mb={2}>
//                   Candidate Pipeline
//                   <Typography component="span" fontSize={13} color="text.secondary" ml={1}>
//                     (active stages)
//                   </Typography>
//                 </Typography>

//                 {stageCounts.length === 0 ? (
//                   <Typography fontSize={13} color="text.secondary">
//                     No active pipeline data.
//                   </Typography>
//                 ) : (() => {
//                   const maxCount = Math.max(1, ...stageCounts.map((s) => s.count));
//                   return stageCounts.map((item, i) => (
//                     <Box key={item.stage} mb={2}>
//                       <Box display="flex" justifyContent="space-between" mb={0.5}>
//                         <Typography fontSize={13} fontWeight={600}>{item.stage}</Typography>
//                         <Typography fontSize={13} color="text.secondary">{item.count}</Typography>
//                       </Box>
//                       <LinearProgress
//                         variant="determinate"
//                         value={(item.count / maxCount) * 100}
//                         sx={{
//                           height: 8, borderRadius: 4,
//                           bgcolor: `${avatarColor(i)}22`,
//                           "& .MuiLinearProgress-bar": { bgcolor: avatarColor(i), borderRadius: 4 },
//                         }}
//                       />
//                     </Box>
//                   ));
//                 })()}
//               </CardContent>
//             </Card>
//           </Grid>

//           {/* High Priority Open Jobs */}
//           <Grid item xs={12} md={7}>
//             <Card sx={{ height: "100%" }}>
//               <CardContent sx={{ p: 3 }}>
//                 <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//                   <Typography variant="h6" fontWeight={700}>High Priority Open Jobs</Typography>
//                   <Chip
//                     label={`${highPriorityJobs.length} Jobs`}
//                     size="small"
//                     color={highPriorityJobs.length > 0 ? "error" : "default"}
//                     sx={{ fontWeight: 700 }}
//                   />
//                 </Box>

//                 {highPriorityJobs.length === 0 ? (
//                   <Box py={3} textAlign="center">
//                     <CheckCircle sx={{ fontSize: 40, color: "#2e7d32", mb: 1 }} />
//                     <Typography color="text.secondary" fontSize={14}>
//                       No critical or high-priority jobs open.
//                     </Typography>
//                   </Box>
//                 ) : (
//                   <List disablePadding>
//                     {highPriorityJobs.map((job, i) => (
//                       <React.Fragment key={job._id ?? i}>
//                         <ListItem sx={{ px: 0, py: 1.2 }}>
//                           <Box sx={{
//                             width: 8, height: 8, borderRadius: "50%",
//                             bgcolor: priorityColor(job.priority),
//                             mr: 1.5, flexShrink: 0,
//                           }} />
//                           <ListItemText
//                             primary={
//                               <Typography fontWeight={600} fontSize={14}>{job.title}</Typography>
//                             }
//                             secondary={
//                               <Typography fontSize={12} color="text.secondary">
//                                 {job.client_name}
//                                 {job.location ? ` · ${job.location}` : ""}
//                                 {` · ${job.openings} opening${job.openings !== 1 ? "s" : ""}`}
//                               </Typography>
//                             }
//                           />
//                           <Chip
//                             label={job.priority}
//                             size="small"
//                             sx={{
//                               bgcolor: `${priorityColor(job.priority)}18`,
//                               color:   priorityColor(job.priority),
//                               fontWeight: 700, fontSize: 11, ml: 1,
//                             }}
//                           />
//                         </ListItem>
//                         {i < highPriorityJobs.length - 1 && <Divider />}
//                       </React.Fragment>
//                     ))}
//                   </List>
//                 )}
//               </CardContent>
//             </Card>
//           </Grid>
//         </Grid>

//         {/* ── Row 3: Recruiter Perf + Client Revenue ── */}
//         <Grid container spacing={3} mb={3}>

//           {/* Recruiter Performance */}
//           <Grid item xs={12} md={7}>
//             <Card>
//               <CardContent sx={{ p: 3 }}>
//                 <Typography variant="h6" fontWeight={700} mb={2}>
//                   <Person sx={{ mr: 1, verticalAlign: "middle", color: "#0277bd" }} />
//                   Recruiter Performance
//                 </Typography>

//                 {recruiterPerf.length === 0 ? (
//                   <Typography fontSize={13} color="text.secondary">No recruiter data yet.</Typography>
//                 ) : (
//                   <>
//                     {/* Header */}
//                     <Box
//                       display="grid"
//                       gridTemplateColumns="2fr 1fr 1fr 1.5fr 1.2fr"
//                       sx={{ px: 1, mb: 1 }}
//                     >
//                       {["Recruiter", "Jobs", "Interviews", "Placements", "Revenue"].map((h) => (
//                         <Typography key={h} fontSize={11} fontWeight={700}
//                                     color="text.secondary" textTransform="uppercase">
//                           {h}
//                         </Typography>
//                       ))}
//                     </Box>
//                     <Divider sx={{ mb: 0.5 }} />

//                     {recruiterPerf.map((r, i) => (
//                       <Box
//                         key={r.name ?? i}
//                         display="grid"
//                         gridTemplateColumns="2fr 1fr 1fr 1.5fr 1.2fr"
//                         alignItems="center"
//                         sx={{ py: 1, px: 1, borderBottom: "1px solid #f0f0f0" }}
//                       >
//                         {/* Name */}
//                         <Box display="flex" alignItems="center" gap={1}>
//                           <Avatar sx={{ bgcolor: avatarColor(i), width: 28, height: 28, fontSize: 11 }}>
//                             {(r.name || "?")[0].toUpperCase()}
//                           </Avatar>
//                           <Typography fontSize={13} fontWeight={600}
//                             sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                             {r.name}
//                           </Typography>
//                         </Box>
//                         <Typography fontSize={13} color="text.secondary">{r.jobs_posted}</Typography>
//                         <Typography fontSize={13} color="text.secondary">{r.interviews}</Typography>
//                         {/* Placements + mini bar */}
//                         <Box>
//                           <Typography fontSize={13} fontWeight={700} color="#2e7d32">
//                             {r.placements}
//                           </Typography>
//                           <LinearProgress
//                             variant="determinate"
//                             value={(r.placements / maxPlacements) * 100}
//                             sx={{
//                               height: 4, borderRadius: 2, mt: 0.3,
//                               bgcolor: "#2e7d3222",
//                               "& .MuiLinearProgress-bar": { bgcolor: "#2e7d32" },
//                             }}
//                           />
//                         </Box>
//                         <Typography fontSize={13} color="#7b1fa2" fontWeight={600}>
//                           {fmtCurrency(r.revenue)}
//                         </Typography>
//                       </Box>
//                     ))}
//                   </>
//                 )}
//               </CardContent>
//             </Card>
//           </Grid>

//           {/* Top Clients by Revenue */}
//           <Grid item xs={12} md={5}>
//             <Card>
//               <CardContent sx={{ p: 3 }}>
//                 <Typography variant="h6" fontWeight={700} mb={2}>
//                   <TrendingUp sx={{ mr: 1, verticalAlign: "middle", color: "#7b1fa2" }} />
//                   Top Clients by Revenue
//                 </Typography>

//                 {clientRevenue.length === 0 ? (
//                   <Typography fontSize={13} color="text.secondary">
//                     No client revenue data yet.
//                   </Typography>
//                 ) : (() => {
//                   const maxRev = Math.max(1, ...clientRevenue.map((c) => c.revenue));
//                   return clientRevenue.map((c, i) => (
//                     <Box key={c.client ?? i} mb={2}>
//                       <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={0.5}>
//                         <Typography fontSize={13} fontWeight={600}
//                           sx={{ overflow: "hidden", textOverflow: "ellipsis",
//                                 whiteSpace: "nowrap", maxWidth: "58%" }}>
//                           {c.client}
//                         </Typography>
//                         <Box textAlign="right">
//                           <Typography fontSize={13} fontWeight={700} color="#7b1fa2">
//                             {fmtCurrency(c.revenue)}
//                           </Typography>
//                           <Typography fontSize={11} color="text.secondary">
//                             {c.placements} placement{c.placements !== 1 ? "s" : ""}
//                           </Typography>
//                         </Box>
//                       </Box>
//                       <LinearProgress
//                         variant="determinate"
//                         value={(c.revenue / maxRev) * 100}
//                         sx={{
//                           height: 7, borderRadius: 4,
//                           bgcolor: `${avatarColor(i)}22`,
//                           "& .MuiLinearProgress-bar": { bgcolor: avatarColor(i), borderRadius: 4 },
//                         }}
//                       />
//                     </Box>
//                   ));
//                 })()}
//               </CardContent>
//             </Card>
//           </Grid>
//         </Grid>

//         {/* ── Row 4: Recent Activity ── */}
//         <Grid container spacing={3}>
//           <Grid item xs={12}>
//             <Card>
//               <CardContent sx={{ p: 3 }}>
//                 <Typography variant="h6" fontWeight={700} mb={2}>Recent Activity</Typography>

//                 {recentActivity.length === 0 ? (
//                   <Typography fontSize={13} color="text.secondary">No recent activity.</Typography>
//                 ) : (
//                   <List disablePadding>
//                     {recentActivity.map((item, i) => (
//                       <React.Fragment key={i}>
//                         <ListItem sx={{ px: 0, py: 1 }}>
//                           <Box sx={{
//                             width: 32, height: 32, borderRadius: "50%", mr: 2,
//                             bgcolor: item.type === "placement" ? "#2e7d3218" : "#0277bd18",
//                             display: "flex", alignItems: "center", justifyContent: "center",
//                             flexShrink: 0,
//                           }}>
//                             {item.type === "placement"
//                               ? <CheckCircle sx={{ fontSize: 16, color: "#2e7d32" }} />
//                               : <Person      sx={{ fontSize: 16, color: "#0277bd" }} />}
//                           </Box>
//                           <ListItemText
//                             primary={
//                               <Typography fontSize={14} fontWeight={500}>{item.message}</Typography>
//                             }
//                             secondary={
//                               <Typography fontSize={12} color="text.secondary">
//                                 {item.time
//                                   ? new Date(item.time).toLocaleString("en-IN", {
//                                       day: "numeric", month: "short",
//                                       hour: "2-digit", minute: "2-digit",
//                                     })
//                                   : ""}
//                               </Typography>
//                             }
//                           />
//                           <Chip
//                             label={item.type === "placement" ? "Placement" : "Candidate"}
//                             size="small"
//                             sx={{
//                               bgcolor: item.type === "placement" ? "#2e7d3218" : "#0277bd18",
//                               color:   item.type === "placement" ? "#2e7d32"   : "#0277bd",
//                               fontWeight: 700, fontSize: 11,
//                             }}
//                           />
//                         </ListItem>
//                         {i < recentActivity.length - 1 && <Divider />}
//                       </React.Fragment>
//                     ))}
//                   </List>
//                 )}
//               </CardContent>
//             </Card>
//           </Grid>
//         </Grid>

//       </Box>
//     </Box>
//   );
// };

// export default ManagerDashboard;











// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// const API_URL = "http://localhost:5000/api";

// // ── auth fetch ────────────────────────────────────────────────────────────────
// const authFetch = async (url, opts = {}) => {
//   const token = localStorage.getItem("access_token");
//   const res = await fetch(url, {
//     ...opts,
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
//   });
//   if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; }
//   return res;
// };

// // ── helpers ───────────────────────────────────────────────────────────────────
// const fmtCurrency = (v = 0) => {
//   if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
//   if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
//   if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
//   return `₹${v.toLocaleString()}`;
// };
// const fmtDate = (iso) => {
//   if (!iso) return "";
//   return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
// };
// const initials = (name = "") => name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
// const PALETTE  = ["#4f46e5","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#0284c7","#65a30d"];
// const aColor   = (i)  => PALETTE[i % PALETTE.length];

// const PRIORITY_META = {
//   Critical: { bg: "#fef2f2", text: "#b91c1c", dot: "#ef4444" },
//   High:     { bg: "#fff7ed", text: "#c2410c", dot: "#f97316" },
//   Medium:   { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
// };

// // ── SVG icons ─────────────────────────────────────────────────────────────────
// const Icon = ({ d, size = 20, stroke = "currentColor", fill = "none", sw = 2 }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
//     <path d={d} />
//   </svg>
// );

// const Icons = {
//   jobs:       <Icon d="M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6h.01M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />,
//   placement:  <Icon d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
//   revenue:    <Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
//   clock:      <Icon d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
//   user:       <Icon d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />,
//   trend:      <Icon d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
//   pipeline:   <Icon d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 7h10" />,
//   alert:      <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
//   logout:     <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />,
//   activity:   <Icon d="M13 10V3L4 14h7v7l9-11h-7z" />,
// };

// // ── Stat Card ─────────────────────────────────────────────────────────────────
// const KPICard = ({ label, value, sub, icon, accent }) => (
//   <div className="kpi-card" style={{ "--accent": accent }}>
//     <div className="kpi-top">
//       <span className="kpi-label">{label}</span>
//       <div className="kpi-icon-wrap">{icon}</div>
//     </div>
//     <div className="kpi-value">{value ?? "—"}</div>
//     {sub && <div className="kpi-sub">{sub}</div>}
//     <div className="kpi-bar" />
//   </div>
// );

// // ── Empty state ───────────────────────────────────────────────────────────────
// const Empty = ({ msg }) => (
//   <div className="empty-state">
//     <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
//       <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
//     </svg>
//     <p>{msg}</p>
//   </div>
// );

// // ── Section wrapper ───────────────────────────────────────────────────────────
// const Section = ({ title, badge, children, className = "" }) => (
//   <div className={`section-card ${className}`}>
//     <div className="section-header">
//       <h3 className="section-title">{title}</h3>
//       {badge != null && <span className="badge">{badge}</span>}
//     </div>
//     {children}
//   </div>
// );

// // ── Main Dashboard ────────────────────────────────────────────────────────────
// const ManagerDashboard = () => {
//   const navigate = useNavigate();
//   const user = JSON.parse(localStorage.getItem("user") || "{}");

//   const [kpis, setKpis]                     = useState(null);
//   const [stageCounts, setStageCounts]        = useState([]);
//   const [highJobs, setHighJobs]              = useState([]);
//   const [recruiterPerf, setRecruiterPerf]    = useState([]);
//   const [clientRevenue, setClientRevenue]    = useState([]);
//   const [recentActivity, setRecentActivity]  = useState([]);
//   const [loading, setLoading]                = useState(true);
//   const [error, setError]                    = useState("");

//   useEffect(() => {
//     (async () => {
//       try {
//         const res  = await authFetch(`${API_URL}/dashboard/`);
//         const json = await res.json();
//         if (!json.success) { setError(json.message || "Failed to load"); return; }
//         const d = json.dashboard;
//         setKpis(d.kpis               ?? {});
//         setStageCounts(d.stage_counts       ?? []);
//         setHighJobs(d.high_priority_jobs  ?? []);
//         setRecruiterPerf(d.recruiter_perf     ?? []);
//         setClientRevenue(d.client_revenue     ?? []);
//         setRecentActivity(d.recent_activity    ?? []);
//       } catch { setError("Network error — could not load dashboard."); }
//       finally  { setLoading(false); }
//     })();
//   }, []);

//   const handleLogout = async () => {
//     await authFetch(`${API_URL}/auth/logout`, { method: "POST" }).catch(() => {});
//     localStorage.clear();
//     navigate("/login");
//   };

//   const maxPlacements = Math.max(1, ...recruiterPerf.map(r => r.placements));
//   const maxRevenue    = Math.max(1, ...clientRevenue.map(c => c.revenue));
//   const maxStage      = Math.max(1, ...stageCounts.map(s => s.count));

//   const fillColor = (kpis?.fill_rate ?? 0) >= 70 ? "#059669"
//                   : (kpis?.fill_rate ?? 0) >= 40 ? "#d97706" : "#dc2626";

//   if (loading) return (
//     <div className="dash-loading">
//       <div className="spinner" />
//       <p>Loading dashboard…</p>
//     </div>
//   );

//   return (
//     <div className="dash-root">

//       {/* ── Top Nav ── */}
//       <header className="dash-nav">
//         <div className="nav-brand">
//           <div className="nav-logo">
//             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
//               <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
//               <circle cx="9" cy="7" r="4"/>
//               <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
//             </svg>
//           </div>
//           <div>
//             <span className="nav-appname">ZentreeLabs</span>
//             <span className="nav-role">Manager Portal</span>
//           </div>
//         </div>

//         <nav className="nav-links">
//           <a className="nav-link active" href="#">Dashboard</a>
//           <a className="nav-link" href="#">Jobs</a>
//           <a className="nav-link" href="#">Candidates</a>
//           <a className="nav-link" href="#">Reports</a>
//         </nav>

//         <div className="nav-user">
//           <div className="user-avatar">{initials(`${user.first_name ?? ""} ${user.last_name ?? ""}`) || "M"}</div>
//           <div className="user-info">
//             <span className="user-name">{user.first_name} {user.last_name}</span>
//             <span className="user-role-tag">Manager</span>
//           </div>
//           <button className="logout-btn" onClick={handleLogout} title="Logout">
//             {Icons.logout}
//           </button>
//         </div>
//       </header>

//       {/* ── Page body ── */}
//       <main className="dash-main">

//         {/* Page title row */}
//         <div className="page-title-row">
//           <div>
//             <h1 className="page-title">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user.first_name}! 👋</h1>
//             <p className="page-sub">Here's what's happening across your recruitment pipeline today.</p>
//           </div>
//           <div className="page-date">
//             {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
//           </div>
//         </div>

//         {error && (
//           <div className="error-banner">
//             {Icons.alert}
//             <span>{error}</span>
//             <button onClick={() => setError("")}>✕</button>
//           </div>
//         )}

//         {/* ── KPI cards ── */}
//         <div className="kpi-grid">
//           <KPICard label="Open Jobs"           value={kpis?.open_jobs}         sub={`of ${kpis?.total_jobs ?? 0} total`}               icon={Icons.jobs}      accent="#4f46e5" />
//           <KPICard label="Placements (MTD)"    value={kpis?.placements_mtd}    sub={`${kpis?.placements_total ?? 0} all-time`}          icon={Icons.placement} accent="#059669" />
//           <KPICard label="Revenue (MTD)"       value={fmtCurrency(kpis?.revenue_mtd)} sub="Billing this month"                         icon={Icons.revenue}   accent="#0891b2" />
//           <KPICard label="Avg. Days to Fill"   value={kpis?.avg_days_to_fill != null ? `${kpis.avg_days_to_fill}d` : "—"}
//                                                sub={<span style={{ color: fillColor }}>Fill rate: {kpis?.fill_rate ?? 0}%</span>}      icon={Icons.clock}     accent={fillColor} />
//           <KPICard label="Active Candidates"   value={kpis?.total_candidates}  sub="In resume bank"                                    icon={Icons.user}      accent="#7c3aed" />
//           <KPICard label="Active Clients"      value={kpis?.active_clients}    sub={`of ${kpis?.total_clients ?? 0} total`}            icon={Icons.trend}     accent="#d97706" />
//         </div>

//         {/* ── Row 2: Pipeline + High Priority Jobs ── */}
//         <div className="two-col">

//           {/* Pipeline */}
//           <Section title="Candidate Pipeline" badge={stageCounts.reduce((s, x) => s + x.count, 0)}>
//             {stageCounts.length === 0 ? <Empty msg="No active pipeline data." /> : (
//               <div className="pipeline-list">
//                 {stageCounts.map((item, i) => (
//                   <div className="pipeline-row" key={item.stage}>
//                     <div className="pipeline-label">
//                       <span className="stage-dot" style={{ background: aColor(i) }} />
//                       <span className="stage-name">{item.stage}</span>
//                     </div>
//                     <div className="pipeline-track">
//                       <div
//                         className="pipeline-fill"
//                         style={{ width: `${(item.count / maxStage) * 100}%`, background: aColor(i) }}
//                       />
//                     </div>
//                     <span className="stage-count">{item.count}</span>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </Section>

//           {/* High Priority Jobs */}
//           <Section title="High Priority Jobs" badge={`${highJobs.length} open`}>
//             {highJobs.length === 0 ? (
//               <Empty msg="No critical or high-priority jobs open." />
//             ) : (
//               <div className="jobs-list">
//                 {highJobs.map((job, i) => {
//                   const meta = PRIORITY_META[job.priority] ?? PRIORITY_META.Medium;
//                   return (
//                     <div className="job-row" key={job._id ?? i}>
//                       <div className="job-main">
//                         <span className="job-title">{job.title}</span>
//                         <span className="job-meta">{job.client_name}{job.location ? ` · ${job.location}` : ""}</span>
//                       </div>
//                       <div className="job-right">
//                         <span className="openings-badge">{job.openings} open</span>
//                         <span className="priority-pill" style={{ background: meta.bg, color: meta.text }}>
//                           <span className="priority-dot" style={{ background: meta.dot }} />
//                           {job.priority}
//                         </span>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </Section>
//         </div>

//         {/* ── Row 3: Recruiter Performance ── */}
//         <Section title="Recruiter Performance" className="full-width">
//           {recruiterPerf.length === 0 ? <Empty msg="No recruiter data yet." /> : (
//             <div className="perf-table-wrap">
//               <table className="perf-table">
//                 <thead>
//                   <tr>
//                     <th>Recruiter</th>
//                     <th>Jobs Posted</th>
//                     <th>Interviews</th>
//                     <th>Offers</th>
//                     <th>Placements</th>
//                     <th>Conversion</th>
//                     <th>Revenue</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {recruiterPerf.map((r, i) => (
//                     <tr key={r.name ?? i} className="perf-row">
//                       <td>
//                         <div className="recruiter-cell">
//                           <div className="rec-avatar" style={{ background: aColor(i) }}>
//                             {(r.name || "?")[0].toUpperCase()}
//                           </div>
//                           <span className="rec-name">{r.name}</span>
//                           {i === 0 && <span className="top-badge">TOP</span>}
//                         </div>
//                       </td>
//                       <td><span className="num-cell">{r.jobs_posted}</span></td>
//                       <td><span className="num-cell">{r.interviews}</span></td>
//                       <td><span className="num-cell">{r.offers}</span></td>
//                       <td>
//                         <div className="placement-cell">
//                           <span className="placement-num">{r.placements}</span>
//                           <div className="micro-bar-track">
//                             <div className="micro-bar-fill" style={{
//                               width: `${(r.placements / maxPlacements) * 100}%`,
//                               background: aColor(i),
//                             }} />
//                           </div>
//                         </div>
//                       </td>
//                       <td>
//                         <span className="conversion-pill" style={{
//                           background: r.conversion_rate >= 50 ? "#f0fdf4" : r.conversion_rate >= 25 ? "#fff7ed" : "#fef2f2",
//                           color:      r.conversion_rate >= 50 ? "#15803d" : r.conversion_rate >= 25 ? "#c2410c" : "#b91c1c",
//                         }}>
//                           {r.conversion_rate}%
//                         </span>
//                       </td>
//                       <td><span className="revenue-cell">{fmtCurrency(r.revenue)}</span></td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </Section>

//         {/* ── Row 4: Client Revenue + Recent Activity ── */}
//         <div className="two-col">

//           {/* Client Revenue */}
//           <Section title="Top Clients by Revenue">
//             {clientRevenue.length === 0 ? <Empty msg="No client revenue data yet." /> : (
//               <div className="client-list">
//                 {clientRevenue.map((c, i) => (
//                   <div className="client-row" key={c.client ?? i}>
//                     <div className="client-rank">#{i + 1}</div>
//                     <div className="client-info">
//                       <div className="client-top-row">
//                         <span className="client-name">{c.client}</span>
//                         <span className="client-revenue">{fmtCurrency(c.revenue)}</span>
//                       </div>
//                       <div className="client-bar-track">
//                         <div className="client-bar-fill" style={{
//                           width: `${(c.revenue / maxRevenue) * 100}%`,
//                           background: aColor(i),
//                         }} />
//                       </div>
//                       <span className="client-placements">{c.placements} placement{c.placements !== 1 ? "s" : ""}</span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </Section>

//           {/* Recent Activity */}
//           <Section title="Recent Activity" badge={recentActivity.length}>
//             {recentActivity.length === 0 ? <Empty msg="No recent activity." /> : (
//               <div className="activity-list">
//                 {recentActivity.map((item, i) => (
//                   <div className="activity-row" key={i}>
//                     <div className="activity-icon-wrap" style={{
//                       background: item.type === "placement" ? "#f0fdf4" : "#eff6ff",
//                       color:      item.type === "placement" ? "#059669"  : "#4f46e5",
//                     }}>
//                       {item.type === "placement" ? Icons.placement : Icons.user}
//                     </div>
//                     <div className="activity-content">
//                       <p className="activity-msg">{item.message}</p>
//                       <span className="activity-time">{fmtDate(item.time)}</span>
//                     </div>
//                     <span className="activity-type-badge" style={{
//                       background: item.type === "placement" ? "#f0fdf4" : "#eff6ff",
//                       color:      item.type === "placement" ? "#15803d"  : "#4338ca",
//                     }}>
//                       {item.type === "placement" ? "Placed" : "New"}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </Section>
//         </div>

//       </main>

//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

//         *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//         .dash-root {
//           min-height: 100vh;
//           background: #f8fafc;
//           font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif;
//           color: #0f172a;
//         }

//         /* ── Nav ── */
//         .dash-nav {
//           position: sticky; top: 0; z-index: 100;
//           display: flex; align-items: center; gap: 24px;
//           padding: 0 32px;
//           height: 64px;
//           background: #ffffff;
//           border-bottom: 1px solid #e2e8f0;
//           box-shadow: 0 1px 3px rgba(0,0,0,0.04);
//         }

//         .nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }

//         .nav-logo {
//           width: 40px; height: 40px;
//           background: linear-gradient(135deg, #1e3a5f, #2563eb);
//           border-radius: 10px;
//           display: flex; align-items: center; justify-content: center;
//           color: #fff; flex-shrink: 0;
//         }

//         .nav-appname {
//           display: block; font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.1;
//         }
//         .nav-role { display: block; font-size: 11px; color: #64748b; font-weight: 500; }

//         .nav-links { display: flex; align-items: center; gap: 4px; margin-left: 16px; flex: 1; }

//         .nav-link {
//           padding: 6px 14px; border-radius: 8px;
//           font-size: 13.5px; font-weight: 500; color: #64748b;
//           text-decoration: none; transition: all 0.15s;
//         }
//         .nav-link:hover { background: #f1f5f9; color: #0f172a; }
//         .nav-link.active { background: #eff6ff; color: #2563eb; font-weight: 600; }

//         .nav-user { display: flex; align-items: center; gap: 10px; margin-left: auto; }

//         .user-avatar {
//           width: 36px; height: 36px; border-radius: 50%;
//           background: linear-gradient(135deg, #4f46e5, #7c3aed);
//           color: #fff; font-size: 13px; font-weight: 700;
//           display: flex; align-items: center; justify-content: center;
//           flex-shrink: 0;
//         }

//         .user-info { display: flex; flex-direction: column; line-height: 1.15; }
//         .user-name { font-size: 13px; font-weight: 600; color: #0f172a; }
//         .user-role-tag { font-size: 11px; color: #64748b; }

//         .logout-btn {
//           background: none; border: 1px solid #e2e8f0; border-radius: 8px;
//           padding: 6px; cursor: pointer; color: #64748b;
//           display: flex; align-items: center; justify-content: center;
//           transition: all 0.15s; margin-left: 4px;
//         }
//         .logout-btn:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }

//         /* ── Main ── */
//         .dash-main { max-width: 1380px; margin: 0 auto; padding: 28px 32px 48px; }

//         .page-title-row {
//           display: flex; align-items: flex-start; justify-content: space-between;
//           margin-bottom: 28px;
//         }
//         .page-title { font-size: 24px; font-weight: 800; color: #0f172a; }
//         .page-sub   { font-size: 14px; color: #64748b; margin-top: 3px; }
//         .page-date  { font-size: 13px; color: #94a3b8; font-weight: 500; white-space: nowrap; padding-top: 4px; }

//         /* ── Error banner ── */
//         .error-banner {
//           display: flex; align-items: center; gap: 10px;
//           background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px;
//           padding: 12px 16px; margin-bottom: 20px;
//           color: #b91c1c; font-size: 14px;
//         }
//         .error-banner button {
//           margin-left: auto; background: none; border: none;
//           color: #b91c1c; cursor: pointer; font-size: 16px;
//         }

//         /* ── KPI grid ── */
//         .kpi-grid {
//           display: grid;
//           grid-template-columns: repeat(6, 1fr);
//           gap: 16px;
//           margin-bottom: 24px;
//         }

//         @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
//         @media (max-width: 700px)  { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

//         .kpi-card {
//           background: #fff;
//           border: 1px solid #f1f5f9;
//           border-radius: 16px;
//           padding: 20px;
//           position: relative;
//           overflow: hidden;
//           transition: transform 0.15s, box-shadow 0.15s;
//         }
//         .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); }

//         .kpi-bar {
//           position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
//           background: var(--accent);
//           border-radius: 0 0 16px 16px;
//           opacity: 0.7;
//         }

//         .kpi-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }

//         .kpi-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }

//         .kpi-icon-wrap {
//           width: 36px; height: 36px; border-radius: 10px;
//           background: color-mix(in srgb, var(--accent) 12%, white);
//           color: var(--accent);
//           display: flex; align-items: center; justify-content: center;
//           flex-shrink: 0;
//         }

//         .kpi-value { font-size: 30px; font-weight: 800; color: #0f172a; line-height: 1; margin-bottom: 6px; }

//         .kpi-sub { font-size: 12px; color: #94a3b8; }

//         /* ── Two-col layout ── */
//         .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
//         @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }

//         /* ── Section card ── */
//         .section-card {
//           background: #fff;
//           border: 1px solid #f1f5f9;
//           border-radius: 16px;
//           padding: 24px;
//         }
//         .section-card.full-width { margin-bottom: 24px; }

//         .section-header {
//           display: flex; justify-content: space-between; align-items: center;
//           margin-bottom: 20px; padding-bottom: 14px;
//           border-bottom: 1px solid #f1f5f9;
//         }
//         .section-title { font-size: 15px; font-weight: 700; color: #0f172a; }

//         .badge {
//           background: #f1f5f9; color: #475569;
//           font-size: 11px; font-weight: 700;
//           padding: 3px 10px; border-radius: 20px;
//         }

//         /* ── Empty state ── */
//         .empty-state { text-align: center; padding: 32px 16px; }
//         .empty-state p { font-size: 13px; color: #94a3b8; margin-top: 8px; }

//         /* ── Pipeline ── */
//         .pipeline-list { display: flex; flex-direction: column; gap: 14px; }

//         .pipeline-row { display: flex; align-items: center; gap: 12px; }

//         .pipeline-label { display: flex; align-items: center; gap: 8px; width: 140px; flex-shrink: 0; }

//         .stage-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

//         .stage-name { font-size: 13px; font-weight: 500; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

//         .pipeline-track {
//           flex: 1; height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden;
//         }
//         .pipeline-fill {
//           height: 100%; border-radius: 99px;
//           transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
//         }

//         .stage-count { font-size: 13px; font-weight: 700; color: #0f172a; width: 30px; text-align: right; }

//         /* ── Jobs list ── */
//         .jobs-list { display: flex; flex-direction: column; gap: 10px; }

//         .job-row {
//           display: flex; align-items: center; justify-content: space-between; gap: 12px;
//           padding: 12px 14px; border-radius: 10px;
//           background: #f8fafc; border: 1px solid #f1f5f9;
//           transition: background 0.15s;
//         }
//         .job-row:hover { background: #f1f5f9; }

//         .job-main { flex: 1; overflow: hidden; }
//         .job-title { display: block; font-size: 13.5px; font-weight: 600; color: #0f172a;
//                      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
//         .job-meta  { display: block; font-size: 12px; color: #64748b; margin-top: 2px;
//                      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

//         .job-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

//         .openings-badge {
//           font-size: 11px; font-weight: 600; color: #475569;
//           background: #fff; border: 1px solid #e2e8f0;
//           padding: 3px 8px; border-radius: 20px;
//         }

//         .priority-pill {
//           display: flex; align-items: center; gap: 5px;
//           font-size: 11px; font-weight: 700;
//           padding: 4px 10px; border-radius: 20px;
//         }
//         .priority-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

//         /* ── Performance table ── */
//         .perf-table-wrap { overflow-x: auto; }

//         .perf-table {
//           width: 100%; border-collapse: collapse;
//           font-size: 13.5px;
//         }

//         .perf-table th {
//           text-align: left; padding: 10px 16px;
//           font-size: 11px; font-weight: 700; color: #64748b;
//           text-transform: uppercase; letter-spacing: 0.04em;
//           background: #f8fafc;
//           border-bottom: 1px solid #e2e8f0;
//         }
//         .perf-table th:first-child { border-radius: 8px 0 0 8px; }
//         .perf-table th:last-child  { border-radius: 0 8px 8px 0; }

//         .perf-row { border-bottom: 1px solid #f8fafc; transition: background 0.12s; }
//         .perf-row:hover { background: #f8fafc; }
//         .perf-row:last-child { border-bottom: none; }

//         .perf-table td { padding: 13px 16px; vertical-align: middle; }

//         .recruiter-cell { display: flex; align-items: center; gap: 10px; }

//         .rec-avatar {
//           width: 32px; height: 32px; border-radius: 50%;
//           color: #fff; font-size: 12px; font-weight: 700;
//           display: flex; align-items: center; justify-content: center;
//           flex-shrink: 0;
//         }

//         .rec-name { font-weight: 600; color: #0f172a; }

//         .top-badge {
//           font-size: 9px; font-weight: 800; letter-spacing: 0.08em;
//           background: #fef3c7; color: #d97706;
//           padding: 2px 6px; border-radius: 4px; margin-left: 4px;
//         }

//         .num-cell { font-size: 14px; font-weight: 600; color: #334155; }

//         .placement-cell { display: flex; flex-direction: column; gap: 4px; }
//         .placement-num  { font-size: 14px; font-weight: 700; color: #059669; }

//         .micro-bar-track { width: 80px; height: 4px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
//         .micro-bar-fill  { height: 100%; border-radius: 99px; transition: width 0.6s ease; }

//         .conversion-pill {
//           display: inline-block;
//           font-size: 12px; font-weight: 700;
//           padding: 4px 10px; border-radius: 20px;
//         }

//         .revenue-cell { font-weight: 700; color: #7c3aed; font-size: 14px; }

//         /* ── Client revenue ── */
//         .client-list { display: flex; flex-direction: column; gap: 16px; }

//         .client-row { display: flex; align-items: flex-start; gap: 14px; }

//         .client-rank {
//           font-size: 12px; font-weight: 800; color: #94a3b8;
//           width: 22px; padding-top: 2px; flex-shrink: 0;
//         }

//         .client-info { flex: 1; }

//         .client-top-row {
//           display: flex; justify-content: space-between; align-items: baseline;
//           margin-bottom: 6px;
//         }
//         .client-name { font-size: 13.5px; font-weight: 600; color: #0f172a;
//                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
//         .client-revenue { font-size: 14px; font-weight: 800; color: #7c3aed; flex-shrink: 0; }

//         .client-bar-track { height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; margin-bottom: 5px; }
//         .client-bar-fill  { height: 100%; border-radius: 99px; transition: width 0.8s ease; }

//         .client-placements { font-size: 11px; color: #94a3b8; }

//         /* ── Activity ── */
//         .activity-list { display: flex; flex-direction: column; gap: 4px; }

//         .activity-row {
//           display: flex; align-items: flex-start; gap: 12px;
//           padding: 11px 12px; border-radius: 10px;
//           transition: background 0.12s;
//         }
//         .activity-row:hover { background: #f8fafc; }

//         .activity-icon-wrap {
//           width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
//           display: flex; align-items: center; justify-content: center;
//         }

//         .activity-content { flex: 1; }
//         .activity-msg  { font-size: 13px; font-weight: 500; color: #0f172a; line-height: 1.4; }
//         .activity-time { font-size: 11px; color: #94a3b8; margin-top: 2px; display: block; }

//         .activity-type-badge {
//           font-size: 11px; font-weight: 700;
//           padding: 3px 9px; border-radius: 20px;
//           white-space: nowrap; flex-shrink: 0; margin-top: 3px;
//         }

//         /* ── Loading ── */
//         .dash-loading {
//           min-height: 100vh; display: flex; flex-direction: column;
//           align-items: center; justify-content: center; gap: 14px;
//           background: #f8fafc;
//           font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
//           color: #64748b; font-size: 14px;
//         }

//         .spinner {
//           width: 44px; height: 44px; border-radius: 50%;
//           border: 3px solid #e2e8f0;
//           border-top-color: #4f46e5;
//           animation: spin 0.8s linear infinite;
//         }
//         @keyframes spin { to { transform: rotate(360deg); } }

//         @media (max-width: 768px) {
//           .dash-main { padding: 20px 16px 40px; }
//           .dash-nav  { padding: 0 16px; }
//           .nav-links { display: none; }
//           .page-title-row { flex-direction: column; gap: 4px; }
//           .page-date { display: none; }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default ManagerDashboard;





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

const API_URL = "http://localhost:5000/api";

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