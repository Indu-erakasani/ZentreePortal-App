
import React, { useEffect, useState } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Alert, Avatar,
} from "@mui/material";
import {
  Work, CheckCircle, TrendingUp,NewReleases,
  FiberManualRecord, Business, AssignmentInd, Groups,
  Engineering, AccessTime, Domain, SupervisorAccount,
  ArrowUpward, ArrowDownward,
} from "@mui/icons-material";

const API_URL  = process.env.REACT_APP_API_BASE_URL;
const getToken = () => localStorage.getItem("access_token") || "";

const authFetch = async (url) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = "/login"; }
  return res;
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
};

const statusCount = (arr = [], key) =>
  arr.find((s) => s._id === key)?.count ?? 0;

const DEPT_COLORS = [
  "#185FA5","#0F6E56","#854F0B","#534AB7",
  "#993C1D","#993556","#3B6D11","#5F5E5A",
];
const DEPT_BGS = [
  "#E6F1FB","#E1F5EE","#FAEEDA","#EEEDFE",
  "#FAECE7","#FBEAF0","#EAF3DE","#F1EFE8",
];
const deptColor = (i) => DEPT_COLORS[i % DEPT_COLORS.length];
const deptBg    = (i) => DEPT_BGS[i % DEPT_BGS.length];

const BENCH_STATUS_CONFIG = {
  "Available":      { color: "#0F6E56", bg: "#E1F5EE" },
  "On Project":     { color: "#185FA5", bg: "#E6F1FB" },
  "Notice Period":  { color: "#854F0B", bg: "#FAEEDA" },
  "Pending Review": { color: "#534AB7", bg: "#EEEDFE" },
  "Inactive":       { color: "#5F5E5A", bg: "#F1EFE8" },
};

const PRIORITY_META = {
  Critical: { bg: "#FCEBEB", color: "#791F1F", dot: "#E24B4A", border: "#F09595" },
  High:     { bg: "#FAEEDA", color: "#633806", dot: "#EF9F27", border: "#FAC775" },
  Medium:   { bg: "#E6F1FB", color: "#0C447C", dot: "#378ADD", border: "#B5D4F4" },
};

// Section divider label
const SectionLabel = ({ children }) => (
  <Typography sx={{
    fontSize: 11, fontWeight: 700, color: "#888780",
    textTransform: "uppercase", letterSpacing: "0.08em",
    mb: 1.5, mt: 0.5,
  }}>
    {children}
  </Typography>
);

// KPI stat card
const StatCard = ({ label, value, sub, icon, accentColor, accentBg, trend, trendLabel }) => (
  <Card elevation={0} sx={{
    border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px",
    background: "#fff", height: "100%",
    transition: "box-shadow 0.15s, transform 0.15s",
    "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.07)", transform: "translateY(-1px)" },
  }}>
    <CardContent sx={{ p: "20px !important" }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box sx={{
          width: 36, height: 36, borderRadius: "10px", bgcolor: accentBg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {React.cloneElement(icon, { sx: { fontSize: 18, color: accentColor } })}
        </Box>
        {trend && trendLabel && (
          <Box display="flex" alignItems="center" gap={0.5} sx={{
            bgcolor: trend === "up" ? "#E1F5EE" : "#FCEBEB",
            px: 1, py: 0.4, borderRadius: "20px",
          }}>
            {trend === "up"
              ? <ArrowUpward sx={{ fontSize: 10, color: "#0F6E56" }} />
              : <ArrowDownward sx={{ fontSize: 10, color: "#A32D2D" }} />}
            <Typography sx={{
              fontSize: 11, fontWeight: 600,
              color: trend === "up" ? "#0F6E56" : "#A32D2D",
            }}>
              {trendLabel}
            </Typography>
          </Box>
        )}
      </Box>
      <Typography sx={{
        fontSize: 28, fontWeight: 700, color: "#1a1a1a",
        lineHeight: 1, mb: 0.5, fontVariantNumeric: "tabular-nums",
      }}>
        {value ?? "—"}
      </Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#444441", mb: sub ? 0.4 : 0 }}>
        {label}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: 12, color: "#888780", lineHeight: 1.4 }}>
          {sub}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// Section card wrapper
const SectionCard = ({ title, badge, badgeColor = "default", children, sx = {} }) => (
  <Card elevation={0} sx={{
    border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px",
    background: "#fff", height: "100%", ...sx,
  }}>
    <Box sx={{
      px: 2.5, pt: 2.5, pb: 1.5,
      borderBottom: "0.5px solid rgba(0,0,0,0.06)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
        {title}
      </Typography>
      {badge != null && (
        <Chip label={badge} size="small" sx={{
          fontSize: 11, fontWeight: 600, height: 22, border: "none",
          bgcolor: badgeColor === "green" ? "#E1F5EE" : badgeColor === "red" ? "#FCEBEB" : "#F1EFE8",
          color:   badgeColor === "green" ? "#0F6E56" : badgeColor === "red" ? "#A32D2D" : "#5F5E5A",
        }} />
      )}
    </Box>
    <CardContent sx={{ p: "16px 20px !important" }}>
      {children}
    </CardContent>
  </Card>
);

const Empty = ({ msg }) => (
  <Box py={4} textAlign="center">
    <Typography sx={{ fontSize: 13, color: "#B4B2A9" }}>{msg}</Typography>
  </Box>
);

// Reusable horizontal bar row
const BarRow = ({ label, count, maxCount, color, colorBg, pct }) => (
  <Box>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.6}>
      <Box display="flex" alignItems="center" gap={1}>
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 13, color: "#2C2C2A" }}>{label}</Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={1.5}>
        {pct !== undefined && (
          <Typography sx={{ fontSize: 12, color: "#B4B2A9", fontVariantNumeric: "tabular-nums" }}>
            {pct}%
          </Typography>
        )}
        <Typography sx={{
          fontSize: 13, fontWeight: 600, color: "#1a1a1a",
          minWidth: 28, textAlign: "right", fontVariantNumeric: "tabular-nums",
        }}>
          {count}
        </Typography>
      </Box>
    </Box>
    <Box sx={{ height: 6, borderRadius: 99, bgcolor: colorBg, overflow: "hidden" }}>
      <Box sx={{
        width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
        height: "100%", bgcolor: color, borderRadius: 99,
        transition: "width 0.4s ease",
      }} />
    </Box>
  </Box>
);

export default function ManagerDashboard() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();

  const [portal,     setPortal]     = useState(null);
  const [rbot,       setRbot]       = useState(null);
  const [benchStats, setBenchStats] = useState(null);
  const [benchTotal, setBenchTotal] = useState(null);
  const [empStats,   setEmpStats]   = useState(null);
  const [empTotal,   setEmpTotal]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [pR, rR, bsR, blR, esR, elR] = await Promise.all([
          authFetch(`${API_URL}/dashboard/`),
          authFetch(`${API_URL}/rbot-dashboard/manager?period=month`),
          authFetch(`${API_URL}/bench/stats`),
          authFetch(`${API_URL}/bench/?page=1&per_page=1`),
          authFetch(`${API_URL}/employees/stats`),
          authFetch(`${API_URL}/employees/?page=1&per_page=1`),
        ]);
        const [pJ, rJ, bsJ, blJ, esJ, elJ] = await Promise.all([
          pR.json(), rR.json(), bsR.json(), blR.json(), esR.json(), elR.json(),
        ]);
        if (pJ.success)  setPortal(pJ.dashboard ?? {});
        if (rJ.success)  setRbot(rJ);
        if (bsJ.success) setBenchStats(bsJ.data ?? {});
        if (blJ.success) setBenchTotal(blJ.total ?? 0);
        if (esJ.success) setEmpStats(esJ.data ?? {});
        if (elJ.success) setEmpTotal(elJ.total ?? 0);
      } catch {
        setError("Unable to load dashboard data. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <Box display="flex" flexDirection="column" justifyContent="center"
      alignItems="center" minHeight="60vh" gap={2}>
      <CircularProgress size={36} thickness={4} sx={{ color: "#185FA5" }} />
      <Typography sx={{ fontSize: 13, color: "#888780" }}>Loading dashboard…</Typography>
    </Box>
  );

  // Derived values
  const stageCounts    = portal?.stage_counts         ?? [];
  const highJobs       = portal?.high_priority_jobs   ?? [];


  const rbKpis       = rbot?.kpis              ?? {};
  const rbRecruiters = (rbot?.recruiter_breakdown ?? [])
    .filter(r => r.recruiter_id !== "Other" && r.recruiter_name !== "Other").slice(0, 6);
  const rbJdOverall  = (rbot?.jd_overall ?? []).slice(0, 6);

  const benchByStatus  = benchStats?.by_status ?? [];
  const benchAvailable = statusCount(benchByStatus, "Available");
  const benchOnProject = statusCount(benchByStatus, "On Project");
  const benchNotice    = statusCount(benchByStatus, "Notice Period");
  const benchOther     = Math.max(0, (benchTotal ?? 0) - benchAvailable - benchOnProject - benchNotice);
  const benchMaxCount  = Math.max(1, ...benchByStatus.map(s => s.count));

  const empByStatus      = empStats?.by_status     ?? [];
  const empByDept        = empStats?.by_department ?? [];
  const empActive        = statusCount(empByStatus, "Active");
  const empActiveClients = empStats?.active_clients ?? 0;
  const empMaxDept       = Math.max(1, ...empByDept.map(d => d.count));

  const maxStage = Math.max(1, ...stageCounts.map(s => s.count));
  const maxRbRec = Math.max(1, ...rbRecruiters.map(r => r.selected));

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const STAGE_COLORS = ["#185FA5","#0F6E56","#534AB7","#854F0B","#A32D2D","#993556"];
  const STAGE_BGS    = ["#E6F1FB","#E1F5EE","#EEEDFE","#FAEEDA","#FCEBEB","#FBEAF0"];
  const stageTotal   = stageCounts.reduce((s, x) => s + x.count, 0);

  return (
    <Box sx={{ bgcolor: "#F7F6F3", minHeight: "100vh", p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={1}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>
            {greeting}{user.first_name ? `, ${user.first_name}` : ""}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#888780", mt: 0.5 }}>
            Here's your recruitment overview for today
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 12, color: "#B4B2A9", display: { xs: "none", sm: "block" } }}>
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "10px", fontSize: 13 }}
          onClose={() => setError("")}>
          {error}
        </Alert>
      )}



      {/* ── ResourcingBot KPIs ── */}
      <SectionLabel>ResourcingBot · last 30 days</SectionLabel>
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Total candidates",  value: rbKpis.total,            sub: "All time in RBot",    icon: <Groups />,        accentColor: "#185FA5", accentBg: "#E6F1FB" },
          { label: "Added this month",  value: rbKpis.ranged_total,     sub: "Last 30 days",        icon: <NewReleases />,   accentColor: "#534AB7", accentBg: "#EEEDFE" },
          { label: "Selected",          value: rbKpis.selected,         sub: rbKpis.total > 0 ? `${Math.round((rbKpis.selected / rbKpis.total) * 100)}% rate` : "No data", icon: <CheckCircle />, accentColor: "#0F6E56", accentBg: "#E1F5EE", trend: "up" },
          { label: "Rejected",          value: rbKpis.rejected,         sub: rbKpis.total > 0 ? `${Math.round((rbKpis.rejected / rbKpis.total) * 100)}% rate` : "No data", icon: <TrendingUp />,  accentColor: "#A32D2D", accentBg: "#FCEBEB" },
          { label: "Active recruiters", value: rbKpis.total_recruiters, sub: "Working on JDs",      icon: <AssignmentInd />, accentColor: "#854F0B", accentBg: "#FAEEDA" },
        ].map(c => (
          <Grid item xs={6} sm={4} md key={c.label}><StatCard {...c} /></Grid>
        ))}
      </Grid>

      {/* ── Bench people KPIs ── */}
      <SectionLabel>Bench people</SectionLabel>
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Total on bench",      value: benchTotal,      sub: "All bench records",           icon: <Engineering />,     accentColor: "#185FA5", accentBg: "#E6F1FB" },
          { label: "Available",           value: benchAvailable,  sub: benchTotal > 0 ? `${Math.round((benchAvailable / benchTotal) * 100)}% of bench` : "Ready to deploy", icon: <CheckCircle />, accentColor: "#0F6E56", accentBg: "#E1F5EE", trend: benchAvailable > 0 ? "up" : undefined, trendLabel: benchAvailable > 0 ? `${benchAvailable}` : undefined },
          { label: "On project",          value: benchOnProject,  sub: "Currently placed",            icon: <Work />,            accentColor: "#534AB7", accentBg: "#EEEDFE" },
          { label: "On notice / other",   value: benchNotice + benchOther, sub: "Notice period or pending", icon: <AccessTime />, accentColor: "#854F0B", accentBg: "#FAEEDA" },
        ].map(c => (
          <Grid item xs={6} sm={3} md={3} key={c.label}><StatCard {...c} /></Grid>
        ))}
      </Grid>

      {/* ── Employee KPIs ── */}
      <SectionLabel>Employees</SectionLabel>
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Total employees",         value: empTotal,         sub: "All employee records",     icon: <SupervisorAccount />, accentColor: "#534AB7", accentBg: "#EEEDFE" },
          { label: "Active",                  value: empActive,        sub: empTotal > 0 ? `${Math.round((empActive / empTotal) * 100)}% of workforce` : `of ${empTotal ?? 0} total`, icon: <CheckCircle />, accentColor: "#0F6E56", accentBg: "#E1F5EE" },
          { label: "Live client engagements", value: empActiveClients, sub: "Unique active clients",    icon: <Domain />,            accentColor: "#185FA5", accentBg: "#E6F1FB" },
          { label: "Departments",             value: empByDept.length || "—", sub: empByDept.map(d => d._id).filter(Boolean).slice(0, 2).join(", ") || "No data", icon: <Business />, accentColor: "#854F0B", accentBg: "#FAEEDA" },
        ].map(c => (
          <Grid item xs={6} sm={3} md={3} key={c.label}><StatCard {...c} /></Grid>
        ))}
      </Grid>

      {/* ── Pipeline + High priority jobs ── */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <SectionCard title="Candidate pipeline" badge={stageTotal}>
            {stageCounts.length === 0 ? <Empty msg="No active pipeline data." /> : (
              <Box display="flex" flexDirection="column" gap={1.8}>
                {stageCounts.map((item, i) => (
                  <BarRow key={item.stage} label={item.stage} count={item.count}
                    maxCount={maxStage} color={STAGE_COLORS[i % STAGE_COLORS.length]}
                    colorBg={STAGE_BGS[i % STAGE_BGS.length]}
                    pct={stageTotal > 0 ? Math.round((item.count / stageTotal) * 100) : 0} />
                ))}
              </Box>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <SectionCard title="High priority open jobs"
            badge={highJobs.length > 0 ? `${highJobs.length} open` : "None"}
            badgeColor={highJobs.some(j => j.priority === "Critical") ? "red" : "default"}>
            {highJobs.length === 0 ? <Empty msg="No critical or high-priority jobs open." /> : (
              <Box display="flex" flexDirection="column" gap={1}>
                {highJobs.map((job, i) => {
                  const cfg = PRIORITY_META[job.priority] ?? PRIORITY_META.Medium;
                  return (
                    <Box key={job._id ?? i} sx={{
                      display: "flex", alignItems: "center", gap: 1.5,
                      p: "10px 14px", borderRadius: "8px",
                      border: `0.5px solid ${cfg.border}`, bgcolor: cfg.bg,
                      "&:hover": { opacity: 0.85 }, transition: "opacity 0.12s",
                    }}>
                      <FiberManualRecord sx={{ fontSize: 9, color: cfg.dot, flexShrink: 0 }} />
                      <Box flex={1} overflow="hidden">
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {job.title}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: "#888780", mt: 0.2 }}>
                          {job.client_name}{job.location ? ` · ${job.location}` : ""}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} flexShrink={0}>
                        <Typography sx={{ fontSize: 12, color: cfg.color, fontWeight: 600 }}>
                          {job.openings} opening{job.openings !== 1 ? "s" : ""}
                        </Typography>
                        <Chip label={job.priority} size="small" sx={{
                          fontSize: 11, fontWeight: 700, height: 20,
                          bgcolor: "transparent", color: cfg.color,
                          border: `0.5px solid ${cfg.dot}`,
                        }} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </SectionCard>
        </Grid>
      </Grid>

      {/* ── Bench breakdown + Employee department breakdown ── */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Bench · status breakdown" badge={`${benchTotal ?? 0} total`}>
            {benchByStatus.length === 0 ? <Empty msg="No bench data yet." /> : (
              <Box display="flex" flexDirection="column" gap={1.8}>
                {[...benchByStatus].sort((a, b) => b.count - a.count).map((item) => {
                  const cfg = BENCH_STATUS_CONFIG[item._id] ?? { color: "#5F5E5A", bg: "#F1EFE8" };
                  return (
                    <BarRow key={item._id} label={item._id || "Unknown"}
                      count={item.count} maxCount={benchMaxCount}
                      color={cfg.color} colorBg={cfg.bg}
                      pct={benchTotal > 0 ? Math.round((item.count / benchTotal) * 100) : 0} />
                  );
                })}
              </Box>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionCard title="Employees · by department" badge={`${empTotal ?? 0} total`}>
            {empByDept.length === 0 ? <Empty msg="No employee data yet." /> : (
              <Box display="flex" flexDirection="column" gap={1.8}>
                {[...empByDept].sort((a, b) => b.count - a.count).map((item, i) => (
                  <BarRow key={item._id ?? i} label={item._id || "Unassigned"}
                    count={item.count} maxCount={empMaxDept}
                    color={deptColor(i)} colorBg={deptBg(i)}
                    pct={empTotal > 0 ? Math.round((item.count / empTotal) * 100) : 0} />
                ))}
              </Box>
            )}
          </SectionCard>
        </Grid>
      </Grid>

      {/* ── RBot recruiter + JD summary ── */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={5}>
          <SectionCard title="Recruiter performance · RBot" badge="This month">
            {rbRecruiters.length === 0 ? <Empty msg="No recruiter data." /> : (
              <Box display="flex" flexDirection="column" gap={1.8}>
                {rbRecruiters.map((r, i) => {
                  const selPct = r.total > 0 ? Math.round((r.selected / r.total) * 100) : 0;
                  return (
                    <Box key={r.recruiter_id}>
                      <Box display="flex" alignItems="center" gap={1.5} mb={0.6}>
                        <Avatar sx={{
                          width: 28, height: 28, fontSize: 11, fontWeight: 700,
                          bgcolor: STAGE_BGS[i % STAGE_BGS.length],
                          color: STAGE_COLORS[i % STAGE_COLORS.length],
                        }}>
                          {(r.recruiter_name || "?")[0].toUpperCase()}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }} noWrap>
                              {r.recruiter_name}
                            </Typography>
                            <Box display="flex" gap={1} alignItems="center" flexShrink={0}>
                              <Typography sx={{ fontSize: 12, color: "#0F6E56", fontWeight: 600 }}>
                                {r.selected} sel
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: "#B4B2A9" }}>/ {r.total}</Typography>
                              <Chip label={`${selPct}%`} size="small" sx={{
                                fontSize: 10, fontWeight: 700, height: 18, border: "none",
                                bgcolor: selPct >= 50 ? "#E1F5EE" : selPct >= 25 ? "#FAEEDA" : "#FCEBEB",
                                color:   selPct >= 50 ? "#0F6E56" : selPct >= 25 ? "#633806" : "#791F1F",
                              }} />
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ height: 5, borderRadius: 99, bgcolor: STAGE_BGS[i % STAGE_BGS.length], overflow: "hidden" }}>
                        <Box sx={{
                          width: `${maxRbRec > 0 ? (r.selected / maxRbRec) * 100 : 0}%`,
                          height: "100%", bgcolor: STAGE_COLORS[i % STAGE_COLORS.length],
                          borderRadius: 99, transition: "width 0.4s ease",
                        }} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={7}>
          <SectionCard title="Top active JDs · RBot" badge={`${rbJdOverall.length} shown`}>
            {rbJdOverall.length === 0 ? <Empty msg="No JD data." /> : (
              <Box display="flex" flexDirection="column" gap={0.8}>
                {rbJdOverall.map((jd, i) => {
                  const selPct = jd.total > 0 ? Math.round((jd.selected / jd.total) * 100) : 0;
                  return (
                    <Box key={jd.jdID} sx={{
                      display: "flex", alignItems: "center", gap: 1.5,
                      p: "10px 12px", borderRadius: "8px",
                      border: "0.5px solid rgba(0,0,0,0.06)", bgcolor: "#FAFAF9",
                      "&:hover": { bgcolor: "#F1EFE8" }, transition: "background 0.12s",
                    }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: "8px",
                        bgcolor: STAGE_BGS[i % STAGE_BGS.length],
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Work sx={{ fontSize: 14, color: STAGE_COLORS[i % STAGE_COLORS.length] }} />
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Box display="flex" alignItems="baseline" gap={1}>
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }} noWrap>
                            {jd.jobRole || "—"}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#B4B2A9", fontFamily: "monospace", flexShrink: 0 }}>
                            {jd.jdID}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 11, color: "#888780" }}>{jd.companyName}</Typography>
                      </Box>
                      <Box display="flex" gap={0.8} alignItems="center" flexShrink={0}>
                        <Chip label={`${jd.total} cand.`} size="small" sx={{ fontSize: 10, fontWeight: 500, height: 20, bgcolor: "#E6F1FB", color: "#0C447C", border: "none" }} />
                        <Chip label={`${jd.selected} sel.`} size="small" sx={{ fontSize: 10, fontWeight: 600, height: 20, bgcolor: "#E1F5EE", color: "#085041", border: "none" }} />
                        {selPct > 0 && (
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#888780", minWidth: 30, textAlign: "right" }}>
                            {selPct}%
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </SectionCard>
        </Grid>
      </Grid>



    </Box>
  );
}