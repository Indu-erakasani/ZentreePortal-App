

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Card, CardContent, Typography, Button, TextField,
  MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  InputAdornment, Divider, LinearProgress, Grid,
} from "@mui/material";
import {
  Add, Search, Edit, Delete, Visibility,
  Description, Star, People, NewReleases, PersonOff,
  CloudUpload, CheckCircle, Done, NavigateBefore,
  Close as CloseIcon, PictureAsPdf, OpenInNew, Business,
} from "@mui/icons-material";

// ── API helpers ───────────────────────────────────────────────────────────────
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

const getAllResumes = (p = {}) => {
  const qs = new URLSearchParams(p).toString();
  return fetch(`${BASE}/resumes/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
};
const getTrackingByResume = (resume_id) =>
  fetch(`${BASE}/tracking/by-resume/${resume_id}`, { headers: getHeaders() }).then(handle);
const createResume = (payload) =>
  fetch(`${BASE}/resumes/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
const updateResume = (id, payload) =>
  fetch(`${BASE}/resumes/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
const deleteResume = (id) =>
  fetch(`${BASE}/resumes/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
const getAllJobs = () =>
  fetch(`${BASE}/jobs/`, { headers: getHeaders() }).then(handle);
const getAllClients = () =>
  fetch(`${BASE}/clients/`, { headers: getHeaders() }).then(handle);
const parsePdfViaBackend = (file_b64, file_name) =>
  fetch(`${BASE}/resumes/parse-pdf`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify({ file_b64, file_name }),
  }).then(handle);
const uploadFileForCandidate = (id, file_b64) =>
  fetch(`${BASE}/resumes/${id}/upload-file`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify({ file_b64 }),
  }).then(handle);

const toBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(file);
  });

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUSES = ["New", "In Review", "Shortlisted", "Interviewed", "Offered", "Hired", "Rejected", "On Hold"];
const SOURCES  = ["LinkedIn", "Naukri", "Indeed", "Referral", "Job Portal", "Direct", "Other"];
const NOTICES  = ["Immediate", "15 days", "30 days", "60 days", "90 days"];
const EXP_BANDS = [
  { label: "All Experience", min: "",   max: ""   },
  { label: "0–2 years",      min: "0",  max: "2"  },
  { label: "3–5 years",      min: "3",  max: "5"  },
  { label: "6–10 years",     min: "6",  max: "10" },
  { label: "10+ years",      min: "10", max: ""   },
];
const STATUS_COLOR = {
  New: "default", "In Review": "info", Shortlisted: "primary",
  Interviewed: "warning", Offered: "success", Hired: "success",
  Rejected: "error", "On Hold": "warning",
};
const STAGE_COLOR = {
  Screening: "default",
  "Technical Round 1": "info", "Technical Round 2": "info",
  "HR Round": "primary", "Manager Round": "primary", "Final Round": "primary",
  "Offer Stage": "warning", Negotiation: "warning",
  "Offer Accepted": "success", Joined: "success",
  "Offer Declined": "error", Rejected: "error", Withdrawn: "error",
};
const SCORE_LABEL = ["", "Poor", "Below Avg", "Average", "Good", "Excellent"];
const EMPTY_FORM = {
  name: "", email: "", phone: "", current_role: "", current_company: "",
  experience: "", skills: "", location: "", current_salary: "",
  expected_salary: "", notice_period: "30 days", source: "LinkedIn",
  status: "New", linked_job_id: "", linked_job_title: "", notes: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtSalary = (v) => {
  if (!v) return "—";
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${Number(v).toLocaleString("en-IN")}`;
};
const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color }) => (
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

// ── Inline upload drop-zone ───────────────────────────────────────────────────
const InlineUploadZone = ({ onFiles, fileRef }) => {
  const [drag, setDrag] = useState(false);
  return (
    <Box
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); onFiles({ target: { files: e.dataTransfer.files } }); }}
      onClick={() => fileRef.current?.click()}
      sx={{
        border: drag ? "2px dashed #1565c0" : "2px dashed #90caf9",
        borderRadius: 3, bgcolor: drag ? "#e3f2fd" : "#f8fbff",
        p: 2.5, display: "flex", alignItems: "center", gap: 2.5,
        cursor: "pointer", transition: "all 0.2s",
        "&:hover": { bgcolor: "#e3f2fd", borderColor: "#1565c0" },
      }}
    >
      <Avatar sx={{ width: 52, height: 52, bgcolor: drag ? "#1565c0" : "#e3f2fd", transition: "all 0.2s", flexShrink: 0 }}>
        <CloudUpload sx={{ fontSize: 28, color: drag ? "#fff" : "#1565c0" }} />
      </Avatar>
      <Box flex={1}>
        <Typography fontWeight={700} color="primary.dark" fontSize="0.95rem">
          Drag &amp; drop PDF resumes here to upload
        </Typography>
        <Typography fontSize={12} color="text.secondary" mt={0.3}>
          AI will auto-extract candidate details · Multiple files supported · PDF only · Original file will be stored
        </Typography>
      </Box>
      <input ref={fileRef} type="file" accept=".pdf,application/pdf" multiple hidden onChange={onFiles} />
    </Box>
  );
};

// ── Inline parsing progress ───────────────────────────────────────────────────
const InlineParseProgress = ({ files, onReview, onClear }) => {
  const allDone = files.every(f => f.status !== "parsing" && f.status !== "pending");
  const parsed  = files.filter(f => f.status === "done").length;
  const manual  = files.filter(f => f.status === "error").length;
  return (
    <Card variant="outlined" sx={{ borderColor: "#90caf9", borderRadius: 2 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            {!allDone && <CircularProgress size={14} />}
            <Typography fontWeight={700} fontSize="0.88rem">
              {allDone
                ? `Parsing complete — ${parsed} parsed${manual ? `, ${manual} need manual entry` : ""}`
                : `Parsing ${files.length} resume${files.length > 1 ? "s" : ""} with AI…`}
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            {allDone && (
              <Button variant="contained" size="small" onClick={onReview} startIcon={<Done />}>
                Review &amp; Save
              </Button>
            )}
            <IconButton size="small" onClick={onClear}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={0.8}>
          {files.map((entry, i) => (
            <Box key={i} display="flex" alignItems="center" gap={1.5}
              sx={{ p: 1, bgcolor: "#f5f7fa", borderRadius: 1.5 }}>
              <Description fontSize="small" color="action" sx={{ flexShrink: 0 }} />
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
        </Box>
      </CardContent>
    </Card>
  );
};

// ── PDF Viewer Dialog ─────────────────────────────────────────────────────────
const PdfViewerDialog = ({ open, onClose, candidate }) => {
  const [blobUrl,  setBlobUrl]  = React.useState(null);
  const [fetching, setFetching] = React.useState(false);
  const [fetchErr, setFetchErr] = React.useState("");

  React.useEffect(() => {
    if (!open || !candidate?._id || !candidate?.resume_file) return;
    let objectUrl = null;
    setFetching(true); setFetchErr("");
    fetch(`${BASE}/resumes/${candidate._id}/file`, { headers: getHeaders() })
      .then(res => { if (!res.ok) throw new Error(`Server returned ${res.status}`); return res.blob(); })
      .then(blob => { objectUrl = URL.createObjectURL(blob); setBlobUrl(objectUrl); })
      .catch(err => setFetchErr(err.message || "Failed to load PDF"))
      .finally(() => setFetching(false));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); setBlobUrl(null); setFetchErr(""); };
  }, [open, candidate?._id, candidate?.resume_file]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${(candidate?.name || "resume").replace(/\s+/g, "_")}_resume.pdf`;
    a.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { height: "92vh", display: "flex", flexDirection: "column" } }}>
      <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", py: 1.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <PictureAsPdf color="error" />
            <Box>
              <Typography fontWeight={700}>{candidate?.name} — Original Resume</Typography>
              <Typography fontSize={11} color="text.secondary">
                {candidate?.resume_id} · {candidate?.current_role}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            {blobUrl && (
              <Tooltip title="Download PDF">
                <IconButton size="small" onClick={handleDownload}><OpenInNew fontSize="small" /></IconButton>
              </Tooltip>
            )}
            <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden", position: "relative" }}>
        {fetching && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}>
            <CircularProgress size={40} />
            <Typography color="text.secondary" fontSize={14}>Loading resume…</Typography>
          </Box>
        )}
        {!fetching && fetchErr && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2} p={3}>
            <PictureAsPdf sx={{ fontSize: 72, color: "#ef9a9a" }} />
            <Typography color="error" fontWeight={600}>Could not load PDF</Typography>
            <Typography fontSize={13} color="text.secondary">{fetchErr}</Typography>
          </Box>
        )}
        {!fetching && !fetchErr && !candidate?.resume_file && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}>
            <PictureAsPdf sx={{ fontSize: 72, color: "#bdbdbd" }} />
            <Typography color="text.secondary" fontWeight={600}>No resume file for this candidate</Typography>
          </Box>
        )}
        {!fetching && blobUrl && (
          <iframe src={blobUrl} title={`${candidate?.name} Resume`} style={{ width: "100%", height: "100%", border: "none" }} />
        )}
      </DialogContent>
    </Dialog>
  );
};
const createTracking = (payload) =>
  fetch(`${BASE}/tracking/`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handle);
const STAGES = [
  "Screening", "Technical Round 1", "Technical Round 2",
  "HR Round", "Manager Round", "Final Round",
  "Offer Stage", "Negotiation", "Offer Accepted",
  "Offer Declined", "Joined", "Rejected", "Withdrawn",
];

function CandidateDetailContent({ candidate, jobs, onClose, onEdit, onViewPdf }) {
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
    getTrackingByResume(candidate.resume_id)
      .then(res => setTracking(res.data || []))
      .catch(() => setTracking([]))
      .finally(() => setLoadingT(false));
  }, [candidate.resume_id]);

  React.useEffect(() => { loadTracking(); }, [loadTracking]);

  const activeTrack = tracking[0];

  const handlePipeChange = e =>
    setPipeForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleAddPipeline = async () => {
    if (!pipeForm.job_id) { setPipeError("Please select a job"); return; }
    setPipeSaving(true); setPipeError("");
    try {
      const job = jobs.find(j => j._id === pipeForm.job_id);
      await createTracking({
        resume_id:      candidate.resume_id?.trim(),
        candidate_name: candidate.name,
        job_id:         pipeForm.job_id,
        job_title:      job?.title || "",
        client_name:    job?.client_name || "",
        current_stage:  pipeForm.current_stage,
        recruiter:      pipeForm.recruiter,
        notes:          pipeForm.notes,
        next_step:      pipeForm.next_step,
        pipeline_status: "Active",
      });
      setAddPipeline(false);
      setPipeForm({ job_id: "", current_stage: "Screening", recruiter: "", notes: "", next_step: "" });
      loadTracking();   // ← refresh pipeline tab
    } catch (err) {
      setPipeError(err?.message || "Failed to add to pipeline");
    } finally { setPipeSaving(false); }
  };

  return (
    <>
      <DialogContent sx={{ p: 0 }}>

        {/* ── Header strip ── */}
        <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: "1px solid #e0e0e0" }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "#1a237e", fontSize: "1.3rem", fontWeight: 700 }}>
              {nameInitials(candidate.name)}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={800}>{candidate.name}</Typography>
              <Typography color="text.secondary" fontSize={13}>
                {candidate.current_role}{candidate.current_company ? ` · ${candidate.current_company}` : ""}
              </Typography>
              <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                <Chip label={candidate.status} color={STATUS_COLOR[candidate.status] || "default"} size="small" sx={{ fontWeight: 700 }} />
                {activeTrack && (
                  <Chip label={`Pipeline: ${activeTrack.current_stage}`}
                    color={STAGE_COLOR[activeTrack.current_stage] || "default"}
                    size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                )}
                {activeTrack && (
                  <Chip label={activeTrack.pipeline_status} size="small" sx={{ fontSize: 10, bgcolor: "#f5f5f5" }} />
                )}
              </Box>
            </Box>
          </Box>

          {/* Tabs */}
          <Box display="flex" mt={2}>
            {["Profile & Resume", "Pipeline & Interviews"].map((label, i) => (
              <Box key={i} onClick={() => { setTab(i); setAddPipeline(false); }} sx={{
                px: 2, py: 1, cursor: "pointer",
                fontWeight: tab === i ? 700 : 400, fontSize: 13,
                borderBottom: tab === i ? "2px solid #1a237e" : "2px solid transparent",
                color: tab === i ? "#1a237e" : "text.secondary",
                transition: "all 0.15s",
              }}>
                {label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* ══ TAB 0 — Profile ═════════════════════════════════════════════════ */}
        {tab === 0 && (
          <Box p={3}>
            <Grid container spacing={2} mb={2}>
              {[
                ["Email",           candidate.email],
                ["Phone",           candidate.phone || "—"],
                ["Location",        candidate.location || "—"],
                ["Experience",      `${candidate.experience} years`],
                ["Current Salary",  fmtSalary(candidate.current_salary)],
                ["Expected Salary", fmtSalary(candidate.expected_salary)],
                ["Notice Period",   candidate.notice_period || "—"],
                ["Source",          candidate.source || "—"],
              ].map(([label, val]) => (
                <Grid item xs={6} sm={4} key={label}>
                  <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
                  <Typography fontWeight={600} fontSize={13}>{val}</Typography>
                </Grid>
              ))}
            </Grid>

            {candidate.skills && (
              <Box mb={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={1}>Skills</Typography>
                <Box display="flex" flexWrap="wrap" gap={0.8}>
                  {candidate.skills.split(",").filter(Boolean).map((s, i) => (
                    <Chip key={i} label={s.trim()} size="small" variant="outlined"
                      sx={{ fontSize: 11, borderColor: "#1a237e", color: "#1a237e" }} />
                  ))}
                </Box>
              </Box>
            )}

            {candidate.linked_job_title && (
              <Box p={1.5} bgcolor="#e8eaf6" borderRadius={2} mb={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.3}>Applied For</Typography>
                <Typography fontWeight={700} color="primary.dark">{candidate.linked_job_title}</Typography>
              </Box>
            )}

            {candidate.notes && (
              <Box p={1.5} bgcolor="#f5f5f5" borderRadius={2} mb={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.3}>Notes</Typography>
                <Typography fontSize={13}>{candidate.notes}</Typography>
              </Box>
            )}

            <Box p={2} borderRadius={2} display="flex" alignItems="center" gap={2}
              sx={{ bgcolor: "#f5f5f5", border: "1px solid #e0e0e0" }}>
              <Box flex={1}>
                <Typography fontWeight={700} fontSize={13} color={candidate.resume_file ? "success.dark" : "text.secondary"}>
                  {candidate.resume_file ? "Original Resume PDF" : "No resume file uploaded"}
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  {candidate.resume_file ? `Stored as ${candidate.resume_file} · click to view` : "Upload via drag-and-drop to attach the original resume"}
                </Typography>
              </Box>
              {candidate.resume_file && (
                <Button variant="contained" size="small" onClick={onViewPdf}>View PDF</Button>
              )}
            </Box>
          </Box>
        )}

        {/* ══ TAB 1 — Pipeline & Interviews ═══════════════════════════════════ */}
        {tab === 1 && (
          <Box p={3}>

            {/* ── Add to Pipeline form ── */}
            {addPipeline ? (
              <Box mb={3} p={2.5} borderRadius={2}
                sx={{ border: "1.5px solid #1a237e", bgcolor: "#f8f9ff" }}>
                <Typography fontWeight={700} fontSize={14} color="#1a237e" mb={2}>
                  Add to Pipeline
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField select  sx={{ width: "100%", minWidth: 350 }} size="small" required label="Select Job" name="job_id"
                      value={pipeForm.job_id} onChange={handlePipeChange}>
                      <MenuItem value="">— Select a job —</MenuItem>
                      {jobs.map(j => (
                        <MenuItem key={j._id} value={j._id}>
                          <Box>
                            <Typography fontSize={13} fontWeight={600}>{j.title}</Typography>
                            {j.client_name && <Typography fontSize={11} color="text.secondary">{j.client_name}</Typography>}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select sx={{ width: "100%", minWidth: 350 }} size="small" label="Starting Stage" name="current_stage"
                      value={pipeForm.current_stage} onChange={handlePipeChange}>
                      {STAGES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField sx={{ width: "100%", minWidth: 350 }} size="small" label="Recruiter" name="recruiter"
                      value={pipeForm.recruiter} onChange={handlePipeChange}
                      placeholder="Recruiter name" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField sx={{ width: "100%", minWidth: 350 }} size="small" label="Next Step" name="next_step"
                      value={pipeForm.next_step} onChange={handlePipeChange}
                      placeholder="e.g. Schedule technical interview" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField sx={{ width: "100%", minWidth: 700 }} multiline rows={2} size="small" label="Notes" name="notes"
                      value={pipeForm.notes} onChange={handlePipeChange} />
                  </Grid>
                </Grid>

                {pipeError && <Alert severity="error" sx={{ mt: 1.5 }}>{pipeError}</Alert>}

                <Box display="flex" gap={1} mt={2} justifyContent="flex-end">
                  <Button size="small" onClick={() => { setAddPipeline(false); setPipeError(""); }}
                    sx={{ textTransform: "none", color: "#64748b" }}>
                    Cancel
                  </Button>
                  <Button size="small" variant="contained" onClick={handleAddPipeline}
                    disabled={pipeSaving || !pipeForm.job_id}
                    sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#1a237e", "&:hover": { bgcolor: "#0d1757" } }}
                    endIcon={pipeSaving ? <CircularProgress size={14} color="#fff" /> : null}>
                    {pipeSaving ? "Adding…" : "Add to Pipeline"}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button size="small" variant="outlined" onClick={() => setAddPipeline(true)}
                  sx={{ textTransform: "none", fontWeight: 700, borderColor: "#1a237e", color: "#1a237e" }}>
                  + Add to Pipeline
                </Button>
              </Box>
            )}

            {/* ── Pipeline records ── */}
            {loadingT ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress size={32} /></Box>
            ) : tracking.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1}>
                <Typography color="text.secondary" fontWeight={600}>No pipeline records found</Typography>
                <Typography fontSize={13} color="text.disabled">
                  Click "Add to Pipeline" above to start tracking this candidate.
                </Typography>
              </Box>
            ) : tracking.map((track, tIdx) => (
              <Box key={track._id} mb={tIdx < tracking.length - 1 ? 4 : 0}>

                {/* Track header */}
                <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
                  <Chip label={track.current_stage} color={STAGE_COLOR[track.current_stage] || "default"} size="small" sx={{ fontWeight: 700 }} />
                  <Chip label={track.pipeline_status} size="small" variant="outlined" />
                  {track.recruiter   && <Typography fontSize={12} color="text.secondary">Recruiter: <strong>{track.recruiter}</strong></Typography>}
                  {track.job_title   && <Typography fontSize={12} color="text.secondary">Job: <strong>{track.job_title}</strong></Typography>}
                  {track.client_name && <Typography fontSize={12} color="text.secondary">Client: <strong>{track.client_name}</strong></Typography>}
                </Box>

                {/* Stage timeline */}
                {track.stage_history?.length > 0 && (
                  <Box mb={3}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={1.5}>Stage History</Typography>
                    <Box display="flex" flexDirection="column" gap={0}>
                      {track.stage_history.map((entry, i) => (
                        <Box key={i} display="flex" gap={1.5} alignItems="flex-start">
                          <Box display="flex" flexDirection="column" alignItems="center" sx={{ pt: 0.3 }}>
                            <Box sx={{
                              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                              bgcolor: i === track.stage_history.length - 1 ? "#1a237e" : "#90caf9",
                              border: "2px solid",
                              borderColor: i === track.stage_history.length - 1 ? "#1a237e" : "#e3f2fd",
                            }} />
                            {i < track.stage_history.length - 1 && (
                              <Box sx={{ width: 2, flexGrow: 1, minHeight: 20, bgcolor: "#e3f2fd", my: 0.3 }} />
                            )}
                          </Box>
                          <Box pb={1.5}>
                            <Typography fontWeight={600} fontSize={13}>{entry.stage}</Typography>
                            <Typography fontSize={11} color="text.secondary">
                              {fmtDate(entry.entered_at)}
                              {entry.exited_at ? ` → ${fmtDate(entry.exited_at)}` : " · current"}
                            </Typography>
                            {entry.notes && <Typography fontSize={12} color="text.secondary" mt={0.3}>{entry.notes}</Typography>}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Interviews */}
                {track.interviews?.length > 0 && (
                  <Box mb={3}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={1.5}>
                      Interviews ({track.interviews.length})
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {track.interviews.map((iv, i) => (
                        <Box key={i} p={2} borderRadius={2} sx={{ border: "1px solid #e0e0e0", bgcolor: "#fafafa" }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Box>
                              <Typography fontWeight={700} fontSize={13}>Round {i + 1} — {iv.interview_type}</Typography>
                              <Typography fontSize={11} color="text.secondary">{iv.interviewer} · {fmtDate(iv.interview_date)}</Typography>
                            </Box>
                            <Box display="flex" gap={1} alignItems="center">
                              <Box display="flex" gap={0.4}>
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Box key={s} sx={{
                                    width: 12, height: 12, borderRadius: 1,
                                    bgcolor: s <= (iv.feedback_score || 0) ? "#1a237e" : "#e0e0e0",
                                  }} />
                                ))}
                              </Box>
                              <Typography fontSize={11} fontWeight={700} color="#1a237e">
                                {SCORE_LABEL[iv.feedback_score] || "—"}
                              </Typography>
                            </Box>
                          </Box>
                          {iv.feedback_summary && <Typography fontSize={12} mb={1}>{iv.feedback_summary}</Typography>}
                          <Box display="flex" gap={2} flexWrap="wrap">
                            {iv.strengths?.length > 0 && (
                              <Box flex={1} minWidth={120}>
                                <Typography fontSize={10} fontWeight={700} color="#2e7d32" textTransform="uppercase" mb={0.5}>Strengths</Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.4}>
                                  {iv.strengths.map((s, si) => (
                                    <Chip key={si} label={s} size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#e8f5e9", color: "#1b5e20" }} />
                                  ))}
                                </Box>
                              </Box>
                            )}
                            {iv.weaknesses?.length > 0 && (
                              <Box flex={1} minWidth={120}>
                                <Typography fontSize={10} fontWeight={700} color="#c62828" textTransform="uppercase" mb={0.5}>Areas to Improve</Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.4}>
                                  {iv.weaknesses.map((w, wi) => (
                                    <Chip key={wi} label={w} size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#ffebee", color: "#b71c1c" }} />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                          {iv.recommendation && (
                            <Box mt={1}>
                              <Chip label={`Recommendation: ${iv.recommendation}`} size="small"
                                color={iv.recommendation === "Strong Hire" ? "success" : iv.recommendation === "Hire" ? "primary" : iv.recommendation === "No Hire" ? "error" : "default"}
                                sx={{ fontSize: 10, fontWeight: 700 }} />
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Offer details */}
                {(track.salary_offered > 0 || track.offer_status !== "Pending" || track.offer_date || track.joining_date) && (
                  <Box mb={3} p={2} borderRadius={2} sx={{ bgcolor: "#f3f8ff", border: "1px solid #bbdefb" }}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={1.5}>Offer Details</Typography>
                    <Grid container spacing={1.5}>
                      {[
                        ["Salary Offered", track.salary_offered ? fmtSalary(track.salary_offered) : "—"],
                        ["Offer Status",   track.offer_status || "—"],
                        ["Offer Date",     fmtDate(track.offer_date)],
                        ["Joining Date",   fmtDate(track.joining_date)],
                      ].map(([label, val]) => (
                        <Grid item xs={6} key={label}>
                          <Typography fontSize={11} color="text.secondary" fontWeight={600}>{label}</Typography>
                          <Typography fontWeight={700} fontSize={13}>{val}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Next step / rejection */}
                {(track.next_step || track.rejection_reason) && (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {track.next_step && (
                      <Box p={1.5} bgcolor="#fffde7" borderRadius={2} sx={{ border: "1px solid #fff176" }}>
                        <Typography fontSize={11} fontWeight={600} color="#f57f17" textTransform="uppercase">Next Step</Typography>
                        <Typography fontSize={13}>{track.next_step}</Typography>
                        {track.next_date && <Typography fontSize={11} color="text.secondary">Due: {fmtDate(track.next_date)}</Typography>}
                      </Box>
                    )}
                    {track.rejection_reason && (
                      <Box p={1.5} bgcolor="#ffebee" borderRadius={2} sx={{ border: "1px solid #ffcdd2" }}>
                        <Typography fontSize={11} fontWeight={600} color="#c62828" textTransform="uppercase">Rejection Reason</Typography>
                        <Typography fontSize={13}>{track.rejection_reason}</Typography>
                      </Box>
                    )}
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
        <Button variant="contained" onClick={onEdit}>Edit</Button>
      </DialogActions>
    </>
  );
}

// ── CandidateDetailContent ─────────────────────────────────────────────────────
// IMPORTANT: defined OUTSIDE Resumes() — prevents React from recreating it on
// every render, which was destroying the tracking state before it could load.
function CandidateDetailContent1({ candidate, jobs, onClose, onEdit, onViewPdf }) {
  const [tracking, setTracking] = React.useState([]);
  const [loadingT, setLoadingT] = React.useState(true);
  const [tab, setTab]           = React.useState(0); // 0 = Profile, 1 = Pipeline

  React.useEffect(() => {
    setLoadingT(true);
    getTrackingByResume(candidate.resume_id)
      .then(res => setTracking(res.data || []))
      .catch(() => setTracking([]))
      .finally(() => setLoadingT(false));
  }, [candidate.resume_id]);

  const activeTrack = tracking[0];

  return (
    <>
      <DialogContent sx={{ p: 0 }}>

        {/* ── Top header strip ── */}
        <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: "1px solid #e0e0e0" }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "#1a237e", fontSize: "1.3rem", fontWeight: 700 }}>
              {nameInitials(candidate.name)}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={800}>{candidate.name}</Typography>
              <Typography color="text.secondary" fontSize={13}>
                {candidate.current_role}{candidate.current_company ? ` · ${candidate.current_company}` : ""}
              </Typography>
              <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                <Chip label={candidate.status} color={STATUS_COLOR[candidate.status] || "default"} size="small" sx={{ fontWeight: 700 }} />
                {activeTrack && (
                  <Chip label={`Pipeline: ${activeTrack.current_stage}`}
                    color={STAGE_COLOR[activeTrack.current_stage] || "default"}
                    size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                )}
                {activeTrack && (
                  <Chip label={activeTrack.pipeline_status} size="small" sx={{ fontSize: 10, bgcolor: "#f5f5f5" }} />
                )}
              </Box>
            </Box>
          </Box>

          {/* Tabs */}
          <Box display="flex" mt={2}>
            {["Profile & Resume", "Pipeline & Interviews"].map((label, i) => (
              <Box key={i} onClick={() => setTab(i)} sx={{
                px: 2, py: 1, cursor: "pointer",
                fontWeight: tab === i ? 700 : 400, fontSize: 13,
                borderBottom: tab === i ? "2px solid #1a237e" : "2px solid transparent",
                color: tab === i ? "#1a237e" : "text.secondary",
                transition: "all 0.15s",
              }}>
                {label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* ══ TAB 0 — Profile ══════════════════════════════════════════════════ */}
        {tab === 0 && (
          <Box p={3}>
            <Grid container spacing={2} mb={2}>
              {[
                ["Email",          candidate.email],
                ["Phone",          candidate.phone || "—"],
                ["Location",       candidate.location || "—"],
                ["Experience",     `${candidate.experience} years`],
                ["Current Salary", fmtSalary(candidate.current_salary)],
                ["Expected Salary",fmtSalary(candidate.expected_salary)],
                ["Notice Period",  candidate.notice_period || "—"],
                ["Source",         candidate.source || "—"],
              ].map(([label, val]) => (
                <Grid item xs={6} sm={4} key={label}>
                  <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
                  <Typography fontWeight={600} fontSize={13}>{val}</Typography>
                </Grid>
              ))}
            </Grid>

            {candidate.skills && (
              <Box mb={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={1}>Skills</Typography>
                <Box display="flex" flexWrap="wrap" gap={0.8}>
                  {candidate.skills.split(",").filter(Boolean).map((s, i) => (
                    <Chip key={i} label={s.trim()} size="small" variant="outlined"
                      sx={{ fontSize: 11, borderColor: "#1a237e", color: "#1a237e" }} />
                  ))}
                </Box>
              </Box>
            )}

            {candidate.linked_job_title && (
              <Box p={1.5} bgcolor="#e8eaf6" borderRadius={2} mb={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.3}>Applied For</Typography>
                <Typography fontWeight={700} color="primary.dark">{candidate.linked_job_title}</Typography>
              </Box>
            )}

            {candidate.notes && (
              <Box p={1.5} bgcolor="#f5f5f5" borderRadius={2} mb={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.3}>Notes</Typography>
                <Typography fontSize={13}>{candidate.notes}</Typography>
              </Box>
            )}

            {/* PDF section */}
            <Box p={2} borderRadius={2} display="flex" alignItems="center" gap={2}
              sx={{ bgcolor: "#f5f5f5", border: "1px solid #e0e0e0" }}>
              <Box flex={1}>
                <Typography fontWeight={700} fontSize={13} color={candidate.resume_file ? "success.dark" : "text.secondary"}>
                  {candidate.resume_file ? "Original Resume PDF" : "No resume file uploaded"}
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  {candidate.resume_file
                    ? `Stored as ${candidate.resume_file} · click to view`
                    : "Upload via drag-and-drop to attach the original resume"}
                </Typography>
              </Box>
              {candidate.resume_file && (
                <Button variant="contained" size="small" onClick={onViewPdf}>View PDF</Button>
              )}
            </Box>
          </Box>
        )}

        {/* ══ TAB 1 — Pipeline & Interviews ════════════════════════════════════ */}
        {tab === 1 && (
          <Box p={3}>
            {loadingT ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress size={32} /></Box>
            ) : tracking.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1}>
                <Typography color="text.secondary" fontWeight={600}>No pipeline records found</Typography>
                <Typography fontSize={13} color="text.disabled">
                  This candidate hasn't been added to a pipeline yet.
                </Typography>
              </Box>
            ) : tracking.map((track, tIdx) => (
              <Box key={track._id} mb={tIdx < tracking.length - 1 ? 4 : 0}>

                {/* Track header */}
                <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
                  <Chip label={track.current_stage} color={STAGE_COLOR[track.current_stage] || "default"} size="small" sx={{ fontWeight: 700 }} />
                  <Chip label={track.pipeline_status} size="small" variant="outlined" />
                  {track.recruiter   && <Typography fontSize={12} color="text.secondary">Recruiter: <strong>{track.recruiter}</strong></Typography>}
                  {track.job_title   && <Typography fontSize={12} color="text.secondary">Job: <strong>{track.job_title}</strong></Typography>}
                  {track.client_name && <Typography fontSize={12} color="text.secondary">Client: <strong>{track.client_name}</strong></Typography>}
                </Box>

                {/* Stage timeline */}
                {track.stage_history?.length > 0 && (
                  <Box mb={3}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={1.5}>Stage History</Typography>
                    <Box display="flex" flexDirection="column" gap={0}>
                      {track.stage_history.map((entry, i) => (
                        <Box key={i} display="flex" gap={1.5} alignItems="flex-start">
                          <Box display="flex" flexDirection="column" alignItems="center" sx={{ pt: 0.3 }}>
                            <Box sx={{
                              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                              bgcolor: i === track.stage_history.length - 1 ? "#1a237e" : "#90caf9",
                              border: "2px solid",
                              borderColor: i === track.stage_history.length - 1 ? "#1a237e" : "#e3f2fd",
                            }} />
                            {i < track.stage_history.length - 1 && (
                              <Box sx={{ width: 2, flexGrow: 1, minHeight: 20, bgcolor: "#e3f2fd", my: 0.3 }} />
                            )}
                          </Box>
                          <Box pb={1.5}>
                            <Typography fontWeight={600} fontSize={13}>{entry.stage}</Typography>
                            <Typography fontSize={11} color="text.secondary">
                              {fmtDate(entry.entered_at)}
                              {entry.exited_at ? ` → ${fmtDate(entry.exited_at)}` : " · current"}
                            </Typography>
                            {entry.notes && <Typography fontSize={12} color="text.secondary" mt={0.3}>{entry.notes}</Typography>}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Interviews */}
                {track.interviews?.length > 0 && (
                  <Box mb={3}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={1.5}>
                      Interviews ({track.interviews.length})
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {track.interviews.map((iv, i) => (
                        <Box key={i} p={2} borderRadius={2} sx={{ border: "1px solid #e0e0e0", bgcolor: "#fafafa" }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Box>
                              <Typography fontWeight={700} fontSize={13}>Round {i + 1} — {iv.interview_type}</Typography>
                              <Typography fontSize={11} color="text.secondary">{iv.interviewer} · {fmtDate(iv.interview_date)}</Typography>
                            </Box>
                            <Box display="flex" gap={1} alignItems="center">
                              <Box display="flex" gap={0.4}>
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Box key={s} sx={{
                                    width: 12, height: 12, borderRadius: 1,
                                    bgcolor: s <= (iv.feedback_score || 0) ? "#1a237e" : "#e0e0e0",
                                  }} />
                                ))}
                              </Box>
                              <Typography fontSize={11} fontWeight={700} color="#1a237e">
                                {SCORE_LABEL[iv.feedback_score] || "—"}
                              </Typography>
                            </Box>
                          </Box>

                          {iv.feedback_summary && <Typography fontSize={12} mb={1}>{iv.feedback_summary}</Typography>}

                          <Box display="flex" gap={2} flexWrap="wrap">
                            {iv.strengths?.length > 0 && (
                              <Box flex={1} minWidth={120}>
                                <Typography fontSize={10} fontWeight={700} color="#2e7d32" textTransform="uppercase" mb={0.5}>Strengths</Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.4}>
                                  {iv.strengths.map((s, si) => (
                                    <Chip key={si} label={s} size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#e8f5e9", color: "#1b5e20" }} />
                                  ))}
                                </Box>
                              </Box>
                            )}
                            {iv.weaknesses?.length > 0 && (
                              <Box flex={1} minWidth={120}>
                                <Typography fontSize={10} fontWeight={700} color="#c62828" textTransform="uppercase" mb={0.5}>Areas to Improve</Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.4}>
                                  {iv.weaknesses.map((w, wi) => (
                                    <Chip key={wi} label={w} size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#ffebee", color: "#b71c1c" }} />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>

                          {iv.recommendation && (
                            <Box mt={1}>
                              <Chip label={`Recommendation: ${iv.recommendation}`} size="small"
                                color={
                                  iv.recommendation === "Strong Hire" ? "success"
                                  : iv.recommendation === "Hire" ? "primary"
                                  : iv.recommendation === "No Hire" ? "error"
                                  : "default"
                                }
                                sx={{ fontSize: 10, fontWeight: 700 }} />
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Offer details */}
                {(track.salary_offered > 0 || track.offer_status !== "Pending" || track.offer_date || track.joining_date) && (
                  <Box mb={3} p={2} borderRadius={2} sx={{ bgcolor: "#f3f8ff", border: "1px solid #bbdefb" }}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={1.5}>Offer Details</Typography>
                    <Grid container spacing={1.5}>
                      {[
                        ["Salary Offered", track.salary_offered ? fmtSalary(track.salary_offered) : "—"],
                        ["Offer Status",   track.offer_status || "—"],
                        ["Offer Date",     fmtDate(track.offer_date)],
                        ["Joining Date",   fmtDate(track.joining_date)],
                      ].map(([label, val]) => (
                        <Grid item xs={6} key={label}>
                          <Typography fontSize={11} color="text.secondary" fontWeight={600}>{label}</Typography>
                          <Typography fontWeight={700} fontSize={13}>{val}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Next step / rejection */}
                {(track.next_step || track.rejection_reason) && (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {track.next_step && (
                      <Box p={1.5} bgcolor="#fffde7" borderRadius={2} sx={{ border: "1px solid #fff176" }}>
                        <Typography fontSize={11} fontWeight={600} color="#f57f17" textTransform="uppercase">Next Step</Typography>
                        <Typography fontSize={13}>{track.next_step}</Typography>
                        {track.next_date && <Typography fontSize={11} color="text.secondary">Due: {fmtDate(track.next_date)}</Typography>}
                      </Box>
                    )}
                    {track.rejection_reason && (
                      <Box p={1.5} bgcolor="#ffebee" borderRadius={2} sx={{ border: "1px solid #ffcdd2" }}>
                        <Typography fontSize={11} fontWeight={600} color="#c62828" textTransform="uppercase">Rejection Reason</Typography>
                        <Typography fontSize={13}>{track.rejection_reason}</Typography>
                      </Box>
                    )}
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
        <Button variant="contained" onClick={onEdit}>Edit</Button>
      </DialogActions>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Resumes() {
  const [resumes,    setResumes]    = useState([]);
  const [jobs,       setJobs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [statusF,    setStatusF]    = useState("");
  const [expF,       setExpF]       = useState("");
  const [jobF,       setJobF]       = useState("");
  const [clientF,    setClientF]    = useState("");
  const [clients,    setClients]    = useState([]);

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
    try {
      setLoading(true); setError("");
      const res = await getAllResumes();
      setResumes(res.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load candidates");
      setResumes([]);
    } finally { setLoading(false); }
  }, []);

  const loadJobs = useCallback(async () => {
    try { const res = await getAllJobs(); setJobs(res.data || []); }
    catch { setJobs([]); }
  }, []);

  const loadClients = useCallback(async () => {
    try { const res = await getAllClients(); setClients(res.data || []); }
    catch { setClients([]); }
  }, []);

  useEffect(() => { load(); loadJobs(); loadClients(); }, [load, loadJobs, loadClients]);

  const expBand = EXP_BANDS.find(b => b.label === expF);
  const clientJobIds = clientF ? jobs.filter(j => j.client_id === clientF).map(j => j._id) : null;

  const filtered = resumes.filter(r => {
    const q  = search.toLowerCase();
    const mQ = !q || r.name?.toLowerCase().includes(q) || r.skills?.toLowerCase().includes(q) || r.resume_id?.toLowerCase().includes(q);
    const mS = !statusF || r.status === statusF;
    const mJ = !jobF    || r.linked_job_id === jobF;
    const mE = !expBand || expBand.label === "All Experience" ||
      (expBand.min === "10" ? r.experience >= 10 : r.experience >= Number(expBand.min) && r.experience <= Number(expBand.max));
    const mC = !clientJobIds || clientJobIds.includes(r.linked_job_id);
    return mQ && mS && mJ && mE && mC;
  });

  const stats = {
    total:       resumes.length,
    newCount:    resumes.filter(r => r.status === "New").length,
    shortlisted: resumes.filter(r => r.status === "Shortlisted").length,
    interviewed: resumes.filter(r => r.status === "Interviewed").length,
  };

  const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setAddFile(null); setFormOpen(true); };
  const openEdit   = r  => { setSelected(r); setFormData({ ...EMPTY_FORM, ...r }); setAddFile(null); setFormOpen(true); };
  const openDetail = r  => { setSelected(r); setDetailOpen(true); };
  const openDelete = r  => { setSelected(r); setDeleteOpen(true); };
  const openPdf    = r  => { setSelected(r); setPdfOpen(true); };

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === "linked_job_id") {
      const job = jobs.find(j => j._id === value);
      setFormData(p => ({ ...p, linked_job_id: value, linked_job_title: job?.title || "" }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

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
        await updateResume(selected._id, payload);
        if (addFile) { const b64 = await toBase64(addFile); await uploadFileForCandidate(selected._id, b64).catch(() => {}); }
      } else {
        const created = await createResume(payload);
        if (addFile && created?.data?._id) { const b64 = await toBase64(addFile); await uploadFileForCandidate(created.data._id, b64).catch(() => {}); }
      }
      setAddFile(null); setFormOpen(false); load();
    } catch (err) { setError(err?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await deleteResume(selected._id); setDeleteOpen(false); load(); }
    catch (err) { setError(err?.message || "Delete failed"); }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (!files.length) return;
    if (inlineRef.current) inlineRef.current.value = "";
    const entries = files.map(f => ({ file: f, status: "pending", file_id: "", formData: { ...EMPTY_FORM, status: "New" }, saved: false, errorMsg: "" }));
    setInlineFiles(entries); setShowParsing(true);
    const updated = [...entries];
    await Promise.all(entries.map(async (entry, idx) => {
      updated[idx] = { ...updated[idx], status: "parsing" };
      setInlineFiles([...updated]);
      try {
        const b64    = await toBase64(entry.file);
        const result = await parsePdfViaBackend(b64, entry.file.name);
        const parsed  = result.data    || {};
        const file_id = result.file_id || "";
        updated[idx] = { ...updated[idx], status: "done", file_id, formData: { ...EMPTY_FORM, ...parsed, experience: parsed.experience || "", current_salary: parsed.current_salary || "", expected_salary: parsed.expected_salary || "", status: "New" } };
      } catch (err) {
        const file_id = err?.file_id || "";
        updated[idx] = { ...updated[idx], status: "error", file_id, errorMsg: err?.message || "Auto-parse failed — fill manually", formData: { ...EMPTY_FORM, status: "New" } };
      }
      setInlineFiles([...updated]);
    }));
  };

  const openBulkReview = () => { setBulkFiles(inlineFiles); setBulkStep(0); setBulkDone(false); setBulkOpen(true); };
  const clearInline    = () => { setShowParsing(false); setInlineFiles([]); };

  const handleBulkChange = e => {
    const { name, value } = e.target;
    setBulkFiles(prev => prev.map((entry, idx) =>
      idx !== bulkStep ? entry : {
        ...entry,
        formData: name === "linked_job_id"
          ? { ...entry.formData, linked_job_id: value, linked_job_title: jobs.find(j => j._id === value)?.title || "" }
          : { ...entry.formData, [name]: value },
      }
    ));
  };

  const handleBulkSave = async () => {
    setBulkSaving(true);
    const entry = bulkFiles[bulkStep];
    try {
      const fd = entry.formData;
      await createResume({ ...fd, experience: fd.experience ? Number(fd.experience) : 0, current_salary: fd.current_salary ? Number(fd.current_salary) : 0, expected_salary: fd.expected_salary ? Number(fd.expected_salary) : 0, file_id: entry.file_id || "" });
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

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={48} />
      </Box>
    );

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" color="primary.dark">Resume Bank</Typography>
          <Typography color="text.secondary" mt={0.5}>Manage candidate profiles and track applications</Typography>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => inlineRef.current?.click()} size="large">Upload Resume</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">Add Candidate</Button>
        </Box>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2.5}>
        <Grid item xs={6} md={3}><StatCard title="Total"       value={stats.total}       icon={<Description />} color="#1a237e" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="New"         value={stats.newCount}    icon={<NewReleases />} color="#0277bd" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Shortlisted" value={stats.shortlisted} icon={<Star />}        color="#e65100" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Interviewed" value={stats.interviewed} icon={<People />}      color="#2e7d32" /></Grid>
      </Grid>

      {/* Inline upload zone */}
      {!showParsing
        ? <InlineUploadZone onFiles={handleFileSelect} fileRef={inlineRef} />
        : <InlineParseProgress files={inlineFiles} onReview={openBulkReview} onClear={clearInline} />
      }

      {/* Filters */}
      {resumes.length > 0 && (
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField placeholder="Search by name, skills, or ID…" value={search}
            onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
          <TextField select value={statusF} onChange={e => setStatusF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Status">
            <MenuItem value="">All Statuses</MenuItem>
            {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select value={expF} onChange={e => setExpF(e.target.value)} size="small" sx={{ minWidth: 160 }} label="Experience">
            <MenuItem value="">All Experience</MenuItem>
            {EXP_BANDS.slice(1).map(b => <MenuItem key={b.label} value={b.label}>{b.label}</MenuItem>)}
          </TextField>
          <TextField select value={clientF} onChange={e => { setClientF(e.target.value); setJobF(""); }} size="small" sx={{ minWidth: 180 }} label="Client">
            <MenuItem value="">All Clients</MenuItem>
            {clients.map(c => (
              <MenuItem key={c._id} value={c._id}>
                <Box display="flex" alignItems="center" gap={1}><Business fontSize="small" sx={{ color: "#0277bd" }} />{c.company_name}</Box>
              </MenuItem>
            ))}
          </TextField>
          <TextField select value={jobF} onChange={e => setJobF(e.target.value)} size="small" sx={{ minWidth: 180 }} label="Job">
            <MenuItem value="">All Jobs</MenuItem>
            {(clientF ? jobs.filter(j => j.client_id === clientF) : jobs).map(j => <MenuItem key={j._id} value={j._id}>{j.title}</MenuItem>)}
          </TextField>
        </Box>
      )}

      {/* Empty state or table */}
      {resumes.length === 0 && !error ? (
        <Card>
          <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
              <PersonOff sx={{ fontSize: 36, color: "#9fa8da" }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary">No candidates yet</Typography>
            <Typography fontSize={14} color="text.disabled">Drop PDF resumes in the upload zone above or add a candidate manually.</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Candidate</Button>
          </Box>
        </Card>
      ) : (
        <Card>
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f7fa" }}>
                  {["Candidate", "Current Role", "Exp", "Skills", "Expected Salary", "Notice", "Applied For", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      No candidates match your filters
                    </TableCell>
                  </TableRow>
                ) : filtered.map(r => (
                  <TableRow key={r._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: "#1a237e" }}>{nameInitials(r.name)}</Avatar>
                        <Box>
                          <Typography fontWeight={600} fontSize={13}>{r.name}</Typography>
                          <Typography fontSize={11} color="text.secondary">{r.resume_id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13}>{r.current_role}</Typography>
                      <Typography fontSize={11} color="text.secondary">{r.current_company}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.experience} yrs</TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {(r.skills || "").split(",").filter(Boolean).slice(0, 3).map((s, i) => (
                          <Chip key={i} label={s.trim()} size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#e8eaf6", color: "#1a237e" }} />
                        ))}
                        {(r.skills || "").split(",").filter(Boolean).length > 3 && (
                          <Chip label={`+${(r.skills || "").split(",").length - 3}`} size="small" sx={{ fontSize: 10, height: 20 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{fmtSalary(r.expected_salary)}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.notice_period || "—"}</TableCell>
                    <TableCell>
                      {r.linked_job_title ? (
                        <Box>
                          {(() => {
                            const linkedJob = jobs.find(j => j._id === r.linked_job_id);
                            return linkedJob?.client_name ? (
                              <Typography fontSize={10} color="text.secondary" fontWeight={600}
                                sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.2 }}>
                                <Business sx={{ fontSize: 10 }} />{linkedJob.client_name}
                              </Typography>
                            ) : null;
                          })()}
                          <Typography fontSize={12} color="#0277bd" fontWeight={600}>{r.linked_job_title}</Typography>
                        </Box>
                      ) : (
                        <Typography fontSize={12} color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={r.status} color={STATUS_COLOR[r.status] || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => openDetail(r)}><Visibility fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title={r.resume_file ? "View Resume PDF" : "No resume file uploaded"}>
                          <span>
                            <IconButton size="small" onClick={() => r.resume_file && openPdf(r)}
                              sx={{ color: r.resume_file ? "#c62828" : "#bdbdbd", cursor: r.resume_file ? "pointer" : "not-allowed" }}>
                              <PictureAsPdf fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => openDelete(r)}><Delete fontSize="small" /></IconButton>
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

      {/* PDF Viewer */}
      <PdfViewerDialog open={pdfOpen} onClose={() => setPdfOpen(false)} candidate={selected} />

      {/* Bulk Review Dialog */}
      <Dialog open={bulkOpen} onClose={closeBulk} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: "80vh" } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <CloudUpload color="primary" />
            <Box>
              <Typography fontWeight={700} fontSize="1.1rem">Review &amp; Save Candidates</Typography>
              <Typography fontSize={12} color="text.secondary">AI-extracted details pre-filled · PDFs already saved · review and confirm each</Typography>
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
                <Box display="flex" alignItems="center" gap={1} pb={1.5} flexWrap="wrap">
                  <Typography fontSize={12} color="text.secondary">
                    {savedCount} of {bulkFiles.length} saved &bull; Reviewing: <strong>{currentEntry.file.name}</strong>
                  </Typography>
                  {currentEntry.status === "error" && <Chip label="Fill manually" size="small" color="warning" sx={{ fontSize: 10 }} />}
                  {currentEntry.status === "done" && !currentEntry.saved && <Chip label="AI-parsed ✓" size="small" color="info" sx={{ fontSize: 10 }} />}
                  {currentEntry.file_id && <Chip label="PDF stored ✓" size="small" color="success" variant="outlined" sx={{ fontSize: 10 }} />}
                </Box>
              </Box>
              <Box p={3}>
                {currentEntry.saved ? (
                  <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={2}>
                    <CheckCircle color="success" sx={{ fontSize: 56 }} />
                    <Typography fontWeight={700} color="success.main">Saved successfully!</Typography>
                    {bulkStep < bulkFiles.length - 1 && <Button variant="outlined" onClick={() => setBulkStep(s => s + 1)}>Next Resume →</Button>}
                  </Box>
                ) : (
                  <>
                    <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Personal Info</Typography>
                    <Grid container spacing={2} mb={2}>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Full Name" name="name" value={currentEntry.formData.name} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" required type="email" label="Email" name="email" value={currentEntry.formData.email} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" name="phone" value={currentEntry.formData.phone} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Location" name="location" value={currentEntry.formData.location} onChange={handleBulkChange} /></Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Professional Details</Typography>
                    <Grid container spacing={2} mb={2}>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Role" name="current_role" value={currentEntry.formData.current_role} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Company" name="current_company" value={currentEntry.formData.current_company} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Experience (yrs)" name="experience" value={currentEntry.formData.experience} onChange={handleBulkChange} inputProps={{ min: 0 }} /></Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField select fullWidth size="small" label="Source" name="source" value={currentEntry.formData.source} onChange={handleBulkChange}>
                          {SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField select fullWidth size="small" label="Status" name="status" value={currentEntry.formData.status} onChange={handleBulkChange}>
                          {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12}><TextField fullWidth size="small" label="Skills (comma-separated)" name="skills" value={currentEntry.formData.skills} onChange={handleBulkChange} placeholder="e.g. React, Node.js, MongoDB" /></Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Compensation &amp; Availability</Typography>
                    <Grid container spacing={2} mb={2}>
                      <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Current Salary (₹)" name="current_salary" value={currentEntry.formData.current_salary} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={currentEntry.formData.expected_salary} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField select fullWidth size="small" label="Notice Period" name="notice_period" value={currentEntry.formData.notice_period} onChange={handleBulkChange}>
                          {NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField select fullWidth size="small" label="Link to Job" name="linked_job_id" value={currentEntry.formData.linked_job_id} onChange={handleBulkChange}>
                          <MenuItem value="">No Job Linked</MenuItem>
                          {jobs.map(j => <MenuItem key={j._id} value={j._id}>{j.title}</MenuItem>)}
                        </TextField>
                      </Grid>
                    </Grid>
                    <TextField fullWidth multiline rows={2} size="small" label="Notes" name="notes" value={currentEntry.formData.notes} onChange={handleBulkChange} />
                    {currentEntry.errorMsg && <Alert severity="warning" sx={{ mt: 2 }}>{currentEntry.errorMsg}</Alert>}
                  </>
                )}
              </Box>
            </Box>
          )}
          {bulkDone && (
            <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: "#e8f5e9" }}>
                <Done sx={{ fontSize: 48, color: "#2e7d32" }} />
              </Avatar>
              <Typography variant="h5" fontWeight={800} color="success.main">All Done!</Typography>
              <Typography color="text.secondary">
                {savedCount} of {bulkFiles.length} candidate{savedCount !== 1 ? "s" : ""} saved with their original PDFs.
              </Typography>
              <Button variant="contained" onClick={closeBulk}>Back to Resume Bank</Button>
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
              endIcon={bulkSaving ? <CircularProgress size={16} color="inherit" /> : <Done />}>
              {bulkSaving ? "Saving…" : "Save & Next"}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          {selected ? "Edit Candidate" : "Add New Candidate"}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Personal Info</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Full Name" name="name" value={formData.name} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required type="email" label="Email" name="email" value={formData.email} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" name="phone" value={formData.phone} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Location" name="location" value={formData.location} onChange={handleChange} /></Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Professional Details</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Role" name="current_role" value={formData.current_role} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Company" name="current_company" value={formData.current_company} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="number" label="Experience (years)" name="experience" value={formData.experience} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Source" name="source" value={formData.source} onChange={handleChange}>
                  {SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Skills (comma-separated)" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g. React, Node.js, MongoDB" />
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Compensation &amp; Availability</Typography>
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
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Linked Job" name="linked_job_id" value={formData.linked_job_id} onChange={handleChange}>
                  <MenuItem value="">No Job Linked</MenuItem>
                  {jobs.map(j => <MenuItem key={j._id} value={j._id}>{j.title}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <TextField fullWidth multiline rows={3} size="small" label="Notes" name="notes" value={formData.notes} onChange={handleChange} />
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Resume File (PDF)</Typography>
            <Box onClick={() => formFileRef.current?.click()} sx={{
              border: addFile ? "2px solid #2e7d32" : "2px dashed #90caf9", borderRadius: 2, p: 2,
              display: "flex", alignItems: "center", gap: 2, cursor: "pointer",
              bgcolor: addFile ? "#f1f8e9" : "#f8fbff", transition: "all 0.2s",
              "&:hover": { bgcolor: addFile ? "#e8f5e9" : "#e3f2fd", borderColor: addFile ? "#1b5e20" : "#1565c0" },
            }}>
              <PictureAsPdf sx={{ fontSize: 32, color: addFile ? "#2e7d32" : "#90caf9", flexShrink: 0 }} />
              <Box flex={1}>
                {addFile ? (
                  <>
                    <Typography fontWeight={700} fontSize={13} color="success.dark">{addFile.name}</Typography>
                    <Typography fontSize={11} color="text.secondary">{(addFile.size / 1024).toFixed(0)} KB · Click to replace</Typography>
                  </>
                ) : (
                  <>
                    <Typography fontWeight={600} fontSize={13} color="primary.dark">
                      {selected?.resume_file ? "Replace resume PDF" : "Attach resume PDF (optional)"}
                    </Typography>
                    <Typography fontSize={11} color="text.secondary">
                      {selected?.resume_file ? `Current file: ${selected.resume_file} · click to replace` : "Click to browse · PDF only"}
                    </Typography>
                  </>
                )}
              </Box>
              {addFile && <IconButton size="small" onClick={e => { e.stopPropagation(); setAddFile(null); }}><CloseIcon fontSize="small" /></IconButton>}
              <input ref={formFileRef} type="file" accept=".pdf,application/pdf" hidden
                onChange={e => { const f = e.target.files?.[0]; if (f) setAddFile(f); e.target.value = ""; }} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              {selected ? "Update" : "Add Candidate"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Candidate Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { minHeight: "70vh" } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          Candidate Details
        </DialogTitle>
        {selected && (
          <CandidateDetailContent
            candidate={selected}
            jobs={jobs}
            onClose={() => setDetailOpen(false)}
            onEdit={() => { setDetailOpen(false); openEdit(selected); }}
            onViewPdf={() => { setDetailOpen(false); openPdf(selected); }}
          />
        )}
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete Candidate</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{selected?.name}</strong>?</Typography>
          {selected?.resume_file && (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              The uploaded resume PDF will also be permanently deleted from the server.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}