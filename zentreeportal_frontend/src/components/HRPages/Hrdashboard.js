

import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip,
  CircularProgress, Divider, LinearProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Tooltip, Alert, TextField, InputAdornment,
} from "@mui/material";
import {
  AssignmentInd, 
  TrendingUp,  ArrowForward, Refresh, Star, Email,
  Search, RocketLaunch, CheckCircle,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { OnboardingDetail } from "./OnboardingPage";
// ── Design tokens ─────────────────────────────────────────────────────────────
const NAVY   = "#0f172a";
const INDIGO = "#1a237e";
const BLUE   = "#1d4ed8";
const SLATE  = "#64748b";

const BASE = process.env.REACT_APP_API_BASE_URL;
const ONBOARDING_BASE = process.env.REACT_APP_API_ONBOARDING_URL;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

const startOnboarding = (candidateId) =>
  fetch(`${ONBOARDING_BASE}/selected-candidates/${candidateId}/start`, {
    method: "POST",
    headers: authHeaders(),
  }).then(handle);

// ── Reusable stat card ───────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, loading }) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        bgcolor: "#fff",
        height: "100%",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(15,23,42,0.08)" },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography sx={{ fontSize: 12, color: SLATE, fontWeight: 500, mb: 0.5 }}>
              {label}
            </Typography>
            {loading ? (
              <CircularProgress size={20} sx={{ color }} />
            ) : (
              <Typography sx={{ fontSize: 28, fontWeight: 800, color: NAVY, lineHeight: 1 }}>
                {value ?? 0}
              </Typography>
            )}
            {sub && <Typography sx={{ fontSize: 11, color: SLATE, mt: 0.5 }}>{sub}</Typography>}
          </Box>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: `${color}18`,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5} flexWrap="wrap" gap={1}>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{title}</Typography>
        {subtitle && <Typography sx={{ fontSize: 12, color: SLATE, mt: 0.25 }}>{subtitle}</Typography>}
      </Box>
      {action && (
        <Typography
          onClick={onAction}
          sx={{ fontSize: 12, color: BLUE, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 0.3,
            "&:hover": { textDecoration: "underline" } }}
        >
          {action} <ArrowForward sx={{ fontSize: 13 }} />
        </Typography>
      )}
    </Box>
  );
}

// ── Onboarding status chip ───────────────────────────────────────────────────
const ONBOARDING_STATUS_COLORS = {
  "Not Started":   { bg: "#fef2f2", color: "#991b1b" },
  "Pending Setup": { bg: "#fff7ed", color: "#c2410c" },
  "Initiated":     { bg: "#fef9c3", color: "#854d0e" },
  "In Progress":   { bg: "#eff6ff", color: BLUE },
  "Completed":     { bg: "#dcfce7", color: "#166534" },
};

function OnboardingStatusChip({ status }) {
  const c = ONBOARDING_STATUS_COLORS[status] || ONBOARDING_STATUS_COLORS["Not Started"];
  return (
    <Chip
      label={status}
      size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: 10, height: 20, borderRadius: "5px" }}
    />
  );
}

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// ════════════════════════════════════════════════════════════════════════════════
export default function HRDashboard() {
  const navigate = useNavigate();

  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");

  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectedKpis, setSelectedKpis] = useState({});

  const [starting,    setStarting]    = useState(null); // candidate _id being processed
  const [detailOpen,  setDetailOpen]  = useState(false);
  const [activeEmp,   setActiveEmp]   = useState(null);

  // ── Fetch selected candidates from ResourcingBot ────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BASE}/onboarding/selected-candidates`, { headers: authHeaders() });
      const data = await handle(res);
      setSelectedCandidates(data.data || []);
      setSelectedKpis(data.kpis || {});
    } catch (err) {
      console.error("HR Dashboard fetch error:", err);
      setError(err?.message || "Failed to load selected candidates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Click handler: start / open onboarding for a candidate ──────────────
  const handleOpenOnboarding = async (candidate) => {
    setStarting(candidate._id);
    try {
      const res = await startOnboarding(candidate._id);
      // employee object returned from backend has _id (string), name, emp_id, etc.
      setActiveEmp(res.employee);
      setDetailOpen(true);
      // Refresh list in background so statuses stay accurate after dialog closes
    } catch (err) {
      setError(err?.message || "Could not start onboarding for this candidate");
    } finally {
      setStarting(null);
    }
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setActiveEmp(null);
    fetchData(); // refresh statuses/order after edits
  };

  // ── Search filter ─────────────────────────────────────────────────────────
  const filtered = selectedCandidates.filter((c) => {
    const q = search.toLowerCase();
    return !q ||
      c.candidatename?.toLowerCase().includes(q) ||
      c.candidateEmail?.toLowerCase().includes(q) ||
      c.jobRole?.toLowerCase().includes(q) ||
      c.companyName?.toLowerCase().includes(q) ||
      c.jdID?.toLowerCase().includes(q);
  });

  const totalSelected = selectedCandidates.length;

  return (
    <Box display="flex" flexDirection="column" gap={3}>

      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: NAVY }}>
            HR Dashboard
          </Typography>
          <Typography sx={{ fontSize: 13, color: SLATE, mt: 0.25 }}>
            Selected candidates · Onboarding pipeline · BGV tracking
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton
            onClick={fetchData}
            size="small"
            sx={{ border: "1px solid #e2e8f0", borderRadius: "8px",
              bgcolor: "#fff", "&:hover": { bgcolor: "#f1f5f9" } }}
          >
            <Refresh fontSize="small" sx={{ color: SLATE }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<Star />}
            label="Total Selected"
            value={totalSelected}
            sub="From ResourcingBot"
            color="#7c3aed"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<AssignmentInd />}
            label="Not Started"
            value={selectedKpis.not_started}
            sub="Onboarding not yet initiated"
            color="#dc2626"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<TrendingUp />}
            label="In Progress"
            value={selectedKpis.in_progress}
            sub="Currently onboarding"
            color={BLUE}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<CheckCircle />}
            label="Completed"
            value={selectedKpis.completed}
            sub="Fully onboarded"
            color="#059669"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Selected Candidates → Onboarding Queue ─────────────────────────── */}
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "14px", bgcolor: "#fff" }}>
        <CardContent sx={{ p: 2.5 }}>
          <SectionHeader
            title="Selected Candidates — Onboarding Queue"
            subtitle='Candidates marked "Selected" in ResourcingBot · click a row to fill onboarding details · new candidates appear first, completed ones move to the bottom'
          />

          <Box mb={2}>
            <TextField
              placeholder="Search by name, email, role, company or JD ID…"
              value={search} onChange={e => setSearch(e.target.value)}
              size="small" fullWidth sx={{ maxWidth: 420 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment> }}
            />
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={32} sx={{ color: INDIGO }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} sx={{ color: SLATE }}>
              <Star sx={{ fontSize: 40, mb: 1, opacity: 0.35 }} />
              <Typography sx={{ fontSize: 13 }}>
                {search ? "No candidates match your search" : "No selected candidates found"}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Candidate", "Role / Company", "JD ID", "Match Score", "Test Score",
                      "Uploaded", "Onboarding Status", "Progress", "Action"].map((h) => (
                      <TableCell
                        key={h}
                        sx={{ fontSize: 11, fontWeight: 700, color: SLATE,
                          borderBottom: "1px solid #f1f5f9", py: 1, px: 1.5, whiteSpace: "nowrap" }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((c) => {
                    const isCompleted = c.onboarding_status === "Completed";
                    return (
                      <TableRow
                        key={c._id}
                        hover
                        onClick={() => handleOpenOnboarding(c)}
                        sx={{
                          cursor: "pointer",
                          opacity: isCompleted ? 0.6 : 1,
                          "&:hover": { bgcolor: "#f8fafc" },
                          "&:last-child td": { borderBottom: 0 },
                        }}
                      >
                        <TableCell sx={{ py: 1.2, px: 1.5, borderBottom: "1px solid #f8fafc" }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 700, bgcolor: "#7c3aed" }}>
                              {(c.candidatename || "?")[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: NAVY }}>
                                {c.candidatename}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={0.4}>
                                <Email sx={{ fontSize: 11, color: SLATE }} />
                                <Typography sx={{ fontSize: 11, color: SLATE }}>{c.candidateEmail}</Typography>
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ py: 1.2, px: 1.5, borderBottom: "1px solid #f8fafc" }}>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: NAVY }}>
                            {c.jobRole || "—"}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: SLATE }}>
                            {c.companyName || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ py: 1.2, px: 1.5, fontSize: 11, color: BLUE, fontWeight: 700, fontFamily: "monospace", borderBottom: "1px solid #f8fafc" }}>
                          {c.jdID || "—"}
                        </TableCell>

                        <TableCell sx={{ py: 1.2, px: 1.5, borderBottom: "1px solid #f8fafc" }}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(c.match_score || 0, 100)}
                              sx={{ width: 50, height: 5, borderRadius: 4, bgcolor: "#e0f2fe",
                                "& .MuiLinearProgress-bar": { bgcolor: "#0369a1", borderRadius: 4 } }}
                            />
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#0369a1" }}>
                              {(c.match_score || 0).toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ py: 1.2, px: 1.5, borderBottom: "1px solid #f8fafc" }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 700,
                            color: c.ScreeningTestScore > 0 ? "#166534" : SLATE }}>
                            {c.ScreeningTestScore > 0 ? `${c.ScreeningTestScore}%` : "—"}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ py: 1.2, px: 1.5, fontSize: 12, color: "#334155", borderBottom: "1px solid #f8fafc" }}>
                          {fmtDate(c.uploadedAt)}
                        </TableCell>

                        <TableCell sx={{ py: 1.2, px: 1.5, borderBottom: "1px solid #f8fafc" }}>
                          <OnboardingStatusChip status={c.onboarding_status} />
                        </TableCell>

                        <TableCell sx={{ py: 1.2, px: 1.5, borderBottom: "1px solid #f8fafc", minWidth: 110 }}>
                          {c.is_employee ? (
                            <Box>
                              <LinearProgress
                                variant="determinate"
                                value={c.onboarding_pct}
                                sx={{ height: 5, borderRadius: 3, bgcolor: "#e2e8f0",
                                  "& .MuiLinearProgress-bar": {
                                    bgcolor: c.onboarding_pct === 100 ? "#16a34a" : INDIGO, borderRadius: 3,
                                  } }}
                              />
                              <Typography sx={{ fontSize: 10, color: SLATE, mt: 0.3 }}>
                                {c.onboarding_pct}%
                              </Typography>
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>
                              Not started
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ py: 1.2, px: 1.5, borderBottom: "1px solid #f8fafc" }}
                          onClick={(e) => e.stopPropagation()}>
                          <Tooltip title={isCompleted ? "View / edit onboarding" : "Start onboarding"}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={starting === c._id}
                                onClick={() => handleOpenOnboarding(c)}
                                sx={{
                                  color: isCompleted ? "#059669" : INDIGO,
                                  bgcolor: isCompleted ? "#dcfce7" : "#e8eaf6",
                                  "&:hover": { bgcolor: isCompleted ? "#bbf7d0" : "#c5cae9" },
                                  borderRadius: "8px",
                                }}
                              >
                                {starting === c._id
                                  ? <CircularProgress size={14} />
                                  : isCompleted
                                    ? <CheckCircle sx={{ fontSize: 16 }} />
                                    : <RocketLaunch sx={{ fontSize: 16 }} />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ── BGV pipeline summary ─────────────────────────────────────────── */}
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: "14px", bgcolor: "#fff" }}>
        <CardContent sx={{ p: 2.5 }}>
          <SectionHeader title="BGV Pipeline" subtitle="Background verification status across selected candidates" />
          <Grid container spacing={2}>
            {[
              { label: "Not Started",   count: selectedKpis.not_started ?? 0, color: "#dc2626" },
              { label: "In Progress",   count: selectedKpis.in_progress ?? 0, color: "#d97706" },
              { label: "Completed",     count: selectedKpis.completed ?? 0,   color: "#059669" },
            ].map((s) => (
              <Grid item xs={6} sm={4} md key={s.label}>
                <Box sx={{ p: 2, borderRadius: "10px", border: "1px solid #f1f5f9",
                  bgcolor: "#f8fafc", textAlign: "center" }}>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.count}</Typography>
                  <Typography sx={{ fontSize: 11, color: SLATE, mt: 0.25 }}>{s.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* ── Onboarding Detail Dialog ────────────────────────────────────── */}
      <OnboardingDetail
        open={detailOpen}
        onClose={handleDetailClose}
        employee={activeEmp}
      />
    </Box>
  );
}