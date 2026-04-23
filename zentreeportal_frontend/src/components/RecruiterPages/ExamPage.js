
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Typography, Button, CircularProgress, Alert, Chip, Avatar,
  Card, CardContent, LinearProgress, TextField, Radio, RadioGroup,
  FormControlLabel, FormControl,
} from "@mui/material";
import {
  Quiz, QuestionAnswer, Code, CheckCircle, AccessTime,
  PlayArrow, ArrowForward, Lock,
} from "@mui/icons-material";

const BASE = process.env.REACT_APP_API_BASE_URL;

const DIFFICULTY_COLOR = {
  Easy:   { bg: "#e8f5e9", border: "#a5d6a7", text: "#1b5e20" },
  Medium: { bg: "#fff8e1", border: "#ffe082", text: "#e65100" },
  Hard:   { bg: "#fce4ec", border: "#f48fb1", text: "#880e4f" },
};

// ── Section config ────────────────────────────────────────────────────────────
const SECTIONS = [
  { key: "mcq",        label: "MCQ",        icon: <Quiz />,           color: "#7b1fa2" },
  { key: "subjective", label: "Subjective",  icon: <QuestionAnswer />, color: "#0277bd" },
  { key: "coding",     label: "Coding",      icon: <Code />,           color: "#2e7d32" },
];

// ── Section Progress Bar ──────────────────────────────────────────────────────
const SectionStepper = ({ sections, currentSection, completedSections }) => (
  <Box display="flex" alignItems="center" gap={0} sx={{ overflowX: "auto" }}>
    {sections.map((sec, i) => {
      const isDone    = completedSections.includes(sec.key);
      const isCurrent = currentSection === sec.key;
      return (
        <React.Fragment key={sec.key}>
          <Box display="flex" flexDirection="column" alignItems="center" minWidth={90}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              bgcolor: isDone ? "#2e7d32" : isCurrent ? sec.color : "#e0e0e0",
              color:   isDone || isCurrent ? "#fff" : "#9e9e9e",
              fontWeight: 700, fontSize: 14,
              boxShadow: isCurrent ? `0 0 0 3px ${sec.color}40` : "none",
              transition: "all 0.3s",
            }}>
              {isDone ? <CheckCircle sx={{ fontSize: 22 }} /> : React.cloneElement(sec.icon, { sx: { fontSize: 20 } })}
            </Box>
            <Typography fontSize={10} fontWeight={isCurrent ? 700 : 400}
              color={isCurrent ? sec.color : isDone ? "#2e7d32" : "#9e9e9e"} mt={0.5}>
              {sec.label}
            </Typography>
          </Box>
          {i < sections.length - 1 && (
            <Box flex={1} height={2} bgcolor={isDone ? "#2e7d32" : "#e0e0e0"} mx={0.5}
              sx={{ minWidth: 24, transition: "background 0.3s" }} />
          )}
        </React.Fragment>
      );
    })}
  </Box>
);

export default function ExamPage() {
  const { token } = useParams();

  const [loading,    setLoading]    = useState(true);
  const [exam,       setExam]       = useState(null);
  const [error,      setError]      = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [result,     setResult]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft,   setTimeLeft]   = useState(null);

  // ── Session state ──────────────────────────────────────────────────────────
  // currentSection: "mcq" | "subjective" | "coding"
  const [currentSection,    setCurrentSection]    = useState("mcq");
  const [completedSections, setCompletedSections] = useState([]);
  const [sectionError,      setSectionError]      = useState("");

  // ── Answers ────────────────────────────────────────────────────────────────
  const [mcqAnswers,  setMcqAnswers]  = useState({});
  const [subjAnswers, setSubjAnswers] = useState({});
  const [codeAnswers, setCodeAnswers] = useState({});

  // ── Compiler state ─────────────────────────────────────────────────────────
  const [compileResults, setCompileResults] = useState({});
  const [compiling,      setCompiling]      = useState({});

  // ── Load exam ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/exams/take/${token}`)
      .then(r => r.json())
      .then(res => {
        if (!res.success) { setError(res.message || "Could not load exam"); return; }
        setExam(res.data);
        setTimeLeft(res.data.time_limit_minutes * 60);
        // Determine first section
        const d = res.data;
        if (d.mcq_questions?.length > 0) setCurrentSection("mcq");
        else if (d.subjective_questions?.length > 0) setCurrentSection("subjective");
        else setCurrentSection("coding");
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

  // ── Active sections (only those with questions) ───────────────────────────
  const activeSections = exam
    ? SECTIONS.filter(s => {
        if (s.key === "mcq")        return (exam.mcq_questions        || []).length > 0;
        if (s.key === "subjective") return (exam.subjective_questions  || []).length > 0;
        if (s.key === "coding")     return (exam.coding_questions      || []).length > 0;
        return false;
      })
    : [];

  const isLastSection = activeSections.length > 0 &&
    activeSections[activeSections.length - 1]?.key === currentSection;

  // ── Section completion validation ─────────────────────────────────────────
  const validateSection = (section) => {
    if (!exam) return false;
    setSectionError("");

    if (section === "mcq") {
      const total    = (exam.mcq_questions || []).length;
      const answered = Object.keys(mcqAnswers).length;
      if (answered < total) {
        setSectionError(`Please answer all MCQ questions. (${answered}/${total} answered)`);
        return false;
      }
    }

    if (section === "subjective") {
      const total = (exam.subjective_questions || []).length;
      const answered = Object.values(subjAnswers).filter(a => a.trim().length > 20).length;
      if (answered < total) {
        setSectionError(`Please answer all subjective questions with at least 20 characters each. (${answered}/${total} answered)`);
        return false;
      }
    }

    if (section === "coding") {
      const total    = (exam.coding_questions || []).length;
      const answered = Object.values(codeAnswers).filter(c => c.trim().length > 10).length;
      if (answered < total) {
        setSectionError(`Please submit code for all coding problems. (${answered}/${total} submitted)`);
        return false;
      }
    }

    return true;
  };

  // ── Move to next section ──────────────────────────────────────────────────
  const goToNextSection = () => {
    if (!validateSection(currentSection)) return;
    const idx     = activeSections.findIndex(s => s.key === currentSection);
    const next    = activeSections[idx + 1];
    if (!next) return;
    setCompletedSections(p => [...new Set([...p, currentSection])]);
    setCurrentSection(next.key);
    setSectionError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Run Code ──────────────────────────────────────────────────────────────
  const runCode = async (idx, language) => {
    const code = codeAnswers[idx] || "";
    if (!code.trim()) return;

    setCompiling(p => ({ ...p, [idx]: true }));
    try {
      const res  = await fetch(`${BASE}/exams/compile`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (data.success) {
        setCompileResults(p => ({ ...p, [idx]: { ...data.data } }));
      } else {
        setCompileResults(p => ({ ...p, [idx]: { stderr: data.message || "Compiler error" } }));
      }
    } catch {
      setCompileResults(p => ({ ...p, [idx]: { stderr: "Compiler service unavailable." } }));
    } finally {
      setCompiling(p => ({ ...p, [idx]: false }));
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting || submitted) return;

    // Validate last section
    if (!autoSubmit && !validateSection(currentSection)) return;

    if (!autoSubmit) {
      if (!window.confirm("Are you sure you want to submit the exam? This cannot be undone.")) return;
    }

    setSubmitting(true);
    setSectionError("");

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
        setSectionError(data.message || "Submission failed. Please try again.");
      }
    } catch {
      setSectionError("Submission failed. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }, [exam, mcqAnswers, subjAnswers, codeAnswers, compileResults, token, submitting, submitted, currentSection]);

  // ── Loading ───────────────────────────────────────────────────────────────
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

  // ── Submitted screen ──────────────────────────────────────────────────────
  if (submitted && result) return (
    <Box minHeight="100vh" sx={{ background: "linear-gradient(135deg,#e8f5e9 0%,#e3f2fd 100%)" }} p={3}>
      <Box maxWidth={640} mx="auto" pt={6}>
        <Box textAlign="center" mb={4}>
          <Avatar sx={{ width: 100, height: 100, bgcolor: "#e8f5e9", mx: "auto", mb: 2 }}>
            <CheckCircle sx={{ fontSize: 56, color: "#2e7d32" }} />
          </Avatar>
          <Typography variant="h4" fontWeight={800} color="success.dark">Exam Submitted!</Typography>
          <Typography color="text.secondary" fontSize={15} mt={1}>
            Thank you, <strong>{exam?.candidate_name}</strong>. Your responses have been graded.
          </Typography>
        </Box>

        {/* Overall score */}
        <Card sx={{ mb: 3, borderRadius: 3, textAlign: "center", p: 2 }}>
          <Typography fontSize={11} fontWeight={700} color="text.secondary"
            textTransform="uppercase" letterSpacing={0.6} mb={1}>Overall Score</Typography>
          <Typography fontSize={64} fontWeight={900}
            color={result.overall_score >= 70 ? "#2e7d32" : result.overall_score >= 50 ? "#e65100" : "#c62828"}
            lineHeight={1}>
            {result.overall_score}%
          </Typography>
          <LinearProgress variant="determinate" value={result.overall_score}
            sx={{ mt: 1.5, height: 8, borderRadius: 4, bgcolor: "#e0e0e0",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: result.overall_score >= 70 ? "#2e7d32" : result.overall_score >= 50 ? "#e65100" : "#c62828"
                  }}} />
        </Card>

        {/* Section scores */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          {result.mcq_total > 0 && (
            <Card sx={{ flex: 1, minWidth: 150, borderRadius: 2, p: 2, textAlign: "center",
                        border: "1px solid #e8eaf6" }}>
              <Typography fontSize={10} fontWeight={700} color="#7b1fa2"
                textTransform="uppercase" letterSpacing={0.6} mb={0.5}>MCQ</Typography>
              <Typography fontSize={36} fontWeight={800} color="#7b1fa2" lineHeight={1}>
                {result.mcq_score}%
              </Typography>
              <Typography fontSize={11} color="text.secondary" mt={0.3}>
                {result.mcq_correct}/{result.mcq_total} correct
              </Typography>
            </Card>
          )}
          {result.subj_count > 0 && (
            <Card sx={{ flex: 1, minWidth: 150, borderRadius: 2, p: 2, textAlign: "center",
                        border: "1px solid #e3f2fd" }}>
              <Typography fontSize={10} fontWeight={700} color="#0277bd"
                textTransform="uppercase" letterSpacing={0.6} mb={0.5}>Subjective</Typography>
              <Typography fontSize={36} fontWeight={800} color="#0277bd" lineHeight={1}>
                {result.subj_score}%
              </Typography>
              <Typography fontSize={11} color="text.secondary" mt={0.3}>
                {result.subj_count} answered
              </Typography>
            </Card>
          )}
          {result.code_count > 0 && (
            <Card sx={{ flex: 1, minWidth: 150, borderRadius: 2, p: 2, textAlign: "center",
                        border: "1px solid #e8f5e9" }}>
              <Typography fontSize={10} fontWeight={700} color="#2e7d32"
                textTransform="uppercase" letterSpacing={0.6} mb={0.5}>Coding</Typography>
              <Typography fontSize={36} fontWeight={800} color="#2e7d32" lineHeight={1}>
                {result.code_score}%
              </Typography>
              <Typography fontSize={11} color="text.secondary" mt={0.3}>
                {result.code_count} submitted
              </Typography>
            </Card>
          )}
        </Box>

        {/* Subjective feedback */}
        {result.subj_feedback?.length > 0 && (
          <Card sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography fontWeight={700} fontSize={13} color="#0277bd" mb={1.5}>
                Subjective Feedback
              </Typography>
              {result.subj_feedback.map((fb, i) => (
                <Box key={i} mb={2} p={1.5} bgcolor="#f8fafc" borderRadius={1.5}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8}>
                    <Typography fontSize={12} fontWeight={700} color="text.primary">
                      Q{i + 1}: {fb.q.slice(0, 80)}{fb.q.length > 80 ? "…" : ""}
                    </Typography>
                    <Chip label={`${fb.score}/${fb.max}`} size="small"
                      sx={{ bgcolor: fb.score >= 7 ? "#e8f5e9" : fb.score >= 5 ? "#fff8e1" : "#fce4ec",
                            color: fb.score >= 7 ? "#2e7d32" : fb.score >= 5 ? "#e65100" : "#c62828",
                            fontWeight: 700, fontSize: 11 }} />
                  </Box>
                  <Typography fontSize={12} color="text.secondary">{fb.feedback}</Typography>
                  <Chip label={fb.verdict} size="small" variant="outlined"
                    sx={{ mt: 0.8, fontSize: 10 }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Coding feedback */}
        {result.code_feedback?.length > 0 && (
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography fontWeight={700} fontSize={13} color="#2e7d32" mb={1.5}>
                Coding Feedback
              </Typography>
              {result.code_feedback.map((fb, i) => (
                <Box key={i} mb={2} p={1.5} bgcolor="#f8fafc" borderRadius={1.5}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8}>
                    <Typography fontSize={12} fontWeight={700} color="text.primary">
                      Problem {i + 1}: {fb.q.split("\n")[0].slice(0, 60)}…
                    </Typography>
                    <Chip label={`${fb.score}/${fb.max}`} size="small"
                      sx={{ bgcolor: fb.score >= 7 ? "#e8f5e9" : fb.score >= 5 ? "#fff8e1" : "#fce4ec",
                            color: fb.score >= 7 ? "#2e7d32" : fb.score >= 5 ? "#e65100" : "#c62828",
                            fontWeight: 700, fontSize: 11 }} />
                  </Box>
                  {!fb.lang_ok && (
                    <Alert severity="error" sx={{ mb: 0.8, py: 0, fontSize: 11 }}>
                      Wrong language used — solution scored 0
                    </Alert>
                  )}
                  <Typography fontSize={12} color="text.secondary">{fb.feedback}</Typography>
                  <Chip label={fb.verdict} size="small" variant="outlined"
                    sx={{ mt: 0.8, fontSize: 10 }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        <Typography fontSize={13} color="text.secondary" textAlign="center">
          The recruiter has been notified with your scores. You may close this window.
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

  const currentSectionMeta = SECTIONS.find(s => s.key === currentSection);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <Box sx={{
        position: "sticky", top: 0, zIndex: 1000,
        bgcolor: "#1a237e", color: "#fff", px: 3, py: 1.5,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>
        <Box>
          <Typography fontWeight={700} fontSize={15}>{exam.job_title}</Typography>
          <Typography fontSize={11} sx={{ color: "#90caf9" }}>
            {exam.client_name} · {exam.exam_id}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          {currentSection === "mcq" && mcqList.length > 0 && (
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
        </Box>
      </Box>

      {/* Timer bar */}
      <LinearProgress variant="determinate" value={timePct}
        sx={{ height: 4, bgcolor: "#e0e0e0",
              "& .MuiLinearProgress-bar": { bgcolor: timeColor, transition: "none" } }} />

      <Box maxWidth={960} mx="auto" p={3}>

        {/* ── Section stepper ─────────────────────────────────────────────── */}
        <Card sx={{ mb: 3, borderRadius: 2, p: 2 }}>
          <SectionStepper
            sections={activeSections}
            currentSection={currentSection}
            completedSections={completedSections}
          />
        </Card>

        {/* ── Section header ───────────────────────────────────────────────── */}
        <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: currentSectionMeta?.color, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            {currentSectionMeta && React.cloneElement(currentSectionMeta.icon, { sx: { color: "#fff", fontSize: 22 } })}
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize={18} color="#0f172a">
              {currentSectionMeta?.label} Section
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              {currentSection === "mcq"        && `${mcqList.length} questions — select the best answer for each`}
              {currentSection === "subjective"  && `${subjList.length} questions — write detailed answers`}
              {currentSection === "coding"      && `${codeList.length} problems — write your solution in the required language`}
            </Typography>
          </Box>
        </Box>

        {/* Section validation error */}
        {sectionError && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSectionError("")}>
            {sectionError}
          </Alert>
        )}

        {/* ── MCQ Section ──────────────────────────────────────────────────── */}
        {currentSection === "mcq" && mcqList.map((q, i) => {
          const diffStyle = DIFFICULTY_COLOR[q.difficulty] || {};
          const isAnswered = !!mcqAnswers[i];
          return (
            <Card key={i} sx={{
              mb: 2, borderRadius: 2,
              border: isAnswered ? "1.5px solid #a5d6a7" : "1px solid #e0e0e0",
              transition: "border 0.2s",
            }}>
              <CardContent>
                <Box display="flex" alignItems="flex-start" gap={1} mb={2} flexWrap="wrap">
                  <Chip label={`Q${i + 1}`} size="small"
                    sx={{ bgcolor: "#7b1fa2", color: "#fff", fontWeight: 700, fontSize: 11 }} />
                  {q.difficulty && (
                    <Chip label={q.difficulty} size="small"
                      sx={{ fontSize: 10, bgcolor: diffStyle.bg, color: diffStyle.text,
                            border: `1px solid ${diffStyle.border}` }} />
                  )}
                  {q.topic && <Chip label={q.topic} size="small" variant="outlined" sx={{ fontSize: 10 }} />}
                  {isAnswered && (
                    <Chip label="✓ Answered" size="small" color="success"
                      sx={{ fontSize: 10, ml: "auto" }} />
                  )}
                </Box>
                <Typography fontWeight={600} fontSize={14} mb={2}>{q.question}</Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup value={mcqAnswers[i] || ""}
                    onChange={e => setMcqAnswers(p => ({ ...p, [i]: e.target.value }))}>
                    {(q.options || []).map((opt, j) => (
                      <FormControlLabel key={j} value={opt}
                        control={<Radio size="small" sx={{ color: "#7b1fa2", "&.Mui-checked": { color: "#7b1fa2" } }} />}
                        label={<Typography fontSize={13}>{opt}</Typography>}
                        sx={{
                          mb: 0.8, px: 1.5, py: 0.8, borderRadius: 1.5, border: "1px solid",
                          borderColor: mcqAnswers[i] === opt ? "#a5d6a7" : "#e0e0e0",
                          bgcolor:     mcqAnswers[i] === opt ? "#e8f5e9" : "transparent",
                          transition: "all 0.15s",
                          "&:hover": { bgcolor: "#f5f0ff" },
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          );
        })}

        {/* ── Subjective Section ───────────────────────────────────────────── */}
        {currentSection === "subjective" && subjList.map((q, i) => {
          const diffStyle  = DIFFICULTY_COLOR[q.difficulty] || {};
          const charCount  = (subjAnswers[i] || "").length;
          const isAnswered = charCount >= 20;
          return (
            <Card key={i} sx={{
              mb: 2, borderRadius: 2,
              border: isAnswered ? "1.5px solid #90caf9" : "1px solid #e0e0e0",
            }}>
              <CardContent>
                <Box display="flex" alignItems="flex-start" gap={1} mb={2} flexWrap="wrap">
                  <Chip label={`Q${i + 1}`} size="small"
                    sx={{ bgcolor: "#0277bd", color: "#fff", fontWeight: 700, fontSize: 11 }} />
                  {q.skill && (
                    <Chip label={q.skill} size="small" variant="outlined"
                      sx={{ fontSize: 10, borderColor: "#0277bd", color: "#0277bd" }} />
                  )}
                  {q.difficulty && (
                    <Chip label={q.difficulty} size="small"
                      sx={{ fontSize: 10, bgcolor: diffStyle.bg, color: diffStyle.text,
                            border: `1px solid ${diffStyle.border}` }} />
                  )}
                  {isAnswered && (
                    <Chip label="✓ Answered" size="small" color="info" sx={{ fontSize: 10, ml: "auto" }} />
                  )}
                </Box>
                <Typography fontWeight={600} fontSize={14} mb={2}>{q.question}</Typography>
                <TextField
                  fullWidth multiline rows={7} size="small"
                  placeholder="Write a detailed answer. The AI will evaluate depth, accuracy, and key points covered…"
                  value={subjAnswers[i] || ""}
                  onChange={e => setSubjAnswers(p => ({ ...p, [i]: e.target.value }))}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography fontSize={11} color={charCount < 20 ? "error" : "text.disabled"}>
                    {charCount < 20 ? `Minimum 20 characters required (${20 - charCount} more)` : "Good length ✓"}
                  </Typography>
                  <Typography fontSize={11} color="text.disabled">{charCount} chars</Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}

        {/* ── Coding Section ───────────────────────────────────────────────── */}
        {currentSection === "coding" && codeList.map((q, i) => {
          const cr        = compileResults[i];
          const isRunning = compiling[i];
          // Language is LOCKED to question's language — no switcher
          const lang      = q.programming_language || "Python";
          const hasCode   = (codeAnswers[i] || "").trim().length > 10;
          const diffStyle = DIFFICULTY_COLOR[q.difficulty] || {};

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
                    sx={{ fontSize: 9, bgcolor: "#1a1a2e", color: "#c3e88d",
                          border: "1px solid #414868" }} />
                )}
              </Box>

              {/* Problem statement */}
              <Box sx={{ bgcolor: "#1e1e2e", px: 2.5, py: 2, borderBottom: "1px solid #3d3d5c" }}>
                <Typography fontSize={13} color="#cdd6f4" lineHeight={1.9}
                  sx={{ whiteSpace: "pre-wrap", fontFamily: "'Fira Code','Consolas',monospace" }}>
                  {q.question}
                </Typography>
              </Box>

              {/* Language lock notice */}
              <Box sx={{
                bgcolor: "#1a1a2e", px: 2.5, py: 1,
                borderBottom: "1px solid #3d3d5c",
                display: "flex", alignItems: "center", gap: 1,
              }}>
                <Lock sx={{ fontSize: 14, color: "#f9a825" }} />
                <Typography fontSize={12} color="#f9a825" fontWeight={700}>
                  This problem must be solved in <strong>{lang}</strong> only.
                  Solutions in other languages will be scored 0.
                </Typography>
              </Box>

              {/* Code area */}
              <Box sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                  <Chip label={lang} size="small"
                    sx={{ bgcolor: "#2d2d3f", color: "#82aaff", fontWeight: 700, fontSize: 11 }} />
                  <Button
                    variant="contained" size="small"
                    startIcon={isRunning ? <CircularProgress size={14} color="inherit" /> : <PlayArrow fontSize="small" />}
                    onClick={() => runCode(i, lang)}
                    disabled={isRunning || !hasCode}
                    sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" },
                          fontWeight: 700, fontSize: 12 }}
                  >
                    {isRunning ? "Running…" : "▶ Run Code"}
                  </Button>
                </Box>

                <TextField
                  fullWidth multiline rows={13} size="small"
                  placeholder={`Write your ${lang} solution here…\n\n# Do NOT use any other language — only ${lang} is accepted.`}
                  value={codeAnswers[i] || ""}
                  onChange={e => setCodeAnswers(p => ({ ...p, [i]: e.target.value }))}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      fontFamily: "'Fira Code','Consolas',monospace",
                      fontSize: 13, bgcolor: "#f8f8f8", borderRadius: 1.5, lineHeight: 1.8,
                    }
                  }}
                />

                {/* Output */}
                {cr && (
                  <Box sx={{ mt: 1.5, borderRadius: 1.5, overflow: "hidden", border: "1px solid #3d3d5c" }}>
                    <Box sx={{ bgcolor: "#2d2d3f", px: 2, py: 0.8, display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Typography fontSize={11} fontWeight={700} color="#82aaff" flex={1}>Output</Typography>
                      <Chip label={cr.status || "Unknown"} size="small"
                        sx={{ fontSize: 10,
                              bgcolor: cr.status === "Accepted" ? "#1b5e20" : "#b71c1c",
                              color: "#fff" }} />
                      {cr.time   && <Typography fontSize={10} color="#a9b1d6">{cr.time}s</Typography>}
                      {cr.memory && <Typography fontSize={10} color="#a9b1d6">{cr.memory} KB</Typography>}
                    </Box>
                    {cr.stdout && (
                      <Box sx={{ bgcolor: "#1e1e2e", px: 2, py: 1.5 }}>
                        <Typography fontSize={11} color="#a9b1d6" fontWeight={700} mb={0.5}>stdout</Typography>
                        <Typography fontSize={12} color="#a6e22e"
                          sx={{ fontFamily: "'Fira Code','Consolas',monospace", whiteSpace: "pre-wrap" }}>
                          {cr.stdout}
                        </Typography>
                      </Box>
                    )}
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
                    {!cr.stdout && !cr.stderr && !cr.compile_output && (
                      <Box sx={{ bgcolor: "#1e1e2e", px: 2, py: 1.5 }}>
                        <Typography fontSize={12} color="#6272a4" fontStyle="italic">No output produced.</Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {!hasCode && (
                  <Typography fontSize={11} color="error" mt={1}>
                    ⚠ Write your {lang} solution above before proceeding.
                  </Typography>
                )}
              </Box>
            </Card>
          );
        })}

        {/* ── Bottom navigation ─────────────────────────────────────────────── */}
        <Box display="flex" justifyContent="flex-end" mt={3} mb={6} gap={2}>
          {!isLastSection ? (
            <Button
              variant="contained" size="large"
              onClick={goToNextSection}
              endIcon={<ArrowForward />}
              sx={{
                px: 5, py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: 15,
                bgcolor: currentSectionMeta?.color,
                "&:hover": { filter: "brightness(0.9)" },
              }}>
              Next Section
            </Button>
          ) : (
            <Button
              variant="contained" size="large"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
              sx={{
                px: 6, py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: 15,
                bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" },
              }}>
              {submitting ? "Submitting & Grading…" : "Submit Exam"}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}