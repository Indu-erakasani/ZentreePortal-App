import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  MenuItem, Table, TableHead, TableBody, TableRow, TableCell,
  Paper, Chip, IconButton, Tooltip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  LinearProgress, Divider, Tabs, Tab, InputAdornment,
} from "@mui/material";
import {
  Add, Search, Visibility, CheckCircle, CloudUpload, Delete,
  Description, AssignmentInd, VerifiedUser, AccountBalance,
  Laptop, People, Close as CloseIcon, Save, Refresh,
  FolderOpen, Warning,
} from "@mui/icons-material";

// ── Design tokens ────────────────────────────────────────────────────────────
const NAVY   = "#0f172a";
const INDIGO = "#1a237e";
const BLUE   = "#1d4ed8";
const SLATE  = "#64748b";

const BASE = process.env.REACT_APP_API_BASE_URL;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

// ── API helpers ───────────────────────────────────────────────────────────────
const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

const getEmployees     = ()           => fetch(`${BASE}/employees/`,                       { headers: authHeaders() }).then(handle);
const getOnboarding    = (eid)        => fetch(`${BASE}/onboarding/${eid}`,                { headers: authHeaders() }).then(handle);
const updateOnboarding = (eid, pl)    => fetch(`${BASE}/onboarding/${eid}`,                { method: "PUT",    headers: authHeaders(), body: JSON.stringify(pl) }).then(handle);
const updateChecklist  = (eid, i, pl) => fetch(`${BASE}/onboarding/${eid}/checklist/${i}`, { method: "PUT",    headers: authHeaders(), body: JSON.stringify(pl) }).then(handle);
const addDocument      = (eid, pl)    => fetch(`${BASE}/onboarding/${eid}/document`,       { method: "POST",   headers: authHeaders(), body: JSON.stringify(pl) }).then(handle);
const updateDocument   = (eid, i, pl) => fetch(`${BASE}/onboarding/${eid}/document/${i}`,  { method: "PUT",    headers: authHeaders(), body: JSON.stringify(pl) }).then(handle);
const deleteDocument   = (eid, i)     => fetch(`${BASE}/onboarding/${eid}/document/${i}`,  { method: "DELETE", headers: authHeaders() }).then(handle);

const uploadDocFile = async (eid, idx, file) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/onboarding/${eid}/document/${idx}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
    body: fd,
  });
  return handle(res);
};

// ── Constants ─────────────────────────────────────────────────────────────────
const DOC_STATUSES  = ["Pending", "Received", "Verified", "Waived"];
const BGV_STATUSES  = ["Not Initiated", "Initiated", "In Progress", "Completed", "Failed"];
const ACCOUNT_TYPES = ["Savings", "Current", "NRE", "NRO"];

const DOC_STATUS_COLOR = {
  Pending:  { bg: "#fff8e1", color: "#e65100", border: "#ffe082" },
  Received: { bg: "#e3f2fd", color: "#0277bd", border: "#90caf9" },
  Verified: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
  Waived:   { bg: "#f3e5f5", color: "#7b1fa2", border: "#ce93d8" },
};

const BGV_COLOR = {
  "Not Initiated": { bg: "#f1f5f9", color: SLATE     },
  "Initiated":     { bg: "#eff6ff", color: BLUE      },
  "In Progress":   { bg: "#fef9c3", color: "#854d0e" },
  "Completed":     { bg: "#dcfce7", color: "#166534" },
  "Failed":        { bg: "#fee2e2", color: "#991b1b" },
};

const DOC_CATEGORIES = {
  Identity:     ["Aadhar Card", "PAN Card", "Passport", "Voter ID", "Driving License"],
  Address:      ["Utility Bill", "Rental Agreement", "Bank Statement (Address Proof)"],
  Education:    ["10th Marksheet", "12th Marksheet", "Graduation Certificate", "PG Certificate", "Professional Certifications"],
  Professional: ["Previous Offer Letter", "Relieving Letter", "Experience Letter", "Last 3 Months Payslips", "Form 16"],
  Medical:      ["Medical Fitness Certificate", "Health Declaration Form"],
  Other:        ["Photograph", "Signed Offer Letter", "Signed NDA", "Signed Employment Agreement"],
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// ── Shared helpers ────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <Box mb={2.5}>
      <Typography sx={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{title}</Typography>
      {subtitle && <Typography sx={{ fontSize: 12, color: SLATE, mt: 0.3 }}>{subtitle}</Typography>}
    </Box>
  );
}

function SaveBar({ onSave, saving, success }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1.5} mt={3}
      pt={2} sx={{ borderTop: "1px solid #f1f5f9" }}>
      {success && <Chip label="Saved ✓" size="small" color="success" sx={{ fontSize: 11 }} />}
      <Button
        variant="contained"
        startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save />}
        onClick={onSave} disabled={saving}
        sx={{ bgcolor: INDIGO, "&:hover": { bgcolor: "#0d1757" } }}
      >
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 0 — OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ employeeId, data, employee, onRefresh }) {
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setForm({
      blood_group:        data?.blood_group        || "",
      personal_email:     data?.personal_email     || "",
      referred_by:        data?.referred_by        || "",
      probation_end_date: data?.probation_end_date ? data.probation_end_date.split("T")[0] : "",
      hr_notes:           data?.hr_notes           || "",
      it_notes:           data?.it_notes           || "",
    });
  }, [data]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setSuccess(false);
    try {
      await updateOnboarding(employeeId, form);
      setSuccess(true);
      onRefresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <SectionHeader title="Personal & Joining Details" subtitle="Basic onboarding information for this employee" />
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <Typography sx={{ fontSize: 11, color: SLATE, fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>Employee ID</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{employee?.emp_id || "—"}</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography sx={{ fontSize: 11, color: SLATE, fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>Name</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{employee?.name || "—"}</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography sx={{ fontSize: 11, color: SLATE, fontWeight: 600, textTransform: "uppercase", mb: 0.5 }}>Joining Date</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: NAVY }}>
            {fmtDate(data?.joining_date || employee?.date_of_joining)}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small" label="Blood Group" name="blood_group"
            value={form.blood_group || ""} onChange={handleChange} placeholder="e.g. O+" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small" label="Personal Email" name="personal_email"
            type="email" value={form.personal_email || ""} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small" label="Referred By" name="referred_by"
            value={form.referred_by || ""} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth size="small" label="Probation End Date" name="probation_end_date"
            type="date" value={form.probation_end_date || ""} onChange={handleChange}
            InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth multiline rows={3} size="small" label="HR Notes"
            name="hr_notes" value={form.hr_notes || ""} onChange={handleChange}
            placeholder="Internal HR notes…" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth multiline rows={3} size="small" label="IT Notes"
            name="it_notes" value={form.it_notes || ""} onChange={handleChange}
            placeholder="IT setup notes…" />
        </Grid>
      </Grid>
      <SaveBar onSave={handleSave} saving={saving} success={success} />
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 1 — CHECKLIST
// ══════════════════════════════════════════════════════════════════════════════
function ChecklistTab({ employeeId, data, onRefresh }) {
  const [items,  setItems]  = useState([]);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (data?.checklist) setItems([...data.checklist]);
  }, [data]);

  const doneCount = items.filter(i => i.done).length;
  const pct       = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const handleToggle = async (idx) => {
    const next = items.map((item, i) => i === idx ? { ...item, done: !item.done } : item);
    setItems(next);
    setSaving(idx);
    try {
      await updateChecklist(employeeId, idx, { done: next[idx].done, remarks: next[idx].remarks || "" });
      onRefresh();
    } catch (err) {
      console.error(err);
      setItems([...items]);
    } finally { setSaving(null); }
  };

  const handleRemarks = (idx, val) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, remarks: val } : item));

  const saveRemarks = async (idx) => {
    setSaving(idx);
    try {
      await updateChecklist(employeeId, idx, { done: items[idx].done, remarks: items[idx].remarks || "" });
      onRefresh();
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  };

  return (
    <Box>
      <Box mb={3} p={2} sx={{ bgcolor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Onboarding Progress</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? "#166534" : INDIGO }}>
            {doneCount} / {items.length} completed
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={pct}
          sx={{ height: 8, borderRadius: 4, bgcolor: "#e2e8f0",
            "& .MuiLinearProgress-bar": { bgcolor: pct === 100 ? "#16a34a" : INDIGO, borderRadius: 4 } }} />
        {pct === 100 && (
          <Box display="flex" alignItems="center" gap={0.8} mt={1}>
            <CheckCircle sx={{ fontSize: 16, color: "#16a34a" }} />
            <Typography sx={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>All checklist items completed!</Typography>
          </Box>
        )}
      </Box>

      <Box display="flex" flexDirection="column" gap={1}>
        {items.map((item, idx) => (
          <Box key={idx} sx={{
            p: 1.8, borderRadius: "10px",
            border: `1px solid ${item.done ? "#bbf7d0" : "#e2e8f0"}`,
            bgcolor: item.done ? "#f0fdf4" : "#fff",
            transition: "all 0.15s",
          }}>
            <Box display="flex" alignItems="flex-start" gap={1.5}>
              <Box
                onClick={() => handleToggle(idx)}
                sx={{
                  width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
                  border: `2px solid ${item.done ? "#16a34a" : "#cbd5e1"}`,
                  bgcolor: item.done ? "#16a34a" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", mt: 0.2, transition: "all 0.15s",
                }}
              >
                {saving === idx
                  ? <CircularProgress size={12} sx={{ color: item.done ? "#fff" : SLATE }} />
                  : item.done && <CheckCircle sx={{ fontSize: 14, color: "#fff" }} />}
              </Box>
              <Box flex={1}>
                <Typography sx={{
                  fontSize: 13, fontWeight: 600,
                  color: item.done ? "#166534" : NAVY,
                  textDecoration: item.done ? "line-through" : "none",
                  mb: 0.5,
                }}>
                  {item.label}
                </Typography>
                <TextField
                  size="small" placeholder="Add remarks…"
                  value={item.remarks || ""}
                  onChange={e => handleRemarks(idx, e.target.value)}
                  onBlur={() => {
                    if (item.remarks !== (data?.checklist?.[idx]?.remarks || "")) saveRemarks(idx);
                  }}
                  sx={{
                    width: "100%",
                    "& .MuiInputBase-input": { fontSize: 12, py: 0.6 },
                    "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  }}
                />
              </Box>
              {item.done && (
                <Chip label="Done" size="small"
                  sx={{ bgcolor: "#dcfce7", color: "#166534", fontSize: 10, fontWeight: 700, height: 20 }} />
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 2 — DOCUMENTS
// ══════════════════════════════════════════════════════════════════════════════
function DocumentsTab({ employeeId, data, onRefresh }) {
  const [addOpen,   setAddOpen]   = useState(false);
  const [addForm,   setAddForm]   = useState({ name: "", category: "Identity", status: "Pending", remarks: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [uploadIdx, setUploadIdx] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const fileRefs = useRef({});

  const docs = data?.documents || [];

  const handleAddDoc = async () => {
    if (!addForm.name) { setError("Document name is required"); return; }
    setAddSaving(true); setError("");
    try {
      await addDocument(employeeId, addForm);
      setAddOpen(false);
      setAddForm({ name: "", category: "Identity", status: "Pending", remarks: "" });
      onRefresh();
    } catch (err) { setError(err?.message || "Failed to add document"); }
    finally { setAddSaving(false); }
  };

  const handleStatusChange = async (idx, status) => {
    try { await updateDocument(employeeId, idx, { status }); onRefresh(); }
    catch (err) { console.error(err); }
  };

  const handleRemarksBlur = async (idx, remarks) => {
    try { await updateDocument(employeeId, idx, { remarks }); onRefresh(); }
    catch (err) { console.error(err); }
  };

  const handleDelete = async (idx) => {
    if (!window.confirm("Delete this document?")) return;
    try { await deleteDocument(employeeId, idx); onRefresh(); }
    catch (err) { console.error(err); }
  };

  const handleFileUpload = async (idx, file) => {
    setUploadIdx(idx); setUploading(true); setError("");
    try { await uploadDocFile(employeeId, idx, file); onRefresh(); }
    catch (err) { setError(err?.message || "Upload failed"); }
    finally { setUploading(false); setUploadIdx(null); }
  };

  const handleViewFile = async (idx) => {
    try {
      const res  = await fetch(`${BASE}/onboarding/${employeeId}/document/${idx}/file`, { headers: authHeaders() });
      if (!res.ok) throw new Error("File not found");
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (err) { alert(err?.message || "Could not open file"); }
  };

  const grouped = {};
  docs.forEach((doc, idx) => {
    const cat = doc.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...doc, _idx: idx });
  });

  const pendingCount = docs.filter(d => d.status === "Pending").length;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: NAVY }}>Documents</Typography>
          {pendingCount > 0 && (
            <Box display="flex" alignItems="center" gap={0.5} mt={0.3}>
              <Warning sx={{ fontSize: 14, color: "#d97706" }} />
              <Typography sx={{ fontSize: 12, color: "#d97706" }}>
                {pendingCount} document{pendingCount > 1 ? "s" : ""} still pending
              </Typography>
            </Box>
          )}
        </Box>
        <Button variant="contained" size="small" startIcon={<Add />}
          onClick={() => { setAddOpen(true); setError(""); }}
          sx={{ bgcolor: INDIGO, "&:hover": { bgcolor: "#0d1757" } }}>
          Add Document
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {docs.length === 0 ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={2}>
          <FolderOpen sx={{ fontSize: 48, color: "#cbd5e1" }} />
          <Typography sx={{ fontSize: 13, color: SLATE }}>No documents added yet</Typography>
          <Button variant="outlined" startIcon={<Add />} onClick={() => setAddOpen(true)}>
            Add First Document
          </Button>
        </Box>
      ) : (
        Object.entries(grouped).map(([category, catDocs]) => (
          <Box key={category} mb={3}>
            <Typography sx={{
              fontSize: 11, fontWeight: 700, color: SLATE,
              textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.2,
              display: "flex", alignItems: "center", gap: 0.5,
            }}>
              {category}
              <Chip label={catDocs.length} size="small"
                sx={{ height: 16, fontSize: 9, bgcolor: "#f1f5f9", color: SLATE }} />
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: "10px", overflow: "hidden" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    {["Document", "Status", "Remarks", "File", "Actions"].map(h => (
                      <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: SLATE, py: 1 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {catDocs.map((doc) => {
                    const sc = DOC_STATUS_COLOR[doc.status] || DOC_STATUS_COLOR.Pending;
                    return (
                      <TableRow key={doc._idx} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell sx={{ fontSize: 12, fontWeight: 600, color: NAVY, py: 1.2 }}>
                          {doc.name}
                        </TableCell>
                        <TableCell sx={{ py: 1.2 }}>
                          <TextField select size="small" value={doc.status}
                            onChange={e => handleStatusChange(doc._idx, e.target.value)}
                            sx={{
                              minWidth: 110,
                              "& .MuiInputBase-input": { fontSize: 11, py: 0.5 },
                              "& .MuiOutlinedInput-root": {
                                bgcolor: sc.bg, color: sc.color,
                                "& fieldset": { borderColor: sc.border },
                              },
                            }}>
                            {DOC_STATUSES.map(s => <MenuItem key={s} value={s} sx={{ fontSize: 12 }}>{s}</MenuItem>)}
                          </TextField>
                        </TableCell>
                        <TableCell sx={{ py: 1.2 }}>
                          <TextField size="small" defaultValue={doc.remarks || ""}
                            placeholder="Add remarks…"
                            onBlur={e => e.target.value !== doc.remarks && handleRemarksBlur(doc._idx, e.target.value)}
                            sx={{ minWidth: 160, "& .MuiInputBase-input": { fontSize: 11, py: 0.5 } }} />
                        </TableCell>
                        <TableCell sx={{ py: 1.2 }}>
                          {doc.file_name ? (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Chip
                                label={doc.file_name.length > 18 ? doc.file_name.slice(0, 18) + "…" : doc.file_name}
                                size="small"
                                icon={<Description sx={{ fontSize: 12 }} />}
                                sx={{ fontSize: 10, bgcolor: "#eff6ff", color: BLUE, maxWidth: 160 }}
                              />
                              <Tooltip title="View file">
                                <IconButton size="small" onClick={() => handleViewFile(doc._idx)}>
                                  <Visibility sx={{ fontSize: 14, color: BLUE }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>No file</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 1.2 }}>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="Upload file">
                              <span>
                                <IconButton size="small"
                                  onClick={() => fileRefs.current[doc._idx]?.click()}
                                  disabled={uploading && uploadIdx === doc._idx}
                                  sx={{ color: INDIGO }}>
                                  {uploading && uploadIdx === doc._idx
                                    ? <CircularProgress size={14} />
                                    : <CloudUpload sx={{ fontSize: 16 }} />}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Delete document">
                              <IconButton size="small" color="error" onClick={() => handleDelete(doc._idx)}>
                                <Delete sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <input type="file" hidden
                              ref={el => fileRefs.current[doc._idx] = el}
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleFileUpload(doc._idx, f);
                                e.target.value = "";
                              }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        ))
      )}

      {/* Add Document Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e2e8f0", borderTop: `4px solid ${INDIGO}` }}>
          Add Document
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField select fullWidth size="small" label="Category *"
                value={addForm.category}
                onChange={e => setAddForm(p => ({ ...p, category: e.target.value, name: "" }))}>
                {Object.keys(DOC_CATEGORIES).map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth size="small" label="Document Name *"
                value={addForm.name}
                onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}>
                <MenuItem value="">— Select document —</MenuItem>
                {(DOC_CATEGORIES[addForm.category] || []).map(d => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Initial Status"
                value={addForm.status}
                onChange={e => setAddForm(p => ({ ...p, status: e.target.value }))}>
                {DOC_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Remarks"
                value={addForm.remarks}
                onChange={e => setAddForm(p => ({ ...p, remarks: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddDoc}
            disabled={addSaving || !addForm.name}
            startIcon={addSaving ? <CircularProgress size={14} color="inherit" /> : <Add />}
            sx={{ bgcolor: INDIGO }}>
            {addSaving ? "Adding…" : "Add Document"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 3 — BGV
// ══════════════════════════════════════════════════════════════════════════════
function BgvTab({ employeeId, data, onRefresh }) {
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setForm({
      bgv_status:  data?.bgv_status  || "Not Initiated",
      bgv_agency:  data?.bgv_agency  || "",
      bgv_remarks: data?.bgv_remarks || "",
    });
  }, [data]);

  const handleSave = async () => {
    setSaving(true); setSuccess(false);
    try {
      await updateOnboarding(employeeId, form);
      setSuccess(true); onRefresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const sc = BGV_COLOR[form.bgv_status] || BGV_COLOR["Not Initiated"];

  return (
    <Box>
      <SectionHeader title="Background Verification" subtitle="Track the BGV process for this employee" />
      <Box mb={3} p={2} sx={{
        bgcolor: sc.bg, borderRadius: "12px",
        border: `1px solid ${sc.color}30`,
        display: "flex", alignItems: "center", gap: 1.5,
      }}>
        <VerifiedUser sx={{ color: sc.color, fontSize: 28 }} />
        <Box>
          <Typography sx={{ fontSize: 11, color: SLATE, fontWeight: 600, textTransform: "uppercase" }}>
            Current BGV Status
          </Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: sc.color }}>{form.bgv_status}</Typography>
        </Box>
      </Box>
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <TextField select fullWidth size="small" label="BGV Status"
            value={form.bgv_status || ""}
            onChange={e => setForm(p => ({ ...p, bgv_status: e.target.value }))}>
            {BGV_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="BGV Agency"
            value={form.bgv_agency || ""}
            onChange={e => setForm(p => ({ ...p, bgv_agency: e.target.value }))}
            placeholder="e.g. AuthBridge, First Advantage" />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline rows={4} size="small" label="BGV Remarks"
            value={form.bgv_remarks || ""}
            onChange={e => setForm(p => ({ ...p, bgv_remarks: e.target.value }))}
            placeholder="Notes about the verification process, discrepancies, etc." />
        </Grid>
      </Grid>
      <SaveBar onSave={handleSave} saving={saving} success={success} />
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 4 — IT & ASSETS
// ══════════════════════════════════════════════════════════════════════════════
function ITAssetsTab({ employeeId, data, onRefresh }) {
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setForm({
      laptop_serial:      data?.laptop_serial      || "",
      laptop_make_model:  data?.laptop_make_model  || "",
      access_card_number: data?.access_card_number || "",
      email_id_created:   data?.email_id_created   || "",
      it_notes:           data?.it_notes           || "",
    });
  }, [data]);

  const handleSave = async () => {
    setSaving(true); setSuccess(false);
    try {
      await updateOnboarding(employeeId, form);
      setSuccess(true); onRefresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <SectionHeader title="IT & Asset Assignment" subtitle="Track hardware, access cards and system access" />
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Laptop Serial Number"
            value={form.laptop_serial || ""}
            onChange={e => setForm(p => ({ ...p, laptop_serial: e.target.value }))}
            placeholder="e.g. C02X123456" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Laptop Make & Model"
            value={form.laptop_make_model || ""}
            onChange={e => setForm(p => ({ ...p, laptop_make_model: e.target.value }))}
            placeholder="e.g. Apple MacBook Pro 14 M3" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Access Card Number"
            value={form.access_card_number || ""}
            onChange={e => setForm(p => ({ ...p, access_card_number: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Corporate Email ID"
            value={form.email_id_created || ""}
            onChange={e => setForm(p => ({ ...p, email_id_created: e.target.value }))}
            placeholder="e.g. name@zentreelabs.com" />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline rows={3} size="small" label="IT Notes"
            value={form.it_notes || ""}
            onChange={e => setForm(p => ({ ...p, it_notes: e.target.value }))}
            placeholder="System access, tools configured, pending items…" />
        </Grid>
      </Grid>
      <SaveBar onSave={handleSave} saving={saving} success={success} />
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB 5 — BANK & EMERGENCY CONTACT
// ══════════════════════════════════════════════════════════════════════════════
function BankEmergencyTab({ employeeId, data, onRefresh }) {
  const [bank,    setBank]    = useState({});
  const [emg,     setEmg]     = useState({});
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setBank({
      account_holder_name: data?.bank_details?.account_holder_name || "",
      account_number:      data?.bank_details?.account_number      || "",
      ifsc_code:           data?.bank_details?.ifsc_code           || "",
      bank_name:           data?.bank_details?.bank_name           || "",
      branch:              data?.bank_details?.branch              || "",
      account_type:        data?.bank_details?.account_type        || "Savings",
    });
    setEmg({
      name:         data?.emergency_contact?.name         || "",
      relationship: data?.emergency_contact?.relationship || "",
      phone:        data?.emergency_contact?.phone        || "",
      email:        data?.emergency_contact?.email        || "",
      address:      data?.emergency_contact?.address      || "",
    });
  }, [data]);

  const handleSave = async () => {
    setSaving(true); setSuccess(false);
    try {
      await updateOnboarding(employeeId, { bank_details: bank, emergency_contact: emg });
      setSuccess(true); onRefresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <SectionHeader title="Bank Account Details" subtitle="For payroll processing" />
      <Grid container spacing={2.5} mb={4}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Account Holder Name"
            value={bank.account_holder_name || ""}
            onChange={e => setBank(p => ({ ...p, account_holder_name: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Account Number"
            value={bank.account_number || ""}
            onChange={e => setBank(p => ({ ...p, account_number: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="IFSC Code"
            value={bank.ifsc_code || ""}
            onChange={e => setBank(p => ({ ...p, ifsc_code: e.target.value.toUpperCase() }))}
            placeholder="e.g. HDFC0001234" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Bank Name"
            value={bank.bank_name || ""}
            onChange={e => setBank(p => ({ ...p, bank_name: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Branch"
            value={bank.branch || ""}
            onChange={e => setBank(p => ({ ...p, branch: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField select fullWidth size="small" label="Account Type"
            value={bank.account_type || "Savings"}
            onChange={e => setBank(p => ({ ...p, account_type: e.target.value }))}>
            {ACCOUNT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      <Divider sx={{ borderColor: "#f1f5f9", mb: 3 }} />

      <SectionHeader title="Emergency Contact" subtitle="Person to contact in case of emergency" />
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Contact Name"
            value={emg.name || ""}
            onChange={e => setEmg(p => ({ ...p, name: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Relationship"
            value={emg.relationship || ""}
            onChange={e => setEmg(p => ({ ...p, relationship: e.target.value }))}
            placeholder="e.g. Spouse, Parent, Sibling" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Phone"
            value={emg.phone || ""}
            onChange={e => setEmg(p => ({ ...p, phone: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Email" type="email"
            value={emg.email || ""}
            onChange={e => setEmg(p => ({ ...p, email: e.target.value }))} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth size="small" multiline rows={2} label="Address"
            value={emg.address || ""}
            onChange={e => setEmg(p => ({ ...p, address: e.target.value }))} />
        </Grid>
      </Grid>
      <SaveBar onSave={handleSave} saving={saving} success={success} />
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  DETAIL DIALOG
// ══════════════════════════════════════════════════════════════════════════════
function OnboardingDetail({ open, onClose, employee }) {
  const [tab,     setTab]     = useState(0);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // ── FIX: use employee._id (MongoDB ObjectId string) ──────────────────────
  const employeeId = employee?._id;

  const loadData = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true); setError("");
    try {
      const res = await getOnboarding(employeeId);
      setData(res.data);
    } catch (err) {
      setError(err?.message || "Failed to load onboarding data");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (open) { loadData(); setTab(0); }
  }, [open, loadData]);

  const doneCount  = data?.checklist?.filter(i => i.done).length ?? 0;
  const totalCount = data?.checklist?.length ?? 0;
  const pct        = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const TABS = [
    { label: "Overview",         icon: <AssignmentInd sx={{ fontSize: 16 }} /> },
    { label: "Checklist",        icon: <CheckCircle   sx={{ fontSize: 16 }} /> },
    { label: "Documents",        icon: <Description   sx={{ fontSize: 16 }} /> },
    { label: "BGV",              icon: <VerifiedUser  sx={{ fontSize: 16 }} /> },
    { label: "IT & Assets",      icon: <Laptop        sx={{ fontSize: 16 }} /> },
    { label: "Bank & Emergency", icon: <AccountBalance sx={{ fontSize: 16 }} /> },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { minHeight: "85vh", borderRadius: "16px" } }}>

      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ px: 3, pt: 2.5, pb: 0, background: `linear-gradient(135deg, #0d1b4b 0%, ${INDIGO} 100%)` }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{
                width: 44, height: 44, bgcolor: "rgba(255,255,255,0.15)",
                fontSize: 16, fontWeight: 700, color: "#fff",
              }}>
                {(employee?.name || "?")[0].toUpperCase()}
              </Avatar>
              <Box>
                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
                  {employee?.name || employeeId}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                    {employee?.emp_id} · {employee?.designation || "Employee"}
                  </Typography>
                  {data && (
                    <Chip label={`${doneCount}/${totalCount} checklist`} size="small"
                      sx={{
                        height: 18, fontSize: 9, fontWeight: 700,
                        bgcolor: pct === 100 ? "rgba(22,163,74,0.3)" : "rgba(255,255,255,0.15)",
                        color:   pct === 100 ? "#86efac" : "rgba(255,255,255,0.8)",
                      }} />
                  )}
                </Box>
              </Box>
            </Box>
            <IconButton size="small" onClick={onClose}
              sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff" } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            variant="scrollable" scrollButtons="auto"
            TabIndicatorProps={{ style: { backgroundColor: "#fff", height: 3 } }}
            sx={{
              "& .MuiTab-root": {
                color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600,
                minHeight: 44, textTransform: "none", px: 2,
              },
              "& .Mui-selected": { color: "#fff !important" },
            }}>
            {TABS.map((t, i) => (
              <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" sx={{ gap: 0.5 }} />
            ))}
          </Tabs>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#f8fafc" }}>
        {loading && (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress sx={{ color: INDIGO }} />
          </Box>
        )}
        {!loading && error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && data && (
          <Box sx={{ bgcolor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", p: 3 }}>
            {tab === 0 && <OverviewTab      employeeId={employeeId} data={data} employee={employee} onRefresh={loadData} />}
            {tab === 1 && <ChecklistTab     employeeId={employeeId} data={data} onRefresh={loadData} />}
            {tab === 2 && <DocumentsTab     employeeId={employeeId} data={data} onRefresh={loadData} />}
            {tab === 3 && <BgvTab           employeeId={employeeId} data={data} onRefresh={loadData} />}
            {tab === 4 && <ITAssetsTab      employeeId={employeeId} data={data} onRefresh={loadData} />}
            {tab === 5 && <BankEmergencyTab employeeId={employeeId} data={data} onRefresh={loadData} />}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function OnboardingPage() {
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [bgvFilter,  setBgvFilter]  = useState("");
  const [selected,   setSelected]   = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [onbData,    setOnbData]    = useState({});

  const loadEmployees = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await getEmployees();
      const emps = res.data || [];
      setEmployees(emps);

      // ── FIX: use e._id — the MongoDB ObjectId that onboarding_routes.py uses ──
      const summaries = await Promise.allSettled(emps.map(e => getOnboarding(e._id)));
      const map = {};
      summaries.forEach((r, i) => {
        if (r.status === "fulfilled") map[emps[i]._id] = r.value.data;
      });
      setOnbData(map);
    } catch (err) {
      setError(err?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const openDetail = (emp) => { setSelected(emp); setDetailOpen(true); };

  // ── FIX: filter uses e._id and e.emp_id (not employee_id) ────────────────
  const filtered = employees.filter(e => {
    const q    = search.toLowerCase();
    const mQ   = !q || e.name?.toLowerCase().includes(q) || e.emp_id?.toLowerCase().includes(q);
    const ob   = onbData[e._id];
    const mBgv = !bgvFilter || ob?.bgv_status === bgvFilter;
    return mQ && mBgv;
  });

  const totalOnboarding = employees.length;
  const bgvCompleted    = Object.values(onbData).filter(d => d?.bgv_status === "Completed").length;
  const docsPending     = Object.values(onbData).reduce(
    (acc, d) => acc + (d?.documents?.filter(doc => doc.status === "Pending").length || 0), 0
  );
  const checklistFull = Object.values(onbData).filter(d => {
    const items = d?.checklist || [];
    return items.length > 0 && items.every(i => i.done);
  }).length;

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: NAVY }}>Onboarding</Typography>
          <Typography sx={{ fontSize: 13, color: SLATE, mt: 0.25 }}>
            Manage employee onboarding, documents, BGV and asset allocation
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={loadEmployees} size="small"
            sx={{ border: "1px solid #e2e8f0", borderRadius: "8px", bgcolor: "#fff",
              "&:hover": { bgcolor: "#f1f5f9" } }}>
            <Refresh fontSize="small" sx={{ color: SLATE }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2}>
        {[
          { label: "Total Employees",    value: totalOnboarding, color: INDIGO,   icon: <People /> },
          { label: "BGV Completed",      value: bgvCompleted,    color: "#059669", icon: <VerifiedUser /> },
          { label: "Docs Pending",       value: docsPending,     color: "#d97706", icon: <Description /> },
          { label: "Checklist Complete", value: checklistFull,   color: BLUE,      icon: <CheckCircle /> },
        ].map(({ label, value, color, icon }) => (
          <Grid item xs={6} md={3} key={label}>
            <Card elevation={0} sx={{
              border: "1px solid #e2e8f0", borderRadius: "14px", bgcolor: "#fff",
              "&:hover": { boxShadow: "0 4px 20px rgba(15,23,42,0.08)" },
              transition: "box-shadow 0.2s",
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                  <Box>
                    <Typography sx={{ fontSize: 12, color: SLATE, fontWeight: 500, mb: 0.5 }}>{label}</Typography>
                    {loading
                      ? <CircularProgress size={20} sx={{ color }} />
                      : <Typography sx={{ fontSize: 28, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{value}</Typography>
                    }
                  </Box>
                  <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: `${color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box display="flex" gap={2} flexWrap="wrap">
        <TextField
          placeholder="Search by name or employee ID…"
          value={search} onChange={e => setSearch(e.target.value)}
          size="small" sx={{ flexGrow: 1, minWidth: 220 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }}
        />
        <TextField select value={bgvFilter} onChange={e => setBgvFilter(e.target.value)}
          size="small" sx={{ minWidth: 180 }} label="BGV Status">
          <MenuItem value="">All BGV Statuses</MenuItem>
          {BGV_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </Box>

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={40} sx={{ color: INDIGO }} />
        </Box>
      ) : employees.length === 0 ? (
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "14px" }}>
          <Box display="flex" flexDirection="column" alignItems="center" py={10} gap={2}>
            <AssignmentInd sx={{ fontSize: 56, color: "#cbd5e1" }} />
            <Typography sx={{ fontWeight: 600, color: SLATE }}>No employees found</Typography>
            <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>
              Add employees first to manage their onboarding.
            </Typography>
          </Box>
        </Card>
      ) : (
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
          <Paper variant="outlined" sx={{ borderRadius: "14px", overflow: "hidden", border: "none" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  {["Employee", "Joining Date", "Checklist", "Documents", "BGV Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: SLATE, py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: SLATE }}>
                      No employees match your filters
                    </TableCell>
                  </TableRow>
                ) : filtered.map(emp => {
                  // ── FIX: look up by emp._id ───────────────────────────────
                  const ob          = onbData[emp._id] || {};
                  const checklist   = ob.checklist || [];
                  const done        = checklist.filter(i => i.done).length;
                  const pct         = checklist.length ? Math.round((done / checklist.length) * 100) : 0;
                  const docs        = ob.documents || [];
                  const pendingDocs = docs.filter(d => d.status === "Pending").length;
                  const bgvStatus   = ob.bgv_status || "Not Initiated";
                  const bgvSc       = BGV_COLOR[bgvStatus] || BGV_COLOR["Not Initiated"];

                  return (
                    <TableRow key={emp._id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, bgcolor: INDIGO }}>
                            {(emp.name || "?")[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{emp.name}</Typography>
                            {/* ── FIX: emp_id not employee_id ── */}
                            <Typography sx={{ fontSize: 11, color: SLATE }}>{emp.emp_id}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "#334155" }}>
                        {fmtDate(ob.joining_date || emp.date_of_joining)}
                      </TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={0.4}>
                            <Typography sx={{ fontSize: 11, color: SLATE }}>{done}/{checklist.length}</Typography>
                            <Typography sx={{ fontSize: 11, fontWeight: 700,
                              color: pct === 100 ? "#166534" : SLATE }}>{pct}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={pct}
                            sx={{ height: 5, borderRadius: 3, bgcolor: "#e2e8f0",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: pct === 100 ? "#16a34a" : INDIGO, borderRadius: 3,
                              }
                            }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.8}>
                          <Chip label={`${docs.length} docs`} size="small"
                            sx={{ fontSize: 10, height: 20, bgcolor: "#f1f5f9", color: SLATE }} />
                          {pendingDocs > 0 && (
                            <Chip label={`${pendingDocs} pending`} size="small"
                              sx={{ fontSize: 10, height: 20, bgcolor: "#fef9c3", color: "#854d0e", fontWeight: 700 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={bgvStatus} size="small"
                          sx={{
                            fontSize: 10, fontWeight: 700, height: 22,
                            bgcolor: bgvSc.bg, color: bgvSc.color,
                            border: `1px solid ${bgvSc.color}30`,
                          }} />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Manage Onboarding">
                          <IconButton size="small" onClick={() => openDetail(emp)}
                            sx={{ color: INDIGO, bgcolor: "#e8eaf6",
                              "&:hover": { bgcolor: "#c5cae9" }, borderRadius: "8px" }}>
                            <Visibility sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        </Card>
      )}

      {/* Detail Dialog */}
      <OnboardingDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        employee={selected}
      />
    </Box>
  );
}