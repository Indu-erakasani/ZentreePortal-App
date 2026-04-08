

// import React, { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Box, Grid, Card, CardContent, Typography, Button, TextField,
//   MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
//   Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
//   Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
//   InputAdornment, Divider,
// } from "@mui/material";
// import {
//   Add, Search, Edit, Delete, Visibility,
//   People, CheckCircle, Work, Star, Storefront,
//   Business, Email, Phone, LocationOn, WorkOutline, EmojiEvents,
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

// const getAllClients   = (params = {}) => {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${BASE}/clients/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
// };
// const getAllJobs = () =>
//   fetch(`${BASE}/jobs/`, { headers: getHeaders() }).then(handle);
// const createClient   = (payload) =>
//   fetch(`${BASE}/clients/`,    { method: "POST",   headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// const updateClient   = (id, payload) =>
//   fetch(`${BASE}/clients/${id}`, { method: "PUT",  headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// const deleteClient   = (id) =>
//   fetch(`${BASE}/clients/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);

// // ── Constants ─────────────────────────────────────────────────────────────────
// const INDUSTRIES = [
//   "Information Technology", "Banking & Finance", "Healthcare",
//   "Manufacturing", "Retail", "Telecom", "Consulting",
//   "E-commerce", "Automotive", "Energy", "Other",
// ];
// const STATUSES      = ["Active", "Inactive", "On Hold", "Prospect"];
// const PAYMENT_TERMS = ["Net 15", "Net 30", "Net 45", "Net 60"];
// const STATUS_COLOR  = { Active: "success", Inactive: "default", "On Hold": "warning", Prospect: "info" };

// const EMPTY_FORM = {
//   client_id: "", company_name: "", industry: "", company_size: "",
//   location: "", primary_contact: "", contact_title: "", email: "",
//   phone: "", city: "", state: "", country: "India", address: "",
//   website: "", agreement_type: "", payment_terms: "Net 30",
//   relationship_status: "Active", account_manager: "", billing_rate: "", notes: "",
// };

// // ── Stat Card ─────────────────────────────────────────────────────────────────
// const StatCard = ({ title, value, icon, color }) => (
//   <Card>
//     <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
//       <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
//       <Box>
//         <Typography fontSize={12} color="text.secondary" fontWeight={600} textTransform="uppercase">
//           {title}
//         </Typography>
//         <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
//       </Box>
//     </CardContent>
//   </Card>
// );

// // ── Empty State ───────────────────────────────────────────────────────────────
// const EmptyState = ({ onAdd }) => (
//   <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center"
//     py={10} gap={2}>
//     <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
//       <Storefront sx={{ fontSize: 36, color: "#9fa8da" }} />
//     </Avatar>
//     <Typography variant="h6" fontWeight={700} color="text.secondary">No clients yet</Typography>
//     <Typography fontSize={14} color="text.disabled" textAlign="center" maxWidth={320}>
//       No clients have been added yet. Click "Add New Client" to get started.
//     </Typography>
//     <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ mt: 1 }}>
//       Add New Client
//     </Button>
//   </Box>
// );

// // ── Detail Row helper ─────────────────────────────────────────────────────────
// const DetailRow = ({ label, value }) => (
//   <Box display="flex" justifyContent="space-between" alignItems="center"
//     sx={{ py: 1, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}>
//     <Typography fontSize={13} color="text.secondary">{label}</Typography>
//     <Typography fontSize={13} fontWeight={600} color="text.primary" textAlign="right">
//       {value || "—"}
//     </Typography>
//   </Box>
// );

// // ── Main component ────────────────────────────────────────────────────────────
// export default function Clients() {
//   const navigate = useNavigate();

//   const [clients,   setClients]   = useState([]);
//   const [loading,   setLoading]   = useState(true);
//   const [error,     setError]     = useState("");
//   const [search,    setSearch]    = useState("");
//   const [statusF,   setStatusF]   = useState("");
//   const [industryF, setIndustryF] = useState("");
//   const [jobs, setJobs] = useState([]);
//   // Modal state
//   const [formOpen,   setFormOpen]   = useState(false);
//   const [detailOpen, setDetailOpen] = useState(false);
//   const [deleteOpen, setDeleteOpen] = useState(false);
//   const [selected,   setSelected]   = useState(null);
//   const [formData,   setFormData]   = useState(EMPTY_FORM);
//   const [saving,     setSaving]     = useState(false);

//   // ── GET /api/clients/ ─────────────────────────────────────────────────────
//   const load = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const res = await getAllClients();
//       setClients(res.data || []);
//     } catch (err) {
//       setError(err?.message || "Failed to load clients. Please check your connection.");
//       setClients([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);
//   const loadJobs = useCallback(async () => {
//     try { const res = await getAllJobs(); setJobs(res.data || []); }
//     catch { setJobs([]); }
//   }, []);
//   useEffect(() => { load(); loadJobs(); }, [load, loadJobs]);
//   // ── Filtered view ──────────────────────────────────────────────────────────
//   const filtered = clients.filter(c => {
//     const q = search.toLowerCase();
//     const matchQ = !q ||
//       c.company_name?.toLowerCase().includes(q) ||
//       c.primary_contact?.toLowerCase().includes(q) ||
//       c.client_id?.toLowerCase().includes(q);
//     const matchS = !statusF   || c.relationship_status === statusF;
//     const matchI = !industryF || c.industry             === industryF;
//     return matchQ && matchS && matchI;
//   });

//   // ── Stats ─────────────────────────────────────────────────────────────────
//   const stats = {
//     total:      clients.length,
//     active:     clients.filter(c => c.relationship_status === "Active").length,
//     activeJobs: clients.reduce((s, c) => s + (c.active_jobs        || 0), 0),
//     placements: clients.reduce((s, c) => s + (c.total_placements   || 0), 0),
//   };

//   // ── Modal helpers ──────────────────────────────────────────────────────────
//   const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
//   const openEdit   = c  => { setSelected(c);    setFormData({ ...EMPTY_FORM, ...c }); setFormOpen(true); };
//   const openDetail = c  => { setSelected(c);    setDetailOpen(true); };
//   const openDelete = c  => { setSelected(c);    setDeleteOpen(true); };

//   const getJobCountByClient = (clientId) =>
//     jobs.filter(j => j.client_id === clientId).length;
//   const handleChange = e =>
//     setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

//   // ── Save (create / update) ────────────────────────────────────────────────
//   const handleSave = async (e) => {
//     e.preventDefault();
//     setSaving(true);
//     try {
//       selected ? await updateClient(selected._id, formData) : await createClient(formData);
//       setFormOpen(false);
//       load();
//     } catch (err) {
//       setError(err?.message || "Save failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ── Delete ────────────────────────────────────────────────────────────────
//   const handleDelete = async () => {
//     try {
//       await deleteClient(selected._id);
//       setDeleteOpen(false);
//       load();
//     } catch (err) {
//       setError(err?.message || "Delete failed");
//     }
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

//       {/* ── Page header ───────────────────────────────────────────────────── */}
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
//         <Box>
//           <Typography variant="h4" color="primary.dark">Client Management</Typography>
//           <Typography color="text.secondary" mt={0.5}>
//             Manage your client relationships and track engagement
//           </Typography>
//         </Box>
//         <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">
//           Add New Client
//         </Button>
//       </Box>

//       {/* ── Stat cards ────────────────────────────────────────────────────── */}
//       <Grid container spacing={2.5}>
//         <Grid item xs={6} md={3}>
//           <StatCard title="Total Clients"    value={stats.total}      icon={<People />}      color="#1a237e" />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <StatCard title="Active Clients"   value={stats.active}     icon={<CheckCircle />} color="#2e7d32" />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <StatCard title="Active Jobs"      value={stats.activeJobs} icon={<Work />}        color="#0277bd" />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <StatCard title="Total Placements" value={stats.placements} icon={<Star />}        color="#e65100" />
//         </Grid>
//       </Grid>

//       {/* ── Filters ───────────────────────────────────────────────────────── */}
//       {clients.length > 0 && (
//         <Box display="flex" gap={2} flexWrap="wrap">
//           <TextField
//             placeholder="Search by name, contact, or ID…"
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
//           <TextField select value={statusF} onChange={e => setStatusF(e.target.value)}
//             size="small" sx={{ minWidth: 150 }} label="Status">
//             <MenuItem value="">All Statuses</MenuItem>
//             {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//           </TextField>
//           <TextField select value={industryF} onChange={e => setIndustryF(e.target.value)}
//             size="small" sx={{ minWidth: 200 }} label="Industry">
//             <MenuItem value="">All Industries</MenuItem>
//             {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
//           </TextField>
//         </Box>
//       )}

//       {/* ── Table or Empty state ──────────────────────────────────────────── */}
//       {clients.length === 0 && !error ? (
//         <Card><EmptyState onAdd={openCreate} /></Card>
//       ) : (
//         <Card>
//           <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//             <Table>
//               <TableHead>
//                 <TableRow sx={{ bgcolor: "#f5f7fa" }}>
//                   {["Client ID", "Company", "Industry", "Contact Person",
//                     "Location", "Jobs", "Placements", "Status", "Actions"].map(h => (
//                     <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>
//                       {h}
//                     </TableCell>
//                   ))}
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {filtered.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>
//                       No clients match your current filters
//                     </TableCell>
//                   </TableRow>
//                 ) : filtered.map(c => (
//                   <TableRow key={c._id} hover>
//                     <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>
//                       {c.client_id}
//                     </TableCell>
//                     <TableCell>
//                       <Typography fontWeight={600} fontSize={13}>{c.company_name}</Typography>
//                       <Typography fontSize={11} color="text.secondary">{c.email}</Typography>
//                     </TableCell>
//                     <TableCell sx={{ fontSize: 12 }}>{c.industry}</TableCell>
//                     <TableCell>
//                       <Typography fontSize={13}>{c.primary_contact}</Typography>
//                       <Typography fontSize={11} color="text.secondary">{c.contact_title}</Typography>
//                     </TableCell>
//                     <TableCell sx={{ fontSize: 12 }}>{c.city}</TableCell>
//                     <TableCell>
//                       <Chip
//                         label={getJobCountByClient(c._id)}
//                         size="small"
//                         color={getJobCountByClient(c._id) > 0 ? "primary" : "default"}
//                         variant="outlined"
//                         sx={{ fontWeight: 700, cursor: "pointer" }}
//                         onClick={() => navigate(`/jobs?client=${c._id}`)}
//                       />
//                     </TableCell>
//                     <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>
//                       {c.total_placements || 0}
//                     </TableCell>
//                     <TableCell>
//                       <Chip
//                         label={c.relationship_status}
//                         color={STATUS_COLOR[c.relationship_status] || "default"}
//                         size="small" sx={{ fontWeight: 700, fontSize: 11 }}
//                       />
//                     </TableCell>
//                     <TableCell>
//                       <Box display="flex" gap={0.5}>
//                         <Tooltip title="View">
//                           <IconButton size="small" onClick={() => openDetail(c)}>
//                             <Visibility fontSize="small" />
//                           </IconButton>
//                         </Tooltip>
//                         <Tooltip title="Edit">
//                           <IconButton size="small" onClick={() => openEdit(c)}>
//                             <Edit fontSize="small" />
//                           </IconButton>
//                         </Tooltip>
//                         <Tooltip title="Delete">
//                           <IconButton size="small" color="error" onClick={() => openDelete(c)}>
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

//       {/* ════════════════════════════════════════════════════════════════════
//           ── Detail Dialog — matches screenshot layout exactly ──────────────
//           ════════════════════════════════════════════════════════════════════ */}
//       <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 2 }}>
//           Client Details
//         </DialogTitle>

//         {selected && (
//           <DialogContent sx={{ pt: 3, pb: 1 }}>

//             {/* ── Company header with avatar ─────────────────────────────── */}
//             <Box display="flex" alignItems="center" gap={2.5} mb={3}
//               pb={3} sx={{ borderBottom: "1px solid #e0e0e0" }}>
//               <Avatar
//                 sx={{
//                   width: 72, height: 72, borderRadius: 3,
//                   background: "linear-gradient(135deg, #1976d2, #1a237e)",
//                   fontSize: "2rem", fontWeight: 800, color: "#fff",
//                   flexShrink: 0,
//                 }}
//               >
//                 {selected.company_name?.[0]?.toUpperCase()}
//               </Avatar>
//               <Box>
//                 <Typography variant="h5" fontWeight={800} color="text.primary" lineHeight={1.2}>
//                   {selected.company_name}
//                 </Typography>
//                 <Typography color="text.secondary" fontSize={14} mt={0.5}>
//                   {selected.industry}
//                 </Typography>
//                 <Chip
//                   label={selected.relationship_status}
//                   color={STATUS_COLOR[selected.relationship_status] || "default"}
//                   size="small"
//                   sx={{ mt: 1, fontWeight: 700, fontSize: 11 }}
//                 />
//               </Box>
//             </Box>

//             {/* ── Two-column grid: Contact Info + Statistics ─────────────── */}
//             <Grid container spacing={3}>

//               {/* LEFT — Contact Information */}
//               <Grid item xs={12} sm={6}>
//                 <Typography
//                   fontSize={11} fontWeight={700} color="text.secondary"
//                   textTransform="uppercase" letterSpacing={0.8} mb={1.5}
//                 >
//                   Contact Information
//                 </Typography>
//                 <DetailRow label="Contact Person" value={selected.primary_contact} />
//                 <DetailRow label="Designation"    value={selected.contact_title}   />
//                 <DetailRow label="Email"          value={selected.email}           />
//                 <DetailRow label="Phone"          value={selected.phone}           />
//               </Grid>

//               {/* RIGHT — Statistics */}
//               <Grid item xs={12} sm={6}>
//                 <Typography
//                   fontSize={11} fontWeight={700} color="text.secondary"
//                   textTransform="uppercase" letterSpacing={0.8} mb={1.5}
//                 >
//                   Statistics
//                 </Typography>
//                 <DetailRow label="Total Jobs" value={getJobCountByClient(selected._id)} />
//                 <DetailRow label="Total Placements" value={selected.total_placements ?? 0} />
//                 <DetailRow label="Location"         value={selected.city}                  />
//                 <DetailRow label="Client ID"        value={selected.client_id}             />
//               </Grid>
//             </Grid>

//             {/* ── Notes (optional) ──────────────────────────────────────── */}
//             {selected.notes && (
//               <Box mt={2.5} p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
//                 <Typography fontSize={11} color="text.secondary" fontWeight={700}
//                   textTransform="uppercase" mb={0.5}>
//                   Notes
//                 </Typography>
//                 <Typography fontSize={13}>{selected.notes}</Typography>
//               </Box>
//             )}
//           </DialogContent>
//         )}

//         {/* ── Action buttons: View Jobs | View Placements | Edit Client ──── */}
//         <DialogActions
//           sx={{
//             px: 3, py: 2.5,
//             borderTop: "1px solid #e0e0e0",
//             justifyContent: "flex-start",
//             gap: 1.5,
//           }}
//         >
//           {/* View Jobs — navigates to /jobs?client=<id> */}
//           <Button
//             variant="outlined"
//             // startIcon={<WorkOutline />}
//             onClick={() => {
//               setDetailOpen(false);
//               navigate(`/jobs?client=${selected._id}`);
//             }}
//             sx={{ textTransform: "none", fontWeight: 600 }}
//           >
//             View Jobs
//           </Button>

//           {/* View Placements — navigates to /placements?client=<id> */}
//           <Button
//             variant="outlined"
//             // startIcon={<EmojiEvents />}
//             onClick={() => {
//               setDetailOpen(false);
//               navigate(`/placements?client=${selected._id}`);
//             }}
//             sx={{ textTransform: "none", fontWeight: 600 }}
//           >
//             View Placements
//           </Button>

//           {/* Spacer pushes Edit to the right */}
//           <Box sx={{ flex: 1 }} />

//           <Button
//             variant="contained"
//             // startIcon={<Edit />}
//             onClick={() => { setDetailOpen(false); openEdit(selected); }}
//             sx={{ textTransform: "none", fontWeight: 700 }}
//           >
//             Edit Client
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
//       <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
//           {selected ? "Edit Client" : "Add New Client"}
//         </DialogTitle>
//         <form onSubmit={handleSave}>
//           <DialogContent sx={{ pt: 3 }}>

//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
//               Basic Information
//             </Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Client ID *"
//                   name="client_id" value={formData.client_id} onChange={handleChange}
//                   disabled={!!selected} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Company Name *"
//                   name="company_name" value={formData.company_name} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField select fullWidth size="small" required label="Industry *"
//                   name="industry" value={formData.industry} onChange={handleChange}>
//                   {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
//                 </TextField>
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField select fullWidth size="small" label="Status"
//                   name="relationship_status" value={formData.relationship_status} onChange={handleChange}>
//                   {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//                 </TextField>
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Company Size *"
//                   name="company_size" value={formData.company_size} onChange={handleChange}
//                   placeholder="e.g. 100–500" />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Location *"
//                   name="location" value={formData.location} onChange={handleChange} />
//               </Grid>
//             </Grid>

//             <Divider sx={{ my: 2 }} />
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
//               Contact Information
//             </Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Primary Contact *"
//                   name="primary_contact" value={formData.primary_contact} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Title *"
//                   name="contact_title" value={formData.contact_title} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required type="email" label="Email *"
//                   name="email" value={formData.email} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Phone *"
//                   name="phone" value={formData.phone} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={6} sm={4}>
//                 <TextField fullWidth size="small" label="City"
//                   name="city" value={formData.city} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={6} sm={4}>
//                 <TextField fullWidth size="small" label="State"
//                   name="state" value={formData.state} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <TextField fullWidth size="small" label="Country"
//                   name="country" value={formData.country} onChange={handleChange} />
//               </Grid>
//             </Grid>

//             <Divider sx={{ my: 2 }} />
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
//               Billing &amp; Agreement
//             </Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={4}>
//                 <TextField fullWidth size="small" type="number" label="Billing Rate (%)"
//                   name="billing_rate" value={formData.billing_rate} onChange={handleChange}
//                   inputProps={{ step: "0.01" }} />
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <TextField select fullWidth size="small" label="Payment Terms"
//                   name="payment_terms" value={formData.payment_terms} onChange={handleChange}>
//                   {PAYMENT_TERMS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
//                 </TextField>
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <TextField fullWidth size="small" label="Website"
//                   name="website" value={formData.website} onChange={handleChange}
//                   placeholder="https://…" />
//               </Grid>
//             </Grid>

//             <TextField fullWidth multiline rows={3} size="small" label="Notes"
//               name="notes" value={formData.notes} onChange={handleChange} />
//           </DialogContent>
//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//             <Button onClick={() => setFormOpen(false)}>Cancel</Button>
//             <Button type="submit" variant="contained" disabled={saving}>
//               {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
//               {selected ? "Update Client" : "Create Client"}
//             </Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//       {/* ── Delete Confirm Dialog ────────────────────────────────────────── */}
//       <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
//         <DialogTitle fontWeight={700}>Delete Client</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Are you sure you want to delete <strong>{selected?.company_name}</strong>?
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
//   Box, Grid, Card, CardContent, CardActionArea, Typography, Button,
//   TextField, MenuItem, Paper, Chip, IconButton, Tooltip,
//   CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
//   DialogActions, Avatar, InputAdornment, Divider,
// } from "@mui/material";
// import {
//   Add, Search, Edit, Delete, People, CheckCircle, Work, Star,
//   Storefront, Email, Phone, LocationOn, WorkOutline, EmojiEvents,
//   PersonSearch, Close,
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

// const getAllClients = (params = {}) => {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${BASE}/clients/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
// };
// const getAllJobs = () =>
//   fetch(`${BASE}/jobs/`, { headers: getHeaders() }).then(handle);
// const getAllResumes = () =>
//   fetch(`${BASE}/resumes/`, { headers: getHeaders() }).then(handle);
// const createClient = (payload) =>
//   fetch(`${BASE}/clients/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// const updateClient = (id, payload) =>
//   fetch(`${BASE}/clients/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// const deleteClient = (id) =>
//   fetch(`${BASE}/clients/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);

// // ── Constants ─────────────────────────────────────────────────────────────────
// const INDUSTRIES = [
//   "Information Technology", "Banking & Finance", "Healthcare",
//   "Manufacturing", "Retail", "Telecom", "Consulting",
//   "E-commerce", "Automotive", "Energy", "Other",
// ];
// const STATUSES = ["Active", "Inactive", "On Hold", "Prospect"];
// const PAYMENT_TERMS = ["Net 15", "Net 30", "Net 45", "Net 60"];

// const STATUS_COLOR = {
//   Active: "success",
//   Inactive: "default",
//   "On Hold": "warning",
//   Prospect: "info",
// };

// // Gradient per first letter — cycles through 8 colours
// const AVATAR_GRADIENTS = [
//   "linear-gradient(135deg,#1976d2,#1a237e)",
//   "linear-gradient(135deg,#00897b,#004d40)",
//   "linear-gradient(135deg,#e53935,#b71c1c)",
//   "linear-gradient(135deg,#7b1fa2,#4a148c)",
//   "linear-gradient(135deg,#f57c00,#e65100)",
//   "linear-gradient(135deg,#0288d1,#01579b)",
//   "linear-gradient(135deg,#388e3c,#1b5e20)",
//   "linear-gradient(135deg,#c62828,#880e4f)",
// ];

// const avatarGradient = (name = "") => {
//   const code = (name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
//   return AVATAR_GRADIENTS[code];
// };

// const EMPTY_FORM = {
//   client_id: "", company_name: "", industry: "", company_size: "",
//   location: "", primary_contact: "", contact_title: "", email: "",
//   phone: "", city: "", state: "", country: "India", address: "",
//   website: "", agreement_type: "", payment_terms: "Net 30",
//   relationship_status: "Active", account_manager: "", billing_rate: "", notes: "",
// };

// // ── Stat Card ─────────────────────────────────────────────────────────────────
// const StatCard = ({ title, value, icon, color }) => (
//   <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
//     <CardContent sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
//       <Avatar sx={{ bgcolor: `${color}18`, color, width: 44, height: 44 }}>{icon}</Avatar>
//       <Box>
//         <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
//           {title}
//         </Typography>
//         <Typography variant="h5" fontWeight={700} sx={{ color }}>{value}</Typography>
//       </Box>
//     </CardContent>
//   </Card>
// );

// // ── Empty State ───────────────────────────────────────────────────────────────
// const EmptyState = ({ onAdd }) => (
//   <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10} gap={2}>
//     <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
//       <Storefront sx={{ fontSize: 36, color: "#9fa8da" }} />
//     </Avatar>
//     <Typography variant="h6" fontWeight={700} color="text.secondary">No clients yet</Typography>
//     <Typography fontSize={14} color="text.disabled" textAlign="center" maxWidth={320}>
//       No clients have been added. Click "Add New Client" to get started.
//     </Typography>
//     <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ mt: 1 }}>
//       Add New Client
//     </Button>
//   </Box>
// );

// // ── Detail Row ────────────────────────────────────────────────────────────────
// const DetailRow = ({ label, value }) => (
//   <Box display="flex" justifyContent="space-between" alignItems="center"
//     sx={{ py: 0.75, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}>
//     <Typography fontSize={12} color="text.secondary">{label}</Typography>
//     <Typography fontSize={12} fontWeight={600} color="text.primary" textAlign="right">
//       {value || "—"}
//     </Typography>
//   </Box>
// );

// // ── Client Card ───────────────────────────────────────────────────────────────
// const ClientCard = ({ client, isSelected, jobCount, candidateCount, onSelect, onEdit, onDelete, onViewJobs, onViewCandidates }) => (
//   <Card
//     elevation={0}
//     sx={{
//       border: isSelected ? "1.5px solid #1a237e" : "0.5px solid",
//       borderColor: isSelected ? "#1a237e" : "divider",
//       borderRadius: 3,
//       transition: "border-color 0.15s",
//       "&:hover": { borderColor: isSelected ? "#1a237e" : "text.secondary" },
//     }}
//   >
//     {/* Clickable top section */}
//     <CardActionArea onClick={() => onSelect(client)} sx={{ p: 2, borderRadius: "12px 12px 0 0" }}>
//       {/* Header: avatar + company info */}
//       <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
//         <Avatar
//           sx={{
//             width: 48, height: 48, borderRadius: 2,
//             background: avatarGradient(client.company_name),
//             fontSize: "1.3rem", fontWeight: 700, color: "#fff", flexShrink: 0,
//           }}
//         >
//           {client.company_name?.[0]?.toUpperCase()}
//         </Avatar>
//         <Box flex={1} minWidth={0}>
//           <Typography fontWeight={600} fontSize={14} noWrap color="text.primary">
//             {client.company_name}
//           </Typography>
//           <Typography fontSize={11} color="text.secondary" noWrap>{client.industry}</Typography>
//           <Chip
//             label={client.relationship_status}
//             color={STATUS_COLOR[client.relationship_status] || "default"}
//             size="small"
//             sx={{ mt: 0.5, fontSize: 10, height: 20, fontWeight: 700 }}
//           />
//         </Box>
//       </Box>

//       <Divider sx={{ mb: 1.5 }} />

//       {/* Mini stats row */}
//       <Box display="flex" justifyContent="space-around">
//         {[
//           { val: jobCount, lbl: "Jobs" },
//           { val: client.total_placements || 0, lbl: "Placed" },
//           { val: candidateCount, lbl: "Candidates" },
//         ].map(({ val, lbl }) => (
//           <Box key={lbl} textAlign="center">
//             <Typography fontSize={16} fontWeight={700} color="text.primary">{val}</Typography>
//             <Typography fontSize={10} color="text.secondary" textTransform="uppercase" letterSpacing={0.4}>{lbl}</Typography>
//           </Box>
//         ))}
//       </Box>
//     </CardActionArea>

//     {/* Footer action buttons */}
//     <Box
//       display="flex"
//       gap={0.75}
//       px={2}
//       pb={1.5}
//       pt={1}
//       sx={{ borderTop: "0.5px solid", borderColor: "divider" }}
//     >
//       <Button
//         size="small"
//         variant="outlined"
//         sx={{ flex: 1, fontSize: 11, py: 0.4, textTransform: "none" }}
//         onClick={(e) => { e.stopPropagation(); onViewJobs(client); }}
//       >
//         Jobs
//       </Button>
//       <Button
//         size="small"
//         variant="outlined"
//         sx={{ flex: 1, fontSize: 11, py: 0.4, textTransform: "none" }}
//         onClick={(e) => { e.stopPropagation(); onViewCandidates(client); }}
//       >
//         Candidates
//       </Button>
//       <Tooltip title="Edit">
//         <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(client); }}>
//           <Edit sx={{ fontSize: 16 }} />
//         </IconButton>
//       </Tooltip>
//       <Tooltip title="Delete">
//         <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(client); }}>
//           <Delete sx={{ fontSize: 16 }} />
//         </IconButton>
//       </Tooltip>
//     </Box>
//   </Card>
// );

// // ── Inline Detail Panel ───────────────────────────────────────────────────────
// const DetailPanel = ({ client, jobCount, candidateCount, onClose, onEdit, onViewJobs, onViewCandidates }) => (
//   <Card
//     elevation={0}
//     sx={{ border: "0.5px solid", borderColor: "divider", borderRadius: 3, mt: 1 }}
//   >
//     <CardContent sx={{ p: 3 }}>
//       {/* Header */}
//       <Box display="flex" alignItems="flex-start" gap={2} pb={2} mb={2}
//         sx={{ borderBottom: "1px solid #e0e0e0" }}>
//         <Avatar
//           sx={{
//             width: 60, height: 60, borderRadius: 2,
//             background: avatarGradient(client.company_name),
//             fontSize: "1.6rem", fontWeight: 700, color: "#fff", flexShrink: 0,
//           }}
//         >
//           {client.company_name?.[0]?.toUpperCase()}
//         </Avatar>
//         <Box flex={1}>
//           <Typography variant="h6" fontWeight={700} color="text.primary">{client.company_name}</Typography>
//           <Typography fontSize={13} color="text.secondary">
//             {client.industry}{client.city ? ` · ${client.city}` : ""}
//           </Typography>
//           <Chip
//             label={client.relationship_status}
//             color={STATUS_COLOR[client.relationship_status] || "default"}
//             size="small"
//             sx={{ mt: 0.75, fontWeight: 700, fontSize: 11 }}
//           />
//         </Box>
//         <IconButton size="small" onClick={onClose}>
//           <Close fontSize="small" />
//         </IconButton>
//       </Box>

//       {/* Two-column detail */}
//       <Grid container spacing={3}>
//         <Grid item xs={12} sm={6}>
//           <Typography fontSize={11} fontWeight={700} color="text.secondary"
//             textTransform="uppercase" letterSpacing={0.6} mb={1}>
//             Contact Information
//           </Typography>
//           <DetailRow label="Contact Person" value={client.primary_contact} />
//           <DetailRow label="Designation" value={client.contact_title} />
//           <DetailRow label="Email" value={client.email} />
//           <DetailRow label="Phone" value={client.phone} />
//           <DetailRow label="Website" value={client.website} />
//           <DetailRow label="Location" value={[client.city, client.state, client.country].filter(Boolean).join(", ")} />
//         </Grid>

//         <Grid item xs={12} sm={6}>
//           <Typography fontSize={11} fontWeight={700} color="text.secondary"
//             textTransform="uppercase" letterSpacing={0.6} mb={1}>
//             Engagement Summary
//           </Typography>
//           <DetailRow label="Client ID" value={client.client_id} />
//           <DetailRow label="Total Jobs" value={jobCount} />
//           <DetailRow label="Total Candidates" value={candidateCount} />
//           <DetailRow label="Total Placements" value={client.total_placements ?? 0} />
//           <DetailRow label="Billing Rate" value={client.billing_rate ? `${client.billing_rate}%` : null} />
//           <DetailRow label="Payment Terms" value={client.payment_terms} />
//         </Grid>
//       </Grid>

//       {/* Notes */}
//       {client.notes && (
//         <Box mt={2} p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
//           <Typography fontSize={11} color="text.secondary" fontWeight={700}
//             textTransform="uppercase" mb={0.5}>Notes</Typography>
//           <Typography fontSize={13}>{client.notes}</Typography>
//         </Box>
//       )}

//       {/* Action strip */}
//       <Box display="flex" alignItems="center" gap={1.5} mt={2.5} pt={2}
//         sx={{ borderTop: "1px solid #e0e0e0" }}>
//         <Button
//           variant="outlined"
//           startIcon={<WorkOutline />}
//           onClick={() => onViewJobs(client)}
//           sx={{ textTransform: "none", fontWeight: 600 }}
//         >
//           View Jobs
//         </Button>
//         <Button
//           variant="outlined"
//           startIcon={<PersonSearch />}
//           onClick={() => onViewCandidates(client)}
//           sx={{ textTransform: "none", fontWeight: 600 }}
//         >
//           View Candidates
//         </Button>
//         <Box flex={1} />
//         <Button
//           variant="contained"
//           startIcon={<Edit />}
//           onClick={() => onEdit(client)}
//           sx={{ textTransform: "none", fontWeight: 700 }}
//         >
//           Edit Client
//         </Button>
//       </Box>
//     </CardContent>
//   </Card>
// );

// // ══════════════════════════════════════════════════════════════════════════════
// //  Main Component
// // ══════════════════════════════════════════════════════════════════════════════
// export default function Clients() {
//   const navigate = useNavigate();

//   const [clients,   setClients]   = useState([]);
//   const [jobs,      setJobs]      = useState([]);
//   const [resumes,   setResumes]   = useState([]);
//   const [loading,   setLoading]   = useState(true);
//   const [error,     setError]     = useState("");
//   const [search,    setSearch]    = useState("");
//   const [statusF,   setStatusF]   = useState("");
//   const [industryF, setIndustryF] = useState("");

//   // selected card — drives the inline detail panel
//   const [selected,   setSelected]   = useState(null);

//   // form / delete dialogs
//   const [formOpen,   setFormOpen]   = useState(false);
//   const [deleteOpen, setDeleteOpen] = useState(false);
//   const [formTarget, setFormTarget] = useState(null);   // client being edited
//   const [formData,   setFormData]   = useState(EMPTY_FORM);
//   const [saving,     setSaving]     = useState(false);

//   // ── Data fetching ──────────────────────────────────────────────────────────
//   const load = useCallback(async () => {
//     try {
//       setLoading(true); setError("");
//       const res = await getAllClients();
//       setClients(res.data || []);
//     } catch (err) {
//       setError(err?.message || "Failed to load clients.");
//       setClients([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const loadJobs = useCallback(async () => {
//     try { const r = await getAllJobs(); setJobs(r.data || []); } catch { setJobs([]); }
//   }, []);

//   const loadResumes = useCallback(async () => {
//     try { const r = await getAllResumes(); setResumes(r.data || []); } catch { setResumes([]); }
//   }, []);

//   useEffect(() => { load(); loadJobs(); loadResumes(); }, [load, loadJobs, loadResumes]);

//   // ── Derived counts ─────────────────────────────────────────────────────────
//   const jobCount       = (c) => jobs.filter(j => j.client_id === c.client_id || j.client_id === c._id).length;
//   const candidateCount = (c) => resumes.filter(r => r.client_id === c.client_id || r.linked_job_id && jobs.some(j => (j.client_id === c.client_id || j.client_id === c._id) && j.job_id === r.linked_job_id)).length;

//   // ── Filtering ──────────────────────────────────────────────────────────────
//   const filtered = clients.filter(c => {
//     const q = search.toLowerCase();
//     const matchQ = !q ||
//       c.company_name?.toLowerCase().includes(q) ||
//       c.primary_contact?.toLowerCase().includes(q) ||
//       c.client_id?.toLowerCase().includes(q);
//     return matchQ && (!statusF || c.relationship_status === statusF) && (!industryF || c.industry === industryF);
//   });

//   // ── Stats ──────────────────────────────────────────────────────────────────
//   const stats = {
//     total:      clients.length,
//     active:     clients.filter(c => c.relationship_status === "Active").length,
//     activeJobs: jobs.length,
//     placements: clients.reduce((s, c) => s + (c.total_placements || 0), 0),
//   };

//   // ── Card selection — clicking same card collapses panel ───────────────────
//   const handleSelect = (c) => setSelected(prev => prev?._id === c._id ? null : c);

//   // ── Navigation helpers ─────────────────────────────────────────────────────
//   const goJobs       = (c) => navigate(`/jobs?client=${c._id}`);
//   const goCandidates = (c) => navigate(`/resumes?client=${c._id}`);

//   // ── Form helpers ───────────────────────────────────────────────────────────
//   const openCreate = () => { setFormTarget(null); setFormData(EMPTY_FORM); setFormOpen(true); };
//   const openEdit   = (c) => { setFormTarget(c); setFormData({ ...EMPTY_FORM, ...c }); setFormOpen(true); };
//   const openDelete = (c) => { setFormTarget(c); setDeleteOpen(true); };

//   const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

//   const handleSave = async (e) => {
//     e.preventDefault(); setSaving(true);
//     try {
//       formTarget ? await updateClient(formTarget._id, formData) : await createClient(formData);
//       setFormOpen(false);
//       // Refresh selected client data if we just edited it
//       if (formTarget && selected?._id === formTarget._id) setSelected(null);
//       load();
//     } catch (err) {
//       setError(err?.message || "Save failed");
//     } finally { setSaving(false); }
//   };

//   const handleDelete = async () => {
//     try {
//       await deleteClient(formTarget._id);
//       setDeleteOpen(false);
//       if (selected?._id === formTarget._id) setSelected(null);
//       load();
//     } catch (err) {
//       setError(err?.message || "Delete failed");
//     }
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

//       {/* ── Page header ──────────────────────────────────────────────────── */}
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
//         <Box>
//           <Typography variant="h4" color="primary.dark">Client Management</Typography>
//           <Typography color="text.secondary" mt={0.5}>
//             Manage your client relationships and track engagement
//           </Typography>
//         </Box>
//         <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">
//           Add New Client
//         </Button>
//       </Box>

//       {/* ── Stat cards ───────────────────────────────────────────────────── */}
//       <Grid container spacing={2.5}>
//         {[
//           { title: "Total Clients",    value: stats.total,      icon: <People />,      color: "#1a237e" },
//           { title: "Active Clients",   value: stats.active,     icon: <CheckCircle />, color: "#2e7d32" },
//           { title: "Active Jobs",      value: stats.activeJobs, icon: <Work />,        color: "#0277bd" },
//           { title: "Total Placements", value: stats.placements, icon: <Star />,        color: "#e65100" },
//         ].map(s => (
//           <Grid item xs={6} md={3} key={s.title}>
//             <StatCard {...s} />
//           </Grid>
//         ))}
//       </Grid>

//       {/* ── Filters ──────────────────────────────────────────────────────── */}
//       {clients.length > 0 && (
//         <Box display="flex" gap={2} flexWrap="wrap">
//           <TextField
//             placeholder="Search by name, contact or ID…"
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
//           <TextField select value={statusF} onChange={e => setStatusF(e.target.value)}
//             size="small" sx={{ minWidth: 150 }} label="Status">
//             <MenuItem value="">All Statuses</MenuItem>
//             {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//           </TextField>
//           <TextField select value={industryF} onChange={e => setIndustryF(e.target.value)}
//             size="small" sx={{ minWidth: 200 }} label="Industry">
//             <MenuItem value="">All Industries</MenuItem>
//             {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
//           </TextField>
//         </Box>
//       )}

//       {/* ── Card grid or empty state ─────────────────────────────────────── */}
//       {clients.length === 0 && !error ? (
//         <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
//           <EmptyState onAdd={openCreate} />
//         </Card>
//       ) : filtered.length === 0 ? (
//         <Typography color="text.secondary" textAlign="center" py={6}>
//           No clients match your current filters.
//         </Typography>
//       ) : (
//         <Grid container spacing={2}>
//           {filtered.map(c => (
//             <Grid item xs={12} sm={6} md={4} key={c._id}>
//               <ClientCard
//                 client={c}
//                 isSelected={selected?._id === c._id}
//                 jobCount={jobCount(c)}
//                 candidateCount={candidateCount(c)}
//                 onSelect={handleSelect}
//                 onEdit={(cl) => { openEdit(cl); }}
//                 onDelete={(cl) => { openDelete(cl); }}
//                 onViewJobs={goJobs}
//                 onViewCandidates={goCandidates}
//               />
//             </Grid>
//           ))}
//         </Grid>
//       )}

//       {/* ── Inline detail panel — rendered below the grid when a card is selected ── */}
//       {selected && (
//         <DetailPanel
//           client={selected}
//           jobCount={jobCount(selected)}
//           candidateCount={candidateCount(selected)}
//           onClose={() => setSelected(null)}
//           onEdit={(c) => { openEdit(c); setSelected(null); }}
//           onViewJobs={goJobs}
//           onViewCandidates={goCandidates}
//         />
//       )}

//       {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
//       <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
//           {formTarget ? "Edit Client" : "Add New Client"}
//         </DialogTitle>
//         <form onSubmit={handleSave}>
//           <DialogContent sx={{ pt: 3 }}>

//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
//               Basic Information
//             </Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Client ID *"
//                   name="client_id" value={formData.client_id} onChange={handleChange}
//                   disabled={!!formTarget} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Company Name *"
//                   name="company_name" value={formData.company_name} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField select fullWidth size="small" required label="Industry *"
//                   name="industry" value={formData.industry} onChange={handleChange}>
//                   {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
//                 </TextField>
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField select fullWidth size="small" label="Status"
//                   name="relationship_status" value={formData.relationship_status} onChange={handleChange}>
//                   {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//                 </TextField>
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Company Size *"
//                   name="company_size" value={formData.company_size} onChange={handleChange}
//                   placeholder="e.g. 100–500" />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" label="Location"
//                   name="location" value={formData.location} onChange={handleChange} />
//               </Grid>
//             </Grid>

//             <Divider sx={{ my: 2 }} />
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
//               Contact Information
//             </Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Primary Contact *"
//                   name="primary_contact" value={formData.primary_contact} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Title *"
//                   name="contact_title" value={formData.contact_title} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required type="email" label="Email *"
//                   name="email" value={formData.email} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Phone *"
//                   name="phone" value={formData.phone} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={6} sm={4}>
//                 <TextField fullWidth size="small" label="City"
//                   name="city" value={formData.city} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={6} sm={4}>
//                 <TextField fullWidth size="small" label="State"
//                   name="state" value={formData.state} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <TextField fullWidth size="small" label="Country"
//                   name="country" value={formData.country} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField fullWidth size="small" label="Website"
//                   name="website" value={formData.website} onChange={handleChange}
//                   placeholder="https://…" />
//               </Grid>
//             </Grid>

//             <Divider sx={{ my: 2 }} />
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
//               Billing &amp; Agreement
//             </Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" type="number" label="Billing Rate (%)"
//                   name="billing_rate" value={formData.billing_rate} onChange={handleChange}
//                   inputProps={{ step: "0.01" }} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField select fullWidth size="small" label="Payment Terms"
//                   name="payment_terms" value={formData.payment_terms} onChange={handleChange}>
//                   {PAYMENT_TERMS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
//                 </TextField>
//               </Grid>
//             </Grid>

//             <TextField fullWidth multiline rows={3} size="small" label="Notes"
//               name="notes" value={formData.notes} onChange={handleChange} />
//           </DialogContent>

//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//             <Button onClick={() => setFormOpen(false)}>Cancel</Button>
//             <Button type="submit" variant="contained" disabled={saving}>
//               {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
//               {formTarget ? "Update Client" : "Create Client"}
//             </Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//       {/* ── Delete Confirm ────────────────────────────────────────────────── */}
//       <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
//         <DialogTitle fontWeight={700}>Delete Client</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Are you sure you want to delete <strong>{formTarget?.company_name}</strong>?
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
//   Box, Grid, Card, CardContent, CardActionArea, Typography, Button,
//   TextField, MenuItem, Paper, Chip, IconButton, Tooltip,
//   CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
//   DialogActions, Avatar, InputAdornment, Divider,
// } from "@mui/material";
// import {
//   Add, Search, Edit, Delete, People, CheckCircle, Work, Star,
//   Storefront, Email, Phone, LocationOn, WorkOutline, EmojiEvents,
//   PersonSearch, Close,
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

// const getAllClients = (params = {}) => {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${BASE}/clients/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
// };
// const getAllJobs = () =>
//   fetch(`${BASE}/jobs/`, { headers: getHeaders() }).then(handle);
// const getAllResumes = () =>
//   fetch(`${BASE}/resumes/`, { headers: getHeaders() }).then(handle);
// const createClient = (payload) =>
//   fetch(`${BASE}/clients/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// const updateClient = (id, payload) =>
//   fetch(`${BASE}/clients/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// const deleteClient = (id) =>
//   fetch(`${BASE}/clients/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);

// // ── Constants ─────────────────────────────────────────────────────────────────
// const INDUSTRIES = [
//   "Information Technology", "Banking & Finance", "Healthcare",
//   "Manufacturing", "Retail", "Telecom", "Consulting",
//   "E-commerce", "Automotive", "Energy", "Other",
// ];
// const STATUSES = ["Active", "Inactive", "On Hold", "Prospect"];
// const PAYMENT_TERMS = ["Net 15", "Net 30", "Net 45", "Net 60"];

// const STATUS_COLOR = {
//   Active: "success",
//   Inactive: "default",
//   "On Hold": "warning",
//   Prospect: "info",
// };

// // Gradient per first letter — cycles through 8 colours
// const AVATAR_GRADIENTS = [
//   "linear-gradient(135deg,#1976d2,#1a237e)",
//   "linear-gradient(135deg,#00897b,#004d40)",
//   "linear-gradient(135deg,#e53935,#b71c1c)",
//   "linear-gradient(135deg,#7b1fa2,#4a148c)",
//   "linear-gradient(135deg,#f57c00,#e65100)",
//   "linear-gradient(135deg,#0288d1,#01579b)",
//   "linear-gradient(135deg,#388e3c,#1b5e20)",
//   "linear-gradient(135deg,#c62828,#880e4f)",
// ];

// const avatarGradient = (name = "") => {
//   const code = (name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
//   return AVATAR_GRADIENTS[code];
// };

// const EMPTY_FORM = {
//   client_id: "", company_name: "", industry: "", company_size: "",
//   location: "", primary_contact: "", contact_title: "", email: "",
//   phone: "", city: "", state: "", country: "India", address: "",
//   website: "", agreement_type: "", payment_terms: "Net 30",
//   relationship_status: "Active", account_manager: "", billing_rate: "", notes: "",
// };

// // ── Stat Card ─────────────────────────────────────────────────────────────────
// const StatCard = ({ title, value, icon, color }) => (
//   <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
//     <CardContent sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
//       <Avatar sx={{ bgcolor: `${color}18`, color, width: 44, height: 44 }}>{icon}</Avatar>
//       <Box>
//         <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
//           {title}
//         </Typography>
//         <Typography variant="h5" fontWeight={700} sx={{ color }}>{value}</Typography>
//       </Box>
//     </CardContent>
//   </Card>
// );

// // ── Empty State ───────────────────────────────────────────────────────────────
// const EmptyState = ({ onAdd }) => (
//   <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10} gap={2}>
//     <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
//       <Storefront sx={{ fontSize: 36, color: "#9fa8da" }} />
//     </Avatar>
//     <Typography variant="h6" fontWeight={700} color="text.secondary">No clients yet</Typography>
//     <Typography fontSize={14} color="text.disabled" textAlign="center" maxWidth={320}>
//       No clients have been added. Click "Add New Client" to get started.
//     </Typography>
//     <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ mt: 1 }}>
//       Add New Client
//     </Button>
//   </Box>
// );

// // ── Detail Row ────────────────────────────────────────────────────────────────
// const DetailRow = ({ label, value }) => (
//   <Box display="flex" justifyContent="space-between" alignItems="center"
//     sx={{ py: 0.75, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}>
//     <Typography fontSize={12} color="text.secondary">{label}</Typography>
//     <Typography fontSize={12} fontWeight={600} color="text.primary" textAlign="right">
//       {value || "—"}
//     </Typography>
//   </Box>
// );

// // ── Client Card ───────────────────────────────────────────────────────────────
// const ClientCard = ({ client, isSelected, jobCount, candidateCount, onSelect, onEdit, onDelete, onViewJobs, onViewCandidates }) => (
//   <Card
//     elevation={0}
//     sx={{
//       border: isSelected ? "1.5px solid #1a237e" : "0.5px solid",
//       borderColor: isSelected ? "#1a237e" : "divider",
//       borderRadius: 3,
//       transition: "border-color 0.15s",
//       "&:hover": { borderColor: isSelected ? "#1a237e" : "text.secondary" },
//     }}
//   >
//     {/* Clickable top section */}
//     <CardActionArea onClick={() => onSelect(client)} sx={{ p: 2, borderRadius: "12px 12px 0 0" }}>
//       {/* Header: avatar + company info */}
//       <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
//         <Avatar
//           sx={{
//             width: 48, height: 48, borderRadius: 2,
//             background: avatarGradient(client.company_name),
//             fontSize: "1.3rem", fontWeight: 700, color: "#fff", flexShrink: 0,
//           }}
//         >
//           {client.company_name?.[0]?.toUpperCase()}
//         </Avatar>
//         <Box flex={1} minWidth={0}>
//           <Typography fontWeight={600} fontSize={14} noWrap color="text.primary">
//             {client.company_name}
//           </Typography>
//           <Typography fontSize={11} color="text.secondary" noWrap>{client.industry}</Typography>
//           <Chip
//             label={client.relationship_status}
//             color={STATUS_COLOR[client.relationship_status] || "default"}
//             size="small"
//             sx={{ mt: 0.5, fontSize: 10, height: 20, fontWeight: 700 }}
//           />
//         </Box>
//       </Box>

//       <Divider sx={{ mb: 1.5 }} />

//       {/* Mini stats row */}
//       <Box display="flex" justifyContent="space-around">
//         {[
//           { val: jobCount, lbl: "Jobs" },
//           { val: client.total_placements || 0, lbl: "Placed" },
//           { val: candidateCount, lbl: "Candidates" },
//         ].map(({ val, lbl }) => (
//           <Box key={lbl} textAlign="center">
//             <Typography fontSize={16} fontWeight={700} color="text.primary">{val}</Typography>
//             <Typography fontSize={10} color="text.secondary" textTransform="uppercase" letterSpacing={0.4}>{lbl}</Typography>
//           </Box>
//         ))}
//       </Box>
//     </CardActionArea>

//     {/* Footer action buttons */}
//     <Box
//       display="flex"
//       gap={0.75}
//       px={2}
//       pb={1.5}
//       pt={1}
//       sx={{ borderTop: "0.5px solid", borderColor: "divider" }}
//     >
//       <Button
//         size="small"
//         variant="outlined"
//         sx={{ flex: 1, fontSize: 11, py: 0.4, textTransform: "none" }}
//         onClick={(e) => { e.stopPropagation(); onViewJobs(client); }}
//       >
//         Jobs
//       </Button>
//       <Button
//         size="small"
//         variant="outlined"
//         sx={{ flex: 1, fontSize: 11, py: 0.4, textTransform: "none" }}
//         onClick={(e) => { e.stopPropagation(); onViewCandidates(client); }}
//       >
//         Candidates
//       </Button>
//       <Tooltip title="Edit">
//         <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(client); }}>
//           <Edit sx={{ fontSize: 16 }} />
//         </IconButton>
//       </Tooltip>
//       <Tooltip title="Delete">
//         <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(client); }}>
//           <Delete sx={{ fontSize: 16 }} />
//         </IconButton>
//       </Tooltip>
//     </Box>
//   </Card>
// );

// // ── Inline Detail Panel ───────────────────────────────────────────────────────
// const DetailPanel = ({ client, jobCount, candidateCount, onClose, onEdit, onViewJobs, onViewCandidates }) => (
//   <Card
//     elevation={0}
//     sx={{ border: "0.5px solid", borderColor: "divider", borderRadius: 3, mt: 1 }}
//   >
//     <CardContent sx={{ p: 3 }}>
//       {/* Header */}
//       <Box display="flex" alignItems="flex-start" gap={2} pb={2} mb={2}
//         sx={{ borderBottom: "1px solid #e0e0e0" }}>
//         <Avatar
//           sx={{
//             width: 60, height: 60, borderRadius: 2,
//             background: avatarGradient(client.company_name),
//             fontSize: "1.6rem", fontWeight: 700, color: "#fff", flexShrink: 0,
//           }}
//         >
//           {client.company_name?.[0]?.toUpperCase()}
//         </Avatar>
//         <Box flex={1}>
//           <Typography variant="h6" fontWeight={700} color="text.primary">{client.company_name}</Typography>
//           <Typography fontSize={13} color="text.secondary">
//             {client.industry}{client.city ? ` · ${client.city}` : ""}
//           </Typography>
//           <Chip
//             label={client.relationship_status}
//             color={STATUS_COLOR[client.relationship_status] || "default"}
//             size="small"
//             sx={{ mt: 0.75, fontWeight: 700, fontSize: 11 }}
//           />
//         </Box>
//         <IconButton size="small" onClick={onClose}>
//           <Close fontSize="small" />
//         </IconButton>
//       </Box>

//       {/* Two-column detail */}
//       <Grid container spacing={3}>
//         <Grid item xs={12} sm={6}>
//           <Typography fontSize={11} fontWeight={700} color="text.secondary"
//             textTransform="uppercase" letterSpacing={0.6} mb={1}>
//             Contact Information
//           </Typography>
//           <DetailRow label="Contact Person" value={client.primary_contact} />
//           <DetailRow label="Designation" value={client.contact_title} />
//           <DetailRow label="Email" value={client.email} />
//           <DetailRow label="Phone" value={client.phone} />
//           <DetailRow label="Website" value={client.website} />
//           <DetailRow label="Location" value={[client.city, client.state, client.country].filter(Boolean).join(", ")} />
//         </Grid>

//         <Grid item xs={12} sm={6}>
//           <Typography fontSize={11} fontWeight={700} color="text.secondary"
//             textTransform="uppercase" letterSpacing={0.6} mb={1}>
//             Engagement Summary
//           </Typography>
//           <DetailRow label="Client ID" value={client.client_id} />
//           <DetailRow label="Total Jobs" value={jobCount} />
//           <DetailRow label="Total Candidates" value={candidateCount} />
//           <DetailRow label="Total Placements" value={client.total_placements ?? 0} />
//           <DetailRow label="Billing Rate" value={client.billing_rate ? `${client.billing_rate}%` : null} />
//           <DetailRow label="Payment Terms" value={client.payment_terms} />
//         </Grid>
//       </Grid>

//       {/* Notes */}
//       {client.notes && (
//         <Box mt={2} p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
//           <Typography fontSize={11} color="text.secondary" fontWeight={700}
//             textTransform="uppercase" mb={0.5}>Notes</Typography>
//           <Typography fontSize={13}>{client.notes}</Typography>
//         </Box>
//       )}

//       {/* Action strip */}
//       <Box display="flex" alignItems="center" gap={1.5} mt={2.5} pt={2}
//         sx={{ borderTop: "1px solid #e0e0e0" }}>
//         <Button
//           variant="outlined"
//           startIcon={<WorkOutline />}
//           onClick={() => onViewJobs(client)}
//           sx={{ textTransform: "none", fontWeight: 600 }}
//         >
//           View Jobs
//         </Button>
//         <Button
//           variant="outlined"
//           startIcon={<PersonSearch />}
//           onClick={() => onViewCandidates(client)}
//           sx={{ textTransform: "none", fontWeight: 600 }}
//         >
//           View Candidates
//         </Button>
//         <Box flex={1} />
//         <Button
//           variant="contained"
//           startIcon={<Edit />}
//           onClick={() => onEdit(client)}
//           sx={{ textTransform: "none", fontWeight: 700 }}
//         >
//           Edit Client
//         </Button>
//       </Box>
//     </CardContent>
//   </Card>
// );

// // ══════════════════════════════════════════════════════════════════════════════
// //  Main Component
// // ══════════════════════════════════════════════════════════════════════════════
// export default function Clients() {
//   const navigate = useNavigate();

//   const [clients,   setClients]   = useState([]);
//   const [jobs,      setJobs]      = useState([]);
//   const [resumes,   setResumes]   = useState([]);
//   const [loading,   setLoading]   = useState(true);
//   const [error,     setError]     = useState("");
//   const [search,    setSearch]    = useState("");
//   const [statusF,   setStatusF]   = useState("");
//   const [industryF, setIndustryF] = useState("");

//   // selected card — drives the inline detail panel
//   const [selected,   setSelected]   = useState(null);

//   // form / delete dialogs
//   const [formOpen,   setFormOpen]   = useState(false);
//   const [deleteOpen, setDeleteOpen] = useState(false);
//   const [formTarget, setFormTarget] = useState(null);   // client being edited
//   const [formData,   setFormData]   = useState(EMPTY_FORM);
//   const [saving,     setSaving]     = useState(false);

//   // ── Data fetching ──────────────────────────────────────────────────────────
//   const load = useCallback(async () => {
//     try {
//       setLoading(true); setError("");
//       const res = await getAllClients();
//       setClients(res.data || []);
//     } catch (err) {
//       setError(err?.message || "Failed to load clients.");
//       setClients([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const loadJobs = useCallback(async () => {
//     try { const r = await getAllJobs(); setJobs(r.data || []); } catch { setJobs([]); }
//   }, []);

//   const loadResumes = useCallback(async () => {
//     try { const r = await getAllResumes(); setResumes(r.data || []); } catch { setResumes([]); }
//   }, []);

//   useEffect(() => { load(); loadJobs(); loadResumes(); }, [load, loadJobs, loadResumes]);

//   // ── Derived counts ─────────────────────────────────────────────────────────
//   const jobCount       = (c) => jobs.filter(j => j.client_id === c.client_id || j.client_id === c._id).length;
//   const candidateCount = (c) => resumes.filter(r => r.client_id === c.client_id || r.linked_job_id && jobs.some(j => (j.client_id === c.client_id || j.client_id === c._id) && j.job_id === r.linked_job_id)).length;

//   // ── Filtering ──────────────────────────────────────────────────────────────
//   const filtered = clients.filter(c => {
//     const q = search.toLowerCase();
//     const matchQ = !q ||
//       c.company_name?.toLowerCase().includes(q) ||
//       c.primary_contact?.toLowerCase().includes(q) ||
//       c.client_id?.toLowerCase().includes(q);
//     return matchQ && (!statusF || c.relationship_status === statusF) && (!industryF || c.industry === industryF);
//   });

//   // ── Stats ──────────────────────────────────────────────────────────────────
//   const stats = {
//     total:      clients.length,
//     active:     clients.filter(c => c.relationship_status === "Active").length,
//     activeJobs: jobs.length,
//     placements: clients.reduce((s, c) => s + (c.total_placements || 0), 0),
//   };

//   // ── Card selection — clicking same card collapses panel ───────────────────
//   const handleSelect = (c) => setSelected(prev => prev?._id === c._id ? null : c);

//   // ── Navigation helpers ─────────────────────────────────────────────────────
//   const goJobs       = (c) => navigate(`/jobs?client=${c._id}&client_name=${encodeURIComponent(c.company_name)}`);
//   const goCandidates = (c) => navigate(`/resumes?client=${c._id}&client_name=${encodeURIComponent(c.company_name)}`);

//   // ── Form helpers ───────────────────────────────────────────────────────────
//   const openCreate = () => { setFormTarget(null); setFormData(EMPTY_FORM); setFormOpen(true); };
//   const openEdit   = (c) => { setFormTarget(c); setFormData({ ...EMPTY_FORM, ...c }); setFormOpen(true); };
//   const openDelete = (c) => { setFormTarget(c); setDeleteOpen(true); };

//   const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

//   const handleSave = async (e) => {
//     e.preventDefault(); setSaving(true);
//     try {
//       formTarget ? await updateClient(formTarget._id, formData) : await createClient(formData);
//       setFormOpen(false);
//       // Refresh selected client data if we just edited it
//       if (formTarget && selected?._id === formTarget._id) setSelected(null);
//       load();
//     } catch (err) {
//       setError(err?.message || "Save failed");
//     } finally { setSaving(false); }
//   };

//   const handleDelete = async () => {
//     try {
//       await deleteClient(formTarget._id);
//       setDeleteOpen(false);
//       if (selected?._id === formTarget._id) setSelected(null);
//       load();
//     } catch (err) {
//       setError(err?.message || "Delete failed");
//     }
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

//       {/* ── Page header ──────────────────────────────────────────────────── */}
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
//         <Box>
//           <Typography variant="h4" color="primary.dark">Client Management</Typography>
//           <Typography color="text.secondary" mt={0.5}>
//             Manage your client relationships and track engagement
//           </Typography>
//         </Box>
//         <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">
//           Add New Client
//         </Button>
//       </Box>

//       {/* ── Stat cards ───────────────────────────────────────────────────── */}
//       <Grid container spacing={2.5}>
//         {[
//           { title: "Total Clients",    value: stats.total,      icon: <People />,      color: "#1a237e" },
//           { title: "Active Clients",   value: stats.active,     icon: <CheckCircle />, color: "#2e7d32" },
//           { title: "Active Jobs",      value: stats.activeJobs, icon: <Work />,        color: "#0277bd" },
//           { title: "Total Placements", value: stats.placements, icon: <Star />,        color: "#e65100" },
//         ].map(s => (
//           <Grid item xs={6} md={3} key={s.title}>
//             <StatCard {...s} />
//           </Grid>
//         ))}
//       </Grid>

//       {/* ── Filters ──────────────────────────────────────────────────────── */}
//       {clients.length > 0 && (
//         <Box display="flex" gap={2} flexWrap="wrap">
//           <TextField
//             placeholder="Search by name, contact or ID…"
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
//           <TextField select value={statusF} onChange={e => setStatusF(e.target.value)}
//             size="small" sx={{ minWidth: 150 }} label="Status">
//             <MenuItem value="">All Statuses</MenuItem>
//             {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//           </TextField>
//           <TextField select value={industryF} onChange={e => setIndustryF(e.target.value)}
//             size="small" sx={{ minWidth: 200 }} label="Industry">
//             <MenuItem value="">All Industries</MenuItem>
//             {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
//           </TextField>
//         </Box>
//       )}

//       {/* ── Card grid or empty state ─────────────────────────────────────── */}
//       {clients.length === 0 && !error ? (
//         <Card elevation={0} sx={{ border: "0.5px solid", borderColor: "divider" }}>
//           <EmptyState onAdd={openCreate} />
//         </Card>
//       ) : filtered.length === 0 ? (
//         <Typography color="text.secondary" textAlign="center" py={6}>
//           No clients match your current filters.
//         </Typography>
//       ) : (
//         <Grid container spacing={2}>
//           {filtered.map(c => (
//             <Grid item xs={12} sm={6} md={4} key={c._id}>
//               <ClientCard
//                 client={c}
//                 isSelected={selected?._id === c._id}
//                 jobCount={jobCount(c)}
//                 candidateCount={candidateCount(c)}
//                 onSelect={handleSelect}
//                 onEdit={(cl) => { openEdit(cl); }}
//                 onDelete={(cl) => { openDelete(cl); }}
//                 onViewJobs={goJobs}
//                 onViewCandidates={goCandidates}
//               />
//             </Grid>
//           ))}
//         </Grid>
//       )}

//       {/* ── Inline detail panel — rendered below the grid when a card is selected ── */}
//       {selected && (
//         <DetailPanel
//           client={selected}
//           jobCount={jobCount(selected)}
//           candidateCount={candidateCount(selected)}
//           onClose={() => setSelected(null)}
//           onEdit={(c) => { openEdit(c); setSelected(null); }}
//           onViewJobs={goJobs}
//           onViewCandidates={goCandidates}
//         />
//       )}

//       {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
//       <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
//           {formTarget ? "Edit Client" : "Add New Client"}
//         </DialogTitle>
//         <form onSubmit={handleSave}>
//           <DialogContent sx={{ pt: 3 }}>

//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
//               Basic Information
//             </Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Client ID *"
//                   name="client_id" value={formData.client_id} onChange={handleChange}
//                   disabled={!!formTarget} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Company Name *"
//                   name="company_name" value={formData.company_name} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField select fullWidth size="small" required label="Industry *"
//                   name="industry" value={formData.industry} onChange={handleChange}>
//                   {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
//                 </TextField>
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField select fullWidth size="small" label="Status"
//                   name="relationship_status" value={formData.relationship_status} onChange={handleChange}>
//                   {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//                 </TextField>
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Company Size *"
//                   name="company_size" value={formData.company_size} onChange={handleChange}
//                   placeholder="e.g. 100–500" />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" label="Location"
//                   name="location" value={formData.location} onChange={handleChange} />
//               </Grid>
//             </Grid>

//             <Divider sx={{ my: 2 }} />
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
//               Contact Information
//             </Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Primary Contact *"
//                   name="primary_contact" value={formData.primary_contact} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Title *"
//                   name="contact_title" value={formData.contact_title} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required type="email" label="Email *"
//                   name="email" value={formData.email} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" required label="Phone *"
//                   name="phone" value={formData.phone} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={6} sm={4}>
//                 <TextField fullWidth size="small" label="City"
//                   name="city" value={formData.city} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={6} sm={4}>
//                 <TextField fullWidth size="small" label="State"
//                   name="state" value={formData.state} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <TextField fullWidth size="small" label="Country"
//                   name="country" value={formData.country} onChange={handleChange} />
//               </Grid>
//               <Grid item xs={12}>
//                 <TextField fullWidth size="small" label="Website"
//                   name="website" value={formData.website} onChange={handleChange}
//                   placeholder="https://…" />
//               </Grid>
//             </Grid>

//             <Divider sx={{ my: 2 }} />
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
//               Billing &amp; Agreement
//             </Typography>
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}>
//                 <TextField fullWidth size="small" type="number" label="Billing Rate (%)"
//                   name="billing_rate" value={formData.billing_rate} onChange={handleChange}
//                   inputProps={{ step: "0.01" }} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField select fullWidth size="small" label="Payment Terms"
//                   name="payment_terms" value={formData.payment_terms} onChange={handleChange}>
//                   {PAYMENT_TERMS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
//                 </TextField>
//               </Grid>
//             </Grid>

//             <TextField fullWidth multiline rows={3} size="small" label="Notes"
//               name="notes" value={formData.notes} onChange={handleChange} />
//           </DialogContent>

//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//             <Button onClick={() => setFormOpen(false)}>Cancel</Button>
//             <Button type="submit" variant="contained" disabled={saving}>
//               {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
//               {formTarget ? "Update Client" : "Create Client"}
//             </Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//       {/* ── Delete Confirm ────────────────────────────────────────────────── */}
//       <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
//         <DialogTitle fontWeight={700}>Delete Client</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Are you sure you want to delete <strong>{formTarget?.company_name}</strong>?
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


















import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Grid, Typography, Button, TextField, MenuItem,
  IconButton, Tooltip, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Avatar,
  InputAdornment, Divider, LinearProgress, CardActionArea,
} from "@mui/material";
import {
  Add, Search, Edit, Delete, People, CheckCircle, Work,
  Storefront, WorkOutline, PersonSearch, Close, TrendingUp,
  Business, Phone, Email, Language, LocationOn, FilterList,
  ArrowUpward, FiberManualRecord, EmojiEvents,
} from "@mui/icons-material";

// ── API ───────────────────────────────────────────────────────────────────────
const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});
const handle = async (res) => {
  const d = await res.json();
  if (!res.ok) throw d;
  return d;
};
const getAllClients = (p = {}) =>
  fetch(`${BASE}/clients/${new URLSearchParams(p).toString() ? "?" + new URLSearchParams(p).toString() : ""}`, { headers: getHeaders() }).then(handle);
const getAllJobs    = () => fetch(`${BASE}/jobs/`,    { headers: getHeaders() }).then(handle);
const getAllResumes = () => fetch(`${BASE}/resumes/`, { headers: getHeaders() }).then(handle);
const createClient = (p)     => fetch(`${BASE}/clients/`,     { method: "POST",   headers: getHeaders(), body: JSON.stringify(p) }).then(handle);
const updateClient = (id, p) => fetch(`${BASE}/clients/${id}`,{ method: "PUT",    headers: getHeaders(), body: JSON.stringify(p) }).then(handle);
const deleteClient = (id)    => fetch(`${BASE}/clients/${id}`,{ method: "DELETE", headers: getHeaders() }).then(handle);

// ── Constants ─────────────────────────────────────────────────────────────────
const INDUSTRIES    = ["Information Technology","Banking & Finance","Healthcare","Manufacturing","Retail","Telecom","Consulting","E-commerce","Automotive","Energy","Other"];
const STATUSES      = ["Active","Inactive","On Hold","Prospect"];
const PAYMENT_TERMS = ["Net 15","Net 30","Net 45","Net 60"];

const STATUS_META = {
  Active:    { color: "#0d6b3e", bg: "#d1fae5", dot: "#10b981" },
  Inactive:  { color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
  "On Hold": { color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  Prospect:  { color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
};

const CLIENT_PALETTES = [
  ["#1e3a5f","#3b82f6"],["#1a3a2a","#10b981"],["#3b1f5e","#8b5cf6"],
  ["#5e1f1f","#ef4444"],["#1f3d5e","#0ea5e9"],["#2d3748","#718096"],
  ["#5e3a1f","#f97316"],["#1f4e3d","#34d399"],
];
const clientPalette = (name = "") => CLIENT_PALETTES[(name.charCodeAt(0) || 0) % CLIENT_PALETTES.length];

const EMPTY_FORM = {
  client_id:"", company_name:"", industry:"", company_size:"", location:"",
  primary_contact:"", contact_title:"", email:"", phone:"", city:"", state:"",
  country:"India", address:"", website:"", agreement_type:"", payment_terms:"Net 30",
  relationship_status:"Active", account_manager:"", billing_rate:"", notes:"",
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, icon, accent, trend }) => (
  <Box sx={{
    p: 2.5, borderRadius: 2.5, bgcolor: "#fff", border: "1px solid #e8edf3",
    display: "flex", alignItems: "flex-start", gap: 2,
    position: "relative", overflow: "hidden",
    "&::before": {
      content: '""', position: "absolute", top: 0, left: 0, right: 0,
      height: 3, bgcolor: accent, borderRadius: "10px 10px 0 0",
    },
  }}>
    <Box sx={{ p: 1.2, bgcolor: `${accent}12`, borderRadius: 2, color: accent, display: "flex", flexShrink: 0 }}>
      {icon}
    </Box>
    <Box flex={1}>
      <Typography fontSize={11} fontWeight={600} color="#6b7280" textTransform="uppercase" letterSpacing={0.6} mb={0.3}>{label}</Typography>
      <Typography fontSize={28} fontWeight={800} color="#111827" lineHeight={1}>{value}</Typography>
      {sub && <Typography fontSize={11} color="#9ca3af" mt={0.5}>{sub}</Typography>}
    </Box>
    {trend && (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, px: 1, py: 0.3, bgcolor: "#d1fae5", borderRadius: 1, flexShrink: 0 }}>
        <ArrowUpward sx={{ fontSize: 11, color: "#059669" }} />
        <Typography fontSize={11} fontWeight={700} color="#059669">{trend}</Typography>
      </Box>
    )}
  </Box>
);

// ── Client Card ───────────────────────────────────────────────────────────────
const ClientCard = ({ client, jobCnt, candidateCnt, placedCnt, isSelected, onSelect, onEdit, onDelete, onViewJobs, onViewCandidates }) => {
  const [bg, accent] = clientPalette(client.company_name);
  const sm = STATUS_META[client.relationship_status] || STATUS_META["Inactive"];

  return (
    <Box sx={{
      bgcolor: "#fff",
      border: isSelected ? `2px solid ${accent}` : "1px solid #e8edf3",
      borderRadius: 3,
      overflow: "hidden",
      cursor: "pointer",
      transition: "all 0.15s",
      boxShadow: isSelected ? `0 4px 20px ${accent}22` : "none",
      "&:hover": { borderColor: accent, boxShadow: `0 4px 16px ${accent}18` },
    }}>
      {/* Gradient stripe */}
      <Box sx={{ height: 5, background: `linear-gradient(90deg, ${bg}, ${accent})` }} />

      {/* Clickable top section */}
      <Box onClick={() => onSelect(client)} sx={{ p: 2 }}>
        {/* Header */}
        <Box display="flex" alignItems="flex-start" gap={1.5} mb={1.5}>
          <Avatar sx={{
            width: 44, height: 44, borderRadius: 2,
            background: `linear-gradient(135deg, ${bg}, ${accent})`,
            fontSize: 17, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {client.company_name?.[0]?.toUpperCase()}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography fontWeight={700} fontSize={14} color="#111827" noWrap>{client.company_name}</Typography>
            <Typography fontSize={11} color="#6b7280" noWrap mt={0.2}>{client.industry}</Typography>
            <Box sx={{
              display: "inline-flex", alignItems: "center", gap: 0.5,
              mt: 0.6, px: 1, py: 0.3, bgcolor: sm.bg, borderRadius: 20,
            }}>
              <FiberManualRecord sx={{ fontSize: 7, color: sm.dot }} />
              <Typography fontSize={10} fontWeight={700} color={sm.color}>{client.relationship_status}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Contact snippet */}
        {client.primary_contact && (
          <Box display="flex" alignItems="center" gap={0.8} mb={0.4}>
            <People sx={{ fontSize: 12, color: "#9ca3af" }} />
            <Typography fontSize={11} color="#6b7280" noWrap>{client.primary_contact}{client.contact_title ? ` · ${client.contact_title}` : ""}</Typography>
          </Box>
        )}
        {client.city && (
          <Box display="flex" alignItems="center" gap={0.8} mb={1.5}>
            <LocationOn sx={{ fontSize: 12, color: "#9ca3af" }} />
            <Typography fontSize={11} color="#6b7280" noWrap>{[client.city, client.state].filter(Boolean).join(", ")}</Typography>
          </Box>
        )}

        {/* Stats row */}
        <Box sx={{
          display: "flex", borderRadius: 2, overflow: "hidden",
          border: "1px solid #f1f5f9",
        }}>
          {[
            { n: jobCnt,       l: "Jobs",       color: "#1e40af" },
            { n: candidateCnt, l: "Candidates", color: "#0ea5e9" },
            { n: placedCnt,    l: "Placed",     color: "#059669" },
          ].map(({ n, l, color }, i) => (
            <Box key={l} flex={1} textAlign="center" py={1.2} sx={{
              borderRight: i < 2 ? "1px solid #f1f5f9" : "none",
              bgcolor: i === 2 && placedCnt > 0 ? "#f0fdf4" : "transparent",
            }}>
              <Typography fontSize={18} fontWeight={800} color={color} lineHeight={1}>{n}</Typography>
              <Typography fontSize={9} color="#9ca3af" textTransform="uppercase" letterSpacing={0.5} mt={0.3}>{l}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Action footer */}
      <Box sx={{
        display: "flex", gap: 0.75, px: 2, pb: 1.5, pt: 0.5,
        borderTop: "1px solid #f1f5f9", bgcolor: "#fafbfc",
      }}>
        <Button size="small" onClick={(e) => { e.stopPropagation(); onViewJobs(client); }}
          sx={{ flex: 1, fontSize: 11, py: 0.4, textTransform: "none", fontWeight: 600,
            color: "#1e40af", borderColor: "rgba(30,64,175,0.25)", border: "0.5px solid",
            borderRadius: 1.5, "&:hover": { bgcolor: "#dbeafe", borderColor: "#1e40af" } }}>
          View Jobs
        </Button>
        <Button size="small" onClick={(e) => { e.stopPropagation(); onViewCandidates(client); }}
          sx={{ flex: 1, fontSize: 11, py: 0.4, textTransform: "none", fontWeight: 600,
            color: "#059669", borderColor: "rgba(5,150,105,0.25)", border: "0.5px solid",
            borderRadius: 1.5, "&:hover": { bgcolor: "#d1fae5", borderColor: "#059669" } }}>
          Candidates
        </Button>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(client); }}
            sx={{ border: "0.5px solid #e8edf3", borderRadius: 1.5, "&:hover": { bgcolor: "#f3f4f6" } }}>
            <Edit sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(client); }}
            sx={{ border: "0.5px solid #fee2e2", borderRadius: 1.5, "&:hover": { bgcolor: "#fee2e2" } }}>
            <Delete sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

// ── Detail Panel ──────────────────────────────────────────────────────────────
const DetailPanel = ({ client, jobCnt, candidateCnt, placedCnt, onClose, onEdit, onViewJobs, onViewCandidates }) => {
  const [bg, accent] = clientPalette(client.company_name);

  const InfoRow = ({ icon, label, value }) => value ? (
    <Box display="flex" alignItems="flex-start" gap={1.5} py={1}
      sx={{ borderBottom: "1px solid #f1f5f9", "&:last-child": { borderBottom: "none" } }}>
      <Box sx={{ color: "#9ca3af", mt: 0.1, flexShrink: 0, fontSize: 14 }}>{icon}</Box>
      <Box>
        <Typography fontSize={10} color="#9ca3af" textTransform="uppercase" letterSpacing={0.5} fontWeight={600}>{label}</Typography>
        <Typography fontSize={13} color="#111827" fontWeight={500}>{value}</Typography>
      </Box>
    </Box>
  ) : null;

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #e8edf3", borderRadius: 3, overflow: "hidden", position: "sticky", top: 16 }}>
      {/* Hero */}
      <Box sx={{ background: `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`, p: 2.5, position: "relative" }}>
        <IconButton size="small" onClick={onClose}
          sx={{ position: "absolute", top: 10, right: 10, color: "rgba(255,255,255,0.7)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)", color: "#fff" } }}>
          <Close fontSize="small" />
        </IconButton>
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <Avatar sx={{ width: 50, height: 50, bgcolor: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", fontSize: 20, fontWeight: 800, color: "#fff", borderRadius: 2 }}>
            {client.company_name?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight={800} fontSize={16} color="#fff">{client.company_name}</Typography>
            <Typography fontSize={11} color="rgba(255,255,255,0.65)" mt={0.2}>{client.industry} · {client.client_id}</Typography>
            <Box display="inline-flex" alignItems="center" gap={0.5} mt={0.8}
              sx={{ px: 1.2, py: 0.3, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 20 }}>
              <FiberManualRecord sx={{ fontSize: 7, color: "#fff" }} />
              <Typography fontSize={10} fontWeight={700} color="#fff">{client.relationship_status}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Mini KPIs */}
        <Box display="flex" gap={1}>
          {[
            { n: jobCnt,       l: "Jobs"       },
            { n: candidateCnt, l: "Candidates" },
            { n: placedCnt,    l: "Placed", highlight: true },
          ].map(({ n, l, highlight }) => (
            <Box key={l} flex={1} sx={{
              bgcolor: highlight && n > 0 ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.12)",
              borderRadius: 2, p: 1.5, textAlign: "center",
            }}>
              <Typography fontSize={20} fontWeight={800} color="#fff">{n}</Typography>
              <Typography fontSize={9} color="rgba(255,255,255,0.65)" textTransform="uppercase" letterSpacing={0.5} mt={0.3}>{l}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2 }}>
        <Typography fontSize={10} fontWeight={700} color="#6b7280" textTransform="uppercase" letterSpacing={0.6} mb={1}>Contact</Typography>
        <InfoRow icon={<People sx={{ fontSize: 14 }} />}     label="Contact Person" value={client.primary_contact} />
        <InfoRow icon={<Business sx={{ fontSize: 14 }} />}   label="Designation"    value={client.contact_title} />
        <InfoRow icon={<Email sx={{ fontSize: 14 }} />}      label="Email"          value={client.email} />
        <InfoRow icon={<Phone sx={{ fontSize: 14 }} />}      label="Phone"          value={client.phone} />
        <InfoRow icon={<Language sx={{ fontSize: 14 }} />}   label="Website"        value={client.website} />
        <InfoRow icon={<LocationOn sx={{ fontSize: 14 }} />} label="Location"       value={[client.city, client.state, client.country].filter(Boolean).join(", ")} />

        <Typography fontSize={10} fontWeight={700} color="#6b7280" textTransform="uppercase" letterSpacing={0.6} mb={1} mt={1.5}>Commercial</Typography>
        <InfoRow icon={<Work sx={{ fontSize: 14 }} />}       label="Company Size"   value={client.company_size} />
        <InfoRow icon={<TrendingUp sx={{ fontSize: 14 }} />} label="Billing Rate"   value={client.billing_rate ? `${client.billing_rate}%` : null} />
        <InfoRow icon={<EmojiEvents sx={{ fontSize: 14 }} />}label="Payment Terms"  value={client.payment_terms} />
        <InfoRow icon={<People sx={{ fontSize: 14 }} />}     label="Account Mgr."   value={client.account_manager} />

        {client.notes && (
          <Box mt={1.5} p={1.5} sx={{ bgcolor: "#f8faff", borderRadius: 2, border: "1px solid #e8edf3" }}>
            <Typography fontSize={10} fontWeight={700} color="#6b7280" textTransform="uppercase" letterSpacing={0.5} mb={0.5}>Notes</Typography>
            <Typography fontSize={12} color="#374151" lineHeight={1.7}>{client.notes}</Typography>
          </Box>
        )}

        <Box display="flex" gap={1} mt={2} pt={1.5} sx={{ borderTop: "1px solid #f1f5f9" }}>
          <Button variant="outlined" size="small" startIcon={<WorkOutline sx={{ fontSize: 14 }} />} onClick={() => onViewJobs(client)}
            sx={{ flex: 1, textTransform: "none", fontWeight: 600, fontSize: 12, borderColor: "#e8edf3", color: "#1e40af", borderRadius: 1.5, "&:hover": { borderColor: "#1e40af", bgcolor: "#dbeafe" } }}>
            Jobs
          </Button>
          <Button variant="outlined" size="small" startIcon={<PersonSearch sx={{ fontSize: 14 }} />} onClick={() => onViewCandidates(client)}
            sx={{ flex: 1, textTransform: "none", fontWeight: 600, fontSize: 12, borderColor: "#e8edf3", color: "#059669", borderRadius: 1.5, "&:hover": { borderColor: "#059669", bgcolor: "#d1fae5" } }}>
            Candidates
          </Button>
          <Button variant="contained" size="small" startIcon={<Edit sx={{ fontSize: 14 }} />} onClick={() => onEdit(client)}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, bgcolor: "#1e40af", "&:hover": { bgcolor: "#1d3994" }, borderRadius: 1.5, boxShadow: "0 2px 8px rgba(30,64,175,0.25)" }}>
            Edit
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  Main Component
// ═════════════════════════════════════════════════════════════════════════════
export default function Clients() {
  const navigate = useNavigate();
  const [clients,    setClients]   = useState([]);
  const [jobs,       setJobs]      = useState([]);
  const [resumes,    setResumes]   = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState("");
  const [search,     setSearch]    = useState("");
  const [statusF,    setStatusF]   = useState("");
  const [industryF,  setIndustryF] = useState("");
  const [selected,   setSelected]  = useState(null);
  const [formOpen,   setFormOpen]  = useState(false);
  const [deleteOpen, setDeleteOpen]= useState(false);
  const [formTarget, setFormTarget]= useState(null);
  const [formData,   setFormData]  = useState(EMPTY_FORM);
  const [saving,     setSaving]    = useState(false);

  const load = useCallback(async () => {
    try { setLoading(true); setError(""); const r = await getAllClients(); setClients(r.data || []); }
    catch (err) { setError(err?.message || "Failed to load clients"); setClients([]); }
    finally { setLoading(false); }
  }, []);
  const loadJobs    = useCallback(async () => { try { const r = await getAllJobs();    setJobs(r.data || []);    } catch { setJobs([]); } }, []);
  const loadResumes = useCallback(async () => { try { const r = await getAllResumes(); setResumes(r.data || []); } catch { setResumes([]); } }, []);
  useEffect(() => { load(); loadJobs(); loadResumes(); }, [load, loadJobs, loadResumes]);

  // ── Count helpers (all computed live from actual data) ─────────────────────
  // Gets all jobs belonging to this client
  const clientJobs = (c) => jobs.filter(j =>
    j.client_id === c.client_id || j.client_id === c._id
  );

  // Count of job postings
  const jobCount = (c) => clientJobs(c).length;

  // Count of candidates linked to any of this client's jobs
  const candidateCount = (c) => {
    const jobIds = clientJobs(c).map(j => j.job_id);
    return resumes.filter(r => r.linked_job_id && jobIds.includes(r.linked_job_id)).length;
  };

  // Count of candidates with status "Hired" linked to this client's jobs
  // This is the real "placed" count based on actual candidate status
  const placedCount = (c) => {
    const jobIds = clientJobs(c).map(j => j.job_id);
    return resumes.filter(r =>
      r.status === "Hired" &&
      r.linked_job_id &&
      jobIds.includes(r.linked_job_id)
    ).length;
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.company_name?.toLowerCase().includes(q) || c.primary_contact?.toLowerCase().includes(q) || c.client_id?.toLowerCase().includes(q))
      && (!statusF   || c.relationship_status === statusF)
      && (!industryF || c.industry === industryF);
  });

  const stats = {
    total:       clients.length,
    active:      clients.filter(c => c.relationship_status === "Active").length,
    activeJobs:  jobs.length,
    // Sum of hired candidates across all clients — single source of truth
    placements:  resumes.filter(r => r.status === "Hired").length,
  };

  const handleSelect  = (c) => setSelected(prev => prev?._id === c._id ? null : c);
  const goJobs        = (c) => navigate(`/jobs?client=${c._id}&client_name=${encodeURIComponent(c.company_name)}`);
  const goCandidates  = (c) => navigate(`/resumes?client=${c._id}&client_name=${encodeURIComponent(c.company_name)}`);
  const openCreate    = () => { setFormTarget(null); setFormData(EMPTY_FORM); setFormOpen(true); };
  const openEdit      = (c) => { setFormTarget(c); setFormData({ ...EMPTY_FORM, ...c }); setFormOpen(true); };
  const openDelete    = (c) => { setFormTarget(c); setDeleteOpen(true); };
  const handleChange  = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      formTarget ? await updateClient(formTarget._id, formData) : await createClient(formData);
      setFormOpen(false);
      if (formTarget && selected?._id === formTarget._id) setSelected(null);
      load();
    } catch (err) { setError(err?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteClient(formTarget._id);
      setDeleteOpen(false);
      if (selected?._id === formTarget._id) setSelected(null);
      load();
    } catch (err) { setError(err?.message || "Delete failed"); }
  };

  if (loading)
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={40} sx={{ color: "#1e40af" }} /></Box>;

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>{error}</Alert>}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: "#111827", letterSpacing: -0.5 }}>Client Management</Typography>
          <Typography fontSize={14} color="#6b7280" mt={0.3}>
            {clients.length} client{clients.length !== 1 ? "s" : ""} · {stats.active} active · {stats.activeJobs} open jobs
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large"
          sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1d3994" }, boxShadow: "0 4px 12px rgba(30,64,175,0.35)", borderRadius: 2, textTransform: "none", fontWeight: 700, px: 3 }}>
          Add New Client
        </Button>
      </Box>

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <KPICard label="Total Clients" value={stats.total} icon={<Business sx={{ fontSize: 20 }} />} accent="#1e40af" sub="All time" />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard label="Active Clients" value={stats.active} icon={<CheckCircle sx={{ fontSize: 20 }} />} accent="#059669" sub="Currently engaged"
            trend={stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : null} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard label="Open Jobs" value={stats.activeJobs} icon={<Work sx={{ fontSize: 20 }} />} accent="#0ea5e9" sub="Across all clients" />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard label="Total Placements" value={stats.placements} icon={<TrendingUp sx={{ fontSize: 20 }} />} accent="#f59e0b" sub='Candidates with "Hired" status' />
        </Grid>
      </Grid>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      {clients.length > 0 && (
        <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center"
          sx={{ p: 2, bgcolor: "#fff", borderRadius: 2.5, border: "1px solid #e8edf3" }}>
          <FilterList sx={{ fontSize: 18, color: "#9ca3af" }} />
          <TextField placeholder="Search clients, contacts, IDs…" value={search} onChange={e => setSearch(e.target.value)}
            size="small" sx={{ flexGrow: 1, minWidth: 220, "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "#f9fafb", "& fieldset": { borderColor: "#e8edf3" } } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: "#9ca3af" }} /></InputAdornment> }} />
          <TextField select value={statusF} onChange={e => setStatusF(e.target.value)} size="small" label="Status"
            sx={{ minWidth: 140, "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "#f9fafb", "& fieldset": { borderColor: "#e8edf3" } } }}>
            <MenuItem value="">All Statuses</MenuItem>
            {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select value={industryF} onChange={e => setIndustryF(e.target.value)} size="small" label="Industry"
            sx={{ minWidth: 190, "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "#f9fafb", "& fieldset": { borderColor: "#e8edf3" } } }}>
            <MenuItem value="">All Industries</MenuItem>
            {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
          </TextField>
          {(search || statusF || industryF) && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.2, py: 0.4, bgcolor: "#dbeafe", borderRadius: 20, cursor: "pointer" }}
              onClick={() => { setSearch(""); setStatusF(""); setIndustryF(""); }}>
              <Typography fontSize={11} fontWeight={700} color="#1e40af">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</Typography>
              <Close sx={{ fontSize: 12, color: "#1e40af" }} />
            </Box>
          )}
        </Box>
      )}

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {clients.length === 0 ? (
        <Box sx={{ bgcolor: "#fff", borderRadius: 3, border: "1px solid #e8edf3", p: 8, textAlign: "center" }}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: "#f1f5f9", mx: "auto", mb: 2 }}>
            <Storefront sx={{ fontSize: 36, color: "#94a3b8" }} />
          </Avatar>
          <Typography variant="h6" fontWeight={700} color="#374151" mb={1}>No clients yet</Typography>
          <Typography fontSize={14} color="#9ca3af" mb={3}>Add your first client to start managing engagements</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}
            sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1d3994" }, textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
            Add New Client
          </Button>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ bgcolor: "#fff", borderRadius: 3, border: "1px solid #e8edf3", p: 6, textAlign: "center" }}>
          <Typography fontSize={14} color="#9ca3af">No clients match your filters.</Typography>
          <Box component="span" onClick={() => { setSearch(""); setStatusF(""); setIndustryF(""); }}
            sx={{ fontSize: 13, color: "#1e40af", cursor: "pointer", mt: 1, display: "block" }}>
            Clear all filters
          </Box>
        </Box>
      ) : (
        <Grid container spacing={2.5} alignItems="flex-start">
          {/* Cards grid */}
          <Grid item xs={12} md={selected ? 8 : 12}>
            <Grid container spacing={2}>
              {filtered.map(c => (
                <Grid item xs={12} sm={6} md={selected ? 6 : 4} key={c._id}>
                  <ClientCard
                    client={c}
                    jobCnt={jobCount(c)}
                    candidateCnt={candidateCount(c)}
                    placedCnt={placedCount(c)}
                    isSelected={selected?._id === c._id}
                    onSelect={handleSelect}
                    onEdit={openEdit}
                    onDelete={openDelete}
                    onViewJobs={goJobs}
                    onViewCandidates={goCandidates}
                  />
                </Grid>
              ))}
            </Grid>
            <Box mt={2}>
              <Typography fontSize={12} color="#9ca3af">
                Showing <strong style={{ color: "#374151" }}>{filtered.length}</strong> of <strong style={{ color: "#374151" }}>{clients.length}</strong> clients
                {selected && <span style={{ marginLeft: 12, color: "#1e40af", fontWeight: 600 }}>· {selected.company_name} selected — click again to close</span>}
              </Typography>
            </Box>
          </Grid>

          {/* Detail panel */}
          {selected && (
            <Grid item xs={12} md={4}>
              <DetailPanel
                client={selected}
                jobCnt={jobCount(selected)}
                candidateCnt={candidateCount(selected)}
                placedCnt={placedCount(selected)}
                onClose={() => setSelected(null)}
                onEdit={(c) => { openEdit(c); setSelected(null); }}
                onViewJobs={goJobs}
                onViewCandidates={goCandidates}
              />
            </Grid>
          )}
        </Grid>
      )}

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ borderBottom: "1px solid #f1f5f9", px: 3, py: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography fontWeight={800} fontSize={18} color="#111827">{formTarget ? "Edit Client" : "Add New Client"}</Typography>
              <Typography fontSize={12} color="#9ca3af">{formTarget ? `Editing ${formTarget.company_name}` : "Fill in the details to create a new client account"}</Typography>
            </Box>
            <IconButton size="small" onClick={() => setFormOpen(false)} sx={{ color: "#9ca3af" }}><Close fontSize="small" /></IconButton>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 3, px: 3 }}>
            <Box sx={{ borderLeft: "3px solid #1e40af", pl: 1.5, mb: 2, borderRadius: 0 }}>
              <Typography fontSize={13} fontWeight={700} color="#1e40af">Basic Information</Typography>
            </Box>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Client ID *" name="client_id" value={formData.client_id} onChange={handleChange} disabled={!!formTarget} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Company Name *" name="company_name" value={formData.company_name} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
              <Grid item xs={12} sm={6}><TextField select fullWidth size="small" required label="Industry *" name="industry" value={formData.industry} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}>{INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={6}><TextField select fullWidth size="small" label="Status" name="relationship_status" value={formData.relationship_status} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Company Size *" name="company_size" value={formData.company_size} onChange={handleChange} placeholder="e.g. 100–500" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Location" name="location" value={formData.location} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
            </Grid>
            <Box sx={{ borderLeft: "3px solid #059669", pl: 1.5, mb: 2, borderRadius: 0 }}>
              <Typography fontSize={13} fontWeight={700} color="#059669">Contact Information</Typography>
            </Box>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Primary Contact *" name="primary_contact" value={formData.primary_contact} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Title *" name="contact_title" value={formData.contact_title} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required type="email" label="Email *" name="email" value={formData.email} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Phone *" name="phone" value={formData.phone} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
              <Grid item xs={6} sm={4}><TextField fullWidth size="small" label="City" name="city" value={formData.city} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
              <Grid item xs={6} sm={4}><TextField fullWidth size="small" label="State" name="state" value={formData.state} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Country" name="country" value={formData.country} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
              <Grid item xs={12}><TextField fullWidth size="small" label="Website" name="website" value={formData.website} onChange={handleChange} placeholder="https://…" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
            </Grid>
            <Box sx={{ borderLeft: "3px solid #f59e0b", pl: 1.5, mb: 2, borderRadius: 0 }}>
              <Typography fontSize={13} fontWeight={700} color="#b45309">Billing & Agreement</Typography>
            </Box>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Billing Rate (%)" name="billing_rate" value={formData.billing_rate} onChange={handleChange} inputProps={{ step: "0.01" }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} /></Grid>
              <Grid item xs={12} sm={6}><TextField select fullWidth size="small" label="Payment Terms" name="payment_terms" value={formData.payment_terms} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}>{PAYMENT_TERMS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
            </Grid>
            <TextField fullWidth multiline rows={3} size="small" label="Notes" name="notes" value={formData.notes} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #f1f5f9", gap: 1 }}>
            <Button onClick={() => setFormOpen(false)} sx={{ textTransform: "none", color: "#6b7280", borderRadius: 1.5 }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}
              sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1d3994" }, textTransform: "none", fontWeight: 700, borderRadius: 1.5, px: 3, boxShadow: "0 2px 8px rgba(30,64,175,0.3)" }}>
              {saving ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
              {formTarget ? "Update Client" : "Create Client"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#111827" }}>Delete Client</DialogTitle>
        <DialogContent>
          <Typography fontSize={14} color="#374151">
            Are you sure you want to delete <strong>{formTarget?.company_name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ textTransform: "none", color: "#6b7280", borderRadius: 1.5 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}











