/**
 * CandidateDetailContent.jsx
 *
 * Shared candidate detail panel — used by both Resumes and Placements pages.
 *
 * Props:
 *   candidate    {object}   — resume doc
 *   jobs         {array}    — all job docs
 *   recruiters   {array}    — all recruiter user docs
 *   onClose      {fn}       — close handler
 *   onEdit       {fn}       — edit handler
 *   onViewPdf    {fn}       — view PDF handler
 *   placementData {object|null}  — if provided, adds a "Billing" tab with placement info
 *   onEditPlacement {fn|null}    — called when user clicks Edit inside the Billing tab
 */

import React from "react";
import {
  Box, Grid, Typography, Button, TextField, MenuItem,
  Chip, IconButton, CircularProgress, Alert, Avatar, Divider,
  DialogContent, DialogActions,
} from "@mui/material";
import { Edit } from "@mui/icons-material";

// ── API ───────────────────────────────────────────────────────────────────────
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

const getTrackingByResume = (resume_id) =>
  fetch(`${BASE}/tracking/by-resume/${resume_id}`, { headers: getHeaders() }).then(handle);

const createTracking = (payload) =>
  fetch(`${BASE}/tracking/`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handle);

// ── Constants ─────────────────────────────────────────────────────────────────
export const STAGES = [
  "Screening", "Technical Round 1", "Technical Round 2",
  "HR Round", "Manager Round", "Final Round",
  "Offer Stage", "Negotiation", "Offer Accepted",
  "Offer Declined", "Joined", "Rejected", "Withdrawn",
];

export const STATUS_COLOR = {
  New: "default", "In Review": "info", Shortlisted: "primary",
  Interviewed: "warning", Offered: "success", Hired: "success",
  Rejected: "error", "On Hold": "warning",
};

export const STAGE_COLOR = {
  Screening: "default",
  "Technical Round 1": "info", "Technical Round 2": "info",
  "HR Round": "primary", "Manager Round": "primary", "Final Round": "primary",
  "Offer Stage": "warning", Negotiation: "warning",
  "Offer Accepted": "success", Joined: "success",
  "Offer Declined": "error", Rejected: "error", Withdrawn: "error",
};

const SCORE_LABEL = ["", "Poor", "Below Avg", "Average", "Good", "Excellent"];

// ── Helpers ───────────────────────────────────────────────────────────────────
export const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

export const fmtSalary = (v) => {
  if (!v) return "—";
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${Number(v).toLocaleString("en-IN")}`;
};

export const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const fmt = (val) => {
  if (!val) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
};

// ── DetailRow (used in Billing tab) ──────────────────────────────────────────
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

// ── Main export ───────────────────────────────────────────────────────────────
export default function CandidateDetailContent({
  candidate,
  jobs         = [],
  recruiters   = [],
  onClose,
  onEdit,
  onViewPdf,
  placementData    = null,   // placement doc — enables the Billing tab
  onEditPlacement  = null,   // called when clicking "Edit Placement" in billing tab
}) {
  const [tracking,    setTracking]    = React.useState([]);
  const [loadingT,    setLoadingT]    = React.useState(true);
  const [tab,         setTab]         = React.useState(0);
  const [addPipeline, setAddPipeline] = React.useState(false);
  const [pipeForm, setPipeForm] = React.useState({
    job_id: "", current_stage: "Screening", recruiter: "", notes: "", next_step: "",
  });
  const [pipeError,  setPipeError]  = React.useState("");
  const [pipeSaving, setPipeSaving] = React.useState(false);

  // tabs: always Profile + Pipeline; optionally Billing
  const TABS = ["Profile & Resume", "Pipeline & Interviews", ...(placementData ? ["Billing"] : [])];

  const loadTracking = React.useCallback(() => {
    setLoadingT(true);
    getTrackingByResume(candidate.resume_id)
      .then(res => setTracking(res.data || []))
      .catch(() => setTracking([]))
      .finally(() => setLoadingT(false));
  }, [candidate.resume_id]);

  React.useEffect(() => { loadTracking(); }, [loadTracking]);

  const activeTrack = tracking[0];

  const handlePipeChange = e => setPipeForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleAddPipeline = async () => {
    if (!pipeForm.job_id) { setPipeError("Please select a job"); return; }
    setPipeSaving(true); setPipeError("");
    try {
      const job = jobs.find(j => j._id === pipeForm.job_id);
      await createTracking({
        resume_id:       candidate.resume_id?.trim(),
        candidate_name:  candidate.name,
        job_id:          job?.job_id     || "",
        job_title:       job?.title      || "",
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

        {/* ── Header strip ───────────────────────────────────────────────── */}
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
                {/* Show placement chips if billing data is present */}
                {placementData && (
                  <>
                    <Chip label={placementData.candidate_status || "Active"}
                      color={{ Active: "success", Probation: "info", Confirmed: "primary", Resigned: "default", Terminated: "error" }[placementData.candidate_status] || "default"}
                      size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                    <Chip label={`Payment: ${placementData.payment_status}`}
                      color={{ Paid: "success", Pending: "warning", Partial: "info", Overdue: "error" }[placementData.payment_status] || "default"}
                      size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                  </>
                )}
              </Box>
            </Box>
          </Box>

          {/* Tabs */}
          <Box display="flex" mt={2} gap={0}>
            {TABS.map((label, i) => (
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

        {/* ══ TAB 0 — Profile ═════════════════════════════════════════════ */}
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

        {/* ══ TAB 1 — Pipeline & Interviews ══════════════════════════════ */}
        {tab === 1 && (
          <Box p={3}>

            {/* Add to Pipeline form */}
            {addPipeline ? (
              <Box mb={3} p={2.5} borderRadius={2}
                sx={{ border: "1.5px solid #1a237e", bgcolor: "#f8f9ff" }}>
                <Typography fontWeight={700} fontSize={14} color="#1a237e" mb={2}>Add to Pipeline</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField select fullWidth size="small" required label="Select Job" name="job_id"
                      value={pipeForm.job_id} onChange={handlePipeChange}>
                      <MenuItem value="">— Select a job —</MenuItem>
                      {jobs.map(j => (
                        <MenuItem key={j._id} value={j._id}>
                          <Box>
                            <Typography fontSize={13} fontWeight={600}>{j.job_id} - {j.title}</Typography>
                            {j.client_name && <Typography fontSize={11} color="text.secondary">{j.client_name}</Typography>}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select fullWidth size="small" label="Starting Stage" name="current_stage"
                      value={pipeForm.current_stage} onChange={handlePipeChange}>
                      {STAGES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select fullWidth size="small" label="Recruiter" name="recruiter"
                      value={pipeForm.recruiter} onChange={handlePipeChange}>
                      <MenuItem value="">Select Recruiter</MenuItem>
                      {recruiters.map(r => (
                        <MenuItem key={r.id} value={`${r.first_name} ${r.last_name}`}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: "#1a237e" }}>
                              {r.first_name?.[0]}{r.last_name?.[0]}
                            </Avatar>
                            {r.first_name} {r.last_name}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Next Step" name="next_step"
                      value={pipeForm.next_step} onChange={handlePipeChange}
                      placeholder="e.g. Schedule technical interview" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={2} size="small" label="Notes" name="notes"
                      value={pipeForm.notes} onChange={handlePipeChange} />
                  </Grid>
                </Grid>
                {pipeError && <Alert severity="error" sx={{ mt: 1.5 }}>{pipeError}</Alert>}
                <Box display="flex" gap={1} mt={2} justifyContent="flex-end">
                  <Button size="small" onClick={() => { setAddPipeline(false); setPipeError(""); }}
                    sx={{ textTransform: "none", color: "#64748b" }}>Cancel</Button>
                  <Button size="small" variant="contained" onClick={handleAddPipeline}
                    disabled={pipeSaving || !pipeForm.job_id}
                    sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#1a237e", "&:hover": { bgcolor: "#0d1757" } }}
                    endIcon={pipeSaving ? <CircularProgress size={14} color="inherit" /> : null}>
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

            {/* Pipeline records */}
            {loadingT ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress size={32} /></Box>
            ) : tracking.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1}>
                <Typography color="text.secondary" fontWeight={600}>No pipeline records found</Typography>
                <Typography fontSize={13} color="text.disabled">Click "Add to Pipeline" above to start tracking this candidate.</Typography>
              </Box>
            ) : tracking.map((track, tIdx) => (
              <Box key={track._id} mb={tIdx < tracking.length - 1 ? 4 : 0}>

                {/* Track header */}
                <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
                  <Chip label={track.current_stage} color={STAGE_COLOR[track.current_stage] || "default"} size="small" sx={{ fontWeight: 700 }} />
                  <Chip label={track.pipeline_status} size="small" variant="outlined" />
                  {track.recruiter   && <Typography fontSize={12} color="text.secondary">Recruiter: <strong>{track.recruiter}</strong></Typography>}
                  {track.job_title   && <Typography fontSize={12} color="text.secondary">Job: <strong>{track.job_id}-{track.job_title}</strong></Typography>}
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
                              <Typography fontWeight={700} fontSize={13}>{iv.stage} — {iv.interview_type}</Typography>
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

        {/* ══ TAB 2 — Billing (only rendered when placementData is passed) ══ */}
        {tab === 2 && placementData && (
          <Box p={3}>

            {/* Placement ID + dates */}
            <Box display="flex" alignItems="center" gap={1.5} mb={2.5}
              p={1.5} bgcolor="#e8eaf6" borderRadius={2}>
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">Placement ID</Typography>
                <Typography fontWeight={800} fontSize={16} color="#1a237e">{placementData.placement_id || "—"}</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 1.5 }} />
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">Offer Date</Typography>
                <Typography fontWeight={600} fontSize={13}>{fmtDate(placementData.offer_date)}</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 1.5 }} />
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">Joining Date</Typography>
                <Typography fontWeight={600} fontSize={13}>{fmtDate(placementData.joining_date)}</Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Employment */}
              <Grid item xs={12} sm={6}>
                <Typography fontSize={11} fontWeight={700} color="text.secondary"
                  textTransform="uppercase" letterSpacing={0.8} mb={1.5}>
                  Employment
                </Typography>
                <DetailRow label="Job Title"    value={placementData.job_title} />
                <DetailRow label="Job ID"       value={placementData.job_id} />
                <DetailRow label="Client"       value={placementData.client_name} />
                <DetailRow label="Recruiter"    value={placementData.recruiter} />
                <DetailRow label="Annual Salary" value={fmt(placementData.final_ctc)} />
              </Grid>

              {/* Billing */}
              <Grid item xs={12} sm={6}>
                <Typography fontSize={11} fontWeight={700} color="text.secondary"
                  textTransform="uppercase" letterSpacing={0.8} mb={1.5}>
                  Billing
                </Typography>
                <DetailRow label="Billing Rate"    value={`${placementData.billing_percentage || 0}%`} />
                <DetailRow label="Billing Amount"  value={fmt(placementData.billing_amount)} />
                <DetailRow label="Invoice #"       value={placementData.invoice_number || "—"} />
                <DetailRow label="Payment Status"  value={placementData.payment_status} />
                <DetailRow label="Guarantee Period" value={`${placementData.guarantee_period || 0} days`} />
                <DetailRow label="Guarantee End"   value={fmtDate(placementData.guarantee_end_date)} />
              </Grid>
            </Grid>

            {placementData.notes && (
              <Box mt={2.5} p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={700}
                  textTransform="uppercase" mb={0.5}>Notes</Typography>
                <Typography fontSize={13}>{placementData.notes}</Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {/* ── Footer actions ────────────────────────────────────────────────── */}
      <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0", gap: 1 }}>
        <Button onClick={onClose}>Close</Button>
        {/* Show "Edit Candidate" always */}
        <Button variant="outlined" onClick={onEdit}>Edit Candidate</Button>
        {/* Show "Edit Placement" only when billing tab is available */}
        {placementData && onEditPlacement && (
          <Button variant="contained" startIcon={<Edit />} onClick={onEditPlacement}
            sx={{ textTransform: "none", fontWeight: 700 }}>
            Edit Placement
          </Button>
        )}
      </DialogActions>
    </>
  );
}