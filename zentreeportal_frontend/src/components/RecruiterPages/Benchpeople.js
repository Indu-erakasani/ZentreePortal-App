import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, Paper, Chip,
  IconButton, Tooltip, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, InputAdornment, Divider,
  LinearProgress, Grid,
} from "@mui/material";
import {
  Add, Search, Edit, Delete, Visibility, Description,
  CloudUpload, CheckCircle, Done, NavigateBefore,
  Close as CloseIcon, PictureAsPdf, OpenInNew, Person,
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

const getAllBench       = (p = {}) => {
  const qs = new URLSearchParams(p).toString();
  return fetch(`${BASE}/bench/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
};
const createBench      = (pl) => fetch(`${BASE}/bench/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(pl) }).then(handle);
const updateBench      = (id, pl) => fetch(`${BASE}/bench/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(pl) }).then(handle);
const deleteBench      = (id) => fetch(`${BASE}/bench/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
const parsePdf         = (file_b64, file_name) =>
  fetch(`${BASE}/bench/parse-pdf`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ file_b64, file_name }) }).then(handle);
const uploadFile       = (id, file_b64) =>
  fetch(`${BASE}/bench/${id}/upload-file`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ file_b64 }) }).then(handle);
const getTrackingByBench = (bench_id) =>
  fetch(`${BASE}/tracking/by-resume/${bench_id}`, { headers: getHeaders() }).then(handle);
const createTracking   = (pl) =>
  fetch(`${BASE}/tracking/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(pl) }).then(handle);
const getAllJobs        = () => fetch(`${BASE}/jobs/`, { headers: getHeaders() }).then(handle);

const toBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result.split(",")[1]);
  r.onerror = () => rej(new Error("Read failed"));
  r.readAsDataURL(file);
});

// ── Constants ─────────────────────────────────────────────────────────────────
const BENCH_STATUSES   = ["Available", "In Interview", "Deployed", "On Hold", "Resigned"];
const EMPLOYMENT_TYPES = ["Permanent", "Contract", "C2H", "Freelance"];
const NOTICES          = ["Immediate", "15 days", "30 days", "60 days", "90 days"];
const PIPELINE_STAGES  = [
  "Screening", "Technical Round 1", "Technical Round 2", "HR Round",
  "Manager Round", "Final Round", "Offer Stage", "Negotiation",
  "Offer Accepted", "Offer Declined", "Joined", "Rejected", "Withdrawn",
];
const STATUS_COLOR = {
  Available: "success", "In Interview": "warning",
  Deployed: "info", "On Hold": "default", Resigned: "error",
};
const STAGE_COLOR = {
  Screening: "default", "Technical Round 1": "info", "Technical Round 2": "info",
  "HR Round": "primary", "Manager Round": "primary", "Final Round": "primary",
  "Offer Stage": "warning", Negotiation: "warning",
  "Offer Accepted": "success", Joined: "success",
  "Offer Declined": "error", Rejected: "error", Withdrawn: "error",
};
const SCORE_LABEL = ["", "Poor", "Below Avg", "Average", "Good", "Excellent"];
const EMPTY_FORM = {
  name: "", email: "", phone: "", current_role: "", skills: "",
  experience: "", location: "", current_salary: "", expected_salary: "",
  notice_period: "Immediate", last_client: "", last_project: "",
  status: "Available", added_by: "", employment_type: "Permanent", notes: "",
};

const fmtSalary = (v) => {
  if (!v) return "—";
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${Number(v).toLocaleString("en-IN")}`;
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, color, icon }) => (
  <Card>
    <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
      <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
      <Box>
        <Typography fontSize={12} color="text.secondary" fontWeight={600} textTransform="uppercase">{title}</Typography>
        <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

// ── Upload Zone ───────────────────────────────────────────────────────────────
const UploadZone = ({ onFiles, fileRef }) => {
  const [drag, setDrag] = useState(false);
  return (
    <Box onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); onFiles({ target: { files: e.dataTransfer.files } }); }}
      onClick={() => fileRef.current?.click()}
      sx={{
        border: drag ? "2px dashed #0369a1" : "2px dashed #7dd3fc",
        borderRadius: 3, bgcolor: drag ? "#e0f2fe" : "#f0f9ff",
        p: 2.5, display: "flex", alignItems: "center", gap: 2.5,
        cursor: "pointer", transition: "all 0.2s",
        "&:hover": { bgcolor: "#e0f2fe", borderColor: "#0369a1" },
      }}>
      <Avatar sx={{ width: 52, height: 52, bgcolor: drag ? "#0369a1" : "#e0f2fe", flexShrink: 0 }}>
        <CloudUpload sx={{ fontSize: 28, color: drag ? "#fff" : "#0369a1" }} />
      </Avatar>
      <Box flex={1}>
        <Typography fontWeight={700} color="#0369a1" fontSize="0.95rem">
          Drag &amp; drop PDF resumes here · AI will auto-extract details
        </Typography>
        <Typography fontSize={12} color="text.secondary" mt={0.3}>
          Multiple files supported · PDF only · Original file stored
        </Typography>
      </Box>
      <input ref={fileRef} type="file" accept=".pdf,application/pdf" multiple hidden onChange={onFiles} />
    </Box>
  );
};

// ── Parse Progress ────────────────────────────────────────────────────────────
const ParseProgress = ({ files, onReview, onClear }) => {
  const allDone = files.every(f => f.status !== "parsing" && f.status !== "pending");
  return (
    <Card variant="outlined" sx={{ borderColor: "#7dd3fc", borderRadius: 2 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            {!allDone && <CircularProgress size={14} />}
            <Typography fontWeight={700} fontSize="0.88rem">
              {allDone ? `Parsing complete — ${files.filter(f => f.status === "done").length} parsed` : `Parsing ${files.length} resume(s) with AI…`}
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            {allDone && <Button variant="contained" size="small" onClick={onReview} startIcon={<Done />}>Review &amp; Save</Button>}
            <IconButton size="small" onClick={onClear}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
        {files.map((entry, i) => (
          <Box key={i} display="flex" alignItems="center" gap={1.5} sx={{ p: 1, bgcolor: "#f5f7fa", borderRadius: 1.5, mb: 0.8 }}>
            <Description fontSize="small" color="action" />
            <Box flex={1} minWidth={0}>
              <Typography fontSize={12} fontWeight={600} noWrap>{entry.file.name}</Typography>
              {entry.status === "parsing" && <LinearProgress sx={{ mt: 0.5, height: 3, borderRadius: 2 }} />}
            </Box>
            {entry.status === "pending" && <Chip label="Waiting"       size="small" sx={{ fontSize: 10 }} />}
            {entry.status === "parsing" && <CircularProgress size={16} />}
            {entry.status === "done"    && <Chip label="Parsed ✓"      size="small" color="success" sx={{ fontSize: 10 }} />}
            {entry.status === "error"   && <Chip label="Fill manually" size="small" color="warning" sx={{ fontSize: 10 }} />}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

// ── PDF Viewer ────────────────────────────────────────────────────────────────
const PdfViewer = ({ open, onClose, person }) => {
  const [blobUrl, setBlobUrl] = React.useState(null);
  const [fetching, setFetching] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (!open || !person?._id || !person?.resume_file) return;
    let url = null;
    setFetching(true); setErr("");
    fetch(`${BASE}/bench/${person._id}/file`, { headers: getHeaders() })
      .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.blob(); })
      .then(blob => { url = URL.createObjectURL(blob); setBlobUrl(url); })
      .catch(e => setErr(e.message))
      .finally(() => setFetching(false));
    return () => { if (url) URL.revokeObjectURL(url); setBlobUrl(null); setErr(""); };
  }, [open, person?._id, person?.resume_file]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: "92vh", display: "flex", flexDirection: "column" } }}>
      <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", py: 1.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <PictureAsPdf color="error" />
            <Typography fontWeight={700}>{person?.name} — Resume</Typography>
          </Box>
          <Box display="flex" gap={1}>
            {blobUrl && <Tooltip title="Download"><IconButton size="small" onClick={() => { const a = document.createElement("a"); a.href = blobUrl; a.download = `${person?.name}_resume.pdf`; a.click(); }}><OpenInNew fontSize="small" /></IconButton></Tooltip>}
            <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
        {fetching && <Box display="flex" justifyContent="center" alignItems="center" height="100%"><CircularProgress /></Box>}
        {!fetching && err && <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexDirection="column" gap={2}><PictureAsPdf sx={{ fontSize: 64, color: "#ef9a9a" }} /><Typography color="error">{err}</Typography></Box>}
        {!fetching && blobUrl && <iframe src={blobUrl} title="Resume" style={{ width: "100%", height: "100%", border: "none" }} />}
      </DialogContent>
    </Dialog>
  );
};

// ── Bench Detail Content ──────────────────────────────────────────────────────
// Defined OUTSIDE BenchPeople() to avoid React recreation on every render
function BenchDetailContent({ person, jobs, onClose, onEdit, onViewPdf }) {
  const [tracking,    setTracking]    = React.useState([]);
  const [loadingT,    setLoadingT]    = React.useState(true);
  const [tab,         setTab]         = React.useState(0);
  const [addPipeline, setAddPipeline] = React.useState(false);
  const [pipeForm,    setPipeForm]    = React.useState({
    job_id: "", current_stage: "Screening", recruiter: "", notes: "", next_step: "",
  });
  const [pipeError,  setPipeError]  = React.useState("");
  const [pipeSaving, setPipeSaving] = React.useState(false);

  const loadTracking = React.useCallback(() => {
    setLoadingT(true);
    getTrackingByBench(person.bench_id)
      .then(res => setTracking(res.data || []))
      .catch(() => setTracking([]))
      .finally(() => setLoadingT(false));
  }, [person.bench_id]);

  React.useEffect(() => { loadTracking(); }, [loadTracking]);

  const activeTrack = tracking[0];

  const handleAddPipeline = async () => {
    if (!pipeForm.job_id) { setPipeError("Please select a job"); return; }
    setPipeSaving(true); setPipeError("");
    try {
      const job = jobs.find(j => j._id === pipeForm.job_id);
      await createTracking({
        resume_id:       person.bench_id?.trim(),
        candidate_name:  person.name,
        job_id:          pipeForm.job_id,
        job_title:       job?.title || "",
        client_name:     job?.client_name || "",
        current_stage:   pipeForm.current_stage,
        recruiter:       pipeForm.recruiter,
        notes:           pipeForm.notes,
        next_step:       pipeForm.next_step,
        pipeline_status: "Active",
      });
      setAddPipeline(false);
      setPipeForm({ job_id: "", current_stage: "Screening", recruiter: "", notes: "", next_step: "" });
      loadTracking();
    } catch (err) {
      setPipeError(err?.message || "Failed to add to pipeline");
    } finally { setPipeSaving(false); }
  };

  return (
    <>
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: "1px solid #e0e0e0" }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "#0369a1", fontSize: "1.3rem", fontWeight: 700 }}>
              {nameInitials(person.name)}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={800}>{person.name}</Typography>
              <Typography color="text.secondary" fontSize={13}>{person.current_role}</Typography>
              <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                <Chip label={person.status} color={STATUS_COLOR[person.status] || "default"} size="small" sx={{ fontWeight: 700 }} />
                <Chip label={person.employment_type} size="small" variant="outlined" />
                {activeTrack && <Chip label={`Pipeline: ${activeTrack.current_stage}`} color={STAGE_COLOR[activeTrack.current_stage] || "default"} size="small" variant="outlined" sx={{ fontWeight: 600 }} />}
              </Box>
            </Box>
          </Box>
          <Box display="flex" mt={2}>
            {["Profile & Resume", "Pipeline"].map((label, i) => (
              <Box key={i} onClick={() => { setTab(i); setAddPipeline(false); }} sx={{
                px: 2, py: 1, cursor: "pointer",
                fontWeight: tab === i ? 700 : 400, fontSize: 13,
                borderBottom: tab === i ? "2px solid #0369a1" : "2px solid transparent",
                color: tab === i ? "#0369a1" : "text.secondary",
                transition: "all 0.15s",
              }}>{label}</Box>
            ))}
          </Box>
        </Box>

        {/* TAB 0 — Profile */}
        {tab === 0 && (
          <Box p={3}>
            <Grid container spacing={2} mb={2}>
              {[
                ["Email",           person.email],
                ["Phone",           person.phone || "—"],
                ["Location",        person.location || "—"],
                ["Experience",      `${person.experience} years`],
                ["Current Salary",  fmtSalary(person.current_salary)],
                ["Expected Salary", fmtSalary(person.expected_salary)],
                ["Notice Period",   person.notice_period || "—"],
                ["Availability",    fmtDate(person.availability_date)],
                ["Bench Since",     fmtDate(person.bench_since)],
                ["Added By",        person.added_by || "—"],
                ["Last Client",     person.last_client || "—"],
                ["Last Project",    person.last_project || "—"],
              ].map(([label, val]) => (
                <Grid item xs={6} sm={4} key={label}>
                  <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
                  <Typography fontWeight={600} fontSize={13}>{val}</Typography>
                </Grid>
              ))}
            </Grid>

            {person.skills && (
              <Box mb={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={1}>Skills</Typography>
                <Box display="flex" flexWrap="wrap" gap={0.8}>
                  {person.skills.split(",").filter(Boolean).map((s, i) => (
                    <Chip key={i} label={s.trim()} size="small" variant="outlined"
                      sx={{ fontSize: 11, borderColor: "#0369a1", color: "#0369a1" }} />
                  ))}
                </Box>
              </Box>
            )}

            {person.notes && (
              <Box p={1.5} bgcolor="#f5f5f5" borderRadius={2} mb={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.3}>Notes</Typography>
                <Typography fontSize={13}>{person.notes}</Typography>
              </Box>
            )}

            <Box p={2} borderRadius={2} display="flex" alignItems="center" gap={2}
              sx={{ bgcolor: "#f5f5f5", border: "1px solid #e0e0e0" }}>
              <Box flex={1}>
                <Typography fontWeight={700} fontSize={13} color={person.resume_file ? "success.dark" : "text.secondary"}>
                  {person.resume_file ? "Resume PDF available" : "No resume file uploaded"}
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  {person.resume_file ? `File: ${person.resume_file}` : "Upload via drag-and-drop"}
                </Typography>
              </Box>
              {person.resume_file && <Button variant="contained" size="small" onClick={onViewPdf}>View PDF</Button>}
            </Box>
          </Box>
        )}

        {/* TAB 1 — Pipeline */}
        {tab === 1 && (
          <Box p={3}>
            {addPipeline ? (
              <Box mb={3} p={2.5} borderRadius={2} sx={{ border: "1.5px solid #0369a1", bgcolor: "#f0f9ff" }}>
                <Typography fontWeight={700} fontSize={14} color="#0369a1" mb={2}>Add to Pipeline</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField select fullWidth size="small" required label="Select Job" name="job_id"
                      value={pipeForm.job_id} onChange={e => setPipeForm(p => ({ ...p, job_id: e.target.value }))}>
                      <MenuItem value="">— Select a job —</MenuItem>
                      {jobs.map(j => (
                        <MenuItem key={j._id} value={j._id}>
                          <Box><Typography fontSize={13} fontWeight={600}>{j.title}</Typography>
                            {j.client_name && <Typography fontSize={11} color="text.secondary">{j.client_name}</Typography>}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select fullWidth size="small" label="Starting Stage" name="current_stage"
                      value={pipeForm.current_stage} onChange={e => setPipeForm(p => ({ ...p, current_stage: e.target.value }))}>
                      {PIPELINE_STAGES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Recruiter" value={pipeForm.recruiter}
                      onChange={e => setPipeForm(p => ({ ...p, recruiter: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Next Step" value={pipeForm.next_step}
                      onChange={e => setPipeForm(p => ({ ...p, next_step: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={2} size="small" label="Notes" value={pipeForm.notes}
                      onChange={e => setPipeForm(p => ({ ...p, notes: e.target.value }))} />
                  </Grid>
                </Grid>
                {pipeError && <Alert severity="error" sx={{ mt: 1.5 }}>{pipeError}</Alert>}
                <Box display="flex" gap={1} mt={2} justifyContent="flex-end">
                  <Button size="small" onClick={() => { setAddPipeline(false); setPipeError(""); }} sx={{ textTransform: "none", color: "#64748b" }}>Cancel</Button>
                  <Button size="small" variant="contained" onClick={handleAddPipeline}
                    disabled={pipeSaving || !pipeForm.job_id}
                    sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#0369a1", "&:hover": { bgcolor: "#075985" } }}
                    endIcon={pipeSaving ? <CircularProgress size={14} color="inherit" /> : null}>
                    {pipeSaving ? "Adding…" : "Add to Pipeline"}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button size="small" variant="outlined" onClick={() => setAddPipeline(true)}
                  sx={{ textTransform: "none", fontWeight: 700, borderColor: "#0369a1", color: "#0369a1" }}>
                  + Add to Pipeline
                </Button>
              </Box>
            )}

            {loadingT ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress size={32} /></Box>
            ) : tracking.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1}>
                <Typography color="text.secondary" fontWeight={600}>No pipeline records found</Typography>
                <Typography fontSize={13} color="text.disabled">Click "Add to Pipeline" to start tracking.</Typography>
              </Box>
            ) : tracking.map((track, tIdx) => (
              <Box key={track._id} mb={tIdx < tracking.length - 1 ? 4 : 0}>
                <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
                  <Chip label={track.current_stage} color={STAGE_COLOR[track.current_stage] || "default"} size="small" sx={{ fontWeight: 700 }} />
                  <Chip label={track.pipeline_status} size="small" variant="outlined" />
                  {track.recruiter   && <Typography fontSize={12} color="text.secondary">Recruiter: <strong>{track.recruiter}</strong></Typography>}
                  {track.job_title   && <Typography fontSize={12} color="text.secondary">Job: <strong>{track.job_title}</strong></Typography>}
                  {track.client_name && <Typography fontSize={12} color="text.secondary">Client: <strong>{track.client_name}</strong></Typography>}
                </Box>

                {track.stage_history?.length > 0 && (
                  <Box mb={3}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={1.5}>Stage History</Typography>
                    {track.stage_history.map((entry, i) => (
                      <Box key={i} display="flex" gap={1.5} alignItems="flex-start">
                        <Box display="flex" flexDirection="column" alignItems="center" sx={{ pt: 0.3 }}>
                          <Box sx={{
                            width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                            bgcolor: i === track.stage_history.length - 1 ? "#0369a1" : "#7dd3fc",
                            border: "2px solid", borderColor: i === track.stage_history.length - 1 ? "#0369a1" : "#e0f2fe",
                          }} />
                          {i < track.stage_history.length - 1 && <Box sx={{ width: 2, flexGrow: 1, minHeight: 20, bgcolor: "#e0f2fe", my: 0.3 }} />}
                        </Box>
                        <Box pb={1.5}>
                          <Typography fontWeight={600} fontSize={13}>{entry.stage}</Typography>
                          <Typography fontSize={11} color="text.secondary">
                            {fmtDate(entry.entered_at)}{entry.exited_at ? ` → ${fmtDate(entry.exited_at)}` : " · current"}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                {track.interviews?.length > 0 && (
                  <Box mb={3}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={1.5}>Interviews ({track.interviews.length})</Typography>
                    {track.interviews.map((iv, i) => (
                      <Box key={i} p={2} borderRadius={2} mb={1.5} sx={{ border: "1px solid #e0e0e0", bgcolor: "#fafafa" }}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Box>
                            <Typography fontWeight={700} fontSize={13}>Round {i + 1} — {iv.interview_type}</Typography>
                            <Typography fontSize={11} color="text.secondary">{iv.interviewer} · {fmtDate(iv.interview_date)}</Typography>
                          </Box>
                          <Box display="flex" gap={0.4} alignItems="center">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Box key={s} sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: s <= (iv.feedback_score || 0) ? "#0369a1" : "#e0e0e0" }} />
                            ))}
                            <Typography fontSize={11} fontWeight={700} color="#0369a1" ml={0.5}>{SCORE_LABEL[iv.feedback_score] || "—"}</Typography>
                          </Box>
                        </Box>
                        {iv.feedback_summary && <Typography fontSize={12} mb={1}>{iv.feedback_summary}</Typography>}
                        <Box display="flex" gap={2}>
                          {iv.strengths?.length > 0 && (
                            <Box flex={1}><Typography fontSize={10} fontWeight={700} color="#2e7d32" textTransform="uppercase" mb={0.5}>Strengths</Typography>
                              <Box display="flex" flexWrap="wrap" gap={0.4}>
                                {iv.strengths.map((s, si) => <Chip key={si} label={s} size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#e8f5e9", color: "#1b5e20" }} />)}
                              </Box>
                            </Box>
                          )}
                          {iv.weaknesses?.length > 0 && (
                            <Box flex={1}><Typography fontSize={10} fontWeight={700} color="#c62828" textTransform="uppercase" mb={0.5}>Areas to Improve</Typography>
                              <Box display="flex" flexWrap="wrap" gap={0.4}>
                                {iv.weaknesses.map((w, wi) => <Chip key={wi} label={w} size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#ffebee", color: "#b71c1c" }} />)}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                {track.next_step && (
                  <Box p={1.5} bgcolor="#fffde7" borderRadius={2} sx={{ border: "1px solid #fff176" }}>
                    <Typography fontSize={11} fontWeight={600} color="#f57f17" textTransform="uppercase">Next Step</Typography>
                    <Typography fontSize={13}>{track.next_step}</Typography>
                  </Box>
                )}

                {tIdx < tracking.length - 1 && <Divider sx={{ mt: 3 }} />}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onEdit} sx={{ bgcolor: "#0369a1", "&:hover": { bgcolor: "#075985" } }}>Edit</Button>
      </DialogActions>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BenchPeople() {
  const [bench,      setBench]      = useState([]);
  const [jobs,       setJobs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [statusF,    setStatusF]    = useState("");
  const [formOpen,   setFormOpen]   = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pdfOpen,    setPdfOpen]    = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [addFile,    setAddFile]    = useState(null);
  const formFileRef = useRef(null);
  const [inlineFiles, setInlineFiles] = useState([]);
  const [showParsing, setShowParsing] = useState(false);
  const inlineRef = useRef(null);
  const [bulkOpen,   setBulkOpen]   = useState(false);
  const [bulkFiles,  setBulkFiles]  = useState([]);
  const [bulkStep,   setBulkStep]   = useState(0);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkDone,   setBulkDone]   = useState(false);

  const load = useCallback(async () => {
    try { setLoading(true); setError(""); const res = await getAllBench(); setBench(res.data || []); }
    catch (err) { setError(err?.message || "Failed to load"); setBench([]); }
    finally { setLoading(false); }
  }, []);

  const loadJobs = useCallback(async () => {
    try { const res = await getAllJobs(); setJobs(res.data || []); }
    catch { setJobs([]); }
  }, []);

  useEffect(() => { load(); loadJobs(); }, [load, loadJobs]);

  const filtered = bench.filter(p => {
    const q = search.toLowerCase();
    const mQ = !q || p.name?.toLowerCase().includes(q) || p.skills?.toLowerCase().includes(q) || p.bench_id?.toLowerCase().includes(q);
    const mS = !statusF || p.status === statusF;
    return mQ && mS;
  });

  const stats = {
    total:        bench.length,
    available:    bench.filter(p => p.status === "Available").length,
    inInterview:  bench.filter(p => p.status === "In Interview").length,
    deployed:     bench.filter(p => p.status === "Deployed").length,
  };

  const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setAddFile(null); setFormOpen(true); };
  const openEdit   = p  => { setSelected(p); setFormData({ ...EMPTY_FORM, ...p }); setAddFile(null); setFormOpen(true); };
  const openDetail = p  => { setSelected(p); setDetailOpen(true); };
  const openDelete = p  => { setSelected(p); setDeleteOpen(true); };
  const openPdf    = p  => { setSelected(p); setPdfOpen(true); };

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        ...formData,
        experience:      formData.experience      ? Number(formData.experience)      : 0,
        current_salary:  formData.current_salary  ? Number(formData.current_salary)  : 0,
        expected_salary: formData.expected_salary ? Number(formData.expected_salary) : 0,
      };
      if (selected) {
        await updateBench(selected._id, payload);
        if (addFile) { const b64 = await toBase64(addFile); await uploadFile(selected._id, b64).catch(() => {}); }
      } else {
        const created = await createBench(payload);
        if (addFile && created?.data?._id) { const b64 = await toBase64(addFile); await uploadFile(created.data._id, b64).catch(() => {}); }
      }
      setAddFile(null); setFormOpen(false); load();
    } catch (err) { setError(err?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await deleteBench(selected._id); setDeleteOpen(false); load(); }
    catch (err) { setError(err?.message || "Delete failed"); }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (!files.length) return;
    if (inlineRef.current) inlineRef.current.value = "";
    const entries = files.map(f => ({ file: f, status: "pending", file_id: "", formData: { ...EMPTY_FORM }, saved: false, errorMsg: "" }));
    setInlineFiles(entries); setShowParsing(true);
    const updated = [...entries];
    await Promise.all(entries.map(async (entry, idx) => {
      updated[idx] = { ...updated[idx], status: "parsing" };
      setInlineFiles([...updated]);
      try {
        const b64    = await toBase64(entry.file);
        const result = await parsePdf(b64, entry.file.name);
        const parsed  = result.data || {};
        updated[idx] = {
          ...updated[idx], status: "done", file_id: result.file_id || "",
          formData: { ...EMPTY_FORM, ...parsed, experience: parsed.experience || "", current_salary: parsed.current_salary || "", expected_salary: parsed.expected_salary || "" },
        };
      } catch (err) {
        updated[idx] = { ...updated[idx], status: "error", file_id: err?.file_id || "", errorMsg: err?.message || "Auto-parse failed", formData: { ...EMPTY_FORM } };
      }
      setInlineFiles([...updated]);
    }));
  };

  const openBulkReview = () => { setBulkFiles(inlineFiles); setBulkStep(0); setBulkDone(false); setBulkOpen(true); };
  const clearInline    = () => { setShowParsing(false); setInlineFiles([]); };

  const handleBulkChange = e => {
    const { name, value } = e.target;
    setBulkFiles(prev => prev.map((entry, idx) =>
      idx !== bulkStep ? entry : { ...entry, formData: { ...entry.formData, [name]: value } }
    ));
  };

  const handleBulkSave = async () => {
    setBulkSaving(true);
    const entry = bulkFiles[bulkStep];
    try {
      const fd = entry.formData;
      await createBench({
        ...fd,
        experience:      fd.experience      ? Number(fd.experience)      : 0,
        current_salary:  fd.current_salary  ? Number(fd.current_salary)  : 0,
        expected_salary: fd.expected_salary ? Number(fd.expected_salary) : 0,
        file_id: entry.file_id || "",
      });
      setBulkFiles(prev => prev.map((e, i) => i === bulkStep ? { ...e, saved: true } : e));
      if (bulkStep < bulkFiles.length - 1) setBulkStep(s => s + 1);
      else { setBulkDone(true); load(); }
    } catch (err) {
      setBulkFiles(prev => prev.map((e, i) => i === bulkStep ? { ...e, errorMsg: err?.message || "Save failed" } : e));
    } finally { setBulkSaving(false); }
  };

  const handleBulkSkip = () => {
    if (bulkStep < bulkFiles.length - 1) setBulkStep(s => s + 1);
    else { setBulkDone(true); load(); }
  };

  const closeBulk    = () => { setBulkOpen(false); clearInline(); load(); };
  const savedCount   = bulkFiles.filter(f => f.saved).length;
  const currentEntry = bulkFiles[bulkStep];

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={48} /></Box>;

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" color="#0369a1" fontWeight={800}>Bench People</Typography>
          <Typography color="text.secondary" mt={0.5}>Manage internal bench resources available for deployment</Typography>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => inlineRef.current?.click()} size="large"
            sx={{ borderColor: "#0369a1", color: "#0369a1" }}>Upload Resume</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large"
            sx={{ bgcolor: "#0369a1", "&:hover": { bgcolor: "#075985" } }}>Add Person</Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5}>
        <Grid item xs={6} md={3}><StatCard title="Total"        value={stats.total}       color="#0369a1" icon={<Person />} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Available"    value={stats.available}   color="#15803d" icon={<CheckCircle />} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="In Interview" value={stats.inInterview} color="#c2410c" icon={<Person />} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Deployed"     value={stats.deployed}    color="#1d4ed8" icon={<Done />} /></Grid>
      </Grid>

      {/* Upload Zone */}
      {!showParsing
        ? <UploadZone onFiles={handleFileSelect} fileRef={inlineRef} />
        : <ParseProgress files={inlineFiles} onReview={openBulkReview} onClear={clearInline} />
      }

      {/* Filters */}
      <Box display="flex" gap={2} flexWrap="wrap">
        <TextField placeholder="Search by name, skills, or ID…" value={search}
          onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
        <TextField select value={statusF} onChange={e => setStatusF(e.target.value)} size="small" sx={{ minWidth: 160 }} label="Status">
          <MenuItem value="">All Statuses</MenuItem>
          {BENCH_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        {(search || statusF) && (
          <Button size="small" onClick={() => { setSearch(""); setStatusF(""); }} sx={{ textTransform: "none", color: "#64748b" }}>Clear</Button>
        )}
      </Box>

      {/* Table */}
      {bench.length === 0 && !error ? (
        <Card>
          <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: "#e0f2fe" }}>
              <Person sx={{ fontSize: 36, color: "#7dd3fc" }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary">No bench people yet</Typography>
            <Typography fontSize={14} color="text.disabled">Add people or upload resumes to build your bench.</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}
              sx={{ bgcolor: "#0369a1", "&:hover": { bgcolor: "#075985" } }}>Add Person</Button>
          </Box>
        </Card>
      ) : (
        <Card>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f0f9ff" }}>
                  {["Person", "Role", "Skills", "Experience", "Expected CTC", "Availability", "Last Client", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#0369a1" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>No bench people match your filters</TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: "#0369a1" }}>{nameInitials(p.name)}</Avatar>
                        <Box>
                          <Typography fontWeight={600} fontSize={13}>{p.name}</Typography>
                          <Typography fontSize={11} color="text.secondary">{p.bench_id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography fontSize={13}>{p.current_role || "—"}</Typography></TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {(p.skills || "").split(",").filter(Boolean).slice(0, 3).map((s, i) => (
                          <Chip key={i} label={s.trim()} size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#e0f2fe", color: "#0369a1" }} />
                        ))}
                        {(p.skills || "").split(",").filter(Boolean).length > 3 && (
                          <Chip label={`+${(p.skills || "").split(",").length - 3}`} size="small" sx={{ fontSize: 10, height: 20 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.experience} yrs</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{fmtSalary(p.expected_salary)}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{fmtDate(p.availability_date)}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.last_client || "—"}</TableCell>
                    <TableCell>
                      <Chip label={p.status} color={STATUS_COLOR[p.status] || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="View Details"><IconButton size="small" onClick={() => openDetail(p)}><Visibility fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={p.resume_file ? "View Resume PDF" : "No resume file"}>
                          <span>
                            <IconButton size="small" onClick={() => p.resume_file && openPdf(p)}
                              sx={{ color: p.resume_file ? "#c62828" : "#bdbdbd", cursor: p.resume_file ? "pointer" : "not-allowed" }}>
                              <PictureAsPdf fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDelete(p)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Card>
      )}

      {/* PDF Viewer */}
      <PdfViewer open={pdfOpen} onClose={() => setPdfOpen(false)} person={selected} />

      {/* Bulk Review Dialog */}
      <Dialog open={bulkOpen} onClose={closeBulk} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: "80vh" } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          <Box display="flex" alignItems="center" gap={1.5}><CloudUpload color="primary" />
            <Box>
              <Typography fontWeight={700} fontSize="1.1rem">Review &amp; Save Bench People</Typography>
              <Typography fontSize={12} color="text.secondary">AI-extracted details pre-filled · review and confirm each</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {!bulkDone && currentEntry && (
            <Box>
              <Box sx={{ borderBottom: "1px solid #e0e0e0", px: 3, pt: 2 }}>
                <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
                  {bulkFiles.map((entry, i) => (
                    <Chip key={i} label={`${i + 1}. ${entry.file.name.replace(".pdf", "").slice(0, 22)}`}
                      onClick={() => setBulkStep(i)}
                      color={entry.saved ? "success" : i === bulkStep ? "primary" : "default"}
                      variant={i === bulkStep ? "filled" : "outlined"} size="small"
                      icon={entry.saved ? <CheckCircle fontSize="small" /> : undefined}
                      sx={{ cursor: "pointer", fontWeight: i === bulkStep ? 700 : 400 }} />
                  ))}
                </Box>
                <Typography fontSize={12} color="text.secondary" pb={1.5}>
                  {savedCount} of {bulkFiles.length} saved · Reviewing: <strong>{currentEntry.file.name}</strong>
                </Typography>
              </Box>
              <Box p={3}>
                {currentEntry.saved ? (
                  <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={2}>
                    <CheckCircle color="success" sx={{ fontSize: 56 }} />
                    <Typography fontWeight={700} color="success.main">Saved!</Typography>
                    {bulkStep < bulkFiles.length - 1 && <Button variant="outlined" onClick={() => setBulkStep(s => s + 1)}>Next →</Button>}
                  </Box>
                ) : (
                  <>
                    <Grid container spacing={2} mb={2}>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Full Name" name="name" value={currentEntry.formData.name} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" required type="email" label="Email" name="email" value={currentEntry.formData.email} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" name="phone" value={currentEntry.formData.phone} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Location" name="location" value={currentEntry.formData.location} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Role" name="current_role" value={currentEntry.formData.current_role} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Experience (yrs)" name="experience" value={currentEntry.formData.experience} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12}><TextField fullWidth size="small" label="Skills (comma-separated)" name="skills" value={currentEntry.formData.skills} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Current Salary (₹)" name="current_salary" value={currentEntry.formData.current_salary} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={currentEntry.formData.expected_salary} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField select fullWidth size="small" label="Notice Period" name="notice_period" value={currentEntry.formData.notice_period} onChange={handleBulkChange}>
                          {NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Last Client" name="last_client" value={currentEntry.formData.last_client} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Last Project" name="last_project" value={currentEntry.formData.last_project} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField select fullWidth size="small" label="Status" name="status" value={currentEntry.formData.status} onChange={handleBulkChange}>
                          {BENCH_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Added By (Recruiter)" name="added_by" value={currentEntry.formData.added_by} onChange={handleBulkChange} /></Grid>
                    </Grid>
                    {currentEntry.errorMsg && <Alert severity="warning" sx={{ mt: 2 }}>{currentEntry.errorMsg}</Alert>}
                  </>
                )}
              </Box>
            </Box>
          )}
          {bulkDone && (
            <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: "#e8f5e9" }}><Done sx={{ fontSize: 48, color: "#2e7d32" }} /></Avatar>
              <Typography variant="h5" fontWeight={800} color="success.main">All Done!</Typography>
              <Typography color="text.secondary">{savedCount} of {bulkFiles.length} bench people saved.</Typography>
              <Button variant="contained" onClick={closeBulk} sx={{ bgcolor: "#0369a1" }}>Back to Bench</Button>
            </Box>
          )}
        </DialogContent>
        {!bulkDone && currentEntry && !currentEntry.saved && (
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0", gap: 1 }}>
            <Button disabled={bulkStep === 0} onClick={() => setBulkStep(s => s - 1)} startIcon={<NavigateBefore />}>Previous</Button>
            <Box flex={1} />
            <Button onClick={handleBulkSkip} color="inherit">Skip</Button>
            <Button variant="contained" onClick={handleBulkSave}
              disabled={bulkSaving || !currentEntry.formData.name || !currentEntry.formData.email}
              endIcon={bulkSaving ? <CircularProgress size={16} color="inherit" /> : <Done />}
              sx={{ bgcolor: "#0369a1", "&:hover": { bgcolor: "#075985" } }}>
              {bulkSaving ? "Saving…" : "Save & Next"}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          {selected ? "Edit Bench Person" : "Add Bench Person"}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="subtitle2" color="#0369a1" mb={1.5} fontWeight={700}>Personal Info</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Full Name" name="name" value={formData.name} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required type="email" label="Email" name="email" value={formData.email} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" name="phone" value={formData.phone} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Location" name="location" value={formData.location} onChange={handleChange} /></Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="#0369a1" mb={1.5} fontWeight={700}>Professional Details</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Role / Designation" name="current_role" value={formData.current_role} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Experience (years)" name="experience" value={formData.experience} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Employment Type" name="employment_type" value={formData.employment_type} onChange={handleChange}>
                  {EMPLOYMENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Added By (Recruiter)" name="added_by" value={formData.added_by} onChange={handleChange} /></Grid>
              <Grid item xs={12}><TextField fullWidth size="small" label="Skills (comma-separated)" name="skills" value={formData.skills} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Last Client" name="last_client" value={formData.last_client} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Last Project" name="last_project" value={formData.last_project} onChange={handleChange} /></Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="#0369a1" mb={1.5} fontWeight={700}>Compensation &amp; Availability</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Current Salary (₹)" name="current_salary" value={formData.current_salary} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={formData.expected_salary} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={4}>
                <TextField select fullWidth size="small" label="Notice Period" name="notice_period" value={formData.notice_period} onChange={handleChange}>
                  {NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Status" name="status" value={formData.status} onChange={handleChange}>
                  {BENCH_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <TextField fullWidth multiline rows={3} size="small" label="Notes" name="notes" value={formData.notes} onChange={handleChange} sx={{ mb: 2 }} />
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="#0369a1" mb={1.5} fontWeight={700}>Resume File (PDF)</Typography>
            <Box onClick={() => formFileRef.current?.click()} sx={{
              border: addFile ? "2px solid #2e7d32" : "2px dashed #7dd3fc", borderRadius: 2, p: 2,
              display: "flex", alignItems: "center", gap: 2, cursor: "pointer",
              bgcolor: addFile ? "#f1f8e9" : "#f0f9ff", transition: "all 0.2s",
              "&:hover": { bgcolor: addFile ? "#e8f5e9" : "#e0f2fe" },
            }}>
              <PictureAsPdf sx={{ fontSize: 32, color: addFile ? "#2e7d32" : "#7dd3fc", flexShrink: 0 }} />
              <Box flex={1}>
                {addFile
                  ? <><Typography fontWeight={700} fontSize={13} color="success.dark">{addFile.name}</Typography><Typography fontSize={11} color="text.secondary">{(addFile.size / 1024).toFixed(0)} KB</Typography></>
                  : <><Typography fontWeight={600} fontSize={13} color="#0369a1">{selected?.resume_file ? "Replace resume PDF" : "Attach resume PDF (optional)"}</Typography><Typography fontSize={11} color="text.secondary">Click to browse · PDF only</Typography></>
                }
              </Box>
              {addFile && <IconButton size="small" onClick={e => { e.stopPropagation(); setAddFile(null); }}><CloseIcon fontSize="small" /></IconButton>}
              <input ref={formFileRef} type="file" accept=".pdf,application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) setAddFile(f); e.target.value = ""; }} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#0369a1", "&:hover": { bgcolor: "#075985" } }}>
              {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              {selected ? "Update" : "Add Person"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: "70vh" } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>Bench Person Details</DialogTitle>
        {selected && (
          <BenchDetailContent
            person={selected}
            jobs={jobs}
            onClose={() => setDetailOpen(false)}
            onEdit={() => { setDetailOpen(false); openEdit(selected); }}
            onViewPdf={() => { setDetailOpen(false); openPdf(selected); }}
          />
        )}
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Remove from Bench</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove <strong>{selected?.name}</strong> from bench?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}