
import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Grid, Typography, Avatar, Chip, Button, IconButton,
  Divider, CircularProgress, TextField, MenuItem,
  Checkbox, Tooltip, Table, TableHead, TableBody,
  TableRow, TableCell,
} from "@mui/material";
import {
  Close as CloseIcon, Add, Timeline, FolderOpen,
  CheckCircle, RadioButtonUnchecked, Delete,
  UploadFile, Visibility as ViewIcon, InsertDriveFile,
  FileDownload,
} from "@mui/icons-material";
import LinearProgress from "@mui/material/LinearProgress";
import {
  STATUS_COLOR, DEPT_COLOR, DOC_STATUS_COLOR, BGV_STATUS_COLOR,
  CURRENCIES, DOCUMENT_CATEGORIES, DOCUMENT_STATUSES,
  BGV_STATUSES, BLOOD_GROUPS, EMPTY_ENG,
  fmtDate, fmtMoney, nameInitials,
} from "./employeeConstants";

// ── API helpers (onboarding + engagement) ────────────────────────────────────
const BASE = process.env.REACT_APP_API_BASE_URL;
const EMPLOYEE_BASE = process.env.REACT_APP_API_EMPLOYEES_URL;
const ONBOARDING_BASE = process.env.REACT_APP_API_ONBOARDING_URL;
const hdrs = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});
const ok = async (res) => {
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

const api = {
  getOnboarding:    (id)          => fetch(`${ONBOARDING_BASE}/${id}`,                  { headers: hdrs() }).then(ok),
  updateOnboarding: (id, pl)      => fetch(`${ONBOARDING_BASE}/${id}`,                  { method: "PUT",    headers: hdrs(), body: JSON.stringify(pl) }).then(ok),
  toggleChecklist:  (id, idx, pl) => fetch(`${ONBOARDING_BASE}/${id}/checklist/${idx}`, { method: "PUT",    headers: hdrs(), body: JSON.stringify(pl) }).then(ok),
  addDocument:      (id, pl)      => fetch(`${ONBOARDING_BASE}/${id}/document`,          { method: "POST",   headers: hdrs(), body: JSON.stringify(pl) }).then(ok),
  updateDocument:   (id, idx, pl) => fetch(`${ONBOARDING_BASE}/${id}/document/${idx}`,  { method: "PUT",    headers: hdrs(), body: JSON.stringify(pl) }).then(ok),
  deleteDocument:   (id, idx)     => fetch(`${ONBOARDING_BASE}/${id}/document/${idx}`,  { method: "DELETE", headers: hdrs() }).then(ok),
  // File upload — FormData, no Content-Type (browser sets multipart boundary)
  uploadFile: (id, idx, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`${ONBOARDING_BASE}/${id}/document/${idx}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
      body: fd,
    }).then(ok);
  },
  // Fetch file as blob → object URL for inline viewing in new tab
  viewFile: async (id, idx) => {
    const res = await fetch(`${ONBOARDING_BASE}/${id}/document/${idx}/file`, { headers: hdrs() });
    if (!res.ok) throw new Error("File not found");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
  addEngagement: (id, pl)    => fetch(`${EMPLOYEE_BASE}/${id}/engagement`,         { method: "POST", headers: hdrs(), body: JSON.stringify(pl) }).then(ok),
  endEngagement: (id, idx)   => fetch(`${EMPLOYEE_BASE}/${id}/engagement/${idx}`,  { method: "PUT",  headers: hdrs(), body: JSON.stringify({}) }).then(ok),
  // Export single employee full profile as Excel
  exportEmployee: async (id, fileName) => {
    const res = await fetch(`${BASE}/export/employee/${id}/excel`, { headers: hdrs() });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href     = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  },
};

// ── Section label helper ──────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <Typography fontSize={11} fontWeight={700} color="text.secondary"
    textTransform="uppercase" letterSpacing="0.06em" mb={1.5}>
    {children}
  </Typography>
);

// ────────────────────────────────────────────────────────────────────────────
// TAB 0 — Profile
// ────────────────────────────────────────────────────────────────────────────
function ProfileTab({ employee }) {
  const dc = DEPT_COLOR[employee.department] || "#475569";

  const infoRows = [
    ["Email",           employee.email],
    ["Phone",           employee.phone           || "—"],
    ["Location",        employee.location        || "—"],
    ["Experience",      `${employee.experience} years`],
    ["Date of Joining", fmtDate(employee.date_of_joining)],
    ["Reporting To",    employee.reporting_manager || "—"],
  ];

  return (
    <Box p={3}>
      <SectionLabel>Personal &amp; Contact</SectionLabel>
      <Grid container spacing={2} mb={3}>
        {infoRows.map(([label, val]) => (
          <Grid item xs={6} sm={4} key={label}>
            <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
            <Typography fontWeight={600} fontSize={13}>{val}</Typography>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 2 }} />
      <SectionLabel>Current Deployment</SectionLabel>
      <Box p={2} borderRadius={2} mb={3}
        sx={{ bgcolor: employee.current_client ? "#f0fdf4" : "#f8fafc",
              border: `1px solid ${employee.current_client ? "#bbf7d0" : "#e2e8f0"}` }}>
        {employee.current_client ? (
          <Grid container spacing={2}>
            {[
              ["Client",       employee.current_client,                                            "#15803d"],
              ["Project",      employee.current_project || "—",                                    null],
              ["Billing Rate", fmtMoney(employee.current_billing_rate, employee.billing_currency), "#15803d"],
              ["Currency",     employee.billing_currency,                                          null],
            ].map(([label, val, color]) => (
              <Grid item xs={6} sm={3} key={label}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
                <Typography fontWeight={700} fontSize={14} color={color || "text.primary"}>{val}</Typography>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography fontSize={13} color="text.secondary" textAlign="center" py={1}>
            Not currently deployed to any client
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />
      <SectionLabel>Compensation</SectionLabel>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={6} sm={4}>
          <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase">Annual Salary</Typography>
          <Typography fontWeight={700} fontSize={14}>{fmtMoney(employee.salary)}</Typography>
        </Grid>
      </Grid>

      {employee.skills && (
        <>
          <Divider sx={{ my: 2 }} />
          <SectionLabel>Skills</SectionLabel>
          <Box display="flex" flexWrap="wrap" gap={0.8}>
            {employee.skills.split(",").filter(Boolean).map((s, i) => (
              <Chip key={i} label={s.trim()} size="small" variant="outlined"
                sx={{ fontSize: 11, borderColor: dc, color: dc }} />
            ))}
          </Box>
        </>
      )}

      {employee.notes && (
        <Box mt={2} p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
          <Typography fontSize={11} color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.3}>Notes</Typography>
          <Typography fontSize={13}>{employee.notes}</Typography>
        </Box>
      )}
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TAB 1 — Onboarding
// ────────────────────────────────────────────────────────────────────────────
function OnboardingTab({ employee, onboarding, onRefresh }) {
  const [saving, setSaving] = useState(false);
  const [form,   setForm]   = useState({});

  useEffect(() => {
    if (onboarding) {
      setForm({
        blood_group:        onboarding.blood_group        || "",
        personal_email:     onboarding.personal_email     || "",
        referred_by:        onboarding.referred_by        || "",
        bgv_status:         onboarding.bgv_status         || "Not Initiated",
        bgv_agency:         onboarding.bgv_agency         || "",
        bgv_remarks:        onboarding.bgv_remarks        || "",
        laptop_serial:      onboarding.laptop_serial      || "",
        laptop_make_model:  onboarding.laptop_make_model  || "",
        access_card_number: onboarding.access_card_number || "",
        email_id_created:   onboarding.email_id_created   || "",
        hr_notes:           onboarding.hr_notes           || "",
        it_notes:           onboarding.it_notes           || "",
        probation_end_date: onboarding.probation_end_date
          ? onboarding.probation_end_date.split("T")[0] : "",
        bank_details:      onboarding.bank_details      || {},
        emergency_contact: onboarding.emergency_contact || {},
      });
    }
  }, [onboarding]);

  const handle    = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleBD  = (e) => setForm(p => ({ ...p, bank_details:      { ...p.bank_details,      [e.target.name]: e.target.value } }));
  const handleEC  = (e) => setForm(p => ({ ...p, emergency_contact: { ...p.emergency_contact, [e.target.name]: e.target.value } }));

  const save = async () => {
    setSaving(true);
    try { await api.updateOnboarding(employee._id, form); onRefresh(); }
    finally { setSaving(false); }
  };

  const handleToggle = async (idx, item) => {
    await api.toggleChecklist(employee._id, idx, { done: !item.done, remarks: item.remarks });
    onRefresh();
  };

  if (!onboarding) return (
    <Box p={3} display="flex" justifyContent="center"><CircularProgress /></Box>
  );

  const checklist = onboarding.checklist || [];
  const doneCount = checklist.filter(i => i.done).length;
  const pct       = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;
  const bd        = form.bank_details      || {};
  const ec        = form.emergency_contact || {};

  return (
    <Box p={3}>

      {/* ── Checklist ─────────────────────────────────────────────────────── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <SectionLabel>Onboarding Checklist — {doneCount}/{checklist.length} Complete</SectionLabel>
        <Chip label={`${pct}%`} size="small"
          color={pct === 100 ? "success" : pct >= 50 ? "warning" : "default"}
          sx={{ fontWeight: 700 }} />
      </Box>

      <Box mb={3} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
        {checklist.map((item, idx) => (
          <Box key={idx} display="flex" alignItems="center" gap={1.5} px={2} py={1.2}
            sx={{ borderBottom: idx < checklist.length - 1 ? "1px solid #f1f5f9" : "none",
                  bgcolor: item.done ? "#f0fdf4" : "transparent", transition: "background 0.15s" }}>
            <Checkbox
              checked={item.done}
              onChange={() => handleToggle(idx, item)}
              icon={<RadioButtonUnchecked sx={{ color: "#cbd5e1" }} />}
              checkedIcon={<CheckCircle sx={{ color: "#15803d" }} />}
              size="small" sx={{ p: 0 }}
            />
            <Typography fontSize={13} flex={1} fontWeight={item.done ? 600 : 400}
              color={item.done ? "#15803d" : "text.primary"}>
              {item.label}
            </Typography>
            {item.done && (
              <Typography fontSize={10} color="text.disabled">{fmtDate(item.updated_at)}</Typography>
            )}
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* ── Personal Info ─────────────────────────────────────────────────── */}
      <SectionLabel>Personal Info</SectionLabel>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4}>
          <TextField select fullWidth size="small" label="Blood Group" name="blood_group"
            value={form.blood_group} onChange={handle}>
            <MenuItem value="">—</MenuItem>
            {BLOOD_GROUPS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" type="email" label="Personal Email"
            name="personal_email" value={form.personal_email} onChange={handle} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Referred By"
            name="referred_by" value={form.referred_by} onChange={handle} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" type="date" label="Probation End Date"
            name="probation_end_date" value={form.probation_end_date} onChange={handle}
            InputLabelProps={{ shrink: true }} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* ── IT Assets ─────────────────────────────────────────────────────── */}
      <SectionLabel>IT Assets &amp; Access</SectionLabel>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Laptop Serial Number"
            name="laptop_serial" value={form.laptop_serial} onChange={handle} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Laptop Make / Model"
            name="laptop_make_model" value={form.laptop_make_model} onChange={handle} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Access Card Number"
            name="access_card_number" value={form.access_card_number} onChange={handle} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Corporate Email Created"
            name="email_id_created" value={form.email_id_created} onChange={handle} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* ── Bank Details ──────────────────────────────────────────────────── */}
      <SectionLabel>Bank Details</SectionLabel>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Account Holder Name"
            name="account_holder_name" value={bd.account_holder_name} onChange={handleBD} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Account Number"
            name="account_number" value={bd.account_number} onChange={handleBD} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="IFSC Code"
            name="ifsc_code" value={bd.ifsc_code} onChange={handleBD} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Bank Name"
            name="bank_name" value={bd.bank_name} onChange={handleBD} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="Branch"
            name="branch" value={bd.branch} onChange={handleBD} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField select fullWidth size="small" label="Account Type" name="account_type"
            value={bd.account_type || "Savings"} onChange={handleBD}>
            {["Savings", "Current", "NRE", "NRO"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* ── Emergency Contact ─────────────────────────────────────────────── */}
      <SectionLabel>Emergency Contact</SectionLabel>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Contact Name"
            name="name" value={ec.name} onChange={handleEC} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Relationship"
            name="relationship" value={ec.relationship} onChange={handleEC} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="Phone"
            name="phone" value={ec.phone} onChange={handleEC} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" type="email" label="Email"
            name="email" value={ec.email} onChange={handleEC} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth size="small" label="Address"
            name="address" value={ec.address} onChange={handleEC} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* ── BGV ───────────────────────────────────────────────────────────── */}
      <SectionLabel>Background Verification</SectionLabel>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4}>
          <TextField select fullWidth size="small" label="BGV Status"
            name="bgv_status" value={form.bgv_status} onChange={handle}>
            {BGV_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="BGV Agency"
            name="bgv_agency" value={form.bgv_agency} onChange={handle} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box mt={0.5}>
            <Typography fontSize={11} color="text.secondary" mb={0.8}>Current BGV Status</Typography>
            <Chip label={form.bgv_status || "Not Initiated"}
              color={BGV_STATUS_COLOR[form.bgv_status] || "default"} size="small" sx={{ fontWeight: 700 }} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth size="small" label="BGV Remarks"
            name="bgv_remarks" value={form.bgv_remarks} onChange={handle} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* ── Internal Notes ────────────────────────────────────────────────── */}
      <SectionLabel>Internal Notes</SectionLabel>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth multiline rows={2} size="small" label="HR Notes"
            name="hr_notes" value={form.hr_notes || ""} onChange={handle} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth multiline rows={2} size="small" label="IT Notes"
            name="it_notes" value={form.it_notes || ""} onChange={handle} />
        </Grid>
      </Grid>

      <Button variant="contained" onClick={save} disabled={saving}
        sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1e3a8a" } }}>
        {saving && <CircularProgress size={16} sx={{ mr: 1, color: "#fff" }} />}
        Save Onboarding Data
      </Button>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TAB 2 — Documents  (with upload + inline view)
// ────────────────────────────────────────────────────────────────────────────
const EMPTY_DOC = { name: "", category: "Identity", status: "Pending", remarks: "" };
const ACCEPTED  = ".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt";
const TF        = { width: "100%", minWidth: 250 };

function DocumentsTab({ employee, onboarding, onRefresh }) {
  const [addOpen,     setAddOpen]     = useState(false);
  const [form,        setForm]        = useState(EMPTY_DOC);
  const [pendingFile, setPendingFile] = useState(null);   // file chosen in dialog
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(null);
  const [viewing,     setViewing]     = useState(null);
  const [viewerOpen,  setViewerOpen]  = useState(false);
  const [viewerUrl,   setViewerUrl]   = useState("");
  const [viewerName,  setViewerName]  = useState("");
  const dialogFileRef = React.useRef(null);
  const fileRefs      = React.useRef({});

  const documents = onboarding?.documents || [];
  const handle    = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const resetDialog = () => { setAddOpen(false); setForm(EMPTY_DOC); setPendingFile(null); };

  // ── Add document entry + optional immediate upload ────────────────────────
  const handleAdd = async () => {
    if (!form.name || form.name === "__custom__") return;
    setSaving(true);
    try {
      const res      = await api.addDocument(employee._id, form);
      const newIdx   = (res.data?.documents?.length ?? 1) - 1;
      // If user picked a file in the dialog, upload it straight away
      if (pendingFile && newIdx >= 0) {
        await api.uploadFile(employee._id, newIdx, pendingFile);
      }
      onRefresh(); resetDialog();
    } finally { setSaving(false); }
  };

  // ── Status change in row ──────────────────────────────────────────────────
  const handleStatusChange = async (idx, status) => {
    await api.updateDocument(employee._id, idx, { status });
    onRefresh();
  };

  // ── Delete entry + file ───────────────────────────────────────────────────
  const handleDelete = async (idx) => {
    if (!window.confirm("Remove this document and its uploaded file?")) return;
    await api.deleteDocument(employee._id, idx);
    onRefresh();
  };

  // ── Upload file for existing row ──────────────────────────────────────────
  const handleFileChange = async (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(idx);
    try {
      await api.uploadFile(employee._id, idx, file);
      onRefresh();
    } catch (err) {
      alert(err?.message || "Upload failed");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  // ── View uploaded file ────────────────────────────────────────────────────
  const handleView = async (idx, fileName) => {
    setViewing(idx);
    try {
      const objectUrl = await api.viewFile(employee._id, idx);
      const ext = fileName.split(".").pop().toLowerCase();
      if (["pdf", "png", "jpg", "jpeg"].includes(ext)) {
        setViewerUrl(objectUrl); setViewerName(fileName); setViewerOpen(true);
      } else {
        const link = document.createElement("a");
        link.href = objectUrl; link.download = fileName; link.click();
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      alert("Could not load file. It may have been deleted from the server.");
    } finally {
      setViewing(null);
    }
  };

  const closeViewer = () => {
    URL.revokeObjectURL(viewerUrl);
    setViewerUrl(""); setViewerName(""); setViewerOpen(false);
  };

  // ── Group by category ─────────────────────────────────────────────────────
  const grouped = Object.keys(DOCUMENT_CATEGORIES).reduce((acc, cat) => {
    const docs = documents.map((d, idx) => ({ ...d, idx })).filter(d => d.category === cat);
    if (docs.length) acc[cat] = docs;
    return acc;
  }, {});
  const uncategorized = documents.map((d, idx) => ({ ...d, idx }))
    .filter(d => !Object.keys(DOCUMENT_CATEGORIES).includes(d.category));
  if (uncategorized.length) grouped["Uncategorized"] = uncategorized;

  const stats = {
    total:    documents.length,
    verified: documents.filter(d => d.status === "Verified").length,
    pending:  documents.filter(d => d.status === "Pending").length,
  };

  return (
    <Box p={3}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <SectionLabel>Documents</SectionLabel>
          <Box display="flex" gap={1} mb={1.5}>
            <Chip label={`${stats.verified} Verified`} size="small" color="success" sx={{ fontWeight: 600 }} />
            <Chip label={`${stats.pending} Pending`}   size="small" color="warning" sx={{ fontWeight: 600 }} />
            <Chip label={`${stats.total} Total`}       size="small"                 sx={{ fontWeight: 600 }} />
          </Box>
        </Box>
        <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => setAddOpen(true)}
          sx={{ textTransform: "none", fontWeight: 700, borderColor: "#1e40af", color: "#1e40af", mb: 1.5 }}>
          Add Document
        </Button>
      </Box>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {documents.length === 0 ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1}>
          <FolderOpen sx={{ fontSize: 48, color: "#cbd5e1" }} />
          <Typography color="text.secondary" fontWeight={600}>No documents added yet</Typography>
          <Typography fontSize={13} color="text.disabled">
            Click "Add Document" to add and upload employee documents.
          </Typography>
        </Box>
      ) : (
        Object.entries(grouped).map(([cat, docs]) => (
          <Box key={cat} mb={3}>
            <Typography fontSize={11} fontWeight={700} color="text.secondary"
              textTransform="uppercase" mb={1}>{cat}</Typography>
            <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
              {docs.map((doc, i) => {
                const hasFile     = !!doc.file_name;
                const isUploading = uploading === doc.idx;
                const isViewing   = viewing   === doc.idx;
                const ext         = (doc.file_name || "").split(".").pop().toLowerCase();
                const isPreview   = ["pdf", "png", "jpg", "jpeg"].includes(ext);

                return (
                  <Box key={doc.idx} sx={{ borderBottom: i < docs.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <Box display="flex" alignItems="center" gap={1.5} px={2} py={1.5}
                      sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>

                      {/* Doc name + file badge */}
                      <Box flex={1} minWidth={0}>
                        <Typography fontSize={13} fontWeight={500} noWrap>{doc.name}</Typography>
                        {hasFile && (
                          <Box display="flex" alignItems="center" gap={0.5} mt={0.3}>
                            <InsertDriveFile sx={{ fontSize: 11, color: "#64748b" }} />
                            <Typography fontSize={11} color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                              {doc.file_name}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Status selector */}
                      <TextField select size="small" value={doc.status}
                        onChange={e => handleStatusChange(doc.idx, e.target.value)}
                        sx={{ width: 130, minWidth: 120 }}>
                        {DOCUMENT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </TextField>

                      <Chip label={doc.status} size="small"
                        color={DOC_STATUS_COLOR[doc.status] || "default"}
                        sx={{ fontWeight: 600, minWidth: 74 }} />

                      <Typography fontSize={11} color="text.disabled" sx={{ minWidth: 82 }}>
                        {fmtDate(doc.updated_at)}
                      </Typography>

                      {/* View */}
                      {hasFile ? (
                        <Tooltip title={isPreview ? "View file" : "Download file"}>
                          <IconButton size="small" color="primary"
                            onClick={() => handleView(doc.idx, doc.file_name)} disabled={isViewing}>
                            {isViewing ? <CircularProgress size={16} /> : <ViewIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      ) : <Box sx={{ width: 30 }} />}

                      {/* Upload */}
                      <Tooltip title={hasFile ? "Replace file" : "Upload file"}>
                        <span>
                          <IconButton size="small"
                            sx={{ color: hasFile ? "#15803d" : "#64748b" }}
                            onClick={() => fileRefs.current[doc.idx]?.click()}
                            disabled={isUploading}>
                            {isUploading ? <CircularProgress size={16} /> : <UploadFile fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <input type="file" accept={ACCEPTED} style={{ display: "none" }}
                        ref={el => fileRefs.current[doc.idx] = el}
                        onChange={e => handleFileChange(doc.idx, e)} />

                      {/* Delete */}
                      <Tooltip title="Remove document">
                        <IconButton size="small" color="error" onClick={() => handleDelete(doc.idx)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {isUploading && <LinearProgress sx={{ height: 2, mx: 2, mb: 1, borderRadius: 1 }} />}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))
      )}

      {/* ── Add Document Dialog ──────────────────────────────────────────── */}
      <Dialog open={addOpen} onClose={resetDialog} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700} sx={{ borderBottom: "1px solid #e0e0e0" }}>
          Add Document
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>

            {/* Category */}
            <Grid item xs={12} sm={6}>
              <TextField
                select size="small" label="Category" name="category"
                value={form.category} sx={TF}
                onChange={e => setForm(p => ({ ...p, category: e.target.value, name: "" }))}>
                {Object.keys(DOCUMENT_CATEGORIES).map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>

            {/* Document name */}
            <Grid item xs={12} sm={6}>
              <TextField
                select size="small" label="Document Name" name="name"
                value={form.name} onChange={handle} sx={TF}>
                <MenuItem value="">— Select document —</MenuItem>
                {(DOCUMENT_CATEGORIES[form.category] || []).map(d => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
                <MenuItem value="__custom__">Custom (type below)…</MenuItem>
              </TextField>
            </Grid>

            {/* Custom name input */}
            {form.name === "__custom__" && (
              <Grid item xs={12}>
                <TextField
                  size="small" label="Custom Document Name"
                  placeholder="Enter document name"
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  sx={TF}
                />
              </Grid>
            )}

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <TextField
                select size="small" label="Submission Status" name="status"
                value={form.status} onChange={handle} sx={TF}>
                {DOCUMENT_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>

            {/* Remarks */}
            <Grid item xs={12}>
              <TextField
                size="small" label="Remarks (optional)" name="remarks"
                value={form.remarks} onChange={handle}
                placeholder="Any notes about this document…" sx={TF}
              />
            </Grid>

            {/* ── File upload inside dialog ────────────────────────────── */}
            <Grid item xs={12}>
              <Typography fontSize={11} fontWeight={700} color="text.secondary"
                textTransform="uppercase" mb={1}>
                Upload File (Optional)
              </Typography>
              <Box
                onClick={() => dialogFileRef.current?.click()}
                sx={{
                  border: `2px dashed ${pendingFile ? "#15803d" : "#cbd5e1"}`,
                  borderRadius: 2,
                  p: 2.5,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: pendingFile ? "#f0fdf4" : "#f8fafc",
                  transition: "all 0.2s",
                  "&:hover": { borderColor: "#1e40af", bgcolor: "#eff6ff" },
                }}>
                {pendingFile ? (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    <InsertDriveFile sx={{ color: "#15803d" }} />
                    <Box textAlign="left">
                      <Typography fontSize={13} fontWeight={600} color="#15803d">
                        {pendingFile.name}
                      </Typography>
                      <Typography fontSize={11} color="text.secondary">
                        {(pendingFile.size / 1024).toFixed(1)} KB · Click to change
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <UploadFile sx={{ fontSize: 32, color: "#94a3b8", mb: 0.5 }} />
                    <Typography fontSize={13} fontWeight={600} color="text.secondary">
                      Click to browse and select a file
                    </Typography>
                    <Typography fontSize={11} color="text.disabled" mt={0.3}>
                      PDF, PNG, JPG, DOC, DOCX, XLS, XLSX, TXT
                    </Typography>
                  </Box>
                )}
              </Box>
              <input
                type="file" accept={ACCEPTED} style={{ display: "none" }}
                ref={dialogFileRef}
                onChange={e => { setPendingFile(e.target.files[0] || null); e.target.value = ""; }}
              />
              {pendingFile && (
                <Button size="small" onClick={() => setPendingFile(null)}
                  sx={{ mt: 0.5, fontSize: 11, color: "#64748b", textTransform: "none" }}>
                  Remove file
                </Button>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={resetDialog} sx={{ color: "#64748b" }}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}
            disabled={saving || !form.name || form.name === "__custom__"}
            sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1e3a8a" }, px: 3 }}>
            {saving && <CircularProgress size={16} sx={{ mr: 1, color: "#fff" }} />}
            {pendingFile ? "Add & Upload" : "Add Document"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── File Viewer Dialog (PDF / Image) ────────────────────────────── */}
      <Dialog open={viewerOpen} onClose={closeViewer} maxWidth="lg" fullWidth
        PaperProps={{ sx: { height: "90vh" } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", py: 1.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <InsertDriveFile sx={{ color: "#1e40af" }} />
              <Typography fontWeight={700} fontSize={14}>{viewerName}</Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button size="small" variant="outlined" sx={{ textTransform: "none", fontSize: 12 }}
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = viewerUrl; a.download = viewerName; a.click();
                }}>
                Download
              </Button>
              <IconButton size="small" onClick={closeViewer}><CloseIcon fontSize="small" /></IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
          {viewerUrl && (() => {
            const ext = viewerName.split(".").pop().toLowerCase();
            if (ext === "pdf") return (
              <iframe src={viewerUrl} title={viewerName}
                style={{ flex: 1, border: "none", width: "100%", height: "100%" }} />
            );
            if (["png", "jpg", "jpeg"].includes(ext)) return (
              <Box display="flex" justifyContent="center" alignItems="center"
                flex={1} p={2} bgcolor="#f8fafc">
                <img src={viewerUrl} alt={viewerName}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
              </Box>
            );
            return null;
          })()}
        </DialogContent>
      </Dialog>
    </Box>
  );
}


// ────────────────────────────────────────────────────────────────────────────
// TAB 3 — Client History / Engagements
// ────────────────────────────────────────────────────────────────────────────
function EngagementTab({ employee, onRefresh }) {
  const [open,   setOpen]   = useState(false);
  const [form,   setForm]   = useState(EMPTY_ENG);
  const [saving, setSaving] = useState(false);
  const dc      = DEPT_COLOR[employee.department] || "#475569";
  const history = employee.client_history || [];
  const handle  = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.client_name) return;
    setSaving(true);
    try {
      await api.addEngagement(employee._id, { ...form, billing_rate: form.billing_rate ? Number(form.billing_rate) : 0 });
      onRefresh(); setOpen(false); setForm(EMPTY_ENG);
    } finally { setSaving(false); }
  };

  const handleEnd = async (idx) => {
    await api.endEngagement(employee._id, idx);
    onRefresh();
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SectionLabel>Client Engagements ({history.length})</SectionLabel>
        <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => setOpen(true)}
          sx={{ textTransform: "none", fontWeight: 700, borderColor: dc, color: dc, mb: 1.5 }}>
          Add Engagement
        </Button>
      </Box>

      {history.length === 0 ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1}>
          <Timeline sx={{ fontSize: 48, color: "#cbd5e1" }} />
          <Typography color="text.secondary" fontWeight={600}>No client history yet</Typography>
          <Typography fontSize={13} color="text.disabled">Add the first client engagement above.</Typography>
        </Box>
      ) : (
        [...history].reverse().map((eng, revIdx) => {
          const originalIdx = history.length - 1 - revIdx;
          const isActive    = !eng.end_date;
          return (
            <Box key={revIdx} display="flex" gap={2} mb={3}>
              {/* Timeline dot */}
              <Box display="flex" flexDirection="column" alignItems="center" sx={{ pt: 0.5, minWidth: 24 }}>
                <Box sx={{
                  width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                  bgcolor: isActive ? "#15803d" : dc,
                  border: "3px solid", borderColor: isActive ? "#bbf7d0" : "#e2e8f0",
                  boxShadow: isActive ? "0 0 0 3px #dcfce7" : "none",
                }} />
                {revIdx < history.length - 1 && (
                  <Box sx={{ width: 2, flexGrow: 1, minHeight: 40, bgcolor: "#e2e8f0", my: 0.5 }} />
                )}
              </Box>

              {/* Engagement Card */}
              <Box flex={1} p={2} borderRadius={2}
                sx={{ border: `1px solid ${isActive ? "#bbf7d0" : "#e2e8f0"}`,
                      bgcolor: isActive ? "#f0fdf4" : "#fafafa" }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={0.3}>
                      <Typography fontWeight={800} fontSize={15} color={isActive ? "#15803d" : "#0f172a"}>
                        {eng.client_name}
                      </Typography>
                      {isActive && (
                        <Chip label="Current" size="small" color="success"
                          sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                      )}
                    </Box>
                    <Typography fontSize={13} color="text.secondary">
                      {eng.project_name && `${eng.project_name} · `}{eng.role || "—"}
                    </Typography>
                  </Box>
                  {isActive && (
                    <Tooltip title="Mark as Ended">
                      <Button size="small" variant="outlined" color="warning"
                        onClick={() => handleEnd(originalIdx)}
                        sx={{ textTransform: "none", fontSize: 11, py: 0.3 }}>
                        End
                      </Button>
                    </Tooltip>
                  )}
                </Box>

                <Grid container spacing={1.5}>
                  {[
                    ["Start Date", fmtDate(eng.start_date)],
                    ["End Date",   eng.end_date ? fmtDate(eng.end_date) : "Present"],
                    ...(eng.billing_rate > 0 ? [["Billing", fmtMoney(eng.billing_rate, eng.billing_currency)]] : []),
                    ...(eng.work_location    ? [["Location", eng.work_location]] : []),
                  ].map(([label, val]) => (
                    <Grid item xs={6} sm={3} key={label}>
                      <Typography fontSize={10} color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
                      <Typography fontWeight={600} fontSize={12}>{val}</Typography>
                    </Grid>
                  ))}
                </Grid>

                {eng.technology && (
                  <Box mt={1.5} display="flex" flexWrap="wrap" gap={0.5}>
                    {eng.technology.split(",").map(t => (
                      <Chip key={t} label={t.trim()} size="small"
                        sx={{ fontSize: 10, height: 18,
                              bgcolor: isActive ? "#dcfce7" : "#f1f5f9",
                              color:   isActive ? "#15803d" : "#475569" }} />
                    ))}
                  </Box>
                )}
                {eng.notes && (
                  <Typography fontSize={11} color="text.secondary" mt={1}>{eng.notes}</Typography>
                )}
              </Box>
            </Box>
          );
        })
      )}

      {/* ── Add Engagement Dialog ────────────────────────────────────────── */}
      <Dialog open={open} onClose={() => { setOpen(false); setForm(EMPTY_ENG); }} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700} sx={{ borderBottom: "1px solid #e0e0e0" }}>
          Add Client Engagement
          <Typography fontSize={12} color="text.secondary">for {employee.name}</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" required label="Client Name" name="client_name"
                value={form.client_name} onChange={handle} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Project Name" name="project_name"
                value={form.project_name} onChange={handle} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Role on Project" name="role"
                value={form.role} onChange={handle} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" type="date" label="Start Date" name="start_date"
                value={form.start_date} onChange={handle} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" type="date" label="End Date (blank = current)"
                name="end_date" value={form.end_date} onChange={handle} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" type="number" label="Billing Rate"
                name="billing_rate" value={form.billing_rate} onChange={handle} />
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth size="small" label="Currency" name="billing_currency"
                value={form.billing_currency} onChange={handle}>
                {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Work Location (Onsite/Remote/Hybrid)"
                name="work_location" value={form.work_location} onChange={handle} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Technology Stack (comma-sep)"
                name="technology" value={form.technology} onChange={handle} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} size="small" label="Notes"
                name="notes" value={form.notes} onChange={handle} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={() => { setOpen(false); setForm(EMPTY_ENG); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}
            disabled={saving || !form.client_name}
            sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1e3a8a" } }}>
            {saving && <CircularProgress size={16} sx={{ mr: 1, color: "#fff" }} />}
            Save Engagement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main EmployeeDetail dialog — assembles all tabs
// ────────────────────────────────────────────────────────────────────────────
const TABS = ["Profile", "Onboarding", "Documents", "Client History"];

export default function EmployeeDetail({ open, employee, onClose, onEdit, onEmployeeUpdate }) {
  const [tab,        setTab]        = useState(0);
  const [onboarding, setOnboarding] = useState(null);
  const [obLoading,  setObLoading]  = useState(false);
  const [exporting,  setExporting]  = useState(false);
  const [exportErr,  setExportErr]  = useState("");

  const loadOnboarding = async () => {
    if (!employee) return;
    setObLoading(true);
    try {
      const res = await api.getOnboarding(employee._id);
      setOnboarding(res.data);
    } catch {
      setOnboarding(null);
    } finally {
      setObLoading(false);
    }
  };

  useEffect(() => {
    if (open && employee) { setTab(0); loadOnboarding(); setExportErr(""); }
  }, [open, employee?._id]);

  const handleExport = async () => {
    setExporting(true); setExportErr("");
    try {
      const safeName = `${employee.emp_id}_${employee.name.replace(/\s+/g, "_")}_profile_${new Date().toISOString().slice(0,10)}.xlsx`;
      await api.exportEmployee(employee._id, safeName);
    } catch {
      setExportErr("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (!employee) return null;
  const dc = DEPT_COLOR[employee.department] || "#475569";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { minHeight: "82vh" } }}>

      {/* ── Dialog Header (sticky) ─────────────────────────────────────── */}
      <DialogTitle sx={{ p: 0, borderBottom: "1px solid #e0e0e0" }}>
        <Box sx={{ px: 3, pt: 3 }}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ width: 60, height: 60, bgcolor: dc, fontSize: "1.4rem", fontWeight: 700 }}>
                {nameInitials(employee.name)}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800}>{employee.name}</Typography>
                <Typography color="text.secondary" fontSize={13}>
                  {employee.designation} · {employee.department}
                </Typography>
                <Box display="flex" gap={1} mt={0.6} flexWrap="wrap">
                  <Chip label={employee.status} color={STATUS_COLOR[employee.status] || "default"}
                    size="small" sx={{ fontWeight: 700 }} />
                  <Chip label={employee.emp_id} size="small" variant="outlined"
                    sx={{ fontWeight: 600, fontFamily: "monospace" }} />
                  <Chip label={employee.employment_type} size="small"
                    sx={{ bgcolor: "#f1f5f9", fontSize: 11 }} />
                  {employee.current_client && (
                    <Chip label={`Client: ${employee.current_client}`} size="small"
                      color="info" sx={{ fontWeight: 600 }} />
                  )}
                </Box>
              </Box>
            </Box>
            <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
          </Box>

          {/* Tab Bar */}
          <Box display="flex" mt={2}>
            {TABS.map((label, i) => (
              <Box key={i} onClick={() => setTab(i)} sx={{
                px: 2, py: 1.2, cursor: "pointer", fontSize: 13,
                fontWeight: tab === i ? 700 : 400,
                borderBottom: tab === i ? `2px solid ${dc}` : "2px solid transparent",
                color: tab === i ? dc : "text.secondary",
                transition: "all 0.15s",
                userSelect: "none",
              }}>
                {label}
              </Box>
            ))}
          </Box>
        </Box>
      </DialogTitle>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <DialogContent sx={{ p: 0 }}>
        {obLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {exportErr && (
              <Box px={3} pt={2}>
                <Box sx={{ bgcolor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 1.5,
                           px: 2, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography fontSize={13} color="#dc2626">{exportErr}</Typography>
                  <IconButton size="small" onClick={() => setExportErr("")}><CloseIcon fontSize="small" /></IconButton>
                </Box>
              </Box>
            )}
            {tab === 0 && <ProfileTab    employee={employee} />}
            {tab === 1 && <OnboardingTab employee={employee} onboarding={onboarding} onRefresh={loadOnboarding} />}
            {tab === 2 && <DocumentsTab  employee={employee} onboarding={onboarding} onRefresh={loadOnboarding} />}
            {tab === 3 && <EngagementTab employee={employee} onRefresh={onEmployeeUpdate} />}
          </>
        )}
      </DialogContent>

      {/* ── Footer Actions ────────────────────────────────────────────────── */}
      <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between" }}>
        {/* Left — Export */}
        <Tooltip title="Download full profile as Excel (all 4 tabs)">
          <span>
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={14} /> : <FileDownload />}
              onClick={handleExport}
              disabled={exporting}
              sx={{
                textTransform: "none", fontWeight: 700,
                borderColor: "#15803d", color: "#15803d",
                "&:hover": { borderColor: "#166534", bgcolor: "#f0fdf4" },
              }}>
              {exporting ? "Exporting…" : "Export Profile"}
            </Button>
          </span>
        </Tooltip>

        {/* Right — Close / Edit */}
        <Box display="flex" gap={1}>
          <Button onClick={onClose} sx={{ color: "#64748b" }}>Close</Button>
          <Button variant="contained" onClick={() => { onClose(); onEdit(employee); }}
            sx={{ bgcolor: dc, "&:hover": { filter: "brightness(0.9)" }, px: 3 }}>
            Edit Employee
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}