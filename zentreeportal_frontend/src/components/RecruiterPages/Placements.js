

import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  InputAdornment, Divider, Badge, Tab, Tabs,
} from "@mui/material";
import {
  Add, Search, Edit, Visibility, CheckCircle,
  AttachMoney, CreditCard, HourglassEmpty, WorkspacePremium,
  SyncAlt, PersonAdd, FilterList,
} from "@mui/icons-material";

// ── Shared candidate detail panel ─────────────────────────────────────────────
import CandidateDetailContent, { nameInitials, fmtSalary } from "./Candidatedetailcontent";

// ── API helpers ───────────────────────────────────────────────────────────────
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

const getAllPlacements    = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE}/placements/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
};
const createPlacement    = (payload) =>
  fetch(`${BASE}/placements/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
const updatePlacement    = (id, payload) =>
  fetch(`${BASE}/placements/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
const getAllClients       = () =>
  fetch(`${BASE}/clients/`, { headers: getHeaders() }).then(handle);
const getAllJobs          = () =>
  fetch(`${BASE}/jobs/`, { headers: getHeaders() }).then(handle);
const getPendingTracking  = () =>
  fetch(`${BASE}/placements/pending-from-tracking`, { headers: getHeaders() }).then(handle);
const getAllRecruiters    = () =>
  fetch(`${BASE}/user/`, { headers: getHeaders() }).then(handle);
// Look up a resume by resume_id via the search endpoint
const getResumeByResumeId = (resume_id) =>
  fetch(`${BASE}/resumes/?q=${encodeURIComponent(resume_id.trim())}`, { headers: getHeaders() }).then(handle);

// ── Constants ─────────────────────────────────────────────────────────────────
const PAYMENT_STATUSES   = ["Pending", "Partial", "Paid", "Overdue"];
const CANDIDATE_STATUSES = ["Active", "Probation", "Confirmed", "Resigned", "Terminated"];
const PAYMENT_COLOR      = { Paid: "success", Pending: "warning", Partial: "info", Overdue: "error" };
const CANDIDATE_COLOR    = { Active: "success", Probation: "info", Confirmed: "primary", Resigned: "default", Terminated: "error" };

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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Placements() {
  const [placements,   setPlacements]   = useState([]);
  const [pendingJoins, setPendingJoins] = useState([]);
  const [clients,      setClients]      = useState([]);
  const [jobs,         setJobs]         = useState([]);
  const [recruiters,   setRecruiters]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [pendingLoad,  setPendingLoad]  = useState(false);
  const [error,        setError]        = useState("");
  const [activeTab,    setActiveTab]    = useState(0);

  // Filters
  const [search,   setSearch]   = useState("");
  const [statusF,  setStatusF]  = useState("");
  const [paymentF, setPaymentF] = useState("");
  const [clientF,  setClientF]  = useState("");
  const [jobIdF,   setJobIdF]   = useState("");

  // Detail dialog state
  const [detailOpen,        setDetailOpen]        = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [detailResume,      setDetailResume]      = useState(null);
  const [detailLoading,     setDetailLoading]     = useState(false);

  // Add/Edit dialog state
  const [formOpen,  setFormOpen]  = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [formData,  setFormData]  = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  // ── Loaders ────────────────────────────────────────────────────────────────
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

  const loadPending = useCallback(async () => {
    try { setPendingLoad(true); const res = await getPendingTracking(); setPendingJoins(res.data || []); }
    catch { setPendingJoins([]); }
    finally { setPendingLoad(false); }
  }, []);

  const loadClients = useCallback(async () => {
    try { const res = await getAllClients(); setClients(res.data || []); } catch { setClients([]); }
  }, []);

  const loadJobs = useCallback(async () => {
    try { const res = await getAllJobs(); setJobs(res.data || []); } catch { setJobs([]); }
  }, []);

  const loadRecruiters = useCallback(async () => {
    try { const res = await getAllRecruiters(); setRecruiters((res.data || []).filter(u => u.role === "recruiter")); }
    catch { setRecruiters([]); }
  }, []);

  useEffect(() => {
    load(); loadPending(); loadClients(); loadJobs(); loadRecruiters();
  }, [load, loadPending, loadClients, loadJobs, loadRecruiters]);

  // ── Filtered views ─────────────────────────────────────────────────────────
  const filtered = placements.filter(p => {
    const q  = search.toLowerCase();
    const mQ = !q       || p.candidate_name?.toLowerCase().includes(q)
                        || p.job_title?.toLowerCase().includes(q)
                        || p.placement_id?.toLowerCase().includes(q);
    const mS = !statusF  || p.candidate_status === statusF;
    const mP = !paymentF || p.payment_status   === paymentF;
    const mC = !clientF  || p.client_name      === clientF;
    const mJ = !jobIdF   || p.job_id?.toLowerCase().includes(jobIdF.toLowerCase());
    return mQ && mS && mP && mC && mJ;
  });

  const filteredPending = pendingJoins.filter(p => {
    const q  = search.toLowerCase();
    const mQ = !q      || p.candidate_name?.toLowerCase().includes(q) || p.job_title?.toLowerCase().includes(q);
    const mC = !clientF || p.client_name === clientF;
    const mJ = !jobIdF  || p.job_id?.toLowerCase().includes(jobIdF.toLowerCase());
    return mQ && mC && mJ;
  });

  const totalBilling   = placements.reduce((s, p) => s + (p.billing_amount || 0), 0);
  const paidBilling    = placements.filter(p => p.payment_status === "Paid").reduce((s, p) => s + (p.billing_amount || 0), 0);
  const pendingBilling = placements.filter(p => p.payment_status !== "Paid").reduce((s, p) => s + (p.billing_amount || 0), 0);

  // ── Detail — fetch resume from Resume Bank so we can show full candidate view
  const openDetail = async (placement) => {
    setSelectedPlacement(placement);
    setDetailResume(null);
    setDetailOpen(true);
    if (!placement.resume_id) return;
    try {
      setDetailLoading(true);
      const res   = await getResumeByResumeId(placement.resume_id);
      const match = (res.data || []).find(
        r => r.resume_id?.trim().toLowerCase() === placement.resume_id.trim().toLowerCase()
      );
      setDetailResume(match || null);
    } catch { setDetailResume(null); }
    finally { setDetailLoading(false); }
  };

  const openEdit = (p) => {
    setSelected(p);
    setFormData({
      ...EMPTY_FORM, ...p,
      offer_date:         p.offer_date?.split("T")[0]   || "",
      joining_date:       p.joining_date?.split("T")[0] || "",
      billing_percentage: p.billing_percentage ?? "8.33",
      payment_status:     p.payment_status     || "Pending",
      candidate_status:   p.candidate_status   || "Active",
      guarantee_period:   p.guarantee_period   ?? 90,
    });
    setFormOpen(true);
  };

  const openConvert = (trackingDoc) => {
    setSelected(null);
    setFormData({
      ...EMPTY_FORM,
      resume_id:      trackingDoc.resume_id      || "",
      candidate_name: trackingDoc.candidate_name || "",
      job_id:         trackingDoc.job_id         || "",
      client_name:    trackingDoc.client_name    || "",
      job_title:      trackingDoc.job_title      || "",
      recruiter:      trackingDoc.recruiter      || "",
      joining_date:   trackingDoc.joining_date?.split("T")[0] || "",
    });
    setFormOpen(true);
  };

  const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };

  const handleChange = (e) => {
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
      if (selected && selected._id && placements.find(p => p._id === selected._id)) {
        await updatePlacement(selected._id, payload);
      } else {
        await createPlacement(payload);
      }
      setFormOpen(false); load(); loadPending();
    } catch (err) { setError(err?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  if (loading)
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={48} /></Box>;

  const FilterBar = () => (
    <Box display="flex" gap={2} flexWrap="wrap">
      <TextField placeholder="Search by name, title, or ID…" value={search}
        onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
      <TextField placeholder="Job ID…" value={jobIdF} onChange={e => setJobIdF(e.target.value)}
        size="small" sx={{ minWidth: 140 }} label="Job ID"
        InputProps={{ startAdornment: <InputAdornment position="start"><FilterList fontSize="small" color="action" /></InputAdornment> }} />
      <TextField select value={clientF} onChange={e => setClientF(e.target.value)} size="small" sx={{ minWidth: 180 }} label="Client">
        <MenuItem value="">All Clients</MenuItem>
        {clients.map(c => <MenuItem key={c._id} value={c.company_name}>{c.company_name}</MenuItem>)}
      </TextField>
      {activeTab === 0 && (
        <>
          <TextField select value={statusF} onChange={e => setStatusF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Status">
            <MenuItem value="">All Statuses</MenuItem>
            {CANDIDATE_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select value={paymentF} onChange={e => setPaymentF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Payment">
            <MenuItem value="">All Payments</MenuItem>
            {PAYMENT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </>
      )}
    </Box>
  );

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" color="primary.dark">Placements</Typography>
          <Typography color="text.secondary" mt={0.5}>Track successful hires and manage billing</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">Add Placement</Button>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={6} md={3}><StatCard title="Total Placements" value={placements.length}   icon={<CheckCircle />}    color="#2e7d32" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Total Revenue"    value={fmt(totalBilling)}   icon={<AttachMoney />}    color="#1a237e" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Collected"        value={fmt(paidBilling)}    icon={<CreditCard />}     color="#0277bd" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Pending"          value={fmt(pendingBilling)} icon={<HourglassEmpty />} color="#e65100" /></Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Placements" icon={<CheckCircle fontSize="small" />} iconPosition="start" />
          <Tab
            label={
              <Badge badgeContent={pendingJoins.length} color="warning" max={99}>
                <Box sx={{ pr: pendingJoins.length > 0 ? 1.5 : 0 }}>Pending from Tracking</Box>
              </Badge>
            }
            icon={<SyncAlt fontSize="small" />} iconPosition="start"
          />
        </Tabs>
      </Box>

      <FilterBar />

      {/* ════ TAB 0 ════════════════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        placements.length === 0 && !error ? (
          <Card>
            <Box display="flex" flexDirection="column" alignItems="center" py={10} gap={2}>
              <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
                <WorkspacePremium sx={{ fontSize: 36, color: "#9fa8da" }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary">No placements yet</Typography>
              <Typography fontSize={14} color="text.disabled">Click "Add Placement" to record a successful hire.</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ mt: 1 }}>Add Placement</Button>
            </Box>
          </Card>
        ) : (
          <Card>
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f7fa" }}>
                    {["ID", "Candidate", "Position", "Client", "Job ID", "Joining", "Salary", "Billing", "Payment", "Status", "Actions"].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 6, color: "text.secondary" }}>No placements match your filters</TableCell>
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
                      <TableCell sx={{ fontSize: 12, fontFamily: "monospace", color: "#546e7a" }}>{p.job_id || "—"}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {p.joining_date ? new Date(p.joining_date).toLocaleDateString("en-IN") : "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{fmt(p.final_ctc)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{fmt(p.billing_amount)}</TableCell>
                      <TableCell>
                        <Chip label={p.payment_status} color={PAYMENT_COLOR[p.payment_status] || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={p.candidate_status} color={CANDIDATE_COLOR[p.candidate_status] || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="View full candidate details">
                            <IconButton size="small" onClick={() => openDetail(p)}><Visibility fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Edit placement">
                            <IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Card>
        )
      )}

      {/* ════ TAB 1 ════════════════════════════════════════════════════════════ */}
      {activeTab === 1 && (
        pendingLoad ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : pendingJoins.length === 0 ? (
          <Card>
            <Box display="flex" flexDirection="column" alignItems="center" py={10} gap={2}>
              <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8f5e9" }}>
                <CheckCircle sx={{ fontSize: 36, color: "#4caf50" }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary">All joined candidates have placements!</Typography>
            </Box>
          </Card>
        ) : (
          <Card>
            <Box px={2} py={1.5} bgcolor="#fff8e1" borderBottom="1px solid #ffe082" display="flex" alignItems="center" gap={1}>
              <SyncAlt fontSize="small" sx={{ color: "#f9a825" }} />
              <Typography fontSize={13} color="#6d4c00">
                These candidates reached <strong>"Joined"</strong> in tracking but have no placement record yet.
                Click <strong>Convert to Placement</strong> to add billing details.
              </Typography>
            </Box>
            <Paper variant="outlined" sx={{ borderRadius: 0, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#fffde7" }}>
                    {["Candidate", "Position", "Client", "Job ID", "Recruiter", "Joining Date", "Actions"].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>No pending records match your filters</TableCell>
                    </TableRow>
                  ) : filteredPending.map(t => (
                    <TableRow key={t._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 700, bgcolor: "#f57c00" }}>
                            {nameInitials(t.candidate_name)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600} fontSize={13}>{t.candidate_name}</Typography>
                            <Typography fontSize={11} color="text.secondary">{t.resume_id}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{t.job_title || "—"}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{t.client_name || "—"}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: "monospace", color: "#546e7a" }}>{t.job_id || "—"}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{t.recruiter || "—"}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {t.joining_date ? new Date(t.joining_date).toLocaleDateString("en-IN") : "—"}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Pre-fills candidate data — you only add billing info">
                          <Button size="small" variant="outlined" color="warning"
                            startIcon={<PersonAdd fontSize="small" />} onClick={() => openConvert(t)}
                            sx={{ textTransform: "none", fontWeight: 700, fontSize: 12 }}>
                            Convert to Placement
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Card>
        )
      )}

      {/* ════ Detail Dialog ════════════════════════════════════════════════════
          Shows full CandidateDetailContent (Profile / Pipeline / Billing tabs)
          when the resume exists in Resume Bank; falls back to billing-only view.
          ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { minHeight: "70vh" } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          Candidate &amp; Placement Details
        </DialogTitle>

        {detailLoading && (
          <Box display="flex" justifyContent="center" alignItems="center" py={10}>
            <CircularProgress />
          </Box>
        )}

        {!detailLoading && selectedPlacement && detailResume && (
          // ── Full 3-tab view ────────────────────────────────────────────────
          <CandidateDetailContent
            candidate={detailResume}
            jobs={jobs}
            recruiters={recruiters}
            onClose={() => setDetailOpen(false)}
            onEdit={() => setDetailOpen(false)}   // navigate to Resumes page if needed
            onViewPdf={() => {}}                  // add PDF viewer wiring if desired
            placementData={selectedPlacement}
            onEditPlacement={() => { setDetailOpen(false); openEdit(selectedPlacement); }}
          />
        )}

        {!detailLoading && selectedPlacement && !detailResume && (
          // ── Fallback: no resume in DB — show billing-only info ─────────────
          <>
            <DialogContent sx={{ pt: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                No resume record found for <strong>{selectedPlacement.candidate_name}</strong> ({selectedPlacement.resume_id}).
                Add the candidate to the Resume Bank to see full profile and pipeline details.
              </Alert>
              <Box display="flex" alignItems="center" gap={2.5} mb={3} pb={3} sx={{ borderBottom: "1px solid #e0e0e0" }}>
                <Avatar sx={{
                  width: 72, height: 72, borderRadius: 3,
                  background: "linear-gradient(135deg, #1976d2, #1a237e)",
                  fontSize: "2rem", fontWeight: 800, color: "#fff",
                }}>
                  {nameInitials(selectedPlacement.candidate_name)}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800}>{selectedPlacement.candidate_name}</Typography>
                  <Typography color="text.secondary" fontSize={14} mt={0.5}>
                    {selectedPlacement.job_title}{selectedPlacement.client_name ? ` at ${selectedPlacement.client_name}` : ""}
                  </Typography>
                  <Typography fontSize={12} color="text.disabled" mt={0.25}>
                    Job ID: <strong>{selectedPlacement.job_id}</strong> · Placement: <strong>{selectedPlacement.placement_id}</strong>
                  </Typography>
                </Box>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} mb={1.5}>Employment</Typography>
                  {[
                    ["Recruiter",     selectedPlacement.recruiter],
                    ["Joining Date",  selectedPlacement.joining_date ? new Date(selectedPlacement.joining_date).toLocaleDateString("en-IN") : "—"],
                    ["Annual Salary", fmt(selectedPlacement.final_ctc)],
                  ].map(([label, val]) => (
                    <Box key={label} display="flex" justifyContent="space-between" sx={{ py: 1, borderBottom: "1px solid #f0f0f0" }}>
                      <Typography fontSize={13} color="text.secondary">{label}</Typography>
                      <Typography fontSize={13} fontWeight={600}>{val ?? "—"}</Typography>
                    </Box>
                  ))}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} mb={1.5}>Billing</Typography>
                  {[
                    ["Billing Rate",     `${selectedPlacement.billing_percentage || 0}%`],
                    ["Billing Amount",   fmt(selectedPlacement.billing_amount)],
                    ["Payment Status",   selectedPlacement.payment_status],
                    ["Guarantee Period", `${selectedPlacement.guarantee_period || 0} days`],
                  ].map(([label, val]) => (
                    <Box key={label} display="flex" justifyContent="space-between" sx={{ py: 1, borderBottom: "1px solid #f0f0f0" }}>
                      <Typography fontSize={13} color="text.secondary">{label}</Typography>
                      <Typography fontSize={13} fontWeight={600}>{val ?? "—"}</Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #e0e0e0" }}>
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
              <Button variant="contained" startIcon={<Edit />}
                onClick={() => { setDetailOpen(false); openEdit(selectedPlacement); }}>
                Edit Placement
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ════ Add / Edit / Convert Dialog ══════════════════════════════════════ */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          {selected ? "Edit Placement" : "Add New Placement"}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Candidate Details</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Candidate Name"
                  name="candidate_name" value={formData.candidate_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Resume ID"
                  name="resume_id" value={formData.resume_id} onChange={handleChange} placeholder="e.g. RES001" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Job Title"
                  name="job_title" value={formData.job_title} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Job ID"
                  name="job_id" value={formData.job_id} onChange={handleChange} placeholder="e.g. JOB001" />
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Client &amp; Recruiter</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" required label="Client"
                  name="client_name" value={formData.client_name} onChange={handleChange}>
                  <MenuItem value="">Select Client</MenuItem>
                  {clients.map(c => <MenuItem key={c._id} value={c.company_name}>{c.company_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Recruiter"
                  name="recruiter" value={formData.recruiter} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="date" label="Offer Date"
                  name="offer_date" value={formData.offer_date} onChange={handleChange}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required type="date" label="Joining Date"
                  name="joining_date" value={formData.joining_date} onChange={handleChange}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Compensation &amp; Billing</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" required type="number" label="Annual CTC (₹)"
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