// src/pages/CandidateOfferPortal.jsx
//
// PUBLIC PAGE — no auth required.
// Route:  /offer/:token
//
// Add to your router (App.jsx or routes file):
//   import CandidateOfferPortal from "./pages/CandidateOfferPortal";
//   <Route path="/offer/:token" element={<CandidateOfferPortal />} />
//
// This page is intentionally standalone — no sidebar, no nav.

import React, { useEffect, useState, useRef } from "react";
import {
  Box, Typography, Button, CircularProgress, Alert,
  Chip, Divider, LinearProgress, IconButton, Tooltip,
  Grid, Card, CardContent,
} from "@mui/material";
import {
  CheckCircle, Cancel, CloudUpload, Delete,
  Description, RocketLaunch, ThumbDown,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";

// ── Design tokens (matches the rest of your app) ─────────────────────────────
const NAVY   = "#0f172a";
const INDIGO = "#1a237e";
const BLUE   = "#1d4ed8";
const SLATE  = "#64748b";

const OFFER_BASE = process.env.REACT_APP_API_BASE_URL;  // same BASE as your app

// ── Document list that candidates must upload ─────────────────────────────────
// Reuses the same categories from OnboardingPage.jsx
const REQUIRED_DOCS = [
  { name: "Aadhar Card",                    category: "Identity",     required: true  },
  { name: "PAN Card",                       category: "Identity",     required: true  },
  { name: "10th Marksheet",                 category: "Education",    required: true  },
  { name: "12th Marksheet",                 category: "Education",    required: true  },
  { name: "Graduation Certificate",         category: "Education",    required: false },
  { name: "Previous Offer Letter",          category: "Professional", required: false },
  { name: "Relieving Letter",               category: "Professional", required: false },
  { name: "Last 3 Months Payslips",         category: "Professional", required: false },
  { name: "Photograph",                     category: "Other",        required: true  },
  { name: "Signed Offer Letter",            category: "Other",        required: true  },
];

// ── Single document upload row ─────────────────────────────────────────────────
function DocRow({ doc, idx, file, onFileChange, onFileRemove }) {
  const inputRef = useRef(null);
  return (
    <Box
      sx={{
        display: "flex", alignItems: "center", gap: 1.5,
        p: 1.5, borderRadius: "10px",
        border: `1px solid ${file ? "#bbf7d0" : "#e2e8f0"}`,
        bgcolor: file ? "#f0fdf4" : "#fff",
        transition: "all 0.15s",
      }}
    >
      {/* Status icon */}
      <Box sx={{ flexShrink: 0 }}>
        {file
          ? <CheckCircle sx={{ fontSize: 20, color: "#16a34a" }} />
          : <Box sx={{
              width: 20, height: 20, borderRadius: "50%",
              border: `2px solid ${doc.required ? "#dc2626" : "#cbd5e1"}`,
              bgcolor: "#fff",
            }} />
        }
      </Box>

      {/* Name + category */}
      <Box flex={1}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
          {doc.name}
          {doc.required && (
            <Typography component="span" sx={{ fontSize: 11, color: "#dc2626", ml: 0.5 }}>*</Typography>
          )}
        </Typography>
        <Typography sx={{ fontSize: 11, color: SLATE }}>{doc.category}</Typography>
      </Box>

      {/* File info or upload button */}
      {file ? (
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            icon={<Description sx={{ fontSize: 12 }} />}
            label={file.name.length > 20 ? file.name.slice(0, 20) + "…" : file.name}
            size="small"
            sx={{ fontSize: 10, bgcolor: "#eff6ff", color: BLUE, maxWidth: 160 }}
          />
          <Tooltip title="Remove file">
            <IconButton size="small" onClick={() => onFileRemove(idx)}
              sx={{ color: "#dc2626", p: 0.4 }}>
              <Delete sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Button
          size="small" variant="outlined"
          startIcon={<CloudUpload sx={{ fontSize: 14 }} />}
          onClick={() => inputRef.current?.click()}
          sx={{
            fontSize: 11, py: 0.5, px: 1.5, borderRadius: "8px",
            borderColor: "#e2e8f0", color: SLATE,
            "&:hover": { borderColor: INDIGO, color: INDIGO, bgcolor: "#f0f4ff" },
          }}
        >
          Upload
        </Button>
      )}

      <input
        type="file" hidden ref={inputRef}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onFileChange(idx, f);
          e.target.value = "";
        }}
      />
    </Box>
  );
}

// ── Main portal component ─────────────────────────────────────────────────────
export default function CandidateOfferPortal() {
  const { token } = useParams();

  const [phase,     setPhase]     = useState("loading"); // loading | offer | uploading | done | declined | error
  const [offerData, setOfferData] = useState(null);
  const [error,     setError]     = useState("");
  const [files,     setFiles]     = useState({});       // { docIndex: File }
  const [submitting, setSubmitting] = useState(false);
  const [progress,   setProgress]   = useState(0);

  // ── Load offer data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setPhase("error"); setError("Invalid link"); return; }

    fetch(`${OFFER_BASE}/onboarding/offer-portal/${token}`)
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          setError(data.message || "This offer link is invalid or has expired.");
          setPhase("error");
          return;
        }
        if (data.already_accepted) {
          setPhase("done");
          return;
        }
        setOfferData(data.candidate);
        setPhase("offer");
      })
      .catch(() => {
        setError("Could not load offer details. Please try again.");
        setPhase("error");
      });
  }, [token]);

  // ── File handlers ────────────────────────────────────────────────────────────
  const handleFileChange = (idx, file) => setFiles(p => ({ ...p, [idx]: file }));
  const handleFileRemove = (idx) => setFiles(p => { const n = { ...p }; delete n[idx]; return n; });

  // ── Validate required docs before submit ─────────────────────────────────────
  const missingRequired = REQUIRED_DOCS
    .map((doc, idx) => ({ ...doc, idx }))
    .filter(doc => doc.required && !files[doc.idx]);

  // ── Submit (accept + upload) ──────────────────────────────────────────────────
  const handleAccept = async () => {
    if (missingRequired.length > 0) {
      setError(`Please upload all required documents: ${missingRequired.map(d => d.name).join(", ")}`);
      return;
    }
    setSubmitting(true); setError(""); setProgress(10);

    const fd = new FormData();
    fd.append("action", "accept");

    REQUIRED_DOCS.forEach((doc, idx) => {
      fd.append(`doc_name_${idx}`,     doc.name);
      fd.append(`doc_category_${idx}`, doc.category);
      if (files[idx]) fd.append(`file_${idx}`, files[idx]);
    });

    setProgress(40);

    try {
      const res  = await fetch(`${OFFER_BASE}/onboarding/offer-portal/${token}/respond`, {
        method: "POST",
        body: fd,
        // NOTE: no Content-Type header — browser sets it with boundary for multipart
      });
      const data = await res.json();
      setProgress(100);

      if (!data.success) {
        setError(data.message || "Submission failed. Please try again.");
        setSubmitting(false);
        setProgress(0);
        return;
      }
      setPhase("done");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
      setProgress(0);
    }
  };

  // ── Decline ───────────────────────────────────────────────────────────────────
  const handleDecline = async () => {
    if (!window.confirm("Are you sure you want to decline this offer?")) return;
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("action", "decline");
      const res  = await fetch(`${OFFER_BASE}/onboarding/offer-portal/${token}/respond`, {
        method: "POST", body: fd,
      });
      const data = await res.json();
      if (data.success) setPhase("declined");
      else setError(data.message || "Could not process your response.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  RENDER PHASES
  // ─────────────────────────────────────────────────────────────────────────────

  // Loading
  if (phase === "loading") return (
    <CenteredShell>
      <CircularProgress sx={{ color: INDIGO }} />
      <Typography sx={{ mt: 2, fontSize: 14, color: SLATE }}>Loading your offer…</Typography>
    </CenteredShell>
  );

  // Error / expired
  if (phase === "error") return (
    <CenteredShell>
      <Box sx={{
        width: 60, height: 60, borderRadius: "50%",
        bgcolor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", mb: 2,
      }}>
        <Cancel sx={{ fontSize: 28, color: "#dc2626" }} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 18, color: NAVY, mb: 1 }}>Link unavailable</Typography>
      <Typography sx={{ fontSize: 14, color: SLATE, textAlign: "center", maxWidth: 360 }}>
        {error || "This offer link is invalid or has expired. Please contact your HR representative."}
      </Typography>
    </CenteredShell>
  );

  // Already accepted
  if (phase === "done") return (
    <CenteredShell>
      <Box sx={{
        width: 64, height: 64, borderRadius: "50%",
        bgcolor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", mb: 2,
      }}>
        <CheckCircle sx={{ fontSize: 32, color: "#16a34a" }} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 20, color: NAVY, mb: 1 }}>
        Offer accepted!
      </Typography>
      <Typography sx={{ fontSize: 14, color: SLATE, textAlign: "center", maxWidth: 400 }}>
        Thank you for accepting the offer. Your onboarding has been initiated.
        Our HR team will be in touch with the next steps shortly.
      </Typography>
    </CenteredShell>
  );

  // Declined
  if (phase === "declined") return (
    <CenteredShell>
      <Box sx={{
        width: 64, height: 64, borderRadius: "50%",
        bgcolor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", mb: 2,
      }}>
        <ThumbDown sx={{ fontSize: 28, color: SLATE }} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 20, color: NAVY, mb: 1 }}>
        Offer declined
      </Typography>
      <Typography sx={{ fontSize: 14, color: SLATE, textAlign: "center", maxWidth: 400 }}>
        We have recorded your response. We appreciate your time and wish you all the best.
      </Typography>
    </CenteredShell>
  );

  // ── MAIN OFFER VIEW ───────────────────────────────────────────────────────────
  const uploadedCount = Object.keys(files).length;
  const totalDocs     = REQUIRED_DOCS.length;
  const uploadPct     = totalDocs ? Math.round((uploadedCount / totalDocs) * 100) : 0;

  return (
    <Box sx={{
      minHeight: "100vh", bgcolor: "#f1f5f9",
      display: "flex", flexDirection: "column", alignItems: "center",
      py: 4, px: 2,
    }}>
      {/* Card container */}
      <Box sx={{ width: "100%", maxWidth: 680 }}>

        {/* ── Header card ───────────────────────────────────────────────── */}
        <Card elevation={0} sx={{
          border: "1px solid #e2e8f0", borderRadius: "16px",
          overflow: "hidden", mb: 2,
        }}>
          {/* Dark header bar */}
          <Box sx={{
            background: `linear-gradient(135deg, #0d1b4b 0%, ${INDIGO} 100%)`,
            px: 3.5, py: 3,
          }}>
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 12,
              textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.5 }}>
              Offer Letter
            </Typography>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 22, lineHeight: 1.2 }}>
              Congratulations, {offerData?.candidatename}!
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 14, mt: 0.5 }}>
              {offerData?.jobRole} &nbsp;·&nbsp; {offerData?.companyName}
            </Typography>
          </Box>

          {/* Offer letter link if available */}
          {offerData?.offer_letter_url && (
            <Box sx={{ px: 3.5, py: 2, borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", gap: 1 }}>
              <Description sx={{ fontSize: 18, color: INDIGO }} />
              <Typography sx={{ fontSize: 14, color: SLATE, flex: 1 }}>Offer Letter document</Typography>
              <Button
                size="small" variant="outlined"
                href={offerData.offer_letter_url} target="_blank"
                sx={{ fontSize: 12, borderColor: "#e2e8f0", color: INDIGO,
                  "&:hover": { bgcolor: "#f0f4ff", borderColor: INDIGO } }}
              >
                View PDF
              </Button>
            </Box>
          )}

          <CardContent sx={{ px: 3.5, py: 2.5 }}>
            <Typography sx={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
              Please review the offer above and upload the required documents below.
              Once you click <strong style={{ color: NAVY }}>Accept Offer</strong>, your onboarding
              will begin and our HR team will reach out with the next steps.
            </Typography>
          </CardContent>
        </Card>

        {/* ── Document upload card ──────────────────────────────────────── */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "16px", mb: 2 }}>
          <CardContent sx={{ p: 3 }}>
            {/* Progress bar */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: NAVY }}>
                Document upload
              </Typography>
              <Typography sx={{ fontSize: 12, color: uploadedCount === totalDocs ? "#166534" : SLATE,
                fontWeight: 600 }}>
                {uploadedCount} / {totalDocs} uploaded
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate" value={uploadPct}
              sx={{ height: 6, borderRadius: 3, mb: 2.5, bgcolor: "#e2e8f0",
                "& .MuiLinearProgress-bar": {
                  bgcolor: uploadPct === 100 ? "#16a34a" : INDIGO, borderRadius: 3,
                } }}
            />

            {error && (
              <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, borderRadius: "10px" }}>
                {error}
              </Alert>
            )}

            {/* Submitting progress */}
            {submitting && progress > 0 && progress < 100 && (
              <Box mb={2}>
                <LinearProgress variant="determinate" value={progress}
                  sx={{ height: 5, borderRadius: 3, bgcolor: "#e2e8f0",
                    "& .MuiLinearProgress-bar": { bgcolor: INDIGO, borderRadius: 3 } }} />
                <Typography sx={{ fontSize: 11, color: SLATE, mt: 0.5 }}>
                  Uploading documents…
                </Typography>
              </Box>
            )}

            <Typography sx={{ fontSize: 11, color: SLATE, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.2 }}>
              Required <Typography component="span" sx={{ color: "#dc2626" }}>*</Typography>
            </Typography>

            <Box display="flex" flexDirection="column" gap={1} mb={2.5}>
              {REQUIRED_DOCS.filter(d => d.required).map((doc) => {
                const idx = REQUIRED_DOCS.indexOf(doc);
                return (
                  <DocRow key={idx} doc={doc} idx={idx}
                    file={files[idx] || null}
                    onFileChange={handleFileChange}
                    onFileRemove={handleFileRemove}
                  />
                );
              })}
            </Box>

            <Typography sx={{ fontSize: 11, color: SLATE, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.2 }}>
              Optional
            </Typography>

            <Box display="flex" flexDirection="column" gap={1}>
              {REQUIRED_DOCS.filter(d => !d.required).map((doc) => {
                const idx = REQUIRED_DOCS.indexOf(doc);
                return (
                  <DocRow key={idx} doc={doc} idx={idx}
                    file={files[idx] || null}
                    onFileChange={handleFileChange}
                    onFileRemove={handleFileRemove}
                  />
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* ── Action buttons ────────────────────────────────────────────── */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "16px" }}>
          <CardContent sx={{ px: 3.5, py: 2.5 }}>
            {missingRequired.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: "10px", fontSize: 13 }}>
                Still required: {missingRequired.map(d => d.name).join(", ")}
              </Alert>
            )}
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
              <Button
                variant="outlined" color="error"
                startIcon={<Cancel />}
                disabled={submitting}
                onClick={handleDecline}
                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
              >
                Decline offer
              </Button>
              <Button
                variant="contained"
                startIcon={submitting
                  ? <CircularProgress size={16} color="inherit" />
                  : <RocketLaunch />}
                disabled={submitting || missingRequired.length > 0}
                onClick={handleAccept}
                sx={{
                  bgcolor: INDIGO, borderRadius: "10px",
                  textTransform: "none", fontWeight: 700,
                  px: 3, py: 1.2,
                  "&:hover": { bgcolor: "#0d1757" },
                  "&:disabled": { bgcolor: "#c5cae9", color: "#fff" },
                }}
              >
                {submitting ? "Submitting…" : "Accept offer & submit documents"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Footer note */}
        <Typography sx={{ fontSize: 11, color: "#94a3b8", textAlign: "center", mt: 2 }}>
          Accepted files: PDF, PNG, JPG, DOC, DOCX &nbsp;·&nbsp; Max file size: 10 MB per document
        </Typography>

      </Box>
    </Box>
  );
}

// ── Reusable centered layout wrapper ─────────────────────────────────────────
function CenteredShell({ children }) {
  return (
    <Box sx={{
      minHeight: "100vh", bgcolor: "#f1f5f9",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      px: 2, py: 4,
    }}>
      {children}
    </Box>
  );
}