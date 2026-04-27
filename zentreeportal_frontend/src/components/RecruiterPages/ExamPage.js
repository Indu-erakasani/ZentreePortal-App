
// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { useParams } from "react-router-dom";
// import {
//   Box, Typography, Button, CircularProgress, Alert, Chip, Avatar,
//   Card, CardContent, LinearProgress, TextField, Radio, RadioGroup,
//   FormControlLabel, FormControl,
// } from "@mui/material";
// import {
//   Quiz, QuestionAnswer, Code, CheckCircle, AccessTime,
//   PlayArrow, ArrowForward, Lock,
// } from "@mui/icons-material";

// const BASE = process.env.REACT_APP_API_BASE_URL;

// const DIFFICULTY_COLOR = {
//   Easy:   { bg: "#e8f5e9", border: "#a5d6a7", text: "#1b5e20" },
//   Medium: { bg: "#fff8e1", border: "#ffe082", text: "#e65100" },
//   Hard:   { bg: "#fce4ec", border: "#f48fb1", text: "#880e4f" },
// };

// // ── Section config ────────────────────────────────────────────────────────────
// const SECTIONS = [
//   { key: "mcq",        label: "MCQ",        icon: <Quiz />,           color: "#7b1fa2" },
//   { key: "subjective", label: "Subjective",  icon: <QuestionAnswer />, color: "#0277bd" },
//   { key: "coding",     label: "Coding",      icon: <Code />,           color: "#2e7d32" },
// ];

// // ── Section Progress Bar ──────────────────────────────────────────────────────
// const SectionStepper = ({ sections, currentSection, completedSections }) => (
//   <Box display="flex" alignItems="center" gap={0} sx={{ overflowX: "auto" }}>
//     {sections.map((sec, i) => {
//       const isDone    = completedSections.includes(sec.key);
//       const isCurrent = currentSection === sec.key;
//       return (
//         <React.Fragment key={sec.key}>
//           <Box display="flex" flexDirection="column" alignItems="center" minWidth={90}>
//             <Box sx={{
//               width: 40, height: 40, borderRadius: "50%",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               bgcolor: isDone ? "#2e7d32" : isCurrent ? sec.color : "#e0e0e0",
//               color:   isDone || isCurrent ? "#fff" : "#9e9e9e",
//               fontWeight: 700, fontSize: 14,
//               boxShadow: isCurrent ? `0 0 0 3px ${sec.color}40` : "none",
//               transition: "all 0.3s",
//             }}>
//               {isDone ? <CheckCircle sx={{ fontSize: 22 }} /> : React.cloneElement(sec.icon, { sx: { fontSize: 20 } })}
//             </Box>
//             <Typography fontSize={10} fontWeight={isCurrent ? 700 : 400}
//               color={isCurrent ? sec.color : isDone ? "#2e7d32" : "#9e9e9e"} mt={0.5}>
//               {sec.label}
//             </Typography>
//           </Box>
//           {i < sections.length - 1 && (
//             <Box flex={1} height={2} bgcolor={isDone ? "#2e7d32" : "#e0e0e0"} mx={0.5}
//               sx={{ minWidth: 24, transition: "background 0.3s" }} />
//           )}
//         </React.Fragment>
//       );
//     })}
//   </Box>
// );

// export default function ExamPage() {
//   const { token } = useParams();

//   const [loading,    setLoading]    = useState(true);
//   const [exam,       setExam]       = useState(null);
//   const [error,      setError]      = useState("");
//   const [submitted,  setSubmitted]  = useState(false);
//   const [result,     setResult]     = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [timeLeft,   setTimeLeft]   = useState(null);

//   // ── Session state ──────────────────────────────────────────────────────────
//   // currentSection: "mcq" | "subjective" | "coding"
//   const [currentSection,    setCurrentSection]    = useState("mcq");
//   const [completedSections, setCompletedSections] = useState([]);
//   const [sectionError,      setSectionError]      = useState("");

//   // ── Answers ────────────────────────────────────────────────────────────────
//   const [mcqAnswers,  setMcqAnswers]  = useState({});
//   const [subjAnswers, setSubjAnswers] = useState({});
//   const [codeAnswers, setCodeAnswers] = useState({});

//   // ── Compiler state ─────────────────────────────────────────────────────────
//   const [compileResults, setCompileResults] = useState({});
//   const [compiling,      setCompiling]      = useState({});

//   // ── Load exam ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     fetch(`${BASE}/exams/take/${token}`)
//       .then(r => r.json())
//       .then(res => {
//         if (!res.success) { setError(res.message || "Could not load exam"); return; }
//         setExam(res.data);
//         setTimeLeft(res.data.time_limit_minutes * 60);
//         // Determine first section
//         const d = res.data;
//         if (d.mcq_questions?.length > 0) setCurrentSection("mcq");
//         else if (d.subjective_questions?.length > 0) setCurrentSection("subjective");
//         else setCurrentSection("coding");
//       })
//       .catch(() => setError("Failed to load exam. Please check your connection."))
//       .finally(() => setLoading(false));
//   }, [token]);

//   // ── Timer ─────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (timeLeft === null || submitted) return;
//     if (timeLeft <= 0) { handleSubmit(true); return; }
//     const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
//     return () => clearTimeout(t);
//   }, [timeLeft, submitted]);

//   const formatTime = (secs) => {
//     const m = Math.floor(secs / 60);
//     const s = secs % 60;
//     return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
//   };

//   // ── Active sections (only those with questions) ───────────────────────────
//   const activeSections = exam
//     ? SECTIONS.filter(s => {
//         if (s.key === "mcq")        return (exam.mcq_questions        || []).length > 0;
//         if (s.key === "subjective") return (exam.subjective_questions  || []).length > 0;
//         if (s.key === "coding")     return (exam.coding_questions      || []).length > 0;
//         return false;
//       })
//     : [];

//   const isLastSection = activeSections.length > 0 &&
//     activeSections[activeSections.length - 1]?.key === currentSection;

//   // ── Section completion validation ─────────────────────────────────────────
//   const validateSection = (section) => {
//     if (!exam) return false;
//     setSectionError("");

//     if (section === "mcq") {
//       const total    = (exam.mcq_questions || []).length;
//       const answered = Object.keys(mcqAnswers).length;
//       if (answered < total) {
//         setSectionError(`Please answer all MCQ questions. (${answered}/${total} answered)`);
//         return false;
//       }
//     }

//     if (section === "subjective") {
//       const total = (exam.subjective_questions || []).length;
//       const answered = Object.values(subjAnswers).filter(a => a.trim().length > 20).length;
//       if (answered < total) {
//         setSectionError(`Please answer all subjective questions with at least 20 characters each. (${answered}/${total} answered)`);
//         return false;
//       }
//     }

//     if (section === "coding") {
//       const total    = (exam.coding_questions || []).length;
//       const answered = Object.values(codeAnswers).filter(c => c.trim().length > 10).length;
//       if (answered < total) {
//         setSectionError(`Please submit code for all coding problems. (${answered}/${total} submitted)`);
//         return false;
//       }
//     }

//     return true;
//   };

//   // ── Move to next section ──────────────────────────────────────────────────
//   const goToNextSection = () => {
//     if (!validateSection(currentSection)) return;
//     const idx     = activeSections.findIndex(s => s.key === currentSection);
//     const next    = activeSections[idx + 1];
//     if (!next) return;
//     setCompletedSections(p => [...new Set([...p, currentSection])]);
//     setCurrentSection(next.key);
//     setSectionError("");
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   // ── Run Code ──────────────────────────────────────────────────────────────
//   const runCode = async (idx, language) => {
//     const code = codeAnswers[idx] || "";
//     if (!code.trim()) return;

//     setCompiling(p => ({ ...p, [idx]: true }));
//     try {
//       const res  = await fetch(`${BASE}/exams/compile`, {
//         method:  "POST",
//         headers: { "Content-Type": "application/json" },
//         body:    JSON.stringify({ code, language }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         setCompileResults(p => ({ ...p, [idx]: { ...data.data } }));
//       } else {
//         setCompileResults(p => ({ ...p, [idx]: { stderr: data.message || "Compiler error" } }));
//       }
//     } catch {
//       setCompileResults(p => ({ ...p, [idx]: { stderr: "Compiler service unavailable." } }));
//     } finally {
//       setCompiling(p => ({ ...p, [idx]: false }));
//     }
//   };

//   // ── Submit ────────────────────────────────────────────────────────────────
//   const handleSubmit = useCallback(async (autoSubmit = false) => {
//     if (submitting || submitted) return;

//     // Validate last section
//     if (!autoSubmit && !validateSection(currentSection)) return;

//     if (!autoSubmit) {
//       if (!window.confirm("Are you sure you want to submit the exam? This cannot be undone.")) return;
//     }

//     setSubmitting(true);
//     setSectionError("");

//     const payload = {
//       mcq: Object.entries(mcqAnswers).map(([i, opt]) => ({
//         question_index: Number(i), selected_option: opt,
//       })),
//       subjective: Object.entries(subjAnswers).map(([i, ans]) => ({
//         question_index: Number(i), answer: ans,
//       })),
//       coding: Object.entries(codeAnswers).map(([i, code]) => ({
//         question_index: Number(i),
//         code,
//         run_output: compileResults[Number(i)]?.stdout  || "",
//         run_stderr: compileResults[Number(i)]?.stderr  || "",
//         run_status: compileResults[Number(i)]?.status  || "",
//       })),
//     };

//     try {
//       const res  = await fetch(`${BASE}/exams/submit/${token}`, {
//         method:  "POST",
//         headers: { "Content-Type": "application/json" },
//         body:    JSON.stringify(payload),
//       });
//       const data = await res.json();
//       if (data.success) {
//         setSubmitted(true);
//         setResult(data.data);
//       } else {
//         setSectionError(data.message || "Submission failed. Please try again.");
//       }
//     } catch {
//       setSectionError("Submission failed. Please check your connection.");
//     } finally {
//       setSubmitting(false);
//     }
//   }, [exam, mcqAnswers, subjAnswers, codeAnswers, compileResults, token, submitting, submitted, currentSection]);

//   // ── Loading ───────────────────────────────────────────────────────────────
//   if (loading) return (
//     <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
//       <CircularProgress size={48} />
//     </Box>
//   );

//   if (error) return (
//     <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={3}>
//       <Box textAlign="center" maxWidth={480}>
//         <Avatar sx={{ width: 80, height: 80, bgcolor: "#fce4ec", mx: "auto", mb: 2 }}>
//           <Quiz sx={{ fontSize: 40, color: "#c62828" }} />
//         </Avatar>
//         <Typography variant="h5" fontWeight={700} color="error.main" mb={1}>Exam Unavailable</Typography>
//         <Typography color="text.secondary">{error}</Typography>
//       </Box>
//     </Box>
//   );

//   // ── Submitted screen ──────────────────────────────────────────────────────
//   if (submitted && result) return (
//     <Box minHeight="100vh" sx={{ background: "linear-gradient(135deg,#e8f5e9 0%,#e3f2fd 100%)" }} p={3}>
//       <Box maxWidth={640} mx="auto" pt={6}>
//         <Box textAlign="center" mb={4}>
//           <Avatar sx={{ width: 100, height: 100, bgcolor: "#e8f5e9", mx: "auto", mb: 2 }}>
//             <CheckCircle sx={{ fontSize: 56, color: "#2e7d32" }} />
//           </Avatar>
//           <Typography variant="h4" fontWeight={800} color="success.dark">Exam Submitted!</Typography>
//           <Typography color="text.secondary" fontSize={15} mt={1}>
//             Thank you, <strong>{exam?.candidate_name}</strong>. Your responses have been graded.
//           </Typography>
//         </Box>

//         {/* Overall score */}
//         <Card sx={{ mb: 3, borderRadius: 3, textAlign: "center", p: 2 }}>
//           <Typography fontSize={11} fontWeight={700} color="text.secondary"
//             textTransform="uppercase" letterSpacing={0.6} mb={1}>Overall Score</Typography>
//           <Typography fontSize={64} fontWeight={900}
//             color={result.overall_score >= 70 ? "#2e7d32" : result.overall_score >= 50 ? "#e65100" : "#c62828"}
//             lineHeight={1}>
//             {result.overall_score}%
//           </Typography>
//           <LinearProgress variant="determinate" value={result.overall_score}
//             sx={{ mt: 1.5, height: 8, borderRadius: 4, bgcolor: "#e0e0e0",
//                   "& .MuiLinearProgress-bar": {
//                     bgcolor: result.overall_score >= 70 ? "#2e7d32" : result.overall_score >= 50 ? "#e65100" : "#c62828"
//                   }}} />
//         </Card>

//         {/* Section scores */}
//         <Box display="flex" gap={2} mb={3} flexWrap="wrap">
//           {result.mcq_total > 0 && (
//             <Card sx={{ flex: 1, minWidth: 150, borderRadius: 2, p: 2, textAlign: "center",
//                         border: "1px solid #e8eaf6" }}>
//               <Typography fontSize={10} fontWeight={700} color="#7b1fa2"
//                 textTransform="uppercase" letterSpacing={0.6} mb={0.5}>MCQ</Typography>
//               <Typography fontSize={36} fontWeight={800} color="#7b1fa2" lineHeight={1}>
//                 {result.mcq_score}%
//               </Typography>
//               <Typography fontSize={11} color="text.secondary" mt={0.3}>
//                 {result.mcq_correct}/{result.mcq_total} correct
//               </Typography>
//             </Card>
//           )}
//           {result.subj_count > 0 && (
//             <Card sx={{ flex: 1, minWidth: 150, borderRadius: 2, p: 2, textAlign: "center",
//                         border: "1px solid #e3f2fd" }}>
//               <Typography fontSize={10} fontWeight={700} color="#0277bd"
//                 textTransform="uppercase" letterSpacing={0.6} mb={0.5}>Subjective</Typography>
//               <Typography fontSize={36} fontWeight={800} color="#0277bd" lineHeight={1}>
//                 {result.subj_score}%
//               </Typography>
//               <Typography fontSize={11} color="text.secondary" mt={0.3}>
//                 {result.subj_count} answered
//               </Typography>
//             </Card>
//           )}
//           {result.code_count > 0 && (
//             <Card sx={{ flex: 1, minWidth: 150, borderRadius: 2, p: 2, textAlign: "center",
//                         border: "1px solid #e8f5e9" }}>
//               <Typography fontSize={10} fontWeight={700} color="#2e7d32"
//                 textTransform="uppercase" letterSpacing={0.6} mb={0.5}>Coding</Typography>
//               <Typography fontSize={36} fontWeight={800} color="#2e7d32" lineHeight={1}>
//                 {result.code_score}%
//               </Typography>
//               <Typography fontSize={11} color="text.secondary" mt={0.3}>
//                 {result.code_count} submitted
//               </Typography>
//             </Card>
//           )}
//         </Box>

//         {/* Subjective feedback */}
//         {result.subj_feedback?.length > 0 && (
//           <Card sx={{ mb: 2, borderRadius: 2 }}>
//             <CardContent>
//               <Typography fontWeight={700} fontSize={13} color="#0277bd" mb={1.5}>
//                 Subjective Feedback
//               </Typography>
//               {result.subj_feedback.map((fb, i) => (
//                 <Box key={i} mb={2} p={1.5} bgcolor="#f8fafc" borderRadius={1.5}>
//                   <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8}>
//                     <Typography fontSize={12} fontWeight={700} color="text.primary">
//                       Q{i + 1}: {fb.q.slice(0, 80)}{fb.q.length > 80 ? "…" : ""}
//                     </Typography>
//                     <Chip label={`${fb.score}/${fb.max}`} size="small"
//                       sx={{ bgcolor: fb.score >= 7 ? "#e8f5e9" : fb.score >= 5 ? "#fff8e1" : "#fce4ec",
//                             color: fb.score >= 7 ? "#2e7d32" : fb.score >= 5 ? "#e65100" : "#c62828",
//                             fontWeight: 700, fontSize: 11 }} />
//                   </Box>
//                   <Typography fontSize={12} color="text.secondary">{fb.feedback}</Typography>
//                   <Chip label={fb.verdict} size="small" variant="outlined"
//                     sx={{ mt: 0.8, fontSize: 10 }} />
//                 </Box>
//               ))}
//             </CardContent>
//           </Card>
//         )}

//         {/* Coding feedback */}
//         {result.code_feedback?.length > 0 && (
//           <Card sx={{ mb: 3, borderRadius: 2 }}>
//             <CardContent>
//               <Typography fontWeight={700} fontSize={13} color="#2e7d32" mb={1.5}>
//                 Coding Feedback
//               </Typography>
//               {result.code_feedback.map((fb, i) => (
//                 <Box key={i} mb={2} p={1.5} bgcolor="#f8fafc" borderRadius={1.5}>
//                   <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8}>
//                     <Typography fontSize={12} fontWeight={700} color="text.primary">
//                       Problem {i + 1}: {fb.q.split("\n")[0].slice(0, 60)}…
//                     </Typography>
//                     <Chip label={`${fb.score}/${fb.max}`} size="small"
//                       sx={{ bgcolor: fb.score >= 7 ? "#e8f5e9" : fb.score >= 5 ? "#fff8e1" : "#fce4ec",
//                             color: fb.score >= 7 ? "#2e7d32" : fb.score >= 5 ? "#e65100" : "#c62828",
//                             fontWeight: 700, fontSize: 11 }} />
//                   </Box>
//                   {!fb.lang_ok && (
//                     <Alert severity="error" sx={{ mb: 0.8, py: 0, fontSize: 11 }}>
//                       Wrong language used — solution scored 0
//                     </Alert>
//                   )}
//                   <Typography fontSize={12} color="text.secondary">{fb.feedback}</Typography>
//                   <Chip label={fb.verdict} size="small" variant="outlined"
//                     sx={{ mt: 0.8, fontSize: 10 }} />
//                 </Box>
//               ))}
//             </CardContent>
//           </Card>
//         )}

//         <Typography fontSize={13} color="text.secondary" textAlign="center">
//           The recruiter has been notified with your scores. You may close this window.
//         </Typography>
//       </Box>
//     </Box>
//   );

//   if (!exam) return null;

//   const mcqList  = exam.mcq_questions        || [];
//   const subjList = exam.subjective_questions  || [];
//   const codeList = exam.coding_questions      || [];
//   const timePct  = timeLeft !== null ? (timeLeft / (exam.time_limit_minutes * 60)) * 100 : 100;
//   const timeColor = timeLeft < 300 ? "#c62828" : timeLeft < 600 ? "#f57c00" : "#2e7d32";
//   const answeredMCQ = Object.keys(mcqAnswers).length;

//   const currentSectionMeta = SECTIONS.find(s => s.key === currentSection);

//   return (
//     <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>

//       {/* ── Sticky Header ─────────────────────────────────────────────────── */}
//       <Box sx={{
//         position: "sticky", top: 0, zIndex: 1000,
//         bgcolor: "#1a237e", color: "#fff", px: 3, py: 1.5,
//         display: "flex", alignItems: "center", justifyContent: "space-between",
//         boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
//       }}>
//         <Box>
//           <Typography fontWeight={700} fontSize={15}>{exam.job_title}</Typography>
//           <Typography fontSize={11} sx={{ color: "#90caf9" }}>
//             {exam.client_name} · {exam.exam_id}
//           </Typography>
//         </Box>
//         <Box display="flex" alignItems="center" gap={2}>
//           {currentSection === "mcq" && mcqList.length > 0 && (
//             <Box textAlign="center">
//               <Typography fontSize={11} sx={{ color: "#90caf9" }}>MCQ answered</Typography>
//               <Typography fontWeight={700}>{answeredMCQ}/{mcqList.length}</Typography>
//             </Box>
//           )}
//           {timeLeft !== null && (
//             <Box sx={{
//               bgcolor: timeLeft < 300 ? "#c62828" : "#0d47a1",
//               px: 2, py: 0.8, borderRadius: 2, minWidth: 90, textAlign: "center",
//             }}>
//               <Box display="flex" alignItems="center" gap={0.8}>
//                 <AccessTime sx={{ fontSize: 16 }} />
//                 <Typography fontWeight={800} fontSize={18} fontFamily="monospace">
//                   {formatTime(timeLeft)}
//                 </Typography>
//               </Box>
//             </Box>
//           )}
//         </Box>
//       </Box>

//       {/* Timer bar */}
//       <LinearProgress variant="determinate" value={timePct}
//         sx={{ height: 4, bgcolor: "#e0e0e0",
//               "& .MuiLinearProgress-bar": { bgcolor: timeColor, transition: "none" } }} />

//       <Box maxWidth={960} mx="auto" p={3}>

//         {/* ── Section stepper ─────────────────────────────────────────────── */}
//         <Card sx={{ mb: 3, borderRadius: 2, p: 2 }}>
//           <SectionStepper
//             sections={activeSections}
//             currentSection={currentSection}
//             completedSections={completedSections}
//           />
//         </Card>

//         {/* ── Section header ───────────────────────────────────────────────── */}
//         <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
//           <Box sx={{
//             width: 40, height: 40, borderRadius: 2,
//             bgcolor: currentSectionMeta?.color, display: "flex",
//             alignItems: "center", justifyContent: "center",
//           }}>
//             {currentSectionMeta && React.cloneElement(currentSectionMeta.icon, { sx: { color: "#fff", fontSize: 22 } })}
//           </Box>
//           <Box>
//             <Typography fontWeight={800} fontSize={18} color="#0f172a">
//               {currentSectionMeta?.label} Section
//             </Typography>
//             <Typography fontSize={12} color="text.secondary">
//               {currentSection === "mcq"        && `${mcqList.length} questions — select the best answer for each`}
//               {currentSection === "subjective"  && `${subjList.length} questions — write detailed answers`}
//               {currentSection === "coding"      && `${codeList.length} problems — write your solution in the required language`}
//             </Typography>
//           </Box>
//         </Box>

//         {/* Section validation error */}
//         {sectionError && (
//           <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSectionError("")}>
//             {sectionError}
//           </Alert>
//         )}

//         {/* ── MCQ Section ──────────────────────────────────────────────────── */}
//         {currentSection === "mcq" && mcqList.map((q, i) => {
//           const diffStyle = DIFFICULTY_COLOR[q.difficulty] || {};
//           const isAnswered = !!mcqAnswers[i];
//           return (
//             <Card key={i} sx={{
//               mb: 2, borderRadius: 2,
//               border: isAnswered ? "1.5px solid #a5d6a7" : "1px solid #e0e0e0",
//               transition: "border 0.2s",
//             }}>
//               <CardContent>
//                 <Box display="flex" alignItems="flex-start" gap={1} mb={2} flexWrap="wrap">
//                   <Chip label={`Q${i + 1}`} size="small"
//                     sx={{ bgcolor: "#7b1fa2", color: "#fff", fontWeight: 700, fontSize: 11 }} />
//                   {q.difficulty && (
//                     <Chip label={q.difficulty} size="small"
//                       sx={{ fontSize: 10, bgcolor: diffStyle.bg, color: diffStyle.text,
//                             border: `1px solid ${diffStyle.border}` }} />
//                   )}
//                   {q.topic && <Chip label={q.topic} size="small" variant="outlined" sx={{ fontSize: 10 }} />}
//                   {isAnswered && (
//                     <Chip label="✓ Answered" size="small" color="success"
//                       sx={{ fontSize: 10, ml: "auto" }} />
//                   )}
//                 </Box>
//                 <Typography fontWeight={600} fontSize={14} mb={2}>{q.question}</Typography>
//                 <FormControl component="fieldset" fullWidth>
//                   <RadioGroup value={mcqAnswers[i] || ""}
//                     onChange={e => setMcqAnswers(p => ({ ...p, [i]: e.target.value }))}>
//                     {(q.options || []).map((opt, j) => (
//                       <FormControlLabel key={j} value={opt}
//                         control={<Radio size="small" sx={{ color: "#7b1fa2", "&.Mui-checked": { color: "#7b1fa2" } }} />}
//                         label={<Typography fontSize={13}>{opt}</Typography>}
//                         sx={{
//                           mb: 0.8, px: 1.5, py: 0.8, borderRadius: 1.5, border: "1px solid",
//                           borderColor: mcqAnswers[i] === opt ? "#a5d6a7" : "#e0e0e0",
//                           bgcolor:     mcqAnswers[i] === opt ? "#e8f5e9" : "transparent",
//                           transition: "all 0.15s",
//                           "&:hover": { bgcolor: "#f5f0ff" },
//                         }}
//                       />
//                     ))}
//                   </RadioGroup>
//                 </FormControl>
//               </CardContent>
//             </Card>
//           );
//         })}

//         {/* ── Subjective Section ───────────────────────────────────────────── */}
//         {currentSection === "subjective" && subjList.map((q, i) => {
//           const diffStyle  = DIFFICULTY_COLOR[q.difficulty] || {};
//           const charCount  = (subjAnswers[i] || "").length;
//           const isAnswered = charCount >= 20;
//           return (
//             <Card key={i} sx={{
//               mb: 2, borderRadius: 2,
//               border: isAnswered ? "1.5px solid #90caf9" : "1px solid #e0e0e0",
//             }}>
//               <CardContent>
//                 <Box display="flex" alignItems="flex-start" gap={1} mb={2} flexWrap="wrap">
//                   <Chip label={`Q${i + 1}`} size="small"
//                     sx={{ bgcolor: "#0277bd", color: "#fff", fontWeight: 700, fontSize: 11 }} />
//                   {q.skill && (
//                     <Chip label={q.skill} size="small" variant="outlined"
//                       sx={{ fontSize: 10, borderColor: "#0277bd", color: "#0277bd" }} />
//                   )}
//                   {q.difficulty && (
//                     <Chip label={q.difficulty} size="small"
//                       sx={{ fontSize: 10, bgcolor: diffStyle.bg, color: diffStyle.text,
//                             border: `1px solid ${diffStyle.border}` }} />
//                   )}
//                   {isAnswered && (
//                     <Chip label="✓ Answered" size="small" color="info" sx={{ fontSize: 10, ml: "auto" }} />
//                   )}
//                 </Box>
//                 <Typography fontWeight={600} fontSize={14} mb={2}>{q.question}</Typography>
//                 <TextField
//                   fullWidth multiline rows={7} size="small"
//                   placeholder="Write a detailed answer. The AI will evaluate depth, accuracy, and key points covered…"
//                   value={subjAnswers[i] || ""}
//                   onChange={e => setSubjAnswers(p => ({ ...p, [i]: e.target.value }))}
//                   sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
//                 />
//                 <Box display="flex" justifyContent="space-between" mt={0.5}>
//                   <Typography fontSize={11} color={charCount < 20 ? "error" : "text.disabled"}>
//                     {charCount < 20 ? `Minimum 20 characters required (${20 - charCount} more)` : "Good length ✓"}
//                   </Typography>
//                   <Typography fontSize={11} color="text.disabled">{charCount} chars</Typography>
//                 </Box>
//               </CardContent>
//             </Card>
//           );
//         })}

//         {/* ── Coding Section ───────────────────────────────────────────────── */}
//         {currentSection === "coding" && codeList.map((q, i) => {
//           const cr        = compileResults[i];
//           const isRunning = compiling[i];
//           // Language is LOCKED to question's language — no switcher
//           const lang      = q.programming_language || "Python";
//           const hasCode   = (codeAnswers[i] || "").trim().length > 10;
//           const diffStyle = DIFFICULTY_COLOR[q.difficulty] || {};

//           return (
//             <Card key={i} sx={{ mb: 3, borderRadius: 2, border: "1px solid #3d3d5c", overflow: "hidden" }}>

//               {/* Terminal titlebar */}
//               <Box sx={{ bgcolor: "#2d2d3f", px: 2, py: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
//                 <Box display="flex" gap={0.6}>
//                   {["#ff5f57","#febc2e","#28c840"].map(c => (
//                     <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />
//                   ))}
//                 </Box>
//                 <Code sx={{ fontSize: 14, color: "#82aaff" }} />
//                 <Typography fontSize={12} fontWeight={700} color="#82aaff" flex={1}>
//                   Problem {i + 1}
//                   {q.topic && <span style={{ color: "#a9b1d6", fontWeight: 400 }}> · {q.topic}</span>}
//                 </Typography>
//                 {q.difficulty && (
//                   <Chip label={q.difficulty} size="small"
//                     sx={{ fontSize: 9, bgcolor: "#1a1a2e", color: "#c3e88d",
//                           border: "1px solid #414868" }} />
//                 )}
//               </Box>

//               {/* Problem statement */}
//               <Box sx={{ bgcolor: "#1e1e2e", px: 2.5, py: 2, borderBottom: "1px solid #3d3d5c" }}>
//                 <Typography fontSize={13} color="#cdd6f4" lineHeight={1.9}
//                   sx={{ whiteSpace: "pre-wrap", fontFamily: "'Fira Code','Consolas',monospace" }}>
//                   {q.question}
//                 </Typography>
//               </Box>

//               {/* Language lock notice */}
//               <Box sx={{
//                 bgcolor: "#1a1a2e", px: 2.5, py: 1,
//                 borderBottom: "1px solid #3d3d5c",
//                 display: "flex", alignItems: "center", gap: 1,
//               }}>
//                 <Lock sx={{ fontSize: 14, color: "#f9a825" }} />
//                 <Typography fontSize={12} color="#f9a825" fontWeight={700}>
//                   This problem must be solved in <strong>{lang}</strong> only.
//                   Solutions in other languages will be scored 0.
//                 </Typography>
//               </Box>

//               {/* Code area */}
//               <Box sx={{ p: 2 }}>
//                 <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
//                   <Chip label={lang} size="small"
//                     sx={{ bgcolor: "#2d2d3f", color: "#82aaff", fontWeight: 700, fontSize: 11 }} />
//                   <Button
//                     variant="contained" size="small"
//                     startIcon={isRunning ? <CircularProgress size={14} color="inherit" /> : <PlayArrow fontSize="small" />}
//                     onClick={() => runCode(i, lang)}
//                     disabled={isRunning || !hasCode}
//                     sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" },
//                           fontWeight: 700, fontSize: 12 }}
//                   >
//                     {isRunning ? "Running…" : "▶ Run Code"}
//                   </Button>
//                 </Box>

//                 <TextField
//                   fullWidth multiline rows={13} size="small"
//                   placeholder={`Write your ${lang} solution here…\n\n# Do NOT use any other language — only ${lang} is accepted.`}
//                   value={codeAnswers[i] || ""}
//                   onChange={e => setCodeAnswers(p => ({ ...p, [i]: e.target.value }))}
//                   sx={{
//                     "& .MuiOutlinedInput-root": {
//                       fontFamily: "'Fira Code','Consolas',monospace",
//                       fontSize: 13, bgcolor: "#f8f8f8", borderRadius: 1.5, lineHeight: 1.8,
//                     }
//                   }}
//                 />

//                 {/* Output */}
//                 {cr && (
//                   <Box sx={{ mt: 1.5, borderRadius: 1.5, overflow: "hidden", border: "1px solid #3d3d5c" }}>
//                     <Box sx={{ bgcolor: "#2d2d3f", px: 2, py: 0.8, display: "flex", alignItems: "center", gap: 1.5 }}>
//                       <Typography fontSize={11} fontWeight={700} color="#82aaff" flex={1}>Output</Typography>
//                       <Chip label={cr.status || "Unknown"} size="small"
//                         sx={{ fontSize: 10,
//                               bgcolor: cr.status === "Accepted" ? "#1b5e20" : "#b71c1c",
//                               color: "#fff" }} />
//                       {cr.time   && <Typography fontSize={10} color="#a9b1d6">{cr.time}s</Typography>}
//                       {cr.memory && <Typography fontSize={10} color="#a9b1d6">{cr.memory} KB</Typography>}
//                     </Box>
//                     {cr.stdout && (
//                       <Box sx={{ bgcolor: "#1e1e2e", px: 2, py: 1.5 }}>
//                         <Typography fontSize={11} color="#a9b1d6" fontWeight={700} mb={0.5}>stdout</Typography>
//                         <Typography fontSize={12} color="#a6e22e"
//                           sx={{ fontFamily: "'Fira Code','Consolas',monospace", whiteSpace: "pre-wrap" }}>
//                           {cr.stdout}
//                         </Typography>
//                       </Box>
//                     )}
//                     {(cr.stderr || cr.compile_output) && (
//                       <Box sx={{ bgcolor: "#1a0010", px: 2, py: 1.5 }}>
//                         <Typography fontSize={11} color="#f48fb1" fontWeight={700} mb={0.5}>
//                           {cr.compile_output ? "Compile Error" : "stderr"}
//                         </Typography>
//                         <Typography fontSize={12} color="#f92672"
//                           sx={{ fontFamily: "'Fira Code','Consolas',monospace", whiteSpace: "pre-wrap" }}>
//                           {cr.compile_output || cr.stderr}
//                         </Typography>
//                       </Box>
//                     )}
//                     {!cr.stdout && !cr.stderr && !cr.compile_output && (
//                       <Box sx={{ bgcolor: "#1e1e2e", px: 2, py: 1.5 }}>
//                         <Typography fontSize={12} color="#6272a4" fontStyle="italic">No output produced.</Typography>
//                       </Box>
//                     )}
//                   </Box>
//                 )}

//                 {!hasCode && (
//                   <Typography fontSize={11} color="error" mt={1}>
//                     ⚠ Write your {lang} solution above before proceeding.
//                   </Typography>
//                 )}
//               </Box>
//             </Card>
//           );
//         })}

//         {/* ── Bottom navigation ─────────────────────────────────────────────── */}
//         <Box display="flex" justifyContent="flex-end" mt={3} mb={6} gap={2}>
//           {!isLastSection ? (
//             <Button
//               variant="contained" size="large"
//               onClick={goToNextSection}
//               endIcon={<ArrowForward />}
//               sx={{
//                 px: 5, py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: 15,
//                 bgcolor: currentSectionMeta?.color,
//                 "&:hover": { filter: "brightness(0.9)" },
//               }}>
//               Next Section
//             </Button>
//           ) : (
//             <Button
//               variant="contained" size="large"
//               onClick={() => handleSubmit(false)}
//               disabled={submitting}
//               startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
//               sx={{
//                 px: 6, py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: 15,
//                 bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" },
//               }}>
//               {submitting ? "Submitting & Grading…" : "Submit Exam"}
//             </Button>
//           )}
//         </Box>
//       </Box>
//     </Box>
//   );
// }















































// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { useParams } from "react-router-dom";

// const BASE = process.env.REACT_APP_API_BASE_URL || "";

// const pad = (n) => String(n).padStart(2, "0");
// const fmt = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

// const DIFF = {
//   Easy:   { bg: "#e8f5e9", color: "#256029", border: "#81c784" },
//   Medium: { bg: "#fff3e0", color: "#bf360c", border: "#ffb74d" },
//   Hard:   { bg: "#fce4ec", color: "#880e4f", border: "#f48fb1" },
// };

// const STATUS_STYLE = {
//   current:      { bg: "#1565c0", color: "#fff", border: "#1565c0" },
//   answered:     { bg: "#43a047", color: "#fff", border: "#43a047" },
//   skipped:      { bg: "#fb8c00", color: "#fff", border: "#fb8c00" },
//   not_attempted:{ bg: "#e0e0e0", color: "#757575", border: "#bdbdbd" },
// };

// // ══════════════════════════════════════════════════════════════════════════════
// //  PROCTORING HOOK
// // ══════════════════════════════════════════════════════════════════════════════
// function useProctoring(examToken) {
//   const videoRef   = useRef(null);
//   const streamRef  = useRef(null);
//   const timerRef   = useRef(null);
//   const snapId     = useRef(0);
//   const [ready,  setReady]  = useState(false);
//   const [error,  setError]  = useState(null);
//   const [events, setEvents] = useState([]);
//   const [snaps,  setSnaps]  = useState([]);

//   const capture = useCallback(async (label = "periodic") => {
//     if (!videoRef.current || !ready) return;
//     const cv = document.createElement("canvas");
//     cv.width = 320; cv.height = 240;
//     cv.getContext("2d").drawImage(videoRef.current, 0, 0, 320, 240);
//     const dataUrl = cv.toDataURL("image/jpeg", 0.55);
//     const ts = new Date().toISOString();
//     snapId.current += 1;
//     const id = snapId.current;
//     try {
//       const b64 = dataUrl.split(",")[1];
//       const res = await fetch("https://api.anthropic.com/v1/messages", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           model: "claude-sonnet-4-20250514",
//           max_tokens: 200,
//           messages: [{ role: "user", content: [
//             { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
//             { type: "text", text: `Exam proctor. Analyze webcam frame. Return ONLY JSON:\n{"face_detected":bool,"face_count":int,"looking_away":bool,"flag":"ok"|"warning"|"alert","reason":""}` },
//           ]}],
//         }),
//       });
//       const d = await res.json();
//       const raw = (d?.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
//       let ai = {};
//       try { ai = JSON.parse(raw); } catch { ai = { flag: "ok" }; }
//       setSnaps(p => [...p.slice(-49), { id, ts, dataUrl, label, ai }]);
//       if (ai.flag !== "ok") {
//         const evt = { id: Date.now(), ts, type: ai.flag, msg: ai.reason || "Suspicious activity" };
//         setEvents(p => [...p.slice(-99), evt]);
//         fetch(`${BASE}/exams/proctor/${examToken}/event`, {
//           method: "POST", headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ ...evt, snapshot: dataUrl }),
//         }).catch(() => {});
//       }
//     } catch (_) {}
//   }, [ready, examToken]);

//   const start = useCallback(async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
//       streamRef.current = stream;
//       if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
//       setReady(true);
//     } catch { setError("Camera unavailable"); }
//   }, []);

//   useEffect(() => {
//     if (!ready) return;
//     const t = setTimeout(() => capture("initial"), 4000);
//     timerRef.current = setInterval(() => capture("periodic"), 30000);
//     return () => { clearTimeout(t); clearInterval(timerRef.current); };
//   }, [ready, capture]);

//   useEffect(() => {
//     const fn = () => {
//       if (document.hidden) {
//         const evt = { id: Date.now(), ts: new Date().toISOString(), type: "alert", msg: "Tab switch detected" };
//         setEvents(p => [...p, evt]);
//         fetch(`${BASE}/exams/proctor/${examToken}/event`, {
//           method: "POST", headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ ...evt, snapshot: null }),
//         }).catch(() => {});
//       }
//     };
//     document.addEventListener("visibilitychange", fn);
//     return () => document.removeEventListener("visibilitychange", fn);
//   }, [examToken]);

//   const stop = useCallback(() => {
//     clearInterval(timerRef.current);
//     streamRef.current?.getTracks().forEach(t => t.stop());
//   }, []);

//   return { videoRef, ready, error, events, snaps, start, stop };
// }

// // ══════════════════════════════════════════════════════════════════════════════
// //  RIGHT SIDEBAR — question palette + live cam feed (exactly like screenshot)
// // ══════════════════════════════════════════════════════════════════════════════
// function RightSidebar({ total, currentFlat, statusMap, onJump, videoRef, camReady, camError, events }) {
//   const alertCount = events.filter(e => e.type === "alert").length;
//   return (
//     <div style={{
//       width: 210, flexShrink: 0,
//       display: "flex", flexDirection: "column",
//       alignSelf: "flex-start",
//       position: "sticky", top: 60,
//     }}>
//       {/* ── Palette card ── */}
//       <div style={{
//         background: "#fff",
//         border: "1px solid #e0e0e0",
//         borderRadius: "10px 10px 0 0",
//         overflow: "hidden",
//       }}>
//         <div style={{
//           background: "#1a237e", color: "#fff",
//           padding: "9px 14px",
//           display: "flex", alignItems: "center", justifyContent: "space-between",
//         }}>
//           <span style={{ fontSize: 13, fontWeight: 700 }}>Total Question: {total}</span>
//           <span style={{
//             width: 18, height: 18, borderRadius: "50%",
//             background: "rgba(255,255,255,0.2)",
//             display: "flex", alignItems: "center", justifyContent: "center",
//             fontSize: 10, cursor: "help",
//           }} title="Question status palette">i</span>
//         </div>
//         {/* Number circles grid */}
//         <div style={{
//           padding: "10px 8px",
//           display: "grid",
//           gridTemplateColumns: "repeat(5, 1fr)",
//           gap: 5,
//           maxHeight: 240,
//           overflowY: "auto",
//         }}>
//           {Array.from({ length: total }, (_, i) => {
//             const st = i === currentFlat ? "current" : statusMap[i] || "not_attempted";
//             const s  = STATUS_STYLE[st];
//             return (
//               <button key={i} onClick={() => onJump(i)} title={`Q${i+1}`}
//                 style={{
//                   width: "100%", aspectRatio: "1", borderRadius: "50%",
//                   background: s.bg, color: s.color,
//                   border: `2px solid ${s.border}`,
//                   fontWeight: 700, fontSize: 11,
//                   cursor: "pointer",
//                   display: "flex", alignItems: "center", justifyContent: "center",
//                   transition: "transform 0.1s", boxSizing: "border-box", padding: 0,
//                 }}
//                 onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.2)"; }}
//                 onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
//               >
//                 {i + 1}
//               </button>
//             );
//           })}
//         </div>
//         {/* Legend */}
//         <div style={{
//           padding: "8px 10px",
//           borderTop: "1px solid #f0f0f0",
//           display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 6px",
//         }}>
//           {[
//             ["current",       "Current"],
//             ["answered",      "Answered"],
//             ["skipped",       "Skipped"],
//             ["not_attempted", "Not Attempted"],
//           ].map(([key, lbl]) => (
//             <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
//               <div style={{
//                 width: 11, height: 11, borderRadius: "50%",
//                 background: STATUS_STYLE[key].bg,
//                 border: `1.5px solid ${STATUS_STYLE[key].border}`,
//                 flexShrink: 0,
//               }} />
//               <span style={{ fontSize: 9, color: "#555" }}>{lbl}</span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ── Live cam feed ── */}
//       <div style={{
//         background: "#1a1a2e",
//         border: "1px solid #e0e0e0",
//         borderTop: "2px solid #1565c0",
//         borderRadius: "0 0 10px 10px",
//         overflow: "hidden",
//         position: "relative",
//       }}>
//         <video ref={videoRef} autoPlay muted playsInline
//           style={{ width: "100%", display: "block", aspectRatio: "4/3", objectFit: "cover" }}
//         />
//         {/* Overlay status */}
//         <div style={{
//           position: "absolute", bottom: 0, left: 0, right: 0,
//           background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
//           padding: "14px 10px 7px",
//           display: "flex", alignItems: "center", justifyContent: "space-between",
//         }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
//             <div style={{
//               width: 7, height: 7, borderRadius: "50%",
//               background: camReady ? "#43a047" : "#9e9e9e",
//               boxShadow: camReady ? "0 0 5px #43a047" : "none",
//             }} />
//             <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>
//               {camReady ? "Monitored" : camError ? "No Camera" : "Starting…"}
//             </span>
//           </div>
//           {alertCount > 0 && (
//             <div style={{
//               background: "#c62828", borderRadius: 8,
//               padding: "1px 7px", fontSize: 9, color: "#fff", fontWeight: 700,
//             }}>{alertCount}⚠</div>
//           )}
//         </div>
//         {/* Blue arrow like in screenshot */}
//         <div style={{
//           position: "absolute", right: -16, top: "50%",
//           transform: "translateY(-50%)",
//           borderTop: "8px solid transparent",
//           borderBottom: "8px solid transparent",
//           borderRight: "10px solid #1565c0",
//         }} />
//       </div>

//       <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
//     </div>
//   );
// }

// // ══════════════════════════════════════════════════════════════════════════════
// //  RESULT SCREEN
// // ══════════════════════════════════════════════════════════════════════════════
// function ResultScreen({ result, exam, events, snaps }) {
//   const [tab, setTab] = useState("scores");
//   const flagged = snaps.filter(s => s.ai?.flag !== "ok");
//   return (
//     <div style={{ minHeight: "100vh", background: "#f0f4f8", padding: "32px 16px" }}>
//       <div style={{ maxWidth: 640, margin: "0 auto" }}>
//         <div style={{ textAlign: "center", marginBottom: 24 }}>
//           <div style={{ fontSize: 52, marginBottom: 8 }}>🎉</div>
//           <div style={{ fontSize: 24, fontWeight: 800, color: "#1b5e20" }}>Exam Submitted!</div>
//           <div style={{ color: "#666", marginTop: 4, fontSize: 14 }}>
//             Thank you <strong>{exam?.candidate_name}</strong> — your responses have been graded.
//           </div>
//         </div>
//         <div style={{ display: "flex", background: "#fff", borderRadius: 10, border: "1px solid #e0e0e0", padding: 4, marginBottom: 14, gap: 4 }}>
//           {[["scores","Scores"],["proctoring","Monitoring"],["snapshots","Snapshots"]].map(([k,l]) => (
//             <button key={k} onClick={() => setTab(k)} style={{
//               flex: 1, padding: 7, borderRadius: 7, border: "none",
//               cursor: "pointer", fontWeight: 600, fontSize: 13,
//               background: tab === k ? "#1a237e" : "transparent",
//               color: tab === k ? "#fff" : "#666",
//             }}>
//               {l}
//               {k === "proctoring" && events.length > 0 && <span style={{ background: "#f44336", color: "#fff", borderRadius: 8, padding: "0 5px", fontSize: 9, marginLeft: 4 }}>{events.length}</span>}
//               {k === "snapshots"  && flagged.length > 0 && <span style={{ background: "#fb8c00", color: "#fff", borderRadius: 8, padding: "0 5px", fontSize: 9, marginLeft: 4 }}>{flagged.length}</span>}
//             </button>
//           ))}
//         </div>
//         {tab === "scores" && (
//           <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//             <div style={{ background: "#fff", borderRadius: 12, padding: 22, textAlign: "center", border: "1px solid #e0e0e0" }}>
//               <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: 1 }}>Overall Score</div>
//               <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.1, color: result.overall_score >= 70 ? "#2e7d32" : result.overall_score >= 50 ? "#e65100" : "#c62828" }}>{result.overall_score}%</div>
//               <div style={{ height: 8, background: "#eee", borderRadius: 4, marginTop: 10, overflow: "hidden" }}>
//                 <div style={{ width: `${result.overall_score}%`, height: "100%", borderRadius: 4, background: result.overall_score >= 70 ? "#2e7d32" : result.overall_score >= 50 ? "#e65100" : "#c62828", transition: "width 1.2s ease" }} />
//               </div>
//             </div>
//             <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
//               {result.mcq_total > 0    && <div style={{ flex: 1, minWidth: 120, background: "#f3e5f5", borderRadius: 10, padding: "12px", textAlign: "center" }}><div style={{ fontSize: 9, fontWeight: 700, color: "#7b1fa2", textTransform: "uppercase" }}>MCQ</div><div style={{ fontSize: 30, fontWeight: 800, color: "#7b1fa2" }}>{result.mcq_score}%</div><div style={{ fontSize: 10, color: "#888" }}>{result.mcq_correct}/{result.mcq_total}</div></div>}
//               {result.subj_count > 0   && <div style={{ flex: 1, minWidth: 120, background: "#e3f2fd", borderRadius: 10, padding: "12px", textAlign: "center" }}><div style={{ fontSize: 9, fontWeight: 700, color: "#0277bd", textTransform: "uppercase" }}>Written</div><div style={{ fontSize: 30, fontWeight: 800, color: "#0277bd" }}>{result.subj_score}%</div></div>}
//               {result.code_count > 0   && <div style={{ flex: 1, minWidth: 120, background: "#e8f5e9", borderRadius: 10, padding: "12px", textAlign: "center" }}><div style={{ fontSize: 9, fontWeight: 700, color: "#2e7d32", textTransform: "uppercase" }}>Coding</div><div style={{ fontSize: 30, fontWeight: 800, color: "#2e7d32" }}>{result.code_score}%</div></div>}
//             </div>
//           </div>
//         )}
//         {tab === "proctoring" && (
//           <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e0e0e0" }}>
//             <div style={{ fontWeight: 700, marginBottom: 10 }}>Events ({events.length})</div>
//             {events.length === 0 ? <div style={{ color: "#2e7d32", textAlign: "center", padding: 28 }}>✓ No issues detected</div>
//               : events.map(e => (
//                 <div key={e.id} style={{ padding: "7px 12px", borderRadius: 7, marginBottom: 5, background: e.type === "alert" ? "#fce4ec" : "#fff8e1", border: `1px solid ${e.type === "alert" ? "#f48fb1" : "#ffe082"}`, display: "flex", gap: 8 }}>
//                   <span>{e.type === "alert" ? "🚨" : "⚠️"}</span>
//                   <div><div style={{ fontSize: 12, fontWeight: 600, color: e.type === "alert" ? "#c62828" : "#e65100" }}>{e.msg}</div><div style={{ fontSize: 10, color: "#999" }}>{new Date(e.ts).toLocaleTimeString()}</div></div>
//                 </div>
//               ))
//             }
//           </div>
//         )}
//         {tab === "snapshots" && (
//           <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e0e0e0" }}>
//             <div style={{ fontWeight: 700, marginBottom: 10 }}>Captured Frames ({snaps.length}){flagged.length > 0 && <span style={{ color: "#c62828", marginLeft: 8, fontSize: 12 }}>{flagged.length} flagged</span>}</div>
//             {snaps.length === 0 ? <div style={{ color: "#999", textAlign: "center", padding: 28 }}>No snapshots</div>
//               : <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7 }}>
//                   {[...snaps].reverse().map(s => (
//                     <div key={s.id}><img src={s.dataUrl} alt="" style={{ width: "100%", borderRadius: 5, border: s.ai?.flag === "alert" ? "2px solid #f44336" : s.ai?.flag === "warning" ? "2px solid #fb8c00" : "1px solid #e0e0e0" }} /><div style={{ fontSize: 9, color: "#999", marginTop: 2, textAlign: "center" }}>{new Date(s.ts).toLocaleTimeString()}</div></div>
//                   ))}
//                 </div>
//             }
//           </div>
//         )}
//         <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 18 }}>Recruiter notified. You may close this tab.</div>
//       </div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════════════════════════════════════════
// //  MAIN EXAM PAGE
// // ══════════════════════════════════════════════════════════════════════════════
// export default function ExamPage() {
//   const { token } = useParams();

//   const [loading,    setLoading]    = useState(true);
//   const [exam,       setExam]       = useState(null);
//   const [error,      setError]      = useState("");
//   const [submitted,  setSubmitted]  = useState(false);
//   const [result,     setResult]     = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [timeLeft,   setTimeLeft]   = useState(null);

//   // Flat question list: [{type, origIdx, q}]
//   const [allQ, setAllQ] = useState([]);

//   // Navigation state
//   const [cursor,       setCursor]       = useState(0);  // main forward cursor
//   const [skippedSet,   setSkippedSet]   = useState(new Set());
//   const [inReview,     setInReview]     = useState(false); // reviewing skipped
//   const [reviewQueue,  setReviewQueue]  = useState([]);    // flat indices of skipped
//   const [reviewPos,    setReviewPos]    = useState(0);

//   // Answers: {flatIdx: string}
//   const [answers,  setAnswers]  = useState({});
//   const [compRes,  setCompRes]  = useState({});
//   const [compiling,setCompiling]= useState({});

//   const proctor = useProctoring(token);

//   // ── Load exam ───────────────────────────────────────────────────────────────
//   useEffect(() => {
//     fetch(`${BASE}/exams/take/${token}`)
//       .then(r => r.json())
//       .then(res => {
//         if (!res.success) { setError(res.message || "Could not load exam"); return; }
//         const d = res.data;
//         setExam(d);
//         setTimeLeft(d.time_limit_minutes * 60);
//         const flat = [];
//         (d.mcq_questions        || []).forEach((q, i) => flat.push({ type: "mcq",        origIdx: i, q }));
//         (d.subjective_questions || []).forEach((q, i) => flat.push({ type: "subjective",  origIdx: i, q }));
//         (d.coding_questions     || []).forEach((q, i) => flat.push({ type: "coding",      origIdx: i, q }));
//         setAllQ(flat);
//         proctor.start();
//       })
//       .catch(() => setError("Failed to load exam."))
//       .finally(() => setLoading(false));
//   }, [token]);

//   // ── Timer ───────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (timeLeft === null || submitted) return;
//     if (timeLeft <= 0) { doSubmit(true); return; }
//     const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
//     return () => clearTimeout(t);
//   }, [timeLeft, submitted]);

//   // ── Derived: which flat index is "current" ──────────────────────────────────
//   const currentFlat = inReview ? reviewQueue[reviewPos] : cursor;
//   const entry = allQ[currentFlat] || null;
//   const totalQ = allQ.length;

//   // ── Status map for palette ──────────────────────────────────────────────────
//   const statusMap = {};
//   allQ.forEach((_, i) => {
//     const ans = (answers[i] || "").toString().trim();
//     if (ans)                          statusMap[i] = "answered";
//     else if (skippedSet.has(i))       statusMap[i] = "skipped";
//     else                              statusMap[i] = "not_attempted";
//   });
//   const answeredN = allQ.filter((_, i) => statusMap[i] === "answered").length;
//   const skippedN  = allQ.filter((_, i) => statusMap[i] === "skipped").length;

//   // ── Save & Next ─────────────────────────────────────────────────────────────
//   const goNext = () => {
//     // Unmark as skipped if they answered it now
//     if (skippedSet.has(currentFlat) && (answers[currentFlat] || "").toString().trim()) {
//       setSkippedSet(s => { const n = new Set(s); n.delete(currentFlat); return n; });
//     }

//     if (inReview) {
//       const nextPos = reviewPos + 1;
//       if (nextPos < reviewQueue.length) {
//         setReviewPos(nextPos);
//       } else {
//         // Done with review — check if any still unanswered skipped remain
//         const stillSkipped = reviewQueue.filter(i => !(answers[i] || "").toString().trim());
//         if (stillSkipped.length > 0) {
//           setReviewQueue(stillSkipped);
//           setReviewPos(0);
//         } else {
//           setInReview(false);
//         }
//       }
//       return;
//     }

//     const next = cursor + 1;
//     if (next < totalQ) {
//       setCursor(next);
//     } else {
//       // Reached end of main list — check for skipped
//       const skippedList = allQ.map((_, i) => i).filter(i => skippedSet.has(i) && !(answers[i] || "").toString().trim());
//       if (skippedList.length > 0) {
//         setReviewQueue(skippedList);
//         setReviewPos(0);
//         setInReview(true);
//       }
//       // else stay on last question and show submit
//     }
//   };

//   // ── Skip ─────────────────────────────────────────────────────────────────────
//   const doSkip = () => {
//     setSkippedSet(s => new Set([...s, currentFlat]));
//     // Clear any existing answer so it stays orange
//     setAnswers(p => { const n = { ...p }; delete n[currentFlat]; return n; });
//     goNext();
//   };

//   // ── Prev ─────────────────────────────────────────────────────────────────────
//   const goPrev = () => {
//     if (inReview) {
//       if (reviewPos > 0) setReviewPos(p => p - 1);
//     } else {
//       if (cursor > 0) setCursor(c => c - 1);
//     }
//   };

//   // ── Jump from palette ─────────────────────────────────────────────────────────
//   const jumpTo = (i) => {
//     setInReview(false);
//     setCursor(i);
//   };

//   // Is this the last navigable question and should we show Submit?
//   const isLastMainQ  = !inReview && cursor === totalQ - 1;
//   const isLastReview = inReview  && reviewPos === reviewQueue.length - 1;
//   const showSubmit   = isLastMainQ || isLastReview;

//   // ── Run code ──────────────────────────────────────────────────────────────────
//   const runCode = async (flatIdx, language) => {
//     const code = (answers[flatIdx] || "").toString();
//     if (!code.trim()) return;
//     setCompiling(p => ({ ...p, [flatIdx]: true }));
//     try {
//       const res = await fetch(`${BASE}/exams/compile`, {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ code, language }),
//       });
//       const d = await res.json();
//       setCompRes(p => ({ ...p, [flatIdx]: d.success ? d.data : { stderr: d.message } }));
//     } catch {
//       setCompRes(p => ({ ...p, [flatIdx]: { stderr: "Compiler unavailable." } }));
//     } finally {
//       setCompiling(p => ({ ...p, [flatIdx]: false }));
//     }
//   };

//   // ── Submit ────────────────────────────────────────────────────────────────────
//   const doSubmit = useCallback(async (auto = false) => {
//     if (submitting || submitted) return;
//     if (!auto && !window.confirm("Submit exam? This cannot be undone.")) return;
//     proctor.stop();
//     setSubmitting(true);
//     const mcqList = [], subjList = [], codeList = [];
//     allQ.forEach((e, i) => {
//       const val = (answers[i] || "").toString().trim();
//       if (e.type === "mcq")        mcqList.push({ question_index: e.origIdx, selected_option: val });
//       if (e.type === "subjective") subjList.push({ question_index: e.origIdx, answer: val });
//       if (e.type === "coding")     codeList.push({ question_index: e.origIdx, code: val, run_output: compRes[i]?.stdout || "", run_stderr: compRes[i]?.stderr || "", run_status: compRes[i]?.status || "" });
//     });
//     try {
//       const res = await fetch(`${BASE}/exams/submit/${token}`, {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           mcq: mcqList, subjective: subjList, coding: codeList,
//           proctoring: { events: proctor.events, snapshots: proctor.snaps.map(s => ({ ts: s.ts, label: s.label, dataUrl: s.dataUrl, analysis: s.ai })) },
//         }),
//       });
//       const d = await res.json();
//       if (d.success) { setSubmitted(true); setResult(d.data); }
//       else alert(d.message || "Submission failed.");
//     } catch { alert("Submission failed. Check connection."); }
//     finally { setSubmitting(false); }
//   }, [allQ, answers, compRes, token, submitting, submitted, proctor]);

//   // ── TYPE META ──────────────────────────────────────────────────────────────────
//   const TYPE_META = {
//     mcq:        { label: "MCQ",        color: "#7b1fa2", light: "#f3e5f5" },
//     subjective: { label: "Subjective", color: "#0277bd", light: "#e3f2fd" },
//     coding:     { label: "Coding",     color: "#2e7d32", light: "#e8f5e9" },
//   };

//   // ─── RENDER ────────────────────────────────────────────────────────────────────
//   if (loading) return (
//     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f0f2f5" }}>
//       <div style={{ textAlign: "center" }}>
//         <div style={{ width: 42, height: 42, border: "4px solid #e0e0e0", borderTopColor: "#1a237e", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
//         <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
//         <div style={{ color: "#666", fontSize: 14 }}>Loading exam…</div>
//       </div>
//     </div>
//   );

//   if (error) return (
//     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
//       <div style={{ textAlign: "center" }}>
//         <div style={{ fontSize: 48, marginBottom: 10 }}>⚠️</div>
//         <div style={{ fontSize: 20, fontWeight: 700, color: "#c62828" }}>Exam Unavailable</div>
//         <div style={{ color: "#666", marginTop: 6 }}>{error}</div>
//       </div>
//     </div>
//   );

//   if (submitted && result) return <ResultScreen result={result} exam={exam} events={proctor.events} snaps={proctor.snaps} />;
//   if (!exam || allQ.length === 0) return null;

//   const q    = entry?.q;
//   const type = entry?.type || "mcq";
//   const meta = TYPE_META[type];
//   const flatIdx = currentFlat;
//   const ans  = (answers[flatIdx] || "").toString();
//   const timePct  = timeLeft !== null ? (timeLeft / (exam.time_limit_minutes * 60)) * 100 : 100;
//   const timeWarn = timeLeft !== null && timeLeft < 300;

//   return (
//     <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

//       {/* ── Top navbar ───────────────────────────────────────────────────── */}
//       <div style={{
//         height: 50, background: "#1a237e",
//         display: "flex", alignItems: "center", justifyContent: "space-between",
//         padding: "0 18px", position: "sticky", top: 0, zIndex: 200,
//         boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
//       }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//           <div style={{ width: 26, height: 26, background: "#fff", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <span style={{ fontWeight: 900, fontSize: 13, color: "#1a237e" }}>V</span>
//           </div>
//           <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>VIGNANI<sup style={{ fontSize: 8 }}>PRO</sup></span>
//         </div>

//         <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "3px 12px" }}>
//           <span style={{ fontSize: 12, color: "#e8eaf6", fontWeight: 600 }}>📋 Assessment</span>
//           <span style={{ fontSize: 10, color: "#90caf9" }}>· {exam.job_title}</span>
//         </div>

//         {/* Live counters W M W style from screenshot */}
//         <div style={{ display: "flex", gap: 6 }}>
//           {[
//             { val: answeredN,                          bg: "#43a047", tip: "Answered"    },
//             { val: skippedN,                           bg: "#fb8c00", tip: "Skipped"     },
//             { val: totalQ - answeredN - skippedN,      bg: "#607d8b", tip: "Remaining"   },
//           ].map(({ val, bg, tip }) => (
//             <div key={tip} title={tip} style={{
//               width: 26, height: 26, borderRadius: "50%",
//               background: bg, color: "#fff",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               fontSize: 11, fontWeight: 700,
//             }}>{val}</div>
//           ))}
//         </div>

//         <div style={{
//           background: timeWarn ? "#c62828" : "rgba(255,255,255,0.15)",
//           borderRadius: 7, padding: "4px 12px",
//           display: "flex", alignItems: "center", gap: 5,
//           border: timeWarn ? "1px solid #ef9a9a" : "none",
//         }}>
//           <span style={{ fontSize: 13 }}>⏱</span>
//           <span style={{ fontWeight: 800, fontSize: 16, fontFamily: "monospace", color: "#fff" }}>
//             {fmt(timeLeft ?? 0)}
//           </span>
//         </div>

//         <div style={{ display: "flex", gap: 8 }}>
//           <button style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontSize: 12, cursor: "pointer" }}>
//             🧮 Calculator
//           </button>
//           <button style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#fff", color: "#1a237e", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
//             onClick={() => doSubmit(false)} disabled={submitting}>
//             {submitting ? "…" : "Submit Exam"}
//           </button>
//         </div>
//       </div>

//       {/* Timer bar */}
//       <div style={{ height: 3, background: "#c5cae9" }}>
//         <div style={{ width: `${timePct}%`, height: "100%", background: timeWarn ? "#c62828" : "#1de9b6", transition: "width 1s linear" }} />
//       </div>

//       {/* Skip review banner */}
//       {inReview && (
//         <div style={{
//           background: "#fff3e0", borderBottom: "2px solid #fb8c00",
//           padding: "7px 20px", display: "flex", alignItems: "center", gap: 8, fontSize: 13,
//         }}>
//           <span>🔄</span>
//           <strong style={{ color: "#e65100" }}>Reviewing skipped questions — {reviewPos + 1} of {reviewQueue.length}</strong>
//           <span style={{ color: "#888", fontSize: 12 }}>Answer them or skip again before submitting</span>
//         </div>
//       )}

//       {/* ── Two-column layout ─────────────────────────────────────────────── */}
//       <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 14px", display: "flex", gap: 16, alignItems: "flex-start" }}>

//         {/* ── LEFT — single question ───────────────────────────────────────── */}
//         <div style={{ flex: 1 }}>
//           <div style={{
//             background: "#fff", borderRadius: 10,
//             border: "1px solid #e0e0e0",
//             boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
//             overflow: "hidden",
//           }}>
//             {/* Header */}
//             <div style={{
//               background: meta.light,
//               borderBottom: `2px solid ${meta.color}25`,
//               padding: "10px 18px",
//               display: "flex", alignItems: "center", justifyContent: "space-between",
//             }}>
//               <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
//                 <span style={{ background: meta.color, color: "#fff", borderRadius: 5, padding: "2px 11px", fontWeight: 700, fontSize: 13 }}>
//                   Question {flatIdx + 1} of {totalQ}
//                 </span>
//                 {q?.difficulty && (
//                   <span style={{ ...DIFF[q.difficulty], borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, border: `1px solid ${DIFF[q.difficulty]?.border}` }}>
//                     {q.difficulty}
//                   </span>
//                 )}
//                 {(q?.topic || q?.skill) && (
//                   <span style={{ border: "1px solid #ccc", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: "#555" }}>
//                     {q.topic || q.skill}
//                   </span>
//                 )}
//                 {skippedSet.has(flatIdx) && (
//                   <span style={{ background: "#fff3e0", color: "#e65100", border: "1px solid #ffb74d", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
//                     ↩ Skipped — revisiting
//                   </span>
//                 )}
//               </div>
//               <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: meta.color + "18", color: meta.color }}>
//                 {meta.label}
//               </span>
//             </div>

//             {/* Body */}
//             <div style={{ padding: "20px 22px" }}>
//               <p style={{ fontSize: 14.5, lineHeight: 1.75, fontWeight: 500, color: "#1a1a2e", marginBottom: 22, marginTop: 0, whiteSpace: "pre-wrap" }}>
//                 {q?.question}
//               </p>

//               {/* MCQ options — 2 column like screenshot */}
//               {type === "mcq" && (
//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
//                   {(q?.options || []).map((opt, j) => {
//                     const lbl = String.fromCharCode(97 + j); // a, b, c, d
//                     const sel = ans === opt;
//                     return (
//                       <label key={j} style={{
//                         display: "flex", alignItems: "center", gap: 10,
//                         padding: "10px 14px", borderRadius: 8, cursor: "pointer",
//                         border: `2px solid ${sel ? meta.color : "#e0e0e0"}`,
//                         background: sel ? meta.light : "#fafafa",
//                         transition: "all 0.15s",
//                       }}>
//                         <input type="radio" name={`q${flatIdx}`} value={opt} checked={sel}
//                           onChange={() => setAnswers(p => ({ ...p, [flatIdx]: opt }))}
//                           style={{ display: "none" }} />
//                         <span style={{
//                           width: 24, height: 24, borderRadius: "50%",
//                           background: sel ? meta.color : "#e0e0e0",
//                           color: sel ? "#fff" : "#555",
//                           display: "flex", alignItems: "center", justifyContent: "center",
//                           fontWeight: 700, fontSize: 12, flexShrink: 0,
//                         }}>{lbl}</span>
//                         <span style={{ fontSize: 13, color: "#222" }}>{opt}</span>
//                       </label>
//                     );
//                   })}
//                 </div>
//               )}

//               {/* Subjective */}
//               {type === "subjective" && (
//                 <>
//                   <textarea rows={10} placeholder="Write a detailed answer here…"
//                     value={ans}
//                     onChange={e => setAnswers(p => ({ ...p, [flatIdx]: e.target.value }))}
//                     style={{
//                       width: "100%", borderRadius: 8,
//                       border: `2px solid ${ans.length > 20 ? meta.color + "80" : "#e0e0e0"}`,
//                       padding: "11px 13px", fontSize: 14, lineHeight: 1.7,
//                       resize: "vertical", outline: "none",
//                       fontFamily: "Georgia, serif", boxSizing: "border-box",
//                     }}
//                   />
//                   <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
//                     <span style={{ fontSize: 11, color: ans.length < 20 ? "#e65100" : "#2e7d32" }}>
//                       {ans.length < 20 ? `Min 20 chars (${20 - ans.length} more)` : "✓ Good"}
//                     </span>
//                     <span style={{ fontSize: 11, color: "#aaa" }}>{ans.length} chars</span>
//                   </div>
//                 </>
//               )}

//               {/* Coding */}
//               {type === "coding" && (
//                 <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #3d3d5c" }}>
//                   <div style={{ background: "#1e1e2e", padding: "6px 12px", display: "flex", alignItems: "center", gap: 10 }}>
//                     <div style={{ display: "flex", gap: 4 }}>
//                       {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
//                     </div>
//                     <span style={{ color: "#f9a825", fontSize: 11, fontWeight: 700 }}>🔒 {q?.programming_language} only</span>
//                   </div>
//                   <textarea rows={12} placeholder={`// Write ${q?.programming_language} solution`}
//                     value={ans}
//                     onChange={e => setAnswers(p => ({ ...p, [flatIdx]: e.target.value }))}
//                     style={{
//                       width: "100%", background: "#f9f9f9",
//                       border: "none", borderBottom: "1px solid #ddd",
//                       padding: "11px 14px", fontSize: 13,
//                       fontFamily: "'Fira Code','Consolas',monospace",
//                       lineHeight: 1.8, resize: "vertical", outline: "none", boxSizing: "border-box",
//                     }}
//                   />
//                   <div style={{ background: "#2d2d3f", padding: "6px 12px", display: "flex", gap: 8 }}>
//                     <button onClick={() => runCode(flatIdx, q?.programming_language)}
//                       disabled={compiling[flatIdx] || !ans.trim()}
//                       style={{ padding: "5px 14px", borderRadius: 5, background: "#2e7d32", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: ans.trim() ? 1 : 0.5 }}>
//                       {compiling[flatIdx] ? "⟳ Running…" : "▶ Run"}
//                     </button>
//                   </div>
//                   {compRes[flatIdx] && (() => {
//                     const cr = compRes[flatIdx];
//                     return (
//                       <div style={{ background: "#1e1e2e" }}>
//                         <div style={{ padding: "5px 12px", borderTop: "1px solid #3d3d5c", display: "flex", gap: 7 }}>
//                           <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: cr.status === "Accepted" ? "#1b5e20" : "#b71c1c", color: "#fff" }}>{cr.status}</span>
//                           {cr.time && <span style={{ fontSize: 10, color: "#aaa" }}>{cr.time}s</span>}
//                         </div>
//                         {cr.stdout && <div style={{ padding: "7px 12px" }}><pre style={{ margin: 0, fontSize: 12, color: "#a6e22e", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{cr.stdout}</pre></div>}
//                         {(cr.stderr || cr.compile_output) && <div style={{ padding: "7px 12px" }}><pre style={{ margin: 0, fontSize: 12, color: "#f92672", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{cr.compile_output || cr.stderr}</pre></div>}
//                       </div>
//                     );
//                   })()}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* ── Nav buttons ──────────────────────────────────────────────── */}
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
//             <button onClick={goPrev}
//               disabled={inReview ? reviewPos === 0 : cursor === 0}
//               style={{
//                 padding: "8px 20px", borderRadius: 7, border: "1px solid #ccc",
//                 background: "#fff", color: "#444", fontWeight: 600, fontSize: 13, cursor: "pointer",
//                 opacity: (inReview ? reviewPos === 0 : cursor === 0) ? 0.35 : 1,
//               }}>← Previous</button>

//             <button onClick={doSkip} style={{
//               padding: "8px 20px", borderRadius: 7,
//               border: "2px solid #fb8c00", background: "#fff8e1",
//               color: "#e65100", fontWeight: 700, fontSize: 13, cursor: "pointer",
//             }}>Skip →</button>

//             {showSubmit ? (
//               <button onClick={() => doSubmit(false)} disabled={submitting} style={{
//                 padding: "8px 26px", borderRadius: 7, border: "none",
//                 background: "#2e7d32", color: "#fff",
//                 fontWeight: 700, fontSize: 13, cursor: "pointer",
//               }}>{submitting ? "Submitting…" : "✓ Submit Exam"}</button>
//             ) : (
//               <button onClick={goNext} style={{
//                 padding: "8px 26px", borderRadius: 7, border: "none",
//                 background: meta.color, color: "#fff",
//                 fontWeight: 700, fontSize: 13, cursor: "pointer",
//               }}>Save & Next →</button>
//             )}
//           </div>
//         </div>

//         {/* ── RIGHT — palette + video ───────────────────────────────────── */}
//         <RightSidebar
//           total={totalQ}
//           currentFlat={currentFlat}
//           statusMap={statusMap}
//           onJump={jumpTo}
//           videoRef={proctor.videoRef}
//           camReady={proctor.ready}
//           camError={proctor.error}
//           events={proctor.events}
//         />
//       </div>
//     </div>
//   );
// }













// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { useParams } from "react-router-dom";

// const BASE = process.env.REACT_APP_API_BASE_URL || "";

// const pad = (n) => String(n).padStart(2, "0");
// const fmt = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

// const DIFF = {
//   Easy:   { bg: "#e8f5e9", color: "#256029", border: "#81c784" },
//   Medium: { bg: "#fff3e0", color: "#bf360c", border: "#ffb74d" },
//   Hard:   { bg: "#fce4ec", color: "#880e4f", border: "#f48fb1" },
// };

// const STATUS_STYLE = {
//   current:       { bg: "#1565c0", color: "#fff", border: "#1565c0" },
//   answered:      { bg: "#43a047", color: "#fff", border: "#43a047" },
//   skipped:       { bg: "#fb8c00", color: "#fff", border: "#fb8c00" },
//   not_attempted: { bg: "#e0e0e0", color: "#757575", border: "#bdbdbd" },
// };

// // ══════════════════════════════════════════════════════════════════════════════
// //  PROCTORING HOOK
// // ══════════════════════════════════════════════════════════════════════════════
// function useProctoring(examToken) {
//   const videoRef  = useRef(null);
//   const streamRef = useRef(null);
//   const timerRef  = useRef(null);
//   const snapId    = useRef(0);

//   const [ready,  setReady]  = useState(false);
//   const [error,  setError]  = useState(null);
//   const [events, setEvents] = useState([]);
//   const [snaps,  setSnaps]  = useState([]);
//   const [faceAlert, setFaceAlert] = useState(null); // live alert overlay

//   const capture = useCallback(async (label = "periodic") => {
//     if (!videoRef.current || !ready) return null;
//     const cv = document.createElement("canvas");
//     cv.width = 320; cv.height = 240;
//     cv.getContext("2d").drawImage(videoRef.current, 0, 0, 320, 240);
//     const dataUrl = cv.toDataURL("image/jpeg", 0.6);
//     const ts = new Date().toISOString();
//     snapId.current += 1;
//     const id = snapId.current;

//     try {
//       const b64 = dataUrl.split(",")[1];
//       const res = await fetch("https://api.anthropic.com/v1/messages", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           model: "claude-sonnet-4-20250514",
//           max_tokens: 300,
//           messages: [{
//             role: "user",
//             content: [
//               { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
//               {
//                 type: "text",
//                 text: `You are an AI exam proctor. Analyze this webcam frame carefully.
// Return ONLY valid JSON, no markdown:
// {
//   "face_detected": bool,
//   "face_count": int,
//   "looking_away": bool,
//   "phone_detected": bool,
//   "multiple_people": bool,
//   "flag": "ok" | "warning" | "alert",
//   "reason": "short reason if flag != ok, else empty string"
// }

// Rules:
// - flag="alert" if: no face, multiple people, phone visible, person clearly looking away for extended time
// - flag="warning" if: face partially visible, slight head turn
// - flag="ok" if: single face looking at screen normally`
//               }
//             ]
//           }],
//         }),
//       });
//       const d = await res.json();
//       const raw = (d?.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
//       let ai = {};
//       try { ai = JSON.parse(raw); } catch { ai = { flag: "ok" }; }

//       const snap = { id, ts, dataUrl, label, ai };
//       setSnaps(p => [...p.slice(-79), snap]);

//       if (ai.flag !== "ok") {
//         const evt = {
//           id: Date.now(), ts,
//           type: ai.flag,
//           msg: ai.reason || (ai.flag === "alert" ? "Suspicious activity detected" : "Attention warning"),
//           snapshot: dataUrl,
//         };
//         setEvents(p => [...p.slice(-199), evt]);
//         setFaceAlert(evt);
//         setTimeout(() => setFaceAlert(null), 4000);

//         fetch(`${BASE}/exams/proctor/${examToken}/event`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(evt),
//         }).catch(() => {});
//       }
//       return snap;
//     } catch (_) { return null; }
//   }, [ready, examToken]);

//   // Capture one frame for camera-gate verification
//   const captureOnce = useCallback(async () => {
//     if (!videoRef.current) return null;
//     const cv = document.createElement("canvas");
//     cv.width = 320; cv.height = 240;
//     cv.getContext("2d").drawImage(videoRef.current, 0, 0, 320, 240);
//     return cv.toDataURL("image/jpeg", 0.6);
//   }, []);

//   const start = useCallback(async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480, facingMode: "user" },
//         audio: false,
//       });
//       streamRef.current = stream;
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         await videoRef.current.play().catch(() => {});
//       }
//       setReady(true);
//       return true;
//     } catch (e) {
//       setError("Camera access denied or unavailable.");
//       return false;
//     }
//   }, []);

//   useEffect(() => {
//     if (!ready) return;
//     const t = setTimeout(() => capture("initial"), 3000);
//     timerRef.current = setInterval(() => capture("periodic"), 25000);
//     return () => { clearTimeout(t); clearInterval(timerRef.current); };
//   }, [ready, capture]);

//   // Tab-switch detection
//   useEffect(() => {
//     const fn = () => {
//       if (document.hidden) {
//         const evt = {
//           id: Date.now(), ts: new Date().toISOString(),
//           type: "alert", msg: "Tab switch / window blur detected", snapshot: null,
//         };
//         setEvents(p => [...p, evt]);
//         setFaceAlert(evt);
//         setTimeout(() => setFaceAlert(null), 4000);
//         fetch(`${BASE}/exams/proctor/${examToken}/event`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(evt),
//         }).catch(() => {});
//       }
//     };
//     document.addEventListener("visibilitychange", fn);
//     return () => document.removeEventListener("visibilitychange", fn);
//   }, [examToken]);

//   const stop = useCallback(() => {
//     clearInterval(timerRef.current);
//     streamRef.current?.getTracks().forEach(t => t.stop());
//     setReady(false);
//   }, []);

//   return { videoRef, ready, error, events, snaps, faceAlert, start, stop, capture, captureOnce };
// }

// // ══════════════════════════════════════════════════════════════════════════════
// //  CAMERA GATE — must allow camera before exam starts
// // ══════════════════════════════════════════════════════════════════════════════
// function CameraGate({ exam, onGranted }) {
//   const [step, setStep]     = useState("intro");   // intro | requesting | verifying | error
//   const [errMsg, setErrMsg] = useState("");
//   const [preview, setPreview] = useState(null);
//   const videoRef = useRef(null);
//   const streamRef = useRef(null);

//   const requestCamera = async () => {
//     setStep("requesting");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480, facingMode: "user" },
//         audio: false,
//       });
//       streamRef.current = stream;
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         await videoRef.current.play();
//       }
//       setStep("verifying");
//       // Wait 2s for video to stabilise then capture
//       setTimeout(() => captureAndVerify(stream), 2000);
//     } catch (e) {
//       setErrMsg("Camera access was denied. Please allow camera access in your browser settings and reload.");
//       setStep("error");
//     }
//   };

//   const captureAndVerify = async (stream) => {
//     const cv = document.createElement("canvas");
//     cv.width = 320; cv.height = 240;
//     if (videoRef.current) {
//       cv.getContext("2d").drawImage(videoRef.current, 0, 0, 320, 240);
//     }
//     const dataUrl = cv.toDataURL("image/jpeg", 0.7);
//     setPreview(dataUrl);

//     try {
//       const b64 = dataUrl.split(",")[1];
//       const res = await fetch("https://api.anthropic.com/v1/messages", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           model: "claude-sonnet-4-20250514",
//           max_tokens: 200,
//           messages: [{
//             role: "user",
//             content: [
//               { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
//               {
//                 type: "text",
//                 text: `Camera verification for an online exam. Return ONLY JSON:
// {"face_visible": bool, "single_person": bool, "good_lighting": bool, "approved": bool, "reason": ""}
// approved=true only if exactly one face is clearly visible with decent lighting.`
//               }
//             ]
//           }],
//         }),
//       });
//       const d = await res.json();
//       const raw = (d?.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
//       let ai = {};
//       try { ai = JSON.parse(raw); } catch { ai = { approved: false, reason: "Verification failed" }; }

//       if (ai.approved) {
//         // Pass stream to parent so it reuses it
//         onGranted(stream, videoRef, dataUrl);
//       } else {
//         setErrMsg(ai.reason || "Could not verify your face. Ensure good lighting and your face is clearly visible.");
//         setStep("error");
//         stream.getTracks().forEach(t => t.stop());
//       }
//     } catch {
//       // On AI failure, still allow (don't block exam for API errors)
//       onGranted(stream, videoRef, dataUrl);
//     }
//   };

//   const retry = () => {
//     if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
//     setStep("intro");
//     setPreview(null);
//     setErrMsg("");
//   };

//   return (
//     <div style={{
//       minHeight: "100vh",
//       background: "linear-gradient(135deg, #0d1117 0%, #1a1f2e 50%, #0d1117 100%)",
//       display: "flex", alignItems: "center", justifyContent: "center",
//       fontFamily: "'Segoe UI', system-ui, sans-serif",
//       padding: 20,
//     }}>
//       <div style={{
//         width: "100%", maxWidth: 540,
//         background: "rgba(255,255,255,0.04)",
//         border: "1px solid rgba(255,255,255,0.1)",
//         borderRadius: 20,
//         backdropFilter: "blur(20px)",
//         overflow: "hidden",
//       }}>
//         {/* Header */}
//         <div style={{
//           background: "linear-gradient(135deg, #1a237e, #0277bd)",
//           padding: "28px 32px",
//           textAlign: "center",
//         }}>
//           <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
//           <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>Camera Verification Required</div>
//           <div style={{ color: "#90caf9", fontSize: 13, marginTop: 6 }}>
//             {exam?.job_title} · {exam?.candidate_name}
//           </div>
//         </div>

//         <div style={{ padding: "28px 32px" }}>
//           {step === "intro" && (
//             <>
//               <div style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
//                 This exam uses <strong style={{ color: "#90caf9" }}>AI-powered proctoring</strong>. Before you begin:
//               </div>
//               <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
//                 {[
//                   ["👤", "Your face must be visible throughout the exam"],
//                   ["💡", "Ensure your room is well-lit"],
//                   ["📱", "No phones or secondary devices allowed"],
//                   ["👁️", "Do not look away from the screen for extended periods"],
//                   ["🔒", "Webcam snapshots are captured periodically for review"],
//                 ].map(([icon, text]) => (
//                   <div key={text} style={{
//                     display: "flex", alignItems: "flex-start", gap: 12,
//                     padding: "10px 14px", borderRadius: 10,
//                     background: "rgba(255,255,255,0.05)",
//                     border: "1px solid rgba(255,255,255,0.08)",
//                   }}>
//                     <span style={{ fontSize: 18 }}>{icon}</span>
//                     <span style={{ color: "#ccc", fontSize: 13 }}>{text}</span>
//                   </div>
//                 ))}
//               </div>
//               <button onClick={requestCamera} style={{
//                 width: "100%", padding: "14px",
//                 borderRadius: 10, border: "none",
//                 background: "linear-gradient(135deg, #1565c0, #0277bd)",
//                 color: "#fff", fontWeight: 700, fontSize: 15,
//                 cursor: "pointer", letterSpacing: 0.5,
//                 boxShadow: "0 4px 20px rgba(21,101,192,0.4)",
//               }}>
//                 Allow Camera & Start Verification
//               </button>
//             </>
//           )}

//           {step === "requesting" && (
//             <div style={{ textAlign: "center", padding: "40px 0" }}>
//               <div style={{
//                 width: 56, height: 56,
//                 border: "4px solid rgba(144,202,249,0.2)",
//                 borderTopColor: "#90caf9",
//                 borderRadius: "50%",
//                 animation: "spin .8s linear infinite",
//                 margin: "0 auto 20px",
//               }} />
//               <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
//               <div style={{ color: "#90caf9", fontSize: 16, fontWeight: 600 }}>
//                 Requesting camera access…
//               </div>
//               <div style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
//                 Please click "Allow" in your browser prompt
//               </div>
//             </div>
//           )}

//           {step === "verifying" && (
//             <div style={{ textAlign: "center" }}>
//               <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", marginBottom: 16, border: "2px solid #1565c0" }}>
//                 <video ref={videoRef} autoPlay muted playsInline
//                   style={{ width: "100%", display: "block", aspectRatio: "4/3", objectFit: "cover" }}
//                 />
//                 <div style={{
//                   position: "absolute", inset: 0,
//                   border: "3px solid #43a047",
//                   borderRadius: 10,
//                   animation: "pulse 1.5s ease-in-out infinite",
//                   pointerEvents: "none",
//                 }} />
//                 <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
//               </div>
//               <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#90caf9" }}>
//                 <div style={{
//                   width: 12, height: 12, borderRadius: "50%",
//                   background: "#43a047",
//                   animation: "blink 1s ease-in-out infinite",
//                 }} />
//                 <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
//                 <span style={{ fontSize: 14, fontWeight: 600 }}>Verifying your face via AI…</span>
//               </div>
//             </div>
//           )}

//           {step === "error" && (
//             <div style={{ textAlign: "center" }}>
//               {preview && (
//                 <img src={preview} alt="capture" style={{
//                   width: "100%", borderRadius: 12, marginBottom: 16,
//                   border: "2px solid #c62828", opacity: 0.8,
//                 }} />
//               )}
//               <div style={{
//                 background: "rgba(198,40,40,0.1)",
//                 border: "1px solid rgba(198,40,40,0.3)",
//                 borderRadius: 10, padding: "14px 16px",
//                 marginBottom: 20,
//               }}>
//                 <div style={{ fontSize: 24, marginBottom: 6 }}>❌</div>
//                 <div style={{ color: "#ef9a9a", fontSize: 14 }}>{errMsg}</div>
//               </div>
//               <button onClick={retry} style={{
//                 width: "100%", padding: 12, borderRadius: 10, border: "none",
//                 background: "#1565c0", color: "#fff", fontWeight: 700,
//                 fontSize: 14, cursor: "pointer",
//               }}>
//                 Try Again
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════════════════════════════════════════
// //  FACE ALERT OVERLAY
// // ══════════════════════════════════════════════════════════════════════════════
// function FaceAlertOverlay({ alert }) {
//   if (!alert) return null;
//   const isAlert = alert.type === "alert";
//   return (
//     <div style={{
//       position: "fixed", top: 70, right: 20, zIndex: 9999,
//       background: isAlert ? "#b71c1c" : "#e65100",
//       color: "#fff", borderRadius: 12,
//       padding: "12px 18px",
//       display: "flex", alignItems: "center", gap: 10,
//       boxShadow: `0 4px 20px ${isAlert ? "rgba(183,28,28,0.5)" : "rgba(230,81,0,0.5)"}`,
//       animation: "slideIn 0.3s ease",
//       maxWidth: 320,
//     }}>
//       <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
//       <span style={{ fontSize: 22 }}>{isAlert ? "🚨" : "⚠️"}</span>
//       <div>
//         <div style={{ fontWeight: 700, fontSize: 13 }}>{isAlert ? "ALERT" : "WARNING"}</div>
//         <div style={{ fontSize: 12, opacity: 0.9 }}>{alert.msg}</div>
//       </div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════════════════════════════════════════
// //  RIGHT SIDEBAR
// // ══════════════════════════════════════════════════════════════════════════════
// function RightSidebar({ total, currentFlat, statusMap, onJump, videoRef, camReady, camError, events }) {
//   const alertCount = events.filter(e => e.type === "alert").length;
//   const warnCount  = events.filter(e => e.type === "warning").length;

//   return (
//     <div style={{
//       width: 218, flexShrink: 0,
//       display: "flex", flexDirection: "column",
//       position: "sticky", top: 60, alignSelf: "flex-start",
//     }}>
//       {/* Palette */}
//       <div style={{
//         background: "#fff",
//         border: "1px solid #e0e0e0",
//         borderRadius: "10px 10px 0 0",
//         overflow: "hidden",
//       }}>
//         <div style={{
//           background: "#1a237e", color: "#fff",
//           padding: "9px 14px",
//           display: "flex", alignItems: "center", justifyContent: "space-between",
//         }}>
//           <span style={{ fontSize: 13, fontWeight: 700 }}>Questions: {total}</span>
//           <span style={{ fontSize: 10, color: "#90caf9" }}>
//             {Object.values(statusMap).filter(v => v === "answered").length} done
//           </span>
//         </div>
//         <div style={{
//           padding: "10px 8px",
//           display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5,
//           maxHeight: 220, overflowY: "auto",
//         }}>
//           {Array.from({ length: total }, (_, i) => {
//             const st = i === currentFlat ? "current" : statusMap[i] || "not_attempted";
//             const s  = STATUS_STYLE[st];
//             return (
//               <button key={i} onClick={() => onJump(i)} title={`Q${i+1}`}
//                 style={{
//                   width: "100%", aspectRatio: "1", borderRadius: "50%",
//                   background: s.bg, color: s.color,
//                   border: `2px solid ${s.border}`,
//                   fontWeight: 700, fontSize: 11, cursor: "pointer",
//                   display: "flex", alignItems: "center", justifyContent: "center",
//                   transition: "transform 0.1s", boxSizing: "border-box", padding: 0,
//                 }}
//                 onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.18)"; }}
//                 onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
//               >{i + 1}</button>
//             );
//           })}
//         </div>
//         <div style={{
//           padding: "8px 10px", borderTop: "1px solid #f0f0f0",
//           display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 6px",
//         }}>
//           {[
//             ["current", "Current"],
//             ["answered", "Answered"],
//             ["skipped", "Skipped"],
//             ["not_attempted", "Not Attempted"],
//           ].map(([key, lbl]) => (
//             <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
//               <div style={{
//                 width: 11, height: 11, borderRadius: "50%",
//                 background: STATUS_STYLE[key].bg,
//                 border: `1.5px solid ${STATUS_STYLE[key].border}`,
//                 flexShrink: 0,
//               }} />
//               <span style={{ fontSize: 9, color: "#555" }}>{lbl}</span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Live cam */}
//       <div style={{
//         background: "#0d0d1a",
//         border: "1px solid #333",
//         borderTop: "2px solid #1565c0",
//         borderRadius: "0 0 10px 10px",
//         overflow: "hidden",
//         position: "relative",
//       }}>
//         <video ref={videoRef} autoPlay muted playsInline
//           style={{ width: "100%", display: "block", aspectRatio: "4/3", objectFit: "cover" }}
//         />
//         {/* Scanning line animation when ready */}
//         {camReady && (
//           <div style={{
//             position: "absolute", left: 0, right: 0, height: 2,
//             background: "linear-gradient(90deg, transparent, #00e5ff, transparent)",
//             animation: "scan 3s linear infinite",
//             pointerEvents: "none",
//           }} />
//         )}
//         <style>{`@keyframes scan{0%{top:0%}100%{top:100%}}`}</style>

//         <div style={{
//           position: "absolute", bottom: 0, left: 0, right: 0,
//           background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
//           padding: "16px 10px 8px",
//           display: "flex", alignItems: "center", justifyContent: "space-between",
//         }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
//             <div style={{
//               width: 7, height: 7, borderRadius: "50%",
//               background: camReady ? "#43a047" : "#f44336",
//               boxShadow: camReady ? "0 0 6px #43a047" : "none",
//               animation: camReady ? "blink2 2s ease-in-out infinite" : "none",
//             }} />
//             <style>{`@keyframes blink2{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
//             <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>
//               {camReady ? "MONITORED" : camError ? "NO CAM" : "Starting…"}
//             </span>
//           </div>
//           <div style={{ display: "flex", gap: 4 }}>
//             {alertCount > 0 && (
//               <div style={{ background: "#c62828", borderRadius: 8, padding: "1px 6px", fontSize: 9, color: "#fff", fontWeight: 700 }}>
//                 {alertCount}🚨
//               </div>
//             )}
//             {warnCount > 0 && (
//               <div style={{ background: "#e65100", borderRadius: 8, padding: "1px 6px", fontSize: 9, color: "#fff", fontWeight: 700 }}>
//                 {warnCount}⚠️
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
//     </div>
//   );
// }

// // ══════════════════════════════════════════════════════════════════════════════
// //  RESULT SCREEN
// // ══════════════════════════════════════════════════════════════════════════════
// function ResultScreen({ result, exam, events, snaps }) {
//   const [tab, setTab] = useState("scores");
//   const flagged = snaps.filter(s => s.ai?.flag !== "ok");
//   const alertCount   = events.filter(e => e.type === "alert").length;
//   const warnCount    = events.filter(e => e.type === "warning").length;
//   const integrityScore = Math.max(0, 100 - alertCount * 15 - warnCount * 5);

//   return (
//     <div style={{ minHeight: "100vh", background: "#f0f4f8", padding: "32px 16px" }}>
//       <div style={{ maxWidth: 720, margin: "0 auto" }}>
//         <div style={{ textAlign: "center", marginBottom: 28 }}>
//           <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
//           <div style={{ fontSize: 26, fontWeight: 800, color: "#1b5e20" }}>Exam Submitted!</div>
//           <div style={{ color: "#666", marginTop: 6, fontSize: 14 }}>
//             Thank you <strong>{exam?.candidate_name}</strong> — your responses have been graded.
//           </div>
//         </div>

//         {/* Tabs */}
//         <div style={{
//           display: "flex", background: "#fff", borderRadius: 12,
//           border: "1px solid #e0e0e0", padding: 4, marginBottom: 16, gap: 4,
//         }}>
//           {[
//             ["scores", "📊 Scores"],
//             ["proctoring", `🎥 Monitoring${events.length > 0 ? ` (${events.length})` : ""}`],
//             ["snapshots", `📸 Snapshots${flagged.length > 0 ? ` (${flagged.length}⚠)` : ""}`],
//             ["feedback", "💬 Feedback"],
//           ].map(([k, l]) => (
//             <button key={k} onClick={() => setTab(k)} style={{
//               flex: 1, padding: "8px 4px", borderRadius: 8, border: "none",
//               cursor: "pointer", fontWeight: 600, fontSize: 12,
//               background: tab === k ? "#1a237e" : "transparent",
//               color: tab === k ? "#fff" : "#666",
//               transition: "all 0.2s",
//             }}>{l}</button>
//           ))}
//         </div>

//         {tab === "scores" && (
//           <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//             <div style={{
//               background: "#fff", borderRadius: 16, padding: 28,
//               textAlign: "center", border: "1px solid #e0e0e0",
//               boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
//             }}>
//               <div style={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 1.5 }}>Overall Score</div>
//               <div style={{
//                 fontSize: 72, fontWeight: 900, lineHeight: 1.1,
//                 color: result.overall_score >= 70 ? "#2e7d32" : result.overall_score >= 50 ? "#e65100" : "#c62828",
//               }}>{result.overall_score}%</div>
//               <div style={{ height: 10, background: "#eee", borderRadius: 5, marginTop: 12, overflow: "hidden" }}>
//                 <div style={{
//                   width: `${result.overall_score}%`, height: "100%", borderRadius: 5,
//                   background: result.overall_score >= 70 ? "#2e7d32" : result.overall_score >= 50 ? "#e65100" : "#c62828",
//                   transition: "width 1.5s cubic-bezier(0.4,0,0.2,1)",
//                 }} />
//               </div>
//             </div>
//             <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
//               {result.mcq_total > 0 && (
//                 <div style={{ flex: 1, minWidth: 130, background: "#f3e5f5", borderRadius: 12, padding: 16, textAlign: "center", border: "1px solid #ce93d8" }}>
//                   <div style={{ fontSize: 10, fontWeight: 700, color: "#7b1fa2", textTransform: "uppercase", letterSpacing: 1 }}>MCQ</div>
//                   <div style={{ fontSize: 34, fontWeight: 900, color: "#7b1fa2" }}>{result.mcq_score}%</div>
//                   <div style={{ fontSize: 11, color: "#888" }}>{result.mcq_correct}/{result.mcq_total} correct</div>
//                 </div>
//               )}
//               {result.subj_count > 0 && (
//                 <div style={{ flex: 1, minWidth: 130, background: "#e3f2fd", borderRadius: 12, padding: 16, textAlign: "center", border: "1px solid #90caf9" }}>
//                   <div style={{ fontSize: 10, fontWeight: 700, color: "#0277bd", textTransform: "uppercase", letterSpacing: 1 }}>Written</div>
//                   <div style={{ fontSize: 34, fontWeight: 900, color: "#0277bd" }}>{result.subj_score}%</div>
//                   <div style={{ fontSize: 11, color: "#888" }}>{result.subj_count} questions</div>
//                 </div>
//               )}
//               {result.code_count > 0 && (
//                 <div style={{ flex: 1, minWidth: 130, background: "#e8f5e9", borderRadius: 12, padding: 16, textAlign: "center", border: "1px solid #a5d6a7" }}>
//                   <div style={{ fontSize: 10, fontWeight: 700, color: "#2e7d32", textTransform: "uppercase", letterSpacing: 1 }}>Coding</div>
//                   <div style={{ fontSize: 34, fontWeight: 900, color: "#2e7d32" }}>{result.code_score}%</div>
//                   <div style={{ fontSize: 11, color: "#888" }}>{result.code_count} questions</div>
//                 </div>
//               )}
//               <div style={{ flex: 1, minWidth: 130, background: integrityScore >= 80 ? "#e8f5e9" : integrityScore >= 60 ? "#fff3e0" : "#fce4ec", borderRadius: 12, padding: 16, textAlign: "center", border: `1px solid ${integrityScore >= 80 ? "#a5d6a7" : integrityScore >= 60 ? "#ffcc02" : "#f48fb1"}` }}>
//                 <div style={{ fontSize: 10, fontWeight: 700, color: integrityScore >= 80 ? "#2e7d32" : integrityScore >= 60 ? "#e65100" : "#c62828", textTransform: "uppercase", letterSpacing: 1 }}>Integrity</div>
//                 <div style={{ fontSize: 34, fontWeight: 900, color: integrityScore >= 80 ? "#2e7d32" : integrityScore >= 60 ? "#e65100" : "#c62828" }}>{integrityScore}%</div>
//                 <div style={{ fontSize: 11, color: "#888" }}>{alertCount} alerts</div>
//               </div>
//             </div>
//           </div>
//         )}

//         {tab === "proctoring" && (
//           <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e0e0e0" }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
//               <div style={{ fontWeight: 700, fontSize: 15 }}>Proctoring Events ({events.length})</div>
//               <div style={{
//                 padding: "4px 12px", borderRadius: 20,
//                 background: integrityScore >= 80 ? "#e8f5e9" : "#fce4ec",
//                 color: integrityScore >= 80 ? "#2e7d32" : "#c62828",
//                 fontSize: 12, fontWeight: 700,
//               }}>
//                 Integrity: {integrityScore}%
//               </div>
//             </div>
//             {events.length === 0
//               ? <div style={{ color: "#2e7d32", textAlign: "center", padding: 36, fontSize: 15 }}>✅ No issues detected</div>
//               : events.map(e => (
//                 <div key={e.id} style={{
//                   padding: "10px 14px", borderRadius: 10, marginBottom: 8,
//                   background: e.type === "alert" ? "#fce4ec" : "#fff8e1",
//                   border: `1px solid ${e.type === "alert" ? "#f48fb1" : "#ffe082"}`,
//                   display: "flex", gap: 10, alignItems: "flex-start",
//                 }}>
//                   <span style={{ fontSize: 20 }}>{e.type === "alert" ? "🚨" : "⚠️"}</span>
//                   <div style={{ flex: 1 }}>
//                     <div style={{ fontSize: 13, fontWeight: 700, color: e.type === "alert" ? "#c62828" : "#e65100" }}>{e.msg}</div>
//                     <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{new Date(e.ts).toLocaleTimeString()}</div>
//                   </div>
//                   {e.snapshot && (
//                     <img src={e.snapshot} alt="" style={{ width: 60, height: 45, objectFit: "cover", borderRadius: 6, border: "1px solid #ddd" }} />
//                   )}
//                 </div>
//               ))
//             }
//           </div>
//         )}

//         {tab === "snapshots" && (
//           <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e0e0e0" }}>
//             <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
//               Captured Frames ({snaps.length})
//               {flagged.length > 0 && <span style={{ color: "#c62828", marginLeft: 10, fontSize: 13 }}>— {flagged.length} flagged</span>}
//             </div>
//             {snaps.length === 0
//               ? <div style={{ color: "#999", textAlign: "center", padding: 36 }}>No snapshots captured</div>
//               : <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
//                   {[...snaps].reverse().map(s => (
//                     <div key={s.id} style={{ position: "relative" }}>
//                       <img src={s.dataUrl} alt="" style={{
//                         width: "100%", borderRadius: 8,
//                         border: s.ai?.flag === "alert" ? "2px solid #f44336"
//                               : s.ai?.flag === "warning" ? "2px solid #fb8c00"
//                               : "1px solid #e0e0e0",
//                       }} />
//                       {s.ai?.flag !== "ok" && (
//                         <div style={{
//                           position: "absolute", top: 4, right: 4,
//                           background: s.ai?.flag === "alert" ? "#f44336" : "#fb8c00",
//                           borderRadius: 4, padding: "1px 5px", fontSize: 9, color: "#fff", fontWeight: 700,
//                         }}>{s.ai?.flag?.toUpperCase()}</div>
//                       )}
//                       <div style={{ fontSize: 9, color: "#999", marginTop: 3, textAlign: "center" }}>
//                         {new Date(s.ts).toLocaleTimeString()}
//                       </div>
//                       {s.ai?.reason && (
//                         <div style={{ fontSize: 9, color: "#c62828", textAlign: "center", marginTop: 1 }}>
//                           {s.ai.reason.slice(0, 30)}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//             }
//           </div>
//         )}

//         {tab === "feedback" && (
//           <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//             {result.subj_feedback?.map((f, i) => (
//               <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e0e0e0" }}>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//                   <div style={{ fontWeight: 700, fontSize: 13, color: "#0277bd" }}>Written Q{i + 1}</div>
//                   <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//                     <span style={{
//                       padding: "2px 10px", borderRadius: 20,
//                       background: f.verdict === "Excellent" ? "#e8f5e9" : f.verdict === "Good" ? "#e3f2fd" : "#fff3e0",
//                       color: f.verdict === "Excellent" ? "#2e7d32" : f.verdict === "Good" ? "#0277bd" : "#e65100",
//                       fontSize: 11, fontWeight: 700,
//                     }}>{f.verdict}</span>
//                     <span style={{ fontWeight: 800, fontSize: 15, color: "#333" }}>{f.score}/{f.max}</span>
//                   </div>
//                 </div>
//                 <div style={{ fontSize: 13, color: "#555", marginBottom: 10, fontStyle: "italic" }}>{f.q}</div>
//                 <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{f.feedback}</div>
//                 {f.covered?.length > 0 && (
//                   <div style={{ marginTop: 10 }}>
//                     <div style={{ fontSize: 11, fontWeight: 700, color: "#2e7d32", marginBottom: 4 }}>✅ Covered:</div>
//                     {f.covered.map((p, j) => <div key={j} style={{ fontSize: 12, color: "#2e7d32", marginLeft: 10 }}>• {p}</div>)}
//                   </div>
//                 )}
//                 {f.missed?.length > 0 && (
//                   <div style={{ marginTop: 8 }}>
//                     <div style={{ fontSize: 11, fontWeight: 700, color: "#c62828", marginBottom: 4 }}>❌ Missed:</div>
//                     {f.missed.map((p, j) => <div key={j} style={{ fontSize: 12, color: "#c62828", marginLeft: 10 }}>• {p}</div>)}
//                   </div>
//                 )}
//               </div>
//             ))}
//             {result.code_feedback?.map((f, i) => (
//               <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e0e0e0" }}>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//                   <div style={{ fontWeight: 700, fontSize: 13, color: "#2e7d32" }}>Coding Q{i + 1}</div>
//                   <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//                     <span style={{ padding: "2px 10px", borderRadius: 20, background: "#e8f5e9", color: "#2e7d32", fontSize: 11, fontWeight: 700 }}>{f.quality}</span>
//                     <span style={{ fontWeight: 800, fontSize: 15, color: "#333" }}>{f.score}/{f.max}</span>
//                   </div>
//                 </div>
//                 <div style={{ fontSize: 13, color: "#555", marginBottom: 10, fontStyle: "italic" }}>{f.q}</div>
//                 <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{f.feedback}</div>
//                 {!f.lang_ok && (
//                   <div style={{ marginTop: 8, padding: "6px 12px", background: "#fce4ec", borderRadius: 8, fontSize: 12, color: "#c62828", fontWeight: 600 }}>
//                     ⚠️ Wrong language used
//                   </div>
//                 )}
//               </div>
//             ))}
//             {(!result.subj_feedback?.length && !result.code_feedback?.length) && (
//               <div style={{ background: "#fff", borderRadius: 14, padding: 28, textAlign: "center", color: "#999" }}>
//                 No AI feedback available for this exam.
//               </div>
//             )}
//           </div>
//         )}

//         <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 20 }}>
//           Recruiter notified. You may now close this tab.
//         </div>
//       </div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════════════════════════════════════════
// //  MAIN EXAM PAGE
// // ══════════════════════════════════════════════════════════════════════════════
// export default function ExamPage() {
//   const { token } = useParams();

//   const [loading,    setLoading]    = useState(true);
//   const [exam,       setExam]       = useState(null);
//   const [error,      setError]      = useState("");
//   const [submitted,  setSubmitted]  = useState(false);
//   const [result,     setResult]     = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [timeLeft,   setTimeLeft]   = useState(null);

//   // Camera gate state
//   const [cameraGranted, setCameraGranted] = useState(false);
//   const [passedStream,  setPassedStream]  = useState(null);

//   // Flat question list
//   const [allQ, setAllQ] = useState([]);

//   // Navigation
//   const [cursor,      setCursor]      = useState(0);
//   const [skippedSet,  setSkippedSet]  = useState(new Set());
//   const [inReview,    setInReview]    = useState(false);
//   const [reviewQueue, setReviewQueue] = useState([]);
//   const [reviewPos,   setReviewPos]   = useState(0);

//   // Answers
//   const [answers,   setAnswers]   = useState({});
//   const [compRes,   setCompRes]   = useState({});
//   const [compiling, setCompiling] = useState({});

//   const proctor = useProctoring(token);

//   // ── Load exam ─────────────────────────────────────────────────────────────
//   useEffect(() => {
//     fetch(`${BASE}/exams/take/${token}`)
//       .then(r => r.json())
//       .then(res => {
//         if (!res.success) { setError(res.message || "Could not load exam"); return; }
//         const d = res.data;
//         setExam(d);
//         setTimeLeft(d.time_limit_minutes * 60);
//         const flat = [];
//         (d.mcq_questions        || []).forEach((q, i) => flat.push({ type: "mcq",        origIdx: i, q }));
//         (d.subjective_questions || []).forEach((q, i) => flat.push({ type: "subjective",  origIdx: i, q }));
//         (d.coding_questions     || []).forEach((q, i) => flat.push({ type: "coding",      origIdx: i, q }));
//         setAllQ(flat);
//       })
//       .catch(() => setError("Failed to load exam."))
//       .finally(() => setLoading(false));
//   }, [token]);

//   // ── Camera granted callback ───────────────────────────────────────────────
//   const handleCameraGranted = useCallback(async (stream, gateVideoRef, gateSnapshot) => {
//     setPassedStream(stream);
//     // Hand stream to proctoring hook
//     if (proctor.videoRef.current) {
//       proctor.videoRef.current.srcObject = stream;
//       await proctor.videoRef.current.play().catch(() => {});
//     }
//     // Mark ready manually
//     // We call start() but pass the stream in (start will create new stream unless we hack it)
//     // Simpler: set videoRef directly and mark ready by calling start which re-requests
//     // Actually: we'll re-use the stream by assigning srcObject then starting interval
//     setCameraGranted(true);
//     // Mark proctor as ready by calling start (it will get a new stream but that's fine)
//     proctor.start();
//   }, [proctor]);

//   // ── Timer ─────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!cameraGranted) return;
//     if (timeLeft === null || submitted) return;
//     if (timeLeft <= 0) { doSubmit(true); return; }
//     const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
//     return () => clearTimeout(t);
//   }, [timeLeft, submitted, cameraGranted]);

//   // ── Derived ───────────────────────────────────────────────────────────────
//   const currentFlat = inReview ? reviewQueue[reviewPos] : cursor;
//   const entry   = allQ[currentFlat] || null;
//   const totalQ  = allQ.length;

//   const statusMap = {};
//   allQ.forEach((_, i) => {
//     const ans = (answers[i] || "").toString().trim();
//     if (ans)                    statusMap[i] = "answered";
//     else if (skippedSet.has(i)) statusMap[i] = "skipped";
//     else                        statusMap[i] = "not_attempted";
//   });
//   const answeredN = allQ.filter((_, i) => statusMap[i] === "answered").length;
//   const skippedN  = allQ.filter((_, i) => statusMap[i] === "skipped").length;

//   // ── Navigation ────────────────────────────────────────────────────────────
//   const goNext = useCallback(() => {
//     if (skippedSet.has(currentFlat) && (answers[currentFlat] || "").toString().trim()) {
//       setSkippedSet(s => { const n = new Set(s); n.delete(currentFlat); return n; });
//     }
//     if (inReview) {
//       const nextPos = reviewPos + 1;
//       if (nextPos < reviewQueue.length) {
//         setReviewPos(nextPos);
//       } else {
//         const stillSkipped = reviewQueue.filter(i => !(answers[i] || "").toString().trim());
//         if (stillSkipped.length > 0) {
//           setReviewQueue(stillSkipped);
//           setReviewPos(0);
//         } else {
//           setInReview(false);
//         }
//       }
//       return;
//     }
//     const next = cursor + 1;
//     if (next < totalQ) {
//       setCursor(next);
//     } else {
//       const skippedList = allQ.map((_, i) => i).filter(i => skippedSet.has(i) && !(answers[i] || "").toString().trim());
//       if (skippedList.length > 0) {
//         setReviewQueue(skippedList);
//         setReviewPos(0);
//         setInReview(true);
//       }
//     }
//   }, [inReview, reviewPos, reviewQueue, cursor, totalQ, currentFlat, answers, skippedSet, allQ]);

//   const doSkip = useCallback(() => {
//     setSkippedSet(s => new Set([...s, currentFlat]));
//     setAnswers(p => { const n = { ...p }; delete n[currentFlat]; return n; });
//     goNext();
//   }, [currentFlat, goNext]);

//   const goPrev = useCallback(() => {
//     if (inReview) { if (reviewPos > 0) setReviewPos(p => p - 1); }
//     else          { if (cursor > 0)    setCursor(c => c - 1); }
//   }, [inReview, reviewPos, cursor]);

//   const jumpTo = (i) => { setInReview(false); setCursor(i); };

//   const isLastMainQ  = !inReview && cursor === totalQ - 1;
//   const isLastReview = inReview  && reviewPos === reviewQueue.length - 1;
//   const showSubmit   = isLastMainQ || isLastReview;

//   // ── Run code ──────────────────────────────────────────────────────────────
//   const runCode = async (flatIdx, language) => {
//     const code = (answers[flatIdx] || "").toString();
//     if (!code.trim()) return;
//     setCompiling(p => ({ ...p, [flatIdx]: true }));
//     try {
//       const res = await fetch(`${BASE}/exams/compile`, {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ code, language }),
//       });
//       const d = await res.json();
//       setCompRes(p => ({ ...p, [flatIdx]: d.success ? d.data : { stderr: d.message } }));
//     } catch {
//       setCompRes(p => ({ ...p, [flatIdx]: { stderr: "Compiler unavailable." } }));
//     } finally {
//       setCompiling(p => ({ ...p, [flatIdx]: false }));
//     }
//   };

//   // ── Submit ────────────────────────────────────────────────────────────────
//   const doSubmit = useCallback(async (auto = false) => {
//     if (submitting || submitted) return;
//     if (!auto && !window.confirm("Submit exam? This cannot be undone.")) return;
//     proctor.stop();
//     setSubmitting(true);
//     const mcqList = [], subjList = [], codeList = [];
//     allQ.forEach((e, i) => {
//       const val = (answers[i] || "").toString().trim();
//       if (e.type === "mcq")        mcqList.push({ question_index: e.origIdx, selected_option: val });
//       if (e.type === "subjective") subjList.push({ question_index: e.origIdx, answer: val });
//       if (e.type === "coding")     codeList.push({ question_index: e.origIdx, code: val, run_output: compRes[i]?.stdout || "", run_stderr: compRes[i]?.stderr || "", run_status: compRes[i]?.status || "" });
//     });
//     try {
//       const res = await fetch(`${BASE}/exams/submit/${token}`, {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           mcq: mcqList, subjective: subjList, coding: codeList,
//           proctoring: {
//             events: proctor.events,
//             snapshots: proctor.snaps.map(s => ({
//               ts: s.ts, label: s.label, dataUrl: s.dataUrl, analysis: s.ai,
//             })),
//           },
//         }),
//       });
//       const d = await res.json();
//       if (d.success) { setSubmitted(true); setResult(d.data); }
//       else alert(d.message || "Submission failed.");
//     } catch { alert("Submission failed. Check connection."); }
//     finally { setSubmitting(false); }
//   }, [allQ, answers, compRes, token, submitting, submitted, proctor]);

//   // ── Type styles ───────────────────────────────────────────────────────────
//   const TYPE_META = {
//     mcq:        { label: "MCQ",        color: "#7b1fa2", light: "#f3e5f5" },
//     subjective: { label: "Subjective", color: "#0277bd", light: "#e3f2fd" },
//     coding:     { label: "Coding",     color: "#2e7d32", light: "#e8f5e9" },
//   };

//   // ─── RENDER ───────────────────────────────────────────────────────────────
//   if (loading) return (
//     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f0f2f5" }}>
//       <div style={{ textAlign: "center" }}>
//         <div style={{ width: 44, height: 44, border: "4px solid #e0e0e0", borderTopColor: "#1a237e", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 14px" }} />
//         <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
//         <div style={{ color: "#666", fontSize: 15 }}>Loading exam…</div>
//       </div>
//     </div>
//   );

//   if (error) return (
//     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
//       <div style={{ textAlign: "center" }}>
//         <div style={{ fontSize: 52, marginBottom: 12 }}>⚠️</div>
//         <div style={{ fontSize: 22, fontWeight: 700, color: "#c62828" }}>Exam Unavailable</div>
//         <div style={{ color: "#666", marginTop: 8 }}>{error}</div>
//       </div>
//     </div>
//   );

//   if (submitted && result) return (
//     <ResultScreen result={result} exam={exam} events={proctor.events} snaps={proctor.snaps} />
//   );

//   if (!exam || allQ.length === 0) return null;

//   // ── CAMERA GATE ───────────────────────────────────────────────────────────
//   if (!cameraGranted) return (
//     <CameraGate exam={exam} onGranted={handleCameraGranted} />
//   );

//   const q       = entry?.q;
//   const type    = entry?.type || "mcq";
//   const meta    = TYPE_META[type];
//   const flatIdx = currentFlat;
//   const ans     = (answers[flatIdx] || "").toString();
//   const timePct = timeLeft !== null ? (timeLeft / (exam.time_limit_minutes * 60)) * 100 : 100;
//   const timeWarn = timeLeft !== null && timeLeft < 300;

//   return (
//     <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

//       {/* Face alert overlay */}
//       <FaceAlertOverlay alert={proctor.faceAlert} />

//       {/* ── Top navbar ──────────────────────────────────────────────────── */}
//       <div style={{
//         height: 52, background: "#1a237e",
//         display: "flex", alignItems: "center", justifyContent: "space-between",
//         padding: "0 18px", position: "sticky", top: 0, zIndex: 200,
//         boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
//       }}>
//         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//           <div style={{ width: 28, height: 28, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <span style={{ fontWeight: 900, fontSize: 14, color: "#1a237e" }}>V</span>
//           </div>
//           <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>VIGNANI<sup style={{ fontSize: 8 }}>PRO</sup></span>
//         </div>

//         <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 14px" }}>
//           <span style={{ fontSize: 12, color: "#e8eaf6", fontWeight: 600 }}>📋 {exam.job_title}</span>
//           <span style={{ fontSize: 10, color: "#90caf9" }}>· {exam.candidate_name}</span>
//         </div>

//         <div style={{ display: "flex", gap: 6 }}>
//           {[
//             { val: answeredN,                     bg: "#43a047", tip: "Answered"   },
//             { val: skippedN,                      bg: "#fb8c00", tip: "Skipped"    },
//             { val: totalQ - answeredN - skippedN, bg: "#607d8b", tip: "Remaining"  },
//           ].map(({ val, bg, tip }) => (
//             <div key={tip} title={tip} style={{
//               minWidth: 26, height: 26, borderRadius: 13, padding: "0 7px",
//               background: bg, color: "#fff",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               fontSize: 11, fontWeight: 700, gap: 3,
//             }}>{val}</div>
//           ))}
//         </div>

//         <div style={{
//           background: timeWarn ? "#c62828" : "rgba(255,255,255,0.15)",
//           borderRadius: 8, padding: "5px 14px",
//           display: "flex", alignItems: "center", gap: 6,
//           border: timeWarn ? "1px solid #ef9a9a" : "none",
//           animation: timeWarn ? "pulseRed 1s ease-in-out infinite" : "none",
//         }}>
//           <style>{`@keyframes pulseRed{0%,100%{opacity:1}50%{opacity:0.7}}`}</style>
//           <span style={{ fontSize: 14 }}>⏱</span>
//           <span style={{ fontWeight: 800, fontSize: 17, fontFamily: "monospace", color: "#fff" }}>
//             {fmt(timeLeft ?? 0)}
//           </span>
//         </div>

//         <div style={{ display: "flex", gap: 8 }}>
//           <button
//             onClick={() => doSubmit(false)}
//             disabled={submitting}
//             style={{
//               padding: "6px 16px", borderRadius: 7, border: "none",
//               background: "#fff", color: "#1a237e",
//               fontWeight: 700, fontSize: 12, cursor: "pointer",
//             }}>
//             {submitting ? "Submitting…" : "Submit Exam"}
//           </button>
//         </div>
//       </div>

//       {/* Timer bar */}
//       <div style={{ height: 3, background: "#c5cae9" }}>
//         <div style={{
//           width: `${timePct}%`, height: "100%",
//           background: timeWarn ? "#c62828" : "#1de9b6",
//           transition: "width 1s linear",
//         }} />
//       </div>

//       {/* Skip review banner */}
//       {inReview && (
//         <div style={{
//           background: "#fff3e0", borderBottom: "2px solid #fb8c00",
//           padding: "8px 20px", display: "flex", alignItems: "center", gap: 8, fontSize: 13,
//         }}>
//           <span>🔄</span>
//           <strong style={{ color: "#e65100" }}>Reviewing skipped — {reviewPos + 1} of {reviewQueue.length}</strong>
//           <span style={{ color: "#888", fontSize: 12 }}>Answer or skip again before submitting</span>
//         </div>
//       )}

//       {/* ── Two-column layout ──────────────────────────────────────────── */}
//       <div style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 14px", display: "flex", gap: 18, alignItems: "flex-start" }}>

//         {/* ── LEFT ─────────────────────────────────────────────────────── */}
//         <div style={{ flex: 1, minWidth: 0 }}>
//           <div style={{
//             background: "#fff", borderRadius: 12,
//             border: "1px solid #e0e0e0",
//             boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
//             overflow: "hidden",
//           }}>
//             {/* Question header */}
//             <div style={{
//               background: meta.light,
//               borderBottom: `2px solid ${meta.color}30`,
//               padding: "12px 20px",
//               display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
//             }}>
//               <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
//                 <span style={{
//                   background: meta.color, color: "#fff",
//                   borderRadius: 6, padding: "3px 12px",
//                   fontWeight: 700, fontSize: 13,
//                 }}>
//                   Question {flatIdx + 1} / {totalQ}
//                 </span>
//                 {q?.difficulty && (
//                   <span style={{
//                     ...DIFF[q.difficulty],
//                     borderRadius: 5, padding: "2px 9px",
//                     fontSize: 11, fontWeight: 600,
//                     border: `1px solid ${DIFF[q.difficulty]?.border}`,
//                   }}>{q.difficulty}</span>
//                 )}
//                 {(q?.topic || q?.skill) && (
//                   <span style={{ border: "1px solid #ccc", borderRadius: 5, padding: "2px 9px", fontSize: 11, color: "#555" }}>
//                     {q.topic || q.skill}
//                   </span>
//                 )}
//                 {skippedSet.has(flatIdx) && (
//                   <span style={{ background: "#fff3e0", color: "#e65100", border: "1px solid #ffb74d", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>
//                     ↩ Revisiting
//                   </span>
//                 )}
//               </div>
//               <span style={{
//                 fontSize: 11, fontWeight: 700, padding: "3px 11px", borderRadius: 20,
//                 background: meta.color + "18", color: meta.color,
//               }}>{meta.label}</span>
//             </div>

//             {/* Question body */}
//             <div style={{ padding: "22px 24px" }}>
//               <p style={{ fontSize: 15, lineHeight: 1.8, fontWeight: 500, color: "#1a1a2e", marginBottom: 24, marginTop: 0, whiteSpace: "pre-wrap" }}>
//                 {q?.question}
//               </p>

//               {/* MCQ — 2 columns */}
//               {type === "mcq" && (
//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
//                   {(q?.options || []).map((opt, j) => {
//                     const lbl = String.fromCharCode(65 + j);
//                     const sel = ans === opt;
//                     return (
//                       <label key={j} style={{
//                         display: "flex", alignItems: "center", gap: 12,
//                         padding: "12px 16px", borderRadius: 10, cursor: "pointer",
//                         border: `2px solid ${sel ? meta.color : "#e0e0e0"}`,
//                         background: sel ? meta.light : "#fafafa",
//                         transition: "all 0.15s",
//                       }}>
//                         <input type="radio" name={`q${flatIdx}`} value={opt} checked={sel}
//                           onChange={() => setAnswers(p => ({ ...p, [flatIdx]: opt }))}
//                           style={{ display: "none" }} />
//                         <span style={{
//                           width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
//                           background: sel ? meta.color : "#e8e8e8",
//                           color: sel ? "#fff" : "#666",
//                           display: "flex", alignItems: "center", justifyContent: "center",
//                           fontWeight: 800, fontSize: 13,
//                         }}>{lbl}</span>
//                         <span style={{ fontSize: 14, color: "#222", lineHeight: 1.4 }}>{opt}</span>
//                       </label>
//                     );
//                   })}
//                 </div>
//               )}

//               {/* Subjective */}
//               {type === "subjective" && (
//                 <>
//                   <textarea rows={10}
//                     placeholder="Write a detailed answer here…"
//                     value={ans}
//                     onChange={e => setAnswers(p => ({ ...p, [flatIdx]: e.target.value }))}
//                     style={{
//                       width: "100%", borderRadius: 10,
//                       border: `2px solid ${ans.length > 20 ? meta.color + "80" : "#e0e0e0"}`,
//                       padding: "13px 15px", fontSize: 14, lineHeight: 1.75,
//                       resize: "vertical", outline: "none",
//                       fontFamily: "Georgia, 'Times New Roman', serif",
//                       boxSizing: "border-box",
//                       transition: "border-color 0.2s",
//                     }}
//                   />
//                   <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
//                     <span style={{ fontSize: 12, color: ans.length < 20 ? "#e65100" : "#2e7d32" }}>
//                       {ans.length < 20 ? `Minimum 20 characters (${20 - ans.length} more needed)` : "✓ Good length"}
//                     </span>
//                     <span style={{ fontSize: 12, color: "#aaa" }}>{ans.length} characters</span>
//                   </div>
//                 </>
//               )}

//               {/* Coding */}
//               {type === "coding" && (
//                 <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #3d3d5c" }}>
//                   <div style={{ background: "#1e1e2e", padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
//                     <div style={{ display: "flex", gap: 5 }}>
//                       {["#ff5f57", "#febc2e", "#28c840"].map(c => (
//                         <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
//                       ))}
//                     </div>
//                     <span style={{ color: "#f9a825", fontSize: 12, fontWeight: 700 }}>🔒 {q?.programming_language} only</span>
//                   </div>
//                   <textarea rows={13}
//                     placeholder={`// Write your ${q?.programming_language} solution here`}
//                     value={ans}
//                     onChange={e => setAnswers(p => ({ ...p, [flatIdx]: e.target.value }))}
//                     style={{
//                       width: "100%", background: "#282a36",
//                       border: "none", borderBottom: "1px solid #3d3d5c",
//                       padding: "13px 16px", fontSize: 13,
//                       fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
//                       lineHeight: 1.9, resize: "vertical", outline: "none",
//                       color: "#f8f8f2", boxSizing: "border-box",
//                     }}
//                   />
//                   <div style={{ background: "#1e1e2e", padding: "8px 14px", display: "flex", gap: 8 }}>
//                     <button
//                       onClick={() => runCode(flatIdx, q?.programming_language)}
//                       disabled={compiling[flatIdx] || !ans.trim()}
//                       style={{
//                         padding: "6px 16px", borderRadius: 6,
//                         background: "#2e7d32", color: "#fff",
//                         border: "none", fontWeight: 700, fontSize: 13,
//                         cursor: "pointer", opacity: ans.trim() ? 1 : 0.45,
//                       }}>
//                       {compiling[flatIdx] ? "⟳ Running…" : "▶ Run Code"}
//                     </button>
//                   </div>
//                   {compRes[flatIdx] && (() => {
//                     const cr = compRes[flatIdx];
//                     return (
//                       <div style={{ background: "#13131f" }}>
//                         <div style={{ padding: "6px 14px", borderTop: "1px solid #3d3d5c", display: "flex", gap: 8 }}>
//                           <span style={{
//                             fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
//                             background: cr.status === "Accepted" ? "#1b5e20" : "#b71c1c", color: "#fff",
//                           }}>{cr.status}</span>
//                           {cr.time && <span style={{ fontSize: 11, color: "#999" }}>{cr.time}s</span>}
//                         </div>
//                         {cr.stdout && <div style={{ padding: "8px 14px" }}><pre style={{ margin: 0, fontSize: 12, color: "#a6e22e", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{cr.stdout}</pre></div>}
//                         {(cr.stderr || cr.compile_output) && <div style={{ padding: "8px 14px" }}><pre style={{ margin: 0, fontSize: 12, color: "#f92672", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{cr.compile_output || cr.stderr}</pre></div>}
//                       </div>
//                     );
//                   })()}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* ── Nav buttons ──────────────────────────────────────────── */}
//           <div style={{
//             display: "flex", justifyContent: "space-between",
//             alignItems: "center", marginTop: 14, gap: 10,
//           }}>
//             <button onClick={goPrev}
//               disabled={inReview ? reviewPos === 0 : cursor === 0}
//               style={{
//                 padding: "10px 22px", borderRadius: 8,
//                 border: "1.5px solid #ccc", background: "#fff",
//                 color: "#444", fontWeight: 600, fontSize: 13,
//                 cursor: "pointer",
//                 opacity: (inReview ? reviewPos === 0 : cursor === 0) ? 0.3 : 1,
//               }}>← Previous</button>

//             <button onClick={doSkip} style={{
//               padding: "10px 22px", borderRadius: 8,
//               border: "2px solid #fb8c00", background: "#fff8e1",
//               color: "#e65100", fontWeight: 700, fontSize: 13, cursor: "pointer",
//             }}>Skip →</button>

//             {showSubmit ? (
//               <button onClick={() => doSubmit(false)} disabled={submitting} style={{
//                 padding: "10px 28px", borderRadius: 8, border: "none",
//                 background: "linear-gradient(135deg, #2e7d32, #388e3c)",
//                 color: "#fff", fontWeight: 700, fontSize: 13,
//                 cursor: "pointer", boxShadow: "0 3px 12px rgba(46,125,50,0.4)",
//               }}>{submitting ? "Submitting…" : "✓ Submit Exam"}</button>
//             ) : (
//               <button onClick={goNext} style={{
//                 padding: "10px 28px", borderRadius: 8, border: "none",
//                 background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
//                 color: "#fff", fontWeight: 700, fontSize: 13,
//                 cursor: "pointer",
//                 boxShadow: `0 3px 12px ${meta.color}44`,
//               }}>Save & Next →</button>
//             )}
//           </div>
//         </div>

//         {/* ── RIGHT ─────────────────────────────────────────────────── */}
//         <RightSidebar
//           total={totalQ}
//           currentFlat={currentFlat}
//           statusMap={statusMap}
//           onJump={jumpTo}
//           videoRef={proctor.videoRef}
//           camReady={proctor.ready}
//           camError={proctor.error}
//           events={proctor.events}
//         />
//       </div>
//     </div>
//   );
// }





import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";

const BASE = process.env.REACT_APP_API_BASE_URL || "";

const pad = (n) => String(n).padStart(2, "0");
const fmt = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

const DIFF = {
  Easy:   { bg: "#e8f5e9", color: "#256029", border: "#81c784" },
  Medium: { bg: "#fff3e0", color: "#bf360c", border: "#ffb74d" },
  Hard:   { bg: "#fce4ec", color: "#880e4f", border: "#f48fb1" },
};

const STATUS_STYLE = {
  current:       { bg: "#1565c0", color: "#fff", border: "#1565c0" },
  answered:      { bg: "#43a047", color: "#fff", border: "#43a047" },
  skipped:       { bg: "#fb8c00", color: "#fff", border: "#fb8c00" },
  not_attempted: { bg: "#e0e0e0", color: "#757575", border: "#bdbdbd" },
};

// ══════════════════════════════════════════════════════════════════════════════
//  PROCTORING HOOK
// ══════════════════════════════════════════════════════════════════════════════
function useProctoring(examToken) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const timerRef  = useRef(null);
  const snapId    = useRef(0);

  const [ready,  setReady]  = useState(false);
  const [error,  setError]  = useState(null);
  const [events, setEvents] = useState([]);
  const [snaps,  setSnaps]  = useState([]);
  const [faceAlert, setFaceAlert] = useState(null); // live alert overlay

  const capture = useCallback(async (label = "periodic") => {
    if (!videoRef.current || !ready) return null;
    const cv = document.createElement("canvas");
    cv.width = 320; cv.height = 240;
    cv.getContext("2d").drawImage(videoRef.current, 0, 0, 320, 240);
    const dataUrl = cv.toDataURL("image/jpeg", 0.6);
    const ts = new Date().toISOString();
    snapId.current += 1;
    const id = snapId.current;

    try {
      const b64 = dataUrl.split(",")[1];
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
              {
                type: "text",
                text: `You are an AI exam proctor. Analyze this webcam frame carefully.
Return ONLY valid JSON, no markdown:
{
  "face_detected": bool,
  "face_count": int,
  "looking_away": bool,
  "phone_detected": bool,
  "multiple_people": bool,
  "flag": "ok" | "warning" | "alert",
  "reason": "short reason if flag != ok, else empty string"
}

Rules:
- flag="alert" if: no face, multiple people, phone visible, person clearly looking away for extended time
- flag="warning" if: face partially visible, slight head turn
- flag="ok" if: single face looking at screen normally`
              }
            ]
          }],
        }),
      });
      const d = await res.json();
      const raw = (d?.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      let ai = {};
      try { ai = JSON.parse(raw); } catch { ai = { flag: "ok" }; }

      const snap = { id, ts, dataUrl, label, ai };
      setSnaps(p => [...p.slice(-79), snap]);

      if (ai.flag !== "ok") {
        const evt = {
          id: Date.now(), ts,
          type: ai.flag,
          msg: ai.reason || (ai.flag === "alert" ? "Suspicious activity detected" : "Attention warning"),
          snapshot: dataUrl,
        };
        setEvents(p => [...p.slice(-199), evt]);
        setFaceAlert(evt);
        setTimeout(() => setFaceAlert(null), 4000);

        fetch(`${BASE}/exams/proctor/${examToken}/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(evt),
        }).catch(() => {});
      }
      return snap;
    } catch (_) { return null; }
  }, [ready, examToken]);

  // Capture one frame for camera-gate verification
  const captureOnce = useCallback(async () => {
    if (!videoRef.current) return null;
    const cv = document.createElement("canvas");
    cv.width = 320; cv.height = 240;
    cv.getContext("2d").drawImage(videoRef.current, 0, 0, 320, 240);
    return cv.toDataURL("image/jpeg", 0.6);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setReady(true);
      return true;
    } catch (e) {
      setError("Camera access denied or unavailable.");
      return false;
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => capture("initial"), 3000);
    timerRef.current = setInterval(() => capture("periodic"), 25000);
    return () => { clearTimeout(t); clearInterval(timerRef.current); };
  }, [ready, capture]);

  // Tab-switch detection
  useEffect(() => {
    const fn = () => {
      if (document.hidden) {
        const evt = {
          id: Date.now(), ts: new Date().toISOString(),
          type: "alert", msg: "Tab switch / window blur detected", snapshot: null,
        };
        setEvents(p => [...p, evt]);
        setFaceAlert(evt);
        setTimeout(() => setFaceAlert(null), 4000);
        fetch(`${BASE}/exams/proctor/${examToken}/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(evt),
        }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, [examToken]);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setReady(false);
  }, []);

  return { videoRef, ready, error, events, snaps, faceAlert, start, stop, capture, captureOnce };
}

// ══════════════════════════════════════════════════════════════════════════════
//  CAMERA GATE — must allow camera before exam starts
// ══════════════════════════════════════════════════════════════════════════════
function CameraGate({ exam, onGranted }) {
  const [step, setStep]     = useState("intro");   // intro | requesting | verifying | error
  const [errMsg, setErrMsg] = useState("");
  const [preview, setPreview] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const requestCamera = async () => {
    setStep("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStep("verifying");
      // Wait 2s for video to stabilise then capture
      setTimeout(() => captureAndVerify(stream), 2000);
    } catch (e) {
      setErrMsg("Camera access was denied. Please allow camera access in your browser settings and reload.");
      setStep("error");
    }
  };

  const captureAndVerify = async (stream) => {
    const cv = document.createElement("canvas");
    cv.width = 320; cv.height = 240;
    if (videoRef.current) {
      cv.getContext("2d").drawImage(videoRef.current, 0, 0, 320, 240);
    }
    const dataUrl = cv.toDataURL("image/jpeg", 0.7);
    setPreview(dataUrl);

    try {
      const b64 = dataUrl.split(",")[1];
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
              {
                type: "text",
                text: `Camera verification for an online exam. Return ONLY JSON:
{"face_visible": bool, "single_person": bool, "good_lighting": bool, "approved": bool, "reason": ""}
approved=true only if exactly one face is clearly visible with decent lighting.`
              }
            ]
          }],
        }),
      });
      const d = await res.json();
      const raw = (d?.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      let ai = {};
      try { ai = JSON.parse(raw); } catch { ai = { approved: false, reason: "Verification failed" }; }

      if (ai.approved) {
        // Pass stream to parent so it reuses it
        onGranted(stream, videoRef, dataUrl);
      } else {
        setErrMsg(ai.reason || "Could not verify your face. Ensure good lighting and your face is clearly visible.");
        setStep("error");
        stream.getTracks().forEach(t => t.stop());
      }
    } catch {
      // On AI failure, still allow (don't block exam for API errors)
      onGranted(stream, videoRef, dataUrl);
    }
  };

  const retry = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setStep("intro");
    setPreview(null);
    setErrMsg("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d1117 0%, #1a1f2e 50%, #0d1117 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 540,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        backdropFilter: "blur(20px)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1a237e, #0277bd)",
          padding: "28px 32px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>Camera Verification Required</div>
          <div style={{ color: "#90caf9", fontSize: 13, marginTop: 6 }}>
            {exam?.job_title} · {exam?.candidate_name}
          </div>
        </div>

        <div style={{ padding: "28px 32px" }}>
          {step === "intro" && (
            <>
              <div style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
                This exam uses <strong style={{ color: "#90caf9" }}>AI-powered proctoring</strong>. Before you begin:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                {[
                  ["👤", "Your face must be visible throughout the exam"],
                  ["💡", "Ensure your room is well-lit"],
                  ["📱", "No phones or secondary devices allowed"],
                  ["👁️", "Do not look away from the screen for extended periods"],
                  ["🔒", "Webcam snapshots are captured periodically for review"],
                ].map(([icon, text]) => (
                  <div key={text} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "10px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span style={{ color: "#ccc", fontSize: 13 }}>{text}</span>
                  </div>
                ))}
              </div>
              <button onClick={requestCamera} style={{
                width: "100%", padding: "14px",
                borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #1565c0, #0277bd)",
                color: "#fff", fontWeight: 700, fontSize: 15,
                cursor: "pointer", letterSpacing: 0.5,
                boxShadow: "0 4px 20px rgba(21,101,192,0.4)",
              }}>
                Allow Camera & Start Verification
              </button>
            </>
          )}

          {step === "requesting" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{
                width: 56, height: 56,
                border: "4px solid rgba(144,202,249,0.2)",
                borderTopColor: "#90caf9",
                borderRadius: "50%",
                animation: "spin .8s linear infinite",
                margin: "0 auto 20px",
              }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ color: "#90caf9", fontSize: 16, fontWeight: 600 }}>
                Requesting camera access…
              </div>
              <div style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
                Please click "Allow" in your browser prompt
              </div>
            </div>
          )}

          {step === "verifying" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", marginBottom: 16, border: "2px solid #1565c0" }}>
                <video ref={videoRef} autoPlay muted playsInline
                  style={{ width: "100%", display: "block", aspectRatio: "4/3", objectFit: "cover" }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  border: "3px solid #43a047",
                  borderRadius: 10,
                  animation: "pulse 1.5s ease-in-out infinite",
                  pointerEvents: "none",
                }} />
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#90caf9" }}>
                <div style={{
                  width: 12, height: 12, borderRadius: "50%",
                  background: "#43a047",
                  animation: "blink 1s ease-in-out infinite",
                }} />
                <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Verifying your face via AI…</span>
              </div>
            </div>
          )}

          {step === "error" && (
            <div style={{ textAlign: "center" }}>
              {preview && (
                <img src={preview} alt="capture" style={{
                  width: "100%", borderRadius: 12, marginBottom: 16,
                  border: "2px solid #c62828", opacity: 0.8,
                }} />
              )}
              <div style={{
                background: "rgba(198,40,40,0.1)",
                border: "1px solid rgba(198,40,40,0.3)",
                borderRadius: 10, padding: "14px 16px",
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>❌</div>
                <div style={{ color: "#ef9a9a", fontSize: 14 }}>{errMsg}</div>
              </div>
              <button onClick={retry} style={{
                width: "100%", padding: 12, borderRadius: 10, border: "none",
                background: "#1565c0", color: "#fff", fontWeight: 700,
                fontSize: 14, cursor: "pointer",
              }}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  FACE ALERT OVERLAY
// ══════════════════════════════════════════════════════════════════════════════
function FaceAlertOverlay({ alert }) {
  if (!alert) return null;
  const isAlert = alert.type === "alert";
  return (
    <div style={{
      position: "fixed", top: 70, right: 20, zIndex: 9999,
      background: isAlert ? "#b71c1c" : "#e65100",
      color: "#fff", borderRadius: 12,
      padding: "12px 18px",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: `0 4px 20px ${isAlert ? "rgba(183,28,28,0.5)" : "rgba(230,81,0,0.5)"}`,
      animation: "slideIn 0.3s ease",
      maxWidth: 320,
    }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <span style={{ fontSize: 22 }}>{isAlert ? "🚨" : "⚠️"}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{isAlert ? "ALERT" : "WARNING"}</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{alert.msg}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  RIGHT SIDEBAR
// ══════════════════════════════════════════════════════════════════════════════
function RightSidebar({ total, currentFlat, statusMap, onJump, videoRef, camReady, camError, events }) {
  const alertCount = events.filter(e => e.type === "alert").length;
  const warnCount  = events.filter(e => e.type === "warning").length;

  return (
    <div style={{
      width: 218, flexShrink: 0,
      display: "flex", flexDirection: "column",
      position: "sticky", top: 60, alignSelf: "flex-start",
    }}>
      {/* Palette */}
      <div style={{
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: "10px 10px 0 0",
        overflow: "hidden",
      }}>
        <div style={{
          background: "#1a237e", color: "#fff",
          padding: "9px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Questions: {total}</span>
          <span style={{ fontSize: 10, color: "#90caf9" }}>
            {Object.values(statusMap).filter(v => v === "answered").length} done
          </span>
        </div>
        <div style={{
          padding: "10px 8px",
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5,
          maxHeight: 220, overflowY: "auto",
        }}>
          {Array.from({ length: total }, (_, i) => {
            const st = i === currentFlat ? "current" : statusMap[i] || "not_attempted";
            const s  = STATUS_STYLE[st];
            return (
              <button key={i} onClick={() => onJump(i)} title={`Q${i+1}`}
                style={{
                  width: "100%", aspectRatio: "1", borderRadius: "50%",
                  background: s.bg, color: s.color,
                  border: `2px solid ${s.border}`,
                  fontWeight: 700, fontSize: 11, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "transform 0.1s", boxSizing: "border-box", padding: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >{i + 1}</button>
            );
          })}
        </div>
        <div style={{
          padding: "8px 10px", borderTop: "1px solid #f0f0f0",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 6px",
        }}>
          {[
            ["current", "Current"],
            ["answered", "Answered"],
            ["skipped", "Skipped"],
            ["not_attempted", "Not Attempted"],
          ].map(([key, lbl]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 11, height: 11, borderRadius: "50%",
                background: STATUS_STYLE[key].bg,
                border: `1.5px solid ${STATUS_STYLE[key].border}`,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 9, color: "#555" }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live cam */}
      <div style={{
        background: "#0d0d1a",
        border: "1px solid #333",
        borderTop: "2px solid #1565c0",
        borderRadius: "0 0 10px 10px",
        overflow: "hidden",
        position: "relative",
      }}>
        <video ref={videoRef} autoPlay muted playsInline
          style={{ width: "100%", display: "block", aspectRatio: "4/3", objectFit: "cover" }}
        />
        {/* Scanning line animation when ready */}
        {camReady && (
          <div style={{
            position: "absolute", left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent, #00e5ff, transparent)",
            animation: "scan 3s linear infinite",
            pointerEvents: "none",
          }} />
        )}
        <style>{`@keyframes scan{0%{top:0%}100%{top:100%}}`}</style>

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
          padding: "16px 10px 8px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: camReady ? "#43a047" : "#f44336",
              boxShadow: camReady ? "0 0 6px #43a047" : "none",
              animation: camReady ? "blink2 2s ease-in-out infinite" : "none",
            }} />
            <style>{`@keyframes blink2{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>
              {camReady ? "MONITORED" : camError ? "NO CAM" : "Starting…"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {alertCount > 0 && (
              <div style={{ background: "#c62828", borderRadius: 8, padding: "1px 6px", fontSize: 9, color: "#fff", fontWeight: 700 }}>
                {alertCount}🚨
              </div>
            )}
            {warnCount > 0 && (
              <div style={{ background: "#e65100", borderRadius: 8, padding: "1px 6px", fontSize: 9, color: "#fff", fontWeight: 700 }}>
                {warnCount}⚠️
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  RESULT SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function ResultScreen({ result, exam, events, snaps }) {
  const [tab, setTab] = useState("scores");
  const flagged = snaps.filter(s => s.ai?.flag !== "ok");
  const alertCount   = events.filter(e => e.type === "alert").length;
  const warnCount    = events.filter(e => e.type === "warning").length;
  const integrityScore = Math.max(0, 100 - alertCount * 15 - warnCount * 5);

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", padding: "32px 16px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1b5e20" }}>Exam Submitted!</div>
          <div style={{ color: "#666", marginTop: 6, fontSize: 14 }}>
            Thank you <strong>{exam?.candidate_name}</strong> — your responses have been graded.
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", background: "#fff", borderRadius: 12,
          border: "1px solid #e0e0e0", padding: 4, marginBottom: 16, gap: 4,
        }}>
          {[
            ["scores", "📊 Scores"],
            ["proctoring", `🎥 Monitoring${events.length > 0 ? ` (${events.length})` : ""}`],
            ["snapshots", `📸 Snapshots${flagged.length > 0 ? ` (${flagged.length}⚠)` : ""}`],
            ["feedback", "💬 Feedback"],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: "8px 4px", borderRadius: 8, border: "none",
              cursor: "pointer", fontWeight: 600, fontSize: 12,
              background: tab === k ? "#1a237e" : "transparent",
              color: tab === k ? "#fff" : "#666",
              transition: "all 0.2s",
            }}>{l}</button>
          ))}
        </div>

        {tab === "scores" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              background: "#fff", borderRadius: 16, padding: 28,
              textAlign: "center", border: "1px solid #e0e0e0",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 1.5 }}>Overall Score</div>
              <div style={{
                fontSize: 72, fontWeight: 900, lineHeight: 1.1,
                color: result.overall_score >= 70 ? "#2e7d32" : result.overall_score >= 50 ? "#e65100" : "#c62828",
              }}>{result.overall_score}%</div>
              <div style={{ height: 10, background: "#eee", borderRadius: 5, marginTop: 12, overflow: "hidden" }}>
                <div style={{
                  width: `${result.overall_score}%`, height: "100%", borderRadius: 5,
                  background: result.overall_score >= 70 ? "#2e7d32" : result.overall_score >= 50 ? "#e65100" : "#c62828",
                  transition: "width 1.5s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {result.mcq_total > 0 && (
                <div style={{ flex: 1, minWidth: 130, background: "#f3e5f5", borderRadius: 12, padding: 16, textAlign: "center", border: "1px solid #ce93d8" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#7b1fa2", textTransform: "uppercase", letterSpacing: 1 }}>MCQ</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: "#7b1fa2" }}>{result.mcq_score}%</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{result.mcq_correct}/{result.mcq_total} correct</div>
                </div>
              )}
              {result.subj_count > 0 && (
                <div style={{ flex: 1, minWidth: 130, background: "#e3f2fd", borderRadius: 12, padding: 16, textAlign: "center", border: "1px solid #90caf9" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#0277bd", textTransform: "uppercase", letterSpacing: 1 }}>Written</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: "#0277bd" }}>{result.subj_score}%</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{result.subj_count} questions</div>
                </div>
              )}
              {result.code_count > 0 && (
                <div style={{ flex: 1, minWidth: 130, background: "#e8f5e9", borderRadius: 12, padding: 16, textAlign: "center", border: "1px solid #a5d6a7" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#2e7d32", textTransform: "uppercase", letterSpacing: 1 }}>Coding</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: "#2e7d32" }}>{result.code_score}%</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{result.code_count} questions</div>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 130, background: integrityScore >= 80 ? "#e8f5e9" : integrityScore >= 60 ? "#fff3e0" : "#fce4ec", borderRadius: 12, padding: 16, textAlign: "center", border: `1px solid ${integrityScore >= 80 ? "#a5d6a7" : integrityScore >= 60 ? "#ffcc02" : "#f48fb1"}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: integrityScore >= 80 ? "#2e7d32" : integrityScore >= 60 ? "#e65100" : "#c62828", textTransform: "uppercase", letterSpacing: 1 }}>Integrity</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: integrityScore >= 80 ? "#2e7d32" : integrityScore >= 60 ? "#e65100" : "#c62828" }}>{integrityScore}%</div>
                <div style={{ fontSize: 11, color: "#888" }}>{alertCount} alerts</div>
              </div>
            </div>
          </div>
        )}

        {tab === "proctoring" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Proctoring Events ({events.length})</div>
              <div style={{
                padding: "4px 12px", borderRadius: 20,
                background: integrityScore >= 80 ? "#e8f5e9" : "#fce4ec",
                color: integrityScore >= 80 ? "#2e7d32" : "#c62828",
                fontSize: 12, fontWeight: 700,
              }}>
                Integrity: {integrityScore}%
              </div>
            </div>
            {events.length === 0
              ? <div style={{ color: "#2e7d32", textAlign: "center", padding: 36, fontSize: 15 }}>✅ No issues detected</div>
              : events.map(e => (
                <div key={e.id} style={{
                  padding: "10px 14px", borderRadius: 10, marginBottom: 8,
                  background: e.type === "alert" ? "#fce4ec" : "#fff8e1",
                  border: `1px solid ${e.type === "alert" ? "#f48fb1" : "#ffe082"}`,
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: 20 }}>{e.type === "alert" ? "🚨" : "⚠️"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: e.type === "alert" ? "#c62828" : "#e65100" }}>{e.msg}</div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{new Date(e.ts).toLocaleTimeString()}</div>
                  </div>
                  {e.snapshot && (
                    <img src={e.snapshot} alt="" style={{ width: 60, height: 45, objectFit: "cover", borderRadius: 6, border: "1px solid #ddd" }} />
                  )}
                </div>
              ))
            }
          </div>
        )}

        {tab === "snapshots" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e0e0e0" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
              Captured Frames ({snaps.length})
              {flagged.length > 0 && <span style={{ color: "#c62828", marginLeft: 10, fontSize: 13 }}>— {flagged.length} flagged</span>}
            </div>
            {snaps.length === 0
              ? <div style={{ color: "#999", textAlign: "center", padding: 36 }}>No snapshots captured</div>
              : <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                  {[...snaps].reverse().map(s => (
                    <div key={s.id} style={{ position: "relative" }}>
                      <img src={s.dataUrl} alt="" style={{
                        width: "100%", borderRadius: 8,
                        border: s.ai?.flag === "alert" ? "2px solid #f44336"
                              : s.ai?.flag === "warning" ? "2px solid #fb8c00"
                              : "1px solid #e0e0e0",
                      }} />
                      {s.ai?.flag !== "ok" && (
                        <div style={{
                          position: "absolute", top: 4, right: 4,
                          background: s.ai?.flag === "alert" ? "#f44336" : "#fb8c00",
                          borderRadius: 4, padding: "1px 5px", fontSize: 9, color: "#fff", fontWeight: 700,
                        }}>{s.ai?.flag?.toUpperCase()}</div>
                      )}
                      <div style={{ fontSize: 9, color: "#999", marginTop: 3, textAlign: "center" }}>
                        {new Date(s.ts).toLocaleTimeString()}
                      </div>
                      {s.ai?.reason && (
                        <div style={{ fontSize: 9, color: "#c62828", textAlign: "center", marginTop: 1 }}>
                          {s.ai.reason.slice(0, 30)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {tab === "feedback" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {result.subj_feedback?.map((f, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e0e0e0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0277bd" }}>Written Q{i + 1}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 20,
                      background: f.verdict === "Excellent" ? "#e8f5e9" : f.verdict === "Good" ? "#e3f2fd" : "#fff3e0",
                      color: f.verdict === "Excellent" ? "#2e7d32" : f.verdict === "Good" ? "#0277bd" : "#e65100",
                      fontSize: 11, fontWeight: 700,
                    }}>{f.verdict}</span>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "#333" }}>{f.score}/{f.max}</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 10, fontStyle: "italic" }}>{f.q}</div>
                <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{f.feedback}</div>
                {f.covered?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#2e7d32", marginBottom: 4 }}>✅ Covered:</div>
                    {f.covered.map((p, j) => <div key={j} style={{ fontSize: 12, color: "#2e7d32", marginLeft: 10 }}>• {p}</div>)}
                  </div>
                )}
                {f.missed?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#c62828", marginBottom: 4 }}>❌ Missed:</div>
                    {f.missed.map((p, j) => <div key={j} style={{ fontSize: 12, color: "#c62828", marginLeft: 10 }}>• {p}</div>)}
                  </div>
                )}
              </div>
            ))}
            {result.code_feedback?.map((f, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e0e0e0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#2e7d32" }}>Coding Q{i + 1}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 20, background: "#e8f5e9", color: "#2e7d32", fontSize: 11, fontWeight: 700 }}>{f.quality}</span>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "#333" }}>{f.score}/{f.max}</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 10, fontStyle: "italic" }}>{f.q}</div>
                <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{f.feedback}</div>
                {!f.lang_ok && (
                  <div style={{ marginTop: 8, padding: "6px 12px", background: "#fce4ec", borderRadius: 8, fontSize: 12, color: "#c62828", fontWeight: 600 }}>
                    ⚠️ Wrong language used
                  </div>
                )}
              </div>
            ))}
            {(!result.subj_feedback?.length && !result.code_feedback?.length) && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 28, textAlign: "center", color: "#999" }}>
                No AI feedback available for this exam.
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 20 }}>
          Recruiter notified. You may now close this tab.
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN EXAM PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function ExamPage() {
  const { token } = useParams();

  const [loading,    setLoading]    = useState(true);
  const [exam,       setExam]       = useState(null);
  const [error,      setError]      = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [result,     setResult]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft,   setTimeLeft]   = useState(null);

  // Camera gate state
  const [cameraGranted, setCameraGranted] = useState(false);
  const [passedStream,  setPassedStream]  = useState(null);

  // Flat question list
  const [allQ, setAllQ] = useState([]);

  // Navigation
  const [cursor,      setCursor]      = useState(0);
  const [skippedSet,  setSkippedSet]  = useState(new Set());
  const [inReview,    setInReview]    = useState(false);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewPos,   setReviewPos]   = useState(0);

  // Answers
  const [answers,   setAnswers]   = useState({});
  const [compRes,   setCompRes]   = useState({});
  const [compiling, setCompiling] = useState({});

  const proctor = useProctoring(token);

  // ── Load exam ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/exams/take/${token}`)
      .then(r => r.json())
      .then(res => {
        if (!res.success) { setError(res.message || "Could not load exam"); return; }
        const d = res.data;
        setExam(d);
        setTimeLeft(d.time_limit_minutes * 60);
        const flat = [];
        (d.mcq_questions        || []).forEach((q, i) => flat.push({ type: "mcq",        origIdx: i, q }));
        (d.subjective_questions || []).forEach((q, i) => flat.push({ type: "subjective",  origIdx: i, q }));
        (d.coding_questions     || []).forEach((q, i) => flat.push({ type: "coding",      origIdx: i, q }));
        setAllQ(flat);
      })
      .catch(() => setError("Failed to load exam."))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Camera granted callback ───────────────────────────────────────────────
  const handleCameraGranted = useCallback(async (stream, gateVideoRef, gateSnapshot) => {
    setPassedStream(stream);
    // Hand stream to proctoring hook
    if (proctor.videoRef.current) {
      proctor.videoRef.current.srcObject = stream;
      await proctor.videoRef.current.play().catch(() => {});
    }
    // Mark ready manually
    // We call start() but pass the stream in (start will create new stream unless we hack it)
    // Simpler: set videoRef directly and mark ready by calling start which re-requests
    // Actually: we'll re-use the stream by assigning srcObject then starting interval
    setCameraGranted(true);
    // Mark proctor as ready by calling start (it will get a new stream but that's fine)
    proctor.start();
  }, [proctor]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraGranted) return;
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { doSubmit(true); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitted, cameraGranted]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentFlat = inReview ? reviewQueue[reviewPos] : cursor;
  const entry   = allQ[currentFlat] || null;
  const totalQ  = allQ.length;

  const statusMap = {};
  allQ.forEach((_, i) => {
    const ans = (answers[i] || "").toString().trim();
    if (ans)                    statusMap[i] = "answered";
    else if (skippedSet.has(i)) statusMap[i] = "skipped";
    else                        statusMap[i] = "not_attempted";
  });
  const answeredN = allQ.filter((_, i) => statusMap[i] === "answered").length;
  const skippedN  = allQ.filter((_, i) => statusMap[i] === "skipped").length;

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (skippedSet.has(currentFlat) && (answers[currentFlat] || "").toString().trim()) {
      setSkippedSet(s => { const n = new Set(s); n.delete(currentFlat); return n; });
    }
    if (inReview) {
      const nextPos = reviewPos + 1;
      if (nextPos < reviewQueue.length) {
        setReviewPos(nextPos);
      } else {
        const stillSkipped = reviewQueue.filter(i => !(answers[i] || "").toString().trim());
        if (stillSkipped.length > 0) {
          setReviewQueue(stillSkipped);
          setReviewPos(0);
        } else {
          setInReview(false);
        }
      }
      return;
    }
    const next = cursor + 1;
    if (next < totalQ) {
      setCursor(next);
    } else {
      const skippedList = allQ.map((_, i) => i).filter(i => skippedSet.has(i) && !(answers[i] || "").toString().trim());
      if (skippedList.length > 0) {
        setReviewQueue(skippedList);
        setReviewPos(0);
        setInReview(true);
      }
    }
  }, [inReview, reviewPos, reviewQueue, cursor, totalQ, currentFlat, answers, skippedSet, allQ]);

  const doSkip = useCallback(() => {
    setSkippedSet(s => new Set([...s, currentFlat]));
    setAnswers(p => { const n = { ...p }; delete n[currentFlat]; return n; });
    goNext();
  }, [currentFlat, goNext]);

  const goPrev = useCallback(() => {
    if (inReview) { if (reviewPos > 0) setReviewPos(p => p - 1); }
    else          { if (cursor > 0)    setCursor(c => c - 1); }
  }, [inReview, reviewPos, cursor]);

  const jumpTo = (i) => { setInReview(false); setCursor(i); };

  const isLastMainQ  = !inReview && cursor === totalQ - 1;
  const isLastReview = inReview  && reviewPos === reviewQueue.length - 1;
  const showSubmit   = isLastMainQ || isLastReview;

  // ── Run code ──────────────────────────────────────────────────────────────
  const runCode = async (flatIdx, language) => {
    const code = (answers[flatIdx] || "").toString();
    if (!code.trim()) return;
    setCompiling(p => ({ ...p, [flatIdx]: true }));
    try {
      const res = await fetch(`${BASE}/exams/compile`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const d = await res.json();
      setCompRes(p => ({ ...p, [flatIdx]: d.success ? d.data : { stderr: d.message } }));
    } catch {
      setCompRes(p => ({ ...p, [flatIdx]: { stderr: "Compiler unavailable." } }));
    } finally {
      setCompiling(p => ({ ...p, [flatIdx]: false }));
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const doSubmit = useCallback(async (auto = false) => {
    if (submitting || submitted) return;
    if (!auto && !window.confirm("Submit exam? This cannot be undone.")) return;
    proctor.stop();
    setSubmitting(true);
    const mcqList = [], subjList = [], codeList = [];
    allQ.forEach((e, i) => {
      const val = (answers[i] || "").toString().trim();
      if (e.type === "mcq")        mcqList.push({ question_index: e.origIdx, selected_option: val });
      if (e.type === "subjective") subjList.push({ question_index: e.origIdx, answer: val });
      if (e.type === "coding")     codeList.push({ question_index: e.origIdx, code: val, run_output: compRes[i]?.stdout || "", run_stderr: compRes[i]?.stderr || "", run_status: compRes[i]?.status || "" });
    });
    try {
      const res = await fetch(`${BASE}/exams/submit/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mcq: mcqList, subjective: subjList, coding: codeList,
          proctoring: {
            events: proctor.events,
            snapshots: proctor.snaps.map(s => ({
              ts: s.ts, label: s.label, dataUrl: s.dataUrl, analysis: s.ai,
            })),
          },
        }),
      });
      const d = await res.json();
      if (d.success) { setSubmitted(true); setResult(d.data); }
      else alert(d.message || "Submission failed.");
    } catch { alert("Submission failed. Check connection."); }
    finally { setSubmitting(false); }
  }, [allQ, answers, compRes, token, submitting, submitted, proctor]);

  // ── Type styles ───────────────────────────────────────────────────────────
  const TYPE_META = {
    mcq:        { label: "MCQ",        color: "#7b1fa2", light: "#f3e5f5" },
    subjective: { label: "Subjective", color: "#0277bd", light: "#e3f2fd" },
    coding:     { label: "Coding",     color: "#2e7d32", light: "#e8f5e9" },
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f0f2f5" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, border: "4px solid #e0e0e0", borderTopColor: "#1a237e", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 14px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ color: "#666", fontSize: 15 }}>Loading exam…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#c62828" }}>Exam Unavailable</div>
        <div style={{ color: "#666", marginTop: 8 }}>{error}</div>
      </div>
    </div>
  );

  if (submitted && result) return (
    <ResultScreen result={result} exam={exam} events={proctor.events} snaps={proctor.snaps} />
  );

  if (!exam || allQ.length === 0) return null;

  // ── CAMERA GATE ───────────────────────────────────────────────────────────
  if (!cameraGranted) return (
    <CameraGate exam={exam} onGranted={handleCameraGranted} />
  );

  const q       = entry?.q;
  const type    = entry?.type || "mcq";
  const meta    = TYPE_META[type];
  const flatIdx = currentFlat;
  const ans     = (answers[flatIdx] || "").toString();
  const timePct = timeLeft !== null ? (timeLeft / (exam.time_limit_minutes * 60)) * 100 : 100;
  const timeWarn = timeLeft !== null && timeLeft < 300;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Face alert overlay */}
      <FaceAlertOverlay alert={proctor.faceAlert} />

      {/* ── Top navbar ──────────────────────────────────────────────────── */}
      <div style={{
        height: 52, background: "#1a237e",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 18px", position: "sticky", top: 0, zIndex: 200,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontWeight: 900, fontSize: 14, color: "#1a237e" }}>V</span>
          </div>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>VIGNANI<sup style={{ fontSize: 8 }}>PRO</sup></span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 14px" }}>
          <span style={{ fontSize: 12, color: "#e8eaf6", fontWeight: 600 }}>📋 {exam.job_title}</span>
          <span style={{ fontSize: 10, color: "#90caf9" }}>· {exam.candidate_name}</span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {[
            { val: answeredN,                     bg: "#43a047", tip: "Answered"   },
            { val: skippedN,                      bg: "#fb8c00", tip: "Skipped"    },
            { val: totalQ - answeredN - skippedN, bg: "#607d8b", tip: "Remaining"  },
          ].map(({ val, bg, tip }) => (
            <div key={tip} title={tip} style={{
              minWidth: 26, height: 26, borderRadius: 13, padding: "0 7px",
              background: bg, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, gap: 3,
            }}>{val}</div>
          ))}
        </div>

        <div style={{
          background: timeWarn ? "#c62828" : "rgba(255,255,255,0.15)",
          borderRadius: 8, padding: "5px 14px",
          display: "flex", alignItems: "center", gap: 6,
          border: timeWarn ? "1px solid #ef9a9a" : "none",
          animation: timeWarn ? "pulseRed 1s ease-in-out infinite" : "none",
        }}>
          <style>{`@keyframes pulseRed{0%,100%{opacity:1}50%{opacity:0.7}}`}</style>
          <span style={{ fontSize: 14 }}>⏱</span>
          <span style={{ fontWeight: 800, fontSize: 17, fontFamily: "monospace", color: "#fff" }}>
            {fmt(timeLeft ?? 0)}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => doSubmit(false)}
            disabled={submitting}
            style={{
              padding: "6px 16px", borderRadius: 7, border: "none",
              background: "#fff", color: "#1a237e",
              fontWeight: 700, fontSize: 12, cursor: "pointer",
            }}>
            {submitting ? "Submitting…" : "Submit Exam"}
          </button>
        </div>
      </div>

      {/* Timer bar */}
      <div style={{ height: 3, background: "#c5cae9" }}>
        <div style={{
          width: `${timePct}%`, height: "100%",
          background: timeWarn ? "#c62828" : "#1de9b6",
          transition: "width 1s linear",
        }} />
      </div>

      {/* Skip review banner */}
      {inReview && (
        <div style={{
          background: "#fff3e0", borderBottom: "2px solid #fb8c00",
          padding: "8px 20px", display: "flex", alignItems: "center", gap: 8, fontSize: 13,
        }}>
          <span>🔄</span>
          <strong style={{ color: "#e65100" }}>Reviewing skipped — {reviewPos + 1} of {reviewQueue.length}</strong>
          <span style={{ color: "#888", fontSize: 12 }}>Answer or skip again before submitting</span>
        </div>
      )}

      {/* ── Two-column layout ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 14px", display: "flex", gap: 18, alignItems: "flex-start" }}>

        {/* ── LEFT ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: "#fff", borderRadius: 12,
            border: "1px solid #e0e0e0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}>
            {/* Question header */}
            <div style={{
              background: meta.light,
              borderBottom: `2px solid ${meta.color}30`,
              padding: "12px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{
                  background: meta.color, color: "#fff",
                  borderRadius: 6, padding: "3px 12px",
                  fontWeight: 700, fontSize: 13,
                }}>
                  Question {flatIdx + 1} / {totalQ}
                </span>
                {q?.difficulty && (
                  <span style={{
                    ...DIFF[q.difficulty],
                    borderRadius: 5, padding: "2px 9px",
                    fontSize: 11, fontWeight: 600,
                    border: `1px solid ${DIFF[q.difficulty]?.border}`,
                  }}>{q.difficulty}</span>
                )}
                {(q?.topic || q?.skill) && (
                  <span style={{ border: "1px solid #ccc", borderRadius: 5, padding: "2px 9px", fontSize: 11, color: "#555" }}>
                    {q.topic || q.skill}
                  </span>
                )}
                {skippedSet.has(flatIdx) && (
                  <span style={{ background: "#fff3e0", color: "#e65100", border: "1px solid #ffb74d", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>
                    ↩ Revisiting
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 11px", borderRadius: 20,
                background: meta.color + "18", color: meta.color,
              }}>{meta.label}</span>
            </div>

            {/* Question body */}
            <div style={{ padding: "22px 24px" }}>
              <p style={{ fontSize: 15, lineHeight: 1.8, fontWeight: 500, color: "#1a1a2e", marginBottom: 24, marginTop: 0, whiteSpace: "pre-wrap" }}>
                {q?.question}
              </p>

              {/* MCQ — 2 columns */}
              {type === "mcq" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {(q?.options || []).map((opt, j) => {
                    const lbl = String.fromCharCode(65 + j);
                    const sel = ans === opt;
                    return (
                      <label key={j} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                        border: `2px solid ${sel ? meta.color : "#e0e0e0"}`,
                        background: sel ? meta.light : "#fafafa",
                        transition: "all 0.15s",
                      }}>
                        <input type="radio" name={`q${flatIdx}`} value={opt} checked={sel}
                          onChange={() => setAnswers(p => ({ ...p, [flatIdx]: opt }))}
                          style={{ display: "none" }} />
                        <span style={{
                          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          background: sel ? meta.color : "#e8e8e8",
                          color: sel ? "#fff" : "#666",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 800, fontSize: 13,
                        }}>{lbl}</span>
                        <span style={{ fontSize: 14, color: "#222", lineHeight: 1.4 }}>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Subjective */}
              {type === "subjective" && (
                <>
                  <textarea rows={10}
                    placeholder="Write a detailed answer here…"
                    value={ans}
                    onChange={e => setAnswers(p => ({ ...p, [flatIdx]: e.target.value }))}
                    style={{
                      width: "100%", borderRadius: 10,
                      border: `2px solid ${ans.length > 20 ? meta.color + "80" : "#e0e0e0"}`,
                      padding: "13px 15px", fontSize: 14, lineHeight: 1.75,
                      resize: "vertical", outline: "none",
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: ans.length < 20 ? "#e65100" : "#2e7d32" }}>
                      {ans.length < 20 ? `Minimum 20 characters (${20 - ans.length} more needed)` : "✓ Good length"}
                    </span>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{ans.length} characters</span>
                  </div>
                </>
              )}

              {/* Coding */}
              {type === "coding" && (
                <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #3d3d5c" }}>
                  <div style={{ background: "#1e1e2e", padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                        <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                      ))}
                    </div>
                    <span style={{ color: "#f9a825", fontSize: 12, fontWeight: 700 }}>🔒 {q?.programming_language} only</span>
                  </div>
                  <textarea rows={13}
                    placeholder={`// Write your ${q?.programming_language} solution here`}
                    value={ans}
                    onChange={e => setAnswers(p => ({ ...p, [flatIdx]: e.target.value }))}
                    style={{
                      width: "100%", background: "#282a36",
                      border: "none", borderBottom: "1px solid #3d3d5c",
                      padding: "13px 16px", fontSize: 13,
                      fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
                      lineHeight: 1.9, resize: "vertical", outline: "none",
                      color: "#f8f8f2", boxSizing: "border-box",
                    }}
                  />
                  <div style={{ background: "#1e1e2e", padding: "8px 14px", display: "flex", gap: 8 }}>
                    <button
                      onClick={() => runCode(flatIdx, q?.programming_language)}
                      disabled={compiling[flatIdx] || !ans.trim()}
                      style={{
                        padding: "6px 16px", borderRadius: 6,
                        background: "#2e7d32", color: "#fff",
                        border: "none", fontWeight: 700, fontSize: 13,
                        cursor: "pointer", opacity: ans.trim() ? 1 : 0.45,
                      }}>
                      {compiling[flatIdx] ? "⟳ Running…" : "▶ Run Code"}
                    </button>
                  </div>
                  {compRes[flatIdx] && (() => {
                    const cr = compRes[flatIdx];
                    return (
                      <div style={{ background: "#13131f" }}>
                        <div style={{ padding: "6px 14px", borderTop: "1px solid #3d3d5c", display: "flex", gap: 8 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                            background: cr.status === "Accepted" ? "#1b5e20" : "#b71c1c", color: "#fff",
                          }}>{cr.status}</span>
                          {cr.time && <span style={{ fontSize: 11, color: "#999" }}>{cr.time}s</span>}
                        </div>
                        {cr.stdout && <div style={{ padding: "8px 14px" }}><pre style={{ margin: 0, fontSize: 12, color: "#a6e22e", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{cr.stdout}</pre></div>}
                        {(cr.stderr || cr.compile_output) && <div style={{ padding: "8px 14px" }}><pre style={{ margin: 0, fontSize: 12, color: "#f92672", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{cr.compile_output || cr.stderr}</pre></div>}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* ── Nav buttons ──────────────────────────────────────────── */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginTop: 14, gap: 10,
          }}>
            <button onClick={goPrev}
              disabled={inReview ? reviewPos === 0 : cursor === 0}
              style={{
                padding: "10px 22px", borderRadius: 8,
                border: "1.5px solid #ccc", background: "#fff",
                color: "#444", fontWeight: 600, fontSize: 13,
                cursor: "pointer",
                opacity: (inReview ? reviewPos === 0 : cursor === 0) ? 0.3 : 1,
              }}>← Previous</button>

            <button onClick={doSkip} style={{
              padding: "10px 22px", borderRadius: 8,
              border: "2px solid #fb8c00", background: "#fff8e1",
              color: "#e65100", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>Skip →</button>

            {showSubmit ? (
              <button onClick={() => doSubmit(false)} disabled={submitting} style={{
                padding: "10px 28px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg, #2e7d32, #388e3c)",
                color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: "pointer", boxShadow: "0 3px 12px rgba(46,125,50,0.4)",
              }}>{submitting ? "Submitting…" : "✓ Submit Exam"}</button>
            ) : (
              <button onClick={goNext} style={{
                padding: "10px 28px", borderRadius: 8, border: "none",
                background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
                color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: "pointer",
                boxShadow: `0 3px 12px ${meta.color}44`,
              }}>Save & Next →</button>
            )}
          </div>
        </div>

        {/* ── RIGHT ─────────────────────────────────────────────────── */}
        <RightSidebar
          total={totalQ}
          currentFlat={currentFlat}
          statusMap={statusMap}
          onJump={jumpTo}
          videoRef={proctor.videoRef}
          camReady={proctor.ready}
          camError={proctor.error}
          events={proctor.events}
        />
      </div>
    </div>
  );
}