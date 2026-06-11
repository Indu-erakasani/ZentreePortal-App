


import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Alert, Avatar, LinearProgress, Table, TableHead, TableBody,
  TableRow, TableCell, Paper, Accordion, AccordionSummary,
  AccordionDetails, TextField, InputAdornment, Divider, Tooltip,
  IconButton,Button
} from "@mui/material";
import {
  People, CheckCircle, Cancel, TrendingUp, Work, ExpandMore,
  Search, Star, Today, Warning, Schedule, NotificationsActive,
  VideoCall, AccessTime, FiberManualRecord, Business, PersonSearch,
  Assignment,
} from "@mui/icons-material";

const BASE = process.env.REACT_APP_API_BASE_URL;
const TRACKING_BASE = process.env.REACT_APP_API_TRACKING_URL;
const JOBS_BASE = process.env.REACT_APP_API_JOBS_URL;
const PERIODS = [
  { key: "week",    label: "7 days"  },
  { key: "month",   label: "30 days" },
  { key: "quarter", label: "90 days" },
  { key: "year",    label: "1 year"  },
  { key: "custom",  label: "Custom"  },
];
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const authFetch = (url) =>
  fetch(url, { headers: getHeaders() }).then(async (r) => {
    const d = await r.json();
    if (!r.ok) throw d;
    return d;
  });

// ── Status ordering & meta (same as manager dashboard) ─────────────────────
const STATUS_ORDER = [
  "NewCandidate",
  "Recruiter_Rejected", "Recruiter_Accepted", "Recruiter_Hold",
  "HiringManager_Rejected", "HiringManager_Accepted", "HiringManager_Hold",
  "ScreeningTest_Sent", "ScreeningTest_Resent",
  "Candidate_Declined", "Candidate_OnHold", "Candidate_Quit",
  "ScreeningTest_Passed", "ReScreeningTest_Passed",
  "OnHold_ReScreening", "OnHold_Screening",
  "TestPassed_Rejected", "ReTestPassed_Rejected",
  "ScreeningTest_Failed", "ReScreeningTest_Failed",
  "OnHold_TestPassed",
  "Interview_Scheduled", "Round1_Rejected", "Round2_Suggested",
  "Round2_Scheduled", "Interviewer_Selected", "Interviewer_Rejected",
  "Selected", "Rejected",
];

const STATUS_META = {
  NewCandidate:           { bg: "#f1f5f9", color: "#475569",  label: "New Candidate" },
  Recruiter_Rejected:     { bg: "#fef2f2", color: "#dc2626",  label: "Rctr Rejected" },
  Recruiter_Accepted:     { bg: "#eff6ff", color: "#2563eb",  label: "Rctr Accepted" },
  Recruiter_Hold:         { bg: "#fff7ed", color: "#c2410c",  label: "Rctr Hold" },
  HiringManager_Rejected: { bg: "#fef2f2", color: "#991b1b",  label: "HM Rejected" },
  HiringManager_Accepted: { bg: "#f0fdf4", color: "#166534",  label: "HM Accepted" },
  HiringManager_Hold:     { bg: "#fff7ed", color: "#b45309",  label: "HM Hold" },
  ScreeningTest_Sent:     { bg: "#fefce8", color: "#a16207",  label: "Test Sent" },
  ScreeningTest_Resent:   { bg: "#fefce8", color: "#ca8a04",  label: "Test Resent" },
  Candidate_Declined:     { bg: "#fdf4ff", color: "#9333ea",  label: "Cand Declined" },
  Candidate_OnHold:       { bg: "#fff7ed", color: "#ea580c",  label: "Cand On Hold" },
  Candidate_Quit:         { bg: "#fef2f2", color: "#b91c1c",  label: "Cand Quit" },
  ScreeningTest_Passed:   { bg: "#f0fdf4", color: "#15803d",  label: "Test Passed" },
  ReScreeningTest_Passed: { bg: "#dcfce7", color: "#166534",  label: "Re-Test Passed" },
  OnHold_ReScreening:     { bg: "#fff7ed", color: "#c2410c",  label: "Hold Re-Screen" },
  OnHold_Screening:       { bg: "#fff7ed", color: "#d97706",  label: "Hold Screening" },
  TestPassed_Rejected:    { bg: "#fef2f2", color: "#dc2626",  label: "TestPass Rej" },
  ReTestPassed_Rejected:  { bg: "#fef2f2", color: "#b91c1c",  label: "ReTestPass Rej" },
  ScreeningTest_Failed:   { bg: "#fef2f2", color: "#dc2626",  label: "Test Failed" },
  ReScreeningTest_Failed: { bg: "#fee2e2", color: "#991b1b",  label: "Re-Test Failed" },
  OnHold_TestPassed:      { bg: "#fff7ed", color: "#c2410c",  label: "Hold (Test ✓)" },
  Interview_Scheduled:    { bg: "#eff6ff", color: "#1d4ed8",  label: "Interview Sched" },
  Round1_Rejected:        { bg: "#fef2f2", color: "#dc2626",  label: "Round 1 Rej" },
  Round2_Suggested:       { bg: "#eff6ff", color: "#0369a1",  label: "Round 2 Sugg" },
  Round2_Scheduled:       { bg: "#dbeafe", color: "#1d4ed8",  label: "Round 2 Sched" },
  Interviewer_Selected:   { bg: "#f0fdf4", color: "#15803d",  label: "Intrvwr Select" },
  Interviewer_Rejected:   { bg: "#fef2f2", color: "#dc2626",  label: "Intrvwr Reject" },
  Selected:               { bg: "#f0fdf4", color: "#15803d",  label: "Selected" },
  Rejected:               { bg: "#fef2f2", color: "#dc2626",  label: "Rejected" },
  Shortlisted:            { bg: "#eff6ff", color: "#1d4ed8",  label: "Shortlisted" },
  Interested:             { bg: "#ecfdf5", color: "#059669",  label: "Interested" },
};

const getStatusMeta = (s) =>
  STATUS_META[s] || { bg: "#f8fafc", color: "#475569", label: s?.replace(/_/g, " ") || "Unknown" };


const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const fmtTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const daysUntil = (iso) => {
  if (!iso) return null;
  const diff = new Date(iso) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};


// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, icon, accent, sub }) => (
  <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid #e2e8f0", height: "100%" }}>
    <Box sx={{ height: 3, bgcolor: accent, borderRadius: "14px 14px 0 0" }} />
    <CardContent sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: `${accent}18`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {React.cloneElement(icon, { sx: { color: accent, fontSize: 19 } })}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#94a3b8",
          textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</Typography>
        <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
          {value ?? 0}
        </Typography>
        {sub && <Typography sx={{ fontSize: 10, color: "#94a3b8", mt: 0.2 }}>{sub}</Typography>}
      </Box>
    </CardContent>
  </Card>
);

// ── Today's interview card ────────────────────────────────────────────────────
const InterviewSlot = ({ ev }) => {
  const evDate = new Date(ev.scheduled_at);
  const now = new Date();
  const isLive = Math.abs(evDate - now) < 30 * 60 * 1000;
  const isPast = evDate < now;

  return (
    <Box sx={{
      p: 1.5, borderRadius: "10px",
      bgcolor: isLive ? "#f0fdf4" : isPast ? "#f8fafc" : "#fff",
      border: `1px solid ${isLive ? "#86efac" : isPast ? "#f1f5f9" : "#e2e8f0"}`,
      display: "flex", alignItems: "center", gap: 1.5,
    }}>
      <Box sx={{ textAlign: "center", minWidth: 44, flexShrink: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 800,
          color: isLive ? "#15803d" : isPast ? "#94a3b8" : "#1d4ed8" }}>
          {fmtTime(ev.scheduled_at)}
        </Typography>
        <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>{ev.duration_minutes}m</Typography>
      </Box>
      <Box sx={{ width: 2, height: 36, borderRadius: 4, flexShrink: 0,
        bgcolor: isLive ? "#15803d" : isPast ? "#e2e8f0" : "#1d4ed8" }} />
      <Box flex={1} minWidth={0}>
        <Typography sx={{ fontWeight: 700, fontSize: 12, color: "#0f172a" }} noWrap>
          {ev.candidate_name}
        </Typography>
        <Typography sx={{ fontSize: 11, color: "#64748b" }} noWrap>
          {ev.stage || ev.interview_type} · {ev.job_title || ""}
        </Typography>
      </Box>
      {isLive && (
        <Chip label="Live" size="small"
          sx={{ bgcolor: "#f0fdf4", color: "#15803d", fontWeight: 700, fontSize: 10 }} />
      )}
      {ev.meeting_link && (
        <Tooltip title="Join meeting">
          <IconButton size="small" component="a" href={ev.meeting_link} target="_blank"
            sx={{ color: "#15803d", bgcolor: "#f0fdf4",
              "&:hover": { bgcolor: "#dcfce7" }, width: 28, height: 28 }}>
            <VideoCall sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      )}
      {isPast && !isLive && (
        <Typography sx={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>Done</Typography>
      )}
    </Box>
  );
};

// ── Closing job alert card ────────────────────────────────────────────────────
const ClosingJobCard = ({ job }) => {
  const days = daysUntil(job.deadline || job.expiration_time);
  const urgent = days !== null && days <= 3;
  const soon   = days !== null && days <= 7;

  return (
    <Box sx={{
      p: 1.5, borderRadius: "10px", display: "flex", alignItems: "center", gap: 1.5,
      bgcolor: urgent ? "#fef2f2" : soon ? "#fff7ed" : "#f8fafc",
      border: `1px solid ${urgent ? "#fca5a5" : soon ? "#fed7aa" : "#e2e8f0"}`,
    }}>
      <Box sx={{ width: 36, height: 36, borderRadius: "8px", flexShrink: 0,
        bgcolor: urgent ? "#fef2f2" : soon ? "#fff7ed" : "#eff6ff",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {urgent
          ? <Warning sx={{ color: "#dc2626", fontSize: 17 }} />
          : <Schedule sx={{ color: soon ? "#c2410c" : "#1d4ed8", fontSize: 17 }} />}
      </Box>
      <Box flex={1} minWidth={0}>
        <Typography fontWeight={700} fontSize={12} color="#0f172a" noWrap>{job.title}</Typography>
        <Typography fontSize={11} color="#64748b" noWrap>{job.client_name}</Typography>
      </Box>
      <Box textAlign="right" flexShrink={0}>
        <Chip
          label={days === 0 ? "Today" : days < 0 ? "Expired" : `${days}d left`}
          size="small"
          sx={{
            fontWeight: 700, fontSize: 10,
            bgcolor: urgent ? "#fef2f2" : soon ? "#fff7ed" : "#f1f5f9",
            color:   urgent ? "#dc2626" : soon ? "#c2410c" : "#475569",
          }}
        />
        <Typography fontSize={10} color="#94a3b8" mt={0.3}>
          {job.openings} opening{job.openings !== 1 ? "s" : ""}
        </Typography>
      </Box>
    </Box>
  );
};



//  MAIN COMPONENT
export default function RbotRecruiterDashboard() {
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [todayEvs,     setTodayEvs]     = useState([]);
  const [closingJobs,  setClosingJobs]  = useState([]);
  const [activeJds,    setActiveJds]    = useState([]);
  const [period,     setPeriod]     = useState("month");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [showOnlyActiveInPeriod, setShowOnlyActiveInPeriod] = useState(false);
  const today = new Date();
  const todayStr = today.toDateString();


  const load = useCallback(async (p = period, df = dateFrom, dt = dateTo) => {
    setLoading(true); setError("");
    try {
      let rbotUrl = `${BASE}/rbot-dashboard/recruiter?period=${p}`;
      if (p === "custom" && df) {
        rbotUrl += `&date_from=${df}&date_to=${dt || new Date().toISOString().split("T")[0]}`;
      }

      const [rbotRes, calRes, jdsRes] = await Promise.allSettled([
        authFetch(rbotUrl),
        authFetch(`${TRACKING_BASE}/calendar?year=${today.getFullYear()}&month=${today.getMonth() + 1}`),
        authFetch(`${JOBS_BASE}/jd/?per_page=200&is_active=true`),
      ]);

      if (rbotRes.status === "fulfilled" && rbotRes.value.success) {
        setData(rbotRes.value);
      } else {
        setError(rbotRes.reason?.message || "Failed to load analytics");
      }

      if (calRes.status === "fulfilled") {
        const all = calRes.value.data || [];
        setTodayEvs(
          all
            .filter(ev => new Date(ev.scheduled_at).toDateString() === todayStr)
            .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
        );
      }

      if (jdsRes.status === "fulfilled") {
        const jds = jdsRes.value.data || [];
        setActiveJds(jds);
        const closing = jds
          .filter(j => {
            const deadline = j.deadline || j.expiration_time;
            if (!deadline) return false;
            const d = daysUntil(deadline);
            return d !== null && d <= 10 && d >= -1;
          })
          .sort((a, b) => {
            const da = daysUntil(a.deadline || a.expiration_time) ?? 999;
            const db = daysUntil(b.deadline || b.expiration_time) ?? 999;
            return da - db;
          });
        setClosingJobs(closing);
      }
    } catch (e) {
      setError(e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [period, dateFrom, dateTo]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handlePeriod = (p) => {
    setPeriod(p);
    setShowCustom(p === "custom");
    if (p !== "custom") load(p, "", "");
  };

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? "";



  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" flexDirection="column" gap={2}>
      <CircularProgress size={36} sx={{ color: "#1d4ed8" }} />
      <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>Loading your dashboard…</Typography>
    </Box>
  );

  const kpis         = data?.kpis          || {};
  const statusCounts = data?.status_counts || {};

  const allJdBreakdown = data?.jd_breakdown || [];

  const jdBreakdown = allJdBreakdown
  .filter(jd =>
    !search ||
    jd.jobRole?.toLowerCase().includes(search.toLowerCase()) ||
    jd.jdID?.toLowerCase().includes(search.toLowerCase()) ||
    jd.companyName?.toLowerCase().includes(search.toLowerCase())
  )
  .filter(jd =>
    !showOnlyActiveInPeriod || (jd.ranged_total ?? 0) > 0
  )
  .sort((a, b) => (b.ranged_total ?? 0) - (a.ranged_total ?? 0) || b.total - a.total);



  const maxCount     = Math.max(...Object.values(statusCounts), 1);
  const urgentCount  = closingJobs.filter(j => (daysUntil(j.deadline || j.expiration_time) ?? 99) <= 3).length;

  const positiveStatuses = ["Selected", "HiringManager_Accepted", "Recruiter_Accepted",
    "ScreeningTest_Passed", "Shortlisted", "Interested"];
  const negativeStatuses = ["Rejected", "Recruiter_Rejected", "HiringManager_Rejected",
    "ScreeningTest_Failed"];
  const holdStatuses     = ["Recruiter_Hold", "OnHold_TestPassed", "HiringManager_Hold"];

  const firstName = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}").first_name || "";
    } catch { return ""; }
  })();

  return (
    <Box display="flex" flexDirection="column" gap={2.5} pb={4}>
      {error && (
        <Alert severity="warning" onClose={() => setError("")}
          sx={{ borderRadius: "12px" }}>{error}</Alert>
      )}





{/* ── Hero ── */}
<Card elevation={0} sx={{
        borderRadius: "20px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #1d4ed8 100%)",
        overflow: "hidden", position: "relative",
      }}>
        <Box sx={{ position: "absolute", top: -50, right: -30, width: 220, height: 220,
          borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12, mb: 0.4, letterSpacing: "0.05em" }}>
                {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </Typography>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.4rem", lineHeight: 1.25 }}>
                {firstName ? `Good to see you, ${firstName} 👋` : "Your Recruiting Dashboard"}
              </Typography>
              <Box display="flex" gap={1} mt={1.2} flexWrap="wrap">
                {[
                  { label: `${kpis.total_jds ?? 0} active JDs` },
                  { label: `${kpis.total ?? 0} candidates` },
                  { label: `${kpis.ranged_total ?? 0} in ${periodLabel}` },
                  { label: `${kpis.selected ?? 0} selected` },
                ].map(({ label }) => (
                  <Chip key={label} label={label} size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#fff",
                      fontWeight: 600, fontSize: 11,
                      border: "1px solid rgba(255,255,255,0.15)" }} />
                ))}
                {todayEvs.length > 0 && (
                  <Chip
                    label={`🗓 ${todayEvs.length} interview${todayEvs.length > 1 ? "s" : ""} today`}
                    size="small"
                    sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700, fontSize: 11 }} />
                )}
                {urgentCount > 0 && (
                  <Chip
                    label={`⚠ ${urgentCount} JD${urgentCount > 1 ? "s" : ""} closing soon`}
                    size="small"
                    sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: 11 }} />
                )}
              </Box>
            </Box>

            {/* NEW: Period selector */}
            <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
              <Box display="flex" gap={0.5} flexWrap="wrap" justifyContent="flex-end">
                {PERIODS.map((p) => (
                  <Button key={p.key} size="small" onClick={() => handlePeriod(p.key)}
                    sx={{ fontSize: 11, fontWeight: 600, textTransform: "none", px: 1.5, py: 0.5, borderRadius: "8px", minWidth: 0,
                      color: period === p.key ? "#0f172a" : "rgba(255,255,255,0.7)",
                      bgcolor: period === p.key ? "#fff" : "rgba(255,255,255,0.08)",
                      border: "1px solid", borderColor: period === p.key ? "#fff" : "rgba(255,255,255,0.15)",
                      "&:hover": { bgcolor: period === p.key ? "#f1f5f9" : "rgba(255,255,255,0.15)" } }}>
                    {p.label}
                  </Button>
                ))}
              </Box>

              {showCustom && (
                <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                  <TextField size="small" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    sx={{ width: 140, "& .MuiInputBase-root": { bgcolor: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 11, borderRadius: "8px" }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" } }} />
                  <Typography color="rgba(255,255,255,0.5)" fontSize={11}>to</Typography>
                  <TextField size="small" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    sx={{ width: 140, "& .MuiInputBase-root": { bgcolor: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 11, borderRadius: "8px" }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" } }} />
                  <Button size="small" variant="contained" onClick={() => load("custom", dateFrom, dateTo)}
                    sx={{ bgcolor: "#fff", color: "#fff", fontWeight: 700, fontSize: 11, textTransform: "none", borderRadius: "8px", "&:hover": { bgcolor: "#f1f5f9" } }}>
                    Apply
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── KPI strip ── */}
      <Grid container spacing={2}>
        {[
          { title: "Total Candidates", value: kpis.total,       icon: <People />,      accent: "#1d4ed8" },
          { title: "Shortlisted",      value: kpis.shortlisted,  icon: <Star />,        accent: "#0369a1" },
          { title: "In Progress",      value: kpis.in_progress,  icon: <TrendingUp />,  accent: "#d97706",
            sub: `${kpis.total_jds ?? 0} JDs` },
          { title: "Selected",         value: kpis.selected,     icon: <CheckCircle />, accent: "#15803d" },
          { title: "Rejected",         value: kpis.rejected,     icon: <Cancel />,      accent: "#dc2626" },
        ].map(c => (
          <Grid item xs={6} sm={4} md={12 / 5} key={c.title}>
            <KpiCard {...c} />
          </Grid>
        ))}
      </Grid>

      {/* ── Main 3-column row: Today's schedule | Status breakdown | Closing JDs ── */}
      <Grid container spacing={2.5}>

        {/* TODAY'S SCHEDULE */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Box sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: "#eff6ff",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Today sx={{ color: "#1d4ed8", fontSize: 16 }} />
                </Box>
                <Typography fontWeight={700} fontSize={13} color="#0f172a">Today's Interviews</Typography>
                {todayEvs.length > 0 && (
                  <Chip label={todayEvs.length} size="small"
                    sx={{ ml: "auto", bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 800, fontSize: 11 }} />
                )}
              </Box>

              {todayEvs.length === 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={1.5}>
                  <Box sx={{ width: 48, height: 48, borderRadius: "12px", bgcolor: "#f8fafc",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Schedule sx={{ color: "#cbd5e1", fontSize: 24 }} />
                  </Box>
                  <Typography fontSize={13} color="#94a3b8" textAlign="center">
                    No interviews scheduled for today
                  </Typography>
                  <Typography fontSize={11} color="#cbd5e1" textAlign="center">
                    Enjoy your focus time ✓
                  </Typography>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  {todayEvs.map((ev, i) => <InterviewSlot key={i} ev={ev} />)}
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between">
                {[
                  { label: "Scheduled", val: todayEvs.length,
                    color: "#1d4ed8" },
                  { label: "Completed", val: todayEvs.filter(e => new Date(e.scheduled_at) < new Date()).length,
                    color: "#15803d" },
                  { label: "Upcoming",  val: todayEvs.filter(e => new Date(e.scheduled_at) > new Date()).length,
                    color: "#d97706" },
                ].map(s => (
                  <Box key={s.label} textAlign="center">
                    <Typography fontWeight={800} fontSize="1.2rem" color={s.color}>{s.val}</Typography>
                    <Typography fontSize={10} color="#94a3b8">{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* STATUS BREAKDOWN */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Box sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: "#f0fdf4",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Assignment sx={{ color: "#15803d", fontSize: 16 }} />
                </Box>
                <Typography fontWeight={700} fontSize={13} color="#0f172a">Candidate Pipeline</Typography>
              </Box>

              <Box display="flex" flexDirection="column" gap={1}>
                {Object.entries(statusCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const meta = getStatusMeta(status);
                    return (
                      <Box key={status} display="flex" alignItems="center" gap={1.5}>
                        <FiberManualRecord sx={{ fontSize: 8, color: meta.color, flexShrink: 0 }} />
                        <Typography fontSize={11} color="#475569" sx={{ width: 130, flexShrink: 0 }} noWrap>
                          {meta.label}
                        </Typography>
                        <Box flex={1}>
                          <LinearProgress variant="determinate"
                            value={(count / maxCount) * 100}
                            sx={{ height: 6, borderRadius: 4,
                              bgcolor: `${meta.color}18`,
                              "& .MuiLinearProgress-bar": { bgcolor: meta.color, borderRadius: 4 } }} />
                        </Box>
                        <Typography fontWeight={700} fontSize={12} color="#0f172a"
                          sx={{ width: 22, textAlign: "right", flexShrink: 0 }}>
                          {count}
                        </Typography>
                      </Box>
                    );
                  })}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" gap={1}>
                {[
                  {
                    label: "Positive", color: "#15803d", bg: "#f0fdf4",
                    val: Object.entries(statusCounts)
                      .filter(([k]) => positiveStatuses.includes(k))
                      .reduce((s, [, v]) => s + v, 0),
                  },
                  {
                    label: "Rejected", color: "#dc2626", bg: "#fef2f2",
                    val: Object.entries(statusCounts)
                      .filter(([k]) => negativeStatuses.includes(k))
                      .reduce((s, [, v]) => s + v, 0),
                  },
                  {
                    label: "On Hold", color: "#c2410c", bg: "#fff7ed",
                    val: Object.entries(statusCounts)
                      .filter(([k]) => holdStatuses.includes(k))
                      .reduce((s, [, v]) => s + v, 0),
                  },
                ].map(s => (
                  <Box key={s.label} flex={1} textAlign="center" sx={{
                    p: 1, borderRadius: "8px", bgcolor: s.bg, border: `1px solid ${s.color}22`,
                  }}>
                    <Typography fontWeight={800} fontSize="1.1rem" color={s.color}>{s.val}</Typography>
                    <Typography fontSize={10} color={s.color} fontWeight={600}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* CLOSING JDs ALERT */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Box sx={{ width: 30, height: 30, borderRadius: "8px",
                  bgcolor: urgentCount > 0 ? "#fef2f2" : "#fff7ed",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {urgentCount > 0
                    ? <NotificationsActive sx={{ color: "#dc2626", fontSize: 16 }} />
                    : <AccessTime sx={{ color: "#c2410c", fontSize: 16 }} />}
                </Box>
                <Typography fontWeight={700} fontSize={13} color="#0f172a">Closing Soon</Typography>
                {closingJobs.length > 0 && (
                  <Chip
                    label={`${closingJobs.length} JDs`}
                    size="small"
                    sx={{ ml: "auto", fontWeight: 700, fontSize: 10,
                      bgcolor: urgentCount > 0 ? "#fef2f2" : "#fff7ed",
                      color:   urgentCount > 0 ? "#dc2626" : "#c2410c" }} />
                )}
              </Box>

              {closingJobs.length === 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={1.5}>
                  <Box sx={{ width: 48, height: 48, borderRadius: "12px", bgcolor: "#f0fdf4",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle sx={{ color: "#86efac", fontSize: 24 }} />
                  </Box>
                  <Typography fontSize={13} color="#94a3b8" textAlign="center">
                    No JDs closing in the next 10 days
                  </Typography>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}
                  sx={{ maxHeight: 320, overflowY: "auto",
                    "&::-webkit-scrollbar": { width: 3 },
                    "&::-webkit-scrollbar-thumb": { bgcolor: "#e2e8f0", borderRadius: 4 } }}>
                  {closingJobs.map((job, i) => <ClosingJobCard key={i} job={job} />)}
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between">
                {[
                  { label: "Active JDs",  val: activeJds.length, color: "#1d4ed8" },
                  { label: "Closing ≤3d", val: urgentCount,       color: "#dc2626" },
                  { label: "Closing ≤7d", val: closingJobs.filter(j =>
                      (daysUntil(j.deadline || j.expiration_time) ?? 99) <= 7).length, color: "#c2410c" },
                ].map(s => (
                  <Box key={s.label} textAlign="center">
                    <Typography fontWeight={800} fontSize="1.2rem" color={s.color}>{s.val}</Typography>
                    <Typography fontSize={10} color="#94a3b8">{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>



      {/* ── JD-wise candidate accordion (existing) ── */}
      <Box>
<Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5} flexWrap="wrap" gap={1.5}>
          <Box>
            <Typography fontWeight={800} fontSize={16} color="#0f172a">JD-wise Candidate Details</Typography>
            <Typography fontSize={12} color="#94a3b8">
              {jdBreakdown.length} JD{jdBreakdown.length !== 1 ? "s" : ""}
              {showOnlyActiveInPeriod ? ` with new candidates in ${periodLabel}` : ` · ${kpis.total ?? 0} total candidates`}
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <Chip
              label={showOnlyActiveInPeriod ? `Showing: Active in ${periodLabel}` : "Showing: All JDs"}
              onClick={() => setShowOnlyActiveInPeriod(o => !o)}
              size="small"
              clickable
              sx={{
                fontWeight: 700, fontSize: 11, cursor: "pointer",
                bgcolor: showOnlyActiveInPeriod ? "#eff6ff" : "#f1f5f9",
                color: showOnlyActiveInPeriod ? "#2563eb" : "#475569",
                border: `1px solid ${showOnlyActiveInPeriod ? "#bfdbfe" : "#e2e8f0"}`,
              }}
            />
            <TextField size="small" placeholder="Search by role, JD ID or company…"
              value={search} onChange={e => setSearch(e.target.value)}
              sx={{ width: 260 }}
              InputProps={{ startAdornment:
                <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
          </Box>
        </Box>


        {jdBreakdown.length === 0 ? (
          <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
              <PersonSearch sx={{ fontSize: 48, color: "#e2e8f0" }} />
              <Typography color="text.secondary">
                {search ? "No JDs match your search" : "No candidates assigned yet"}
              </Typography>
            </Box>
          </Card>
        ) : jdBreakdown.map((jd) => {
          const topStatuses = Object.entries(jd.status_counts || {})
            .sort((a, b) => b[1] - a[1]).slice(0, 3);

          return (
            <Accordion key={jd.jdID} elevation={0}
              sx={{ mb: 1.5, borderRadius: "14px !important",
                border: "1px solid #e2e8f0", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMore />}
                sx={{ px: 2.5, py: 1,
                  borderRadius: "14px",
                  "&.Mui-expanded": { borderRadius: "14px 14px 0 0" } }}>
                <Box display="flex" alignItems="center" gap={2} flex={1} flexWrap="wrap" pr={1}>
                  <Box sx={{ width: 38, height: 38, borderRadius: "10px", bgcolor: "#eff6ff",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Work sx={{ color: "#1d4ed8", fontSize: 18 }} />
                  </Box>

                  <Box flex={1} minWidth={120}>
                    <Typography fontWeight={700} fontSize={13} color="#0f172a">{jd.jobRole || "—"}</Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Business sx={{ fontSize: 11, color: "#94a3b8" }} />
                      <Typography fontSize={11} color="#64748b">{jd.companyName}</Typography>
                      <Typography fontSize={11} color="#94a3b8">·</Typography>
                      <Typography fontSize={11} color="#0369a1" fontWeight={700}>{jd.jdID}</Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={0.8} flexWrap="wrap" alignItems="center">
                    <Chip label={`${jd.total} candidates`} size="small"
                      sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#f1f5f9", color: "#475569" }} />
                    {(jd.ranged_total ?? 0) > 0 && (
                      <Chip label={`+${jd.ranged_total} in ${periodLabel}`} size="small"
                        sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#eff6ff", color: "#2563eb" }} />
                    )}
                    {topStatuses.map(([s, c]) => {
                      const meta = getStatusMeta(s);
                      return (
                        <Chip key={s} label={`${meta.label} · ${c}`} size="small"
                          sx={{ fontWeight: 600, fontSize: 10,
                            bgcolor: meta.bg, color: meta.color }} />
                      );
                    })}
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 0 }}>
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: "#f8fafc",
                  borderTop: "1px solid #f1f5f9", display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {Object.entries(jd.status_counts || {}).map(([s, c]) => {
                    const meta = getStatusMeta(s);
                    return (
                      <Box key={s} display="flex" alignItems="center" gap={0.6}>
                        <FiberManualRecord sx={{ fontSize: 7, color: meta.color }} />
                        <Typography fontSize={11} color="#475569">
                          {meta.label}: <strong>{c}</strong>
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                <Paper variant="outlined"
                  sx={{ borderRadius: 0, border: "none", borderTop: "1px solid #f1f5f9",
                    overflow: "auto" }}>
                  <Table size="small" sx={{ minWidth: 700 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        {["Candidate", "Status", "Match", "Test Score",
                          "Recruiter Feedback", "HM Feedback","Interview Feedback"].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: 10,
                            color: "#94a3b8", textTransform: "uppercase",
                            letterSpacing: "0.05em", py: 1.2, whiteSpace: "nowrap" }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(jd.candidates || []).map((c) => {
                        const meta = getStatusMeta(c.overallStatus);
                        return (
                          <TableRow key={c._id} hover sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1.2}>
                                <Avatar sx={{ width: 28, height: 28, fontSize: 10,
                                  fontWeight: 700, bgcolor: "#1d4ed8", flexShrink: 0 }}>
                                  {nameInitials(c.candidatename)}
                                </Avatar>
                                <Box>
                                  <Typography fontWeight={600} fontSize={12} color="#0f172a">
                                    {c.candidatename}
                                  </Typography>
                                  <Typography fontSize={10} color="#94a3b8">{c.candidateEmail}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={meta.label} size="small"
                                sx={{ fontWeight: 700, fontSize: 10,
                                  bgcolor: meta.bg, color: meta.color,
                                  height: 20, borderRadius: "6px" }} />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={0.8}>
                                <LinearProgress variant="determinate"
                                  value={Math.min(c.match_score || 0, 100)}
                                  sx={{ width: 52, height: 5, borderRadius: 4,
                                    bgcolor: "#e0f2fe",
                                    "& .MuiLinearProgress-bar": { bgcolor: "#0369a1", borderRadius: 4 } }} />
                                <Typography fontSize={11} fontWeight={700} color="#0369a1">
                                  {(c.match_score || 0).toFixed(0)}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography fontSize={12} fontWeight={700}
                                color={c.ScreeningTestScore > 0 ? "#15803d" : "#94a3b8"}>
                                {c.ScreeningTestScore > 0 ? `${c.ScreeningTestScore}%` : "—"}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 180 }}>
                              <Tooltip title={c.recruiterFeedback || ""} arrow>
                                <Typography fontSize={11} color="#475569"
                                  sx={{ overflow: "hidden", textOverflow: "ellipsis",
                                    display: "-webkit-box", WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    cursor: c.recruiterFeedback ? "help" : "default" }}>
                                  {c.recruiterFeedback || <span style={{ color: "#cbd5e1" }}>No feedback yet</span>}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 180 }}>
                              <Tooltip title={c.hiringManagerFeedback || ""} arrow>
                                <Typography fontSize={11} color="#475569"
                                  sx={{ overflow: "hidden", textOverflow: "ellipsis",
                                    display: "-webkit-box", WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    cursor: c.hiringManagerFeedback ? "help" : "default" }}>
                                  {c.hiringManagerFeedback || (
                                    <span style={{ color: "#cbd5e1" }}>Awaiting HM review</span>
                                  )}
                                </Typography>
                              </Tooltip>
                            </TableCell>


                            <TableCell sx={{ maxWidth: 220 }}>
                              {(c.interviewFeedback || []).length === 0 ? (
                                <Typography fontSize={11} color="#cbd5e1">No interview feedback</Typography>
                              ) : (
                                <Box display="flex" flexDirection="column" gap={0.6}>
                                  {c.interviewFeedback.map((fb, idx) => (
                                    <Box key={idx} sx={{
                                      p: 1, borderRadius: "8px", bgcolor: "#f8fafc",
                                      border: "1px solid #f1f5f9",
                                    }}>
                                      {fb.reviewRating && (
                                        <Chip
                                          label={fb.reviewRating.replace(/_/g, " ")}
                                          size="small"
                                          sx={{
                                            mb: 0.6, fontWeight: 700, fontSize: 9, height: 18,
                                            bgcolor: getStatusMeta(fb.reviewRating).bg,
                                            color: getStatusMeta(fb.reviewRating).color,
                                          }}
                                        />
                                      )}
                                      {fb.feedbackText && (
                                        <Typography fontSize={11} color="#374151" mb={0.6}
                                          sx={{ whiteSpace: "pre-wrap" }}>
                                          {fb.feedbackText}
                                        </Typography>
                                      )}
                                      <Box component="ul" sx={{ m: 0, pl: 2, display: "flex", flexDirection: "column", gap: 0.2 }}>
                                        {fb.technicalSkills != null && (
                                          <Typography component="li" fontSize={10} color="#64748b">
                                            Technical: <strong style={{ color: "#0f172a" }}>{fb.technicalSkills}/10</strong>
                                          </Typography>
                                        )}
                                        {fb.programmingRating != null && (
                                          <Typography component="li" fontSize={10} color="#64748b">
                                            Programming: <strong style={{ color: "#0f172a" }}>{fb.programmingRating}/10</strong>
                                          </Typography>
                                        )}
                                        {fb.problemSolvingSkills != null && (
                                          <Typography component="li" fontSize={10} color="#64748b">
                                            Problem Solving: <strong style={{ color: "#0f172a" }}>{fb.problemSolvingSkills}/10</strong>
                                          </Typography>
                                        )}
                                        {fb.communicationSkills != null && (
                                          <Typography component="li" fontSize={10} color="#64748b">
                                            Communication: <strong style={{ color: "#0f172a" }}>{fb.communicationSkills}/10</strong>
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </TableCell>

                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Paper>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
}