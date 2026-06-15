



import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Grid, Typography, Button, IconButton, CircularProgress,
  Alert, Chip, TextField, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Tab, Tabs, Avatar, ToggleButton, ToggleButtonGroup,
} from "@mui/material";
import {
  ArrowBack, Refresh, Work, TrendingUp, CurrencyRupee,
  Groups, AccountBalanceWallet, Business, CalendarMonth,
} from "@mui/icons-material";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import Collapse from "@mui/material/Collapse";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

// ── Design tokens ─────────────────────────────────────────────────────────────
const NAVY    = "#0f172a";
const INDIGO  = "#1e40af";
const EMERALD = "#059669";
const AMBER   = "#d97706";
const SKY     = "#0284c7";
const ROSE    = "#e11d48";
const PURPLE  = "#7c3aed";
const SLATE   = "#64748b";
const PIE_COLORS = [INDIGO, EMERALD, AMBER, SKY, ROSE, PURPLE, "#0891b2", "#65a30d", "#dc2626", "#7c3aed"];

// ── Period config — backend always returns MONTHLY figures ───────────────────
const PERIOD_CONFIG = {
  monthly:     { label: "Monthly",     short: "/mo",   multiplier: 1,    days: 30   },
  quarterly:   { label: "Quarterly",   short: "/qtr",  multiplier: 3,    days: 91   },
  halfyearly:  { label: "Half-Yearly", short: "/6mo",  multiplier: 6,    days: 182  },
  yearly:      { label: "Yearly",      short: "/yr",   multiplier: 12,   days: 365  },
  custom:      { label: "Custom",      short: "",       multiplier: null, days: null },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMoney = (n, cur = "INR") => {
  if (!n && n !== 0) return "—";
  const sym = { INR: "₹", USD: "$", GBP: "£", EUR: "€", AED: "AED " }[cur] || "";
  if (n >= 10_000_000) return `${sym}${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000)    return `${sym}${(n / 100_000).toFixed(2)}L`;
  if (n >= 1_000)      return `${sym}${(n / 1_000).toFixed(1)}K`;
  return `${sym}${Number(n).toLocaleString("en-IN")}`;
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// Compute days between two date strings (can be future)
const daysBetween = (startStr, endStr) => {
  const s = new Date(startStr);
  const e = new Date(endStr);
  return Math.max(0, (e - s) / (1000 * 60 * 60 * 24));
};

const CLIENT_BASE = process.env.REACT_APP_API_CLIENTS_URL;
const hdrs = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

// Default custom date range: current month
const todayStr = () => new Date().toISOString().split("T")[0];
const monthEndStr = () => {
  const d = new Date();
  d.setDate(1); d.setMonth(d.getMonth() + 1); d.setDate(0);
  return d.toISOString().split("T")[0];
};

// ── Period Toggle ─────────────────────────────────────────────────────────────
function PeriodToggle({ period, onChange }) {
  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      <CalendarMonth sx={{ fontSize: 16, color: SLATE }} />
      <Typography fontSize={12} color={SLATE} fontWeight={600}>View:</Typography>
      <ToggleButtonGroup
        value={period}
        exclusive
        onChange={(_, v) => { if (v) onChange(v); }}
        size="small"
        sx={{
          bgcolor: "#f1f5f9",
          borderRadius: "10px",
          p: 0.4,
          gap: 0.3,
          "& .MuiToggleButton-root": {
            border: "none",
            borderRadius: "7px !important",
            px: 1.4,
            py: 0.5,
            fontSize: 11,
            fontWeight: 600,
            color: SLATE,
            textTransform: "none",
            transition: "all 0.15s",
            "&.Mui-selected": {
              bgcolor: "#fff",
              color: INDIGO,
              boxShadow: "0 1px 4px rgba(30,64,175,0.15)",
            },
            "&:hover:not(.Mui-selected)": { bgcolor: "#e2e8f0" },
          },
        }}
      >
        <ToggleButton value="monthly">Monthly</ToggleButton>
        <ToggleButton value="quarterly">Quarterly</ToggleButton>
        <ToggleButton value="halfyearly">Half-Yearly</ToggleButton>
        <ToggleButton value="yearly">Yearly</ToggleButton>
        <ToggleButton value="custom">Custom</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

// ── Custom Date Range Picker ──────────────────────────────────────────────────
function CustomDateRange({ startDate, endDate, onStartChange, onEndChange, periodLabel, multiplier }) {
  return (
    <Box
      display="flex" alignItems="center" gap={2} flexWrap="wrap"
      sx={{
        bgcolor: "#eff6ff",
        border: "1px solid #bfdbfe",
        borderRadius: 2,
        px: 2.5, py: 1.5,
      }}
    >
      <Typography fontSize={12} fontWeight={700} color={INDIGO} sx={{ minWidth: 80 }}>
        Date Range:
      </Typography>
      <Box display="flex" alignItems="center" gap={1.5}>
        <TextField
          type="date"
          size="small"
          label="From"
          value={startDate}
          onChange={e => onStartChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160, bgcolor: "#fff", borderRadius: 1 }}
        />
        <Typography fontSize={12} color={SLATE}>→</Typography>
        <TextField
          type="date"
          size="small"
          label="To"
          value={endDate}
          onChange={e => onEndChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160, bgcolor: "#fff", borderRadius: 1 }}
        />
      </Box>
      {startDate && endDate && (
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          <Chip
            size="small"
            label={`${Math.round(daysBetween(startDate, endDate))} days`}
            sx={{ fontWeight: 700, bgcolor: "#dbeafe", color: INDIGO, fontSize: 11 }}
          />
          <Chip
            size="small"
            label={`≈ ${multiplier.toFixed(1)} months`}
            sx={{ fontWeight: 700, bgcolor: "#d1fae5", color: EMERALD, fontSize: 11 }}
          />
          {new Date(endDate) > new Date() && (
            <Chip
              size="small"
              label="Includes future"
              sx={{ fontWeight: 700, bgcolor: "#fef3c7", color: AMBER, fontSize: 11 }}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

// ── Period Info Bar — shows the date span for selected period ─────────────────
function PeriodInfoBar({ period, customStart, customEnd, multiplier }) {
  if (period === "custom") return null; // custom shows its own date range picker

  const today = new Date();
  let label = "";

  if (period === "monthly") {
    label = today.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  } else if (period === "quarterly") {
    const qStart = new Date(today);
    qStart.setMonth(today.getMonth() - 2);
    label = `${fmtDate(qStart.toISOString())} — ${fmtDate(today.toISOString())}`;
  } else if (period === "halfyearly") {
    const hStart = new Date(today);
    hStart.setMonth(today.getMonth() - 5);
    label = `${fmtDate(hStart.toISOString())} — ${fmtDate(today.toISOString())}`;
  } else if (period === "yearly") {
    const yStart = new Date(today);
    yStart.setFullYear(today.getFullYear() - 1);
    label = `${fmtDate(yStart.toISOString())} — ${fmtDate(today.toISOString())}`;
  }

  return (
    <Box
      display="flex" alignItems="center" gap={1.5}
      sx={{
        bgcolor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 1.5,
        px: 2, py: 0.8,
      }}
    >
      <CalendarMonth sx={{ fontSize: 14, color: SLATE }} />
      <Typography fontSize={11} fontWeight={600} color={SLATE}>Period:</Typography>
      <Typography fontSize={11} color={NAVY} fontWeight={700}>{label}</Typography>
      <Chip
        size="small"
        label={`×${multiplier} months`}
        sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#dbeafe", color: INDIGO, height: 18 }}
      />
    </Box>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, icon, accent, chip }) => (
  <Box sx={{
    p: 2.5, borderRadius: 2.5, bgcolor: "#fff", border: "1px solid #e8edf3",
    display: "flex", flexDirection: "column", gap: 1.5, height: "100%",
    position: "relative", overflow: "hidden",
    "&::after": {
      content: '""', position: "absolute", top: 0, left: 0, right: 0,
      height: 3, bgcolor: accent, borderRadius: "10px 10px 0 0",
    },
  }}>
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box sx={{ p: 1, bgcolor: `${accent}14`, borderRadius: 1.5, color: accent }}>{icon}</Box>
      {chip && (
        <Chip label={chip} size="small"
          sx={{ fontWeight: 700, fontSize: 10, bgcolor: `${accent}14`, color: accent }} />
      )}
    </Box>
    <Box>
      <Typography fontSize={11} fontWeight={600} color={SLATE}
        textTransform="uppercase" letterSpacing={0.6}>{label}</Typography>
      <Typography fontSize={28} fontWeight={800} color={NAVY} lineHeight={1.2} mt={0.3}>{value}</Typography>
      {sub && <Typography fontSize={11} color="#9ca3af" mt={0.4}>{sub}</Typography>}
    </Box>
  </Box>
);

// ── Chart Card ────────────────────────────────────────────────────────────────
const ChartCard = ({ title, sub, accent = INDIGO, children }) => (
  <Box sx={{ bgcolor: "#fff", borderRadius: 2.5, border: "1px solid #e8edf3", p: 2.5, height: "100%" }}>
    <Box mb={2}>
      <Typography fontSize={13} fontWeight={700} color={NAVY}>{title}</Typography>
      {sub && <Typography fontSize={11} color={SLATE} mt={0.2}>{sub}</Typography>}
    </Box>
    {children}
  </Box>
);

// ── Billing History Mini Table ─────────────────────────────────────────────────
function BillingHistoryRows({ billingHistory, currency, periodShort, scaleFn }) {
  if (!billingHistory || billingHistory.length === 0) return null;
  return (
    <Box mt={1} sx={{ bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 1.5, p: 1.5 }}>
      <Typography fontSize={10} fontWeight={700} color={SLATE} textTransform="uppercase" letterSpacing={0.5} mb={1}>
        Rate History
      </Typography>
      {billingHistory.map((bh, bi) => (
        <Box key={bi} display="flex" alignItems="center" gap={2} py={0.4}
          sx={{ borderBottom: bi < billingHistory.length - 1 ? "1px dashed #d1fae5" : "none" }}>
          <Typography fontSize={11} fontWeight={700}
            color={bi === billingHistory.length - 1 ? EMERALD : NAVY}>
            {fmtMoney(scaleFn(bh.rate / 12), bh.currency || currency)}
          </Typography>
          <Typography fontSize={10} color={SLATE}>{periodShort || "/mo"}</Typography>
          <Typography fontSize={10} color={SLATE}>from {fmtDate(bh.effective_from)}</Typography>
          {bh.note && <Typography fontSize={10} color="#9ca3af">· {bh.note}</Typography>}
          {bi === billingHistory.length - 1 && (
            <Chip label="Current" size="small"
              sx={{ height: 14, fontSize: 9, fontWeight: 700, bgcolor: "#d1fae5", color: EMERALD, ml: "auto" }} />
          )}
        </Box>
      ))}
    </Box>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AllClientsAnalytics() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [tab,     setTab]     = useState(0);
  const [search,  setSearch]  = useState("");
  const [period,  setPeriod]  = useState("monthly");
  const [expandedClient, setExpandedClient] = useState(null);
  const [expandedDept,   setExpandedDept]   = useState(null);
  const [expandedBilling, setExpandedBilling] = useState({}); // { empId: bool }

  // ── Custom date range ─────────────────────────────────────────────────────
  const [customStart, setCustomStart] = useState(todayStr());
  const [customEnd,   setCustomEnd]   = useState(monthEndStr());

  // ── Compute multiplier from period or custom range ────────────────────────
  const customMultiplier = customStart && customEnd
    ? Math.max(0.03, daysBetween(customStart, customEnd) / 30)
    : 1;

  const multiplier = period === "custom" ? 1 : PERIOD_CONFIG[period].multiplier;

  const periodLabel = period === "custom"
    ? `${fmtDate(customStart)} – ${fmtDate(customEnd)}`
    : PERIOD_CONFIG[period].label;

  const periodShort = period === "custom"
    ? ` (${Math.round(daysBetween(customStart, customEnd))}d)`
    : PERIOD_CONFIG[period].short;

  const scale = (v) => (v || 0) * multiplier;

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      let url = `${CLIENT_BASE}/analytics/all`;
      if (period === "custom" && customStart && customEnd) {
        url += `?start=${customStart}&end=${customEnd}`;
      }
      const res = await fetch(url, { headers: hdrs() });
      const d   = await res.json();
      if (!res.ok) throw d;
      setData(d.data);
    } catch (e) {
      setError(e?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);
  
  useEffect(() => { load(); }, [load]);


  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress sx={{ color: INDIGO }} />
    </Box>
  );
  if (error)  return <Box p={4}><Alert severity="error">{error}</Alert></Box>;
  if (!data)  return null;

  const { clients, summary, internal } = data;
  const internalEmployees = internal?.employees || [];

  const filtered = clients.filter(c =>
    !search ||
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Chart data (scaled by period) ────────────────────────────────────────

  const revenueByClient = [...clients]
  .filter(c =>
    // only show clients with some revenue (active or historical)
    (c.total_billing_revenue || 0) > 0 || (c.historical_billing || 0) > 0
  )
  .sort((a, b) => {
    const aVal = (a.total_billing_revenue || 0) + (a.historical_billing || 0);
    const bVal = (b.total_billing_revenue || 0) + (b.historical_billing || 0);
    return bVal - aVal;
  })
  .slice(0, 10)
  .map(c => {
    const isHistOnly = c.is_historical_only === true;
    if (isHistOnly) {
      // Historical lump sum — DO NOT scale, show actual total earned
      const hBill = c.historical_billing || 0;
      const hSal  = c.historical_salary  || 0;
      return {
        name:    c.company_name,
        revenue: hBill,
        cost:    hSal,
        margin:  hBill - hSal,
      };
    }
    // Active client — scale monthly rate by period multiplier
    return {
      name:    c.company_name,
      revenue: scale(c.total_billing_revenue || 0),
      cost:    scale(c.total_salary_cost     || 0),
      margin:  scale(c.net_margin            || 0),
    };
  });


  const headcountByClient = [...clients]
    .filter(c => c.total_active_employees > 0)
    .sort((a, b) => b.total_active_employees - a.total_active_employees)
    .map(c => ({
      name:  c.company_name.length > 14 ? c.company_name.slice(0, 12) + "…" : c.company_name,
      count: c.total_active_employees,
    }));

  const industryMap = {};
  clients.forEach(c => {
    industryMap[c.industry || "Other"] = (industryMap[c.industry] || 0) + 1;
  });
  const industryData = Object.entries(industryMap).map(([name, value]) => ({ name, value }));

  const allEngagements = clients.flatMap(c =>
    (c.engagements || [])
      .filter(e => e.is_active)
      .map(e => ({ ...e, company_name: c.company_name }))
  );

  // ── Scaled summary figures ────────────────────────────────────────────────
  const sBilling = scale(summary.total_billing_revenue);
  const sSalary  = scale(summary.total_salary_cost);
  const sMargin  = scale(summary.net_margin);
  const iBilling = scale(internal?.total_billing);
  const iSalary  = scale(internal?.total_salary);
  const iMargin  = scale(internal?.net_margin);

  const toggleBilling = (empId) =>
    setExpandedBilling(prev => ({ ...prev, [empId]: !prev[empId] }));

  return (
    <Box display="flex" flexDirection="column" gap={3} pb={4}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate("/clients")}
            sx={{ border: "1px solid #e8edf3", borderRadius: 1.5, bgcolor: "#fff" }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box>
            <Typography fontSize={20} fontWeight={800} color={NAVY}>All Clients Analytics</Typography>
            <Typography fontSize={12} color={SLATE}>
              Complete overview across all {summary.total_clients} clients
            </Typography>
          </Box>
        </Box>

        {/* ── Period toggle + Refresh ── */}
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <PeriodToggle period={period} onChange={setPeriod} />
          <Tooltip title="Refresh">
            <IconButton onClick={load}
              sx={{ border: "1px solid #e8edf3", borderRadius: 1.5, bgcolor: "#fff" }}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Custom Date Range (only when Custom is selected) ─────────── */}
      {period === "custom" && (
        <CustomDateRange
          startDate={customStart}
          endDate={customEnd}
          onStartChange={setCustomStart}
          onEndChange={setCustomEnd}
          periodLabel={periodLabel}
          multiplier={customMultiplier}
        />
      )}

      {/* ── Period Info Bar (only for preset periods) ─────────────────── */}
      {period !== "custom" && (
        <PeriodInfoBar
          period={period}
          multiplier={multiplier}
        />
      )}

      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard label="Total Clients" value={summary.total_clients}
            icon={<Business sx={{ fontSize: 20 }} />} accent={INDIGO}
            sub={`${summary.active_clients} active`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard label="Active Employees" value={summary.total_active_employees}
            icon={<Groups sx={{ fontSize: 20 }} />} accent={SKY}
            sub="Deployed across clients" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard label="Total JDs" value={summary.total_jds}
            icon={<Work sx={{ fontSize: 20 }} />} accent={PURPLE}
            sub="Job descriptions raised" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard label={`${PERIOD_CONFIG[period]?.label || "Period"} Revenue`} value={fmtMoney(sBilling)}
            icon={<CurrencyRupee sx={{ fontSize: 20 }} />} accent={EMERALD}
            sub={`Billing${periodShort} across all clients`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard label={`${PERIOD_CONFIG[period]?.label || "Period"} Salary`} value={fmtMoney(sSalary)}
            icon={<AccountBalanceWallet sx={{ fontSize: 20 }} />} accent={AMBER}
            sub={`Salary cost${periodShort}`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard label={`${PERIOD_CONFIG[period]?.label || "Period"} Margin`} value={fmtMoney(sMargin)}
            icon={<TrendingUp sx={{ fontSize: 20 }} />}
            accent={sMargin >= 0 ? EMERALD : ROSE}
            sub={`Net margin${periodShort}`}
            chip={`${summary.margin_pct}%`} />
        </Grid>
      </Grid>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: "#fff", borderRadius: 2.5, border: "1px solid #e8edf3" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable"
          TabIndicatorProps={{ style: { backgroundColor: INDIGO, height: 3 } }}
          sx={{
            px: 2,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 13, color: SLATE, minHeight: 48 },
            "& .Mui-selected": { color: INDIGO },
          }}>
          <Tab label="Revenue Overview" />
          <Tab label="Client Table" />
          <Tab label="Headcount & Teams" />
          <Tab label="Candidate Pipeline" />
          <Tab label="All Employees" />
        </Tabs>
      </Box>

      {/* ═══ TAB 0 — Revenue Overview ════════════════════════════════════ */}
      {tab === 0 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={8}>
            <ChartCard
              title={`${periodLabel} Revenue vs Salary vs Margin — Top 10 Clients`}
              accent={EMERALD}
            >
              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ width: Math.max(revenueByClient.length * 100, 500) }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={revenueByClient} margin={{ top: 5, right: 10, bottom: 60, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: SLATE }}
                        angle={-30} textAnchor="end" interval={0} />
                      <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fontSize: 10, fill: SLATE }} width={72} />
                      <RTooltip
                        formatter={(v, n) => [fmtMoney(v), n]}
                        contentStyle={{ borderRadius: 10, border: "1px solid #e8edf3", fontSize: 12 }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, marginBottom: -25 }} />
                      <Bar dataKey="revenue" name={`Billing${periodShort}`}  fill={EMERALD} radius={[3,3,0,0]} barSize={14} />
                      <Bar dataKey="cost"    name={`Salary${periodShort}`}   fill={AMBER}   radius={[3,3,0,0]} barSize={14} />
                      <Bar dataKey="margin"  name={`Margin${periodShort}`}   fill={INDIGO}  radius={[3,3,0,0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <ChartCard title="Clients by Industry" accent={INDIGO}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={industryData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                    {industryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={{ borderRadius: 10, border: "1px solid #e8edf3", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <Box display="flex" flexWrap="wrap" gap={0.8} justifyContent="center" mt={1}>
                {industryData.map((d, i) => (
                  <Box key={d.name} display="flex" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <Typography fontSize={11} color={SLATE}>{d.name} ({d.value})</Typography>
                  </Box>
                ))}
              </Box>
            </ChartCard>
          </Grid>

          {/* ── Summary tiles ── */}
          <Grid item xs={12}>
            <Box sx={{ bgcolor: "#fff", borderRadius: 2.5, border: "1px solid #e8edf3", p: 2.5 }}>
              <Typography fontSize={13} fontWeight={700} color={NAVY} mb={2}>
                {periodLabel} Financial Summary — All Clients
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: `Revenue`,     value: fmtMoney(sBilling), color: EMERALD },
                  { label: `Salary Cost`, value: fmtMoney(sSalary),  color: AMBER   },
                  { label: `Net Margin`,  value: fmtMoney(sMargin),  color: sMargin >= 0 ? INDIGO : ROSE },
                  { label: "Margin %",    value: `${summary.margin_pct}%`, color: INDIGO },
                ].map(({ label, value, color }) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Box sx={{
                      p: 2, borderRadius: "12px", textAlign: "center",
                      border: "1px solid #e8edf3", bgcolor: "#f9fafb",
                    }}>
                      <Typography fontSize={22} fontWeight={800} color={color}>{value}</Typography>
                      <Typography fontSize={11} color={SLATE} mt={0.4}
                        textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
                      <Typography fontSize={10} color="#9ca3af">{periodLabel}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* ═══ TAB 1 — Client Table ════════════════════════════════════════ */}
      {tab === 1 && (
        <Box sx={{ bgcolor: "#fff", borderRadius: 2.5, border: "1px solid #e8edf3", p: 2.5 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1.5}>
            <Box>
              <Typography fontSize={14} fontWeight={800} color={NAVY}>
                All Clients — {periodLabel} Financial Summary
              </Typography>
              {period !== "custom" && (
                <Typography fontSize={11} color={SLATE} mt={0.2}>
                  Figures scaled by {multiplier}× monthly base
                </Typography>
              )}
            </Box>
            <TextField size="small" placeholder="Search client / industry…"
              value={search} onChange={e => setSearch(e.target.value)}
              sx={{ width: 240, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": {
                  fontWeight: 700, fontSize: 11, color: SLATE,
                  textTransform: "uppercase", letterSpacing: 0.4, bgcolor: "#f9fafb",
                }}}>
                  <TableCell>Client</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Employees</TableCell>
                  <TableCell align="right">Hired</TableCell>
                  <TableCell align="right">Conv %</TableCell>
                  <TableCell align="right">Revenue{periodShort}</TableCell>
                  <TableCell align="right">Salary{periodShort}</TableCell>
                  <TableCell align="right">Margin{periodShort}</TableCell>
                  <TableCell align="right">Margin %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: SLATE }}>
                      No clients found.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((c, i) => (
                  <TableRow key={i} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, bgcolor: INDIGO, borderRadius: 1 }}>
                          {c.company_name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography fontSize={13} fontWeight={700}>{c.company_name}</Typography>
                          <Typography fontSize={10} color={SLATE} fontFamily="monospace">{c.client_ref_id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography fontSize={12}>{c.industry || "—"}</Typography></TableCell>
                    <TableCell>
                      {c.source === "resourcing_bot" ? (
                        <Chip label="ResourcingBot" size="small"
                          sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#ede9fe", color: PURPLE }} />
                      ) : (
                        <Chip label={c.relationship_status} size="small"
                          sx={{
                            fontWeight: 700, fontSize: 10,
                            bgcolor: c.relationship_status === "Active" ? "#d1fae5" : "#f3f4f6",
                            color:   c.relationship_status === "Active" ? EMERALD : SLATE,
                          }} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontSize={13} fontWeight={700} color={SKY}>
                        {c.total_active_employees}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={c.total_hired} size="small"
                        sx={{ fontWeight: 700, fontSize: 11,
                          bgcolor: c.total_hired > 0 ? "#d1fae5" : "#f3f4f6",
                          color:   c.total_hired > 0 ? EMERALD : SLATE }} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontSize={12} color={INDIGO} fontWeight={600}>
                        {c.conversion_rate}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontSize={13} fontWeight={700} color={EMERALD}>
                        {fmtMoney(scale(c.total_billing_revenue))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontSize={13} fontWeight={700} color={AMBER}>
                        {fmtMoney(scale(c.total_salary_cost))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontSize={13} fontWeight={700}
                        color={c.net_margin >= 0 ? EMERALD : ROSE}>
                        {fmtMoney(scale(c.net_margin))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={`${c.margin_pct}%`} size="small"
                        sx={{ fontWeight: 700, fontSize: 10,
                          bgcolor: c.margin_pct > 30 ? "#d1fae5" : c.margin_pct > 0 ? "#fef3c7" : "#fee2e2",
                          color:   c.margin_pct > 30 ? EMERALD    : c.margin_pct > 0 ? AMBER    : ROSE }} />
                    </TableCell>
                  </TableRow>
                ))}

                {/* Grand totals row */}
                <TableRow sx={{ bgcolor: "#f8fafc", "& td": { fontWeight: 800, borderTop: "2px solid #e8edf3" } }}>
                  <TableCell colSpan={3}>
                    <Typography fontSize={12} fontWeight={800} color={NAVY}>Grand Total</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontSize={13} fontWeight={800} color={SKY}>
                      {summary.total_active_employees}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontSize={13} fontWeight={800} color={EMERALD}>
                      {summary.total_hired}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontSize={12} fontWeight={800} color={INDIGO}>
                      {summary.overall_conversion_rate}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontSize={13} fontWeight={800} color={EMERALD}>
                      {fmtMoney(sBilling)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontSize={13} fontWeight={800} color={AMBER}>
                      {fmtMoney(sSalary)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontSize={13} fontWeight={800} color={sMargin >= 0 ? EMERALD : ROSE}>
                      {fmtMoney(sMargin)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={`${summary.margin_pct}%`} size="small"
                      sx={{ fontWeight: 700, bgcolor: "#d1fae5", color: EMERALD }} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ═══ TAB 2 — Headcount & Teams ═══════════════════════════════════ */}
      {tab === 2 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <ChartCard title="Active Headcount per Client"
              sub="Number of employees currently deployed">
              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ width: Math.max(headcountByClient.length * 100, 400) }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={headcountByClient}
                      margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: SLATE }}
                        angle={-30} textAnchor="end" interval={0} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: SLATE }} />
                      <RTooltip contentStyle={{ borderRadius: 10, border: "1px solid #e8edf3", fontSize: 12 }} />
                      <Bar dataKey="count" name="Employees" fill={SKY} radius={[4,4,0,0]} barSize={28}>
                        {headcountByClient.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </ChartCard>
          </Grid>
        </Grid>
      )}

      {/* ═══ TAB 3 — Candidate Pipeline ══════════════════════════════════ */}
      {tab === 3 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <ChartCard title="Candidates per Client"
              sub="Total applied vs hired across all clients" accent={PURPLE}>
              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ width: Math.max(clients.length * 80, 700) }}>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={[...clients]
                        .sort((a, b) => b.total_candidates - a.total_candidates)
                        .slice(0, 12)
                        .map(c => ({
                          name:    c.company_name,
                          applied: c.total_candidates,
                          hired:   c.total_hired,
                        }))}
                      margin={{ top: 5, right: 10, bottom: 40, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: SLATE }}
                        angle={-30} textAnchor="end" interval={0} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: SLATE }} />
                      <RTooltip contentStyle={{ borderRadius: 10, border: "1px solid #e8edf3", fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, marginBottom: -40 }} />
                      <Bar dataKey="applied" name="Applied" fill={PURPLE} radius={[3,3,0,0]} barSize={14} />
                      <Bar dataKey="hired"   name="Hired"   fill={EMERALD} radius={[3,3,0,0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ChartCard title="Overall Hiring Funnel" sub="Across all clients" accent={PURPLE}>
              <Grid container spacing={2} mt={1}>
                {[
                  { label: "Total Candidates",   value: summary.total_candidates,               color: PURPLE  },
                  { label: "Total Hired",         value: summary.total_hired,                    color: EMERALD },
                  { label: "Conversion Rate",     value: `${summary.overall_conversion_rate}%`,  color: INDIGO  },
                  { label: "Total JDs",           value: summary.total_jds,                      color: SKY     },
                ].map(({ label, value, color }) => (
                  <Grid item xs={6} key={label}>
                    <Box sx={{ p: 2.5, borderRadius: 2, border: "1px solid #e8edf3", textAlign: "center" }}>
                      <Typography fontSize={32} fontWeight={800} color={color}>{value}</Typography>
                      <Typography fontSize={11} color={SLATE}
                        textTransform="uppercase" letterSpacing={0.5} mt={0.5}>{label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </ChartCard>
          </Grid>
        </Grid>
      )}

      {/* ═══ TAB 4 — All Employees ═══════════════════════════════════════ */}
      {tab === 4 && (
        <Box display="flex" flexDirection="column" gap={3}>

          {/* ── ZentreeLabs Internal Employees ── */}
          {internalEmployees.length > 0 && (
            <Box sx={{ bgcolor: "#fff", borderRadius: 2.5, border: "2px solid #dbeafe", p: 2.5 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}
                flexWrap="wrap" gap={1}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 4, height: 22, bgcolor: INDIGO, borderRadius: 2 }} />
                  <Box>
                    <Typography fontSize={14} fontWeight={800} color={NAVY}>
                      ZentreeLabs Pvt Ltd — Internal Employees
                    </Typography>
                    <Typography fontSize={11} color={SLATE}>
                      {internalEmployees.length} employee{internalEmployees.length > 1 ? "s" : ""} · {periodLabel}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip label={`${internalEmployees.length} Employees`} size="small"
                    sx={{ fontWeight: 700, bgcolor: "#dbeafe", color: INDIGO }} />
                  <Chip label={`Billing: ${fmtMoney(iBilling)}`} size="small"
                    sx={{ fontWeight: 700, bgcolor: "#d1fae5", color: EMERALD }} />
                  <Chip label={`Salary: ${fmtMoney(iSalary)}`} size="small"
                    sx={{ fontWeight: 700, bgcolor: "#fef3c7", color: AMBER }} />
                  <Chip label={`Margin: ${fmtMoney(iMargin)}`} size="small"
                    sx={{ fontWeight: 700,
                      bgcolor: iMargin >= 0 ? "#d1fae5" : "#fee2e2",
                      color:   iMargin >= 0 ? EMERALD   : ROSE }} />
                </Box>
              </Box>

              {/* Group by Department */}
              {(() => {
                const grouped = internalEmployees.reduce((acc, e) => {
                  const key = e.department || e.project_name || "General";
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(e);
                  return acc;
                }, {});

                return (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: SLATE,
                          textTransform: "uppercase", letterSpacing: 0.4, bgcolor: "#eff6ff" } }}>
                          <TableCell width={32} />
                          <TableCell>#</TableCell>
                          <TableCell>Department</TableCell>
                          <TableCell align="center">Employees</TableCell>
                          <TableCell align="right">Billing{periodShort}</TableCell>
                          <TableCell align="right">Salary{periodShort}</TableCell>
                          <TableCell align="right">Margin{periodShort}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(grouped).map(([deptName, employees], idx) => {
                          const deptBilling = employees.reduce((s, e) => s + scale(e.client_billing_rate || 0), 0);
                          const deptSalary  = employees.reduce((s, e) => s + scale(e.employee_salary  || 0), 0);
                          const deptMargin  = deptBilling - deptSalary;
                          const isOpen = expandedDept === deptName;

                          return (
                            <React.Fragment key={deptName}>
                              <TableRow hover
                                onClick={() => setExpandedDept(isOpen ? null : deptName)}
                                sx={{ cursor: "pointer", bgcolor: isOpen ? "#eff6ff" : "inherit",
                                      "& td": { borderBottom: isOpen ? "none" : undefined } }}>
                                <TableCell>
                                  <IconButton size="small" sx={{ p: 0.5 }}>
                                    {isOpen ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                                  </IconButton>
                                </TableCell>
                                <TableCell>
                                  <Typography fontSize={11} color={SLATE}>{idx + 1}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 800,
                                      bgcolor: INDIGO, borderRadius: 1 }}>
                                      {deptName?.[0]?.toUpperCase()}
                                    </Avatar>
                                    <Typography fontSize={13} fontWeight={700} color={NAVY}>{deptName}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip label={`${employees.length} emp`} size="small"
                                    sx={{ fontWeight: 700, bgcolor: "#dbeafe", color: INDIGO }} />
                                </TableCell>
                                <TableCell align="right">
                                  <Typography fontSize={13} fontWeight={700} color={EMERALD}>{fmtMoney(deptBilling)}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography fontSize={13} fontWeight={700} color={AMBER}>{fmtMoney(deptSalary)}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography fontSize={13} fontWeight={700} color={deptMargin >= 0 ? EMERALD : ROSE}>
                                    {fmtMoney(deptMargin)}
                                  </Typography>
                                </TableCell>
                              </TableRow>

                              {/* Expanded sub-table */}
                              <TableRow sx={{ bgcolor: "#f8faff" }}>
                                <TableCell colSpan={7} sx={{ p: 0, borderBottom: isOpen ? undefined : "none" }}>
                                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                    <Box sx={{ mx: 2, my: 1.5 }}>
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 10,
                                            color: SLATE, textTransform: "uppercase",
                                            letterSpacing: 0.4, bgcolor: "#eff6ff" } }}>
                                            <TableCell>#</TableCell>
                                            <TableCell>Employee</TableCell>
                                            <TableCell>Designation</TableCell>
                                            <TableCell>Department</TableCell>
                                            <TableCell>Project</TableCell>
                                            <TableCell>Joined</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="right">Billing{periodShort}</TableCell>
                                            <TableCell align="right">Salary{periodShort}</TableCell>
                                            <TableCell align="right">Margin{periodShort}</TableCell>
                                            <TableCell width={32} />
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {employees.map((e, i) => {
                                            const eb = scale(e.client_billing_rate || 0);
                                            const es = scale(e.employee_salary     || 0);
                                            const em = eb - es;
                                            const bKey = `int_${e.employee_id || i}`;
                                            const showBilling = expandedBilling[bKey];
                                            const hasBillingHistory = (e.billing_history || []).length > 0;

                                            return (
                                              <React.Fragment key={i}>
                                                <TableRow hover>
                                                  <TableCell>
                                                    <Typography fontSize={11} color={SLATE}>{i + 1}</Typography>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                      <Avatar sx={{ width: 26, height: 26, fontSize: 10,
                                                        fontWeight: 700, bgcolor: INDIGO, borderRadius: 1 }}>
                                                        {e.name?.[0]?.toUpperCase()}
                                                      </Avatar>
                                                      <Box>
                                                        <Typography fontSize={12} fontWeight={700}>{e.name}</Typography>
                                                        <Typography fontSize={10} color={SLATE} fontFamily="monospace">{e.emp_id}</Typography>
                                                      </Box>
                                                    </Box>
                                                  </TableCell>
                                                  <TableCell><Typography fontSize={11}>{e.designation || "—"}</Typography></TableCell>
                                                  <TableCell><Typography fontSize={11}>{e.department  || "—"}</Typography></TableCell>
                                                  <TableCell><Typography fontSize={11}>{e.project_name || "—"}</Typography></TableCell>
                                                  <TableCell>
                                                    <Typography fontSize={10} color={SLATE}>
                                                      {fmtDate(e.start_date)}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Chip label={e.status || "Active"} size="small"
                                                      sx={{ fontWeight: 700, fontSize: 10,
                                                        bgcolor: (e.status || "Active") === "Active" ? "#d1fae5" : "#f3f4f6",
                                                        color:   (e.status || "Active") === "Active" ? EMERALD   : SLATE }} />
                                                  </TableCell>
                                                  <TableCell align="right">
                                                    <Typography fontSize={12} fontWeight={700} color={EMERALD}>
                                                      {fmtMoney(eb, e.billing_currency)}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell align="right">
                                                    <Typography fontSize={12} fontWeight={700} color={AMBER}>
                                                      {fmtMoney(es)}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell align="right">
                                                    <Typography fontSize={12} fontWeight={700}
                                                      color={em >= 0 ? EMERALD : ROSE}>
                                                      {fmtMoney(em, e.billing_currency)}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell>
                                                    {hasBillingHistory && (
                                                      <Tooltip title={showBilling ? "Hide rate history" : "Show rate history"}>
                                                        <IconButton size="small" sx={{ p: 0.3 }}
                                                          onClick={() => toggleBilling(bKey)}>
                                                          {showBilling
                                                            ? <KeyboardArrowUpIcon sx={{ fontSize: 14 }} />
                                                            : <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />}
                                                        </IconButton>
                                                      </Tooltip>
                                                    )}
                                                  </TableCell>
                                                </TableRow>
                                                {/* Billing history row */}
                                                {hasBillingHistory && showBilling && (
                                                  <TableRow>
                                                    <TableCell colSpan={11} sx={{ pt: 0, pb: 1.5, px: 3 }}>
                                                      <BillingHistoryRows
                                                        billingHistory={e.billing_history}
                                                        currency={e.billing_currency}
                                                        periodShort={periodShort}
                                                        scaleFn={scale}
                                                      />
                                                    </TableCell>
                                                  </TableRow>
                                                )}
                                              </React.Fragment>
                                            );
                                          })}
                                          {/* Dept totals */}
                                          <TableRow sx={{ bgcolor: "#eff6ff" }}>
                                            <TableCell colSpan={7}>
                                              <Typography fontSize={12} fontWeight={800} color={NAVY}>
                                                {deptName} Total
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                              <Typography fontSize={13} fontWeight={800} color={EMERALD}>{fmtMoney(deptBilling)}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                              <Typography fontSize={13} fontWeight={800} color={AMBER}>{fmtMoney(deptSalary)}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                              <Typography fontSize={13} fontWeight={800}
                                                color={deptMargin >= 0 ? EMERALD : ROSE}>
                                                {fmtMoney(deptMargin)}
                                              </Typography>
                                            </TableCell>
                                            <TableCell />
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}

                        {/* Internal grand total */}
                        <TableRow sx={{ bgcolor: "#eff6ff" }}>
                          <TableCell colSpan={4}>
                            <Typography fontSize={12} fontWeight={800} color={NAVY}>Internal Total</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontSize={13} fontWeight={800} color={EMERALD}>{fmtMoney(iBilling)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontSize={13} fontWeight={800} color={AMBER}>{fmtMoney(iSalary)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontSize={13} fontWeight={800}
                              color={iMargin >= 0 ? EMERALD : ROSE}>
                              {fmtMoney(iMargin)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                );
              })()}
            </Box>
          )}

          {/* ── Client-Deployed Employees ── */}
          {(() => {
            const grouped = allEngagements.reduce((acc, e) => {
              const key = e.company_name || "Unknown Client";
              if (!acc[key]) acc[key] = [];
              acc[key].push(e);
              return acc;
            }, {});

            return (
              <Box sx={{ bgcolor: "#fff", borderRadius: 2.5, border: "1px solid #e8edf3", p: 2.5 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box sx={{ width: 4, height: 22, bgcolor: EMERALD, borderRadius: 2 }} />
                  <Box>
                    <Typography fontSize={14} fontWeight={800} color={NAVY}>
                      Client-Deployed Employees ({allEngagements.length}) — {periodLabel}
                    </Typography>
                    <Typography fontSize={11} color={SLATE}>Click a client row to view employees · Click ▾ on an employee to see rate history</Typography>
                  </Box>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: SLATE,
                        textTransform: "uppercase", letterSpacing: 0.4, bgcolor: "#f9fafb" } }}>
                        <TableCell width={32} />
                        <TableCell>#</TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell align="center">Employees</TableCell>
                        <TableCell align="right">Billing{periodShort}</TableCell>
                        <TableCell align="right">Salary{periodShort}</TableCell>
                        <TableCell align="right">Margin{periodShort}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(grouped).map(([clientName, employees], idx) => {
                        const cBilling = employees.reduce((s, e) => s + scale(e.client_billing_rate || 0), 0);
                        const cSalary  = employees.reduce((s, e) => s + scale(e.employee_salary     || 0), 0);
                        const cMargin  = cBilling - cSalary;
                        const isOpen   = expandedClient === clientName;

                        return (
                          <React.Fragment key={clientName}>
                            <TableRow hover
                              onClick={() => setExpandedClient(isOpen ? null : clientName)}
                              sx={{ cursor: "pointer", bgcolor: isOpen ? "#f0fdf4" : "inherit",
                                    "& td": { borderBottom: isOpen ? "none" : undefined } }}>
                              <TableCell>
                                <IconButton size="small" sx={{ p: 0.5 }}>
                                  {isOpen ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                                </IconButton>
                              </TableCell>
                              <TableCell>
                                <Typography fontSize={11} color={SLATE}>{idx + 1}</Typography>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 800,
                                    bgcolor: EMERALD, borderRadius: 1 }}>
                                    {clientName?.[0]?.toUpperCase()}
                                  </Avatar>
                                  <Typography fontSize={13} fontWeight={700} color={NAVY}>{clientName}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label={`${employees.length} emp`} size="small"
                                  sx={{ fontWeight: 700, bgcolor: "#dbeafe", color: INDIGO }} />
                              </TableCell>
                              <TableCell align="right">
                                <Typography fontSize={13} fontWeight={700} color={EMERALD}>{fmtMoney(cBilling)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography fontSize={13} fontWeight={700} color={AMBER}>{fmtMoney(cSalary)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography fontSize={13} fontWeight={700} color={cMargin >= 0 ? EMERALD : ROSE}>
                                  {fmtMoney(cMargin)}
                                </Typography>
                              </TableCell>
                            </TableRow>

                            {/* Expanded employee sub-table */}
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                              <TableCell colSpan={7} sx={{ p: 0, borderBottom: isOpen ? undefined : "none" }}>
                                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                  <Box sx={{ mx: 2, my: 1.5 }}>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 10, color: SLATE,
                                          textTransform: "uppercase", letterSpacing: 0.4, bgcolor: "#eff6ff" } }}>
                                          <TableCell>#</TableCell>
                                          <TableCell>Employee</TableCell>
                                          <TableCell>Designation</TableCell>
                                          <TableCell>Dept</TableCell>
                                          <TableCell>Project</TableCell>
                                          <TableCell>Engagement Period</TableCell>
                                          <TableCell>Tenure</TableCell>
                                          <TableCell>Status</TableCell>
                                          <TableCell align="right">Client Pays{periodShort}</TableCell>
                                          <TableCell align="right">We Pay{periodShort}</TableCell>
                                          <TableCell align="right">Margin{periodShort}</TableCell>
                                          <TableCell width={32} />
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {employees.map((e, i) => {
                                          const eb = scale(e.client_billing_rate || 0);
                                          const es = scale(e.employee_salary     || 0);
                                          const em = eb - es;
                                          const tenureYrs = e.years_on_client;
                                          const tenureTxt = tenureYrs == null ? "—"
                                            : tenureYrs < 1 ? `${Math.round(tenureYrs * 12)}mo`
                                            : `${tenureYrs.toFixed(1)}yr`;
                                          const bKey = `cli_${clientName}_${e.emp_id || i}`;
                                          const showBilling = expandedBilling[bKey];
                                          const hasBillingHistory = (e.billing_history || []).length > 0;

                                          return (
                                            <React.Fragment key={i}>
                                              <TableRow hover>
                                                <TableCell>
                                                  <Typography fontSize={11} color={SLATE}>{i + 1}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                  <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar sx={{ width: 26, height: 26, fontSize: 10,
                                                      fontWeight: 700, bgcolor: INDIGO, borderRadius: 1 }}>
                                                      {e.name?.[0]?.toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                      <Typography fontSize={12} fontWeight={700}>{e.name}</Typography>
                                                      <Typography fontSize={10} color={SLATE} fontFamily="monospace">{e.emp_id}</Typography>
                                                    </Box>
                                                  </Box>
                                                </TableCell>
                                                <TableCell><Typography fontSize={11}>{e.designation || "—"}</Typography></TableCell>
                                                <TableCell><Typography fontSize={11}>{e.department  || "—"}</Typography></TableCell>
                                                <TableCell><Typography fontSize={11}>{e.project_name || "—"}</Typography></TableCell>

                                                {/* ── Engagement Period (start → end) ── */}
                                                <TableCell>
                                                  <Box>
                                                    <Typography fontSize={10} color={SLATE}>
                                                      {fmtDate(e.start_date)}
                                                    </Typography>
                                                    <Typography fontSize={10} color={SLATE}>
                                                      → {e.end_date ? fmtDate(e.end_date) : (
                                                        <Box component="span" sx={{ color: EMERALD, fontWeight: 700 }}>Present</Box>
                                                      )}
                                                    </Typography>
                                                  </Box>
                                                </TableCell>

                                                <TableCell>
                                                  <Chip label={tenureTxt} size="small"
                                                    sx={{ fontWeight: 600, fontSize: 10, bgcolor: "#dbeafe", color: INDIGO }} />
                                                </TableCell>
                                                <TableCell>
                                                  <Chip label={e.status || "Active"} size="small"
                                                    sx={{ fontWeight: 700, fontSize: 10,
                                                      bgcolor: (e.status || "Active") === "Active" ? "#d1fae5" : "#f3f4f6",
                                                      color:   (e.status || "Active") === "Active" ? EMERALD   : SLATE }} />
                                                </TableCell>
                                                <TableCell align="right">
                                                  <Typography fontSize={12} fontWeight={700} color={EMERALD}>
                                                    {fmtMoney(eb, e.billing_currency)}
                                                  </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                  <Typography fontSize={12} fontWeight={700} color={AMBER}>
                                                    {fmtMoney(es)}
                                                  </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                  <Typography fontSize={12} fontWeight={700}
                                                    color={em >= 0 ? EMERALD : ROSE}>
                                                    {fmtMoney(em, e.billing_currency)}
                                                  </Typography>
                                                </TableCell>

                                                {/* ── Billing history toggle ── */}
                                                <TableCell>
                                                  {hasBillingHistory && (
                                                    <Tooltip title={showBilling ? "Hide rate history" : "Show rate history"}>
                                                      <IconButton size="small" sx={{ p: 0.3 }}
                                                        onClick={(ev) => {
                                                          ev.stopPropagation();
                                                          toggleBilling(bKey);
                                                        }}>
                                                        {showBilling
                                                          ? <KeyboardArrowUpIcon sx={{ fontSize: 14 }} />
                                                          : <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />}
                                                      </IconButton>
                                                    </Tooltip>
                                                  )}
                                                </TableCell>
                                              </TableRow>

                                              {/* Billing history inline row */}
                                              {hasBillingHistory && showBilling && (
                                                <TableRow>
                                                  <TableCell colSpan={12} sx={{ pt: 0, pb: 1.5, px: 3 }}>
                                                    <BillingHistoryRows
                                                      billingHistory={e.billing_history}
                                                      currency={e.billing_currency}
                                                      periodShort={periodShort}
                                                      scaleFn={scale}
                                                    />
                                                  </TableCell>
                                                </TableRow>
                                              )}
                                            </React.Fragment>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })()}
        </Box>
      )}

    </Box>
  );
}