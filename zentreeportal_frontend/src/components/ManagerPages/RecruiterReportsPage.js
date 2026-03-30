import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Alert, Avatar, LinearProgress, TextField, InputAdornment,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  TableSortLabel, Collapse, IconButton, Button, ToggleButtonGroup,
  ToggleButton, Tabs, Tab, Divider, Paper,
} from "@mui/material";
import {
  Search, Close, GridView, TableRows, ExpandMore, ExpandLess,
  WorkOutline, CheckCircleOutline, AttachMoney, PeopleAlt,
  TrendingUp, SwapVert,
} from "@mui/icons-material";

const API_URL = "http://localhost:5000/api";

const authFetch = async (url, opts = {}) => {
  const token = localStorage.getItem("access_token");
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; }
  return res;
};

const fmtCurrency = (v = 0) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString()}`;
};

const initials = (name = "") =>
  name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

const PALETTE = ["#4f46e5","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#0284c7","#65a30d","#db2777","#ea580c"];
const aColor  = (i) => PALETTE[i % PALETTE.length];

const PERIODS = [
  { key: "thisWeek",    label: "This Week"    },
  { key: "thisMonth",   label: "This Month"   },
  { key: "lastMonth",   label: "Last Month"   },
  { key: "thisQuarter", label: "This Quarter" },
  { key: "thisYear",    label: "This Year"    },
];

const STAGE_ORDER = [
  "Screening","Shortlisted","Technical Interview","HR Interview",
  "Final Interview","Offer","Joined","Rejected",
];

const SORT_COLS = [
  { key: "placements",      label: "Placements"  },
  { key: "revenue",         label: "Revenue"     },
  { key: "interviews",      label: "Interviews"  },
  { key: "conversion_rate", label: "Conversion"  },
  { key: "jobs_posted",     label: "Jobs Posted" },
  { key: "offers",          label: "Offers"      },
];

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, accent, icon }) => (
  <Card elevation={0}
    sx={{ border: "1px solid #f1f5f9", borderRadius: 3, position: "relative", overflow: "hidden",
          transition: "transform .15s, box-shadow .15s",
          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,.07)" } }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#64748b",
                          textTransform: "uppercase", letterSpacing: ".04em" }}>
          {label}
        </Typography>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${accent}1a`,
                   color: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.cloneElement(icon, { sx: { fontSize: 20 } })}
        </Box>
      </Box>
      <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#0f172a", lineHeight: 1, mb: .75 }}>
        {value}
      </Typography>
      {sub && <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>{sub}</Typography>}
    </CardContent>
    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, bgcolor: accent, opacity: .7 }} />
  </Card>
);

// ── Sparkbar ─────────────────────────────────────────────────────────────────
const SparkBar = ({ pct, color }) => (
  <Box sx={{ bgcolor: "#f1f5f9", borderRadius: 99, height: 5, flex: 1, overflow: "hidden" }}>
    <Box sx={{ width: `${Math.min(100, pct || 0)}%`, height: "100%",
               bgcolor: color, borderRadius: 99, transition: "width .7s ease" }} />
  </Box>
);

// ── Stage chip ────────────────────────────────────────────────────────────────
const StageChip = ({ stage, count }) => {
  const isJoined   = stage === "Joined";
  const isRejected = stage === "Rejected";
  return (
    <Chip
      label={`${count} ${stage}`}
      size="small"
      sx={{
        fontSize: 11, fontWeight: 700, borderRadius: 1.5,
        bgcolor:    isJoined ? "#f0fdf4" : isRejected ? "#fef2f2" : "#f8fafc",
        color:      isJoined ? "#15803d" : isRejected ? "#b91c1c" : "#334155",
        border:     `1px solid ${isJoined ? "#bbf7d0" : isRejected ? "#fecaca" : "#e2e8f0"}`,
      }}
    />
  );
};

// ── Job breakdown row ─────────────────────────────────────────────────────────
const JobBreakdownRow = ({ job }) => {
  const stageMap = {};
  (job.candidates || []).forEach(c => {
    stageMap[c.current_stage] = (stageMap[c.current_stage] || 0) + 1;
  });
  const hasStages = STAGE_ORDER.some(s => stageMap[s]);

  return (
    <Box sx={{ p: 1.5, border: "1px solid #f1f5f9", borderRadius: 2, bgcolor: "#f8fafc", mb: 1 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1} mb={hasStages ? 1 : 0}>
        <Box overflow="hidden">
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{job.job_title}</Typography>
          <Typography sx={{ fontSize: 12, color: "#64748b" }}>{job.client_name}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={.75} flexShrink={0} flexWrap="wrap">
          {job.status && (
            <Chip label={job.status} size="small"
              sx={{ fontSize: 11, fontWeight: 700,
                    bgcolor: job.status === "Open" ? "#f0fdf4" : "#f8fafc",
                    color:   job.status === "Open" ? "#15803d" : "#475569" }} />
          )}
          {job.priority && (
            <Chip label={job.priority} size="small"
              sx={{ fontSize: 11, fontWeight: 700,
                    bgcolor: job.priority === "Critical" ? "#fef2f2" : job.priority === "High" ? "#fff7ed" : "#eff6ff",
                    color:   job.priority === "Critical" ? "#b91c1c" : job.priority === "High" ? "#c2410c" : "#1d4ed8" }} />
          )}
          <Chip label={`${job.candidates?.length ?? 0} candidates`} size="small"
                sx={{ fontSize: 11, fontWeight: 600, bgcolor: "#fff", border: "1px solid #e2e8f0", color: "#64748b" }} />
        </Box>
      </Box>
      {hasStages && (
        <Box display="flex" flexWrap="wrap" gap={.75}>
          {STAGE_ORDER.filter(s => stageMap[s]).map(s => (
            <StageChip key={s} stage={s} count={stageMap[s]} />
          ))}
        </Box>
      )}
    </Box>
  );
};

// ── Expandable recruiter card (Grid view) ──────────────────────────────────
const RecruiterCard = ({ r, idx, maxPlacements, maxRevenue, onExpand, expanded, detail, detailLoading }) => {
  const isOpen = expanded;
  return (
    <Card elevation={0}
      sx={{ border: isOpen ? "1.5px solid #c7d2fe" : "1px solid #f1f5f9", borderRadius: 3,
            boxShadow: isOpen ? "0 8px 28px rgba(99,102,241,.1)" : "none",
            transition: "box-shadow .2s, border-color .2s",
            "&:hover": { boxShadow: "0 6px 24px rgba(0,0,0,.07)", borderColor: "#e2e8f0" } }}>
      <CardContent sx={{ p: 2.5 }}>

        {/* Header */}
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <Avatar sx={{ bgcolor: aColor(idx), width: 46, height: 46, fontSize: 16, fontWeight: 800, borderRadius: 2 }}>
            {initials(r.name)}
          </Avatar>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{r.name}</Typography>
              {idx === 0 && (
                <Chip label="★ TOP" size="small"
                      sx={{ fontSize: 10, fontWeight: 800, bgcolor: "#fef3c7", color: "#d97706", height: 20 }} />
              )}
            </Box>
            <Typography sx={{ fontSize: 12, color: "#64748b" }}>{r.jobs_posted} jobs posted</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#cbd5e1" }}>#{idx + 1}</Typography>
        </Box>

        {/* Stats grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                   bgcolor: "#f8fafc", borderRadius: 2, p: 1.5, mb: 2, gap: .5 }}>
          {[
            { label: "Interviews", val: r.interviews,         color: "#0891b2" },
            { label: "Offers",     val: r.offers,             color: "#d97706" },
            { label: "Placed",     val: r.placements,         color: "#059669" },
            { label: "Revenue",    val: fmtCurrency(r.revenue), color: "#7c3aed" },
          ].map(s => (
            <Box key={s.label} textAlign="center">
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</Typography>
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#94a3b8",
                                textTransform: "uppercase", letterSpacing: ".04em" }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Conversion */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Conversion rate</Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 800,
                            color: r.conversion_rate >= 50 ? "#059669" : r.conversion_rate >= 25 ? "#d97706" : "#dc2626" }}>
            {r.conversion_rate}%
          </Typography>
        </Box>

        {/* Bars */}
        <Box display="flex" flexDirection="column" gap={1} mb={2}>
          {[
            { label: "Placements", pct: (r.placements / maxPlacements) * 100, val: r.placements },
            { label: "Revenue",    pct: (r.revenue / maxRevenue) * 100,        val: fmtCurrency(r.revenue) },
          ].map(b => (
            <Box key={b.label} display="flex" alignItems="center" gap={1}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", width: 64, flexShrink: 0 }}>
                {b.label}
              </Typography>
              <SparkBar pct={b.pct} color={aColor(idx)} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#334155", width: 52, textAlign: "right" }}>
                {b.val}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Toggle */}
        <Button
          fullWidth variant="outlined" size="small"
          endIcon={isOpen ? <ExpandLess /> : <ExpandMore />}
          onClick={onExpand}
          sx={{ borderRadius: 2, borderStyle: "dashed", borderColor: "#e2e8f0",
                color: "#4f46e5", fontWeight: 600, fontSize: 13,
                "&:hover": { borderColor: "#c7d2fe", bgcolor: "#eff6ff", borderStyle: "dashed" } }}
        >
          {detailLoading ? "Loading…" : isOpen ? "Hide Job Details" : "View Job Details"}
        </Button>

        {/* Expanded details */}
        <Collapse in={isOpen}>
          <Box mt={2} pt={2} sx={{ borderTop: "1px solid #f1f5f9" }}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                Job-wise Breakdown
              </Typography>
              {detail && (
                <Chip label={`${detail.byJob.length} jobs`} size="small"
                      sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 11 }} />
              )}
            </Box>
            {!detail ? (
              <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>
            ) : detail.byJob.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No job tracking data found.</Typography>
            ) : (
              detail.byJob.map((job, ji) => <JobBreakdownRow key={job.job_id ?? ji} job={job} />)
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const RecruiterReportsPage = () => {
  const [period, setPeriod]           = useState("thisMonth");
  const [search, setSearch]           = useState("");
  const [sortBy, setSortBy]           = useState("placements");
  const [sortDir, setSortDir]         = useState("desc");
  const [viewMode, setViewMode]       = useState("grid");
  const [recruiters, setRecruiters]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [expanded, setExpanded]       = useState(null);
  const [details, setDetails]         = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchRecruiters = useCallback(async (p) => {
    setLoading(true); setError("");
    try {
      const res  = await authFetch(`${API_URL}/reports/recruiter-performance?period=${p}`);
      const json = await res.json();
      if (!json.success) { setError(json.message || "Failed to load"); return; }
      setRecruiters(json.data ?? []);
    } catch { setError("Network error — could not load recruiter data."); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecruiters(period); }, [period]);

  const fetchDetails = async (name) => {
    if (details[name]) { setExpanded(prev => prev === name ? null : name); return; }
    setDetailLoading(true);
    setExpanded(name);
    try {
      const [tRes, jRes] = await Promise.all([
        authFetch(`${API_URL}/tracking/?per_page=200`),
        authFetch(`${API_URL}/jobs/?per_page=100`),
      ]);
      const [tJson, jJson] = await Promise.all([tRes.json(), jRes.json()]);

      const myTracking = (tJson.data ?? []).filter(t => t.recruiter === name);
      const myJobs     = (jJson.data ?? []).filter(j =>
        (j.posted_by_name || "").toLowerCase() === name.toLowerCase()
      );

      const byJob = {};
      myTracking.forEach(t => {
        const key = t.job_id || "unknown";
        if (!byJob[key]) byJob[key] = { job_id: key, job_title: t.job_title || "—", client_name: t.client_name || "—", candidates: [] };
        byJob[key].candidates.push(t);
      });
      myJobs.forEach(j => {
        const key = j.job_id || j._id;
        if (!byJob[key]) byJob[key] = { job_id: key, job_title: j.title, client_name: j.client_name, candidates: [] };
        byJob[key].status   = j.status;
        byJob[key].priority = j.priority;
        byJob[key].openings = j.openings;
      });

      setDetails(prev => ({ ...prev, [name]: { byJob: Object.values(byJob) } }));
    } catch { setError("Could not load recruiter details."); }
    finally   { setDetailLoading(false); }
  };

  const handleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = recruiters.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()));
    return [...list].sort((a, b) => {
      const av = a[sortBy] ?? 0, bv = b[sortBy] ?? 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [recruiters, search, sortBy, sortDir]);

  const summary = useMemo(() => ({
    total:        recruiters.length,
    placements:   recruiters.reduce((s, r) => s + r.placements, 0),
    revenue:      recruiters.reduce((s, r) => s + r.revenue, 0),
    avgConv:      recruiters.length ? (recruiters.reduce((s, r) => s + r.conversion_rate, 0) / recruiters.length).toFixed(1) : 0,
    interviews:   recruiters.reduce((s, r) => s + r.interviews, 0),
  }), [recruiters]);

  const maxPlacements = Math.max(1, ...filtered.map(r => r.placements));
  const maxRevenue    = Math.max(1, ...filtered.map(r => r.revenue));

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", p: { xs: 2, md: 3 } }}>

      {/* ── Header ── */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#0f172a">Recruiter Performance</Typography>
        <Typography sx={{ fontSize: 14, color: "#64748b", mt: .5 }}>
          Track individual recruiter activity, job-level status, and conversion metrics across time periods.
        </Typography>
      </Box>

      {/* ── Period tabs ── */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between",
                 flexWrap: "wrap", gap: 1.5 }}>
        <Tabs
          value={period}
          onChange={(_, v) => setPeriod(v)}
          sx={{
            bgcolor: "#f1f5f9", borderRadius: 3, p: .5, minHeight: "unset",
            "& .MuiTabs-indicator": { display: "none" },
          }}
        >
          {PERIODS.map(p => (
            <Tab key={p.key} value={p.key} label={p.label}
              sx={{
                minHeight: 36, px: 2, py: .75, borderRadius: 2,
                fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "none",
                "&.Mui-selected": { bgcolor: "#fff", color: "#4f46e5",
                                    boxShadow: "0 1px 4px rgba(0,0,0,.1)" },
              }}
            />
          ))}
        </Tabs>
        <ToggleButtonGroup value={viewMode} exclusive size="small"
          onChange={(_, v) => v && setViewMode(v)}
          sx={{ "& .MuiToggleButton-root": { border: "1px solid #e2e8f0", borderRadius: "8px !important",
                                              px: 1.25, "&.Mui-selected": { bgcolor: "#eff6ff", color: "#4f46e5" } } }}>
          <ToggleButton value="grid"  title="Grid view"><GridView  sx={{ fontSize: 18 }} /></ToggleButton>
          <ToggleButton value="table" title="Table view"><TableRows sx={{ fontSize: 18 }} /></ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ── KPI summary ── */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Active Recruiters", value: summary.total,                   sub: "In this period",       accent: "#4f46e5", icon: <PeopleAlt />           },
          { label: "Total Placements",  value: summary.placements,              sub: PERIODS.find(p=>p.key===period)?.label, accent: "#059669", icon: <CheckCircleOutline /> },
          { label: "Total Revenue",     value: fmtCurrency(summary.revenue),    sub: "Billing generated",    accent: "#7c3aed", icon: <AttachMoney />         },
          { label: "Avg Conversion",    value: `${summary.avgConv}%`,           sub: "Interview → Placed",   accent: "#0891b2", icon: <TrendingUp />          },
          { label: "Total Interviews",  value: summary.interviews,              sub: "Across all recruiters",accent: "#d97706", icon: <PeopleAlt />           },
        ].map(c => (
          <Grid item xs={6} sm={4} md key={c.label}>
            <KPICard {...c} />
          </Grid>
        ))}
      </Grid>

      {/* ── Toolbar ── */}
      <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
        <TextField
          placeholder="Search recruiter name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 220, maxWidth: 380,
                "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#fff", fontSize: 13.5 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: "#94a3b8", fontSize: 20 }} /></InputAdornment>,
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch("")}><Close sx={{ fontSize: 16 }} /></IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center", gap: .5 }}>
            <SwapVert sx={{ fontSize: 16 }} /> Sort by
          </Typography>
          {SORT_COLS.map(s => (
            <Chip
              key={s.key}
              label={sortBy === s.key ? `${s.label} ${sortDir === "desc" ? "↓" : "↑"}` : s.label}
              size="small"
              onClick={() => handleSort(s.key)}
              sx={{
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                bgcolor: sortBy === s.key ? "#eff6ff" : "#fff",
                border: `1px solid ${sortBy === s.key ? "#c7d2fe" : "#e2e8f0"}`,
                color:  sortBy === s.key ? "#4f46e5" : "#64748b",
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* ── Results info ── */}
      {!loading && (
        <Typography sx={{ fontSize: 13, color: "#64748b", mb: 2 }}>
          Showing <strong style={{ color: "#0f172a" }}>{filtered.length}</strong> of{" "}
          <strong style={{ color: "#0f172a" }}>{recruiters.length}</strong> recruiter{recruiters.length !== 1 ? "s" : ""}
          {search && <em> matching "{search}"</em>}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError("")}>{error}</Alert>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
          <CircularProgress size={40} />
          <Typography sx={{ color: "#64748b", fontSize: 14 }}>Loading recruiter data…</Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box textAlign="center" py={8}>
          <PeopleAlt sx={{ fontSize: 56, color: "#cbd5e1", mb: 1 }} />
          <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>
            No recruiters found{search ? ` for "${search}"` : " for this period"}.
          </Typography>
        </Box>
      ) : viewMode === "grid" ? (

        /* ── GRID VIEW ── */
        <Grid container spacing={2.5}>
          {filtered.map((r, i) => (
            <Grid item xs={12} sm={6} lg={4} key={r.name}>
              <RecruiterCard
                r={r} idx={i}
                maxPlacements={maxPlacements}
                maxRevenue={maxRevenue}
                expanded={expanded === r.name}
                detail={details[r.name] ?? null}
                detailLoading={detailLoading && expanded === r.name && !details[r.name]}
                onExpand={() => fetchDetails(r.name)}
              />
            </Grid>
          ))}
        </Grid>

      ) : (

        /* ── TABLE VIEW ── */
        <Card elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, color: "#64748b",
                                   textTransform: "uppercase", letterSpacing: ".04em", width: 40 }}>#</TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, color: "#64748b",
                                   textTransform: "uppercase", letterSpacing: ".04em" }}>Recruiter</TableCell>
                  {SORT_COLS.map(col => (
                    <TableCell key={col.key}
                      sx={{ fontSize: 11, fontWeight: 700, color: "#64748b",
                             textTransform: "uppercase", letterSpacing: ".04em" }}>
                      <TableSortLabel
                        active={sortBy === col.key}
                        direction={sortBy === col.key ? sortDir : "desc"}
                        onClick={() => handleSort(col.key)}
                        sx={{ "&.Mui-active": { color: "#4f46e5" } }}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, color: "#64748b",
                                   textTransform: "uppercase", letterSpacing: ".04em" }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((r, i) => (
                  <React.Fragment key={r.name}>
                    <TableRow
                      sx={{ bgcolor: expanded === r.name ? "#fafbff" : "transparent",
                            "&:hover": { bgcolor: "#f8fafc" },
                            "&:last-child td": { border: 0 }, transition: "background .12s" }}
                    >
                      <TableCell>
                        <Typography sx={{
                          fontSize: 13, fontWeight: 800,
                          color: i === 0 ? "#d97706" : i === 1 ? "#64748b" : i === 2 ? "#b45309" : "#cbd5e1",
                        }}>
                          {i + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.25}>
                          <Avatar sx={{ bgcolor: aColor(i), width: 34, height: 34, fontSize: 13, fontWeight: 700 }}>
                            {initials(r.name)}
                          </Avatar>
                          <Box>
                            <Box display="flex" alignItems="center" gap={.75}>
                              <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>{r.name}</Typography>
                              {i === 0 && (
                                <Chip label="TOP" size="small"
                                      sx={{ fontSize: 9, fontWeight: 800, bgcolor: "#fef3c7",
                                            color: "#d97706", height: 18, ".MuiChip-label": { px: .75 } }} />
                              )}
                            </Box>
                            <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>{r.jobs_posted} jobs posted</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{r.jobs_posted}</TableCell>
                      <TableCell sx={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{r.interviews}</TableCell>
                      <TableCell>
                        <Box display="flex" flexDirection="column" gap={.5}>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#059669" }}>{r.placements}</Typography>
                          <LinearProgress variant="determinate" value={(r.placements / maxPlacements) * 100}
                            sx={{ height: 4, borderRadius: 99, width: 70, bgcolor: "#e2e8f0",
                                  "& .MuiLinearProgress-bar": { bgcolor: aColor(i), borderRadius: 99 } }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={`${r.conversion_rate}%`} size="small"
                              sx={{ fontSize: 12, fontWeight: 700,
                                    bgcolor: r.conversion_rate >= 50 ? "#f0fdf4" : r.conversion_rate >= 25 ? "#fff7ed" : "#fef2f2",
                                    color:   r.conversion_rate >= 50 ? "#15803d" : r.conversion_rate >= 25 ? "#c2410c" : "#b91c1c" }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 14, fontWeight: 800, color: "#7c3aed" }}>
                        {fmtCurrency(r.revenue)}
                      </TableCell>
                      <TableCell sx={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{r.offers}</TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined"
                          endIcon={expanded === r.name ? <ExpandLess /> : <ExpandMore />}
                          onClick={() => fetchDetails(r.name)}
                          sx={{ borderRadius: 2, fontSize: 12, fontWeight: 600,
                                color: "#4f46e5", borderColor: "#c7d2fe", textTransform: "none",
                                "&:hover": { bgcolor: "#eff6ff", borderColor: "#a5b4fc" } }}>
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Inline expanded row */}
                    <TableRow>
                      <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                        <Collapse in={expanded === r.name} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2.5, bgcolor: "#fafbff", borderTop: "1px solid #e2e8f0",
                                     borderBottom: "1px solid #e2e8f0" }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0f172a", mb: 1.5 }}>
                              Job-wise breakdown for <strong>{r.name}</strong>
                            </Typography>
                            {!details[r.name] ? (
                              <Box display="flex" justifyContent="center" py={2}>
                                <CircularProgress size={24} />
                              </Box>
                            ) : details[r.name].byJob.length === 0 ? (
                              <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No job data found.</Typography>
                            ) : (
                              <TableContainer component={Paper} elevation={0}
                                sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                                      {["Job Title","Client","Status","Priority","Candidates","Stage Breakdown"].map(h => (
                                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700,
                                                                  color: "#64748b", textTransform: "uppercase",
                                                                  letterSpacing: ".04em" }}>
                                          {h}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {details[r.name].byJob.map((job, ji) => {
                                      const stageMap = {};
                                      (job.candidates || []).forEach(c => {
                                        stageMap[c.current_stage] = (stageMap[c.current_stage] || 0) + 1;
                                      });
                                      return (
                                        <TableRow key={job.job_id ?? ji}
                                          sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "#f8fafc" } }}>
                                          <TableCell sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                            {job.job_title}
                                          </TableCell>
                                          <TableCell sx={{ fontSize: 13, color: "#64748b" }}>{job.client_name}</TableCell>
                                          <TableCell>
                                            {job.status ? (
                                              <Chip label={job.status} size="small"
                                                    sx={{ fontSize: 11, fontWeight: 700,
                                                          bgcolor: job.status === "Open" ? "#f0fdf4" : "#f8fafc",
                                                          color:   job.status === "Open" ? "#15803d" : "#475569" }} />
                                            ) : "—"}
                                          </TableCell>
                                          <TableCell>
                                            {job.priority ? (
                                              <Chip label={job.priority} size="small"
                                                    sx={{ fontSize: 11, fontWeight: 700,
                                                          bgcolor: job.priority === "Critical" ? "#fef2f2" : job.priority === "High" ? "#fff7ed" : "#eff6ff",
                                                          color:   job.priority === "Critical" ? "#b91c1c" : job.priority === "High" ? "#c2410c" : "#1d4ed8" }} />
                                            ) : "—"}
                                          </TableCell>
                                          <TableCell sx={{ fontSize: 14, fontWeight: 700 }}>
                                            {job.candidates?.length ?? 0}
                                          </TableCell>
                                          <TableCell>
                                            <Box display="flex" flexWrap="wrap" gap={.5}>
                                              {STAGE_ORDER.filter(s => stageMap[s]).map(s => (
                                                <StageChip key={s} stage={s} count={stageMap[s]} />
                                              ))}
                                              {!STAGE_ORDER.some(s => stageMap[s]) && (
                                                <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>No tracking data</Typography>
                                              )}
                                            </Box>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
};

export default RecruiterReportsPage;