





import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  IconButton, Badge, Box, Typography, Chip, Button,
  CircularProgress, Divider, Tooltip, Fade, ClickAwayListener,
} from "@mui/material";
import {
  Notifications, NotificationsNone, Close, CheckCircleOutline,
  EventAvailable, EventNote, Work, PersonOff, AssignmentTurnedIn,
  DeleteOutline, DoneAll, FilterList, Inbox,
} from "@mui/icons-material";

const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

// ── Notification type config ─────────────────────────────────────────────────
const TYPE_CONFIG = {
  interview_today: {
    label:  "Today",
    icon:   <EventAvailable sx={{ fontSize: 16 }} />,
    bg:     "#fef3c7",
    border: "#fde68a",
    color:  "#92400e",
    dot:    "#f59e0b",
    pill:   { bgcolor: "#fef3c7", color: "#92400e" },
  },
  interview_upcoming: {
    label:  "Upcoming",
    icon:   <EventNote sx={{ fontSize: 16 }} />,
    bg:     "#eff6ff",
    border: "#bfdbfe",
    color:  "#1e40af",
    dot:    "#3b82f6",
    pill:   { bgcolor: "#eff6ff", color: "#1e40af" },
  },
  job_deadline: {
    label:  "Job",
    icon:   <Work sx={{ fontSize: 16 }} />,
    bg:     "#fff1f2",
    border: "#fecdd3",
    color:  "#9f1239",
    dot:    "#f43f5e",
    pill:   { bgcolor: "#fff1f2", color: "#9f1239" },
  },
  job_posted: {
    label:  "New Job",
    icon:   <Work sx={{ fontSize: 16 }} />,
    bg:     "#f0fdf4",
    border: "#bbf7d0",
    color:  "#166534",
    dot:    "#22c55e",
    pill:   { bgcolor: "#f0fdf4", color: "#166534" },
  },
  resume_expiring: {
    label:  "Resume",
    icon:   <PersonOff sx={{ fontSize: 16 }} />,
    bg:     "#fff7ed",
    border: "#fed7aa",
    color:  "#9a3412",
    dot:    "#f97316",
    pill:   { bgcolor: "#fff7ed", color: "#9a3412" },
  },
  exam_result: {
    label:  "Exam",
    icon:   <AssignmentTurnedIn sx={{ fontSize: 16 }} />,
    bg:     "#faf5ff",
    border: "#e9d5ff",
    color:  "#6b21a8",
    dot:    "#a855f7",
    pill:   { bgcolor: "#faf5ff", color: "#6b21a8" },
  },
};

const DEFAULT_CONFIG = {
  label:  "Info",
  icon:   <Notifications sx={{ fontSize: 16 }} />,
  bg:     "#f8fafc",
  border: "#e2e8f0",
  color:  "#475569",
  dot:    "#94a3b8",
  pill:   { bgcolor: "#f1f5f9", color: "#475569" },
};

const FILTERS = [
  { key: "all",               label: "All"       },
  { key: "interview_today",   label: "Today"     },
  { key: "interview_upcoming",label: "Upcoming"  },
  { key: "job_posted",        label: "Jobs"      },
  { key: "job_deadline",      label: "Deadlines" },
  { key: "resume_expiring",   label: "Resumes"   },
  { key: "exam_result",       label: "Exams"     },
];

const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ── Single notification row ──────────────────────────────────────────────────
function NotifRow({ n, onRead, onDelete }) {
  const cfg    = TYPE_CONFIG[n.type] || DEFAULT_CONFIG;
  const isRead = n.is_read;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    await onDelete(n._id);
  };

  return (
    <Box
      onClick={() => !isRead && onRead(n._id)}
      sx={{
        display: "flex", alignItems: "flex-start", gap: 1.5,
        px: 2, py: 1.5,
        bgcolor: isRead ? "transparent" : `${cfg.bg}`,
        borderLeft: isRead ? "3px solid transparent" : `3px solid ${cfg.dot}`,
        cursor: isRead ? "default" : "pointer",
        opacity: deleting ? 0.4 : 1,
        transition: "all 0.2s",
        "&:hover": {
          bgcolor: isRead ? "#f8fafc" : cfg.bg,
          "& .del-btn": { opacity: 1 },
        },
        position: "relative",
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 34, height: 34, borderRadius: "9px", flexShrink: 0,
          bgcolor: cfg.bg,
          border: `1px solid ${cfg.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: cfg.color,
          mt: 0.2,
        }}
      >
        {cfg.icon}
      </Box>

      {/* Content */}
      <Box flex={1} minWidth={0}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Typography
            sx={{
              fontSize: 12.5, fontWeight: isRead ? 500 : 700,
              color: isRead ? "#64748b" : "#0f172a",
              lineHeight: 1.4,
            }}
          >
            {n.title}
          </Typography>
          {!isRead && (
            <Box
              sx={{
                width: 7, height: 7, borderRadius: "50%",
                bgcolor: cfg.dot, flexShrink: 0, mt: 0.6,
              }}
            />
          )}
        </Box>

        <Typography
          sx={{
            fontSize: 11.5, color: "#64748b", lineHeight: 1.5, mt: 0.2,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}
        >
          {n.message}
        </Typography>

        {/* Meta row */}
        <Box display="flex" alignItems="center" gap={1} mt={0.6} flexWrap="wrap">
          <Chip
            label={cfg.label}
            size="small"
            sx={{
              ...cfg.pill, height: 18, fontSize: 10, fontWeight: 700,
              borderRadius: "5px",
            }}
          />

          {/* Meeting link shortcut */}
          {n.meta?.meeting_link && (
            <Chip
              label="Join Meet"
              size="small"
              component="a"
              href={n.meta.meeting_link}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              sx={{
                height: 18, fontSize: 10, fontWeight: 700,
                bgcolor: "#f0fdf4", color: "#15803d",
                borderRadius: "5px", cursor: "pointer",
                "&:hover": { bgcolor: "#dcfce7" },
              }}
            />
          )}

          {/* MCQ score for exam notifications */}
          {n.meta?.mcq_total > 0 && (
            <Chip
              label={`MCQ ${n.meta.mcq_score}%`}
              size="small"
              sx={{
                height: 18, fontSize: 10, fontWeight: 700,
                bgcolor: n.meta.mcq_score >= 70 ? "#f0fdf4" : "#fef3c7",
                color:   n.meta.mcq_score >= 70 ? "#166534"  : "#92400e",
                borderRadius: "5px",
              }}
            />
          )}

          <Typography sx={{ fontSize: 10, color: "#94a3b8", ml: "auto" }}>
            {timeAgo(n.created_at)}
          </Typography>
        </Box>
      </Box>

      {/* Delete btn — shown on hover */}
      <Tooltip title="Delete">
        <IconButton
          className="del-btn"
          size="small"
          onClick={handleDelete}
          sx={{
            opacity: 0, transition: "opacity 0.15s",
            flexShrink: 0, width: 26, height: 26,
            color: "#94a3b8",
            "&:hover": { color: "#ef4444", bgcolor: "#fef2f2" },
          }}
        >
          <DeleteOutline sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function GlobalNotifications() {
  const [open,    setOpen]    = useState(false);
  const [notifs,  setNotifs]  = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState("all");
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE}/notifications/`, { headers: getHeaders() });
      const data = await res.json();
      setNotifs(data.data  || []);
      setUnread(data.unread || 0);
    } catch {}
  }, []);

  // Poll every 30 s
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const markRead = async (id) => {
    await fetch(`${BASE}/notifications/${id}/read`, {
      method: "PUT", headers: getHeaders(),
    });
    setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, is_read: true } : n));
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    await fetch(`${BASE}/notifications/read-all`, {
      method: "PUT", headers: getHeaders(),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const deleteNotif = async (id) => {
    await fetch(`${BASE}/notifications/${id}`, {
      method: "DELETE", headers: getHeaders(),
    });
    const deleted = notifs.find((n) => n._id === id);
    setNotifs((prev) => prev.filter((n) => n._id !== id));
    if (deleted && !deleted.is_read) setUnread((u) => Math.max(0, u - 1));
  };

  // Filtered list
  const filtered = filter === "all"
    ? notifs
    : notifs.filter((n) => n.type === filter);

  const unreadFiltered = filtered.filter((n) => !n.is_read).length;

  // Count per type for filter badges
  const countByType = notifs.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + (!n.is_read ? 1 : 0);
    return acc;
  }, {});

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: "relative" }}>

        {/* ── Bell button ── */}
        <Tooltip title="Notifications">
          <IconButton
            onClick={() => { setOpen((p) => !p); if (!open) load(); }}
            sx={{
              width: 36, height: 36, borderRadius: "10px",
              bgcolor: open ? "#eff6ff" : "#f8fafc",
              border: `1px solid ${open ? "#bfdbfe" : "#e2e8f0"}`,
              color: open ? "#1d4ed8" : "#64748b",
              "&:hover": { bgcolor: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" },
              transition: "all 0.15s",
            }}
          >
            <Badge
              badgeContent={unread}
              max={99}
              sx={{
                "& .MuiBadge-badge": {
                  bgcolor: "#ef4444", color: "#fff",
                  fontSize: 9, fontWeight: 800,
                  minWidth: 16, height: 16,
                  border: "1.5px solid #fff",
                },
              }}
            >
              {unread > 0
                ? <Notifications sx={{ fontSize: 19 }} />
                : <NotificationsNone sx={{ fontSize: 19 }} />}
            </Badge>
          </IconButton>
        </Tooltip>

        {/* ── Dropdown Panel ── */}
        <Fade in={open}>
          <Box
            ref={panelRef}
            sx={{
              position: "fixed",
              top: 64, right: 12,
              width: 420,
              maxHeight: "80vh",
              zIndex: 1400,
              bgcolor: "#fff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 60px rgba(15,23,42,0.15), 0 4px 16px rgba(15,23,42,0.08)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >

            {/* Header */}
            <Box
              sx={{
                px: 2.5, pt: 2, pb: 1.5,
                background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
                flexShrink: 0,
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Notifications sx={{ color: "#fff", fontSize: 18 }} />
                  <Typography sx={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>
                    Notifications
                  </Typography>
                  {unread > 0 && (
                    <Chip
                      label={`${unread} new`}
                      size="small"
                      sx={{
                        height: 18, fontSize: 10, fontWeight: 800,
                        bgcolor: "#ef4444", color: "#fff", borderRadius: "6px",
                      }}
                    />
                  )}
                </Box>
                <Box display="flex" gap={0.5}>
                  {unread > 0 && (
                    <Tooltip title="Mark all read">
                      <IconButton
                        size="small" onClick={markAllRead}
                        sx={{
                          color: "rgba(255,255,255,0.7)", borderRadius: "8px",
                          "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" },
                        }}
                      >
                        <DoneAll sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton
                    size="small" onClick={() => setOpen(false)}
                    sx={{
                      color: "rgba(255,255,255,0.7)", borderRadius: "8px",
                      "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" },
                    }}
                  >
                    <Close sx={{ fontSize: 17 }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Filter chips */}
              <Box
                display="flex" gap={0.6} sx={{
                  overflowX: "auto", pb: 0.5,
                  "&::-webkit-scrollbar": { height: 0 },
                }}
              >
                {FILTERS.map((f) => {
                  const cnt   = f.key === "all" ? unread : (countByType[f.key] || 0);
                  const isAct = filter === f.key;
                  return (
                    <Chip
                      key={f.key}
                      label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <span>{f.label}</span>
                          {cnt > 0 && (
                            <Box
                              sx={{
                                width: 14, height: 14, borderRadius: "50%",
                                bgcolor: isAct ? "#fff" : "#ef4444",
                                color:   isAct ? "#1e3a8a" : "#fff",
                                fontSize: 8, fontWeight: 800,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                            >
                              {cnt}
                            </Box>
                          )}
                        </Box>
                      }
                      size="small"
                      onClick={() => setFilter(f.key)}
                      sx={{
                        height: 24, fontSize: 11, fontWeight: 600,
                        cursor: "pointer", flexShrink: 0,
                        bgcolor: isAct ? "#fff" : "rgba(255,255,255,0.1)",
                        color:   isAct ? "#1e3a8a" : "rgba(255,255,255,0.8)",
                        border:  isAct ? "none" : "1px solid rgba(255,255,255,0.15)",
                        "&:hover": { bgcolor: isAct ? "#fff" : "rgba(255,255,255,0.18)" },
                        "& .MuiChip-label": { px: 1 },
                        transition: "all 0.15s",
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Notification list */}
            <Box
              sx={{
                flexGrow: 1, overflowY: "auto",
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-thumb": { bgcolor: "#e2e8f0", borderRadius: 4 },
              }}
            >
              {loading && (
                <Box display="flex" justifyContent="center" py={5}>
                  <CircularProgress size={26} sx={{ color: "#1d4ed8" }} />
                </Box>
              )}

              {!loading && filtered.length === 0 && (
                <Box
                  display="flex" flexDirection="column"
                  alignItems="center" justifyContent="center" py={7} gap={1.5}
                >
                  <Box
                    sx={{
                      width: 56, height: 56, borderRadius: "16px",
                      bgcolor: "#f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Inbox sx={{ fontSize: 28, color: "#cbd5e1" }} />
                  </Box>
                  <Typography sx={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
                    No notifications
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "#cbd5e1" }}>
                    {filter !== "all" ? "Try switching the filter" : "You're all caught up!"}
                  </Typography>
                </Box>
              )}

              {!loading && filtered.map((n, i) => (
                <React.Fragment key={n._id}>
                  <NotifRow n={n} onRead={markRead} onDelete={deleteNotif} />
                  {i < filtered.length - 1 && (
                    <Divider sx={{ opacity: 0.5, mx: 2 }} />
                  )}
                </React.Fragment>
              ))}
            </Box>

            {/* Footer */}
            {filtered.length > 0 && (
              <Box
                sx={{
                  px: 2, py: 1.2, borderTop: "1px solid #f1f5f9",
                  bgcolor: "#f8fafc", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>
                  {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
                  {unreadFiltered > 0 && ` · ${unreadFiltered} unread`}
                </Typography>
                {unread > 0 && (
                  <Button
                    size="small" onClick={markAllRead}
                    startIcon={<CheckCircleOutline sx={{ fontSize: 13 }} />}
                    sx={{
                      fontSize: 11, textTransform: "none", color: "#1d4ed8",
                      "&:hover": { bgcolor: "#eff6ff" }, borderRadius: "7px", py: 0.4,
                    }}
                  >
                    Mark all read
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Fade>
      </Box>
    </ClickAwayListener>
  );
}