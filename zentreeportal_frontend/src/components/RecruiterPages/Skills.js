
import React, { useState, useEffect, useCallback,useRef } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  MenuItem, Chip, IconButton, Tooltip, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  InputAdornment, Divider, List, ListItem, ListItemAvatar,
  ListItemText, Badge, LinearProgress,Tabs,Tab
} from "@mui/material";
import {
  Add, Search, Edit, Delete, People,
  Code, Cloud, Storage, AutoGraph, Brush, Star,
  Psychology, Devices, Category, Close as CloseIcon,
  WorkOutline, TrendingUp, Layers,
} from "@mui/icons-material";

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

const getAllSkills     = (p = {}) => {
  const qs = new URLSearchParams(p).toString();
  return fetch(`${BASE}/skills/${qs ? "?" + qs : ""}`, { headers: getHeaders() }).then(handle);
};
const createSkill     = (pl) => fetch(`${BASE}/skills/`,     { method: "POST",   headers: getHeaders(), body: JSON.stringify(pl) }).then(handle);
const updateSkill     = (id, pl) => fetch(`${BASE}/skills/${id}`, { method: "PUT",    headers: getHeaders(), body: JSON.stringify(pl) }).then(handle);
const deleteSkill     = (id) => fetch(`${BASE}/skills/${id}`, { method: "DELETE", headers: getHeaders() }).then(handle);
const getResumesBySkill = (name) =>
  fetch(`${BASE}/resumes/by-skill/${encodeURIComponent(name)}`, { headers: getHeaders() }).then(handle);

const getBenchBySkill = (name) =>
  fetch(`${BASE}/bench/by-skill/${encodeURIComponent(name)}`, { headers: getHeaders() }).then(handle);

const talentSearchResumes = (q) =>
  fetch(`${BASE}/resumes/talent-search?q=${encodeURIComponent(q)}`, { headers: getHeaders() }).then(handle);

const talentSearchBench = (q) =>
  fetch(`${BASE}/bench/talent-search?q=${encodeURIComponent(q)}`, { headers: getHeaders() }).then(handle);

const getSkillInsights = (id) =>
  fetch(`${BASE}/skills/${id}/insights`, { headers: getHeaders() }).then(handle);



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

const BENCH_STATUS_COLOR = {
  Available:     { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
  "In Interview":{ bg: "#fff3e0", color: "#e65100", border: "#ffcc80" },
  Deployed:      { bg: "#e3f2fd", color: "#0277bd", border: "#90caf9" },
  "On Hold":     { bg: "#f3e5f5", color: "#7b1fa2", border: "#ce93d8" },
  Resigned:      { bg: "#f5f5f5", color: "#757575", border: "#e0e0e0" },
};
const EMPLOYMENT_TYPE_COLOR = {
  Permanent: "#1a237e", Contract: "#4a148c", C2H: "#1b5e20", Freelance: "#e65100",
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


function SkillResumesDialog({ open, onClose, skill }) {
  const [tab,          setTab]          = useState(0);   // 0=candidates, 1=bench, 2=insights
  const [resumes,      setResumes]      = useState([]);
  const [bench,        setBench]        = useState([]);
  const [insights,     setInsights]     = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [insightsLoad, setInsightsLoad] = useState(false);
  const [error,        setError]        = useState("");
  const [minMatch,     setMinMatch]     = useState(1);
  const [availOnly,    setAvailOnly]    = useState(false);

  useEffect(() => {
    if (!open || !skill) return;
    setLoading(true); setError(""); setResumes([]); setBench([]);
    setTab(0); setAvailOnly(false);

    const relatedList = (skill.related_skills || "").split(",").map(s => s.trim()).filter(Boolean);
    const allNames    = [skill.skill_name, ...relatedList];
    setMinMatch(Math.max(1, Math.ceil(allNames.length / 2)));

    // Fetch resumes + bench in parallel
    Promise.all([
      Promise.all(allNames.map(name => getResumesBySkill(name).catch(() => ({ data: [] })))),
      Promise.all(allNames.map(name => getBenchBySkill(name).catch(() => ({ data: [] })))),
    ]).then(([resumeResults, benchResults]) => {

      // ── Merge resumes ────────────────────────────────────────────────────
      const rMap = new Map();
      resumeResults.forEach((res, idx) => {
        (res.data || []).forEach(r => {
          if (!rMap.has(r._id)) rMap.set(r._id, { ...r, matchedSkills: [], matchCount: 0 });
          const e = rMap.get(r._id);
          if (!e.matchedSkills.includes(allNames[idx])) {
            e.matchedSkills.push(allNames[idx]);
            e.matchCount++;
          }
        });
      });
      setResumes(Array.from(rMap.values()).sort((a, b) => b.matchCount - a.matchCount));

      // ── Merge bench ──────────────────────────────────────────────────────
      const bMap = new Map();
      benchResults.forEach((res, idx) => {
        (res.data || []).forEach(b => {
          if (!bMap.has(b._id)) bMap.set(b._id, { ...b, matchedSkills: [], matchCount: 0 });
          const e = bMap.get(b._id);
          if (!e.matchedSkills.includes(allNames[idx])) {
            e.matchedSkills.push(allNames[idx]);
            e.matchCount++;
          }
        });
      });
      setBench(Array.from(bMap.values()).sort((a, b) => {
        // Available first, then by match count
        if (a.status === "Available" && b.status !== "Available") return -1;
        if (b.status === "Available" && a.status !== "Available") return 1;
        return b.matchCount - a.matchCount;
      }));

    }).catch(err => setError(err?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [open, skill]);

  // Load insights when tab 2 is selected
  useEffect(() => {
    if (tab !== 2 || !skill?._id || insights) return;
    setInsightsLoad(true);
    getSkillInsights(skill._id)
      .then(res => setInsights(res.data))
      .catch(() => setInsights(null))
      .finally(() => setInsightsLoad(false));
  }, [tab, skill, insights]);

  // Reset insights when skill changes
  useEffect(() => { setInsights(null); }, [skill]);

  if (!skill) return null;

  const relatedList = (skill.related_skills || "").split(",").map(s => s.trim()).filter(Boolean);
  const total       = 1 + relatedList.length;
  const palette     = CATEGORY_PALETTE[skill.category] || CATEGORY_PALETTE["Other"];

  const filteredResumes = resumes.filter(r => r.matchCount >= minMatch);
  const filteredBench   = bench.filter(b =>
    b.matchCount >= minMatch && (!availOnly || b.status === "Available")
  );
  const availableNow    = bench.filter(b => b.status === "Available").length;

  const fmtSal = (v) => {
    if (!v || v === 0) return "—";
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    return `₹${Number(v).toLocaleString("en-IN")}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", maxHeight: "92vh" } }}>

      {/* ── Header ── */}
      <Box sx={{ bgcolor: palette.bg, px: 3, pt: 2.5, pb: 0, borderBottom: "1px solid #e2e8f0" }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2, bgcolor: palette.color,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {React.cloneElement(CATEGORY_ICON[skill.category] || <Category />,
                { sx: { fontSize: 22, color: "#fff" } })}
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize="1.05rem" color="#0f172a">
                {skill.skill_name}
              </Typography>
              <Typography fontSize={11} color="text.secondary">{skill.category}</Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        {/* Quick summary bar */}
        {!loading && (
          <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
            <Chip
              label={`${filteredResumes.length} Candidates`}
              size="small"
              sx={{ bgcolor: palette.color, color: "#fff", fontWeight: 700, fontSize: 11 }}
            />
            <Chip
              label={`${availableNow} Available Now`}
              size="small"
              sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 700, fontSize: 11,
                    border: "1px solid #a5d6a7" }}
            />
            <Chip
              label={`${filteredBench.length} Bench`}
              size="small"
              sx={{ bgcolor: "#e8eaf6", color: "#1a237e", fontWeight: 700, fontSize: 11 }}
            />
            {relatedList.map(rel => (
              <Chip key={rel} label={rel} size="small"
                sx={{ fontSize: 10, height: 20, bgcolor: "#fff", color: palette.color,
                      border: `1px solid ${palette.light}`, borderRadius: 1 }} />
            ))}
          </Box>
        )}

        {/* Threshold + tabs */}
        {!loading && (resumes.length > 0 || bench.length > 0) && total > 1 && (
          <Box display="flex" alignItems="center" gap={2} pb={1}>
            <Typography fontSize={11} color="text.secondary" fontWeight={600}>Min match:</Typography>
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
                }}>
                  {n}
                </Box>
              ))}
            </Box>
            <Typography fontSize={11} color="text.secondary">of {total}</Typography>
          </Box>
        )}

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ "& .MuiTab-root": { fontSize: 12, fontWeight: 700, textTransform: "none", minHeight: 40 } }}>
          <Tab label={`Candidates (${filteredResumes.length})`} />
          <Tab label={
            <Box display="flex" alignItems="center" gap={0.8}>
              Bench ({filteredBench.length})
              {availableNow > 0 && (
                <Chip label={`${availableNow} free`} size="small"
                  sx={{ fontSize: 9, height: 16, bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 700 }} />
              )}
            </Box>
          } />
          <Tab label="Talent Insights" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, overflow: "auto" }}>
        {loading && (
          <Box>
            <LinearProgress sx={{ "& .MuiLinearProgress-bar": { bgcolor: palette.color } }} />
            <Box display="flex" justifyContent="center" py={8}>
              <Typography fontSize={13} color="text.secondary">Searching across candidates and bench…</Typography>
            </Box>
          </Box>
        )}
        {!loading && error && <Box p={3}><Alert severity="error">{error}</Alert></Box>}

        {/* ── Tab 0: Candidates ── */}
        {!loading && tab === 0 && (
          <>
            {filteredResumes.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
                <People sx={{ fontSize: 48, color: "#e0e0e0" }} />
                <Typography color="text.secondary" fontWeight={600}>No candidates found</Typography>
                <Typography fontSize={12} color="text.disabled" textAlign="center" px={4}>
                  No resume in the bank lists "{skill.skill_name}". Try lowering the min match.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredResumes.map((r, i) => {
                  const allSkillsArr = (r.skills || "").split(",").filter(Boolean).map(s => s.trim());
                  const pct = Math.round((r.matchCount / total) * 100);
                  const isPerfect = r.matchCount === total && total > 1;
                  const bsColor = BENCH_STATUS_COLOR[r.status] || { bg: "#f5f5f5", color: "#757575", border: "#e0e0e0" };

                  return (
                    <React.Fragment key={r._id}>
                      {i > 0 && <Divider />}
                      <ListItem alignItems="flex-start"
                        sx={{ px: 3, py: 2, "&:hover": { bgcolor: "#fafafa" } }}>
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
                              position: "absolute", bottom: -4, right: -6,
                              bgcolor: isPerfect ? "#15803d" : palette.color,
                              color: "#fff", fontSize: 8, fontWeight: 800,
                              px: 0.6, py: 0.2, borderRadius: 0.5,
                              border: "1.5px solid #fff", lineHeight: 1.2,
                            }}>
                              {r.matchCount}/{total}
                            </Box>
                          </Box>
                        </ListItemAvatar>

                        <ListItemText disableTypography primary={
                          <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                              <Typography fontWeight={700} fontSize={14} color="#0f172a">{r.name}</Typography>
                              {isPerfect && (
                                <Chip label="Perfect match" size="small" sx={{
                                  fontSize: 9, height: 18, fontWeight: 700,
                                  bgcolor: "#f0fdf4", color: "#15803d",
                                  border: "1px solid #bbf7d0", borderRadius: 1,
                                }} />
                              )}
                              <Chip label={r.status}
                                size="small"
                                sx={{ fontSize: 10, height: 18, borderRadius: 1,
                                      bgcolor: bsColor.bg, color: bsColor.color,
                                      border: `1px solid ${bsColor.border}`, fontWeight: 700 }} />
                              <Typography fontSize={11} color="#94a3b8">{r.resume_id}</Typography>
                            </Box>

                            <Typography fontSize={12} color="#64748b" mb={1}>
                              {r.current_role || "—"}{r.current_company ? ` · ${r.current_company}` : ""}
                            </Typography>

                            {/* Match bar */}
                            <Box mb={1.2}>
                              <Box display="flex" justifyContent="space-between" mb={0.4}>
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
                                }} />
                            </Box>

                            {/* Matched skills */}
                            <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                              {r.matchedSkills.map((ms, mi) => (
                                <Chip key={mi} label={ms} size="small" sx={{
                                  fontSize: 10, height: 20, borderRadius: 1,
                                  bgcolor: palette.color, color: "#fff", fontWeight: 600,
                                }} />
                              ))}
                              {allSkillsArr
                                .filter(s => !r.matchedSkills.some(m => s.toLowerCase().includes(m.toLowerCase())))
                                .slice(0, 3).map((s, si) => (
                                  <Chip key={si} label={s} size="small" sx={{
                                    fontSize: 10, height: 20, borderRadius: 1,
                                    bgcolor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0",
                                  }} />
                                ))}
                            </Box>

                            {/* Quick stats */}
                            <Box display="flex" gap={2.5} flexWrap="wrap">
                              <Typography fontSize={11} color="#94a3b8">
                                <strong style={{ color: "#475569" }}>{r.experience} yrs</strong> exp
                              </Typography>
                              {r.expected_salary > 0 && (
                                <Typography fontSize={11} color="#94a3b8">
                                  <strong style={{ color: "#475569" }}>{fmtSalary(r.expected_salary)}</strong> expected
                                </Typography>
                              )}
                              {r.notice_period && (
                                <Typography fontSize={11} color="#94a3b8">
                                  <strong style={{ color: "#475569" }}>{r.notice_period}</strong> notice
                                </Typography>
                              )}
                              {r.location && (
                                <Typography fontSize={11} color="#94a3b8">
                                  📍 <strong style={{ color: "#475569" }}>{r.location}</strong>
                                </Typography>
                              )}
                            </Box>

                            {r.linked_job_title && (
                              <Typography fontSize={11} color="#0369a1" mt={0.8} fontWeight={600}>
                                Applied for: {r.linked_job_id} — {r.linked_job_title}
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
          </>
        )}

        {/* ── Tab 1: Bench People ── */}
        {!loading && tab === 1 && (
          <>
            {/* Available-only toggle */}
            <Box px={3} py={1.5} bgcolor="#f8fafc" borderBottom="1px solid #e2e8f0"
              display="flex" alignItems="center" gap={2}>
              <Typography fontSize={12} color="text.secondary">Filter:</Typography>
              <Chip
                label={availOnly ? "✓ Available only" : "All bench"}
                size="small" onClick={() => setAvailOnly(p => !p)}
                sx={{
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  bgcolor: availOnly ? "#e8f5e9" : "#fff",
                  color: availOnly ? "#2e7d32" : "#64748b",
                  border: `1px solid ${availOnly ? "#a5d6a7" : "#e0e0e0"}`,
                }}
              />
              <Typography fontSize={11} color="text.secondary" sx={{ ml: "auto" }}>
                {availableNow} available now · {filteredBench.length} shown
              </Typography>
            </Box>

            {filteredBench.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
                <People sx={{ fontSize: 48, color: "#e0e0e0" }} />
                <Typography color="text.secondary" fontWeight={600}>No bench people found</Typography>
                <Typography fontSize={12} color="text.disabled" textAlign="center" px={4}>
                  {availOnly ? "No available bench people with this skill." : "No bench people match this skill."}
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredBench.map((b, i) => {
                  const allSkillsArr = (b.skills || "").split(",").filter(Boolean).map(s => s.trim());
                  const pct         = Math.round((b.matchCount / total) * 100);
                  const isAvailable = b.status === "Available";
                  const sColor      = BENCH_STATUS_COLOR[b.status] || BENCH_STATUS_COLOR["On Hold"];
                  const etColor     = EMPLOYMENT_TYPE_COLOR[b.employment_type] || "#475569";

                  return (
                    <React.Fragment key={b._id}>
                      {i > 0 && <Divider />}
                      <ListItem alignItems="flex-start"
                        sx={{
                          px: 3, py: 2,
                          bgcolor: isAvailable ? "#fafffe" : "transparent",
                          "&:hover": { bgcolor: isAvailable ? "#f0fdf4" : "#fafafa" },
                          borderLeft: isAvailable ? "3px solid #4caf50" : "3px solid transparent",
                        }}>
                        <ListItemAvatar sx={{ minWidth: 52 }}>
                          <Box sx={{ position: "relative", display: "inline-block" }}>
                            <Avatar sx={{
                              bgcolor: isAvailable ? "#2e7d32" : "#7b1fa2",
                              fontWeight: 700, fontSize: 13, width: 40, height: 40,
                              boxShadow: isAvailable ? "0 0 0 2px #a5d6a7" : "none",
                            }}>
                              {nameInitials(b.name)}
                            </Avatar>
                            <Box sx={{
                              position: "absolute", bottom: -4, right: -6,
                              bgcolor: isAvailable ? "#2e7d32" : "#7b1fa2",
                              color: "#fff", fontSize: 8, fontWeight: 800,
                              px: 0.6, py: 0.2, borderRadius: 0.5,
                              border: "1.5px solid #fff", lineHeight: 1.2,
                            }}>
                              {b.matchCount}/{total}
                            </Box>
                          </Box>
                        </ListItemAvatar>

                        <ListItemText disableTypography primary={
                          <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                              <Typography fontWeight={700} fontSize={14} color="#0f172a">{b.name}</Typography>
                              {isAvailable && (
                                <Chip label="🟢 Available Now" size="small" sx={{
                                  fontSize: 9, height: 18, fontWeight: 700,
                                  bgcolor: "#e8f5e9", color: "#2e7d32",
                                  border: "1px solid #a5d6a7", borderRadius: 1,
                                }} />
                              )}
                              <Chip label={b.status} size="small" sx={{
                                fontSize: 10, height: 18, borderRadius: 1,
                                bgcolor: sColor.bg, color: sColor.color,
                                border: `1px solid ${sColor.border}`, fontWeight: 700,
                              }} />
                              <Chip label={b.employment_type || "Permanent"} size="small" sx={{
                                fontSize: 9, height: 18, borderRadius: 1,
                                bgcolor: `${etColor}18`, color: etColor, fontWeight: 700,
                              }} />
                              <Typography fontSize={11} color="#94a3b8">{b.bench_id}</Typography>
                            </Box>

                            <Typography fontSize={12} color="#64748b" mb={1}>
                              {b.current_role || "—"}
                              {b.last_client ? ` · Last client: ${b.last_client}` : ""}
                            </Typography>

                            {/* Match bar */}
                            <Box mb={1.2}>
                              <Box display="flex" justifyContent="space-between" mb={0.4}>
                                <Typography fontSize={10} color="#94a3b8" fontWeight={600}>SKILL MATCH</Typography>
                                <Typography fontSize={10} fontWeight={700} color={isAvailable ? "#2e7d32" : palette.color}>
                                  {pct}%
                                </Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={pct}
                                sx={{
                                  height: 5, borderRadius: 3, bgcolor: "#f1f5f9",
                                  "& .MuiLinearProgress-bar": {
                                    borderRadius: 3,
                                    bgcolor: isAvailable ? "#4caf50" : palette.color,
                                  },
                                }} />
                            </Box>

                            {/* Matched skills */}
                            <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                              {b.matchedSkills.map((ms, mi) => (
                                <Chip key={mi} label={ms} size="small" sx={{
                                  fontSize: 10, height: 20, borderRadius: 1,
                                  bgcolor: isAvailable ? "#2e7d32" : palette.color,
                                  color: "#fff", fontWeight: 600,
                                }} />
                              ))}
                              {allSkillsArr
                                .filter(s => !b.matchedSkills.some(m => s.toLowerCase().includes(m.toLowerCase())))
                                .slice(0, 3).map((s, si) => (
                                  <Chip key={si} label={s} size="small" sx={{
                                    fontSize: 10, height: 20, borderRadius: 1,
                                    bgcolor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0",
                                  }} />
                                ))}
                            </Box>

                            {/* Quick stats */}
                            <Box display="flex" gap={2.5} flexWrap="wrap">
                              <Typography fontSize={11} color="#94a3b8">
                                <strong style={{ color: "#475569" }}>{b.experience} yrs</strong> exp
                              </Typography>
                              {b.expected_salary > 0 && (
                                <Typography fontSize={11} color="#94a3b8">
                                  <strong style={{ color: "#475569" }}>{fmtSalary(b.expected_salary)}</strong> expected
                                </Typography>
                              )}
                              {b.notice_period && (
                                <Typography fontSize={11} color="#94a3b8">
                                  <strong style={{ color: "#475569" }}>{b.notice_period}</strong> notice
                                </Typography>
                              )}
                              {b.location && (
                                <Typography fontSize={11} color="#94a3b8">
                                  📍 <strong style={{ color: "#475569" }}>{b.location}</strong>
                                </Typography>
                              )}
                            </Box>

                            {b.last_project && (
                              <Typography fontSize={11} color="#0369a1" mt={0.8} fontWeight={600}>
                                Last project: {b.last_project}
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
          </>
        )}

        {/* ── Tab 2: Talent Insights ── */}
        {!loading && tab === 2 && (
          <Box p={3}>
            {insightsLoad && (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
            )}
            {!insightsLoad && !insights && (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Could not load insights.
              </Typography>
            )}
            {!insightsLoad && insights && (
              <Box display="flex" flexDirection="column" gap={2.5}>

                {/* Demand vs Supply summary */}
                <Card variant="outlined" sx={{ borderRadius: 2, borderColor: palette.light }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography fontSize={11} fontWeight={700} color="text.secondary"
                      textTransform="uppercase" letterSpacing={0.6} mb={1.5}>
                      Demand vs Supply
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: "Open Jobs",       value: insights.open_jobs,       color: "#c62828" },
                        { label: "Available Now",    value: insights.bench_available, color: "#2e7d32" },
                        { label: "Total Candidates", value: insights.candidate_total, color: palette.color },
                        { label: "Bench Total",      value: insights.bench_total,     color: "#7b1fa2" },
                      ].map(({ label, value, color }) => (
                        <Grid item xs={6} sm={3} key={label}>
                          <Box textAlign="center" p={1.5}
                            sx={{ bgcolor: `${color}0d`, borderRadius: 2, border: `1px solid ${color}20` }}>
                            <Typography fontSize={28} fontWeight={800} color={color} lineHeight={1}>{value}</Typography>
                            <Typography fontSize={10} color="text.secondary" fontWeight={600}
                              textTransform="uppercase" letterSpacing={0.5} mt={0.5}>{label}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    {/* Demand gap indicator */}
                    <Box mt={1.5} p={1.2} borderRadius={1.5}
                      sx={{
                        bgcolor: insights.demand_gap > 0 ? "#fce4ec" : "#e8f5e9",
                        border: `1px solid ${insights.demand_gap > 0 ? "#ef9a9a" : "#a5d6a7"}`,
                      }}>
                      <Typography fontSize={12} fontWeight={700}
                        color={insights.demand_gap > 0 ? "#c62828" : "#2e7d32"}>
                        {insights.demand_gap > 0
                          ? `⚠️ Supply gap: ${insights.demand_gap} more people needed vs open jobs`
                          : `✅ Supply meets demand — ${Math.abs(insights.demand_gap)} extra available`}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Salary Intelligence */}
                {insights.salary_avg > 0 && (
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography fontSize={11} fontWeight={700} color="text.secondary"
                        textTransform="uppercase" letterSpacing={0.6} mb={1.5}>
                        Salary Intelligence
                      </Typography>
                      <Box display="flex" gap={3}>
                        {[
                          { label: "Min Expected",  value: fmtSalary(insights.salary_min) },
                          { label: "Avg Expected",  value: fmtSalary(insights.salary_avg) },
                          { label: "Max Expected",  value: fmtSalary(insights.salary_max) },
                        ].map(({ label, value }) => (
                          <Box key={label}>
                            <Typography fontSize={18} fontWeight={800} color={palette.color}>{value}</Typography>
                            <Typography fontSize={10} color="text.secondary" fontWeight={600}>{label}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Experience distribution */}
                <Grid container spacing={2}>
                  {[
                    { title: "Candidate Experience", data: insights.candidate_exp_bands, color: palette.color },
                    { title: "Bench Experience",     data: insights.bench_exp_bands,     color: "#2e7d32" },
                  ].map(({ title, data, color }) => (
                    <Grid item xs={12} sm={6} key={title}>
                      <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography fontSize={11} fontWeight={700} color="text.secondary"
                            textTransform="uppercase" letterSpacing={0.6} mb={1.5}>
                            {title}
                          </Typography>
                          {Object.entries(data).map(([band, count]) => {
                            const total = Object.values(data).reduce((a, b) => a + b, 0);
                            const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                              <Box key={band} mb={1}>
                                <Box display="flex" justifyContent="space-between" mb={0.3}>
                                  <Typography fontSize={11} color="text.primary">{band} yrs</Typography>
                                  <Typography fontSize={11} fontWeight={700} color={color}>
                                    {count} ({pct}%)
                                  </Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={pct}
                                  sx={{
                                    height: 4, borderRadius: 3, bgcolor: "#f1f5f9",
                                    "& .MuiLinearProgress-bar": { borderRadius: 3, bgcolor: color },
                                  }} />
                              </Box>
                            );
                          })}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Bench availability breakdown */}
                {Object.keys(insights.bench_status).length > 0 && (
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography fontSize={11} fontWeight={700} color="text.secondary"
                        textTransform="uppercase" letterSpacing={0.6} mb={1.5}>
                        Bench Status Breakdown
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {Object.entries(insights.bench_status).map(([status, count]) => {
                          const sc = BENCH_STATUS_COLOR[status] || { bg: "#f5f5f5", color: "#757575", border: "#e0e0e0" };
                          return (
                            <Box key={status} px={1.5} py={1} borderRadius={1.5}
                              sx={{ bgcolor: sc.bg, border: `1px solid ${sc.border}` }}>
                              <Typography fontSize={20} fontWeight={800} color={sc.color} lineHeight={1}>{count}</Typography>
                              <Typography fontSize={10} color="text.secondary" fontWeight={600}>{status}</Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Candidate pipeline stage breakdown */}
                {Object.keys(insights.candidate_stage).length > 0 && (
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography fontSize={11} fontWeight={700} color="text.secondary"
                        textTransform="uppercase" letterSpacing={0.6} mb={1.5}>
                        Candidate Pipeline Stages
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {Object.entries(insights.candidate_stage).map(([stage, count]) => (
                          <Box key={stage} px={1.5} py={1} borderRadius={1.5}
                            sx={{ bgcolor: "#e8eaf6", border: "1px solid #c5cae9" }}>
                            <Typography fontSize={18} fontWeight={800} color="#1a237e" lineHeight={1}>{count}</Typography>
                            <Typography fontSize={10} color="text.secondary" fontWeight={600}>{stage}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}

              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: "1px solid #e2e8f0", bgcolor: "#fafafa" }}>
        <Typography fontSize={11} color="text.disabled" flex={1}>
          {skill.skill_name} · {skill.category} · {DEMAND_META[skill.demand_level]?.color && (
            <span style={{ color: DEMAND_META[skill.demand_level]?.color, fontWeight: 700 }}>
              {skill.demand_level} Demand
            </span>
          )}
        </Typography>
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
  // ── Live skill search state ────────────────────────────────────────────────
  const [searchResults,      setSearchResults]      = useState(null);  // null = not searched yet
  const [searchLoading,      setSearchLoading]       = useState(false);
  const [searchTab,          setSearchTab]           = useState(0);     // 0=candidates, 1=bench
  const searchTimerRef = useRef(null);


// ── Debounced talent search ───────────────────────────────────────────────────
useEffect(() => {
  if (!search.trim()) {
    setSearchResults(null);
    setSearchLoading(false);
    return;
  }
  setSearchLoading(true);
  clearTimeout(searchTimerRef.current);
  searchTimerRef.current = setTimeout(async () => {
    try {
      const [resumeRes, benchRes] = await Promise.all([
        talentSearchResumes(search.trim()).catch(() => ({ data: [] })),
        talentSearchBench(search.trim()).catch(() => ({ data: [] })),
      ]);
      setSearchResults({
        candidates: resumeRes.data || [],
        bench:      benchRes.data  || [],
        query:      search.trim(),
      });
    } catch {
      setSearchResults({ candidates: [], bench: [], query: search.trim() });
    } finally {
      setSearchLoading(false);
    }
  }, 400);
  return () => clearTimeout(searchTimerRef.current);
}, [search]);





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
    benchAvail:  skills.reduce((sum, s) => sum + (s.bench_available || 0), 0),
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
        <Grid item xs={6} md={2.4}><StatCard label="Total Skills"    value={stats.total}      icon={<Layers />}     accent="#1e40af" /></Grid>
        <Grid item xs={6} md={2.4}><StatCard label="High Demand"     value={stats.highDemand} icon={<TrendingUp />} accent="#dc2626" /></Grid>
        <Grid item xs={6} md={2.4}><StatCard label="Categories"      value={stats.categories} icon={<Category />}   accent="#0369a1" /></Grid>
        <Grid item xs={6} md={2.4}><StatCard label="Candidate Links" value={stats.candidates} icon={<People />}     accent="#15803d" /></Grid>
        <Grid item xs={6} md={2.4}><StatCard label="Bench Available" value={stats.benchAvail} icon={<WorkOutline />} accent="#7b1fa2" /></Grid>
      </Grid>

{/* ── Filters ── */}
{skills.length > 0 && (
  <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center"
    sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2, p: 1.5 }}>
    <TextField
      placeholder="Search skills or find people by skill name…"
      value={search}
      onChange={e => setSearch(e.target.value)}
      size="small"
      sx={{ flexGrow: 1, minWidth: 200, "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 1.5 } }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search fontSize="small" sx={{ color: "#94a3b8" }} />
          </InputAdornment>
        ),
        endAdornment: search ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => setSearch("")}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
    <TextField select value={categoryF} onChange={e => setCategoryF(e.target.value)} size="small"
      label="Category" sx={{ minWidth: 180, "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 1.5 } }}>
      <MenuItem value="">All Categories</MenuItem>
      {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
    </TextField>
    <TextField select value={demandF} onChange={e => setDemandF(e.target.value)} size="small"
      label="Demand" sx={{ minWidth: 130, "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 1.5 } }}>
      <MenuItem value="">All Demand</MenuItem>
      {DEMAND_LEVELS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
    </TextField>
    {(search || categoryF || demandF) && (
      <Button size="small" onClick={() => { setSearch(""); setCategoryF(""); setDemandF(""); }}
        sx={{ textTransform: "none", color: "#64748b", fontWeight: 600, borderRadius: 1.5 }}>
        Clear
      </Button>
    )}
  </Box>
)}

{/* ── Live Talent Search Results ── */}
{search.trim() && (
  <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
    {/* Header */}
    <Box sx={{ px: 2.5, pt: 2, pb: 0, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Search sx={{ fontSize: 18, color: "#64748b" }} />
          <Typography fontWeight={700} fontSize={14} color="#0f172a">
            Talent search: "<span style={{ color: "#1e40af" }}>{search}</span>"
          </Typography>
          {searchLoading && <CircularProgress size={14} sx={{ color: "#1e40af" }} />}
          {!searchLoading && searchResults && (
            <Chip
              label={`${searchResults.candidates.length + searchResults.bench.length} people found`}
              size="small"
              sx={{ fontSize: 10, bgcolor: "#e8eaf6", color: "#1a237e", fontWeight: 700 }}
            />
          )}
        </Box>
        <Typography fontSize={11} color="text.disabled">
          Searching candidates + bench people
        </Typography>
      </Box>

      {/* Sub-tabs */}
      {!searchLoading && searchResults && (
        <Tabs value={searchTab} onChange={(_, v) => setSearchTab(v)}
          sx={{ "& .MuiTab-root": { fontSize: 12, fontWeight: 700, textTransform: "none", minHeight: 36 } }}>
          <Tab label={
            <Box display="flex" alignItems="center" gap={0.8}>
              Candidates
              <Chip label={searchResults.candidates.length} size="small"
                sx={{ fontSize: 9, height: 16, bgcolor: "#e8eaf6", color: "#1a237e", fontWeight: 700 }} />
            </Box>
          } />
          <Tab label={
            <Box display="flex" alignItems="center" gap={0.8}>
              Bench People
              <Chip
                label={searchResults.bench.length}
                size="small"
                sx={{
                  fontSize: 9, height: 16, fontWeight: 700,
                  bgcolor: searchResults.bench.filter(b => b.status === "Available").length > 0
                    ? "#e8f5e9" : "#f5f5f5",
                  color: searchResults.bench.filter(b => b.status === "Available").length > 0
                    ? "#2e7d32" : "#757575",
                }}
              />
            </Box>
          } />
        </Tabs>
      )}
    </Box>

    {/* Loading */}
    {searchLoading && (
      <Box>
        <LinearProgress />
        <Box display="flex" justifyContent="center" py={5}>
          <Typography fontSize={13} color="text.secondary">Searching across all talent pools…</Typography>
        </Box>
      </Box>
    )}

    {/* Results */}
    {!searchLoading && searchResults && (

      // ── Candidates tab ──
      searchTab === 0 ? (
        searchResults.candidates.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1.5}>
            <People sx={{ fontSize: 40, color: "#e0e0e0" }} />
            <Typography color="text.secondary" fontWeight={600} fontSize={13}>
              No candidates found with "{search}" skill
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {searchResults.candidates.map((r, i) => {
              const allSkillsArr = (r.skills || "").split(",").filter(Boolean).map(s => s.trim());

              const isMatch = (skillName, query) => {
                const s = skillName.toLowerCase().trim();
                const q = query.toLowerCase().trim();
                if (s.includes(q)) return true;
                if (q.includes(s)) return true;
                return q.split(/[\s,]+/).some(word => word.length >= 2 && s.includes(word));
              };

              const matchedSkills = allSkillsArr.filter(s => isMatch(s, search));
              const otherSkills   = allSkillsArr.filter(s => !isMatch(s, search)).slice(0, 4);
              const statusStyle = {
                New:         { bg: "#f5f5f5",  color: "#757575"  },
                "In Review": { bg: "#e3f2fd",  color: "#0277bd"  },
                Shortlisted: { bg: "#e8eaf6",  color: "#1a237e"  },
                Interviewed: { bg: "#fff3e0",  color: "#e65100"  },
                Offered:     { bg: "#e8f5e9",  color: "#2e7d32"  },
                Hired:       { bg: "#e8f5e9",  color: "#2e7d32"  },
                Rejected:    { bg: "#fce4ec",  color: "#c62828"  },
                "On Hold":   { bg: "#fff8e1",  color: "#f9a825"  },
              }[r.status] || { bg: "#f5f5f5", color: "#757575" };

              return (
                <React.Fragment key={r._id}>
                  {i > 0 && <Divider />}
                  <ListItem alignItems="flex-start"
                    sx={{ px: 2.5, py: 1.8, "&:hover": { bgcolor: "#fafafa" } }}>
                    <ListItemAvatar sx={{ minWidth: 48 }}>
                      <Avatar sx={{ width: 38, height: 38, fontSize: 13, fontWeight: 700, bgcolor: "#1a237e" }}>
                        {nameInitials(r.name)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText disableTypography primary={
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.3}>
                          <Typography fontWeight={700} fontSize={13} color="#0f172a">{r.name}</Typography>
                          <Box px={1} py={0.2} borderRadius={1}
                            sx={{ bgcolor: statusStyle.bg, fontSize: 10, fontWeight: 700, color: statusStyle.color }}>
                            {r.status}
                          </Box>
                          <Typography fontSize={10} color="#94a3b8">{r.resume_id}</Typography>
                        </Box>

                        <Typography fontSize={12} color="#64748b" mb={0.8}>
                          {r.current_role || "—"}
                          {r.current_company ? ` · ${r.current_company}` : ""}
                          {r.experience ? ` · ${r.experience} yrs` : ""}
                          {r.location ? ` · 📍 ${r.location}` : ""}
                        </Typography>

                        <Box display="flex" flexWrap="wrap" gap={0.5} mb={0.8}>
                          {/* Highlight matched skills */}
                          {matchedSkills.map((s, si) => (
                            <Chip key={si} label={s} size="small" sx={{
                              fontSize: 10, height: 20, borderRadius: 1,
                              bgcolor: "#1e40af", color: "#fff", fontWeight: 700,
                            }} />
                          ))}
                          {/* Other skills */}
                          {otherSkills.map((s, si) => (
                            <Chip key={si} label={s} size="small" sx={{
                              fontSize: 10, height: 20, borderRadius: 1,
                              bgcolor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0",
                            }} />
                          ))}
                          {allSkillsArr.length > matchedSkills.length + 4 && (
                            <Chip label={`+${allSkillsArr.length - matchedSkills.length - 4} more`}
                              size="small" sx={{ fontSize: 10, height: 20, borderRadius: 1, bgcolor: "#f1f5f9", color: "#94a3b8" }} />
                          )}
                        </Box>

                        <Box display="flex" gap={2} flexWrap="wrap">
                          {r.expected_salary > 0 && (
                            <Typography fontSize={11} color="#94a3b8">
                              <strong style={{ color: "#475569" }}>{fmtSalary(r.expected_salary)}</strong> expected
                            </Typography>
                          )}
                          {r.notice_period && (
                            <Typography fontSize={11} color="#94a3b8">
                              <strong style={{ color: "#475569" }}>{r.notice_period}</strong> notice
                            </Typography>
                          )}
                          {r.linked_job_title && (
                            <Typography fontSize={11} color="#0369a1" fontWeight={600}>
                              → {r.linked_job_id} {r.linked_job_title}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    } />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )
      ) : (

        // ── Bench tab ──
        searchResults.bench.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1.5}>
            <WorkOutline sx={{ fontSize: 40, color: "#e0e0e0" }} />
            <Typography color="text.secondary" fontWeight={600} fontSize={13}>
              No bench people found with "{search}" skill
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {searchResults.bench
              .sort((a, b) => {
                if (a.status === "Available" && b.status !== "Available") return -1;
                if (b.status === "Available" && a.status !== "Available") return 1;
                return 0;
              })
              .map((b, i) => {
                const allSkillsArr = (b.skills || "").split(",").filter(Boolean).map(s => s.trim());
                const matchedSkills = allSkillsArr.filter(s =>
                  s.toLowerCase().includes(search.toLowerCase())
                );
                const otherSkills = allSkillsArr.filter(s =>
                  !s.toLowerCase().includes(search.toLowerCase())
                ).slice(0, 4);

                const isAvailable = b.status === "Available";
                const sColor = BENCH_STATUS_COLOR[b.status] || { bg: "#f5f5f5", color: "#757575", border: "#e0e0e0" };
                const etColor = EMPLOYMENT_TYPE_COLOR[b.employment_type] || "#475569";

                return (
                  <React.Fragment key={b._id}>
                    {i > 0 && <Divider />}
                    <ListItem alignItems="flex-start"
                      sx={{
                        px: 2.5, py: 1.8,
                        bgcolor: isAvailable ? "#fafffe" : "transparent",
                        "&:hover": { bgcolor: isAvailable ? "#f0fdf4" : "#fafafa" },
                        borderLeft: isAvailable ? "3px solid #4caf50" : "3px solid transparent",
                      }}>
                      <ListItemAvatar sx={{ minWidth: 48 }}>
                        <Avatar sx={{
                          width: 38, height: 38, fontSize: 13, fontWeight: 700,
                          bgcolor: isAvailable ? "#2e7d32" : "#7b1fa2",
                          boxShadow: isAvailable ? "0 0 0 2px #a5d6a7" : "none",
                        }}>
                          {nameInitials(b.name)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText disableTypography primary={
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.3}>
                            <Typography fontWeight={700} fontSize={13} color="#0f172a">{b.name}</Typography>
                            {isAvailable && (
                              <Box px={1} py={0.2} borderRadius={1}
                                sx={{ bgcolor: "#e8f5e9", fontSize: 10, fontWeight: 700, color: "#2e7d32",
                                      border: "1px solid #a5d6a7" }}>
                                🟢 Available Now
                              </Box>
                            )}
                            <Box px={1} py={0.2} borderRadius={1}
                              sx={{ bgcolor: sColor.bg, fontSize: 10, fontWeight: 700, color: sColor.color,
                                    border: `1px solid ${sColor.border}` }}>
                              {b.status}
                            </Box>
                            <Box px={1} py={0.2} borderRadius={1}
                              sx={{ bgcolor: `${etColor}18`, fontSize: 10, fontWeight: 700, color: etColor }}>
                              {b.employment_type || "Permanent"}
                            </Box>
                            <Typography fontSize={10} color="#94a3b8">{b.bench_id}</Typography>
                          </Box>

                          <Typography fontSize={12} color="#64748b" mb={0.8}>
                            {b.current_role || "—"}
                            {b.last_client ? ` · Last: ${b.last_client}` : ""}
                            {b.experience ? ` · ${b.experience} yrs` : ""}
                            {b.location ? ` · 📍 ${b.location}` : ""}
                          </Typography>

                          <Box display="flex" flexWrap="wrap" gap={0.5} mb={0.8}>
                            {matchedSkills.map((s, si) => (
                              <Chip key={si} label={s} size="small" sx={{
                                fontSize: 10, height: 20, borderRadius: 1,
                                bgcolor: isAvailable ? "#2e7d32" : "#1e40af",
                                color: "#fff", fontWeight: 700,
                              }} />
                            ))}
                            {otherSkills.map((s, si) => (
                              <Chip key={si} label={s} size="small" sx={{
                                fontSize: 10, height: 20, borderRadius: 1,
                                bgcolor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0",
                              }} />
                            ))}
                            {allSkillsArr.length > matchedSkills.length + 4 && (
                              <Chip label={`+${allSkillsArr.length - matchedSkills.length - 4} more`}
                                size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#f1f5f9", color: "#94a3b8" }} />
                            )}
                          </Box>

                          <Box display="flex" gap={2} flexWrap="wrap">
                            {b.expected_salary > 0 && (
                              <Typography fontSize={11} color="#94a3b8">
                                <strong style={{ color: "#475569" }}>{fmtSalary(b.expected_salary)}</strong> expected
                              </Typography>
                            )}
                            {b.notice_period && (
                              <Typography fontSize={11} color="#94a3b8">
                                <strong style={{ color: "#475569" }}>{b.notice_period}</strong> notice
                              </Typography>
                            )}
                            {b.last_project && (
                              <Typography fontSize={11} color="#0369a1" fontWeight={600}>
                                Project: {b.last_project}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      } />
                    </ListItem>
                  </React.Fragment>
                );
              })}
          </List>
        )
      )
    )}
  </Card>
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

{!search.trim() && skills.length > 0 && (
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
                sx={{ border: "1px solid #e2e8f0", borderRadius: 1.5, overflow: "hidden" }}>
                <Tooltip title={`View candidates with "${skill.skill_name}"`}>
                  <Box flex={1} textAlign="center" py={1.2}
                    onClick={e => openSkillMatch(skill, e)}
                    sx={{ cursor: "pointer", borderRight: "1px solid #e2e8f0",
                          "&:hover": { bgcolor: pal.bg }, transition: "background 0.15s" }}>
                    <Typography fontWeight={800} fontSize={16} color={pal.color} lineHeight={1}>
                      {skill.candidate_count || 0}
                    </Typography>
                    <Typography fontSize={9} color="#94a3b8" fontWeight={600}
                      textTransform="uppercase" letterSpacing="0.06em" mt={0.3}>Candidates</Typography>
                  </Box>
                </Tooltip>
                <Tooltip title={`${skill.bench_available || 0} available now`}>
                  <Box flex={1} textAlign="center" py={1.2}
                    onClick={e => openSkillMatch(skill, e)}
                    sx={{ cursor: "pointer", borderRight: "1px solid #e2e8f0",
                          "&:hover": { bgcolor: "#f0fdf4" }, transition: "background 0.15s" }}>
                    <Typography fontWeight={800} fontSize={16}
                      color={skill.bench_available > 0 ? "#2e7d32" : "#94a3b8"} lineHeight={1}>
                      {skill.bench_available || 0}
                    </Typography>
                    <Typography fontSize={9} color="#94a3b8" fontWeight={600}
                      textTransform="uppercase" letterSpacing="0.06em" mt={0.3}>Avail Now</Typography>
                  </Box>
                </Tooltip>
                <Box flex={1} textAlign="center" py={1.2}>
                  <Typography fontWeight={800} fontSize={16} color="#0f172a" lineHeight={1}>
                    {skill.job_count || 0}
                  </Typography>
                  <Typography fontSize={9} color="#94a3b8" fontWeight={600}
                    textTransform="uppercase" letterSpacing="0.06em" mt={0.3}>Open Jobs</Typography>
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