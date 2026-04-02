


import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  InputAdornment, Divider, LinearProgress,
} from "@mui/material";
import {
  Add, Search, Edit, Delete, Visibility, Work,
  AccessTime, TrendingUp, ReportProblem, Person, WorkOff,
  Business,
} from "@mui/icons-material";

// ── Inline API calls ──────────────────────────────────────────────────────────
const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

const getAllJobs    = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE}/jobs/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
};
const createJob    = (payload) =>
  fetch(`${BASE}/jobs/`,      { method: "POST",   headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
const updateJob    = (id, payload) =>
  fetch(`${BASE}/jobs/${id}`, { method: "PUT",    headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
const deleteJob    = (id) =>
  fetch(`${BASE}/jobs/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
const getAllClients = () =>
  fetch(`${BASE}/clients/`,   { headers: getHeaders() }).then(handle);

const getCurrentUserName = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const full = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return full || user.email || "Unknown";
  } catch { return "Unknown"; }
};

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES   = ["Open", "On Hold", "Closed", "Filled"];
const JOB_TYPES  = ["Full-Time", "Part-Time", "Contract", "Internship"];
const WORK_MODES = ["On-site", "Remote", "Hybrid"];

const PRIORITY_COLOR = { Low: "default", Medium: "info", High: "warning", Critical: "error" };
const STATUS_COLOR   = { Open: "success", "On Hold": "warning", Closed: "default", Filled: "primary" };

const EMPTY_FORM = {
  job_id: "", title: "", client_id: "", client_name: "",
  openings: 1, job_type: "Full-Time", work_mode: "On-site",
  location: "", experience_min: 0, experience_max: 5,
  salary_min: "", salary_max: "", skills: "",
  description: "", priority: "Medium", status: "Open",
  deadline: "", notes: "",
};

const formatSalary = (val) => {
  if (!val) return "—";
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString()}`;
};

const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color, sub }) => (
  <Card>
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography fontSize={12} color="text.secondary" fontWeight={600}
            textTransform="uppercase" letterSpacing="0.05em">{title}</Typography>
          <Typography variant="h3" fontWeight={800} mt={0.5} sx={{ color }}>{value}</Typography>
          {sub && <Typography fontSize={12} color="text.secondary" mt={0.5}>{sub}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center"
    py={10} gap={2}>
    <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
      <WorkOff sx={{ fontSize: 36, color: "#9fa8da" }} />
    </Avatar>
    <Typography variant="h6" fontWeight={700} color="text.secondary">No jobs found</Typography>
    <Typography fontSize={14} color="text.disabled" textAlign="center" maxWidth={320}>
      No jobs have been posted yet. Click "Post New Job" to add the first one.
    </Typography>
    <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ mt: 1 }}>
      Post New Job
    </Button>
  </Box>
);

// ── Detail Row helper ─────────────────────────────────────────────────────────
const DetailRow = ({ label, value }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center"
    sx={{ py: 1, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}>
    <Typography fontSize={13} color="text.secondary">{label}</Typography>
    <Typography fontSize={13} fontWeight={600} color="text.primary" textAlign="right">
      {value ?? "—"}
    </Typography>
  </Box>
);

// ── Clickable Client Name chip ────────────────────────────────────────────────
// Navigates to /clients filtered by this client when clicked
const ClientLink = ({ name, clientId, onClick }) => (
  <Box
    display="flex" alignItems="center" gap={0.6}
    onClick={onClick}
    sx={{
      cursor: "pointer",
      color: "#0277bd",
      fontWeight: 600,
      fontSize: 12,
      width: "fit-content",
      px: 0.8,
      py: 0.3,
      borderRadius: 1,
      transition: "all 0.15s",
      "&:hover": {
        bgcolor: "#e3f2fd",
        color: "#01579b",
        textDecoration: "underline",
      },
    }}
  >
    <Business sx={{ fontSize: 13, flexShrink: 0 }} />
    {name || "—"}
  </Box>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function Jobs() {
  const navigate = useNavigate();

  const [jobs,      setJobs]      = useState([]);
  const [clients,   setClients]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");
  const [statusF,   setStatusF]   = useState("");
  const [priorityF, setPriorityF] = useState("");
  const [clientF,   setClientF]   = useState("");   // ← new: filter by client

  const [formOpen,   setFormOpen]   = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await getAllJobs();
      setJobs(res.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load jobs. Please check your connection.");
      setJobs([]);
    } finally { setLoading(false); }
  }, []);

  const loadClients = useCallback(async () => {
    try { const res = await getAllClients(); setClients(res.data || []); }
    catch { setClients([]); }
  }, []);

  useEffect(() => { load(); loadClients(); }, [load, loadClients]);

  // ── Filtered view — now includes clientF ──────────────────────────────────
  const filtered = jobs.filter(j => {
    const q      = search.toLowerCase();
    const matchQ = !q ||
      j.title?.toLowerCase().includes(q)          ||
      j.client_name?.toLowerCase().includes(q)    ||
      j.job_id?.toLowerCase().includes(q)         ||
      j.location?.toLowerCase().includes(q)       ||
      j.posted_by_name?.toLowerCase().includes(q);
    const matchS = !statusF   || j.status   === statusF;
    const matchP = !priorityF || j.priority === priorityF;
    const matchC = !clientF   || j.client_id === clientF;   // ← client filter
    return matchQ && matchS && matchP && matchC;
  });

  const stats = {
    total:        jobs.length,
    open:         jobs.filter(j => j.status === "Open").length,
    critical:     jobs.filter(j => j.priority === "Critical").length,
    applications: jobs.reduce((s, j) => s + (j.applications || 0), 0),
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
  const openEdit   = j  => {
    setSelected(j);
    setFormData({ ...EMPTY_FORM, ...j,
      skills: Array.isArray(j.skills) ? j.skills.join(", ") : (j.skills || "") });
    setFormOpen(true);
  };
  const openDetail = j  => { setSelected(j); setDetailOpen(true); };
  const openDelete = j  => { setSelected(j); setDeleteOpen(true); };

  // ── Click client name → navigate to /clients filtered by client_id ────────
  const handleClientClick = (clientId) => {
    navigate(`/clients?highlight=${clientId}`);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === "client_id") {
      const client = clients.find(c => c._id === value);
      setFormData(p => ({ ...p, client_id: value, client_name: client?.company_name || "" }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        ...formData,
        skills:         formData.skills
          ? formData.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        openings:       Number(formData.openings),
        experience_min: Number(formData.experience_min),
        experience_max: Number(formData.experience_max),
        salary_min:     formData.salary_min ? Number(formData.salary_min) : 0,
        salary_max:     formData.salary_max ? Number(formData.salary_max) : 0,
      };
      selected ? await updateJob(selected._id, payload) : await createJob(payload);
      setFormOpen(false); load();
    } catch (err) { setError(err?.message || "Save failed"); }
    finally { setSaving(false); }
  };
  const calcDaysOpen = (deadline) => {
    if (!deadline) return "—";
    const due   = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff  = Math.floor((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };
  const handleDelete = async () => {
    try { await deleteJob(selected._id); setDeleteOpen(false); load(); }
    catch (err) { setError(err?.message || "Delete failed"); }
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

      {/* ── Page header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" color="primary.dark">Job Management</Typography>
          <Typography color="text.secondary" mt={0.5}>
            Track open positions, manage requirements and monitor applications
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">
          Post New Job
        </Button>
      </Box>

      {/* ── Stat cards ── */}
      <Grid container spacing={2.5}>
        <Grid item xs={6} md={3}>
          <StatCard title="Total Jobs"   value={stats.total}        icon={<Work />}          color="#1a237e" sub="All time" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Open Jobs"    value={stats.open}         icon={<AccessTime />}    color="#0277bd" sub="Currently active" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Critical"     value={stats.critical}     icon={<ReportProblem />} color="#c62828" sub="Need immediate action" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Applications" value={stats.applications} icon={<TrendingUp />}    color="#2e7d32" sub="Total received" />
        </Grid>
      </Grid>

      {/* ── Pipeline bar ── */}
      {jobs.length > 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Jobs by Status</Typography>
            <Grid container spacing={3}>
              {STATUSES.map(s => {
                const count = jobs.filter(j => j.status === s).length;
                const pct   = jobs.length ? (count / jobs.length) * 100 : 0;
                return (
                  <Grid item xs={6} md={3} key={s}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography fontSize={13} fontWeight={600}>{s}</Typography>
                      <Typography fontSize={13} color="text.secondary">{count}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                      color={STATUS_COLOR[s] || "inherit"}
                      sx={{ height: 8, borderRadius: 4 }} />
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ── Filters — now includes Client dropdown ── */}
      {jobs.length > 0 && (
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            placeholder="Search by title, client, location, posted by…"
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
          {/* ── Client filter ── */}
          <TextField select value={clientF} onChange={e => setClientF(e.target.value)}
            size="small" sx={{ minWidth: 180 }} label="Client">
            <MenuItem value="">All Clients</MenuItem>
            {clients.map(c => (
              <MenuItem key={c._id} value={c._id}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Business fontSize="small" sx={{ color: "#0277bd" }} />
                  {c.company_name}
                </Box>
              </MenuItem>
            ))}
          </TextField>
          <TextField select value={statusF} onChange={e => setStatusF(e.target.value)}
            size="small" sx={{ minWidth: 140 }} label="Status">
            <MenuItem value="">All Statuses</MenuItem>
            {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select value={priorityF} onChange={e => setPriorityF(e.target.value)}
            size="small" sx={{ minWidth: 140 }} label="Priority">
            <MenuItem value="">All Priorities</MenuItem>
            {PRIORITIES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
        </Box>
      )}

      {/* ── Table or Empty state ── */}
      {jobs.length === 0 && !error ? (
        <Card><EmptyState onAdd={openCreate} /></Card>
      ) : (
        <Card>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f7fa" }}>
                  {["Job ID", "Position", "Client", "Type / Mode", "Experience",
                    "Salary", "Openings", "Days Open", "Posted By", "Priority", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No jobs match your current filters
                    </TableCell>
                  </TableRow>
                ) : filtered.map(j => (
                  <TableRow key={j._id} hover>
                    <TableCell sx={{ fontWeight: 700, color: "#0277bd", fontSize: 12 }}>
                      {j.job_id}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600} fontSize={13}>{j.title}</Typography>
                      <Typography fontSize={11} color="text.secondary">{j.location}</Typography>
                    </TableCell>

                    {/* ── Client column — clickable link ── */}
                    <TableCell>
                      <ClientLink
                        name={j.client_name}
                        clientId={j.client_id}
                        onClick={() => handleClientClick(j.client_id)}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography fontSize={12}>{j.job_type}</Typography>
                      <Typography fontSize={11} color="text.secondary">{j.work_mode}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      {j.experience_min}–{j.experience_max} yrs
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      {formatSalary(j.salary_min)} – {formatSalary(j.salary_max)}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography fontSize={13} fontWeight={600}>{j.filled || 0}</Typography>
                        <Typography fontSize={11} color="text.secondary">/ {j.openings}</Typography>
                      </Box>
                      <LinearProgress variant="determinate"
                        value={j.openings ? ((j.filled || 0) / j.openings) * 100 : 0}
                        sx={{ height: 4, borderRadius: 2, mt: 0.5, bgcolor: "#e0e0e0",
                              "& .MuiLinearProgress-bar": { bgcolor: "#2e7d32" } }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      {j.deadline ? (
                        <Box>
                          <Typography fontSize={13} fontWeight={600}
                            color={calcDaysOpen(j.deadline) < 0 ? "error.main" :
                                  calcDaysOpen(j.deadline) <= 7 ? "warning.main" : "text.primary"}>
                            {calcDaysOpen(j.deadline) < 0
                              ? `${Math.abs(calcDaysOpen(j.deadline))} days overdue`
                              : `${calcDaysOpen(j.deadline)} days left`}
                          </Typography>
                          <Typography fontSize={11} color="text.secondary">
                            Due {new Date(j.deadline).toLocaleDateString("en-IN")}
                          </Typography>
                        </Box>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 26, height: 26, fontSize: 10, fontWeight: 700,
                          bgcolor: "#e8eaf6", color: "#1a237e" }}>
                          {nameInitials(j.posted_by_name)}
                        </Avatar>
                        <Typography fontSize={12} fontWeight={500}>
                          {j.posted_by_name || "—"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={j.priority} color={PRIORITY_COLOR[j.priority] || "default"}
                        size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={j.status} color={STATUS_COLOR[j.status] || "default"}
                        size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => openDetail(j)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(j)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => openDelete(j)}>
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

      {/* ── Detail Dialog ── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 2 }}>
          Job Details
        </DialogTitle>

        {selected && (
          <DialogContent sx={{ pt: 3, pb: 1 }}>
            <Box display="flex" alignItems="center" gap={2.5} mb={3}
              pb={3} sx={{ borderBottom: "1px solid #e0e0e0" }}>
              <Avatar sx={{ width: 72, height: 72, borderRadius: 3,
                background: "linear-gradient(135deg, #00acc1, #0277bd)", flexShrink: 0 }}>
                <Work sx={{ fontSize: 32, color: "#fff" }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800} color="text.primary" lineHeight={1.2}>
                  {selected.title}
                </Typography>
                {/* ── Client name as clickable link in detail dialog ── */}
                <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                  <ClientLink
                    name={selected.client_name}
                    clientId={selected.client_id}
                    onClick={() => { setDetailOpen(false); handleClientClick(selected.client_id); }}
                  />
                  {selected.location && (
                    <Typography color="text.secondary" fontSize={13}>
                      · {selected.location}
                    </Typography>
                  )}
                </Box>
                <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                  <Chip label={selected.status}
                    color={STATUS_COLOR[selected.status] || "default"}
                    size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                  <Chip label={`${selected.priority} Priority`}
                    color={PRIORITY_COLOR[selected.priority] || "default"}
                    size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                </Box>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography fontSize={11} fontWeight={700} color="text.secondary"
                  textTransform="uppercase" letterSpacing={0.8} mb={1.5}>
                  Job Information
                </Typography>
                <DetailRow label="Job ID"     value={selected.job_id}    />
                <DetailRow label="Department" value={selected.department} />
                <DetailRow label="Job Type"   value={selected.job_type}  />
                <DetailRow label="Days Open"  value={`${calcDaysOpen(selected.created_at)} days`} />
                <DetailRow label="Deadline"
                  value={selected.deadline
                    ? new Date(selected.deadline).toLocaleDateString("en-IN") : "—"} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography fontSize={11} fontWeight={700} color="text.secondary"
                  textTransform="uppercase" letterSpacing={0.8} mb={1.5}>
                  Requirements &amp; Compensation
                </Typography>
                <DetailRow label="Experience"
                  value={`${selected.experience_min}–${selected.experience_max} years`} />
                <DetailRow label="Salary Range"
                  value={`${formatSalary(selected.salary_min)} – ${formatSalary(selected.salary_max)}`} />
                <DetailRow label="Openings"
                  value={`${selected.filled || 0} / ${selected.openings} filled`} />
                <DetailRow label="Applicants"
                  value={selected.applications ?? selected.applicants ?? 0} />
              </Grid>
            </Grid>

            {selected.skills?.length > 0 && (
              <Box mt={2.5}>
                <Typography fontSize={11} color="text.secondary" fontWeight={700}
                  textTransform="uppercase" letterSpacing={0.8} mb={1}>
                  Required Skills
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.8}>
                  {(Array.isArray(selected.skills)
                    ? selected.skills
                    : selected.skills.split(",")
                  ).map((s, i) => (
                    <Chip key={i} label={s.trim()} size="small" variant="outlined"
                      sx={{ fontSize: 11, borderColor: "#0277bd", color: "#0277bd" }} />
                  ))}
                </Box>
              </Box>
            )}

            {selected.description && (
              <Box mt={2.5} p={2} bgcolor="#f5f7fa" borderRadius={2}
                border="1px solid #e0e0e0">
                <Typography fontSize={11} color="text.secondary" fontWeight={700}
                  textTransform="uppercase" letterSpacing={0.8} mb={1}>
                  Job Description
                </Typography>
     
                  <Typography fontSize={13} lineHeight={1.8}
                    sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {selected.description}
                  </Typography>
       
              </Box>
            )}

            {selected.notes && (
              <Box mt={2} p={1.5} bgcolor="#fff8e1" borderRadius={2}
                border="1px solid #ffe082">
                <Typography fontSize={11} color="text.secondary" fontWeight={700}
                  textTransform="uppercase" mb={0.5}>
                  Internal Notes
                </Typography>
                <Typography fontSize={13}>{selected.notes}</Typography>
              </Box>
            )}
          </DialogContent>
        )}

        <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #e0e0e0",
          justifyContent: "flex-start", gap: 1.5 }}>
          <Button variant="outlined"
            onClick={() => { setDetailOpen(false); navigate(`/resumes?job=${selected._id}`); }}
            sx={{ textTransform: "none", fontWeight: 600 }}>
            View Candidates
          </Button>
          <Button variant="outlined"
            onClick={() => { setDetailOpen(false); navigate(`/tracking?job=${selected._id}`); }}
            sx={{ textTransform: "none", fontWeight: 600 }}>
            Track Progress
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained"
            onClick={() => { setDetailOpen(false); openEdit(selected); }}
            sx={{ textTransform: "none", fontWeight: 700 }}>
            Edit Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <span>{selected ? "Edit Job" : "Post New Job"}</span>
            {!selected && (
              <Box display="flex" alignItems="center" gap={1}
                sx={{ bgcolor: "#e8eaf6", px: 1.5, py: 0.6, borderRadius: 2 }}>
                <Person sx={{ fontSize: 16, color: "#1a237e" }} />
                <Typography fontSize={12} fontWeight={600} color="primary.dark">
                  Posting as: {getCurrentUserName()}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
              Basic Information
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={4}>
                <TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Job ID" name="job_id"
                  value={formData.job_id} onChange={handleChange}
                  placeholder="e.g. JOB007" disabled={!!selected} />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Job Title" name="title"
                  value={formData.title} onChange={handleChange}
                  placeholder="e.g. Senior React Developer" />
              </Grid>

              {/* ── Client dropdown — shows company name, stores _id + name ── */}
              <Grid item xs={12} sm={6}>
                <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" required label="Client"
                  name="client_id" value={formData.client_id} onChange={handleChange}>
                  <MenuItem value="">Select Client</MenuItem>
                  {clients.map(c => (
                    <MenuItem key={c._id} value={c._id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Business fontSize="small" sx={{ color: "#0277bd" }} />
                        {c.company_name}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={formData.client_name ? 12 : 6}>
                <TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Location " name="location"
                  value={formData.location} onChange={handleChange} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Priority" name="priority"
                  value={formData.priority} onChange={handleChange}>
                  {PRIORITIES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Status" name="status"
                  value={formData.status} onChange={handleChange}>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Job Type" name="job_type"
                  value={formData.job_type} onChange={handleChange}>
                  {JOB_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Work Mode" name="work_mode"
                  value={formData.work_mode} onChange={handleChange}>
                  {WORK_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
              Requirements
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={6} sm={3}>
                <TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Openings" name="openings"
                  value={formData.openings} onChange={handleChange} inputProps={{ min: 1 }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Min Exp (yrs)"
                  name="experience_min" value={formData.experience_min} onChange={handleChange}
                  inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Max Exp (yrs)"
                  name="experience_max" value={formData.experience_max} onChange={handleChange}
                  inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="date" label="Deadline"
                  name="deadline" value={formData.deadline} onChange={handleChange}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Min Salary (₹)"
                  name="salary_min" value={formData.salary_min} onChange={handleChange}
                  placeholder="e.g. 1200000" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Max Salary (₹)"
                  name="salary_max" value={formData.salary_max} onChange={handleChange}
                  placeholder="e.g. 1800000" />
              </Grid>
              <Grid item xs={12}>
                <TextField  sx={{ width: "100%", minWidth: 820 }} multiline rows={4}  size="small" label="Required Skills (comma-separated)"
                  name="skills" value={formData.skills} onChange={handleChange}
                  placeholder="e.g. React, Node.js, MongoDB, REST APIs" />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>
              Description &amp; Notes
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField sx={{ width: "100%", minWidth: 820 }} multiline rows={14} size="small" label="Job Description"
                  name="description" value={formData.description} onChange={handleChange}
                  placeholder="Describe responsibilities, requirements and expectations…" />
              </Grid>
              <Grid item xs={12}>
                <TextField sx={{ width: "100%", minWidth: 820 }} multiline rows={4} size="small" label="Internal Notes"
                  name="notes" value={formData.notes} onChange={handleChange}
                  placeholder="Internal notes (not visible to candidates)…" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              {selected ? "Update Job" : "Post Job"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete Job</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selected?.title}</strong>?
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









