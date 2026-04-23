
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Grid, Typography, Button, TextField, MenuItem,
  IconButton, Tooltip, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Avatar,
  InputAdornment, Divider, LinearProgress, CardActionArea,
} from "@mui/material";
import {
  Add, Search, Edit, Delete, People, CheckCircle, Work,
  Storefront, WorkOutline, PersonSearch, Close, TrendingUp,
  Business, Phone, Email, Language, LocationOn, FilterList,
  ArrowUpward, FiberManualRecord, EmojiEvents,
} from "@mui/icons-material";

// ── API ───────────────────────────────────────────────────────────────────────
const BASE = process.env.REACT_APP_API_BASE_URL;
const RESUMES_BASE = process.env.REACT_APP_API_RESUMES_URL;
const CLIENT_BASE = process.env.REACT_APP_API_CLIENTS_URL;
const JOBS_BASE = process.env.REACT_APP_API_JOBS_URL;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});
const handle = async (res) => {
  const d = await res.json();
  if (!res.ok) throw d;
  return d;
};
const getAllClients = (p = {}) =>
  fetch(`${CLIENT_BASE}/${new URLSearchParams(p).toString() ? "?" + new URLSearchParams(p).toString() : ""}`, { headers: getHeaders() }).then(handle);
const getAllJobs    = () => fetch(`${JOBS_BASE}/`,    { headers: getHeaders() }).then(handle);
const getAllResumes = () => fetch(`${RESUMES_BASE}/`, { headers: getHeaders() }).then(handle);
const createClient = (p)     => fetch(`${CLIENT_BASE}/`,     { method: "POST",   headers: getHeaders(), body: JSON.stringify(p) }).then(handle);
const updateClient = (id, p) => fetch(`${CLIENT_BASE}/${id}`,{ method: "PUT",    headers: getHeaders(), body: JSON.stringify(p) }).then(handle);
const deleteClient = (id)    => fetch(`${CLIENT_BASE}/${id}`,{ method: "DELETE", headers: getHeaders() }).then(handle);

// ── Constants ─────────────────────────────────────────────────────────────────
const INDUSTRIES    = ["Information Technology","Banking & Finance","Healthcare","Manufacturing","Retail","Telecom","Consulting","E-commerce","Automotive","Energy","Other"];
const STATUSES      = ["Active","Inactive","On Hold","Prospect"];
const PAYMENT_TERMS = ["Net 15","Net 30","Net 45","Net 60"];

const STATUS_META = {
  Active:    { color: "#0d6b3e", bg: "#d1fae5", dot: "#10b981" },
  Inactive:  { color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
  "On Hold": { color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  Prospect:  { color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
};

const CLIENT_PALETTES = [
  ["#1e3a5f","#3b82f6"],["#1a3a2a","#10b981"],["#3b1f5e","#8b5cf6"],
  ["#5e1f1f","#ef4444"],["#1f3d5e","#0ea5e9"],["#2d3748","#718096"],
  ["#5e3a1f","#f97316"],["#1f4e3d","#34d399"],
];
const clientPalette = (name = "") => CLIENT_PALETTES[(name.charCodeAt(0) || 0) % CLIENT_PALETTES.length];

const EMPTY_FORM = {
  client_id:"", company_name:"", industry:"", company_size:"", location:"",
  primary_contact:"", contact_title:"", email:"", phone:"", city:"", state:"",
  country:"India", address:"", website:"", agreement_type:"", payment_terms:"Net 30",
  relationship_status:"Active", account_manager:"", billing_rate:"", notes:"",
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, icon, accent, trend }) => (
  <Box sx={{
    p: 2.5, borderRadius: 2.5, bgcolor: "#fff", border: "1px solid #e8edf3",
    display: "flex", alignItems: "flex-start", gap: 2,
    position: "relative", overflow: "hidden",
    "&::before": {
      content: '""', position: "absolute", top: 0, left: 0, right: 0,
      height: 3, bgcolor: accent, borderRadius: "10px 10px 0 0",
    },
  }}>
    <Box sx={{ p: 1.2, bgcolor: `${accent}12`, borderRadius: 2, color: accent, display: "flex", flexShrink: 0 }}>
      {icon}
    </Box>
    <Box flex={1}>
      <Typography fontSize={11} fontWeight={600} color="#6b7280" textTransform="uppercase" letterSpacing={0.6} mb={0.3}>{label}</Typography>
      <Typography fontSize={28} fontWeight={800} color="#111827" lineHeight={1}>{value}</Typography>
      {sub && <Typography fontSize={11} color="#9ca3af" mt={0.5}>{sub}</Typography>}
    </Box>
    {trend && (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, px: 1, py: 0.3, bgcolor: "#d1fae5", borderRadius: 1, flexShrink: 0 }}>
        <ArrowUpward sx={{ fontSize: 11, color: "#059669" }} />
        <Typography fontSize={11} fontWeight={700} color="#059669">{trend}</Typography>
      </Box>
    )}
  </Box>
);

// ── Client Card ───────────────────────────────────────────────────────────────
const ClientCard = ({ client, jobCnt, candidateCnt, placedCnt, isSelected, onSelect, onEdit, onDelete, onViewJobs, onViewCandidates }) => {
  const [bg, accent] = clientPalette(client.company_name);
  const sm = STATUS_META[client.relationship_status] || STATUS_META["Inactive"];

  return (
    <Box sx={{
      bgcolor: "#fff",
      border: isSelected ? `2px solid ${accent}` : "1px solid #e8edf3",
      borderRadius: 3,
      overflow: "hidden",
      cursor: "pointer",
      transition: "all 0.15s",
      boxShadow: isSelected ? `0 4px 20px ${accent}22` : "none",
      "&:hover": { borderColor: accent, boxShadow: `0 4px 16px ${accent}18` },
    }}>
      {/* Gradient stripe */}
      <Box sx={{ height: 5, background: `linear-gradient(90deg, ${bg}, ${accent})` }} />

      {/* Clickable top section */}
      <Box onClick={() => onSelect(client)} sx={{ p: 2 }}>
        {/* Header */}
        <Box display="flex" alignItems="flex-start" gap={1.5} mb={1.5}>
          <Avatar sx={{
            width: 44, height: 44, borderRadius: 2,
            background: `linear-gradient(135deg, ${bg}, ${accent})`,
            fontSize: 17, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {client.company_name?.[0]?.toUpperCase()}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography fontWeight={700} fontSize={14} color="#111827" noWrap>{client.company_name}</Typography>
            <Typography fontSize={11} color="#6b7280" noWrap mt={0.2}>{client.industry}</Typography>
            <Box sx={{
              display: "inline-flex", alignItems: "center", gap: 0.5,
              mt: 0.6, px: 1, py: 0.3, bgcolor: sm.bg, borderRadius: 20,
            }}>
              <FiberManualRecord sx={{ fontSize: 7, color: sm.dot }} />
              <Typography fontSize={10} fontWeight={700} color={sm.color}>{client.relationship_status}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Contact snippet */}
        {client.primary_contact && (
          <Box display="flex" alignItems="center" gap={0.8} mb={0.4}>
            <People sx={{ fontSize: 12, color: "#9ca3af" }} />
            <Typography fontSize={11} color="#6b7280" noWrap>{client.primary_contact}{client.contact_title ? ` · ${client.contact_title}` : ""}</Typography>
          </Box>
        )}
        {client.city && (
          <Box display="flex" alignItems="center" gap={0.8} mb={1.5}>
            <LocationOn sx={{ fontSize: 12, color: "#9ca3af" }} />
            <Typography fontSize={11} color="#6b7280" noWrap>{[client.city, client.state].filter(Boolean).join(", ")}</Typography>
          </Box>
        )}

        {/* Stats row */}
        <Box sx={{
          display: "flex", borderRadius: 2, overflow: "hidden",
          border: "1px solid #f1f5f9",
        }}>
          {[
            { n: jobCnt,       l: "Jobs",       color: "#1e40af" },
            { n: candidateCnt, l: "Candidates", color: "#0ea5e9" },
            { n: placedCnt,    l: "Placed",     color: "#059669" },
          ].map(({ n, l, color }, i) => (
            <Box key={l} flex={1} textAlign="center" py={1.2} sx={{
              borderRight: i < 2 ? "1px solid #f1f5f9" : "none",
              bgcolor: i === 2 && placedCnt > 0 ? "#f0fdf4" : "transparent",
            }}>
              <Typography fontSize={18} fontWeight={800} color={color} lineHeight={1}>{n}</Typography>
              <Typography fontSize={9} color="#9ca3af" textTransform="uppercase" letterSpacing={0.5} mt={0.3}>{l}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Action footer */}
      <Box sx={{
        display: "flex", gap: 0.75, px: 2, pb: 1.5, pt: 0.5,
        borderTop: "1px solid #f1f5f9", bgcolor: "#fafbfc",
      }}>
        <Button size="small" onClick={(e) => { e.stopPropagation(); onViewJobs(client); }}
          sx={{ flex: 1, fontSize: 11, py: 0.4, textTransform: "none", fontWeight: 600,
            color: "#1e40af", borderColor: "rgba(30,64,175,0.25)", border: "0.5px solid",
            borderRadius: 1.5, "&:hover": { bgcolor: "#dbeafe", borderColor: "#1e40af" } }}>
          View Jobs
        </Button>
        <Button size="small" onClick={(e) => { e.stopPropagation(); onViewCandidates(client); }}
          sx={{ flex: 1, fontSize: 11, py: 0.4, textTransform: "none", fontWeight: 600,
            color: "#059669", borderColor: "rgba(5,150,105,0.25)", border: "0.5px solid",
            borderRadius: 1.5, "&:hover": { bgcolor: "#d1fae5", borderColor: "#059669" } }}>
          Candidates
        </Button>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(client); }}
            sx={{ border: "0.5px solid #e8edf3", borderRadius: 1.5, "&:hover": { bgcolor: "#f3f4f6" } }}>
            <Edit sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(client); }}
            sx={{ border: "0.5px solid #fee2e2", borderRadius: 1.5, "&:hover": { bgcolor: "#fee2e2" } }}>
            <Delete sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

// ── Detail Panel ──────────────────────────────────────────────────────────────
const DetailPanel = ({ client, jobCnt, candidateCnt, placedCnt, onClose, onEdit, onViewJobs, onViewCandidates }) => {
  const [bg, accent] = clientPalette(client.company_name);

  const InfoRow = ({ icon, label, value }) => value ? (
    <Box display="flex" alignItems="flex-start" gap={1.5} py={1}
      sx={{ borderBottom: "1px solid #f1f5f9", "&:last-child": { borderBottom: "none" } }}>
      <Box sx={{ color: "#9ca3af", mt: 0.1, flexShrink: 0, fontSize: 14 }}>{icon}</Box>
      <Box>
        <Typography fontSize={10} color="#9ca3af" textTransform="uppercase" letterSpacing={0.5} fontWeight={600}>{label}</Typography>
        <Typography fontSize={13} color="#111827" fontWeight={500}>{value}</Typography>
      </Box>
    </Box>
  ) : null;

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #e8edf3", borderRadius: 3, overflow: "hidden", position: "sticky", top: 16 }}>
      {/* Hero */}
      <Box sx={{ background: `linear-gradient(135deg, ${bg} 0%, ${accent} 100%)`, p: 2.5, position: "relative" }}>
        <IconButton size="small" onClick={onClose}
          sx={{ position: "absolute", top: 10, right: 10, color: "rgba(255,255,255,0.7)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)", color: "#fff" } }}>
          <Close fontSize="small" />
        </IconButton>
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <Avatar sx={{ width: 50, height: 50, bgcolor: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", fontSize: 20, fontWeight: 800, color: "#fff", borderRadius: 2 }}>
            {client.company_name?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight={800} fontSize={16} color="#fff">{client.company_name}</Typography>
            <Typography fontSize={11} color="rgba(255,255,255,0.65)" mt={0.2}>{client.industry} · {client.client_id}</Typography>
            <Box display="inline-flex" alignItems="center" gap={0.5} mt={0.8}
              sx={{ px: 1.2, py: 0.3, bgcolor: "rgba(255,255,255,0.15)", borderRadius: 20 }}>
              <FiberManualRecord sx={{ fontSize: 7, color: "#fff" }} />
              <Typography fontSize={10} fontWeight={700} color="#fff">{client.relationship_status}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Mini KPIs */}
        <Box display="flex" gap={1}>
          {[
            { n: jobCnt,       l: "Jobs"       },
            { n: candidateCnt, l: "Candidates" },
            { n: placedCnt,    l: "Placed", highlight: true },
          ].map(({ n, l, highlight }) => (
            <Box key={l} flex={1} sx={{
              bgcolor: highlight && n > 0 ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.12)",
              borderRadius: 2, p: 1.5, textAlign: "center",
            }}>
              <Typography fontSize={20} fontWeight={800} color="#fff">{n}</Typography>
              <Typography fontSize={9} color="rgba(255,255,255,0.65)" textTransform="uppercase" letterSpacing={0.5} mt={0.3}>{l}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2 }}>
        <Typography fontSize={10} fontWeight={700} color="#6b7280" textTransform="uppercase" letterSpacing={0.6} mb={1}>Contact</Typography>
        <InfoRow icon={<People sx={{ fontSize: 14 }} />}     label="Contact Person" value={client.primary_contact} />
        <InfoRow icon={<Business sx={{ fontSize: 14 }} />}   label="Designation"    value={client.contact_title} />
        <InfoRow icon={<Email sx={{ fontSize: 14 }} />}      label="Email"          value={client.email} />
        <InfoRow icon={<Phone sx={{ fontSize: 14 }} />}      label="Phone"          value={client.phone} />
        <InfoRow icon={<Language sx={{ fontSize: 14 }} />}   label="Website"        value={client.website} />
        <InfoRow icon={<LocationOn sx={{ fontSize: 14 }} />} label="Location"       value={[client.city, client.state, client.country].filter(Boolean).join(", ")} />

        <Typography fontSize={10} fontWeight={700} color="#6b7280" textTransform="uppercase" letterSpacing={0.6} mb={1} mt={1.5}>Commercial</Typography>
        <InfoRow icon={<Work sx={{ fontSize: 14 }} />}       label="Company Size"   value={client.company_size} />
        <InfoRow icon={<TrendingUp sx={{ fontSize: 14 }} />} label="Billing Rate"   value={client.billing_rate ? `${client.billing_rate}%` : null} />
        <InfoRow icon={<EmojiEvents sx={{ fontSize: 14 }} />}label="Payment Terms"  value={client.payment_terms} />
        <InfoRow icon={<People sx={{ fontSize: 14 }} />}     label="Account Mgr."   value={client.account_manager} />

        {client.notes && (
          <Box mt={1.5} p={1.5} sx={{ bgcolor: "#f8faff", borderRadius: 2, border: "1px solid #e8edf3" }}>
            <Typography fontSize={10} fontWeight={700} color="#6b7280" textTransform="uppercase" letterSpacing={0.5} mb={0.5}>Notes</Typography>
            <Typography fontSize={12} color="#374151" lineHeight={1.7}>{client.notes}</Typography>
          </Box>
        )}

        <Box display="flex" gap={1} mt={2} pt={1.5} sx={{ borderTop: "1px solid #f1f5f9" }}>
          <Button variant="outlined" size="small" startIcon={<WorkOutline sx={{ fontSize: 14 }} />} onClick={() => onViewJobs(client)}
            sx={{ flex: 1, textTransform: "none", fontWeight: 600, fontSize: 12, borderColor: "#e8edf3", color: "#1e40af", borderRadius: 1.5, "&:hover": { borderColor: "#1e40af", bgcolor: "#dbeafe" } }}>
            Jobs
          </Button>
          <Button variant="outlined" size="small" startIcon={<PersonSearch sx={{ fontSize: 14 }} />} onClick={() => onViewCandidates(client)}
            sx={{ flex: 1, textTransform: "none", fontWeight: 600, fontSize: 12, borderColor: "#e8edf3", color: "#059669", borderRadius: 1.5, "&:hover": { borderColor: "#059669", bgcolor: "#d1fae5" } }}>
            Candidates
          </Button>
          <Button variant="contained" size="small" startIcon={<Edit sx={{ fontSize: 14 }} />} onClick={() => onEdit(client)}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, bgcolor: "#1e40af", "&:hover": { bgcolor: "#1d3994" }, borderRadius: 1.5, boxShadow: "0 2px 8px rgba(30,64,175,0.25)" }}>
            Edit
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  Main Component
// ═════════════════════════════════════════════════════════════════════════════
export default function Clients() {
  const navigate = useNavigate();
  const [clients,    setClients]   = useState([]);
  const [jobs,       setJobs]      = useState([]);
  const [resumes,    setResumes]   = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState("");
  const [search,     setSearch]    = useState("");
  const [statusF,    setStatusF]   = useState("");
  const [industryF,  setIndustryF] = useState("");
  const [selected,   setSelected]  = useState(null);
  const [formOpen,   setFormOpen]  = useState(false);
  const [deleteOpen, setDeleteOpen]= useState(false);
  const [formTarget, setFormTarget]= useState(null);
  const [formData,   setFormData]  = useState(EMPTY_FORM);
  const [saving,     setSaving]    = useState(false);

  const load = useCallback(async () => {
    try { setLoading(true); setError(""); const r = await getAllClients(); setClients(r.data || []); }
    catch (err) { setError(err?.message || "Failed to load clients"); setClients([]); }
    finally { setLoading(false); }
  }, []);
  const loadJobs    = useCallback(async () => { try { const r = await getAllJobs();    setJobs(r.data || []);    } catch { setJobs([]); } }, []);
  const loadResumes = useCallback(async () => { try { const r = await getAllResumes(); setResumes(r.data || []); } catch { setResumes([]); } }, []);
  useEffect(() => { load(); loadJobs(); loadResumes(); }, [load, loadJobs, loadResumes]);

  // ── Count helpers (all computed live from actual data) ─────────────────────
  // Gets all jobs belonging to this client
  const clientJobs = (c) => jobs.filter(j =>
    j.client_id === c.client_id || j.client_id === c._id
  );

  // Count of job postings
  const jobCount = (c) => clientJobs(c).length;

  // Count of candidates linked to any of this client's jobs
  const candidateCount = (c) => {
    const jobIds = clientJobs(c).map(j => j.job_id);
    return resumes.filter(r => r.linked_job_id && jobIds.includes(r.linked_job_id)).length;
  };

  // Count of candidates with status "Hired" linked to this client's jobs
  // This is the real "placed" count based on actual candidate status
  const placedCount = (c) => {
    const jobIds = clientJobs(c).map(j => j.job_id);
    return resumes.filter(r =>
      r.status === "Hired" &&
      r.linked_job_id &&
      jobIds.includes(r.linked_job_id)
    ).length;
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.company_name?.toLowerCase().includes(q) || c.primary_contact?.toLowerCase().includes(q) || c.client_id?.toLowerCase().includes(q))
      && (!statusF   || c.relationship_status === statusF)
      && (!industryF || c.industry === industryF);
  });

  const stats = {
    total:       clients.length,
    active:      clients.filter(c => c.relationship_status === "Active").length,
    activeJobs:  jobs.length,
    // Sum of hired candidates across all clients — single source of truth
    placements:  resumes.filter(r => r.status === "Hired").length,
  };

  const handleSelect  = (c) => setSelected(prev => prev?._id === c._id ? null : c);
  const goJobs        = (c) => navigate(`/jobs?client=${c._id}&client_name=${encodeURIComponent(c.company_name)}`);
  const goCandidates  = (c) => navigate(`/resumes?client=${c._id}&client_name=${encodeURIComponent(c.company_name)}`);
  const openCreate    = () => { setFormTarget(null); setFormData(EMPTY_FORM); setFormOpen(true); };
  const openEdit      = (c) => { setFormTarget(c); setFormData({ ...EMPTY_FORM, ...c }); setFormOpen(true); };
  const openDelete    = (c) => { setFormTarget(c); setDeleteOpen(true); };
  const handleChange  = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      formTarget ? await updateClient(formTarget._id, formData) : await createClient(formData);
      setFormOpen(false);
      if (formTarget && selected?._id === formTarget._id) setSelected(null);
      load();
    } catch (err) { setError(err?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteClient(formTarget._id);
      setDeleteOpen(false);
      if (selected?._id === formTarget._id) setSelected(null);
      load();
    } catch (err) { setError(err?.message || "Delete failed"); }
  };

  if (loading)
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={40} sx={{ color: "#1e40af" }} /></Box>;

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>{error}</Alert>}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: "#111827", letterSpacing: -0.5 }}>Client Management</Typography>
          <Typography fontSize={14} color="#6b7280" mt={0.3}>
            {clients.length} client{clients.length !== 1 ? "s" : ""} · {stats.active} active · {stats.activeJobs} open jobs
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large"
          sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1d3994" }, boxShadow: "0 4px 12px rgba(30,64,175,0.35)", borderRadius: 2, textTransform: "none", fontWeight: 700, px: 3 }}>
          Add New Client
        </Button>
      </Box>

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <KPICard label="Total Clients" value={stats.total} icon={<Business sx={{ fontSize: 20 }} />} accent="#1e40af" sub="All time" />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard label="Active Clients" value={stats.active} icon={<CheckCircle sx={{ fontSize: 20 }} />} accent="#059669" sub="Currently engaged"
            trend={stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : null} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard label="Open Jobs" value={stats.activeJobs} icon={<Work sx={{ fontSize: 20 }} />} accent="#0ea5e9" sub="Across all clients" />
        </Grid>
        <Grid item xs={6} md={3}>
          <KPICard label="Total Placements" value={stats.placements} icon={<TrendingUp sx={{ fontSize: 20 }} />} accent="#f59e0b" sub='Candidates with "Hired" status' />
        </Grid>
      </Grid>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      {clients.length > 0 && (
        <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center"
          sx={{ p: 2, bgcolor: "#fff", borderRadius: 2.5, border: "1px solid #e8edf3" }}>
          <FilterList sx={{ fontSize: 18, color: "#9ca3af" }} />
          <TextField placeholder="Search clients, contacts, IDs…" value={search} onChange={e => setSearch(e.target.value)}
            size="small" sx={{ flexGrow: 1, minWidth: 220, "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "#f9fafb", "& fieldset": { borderColor: "#e8edf3" } } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: "#9ca3af" }} /></InputAdornment> }} />
          <TextField select value={statusF} onChange={e => setStatusF(e.target.value)} size="small" label="Status"
            sx={{ minWidth: 140, "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "#f9fafb", "& fieldset": { borderColor: "#e8edf3" } } }}>
            <MenuItem value="">All Statuses</MenuItem>
            {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select value={industryF} onChange={e => setIndustryF(e.target.value)} size="small" label="Industry"
            sx={{ minWidth: 190, "& .MuiOutlinedInput-root": { borderRadius: 1.5, bgcolor: "#f9fafb", "& fieldset": { borderColor: "#e8edf3" } } }}>
            <MenuItem value="">All Industries</MenuItem>
            {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
          </TextField>
          {(search || statusF || industryF) && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.2, py: 0.4, bgcolor: "#dbeafe", borderRadius: 20, cursor: "pointer" }}
              onClick={() => { setSearch(""); setStatusF(""); setIndustryF(""); }}>
              <Typography fontSize={11} fontWeight={700} color="#1e40af">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</Typography>
              <Close sx={{ fontSize: 12, color: "#1e40af" }} />
            </Box>
          )}
        </Box>
      )}

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {clients.length === 0 ? (
        <Box sx={{ bgcolor: "#fff", borderRadius: 3, border: "1px solid #e8edf3", p: 8, textAlign: "center" }}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: "#f1f5f9", mx: "auto", mb: 2 }}>
            <Storefront sx={{ fontSize: 36, color: "#94a3b8" }} />
          </Avatar>
          <Typography variant="h6" fontWeight={700} color="#374151" mb={1}>No clients yet</Typography>
          <Typography fontSize={14} color="#9ca3af" mb={3}>Add your first client to start managing engagements</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}
            sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1d3994" }, textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
            Add New Client
          </Button>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ bgcolor: "#fff", borderRadius: 3, border: "1px solid #e8edf3", p: 6, textAlign: "center" }}>
          <Typography fontSize={14} color="#9ca3af">No clients match your filters.</Typography>
          <Box component="span" onClick={() => { setSearch(""); setStatusF(""); setIndustryF(""); }}
            sx={{ fontSize: 13, color: "#1e40af", cursor: "pointer", mt: 1, display: "block" }}>
            Clear all filters
          </Box>
        </Box>
      ) : (
        <Grid container spacing={2.5} alignItems="flex-start">
          {/* Cards grid */}
          <Grid item xs={12} md={selected ? 8 : 12}>
            <Grid container spacing={2}>
              {filtered.map(c => (
                <Grid item xs={12} sm={6} md={selected ? 6 : 4} key={c._id}>
                  <ClientCard
                    client={c}
                    jobCnt={jobCount(c)}
                    candidateCnt={candidateCount(c)}
                    placedCnt={placedCount(c)}
                    isSelected={selected?._id === c._id}
                    onSelect={handleSelect}
                    onEdit={openEdit}
                    onDelete={openDelete}
                    onViewJobs={goJobs}
                    onViewCandidates={goCandidates}
                  />
                </Grid>
              ))}
            </Grid>
            <Box mt={2}>
              <Typography fontSize={12} color="#9ca3af">
                Showing <strong style={{ color: "#374151" }}>{filtered.length}</strong> of <strong style={{ color: "#374151" }}>{clients.length}</strong> clients
                {selected && <span style={{ marginLeft: 12, color: "#1e40af", fontWeight: 600 }}>· {selected.company_name} selected — click again to close</span>}
              </Typography>
            </Box>
          </Grid>

          {/* Detail panel */}
          {selected && (
            <Grid item xs={12} md={4}>
              <DetailPanel
                client={selected}
                jobCnt={jobCount(selected)}
                candidateCnt={candidateCount(selected)}
                placedCnt={placedCount(selected)}
                onClose={() => setSelected(null)}
                onEdit={(c) => { openEdit(c); setSelected(null); }}
                onViewJobs={goJobs}
                onViewCandidates={goCandidates}
              />
            </Grid>
          )}
        </Grid>
      )}

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ borderBottom: "1px solid #f1f5f9", px: 3, py: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography fontWeight={800} fontSize={18} color="#111827">{formTarget ? "Edit Client" : "Add New Client"}</Typography>
              <Typography fontSize={12} color="#9ca3af">{formTarget ? `Editing ${formTarget.company_name}` : "Fill in the details to create a new client account"}</Typography>
            </Box>
            <IconButton size="small" onClick={() => setFormOpen(false)} sx={{ color: "#9ca3af" }}><Close fontSize="small" /></IconButton>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 3, px: 3 }}>
            <Box sx={{ borderLeft: "3px solid #1e40af", pl: 1.5, mb: 2, borderRadius: 0 }}>
              <Typography fontSize={13} fontWeight={700} color="#1e40af">Basic Information</Typography>
            </Box>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}><TextField  size="small" required label="Client ID" name="client_id" value={formData.client_id} onChange={handleChange} disabled={!!formTarget} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} /></Grid>
              <Grid item xs={12} sm={6}><TextField  size="small" required label="Company Name" name="company_name" value={formData.company_name} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} /></Grid>
              <Grid item xs={12} sm={6}><TextField select  size="small" required label="Industry" name="industry" value={formData.industry} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }}>{INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={6}><TextField select  size="small" label="Status" name="relationship_status" value={formData.relationship_status} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } ,width: "100%", minWidth: 400}}>{STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={6}><TextField  size="small" required label="Company Size" name="company_size" value={formData.company_size} onChange={handleChange} placeholder="e.g. 100–500" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } ,width: "100%", minWidth: 400}} /></Grid>
              <Grid item xs={12} sm={6}><TextField  size="small" label="Location" name="location" value={formData.location} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} /></Grid>
            </Grid>
            <Box sx={{ borderLeft: "3px solid #059669", pl: 1.5, mb: 2, borderRadius: 0 }}>
              <Typography fontSize={13} fontWeight={700} color="#059669">Contact Information</Typography>
            </Box>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}><TextField  size="small" required label="Primary Contact" name="primary_contact" value={formData.primary_contact} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} /></Grid>
              <Grid item xs={12} sm={6}><TextField  size="small" required label="Title" name="contact_title" value={formData.contact_title} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} /></Grid>
              <Grid item xs={12} sm={6}><TextField  size="small" required type="email" label="Email" name="email" value={formData.email} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} /></Grid>
              <Grid item xs={12} sm={6}><TextField  size="small" required label="Phone" name="phone" value={formData.phone} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} /></Grid>
              <Grid item xs={6} sm={4}><TextField  size="small" label="City" name="city" value={formData.city} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} /></Grid>
              <Grid item xs={6} sm={4}><TextField  size="small" label="State" name="state" value={formData.state} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} /></Grid>
              <Grid item xs={12} sm={4}><TextField  size="small" label="Country" name="country" value={formData.country} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} /></Grid>
              <Grid item xs={12}><TextField  size="small" label="Website" name="website" value={formData.website} onChange={handleChange} placeholder="https://…" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} /></Grid>
            </Grid>
            <Box sx={{ borderLeft: "3px solid #f59e0b", pl: 1.5, mb: 2, borderRadius: 0 }}>
              <Typography fontSize={13} fontWeight={700} color="#b45309">Billing & Agreement</Typography>
            </Box>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}><TextField  size="small" type="number" label="Billing Rate (%)" name="billing_rate" value={formData.billing_rate} onChange={handleChange} inputProps={{ step: "0.01" }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} /></Grid>
              <Grid item xs={12} sm={6}><TextField select  size="small" label="Payment Terms" name="payment_terms" value={formData.payment_terms} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }}>{PAYMENT_TERMS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
            </Grid>
            <TextField  multiline rows={3} size="small" label="Notes" name="notes" value={formData.notes} onChange={handleChange} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 },width: "100%", minWidth: 400 }} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #f1f5f9", gap: 1 }}>
            <Button onClick={() => setFormOpen(false)} sx={{ textTransform: "none", color: "#6b7280", borderRadius: 1.5 }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}
              sx={{ bgcolor: "#1e40af", "&:hover": { bgcolor: "#1d3994" }, textTransform: "none", fontWeight: 700, borderRadius: 1.5, px: 3, boxShadow: "0 2px 8px rgba(30,64,175,0.3)" }}>
              {saving ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
              {formTarget ? "Update Client" : "Create Client"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#111827" }}>Delete Client</DialogTitle>
        <DialogContent>
          <Typography fontSize={14} color="#374151">
            Are you sure you want to delete <strong>{formTarget?.company_name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ textTransform: "none", color: "#6b7280", borderRadius: 1.5 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1.5 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}











