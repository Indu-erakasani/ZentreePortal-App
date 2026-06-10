




import React, { useState, useEffect, useCallback } from "react";
import { useNavigate ,useSearchParams} from "react-router-dom";
import {
  Box, Grid, Typography, Button, IconButton, CircularProgress,
  Alert, Chip, Divider, TextField, MenuItem, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Tab, Tabs, Avatar, Paper,Container
} from "@mui/material";
import {
  ArrowBack, Refresh, People, Work, TrendingUp, AttachMoney,
  Groups, AccountBalanceWallet, Business,
} from "@mui/icons-material";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import Collapse from "@mui/material/Collapse";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
// ── tokens ────────────────────────────────────────────────────────────────────
const NAVY    = "#0f172a";
const INDIGO  = "#1e40af";
const EMERALD = "#059669";
const AMBER   = "#d97706";
const SKY     = "#0284c7";
const ROSE    = "#e11d48";
const PURPLE  = "#7c3aed";
const SLATE   = "#64748b";
const PIE_COLORS = [INDIGO, EMERALD, AMBER, SKY, ROSE, PURPLE, "#0891b2", "#65a30d", "#dc2626", "#7c3aed"];

const fmtMoney = (n, cur = "INR") => {
  if (!n && n !== 0) return "—";
  const sym = { INR: "₹", USD: "$", GBP: "£", EUR: "€", AED: "AED " }[cur] || "";
  if (n >= 10_000_000) return `${sym}${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000)    return `${sym}${(n / 100_000).toFixed(2)}L`;
  if (n >= 1_000)      return `${sym}${(n / 1_000).toFixed(1)}K`;
  return `${sym}${Number(n).toLocaleString("en-IN")}`;
};

const CLIENT_BASE = process.env.REACT_APP_API_CLIENTS_URL;
// const hdrs = () => ({
//   "Content-Type": "application/json",
//   Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
// });

const hdrs = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  console.log("aaaaaaaaaaaaa::::",hdrs)

// ── sub-components ────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, icon, accent, chip }) => (
  <Box sx={{
    p: 2.5, borderRadius: 2.5, bgcolor: "#fff", border: "1px solid #e8edf3",
    display: "flex", flexDirection: "column", gap: 1.5, height: "100%",
    position: "relative", overflow: "hidden",
    "&::after": { content: '""', position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: accent, borderRadius: "10px 10px 0 0" },
  }}>
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box sx={{ p: 1, bgcolor: `${accent}14`, borderRadius: 1.5, color: accent }}>{icon}</Box>
      {chip && <Chip label={chip} size="small" sx={{ fontWeight: 700, fontSize: 10, bgcolor: `${accent}14`, color: accent }} />}
    </Box>
    <Box>
      <Typography fontSize={11} fontWeight={600} color={SLATE} textTransform="uppercase" letterSpacing={0.6}>{label}</Typography>
      <Typography fontSize={28} fontWeight={800} color={NAVY} lineHeight={1.2} mt={0.3}>{value}</Typography>
      {sub && <Typography fontSize={11} color="#9ca3af" mt={0.4}>{sub}</Typography>}
    </Box>
  </Box>
);

const ChartCard = ({ title, sub, accent = INDIGO, children }) => (
  <Box sx={{ bgcolor: "#fff", borderRadius: 2.5, border: "1px solid #e8edf3", p: 2.5, height: "100%" }}>
    <Box mb={2}>
      <Typography fontSize={13} fontWeight={700} color={NAVY}>{title}</Typography>
      {sub && <Typography fontSize={11} color={SLATE} mt={0.2}>{sub}</Typography>}
    </Box>
    {children}
  </Box>
);

// ── main ──────────────────────────────────────────────────────────────────────
export default function AllClientsAnalytics() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("clientId"); 
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [tab,     setTab]     = useState(0);
  const [search,  setSearch]  = useState("");
  const [expandedClient, setExpandedClient] = useState(null);
  const [expandedDept, setExpandedDept] = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${CLIENT_BASE}/analytics/all`, { headers: hdrs() });
      console.log("Status:", res.status);
      const d   = await res.json();
      console.log("Response:", d);
      if (!res.ok) throw d;
      setData(d.data);
    } catch (e) {
      setError(e?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);



  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress sx={{ color: INDIGO }} /></Box>;
  if (error)   return <Box p={4}><Alert severity="error">{error}</Alert></Box>;
  if (!data)   return null;

//   const { clients, summary } = data;
const { clients, summary, internal } = data;
const internalEmployees = internal?.employees || [];

  // filter by search
//   const filtered = clients.filter(c =>
//     !search || c.company_name.toLowerCase().includes(search.toLowerCase()) ||
//     c.industry?.toLowerCase().includes(search.toLowerCase())
//   );


const filtered = clients.filter(c =>
    !search ||
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── chart data ────────────────────────────────────────────────────────────
  // Revenue per client (top 10)
  const revenueByClient = [...clients]
    .sort((a, b) => b.total_billing_revenue - a.total_billing_revenue)
    .slice(0, 10)
    .map(c => ({
    //   name:    c.company_name.length > 14 ? c.company_name.slice(0, 12) + "…" : c.company_name,
      name: c.company_name,
      revenue: c.total_billing_revenue,
      cost:    c.total_salary_cost,
      margin:  c.net_margin,
    }));

  // Headcount per client
  const headcountByClient = [...clients]
    .filter(c => c.total_active_employees > 0)
    .sort((a, b) => b.total_active_employees - a.total_active_employees)
    .map(c => ({
      name:  c.company_name.length > 14 ? c.company_name.slice(0, 12) + "…" : c.company_name,
      count: c.total_active_employees,
    }));

  // Industry pie
  const industryMap = {};
  clients.forEach(c => { industryMap[c.industry || "Other"] = (industryMap[c.industry] || 0) + 1; });
  const industryData = Object.entries(industryMap).map(([name, value]) => ({ name, value }));

  // Candidate funnel
  const funnelData = [
    { stage: "Total Applied", value: summary.total_candidates },
    { stage: "Hired",         value: summary.total_hired },
    { stage: "In Process",    value: summary.total_candidates - summary.total_hired },
  ];

  // All employees across all clients (for employee table)
  const allEngagements = clients.flatMap(c =>
    (c.engagements || [])
      .filter(e => e.is_active)
      .map(e => ({ ...e, company_name: c.company_name }))
  );

  return (
    <Box display="flex" flexDirection="column" gap={3} pb={4}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate("/clients")}
            sx={{ border: "1px solid #e8edf3", borderRadius: 1.5, bgcolor: "#fff" }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box>
            <Typography fontSize={20} fontWeight={800} color={NAVY}>All Clients Analytics</Typography>
            <Typography fontSize={12} color={SLATE}>Complete overview across all {summary.total_clients} clients</Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={load} sx={{ border: "1px solid #e8edf3", borderRadius: 1.5, bgcolor: "#fff" }}>
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── KPI Strip ───────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard label="Total Clients"   value={summary.total_clients}
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
          <KPICard label="Total Revenue" value={fmtMoney(summary.total_billing_revenue)}
            icon={<AttachMoney sx={{ fontSize: 20 }} />} accent={EMERALD}
            sub="All client billing combined" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard label="Total Salary Cost" value={fmtMoney(summary.total_salary_cost)}
            icon={<AccountBalanceWallet sx={{ fontSize: 20 }} />} accent={AMBER}
            sub="What we pay all employees" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <KPICard label="Net Margin" value={fmtMoney(summary.net_margin)}
            icon={<TrendingUp sx={{ fontSize: 20 }} />}
            accent={summary.net_margin >= 0 ? EMERALD : ROSE}
            sub="Revenue − salary" chip={`${summary.margin_pct}%`} />
        </Grid>
      </Grid>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: "#fff", borderRadius: 2.5, border: "1px solid #e8edf3" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable"
          TabIndicatorProps={{ style: { backgroundColor: INDIGO, height: 3 } }}
          sx={{ px: 2, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 13, color: SLATE, minHeight: 48 },
                "& .Mui-selected": { color: INDIGO } }}>
          <Tab label="Revenue Overview" />
          <Tab label="Client Table" />
          <Tab label="Headcount & Teams" />
          <Tab label="Candidate Pipeline" />
          <Tab label="All Employees" />
        </Tabs>
      </Box>

      {/* ═══ TAB 0 — Revenue Overview ═══════════════════════════════════ */}
      {tab === 0 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={8}>
            <ChartCard title="Revenue vs Salary Cost vs Margin — Top 10 Clients" accent={EMERALD}>
            <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ width: Math.max(revenueByClient.length * 10, 500) }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={revenueByClient} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: SLATE }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fontSize: 10, fill: SLATE }} width={72} />
                  <RTooltip formatter={(v, n) => [fmtMoney(v), n]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e8edf3", fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12,marginBottom:-25 }} />
                  <Bar dataKey="revenue" name="Client Pays"  fill={EMERALD} radius={[3, 3, 0, 0]} barSize={14} />
                  <Bar dataKey="cost"    name="Salary Cost"  fill={AMBER}   radius={[3, 3, 0, 0]} barSize={14} />
                  <Bar dataKey="margin"  name="Net Margin"   fill={INDIGO}  radius={[3, 3, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
              </Box>
              </Box>
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <ChartCard title="Clients by Industry" accent={INDIGO}>
              <ResponsiveContainer width="100%"  height={220}>
                <PieChart>
                  <Pie data={industryData} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                    paddingAngle={3} dataKey="value">
                    {industryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
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
        </Grid>
      )}

      {/* ═══ TAB 1 — Client Table ════════════════════════════════════════ */}
      {tab === 1 && (
        <Box sx={{ bgcolor: "#fff", borderRadius: 2.5, border: "1px solid #e8edf3", p: 2.5 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography fontSize={14} fontWeight={800} color={NAVY}>All Clients — Financial Summary</Typography>
            <TextField size="small" placeholder="Search client / industry…"
              value={search} onChange={e => setSearch(e.target.value)}
              sx={{ width: 240, "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }} />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: SLATE, textTransform: "uppercase", letterSpacing: 0.4, bgcolor: "#f9fafb" } }}>
                  <TableCell>Client</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Employees</TableCell>
                  <TableCell align="right">JDs</TableCell>
                  <TableCell align="right">Candidates</TableCell>
                  <TableCell align="right">Hired</TableCell>
                  <TableCell align="right">Conv %</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Salary Cost</TableCell>
                  <TableCell align="right">Net Margin</TableCell>
                  <TableCell align="right">Margin %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={12} align="center" sx={{ py: 4, color: SLATE }}>No clients found.</TableCell></TableRow>
                ) : filtered.map((c, i) => (
                  <TableRow key={i} hover >
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
                    {/* <TableCell>
                      <Chip label={c.relationship_status} size="small"
                        sx={{ fontWeight: 700, fontSize: 10,
                          bgcolor: c.relationship_status === "Active" ? "#d1fae5" : "#f3f4f6",
                          color:   c.relationship_status === "Active" ? EMERALD : SLATE }} />
                    </TableCell> */}
                    <TableCell>
  {c.source === "resourcing_bot" ? (
    <Chip
      label="ResourcingBot"
      size="small"
      sx={{ fontWeight: 700, fontSize: 10, bgcolor: "#ede9fe", color: PURPLE }}
    />
  ) : (
    <Chip
      label={c.relationship_status}
      size="small"
      sx={{
        fontWeight: 700, fontSize: 10,
        bgcolor: c.relationship_status === "Active" ? "#d1fae5" : "#f3f4f6",
        color:   c.relationship_status === "Active" ? EMERALD : SLATE,
      }}
    />
  )}
</TableCell>
                    <TableCell align="right"><Typography fontSize={13} fontWeight={700} color={SKY}>{c.total_active_employees}</Typography></TableCell>
                    <TableCell align="right"><Typography fontSize={13} fontWeight={700} color={PURPLE}>{c.total_jds}</Typography></TableCell>
                    <TableCell align="right"><Typography fontSize={13} fontWeight={700}>{c.total_candidates}</Typography></TableCell>
                    <TableCell align="right">
                      <Chip label={c.total_hired} size="small"
                        sx={{ fontWeight: 700, fontSize: 11,
                          bgcolor: c.total_hired > 0 ? "#d1fae5" : "#f3f4f6",
                          color:   c.total_hired > 0 ? EMERALD : SLATE }} />
                    </TableCell>
                    <TableCell align="right"><Typography fontSize={12} color={INDIGO} fontWeight={600}>{c.conversion_rate}%</Typography></TableCell>
                    <TableCell align="right"><Typography fontSize={13} fontWeight={700} color={EMERALD}>{fmtMoney(c.total_billing_revenue)}</Typography></TableCell>
                    <TableCell align="right"><Typography fontSize={13} fontWeight={700} color={AMBER}>{fmtMoney(c.total_salary_cost)}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography fontSize={13} fontWeight={700} color={c.net_margin >= 0 ? EMERALD : ROSE}>
                        {fmtMoney(c.net_margin)}
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
                {/* Totals row */}
                <TableRow sx={{ bgcolor: "#f8fafc", "& td": { fontWeight: 800, borderTop: "2px solid #e8edf3" } }}>
                  <TableCell colSpan={3}><Typography fontSize={12} fontWeight={800} color={NAVY}>Grand Total</Typography></TableCell>
                  <TableCell align="right"><Typography fontSize={13} fontWeight={800} color={SKY}>{summary.total_active_employees}</Typography></TableCell>
                  <TableCell align="right"><Typography fontSize={13} fontWeight={800} color={PURPLE}>{summary.total_jds}</Typography></TableCell>
                  <TableCell align="right"><Typography fontSize={13} fontWeight={800}>{summary.total_candidates}</Typography></TableCell>
                  <TableCell align="right"><Typography fontSize={13} fontWeight={800} color={EMERALD}>{summary.total_hired}</Typography></TableCell>
                  <TableCell align="right"><Typography fontSize={12} fontWeight={800} color={INDIGO}>{summary.overall_conversion_rate}%</Typography></TableCell>
                  <TableCell align="right"><Typography fontSize={13} fontWeight={800} color={EMERALD}>{fmtMoney(summary.total_billing_revenue)}</Typography></TableCell>
                  <TableCell align="right"><Typography fontSize={13} fontWeight={800} color={AMBER}>{fmtMoney(summary.total_salary_cost)}</Typography></TableCell>
                  <TableCell align="right"><Typography fontSize={13} fontWeight={800} color={summary.net_margin >= 0 ? EMERALD : ROSE}>{fmtMoney(summary.net_margin)}</Typography></TableCell>
                  <TableCell align="right"><Chip label={`${summary.margin_pct}%`} size="small" sx={{ fontWeight: 700, bgcolor: "#d1fae5", color: EMERALD }} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ═══ TAB 2 — Headcount & Teams ══════════════════════════════════ */}
      {tab === 2 && (
 
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <ChartCard title="Active Headcount per Client" sub="Number of employees currently deployed">
            <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ width: Math.max(headcountByClient.length * 100, 400) }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={headcountByClient} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: SLATE }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: SLATE }} />
                  <RTooltip contentStyle={{ borderRadius: 10, border: "1px solid #e8edf3", fontSize: 12 }} />
                  <Bar dataKey="count" name="Employees" fill={SKY} radius={[4, 4, 0, 0]} barSize={28}>
                    {headcountByClient.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </Box></Box>
            </ChartCard>
          </Grid>
        </Grid>
     
      )}

      {/* ═══ TAB 3 — Candidate Pipeline ══════════════════════════════════ */}
      {tab === 3 && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <ChartCard title="Candidates per Client" sub="Total applied vs hired across all clients" accent={PURPLE}>
            <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ width: Math.max(clients.length * 10, 700) }}>
              <ResponsiveContainer width="100%" height={320}>

                  <BarChart
                    data={[...clients]
                        .sort((a, b) => b.total_candidates - a.total_candidates)
                        .slice(0, 12)
                        .map(c => ({
                        name: c.company_name,
                        applied: c.total_candidates,
                        hired: c.total_hired,
                        }))}
                    margin={{ top: 5, right: 10, bottom: 40, left: 0 }}
                    >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: SLATE }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: SLATE }} />
                  <RTooltip contentStyle={{ borderRadius: 10, border: "1px solid #e8edf3", fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12,marginBottom:-40 }} />
                  <Bar dataKey="applied" name="Applied" fill={PURPLE} radius={[3, 3, 0, 0]} barSize={14} />
                  <Bar dataKey="hired"   name="Hired"   fill={EMERALD} radius={[3, 3, 0, 0]} barSize={14} />
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
                  { label: "Total Candidates",  value: summary.total_candidates,                                   color: PURPLE },
                  { label: "Total Hired",        value: summary.total_hired,                                       color: EMERALD },
                  { label: "Conversion Rate",    value: `${summary.overall_conversion_rate}%`,                     color: INDIGO },
                  { label: "Total JDs",          value: summary.total_jds,                                         color: SKY },
                ].map(({ label, value, color }) => (
                  <Grid item xs={6} key={label}>
                    <Box sx={{ p: 2.5, borderRadius: 2, border: "1px solid #e8edf3", textAlign: "center" }}>
                      <Typography fontSize={32} fontWeight={800} color={color}>{value}</Typography>
                      <Typography fontSize={11} color={SLATE} textTransform="uppercase" letterSpacing={0.5} mt={0.5}>{label}</Typography>
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


{/* ── ZentreeLabs Internal Employees Card ─────────────────────── */}
{internalEmployees.length > 0 && (
  <Box sx={{ bgcolor: "#fff", borderRadius: 2.5, border: "2px solid #dbeafe", p: 2.5 }}>
    {/* Header */}
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
      <Box display="flex" alignItems="center" gap={1.5}>
        <Box sx={{ width: 4, height: 22, bgcolor: INDIGO, borderRadius: 2 }} />
        <Box>
          <Typography fontSize={14} fontWeight={800} color={NAVY}>
            ZentreeLabs Pvt Ltd — Internal Employees
          </Typography>
          <Typography fontSize={11} color={SLATE}>
            {internalEmployees.length} employee{internalEmployees.length > 1 ? "s" : ""} working internally
          </Typography>
        </Box>
      </Box>
      <Box display="flex" gap={1} flexWrap="wrap">
        <Chip label={`${internalEmployees.length} Employees`} size="small"
          sx={{ fontWeight: 700, bgcolor: "#dbeafe", color: INDIGO }} />
        <Chip label={`Billing: ${fmtMoney(internal?.total_billing)}`} size="small"
          sx={{ fontWeight: 700, bgcolor: "#d1fae5", color: EMERALD }} />
        <Chip label={`Salary: ${fmtMoney(internal?.total_salary)}`} size="small"
          sx={{ fontWeight: 700, bgcolor: "#fef3c7", color: AMBER }} />
        <Chip label={`Margin: ${fmtMoney(internal?.net_margin)}`} size="small"
          sx={{ fontWeight: 700,
            bgcolor: (internal?.net_margin || 0) >= 0 ? "#d1fae5" : "#fee2e2",
            color:   (internal?.net_margin || 0) >= 0 ? EMERALD   : ROSE }} />
      </Box>
    </Box>

    {/* ── Group by Department (or Project) ── */}
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
              <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: SLATE, textTransform: "uppercase", letterSpacing: 0.4, bgcolor: "#eff6ff" } }}>
                <TableCell width={32} />
                <TableCell>#</TableCell>
                <TableCell>Department</TableCell>
                <TableCell align="center">Employees</TableCell>
                <TableCell align="right">Internal Billing / mo</TableCell>
                <TableCell align="right">Salary / mo</TableCell>
                <TableCell align="right">Margin</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(grouped).map(([deptName, employees], idx) => {
                const deptTotalBilling = employees.reduce((s, e) => s + (e.client_billing_rate || 0), 0);
                const deptTotalSalary  = employees.reduce((s, e) => s + (e.employee_salary || 0), 0);
                const deptNetMargin    = deptTotalBilling - deptTotalSalary;
                const isOpen = expandedDept === deptName;

                return (
                  <React.Fragment key={deptName}>
                    {/* ── Department Summary Row (clickable) ── */}
                    <TableRow
                      hover
                      onClick={() => setExpandedDept(isOpen ? null : deptName)}
                      sx={{ cursor: "pointer", bgcolor: isOpen ? "#eff6ff" : "inherit",
                            "& td": { borderBottom: isOpen ? "none" : undefined } }}
                    >
                      <TableCell>
                        <IconButton size="small" sx={{ p: 0.5 }}>
                          {isOpen
                            ? <KeyboardArrowUpIcon fontSize="small" />
                            : <KeyboardArrowDownIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                      <TableCell><Typography fontSize={11} color={SLATE}>{idx + 1}</Typography></TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 800, bgcolor: INDIGO, borderRadius: 1 }}>
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
                        <Typography fontSize={13} fontWeight={700} color={EMERALD}>{fmtMoney(deptTotalBilling)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontSize={13} fontWeight={700} color={AMBER}>{fmtMoney(deptTotalSalary)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontSize={13} fontWeight={700} color={deptNetMargin >= 0 ? EMERALD : ROSE}>
                          {fmtMoney(deptNetMargin)}
                        </Typography>
                      </TableCell>
                    </TableRow>

                    {/* ── Expanded Employee Sub-Table ── */}
                    <TableRow sx={{ bgcolor: "#f8faff" }}>
                      <TableCell colSpan={7} sx={{ p: 0, borderBottom: isOpen ? undefined : "none" }}>
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <Box sx={{ mx: 2, my: 1.5 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 10, color: SLATE, textTransform: "uppercase", letterSpacing: 0.4, bgcolor: "#eff6ff" } }}>
                                  <TableCell>#</TableCell>
                                  <TableCell>Employee</TableCell>
                                  <TableCell>Designation</TableCell>
                                  <TableCell>Department</TableCell>
                                  <TableCell>Project</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell align="right">Internal Billing / mo</TableCell>
                                  <TableCell align="right">Salary / mo</TableCell>
                                  <TableCell align="right">Margin</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {employees.map((e, i) => {
                                  const margin = (e.client_billing_rate || 0) - (e.employee_salary || 0);
                                  return (
                                    <TableRow key={i} hover>
                                      <TableCell><Typography fontSize={11} color={SLATE}>{i + 1}</Typography></TableCell>
                                      <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                          <Avatar sx={{ width: 26, height: 26, fontSize: 10, fontWeight: 700, bgcolor: INDIGO, borderRadius: 1 }}>
                                            {e.name?.[0]?.toUpperCase()}
                                          </Avatar>
                                          <Box>
                                            <Typography fontSize={12} fontWeight={700}>{e.name}</Typography>
                                            <Typography fontSize={10} color={SLATE} fontFamily="monospace">{e.emp_id}</Typography>
                                          </Box>
                                        </Box>
                                      </TableCell>
                                      <TableCell><Typography fontSize={11}>{e.designation || "—"}</Typography></TableCell>
                                      <TableCell><Typography fontSize={11}>{e.department || "—"}</Typography></TableCell>
                                      <TableCell><Typography fontSize={11}>{e.project_name || "—"}</Typography></TableCell>
                                      <TableCell>
                                        <Chip label={e.status || "Active"} size="small"
                                          sx={{ fontWeight: 700, fontSize: 10,
                                            bgcolor: e.status === "Active" ? "#d1fae5" : "#f3f4f6",
                                            color:   e.status === "Active" ? EMERALD   : SLATE }} />
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography fontSize={12} fontWeight={700} color={EMERALD}>
                                          {fmtMoney(e.client_billing_rate, e.billing_currency)}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography fontSize={12} fontWeight={700} color={AMBER}>
                                          {fmtMoney(e.employee_salary)}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography fontSize={12} fontWeight={700} color={margin >= 0 ? EMERALD : ROSE}>
                                          {fmtMoney(margin, e.billing_currency)}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                {/* Dept totals row */}
                                <TableRow sx={{ bgcolor: "#eff6ff" }}>
                                  <TableCell colSpan={6}>
                                    <Typography fontSize={12} fontWeight={800} color={NAVY}>{deptName} Total</Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography fontSize={13} fontWeight={800} color={EMERALD}>{fmtMoney(deptTotalBilling)}</Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography fontSize={13} fontWeight={800} color={AMBER}>{fmtMoney(deptTotalSalary)}</Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography fontSize={13} fontWeight={800} color={deptNetMargin >= 0 ? EMERALD : ROSE}>
                                      {fmtMoney(deptNetMargin)}
                                    </Typography>
                                  </TableCell>
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

              {/* Grand Total Row */}
              <TableRow sx={{ bgcolor: "#eff6ff" }}>
                <TableCell colSpan={4}>
                  <Typography fontSize={12} fontWeight={800} color={NAVY}>Internal Total</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontSize={13} fontWeight={800} color={EMERALD}>{fmtMoney(internal?.total_billing)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontSize={13} fontWeight={800} color={AMBER}>{fmtMoney(internal?.total_salary)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontSize={13} fontWeight={800} color={(internal?.net_margin || 0) >= 0 ? EMERALD : ROSE}>
                    {fmtMoney(internal?.net_margin)}
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

    {/* ── Client-Deployed Employees Card ──────────────────────────── */}
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
            Client-Deployed Employees ({allEngagements.length})
          </Typography>
          <Typography fontSize={11} color={SLATE}>Click a client row to view employees</Typography>
        </Box>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 11, color: SLATE, textTransform: "uppercase", letterSpacing: 0.4, bgcolor: "#f9fafb" } }}>
              <TableCell width={32} />
              <TableCell>#</TableCell>
              <TableCell>Client</TableCell>
              <TableCell align="center">Employees</TableCell>
              <TableCell align="right">Billing / mo</TableCell>
              <TableCell align="right">Salary / mo</TableCell>
              <TableCell align="right">Margin</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(grouped).map(([clientName, employees], idx) => {
              const clientTotalBilling = employees.reduce((s, e) => s + (e.client_billing_rate || 0), 0);
              const clientTotalSalary  = employees.reduce((s, e) => s + (e.employee_salary || 0), 0);
              const clientNetMargin    = clientTotalBilling - clientTotalSalary;
              const isOpen = expandedClient === clientName;

              return (
                <React.Fragment key={clientName}>
                  {/* ── Client Summary Row (clickable) ── */}
                  <TableRow
                    hover
                    onClick={() => setExpandedClient(isOpen ? null : clientName)}
                    sx={{ cursor: "pointer", bgcolor: isOpen ? "#f0fdf4" : "inherit",
                          "& td": { borderBottom: isOpen ? "none" : undefined } }}
                  >
                    <TableCell>
                      <IconButton size="small" sx={{ p: 0.5 }}>
                        {isOpen ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell><Typography fontSize={11} color={SLATE}>{idx + 1}</Typography></TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 800, bgcolor: EMERALD, borderRadius: 1 }}>
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
                      <Typography fontSize={13} fontWeight={700} color={EMERALD}>{fmtMoney(clientTotalBilling)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontSize={13} fontWeight={700} color={AMBER}>{fmtMoney(clientTotalSalary)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontSize={13} fontWeight={700} color={clientNetMargin >= 0 ? EMERALD : ROSE}>
                        {fmtMoney(clientNetMargin)}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  {/* ── Expanded Employee Sub-Table ── */}
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    <TableCell colSpan={7} sx={{ p: 0, borderBottom: isOpen ? undefined : "none" }}>
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <Box sx={{ mx: 2, my: 1.5 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 10, color: SLATE, textTransform: "uppercase", letterSpacing: 0.4, bgcolor: "#eff6ff" } }}>
                                <TableCell>#</TableCell>
                                <TableCell>Employee</TableCell>
                                <TableCell>Designation</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Project</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Client Pays</TableCell>
                                <TableCell align="right">We Pay</TableCell>
                                <TableCell align="right">Margin</TableCell>
                                <TableCell align="right">Tenure</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {employees.map((e, i) => {
                                const margin    = (e.client_billing_rate || 0) - (e.employee_salary || 0);
                                const tenureYrs = e.years_on_client;
                                const tenureTxt = tenureYrs == null ? "—"
                                  : tenureYrs < 1 ? `${Math.round(tenureYrs * 12)}mo`
                                  : `${tenureYrs.toFixed(1)}yr`;
                                return (
                                  <TableRow key={i} hover>
                                    <TableCell><Typography fontSize={11} color={SLATE}>{i + 1}</Typography></TableCell>
                                    <TableCell>
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <Avatar sx={{ width: 26, height: 26, fontSize: 10, fontWeight: 700, bgcolor: INDIGO, borderRadius: 1 }}>
                                          {e.name?.[0]?.toUpperCase()}
                                        </Avatar>
                                        <Box>
                                          <Typography fontSize={12} fontWeight={700}>{e.name}</Typography>
                                          <Typography fontSize={10} color={SLATE} fontFamily="monospace">{e.emp_id}</Typography>
                                        </Box>
                                      </Box>
                                    </TableCell>
                                    <TableCell><Typography fontSize={11}>{e.designation || "—"}</Typography></TableCell>
                                    <TableCell><Typography fontSize={11}>{e.department || "—"}</Typography></TableCell>
                                    <TableCell><Typography fontSize={11}>{e.project_name || "—"}</Typography></TableCell>
                                    <TableCell>
                                      <Chip label={e.status || "Active"} size="small"
                                        sx={{ fontWeight: 700, fontSize: 10,
                                          bgcolor: e.status === "Active" ? "#d1fae5" : "#f3f4f6",
                                          color:   e.status === "Active" ? EMERALD   : SLATE }} />
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography fontSize={12} fontWeight={700} color={EMERALD}>
                                        {fmtMoney(e.client_billing_rate, e.billing_currency)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography fontSize={12} fontWeight={700} color={AMBER}>
                                        {fmtMoney(e.employee_salary)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography fontSize={12} fontWeight={700} color={margin >= 0 ? EMERALD : ROSE}>
                                        {fmtMoney(margin, e.billing_currency)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Chip label={tenureTxt} size="small"
                                        sx={{ fontWeight: 600, fontSize: 10, bgcolor: "#dbeafe", color: INDIGO }} />
                                    </TableCell>
                                  </TableRow>
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