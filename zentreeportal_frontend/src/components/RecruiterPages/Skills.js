
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  MenuItem, Chip, IconButton, Tooltip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  InputAdornment, Divider, List, ListItem, ListItemAvatar,
  ListItemText, Badge, LinearProgress,
} from "@mui/material";
import {
  Add, Search, Edit, Delete, People,
  Code, Cloud, Storage, AutoGraph, Brush, Star,
  Psychology, Devices, Category, Close as CloseIcon,
  WorkOutline, TrendingUp, Layers,
} from "@mui/icons-material";

const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});
const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

const getAllSkills     = (p = {}) => {
  const qs = new URLSearchParams(p).toString();
  return fetch(`${BASE}/skills/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
};
const createSkill     = (pl) => fetch(`${BASE}/skills/`,     { method: "POST",   headers: getHeaders(), body: JSON.stringify(pl) }).then(handle);
const updateSkill     = (id, pl) => fetch(`${BASE}/skills/${id}`, { method: "PUT",    headers: getHeaders(), body: JSON.stringify(pl) }).then(handle);
const deleteSkill     = (id) => fetch(`${BASE}/skills/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
const getResumesBySkill = (name) =>
  fetch(`${BASE}/resumes/by-skill/${encodeURIComponent(name)}`, { headers: getHeaders() }).then(handle);

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Programming Languages","Frameworks & Libraries","Databases",
  "Cloud & DevOps","Data Science & ML","Design & UX",
  "Management & Soft Skills","Domain Expertise","Tools & Platforms","Other",
];
const DEMAND_LEVELS = ["Critical","High","Medium","Low"];

const DEMAND_META = {
  Critical: { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  High:     { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  Medium:   { color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  Low:      { color: "#4b5563", bg: "#f9fafb", border: "#e5e7eb" },
};
const STATUS_COLOR = {
  New:"default","In Review":"info",Shortlisted:"primary",
  Interviewed:"warning",Offered:"success",Hired:"success",
  Rejected:"error","On Hold":"warning",
};
const CATEGORY_ICON = {
  "Programming Languages":<Code />,"Frameworks & Libraries":<Devices />,
  "Databases":<Storage />,"Cloud & DevOps":<Cloud />,
  "Data Science & ML":<AutoGraph />,"Design & UX":<Brush />,
  "Management & Soft Skills":<Psychology />,"Domain Expertise":<Star />,
  "Tools & Platforms":<Devices />,"Other":<Category />,
};
const CATEGORY_PALETTE = {
  "Programming Languages":   { bg:"#eef2ff", color:"#4338ca", light:"#c7d2fe" },
  "Frameworks & Libraries":  { bg:"#eff6ff", color:"#1d4ed8", light:"#bfdbfe" },
  "Databases":               { bg:"#f0fdf4", color:"#15803d", light:"#bbf7d0" },
  "Cloud & DevOps":          { bg:"#faf5ff", color:"#7e22ce", light:"#e9d5ff" },
  "Data Science & ML":       { bg:"#f0fdfa", color:"#0f766e", light:"#99f6e4" },
  "Design & UX":             { bg:"#fdf2f8", color:"#be185d", light:"#fbcfe8" },
  "Management & Soft Skills":{ bg:"#fff7ed", color:"#c2410c", light:"#fed7aa" },
  "Domain Expertise":        { bg:"#fdf4ff", color:"#9333ea", light:"#f3e8ff" },
  "Tools & Platforms":       { bg:"#f0f9ff", color:"#0369a1", light:"#bae6fd" },
  "Other":                   { bg:"#f8fafc", color:"#475569", light:"#cbd5e1" },
};

const EMPTY_FORM = {
  skill_name:"",category:"",proficiency_levels:"",
  description:"",demand_level:"Medium",related_skills:"",
};

const fmtSalary = (v) => {
  if (!v) return "—";
  if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
  return `₹${Number(v).toLocaleString("en-IN")}`;
};
const nameInitials = (name="") =>
  name.split(" ").filter(Boolean).map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, accent }) => (
  <Card elevation={0} sx={{
    border: "1px solid #e2e8f0",
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  }}>
    <Box sx={{
      position: "absolute", left: 0, top: 0, bottom: 0,
      width: 3, bgcolor: accent, borderRadius: "2px 0 0 2px",
    }}/>
    <CardContent sx={{ p: 2.5, pl: 3.5 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography fontSize={11} fontWeight={600} color="text.secondary"
            textTransform="uppercase" letterSpacing="0.08em" mb={0.8}>
            {label}
          </Typography>
          <Typography fontSize={28} fontWeight={800} color="#0f172a" lineHeight={1}>
            {value}
          </Typography>
        </Box>
        <Box sx={{
          width: 40, height: 40, borderRadius: 1.5,
          bgcolor: `${accent}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {React.cloneElement(icon, { sx: { fontSize: 20, color: accent } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ── Matched Resumes Dialog ────────────────────────────────────────────────────
function SkillResumesDialog({ open, onClose, skill }) {
  const [resumes,  setResumes]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [minMatch, setMinMatch] = useState(1);

  useEffect(() => {
    if (!open || !skill) return;
    setLoading(true); setError(""); setResumes([]);

    const relatedList = (skill.related_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
    const allSkillNames = [skill.skill_name, ...relatedList];
    const defaultMin = Math.max(1, Math.ceil(allSkillNames.length / 2));
    setMinMatch(defaultMin);

    Promise.all(allSkillNames.map(name => getResumesBySkill(name).catch(()=>({ data:[] }))))
      .then(results => {
        const map = new Map();
        results.forEach((res, idx) => {
          (res.data||[]).forEach(r => {
            if (!map.has(r._id)) map.set(r._id, { ...r, matchedSkills:[], matchCount:0 });
            const entry = map.get(r._id);
            if (!entry.matchedSkills.includes(allSkillNames[idx])) {
              entry.matchedSkills.push(allSkillNames[idx]);
              entry.matchCount++;
            }
          });
        });
        setResumes(Array.from(map.values()).sort((a,b)=>b.matchCount-a.matchCount));
      })
      .catch(err => setError(err?.message||"Failed to load"))
      .finally(() => setLoading(false));
  }, [open, skill]);

  if (!skill) return null;

  const relatedList = (skill.related_skills||"").split(",").map(s=>s.trim()).filter(Boolean);
  const total = 1 + relatedList.length;
  const palette = CATEGORY_PALETTE[skill.category] || CATEGORY_PALETTE["Other"];
  const filtered = resumes.filter(r => r.matchCount >= minMatch);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", maxHeight: "88vh" } }}>

      {/* Header */}
      <Box sx={{ bgcolor: palette.bg, px: 3, pt: 2.5, pb: 0, borderBottom: "1px solid #e2e8f0" }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2,
              bgcolor: palette.color, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <People sx={{ fontSize: 18, color: "#fff" }} />
            </Box>
            <Box>
              <Typography fontWeight={700} fontSize="0.95rem" color="#0f172a">
                {skill.skill_name}
              </Typography>
              <Typography fontSize={11} color="text.secondary">
                {loading ? "Searching…" : `${resumes.length} total · ${filtered.length} shown`}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ mt: -0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Skill chips */}
        {total > 1 && !loading && (
          <Box display="flex" flexWrap="wrap" gap={0.5} mb={1.5}>
            <Chip label={skill.skill_name} size="small"
              sx={{ fontSize: 10, height: 20, bgcolor: palette.color, color: "#fff", fontWeight: 700, borderRadius: 1 }} />
            {relatedList.map(rel => (
              <Chip key={rel} label={rel} size="small"
                sx={{ fontSize: 10, height: 20, bgcolor: "#fff", color: palette.color,
                  border: `1px solid ${palette.light}`, borderRadius: 1 }} />
            ))}
          </Box>
        )}

        {/* Threshold control */}
        {!loading && resumes.length > 0 && (
          <Box display="flex" alignItems="center" gap={2} pb={1.5}>
            <Typography fontSize={11} color="text.secondary" fontWeight={600} sx={{ whiteSpace:"nowrap" }}>
              Min match:
            </Typography>
            <Box display="flex" gap={0.5}>
              {Array.from({ length: total }, (_, i) => i + 1).map(n => (
                <Box key={n} onClick={() => setMinMatch(n)} sx={{
                  width: 26, height: 26, borderRadius: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 11, fontWeight: 700,
                  bgcolor: minMatch === n ? palette.color : "#fff",
                  color:   minMatch === n ? "#fff" : palette.color,
                  border: `1.5px solid ${minMatch === n ? palette.color : palette.light}`,
                  transition: "all 0.15s",
                  "&:hover": { borderColor: palette.color },
                }}>
                  {n}
                </Box>
              ))}
            </Box>
            <Typography fontSize={11} color="text.secondary">of {total}</Typography>
            <Box sx={{ ml: "auto" }}>
              <Typography fontSize={11} fontWeight={700} color={palette.color}>
                {filtered.length} candidate{filtered.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {loading && (
          <Box>
            <LinearProgress sx={{ "& .MuiLinearProgress-bar": { bgcolor: palette.color } }} />
            <Box display="flex" justifyContent="center" py={8}>
              <Typography fontSize={13} color="text.secondary">Finding matched candidates…</Typography>
            </Box>
          </Box>
        )}

        {!loading && error && <Box p={3}><Alert severity="error">{error}</Alert></Box>}

        {!loading && !error && resumes.length === 0 && (
          <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
            <Box sx={{ width:56, height:56, borderRadius:"50%", bgcolor:"#f1f5f9",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <People sx={{ fontSize:26, color:"#94a3b8" }} />
            </Box>
            <Typography fontWeight={600} color="#64748b">No candidates found</Typography>
            <Typography fontSize={12} color="#94a3b8" textAlign="center" px={4}>
              No resume in the bank lists "{skill.skill_name}" or its related skills.
            </Typography>
          </Box>
        )}

        {!loading && !error && resumes.length > 0 && filtered.length === 0 && (
          <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1.5}>
            <Typography fontWeight={600} color="#64748b">No candidates match {minMatch}+ skills</Typography>
            <Typography fontSize={12} color="#94a3b8">Lower the minimum match above.</Typography>
          </Box>
        )}

        {!loading && !error && filtered.length > 0 && (
          <List disablePadding>
            {filtered.map((r, i) => {
              const allSkills = (r.skills||"").split(",").filter(Boolean).map(s=>s.trim());
              const queriedSkills = [skill.skill_name, ...relatedList];
              const pct = Math.round((r.matchCount / total) * 100);
              const isPerfect = r.matchCount === total && total > 1;

              return (
                <React.Fragment key={r._id}>
                  {i > 0 && <Divider />}
                  <ListItem alignItems="flex-start"
                    sx={{ px: 3, py: 2.5, "&:hover": { bgcolor: "#fafafa" } }}>

                    {/* Avatar + badge */}
                    <ListItemAvatar sx={{ minWidth: 52 }}>
                      <Box sx={{ position: "relative", display: "inline-block" }}>
                        <Avatar sx={{
                          bgcolor: isPerfect ? "#15803d" : palette.color,
                          fontWeight: 700, fontSize: 13, width: 40, height: 40,
                          boxShadow: isPerfect ? "0 0 0 2px #bbf7d0" : "none",
                        }}>
                          {nameInitials(r.name)}
                        </Avatar>
                        <Box sx={{
                          position:"absolute", bottom:-4, right:-6,
                          bgcolor: isPerfect ? "#15803d" : palette.color,
                          color:"#fff", fontSize:8, fontWeight:800,
                          px:0.6, py:0.2, borderRadius:0.5,
                          border:"1.5px solid #fff", lineHeight:1.2,
                        }}>
                          {r.matchCount}/{total}
                        </Box>
                      </Box>
                    </ListItemAvatar>

                    <ListItemText disableTypography primary={
                      <Box>
                        {/* Name row */}
                        <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                          <Typography fontWeight={700} fontSize={14} color="#0f172a">{r.name}</Typography>
                          {isPerfect && (
                            <Chip label="Perfect match" size="small" sx={{
                              fontSize: 9, height: 18, fontWeight: 700,
                              bgcolor: "#f0fdf4", color: "#15803d",
                              border: "1px solid #bbf7d0", borderRadius: 1,
                            }} />
                          )}
                          <Chip label={r.status} color={STATUS_COLOR[r.status]||"default"}
                            size="small" sx={{ fontSize: 10, height: 18, borderRadius: 1 }} />
                        </Box>

                        {/* Role */}
                        <Typography fontSize={12} color="#64748b" mb={1}>
                          {r.current_role||"—"}{r.current_company ? ` · ${r.current_company}` : ""}
                        </Typography>

                        {/* Match bar */}
                        <Box mb={1.5}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography fontSize={10} color="#94a3b8" fontWeight={600}>SKILL MATCH</Typography>
                            <Typography fontSize={10} fontWeight={700} color={palette.color}>{pct}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={pct}
                            sx={{
                              height: 5, borderRadius: 3, bgcolor: "#f1f5f9",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 3,
                                bgcolor: isPerfect ? "#15803d" : palette.color,
                              },
                            }}
                          />
                        </Box>

                        {/* Matched skills */}
                        <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                          {r.matchedSkills.map((ms, mi) => (
                            <Chip key={mi} label={ms} size="small" sx={{
                              fontSize: 10, height: 20, borderRadius: 1,
                              bgcolor: palette.color, color: "#fff", fontWeight: 600,
                            }} />
                          ))}
                          {allSkills.filter(s => !queriedSkills.some(q=>s.toLowerCase().includes(q.toLowerCase())))
                            .slice(0, 4).map((s, si) => (
                              <Chip key={si} label={s} size="small" sx={{
                                fontSize: 10, height: 20, borderRadius: 1,
                                bgcolor: "#f8fafc", color: "#64748b",
                                border: "1px solid #e2e8f0",
                              }} />
                            ))}
                        </Box>

                        {/* Quick stats */}
                        <Box display="flex" gap={2.5}>
                          <Typography fontSize={11} color="#94a3b8">
                            <strong style={{ color:"#475569" }}>{r.experience} yrs</strong> exp
                          </Typography>
                          {r.expected_salary > 0 && (
                            <Typography fontSize={11} color="#94a3b8">
                              <strong style={{ color:"#475569" }}>{fmtSalary(r.expected_salary)}</strong> expected
                            </Typography>
                          )}
                          {r.notice_period && (
                            <Typography fontSize={11} color="#94a3b8">
                              <strong style={{ color:"#475569" }}>{r.notice_period}</strong> notice
                            </Typography>
                          )}
                        </Box>

                        {r.linked_job_title && (
                          <Typography fontSize={11} color="#0369a1" mt={0.8} fontWeight={600}>
                            Applied for: {r.linked_job_title}
                          </Typography>
                        )}
                      </Box>
                    } />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: "1px solid #e2e8f0", bgcolor: "#fafafa" }}>
        <Button onClick={onClose} size="small"
          sx={{ textTransform: "none", color: "#64748b", fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Skills() {
  const [skills,    setSkills]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");
  const [categoryF, setCategoryF] = useState("");
  const [demandF,   setDemandF]   = useState("");
  const [formOpen,   setFormOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [matchOpen,  setMatchOpen]  = useState(false);
  const [matchSkill, setMatchSkill] = useState(null);

  const openSkillMatch = (skill, e) => { e?.stopPropagation(); setMatchSkill(skill); setMatchOpen(true); };

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await getAllSkills();
      setSkills(res.data||[]);
    } catch (err) {
      setError(err?.message||"Failed to load skills");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = skills.filter(s => {
    const q = search.toLowerCase();
    return (!q||s.skill_name?.toLowerCase().includes(q))
      && (!categoryF||s.category===categoryF)
      && (!demandF||s.demand_level===demandF);
  });

  const stats = {
    total:      skills.length,
    highDemand: skills.filter(s=>["High","Critical"].includes(s.demand_level)).length,
    categories: new Set(skills.map(s=>s.category)).size,
    candidates: skills.reduce((sum,s)=>sum+(s.candidate_count||0),0),
  };

  const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
  const openEdit   = s  => { setSelected(s); setFormData({...EMPTY_FORM,...s}); setFormOpen(true); };
  const openDelete = s  => { setSelected(s); setDeleteOpen(true); };
  const handleChange = e => setFormData(p=>({...p,[e.target.name]:e.target.value}));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (selected) await updateSkill(selected._id, formData);
      else          await createSkill(formData);
      setFormOpen(false); load();
    } catch (err) { setError(err?.message||"Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await deleteSkill(selected._id); setDeleteOpen(false); load(); }
    catch (err) { setError(err?.message||"Delete failed"); }
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={36} thickness={4} />
      </Box>
    );

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={()=>setError("")} sx={{ borderRadius:2 }}>{error}</Alert>}

      {/* ── Page header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0f172a" letterSpacing="-0.02em">
            Skills Matrix
          </Typography>
          <Typography fontSize={13} color="#64748b" mt={0.3}>
            Manage skill requirements and surface matched candidates
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{
            textTransform: "none", fontWeight: 700, borderRadius: 1.5,
            bgcolor: "#1e40af", "&:hover": { bgcolor: "#1e3a8a" },
            boxShadow: "0 1px 3px rgba(30,64,175,0.4)",
          }}>
          Add Skill
        </Button>
      </Box>

      {/* ── Stat cards ── */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <StatCard label="Total Skills"    value={stats.total}      icon={<Layers />}     accent="#1e40af" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="High Demand"     value={stats.highDemand} icon={<TrendingUp />} accent="#dc2626" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Categories"      value={stats.categories} icon={<Category />}   accent="#0369a1" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Candidate Links" value={stats.candidates} icon={<People />}     accent="#15803d" />
        </Grid>
      </Grid>

      {/* ── Filters ── */}
      {skills.length > 0 && (
        <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center"
          sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, p: 1.5 }}>
          <TextField
            placeholder="Search skills…" value={search}
            onChange={e=>setSearch(e.target.value)} size="small"
            sx={{ flexGrow:1, minWidth:200, "& .MuiOutlinedInput-root": { bgcolor:"#fff", borderRadius:1.5 } }}
            InputProps={{ startAdornment:<InputAdornment position="start"><Search fontSize="small" sx={{ color:"#94a3b8" }}/></InputAdornment> }}
          />
          <TextField select value={categoryF} onChange={e=>setCategoryF(e.target.value)} size="small"
            label="Category" sx={{ minWidth:180, "& .MuiOutlinedInput-root":{ bgcolor:"#fff", borderRadius:1.5 } }}>
            <MenuItem value="">All Categories</MenuItem>
            {CATEGORIES.map(c=><MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField select value={demandF} onChange={e=>setDemandF(e.target.value)} size="small"
            label="Demand" sx={{ minWidth:130, "& .MuiOutlinedInput-root":{ bgcolor:"#fff", borderRadius:1.5 } }}>
            <MenuItem value="">All Demand</MenuItem>
            {DEMAND_LEVELS.map(d=><MenuItem key={d} value={d}>{d}</MenuItem>)}
          </TextField>
          {(search||categoryF||demandF) && (
            <Button size="small" onClick={()=>{setSearch("");setCategoryF("");setDemandF("");}}
              sx={{ textTransform:"none", color:"#64748b", fontWeight:600, borderRadius:1.5 }}>
              Clear
            </Button>
          )}
        </Box>
      )}

      {/* ── Empty state ── */}
      {skills.length === 0 && !error && (
        <Card elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:2 }}>
          <Box display="flex" flexDirection="column" alignItems="center" py={10} gap={2}>
            <Box sx={{ width:64, height:64, borderRadius:2, bgcolor:"#f1f5f9",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Code sx={{ fontSize:30, color:"#94a3b8" }} />
            </Box>
            <Typography fontWeight={700} color="#0f172a">No skills yet</Typography>
            <Typography fontSize={13} color="#64748b">Build your skills matrix to surface matched candidates.</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}
              sx={{ textTransform:"none", fontWeight:700, borderRadius:1.5, mt:1,
                bgcolor:"#1e40af", "&:hover":{bgcolor:"#1e3a8a"} }}>
              Add First Skill
            </Button>
          </Box>
        </Card>
      )}




      {/* ── Skills grid ── */}
{skills.length > 0 && (
  <>
    {filtered.length === 0 ? (
      <Card elevation={0} sx={{ border:"1px solid #e2e8f0", borderRadius:2 }}>
        <Box textAlign="center" py={6}>
          <Typography color="#64748b">No skills match your filters</Typography>
        </Box>
      </Card>
    ) : (
      <Box sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          md: "1fr 1fr 1fr 1fr 1fr", 
        },
        gap: 2,
      }}>
        {filtered.map(skill => {
          const pal = CATEGORY_PALETTE[skill.category] || CATEGORY_PALETTE["Other"];
          const icon = CATEGORY_ICON[skill.category] || <Category />;
          const dm   = DEMAND_META[skill.demand_level] || DEMAND_META["Low"];
          const relatedList = (skill.related_skills||"").split(",").map(s=>s.trim()).filter(Boolean);

          return (
            <Card key={skill._id} elevation={0} sx={{
              display: "flex", flexDirection: "column",   
              overflow: "hidden",
              border: "1px solid #e2e8f0", borderRadius: 2,
              transition: "all 0.18s ease",
              "&:hover": {
                borderColor: pal.color,
                boxShadow: `0 4px 20px ${pal.color}18`,
                transform: "translateY(-2px)",
              },
            }}>
              {/* Category accent bar */}
              <Box sx={{ height: 3, bgcolor: pal.color, flexShrink: 0 }}/>

              <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Top row */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{
                      width: 38, height: 38, borderRadius: 1.5,
                      bgcolor: pal.bg, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      border: `1px solid ${pal.light}`, flexShrink: 0,
                    }}>
                      {React.cloneElement(icon, { sx:{ fontSize:18, color:pal.color } })}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Tooltip title={`View candidates matching "${skill.skill_name}"`}>
                        <Typography fontWeight={700} fontSize={14} color="#0f172a"
                          onClick={e=>openSkillMatch(skill,e)}
                          sx={{
                            cursor: "pointer", lineHeight: 1.3,
                            wordBreak: "break-word",
                            "&:hover":{ color:pal.color, textDecoration:"underline" },
                          }}>
                          {skill.skill_name}
                        </Typography>
                      </Tooltip>
                      <Typography fontSize={11} color="#94a3b8">{skill.category}</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={0.3} flexShrink={0}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={()=>openEdit(skill)}
                        sx={{ "&:hover":{ bgcolor:pal.bg } }}>
                        <Edit sx={{ fontSize:15, color:"#94a3b8" }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={()=>openDelete(skill)}
                        sx={{ "&:hover":{ bgcolor:"#fef2f2" } }}>
                        <Delete sx={{ fontSize:15, color:"#fca5a5" }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Stats row */}
                <Box display="flex" mb={2}
                  sx={{ border:"1px solid #e2e8f0", borderRadius:1.5, overflow:"hidden" }}>
                  <Tooltip title={`View candidates with "${skill.skill_name}"`}>
                    <Box flex={1} textAlign="center" py={1.2}
                      onClick={e=>openSkillMatch(skill,e)}
                      sx={{
                        cursor:"pointer", borderRight:"1px solid #e2e8f0",
                        "&:hover":{ bgcolor:pal.bg }, transition:"background 0.15s",
                      }}>
                      <Typography fontWeight={800} fontSize={18} color={pal.color} lineHeight={1}>
                        {skill.candidate_count||0}
                      </Typography>
                      <Typography fontSize={10} color="#94a3b8" fontWeight={600}
                        textTransform="uppercase" letterSpacing="0.06em" mt={0.3}>
                        Candidates
                      </Typography>
                    </Box>
                  </Tooltip>
                  <Box flex={1} textAlign="center" py={1.2}>
                    <Typography fontWeight={800} fontSize={18} color="#0f172a" lineHeight={1}>
                      {skill.job_count||0}
                    </Typography>
                    <Typography fontSize={10} color="#94a3b8" fontWeight={600}
                      textTransform="uppercase" letterSpacing="0.06em" mt={0.3}>
                      Open Jobs
                    </Typography>
                  </Box>
                </Box>

                {/* Demand + proficiency */}
                <Box display="flex" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
                  <Box sx={{
                    px:1, py:0.4, borderRadius:1, fontSize:10, fontWeight:700,
                    bgcolor:dm.bg, color:dm.color, border:`1px solid ${dm.border}`,
                    lineHeight:1.4, flexShrink:0,
                  }}>
                    {skill.demand_level} Demand
                  </Box>
                  {skill.proficiency_levels && (
                    <Typography fontSize={10} color="#94a3b8" sx={{ fontStyle:"italic" }}>
                      {skill.proficiency_levels}
                    </Typography>
                  )}
                </Box>

                {/* Related skills — pushed to bottom */}
                {relatedList.length > 0 && (
                  <Box mt="auto" pt={1}>
                    <Typography fontSize={10} color="#94a3b8" fontWeight={600}
                      textTransform="uppercase" letterSpacing="0.08em" mb={0.8}>
                      Related
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {relatedList.map((rel, ri) => (
                        <Tooltip key={ri} title="Search candidates matching all skills on this card">
                          <Chip label={rel} size="small"
                            onClick={e=>openSkillMatch(skill,e)}
                            sx={{
                              fontSize:10, height:20, borderRadius:1,
                              bgcolor:pal.bg, color:pal.color,
                              border:`1px solid ${pal.light}`,
                              fontWeight:500, cursor:"pointer",
                              "&:hover":{ bgcolor:pal.color, color:"#fff" },
                              transition:"all 0.15s",
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    )}
  </>
)}

      {/* ── Dialogs ── */}
      <SkillResumesDialog open={matchOpen} onClose={()=>setMatchOpen(false)} skill={matchSkill} />

      {/* Add/Edit */}
      <Dialog open={formOpen} onClose={()=>setFormOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx:{ borderRadius:2.5 } }}>
        <DialogTitle sx={{ fontWeight:800, fontSize:"1rem", color:"#0f172a",
          borderBottom:"1px solid #e2e8f0", py:2 }}>
          {selected ? "Edit Skill" : "Add New Skill"}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt:2.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField  size="small" required label="Skill Name"
                  name="skill_name" value={formData.skill_name} onChange={handleChange}
                  placeholder="e.g. React.js"
                  sx={{ width: "100%", minWidth: 200, "& .MuiOutlinedInput-root":{ borderRadius:1.5 } }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select  size="small" required label="Category"
                  name="category" value={formData.category} onChange={handleChange}
                  sx={{ width: "100%", minWidth: 200,"& .MuiOutlinedInput-root":{ borderRadius:1.5 } }}>
                  {CATEGORIES.map(c=><MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select  size="small" label="Demand Level"
                  name="demand_level" value={formData.demand_level} onChange={handleChange}
                  sx={{width: "100%", minWidth: 200, "& .MuiOutlinedInput-root":{ borderRadius:1.5 } }}>
                  {DEMAND_LEVELS.map(d=><MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField  size="small" label="Proficiency Levels"
                  name="proficiency_levels" value={formData.proficiency_levels} onChange={handleChange}
                  placeholder="e.g. Beginner, Intermediate, Advanced, Expert"
                  sx={{ width: "100%", minWidth: 200,"& .MuiOutlinedInput-root":{ borderRadius:1.5 } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField  size="small" label="Related Skills (comma-separated)"
                  name="related_skills" value={formData.related_skills} onChange={handleChange}
                  placeholder="e.g. JavaScript, TypeScript, Redux"
                  sx={{ width: "100%", minWidth: 520,"& .MuiOutlinedInput-root":{ borderRadius:1.5 } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField  multiline rows={3} size="small" label="Description"
                  name="description" value={formData.description} onChange={handleChange}
                  sx={{ width: "100%", minWidth: 520,"& .MuiOutlinedInput-root":{ borderRadius:1.5 } }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px:3, pb:2.5, borderTop:"1px solid #e2e8f0", gap:1 }}>
            <Button onClick={()=>setFormOpen(false)}
              sx={{ textTransform:"none", color:"#64748b", fontWeight:600, borderRadius:1.5 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}
              sx={{ textTransform:"none", fontWeight:700, borderRadius:1.5,
                bgcolor:"#1e40af", "&:hover":{bgcolor:"#1e3a8a"} }}>
              {saving ? <CircularProgress size={16} sx={{ mr:1, color:"#fff" }} /> : null}
              {selected ? "Update" : "Create Skill"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} onClose={()=>setDeleteOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx:{ borderRadius:2.5 } }}>
        <DialogTitle fontWeight={800} fontSize="1rem" color="#0f172a">Delete Skill</DialogTitle>
        <DialogContent>
          <Typography fontSize={14} color="#475569">
            Are you sure you want to delete <strong>{selected?.skill_name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2.5, gap:1 }}>
          <Button onClick={()=>setDeleteOpen(false)}
            sx={{ textTransform:"none", color:"#64748b", fontWeight:600, borderRadius:1.5 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}
            sx={{ textTransform:"none", fontWeight:700, borderRadius:1.5 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}