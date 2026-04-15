




// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import {
//   Box, Card, CardContent, Typography, Button, TextField,
//   MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
//   Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
//   Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
//   InputAdornment, Divider, LinearProgress, Grid, Tabs, Tab, Badge,
// } from "@mui/material";
// import {
//   Add, Search, Edit, Delete, Visibility,
//   Description, Star, People, NewReleases, PersonOff,
//   CloudUpload, CheckCircle, Done, NavigateBefore,
//   Close as CloseIcon, PictureAsPdf, OpenInNew, Business,
//   Inventory2, PersonAdd, Work, SwapHoriz,
//   EditNote, ArrowForward, FilterList, Analytics,
// } from "@mui/icons-material";

// import CandidateDetailContent, { nameInitials, fmtSalary, STATUS_COLOR, STAGE_COLOR } from "./Candidatedetailcontent";

// // ── API helpers ───────────────────────────────────────────────────────────────
// const BASE = process.env.REACT_APP_API_BASE_URL;

// const getHeaders = () => ({
//   "Content-Type": "application/json",
//   Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
// });

// const handle = async (res) => {
//   const data = await res.json();
//   if (!res.ok) throw data;
//   return data;
// };

// const getAllResumes = (p = {}) => {
//   const qs = new URLSearchParams(p).toString();
//   return fetch(`${BASE}/resumes/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
// };
// const createResume = (payload) =>
//   fetch(`${BASE}/resumes/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// const updateResume = (id, payload) =>
//   fetch(`${BASE}/resumes/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// const deleteResume = (id) =>
//   fetch(`${BASE}/resumes/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
// const getAllJobs = () =>
//   fetch(`${BASE}/jobs/`, { headers: getHeaders() }).then(handle);
// const getAllClients = () =>
//   fetch(`${BASE}/clients/`, { headers: getHeaders() }).then(handle);
// const parsePdfViaBackend = (file_b64, file_name) =>
//   fetch(`${BASE}/resumes/parse-pdf`, {
//     method: "POST", headers: getHeaders(),
//     body: JSON.stringify({ file_b64, file_name }),
//   }).then(handle);
// const uploadFileForCandidate = (id, file_b64) =>
//   fetch(`${BASE}/resumes/${id}/upload-file`, {
//     method: "POST", headers: getHeaders(),
//     body: JSON.stringify({ file_b64 }),
//   }).then(handle);
// const getRawResumes = (p = {}) => {
//   const qs = new URLSearchParams(p).toString();
//   return fetch(`${BASE}/resumes/raw/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
// };
// const uploadRawResume = (file_b64, file_name) =>
//   fetch(`${BASE}/resumes/raw/upload`, {
//     method: "POST", headers: getHeaders(),
//     body: JSON.stringify({ file_b64, file_name }),
//   }).then(handle);
// const assignRawToJob = (id, payload) =>
//   fetch(`${BASE}/resumes/raw/${id}/assign-job`, {
//     method: "PUT", headers: getHeaders(),
//     body: JSON.stringify(payload),
//   }).then(handle);
// const convertRaw = (id, payload) =>
//   fetch(`${BASE}/resumes/raw/${id}/convert`, {
//     method: "POST", headers: getHeaders(),
//     body: JSON.stringify(payload),
//   }).then(handle);
// const deleteRaw = (id) =>
//   fetch(`${BASE}/resumes/raw/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
// const createRawManual = (payload) =>
//   fetch(`${BASE}/resumes/raw/manual`, {
//     method: "POST", headers: getHeaders(),
//     body: JSON.stringify(payload),
//   }).then(handle);

// // ── Scoring APIs ──────────────────────────────────────────────────────────────
// const scoreCandidate = (resume_id, job_id) =>
//   fetch(`${BASE}/score/candidate`, {
//     method: "POST", headers: getHeaders(),
//     body: JSON.stringify({ resume_id, job_id }),
//   }).then(handle);

// const getCachedScore = (resume_id, job_id) =>
//   fetch(`${BASE}/score/candidate?resume_id=${resume_id}&job_id=${job_id}`, {
//     headers: getHeaders(),
//   }).then(handle);

// const toBase64 = (file) =>
//   new Promise((res, rej) => {
//     const r = new FileReader();
//     r.onload = () => res(r.result.split(",")[1]);
//     r.onerror = () => rej(new Error("Read failed"));
//     r.readAsDataURL(file);
//   });

// // ── Constants ─────────────────────────────────────────────────────────────────
// const STATUSES  = ["New", "In Review", "Shortlisted", "Interviewed", "Offered", "Hired", "Rejected", "On Hold"];
// const SOURCES   = ["LinkedIn", "Naukri", "Indeed", "Referral", "Job Portal", "Direct", "Other"];
// const NOTICES   = ["Immediate", "15 days", "30 days", "60 days", "90 days"];
// const EXP_BANDS = [
//   { label: "All Experience", min: "",   max: ""  },
//   { label: "0–2 years",      min: "0",  max: "2" },
//   { label: "3–5 years",      min: "3",  max: "5" },
//   { label: "6–10 years",     min: "6",  max: "10"},
//   { label: "10+ years",      min: "10", max: ""  },
// ];

// const RAW_STATUS_COLOR = { Stored: "default", Assigned: "primary", Converted: "success" };
// const PARSE_COLOR = { parsed: "success", failed: "warning", pending: "default", manual: "info" };

// const EMPTY_FORM = {
//   name: "", email: "", phone: "", current_role: "", current_company: "",
//   experience: "", skills: "", location: "", current_salary: "",
//   expected_salary: "", notice_period: "30 days", source: "LinkedIn",
//   status: "New", linked_job_id: "", linked_job_mongo_id: "", linked_job_title: "", notes: "",
// };
// const EMPTY_CONVERT = {
//   name: "", email: "", phone: "", current_role: "", current_company: "",
//   experience: "", skills: "", location: "", current_salary: "",
//   expected_salary: "", notice_period: "30 days", source: "Direct",
//   status: "New", linked_job_id: "", linked_job_mongo_id: "", linked_job_title: "", notes: "",
// };
// const EMPTY_MANUAL_RAW = {
//   name: "", email: "", phone: "", current_role: "", current_company: "",
//   experience: "", skills: "", location: "", current_salary: "",
//   expected_salary: "", notice_period: "30 days",
//   linked_job_id: "", linked_job_mongo_id: "", linked_job_title: "", notes: "",
// };

// // ── Stat card ─────────────────────────────────────────────────────────────────
// const StatCard = ({ title, value, icon, color }) => (
//   <Card>
//     <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
//       <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
//       <Box>
//         <Typography fontSize={12} color="text.secondary" fontWeight={600} textTransform="uppercase">{title}</Typography>
//         <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
//       </Box>
//     </CardContent>
//   </Card>
// );

// // ── Inline upload drop-zone ───────────────────────────────────────────────────
// const InlineUploadZone = ({
//   onFiles, fileRef,
//   label    = "Drag & drop PDF resumes here to upload",
//   sublabel = "AI will auto-extract candidate details · Multiple files supported · PDF only",
// }) => {
//   const [drag, setDrag] = useState(false);
//   return (
//     <Box
//       onDragOver={e => { e.preventDefault(); setDrag(true); }}
//       onDragLeave={() => setDrag(false)}
//       onDrop={e => { e.preventDefault(); setDrag(false); onFiles({ target: { files: e.dataTransfer.files } }); }}
//       onClick={() => fileRef.current?.click()}
//       sx={{
//         border: drag ? "2px dashed #1565c0" : "2px dashed #90caf9",
//         borderRadius: 3, bgcolor: drag ? "#e3f2fd" : "#f8fbff",
//         p: 2.5, display: "flex", alignItems: "center", gap: 2.5,
//         cursor: "pointer", transition: "all 0.2s",
//         "&:hover": { bgcolor: "#e3f2fd", borderColor: "#1565c0" },
//       }}
//     >
//       <Avatar sx={{ width: 52, height: 52, bgcolor: drag ? "#1565c0" : "#e3f2fd", transition: "all 0.2s", flexShrink: 0 }}>
//         <CloudUpload sx={{ fontSize: 28, color: drag ? "#fff" : "#1565c0" }} />
//       </Avatar>
//       <Box flex={1}>
//         <Typography fontWeight={700} color="primary.dark" fontSize="0.95rem">{label}</Typography>
//         <Typography fontSize={12} color="text.secondary" mt={0.3}>{sublabel}</Typography>
//       </Box>
//       <input ref={fileRef} type="file" accept=".pdf,application/pdf" multiple hidden onChange={onFiles} />
//     </Box>
//   );
// };

// // ── Inline parsing progress ───────────────────────────────────────────────────
// const InlineParseProgress = ({ files, onReview, onClear }) => {
//   const allDone = files.every(f => f.status !== "parsing" && f.status !== "pending");
//   const parsed  = files.filter(f => f.status === "done").length;
//   const manual  = files.filter(f => f.status === "error").length;
//   return (
//     <Card variant="outlined" sx={{ borderColor: "#90caf9", borderRadius: 2 }}>
//       <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
//         <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
//           <Box display="flex" alignItems="center" gap={1}>
//             {!allDone && <CircularProgress size={14} />}
//             <Typography fontWeight={700} fontSize="0.88rem">
//               {allDone
//                 ? `Parsing complete — ${parsed} parsed${manual ? `, ${manual} need manual entry` : ""}`
//                 : `Parsing ${files.length} resume${files.length > 1 ? "s" : ""} with AI…`}
//             </Typography>
//           </Box>
//           <Box display="flex" gap={1} alignItems="center">
//             {allDone && <Button variant="contained" size="small" onClick={onReview} startIcon={<Done />}>Review &amp; Save</Button>}
//             <IconButton size="small" onClick={onClear}><CloseIcon fontSize="small" /></IconButton>
//           </Box>
//         </Box>
//         <Box display="flex" flexDirection="column" gap={0.8}>
//           {files.map((entry, i) => (
//             <Box key={i} display="flex" alignItems="center" gap={1.5} sx={{ p: 1, bgcolor: "#f5f7fa", borderRadius: 1.5 }}>
//               <Description fontSize="small" color="action" sx={{ flexShrink: 0 }} />
//               <Box flex={1} minWidth={0}>
//                 <Typography fontSize={12} fontWeight={600} noWrap>{entry.file.name}</Typography>
//                 {entry.status === "parsing" && <LinearProgress sx={{ mt: 0.5, height: 3, borderRadius: 2 }} />}
//               </Box>
//               {entry.status === "pending" && <Chip label="Waiting"       size="small" sx={{ fontSize: 10 }} />}
//               {entry.status === "parsing" && <CircularProgress size={16} />}
//               {entry.status === "done"    && <Chip label="Parsed ✓"      size="small" color="success" sx={{ fontSize: 10 }} />}
//               {entry.status === "error"   && <Chip label="Fill manually" size="small" color="warning" sx={{ fontSize: 10 }} />}
//             </Box>
//           ))}
//         </Box>
//       </CardContent>
//     </Card>
//   );
// };

// // ── PDF Viewer Dialog ─────────────────────────────────────────────────────────
// const PdfViewerDialog = ({ open, onClose, candidate }) => {
//   const [blobUrl,  setBlobUrl]  = React.useState(null);
//   const [fetching, setFetching] = React.useState(false);
//   const [fetchErr, setFetchErr] = React.useState("");

//   React.useEffect(() => {
//     if (!open || !candidate?._id || !candidate?.resume_file) return;
//     let objectUrl = null;
//     setFetching(true); setFetchErr("");
//     fetch(`${BASE}/resumes/${candidate._id}/file`, { headers: getHeaders() })
//       .then(res => { if (!res.ok) throw new Error(`Server returned ${res.status}`); return res.blob(); })
//       .then(blob => { objectUrl = URL.createObjectURL(blob); setBlobUrl(objectUrl); })
//       .catch(err => setFetchErr(err.message || "Failed to load PDF"))
//       .finally(() => setFetching(false));
//     return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); setBlobUrl(null); setFetchErr(""); };
//   }, [open, candidate?._id, candidate?.resume_file]);

//   const handleDownload = () => {
//     if (!blobUrl) return;
//     const a = document.createElement("a");
//     a.href = blobUrl;
//     a.download = `${(candidate?.name || "resume").replace(/\s+/g, "_")}_resume.pdf`;
//     a.click();
//   };

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
//       PaperProps={{ sx: { height: "92vh", display: "flex", flexDirection: "column" } }}>
//       <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", py: 1.5 }}>
//         <Box display="flex" alignItems="center" justifyContent="space-between">
//           <Box display="flex" alignItems="center" gap={1.5}>
//             <PictureAsPdf color="error" />
//             <Box>
//               <Typography fontWeight={700}>{candidate?.name} — Original Resume</Typography>
//               <Typography fontSize={11} color="text.secondary">{candidate?.resume_id} · {candidate?.current_role}</Typography>
//             </Box>
//           </Box>
//           <Box display="flex" gap={1} alignItems="center">
//             {blobUrl && <Tooltip title="Download PDF"><IconButton size="small" onClick={handleDownload}><OpenInNew fontSize="small" /></IconButton></Tooltip>}
//             <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
//           </Box>
//         </Box>
//       </DialogTitle>
//       <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
//         {fetching && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}><CircularProgress size={40} /><Typography color="text.secondary" fontSize={14}>Loading resume…</Typography></Box>}
//         {!fetching && fetchErr && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2} p={3}><PictureAsPdf sx={{ fontSize: 72, color: "#ef9a9a" }} /><Typography color="error" fontWeight={600}>Could not load PDF</Typography><Typography fontSize={13} color="text.secondary">{fetchErr}</Typography></Box>}
//         {!fetching && !fetchErr && !candidate?.resume_file && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}><PictureAsPdf sx={{ fontSize: 72, color: "#bdbdbd" }} /><Typography color="text.secondary" fontWeight={600}>No resume file for this candidate</Typography></Box>}
//         {!fetching && blobUrl && <iframe src={blobUrl} title={`${candidate?.name} Resume`} style={{ width: "100%", height: "100%", border: "none" }} />}
//       </DialogContent>
//     </Dialog>
//   );
// };

// // ── Raw PDF Viewer Dialog ─────────────────────────────────────────────────────
// const RawPdfViewerDialog = ({ open, onClose, raw }) => {
//   const [blobUrl,  setBlobUrl]  = React.useState(null);
//   const [fetching, setFetching] = React.useState(false);
//   const [fetchErr, setFetchErr] = React.useState("");

//   React.useEffect(() => {
//     if (!open || !raw?._id) return;
//     let objectUrl = null;
//     setFetching(true); setFetchErr("");
//     fetch(`${BASE}/resumes/raw/${raw._id}/file`, { headers: getHeaders() })
//       .then(res => { if (!res.ok) throw new Error(`Server returned ${res.status}`); return res.blob(); })
//       .then(blob => { objectUrl = URL.createObjectURL(blob); setBlobUrl(objectUrl); })
//       .catch(err => setFetchErr(err.message || "Failed to load PDF"))
//       .finally(() => setFetching(false));
//     return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); setBlobUrl(null); setFetchErr(""); };
//   }, [open, raw?._id]);

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
//       PaperProps={{ sx: { height: "92vh", display: "flex", flexDirection: "column" } }}>
//       <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", py: 1.5 }}>
//         <Box display="flex" alignItems="center" justifyContent="space-between">
//           <Box display="flex" alignItems="center" gap={1.5}>
//             <PictureAsPdf color="error" />
//             <Box>
//               <Typography fontWeight={700}>{raw?.name || raw?.original_name} — Stored Resume</Typography>
//               <Typography fontSize={11} color="text.secondary">{raw?.raw_id} · {raw?.current_role || "Role not extracted"}</Typography>
//             </Box>
//           </Box>
//           <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
//         </Box>
//       </DialogTitle>
//       <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
//         {fetching && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}><CircularProgress size={40} /><Typography color="text.secondary" fontSize={14}>Loading resume…</Typography></Box>}
//         {!fetching && fetchErr && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}><PictureAsPdf sx={{ fontSize: 72, color: "#ef9a9a" }} /><Typography color="error" fontWeight={600}>{fetchErr}</Typography></Box>}
//         {!fetching && blobUrl && <iframe src={blobUrl} title="Stored Resume" style={{ width: "100%", height: "100%", border: "none" }} />}
//       </DialogContent>
//     </Dialog>
//   );
// };

// // ═════════════════════════════════════════════════════════════════════════════
// //  Main Component
// // ═════════════════════════════════════════════════════════════════════════════
// export default function Resumes() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // ── Client filter from URL ─────────────────────────────────────────────────
//   const _qp = new URLSearchParams(location.search);
//   const [urlClientId,    setUrlClientId]    = useState(_qp.get("client")      || "");
//   const [urlClientName,  setUrlClientName]  = useState(_qp.get("client_name") || "");
//   const [isClientLocked, setIsClientLocked] = useState(!!_qp.get("client"));

//   useEffect(() => {
//     const p     = new URLSearchParams(location.search);
//     const cid   = p.get("client")      || "";
//     const cname = p.get("client_name") || "";
//     setUrlClientId(cid); setUrlClientName(cname); setIsClientLocked(!!cid);
//     setClientF(cid);
//     if (!cid) setJobF("");
//   }, [location.search]);

//   const clearClientFilter = () => {
//     setUrlClientId(""); setUrlClientName(""); setIsClientLocked(false);
//     setClientF(""); setJobF("");
//     navigate("/resumes", { replace: true });
//   };

//   // ── Tabs & core state ──────────────────────────────────────────────────────
//   const [mainTab, setMainTab] = useState(0);

//   const [resumes,     setResumes]     = useState([]);
//   const [jobs,        setJobs]        = useState([]);
//   const [loading,     setLoading]     = useState(true);
//   const [error,       setError]       = useState("");
//   const [search,      setSearch]      = useState("");
//   const [statusF,     setStatusF]     = useState("");
//   const [expF,        setExpF]        = useState("");
//   const [jobF,        setJobF]        = useState("");
//   const [clientF,     setClientF]     = useState(_qp.get("client") || "");
//   const [clients,     setClients]     = useState([]);
//   const [formOpen,    setFormOpen]    = useState(false);
//   const [detailOpen,  setDetailOpen]  = useState(false);
//   const [deleteOpen,  setDeleteOpen]  = useState(false);
//   const [pdfOpen,     setPdfOpen]     = useState(false);
//   const [selected,    setSelected]    = useState(null);
//   const [formData,    setFormData]    = useState(EMPTY_FORM);
//   const [saving,      setSaving]      = useState(false);
//   const [addFile,     setAddFile]     = useState(null);
//   const formFileRef   = useRef(null);
//   const [inlineFiles, setInlineFiles] = useState([]);
//   const [showParsing, setShowParsing] = useState(false);
//   const inlineRef     = useRef(null);
//   const [bulkOpen,    setBulkOpen]    = useState(false);
//   const [bulkFiles,   setBulkFiles]   = useState([]);
//   const [bulkStep,    setBulkStep]    = useState(0);
//   const [bulkSaving,  setBulkSaving]  = useState(false);
//   const [bulkDone,    setBulkDone]    = useState(false);
//   const [recruiters,  setRecruiters]  = useState([]);
//   const [allTracking, setAllTracking] = useState([]);

//   // ── Stored resumes state ───────────────────────────────────────────────────
//   const [rawResumes,     setRawResumes]     = useState([]);
//   const [rawLoading,     setRawLoading]     = useState(false);
//   const [rawSearch,      setRawSearch]      = useState("");
//   const [rawStatusF,     setRawStatusF]     = useState("");
//   const rawUploadRef   = useRef(null);
//   const [rawUploading,   setRawUploading]   = useState(false);
//   const [rawUploadBatch, setRawUploadBatch] = useState([]);

//   // ── Dialogs state ──────────────────────────────────────────────────────────
//   const [assignOpen,   setAssignOpen]   = useState(false);
//   const [assignTarget, setAssignTarget] = useState(null);
//   const [assignJobId,  setAssignJobId]  = useState("");
//   const [assignSaving, setAssignSaving] = useState(false);

//   const [convertOpen,   setConvertOpen]   = useState(false);
//   const [convertTarget, setConvertTarget] = useState(null);
//   const [convertData,   setConvertData]   = useState(EMPTY_CONVERT);
//   const [convertSaving, setConvertSaving] = useState(false);
//   const [convertError,  setConvertError]  = useState("");

//   const [rawPdfOpen, setRawPdfOpen] = useState(false);
//   const [rawPdfDoc,  setRawPdfDoc]  = useState(null);

//   const [clientSelectOpen, setClientSelectOpen] = useState(false);
//   const [pickedClient,     setPickedClient]     = useState(null);

//   const [manualRawOpen,   setManualRawOpen]   = useState(false);
//   const [manualRawData,   setManualRawData]   = useState(EMPTY_MANUAL_RAW);
//   const [manualRawSaving, setManualRawSaving] = useState(false);
//   const [manualRawError,  setManualRawError]  = useState("");
//   const [manualRawFile,   setManualRawFile]   = useState(null);
//   const manualFileRef = useRef(null);

//   // ── Scoring state ──────────────────────────────────────────────────────────
//   const [scoreOpen,    setScoreOpen]    = useState(false);
//   const [scoreData,    setScoreData]    = useState(null);
//   const [scoreLoading, setScoreLoading] = useState(false);
//   const [scoreTarget,  setScoreTarget]  = useState(null);
//   const [scoreJobId,   setScoreJobId]   = useState("");
//   const [scoreMap,     setScoreMap]     = useState({});

//   // ── Loaders ────────────────────────────────────────────────────────────────
//   const load = useCallback(async () => {
//     try { setLoading(true); setError(""); const res = await getAllResumes(); setResumes(res.data || []); }
//     catch (err) { setError(err?.message || "Failed to load candidates"); setResumes([]); }
//     finally { setLoading(false); }
//   }, []);

//   const loadRaw = useCallback(async () => {
//     try { setRawLoading(true); const res = await getRawResumes(); setRawResumes(res.data || []); }
//     catch { setRawResumes([]); }
//     finally { setRawLoading(false); }
//   }, []);

//   const loadJobs = useCallback(async () => {
//     try { const res = await getAllJobs(); setJobs(res.data || []); } catch { setJobs([]); }
//   }, []);
//   const loadClients = useCallback(async () => {
//     try { const res = await getAllClients(); setClients(res.data || []); } catch { setClients([]); }
//   }, []);
//   const loadRecruiters = useCallback(async () => {
//     try {
//       const res  = await fetch(`${BASE}/user/`, { headers: getHeaders() });
//       const data = await res.json();
//       setRecruiters((data.data || []).filter(u => u.role === "recruiter"));
//     } catch { setRecruiters([]); }
//   }, []);
//   const loadAllTracking = useCallback(async () => {
//     try {
//       const res  = await fetch(`${BASE}/tracking/`, { headers: getHeaders() });
//       const data = await res.json();
//       setAllTracking(data.data || []);
//     } catch { setAllTracking([]); }
//   }, []);

//   useEffect(() => {
//     load(); loadRaw(); loadJobs(); loadClients(); loadRecruiters(); loadAllTracking();
//   }, [load, loadRaw, loadJobs, loadClients, loadRecruiters, loadAllTracking]);


//   // Load all cached scores whenever resumes or jobs change
//   useEffect(() => {
//     if (!resumes.length || !jobs.length) return;
//     const pairs = resumes
//       .filter(r => r.linked_job_id)
//       .map(r => ({ resumeId: r._id, jobId: jobs.find(j => j.job_id === r.linked_job_id)?._id }))
//       .filter(p => p.jobId);
//     Promise.all(
//       pairs.map(p =>
//         fetch(`${BASE}/score/candidate?resume_id=${p.resumeId}&job_id=${p.jobId}`, { headers: getHeaders() })
//           .then(r => r.ok ? r.json() : null)
//           .catch(() => null)
//       )
//     ).then(results => {
//       const map = {};
//       results.forEach((res, i) => {
//         if (res?.data) map[`${pairs[i].resumeId}_${pairs[i].jobId}`] = res.data;
//       });
//       setScoreMap(map);
//     });
//   }, [resumes, jobs]);
//   const trackingMap = {};
//   allTracking.forEach(t => { if (!trackingMap[t.resume_id]) trackingMap[t.resume_id] = t; });

//   // ── Filtering ──────────────────────────────────────────────────────────────
//   const expBand      = EXP_BANDS.find(b => b.label === expF);
//   const clientJobIds = clientF ? jobs.filter(j => j.client_id === clientF).map(j => j.job_id) : null;
//   const filtered = resumes.filter(r => {
//     const q  = search.toLowerCase();
//     const mQ = !q || r.name?.toLowerCase().includes(q) || r.skills?.toLowerCase().includes(q) || r.resume_id?.toLowerCase().includes(q);
//     const mS = !statusF || r.status === statusF;
//     const selectedJob = jobs.find(j => j._id === jobF);
//     const mJ = !jobF || r.linked_job_id === selectedJob?.job_id;
//     const mE = !expBand || expBand.label === "All Experience" ||
//       (expBand.min === "10" ? r.experience >= 10 : r.experience >= Number(expBand.min) && r.experience <= Number(expBand.max));
//     const mC = !clientJobIds || clientJobIds.includes(r.linked_job_id);
//     return mQ && mS && mJ && mE && mC;
//   });

//   const filteredRaw = rawResumes.filter(r => {
//     const q  = rawSearch.toLowerCase();
//     const mQ = !q || r.name?.toLowerCase().includes(q) || r.raw_id?.toLowerCase().includes(q)
//                   || r.original_name?.toLowerCase().includes(q) || r.skills?.toLowerCase().includes(q);
//     const mS = !rawStatusF || r.status === rawStatusF;
//     return mQ && mS;
//   });

//   const stats = {
//     total:       resumes.length,
//     newCount:    resumes.filter(r => r.status === "New").length,
//     shortlisted: resumes.filter(r => r.status === "Shortlisted").length,
//     interviewed: resumes.filter(r => r.status === "Interviewed").length,
//   };

//   // ── Dialog helpers ─────────────────────────────────────────────────────────
//   const openCreate = () => { setPickedClient(null); setClientSelectOpen(true); };

//   const handleClientPicked = (client) => {
//     setPickedClient(client); setClientSelectOpen(false); setSelected(null); setAddFile(null);
//     setFormData({ ...EMPTY_FORM, client_name: client?.company_name || "" });
//     setFormOpen(true);
//   };

//   const openEdit   = r => { setSelected(r); setFormData({ ...EMPTY_FORM, ...r }); setAddFile(null); setFormOpen(true); };
//   const openDetail = r => { setSelected(r); setDetailOpen(true); };
//   const openDelete = r => { setSelected(r); setDeleteOpen(true); };
//   const openPdf    = r => { setSelected(r); setPdfOpen(true); };

//   const formClientJobs = pickedClient
//     ? jobs.filter(j => j.client_id === pickedClient._id || j.client_name === pickedClient.company_name)
//     : jobs;

//   const handleChange = e => {
//     const { name, value } = e.target;
//     if (name === "linked_job_id") {
//       const job = jobs.find(j => j._id === value);
//       setFormData(p => ({ ...p, linked_job_id: job?.job_id || "", linked_job_mongo_id: value, linked_job_title: job?.title || "" }));
//     } else {
//       setFormData(p => ({ ...p, [name]: value }));
//     }
//   };

//   const openManualRaw = () => { setManualRawData(EMPTY_MANUAL_RAW); setManualRawError(""); setManualRawFile(null); setManualRawOpen(true); };

//   const handleManualRawChange = e => {
//     const { name, value } = e.target;
//     if (name === "linked_job_id") {
//       const job = jobs.find(j => j._id === value);
//       setManualRawData(p => ({ ...p, linked_job_id: job?.job_id || "", linked_job_mongo_id: value, linked_job_title: job?.title || "" }));
//     } else {
//       setManualRawData(p => ({ ...p, [name]: value }));
//     }
//   };

//   const handleManualRawSave = async (e) => {
//     e.preventDefault(); setManualRawSaving(true); setManualRawError("");
//     try {
//       const payload = { ...manualRawData, experience: manualRawData.experience ? Number(manualRawData.experience) : 0, current_salary: manualRawData.current_salary ? Number(manualRawData.current_salary) : 0, expected_salary: manualRawData.expected_salary ? Number(manualRawData.expected_salary) : 0 };
//       if (manualRawFile) { payload.file_b64 = await toBase64(manualRawFile); payload.file_name = manualRawFile.name; }
//       await createRawManual(payload);
//       setManualRawOpen(false); setManualRawFile(null); loadRaw();
//     } catch (err) { setManualRawError(err?.message || "Save failed"); }
//     finally { setManualRawSaving(false); }
//   };

//   const handleSave = async (e) => {
//     e.preventDefault(); setSaving(true);
//     try {
//       const payload = { ...formData, experience: formData.experience ? Number(formData.experience) : 0, current_salary: formData.current_salary ? Number(formData.current_salary) : 0, expected_salary: formData.expected_salary ? Number(formData.expected_salary) : 0 };
//       if (selected) {
//         await updateResume(selected._id, payload);
//         if (addFile) { const b64 = await toBase64(addFile); await uploadFileForCandidate(selected._id, b64).catch(() => {}); }
//       } else {
//         const created = await createResume(payload);
//         if (addFile && created?.data?._id) { const b64 = await toBase64(addFile); await uploadFileForCandidate(created.data._id, b64).catch(() => {}); }
//       }
//       setAddFile(null); setFormOpen(false); load();
//     } catch (err) { setError(err?.message || "Save failed"); }
//     finally { setSaving(false); }
//   };

//   const handleDelete = async () => {
//     try { await deleteResume(selected._id); setDeleteOpen(false); load(); }
//     catch (err) { setError(err?.message || "Delete failed"); }
//   };

//   const handleFileSelect = async (e) => {
//     const files = Array.from(e.target.files || []).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
//     if (!files.length) return;
//     if (inlineRef.current) inlineRef.current.value = "";
//     const entries = files.map(f => ({ file: f, status: "pending", file_id: "", formData: { ...EMPTY_FORM, status: "New" }, saved: false, errorMsg: "" }));
//     setInlineFiles(entries); setShowParsing(true);
//     const updated = [...entries];
//     await Promise.all(entries.map(async (entry, idx) => {
//       updated[idx] = { ...updated[idx], status: "parsing" };
//       setInlineFiles([...updated]);
//       try {
//         const b64    = await toBase64(entry.file);
//         const result = await parsePdfViaBackend(b64, entry.file.name);
//         const parsed  = result.data    || {};
//         const file_id = result.file_id || "";
//         updated[idx] = { ...updated[idx], status: "done", file_id, formData: { ...EMPTY_FORM, ...parsed, experience: parsed.experience || "", current_salary: parsed.current_salary || "", expected_salary: parsed.expected_salary || "", status: "New" } };
//       } catch (err) {
//         const file_id = err?.file_id || "";
//         updated[idx] = { ...updated[idx], status: "error", file_id, errorMsg: err?.message || "Auto-parse failed — fill manually", formData: { ...EMPTY_FORM, status: "New" } };
//       }
//       setInlineFiles([...updated]);
//     }));
//   };

//   const openBulkReview = () => { setBulkFiles(inlineFiles); setBulkStep(0); setBulkDone(false); setBulkOpen(true); };
//   const clearInline    = () => { setShowParsing(false); setInlineFiles([]); };

//   const handleBulkChange = e => {
//     const { name, value } = e.target;
//     setBulkFiles(prev => prev.map((entry, idx) =>
//       idx !== bulkStep ? entry : {
//         ...entry,
//         formData: name === "linked_job_id"
//           ? { ...entry.formData, linked_job_id: value, linked_job_title: jobs.find(j => j._id === value)?.title || "" }
//           : { ...entry.formData, [name]: value },
//       }
//     ));
//   };

//   const handleBulkSave = async () => {
//     setBulkSaving(true);
//     const entry = bulkFiles[bulkStep];
//     try {
//       const fd = entry.formData;
//       await createResume({ ...fd, experience: fd.experience ? Number(fd.experience) : 0, current_salary: fd.current_salary ? Number(fd.current_salary) : 0, expected_salary: fd.expected_salary ? Number(fd.expected_salary) : 0, file_id: entry.file_id || "" });
//       setBulkFiles(prev => prev.map((e, i) => i === bulkStep ? { ...e, saved: true } : e));
//       if (bulkStep < bulkFiles.length - 1) setBulkStep(s => s + 1);
//       else { setBulkDone(true); load(); }
//     } catch (err) {
//       setBulkFiles(prev => prev.map((e, i) => i === bulkStep ? { ...e, errorMsg: err?.message || "Save failed" } : e));
//     } finally { setBulkSaving(false); }
//   };

//   const handleBulkSkip = () => {
//     if (bulkStep < bulkFiles.length - 1) setBulkStep(s => s + 1);
//     else { setBulkDone(true); load(); }
//   };

//   const closeBulk    = () => { setBulkOpen(false); clearInline(); load(); };
//   const savedCount   = bulkFiles.filter(f => f.saved).length;
//   const currentEntry = bulkFiles[bulkStep];

//   const handleRawFileSelect = async (e) => {
//     const files = Array.from(e.target.files || []).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
//     if (!files.length) return;
//     if (rawUploadRef.current) rawUploadRef.current.value = "";
//     const batch = files.map(f => ({ file: f, status: "uploading" }));
//     setRawUploadBatch(batch); setRawUploading(true);
//     await Promise.all(batch.map(async (entry, idx) => {
//       try { const b64 = await toBase64(entry.file); await uploadRawResume(b64, entry.file.name); batch[idx] = { ...entry, status: "done" }; }
//       catch { batch[idx] = { ...entry, status: "error" }; }
//       setRawUploadBatch([...batch]);
//     }));
//     setRawUploading(false); loadRaw();
//     setTimeout(() => setRawUploadBatch([]), 3000);
//   };

//   const openAssign = (raw) => { setAssignTarget(raw); setAssignJobId(""); setAssignOpen(true); };
//   const handleAssign = async () => {
//     if (!assignJobId) return;
//     const job = jobs.find(j => j._id === assignJobId);
//     setAssignSaving(true);
//     try {
//       await assignRawToJob(assignTarget._id, { job_id: assignJobId, job_title: job?.title || "", client_name: job?.client_name || "" });
//       setAssignOpen(false); loadRaw();
//     } catch (err) { setError(err?.message || "Failed to assign job"); }
//     finally { setAssignSaving(false); }
//   };

//   const openConvert = (raw) => {
//     setConvertTarget(raw); setConvertError("");
//     setConvertData({ ...EMPTY_CONVERT, name: raw.name || "", email: raw.email || "", phone: raw.phone || "", current_role: raw.current_role || "", current_company: raw.current_company || "", experience: raw.experience || "", skills: raw.skills || "", location: raw.location || "", current_salary: raw.current_salary || "", expected_salary: raw.expected_salary || "", notice_period: raw.notice_period || "30 days", linked_job_id: raw.linked_job_id || "", linked_job_title: raw.linked_job_title || "" });
//     setConvertOpen(true);
//   };

//   const handleConvertChange = e => {
//     const { name, value } = e.target;
//     if (name === "linked_job_id") {
//       const job = jobs.find(j => j._id === value);
//       setConvertData(p => ({ ...p, linked_job_id: job?.job_id || "", linked_job_mongo_id: value, linked_job_title: job?.title || "" }));
//     } else {
//       setConvertData(p => ({ ...p, [name]: value }));
//     }
//   };

//   const handleConvert = async (e) => {
//     e.preventDefault(); setConvertSaving(true); setConvertError("");
//     try {
//       const payload = { ...convertData, experience: convertData.experience ? Number(convertData.experience) : 0, current_salary: convertData.current_salary ? Number(convertData.current_salary) : 0, expected_salary: convertData.expected_salary ? Number(convertData.expected_salary) : 0 };
//       await convertRaw(convertTarget._id, payload);
//       setConvertOpen(false); load(); loadRaw();
//     } catch (err) { setConvertError(err?.message || "Conversion failed"); }
//     finally { setConvertSaving(false); }
//   };

//   // ── Scoring handlers ───────────────────────────────────────────────────────
//   const openScore = async (r) => {
//     const linkedJob = jobs.find(j => j.job_id === r.linked_job_id);
//     if (!linkedJob) { setError("Cannot score: candidate has no linked job"); return; }
//     setScoreTarget(r); setScoreJobId(linkedJob._id); setScoreData(null);
//     setScoreOpen(true); setScoreLoading(true);
//     try {
//       const cached = await getCachedScore(r._id, linkedJob._id);
//       setScoreData(cached.data);
//       setScoreMap(prev => ({ ...prev, [`${r._id}_${linkedJob._id}`]: cached.data }));
//     } catch {
//       try {
//         const fresh = await scoreCandidate(r._id, linkedJob._id);
//         setScoreData(fresh.data);
//         setScoreMap(prev => ({ ...prev, [`${r._id}_${linkedJob._id}`]: fresh.data }));
//       } catch (err) { setError(err?.message || "Scoring failed"); setScoreOpen(false); }
//     } finally { setScoreLoading(false); }
//   };

//   const reScore = async () => {
//     if (!scoreTarget || !scoreJobId) return;
//     setScoreLoading(true); setScoreData(null);
//     try {
//       const fresh = await scoreCandidate(scoreTarget._id, scoreJobId);
//       setScoreData(fresh.data);
//       setScoreMap(prev => ({ ...prev, [`${scoreTarget._id}_${scoreJobId}`]: fresh.data }));
//     } catch (err) { setError(err?.message || "Re-scoring failed"); }
//     finally { setScoreLoading(false); }
//   };

//   if (loading)
//     return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={48} /></Box>;

//   // ── Score bar colour helper ────────────────────────────────────────────────
//   const barColor = (score) =>
//     score >= 80 ? "#2e7d32" : score >= 60 ? "#1565c0" : score >= 40 ? "#f57c00" : "#c62828";

//   return (
//     <Box display="flex" flexDirection="column" gap={3}>

//       {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

//       {/* ── Page header ────────────────────────────────────────────────────── */}
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
//         <Box>
//           <Typography variant="h4" color="primary.dark">Candidates</Typography>
//           <Typography color="text.secondary" mt={0.5}>Manage candidate profiles and track applications</Typography>
//         </Box>
//         <Box display="flex" gap={1.5}>
//           {mainTab === 0 && (
//             <>
//               <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => inlineRef.current?.click()} size="large">Upload Resume</Button>
//               <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">Add Candidate</Button>
//             </>
//           )}
//           {mainTab === 1 && (
//             <Box display="flex" gap={1.5}>
//               <Button variant="outlined" startIcon={<EditNote />} onClick={openManualRaw} size="large">Add Manually</Button>
//               <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => rawUploadRef.current?.click()} size="large">Store Resumes</Button>
//             </Box>
//           )}
//         </Box>
//       </Box>

//       {/* ── Client filter banner ──────────────────────────────────────────── */}
//       {isClientLocked && (
//         <Alert severity="info" icon={<FilterList fontSize="small" />}
//           action={<Chip label="Show all clients" size="small" variant="outlined" onDelete={clearClientFilter} onClick={clearClientFilter} deleteIcon={<CloseIcon />} sx={{ fontSize: 11, cursor: "pointer" }} />}
//           sx={{ py: 0.5 }}>
//           Showing candidates for <strong>{urlClientName}</strong>
//         </Alert>
//       )}

//       {/* ── Stat cards ─────────────────────────────────────────────────────── */}
//       <Grid container spacing={2.5}>
//         <Grid item xs={6} md={3}><StatCard title={isClientLocked ? "Client Candidates" : "Total"} value={isClientLocked ? filtered.length : stats.total} icon={<Description />} color="#1a237e" /></Grid>
//         <Grid item xs={6} md={3}><StatCard title="New"         value={isClientLocked ? filtered.filter(r=>r.status==="New").length        : stats.newCount}    icon={<NewReleases />} color="#0277bd" /></Grid>
//         <Grid item xs={6} md={3}><StatCard title="Shortlisted" value={isClientLocked ? filtered.filter(r=>r.status==="Shortlisted").length : stats.shortlisted} icon={<Star />}        color="#e65100" /></Grid>
//         <Grid item xs={6} md={3}><StatCard title="Stored PDFs" value={rawResumes.length} icon={<Inventory2 />} color="#6a1b9a" /></Grid>
//       </Grid>

//       {/* ── Main tabs ──────────────────────────────────────────────────────── */}
//       <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
//         <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
//           <Tab label={<Box display="flex" alignItems="center" gap={1}><People fontSize="small" />Candidates{isClientLocked && <Chip label={urlClientName} size="small" color="info" sx={{ fontSize: 10, height: 18 }} />}</Box>} iconPosition="start" />
//           <Tab label={<Badge badgeContent={rawResumes.filter(r => r.status === "Stored").length} color="secondary" max={99}><Box sx={{ pr: rawResumes.filter(r => r.status === "Stored").length > 0 ? 1.5 : 0 }}>Stored Resumes</Box></Badge>} icon={<Inventory2 fontSize="small" />} iconPosition="start" />
//         </Tabs>
//       </Box>

//       {/* ══════════════════════════════════════════════════════════════════════
//           TAB 0 — Resume Bank
//       ══════════════════════════════════════════════════════════════════════ */}
//       {mainTab === 0 && (
//         <>
//           {!showParsing
//             ? <InlineUploadZone onFiles={handleFileSelect} fileRef={inlineRef} />
//             : <InlineParseProgress files={inlineFiles} onReview={openBulkReview} onClear={clearInline} />
//           }

//           <Box display="flex" gap={2} flexWrap="wrap">
//             <TextField placeholder="Search by name, skills, or ID…" value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
//             <TextField select value={statusF} onChange={e => setStatusF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Status">
//               <MenuItem value="">All Statuses</MenuItem>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//             </TextField>
//             <TextField select value={expF} onChange={e => setExpF(e.target.value)} size="small" sx={{ minWidth: 160 }} label="Experience">
//               <MenuItem value="">All Experience</MenuItem>{EXP_BANDS.slice(1).map(b => <MenuItem key={b.label} value={b.label}>{b.label}</MenuItem>)}
//             </TextField>
//             {!isClientLocked && (
//               <TextField select value={clientF} onChange={e => { setClientF(e.target.value); setJobF(""); }} size="small" sx={{ minWidth: 180 }} label="Client">
//                 <MenuItem value="">All Clients</MenuItem>
//                 {clients.map(c => <MenuItem key={c._id} value={c._id}><Box display="flex" alignItems="center" gap={1}><Business fontSize="small" sx={{ color: "#0277bd" }} />{c.company_name}</Box></MenuItem>)}
//               </TextField>
//             )}
//             <TextField select value={jobF} onChange={e => setJobF(e.target.value)} size="small" sx={{ minWidth: 180 }} label="Job">
//               <MenuItem value="">All Jobs</MenuItem>
//               {(clientF ? jobs.filter(j => j.client_id === clientF) : jobs).map(j => <MenuItem key={j._id} value={j._id}>{j.title}</MenuItem>)}
//             </TextField>
//           </Box>

//           {resumes.length === 0 && !error ? (
//             <Card>
//               <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
//                 <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}><PersonOff sx={{ fontSize: 36, color: "#9fa8da" }} /></Avatar>
//                 <Typography variant="h6" color="text.secondary">No candidates yet</Typography>
//                 <Typography fontSize={14} color="text.disabled">Drop PDF resumes above or add a candidate manually.</Typography>
//                 <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Candidate</Button>
//               </Box>
//             </Card>
//           ) : (
//             <Card>
//               <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//                 <Table>
//                   <TableHead>
//                     <TableRow sx={{ bgcolor: "#f5f7fa" }}>
//                       {["Candidate", "Current Role", "Exp", "Skills", "Expected Salary", "Notice", "Applied For", "Match %", "Pipeline Stage", "Status", "Actions"].map(h => (
//                         <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
//                       ))}
//                     </TableRow>
//                   </TableHead>
//                   <TableBody>
//                     {filtered.length === 0 ? (
//                       <TableRow>
//                         <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
//                           {isClientLocked ? `No candidates found for ${urlClientName}` : "No candidates match your filters"}
//                         </TableCell>
//                       </TableRow>
//                     ) : filtered.map(r => (
//                       <TableRow key={r._id} hover>
//                         <TableCell>
//                           <Box display="flex" alignItems="center" gap={1.5}>
//                             <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: "#1a237e" }}>{nameInitials(r.name)}</Avatar>
//                             <Box><Typography fontWeight={600} fontSize={13}>{r.name}</Typography><Typography fontSize={11} color="text.secondary">{r.resume_id}</Typography></Box>
//                           </Box>
//                         </TableCell>
//                         <TableCell><Typography fontSize={13}>{r.current_role}</Typography><Typography fontSize={11} color="text.secondary">{r.current_company}</Typography></TableCell>
//                         <TableCell sx={{ fontSize: 12 }}>{r.experience} yrs</TableCell>
//                         <TableCell>
//                           <Box display="flex" flexWrap="wrap" gap={0.5}>
//                             {(r.skills || "").split(",").filter(Boolean).slice(0, 3).map((s, i) => <Chip key={i} label={s.trim()} size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#e8eaf6", color: "#1a237e" }} />)}
//                             {(r.skills || "").split(",").filter(Boolean).length > 3 && <Chip label={`+${(r.skills || "").split(",").length - 3}`} size="small" sx={{ fontSize: 10, height: 20 }} />}
//                           </Box>
//                         </TableCell>
//                         <TableCell sx={{ fontSize: 12 }}>{fmtSalary(r.expected_salary)}</TableCell>
//                         <TableCell sx={{ fontSize: 12 }}>{r.notice_period || "—"}</TableCell>
//                         <TableCell>
//                           {r.linked_job_title ? (
//                             <Box>
//                               {(() => { const lj = jobs.find(j => j.job_id === r.linked_job_id); return lj?.client_name ? <Typography fontSize={10} color="text.secondary" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.2 }}><Business sx={{ fontSize: 10 }} />{lj.client_name}</Typography> : null; })()}
//                               <Typography fontSize={12} color="#0277bd" fontWeight={600}>{r.linked_job_id}</Typography>
//                               <Typography fontSize={11} color="text.secondary">{r.linked_job_title}</Typography>
//                             </Box>
//                           ) : <Typography fontSize={12} color="text.disabled">—</Typography>}
//                         </TableCell>
//                         <TableCell sx={{ minWidth: 70 }}>
//                           {(() => {
//                             const linkedJob = jobs.find(j => j.job_id === r.linked_job_id);
//                             if (!linkedJob) return <Typography fontSize={11} color="text.disabled">—</Typography>;
//                             const key = `${r._id}_${linkedJob._id}`;
//                             const sc  = scoreMap[key];
//                             if (!sc) return (
//                               <Tooltip title="Click score button to generate">
//                                 <Typography fontSize={11} color="text.disabled" sx={{ cursor: "default" }}>—</Typography>
//                               </Tooltip>
//                             );
//                             const color = sc.overall_score >= 80 ? "#2e7d32" : sc.overall_score >= 60 ? "#1565c0" : sc.overall_score >= 40 ? "#f57c00" : "#c62828";
//                             const bg    = sc.overall_score >= 80 ? "#e8f5e9" : sc.overall_score >= 60 ? "#e3f2fd" : sc.overall_score >= 40 ? "#fff8e1" : "#fce4ec";
//                             return (
//                               <Tooltip title={sc.verdict}>
//                                 <Box onClick={() => openScore(r)} sx={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.3, borderRadius: 20, bgcolor: bg, border: `1px solid ${color}20` }}>
//                                   <Typography fontSize={12} fontWeight={700} color={color}>{sc.overall_score}%</Typography>
//                                 </Box>
//                               </Tooltip>
//                             );
//                           })()}
//                         </TableCell>
//                         <TableCell>
//                           {(() => { const track = trackingMap[r.resume_id]; if (!track) return <Typography fontSize={12} color="text.disabled">—</Typography>; return <Box><Chip label={track.current_stage} size="small" color={STAGE_COLOR[track.current_stage] || "default"} sx={{ fontWeight: 700, fontSize: 10, mb: 0.3 }} /><Typography fontSize={10} color="text.secondary">{track.pipeline_status}</Typography></Box>; })()}
//                         </TableCell>
//                         <TableCell><Chip label={r.status} color={STATUS_COLOR[r.status] || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} /></TableCell>
//                         <TableCell>
//                           <Box display="flex" gap={0.5}>
//                             <Tooltip title="View Details"><IconButton size="small" onClick={() => openDetail(r)}><Visibility fontSize="small" /></IconButton></Tooltip>
//                             <Tooltip title={r.resume_file ? "View Resume PDF" : "No resume file uploaded"}>
//                               <span><IconButton size="small" onClick={() => r.resume_file && openPdf(r)} sx={{ color: r.resume_file ? "#c62828" : "#bdbdbd", cursor: r.resume_file ? "pointer" : "not-allowed" }}><PictureAsPdf fontSize="small" /></IconButton></span>
//                             </Tooltip>
//                             {/* ── Score button ── */}
//                             <Tooltip title={r.linked_job_id ? "AI Score vs Job" : "Link to a job to enable scoring"}>
//                               <span>
//                                 <IconButton size="small" onClick={() => openScore(r)} disabled={!r.linked_job_id} sx={{ color: r.linked_job_id ? "#7b1fa2" : "#bdbdbd" }}>
//                                   <Analytics fontSize="small" />
//                                 </IconButton>
//                               </span>
//                             </Tooltip>
//                             <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton></Tooltip>
//                             <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDelete(r)}><Delete fontSize="small" /></IconButton></Tooltip>
//                           </Box>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </Paper>
//             </Card>
//           )}
//         </>
//       )}

//       {/* ══════════════════════════════════════════════════════════════════════
//           TAB 1 — Stored Resumes
//       ══════════════════════════════════════════════════════════════════════ */}
//       {mainTab === 1 && (
//         <>
//           <input ref={rawUploadRef} type="file" accept=".pdf,application/pdf" multiple hidden onChange={handleRawFileSelect} />
//           <InlineUploadZone onFiles={handleRawFileSelect} fileRef={rawUploadRef} label="Drag & drop PDFs here to store them quickly" sublabel="Saved immediately · AI auto-extracts details · assign to a job anytime · convert to full candidate when ready" />

//           {rawUploadBatch.length > 0 && (
//             <Card variant="outlined" sx={{ borderColor: "#ce93d8", borderRadius: 2 }}>
//               <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
//                 <Typography fontWeight={700} fontSize="0.88rem" mb={1}>{rawUploading ? "Storing resumes…" : "Upload complete ✓"}</Typography>
//                 <Box display="flex" flexDirection="column" gap={0.8}>
//                   {rawUploadBatch.map((entry, i) => (
//                     <Box key={i} display="flex" alignItems="center" gap={1.5} sx={{ p: 1, bgcolor: "#f5f7fa", borderRadius: 1.5 }}>
//                       <Description fontSize="small" color="action" sx={{ flexShrink: 0 }} />
//                       <Typography fontSize={12} fontWeight={600} flex={1} noWrap>{entry.file.name}</Typography>
//                       {entry.status === "uploading" && <CircularProgress size={16} />}
//                       {entry.status === "done"      && <Chip label="Stored ✓" size="small" color="success" sx={{ fontSize: 10 }} />}
//                       {entry.status === "error"     && <Chip label="Failed"   size="small" color="error"   sx={{ fontSize: 10 }} />}
//                     </Box>
//                   ))}
//                 </Box>
//               </CardContent>
//             </Card>
//           )}

//           <Box px={2} py={1.5} bgcolor="#f3e5f5" borderRadius={2} border="1px solid #ce93d8" display="flex" alignItems="center" gap={1.5}>
//             <Inventory2 fontSize="small" sx={{ color: "#7b1fa2" }} />
//             <Typography fontSize={13} color="#4a148c">Stored resumes are saved PDFs without a full candidate profile. Use <strong>Assign to Job</strong> to link to a posting, then <strong>Convert to Candidate</strong> to create a full profile in the Resume Bank.</Typography>
//           </Box>

//           <Box display="flex" gap={2} flexWrap="wrap">
//             <TextField placeholder="Search by name, skills, or file…" value={rawSearch} onChange={e => setRawSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
//             <TextField select value={rawStatusF} onChange={e => setRawStatusF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Status">
//               <MenuItem value="">All</MenuItem>
//               {["Stored", "Assigned", "Converted"].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//             </TextField>
//           </Box>

//           {rawLoading ? (
//             <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
//           ) : rawResumes.length === 0 ? (
//             <Card><Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}><Avatar sx={{ width: 72, height: 72, bgcolor: "#f3e5f5" }}><Inventory2 sx={{ fontSize: 36, color: "#ce93d8" }} /></Avatar><Typography variant="h6" color="text.secondary">No stored resumes yet</Typography><Typography fontSize={14} color="text.disabled">Drag PDFs above or click "Store Resumes" to get started.</Typography></Box></Card>
//           ) : (
//             <Card>
//               <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//                 <Table>
//                   <TableHead><TableRow sx={{ bgcolor: "#fce4ec" }}>{["ID","Candidate","Role / Skills","Exp","Assigned Job","Parse","Status","Actions"].map(h => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>)}</TableRow></TableHead>
//                   <TableBody>
//                     {filteredRaw.length === 0 ? (
//                       <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>No stored resumes match your filters</TableCell></TableRow>
//                     ) : filteredRaw.map(r => (
//                       <TableRow key={r._id} hover sx={{ opacity: r.status === "Converted" ? 0.6 : 1 }}>
//                         <TableCell sx={{ fontWeight: 700, color: "#7b1fa2", fontSize: 12 }}>{r.raw_id}</TableCell>
//                         <TableCell><Box display="flex" alignItems="center" gap={1.5}><Avatar sx={{ width: 34, height: 34, fontSize: 12, fontWeight: 700, bgcolor: "#7b1fa2" }}>{r.name ? nameInitials(r.name) : <Description fontSize="small" />}</Avatar><Box><Typography fontWeight={600} fontSize={13}>{r.name || <em style={{ color: "#9e9e9e" }}>Not extracted</em>}</Typography><Typography fontSize={11} color="text.secondary" noWrap sx={{ maxWidth: 160 }}>{r.original_name}</Typography></Box></Box></TableCell>
//                         <TableCell><Typography fontSize={12}>{r.current_role || "—"}</Typography><Box display="flex" flexWrap="wrap" gap={0.4} mt={0.3}>{(r.skills || "").split(",").filter(Boolean).slice(0, 2).map((s, i) => <Chip key={i} label={s.trim()} size="small" sx={{ fontSize: 9, height: 18, bgcolor: "#f3e5f5", color: "#7b1fa2" }} />)}</Box></TableCell>
//                         <TableCell sx={{ fontSize: 12 }}>{r.experience ? `${r.experience} yrs` : "—"}</TableCell>
//                         <TableCell>{r.linked_job_id ? <Box><Typography fontSize={12} color="#0277bd" fontWeight={600}>{r.linked_job_id}</Typography><Typography fontSize={11} color="text.secondary">{r.linked_job_title}</Typography>{r.client_name && <Typography fontSize={10} color="text.disabled">{r.client_name}</Typography>}</Box> : <Typography fontSize={12} color="text.disabled">Not assigned</Typography>}</TableCell>
//                         <TableCell><Chip label={r.parse_status || "pending"} size="small" color={PARSE_COLOR[r.parse_status] || "default"} sx={{ fontSize: 10, fontWeight: 700 }} /></TableCell>
//                         <TableCell><Chip label={r.status} size="small" color={RAW_STATUS_COLOR[r.status] || "default"} sx={{ fontSize: 11, fontWeight: 700 }} /></TableCell>
//                         <TableCell>
//                           <Box display="flex" gap={0.5}>
//                             <Tooltip title={r.filename ? "View PDF" : "No PDF attached"}><span><IconButton size="small" sx={{ color: r.filename ? "#c62828" : "#bdbdbd", cursor: r.filename ? "pointer" : "not-allowed" }} onClick={() => { if (r.filename) { setRawPdfDoc(r); setRawPdfOpen(true); } }}><PictureAsPdf fontSize="small" /></IconButton></span></Tooltip>
//                             {r.status !== "Converted" && <Tooltip title="Assign to Job"><IconButton size="small" sx={{ color: "#0277bd" }} onClick={() => openAssign(r)}><Work fontSize="small" /></IconButton></Tooltip>}
//                             {r.status !== "Converted" && <Tooltip title="Convert to full candidate"><IconButton size="small" sx={{ color: "#2e7d32" }} onClick={() => openConvert(r)}><PersonAdd fontSize="small" /></IconButton></Tooltip>}
//                             {r.status === "Converted" && <Tooltip title={`Converted → ${r.converted_resume_id}`}><IconButton size="small" sx={{ color: "#2e7d32" }} disableRipple><CheckCircle fontSize="small" /></IconButton></Tooltip>}
//                             {r.status !== "Converted" && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={async () => { await deleteRaw(r._id); loadRaw(); }}><Delete fontSize="small" /></IconButton></Tooltip>}
//                           </Box>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </Paper>
//             </Card>
//           )}
//         </>
//       )}

//       {/* ── PDF viewers ──────────────────────────────────────────────────────── */}
//       <PdfViewerDialog    open={pdfOpen}    onClose={() => setPdfOpen(false)}    candidate={selected} />
//       <RawPdfViewerDialog open={rawPdfOpen} onClose={() => setRawPdfOpen(false)} raw={rawPdfDoc} />

//       {/* ── Candidate Detail Dialog ──────────────────────────────────────────── */}
//       <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: "70vh" } }}>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>Candidate Details</DialogTitle>
//         {selected && (
//           <CandidateDetailContent candidate={selected} jobs={jobs} recruiters={recruiters}
//             onClose={() => setDetailOpen(false)}
//             onEdit={() => { setDetailOpen(false); openEdit(selected); }}
//             onViewPdf={() => { setDetailOpen(false); openPdf(selected); }} />
//         )}
//       </Dialog>

//       {/* ── AI Score Dialog ───────────────────────────────────────────────────── */}
//       <Dialog open={scoreOpen} onClose={() => setScoreOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 1.5 }}>
//           <Box display="flex" alignItems="center" justifyContent="space-between">
//             <Box display="flex" alignItems="center" gap={1.5}>
//               <Analytics sx={{ color: "#7b1fa2" }} />
//               <Box>
//                 <Typography fontWeight={700}>AI Match Score</Typography>
//                 <Typography fontSize={11} color="text.secondary">
//                   {scoreTarget?.name} vs {scoreData?.job_title || "…"}
//                 </Typography>
//               </Box>
//             </Box>
//             <IconButton size="small" onClick={() => setScoreOpen(false)}><CloseIcon fontSize="small" /></IconButton>
//           </Box>
//         </DialogTitle>

//         <DialogContent sx={{ pt: 2.5 }}>
//           {scoreLoading && (
//             <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={2}>
//               <CircularProgress size={48} sx={{ color: "#7b1fa2" }} />
//               <Typography color="text.secondary" fontSize={13}>Analysing candidate with AI…</Typography>
//             </Box>
//           )}

//           {!scoreLoading && scoreData && (() => {
//             const s = scoreData;
//             const verdictColor = {
//               "Strong match":   { bg: "#e8f5e9", color: "#1b5e20" },
//               "Good match":     { bg: "#e3f2fd", color: "#0d47a1" },
//               "Moderate match": { bg: "#fff8e1", color: "#e65100" },
//               "Weak match":     { bg: "#fce4ec", color: "#880e4f" },
//             }[s.verdict] || { bg: "#f5f5f5", color: "#424242" };

//             const ScoreBar = ({ label, value }) => (
//               <Box display="flex" alignItems="center" gap={1.5} mb={1.2}>
//                 <Typography fontSize={12} color="text.primary" sx={{ width: 130, flexShrink: 0 }}>{label}</Typography>
//                 <Box flex={1} height={6} bgcolor="#e0e0e0" borderRadius={4} overflow="hidden">
//                   <Box height="100%" borderRadius={4} bgcolor={barColor(value)} sx={{ width: `${value}%`, transition: "width 0.6s ease" }} />
//                 </Box>
//                 <Typography fontSize={12} fontWeight={600} sx={{ width: 32, textAlign: "right", color: barColor(value) }}>{value}</Typography>
//               </Box>
//             );

//             return (
//               <Box>
//                 {/* Overall score + verdict */}
//                 <Box display="flex" alignItems="center" gap={2.5} mb={2.5} pb={2} sx={{ borderBottom: "1px solid #e0e0e0" }}>
//                   <Box sx={{ width: 80, height: 80, borderRadius: "50%", border: `4px solid ${barColor(s.overall_score)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
//                     <Typography fontSize={22} fontWeight={700} color={barColor(s.overall_score)} lineHeight={1}>{s.overall_score}</Typography>
//                     <Typography fontSize={10} color="text.secondary">/100</Typography>
//                   </Box>
//                   <Box>
//                     <Typography fontSize={14} fontWeight={600} color="text.primary">{scoreTarget?.name}</Typography>
//                     <Typography fontSize={12} color="text.secondary" mt={0.3}>{scoreTarget?.current_role} · {scoreTarget?.experience} yrs</Typography>
//                     <Box display="inline-block" mt={0.8} px={1.5} py={0.4} borderRadius={20}
//                       sx={{ bgcolor: verdictColor.bg, color: verdictColor.color, fontSize: 12, fontWeight: 600 }}>
//                       {s.verdict}
//                     </Box>
//                   </Box>
//                 </Box>

//                 {/* Breakdown */}
//                 <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.6} mb={1.2}>Score breakdown</Typography>
//                 <ScoreBar label="Skills match"     value={s.skills_score}     />
//                 <ScoreBar label="Experience fit"   value={s.experience_score} />
//                 <ScoreBar label="Salary alignment" value={s.salary_score}     />
//                 <ScoreBar label="Notice period"    value={s.notice_score}     />
//                 <ScoreBar label="Location"         value={s.location_score}   />

//                 {/* Strengths */}
//                 {s.strengths?.length > 0 && (
//                   <Box mt={2} p={1.5} bgcolor="#e8f5e9" borderRadius={2} border="1px solid #a5d6a7">
//                     <Typography fontSize={11} fontWeight={700} color="#2e7d32" textTransform="uppercase" letterSpacing={0.5} mb={0.8}>Strengths</Typography>
//                     {s.strengths.map((g, i) => (
//                       <Box key={i} display="flex" alignItems="flex-start" gap={0.8} mb={0.5}>
//                         <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#2e7d32", mt: 0.6, flexShrink: 0 }} />
//                         <Typography fontSize={12} color="#1b5e20">{g}</Typography>
//                       </Box>
//                     ))}
//                   </Box>
//                 )}

//                 {/* Gaps */}
//                 {s.gaps?.length > 0 && (
//                   <Box mt={1.5} p={1.5} bgcolor="#fff8e1" borderRadius={2} border="1px solid #ffe082">
//                     <Typography fontSize={11} fontWeight={700} color="#e65100" textTransform="uppercase" letterSpacing={0.5} mb={0.8}>Gaps identified</Typography>
//                     {s.gaps.map((g, i) => (
//                       <Box key={i} display="flex" alignItems="flex-start" gap={0.8} mb={0.5}>
//                         <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#f57c00", mt: 0.6, flexShrink: 0 }} />
//                         <Typography fontSize={12} color="#bf360c">{g}</Typography>
//                       </Box>
//                     ))}
//                   </Box>
//                 )}

//                 {/* AI Summary */}
//                 <Box mt={1.5} p={1.5} bgcolor="#f5f5f5" borderRadius={2} border="0.5px solid #e0e0e0">
//                   <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={0.5}>AI summary</Typography>
//                   <Typography fontSize={12} color="text.primary" lineHeight={1.7}>{s.summary}</Typography>
//                 </Box>

//                 {s.scored_at && (
//                   <Typography fontSize={10} color="text.disabled" mt={1.5} textAlign="right">
//                     Scored {new Date(s.scored_at).toLocaleString("en-IN")}
//                   </Typography>
//                 )}
//               </Box>
//             );
//           })()}
//         </DialogContent>

//         <DialogActions sx={{ px: 3, pb: 2, borderTop: "1px solid #e0e0e0" }}>
//           <Button onClick={reScore} disabled={scoreLoading} size="small" startIcon={scoreLoading ? <CircularProgress size={14} /> : null}>
//             Re-score
//           </Button>
//           <Box flex={1} />
//           <Button onClick={() => setScoreOpen(false)}>Close</Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── Assign to Job ─────────────────────────────────────────────────────── */}
//       <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1}><Work color="primary" />Assign to Job</Box></DialogTitle>
//         <DialogContent sx={{ pt: 3 }}>
//           {assignTarget && <Box mb={2.5} p={1.5} bgcolor="#f3e5f5" borderRadius={2}><Typography fontSize={12} color="text.secondary">Assigning resume:</Typography><Typography fontWeight={700}>{assignTarget.name || assignTarget.original_name}</Typography><Typography fontSize={12} color="text.secondary">{assignTarget.raw_id}</Typography></Box>}
//           <TextField select fullWidth size="small" label="Select Job *" value={assignJobId} onChange={e => setAssignJobId(e.target.value)}>
//             <MenuItem value="">— Choose a job posting —</MenuItem>
//             {jobs.map(j => <MenuItem key={j._id} value={j._id}><Box><Typography fontSize={13} fontWeight={600}>{j.job_id} — {j.title}</Typography>{j.client_name && <Typography fontSize={11} color="text.secondary">{j.client_name}</Typography>}</Box></MenuItem>)}
//           </TextField>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//           <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
//           <Button variant="contained" onClick={handleAssign} disabled={!assignJobId || assignSaving} startIcon={assignSaving ? <CircularProgress size={16} color="inherit" /> : <Work />}>{assignSaving ? "Assigning…" : "Assign"}</Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── Convert to Candidate ─────────────────────────────────────────────── */}
//       <Dialog open={convertOpen} onClose={() => setConvertOpen(false)} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1}><PersonAdd color="success" />Convert to Candidate</Box></DialogTitle>
//         <form onSubmit={handleConvert}>
//           <DialogContent sx={{ pt: 3 }}>
//             {convertTarget && <Box mb={2} p={1.5} bgcolor="#e8f5e9" borderRadius={2} display="flex" alignItems="center" gap={1.5}><SwapHoriz color="success" /><Box><Typography fontSize={12} color="text.secondary">Converting stored resume to full candidate</Typography><Typography fontWeight={700} fontSize={13}>{convertTarget.raw_id} — {convertTarget.original_name}</Typography></Box></Box>}
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Full Name " name="name" value={convertData.name} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" required type="email" label="Email " name="email" value={convertData.email} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" name="phone" value={convertData.phone} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Location" name="location" value={convertData.location} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Role" name="current_role" value={convertData.current_role} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Company" name="current_company" value={convertData.current_company} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Experience (yrs)" name="experience" value={convertData.experience} onChange={handleConvertChange} inputProps={{ min: 0 }} /></Grid>
//               <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Source" name="source" value={convertData.source} onChange={handleConvertChange}>{SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Status" name="status" value={convertData.status} onChange={handleConvertChange}>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12}><TextField fullWidth multiline rows={2} size="small" label="Skills (comma-separated)" name="skills" value={convertData.skills} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Current Salary (₹)" name="current_salary" value={convertData.current_salary} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={convertData.expected_salary} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Notice Period" name="notice_period" value={convertData.notice_period} onChange={handleConvertChange}>{NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12}><TextField select fullWidth size="small" label="Link to Job" name="linked_job_id" value={convertData.linked_job_mongo_id || ""} onChange={handleConvertChange}><MenuItem value="">No Job Linked</MenuItem>{jobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} — {j.title}{j.client_name ? ` (${j.client_name})` : ""}</MenuItem>)}</TextField></Grid>
//             </Grid>
//             <TextField fullWidth multiline rows={2} size="small" label="Notes" name="notes" value={convertData.notes} onChange={handleConvertChange} />
//             {convertError && <Alert severity="error" sx={{ mt: 2 }}>{convertError}</Alert>}
//           </DialogContent>
//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//             <Button onClick={() => setConvertOpen(false)}>Cancel</Button>
//             <Button type="submit" variant="contained" color="success" disabled={convertSaving} startIcon={convertSaving ? <CircularProgress size={16} color="inherit" /> : <PersonAdd />}>{convertSaving ? "Converting…" : "Convert to Candidate"}</Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//       {/* ── Bulk Review Dialog ────────────────────────────────────────────────── */}
//       <Dialog open={bulkOpen} onClose={closeBulk} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: "80vh" } }}>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1.5}><CloudUpload color="primary" /><Box><Typography fontWeight={700} fontSize="1.1rem">Review &amp; Save Candidates</Typography><Typography fontSize={12} color="text.secondary">AI-extracted details pre-filled · PDFs already saved · review and confirm each</Typography></Box></Box></DialogTitle>
//         <DialogContent sx={{ p: 0 }}>
//           {!bulkDone && currentEntry && (
//             <Box>
//               <Box sx={{ borderBottom: "1px solid #e0e0e0", px: 3, pt: 2 }}>
//                 <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
//                   {bulkFiles.map((entry, i) => <Chip key={i} label={`${i + 1}. ${entry.file.name.replace(".pdf", "").slice(0, 22)}`} onClick={() => setBulkStep(i)} color={entry.saved ? "success" : i === bulkStep ? "primary" : "default"} variant={i === bulkStep ? "filled" : "outlined"} size="small" icon={entry.saved ? <CheckCircle fontSize="small" /> : undefined} sx={{ cursor: "pointer", fontWeight: i === bulkStep ? 700 : 400 }} />)}
//                 </Box>
//                 <Box display="flex" alignItems="center" gap={1} pb={1.5} flexWrap="wrap">
//                   <Typography fontSize={12} color="text.secondary">{savedCount} of {bulkFiles.length} saved &bull; Reviewing: <strong>{currentEntry.file.name}</strong></Typography>
//                   {currentEntry.status === "error" && <Chip label="Fill manually" size="small" color="warning" sx={{ fontSize: 10 }} />}
//                   {currentEntry.status === "done" && !currentEntry.saved && <Chip label="AI-parsed ✓" size="small" color="info" sx={{ fontSize: 10 }} />}
//                   {currentEntry.file_id && <Chip label="PDF stored ✓" size="small" color="success" variant="outlined" sx={{ fontSize: 10 }} />}
//                 </Box>
//               </Box>
//               <Box p={3}>
//                 {currentEntry.saved ? (
//                   <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={2}><CheckCircle color="success" sx={{ fontSize: 56 }} /><Typography fontWeight={700} color="success.main">Saved successfully!</Typography>{bulkStep < bulkFiles.length - 1 && <Button variant="outlined" onClick={() => setBulkStep(s => s + 1)}>Next Resume →</Button>}</Box>
//                 ) : (
//                   <>
//                     <Grid container spacing={2} mb={2}>
//                       <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Full Name" name="name" value={currentEntry.formData.name} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required type="email" label="Email" name="email" value={currentEntry.formData.email} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Phone" name="phone" value={currentEntry.formData.phone} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Location" name="location" value={currentEntry.formData.location} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Role" name="current_role" value={currentEntry.formData.current_role} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Company" name="current_company" value={currentEntry.formData.current_company} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Experience (yrs)" name="experience" value={currentEntry.formData.experience} onChange={handleBulkChange} inputProps={{ min: 0 }} /></Grid>
//                       <Grid item xs={12} sm={4}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Source" name="source" value={currentEntry.formData.source} onChange={handleBulkChange}>{SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//                       <Grid item xs={12} sm={4}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Status" name="status" value={currentEntry.formData.status} onChange={handleBulkChange}>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//                       <Grid item xs={12}><TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={3} size="small" label="Skills (comma-separated)" name="skills" value={currentEntry.formData.skills} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Current Salary (₹)" name="current_salary" value={currentEntry.formData.current_salary} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={currentEntry.formData.expected_salary} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={4}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Notice Period" name="notice_period" value={currentEntry.formData.notice_period} onChange={handleBulkChange}>{NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
//                       <Grid item xs={12}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Link to Job" name="linked_job_id" value={currentEntry.formData.linked_job_id} onChange={handleBulkChange}><MenuItem value="">No Job Linked</MenuItem>{jobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} - {j.title}</MenuItem>)}</TextField></Grid>
//                     </Grid>
//                     <TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={2} size="small" label="Notes" name="notes" value={currentEntry.formData.notes} onChange={handleBulkChange} />
//                     {currentEntry.errorMsg && <Alert severity="warning" sx={{ mt: 2 }}>{currentEntry.errorMsg}</Alert>}
//                   </>
//                 )}
//               </Box>
//             </Box>
//           )}
//           {bulkDone && (
//             <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
//               <Avatar sx={{ width: 80, height: 80, bgcolor: "#e8f5e9" }}><Done sx={{ fontSize: 48, color: "#2e7d32" }} /></Avatar>
//               <Typography variant="h5" fontWeight={800} color="success.main">All Done!</Typography>
//               <Typography color="text.secondary">{savedCount} of {bulkFiles.length} candidate{savedCount !== 1 ? "s" : ""} saved.</Typography>
//               <Button variant="contained" onClick={closeBulk}>Back to Resume Bank</Button>
//             </Box>
//           )}
//         </DialogContent>
//         {!bulkDone && currentEntry && !currentEntry.saved && (
//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0", gap: 1 }}>
//             <Button disabled={bulkStep === 0} onClick={() => setBulkStep(s => s - 1)} startIcon={<NavigateBefore />}>Previous</Button>
//             <Box flex={1} />
//             <Button onClick={handleBulkSkip} color="inherit">Skip</Button>
//             <Button variant="contained" onClick={handleBulkSave} disabled={bulkSaving || !currentEntry.formData.name || !currentEntry.formData.email} endIcon={bulkSaving ? <CircularProgress size={16} color="inherit" /> : <Done />}>{bulkSaving ? "Saving…" : "Save & Next"}</Button>
//           </DialogActions>
//         )}
//       </Dialog>

//       {/* ── Add / Edit Candidate Dialog ──────────────────────────────────────── */}
//       <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>{selected ? "Edit Candidate" : `Add New Candidate${pickedClient ? ` — ${pickedClient.company_name}` : ""}`}</DialogTitle>
//         <form onSubmit={handleSave}>
//           <DialogContent sx={{ pt: 3 }}>
//             {!selected && pickedClient && (
//               <Box mb={2} px={2} py={1.5} bgcolor="#e3f2fd" borderRadius={2} display="flex" alignItems="center" justifyContent="space-between">
//                 <Box display="flex" alignItems="center" gap={1.5}><Business sx={{ color: "#1565c0" }} /><Box><Typography fontSize={11} color="text.secondary">Adding candidate for</Typography><Typography fontWeight={700} color="primary.dark">{pickedClient.company_name}</Typography></Box></Box>
//                 <Chip label="Change client" size="small" variant="outlined" onClick={() => { setFormOpen(false); setClientSelectOpen(true); }} sx={{ fontSize: 11, cursor: "pointer" }} />
//               </Box>
//             )}
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Full Name" name="name" value={formData.name} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required type="email" label="Email" name="email" value={formData.email} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Phone" name="phone" value={formData.phone} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Location" name="location" value={formData.location} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Role" name="current_role" value={formData.current_role} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Company" name="current_company" value={formData.current_company} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Experience (years)" name="experience" value={formData.experience} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//               <Grid item xs={12} sm={6}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Source" name="source" value={formData.source} onChange={handleChange}>{SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12}><TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={2} label="Skills (comma-separated)" name="skills" value={formData.skills} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Current Salary (₹)" name="current_salary" value={formData.current_salary} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={formData.expected_salary} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Notice Period" name="notice_period" value={formData.notice_period} onChange={handleChange}>{NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12} sm={6}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Status" name="status" value={formData.status} onChange={handleChange}>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Linked Job" name="linked_job_id" value={formData.linked_job_mongo_id || ""} onChange={handleChange}>
//                   <MenuItem value="">No Job Linked</MenuItem>
//                   {formClientJobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} — {j.title}</MenuItem>)}
//                 </TextField>
//               </Grid>
//             </Grid>
//             <TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={3} size="small" label="Notes" name="notes" value={formData.notes} onChange={handleChange} />
//             <Divider sx={{ my: 2 }} />
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Resume File (PDF)</Typography>
//             <Box onClick={() => formFileRef.current?.click()} sx={{ border: addFile ? "2px solid #2e7d32" : "2px dashed #90caf9", borderRadius: 2, p: 2, display: "flex", alignItems: "center", gap: 2, cursor: "pointer", bgcolor: addFile ? "#f1f8e9" : "#f8fbff", "&:hover": { bgcolor: addFile ? "#e8f5e9" : "#e3f2fd", borderColor: addFile ? "#1b5e20" : "#1565c0" } }}>
//               <PictureAsPdf sx={{ fontSize: 32, color: addFile ? "#2e7d32" : "#90caf9", flexShrink: 0 }} />
//               <Box flex={1}>{addFile ? <><Typography fontWeight={700} fontSize={13} color="success.dark">{addFile.name}</Typography><Typography fontSize={11} color="text.secondary">{(addFile.size / 1024).toFixed(0)} KB · Click to replace</Typography></> : <><Typography fontWeight={600} fontSize={13} color="primary.dark">{selected?.resume_file ? "Replace resume PDF" : "Attach resume PDF (optional)"}</Typography><Typography fontSize={11} color="text.secondary">{selected?.resume_file ? `Current file: ${selected.resume_file} · click to replace` : "Click to browse · PDF only"}</Typography></>}</Box>
//               {addFile && <IconButton size="small" onClick={e => { e.stopPropagation(); setAddFile(null); }}><CloseIcon fontSize="small" /></IconButton>}
//               <input ref={formFileRef} type="file" accept=".pdf,application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) setAddFile(f); e.target.value = ""; }} />
//             </Box>
//           </DialogContent>
//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//             <Button onClick={() => setFormOpen(false)}>Cancel</Button>
//             <Button type="submit" variant="contained" disabled={saving}>{saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}{selected ? "Update" : "Add Candidate"}</Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//       {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
//       <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
//         <DialogTitle fontWeight={700}>Delete Candidate</DialogTitle>
//         <DialogContent><Typography>Are you sure you want to delete <strong>{selected?.name}</strong>?</Typography>{selected?.resume_file && <Alert severity="warning" sx={{ mt: 1.5 }}>The uploaded resume PDF will also be permanently deleted.</Alert>}</DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="contained" color="error" onClick={handleDelete}>Delete</Button></DialogActions>
//       </Dialog>

//       {/* ── Client Select Dialog ──────────────────────────────────────────────── */}
//       <Dialog open={clientSelectOpen} onClose={() => setClientSelectOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1}><Business color="primary" />Select Client for this Candidate</Box></DialogTitle>
//         <DialogContent sx={{ pt: 2.5, pb: 1 }}>
//           <Typography fontSize={13} color="text.secondary" mb={2}>Choose the client this candidate is being added for. Their job postings will be pre-loaded in the next step.</Typography>
//           <Box display="flex" flexDirection="column" gap={1.5}>
//             {clients.map(c => {
//               const clientJobs = jobs.filter(j => j.client_id === c._id || j.client_name === c.company_name);
//               return (
//                 <Box key={c._id} onClick={() => handleClientPicked(c)} sx={{ p: 2, borderRadius: 2, border: "1.5px solid #e0e0e0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s", "&:hover": { bgcolor: "#e3f2fd", borderColor: "#1565c0" } }}>
//                   <Box display="flex" alignItems="center" gap={1.5}><Avatar sx={{ width: 40, height: 40, bgcolor: "#1a237e", fontSize: 14, fontWeight: 700 }}>{c.company_name?.[0]?.toUpperCase() || "C"}</Avatar><Box><Typography fontWeight={700} fontSize={14}>{c.company_name}</Typography><Typography fontSize={12} color="text.secondary">{clientJobs.length} active job{clientJobs.length !== 1 ? "s" : ""}{clientJobs.length > 0 && ` · ${clientJobs.slice(0, 2).map(j => j.job_id).join(", ")}${clientJobs.length > 2 ? "…" : ""}`}</Typography></Box></Box>
//                   <ArrowForward fontSize="small" sx={{ color: "text.disabled" }} />
//                 </Box>
//               );
//             })}
//             {clients.length === 0 && <Box p={3} textAlign="center"><Typography color="text.secondary" fontSize={13}>No clients found. Add a client first.</Typography></Box>}
//           </Box>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0", mt: 1 }}><Button onClick={() => setClientSelectOpen(false)}>Cancel</Button></DialogActions>
//       </Dialog>

//       {/* ── Manual Raw Resume Dialog ──────────────────────────────────────────── */}
//       <Dialog open={manualRawOpen} onClose={() => setManualRawOpen(false)} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1}><EditNote color="secondary" />Add Resume Manually</Box></DialogTitle>
//         <form onSubmit={handleManualRawSave}>
//           <DialogContent sx={{ pt: 3 }}>
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Resume File (PDF) — Optional</Typography>
//             <Box onClick={() => manualFileRef.current?.click()} sx={{ border: manualRawFile ? "2px solid #7b1fa2" : "2px dashed #ce93d8", borderRadius: 2, p: 2, display: "flex", alignItems: "center", gap: 2, cursor: "pointer", bgcolor: manualRawFile ? "#f3e5f5" : "#fdf6ff", mb: 3, "&:hover": { bgcolor: "#f3e5f5", borderColor: "#7b1fa2" } }}>
//               <PictureAsPdf sx={{ fontSize: 32, color: manualRawFile ? "#7b1fa2" : "#ce93d8", flexShrink: 0 }} />
//               <Box flex={1}>{manualRawFile ? <><Typography fontWeight={700} fontSize={13} color="#4a148c">{manualRawFile.name}</Typography><Typography fontSize={11} color="text.secondary">{(manualRawFile.size / 1024).toFixed(0)} KB · Click to replace</Typography></> : <><Typography fontWeight={600} fontSize={13} color="#7b1fa2">Attach resume PDF (optional)</Typography><Typography fontSize={11} color="text.secondary">Click to browse or drag &amp; drop · PDF only</Typography></>}</Box>
//               {manualRawFile && <IconButton size="small" onClick={e => { e.stopPropagation(); setManualRawFile(null); }}><CloseIcon fontSize="small" /></IconButton>}
//               <input ref={manualFileRef} type="file" accept=".pdf,application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) setManualRawFile(f); e.target.value = ""; }} />
//             </Box>
//             <Divider sx={{ my: 2 }} />
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Full Name *" name="name" value={manualRawData.name} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="email" label="Email" name="email" value={manualRawData.email} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" name="phone" value={manualRawData.phone} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Location" name="location" value={manualRawData.location} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Role" name="current_role" value={manualRawData.current_role} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Company" name="current_company" value={manualRawData.current_company} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Experience (yrs)" name="experience" value={manualRawData.experience} onChange={handleManualRawChange} inputProps={{ min: 0 }} /></Grid>
//               <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Notice Period" name="notice_period" value={manualRawData.notice_period} onChange={handleManualRawChange}>{NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={manualRawData.expected_salary} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12}><TextField fullWidth multiline rows={2} size="small" label="Skills (comma-separated)" name="skills" value={manualRawData.skills} onChange={handleManualRawChange} /></Grid>
//             </Grid>
//             <Divider sx={{ my: 2 }} />
//             <TextField select fullWidth size="small" label="Link to Job" name="linked_job_id" value={manualRawData.linked_job_mongo_id || ""} onChange={handleManualRawChange} sx={{ mb: 2 }}>
//               <MenuItem value="">No Job Linked</MenuItem>
//               {jobs.map(j => <MenuItem key={j._id} value={j._id}><Box><Typography fontSize={13} fontWeight={600}>{j.job_id} — {j.title}</Typography>{j.client_name && <Typography fontSize={11} color="text.secondary">{j.client_name}</Typography>}</Box></MenuItem>)}
//             </TextField>
//             <TextField fullWidth multiline rows={2} size="small" label="Notes" name="notes" value={manualRawData.notes} onChange={handleManualRawChange} />
//             {manualRawError && <Alert severity="error" sx={{ mt: 2 }}>{manualRawError}</Alert>}
//           </DialogContent>
//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//             <Button onClick={() => setManualRawOpen(false)}>Cancel</Button>
//             <Button type="submit" variant="contained" color="secondary" disabled={manualRawSaving || !manualRawData.name} startIcon={manualRawSaving ? <CircularProgress size={16} color="inherit" /> : <EditNote />}>{manualRawSaving ? "Saving…" : "Add to Stored Resumes"}</Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//     </Box>
//   );
// }





















// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import {
//   Box, Card, CardContent, Typography, Button, TextField,
//   MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
//   Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
//   Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
//   InputAdornment, Divider, LinearProgress, Grid, Tabs, Tab, Badge,
// } from "@mui/material";
// import {
//   Add, Search, Edit, Delete, Visibility,
//   Description, Star, People, NewReleases, PersonOff,
//   CloudUpload, CheckCircle, Done, NavigateBefore,
//   Close as CloseIcon, PictureAsPdf, OpenInNew, Business,
//   Inventory2, PersonAdd, Work, SwapHoriz,
//   EditNote, ArrowForward, FilterList, Analytics,
// } from "@mui/icons-material";

// import CandidateDetailContent, { nameInitials, fmtSalary, STATUS_COLOR, STAGE_COLOR } from "./Candidatedetailcontent";

// // ── API helpers ───────────────────────────────────────────────────────────────
// const BASE = process.env.REACT_APP_API_BASE_URL;

// const getHeaders = () => ({
//   "Content-Type": "application/json",
//   Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
// });

// const handle = async (res) => {
//   const data = await res.json();
//   if (!res.ok) throw data;
//   return data;
// };

// const getAllResumes = (p = {}) => {
//   const qs = new URLSearchParams(p).toString();
//   return fetch(`${BASE}/resumes/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
// };
// const createResume = (payload) =>
//   fetch(`${BASE}/resumes/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// const updateResume = (id, payload) =>
//   fetch(`${BASE}/resumes/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// const deleteResume = (id) =>
//   fetch(`${BASE}/resumes/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
// const getAllJobs = () =>
//   fetch(`${BASE}/jobs/`, { headers: getHeaders() }).then(handle);
// const getAllClients = () =>
//   fetch(`${BASE}/clients/`, { headers: getHeaders() }).then(handle);
// const parsePdfViaBackend = (file_b64, file_name) =>
//   fetch(`${BASE}/resumes/parse-pdf`, {
//     method: "POST", headers: getHeaders(),
//     body: JSON.stringify({ file_b64, file_name }),
//   }).then(handle);
// const uploadFileForCandidate = (id, file_b64) =>
//   fetch(`${BASE}/resumes/${id}/upload-file`, {
//     method: "POST", headers: getHeaders(),
//     body: JSON.stringify({ file_b64 }),
//   }).then(handle);
// const getRawResumes = (p = {}) => {
//   const qs = new URLSearchParams(p).toString();
//   return fetch(`${BASE}/resumes/raw/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
// };
// const uploadRawResume = (file_b64, file_name) =>
//   fetch(`${BASE}/resumes/raw/upload`, {
//     method: "POST", headers: getHeaders(),
//     body: JSON.stringify({ file_b64, file_name }),
//   }).then(handle);
// const assignRawToJob = (id, payload) =>
//   fetch(`${BASE}/resumes/raw/${id}/assign-job`, {
//     method: "PUT", headers: getHeaders(),
//     body: JSON.stringify(payload),
//   }).then(handle);
// const convertRaw = (id, payload) =>
//   fetch(`${BASE}/resumes/raw/${id}/convert`, {
//     method: "POST", headers: getHeaders(),
//     body: JSON.stringify(payload),
//   }).then(handle);
// const deleteRaw = (id) =>
//   fetch(`${BASE}/resumes/raw/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
// const createRawManual = (payload) =>
//   fetch(`${BASE}/resumes/raw/manual`, {
//     method: "POST", headers: getHeaders(),
//     body: JSON.stringify(payload),
//   }).then(handle);

// // ── Scoring APIs ──────────────────────────────────────────────────────────────
// const scoreCandidate = (resume_id, job_id) =>
//   fetch(`${BASE}/score/candidate`, {
//     method: "POST", headers: getHeaders(),
//     body: JSON.stringify({ resume_id, job_id }),
//   }).then(handle);

// const getCachedScore = (resume_id, job_id) =>
//   fetch(`${BASE}/score/candidate?resume_id=${resume_id}&job_id=${job_id}`, {
//     headers: getHeaders(),
//   }).then(handle);

// const toBase64 = (file) =>
//   new Promise((res, rej) => {
//     const r = new FileReader();
//     r.onload = () => res(r.result.split(",")[1]);
//     r.onerror = () => rej(new Error("Read failed"));
//     r.readAsDataURL(file);
//   });

// // ── Constants ─────────────────────────────────────────────────────────────────
// const STATUSES  = ["New", "In Review", "Shortlisted", "Interviewed", "Offered", "Hired", "Rejected", "On Hold"];
// const SOURCES   = ["LinkedIn", "Naukri", "Indeed", "Referral", "Job Portal", "Direct", "Other"];
// const NOTICES   = ["Immediate", "15 days", "30 days", "60 days", "90 days"];
// const EXP_BANDS = [
//   { label: "All Experience", min: "",   max: ""  },
//   { label: "0–2 years",      min: "0",  max: "2" },
//   { label: "3–5 years",      min: "3",  max: "5" },
//   { label: "6–10 years",     min: "6",  max: "10"},
//   { label: "10+ years",      min: "10", max: ""  },
// ];

// const RAW_STATUS_COLOR = { Stored: "default", Assigned: "primary", Converted: "success" };
// const PARSE_COLOR = { parsed: "success", failed: "warning", pending: "default", manual: "info" };

// const EMPTY_FORM = {
//   name: "", email: "", phone: "", current_role: "", current_company: "",
//   experience: "", skills: "", location: "", current_salary: "",
//   expected_salary: "", notice_period: "30 days", source: "LinkedIn",
//   status: "New", linked_job_id: "", linked_job_mongo_id: "", linked_job_title: "", notes: "",
// };
// const EMPTY_CONVERT = {
//   name: "", email: "", phone: "", current_role: "", current_company: "",
//   experience: "", skills: "", location: "", current_salary: "",
//   expected_salary: "", notice_period: "30 days", source: "Direct",
//   status: "New", linked_job_id: "", linked_job_mongo_id: "", linked_job_title: "", notes: "",
// };
// const EMPTY_MANUAL_RAW = {
//   name: "", email: "", phone: "", current_role: "", current_company: "",
//   experience: "", skills: "", location: "", current_salary: "",
//   expected_salary: "", notice_period: "30 days",
//   linked_job_id: "", linked_job_mongo_id: "", linked_job_title: "", notes: "",
// };

// // ── Stat card ─────────────────────────────────────────────────────────────────
// const StatCard = ({ title, value, icon, color }) => (
//   <Card>
//     <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
//       <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>{icon}</Avatar>
//       <Box>
//         <Typography fontSize={12} color="text.secondary" fontWeight={600} textTransform="uppercase">{title}</Typography>
//         <Typography variant="h4" fontWeight={800} sx={{ color }}>{value}</Typography>
//       </Box>
//     </CardContent>
//   </Card>
// );

// // ── Inline upload drop-zone ───────────────────────────────────────────────────
// const InlineUploadZone = ({
//   onFiles, fileRef,
//   label    = "Drag & drop PDF resumes here to upload",
//   sublabel = "AI will auto-extract candidate details · Multiple files supported · PDF only",
// }) => {
//   const [drag, setDrag] = useState(false);
//   return (
//     <Box
//       onDragOver={e => { e.preventDefault(); setDrag(true); }}
//       onDragLeave={() => setDrag(false)}
//       onDrop={e => { e.preventDefault(); setDrag(false); onFiles({ target: { files: e.dataTransfer.files } }); }}
//       onClick={() => fileRef.current?.click()}
//       sx={{
//         border: drag ? "2px dashed #1565c0" : "2px dashed #90caf9",
//         borderRadius: 3, bgcolor: drag ? "#e3f2fd" : "#f8fbff",
//         p: 2.5, display: "flex", alignItems: "center", gap: 2.5,
//         cursor: "pointer", transition: "all 0.2s",
//         "&:hover": { bgcolor: "#e3f2fd", borderColor: "#1565c0" },
//       }}
//     >
//       <Avatar sx={{ width: 52, height: 52, bgcolor: drag ? "#1565c0" : "#e3f2fd", transition: "all 0.2s", flexShrink: 0 }}>
//         <CloudUpload sx={{ fontSize: 28, color: drag ? "#fff" : "#1565c0" }} />
//       </Avatar>
//       <Box flex={1}>
//         <Typography fontWeight={700} color="primary.dark" fontSize="0.95rem">{label}</Typography>
//         <Typography fontSize={12} color="text.secondary" mt={0.3}>{sublabel}</Typography>
//       </Box>
//       <input ref={fileRef} type="file" accept=".pdf,application/pdf" multiple hidden onChange={onFiles} />
//     </Box>
//   );
// };

// // ── Inline parsing progress ───────────────────────────────────────────────────
// const InlineParseProgress = ({ files, onReview, onClear }) => {
//   const allDone = files.every(f => f.status !== "parsing" && f.status !== "pending");
//   const parsed  = files.filter(f => f.status === "done").length;
//   const manual  = files.filter(f => f.status === "error").length;
//   return (
//     <Card variant="outlined" sx={{ borderColor: "#90caf9", borderRadius: 2 }}>
//       <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
//         <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
//           <Box display="flex" alignItems="center" gap={1}>
//             {!allDone && <CircularProgress size={14} />}
//             <Typography fontWeight={700} fontSize="0.88rem">
//               {allDone
//                 ? `Parsing complete — ${parsed} parsed${manual ? `, ${manual} need manual entry` : ""}`
//                 : `Parsing ${files.length} resume${files.length > 1 ? "s" : ""} with AI…`}
//             </Typography>
//           </Box>
//           <Box display="flex" gap={1} alignItems="center">
//             {allDone && <Button variant="contained" size="small" onClick={onReview} startIcon={<Done />}>Review &amp; Save</Button>}
//             <IconButton size="small" onClick={onClear}><CloseIcon fontSize="small" /></IconButton>
//           </Box>
//         </Box>
//         <Box display="flex" flexDirection="column" gap={0.8}>
//           {files.map((entry, i) => (
//             <Box key={i} display="flex" alignItems="center" gap={1.5} sx={{ p: 1, bgcolor: "#f5f7fa", borderRadius: 1.5 }}>
//               <Description fontSize="small" color="action" sx={{ flexShrink: 0 }} />
//               <Box flex={1} minWidth={0}>
//                 <Typography fontSize={12} fontWeight={600} noWrap>{entry.file.name}</Typography>
//                 {entry.status === "parsing" && <LinearProgress sx={{ mt: 0.5, height: 3, borderRadius: 2 }} />}
//               </Box>
//               {entry.status === "pending" && <Chip label="Waiting"       size="small" sx={{ fontSize: 10 }} />}
//               {entry.status === "parsing" && <CircularProgress size={16} />}
//               {entry.status === "done"    && <Chip label="Parsed ✓"      size="small" color="success" sx={{ fontSize: 10 }} />}
//               {entry.status === "error"   && <Chip label="Fill manually" size="small" color="warning" sx={{ fontSize: 10 }} />}
//             </Box>
//           ))}
//         </Box>
//       </CardContent>
//     </Card>
//   );
// };

// // ── PDF Viewer Dialog ─────────────────────────────────────────────────────────
// const PdfViewerDialog = ({ open, onClose, candidate }) => {
//   const [blobUrl,  setBlobUrl]  = React.useState(null);
//   const [fetching, setFetching] = React.useState(false);
//   const [fetchErr, setFetchErr] = React.useState("");

//   React.useEffect(() => {
//     if (!open || !candidate?._id || !candidate?.resume_file) return;
//     let objectUrl = null;
//     setFetching(true); setFetchErr("");
//     fetch(`${BASE}/resumes/${candidate._id}/file`, { headers: getHeaders() })
//       .then(res => { if (!res.ok) throw new Error(`Server returned ${res.status}`); return res.blob(); })
//       .then(blob => { objectUrl = URL.createObjectURL(blob); setBlobUrl(objectUrl); })
//       .catch(err => setFetchErr(err.message || "Failed to load PDF"))
//       .finally(() => setFetching(false));
//     return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); setBlobUrl(null); setFetchErr(""); };
//   }, [open, candidate?._id, candidate?.resume_file]);

//   const handleDownload = () => {
//     if (!blobUrl) return;
//     const a = document.createElement("a");
//     a.href = blobUrl;
//     a.download = `${(candidate?.name || "resume").replace(/\s+/g, "_")}_resume.pdf`;
//     a.click();
//   };

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
//       PaperProps={{ sx: { height: "92vh", display: "flex", flexDirection: "column" } }}>
//       <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", py: 1.5 }}>
//         <Box display="flex" alignItems="center" justifyContent="space-between">
//           <Box display="flex" alignItems="center" gap={1.5}>
//             <PictureAsPdf color="error" />
//             <Box>
//               <Typography fontWeight={700}>{candidate?.name} — Original Resume</Typography>
//               <Typography fontSize={11} color="text.secondary">{candidate?.resume_id} · {candidate?.current_role}</Typography>
//             </Box>
//           </Box>
//           <Box display="flex" gap={1} alignItems="center">
//             {blobUrl && <Tooltip title="Download PDF"><IconButton size="small" onClick={handleDownload}><OpenInNew fontSize="small" /></IconButton></Tooltip>}
//             <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
//           </Box>
//         </Box>
//       </DialogTitle>
//       <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
//         {fetching && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}><CircularProgress size={40} /><Typography color="text.secondary" fontSize={14}>Loading resume…</Typography></Box>}
//         {!fetching && fetchErr && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2} p={3}><PictureAsPdf sx={{ fontSize: 72, color: "#ef9a9a" }} /><Typography color="error" fontWeight={600}>Could not load PDF</Typography><Typography fontSize={13} color="text.secondary">{fetchErr}</Typography></Box>}
//         {!fetching && !fetchErr && !candidate?.resume_file && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}><PictureAsPdf sx={{ fontSize: 72, color: "#bdbdbd" }} /><Typography color="text.secondary" fontWeight={600}>No resume file for this candidate</Typography></Box>}
//         {!fetching && blobUrl && <iframe src={blobUrl} title={`${candidate?.name} Resume`} style={{ width: "100%", height: "100%", border: "none" }} />}
//       </DialogContent>
//     </Dialog>
//   );
// };

// // ── Raw PDF Viewer Dialog ─────────────────────────────────────────────────────
// const RawPdfViewerDialog = ({ open, onClose, raw }) => {
//   const [blobUrl,  setBlobUrl]  = React.useState(null);
//   const [fetching, setFetching] = React.useState(false);
//   const [fetchErr, setFetchErr] = React.useState("");

//   React.useEffect(() => {
//     if (!open || !raw?._id) return;
//     let objectUrl = null;
//     setFetching(true); setFetchErr("");
//     fetch(`${BASE}/resumes/raw/${raw._id}/file`, { headers: getHeaders() })
//       .then(res => { if (!res.ok) throw new Error(`Server returned ${res.status}`); return res.blob(); })
//       .then(blob => { objectUrl = URL.createObjectURL(blob); setBlobUrl(objectUrl); })
//       .catch(err => setFetchErr(err.message || "Failed to load PDF"))
//       .finally(() => setFetching(false));
//     return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); setBlobUrl(null); setFetchErr(""); };
//   }, [open, raw?._id]);

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
//       PaperProps={{ sx: { height: "92vh", display: "flex", flexDirection: "column" } }}>
//       <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", py: 1.5 }}>
//         <Box display="flex" alignItems="center" justifyContent="space-between">
//           <Box display="flex" alignItems="center" gap={1.5}>
//             <PictureAsPdf color="error" />
//             <Box>
//               <Typography fontWeight={700}>{raw?.name || raw?.original_name} — Stored Resume</Typography>
//               <Typography fontSize={11} color="text.secondary">{raw?.raw_id} · {raw?.current_role || "Role not extracted"}</Typography>
//             </Box>
//           </Box>
//           <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
//         </Box>
//       </DialogTitle>
//       <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
//         {fetching && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}><CircularProgress size={40} /><Typography color="text.secondary" fontSize={14}>Loading resume…</Typography></Box>}
//         {!fetching && fetchErr && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}><PictureAsPdf sx={{ fontSize: 72, color: "#ef9a9a" }} /><Typography color="error" fontWeight={600}>{fetchErr}</Typography></Box>}
//         {!fetching && blobUrl && <iframe src={blobUrl} title="Stored Resume" style={{ width: "100%", height: "100%", border: "none" }} />}
//       </DialogContent>
//     </Dialog>
//   );
// };

// // ═════════════════════════════════════════════════════════════════════════════
// //  Main Component
// // ═════════════════════════════════════════════════════════════════════════════
// export default function Resumes() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // ── Client filter from URL ─────────────────────────────────────────────────
//   const _qp = new URLSearchParams(location.search);
//   const [urlClientId,    setUrlClientId]    = useState(_qp.get("client")      || "");
//   const [urlClientName,  setUrlClientName]  = useState(_qp.get("client_name") || "");
//   const [isClientLocked, setIsClientLocked] = useState(!!_qp.get("client"));
//   const [urlJobId,       setUrlJobId]       = useState(_qp.get("job")         || "");
//   const [urlJobTitle,    setUrlJobTitle]    = useState(_qp.get("job_title")   || "");
//   const [isJobLocked,    setIsJobLocked]    = useState(!!_qp.get("job"));

//   useEffect(() => {
//     const p     = new URLSearchParams(location.search);
//     const cid   = p.get("client")      || "";
//     const cname = p.get("client_name") || "";
//     const jid   = p.get("job")         || "";
//     const jtitle = p.get("job_title")  || "";
//     setUrlClientId(cid); setUrlClientName(cname); setIsClientLocked(!!cid);
//     setClientF(cid);
//     setUrlJobId(jid); setUrlJobTitle(jtitle); setIsJobLocked(!!jid);
//     // pre-set job filter dropdown when coming from Jobs page
//     if (jid) setJobF(jid);
//     else if (!cid) setJobF("");
//   }, [location.search]);

//   const clearClientFilter = () => {
//     setUrlClientId(""); setUrlClientName(""); setIsClientLocked(false);
//     setClientF(""); setJobF("");
//     navigate("/resumes", { replace: true });
//   };

//   const clearJobFilter = () => {
//     setUrlJobId(""); setUrlJobTitle(""); setIsJobLocked(false);
//     setJobF("");
//     navigate("/resumes", { replace: true });
//   };

//   // ── Tabs & core state ──────────────────────────────────────────────────────
//   const [mainTab, setMainTab] = useState(0);

//   const [resumes,     setResumes]     = useState([]);
//   const [jobs,        setJobs]        = useState([]);
//   const [loading,     setLoading]     = useState(true);
//   const [error,       setError]       = useState("");
//   const [search,      setSearch]      = useState("");
//   const [statusF,     setStatusF]     = useState("");
//   const [expF,        setExpF]        = useState("");
//   const [jobF,        setJobF]        = useState("");
//   const [clientF,     setClientF]     = useState(_qp.get("client") || "");
//   const [clients,     setClients]     = useState([]);
//   const [formOpen,    setFormOpen]    = useState(false);
//   const [detailOpen,  setDetailOpen]  = useState(false);
//   const [deleteOpen,  setDeleteOpen]  = useState(false);
//   const [pdfOpen,     setPdfOpen]     = useState(false);
//   const [selected,    setSelected]    = useState(null);
//   const [formData,    setFormData]    = useState(EMPTY_FORM);
//   const [saving,      setSaving]      = useState(false);
//   const [addFile,     setAddFile]     = useState(null);
//   const formFileRef   = useRef(null);
//   const [inlineFiles, setInlineFiles] = useState([]);
//   const [showParsing, setShowParsing] = useState(false);
//   const inlineRef     = useRef(null);
//   const [bulkOpen,    setBulkOpen]    = useState(false);
//   const [bulkFiles,   setBulkFiles]   = useState([]);
//   const [bulkStep,    setBulkStep]    = useState(0);
//   const [bulkSaving,  setBulkSaving]  = useState(false);
//   const [bulkDone,    setBulkDone]    = useState(false);
//   const [recruiters,  setRecruiters]  = useState([]);
//   const [allTracking, setAllTracking] = useState([]);

//   // ── Stored resumes state ───────────────────────────────────────────────────
//   const [rawResumes,     setRawResumes]     = useState([]);
//   const [rawLoading,     setRawLoading]     = useState(false);
//   const [rawSearch,      setRawSearch]      = useState("");
//   const [rawStatusF,     setRawStatusF]     = useState("");
//   const rawUploadRef   = useRef(null);
//   const [rawUploading,   setRawUploading]   = useState(false);
//   const [rawUploadBatch, setRawUploadBatch] = useState([]);

//   // ── Dialogs state ──────────────────────────────────────────────────────────
//   const [assignOpen,   setAssignOpen]   = useState(false);
//   const [assignTarget, setAssignTarget] = useState(null);
//   const [assignJobId,  setAssignJobId]  = useState("");
//   const [assignSaving, setAssignSaving] = useState(false);

//   const [convertOpen,   setConvertOpen]   = useState(false);
//   const [convertTarget, setConvertTarget] = useState(null);
//   const [convertData,   setConvertData]   = useState(EMPTY_CONVERT);
//   const [convertSaving, setConvertSaving] = useState(false);
//   const [convertError,  setConvertError]  = useState("");

//   const [rawPdfOpen, setRawPdfOpen] = useState(false);
//   const [rawPdfDoc,  setRawPdfDoc]  = useState(null);

//   const [clientSelectOpen, setClientSelectOpen] = useState(false);
//   const [pickedClient,     setPickedClient]     = useState(null);

//   const [manualRawOpen,   setManualRawOpen]   = useState(false);
//   const [manualRawData,   setManualRawData]   = useState(EMPTY_MANUAL_RAW);
//   const [manualRawSaving, setManualRawSaving] = useState(false);
//   const [manualRawError,  setManualRawError]  = useState("");
//   const [manualRawFile,   setManualRawFile]   = useState(null);
//   const manualFileRef = useRef(null);

//   // ── Scoring state ──────────────────────────────────────────────────────────
//   const [scoreOpen,    setScoreOpen]    = useState(false);
//   const [scoreData,    setScoreData]    = useState(null);
//   const [scoreLoading, setScoreLoading] = useState(false);
//   const [scoreTarget,  setScoreTarget]  = useState(null);
//   const [scoreJobId,   setScoreJobId]   = useState("");
//   const [scoreMap,     setScoreMap]     = useState({});

//   // ── Loaders ────────────────────────────────────────────────────────────────
//   const load = useCallback(async () => {
//     try { setLoading(true); setError(""); const res = await getAllResumes(); setResumes(res.data || []); }
//     catch (err) { setError(err?.message || "Failed to load candidates"); setResumes([]); }
//     finally { setLoading(false); }
//   }, []);

//   const loadRaw = useCallback(async () => {
//     try { setRawLoading(true); const res = await getRawResumes(); setRawResumes(res.data || []); }
//     catch { setRawResumes([]); }
//     finally { setRawLoading(false); }
//   }, []);

//   const loadJobs = useCallback(async () => {
//     try { const res = await getAllJobs(); setJobs(res.data || []); } catch { setJobs([]); }
//   }, []);
//   const loadClients = useCallback(async () => {
//     try { const res = await getAllClients(); setClients(res.data || []); } catch { setClients([]); }
//   }, []);
//   const loadRecruiters = useCallback(async () => {
//     try {
//       const res  = await fetch(`${BASE}/user/`, { headers: getHeaders() });
//       const data = await res.json();
//       setRecruiters((data.data || []).filter(u => u.role === "recruiter"));
//     } catch { setRecruiters([]); }
//   }, []);
//   const loadAllTracking = useCallback(async () => {
//     try {
//       const res  = await fetch(`${BASE}/tracking/`, { headers: getHeaders() });
//       const data = await res.json();
//       setAllTracking(data.data || []);
//     } catch { setAllTracking([]); }
//   }, []);

//   useEffect(() => {
//     load(); loadRaw(); loadJobs(); loadClients(); loadRecruiters(); loadAllTracking();
//   }, [load, loadRaw, loadJobs, loadClients, loadRecruiters, loadAllTracking]);


//   // Load all cached scores whenever resumes or jobs change
//   useEffect(() => {
//     if (!resumes.length || !jobs.length) return;
//     const pairs = resumes
//       .filter(r => r.linked_job_id)
//       .map(r => ({ resumeId: r._id, jobId: jobs.find(j => j.job_id === r.linked_job_id)?._id }))
//       .filter(p => p.jobId);
//     Promise.all(
//       pairs.map(p =>
//         fetch(`${BASE}/score/candidate?resume_id=${p.resumeId}&job_id=${p.jobId}`, { headers: getHeaders() })
//           .then(r => r.ok ? r.json() : null)
//           .catch(() => null)
//       )
//     ).then(results => {
//       const map = {};
//       results.forEach((res, i) => {
//         if (res?.data) map[`${pairs[i].resumeId}_${pairs[i].jobId}`] = res.data;
//       });
//       setScoreMap(map);
//     });
//   }, [resumes, jobs]);
//   const trackingMap = {};
//   allTracking.forEach(t => { if (!trackingMap[t.resume_id]) trackingMap[t.resume_id] = t; });

//   // ── Filtering ──────────────────────────────────────────────────────────────
//   const expBand      = EXP_BANDS.find(b => b.label === expF);
//   const clientJobIds = clientF ? jobs.filter(j => j.client_id === clientF).map(j => j.job_id) : null;
//   const filtered = resumes.filter(r => {
//     const q  = search.toLowerCase();
//     const mQ = !q || r.name?.toLowerCase().includes(q) || r.skills?.toLowerCase().includes(q) || r.resume_id?.toLowerCase().includes(q);
//     const mS = !statusF || r.status === statusF;
//     const selectedJob = jobs.find(j => j._id === jobF);
//     const mJ = !jobF || r.linked_job_id === selectedJob?.job_id;
//     const mE = !expBand || expBand.label === "All Experience" ||
//       (expBand.min === "10" ? r.experience >= 10 : r.experience >= Number(expBand.min) && r.experience <= Number(expBand.max));
//     const mC = !clientJobIds || clientJobIds.includes(r.linked_job_id);
//     return mQ && mS && mJ && mE && mC;
//   });

//   const filteredRaw = rawResumes.filter(r => {
//     const q  = rawSearch.toLowerCase();
//     const mQ = !q || r.name?.toLowerCase().includes(q) || r.raw_id?.toLowerCase().includes(q)
//                   || r.original_name?.toLowerCase().includes(q) || r.skills?.toLowerCase().includes(q);
//     const mS = !rawStatusF || r.status === rawStatusF;
//     return mQ && mS;
//   });

//   const stats = {
//     total:       resumes.length,
//     newCount:    resumes.filter(r => r.status === "New").length,
//     shortlisted: resumes.filter(r => r.status === "Shortlisted").length,
//     interviewed: resumes.filter(r => r.status === "Interviewed").length,
//   };

//   // ── Dialog helpers ─────────────────────────────────────────────────────────
//   const openCreate = () => { setPickedClient(null); setClientSelectOpen(true); };

//   const handleClientPicked = (client) => {
//     setPickedClient(client); setClientSelectOpen(false); setSelected(null); setAddFile(null);
//     setFormData({ ...EMPTY_FORM, client_name: client?.company_name || "" });
//     setFormOpen(true);
//   };

//   const openEdit   = r => { setSelected(r); setFormData({ ...EMPTY_FORM, ...r }); setAddFile(null); setFormOpen(true); };
//   const openDetail = r => { setSelected(r); setDetailOpen(true); };
//   const openDelete = r => { setSelected(r); setDeleteOpen(true); };
//   const openPdf    = r => { setSelected(r); setPdfOpen(true); };

//   const formClientJobs = pickedClient
//     ? jobs.filter(j => j.client_id === pickedClient._id || j.client_name === pickedClient.company_name)
//     : jobs;

//   const handleChange = e => {
//     const { name, value } = e.target;
//     if (name === "linked_job_id") {
//       const job = jobs.find(j => j._id === value);
//       setFormData(p => ({ ...p, linked_job_id: job?.job_id || "", linked_job_mongo_id: value, linked_job_title: job?.title || "" }));
//     } else {
//       setFormData(p => ({ ...p, [name]: value }));
//     }
//   };

//   const openManualRaw = () => { setManualRawData(EMPTY_MANUAL_RAW); setManualRawError(""); setManualRawFile(null); setManualRawOpen(true); };

//   const handleManualRawChange = e => {
//     const { name, value } = e.target;
//     if (name === "linked_job_id") {
//       const job = jobs.find(j => j._id === value);
//       setManualRawData(p => ({ ...p, linked_job_id: job?.job_id || "", linked_job_mongo_id: value, linked_job_title: job?.title || "" }));
//     } else {
//       setManualRawData(p => ({ ...p, [name]: value }));
//     }
//   };

//   const handleManualRawSave = async (e) => {
//     e.preventDefault(); setManualRawSaving(true); setManualRawError("");
//     try {
//       const payload = { ...manualRawData, experience: manualRawData.experience ? Number(manualRawData.experience) : 0, current_salary: manualRawData.current_salary ? Number(manualRawData.current_salary) : 0, expected_salary: manualRawData.expected_salary ? Number(manualRawData.expected_salary) : 0 };
//       if (manualRawFile) { payload.file_b64 = await toBase64(manualRawFile); payload.file_name = manualRawFile.name; }
//       await createRawManual(payload);
//       setManualRawOpen(false); setManualRawFile(null); loadRaw();
//     } catch (err) { setManualRawError(err?.message || "Save failed"); }
//     finally { setManualRawSaving(false); }
//   };

//   const handleSave = async (e) => {
//     e.preventDefault(); setSaving(true);
//     try {
//       const payload = { ...formData, experience: formData.experience ? Number(formData.experience) : 0, current_salary: formData.current_salary ? Number(formData.current_salary) : 0, expected_salary: formData.expected_salary ? Number(formData.expected_salary) : 0 };
//       if (selected) {
//         await updateResume(selected._id, payload);
//         if (addFile) { const b64 = await toBase64(addFile); await uploadFileForCandidate(selected._id, b64).catch(() => {}); }
//       } else {
//         const created = await createResume(payload);
//         if (addFile && created?.data?._id) { const b64 = await toBase64(addFile); await uploadFileForCandidate(created.data._id, b64).catch(() => {}); }
//       }
//       setAddFile(null); setFormOpen(false); load();
//     } catch (err) { setError(err?.message || "Save failed"); }
//     finally { setSaving(false); }
//   };

//   const handleDelete = async () => {
//     try { await deleteResume(selected._id); setDeleteOpen(false); load(); }
//     catch (err) { setError(err?.message || "Delete failed"); }
//   };

//   const handleFileSelect = async (e) => {
//     const files = Array.from(e.target.files || []).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
//     if (!files.length) return;
//     if (inlineRef.current) inlineRef.current.value = "";
//     const entries = files.map(f => ({ file: f, status: "pending", file_id: "", formData: { ...EMPTY_FORM, status: "New" }, saved: false, errorMsg: "" }));
//     setInlineFiles(entries); setShowParsing(true);
//     const updated = [...entries];
//     await Promise.all(entries.map(async (entry, idx) => {
//       updated[idx] = { ...updated[idx], status: "parsing" };
//       setInlineFiles([...updated]);
//       try {
//         const b64    = await toBase64(entry.file);
//         const result = await parsePdfViaBackend(b64, entry.file.name);
//         const parsed  = result.data    || {};
//         const file_id = result.file_id || "";
//         updated[idx] = { ...updated[idx], status: "done", file_id, formData: { ...EMPTY_FORM, ...parsed, experience: parsed.experience || "", current_salary: parsed.current_salary || "", expected_salary: parsed.expected_salary || "", status: "New" } };
//       } catch (err) {
//         const file_id = err?.file_id || "";
//         updated[idx] = { ...updated[idx], status: "error", file_id, errorMsg: err?.message || "Auto-parse failed — fill manually", formData: { ...EMPTY_FORM, status: "New" } };
//       }
//       setInlineFiles([...updated]);
//     }));
//   };

//   const openBulkReview = () => { setBulkFiles(inlineFiles); setBulkStep(0); setBulkDone(false); setBulkOpen(true); };
//   const clearInline    = () => { setShowParsing(false); setInlineFiles([]); };

//   const handleBulkChange = e => {
//     const { name, value } = e.target;
//     setBulkFiles(prev => prev.map((entry, idx) =>
//       idx !== bulkStep ? entry : {
//         ...entry,
//         formData: name === "linked_job_id"
//           ? { ...entry.formData, linked_job_id: value, linked_job_title: jobs.find(j => j._id === value)?.title || "" }
//           : { ...entry.formData, [name]: value },
//       }
//     ));
//   };

//   const handleBulkSave = async () => {
//     setBulkSaving(true);
//     const entry = bulkFiles[bulkStep];
//     try {
//       const fd = entry.formData;
//       await createResume({ ...fd, experience: fd.experience ? Number(fd.experience) : 0, current_salary: fd.current_salary ? Number(fd.current_salary) : 0, expected_salary: fd.expected_salary ? Number(fd.expected_salary) : 0, file_id: entry.file_id || "" });
//       setBulkFiles(prev => prev.map((e, i) => i === bulkStep ? { ...e, saved: true } : e));
//       if (bulkStep < bulkFiles.length - 1) setBulkStep(s => s + 1);
//       else { setBulkDone(true); load(); }
//     } catch (err) {
//       setBulkFiles(prev => prev.map((e, i) => i === bulkStep ? { ...e, errorMsg: err?.message || "Save failed" } : e));
//     } finally { setBulkSaving(false); }
//   };

//   const handleBulkSkip = () => {
//     if (bulkStep < bulkFiles.length - 1) setBulkStep(s => s + 1);
//     else { setBulkDone(true); load(); }
//   };

//   const closeBulk    = () => { setBulkOpen(false); clearInline(); load(); };
//   const savedCount   = bulkFiles.filter(f => f.saved).length;
//   const currentEntry = bulkFiles[bulkStep];

//   const handleRawFileSelect = async (e) => {
//     const files = Array.from(e.target.files || []).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
//     if (!files.length) return;
//     if (rawUploadRef.current) rawUploadRef.current.value = "";
//     const batch = files.map(f => ({ file: f, status: "uploading" }));
//     setRawUploadBatch(batch); setRawUploading(true);
//     await Promise.all(batch.map(async (entry, idx) => {
//       try { const b64 = await toBase64(entry.file); await uploadRawResume(b64, entry.file.name); batch[idx] = { ...entry, status: "done" }; }
//       catch { batch[idx] = { ...entry, status: "error" }; }
//       setRawUploadBatch([...batch]);
//     }));
//     setRawUploading(false); loadRaw();
//     setTimeout(() => setRawUploadBatch([]), 3000);
//   };

//   const openAssign = (raw) => { setAssignTarget(raw); setAssignJobId(""); setAssignOpen(true); };
//   const handleAssign = async () => {
//     if (!assignJobId) return;
//     const job = jobs.find(j => j._id === assignJobId);
//     setAssignSaving(true);
//     try {
//       await assignRawToJob(assignTarget._id, { job_id: assignJobId, job_title: job?.title || "", client_name: job?.client_name || "" });
//       setAssignOpen(false); loadRaw();
//     } catch (err) { setError(err?.message || "Failed to assign job"); }
//     finally { setAssignSaving(false); }
//   };

//   const openConvert = (raw) => {
//     setConvertTarget(raw); setConvertError("");
//     setConvertData({ ...EMPTY_CONVERT, name: raw.name || "", email: raw.email || "", phone: raw.phone || "", current_role: raw.current_role || "", current_company: raw.current_company || "", experience: raw.experience || "", skills: raw.skills || "", location: raw.location || "", current_salary: raw.current_salary || "", expected_salary: raw.expected_salary || "", notice_period: raw.notice_period || "30 days", linked_job_id: raw.linked_job_id || "", linked_job_title: raw.linked_job_title || "" });
//     setConvertOpen(true);
//   };

//   const handleConvertChange = e => {
//     const { name, value } = e.target;
//     if (name === "linked_job_id") {
//       const job = jobs.find(j => j._id === value);
//       setConvertData(p => ({ ...p, linked_job_id: job?.job_id || "", linked_job_mongo_id: value, linked_job_title: job?.title || "" }));
//     } else {
//       setConvertData(p => ({ ...p, [name]: value }));
//     }
//   };

//   const handleConvert = async (e) => {
//     e.preventDefault(); setConvertSaving(true); setConvertError("");
//     try {
//       const payload = { ...convertData, experience: convertData.experience ? Number(convertData.experience) : 0, current_salary: convertData.current_salary ? Number(convertData.current_salary) : 0, expected_salary: convertData.expected_salary ? Number(convertData.expected_salary) : 0 };
//       await convertRaw(convertTarget._id, payload);
//       setConvertOpen(false); load(); loadRaw();
//     } catch (err) { setConvertError(err?.message || "Conversion failed"); }
//     finally { setConvertSaving(false); }
//   };

//   // ── Scoring handlers ───────────────────────────────────────────────────────
//   const openScore = async (r) => {
//     const linkedJob = jobs.find(j => j.job_id === r.linked_job_id);
//     if (!linkedJob) { setError("Cannot score: candidate has no linked job"); return; }
//     setScoreTarget(r); setScoreJobId(linkedJob._id); setScoreData(null);
//     setScoreOpen(true); setScoreLoading(true);
//     try {
//       const cached = await getCachedScore(r._id, linkedJob._id);
//       setScoreData(cached.data);
//       setScoreMap(prev => ({ ...prev, [`${r._id}_${linkedJob._id}`]: cached.data }));
//     } catch {
//       try {
//         const fresh = await scoreCandidate(r._id, linkedJob._id);
//         setScoreData(fresh.data);
//         setScoreMap(prev => ({ ...prev, [`${r._id}_${linkedJob._id}`]: fresh.data }));
//       } catch (err) { setError(err?.message || "Scoring failed"); setScoreOpen(false); }
//     } finally { setScoreLoading(false); }
//   };

//   const reScore = async () => {
//     if (!scoreTarget || !scoreJobId) return;
//     setScoreLoading(true); setScoreData(null);
//     try {
//       const fresh = await scoreCandidate(scoreTarget._id, scoreJobId);
//       setScoreData(fresh.data);
//       setScoreMap(prev => ({ ...prev, [`${scoreTarget._id}_${scoreJobId}`]: fresh.data }));
//     } catch (err) { setError(err?.message || "Re-scoring failed"); }
//     finally { setScoreLoading(false); }
//   };

//   if (loading)
//     return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={48} /></Box>;

//   // ── Score bar colour helper ────────────────────────────────────────────────
//   const barColor = (score) =>
//     score >= 80 ? "#2e7d32" : score >= 60 ? "#1565c0" : score >= 40 ? "#f57c00" : "#c62828";

//   return (
//     <Box display="flex" flexDirection="column" gap={3}>

//       {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

//       {/* ── Page header ────────────────────────────────────────────────────── */}
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
//         <Box>
//           <Typography variant="h4" color="primary.dark">Candidates</Typography>
//           <Typography color="text.secondary" mt={0.5}>Manage candidate profiles and track applications</Typography>
//         </Box>
//         <Box display="flex" gap={1.5}>
//           {mainTab === 0 && (
//             <>
//               <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => inlineRef.current?.click()} size="large">Upload Resume</Button>
//               <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">Add Candidate</Button>
//             </>
//           )}
//           {mainTab === 1 && (
//             <Box display="flex" gap={1.5}>
//               <Button variant="outlined" startIcon={<EditNote />} onClick={openManualRaw} size="large">Add Manually</Button>
//               <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => rawUploadRef.current?.click()} size="large">Store Resumes</Button>
//             </Box>
//           )}
//         </Box>
//       </Box>

//       {/* ── Client filter banner ──────────────────────────────────────────── */}
//       {isClientLocked && (
//         <Alert severity="info" icon={<FilterList fontSize="small" />}
//           action={<Chip label="Show all clients" size="small" variant="outlined" onDelete={clearClientFilter} onClick={clearClientFilter} deleteIcon={<CloseIcon />} sx={{ fontSize: 11, cursor: "pointer" }} />}
//           sx={{ py: 0.5 }}>
//           Showing candidates for <strong>{urlClientName}</strong>
//         </Alert>
//       )}

//       {/* ── Job filter banner ────────────────────────────────────────────────── */}
//       {isJobLocked && (
//         <Alert severity="success" icon={<Work fontSize="small" />}
//           action={<Chip label="Show all jobs" size="small" variant="outlined" onDelete={clearJobFilter} onClick={clearJobFilter} deleteIcon={<CloseIcon />} sx={{ fontSize: 11, cursor: "pointer" }} />}
//           sx={{ py: 0.5 }}>
//           Showing candidates for job <strong>{urlJobTitle}</strong>
//         </Alert>
//       )}

//       {/* ── Stat cards ─────────────────────────────────────────────────────── */}
//       <Grid container spacing={2.5}>
//         <Grid item xs={6} md={3}><StatCard title={isClientLocked ? "Client Candidates" : "Total"} value={isClientLocked ? filtered.length : stats.total} icon={<Description />} color="#1a237e" /></Grid>
//         <Grid item xs={6} md={3}><StatCard title="New"         value={isClientLocked ? filtered.filter(r=>r.status==="New").length        : stats.newCount}    icon={<NewReleases />} color="#0277bd" /></Grid>
//         <Grid item xs={6} md={3}><StatCard title="Shortlisted" value={isClientLocked ? filtered.filter(r=>r.status==="Shortlisted").length : stats.shortlisted} icon={<Star />}        color="#e65100" /></Grid>
//         <Grid item xs={6} md={3}><StatCard title="Stored PDFs" value={rawResumes.length} icon={<Inventory2 />} color="#6a1b9a" /></Grid>
//       </Grid>

//       {/* ── Main tabs ──────────────────────────────────────────────────────── */}
//       <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
//         <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
//           <Tab label={<Box display="flex" alignItems="center" gap={1}><People fontSize="small" />Candidates{isClientLocked && <Chip label={urlClientName} size="small" color="info" sx={{ fontSize: 10, height: 18 }} />}</Box>} iconPosition="start" />
//           <Tab label={<Badge badgeContent={rawResumes.filter(r => r.status === "Stored").length} color="secondary" max={99}><Box sx={{ pr: rawResumes.filter(r => r.status === "Stored").length > 0 ? 1.5 : 0 }}>Stored Resumes</Box></Badge>} icon={<Inventory2 fontSize="small" />} iconPosition="start" />
//         </Tabs>
//       </Box>

//       {/* ══════════════════════════════════════════════════════════════════════
//           TAB 0 — Resume Bank
//       ══════════════════════════════════════════════════════════════════════ */}
//       {mainTab === 0 && (
//         <>
//           {!showParsing
//             ? <InlineUploadZone onFiles={handleFileSelect} fileRef={inlineRef} />
//             : <InlineParseProgress files={inlineFiles} onReview={openBulkReview} onClear={clearInline} />
//           }

//           <Box display="flex" gap={2} flexWrap="wrap">
//             <TextField placeholder="Search by name, skills, or ID…" value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
//             <TextField select value={statusF} onChange={e => setStatusF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Status">
//               <MenuItem value="">All Statuses</MenuItem>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//             </TextField>
//             <TextField select value={expF} onChange={e => setExpF(e.target.value)} size="small" sx={{ minWidth: 160 }} label="Experience">
//               <MenuItem value="">All Experience</MenuItem>{EXP_BANDS.slice(1).map(b => <MenuItem key={b.label} value={b.label}>{b.label}</MenuItem>)}
//             </TextField>
//             {!isClientLocked && (
//               <TextField select value={clientF} onChange={e => { setClientF(e.target.value); setJobF(""); }} size="small" sx={{ minWidth: 180 }} label="Client">
//                 <MenuItem value="">All Clients</MenuItem>
//                 {clients.map(c => <MenuItem key={c._id} value={c._id}><Box display="flex" alignItems="center" gap={1}><Business fontSize="small" sx={{ color: "#0277bd" }} />{c.company_name}</Box></MenuItem>)}
//               </TextField>
//             )}
//             {!isJobLocked && (
//               <TextField select value={jobF} onChange={e => setJobF(e.target.value)} size="small" sx={{ minWidth: 180 }} label="Job">
//                 <MenuItem value="">All Jobs</MenuItem>
//                 {(clientF ? jobs.filter(j => j.client_id === clientF) : jobs).map(j => <MenuItem key={j._id} value={j._id}>{j.title}</MenuItem>)}
//               </TextField>
//             )}
//           </Box>

//           {resumes.length === 0 && !error ? (
//             <Card>
//               <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
//                 <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}><PersonOff sx={{ fontSize: 36, color: "#9fa8da" }} /></Avatar>
//                 <Typography variant="h6" color="text.secondary">No candidates yet</Typography>
//                 <Typography fontSize={14} color="text.disabled">Drop PDF resumes above or add a candidate manually.</Typography>
//                 <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Candidate</Button>
//               </Box>
//             </Card>
//           ) : (
//             <Card>
//               <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//                 <Table>
//                   <TableHead>
//                     <TableRow sx={{ bgcolor: "#f5f7fa" }}>
//                       {["Candidate", "Current Role", "Exp", "Skills", "Expected Salary", "Notice", "Applied For", "Match %", "Pipeline Stage", "Status", "Actions"].map(h => (
//                         <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
//                       ))}
//                     </TableRow>
//                   </TableHead>
//                   <TableBody>
//                     {filtered.length === 0 ? (
//                       <TableRow>
//                         <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
//                           {isJobLocked ? `No candidates found for job "${urlJobTitle}"` : isClientLocked ? `No candidates found for ${urlClientName}` : "No candidates match your filters"}
//                         </TableCell>
//                       </TableRow>
//                     ) : filtered.map(r => (
//                       <TableRow key={r._id} hover>
//                         <TableCell>
//                           <Box display="flex" alignItems="center" gap={1.5}>
//                             <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: "#1a237e" }}>{nameInitials(r.name)}</Avatar>
//                             <Box><Typography fontWeight={600} fontSize={13}>{r.name}</Typography><Typography fontSize={11} color="text.secondary">{r.resume_id}</Typography></Box>
//                           </Box>
//                         </TableCell>
//                         <TableCell><Typography fontSize={13}>{r.current_role}</Typography><Typography fontSize={11} color="text.secondary">{r.current_company}</Typography></TableCell>
//                         <TableCell sx={{ fontSize: 12 }}>{r.experience} yrs</TableCell>
//                         <TableCell>
//                           <Box display="flex" flexWrap="wrap" gap={0.5}>
//                             {(r.skills || "").split(",").filter(Boolean).slice(0, 3).map((s, i) => <Chip key={i} label={s.trim()} size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#e8eaf6", color: "#1a237e" }} />)}
//                             {(r.skills || "").split(",").filter(Boolean).length > 3 && <Chip label={`+${(r.skills || "").split(",").length - 3}`} size="small" sx={{ fontSize: 10, height: 20 }} />}
//                           </Box>
//                         </TableCell>
//                         <TableCell sx={{ fontSize: 12 }}>{fmtSalary(r.expected_salary)}</TableCell>
//                         <TableCell sx={{ fontSize: 12 }}>{r.notice_period || "—"}</TableCell>
//                         <TableCell>
//                           {r.linked_job_title ? (
//                             <Box>
//                               {(() => { const lj = jobs.find(j => j.job_id === r.linked_job_id); return lj?.client_name ? <Typography fontSize={10} color="text.secondary" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.2 }}><Business sx={{ fontSize: 10 }} />{lj.client_name}</Typography> : null; })()}
//                               <Typography fontSize={12} color="#0277bd" fontWeight={600}>{r.linked_job_id}</Typography>
//                               <Typography fontSize={11} color="text.secondary">{r.linked_job_title}</Typography>
//                             </Box>
//                           ) : <Typography fontSize={12} color="text.disabled">—</Typography>}
//                         </TableCell>
//                         <TableCell sx={{ minWidth: 70 }}>
//                           {(() => {
//                             const linkedJob = jobs.find(j => j.job_id === r.linked_job_id);
//                             if (!linkedJob) return <Typography fontSize={11} color="text.disabled">—</Typography>;
//                             const key = `${r._id}_${linkedJob._id}`;
//                             const sc  = scoreMap[key];
//                             if (!sc) return (
//                               <Tooltip title="Click score button to generate">
//                                 <Typography fontSize={11} color="text.disabled" sx={{ cursor: "default" }}>—</Typography>
//                               </Tooltip>
//                             );
//                             const color = sc.overall_score >= 80 ? "#2e7d32" : sc.overall_score >= 60 ? "#1565c0" : sc.overall_score >= 40 ? "#f57c00" : "#c62828";
//                             const bg    = sc.overall_score >= 80 ? "#e8f5e9" : sc.overall_score >= 60 ? "#e3f2fd" : sc.overall_score >= 40 ? "#fff8e1" : "#fce4ec";
//                             return (
//                               <Tooltip title={sc.verdict}>
//                                 <Box onClick={() => openScore(r)} sx={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.3, borderRadius: 20, bgcolor: bg, border: `1px solid ${color}20` }}>
//                                   <Typography fontSize={12} fontWeight={700} color={color}>{sc.overall_score}%</Typography>
//                                 </Box>
//                               </Tooltip>
//                             );
//                           })()}
//                         </TableCell>
//                         <TableCell>
//                           {(() => { const track = trackingMap[r.resume_id]; if (!track) return <Typography fontSize={12} color="text.disabled">—</Typography>; return <Box><Chip label={track.current_stage} size="small" color={STAGE_COLOR[track.current_stage] || "default"} sx={{ fontWeight: 700, fontSize: 10, mb: 0.3 }} /><Typography fontSize={10} color="text.secondary">{track.pipeline_status}</Typography></Box>; })()}
//                         </TableCell>
//                         <TableCell><Chip label={r.status} color={STATUS_COLOR[r.status] || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} /></TableCell>
//                         <TableCell>
//                           <Box display="flex" gap={0.5}>
//                             <Tooltip title="View Details"><IconButton size="small" onClick={() => openDetail(r)}><Visibility fontSize="small" /></IconButton></Tooltip>
//                             <Tooltip title={r.resume_file ? "View Resume PDF" : "No resume file uploaded"}>
//                               <span><IconButton size="small" onClick={() => r.resume_file && openPdf(r)} sx={{ color: r.resume_file ? "#c62828" : "#bdbdbd", cursor: r.resume_file ? "pointer" : "not-allowed" }}><PictureAsPdf fontSize="small" /></IconButton></span>
//                             </Tooltip>
//                             {/* ── Score button ── */}
//                             <Tooltip title={r.linked_job_id ? "AI Score vs Job" : "Link to a job to enable scoring"}>
//                               <span>
//                                 <IconButton size="small" onClick={() => openScore(r)} disabled={!r.linked_job_id} sx={{ color: r.linked_job_id ? "#7b1fa2" : "#bdbdbd" }}>
//                                   <Analytics fontSize="small" />
//                                 </IconButton>
//                               </span>
//                             </Tooltip>
//                             <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton></Tooltip>
//                             <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDelete(r)}><Delete fontSize="small" /></IconButton></Tooltip>
//                           </Box>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </Paper>
//             </Card>
//           )}
//         </>
//       )}

//       {/* ══════════════════════════════════════════════════════════════════════
//           TAB 1 — Stored Resumes
//       ══════════════════════════════════════════════════════════════════════ */}
//       {mainTab === 1 && (
//         <>
//           <input ref={rawUploadRef} type="file" accept=".pdf,application/pdf" multiple hidden onChange={handleRawFileSelect} />
//           <InlineUploadZone onFiles={handleRawFileSelect} fileRef={rawUploadRef} label="Drag & drop PDFs here to store them quickly" sublabel="Saved immediately · AI auto-extracts details · assign to a job anytime · convert to full candidate when ready" />

//           {rawUploadBatch.length > 0 && (
//             <Card variant="outlined" sx={{ borderColor: "#ce93d8", borderRadius: 2 }}>
//               <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
//                 <Typography fontWeight={700} fontSize="0.88rem" mb={1}>{rawUploading ? "Storing resumes…" : "Upload complete ✓"}</Typography>
//                 <Box display="flex" flexDirection="column" gap={0.8}>
//                   {rawUploadBatch.map((entry, i) => (
//                     <Box key={i} display="flex" alignItems="center" gap={1.5} sx={{ p: 1, bgcolor: "#f5f7fa", borderRadius: 1.5 }}>
//                       <Description fontSize="small" color="action" sx={{ flexShrink: 0 }} />
//                       <Typography fontSize={12} fontWeight={600} flex={1} noWrap>{entry.file.name}</Typography>
//                       {entry.status === "uploading" && <CircularProgress size={16} />}
//                       {entry.status === "done"      && <Chip label="Stored ✓" size="small" color="success" sx={{ fontSize: 10 }} />}
//                       {entry.status === "error"     && <Chip label="Failed"   size="small" color="error"   sx={{ fontSize: 10 }} />}
//                     </Box>
//                   ))}
//                 </Box>
//               </CardContent>
//             </Card>
//           )}

//           <Box px={2} py={1.5} bgcolor="#f3e5f5" borderRadius={2} border="1px solid #ce93d8" display="flex" alignItems="center" gap={1.5}>
//             <Inventory2 fontSize="small" sx={{ color: "#7b1fa2" }} />
//             <Typography fontSize={13} color="#4a148c">Stored resumes are saved PDFs without a full candidate profile. Use <strong>Assign to Job</strong> to link to a posting, then <strong>Convert to Candidate</strong> to create a full profile in the Resume Bank.</Typography>
//           </Box>

//           <Box display="flex" gap={2} flexWrap="wrap">
//             <TextField placeholder="Search by name, skills, or file…" value={rawSearch} onChange={e => setRawSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
//             <TextField select value={rawStatusF} onChange={e => setRawStatusF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Status">
//               <MenuItem value="">All</MenuItem>
//               {["Stored", "Assigned", "Converted"].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
//             </TextField>
//           </Box>

//           {rawLoading ? (
//             <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
//           ) : rawResumes.length === 0 ? (
//             <Card><Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}><Avatar sx={{ width: 72, height: 72, bgcolor: "#f3e5f5" }}><Inventory2 sx={{ fontSize: 36, color: "#ce93d8" }} /></Avatar><Typography variant="h6" color="text.secondary">No stored resumes yet</Typography><Typography fontSize={14} color="text.disabled">Drag PDFs above or click "Store Resumes" to get started.</Typography></Box></Card>
//           ) : (
//             <Card>
//               <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
//                 <Table>
//                   <TableHead><TableRow sx={{ bgcolor: "#fce4ec" }}>{["ID","Candidate","Role / Skills","Exp","Assigned Job","Parse","Status","Actions"].map(h => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>)}</TableRow></TableHead>
//                   <TableBody>
//                     {filteredRaw.length === 0 ? (
//                       <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>No stored resumes match your filters</TableCell></TableRow>
//                     ) : filteredRaw.map(r => (
//                       <TableRow key={r._id} hover sx={{ opacity: r.status === "Converted" ? 0.6 : 1 }}>
//                         <TableCell sx={{ fontWeight: 700, color: "#7b1fa2", fontSize: 12 }}>{r.raw_id}</TableCell>
//                         <TableCell><Box display="flex" alignItems="center" gap={1.5}><Avatar sx={{ width: 34, height: 34, fontSize: 12, fontWeight: 700, bgcolor: "#7b1fa2" }}>{r.name ? nameInitials(r.name) : <Description fontSize="small" />}</Avatar><Box><Typography fontWeight={600} fontSize={13}>{r.name || <em style={{ color: "#9e9e9e" }}>Not extracted</em>}</Typography><Typography fontSize={11} color="text.secondary" noWrap sx={{ maxWidth: 160 }}>{r.original_name}</Typography></Box></Box></TableCell>
//                         <TableCell><Typography fontSize={12}>{r.current_role || "—"}</Typography><Box display="flex" flexWrap="wrap" gap={0.4} mt={0.3}>{(r.skills || "").split(",").filter(Boolean).slice(0, 2).map((s, i) => <Chip key={i} label={s.trim()} size="small" sx={{ fontSize: 9, height: 18, bgcolor: "#f3e5f5", color: "#7b1fa2" }} />)}</Box></TableCell>
//                         <TableCell sx={{ fontSize: 12 }}>{r.experience ? `${r.experience} yrs` : "—"}</TableCell>
//                         <TableCell>{r.linked_job_id ? <Box><Typography fontSize={12} color="#0277bd" fontWeight={600}>{r.linked_job_id}</Typography><Typography fontSize={11} color="text.secondary">{r.linked_job_title}</Typography>{r.client_name && <Typography fontSize={10} color="text.disabled">{r.client_name}</Typography>}</Box> : <Typography fontSize={12} color="text.disabled">Not assigned</Typography>}</TableCell>
//                         <TableCell><Chip label={r.parse_status || "pending"} size="small" color={PARSE_COLOR[r.parse_status] || "default"} sx={{ fontSize: 10, fontWeight: 700 }} /></TableCell>
//                         <TableCell><Chip label={r.status} size="small" color={RAW_STATUS_COLOR[r.status] || "default"} sx={{ fontSize: 11, fontWeight: 700 }} /></TableCell>
//                         <TableCell>
//                           <Box display="flex" gap={0.5}>
//                             <Tooltip title={r.filename ? "View PDF" : "No PDF attached"}><span><IconButton size="small" sx={{ color: r.filename ? "#c62828" : "#bdbdbd", cursor: r.filename ? "pointer" : "not-allowed" }} onClick={() => { if (r.filename) { setRawPdfDoc(r); setRawPdfOpen(true); } }}><PictureAsPdf fontSize="small" /></IconButton></span></Tooltip>
//                             {r.status !== "Converted" && <Tooltip title="Assign to Job"><IconButton size="small" sx={{ color: "#0277bd" }} onClick={() => openAssign(r)}><Work fontSize="small" /></IconButton></Tooltip>}
//                             {r.status !== "Converted" && <Tooltip title="Convert to full candidate"><IconButton size="small" sx={{ color: "#2e7d32" }} onClick={() => openConvert(r)}><PersonAdd fontSize="small" /></IconButton></Tooltip>}
//                             {r.status === "Converted" && <Tooltip title={`Converted → ${r.converted_resume_id}`}><IconButton size="small" sx={{ color: "#2e7d32" }} disableRipple><CheckCircle fontSize="small" /></IconButton></Tooltip>}
//                             {r.status !== "Converted" && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={async () => { await deleteRaw(r._id); loadRaw(); }}><Delete fontSize="small" /></IconButton></Tooltip>}
//                           </Box>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </Paper>
//             </Card>
//           )}
//         </>
//       )}

//       {/* ── PDF viewers ──────────────────────────────────────────────────────── */}
//       <PdfViewerDialog    open={pdfOpen}    onClose={() => setPdfOpen(false)}    candidate={selected} />
//       <RawPdfViewerDialog open={rawPdfOpen} onClose={() => setRawPdfOpen(false)} raw={rawPdfDoc} />

//       {/* ── Candidate Detail Dialog ──────────────────────────────────────────── */}
//       <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: "70vh" } }}>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>Candidate Details</DialogTitle>
//         {selected && (
//           <CandidateDetailContent candidate={selected} jobs={jobs} recruiters={recruiters}
//             onClose={() => setDetailOpen(false)}
//             onEdit={() => { setDetailOpen(false); openEdit(selected); }}
//             onViewPdf={() => { setDetailOpen(false); openPdf(selected); }} />
//         )}
//       </Dialog>

//       {/* ── AI Score Dialog ───────────────────────────────────────────────────── */}
//       <Dialog open={scoreOpen} onClose={() => setScoreOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 1.5 }}>
//           <Box display="flex" alignItems="center" justifyContent="space-between">
//             <Box display="flex" alignItems="center" gap={1.5}>
//               <Analytics sx={{ color: "#7b1fa2" }} />
//               <Box>
//                 <Typography fontWeight={700}>AI Match Score</Typography>
//                 <Typography fontSize={11} color="text.secondary">
//                   {scoreTarget?.name} vs {scoreData?.job_title || "…"}
//                 </Typography>
//               </Box>
//             </Box>
//             <IconButton size="small" onClick={() => setScoreOpen(false)}><CloseIcon fontSize="small" /></IconButton>
//           </Box>
//         </DialogTitle>

//         <DialogContent sx={{ pt: 2.5 }}>
//           {scoreLoading && (
//             <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={2}>
//               <CircularProgress size={48} sx={{ color: "#7b1fa2" }} />
//               <Typography color="text.secondary" fontSize={13}>Analysing candidate with AI…</Typography>
//             </Box>
//           )}

//           {!scoreLoading && scoreData && (() => {
//             const s = scoreData;
//             const verdictColor = {
//               "Strong match":   { bg: "#e8f5e9", color: "#1b5e20" },
//               "Good match":     { bg: "#e3f2fd", color: "#0d47a1" },
//               "Moderate match": { bg: "#fff8e1", color: "#e65100" },
//               "Weak match":     { bg: "#fce4ec", color: "#880e4f" },
//             }[s.verdict] || { bg: "#f5f5f5", color: "#424242" };

//             const ScoreBar = ({ label, value }) => (
//               <Box display="flex" alignItems="center" gap={1.5} mb={1.2}>
//                 <Typography fontSize={12} color="text.primary" sx={{ width: 130, flexShrink: 0 }}>{label}</Typography>
//                 <Box flex={1} height={6} bgcolor="#e0e0e0" borderRadius={4} overflow="hidden">
//                   <Box height="100%" borderRadius={4} bgcolor={barColor(value)} sx={{ width: `${value}%`, transition: "width 0.6s ease" }} />
//                 </Box>
//                 <Typography fontSize={12} fontWeight={600} sx={{ width: 32, textAlign: "right", color: barColor(value) }}>{value}</Typography>
//               </Box>
//             );

//             return (
//               <Box>
//                 {/* Overall score + verdict */}
//                 <Box display="flex" alignItems="center" gap={2.5} mb={2.5} pb={2} sx={{ borderBottom: "1px solid #e0e0e0" }}>
//                   <Box sx={{ width: 80, height: 80, borderRadius: "50%", border: `4px solid ${barColor(s.overall_score)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
//                     <Typography fontSize={22} fontWeight={700} color={barColor(s.overall_score)} lineHeight={1}>{s.overall_score}</Typography>
//                     <Typography fontSize={10} color="text.secondary">/100</Typography>
//                   </Box>
//                   <Box>
//                     <Typography fontSize={14} fontWeight={600} color="text.primary">{scoreTarget?.name}</Typography>
//                     <Typography fontSize={12} color="text.secondary" mt={0.3}>{scoreTarget?.current_role} · {scoreTarget?.experience} yrs</Typography>
//                     <Box display="inline-block" mt={0.8} px={1.5} py={0.4} borderRadius={20}
//                       sx={{ bgcolor: verdictColor.bg, color: verdictColor.color, fontSize: 12, fontWeight: 600 }}>
//                       {s.verdict}
//                     </Box>
//                   </Box>
//                 </Box>

//                 {/* Breakdown */}
//                 <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.6} mb={1.2}>Score breakdown</Typography>
//                 <ScoreBar label="Skills match"     value={s.skills_score}     />
//                 <ScoreBar label="Experience fit"   value={s.experience_score} />
//                 <ScoreBar label="Salary alignment" value={s.salary_score}     />
//                 <ScoreBar label="Notice period"    value={s.notice_score}     />
//                 <ScoreBar label="Location"         value={s.location_score}   />

//                 {/* Strengths */}
//                 {s.strengths?.length > 0 && (
//                   <Box mt={2} p={1.5} bgcolor="#e8f5e9" borderRadius={2} border="1px solid #a5d6a7">
//                     <Typography fontSize={11} fontWeight={700} color="#2e7d32" textTransform="uppercase" letterSpacing={0.5} mb={0.8}>Strengths</Typography>
//                     {s.strengths.map((g, i) => (
//                       <Box key={i} display="flex" alignItems="flex-start" gap={0.8} mb={0.5}>
//                         <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#2e7d32", mt: 0.6, flexShrink: 0 }} />
//                         <Typography fontSize={12} color="#1b5e20">{g}</Typography>
//                       </Box>
//                     ))}
//                   </Box>
//                 )}

//                 {/* Gaps */}
//                 {s.gaps?.length > 0 && (
//                   <Box mt={1.5} p={1.5} bgcolor="#fff8e1" borderRadius={2} border="1px solid #ffe082">
//                     <Typography fontSize={11} fontWeight={700} color="#e65100" textTransform="uppercase" letterSpacing={0.5} mb={0.8}>Gaps identified</Typography>
//                     {s.gaps.map((g, i) => (
//                       <Box key={i} display="flex" alignItems="flex-start" gap={0.8} mb={0.5}>
//                         <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#f57c00", mt: 0.6, flexShrink: 0 }} />
//                         <Typography fontSize={12} color="#bf360c">{g}</Typography>
//                       </Box>
//                     ))}
//                   </Box>
//                 )}

//                 {/* AI Summary */}
//                 <Box mt={1.5} p={1.5} bgcolor="#f5f5f5" borderRadius={2} border="0.5px solid #e0e0e0">
//                   <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={0.5}>AI summary</Typography>
//                   <Typography fontSize={12} color="text.primary" lineHeight={1.7}>{s.summary}</Typography>
//                 </Box>

//                 {s.scored_at && (
//                   <Typography fontSize={10} color="text.disabled" mt={1.5} textAlign="right">
//                     Scored {new Date(s.scored_at).toLocaleString("en-IN")}
//                   </Typography>
//                 )}
//               </Box>
//             );
//           })()}
//         </DialogContent>

//         <DialogActions sx={{ px: 3, pb: 2, borderTop: "1px solid #e0e0e0" }}>
//           <Button onClick={reScore} disabled={scoreLoading} size="small" startIcon={scoreLoading ? <CircularProgress size={14} /> : null}>
//             Re-score
//           </Button>
//           <Box flex={1} />
//           <Button onClick={() => setScoreOpen(false)}>Close</Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── Assign to Job ─────────────────────────────────────────────────────── */}
//       <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1}><Work color="primary" />Assign to Job</Box></DialogTitle>
//         <DialogContent sx={{ pt: 3 }}>
//           {assignTarget && <Box mb={2.5} p={1.5} bgcolor="#f3e5f5" borderRadius={2}><Typography fontSize={12} color="text.secondary">Assigning resume:</Typography><Typography fontWeight={700}>{assignTarget.name || assignTarget.original_name}</Typography><Typography fontSize={12} color="text.secondary">{assignTarget.raw_id}</Typography></Box>}
//           <TextField select fullWidth size="small" label="Select Job *" value={assignJobId} onChange={e => setAssignJobId(e.target.value)}>
//             <MenuItem value="">— Choose a job posting —</MenuItem>
//             {jobs.map(j => <MenuItem key={j._id} value={j._id}><Box><Typography fontSize={13} fontWeight={600}>{j.job_id} — {j.title}</Typography>{j.client_name && <Typography fontSize={11} color="text.secondary">{j.client_name}</Typography>}</Box></MenuItem>)}
//           </TextField>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//           <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
//           <Button variant="contained" onClick={handleAssign} disabled={!assignJobId || assignSaving} startIcon={assignSaving ? <CircularProgress size={16} color="inherit" /> : <Work />}>{assignSaving ? "Assigning…" : "Assign"}</Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── Convert to Candidate ─────────────────────────────────────────────── */}
//       <Dialog open={convertOpen} onClose={() => setConvertOpen(false)} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1}><PersonAdd color="success" />Convert to Candidate</Box></DialogTitle>
//         <form onSubmit={handleConvert}>
//           <DialogContent sx={{ pt: 3 }}>
//             {convertTarget && <Box mb={2} p={1.5} bgcolor="#e8f5e9" borderRadius={2} display="flex" alignItems="center" gap={1.5}><SwapHoriz color="success" /><Box><Typography fontSize={12} color="text.secondary">Converting stored resume to full candidate</Typography><Typography fontWeight={700} fontSize={13}>{convertTarget.raw_id} — {convertTarget.original_name}</Typography></Box></Box>}
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Full Name *" name="name" value={convertData.name} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" required type="email" label="Email *" name="email" value={convertData.email} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" name="phone" value={convertData.phone} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Location" name="location" value={convertData.location} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Role" name="current_role" value={convertData.current_role} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Company" name="current_company" value={convertData.current_company} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Experience (yrs)" name="experience" value={convertData.experience} onChange={handleConvertChange} inputProps={{ min: 0 }} /></Grid>
//               <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Source" name="source" value={convertData.source} onChange={handleConvertChange}>{SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Status" name="status" value={convertData.status} onChange={handleConvertChange}>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12}><TextField fullWidth multiline rows={2} size="small" label="Skills (comma-separated)" name="skills" value={convertData.skills} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Current Salary (₹)" name="current_salary" value={convertData.current_salary} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={convertData.expected_salary} onChange={handleConvertChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Notice Period" name="notice_period" value={convertData.notice_period} onChange={handleConvertChange}>{NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12}><TextField select fullWidth size="small" label="Link to Job" name="linked_job_id" value={convertData.linked_job_mongo_id || ""} onChange={handleConvertChange}><MenuItem value="">No Job Linked</MenuItem>{jobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} — {j.title}{j.client_name ? ` (${j.client_name})` : ""}</MenuItem>)}</TextField></Grid>
//             </Grid>
//             <TextField fullWidth multiline rows={2} size="small" label="Notes" name="notes" value={convertData.notes} onChange={handleConvertChange} />
//             {convertError && <Alert severity="error" sx={{ mt: 2 }}>{convertError}</Alert>}
//           </DialogContent>
//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//             <Button onClick={() => setConvertOpen(false)}>Cancel</Button>
//             <Button type="submit" variant="contained" color="success" disabled={convertSaving} startIcon={convertSaving ? <CircularProgress size={16} color="inherit" /> : <PersonAdd />}>{convertSaving ? "Converting…" : "Convert to Candidate"}</Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//       {/* ── Bulk Review Dialog ────────────────────────────────────────────────── */}
//       <Dialog open={bulkOpen} onClose={closeBulk} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: "80vh" } }}>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1.5}><CloudUpload color="primary" /><Box><Typography fontWeight={700} fontSize="1.1rem">Review &amp; Save Candidates</Typography><Typography fontSize={12} color="text.secondary">AI-extracted details pre-filled · PDFs already saved · review and confirm each</Typography></Box></Box></DialogTitle>
//         <DialogContent sx={{ p: 0 }}>
//           {!bulkDone && currentEntry && (
//             <Box>
//               <Box sx={{ borderBottom: "1px solid #e0e0e0", px: 3, pt: 2 }}>
//                 <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
//                   {bulkFiles.map((entry, i) => <Chip key={i} label={`${i + 1}. ${entry.file.name.replace(".pdf", "").slice(0, 22)}`} onClick={() => setBulkStep(i)} color={entry.saved ? "success" : i === bulkStep ? "primary" : "default"} variant={i === bulkStep ? "filled" : "outlined"} size="small" icon={entry.saved ? <CheckCircle fontSize="small" /> : undefined} sx={{ cursor: "pointer", fontWeight: i === bulkStep ? 700 : 400 }} />)}
//                 </Box>
//                 <Box display="flex" alignItems="center" gap={1} pb={1.5} flexWrap="wrap">
//                   <Typography fontSize={12} color="text.secondary">{savedCount} of {bulkFiles.length} saved &bull; Reviewing: <strong>{currentEntry.file.name}</strong></Typography>
//                   {currentEntry.status === "error" && <Chip label="Fill manually" size="small" color="warning" sx={{ fontSize: 10 }} />}
//                   {currentEntry.status === "done" && !currentEntry.saved && <Chip label="AI-parsed ✓" size="small" color="info" sx={{ fontSize: 10 }} />}
//                   {currentEntry.file_id && <Chip label="PDF stored ✓" size="small" color="success" variant="outlined" sx={{ fontSize: 10 }} />}
//                 </Box>
//               </Box>
//               <Box p={3}>
//                 {currentEntry.saved ? (
//                   <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={2}><CheckCircle color="success" sx={{ fontSize: 56 }} /><Typography fontWeight={700} color="success.main">Saved successfully!</Typography>{bulkStep < bulkFiles.length - 1 && <Button variant="outlined" onClick={() => setBulkStep(s => s + 1)}>Next Resume →</Button>}</Box>
//                 ) : (
//                   <>
//                     <Grid container spacing={2} mb={2}>
//                       <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Full Name" name="name" value={currentEntry.formData.name} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required type="email" label="Email" name="email" value={currentEntry.formData.email} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Phone" name="phone" value={currentEntry.formData.phone} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Location" name="location" value={currentEntry.formData.location} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Role" name="current_role" value={currentEntry.formData.current_role} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Company" name="current_company" value={currentEntry.formData.current_company} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Experience (yrs)" name="experience" value={currentEntry.formData.experience} onChange={handleBulkChange} inputProps={{ min: 0 }} /></Grid>
//                       <Grid item xs={12} sm={4}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Source" name="source" value={currentEntry.formData.source} onChange={handleBulkChange}>{SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//                       <Grid item xs={12} sm={4}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Status" name="status" value={currentEntry.formData.status} onChange={handleBulkChange}>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//                       <Grid item xs={12}><TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={3} size="small" label="Skills (comma-separated)" name="skills" value={currentEntry.formData.skills} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Current Salary (₹)" name="current_salary" value={currentEntry.formData.current_salary} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={currentEntry.formData.expected_salary} onChange={handleBulkChange} /></Grid>
//                       <Grid item xs={12} sm={4}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Notice Period" name="notice_period" value={currentEntry.formData.notice_period} onChange={handleBulkChange}>{NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
//                       <Grid item xs={12}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Link to Job" name="linked_job_id" value={currentEntry.formData.linked_job_id} onChange={handleBulkChange}><MenuItem value="">No Job Linked</MenuItem>{jobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} - {j.title}</MenuItem>)}</TextField></Grid>
//                     </Grid>
//                     <TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={2} size="small" label="Notes" name="notes" value={currentEntry.formData.notes} onChange={handleBulkChange} />
//                     {currentEntry.errorMsg && <Alert severity="warning" sx={{ mt: 2 }}>{currentEntry.errorMsg}</Alert>}
//                   </>
//                 )}
//               </Box>
//             </Box>
//           )}
//           {bulkDone && (
//             <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
//               <Avatar sx={{ width: 80, height: 80, bgcolor: "#e8f5e9" }}><Done sx={{ fontSize: 48, color: "#2e7d32" }} /></Avatar>
//               <Typography variant="h5" fontWeight={800} color="success.main">All Done!</Typography>
//               <Typography color="text.secondary">{savedCount} of {bulkFiles.length} candidate{savedCount !== 1 ? "s" : ""} saved.</Typography>
//               <Button variant="contained" onClick={closeBulk}>Back to Resume Bank</Button>
//             </Box>
//           )}
//         </DialogContent>
//         {!bulkDone && currentEntry && !currentEntry.saved && (
//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0", gap: 1 }}>
//             <Button disabled={bulkStep === 0} onClick={() => setBulkStep(s => s - 1)} startIcon={<NavigateBefore />}>Previous</Button>
//             <Box flex={1} />
//             <Button onClick={handleBulkSkip} color="inherit">Skip</Button>
//             <Button variant="contained" onClick={handleBulkSave} disabled={bulkSaving || !currentEntry.formData.name || !currentEntry.formData.email} endIcon={bulkSaving ? <CircularProgress size={16} color="inherit" /> : <Done />}>{bulkSaving ? "Saving…" : "Save & Next"}</Button>
//           </DialogActions>
//         )}
//       </Dialog>

//       {/* ── Add / Edit Candidate Dialog ──────────────────────────────────────── */}
//       <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>{selected ? "Edit Candidate" : `Add New Candidate${pickedClient ? ` — ${pickedClient.company_name}` : ""}`}</DialogTitle>
//         <form onSubmit={handleSave}>
//           <DialogContent sx={{ pt: 3 }}>
//             {!selected && pickedClient && (
//               <Box mb={2} px={2} py={1.5} bgcolor="#e3f2fd" borderRadius={2} display="flex" alignItems="center" justifyContent="space-between">
//                 <Box display="flex" alignItems="center" gap={1.5}><Business sx={{ color: "#1565c0" }} /><Box><Typography fontSize={11} color="text.secondary">Adding candidate for</Typography><Typography fontWeight={700} color="primary.dark">{pickedClient.company_name}</Typography></Box></Box>
//                 <Chip label="Change client" size="small" variant="outlined" onClick={() => { setFormOpen(false); setClientSelectOpen(true); }} sx={{ fontSize: 11, cursor: "pointer" }} />
//               </Box>
//             )}
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Full Name" name="name" value={formData.name} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required type="email" label="Email" name="email" value={formData.email} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Phone" name="phone" value={formData.phone} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Location" name="location" value={formData.location} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Role" name="current_role" value={formData.current_role} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Company" name="current_company" value={formData.current_company} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Experience (years)" name="experience" value={formData.experience} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
//               <Grid item xs={12} sm={6}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Source" name="source" value={formData.source} onChange={handleChange}>{SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12}><TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={2} label="Skills (comma-separated)" name="skills" value={formData.skills} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Current Salary (₹)" name="current_salary" value={formData.current_salary} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={formData.expected_salary} onChange={handleChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Notice Period" name="notice_period" value={formData.notice_period} onChange={handleChange}>{NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12} sm={6}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Status" name="status" value={formData.status} onChange={handleChange}>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12} sm={6}>
//                 <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Linked Job" name="linked_job_id" value={formData.linked_job_mongo_id || ""} onChange={handleChange}>
//                   <MenuItem value="">No Job Linked</MenuItem>
//                   {formClientJobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} — {j.title}</MenuItem>)}
//                 </TextField>
//               </Grid>
//             </Grid>
//             <TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={3} size="small" label="Notes" name="notes" value={formData.notes} onChange={handleChange} />
//             <Divider sx={{ my: 2 }} />
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Resume File (PDF)</Typography>
//             <Box onClick={() => formFileRef.current?.click()} sx={{ border: addFile ? "2px solid #2e7d32" : "2px dashed #90caf9", borderRadius: 2, p: 2, display: "flex", alignItems: "center", gap: 2, cursor: "pointer", bgcolor: addFile ? "#f1f8e9" : "#f8fbff", "&:hover": { bgcolor: addFile ? "#e8f5e9" : "#e3f2fd", borderColor: addFile ? "#1b5e20" : "#1565c0" } }}>
//               <PictureAsPdf sx={{ fontSize: 32, color: addFile ? "#2e7d32" : "#90caf9", flexShrink: 0 }} />
//               <Box flex={1}>{addFile ? <><Typography fontWeight={700} fontSize={13} color="success.dark">{addFile.name}</Typography><Typography fontSize={11} color="text.secondary">{(addFile.size / 1024).toFixed(0)} KB · Click to replace</Typography></> : <><Typography fontWeight={600} fontSize={13} color="primary.dark">{selected?.resume_file ? "Replace resume PDF" : "Attach resume PDF (optional)"}</Typography><Typography fontSize={11} color="text.secondary">{selected?.resume_file ? `Current file: ${selected.resume_file} · click to replace` : "Click to browse · PDF only"}</Typography></>}</Box>
//               {addFile && <IconButton size="small" onClick={e => { e.stopPropagation(); setAddFile(null); }}><CloseIcon fontSize="small" /></IconButton>}
//               <input ref={formFileRef} type="file" accept=".pdf,application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) setAddFile(f); e.target.value = ""; }} />
//             </Box>
//           </DialogContent>
//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//             <Button onClick={() => setFormOpen(false)}>Cancel</Button>
//             <Button type="submit" variant="contained" disabled={saving}>{saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}{selected ? "Update" : "Add Candidate"}</Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//       {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
//       <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
//         <DialogTitle fontWeight={700}>Delete Candidate</DialogTitle>
//         <DialogContent><Typography>Are you sure you want to delete <strong>{selected?.name}</strong>?</Typography>{selected?.resume_file && <Alert severity="warning" sx={{ mt: 1.5 }}>The uploaded resume PDF will also be permanently deleted.</Alert>}</DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="contained" color="error" onClick={handleDelete}>Delete</Button></DialogActions>
//       </Dialog>

//       {/* ── Client Select Dialog ──────────────────────────────────────────────── */}
//       <Dialog open={clientSelectOpen} onClose={() => setClientSelectOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1}><Business color="primary" />Select Client for this Candidate</Box></DialogTitle>
//         <DialogContent sx={{ pt: 2.5, pb: 1 }}>
//           <Typography fontSize={13} color="text.secondary" mb={2}>Choose the client this candidate is being added for. Their job postings will be pre-loaded in the next step.</Typography>
//           <Box display="flex" flexDirection="column" gap={1.5}>
//             {clients.map(c => {
//               const clientJobs = jobs.filter(j => j.client_id === c._id || j.client_name === c.company_name);
//               return (
//                 <Box key={c._id} onClick={() => handleClientPicked(c)} sx={{ p: 2, borderRadius: 2, border: "1.5px solid #e0e0e0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s", "&:hover": { bgcolor: "#e3f2fd", borderColor: "#1565c0" } }}>
//                   <Box display="flex" alignItems="center" gap={1.5}><Avatar sx={{ width: 40, height: 40, bgcolor: "#1a237e", fontSize: 14, fontWeight: 700 }}>{c.company_name?.[0]?.toUpperCase() || "C"}</Avatar><Box><Typography fontWeight={700} fontSize={14}>{c.company_name}</Typography><Typography fontSize={12} color="text.secondary">{clientJobs.length} active job{clientJobs.length !== 1 ? "s" : ""}{clientJobs.length > 0 && ` · ${clientJobs.slice(0, 2).map(j => j.job_id).join(", ")}${clientJobs.length > 2 ? "…" : ""}`}</Typography></Box></Box>
//                   <ArrowForward fontSize="small" sx={{ color: "text.disabled" }} />
//                 </Box>
//               );
//             })}
//             {clients.length === 0 && <Box p={3} textAlign="center"><Typography color="text.secondary" fontSize={13}>No clients found. Add a client first.</Typography></Box>}
//           </Box>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0", mt: 1 }}><Button onClick={() => setClientSelectOpen(false)}>Cancel</Button></DialogActions>
//       </Dialog>

//       {/* ── Manual Raw Resume Dialog ──────────────────────────────────────────── */}
//       <Dialog open={manualRawOpen} onClose={() => setManualRawOpen(false)} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1}><EditNote color="secondary" />Add Resume Manually</Box></DialogTitle>
//         <form onSubmit={handleManualRawSave}>
//           <DialogContent sx={{ pt: 3 }}>
//             <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Resume File (PDF) — Optional</Typography>
//             <Box onClick={() => manualFileRef.current?.click()} sx={{ border: manualRawFile ? "2px solid #7b1fa2" : "2px dashed #ce93d8", borderRadius: 2, p: 2, display: "flex", alignItems: "center", gap: 2, cursor: "pointer", bgcolor: manualRawFile ? "#f3e5f5" : "#fdf6ff", mb: 3, "&:hover": { bgcolor: "#f3e5f5", borderColor: "#7b1fa2" } }}>
//               <PictureAsPdf sx={{ fontSize: 32, color: manualRawFile ? "#7b1fa2" : "#ce93d8", flexShrink: 0 }} />
//               <Box flex={1}>{manualRawFile ? <><Typography fontWeight={700} fontSize={13} color="#4a148c">{manualRawFile.name}</Typography><Typography fontSize={11} color="text.secondary">{(manualRawFile.size / 1024).toFixed(0)} KB · Click to replace</Typography></> : <><Typography fontWeight={600} fontSize={13} color="#7b1fa2">Attach resume PDF (optional)</Typography><Typography fontSize={11} color="text.secondary">Click to browse or drag &amp; drop · PDF only</Typography></>}</Box>
//               {manualRawFile && <IconButton size="small" onClick={e => { e.stopPropagation(); setManualRawFile(null); }}><CloseIcon fontSize="small" /></IconButton>}
//               <input ref={manualFileRef} type="file" accept=".pdf,application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) setManualRawFile(f); e.target.value = ""; }} />
//             </Box>
//             <Divider sx={{ my: 2 }} />
//             <Grid container spacing={2} mb={2}>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Full Name *" name="name" value={manualRawData.name} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="email" label="Email" name="email" value={manualRawData.email} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" name="phone" value={manualRawData.phone} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Location" name="location" value={manualRawData.location} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Role" name="current_role" value={manualRawData.current_role} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Company" name="current_company" value={manualRawData.current_company} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Experience (yrs)" name="experience" value={manualRawData.experience} onChange={handleManualRawChange} inputProps={{ min: 0 }} /></Grid>
//               <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Notice Period" name="notice_period" value={manualRawData.notice_period} onChange={handleManualRawChange}>{NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
//               <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={manualRawData.expected_salary} onChange={handleManualRawChange} /></Grid>
//               <Grid item xs={12}><TextField fullWidth multiline rows={2} size="small" label="Skills (comma-separated)" name="skills" value={manualRawData.skills} onChange={handleManualRawChange} /></Grid>
//             </Grid>
//             <Divider sx={{ my: 2 }} />
//             <TextField select fullWidth size="small" label="Link to Job" name="linked_job_id" value={manualRawData.linked_job_mongo_id || ""} onChange={handleManualRawChange} sx={{ mb: 2 }}>
//               <MenuItem value="">No Job Linked</MenuItem>
//               {jobs.map(j => <MenuItem key={j._id} value={j._id}><Box><Typography fontSize={13} fontWeight={600}>{j.job_id} — {j.title}</Typography>{j.client_name && <Typography fontSize={11} color="text.secondary">{j.client_name}</Typography>}</Box></MenuItem>)}
//             </TextField>
//             <TextField fullWidth multiline rows={2} size="small" label="Notes" name="notes" value={manualRawData.notes} onChange={handleManualRawChange} />
//             {manualRawError && <Alert severity="error" sx={{ mt: 2 }}>{manualRawError}</Alert>}
//           </DialogContent>
//           <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
//             <Button onClick={() => setManualRawOpen(false)}>Cancel</Button>
//             <Button type="submit" variant="contained" color="secondary" disabled={manualRawSaving || !manualRawData.name} startIcon={manualRawSaving ? <CircularProgress size={16} color="inherit" /> : <EditNote />}>{manualRawSaving ? "Saving…" : "Add to Stored Resumes"}</Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//     </Box>
//   );
// }





















import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Button, TextField,
  MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  InputAdornment, Divider, LinearProgress, Grid, Tabs, Tab, Badge,
} from "@mui/material";
import {
  Add, Search, Edit, Delete, Visibility,
  Description, Star, People, NewReleases, PersonOff,
  CloudUpload, CheckCircle, Done, NavigateBefore,
  Close as CloseIcon, PictureAsPdf, OpenInNew, Business,
  Inventory2, PersonAdd, Work, SwapHoriz,
  EditNote, ArrowForward, FilterList, Analytics,
  Notifications, Assignment,AccountTree, Chat, Schedule, VideoCall,
} from "@mui/icons-material";

import CandidateDetailContent, { nameInitials, fmtSalary, STATUS_COLOR, STAGE_COLOR } from "./Candidatedetailcontent";
import ExamResultsDialog from "./Examresultsview";
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
// ── client apis ────────────────────────────────────────────────────────────
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

  // ── raw  resumes adding by recruiter ────────────────────────────────────────────────────────────
const getRawResumes = (p = {}) => {
  const qs = new URLSearchParams(p).toString();
  return fetch(`${BASE}/resumes/raw/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
};
const uploadRawResume = (file_b64, file_name) =>
  fetch(`${BASE}/resumes/raw/upload`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify({ file_b64, file_name }),
  }).then(handle);
const assignRawToJob = (id, payload) =>
  fetch(`${BASE}/resumes/raw/${id}/assign-job`, {
    method: "PUT", headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handle);
const convertRaw = (id, payload) =>
  fetch(`${BASE}/resumes/raw/${id}/convert`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handle);
const deleteRaw = (id) =>
  fetch(`${BASE}/resumes/raw/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
const createRawManual = (payload) =>
  fetch(`${BASE}/resumes/raw/manual`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handle);

// ── Exam Apis ────────────────────────────────────────────────────────────

  const sendExam = (payload) =>
    fetch(`${BASE}/exams/send`, {
      method: "POST", headers: getHeaders(), body: JSON.stringify(payload),
    }).then(handle);
  const getAllExams = () =>
      fetch(`${BASE}/exams/`, { headers: getHeaders() }).then(handle);


// ── Scoring APIs ──────────────────────────────────────────────────────────────
const scoreCandidate = (resume_id, job_id) =>
  fetch(`${BASE}/score/candidate`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify({ resume_id, job_id }),
  }).then(handle);

const getCachedScore = (resume_id, job_id) =>
  fetch(`${BASE}/score/candidate?resume_id=${resume_id}&job_id=${job_id}`, {
    headers: getHeaders(),
  }).then(r => r.ok ? r.json() : null) 


// ── Tracking APIs (for detail view) ──────────────────────────────────────────
const getTrackingByResume = (resume_id) =>
  fetch(`${BASE}/tracking/by-resume/${resume_id}`, { headers: getHeaders() }).then(handle);
const createTrackingEntry = (payload) =>
  fetch(`${BASE}/tracking/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
const updateTrackingEntry = (id, payload) =>
  fetch(`${BASE}/tracking/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
const addTrackingInterview = (id, payload) =>
  fetch(`${BASE}/tracking/${id}/interview`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);




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
  { label: "All Experience", min: "",   max: ""  },
  { label: "0–2 years",      min: "0",  max: "2" },
  { label: "3–5 years",      min: "3",  max: "5" },
  { label: "6–10 years",     min: "6",  max: "10"},
  { label: "10+ years",      min: "10", max: ""  },
];

const RAW_STATUS_COLOR = { Stored: "default", Assigned: "primary", Converted: "success" };
const PARSE_COLOR = { parsed: "success", failed: "warning", pending: "default", manual: "info" };

const EMPTY_FORM = {
  name: "", email: "", phone: "", current_role: "", current_company: "",
  experience: "", skills: "", location: "", current_salary: "",
  expected_salary: "", notice_period: "30 days", source: "LinkedIn",
  status: "New", linked_job_id: "", linked_job_mongo_id: "", linked_job_title: "", notes: "",
};
const EMPTY_CONVERT = {
  name: "", email: "", phone: "", current_role: "", current_company: "",
  experience: "", skills: "", location: "", current_salary: "",
  expected_salary: "", notice_period: "30 days", source: "Direct",
  status: "New", linked_job_id: "", linked_job_mongo_id: "", linked_job_title: "", notes: "",
};
const EMPTY_MANUAL_RAW = {
  name: "", email: "", phone: "", current_role: "", current_company: "",
  experience: "", skills: "", location: "", current_salary: "",
  expected_salary: "", notice_period: "30 days",
  linked_job_id: "", linked_job_mongo_id: "", linked_job_title: "", notes: "",
};
const daysUntilExpiry = (createdAt) => {
  if (!createdAt) return null;
  const expiry = new Date(new Date(createdAt).getTime() + 90 * 24 * 60 * 60 * 1000);
  return Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
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
const InlineUploadZone = ({
  onFiles, fileRef,
  label    = "Drag & drop PDF resumes here to upload",
  sublabel = "AI will auto-extract candidate details · Multiple files supported · PDF only",
}) => {
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
        <Typography fontWeight={700} color="primary.dark" fontSize="0.95rem">{label}</Typography>
        <Typography fontSize={12} color="text.secondary" mt={0.3}>{sublabel}</Typography>
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
            {allDone && <Button variant="contained" size="small" onClick={onReview} startIcon={<Done />}>Review &amp; Save</Button>}
            <IconButton size="small" onClick={onClear}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={0.8}>
          {files.map((entry, i) => (
            <Box key={i} display="flex" alignItems="center" gap={1.5} sx={{ p: 1, bgcolor: "#f5f7fa", borderRadius: 1.5 }}>
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
              <Typography fontSize={11} color="text.secondary">{candidate?.resume_id} · {candidate?.current_role}</Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            {blobUrl && <Tooltip title="Download PDF"><IconButton size="small" onClick={handleDownload}><OpenInNew fontSize="small" /></IconButton></Tooltip>}
            <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
        {fetching && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}><CircularProgress size={40} /><Typography color="text.secondary" fontSize={14}>Loading resume…</Typography></Box>}
        {!fetching && fetchErr && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2} p={3}><PictureAsPdf sx={{ fontSize: 72, color: "#ef9a9a" }} /><Typography color="error" fontWeight={600}>Could not load PDF</Typography><Typography fontSize={13} color="text.secondary">{fetchErr}</Typography></Box>}
        {!fetching && !fetchErr && !candidate?.resume_file && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}><PictureAsPdf sx={{ fontSize: 72, color: "#bdbdbd" }} /><Typography color="text.secondary" fontWeight={600}>No resume file for this candidate</Typography></Box>}
        {!fetching && blobUrl && <iframe src={blobUrl} title={`${candidate?.name} Resume`} style={{ width: "100%", height: "100%", border: "none" }} />}
      </DialogContent>
    </Dialog>
  );
};

// ── Raw PDF Viewer Dialog ─────────────────────────────────────────────────────
const RawPdfViewerDialog = ({ open, onClose, raw }) => {
  const [blobUrl,  setBlobUrl]  = React.useState(null);
  const [fetching, setFetching] = React.useState(false);
  const [fetchErr, setFetchErr] = React.useState("");

  React.useEffect(() => {
    if (!open || !raw?._id) return;
    let objectUrl = null;
    setFetching(true); setFetchErr("");
    fetch(`${BASE}/resumes/raw/${raw._id}/file`, { headers: getHeaders() })
      .then(res => { if (!res.ok) throw new Error(`Server returned ${res.status}`); return res.blob(); })
      .then(blob => { objectUrl = URL.createObjectURL(blob); setBlobUrl(objectUrl); })
      .catch(err => setFetchErr(err.message || "Failed to load PDF"))
      .finally(() => setFetching(false));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); setBlobUrl(null); setFetchErr(""); };
  }, [open, raw?._id]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { height: "92vh", display: "flex", flexDirection: "column" } }}>
      <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", py: 1.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <PictureAsPdf color="error" />
            <Box>
              <Typography fontWeight={700}>{raw?.name || raw?.original_name} — Stored Resume</Typography>
              <Typography fontSize={11} color="text.secondary">{raw?.raw_id} · {raw?.current_role || "Role not extracted"}</Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
        {fetching && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}><CircularProgress size={40} /><Typography color="text.secondary" fontSize={14}>Loading resume…</Typography></Box>}
        {!fetching && fetchErr && <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}><PictureAsPdf sx={{ fontSize: 72, color: "#ef9a9a" }} /><Typography color="error" fontWeight={600}>{fetchErr}</Typography></Box>}
        {!fetching && blobUrl && <iframe src={blobUrl} title="Stored Resume" style={{ width: "100%", height: "100%", border: "none" }} />}
      </DialogContent>
    </Dialog>
  );
};




function ScheduleInterviewCard({ tracking, candidate, onScheduled }) {
  const BASE         = process.env.REACT_APP_API_BASE_URL;
  const getHeaders   = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
  });

  const [open,    setOpen]    = React.useState(false);
  const [saving,  setSaving]  = React.useState(false);
  const [result,  setResult]  = React.useState(null);
  const [error,   setError]   = React.useState("");
  const [form,    setForm]    = React.useState({
    interviewer_name:  "",
    interviewer_email: "",
    candidate_email:   candidate?.email || "",
    interview_date:    new Date().toISOString().split("T")[0],
    interview_time:    "10:00",
    duration_minutes:  60,
    interview_type:    "Video",
    timezone:          "Asia/Kolkata",
    notes:             "",
  });

  // Upcoming schedules
  const upcoming = (tracking?.scheduled_interviews || [])
    .filter(s => s.status === "Scheduled")
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch(
        `${BASE}/tracking/${tracking._id}/schedule`,
        {
          method:  "POST",
          headers: getHeaders(),
          body:    JSON.stringify({ ...form, stage: tracking.current_stage }),
        }
      ).then(r => r.json());
      if (res.success) {
        setResult(res);
        onScheduled?.();
      } else {
        setError(res.message || "Failed to schedule");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <Schedule sx={{ fontSize: 18, color: "#0277bd" }} />
            <Typography fontSize={13} fontWeight={700}>
              Schedule Interview
            </Typography>
            {upcoming.length > 0 && (
              <Chip label={`${upcoming.length} upcoming`} size="small"
                sx={{ bgcolor: "#e3f2fd", color: "#0277bd", fontSize: 10 }} />
            )}
          </Box>
          <Button size="small" variant="outlined" onClick={() => { setOpen(true); setResult(null); setError(""); }}
            sx={{ fontSize: 11 }}>
            + Schedule
          </Button>
        </Box>

        {/* Upcoming list */}
        {upcoming.length > 0 ? (
          <Box display="flex" flexDirection="column" gap={1}>
            {upcoming.slice(0, 2).map((s, i) => (
              <Box key={i} sx={{ p: 1.2, bgcolor: "#e3f2fd", borderRadius: 1.5,
                display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography fontSize={12} fontWeight={700} color="#1a237e">
                    {new Date(s.scheduled_at).toLocaleDateString("en-IN", {
                      weekday: "short", day: "2-digit", month: "short"
                    })} at{" "}
                    {new Date(s.scheduled_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </Typography>
                  <Typography fontSize={11} color="text.secondary">
                    {s.stage} · {s.interview_type} · {s.interviewer_name}
                  </Typography>
                </Box>
                {s.meeting_link && (
                  <IconButton size="small"
                    onClick={() => window.open(s.meeting_link, "_blank")}>
                    <VideoCall sx={{ fontSize: 16, color: "#0277bd" }} />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography fontSize={12} color="text.disabled">
            No interviews scheduled yet.
          </Typography>
        )}
      </CardContent>

      {/* Schedule Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0",
          borderTop: "4px solid #0277bd" }}>
          <Typography fontWeight={700}>Schedule Interview</Typography>
          <Typography fontSize={12} color="text.secondary">
            {candidate?.name} · {tracking?.current_stage}
          </Typography>
        </DialogTitle>

        {result ? (
          <>
            <DialogContent sx={{ pt: 3 }}>
              <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={2}>
                <CheckCircle sx={{ fontSize: 64, color: "#2e7d32" }} />
                <Typography fontWeight={700} color="success.dark" fontSize={16}>
                  Interview Scheduled!
                </Typography>
                <Box width="100%" p={2} bgcolor="#e8f5e9" borderRadius={2}>
                  <Typography fontSize={12} color="text.secondary">
                    📧 Candidate: {result.candidate_email_sent ? "✅ Email sent" : "❌ Not sent"}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">
                    📧 Interviewer: {result.interviewer_email_sent ? "✅ Email sent" : "❌ Not sent"}
                  </Typography>
                </Box>
                {result.meeting_link && (
                  <Box width="100%" p={1.5} bgcolor="#e3f2fd" borderRadius={2}
                    display="flex" alignItems="center" gap={1}>
                    <VideoCall sx={{ color: "#0277bd" }} />
                    <Typography fontSize={12} color="#0277bd" flex={1} noWrap>
                      {result.meeting_link}
                    </Typography>
                    <IconButton size="small"
                      onClick={() => window.open(result.meeting_link, "_blank")}>
                      <OpenInNew sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button variant="contained" onClick={() => { setOpen(false); setResult(null); }}>
                Done
              </Button>
            </DialogActions>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 2.5 }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" required label="Interviewer Name"
                    value={form.interviewer_name}
                    onChange={e => setForm(p => ({ ...p, interviewer_name: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Interviewer Email"
                    type="email" value={form.interviewer_email}
                    onChange={e => setForm(p => ({ ...p, interviewer_email: e.target.value }))}
                    helperText="Feedback link will be emailed" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Candidate Email"
                    type="email" value={form.candidate_email}
                    onChange={e => setForm(p => ({ ...p, candidate_email: e.target.value }))}
                    helperText="Interview invite will be sent" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" required label="Date" type="date"
                    value={form.interview_date}
                    onChange={e => setForm(p => ({ ...p, interview_date: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split("T")[0] }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" required label="Time" type="time"
                    value={form.interview_time}
                    onChange={e => setForm(p => ({ ...p, interview_time: e.target.value }))}
                    InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Duration (mins)" type="number"
                    value={form.duration_minutes}
                    onChange={e => setForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))}
                    inputProps={{ min: 15, step: 15 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth size="small" label="Type"
                    value={form.interview_type}
                    onChange={e => setForm(p => ({ ...p, interview_type: e.target.value }))}>
                    {["Video","Phone","In-Person","Panel"].map(t => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {form.interview_type === "Video" && (
                  <Grid item xs={12}>
                    <Box p={1.5} bgcolor="#e8f5e9" borderRadius={1.5}
                      display="flex" alignItems="center" gap={1}>
                      <VideoCall sx={{ color: "#34a853", fontSize: 18 }} />
                      <Typography fontSize={12} color="#1e7e34">
                        Google Meet link will be auto-generated and emailed.
                      </Typography>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField fullWidth size="small" multiline rows={2} label="Notes (optional)"
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Schedule />}
                sx={{ bgcolor: "#0277bd" }}>
                {saving ? "Scheduling…" : "Schedule & Send Invites"}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </Card>
  );
}







// ═════════════════════════════════════════════════════════════════════════════
//  Main Component
// ═════════════════════════════════════════════════════════════════════════════
export default function Resumes() {
  const navigate = useNavigate();
  const location = useLocation();
  // ── Role detection ─────────────────────────────────────────────────────────
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const isHR        = currentUser?.role === "hr";

  // ── Client filter from URL ─────────────────────────────────────────────────
  const _qp = new URLSearchParams(location.search);
  const [urlClientId,    setUrlClientId]    = useState(_qp.get("client")      || "");
  const [urlClientName,  setUrlClientName]  = useState(_qp.get("client_name") || "");
  const [isClientLocked, setIsClientLocked] = useState(!!_qp.get("client"));
  const [urlJobId,       setUrlJobId]       = useState(_qp.get("job")         || "");
  const [urlJobTitle,    setUrlJobTitle]    = useState(_qp.get("job_title")   || "");
  const [isJobLocked,    setIsJobLocked]    = useState(!!_qp.get("job"));

  // useEffect(() => {
  //   const p     = new URLSearchParams(location.search);
  //   const cid   = p.get("client")      || "";
  //   const cname = p.get("client_name") || "";
  //   const jid   = p.get("job")         || "";
  //   const jtitle = p.get("job_title")  || "";
  //   setUrlClientId(cid); setUrlClientName(cname); setIsClientLocked(!!cid);
  //   setClientF(cid);
  //   setUrlJobId(jid); setUrlJobTitle(jtitle); setIsJobLocked(!!jid);
  //   // pre-set job filter dropdown when coming from Jobs page
  //   if (jid) setJobF(jid);
  //   else if (!cid) setJobF("");
  // }, [location.search]);
  useEffect(() => {
    const p      = new URLSearchParams(location.search);
    const cid    = p.get("client")      || "";
    const cname  = p.get("client_name") || "";
    const jid    = p.get("job")         || "";
    const jtitle = p.get("job_title")   || "";
    setUrlClientId(cid); setUrlClientName(cname); setIsClientLocked(!!cid);
    setClientF(cid);
    setUrlJobId(jid); setUrlJobTitle(jtitle); setIsJobLocked(!!jid);
    if (jid) setJobF(jid);
    else if (!cid) setJobF("");
  
    // HR always sees only Hired candidates
    if (isHR) setStatusF("Hired");
  }, [location.search, isHR]);

  const clearClientFilter = () => {
    setUrlClientId(""); setUrlClientName(""); setIsClientLocked(false);
    setClientF(""); setJobF("");
    navigate("/resumes", { replace: true });
  };

  const clearJobFilter = () => {
    setUrlJobId(""); setUrlJobTitle(""); setIsJobLocked(false);
    setJobF("");
    navigate("/resumes", { replace: true });
  };

  // ── Tabs & core state ──────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState(0);

  const [resumes,     setResumes]     = useState([]);
  const [jobs,        setJobs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [statusF,     setStatusF]     = useState("");
  const [expF,        setExpF]        = useState("");
  const [jobF,        setJobF]        = useState("");
  const [clientF,     setClientF]     = useState(_qp.get("client") || "");
  const [clients,     setClients]     = useState([]);
  const [formOpen,    setFormOpen]    = useState(false);
  const [detailOpen,  setDetailOpen]  = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [pdfOpen,     setPdfOpen]     = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [addFile,     setAddFile]     = useState(null);
  const formFileRef   = useRef(null);
  const [inlineFiles, setInlineFiles] = useState([]);
  const [showParsing, setShowParsing] = useState(false);
  const inlineRef     = useRef(null);
  const [bulkOpen,    setBulkOpen]    = useState(false);
  const [bulkFiles,   setBulkFiles]   = useState([]);
  const [bulkStep,    setBulkStep]    = useState(0);
  const [bulkSaving,  setBulkSaving]  = useState(false);
  const [bulkDone,    setBulkDone]    = useState(false);
  const [recruiters,  setRecruiters]  = useState([]);
  const [allTracking, setAllTracking] = useState([]);

  // ── Stored resumes state ───────────────────────────────────────────────────
  const [rawResumes,     setRawResumes]     = useState([]);
  const [rawLoading,     setRawLoading]     = useState(false);
  const [rawSearch,      setRawSearch]      = useState("");
  const [rawStatusF,     setRawStatusF]     = useState("");
  const [rawDateFrom,    setRawDateFrom]    = useState("");
  const [rawDateTo,      setRawDateTo]      = useState("");
  const rawUploadRef   = useRef(null);
  const [rawUploading,   setRawUploading]   = useState(false);
  const [rawUploadBatch, setRawUploadBatch] = useState([]);

  // ── Dialogs state ──────────────────────────────────────────────────────────
  const [assignOpen,   setAssignOpen]   = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignJobId,  setAssignJobId]  = useState("");
  const [assignSaving, setAssignSaving] = useState(false);

  const [convertOpen,   setConvertOpen]   = useState(false);
  const [convertTarget, setConvertTarget] = useState(null);
  const [convertData,   setConvertData]   = useState(EMPTY_CONVERT);
  const [convertSaving, setConvertSaving] = useState(false);
  const [convertError,  setConvertError]  = useState("");

  const [rawPdfOpen, setRawPdfOpen] = useState(false);
  const [rawPdfDoc,  setRawPdfDoc]  = useState(null);

  const [clientSelectOpen, setClientSelectOpen] = useState(false);
  const [pickedClient,     setPickedClient]     = useState(null);

  const [manualRawOpen,   setManualRawOpen]   = useState(false);
  const [manualRawData,   setManualRawData]   = useState(EMPTY_MANUAL_RAW);
  const [manualRawSaving, setManualRawSaving] = useState(false);
  const [manualRawError,  setManualRawError]  = useState("");
  const [manualRawFile,   setManualRawFile]   = useState(null);
  const manualFileRef = useRef(null);

  // ── Scoring state ──────────────────────────────────────────────────────────
  const [scoreOpen,    setScoreOpen]    = useState(false);
  const [scoreData,    setScoreData]    = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreTarget,  setScoreTarget]  = useState(null);
  const [scoreJobId,   setScoreJobId]   = useState("");
  const [scoreMap,     setScoreMap]     = useState({});

  // ── Exam state ────────────────────────────────────────────────────────────
  const [examOpen,      setExamOpen]      = useState(false);
  const [examCandidate, setExamCandidate] = useState(null);
  const [examSending,   setExamSending]   = useState(false);
  const [examError,     setExamError]     = useState("");
  const [examSuccess,   setExamSuccess]   = useState("");
  const [examConfig,    setExamConfig]    = useState({
    job_id: "", mcq_count: 0, subjective_count: 0,
    coding_count: 0, time_limit_minutes: 60, expires_in_days: 3,
  });
  const [selectedExamJob, setSelectedExamJob] = useState(null);
  const [sentExams, setSentExams] = useState([]);

  const [examResultsOpen,   setExamResultsOpen]   = useState(false);
  const [examResultsTarget, setExamResultsTarget] = useState(null);

  // ── Detail-tab + embedded tracking state ──────────────────────────────────────
  const [detailTab,         setDetailTab]         = useState(0);
  const [candidateTracking, setCandidateTracking] = useState(null);
  const [trackingLoading,   setTrackingLoading]   = useState(false);
  const [trackingIvOpen,    setTrackingIvOpen]    = useState(false);
  const [trackingIvData,    setTrackingIvData]    = useState({
    interviewer: "", interview_type: "Video", feedback_score: 3,
    recommendation: "Maybe", feedback_summary: "", strengths: "", weaknesses: "",
  });
  const [trackingSaving,    setTrackingSaving]    = useState(false);
  const [trackingStage,     setTrackingStage]     = useState("");
  const [trackingError,     setTrackingError]     = useState("");



  // ── Loaders ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try { setLoading(true); setError(""); const res = await getAllResumes(); setResumes(res.data || []); }
    catch (err) { setError(err?.message || "Failed to load candidates"); setResumes([]); }
    finally { setLoading(false); }
  }, []);

  const loadRaw = useCallback(async () => {
    try { setRawLoading(true); const res = await getRawResumes(); setRawResumes(res.data || []); }
    catch { setRawResumes([]); }
    finally { setRawLoading(false); }
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
    load(); loadRaw(); loadJobs(); loadClients(); loadRecruiters(); loadAllTracking();
  }, [load, loadRaw, loadJobs, loadClients, loadRecruiters, loadAllTracking]);


  // Load all cached scores whenever resumes or jobs change
  useEffect(() => {
    if (!resumes.length || !jobs.length) return;
    const pairs = resumes
      .filter(r => r.linked_job_id)
      .map(r => ({ resumeId: r._id, jobId: jobs.find(j => j.job_id === r.linked_job_id)?._id }))
      .filter(p => p.jobId);
    Promise.all(
      pairs.map(p =>
        fetch(`${BASE}/score/candidate?resume_id=${p.resumeId}&job_id=${p.jobId}`, { headers: getHeaders() })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      const map = {};
      results.forEach((res, i) => {
        if (res?.data) map[`${pairs[i].resumeId}_${pairs[i].jobId}`] = res.data;
      });
      setScoreMap(map);
    });
  }, [resumes, jobs]);
  const trackingMap = {};
  allTracking.forEach(t => { if (!trackingMap[t.resume_id]) trackingMap[t.resume_id] = t; });

// Maps candidate_id → most recent exam (latest first)
const examMap = {};
sentExams.forEach(e => {
  if (!examMap[e.candidate_id]) examMap[e.candidate_id] = e;
});

const EXAM_STATUS_STYLE = {
  "Sent":        { label: "Exam Sent",       bg: "#fff3e0", color: "#e65100", border: "#ffcc02" },
  "In Progress": { label: "Exam Started",    bg: "#e3f2fd", color: "#0277bd", border: "#90caf9" },
  "Completed":   { label: "Exam Done",       bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
  "Expired":     { label: "Exam Expired",    bg: "#f5f5f5", color: "#757575", border: "#e0e0e0" },
};
  // ── Filtering ──────────────────────────────────────────────────────────────
  const expBand      = EXP_BANDS.find(b => b.label === expF);
  const clientJobIds = clientF ? jobs.filter(j => j.client_id === clientF).map(j => j.job_id) : null;
  const filtered = resumes.filter(r => {
    const q  = search.toLowerCase();
    const mQ = !q || r.name?.toLowerCase().includes(q) || r.skills?.toLowerCase().includes(q) || r.resume_id?.toLowerCase().includes(q);
    const mS = !statusF || r.status === statusF;
    const selectedJob = jobs.find(j => j._id === jobF);
    const mJ = !jobF || r.linked_job_id === selectedJob?.job_id;
    const mE = !expBand || expBand.label === "All Experience" ||
      (expBand.min === "10" ? r.experience >= 10 : r.experience >= Number(expBand.min) && r.experience <= Number(expBand.max));
    const mC = !clientJobIds || clientJobIds.includes(r.linked_job_id);
    return mQ && mS && mJ && mE && mC;
  });

  const filteredRaw = rawResumes.filter(r => {
    const q  = rawSearch.toLowerCase();
    const mQ = !q || r.name?.toLowerCase().includes(q) || r.raw_id?.toLowerCase().includes(q)
                  || r.original_name?.toLowerCase().includes(q) || r.skills?.toLowerCase().includes(q);
    const mS = !rawStatusF || r.status === rawStatusF;
    // Date range — compare against created_at
    let mD = true;
    if (rawDateFrom || rawDateTo) {
      const uploaded = r.created_at ? new Date(r.created_at) : null;
      if (!uploaded) { mD = false; }
      else {
        if (rawDateFrom) mD = mD && uploaded >= new Date(rawDateFrom + "T00:00:00");
        if (rawDateTo)   mD = mD && uploaded <= new Date(rawDateTo   + "T23:59:59");
      }
    }
    return mQ && mS && mD;
  });

  const stats = {
    total:       resumes.length,
    newCount:    resumes.filter(r => r.status === "New").length,
    shortlisted: resumes.filter(r => r.status === "Shortlisted").length,
    interviewed: resumes.filter(r => r.status === "Interviewed").length,
  };

  // ── Dialog helpers ─────────────────────────────────────────────────────────
  const openCreate = () => { setPickedClient(null); setClientSelectOpen(true); };

  const handleClientPicked = (client) => {
    setPickedClient(client); setClientSelectOpen(false); setSelected(null); setAddFile(null);
    setFormData({ ...EMPTY_FORM, client_name: client?.company_name || "" });
    setFormOpen(true);
  };

  const openEdit   = r => { setSelected(r); setFormData({ ...EMPTY_FORM, ...r }); setAddFile(null); setFormOpen(true); };
  const openDelete = r => { setSelected(r); setDeleteOpen(true); };
  const openPdf    = r => { setSelected(r); setPdfOpen(true); };

const openDetail = async (r) => {
  setSelected(r);
  setDetailTab(0);
  setCandidateTracking(null);
  setTrackingError("");
  setDetailOpen(true);
  setTrackingLoading(true);
  try {
    const res = await getTrackingByResume(r.resume_id);
    const latest = res.data?.[0] || null;
    setCandidateTracking(latest);
    setTrackingStage(latest?.current_stage || "Screening");
  } catch { setCandidateTracking(null); }
  finally { setTrackingLoading(false); }
};

const handleStartTracking = async () => {
  if (!selected) return;
  setTrackingLoading(true); setTrackingError("");
  try {
    const linkedJob = jobs.find(j => j.job_id === selected.linked_job_id);
    const payload = {
      resume_id:      selected.resume_id,
      candidate_name: selected.name,
      job_id:         linkedJob?._id || selected.linked_job_id || "UNASSIGNED",
      client_name:    linkedJob?.client_name || "",
      job_title:      selected.linked_job_title || "",
      current_stage:  "Screening",
      pipeline_status:"Active",
    };
    const res = await createTrackingEntry(payload);
    setCandidateTracking(res.data);
    setTrackingStage("Screening");
  } catch (err) {
    setTrackingError(err?.message || "Failed to start tracking");
  } finally { setTrackingLoading(false); }
};

const handleTrackingStageUpdate = async (newStage) => {
  if (!candidateTracking) return;
  setTrackingLoading(true); setTrackingError("");
  try {
    const res = await updateTrackingEntry(candidateTracking._id, { current_stage: newStage });
    setCandidateTracking(res.data);
    setTrackingStage(newStage);
  } catch (err) {
    setTrackingError(err?.message || "Failed to update stage");
  } finally { setTrackingLoading(false); }
};

const handleTrackingIvSave = async (e) => {
  e.preventDefault();
  if (!candidateTracking) return;
  setTrackingSaving(true); setTrackingError("");
  try {
    const res = await addTrackingInterview(candidateTracking._id, {
      ...trackingIvData,
      feedback_score: Number(trackingIvData.feedback_score),
      strengths:  trackingIvData.strengths  ? trackingIvData.strengths.split(",").map(s=>s.trim())  : [],
      weaknesses: trackingIvData.weaknesses ? trackingIvData.weaknesses.split(",").map(s=>s.trim()) : [],
    });
    setCandidateTracking(res.data);
    setTrackingIvOpen(false);
    setTrackingIvData({ interviewer:"", interview_type:"Video", feedback_score:3, recommendation:"Maybe", feedback_summary:"", strengths:"", weaknesses:"" });
  } catch (err) {
    setTrackingError(err?.message || "Failed to save feedback");
  } finally { setTrackingSaving(false); }
};



  const formClientJobs = pickedClient
    ? jobs.filter(j => j.client_id === pickedClient._id || j.client_name === pickedClient.company_name)
    : jobs;

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === "linked_job_id") {
      const job = jobs.find(j => j._id === value);
      setFormData(p => ({ ...p, linked_job_id: job?.job_id || "", linked_job_mongo_id: value, linked_job_title: job?.title || "" }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const openManualRaw = () => { setManualRawData(EMPTY_MANUAL_RAW); setManualRawError(""); setManualRawFile(null); setManualRawOpen(true); };

  const handleManualRawChange = e => {
    const { name, value } = e.target;
    if (name === "linked_job_id") {
      const job = jobs.find(j => j._id === value);
      setManualRawData(p => ({ ...p, linked_job_id: job?.job_id || "", linked_job_mongo_id: value, linked_job_title: job?.title || "" }));
    } else {
      setManualRawData(p => ({ ...p, [name]: value }));
    }
  };

  const handleManualRawSave = async (e) => {
    e.preventDefault(); setManualRawSaving(true); setManualRawError("");
    try {
      const payload = { ...manualRawData, experience: manualRawData.experience ? Number(manualRawData.experience) : 0, current_salary: manualRawData.current_salary ? Number(manualRawData.current_salary) : 0, expected_salary: manualRawData.expected_salary ? Number(manualRawData.expected_salary) : 0 };
      if (manualRawFile) { payload.file_b64 = await toBase64(manualRawFile); payload.file_name = manualRawFile.name; }
      await createRawManual(payload);
      setManualRawOpen(false); setManualRawFile(null); loadRaw();
    } catch (err) { setManualRawError(err?.message || "Save failed"); }
    finally { setManualRawSaving(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...formData, experience: formData.experience ? Number(formData.experience) : 0, current_salary: formData.current_salary ? Number(formData.current_salary) : 0, expected_salary: formData.expected_salary ? Number(formData.expected_salary) : 0 };
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

  const handleRawFileSelect = async (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (!files.length) return;
    if (rawUploadRef.current) rawUploadRef.current.value = "";
    const batch = files.map(f => ({ file: f, status: "uploading" }));
    setRawUploadBatch(batch); setRawUploading(true);
    await Promise.all(batch.map(async (entry, idx) => {
      try { const b64 = await toBase64(entry.file); await uploadRawResume(b64, entry.file.name); batch[idx] = { ...entry, status: "done" }; }
      catch { batch[idx] = { ...entry, status: "error" }; }
      setRawUploadBatch([...batch]);
    }));
    setRawUploading(false); loadRaw();
    setTimeout(() => setRawUploadBatch([]), 3000);
  };

  const openAssign = (raw) => { setAssignTarget(raw); setAssignJobId(""); setAssignOpen(true); };
  const handleAssign = async () => {
    if (!assignJobId) return;
    const job = jobs.find(j => j._id === assignJobId);
    setAssignSaving(true);
    try {
      await assignRawToJob(assignTarget._id, { job_id: assignJobId, job_title: job?.title || "", client_name: job?.client_name || "" });
      setAssignOpen(false); loadRaw();
    } catch (err) { setError(err?.message || "Failed to assign job"); }
    finally { setAssignSaving(false); }
  };

  const openConvert = (raw) => {
    setConvertTarget(raw); setConvertError("");
    setConvertData({ ...EMPTY_CONVERT, name: raw.name || "", email: raw.email || "", phone: raw.phone || "", current_role: raw.current_role || "", current_company: raw.current_company || "", experience: raw.experience || "", skills: raw.skills || "", location: raw.location || "", current_salary: raw.current_salary || "", expected_salary: raw.expected_salary || "", notice_period: raw.notice_period || "30 days", linked_job_id: raw.linked_job_id || "", linked_job_title: raw.linked_job_title || "" });
    setConvertOpen(true);
  };

  const handleConvertChange = e => {
    const { name, value } = e.target;
    if (name === "linked_job_id") {
      const job = jobs.find(j => j._id === value);
      setConvertData(p => ({ ...p, linked_job_id: job?.job_id || "", linked_job_mongo_id: value, linked_job_title: job?.title || "" }));
    } else {
      setConvertData(p => ({ ...p, [name]: value }));
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault(); setConvertSaving(true); setConvertError("");
    try {
      const payload = { ...convertData, experience: convertData.experience ? Number(convertData.experience) : 0, current_salary: convertData.current_salary ? Number(convertData.current_salary) : 0, expected_salary: convertData.expected_salary ? Number(convertData.expected_salary) : 0 };
      await convertRaw(convertTarget._id, payload);
      setConvertOpen(false); load(); loadRaw();
    } catch (err) { setConvertError(err?.message || "Conversion failed"); }
    finally { setConvertSaving(false); }
  };

  // ── exam dialog fun ────────────────────────────────────────────────────
  const openExamDialog = (candidate) => {
    setExamCandidate(candidate);
    setExamError("");
    setExamSuccess("");
    setSelectedExamJob(null);
    // Pre-fill job if candidate has one linked
    const linkedJob = candidate.linked_job_id
      ? jobs.find(j => j.job_id === candidate.linked_job_id)
      : null;
    setExamConfig({
      job_id:            linkedJob?._id || "",
      mcq_count:         linkedJob?.mcq_questions_count        || 0,
      subjective_count:  linkedJob?.subjective_questions_count || 0,
      coding_count:      linkedJob?.coding_questions_count     || 0,
      time_limit_minutes: 60,
      expires_in_days:   3,
    });
    setSelectedExamJob(linkedJob || null);
    setExamOpen(true);
  };
  
  const handleExamJobChange = (jobMongoId) => {
    const job = jobs.find(j => j._id === jobMongoId);
    setSelectedExamJob(job || null);
    setExamConfig(p => ({
      ...p,
      job_id:           jobMongoId,
      mcq_count:        Math.min(p.mcq_count,        job?.mcq_questions_count        || 0),
      subjective_count: Math.min(p.subjective_count, job?.subjective_questions_count || 0),
      coding_count:     Math.min(p.coding_count,     job?.coding_questions_count     || 0),
    }));
  };
  
  const handleSendExam = async () => {
    if (!examConfig.job_id)    { setExamError("Please select a job"); return; }
    if (!examCandidate?.email) { setExamError("Candidate has no email address"); return; }
    if (examConfig.mcq_count + examConfig.subjective_count + examConfig.coding_count === 0) {
      setExamError("At least one question type must have count > 0"); return;
    }
    setExamSending(true); setExamError("");
    try {
      const res = await sendExam({ ...examConfig, candidate_id: examCandidate._id });
      setExamSuccess(`Exam sent to ${examCandidate.email}! Link: ${res.data.exam_link}`);
      loadExams();
    } catch (err) {
      setExamError(err?.message || "Failed to send exam");
    } finally {
      setExamSending(false);
    }
  };
  
  // const loadNotifications = async () => {
  //   setNotifLoading(true);
  //   try {
  //     const res = await getNotifications();
  //     setNotifs(res.data || []);
  //     setUnreadCount(res.unread || 0);
  //   } catch { }
  //   finally { setNotifLoading(false); }
  // };
  const loadExams = async () => {
    try {
      const res = await getAllExams();
      setSentExams(res.data || []);
    } catch { setSentExams([]); }
  };
  // Poll notifications every 30 seconds
  // useEffect(() => {
  //   loadNotifications();
  //   const interval = setInterval(loadNotifications, 30000);
  //   return () => clearInterval(interval);
  // }, []);
  useEffect(() => {
    // loadNotifications();
    loadExams();
    const interval = setInterval(() => {
      //  loadNotifications(); 
      loadExams(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Scoring handlers ───────────────────────────────────────────────────────
  const openScore = async (r) => {
    const linkedJob = jobs.find(j => j.job_id === r.linked_job_id);
    if (!linkedJob) { setError("Cannot score: candidate has no linked job"); return; }
    setScoreTarget(r); setScoreJobId(linkedJob._id); setScoreData(null);
    setScoreOpen(true); setScoreLoading(true);
    try {
      const cached = await getCachedScore(r._id, linkedJob._id);
      setScoreData(cached.data);
      setScoreMap(prev => ({ ...prev, [`${r._id}_${linkedJob._id}`]: cached.data }));
    } catch {
      try {
        const fresh = await scoreCandidate(r._id, linkedJob._id);
        setScoreData(fresh.data);
        setScoreMap(prev => ({ ...prev, [`${r._id}_${linkedJob._id}`]: fresh.data }));
      } catch (err) { setError(err?.message || "Scoring failed"); setScoreOpen(false); }
    } finally { setScoreLoading(false); }
  };

  const reScore = async () => {
    if (!scoreTarget || !scoreJobId) return;
    setScoreLoading(true); setScoreData(null);
    try {
      const fresh = await scoreCandidate(scoreTarget._id, scoreJobId);
      setScoreData(fresh.data);
      setScoreMap(prev => ({ ...prev, [`${scoreTarget._id}_${scoreJobId}`]: fresh.data }));
    } catch (err) { setError(err?.message || "Re-scoring failed"); }
    finally { setScoreLoading(false); }
  };

  if (loading)
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={48} /></Box>;

  // ── Score bar colour helper ────────────────────────────────────────────────
  const barColor = (score) =>
    score >= 80 ? "#2e7d32" : score >= 60 ? "#1565c0" : score >= 40 ? "#f57c00" : "#c62828";

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>


        <Box>
          <Typography variant="h4" color="primary.dark">Candidates</Typography>
          <Typography color="text.secondary" mt={0.5}>Manage candidate profiles and track applications</Typography>
        </Box>
        {/* <Box display="flex" gap={1.5}>
          {mainTab === 0 && (
            <>
              <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => inlineRef.current?.click()} size="large">Upload Resume</Button>
              <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">Add Candidate</Button>
            </>
          )}
          {mainTab === 1 && (
            <Box display="flex" gap={1.5}>
              <Button variant="outlined" startIcon={<EditNote />} onClick={openManualRaw} size="large">Add Manually</Button>
              <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => rawUploadRef.current?.click()} size="large">Store Resumes</Button>
            </Box>
          )}
        </Box> */}

        <Box display="flex" gap={1.5}>
          {!isHR && mainTab === 0 && (
            <>
              <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => inlineRef.current?.click()} size="large">Upload Resume</Button>
              <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">Add Candidate</Button>
            </>
          )}
          {!isHR && mainTab === 1 && (
            <Box display="flex" gap={1.5}>
              <Button variant="outlined" startIcon={<EditNote />} onClick={openManualRaw} size="large">Add Manually</Button>
              <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => rawUploadRef.current?.click()} size="large">Store Resumes</Button>
            </Box>
          )}
        </Box>
        </Box>

      {/* ── Client filter banner ──────────────────────────────────────────── */}
      {isClientLocked && (
        <Alert severity="info" icon={<FilterList fontSize="small" />}
          action={<Chip label="Show all clients" size="small" variant="outlined" onDelete={clearClientFilter} onClick={clearClientFilter} deleteIcon={<CloseIcon />} sx={{ fontSize: 11, cursor: "pointer" }} />}
          sx={{ py: 0.5 }}>
          Showing candidates for <strong>{urlClientName}</strong>
        </Alert>
      )}

      {/* ── Job filter banner ────────────────────────────────────────────────── */}
      {isJobLocked && (
        <Alert severity="success" icon={<Work fontSize="small" />}
          action={<Chip label="Show all jobs" size="small" variant="outlined" onDelete={clearJobFilter} onClick={clearJobFilter} deleteIcon={<CloseIcon />} sx={{ fontSize: 11, cursor: "pointer" }} />}
          sx={{ py: 0.5 }}>
          Showing candidates for job <strong>{urlJobTitle}</strong>
        </Alert>
      )}
      {/* ── HR view banner ───────────────────────────────────────────────── */}
{isHR && (
  <Alert severity="info" icon={<People fontSize="small" />} sx={{ py: 0.5 }}>
    Showing <strong>Hired candidates</strong> only. Contact a recruiter to modify candidate records.
  </Alert>
)}

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={6} md={3}><StatCard title={isClientLocked ? "Client Candidates" : "Total"} value={isClientLocked ? filtered.length : stats.total} icon={<Description />} color="#1a237e" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="New"         value={isClientLocked ? filtered.filter(r=>r.status==="New").length        : stats.newCount}    icon={<NewReleases />} color="#0277bd" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Shortlisted" value={isClientLocked ? filtered.filter(r=>r.status==="Shortlisted").length : stats.shortlisted} icon={<Star />}        color="#e65100" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Stored PDFs" value={rawResumes.length} icon={<Inventory2 />} color="#6a1b9a" /></Grid>
      </Grid>

      {/* ── Main tabs ──────────────────────────────────────────────────────── */}
      {/* <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
          <Tab label={<Box display="flex" alignItems="center" gap={1}><People fontSize="small" />Candidates{isClientLocked && <Chip label={urlClientName} size="small" color="info" sx={{ fontSize: 10, height: 18 }} />}</Box>} iconPosition="start" />
          <Tab label={<Badge badgeContent={rawResumes.filter(r => r.status === "Stored").length} color="secondary" max={99}><Box sx={{ pr: rawResumes.filter(r => r.status === "Stored").length > 0 ? 1.5 : 0 }}>Stored Resumes</Box></Badge>} icon={<Inventory2 fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Box> */}

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <People fontSize="small" />
                  {isHR ? "Hired Candidates" : "Candidates"}
                  {isClientLocked && <Chip label={urlClientName} size="small" color="info" sx={{ fontSize: 10, height: 18 }} />}
                </Box>
              }
              iconPosition="start"
            />
            {/* Stored Resumes tab — recruiters/managers/admins only */}
            {!isHR && (
              <Tab
                label={
                  <Badge badgeContent={rawResumes.filter(r => r.status === "Stored").length} color="secondary" max={99}>
                    <Box sx={{ pr: rawResumes.filter(r => r.status === "Stored").length > 0 ? 1.5 : 0 }}>
                      Stored Resumes
                    </Box>
                  </Badge>
                }
                icon={<Inventory2 fontSize="small" />}
                iconPosition="start"
              />
            )}
          </Tabs>
        </Box>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 0 — Resume Bank
      ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === 0 && (
        <>
          {/* {!showParsing
            ? <InlineUploadZone onFiles={handleFileSelect} fileRef={inlineRef} />
            : <InlineParseProgress files={inlineFiles} onReview={openBulkReview} onClear={clearInline} />
          } */}
          {!isHR && (
              !showParsing
                ? <InlineUploadZone onFiles={handleFileSelect} fileRef={inlineRef} />
                : <InlineParseProgress files={inlineFiles} onReview={openBulkReview} onClear={clearInline} />
            )}

          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField placeholder="Search by name, skills, or ID…" value={search} onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
            {/* <TextField select value={statusF} onChange={e => setStatusF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Status">
              <MenuItem value="">All Statuses</MenuItem>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField> */}
            <TextField
                select value={statusF}
                onChange={e => !isHR && setStatusF(e.target.value)}
                size="small" sx={{ minWidth: 150 }}
                label="Status"
                disabled={isHR}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            <TextField select value={expF} onChange={e => setExpF(e.target.value)} size="small" sx={{ minWidth: 160 }} label="Experience">
              <MenuItem value="">All Experience</MenuItem>{EXP_BANDS.slice(1).map(b => <MenuItem key={b.label} value={b.label}>{b.label}</MenuItem>)}
            </TextField>
            {!isClientLocked && (
              <TextField select value={clientF} onChange={e => { setClientF(e.target.value); setJobF(""); }} size="small" sx={{ minWidth: 180 }} label="Client">
                <MenuItem value="">All Clients</MenuItem>
                {clients.map(c => <MenuItem key={c._id} value={c._id}><Box display="flex" alignItems="center" gap={1}><Business fontSize="small" sx={{ color: "#0277bd" }} />{c.company_name}</Box></MenuItem>)}
              </TextField>
            )}
            {!isJobLocked && (
              <TextField select value={jobF} onChange={e => setJobF(e.target.value)} size="small" sx={{ minWidth: 180 }} label="Job">
                <MenuItem value="">All Jobs</MenuItem>
                {(clientF ? jobs.filter(j => j.client_id === clientF) : jobs).map(j => <MenuItem key={j._id} value={j._id}>{j.title}</MenuItem>)}
              </TextField>
            )}
          </Box>

          {resumes.length === 0 && !error ? (
            <Card>
              <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
                <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}><PersonOff sx={{ fontSize: 36, color: "#9fa8da" }} /></Avatar>
                <Typography variant="h6" color="text.secondary">No candidates yet</Typography>
                <Typography fontSize={14} color="text.disabled">Drop PDF resumes above or add a candidate manually.</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Candidate</Button>
              </Box>
            </Card>
          ) : (
            <Card>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f7fa" }}>
                      {["Candidate", "Current Role", "Exp", "Skills", "Expected Salary", "Notice", "Applied For", "Match %", "Pipeline Stage", "Status", "Actions"].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
                          {isJobLocked ? `No candidates found for job "${urlJobTitle}"` : isClientLocked ? `No candidates found for ${urlClientName}` : "No candidates match your filters"}
                        </TableCell>
                      </TableRow>
                    ) : filtered.map(r => (
                      <TableRow key={r._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: "#1a237e" }}>{nameInitials(r.name)}</Avatar>
                            <Box><Typography fontWeight={600} fontSize={13}>{r.name}</Typography><Typography fontSize={11} color="text.secondary">{r.resume_id}</Typography></Box>
                          </Box>
                        </TableCell>
                        <TableCell><Typography fontSize={13}>{r.current_role}</Typography><Typography fontSize={11} color="text.secondary">{r.current_company}</Typography></TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.experience} yrs</TableCell>
                        <TableCell>
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {(r.skills || "").split(",").filter(Boolean).slice(0, 3).map((s, i) => <Chip key={i} label={s.trim()} size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#e8eaf6", color: "#1a237e" }} />)}
                            {(r.skills || "").split(",").filter(Boolean).length > 3 && <Chip label={`+${(r.skills || "").split(",").length - 3}`} size="small" sx={{ fontSize: 10, height: 20 }} />}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{fmtSalary(r.expected_salary)}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.notice_period || "—"}</TableCell>
                        <TableCell>
                          {r.linked_job_title ? (
                            <Box>
                              {(() => { const lj = jobs.find(j => j.job_id === r.linked_job_id); return lj?.client_name ? <Typography fontSize={10} color="text.secondary" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 0.2 }}><Business sx={{ fontSize: 10 }} />{lj.client_name}</Typography> : null; })()}
                              <Typography fontSize={12} color="#0277bd" fontWeight={600}>{r.linked_job_id}</Typography>
                              <Typography fontSize={11} color="text.secondary">{r.linked_job_title}</Typography>
                            </Box>
                          ) : <Typography fontSize={12} color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell sx={{ minWidth: 70 }}>
                          {(() => {
                            const linkedJob = jobs.find(j => j.job_id === r.linked_job_id);
                            if (!linkedJob) return <Typography fontSize={11} color="text.disabled">—</Typography>;
                            const key = `${r._id}_${linkedJob._id}`;
                            const sc  = scoreMap[key];
                            if (!sc) return (
                              <Tooltip title="Click score button to generate">
                                <Typography fontSize={11} color="text.disabled" sx={{ cursor: "default" }}>—</Typography>
                              </Tooltip>
                            );
                            const color = sc.overall_score >= 80 ? "#2e7d32" : sc.overall_score >= 60 ? "#1565c0" : sc.overall_score >= 40 ? "#f57c00" : "#c62828";
                            const bg    = sc.overall_score >= 80 ? "#e8f5e9" : sc.overall_score >= 60 ? "#e3f2fd" : sc.overall_score >= 40 ? "#fff8e1" : "#fce4ec";
                            return (
                              <Tooltip title={sc.verdict}>
                                <Box onClick={() => openScore(r)} sx={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.3, borderRadius: 20, bgcolor: bg, border: `1px solid ${color}20` }}>
                                  <Typography fontSize={12} fontWeight={700} color={color}>{sc.overall_score}%</Typography>
                                </Box>
                              </Tooltip>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => { const track = trackingMap[r.resume_id]; if (!track) return <Typography fontSize={12} color="text.disabled">—</Typography>; return <Box><Chip label={track.current_stage} size="small" color={STAGE_COLOR[track.current_stage] || "default"} sx={{ fontWeight: 700, fontSize: 10, mb: 0.3 }} /><Typography fontSize={10} color="text.secondary">{track.pipeline_status}</Typography></Box>; })()}
                        </TableCell>
                        <TableCell><Chip label={r.status} color={STATUS_COLOR[r.status] || "default"} size="small" sx={{ fontWeight: 700, fontSize: 11 }} /></TableCell>
                        {/* <TableCell>
                        {examMap[r._id] && (() => {
                              const ex    = examMap[r._id];
                              const style = EXAM_STATUS_STYLE[ex.status] || EXAM_STATUS_STYLE["Sent"];
                              return (
                                <Tooltip title={
                                  ex.status === "Completed"
                                    ? `MCQ score: ${ex.mcq_score}% · Submitted ${new Date(ex.submitted_at).toLocaleDateString("en-IN")}`
                                    : ex.status === "In Progress"
                                    ? `Started ${new Date(ex.started_at).toLocaleDateString("en-IN")}`
                                    : `Sent on ${new Date(ex.sent_at).toLocaleDateString("en-IN")} · expires ${new Date(ex.expires_at).toLocaleDateString("en-IN")}`
                                }>
                                  <Chip
                                    label={style.label}
                                    size="small"
                                    sx={{
                                      fontSize: 9, height: 18, mb: 0.5,
                                      bgcolor: style.bg,
                                      color: style.color,
                                      border: `1px solid ${style.border}`,
                                      fontWeight: 700,
                                      display: "flex",
                                    }}
                                  />
                                </Tooltip>
                              );
                            })()}
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="View Details"><IconButton size="small" onClick={() => openDetail(r)}><Visibility fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title={r.resume_file ? "View Resume PDF" : "No resume file uploaded"}>
                              <span><IconButton size="small" onClick={() => r.resume_file && openPdf(r)} sx={{ color: r.resume_file ? "#c62828" : "#bdbdbd", cursor: r.resume_file ? "pointer" : "not-allowed" }}><PictureAsPdf fontSize="small" /></IconButton></span>
                            </Tooltip>
                       
                            <Tooltip title={r.linked_job_id ? "AI Score vs Job" : "Link to a job to enable scoring"}>
                              <span>
                                <IconButton size="small" onClick={() => openScore(r)} disabled={!r.linked_job_id} sx={{ color: r.linked_job_id ? "#7b1fa2" : "#bdbdbd" }}>
                                  <Analytics fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={r.email ? "Send Screening Exam" : "No email — cannot send exam"}>
                                <span>
                                  <IconButton size="small"
                                    onClick={() => r.email && openExamDialog(r)}
                                    disabled={!r.email}
                                    sx={{ color: r.email ? "#e65100" : "#bdbdbd" }}>
                                    <Assignment fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDelete(r)}><Delete fontSize="small" /></IconButton></Tooltip>
                          </Box>
                        </TableCell> */}


                      <TableCell>
                        {/* Exam status chip — recruiters only */}
                        {!isHR && examMap[r._id] && (() => {
                          const ex    = examMap[r._id];
                          const style = EXAM_STATUS_STYLE[ex.status] || EXAM_STATUS_STYLE["Sent"];
                          return (
                            <Tooltip title={
                              ex.status === "Completed"
                                ? `MCQ score: ${ex.mcq_score}% · Submitted ${new Date(ex.submitted_at).toLocaleDateString("en-IN")}`
                                : ex.status === "In Progress"
                                ? `Started ${new Date(ex.started_at).toLocaleDateString("en-IN")}`
                                : `Sent on ${new Date(ex.sent_at).toLocaleDateString("en-IN")}`
                            }>
                              <Chip label={style.label} size="small" sx={{
                                fontSize: 9, height: 18, mb: 0.5,
                                bgcolor: style.bg, color: style.color,
                                border: `1px solid ${style.border}`, fontWeight: 700, display: "flex",
                              }} />
                            </Tooltip>
                          );
                        })()}

                        <Box display="flex" gap={0.5}>
                          {/* View details — everyone */}
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => openDetail(r)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* View PDF — everyone */}
                          <Tooltip title={r.resume_file ? "View Resume PDF" : "No resume file uploaded"}>
                            <span>
                              <IconButton size="small" onClick={() => r.resume_file && openPdf(r)}
                                sx={{ color: r.resume_file ? "#c62828" : "#bdbdbd", cursor: r.resume_file ? "pointer" : "not-allowed" }}>
                                <PictureAsPdf fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          {/* AI Score — recruiters/managers/admins only */}
                          {!isHR && (
                            <Tooltip title={r.linked_job_id ? "AI Score vs Job" : "Link to a job to enable scoring"}>
                              <span>
                                <IconButton size="small" onClick={() => openScore(r)} disabled={!r.linked_job_id}
                                  sx={{ color: r.linked_job_id ? "#7b1fa2" : "#bdbdbd" }}>
                                  <Analytics fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          {/* Send Exam — recruiters/managers/admins only */}
                          {!isHR && (
                            <Tooltip title={r.email ? "Send Screening Exam" : "No email — cannot send exam"}>
                              <span>
                                <IconButton size="small" onClick={() => r.email && openExamDialog(r)} disabled={!r.email}
                                  sx={{ color: r.email ? "#e65100" : "#bdbdbd" }}>
                                  <Assignment fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          {/* Edit — recruiters/managers/admins only */}
                          {!isHR && (
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEdit(r)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Delete — recruiters/managers/admins only */}
                          {!isHR && (
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => openDelete(r)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>





                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Card>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — Stored Resumes
      ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === 1 && (
        <>
          <input ref={rawUploadRef} type="file" accept=".pdf,application/pdf" multiple hidden onChange={handleRawFileSelect} />
          <InlineUploadZone onFiles={handleRawFileSelect} fileRef={rawUploadRef} label="Drag & drop PDFs here to store them quickly" sublabel="Saved immediately · AI auto-extracts details · assign to a job anytime · convert to full candidate when ready" />

          {rawUploadBatch.length > 0 && (
            <Card variant="outlined" sx={{ borderColor: "#ce93d8", borderRadius: 2 }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography fontWeight={700} fontSize="0.88rem" mb={1}>{rawUploading ? "Storing resumes…" : "Upload complete ✓"}</Typography>
                <Box display="flex" flexDirection="column" gap={0.8}>
                  {rawUploadBatch.map((entry, i) => (
                    <Box key={i} display="flex" alignItems="center" gap={1.5} sx={{ p: 1, bgcolor: "#f5f7fa", borderRadius: 1.5 }}>
                      <Description fontSize="small" color="action" sx={{ flexShrink: 0 }} />
                      <Typography fontSize={12} fontWeight={600} flex={1} noWrap>{entry.file.name}</Typography>
                      {entry.status === "uploading" && <CircularProgress size={16} />}
                      {entry.status === "done"      && <Chip label="Stored ✓" size="small" color="success" sx={{ fontSize: 10 }} />}
                      {entry.status === "error"     && <Chip label="Failed"   size="small" color="error"   sx={{ fontSize: 10 }} />}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          <Box px={2} py={1.5} bgcolor="#f3e5f5" borderRadius={2} border="1px solid #ce93d8" display="flex" alignItems="center" gap={1.5}>
            <Inventory2 fontSize="small" sx={{ color: "#7b1fa2" }} />
            <Typography fontSize={13} color="#4a148c">Stored resumes are saved PDFs without a full candidate profile. Use <strong>Assign to Job</strong> to link to a posting, then <strong>Convert to Candidate</strong> to create a full profile in the Resume Bank.</Typography>
          </Box>


          {(() => {
            const expiringSoon = rawResumes.filter(r =>
              r.status !== "Converted" && (daysUntilExpiry(r.created_at) ?? 999) <= 14
            );
            return expiringSoon.length > 0 ? (
              <Alert severity="warning" icon={<NewReleases fontSize="small" />} sx={{ py: 0.5 }}>
                <strong>{expiringSoon.length} stored resume{expiringSoon.length > 1 ? "s" : ""}</strong> will be auto-deleted within 14 days.
                Convert them to candidates or they will be permanently removed.
              </Alert>
            ) : null;
          })()}

          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField placeholder="Search by name, skills, or file…" value={rawSearch} onChange={e => setRawSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 220 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }} />
            <TextField select value={rawStatusF} onChange={e => setRawStatusF(e.target.value)} size="small" sx={{ minWidth: 150 }} label="Status">
              <MenuItem value="">All</MenuItem>
              {["Stored", "Assigned", "Converted"].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField
              type="date" size="small" label="Uploaded From"
              value={rawDateFrom} onChange={e => setRawDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
              inputProps={{ max: rawDateTo || undefined }}
            />
            <TextField
              type="date" size="small" label="Uploaded To"
              value={rawDateTo} onChange={e => setRawDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
              inputProps={{ min: rawDateFrom || undefined }}
            />
            {(rawDateFrom || rawDateTo) && (
              <Chip
                label={`${filteredRaw.length} result${filteredRaw.length !== 1 ? "s" : ""}`}
                size="small"
                color="primary"
                variant="outlined"
                onDelete={() => { setRawDateFrom(""); setRawDateTo(""); }}
                sx={{ fontSize: 11 }}
              />
            )}
          </Box>

          {rawLoading ? (
            <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
          ) : rawResumes.length === 0 ? (
            <Card><Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}><Avatar sx={{ width: 72, height: 72, bgcolor: "#f3e5f5" }}><Inventory2 sx={{ fontSize: 36, color: "#ce93d8" }} /></Avatar><Typography variant="h6" color="text.secondary">No stored resumes yet</Typography><Typography fontSize={14} color="text.disabled">Drag PDFs above or click "Store Resumes" to get started.</Typography></Box></Card>
          ) : (
            <Card>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                <Table>
                  <TableHead><TableRow sx={{ bgcolor: "#fce4ec" }}>{["ID","Candidate","Role / Skills","Exp","Assigned Job","Uploaded On","Parse","Status","Actions"].map(h => <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#546e7a" }}>{h}</TableCell>)}</TableRow></TableHead>
                  <TableBody>
                    {filteredRaw.length === 0 ? (
                      <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>No stored resumes match your filters</TableCell></TableRow>
                    ) : filteredRaw.map(r => (
                      <TableRow key={r._id} hover sx={{ opacity: r.status === "Converted" ? 0.6 : 1 }}>
                        <TableCell sx={{ fontWeight: 700, color: "#7b1fa2", fontSize: 12 }}>{r.raw_id}</TableCell>
                        <TableCell><Box display="flex" alignItems="center" gap={1.5}><Avatar sx={{ width: 34, height: 34, fontSize: 12, fontWeight: 700, bgcolor: "#7b1fa2" }}>{r.name ? nameInitials(r.name) : <Description fontSize="small" />}</Avatar><Box><Typography fontWeight={600} fontSize={13}>{r.name || <em style={{ color: "#9e9e9e" }}>Not extracted</em>}</Typography><Typography fontSize={11} color="text.secondary" noWrap sx={{ maxWidth: 160 }}>{r.original_name}</Typography></Box></Box></TableCell>
                        <TableCell><Typography fontSize={12}>{r.current_role || "—"}</Typography><Box display="flex" flexWrap="wrap" gap={0.4} mt={0.3}>{(r.skills || "").split(",").filter(Boolean).slice(0, 2).map((s, i) => <Chip key={i} label={s.trim()} size="small" sx={{ fontSize: 9, height: 18, bgcolor: "#f3e5f5", color: "#7b1fa2" }} />)}</Box></TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.experience ? `${r.experience} yrs` : "—"}</TableCell>
                        <TableCell>{r.linked_job_id ? <Box><Typography fontSize={12} color="#0277bd" fontWeight={600}>{r.linked_job_id}</Typography><Typography fontSize={11} color="text.secondary">{r.linked_job_title}</Typography>{r.client_name && <Typography fontSize={10} color="text.disabled">{r.client_name}</Typography>}</Box> : <Typography fontSize={12} color="text.disabled">Not assigned</Typography>}</TableCell>
                        <TableCell sx={{ fontSize: 11, color: "text.secondary", whiteSpace: "nowrap" }}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          {/* <Typography fontSize={10} color="text.disabled">
                            {r.created_at ? new Date(r.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                            {(() => {
                              if (r.status === "Converted") {
                                return (
                                  <Chip
                                    label={r.converted_resume_id ? `→ ${r.converted_resume_id}` : "Converted"}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontSize: 9, height: 16, mt: 0.5 }}
                                  />
                                );
                              }
                              const days = daysUntilExpiry(r.created_at);
                              if (days === null) return null;
                              if (days <= 0)
                                return <Chip label="Expired" size="small" color="error" sx={{ fontSize: 9, height: 16, mt: 0.5 }} />;
                              if (days <= 14)
                                return <Chip label={`Expires in ${days}d`} size="small" color="warning" sx={{ fontSize: 9, height: 16, mt: 0.5 }} />;
                              if (days <= 30)
                                return <Chip label={`${days}d left`} size="small" color="default" sx={{ fontSize: 9, height: 16, mt: 0.5 }} />;
                              return null;
                            })()}
                         
                          </Typography> */}
                          <TableCell sx={{ fontSize: 11, color: "text.secondary", whiteSpace: "nowrap" }}>
                            {r.created_at
                              ? new Date(r.created_at).toLocaleDateString("en-IN", {
                                  day: "2-digit", month: "short", year: "numeric"
                                })
                              : "—"}
                            {/* ✅ Use Box instead of Typography to avoid p > div nesting */}
                            <Box>
                              <Typography fontSize={10} color="text.disabled">
                                {r.created_at
                                  ? new Date(r.created_at).toLocaleTimeString("en-IN", {
                                      hour: "2-digit", minute: "2-digit"
                                    })
                                  : ""}
                              </Typography>
                              {r.status === "Converted" ? (
                                <Chip
                                  label={r.converted_resume_id ? `→ ${r.converted_resume_id}` : "Converted"}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontSize: 9, height: 16, mt: 0.5 }}
                                />
                              ) : (() => {
                                  const days = daysUntilExpiry(r.created_at);
                                  if (days === null) return null;
                                  if (days <= 0)
                                    return <Chip label="Expired" size="small" color="error" sx={{ fontSize: 9, height: 16, mt: 0.5 }} />;
                                  if (days <= 14)
                                    return <Chip label={`Expires in ${days}d`} size="small" color="warning" sx={{ fontSize: 9, height: 16, mt: 0.5 }} />;
                                  if (days <= 30)
                                    return <Chip label={`${days}d left`} size="small" color="default" sx={{ fontSize: 9, height: 16, mt: 0.5 }} />;
                                  return null;
                                })()
                              }
                            </Box>
                          </TableCell>
                        </TableCell>
                        <TableCell><Chip label={r.parse_status || "pending"} size="small" color={PARSE_COLOR[r.parse_status] || "default"} sx={{ fontSize: 10, fontWeight: 700 }} /></TableCell>
                        <TableCell><Chip label={r.status} size="small" color={RAW_STATUS_COLOR[r.status] || "default"} sx={{ fontSize: 11, fontWeight: 700 }} /></TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title={r.filename ? "View PDF" : "No PDF attached"}>
                              <span>
                                <IconButton
                                  size="small"
                                  sx={{ color: r.filename ? "#c62828" : "#bdbdbd", cursor: r.filename ? "pointer" : "not-allowed" }}
                                  onClick={() => { if (r.filename) { setRawPdfDoc(r); setRawPdfOpen(true); } }}
                                >
                                  <PictureAsPdf fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            {/* Assign / Re-assign to Job — available for ALL statuses */}
                            <Tooltip title={r.status === "Converted" ? "Re-assign to another job" : "Assign to Job"}>
                              <IconButton size="small" sx={{ color: "#0277bd" }} onClick={() => openAssign(r)}>
                                <Work fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {/* Convert — only for non-converted */}
                            {r.status !== "Converted" && (
                              <Tooltip title="Convert to full candidate">
                                <IconButton size="small" sx={{ color: "#2e7d32" }} onClick={() => openConvert(r)}>
                                  <PersonAdd fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* Converted indicator */}
                            {r.status === "Converted" && (
                              <Tooltip title={`Converted → ${r.converted_resume_id}`}>
                                <IconButton size="small" sx={{ color: "#2e7d32" }} disableRipple>
                                  <CheckCircle fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* Delete — only for non-converted */}
                            {r.status !== "Converted" && (
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={async () => { await deleteRaw(r._id); loadRaw(); }}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Card>
          )}
        </>
      )}

      {/* ── PDF viewers ──────────────────────────────────────────────────────── */}
      <PdfViewerDialog    open={pdfOpen}    onClose={() => setPdfOpen(false)}    candidate={selected} />
      <RawPdfViewerDialog open={rawPdfOpen} onClose={() => setRawPdfOpen(false)} raw={rawPdfDoc} />

      {/* ── Candidate Detail Dialog ──────────────────────────────────────────────── */}
<Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth
  PaperProps={{ sx: { minHeight: "80vh" } }}>
  <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 0 }}>
    <Box display="flex" alignItems="center" justifyContent="space-between" pb={0}>
      <Typography fontWeight={700} fontSize={18}>Candidate Details</Typography>
      <IconButton size="small" onClick={() => setDetailOpen(false)}><CloseIcon fontSize="small" /></IconButton>
    </Box>
    <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mt: 1 }}>
      <Tab label="Profile" />
      <Tab label={
        <Box display="flex" alignItems="center" gap={0.8}>
          Pipeline
          {candidateTracking && (
            <Chip
              label={candidateTracking.current_stage}
              size="small"
              sx={{ fontSize: 9, height: 16, bgcolor: "#e8eaf6", color: "#1a237e", fontWeight: 700 }}
            />
          )}
        </Box>
      } />
    </Tabs>
  </DialogTitle>

  {/* ── Tab 0: Profile ── */}
  {detailTab === 0 && selected && (
    <CandidateDetailContent
      candidate={selected}
      jobs={jobs}
      recruiters={recruiters}
      onClose={() => setDetailOpen(false)}
      onEdit={() => { setDetailOpen(false); openEdit(selected); }}
      onViewPdf={() => { setDetailOpen(false); openPdf(selected); }}
    />
  )}

  {/* ── Tab 1: Pipeline Tracking ── */}
  {/* {detailTab === 1 && (
    <DialogContent sx={{ pt: 2 }}>
      {trackingError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTrackingError("")}>{trackingError}</Alert>
      )}

      {trackingLoading && (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      )}

    
      {!trackingLoading && !candidateTracking && (
        <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={2}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: "#e8eaf6" }}>
            <AccountTree sx={{ fontSize: 32, color: "#9fa8da" }} />
          </Avatar>
          <Typography variant="h6" color="text.secondary">Not in pipeline yet</Typography>
          <Typography fontSize={13} color="text.disabled" textAlign="center">
            Start tracking <strong>{selected?.name}</strong> through the interview pipeline.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleStartTracking}>
            Start Tracking
          </Button>
        </Box>
      )}


      {!trackingLoading && candidateTracking && (
        <Box display="flex" flexDirection="column" gap={2.5}>

     
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography fontSize={11} fontWeight={700} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} mb={1.5}>
                Current Pipeline Stage
              </Typography>
              <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                <TextField
                  select size="small" label="Stage"
                  value={trackingStage}
                  onChange={e => setTrackingStage(e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  {[
                    "Screening","Technical Round 1","Technical Round 2","HR Round",
                    "Manager Round","Final Round","Offer Stage","Negotiation",
                    "Offer Accepted","Offer Declined","Joined","Rejected","Withdrawn"
                  ].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <Button
                  variant="contained" size="small"
                  disabled={trackingStage === candidateTracking.current_stage || trackingLoading}
                  onClick={() => handleTrackingStageUpdate(trackingStage)}
                >
                  Update Stage
                </Button>
                <Chip
                  label={candidateTracking.pipeline_status}
                  size="small"
                  color={candidateTracking.pipeline_status === "Active" ? "success" : "default"}
                  sx={{ fontWeight: 700, fontSize: 11 }}
                />
              </Box>
              {candidateTracking.recruiter && (
                <Typography fontSize={12} color="text.secondary" mt={1}>
                  👤 Recruiter: <strong>{candidateTracking.recruiter}</strong>
                </Typography>
              )}
            </CardContent>
          </Card>

          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography fontSize={13} fontWeight={700} color="text.primary">
                Interview Feedback ({candidateTracking.interviews?.length || 0})
              </Typography>
              <Button
                size="small" variant="outlined" startIcon={<Chat />}
                onClick={() => setTrackingIvOpen(true)}
              >
                Add Feedback
              </Button>
            </Box>

            {(!candidateTracking.interviews || candidateTracking.interviews.length === 0) ? (
              <Box p={2} bgcolor="#f5f7fa" borderRadius={2} textAlign="center">
                <Typography fontSize={12} color="text.disabled">No interview feedback recorded yet.</Typography>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {[...candidateTracking.interviews].reverse().map((iv, i) => (
                  <Card key={i} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 1.8, "&:last-child": { pb: 1.8 } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip label={iv.stage || "Interview"} size="small"
                            sx={{ fontSize: 10, bgcolor: "#e8eaf6", color: "#1a237e", fontWeight: 700 }} />
                          <Typography fontSize={12} fontWeight={600}>{iv.interviewer}</Typography>
                          {iv.interview_type && (
                            <Chip label={iv.interview_type} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                          )}
                        </Box>
                        <Box display="flex" gap={0.3}>
                          {[1,2,3,4,5].map(n => (
                            <Box key={n} sx={{ color: n <= (iv.feedback_score||0) ? "#f9a825" : "#e0e0e0", fontSize: 14 }}>★</Box>
                          ))}
                        </Box>
                      </Box>
                      {iv.recommendation && (
                        <Chip label={iv.recommendation} size="small"
                          color={iv.recommendation === "Strong Hire" || iv.recommendation === "Hire" ? "success"
                            : iv.recommendation === "No Hire" ? "error" : "default"}
                          sx={{ fontSize: 10, fontWeight: 700, mb: 0.8 }} />
                      )}
                      {iv.feedback_summary && (
                        <Typography fontSize={12} color="text.secondary" lineHeight={1.6}>
                          {iv.feedback_summary}
                        </Typography>
                      )}
                      {iv.strengths?.length > 0 && (
                        <Box mt={0.8}>
                          <Typography fontSize={10} fontWeight={700} color="success.main">Strengths:</Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.3}>
                            {iv.strengths.map((s, j) => (
                              <Chip key={j} label={s} size="small" sx={{ fontSize: 10, bgcolor: "#e8f5e9", color: "#2e7d32" }} />
                            ))}
                          </Box>
                        </Box>
                      )}
                      {iv.weaknesses?.length > 0 && (
                        <Box mt={0.8}>
                          <Typography fontSize={10} fontWeight={700} color="warning.main">Areas to improve:</Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.3}>
                            {iv.weaknesses.map((w, j) => (
                              <Chip key={j} label={w} size="small" sx={{ fontSize: 10, bgcolor: "#fff8e1", color: "#e65100" }} />
                            ))}
                          </Box>
                        </Box>
                      )}
                      <Typography fontSize={10} color="text.disabled" mt={0.8}>
                        {iv.interview_date ? new Date(iv.interview_date).toLocaleString("en-IN") : ""}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

     
          {candidateTracking.stage_history?.length > 0 && (
            <Box>
              <Typography fontSize={13} fontWeight={700} color="text.primary" mb={1}>
                Stage History
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.8}>
                {[...candidateTracking.stage_history].reverse().map((h, i) => (
                  <Box key={i} display="flex" alignItems="center" gap={1.5}
                    sx={{ p: 1.2, bgcolor: "#f5f7fa", borderRadius: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#1a237e", flexShrink: 0 }} />
                    <Typography fontSize={12} fontWeight={600} sx={{ minWidth: 160 }}>{h.stage}</Typography>
                    <Typography fontSize={11} color="text.secondary">
                      {h.entered_at ? new Date(h.entered_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : ""}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

        </Box>
      )}
    </DialogContent>
  )} */}


{detailTab === 1 && (
  <DialogContent sx={{ pt: 2 }}>
    {trackingError && (
      <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTrackingError("")}>
        {trackingError}
      </Alert>
    )}

    {trackingLoading && (
      <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
    )}

    {!trackingLoading && !candidateTracking && (
      <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={2}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: "#e8eaf6" }}>
          <AccountTree sx={{ fontSize: 32, color: "#9fa8da" }} />
        </Avatar>
        <Typography variant="h6" color="text.secondary">Not in pipeline yet</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleStartTracking}>
          Start Tracking
        </Button>
      </Box>
    )}

    {!trackingLoading && candidateTracking && (
      <Box display="flex" flexDirection="column" gap={2.5}>

        {/* Stage card */}
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography fontSize={11} fontWeight={700} color="text.secondary"
              textTransform="uppercase" letterSpacing={0.5} mb={1.5}>
              Current Pipeline Stage
            </Typography>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <TextField
                select size="small" label="Stage"
                value={trackingStage}
                onChange={e => setTrackingStage(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                {[
                  "Screening","Technical Round 1","Technical Round 2","HR Round",
                  "Manager Round","Final Round","Offer Stage","Negotiation",
                  "Offer Accepted","Offer Declined","Joined","Rejected","Withdrawn"
                ].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <Button
                variant="contained" size="small"
                disabled={trackingStage === candidateTracking.current_stage || trackingLoading}
                onClick={() => handleTrackingStageUpdate(trackingStage)}
              >
                Update Stage
              </Button>
              <Chip
                label={candidateTracking.pipeline_status}
                size="small"
                color={candidateTracking.pipeline_status === "Active" ? "success" : "default"}
              />
            </Box>
          </CardContent>
        </Card>

        {/* ── Schedule Interview Card ── */}
        <ScheduleInterviewCard
          tracking={candidateTracking}
          candidate={selected}
          onScheduled={() => {
            // Reload tracking after scheduling
            getTrackingByResume(selected.resume_id)
              .then(res => setCandidateTracking(res.data?.[0] || null))
              .catch(() => {});
          }}
        />

        {/* Interview feedback */}
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography fontSize={13} fontWeight={700}>
              Interview Feedback ({candidateTracking.interviews?.length || 0})
            </Typography>
            <Button size="small" variant="outlined" startIcon={<Chat />}
              onClick={() => setTrackingIvOpen(true)}>
              Add Feedback
            </Button>
          </Box>

          {(!candidateTracking.interviews || candidateTracking.interviews.length === 0) ? (
            <Box p={2} bgcolor="#f5f7fa" borderRadius={2} textAlign="center">
              <Typography fontSize={12} color="text.disabled">No interview feedback yet.</Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.5}>
              {[...candidateTracking.interviews].reverse().map((iv, i) => (
                <Card key={i} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.8, "&:last-child": { pb: 1.8 } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip label={iv.stage || "Interview"} size="small"
                          sx={{ fontSize: 10, bgcolor: "#e8eaf6", color: "#1a237e", fontWeight: 700 }} />
                        <Typography fontSize={12} fontWeight={600}>{iv.interviewer}</Typography>
                      </Box>
                      <Box display="flex" gap={0.3}>
                        {[1,2,3,4,5].map(n => (
                          <Box key={n} sx={{ color: n <= (iv.feedback_score||0) ? "#f9a825" : "#e0e0e0", fontSize: 14 }}>★</Box>
                        ))}
                      </Box>
                    </Box>
                    {iv.recommendation && (
                      <Chip label={iv.recommendation} size="small"
                        color={["Strong Hire","Hire"].includes(iv.recommendation) ? "success"
                          : iv.recommendation === "No Hire" ? "error" : "default"}
                        sx={{ fontSize: 10, fontWeight: 700, mb: 0.8 }} />
                    )}
                    {iv.feedback_summary && (
                      <Typography fontSize={12} color="text.secondary" lineHeight={1.6}>
                        {iv.feedback_summary}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>

      </Box>
    )}
  </DialogContent>
)}
</Dialog>

{/* ── Tracking Interview Feedback Dialog (from Detail View) ──────────────── */}
<Dialog open={trackingIvOpen} onClose={() => setTrackingIvOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
    Add Interview Feedback
    {candidateTracking && (
      <Typography fontSize={12} color="text.secondary" mt={0.3}>
        {selected?.name} · {candidateTracking.current_stage}
      </Typography>
    )}
  </DialogTitle>
  <form onSubmit={handleTrackingIvSave}>
    <DialogContent sx={{ pt: 2.5 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" required label="Your Name (Interviewer)"
            value={trackingIvData.interviewer}
            onChange={e => setTrackingIvData(p => ({ ...p, interviewer: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select fullWidth size="small" label="Interview Type"
            value={trackingIvData.interview_type}
            onChange={e => setTrackingIvData(p => ({ ...p, interview_type: e.target.value }))}>
            {["Phone","Video","In-Person","Panel"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select fullWidth size="small" label="Rating (1–5)"
            value={trackingIvData.feedback_score}
            onChange={e => setTrackingIvData(p => ({ ...p, feedback_score: e.target.value }))}>
            {[1,2,3,4,5].map(n => (
              <MenuItem key={n} value={n}>{n} — {["Poor","Below Avg","Average","Good","Excellent"][n-1]}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select fullWidth size="small" label="Recommendation"
            value={trackingIvData.recommendation}
            onChange={e => setTrackingIvData(p => ({ ...p, recommendation: e.target.value }))}>
            {["Strong Hire","Hire","Maybe","No Hire"].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Strengths (comma-separated)"
            value={trackingIvData.strengths}
            onChange={e => setTrackingIvData(p => ({ ...p, strengths: e.target.value }))}
            placeholder="e.g. Communication, Problem Solving" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Weaknesses (comma-separated)"
            value={trackingIvData.weaknesses}
            onChange={e => setTrackingIvData(p => ({ ...p, weaknesses: e.target.value }))}
            placeholder="e.g. System Design, Leadership" />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline rows={4} size="small" label="Feedback Summary"
            value={trackingIvData.feedback_summary}
            onChange={e => setTrackingIvData(p => ({ ...p, feedback_summary: e.target.value }))}
            placeholder="Detailed feedback about the interview..." />
        </Grid>
      </Grid>
      {trackingError && <Alert severity="error" sx={{ mt: 2 }}>{trackingError}</Alert>}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
      <Button onClick={() => setTrackingIvOpen(false)}>Cancel</Button>
      <Button type="submit" variant="contained" disabled={trackingSaving}>
        {trackingSaving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
        Submit Feedback
      </Button>
    </DialogActions>
  </form>
</Dialog>

      {/* ── AI Score Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={scoreOpen} onClose={() => setScoreOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 1.5 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Analytics sx={{ color: "#7b1fa2" }} />
              <Box>
                <Typography fontWeight={700}>AI Match Score</Typography>
                <Typography fontSize={11} color="text.secondary">
                  {scoreTarget?.name} vs {scoreData?.job_title || "…"}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setScoreOpen(false)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          {scoreLoading && (
            <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={2}>
              <CircularProgress size={48} sx={{ color: "#7b1fa2" }} />
              <Typography color="text.secondary" fontSize={13}>Analysing candidate with AI…</Typography>
            </Box>
          )}

          {!scoreLoading && scoreData && (() => {
            const s = scoreData;
            const verdictColor = {
              "Strong match":   { bg: "#e8f5e9", color: "#1b5e20" },
              "Good match":     { bg: "#e3f2fd", color: "#0d47a1" },
              "Moderate match": { bg: "#fff8e1", color: "#e65100" },
              "Weak match":     { bg: "#fce4ec", color: "#880e4f" },
            }[s.verdict] || { bg: "#f5f5f5", color: "#424242" };

            const ScoreBar = ({ label, value }) => (
              <Box display="flex" alignItems="center" gap={1.5} mb={1.2}>
                <Typography fontSize={12} color="text.primary" sx={{ width: 130, flexShrink: 0 }}>{label}</Typography>
                <Box flex={1} height={6} bgcolor="#e0e0e0" borderRadius={4} overflow="hidden">
                  <Box height="100%" borderRadius={4} bgcolor={barColor(value)} sx={{ width: `${value}%`, transition: "width 0.6s ease" }} />
                </Box>
                <Typography fontSize={12} fontWeight={600} sx={{ width: 32, textAlign: "right", color: barColor(value) }}>{value}</Typography>
              </Box>
            );

            return (
              <Box>
                {/* Overall score + verdict */}
                <Box display="flex" alignItems="center" gap={2.5} mb={2.5} pb={2} sx={{ borderBottom: "1px solid #e0e0e0" }}>
                  <Box sx={{ width: 80, height: 80, borderRadius: "50%", border: `4px solid ${barColor(s.overall_score)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Typography fontSize={22} fontWeight={700} color={barColor(s.overall_score)} lineHeight={1}>{s.overall_score}</Typography>
                    <Typography fontSize={10} color="text.secondary">/100</Typography>
                  </Box>
                  <Box>
                    <Typography fontSize={14} fontWeight={600} color="text.primary">{scoreTarget?.name}</Typography>
                    <Typography fontSize={12} color="text.secondary" mt={0.3}>{scoreTarget?.current_role} · {scoreTarget?.experience} yrs</Typography>
                    <Box display="inline-block" mt={0.8} px={1.5} py={0.4} borderRadius={20}
                      sx={{ bgcolor: verdictColor.bg, color: verdictColor.color, fontSize: 12, fontWeight: 600 }}>
                      {s.verdict}
                    </Box>
                  </Box>
                </Box>

                {/* Breakdown */}
                <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.6} mb={1.2}>Score breakdown</Typography>
                <ScoreBar label="Skills match"     value={s.skills_score}     />
                <ScoreBar label="Experience fit"   value={s.experience_score} />
                <ScoreBar label="Salary alignment" value={s.salary_score}     />
                <ScoreBar label="Notice period"    value={s.notice_score}     />
                <ScoreBar label="Location"         value={s.location_score}   />

                {/* Strengths */}
                {s.strengths?.length > 0 && (
                  <Box mt={2} p={1.5} bgcolor="#e8f5e9" borderRadius={2} border="1px solid #a5d6a7">
                    <Typography fontSize={11} fontWeight={700} color="#2e7d32" textTransform="uppercase" letterSpacing={0.5} mb={0.8}>Strengths</Typography>
                    {s.strengths.map((g, i) => (
                      <Box key={i} display="flex" alignItems="flex-start" gap={0.8} mb={0.5}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#2e7d32", mt: 0.6, flexShrink: 0 }} />
                        <Typography fontSize={12} color="#1b5e20">{g}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Gaps */}
                {s.gaps?.length > 0 && (
                  <Box mt={1.5} p={1.5} bgcolor="#fff8e1" borderRadius={2} border="1px solid #ffe082">
                    <Typography fontSize={11} fontWeight={700} color="#e65100" textTransform="uppercase" letterSpacing={0.5} mb={0.8}>Gaps identified</Typography>
                    {s.gaps.map((g, i) => (
                      <Box key={i} display="flex" alignItems="flex-start" gap={0.8} mb={0.5}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#f57c00", mt: 0.6, flexShrink: 0 }} />
                        <Typography fontSize={12} color="#bf360c">{g}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* AI Summary */}
                <Box mt={1.5} p={1.5} bgcolor="#f5f5f5" borderRadius={2} border="0.5px solid #e0e0e0">
                  <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={0.5}>AI summary</Typography>
                  <Typography fontSize={12} color="text.primary" lineHeight={1.7}>{s.summary}</Typography>
                </Box>

                {s.scored_at && (
                  <Typography fontSize={10} color="text.disabled" mt={1.5} textAlign="right">
                    Scored {new Date(s.scored_at).toLocaleString("en-IN")}
                  </Typography>
                )}
              </Box>
            );
          })()}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={reScore} disabled={scoreLoading} size="small" startIcon={scoreLoading ? <CircularProgress size={14} /> : null}>
            Re-score
          </Button>
          <Box flex={1} />
          <Button onClick={() => setScoreOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Assign to Job ─────────────────────────────────────────────────────── */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Work color="primary" />
            {assignTarget?.status === "Converted" ? "Re-assign to Another Job" : "Assign to Job"}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {assignTarget && (
            <Box mb={2.5} p={1.5} bgcolor="#f3e5f5" borderRadius={2}>
              <Typography fontSize={12} color="text.secondary">
                {assignTarget.status === "Converted" ? "Re-assigning converted resume:" : "Assigning resume:"}
              </Typography>
              <Typography fontWeight={700}>{assignTarget.name || assignTarget.original_name}</Typography>
              <Typography fontSize={12} color="text.secondary">{assignTarget.raw_id}</Typography>
              {assignTarget.status === "Converted" && assignTarget.converted_resume_id && (
                <Typography fontSize={11} color="success.main" mt={0.5}>
                  Already converted → {assignTarget.converted_resume_id}
                </Typography>
              )}
              {assignTarget.linked_job_id && (
                <Typography fontSize={11} color="#0277bd" mt={0.5}>
                  Currently linked to: {assignTarget.linked_job_id} — {assignTarget.linked_job_title}
                </Typography>
              )}
            </Box>
          )}
          <TextField select fullWidth size="small" label="Select Job *" value={assignJobId} onChange={e => setAssignJobId(e.target.value)}>
            <MenuItem value="">— Choose a job posting —</MenuItem>
            {jobs.map(j => <MenuItem key={j._id} value={j._id}><Box><Typography fontSize={13} fontWeight={600}>{j.job_id} — {j.title}</Typography>{j.client_name && <Typography fontSize={11} color="text.secondary">{j.client_name}</Typography>}</Box></MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} disabled={!assignJobId || assignSaving} startIcon={assignSaving ? <CircularProgress size={16} color="inherit" /> : <Work />}>{assignSaving ? "Assigning…" : "Assign"}</Button>
        </DialogActions>
      </Dialog>

      {/* ── Convert to Candidate ─────────────────────────────────────────────── */}
      <Dialog open={convertOpen} onClose={() => setConvertOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1}><PersonAdd color="success" />Convert to Candidate</Box></DialogTitle>
        <form onSubmit={handleConvert}>
          <DialogContent sx={{ pt: 3 }}>
            {convertTarget && <Box mb={2} p={1.5} bgcolor="#e8f5e9" borderRadius={2} display="flex" alignItems="center" gap={1.5}><SwapHoriz color="success" /><Box><Typography fontSize={12} color="text.secondary">Converting stored resume to full candidate</Typography><Typography fontWeight={700} fontSize={13}>{convertTarget.raw_id} — {convertTarget.original_name}</Typography></Box></Box>}
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Full Name *" name="name" value={convertData.name} onChange={handleConvertChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required type="email" label="Email *" name="email" value={convertData.email} onChange={handleConvertChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" name="phone" value={convertData.phone} onChange={handleConvertChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Location" name="location" value={convertData.location} onChange={handleConvertChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Role" name="current_role" value={convertData.current_role} onChange={handleConvertChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Company" name="current_company" value={convertData.current_company} onChange={handleConvertChange} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Experience (yrs)" name="experience" value={convertData.experience} onChange={handleConvertChange} inputProps={{ min: 0 }} /></Grid>
              <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Source" name="source" value={convertData.source} onChange={handleConvertChange}>{SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Status" name="status" value={convertData.status} onChange={handleConvertChange}>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12}><TextField fullWidth multiline rows={2} size="small" label="Skills (comma-separated)" name="skills" value={convertData.skills} onChange={handleConvertChange} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Current Salary (₹)" name="current_salary" value={convertData.current_salary} onChange={handleConvertChange} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={convertData.expected_salary} onChange={handleConvertChange} /></Grid>
              <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Notice Period" name="notice_period" value={convertData.notice_period} onChange={handleConvertChange}>{NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12}><TextField select fullWidth size="small" label="Link to Job" name="linked_job_id" value={convertData.linked_job_mongo_id || ""} onChange={handleConvertChange}><MenuItem value="">No Job Linked</MenuItem>{jobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} — {j.title}{j.client_name ? ` (${j.client_name})` : ""}</MenuItem>)}</TextField></Grid>
            </Grid>
            <TextField fullWidth multiline rows={2} size="small" label="Notes" name="notes" value={convertData.notes} onChange={handleConvertChange} />
            {convertError && <Alert severity="error" sx={{ mt: 2 }}>{convertError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={convertSaving} startIcon={convertSaving ? <CircularProgress size={16} color="inherit" /> : <PersonAdd />}>{convertSaving ? "Converting…" : "Convert to Candidate"}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Bulk Review Dialog ────────────────────────────────────────────────── */}
      <Dialog open={bulkOpen} onClose={closeBulk} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: "80vh" } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1.5}><CloudUpload color="primary" /><Box><Typography fontWeight={700} fontSize="1.1rem">Review &amp; Save Candidates</Typography><Typography fontSize={12} color="text.secondary">AI-extracted details pre-filled · PDFs already saved · review and confirm each</Typography></Box></Box></DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {!bulkDone && currentEntry && (
            <Box>
              <Box sx={{ borderBottom: "1px solid #e0e0e0", px: 3, pt: 2 }}>
                <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
                  {bulkFiles.map((entry, i) => <Chip key={i} label={`${i + 1}. ${entry.file.name.replace(".pdf", "").slice(0, 22)}`} onClick={() => setBulkStep(i)} color={entry.saved ? "success" : i === bulkStep ? "primary" : "default"} variant={i === bulkStep ? "filled" : "outlined"} size="small" icon={entry.saved ? <CheckCircle fontSize="small" /> : undefined} sx={{ cursor: "pointer", fontWeight: i === bulkStep ? 700 : 400 }} />)}
                </Box>
                <Box display="flex" alignItems="center" gap={1} pb={1.5} flexWrap="wrap">
                  <Typography fontSize={12} color="text.secondary">{savedCount} of {bulkFiles.length} saved &bull; Reviewing: <strong>{currentEntry.file.name}</strong></Typography>
                  {currentEntry.status === "error" && <Chip label="Fill manually" size="small" color="warning" sx={{ fontSize: 10 }} />}
                  {currentEntry.status === "done" && !currentEntry.saved && <Chip label="AI-parsed ✓" size="small" color="info" sx={{ fontSize: 10 }} />}
                  {currentEntry.file_id && <Chip label="PDF stored ✓" size="small" color="success" variant="outlined" sx={{ fontSize: 10 }} />}
                </Box>
              </Box>
              <Box p={3}>
                {currentEntry.saved ? (
                  <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={2}><CheckCircle color="success" sx={{ fontSize: 56 }} /><Typography fontWeight={700} color="success.main">Saved successfully!</Typography>{bulkStep < bulkFiles.length - 1 && <Button variant="outlined" onClick={() => setBulkStep(s => s + 1)}>Next Resume →</Button>}</Box>
                ) : (
                  <>
                    <Grid container spacing={2} mb={2}>
                      <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Full Name" name="name" value={currentEntry.formData.name} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required type="email" label="Email" name="email" value={currentEntry.formData.email} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Phone" name="phone" value={currentEntry.formData.phone} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Location" name="location" value={currentEntry.formData.location} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Role" name="current_role" value={currentEntry.formData.current_role} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Company" name="current_company" value={currentEntry.formData.current_company} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Experience (yrs)" name="experience" value={currentEntry.formData.experience} onChange={handleBulkChange} inputProps={{ min: 0 }} /></Grid>
                      <Grid item xs={12} sm={4}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Source" name="source" value={currentEntry.formData.source} onChange={handleBulkChange}>{SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
                      <Grid item xs={12} sm={4}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Status" name="status" value={currentEntry.formData.status} onChange={handleBulkChange}>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
                      <Grid item xs={12}><TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={3} size="small" label="Skills (comma-separated)" name="skills" value={currentEntry.formData.skills} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Current Salary (₹)" name="current_salary" value={currentEntry.formData.current_salary} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={currentEntry.formData.expected_salary} onChange={handleBulkChange} /></Grid>
                      <Grid item xs={12} sm={4}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Notice Period" name="notice_period" value={currentEntry.formData.notice_period} onChange={handleBulkChange}>{NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
                      <Grid item xs={12}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Link to Job" name="linked_job_id" value={currentEntry.formData.linked_job_id} onChange={handleBulkChange}><MenuItem value="">No Job Linked</MenuItem>{jobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} - {j.title}</MenuItem>)}</TextField></Grid>
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
              <Avatar sx={{ width: 80, height: 80, bgcolor: "#e8f5e9" }}><Done sx={{ fontSize: 48, color: "#2e7d32" }} /></Avatar>
              <Typography variant="h5" fontWeight={800} color="success.main">All Done!</Typography>
              <Typography color="text.secondary">{savedCount} of {bulkFiles.length} candidate{savedCount !== 1 ? "s" : ""} saved.</Typography>
              <Button variant="contained" onClick={closeBulk}>Back to Resume Bank</Button>
            </Box>
          )}
        </DialogContent>
        {!bulkDone && currentEntry && !currentEntry.saved && (
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0", gap: 1 }}>
            <Button disabled={bulkStep === 0} onClick={() => setBulkStep(s => s - 1)} startIcon={<NavigateBefore />}>Previous</Button>
            <Box flex={1} />
            <Button onClick={handleBulkSkip} color="inherit">Skip</Button>
            <Button variant="contained" onClick={handleBulkSave} disabled={bulkSaving || !currentEntry.formData.name || !currentEntry.formData.email} endIcon={bulkSaving ? <CircularProgress size={16} color="inherit" /> : <Done />}>{bulkSaving ? "Saving…" : "Save & Next"}</Button>
          </DialogActions>
        )}
      </Dialog>

      {/* ── Add / Edit Candidate Dialog ──────────────────────────────────────── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>{selected ? "Edit Candidate" : `Add New Candidate${pickedClient ? ` — ${pickedClient.company_name}` : ""}`}</DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 3 }}>
            {!selected && pickedClient && (
              <Box mb={2} px={2} py={1.5} bgcolor="#e3f2fd" borderRadius={2} display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1.5}><Business sx={{ color: "#1565c0" }} /><Box><Typography fontSize={11} color="text.secondary">Adding candidate for</Typography><Typography fontWeight={700} color="primary.dark">{pickedClient.company_name}</Typography></Box></Box>
                <Chip label="Change client" size="small" variant="outlined" onClick={() => { setFormOpen(false); setClientSelectOpen(true); }} sx={{ fontSize: 11, cursor: "pointer" }} />
              </Box>
            )}
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required label="Full Name" name="name" value={formData.name} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" required type="email" label="Email" name="email" value={formData.email} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Phone" name="phone" value={formData.phone} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Location" name="location" value={formData.location} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Role" name="current_role" value={formData.current_role} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" label="Current Company" name="current_company" value={formData.current_company} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Experience (years)" name="experience" value={formData.experience} onChange={handleChange} inputProps={{ min: 0 }} /></Grid>
              <Grid item xs={12} sm={6}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Source" name="source" value={formData.source} onChange={handleChange}>{SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12}><TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={2} label="Skills (comma-separated)" name="skills" value={formData.skills} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Current Salary (₹)" name="current_salary" value={formData.current_salary} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={4}><TextField sx={{ width: "100%", minWidth: 400 }} size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={formData.expected_salary} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={4}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Notice Period" name="notice_period" value={formData.notice_period} onChange={handleChange}>{NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={6}><TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Status" name="status" value={formData.status} onChange={handleChange}>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select sx={{ width: "100%", minWidth: 400 }} size="small" label="Linked Job" name="linked_job_id" value={formData.linked_job_mongo_id || ""} onChange={handleChange}>
                  <MenuItem value="">No Job Linked</MenuItem>
                  {formClientJobs.map(j => <MenuItem key={j._id} value={j._id}>{j.job_id} — {j.title}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <TextField sx={{ width: "100%", minWidth: 400 }} multiline rows={3} size="small" label="Notes" name="notes" value={formData.notes} onChange={handleChange} />
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Resume File (PDF)</Typography>
            <Box onClick={() => formFileRef.current?.click()} sx={{ border: addFile ? "2px solid #2e7d32" : "2px dashed #90caf9", borderRadius: 2, p: 2, display: "flex", alignItems: "center", gap: 2, cursor: "pointer", bgcolor: addFile ? "#f1f8e9" : "#f8fbff", "&:hover": { bgcolor: addFile ? "#e8f5e9" : "#e3f2fd", borderColor: addFile ? "#1b5e20" : "#1565c0" } }}>
              <PictureAsPdf sx={{ fontSize: 32, color: addFile ? "#2e7d32" : "#90caf9", flexShrink: 0 }} />
              <Box flex={1}>{addFile ? <><Typography fontWeight={700} fontSize={13} color="success.dark">{addFile.name}</Typography><Typography fontSize={11} color="text.secondary">{(addFile.size / 1024).toFixed(0)} KB · Click to replace</Typography></> : <><Typography fontWeight={600} fontSize={13} color="primary.dark">{selected?.resume_file ? "Replace resume PDF" : "Attach resume PDF (optional)"}</Typography><Typography fontSize={11} color="text.secondary">{selected?.resume_file ? `Current file: ${selected.resume_file} · click to replace` : "Click to browse · PDF only"}</Typography></>}</Box>
              {addFile && <IconButton size="small" onClick={e => { e.stopPropagation(); setAddFile(null); }}><CloseIcon fontSize="small" /></IconButton>}
              <input ref={formFileRef} type="file" accept=".pdf,application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) setAddFile(f); e.target.value = ""; }} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}{selected ? "Update" : "Add Candidate"}</Button>
          </DialogActions>
        </form>
      </Dialog>




{/* ── Send Exam Dialog ─────────────────────────────────────────────────── */}
<Dialog open={examOpen} onClose={() => { if (!examSending) setExamOpen(false); }} maxWidth="sm" fullWidth>
  <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", pb: 1.5 }}>
    <Box display="flex" alignItems="center" gap={1.5}>
      <Avatar sx={{ bgcolor: "#fff3e0", width: 36, height: 36 }}>
        <Assignment sx={{ fontSize: 20, color: "#e65100" }} />
      </Avatar>
      <Box>
        <Typography fontWeight={700}>Send Screening Exam</Typography>
        <Typography fontSize={11} color="text.secondary">
          {examCandidate?.name} · {examCandidate?.email}
        </Typography>
      </Box>
    </Box>
  </DialogTitle>

  <DialogContent sx={{ pt: 2.5 }}>
    {examSuccess ? (
      <Box display="flex" flexDirection="column" alignItems="center" py={3} gap={2}>
        <CheckCircle sx={{ fontSize: 64, color: "#2e7d32" }} />
        <Typography fontWeight={700} color="success.main" fontSize={16}>Exam Sent Successfully!</Typography>
        <Alert severity="success" sx={{ width: "100%", fontSize: 12 }}>
          {examSuccess}
        </Alert>
        <Typography fontSize={12} color="text.secondary" textAlign="center">
          The candidate will receive an email with the exam link. You'll get a notification when they submit.
        </Typography>
      </Box>
    ) : (
      <>
        {/* Job selector */}
        <TextField
          select fullWidth size="small" label="Select Job *"
          value={examConfig.job_id}
          onChange={e => handleExamJobChange(e.target.value)}
          sx={{ mb: 2 }}
        >
          <MenuItem value="">— Choose a job posting —</MenuItem>
          {jobs.map(j => (
            <MenuItem key={j._id} value={j._id}>
              <Box>
                <Typography fontSize={13} fontWeight={600}>{j.job_id} — {j.title}</Typography>
                {j.client_name && <Typography fontSize={11} color="text.secondary">{j.client_name}</Typography>}
              </Box>
            </MenuItem>
          ))}
        </TextField>

        {/* Question bank info */}
        {selectedExamJob && (
          <Box mb={2} p={1.5} bgcolor="#f5f7fa" borderRadius={2} border="1px solid #e0e0e0">
            <Typography fontSize={11} fontWeight={700} color="text.secondary"
              textTransform="uppercase" letterSpacing={0.5} mb={0.8}>
              Available in question bank
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip label={`${selectedExamJob.mcq_questions_count || 0} MCQ available`}
                size="small" sx={{ bgcolor: "#f3e5f5", color: "#7b1fa2", fontSize: 11 }} />
              <Chip label={`${selectedExamJob.subjective_questions_count || 0} Subjective available`}
                size="small" sx={{ bgcolor: "#e3f2fd", color: "#0277bd", fontSize: 11 }} />
              <Chip label={`${selectedExamJob.coding_questions_count || 0} Coding available`}
                size="small" sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontSize: 11 }} />
            </Box>
          </Box>
        )}

        {/* Question counts */}
        <Typography fontSize={12} fontWeight={700} color="text.primary" mb={1.5}>
          Questions to send (randomly selected from bank)
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="MCQ Questions"
              value={examConfig.mcq_count}
              onChange={e => setExamConfig(p => ({ ...p, mcq_count: Math.max(0, Math.min(selectedExamJob?.mcq_questions_count || 0, Number(e.target.value))) }))}
              inputProps={{ min: 0, max: selectedExamJob?.mcq_questions_count || 0 }}
              helperText={`Max ${selectedExamJob?.mcq_questions_count || 0}`}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="Subjective"
              value={examConfig.subjective_count}
              onChange={e => setExamConfig(p => ({ ...p, subjective_count: Math.max(0, Math.min(selectedExamJob?.subjective_questions_count || 0, Number(e.target.value))) }))}
              inputProps={{ min: 0, max: selectedExamJob?.subjective_questions_count || 0 }}
              helperText={`Max ${selectedExamJob?.subjective_questions_count || 0}`}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="Coding"
              value={examConfig.coding_count}
              onChange={e => setExamConfig(p => ({ ...p, coding_count: Math.max(0, Math.min(selectedExamJob?.coding_questions_count || 0, Number(e.target.value))) }))}
              inputProps={{ min: 0, max: selectedExamJob?.coding_questions_count || 0 }}
              helperText={`Max ${selectedExamJob?.coding_questions_count || 0}`}
            />
          </Grid>
        </Grid>

        {/* Time & expiry */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" type="number" label="Time Limit (minutes)"
              value={examConfig.time_limit_minutes}
              onChange={e => setExamConfig(p => ({ ...p, time_limit_minutes: Math.max(10, Number(e.target.value)) }))}
              inputProps={{ min: 10 }}
              helperText="Minimum 10 minutes"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" type="number" label="Link Expires In (days)"
              value={examConfig.expires_in_days}
              onChange={e => setExamConfig(p => ({ ...p, expires_in_days: Math.max(1, Number(e.target.value)) }))}
              inputProps={{ min: 1, max: 30 }}
              helperText="Days before link expires"
            />
          </Grid>
        </Grid>

        {/* Summary */}
        <Box p={1.5} bgcolor="#e8f5e9" borderRadius={2} border="1px solid #a5d6a7" mb={1}>
          <Typography fontSize={12} color="#1b5e20">
            <strong>{examConfig.mcq_count + examConfig.subjective_count + examConfig.coding_count} questions</strong> will be randomly selected and sent to <strong>{examCandidate?.email}</strong> with a <strong>{examConfig.time_limit_minutes} minute</strong> time limit.
          </Typography>
        </Box>

        {examError && <Alert severity="error" sx={{ mt: 1 }}>{examError}</Alert>}
      </>
    )}
  </DialogContent>

  <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
    <Button onClick={() => setExamOpen(false)} disabled={examSending}>
      {examSuccess ? "Close" : "Cancel"}
    </Button>
    {!examSuccess && (
      <Button variant="contained" onClick={handleSendExam} disabled={examSending}
        startIcon={examSending ? <CircularProgress size={16} color="inherit" /> : <Assignment />}
        sx={{ bgcolor: "#e65100", "&:hover": { bgcolor: "#bf360c" } }}>
        {examSending ? "Sending…" : "Send Exam"}
      </Button>
    )}
  </DialogActions>
</Dialog>


      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete Candidate</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete <strong>{selected?.name}</strong>?</Typography>{selected?.resume_file && <Alert severity="warning" sx={{ mt: 1.5 }}>The uploaded resume PDF will also be permanently deleted.</Alert>}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="contained" color="error" onClick={handleDelete}>Delete</Button></DialogActions>
      </Dialog>

      {/* ── Client Select Dialog ──────────────────────────────────────────────── */}
      <Dialog open={clientSelectOpen} onClose={() => setClientSelectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1}><Business color="primary" />Select Client for this Candidate</Box></DialogTitle>
        <DialogContent sx={{ pt: 2.5, pb: 1 }}>
          <Typography fontSize={13} color="text.secondary" mb={2}>Choose the client this candidate is being added for. Their job postings will be pre-loaded in the next step.</Typography>
          <Box display="flex" flexDirection="column" gap={1.5}>
            {clients.map(c => {
              const clientJobs = jobs.filter(j => j.client_id === c._id || j.client_name === c.company_name);
              return (
                <Box key={c._id} onClick={() => handleClientPicked(c)} sx={{ p: 2, borderRadius: 2, border: "1.5px solid #e0e0e0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s", "&:hover": { bgcolor: "#e3f2fd", borderColor: "#1565c0" } }}>
                  <Box display="flex" alignItems="center" gap={1.5}><Avatar sx={{ width: 40, height: 40, bgcolor: "#1a237e", fontSize: 14, fontWeight: 700 }}>{c.company_name?.[0]?.toUpperCase() || "C"}</Avatar><Box><Typography fontWeight={700} fontSize={14}>{c.company_name}</Typography><Typography fontSize={12} color="text.secondary">{clientJobs.length} active job{clientJobs.length !== 1 ? "s" : ""}{clientJobs.length > 0 && ` · ${clientJobs.slice(0, 2).map(j => j.job_id).join(", ")}${clientJobs.length > 2 ? "…" : ""}`}</Typography></Box></Box>
                  <ArrowForward fontSize="small" sx={{ color: "text.disabled" }} />
                </Box>
              );
            })}
            {clients.length === 0 && <Box p={3} textAlign="center"><Typography color="text.secondary" fontSize={13}>No clients found. Add a client first.</Typography></Box>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0", mt: 1 }}><Button onClick={() => setClientSelectOpen(false)}>Cancel</Button></DialogActions>
      </Dialog>

      {/* ── Manual Raw Resume Dialog ──────────────────────────────────────────── */}
      <Dialog open={manualRawOpen} onClose={() => setManualRawOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}><Box display="flex" alignItems="center" gap={1}><EditNote color="secondary" />Add Resume Manually</Box></DialogTitle>
        <form onSubmit={handleManualRawSave}>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="subtitle2" color="primary" mb={1.5} fontWeight={700}>Resume File (PDF) — Optional</Typography>
            <Box onClick={() => manualFileRef.current?.click()} sx={{ border: manualRawFile ? "2px solid #7b1fa2" : "2px dashed #ce93d8", borderRadius: 2, p: 2, display: "flex", alignItems: "center", gap: 2, cursor: "pointer", bgcolor: manualRawFile ? "#f3e5f5" : "#fdf6ff", mb: 3, "&:hover": { bgcolor: "#f3e5f5", borderColor: "#7b1fa2" } }}>
              <PictureAsPdf sx={{ fontSize: 32, color: manualRawFile ? "#7b1fa2" : "#ce93d8", flexShrink: 0 }} />
              <Box flex={1}>{manualRawFile ? <><Typography fontWeight={700} fontSize={13} color="#4a148c">{manualRawFile.name}</Typography><Typography fontSize={11} color="text.secondary">{(manualRawFile.size / 1024).toFixed(0)} KB · Click to replace</Typography></> : <><Typography fontWeight={600} fontSize={13} color="#7b1fa2">Attach resume PDF (optional)</Typography><Typography fontSize={11} color="text.secondary">Click to browse or drag &amp; drop · PDF only</Typography></>}</Box>
              {manualRawFile && <IconButton size="small" onClick={e => { e.stopPropagation(); setManualRawFile(null); }}><CloseIcon fontSize="small" /></IconButton>}
              <input ref={manualFileRef} type="file" accept=".pdf,application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) setManualRawFile(f); e.target.value = ""; }} />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" required label="Full Name " name="name" value={manualRawData.name} onChange={handleManualRawChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" type="email" label="Email" name="email" value={manualRawData.email} onChange={handleManualRawChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Phone" name="phone" value={manualRawData.phone} onChange={handleManualRawChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Location" name="location" value={manualRawData.location} onChange={handleManualRawChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Role" name="current_role" value={manualRawData.current_role} onChange={handleManualRawChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Current Company" name="current_company" value={manualRawData.current_company} onChange={handleManualRawChange} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Experience (yrs)" name="experience" value={manualRawData.experience} onChange={handleManualRawChange} inputProps={{ min: 0 }} /></Grid>
              <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Notice Period" name="notice_period" value={manualRawData.notice_period} onChange={handleManualRawChange}>{NOTICES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Expected Salary (₹)" name="expected_salary" value={manualRawData.expected_salary} onChange={handleManualRawChange} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline rows={2} size="small" label="Skills (comma-separated)" name="skills" value={manualRawData.skills} onChange={handleManualRawChange} /></Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <TextField select fullWidth size="small" label="Link to Job" name="linked_job_id" value={manualRawData.linked_job_mongo_id || ""} onChange={handleManualRawChange} sx={{ mb: 2 }}>
              <MenuItem value="">No Job Linked</MenuItem>
              {jobs.map(j => <MenuItem key={j._id} value={j._id}><Box><Typography fontSize={13} fontWeight={600}>{j.job_id} — {j.title}</Typography>{j.client_name && <Typography fontSize={11} color="text.secondary">{j.client_name}</Typography>}</Box></MenuItem>)}
            </TextField>
            <TextField fullWidth multiline rows={2} size="small" label="Notes" name="notes" value={manualRawData.notes} onChange={handleManualRawChange} />
            {manualRawError && <Alert severity="error" sx={{ mt: 2 }}>{manualRawError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={() => setManualRawOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={manualRawSaving || !manualRawData.name} startIcon={manualRawSaving ? <CircularProgress size={16} color="inherit" /> : <EditNote />}>{manualRawSaving ? "Saving…" : "Add to Stored Resumes"}</Button>
          </DialogActions>
        </form>
      </Dialog>
      <ExamResultsDialog
  open={examResultsOpen}
  onClose={() => setExamResultsOpen(false)}
  candidateId={examResultsTarget?._id}
  candidateName={examResultsTarget?.name}
/>
    </Box>
  );
}