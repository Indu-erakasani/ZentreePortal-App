

import React from "react";
import {
  Box, Grid, Typography, Button, TextField, MenuItem,
  Chip, CircularProgress, Alert, Avatar, Divider,
  DialogContent, DialogActions, Card, CardContent,
  LinearProgress, IconButton, Tooltip,
} from "@mui/material";
import {
  Edit, CheckCircle, Cancel, Code, Quiz, QuestionAnswer,
  AccessTime, Assignment, Save,
} from "@mui/icons-material";

// ── API ───────────────────────────────────────────────────────────────────────
const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

const getTrackingByResume = (resume_id) =>
  fetch(`${BASE}/tracking/by-resume/${resume_id}`, { headers: getHeaders() }).then(handle);

const createTracking = (payload) =>
  fetch(`${BASE}/tracking/`, {
    method: "POST", headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handle);

const getExamsByCandidate = (candidate_id) =>
  fetch(`${BASE}/exams/by-candidate/${candidate_id}`, { headers: getHeaders() }).then(handle);

const updateExamScore = (exam_id, payload) =>
  fetch(`${BASE}/exams/${exam_id}/score`, {
    method: "PUT", headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handle);

// ── Constants ─────────────────────────────────────────────────────────────────
export const STAGES = [
  "Screening", "Technical Round 1", "Technical Round 2",
  "HR Round", "Manager Round", "Final Round",
  "Offer Stage", "Negotiation", "Offer Accepted",
  "Offer Declined", "Joined", "Rejected", "Withdrawn",
];

export const STATUS_COLOR = {
  New: "default", "In Review": "info", Shortlisted: "primary",
  Interviewed: "warning", Offered: "success", Hired: "success",
  Rejected: "error", "On Hold": "warning",
};

export const STAGE_COLOR = {
  Screening: "default",
  "Technical Round 1": "info", "Technical Round 2": "info",
  "HR Round": "primary", "Manager Round": "primary", "Final Round": "primary",
  "Offer Stage": "warning", Negotiation: "warning",
  "Offer Accepted": "success", Joined: "success",
  "Offer Declined": "error", Rejected: "error", Withdrawn: "error",
};

const SCORE_LABEL = ["", "Poor", "Below Avg", "Average", "Good", "Excellent"];

const DIFF_STYLE = {
  Easy:   { bg: "#e8f5e9", border: "#a5d6a7", text: "#1b5e20" },
  Medium: { bg: "#fff8e1", border: "#ffe082", text: "#e65100" },
  Hard:   { bg: "#fce4ec", border: "#f48fb1", text: "#880e4f" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export const nameInitials = (name = "") =>
  name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

export const fmtSalary = (v) => {
  if (!v) return "—";
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${Number(v).toLocaleString("en-IN")}`;
};

export const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const fmt = (val) => {
  if (!val) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
};

const scoreColor = (s) =>
  s >= 80 ? "#2e7d32" : s >= 60 ? "#1565c0" : s >= 40 ? "#f57c00" : "#c62828";
const scoreBg = (s) =>
  s >= 80 ? "#e8f5e9" : s >= 60 ? "#e3f2fd" : s >= 40 ? "#fff8e1" : "#fce4ec";

const DetailRow = ({ label, value }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center"
    sx={{ py: 1, borderBottom: "1px solid #f0f0f0", "&:last-child": { borderBottom: "none" } }}>
    <Typography fontSize={13} color="text.secondary">{label}</Typography>
    <Typography fontSize={13} fontWeight={600} textAlign="right">{value ?? "—"}</Typography>
  </Box>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  EXAM TAB INNER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── MCQ Answer Card ───────────────────────────────────────────────────────────
function MCQAnswerCard({ ans, index }) {
  const diffStyle = DIFF_STYLE[ans.difficulty] || {};
  return (
    <Card sx={{ mb: 1.5, borderRadius: 2,
      border: `1.5px solid ${ans.is_correct ? "#a5d6a7" : "#ef9a9a"}`,
      bgcolor: ans.is_correct ? "#f9fff9" : "#fff9f9",
    }}>
      <CardContent sx={{ pb: "10px !important", pt: "12px !important" }}>
        <Box display="flex" alignItems="flex-start" gap={1} mb={1.2} flexWrap="wrap">
          <Chip label={`Q${index + 1}`} size="small"
            sx={{ bgcolor: "#7b1fa2", color: "#fff", fontWeight: 700, fontSize: 10 }} />
          {ans.difficulty && (
            <Chip label={ans.difficulty} size="small"
              sx={{ fontSize: 9, bgcolor: diffStyle.bg, color: diffStyle.text,
                    border: `1px solid ${diffStyle.border}` }} />
          )}
          {ans.topic && <Chip label={ans.topic} size="small" variant="outlined" sx={{ fontSize: 9 }} />}
          <Box ml="auto">
            {ans.is_correct
              ? <Chip label="Correct ✓" size="small" color="success"
                  sx={{ fontWeight: 700, fontSize: 10 }} />
              : <Chip label="Wrong ✗" size="small" color="error"
                  sx={{ fontWeight: 700, fontSize: 10 }} />}
          </Box>
        </Box>

        <Typography fontWeight={600} fontSize={13} mb={1.2} color="text.primary">
          {ans.question_text}
        </Typography>

        <Box display="flex" flexDirection="column" gap={0.5}>
          {(ans.options || []).map((opt, j) => {
            const isSelected = opt === ans.selected_option;
            const isCorrect  = (ans.correct_answer || []).includes(opt);
            let bgcolor = "transparent", borderColor = "#eeeeee", color = "text.primary";
            if (isCorrect)               { bgcolor = "#e8f5e9"; borderColor = "#4caf50"; color = "#1b5e20"; }
            if (isSelected && !isCorrect){ bgcolor = "#fce4ec"; borderColor = "#e57373"; color = "#c62828"; }
            return (
              <Box key={j} sx={{ px: 1.5, py: 0.6, borderRadius: 1.5, border: "1px solid",
                borderColor, bgcolor, display: "flex", alignItems: "center", gap: 1 }}>
                {isSelected && isCorrect   && <CheckCircle sx={{ fontSize: 14, color: "#2e7d32", flexShrink: 0 }} />}
                {isSelected && !isCorrect  && <Cancel      sx={{ fontSize: 14, color: "#c62828", flexShrink: 0 }} />}
                {!isSelected && isCorrect  && <CheckCircle sx={{ fontSize: 14, color: "#2e7d32", opacity: 0.5, flexShrink: 0 }} />}
                {!isSelected && !isCorrect && <Box sx={{ width: 14, flexShrink: 0 }} />}
                <Typography fontSize={12} color={color} flex={1}>{opt}</Typography>
                {isSelected && !isCorrect && <Typography fontSize={10} color="#c62828" fontStyle="italic">Your answer</Typography>}
                {isCorrect                && <Typography fontSize={10} color="#2e7d32" fontWeight={700}>✓ Correct</Typography>}
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Subjective Answer Card ─────────────────────────────────────────────────────
function SubjectiveAnswerCard({ ans, index, examId, onScored }) {
  const [editing, setEditing] = React.useState(false);
  const [score,   setScore]   = React.useState(ans.manual_score ?? "");
  const [saving,  setSaving]  = React.useState(false);
  const [err,     setErr]     = React.useState("");
  const diffStyle = DIFF_STYLE[ans.difficulty] || {};

  const save = async () => {
    const s = Number(score);
    if (isNaN(s) || s < 0 || s > 100) { setErr("Score must be 0–100"); return; }
    setSaving(true); setErr("");
    try {
      await updateExamScore(examId, { subjective_score: s });
      setEditing(false);
      onScored?.();
    } catch { setErr("Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <Card sx={{ mb: 1.5, borderRadius: 2, border: "1px solid #90caf9" }}>
      <CardContent sx={{ pb: "10px !important", pt: "12px !important" }}>
        <Box display="flex" alignItems="flex-start" gap={1} mb={1.2} flexWrap="wrap">
          <Chip label={`Q${index + 1}`} size="small"
            sx={{ bgcolor: "#0277bd", color: "#fff", fontWeight: 700, fontSize: 10 }} />
          {ans.skill && <Chip label={ans.skill} size="small" variant="outlined"
            sx={{ fontSize: 9, borderColor: "#0277bd", color: "#0277bd" }} />}
          {ans.difficulty && <Chip label={ans.difficulty} size="small"
            sx={{ fontSize: 9, bgcolor: diffStyle.bg, color: diffStyle.text,
                  border: `1px solid ${diffStyle.border}` }} />}
          <Box ml="auto" display="flex" alignItems="center" gap={0.8}>
            {!editing ? (
              <>
                {ans.manual_score != null
                  ? <Chip label={`${ans.manual_score}/100`} size="small" color="primary"
                      sx={{ fontWeight: 700, fontSize: 10 }} />
                  : <Chip label="Not scored" size="small" color="warning" sx={{ fontSize: 10 }} />}
                <Tooltip title="Set score">
                  <IconButton size="small" onClick={() => setEditing(true)}>
                    <Edit sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <TextField size="small" type="number" value={score}
                  onChange={e => setScore(e.target.value)}
                  sx={{ width: 70 }} inputProps={{ min: 0, max: 100 }}
                  placeholder="0–100" error={!!err} />
                <Button size="small" variant="contained" onClick={save} disabled={saving}
                  sx={{ minWidth: 56, fontSize: 11 }}>
                  {saving ? <CircularProgress size={12} color="inherit" /> : "Save"}
                </Button>
                <Button size="small" onClick={() => { setEditing(false); setErr(""); }}
                  sx={{ fontSize: 11, minWidth: 40 }}>
                  Cancel
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Typography fontWeight={600} fontSize={13} mb={1}>{ans.question_text}</Typography>
        <Box sx={{ p: 1.5, bgcolor: "#f5f7fa", borderRadius: 1.5, border: "1px solid #e0e0e0", minHeight: 50 }}>
          {ans.answer
            ? <Typography fontSize={12} color="text.primary" lineHeight={1.8}
                sx={{ whiteSpace: "pre-wrap" }}>{ans.answer}</Typography>
            : <Typography fontSize={12} color="text.disabled" fontStyle="italic">No answer provided</Typography>}
        </Box>
        {err && <Alert severity="error" sx={{ mt: 0.8, py: 0 }}>{err}</Alert>}
      </CardContent>
    </Card>
  );
}

// ── Coding Answer Card ─────────────────────────────────────────────────────────
function CodingAnswerCard({ ans, index, examId, onScored }) {
  const [editing, setEditing] = React.useState(false);
  const [score,   setScore]   = React.useState(ans.manual_score ?? "");
  const [saving,  setSaving]  = React.useState(false);
  const [err,     setErr]     = React.useState("");
  const statusOk = ans.run_status === "Accepted";

  const save = async () => {
    const s = Number(score);
    if (isNaN(s) || s < 0 || s > 100) { setErr("Score must be 0–100"); return; }
    setSaving(true); setErr("");
    try {
      await updateExamScore(examId, { coding_score: s });
      setEditing(false);
      onScored?.();
    } catch { setErr("Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <Card sx={{ mb: 1.5, borderRadius: 2, border: "1px solid #3d3d5c", overflow: "hidden" }}>
      {/* Terminal header */}
      <Box sx={{ bgcolor: "#2d2d3f", px: 2, py: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box display="flex" gap={0.5}>
          {["#ff5f57","#febc2e","#28c840"].map(c => (
            <Box key={c} sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: c }} />
          ))}
        </Box>
        <Code sx={{ fontSize: 13, color: "#82aaff" }} />
        <Typography fontSize={11} fontWeight={700} color="#82aaff" flex={1}>
          Problem {index + 1}
          {ans.topic && <span style={{ color: "#a9b1d6", fontWeight: 400 }}> · {ans.topic}</span>}
        </Typography>
        {ans.programming_language && (
          <Chip label={ans.programming_language} size="small"
            sx={{ fontSize: 9, bgcolor: "#1a1a2e", color: "#82aaff", border: "1px solid #414868" }} />
        )}
        {/* Score control */}
        {!editing ? (
          <>
            {ans.manual_score != null
              ? <Chip label={`${ans.manual_score}/100`} size="small"
                  sx={{ bgcolor: "#1b5e20", color: "#fff", fontWeight: 700, fontSize: 10 }} />
              : <Chip label="Not scored" size="small"
                  sx={{ bgcolor: "#e65100", color: "#fff", fontSize: 10 }} />}
            <Tooltip title="Set score">
              <IconButton size="small" sx={{ color: "#82aaff" }} onClick={() => setEditing(true)}>
                <Edit sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Box display="flex" alignItems="center" gap={0.8}>
            <TextField size="small" type="number" value={score}
              onChange={e => setScore(e.target.value)}
              sx={{ width: 65, bgcolor: "#1a1a2e",
                "& .MuiInputBase-input": { color: "#fff", fontSize: 11, py: 0.5 },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#414868" } }}
              inputProps={{ min: 0, max: 100 }} placeholder="0–100" />
            <Button size="small" onClick={save} disabled={saving}
              sx={{ bgcolor: "#2e7d32", color: "#fff", fontSize: 10, minWidth: 48,
                    "&:hover": { bgcolor: "#1b5e20" } }}>
              {saving ? <CircularProgress size={11} color="inherit" /> : "Save"}
            </Button>
            <Button size="small" onClick={() => setEditing(false)}
              sx={{ color: "#82aaff", fontSize: 10, minWidth: 40 }}>
              Cancel
            </Button>
          </Box>
        )}
      </Box>

      {/* Problem statement */}
      <Box sx={{ bgcolor: "#1e1e2e", px: 2, py: 1.5, borderBottom: "1px solid #3d3d5c" }}>
        <Typography fontSize={11} fontWeight={700} color="#a9b1d6" mb={0.3}>Problem</Typography>
        <Typography fontSize={12} color="#cdd6f4" lineHeight={1.7}
          sx={{ whiteSpace: "pre-wrap", fontFamily: "'Fira Code','Consolas',monospace" }}>
          {ans.question_text}
        </Typography>
      </Box>

      {/* Submitted code */}
      <Box sx={{ bgcolor: "#1a1a2e", px: 2, py: 1.5, borderBottom: "1px solid #3d3d5c" }}>
        <Typography fontSize={11} fontWeight={700} color="#a9b1d6" mb={0.3}>Submitted Code</Typography>
        {ans.code
          ? <Typography fontSize={12} color="#a6e22e" lineHeight={1.7}
              sx={{ whiteSpace: "pre-wrap", fontFamily: "'Fira Code','Consolas',monospace" }}>
              {ans.code}
            </Typography>
          : <Typography fontSize={12} color="#6272a4" fontStyle="italic">No code submitted</Typography>}
      </Box>

      {/* Run output */}
      {(ans.run_output || ans.run_stderr || ans.run_status) && (
        <Box sx={{ bgcolor: "#0d0d1a", px: 2, py: 1.5 }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography fontSize={11} fontWeight={700} color="#a9b1d6">Run Output</Typography>
            {ans.run_status && (
              <Chip label={ans.run_status} size="small"
                sx={{ fontSize: 9, bgcolor: statusOk ? "#1b5e20" : "#b71c1c", color: "#fff" }} />
            )}
          </Box>
          {ans.run_output && (
            <Typography fontSize={12} color="#a6e22e"
              sx={{ whiteSpace: "pre-wrap", fontFamily: "'Fira Code','Consolas',monospace" }}>
              {ans.run_output}
            </Typography>
          )}
          {ans.run_stderr && (
            <Typography fontSize={12} color="#f92672"
              sx={{ whiteSpace: "pre-wrap", fontFamily: "'Fira Code','Consolas',monospace" }}>
              {ans.run_stderr}
            </Typography>
          )}
          {!ans.run_output && !ans.run_stderr && (
            <Typography fontSize={12} color="#6272a4" fontStyle="italic">Candidate did not run code.</Typography>
          )}
        </Box>
      )}
      {err && <Alert severity="error" sx={{ m: 1, py: 0 }}>{err}</Alert>}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  EXAM TAB PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function ExamTabPanel({ candidateId }) {
  const [exams,        setExams]        = React.useState([]);
  const [loadingExams, setLoadingExams] = React.useState(true);
  const [selectedExam, setSelectedExam] = React.useState(null);
  const [answerTab,    setAnswerTab]    = React.useState(0);
  const [overallScore, setOverallScore] = React.useState("");
  const [notes,        setNotes]        = React.useState("");
  const [saving,       setSaving]       = React.useState(false);

  const loadExams = React.useCallback(() => {
    setLoadingExams(true);
    getExamsByCandidate(candidateId)
      .then(res => {
        const list = res.data || [];
        setExams(list);
        const completed = list.find(e => e.status === "Completed");
        const pick      = completed || list[0] || null;
        setSelectedExam(pick);
        if (pick) { setOverallScore(pick.overall_score ?? ""); setNotes(pick.score_notes || ""); }
      })
      .catch(() => setExams([]))
      .finally(() => setLoadingExams(false));
  }, [candidateId]);

  React.useEffect(() => { loadExams(); }, [loadExams]);

  const selectExam = (e) => {
    setSelectedExam(e); setAnswerTab(0);
    setOverallScore(e.overall_score ?? ""); setNotes(e.score_notes || "");
  };

  const saveOverall = async () => {
    if (!selectedExam) return;
    setSaving(true);
    try {
      await updateExamScore(selectedExam._id, { overall_score: Number(overallScore), notes });
      loadExams();
    } catch {}
    finally { setSaving(false); }
  };

  if (loadingExams) return (
    <Box display="flex" justifyContent="center" py={8}><CircularProgress size={32} /></Box>
  );

  if (exams.length === 0) return (
    <Box display="flex" flexDirection="column" alignItems="center" py={8} gap={2}>
      <Assignment sx={{ fontSize: 56, color: "#e0e0e0" }} />
      <Typography color="text.secondary" fontWeight={600}>No screening exams sent yet</Typography>
      <Typography fontSize={13} color="text.disabled">
        Send a screening exam from the Candidates table using the assignment icon.
      </Typography>
    </Box>
  );

  const exam = selectedExam;

  // ── Merge stored answers with original questions as fallback ──────────────
  // This handles both old exams (no question_text stored) and new ones
  const mcqAnswers = (exam?.answers?.mcq || []).map(ans => {
    const origQ = (exam?.mcq_questions || [])[ans.question_index] || {};
    return {
      question_index:  ans.question_index,
      question_text:   ans.question_text  || origQ.question   || `Question ${ans.question_index + 1}`,
      options:         (ans.options?.length > 0 ? ans.options : origQ.options) || [],
      topic:           ans.topic          || origQ.topic       || "",
      difficulty:      ans.difficulty     || origQ.difficulty  || "",
      // correct answer: from stored answer, or from original question's _correct field
      correct_answer:  ans.correct_answer?.length > 0
                         ? ans.correct_answer
                         : (origQ._correct || origQ.correct_answer || []),
      selected_option: ans.selected_option || "",
      is_correct:      ans.is_correct,
    };
  });

  const subjAnswers = (exam?.answers?.subjective || []).map(ans => {
    const origQ = (exam?.subjective_questions || [])[ans.question_index] || {};
    return {
      question_index: ans.question_index,
      question_text:  ans.question_text || origQ.question   || `Question ${ans.question_index + 1}`,
      skill:          ans.skill         || origQ.skill       || "",
      difficulty:     ans.difficulty    || origQ.difficulty  || "",
      answer:         ans.answer        || "",
      manual_score:   ans.manual_score  ?? null,
    };
  });

  const codeAnswers = (exam?.answers?.coding || []).map(ans => {
    const origQ = (exam?.coding_questions || [])[ans.question_index] || {};
    return {
      question_index:       ans.question_index,
      question_text:        ans.question_text        || origQ.question             || `Question ${ans.question_index + 1}`,
      programming_language: ans.programming_language || origQ.programming_language || "Python",
      difficulty:           ans.difficulty            || origQ.difficulty           || "",
      topic:                ans.topic                 || origQ.topic                || "",
      code:                 ans.code                  || "",
      run_output:           ans.run_output             || "",
      run_stderr:           ans.run_stderr             || "",
      run_status:           ans.run_status             || "",
      manual_score:         ans.manual_score           ?? null,
    };
  });

  const mcqPct = exam?.mcq_total > 0
    ? Math.round(((exam?.mcq_correct || 0) / exam.mcq_total) * 100) : null;

  const answerTabs = [
    { label: `MCQ (${mcqAnswers.length})`,        idx: 0, show: mcqAnswers.length  > 0, color: "#7b1fa2" },
    { label: `Subjective (${subjAnswers.length})`, idx: 1, show: subjAnswers.length > 0, color: "#0277bd" },
    { label: `Coding (${codeAnswers.length})`,     idx: 2, show: codeAnswers.length > 0, color: "#2e7d32" },
  ].filter(t => t.show);

  return (
    <Box display="flex" height="100%" minHeight={400}>

      {/* ── Left: exam list ────────────────────────────────────────────── */}
      <Box sx={{ width: 200, borderRight: "1px solid #e0e0e0", bgcolor: "#fafafa",
                 flexShrink: 0, overflowY: "auto" }}>
        <Typography fontSize={11} fontWeight={700} color="text.secondary"
          textTransform="uppercase" letterSpacing={0.5} px={2} pt={1.5} pb={1}>
          Sent Exams
        </Typography>
        {exams.map(e => {
          const isActive = exam?._id === e._id;
          const pct      = e.mcq_total > 0
            ? Math.round(((e.mcq_correct || 0) / e.mcq_total) * 100) : null;
          return (
            <Box key={e._id} onClick={() => selectExam(e)}
              sx={{
                px: 2, py: 1.2, cursor: "pointer", borderBottom: "1px solid #f0f0f0",
                bgcolor:    isActive ? "#e3f2fd" : "transparent",
                borderLeft: isActive ? "3px solid #1565c0" : "3px solid transparent",
                "&:hover":  { bgcolor: "#f5f7fa" },
              }}>
              <Typography fontSize={12} fontWeight={700} noWrap>{e.exam_id}</Typography>
              <Typography fontSize={10} color="text.secondary" noWrap>{e.job_title}</Typography>
              <Box display="flex" gap={0.5} mt={0.4} flexWrap="wrap">
                <Chip label={e.status} size="small" sx={{
                  fontSize: 9, height: 16, fontWeight: 700,
                  bgcolor: e.status === "Completed"   ? "#e8f5e9"
                         : e.status === "In Progress" ? "#e3f2fd"
                         : e.status === "Sent"        ? "#fff3e0" : "#f5f5f5",
                  color:   e.status === "Completed"   ? "#2e7d32"
                         : e.status === "In Progress" ? "#0277bd"
                         : e.status === "Sent"        ? "#e65100" : "#757575",
                }} />
                {pct !== null && (
                  <Chip label={`${pct}%`} size="small" sx={{
                    fontSize: 9, height: 16, bgcolor: scoreBg(pct), color: scoreColor(pct),
                  }} />
                )}
              </Box>
              <Typography fontSize={9} color="text.disabled" mt={0.2}>
                {e.sent_at ? new Date(e.sent_at).toLocaleDateString("en-IN") : ""}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* ── Right: exam detail ─────────────────────────────────────────── */}
      <Box flex={1} display="flex" flexDirection="column" overflow="hidden">
        {!exam ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <Typography color="text.secondary">Select an exam</Typography>
          </Box>
        ) : exam.status !== "Completed" ? (
          <Box display="flex" flexDirection="column" justifyContent="center"
            alignItems="center" flex={1} gap={2} p={4}>
            <AccessTime sx={{ fontSize: 56, color: "#e0e0e0" }} />
            <Typography fontWeight={700} color="text.secondary">
              {exam.status === "Sent" ? "Exam not yet started" : "Exam in progress"}
            </Typography>
            <Typography fontSize={13} color="text.disabled">
              Results appear here once the candidate submits.
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
              {exam.expires_at && (
                <Chip label={`Expires ${new Date(exam.expires_at).toLocaleDateString("en-IN")}`}
                  size="small" color="warning" />
              )}
              <Chip label={`${exam.time_limit_minutes} min exam`} size="small" />
              {exam.mcq_count        > 0 && <Chip label={`${exam.mcq_count} MCQ`}               size="small" sx={{ bgcolor: "#f3e5f5", color: "#7b1fa2" }} />}
              {exam.subjective_count > 0 && <Chip label={`${exam.subjective_count} Subjective`} size="small" sx={{ bgcolor: "#e3f2fd", color: "#0277bd" }} />}
              {exam.coding_count     > 0 && <Chip label={`${exam.coding_count} Coding`}         size="small" sx={{ bgcolor: "#e8f5e9", color: "#2e7d32" }} />}
            </Box>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" flex={1} overflow="hidden">

            {/* Score summary strip */}
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #e0e0e0",
                       bgcolor: "#f8f9fa", flexShrink: 0 }}>
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={1.2}>
                <Box>
                  <Typography fontSize={10} color="text.secondary">Submitted</Typography>
                  <Typography fontSize={12} fontWeight={600}>
                    {exam.submitted_at ? new Date(exam.submitted_at).toLocaleString("en-IN") : "—"}
                  </Typography>
                </Box>
                {mcqPct !== null && (
                  <>
                    <Divider orientation="vertical" flexItem />
                    <Box textAlign="center">
                      <Typography fontSize={10} color="text.secondary">MCQ</Typography>
                      <Typography fontSize={20} fontWeight={800} color={scoreColor(mcqPct)}>
                        {mcqPct}%
                      </Typography>
                      <Typography fontSize={10} color="text.secondary">
                        {exam.mcq_correct}/{exam.mcq_total} correct
                      </Typography>
                    </Box>
                  </>
                )}
                {exam.subjective_score != null && (
                  <>
                    <Divider orientation="vertical" flexItem />
                    <Box textAlign="center">
                      <Typography fontSize={10} color="text.secondary">Subjective</Typography>
                      <Typography fontSize={20} fontWeight={800} color={scoreColor(exam.subjective_score)}>
                        {exam.subjective_score}/100
                      </Typography>
                    </Box>
                  </>
                )}
                {exam.coding_score != null && (
                  <>
                    <Divider orientation="vertical" flexItem />
                    <Box textAlign="center">
                      <Typography fontSize={10} color="text.secondary">Coding</Typography>
                      <Typography fontSize={20} fontWeight={800} color={scoreColor(exam.coding_score)}>
                        {exam.coding_score}/100
                      </Typography>
                    </Box>
                  </>
                )}
                {exam.overall_score != null && (
                  <Box ml="auto" px={2} py={0.8}
                    sx={{ bgcolor: scoreBg(exam.overall_score), borderRadius: 2,
                          border: `1.5px solid ${scoreColor(exam.overall_score)}40` }}>
                    <Typography fontSize={10} color="text.secondary" textAlign="center">Overall</Typography>
                    <Typography fontSize={22} fontWeight={800} textAlign="center"
                      color={scoreColor(exam.overall_score)}>
                      {exam.overall_score}/100
                    </Typography>
                  </Box>
                )}
              </Box>

              {mcqPct !== null && (
                <LinearProgress variant="determinate" value={mcqPct}
                  sx={{ height: 4, borderRadius: 3, bgcolor: "#e0e0e0", mb: 1.2,
                        "& .MuiLinearProgress-bar": { bgcolor: scoreColor(mcqPct) } }}
                />
              )}

              <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                <TextField size="small" type="number" label="Overall Score"
                  value={overallScore} onChange={e => setOverallScore(e.target.value)}
                  sx={{ width: 140 }} inputProps={{ min: 0, max: 100 }} placeholder="0–100" />
                <TextField size="small" label="Notes" value={notes}
                  onChange={e => setNotes(e.target.value)}
                  sx={{ flex: 1, minWidth: 160 }} placeholder="Optional recruiter notes" />
                <Button variant="contained" size="small" onClick={saveOverall}
                  disabled={saving || overallScore === ""}
                  startIcon={saving ? <CircularProgress size={13} color="inherit" /> : <Save sx={{ fontSize: 14 }} />}
                  sx={{ fontWeight: 700, fontSize: 12 }}>
                  {saving ? "Saving…" : "Save Score"}
                </Button>
              </Box>
            </Box>

            {/* Answer type tab switcher */}
            {answerTabs.length > 0 && (
              <Box sx={{ px: 2, pt: 1.2, pb: 0, display: "flex", gap: 1,
                         flexShrink: 0, borderBottom: "1px solid #e0e0e0" }}>
                {answerTabs.map(t => (
                  <Button key={t.idx} size="small" onClick={() => setAnswerTab(t.idx)}
                    variant={answerTab === t.idx ? "contained" : "outlined"}
                    sx={{
                      fontWeight: 700, textTransform: "none", fontSize: 11, mb: 1,
                      bgcolor:     answerTab === t.idx ? t.color : "transparent",
                      borderColor: t.color,
                      color:       answerTab === t.idx ? "#fff" : t.color,
                      "&:hover":   { bgcolor: answerTab === t.idx ? t.color : `${t.color}15` },
                    }}>
                    {t.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Scrollable answer list */}
            <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 2 }}>
              {answerTab === 0 && (
                mcqAnswers.length > 0
                  ? mcqAnswers.map((ans, i) => <MCQAnswerCard key={i} ans={ans} index={i} />)
                  : <Typography color="text.secondary" textAlign="center" py={4}>No MCQ questions.</Typography>
              )}
              {answerTab === 1 && (
                subjAnswers.length > 0
                  ? subjAnswers.map((ans, i) => (
                      <SubjectiveAnswerCard key={i} ans={ans} index={i}
                        examId={exam._id} onScored={loadExams} />
                    ))
                  : <Typography color="text.secondary" textAlign="center" py={4}>No subjective questions.</Typography>
              )}
              {answerTab === 2 && (
                codeAnswers.length > 0
                  ? codeAnswers.map((ans, i) => (
                      <CodingAnswerCard key={i} ans={ans} index={i}
                        examId={exam._id} onScored={loadExams} />
                    ))
                  : <Typography color="text.secondary" textAlign="center" py={4}>No coding questions.</Typography>
              )}
            </Box>

          </Box>
        )}
      </Box>
    </Box>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function CandidateDetailContent({
  candidate,
  jobs            = [],
  recruiters      = [],
  onClose,
  onEdit,
  onViewPdf,
  placementData   = null,
  onEditPlacement = null,
}) {
  const [tracking,    setTracking]    = React.useState([]);
  const [loadingT,    setLoadingT]    = React.useState(true);
  const [tab,         setTab]         = React.useState(0);
  const [addPipeline, setAddPipeline] = React.useState(false);
  const [pipeForm,    setPipeForm]    = React.useState({
    job_id: "", current_stage: "Screening", recruiter: "", notes: "", next_step: "",
  });
  const [pipeError,  setPipeError]  = React.useState("");
  const [pipeSaving, setPipeSaving] = React.useState(false);

  // Tabs: Profile | Pipeline | Screening Exam | (Billing)
  const TABS = [
    "Profile & Resume",
    "Pipeline & Interviews",
    "Screening Exam",
    ...(placementData ? ["Billing"] : []),
  ];

  const loadTracking = React.useCallback(() => {
    setLoadingT(true);
    getTrackingByResume(candidate.resume_id)
      .then(res => setTracking(res.data || []))
      .catch(() => setTracking([]))
      .finally(() => setLoadingT(false));
  }, [candidate.resume_id]);

  React.useEffect(() => { loadTracking(); }, [loadTracking]);

  const activeTrack = tracking[0];

  const handlePipeChange = e => setPipeForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleAddPipeline = async () => {
    if (!pipeForm.job_id) { setPipeError("Please select a job"); return; }
    setPipeSaving(true); setPipeError("");
    try {
      const job = jobs.find(j => j._id === pipeForm.job_id);
      await createTracking({
        resume_id:       candidate.resume_id?.trim(),
        candidate_name:  candidate.name,
        job_id:          job?.job_id      || "",
        job_title:       job?.title       || "",
        client_name:     job?.client_name || "",
        current_stage:   pipeForm.current_stage,
        recruiter:       pipeForm.recruiter,
        notes:           pipeForm.notes,
        next_step:       pipeForm.next_step,
        pipeline_status: "Active",
      });
      setAddPipeline(false);
      setPipeForm({ job_id: "", current_stage: "Screening", recruiter: "", notes: "", next_step: "" });
      loadTracking();
    } catch (err) {
      setPipeError(err?.message || "Failed to add to pipeline");
    } finally { setPipeSaving(false); }
  };

  return (
    <>
      <DialogContent sx={{ p: 0 }}>

        {/* ── Header strip ────────────────────────────────────────────────── */}
        <Box sx={{ px: 3, pt: 3, pb: 0, borderBottom: "1px solid #e0e0e0" }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "#1a237e",
                          fontSize: "1.3rem", fontWeight: 700 }}>
              {nameInitials(candidate.name)}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={800}>{candidate.name}</Typography>
              <Typography color="text.secondary" fontSize={13}>
                {candidate.current_role}
                {candidate.current_company ? ` · ${candidate.current_company}` : ""}
              </Typography>
              <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                <Chip label={candidate.status}
                  color={STATUS_COLOR[candidate.status] || "default"}
                  size="small" sx={{ fontWeight: 700 }} />
                {activeTrack && (
                  <Chip label={`Pipeline: ${activeTrack.current_stage}`}
                    color={STAGE_COLOR[activeTrack.current_stage] || "default"}
                    size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                )}
                {placementData && (
                  <>
                    <Chip label={placementData.candidate_status || "Active"}
                      color={{ Active:"success", Probation:"info", Confirmed:"primary",
                                Resigned:"default", Terminated:"error" }[placementData.candidate_status] || "default"}
                      size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                    <Chip label={`Payment: ${placementData.payment_status}`}
                      color={{ Paid:"success", Pending:"warning", Partial:"info", Overdue:"error" }[placementData.payment_status] || "default"}
                      size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
                  </>
                )}
              </Box>
            </Box>
          </Box>

          {/* Tab bar */}
          <Box display="flex" gap={0}>
            {TABS.map((label, i) => (
              <Box key={i} onClick={() => { setTab(i); setAddPipeline(false); }} sx={{
                px: 2, py: 1, cursor: "pointer",
                fontWeight: tab === i ? 700 : 400,
                fontSize: 13,
                borderBottom: tab === i ? "2px solid #1a237e" : "2px solid transparent",
                color: tab === i ? "#1a237e" : "text.secondary",
                transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 0.5,
              }}>
                {label === "Screening Exam" && <Assignment sx={{ fontSize: 14 }} />}
                {label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* ══ TAB 0 — Profile ══════════════════════════════════════════════ */}
        {tab === 0 && (
          <Box p={3}>
            <Grid container spacing={2} mb={2}>
              {[
                ["Email",           candidate.email],
                ["Phone",           candidate.phone || "—"],
                ["Location",        candidate.location || "—"],
                ["Experience",      `${candidate.experience} years`],
                ["Current Salary",  fmtSalary(candidate.current_salary)],
                ["Expected Salary", fmtSalary(candidate.expected_salary)],
                ["Notice Period",   candidate.notice_period || "—"],
                ["Source",          candidate.source || "—"],
              ].map(([label, val]) => (
                <Grid item xs={6} sm={4} key={label}>
                  <Typography fontSize={11} color="text.secondary" fontWeight={600}
                    textTransform="uppercase">{label}</Typography>
                  <Typography fontWeight={600} fontSize={13}>{val}</Typography>
                </Grid>
              ))}
            </Grid>

            {candidate.skills && (
              <Box mb={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600}
                  textTransform="uppercase" mb={1}>Skills</Typography>
                <Box display="flex" flexWrap="wrap" gap={0.8}>
                  {candidate.skills.split(",").filter(Boolean).map((s, i) => (
                    <Chip key={i} label={s.trim()} size="small" variant="outlined"
                      sx={{ fontSize: 11, borderColor: "#1a237e", color: "#1a237e" }} />
                  ))}
                </Box>
              </Box>
            )}

            {candidate.linked_job_title && (
              <Box p={1.5} bgcolor="#e8eaf6" borderRadius={2} mb={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600}
                  textTransform="uppercase" mb={0.3}>Applied For</Typography>
                <Typography fontWeight={700} color="primary.dark">{candidate.linked_job_title}</Typography>
              </Box>
            )}

            {candidate.notes && (
              <Box p={1.5} bgcolor="#f5f5f5" borderRadius={2} mb={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={600}
                  textTransform="uppercase" mb={0.3}>Notes</Typography>
                <Typography fontSize={13}>{candidate.notes}</Typography>
              </Box>
            )}

            <Box p={2} borderRadius={2} display="flex" alignItems="center" gap={2}
              sx={{ bgcolor: "#f5f5f5", border: "1px solid #e0e0e0" }}>
              <Box flex={1}>
                <Typography fontWeight={700} fontSize={13}
                  color={candidate.resume_file ? "success.dark" : "text.secondary"}>
                  {candidate.resume_file ? "Original Resume PDF" : "No resume file uploaded"}
                </Typography>
                <Typography fontSize={11} color="text.secondary">
                  {candidate.resume_file
                    ? `Stored as ${candidate.resume_file} · click to view`
                    : "Upload via drag-and-drop to attach the original resume"}
                </Typography>
              </Box>
              {candidate.resume_file && (
                <Button variant="contained" size="small" onClick={onViewPdf}>View PDF</Button>
              )}
            </Box>
          </Box>
        )}

        {/* ══ TAB 1 — Pipeline & Interviews ═══════════════════════════════ */}
        {tab === 1 && (
          <Box p={3}>
            {addPipeline ? (
              <Box mb={3} p={2.5} borderRadius={2}
                sx={{ border: "1.5px solid #1a237e", bgcolor: "#f8f9ff" }}>
                <Typography fontWeight={700} fontSize={14} color="#1a237e" mb={2}>
                  Add to Pipeline
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField select fullWidth size="small" required label="Select Job"
                      name="job_id" value={pipeForm.job_id} onChange={handlePipeChange}>
                      <MenuItem value="">— Select a job —</MenuItem>
                      {jobs.map(j => (
                        <MenuItem key={j._id} value={j._id}>
                          <Box>
                            <Typography fontSize={13} fontWeight={600}>{j.job_id} - {j.title}</Typography>
                            {j.client_name && <Typography fontSize={11} color="text.secondary">{j.client_name}</Typography>}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select fullWidth size="small" label="Starting Stage"
                      name="current_stage" value={pipeForm.current_stage} onChange={handlePipeChange}>
                      {STAGES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select fullWidth size="small" label="Recruiter"
                      name="recruiter" value={pipeForm.recruiter} onChange={handlePipeChange}>
                      <MenuItem value="">Select Recruiter</MenuItem>
                      {recruiters.map(r => (
                        <MenuItem key={r.id} value={`${r.first_name} ${r.last_name}`}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: "#1a237e" }}>
                              {r.first_name?.[0]}{r.last_name?.[0]}
                            </Avatar>
                            {r.first_name} {r.last_name}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Next Step" name="next_step"
                      value={pipeForm.next_step} onChange={handlePipeChange}
                      placeholder="e.g. Schedule technical interview" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={2} size="small" label="Notes"
                      name="notes" value={pipeForm.notes} onChange={handlePipeChange} />
                  </Grid>
                </Grid>
                {pipeError && <Alert severity="error" sx={{ mt: 1.5 }}>{pipeError}</Alert>}
                <Box display="flex" gap={1} mt={2} justifyContent="flex-end">
                  <Button size="small"
                    onClick={() => { setAddPipeline(false); setPipeError(""); }}
                    sx={{ textTransform: "none", color: "#64748b" }}>
                    Cancel
                  </Button>
                  <Button size="small" variant="contained" onClick={handleAddPipeline}
                    disabled={pipeSaving || !pipeForm.job_id}
                    sx={{ textTransform: "none", fontWeight: 700,
                          bgcolor: "#1a237e", "&:hover": { bgcolor: "#0d1757" } }}
                    endIcon={pipeSaving ? <CircularProgress size={14} color="inherit" /> : null}>
                    {pipeSaving ? "Adding…" : "Add to Pipeline"}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button size="small" variant="outlined" onClick={() => setAddPipeline(true)}
                  sx={{ textTransform: "none", fontWeight: 700,
                        borderColor: "#1a237e", color: "#1a237e" }}>
                  + Add to Pipeline
                </Button>
              </Box>
            )}

            {loadingT ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress size={32} /></Box>
            ) : tracking.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1}>
                <Typography color="text.secondary" fontWeight={600}>No pipeline records found</Typography>
                <Typography fontSize={13} color="text.disabled">
                  Click "+ Add to Pipeline" to start tracking this candidate.
                </Typography>
              </Box>
            ) : tracking.map((track, tIdx) => (
              <Box key={track._id} mb={tIdx < tracking.length - 1 ? 4 : 0}>
                {/* Track header */}
                <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
                  <Chip label={track.current_stage}
                    color={STAGE_COLOR[track.current_stage] || "default"}
                    size="small" sx={{ fontWeight: 700 }} />
                  <Chip label={track.pipeline_status} size="small" variant="outlined" />
                  {track.recruiter   && <Typography fontSize={12} color="text.secondary">Recruiter: <strong>{track.recruiter}</strong></Typography>}
                  {track.job_title   && <Typography fontSize={12} color="text.secondary">Job: <strong>{track.job_id}-{track.job_title}</strong></Typography>}
                  {track.client_name && <Typography fontSize={12} color="text.secondary">Client: <strong>{track.client_name}</strong></Typography>}
                </Box>

                {/* Stage history */}
                {track.stage_history?.length > 0 && (
                  <Box mb={3}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600}
                      textTransform="uppercase" mb={1.5}>Stage History</Typography>
                    <Box display="flex" flexDirection="column" gap={0}>
                      {track.stage_history.map((entry, i) => (
                        <Box key={i} display="flex" gap={1.5} alignItems="flex-start">
                          <Box display="flex" flexDirection="column" alignItems="center" sx={{ pt: 0.3 }}>
                            <Box sx={{
                              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                              bgcolor: i === track.stage_history.length - 1 ? "#1a237e" : "#90caf9",
                              border: "2px solid",
                              borderColor: i === track.stage_history.length - 1 ? "#1a237e" : "#e3f2fd",
                            }} />
                            {i < track.stage_history.length - 1 && (
                              <Box sx={{ width: 2, flexGrow: 1, minHeight: 20, bgcolor: "#e3f2fd", my: 0.3 }} />
                            )}
                          </Box>
                          <Box pb={1.5}>
                            <Typography fontWeight={600} fontSize={13}>{entry.stage}</Typography>
                            <Typography fontSize={11} color="text.secondary">
                              {fmtDate(entry.entered_at)}
                              {entry.exited_at ? ` → ${fmtDate(entry.exited_at)}` : " · current"}
                            </Typography>
                            {entry.notes && <Typography fontSize={12} color="text.secondary" mt={0.3}>{entry.notes}</Typography>}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Interviews */}
                {track.interviews?.length > 0 && (
                  <Box mb={3}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600}
                      textTransform="uppercase" mb={1.5}>
                      Interviews ({track.interviews.length})
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {track.interviews.map((iv, i) => (
                        <Box key={i} p={2} borderRadius={2}
                          sx={{ border: "1px solid #e0e0e0", bgcolor: "#fafafa" }}>
                          <Box display="flex" justifyContent="space-between"
                            alignItems="flex-start" mb={1}>
                            <Box>
                              <Typography fontWeight={700} fontSize={13}>
                                {iv.stage} — {iv.interview_type}
                              </Typography>
                              <Typography fontSize={11} color="text.secondary">
                                {iv.interviewer} · {fmtDate(iv.interview_date)}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={0.4} alignItems="center">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Box key={s} sx={{
                                  width: 12, height: 12, borderRadius: 1,
                                  bgcolor: s <= (iv.feedback_score || 0) ? "#1a237e" : "#e0e0e0",
                                }} />
                              ))}
                              <Typography fontSize={11} fontWeight={700} color="#1a237e" ml={0.5}>
                                {SCORE_LABEL[iv.feedback_score] || "—"}
                              </Typography>
                            </Box>
                          </Box>
                          {iv.feedback_summary && (
                            <Typography fontSize={12} mb={1}>{iv.feedback_summary}</Typography>
                          )}
                          <Box display="flex" gap={2} flexWrap="wrap">
                            {iv.strengths?.length > 0 && (
                              <Box flex={1} minWidth={120}>
                                <Typography fontSize={10} fontWeight={700} color="#2e7d32"
                                  textTransform="uppercase" mb={0.5}>Strengths</Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.4}>
                                  {iv.strengths.map((s, si) => (
                                    <Chip key={si} label={s} size="small"
                                      sx={{ fontSize: 10, height: 20, bgcolor: "#e8f5e9", color: "#1b5e20" }} />
                                  ))}
                                </Box>
                              </Box>
                            )}
                            {iv.weaknesses?.length > 0 && (
                              <Box flex={1} minWidth={120}>
                                <Typography fontSize={10} fontWeight={700} color="#c62828"
                                  textTransform="uppercase" mb={0.5}>Areas to Improve</Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.4}>
                                  {iv.weaknesses.map((w, wi) => (
                                    <Chip key={wi} label={w} size="small"
                                      sx={{ fontSize: 10, height: 20, bgcolor: "#ffebee", color: "#b71c1c" }} />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                          {iv.recommendation && (
                            <Box mt={1}>
                              <Chip label={`Recommendation: ${iv.recommendation}`} size="small"
                                color={iv.recommendation === "Strong Hire" ? "success"
                                     : iv.recommendation === "Hire"        ? "primary"
                                     : iv.recommendation === "No Hire"     ? "error" : "default"}
                                sx={{ fontSize: 10, fontWeight: 700 }} />
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Offer details */}
                {(track.salary_offered > 0 || track.offer_date || track.joining_date) && (
                  <Box mb={3} p={2} borderRadius={2}
                    sx={{ bgcolor: "#f3f8ff", border: "1px solid #bbdefb" }}>
                    <Typography fontSize={11} color="text.secondary" fontWeight={600}
                      textTransform="uppercase" mb={1.5}>Offer Details</Typography>
                    <Grid container spacing={1.5}>
                      {[
                        ["Salary Offered", track.salary_offered ? fmtSalary(track.salary_offered) : "—"],
                        ["Offer Status",   track.offer_status || "—"],
                        ["Offer Date",     fmtDate(track.offer_date)],
                        ["Joining Date",   fmtDate(track.joining_date)],
                      ].map(([label, val]) => (
                        <Grid item xs={6} key={label}>
                          <Typography fontSize={11} color="text.secondary" fontWeight={600}>{label}</Typography>
                          <Typography fontWeight={700} fontSize={13}>{val}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {(track.next_step || track.rejection_reason) && (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {track.next_step && (
                      <Box p={1.5} bgcolor="#fffde7" borderRadius={2}
                        sx={{ border: "1px solid #fff176" }}>
                        <Typography fontSize={11} fontWeight={600} color="#f57f17"
                          textTransform="uppercase">Next Step</Typography>
                        <Typography fontSize={13}>{track.next_step}</Typography>
                        {track.next_date && (
                          <Typography fontSize={11} color="text.secondary">
                            Due: {fmtDate(track.next_date)}
                          </Typography>
                        )}
                      </Box>
                    )}
                    {track.rejection_reason && (
                      <Box p={1.5} bgcolor="#ffebee" borderRadius={2}
                        sx={{ border: "1px solid #ffcdd2" }}>
                        <Typography fontSize={11} fontWeight={600} color="#c62828"
                          textTransform="uppercase">Rejection Reason</Typography>
                        <Typography fontSize={13}>{track.rejection_reason}</Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {tIdx < tracking.length - 1 && <Divider sx={{ mt: 3 }} />}
              </Box>
            ))}
          </Box>
        )}

        {/* ══ TAB 2 — Screening Exam ════════════════════════════════════════ */}
        {tab === 2 && (
          <ExamTabPanel candidateId={candidate._id} />
        )}

        {/* ══ TAB 3 — Billing (only when placementData passed) ════════════ */}
        {tab === (placementData ? 3 : -1) && placementData && (
          <Box p={3}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2.5}
              p={1.5} bgcolor="#e8eaf6" borderRadius={2}>
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600}
                  textTransform="uppercase">Placement ID</Typography>
                <Typography fontWeight={800} fontSize={16} color="#1a237e">
                  {placementData.placement_id || "—"}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 1.5 }} />
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600}
                  textTransform="uppercase">Offer Date</Typography>
                <Typography fontWeight={600} fontSize={13}>{fmtDate(placementData.offer_date)}</Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 1.5 }} />
              <Box>
                <Typography fontSize={11} color="text.secondary" fontWeight={600}
                  textTransform="uppercase">Joining Date</Typography>
                <Typography fontWeight={600} fontSize={13}>{fmtDate(placementData.joining_date)}</Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography fontSize={11} fontWeight={700} color="text.secondary"
                  textTransform="uppercase" letterSpacing={0.8} mb={1.5}>Employment</Typography>
                <DetailRow label="Job Title"     value={placementData.job_title} />
                <DetailRow label="Job ID"        value={placementData.job_id} />
                <DetailRow label="Client"        value={placementData.client_name} />
                <DetailRow label="Recruiter"     value={placementData.recruiter} />
                <DetailRow label="Annual Salary" value={fmt(placementData.final_ctc)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography fontSize={11} fontWeight={700} color="text.secondary"
                  textTransform="uppercase" letterSpacing={0.8} mb={1.5}>Billing</Typography>
                <DetailRow label="Billing Rate"     value={`${placementData.billing_percentage || 0}%`} />
                <DetailRow label="Billing Amount"   value={fmt(placementData.billing_amount)} />
                <DetailRow label="Invoice #"        value={placementData.invoice_number || "—"} />
                <DetailRow label="Payment Status"   value={placementData.payment_status} />
                <DetailRow label="Guarantee Period" value={`${placementData.guarantee_period || 0} days`} />
                <DetailRow label="Guarantee End"    value={fmtDate(placementData.guarantee_end_date)} />
              </Grid>
            </Grid>

            {placementData.notes && (
              <Box mt={2.5} p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
                <Typography fontSize={11} color="text.secondary" fontWeight={700}
                  textTransform="uppercase" mb={0.5}>Notes</Typography>
                <Typography fontSize={13}>{placementData.notes}</Typography>
              </Box>
            )}
          </Box>
        )}

      </DialogContent>

      {/* ── Footer actions ────────────────────────────────────────────────── */}
      <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #e0e0e0", gap: 1 }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="outlined" onClick={onEdit}>Edit Candidate</Button>
        {placementData && onEditPlacement && (
          <Button variant="contained" startIcon={<Edit />} onClick={onEditPlacement}
            sx={{ textTransform: "none", fontWeight: 700 }}>
            Edit Placement
          </Button>
        )}
      </DialogActions>
    </>
  );
}