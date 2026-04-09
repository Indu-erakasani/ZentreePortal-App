


// import React, { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Box, Grid, Card, CardContent, Typography, Button, TextField,
//   MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
//   Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
//   Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
//   InputAdornment, Divider, LinearProgress,
// } from "@mui/material";
// import {
//   Add, Search, Edit, Delete, Visibility, Work,
//   AccessTime, TrendingUp, ReportProblem, Person, WorkOff,
//   Business,
// } from "@mui/icons-material";

// // ── Inline API calls ──────────────────────────────────────────────────────────
// const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

// const getHeaders = () => ({
//   "Content-Type": "application/json",
//   Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
// });

// const handle = async (res) => {
//   const data = await res.json();
//   if (!res.ok) throw data;
//   return data;
// };

// const getAllJobs    = (params = {}) => {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${BASE}/jobs/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
// };
// const createJob    = (payload) =>
//   fetch(`${BASE}/jobs/`,      { method: "POST",   headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// const updateJob    = (id, payload) =>
//   fetch(`${BASE}/jobs/${id}`, { method: "PUT",    headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// const deleteJob    = (id) =>
//   fetch(`${BASE}/jobs/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
// const getAllClients = () =>
//   fetch(`${BASE}/clients/`,   { headers: getHeaders() }).then(handle);

// const getCurrentUserName = () => {
//   try {
//     const user = JSON.parse(localStorage.getItem("user") || "{}");
//     const full = `${user.first_name || ""} ${user.last_name || ""}`.trim();
//     return full || user.email || "Unknown";
//   } catch { return "Unknown"; }
// };

// // ── Constants ─────────────────────────────────────────────────────────────────
// const PRIORITIES = ["Low", "Medium", "High", "Critical"];
// const STATUSES   = ["Open", "On Hold", "Closed", "Filled"];
// const JOB_TYPES  = ["Full-Time", "Part-Time", "Contract", "Internship"];
// const WORK_MODES = ["On-site", "Remote", "Hybrid"];

// const PRIORITY_COLOR = { Low: "default", Medium: "info", High: "warning", Critical: "error" };
// const STATUS_COLOR   = { Open: "success", "On Hold": "warning", Closed: "default", Filled: "primary" };

// const EMPTY_FORM = {
//   job_id: "", title: "", client_id: "", client_name: "",
//   openings: 1, job_type: "Full-Time", work_mode: "On-site",
//   location: "", experience_min: 0, experience_max: 5,
//   salary_min: "", salary_max: "", skills: "",
//   description: "", priority: "Medium", status: "Open",
//   deadline: "", notes: "",
// };

// const formatSalary = (val) => {
//   if (!val) return "—";
//   if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
//   return `₹${val.toLocaleString()}`;
// };

// const nameInitials = (name = "") =>
//   name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

// // ── Stat Card ─────────────────────────────────────────────────────────────────
// const StatCard = ({ title, value, icon, color, sub }) => (
//   <Card>
//     <CardContent sx={{ p: 2.5 }}>
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start">
//         <Box>
//           <Typography fontSize={12} color="text.secondary" fontWeight={600}
//             textTransform="uppercase" letterSpacing="0.05em">{title}</Typography>
//           <Typography variant="h3" fontWeight={800} mt={0.5} sx={{ color }}>{value}</Typography>
//           {sub && <Typography fontSize={12} color="text.secondary" mt={0.5}>{sub}</Typography>}
//         </Box>
//         <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
//       </Box>
//     </CardContent>
//   </Card>
// );

// // ── Empty State ───────────────────────────────────────────────────────────────
// const EmptyState = ({ onAdd }) => (
//   <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center"
//     py={10} gap={2}>
//     <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
//       <WorkOff sx={{ fontSize: 36, color: "#9fa8da" }} />
//     </Avatar>
//     <Typography variant="h6" fontWeight={700} color="text.secondary">No jobs found</Typography>
//     <Typography fontSize={14} color="text.disabled" textAlign="center" maxWidth={320}>
//       No jobs have been posted yet. Click "Post New Job" to add the first one.
//     </Typography>
//     <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ mt: 1 }}>
//       Post New Job
//     </Button>
//   </Box>
// );

// // ── Detail Row helper ─────────────────────────────────────────────────────────
// const DetailRow = ({ label, value }) => (
//   <Box display="flex" justifyContent="space-between" alignItems="center"
//     sx={{ py: 1, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}>
//     <Typography fontSize={13} color="text.secondary">{label}</Typography>
//     <Typography fontSize={13} fontWeight={600} color="text.primary" textAlign="right">
//       {value ?? "—"}
//     </Typography>
//   </Box>
// );

// // ── Clickable Client Name chip ────────────────────────────────────────────────
// // Navigates to /clients filtered by this client when clicked
// const ClientLink = ({ name, clientId, onClick }) => (
//   <Box
//     display="flex" alignItems="center" gap={0.6}
//     onClick={onClick}
//     sx={{
//       cursor: "pointer",
//       color: "#0277bd",
//       fontWeight: 600,
//       fontSize: 12,
//       width: "fit-content",
//       px: 0.8,
//       py: 0.3,
//       borderRadius: 1,
//       transition: "all 0.15s",
//       "&:hover": {
//         bgcolor: "#e3f2fd",
//         color: "#01579b",
//         textDecoration: "underline",
//       },
//     }}
//   >
//     <Business sx={{ fontSize: 13, flexShrink: 0 }} />
//     {name || "—"}
//   </Box>
// );

// // ── Main component ────────────────────────────────────────────────────────────
// export default function Jobs() {
//   const navigate = useNavigate();

//   const [jobs,      setJobs]      = useState([]);
//   const [clients,   setClients]   = useState([]);
//   const [loading,   setLoading]   = useState(true);
//   const [error,     setError]     = useState("");
//   const [search,    setSearch]    = useState("");
//   const [statusF,   setStatusF]   = useState("");
//   const [priorityF, setPriorityF] = useState("");
//   const [clientF,   setClientF]   = useState("");   // ← new: filter by client

//   const [formOpen,   setFormOpen]   = useState(false);
//   const [detailOpen, setDetailOpen] = useState(false);
//   const [deleteOpen, setDeleteOpen] = useState(false);
//   const [selected,   setSelected]   = useState(null);
//   const [formData,   setFormData]   = useState(EMPTY_FORM);
//   const [saving,     setSaving]     = useState(false);

//   const load = useCallback(async () => {
//     try {
//       setLoading(true); setError("");
//       const res = await getAllJobs();
//       setJobs(res.data || []);
//     } catch (err) {
//       setError(err?.message || "Failed to load jobs. Please check your connection.");
//       setJobs([]);
//     } finally { setLoading(false); }
//   }, []);

//   const loadClients = useCallback(async () => {
//     try { const res = await getAllClients(); setClients(res.data || []); }
//     catch { setClients([]); }
//   }, []);

//   useEffect(() => { load(); loadClients(); }, [load, loadClients]);

//   // ── Filtered view — now includes clientF ──────────────────────────────────
//   const filtered = jobs.filter(j => {
//     const q      = search.toLowerCase();
//     const matchQ = !q ||
//       j.title?.toLowerCase().includes(q)          ||
//       j.client_name?.toLowerCase().includes(q)    ||
//       j.job_id?.toLowerCase().includes(q)         ||
//       j.location?.toLowerCase().includes(q)       ||
//       j.posted_by_name?.toLowerCase().includes(q);
//     const matchS = !statusF   || j.status   === statusF;
//     const matchP = !priorityF || j.priority === priorityF;
//     const matchC = !clientF   || j.client_id === clientF;   // ← client filter
//     return matchQ && matchS && matchP && matchC;
//   });

//   const stats = {
//     total:        jobs.length,
//     open:         jobs.filter(j => j.status === "Open").length,
//     critical:     jobs.filter(j => j.priority === "Critical").length,
//     applications: jobs.reduce((s, j) => s + (j.applications || 0), 0),
//   };

//   // ── Modal helpers ──────────────────────────────────────────────────────────
//   const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
//   const openEdit   = j  => {
//     setSelected(j);
//     setFormData({ ...EMPTY_FORM, ...j,
//       skills: Array.isArray(j.skills) ? j.skills.join(", ") : (j.skills || "") });
//     setFormOpen(true);
//   };
//   const openDetail = j  => { setSelected(j); setDetailOpen(true); };
//   const openDelete = j  => { setSelected(j); setDeleteOpen(true); };

//   // ── Click client name → navigate to /clients filtered by client_id ────────
//   const handleClientClick = (clientId) => {
//     navigate(`/clients?highlight=${clientId}`);
//   };

//   const handleChange = e => {
//     const { name, value } = e.target;
//     if (name === "client_id") {
//       const client = clients.find(c => c._id === value);
//       setFormData(p => ({ ...p, client_id: value, client_name: client?.company_name || "" }));
//     } else {
//       setFormData(p => ({ ...p, [name]: value }));
//     }
//   };

//   const handleSave = async (e) => {
//     e.preventDefault(); setSaving(true);
//     try {
//       const payload = {
//         ...formData,
//         skills:         formData.skills
//           ? formData.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
//         openings:       Number(formData.openings),
//         experience_min: Number(formData.experience_min),
//         experience_max: Number(formData.experience_max),
//         salary_min:     formData.salary_min ? Number(formData.salary_min) : 0,
//         salary_max:     formData.salary_max ? Number(formData.salary_max) : 0,
//       };
//       selected ? await updateJob(selected._id, payload) : await createJob(payload);
//       setFormOpen(false); load();
//     } catch (err) { setError(err?.message || "Save failed"); }
//     finally { setSaving(false); }
//   };
//   const calcDaysOpen = (deadline) => {
//     if (!deadline) return "—";
//     const due   = new Date(deadline);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     due.setHours(0, 0, 0, 0);
//     const diff  = Math.floor((due - today) / (1000 * 60 * 60 * 24));
//     return diff;
//   };
//   const handleDelete = async () => {
//     try { await deleteJob(selected._id); setDeleteOpen(false); load(); }
//     catch (err) { setError(err?.message || "Delete failed"); }
//   };

//   if (loading)
//     return (
//       <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
//         <CircularProgress size={48} />
//       </Box>
//     );

//   return (
//     <Box display="flex" flexDirection="column" gap={3}>

//       {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

//       {/* ── Page header ── */}
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
//         <Box>
//           <Typography variant="h4" color="primary.dark">Job Management</Typography>
//           <Typography color="text.secondary" mt={0.5}>
//             Track open positions, manage requirements and monitor applications
//           </Typography>
//         </Box>
//         <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">
//           Post New Job
//         </Button>
//       </Box>

//       {/* ── Stat cards ── */}
//       <Grid container spacing={2.5}>
//         <Grid item xs={6} md={3}>
//           <StatCard title="Total Jobs"   value={stats.total}        icon={<Work />}          color="#1a237e" sub="All time" />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <StatCard title="Open Jobs"    value={stats.open}         icon={<AccessTime />}    color="#0277bd" sub="Currently active" />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <StatCard title="Critical"     value={stats.critical}     icon={<ReportProblem />} color="#c62828" sub="Need immediate action" />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <StatCard title="Applications" value={stats.applications} icon={<TrendingUp />}    color="#2e7d32" sub="Total received" />
//         </Grid>
//       </Grid>

//       {/* ── Pipeline bar ── */}
//       {jobs.length > 0 && (
//         <Card>
//           <CardContent sx={{ p: 3 }}>
//             <Typography variant="h6" mb={2}>Jobs by Status</Typography>
//             <Grid container spacing={3}>
//               {STATUSES.map(s => {
//                 const count = jobs.filter(j => j.status === s).length;
//                 const pct   = jobs.length ? (count / jobs.length) * 100 : 0;
//                 return (
//                   <Grid item xs={6} md={3} key={s}>
//                     <Box display="flex" justifyContent="space-between" mb={0.5}>
//                       <Typography fontSize={13} fontWeight={600}>{s}</Typography>
//                       <Typography fontSize={13} color="text.secondary">{count}</Typography>
//                     </Box>
//                     <LinearProgress variant="determinate" value={pct}
//                       color={STATUS_COLOR[s] || "inherit"}
//                       sx={{ height: 8, borderRadius: 4 }} />
//                   </Grid>
//                 );
//               })}
//             </Grid>
//           </CardContent>
//         </Card>
//       )}

//       {/* ── Filters — now includes Client dropdown ── */}
//       {jobs.length > 0 && (
//         <Box display="flex" gap={2} flexWrap="wrap">
//           <TextField
//             placeholder="Search by title, client, location, posted by…"
//             value={search} onChange={e => setSearch(e.target.value)}
//             size="small" sx={{ flexGrow: 1, minWidth: 240 }}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <Search fontSize="small" color="action" />
//                 </InputAdornment>
//               ),
//             }}
//           />
//           {/* ── Client filter ── */}
//           <TextField select value={clientF} onChange={e => setClientF(e.target.value)}
//             size="small" sx={{ minWidth: 180 }} label="Client">
//             <MenuItem value="">All Clients</MenuItem>
//             {clients.map(c => (
//               <MenuItem key={c._id} value={c._id}>
//                 <Box display="flex" alignItems="center" gap={1}>
//                   <Business fontSize="small" sx={{ color: "#0277bd" }} />
//                   {c.company_name}
//                 </Box>
//               </MenuItem>
//             ))}
//           </TextField>
//           <TextField select value={statusF} onChange={e => setStatusF(e.target.value)}
//             size="small" sx={{ minWidth: 140 }} label="Status">
//             <MenuItem value="">All Statuses</MenuItem>
//             {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//           </TextField>
//           <TextField select value={priorityF} onChange={e => setPriorityF(e.target.value)}
//             size="small" sx={{ minWidth: 140 }} label="Priority">
//             <MenuItem value="">All Priorities</MenuItem>
//             {PRIORITIES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
//           </TextField>
//         </Box>
//       )}

//       {/* ── Table or Empty state ── */}
//       {jobs.length === 0 && !error ? (
//         <Card><EmptyState onAdd={openCreate} /></Card>
//       ) : (
//         <Card>
//           <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//             <Table>
//               <TableHead>
//                 <TableRow sx={{ bgcolor: "#f5f7fa" }}>
//                   {["Job ID", "Position", "Client", "Type / Mode", "Experience",
//                     "Salary", "Openings", "Days Open", "Posted By", "Priority", "Status", "Actions"].map(h => (
//                     <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>
//                       {h}
//                     </TableCell>
//                   ))}
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {filtered.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={12} align="center" sx={{ py: 6, color: "text.secondary" }}>
//                       No jobs match your current filters
//                     </TableCell>
//                   </TableRow>
//                 ) : filtered.map(j => (
//                   <TableRow key={j._id} hover>
//                     <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>
//                       {j.job_id}
//                     </TableCell>
//                     <TableCell>
//                       <Typography fontWeight={600} fontSize={13}>{j.title}</Typography>
//                       <Typography fontSize={11} color="text.secondary">{j.location}</Typography>
//                     </TableCell>

//                     {/* ── Client column — clickable link ── */}
//                     <TableCell>
//                       <ClientLink
//                         name={j.client_name}
//                         clientId={j.client_id}
//                         onClick={() => handleClientClick(j.client_id)}
//                       />
//                     </TableCell>

//                     <TableCell>
//                       <Typography fontSize={12}>{j.job_type}</Typography>
//                       <Typography fontSize={11} color="text.secondary">{j.work_mode}</Typography>
//                     </TableCell>
//                     <TableCell sx={{ fontSize: 12 }}>
//                       {j.experience_min}–{j.experience_max} yrs
//                     </TableCell>
//                     <TableCell sx={{ fontSize: 12 }}>
//                       {formatSalary(j.salary_min)} – {formatSalary(j.salary_max)}
//                     </TableCell>
//                     <TableCell>
//                       <Box display="flex" alignItems="center" gap={0.5}>
//                         <Typography fontSize={13} fontWeight={600}>{j.filled || 0}</Typography>
//                         <Typography fontSize={11} color="text.secondary">/ {j.openings}</Typography>
//                       </Box>
//                       <LinearProgress variant="determinate"
//                         value={j.openings ? ((j.filled || 0) / j.openings) * 100 : 0}
//                         sx={{ height: 4, borderRadius: 2, mt: 0.5, bgcolor: "#e0e0e0",
//                               "& .MuiLinearProgress-bar": { bgcolor: "#2e7d32" } }} />
//                     </TableCell>
//                     <TableCell sx={{ fontSize: 12 }}>
//                       {j.deadline ? (
//                         <Box>
//                           <Typography fontSize={13} fontWeight={600}
//                             color={calcDaysOpen(j.deadline) < 0 ? "error.main" :
//                                   calcDaysOpen(j.deadline) <= 7 ? "warning.main" : "text.primary"}>
//                             {calcDaysOpen(j.deadline) < 0
//                               ? `${Math.abs(calcDaysOpen(j.deadline))} days overdue`
//                               : `${calcDaysOpen(j.deadline)} days left`}
//                           </Typography>
//                           <Typography fontSize={11} color="text.secondary">
//                             Due {new Date(j.deadline).toLocaleDateString("en-IN")}
//                           </Typography>
//                         </Box>
//                       ) : "—"}
//                     </TableCell>
//                     <TableCell>
//                       <Box display="flex" alignItems="center" gap={1}>
//                         <Avatar sx={{ width: 26, height: 26, fontSize: 10, fontWeight: 700,
//                           bgcolor: "#e8eaf6", color: "#1a237e" }}>
//                           {nameInitials(j.posted_by_name)}
//                         </Avatar>
//                         <Typography fontSize={12} fontWeight={500}>
//                           {j.posted_by_name || "—"}
//                         </Typography>
//                       </Box>
//                     </TableCell>
//                     <TableCell>
//                       <Chip label={j.priority} color={PRIORITY_COLOR[j.priority] || "default"}
//                         size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                     </TableCell>
//                     <TableCell>
//                       <Chip label={j.status} color={STATUS_COLOR[j.status] || "default"}
//                         size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                     </TableCell>
//                     <TableCell>
//                       <Box display="flex" gap={0.5}>
//                         <Tooltip title="View">
//                           <IconButton size="small" onClick={() => openDetail(j)}>
//                             <Visibility fontSize="small" />
//                           </IconButton>
//                         </Tooltip>
//                         <Tooltip title="Edit">
//                           <IconButton size="small" onClick={() => openEdit(j)}>
//                             <Edit fontSize="small" />
//                           </IconButton>
//                         </Tooltip>
//                         <Tooltip title="Delete">
//                           <IconButton size="small" color="error" onClick={() => openDelete(j)}>
//                             <Delete fontSize="small" />
//                           </IconButton>
//                         </Tooltip>
//                       </Box>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </Paper>
//         </Card>
//       )}

//       {/* ── Detail Dialog ── */}
//       <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 2 }}>
//           Job Details
//         </DialogTitle>

//         {selected && (
//           <DialogContent sx={{ pt: 3, pb: 1 }}>
//             <Box display="flex" alignItems="center" gap={2.5} mb={3}
//               pb={3} sx={{ borderBottom: "1px solid #e0e0e0" }}>
//               <Avatar sx={{ width: 72, height: 72, borderRadius: 3,
//                 background: "linear-gradient(135deg, #00acc1, #0277bd)", flexShrink: 0 }}>
//                 <Work sx={{ fontSize: 32, color: "#fff" }} />
//               </Avatar>
//               <Box>
//                 <Typography variant="h5" fontWeight={800} color="text.primary" lineHeight={1.2}>
//                   {selected.title}
//                 </Typography>
//                 {/* ── Client name as clickable link in detail dialog ── */}
//                 <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
//                   <ClientLink
//                     name={selected.client_name}
//                     clientId={selected.client_id}
//                     onClick={() => { setDetailOpen(false); handleClientClick(selected.client_id); }}
//                   />
//                   {selected.location && (
//                     <Typography color="text.secondary" fontSize={13}>
//                       · {selected.location}
//                     </Typography>
//                   )}
//                 </Box>
//                 <Box display="flex" gap={1} mt={1} flexWrap="wrap">
//                   <Chip label={selected.status}
//                     color={STATUS_COLOR[selected.status] || "default"}
//                     size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                   <Chip label={`${selected.priority} Priority`}
//                     color={PRIORITY_COLOR[selected.priority] || "default"}
//                     size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                 </Box>
//               </Box>
//             </Box>

//             <Grid container spacing={3}>
//               <Grid item xs={12} sm={6}>
//                 <Typography fontSize={11} fontWeight={700} color="text.secondary"
//                   textTransform="uppercase" letterSpacing={0.8} mb={1.5}>
//                   Job Information
//                 </Typography>
//                 <DetailRow label="Job ID"     value={selected.job_id}    />
//                 <DetailRow label="Department" value={selected.department} />
//                 <DetailRow label="Job Type"   value={selected.job_type}  />
//                 <DetailRow label="Days Open"  value={`${calcDaysOpen(selected.created_at)} days`} />
//                 <DetailRow label="Deadline"
//                   value={selected.deadline
//                     ? new Date(selected.deadline).toLocaleDateString("en-IN") : "—"} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <Typography fontSize={11} fontWeight={700} color="text.secondary"
//                   textTransform="uppercase" letterSpacing={0.8} mb={1.5}>
//                   Requirements &amp; Compensation
//                 </Typography>
//                 <DetailRow label="Experience"
//                   value={`${selected.experience_min}–${selected.experience_max} years`} />
//                 <DetailRow label="Salary Range"
//                   value={`${formatSalary(selected.salary_min)} – ${formatSalary(selected.salary_max)}`} />
//                 <DetailRow label="Openings"
//                   value={`${selected.filled || 0} / ${selected.openings} filled`} />
//                 <DetailRow label="Applicants"
//                   value={selected.applications ?? selected.applicants ?? 0} />
//               </Grid>
//             </Grid>

//             {selected.skills?.length > 0 && (
//               <Box mt={2.5}>
//                 <Typography fontSize={11} color="text.secondary" fontWeight={700}
//                   textTransform="uppercase" letterSpacing={0.8} mb={1}>
//                   Required Skills
//                 </Typography>
//                 <Box display="flex" flexWrap="wrap" gap={0.8}>
//                   {(Array.isArray(selected.skills)
//                     ? selected.skills
//                     : selected.skills.split(",")
//                   ).map((s, i) => (
//                     <Chip key={i} label={s.trim()} size="small" variant="outlined"
//                       sx={{ fontSize: 11, borderColor: "#0277bd", color: "#0277bd" }} />
//                   ))}
//                 </Box>
//               </Box>
//             )}

//             {selected.description && (
//               <Box mt={2.5} p={2} bgcolor="#f5f7fa" borderRadius={2}
//                 border="1px solid #e0e0e0">
//                 <Typography fontSize={11} color="text.secondary" fontWeight={700}
//                   textTransform="uppercase" letterSpacing={0.8} mb={1}>
//                   Job Description
//                 </Typography>
     
//                   <Typography fontSize={13} lineHeight={1.8}
//                     sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
//                     {selected.description}
//                   </Typography>
       
//               </Box>
//             )}

//             {selected.notes && (
//               <Box mt={2} p={1.5} bgcolor="#fff8e1" borderRadius={2}
//                 border="1px solid #ffe082">
//                 <Typography fontSize={11} color="text.secondary" fontWeight={700}
//                   textTransform="uppercase" mb={0.5}>
//                   Internal Notes
//                 </Typography>
//                 <Typography fontSize={13}>{selected.notes}</Typography>
//               </Box>
//             )}
//           </DialogContent>
//         )}

//         <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #e0e0e0",
//           justifyContent: "flex-start", gap: 1.5 }}>
//           <Button variant="outlined"
//             onClick={() => { setDetailOpen(false); navigate(`/resumes?job=${selected._id}`); }}
//             sx={{ textTransform: "none", fontWeight: 600 }}>
//             View Candidates
//           </Button>
//           <Button variant="outlined"
//             onClick={() => { setDetailOpen(false); navigate(`/tracking?job=${selected._id}`); }}
//             sx={{ textTransform: "none", fontWeight: 600 }}>
//             Track Progress
//           </Button>
//           <Box sx={{ flex: 1 }} />
//           <Button variant="contained"
//             onClick={() => { setDetailOpen(false); openEdit(selected); }}
//             sx={{ textTransform: "none", fontWeight: 700 }}>
//             Edit Job
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── Add / Edit Dialog ── */}
//       <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
//           <Box display="flex" justifyContent="space-between" alignItems="center">
//             <span>{selected ? "Edit Job" : "Post New Job"}</span>
//             {!selected && (
//               <Box display="flex" alignItems="center" gap={1}
//                 sx={{ bgcolor: "#e8eaf6", px: 1.5, py: 0.6, borderRadius: 2 }}>
//                 <Person sx={{ fontSize: 16, color: "#1a237e" }} />
//                 <Typography fontSize={12} fontWeight={600} color="primary.dark">
//                   Posting as: {getCurrentUserName()}
//                 </Typography>
//               </Box>
//             )}
//           </Box>
//         </DialogTitle>
//         <form onSubmit={handleSave}>
//           <DialogContent sx={{ pt: 3 }}>
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
//               Basic Information
//             </Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={4}>
//                 <TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Job ID" name="job_id"
//                   value={formData.job_id} onChange={handleChange}
//                   placeholder="e.g. JOB007" disabled={!!selected} />
//               </Grid>
//               <Grid item xs={12} sm={8}>
//                 <TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Job Title" name="title"
//                   value={formData.title} onChange={handleChange}
//                   placeholder="e.g. Senior React Developer" />
//               </Grid>

//               {/* ── Client dropdown — shows company name, stores _id + name ── */}
//               <Grid item xs={12} sm={6}>
//                 <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" required label="Client"
//                   name="client_id" value={formData.client_id} onChange={handleChange}>
//                   <MenuItem value="">Select Client</MenuItem>
//                   {clients.map(c => (
//                     <MenuItem key={c._id} value={c._id}>
//                       <Box display="flex" alignItems="center" gap={1}>
//                         <Business fontSize="small" sx={{ color: "#0277bd" }} />
//                         {c.company_name}
//                       </Box>
//                     </MenuItem>
//                   ))}
//                 </TextField>
//               </Grid>
//               <Grid item xs={12} sm={formData.client_name ? 12 : 6}>
//                 <TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Location " name="location"
//                   value={formData.location} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={6} sm={3}>
//                 <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Priority" name="priority"
//                   value={formData.priority} onChange={handleChange}>
//                   {PRIORITIES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
//                 </TextField>
//               </Grid>
//               <Grid item xs={6} sm={3}>
//                 <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Status" name="status"
//                   value={formData.status} onChange={handleChange}>
//                   {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//                 </TextField>
//               </Grid>
//               <Grid item xs={6} sm={3}>
//                 <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Job Type" name="job_type"
//                   value={formData.job_type} onChange={handleChange}>
//                   {JOB_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
//                 </TextField>
//               </Grid>
//               <Grid item xs={6} sm={3}>
//                 <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Work Mode" name="work_mode"
//                   value={formData.work_mode} onChange={handleChange}>
//                   {WORK_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
//                 </TextField>
//               </Grid>
//             </Grid>

//             <Divider sx={{ my: 2 }} />
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
//               Requirements
//             </Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={6} sm={3}>
//                 <TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Openings" name="openings"
//                   value={formData.openings} onChange={handleChange} inputProps={{ min: 1 }} />
//               </Grid>
//               <Grid item xs={6} sm={3}>
//                 <TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Min Exp (yrs)"
//                   name="experience_min" value={formData.experience_min} onChange={handleChange}
//                   inputProps={{ min: 0 }} />
//               </Grid>
//               <Grid item xs={6} sm={3}>
//                 <TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Max Exp (yrs)"
//                   name="experience_max" value={formData.experience_max} onChange={handleChange}
//                   inputProps={{ min: 0 }} />
//               </Grid>
//               <Grid item xs={6} sm={3}>
//                 <TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="date" label="Deadline"
//                   name="deadline" value={formData.deadline} onChange={handleChange}
//                   InputLabelProps={{ shrink: true }} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Min Salary (₹)"
//                   name="salary_min" value={formData.salary_min} onChange={handleChange}
//                   placeholder="e.g. 1200000" />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Max Salary (₹)"
//                   name="salary_max" value={formData.salary_max} onChange={handleChange}
//                   placeholder="e.g. 1800000" />
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField  sx={{ width: "100%", minWidth: 820 }} multiline rows={4}  size="small" label="Required Skills (comma-separated)"
//                   name="skills" value={formData.skills} onChange={handleChange}
//                   placeholder="e.g. React, Node.js, MongoDB, REST APIs" />
//               </Grid>
//             </Grid>

//             <Divider sx={{ my: 2 }} />
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
//               Description &amp; Notes
//             </Typography>
//             <Grid container spacing={2}>
//               <Grid item xs={12}>
//                 <TextField sx={{ width: "100%", minWidth: 820 }} multiline rows={14} size="small" label="Job Description"
//                   name="description" value={formData.description} onChange={handleChange}
//                   placeholder="Describe responsibilities, requirements and expectations…" />
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField sx={{ width: "100%", minWidth: 820 }} multiline rows={4} size="small" label="Internal Notes"
//                   name="notes" value={formData.notes} onChange={handleChange}
//                   placeholder="Internal notes (not visible to candidates)…" />
//               </Grid>
//             </Grid>
//           </DialogContent>
//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//             <Button onClick={() => setFormOpen(false)}>Cancel</Button>
//             <Button type="submit" variant="contained" disabled={saving}>
//               {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
//               {selected ? "Update Job" : "Post Job"}
//             </Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//       {/* ── Delete Confirm Dialog ── */}
//       <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
//         <DialogTitle fontWeight={700}>Delete Job</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Are you sure you want to delete <strong>{selected?.title}</strong>?
//             This action cannot be undone.
//           </Typography>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2 }}>
//           <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
//           <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
//         </DialogActions>
//       </Dialog>

//     </Box>
//   );
// }










































// import React, { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//     Box, Grid, Card, CardContent, Typography, Button, TextField,
//     MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
//     Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
//     Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
//     InputAdornment, Divider, LinearProgress, Switch, FormControlLabel,
//     Tabs, Tab,
// } from "@mui/material";
// import {
//     Add, Search, Edit, Delete, Visibility, Work,
//     AccessTime, TrendingUp, ReportProblem, Person, WorkOff,
//     Business, Code, Quiz, QuestionAnswer, Assignment,
// } from "@mui/icons-material";

// // ── API ───────────────────────────────────────────────────────────────────────
// const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

// const getHeaders = () => ({
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
// });

// const handle = async (res) => {
//     const data = await res.json();
//     if (!res.ok) throw data;
//     return data;
// };

// // Jobs API
// const getAllJobs    = (p = {}) => fetch(`${BASE}/jobs/${new URLSearchParams(p).toString() ? "?" + new URLSearchParams(p).toString() : ""}`, { headers: getHeaders() }).then(handle);
// const createJob    = (p)      => fetch(`${BASE}/jobs/`,      { method: "POST",   headers: getHeaders(), body: JSON.stringify(p) }).then(handle);
// const updateJob    = (id, p)  => fetch(`${BASE}/jobs/${id}`, { method: "PUT",    headers: getHeaders(), body: JSON.stringify(p) }).then(handle);
// const deleteJob    = (id)     => fetch(`${BASE}/jobs/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
// const getAllClients = ()       => fetch(`${BASE}/clients/`,   { headers: getHeaders() }).then(handle);

// // JD Details API  (reads from __resourcing_bot_db__)

// const getAllJDs = (p = {}) => fetch(`${BASE}/jobs/jd/${new URLSearchParams(p).toString() ? "?" + new URLSearchParams(p).toString() : ""}`, { headers: getHeaders() }).then(handle);
// const getJD    = (id)     => fetch(`${BASE}/jobs/jd/${id}`, { headers: getHeaders() }).then(handle);
// const getCurrentUserName = () => {
//     try {
//         const u = JSON.parse(localStorage.getItem("user") || "{}");
//         return `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Unknown";
//     } catch { return "Unknown"; }
// };

// // ── Constants ─────────────────────────────────────────────────────────────────
// const PRIORITIES = ["Low", "Medium", "High", "Critical"];
// const STATUSES   = ["Open", "On Hold", "Closed", "Filled"];
// const JOB_TYPES  = ["Full-Time", "Part-Time", "Contract", "Internship"];
// const WORK_MODES = ["On-site", "Remote", "Hybrid"];

// const PRIORITY_COLOR = { Low: "default", Medium: "info", High: "warning", Critical: "error" };
// const STATUS_COLOR   = { Open: "success", "On Hold": "warning", Closed: "default", Filled: "primary" };

// const EMPTY_FORM = {
//     job_id: "", title: "", client_id: "", client_name: "",
//     openings: 1, job_type: "Full-Time", work_mode: "On-site",
//     location: "", experience_min: 0, experience_max: 5,
//     salary_min: "", salary_max: "", skills: "",
//     description: "", priority: "Medium", status: "Open",
//     deadline: "", notes: "",
//     programming_language: "", programming_level: "", secondary_skills: "",
//     mcq_questions_count: 0, subjective_questions_count: 0,
//     coding_questions_count: 0, screening_time_minutes: 0,
//     screening_test_pass_percentage: "",
//     department: "", preferred_location: "",
//     is_active: true, jd_edit_status: "", remarks: "",
// };

// // ── Utilities ─────────────────────────────────────────────────────────────────
// const formatSalary = (val) => {
//     if (!val) return "—";
//     if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
//     return `₹${val.toLocaleString()}`;
// };
// const nameInitials = (name = "") =>
//     name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
// const calcDaysLeft = (deadline) => {
//     if (!deadline) return null;
//     const due = new Date(deadline); const today = new Date();
//     today.setHours(0, 0, 0, 0); due.setHours(0, 0, 0, 0);
//     return Math.floor((due - today) / 86400000);
// };
// const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

// // ── Sub-components ────────────────────────────────────────────────────────────
// const StatCard = ({ title, value, icon, color, sub }) => (
//     <Card>
//         <CardContent sx={{ p: 2.5 }}>
//             <Box display="flex" justifyContent="space-between" alignItems="flex-start">
//                 <Box>
//                     <Typography fontSize={12} color="text.secondary" fontWeight={600}
//                         textTransform="uppercase" letterSpacing="0.05em">{title}</Typography>
//                     <Typography variant="h3" fontWeight={800} mt={0.5} sx={{ color }}>{value}</Typography>
//                     {sub && <Typography fontSize={12} color="text.secondary" mt={0.5}>{sub}</Typography>}
//                 </Box>
//                 <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
//             </Box>
//         </CardContent>
//     </Card>
// );

// const EmptyState = ({ onAdd, label = "Post New Job" }) => (
//     <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10} gap={2}>
//         <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
//             <WorkOff sx={{ fontSize: 36, color: "#9fa8da" }} />
//         </Avatar>
//         <Typography variant="h6" fontWeight={700} color="text.secondary">No records found</Typography>
//         {onAdd && <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ mt: 1 }}>{label}</Button>}
//     </Box>
// );

// const DetailRow = ({ label, value }) => (
//     <Box display="flex" justifyContent="space-between" alignItems="center"
//         sx={{ py: 1, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}>
//         <Typography fontSize={13} color="text.secondary">{label}</Typography>
//         <Typography fontSize={13} fontWeight={600} color="text.primary" textAlign="right">{value ?? "—"}</Typography>
//     </Box>
// );

// const SectionLabel = ({ children }) => (
//     <Typography fontSize={11} fontWeight={700} color="text.secondary"
//         textTransform="uppercase" letterSpacing={0.8} mb={1.5}>{children}</Typography>
// );

// const ClientLink = ({ name, onClick }) => (
//     <Box display="flex" alignItems="center" gap={0.6} onClick={onClick}
//         sx={{
//             cursor: "pointer", color: "#0277bd", fontWeight: 600, fontSize: 12,
//             width: "fit-content", px: 0.8, py: 0.3, borderRadius: 1, transition: "all 0.15s",
//             "&:hover": { bgcolor: "#e3f2fd", color: "#01579b", textDecoration: "underline" },
//         }}>
//         <Business sx={{ fontSize: 13, flexShrink: 0 }} />{name || "—"}
//     </Box>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// //  TAB 1 — JD DETAILS (resourcing bot DB)
// // ─────────────────────────────────────────────────────────────────────────────
// function JDDetailsTab() {
//     const [jds,        setJDs]        = useState([]);
//     const [loading,    setLoading]    = useState(true);
//     const [error,      setError]      = useState("");
//     const [search,     setSearch]     = useState("");
//     const [activeF,    setActiveF]    = useState("");
//     const [detailOpen, setDetailOpen] = useState(false);
//     const [selected,   setSelected]   = useState(null);

//     const load = useCallback(async () => {
//         try {
//             setLoading(true); setError("");
//             const res = await getAllJDs();
//             setJDs(res.data || []);
//         } catch (err) { setError(err?.message || "Failed to load JD details."); setJDs([]); }
//         finally { setLoading(false); }
//     }, []);

//     useEffect(() => { load(); }, [load]);

//     const filtered = jds.filter((j) => {
//         const q = search.toLowerCase();
//         const matchQ = !q ||
//             j.jdID?.toLowerCase().includes(q)        ||
//             j.companyName?.toLowerCase().includes(q) ||
//             j.jobRole?.toLowerCase().includes(q);
//         const matchA = activeF === ""          ? true
//                      : activeF === "active"    ? j.is_active === true
//                      :                           j.is_active === false;
//         return matchQ && matchA;
//     });

//     const stats = {
//         total:  jds.length,
//         active: jds.filter((j) => j.is_active).length,
//         exp:    jds.filter((j) => j.expiration_time && new Date(j.expiration_time) < new Date()).length,
//     };

//     if (loading)
//         return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

//     return (
//         <Box display="flex" flexDirection="column" gap={3}>
//             {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

//             {/* ── Stat cards ── */}
//             <Grid container spacing={2.5}>
//                 <Grid item xs={6} md={4}>
//                     <StatCard title="Total JDs"   value={stats.total}  icon={<Assignment />} color="#1a237e" sub="All time" />
//                 </Grid>
//                 <Grid item xs={6} md={4}>
//                     <StatCard title="Active JDs"  value={stats.active} icon={<AccessTime />} color="#2e7d32" sub="Currently active" />
//                 </Grid>
//                 <Grid item xs={6} md={4}>
//                     <StatCard title="Expired JDs" value={stats.exp}    icon={<ReportProblem />} color="#c62828" sub="Past expiry date" />
//                 </Grid>
//             </Grid>

//             {/* ── Filters ── */}
//             <Box display="flex" gap={2} flexWrap="wrap">
//                 <TextField placeholder="Search by JD ID, company, job role…"
//                     value={search} onChange={(e) => setSearch(e.target.value)}
//                     size="small" sx={{ flexGrow: 1, minWidth: 240 }}
//                     InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
//                 <TextField select value={activeF} onChange={(e) => setActiveF(e.target.value)}
//                     size="small" sx={{ minWidth: 150 }} label="Status">
//                     <MenuItem value="">All</MenuItem>
//                     <MenuItem value="active">Active</MenuItem>
//                     <MenuItem value="inactive">Inactive</MenuItem>
//                 </TextField>
//             </Box>

//             {/* ── Table ── */}
//             <Card>
//                 <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//                     <Table>
//                         <TableHead>
//                             <TableRow sx={{ bgcolor: "#f5f7fa" }}>
//                                 {["JD ID", "Company", "Job Role", "Experience", "Salary Range",
//                                     "Skills", "Screening", "Created", "Expires", "Status", "Actions"].map((h) => (
//                                     <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
//                                 ))}
//                             </TableRow>
//                         </TableHead>
//                         <TableBody>
//                             {filtered.length === 0 ? (
//                                 <TableRow>
//                                     <TableCell colSpan={11} align="center" sx={{ py: 6, color: "text.secondary" }}>
//                                         No JD details match your filters
//                                     </TableCell>
//                                 </TableRow>
//                             ) : filtered.map((j) => (
//                                 <TableRow key={j._id} hover>
//                                     <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>{j.jdID}</TableCell>
//                                     <TableCell>
//                                         <Box display="flex" alignItems="center" gap={0.6}>
//                                             <Business sx={{ fontSize: 13, color: "#0277bd" }} />
//                                             <Typography fontSize={13} fontWeight={600}>{j.companyName}</Typography>
//                                         </Box>
//                                     </TableCell>
//                                     <TableCell sx={{ fontSize: 13 }}>
//                                         {/* Convert snake_case role to readable */}
//                                         {j.jobRole?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "—"}
//                                     </TableCell>
//                                     <TableCell sx={{ fontSize: 12 }}>{j.experience ? `${j.experience} yrs` : "—"}</TableCell>
//                                     <TableCell sx={{ fontSize: 12 }}>{j.salaryRange || "—"}</TableCell>
//                                     <TableCell>
//                                         <Box display="flex" flexWrap="wrap" gap={0.5} maxWidth={180}>
//                                             {j.skills?.slice(0, 3).map((s, i) => (
//                                                 <Chip key={i} label={s} size="small" variant="outlined"
//                                                     sx={{ fontSize: 10, borderColor: "#0277bd", color: "#0277bd" }} />
//                                             ))}
//                                             {j.skills?.length > 3 && (
//                                                 <Chip label={`+${j.skills.length - 3}`} size="small"
//                                                     sx={{ fontSize: 10 }} />
//                                             )}
//                                         </Box>
//                                     </TableCell>
//                                     <TableCell>
//                                         <Box display="flex" flexDirection="column" gap={0.3}>
//                                             {j.mcq_questions_count > 0 && (
//                                                 <Box display="flex" alignItems="center" gap={0.5}>
//                                                     <Quiz sx={{ fontSize: 12, color: "#7b1fa2" }} />
//                                                     <Typography fontSize={11}>{j.mcq_questions_count} MCQ</Typography>
//                                                 </Box>
//                                             )}
//                                             {j.coding_questions_count > 0 && (
//                                                 <Box display="flex" alignItems="center" gap={0.5}>
//                                                     <Code sx={{ fontSize: 12, color: "#2e7d32" }} />
//                                                     <Typography fontSize={11}>{j.coding_questions_count} Code</Typography>
//                                                 </Box>
//                                             )}
//                                             {j.screening_time_minutes > 0 && (
//                                                 <Typography fontSize={10} color="text.secondary">{j.screening_time_minutes} mins</Typography>
//                                             )}
//                                         </Box>
//                                     </TableCell>
//                                     <TableCell sx={{ fontSize: 11, color: "text.secondary" }}>{fmtDate(j.creation_time)}</TableCell>
//                                     <TableCell>
//                                         {j.expiration_time ? (
//                                             <Typography fontSize={11}
//                                                 color={new Date(j.expiration_time) < new Date() ? "error.main" : "text.secondary"}>
//                                                 {fmtDate(j.expiration_time)}
//                                             </Typography>
//                                         ) : "—"}
//                                     </TableCell>
//                                     <TableCell>
//                                         <Chip label={j.is_active ? "Active" : "Inactive"}
//                                             color={j.is_active ? "success" : "default"}
//                                             size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                                     </TableCell>
//                                     <TableCell>
//                                         <Tooltip title="View Details">
//                                             <IconButton size="small" onClick={() => { setSelected(j); setDetailOpen(true); }}>
//                                                 <Visibility fontSize="small" />
//                                             </IconButton>
//                                         </Tooltip>
//                                     </TableCell>
//                                 </TableRow>
//                             ))}
//                         </TableBody>
//                     </Table>
//                 </Paper>
//             </Card>

//             {/* ── JD Detail Dialog ── */}
//             <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
//                 <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 2 }}>
//                     JD Details — {selected?.jdID}
//                 </DialogTitle>
//                 {selected && (
//                     <DialogContent sx={{ pt: 3, pb: 1 }}>
//                         {/* Header */}
//                         <Box display="flex" alignItems="center" gap={2.5} mb={3} pb={3}
//                             sx={{ borderBottom: "1px solid #e0e0e0" }}>
//                             <Avatar sx={{ width: 72, height: 72, borderRadius: 3,
//                                 background: "linear-gradient(135deg, #7b1fa2, #0277bd)", flexShrink: 0 }}>
//                                 <Assignment sx={{ fontSize: 32, color: "#fff" }} />
//                             </Avatar>
//                             <Box>
//                                 <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
//                                     {selected.jobRole?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
//                                 </Typography>
//                                 <Box display="flex" alignItems="center" gap={0.6} mt={0.5}>
//                                     <Business sx={{ fontSize: 13, color: "#0277bd" }} />
//                                     <Typography fontSize={13} color="#0277bd" fontWeight={600}>{selected.companyName}</Typography>
//                                 </Box>
//                                 <Box display="flex" gap={1} mt={1} flexWrap="wrap">
//                                     <Chip label={selected.is_active ? "Active" : "Inactive"}
//                                         color={selected.is_active ? "success" : "default"}
//                                         size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                                     {selected.JDEditstatus && (
//                                         <Chip label={selected.JDEditstatus} color="info"
//                                             size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                                     )}
//                                     {selected.screeningTestPassPercentage && (
//                                         <Chip label={`Pass: ${selected.screeningTestPassPercentage}%`}
//                                             color="warning" size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                                     )}
//                                 </Box>
//                             </Box>
//                         </Box>

//                         <Grid container spacing={3}>
//                             {/* ── Basic Info ── */}
//                             <Grid item xs={12} sm={4}>
//                                 <SectionLabel>Basic Information</SectionLabel>
//                                 <DetailRow label="JD ID"       value={selected.jdID} />
//                                 <DetailRow label="Company"     value={selected.companyName} />
//                                 <DetailRow label="Experience"  value={selected.experience ? `${selected.experience} yrs` : "—"} />
//                                 <DetailRow label="Salary Range" value={selected.salaryRange} />
//                                 <DetailRow label="JD Status"   value={selected.JDEditstatus} />
//                                 <DetailRow label="Remarks"     value={selected.remarks} />
//                             </Grid>

//                             {/* ── Dates & Screening ── */}
//                             <Grid item xs={12} sm={4}>
//                                 <SectionLabel>Dates &amp; Screening</SectionLabel>
//                                 <DetailRow label="Created"       value={fmtDate(selected.creation_time)} />
//                                 <DetailRow label="Expires"       value={fmtDate(selected.expiration_time)} />
//                                 <DetailRow label="MCQ Count"     value={selected.mcq_questions_count     || 0} />
//                                 <DetailRow label="Coding Count"  value={selected.coding_questions_count  || 0} />
//                                 <DetailRow label="Screening Time" value={selected.screening_time_minutes
//                                     ? `${selected.screening_time_minutes} mins` : "—"} />
//                                 <DetailRow label="Pass %"        value={selected.screeningTestPassPercentage
//                                     ? `${selected.screeningTestPassPercentage}%` : "—"} />
//                             </Grid>

//                             {/* ── Contacts ── */}
//                             <Grid item xs={12} sm={4}>
//                                 <SectionLabel>Contacts</SectionLabel>
//                                 <DetailRow label="Hiring Manager"
//                                     value={selected.hiringManager
//                                         ? `...${String(selected.hiringManager).slice(-6)}` : "—"} />
//                                 <DetailRow label="Recruiters"
//                                     value={selected.recruiterContacts?.length
//                                         ? `${selected.recruiterContacts.length} assigned` : "—"} />
//                                 <DetailRow label="Interviewers"
//                                     value={selected.interviewerContacts?.length
//                                         ? `${selected.interviewerContacts.length} assigned` : "—"} />
//                             </Grid>
//                         </Grid>

//                         {/* ── Skills ── */}
//                         {selected.skills?.length > 0 && (
//                             <Box mt={2.5}>
//                                 <SectionLabel>Required Skills</SectionLabel>
//                                 <Box display="flex" flexWrap="wrap" gap={0.8}>
//                                     {selected.skills.map((s, i) => (
//                                         <Chip key={i} label={s} size="small" variant="outlined"
//                                             sx={{ fontSize: 11, borderColor: "#0277bd", color: "#0277bd" }} />
//                                     ))}
//                                 </Box>
//                             </Box>
//                         )}

//                         {/* ── Secondary Skills ── */}
//                         {selected.secondarySkills?.length > 0 && (
//                             <Box mt={2}>
//                                 <SectionLabel>Secondary Skills</SectionLabel>
//                                 <Box display="flex" flexWrap="wrap" gap={0.8}>
//                                     {selected.secondarySkills.map((s, i) => (
//                                         <Chip key={i} label={s} size="small" variant="outlined"
//                                             sx={{ fontSize: 11, borderColor: "#7b1fa2", color: "#7b1fa2" }} />
//                                     ))}
//                                 </Box>
//                             </Box>
//                         )}

//                         {/* ── Job Description ── */}
//                         {selected.jobDescription && (
//                             <Box mt={2.5} p={2} bgcolor="#f5f7fa" borderRadius={2} border="1px solid #e0e0e0">
//                                 <SectionLabel>Job Description</SectionLabel>
//                                 <Typography fontSize={13} lineHeight={1.8}
//                                     sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
//                                     {selected.jobDescription}
//                                 </Typography>
//                             </Box>
//                         )}
//                     </DialogContent>
//                 )}
//                 <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e0e0e0" }}>
//                     <Button onClick={() => setDetailOpen(false)}>Close</Button>
//                 </DialogActions>
//             </Dialog>
//         </Box>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  TAB 0 — JOBS (existing jobs collection)
// // ─────────────────────────────────────────────────────────────────────────────
// function JobsTab() {
//     const navigate = useNavigate();

//     const [jobs,      setJobs]      = useState([]);
//     const [clients,   setClients]   = useState([]);
//     const [loading,   setLoading]   = useState(true);
//     const [error,     setError]     = useState("");
//     const [search,    setSearch]    = useState("");
//     const [statusF,   setStatusF]   = useState("");
//     const [priorityF, setPriorityF] = useState("");
//     const [clientF,   setClientF]   = useState("");
//     const [formOpen,   setFormOpen]   = useState(false);
//     const [detailOpen, setDetailOpen] = useState(false);
//     const [deleteOpen, setDeleteOpen] = useState(false);
//     const [selected,   setSelected]   = useState(null);
//     const [formData,   setFormData]   = useState(EMPTY_FORM);
//     const [saving,     setSaving]     = useState(false);

//     const load = useCallback(async () => {
//         try { setLoading(true); setError(""); const res = await getAllJobs(); setJobs(res.data || []); }
//         catch (err) { setError(err?.message || "Failed to load jobs."); setJobs([]); }
//         finally { setLoading(false); }
//     }, []);

//     const loadClients = useCallback(async () => {
//         try { const res = await getAllClients(); setClients(res.data || []); }
//         catch { setClients([]); }
//     }, []);

//     useEffect(() => { load(); loadClients(); }, [load, loadClients]);

//     const filtered = jobs.filter((j) => {
//         const q = search.toLowerCase();
//         const matchQ = !q ||
//             j.title?.toLowerCase().includes(q)          ||
//             j.client_name?.toLowerCase().includes(q)    ||
//             j.job_id?.toLowerCase().includes(q)         ||
//             j.location?.toLowerCase().includes(q)       ||
//             j.posted_by_name?.toLowerCase().includes(q) ||
//             j.department?.toLowerCase().includes(q);
//         return matchQ &&
//             (!statusF   || j.status    === statusF)   &&
//             (!priorityF || j.priority  === priorityF) &&
//             (!clientF   || j.client_id === clientF);
//     });

//     const stats = {
//         total:        jobs.length,
//         open:         jobs.filter((j) => j.status === "Open").length,
//         critical:     jobs.filter((j) => j.priority === "Critical").length,
//         applications: jobs.reduce((s, j) => s + (j.applications || 0), 0),
//     };

//     const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
//     const openEdit   = (j) => {
//         setSelected(j);
//         setFormData({
//             ...EMPTY_FORM, ...j,
//             skills:           Array.isArray(j.skills)           ? j.skills.join(", ")           : (j.skills || ""),
//             secondary_skills: Array.isArray(j.secondary_skills) ? j.secondary_skills.join(", ") : (j.secondary_skills || ""),
//             deadline:         j.deadline ? j.deadline.split("T")[0] : "",
//         });
//         setFormOpen(true);
//     };
//     const openDetail = (j) => { setSelected(j); setDetailOpen(true); };
//     const openDelete = (j) => { setSelected(j); setDeleteOpen(true); };
//     const handleClientClick = (cid) => navigate(`/clients?highlight=${cid}`);

//     const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         if (name === "client_id") {
//             const c = clients.find((c) => c._id === value);
//             setFormData((p) => ({ ...p, client_id: value, client_name: c?.company_name || "" }));
//         } else {
//             setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
//         }
//     };

//     const handleSave = async (e) => {
//         e.preventDefault(); setSaving(true);
//         try {
//             const payload = {
//                 ...formData,
//                 skills:           formData.skills           ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)           : [],
//                 secondary_skills: formData.secondary_skills ? formData.secondary_skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
//                 openings:                   Number(formData.openings),
//                 experience_min:             Number(formData.experience_min),
//                 experience_max:             Number(formData.experience_max),
//                 salary_min:                 formData.salary_min ? Number(formData.salary_min) : 0,
//                 salary_max:                 formData.salary_max ? Number(formData.salary_max) : 0,
//                 mcq_questions_count:        Number(formData.mcq_questions_count),
//                 subjective_questions_count: Number(formData.subjective_questions_count),
//                 coding_questions_count:     Number(formData.coding_questions_count),
//                 screening_time_minutes:     Number(formData.screening_time_minutes),
//             };
//             selected ? await updateJob(selected._id, payload) : await createJob(payload);
//             setFormOpen(false); load();
//         } catch (err) { setError(err?.message || "Save failed"); }
//         finally { setSaving(false); }
//     };

//     const handleDelete = async () => {
//         try { await deleteJob(selected._id); setDeleteOpen(false); load(); }
//         catch (err) { setError(err?.message || "Delete failed"); }
//     };

//     if (loading)
//         return <Box display="flex" justifyContent="center" py={8}><CircularProgress size={48} /></Box>;

//     return (
//         <Box display="flex" flexDirection="column" gap={3}>
//             {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

//             <Box display="flex" justifyContent="flex-end">
//                 <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">Post New Job</Button>
//             </Box>

//             {/* ── Stat cards ── */}
//             <Grid container spacing={2.5}>
//                 <Grid item xs={6} md={3}><StatCard title="Total Jobs"   value={stats.total}        icon={<Work />}          color="#1a237e" sub="All time" /></Grid>
//                 <Grid item xs={6} md={3}><StatCard title="Open Jobs"    value={stats.open}         icon={<AccessTime />}    color="#0277bd" sub="Currently active" /></Grid>
//                 <Grid item xs={6} md={3}><StatCard title="Critical"     value={stats.critical}     icon={<ReportProblem />} color="#c62828" sub="Need immediate action" /></Grid>
//                 <Grid item xs={6} md={3}><StatCard title="Applications" value={stats.applications} icon={<TrendingUp />}    color="#2e7d32" sub="Total received" /></Grid>
//             </Grid>

//             {/* ── Pipeline bar ── */}
//             {jobs.length > 0 && (
//                 <Card>
//                     <CardContent sx={{ p: 3 }}>
//                         <Typography variant="h6" mb={2}>Jobs by Status</Typography>
//                         <Grid container spacing={3}>
//                             {STATUSES.map((s) => {
//                                 const count = jobs.filter((j) => j.status === s).length;
//                                 const pct   = jobs.length ? (count / jobs.length) * 100 : 0;
//                                 return (
//                                     <Grid item xs={6} md={3} key={s}>
//                                         <Box display="flex" justifyContent="space-between" mb={0.5}>
//                                             <Typography fontSize={13} fontWeight={600}>{s}</Typography>
//                                             <Typography fontSize={13} color="text.secondary">{count}</Typography>
//                                         </Box>
//                                         <LinearProgress variant="determinate" value={pct}
//                                             color={STATUS_COLOR[s] || "inherit"} sx={{ height: 8, borderRadius: 4 }} />
//                                     </Grid>
//                                 );
//                             })}
//                         </Grid>
//                     </CardContent>
//                 </Card>
//             )}

//             {/* ── Filters ── */}
//             {jobs.length > 0 && (
//                 <Box display="flex" gap={2} flexWrap="wrap">
//                     <TextField placeholder="Search by title, client, department, posted by…"
//                         value={search} onChange={(e) => setSearch(e.target.value)}
//                         size="small" sx={{ flexGrow: 1, minWidth: 240 }}
//                         InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
//                     <TextField select value={clientF} onChange={(e) => setClientF(e.target.value)} size="small" sx={{ minWidth: 180 }} label="Client">
//                         <MenuItem value="">All Clients</MenuItem>
//                         {clients.map((c) => (
//                             <MenuItem key={c._id} value={c._id}>
//                                 <Box display="flex" alignItems="center" gap={1}><Business fontSize="small" sx={{ color: "#0277bd" }} />{c.company_name}</Box>
//                             </MenuItem>
//                         ))}
//                     </TextField>
//                     <TextField select value={statusF}   onChange={(e) => setStatusF(e.target.value)}   size="small" sx={{ minWidth: 140 }} label="Status">
//                         <MenuItem value="">All Statuses</MenuItem>
//                         {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//                     </TextField>
//                     <TextField select value={priorityF} onChange={(e) => setPriorityF(e.target.value)} size="small" sx={{ minWidth: 140 }} label="Priority">
//                         <MenuItem value="">All Priorities</MenuItem>
//                         {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
//                     </TextField>
//                 </Box>
//             )}

//             {/* ── Table ── */}
//             {jobs.length === 0 && !error ? (
//                 <Card><EmptyState onAdd={openCreate} /></Card>
//             ) : (
//                 <Card>
//                     <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//                         <Table>
//                             <TableHead>
//                                 <TableRow sx={{ bgcolor: "#f5f7fa" }}>
//                                     {["Job ID", "Position", "Client", "Dept", "Type / Mode", "Experience",
//                                         "Salary", "Openings", "Deadline", "Posted By", "Screening",
//                                         "Priority", "Status", "Actions"].map((h) => (
//                                         <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
//                                     ))}
//                                 </TableRow>
//                             </TableHead>
//                             <TableBody>
//                                 {filtered.length === 0 ? (
//                                     <TableRow><TableCell colSpan={14} align="center" sx={{ py: 6, color: "text.secondary" }}>No jobs match your filters</TableCell></TableRow>
//                                 ) : filtered.map((j) => {
//                                     const daysLeft = calcDaysLeft(j.deadline);
//                                     return (
//                                         <TableRow key={j._id} hover>
//                                             <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>{j.job_id}</TableCell>
//                                             <TableCell>
//                                                 <Typography fontWeight={600} fontSize={13}>{j.title}</Typography>
//                                                 <Typography fontSize={11} color="text.secondary">{j.location}</Typography>
//                                                 {j.programming_language && (
//                                                     <Typography fontSize={11} color="text.secondary">
//                                                         {j.programming_language}{j.programming_level ? ` · ${j.programming_level}` : ""}
//                                                     </Typography>
//                                                 )}
//                                             </TableCell>
//                                             <TableCell><ClientLink name={j.client_name} onClick={() => handleClientClick(j.client_id)} /></TableCell>
//                                             <TableCell sx={{ fontSize: 12 }}>{j.department || "—"}</TableCell>
//                                             <TableCell>
//                                                 <Typography fontSize={12}>{j.job_type}</Typography>
//                                                 <Typography fontSize={11} color="text.secondary">{j.work_mode}</Typography>
//                                             </TableCell>
//                                             <TableCell sx={{ fontSize: 12 }}>{j.experience_min}–{j.experience_max} yrs</TableCell>
//                                             <TableCell sx={{ fontSize: 12 }}>{formatSalary(j.salary_min)} – {formatSalary(j.salary_max)}</TableCell>
//                                             <TableCell>
//                                                 <Box display="flex" alignItems="center" gap={0.5}>
//                                                     <Typography fontSize={13} fontWeight={600}>{j.filled || 0}</Typography>
//                                                     <Typography fontSize={11} color="text.secondary">/ {j.openings}</Typography>
//                                                 </Box>
//                                                 <LinearProgress variant="determinate"
//                                                     value={j.openings ? ((j.filled || 0) / j.openings) * 100 : 0}
//                                                     sx={{ height: 4, borderRadius: 2, mt: 0.5, bgcolor: "#e0e0e0",
//                                                          "& .MuiLinearProgress-bar": { bgcolor: "#2e7d32" } }} />
//                                             </TableCell>
//                                             <TableCell sx={{ fontSize: 12 }}>
//                                                 {daysLeft !== null ? (
//                                                     <Box>
//                                                         <Typography fontSize={13} fontWeight={600}
//                                                             color={daysLeft < 0 ? "error.main" : daysLeft <= 7 ? "warning.main" : "text.primary"}>
//                                                             {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
//                                                         </Typography>
//                                                         <Typography fontSize={11} color="text.secondary">{fmtDate(j.deadline)}</Typography>
//                                                     </Box>
//                                                 ) : "—"}
//                                             </TableCell>
//                                             <TableCell>
//                                                 <Box display="flex" alignItems="center" gap={1}>
//                                                     <Avatar sx={{ width: 26, height: 26, fontSize: 10, fontWeight: 700, bgcolor: "#e8eaf6", color: "#1a237e" }}>
//                                                         {nameInitials(j.posted_by_name)}
//                                                     </Avatar>
//                                                     <Typography fontSize={12} fontWeight={500}>{j.posted_by_name || "—"}</Typography>
//                                                 </Box>
//                                             </TableCell>
//                                             <TableCell>
//                                                 {(j.mcq_questions_count > 0 || j.subjective_questions_count > 0 || j.coding_questions_count > 0) ? (
//                                                     <Box display="flex" flexDirection="column" gap={0.3}>
//                                                         {j.mcq_questions_count       > 0 && <Box display="flex" alignItems="center" gap={0.5}><Quiz           sx={{ fontSize: 12, color: "#7b1fa2" }} /><Typography fontSize={11}>{j.mcq_questions_count} MCQ</Typography></Box>}
//                                                         {j.subjective_questions_count > 0 && <Box display="flex" alignItems="center" gap={0.5}><QuestionAnswer sx={{ fontSize: 12, color: "#0277bd" }} /><Typography fontSize={11}>{j.subjective_questions_count} Subj.</Typography></Box>}
//                                                         {j.coding_questions_count    > 0 && <Box display="flex" alignItems="center" gap={0.5}><Code           sx={{ fontSize: 12, color: "#2e7d32" }} /><Typography fontSize={11}>{j.coding_questions_count} Code</Typography></Box>}
//                                                     </Box>
//                                                 ) : <Typography fontSize={11} color="text.disabled">—</Typography>}
//                                             </TableCell>
//                                             <TableCell><Chip label={j.priority} color={PRIORITY_COLOR[j.priority] || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} /></TableCell>
//                                             <TableCell><Chip label={j.status}   color={STATUS_COLOR[j.status]     || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} /></TableCell>
//                                             <TableCell>
//                                                 <Box display="flex" gap={0.5}>
//                                                     <Tooltip title="View">  <IconButton size="small" onClick={() => openDetail(j)}><Visibility fontSize="small" /></IconButton></Tooltip>
//                                                     <Tooltip title="Edit">  <IconButton size="small" onClick={() => openEdit(j)}><Edit fontSize="small" /></IconButton></Tooltip>
//                                                     <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDelete(j)}><Delete fontSize="small" /></IconButton></Tooltip>
//                                                 </Box>
//                                             </TableCell>
//                                         </TableRow>
//                                     );
//                                 })}
//                             </TableBody>
//                         </Table>
//                     </Paper>
//                 </Card>
//             )}

//             {/* ── Detail Dialog ── */}
//             <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
//                 <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 2 }}>Job Details</DialogTitle>
//                 {selected && (
//                     <DialogContent sx={{ pt: 3, pb: 1 }}>
//                         <Box display="flex" alignItems="center" gap={2.5} mb={3} pb={3} sx={{ borderBottom: "1px solid #e0e0e0" }}>
//                             <Avatar sx={{ width: 72, height: 72, borderRadius: 3, background: "linear-gradient(135deg, #00acc1, #0277bd)", flexShrink: 0 }}>
//                                 <Work sx={{ fontSize: 32, color: "#fff" }} />
//                             </Avatar>
//                             <Box>
//                                 <Typography variant="h5" fontWeight={800} lineHeight={1.2}>{selected.title}</Typography>
//                                 <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
//                                     <ClientLink name={selected.client_name} onClick={() => { setDetailOpen(false); handleClientClick(selected.client_id); }} />
//                                     {selected.location && <Typography color="text.secondary" fontSize={13}>· {selected.location}</Typography>}
//                                 </Box>
//                                 <Box display="flex" gap={1} mt={1} flexWrap="wrap">
//                                     <Chip label={selected.status}   color={STATUS_COLOR[selected.status]     || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                                     <Chip label={`${selected.priority} Priority`} color={PRIORITY_COLOR[selected.priority] || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                                     {selected.is_active === false && <Chip label="Inactive" color="default" size="small" sx={{ fontWeight: 700, fontSize: 11 }} />}
//                                 </Box>
//                             </Box>
//                         </Box>
//                         <Grid container spacing={3}>
//                             <Grid item xs={12} sm={4}>
//                                 <SectionLabel>Job Information</SectionLabel>
//                                 <DetailRow label="Job ID"         value={selected.job_id} />
//                                 <DetailRow label="Department"     value={selected.department} />
//                                 <DetailRow label="Job Type"       value={selected.job_type} />
//                                 <DetailRow label="Work Mode"      value={selected.work_mode} />
//                                 <DetailRow label="Prog. Language" value={selected.programming_language} />
//                                 <DetailRow label="Prog. Level"    value={selected.programming_level} />
//                                 <DetailRow label="JD Status"      value={selected.jd_edit_status} />
//                                 <DetailRow label="Deadline"       value={fmtDate(selected.deadline)} />
//                             </Grid>
//                             <Grid item xs={12} sm={4}>
//                                 <SectionLabel>Requirements &amp; Compensation</SectionLabel>
//                                 <DetailRow label="Experience"     value={`${selected.experience_min}–${selected.experience_max} years`} />
//                                 <DetailRow label="Salary Range"   value={`${formatSalary(selected.salary_min)} – ${formatSalary(selected.salary_max)}`} />
//                                 <DetailRow label="Openings"       value={`${selected.filled || 0} / ${selected.openings} filled`} />
//                                 <DetailRow label="Pref. Location" value={selected.preferred_location} />
//                                 <DetailRow label="Applicants"     value={selected.applications ?? 0} />
//                                 <DetailRow label="Days Open"      value={`${selected.days_open ?? 0} days`} />
//                             </Grid>
//                             <Grid item xs={12} sm={4}>
//                                 <SectionLabel>Screening Configuration</SectionLabel>
//                                 <DetailRow label="MCQ Count"       value={selected.mcq_questions_count       || 0} />
//                                 <DetailRow label="Subjective Count" value={selected.subjective_questions_count || 0} />
//                                 <DetailRow label="Coding Count"    value={selected.coding_questions_count    || 0} />
//                                 <DetailRow label="Screening Time"  value={selected.screening_time_minutes ? `${selected.screening_time_minutes} mins` : "—"} />
//                                 <DetailRow label="Pass %"          value={selected.screening_test_pass_percentage ? `${selected.screening_test_pass_percentage}%` : "—"} />
//                             </Grid>
//                         </Grid>
//                         {selected.skills?.length > 0 && (
//                             <Box mt={2.5}><SectionLabel>Required Skills</SectionLabel>
//                                 <Box display="flex" flexWrap="wrap" gap={0.8}>
//                                     {selected.skills.map((s, i) => <Chip key={i} label={s.trim()} size="small" variant="outlined" sx={{ fontSize: 11, borderColor: "#0277bd", color: "#0277bd" }} />)}
//                                 </Box>
//                             </Box>
//                         )}
//                         {selected.secondary_skills?.length > 0 && (
//                             <Box mt={2}><SectionLabel>Secondary Skills</SectionLabel>
//                                 <Box display="flex" flexWrap="wrap" gap={0.8}>
//                                     {selected.secondary_skills.map((s, i) => <Chip key={i} label={s.trim()} size="small" variant="outlined" sx={{ fontSize: 11, borderColor: "#7b1fa2", color: "#7b1fa2" }} />)}
//                                 </Box>
//                             </Box>
//                         )}
//                         {selected.description && (
//                             <Box mt={2.5} p={2} bgcolor="#f5f7fa" borderRadius={2} border="1px solid #e0e0e0">
//                                 <SectionLabel>Job Description</SectionLabel>
//                                 <Typography fontSize={13} lineHeight={1.8} sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{selected.description}</Typography>
//                             </Box>
//                         )}
//                         {selected.remarks && (
//                             <Box mt={2} p={1.5} bgcolor="#e8f5e9" borderRadius={2} border="1px solid #a5d6a7">
//                                 <SectionLabel>Remarks</SectionLabel><Typography fontSize={13}>{selected.remarks}</Typography>
//                             </Box>
//                         )}
//                         {selected.notes && (
//                             <Box mt={2} p={1.5} bgcolor="#fff8e1" borderRadius={2} border="1px solid #ffe082">
//                                 <SectionLabel>Internal Notes</SectionLabel><Typography fontSize={13}>{selected.notes}</Typography>
//                             </Box>
//                         )}
//                     </DialogContent>
//                 )}
//                 <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #e0e0e0", justifyContent: "flex-start", gap: 1.5 }}>
//                     <Button variant="outlined" onClick={() => { setDetailOpen(false); navigate(`/resumes?job=${selected?._id}`); }} sx={{ textTransform: "none", fontWeight: 600 }}>View Candidates</Button>
//                     <Button variant="outlined" onClick={() => { setDetailOpen(false); navigate(`/tracking?job=${selected?._id}`); }} sx={{ textTransform: "none", fontWeight: 600 }}>Track Progress</Button>
//                     <Box sx={{ flex: 1 }} />
//                     <Button variant="contained" onClick={() => { setDetailOpen(false); openEdit(selected); }} sx={{ textTransform: "none", fontWeight: 700 }}>Edit Job</Button>
//                 </DialogActions>
//             </Dialog>

//             {/* ── Add / Edit Dialog ── */}
//             <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
//                 <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
//                     <Box display="flex" justifyContent="space-between" alignItems="center">
//                         <span>{selected ? "Edit Job" : "Post New Job"}</span>
//                         {!selected && (
//                             <Box display="flex" alignItems="center" gap={1} sx={{ bgcolor: "#e8eaf6", px: 1.5, py: 0.6, borderRadius: 2 }}>
//                                 <Person sx={{ fontSize: 16, color: "#1a237e" }} />
//                                 <Typography fontSize={12} fontWeight={600} color="primary.dark">Posting as: {getCurrentUserName()}</Typography>
//                             </Box>
//                         )}
//                     </Box>
//                 </DialogTitle>
//                 <form onSubmit={handleSave}>
//                     <DialogContent sx={{ pt: 3 }}>
//                         <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Basic Information</Typography>
//                         <Grid container spacing={2} mb={2}>
//                             <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Job ID" name="job_id" value={formData.job_id} onChange={handleChange} placeholder="e.g. JOB007" disabled={!!selected} /></Grid>
//                             <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Job Title" name="title" value={formData.title} onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={6}>
//                                 <TextField select fullWidth size="small" required label="Client" name="client_id" value={formData.client_id} onChange={handleChange}>
//                                     <MenuItem value="">Select Client</MenuItem>
//                                     {clients.map((c) => <MenuItem key={c._id} value={c._id}><Box display="flex" alignItems="center" gap={1}><Business fontSize="small" sx={{ color: "#0277bd" }} />{c.company_name}</Box></MenuItem>)}
//                                 </TextField>
//                             </Grid>
//                             <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Location" name="location" value={formData.location} onChange={handleChange} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Priority" name="priority" value={formData.priority} onChange={handleChange}>{PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}</TextField></Grid>
//                             <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Status"   name="status"   value={formData.status}   onChange={handleChange}>{STATUSES.map((s)   => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//                             <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Job Type" name="job_type" value={formData.job_type} onChange={handleChange}>{JOB_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
//                             <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Work Mode" name="work_mode" value={formData.work_mode} onChange={handleChange}>{WORK_MODES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField></Grid>
//                         </Grid>
//                         <Divider sx={{ my: 2 }} />
//                         <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Requirements</Typography>
//                         <Grid container spacing={2} mb={2}>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Openings"      name="openings"       value={formData.openings}       onChange={handleChange} inputProps={{ min: 1 }} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Min Exp (yrs)" name="experience_min" value={formData.experience_min} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Max Exp (yrs)" name="experience_max" value={formData.experience_max} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="date"   label="Deadline"      name="deadline"       value={formData.deadline}       onChange={handleChange} InputLabelProps={{ shrink: true }} /></Grid>
//                             <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Min Salary (₹)" name="salary_min" value={formData.salary_min} onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Max Salary (₹)" name="salary_max" value={formData.salary_max} onChange={handleChange} /></Grid>
//                             <Grid item xs={12}><TextField fullWidth multiline rows={3} size="small" label="Required Skills (comma-separated)"  name="skills"           value={formData.skills}           onChange={handleChange} placeholder="e.g. React, Node.js" /></Grid>
//                             <Grid item xs={12}><TextField fullWidth multiline rows={2} size="small" label="Secondary Skills (comma-separated)" name="secondary_skills" value={formData.secondary_skills} onChange={handleChange} placeholder="e.g. Docker, Kubernetes" /></Grid>
//                         </Grid>
//                         <Divider sx={{ my: 2 }} />
//                         <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>JD Configuration</Typography>
//                         <Grid container spacing={2} mb={2}>
//                             <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Department"          name="department"          value={formData.department}          onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Programming Language" name="programming_language" value={formData.programming_language} onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Programming Level"   name="programming_level"   value={formData.programming_level}   onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Preferred Location"  name="preferred_location"  value={formData.preferred_location}  onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="JD Edit Status"      name="jd_edit_status"      value={formData.jd_edit_status}      onChange={handleChange} placeholder="e.g. Draft, Approved" /></Grid>
//                             <Grid item xs={12} sm={4}><FormControlLabel control={<Switch checked={formData.is_active} onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))} color="success" />} label={<Typography fontSize={13}>Active JD</Typography>} sx={{ mt: 0.5 }} /></Grid>
//                         </Grid>
//                         <Divider sx={{ my: 2 }} />
//                         <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Screening Test Configuration</Typography>
//                         <Grid container spacing={2} mb={2}>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="MCQ Count"            name="mcq_questions_count"            value={formData.mcq_questions_count}            onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Subjective Count"     name="subjective_questions_count"     value={formData.subjective_questions_count}     onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Coding Count"         name="coding_questions_count"         value={formData.coding_questions_count}         onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Screening Time (mins)" name="screening_time_minutes"         value={formData.screening_time_minutes}         onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//                             <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Pass Percentage (%)" name="screening_test_pass_percentage" value={formData.screening_test_pass_percentage} onChange={handleChange} placeholder="e.g. 70" /></Grid>
//                         </Grid>
//                         <Divider sx={{ my: 2 }} />
//                         <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Description &amp; Notes</Typography>
//                         <Grid container spacing={2}>
//                             <Grid item xs={12}><TextField fullWidth multiline rows={12} size="small" label="Job Description" name="description" value={formData.description} onChange={handleChange} /></Grid>
//                             <Grid item xs={12}><TextField fullWidth multiline rows={3}  size="small" label="Remarks"         name="remarks"      value={formData.remarks}      onChange={handleChange} /></Grid>
//                             <Grid item xs={12}><TextField fullWidth multiline rows={3}  size="small" label="Internal Notes"  name="notes"        value={formData.notes}        onChange={handleChange} /></Grid>
//                         </Grid>
//                     </DialogContent>
//                     <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//                         <Button onClick={() => setFormOpen(false)}>Cancel</Button>
//                         <Button type="submit" variant="contained" disabled={saving}>
//                             {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
//                             {selected ? "Update Job" : "Post Job"}
//                         </Button>
//                     </DialogActions>
//                 </form>
//             </Dialog>

//             {/* ── Delete Dialog ── */}
//             <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
//                 <DialogTitle fontWeight={700}>Delete Job</DialogTitle>
//                 <DialogContent><Typography>Are you sure you want to delete <strong>{selected?.title}</strong>? This action cannot be undone.</Typography></DialogContent>
//                 <DialogActions sx={{ px: 3, pb: 2 }}>
//                     <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
//                     <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
//                 </DialogActions>
//             </Dialog>
//         </Box>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  ROOT — Page wrapper with tabs
// // ─────────────────────────────────────────────────────────────────────────────
// export default function Jobs() {
//     const [tab, setTab] = useState(0);

//     return (
//         <Box display="flex" flexDirection="column" gap={3}>
//             {/* ── Page header ── */}
//             <Box>
//                 <Typography variant="h4" color="primary.dark">Job Management</Typography>
//                 <Typography color="text.secondary" mt={0.5}>
//                     Track open positions, manage requirements and monitor applications
//                 </Typography>
//             </Box>

//             {/* ── Tabs ── */}
//             <Box sx={{ borderBottom: "1px solid #e0e0e0" }}>
//                 <Tabs value={tab} onChange={(_, v) => setTab(v)}
//                     sx={{ "& .MuiTab-root": { fontWeight: 600, textTransform: "none", fontSize: 14 } }}>
//                     <Tab
//                         label={
//                             <Box display="flex" alignItems="center" gap={1}>
//                                 <Work sx={{ fontSize: 18 }} />
//                                 Jobs
//                             </Box>
//                         }
//                     />
//                     <Tab
//                         label={
//                             <Box display="flex" alignItems="center" gap={1}>
//                                 <Assignment sx={{ fontSize: 18 }} />
//                                 JD Details
//                                 <Chip label="Resourcing Bot DB" size="small"
//                                     sx={{ fontSize: 10, height: 18, bgcolor: "#e8eaf6", color: "#1a237e" }} />
//                             </Box>
//                         }
//                     />
//                 </Tabs>
//             </Box>

//             {/* ── Tab content ── */}
//             {tab === 0 && <JobsTab />}
//             {tab === 1 && <JDDetailsTab />}
//         </Box>
//     );
// }













// import React, { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//     Box, Grid, Card, CardContent, Typography, Button, TextField,
//     MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
//     Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
//     Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
//     InputAdornment, Divider, LinearProgress, Switch, FormControlLabel,
//     Tabs, Tab, Accordion, AccordionSummary, AccordionDetails,
// } from "@mui/material";
// import {
//     Add, Search, Edit, Delete, Visibility, Work,
//     AccessTime, TrendingUp, ReportProblem, Person, WorkOff,
//     Business, Code, Quiz, QuestionAnswer, Assignment,
//     ExpandMore, CheckCircle, RadioButtonUnchecked,
// } from "@mui/icons-material";

// // ── API ───────────────────────────────────────────────────────────────────────
// const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

// const getHeaders = () => ({
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
// });

// const handle = async (res) => {
//     const data = await res.json();
//     if (!res.ok) throw data;
//     return data;
// };

// const getAllJobs    = (p = {}) => fetch(`${BASE}/jobs/${new URLSearchParams(p).toString() ? "?" + new URLSearchParams(p).toString() : ""}`, { headers: getHeaders() }).then(handle);
// const createJob    = (p)      => fetch(`${BASE}/jobs/`,      { method: "POST",   headers: getHeaders(), body: JSON.stringify(p) }).then(handle);
// const updateJob    = (id, p)  => fetch(`${BASE}/jobs/${id}`, { method: "PUT",    headers: getHeaders(), body: JSON.stringify(p) }).then(handle);
// const deleteJob    = (id)     => fetch(`${BASE}/jobs/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
// const getAllClients = ()       => fetch(`${BASE}/clients/`,   { headers: getHeaders() }).then(handle);

// const getAllJDs = (p = {}) => fetch(`${BASE}/jobs/jd/${new URLSearchParams(p).toString() ? "?" + new URLSearchParams(p).toString() : ""}`, { headers: getHeaders() }).then(handle);

// const getCurrentUserName = () => {
//     try {
//         const u = JSON.parse(localStorage.getItem("user") || "{}");
//         return `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Unknown";
//     } catch { return "Unknown"; }
// };

// // ── Constants ─────────────────────────────────────────────────────────────────
// const PRIORITIES = ["Low", "Medium", "High", "Critical"];
// const STATUSES   = ["Open", "On Hold", "Closed", "Filled"];
// const JOB_TYPES  = ["Full-Time", "Part-Time", "Contract", "Internship"];
// const WORK_MODES = ["On-site", "Remote", "Hybrid"];

// const PRIORITY_COLOR = { Low: "default", Medium: "info", High: "warning", Critical: "error" };
// const STATUS_COLOR   = { Open: "success", "On Hold": "warning", Closed: "default", Filled: "primary" };

// const DIFFICULTY_COLOR = {
//     Easy:   { bg: "#e8f5e9", border: "#a5d6a7", text: "#1b5e20" },
//     Medium: { bg: "#fff8e1", border: "#ffe082", text: "#e65100" },
//     Hard:   { bg: "#fce4ec", border: "#f48fb1", text: "#880e4f" },
// };

// const EMPTY_FORM = {
//     job_id: "", title: "", client_id: "", client_name: "",
//     openings: 1, job_type: "Full-Time", work_mode: "On-site",
//     location: "", experience_min: 0, experience_max: 5,
//     salary_min: "", salary_max: "", skills: "",
//     description: "", priority: "Medium", status: "Open",
//     deadline: "", notes: "",
//     programming_language: "", programming_level: "", secondary_skills: "",
//     mcq_questions_count: 0, subjective_questions_count: 0,
//     coding_questions_count: 0, screening_time_minutes: 0,
//     screening_test_pass_percentage: "",
//     department: "", preferred_location: "",
//     is_active: true, jd_edit_status: "", remarks: "",
// };

// // ── Utilities ─────────────────────────────────────────────────────────────────
// const formatSalary = (val) => {
//     if (!val) return "—";
//     if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
//     return `₹${val.toLocaleString()}`;
// };
// const nameInitials = (name = "") =>
//     name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
// const calcDaysLeft = (deadline) => {
//     if (!deadline) return null;
//     const due = new Date(deadline); const today = new Date();
//     today.setHours(0, 0, 0, 0); due.setHours(0, 0, 0, 0);
//     return Math.floor((due - today) / 86400000);
// };
// const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

// // ── Shared sub-components ─────────────────────────────────────────────────────
// const StatCard = ({ title, value, icon, color, sub }) => (
//     <Card>
//         <CardContent sx={{ p: 2.5 }}>
//             <Box display="flex" justifyContent="space-between" alignItems="flex-start">
//                 <Box>
//                     <Typography fontSize={12} color="text.secondary" fontWeight={600}
//                         textTransform="uppercase" letterSpacing="0.05em">{title}</Typography>
//                     <Typography variant="h3" fontWeight={800} mt={0.5} sx={{ color }}>{value}</Typography>
//                     {sub && <Typography fontSize={12} color="text.secondary" mt={0.5}>{sub}</Typography>}
//                 </Box>
//                 <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
//             </Box>
//         </CardContent>
//     </Card>
// );

// const EmptyState = ({ onAdd, label = "Post New Job" }) => (
//     <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10} gap={2}>
//         <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
//             <WorkOff sx={{ fontSize: 36, color: "#9fa8da" }} />
//         </Avatar>
//         <Typography variant="h6" fontWeight={700} color="text.secondary">No records found</Typography>
//         {onAdd && <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ mt: 1 }}>{label}</Button>}
//     </Box>
// );

// const DetailRow = ({ label, value }) => (
//     <Box display="flex" justifyContent="space-between" alignItems="center"
//         sx={{ py: 1, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}>
//         <Typography fontSize={13} color="text.secondary">{label}</Typography>
//         <Typography fontSize={13} fontWeight={600} color="text.primary" textAlign="right">{value ?? "—"}</Typography>
//     </Box>
// );

// const SectionLabel = ({ children }) => (
//     <Typography fontSize={11} fontWeight={700} color="text.secondary"
//         textTransform="uppercase" letterSpacing={0.8} mb={1.5}>{children}</Typography>
// );

// const ClientLink = ({ name, onClick }) => (
//     <Box display="flex" alignItems="center" gap={0.6} onClick={onClick}
//         sx={{
//             cursor: "pointer", color: "#0277bd", fontWeight: 600, fontSize: 12,
//             width: "fit-content", px: 0.8, py: 0.3, borderRadius: 1, transition: "all 0.15s",
//             "&:hover": { bgcolor: "#e3f2fd", color: "#01579b", textDecoration: "underline" },
//         }}>
//         <Business sx={{ fontSize: 13, flexShrink: 0 }} />{name || "—"}
//     </Box>
// );

// // ── Question bank components ───────────────────────────────────────────────────

// /**
//  * MCQQuestionCard
//  * Renders a single MCQ question with all options.
//  * Correct answer(s) are highlighted green.
//  * Supports both single (string) and multi-select (array) correct_answer formats.
//  */
// const MCQQuestionCard = ({ question: q, index }) => {
//     const correctAnswers = Array.isArray(q.correct_answer)
//         ? q.correct_answer.map(String)
//         : [String(q.correct_answer || "")];
//     const isMulti = correctAnswers.length > 1;

//     return (
//         <Box sx={{
//             border: "1px solid #e0e0e0", borderRadius: 2,
//             overflow: "hidden", bgcolor: "#fff",
//         }}>
//             {/* Question header */}
//             <Box sx={{ bgcolor: "#f5f7fa", px: 2, py: 1.5,
//                 borderBottom: "1px solid #e0e0e0",
//                 display: "flex", alignItems: "flex-start", gap: 1.5 }}>
//                 <Chip label={`Q${index + 1}`} size="small"
//                     sx={{ bgcolor: "#7b1fa2", color: "#fff", fontWeight: 700,
//                           fontSize: 11, height: 20, flexShrink: 0, mt: 0.2 }} />
//                 {isMulti && (
//                     <Chip label="Multi-select" size="small"
//                         sx={{ bgcolor: "#e8eaf6", color: "#1a237e", fontWeight: 600,
//                               fontSize: 10, height: 20, flexShrink: 0, mt: 0.2 }} />
//                 )}
//                 <Typography fontSize={13} fontWeight={600} color="text.primary" lineHeight={1.5}>
//                     {q.question}
//                 </Typography>
//             </Box>

//             {/* Options */}
//             <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.8 }}>
//                 {q.options?.map((opt, j) => {
//                     const isCorrect = correctAnswers.includes(String(opt));
//                     return (
//                         <Box key={j} display="flex" alignItems="center" gap={1.2}
//                             sx={{
//                                 px: 1.5, py: 0.8, borderRadius: 1.5,
//                                 bgcolor:     isCorrect ? "#e8f5e9" : "#fafafa",
//                                 border:      isCorrect ? "1.5px solid #a5d6a7" : "1px solid #eeeeee",
//                                 transition:  "all 0.1s",
//                             }}>
//                             {isCorrect
//                                 ? <CheckCircle sx={{ fontSize: 16, color: "#2e7d32", flexShrink: 0 }} />
//                                 : <RadioButtonUnchecked sx={{ fontSize: 16, color: "#bdbdbd", flexShrink: 0 }} />
//                             }
//                             <Typography fontSize={12}
//                                 color={isCorrect ? "#1b5e20" : "text.secondary"}
//                                 fontWeight={isCorrect ? 600 : 400}
//                                 sx={{ flex: 1 }}>
//                                 {opt}
//                             </Typography>
//                             {isCorrect && (
//                                 <Chip label="✓ Correct" size="small"
//                                     sx={{ fontSize: 10, height: 18,
//                                           bgcolor: "#2e7d32", color: "#fff",
//                                           fontWeight: 700, ml: "auto" }} />
//                             )}
//                         </Box>
//                     );
//                 })}
//             </Box>
//         </Box>
//     );
// };

// /**
//  * SubjectiveQuestionCard
//  * Renders a single subjective question with reference answer, key points,
//  * skill tag, and difficulty badge.
//  */
// const SubjectiveQuestionCard = ({ question: q, index }) => {
//     const diffStyle = DIFFICULTY_COLOR[q.difficulty] || DIFFICULTY_COLOR["Medium"];
//     return (
//         <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
//             {/* Header */}
//             <Box sx={{ bgcolor: "#f5f7fa", px: 2, py: 1.5,
//                 borderBottom: "1px solid #e0e0e0",
//                 display: "flex", alignItems: "flex-start", gap: 1.5, flexWrap: "wrap" }}>
//                 <Chip label={`Q${index + 1}`} size="small"
//                     sx={{ bgcolor: "#0277bd", color: "#fff", fontWeight: 700,
//                           fontSize: 11, height: 20, flexShrink: 0, mt: 0.2 }} />
//                 {q.skill && (
//                     <Chip label={q.skill} size="small" variant="outlined"
//                         sx={{ fontSize: 10, height: 20, borderColor: "#0277bd",
//                               color: "#0277bd", fontWeight: 600, flexShrink: 0, mt: 0.2 }} />
//                 )}
//                 {q.difficulty && (
//                     <Chip label={q.difficulty} size="small"
//                         sx={{ fontSize: 10, height: 20, fontWeight: 700,
//                               bgcolor: diffStyle.bg, color: diffStyle.text,
//                               border: `1px solid ${diffStyle.border}`,
//                               flexShrink: 0, mt: 0.2 }} />
//                 )}
//                 <Typography fontSize={13} fontWeight={600} color="text.primary"
//                     lineHeight={1.5} sx={{ flex: 1 }}>
//                     {q.question}
//                 </Typography>
//             </Box>

//             <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
//                 {/* Reference Answer */}
//                 {q.reference_answer && (
//                     <Box>
//                         <Typography fontSize={11} fontWeight={700} color="#2e7d32"
//                             textTransform="uppercase" letterSpacing={0.5} mb={0.5}>
//                             Reference Answer
//                         </Typography>
//                         <Box sx={{ bgcolor: "#e8f5e9", border: "1px solid #a5d6a7",
//                             borderRadius: 1.5, px: 1.5, py: 1 }}>
//                             <Typography fontSize={12} color="#1b5e20" lineHeight={1.7}
//                                 sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
//                                 {q.reference_answer}
//                             </Typography>
//                         </Box>
//                     </Box>
//                 )}

//                 {/* Key Points */}
//                 {q.key_points && (
//                     <Box>
//                         <Typography fontSize={11} fontWeight={700} color="#e65100"
//                             textTransform="uppercase" letterSpacing={0.5} mb={0.5}>
//                             Key Points
//                         </Typography>
//                         <Box sx={{ bgcolor: "#fff8e1", border: "1px solid #ffe082",
//                             borderRadius: 1.5, px: 1.5, py: 1 }}>
//                             <Typography fontSize={12} color="#bf360c" lineHeight={1.7}
//                                 sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
//                                 {q.key_points}
//                             </Typography>
//                         </Box>
//                     </Box>
//                 )}
//             </Box>
//         </Box>
//     );
// };

// /**
//  * CodingQuestionCard
//  * Renders a single coding problem in a dark terminal-style block.
//  * The question text is stored as a raw string with markdown-style formatting.
//  */
// const CodingQuestionCard = ({ question: q, index }) => (
//     <Box sx={{ border: "1px solid #3d3d5c", borderRadius: 2, overflow: "hidden" }}>
//         {/* Dark header bar */}
//         <Box sx={{ bgcolor: "#2d2d3f", px: 2, py: 1,
//             display: "flex", alignItems: "center", gap: 1.5,
//             borderBottom: "1px solid #3d3d5c" }}>
//             <Box display="flex" gap={0.6}>
//                 {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
//                     <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />
//                 ))}
//             </Box>
//             <Code sx={{ fontSize: 14, color: "#82aaff" }} />
//             <Typography fontSize={12} fontWeight={700} color="#82aaff">
//                 Problem {index + 1}
//             </Typography>
//             <Chip label={`Code`} size="small"
//                 sx={{ fontSize: 10, height: 18, bgcolor: "#1e1e2e",
//                       color: "#c3e88d", border: "1px solid #3d3d5c",
//                       fontWeight: 600, ml: "auto" }} />
//         </Box>

//         {/* Problem statement */}
//         <Box sx={{ bgcolor: "#1e1e2e", px: 2.5, py: 2 }}>
//             <Typography fontSize={12} color="#cdd6f4" lineHeight={1.9}
//                 sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word",
//                       fontFamily: "'Fira Code', 'Consolas', monospace" }}>
//                 {typeof q === "string" ? q : q.question || JSON.stringify(q)}
//             </Typography>
//         </Box>
//     </Box>
// );

// // ── Question section wrapper ───────────────────────────────────────────────────
// const QuestionSection = ({ icon, title, color, count, bankCount, children }) => (
//     <Box mt={3}>
//         <Box display="flex" alignItems="center" gap={1.5} mb={2}
//             pb={1.5} sx={{ borderBottom: "2px solid #f0f0f0" }}>
//             <Avatar sx={{ width: 32, height: 32, bgcolor: `${color}18`, color }}>
//                 {icon}
//             </Avatar>
//             <Typography fontSize={14} fontWeight={700} color="text.primary">
//                 {title}
//             </Typography>
//             <Chip label={`${bankCount} in bank`} size="small"
//                 sx={{ fontSize: 10, height: 20, bgcolor: `${color}18`, color,
//                       fontWeight: 600 }} />
//             {count > 0 && (
//                 <Chip label={`${count} per test`} size="small" variant="outlined"
//                     sx={{ fontSize: 10, height: 20, borderColor: color, color,
//                           fontWeight: 600 }} />
//             )}
//         </Box>
//         <Box display="flex" flexDirection="column" gap={1.5}>
//             {children}
//         </Box>
//     </Box>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// //  TAB 1 — JD DETAILS (resourcing bot DB)
// // ─────────────────────────────────────────────────────────────────────────────
// function JDDetailsTab() {
//     const [jds,        setJDs]        = useState([]);
//     const [loading,    setLoading]    = useState(true);
//     const [error,      setError]      = useState("");
//     const [search,     setSearch]     = useState("");
//     const [activeF,    setActiveF]    = useState("");
//     const [detailOpen, setDetailOpen] = useState(false);
//     const [selected,   setSelected]   = useState(null);

//     const load = useCallback(async () => {
//         try {
//             setLoading(true); setError("");
//             const res = await getAllJDs();
//             setJDs(res.data || []);
//         } catch (err) { setError(err?.message || "Failed to load JD details."); setJDs([]); }
//         finally { setLoading(false); }
//     }, []);

//     useEffect(() => { load(); }, [load]);

//     const filtered = jds.filter((j) => {
//         const q = search.toLowerCase();
//         const matchQ = !q ||
//             j.jdID?.toLowerCase().includes(q)        ||
//             j.companyName?.toLowerCase().includes(q) ||
//             j.jobRole?.toLowerCase().includes(q);
//         const matchA = activeF === ""       ? true
//                      : activeF === "active" ? j.is_active === true
//                      :                        j.is_active === false;
//         return matchQ && matchA;
//     });

//     const stats = {
//         total:  jds.length,
//         active: jds.filter((j) => j.is_active).length,
//         exp:    jds.filter((j) => j.expiration_time && new Date(j.expiration_time) < new Date()).length,
//     };

//     if (loading)
//         return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

//     return (
//         <Box display="flex" flexDirection="column" gap={3}>
//             {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

//             {/* ── Stat cards ── */}
//             <Grid container spacing={2.5}>
//                 <Grid item xs={6} md={4}>
//                     <StatCard title="Total JDs"   value={stats.total}  icon={<Assignment />} color="#1a237e" sub="All time" />
//                 </Grid>
//                 <Grid item xs={6} md={4}>
//                     <StatCard title="Active JDs"  value={stats.active} icon={<AccessTime />} color="#2e7d32" sub="Currently active" />
//                 </Grid>
//                 <Grid item xs={6} md={4}>
//                     <StatCard title="Expired JDs" value={stats.exp}    icon={<ReportProblem />} color="#c62828" sub="Past expiry date" />
//                 </Grid>
//             </Grid>

//             {/* ── Filters ── */}
//             <Box display="flex" gap={2} flexWrap="wrap">
//                 <TextField placeholder="Search by JD ID, company"
//                     value={search} onChange={(e) => setSearch(e.target.value)}
//                     size="small" sx={{ flexGrow: 1, minWidth: 240 }}
//                     InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
//                 <TextField select value={activeF} onChange={(e) => setActiveF(e.target.value)}
//                     size="small" sx={{ minWidth: 150 }} label="Status">
//                     <MenuItem value="">All</MenuItem>
//                     <MenuItem value="active">Active</MenuItem>
//                     <MenuItem value="inactive">Inactive</MenuItem>
//                 </TextField>
//             </Box>

//             {/* ── Table ── */}
//             <Card>
//                 <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//                     <Table>
//                         <TableHead>
//                             <TableRow sx={{ bgcolor: "#f5f7fa" }}>
//                                 {["JD ID", "Company", "Job Role", "Experience", "Salary Range",
//                                     "Skills", "Screening", "Created", "Expires", "Status", "Actions"].map((h) => (
//                                     <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
//                                 ))}
//                             </TableRow>
//                         </TableHead>
//                         <TableBody>
//                             {filtered.length === 0 ? (
//                                 <TableRow>
//                                     <TableCell colSpan={11} align="center" sx={{ py: 6, color: "text.secondary" }}>
//                                         No JD details match your filters
//                                     </TableCell>
//                                 </TableRow>
//                             ) : filtered.map((j) => (
//                                 <TableRow key={j._id} hover>
//                                     <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>{j.jdID}</TableCell>
//                                     <TableCell>
//                                         <Box display="flex" alignItems="center" gap={0.6}>
//                                             <Business sx={{ fontSize: 13, color: "#0277bd" }} />
//                                             <Typography fontSize={13} fontWeight={600}>{j.companyName}</Typography>
//                                         </Box>
//                                     </TableCell>
//                                     <TableCell sx={{ fontSize: 13 }}>
//                                         {j.jobRole?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "—"}
//                                     </TableCell>
//                                     <TableCell sx={{ fontSize: 12 }}>{j.experience ? `${j.experience} yrs` : "—"}</TableCell>
//                                     <TableCell sx={{ fontSize: 12 }}>{j.salaryRange || "—"}</TableCell>
//                                     <TableCell>
//                                         <Box display="flex" flexWrap="wrap" gap={0.5} maxWidth={180}>
//                                             {j.skills?.slice(0, 3).map((s, i) => (
//                                                 <Chip key={i} label={s} size="small" variant="outlined"
//                                                     sx={{ fontSize: 10, borderColor: "#0277bd", color: "#0277bd" }} />
//                                             ))}
//                                             {j.skills?.length > 3 && (
//                                                 <Chip label={`+${j.skills.length - 3}`} size="small" sx={{ fontSize: 10 }} />
//                                             )}
//                                         </Box>
//                                     </TableCell>
//                                     <TableCell>
//                                         <Box display="flex" flexDirection="column" gap={0.3}>
//                                             {j.mcq_questions_count > 0 && (
//                                                 <Box display="flex" alignItems="center" gap={0.5}>
//                                                     <Quiz sx={{ fontSize: 12, color: "#7b1fa2" }} />
//                                                     <Typography fontSize={11}>{j.mcq_questions_count} MCQ</Typography>
//                                                 </Box>
//                                             )}
//                                             {j.subjective_questions?.length > 0 && (
//                                                 <Box display="flex" alignItems="center" gap={0.5}>
//                                                     <QuestionAnswer sx={{ fontSize: 12, color: "#0277bd" }} />
//                                                     <Typography fontSize={11}>{j.subjective_questions.length} Subj.</Typography>
//                                                 </Box>
//                                             )}
//                                             {j.coding_questions_count > 0 && (
//                                                 <Box display="flex" alignItems="center" gap={0.5}>
//                                                     <Code sx={{ fontSize: 12, color: "#2e7d32" }} />
//                                                     <Typography fontSize={11}>{j.coding_questions_count} Code</Typography>
//                                                 </Box>
//                                             )}
//                                             {j.screening_time_minutes > 0 && (
//                                                 <Typography fontSize={10} color="text.secondary">{j.screening_time_minutes} mins</Typography>
//                                             )}
//                                         </Box>
//                                     </TableCell>
//                                     <TableCell sx={{ fontSize: 11, color: "text.secondary" }}>{fmtDate(j.creation_time)}</TableCell>
//                                     <TableCell>
//                                         {j.expiration_time ? (
//                                             <Typography fontSize={11}
//                                                 color={new Date(j.expiration_time) < new Date() ? "error.main" : "text.secondary"}>
//                                                 {fmtDate(j.expiration_time)}
//                                             </Typography>
//                                         ) : "—"}
//                                     </TableCell>
//                                     <TableCell>
//                                         <Chip label={j.is_active ? "Active" : "Inactive"}
//                                             color={j.is_active ? "success" : "default"}
//                                             size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                                     </TableCell>
//                                     <TableCell>
//                                         <Tooltip title="View Details">
//                                             <IconButton size="small" onClick={() => { setSelected(j); setDetailOpen(true); }}>
//                                                 <Visibility fontSize="small" />
//                                             </IconButton>
//                                         </Tooltip>
//                                     </TableCell>
//                                 </TableRow>
//                             ))}
//                         </TableBody>
//                     </Table>
//                 </Paper>
//             </Card>

//             {/* ════════════════════════════════════════════════════════════════
//                 JD DETAIL DIALOG
//                 Shows: Basic info / Screening config / Skills / Description /
//                        MCQ Questions / Subjective Questions / Coding Questions
//             ════════════════════════════════════════════════════════════════ */}
//             <Dialog open={detailOpen} onClose={() => setDetailOpen(false)}
//                 maxWidth="lg" fullWidth
//                 PaperProps={{ sx: { maxHeight: "92vh" } }}>
//                 <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 2 }}>
//                     <Box display="flex" justifyContent="space-between" alignItems="center">
//                         <span>JD Details — {selected?.jdID}</span>
//                         <Box display="flex" gap={1}>
//                             {selected?.mcq_questions?.length > 0 && (
//                                 <Chip icon={<Quiz sx={{ fontSize: 13 }} />}
//                                     label={`${selected.mcq_questions.length} MCQ`}
//                                     size="small" sx={{ bgcolor: "#f3e5f5", color: "#7b1fa2", fontWeight: 700 }} />
//                             )}
//                             {selected?.subjective_questions?.length > 0 && (
//                                 <Chip icon={<QuestionAnswer sx={{ fontSize: 13 }} />}
//                                     label={`${selected.subjective_questions.length} Subjective`}
//                                     size="small" sx={{ bgcolor: "#e3f2fd", color: "#0277bd", fontWeight: 700 }} />
//                             )}
//                             {selected?.coding_questions?.length > 0 && (
//                                 <Chip icon={<Code sx={{ fontSize: 13 }} />}
//                                     label={`${selected.coding_questions.length} Coding`}
//                                     size="small" sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 700 }} />
//                             )}
//                         </Box>
//                     </Box>
//                 </DialogTitle>

//                 {selected && (
//                     <DialogContent sx={{ pt: 3, pb: 1 }}>

//                         {/* ── Header block ── */}
//                         <Box display="flex" alignItems="center" gap={2.5} mb={3} pb={3}
//                             sx={{ borderBottom: "1px solid #e0e0e0" }}>
//                             <Avatar sx={{ width: 72, height: 72, borderRadius: 3,
//                                 background: "linear-gradient(135deg, #7b1fa2, #0277bd)", flexShrink: 0 }}>
//                                 <Assignment sx={{ fontSize: 32, color: "#fff" }} />
//                             </Avatar>
//                             <Box>
//                                 <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
//                                     {selected.jobRole?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
//                                 </Typography>
//                                 <Box display="flex" alignItems="center" gap={0.6} mt={0.5}>
//                                     <Business sx={{ fontSize: 13, color: "#0277bd" }} />
//                                     <Typography fontSize={13} color="#0277bd" fontWeight={600}>{selected.companyName}</Typography>
//                                 </Box>
//                                 <Box display="flex" gap={1} mt={1} flexWrap="wrap">
//                                     <Chip label={selected.is_active ? "Active" : "Inactive"}
//                                         color={selected.is_active ? "success" : "default"}
//                                         size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                                     {selected.JDEditstatus && (
//                                         <Chip label={selected.JDEditstatus} color="info"
//                                             size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                                     )}
//                                     {selected.screeningTestPassPercentage && (
//                                         <Chip label={`Pass: ${selected.screeningTestPassPercentage}%`}
//                                             color="warning" size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                                     )}
//                                 </Box>
//                             </Box>
//                         </Box>

//                         {/* ── Info grid ── */}
//                         <Grid container spacing={3}>
//                             <Grid item xs={12} sm={4}>
//                                 <SectionLabel>Basic Information</SectionLabel>
//                                 <DetailRow label="JD ID"        value={selected.jdID} />
//                                 <DetailRow label="Company"      value={selected.companyName} />
//                                 <DetailRow label="Experience"   value={selected.experience ? `${selected.experience} yrs` : "—"} />
//                                 <DetailRow label="Salary Range" value={selected.salaryRange} />
//                                 <DetailRow label="JD Status"    value={selected.JDEditstatus} />
//                                 <DetailRow label="Remarks"      value={selected.remarks} />
//                             </Grid>
//                             <Grid item xs={12} sm={4}>
//                                 <SectionLabel>Dates &amp; Screening</SectionLabel>
//                                 <DetailRow label="Created"       value={fmtDate(selected.creation_time)} />
//                                 <DetailRow label="Expires"       value={fmtDate(selected.expiration_time)} />
//                                 <DetailRow label="MCQ / Test"    value={`${selected.mcq_questions_count || 0} per test / ${selected.mcq_questions?.length || 0} in bank`} />
//                                 <DetailRow label="Coding / Test" value={`${selected.coding_questions_count || 0} per test / ${selected.coding_questions?.length || 0} in bank`} />
//                                 <DetailRow label="Subj. bank"    value={selected.subjective_questions?.length || 0} />
//                                 <DetailRow label="Screening Time" value={selected.screening_time_minutes ? `${selected.screening_time_minutes} mins` : "—"} />
//                                 <DetailRow label="Pass %"        value={selected.screeningTestPassPercentage ? `${selected.screeningTestPassPercentage}%` : "—"} />
//                             </Grid>
//                             <Grid item xs={12} sm={4}>
//                                 <SectionLabel>Contacts</SectionLabel>
//                                 <DetailRow label="Hiring Manager"
//                                     value={selected.hiringManager ? `...${String(selected.hiringManager).slice(-6)}` : "—"} />
//                                 <DetailRow label="Recruiters"
//                                     value={selected.recruiterContacts?.length ? `${selected.recruiterContacts.length} assigned` : "—"} />
//                                 <DetailRow label="Interviewers"
//                                     value={selected.interviewerContacts?.length ? `${selected.interviewerContacts.length} assigned` : "—"} />
//                             </Grid>
//                         </Grid>

//                         {/* ── Skills ── */}
//                         {selected.skills?.length > 0 && (
//                             <Box mt={2.5}>
//                                 <SectionLabel>Required Skills</SectionLabel>
//                                 <Box display="flex" flexWrap="wrap" gap={0.8}>
//                                     {selected.skills.map((s, i) => (
//                                         <Chip key={i} label={s} size="small" variant="outlined"
//                                             sx={{ fontSize: 11, borderColor: "#0277bd", color: "#0277bd" }} />
//                                     ))}
//                                 </Box>
//                             </Box>
//                         )}

//                         {selected.secondarySkills?.length > 0 && (
//                             <Box mt={2}>
//                                 <SectionLabel>Secondary Skills</SectionLabel>
//                                 <Box display="flex" flexWrap="wrap" gap={0.8}>
//                                     {selected.secondarySkills.map((s, i) => (
//                                         <Chip key={i} label={s} size="small" variant="outlined"
//                                             sx={{ fontSize: 11, borderColor: "#7b1fa2", color: "#7b1fa2" }} />
//                                     ))}
//                                 </Box>
//                             </Box>
//                         )}

//                         {/* ── Job Description ── */}
//                         {selected.jobDescription && (
//                             <Box mt={2.5} p={2} bgcolor="#f5f7fa" borderRadius={2} border="1px solid #e0e0e0">
//                                 <SectionLabel>Job Description</SectionLabel>
//                                 <Typography fontSize={13} lineHeight={1.8}
//                                     sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
//                                     {selected.jobDescription}
//                                 </Typography>
//                             </Box>
//                         )}

//                         <Divider sx={{ my: 3 }} />

//                         {/* ════════════════════════════════════════════════════
//                             MCQ QUESTIONS
//                         ════════════════════════════════════════════════════ */}
//                         {selected.mcq_questions?.length > 0 && (
//                             <QuestionSection
//                                 icon={<Quiz sx={{ fontSize: 18 }} />}
//                                 title="MCQ Questions"
//                                 color="#7b1fa2"
//                                 count={selected.mcq_questions_count || 0}
//                                 bankCount={selected.mcq_questions.length}>
//                                 {selected.mcq_questions.map((q, i) => (
//                                     <MCQQuestionCard key={i} question={q} index={i} />
//                                 ))}
//                             </QuestionSection>
//                         )}

//                         {/* ════════════════════════════════════════════════════
//                             SUBJECTIVE QUESTIONS
//                             Fields: question, reference_answer, key_points, skill, difficulty
//                         ════════════════════════════════════════════════════ */}
//                         {selected.subjective_questions?.length > 0 && (
//                             <QuestionSection
//                                 icon={<QuestionAnswer sx={{ fontSize: 18 }} />}
//                                 title="Subjective Questions"
//                                 color="#0277bd"
//                                 count={0}
//                                 bankCount={selected.subjective_questions.length}>
//                                 {selected.subjective_questions.map((q, i) => (
//                                     <SubjectiveQuestionCard key={i} question={q} index={i} />
//                                 ))}
//                             </QuestionSection>
//                         )}

//                         {/* ════════════════════════════════════════════════════
//                             CODING QUESTIONS
//                         ════════════════════════════════════════════════════ */}
//                         {selected.coding_questions?.length > 0 && (
//                             <QuestionSection
//                                 icon={<Code sx={{ fontSize: 18 }} />}
//                                 title="Coding Questions"
//                                 color="#2e7d32"
//                                 count={selected.coding_questions_count || 0}
//                                 bankCount={selected.coding_questions.length}>
//                                 {selected.coding_questions.map((q, i) => (
//                                     <CodingQuestionCard key={i} question={q} index={i} />
//                                 ))}
//                             </QuestionSection>
//                         )}

//                     </DialogContent>
//                 )}

//                 <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e0e0e0" }}>
//                     <Button onClick={() => setDetailOpen(false)} variant="outlined">Close</Button>
//                 </DialogActions>
//             </Dialog>
//         </Box>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  TAB 0 — JOBS (existing jobs collection) — unchanged
// // ─────────────────────────────────────────────────────────────────────────────
// function JobsTab() {
//     const navigate = useNavigate();

//     const [jobs,      setJobs]      = useState([]);
//     const [clients,   setClients]   = useState([]);
//     const [loading,   setLoading]   = useState(true);
//     const [error,     setError]     = useState("");
//     const [search,    setSearch]    = useState("");
//     const [statusF,   setStatusF]   = useState("");
//     const [priorityF, setPriorityF] = useState("");
//     const [clientF,   setClientF]   = useState("");
//     const [formOpen,   setFormOpen]   = useState(false);
//     const [detailOpen, setDetailOpen] = useState(false);
//     const [deleteOpen, setDeleteOpen] = useState(false);
//     const [selected,   setSelected]   = useState(null);
//     const [formData,   setFormData]   = useState(EMPTY_FORM);
//     const [saving,     setSaving]     = useState(false);

//     const load = useCallback(async () => {
//         try { setLoading(true); setError(""); const res = await getAllJobs(); setJobs(res.data || []); }
//         catch (err) { setError(err?.message || "Failed to load jobs."); setJobs([]); }
//         finally { setLoading(false); }
//     }, []);

//     const loadClients = useCallback(async () => {
//         try { const res = await getAllClients(); setClients(res.data || []); }
//         catch { setClients([]); }
//     }, []);

//     useEffect(() => { load(); loadClients(); }, [load, loadClients]);

//     const filtered = jobs.filter((j) => {
//         const q = search.toLowerCase();
//         const matchQ = !q ||
//             j.title?.toLowerCase().includes(q)          ||
//             j.client_name?.toLowerCase().includes(q)    ||
//             j.job_id?.toLowerCase().includes(q)         ||
//             j.location?.toLowerCase().includes(q)       ||
//             j.posted_by_name?.toLowerCase().includes(q) ||
//             j.department?.toLowerCase().includes(q);
//         return matchQ &&
//             (!statusF   || j.status    === statusF)   &&
//             (!priorityF || j.priority  === priorityF) &&
//             (!clientF   || j.client_id === clientF);
//     });

//     const stats = {
//         total:        jobs.length,
//         open:         jobs.filter((j) => j.status === "Open").length,
//         critical:     jobs.filter((j) => j.priority === "Critical").length,
//         applications: jobs.reduce((s, j) => s + (j.applications || 0), 0),
//     };

//     const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
//     const openEdit   = (j) => {
//         setSelected(j);
//         setFormData({
//             ...EMPTY_FORM, ...j,
//             skills:           Array.isArray(j.skills)           ? j.skills.join(", ")           : (j.skills || ""),
//             secondary_skills: Array.isArray(j.secondary_skills) ? j.secondary_skills.join(", ") : (j.secondary_skills || ""),
//             deadline:         j.deadline ? j.deadline.split("T")[0] : "",
//         });
//         setFormOpen(true);
//     };
//     const openDetail = (j) => { setSelected(j); setDetailOpen(true); };
//     const openDelete = (j) => { setSelected(j); setDeleteOpen(true); };
//     const handleClientClick = (cid) => navigate(`/clients?highlight=${cid}`);

//     const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         if (name === "client_id") {
//             const c = clients.find((c) => c._id === value);
//             setFormData((p) => ({ ...p, client_id: value, client_name: c?.company_name || "" }));
//         } else {
//             setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
//         }
//     };

//     const handleSave = async (e) => {
//         e.preventDefault(); setSaving(true);
//         try {
//             const payload = {
//                 ...formData,
//                 skills:           formData.skills           ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)           : [],
//                 secondary_skills: formData.secondary_skills ? formData.secondary_skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
//                 openings:                   Number(formData.openings),
//                 experience_min:             Number(formData.experience_min),
//                 experience_max:             Number(formData.experience_max),
//                 salary_min:                 formData.salary_min ? Number(formData.salary_min) : 0,
//                 salary_max:                 formData.salary_max ? Number(formData.salary_max) : 0,
//                 mcq_questions_count:        Number(formData.mcq_questions_count),
//                 subjective_questions_count: Number(formData.subjective_questions_count),
//                 coding_questions_count:     Number(formData.coding_questions_count),
//                 screening_time_minutes:     Number(formData.screening_time_minutes),
//             };
//             selected ? await updateJob(selected._id, payload) : await createJob(payload);
//             setFormOpen(false); load();
//         } catch (err) { setError(err?.message || "Save failed"); }
//         finally { setSaving(false); }
//     };

//     const handleDelete = async () => {
//         try { await deleteJob(selected._id); setDeleteOpen(false); load(); }
//         catch (err) { setError(err?.message || "Delete failed"); }
//     };

//     if (loading)
//         return <Box display="flex" justifyContent="center" py={8}><CircularProgress size={48} /></Box>;

//     return (
//         <Box display="flex" flexDirection="column" gap={3}>
//             {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

//             <Box display="flex" justifyContent="flex-end">
//                 <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">Post New Job</Button>
//             </Box>

//             <Grid container spacing={2.5}>
//                 <Grid item xs={6} md={3}><StatCard title="Total Jobs"   value={stats.total}        icon={<Work />}          color="#1a237e" sub="All time" /></Grid>
//                 <Grid item xs={6} md={3}><StatCard title="Open Jobs"    value={stats.open}         icon={<AccessTime />}    color="#0277bd" sub="Currently active" /></Grid>
//                 <Grid item xs={6} md={3}><StatCard title="Critical"     value={stats.critical}     icon={<ReportProblem />} color="#c62828" sub="Need immediate action" /></Grid>
//                 <Grid item xs={6} md={3}><StatCard title="Applications" value={stats.applications} icon={<TrendingUp />}    color="#2e7d32" sub="Total received" /></Grid>
//             </Grid>

//             {jobs.length > 0 && (
//                 <Card>
//                     <CardContent sx={{ p: 3 }}>
//                         <Typography variant="h6" mb={2}>Jobs by Status</Typography>
//                         <Grid container spacing={3}>
//                             {STATUSES.map((s) => {
//                                 const count = jobs.filter((j) => j.status === s).length;
//                                 const pct   = jobs.length ? (count / jobs.length) * 100 : 0;
//                                 return (
//                                     <Grid item xs={6} md={3} key={s}>
//                                         <Box display="flex" justifyContent="space-between" mb={0.5}>
//                                             <Typography fontSize={13} fontWeight={600}>{s}</Typography>
//                                             <Typography fontSize={13} color="text.secondary">{count}</Typography>
//                                         </Box>
//                                         <LinearProgress variant="determinate" value={pct}
//                                             color={STATUS_COLOR[s] || "inherit"} sx={{ height: 8, borderRadius: 4 }} />
//                                     </Grid>
//                                 );
//                             })}
//                         </Grid>
//                     </CardContent>
//                 </Card>
//             )}

//             {jobs.length > 0 && (
//                 <Box display="flex" gap={2} flexWrap="wrap">
//                     <TextField placeholder="Search by title, client, department, posted by…"
//                         value={search} onChange={(e) => setSearch(e.target.value)}
//                         size="small" sx={{ flexGrow: 1, minWidth: 240 }}
//                         InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
//                     <TextField select value={clientF} onChange={(e) => setClientF(e.target.value)} size="small" sx={{ minWidth: 180 }} label="Client">
//                         <MenuItem value="">All Clients</MenuItem>
//                         {clients.map((c) => (
//                             <MenuItem key={c._id} value={c._id}>
//                                 <Box display="flex" alignItems="center" gap={1}><Business fontSize="small" sx={{ color: "#0277bd" }} />{c.company_name}</Box>
//                             </MenuItem>
//                         ))}
//                     </TextField>
//                     <TextField select value={statusF}   onChange={(e) => setStatusF(e.target.value)}   size="small" sx={{ minWidth: 140 }} label="Status">
//                         <MenuItem value="">All Statuses</MenuItem>
//                         {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//                     </TextField>
//                     <TextField select value={priorityF} onChange={(e) => setPriorityF(e.target.value)} size="small" sx={{ minWidth: 140 }} label="Priority">
//                         <MenuItem value="">All Priorities</MenuItem>
//                         {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
//                     </TextField>
//                 </Box>
//             )}

//             {jobs.length === 0 && !error ? (
//                 <Card><EmptyState onAdd={openCreate} /></Card>
//             ) : (
//                 <Card>
//                     <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//                         <Table>
//                             <TableHead>
//                                 <TableRow sx={{ bgcolor: "#f5f7fa" }}>
//                                     {["Job ID", "Position", "Client", "Dept", "Type / Mode", "Experience",
//                                         "Salary", "Openings", "Deadline", "Posted By", "Screening",
//                                         "Priority", "Status", "Actions"].map((h) => (
//                                         <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
//                                     ))}
//                                 </TableRow>
//                             </TableHead>
//                             <TableBody>
//                                 {filtered.length === 0 ? (
//                                     <TableRow><TableCell colSpan={14} align="center" sx={{ py: 6, color: "text.secondary" }}>No jobs match your filters</TableCell></TableRow>
//                                 ) : filtered.map((j) => {
//                                     const daysLeft = calcDaysLeft(j.deadline);
//                                     return (
//                                         <TableRow key={j._id} hover>
//                                             <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>{j.job_id}</TableCell>
//                                             <TableCell>
//                                                 <Typography fontWeight={600} fontSize={13}>{j.title}</Typography>
//                                                 <Typography fontSize={11} color="text.secondary">{j.location}</Typography>
//                                                 {j.programming_language && (
//                                                     <Typography fontSize={11} color="text.secondary">
//                                                         {j.programming_language}{j.programming_level ? ` · ${j.programming_level}` : ""}
//                                                     </Typography>
//                                                 )}
//                                             </TableCell>
//                                             <TableCell><ClientLink name={j.client_name} onClick={() => handleClientClick(j.client_id)} /></TableCell>
//                                             <TableCell sx={{ fontSize: 12 }}>{j.department || "—"}</TableCell>
//                                             <TableCell>
//                                                 <Typography fontSize={12}>{j.job_type}</Typography>
//                                                 <Typography fontSize={11} color="text.secondary">{j.work_mode}</Typography>
//                                             </TableCell>
//                                             <TableCell sx={{ fontSize: 12 }}>{j.experience_min}–{j.experience_max} yrs</TableCell>
//                                             <TableCell sx={{ fontSize: 12 }}>{formatSalary(j.salary_min)} – {formatSalary(j.salary_max)}</TableCell>
//                                             <TableCell>
//                                                 <Box display="flex" alignItems="center" gap={0.5}>
//                                                     <Typography fontSize={13} fontWeight={600}>{j.filled || 0}</Typography>
//                                                     <Typography fontSize={11} color="text.secondary">/ {j.openings}</Typography>
//                                                 </Box>
//                                                 <LinearProgress variant="determinate"
//                                                     value={j.openings ? ((j.filled || 0) / j.openings) * 100 : 0}
//                                                     sx={{ height: 4, borderRadius: 2, mt: 0.5, bgcolor: "#e0e0e0",
//                                                          "& .MuiLinearProgress-bar": { bgcolor: "#2e7d32" } }} />
//                                             </TableCell>
//                                             <TableCell sx={{ fontSize: 12 }}>
//                                                 {daysLeft !== null ? (
//                                                     <Box>
//                                                         <Typography fontSize={13} fontWeight={600}
//                                                             color={daysLeft < 0 ? "error.main" : daysLeft <= 7 ? "warning.main" : "text.primary"}>
//                                                             {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
//                                                         </Typography>
//                                                         <Typography fontSize={11} color="text.secondary">{fmtDate(j.deadline)}</Typography>
//                                                     </Box>
//                                                 ) : "—"}
//                                             </TableCell>
//                                             <TableCell>
//                                                 <Box display="flex" alignItems="center" gap={1}>
//                                                     <Avatar sx={{ width: 26, height: 26, fontSize: 10, fontWeight: 700, bgcolor: "#e8eaf6", color: "#1a237e" }}>
//                                                         {nameInitials(j.posted_by_name)}
//                                                     </Avatar>
//                                                     <Typography fontSize={12} fontWeight={500}>{j.posted_by_name || "—"}</Typography>
//                                                 </Box>
//                                             </TableCell>
//                                             <TableCell>
//                                                 {(j.mcq_questions_count > 0 || j.subjective_questions_count > 0 || j.coding_questions_count > 0) ? (
//                                                     <Box display="flex" flexDirection="column" gap={0.3}>
//                                                         {j.mcq_questions_count       > 0 && <Box display="flex" alignItems="center" gap={0.5}><Quiz           sx={{ fontSize: 12, color: "#7b1fa2" }} /><Typography fontSize={11}>{j.mcq_questions_count} MCQ</Typography></Box>}
//                                                         {j.subjective_questions_count > 0 && <Box display="flex" alignItems="center" gap={0.5}><QuestionAnswer sx={{ fontSize: 12, color: "#0277bd" }} /><Typography fontSize={11}>{j.subjective_questions_count} Subj.</Typography></Box>}
//                                                         {j.coding_questions_count    > 0 && <Box display="flex" alignItems="center" gap={0.5}><Code           sx={{ fontSize: 12, color: "#2e7d32" }} /><Typography fontSize={11}>{j.coding_questions_count} Code</Typography></Box>}
//                                                     </Box>
//                                                 ) : <Typography fontSize={11} color="text.disabled">—</Typography>}
//                                             </TableCell>
//                                             <TableCell><Chip label={j.priority} color={PRIORITY_COLOR[j.priority] || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} /></TableCell>
//                                             <TableCell><Chip label={j.status}   color={STATUS_COLOR[j.status]     || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} /></TableCell>
//                                             <TableCell>
//                                                 <Box display="flex" gap={0.5}>
//                                                     <Tooltip title="View">  <IconButton size="small" onClick={() => openDetail(j)}><Visibility fontSize="small" /></IconButton></Tooltip>
//                                                     <Tooltip title="Edit">  <IconButton size="small" onClick={() => openEdit(j)}><Edit fontSize="small" /></IconButton></Tooltip>
//                                                     <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDelete(j)}><Delete fontSize="small" /></IconButton></Tooltip>
//                                                 </Box>
//                                             </TableCell>
//                                         </TableRow>
//                                     );
//                                 })}
//                             </TableBody>
//                         </Table>
//                     </Paper>
//                 </Card>
//             )}

//             {/* ── Job Detail Dialog ── */}
//             <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
//                 <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 2 }}>Job Details</DialogTitle>
//                 {selected && (
//                     <DialogContent sx={{ pt: 3, pb: 1 }}>
//                         <Box display="flex" alignItems="center" gap={2.5} mb={3} pb={3} sx={{ borderBottom: "1px solid #e0e0e0" }}>
//                             <Avatar sx={{ width: 72, height: 72, borderRadius: 3, background: "linear-gradient(135deg, #00acc1, #0277bd)", flexShrink: 0 }}>
//                                 <Work sx={{ fontSize: 32, color: "#fff" }} />
//                             </Avatar>
//                             <Box>
//                                 <Typography variant="h5" fontWeight={800} lineHeight={1.2}>{selected.title}</Typography>
//                                 <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
//                                     <ClientLink name={selected.client_name} onClick={() => { setDetailOpen(false); handleClientClick(selected.client_id); }} />
//                                     {selected.location && <Typography color="text.secondary" fontSize={13}>· {selected.location}</Typography>}
//                                 </Box>
//                                 <Box display="flex" gap={1} mt={1} flexWrap="wrap">
//                                     <Chip label={selected.status}   color={STATUS_COLOR[selected.status]     || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                                     <Chip label={`${selected.priority} Priority`} color={PRIORITY_COLOR[selected.priority] || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                                 </Box>
//                             </Box>
//                         </Box>
//                         <Grid container spacing={3}>
//                             <Grid item xs={12} sm={4}>
//                                 <SectionLabel>Job Information</SectionLabel>
//                                 <DetailRow label="Job ID"         value={selected.job_id} />
//                                 <DetailRow label="Department"     value={selected.department} />
//                                 <DetailRow label="Job Type"       value={selected.job_type} />
//                                 <DetailRow label="Work Mode"      value={selected.work_mode} />
//                                 <DetailRow label="Prog. Language" value={selected.programming_language} />
//                                 <DetailRow label="Prog. Level"    value={selected.programming_level} />
//                                 <DetailRow label="JD Status"      value={selected.jd_edit_status} />
//                                 <DetailRow label="Deadline"       value={fmtDate(selected.deadline)} />
//                             </Grid>
//                             <Grid item xs={12} sm={4}>
//                                 <SectionLabel>Requirements &amp; Compensation</SectionLabel>
//                                 <DetailRow label="Experience"     value={`${selected.experience_min}–${selected.experience_max} years`} />
//                                 <DetailRow label="Salary Range"   value={`${formatSalary(selected.salary_min)} – ${formatSalary(selected.salary_max)}`} />
//                                 <DetailRow label="Openings"       value={`${selected.filled || 0} / ${selected.openings} filled`} />
//                                 <DetailRow label="Pref. Location" value={selected.preferred_location} />
//                                 <DetailRow label="Applicants"     value={selected.applications ?? 0} />
//                                 <DetailRow label="Days Open"      value={`${selected.days_open ?? 0} days`} />
//                             </Grid>
//                             <Grid item xs={12} sm={4}>
//                                 <SectionLabel>Screening Configuration</SectionLabel>
//                                 <DetailRow label="MCQ Count"       value={selected.mcq_questions_count       || 0} />
//                                 <DetailRow label="Subjective Count" value={selected.subjective_questions_count || 0} />
//                                 <DetailRow label="Coding Count"    value={selected.coding_questions_count    || 0} />
//                                 <DetailRow label="Screening Time"  value={selected.screening_time_minutes ? `${selected.screening_time_minutes} mins` : "—"} />
//                                 <DetailRow label="Pass %"          value={selected.screening_test_pass_percentage ? `${selected.screening_test_pass_percentage}%` : "—"} />
//                             </Grid>
//                         </Grid>
//                         {selected.skills?.length > 0 && (
//                             <Box mt={2.5}><SectionLabel>Required Skills</SectionLabel>
//                                 <Box display="flex" flexWrap="wrap" gap={0.8}>
//                                     {selected.skills.map((s, i) => <Chip key={i} label={s.trim()} size="small" variant="outlined" sx={{ fontSize: 11, borderColor: "#0277bd", color: "#0277bd" }} />)}
//                                 </Box>
//                             </Box>
//                         )}
//                         {selected.description && (
//                             <Box mt={2.5} p={2} bgcolor="#f5f7fa" borderRadius={2} border="1px solid #e0e0e0">
//                                 <SectionLabel>Job Description</SectionLabel>
//                                 <Typography fontSize={13} lineHeight={1.8} sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{selected.description}</Typography>
//                             </Box>
//                         )}
//                         {selected.remarks && (
//                             <Box mt={2} p={1.5} bgcolor="#e8f5e9" borderRadius={2} border="1px solid #a5d6a7">
//                                 <SectionLabel>Remarks</SectionLabel><Typography fontSize={13}>{selected.remarks}</Typography>
//                             </Box>
//                         )}
//                     </DialogContent>
//                 )}
//                 <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #e0e0e0", justifyContent: "flex-start", gap: 1.5 }}>
//                     <Button variant="outlined" onClick={() => { setDetailOpen(false); navigate(`/resumes?job=${selected?._id}`); }} sx={{ textTransform: "none", fontWeight: 600 }}>View Candidates</Button>
//                     <Button variant="outlined" onClick={() => { setDetailOpen(false); navigate(`/tracking?job=${selected?._id}`); }} sx={{ textTransform: "none", fontWeight: 600 }}>Track Progress</Button>
//                     <Box sx={{ flex: 1 }} />
//                     <Button variant="contained" onClick={() => { setDetailOpen(false); openEdit(selected); }} sx={{ textTransform: "none", fontWeight: 700 }}>Edit Job</Button>
//                 </DialogActions>
//             </Dialog>

//             {/* ── Add / Edit Dialog ── */}
//             <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
//                 <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
//                     <Box display="flex" justifyContent="space-between" alignItems="center">
//                         <span>{selected ? "Edit Job" : "Post New Job"}</span>
//                         {!selected && (
//                             <Box display="flex" alignItems="center" gap={1} sx={{ bgcolor: "#e8eaf6", px: 1.5, py: 0.6, borderRadius: 2 }}>
//                                 <Person sx={{ fontSize: 16, color: "#1a237e" }} />
//                                 <Typography fontSize={12} fontWeight={600} color="primary.dark">Posting as: {getCurrentUserName()}</Typography>
//                             </Box>
//                         )}
//                     </Box>
//                 </DialogTitle>
//                 <form onSubmit={handleSave}>
//                     <DialogContent sx={{ pt: 3 }}>
//                         <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Basic Information</Typography>
//                         <Grid container spacing={2} mb={2}>
//                             <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Job ID" name="job_id" value={formData.job_id} onChange={handleChange} placeholder="e.g. JOB007" disabled={!!selected} /></Grid>
//                             <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Job Title" name="title" value={formData.title} onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={6}>
//                                 <TextField select fullWidth size="small" required label="Client" name="client_id" value={formData.client_id} onChange={handleChange}>
//                                     <MenuItem value="">Select Client</MenuItem>
//                                     {clients.map((c) => <MenuItem key={c._id} value={c._id}><Box display="flex" alignItems="center" gap={1}><Business fontSize="small" sx={{ color: "#0277bd" }} />{c.company_name}</Box></MenuItem>)}
//                                 </TextField>
//                             </Grid>
//                             <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Location" name="location" value={formData.location} onChange={handleChange} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Priority" name="priority" value={formData.priority} onChange={handleChange}>{PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}</TextField></Grid>
//                             <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Status"   name="status"   value={formData.status}   onChange={handleChange}>{STATUSES.map((s)   => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//                             <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Job Type" name="job_type" value={formData.job_type} onChange={handleChange}>{JOB_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
//                             <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Work Mode" name="work_mode" value={formData.work_mode} onChange={handleChange}>{WORK_MODES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField></Grid>
//                         </Grid>
//                         <Divider sx={{ my: 2 }} />
//                         <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Requirements</Typography>
//                         <Grid container spacing={2} mb={2}>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Openings" name="openings" value={formData.openings} onChange={handleChange} inputProps={{ min: 1 }} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Min Exp (yrs)" name="experience_min" value={formData.experience_min} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Max Exp (yrs)" name="experience_max" value={formData.experience_max} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="date" label="Deadline" name="deadline" value={formData.deadline} onChange={handleChange} InputLabelProps={{ shrink: true }} /></Grid>
//                             <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Min Salary (₹)" name="salary_min" value={formData.salary_min} onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Max Salary (₹)" name="salary_max" value={formData.salary_max} onChange={handleChange} /></Grid>
//                             <Grid item xs={12}><TextField fullWidth multiline rows={3} size="small" label="Required Skills (comma-separated)" name="skills" value={formData.skills} onChange={handleChange} /></Grid>
//                             <Grid item xs={12}><TextField fullWidth multiline rows={2} size="small" label="Secondary Skills (comma-separated)" name="secondary_skills" value={formData.secondary_skills} onChange={handleChange} /></Grid>
//                         </Grid>
//                         <Divider sx={{ my: 2 }} />
//                         <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>JD Configuration</Typography>
//                         <Grid container spacing={2} mb={2}>
//                             <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Department" name="department" value={formData.department} onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Programming Language" name="programming_language" value={formData.programming_language} onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Programming Level" name="programming_level" value={formData.programming_level} onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Preferred Location" name="preferred_location" value={formData.preferred_location} onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="JD Edit Status" name="jd_edit_status" value={formData.jd_edit_status} onChange={handleChange} /></Grid>
//                             <Grid item xs={12} sm={4}><FormControlLabel control={<Switch checked={formData.is_active} onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))} color="success" />} label={<Typography fontSize={13}>Active JD</Typography>} sx={{ mt: 0.5 }} /></Grid>
//                         </Grid>
//                         <Divider sx={{ my: 2 }} />
//                         <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Screening Test Configuration</Typography>
//                         <Grid container spacing={2} mb={2}>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="MCQ Count" name="mcq_questions_count" value={formData.mcq_questions_count} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Subjective Count" name="subjective_questions_count" value={formData.subjective_questions_count} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Coding Count" name="coding_questions_count" value={formData.coding_questions_count} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//                             <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Screening Time (mins)" name="screening_time_minutes" value={formData.screening_time_minutes} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//                             <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Pass Percentage (%)" name="screening_test_pass_percentage" value={formData.screening_test_pass_percentage} onChange={handleChange} /></Grid>
//                         </Grid>
//                         <Divider sx={{ my: 2 }} />
//                         <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Description &amp; Notes</Typography>
//                         <Grid container spacing={2}>
//                             <Grid item xs={12}><TextField fullWidth multiline rows={12} size="small" label="Job Description" name="description" value={formData.description} onChange={handleChange} /></Grid>
//                             <Grid item xs={12}><TextField fullWidth multiline rows={3} size="small" label="Remarks" name="remarks" value={formData.remarks} onChange={handleChange} /></Grid>
//                             <Grid item xs={12}><TextField fullWidth multiline rows={3} size="small" label="Internal Notes" name="notes" value={formData.notes} onChange={handleChange} /></Grid>
//                         </Grid>
//                     </DialogContent>
//                     <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//                         <Button onClick={() => setFormOpen(false)}>Cancel</Button>
//                         <Button type="submit" variant="contained" disabled={saving}>
//                             {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
//                             {selected ? "Update Job" : "Post Job"}
//                         </Button>
//                     </DialogActions>
//                 </form>
//             </Dialog>

//             {/* ── Delete Dialog ── */}
//             <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
//                 <DialogTitle fontWeight={700}>Delete Job</DialogTitle>
//                 <DialogContent><Typography>Are you sure you want to delete <strong>{selected?.title}</strong>? This action cannot be undone.</Typography></DialogContent>
//                 <DialogActions sx={{ px: 3, pb: 2 }}>
//                     <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
//                     <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
//                 </DialogActions>
//             </Dialog>
//         </Box>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  ROOT — Page wrapper with tabs
// // ─────────────────────────────────────────────────────────────────────────────
// export default function Jobs() {
//     const [tab, setTab] = useState(0);
//     return (
//         <Box display="flex" flexDirection="column" gap={3}>
//             <Box>
//                 <Typography variant="h4" color="primary.dark">Job Management</Typography>
//                 <Typography color="text.secondary" mt={0.5}>
//                     Track open positions, manage requirements and monitor applications
//                 </Typography>
//             </Box>
//             <Box sx={{ borderBottom: "1px solid #e0e0e0" }}>
//                 <Tabs value={tab} onChange={(_, v) => setTab(v)}
//                     sx={{ "& .MuiTab-root": { fontWeight: 600, textTransform: "none", fontSize: 14 } }}>
//                     <Tab label={<Box display="flex" alignItems="center" gap={1}><Work sx={{ fontSize: 18 }} />Jobs</Box>} />
//                     <Tab label={
//                         <Box display="flex" alignItems="center" gap={1}>
//                             <Assignment sx={{ fontSize: 18 }} />
//                             JD Details
//                             <Chip label="Resourcing Bot DB" size="small"
//                                 sx={{ fontSize: 10, height: 18, bgcolor: "#e8eaf6", color: "#1a237e" }} />
//                         </Box>
//                     } />
//                 </Tabs>
//             </Box>
//             {tab === 0 && <JobsTab />}
//             {tab === 1 && <JDDetailsTab />}
//         </Box>
//     );
// }


















// import React, { useState, useEffect, useCallback } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import {
//     Box, Grid, Card, CardContent, Typography, Button, TextField,
//     MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
//     Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
//     Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
//     InputAdornment, Divider, LinearProgress, Switch, FormControlLabel,
//     Tabs, Tab,
// } from "@mui/material";
// import {
//     Add, Search, Edit, Delete, Visibility, Work,
//     AccessTime, TrendingUp, ReportProblem, Person, WorkOff,
//     Business, Code, Quiz, QuestionAnswer, Assignment,
//     CheckCircle, RadioButtonUnchecked, FilterList, Close as CloseIcon,
// } from "@mui/icons-material";

// const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
// const getHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });
// const handle = async (res) => { const data = await res.json(); if (!res.ok) throw data; return data; };

// const getAllJobs    = (p = {}) => fetch(`${BASE}/jobs/${new URLSearchParams(p).toString() ? "?" + new URLSearchParams(p).toString() : ""}`, { headers: getHeaders() }).then(handle);
// const createJob    = (p)      => fetch(`${BASE}/jobs/`,      { method: "POST",   headers: getHeaders(), body: JSON.stringify(p) }).then(handle);
// const updateJob    = (id, p)  => fetch(`${BASE}/jobs/${id}`, { method: "PUT",    headers: getHeaders(), body: JSON.stringify(p) }).then(handle);
// const deleteJob    = (id)     => fetch(`${BASE}/jobs/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
// const getAllClients = ()       => fetch(`${BASE}/clients/`,   { headers: getHeaders() }).then(handle);
// const getAllJDs     = (p = {}) => fetch(`${BASE}/jobs/jd/${new URLSearchParams(p).toString() ? "?" + new URLSearchParams(p).toString() : ""}`, { headers: getHeaders() }).then(handle);
// const getCurrentUserName = () => { try { const u = JSON.parse(localStorage.getItem("user") || "{}"); return `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Unknown"; } catch { return "Unknown"; } };

// const PRIORITIES = ["Low", "Medium", "High", "Critical"];
// const STATUSES   = ["Open", "On Hold", "Closed", "Filled"];
// const JOB_TYPES  = ["Full-Time", "Part-Time", "Contract", "Internship"];
// const WORK_MODES = ["On-site", "Remote", "Hybrid"];
// const PRIORITY_COLOR = { Low: "default", Medium: "info", High: "warning", Critical: "error" };
// const STATUS_COLOR   = { Open: "success", "On Hold": "warning", Closed: "default", Filled: "primary" };
// const DIFFICULTY_COLOR = { Easy: { bg: "#e8f5e9", border: "#a5d6a7", text: "#1b5e20" }, Medium: { bg: "#fff8e1", border: "#ffe082", text: "#e65100" }, Hard: { bg: "#fce4ec", border: "#f48fb1", text: "#880e4f" } };

// const EMPTY_FORM = {
//     job_id: "", title: "", client_id: "", client_name: "", openings: 1, job_type: "Full-Time", work_mode: "On-site",
//     location: "", experience_min: 0, experience_max: 5, salary_min: "", salary_max: "", skills: "",
//     description: "", priority: "Medium", status: "Open", deadline: "", notes: "",
//     programming_language: "", programming_level: "", secondary_skills: "",
//     mcq_questions_count: 0, subjective_questions_count: 0, coding_questions_count: 0,
//     screening_time_minutes: 0, screening_test_pass_percentage: "",
//     department: "", preferred_location: "", is_active: true, jd_edit_status: "", remarks: "",
// };

// const formatSalary = (val) => { if (!val) return "—"; if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`; return `₹${val.toLocaleString()}`; };
// const nameInitials = (name = "") => name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
// const calcDaysLeft = (deadline) => { if (!deadline) return null; const due = new Date(deadline); const today = new Date(); today.setHours(0,0,0,0); due.setHours(0,0,0,0); return Math.floor((due - today) / 86400000); };
// const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

// const StatCard = ({ title, value, icon, color, sub }) => (
//     <Card><CardContent sx={{ p: 2.5 }}>
//         <Box display="flex" justifyContent="space-between" alignItems="flex-start">
//             <Box><Typography fontSize={12} color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em">{title}</Typography>
//                 <Typography variant="h3" fontWeight={800} mt={0.5} sx={{ color }}>{value}</Typography>
//                 {sub && <Typography fontSize={12} color="text.secondary" mt={0.5}>{sub}</Typography>}
//             </Box>
//             <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
//         </Box>
//     </CardContent></Card>
// );

// const EmptyState = ({ onAdd }) => (
//     <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10} gap={2}>
//         <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}><WorkOff sx={{ fontSize: 36, color: "#9fa8da" }} /></Avatar>
//         <Typography variant="h6" fontWeight={700} color="text.secondary">No records found</Typography>
//         {onAdd && <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ mt: 1 }}>Post New Job</Button>}
//     </Box>
// );
// // const WorkOff = WorkOff || (() => null);

// const DetailRow = ({ label, value }) => (
//     <Box display="flex" justifyContent="space-between" alignItems="center"
//         sx={{ py: 1, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}>
//         <Typography fontSize={13} color="text.secondary">{label}</Typography>
//         <Typography fontSize={13} fontWeight={600} color="text.primary" textAlign="right">{value ?? "—"}</Typography>
//     </Box>
// );
// const SectionLabel = ({ children }) => (
//     <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} mb={1.5}>{children}</Typography>
// );
// const ClientLink = ({ name, onClick }) => (
//     <Box display="flex" alignItems="center" gap={0.6} onClick={onClick}
//         sx={{ cursor: "pointer", color: "#0277bd", fontWeight: 600, fontSize: 12, width: "fit-content", px: 0.8, py: 0.3, borderRadius: 1, "&:hover": { bgcolor: "#e3f2fd" } }}>
//         <Business sx={{ fontSize: 13, flexShrink: 0 }} />{name || "—"}
//     </Box>
// );

// // ── Client filter banner ──────────────────────────────────────────────────────
// const ClientFilterBanner = ({ name, onClear }) => (
//     <Alert severity="info" icon={<FilterList fontSize="small" />}
//         action={<Chip label="Show all clients" size="small" variant="outlined" onDelete={onClear} onClick={onClear} deleteIcon={<CloseIcon />} sx={{ fontSize: 11, cursor: "pointer" }} />}
//         sx={{ py: 0.5 }}>
//         Showing jobs for <strong>{name}</strong>
//     </Alert>
// );

// // ── MCQ / Subjective / Coding question cards (unchanged from your original) ───
// const MCQQuestionCard = ({ question: q, index }) => {
//     const correctAnswers = Array.isArray(q.correct_answer) ? q.correct_answer.map(String) : [String(q.correct_answer || "")];
//     const isMulti = correctAnswers.length > 1;
//     return (
//         <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
//             <Box sx={{ bgcolor: "#f5f7fa", px: 2, py: 1.5, borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "flex-start", gap: 1.5 }}>
//                 <Chip label={`Q${index + 1}`} size="small" sx={{ bgcolor: "#7b1fa2", color: "#fff", fontWeight: 700, fontSize: 11, height: 20, flexShrink: 0, mt: 0.2 }} />
//                 {isMulti && <Chip label="Multi-select" size="small" sx={{ bgcolor: "#e8eaf6", color: "#1a237e", fontWeight: 600, fontSize: 10, height: 20, flexShrink: 0, mt: 0.2 }} />}
//                 <Typography fontSize={13} fontWeight={600} color="text.primary" lineHeight={1.5}>{q.question}</Typography>
//             </Box>
//             <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.8 }}>
//                 {q.options?.map((opt, j) => { const isCorrect = correctAnswers.includes(String(opt)); return (
//                     <Box key={j} display="flex" alignItems="center" gap={1.2}
//                         sx={{ px: 1.5, py: 0.8, borderRadius: 1.5, bgcolor: isCorrect ? "#e8f5e9" : "#fafafa", border: isCorrect ? "1.5px solid #a5d6a7" : "1px solid #eeeeee" }}>
//                         {isCorrect ? <CheckCircle sx={{ fontSize: 16, color: "#2e7d32", flexShrink: 0 }} /> : <RadioButtonUnchecked sx={{ fontSize: 16, color: "#bdbdbd", flexShrink: 0 }} />}
//                         <Typography fontSize={12} color={isCorrect ? "#1b5e20" : "text.secondary"} fontWeight={isCorrect ? 600 : 400} sx={{ flex: 1 }}>{opt}</Typography>
//                         {isCorrect && <Chip label="✓ Correct" size="small" sx={{ fontSize: 10, height: 18, bgcolor: "#2e7d32", color: "#fff", fontWeight: 700, ml: "auto" }} />}
//                     </Box>
//                 ); })}
//             </Box>
//         </Box>
//     );
// };
// const SubjectiveQuestionCard = ({ question: q, index }) => {
//     const diffStyle = DIFFICULTY_COLOR[q.difficulty] || DIFFICULTY_COLOR["Medium"];
//     return (
//         <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
//             <Box sx={{ bgcolor: "#f5f7fa", px: 2, py: 1.5, borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "flex-start", gap: 1.5, flexWrap: "wrap" }}>
//                 <Chip label={`Q${index + 1}`} size="small" sx={{ bgcolor: "#0277bd", color: "#fff", fontWeight: 700, fontSize: 11, height: 20, flexShrink: 0, mt: 0.2 }} />
//                 {q.skill && <Chip label={q.skill} size="small" variant="outlined" sx={{ fontSize: 10, height: 20, borderColor: "#0277bd", color: "#0277bd", fontWeight: 600, flexShrink: 0, mt: 0.2 }} />}
//                 {q.difficulty && <Chip label={q.difficulty} size="small" sx={{ fontSize: 10, height: 20, fontWeight: 700, bgcolor: diffStyle.bg, color: diffStyle.text, border: `1px solid ${diffStyle.border}`, flexShrink: 0, mt: 0.2 }} />}
//                 <Typography fontSize={13} fontWeight={600} color="text.primary" lineHeight={1.5} sx={{ flex: 1 }}>{q.question}</Typography>
//             </Box>
//             <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
//                 {q.reference_answer && <Box><Typography fontSize={11} fontWeight={700} color="#2e7d32" textTransform="uppercase" letterSpacing={0.5} mb={0.5}>Reference Answer</Typography><Box sx={{ bgcolor: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 1.5, px: 1.5, py: 1 }}><Typography fontSize={12} color="#1b5e20" lineHeight={1.7} sx={{ whiteSpace: "pre-wrap" }}>{q.reference_answer}</Typography></Box></Box>}
//                 {q.key_points && <Box><Typography fontSize={11} fontWeight={700} color="#e65100" textTransform="uppercase" letterSpacing={0.5} mb={0.5}>Key Points</Typography><Box sx={{ bgcolor: "#fff8e1", border: "1px solid #ffe082", borderRadius: 1.5, px: 1.5, py: 1 }}><Typography fontSize={12} color="#bf360c" lineHeight={1.7} sx={{ whiteSpace: "pre-wrap" }}>{q.key_points}</Typography></Box></Box>}
//             </Box>
//         </Box>
//     );
// };
// const CodingQuestionCard = ({ question: q, index }) => (
//     <Box sx={{ border: "1px solid #3d3d5c", borderRadius: 2, overflow: "hidden" }}>
//         <Box sx={{ bgcolor: "#2d2d3f", px: 2, py: 1, display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid #3d3d5c" }}>
//             <Box display="flex" gap={0.6}>{["#ff5f57","#febc2e","#28c840"].map(c => <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />)}</Box>
//             <Code sx={{ fontSize: 14, color: "#82aaff" }} /><Typography fontSize={12} fontWeight={700} color="#82aaff">Problem {index + 1}</Typography>
//         </Box>
//         <Box sx={{ bgcolor: "#1e1e2e", px: 2.5, py: 2 }}>
//             <Typography fontSize={12} color="#cdd6f4" lineHeight={1.9} sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'Fira Code','Consolas',monospace" }}>{typeof q === "string" ? q : q.question || JSON.stringify(q)}</Typography>
//         </Box>
//     </Box>
// );
// const QuestionSection = ({ icon, title, color, count, bankCount, children }) => (
//     <Box mt={3}>
//         <Box display="flex" alignItems="center" gap={1.5} mb={2} pb={1.5} sx={{ borderBottom: "2px solid #f0f0f0" }}>
//             <Avatar sx={{ width: 32, height: 32, bgcolor: `${color}18`, color }}>{icon}</Avatar>
//             <Typography fontSize={14} fontWeight={700} color="text.primary">{title}</Typography>
//             <Chip label={`${bankCount} in bank`} size="small" sx={{ fontSize: 10, height: 20, bgcolor: `${color}18`, color, fontWeight: 600 }} />
//             {count > 0 && <Chip label={`${count} per test`} size="small" variant="outlined" sx={{ fontSize: 10, height: 20, borderColor: color, color, fontWeight: 600 }} />}
//         </Box>
//         <Box display="flex" flexDirection="column" gap={1.5}>{children}</Box>
//     </Box>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// //  TAB 1 — JD Details (unchanged)
// // ─────────────────────────────────────────────────────────────────────────────
// function JDDetailsTab() {
//     const [jds, setJDs] = useState([]); const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(""); const [search, setSearch] = useState("");
//     const [activeF, setActiveF] = useState(""); const [detailOpen, setDetailOpen] = useState(false); const [selected, setSelected] = useState(null);
//     const load = useCallback(async () => { try { setLoading(true); setError(""); const res = await getAllJDs(); setJDs(res.data || []); } catch (err) { setError(err?.message || "Failed to load JD details."); setJDs([]); } finally { setLoading(false); } }, []);
//     useEffect(() => { load(); }, [load]);
//     const filtered = jds.filter(j => { const q = search.toLowerCase(); const mQ = !q || j.jdID?.toLowerCase().includes(q) || j.companyName?.toLowerCase().includes(q) || j.jobRole?.toLowerCase().includes(q); const mA = activeF === "" ? true : activeF === "active" ? j.is_active === true : j.is_active === false; return mQ && mA; });
//     const stats = { total: jds.length, active: jds.filter(j => j.is_active).length, exp: jds.filter(j => j.expiration_time && new Date(j.expiration_time) < new Date()).length };
//     if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
//     return (
//         <Box display="flex" flexDirection="column" gap={3}>
//             {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
//             <Grid container spacing={2.5}>
//                 <Grid item xs={6} md={4}><StatCard title="Total JDs"   value={stats.total}  icon={<Assignment />} color="#1a237e" sub="All time" /></Grid>
//                 <Grid item xs={6} md={4}><StatCard title="Active JDs"  value={stats.active} icon={<AccessTime />} color="#2e7d32" sub="Currently active" /></Grid>
//                 <Grid item xs={6} md={4}><StatCard title="Expired JDs" value={stats.exp}    icon={<ReportProblem />} color="#c62828" sub="Past expiry" /></Grid>
//             </Grid>
//             <Box display="flex" gap={2} flexWrap="wrap">
//                 <TextField placeholder="Search by JD ID, company" value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 240 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
//                 <TextField select value={activeF} onChange={e => setActiveF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Status"><MenuItem value="">All</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem></TextField>
//             </Box>
//             <Card><Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//                 <Table><TableHead><TableRow sx={{ bgcolor: "#f5f7fa" }}>{["JD ID","Company","Job Role","Experience","Skills","Screening","Created","Expires","Status","Actions"].map(h => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>)}</TableRow></TableHead>
//                     <TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>No JD details match your filters</TableCell></TableRow>
//                         : filtered.map(j => (
//                             <TableRow key={j._id} hover>
//                                 <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>{j.jdID}</TableCell>
//                                 <TableCell><Box display="flex" alignItems="center" gap={0.6}><Business sx={{ fontSize: 13, color: "#0277bd" }} /><Typography fontSize={13} fontWeight={600}>{j.companyName}</Typography></Box></TableCell>
//                                 <TableCell sx={{ fontSize: 13 }}>{j.jobRole?.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())||"—"}</TableCell>
//                                 <TableCell sx={{ fontSize: 12 }}>{j.experience ? `${j.experience} yrs` : "—"}</TableCell>
//                                 <TableCell><Box display="flex" flexWrap="wrap" gap={0.5} maxWidth={160}>{j.skills?.slice(0,3).map((s,i)=><Chip key={i} label={s} size="small" variant="outlined" sx={{ fontSize:10,borderColor:"#0277bd",color:"#0277bd" }}/>)}{j.skills?.length>3&&<Chip label={`+${j.skills.length-3}`} size="small" sx={{fontSize:10}}/>}</Box></TableCell>
//                                 <TableCell><Box display="flex" flexDirection="column" gap={0.3}>{j.mcq_questions_count>0&&<Box display="flex" alignItems="center" gap={0.5}><Quiz sx={{fontSize:12,color:"#7b1fa2"}}/><Typography fontSize={11}>{j.mcq_questions_count} MCQ</Typography></Box>}{j.coding_questions_count>0&&<Box display="flex" alignItems="center" gap={0.5}><Code sx={{fontSize:12,color:"#2e7d32"}}/><Typography fontSize={11}>{j.coding_questions_count} Code</Typography></Box>}{j.screening_time_minutes>0&&<Typography fontSize={10} color="text.secondary">{j.screening_time_minutes} mins</Typography>}</Box></TableCell>
//                                 <TableCell sx={{ fontSize: 11, color: "text.secondary" }}>{fmtDate(j.creation_time)}</TableCell>
//                                 <TableCell>{j.expiration_time?<Typography fontSize={11} color={new Date(j.expiration_time)<new Date()?"error.main":"text.secondary"}>{fmtDate(j.expiration_time)}</Typography>:"—"}</TableCell>
//                                 <TableCell><Chip label={j.is_active?"Active":"Inactive"} color={j.is_active?"success":"default"} size="small" sx={{ fontWeight:700,fontSize:11 }}/></TableCell>
//                                 <TableCell><Tooltip title="View Details"><IconButton size="small" onClick={()=>{setSelected(j);setDetailOpen(true);}}><Visibility fontSize="small"/></IconButton></Tooltip></TableCell>
//                             </TableRow>
//                         ))}
//                     </TableBody>
//                 </Table>
//             </Paper></Card>
//             <Dialog open={detailOpen} onClose={()=>setDetailOpen(false)} maxWidth="lg" fullWidth PaperProps={{sx:{maxHeight:"92vh"}}}>
//                 <DialogTitle sx={{fontWeight:700,borderBottom:"1px solid #e0e0e0",pb:2}}>JD Details — {selected?.jdID}</DialogTitle>
//                 {selected&&<DialogContent sx={{pt:3,pb:1}}>
//                     {selected.skills?.length>0&&<Box mt={2}><SectionLabel>Required Skills</SectionLabel><Box display="flex" flexWrap="wrap" gap={0.8}>{selected.skills.map((s,i)=><Chip key={i} label={s} size="small" variant="outlined" sx={{fontSize:11,borderColor:"#0277bd",color:"#0277bd"}}/>)}</Box></Box>}
//                     {selected.jobDescription&&<Box mt={2.5} p={2} bgcolor="#f5f7fa" borderRadius={2} border="1px solid #e0e0e0"><SectionLabel>Job Description</SectionLabel><Typography fontSize={13} lineHeight={1.8} sx={{whiteSpace:"pre-wrap"}}>{selected.jobDescription}</Typography></Box>}
//                     <Divider sx={{my:3}}/>
//                     {selected.mcq_questions?.length>0&&<QuestionSection icon={<Quiz sx={{fontSize:18}}/>} title="MCQ Questions" color="#7b1fa2" count={selected.mcq_questions_count||0} bankCount={selected.mcq_questions.length}>{selected.mcq_questions.map((q,i)=><MCQQuestionCard key={i} question={q} index={i}/>)}</QuestionSection>}
//                     {selected.subjective_questions?.length>0&&<QuestionSection icon={<QuestionAnswer sx={{fontSize:18}}/>} title="Subjective Questions" color="#0277bd" count={0} bankCount={selected.subjective_questions.length}>{selected.subjective_questions.map((q,i)=><SubjectiveQuestionCard key={i} question={q} index={i}/>)}</QuestionSection>}
//                     {selected.coding_questions?.length>0&&<QuestionSection icon={<Code sx={{fontSize:18}}/>} title="Coding Questions" color="#2e7d32" count={selected.coding_questions_count||0} bankCount={selected.coding_questions.length}>{selected.coding_questions.map((q,i)=><CodingQuestionCard key={i} question={q} index={i}/>)}</QuestionSection>}
//                 </DialogContent>}
//                 <DialogActions sx={{px:3,py:2,borderTop:"1px solid #e0e0e0"}}><Button onClick={()=>setDetailOpen(false)} variant="outlined">Close</Button></DialogActions>
//             </Dialog>
//         </Box>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  TAB 0 — Jobs  (receives initial client filter from parent)
// // ─────────────────────────────────────────────────────────────────────────────
// function JobsTab({ initialClientId, initialClientName, onClearClientFilter }) {
//     const navigate = useNavigate();
//     const [jobs, setJobs]         = useState([]);
//     const [clients, setClients]   = useState([]);
//     const [loading, setLoading]   = useState(true);
//     const [error, setError]       = useState("");
//     const [search, setSearch]     = useState("");
//     const [statusF, setStatusF]   = useState("");
//     const [priorityF, setPriorityF] = useState("");
//     const [clientF, setClientF]   = useState(initialClientId || "");
//     const [isLocked, setIsLocked] = useState(!!initialClientId); // true = came from client nav
//     const [formOpen, setFormOpen]     = useState(false);
//     const [detailOpen, setDetailOpen] = useState(false);
//     const [deleteOpen, setDeleteOpen] = useState(false);
//     const [selected, setSelected]     = useState(null);
//     const [formData, setFormData]     = useState(EMPTY_FORM);
//     const [saving, setSaving]         = useState(false);

//     const load = useCallback(async () => {
//         try { setLoading(true); setError(""); const res = await getAllJobs(); setJobs(res.data || []); }
//         catch (err) { setError(err?.message || "Failed to load jobs."); setJobs([]); }
//         finally { setLoading(false); }
//     }, []);
//     const loadClients = useCallback(async () => { try { const res = await getAllClients(); setClients(res.data || []); } catch { setClients([]); } }, []);
//     useEffect(() => { load(); loadClients(); }, [load, loadClients]);

//     // Sync when URL changes (e.g. navigating from a different client)
//     useEffect(() => { setClientF(initialClientId || ""); setIsLocked(!!initialClientId); }, [initialClientId]);

//     const clearClientFilter = () => { setClientF(""); setIsLocked(false); onClearClientFilter?.(); };

//     const filtered = jobs.filter(j => {
//         const q = search.toLowerCase();
//         const mQ = !q || j.title?.toLowerCase().includes(q) || j.client_name?.toLowerCase().includes(q) || j.job_id?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) || j.posted_by_name?.toLowerCase().includes(q);
//         return mQ && (!statusF || j.status === statusF) && (!priorityF || j.priority === priorityF) && (!clientF || j.client_id === clientF);
//     });

//     const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
//     const openEdit   = j => { setSelected(j); setFormData({ ...EMPTY_FORM, ...j, skills: Array.isArray(j.skills) ? j.skills.join(", ") : (j.skills||""), secondary_skills: Array.isArray(j.secondary_skills) ? j.secondary_skills.join(", ") : (j.secondary_skills||""), deadline: j.deadline ? j.deadline.split("T")[0] : "" }); setFormOpen(true); };
//     const openDetail = j => { setSelected(j); setDetailOpen(true); };
//     const openDelete = j => { setSelected(j); setDeleteOpen(true); };

//     const handleChange = e => {
//         const { name, value, type, checked } = e.target;
//         if (name === "client_id") { const c = clients.find(c => c._id === value); setFormData(p => ({ ...p, client_id: value, client_name: c?.company_name || "" })); }
//         else { setFormData(p => ({ ...p, [name]: type === "checkbox" ? checked : value })); }
//     };

//     const handleSave = async e => {
//         e.preventDefault(); setSaving(true);
//         try {
//             const payload = { ...formData, skills: formData.skills ? formData.skills.split(",").map(s=>s.trim()).filter(Boolean) : [], secondary_skills: formData.secondary_skills ? formData.secondary_skills.split(",").map(s=>s.trim()).filter(Boolean) : [], openings: Number(formData.openings), experience_min: Number(formData.experience_min), experience_max: Number(formData.experience_max), salary_min: formData.salary_min ? Number(formData.salary_min) : 0, salary_max: formData.salary_max ? Number(formData.salary_max) : 0, mcq_questions_count: Number(formData.mcq_questions_count), subjective_questions_count: Number(formData.subjective_questions_count), coding_questions_count: Number(formData.coding_questions_count), screening_time_minutes: Number(formData.screening_time_minutes) };
//             selected ? await updateJob(selected._id, payload) : await createJob(payload);
//             setFormOpen(false); load();
//         } catch (err) { setError(err?.message || "Save failed"); }
//         finally { setSaving(false); }
//     };
//     const handleDelete = async () => { try { await deleteJob(selected._id); setDeleteOpen(false); load(); } catch (err) { setError(err?.message || "Delete failed"); } };

//     if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress size={48} /></Box>;

//     const filteredStats = { open: filtered.filter(j=>j.status==="Open").length, critical: filtered.filter(j=>j.priority==="Critical").length, apps: filtered.reduce((s,j)=>s+(j.applications||0),0) };

//     return (
//         <Box display="flex" flexDirection="column" gap={3}>
//             {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

//             {/* Client filter banner — only shown when navigated from a client */}
//             {isLocked && <ClientFilterBanner name={initialClientName} onClear={clearClientFilter} />}

//             <Box display="flex" justifyContent="flex-end">
//                 <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">Post New Job</Button>
//             </Box>

//             <Grid container spacing={2.5}>
//                 <Grid item xs={6} md={3}><StatCard title={isLocked ? "Client Jobs" : "Total Jobs"} value={filtered.length} icon={<Work />} color="#1a237e" sub={isLocked ? `For ${initialClientName}` : "All time"} /></Grid>
//                 <Grid item xs={6} md={3}><StatCard title="Open Jobs" value={filteredStats.open} icon={<AccessTime />} color="#0277bd" sub="Currently active" /></Grid>
//                 <Grid item xs={6} md={3}><StatCard title="Critical" value={filteredStats.critical} icon={<ReportProblem />} color="#c62828" sub="Need immediate action" /></Grid>
//                 <Grid item xs={6} md={3}><StatCard title="Applications" value={filteredStats.apps} icon={<TrendingUp />} color="#2e7d32" sub="Total received" /></Grid>
//             </Grid>

//             {filtered.length > 0 && (
//                 <Card><CardContent sx={{ p: 3 }}>
//                     <Typography variant="h6" mb={2}>Jobs by Status</Typography>
//                     <Grid container spacing={3}>{STATUSES.map(s => { const count = filtered.filter(j=>j.status===s).length; const pct = filtered.length ? (count/filtered.length)*100 : 0; return (<Grid item xs={6} md={3} key={s}><Box display="flex" justifyContent="space-between" mb={0.5}><Typography fontSize={13} fontWeight={600}>{s}</Typography><Typography fontSize={13} color="text.secondary">{count}</Typography></Box><LinearProgress variant="determinate" value={pct} color={STATUS_COLOR[s]||"inherit"} sx={{ height:8,borderRadius:4 }}/></Grid>); })}</Grid>
//                 </CardContent></Card>
//             )}

//             <Box display="flex" gap={2} flexWrap="wrap">
//                 <TextField placeholder="Search by title, client, department…" value={search} onChange={e=>setSearch(e.target.value)} size="small" sx={{ flexGrow:1,minWidth:240 }} InputProps={{ startAdornment:<InputAdornment position="start"><Search fontSize="small" color="action"/></InputAdornment> }}/>
//                 {/* Client dropdown only shown when not locked to a specific client */}
//                 {!isLocked && (
//                     <TextField select value={clientF} onChange={e=>setClientF(e.target.value)} size="small" sx={{ minWidth:180 }} label="Client">
//                         <MenuItem value="">All Clients</MenuItem>
//                         {clients.map(c=><MenuItem key={c._id} value={c._id}><Box display="flex" alignItems="center" gap={1}><Business fontSize="small" sx={{color:"#0277bd"}}/>{c.company_name}</Box></MenuItem>)}
//                     </TextField>
//                 )}
//                 <TextField select value={statusF} onChange={e=>setStatusF(e.target.value)} size="small" sx={{ minWidth:140 }} label="Status"><MenuItem value="">All Statuses</MenuItem>{STATUSES.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
//                 <TextField select value={priorityF} onChange={e=>setPriorityF(e.target.value)} size="small" sx={{ minWidth:140 }} label="Priority"><MenuItem value="">All Priorities</MenuItem>{PRIORITIES.map(p=><MenuItem key={p} value={p}>{p}</MenuItem>)}</TextField>
//             </Box>

//             {jobs.length === 0 && !error ? (
//                 <Card><Box py={6} display="flex" flexDirection="column" alignItems="center" gap={2}><Typography variant="h6" color="text.secondary">No jobs posted yet</Typography><Button variant="contained" startIcon={<Add/>} onClick={openCreate}>Post New Job</Button></Box></Card>
//             ) : (
//                 <Card><Paper variant="outlined" sx={{ borderRadius:2,overflow:"hidden" }}>
//                     <Table>
//                         <TableHead><TableRow sx={{ bgcolor:"#f5f7fa" }}>{["Job ID","Position","Client","Dept","Type / Mode","Experience","Salary","Openings","Deadline","Posted By","Screening","Priority","Status","Actions"].map(h=><TableCell key={h} sx={{ fontWeight:700,fontSize:12,color:"#546e7a" }}>{h}</TableCell>)}</TableRow></TableHead>
//                         <TableBody>
//                             {filtered.length === 0 ? (
//                                 <TableRow><TableCell colSpan={14} align="center" sx={{ py:6,color:"text.secondary" }}>No jobs match your filters</TableCell></TableRow>
//                             ) : filtered.map(j => {
//                                 const daysLeft = calcDaysLeft(j.deadline);
//                                 return (
//                                     <TableRow key={j._id} hover>
//                                         <TableCell sx={{ fontWeight:700,color:"#0277bd",fontSize:12 }}>{j.job_id}</TableCell>
//                                         <TableCell><Typography fontWeight={600} fontSize={13}>{j.title}</Typography><Typography fontSize={11} color="text.secondary">{j.location}</Typography></TableCell>
//                                         <TableCell><ClientLink name={j.client_name} onClick={()=>navigate(`/clients`)} /></TableCell>
//                                         <TableCell sx={{ fontSize:12 }}>{j.department||"—"}</TableCell>
//                                         <TableCell><Typography fontSize={12}>{j.job_type}</Typography><Typography fontSize={11} color="text.secondary">{j.work_mode}</Typography></TableCell>
//                                         <TableCell sx={{ fontSize:12 }}>{j.experience_min}–{j.experience_max} yrs</TableCell>
//                                         <TableCell sx={{ fontSize:12 }}>{formatSalary(j.salary_min)} – {formatSalary(j.salary_max)}</TableCell>
//                                         <TableCell><Box display="flex" alignItems="center" gap={0.5}><Typography fontSize={13} fontWeight={600}>{j.filled||0}</Typography><Typography fontSize={11} color="text.secondary">/ {j.openings}</Typography></Box><LinearProgress variant="determinate" value={j.openings?((j.filled||0)/j.openings)*100:0} sx={{ height:4,borderRadius:2,mt:0.5,bgcolor:"#e0e0e0","& .MuiLinearProgress-bar":{bgcolor:"#2e7d32"} }}/></TableCell>
//                                         <TableCell sx={{ fontSize:12 }}>{daysLeft!==null?(<Box><Typography fontSize={13} fontWeight={600} color={daysLeft<0?"error.main":daysLeft<=7?"warning.main":"text.primary"}>{daysLeft<0?`${Math.abs(daysLeft)}d overdue`:`${daysLeft}d left`}</Typography><Typography fontSize={11} color="text.secondary">{fmtDate(j.deadline)}</Typography></Box>):"—"}</TableCell>
//                                         <TableCell><Box display="flex" alignItems="center" gap={1}><Avatar sx={{ width:26,height:26,fontSize:10,fontWeight:700,bgcolor:"#e8eaf6",color:"#1a237e" }}>{nameInitials(j.posted_by_name)}</Avatar><Typography fontSize={12} fontWeight={500}>{j.posted_by_name||"—"}</Typography></Box></TableCell>
//                                         <TableCell>{(j.mcq_questions_count>0||j.subjective_questions_count>0||j.coding_questions_count>0)?(<Box display="flex" flexDirection="column" gap={0.3}>{j.mcq_questions_count>0&&<Box display="flex" alignItems="center" gap={0.5}><Quiz sx={{fontSize:12,color:"#7b1fa2"}}/><Typography fontSize={11}>{j.mcq_questions_count} MCQ</Typography></Box>}{j.subjective_questions_count>0&&<Box display="flex" alignItems="center" gap={0.5}><QuestionAnswer sx={{fontSize:12,color:"#0277bd"}}/><Typography fontSize={11}>{j.subjective_questions_count} Subj.</Typography></Box>}{j.coding_questions_count>0&&<Box display="flex" alignItems="center" gap={0.5}><Code sx={{fontSize:12,color:"#2e7d32"}}/><Typography fontSize={11}>{j.coding_questions_count} Code</Typography></Box>}</Box>):<Typography fontSize={11} color="text.disabled">—</Typography>}</TableCell>
//                                         <TableCell><Chip label={j.priority} color={PRIORITY_COLOR[j.priority]||"default"} size="small" sx={{ fontWeight:700,fontSize:11 }}/></TableCell>
//                                         <TableCell><Chip label={j.status}   color={STATUS_COLOR[j.status]||"default"}     size="small" sx={{ fontWeight:700,fontSize:11 }}/></TableCell>
//                                         <TableCell><Box display="flex" gap={0.5}><Tooltip title="View"><IconButton size="small" onClick={()=>openDetail(j)}><Visibility fontSize="small"/></IconButton></Tooltip><Tooltip title="Edit"><IconButton size="small" onClick={()=>openEdit(j)}><Edit fontSize="small"/></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" color="error" onClick={()=>openDelete(j)}><Delete fontSize="small"/></IconButton></Tooltip></Box></TableCell>
//                                     </TableRow>
//                                 );
//                             })}
//                         </TableBody>
//                     </Table>
//                 </Paper></Card>
//             )}

//             {/* Job Detail Dialog */}
//             <Dialog open={detailOpen} onClose={()=>setDetailOpen(false)} maxWidth="md" fullWidth>
//                 <DialogTitle sx={{ fontWeight:700,borderBottom:"1px solid #e0e0e0",pb:2 }}>Job Details</DialogTitle>
//                 {selected&&<DialogContent sx={{ pt:3,pb:1 }}>
//                     <Box display="flex" alignItems="center" gap={2.5} mb={3} pb={3} sx={{ borderBottom:"1px solid #e0e0e0" }}>
//                         <Avatar sx={{ width:72,height:72,borderRadius:3,background:"linear-gradient(135deg,#00acc1,#0277bd)",flexShrink:0 }}><Work sx={{ fontSize:32,color:"#fff" }}/></Avatar>
//                         <Box><Typography variant="h5" fontWeight={800} lineHeight={1.2}>{selected.title}</Typography>
//                             <Box display="flex" alignItems="center" gap={0.5} mt={0.5}><ClientLink name={selected.client_name} onClick={()=>setDetailOpen(false)}/>{selected.location&&<Typography color="text.secondary" fontSize={13}>· {selected.location}</Typography>}</Box>
//                             <Box display="flex" gap={1} mt={1} flexWrap="wrap"><Chip label={selected.status} color={STATUS_COLOR[selected.status]||"default"} size="small" sx={{fontWeight:700,fontSize:11}}/><Chip label={`${selected.priority} Priority`} color={PRIORITY_COLOR[selected.priority]||"default"} size="small" sx={{fontWeight:700,fontSize:11}}/></Box>
//                         </Box>
//                     </Box>
//                     <Grid container spacing={3}>
//                         <Grid item xs={12} sm={4}><SectionLabel>Job Information</SectionLabel><DetailRow label="Job ID" value={selected.job_id}/><DetailRow label="Department" value={selected.department}/><DetailRow label="Job Type" value={selected.job_type}/><DetailRow label="Work Mode" value={selected.work_mode}/><DetailRow label="Deadline" value={fmtDate(selected.deadline)}/></Grid>
//                         <Grid item xs={12} sm={4}><SectionLabel>Requirements</SectionLabel><DetailRow label="Experience" value={`${selected.experience_min}–${selected.experience_max} years`}/><DetailRow label="Salary Range" value={`${formatSalary(selected.salary_min)} – ${formatSalary(selected.salary_max)}`}/><DetailRow label="Openings" value={`${selected.filled||0} / ${selected.openings} filled`}/><DetailRow label="Applicants" value={selected.applications??0}/></Grid>
//                         <Grid item xs={12} sm={4}><SectionLabel>Screening</SectionLabel><DetailRow label="MCQ Count" value={selected.mcq_questions_count||0}/><DetailRow label="Subjective" value={selected.subjective_questions_count||0}/><DetailRow label="Coding" value={selected.coding_questions_count||0}/><DetailRow label="Time" value={selected.screening_time_minutes?`${selected.screening_time_minutes} mins`:"—"}/></Grid>
//                     </Grid>
//                     {selected.skills?.length>0&&<Box mt={2.5}><SectionLabel>Required Skills</SectionLabel><Box display="flex" flexWrap="wrap" gap={0.8}>{selected.skills.map((s,i)=><Chip key={i} label={s.trim()} size="small" variant="outlined" sx={{fontSize:11,borderColor:"#0277bd",color:"#0277bd"}}/>)}</Box></Box>}
//                     {selected.description&&<Box mt={2.5} p={2} bgcolor="#f5f7fa" borderRadius={2} border="1px solid #e0e0e0"><SectionLabel>Job Description</SectionLabel><Typography fontSize={13} lineHeight={1.8} sx={{whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{selected.description}</Typography></Box>}
//                 </DialogContent>}
//                 <DialogActions sx={{ px:3,py:2.5,borderTop:"1px solid #e0e0e0",justifyContent:"flex-start",gap:1.5 }}>
//                     <Button variant="outlined" onClick={()=>{setDetailOpen(false);navigate(`/resumes?job=${selected?._id}`);}} sx={{ textTransform:"none",fontWeight:600 }}>View Candidates</Button>
//                     <Button variant="outlined" onClick={()=>{setDetailOpen(false);navigate(`/tracking?job=${selected?._id}`);}} sx={{ textTransform:"none",fontWeight:600 }}>Track Progress</Button>
//                     <Box sx={{ flex:1 }}/>
//                     <Button variant="contained" onClick={()=>{setDetailOpen(false);openEdit(selected);}} sx={{ textTransform:"none",fontWeight:700 }}>Edit Job</Button>
//                 </DialogActions>
//             </Dialog>

//             {/* Add / Edit Dialog */}
//             <Dialog open={formOpen} onClose={()=>setFormOpen(false)} maxWidth="md" fullWidth>
//                 <DialogTitle sx={{ fontWeight:700,borderBottom:"1px solid #e0e0e0" }}>
//                     <Box display="flex" justifyContent="space-between" alignItems="center">
//                         <span>{selected?"Edit Job":"Post New Job"}</span>
//                         {!selected&&<Box display="flex" alignItems="center" gap={1} sx={{ bgcolor:"#e8eaf6",px:1.5,py:0.6,borderRadius:2 }}><Person sx={{fontSize:16,color:"#1a237e"}}/><Typography fontSize={12} fontWeight={600} color="primary.dark">Posting as: {getCurrentUserName()}</Typography></Box>}
//                     </Box>
//                 </DialogTitle>
//                 <form onSubmit={handleSave}><DialogContent sx={{ pt:3 }}>
//                     <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Basic Information</Typography>
//                     <Grid container spacing={2} mb={2}>
//                         <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Job ID" name="job_id" value={formData.job_id} onChange={handleChange} disabled={!!selected}/></Grid>
//                         <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Job Title" name="title" value={formData.title} onChange={handleChange}/></Grid>
//                         <Grid item xs={12} sm={6}><TextField select fullWidth size="small" required label="Client" name="client_id" value={formData.client_id} onChange={handleChange}><MenuItem value="">Select Client</MenuItem>{clients.map(c=><MenuItem key={c._id} value={c._id}><Box display="flex" alignItems="center" gap={1}><Business fontSize="small" sx={{color:"#0277bd"}}/>{c.company_name}</Box></MenuItem>)}</TextField></Grid>
//                         <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Location" name="location" value={formData.location} onChange={handleChange}/></Grid>
//                         <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Priority" name="priority" value={formData.priority} onChange={handleChange}>{PRIORITIES.map(p=><MenuItem key={p} value={p}>{p}</MenuItem>)}</TextField></Grid>
//                         <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Status" name="status" value={formData.status} onChange={handleChange}>{STATUSES.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//                         <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Job Type" name="job_type" value={formData.job_type} onChange={handleChange}>{JOB_TYPES.map(t=><MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
//                         <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Work Mode" name="work_mode" value={formData.work_mode} onChange={handleChange}>{WORK_MODES.map(m=><MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField></Grid>
//                     </Grid>
//                     <Divider sx={{ my:2 }}/><Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Requirements</Typography>
//                     <Grid container spacing={2} mb={2}>
//                         <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Openings" name="openings" value={formData.openings} onChange={handleChange} inputProps={{min:1}}/></Grid>
//                         <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Min Exp (yrs)" name="experience_min" value={formData.experience_min} onChange={handleChange} inputProps={{min:0}}/></Grid>
//                         <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Max Exp (yrs)" name="experience_max" value={formData.experience_max} onChange={handleChange} inputProps={{min:0}}/></Grid>
//                         <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="date" label="Deadline" name="deadline" value={formData.deadline} onChange={handleChange} InputLabelProps={{shrink:true}}/></Grid>
//                         <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Min Salary (₹)" name="salary_min" value={formData.salary_min} onChange={handleChange}/></Grid>
//                         <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Max Salary (₹)" name="salary_max" value={formData.salary_max} onChange={handleChange}/></Grid>
//                         <Grid item xs={12}><TextField fullWidth multiline rows={3} size="small" label="Required Skills (comma-separated)" name="skills" value={formData.skills} onChange={handleChange}/></Grid>
//                     </Grid>
//                     <Divider sx={{ my:2 }}/><Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Screening</Typography>
//                     <Grid container spacing={2} mb={2}>
//                         <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="MCQ Count" name="mcq_questions_count" value={formData.mcq_questions_count} onChange={handleChange} inputProps={{min:0}}/></Grid>
//                         <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Subjective Count" name="subjective_questions_count" value={formData.subjective_questions_count} onChange={handleChange} inputProps={{min:0}}/></Grid>
//                         <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Coding Count" name="coding_questions_count" value={formData.coding_questions_count} onChange={handleChange} inputProps={{min:0}}/></Grid>
//                         <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Screening Time (mins)" name="screening_time_minutes" value={formData.screening_time_minutes} onChange={handleChange} inputProps={{min:0}}/></Grid>
//                     </Grid>
//                     <Divider sx={{ my:2 }}/><Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Description &amp; Notes</Typography>
//                     <Grid container spacing={2}>
//                         <Grid item xs={12}><TextField fullWidth multiline rows={8} size="small" label="Job Description" name="description" value={formData.description} onChange={handleChange}/></Grid>
//                         <Grid item xs={12}><TextField fullWidth multiline rows={3} size="small" label="Internal Notes" name="notes" value={formData.notes} onChange={handleChange}/></Grid>
//                     </Grid>
//                 </DialogContent>
//                 <DialogActions sx={{ px:3,pb:2.5,borderTop:"1px solid #e0e0e0" }}>
//                     <Button onClick={()=>setFormOpen(false)}>Cancel</Button>
//                     <Button type="submit" variant="contained" disabled={saving}>{saving?<CircularProgress size={18} sx={{mr:1}}/>:null}{selected?"Update Job":"Post Job"}</Button>
//                 </DialogActions></form>
//             </Dialog>

//             {/* Delete Dialog */}
//             <Dialog open={deleteOpen} onClose={()=>setDeleteOpen(false)} maxWidth="xs" fullWidth>
//                 <DialogTitle fontWeight={700}>Delete Job</DialogTitle>
//                 <DialogContent><Typography>Are you sure you want to delete <strong>{selected?.title}</strong>?</Typography></DialogContent>
//                 <DialogActions sx={{ px:3,pb:2 }}><Button onClick={()=>setDeleteOpen(false)}>Cancel</Button><Button variant="contained" color="error" onClick={handleDelete}>Delete</Button></DialogActions>
//             </Dialog>
//         </Box>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// //  ROOT — reads ?client= and ?client_name= from URL, passes to JobsTab
// // ─────────────────────────────────────────────────────────────────────────────
// export default function Jobs() {
//     const location = useLocation();
//     const navigate = useNavigate();
//     const [tab, setTab] = useState(0);

//     const qp = new URLSearchParams(location.search);
//     const [clientId,   setClientId]   = useState(qp.get("client")      || "");
//     const [clientName, setClientName] = useState(qp.get("client_name") || "");

//     // Keep in sync with URL (handles browser back/forward)
//     useEffect(() => {
//         const p = new URLSearchParams(location.search);
//         setClientId(p.get("client")      || "");
//         setClientName(p.get("client_name") || "");
//     }, [location.search]);

//     const handleClearClientFilter = () => {
//         setClientId(""); setClientName("");
//         navigate("/jobs", { replace: true });
//     };

//     return (
//         <Box display="flex" flexDirection="column" gap={3}>
//             <Box>
//                 <Typography variant="h4" color="primary.dark">Job Management</Typography>
//                 <Typography color="text.secondary" mt={0.5}>Track open positions, manage requirements and monitor applications</Typography>
//             </Box>
//             <Box sx={{ borderBottom: "1px solid #e0e0e0" }}>
//                 <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ "& .MuiTab-root": { fontWeight:600,textTransform:"none",fontSize:14 } }}>
//                     <Tab label={<Box display="flex" alignItems="center" gap={1}><Work sx={{fontSize:18}}/>Jobs{clientId && <Chip label={clientName||"Client"} size="small" color="info" sx={{fontSize:10,height:18,ml:0.5}}/>}</Box>} />
//                     <Tab label={<Box display="flex" alignItems="center" gap={1}><Assignment sx={{fontSize:18}}/>JD Details<Chip label="Resourcing Bot DB" size="small" sx={{fontSize:10,height:18,bgcolor:"#e8eaf6",color:"#1a237e"}}/></Box>} />
//                 </Tabs>
//             </Box>
//             {tab === 0 && <JobsTab initialClientId={clientId} initialClientName={clientName} onClearClientFilter={handleClearClientFilter} />}
//             {tab === 1 && <JDDetailsTab />}
//         </Box>
//     );
// }














import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Box, Grid, Card, CardContent, Typography, Button, TextField,
    MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
    Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
    InputAdornment, Divider, LinearProgress, Switch, FormControlLabel,
    Tabs, Tab,
} from "@mui/material";
import {
    Add, Search, Edit, Delete, Visibility, Work, People,
    AccessTime, TrendingUp, ReportProblem, Person, WorkOff,
    Business, Code, Quiz, QuestionAnswer, Assignment,
    CheckCircle, RadioButtonUnchecked, FilterList, Close as CloseIcon,
} from "@mui/icons-material";

const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
const getHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });
const handle = async (res) => { const data = await res.json(); if (!res.ok) throw data; return data; };

const getAllJobs    = (p = {}) => fetch(`${BASE}/jobs/${new URLSearchParams(p).toString() ? "?" + new URLSearchParams(p).toString() : ""}`, { headers: getHeaders() }).then(handle);
const createJob    = (p)      => fetch(`${BASE}/jobs/`,      { method: "POST",   headers: getHeaders(), body: JSON.stringify(p) }).then(handle);
const updateJob    = (id, p)  => fetch(`${BASE}/jobs/${id}`, { method: "PUT",    headers: getHeaders(), body: JSON.stringify(p) }).then(handle);
const deleteJob    = (id)     => fetch(`${BASE}/jobs/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
const getAllClients = ()       => fetch(`${BASE}/clients/`,   { headers: getHeaders() }).then(handle);
const getAllJDs     = (p = {}) => fetch(`${BASE}/jobs/jd/${new URLSearchParams(p).toString() ? "?" + new URLSearchParams(p).toString() : ""}`, { headers: getHeaders() }).then(handle);
const getCurrentUserName = () => { try { const u = JSON.parse(localStorage.getItem("user") || "{}"); return `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Unknown"; } catch { return "Unknown"; } };
const generateJobQuestions = (jobId, payload) =>
    fetch(`${BASE}/questions/jobs/${jobId}/generate`, {
      method: "POST", headers: getHeaders(), body: JSON.stringify(payload),
    }).then(handle);
  
  const clearJobQuestions = (jobId) =>
    fetch(`${BASE}/questions/jobs/${jobId}/clear`, { method: "DELETE", headers: getHeaders() }).then(handle);
  
  const deleteOneQuestion = (jobId, qType, index) =>
    fetch(`${BASE}/questions/jobs/${jobId}/${qType}/${index}`, { method: "DELETE", headers: getHeaders() }).then(handle);

  const getJobQuestions = (jobId) =>
    fetch(`${BASE}/questions/jobs/${jobId}`, { headers: getHeaders() }).then(handle);



const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES   = ["Open", "On Hold", "Closed", "Filled"];
const JOB_TYPES  = ["Full-Time", "Part-Time", "Contract", "Internship"];
const WORK_MODES = ["On-site", "Remote", "Hybrid"];
const PRIORITY_COLOR = { Low: "default", Medium: "info", High: "warning", Critical: "error" };
const STATUS_COLOR   = { Open: "success", "On Hold": "warning", Closed: "default", Filled: "primary" };
const DIFFICULTY_COLOR = { Easy: { bg: "#e8f5e9", border: "#a5d6a7", text: "#1b5e20" }, Medium: { bg: "#fff8e1", border: "#ffe082", text: "#e65100" }, Hard: { bg: "#fce4ec", border: "#f48fb1", text: "#880e4f" } };

const EMPTY_FORM = {
    job_id: "", title: "", client_id: "", client_name: "", openings: 1, job_type: "Full-Time", work_mode: "On-site",
    location: "", experience_min: 0, experience_max: 5, salary_min: "", salary_max: "", skills: "",
    description: "", priority: "Medium", status: "Open", deadline: "", notes: "",
    programming_language: "", programming_level: "", secondary_skills: "",
    mcq_questions_count: 0, subjective_questions_count: 0, coding_questions_count: 0,
    screening_time_minutes: 0, screening_test_pass_percentage: "",
    department: "", preferred_location: "", is_active: true, jd_edit_status: "", remarks: "",
};
const getExpLevel = (min, max) => {
    const avg = (Number(min || 0) + Number(max || 5)) / 2;
    if (avg <= 2)  return { label: "Junior",           color: "#2e7d32", bg: "#e8f5e9", hint: "Fundamentals & basics" };
    if (avg <= 5)  return { label: "Mid-level",         color: "#1565c0", bg: "#e3f2fd", hint: "Practical depth & problem-solving" };
    if (avg <= 9)  return { label: "Senior",            color: "#e65100", bg: "#fff8e1", hint: "Architecture & trade-offs" };
    return           { label: "Lead / Principal",       color: "#880e4f", bg: "#fce4ec", hint: "System design at scale & strategy" };
  };
  






const formatSalary = (val) => { if (!val) return "—"; if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`; return `₹${val.toLocaleString()}`; };
const nameInitials = (name = "") => name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
const calcDaysLeft = (deadline) => { if (!deadline) return null; const due = new Date(deadline); const today = new Date(); today.setHours(0,0,0,0); due.setHours(0,0,0,0); return Math.floor((due - today) / 86400000); };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

const StatCard = ({ title, value, icon, color, sub }) => (
    <Card><CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box><Typography fontSize={12} color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em">{title}</Typography>
                <Typography variant="h3" fontWeight={800} mt={0.5} sx={{ color }}>{value}</Typography>
                {sub && <Typography fontSize={12} color="text.secondary" mt={0.5}>{sub}</Typography>}
            </Box>
            <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
        </Box>
    </CardContent></Card>
);

const EmptyState = ({ onAdd }) => (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10} gap={2}>
        <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}><WorkOff sx={{ fontSize: 36, color: "#9fa8da" }} /></Avatar>
        <Typography variant="h6" fontWeight={700} color="text.secondary">No records found</Typography>
        {onAdd && <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ mt: 1 }}>Post New Job</Button>}
    </Box>
);

const DetailRow = ({ label, value }) => (
    <Box display="flex" justifyContent="space-between" alignItems="center"
        sx={{ py: 1, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}>
        <Typography fontSize={13} color="text.secondary">{label}</Typography>
        <Typography fontSize={13} fontWeight={600} color="text.primary" textAlign="right">{value ?? "—"}</Typography>
    </Box>
);
const SectionLabel = ({ children }) => (
    <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} mb={1.5}>{children}</Typography>
);
const ClientLink = ({ name, onClick }) => (
    <Box display="flex" alignItems="center" gap={0.6} onClick={onClick}
        sx={{ cursor: "pointer", color: "#0277bd", fontWeight: 600, fontSize: 12, width: "fit-content", px: 0.8, py: 0.3, borderRadius: 1, "&:hover": { bgcolor: "#e3f2fd" } }}>
        <Business sx={{ fontSize: 13, flexShrink: 0 }} />{name || "—"}
    </Box>
);

// ── Client filter banner ──────────────────────────────────────────────────────
const ClientFilterBanner = ({ name, onClear }) => (
    <Alert severity="info" icon={<FilterList fontSize="small" />}
        action={<Chip label="Show all clients" size="small" variant="outlined" onDelete={onClear} onClick={onClear} deleteIcon={<CloseIcon />} sx={{ fontSize: 11, cursor: "pointer" }} />}
        sx={{ py: 0.5 }}>
        Showing jobs for <strong>{name}</strong>
    </Alert>
);

// ── MCQ / Subjective / Coding question cards (unchanged from your original) ───
const MCQQuestionCard = ({ question: q, index }) => {
    const correctAnswers = Array.isArray(q.correct_answer) ? q.correct_answer.map(String) : [String(q.correct_answer || "")];
    const isMulti = correctAnswers.length > 1;
    return (
        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
            <Box sx={{ bgcolor: "#f5f7fa", px: 2, py: 1.5, borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <Chip label={`Q${index + 1}`} size="small" sx={{ bgcolor: "#7b1fa2", color: "#fff", fontWeight: 700, fontSize: 11, height: 20, flexShrink: 0, mt: 0.2 }} />
                {isMulti && <Chip label="Multi-select" size="small" sx={{ bgcolor: "#e8eaf6", color: "#1a237e", fontWeight: 600, fontSize: 10, height: 20, flexShrink: 0, mt: 0.2 }} />}
                <Typography fontSize={13} fontWeight={600} color="text.primary" lineHeight={1.5}>{q.question}</Typography>
            </Box>
            <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.8 }}>
                {q.options?.map((opt, j) => { const isCorrect = correctAnswers.includes(String(opt)); return (
                    <Box key={j} display="flex" alignItems="center" gap={1.2}
                        sx={{ px: 1.5, py: 0.8, borderRadius: 1.5, bgcolor: isCorrect ? "#e8f5e9" : "#fafafa", border: isCorrect ? "1.5px solid #a5d6a7" : "1px solid #eeeeee" }}>
                        {isCorrect ? <CheckCircle sx={{ fontSize: 16, color: "#2e7d32", flexShrink: 0 }} /> : <RadioButtonUnchecked sx={{ fontSize: 16, color: "#bdbdbd", flexShrink: 0 }} />}
                        <Typography fontSize={12} color={isCorrect ? "#1b5e20" : "text.secondary"} fontWeight={isCorrect ? 600 : 400} sx={{ flex: 1 }}>{opt}</Typography>
                        {isCorrect && <Chip label="✓ Correct" size="small" sx={{ fontSize: 10, height: 18, bgcolor: "#2e7d32", color: "#fff", fontWeight: 700, ml: "auto" }} />}
                    </Box>
                ); })}
            </Box>
        </Box>
    );
};
const SubjectiveQuestionCard = ({ question: q, index }) => {
    const diffStyle = DIFFICULTY_COLOR[q.difficulty] || DIFFICULTY_COLOR["Medium"];
    return (
        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
            <Box sx={{ bgcolor: "#f5f7fa", px: 2, py: 1.5, borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "flex-start", gap: 1.5, flexWrap: "wrap" }}>
                <Chip label={`Q${index + 1}`} size="small" sx={{ bgcolor: "#0277bd", color: "#fff", fontWeight: 700, fontSize: 11, height: 20, flexShrink: 0, mt: 0.2 }} />
                {q.skill && <Chip label={q.skill} size="small" variant="outlined" sx={{ fontSize: 10, height: 20, borderColor: "#0277bd", color: "#0277bd", fontWeight: 600, flexShrink: 0, mt: 0.2 }} />}
                {q.difficulty && <Chip label={q.difficulty} size="small" sx={{ fontSize: 10, height: 20, fontWeight: 700, bgcolor: diffStyle.bg, color: diffStyle.text, border: `1px solid ${diffStyle.border}`, flexShrink: 0, mt: 0.2 }} />}
                <Typography fontSize={13} fontWeight={600} color="text.primary" lineHeight={1.5} sx={{ flex: 1 }}>{q.question}</Typography>
            </Box>
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                {q.reference_answer && <Box><Typography fontSize={11} fontWeight={700} color="#2e7d32" textTransform="uppercase" letterSpacing={0.5} mb={0.5}>Reference Answer</Typography><Box sx={{ bgcolor: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 1.5, px: 1.5, py: 1 }}><Typography fontSize={12} color="#1b5e20" lineHeight={1.7} sx={{ whiteSpace: "pre-wrap" }}>{q.reference_answer}</Typography></Box></Box>}
                {q.key_points && <Box><Typography fontSize={11} fontWeight={700} color="#e65100" textTransform="uppercase" letterSpacing={0.5} mb={0.5}>Key Points</Typography><Box sx={{ bgcolor: "#fff8e1", border: "1px solid #ffe082", borderRadius: 1.5, px: 1.5, py: 1 }}><Typography fontSize={12} color="#bf360c" lineHeight={1.7} sx={{ whiteSpace: "pre-wrap" }}>{q.key_points}</Typography></Box></Box>}
            </Box>
        </Box>
    );
};
const CodingQuestionCard = ({ question: q, index }) => (
    <Box sx={{ border: "1px solid #3d3d5c", borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ bgcolor: "#2d2d3f", px: 2, py: 1, display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid #3d3d5c" }}>
            <Box display="flex" gap={0.6}>{["#ff5f57","#febc2e","#28c840"].map(c => <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />)}</Box>
            <Code sx={{ fontSize: 14, color: "#82aaff" }} /><Typography fontSize={12} fontWeight={700} color="#82aaff">Problem {index + 1}</Typography>
        </Box>
        <Box sx={{ bgcolor: "#1e1e2e", px: 2.5, py: 2 }}>
            <Typography fontSize={12} color="#cdd6f4" lineHeight={1.9} sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'Fira Code','Consolas',monospace" }}>{typeof q === "string" ? q : q.question || JSON.stringify(q)}</Typography>
        </Box>
    </Box>
);
const QuestionSection = ({ icon, title, color, count, bankCount, children }) => (
    <Box mt={3}>
        <Box display="flex" alignItems="center" gap={1.5} mb={2} pb={1.5} sx={{ borderBottom: "2px solid #f0f0f0" }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: `${color}18`, color }}>{icon}</Avatar>
            <Typography fontSize={14} fontWeight={700} color="text.primary">{title}</Typography>
            <Chip label={`${bankCount} in bank`} size="small" sx={{ fontSize: 10, height: 20, bgcolor: `${color}18`, color, fontWeight: 600 }} />
            {count > 0 && <Chip label={`${count} per test`} size="small" variant="outlined" sx={{ fontSize: 10, height: 20, borderColor: color, color, fontWeight: 600 }} />}
        </Box>
        <Box display="flex" flexDirection="column" gap={1.5}>{children}</Box>
    </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
//  TAB 1 — JD Details (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function JDDetailsTab() {
    const [jds, setJDs] = useState([]); const [loading, setLoading] = useState(true);
    const [error, setError] = useState(""); const [search, setSearch] = useState("");
    const [activeF, setActiveF] = useState(""); const [detailOpen, setDetailOpen] = useState(false); const [selected, setSelected] = useState(null);
    const load = useCallback(async () => { try { setLoading(true); setError(""); const res = await getAllJDs(); setJDs(res.data || []); } catch (err) { setError(err?.message || "Failed to load JD details."); setJDs([]); } finally { setLoading(false); } }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = jds.filter(j => { const q = search.toLowerCase(); const mQ = !q || j.jdID?.toLowerCase().includes(q) || j.companyName?.toLowerCase().includes(q) || j.jobRole?.toLowerCase().includes(q); const mA = activeF === "" ? true : activeF === "active" ? j.is_active === true : j.is_active === false; return mQ && mA; });
    const stats = { total: jds.length, active: jds.filter(j => j.is_active).length, exp: jds.filter(j => j.expiration_time && new Date(j.expiration_time) < new Date()).length };
    if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
    return (
        <Box display="flex" flexDirection="column" gap={3}>
            {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
            <Grid container spacing={2.5}>
                <Grid item xs={6} md={4}><StatCard title="Total JDs"   value={stats.total}  icon={<Assignment />} color="#1a237e" sub="All time" /></Grid>
                <Grid item xs={6} md={4}><StatCard title="Active JDs"  value={stats.active} icon={<AccessTime />} color="#2e7d32" sub="Currently active" /></Grid>
                <Grid item xs={6} md={4}><StatCard title="Expired JDs" value={stats.exp}    icon={<ReportProblem />} color="#c62828" sub="Past expiry" /></Grid>
            </Grid>
            <Box display="flex" gap={2} flexWrap="wrap">
                <TextField placeholder="Search by JD ID, company" value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 240 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
                <TextField select value={activeF} onChange={e => setActiveF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Status"><MenuItem value="">All</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem></TextField>
            </Box>
            <Card><Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                <Table><TableHead><TableRow sx={{ bgcolor: "#f5f7fa" }}>{["JD ID","Company","Job Role","Experience","Skills","Screening","Created","Expires","Status","Actions"].map(h => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>)}</TableRow></TableHead>
                    <TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>No JD details match your filters</TableCell></TableRow>
                        : filtered.map(j => (
                            <TableRow key={j._id} hover>
                                <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>{j.jdID}</TableCell>
                                <TableCell><Box display="flex" alignItems="center" gap={0.6}><Business sx={{ fontSize: 13, color: "#0277bd" }} /><Typography fontSize={13} fontWeight={600}>{j.companyName}</Typography></Box></TableCell>
                                <TableCell sx={{ fontSize: 13 }}>{j.jobRole?.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())||"—"}</TableCell>
                                <TableCell sx={{ fontSize: 12 }}>{j.experience ? `${j.experience} yrs` : "—"}</TableCell>
                                <TableCell><Box display="flex" flexWrap="wrap" gap={0.5} maxWidth={160}>{j.skills?.slice(0,3).map((s,i)=><Chip key={i} label={s} size="small" variant="outlined" sx={{ fontSize:10,borderColor:"#0277bd",color:"#0277bd" }}/>)}{j.skills?.length>3&&<Chip label={`+${j.skills.length-3}`} size="small" sx={{fontSize:10}}/>}</Box></TableCell>
                                <TableCell><Box display="flex" flexDirection="column" gap={0.3}>{j.mcq_questions_count>0&&<Box display="flex" alignItems="center" gap={0.5}><Quiz sx={{fontSize:12,color:"#7b1fa2"}}/><Typography fontSize={11}>{j.mcq_questions_count} MCQ</Typography></Box>}{j.coding_questions_count>0&&<Box display="flex" alignItems="center" gap={0.5}><Code sx={{fontSize:12,color:"#2e7d32"}}/><Typography fontSize={11}>{j.coding_questions_count} Code</Typography></Box>}{j.screening_time_minutes>0&&<Typography fontSize={10} color="text.secondary">{j.screening_time_minutes} mins</Typography>}</Box></TableCell>
                                <TableCell sx={{ fontSize: 11, color: "text.secondary" }}>{fmtDate(j.creation_time)}</TableCell>
                                <TableCell>{j.expiration_time?<Typography fontSize={11} color={new Date(j.expiration_time)<new Date()?"error.main":"text.secondary"}>{fmtDate(j.expiration_time)}</Typography>:"—"}</TableCell>
                                <TableCell><Chip label={j.is_active?"Active":"Inactive"} color={j.is_active?"success":"default"} size="small" sx={{ fontWeight:700,fontSize:11 }}/></TableCell>
                                <TableCell><Tooltip title="View Details"><IconButton size="small" onClick={()=>{setSelected(j);setDetailOpen(true);}}><Visibility fontSize="small"/></IconButton></Tooltip></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper></Card>
            <Dialog open={detailOpen} onClose={()=>setDetailOpen(false)} maxWidth="lg" fullWidth PaperProps={{sx:{maxHeight:"92vh"}}}>
                <DialogTitle sx={{fontWeight:700,borderBottom:"1px solid #e0e0e0",pb:2}}>JD Details — {selected?.jdID}</DialogTitle>
                {selected&&<DialogContent sx={{pt:3,pb:1}}>
                    {selected.skills?.length>0&&<Box mt={2}><SectionLabel>Required Skills</SectionLabel><Box display="flex" flexWrap="wrap" gap={0.8}>{selected.skills.map((s,i)=><Chip key={i} label={s} size="small" variant="outlined" sx={{fontSize:11,borderColor:"#0277bd",color:"#0277bd"}}/>)}</Box></Box>}
                    {selected.jobDescription&&<Box mt={2.5} p={2} bgcolor="#f5f7fa" borderRadius={2} border="1px solid #e0e0e0"><SectionLabel>Job Description</SectionLabel><Typography fontSize={13} lineHeight={1.8} sx={{whiteSpace:"pre-wrap"}}>{selected.jobDescription}</Typography></Box>}
                    <Divider sx={{my:3}}/>
                    {selected.mcq_questions?.length>0&&<QuestionSection icon={<Quiz sx={{fontSize:18}}/>} title="MCQ Questions" color="#7b1fa2" count={selected.mcq_questions_count||0} bankCount={selected.mcq_questions.length}>{selected.mcq_questions.map((q,i)=><MCQQuestionCard key={i} question={q} index={i}/>)}</QuestionSection>}
                    {selected.subjective_questions?.length>0&&<QuestionSection icon={<QuestionAnswer sx={{fontSize:18}}/>} title="Subjective Questions" color="#0277bd" count={0} bankCount={selected.subjective_questions.length}>{selected.subjective_questions.map((q,i)=><SubjectiveQuestionCard key={i} question={q} index={i}/>)}</QuestionSection>}
                    {selected.coding_questions?.length>0&&<QuestionSection icon={<Code sx={{fontSize:18}}/>} title="Coding Questions" color="#2e7d32" count={selected.coding_questions_count||0} bankCount={selected.coding_questions.length}>{selected.coding_questions.map((q,i)=><CodingQuestionCard key={i} question={q} index={i}/>)}</QuestionSection>}
                </DialogContent>}
                <DialogActions sx={{px:3,py:2,borderTop:"1px solid #e0e0e0"}}><Button onClick={()=>setDetailOpen(false)} variant="outlined">Close</Button></DialogActions>
            </Dialog>
        </Box>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TAB 0 — Jobs  (receives initial client filter from parent)
// ─────────────────────────────────────────────────────────────────────────────
function JobsTab({ initialClientId, initialClientName, onClearClientFilter }) {
    const navigate = useNavigate();
    const [jobs, setJobs]         = useState([]);
    const [clients, setClients]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");
    const [search, setSearch]     = useState("");
    const [statusF, setStatusF]   = useState("");
    const [priorityF, setPriorityF] = useState("");
    const [clientF, setClientF]   = useState(initialClientId || "");
    const [isLocked, setIsLocked] = useState(!!initialClientId); // true = came from client nav
    const [formOpen, setFormOpen]     = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selected, setSelected]     = useState(null);
    const [formData, setFormData]     = useState(EMPTY_FORM);
    const [saving, setSaving]         = useState(false);
    // ── Question generation state ─────────────────────────────────────────────
    const [genOpen,    setGenOpen]    = useState(false);
    const [genJob,     setGenJob]     = useState(null);
    const [genLoading, setGenLoading] = useState(false);
    const [genError,   setGenError]   = useState("");
    const [genResult,  setGenResult]  = useState(null);
    const [genTab,     setGenTab]     = useState(0);
    const [genConfig, setGenConfig] = useState({
        mcq_count: 10, subjective_count: 5, coding_count: 3, replace_existing: false,
        easy_pct: 20, medium_pct: 55, hard_pct: 25,  
        use_custom_difficulty: false,
      });
    // ── View questions state ──────────────────────────────────────────────────
    const [viewQOpen,    setViewQOpen]    = useState(false);
    const [viewQJob,     setViewQJob]     = useState(null);
    const [viewQData,    setViewQData]    = useState(null);
    const [viewQLoading, setViewQLoading] = useState(false);
    const [viewQError,   setViewQError]   = useState("");
    const [viewQTab,     setViewQTab]     = useState(0);


    const load = useCallback(async () => {
        try { setLoading(true); setError(""); const res = await getAllJobs(); setJobs(res.data || []); }
        catch (err) { setError(err?.message || "Failed to load jobs."); setJobs([]); }
        finally { setLoading(false); }
    }, []);
    const loadClients = useCallback(async () => { try { const res = await getAllClients(); setClients(res.data || []); } catch { setClients([]); } }, []);
    useEffect(() => { load(); loadClients(); }, [load, loadClients]);

    // Sync when URL changes (e.g. navigating from a different client)
    useEffect(() => { setClientF(initialClientId || ""); setIsLocked(!!initialClientId); }, [initialClientId]);

    const clearClientFilter = () => { setClientF(""); setIsLocked(false); onClearClientFilter?.(); };

    const filtered = jobs.filter(j => {
        const q = search.toLowerCase();
        const mQ = !q || j.title?.toLowerCase().includes(q) || j.client_name?.toLowerCase().includes(q) || j.job_id?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) || j.posted_by_name?.toLowerCase().includes(q);
        return mQ && (!statusF || j.status === statusF) && (!priorityF || j.priority === priorityF) && (!clientF || j.client_id === clientF);
    });

    const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
    const openEdit   = j => { setSelected(j); setFormData({ ...EMPTY_FORM, ...j, skills: Array.isArray(j.skills) ? j.skills.join(", ") : (j.skills||""), secondary_skills: Array.isArray(j.secondary_skills) ? j.secondary_skills.join(", ") : (j.secondary_skills||""), deadline: j.deadline ? j.deadline.split("T")[0] : "" }); setFormOpen(true); };
    // const openDetail = j => { setSelected(j); setDetailOpen(true); };
    const openDetail = async (j) => {
        setSelected(j);
        setDetailOpen(true);
        // Load questions if any exist
        if ((j.mcq_questions_count || 0) + (j.subjective_questions_count || 0) + (j.coding_questions_count || 0) > 0) {
          setViewQLoading(true);
          setViewQData(null);
          try {
            const res = await getJobQuestions(j._id);
            setViewQData(res.data);
          } catch { setViewQData(null); }
          finally { setViewQLoading(false); }
        } else {
          setViewQData(null);
        }
      };
    const openDelete = j => { setSelected(j); setDeleteOpen(true); };

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        if (name === "client_id") { const c = clients.find(c => c._id === value); setFormData(p => ({ ...p, client_id: value, client_name: c?.company_name || "" })); }
        else { setFormData(p => ({ ...p, [name]: type === "checkbox" ? checked : value })); }
    };

    const handleSave = async e => {
        e.preventDefault(); setSaving(true);
        try {
            const payload = { ...formData, skills: formData.skills ? formData.skills.split(",").map(s=>s.trim()).filter(Boolean) : [], secondary_skills: formData.secondary_skills ? formData.secondary_skills.split(",").map(s=>s.trim()).filter(Boolean) : [], openings: Number(formData.openings), experience_min: Number(formData.experience_min), experience_max: Number(formData.experience_max), salary_min: formData.salary_min ? Number(formData.salary_min) : 0, salary_max: formData.salary_max ? Number(formData.salary_max) : 0, mcq_questions_count: Number(formData.mcq_questions_count), subjective_questions_count: Number(formData.subjective_questions_count), coding_questions_count: Number(formData.coding_questions_count), screening_time_minutes: Number(formData.screening_time_minutes) };
            selected ? await updateJob(selected._id, payload) : await createJob(payload);
            setFormOpen(false); load();
        } catch (err) { setError(err?.message || "Save failed"); }
        finally { setSaving(false); }
    };
    const handleDelete = async () => { try { await deleteJob(selected._id); setDeleteOpen(false); load(); } catch (err) { setError(err?.message || "Delete failed"); } };
    
    const openGenerate = (job) => {
        setGenJob(job);
        setGenResult(null);
        setGenError("");
        setGenTab(0);
      
        // Seed difficulty percentages from the experience level defaults
        const expInfo = getExpLevel(job?.experience_min, job?.experience_max);
        const diffMap = {
          "Junior":           { easy_pct: 60, medium_pct: 30, hard_pct: 10 },
          "Mid-level":        { easy_pct: 20, medium_pct: 55, hard_pct: 25 },
          "Senior":           { easy_pct: 10, medium_pct: 40, hard_pct: 50 },
          "Lead / Principal": { easy_pct: 5,  medium_pct: 30, hard_pct: 65 },
        };
        const diff = diffMap[expInfo.label] || { easy_pct: 20, medium_pct: 55, hard_pct: 25 };
      
        setGenConfig({
          mcq_count: 10, subjective_count: 5, coding_count: 3,
          replace_existing: false,
          use_custom_difficulty: false,
          ...diff,
        });
        setGenOpen(true);
      };

      const handleGenerate = async () => {
        // Validate difficulty sums to 100 when custom mode is on
        if (genConfig.use_custom_difficulty) {
          const total = genConfig.easy_pct + genConfig.medium_pct + genConfig.hard_pct;
          if (total !== 100) {
            setGenError(`Difficulty percentages must sum to 100% (currently ${total}%)`);
            setGenLoading(false);
            return;
          }
        }
      
        setGenLoading(true); setGenError(""); setGenResult(null);
        try {
          const payload = {
            ...genConfig,
            difficulty_distribution: `${genConfig.easy_pct}% Easy, ${genConfig.medium_pct}% Medium, ${genConfig.hard_pct}% Hard`,
          };
          const res = await generateJobQuestions(genJob._id, payload);
        setGenResult(res.data);
        setGenTab(0);
        load(); // refresh job list so screening counts update
    } catch (err) {
        setGenError(err?.message || "Generation failed — please retry");
    } finally {
        setGenLoading(false);
    }
    };

    const handleRegenerate = () => { setGenResult(null); setGenError(""); };

    const openViewQuestions = async (job) => {
        setViewQJob(job);
        setViewQData(null);
        setViewQError("");
        setViewQTab(0);
        setViewQOpen(true);
        setViewQLoading(true);
        try {
          const res = await getJobQuestions(job._id);
          setViewQData(res.data);
        } catch (err) {
          setViewQError(err?.message || "Failed to load questions");
        } finally {
          setViewQLoading(false);
        }
      };
    if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress size={48} /></Box>;

    const filteredStats = { open: filtered.filter(j=>j.status==="Open").length, critical: filtered.filter(j=>j.priority==="Critical").length, apps: filtered.reduce((s,j)=>s+(j.applications||0),0) };

    return (
        <Box display="flex" flexDirection="column" gap={3}>
            {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

            {/* Client filter banner — only shown when navigated from a client */}
            {isLocked && <ClientFilterBanner name={initialClientName} onClear={clearClientFilter} />}

            <Box display="flex" justifyContent="flex-end">
                <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">Post New Job</Button>
            </Box>

            <Grid container spacing={2.5}>
                <Grid item xs={6} md={3}><StatCard title={isLocked ? "Client Jobs" : "Total Jobs"} value={filtered.length} icon={<Work />} color="#1a237e" sub={isLocked ? `For ${initialClientName}` : "All time"} /></Grid>
                <Grid item xs={6} md={3}><StatCard title="Open Jobs" value={filteredStats.open} icon={<AccessTime />} color="#0277bd" sub="Currently active" /></Grid>
                <Grid item xs={6} md={3}><StatCard title="Critical" value={filteredStats.critical} icon={<ReportProblem />} color="#c62828" sub="Need immediate action" /></Grid>
                <Grid item xs={6} md={3}><StatCard title="Applications" value={filteredStats.apps} icon={<TrendingUp />} color="#2e7d32" sub="Total received" /></Grid>
            </Grid>

            {filtered.length > 0 && (
                <Card><CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" mb={2}>Jobs by Status</Typography>
                    <Grid container spacing={3}>{STATUSES.map(s => { const count = filtered.filter(j=>j.status===s).length; const pct = filtered.length ? (count/filtered.length)*100 : 0; return (<Grid item xs={6} md={3} key={s}><Box display="flex" justifyContent="space-between" mb={0.5}><Typography fontSize={13} fontWeight={600}>{s}</Typography><Typography fontSize={13} color="text.secondary">{count}</Typography></Box><LinearProgress variant="determinate" value={pct} color={STATUS_COLOR[s]||"inherit"} sx={{ height:8,borderRadius:4 }}/></Grid>); })}</Grid>
                </CardContent></Card>
            )}

            <Box display="flex" gap={2} flexWrap="wrap">
                <TextField placeholder="Search by title, client, department…" value={search} onChange={e=>setSearch(e.target.value)} size="small" sx={{ flexGrow:1,minWidth:240 }} InputProps={{ startAdornment:<InputAdornment position="start"><Search fontSize="small" color="action"/></InputAdornment> }}/>
                {/* Client dropdown only shown when not locked to a specific client */}
                {!isLocked && (
                    <TextField select value={clientF} onChange={e=>setClientF(e.target.value)} size="small" sx={{ minWidth:180 }} label="Client">
                        <MenuItem value="">All Clients</MenuItem>
                        {clients.map(c=><MenuItem key={c._id} value={c._id}><Box display="flex" alignItems="center" gap={1}><Business fontSize="small" sx={{color:"#0277bd"}}/>{c.company_name}</Box></MenuItem>)}
                    </TextField>
                )}
                <TextField select value={statusF} onChange={e=>setStatusF(e.target.value)} size="small" sx={{ minWidth:140 }} label="Status"><MenuItem value="">All Statuses</MenuItem>{STATUSES.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
                <TextField select value={priorityF} onChange={e=>setPriorityF(e.target.value)} size="small" sx={{ minWidth:140 }} label="Priority"><MenuItem value="">All Priorities</MenuItem>{PRIORITIES.map(p=><MenuItem key={p} value={p}>{p}</MenuItem>)}</TextField>
            </Box>

            {jobs.length === 0 && !error ? (
                <Card><Box py={6} display="flex" flexDirection="column" alignItems="center" gap={2}><Typography variant="h6" color="text.secondary">No jobs posted yet</Typography><Button variant="contained" startIcon={<Add/>} onClick={openCreate}>Post New Job</Button></Box></Card>
            ) : (
                <Card><Paper variant="outlined" sx={{ borderRadius:2,overflow:"hidden" }}>
                    <Table>
                        <TableHead><TableRow sx={{ bgcolor:"#f5f7fa" }}>{["Job ID","Position","Client","Dept","Type / Mode","Experience","Salary","Openings","Deadline","Posted By","Screening","Priority","Status","Actions"].map(h=><TableCell key={h} sx={{ fontWeight:700,fontSize:12,color:"#546e7a" }}>{h}</TableCell>)}</TableRow></TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={14} align="center" sx={{ py:6,color:"text.secondary" }}>No jobs match your filters</TableCell></TableRow>
                            ) : filtered.map(j => {
                                const daysLeft = calcDaysLeft(j.deadline);
                                return (
                                    <TableRow key={j._id} hover>
                                        <TableCell sx={{ fontWeight:700,color:"#0277bd",fontSize:12 }}>{j.job_id}</TableCell>
                                        <TableCell><Typography fontWeight={600} fontSize={13}>{j.title}</Typography><Typography fontSize={11} color="text.secondary">{j.location}</Typography></TableCell>
                                        <TableCell><ClientLink name={j.client_name} onClick={()=>navigate(`/clients`)} /></TableCell>
                                        <TableCell sx={{ fontSize:12 }}>{j.department||"—"}</TableCell>
                                        <TableCell><Typography fontSize={12}>{j.job_type}</Typography><Typography fontSize={11} color="text.secondary">{j.work_mode}</Typography></TableCell>
                                        <TableCell sx={{ fontSize:12 }}>{j.experience_min}–{j.experience_max} yrs</TableCell>
                                        <TableCell sx={{ fontSize:12 }}>{formatSalary(j.salary_min)} – {formatSalary(j.salary_max)}</TableCell>
                                        <TableCell><Box display="flex" alignItems="center" gap={0.5}><Typography fontSize={13} fontWeight={600}>{j.filled||0}</Typography><Typography fontSize={11} color="text.secondary">/ {j.openings}</Typography></Box><LinearProgress variant="determinate" value={j.openings?((j.filled||0)/j.openings)*100:0} sx={{ height:4,borderRadius:2,mt:0.5,bgcolor:"#e0e0e0","& .MuiLinearProgress-bar":{bgcolor:"#2e7d32"} }}/></TableCell>
                                        <TableCell sx={{ fontSize:12 }}>{daysLeft!==null?(<Box><Typography fontSize={13} fontWeight={600} color={daysLeft<0?"error.main":daysLeft<=7?"warning.main":"text.primary"}>{daysLeft<0?`${Math.abs(daysLeft)}d overdue`:`${daysLeft}d left`}</Typography><Typography fontSize={11} color="text.secondary">{fmtDate(j.deadline)}</Typography></Box>):"—"}</TableCell>
                                        <TableCell><Box display="flex" alignItems="center" gap={1}><Avatar sx={{ width:26,height:26,fontSize:10,fontWeight:700,bgcolor:"#e8eaf6",color:"#1a237e" }}>{nameInitials(j.posted_by_name)}</Avatar><Typography fontSize={12} fontWeight={500}>{j.posted_by_name||"—"}</Typography></Box></TableCell>
                                        <TableCell>{(j.mcq_questions_count>0||j.subjective_questions_count>0||j.coding_questions_count>0)?(<Box display="flex" flexDirection="column" gap={0.3}>{j.mcq_questions_count>0&&<Box display="flex" alignItems="center" gap={0.5}><Quiz sx={{fontSize:12,color:"#7b1fa2"}}/><Typography fontSize={11}>{j.mcq_questions_count} MCQ</Typography></Box>}{j.subjective_questions_count>0&&<Box display="flex" alignItems="center" gap={0.5}><QuestionAnswer sx={{fontSize:12,color:"#0277bd"}}/><Typography fontSize={11}>{j.subjective_questions_count} Subj.</Typography></Box>}{j.coding_questions_count>0&&<Box display="flex" alignItems="center" gap={0.5}><Code sx={{fontSize:12,color:"#2e7d32"}}/><Typography fontSize={11}>{j.coding_questions_count} Code</Typography></Box>}</Box>):<Typography fontSize={11} color="text.disabled">—</Typography>}</TableCell>
                                        <TableCell><Chip label={j.priority} color={PRIORITY_COLOR[j.priority]||"default"} size="small" sx={{ fontWeight:700,fontSize:11 }}/></TableCell>
                                        <TableCell><Chip label={j.status}   color={STATUS_COLOR[j.status]||"default"}     size="small" sx={{ fontWeight:700,fontSize:11 }}/></TableCell>
                                        <TableCell><Box display="flex" gap={0.5}>
                                        <Tooltip title="View Details">
                                            <IconButton size="small" onClick={() => openDetail(j)}><Visibility fontSize="small" /></IconButton>
                                            </Tooltip>
                                            {/* ── Generate Questions button ── */}
                                            <Tooltip title="Generate Interview Questions with AI">
                                            <IconButton size="small" sx={{ color: "#7b1fa2" }} onClick={() => openGenerate(j)}>
                                                <Quiz fontSize="small" />
                                            </IconButton>
                                            </Tooltip>
                                            <Tooltip title="View Candidates for this Job">
                                            <IconButton size="small" sx={{ color: "#2e7d32" }} onClick={() => navigate(`/resumes?job=${j._id}&job_title=${encodeURIComponent(j.title || '')}`)}>
                                                <People fontSize="small" />
                                            </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(j)}><Edit fontSize="small" /></IconButton></Tooltip>
                                            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDelete(j)}><Delete fontSize="small" /></IconButton></Tooltip>
                                            {/* <Tooltip title="View Details"><IconButton size="small" onClick={()=>openDetail(j)}><Visibility fontSize="small"/></IconButton>
                                            </Tooltip><Tooltip title="View Candidates for this Job"><IconButton size="small" sx={{ color: "#2e7d32" }} onClick={()=>navigate(`/resumes?job=${j._id}&job_title=${encodeURIComponent(j.title || '')}`)}><People fontSize="small"/></IconButton>
                                            </Tooltip><Tooltip title="Edit"><IconButton size="small" onClick={()=>openEdit(j)}><Edit fontSize="small"/></IconButton>
                                            </Tooltip><Tooltip title="Delete"><IconButton size="small" color="error" onClick={()=>openDelete(j)}><Delete fontSize="small"/></IconButton>
                                            </Tooltip> */}
                                        </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Paper></Card>
            )}

            {/* Job Detail Dialog */}
            <Dialog open={detailOpen} onClose={()=>setDetailOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight:700,borderBottom:"1px solid #e0e0e0",pb:2 }}>Job Details</DialogTitle>
                {selected&&<DialogContent sx={{ pt:3,pb:1 }}>
                    <Box display="flex" alignItems="center" gap={2.5} mb={3} pb={3} sx={{ borderBottom:"1px solid #e0e0e0" }}>
                        <Avatar sx={{ width:72,height:72,borderRadius:3,background:"linear-gradient(135deg,#00acc1,#0277bd)",flexShrink:0 }}><Work sx={{ fontSize:32,color:"#fff" }}/></Avatar>
                        <Box><Typography variant="h5" fontWeight={800} lineHeight={1.2}>{selected.title}</Typography>
                            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}><ClientLink name={selected.client_name} onClick={()=>setDetailOpen(false)}/>{selected.location&&<Typography color="text.secondary" fontSize={13}>· {selected.location}</Typography>}</Box>
                            <Box display="flex" gap={1} mt={1} flexWrap="wrap"><Chip label={selected.status} color={STATUS_COLOR[selected.status]||"default"} size="small" sx={{fontWeight:700,fontSize:11}}/><Chip label={`${selected.priority} Priority`} color={PRIORITY_COLOR[selected.priority]||"default"} size="small" sx={{fontWeight:700,fontSize:11}}/></Box>
                        </Box>
                    </Box>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={4}><SectionLabel>Job Information</SectionLabel><DetailRow label="Job ID" value={selected.job_id}/><DetailRow label="Department" value={selected.department}/><DetailRow label="Job Type" value={selected.job_type}/><DetailRow label="Work Mode" value={selected.work_mode}/><DetailRow label="Deadline" value={fmtDate(selected.deadline)}/></Grid>
                        <Grid item xs={12} sm={4}><SectionLabel>Requirements</SectionLabel><DetailRow label="Experience" value={`${selected.experience_min}–${selected.experience_max} years`}/><DetailRow label="Salary Range" value={`${formatSalary(selected.salary_min)} – ${formatSalary(selected.salary_max)}`}/><DetailRow label="Openings" value={`${selected.filled||0} / ${selected.openings} filled`}/><DetailRow label="Applicants" value={selected.applications??0}/></Grid>
                        <Grid item xs={12} sm={4}><SectionLabel>Screening</SectionLabel><DetailRow label="MCQ Count" value={selected.mcq_questions_count||0}/><DetailRow label="Subjective" value={selected.subjective_questions_count||0}/><DetailRow label="Coding" value={selected.coding_questions_count||0}/><DetailRow label="Time" value={selected.screening_time_minutes?`${selected.screening_time_minutes} mins`:"—"}/></Grid>
                    </Grid>
                    {selected.skills?.length>0&&<Box mt={2.5}><SectionLabel>Required Skills</SectionLabel><Box display="flex" flexWrap="wrap" gap={0.8}>{selected.skills.map((s,i)=><Chip key={i} label={s.trim()} size="small" variant="outlined" sx={{fontSize:11,borderColor:"#0277bd",color:"#0277bd"}}/>)}</Box></Box>}
                    {/* {selected.description&&<Box mt={2.5} p={2} bgcolor="#f5f7fa" borderRadius={2} border="1px solid #e0e0e0"><SectionLabel>Job Description</SectionLabel><Typography fontSize={13} lineHeight={1.8} sx={{whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{selected.description}</Typography></Box>}
                </DialogContent>} */}
                {selected.description && (
            <Box mt={2.5} p={2} bgcolor="#f5f7fa" borderRadius={2} border="1px solid #e0e0e0">
              <SectionLabel>Job Description</SectionLabel>
              <Typography fontSize={13} lineHeight={1.8} sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {selected.description}
              </Typography>
            </Box>
          )}

          {/* ── Questions section ─────────────────────────────────────────── */}
          {((selected?.mcq_questions_count || 0) + (selected?.subjective_questions_count || 0) + (selected?.coding_questions_count || 0)) > 0 && (
            <Box mt={3}>
              <Divider sx={{ mb: 2.5 }} />

              {/* Header row */}
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: "#e3f2fd" }}>
                    <QuestionAnswer sx={{ fontSize: 17, color: "#0277bd" }} />
                  </Avatar>
                  <Box>
                    <Typography fontSize={13} fontWeight={700} color="text.primary">Question Bank</Typography>
                    <Typography fontSize={11} color="text.secondary">
                      {(selected?.mcq_questions_count || 0) + (selected?.subjective_questions_count || 0) + (selected?.coding_questions_count || 0)} total questions with answers
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small" variant="outlined" startIcon={<Quiz />}
                  onClick={() => { setDetailOpen(false); openGenerate(selected); }}
                  sx={{ fontSize: 11, color: "#7b1fa2", borderColor: "#7b1fa2",
                        "&:hover": { bgcolor: "#f3e5f5" } }}
                >
                  Generate More
                </Button>
              </Box>

              {/* Tab selector */}
              {(() => {
                const mcqCount  = selected?.mcq_questions_count  || 0;
                const subjCount = selected?.subjective_questions_count || 0;
                const codeCount = selected?.coding_questions_count || 0;

                return (
                  <Box display="flex" gap={0.8} mb={2} flexWrap="wrap">
                    {mcqCount > 0 && (
                      <Chip
                        icon={<Quiz sx={{ fontSize: 13 }} />}
                        label={`${mcqCount} MCQ`}
                        size="small"
                        onClick={() => setViewQTab(0)}
                        sx={{
                          cursor: "pointer", fontWeight: 700, fontSize: 11,
                          bgcolor: viewQTab === 0 ? "#7b1fa2" : "#f3e5f5",
                          color:   viewQTab === 0 ? "#fff"    : "#7b1fa2",
                          border:  viewQTab === 0 ? "none" : "1px solid #ce93d8",
                        }}
                      />
                    )}
                    {subjCount > 0 && (
                      <Chip
                        icon={<QuestionAnswer sx={{ fontSize: 13 }} />}
                        label={`${subjCount} Subjective`}
                        size="small"
                        onClick={() => setViewQTab(1)}
                        sx={{
                          cursor: "pointer", fontWeight: 700, fontSize: 11,
                          bgcolor: viewQTab === 1 ? "#0277bd" : "#e3f2fd",
                          color:   viewQTab === 1 ? "#fff"    : "#0277bd",
                          border:  viewQTab === 1 ? "none" : "1px solid #90caf9",
                        }}
                      />
                    )}
                    {codeCount > 0 && (
                      <Chip
                        icon={<Code sx={{ fontSize: 13 }} />}
                        label={`${codeCount} Coding`}
                        size="small"
                        onClick={() => setViewQTab(2)}
                        sx={{
                          cursor: "pointer", fontWeight: 700, fontSize: 11,
                          bgcolor: viewQTab === 2 ? "#2e7d32" : "#e8f5e9",
                          color:   viewQTab === 2 ? "#fff"    : "#2e7d32",
                          border:  viewQTab === 2 ? "none" : "1px solid #a5d6a7",
                        }}
                      />
                    )}
                  </Box>
                );
              })()}

              {/* Questions content */}
              {viewQLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={28} sx={{ color: "#0277bd" }} />
                </Box>
              ) : viewQData ? (
                <Box display="flex" flexDirection="column" gap={1.5}>

                  {/* ── MCQ ── */}
                  {viewQTab === 0 && (viewQData.mcq_questions || []).map((q, i) => {
                    const correctAnswers = Array.isArray(q.correct_answer)
                      ? q.correct_answer.map(String)
                      : [String(q.correct_answer || "")];
                    const diffStyle = DIFFICULTY_COLOR[q.difficulty] || {};
                    return (
                      <Box key={i} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
                        {/* Question header */}
                        <Box sx={{ bgcolor: "#f5f7fa", px: 2, py: 1.5, borderBottom: "1px solid #e0e0e0",
                                   display: "flex", alignItems: "flex-start", gap: 1.5, flexWrap: "wrap" }}>
                          <Chip label={`Q${i + 1}`} size="small"
                            sx={{ bgcolor: "#7b1fa2", color: "#fff", fontWeight: 700, fontSize: 11, height: 20, flexShrink: 0, mt: 0.2 }} />
                          {q.topic && (
                            <Chip label={q.topic} size="small" variant="outlined"
                              sx={{ fontSize: 10, height: 20, borderColor: "#7b1fa2", color: "#7b1fa2", flexShrink: 0, mt: 0.2 }} />
                          )}
                          {q.difficulty && (
                            <Chip label={q.difficulty} size="small"
                              sx={{ fontSize: 10, height: 20, fontWeight: 700, flexShrink: 0, mt: 0.2,
                                    bgcolor: diffStyle.bg, color: diffStyle.text, border: `1px solid ${diffStyle.border}` }} />
                          )}
                          <Typography fontSize={13} fontWeight={600} color="text.primary" lineHeight={1.5} sx={{ flex: 1 }}>
                            {q.question}
                          </Typography>
                        </Box>
                        {/* Options */}
                        <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.7 }}>
                          {(q.options || []).map((opt, j) => {
                            const isCorrect = correctAnswers.includes(String(opt));
                            return (
                              <Box key={j} display="flex" alignItems="center" gap={1.2}
                                sx={{ px: 1.5, py: 0.8, borderRadius: 1.5,
                                      bgcolor: isCorrect ? "#e8f5e9" : "#fafafa",
                                      border:  isCorrect ? "1.5px solid #a5d6a7" : "1px solid #eeeeee" }}>
                                {isCorrect
                                  ? <CheckCircle sx={{ fontSize: 16, color: "#2e7d32", flexShrink: 0 }} />
                                  : <RadioButtonUnchecked sx={{ fontSize: 16, color: "#bdbdbd", flexShrink: 0 }} />}
                                <Typography fontSize={12} fontWeight={isCorrect ? 600 : 400}
                                  color={isCorrect ? "#1b5e20" : "text.secondary"} sx={{ flex: 1 }}>
                                  {opt}
                                </Typography>
                                {isCorrect && (
                                  <Chip label="✓ Correct" size="small"
                                    sx={{ fontSize: 10, height: 18, bgcolor: "#2e7d32", color: "#fff", fontWeight: 700 }} />
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}

                  {/* ── Subjective ── */}
                  {viewQTab === 1 && (viewQData.subjective_questions || []).map((q, i) => {
                    const diffStyle = DIFFICULTY_COLOR[q.difficulty] || DIFFICULTY_COLOR["Medium"];
                    return (
                      <Box key={i} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
                        {/* Question header */}
                        <Box sx={{ bgcolor: "#f5f7fa", px: 2, py: 1.5, borderBottom: "1px solid #e0e0e0",
                                   display: "flex", alignItems: "flex-start", gap: 1.5, flexWrap: "wrap" }}>
                          <Chip label={`Q${i + 1}`} size="small"
                            sx={{ bgcolor: "#0277bd", color: "#fff", fontWeight: 700, fontSize: 11, height: 20, flexShrink: 0, mt: 0.2 }} />
                          {q.skill && (
                            <Chip label={q.skill} size="small" variant="outlined"
                              sx={{ fontSize: 10, height: 20, borderColor: "#0277bd", color: "#0277bd", fontWeight: 600, flexShrink: 0, mt: 0.2 }} />
                          )}
                          {q.difficulty && (
                            <Chip label={q.difficulty} size="small"
                              sx={{ fontSize: 10, height: 20, fontWeight: 700, flexShrink: 0, mt: 0.2,
                                    bgcolor: diffStyle.bg, color: diffStyle.text, border: `1px solid ${diffStyle.border}` }} />
                          )}
                          <Typography fontSize={13} fontWeight={600} color="text.primary" lineHeight={1.5} sx={{ flex: 1 }}>
                            {q.question}
                          </Typography>
                        </Box>
                        {/* Reference answer + key points */}
                        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
                          {q.reference_answer && (
                            <Box>
                              <Typography fontSize={11} fontWeight={700} color="#2e7d32"
                                textTransform="uppercase" letterSpacing={0.5} mb={0.5}>
                                Reference Answer
                              </Typography>
                              <Box sx={{ bgcolor: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 1.5, px: 1.5, py: 1 }}>
                                <Typography fontSize={12} color="#1b5e20" lineHeight={1.7} sx={{ whiteSpace: "pre-wrap" }}>
                                  {q.reference_answer}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          {q.key_points && (
                            <Box>
                              <Typography fontSize={11} fontWeight={700} color="#e65100"
                                textTransform="uppercase" letterSpacing={0.5} mb={0.5}>
                                Key Points to Look For
                              </Typography>
                              <Box sx={{ bgcolor: "#fff8e1", border: "1px solid #ffe082", borderRadius: 1.5, px: 1.5, py: 1 }}>
                                <Typography fontSize={12} color="#bf360c" lineHeight={1.7} sx={{ whiteSpace: "pre-wrap" }}>
                                  {q.key_points}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    );
                  })}

                  {/* ── Coding ── */}
                  {viewQTab === 2 && (viewQData.coding_questions || []).map((q, i) => {
                    const diffStyle = DIFFICULTY_COLOR[q.difficulty] || {};
                    return (
                      <Box key={i} sx={{ border: "1px solid #3d3d5c", borderRadius: 2, overflow: "hidden" }}>
                        {/* Terminal header */}
                        <Box sx={{ bgcolor: "#2d2d3f", px: 2, py: 1, display: "flex", alignItems: "center",
                                   gap: 1.5, borderBottom: "1px solid #3d3d5c" }}>
                          <Box display="flex" gap={0.6}>
                            {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                              <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />
                            ))}
                          </Box>
                          <Code sx={{ fontSize: 14, color: "#82aaff" }} />
                          <Typography fontSize={12} fontWeight={700} color="#82aaff" flex={1}>
                            Problem {i + 1}
                            {q.topic && <span style={{ color: "#a9b1d6", fontWeight: 400 }}> · {q.topic}</span>}
                          </Typography>
                          {q.difficulty && (
                            <Chip label={q.difficulty} size="small"
                              sx={{ fontSize: 9, height: 18, fontWeight: 700,
                                    bgcolor: diffStyle.bg || "#2d2d3f",
                                    color:   diffStyle.text || "#cdd6f4",
                                    border:  `1px solid ${diffStyle.border || "#3d3d5c"}` }} />
                          )}
                          {q.programming_language && (
                            <Chip label={q.programming_language} size="small"
                              sx={{ fontSize: 9, height: 18, bgcolor: "#1a1a2e", color: "#82aaff",
                                    border: "1px solid #414868" }} />
                          )}
                        </Box>
                        {/* Problem body */}
                        <Box sx={{ bgcolor: "#1e1e2e", px: 2.5, py: 2 }}>
                          <Typography fontSize={12} color="#cdd6f4" lineHeight={1.9}
                            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word",
                                  fontFamily: "'Fira Code','Consolas',monospace" }}>
                            {typeof q === "string" ? q : q.question || JSON.stringify(q)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}

                </Box>
              ) : (
                <Box display="flex" justifyContent="center" py={4}>
                  <Typography fontSize={13} color="text.secondary">Could not load questions</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>}
                <DialogActions sx={{ px:3, py:2.5, borderTop:"1px solid #e0e0e0", justifyContent:"flex-start", gap:1.5 }}>
  <Button variant="outlined"
    onClick={() => { setDetailOpen(false); navigate(`/resumes?job=${selected?._id}&job_title=${encodeURIComponent(selected?.title || '')}`); }}
    sx={{ textTransform:"none", fontWeight:600 }}>
    View Candidates
  </Button>
  <Button variant="outlined"
    onClick={() => { setDetailOpen(false); navigate(`/tracking?job=${selected?._id}`); }}
    sx={{ textTransform:"none", fontWeight:600 }}>
    Track Progress
  </Button>

  {/* ── Generate Questions button ── */}
  <Button
    variant="outlined"
    startIcon={<Quiz />}
    onClick={() => { setDetailOpen(false); openGenerate(selected); }}
    sx={{ textTransform:"none", fontWeight:600, color:"#7b1fa2", borderColor:"#7b1fa2",
          "&:hover": { bgcolor:"#f3e5f5", borderColor:"#6a1b9a" } }}
  >
    Generate Questions
  </Button>

  <Box sx={{ flex: 1 }} />
  <Button variant="contained"
    onClick={() => { setDetailOpen(false); openEdit(selected); }}
    sx={{ textTransform:"none", fontWeight:700 }}>
    Edit Job
  </Button>
</DialogActions>
                {/* <DialogActions sx={{ px:3,py:2.5,borderTop:"1px solid #e0e0e0",justifyContent:"flex-start",gap:1.5 }}>
                    <Button variant="outlined" onClick={()=>{setDetailOpen(false);navigate(`/resumes?job=${selected?._id}&job_title=${encodeURIComponent(selected?.title || '')}`);}} sx={{ textTransform:"none",fontWeight:600 }}>View Candidates</Button>
                    <Button variant="outlined" onClick={()=>{setDetailOpen(false);navigate(`/tracking?job=${selected?._id}`);}} sx={{ textTransform:"none",fontWeight:600 }}>Track Progress</Button>
                    <Box sx={{ flex:1 }}/>
                    <Button variant="contained" onClick={()=>{setDetailOpen(false);openEdit(selected);}} sx={{ textTransform:"none",fontWeight:700 }}>Edit Job</Button>
                </DialogActions> */}
            </Dialog>

            {/* Add / Edit Dialog */}
            <Dialog open={formOpen} onClose={()=>setFormOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight:700,borderBottom:"1px solid #e0e0e0" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <span>{selected?"Edit Job":"Post New Job"}</span>
                        {!selected&&<Box display="flex" alignItems="center" gap={1} sx={{ bgcolor:"#e8eaf6",px:1.5,py:0.6,borderRadius:2 }}><Person sx={{fontSize:16,color:"#1a237e"}}/><Typography fontSize={12} fontWeight={600} color="primary.dark">Posting as: {getCurrentUserName()}</Typography></Box>}
                    </Box>
                </DialogTitle>
                <form onSubmit={handleSave}><DialogContent sx={{ pt:3 }}>
                    <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Basic Information</Typography>
                    <Grid container spacing={2} mb={2}>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Job ID" name="job_id" value={formData.job_id} onChange={handleChange} disabled={!!selected}/></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Job Title" name="title" value={formData.title} onChange={handleChange}/></Grid>
                        <Grid item xs={12} sm={6}><TextField select fullWidth size="small" required label="Client" name="client_id" value={formData.client_id} onChange={handleChange}><MenuItem value="">Select Client</MenuItem>{clients.map(c=><MenuItem key={c._id} value={c._id}><Box display="flex" alignItems="center" gap={1}><Business fontSize="small" sx={{color:"#0277bd"}}/>{c.company_name}</Box></MenuItem>)}</TextField></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Location" name="location" value={formData.location} onChange={handleChange}/></Grid>
                        <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Priority" name="priority" value={formData.priority} onChange={handleChange}>{PRIORITIES.map(p=><MenuItem key={p} value={p}>{p}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Status" name="status" value={formData.status} onChange={handleChange}>{STATUSES.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Job Type" name="job_type" value={formData.job_type} onChange={handleChange}>{JOB_TYPES.map(t=><MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Work Mode" name="work_mode" value={formData.work_mode} onChange={handleChange}>{WORK_MODES.map(m=><MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField></Grid>
                    </Grid>
                    <Divider sx={{ my:2 }}/><Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Requirements</Typography>
                    <Grid container spacing={2} mb={2}>
                        <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Openings" name="openings" value={formData.openings} onChange={handleChange} inputProps={{min:1}}/></Grid>
                        <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Min Exp (yrs)" name="experience_min" value={formData.experience_min} onChange={handleChange} inputProps={{min:0}}/></Grid>
                        <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Max Exp (yrs)" name="experience_max" value={formData.experience_max} onChange={handleChange} inputProps={{min:0}}/></Grid>
                        <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="date" label="Deadline" name="deadline" value={formData.deadline} onChange={handleChange} InputLabelProps={{shrink:true}}/></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Min Salary (₹)" name="salary_min" value={formData.salary_min} onChange={handleChange}/></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Max Salary (₹)" name="salary_max" value={formData.salary_max} onChange={handleChange}/></Grid>
                        <Grid item xs={12}><TextField fullWidth multiline rows={3} size="small" label="Required Skills (comma-separated)" name="skills" value={formData.skills} onChange={handleChange}/></Grid>
                    </Grid>
                    <Divider sx={{ my:2 }}/><Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Screening</Typography>
                    <Grid container spacing={2} mb={2}>
                        <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="MCQ Count" name="mcq_questions_count" value={formData.mcq_questions_count} onChange={handleChange} inputProps={{min:0}}/></Grid>
                        <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Subjective Count" name="subjective_questions_count" value={formData.subjective_questions_count} onChange={handleChange} inputProps={{min:0}}/></Grid>
                        <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Coding Count" name="coding_questions_count" value={formData.coding_questions_count} onChange={handleChange} inputProps={{min:0}}/></Grid>
                        <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Screening Time (mins)" name="screening_time_minutes" value={formData.screening_time_minutes} onChange={handleChange} inputProps={{min:0}}/></Grid>
                    </Grid>
                    <Divider sx={{ my:2 }}/><Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Description &amp; Notes</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}><TextField fullWidth multiline rows={8} size="small" label="Job Description" name="description" value={formData.description} onChange={handleChange}/></Grid>
                        <Grid item xs={12}><TextField fullWidth multiline rows={3} size="small" label="Internal Notes" name="notes" value={formData.notes} onChange={handleChange}/></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px:3,pb:2.5,borderTop:"1px solid #e0e0e0" }}>
                    <Button onClick={()=>setFormOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={saving}>{saving?<CircularProgress size={18} sx={{mr:1}}/>:null}{selected?"Update Job":"Post Job"}</Button>
                </DialogActions></form>
            </Dialog>
{/* ══ AI Question Generation Dialog ══════════════════════════════════════ */}
<Dialog
  open={genOpen}
  onClose={() => { if (!genLoading) setGenOpen(false); }}
  maxWidth="lg" fullWidth
  PaperProps={{ sx: { maxHeight: "93vh" } }}
>
  <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 1.5 }}>
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar sx={{ bgcolor: "#f3e5f5", width: 38, height: 38 }}>
          <Quiz sx={{ fontSize: 20, color: "#7b1fa2" }} />
        </Avatar>
        <Box>
          <Typography fontWeight={700} fontSize={15}>AI Question Generator</Typography>
          <Typography fontSize={11} color="text.secondary">
            {genJob?.job_id} · {genJob?.title} · {genJob?.client_name}
          </Typography>
        </Box>
      </Box>
      <IconButton size="small" onClick={() => setGenOpen(false)} disabled={genLoading}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  </DialogTitle>

  <DialogContent sx={{ pt: 2.5 }}>

    {/* ── CONFIG PANEL ── */}
    {!genResult && (() => {
      const expInfo  = getExpLevel(genJob?.experience_min, genJob?.experience_max);
      const totalNew = genConfig.mcq_count + genConfig.subjective_count + genConfig.coding_count;
      const hasExisting =
        (genJob?.mcq_questions_count || 0) +
        (genJob?.subjective_questions_count || 0) +
        (genJob?.coding_questions_count || 0) > 0;

      return (
        <>
{/* Experience band banner */}
<Box display="flex" alignItems="center" gap={2} mb={2} p={1.5}
  sx={{ bgcolor: expInfo.bg, borderRadius: 2, border: `1px solid ${expInfo.color}30` }}>
  <Box flex={1}>
    <Box display="flex" alignItems="center" gap={1} mb={0.3}>
      <Chip label={expInfo.label} size="small"
        sx={{ bgcolor: expInfo.color, color: "#fff", fontWeight: 700, fontSize: 11 }} />
      <Typography fontSize={12} fontWeight={600} color={expInfo.color}>
        {genJob?.experience_min}–{genJob?.experience_max} years experience
      </Typography>
    </Box>
    <Typography fontSize={11} color="text.secondary">{expInfo.hint}</Typography>
  </Box>
</Box>

{/* ── Difficulty distribution configurator ── */}
<Box p={2} bgcolor="#f8f8ff" borderRadius={2} border="1px solid #c5cae9" mb={2}>
  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
    <Box>
      <Typography fontSize={12} fontWeight={700} color="#1a237e">Difficulty distribution</Typography>
      <Typography fontSize={11} color="text.secondary">
        {genConfig.use_custom_difficulty
          ? "Custom — you set the mix"
          : `Auto from experience (${expInfo.label})`}
      </Typography>
    </Box>
    <FormControlLabel
      sx={{ mr: 0 }}
      control={
        <Switch
          size="small"
          checked={genConfig.use_custom_difficulty}
          onChange={e => {
            const custom = e.target.checked;
            if (!custom) {
              // reset to experience defaults
              const diffMap = {
                "Junior":           { easy_pct: 60, medium_pct: 30, hard_pct: 10 },
                "Mid-level":        { easy_pct: 20, medium_pct: 55, hard_pct: 25 },
                "Senior":           { easy_pct: 10, medium_pct: 40, hard_pct: 50 },
                "Lead / Principal": { easy_pct: 5,  medium_pct: 30, hard_pct: 65 },
              };
              const def = diffMap[expInfo.label] || { easy_pct: 20, medium_pct: 55, hard_pct: 25 };
              setGenConfig(p => ({ ...p, use_custom_difficulty: false, ...def }));
            } else {
              setGenConfig(p => ({ ...p, use_custom_difficulty: true }));
            }
          }}
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": { color: "#1a237e" },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#1a237e" },
          }}
        />
      }
      label={<Typography fontSize={11} color="text.secondary">Customise</Typography>}
    />
  </Box>

  {/* Visual bar showing current split */}
  <Box mb={1.5}>
    <Box display="flex" height={10} borderRadius={5} overflow="hidden" gap="2px">
      <Box sx={{ width: `${genConfig.easy_pct}%`, bgcolor: "#2e7d32", transition: "width 0.3s" }} />
      <Box sx={{ width: `${genConfig.medium_pct}%`, bgcolor: "#f57c00", transition: "width 0.3s" }} />
      <Box sx={{ width: `${genConfig.hard_pct}%`, bgcolor: "#c62828", transition: "width 0.3s" }} />
    </Box>
    <Box display="flex" justifyContent="space-between" mt={0.6}>
      {[
        { label: "Easy",   pct: genConfig.easy_pct,   color: "#2e7d32" },
        { label: "Medium", pct: genConfig.medium_pct,  color: "#f57c00" },
        { label: "Hard",   pct: genConfig.hard_pct,    color: "#c62828" },
      ].map(({ label, pct, color }) => (
        <Box key={label} display="flex" alignItems="center" gap={0.5}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
          <Typography fontSize={11} fontWeight={600} color={color}>{label} {pct}%</Typography>
        </Box>
      ))}
      {/* Validation warning */}
      {(genConfig.easy_pct + genConfig.medium_pct + genConfig.hard_pct) !== 100 && (
        <Typography fontSize={11} color="error.main" fontWeight={600}>
          ⚠ Must sum to 100% (currently {genConfig.easy_pct + genConfig.medium_pct + genConfig.hard_pct}%)
        </Typography>
      )}
    </Box>
  </Box>

  {/* Sliders — only editable when custom mode is ON */}
  <Box display="flex" flexDirection="column" gap={1}>
    {[
      { key: "easy_pct",   label: "Easy",   color: "#2e7d32", bg: "#e8f5e9" },
      { key: "medium_pct", label: "Medium", color: "#f57c00", bg: "#fff8e1" },
      { key: "hard_pct",   label: "Hard",   color: "#c62828", bg: "#fce4ec" },
    ].map(({ key, label, color, bg }) => (
      <Box key={key} display="flex" alignItems="center" gap={1.5}>
        <Box sx={{ width: 52, flexShrink: 0 }}>
          <Chip label={label} size="small"
            sx={{ bgcolor: bg, color, fontWeight: 700, fontSize: 10, height: 20, width: "100%" }} />
        </Box>
        <Box flex={1} position="relative">
          <input
            type="range" min={0} max={100}
            value={genConfig[key]}
            disabled={!genConfig.use_custom_difficulty}
            onChange={e => {
              const newVal = Number(e.target.value);
              // Auto-adjust the other two to keep sum = 100
              setGenConfig(prev => {
                const others = key === "easy_pct"
                  ? ["medium_pct", "hard_pct"]
                  : key === "medium_pct"
                  ? ["easy_pct", "hard_pct"]
                  : ["easy_pct", "medium_pct"];

                const remaining   = 100 - newVal;
                const currentSum  = prev[others[0]] + prev[others[1]];

                let a, b;
                if (currentSum === 0) {
                  a = Math.round(remaining / 2);
                  b = remaining - a;
                } else {
                  a = Math.round((prev[others[0]] / currentSum) * remaining);
                  b = remaining - a;
                }
                return { ...prev, [key]: newVal, [others[0]]: a, [others[1]]: b };
              });
            }}
            style={{
              width: "100%",
              accentColor: color,
              cursor: genConfig.use_custom_difficulty ? "pointer" : "not-allowed",
              opacity: genConfig.use_custom_difficulty ? 1 : 0.5,
            }}
          />
        </Box>
        <Box sx={{ width: 36, textAlign: "right" }}>
          <Typography fontSize={12} fontWeight={700} color={color}>
            {genConfig[key]}%
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>

  {!genConfig.use_custom_difficulty && (
    <Typography fontSize={10} color="text.disabled" mt={1}>
      Toggle "Customise" above to manually set the difficulty split
    </Typography>
  )}
</Box>

          {/* JD preview */}
          {genJob?.description ? (
            <Box mb={2} p={1.5} bgcolor="#f5f7fa" borderRadius={2}
              border="1px solid #e0e0e0" maxHeight={100} overflow="auto">
              <Typography fontSize={10} fontWeight={700} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} mb={0.5}>JD Preview</Typography>
              <Typography fontSize={12} color="text.secondary" lineHeight={1.6}>
                {genJob.description.slice(0, 400)}{genJob.description.length > 400 ? "…" : ""}
              </Typography>
            </Box>
          ) : (
            <Alert severity="warning" sx={{ mb: 2, fontSize: 12 }}>
              No job description found. Add a description for higher quality questions.
            </Alert>
          )}

          {/* Skills */}
          {genJob?.skills?.length > 0 && (
            <Box mb={2}>
              <Typography fontSize={10} fontWeight={700} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} mb={0.6}>Skills being tested</Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {genJob.skills.map((s, i) => (
                  <Chip key={i} label={s} size="small" variant="outlined"
                    sx={{ fontSize: 10, height: 20, borderColor: "#7b1fa2", color: "#7b1fa2" }} />
                ))}
              </Box>
            </Box>
          )}

          {/* Count config */}
          <Box p={2} bgcolor="#fdf6ff" borderRadius={2} border="1px solid #ce93d8" mb={2}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography fontSize={12} fontWeight={700} color="#4a148c">
                Configure question counts
              </Typography>
              <Chip label={`${totalNew} questions to generate`} size="small"
                sx={{ bgcolor: "#7b1fa2", color: "#fff", fontSize: 11, fontWeight: 700 }} />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="number" label="MCQ Questions"
                  value={genConfig.mcq_count}
                  onChange={e => setGenConfig(p => ({ ...p, mcq_count: Math.max(0, Math.min(30, Number(e.target.value))) }))}
                  inputProps={{ min: 0, max: 30 }}
                  helperText="Auto-graded · max 30"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Quiz sx={{ fontSize: 16, color: "#7b1fa2" }} /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="number" label="Subjective Questions"
                  value={genConfig.subjective_count}
                  onChange={e => setGenConfig(p => ({ ...p, subjective_count: Math.max(0, Math.min(20, Number(e.target.value))) }))}
                  inputProps={{ min: 0, max: 20 }}
                  helperText="Open-ended · max 20"
                  InputProps={{ startAdornment: <InputAdornment position="start"><QuestionAnswer sx={{ fontSize: 16, color: "#0277bd" }} /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="number" label="Coding Problems"
                  value={genConfig.coding_count}
                  onChange={e => setGenConfig(p => ({ ...p, coding_count: Math.max(0, Math.min(10, Number(e.target.value))) }))}
                  inputProps={{ min: 0, max: 10 }}
                  helperText="Full problems · max 10"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Code sx={{ fontSize: 16, color: "#2e7d32" }} /></InputAdornment> }}
                />
              </Grid>
            </Grid>
            <FormControlLabel sx={{ mt: 1.5 }}
              control={
                <Switch size="small" checked={genConfig.replace_existing}
                  onChange={e => setGenConfig(p => ({ ...p, replace_existing: e.target.checked }))}
                  sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#7b1fa2" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#7b1fa2" } }}
                />
              }
              label={
                <Typography fontSize={12} color={genConfig.replace_existing ? "#880e4f" : "text.secondary"}>
                  {genConfig.replace_existing
                    ? "Replace all existing questions with newly generated ones"
                    : "Append to existing bank (duplicates auto-removed)"}
                </Typography>
              }
            />
          </Box>

          {/* Existing question summary */}
          {hasExisting && (
            <Alert severity={genConfig.replace_existing ? "warning" : "info"} sx={{ mb: 2, fontSize: 12 }}>
              <strong>Current bank:</strong> {genJob.mcq_questions_count || 0} MCQ ·{" "}
              {genJob.subjective_questions_count || 0} subjective ·{" "}
              {genJob.coding_questions_count || 0} coding.{" "}
              {genConfig.replace_existing
                ? "⚠ All will be permanently replaced."
                : "New questions will be appended. Duplicates are auto-detected and skipped."}
            </Alert>
          )}

          {/* Generation history */}
          {genJob?.generation_history?.length > 0 && (
            <Box mb={2}>
              <Typography fontSize={10} fontWeight={700} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} mb={0.8}>
                Generation history ({genJob.generation_history.length} run{genJob.generation_history.length > 1 ? "s" : ""})
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.6}>
                {[...genJob.generation_history].reverse().slice(0, 5).map((h, i) => (
                  <Box key={i} display="flex" alignItems="center" gap={1.5}
                    sx={{ p: 1, bgcolor: "#f5f7fa", borderRadius: 1.5 }}>
                    <Typography fontSize={10} color="text.disabled" sx={{ minWidth: 120 }}>
                      {new Date(h.generated_at).toLocaleString("en-IN")}
                    </Typography>
                    <Chip label={h.exp_level} size="small" sx={{ fontSize: 9, height: 18 }} />
                    <Typography fontSize={11} color="text.secondary" flex={1}>
                      +{h.mcq_added} MCQ · +{h.subj_added} subj · +{h.coding_added} coding
                      {h.duplicates_skipped > 0 && (
                        <span style={{ color: "#f57c00" }}> · {h.duplicates_skipped} dup skipped</span>
                      )}
                    </Typography>
                    {h.replace_existing && (
                      <Chip label="replaced" size="small" color="error" sx={{ fontSize: 9, height: 18 }} />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {genError && <Alert severity="error">{genError}</Alert>}
        </>
      );
    })()}

    {/* ── RESULTS PANEL ── */}
    {genResult && (
      <Box>
        {/* Summary */}
        <Box display="flex" gap={1.5} mb={2} flexWrap="wrap" alignItems="center">
          <Alert severity="success" sx={{ flex: 1, py: 0.5, fontSize: 12 }}>
            Saved to DB — added <strong>{genResult.mcq_added}</strong> MCQ,{" "}
            <strong>{genResult.subj_added}</strong> subjective,{" "}
            <strong>{genResult.coding_added}</strong> coding.
            {genResult.duplicates_skipped > 0 && (
              <span style={{ color: "#e65100" }}> {genResult.duplicates_skipped} duplicate(s) skipped.</span>
            )}
          </Alert>
          <Chip label={genResult.exp_level} size="small"
            sx={{ bgcolor: getExpLevel(genJob?.experience_min, genJob?.experience_max).color,
                  color: "#fff", fontWeight: 700, fontSize: 11 }} />
        </Box>

        {/* Bank totals */}
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          {[
            { label: `${genResult.total_mcq_in_bank} MCQ in bank`,        color: "#7b1fa2" },
            { label: `${genResult.total_subj_in_bank} Subjective in bank`, color: "#0277bd" },
            { label: `${genResult.total_code_in_bank} Coding in bank`,     color: "#2e7d32" },
          ].map(({ label, color }) => (
            <Chip key={label} label={label} size="small" variant="outlined"
              sx={{ fontSize: 10, borderColor: color, color, fontWeight: 600 }} />
          ))}
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={genTab} onChange={(_, v) => setGenTab(v)}
            sx={{ "& .MuiTab-root": { fontWeight: 600, textTransform: "none", minHeight: 40 } }}>
            <Tab label={
              <Box display="flex" alignItems="center" gap={0.8}>
                <Quiz sx={{ fontSize: 16, color: "#7b1fa2" }} />
                <span>{genResult.mcq_added} MCQ added</span>
              </Box>
            } />
            <Tab label={
              <Box display="flex" alignItems="center" gap={0.8}>
                <QuestionAnswer sx={{ fontSize: 16, color: "#0277bd" }} />
                <span>{genResult.subj_added} Subjective added</span>
              </Box>
            } />
            <Tab label={
              <Box display="flex" alignItems="center" gap={0.8}>
                <Code sx={{ fontSize: 16, color: "#2e7d32" }} />
                <span>{genResult.coding_added} Coding added</span>
              </Box>
            } />
          </Tabs>
        </Box>

        {genTab === 0 && (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {genResult.mcq_questions?.length > 0
              ? genResult.mcq_questions.map((q, i) => <MCQQuestionCard key={i} question={q} index={i} />)
              : <Typography color="text.secondary" textAlign="center" py={4} fontSize={13}>
                  No new MCQ questions — all were duplicates or count was 0
                </Typography>}
          </Box>
        )}
        {genTab === 1 && (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {genResult.subjective_questions?.length > 0
              ? genResult.subjective_questions.map((q, i) => <SubjectiveQuestionCard key={i} question={q} index={i} />)
              : <Typography color="text.secondary" textAlign="center" py={4} fontSize={13}>
                  No new subjective questions
                </Typography>}
          </Box>
        )}
        {genTab === 2 && (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {genResult.coding_questions?.length > 0
              ? genResult.coding_questions.map((q, i) => <CodingQuestionCard key={i} question={q} index={i} />)
              : <Typography color="text.secondary" textAlign="center" py={4} fontSize={13}>
                  No new coding questions
                </Typography>}
          </Box>
        )}
      </Box>
    )}
  </DialogContent>

  <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0", gap: 1 }}>
    <Button onClick={() => setGenOpen(false)} disabled={genLoading}>
      {genResult ? "Close" : "Cancel"}
    </Button>
    <Box flex={1} />
    {genResult && (
      <Button variant="outlined" startIcon={<Quiz />} onClick={handleRegenerate}
        sx={{ color: "#7b1fa2", borderColor: "#7b1fa2" }}>
        Generate More
      </Button>
    )}
    {!genResult && (
      <Button variant="contained" onClick={handleGenerate}
        disabled={genLoading || (genConfig.mcq_count + genConfig.subjective_count + genConfig.coding_count === 0)}
        startIcon={genLoading ? <CircularProgress size={16} color="inherit" /> : <Quiz />}
        sx={{ bgcolor: "#7b1fa2", "&:hover": { bgcolor: "#6a1b9a" }, minWidth: 190 }}>
        {genLoading
          ? "Generating with AI…"
          : `Generate ${genConfig.mcq_count + genConfig.subjective_count + genConfig.coding_count} Questions`}
      </Button>
    )}
  </DialogActions>
</Dialog>


            {/* Delete Dialog */}
            <Dialog open={deleteOpen} onClose={()=>setDeleteOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Delete Job</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete <strong>{selected?.title}</strong>?</Typography></DialogContent>
                <DialogActions sx={{ px:3,pb:2 }}><Button onClick={()=>setDeleteOpen(false)}>Cancel</Button><Button variant="contained" color="error" onClick={handleDelete}>Delete</Button></DialogActions>
            </Dialog>
        </Box>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT — reads ?client= and ?client_name= from URL, passes to JobsTab
// ─────────────────────────────────────────────────────────────────────────────
export default function Jobs() {
    const location = useLocation();
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);

    const qp = new URLSearchParams(location.search);
    const [clientId,   setClientId]   = useState(qp.get("client")      || "");
    const [clientName, setClientName] = useState(qp.get("client_name") || "");

    // Keep in sync with URL (handles browser back/forward)
    useEffect(() => {
        const p = new URLSearchParams(location.search);
        setClientId(p.get("client")      || "");
        setClientName(p.get("client_name") || "");
    }, [location.search]);

    const handleClearClientFilter = () => {
        setClientId(""); setClientName("");
        navigate("/jobs", { replace: true });
    };

    return (
        <Box display="flex" flexDirection="column" gap={3}>
            <Box>
                <Typography variant="h4" color="primary.dark">Job Management</Typography>
                <Typography color="text.secondary" mt={0.5}>Track open positions, manage requirements and monitor applications</Typography>
            </Box>
            <Box sx={{ borderBottom: "1px solid #e0e0e0" }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ "& .MuiTab-root": { fontWeight:600,textTransform:"none",fontSize:14 } }}>
                    <Tab label={<Box display="flex" alignItems="center" gap={1}><Work sx={{fontSize:18}}/>Jobs{clientId && <Chip label={clientName||"Client"} size="small" color="info" sx={{fontSize:10,height:18,ml:0.5}}/>}</Box>} />
                    <Tab label={<Box display="flex" alignItems="center" gap={1}><Assignment sx={{fontSize:18}}/>JD Details<Chip label="Resourcing Bot DB" size="small" sx={{fontSize:10,height:18,bgcolor:"#e8eaf6",color:"#1a237e"}}/></Box>} />
                </Tabs>
            </Box>
            {tab === 0 && <JobsTab initialClientId={clientId} initialClientName={clientName} onClearClientFilter={handleClearClientFilter} />}
            {tab === 1 && <JDDetailsTab />}
        </Box>
    );
}