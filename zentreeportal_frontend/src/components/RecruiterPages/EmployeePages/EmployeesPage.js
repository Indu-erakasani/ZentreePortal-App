



// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Box, Card, CardContent, Grid, Paper, Typography, Button, TextField,
//   MenuItem, Table, TableHead, TableBody, TableRow, TableCell, Chip,
//   Avatar, IconButton, Tooltip, CircularProgress, Alert, Dialog,
//   DialogTitle, DialogContent, DialogActions, InputAdornment, Divider,
// } from "@mui/material";
// import {
//   Add, Search, Edit, Delete, Visibility, Group, CheckCircle,
//   Work, Business, FileDownload,
// } from "@mui/icons-material";
// import EmployeeDetail from "./Employeedetail";
// import {
//   EMP_STATUSES, EMPLOYMENT_TYPES, CURRENCIES, DEPARTMENTS,
//   STATUS_COLOR, DEPT_COLOR, EMPTY_FORM,
//   fmtDate, fmtMoney, nameInitials,
// } from "./employeeConstants";

// // ── API helpers (employee CRUD + export) ─────────────────────────────────────
// const BASE = process.env.REACT_APP_API_BASE_URL;
// const hdrs = () => ({
//   "Content-Type": "application/json",
//   Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
// });
// const ok = async (res) => {
//   const data = await res.json();
//   if (!res.ok) throw data;
//   return data;
// };

// const getAllEmployees = (params = {}) => {
//   const qs = new URLSearchParams(params).toString();
//   return fetch(`${BASE}/employees/${qs ? "?" + qs : ""}`, { headers: hdrs() }).then(ok);
// };
// const createEmployee = (pl)     => fetch(`${BASE}/employees/`,     { method: "POST",   headers: hdrs(), body: JSON.stringify(pl) }).then(ok);
// const updateEmployee = (id, pl) => fetch(`${BASE}/employees/${id}`,{ method: "PUT",    headers: hdrs(), body: JSON.stringify(pl) }).then(ok);
// const deleteEmployee = (id)     => fetch(`${BASE}/employees/${id}`,{ method: "DELETE", headers: hdrs() }).then(ok);

// const downloadExport = async (type = "excel") => {
//   const url  = `${BASE}/export/employees/${type}`;
//   const res  = await fetch(url, { headers: hdrs() });
//   if (!res.ok) throw new Error("Export failed");
//   const blob = await res.blob();
//   const link = document.createElement("a");
//   link.href  = URL.createObjectURL(blob);
//   link.download = `employees_${new Date().toISOString().slice(0, 10)}.${type === "csv" ? "csv" : "xlsx"}`;
//   link.click();
//   URL.revokeObjectURL(link.href);
// };

// // ── Stat Card ─────────────────────────────────────────────────────────────────
// function StatCard({ title, value, color, icon }) {
//   return (
//     <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden", position: "relative" }}>
//       <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, bgcolor: color }} />
//       <CardContent sx={{ p: 2.5, pl: 3.5 }}>
//         <Box display="flex" alignItems="flex-start" justifyContent="space-between">
//           <Box>
//             <Typography fontSize={11} fontWeight={600} color="text.secondary"
//               textTransform="uppercase" letterSpacing="0.08em" mb={0.8}>
//               {title}
//             </Typography>
//             <Typography fontSize={28} fontWeight={800} color="#0f172a" lineHeight={1}>{value}</Typography>
//           </Box>
//           <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: `${color}18`,
//                      display: "flex", alignItems: "center", justifyContent: "center" }}>
//             {React.cloneElement(icon, { sx: { fontSize: 20, color } })}
//           </Box>
//         </Box>
//       </CardContent>
//     </Card>
//   );
// }

// // ── Employee Add / Edit Form ──────────────────────────────────────────────────
// function EmployeeForm({ open, onClose, onSave, selected, saving }) {
//   const [form, setForm] = useState(EMPTY_FORM);

//   useEffect(() => {
//     if (!open) return;
//     if (selected) {
//       setForm({
//         ...EMPTY_FORM, ...selected,
//         date_of_joining:      selected.date_of_joining      ? selected.date_of_joining.split("T")[0] : "",
//         salary:               selected.salary               || "",
//         current_billing_rate: selected.current_billing_rate || "",
//         experience:           selected.experience           || "",
//       });
//     } else {
//       setForm(EMPTY_FORM);
//     }
//   }, [open, selected]);

//   const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

//   const submit = e => {
//     e.preventDefault();
//     onSave({
//       ...form,
//       experience:           form.experience           ? Number(form.experience)           : 0,
//       salary:               form.salary               ? Number(form.salary)               : 0,
//       current_billing_rate: form.current_billing_rate ? Number(form.current_billing_rate) : 0,
//     });
//   };

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
//       <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
//         {selected ? "Edit Employee" : "Add New Employee"}
//       </DialogTitle>
//       <form onSubmit={submit}>
//         <DialogContent sx={{ pt: 3 }}>

//           {/* Personal Info */}
//           <Typography variant="subtitle2" color="#1e40af" mb={1.5} fontWeight={700}>Personal Information</Typography>
//           <Grid container spacing={2} mb={2}>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth size="small" required label="Full Name" name="name" value={form.name} onChange={handle} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth size="small" required type="email" label="Email" name="email" value={form.email} onChange={handle} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth size="small" label="Phone" name="phone" value={form.phone} onChange={handle} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth size="small" label="Location" name="location" value={form.location} onChange={handle} />
//             </Grid>
//           </Grid>

//           <Divider sx={{ my: 2 }} />

//           {/* Employment Details */}
//           <Typography variant="subtitle2" color="#1e40af" mb={1.5} fontWeight={700}>Employment Details</Typography>
//           <Grid container spacing={2} mb={2}>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth size="small" label="Designation" name="designation" value={form.designation} onChange={handle} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField select fullWidth size="small" label="Department" name="department" value={form.department} onChange={handle}>
//                 {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
//               </TextField>
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField select fullWidth size="small" label="Employment Type" name="employment_type" value={form.employment_type} onChange={handle}>
//                 {EMPLOYMENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
//               </TextField>
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth size="small" type="date" label="Date of Joining" name="date_of_joining"
//                 value={form.date_of_joining} onChange={handle} InputLabelProps={{ shrink: true }} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth size="small" type="number" label="Experience (years)" name="experience" value={form.experience} onChange={handle} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth size="small" label="Reporting Manager" name="reporting_manager" value={form.reporting_manager} onChange={handle} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField select fullWidth size="small" label="Status" name="status" value={form.status} onChange={handle}>
//                 {EMP_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//               </TextField>
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth size="small" type="number" label="Annual Salary (₹)" name="salary" value={form.salary} onChange={handle} />
//             </Grid>
//             <Grid item xs={12}>
//               <TextField fullWidth size="small" label="Skills (comma-separated)" name="skills" value={form.skills} onChange={handle} />
//             </Grid>
//           </Grid>

//           <Divider sx={{ my: 2 }} />

//           {/* Current Client Deployment */}
//           <Typography variant="subtitle2" color="#1e40af" mb={1.5} fontWeight={700}>Current Client Deployment</Typography>
//           <Grid container spacing={2} mb={2}>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth size="small" label="Current Client" name="current_client" value={form.current_client} onChange={handle} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth size="small" label="Current Project" name="current_project" value={form.current_project} onChange={handle} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField fullWidth size="small" type="number" label="Current Billing Rate" name="current_billing_rate" value={form.current_billing_rate} onChange={handle} />
//             </Grid>
//             <Grid item xs={12} sm={6}>
//               <TextField select fullWidth size="small" label="Billing Currency" name="billing_currency" value={form.billing_currency} onChange={handle}>
//                 {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
//               </TextField>
//             </Grid>
//           </Grid>

//           <TextField fullWidth multiline rows={3} size="small" label="Notes" name="notes" value={form.notes} onChange={handle} />
//         </DialogContent>

//         <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//           <Button onClick={onClose}>Cancel</Button>
//           <Button type="submit" variant="contained" disabled={saving}
//             sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1e3a8a" } }}>
//             {saving && <CircularProgress size={16} sx={{ mr: 1, color: "#fff" }} />}
//             {selected ? "Update Employee" : "Add Employee"}
//           </Button>
//         </DialogActions>
//       </form>
//     </Dialog>
//   );
// }

// // ── Employee Table ────────────────────────────────────────────────────────────
// function EmployeeTable({ employees, filtered, onView, onEdit, onDelete, onAdd }) {
//   if (employees.length === 0) {
//     return (
//       <Card>
//         <Box display="flex" flexDirection="column" alignItems="center" py={10} gap={2}>
//           <Avatar sx={{ width: 72, height: 72, bgcolor: "#e0e7ff" }}>
//             <Group sx={{ fontSize: 36, color: "#818cf8" }} />
//           </Avatar>
//           <Typography variant="h6" color="text.secondary">No employees yet</Typography>
//           <Typography fontSize={14} color="text.disabled">
//             Add your first employee to start tracking workforce data.
//           </Typography>
//           <Button variant="contained" startIcon={<Add />} onClick={onAdd}
//             sx={{ bgcolor: "#1e40af" }}>
//             Add Employee
//           </Button>
//         </Box>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ bgcolor: "#f8fafc" }}>
//               {["Employee", "Designation", "Department", "Current Client", "Billing Rate", "DOJ", "Exp.", "Status", "Actions"].map(h => (
//                 <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#64748b" }}>{h}</TableCell>
//               ))}
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {filtered.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>
//                   No employees match your filters
//                 </TableCell>
//               </TableRow>
//             ) : filtered.map(emp => {
//               const dc = DEPT_COLOR[emp.department] || "#475569";
//               return (
//                 <TableRow key={emp._id} hover>
//                   <TableCell>
//                     <Box display="flex" alignItems="center" gap={1.5}>
//                       <Avatar sx={{ width: 38, height: 38, fontSize: 13, fontWeight: 700, bgcolor: dc }}>
//                         {nameInitials(emp.name)}
//                       </Avatar>
//                       <Box>
//                         <Typography fontWeight={600} fontSize={13}>{emp.name}</Typography>
//                         <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: "monospace" }}>
//                           {emp.emp_id}
//                         </Typography>
//                       </Box>
//                     </Box>
//                   </TableCell>
//                   <TableCell><Typography fontSize={13}>{emp.designation || "—"}</Typography></TableCell>
//                   <TableCell>
//                     <Chip label={emp.department} size="small"
//                       sx={{ bgcolor: `${dc}18`, color: dc, fontWeight: 600, fontSize: 11 }} />
//                   </TableCell>
//                   <TableCell>
//                     {emp.current_client ? (
//                       <Box>
//                         <Typography fontSize={13} fontWeight={700} color="#15803d">{emp.current_client}</Typography>
//                         {emp.current_project && (
//                           <Typography fontSize={11} color="text.secondary">{emp.current_project}</Typography>
//                         )}
//                       </Box>
//                     ) : <Typography fontSize={12} color="text.disabled">—</Typography>}
//                   </TableCell>
//                   <TableCell>
//                     {emp.current_billing_rate > 0
//                       ? <Typography fontSize={13} fontWeight={700} color="#15803d">
//                           {fmtMoney(emp.current_billing_rate, emp.billing_currency)}
//                         </Typography>
//                       : <Typography fontSize={12} color="text.disabled">—</Typography>}
//                   </TableCell>
//                   <TableCell sx={{ fontSize: 12 }}>{fmtDate(emp.date_of_joining)}</TableCell>
//                   <TableCell sx={{ fontSize: 12 }}>{emp.experience} yrs</TableCell>
//                   <TableCell>
//                     <Chip label={emp.status} color={STATUS_COLOR[emp.status] || "default"}
//                       size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
//                   </TableCell>
//                   <TableCell>
//                     <Box display="flex" gap={0.5}>
//                       <Tooltip title="View Details">
//                         <IconButton size="small" onClick={() => onView(emp)}><Visibility fontSize="small" /></IconButton>
//                       </Tooltip>
//                       <Tooltip title="Edit">
//                         <IconButton size="small" onClick={() => onEdit(emp)}><Edit fontSize="small" /></IconButton>
//                       </Tooltip>
//                       <Tooltip title="Delete">
//                         <IconButton size="small" color="error" onClick={() => onDelete(emp)}><Delete fontSize="small" /></IconButton>
//                       </Tooltip>
//                     </Box>
//                   </TableCell>
//                 </TableRow>
//               );
//             })}
//           </TableBody>
//         </Table>
//       </Paper>
//     </Card>
//   );
// }

// // ── Main Page ─────────────────────────────────────────────────────────────────
// export default function Employees() {
//   const [employees,  setEmployees]  = useState([]);
//   const [loading,    setLoading]    = useState(true);
//   const [error,      setError]      = useState("");
//   const [search,     setSearch]     = useState("");
//   const [statusF,    setStatusF]    = useState("");
//   const [deptF,      setDeptF]      = useState("");
//   const [formOpen,   setFormOpen]   = useState(false);
//   const [detailOpen, setDetailOpen] = useState(false);
//   const [deleteOpen, setDeleteOpen] = useState(false);
//   const [selected,   setSelected]   = useState(null);
//   const [saving,     setSaving]     = useState(false);
//   const [exporting,  setExporting]  = useState(false);

//   // ── Load ────────────────────────────────────────────────────────────────────
//   const load = useCallback(async () => {
//     try {
//       setLoading(true); setError("");
//       const res = await getAllEmployees();
//       setEmployees(res.data || []);
//     } catch (err) {
//       setError(err?.message || "Failed to load employees");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { load(); }, [load]);

//   // ── Derived ─────────────────────────────────────────────────────────────────
//   const filtered = employees.filter(e => {
//     const q  = search.toLowerCase();
//     const mQ = !q || [e.name, e.emp_id, e.designation, e.current_client]
//                       .some(f => f?.toLowerCase().includes(q));
//     const mS = !statusF || e.status     === statusF;
//     const mD = !deptF   || e.department === deptF;
//     return mQ && mS && mD;
//   });

//   const stats = {
//     total:   employees.length,
//     active:  employees.filter(e => e.status === "Active").length,
//     onBench: employees.filter(e => e.status === "On Bench").length,
//     clients: new Set(employees.filter(e => e.current_client).map(e => e.current_client)).size,
//   };

//   // ── Handlers ────────────────────────────────────────────────────────────────
//   const openCreate = ()  => { setSelected(null); setFormOpen(true); };
//   const openEdit   = (e) => { setSelected(e);    setFormOpen(true); setDetailOpen(false); };
//   const openView   = (e) => { setSelected(e);    setDetailOpen(true); };
//   const openDelete = (e) => { setSelected(e);    setDeleteOpen(true); };

//   const handleSave = async (payload) => {
//     setSaving(true);
//     try {
//       if (selected) await updateEmployee(selected._id, payload);
//       else          await createEmployee(payload);
//       setFormOpen(false);
//       load();
//     } catch (err) {
//       setError(err?.message || "Save failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async () => {
//     try {
//       await deleteEmployee(selected._id);
//       setDeleteOpen(false);
//       load();
//     } catch (err) {
//       setError(err?.message || "Delete failed");
//     }
//   };

//   // After engagement add/end inside EmployeeDetail, refresh list + keep selected in sync
//   const handleEmployeeUpdate = async () => {
//     const res    = await getAllEmployees();
//     const fresh  = res.data || [];
//     setEmployees(fresh);
//     const updated = fresh.find(e => e._id === selected?._id);
//     if (updated) setSelected(updated);
//   };

//   const handleExport = async (type) => {
//     setExporting(true);
//     try   { await downloadExport(type); }
//     catch { setError("Export failed — please try again."); }
//     finally { setExporting(false); }
//   };

//   // ── Render ──────────────────────────────────────────────────────────────────
//   if (loading) return (
//     <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
//       <CircularProgress size={48} />
//     </Box>
//   );

//   return (
//     <Box display="flex" flexDirection="column" gap={3}>

//       {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

//       {/* ── Page Header ──────────────────────────────────────────────────── */}
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
//         <Box>
//           <Typography variant="h4" fontWeight={800} color="#0f172a">Our Employees</Typography>
//           <Typography color="text.secondary" mt={0.5}>
//             Track profiles, onboarding progress, documents, and client deployments
//           </Typography>
//         </Box>
//         <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
//           <Button variant="outlined" startIcon={<FileDownload />} disabled={exporting}
//             onClick={() => handleExport("excel")}
//             sx={{ textTransform: "none", fontWeight: 700, borderColor: "#15803d", color: "#15803d" }}>
//             {exporting ? <CircularProgress size={14} sx={{ mr: 0.5 }} /> : null}
//             Export Excel
//           </Button>
//           <Button variant="outlined" startIcon={<FileDownload />} disabled={exporting}
//             onClick={() => handleExport("csv")}
//             sx={{ textTransform: "none", fontWeight: 700, borderColor: "#64748b", color: "#64748b" }}>
//             Export CSV
//           </Button>
//           <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large"
//             sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1e3a8a" } }}>
//             Add Employee
//           </Button>
//         </Box>
//       </Box>

//       {/* ── Stats ────────────────────────────────────────────────────────── */}
//       <Grid container spacing={2}>
//         <Grid item xs={6} md={3}><StatCard title="Total Employees" value={stats.total}   color="#1e40af" icon={<Group />} /></Grid>
//         <Grid item xs={6} md={3}><StatCard title="Active"          value={stats.active}  color="#15803d" icon={<CheckCircle />} /></Grid>
//         <Grid item xs={6} md={3}><StatCard title="On Bench"        value={stats.onBench} color="#c2410c" icon={<Work />} /></Grid>
//         <Grid item xs={6} md={3}><StatCard title="Active Clients"  value={stats.clients} color="#0369a1" icon={<Business />} /></Grid>
//       </Grid>

//       {/* ── Filters ──────────────────────────────────────────────────────── */}
//       <Box display="flex" gap={2} flexWrap="wrap">
//         <TextField
//           placeholder="Search by name, ID, designation, client…"
//           value={search} onChange={e => setSearch(e.target.value)}
//           size="small" sx={{ flexGrow: 1, minWidth: 220 }}
//           InputProps={{
//             startAdornment: (
//               <InputAdornment position="start">
//                 <Search fontSize="small" color="action" />
//               </InputAdornment>
//             ),
//           }}
//         />
//         <TextField select value={statusF} onChange={e => setStatusF(e.target.value)}
//           size="small" sx={{ minWidth: 150 }} label="Status">
//           <MenuItem value="">All Statuses</MenuItem>
//           {EMP_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//         </TextField>
//         <TextField select value={deptF} onChange={e => setDeptF(e.target.value)}
//           size="small" sx={{ minWidth: 180 }} label="Department">
//           <MenuItem value="">All Departments</MenuItem>
//           {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
//         </TextField>
//         {(search || statusF || deptF) && (
//           <Button size="small" onClick={() => { setSearch(""); setStatusF(""); setDeptF(""); }}
//             sx={{ textTransform: "none", color: "#64748b" }}>
//             Clear filters
//           </Button>
//         )}
//       </Box>

//       {/* ── Table ────────────────────────────────────────────────────────── */}
//       <EmployeeTable
//         employees={employees}
//         filtered={filtered}
//         onView={openView}
//         onEdit={openEdit}
//         onDelete={openDelete}
//         onAdd={openCreate}
//       />

//       {/* ── Detail Dialog ────────────────────────────────────────────────── */}
//       <EmployeeDetail
//         open={detailOpen}
//         employee={selected}
//         onClose={() => setDetailOpen(false)}
//         onEdit={openEdit}
//         onEmployeeUpdate={handleEmployeeUpdate}
//       />

//       {/* ── Add / Edit Form ──────────────────────────────────────────────── */}
//       <EmployeeForm
//         open={formOpen}
//         onClose={() => setFormOpen(false)}
//         onSave={handleSave}
//         selected={selected}
//         saving={saving}
//       />

//       {/* ── Delete Confirm ───────────────────────────────────────────────── */}
//       <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
//         <DialogTitle fontWeight={700}>Delete Employee</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Are you sure you want to permanently delete{" "}
//             <strong>{selected?.name}</strong>?{" "}
//             This will also remove all their onboarding and document records.
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
import {
  Box, Card, CardContent, Grid, Paper, Typography, Button, TextField,
  MenuItem, Table, TableHead, TableBody, TableRow, TableCell, Chip,
  Avatar, IconButton, Tooltip, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, InputAdornment, Divider,
} from "@mui/material";
import {
  Add, Search, Edit, Delete, Visibility, Group, CheckCircle,
  Work, Business, FileDownload,
} from "@mui/icons-material";
import EmployeeDetail from "./Employeedetail";
import {
  EMP_STATUSES, EMPLOYMENT_TYPES, CURRENCIES, DEPARTMENTS,
  STATUS_COLOR, DEPT_COLOR, EMPTY_FORM,
  fmtDate, fmtMoney, nameInitials,
} from "./employeeConstants";

// ── API helpers ───────────────────────────────────────────────────────────────
const BASE = process.env.REACT_APP_API_BASE_URL;
const hdrs = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});
const ok = async (res) => {
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

const getAllEmployees = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE}/employees/${qs ? "?" + qs : ""}`, { headers: hdrs() }).then(ok);
};
const createEmployee = (pl)     => fetch(`${BASE}/employees/`,      { method: "POST",   headers: hdrs(), body: JSON.stringify(pl) }).then(ok);
const updateEmployee = (id, pl) => fetch(`${BASE}/employees/${id}`, { method: "PUT",    headers: hdrs(), body: JSON.stringify(pl) }).then(ok);
const deleteEmployee = (id)     => fetch(`${BASE}/employees/${id}`, { method: "DELETE", headers: hdrs() }).then(ok);

const downloadExport = async (type = "excel") => {
  const res  = await fetch(`${BASE}/export/employees/${type}`, { headers: hdrs() });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href     = URL.createObjectURL(blob);
  link.download = `employees_${new Date().toISOString().slice(0, 10)}.${type === "csv" ? "csv" : "xlsx"}`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// ── Shared TextField sx ───────────────────────────────────────────────────────
const TF = { width: "100%", minWidth: 250 };

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, color, icon }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden", position: "relative" }}>
      <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, bgcolor: color }} />
      <CardContent sx={{ p: 2.5, pl: 3.5 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography fontSize={11} fontWeight={600} color="text.secondary"
              textTransform="uppercase" letterSpacing="0.08em" mb={0.8}>
              {title}
            </Typography>
            <Typography fontSize={28} fontWeight={800} color="#0f172a" lineHeight={1}>{value}</Typography>
          </Box>
          <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: `${color}18`,
                     display: "flex", alignItems: "center", justifyContent: "center" }}>
            {React.cloneElement(icon, { sx: { fontSize: 20, color } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Form section label ────────────────────────────────────────────────────────
const FormSection = ({ children }) => (
  <Typography fontWeight={700} fontSize={11} color="#1e40af"
    textTransform="uppercase" letterSpacing="0.06em" mb={1.5}>
    {children}
  </Typography>
);

// ── Employee Add / Edit Form ──────────────────────────────────────────────────
function EmployeeForm({ open, onClose, onSave, selected, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (selected) {
      setForm({
        ...EMPTY_FORM, ...selected,
        date_of_joining:      selected.date_of_joining      ? selected.date_of_joining.split("T")[0] : "",
        salary:               selected.salary               || "",
        current_billing_rate: selected.current_billing_rate || "",
        experience:           selected.experience           || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, selected]);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = e => {
    e.preventDefault();
    onSave({
      ...form,
      experience:           form.experience           ? Number(form.experience)           : 0,
      salary:               form.salary               ? Number(form.salary)               : 0,
      current_billing_rate: form.current_billing_rate ? Number(form.current_billing_rate) : 0,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", fontSize: 16 }}>
        {selected ? "Edit Employee" : "Add New Employee"}
      </DialogTitle>

      <form onSubmit={submit}>
        <DialogContent sx={{ pt: 3 }}>

          {/* ── Personal Information ───────────────────────────────────────── */}
          <FormSection>Personal Information</FormSection>
          <Grid container spacing={2.5} mb={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" required label="Employee ID" name="emp_id"
                value={form.emp_id} onChange={handle}
                disabled={!!selected}
                placeholder="e.g. EMP001"
                helperText={selected ? "Employee ID cannot be changed after creation" : "Unique ID assigned to this employee"}
                sx={TF}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" required label="Full Name" name="name"
                value={form.name} onChange={handle} sx={TF}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" required type="email" label="Work Email" name="email"
                value={form.email} onChange={handle} sx={TF}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" label="Phone Number" name="phone"
                value={form.phone} onChange={handle}
                placeholder="+91 98765 43210" sx={TF}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" label="Location / City" name="location"
                value={form.location} onChange={handle}
                placeholder="e.g. Hyderabad" sx={TF}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          {/* ── Employment Details ─────────────────────────────────────────── */}
          <FormSection>Employment Details</FormSection>
          <Grid container spacing={2.5} mb={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" label="Designation / Job Title" name="designation"
                value={form.designation} onChange={handle}
                placeholder="e.g. Senior Software Engineer" sx={TF}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select size="small" label="Department" name="department"
                value={form.department} onChange={handle} sx={TF}>
                {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select size="small" label="Employment Type" name="employment_type"
                value={form.employment_type} onChange={handle} sx={TF}>
                {EMPLOYMENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" type="date" label="Date of Joining" name="date_of_joining"
                value={form.date_of_joining} onChange={handle}
                InputLabelProps={{ shrink: true }} sx={TF}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" type="number" label="Experience (years)" name="experience"
                value={form.experience} onChange={handle}
                inputProps={{ min: 0, step: 0.5 }}
                placeholder="e.g. 3.5" sx={TF}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" label="Reporting Manager" name="reporting_manager"
                value={form.reporting_manager} onChange={handle}
                placeholder="Manager's full name" sx={TF}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select size="small" label="Employment Status" name="status"
                value={form.status} onChange={handle} sx={TF}>
                {EMP_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" type="number" label="Annual Salary (₹)" name="salary"
                value={form.salary} onChange={handle}
                inputProps={{ min: 0 }}
                placeholder="e.g. 800000" sx={TF}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                size="small" label="Skills (comma-separated)" name="skills"
                value={form.skills} onChange={handle}
                placeholder="e.g. React, Node.js, MongoDB, AWS" sx={TF}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          {/* ── Current Client Deployment ──────────────────────────────────── */}
          <FormSection>Current Client Deployment</FormSection>
          <Grid container spacing={2.5} mb={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" label="Current Client" name="current_client"
                value={form.current_client} onChange={handle}
                placeholder="Client company name" sx={TF}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" label="Current Project" name="current_project"
                value={form.current_project} onChange={handle}
                placeholder="Project name" sx={TF}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" type="number" label="Billing Rate" name="current_billing_rate"
                value={form.current_billing_rate} onChange={handle}
                inputProps={{ min: 0 }}
                placeholder="e.g. 75" sx={TF}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select size="small" label="Billing Currency" name="billing_currency"
                value={form.billing_currency} onChange={handle} sx={TF}>
                {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          {/* ── Notes ─────────────────────────────────────────────────────── */}
          <FormSection>Additional Notes</FormSection>
          <TextField
            multiline rows={3} size="small" label="Notes"
            name="notes" value={form.notes} onChange={handle}
            placeholder="Any additional remarks about this employee…"
            sx={TF}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={onClose} sx={{ color: "#64748b" }}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}
            sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1e3a8a" }, px: 3 }}>
            {saving && <CircularProgress size={16} sx={{ mr: 1, color: "#fff" }} />}
            {selected ? "Update Employee" : "Add Employee"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ── Employee Table ────────────────────────────────────────────────────────────
function EmployeeTable({ employees, filtered, onView, onEdit, onDelete, onAdd }) {
  if (employees.length === 0) {
    return (
      <Card>
        <Box display="flex" flexDirection="column" alignItems="center" py={10} gap={2}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: "#e0e7ff" }}>
            <Group sx={{ fontSize: 36, color: "#818cf8" }} />
          </Avatar>
          <Typography variant="h6" color="text.secondary">No employees yet</Typography>
          <Typography fontSize={14} color="text.disabled">
            Add your first employee to start tracking workforce data.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ bgcolor: "#1e40af" }}>
            Add Employee
          </Button>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              {["Employee", "Designation", "Department", "Current Client", "Billing Rate", "DOJ", "Exp.", "Status", "Actions"].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#64748b" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  No employees match your filters
                </TableCell>
              </TableRow>
            ) : filtered.map(emp => {
              const dc = DEPT_COLOR[emp.department] || "#475569";
              return (
                <TableRow key={emp._id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ width: 38, height: 38, fontSize: 13, fontWeight: 700, bgcolor: dc }}>
                        {nameInitials(emp.name)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600} fontSize={13}>{emp.name}</Typography>
                        <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: "monospace" }}>
                          {emp.emp_id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography fontSize={13}>{emp.designation || "—"}</Typography></TableCell>
                  <TableCell>
                    <Chip label={emp.department} size="small"
                      sx={{ bgcolor: `${dc}18`, color: dc, fontWeight: 600, fontSize: 11 }} />
                  </TableCell>
                  <TableCell>
                    {emp.current_client ? (
                      <Box>
                        <Typography fontSize={13} fontWeight={700} color="#15803d">{emp.current_client}</Typography>
                        {emp.current_project && (
                          <Typography fontSize={11} color="text.secondary">{emp.current_project}</Typography>
                        )}
                      </Box>
                    ) : <Typography fontSize={12} color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>
                    {emp.current_billing_rate > 0
                      ? <Typography fontSize={13} fontWeight={700} color="#15803d">
                          {fmtMoney(emp.current_billing_rate, emp.billing_currency)}
                        </Typography>
                      : <Typography fontSize={12} color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{fmtDate(emp.date_of_joining)}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{emp.experience} yrs</TableCell>
                  <TableCell>
                    <Chip label={emp.status} color={STATUS_COLOR[emp.status] || "default"}
                      size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => onView(emp)}><Visibility fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(emp)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => onDelete(emp)}><Delete fontSize="small" /></IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Employees() {
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [statusF,    setStatusF]    = useState("");
  const [deptF,      setDeptF]      = useState("");
  const [formOpen,   setFormOpen]   = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [exporting,  setExporting]  = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await getAllEmployees();
      setEmployees(res.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = employees.filter(e => {
    const q  = search.toLowerCase();
    const mQ = !q || [e.name, e.emp_id, e.designation, e.current_client]
                      .some(f => f?.toLowerCase().includes(q));
    const mS = !statusF || e.status     === statusF;
    const mD = !deptF   || e.department === deptF;
    return mQ && mS && mD;
  });

  const stats = {
    total:   employees.length,
    active:  employees.filter(e => e.status === "Active").length,
    onBench: employees.filter(e => e.status === "On Bench").length,
    clients: new Set(employees.filter(e => e.current_client).map(e => e.current_client)).size,
  };

  const openCreate = ()  => { setSelected(null); setFormOpen(true); };
  const openEdit   = (e) => { setSelected(e);    setFormOpen(true); setDetailOpen(false); };
  const openView   = (e) => { setSelected(e);    setDetailOpen(true); };
  const openDelete = (e) => { setSelected(e);    setDeleteOpen(true); };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (selected) await updateEmployee(selected._id, payload);
      else          await createEmployee(payload);
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEmployee(selected._id);
      setDeleteOpen(false);
      load();
    } catch (err) {
      setError(err?.message || "Delete failed");
    }
  };

  const handleEmployeeUpdate = async () => {
    const res   = await getAllEmployees();
    const fresh = res.data || [];
    setEmployees(fresh);
    const updated = fresh.find(e => e._id === selected?._id);
    if (updated) setSelected(updated);
  };

  const handleExport = async (type) => {
    setExporting(true);
    try   { await downloadExport(type); }
    catch { setError("Export failed — please try again."); }
    finally { setExporting(false); }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress size={48} />
    </Box>
  );

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a">Our Employees</Typography>
          <Typography color="text.secondary" mt={0.5}>
            Track profiles, onboarding progress, documents, and client deployments
          </Typography>
        </Box>
        <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
          <Button variant="outlined" startIcon={<FileDownload />} disabled={exporting}
            onClick={() => handleExport("excel")}
            sx={{ textTransform: "none", fontWeight: 700, borderColor: "#15803d", color: "#15803d" }}>
            {exporting ? <CircularProgress size={14} sx={{ mr: 0.5 }} /> : null}
            Export Excel
          </Button>
          <Button variant="outlined" startIcon={<FileDownload />} disabled={exporting}
            onClick={() => handleExport("csv")}
            sx={{ textTransform: "none", fontWeight: 700, borderColor: "#64748b", color: "#64748b" }}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large"
            sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1e3a8a" } }}>
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}><StatCard title="Total Employees" value={stats.total}   color="#1e40af" icon={<Group />} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Active"          value={stats.active}  color="#15803d" icon={<CheckCircle />} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="On Bench"        value={stats.onBench} color="#c2410c" icon={<Work />} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Active Clients"  value={stats.clients} color="#0369a1" icon={<Business />} /></Grid>
      </Grid>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <Box display="flex" gap={2} flexWrap="wrap">
        <TextField
          placeholder="Search by name, ID, designation, client…"
          value={search} onChange={e => setSearch(e.target.value)}
          size="small" sx={{ flexGrow: 1, minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <TextField select value={statusF} onChange={e => setStatusF(e.target.value)}
          size="small" sx={{ width: "100%", maxWidth: 180, minWidth: 150 }} label="Status">
          <MenuItem value="">All Statuses</MenuItem>
          {EMP_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField select value={deptF} onChange={e => setDeptF(e.target.value)}
          size="small" sx={{ width: "100%", maxWidth: 220, minWidth: 180 }} label="Department">
          <MenuItem value="">All Departments</MenuItem>
          {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </TextField>
        {(search || statusF || deptF) && (
          <Button size="small" onClick={() => { setSearch(""); setStatusF(""); setDeptF(""); }}
            sx={{ textTransform: "none", color: "#64748b" }}>
            Clear filters
          </Button>
        )}
      </Box>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <EmployeeTable
        employees={employees} filtered={filtered}
        onView={openView} onEdit={openEdit} onDelete={openDelete} onAdd={openCreate}
      />

      {/* ── Detail Dialog ────────────────────────────────────────────────── */}
      <EmployeeDetail
        open={detailOpen} employee={selected}
        onClose={() => setDetailOpen(false)}
        onEdit={openEdit} onEmployeeUpdate={handleEmployeeUpdate}
      />

      {/* ── Add / Edit Form ──────────────────────────────────────────────── */}
      <EmployeeForm
        open={formOpen} onClose={() => setFormOpen(false)}
        onSave={handleSave} selected={selected} saving={saving}
      />

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete Employee</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete <strong>{selected?.name}</strong>?
            This will also remove all their onboarding and document records.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ color: "#64748b" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}