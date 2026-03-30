// // src/pages/Placements.jsx
// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Box, Grid, Card, CardContent, Typography, Button, TextField,
//   MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
//   Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
//   Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
//   InputAdornment, Divider,
// } from "@mui/material";
// import {
//   Add, Search, Edit, Visibility, CheckCircle,
//   AttachMoney, CreditCard, HourglassEmpty, WorkspacePremium,
// } from "@mui/icons-material";

// // ── Inline API calls ──────────────────────────────────────────────────────────
// const BASE = "http://localhost:5000/api";
// const getHeaders = () => ({
//   "Content-Type": "application/json",
//   Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
// });
// const handle = async (res) => {
//   const data = await res.json();
//   if (!res.ok) throw data;
//   return data;
// };

// // ── GET /api/placements/?q=&payment_status=&client_name=&page= ───────────────
// const getAllPlacements = (params = {}) => {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${BASE}/placements/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
// };
// // ── GET /api/placements/:id ───────────────────────────────────────────────────
// const getOnePlacement = (id) =>
//   fetch(`${BASE}/placements/${id}`, { headers: getHeaders() }).then(handle);
// // ── POST /api/placements/ ─────────────────────────────────────────────────────
// const createPlacement = (payload) =>
//   fetch(`${BASE}/placements/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// // ── PUT /api/placements/:id ───────────────────────────────────────────────────
// const updatePlacement = (id, payload) =>
//   fetch(`${BASE}/placements/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// // ── DELETE /api/placements/:id ────────────────────────────────────────────────
// const deletePlacement = (id) =>
//   fetch(`${BASE}/placements/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
// // ── GET /api/clients/ (dropdown) ─────────────────────────────────────────────
// const getAllClients = () =>
//   fetch(`${BASE}/clients/`, { headers: getHeaders() }).then(handle);
// // ─────────────────────────────────────────────────────────────────────────────

// const PAYMENT_STATUSES   = ["Pending", "Partial", "Paid", "Overdue"];
// const CANDIDATE_STATUSES = ["Active", "Probation", "Confirmed", "Resigned", "Terminated"];

// const PAYMENT_COLOR   = { Paid: "success", Pending: "warning", Partial: "info", Overdue: "error" };
// const CANDIDATE_COLOR = { Active: "success", Probation: "info", Confirmed: "primary", Resigned: "default", Terminated: "error" };

// const EMPTY_FORM = {
//   resume_id: "", candidate_name: "", job_id: "", client_name: "",
//   job_title: "", recruiter: "", offer_date: "", joining_date: "",
//   final_ctc: "", billing_amount: "", billing_percentage: "8.33",
//   guarantee_period: 90, payment_status: "Pending",
//   candidate_status: "Active", account_manager: "", notes: "",
// };

// const fmt = (val) => {
//   if (!val) return "—";
//   return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
// };

// const nameInitials = (name = "") =>
//   name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

// // ── Stat Card ─────────────────────────────────────────────────────────────────
// const StatCard = ({ title, value, icon, color }) => (
//   <Card>
//     <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
//       <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
//       <Box>
//         <Typography fontSize={12} color="text.secondary" fontWeight={600} textTransform="uppercase">{title}</Typography>
//         <Typography variant="h5" fontWeight={800} sx={{ color }}>{value}</Typography>
//       </Box>
//     </CardContent>
//   </Card>
// );

// // ── Main ──────────────────────────────────────────────────────────────────────
// export default function Placements() {
//   const [placements, setPlacements] = useState([]);
//   const [clients,    setClients]    = useState([]);
//   const [loading,    setLoading]    = useState(true);
//   const [error,      setError]      = useState("");
//   const [search,     setSearch]     = useState("");
//   const [statusF,    setStatusF]    = useState("");
//   const [paymentF,   setPaymentF]   = useState("");
//   const [clientF,    setClientF]    = useState("");

//   const [formOpen,   setFormOpen]   = useState(false);
//   const [detailOpen, setDetailOpen] = useState(false);
//   const [selected,   setSelected]   = useState(null);
//   const [formData,   setFormData]   = useState(EMPTY_FORM);
//   const [saving,     setSaving]     = useState(false);

//   // ── GET /api/placements/ ─────────────────────────────────────────────────
//   const load = useCallback(async () => {
//     try {
//       setLoading(true); setError("");
//       const res = await getAllPlacements();
//       setPlacements(res.data || []);
//     } catch (err) {
//       setError(err?.message || "Failed to load placements");
//       setPlacements([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const loadClients = useCallback(async () => {
//     try { const res = await getAllClients(); setClients(res.data || []); }
//     catch { setClients([]); }
//   }, []);

//   useEffect(() => { load(); loadClients(); }, [load, loadClients]);

//   const filtered = placements.filter(p => {
//     const q = search.toLowerCase();
//     const mQ = !q || p.candidate_name?.toLowerCase().includes(q) || p.job_title?.toLowerCase().includes(q) || p.placement_id?.toLowerCase().includes(q);
//     const mS = !statusF  || p.candidate_status === statusF;
//     const mP = !paymentF || p.payment_status   === paymentF;
//     const mC = !clientF  || p.client_name      === clientF;
//     return mQ && mS && mP && mC;
//   });

//   const totalBilling  = placements.reduce((s, p) => s + (p.billing_amount || 0), 0);
//   const paidBilling   = placements.filter(p => p.payment_status === "Paid").reduce((s, p) => s + (p.billing_amount || 0), 0);
//   const pendingBilling= placements.filter(p => p.payment_status !== "Paid").reduce((s, p) => s + (p.billing_amount || 0), 0);

//   const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
//   const openEdit   = p  => {
//     setSelected(p);
//     setFormData({
//       ...EMPTY_FORM, ...p,
//       offer_date:   p.offer_date?.split("T")[0]   || "",
//       joining_date: p.joining_date?.split("T")[0] || "",
//     });
//     setFormOpen(true);
//   };
//   const openDetail = p  => { setSelected(p); setDetailOpen(true); };

//   const handleChange = e => {
//     const { name, value } = e.target;
//     setFormData(prev => {
//       const upd = { ...prev, [name]: value };
//       if (name === "final_ctc" && prev.billing_percentage)
//         upd.billing_amount = Math.round((parseFloat(value || 0) * parseFloat(prev.billing_percentage)) / 100);
//       if (name === "billing_percentage" && prev.final_ctc)
//         upd.billing_amount = Math.round((parseFloat(prev.final_ctc || 0) * parseFloat(value)) / 100);
//       return upd;
//     });
//   };

//   // ── POST /api/placements/ or PUT /api/placements/:id ─────────────────────
//   const handleSave = async (e) => {
//     e.preventDefault(); setSaving(true);
//     try {
//       const payload = {
//         ...formData,
//         final_ctc:          Number(formData.final_ctc),
//         billing_amount:     Number(formData.billing_amount),
//         billing_percentage: Number(formData.billing_percentage),
//         guarantee_period:   Number(formData.guarantee_period),
//       };
//       if (selected) { await updatePlacement(selected._id, payload); }
//       else          { await createPlacement(payload); }
//       setFormOpen(false); load();
//     } catch (err) { setError(err?.message || "Save failed"); }
//     finally { setSaving(false); }
//   };

//   if (loading)
//     return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={48} /></Box>;

//   return (
//     <Box display="flex" flexDirection="column" gap={3}>

//       {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

//       {/* Header */}
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
//         <Box>
//           <Typography variant="h4" color="primary.dark">Placements</Typography>
//           <Typography color="text.secondary" mt={0.5}>Track successful hires and manage billing</Typography>
//         </Box>
//         <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">Add Placement</Button>
//       </Box>

//       {/* Stat cards */}
//       <Grid container spacing={2.5}>
//         <Grid item xs={6} md={3}>
//           <StatCard title="Total Placements" value={placements.length}  icon={<CheckCircle />}       color="#2e7d32" />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <StatCard title="Total Revenue"    value={fmt(totalBilling)}  icon={<AttachMoney />}       color="#1a237e" />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <StatCard title="Collected"        value={fmt(paidBilling)}   icon={<CreditCard />}        color="#0277bd" />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <StatCard title="Pending"          value={fmt(pendingBilling)}icon={<HourglassEmpty />}    color="#e65100" />
//         </Grid>
//       </Grid>

//       {/* Filters */}
//       {placements.length > 0 && (
//         <Box display="flex" gap={2} flexWrap="wrap">
//           <TextField
//             placeholder="Search by name, title, or ID…" value={search}
//             onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }}
//             InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }}
//           />
//           <TextField select value={clientF} onChange={e => setClientF(e.target.value)} size="small" sx={{ minWidth: 180 }} label="Client">
//             <MenuItem value="">All Clients</MenuItem>
//             {clients.map(c => <MenuItem key={c._id} value={c.company_name}>{c.company_name}</MenuItem>)}
//           </TextField>
//           <TextField select value={statusF} onChange={e => setStatusF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Status">
//             <MenuItem value="">All Statuses</MenuItem>
//             {CANDIDATE_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//           </TextField>
//           <TextField select value={paymentF} onChange={e => setPaymentF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Payment">
//             <MenuItem value="">All Payments</MenuItem>
//             {PAYMENT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//           </TextField>
//         </Box>
//       )}

//       {/* Empty state */}
//       {placements.length === 0 && !error ? (
//         <Card>
//           <Box display="flex" flexDirection="column" alignItems="center" py={10} gap={2}>
//             <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
//               <WorkspacePremium sx={{ fontSize: 36, color: "#9fa8da" }} />
//             </Avatar>
//             <Typography variant="h6" color="text.secondary">No placements yet</Typography>
//             <Typography fontSize={14} color="text.disabled">Click "Add Placement" to record a successful hire.</Typography>
//             <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ mt: 1 }}>Add Placement</Button>
//           </Box>
//         </Card>
//       ) : (
//         /* Table */
//         <Card>
//           <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//             <Table>
//               <TableHead>
//                 <TableRow sx={{ bgcolor: "#f5f7fa" }}>
//                   {["ID", "Candidate", "Position", "Client", "Joining", "Salary", "Billing", "Payment", "Status", "Actions"].map(h => (
//                     <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
//                   ))}
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {filtered.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
//                       No placements match your filters
//                     </TableCell>
//                   </TableRow>
//                 ) : filtered.map(p => (
//                   <TableRow key={p._id} hover>
//                     <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>{p.placement_id}</TableCell>
//                     <TableCell>
//                       <Box display="flex" alignItems="center" gap={1}>
//                         <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 700, bgcolor: "#2e7d32" }}>
//                           {nameInitials(p.candidate_name)}
//                         </Avatar>
//                         <Box>
//                           <Typography fontWeight={600} fontSize={13}>{p.candidate_name}</Typography>
//                           <Typography fontSize={11} color="text.secondary">{p.recruiter}</Typography>
//                         </Box>
//                       </Box>
//                     </TableCell>
//                     <TableCell sx={{ fontSize: 12 }}>{p.job_title}</TableCell>
//                     <TableCell sx={{ fontSize: 12 }}>{p.client_name}</TableCell>
//                     <TableCell sx={{ fontSize: 12 }}>
//                       {p.joining_date ? new Date(p.joining_date).toLocaleDateString("en-IN") : "—"}
//                     </TableCell>
//                     <TableCell sx={{ fontSize: 12 }}>{fmt(p.final_ctc)}</TableCell>
//                     <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{fmt(p.billing_amount)}</TableCell>
//                     <TableCell>
//                       <Chip label={p.payment_status} color={PAYMENT_COLOR[p.payment_status] || "default"}
//                         size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                     </TableCell>
//                     <TableCell>
//                       <Chip label={p.candidate_status} color={CANDIDATE_COLOR[p.candidate_status] || "default"}
//                         size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                     </TableCell>
//                     <TableCell>
//                       <Box display="flex" gap={0.5}>
//                         <Tooltip title="View">
//                           <IconButton size="small" onClick={() => openDetail(p)}><Visibility fontSize="small" /></IconButton>
//                         </Tooltip>
//                         <Tooltip title="Edit">
//                           <IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton>
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

//       {/* ── Add / Edit Dialog ── */}
//       <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
//           {selected ? "Edit Placement" : "Add New Placement"}
//         </DialogTitle>
//         <form onSubmit={handleSave}>
//           <DialogContent sx={{ pt: 3 }}>

//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Candidate Details</Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Candidate Name *"
//                   name="candidate_name" value={formData.candidate_name} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Resume ID *"
//                   name="resume_id" value={formData.resume_id} onChange={handleChange} placeholder="e.g. RES001" />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Job Title *"
//                   name="job_title" value={formData.job_title} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Job ID *"
//                   name="job_id" value={formData.job_id} onChange={handleChange} placeholder="e.g. JOB001" />
//               </Grid>
//             </Grid>

//             <Divider sx={{ my: 2 }} />
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Client &amp; Recruiter</Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField select fullWidth size="small" required label="Client *"
//                   name="client_name" value={formData.client_name} onChange={handleChange}>
//                   <MenuItem value="">Select Client</MenuItem>
//                   {clients.map(c => <MenuItem key={c._id} value={c.company_name}>{c.company_name}</MenuItem>)}
//                 </TextField>
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Recruiter *"
//                   name="recruiter" value={formData.recruiter} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" type="date" label="Offer Date"
//                   name="offer_date" value={formData.offer_date} onChange={handleChange}
//                   InputLabelProps={{ shrink: true }} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required type="date" label="Joining Date *"
//                   name="joining_date" value={formData.joining_date} onChange={handleChange}
//                   InputLabelProps={{ shrink: true }} />
//               </Grid>
//             </Grid>

//             <Divider sx={{ my: 2 }} />
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Compensation &amp; Billing</Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={4}>
//                 <TextField fullWidth size="small" required type="number" label="Annual CTC (₹) *"
//                   name="final_ctc" value={formData.final_ctc} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <TextField fullWidth size="small" type="number" label="Billing % "
//                   name="billing_percentage" value={formData.billing_percentage} onChange={handleChange}
//                   inputProps={{ step: "0.01" }} />
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <TextField fullWidth size="small" type="number" label="Billing Amount (₹)"
//                   name="billing_amount" value={formData.billing_amount} onChange={handleChange}
//                   helperText="Auto-calculated from CTC × %" />
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <TextField fullWidth size="small" type="number" label="Guarantee Period (days)"
//                   name="guarantee_period" value={formData.guarantee_period} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <TextField select fullWidth size="small" label="Payment Status"
//                   name="payment_status" value={formData.payment_status} onChange={handleChange}>
//                   {PAYMENT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//                 </TextField>
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <TextField select fullWidth size="small" label="Candidate Status"
//                   name="candidate_status" value={formData.candidate_status} onChange={handleChange}>
//                   {CANDIDATE_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//                 </TextField>
//               </Grid>
//             </Grid>

//             <TextField fullWidth multiline rows={2} size="small" label="Notes"
//               name="notes" value={formData.notes} onChange={handleChange} />
//           </DialogContent>
//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//             <Button onClick={() => setFormOpen(false)}>Cancel</Button>
//             <Button type="submit" variant="contained" disabled={saving}>
//               {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
//               {selected ? "Update" : "Create"}
//             </Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//       {/* ── Detail Dialog ── */}
//       <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>Placement Details</DialogTitle>
//         {selected && (
//           <DialogContent sx={{ pt: 3 }}>
//             <Box display="flex" alignItems="center" gap={2} mb={3}>
//               <Avatar sx={{ width: 56, height: 56, bgcolor: "#2e7d32", fontSize: "1.3rem", fontWeight: 700 }}>
//                 {nameInitials(selected.candidate_name)}
//               </Avatar>
//               <Box>
//                 <Typography variant="h5" fontWeight={800}>{selected.candidate_name}</Typography>
//                 <Typography color="text.secondary">{selected.job_title} at {selected.client_name}</Typography>
//                 <Box display="flex" gap={1} mt={0.5}>
//                   <Chip label={selected.candidate_status} color={CANDIDATE_COLOR[selected.candidate_status] || "default"} size="small" sx={{ fontWeight: 700 }} />
//                   <Chip label={selected.payment_status}   color={PAYMENT_COLOR[selected.payment_status] || "default"}     size="small" sx={{ fontWeight: 700 }} />
//                 </Box>
//               </Box>
//             </Box>
//             <Grid container spacing={2}>
//               {[
//                 ["Placement ID",    selected.placement_id],
//                 ["Recruiter",       selected.recruiter],
//                 ["Joining Date",    selected.joining_date ? new Date(selected.joining_date).toLocaleDateString("en-IN") : "—"],
//                 ["Annual CTC",      fmt(selected.final_ctc)],
//                 ["Billing %",       `${selected.billing_percentage || 0}%`],
//                 ["Billing Amount",  fmt(selected.billing_amount)],
//                 ["Guarantee",       `${selected.guarantee_period} days`],
//                 ["Guarantee End",   selected.guarantee_end_date ? new Date(selected.guarantee_end_date).toLocaleDateString("en-IN") : "—"],
//               ].map(([label, val]) => (
//                 <Grid item xs={6} key={label}>
//                   <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
//                   <Typography fontWeight={600} fontSize={13}>{val}</Typography>
//                 </Grid>
//               ))}
//             </Grid>
//             {selected.notes && (
//               <Box mt={2} p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
//                 <Typography fontSize={11} color="text.secondary" fontWeight={700} mb={0.5}>NOTES</Typography>
//                 <Typography fontSize={13}>{selected.notes}</Typography>
//               </Box>
//             )}
//           </DialogContent>
//         )}
//         <DialogActions sx={{ px: 3, pb: 2.5 }}>
//           <Button onClick={() => setDetailOpen(false)}>Close</Button>
//           <Button variant="contained" onClick={() => { setDetailOpen(false); openEdit(selected); }}>Edit</Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }




// src/pages/Placements.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  InputAdornment, Divider,
} from "@mui/material";
import {
  Add, Search, Edit, Visibility, CheckCircle,
  AttachMoney, CreditCard, HourglassEmpty, WorkspacePremium,
} from "@mui/icons-material";

// ── Inline API calls ──────────────────────────────────────────────────────────
const BASE = "http://localhost:5000/api";
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});
const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

const getAllPlacements = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE}/placements/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
};
const createPlacement = (payload) =>
  fetch(`${BASE}/placements/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
const updatePlacement = (id, payload) =>
  fetch(`${BASE}/placements/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
const getAllClients = () =>
  fetch(`${BASE}/clients/`, { headers: getHeaders() }).then(handle);

// ── Constants ─────────────────────────────────────────────────────────────────
const PAYMENT_STATUSES   = ["Pending", "Partial", "Paid", "Overdue"];
const CANDIDATE_STATUSES = ["Active", "Probation", "Confirmed", "Resigned", "Terminated"];

const PAYMENT_COLOR   = { Paid: "success", Pending: "warning", Partial: "info", Overdue: "error" };
const CANDIDATE_COLOR = { Active: "success", Probation: "info", Confirmed: "primary", Resigned: "default", Terminated: "error" };

const EMPTY_FORM = {
  resume_id: "", candidate_name: "", job_id: "", client_name: "",
  job_title: "", recruiter: "", offer_date: "", joining_date: "",
  final_ctc: "", billing_amount: "", billing_percentage: "8.33",
  guarantee_period: 90, payment_status: "Pending",
  candidate_status: "Active", account_manager: "", notes: "",
};

const fmt = (val) => {
  if (!val) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
};

const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
      <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
      <Box>
        <Typography fontSize={12} color="text.secondary" fontWeight={600} textTransform="uppercase">{title}</Typography>
        <Typography variant="h5" fontWeight={800} sx={{ color }}>{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

// ── Detail Row helper — label left, value right with bottom border ─────────────
const DetailRow = ({ label, value }) => (
  <Box
    display="flex" justifyContent="space-between" alignItems="center"
    sx={{ py: 1, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}
  >
    <Typography fontSize={13} color="text.secondary">{label}</Typography>
    <Typography fontSize={13} fontWeight={600} color="text.primary" textAlign="right">
      {value ?? "—"}
    </Typography>
  </Box>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Placements() {
  const [placements, setPlacements] = useState([]);
  const [clients,    setClients]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [statusF,    setStatusF]    = useState("");
  const [paymentF,   setPaymentF]   = useState("");
  const [clientF,    setClientF]    = useState("");

  const [formOpen,   setFormOpen]   = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);

  // ── GET /api/placements/ ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await getAllPlacements();
      setPlacements(res.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load placements");
      setPlacements([]);
    } finally { setLoading(false); }
  }, []);

  const loadClients = useCallback(async () => {
    try { const res = await getAllClients(); setClients(res.data || []); }
    catch { setClients([]); }
  }, []);

  useEffect(() => { load(); loadClients(); }, [load, loadClients]);

  const filtered = placements.filter(p => {
    const q = search.toLowerCase();
    const mQ = !q || p.candidate_name?.toLowerCase().includes(q) || p.job_title?.toLowerCase().includes(q) || p.placement_id?.toLowerCase().includes(q);
    const mS = !statusF  || p.candidate_status === statusF;
    const mP = !paymentF || p.payment_status   === paymentF;
    const mC = !clientF  || p.client_name      === clientF;
    return mQ && mS && mP && mC;
  });

  const totalBilling   = placements.reduce((s, p) => s + (p.billing_amount || 0), 0);
  const paidBilling    = placements.filter(p => p.payment_status === "Paid").reduce((s, p) => s + (p.billing_amount || 0), 0);
  const pendingBilling = placements.filter(p => p.payment_status !== "Paid").reduce((s, p) => s + (p.billing_amount || 0), 0);

  const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
  const openEdit   = p  => {
    setSelected(p);
    setFormData({
      ...EMPTY_FORM, ...p,
      offer_date:   p.offer_date?.split("T")[0]   || "",
      joining_date: p.joining_date?.split("T")[0] || "",
    });
    setFormOpen(true);
  };
  const openDetail = p => { setSelected(p); setDetailOpen(true); };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => {
      const upd = { ...prev, [name]: value };
      if (name === "final_ctc" && prev.billing_percentage)
        upd.billing_amount = Math.round((parseFloat(value || 0) * parseFloat(prev.billing_percentage)) / 100);
      if (name === "billing_percentage" && prev.final_ctc)
        upd.billing_amount = Math.round((parseFloat(prev.final_ctc || 0) * parseFloat(value)) / 100);
      return upd;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        ...formData,
        final_ctc:          Number(formData.final_ctc),
        billing_amount:     Number(formData.billing_amount),
        billing_percentage: Number(formData.billing_percentage),
        guarantee_period:   Number(formData.guarantee_period),
      };
      selected ? await updatePlacement(selected._id, payload) : await createPlacement(payload);
      setFormOpen(false); load();
    } catch (err) { setError(err?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  if (loading)
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={48} /></Box>;

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" color="primary.dark">Placements</Typography>
          <Typography color="text.secondary" mt={0.5}>Track successful hires and manage billing</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">
          Add Placement
        </Button>
      </Box>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={6} md={3}>
          <StatCard title="Total Placements" value={placements.length}   icon={<CheckCircle />}    color="#2e7d32" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Total Revenue"    value={fmt(totalBilling)}   icon={<AttachMoney />}    color="#1a237e" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Collected"        value={fmt(paidBilling)}    icon={<CreditCard />}     color="#0277bd" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Pending"          value={fmt(pendingBilling)} icon={<HourglassEmpty />} color="#e65100" />
        </Grid>
      </Grid>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      {placements.length > 0 && (
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            placeholder="Search by name, title, or ID…" value={search}
            onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }}
          />
          <TextField select value={clientF} onChange={e => setClientF(e.target.value)}
            size="small" sx={{ minWidth: 180 }} label="Client">
            <MenuItem value="">All Clients</MenuItem>
            {clients.map(c => <MenuItem key={c._id} value={c.company_name}>{c.company_name}</MenuItem>)}
          </TextField>
          <TextField select value={statusF} onChange={e => setStatusF(e.target.value)}
            size="small" sx={{ minWidth: 150 }} label="Status">
            <MenuItem value="">All Statuses</MenuItem>
            {CANDIDATE_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select value={paymentF} onChange={e => setPaymentF(e.target.value)}
            size="small" sx={{ minWidth: 150 }} label="Payment">
            <MenuItem value="">All Payments</MenuItem>
            {PAYMENT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Box>
      )}

      {/* ── Empty state or Table ──────────────────────────────────────────── */}
      {placements.length === 0 && !error ? (
        <Card>
          <Box display="flex" flexDirection="column" alignItems="center" py={10} gap={2}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
              <WorkspacePremium sx={{ fontSize: 36, color: "#9fa8da" }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary">No placements yet</Typography>
            <Typography fontSize={14} color="text.disabled">
              Click "Add Placement" to record a successful hire.
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ mt: 1 }}>
              Add Placement
            </Button>
          </Box>
        </Card>
      ) : (
        <Card>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f7fa" }}>
                  {["ID", "Candidate", "Position", "Client", "Joining",
                    "Salary", "Billing", "Payment", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No placements match your filters
                    </TableCell>
                  </TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p._id} hover>
                    <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>{p.placement_id}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 700, bgcolor: "#2e7d32" }}>
                          {nameInitials(p.candidate_name)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600} fontSize={13}>{p.candidate_name}</Typography>
                          <Typography fontSize={11} color="text.secondary">{p.recruiter}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.job_title}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.client_name}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      {p.joining_date ? new Date(p.joining_date).toLocaleDateString("en-IN") : "—"}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{fmt(p.final_ctc)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{fmt(p.billing_amount)}</TableCell>
                    <TableCell>
                      <Chip label={p.payment_status} color={PAYMENT_COLOR[p.payment_status] || "default"}
                        size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={p.candidate_status} color={CANDIDATE_COLOR[p.candidate_status] || "default"}
                        size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => openDetail(p)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(p)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          ── Detail Dialog — matches screenshot layout exactly ──────────────
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 2 }}>
          Placement Details
        </DialogTitle>

        {selected && (
          <DialogContent sx={{ pt: 3, pb: 1 }}>

            {/* ── Candidate header with avatar ───────────────────────────── */}
            <Box display="flex" alignItems="center" gap={2.5} mb={3}
              pb={3} sx={{ borderBottom: "1px solid #e0e0e0" }}>
              <Avatar
                sx={{
                  width: 72, height: 72, borderRadius: 3,
                  background: "linear-gradient(135deg, #1976d2, #1a237e)",
                  fontSize: "2rem", fontWeight: 800, color: "#fff",
                  flexShrink: 0,
                }}
              >
                {nameInitials(selected.candidate_name)}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800} color="text.primary" lineHeight={1.2}>
                  {selected.candidate_name}
                </Typography>
                <Typography color="text.secondary" fontSize={14} mt={0.5}>
                  {selected.job_title}
                  {selected.client_name ? ` at ${selected.client_name}` : ""}
                </Typography>
                <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                  <Chip
                    label={selected.candidate_status}
                    color={CANDIDATE_COLOR[selected.candidate_status] || "default"}
                    size="small" sx={{ fontWeight: 700, fontSize: 11 }}
                  />
                  <Chip
                    label={selected.payment_status}
                    color={PAYMENT_COLOR[selected.payment_status] || "default"}
                    size="small" sx={{ fontWeight: 700, fontSize: 11 }}
                  />
                </Box>
              </Box>
            </Box>

            {/* ── Two-column grid: Employment Details + Billing Information ─ */}
            <Grid container spacing={3}>

              {/* LEFT — Employment Details */}
              <Grid item xs={12} sm={6}>
                <Typography
                  fontSize={11} fontWeight={700} color="text.secondary"
                  textTransform="uppercase" letterSpacing={0.8} mb={1.5}
                >
                  Employment Details
                </Typography>
                <DetailRow
                  label="Joining Date"
                  value={
                    selected.joining_date
                      ? new Date(selected.joining_date).toLocaleDateString("en-IN")
                      : "—"
                  }
                />
                <DetailRow label="Annual Salary" value={fmt(selected.final_ctc)}  />
                <DetailRow label="Recruiter"     value={selected.recruiter}        />
              </Grid>

              {/* RIGHT — Billing Information */}
              <Grid item xs={12} sm={60}>
                <Typography
                  fontSize={11} fontWeight={700} color="text.secondary"
                  textTransform="uppercase" letterSpacing={0.8} mb={1.5}
                >
                  Billing Information
                </Typography>
                <DetailRow
                  label="Billing Rate"
                  value={`${selected.billing_percentage || 0}%`}
                />
                <DetailRow label="Billing Amount"  value={fmt(selected.billing_amount)} />
                <DetailRow
                  label="Guarantee Period"
                  value={`${selected.guarantee_period || 0} days`}
                />
                <DetailRow
                  label="Guarantee End"
                  value={
                    selected.guarantee_end_date
                      ? new Date(selected.guarantee_end_date).toLocaleDateString("en-IN")
                      : "—"
                  }
                />
              </Grid>
            </Grid>

            {/* ── Notes (optional) ──────────────────────────────────────── */}
            {selected.notes && (
              <Box mt={2.5} p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={700}
                  textTransform="uppercase" mb={0.5}>
                  Notes
                </Typography>
                <Typography fontSize={13}>{selected.notes}</Typography>
              </Box>
            )}
          </DialogContent>
        )}

        {/* ── Single action button: Edit Placement ──────────────────────── */}
        <DialogActions
          sx={{
            px: 3, py: 2.5,
            borderTop: "1px solid #e0e0e0",
            justifyContent: "flex-start",
          }}
        >
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => { setDetailOpen(false); openEdit(selected); }}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Edit Placement
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          {selected ? "Edit Placement" : "Add New Placement"}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 3 }}>

            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
              Candidate Details
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Candidate Name *"
                  name="candidate_name" value={formData.candidate_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Resume ID *"
                  name="resume_id" value={formData.resume_id} onChange={handleChange} placeholder="e.g. RES001" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Job Title *"
                  name="job_title" value={formData.job_title} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Job ID *"
                  name="job_id" value={formData.job_id} onChange={handleChange} placeholder="e.g. JOB001" />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
              Client &amp; Recruiter
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" required label="Client *"
                  name="client_name" value={formData.client_name} onChange={handleChange}>
                  <MenuItem value="">Select Client</MenuItem>
                  {clients.map(c => <MenuItem key={c._id} value={c.company_name}>{c.company_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Recruiter *"
                  name="recruiter" value={formData.recruiter} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="date" label="Offer Date"
                  name="offer_date" value={formData.offer_date} onChange={handleChange}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required type="date" label="Joining Date *"
                  name="joining_date" value={formData.joining_date} onChange={handleChange}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
              Compensation &amp; Billing
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" required type="number" label="Annual CTC (₹) *"
                  name="final_ctc" value={formData.final_ctc} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="number" label="Billing %"
                  name="billing_percentage" value={formData.billing_percentage} onChange={handleChange}
                  inputProps={{ step: "0.01" }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="number" label="Billing Amount (₹)"
                  name="billing_amount" value={formData.billing_amount} onChange={handleChange}
                  helperText="Auto-calculated from CTC × %" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="number" label="Guarantee Period (days)"
                  name="guarantee_period" value={formData.guarantee_period} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField select fullWidth size="small" label="Payment Status"
                  name="payment_status" value={formData.payment_status} onChange={handleChange}>
                  {PAYMENT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField select fullWidth size="small" label="Candidate Status"
                  name="candidate_status" value={formData.candidate_status} onChange={handleChange}>
                  {CANDIDATE_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>

            <TextField fullWidth multiline rows={2} size="small" label="Notes"
              name="notes" value={formData.notes} onChange={handleChange} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              {selected ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
}