import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, Paper, Chip,
  IconButton, Tooltip, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, InputAdornment, Divider, Grid,
} from "@mui/material";
import {
  Add, Search, Edit, Delete, Visibility,
  Business, Work, Group, TrendingUp, CheckCircle,
  Close as CloseIcon, Timeline,
} from "@mui/icons-material";

const BASE = process.env.REACT_APP_API_BASE_URL;
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});
const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

const getAllEmployees  = (p = {}) => {
  const qs = new URLSearchParams(p).toString();
  return fetch(`${BASE}/employees/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
};
const createEmployee  = (pl) => fetch(`${BASE}/employees/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(pl) }).then(handle);
const updateEmployee  = (id, pl) => fetch(`${BASE}/employees/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(pl) }).then(handle);
const deleteEmployee  = (id) => fetch(`${BASE}/employees/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
const addEngagement   = (id, pl) => fetch(`${BASE}/employees/${id}/engagement`, { method: "POST", headers: getHeaders(), body: JSON.stringify(pl) }).then(handle);
const endEngagement   = (id, idx, pl) => fetch(`${BASE}/employees/${id}/engagement/${idx}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(pl) }).then(handle);

// ── Constants ─────────────────────────────────────────────────────────────────
const EMP_STATUSES    = ["Active", "On Bench", "On Notice", "Resigned", "Terminated"];
const EMPLOYMENT_TYPES = ["Permanent", "Contract", "C2H", "Freelance"];
const CURRENCIES      = ["INR", "USD", "GBP", "EUR", "AED"];
const DEPARTMENTS     = ["Engineering", "QA & Testing", "DevOps & Cloud", "Design & UX", "Data & Analytics", "Management", "Sales", "HR", "Finance", "Other"];
const STATUS_COLOR    = { Active: "success", "On Bench": "warning", "On Notice": "info", Resigned: "error", Terminated: "error" };

const EMPTY_FORM = {
  name: "", email: "", phone: "", designation: "", department: "Engineering",
  employment_type: "Permanent", date_of_joining: "", skills: "", experience: "",
  location: "", reporting_manager: "", status: "Active",
  current_client: "", current_project: "", current_billing_rate: "",
  billing_currency: "INR", salary: "", notes: "",
};
const EMPTY_ENG = {
  client_name: "", project_name: "", role: "", start_date: "", end_date: "",
  billing_rate: "", billing_currency: "INR", work_location: "", technology: "", notes: "",
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const fmtSalary = (v, currency = "INR") => {
  if (!v) return "—";
  if (currency === "INR") {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    return `₹${Number(v).toLocaleString("en-IN")}`;
  }
  return `${currency} ${Number(v).toLocaleString()}`;
};
const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const deptColor = {
  "Engineering": "#1e40af", "QA & Testing": "#0369a1", "DevOps & Cloud": "#7e22ce",
  "Design & UX": "#be185d", "Data & Analytics": "#0f766e", "Management": "#c2410c",
  "Sales": "#15803d", "HR": "#b45309", "Finance": "#64748b", "Other": "#475569",
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, color, icon }) => (
  <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden", position: "relative" }}>
    <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, bgcolor: color }} />
    <CardContent sx={{ p: 2.5, pl: 3.5 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography fontSize={11} fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing="0.08em" mb={0.8}>{title}</Typography>
          <Typography fontSize={28} fontWeight={800} color="#0f172a" lineHeight={1}>{value}</Typography>
        </Box>
        <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.cloneElement(icon, { sx: { fontSize: 20, color } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ── Employee Detail Content ───────────────────────────────────────────────────
function EmployeeDetailContent({ employee, onClose, onEdit, onAddEngagement, onEndEngagement }) {
  const [tab, setTab] = React.useState(0);
  const dept = employee.department || "Other";
  const dColor = deptColor[dept] || "#475569";

  return (
    <>
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: "1px solid #e0e0e0" }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ width: 60, height: 60, bgcolor: dColor, fontSize: "1.4rem", fontWeight: 700 }}>
              {nameInitials(employee.name)}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={800}>{employee.name}</Typography>
              <Typography color="text.secondary" fontSize={13}>{employee.designation} · {employee.department}</Typography>
              <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                <Chip label={employee.status} color={STATUS_COLOR[employee.status] || "default"} size="small" sx={{ fontWeight: 700 }} />
                <Chip label={employee.emp_id} size="small" variant="outlined" sx={{ fontWeight: 600, fontFamily: "monospace" }} />
                <Chip label={employee.employment_type} size="small" sx={{ bgcolor: "#f1f5f9", fontSize: 11 }} />
                {employee.current_client && (
                  <Chip label={`Client: ${employee.current_client}`} size="small" color="info" sx={{ fontWeight: 600 }} />
                )}
              </Box>
            </Box>
          </Box>
          <Box display="flex" mt={2}>
            {["Profile", "Client History"].map((label, i) => (
              <Box key={i} onClick={() => setTab(i)} sx={{
                px: 2, py: 1, cursor: "pointer",
                fontWeight: tab === i ? 700 : 400, fontSize: 13,
                borderBottom: tab === i ? `2px solid ${dColor}` : "2px solid transparent",
                color: tab === i ? dColor : "text.secondary",
                transition: "all 0.15s",
              }}>{label}</Box>
            ))}
          </Box>
        </Box>

        {/* TAB 0 — Profile */}
        {tab === 0 && (
          <Box p={3}>
            <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" mb={2}>Personal &amp; Contact</Typography>
            <Grid container spacing={2} mb={3}>
              {[
                ["Email",       employee.email],
                ["Phone",       employee.phone || "—"],
                ["Location",    employee.location || "—"],
                ["Experience",  `${employee.experience} years`],
                ["Date of Joining", fmtDate(employee.date_of_joining)],
                ["Reporting To", employee.reporting_manager || "—"],
              ].map(([label, val]) => (
                <Grid item xs={6} sm={4} key={label}>
                  <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
                  <Typography fontWeight={600} fontSize={13}>{val}</Typography>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" mb={2}>Current Deployment</Typography>
            <Box p={2} borderRadius={2} mb={3} sx={{ bgcolor: employee.current_client ? "#f0fdf4" : "#f8fafc", border: `1px solid ${employee.current_client ? "#bbf7d0" : "#e2e8f0"}` }}>
              {employee.current_client ? (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">Client</Typography>
                    <Typography fontWeight={700} fontSize={14} color="#15803d">{employee.current_client}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">Project</Typography>
                    <Typography fontWeight={600} fontSize={13}>{employee.current_project || "—"}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">Billing Rate</Typography>
                    <Typography fontWeight={700} fontSize={14} color="#15803d">
                      {fmtSalary(employee.current_billing_rate, employee.billing_currency)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">Currency</Typography>
                    <Typography fontWeight={600} fontSize={13}>{employee.billing_currency}</Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography fontSize={13} color="text.secondary" textAlign="center" py={1}>
                  Not currently deployed to any client
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" mb={2}>Compensation</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={6} sm={4}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">Salary (Annual)</Typography>
                <Typography fontWeight={700} fontSize={14}>{fmtSalary(employee.salary)}</Typography>
              </Grid>
            </Grid>

            {employee.skills && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" mb={1.5}>Skills</Typography>
                <Box display="flex" flexWrap="wrap" gap={0.8}>
                  {employee.skills.split(",").filter(Boolean).map((s, i) => (
                    <Chip key={i} label={s.trim()} size="small" variant="outlined"
                      sx={{ fontSize: 11, borderColor: dColor, color: dColor }} />
                  ))}
                </Box>
              </>
            )}

            {employee.notes && (
              <Box mt={2} p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.3}>Notes</Typography>
                <Typography fontSize={13}>{employee.notes}</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* TAB 1 — Client History */}
        {tab === 1 && (
          <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase">
                Client Engagements ({(employee.client_history || []).length})
              </Typography>
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={onAddEngagement}
                sx={{ textTransform: "none", fontWeight: 700, borderColor: dColor, color: dColor }}>
                Add Engagement
              </Button>
            </Box>

            {(!employee.client_history || employee.client_history.length === 0) ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1}>
                <Timeline sx={{ fontSize: 48, color: "#cbd5e1" }} />
                <Typography color="text.secondary" fontWeight={600}>No client history yet</Typography>
                <Typography fontSize={13} color="text.disabled">Add the first client engagement above.</Typography>
              </Box>
            ) : (
              <Box>
                {[...employee.client_history].reverse().map((eng, revIdx) => {
                  const originalIdx = employee.client_history.length - 1 - revIdx;
                  const isActive = !eng.end_date;
                  return (
                    <Box key={revIdx} display="flex" gap={2} mb={3}>
                      {/* Timeline dot */}
                      <Box display="flex" flexDirection="column" alignItems="center" sx={{ pt: 0.5, minWidth: 24 }}>
                        <Box sx={{
                          width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                          bgcolor: isActive ? "#15803d" : dColor,
                          border: "3px solid", borderColor: isActive ? "#bbf7d0" : "#e2e8f0",
                          boxShadow: isActive ? "0 0 0 3px #dcfce7" : "none",
                        }} />
                        {revIdx < employee.client_history.length - 1 && (
                          <Box sx={{ width: 2, flexGrow: 1, minHeight: 40, bgcolor: "#e2e8f0", my: 0.5 }} />
                        )}
                      </Box>

                      {/* Engagement card */}
                      <Box flex={1} p={2} borderRadius={2}
                        sx={{ border: `1px solid ${isActive ? "#bbf7d0" : "#e2e8f0"}`, bgcolor: isActive ? "#f0fdf4" : "#fafafa" }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                          <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              <Typography fontWeight={800} fontSize={15} color={isActive ? "#15803d" : "#0f172a"}>
                                {eng.client_name}
                              </Typography>
                              {isActive && <Chip label="Current" size="small" color="success" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />}
                            </Box>
                            <Typography fontSize={13} color="text.secondary">
                              {eng.project_name && `${eng.project_name} · `}{eng.role || "—"}
                            </Typography>
                          </Box>
                          {isActive && (
                            <Tooltip title="Mark as Ended">
                              <Button size="small" variant="outlined" color="warning"
                                onClick={() => onEndEngagement(originalIdx)}
                                sx={{ textTransform: "none", fontSize: 11, py: 0.3 }}>
                                End
                              </Button>
                            </Tooltip>
                          )}
                        </Box>

                        <Grid container spacing={1.5}>
                          <Grid item xs={6} sm={3}>
                            <Typography fontSize={10} color="text.secondary" fontWeight={600} textTransform="uppercase">Start Date</Typography>
                            <Typography fontWeight={600} fontSize={12}>{fmtDate(eng.start_date)}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography fontSize={10} color="text.secondary" fontWeight={600} textTransform="uppercase">End Date</Typography>
                            <Typography fontWeight={600} fontSize={12}>{eng.end_date ? fmtDate(eng.end_date) : "Present"}</Typography>
                          </Grid>
                          {eng.billing_rate > 0 && (
                            <Grid item xs={6} sm={3}>
                              <Typography fontSize={10} color="text.secondary" fontWeight={600} textTransform="uppercase">Billing Rate</Typography>
                              <Typography fontWeight={700} fontSize={12} color="#15803d">
                                {fmtSalary(eng.billing_rate, eng.billing_currency)}
                              </Typography>
                            </Grid>
                          )}
                          {eng.work_location && (
                            <Grid item xs={6} sm={3}>
                              <Typography fontSize={10} color="text.secondary" fontWeight={600} textTransform="uppercase">Location</Typography>
                              <Typography fontWeight={600} fontSize={12}>{eng.work_location}</Typography>
                            </Grid>
                          )}
                        </Grid>

                        {eng.technology && (
                          <Box mt={1.5}>
                            <Typography fontSize={10} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.5}>Technology</Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {eng.technology.split(",").map(t => (
                                <Chip key={t} label={t.trim()} size="small"
                                  sx={{ fontSize: 10, height: 18, bgcolor: isActive ? "#dcfce7" : "#f1f5f9", color: isActive ? "#15803d" : "#475569" }} />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {eng.notes && (
                          <Typography fontSize={11} color="text.secondary" mt={1}>{eng.notes}</Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onEdit} sx={{ bgcolor: dColor, "&:hover": { filter: "brightness(0.9)" } }}>Edit</Button>
      </DialogActions>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
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
  const [engOpen,    setEngOpen]    = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [engData,    setEngData]    = useState(EMPTY_ENG);
  const [saving,     setSaving]     = useState(false);
  const [engSaving,  setEngSaving]  = useState(false);

  const load = useCallback(async () => {
    try { setLoading(true); setError(""); const res = await getAllEmployees(); setEmployees(res.data || []); }
    catch (err) { setError(err?.message || "Failed to load"); setEmployees([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const mQ = !q || e.name?.toLowerCase().includes(q) || e.emp_id?.toLowerCase().includes(q) || e.designation?.toLowerCase().includes(q) || e.current_client?.toLowerCase().includes(q);
    const mS = !statusF || e.status === statusF;
    const mD = !deptF   || e.department === deptF;
    return mQ && mS && mD;
  });

  const stats = {
    total:    employees.length,
    active:   employees.filter(e => e.status === "Active").length,
    onBench:  employees.filter(e => e.status === "On Bench").length,
    clients:  new Set(employees.filter(e => e.current_client).map(e => e.current_client)).size,
  };

  const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
  const openEdit   = e  => { setSelected(e); setFormData({ ...EMPTY_FORM, ...e, date_of_joining: e.date_of_joining ? e.date_of_joining.split("T")[0] : "", salary: e.salary || "", current_billing_rate: e.current_billing_rate || "", experience: e.experience || "" }); setFormOpen(true); };
  const openDetail = e  => { setSelected(e); setDetailOpen(true); };
  const openDelete = e  => { setSelected(e); setDeleteOpen(true); };

  const openAddEngagement = () => { setEngData(EMPTY_ENG); setEngOpen(true); };
  const handleEndEngagement = async (idx) => {
    try {
      await endEngagement(selected._id, idx, {});
      const res = await getAllEmployees();
      setEmployees(res.data || []);
      const updated = (res.data || []).find(e => e._id === selected._id);
      if (updated) setSelected(updated);
    } catch (err) { setError(err?.message || "Failed to end engagement"); }
  };

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleEngChange = e => setEngData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        ...formData,
        experience:           formData.experience           ? Number(formData.experience)           : 0,
        salary:               formData.salary               ? Number(formData.salary)               : 0,
        current_billing_rate: formData.current_billing_rate ? Number(formData.current_billing_rate) : 0,
      };
      if (selected) await updateEmployee(selected._id, payload);
      else          await createEmployee(payload);
      setFormOpen(false); load();
    } catch (err) { setError(err?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleSaveEngagement = async () => {
    if (!engData.client_name) { setError("Client name is required"); return; }
    setEngSaving(true);
    try {
      const payload = {
        ...engData,
        billing_rate: engData.billing_rate ? Number(engData.billing_rate) : 0,
      };
      const res = await addEngagement(selected._id, payload);
      setEngOpen(false);
      const updated = res.data;
      setSelected(updated);
      setEmployees(prev => prev.map(e => e._id === updated._id ? updated : e));
    } catch (err) { setError(err?.message || "Failed to add engagement"); }
    finally { setEngSaving(false); }
  };

  const handleDelete = async () => {
    try { await deleteEmployee(selected._id); setDeleteOpen(false); load(); }
    catch (err) { setError(err?.message || "Delete failed"); }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={48} /></Box>;

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a">Our Employees</Typography>
          <Typography color="text.secondary" mt={0.5}>Track employee profiles, deployments, and client engagement history</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large"
          sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1e3a8a" } }}>
          Add Employee
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}><StatCard title="Total Employees" value={stats.total}   color="#1e40af" icon={<Group />} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Active"          value={stats.active}  color="#15803d" icon={<CheckCircle />} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="On Bench"        value={stats.onBench} color="#c2410c" icon={<Work />} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Active Clients"  value={stats.clients} color="#0369a1" icon={<Business />} /></Grid>
      </Grid>

      {/* Filters */}
      <Box display="flex" gap={2} flexWrap="wrap">
        <TextField placeholder="Search by name, ID, designation, client…" value={search}
          onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
        <TextField select value={statusF} onChange={e => setStatusF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Status">
          <MenuItem value="">All Statuses</MenuItem>
          {EMP_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField select value={deptF} onChange={e => setDeptF(e.target.value)} size="small" sx={{ minWidth: 180 }} label="Department">
          <MenuItem value="">All Departments</MenuItem>
          {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </TextField>
        {(search || statusF || deptF) && (
          <Button size="small" onClick={() => { setSearch(""); setStatusF(""); setDeptF(""); }} sx={{ textTransform: "none", color: "#64748b" }}>Clear</Button>
        )}
      </Box>

      {/* Table */}
      {employees.length === 0 && !error ? (
        <Card>
          <Box display="flex" flexDirection="column" alignItems="center" py={10} gap={2}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: "#e0e7ff" }}><Group sx={{ fontSize: 36, color: "#818cf8" }} /></Avatar>
            <Typography variant="h6" color="text.secondary">No employees yet</Typography>
            <Typography fontSize={14} color="text.disabled">Add your first employee to start tracking workforce data.</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ bgcolor: "#1e40af" }}>Add Employee</Button>
          </Box>
        </Card>
      ) : (
        <Card>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  {["Employee", "Designation", "Department", "Current Client", "Billing Rate", "DOJ", "Experience", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#64748b" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>No employees match your filters</TableCell></TableRow>
                ) : filtered.map(emp => {
                  const dc = deptColor[emp.department] || "#475569";
                  return (
                    <TableRow key={emp._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 38, height: 38, fontSize: 13, fontWeight: 700, bgcolor: dc }}>{nameInitials(emp.name)}</Avatar>
                          <Box>
                            <Typography fontWeight={600} fontSize={13}>{emp.name}</Typography>
                            <Typography fontSize={11} color="text.secondary" sx={{ fontFamily: "monospace" }}>{emp.emp_id}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Typography fontSize={13}>{emp.designation || "—"}</Typography></TableCell>
                      <TableCell>
                        <Chip label={emp.department} size="small" sx={{ bgcolor: `${dc}18`, color: dc, fontWeight: 600, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        {emp.current_client ? (
                          <Box>
                            <Typography fontSize={13} fontWeight={700} color="#15803d">{emp.current_client}</Typography>
                            {emp.current_project && <Typography fontSize={11} color="text.secondary">{emp.current_project}</Typography>}
                          </Box>
                        ) : <Typography fontSize={12} color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {emp.current_billing_rate > 0
                          ? <Typography fontSize={13} fontWeight={700} color="#15803d">{fmtSalary(emp.current_billing_rate, emp.billing_currency)}</Typography>
                          : <Typography fontSize={12} color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{fmtDate(emp.date_of_joining)}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{emp.experience} yrs</TableCell>
                      <TableCell>
                        <Chip label={emp.status} color={STATUS_COLOR[emp.status] || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="View Details"><IconButton size="small" onClick={() => openDetail(emp)}><Visibility fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(emp)}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDelete(emp)}><Delete fontSize="small" /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: "75vh" } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Employee Details
            <IconButton size="small" onClick={() => setDetailOpen(false)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </DialogTitle>
        {selected && (
          <EmployeeDetailContent
            employee={selected}
            onClose={() => setDetailOpen(false)}
            onEdit={() => { setDetailOpen(false); openEdit(selected); }}
            onAddEngagement={openAddEngagement}
            onEndEngagement={handleEndEngagement}
          />
        )}
      </Dialog>

      {/* Add Engagement Dialog */}
      <Dialog open={engOpen} onClose={() => setEngOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          Add Client Engagement
          {selected && <Typography fontSize={12} color="text.secondary">for {selected.name}</Typography>}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth size="small" required label="Client Name" name="client_name" value={engData.client_name} onChange={handleEngChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Project Name" name="project_name" value={engData.project_name} onChange={handleEngChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Role on Project" name="role" value={engData.role} onChange={handleEngChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="date" label="Start Date" name="start_date" value={engData.start_date} onChange={handleEngChange} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="date" label="End Date (leave blank if current)" name="end_date" value={engData.end_date} onChange={handleEngChange} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Billing Rate" name="billing_rate" value={engData.billing_rate} onChange={handleEngChange} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Currency" name="billing_currency" value={engData.billing_currency} onChange={handleEngChange}>
                {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Work Location (Onsite/Remote/Hybrid)" name="work_location" value={engData.work_location} onChange={handleEngChange} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Technology Stack (comma-separated)" name="technology" value={engData.technology} onChange={handleEngChange} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} size="small" label="Notes" name="notes" value={engData.notes} onChange={handleEngChange} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={() => setEngOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEngagement} disabled={engSaving || !engData.client_name}
            sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1e3a8a" } }}>
            {engSaving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            Save Engagement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          {selected ? "Edit Employee" : "Add New Employee"}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="subtitle2" color="#1e40af" mb={1.5} fontWeight={700}>Personal Info</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Full Name" name="name" value={formData.name} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required type="email" label="Email" name="email" value={formData.email} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" name="phone" value={formData.phone} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Location" name="location" value={formData.location} onChange={handleChange} /></Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="#1e40af" mb={1.5} fontWeight={700}>Employment Details</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Designation" name="designation" value={formData.designation} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Department" name="department" value={formData.department} onChange={handleChange}>
                  {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Employment Type" name="employment_type" value={formData.employment_type} onChange={handleChange}>
                  {EMPLOYMENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="date" label="Date of Joining" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Experience (years)" name="experience" value={formData.experience} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Reporting Manager" name="reporting_manager" value={formData.reporting_manager} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Status" name="status" value={formData.status} onChange={handleChange}>
                  {EMP_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Annual Salary (₹)" name="salary" value={formData.salary} onChange={handleChange} /></Grid>
              <Grid item xs={12}><TextField fullWidth size="small" label="Skills (comma-separated)" name="skills" value={formData.skills} onChange={handleChange} /></Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="#1e40af" mb={1.5} fontWeight={700}>Current Client Deployment</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Client" name="current_client" value={formData.current_client} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Project" name="current_project" value={formData.current_project} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Current Billing Rate" name="current_billing_rate" value={formData.current_billing_rate} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Billing Currency" name="billing_currency" value={formData.billing_currency} onChange={handleChange}>
                  {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <TextField fullWidth multiline rows={3} size="small" label="Notes" name="notes" value={formData.notes} onChange={handleChange} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1e3a8a" } }}>
              {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              {selected ? "Update" : "Add Employee"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete Employee</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{selected?.name}</strong>? This will remove all their data permanently.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}