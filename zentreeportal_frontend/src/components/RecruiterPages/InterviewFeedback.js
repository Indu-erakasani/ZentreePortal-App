import React, { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Button, CircularProgress, Alert, Chip, Avatar, Divider, Grid,
} from "@mui/material";
import {
  CheckCircle, Star, StarBorder, ThumbUp, ThumbDown,
  VideoCall, Schedule, Person, Work,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";

const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const RECOMMENDATIONS = ["Strong Hire", "Hire", "Maybe", "No Hire"];
const INTERVIEW_TYPES = ["Video", "Phone", "In-Person", "Panel"];

const SCORE_LABELS = {
  1: { label: "Poor",       color: "#c62828", bg: "#ffebee" },
  2: { label: "Below Avg",  color: "#e65100", bg: "#fff3e0" },
  3: { label: "Average",    color: "#f57c00", bg: "#fff8e1" },
  4: { label: "Good",       color: "#1565c0", bg: "#e3f2fd" },
  5: { label: "Excellent",  color: "#2e7d32", bg: "#e8f5e9" },
};

const REC_STYLE = {
  "Strong Hire": { color: "#fff", bg: "#2e7d32" },
  "Hire":        { color: "#fff", bg: "#1565c0" },
  "Maybe":       { color: "#fff", bg: "#f57c00" },
  "No Hire":     { color: "#fff", bg: "#c62828" },
};

export default function InterviewFeedback() {
  const { trackingId, scheduleId } = useParams();

  const [loading,   setLoading]   = useState(true);
  const [interview, setInterview] = useState(null);
  const [error,     setError]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const [form, setForm] = useState({
    feedback_score:   4,
    recommendation:   "Maybe",
    interview_type:   "Video",
    feedback_summary: "",
    strengths:        "",
    weaknesses:       "",
  });

  // Load interview details
  useEffect(() => {
    fetch(`${BASE}/tracking/${trackingId}/schedule/${scheduleId}/feedback-form`)
      .then(r => r.json())
      .then(res => {
        if (!res.success && res.already_submitted) {
          setSubmitted(true);
          setLoading(false);
          return;
        }
        if (!res.success) {
          setError(res.message || "Interview not found");
          setLoading(false);
          return;
        }
        setInterview(res.data);
        setForm(f => ({
          ...f,
          interview_type:   res.data.interview_type || "Video",
          feedback_score:   4,
        }));
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load interview details");
        setLoading(false);
      });
  }, [trackingId, scheduleId]);

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.feedback_summary.trim()) {
      setError("Please provide a feedback summary"); return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch(
        `${BASE}/tracking/${trackingId}/schedule/${scheduleId}/feedback-form`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(form),
        }
      ).then(r => r.json());

      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.message || "Submission failed");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
      sx={{ background: "#f0f2f5" }}>
      <CircularProgress size={48} />
    </Box>
  );

  // ── Already submitted ──────────────────────────────────────────────────────
  if (submitted) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
      sx={{ background: "#f0f2f5", p: 2 }}>
      <Card sx={{ maxWidth: 480, width: "100%", borderRadius: 3, textAlign: "center", p: 3 }}>
        <CheckCircle sx={{ fontSize: 80, color: "#2e7d32", mb: 2 }} />
        <Typography variant="h5" fontWeight={700} color="success.dark" mb={1}>
          Feedback Submitted!
        </Typography>
        <Typography color="text.secondary" fontSize={15} mb={2}>
          Thank you for submitting your interview feedback.
          The recruitment team has been notified.
        </Typography>
        <Box sx={{ bgcolor: "#e8f5e9", borderRadius: 2, p: 2 }}>
          <Typography fontSize={13} color="#1b5e20">
            Your feedback helps us make better hiring decisions faster.
          </Typography>
        </Box>
      </Card>
    </Box>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error && !interview) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
      sx={{ background: "#f0f2f5", p: 2 }}>
      <Card sx={{ maxWidth: 480, width: "100%", borderRadius: 3, textAlign: "center", p: 3 }}>
        <Typography variant="h6" color="error" mb={1}>⚠️ {error}</Typography>
        <Typography color="text.secondary" fontSize={14}>
          The feedback link may be invalid or expired.
        </Typography>
      </Card>
    </Box>
  );

  const scoreStyle = SCORE_LABELS[form.feedback_score] || SCORE_LABELS[3];
  const recStyle   = REC_STYLE[form.recommendation]    || REC_STYLE["Maybe"];
  const fmtDate    = interview?.scheduled_at
    ? new Date(interview.scheduled_at).toLocaleString("en-IN", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "";

  return (
    <Box sx={{ background: "#f0f2f5", minHeight: "100vh", py: 4, px: 2 }}>
      <Box maxWidth={640} mx="auto">

        {/* Header */}
        <Card sx={{ borderRadius: 3, mb: 2.5, overflow: "hidden" }}>
          <Box sx={{
            background: "linear-gradient(135deg,#1a237e 0%,#0277bd 100%)",
            px: 3, py: 2.5,
          }}>
            <Typography fontWeight={700} fontSize={20} color="#fff">
              📝 Interview Feedback
            </Typography>
            <Typography fontSize={13} color="#90caf9" mt={0.5}>
              {interview?.stage} · {interview?.client_name}
            </Typography>
          </Box>

          <CardContent sx={{ p: 2.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Person sx={{ fontSize: 16, color: "#546e7a" }} />
                  <Box>
                    <Typography fontSize={10} color="text.secondary" fontWeight={600}
                      textTransform="uppercase">Candidate</Typography>
                    <Typography fontWeight={700} fontSize={14}>
                      {interview?.candidate_name}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Work sx={{ fontSize: 16, color: "#546e7a" }} />
                  <Box>
                    <Typography fontSize={10} color="text.secondary" fontWeight={600}
                      textTransform="uppercase">Position</Typography>
                    <Typography fontWeight={600} fontSize={13}>
                      {interview?.job_title}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Schedule sx={{ fontSize: 16, color: "#546e7a" }} />
                  <Box>
                    <Typography fontSize={10} color="text.secondary" fontWeight={600}
                      textTransform="uppercase">Scheduled</Typography>
                    <Typography fontSize={12} color="#333">{fmtDate}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <VideoCall sx={{ fontSize: 16, color: "#546e7a" }} />
                  <Box>
                    <Typography fontSize={10} color="text.secondary" fontWeight={600}
                      textTransform="uppercase">Format</Typography>
                    <Typography fontSize={12} color="#333">{interview?.interview_type}</Typography>
                  </Box>
                </Box>
              </Grid>
              {interview?.meeting_link && (
                <Grid item xs={12}>
                  <Button
                    href={interview.meeting_link}
                    target="_blank"
                    variant="outlined"
                    size="small"
                    startIcon={<VideoCall />}
                    sx={{ textTransform: "none", fontSize: 12 }}
                  >
                    Join Google Meet
                  </Button>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography fontWeight={700} fontSize={16} mb={2.5}>
              Your Evaluation
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>

                {/* Rating — visual stars */}
                <Grid item xs={12}>
                  <Typography fontSize={13} fontWeight={600} color="text.secondary"
                    mb={1}>Overall Rating *</Typography>
                  <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Box key={n} onClick={() => setForm(p => ({ ...p, feedback_score: n }))}
                        sx={{
                          cursor: "pointer", p: 1, borderRadius: 2,
                          border: "2px solid",
                          borderColor: form.feedback_score === n ? scoreStyle.color : "#e0e0e0",
                          bgcolor:     form.feedback_score === n ? scoreStyle.bg    : "#fafafa",
                          transition: "all 0.15s",
                          display: "flex", flexDirection: "column",
                          alignItems: "center", minWidth: 70,
                          "&:hover": { borderColor: scoreStyle.color },
                        }}>
                        {n <= form.feedback_score
                          ? <Star sx={{ color: "#f9a825", fontSize: 22 }} />
                          : <StarBorder sx={{ color: "#e0e0e0", fontSize: 22 }} />}
                        <Typography fontSize={10} fontWeight={600}
                          color={form.feedback_score === n ? scoreStyle.color : "#999"}>
                          {SCORE_LABELS[n].label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>

                {/* Recommendation */}
                <Grid item xs={12}>
                  <Typography fontSize={13} fontWeight={600} color="text.secondary"
                    mb={1}>Hiring Recommendation *</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {RECOMMENDATIONS.map(r => (
                      <Box key={r} onClick={() => setForm(p => ({ ...p, recommendation: r }))}
                        sx={{
                          cursor: "pointer", px: 2, py: 1, borderRadius: 2,
                          border: "2px solid",
                          borderColor: form.recommendation === r
                            ? REC_STYLE[r].bg : "#e0e0e0",
                          bgcolor:     form.recommendation === r
                            ? REC_STYLE[r].bg : "#fafafa",
                          color:       form.recommendation === r ? "#fff" : "#555",
                          fontWeight:  form.recommendation === r ? 700 : 400,
                          fontSize: 13,
                          transition: "all 0.15s",
                          display: "flex", alignItems: "center", gap: 0.5,
                        }}>
                        {r === "Strong Hire" && <ThumbUp sx={{ fontSize: 14 }} />}
                        {r === "No Hire"     && <ThumbDown sx={{ fontSize: 14 }} />}
                        {r}
                      </Box>
                    ))}
                  </Box>
                </Grid>

                {/* Interview Type */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select fullWidth size="small" label="Interview Type"
                    name="interview_type" value={form.interview_type}
                    onChange={handleChange}>
                    {INTERVIEW_TYPES.map(t => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Strengths */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth size="small" label="Strengths (comma separated)"
                    name="strengths" value={form.strengths}
                    onChange={handleChange}
                    placeholder="e.g. Problem solving, Communication" />
                </Grid>

                {/* Weaknesses */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth size="small" label="Areas to Improve (comma separated)"
                    name="weaknesses" value={form.weaknesses}
                    onChange={handleChange}
                    placeholder="e.g. System design, Leadership" />
                </Grid>

                {/* Feedback Summary */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth multiline rows={5} size="small" required
                    label="Detailed Feedback *"
                    name="feedback_summary" value={form.feedback_summary}
                    onChange={handleChange}
                    placeholder="Describe the candidate's technical skills, communication, problem-solving approach, and overall suitability for the role..." />
                </Grid>

                {/* Preview */}
                {form.feedback_summary && (
                  <Grid item xs={12}>
                    <Box sx={{
                      p: 1.5, bgcolor: "#f8f9fa", borderRadius: 2,
                      border: "1px solid #e0e0e0",
                    }}>
                      <Typography fontSize={11} fontWeight={700} color="text.secondary"
                        textTransform="uppercase" mb={1}>
                        Summary Preview
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip
                          label={`${form.feedback_score}/5 — ${scoreStyle.label}`}
                          size="small"
                          sx={{ bgcolor: scoreStyle.bg, color: scoreStyle.color,
                                fontWeight: 700, fontSize: 11 }} />
                        <Chip
                          label={form.recommendation}
                          size="small"
                          sx={{ bgcolor: recStyle.bg, color: recStyle.color,
                                fontWeight: 700, fontSize: 11 }} />
                        {form.strengths && form.strengths.split(",").filter(Boolean).slice(0, 2).map((s, i) => (
                          <Chip key={i} label={s.trim()} size="small"
                            sx={{ bgcolor: "#e8f5e9", color: "#1b5e20", fontSize: 10 }} />
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                )}

                {/* Submit */}
                <Grid item xs={12}>
                  <Button
                    type="submit" fullWidth variant="contained" size="large"
                    disabled={saving || !form.feedback_summary.trim()}
                    startIcon={saving
                      ? <CircularProgress size={18} color="inherit" />
                      : <CheckCircle />}
                    sx={{
                      bgcolor: "#1a237e", fontWeight: 700, fontSize: 15,
                      py: 1.5, borderRadius: 2,
                      "&:hover": { bgcolor: "#0d1757" },
                    }}>
                    {saving ? "Submitting…" : "Submit Feedback"}
                  </Button>
                </Grid>

              </Grid>
            </form>
          </CardContent>
        </Card>

        <Typography fontSize={11} color="text.disabled" textAlign="center" mt={2}>
          Zentreelabs Recruitment System · Feedback is confidential
        </Typography>
      </Box>
    </Box>
  );
}