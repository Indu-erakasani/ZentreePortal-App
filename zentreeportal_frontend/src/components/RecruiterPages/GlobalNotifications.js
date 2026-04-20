

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, IconButton, Badge, Popover, Typography, Divider,
  CircularProgress, Chip, Avatar, Tooltip, Button,
} from "@mui/material";
import {
  Notifications, NotificationsNone, CheckCircle, Circle,
  Work, People, Description, AssignmentInd, Assessment,
  PersonAdd, Assignment, Star, Warning, Info, DoneAll,
} from "@mui/icons-material";

// ── Design tokens ─────────────────────────────────────────────────────────────
const NAVY   = "#0f172a";
const INDIGO = "#1a237e";
const SLATE  = "#64748b";

const BASE = process.env.REACT_APP_API_BASE_URL;
const NOTIFICATION_BASE = process.env.REACT_APP_API_NOTIFICATIONS_URL

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const getUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
};

// ── API ───────────────────────────────────────────────────────────────────────
const fetchNotifications = () =>
  fetch(`${NOTIFICATION_BASE}/`, { headers: authHeaders() })
    .then(r => r.json())
    .catch(() => ({ data: [], unread: 0 }));

const markRead = (id) =>
  fetch(`${NOTIFICATION_BASE}/${id}/read`, { method: "PUT", headers: authHeaders() })
    .catch(() => {});

const markAllRead = () =>
  fetch(`${NOTIFICATION_BASE}/read-all`, { method: "PUT", headers: authHeaders() })
    .catch(() => {});

// ── Role-based notification type map ─────────────────────────────────────────

const ROLE_TYPES = {
  admin:     null,  // admin sees everything — no filter
  manager:   ["new_candidate", "placement", "job_update", "report", "team_update", "offer", "system"],
  recruiter: ["new_candidate", "job_update", "interview", "exam_submitted", "offer", "pipeline_update", "system"],
  hr:        ["new_hire", "onboarding", "bgv_update", "document_uploaded", "employee_update", "system"],
};

// ── Notification type → icon + color ─────────────────────────────────────────
const TYPE_META = {
  new_candidate:    { icon: <Description   sx={{ fontSize: 15 }} />, color: "#0277bd", bg: "#e3f2fd" },
  job_update:       { icon: <Work          sx={{ fontSize: 15 }} />, color: "#7b1fa2", bg: "#f3e5f5" },
  placement:        { icon: <Star          sx={{ fontSize: 15 }} />, color: "#15803d", bg: "#dcfce7" },
  report:           { icon: <Assessment    sx={{ fontSize: 15 }} />, color: "#0f172a", bg: "#f1f5f9" },
  team_update:      { icon: <People        sx={{ fontSize: 15 }} />, color: "#c2410c", bg: "#fff7ed" },
  offer:            { icon: <Star          sx={{ fontSize: 15 }} />, color: "#15803d", bg: "#dcfce7" },
  interview:        { icon: <People        sx={{ fontSize: 15 }} />, color: "#0277bd", bg: "#e3f2fd" },
  exam_submitted:   { icon: <Assignment    sx={{ fontSize: 15 }} />, color: "#e65100", bg: "#fff3e0" },
  pipeline_update:  { icon: <Description   sx={{ fontSize: 15 }} />, color: "#7b1fa2", bg: "#f3e5f5" },
  new_hire:         { icon: <PersonAdd     sx={{ fontSize: 15 }} />, color: "#15803d", bg: "#dcfce7" },
  onboarding:       { icon: <AssignmentInd sx={{ fontSize: 15 }} />, color: INDIGO,    bg: "#e8eaf6" },
  bgv_update:       { icon: <CheckCircle   sx={{ fontSize: 15 }} />, color: "#0f766e", bg: "#f0fdfa" },
  document_uploaded:{ icon: <Description   sx={{ fontSize: 15 }} />, color: "#854d0e", bg: "#fef9c3" },
  employee_update:  { icon: <People        sx={{ fontSize: 15 }} />, color: "#c2410c", bg: "#fff7ed" },
  system:           { icon: <Info          sx={{ fontSize: 15 }} />, color: SLATE,     bg: "#f8fafc" },
  warning:          { icon: <Warning       sx={{ fontSize: 15 }} />, color: "#d97706", bg: "#fef9c3" },
  default:          { icon: <Circle        sx={{ fontSize: 15 }} />, color: SLATE,     bg: "#f1f5f9" },
};

const getMeta = (type) => TYPE_META[type] || TYPE_META.default;

const fmtTime = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function GlobalNotifications() {
  const user        = getUser();
  const role        = user?.role || "recruiter";
  const userId      = user?.id   || user?._id || "";
  const allowedTypes = ROLE_TYPES[role] ?? null;  // null = no filter (admin)

  const [notifs,      setNotifs]      = useState([]);
  const [unread,      setUnread]      = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [anchorEl,    setAnchorEl]    = useState(null);
  const intervalRef   = useRef(null);
  const open = Boolean(anchorEl);

  // ── Fetch & filter ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetchNotifications();
      let   list = res.data || [];

      // Client-side role filter (backend should also filter, this is defense-in-depth)
      if (allowedTypes) {
        list = list.filter(n => allowedTypes.includes(n.type));
      }

      // User-specific: show only notifications for this user OR broadcast ones
      list = list.filter(n =>
        !n.target_user_id ||              
        n.target_user_id === userId ||  
        n.target_role    === role        
      );

      setNotifs(list);
      setUnread(list.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Notification fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [allowedTypes, userId, role]);

  // Poll every 30 s
  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOpen  = (e) => { setAnchorEl(e.currentTarget); };
  const handleClose = ()  => setAnchorEl(null);

  const handleMarkRead = async (id) => {
    await markRead(id);
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleMarkAll = async () => {
    await markAllRead();
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  // ── Role label for empty state ──────────────────────────────────────────────
  const roleLabel = {
    admin:     "all",
    manager:   "your team",
    recruiter: "your candidates",
    hr:        "onboarding & employees",
  }[role] || "you";

  return (
    <>
      {/* Bell icon */}
      <Tooltip title="Notifications">
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{
            color: open ? INDIGO : SLATE,
            bgcolor: open ? "#e8eaf6" : "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px", width: 34, height: 34,
            "&:hover": { bgcolor: "#f1f5f9", borderColor: "#cbd5e1" },
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
                minWidth: 16, height: 16, padding: "0 3px",
              },
            }}
          >
            {unread > 0
              ? <Notifications fontSize="small" />
              : <NotificationsNone fontSize="small" />}
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top",    horizontal: "right" }}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1.5, width: 360, borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
            overflow: "hidden",
          },
        }}
      >
        {/* Header */}
        <Box sx={{
          px: 2.5, py: 2,
          background: `linear-gradient(135deg, #0d1b4b 0%, ${INDIGO} 100%)`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
              Notifications
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 11, mt: 0.2 }}>
              Showing updates for {roleLabel}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {unread > 0 && (
              <Chip
                label={`${unread} new`}
                size="small"
                sx={{ bgcolor: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, height: 20 }}
              />
            )}
            {loading && <CircularProgress size={14} sx={{ color: "rgba(255,255,255,0.6)" }} />}
          </Box>
        </Box>

        {/* Mark all read */}
        {unread > 0 && (
          <Box sx={{ px: 2.5, py: 1, bgcolor: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
            <Button
              size="small"
              startIcon={<DoneAll sx={{ fontSize: 14 }} />}
              onClick={handleMarkAll}
              sx={{
                fontSize: 11, fontWeight: 600, color: INDIGO,
                textTransform: "none", p: 0,
                "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
              }}
            >
              Mark all as read
            </Button>
          </Box>
        )}

        {/* Notification list */}
        <Box sx={{ maxHeight: 420, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#e2e8f0", borderRadius: 2 } }}>

          {notifs.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={5} gap={1.5}>
              <NotificationsNone sx={{ fontSize: 40, color: "#cbd5e1" }} />
              <Typography sx={{ fontSize: 13, color: SLATE, fontWeight: 600 }}>
                No notifications yet
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#94a3b8", textAlign: "center", px: 3 }}>
                Updates related to {roleLabel} will appear here.
              </Typography>
            </Box>
          ) : (
            notifs.map((n, i) => {
              const meta = getMeta(n.type);
              return (
                <Box
                  key={n._id || i}
                  onClick={() => !n.is_read && handleMarkRead(n._id)}
                  sx={{
                    px: 2.5, py: 1.8,
                    display: "flex", alignItems: "flex-start", gap: 1.5,
                    borderBottom: i < notifs.length - 1 ? "1px solid #f8fafc" : "none",
                    bgcolor: n.is_read ? "transparent" : "#f8f9ff",
                    cursor: n.is_read ? "default" : "pointer",
                    transition: "background 0.15s",
                    "&:hover": { bgcolor: n.is_read ? "#fafafa" : "#f0f1ff" },
                    position: "relative",
                  }}
                >
                  {/* Unread dot */}
                  {!n.is_read && (
                    <Box sx={{
                      position: "absolute", left: 8, top: "50%",
                      transform: "translateY(-50%)",
                      width: 6, height: 6, borderRadius: "50%",
                      bgcolor: "#3b82f6",
                    }} />
                  )}

                  {/* Type icon */}
                  <Box sx={{
                    width: 32, height: 32, borderRadius: "9px", flexShrink: 0,
                    bgcolor: meta.bg, color: meta.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {meta.icon}
                  </Box>

                  {/* Content */}
                  <Box flex={1} minWidth={0}>
                    <Typography sx={{
                      fontSize: 13, fontWeight: n.is_read ? 400 : 700,
                      color: n.is_read ? "#334155" : NAVY,
                      lineHeight: 1.4,
                      overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>
                      {n.title || n.message}
                    </Typography>
                    {n.title && n.message && (
                      <Typography sx={{
                        fontSize: 11, color: SLATE, mt: 0.3,
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}>
                        {n.message}
                      </Typography>
                    )}
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>
                        {fmtTime(n.created_at)}
                      </Typography>
                      {n.type && (
                        <Chip
                          label={n.type.replace(/_/g, " ")}
                          size="small"
                          sx={{
                            height: 16, fontSize: 9, fontWeight: 600,
                            bgcolor: meta.bg, color: meta.color,
                            textTransform: "capitalize",
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* Footer */}
        {notifs.length > 0 && (
          <Box sx={{ px: 2.5, py: 1.5, borderTop: "1px solid #f1f5f9", bgcolor: "#fafafa",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 11, color: SLATE }}>
              {notifs.length} notification{notifs.length !== 1 ? "s" : ""}
            </Typography>
            <Button size="small" onClick={() => { load(); }}
              sx={{ fontSize: 11, color: INDIGO, textTransform: "none", p: 0,
                "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>
              Refresh
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
}