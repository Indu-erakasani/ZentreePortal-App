// Route: /jd-resume-review/:token
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Button, CircularProgress,
         Alert, Paper, TextField, Chip, Divider } from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";

const BASE = process.env.REACT_APP_API_BASE_URL;

export default function SeniorReviewPage() {
  const { token } = useParams();
  const [meta,     setMeta]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [feedback, setFeedback] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(null); // "Accepted" | "Rejected"
  const [error,    setError]    = useState("");
  const [blobUrl,  setBlobUrl]  = useState(null);

  useEffect(() => {
    fetch(`${BASE}/jd-review/public/review/${token}`)
      .then(r => r.json())
      .then(d => { if (!d.success) throw new Error(d.message); setMeta(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    // Load PDF
    fetch(`${BASE}/jd-review/public/review/${token}/file`)
      .then(r => r.blob())
      .then(b => setBlobUrl(URL.createObjectURL(b)))
      .catch(() => {});
  }, [token]);

  const decide = async (decision) => {
    if (decision === "Rejected" && !feedback.trim()) {
      setError("Please provide feedback before rejecting"); return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${BASE}/jd-review/public/review/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, feedback }),
      }).then(r => r.json());
      if (!res.success) throw new Error(res.message);
      setDone(decision);
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (error && !meta) return (
    <Box display="flex" justifyContent="center" mt={10}>
      <Alert severity="error" sx={{ maxWidth: 480 }}>{error}</Alert>
    </Box>
  );

  return (
    <Box maxWidth={900} mx="auto" mt={4} px={2} pb={6}>
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ p: 3, background: "linear-gradient(135deg, #0f172a, #1a237e)" }}>
          <Typography color="#fff" fontWeight={800} variant="h5">ZentreeLabs</Typography>
          <Typography color="rgba(255,255,255,0.6)" fontSize={13}>Senior Resume Review</Typography>
        </Box>

        <Box p={3}>
          {done ? (
            <Box textAlign="center" py={4}>
              {done === "Accepted"
                ? <><CheckCircle sx={{ fontSize: 64, color: "#15803d" }} />
                    <Typography variant="h5" fontWeight={800} color="success.main" mt={2}>Resume Accepted!</Typography>
                    <Typography color="text.secondary">The recruiter has been notified.</Typography></>
                : <><Cancel sx={{ fontSize: 64, color: "#ef4444" }} />
                    <Typography variant="h5" fontWeight={800} color="error" mt={2}>Resume Rejected</Typography>
                    <Typography color="text.secondary">The candidate has been notified with your feedback.</Typography></>
              }
            </Box>
          ) : (
            <>
              <Box display="flex" gap={1} alignItems="center" mb={2} flexWrap="wrap">
                <Typography fontWeight={800} fontSize="1.1rem">
                  Reviewing: {meta?.candidate_name}
                </Typography>
                <Chip label={meta?.job_title} size="small" sx={{ bgcolor: "#e0f2fe", color: "#0369a1" }} />
                <Chip label={meta?.client_name} size="small" variant="outlined" />
              </Box>

              {meta?.job_description && (
                <Box p={2} bgcolor="#f8fafc" borderRadius={2} mb={2.5}
                  sx={{ border: "1px solid #e2e8f0" }}>
                  <Typography fontSize={12} fontWeight={600} color="text.secondary"
                    textTransform="uppercase" mb={0.5}>Job Description</Typography>
                  <Typography fontSize={13} sx={{ whiteSpace: "pre-wrap" }}>
                    {meta.job_description}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* PDF Viewer */}
              {blobUrl ? (
                <Box sx={{ height: 500, border: "1px solid #e2e8f0", borderRadius: 2,
                  overflow: "hidden", mb: 3 }}>
                  <iframe src={blobUrl} title="Candidate Resume"
                    style={{ width: "100%", height: "100%", border: "none" }} />
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 3 }}>Resume PDF is loading or unavailable.</Alert>
              )}

              <TextField fullWidth multiline rows={3} size="small"
                label="Feedback (required if rejecting)"
                placeholder="E.g. Missing cloud experience, please add AWS/Azure projects..."
                value={feedback} onChange={e => setFeedback(e.target.value)} sx={{ mb: 2 }} />

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button variant="outlined" color="error" size="large"
                  onClick={() => decide("Rejected")} disabled={saving}
                  startIcon={<Cancel />}>
                  Reject & Send Feedback
                </Button>
                <Button variant="contained" color="success" size="large"
                  onClick={() => decide("Accepted")} disabled={saving}
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}>
                  {saving ? "Saving…" : "Accept Resume"}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}