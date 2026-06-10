// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
//   Alert, LinearProgress, Table, TableHead, TableBody, TableRow,
//   TableCell, Paper, Avatar,
// } from "@mui/material";
// import { People, CheckCircle, Cancel, TrendingUp, Work, Groups } from "@mui/icons-material";

// const BASE = process.env.REACT_APP_API_BASE_URL;
// const getHeaders = () => ({
//   "Content-Type": "application/json",
//   Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
// });

// const ACCENT_COLORS = ["#1d4ed8","#0d9488","#7c3aed","#d97706","#dc2626","#15803d"];

// const STATUS_COLOR = {
//   "Selected":              { bg: "#f0fdf4", color: "#15803d" },
//   "Recruiter_Rejected":    { bg: "#fef2f2", color: "#dc2626" },
//   "HiringManager_Rejected":{ bg: "#fef2f2", color: "#991b1b" },
//   "Recruiter_Accepted":    { bg: "#eff6ff", color: "#0369a1" },
//   "NewCandidate":          { bg: "#f8fafc", color: "#475569" },
//   "Shortlisted":           { bg: "#eff6ff", color: "#1d4ed8" },
//   "ScreeningTest_Passed":  { bg: "#f0fdf4", color: "#15803d" },
//   "ScreeningTest_Failed":  { bg: "#fef2f2", color: "#dc2626" },
// };
// const getStatusStyle = (s) => STATUS_COLOR[s] || { bg: "#f8fafc", color: "#475569" };

// const nameInitials = (name = "") =>
//   name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

// const KpiCard = ({ title, value, icon, accent }) => (
//   <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid #e2e8f0" }}>
//     <Box sx={{ height: 3, bgcolor: accent, borderRadius: "14px 14px 0 0" }} />
//     <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
//       <Box sx={{ width: 44, height: 44, borderRadius: "10px",
//         bgcolor: `${accent}15`, display: "flex", alignItems: "center",
//         justifyContent: "center", flexShrink: 0 }}>
//         {React.cloneElement(icon, { sx: { color: accent, fontSize: 20 } })}
//       </Box>
//       <Box>
//         <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94a3b8",
//           textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</Typography>
//         <Typography sx={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
//           {value ?? 0}
//         </Typography>
//       </Box>
//     </CardContent>
//   </Card>
// );

// export default function RbotManagerDashboard() {
//   const [data,    setData]    = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error,   setError]   = useState("");

//   const load = useCallback(async () => {
//     setLoading(true); setError("");
//     try {
//       const res  = await fetch(`${BASE}/rbot-dashboard/manager`, { headers: getHeaders() });
//       const json = await res.json();
//       if (!json.success) throw new Error(json.message);
//       setData(json);
//     } catch (e) { setError(e.message); }
//     finally { setLoading(false); }
//   }, []);

//   useEffect(() => { load(); }, [load]);

//   if (loading) return (
//     <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
//       <CircularProgress />
//     </Box>
//   );

//   const kpis             = data?.kpis               || {};
//   const teamStatusCounts = data?.team_status_counts || {};
//   const recruiterBreakdown = data?.recruiter_breakdown || [];
//   const maxCount = Math.max(...Object.values(teamStatusCounts), 1);

//   return (
//     <Box display="flex" flexDirection="column" gap={3}>
//       {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

//       <Box>
//         <Typography variant="h4" fontWeight={800} color="#0f172a">
//           My Team — ResourcingBot Analytics
//         </Typography>
//         <Typography color="text.secondary" mt={0.5}>
//           Complete overview of all recruiters and their candidates
//         </Typography>
//       </Box>

//       {/* Team KPIs */}
//       <Grid container spacing={2}>
//         <Grid item xs={6} md={3}>
//           <KpiCard title="Total Candidates" value={kpis.total} icon={<People />} accent="#1d4ed8" />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <KpiCard title="In Progress" value={kpis.in_progress} icon={<TrendingUp />} accent="#d97706" />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <KpiCard title="Selected" value={kpis.selected} icon={<CheckCircle />} accent="#15803d" />
//         </Grid>
//         <Grid item xs={6} md={3}>
//           <KpiCard title="Total Recruiters" value={kpis.total_recruiters} icon={<Groups />} accent="#7c3aed" />
//         </Grid>
//       </Grid>

//       {/* Team-wide status breakdown */}
//       <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid #e2e8f0" }}>
//         <CardContent sx={{ p: 2.5 }}>
//           <Typography fontWeight={700} fontSize={14} color="#0f172a" mb={2}>
//             Team-wide Status Breakdown
//           </Typography>
//           <Box display="flex" flexDirection="column" gap={1.2}>
//             {Object.entries(teamStatusCounts)
//               .sort((a, b) => b[1] - a[1])
//               .map(([status, count]) => {
//                 const style = getStatusStyle(status);
//                 return (
//                   <Box key={status} display="flex" alignItems="center" gap={2}>
//                     <Box sx={{ width: 200, flexShrink: 0 }}>
//                       <Chip label={status} size="small"
//                         sx={{ fontSize: 10, fontWeight: 700,
//                           bgcolor: style.bg, color: style.color, maxWidth: "100%" }} />
//                     </Box>
//                     <Box flex={1}>
//                       <LinearProgress variant="determinate"
//                         value={(count / maxCount) * 100}
//                         sx={{ height: 8, borderRadius: 4,
//                           bgcolor: `${style.color}15`,
//                           "& .MuiLinearProgress-bar": { bgcolor: style.color, borderRadius: 4 } }} />
//                     </Box>
//                     <Typography fontWeight={700} fontSize={13} color="#0f172a"
//                       sx={{ width: 30, textAlign: "right" }}>
//                       {count}
//                     </Typography>
//                   </Box>
//                 );
//               })}
//           </Box>
//         </CardContent>
//       </Card>

//       {/* Per-recruiter table */}
//       <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid #e2e8f0" }}>
//         <CardContent sx={{ p: 2.5 }}>
//           <Typography fontWeight={700} fontSize={14} color="#0f172a" mb={2}>
//             Recruiter Performance Breakdown
//           </Typography>
//           <Paper variant="outlined"
//             sx={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #f1f5f9" }}>
//             <Table>
//               <TableHead>
//                 <TableRow sx={{ bgcolor: "#f8fafc" }}>
//                   {["Recruiter", "Total JDs", "Total Candidates",
//                     "In Progress", "Selected", "Rejected", "Status Mix"].map(h => (
//                     <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11,
//                       color: "#94a3b8", textTransform: "uppercase",
//                       letterSpacing: "0.05em", py: 1.2 }}>{h}</TableCell>
//                   ))}
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {recruiterBreakdown.map((r, i) => (
//                   <TableRow key={r.recruiter_id} hover>
//                     <TableCell>
//                       <Box display="flex" alignItems="center" gap={1.5}>
//                         <Avatar sx={{ width: 32, height: 32, fontSize: 11,
//                           fontWeight: 700,
//                           bgcolor: ACCENT_COLORS[i % ACCENT_COLORS.length] }}>
//                           {nameInitials(r.recruiter_name)}
//                         </Avatar>
//                         <Typography fontWeight={600} fontSize={13}>
//                           {r.recruiter_name}
//                         </Typography>
//                       </Box>
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: 700, color: "#1d4ed8" }}>
//                       {r.total_jds}
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: 700 }}>{r.total}</TableCell>
//                     <TableCell>
//                       <Chip label={r.in_progress} size="small"
//                         sx={{ fontWeight: 700, bgcolor: "#fff7ed", color: "#c2410c" }} />
//                     </TableCell>
//                     <TableCell>
//                       <Chip label={r.selected} size="small" color="success"
//                         sx={{ fontWeight: 700 }} />
//                     </TableCell>
//                     <TableCell>
//                       <Chip label={r.rejected} size="small" color="error"
//                         sx={{ fontWeight: 700 }} />
//                     </TableCell>
//                     <TableCell sx={{ minWidth: 200 }}>
//                       <Box display="flex" flexWrap="wrap" gap={0.5}>
//                         {Object.entries(r.status_counts)
//                           .sort((a, b) => b[1] - a[1])
//                           .slice(0, 4)
//                           .map(([s, c]) => (
//                             <Chip key={s} label={`${s.replace(/_/g," ")}: ${c}`}
//                               size="small"
//                               sx={{ fontSize: 9, fontWeight: 600,
//                                 bgcolor: getStatusStyle(s).bg,
//                                 color: getStatusStyle(s).color,
//                                 height: 18 }} />
//                           ))}
//                       </Box>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </Paper>
//         </CardContent>
//       </Card>
//     </Box>
//   );
// }















import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Alert, LinearProgress, Table, TableHead, TableBody, TableRow,
  TableCell, Paper, Avatar, Accordion, AccordionSummary,
  AccordionDetails, Divider, Button, ButtonGroup, TextField,
  Collapse, IconButton, Tooltip,
} from "@mui/material";
import {
  People, CheckCircle, Cancel, TrendingUp, Groups, ExpandMore,
  ExpandLess, Work, Business, FiberManualRecord, FilterList,
  KeyboardArrowDown, KeyboardArrowUp,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip as ChartTooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, ChartTooltip, Legend, Filler
);

const BASE = process.env.REACT_APP_API_BASE_URL;
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

// ── Status metadata ───────────────────────────────────────────────────────────
const STATUS_META = {
  Shortlisted:               { bg: "#eff6ff", color: "#1d4ed8",  label: "Shortlisted" },
  Selected:                  { bg: "#f0fdf4", color: "#15803d",  label: "Selected" },
  NewCandidate:              { bg: "#f8fafc", color: "#475569",  label: "New" },
  Recruiter_Accepted:        { bg: "#eff6ff", color: "#0369a1",  label: "Rctr Accepted" },
  HiringManager_Accepted:    { bg: "#f0fdf4", color: "#166534",  label: "HM Accepted" },
  ScreeningTest_Sent:        { bg: "#fefce8", color: "#a16207",  label: "Test Sent" },
  ScreeningTest_Resent:      { bg: "#fefce8", color: "#a16207",  label: "Test Resent" },
  ScreeningTest_Passed:      { bg: "#f0fdf4", color: "#15803d",  label: "Test Passed" },
  ScreeningTest_Failed:      { bg: "#fef2f2", color: "#dc2626",  label: "Test Failed" },
  Recruiter_Rejected:        { bg: "#fef2f2", color: "#dc2626",  label: "Rctr Rejected" },
  HiringManager_Rejected:    { bg: "#fef2f2", color: "#991b1b",  label: "HM Rejected" },
  Recruiter_Hold:            { bg: "#fff7ed", color: "#c2410c",  label: "On Hold" },
  OnHold_TestPassed:         { bg: "#fff7ed", color: "#c2410c",  label: "Hold (Test ✓)" },
  HiringManager_Hold:        { bg: "#fff7ed", color: "#c2410c",  label: "HM Hold" },
  Interview_Scheduled:       { bg: "#eff6ff", color: "#1d4ed8",  label: "Interview Sched" },
  Round2_Scheduled:          { bg: "#eff6ff", color: "#1d4ed8",  label: "Round 2 Sched" },
  Rejected:                  { bg: "#fef2f2", color: "#dc2626",  label: "Rejected" },
  Interested:                { bg: "#f0fdf4", color: "#15803d",  label: "Interested" },
};
const sm = (s) => STATUS_META[s] || { bg: "#f8fafc", color: "#64748b", label: s?.replace(/_/g, " ") || "Unknown" };

const PALETTE = ["#1d4ed8","#0d9488","#7c3aed","#d97706","#dc2626","#15803d","#0369a1","#9333ea"];

const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const fmtPct = (n, d) => d > 0 ? `${((n / d) * 100).toFixed(0)}%` : "0%";

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, icon, accent, sub }) => (
  <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid #e2e8f0", height: "100%" }}>
    <Box sx={{ height: 3, bgcolor: accent, borderRadius: "14px 14px 0 0" }} />
    <CardContent sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: `${accent}15`,
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

// ── Mini donut-style stat pill ────────────────────────────────────────────────
const StatPill = ({ label, val, color, bg }) => (
  <Box sx={{ px: 1.5, py: 0.8, borderRadius: "8px", bgcolor: bg,
    border: `1px solid ${color}22`, textAlign: "center", minWidth: 64 }}>
    <Typography fontWeight={800} fontSize="1rem" color={color}>{val}</Typography>
    <Typography fontSize={9} color={color} fontWeight={600}>{label}</Typography>
  </Box>
);

// ── Period selector ───────────────────────────────────────────────────────────
const PERIODS = [
  { key: "week",    label: "7 days" },
  { key: "month",   label: "30 days" },
  { key: "quarter", label: "90 days" },
  { key: "year",    label: "1 year" },
  { key: "custom",  label: "Custom" },
];

// ── Per-recruiter JD table row ────────────────────────────────────────────────
function JdRow({ jd }) {
  const [open, setOpen] = useState(false);
  const rejPct  = fmtPct(jd.rejected, jd.total);
  const selPct  = fmtPct(jd.selected, jd.total);
  const maxSC   = Math.max(...Object.values(jd.status_counts || {}), 1);

  return (
    <>
      <TableRow hover sx={{ bgcolor: open ? "#f8fafc" : "inherit",
        cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <TableCell sx={{ pl: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 28, height: 28, borderRadius: "6px", bgcolor: "#eff6ff",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Work sx={{ color: "#1d4ed8", fontSize: 14 }} />
            </Box>
            <Box>
              <Typography fontWeight={600} fontSize={12} color="#0f172a">{jd.jobRole || "—"}</Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Business sx={{ fontSize: 10, color: "#94a3b8" }} />
                <Typography fontSize={10} color="#64748b">{jd.companyName}</Typography>
                <Typography fontSize={10} color="#94a3b8">·</Typography>
                <Typography fontSize={10} color="#0369a1" fontWeight={700}>{jd.jdID}</Typography>
              </Box>
            </Box>
          </Box>
        </TableCell>
        <TableCell align="center">
          <Typography fontWeight={700} fontSize={13}>{jd.total}</Typography>
        </TableCell>
        <TableCell align="center">
          <Chip label={`${jd.selected} · ${selPct}`} size="small"
            sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#f0fdf4", color: "#15803d" }} />
        </TableCell>
        <TableCell align="center">
          <Chip label={`${jd.rejected} · ${rejPct}`} size="small"
            sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#fef2f2", color: "#dc2626" }} />
        </TableCell>
        <TableCell align="center">
          <Chip label={jd.total - jd.selected - jd.rejected} size="small"
            sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#fff7ed", color: "#c2410c" }} />
        </TableCell>
        <TableCell align="right" sx={{ pr: 2 }}>
          <IconButton size="small">
            {open ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Expanded status breakdown */}
      <TableRow>
        <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc",
              borderBottom: "1px solid #f1f5f9" }}>
              <Typography fontSize={11} fontWeight={700} color="#94a3b8"
                textTransform="uppercase" letterSpacing="0.06em" mb={1.5}>
                Status breakdown for this JD
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {Object.entries(jd.status_counts || {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const meta = sm(status);
                    return (
                      <Box key={status} display="flex" alignItems="center" gap={1.5}>
                        <FiberManualRecord sx={{ fontSize: 7, color: meta.color, flexShrink: 0 }} />
                        <Typography fontSize={11} color="#475569"
                          sx={{ width: 160, flexShrink: 0 }}>{meta.label}</Typography>
                        <Box flex={1}>
                          <LinearProgress variant="determinate"
                            value={(count / maxSC) * 100}
                            sx={{ height: 5, borderRadius: 4,
                              bgcolor: `${meta.color}15`,
                              "& .MuiLinearProgress-bar": { bgcolor: meta.color, borderRadius: 4 } }} />
                        </Box>
                        <Typography fontWeight={700} fontSize={12} color="#0f172a"
                          sx={{ width: 20, textAlign: "right", flexShrink: 0 }}>
                          {count}
                        </Typography>
                      </Box>
                    );
                  })}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ── Per-recruiter accordion card ──────────────────────────────────────────────
function RecruiterCard({ recruiter, color, timelineLabels }) {
  const { recruiter_name, recruiter_email, total, total_jds,
          selected, rejected, in_progress, status_counts,
          jd_breakdown, timeline } = recruiter;

  const maxSC    = Math.max(...Object.values(status_counts || {}), 1);
  const selPct   = fmtPct(selected, total);
  const rejPct   = fmtPct(rejected, total);

  // Chart data for this recruiter's timeline
  const chartData = {
    labels: timelineLabels.map(d => {
      const dt = new Date(d);
      return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }),
    datasets: [{
      label: "Candidates added",
      data: timeline || [],
      borderColor: color,
      backgroundColor: `${color}22`,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: color,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y} candidate${ctx.parsed.y !== 1 ? "s" : ""} added`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, maxRotation: 45,
          autoSkip: true, maxTicksLimit: 12 },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f9" },
        ticks: { font: { size: 10 }, stepSize: 1,
          callback: v => Number.isInteger(v) ? v : "" },
      },
    },
  };

  return (
    <Accordion elevation={0}
      sx={{ mb: 2, borderRadius: "16px !important",
        border: "1px solid #e2e8f0", "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMore />}
        sx={{ px: 2.5, py: 1.5, borderRadius: "16px",
          "&.Mui-expanded": { borderRadius: "16px 16px 0 0" } }}>
        <Box display="flex" alignItems="center" gap={2} flex={1} flexWrap="wrap" pr={1}>
          {/* Avatar */}
          <Avatar sx={{ width: 40, height: 40, fontWeight: 800, fontSize: 14,
            bgcolor: color, flexShrink: 0 }}>
            {nameInitials(recruiter_name)}
          </Avatar>

          {/* Name + email */}
          <Box flex={1} minWidth={120}>
            <Typography fontWeight={700} fontSize={14} color="#0f172a">{recruiter_name}</Typography>
            <Typography fontSize={11} color="#94a3b8">{recruiter_email}</Typography>
          </Box>

          {/* Summary pills */}
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <StatPill label="Total"   val={total}       color={color}    bg={`${color}10`} />
            <StatPill label="JDs"     val={total_jds}   color="#0369a1"  bg="#eff6ff" />
            <StatPill label="Selected" val={`${selected} (${selPct})`} color="#15803d" bg="#f0fdf4" />
            <StatPill label="Rejected" val={`${rejected} (${rejPct})`} color="#dc2626" bg="#fef2f2" />
            <StatPill label="Active"  val={in_progress} color="#c2410c"  bg="#fff7ed" />
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <Grid container sx={{ borderTop: "1px solid #f1f5f9" }}>

          {/* LEFT — status breakdown + pipeline mini bars */}
          <Grid item xs={12} md={4} sx={{
            borderRight: { md: "1px solid #f1f5f9" },
            borderBottom: { xs: "1px solid #f1f5f9", md: "none" },
          }}>
            <Box p={2.5}>
              <Typography fontSize={11} fontWeight={700} color="#94a3b8"
                textTransform="uppercase" letterSpacing="0.06em" mb={1.5}>
                Pipeline status
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {Object.entries(status_counts || {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => {
                    const meta = sm(status);
                    return (
                      <Box key={status} display="flex" alignItems="center" gap={1.2}>
                        <FiberManualRecord sx={{ fontSize: 7, color: meta.color, flexShrink: 0 }} />
                        <Typography fontSize={11} color="#475569"
                          sx={{ width: 120, flexShrink: 0 }} noWrap>{meta.label}</Typography>
                        <Box flex={1}>
                          <LinearProgress variant="determinate"
                            value={(count / maxSC) * 100}
                            sx={{ height: 5, borderRadius: 4,
                              bgcolor: `${meta.color}15`,
                              "& .MuiLinearProgress-bar": { bgcolor: meta.color, borderRadius: 4 } }} />
                        </Box>
                        <Typography fontWeight={700} fontSize={11} color="#0f172a"
                          sx={{ width: 18, textAlign: "right", flexShrink: 0 }}>
                          {count}
                        </Typography>
                      </Box>
                    );
                  })}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Rate summary */}
              <Box display="flex" gap={1} justifyContent="space-between">
                {[
                  { label: "Selection rate", val: selPct, color: "#15803d", bg: "#f0fdf4" },
                  { label: "Rejection rate", val: rejPct, color: "#dc2626", bg: "#fef2f2" },
                  { label: "Active",         val: `${in_progress}`, color: "#c2410c", bg: "#fff7ed" },
                ].map(s => (
                  <Box key={s.label} flex={1} textAlign="center" sx={{
                    p: 1, borderRadius: "8px", bgcolor: s.bg }}>
                    <Typography fontWeight={800} fontSize="1rem" color={s.color}>{s.val}</Typography>
                    <Typography fontSize={9} color={s.color} fontWeight={600}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* MIDDLE — activity line chart */}
          <Grid item xs={12} md={4} sx={{
            borderRight: { md: "1px solid #f1f5f9" },
            borderBottom: { xs: "1px solid #f1f5f9", md: "none" },
          }}>
            <Box p={2.5}>
              <Typography fontSize={11} fontWeight={700} color="#94a3b8"
                textTransform="uppercase" letterSpacing="0.06em" mb={1.5}>
                Candidate intake (selected period)
              </Typography>
              {timelineLabels.length > 0 && (timeline || []).some(v => v > 0) ? (
                <Box sx={{ height: 180 }}>
                  <Line data={chartData} options={chartOptions} />
                </Box>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center"
                  sx={{ height: 180, bgcolor: "#f8fafc", borderRadius: "8px" }}>
                  <Typography fontSize={12} color="#94a3b8">
                    No intake in this period
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {/* RIGHT — JD top 3 quick stats */}
          <Grid item xs={12} md={4}>
            <Box p={2.5}>
              <Typography fontSize={11} fontWeight={700} color="#94a3b8"
                textTransform="uppercase" letterSpacing="0.06em" mb={1.5}>
                Top JDs by volume
              </Typography>
              {(jd_breakdown || []).slice(0, 4).map((jd, i) => (
                <Box key={jd.jdID} display="flex" alignItems="center" gap={1.5} mb={1.2}>
                  <Box sx={{ width: 22, height: 22, borderRadius: "6px",
                    bgcolor: `${PALETTE[i % PALETTE.length]}15`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0 }}>
                    <Typography fontSize={10} fontWeight={800}
                      color={PALETTE[i % PALETTE.length]}>{i + 1}</Typography>
                  </Box>
                  <Box flex={1} minWidth={0}>
                    <Typography fontWeight={600} fontSize={11} color="#0f172a" noWrap>
                      {jd.jobRole || jd.jdID}
                    </Typography>
                    <Box display="flex" gap={0.8}>
                      <Typography fontSize={10} color="#64748b">{jd.total} total</Typography>
                      <Typography fontSize={10} color="#15803d">· {jd.selected} sel</Typography>
                      <Typography fontSize={10} color="#dc2626">· {jd.rejected} rej</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ width: 36, textAlign: "right" }}>
                    <Typography fontSize={10} color="#0369a1" fontWeight={700}>
                      {fmtPct(jd.selected, jd.total)}
                    </Typography>
                    <Typography fontSize={9} color="#94a3b8">sel rate</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* JD DRILL-DOWN TABLE */}
        <Box sx={{ borderTop: "1px solid #f1f5f9" }}>
          <Box px={2.5} pt={2} pb={1}>
            <Typography fontSize={12} fontWeight={700} color="#0f172a">
              All JDs — click to expand status breakdown
            </Typography>
          </Box>
          <Paper variant="outlined"
            sx={{ mx: 0, borderRadius: 0, border: "none",
              borderTop: "1px solid #f1f5f9", overflow: "auto" }}>
            <Table size="small" sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  {["JD / Role", "Candidates", "Selected", "Rejected", "In Progress", ""].map(h => (
                    <TableCell key={h} align={h === "JD / Role" ? "left" : "center"}
                      sx={{ fontWeight: 700, fontSize: 10, color: "#94a3b8",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        py: 1, pl: h === "JD / Role" ? 3 : 1 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(jd_breakdown || []).map(jd => (
                  <JdRow key={jd.jdID} jd={jd} />
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function RbotManagerDashboard() {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [period,    setPeriod]    = useState("month");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const load = useCallback(async (p = period, df = dateFrom, dt = dateTo) => {
    setLoading(true); setError("");
    try {
      let url = `${BASE}/rbot-dashboard/manager?period=${p}`;
      if (p === "custom" && df) url += `&date_from=${df}&date_to=${dt || new Date().toISOString().split("T")[0]}`;
      const res  = await fetch(url, { headers: getHeaders() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setData(json);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [period, dateFrom, dateTo]);

  useEffect(() => { load(); }, []);

  const handlePeriod = (p) => {
    setPeriod(p);
    setShowCustom(p === "custom");
    if (p !== "custom") load(p, "", "");
  };

  const handleCustomApply = () => load("custom", dateFrom, dateTo);

  const kpis              = data?.kpis               || {};
  const teamStatusCounts  = data?.team_status_counts || {};
  const recruiterBreakdown= data?.recruiter_breakdown|| [];
  const timelineLabels    = data?.timeline_labels    || [];
  const maxSC             = Math.max(...Object.values(teamStatusCounts), 1);

  // ── Team-wide bar chart data ──────────────────────────────────────────────
  const teamChartEntries = Object.entries(teamStatusCounts).sort((a, b) => b[1] - a[1]);
  const teamChartData = {
    labels: teamChartEntries.map(([s]) => sm(s).label),
    datasets: [{
      label: "Candidates",
      data: teamChartEntries.map(([, v]) => v),
      backgroundColor: teamChartEntries.map(([s]) => sm(s).color + "cc"),
      borderColor: teamChartEntries.map(([s]) => sm(s).color),
      borderWidth: 1,
      borderRadius: 4,
    }],
  };
  const teamChartOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} candidates` } },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: "#f1f5f9" },
           ticks: { font: { size: 10 }, stepSize: 1,
             callback: v => Number.isInteger(v) ? v : "" } },
      y: { grid: { display: false }, ticks: { font: { size: 10 } } },
    },
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" flexDirection="column" gap={2}>
      <CircularProgress size={36} sx={{ color: "#1d4ed8" }} />
      <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>Loading team analytics…</Typography>
    </Box>
  );

  return (
    <Box display="flex" flexDirection="column" gap={2.5} pb={4}>
      {error && <Alert severity="error" onClose={() => setError("")}
        sx={{ borderRadius: "12px" }}>{error}</Alert>}

      {/* ── Hero ── */}
      <Card elevation={0} sx={{
        borderRadius: "20px",
        background: "linear-gradient(135deg, #0f172a 0%, #312e81 55%, #4f46e5 100%)",
        overflow: "hidden", position: "relative",
      }}>
        <Box sx={{ position: "absolute", top: -40, right: -40,
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(255,255,255,0.03)" }} />
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12, mb: 0.4 }}>
                Team overview · ResourcingBot
              </Typography>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.4rem", lineHeight: 1.25 }}>
                Recruiter Analytics Dashboard
              </Typography>
              <Box display="flex" gap={1} mt={1.2} flexWrap="wrap">
                {[
                  `${kpis.total_recruiters ?? 0} recruiters`,
                  `${kpis.total ?? 0} total candidates`,
                  `${kpis.selected ?? 0} selected`,
                  `${kpis.ranged_total ?? 0} in period`,
                ].map(l => (
                  <Chip key={l} label={l} size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#fff",
                      fontWeight: 600, fontSize: 11,
                      border: "1px solid rgba(255,255,255,0.15)" }} />
                ))}
              </Box>
            </Box>

            {/* Period selector */}
            <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
              <ButtonGroup size="small" variant="outlined"
                sx={{ "& .MuiButton-root": {
                  borderColor: "rgba(255,255,255,0.25)", color: "#fff",
                  fontSize: 11, fontWeight: 600, textTransform: "none",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.4)" },
                  "&.active-period": {
                    bgcolor: "rgba(255,255,255,0.15)",
                    borderColor: "#fff",
                  },
                }}}>
                {PERIODS.map(p => (
                  <Button key={p.key}
                    className={period === p.key ? "active-period" : ""}
                    onClick={() => handlePeriod(p.key)}>
                    {p.label}
                  </Button>
                ))}
              </ButtonGroup>

              {showCustom && (
                <Box display="flex" gap={1} alignItems="center">
                  <TextField size="small" type="date" value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    sx={{ "& .MuiInputBase-root": { bgcolor: "rgba(255,255,255,0.1)",
                      color: "#fff", fontSize: 11 },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } }} />
                  <Typography color="rgba(255,255,255,0.6)" fontSize={11}>to</Typography>
                  <TextField size="small" type="date" value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    sx={{ "& .MuiInputBase-root": { bgcolor: "rgba(255,255,255,0.1)",
                      color: "#fff", fontSize: 11 },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" } }} />
                  <Button size="small" variant="contained"
                    onClick={handleCustomApply}
                    sx={{ bgcolor: "#fff", color: "#0f172a", fontWeight: 700,
                      fontSize: 11, textTransform: "none",
                      "&:hover": { bgcolor: "#f1f5f9" } }}>
                    Apply
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── Team KPIs ── */}
      <Grid container spacing={2}>
        {[
          { title: "Total Candidates", value: kpis.total,            icon: <People />,      accent: "#1d4ed8" },
          { title: "In Period",        value: kpis.ranged_total,     icon: <TrendingUp />,  accent: "#7c3aed",
            sub: `${PERIODS.find(p => p.key === period)?.label ?? ""} window` },
          { title: "Selected",         value: kpis.selected,         icon: <CheckCircle />, accent: "#15803d",
            sub: fmtPct(kpis.selected, kpis.total) + " rate" },
          { title: "Rejected",         value: kpis.rejected,         icon: <Cancel />,      accent: "#dc2626",
            sub: fmtPct(kpis.rejected, kpis.total) + " rate" },
          { title: "Recruiters",       value: kpis.total_recruiters, icon: <Groups />,      accent: "#0d9488" },
        ].map(c => (
          <Grid item xs={6} sm={4} md={12 / 5} key={c.title}>
            <KpiCard {...c} />
          </Grid>
        ))}
      </Grid>

      {/* ── Team status chart + recruiter comparison ── */}
      <Grid container spacing={2.5}>

        {/* Team-wide horizontal bar chart */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography fontWeight={700} fontSize={13} color="#0f172a" mb={0.5}>
                Team-wide Pipeline
              </Typography>
              <Typography fontSize={11} color="#94a3b8" mb={2}>
                All candidates across all recruiters
              </Typography>
              <Box sx={{ height: Math.max(teamChartEntries.length * 32 + 40, 200) }}>
                <Bar data={teamChartData} options={teamChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recruiter comparison summary table */}
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography fontWeight={700} fontSize={13} color="#0f172a" mb={0.5}>
                Recruiter Comparison
              </Typography>
              <Typography fontSize={11} color="#94a3b8" mb={2}>
                All-time totals · click a row to expand full details below
              </Typography>
              <Paper variant="outlined"
                sx={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #f1f5f9" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                      {["Recruiter", "JDs", "Total", "Selected", "Rej", "Rate", "Pipeline"].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 10, color: "#94a3b8",
                          textTransform: "uppercase", letterSpacing: "0.05em", py: 1.2 }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recruiterBreakdown.map((r, i) => {
                      const color = PALETTE[i % PALETTE.length];
                      const total = r.total || 1;
                      return (
                        <TableRow key={r.recruiter_id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 26, height: 26, fontSize: 10,
                                fontWeight: 800, bgcolor: color }}>
                                {nameInitials(r.recruiter_name)}
                              </Avatar>
                              <Box>
                                <Typography fontWeight={600} fontSize={12}>{r.recruiter_name}</Typography>
                                <Typography fontSize={10} color="#94a3b8">{r.recruiter_email}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={r.total_jds} size="small"
                              sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#eff6ff", color: "#0369a1" }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>{r.total}</TableCell>
                          <TableCell>
                            <Chip label={r.selected} size="small" color="success"
                              sx={{ fontWeight: 700, fontSize: 10 }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={r.rejected} size="small" color="error"
                              sx={{ fontWeight: 700, fontSize: 10 }} />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography fontWeight={800} fontSize={12} color="#15803d">
                                {fmtPct(r.selected, total)}
                              </Typography>
                              <LinearProgress variant="determinate"
                                value={Math.min((r.selected / total) * 100, 100)}
                                sx={{ height: 3, borderRadius: 4, mt: 0.3,
                                  bgcolor: "#dcfce7",
                                  "& .MuiLinearProgress-bar": { bgcolor: "#15803d" } }} />
                            </Box>
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            <Box display="flex" flexWrap="wrap" gap={0.4}>
                              {Object.entries(r.status_counts || {})
                                .sort((a, b) => b[1] - a[1]).slice(0, 3)
                                .map(([s, c]) => (
                                  <Chip key={s} label={`${sm(s).label}: ${c}`} size="small"
                                    sx={{ fontSize: 9, fontWeight: 600, height: 17,
                                      bgcolor: sm(s).bg, color: sm(s).color }} />
                                ))}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Per-recruiter full accordion ── */}
      <Box>
        <Box mb={1.5}>
          <Typography fontWeight={800} fontSize={16} color="#0f172a">
            Per-Recruiter Deep Dive
          </Typography>
          <Typography fontSize={12} color="#94a3b8">
            Expand each recruiter to see their JD breakdown, pipeline status, and activity chart
          </Typography>
        </Box>

        {recruiterBreakdown.length === 0 ? (
          <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <Typography color="text.secondary">No recruiter data found</Typography>
            </Box>
          </Card>
        ) : recruiterBreakdown.map((r, i) => (
          <RecruiterCard
            key={r.recruiter_id}
            recruiter={r}
            color={PALETTE[i % PALETTE.length]}
            timelineLabels={timelineLabels}
          />
        ))}
      </Box>
    </Box>
  );
}