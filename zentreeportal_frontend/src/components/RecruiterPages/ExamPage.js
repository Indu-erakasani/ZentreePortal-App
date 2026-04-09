
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Typography, Button, CircularProgress, Alert, Chip, Avatar,
  Card, CardContent, LinearProgress, TextField, Radio, RadioGroup,
  FormControlLabel, FormControl, Select, MenuItem,
} from "@mui/material";
import {
  Quiz, QuestionAnswer, Code, CheckCircle, AccessTime, PlayArrow,
} from "@mui/icons-material";

const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const LANGUAGE_IDS = {
  "Python":     71,
  "Python 3":   71,
  "JavaScript": 63,
  "Java":       62,
  "C++":        54,
  "C":          50,
  "Go":         60,
  "Ruby":       72,
  "TypeScript": 74,
  "Rust":       73,
};

const DIFFICULTY_COLOR = {
  Easy:   { bg: "#e8f5e9", border: "#a5d6a7", text: "#1b5e20" },
  Medium: { bg: "#fff8e1", border: "#ffe082", text: "#e65100" },
  Hard:   { bg: "#fce4ec", border: "#f48fb1", text: "#880e4f" },
};

export default function ExamPage() {
  const { token } = useParams();

  const [loading,    setLoading]    = useState(true);
  const [exam,       setExam]       = useState(null);
  const [error,      setError]      = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [result,     setResult]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft,   setTimeLeft]   = useState(null);
  const [tabActive,  setTabActive]  = useState(0);

  // ── Answers ────────────────────────────────────────────────────────────────
  const [mcqAnswers,  setMcqAnswers]  = useState({});
  const [subjAnswers, setSubjAnswers] = useState({});
  const [codeAnswers, setCodeAnswers] = useState({});

  // ── Compiler state per coding question ────────────────────────────────────
  // { [idx]: { loading, stdout, stderr, compile_output, status, time, memory } }
  const [compileResults, setCompileResults] = useState({});
  // selected language override per coding question
  const [codeLangs, setCodeLangs] = useState({});

  // ── Load exam ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/exams/take/${token}`)
      .then(r => r.json())
      .then(res => {
        if (!res.success) { setError(res.message || "Could not load exam"); return; }
        setExam(res.data);
        setTimeLeft(res.data.time_limit_minutes * 60);
        // Pre-set code language from question
        const langs = {};
        (res.data.coding_questions || []).forEach((q, i) => {
          langs[i] = q.programming_language || "Python";
        });
        setCodeLangs(langs);
      })
      .catch(() => setError("Failed to load exam. Please check your connection."))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitted]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── Run Code (compiler) ───────────────────────────────────────────────────
  const runCode = async (idx) => {
    const code = codeAnswers[idx] || "";
    const lang = codeLangs[idx] || "Python";
    if (!code.trim()) return;

    setCompileResults(p => ({ ...p, [idx]: { loading: true } }));
    try {
      const res  = await fetch(`${BASE}/exams/compile`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code, language: lang }),
      });
      const data = await res.json();
      if (data.success) {
        setCompileResults(p => ({ ...p, [idx]: { loading: false, ...data.data } }));
      } else {
        setCompileResults(p => ({ ...p, [idx]: { loading: false, stderr: data.message || "Compiler error" } }));
      }
    } catch {
      setCompileResults(p => ({ ...p, [idx]: { loading: false, stderr: "Compiler service unavailable. Check your connection." } }));
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting || submitted) return;
    if (!autoSubmit) {
      const unanswered = (exam?.mcq_questions || []).filter((_, i) => !mcqAnswers[i]).length;
      if (unanswered > 0) {
        if (!window.confirm(`You have ${unanswered} unanswered MCQ question(s). Submit anyway?`)) return;
      }
    }

    setSubmitting(true);
    const payload = {
      mcq: Object.entries(mcqAnswers).map(([i, opt]) => ({
        question_index: Number(i), selected_option: opt,
      })),
      subjective: Object.entries(subjAnswers).map(([i, ans]) => ({
        question_index: Number(i), answer: ans,
      })),
      coding: Object.entries(codeAnswers).map(([i, code]) => ({
        question_index: Number(i),
        code,
        run_output: compileResults[Number(i)]?.stdout  || "",
        run_stderr: compileResults[Number(i)]?.stderr  || "",
        run_status: compileResults[Number(i)]?.status  || "",
      })),
    };

    try {
      const res  = await fetch(`${BASE}/exams/submit/${token}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setResult(data.data);
      } else {
        setError(data.message || "Submission failed");
      }
    } catch {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [exam, mcqAnswers, subjAnswers, codeAnswers, compileResults, token, submitting, submitted]);

  // ── States ────────────────────────────────────────────────────────────────
  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress size={48} />
    </Box>
  );

  if (error) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={3}>
      <Box textAlign="center" maxWidth={480}>
        <Avatar sx={{ width: 80, height: 80, bgcolor: "#fce4ec", mx: "auto", mb: 2 }}>
          <Quiz sx={{ fontSize: 40, color: "#c62828" }} />
        </Avatar>
        <Typography variant="h5" fontWeight={700} color="error.main" mb={1}>Exam Unavailable</Typography>
        <Typography color="text.secondary">{error}</Typography>
      </Box>
    </Box>
  );

  if (submitted) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={3}
      sx={{ background: "linear-gradient(135deg,#e8f5e9 0%,#e3f2fd 100%)" }}>
      <Box textAlign="center" maxWidth={520}>
        <Avatar sx={{ width: 100, height: 100, bgcolor: "#e8f5e9", mx: "auto", mb: 3 }}>
          <CheckCircle sx={{ fontSize: 56, color: "#2e7d32" }} />
        </Avatar>
        <Typography variant="h4" fontWeight={800} color="success.dark" mb={1}>Exam Submitted!</Typography>
        <Typography color="text.secondary" fontSize={16} mb={3}>
          Thank you, <strong>{exam?.candidate_name}</strong>. Your responses have been recorded.
        </Typography>
        {result && (
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography fontWeight={700} mb={2}>Score Summary</Typography>
              <Box display="flex" justifyContent="center" gap={4} flexWrap="wrap">
                {result.mcq_total > 0 && (
                  <Box textAlign="center">
                    <Typography variant="h3" fontWeight={800} color="primary.dark">{result.mcq_score}%</Typography>
                    <Typography fontSize={12} color="text.secondary">MCQ Score</Typography>
                    <Typography fontSize={11} color="text.secondary">{result.mcq_correct}/{result.mcq_total} correct</Typography>
                  </Box>
                )}
                {result.subj_count > 0 && (
                  <Box textAlign="center">
                    <Typography variant="h3" fontWeight={800} color="info.main">{result.subj_count}</Typography>
                    <Typography fontSize={12} color="text.secondary">Subjective Answered</Typography>
                    <Typography fontSize={11} color="text.secondary">Recruiter will review</Typography>
                  </Box>
                )}
                {result.code_count > 0 && (
                  <Box textAlign="center">
                    <Typography variant="h3" fontWeight={800} color="success.main">{result.code_count}</Typography>
                    <Typography fontSize={12} color="text.secondary">Coding Submitted</Typography>
                    <Typography fontSize={11} color="text.secondary">Recruiter will review</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
        <Typography fontSize={13} color="text.secondary">
          The recruiter has been notified. You may close this window.
        </Typography>
      </Box>
    </Box>
  );

  if (!exam) return null;

  const mcqList  = exam.mcq_questions        || [];
  const subjList = exam.subjective_questions  || [];
  const codeList = exam.coding_questions      || [];
  const timePct  = timeLeft !== null ? (timeLeft / (exam.time_limit_minutes * 60)) * 100 : 100;
  const timeColor = timeLeft < 300 ? "#c62828" : timeLeft < 600 ? "#f57c00" : "#2e7d32";
  const answeredMCQ = Object.keys(mcqAnswers).length;

  // Tabs to show
  const tabs = [
    { label: `MCQ (${mcqList.length})`,          idx: 0, color: "#7b1fa2", show: mcqList.length  > 0 },
    { label: `Subjective (${subjList.length})`,   idx: 1, color: "#0277bd", show: subjList.length > 0 },
    { label: `Coding (${codeList.length})`,       idx: 2, color: "#2e7d32", show: codeList.length > 0 },
  ].filter(t => t.show);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <Box sx={{
        position: "sticky", top: 0, zIndex: 1000,
        bgcolor: "#1a237e", color: "#fff", px: 3, py: 1.5,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>
        <Box>
          <Typography fontWeight={700} fontSize={15}>{exam.job_title}</Typography>
          <Typography fontSize={11} sx={{ color: "#90caf9" }}>{exam.client_name} · {exam.exam_id}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          {mcqList.length > 0 && (
            <Box textAlign="center">
              <Typography fontSize={11} sx={{ color: "#90caf9" }}>MCQ answered</Typography>
              <Typography fontWeight={700}>{answeredMCQ}/{mcqList.length}</Typography>
            </Box>
          )}
          {timeLeft !== null && (
            <Box sx={{
              bgcolor: timeLeft < 300 ? "#c62828" : "#0d47a1",
              px: 2, py: 0.8, borderRadius: 2, minWidth: 90, textAlign: "center",
            }}>
              <Box display="flex" alignItems="center" gap={0.8}>
                <AccessTime sx={{ fontSize: 16 }} />
                <Typography fontWeight={800} fontSize={18} fontFamily="monospace">
                  {formatTime(timeLeft)}
                </Typography>
              </Box>
            </Box>
          )}
          <Button
            variant="contained" size="small"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            sx={{ bgcolor: "#fff", color: "#1a237e", fontWeight: 700,
                  "&:hover": { bgcolor: "#e3f2fd" }, whiteSpace: "nowrap" }}
          >
            {submitting ? <CircularProgress size={16} /> : "Submit Exam"}
          </Button>
        </Box>
      </Box>

      {/* Timer progress bar */}
      <LinearProgress
        variant="determinate" value={timePct}
        sx={{ height: 4, bgcolor: "#e0e0e0",
              "& .MuiLinearProgress-bar": { bgcolor: timeColor, transition: "none" } }}
      />

      <Box maxWidth={960} mx="auto" p={3}>

        {/* Candidate info banner */}
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ py: 2 }}>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Avatar sx={{ bgcolor: "#1a237e", width: 44, height: 44 }}>
                {exam.candidate_name?.[0] || "C"}
              </Avatar>
              <Box flex={1}>
                <Typography fontWeight={700}>{exam.candidate_name}</Typography>
                <Typography fontSize={12} color="text.secondary">
                  Screening for: <strong>{exam.job_title}</strong> · Sent by {exam.recruiter_name}
                </Typography>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                {mcqList.length  > 0 && <Chip icon={<Quiz sx={{ fontSize:14 }} />} label={`${mcqList.length} MCQ`} size="small" sx={{ bgcolor:"#f3e5f5", color:"#7b1fa2" }} />}
                {subjList.length > 0 && <Chip icon={<QuestionAnswer sx={{ fontSize:14 }} />} label={`${subjList.length} Subjective`} size="small" sx={{ bgcolor:"#e3f2fd", color:"#0277bd" }} />}
                {codeList.length > 0 && <Chip icon={<Code sx={{ fontSize:14 }} />} label={`${codeList.length} Coding`} size="small" sx={{ bgcolor:"#e8f5e9", color:"#2e7d32" }} />}
                <Chip icon={<AccessTime sx={{ fontSize:14 }} />} label={`${exam.time_limit_minutes} min`} size="small" color="warning" />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Tab buttons */}
        <Box display="flex" gap={1} mb={3}>
          {tabs.map(t => (
            <Button key={t.idx} onClick={() => setTabActive(t.idx)}
              variant={tabActive === t.idx ? "contained" : "outlined"}
              sx={{
                fontWeight: 700, textTransform: "none",
                bgcolor:     tabActive === t.idx ? t.color : "transparent",
                borderColor: t.color, color: tabActive === t.idx ? "#fff" : t.color,
                "&:hover":   { bgcolor: tabActive === t.idx ? t.color : `${t.color}15` },
              }}>
              {t.label}
            </Button>
          ))}
        </Box>

        {/* ── MCQ Questions ─────────────────────────────────────────────────── */}
        {tabActive === 0 && mcqList.map((q, i) => {
          const diffStyle = DIFFICULTY_COLOR[q.difficulty] || {};
          return (
            <Card key={i} sx={{ mb: 2, borderRadius: 2, border: mcqAnswers[i] ? "1.5px solid #a5d6a7" : "1px solid #e0e0e0" }}>
              <CardContent>
                <Box display="flex" alignItems="flex-start" gap={1.5} mb={2} flexWrap="wrap">
                  <Chip label={`Q${i + 1}`} size="small"
                    sx={{ bgcolor: "#7b1fa2", color: "#fff", fontWeight: 700, fontSize: 11, flexShrink: 0 }} />
                  {q.difficulty && <Chip label={q.difficulty} size="small"
                    sx={{ fontSize: 10, bgcolor: diffStyle.bg, color: diffStyle.text, border: `1px solid ${diffStyle.border}`, flexShrink: 0 }} />}
                  {q.topic && <Chip label={q.topic} size="small" variant="outlined" sx={{ fontSize: 10, flexShrink: 0 }} />}
                  {mcqAnswers[i] && <Chip label="Answered ✓" size="small" color="success" sx={{ fontSize: 10, ml: "auto" }} />}
                </Box>
                <Typography fontWeight={600} fontSize={14} mb={2}>{q.question}</Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup value={mcqAnswers[i] || ""}
                    onChange={e => setMcqAnswers(p => ({ ...p, [i]: e.target.value }))}>
                    {(q.options || []).map((opt, j) => (
                      <FormControlLabel key={j} value={opt} control={<Radio size="small" />}
                        label={<Typography fontSize={13}>{opt}</Typography>}
                        sx={{
                          mb: 0.5, px: 1.5, py: 0.5, borderRadius: 1.5, border: "1px solid",
                          borderColor: mcqAnswers[i] === opt ? "#a5d6a7" : "#eeeeee",
                          bgcolor:     mcqAnswers[i] === opt ? "#e8f5e9" : "transparent",
                          transition: "all 0.15s", "&:hover": { bgcolor: "#f5f7fa" },
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          );
        })}

        {/* ── Subjective Questions ──────────────────────────────────────────── */}
        {tabActive === 1 && subjList.map((q, i) => {
          const diffStyle = DIFFICULTY_COLOR[q.difficulty] || {};
          return (
            <Card key={i} sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="flex-start" gap={1.5} mb={2} flexWrap="wrap">
                  <Chip label={`Q${i + 1}`} size="small"
                    sx={{ bgcolor: "#0277bd", color: "#fff", fontWeight: 700, fontSize: 11 }} />
                  {q.skill && <Chip label={q.skill} size="small" variant="outlined"
                    sx={{ fontSize: 10, borderColor: "#0277bd", color: "#0277bd" }} />}
                  {q.difficulty && <Chip label={q.difficulty} size="small"
                    sx={{ fontSize: 10, bgcolor: diffStyle.bg, color: diffStyle.text, border: `1px solid ${diffStyle.border}` }} />}
                </Box>
                <Typography fontWeight={600} fontSize={14} mb={2}>{q.question}</Typography>
                <TextField
                  fullWidth multiline rows={6} size="small"
                  placeholder="Type your detailed answer here…"
                  value={subjAnswers[i] || ""}
                  onChange={e => setSubjAnswers(p => ({ ...p, [i]: e.target.value }))}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography fontSize={11} color="text.disabled">
                    Be thorough — explain your reasoning clearly.
                  </Typography>
                  <Typography fontSize={11} color="text.disabled">
                    {(subjAnswers[i] || "").length} characters
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}

        {/* ── Coding Questions ──────────────────────────────────────────────── */}
        {tabActive === 2 && codeList.map((q, i) => {
          const cr   = compileResults[i];
          const lang = codeLangs[i] || q.programming_language || "Python";
          return (
            <Card key={i} sx={{ mb: 3, borderRadius: 2, border: "1px solid #3d3d5c", overflow: "hidden" }}>

              {/* Terminal titlebar */}
              <Box sx={{ bgcolor: "#2d2d3f", px: 2, py: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box display="flex" gap={0.6}>
                  {["#ff5f57","#febc2e","#28c840"].map(c => (
                    <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />
                  ))}
                </Box>
                <Code sx={{ fontSize: 14, color: "#82aaff" }} />
                <Typography fontSize={12} fontWeight={700} color="#82aaff" flex={1}>
                  Problem {i + 1}
                  {q.topic && <span style={{ color: "#a9b1d6", fontWeight: 400 }}> · {q.topic}</span>}
                </Typography>
                {q.difficulty && (
                  <Chip label={q.difficulty} size="small"
                    sx={{ fontSize: 9, bgcolor: "#1a1a2e", color: "#c3e88d", border: "1px solid #414868" }} />
                )}
              </Box>

              {/* Problem statement */}
              <Box sx={{ bgcolor: "#1e1e2e", px: 2.5, py: 2, borderBottom: "1px solid #3d3d5c" }}>
                <Typography fontSize={13} color="#cdd6f4" lineHeight={1.9}
                  sx={{ whiteSpace: "pre-wrap", fontFamily: "'Fira Code','Consolas',monospace" }}>
                  {q.question}
                </Typography>
              </Box>

              {/* Code editor section */}
              <Box sx={{ p: 2 }}>
                {/* Language selector + Run button */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Typography fontSize={12} fontWeight={700} color="text.secondary"
                      textTransform="uppercase" letterSpacing={0.5}>
                      Language
                    </Typography>
                    <Select
                      size="small"
                      value={lang}
                      onChange={e => setCodeLangs(p => ({ ...p, [i]: e.target.value }))}
                      sx={{ fontSize: 12, height: 30, minWidth: 130,
                            fontFamily: "'Fira Code','Consolas',monospace" }}
                    >
                      {Object.keys(LANGUAGE_IDS).map(l => (
                        <MenuItem key={l} value={l} sx={{ fontSize: 12 }}>{l}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Button
                    variant="contained" size="small"
                    startIcon={cr?.loading ? <CircularProgress size={14} color="inherit" /> : <PlayArrow fontSize="small" />}
                    onClick={() => runCode(i)}
                    disabled={cr?.loading || !codeAnswers[i]?.trim()}
                    sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" },
                          fontWeight: 700, fontSize: 12 }}
                  >
                    {cr?.loading ? "Running…" : "▶ Run Code"}
                  </Button>
                </Box>

                {/* Code textarea */}
                <TextField
                  fullWidth multiline rows={12} size="small"
                  placeholder={`Write your ${lang} solution here…`}
                  value={codeAnswers[i] || ""}
                  onChange={e => setCodeAnswers(p => ({ ...p, [i]: e.target.value }))}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      fontFamily: "'Fira Code','Consolas',monospace",
                      fontSize: 13, bgcolor: "#f8f8f8", borderRadius: 1.5,
                      lineHeight: 1.8,
                    }
                  }}
                />

                {/* Compiler output panel */}
                {cr && !cr.loading && (
                  <Box sx={{ mt: 1.5, borderRadius: 1.5, overflow: "hidden", border: "1px solid #3d3d5c" }}>
                    {/* Output header */}
                    <Box sx={{ bgcolor: "#2d2d3f", px: 2, py: 0.8, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Typography fontSize={11} fontWeight={700} color="#82aaff" flex={1}>
                        Output
                      </Typography>
                      <Chip
                        label={cr.status || "Unknown"}
                        size="small"
                        sx={{
                          fontSize: 10,
                          bgcolor: cr.status === "Accepted" ? "#1b5e20" : "#b71c1c",
                          color:   "#fff",
                        }}
                      />
                      {cr.time && (
                        <Typography fontSize={10} color="#a9b1d6">{cr.time}s</Typography>
                      )}
                      {cr.memory && (
                        <Typography fontSize={10} color="#a9b1d6">{cr.memory} KB</Typography>
                      )}
                    </Box>

                    {/* stdout */}
                    {cr.stdout && (
                      <Box sx={{ bgcolor: "#1e1e2e", px: 2, py: 1.5 }}>
                        <Typography fontSize={11} color="#a9b1d6" fontWeight={700} mb={0.5}>stdout</Typography>
                        <Typography fontSize={12} color="#a6e22e"
                          sx={{ fontFamily: "'Fira Code','Consolas',monospace", whiteSpace: "pre-wrap" }}>
                          {cr.stdout}
                        </Typography>
                      </Box>
                    )}

                    {/* stderr or compile error */}
                    {(cr.stderr || cr.compile_output) && (
                      <Box sx={{ bgcolor: "#1a0010", px: 2, py: 1.5 }}>
                        <Typography fontSize={11} color="#f48fb1" fontWeight={700} mb={0.5}>
                          {cr.compile_output ? "Compile Error" : "stderr"}
                        </Typography>
                        <Typography fontSize={12} color="#f92672"
                          sx={{ fontFamily: "'Fira Code','Consolas',monospace", whiteSpace: "pre-wrap" }}>
                          {cr.compile_output || cr.stderr}
                        </Typography>
                      </Box>
                    )}

                    {/* Empty output */}
                    {!cr.stdout && !cr.stderr && !cr.compile_output && (
                      <Box sx={{ bgcolor: "#1e1e2e", px: 2, py: 1.5 }}>
                        <Typography fontSize={12} color="#6272a4" fontStyle="italic">
                          No output produced.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Run hint */}
                {!cr && codeAnswers[i] && (
                  <Typography fontSize={11} color="text.disabled" mt={1}>
                    Click <strong>▶ Run Code</strong> to test your solution before submitting.
                  </Typography>
                )}
              </Box>
            </Card>
          );
        })}

        {/* Submit button at bottom */}
        <Box display="flex" justifyContent="center" mt={3} mb={6}>
          <Button
            variant="contained" size="large"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
            sx={{ px: 6, py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: 16,
                  bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" } }}>
            {submitting ? "Submitting…" : "Submit Exam"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}