
// import React, { useState, useEffect, useCallback } from "react";
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

// // ── GET /api/clients/?q=&status=&industry= ────────────────────────────────────
// const getAllClients = (params = {}) => {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${BASE}/clients/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
// };
// // ── GET /api/clients/:id ──────────────────────────────────────────────────────
// const getOneClient = (id) =>
//   fetch(`${BASE}/clients/${id}`, { headers: getHeaders() }).then(handle);
// // ── POST /api/clients/ ────────────────────────────────────────────────────────
// const createClient = (payload) =>
//   fetch(`${BASE}/clients/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// // ── PUT /api/clients/:id ──────────────────────────────────────────────────────
// const updateClient = (id, payload) =>
//   fetch(`${BASE}/clients/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// // ── DELETE /api/clients/:id ───────────────────────────────────────────────────
// const deleteClient = (id) =>
//   fetch(`${BASE}/clients/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
// // ── GET /api/clients/meta/options ─────────────────────────────────────────────
// const getClientOptions = () =>
//   fetch(`${BASE}/clients/meta/options`, { headers: getHeaders() }).then(handle);
// // ─────────────────────────────────────────────────────────────────────────────

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

// // ── Main component ────────────────────────────────────────────────────────────
// export default function Clients() {
//   const [clients,   setClients]   = useState([]);
//   const [loading,   setLoading]   = useState(true);
//   const [error,     setError]     = useState("");
//   const [search,    setSearch]    = useState("");
//   const [statusF,   setStatusF]   = useState("");
//   const [industryF, setIndustryF] = useState("");

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

//   useEffect(() => { load(); }, [load]);

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

//   // ── Stats (computed from real data) ───────────────────────────────────────
//   const stats = {
//     total:      clients.length,
//     active:     clients.filter(c => c.relationship_status === "Active").length,
//     activeJobs: clients.reduce((s, c) => s + (c.active_jobs  || 0), 0),
//     placements: clients.reduce((s, c) => s + (c.total_placements || 0), 0),
//   };

//   // ── Modal helpers ──────────────────────────────────────────────────────────
//   const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
//   const openEdit   = c  => { setSelected(c); setFormData({ ...EMPTY_FORM, ...c }); setFormOpen(true); };
//   const openDetail = c  => { setSelected(c); setDetailOpen(true); };
//   const openDelete = c  => { setSelected(c); setDeleteOpen(true); };

//   const handleChange = e =>
//     setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

//   // ── POST /api/clients/ or PUT /api/clients/:id ────────────────────────────
//   const handleSave = async (e) => {
//     e.preventDefault();
//     setSaving(true);
//     try {
//       if (selected) {
//         // ── PUT /api/clients/:id ────────────────────────────────────────────
//         await updateClient(selected._id, formData);
//       } else {
//         // ── POST /api/clients/ ──────────────────────────────────────────────
//         await createClient(formData);
//       }
//       setFormOpen(false);
//       load();
//     } catch (err) {
//       setError(err?.message || "Save failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ── DELETE /api/clients/:id ───────────────────────────────────────────────
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

//       {/* ── Filters (only when clients exist) ────────────────────────────── */}
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
//                       <Chip label={c.active_jobs || 0} size="small" color="primary"
//                         variant="outlined" sx={{ fontWeight: 700 }} />
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

//       {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
//       <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
//           Client Details
//         </DialogTitle>
//         {selected && (
//           <DialogContent sx={{ pt: 3 }}>
//             <Box display="flex" alignItems="center" gap={2} mb={3}>
//               <Avatar sx={{ width: 60, height: 60, bgcolor: "#1a237e", fontSize: "1.5rem", fontWeight: 700 }}>
//                 {selected.company_name?.[0]}
//               </Avatar>
//               <Box>
//                 <Typography variant="h5" fontWeight={800}>{selected.company_name}</Typography>
//                 <Typography color="text.secondary">{selected.industry}</Typography>
//                 <Chip
//                   label={selected.relationship_status}
//                   color={STATUS_COLOR[selected.relationship_status] || "default"}
//                   size="small" sx={{ mt: 0.5, fontWeight: 700 }}
//                 />
//               </Box>
//             </Box>
//             <Grid container spacing={2}>
//               {[
//                 ["Contact",    selected.primary_contact],
//                 ["Title",      selected.contact_title],
//                 ["Email",      selected.email],
//                 ["Phone",      selected.phone],
//                 ["City",       selected.city],
//                 ["Active Jobs",selected.active_jobs || 0],
//                 ["Placements", selected.total_placements || 0],
//                 ["Client ID",  selected.client_id],
//               ].map(([label, val]) => (
//                 <Grid item xs={6} key={label}>
//                   <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">
//                     {label}
//                   </Typography>
//                   <Typography fontWeight={600} fontSize={14}>{val || "—"}</Typography>
//                 </Grid>
//               ))}
//             </Grid>
//             {selected.notes && (
//               <Box mt={2} p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
//                 <Typography fontSize={12} color="text.secondary" fontWeight={700} mb={0.5}>
//                   NOTES
//                 </Typography>
//                 <Typography fontSize={13}>{selected.notes}</Typography>
//               </Box>
//             )}
//           </DialogContent>
//         )}
//         <DialogActions sx={{ px: 3, pb: 2.5 }}>
//           <Button onClick={() => setDetailOpen(false)}>Close</Button>
//           <Button variant="contained" onClick={() => { setDetailOpen(false); openEdit(selected); }}>
//             Edit Client
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── Delete confirm ────────────────────────────────────────────────── */}
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



import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  InputAdornment, Divider,
} from "@mui/material";
import {
  Add, Search, Edit, Delete, Visibility,
  People, CheckCircle, Work, Star, Storefront,
  Business, Email, Phone, LocationOn, WorkOutline, EmojiEvents,
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

const getAllClients   = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE}/clients/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
};
const createClient   = (payload) =>
  fetch(`${BASE}/clients/`,    { method: "POST",   headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
const updateClient   = (id, payload) =>
  fetch(`${BASE}/clients/${id}`, { method: "PUT",  headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
const deleteClient   = (id) =>
  fetch(`${BASE}/clients/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);

// ── Constants ─────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  "Information Technology", "Banking & Finance", "Healthcare",
  "Manufacturing", "Retail", "Telecom", "Consulting",
  "E-commerce", "Automotive", "Energy", "Other",
];
const STATUSES      = ["Active", "Inactive", "On Hold", "Prospect"];
const PAYMENT_TERMS = ["Net 15", "Net 30", "Net 45", "Net 60"];
const STATUS_COLOR  = { Active: "success", Inactive: "default", "On Hold": "warning", Prospect: "info" };

const EMPTY_FORM = {
  client_id: "", company_name: "", industry: "", company_size: "",
  location: "", primary_contact: "", contact_title: "", email: "",
  phone: "", city: "", state: "", country: "India", address: "",
  website: "", agreement_type: "", payment_terms: "Net 30",
  relationship_status: "Active", account_manager: "", billing_rate: "", notes: "",
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
      <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
      <Box>
        <Typography fontSize={12} color="text.secondary" fontWeight={600} textTransform="uppercase">
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center"
    py={10} gap={2}>
    <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
      <Storefront sx={{ fontSize: 36, color: "#9fa8da" }} />
    </Avatar>
    <Typography variant="h6" fontWeight={700} color="text.secondary">No clients yet</Typography>
    <Typography fontSize={14} color="text.disabled" textAlign="center" maxWidth={320}>
      No clients have been added yet. Click "Add New Client" to get started.
    </Typography>
    <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ mt: 1 }}>
      Add New Client
    </Button>
  </Box>
);

// ── Detail Row helper ─────────────────────────────────────────────────────────
const DetailRow = ({ label, value }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center"
    sx={{ py: 1, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}>
    <Typography fontSize={13} color="text.secondary">{label}</Typography>
    <Typography fontSize={13} fontWeight={600} color="text.primary" textAlign="right">
      {value || "—"}
    </Typography>
  </Box>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function Clients() {
  const navigate = useNavigate();

  const [clients,   setClients]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");
  const [statusF,   setStatusF]   = useState("");
  const [industryF, setIndustryF] = useState("");

  // Modal state
  const [formOpen,   setFormOpen]   = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);

  // ── GET /api/clients/ ─────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllClients();
      setClients(res.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load clients. Please check your connection.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtered view ──────────────────────────────────────────────────────────
  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q ||
      c.company_name?.toLowerCase().includes(q) ||
      c.primary_contact?.toLowerCase().includes(q) ||
      c.client_id?.toLowerCase().includes(q);
    const matchS = !statusF   || c.relationship_status === statusF;
    const matchI = !industryF || c.industry             === industryF;
    return matchQ && matchS && matchI;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total:      clients.length,
    active:     clients.filter(c => c.relationship_status === "Active").length,
    activeJobs: clients.reduce((s, c) => s + (c.active_jobs        || 0), 0),
    placements: clients.reduce((s, c) => s + (c.total_placements   || 0), 0),
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
  const openEdit   = c  => { setSelected(c);    setFormData({ ...EMPTY_FORM, ...c }); setFormOpen(true); };
  const openDetail = c  => { setSelected(c);    setDetailOpen(true); };
  const openDelete = c  => { setSelected(c);    setDeleteOpen(true); };

  const handleChange = e =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── Save (create / update) ────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      selected ? await updateClient(selected._id, formData) : await createClient(formData);
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await deleteClient(selected._id);
      setDeleteOpen(false);
      load();
    } catch (err) {
      setError(err?.message || "Delete failed");
    }
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={48} />
      </Box>
    );

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" color="primary.dark">Client Management</Typography>
          <Typography color="text.secondary" mt={0.5}>
            Manage your client relationships and track engagement
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">
          Add New Client
        </Button>
      </Box>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={6} md={3}>
          <StatCard title="Total Clients"    value={stats.total}      icon={<People />}      color="#1a237e" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Active Clients"   value={stats.active}     icon={<CheckCircle />} color="#2e7d32" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Active Jobs"      value={stats.activeJobs} icon={<Work />}        color="#0277bd" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Total Placements" value={stats.placements} icon={<Star />}        color="#e65100" />
        </Grid>
      </Grid>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      {clients.length > 0 && (
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            placeholder="Search by name, contact, or ID…"
            value={search} onChange={e => setSearch(e.target.value)}
            size="small" sx={{ flexGrow: 1, minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField select value={statusF} onChange={e => setStatusF(e.target.value)}
            size="small" sx={{ minWidth: 150 }} label="Status">
            <MenuItem value="">All Statuses</MenuItem>
            {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select value={industryF} onChange={e => setIndustryF(e.target.value)}
            size="small" sx={{ minWidth: 200 }} label="Industry">
            <MenuItem value="">All Industries</MenuItem>
            {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
          </TextField>
        </Box>
      )}

      {/* ── Table or Empty state ──────────────────────────────────────────── */}
      {clients.length === 0 && !error ? (
        <Card><EmptyState onAdd={openCreate} /></Card>
      ) : (
        <Card>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f7fa" }}>
                  {["Client ID", "Company", "Industry", "Contact Person",
                    "Location", "Jobs", "Placements", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No clients match your current filters
                    </TableCell>
                  </TableRow>
                ) : filtered.map(c => (
                  <TableRow key={c._id} hover>
                    <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>
                      {c.client_id}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600} fontSize={13}>{c.company_name}</Typography>
                      <Typography fontSize={11} color="text.secondary">{c.email}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{c.industry}</TableCell>
                    <TableCell>
                      <Typography fontSize={13}>{c.primary_contact}</Typography>
                      <Typography fontSize={11} color="text.secondary">{c.contact_title}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{c.city}</TableCell>
                    <TableCell>
                      <Chip label={c.active_jobs || 0} size="small" color="primary"
                        variant="outlined" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>
                      {c.total_placements || 0}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.relationship_status}
                        color={STATUS_COLOR[c.relationship_status] || "default"}
                        size="small" sx={{ fontWeight: 700, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => openDetail(c)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(c)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => openDelete(c)}>
                            <Delete fontSize="small" />
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
          Client Details
        </DialogTitle>

        {selected && (
          <DialogContent sx={{ pt: 3, pb: 1 }}>

            {/* ── Company header with avatar ─────────────────────────────── */}
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
                {selected.company_name?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800} color="text.primary" lineHeight={1.2}>
                  {selected.company_name}
                </Typography>
                <Typography color="text.secondary" fontSize={14} mt={0.5}>
                  {selected.industry}
                </Typography>
                <Chip
                  label={selected.relationship_status}
                  color={STATUS_COLOR[selected.relationship_status] || "default"}
                  size="small"
                  sx={{ mt: 1, fontWeight: 700, fontSize: 11 }}
                />
              </Box>
            </Box>

            {/* ── Two-column grid: Contact Info + Statistics ─────────────── */}
            <Grid container spacing={3}>

              {/* LEFT — Contact Information */}
              <Grid item xs={12} sm={6}>
                <Typography
                  fontSize={11} fontWeight={700} color="text.secondary"
                  textTransform="uppercase" letterSpacing={0.8} mb={1.5}
                >
                  Contact Information
                </Typography>
                <DetailRow label="Contact Person" value={selected.primary_contact} />
                <DetailRow label="Designation"    value={selected.contact_title}   />
                <DetailRow label="Email"          value={selected.email}           />
                <DetailRow label="Phone"          value={selected.phone}           />
              </Grid>

              {/* RIGHT — Statistics */}
              <Grid item xs={12} sm={6}>
                <Typography
                  fontSize={11} fontWeight={700} color="text.secondary"
                  textTransform="uppercase" letterSpacing={0.8} mb={1.5}
                >
                  Statistics
                </Typography>
                <DetailRow label="Active Jobs"      value={selected.active_jobs      ?? 0} />
                <DetailRow label="Total Placements" value={selected.total_placements ?? 0} />
                <DetailRow label="Location"         value={selected.city}                  />
                <DetailRow label="Client ID"        value={selected.client_id}             />
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

        {/* ── Action buttons: View Jobs | View Placements | Edit Client ──── */}
        <DialogActions
          sx={{
            px: 3, py: 2.5,
            borderTop: "1px solid #e0e0e0",
            justifyContent: "flex-start",
            gap: 1.5,
          }}
        >
          {/* View Jobs — navigates to /jobs?client=<id> */}
          <Button
            variant="outlined"
            // startIcon={<WorkOutline />}
            onClick={() => {
              setDetailOpen(false);
              navigate(`/jobs?client=${selected._id}`);
            }}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            View Jobs
          </Button>

          {/* View Placements — navigates to /placements?client=<id> */}
          <Button
            variant="outlined"
            // startIcon={<EmojiEvents />}
            onClick={() => {
              setDetailOpen(false);
              navigate(`/placements?client=${selected._id}`);
            }}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            View Placements
          </Button>

          {/* Spacer pushes Edit to the right */}
          <Box sx={{ flex: 1 }} />

          <Button
            variant="contained"
            // startIcon={<Edit />}
            onClick={() => { setDetailOpen(false); openEdit(selected); }}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Edit Client
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          {selected ? "Edit Client" : "Add New Client"}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 3 }}>

            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
              Basic Information
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Client ID *"
                  name="client_id" value={formData.client_id} onChange={handleChange}
                  disabled={!!selected} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Company Name *"
                  name="company_name" value={formData.company_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" required label="Industry *"
                  name="industry" value={formData.industry} onChange={handleChange}>
                  {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Status"
                  name="relationship_status" value={formData.relationship_status} onChange={handleChange}>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Company Size *"
                  name="company_size" value={formData.company_size} onChange={handleChange}
                  placeholder="e.g. 100–500" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Location *"
                  name="location" value={formData.location} onChange={handleChange} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
              Contact Information
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Primary Contact *"
                  name="primary_contact" value={formData.primary_contact} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Title *"
                  name="contact_title" value={formData.contact_title} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required type="email" label="Email *"
                  name="email" value={formData.email} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Phone *"
                  name="phone" value={formData.phone} onChange={handleChange} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField fullWidth size="small" label="City"
                  name="city" value={formData.city} onChange={handleChange} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField fullWidth size="small" label="State"
                  name="state" value={formData.state} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Country"
                  name="country" value={formData.country} onChange={handleChange} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
              Billing &amp; Agreement
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" type="number" label="Billing Rate (%)"
                  name="billing_rate" value={formData.billing_rate} onChange={handleChange}
                  inputProps={{ step: "0.01" }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField select fullWidth size="small" label="Payment Terms"
                  name="payment_terms" value={formData.payment_terms} onChange={handleChange}>
                  {PAYMENT_TERMS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Website"
                  name="website" value={formData.website} onChange={handleChange}
                  placeholder="https://…" />
              </Grid>
            </Grid>

            <TextField fullWidth multiline rows={3} size="small" label="Notes"
              name="notes" value={formData.notes} onChange={handleChange} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              {selected ? "Update Client" : "Create Client"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete Client</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selected?.company_name}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}