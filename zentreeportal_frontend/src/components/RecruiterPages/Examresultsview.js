import React, { useState, useEffect } from "react";
import {
  Box, Typography, Chip, Avatar, Card, CardContent, Button,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, TextField, IconButton, Tooltip, LinearProgress,
} from "@mui/material";
import {
  CheckCircle, Cancel, Code, QuestionAnswer, Quiz, Assignment,
  Close as CloseIcon, Edit, Save, AccessTime,
} from "@mui/icons-material";

const BASE = process.env.REACT_APP_API_BASE_URL;

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const scoreColor = (score) =>
  score >= 80 ? "#2e7d32" : score >= 60 ? "#1565c0" : score >= 40 ? "#f57c00" : "#c62828";

const scoreBg = (score) =>
  score >= 80 ? "#e8f5e9" : score >= 60 ? "#e3f2fd" : score >= 40 ? "#fff8e1" : "#fce4ec";

const DIFF_STYLE = {
  Easy:   { bg: "#e8f5e9", border: "#a5d6a7", text: "#1b5e20" },
  Medium: { bg: "#fff8e1", border: "#ffe082", text: "#e65100" },
  Hard:   { bg: "#fce4ec", border: "#f48fb1", text: "#880e4f" },
};

// ── MCQ Answer Card ───────────────────────────────────────────────────────────
function MCQAnswerCard({ ans, index }) {
  const diffStyle = DIFF_STYLE[ans.difficulty] || {};
  return (
    <Card sx={{ mb: 2, borderRadius: 2,
      border: `1.5px solid ${ans.is_correct ? "#a5d6a7" : "#ef9a9a"}`,
      bgcolor: ans.is_correct ? "#f9fff9" : "#fff9f9",
    }}>
      <CardContent sx={{ pb: "12px !important" }}>
        {/* Header row */}
        <Box display="flex" alignItems="flex-start" gap={1.5} mb={1.5} flexWrap="wrap">
          <Chip label={`Q${index + 1}`} size="small"
            sx={{ bgcolor: "#7b1fa2", color: "#fff", fontWeight: 700, fontSize: 11 }} />
          {ans.difficulty && (
            <Chip label={ans.difficulty} size="small"
              sx={{ fontSize: 10, bgcolor: diffStyle.bg, color: diffStyle.text,
                    border: `1px solid ${diffStyle.border}` }} />
          )}
          {ans.topic && <Chip label={ans.topic} size="small" variant="outlined" sx={{ fontSize: 10 }} />}
          <Box ml="auto">
            {ans.is_correct
              ? <Chip label="Correct ✓" size="small" color="success" sx={{ fontWeight: 700 }} />
              : <Chip label="Wrong ✗" size="small" color="error" sx={{ fontWeight: 700 }} />}
          </Box>
        </Box>

        {/* Question text */}
        <Typography fontWeight={600} fontSize={13} mb={1.5} color="text.primary">
          {ans.question_text}
        </Typography>

        {/* Options */}
        <Box display="flex" flexDirection="column" gap={0.6}>
          {(ans.options || []).map((opt, j) => {
            const isSelected = opt === ans.selected_option;
            const isCorrect  = (ans.correct_answer || []).includes(opt);
            let bgcolor = "transparent", borderColor = "#e0e0e0", color = "text.primary";
            if (isCorrect)                      { bgcolor = "#e8f5e9"; borderColor = "#4caf50"; color = "#1b5e20"; }
            if (isSelected && !isCorrect)       { bgcolor = "#fce4ec"; borderColor = "#e57373"; color = "#c62828"; }
            return (
              <Box key={j} sx={{ px: 1.5, py: 0.8, borderRadius: 1.5, border: "1px solid",
                borderColor, bgcolor, display: "flex", alignItems: "center", gap: 1.5 }}>
                {isSelected && isCorrect  && <CheckCircle sx={{ fontSize: 16, color: "#2e7d32", flexShrink: 0 }} />}
                {isSelected && !isCorrect && <Cancel      sx={{ fontSize: 16, color: "#c62828", flexShrink: 0 }} />}
                {!isSelected && isCorrect && <CheckCircle sx={{ fontSize: 16, color: "#2e7d32", opacity: 0.5, flexShrink: 0 }} />}
                {!isSelected && !isCorrect && <Box sx={{ width: 16, height: 16, flexShrink: 0 }} />}
                <Typography fontSize={12} color={color}>{opt}</Typography>
                {isSelected && !isCorrect && (
                  <Typography fontSize={10} color="#c62828" ml="auto" fontStyle="italic">Your answer</Typography>
                )}
                {isCorrect && (
                  <Typography fontSize={10} color="#2e7d32" ml="auto" fontWeight={700}>Correct answer</Typography>
                )}
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
  const [editing,  setEditing]  = useState(false);
  const [score,    setScore]    = useState(ans.manual_score ?? "");
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState("");

  const diffStyle = DIFF_STYLE[ans.difficulty] || {};

  const saveScore = async () => {
    const s = Number(score);
    if (isNaN(s) || s < 0 || s > 100) { setSaveErr("Score must be 0–100"); return; }
    setSaving(true); setSaveErr("");
    try {
      await fetch(`${BASE}/exams/${examId}/score`, {
        method:  "PUT",
        headers: getHeaders(),
        body:    JSON.stringify({ subjective_score: s }),
      });
      setEditing(false);
      if (onScored) onScored();
    } catch { setSaveErr("Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <Card sx={{ mb: 2, borderRadius: 2, border: "1px solid #90caf9" }}>
      <CardContent sx={{ pb: "12px !important" }}>
        <Box display="flex" alignItems="flex-start" gap={1.5} mb={1.5} flexWrap="wrap">
          <Chip label={`Q${index + 1}`} size="small"
            sx={{ bgcolor: "#0277bd", color: "#fff", fontWeight: 700, fontSize: 11 }} />
          {ans.skill && <Chip label={ans.skill} size="small" variant="outlined"
            sx={{ fontSize: 10, borderColor: "#0277bd", color: "#0277bd" }} />}
          {ans.difficulty && <Chip label={ans.difficulty} size="small"
            sx={{ fontSize: 10, bgcolor: diffStyle.bg, color: diffStyle.text,
                  border: `1px solid ${diffStyle.border}` }} />}
          <Box ml="auto" display="flex" alignItems="center" gap={1}>
            {!editing ? (
              <>
                {ans.manual_score != null
                  ? <Chip label={`Score: ${ans.manual_score}/100`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  : <Chip label="Pending review" size="small" color="warning" />}
                <Tooltip title="Set score"><IconButton size="small" onClick={() => setEditing(true)}><Edit fontSize="small" /></IconButton></Tooltip>
              </>
            ) : (
              <>
                <TextField
                  size="small" type="number" placeholder="0–100"
                  value={score} onChange={e => setScore(e.target.value)}
                  sx={{ width: 80 }} inputProps={{ min: 0, max: 100 }}
                  error={!!saveErr}
                />
                <Button size="small" variant="contained" onClick={saveScore} disabled={saving}
                  startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <Save fontSize="small" />}>
                  Save
                </Button>
                <IconButton size="small" onClick={() => { setEditing(false); setSaveErr(""); }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        <Typography fontWeight={600} fontSize={13} mb={1.5}>{ans.question_text}</Typography>
        <Box sx={{ p: 2, bgcolor: "#f5f7fa", borderRadius: 1.5, border: "1px solid #e0e0e0", minHeight: 60 }}>
          {ans.answer
            ? <Typography fontSize={13} color="text.primary" lineHeight={1.8} sx={{ whiteSpace: "pre-wrap" }}>{ans.answer}</Typography>
            : <Typography fontSize={12} color="text.disabled" fontStyle="italic">No answer provided</Typography>}
        </Box>
        {saveErr && <Alert severity="error" sx={{ mt: 1, py: 0 }}>{saveErr}</Alert>}
      </CardContent>
    </Card>
  );
}

// ── Coding Answer Card ─────────────────────────────────────────────────────────
function CodingAnswerCard({ ans, index, examId, onScored }) {
  const [editing, setEditing] = useState(false);
  const [score,   setScore]   = useState(ans.manual_score ?? "");
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const saveScore = async () => {
    const s = Number(score);
    if (isNaN(s) || s < 0 || s > 100) { setSaveErr("Score must be 0–100"); return; }
    setSaving(true); setSaveErr("");
    try {
      await fetch(`${BASE}/exams/${examId}/score`, {
        method:  "PUT",
        headers: getHeaders(),
        body:    JSON.stringify({ coding_score: s }),
      });
      setEditing(false);
      if (onScored) onScored();
    } catch { setSaveErr("Save failed"); }
    finally { setSaving(false); }
  };

  const statusOk = ans.run_status === "Accepted";

  return (
    <Card sx={{ mb: 2, borderRadius: 2, border: "1px solid #3d3d5c", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ bgcolor: "#2d2d3f", px: 2, py: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box display="flex" gap={0.6}>
          {["#ff5f57","#febc2e","#28c840"].map(c => (
            <Box key={c} sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: c }} />
          ))}
        </Box>
        <Code sx={{ fontSize: 14, color: "#82aaff" }} />
        <Typography fontSize={12} fontWeight={700} color="#82aaff" flex={1}>
          Problem {index + 1}
          {ans.topic && <span style={{ color: "#a9b1d6", fontWeight: 400 }}> · {ans.topic}</span>}
        </Typography>
        {ans.programming_language && (
          <Chip label={ans.programming_language} size="small"
            sx={{ fontSize: 9, bgcolor: "#1a1a2e", color: "#82aaff", border: "1px solid #414868" }} />
        )}
        {/* Score */}
        {!editing ? (
          <>
            {ans.manual_score != null
              ? <Chip label={`Score: ${ans.manual_score}/100`} size="small" sx={{ bgcolor: "#1b5e20", color: "#fff", fontWeight: 700, fontSize: 10 }} />
              : <Chip label="Pending" size="small" sx={{ bgcolor: "#e65100", color: "#fff", fontSize: 10 }} />}
            <Tooltip title="Set score"><IconButton size="small" sx={{ color: "#82aaff" }} onClick={() => setEditing(true)}><Edit fontSize="small" /></IconButton></Tooltip>
          </>
        ) : (
          <Box display="flex" alignItems="center" gap={1}>
            <TextField size="small" type="number" placeholder="0–100" value={score}
              onChange={e => setScore(e.target.value)} sx={{ width: 70, bgcolor: "#1a1a2e",
                "& .MuiInputBase-input": { color: "#fff", fontSize: 12 },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#414868" } }}
              inputProps={{ min: 0, max: 100 }} />
            <Button size="small" variant="contained" onClick={saveScore} disabled={saving}
              sx={{ bgcolor: "#2e7d32", fontSize: 11, minWidth: 60 }}>
              {saving ? <CircularProgress size={12} color="inherit" /> : "Save"}
            </Button>
            <IconButton size="small" sx={{ color: "#82aaff" }} onClick={() => setEditing(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Problem statement */}
      <Box sx={{ bgcolor: "#1e1e2e", px: 2.5, py: 1.5, borderBottom: "1px solid #3d3d5c" }}>
        <Typography fontSize={12} fontWeight={700} color="#a9b1d6" mb={0.5}>Problem Statement</Typography>
        <Typography fontSize={12} color="#cdd6f4" lineHeight={1.8}
          sx={{ whiteSpace: "pre-wrap", fontFamily: "'Fira Code','Consolas',monospace" }}>
          {ans.question_text}
        </Typography>
      </Box>

      {/* Submitted code */}
      <Box sx={{ bgcolor: "#1a1a2e", px: 2.5, py: 1.5, borderBottom: "1px solid #3d3d5c" }}>
        <Typography fontSize={12} fontWeight={700} color="#a9b1d6" mb={0.5}>Submitted Code</Typography>
        {ans.code
          ? <Typography fontSize={12} color="#a6e22e"
              sx={{ whiteSpace: "pre-wrap", fontFamily: "'Fira Code','Consolas',monospace", lineHeight: 1.8 }}>
              {ans.code}
            </Typography>
          : <Typography fontSize={12} color="#6272a4" fontStyle="italic">No code submitted</Typography>}
      </Box>

      {/* Run output */}
      {(ans.run_output || ans.run_stderr || ans.run_status) && (
        <Box sx={{ bgcolor: "#0d0d1a", px: 2.5, py: 1.5 }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography fontSize={12} fontWeight={700} color="#a9b1d6">Run Output</Typography>
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
            <Typography fontSize={12} color="#6272a4" fontStyle="italic">Candidate did not run the code.</Typography>
          )}
        </Box>
      )}

      {saveErr && <Alert severity="error" sx={{ m: 1 }}>{saveErr}</Alert>}
    </Card>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN — ExamResultsDialog
// ═══════════════════════════════════════════════════════════════════════════════

export default function ExamResultsDialog({ open, onClose, candidateId, candidateName }) {
  const [exams,    setExams]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);  // currently viewed exam
  const [tab,      setTab]      = useState(0);      // 0=MCQ, 1=Subj, 2=Coding
  const [saving,   setSaving]   = useState(false);
  const [overallScore, setOverallScore] = useState("");
  const [notes,        setNotes]        = useState("");

  useEffect(() => {
    if (!open || !candidateId) return;
    setLoading(true);
    fetch(`${BASE}/exams/by-candidate/${candidateId}`, { headers: getHeaders() })
      .then(r => r.json())
      .then(res => {
        setExams(res.data || []);
        // Auto-select the most recent completed exam
        const completed = (res.data || []).find(e => e.status === "Completed");
        setSelected(completed || (res.data || [])[0] || null);
      })
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, [open, candidateId]);

  useEffect(() => {
    if (selected) {
      setOverallScore(selected.overall_score ?? "");
      setNotes(selected.score_notes || "");
    }
  }, [selected]);

  const saveOverall = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/exams/${selected._id}/score`, {
        method:  "PUT",
        headers: getHeaders(),
        body:    JSON.stringify({ overall_score: Number(overallScore), notes }),
      });
      // Refresh
      const res = await fetch(`${BASE}/exams/by-candidate/${candidateId}`, { headers: getHeaders() });
      const data = await res.json();
      setExams(data.data || []);
      const updated = (data.data || []).find(e => e._id === selected._id);
      if (updated) setSelected(updated);
    } catch {}
    finally { setSaving(false); }
  };

  if (!open) return null;

  const mcqAnswers  = selected?.answers?.mcq        || [];
  const subjAnswers = selected?.answers?.subjective  || [];
  const codeAnswers = selected?.answers?.coding      || [];

  const hasMCQ  = mcqAnswers.length  > 0;
  const hasSubj = subjAnswers.length > 0;
  const hasCode = codeAnswers.length > 0;

  const resultTabs = [
    { label: `MCQ (${mcqAnswers.length})`,         idx: 0, show: hasMCQ  },
    { label: `Subjective (${subjAnswers.length})`,  idx: 1, show: hasSubj },
    { label: `Coding (${codeAnswers.length})`,      idx: 2, show: hasCode },
  ].filter(t => t.show);

  const mcqPct = selected?.mcq_total > 0
    ? Math.round((selected.mcq_correct / selected.mcq_total) * 100)
    : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { height: "92vh", display: "flex", flexDirection: "column" } }}>

      <DialogTitle sx={{ fontWeight: 700, borderBottom: "1px solid #e0e0e0", py: 1.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Assignment sx={{ color: "#e65100" }} />
            <Box>
              <Typography fontWeight={700}>Exam Results — {candidateName}</Typography>
              <Typography fontSize={11} color="text.secondary">
                {exams.length} exam{exams.length !== 1 ? "s" : ""} on record
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: "flex", overflow: "hidden" }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress />
          </Box>
        ) : exams.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center"
            flex={1} gap={2}>
            <Assignment sx={{ fontSize: 64, color: "#e0e0e0" }} />
            <Typography color="text.secondary" fontWeight={600}>No exams sent yet</Typography>
          </Box>
        ) : (
          <Box display="flex" flex={1} overflow="hidden">

            {/* ── Left panel — exam list ───────────────────────────────────── */}
            <Box sx={{ width: 220, borderRight: "1px solid #e0e0e0", overflowY: "auto",
                       bgcolor: "#fafafa", flexShrink: 0 }}>
              <Typography fontSize={11} fontWeight={700} color="text.secondary"
                textTransform="uppercase" letterSpacing={0.5} px={2} py={1.5}>
                Exams
              </Typography>
              {exams.map(e => (
                <Box key={e._id}
                  onClick={() => { setSelected(e); setTab(0); }}
                  sx={{
                    px: 2, py: 1.5, cursor: "pointer", borderBottom: "1px solid #f0f0f0",
                    bgcolor: selected?._id === e._id ? "#e3f2fd" : "transparent",
                    borderLeft: selected?._id === e._id ? "3px solid #1565c0" : "3px solid transparent",
                    "&:hover": { bgcolor: "#f5f7fa" },
                  }}>
                  <Typography fontSize={12} fontWeight={700} noWrap>{e.exam_id}</Typography>
                  <Typography fontSize={11} color="text.secondary" noWrap>{e.job_title}</Typography>
                  <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                    <Chip
                      label={e.status}
                      size="small"
                      sx={{
                        fontSize: 9, height: 16, fontWeight: 700,
                        bgcolor: e.status === "Completed" ? "#e8f5e9"
                               : e.status === "In Progress" ? "#e3f2fd"
                               : e.status === "Sent" ? "#fff3e0" : "#f5f5f5",
                        color:   e.status === "Completed" ? "#2e7d32"
                               : e.status === "In Progress" ? "#0277bd"
                               : e.status === "Sent" ? "#e65100" : "#757575",
                      }}
                    />
                    {e.status === "Completed" && e.mcq_total > 0 && (
                      <Chip label={`MCQ ${e.mcq_score}%`} size="small"
                        sx={{ fontSize: 9, height: 16, bgcolor: scoreBg(e.mcq_score), color: scoreColor(e.mcq_score) }} />
                    )}
                  </Box>
                  <Typography fontSize={10} color="text.disabled" mt={0.3}>
                    {e.sent_at ? new Date(e.sent_at).toLocaleDateString("en-IN") : ""}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* ── Right panel — selected exam detail ──────────────────────── */}
            <Box flex={1} display="flex" flexDirection="column" overflow="hidden">
              {!selected ? (
                <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                  <Typography color="text.secondary">Select an exam to view results</Typography>
                </Box>
              ) : selected.status !== "Completed" ? (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center"
                  flex={1} gap={2} p={4}>
                  <AccessTime sx={{ fontSize: 64, color: "#e0e0e0" }} />
                  <Typography fontWeight={700} color="text.secondary">
                    Exam {selected.status === "Sent" ? "not yet started" : "in progress"}
                  </Typography>
                  <Typography fontSize={13} color="text.disabled">
                    Results will appear here once the candidate submits.
                  </Typography>
                  {selected.expires_at && (
                    <Chip label={`Expires ${new Date(selected.expires_at).toLocaleDateString("en-IN")}`}
                      size="small" color="warning" />
                  )}
                </Box>
              ) : (
                <>
                  {/* Score summary bar */}
                  <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0", bgcolor: "#f8f9fa", flexShrink: 0 }}>
                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                      <Box>
                        <Typography fontSize={11} color="text.secondary">Submitted</Typography>
                        <Typography fontSize={12} fontWeight={600}>
                          {selected.submitted_at ? new Date(selected.submitted_at).toLocaleString("en-IN") : "—"}
                        </Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem />

                      {mcqPct !== null && (
                        <Box textAlign="center">
                          <Typography fontSize={11} color="text.secondary">MCQ Score</Typography>
                          <Typography fontSize={18} fontWeight={800} color={scoreColor(mcqPct)}>
                            {mcqPct}%
                          </Typography>
                          <Typography fontSize={10} color="text.secondary">
                            {selected.mcq_correct}/{selected.mcq_total} correct
                          </Typography>
                        </Box>
                      )}

                      {selected.subjective_score != null && (
                        <Box textAlign="center">
                          <Typography fontSize={11} color="text.secondary">Subjective</Typography>
                          <Typography fontSize={18} fontWeight={800} color={scoreColor(selected.subjective_score)}>
                            {selected.subjective_score}/100
                          </Typography>
                        </Box>
                      )}

                      {selected.coding_score != null && (
                        <Box textAlign="center">
                          <Typography fontSize={11} color="text.secondary">Coding</Typography>
                          <Typography fontSize={18} fontWeight={800} color={scoreColor(selected.coding_score)}>
                            {selected.coding_score}/100
                          </Typography>
                        </Box>
                      )}

                      {selected.overall_score != null && (
                        <Box textAlign="center" ml="auto" px={2} py={1}
                          sx={{ bgcolor: scoreBg(selected.overall_score), borderRadius: 2,
                                border: `1px solid ${scoreColor(selected.overall_score)}20` }}>
                          <Typography fontSize={11} color="text.secondary">Overall</Typography>
                          <Typography fontSize={22} fontWeight={800} color={scoreColor(selected.overall_score)}>
                            {selected.overall_score}/100
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Overall score input */}
                    <Box display="flex" alignItems="center" gap={1.5} mt={1.5} flexWrap="wrap">
                      <TextField
                        size="small" type="number" label="Overall Score (0–100)"
                        value={overallScore}
                        onChange={e => setOverallScore(e.target.value)}
                        sx={{ width: 180 }} inputProps={{ min: 0, max: 100 }}
                      />
                      <TextField
                        size="small" label="Recruiter Notes"
                        value={notes} onChange={e => setNotes(e.target.value)}
                        sx={{ flex: 1, minWidth: 200 }}
                        placeholder="Optional notes about this exam attempt"
                      />
                      <Button variant="contained" size="small" onClick={saveOverall}
                        disabled={saving || overallScore === ""}
                        startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save fontSize="small" />}>
                        {saving ? "Saving…" : "Save Score"}
                      </Button>
                    </Box>
                  </Box>

                  {/* Result tabs */}
                  <Box sx={{ px: 2, pt: 1.5, pb: 0, borderBottom: "1px solid #e0e0e0",
                             display: "flex", gap: 1, flexShrink: 0 }}>
                    {resultTabs.map(t => (
                      <Button key={t.idx} size="small" onClick={() => setTab(t.idx)}
                        variant={tab === t.idx ? "contained" : "outlined"}
                        sx={{ fontWeight: 700, textTransform: "none", fontSize: 12,
                              bgcolor:     tab === t.idx ? "#1a237e" : "transparent",
                              borderColor: "#1a237e", color: tab === t.idx ? "#fff" : "#1a237e",
                              "&:hover": { bgcolor: tab === t.idx ? "#1a237e" : "#e8eaf6" } }}>
                        {t.label}
                      </Button>
                    ))}
                  </Box>

                  {/* Answers list */}
                  <Box flex={1} overflowY="auto" sx={{ p: 2, overflowY: "auto" }}>
                    {/* MCQ tab */}
                    {tab === 0 && (
                      hasMCQ ? (
                        <>
                          {/* MCQ progress bar */}
                          <Box mb={2} p={1.5} bgcolor="#f5f7fa" borderRadius={2} border="1px solid #e0e0e0">
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography fontSize={12} color="text.secondary">MCQ Performance</Typography>
                              <Typography fontSize={12} fontWeight={700} color={scoreColor(mcqPct)}>
                                {selected.mcq_correct}/{selected.mcq_total} correct
                              </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={mcqPct || 0}
                              sx={{ height: 6, borderRadius: 3, bgcolor: "#e0e0e0",
                                    "& .MuiLinearProgress-bar": { bgcolor: scoreColor(mcqPct || 0) } }}
                            />
                          </Box>
                          {mcqAnswers.map((ans, i) => <MCQAnswerCard key={i} ans={ans} index={i} />)}
                        </>
                      ) : <Typography color="text.secondary" fontSize={13} py={4} textAlign="center">No MCQ questions in this exam.</Typography>
                    )}

                    {/* Subjective tab */}
                    {tab === 1 && (
                      hasSubj ? (
                        subjAnswers.map((ans, i) => (
                          <SubjectiveAnswerCard key={i} ans={ans} index={i}
                            examId={selected._id} onScored={() => {
                              fetch(`${BASE}/exams/by-candidate/${candidateId}`, { headers: getHeaders() })
                                .then(r => r.json()).then(res => setExams(res.data || []));
                            }} />
                        ))
                      ) : <Typography color="text.secondary" fontSize={13} py={4} textAlign="center">No subjective questions in this exam.</Typography>
                    )}

                    {/* Coding tab */}
                    {tab === 2 && (
                      hasCode ? (
                        codeAnswers.map((ans, i) => (
                          <CodingAnswerCard key={i} ans={ans} index={i}
                            examId={selected._id} onScored={() => {
                              fetch(`${BASE}/exams/by-candidate/${candidateId}`, { headers: getHeaders() })
                                .then(r => r.json()).then(res => setExams(res.data || []));
                            }} />
                        ))
                      ) : <Typography color="text.secondary" fontSize={13} py={4} textAlign="center">No coding questions in this exam.</Typography>
                    )}
                  </Box>
                </>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}