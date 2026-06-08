import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, TextField, MenuItem, Button, CircularProgress,
  Alert, Chip, LinearProgress, Avatar, Divider, Paper,
} from "@mui/material";
import {
  CloudUpload, CheckCircle, Description, PictureAsPdf, Close as CloseIcon,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import SkillRatingInput from "./SkillRatingInput";
const BASE = process.env.REACT_APP_API_BENCH_URL;

const NOTICES          = ["Immediate", "15 days", "30 days", "60 days", "90 days"];
const EMPLOYMENT_TYPES = ["Permanent", "Contract", "C2H", "Freelance"];

const EMPTY_FORM = {
  name: "", email: "", phone: "", current_role: "", skills: [],
  experience: "", location: "", current_salary: "", expected_salary: "",
  notice_period: "Immediate", last_client: "", last_project: "",
  employment_type: "Permanent", notes: "",
};

const toBase64 = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result.split(",")[1]);
  r.onerror = () => rej(new Error("Read failed"));
  r.readAsDataURL(file);
});

export default function BenchCandidateForm() {
  const { token } = useParams();
  const fileRef   = useRef(null);

  const [meta,      setMeta]      = useState(null);       // { label, expires_at }
  const [metaError, setMetaError] = useState("");
  const [formData,  setFormData]  = useState(EMPTY_FORM);
  const [pdfFile,   setPdfFile]   = useState(null);
  const [fileId,    setFileId]    = useState("");
  const [parsing,   setParsing]   = useState(false);
  const [parseMsg,  setParseMsg]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);
  const [submittedId, setSubmittedId] = useState("");

  // Validate token on load
  useEffect(() => {
    fetch(`${BASE}/public/bench-form/${token}`)
      .then(r => r.json())
      .then(res => {
        if (!res.success) setMetaError(res.message || "Invalid link");
        else setMeta(res);
      })
      .catch(() => setMetaError("Could not connect. Please try again later."));
  }, [token]);

  const handleChange = e =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = "";
    setPdfFile(file);
    setParsing(true);
    setParseMsg("AI is reading your resume…");
    try {
      const b64 = await toBase64(file);
      const res = await fetch(`${BASE}/public/bench-form/${token}/parse-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_b64: b64 }),
      }).then(r => r.json());

      if (res.success && res.data) {
        setFormData(p => ({ ...p, ...res.data,
          experience:      res.data.experience      || "",
          current_salary:  res.data.current_salary  || "",
          expected_salary: res.data.expected_salary || "",
        }));
        if (res.data?.skills && typeof res.data.skills === "string") {
            const converted = res.data.skills.split(",")
              .map(s => s.trim()).filter(Boolean)
              .map(name => ({ name, rating: 3 }));
            setFormData(p => ({ ...p, skills: converted }));
          } else if (Array.isArray(res.data?.skills)) {
            setFormData(p => ({ ...p, skills: res.data.skills }));
          }
        setFileId(res.file_id || "");
        setParseMsg("Details auto-filled from your resume — please review and correct if needed.");
      } else {
        setFileId(res.file_id || "");
        setParseMsg("Could not auto-read resume — please fill in manually.");
      }
    } catch {
      setParseMsg("Could not auto-read resume — please fill in manually.");
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!formData.name || !formData.email) {
      setError("Name and Email are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/public/bench-form/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          experience:      formData.experience      ? Number(formData.experience)      : 0,
          current_salary:  formData.current_salary  ? Number(formData.current_salary)  : 0,
          expected_salary: formData.expected_salary ? Number(formData.expected_salary) : 0,
          file_id: fileId,
        }),
      }).then(r => r.json());

      if (!res.success) throw new Error(res.message || "Submission failed");
      setSubmittedId(res.bench_id);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Invalid / expired link ─────────────────────────────────────────────────
  if (metaError) return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f8fafc">
      <Box textAlign="center" p={4}>
        <Typography variant="h5" fontWeight={700} color="error" mb={1}>Link Invalid</Typography>
        <Typography color="text.secondary">{metaError}</Typography>
      </Box>
    </Box>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!meta) return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
      <CircularProgress />
    </Box>
  );

  // ── Success ────────────────────────────────────────────────────────────────
  if (done) return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f0fdf4">
      <Box textAlign="center" p={4} maxWidth={480}>
        <Avatar sx={{ width: 80, height: 80, bgcolor: "#dcfce7", mx: "auto", mb: 2 }}>
          <CheckCircle sx={{ fontSize: 48, color: "#15803d" }} />
        </Avatar>
        <Typography variant="h4" fontWeight={800} color="success.dark" mb={1}>You're Submitted!</Typography>
        <Typography color="text.secondary" mb={2}>
          Your profile has been received. Our team will review and reach out soon.
        </Typography>
        {submittedId && (
          <Chip label={`Reference: ${submittedId}`} variant="outlined" color="success" />
        )}
      </Box>
    </Box>
  );

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <Box minHeight="100vh" bgcolor="#f8fafc" py={4} px={2}>
      <Box maxWidth={680} mx="auto">

        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight={800} color="#0369a1">{meta.label}</Typography>
          <Typography color="text.secondary" mt={0.5} fontSize={14}>
            Fill in your details below. Upload your resume for AI auto-fill.
          </Typography>
          {meta.expires_at && (
            <Chip label={`Link valid till ${new Date(meta.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
              size="small" variant="outlined" sx={{ mt: 1.5, fontSize: 11, color: "#64748b", borderColor: "#cbd5e1" }} />
          )}
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>

          {/* Resume Upload */}
          <Box p={3} bgcolor="#f0f9ff" sx={{ borderBottom: "1px solid #e2e8f0" }}>
            <Typography fontWeight={700} fontSize={13} color="#0369a1" mb={1.5}>
              Upload Resume (optional — AI will auto-fill your details)
            </Typography>
            <Box onClick={() => fileRef.current?.click()} sx={{
              border: pdfFile ? "2px solid #15803d" : "2px dashed #7dd3fc",
              borderRadius: 2, p: 2, display: "flex", alignItems: "center", gap: 2,
              cursor: "pointer", bgcolor: pdfFile ? "#f0fdf4" : "#fff",
              transition: "all 0.2s", "&:hover": { bgcolor: pdfFile ? "#dcfce7" : "#e0f2fe" },
            }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: pdfFile ? "#dcfce7" : "#e0f2fe", flexShrink: 0 }}>
                {pdfFile ? <CheckCircle sx={{ color: "#15803d" }} /> : <CloudUpload sx={{ color: "#0369a1" }} />}
              </Avatar>
              <Box flex={1}>
                {pdfFile
                  ? <><Typography fontWeight={700} fontSize={13} color="success.dark">{pdfFile.name}</Typography>
                      <Typography fontSize={11} color="text.secondary">{(pdfFile.size / 1024).toFixed(0)} KB</Typography></>
                  : <><Typography fontWeight={600} fontSize={13} color="#0369a1">Click to upload your resume PDF</Typography>
                      <Typography fontSize={11} color="text.secondary">PDF only · AI will extract your details automatically</Typography></>
                }
              </Box>
              {pdfFile && (
                <Box component="span" onClick={e => { e.stopPropagation(); setPdfFile(null); setFileId(""); setParseMsg(""); }}
                  sx={{ cursor: "pointer", color: "#94a3b8", "&:hover": { color: "#ef4444" } }}>
                  <CloseIcon fontSize="small" />
                </Box>
              )}
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" hidden onChange={handleFileSelect} />
            </Box>
            {parsing && <LinearProgress sx={{ mt: 1.5, borderRadius: 2 }} />}
            {parseMsg && !parsing && (
              <Typography fontSize={12} color={parseMsg.includes("auto-filled") ? "success.dark" : "text.secondary"}
                mt={1} display="flex" alignItems="center" gap={0.5}>
                {parseMsg.includes("auto-filled") && <CheckCircle sx={{ fontSize: 14 }} />}
                {parseMsg}
              </Typography>
            )}
          </Box>

          {/* Form Fields */}
          <Box p={3} display="flex" flexDirection="column" gap={2.5}>

            <Typography fontWeight={700} fontSize={13} color="#0369a1">Personal Info</Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField required fullWidth size="small" label="Full Name" name="name"
                value={formData.name} onChange={handleChange} />
              <TextField required fullWidth size="small" type="email" label="Email" name="email"
                value={formData.email} onChange={handleChange} />
              <TextField fullWidth size="small" label="Phone" name="phone"
                value={formData.phone} onChange={handleChange} />
              <TextField fullWidth size="small" label="Location" name="location"
                value={formData.location} onChange={handleChange} />
            </Box>

            <Divider />
            <Typography fontWeight={700} fontSize={13} color="#0369a1">Professional Details</Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField fullWidth size="small" label="Current Role / Designation" name="current_role"
                value={formData.current_role} onChange={handleChange} />
              <TextField fullWidth size="small" type="number" label="Experience (years)" name="experience"
                value={formData.experience} onChange={handleChange} inputProps={{ min: 0 }} />
              <TextField select fullWidth size="small" label="Employment Type" name="employment_type"
                value={formData.employment_type} onChange={handleChange}>
                {EMPLOYMENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField select fullWidth size="small" label="Notice Period" name="notice_period"
                value={formData.notice_period} onChange={handleChange}>
                {NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </TextField>
            </Box>
            <Box>
                <Typography fontSize={12} color="text.secondary" fontWeight={600} mb={0.8}>
                  Skills & Proficiency (rate each 1–5)
                </Typography>
                <SkillRatingInput
                  value={formData.skills}
                  onChange={val => setFormData(p => ({ ...p, skills: val }))}
                />
              </Box>

            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField fullWidth size="small" label="Last Client" name="last_client"
                value={formData.last_client} onChange={handleChange} />
              <TextField fullWidth size="small" label="Last Project" name="last_project"
                value={formData.last_project} onChange={handleChange} />
            </Box>

            <Divider />
            <Typography fontWeight={700} fontSize={13} color="#0369a1">Compensation</Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField fullWidth size="small" type="number" label="Current Salary (₹ per annum)" name="current_salary"
                value={formData.current_salary} onChange={handleChange} />
              <TextField fullWidth size="small" type="number" label="Expected Salary (₹ per annum)" name="expected_salary"
                value={formData.expected_salary} onChange={handleChange} />
            </Box>

            <TextField fullWidth multiline rows={3} size="small" label="Anything else you'd like to share"
              name="notes" value={formData.notes} onChange={handleChange} />

            {error && <Alert severity="error">{error}</Alert>}

            <Button variant="contained" size="large" onClick={handleSubmit}
              disabled={saving || !formData.name || !formData.email}
              endIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{ bgcolor: "#0369a1", "&:hover": { bgcolor: "#075985" }, fontWeight: 700, py: 1.5, borderRadius: 2 }}>
              {saving ? "Submitting…" : "Submit My Profile"}
            </Button>

            <Typography fontSize={11} color="text.secondary" textAlign="center">
              Your information will be reviewed by our recruitment team. We'll reach out if there's a match.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}