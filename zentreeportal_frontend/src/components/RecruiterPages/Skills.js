// src/pages/Skills.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  MenuItem, Chip, IconButton, Tooltip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  InputAdornment, Divider,
} from "@mui/material";
import {
  Add, Search, Edit, Delete,
  Code, Cloud, Storage, AutoGraph, Brush, Star,
  Psychology, Devices, Category,
} from "@mui/icons-material";

// ── Inline API calls ──────────────────────────────────────────────────────────
const BASE = "http://localhost:5000/api";
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});
const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

// ── GET /api/skills/?q=&category=&demand= ─────────────────────────────────────
const getAllSkills = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE}/skills/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
};
// ── POST /api/skills/ ─────────────────────────────────────────────────────────
const createSkill = (payload) =>
  fetch(`${BASE}/skills/`, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// ── PUT /api/skills/:id ───────────────────────────────────────────────────────
const updateSkill = (id, payload) =>
  fetch(`${BASE}/skills/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(payload) }).then(handle);
// ── DELETE /api/skills/:id ────────────────────────────────────────────────────
const deleteSkill = (id) =>
  fetch(`${BASE}/skills/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
// ─────────────────────────────────────────────────────────────────────────────

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Programming Languages", "Frameworks & Libraries", "Databases",
  "Cloud & DevOps", "Data Science & ML", "Design & UX",
  "Management & Soft Skills", "Domain Expertise", "Tools & Platforms", "Other",
];
const DEMAND_LEVELS = ["Critical", "High", "Medium", "Low"];

const DEMAND_COLOR = { Critical: "error", High: "warning", Medium: "info", Low: "default" };

const CATEGORY_ICON = {
  "Programming Languages":  <Code />,
  "Frameworks & Libraries": <Devices />,
  "Databases":              <Storage />,
  "Cloud & DevOps":         <Cloud />,
  "Data Science & ML":      <AutoGraph />,
  "Design & UX":            <Brush />,
  "Management & Soft Skills":<Psychology />,
  "Domain Expertise":       <Star />,
  "Tools & Platforms":      <Devices />,
  "Other":                  <Category />,
};

const CATEGORY_BG = {
  "Programming Languages":  "#e8eaf6",
  "Frameworks & Libraries": "#e3f2fd",
  "Databases":              "#e8f5e9",
  "Cloud & DevOps":         "#ede7f6",
  "Data Science & ML":      "#e0f2f1",
  "Design & UX":            "#fce4ec",
  "Management & Soft Skills":"#fff3e0",
  "Domain Expertise":       "#f3e5f5",
  "Tools & Platforms":      "#e1f5fe",
  "Other":                  "#f5f5f5",
};

const CATEGORY_COLOR = {
  "Programming Languages":  "#1a237e",
  "Frameworks & Libraries": "#0277bd",
  "Databases":              "#2e7d32",
  "Cloud & DevOps":         "#6a1b9a",
  "Data Science & ML":      "#00695c",
  "Design & UX":            "#ad1457",
  "Management & Soft Skills":"#e65100",
  "Domain Expertise":       "#6a1b9a",
  "Tools & Platforms":      "#01579b",
  "Other":                  "#546e7a",
};

const EMPTY_FORM = {
  skill_name: "", category: "", proficiency_levels: "",
  description: "", demand_level: "Medium", related_skills: "",
};

export default function Skills() {
  const [skills,   setSkills]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [categoryF,setCategoryF]= useState("");
  const [demandF,  setDemandF]  = useState("");

  const [formOpen,  setFormOpen]  = useState(false);
  const [deleteOpen,setDeleteOpen]= useState(false);
  const [selected,  setSelected]  = useState(null);
  const [formData,  setFormData]  = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  // ── GET /api/skills/ ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await getAllSkills();
      setSkills(res.data || []);
    } catch (err) {
      setError(err?.message || "Failed to load skills");
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Client-side filter ────────────────────────────────────────────────────
  const filtered = skills.filter(s => {
    const q  = search.toLowerCase();
    const mQ = !q || s.skill_name?.toLowerCase().includes(q);
    const mC = !categoryF || s.category === categoryF;
    const mD = !demandF   || s.demand_level === demandF;
    return mQ && mC && mD;
  });

  const stats = {
    total:      skills.length,
    highDemand: skills.filter(s => ["High","Critical"].includes(s.demand_level)).length,
    categories: new Set(skills.map(s => s.category)).size,
    candidates: skills.reduce((sum, s) => sum + (s.candidate_count || 0), 0),
  };

  const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setFormOpen(true); };
  const openEdit   = s  => { setSelected(s); setFormData({ ...EMPTY_FORM, ...s }); setFormOpen(true); };
  const openDelete = s  => { setSelected(s); setDeleteOpen(true); };

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── POST or PUT ───────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (selected) { await updateSkill(selected._id, formData); }
      else          { await createSkill(formData); }
      setFormOpen(false); load();
    } catch (err) { setError(err?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try { await deleteSkill(selected._id); setDeleteOpen(false); load(); }
    catch (err) { setError(err?.message || "Delete failed"); }
  };

  if (loading)
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={48} /></Box>;

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" color="primary.dark">Skills Matrix</Typography>
          <Typography color="text.secondary" mt={0.5}>Manage skill requirements and track market demand</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="large">Add New Skill</Button>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2.5}>
        {[
          { label: "Total Skills",     value: stats.total,      color: "#1a237e" },
          { label: "High Demand",      value: stats.highDemand, color: "#c62828" },
          { label: "Categories",       value: stats.categories, color: "#0277bd" },
          { label: "Candidate Links",  value: stats.candidates, color: "#2e7d32" },
        ].map(({ label, value, color }) => (
          <Grid item xs={6} md={3} key={label}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography fontSize={12} color="text.secondary" fontWeight={600} textTransform="uppercase">{label}</Typography>
                <Typography variant="h3" fontWeight={800} sx={{ color }} mt={0.5}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      {skills.length > 0 && (
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            placeholder="Search skills…" value={search}
            onChange={e => setSearch(e.target.value)} size="small" sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }}
          />
          <TextField select value={categoryF} onChange={e => setCategoryF(e.target.value)} size="small" sx={{ minWidth: 200 }} label="Category">
            <MenuItem value="">All Categories</MenuItem>
            {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField select value={demandF} onChange={e => setDemandF(e.target.value)} size="small" sx={{ minWidth: 140 }} label="Demand">
            <MenuItem value="">All Demand</MenuItem>
            {DEMAND_LEVELS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </TextField>
        </Box>
      )}

      {/* Empty state */}
      {skills.length === 0 && !error ? (
        <Card>
          <Box display="flex" flexDirection="column" alignItems="center" py={10} gap={2}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: "#e8eaf6" }}>
              <Code sx={{ fontSize: 36, color: "#9fa8da" }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary">No skills yet</Typography>
            <Typography fontSize={14} color="text.disabled">Build your skills matrix by clicking "Add New Skill".</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ mt: 1 }}>Add New Skill</Button>
          </Box>
        </Card>
      ) : (
        /* Skills grid */
        <Grid container spacing={2.5}>
          {filtered.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <Box textAlign="center" py={6}>
                  <Typography color="text.secondary">No skills match your filters</Typography>
                </Box>
              </Card>
            </Grid>
          ) : filtered.map(skill => {
            const bg    = CATEGORY_BG[skill.category]    || "#f5f5f5";
            const color = CATEGORY_COLOR[skill.category] || "#546e7a";
            const icon  = CATEGORY_ICON[skill.category]  || <Category />;
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={skill._id}>
                <Card sx={{ height: "100%", "&:hover": { boxShadow: 6, transform: "translateY(-2px)" }, transition: "all 0.15s" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    {/* Card top row */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                      <Avatar sx={{ bgcolor: bg, color, width: 44, height: 44 }}>
                        {React.cloneElement(icon, { sx: { fontSize: 22 } })}
                      </Avatar>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(skill)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => openDelete(skill)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Typography fontWeight={700} fontSize="1.05rem" color="text.primary" mb={0.3}>
                      {skill.skill_name}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary" mb={1.5}>{skill.category}</Typography>

                    {/* Stats row */}
                    <Box display="flex" gap={3} py={1.5} sx={{ borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0" }} mb={1.5}>
                      <Box>
                        <Typography fontWeight={800} fontSize="1.1rem">{skill.candidate_count || 0}</Typography>
                        <Typography fontSize={11} color="text.secondary">Candidates</Typography>
                      </Box>
                      <Box>
                        <Typography fontWeight={800} fontSize="1.1rem">{skill.job_count || 0}</Typography>
                        <Typography fontSize={11} color="text.secondary">Open Jobs</Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={`${skill.demand_level} Demand`}
                      color={DEMAND_COLOR[skill.demand_level] || "default"}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: 11 }}
                    />

                    {skill.proficiency_levels && (
                      <Typography fontSize={11} color="text.secondary" mt={1} noWrap>
                        📊 {skill.proficiency_levels}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0" }}>
          {selected ? "Edit Skill" : "Add New Skill"}
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth size="small" required label="Skill Name *"
                  name="skill_name" value={formData.skill_name} onChange={handleChange} placeholder="e.g. React.js" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" required label="Category *"
                  name="category" value={formData.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Demand Level"
                  name="demand_level" value={formData.demand_level} onChange={handleChange}>
                  {DEMAND_LEVELS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Proficiency Levels"
                  name="proficiency_levels" value={formData.proficiency_levels} onChange={handleChange}
                  placeholder="e.g. Beginner, Intermediate, Advanced, Expert" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Related Skills (comma-separated)"
                  name="related_skills" value={formData.related_skills} onChange={handleChange}
                  placeholder="e.g. JavaScript, TypeScript, Redux" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} size="small" label="Description"
                  name="description" value={formData.description} onChange={handleChange} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              {selected ? "Update Skill" : "Create Skill"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Delete confirm ── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete Skill</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{selected?.skill_name}</strong>?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}