
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Alert, LinearProgress, Table, TableHead, TableBody, TableRow,
  TableCell, Paper, Avatar, Accordion, AccordionSummary,
  AccordionDetails, Divider, Button, TextField,
  Collapse, IconButton, Tooltip,
} from "@mui/material";
import {
  People, CheckCircle, Cancel, Groups, ExpandMore,
  Work, Business, FiberManualRecord,
  KeyboardArrowDown, KeyboardArrowUp,
  Timeline, Refresh,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip as ChartTooltip, Legend, Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, ChartTooltip, Legend, Filler
);

//  CONSTANTS & CONFIG
const BASE       = process.env.REACT_APP_API_BASE_URL;
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const PALETTE = [
  "#2563eb", "#0891b2", "#7c3aed", "#d97706",
  "#dc2626", "#059669", "#db2777", "#65a30d",
];

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

const sm = (s) =>
  STATUS_META[s] || { bg: "#f8fafc", color: "#64748b", label: s?.replace(/_/g, " ") || "Unknown" };

const PERIODS = [
  { key: "week",    label: "7 days"  },
  { key: "month",   label: "30 days" },
  { key: "quarter", label: "90 days" },
  { key: "year",    label: "1 year"  },
  { key: "custom",  label: "Custom"  },
];

//  UTILITY HELPERS
const fmtPct = (n, d) => (d > 0 ? `${((n / d) * 100).toFixed(0)}%` : "0%");

const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const sortedStatusEntries = (counts = {}) => {
  const ordered = STATUS_ORDER.filter((s) => s in counts).map((s) => [s, counts[s]]);
  const rest = Object.entries(counts).filter(([s]) => !STATUS_ORDER.includes(s));
  return [...ordered, ...rest];
};

//  FILTER OUT "OTHER" — applied once at the top, used everywhere
const isRealRecruiter = (r) =>
  r.recruiter_id !== "Other" && r.recruiter_name !== "Other";

//  SMALL REUSABLE COMPONENTS
const KpiCard = ({ title, value, icon, accent, sub }) => (
  <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid #e2e8f0", height: "100%", overflow: "hidden" }}>
    <Box sx={{ height: 3, bgcolor: accent }} />
    <CardContent sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {React.cloneElement(icon, { sx: { color: accent, fontSize: 19 } })}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</Typography>
        <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>{value ?? 0}</Typography>
        {sub && <Typography sx={{ fontSize: 10, color: "#94a3b8", mt: 0.2 }}>{sub}</Typography>}
      </Box>
    </CardContent>
  </Card>
);

const StatPill = ({ label, val, color, bg }) => (
  <Box sx={{ px: 1.5, py: 0.8, borderRadius: "8px", bgcolor: bg, border: `1px solid ${color}22`, textAlign: "center", minWidth: 68 }}>
    <Typography fontWeight={800} fontSize="0.95rem" color={color}>{val}</Typography>
    <Typography fontSize={9} color={color} fontWeight={600} sx={{ whiteSpace: "nowrap" }}>{label}</Typography>
  </Box>
);

//  Used in: RecruiterCard pipeline panel + JD / JdOverall status breakdowns
const StatusRow = ({ status, count }) => {
  const meta = sm(status);
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      gap={1.5}
      sx={{
        px: 1.2,
        py: 0.55,
        borderRadius: "7px",
        bgcolor: meta.bg,
        border: `1px solid ${meta.color}18`,
        minWidth: 160,
        maxWidth: 260,
      }}
    >
      <Box display="flex" alignItems="center" gap={0.7} flex={1} minWidth={0}>
        <FiberManualRecord sx={{ fontSize: 6, color: meta.color, flexShrink: 0 }} />
        <Typography fontSize={11} fontWeight={600} color={meta.color} noWrap>
          {meta.label}
        </Typography>
      </Box>
      <Typography fontSize={12} fontWeight={800} color={meta.color} sx={{ flexShrink: 0 }}>
        {count}
      </Typography>
    </Box>
  );
};

//  STATUS ROW WITH RECRUITER BREAKDOWN
//  Same pill style as StatusRow; below it an inline list of recruiter splits.
//  `recruiterCounts` = [{ name, color, count }]
const StatusRowWithRecruiters = ({ status, count, recruiterCounts = [] }) => {
  const meta     = sm(status);
  const nonZero  = recruiterCounts.filter((r) => r.count > 0);
  const multiRec = nonZero.length > 1;

  return (
    <Box display="inline-flex" flexDirection="column" sx={{ minWidth: 160, maxWidth: 260 }}>
      {/* Main pill row */}
      <Box
        display="flex"
        alignItems="center"
        gap={1.5}
        sx={{
          px: 1.2,
          py: 0.55,
          borderRadius: multiRec ? "7px 7px 0 0" : "7px",
          bgcolor: meta.bg,
          border: `1px solid ${meta.color}18`,
          borderBottom: multiRec ? "none" : undefined,
        }}
      >
        <Box display="flex" alignItems="center" gap={0.7} flex={1} minWidth={0}>
          <FiberManualRecord sx={{ fontSize: 6, color: meta.color, flexShrink: 0 }} />
          <Typography fontSize={11} fontWeight={600} color={meta.color} noWrap>
            {meta.label}
          </Typography>
        </Box>
        <Typography fontSize={12} fontWeight={800} color={meta.color} sx={{ flexShrink: 0 }}>
          {count}
        </Typography>
      </Box>

      {/* Per-recruiter mini splits — only when 2+ recruiters */}
      {multiRec && (
        <Box
          display="flex"
          flexWrap="wrap"
          gap={0.4}
          sx={{
            px: 1.2,
            py: 0.5,
            bgcolor: `${meta.color}06`,
            border: `1px solid ${meta.color}18`,
            borderTop: "none",
            borderRadius: "0 0 7px 7px",
          }}
        >
          {nonZero.map((r) => (
            <Tooltip key={r.name} title={`${r.name}: ${r.count}`} placement="top" arrow>
              <Box
                display="flex"
                alignItems="center"
                gap={0.4}
                sx={{
                  px: 0.8,
                  py: 0.2,
                  borderRadius: "5px",
                  bgcolor: `${r.color}14`,
                  border: `1px solid ${r.color}30`,
                  cursor: "default",
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: r.color, flexShrink: 0 }} />
                <Typography fontSize={9} fontWeight={700} color={r.color} noWrap>
                  {r.name.split(" ")[0]}: {r.count}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Box>
      )}
    </Box>
  );
};

//  BUILD per-status recruiter breakdown for a given jdID
function buildStatusRecruiterMap(jdID, recruiterBreakdown) {
  const map = {};
  recruiterBreakdown.filter(isRealRecruiter).forEach((r, ri) => {
    const jdEntry = (r.jd_breakdown || []).find((j) => j.jdID === jdID);
    if (!jdEntry) return;
    const color = PALETTE[ri % PALETTE.length];
    Object.entries(jdEntry.status_counts || {}).forEach(([status, count]) => {
      if (!map[status]) map[status] = [];
      map[status].push({ name: r.recruiter_name, color, count });
    });
  });
  return map;
}

//  JD ROW — expandable inside recruiter JD drill-down table
function JdRow({ jd, periodLabel, recruiterBreakdown }) {
  const [open, setOpen] = useState(false);
  const entries = sortedStatusEntries(jd.status_counts || {});

  const statusRecruiterMap = recruiterBreakdown
    ? buildStatusRecruiterMap(jd.jdID, recruiterBreakdown)
    : {};

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: "pointer", bgcolor: open ? "#f8fafc" : "inherit" }}
        onClick={() => setOpen((o) => !o)}
      >
        <TableCell sx={{ pl: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 26, height: 26, borderRadius: "6px", bgcolor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Work sx={{ color: "#2563eb", fontSize: 13 }} />
            </Box>
            <Box>
              <Typography fontWeight={600} fontSize={12} color="#0f172a">{jd.jobRole || "—"}</Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Business sx={{ fontSize: 9, color: "#94a3b8" }} />
                <Typography fontSize={10} color="#64748b">{jd.companyName}</Typography>
                <Typography fontSize={10} color="#94a3b8">·</Typography>
                <Typography fontSize={10} color="#2563eb" fontWeight={700} fontFamily="monospace">{jd.jdID}</Typography>
              </Box>
            </Box>
          </Box>
        </TableCell>
        <TableCell align="center"><Typography fontWeight={700} fontSize={13}>{jd.total}</Typography></TableCell>
        <TableCell align="center">
          <Chip label={jd.ranged_total ?? 0} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#eff6ff", color: "#2563eb" }} />
        </TableCell>
        <TableCell align="center">
          <Chip label={`${jd.selected} · ${fmtPct(jd.selected, jd.total)}`} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#f0fdf4", color: "#15803d" }} />
        </TableCell>
        <TableCell align="center">
          <Chip label={`${jd.rejected} · ${fmtPct(jd.rejected, jd.total)}`} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#fef2f2", color: "#dc2626" }} />
        </TableCell>
        <TableCell align="center">
          <Chip label={jd.total - jd.selected - jd.rejected} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#fff7ed", color: "#c2410c" }} />
        </TableCell>
        <TableCell align="right" sx={{ pr: 2 }}>
          <IconButton size="small">{open ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}</IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
              <Typography fontSize={10} fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.06em" mb={1.5}>
                Status breakdown — {jd.jobRole || jd.jdID}
              </Typography>
              {/* Recruiter colour legend (only when multiple contributed) */}
              {recruiterBreakdown && recruiterBreakdown.filter(isRealRecruiter).length > 1 && (
                <Box display="flex" flexWrap="wrap" gap={0.8} mb={1.5}>
                  {recruiterBreakdown.filter(isRealRecruiter).map((r, ri) => {
                    const contributed = (r.jd_breakdown || []).some((j) => j.jdID === jd.jdID && j.total > 0);
                    if (!contributed) return null;
                    return (
                      <Box key={r.recruiter_id} display="flex" alignItems="center" gap={0.5}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: PALETTE[ri % PALETTE.length] }} />
                        <Typography fontSize={10} color="#64748b">{r.recruiter_name}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
              <Box display="flex" flexDirection="column" gap={0.8}>
                {entries.map(([status, count]) => (
                  <StatusRowWithRecruiters
                    key={status}
                    status={status}
                    count={count}
                    recruiterCounts={statusRecruiterMap[status] || []}
                  />
                ))}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

//  RECRUITER CARD
function RecruiterCard({ recruiter, color, timelineLabels, periodLabel, allRecruiterBreakdown }) {
  const {
    recruiter_name, recruiter_email, total, total_jds,
    selected, rejected, in_progress, status_counts,
    jd_breakdown, timeline,
  } = recruiter;

  const entries = sortedStatusEntries(status_counts || {});
  const selPct  = fmtPct(selected, total);
  const rejPct  = fmtPct(rejected, total);

  const chartData = {
    labels: timelineLabels.map((d) => {
      const dt = new Date(d);
      return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }),
    datasets: [{
      label: "Candidates added",
      data: timeline || [],
      borderColor: color,
      backgroundColor: `${color}20`,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: color,
      pointBorderColor: "#fff",
      pointBorderWidth: 1.5,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} candidate${ctx.parsed.y !== 1 ? "s" : ""} added` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 10 } },
      y: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { font: { size: 10 }, stepSize: 1, callback: (v) => (Number.isInteger(v) ? v : "") } },
    },
  };

  return (
    <Accordion
      elevation={0}
      sx={{ mb: 2, borderRadius: "16px !important", border: "1px solid #e2e8f0", "&:before": { display: "none" }, "&.Mui-expanded": { margin: "0 0 16px 0" } }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{ px: 2.5, py: 1.5, borderRadius: "16px", "&.Mui-expanded": { borderRadius: "16px 16px 0 0", borderBottom: "1px solid #f1f5f9" } }}
      >
        <Box display="flex" alignItems="center" gap={2} flex={1} flexWrap="wrap" pr={1}>
          <Avatar sx={{ width: 42, height: 42, fontWeight: 800, fontSize: 14, bgcolor: color, flexShrink: 0 }}>
            {nameInitials(recruiter_name)}
          </Avatar>
          <Box flex={1} minWidth={130}>
            <Typography fontWeight={700} fontSize={14} color="#0f172a">{recruiter_name}</Typography>
            <Typography fontSize={11} color="#94a3b8">{recruiter_email}</Typography>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <StatPill label="Candidates" val={total}                         color={color}   bg={`${color}10`} />
            <StatPill label="JDs"        val={total_jds}                     color="#0369a1" bg="#eff6ff"      />
            <StatPill label="Selected"   val={`${selected} (${selPct})`}     color="#15803d" bg="#f0fdf4"      />
            <StatPill label="Rejected"   val={`${rejected} (${rejPct})`}     color="#dc2626" bg="#fef2f2"      />
            <StatPill label="Active"     val={in_progress}                   color="#c2410c" bg="#fff7ed"      />
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <Grid container>
          {/* ── Pipeline status list (no bars — just numbers) ── */}
          <Grid item xs={12} md={4} sx={{ borderRight: { md: "1px solid #f1f5f9" }, borderBottom: { xs: "1px solid #f1f5f9", md: "none" } }}>
            <Box p={2.5}>
              <Typography fontSize={10} fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.06em" mb={1.5}>
                Pipeline · All Time
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.8}>
                {entries.map(([status, count]) => (
                  <StatusRow key={status} status={status} count={count} />
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" gap={1} justifyContent="space-between">
                {[
                  { label: "Sel rate", val: selPct,           color: "#15803d", bg: "#f0fdf4" },
                  { label: "Rej rate", val: rejPct,           color: "#dc2626", bg: "#fef2f2" },
                  { label: "Active",   val: `${in_progress}`, color: "#c2410c", bg: "#fff7ed" },
                ].map((s) => (
                  <Box key={s.label} flex={1} textAlign="center" sx={{ p: 1, borderRadius: "8px", bgcolor: s.bg }}>
                    <Typography fontWeight={800} fontSize="0.95rem" color={s.color}>{s.val}</Typography>
                    <Typography fontSize={9} color={s.color} fontWeight={600}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* ── Intake timeline chart ── */}
          <Grid item xs={12} md={8}>
            <Box p={2.5}>
              <Typography fontSize={10} fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.06em" mb={1.5}>
                Intake · {periodLabel}
              </Typography>
              {timelineLabels.length > 0 && (timeline || []).some((v) => v > 0) ? (
                <Box sx={{ height: 190 }}><Line data={chartData} options={chartOptions} /></Box>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 190, bgcolor: "#f8fafc", borderRadius: "10px" }}>
                  <Typography fontSize={12} color="#94a3b8">No intake in this period</Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* All JDs drill-down table */}
        <Box sx={{ borderTop: "1px solid #f1f5f9" }}>
          <Box px={2.5} pt={2} pb={1} display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography fontSize={12} fontWeight={700} color="#0f172a">All JDs — click to expand status breakdown</Typography>
              <Typography fontSize={10} color="#94a3b8" mt={0.2}>"In Period" reflects the selected time window · splits shown where JDs are shared across recruiters</Typography>
            </Box>
            <Chip label={`${(jd_breakdown || []).length} JDs`} size="small" sx={{ fontWeight: 700, bgcolor: "#eff6ff", color: "#0369a1" }} />
          </Box>
          <Paper variant="outlined" sx={{ mx: 0, borderRadius: 0, border: "none", borderTop: "1px solid #f1f5f9", overflow: "auto" }}>
            <Table size="small" sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  {["JD / Role", "Candidates", "In Period", "Selected", "Rejected", "Active", ""].map((h) => (
                    <TableCell key={h} align={h === "JD / Role" ? "left" : "center"}
                      sx={{ fontWeight: 700, fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", py: 1, pl: h === "JD / Role" ? 3 : 1 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(jd_breakdown || []).map((jd) => (
                  <JdRow
                    key={jd.jdID}
                    jd={jd}
                    periodLabel={periodLabel}
                    recruiterBreakdown={allRecruiterBreakdown}
                  />
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

//  JD OVERALL SECTION
function JdOverallSection({ jdOverall, recruiterBreakdown, periodLabel }) {
  const [expandedJd, setExpandedJd] = useState(null);
  const [expandedRecruiterJd, setExpandedRecruiterJd] = useState(null);
  const [sectionOpen, setSectionOpen] = useState(false);
  if (!jdOverall.length) return null;

  const realRecruiters = recruiterBreakdown.filter(isRealRecruiter);

  return (
    <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <CardContent sx={{ p: 2.5, pb: sectionOpen ? 2.5 : "20px !important" }}>
        <Box
          display="flex" alignItems="center" justifyContent="space-between"
          flexWrap="wrap" gap={1}
          sx={{ cursor: "pointer", userSelect: "none" }}
          onClick={() => setSectionOpen((o) => !o)}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: sectionOpen ? "#eff6ff" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
              <IconButton size="small" sx={{ p: 0, color: sectionOpen ? "#2563eb" : "#64748b" }}>
                {sectionOpen ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
              </IconButton>
            </Box>
            <Box>
              <Typography fontWeight={700} fontSize={14} color="#0f172a">JD-wise Candidate Breakdown</Typography>
              <Typography fontSize={11} color="#94a3b8" mt={0.3}>
                All JDs across all recruiters · expand to see status counts and recruiter splits
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip label={`${jdOverall.length} JDs`} size="small" sx={{ fontWeight: 700, bgcolor: "#eff6ff", color: "#0369a1" }} />
            <Chip label={sectionOpen ? "Collapse" : "Expand"} size="small" sx={{ fontWeight: 700, fontSize: 10, cursor: "pointer", bgcolor: sectionOpen ? "#f1f5f9" : "#0f172a", color: sectionOpen ? "#475569" : "#fff" }} />
          </Box>
        </Box>

        <Collapse in={sectionOpen} timeout="auto" unmountOnExit>
          <Box mt={2}>
            <Paper variant="outlined" sx={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #f1f5f9" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    {["", "JD / Role", "Company", "Recruiters", "Candidates", "In Period", "Selected", "Rejected", "Sel Rate"].map((h) => (
                      <TableCell key={h} align={["", "JD / Role", "Company"].includes(h) ? "left" : "center"}
                        sx={{ fontWeight: 700, fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", py: 1.2 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jdOverall.map((jd) => {
                    const isOpen  = expandedJd === jd.jdID;
                    const entries = sortedStatusEntries(jd.status_counts || {});

                    const perRecruiter = realRecruiters
                      .map((r, ri) => {
                        const jdEntry = (r.jd_breakdown || []).find((j) => j.jdID === jd.jdID);
                        return jdEntry
                          ? { name: r.recruiter_name, color: PALETTE[ri % PALETTE.length], total: jdEntry.total, ranged: jdEntry.ranged_total ?? 0, selected: jdEntry.selected, rejected: jdEntry.rejected }
                          : null;
                      })
                      .filter(Boolean)
                      .sort((a, b) => b.total - a.total);

                    const statusRecruiterMap = buildStatusRecruiterMap(jd.jdID, realRecruiters);

                    return (
                      <React.Fragment key={jd.jdID}>
                        <TableRow hover sx={{ cursor: "pointer", bgcolor: isOpen ? "#f0f9ff" : "inherit" }} onClick={() => setExpandedJd(isOpen ? null : jd.jdID)}>
                          <TableCell sx={{ width: 36, pl: 1.5 }}>
                            <IconButton size="small" sx={{ p: 0.5 }}>
                              {isOpen ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight={600} fontSize={12} color="#0f172a">{jd.jobRole || "—"}</Typography>
                            <Typography fontSize={10} color="#2563eb" fontWeight={700} fontFamily="monospace">{jd.jdID}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography fontSize={11} color="#64748b">{jd.companyName || "—"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {perRecruiter.length === 0 ? (
                                <Typography fontSize={10} color="#94a3b8">—</Typography>
                              ) : perRecruiter.map((r) => (
                                <Tooltip key={r.name} title={`${r.name} · ${r.total} total · ${r.ranged} in period`}>
                                  <Typography sx={{ fontSize: 10, fontWeight: 800, color: r.color, bgcolor: `${r.color}15`, px: 1, py: 0.25, borderRadius: 1, display: "inline-flex", alignItems: "center" }}>
                                    {r.name}
                                  </Typography>
                                </Tooltip>
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell align="center"><Typography fontWeight={800} fontSize={14} color="#0f172a">{jd.total}</Typography></TableCell>
                          <TableCell align="center"><Chip label={jd.ranged_total ?? 0} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#eff6ff", color: "#2563eb" }} /></TableCell>
                          <TableCell align="center"><Chip label={jd.selected} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#f0fdf4", color: "#15803d" }} /></TableCell>
                          <TableCell align="center"><Chip label={jd.rejected} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#fef2f2", color: "#dc2626" }} /></TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={800} fontSize={12} color={jd.selected > 0 ? "#15803d" : "#94a3b8"}>
                              {fmtPct(jd.selected, jd.total)}
                            </Typography>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                              <Box sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>

                                {/* Status counts — simple pill rows, no bars */}
                                <Box p={2.5}>
                                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                                    <Typography fontSize={10} fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.06em">
                                      Status breakdown — {jd.jobRole || jd.jdID}
                                    </Typography>
                                    {perRecruiter.length > 1 && (
                                      <Box display="flex" flexWrap="wrap" gap={0.8}>
                                        {perRecruiter.map((r) => (
                                          <Box key={r.name} display="flex" alignItems="center" gap={0.5}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: r.color }} />
                                            <Typography fontSize={10} color="#64748b">{r.name}</Typography>
                                          </Box>
                                        ))}
                                      </Box>
                                    )}
                                  </Box>
                                  <Box display="flex" flexDirection="column" gap={0.8}>
                                    {entries.map(([status, count]) => (
                                      <StatusRowWithRecruiters
                                        key={status}
                                        status={status}
                                        count={count}
                                        recruiterCounts={statusRecruiterMap[status] || []}
                                      />
                                    ))}
                                  </Box>
                                </Box>

                                {/* Per-recruiter toggle table */}
                                <Box sx={{ borderTop: "1px solid #f1f5f9" }}>
                                  <Box
                                    display="flex" alignItems="center" justifyContent="space-between"
                                    px={2.5} py={1.2}
                                    sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f1f5f9" } }}
                                    onClick={(e) => { e.stopPropagation(); setExpandedRecruiterJd((prev) => (prev === jd.jdID ? null : jd.jdID)); }}
                                  >
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <Groups sx={{ fontSize: 15, color: "#64748b" }} />
                                      <Typography fontSize={12} fontWeight={600} color="#374151">Recruiter breakdown</Typography>
                                      <Chip label={`${perRecruiter.length} recruiter${perRecruiter.length !== 1 ? "s" : ""}`} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#eff6ff", color: "#2563eb", height: 18 }} />
                                    </Box>
                                    <IconButton size="small" sx={{ p: 0.5 }}>
                                      {expandedRecruiterJd === jd.jdID ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                                    </IconButton>
                                  </Box>

                                  <Collapse in={expandedRecruiterJd === jd.jdID} timeout="auto" unmountOnExit>
                                    <Box px={2.5} pb={2.5}>
                                      {perRecruiter.length === 0 ? (
                                        <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 60, bgcolor: "#f1f5f9", borderRadius: "8px" }}>
                                          <Typography fontSize={12} color="#94a3b8">No recruiters assigned</Typography>
                                        </Box>
                                      ) : (
                                        <Paper variant="outlined" sx={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                                          <Table size="small">
                                            <TableHead>
                                              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                                {["Recruiter", "Candidates", "In Period", "Selected", "Rejected", "Sel Rate"].map((h) => (
                                                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 10, color: "#94a3b8", py: 0.8, px: 1.2 }}>{h}</TableCell>
                                                ))}
                                              </TableRow>
                                            </TableHead>
                                            <TableBody>
                                              {perRecruiter.map((r) => (
                                                <TableRow key={r.name} hover>
                                                  <TableCell sx={{ py: 0.8, px: 1.2 }}>
                                                    <Box display="flex" alignItems="center" gap={0.8}>
                                                      <Avatar sx={{ width: 22, height: 22, fontSize: 9, fontWeight: 800, bgcolor: r.color }}>{nameInitials(r.name)}</Avatar>
                                                      <Typography fontSize={11} fontWeight={600} noWrap>{r.name}</Typography>
                                                    </Box>
                                                  </TableCell>
                                                  <TableCell sx={{ py: 0.8, px: 1.2 }}><Typography fontWeight={700} fontSize={12}>{r.total}</Typography></TableCell>
                                                  <TableCell sx={{ py: 0.8, px: 1.2 }}><Chip label={r.ranged} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#eff6ff", color: "#2563eb", height: 18 }} /></TableCell>
                                                  <TableCell sx={{ py: 0.8, px: 1.2 }}><Typography fontSize={11} color="#15803d" fontWeight={700}>{r.selected}</Typography></TableCell>
                                                  <TableCell sx={{ py: 0.8, px: 1.2 }}><Typography fontSize={11} color="#dc2626" fontWeight={700}>{r.rejected}</Typography></TableCell>
                                                  <TableCell sx={{ py: 0.8, px: 1.2 }}><Typography fontSize={11} color="#2563eb" fontWeight={700}>{fmtPct(r.selected, r.total)}</Typography></TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </Paper>
                                      )}
                                    </Box>
                                  </Collapse>
                                </Box>

                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

//  RECRUITER TIMELINE COMPARISON CHART
function RecruiterTimelineChart({ recruiterBreakdown, timelineLabels, periodLabel }) {
  const [chartType, setChartType]     = useState("line");
  const [cumulative, setCumulative]   = useState(false);
  const [hiddenLines, setHiddenLines] = useState({});

  // Always filter out "Other" before rendering chart data
  const realRecruiters = recruiterBreakdown.filter(isRealRecruiter);

  if (!timelineLabels.length || !realRecruiters.length) return null;

  const activeRecruiters = realRecruiters.filter((r) =>
    (r.timeline || []).some((v) => v > 0)
  );
  if (!activeRecruiters.length) return null;

  const formattedLabels = timelineLabels.map((d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  });

  const toCumulative = (arr) =>
    arr.reduce((acc, v, i) => { acc.push((acc[i - 1] || 0) + v); return acc; }, []);

  // Build datasets only from real recruiters; keep index stable for PALETTE
  const datasets = realRecruiters.map((r, i) => {
    const color  = PALETTE[i % PALETTE.length];
    const raw    = r.timeline || timelineLabels.map(() => 0);
    const data   = cumulative ? toCumulative(raw) : raw;
    const hidden = !!hiddenLines[r.recruiter_id];
    return {
      label:                r.recruiter_name,
      data,
      hidden,
      borderColor:          color,
      backgroundColor:      chartType === "bar" ? `${color}bb` : `${color}18`,
      fill:                 chartType === "line",
      tension:              0.4,
      pointRadius:          timelineLabels.length > 30 ? 2 : 4,
      pointHoverRadius:     6,
      pointBackgroundColor: color,
      pointBorderColor:     "#fff",
      pointBorderWidth:     1.5,
      borderWidth:          chartType === "bar" ? 1 : 2,
      borderRadius:         chartType === "bar" ? 3 : 0,
    };
  });

  const chartData = { labels: formattedLabels, datasets };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => items[0]?.label || "",
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} candidate${ctx.parsed.y !== 1 ? "s" : ""}`,
        },
        backgroundColor: "#0f172a",
        titleColor: "#94a3b8",
        bodyColor: "#f1f5f9",
        padding: 10,
        cornerRadius: 8,
      },
      datalabels: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 14 }, stacked: chartType === "bar" },
      y: {
        beginAtZero: true, grid: { color: "#f1f5f9" },
        ticks: { font: { size: 10 }, stepSize: 1, callback: (v) => (Number.isInteger(v) ? v : "") },
        stacked: chartType === "bar",
        title: { display: true, text: cumulative ? "Cumulative candidates" : "Candidates added", font: { size: 10 }, color: "#94a3b8" },
      },
    },
  };

  const recruiterTotals = realRecruiters.map((r) => ({
    ...r,
    periodTotal: (r.timeline || []).reduce((s, v) => s + v, 0),
  })).sort((a, b) => b.periodTotal - a.periodTotal);

  const maxPeriodTotal = Math.max(...recruiterTotals.map((r) => r.periodTotal), 1);

  const toggleLine = (rid) => setHiddenLines((prev) => ({ ...prev, [rid]: !prev[rid] }));

  return (
    <Card elevation={0} sx={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={2.5}>
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={0.4}>
              <Timeline sx={{ color: "#2563eb", fontSize: 16 }} />
              <Typography fontWeight={700} fontSize={14} color="#0f172a">Recruiter Intake Timeline</Typography>
            </Box>
            <Typography fontSize={11} color="#94a3b8">
              Candidates added per day · {periodLabel} · click legend to show/hide recruiters
            </Typography>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <Box display="flex" sx={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              {[{ key: "line", label: "Line" }, { key: "bar", label: "Stacked" }].map(({ key, label }) => (
                <Button key={key} size="small" onClick={() => setChartType(key)}
                  sx={{ fontSize: 11, fontWeight: 600, textTransform: "none", px: 1.5, py: 0.5, borderRadius: 0, minWidth: 0,
                    bgcolor: chartType === key ? "#0f172a" : "transparent", color: chartType === key ? "#fff" : "#64748b",
                    "&:hover": { bgcolor: chartType === key ? "#0f172a" : "#f8fafc" } }}>
                  {label}
                </Button>
              ))}
            </Box>
            <Button size="small" onClick={() => setCumulative((c) => !c)}
              sx={{ fontSize: 11, fontWeight: 600, textTransform: "none", px: 1.5, py: 0.5, borderRadius: "8px", border: "1px solid #e2e8f0",
                bgcolor: cumulative ? "#eff6ff" : "transparent", color: cumulative ? "#2563eb" : "#64748b",
                "&:hover": { bgcolor: "#f8fafc" } }}>
              {cumulative ? "Cumulative ✓" : "Cumulative"}
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={9}>
            <Box sx={{ height: 300 }}>
              {chartType === "line"
                ? <Line data={chartData} options={commonOptions} />
                : <Bar  data={chartData} options={commonOptions} />
              }
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1} mt={1.5}>
              {realRecruiters.map((r, i) => {
                const color  = PALETTE[i % PALETTE.length];
                const hidden = !!hiddenLines[r.recruiter_id];
                return (
                  <Box key={r.recruiter_id} display="flex" alignItems="center" gap={0.6} onClick={() => toggleLine(r.recruiter_id)}
                    sx={{ px: 1.2, py: 0.5, borderRadius: "8px", cursor: "pointer",
                      border: `1px solid ${hidden ? "#e2e8f0" : color + "40"}`,
                      bgcolor: hidden ? "#f8fafc" : `${color}0d`, opacity: hidden ? 0.45 : 1,
                      transition: "all 0.15s", "&:hover": { opacity: 1 } }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: hidden ? "#cbd5e1" : color, flexShrink: 0 }} />
                    <Typography fontSize={11} fontWeight={600} color={hidden ? "#94a3b8" : "#374151"} noWrap>
                      {r.recruiter_name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ bgcolor: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9", p: 1.5, height: "100%" }}>
              <Typography fontSize={10} fontWeight={700} color="#94a3b8" textTransform="uppercase" letterSpacing="0.06em" mb={1.5}>
                In Period · Leaderboard
              </Typography>
              <Box display="flex" flexDirection="column" gap={1.2}>
                {recruiterTotals.map((r, rank) => {
                  const color  = PALETTE[realRecruiters.findIndex((rb) => rb.recruiter_id === r.recruiter_id) % PALETTE.length];
                  const hidden = !!hiddenLines[r.recruiter_id];
                  return (
                    <Box key={r.recruiter_id} onClick={() => toggleLine(r.recruiter_id)} sx={{ cursor: "pointer", opacity: hidden ? 0.4 : 1, transition: "opacity 0.15s" }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.4}>
                        <Box display="flex" alignItems="center" gap={0.8}>
                          <Typography fontSize={10} fontWeight={800} sx={{ width: 16, color: rank === 0 ? "#d97706" : rank === 1 ? "#64748b" : "#94a3b8" }}>
                            #{rank + 1}
                          </Typography>
                          <Avatar sx={{ width: 20, height: 20, fontSize: 8, fontWeight: 800, bgcolor: color }}>{nameInitials(r.recruiter_name)}</Avatar>
                          <Typography fontSize={11} fontWeight={600} color="#374151" noWrap sx={{ maxWidth: 90 }}>
                            {r.recruiter_name.split(" ")[0]}
                          </Typography>
                        </Box>
                        <Typography fontSize={11} fontWeight={800} color={color}>{r.periodTotal}</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={(r.periodTotal / maxPeriodTotal) * 100}
                        sx={{ height: 4, borderRadius: 4, bgcolor: `${color}18`, "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4 } }} />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

//  MAIN COMPONENT
export default function RbotManagerDashboard() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [period,     setPeriod]     = useState("month");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [showCustom, setShowCustom] = useState(false);

  ChartJS.register(ChartDataLabels);

  const load = useCallback(
    async (p = period, df = dateFrom, dt = dateTo) => {
      setLoading(true);
      setError("");
      try {
        let url = `${BASE}/rbot-dashboard/manager?period=${p}`;
        if (p === "custom" && df)
          url += `&date_from=${df}&date_to=${dt || new Date().toISOString().split("T")[0]}`;
        const res  = await fetch(url, { headers: getHeaders() });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setData(json);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [period, dateFrom, dateTo]
  );

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handlePeriod = (p) => {
    setPeriod(p);
    setShowCustom(p === "custom");
    if (p !== "custom") load(p, "", "");
  };

  const kpis             = data?.kpis               || {};
  const teamStatusCounts = data?.team_status_counts || {};
  const timelineLabels   = data?.timeline_labels    || [];
  const jdOverall        = data?.jd_overall         || [];
  const periodLabel      = PERIODS.find((p) => p.key === period)?.label ?? "";

  // ── "Other" filtered out once here; flows into every child via this array ──
  const recruiterBreakdown = (data?.recruiter_breakdown || []).filter(isRealRecruiter);

  const teamChartEntries = sortedStatusEntries(teamStatusCounts);
  const teamChartData = {
    labels: teamChartEntries.map(([s]) => sm(s).label),
    datasets: [{
      label: "Candidates",
      data:  teamChartEntries.map(([, v]) => v),
      backgroundColor: teamChartEntries.map(([s]) => sm(s).color + "cc"),
      borderColor:     teamChartEntries.map(([s]) => sm(s).color),
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
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x} candidates` } },
      datalabels: { anchor: "end", align: "right", color: "#0f172a", font: { weight: "bold", size: 11 }, formatter: (v) => v },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: "#f1f5f9" }, ticks: { font: { size: 10 }, stepSize: 1, callback: (v) => (Number.isInteger(v) ? v : "") } },
      y: { grid: { display: false }, ticks: { font: { size: 10 } } },
    },
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" flexDirection="column" gap={2}>
        <CircularProgress size={36} sx={{ color: "#2563eb" }} />
        <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>Loading team analytics…</Typography>
      </Box>
    );

  return (
    <Box display="flex" flexDirection="column" gap={2.5} pb={4}>

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: "12px" }}>{error}</Alert>
      )}

      {/* Hero header */}
      <Card elevation={0} sx={{ borderRadius: "20px", background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #2563eb 100%)", overflow: "hidden", position: "relative" }}>
        <Box sx={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
        <Box sx={{ position: "absolute", bottom: -30, right: 80, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <CardContent sx={{ p: 3, position: "relative" }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", mb: 0.5 }}>
                ResourcingBot · Team Analytics
              </Typography>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.5rem", lineHeight: 1.2, mb: 1.2 }}>
                Recruiter Analytics Dashboard
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {[
                  { icon: <Groups sx={{ fontSize: 12 }} />, label: `${kpis.total_recruiters ?? 0} recruiters` },
                  { icon: <People sx={{ fontSize: 12 }} />, label: `${kpis.total ?? 0} total candidates` },
                  { icon: <CheckCircle sx={{ fontSize: 12 }} />, label: `${kpis.selected ?? 0} selected` },
                  { icon: <Timeline sx={{ fontSize: 12 }} />, label: `${kpis.ranged_total ?? 0} in ${periodLabel}` },
                ].map(({ icon, label }) => (
                  <Chip
                    key={label}
                    icon={React.cloneElement(icon, { style: { color: "rgba(255,255,255,0.7)" } })}
                    label={label}
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 600, fontSize: 11, border: "1px solid rgba(255,255,255,0.12)", "& .MuiChip-icon": { ml: 0.8 } }}
                  />
                ))}
              </Box>
            </Box>

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
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={() => load()}
                    sx={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", p: 0.7, ml: 0.5, "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Tooltip>
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

      {/* KPI Strip */}
      <Grid container spacing={2}>
        {[
          { title: "Total Candidates", value: kpis.total,             icon: <People />,      accent: "#2563eb" },
          { title: `In ${periodLabel}`, value: kpis.ranged_total,     icon: <Timeline />,    accent: "#7c3aed", sub: "New in selected period" },
          { title: "Selected",          value: kpis.selected,         icon: <CheckCircle />, accent: "#15803d", sub: fmtPct(kpis.selected, kpis.total) + " selection rate" },
          { title: "Rejected",          value: kpis.rejected,         icon: <Cancel />,      accent: "#dc2626", sub: fmtPct(kpis.rejected, kpis.total) + " rejection rate" },
          { title: "Recruiters",        value: kpis.total_recruiters, icon: <Groups />,      accent: "#0891b2" },
        ].map((c) => (
          <Grid item xs={6} sm={4} md={12 / 5} key={c.title}><KpiCard {...c} /></Grid>
        ))}
      </Grid>

      {/* JD Overall Breakdown */}
      <JdOverallSection jdOverall={jdOverall} recruiterBreakdown={recruiterBreakdown} periodLabel={periodLabel} />

      {/* Recruiter Timeline Comparison */}
      <RecruiterTimelineChart
        recruiterBreakdown={recruiterBreakdown}
        timelineLabels={timelineLabels}
        periodLabel={periodLabel}
      />

      {/* Per-recruiter accordion deep dive */}
      <Box>
        <Box mb={1.5}>
          <Typography fontWeight={800} fontSize={16} color="#0f172a">Per-Recruiter Deep Dive</Typography>
          <Typography fontSize={12} color="#94a3b8" mt={0.3}>
            Expand each recruiter for their full JD breakdown, pipeline status, and intake chart
          </Typography>
        </Box>

        {recruiterBreakdown.length === 0 ? (
          <Card elevation={0} sx={{ borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <Typography color="text.secondary" fontSize={13}>No recruiter data found</Typography>
            </Box>
          </Card>
        ) : (
          recruiterBreakdown.map((r, i) => (
            <RecruiterCard
              key={r.recruiter_id}
              recruiter={r}
              color={PALETTE[i % PALETTE.length]}
              timelineLabels={timelineLabels}
              periodLabel={periodLabel}
              allRecruiterBreakdown={recruiterBreakdown}
            />
          ))
        )}
      </Box>
    </Box>
  );
}