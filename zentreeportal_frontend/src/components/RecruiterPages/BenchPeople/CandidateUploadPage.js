// Route: /jd-resume-upload/:token
// This is a PUBLIC page — no login required
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Button, CircularProgress,
         Alert, Paper, Chip, LinearProgress } from "@mui/material";
import { CloudUpload, CheckCircle, PictureAsPdf } from "@mui/icons-material";

const BASE = process.env.REACT_APP_API_BASE_URL;
const toBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result.split(",")[1]);
  r.onerror = () => rej(new Error("Read failed"));
  r.readAsDataURL(file);
});

export default function CandidateUploadPage() {
  const { token } = useParams();
  const [meta,     setMeta]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [file,     setFile]     = useState(null);
  const [uploading,setUploading]= useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE}/jd-review/public/upload/${token}`)
      .then(r => r.json())
      .then(d => { if (!d.success) throw new Error(d.message); setMeta(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError("");
    try {
      const b64 = await toBase64(file);
      const res = await fetch(`${BASE}/jd-review/public/upload/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_b64: b64 }),
      }).then(r => r.json());
      if (!res.success) throw new Error(res.message);
      setDone(true);
    } catch(e) { setError(e.message); }
    finally { setUploading(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (error && !meta) return (
    <Box display="flex" justifyContent="center" mt={10}>
      <Alert severity="error" sx={{ maxWidth: 480 }}>{error}</Alert>
    </Box>
  );

  return (
    <Box maxWidth={680} mx="auto" mt={6} px={2}>
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
        {/* Header */}
        <Box sx={{ p: 3, background: "linear-gradient(135deg, #0f172a, #1a237e)" }}>
          <Typography color="#fff" fontWeight={800} variant="h5">ZentreeLabs</Typography>
          <Typography color="rgba(255,255,255,0.6)" fontSize={13}>Tailored Resume Upload</Typography>
        </Box>

        <Box p={3}>
          {done ? (
            <Box textAlign="center" py={4}>
              <CheckCircle sx={{ fontSize: 64, color: "#15803d" }} />
              <Typography variant="h5" fontWeight={800} color="success.main" mt={2}>Resume Submitted!</Typography>
              <Typography color="text.secondary" mt={1}>
                Our senior reviewer has been notified and will review your resume shortly.
              </Typography>
            </Box>
          ) : (
            <>
              {meta?.rejection_count > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>Previous feedback:</strong> {meta.feedback}
                </Alert>
              )}

              <Typography fontWeight={700} fontSize="1.1rem" mb={0.5}>
                Hi {meta?.candidate_name} 👋
              </Typography>
              <Typography color="text.secondary" fontSize={13} mb={2}>
                You've been shortlisted for the role below. Please tailor your resume to match
                the JD and upload it here.
              </Typography>

              <Box p={2.5} bgcolor="#f0f9ff" borderRadius={2} mb={3}
                sx={{ border: "1px solid #bae6fd" }}>
                <Box display="flex" gap={1} alignItems="center" mb={1}>
                  <Typography fontWeight={800} fontSize="1rem">{meta?.job_title}</Typography>
                  <Chip label={meta?.client_name} size="small" sx={{ bgcolor: "#e0f2fe", color: "#0369a1" }} />
                </Box>
                {meta?.job_description && (
                  <>
                    <Typography fontSize={12} fontWeight={600} color="text.secondary"
                      textTransform="uppercase" mb={0.5}>Job Description</Typography>
                    <Typography fontSize={13} sx={{ whiteSpace: "pre-wrap" }}>
                      {meta.job_description}
                    </Typography>
                  </>
                )}
                {meta?.skills_required && (
                  <Box mt={1.5}>
                    <Typography fontSize={12} fontWeight={600} color="text.secondary"
                      textTransform="uppercase" mb={0.5}>Required Skills</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {String(meta.skills_required).split(",").filter(Boolean).map((s, i) => (
                        <Chip key={i} label={s.trim()} size="small"
                          sx={{ fontSize: 11, bgcolor: "#e8eaf6", color: "#1a237e" }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Upload zone */}
              <Box onClick={() => fileRef.current?.click()}
                sx={{
                  border: file ? "2px solid #15803d" : "2px dashed #7dd3fc",
                  borderRadius: 2, p: 2.5, cursor: "pointer",
                  bgcolor: file ? "#f0fdf4" : "#f0f9ff",
                  display: "flex", alignItems: "center", gap: 2,
                  "&:hover": { bgcolor: file ? "#dcfce7" : "#e0f2fe" },
                }}>
                <PictureAsPdf sx={{ fontSize: 36, color: file ? "#15803d" : "#7dd3fc" }} />
                <Box flex={1}>
                  {file
                    ? <><Typography fontWeight={700} color="success.dark">{file.name}</Typography>
                        <Typography fontSize={11} color="text.secondary">{(file.size/1024).toFixed(0)} KB</Typography></>
                    : <><Typography fontWeight={600} color="#0369a1">Click to select your tailored resume (PDF)</Typography>
                        <Typography fontSize={11} color="text.secondary">PDF only</Typography></>
                  }
                </Box>
                <input ref={fileRef} type="file" accept=".pdf,application/pdf" hidden
                  onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
              </Box>

              {uploading && <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />}
              {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}

              <Button fullWidth variant="contained" onClick={handleUpload}
                disabled={!file || uploading} sx={{ mt: 2.5, py: 1.5, fontWeight: 700,
                  bgcolor: "#0369a1", "&:hover": { bgcolor: "#075985" } }}
                startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUpload />}>
                {uploading ? "Uploading…" : "Submit Resume for Review"}
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}