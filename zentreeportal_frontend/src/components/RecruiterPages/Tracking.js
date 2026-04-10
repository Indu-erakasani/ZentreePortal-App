// src/pages/Tracking.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  InputAdornment, Divider, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import {
  Add, Search, Edit, Chat, ViewKanban, ViewList,
  CalendarMonth, Work, AccountTree,
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

// ── GET /api/tracking/?stage=&status=&job_id=&q= ─────────────────────────────
const getAllTracking = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE}/tracking/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
};

// ── GET /api/tracking/:id ─────────────────────────────────────────────────────
const getOneTracking = (id) =>
  fetch(`${BASE}/tracking/${id}`, { headers: getHeaders() }).then(handle);
// ── POST /api/tracking/ ───────────────────────────────────────────────────────
const createTracking = (payload) =>
  fetch(`${BASE}/tracking/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// ── PUT /api/tracking/:id ─────────────────────────────────────────────────────
const updateTracking = (id, payload) =>
  fetch(`${BASE}/tracking/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// ── DELETE /api/tracking/:id ──────────────────────────────────────────────────
const deleteTracking = (id) =>
  fetch(`${BASE}/tracking/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
// ── POST /api/tracking/:id/interview ─────────────────────────────────────────
const addInterview = (id, payload) =>
  fetch(`${BASE}/tracking/${id}/interview`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// ── GET /api/jobs/ (for dropdown) ────────────────────────────────────────────
const getAllJobs = () =>
  fetch(`${BASE}/jobs/`, { headers: getHeaders() }).then(handle);
// ─────────────────────────────────────────────────────────────────────────────

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGES = [
  { id: "Screening",         label: "Screening",         color: "#757575", bg: "#f5f5f5"  },
  { id: "Technical Round 1", label: "Technical Rd 1",    color: "#0277bd", bg: "#e3f2fd"  },
  { id: "Technical Round 2", label: "Technical Rd 2",    color: "#01579b", bg: "#e1f5fe"  },
  { id: "HR Round",          label: "HR Round",           color: "#e65100", bg: "#fff3e0"  },
  { id: "Manager Round",     label: "Manager Round",      color: "#6a1b9a", bg: "#f3e5f5"  },
  { id: "Final Round",       label: "Final Round",        color: "#ad1457", bg: "#fce4ec"  },
  { id: "Offer Stage",       label: "Offer Stage",        color: "#1565c0", bg: "#e8eaf6"  },
  { id: "Negotiation",       label: "Negotiation",        color: "#f9a825", bg: "#fffde7"  },
  { id: "Offer Accepted",    label: "Offer Accepted",     color: "#2e7d32", bg: "#e8f5e9"  },
  { id: "Offer Declined",    label: "Offer Declined",     color: "#c62828", bg: "#ffebee"  },
  { id: "Joined",            label: "Joined",             color: "#1b5e20", bg: "#c8e6c9"  },
  { id: "Rejected",          label: "Rejected",           color: "#4e342e", bg: "#efebe9"  },
  { id: "Withdrawn",         label: "Withdrawn",          color: "#37474f", bg: "#eceff1"  },
];
const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s]));

// Kanban only shows active pipeline stages
const KANBAN_STAGES = STAGES.filter(s =>
  ["Screening","Technical Round 1","Technical Round 2","HR Round",
   "Manager Round","Final Round","Offer Stage","Negotiation","Offer Accepted","Joined"].includes(s.id)
);

const PIPELINE_STATUSES = ["Active", "On Hold", "Completed", "Dropped"];
const RECOMMENDATIONS   = ["Strong Hire", "Hire", "Maybe", "No Hire"];
const INTERVIEW_TYPES   = ["Phone", "Video", "In-Person", "Panel"];


const EMPTY_FORM = {
  resume_id: "", candidate_name: "", job_id: "", job_mongo_id: "", client_name: "",
  job_title: "", current_stage: "Screening", pipeline_status: "Active",
  recruiter: "", next_step: "", notes: "",
  salary_offered: "", joining_date: "", rejection_reason: "",
};
const EMPTY_INTERVIEW = {
  interviewer: "", interview_type: "Video", feedback_score: 3,
  recommendation: "Maybe", feedback_summary: "", strengths: "", weaknesses: "",
};

const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const RatingStars = ({ score }) => (
  <Box display="flex" gap={0.3}>
    {[1,2,3,4,5].map(i => (
      <Box key={i} sx={{ color: i <= score ? "#f9a825" : "#e0e0e0", fontSize: 14, lineHeight: 1 }}>★</Box>
    ))}
  </Box>
);

// ── Kanban card ───────────────────────────────────────────────────────────────
const KanbanCard = ({ tracking, onEdit, onFeedback, onStageChange }) => {
  const lastInterview = tracking.interviews?.[tracking.interviews.length - 1];
  return (
    <Card sx={{ mb: 1.5, "&:hover": { boxShadow: 4, transform: "translateY(-2px)" }, transition: "all 0.15s" }}>
      <CardContent sx={{ p: 1.8, "&:last-child": { pb: 1.8 } }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700, bgcolor: "#1a237e" }}>
            {nameInitials(tracking.candidate_name)}
          </Avatar>
          <Box sx={{ overflow: "hidden" }}>
            <Typography fontWeight={700} fontSize={13} noWrap>{tracking.candidate_name}</Typography>
            <Typography fontSize={11} color="text.secondary" noWrap>{tracking.job_title}</Typography>
          </Box>
        </Box>
        <Typography fontSize={11} color="text.secondary" mb={0.5}>{tracking.client_name}</Typography>
        {lastInterview && <RatingStars score={lastInterview.feedback_score || 0} />}
        {tracking.recruiter && (
          <Typography fontSize={11} color="text.secondary" mt={0.5}>👤 {tracking.recruiter}</Typography>
        )}
        <Divider sx={{ my: 1 }} />
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={0.5}>
            <Tooltip title="Add Feedback">
              <IconButton size="small" onClick={() => onFeedback(tracking)}>
                <Chat sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(tracking)}>
                <Edit sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Box>
          <TextField
            select size="small"
            value={tracking.current_stage}
            onChange={e => onStageChange(tracking, e.target.value)}
            sx={{ "& .MuiSelect-select": { fontSize: 11, py: 0.4, px: 0.8 }, minWidth: 100 }}
          >
            {STAGES.map(s => <MenuItem key={s.id} value={s.id} sx={{ fontSize: 12 }}>{s.label}</MenuItem>)}
          </TextField>
        </Box>
      </CardContent>
    </Card>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Tracking() {
  const [trackings,  setTrackings]  = useState([]);
  const [jobs,       setJobs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  // const [viewMode,   setViewMode]   = useState("kanban");
  const [viewMode, setViewMode] = useState("list");
  const [search,     setSearch]     = useState("");
  const [stageF,     setStageF]     = useState("");
  const [jobF,       setJobF]       = useState("");
  const [clientF, setClientF]       = useState("");
  const [recruiters, setRecruiters] = useState([]);
  console.log("recruiters:::::::",recruiters)

  const [formOpen,  setFormOpen]  = useState(false);
  const [ivOpen,    setIvOpen]    = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [formData,  setFormData]  = useState(EMPTY_FORM);
  const [ivData,    setIvData]    = useState(EMPTY_INTERVIEW);
  const [saving,    setSaving]    = useState(false);

  // ── GET /api/tracking/ ───────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await getAllTracking();
      setTrackings(res.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load tracking data");
      setTrackings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadJobs = useCallback(async () => {
    try { const res = await getAllJobs(); setJobs(res.data || []); }
    catch { setJobs([]); }
  }, []);
  const loadRecruiters = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/user/`, { headers: getHeaders() });
      const data = await res.json();
      // ← filter only recruiter role
      const onlyRecruiters = (data.data || []).filter(u => u.role === "recruiter");
      setRecruiters(onlyRecruiters);
    } catch { setRecruiters([]); }
  }, []);
  
  // Add to useEffect
  useEffect(() => { load(); loadJobs(); loadRecruiters(); }, [load, loadJobs, loadRecruiters]);
  // useEffect(() => { load(); loadJobs(); }, [load, loadJobs]);

  const filtered = trackings.filter(t => {
    const q = search.toLowerCase();
    const mQ = !q || 
      t.candidate_name?.toLowerCase().includes(q) || 
      t.job_title?.toLowerCase().includes(q) || 
      t.client_name?.toLowerCase().includes(q);
    const mS = !stageF || t.current_stage === stageF;
    const mC = !clientF || t.client_name === clientF;
    const mJ = !jobF   || t.job_id === jobF;
    return mQ && mS && mJ && mC;
  });

  const byStage = (id) => filtered.filter(t => t.current_stage === id);

  const stats = KANBAN_STAGES.map(s => ({ ...s, count: trackings.filter(t => t.current_stage === s.id).length }));
  const uniqueClients = [...new Set(trackings.map(t => t.client_name).filter(Boolean))];
  // Modal helpers
  const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
  const openEdit   = t  => { setSelected(t); setFormData({ ...EMPTY_FORM, ...t }); setFormOpen(true); };
  const openIv     = t  => { setSelected(t); setIvData(EMPTY_INTERVIEW); setIvOpen(true); };

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleIvChange = e => setIvData(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── POST or PUT /api/tracking ───────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (selected) { await updateTracking(selected._id, formData); }
      else          { await createTracking(formData); }
      setFormOpen(false); load();
    } catch (err) { setError(err?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  // ── POST /api/tracking/:id/interview ───────────────────────────────────
  const handleIvSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await addInterview(selected._id, {
        ...ivData,
        feedback_score: Number(ivData.feedback_score),
        strengths:  ivData.strengths  ? ivData.strengths.split(",").map(s => s.trim())  : [],
        weaknesses: ivData.weaknesses ? ivData.weaknesses.split(",").map(s => s.trim()) : [],
      });
      setIvOpen(false); load();
    } catch (err) { setError(err?.message || "Failed to add feedback"); }
    finally { setSaving(false); }
  };




// ── Stage-based feedback config ───────────────────────────────────────────────
// ── Stage-based FORM field config (for Add to Pipeline) ──────────────────────
const STAGE_FORM_CONFIG = {
  "Screening": {
    extraFields: [],  // no extra fields needed
  },
  "Technical Round 1": {
    extraFields: ["next_step"],
  },
  "Technical Round 2": {
    extraFields: ["next_step"],
  },
  "HR Round": {
    extraFields: ["next_step"],
  },
  "Manager Round": {
    extraFields: ["next_step"],
  },
  "Final Round": {
    extraFields: ["next_step"],
  },
  "Offer Stage": {
    extraFields: ["salary_offered", "next_step"],
  },
  "Negotiation": {
    extraFields: ["salary_offered", "next_step"],
  },
  "Offer Accepted": {
    extraFields: ["salary_offered", "joining_date"],
  },
  "Offer Declined": {
    extraFields: ["rejection_reason"],
  },
  "Joined": {
    extraFields: ["joining_date"],
  },
  "Rejected": {
    extraFields: ["rejection_reason"],
  },
  "Withdrawn": {
    extraFields: ["rejection_reason"],
  },
};
const STAGE_FEEDBACK_CONFIG = {
"Screening": {
  label: "Screening Feedback",
  color: "#757575",
  fields: ["interviewer", "feedback_score", "recommendation", "feedback_summary"], 
  hints: {
    feedback_summary: "Initial impression, communication skills, basic fitment",
  }
},
  "Technical Round 1": {
    label: "Technical Round 1 Feedback",
    color: "#0277bd",
    fields: ["interviewer", "interview_type", "feedback_score", "recommendation", "strengths", "weaknesses", "feedback_summary"],
    hints: {
      strengths: "e.g. Strong in React, good problem solving",
      weaknesses: "e.g. Weak in system design, needs SQL improvement",
      feedback_summary: "Technical skills, coding ability, and overall assessment",
    }
  },
  "Technical Round 2": {
    label: "Technical Round 2 Feedback",
    color: "#01579b",
    fields: ["interviewer", "interview_type", "feedback_score", "recommendation", "strengths", "weaknesses", "feedback_summary"],
    hints: {
      strengths: "e.g. Excellent system design, distributed systems knowledge",
      weaknesses: "e.g. Limited cloud infrastructure experience",
      feedback_summary: "Advanced technical evaluation and architecture discussion",
    }
  },
"HR Round": {
  label: "HR Round Feedback",
  color: "#e65100",
  fields: ["interviewer", "feedback_score", "recommendation", "feedback_summary"], 
  hints: {
    feedback_summary: "Cultural fit, communication, salary expectations, notice period",
  }
},
  "Manager Round": {
    label: "Manager Round Feedback",
    color: "#6a1b9a",
    fields: ["interviewer", "interview_type", "feedback_score", "recommendation",  "feedback_summary"],
    hints: {
      strengths: "e.g. Leadership potential, ownership mindset",
      weaknesses: "e.g. Needs mentoring on stakeholder management",
      feedback_summary: "Leadership qualities, team fit, and managerial assessment",
    }
  },
  "Final Round": {
    label: "Final Round Feedback",
    color: "#ad1457",
    fields: ["interviewer", "interview_type", "feedback_score", "recommendation", "strengths", "weaknesses", "feedback_summary"],
    hints: {
      strengths: "e.g. Strong overall fit, ready to contribute",
      weaknesses: "e.g. May need onboarding support",
      feedback_summary: "Overall final assessment and hiring decision rationale",
    }
  },
  "Offer Stage": {
    label: "Offer Details",
    color: "#1565c0",
    fields: ["interviewer", "feedback_score", "recommendation", "feedback_summary"],
    hints: {
      feedback_summary: "Salary offered, joining date, and offer conditions",
    }
  },
  "Negotiation": {
    label: "Negotiation Notes",
    color: "#f9a825",
    fields: ["interviewer", "feedback_score", "recommendation", "feedback_summary"],
    hints: {
      feedback_summary: "Negotiation terms, counter offers, and current status",
    }
  },
  "Offer Accepted": {
    label: "Offer Acceptance Details",
    color: "#2e7d32",
    fields: ["interviewer", "feedback_score", "feedback_summary"],
    hints: {
      feedback_summary: "Confirmed joining date, final CTC agreed, and next steps",
    }
  },
  "Offer Declined": {
    label: "Offer Declined — Reason",
    color: "#c62828",
    fields: ["interviewer", "feedback_score", "feedback_summary"],
    hints: {
      feedback_summary: "Reason for declining — better offer, location, role mismatch, etc.",
    }
  },
  "Joined": {
    label: "Joining Confirmation",
    color: "#1b5e20",
    fields: ["interviewer", "feedback_summary"],
    hints: {
      feedback_summary: "Date of joining, team assigned, and onboarding notes",
    }
  },
  "Rejected": {
    label: "Rejection Feedback",
    color: "#4e342e",
    fields: ["interviewer", "feedback_score", "recommendation", "weaknesses", "feedback_summary"],
    hints: {
      weaknesses: "e.g. Skill gap, poor communication, attitude issues",
      feedback_summary: "Reason for rejection and areas candidate needs to improve",
    }
  },
  "Withdrawn": {
    label: "Withdrawal Notes",
    color: "#37474f",
    fields: ["interviewer", "feedback_summary"],
    hints: {
      feedback_summary: "Reason candidate withdrew — personal reasons, competing offer, etc.",
    }
  },
};

// Fallback for stages not in config
const getStageConfig = (stage) =>
  STAGE_FEEDBACK_CONFIG[stage] || {
    label: "Interview Feedback",
    color: "#546e7a",
    fields: ["interviewer", "interview_type", "feedback_score", "recommendation", "strengths", "weaknesses", "feedback_summary"],
    hints: {},
  };










  // ── PUT /api/tracking/:id (stage change from kanban) ───────────────────
  const handleStageChange = async (tracking, newStage) => {
    try { await updateTracking(tracking._id, { current_stage: newStage }); load(); }
    catch { setError("Failed to update stage"); }
  };

  if (loading)
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={48} /></Box>;

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" color="primary.dark">Candidate Tracking</Typography>
          <Typography color="text.secondary" mt={0.5}>Track interview pipeline and manage candidate progress</Typography>
        </Box>
        <Box display="flex" gap={1.5} alignItems="center">
          <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
            <ToggleButton value="kanban"><ViewKanban fontSize="small" /></ToggleButton>
            <ToggleButton value="list"><ViewList fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          {/* <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add to Pipeline</Button> */}
        </Box>
      </Box>

      {/* Stage summary */}
      {trackings.length > 0 && (
        <Box display="flex" gap={1.5} flexWrap="wrap">
          {stats.filter(s => s.count > 0).map(s => (
            <Card key={s.id} sx={{ minWidth: 110, flex: "0 0 auto" }}>
              <CardContent sx={{ p: "12px 16px !important" }}>
                <Box sx={{ width: 4, height: 36, bgcolor: s.color, borderRadius: 1, float: "left", mr: 1.5 }} />
                <Typography fontSize={11} color="text.secondary">{s.label}</Typography>
                <Typography fontWeight={800} fontSize="1.4rem" sx={{ color: s.color }}>{s.count}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Filters */}
      <Box display="flex" gap={2} flexWrap="wrap">
        <TextField
          placeholder="Search candidate, job or client…" value={search}
          onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }}
        />
        <TextField select value={stageF} onChange={e => setStageF(e.target.value)} size="small" sx={{ minWidth: 160 }} label="Stage">
          <MenuItem value="">All Stages</MenuItem>
          {STAGES.map(s => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
        </TextField>
        <TextField select value={jobF} onChange={e => setJobF(e.target.value)} size="small" sx={{ minWidth: 180 }} label="Job">
          <MenuItem value="">All Jobs</MenuItem>
          {jobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} - {j.title} </MenuItem>)}
        </TextField>
        <TextField select value={clientF} onChange={e => setClientF(e.target.value)} size="small" sx={{ minWidth: 180 }} label="Client">
            <MenuItem value="">All Clients</MenuItem>
            {uniqueClients.map(c => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
      </Box>

      {/* Empty state */}
      {trackings.length === 0 && !error && (
        <Card>
          <Box display="flex" flexDirection="column" alignItems="center" py={10} gap={2}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
              <AccountTree sx={{ fontSize: 36, color: "#9fa8da" }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary">No candidates in pipeline</Typography>
            <Typography fontSize={14} color="text.disabled">Click "Add to Pipeline" to start tracking candidates.</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ mt: 1 }}>Add to Pipeline</Button>
          </Box>
        </Card>
      )}

      {/* ── Kanban ── */}
      {trackings.length > 0 && viewMode === "kanban" && (
        <Box sx={{ overflowX: "auto" }}>
          <Box display="flex" gap={2} sx={{ minWidth: KANBAN_STAGES.length * 220 }}>
            {KANBAN_STAGES.map(stage => (
              <Box key={stage.id} sx={{ minWidth: 210, flex: 1 }}>
                <Box sx={{
                  p: "10px 14px", mb: 1.5, borderRadius: 2,
                  bgcolor: stage.bg, borderTop: `3px solid ${stage.color}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <Typography fontWeight={700} fontSize={12} sx={{ color: stage.color }}>{stage.label}</Typography>
                  <Chip label={byStage(stage.id).length} size="small"
                    sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: stage.color, color: "#fff" }} />
                </Box>
                <Box>
                  {byStage(stage.id).length === 0 ? (
                    <Typography fontSize={12} color="text.disabled" textAlign="center" py={3}>No candidates</Typography>
                  ) : byStage(stage.id).map(t => (
                    <KanbanCard key={t._id} tracking={t}
                      onEdit={openEdit} onFeedback={openIv} onStageChange={handleStageChange} />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ── List view ── */}
      {trackings.length > 0 && viewMode === "list" && (
        <Card>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f7fa" }}>
                  {["Candidate", "Job", "Client", "Stage", "Recruiter", "Last Rating", "Actions"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No candidates match your filters
                    </TableCell>
                  </TableRow>
                ) : filtered.map(t => {
                  const stage = STAGE_MAP[t.current_stage] || {};
                  const lastIv = t.interviews?.[t.interviews.length - 1];
                  return (
                    <TableRow key={t._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 700, bgcolor: "#1a237e" }}>
                            {nameInitials(t.candidate_name)}
                          </Avatar>
                          <Typography fontWeight={600} fontSize={13}>{t.candidate_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{t.job_title}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{t.client_name}</TableCell>
                      <TableCell>
                        <Chip label={t.current_stage} size="small"
                          sx={{ bgcolor: stage.bg, color: stage.color, fontWeight: 700, fontSize: 11 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{t.recruiter || "—"}</TableCell>
                      <TableCell>
                        {lastIv ? <RatingStars score={lastIv.feedback_score || 0} /> : <Typography fontSize={12} color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Add Feedback">
                            <IconButton size="small" onClick={() => openIv(t)}><Chat fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(t)}><Edit fontSize="small" /></IconButton>
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
      )}

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          {selected ? "Edit Tracking" : "Add to Pipeline"}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              {/* Always visible fields */}
              <Grid item xs={12}>
                <TextField sx={{ width: "100%", minWidth: 250 }} size="small" required label="Candidate Name"
                  name="candidate_name" value={formData.candidate_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField sx={{ width: "100%", minWidth: 250 }} size="small" required label="Resume ID"
                  name="resume_id" value={formData.resume_id} onChange={handleChange} placeholder="e.g. RES001" />
              </Grid>
              <Grid item xs={12} sm={6}>

                  <TextField select sx={{ width: "100%", minWidth: 250 }} size="small" label="Job" name="job_id"
                    value={formData.job_mongo_id || ""}          
                    onChange={e => {
                      const job = jobs.find(j => j._id === e.target.value);
                      setFormData(p => ({
                        ...p,
                        job_id:       job?.job_id    || "",       
                        job_mongo_id: e.target.value,         
                        job_title:    job?.title     || "",
                        client_name:  job?.client_name || "",
                      }));
                    }}>
                    <MenuItem value="">Select Job</MenuItem>
                    {jobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} - {j.title}</MenuItem>)}
                  </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField sx={{ width: "100%", minWidth: 250 }} size="small" label="Client Name"
                  name="client_name" value={formData.client_name} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField sx={{ width: "100%", minWidth: 250 }} size="small" label="Job Title"
                  name="job_title" value={formData.job_title} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select sx={{ width: "100%", minWidth: 250 }} size="small" label="Stage" name="current_stage"
                  value={formData.current_stage} onChange={handleChange}>
                  {STAGES.map(s => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select sx={{ width: "100%", minWidth: 250 }} size="small" label="Status" name="pipeline_status"
                  value={formData.pipeline_status} onChange={handleChange}>
                  {PIPELINE_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>

              {/* Recruiter Dropdown */}
              <Grid item xs={12}>
                <TextField select sx={{ width: "100%", minWidth: 250 }} size="small" label="Recruiter"
                  name="recruiter" value={formData.recruiter} onChange={handleChange}>
                  <MenuItem value="">Select Recruiter</MenuItem>
                  {recruiters.map(r => (
                    <MenuItem key={r.id} value={`${r.first_name} ${r.last_name}`}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: "#1a237e" }}>
                          {r.first_name?.[0]}{r.last_name?.[0]}
                        </Avatar>
                        {r.first_name} {r.last_name}
                        <Chip label={r.role} size="small"
                          sx={{ ml: "auto", fontSize: 10, height: 18, textTransform: "capitalize" }} />
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Stage-based extra fields */}
              {(STAGE_FORM_CONFIG[formData.current_stage]?.extraFields || []).includes("next_step") && (
                <Grid item xs={12}>
                  <TextField sx={{ width: "100%", minWidth: 250 }} size="small" label="Next Step"
                    name="next_step" value={formData.next_step} onChange={handleChange}
                    placeholder="e.g. Schedule Technical Round 2" />
                </Grid>
              )}

              {(STAGE_FORM_CONFIG[formData.current_stage]?.extraFields || []).includes("salary_offered") && (
                <Grid item xs={12} sm={6}>
                  <TextField sx={{ width: "100%", minWidth: 250 }} size="small" label="Salary Offered (LPA)"
                    name="salary_offered" value={formData.salary_offered} onChange={handleChange}
                    type="number" placeholder="e.g. 12.5" />
                </Grid>
              )}

              {(STAGE_FORM_CONFIG[formData.current_stage]?.extraFields || []).includes("joining_date") && (
                <Grid item xs={12} sm={6}>
                  <TextField sx={{ width: "100%", minWidth: 250 }} size="small" label="Joining Date"
                    name="joining_date" value={formData.joining_date} onChange={handleChange}
                    type="date" InputLabelProps={{ shrink: true }} />
                </Grid>
              )}

              {(STAGE_FORM_CONFIG[formData.current_stage]?.extraFields || []).includes("rejection_reason") && (
                <Grid item xs={12}>
                  <TextField sx={{ width: "100%", minWidth: 250 }} size="small" label="Reason"
                    name="rejection_reason" value={formData.rejection_reason} onChange={handleChange}
                    placeholder="e.g. Skill mismatch, better offer elsewhere..." />
                </Grid>
              )}

              {/* Notes — always visible */}
              <Grid item xs={12}>
                <TextField sx={{ width: "100%", minWidth: 520 }} multiline rows={3} size="small" label="Notes"
                  name="notes" value={formData.notes} onChange={handleChange} />
              </Grid>

            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              {selected ? "Update" : "Add"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>




      {/* ── Interview Feedback Dialog ── */}
<Dialog open={ivOpen} onClose={() => setIvOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle sx={{
    fontWeight: 700,
    borderBottom: "1px solid #e0e0e0",
    borderTop: `4px solid ${getStageConfig(selected?.current_stage).color}`,
    pb: 1.5,
  }}>
    <Box display="flex" alignItems="center" gap={1}>
      <Chip
        label={selected?.current_stage || ""}
        size="small"
        sx={{
          bgcolor: getStageConfig(selected?.current_stage).color,
          color: "#fff",
          fontWeight: 700,
          fontSize: 11,
        }}
      />
      <Typography fontWeight={700} fontSize={16}>
        {getStageConfig(selected?.current_stage).label}
      </Typography>
    </Box>
    {selected && (
      <Typography fontSize={13} color="text.secondary" mt={0.5}>
        👤 {selected.candidate_name} &nbsp;·&nbsp; {selected.job_title} &nbsp;·&nbsp; {selected.client_name}
      </Typography>
    )}
  </DialogTitle>

  <form onSubmit={handleIvSave}>
    <DialogContent sx={{ pt: 3 }}>
      {(() => {
        const config = getStageConfig(selected?.current_stage);
        const show = (field) => config.fields.includes(field);
        return (
          <Grid container spacing={2}>

            {/* Interviewer — Dropdown from Users */}
            {show("interviewer") && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    sx={{ width: "100%", minWidth: 250 }}
                    size="small"
                    required
                    label="Enter Your Name"
                    name="interviewer"
                    value={ivData.interviewer}
                    onChange={handleIvChange}
                    placeholder="Type your full name"
                  />
                </Grid>
              )}

            {/* Interview Type */}
            {show("interview_type") && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  sx={{ width: "100%", minWidth: 250 }}
                  size="small"
                  label="Interview Type"
                  name="interview_type"
                  value={ivData.interview_type}
                  onChange={handleIvChange}
                >
                  {INTERVIEW_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
            )}

            {/* Rating */}
            {show("feedback_score") && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  sx={{ width: "100%", minWidth: 250 }}
                  size="small"
                  label="Rating (1–5)"
                  name="feedback_score"
                  value={ivData.feedback_score}
                  onChange={handleIvChange}
                >
                  {[1,2,3,4,5].map(n => (
                    <MenuItem key={n} value={n}>
                      {n} — {["Poor","Below Avg","Average","Good","Excellent"][n-1]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {/* Recommendation */}
            {show("recommendation") && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  sx={{ width: "100%", minWidth: 250 }}
                  size="small"
                  label="Recommendation"
                  name="recommendation"
                  value={ivData.recommendation}
                  onChange={handleIvChange}
                >
                  {RECOMMENDATIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
            )}

            {/* Strengths */}
            {show("strengths") && (
              <Grid item xs={12} sm={6}>
                <TextField
                  sx={{ width: "100%", minWidth: 250 }}
                  size="small"
                  label="Strengths (comma-separated)"
                  name="strengths"
                  value={ivData.strengths}
                  onChange={handleIvChange}
                  placeholder={config.hints.strengths || "e.g. Communication, Problem Solving"}
                  helperText={config.hints.strengths}
                />
              </Grid>
            )}

            {/* Weaknesses */}
            {show("weaknesses") && (
              <Grid item xs={12} sm={6}>
                <TextField
                  sx={{ width: "100%", minWidth: 250 }}
                  size="small"
                  label="Weaknesses (comma-separated)"
                  name="weaknesses"
                  value={ivData.weaknesses}
                  onChange={handleIvChange}
                  placeholder={config.hints.weaknesses || "e.g. System Design, Leadership"}
                  helperText={config.hints.weaknesses}
                />
              </Grid>
            )}

            {/* Feedback Summary */}
            {show("feedback_summary") && (
              <Grid item xs={12}>
                <TextField
                  sx={{ width: "100%", minWidth: 520 }}
                  multiline
                  rows={4}
                  size="small"
                  label="Feedback Summary"
                  name="feedback_summary"
                  value={ivData.feedback_summary}
                  onChange={handleIvChange}
                  placeholder={config.hints.feedback_summary || "Enter detailed feedback..."}
                  helperText={config.hints.feedback_summary}
                />
              </Grid>
            )}

          </Grid>
        );
      })()}
    </DialogContent>

    <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
      <Button onClick={() => setIvOpen(false)}>Cancel</Button>
      <Button
        type="submit"
        variant="contained"
        disabled={saving}
        sx={{ bgcolor: getStageConfig(selected?.current_stage).color }}
      >
        {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
        Submit Feedback
      </Button>
    </DialogActions>
  </form>
</Dialog>
    </Box>
  );
}