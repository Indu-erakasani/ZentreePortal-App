

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

// ── Shared detail component ───────────────────────────────────────────────────
import CandidateDetailContent, { nameInitials, fmtSalary, STATUS_COLOR, STAGE_COLOR } from "./Candidatedetailcontent";

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
const STATUSES  = ["New", "In Review", "Shortlisted", "Interviewed", "Offered", "Hired", "Rejected", "On Hold"];
const SOURCES   = ["LinkedIn", "Naukri", "Indeed", "Referral", "Job Portal", "Direct", "Other"];
const NOTICES   = ["Immediate", "15 days", "30 days", "60 days", "90 days"];
const EXP_BANDS = [
  { label: "All Experience", min: "",   max: ""   },
  { label: "0–2 years",      min: "0",  max: "2"  },
  { label: "3–5 years",      min: "3",  max: "5"  },
  { label: "6–10 years",     min: "6",  max: "10" },
  { label: "10+ years",      min: "10", max: ""   },
];

const EMPTY_FORM = {
  name: "", email: "", phone: "", current_role: "", current_company: "",
  experience: "", skills: "", location: "", current_salary: "",
  expected_salary: "", notice_period: "30 days", source: "LinkedIn",
  status: "New", linked_job_id: "", linked_job_mongo_id: "", linked_job_title: "", notes: "",
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
      <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function Resumes() {
  const [resumes,     setResumes]     = useState([]);
  const [jobs,        setJobs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [statusF,     setStatusF]     = useState("");
  const [expF,        setExpF]        = useState("");
  const [jobF,        setJobF]        = useState("");
  const [clientF,     setClientF]     = useState("");
  const [clients,     setClients]     = useState([]);

  const [formOpen,    setFormOpen]    = useState(false);
  const [detailOpen,  setDetailOpen]  = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [pdfOpen,     setPdfOpen]     = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);

  const [addFile,     setAddFile]     = useState(null);
  const formFileRef = useRef(null);

  const [inlineFiles, setInlineFiles] = useState([]);
  const [showParsing, setShowParsing] = useState(false);
  const inlineRef = useRef(null);

  const [bulkOpen,    setBulkOpen]    = useState(false);
  const [bulkFiles,   setBulkFiles]   = useState([]);
  const [bulkStep,    setBulkStep]    = useState(0);
  const [bulkSaving,  setBulkSaving]  = useState(false);
  const [bulkDone,    setBulkDone]    = useState(false);
  const [recruiters,  setRecruiters]  = useState([]);
  const [allTracking, setAllTracking] = useState([]);

  // ── Loaders ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try { setLoading(true); setError(""); const res = await getAllResumes(); setResumes(res.data || []); }
    catch (err) { setError(err?.message || "Failed to load candidates"); setResumes([]); }
    finally { setLoading(false); }
  }, []);

  const loadJobs = useCallback(async () => {
    try { const res = await getAllJobs(); setJobs(res.data || []); } catch { setJobs([]); }
  }, []);

  const loadClients = useCallback(async () => {
    try { const res = await getAllClients(); setClients(res.data || []); } catch { setClients([]); }
  }, []);

  const loadRecruiters = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE}/user/`, { headers: getHeaders() });
      const data = await res.json();
      setRecruiters((data.data || []).filter(u => u.role === "recruiter"));
    } catch { setRecruiters([]); }
  }, []);

  const loadAllTracking = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE}/tracking/`, { headers: getHeaders() });
      const data = await res.json();
      setAllTracking(data.data || []);
    } catch { setAllTracking([]); }
  }, []);

  useEffect(() => {
    load(); loadJobs(); loadClients(); loadRecruiters(); loadAllTracking();
  }, [load, loadJobs, loadClients, loadRecruiters, loadAllTracking]);

  // Build a resume_id → latest tracking record map for the table column
  const trackingMap = {};
  allTracking.forEach(t => { if (!trackingMap[t.resume_id]) trackingMap[t.resume_id] = t; });

  // ── Filtering ──────────────────────────────────────────────────────────────
  const expBand      = EXP_BANDS.find(b => b.label === expF);
  const clientJobIds = clientF ? jobs.filter(j => j.client_id === clientF).map(j => j.job_id) : null;

  const filtered = resumes.filter(r => {
    const q   = search.toLowerCase();
    const mQ  = !q || r.name?.toLowerCase().includes(q) || r.skills?.toLowerCase().includes(q) || r.resume_id?.toLowerCase().includes(q);
    const mS  = !statusF || r.status === statusF;
    const selectedJob = jobs.find(j => j._id === jobF);
    const mJ  = !jobF || r.linked_job_id === selectedJob?.job_id;
    const mE  = !expBand || expBand.label === "All Experience" ||
      (expBand.min === "10" ? r.experience >= 10 : r.experience >= Number(expBand.min) && r.experience <= Number(expBand.max));
    const mC  = !clientJobIds || clientJobIds.includes(r.linked_job_id);
    return mQ && mS && mJ && mE && mC;
  });

  const stats = {
    total:       resumes.length,
    newCount:    resumes.filter(r => r.status === "New").length,
    shortlisted: resumes.filter(r => r.status === "Shortlisted").length,
    interviewed: resumes.filter(r => r.status === "Interviewed").length,
  };

  // ── Dialog helpers ─────────────────────────────────────────────────────────
  const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setAddFile(null); setFormOpen(true); };
  const openEdit   = r  => { setSelected(r); setFormData({ ...EMPTY_FORM, ...r }); setAddFile(null); setFormOpen(true); };
  const openDetail = r  => { setSelected(r); setDetailOpen(true); };
  const openDelete = r  => { setSelected(r); setDeleteOpen(true); };
  const openPdf    = r  => { setSelected(r); setPdfOpen(true); };

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === "linked_job_id") {
      const job = jobs.find(j => j._id === value);
      setFormData(p => ({
        ...p,
        linked_job_id:       job?.job_id || "",
        linked_job_mongo_id: value,
        linked_job_title:    job?.title  || "",
      }));
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

  // ── Inline PDF upload & parsing ────────────────────────────────────────────
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
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={48} /></Box>;

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
                  {["Candidate", "Current Role", "Exp", "Skills", "Expected Salary", "Notice", "Applied For", "Pipeline Stage", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
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
                            const linkedJob = jobs.find(j => j.job_id === r.linked_job_id);
                            return linkedJob?.client_name ? (
                              <Typography fontSize={10} color="text.secondary" fontWeight={600}
                                sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.2 }}>
                                <Business sx={{ fontSize: 10 }} />{linkedJob.client_name}
                              </Typography>
                            ) : null;
                          })()}
                          <Typography fontSize={12} color="#0277bd" fontWeight={600}>{r.linked_job_id}</Typography>
                          <Typography fontSize={11} color="text.secondary">{r.linked_job_title}</Typography>
                        </Box>
                      ) : (
                        <Typography fontSize={12} color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const track = trackingMap[r.resume_id];
                        if (!track) return <Typography fontSize={12} color="text.disabled">—</Typography>;
                        return (
                          <Box>
                            <Chip label={track.current_stage} size="small"
                              color={STAGE_COLOR[track.current_stage] || "default"}
                              sx={{ fontWeight: 700, fontSize: 10, mb: 0.3 }} />
                            <Typography fontSize={10} color="text.secondary">{track.pipeline_status}</Typography>
                          </Box>
                        );
                      })()}
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

      {/* ── Candidate Detail Dialog — uses shared component ─────────────────── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { minHeight: "70vh" } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          Candidate Details
        </DialogTitle>
        {selected && (
          <CandidateDetailContent
            candidate={selected}
            jobs={jobs}
            recruiters={recruiters}
            onClose={() => setDetailOpen(false)}
            onEdit={() => { setDetailOpen(false); openEdit(selected); }}
            onViewPdf={() => { setDetailOpen(false); openPdf(selected); }}
            // No placementData here — Resumes page doesn't need the Billing tab
          />
        )}
      </Dialog>

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
                      <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Full Name" name="name" value={currentEntry.formData.name} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required type="email" label="Email" name="email" value={currentEntry.formData.email} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Phone" name="phone" value={currentEntry.formData.phone} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Location" name="location" value={currentEntry.formData.location} onChange={handleBulkChange} /></Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Professional Details</Typography>
                    <Grid container spacing={2} mb={2}>
                      <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Role" name="current_role" value={currentEntry.formData.current_role} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Company" name="current_company" value={currentEntry.formData.current_company} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Experience (yrs)" name="experience" value={currentEntry.formData.experience} onChange={handleBulkChange} inputProps={{ min: 0 }} /></Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Source" name="source" value={currentEntry.formData.source} onChange={handleBulkChange}>
                          {SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Status" name="status" value={currentEntry.formData.status} onChange={handleBulkChange}>
                          {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12}><TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={3} size="small" label="Skills (comma-separated)" name="skills" value={currentEntry.formData.skills} onChange={handleBulkChange} placeholder="e.g. React, Node.js, MongoDB" /></Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Compensation &amp; Availability</Typography>
                    <Grid container spacing={2} mb={2}>
                      <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Current Salary (₹)" name="current_salary" value={currentEntry.formData.current_salary} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={currentEntry.formData.expected_salary} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Notice Period" name="notice_period" value={currentEntry.formData.notice_period} onChange={handleBulkChange}>
                          {NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Link to Job" name="linked_job_id" value={currentEntry.formData.linked_job_id} onChange={handleBulkChange}>
                          <MenuItem value="">No Job Linked</MenuItem>
                          {jobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} - {j.title}</MenuItem>)}
                        </TextField>
                      </Grid>
                    </Grid>
                    <TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={2} size="small" label="Notes" name="notes" value={currentEntry.formData.notes} onChange={handleBulkChange} />
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
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Full Name" name="name" value={formData.name} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required type="email" label="Email" name="email" value={formData.email} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Phone" name="phone" value={formData.phone} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Location" name="location" value={formData.location} onChange={handleChange} /></Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Professional Details</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Role" name="current_role" value={formData.current_role} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Company" name="current_company" value={formData.current_company} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Experience (years)" name="experience" value={formData.experience} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Source" name="source" value={formData.source} onChange={handleChange}>
                  {SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={2} label="Skills (comma-separated)" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g. React, Node.js, MongoDB" />
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Compensation &amp; Availability</Typography>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Current Salary (₹)" name="current_salary" value={formData.current_salary} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={formData.expected_salary} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={4}>
                <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Notice Period" name="notice_period" value={formData.notice_period} onChange={handleChange}>
                  {NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Status" name="status" value={formData.status} onChange={handleChange}>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Linked Job"
                  name="linked_job_id" value={formData.linked_job_mongo_id || ""} onChange={handleChange}>
                  <MenuItem value="">No Job Linked</MenuItem>
                  {jobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} - {j.title}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={3} size="small" label="Notes" name="notes" value={formData.notes} onChange={handleChange} />
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