

// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";

// // ─── Constants ────────────────────────────────────────────────────────────────
// const LOGO_URL = "https://storage.googleapis.com/zentree/images/logo-header-02.png";

// const PIPELINE_STAGES = [
//   { stage: "Screening",       count: 48, color: "#64748b" },
//   { stage: "Technical Round 1", count: 31, color: "#0369a1" },
//   { stage: "HR Round",        count: 19, color: "#c2410c" },
//   { stage: "Offer Stage",     count: 12, color: "#1d4ed8" },
//   { stage: "Offer Accepted",  count:  8, color: "#15803d" },
//   { stage: "Joined",          count:  5, color: "#14532d" },
// ];

// const MONTHLY_DATA = [
//   { month: "Aug", p: 18, t: 25 }, { month: "Sep", p: 22, t: 25 },
//   { month: "Oct", p: 20, t: 25 }, { month: "Nov", p: 28, t: 25 },
//   { month: "Dec", p: 24, t: 25 }, { month: "Jan", p: 31, t: 30 },
//   { month: "Feb", p: 27, t: 30 }, { month: "Mar", p: 35, t: 30 },
//   { month: "Apr", p: 38, t: 35 },
// ];

// const RECRUITERS = [
//   { name: "Priya Sharma", p: 24, rev: "₹18.2L", rate: 78, col: "#4f46e5" },
//   { name: "Rahul Nair",   p: 19, rev: "₹14.1L", rate: 65, col: "#0d9488" },
//   { name: "Ananya Iyer",  p: 17, rev: "₹12.8L", rate: 61, col: "#d97706" },
//   { name: "Kiran Reddy",  p: 14, rev: "₹10.5L", rate: 54, col: "#dc2626" },
// ];

// const CLIENT_REVENUE = [
//   { c: "TechCorp India",   rev: 4200000, p: 14, col: "#4f46e5" },
//   { c: "FinServ Pvt Ltd",  rev: 3100000, p: 11, col: "#1d4ed8" },
//   { c: "InfoSys Partner",  rev: 2800000, p:  9, col: "#0d9488" },
//   { c: "StartupHub",       rev: 1900000, p:  7, col: "#d97706" },
// ];

// const ACTIVITY_FEED = [
//   { e: "✅", t: "Placement confirmed — Ananya → TechCorp India",    time: "2m ago",  bg: "#f0fdf4", border: "#bbf7d0" },
//   { e: "📅", t: "Interview scheduled — Rahul K for HR Round",       time: "14m ago", bg: "#eff6ff", border: "#bfdbfe" },
//   { e: "💼", t: "New job posted — Senior SDE at FinServ Pvt Ltd",   time: "1h ago",  bg: "#fff7ed", border: "#fed7aa" },
//   { e: "👤", t: "Resume parsed — Vikram Malhotra added to pool",    time: "2h ago",  bg: "#f8fafc", border: "#e2e8f0" },
//   { e: "🏢", t: "New client onboarded — StartupHub, Bangalore",     time: "3h ago",  bg: "#faf5ff", border: "#e9d5ff" },
// ];

// const FEATURES = [
//   { icon: "👥", title: "Candidate Tracking",   desc: "Track every candidate through your pipeline with stage-wise visibility and real-time status updates.",               accent: "#4f46e5" },
//   { icon: "📋", title: "Smart Onboarding",     desc: "Paperless onboarding — BGV, documents, IT assets, bank details — all in one automated workflow.",                     accent: "#0d9488" },
//   { icon: "📊", title: "Analytics & Reports",  desc: "Real-time hiring metrics, recruiter performance and placement trends at a glance.",                                    accent: "#1d4ed8" },
//   { icon: "💼", title: "Job Management",       desc: "Post positions, map to clients and track fulfillment status — all without spreadsheets.",                              accent: "#d97706" },
//   { icon: "🤖", title: "AI-Graded Exams",      desc: "Auto-generate assessments, send exam links and receive AI-graded results with detailed scorecards.",                   accent: "#7c3aed" },
//   { icon: "🔔", title: "Smart Notifications",  desc: "Role-specific, targeted alerts keep every team member updated without inbox overload.",                                accent: "#dc2626" },
// ];

// const ROLES = [
//   { icon: "🛡️", title: "Admin",     desc: "Full control over users, roles and system-wide settings.",            accent: "#4f46e5" },
//   { icon: "📈", title: "Manager",   desc: "Approve decisions, review pipelines and track team KPIs.",             accent: "#d97706" },
//   { icon: "🔍", title: "Recruiter", desc: "Source, screen and move candidates through every hiring stage.",       accent: "#0d9488" },
//   { icon: "🤝", title: "HR",        desc: "Onboard employees, manage docs and run BGV end-to-end.",               accent: "#dc2626" },
// ];

// const STEPS = [
//   { n: "01", t: "Post a Job",          d: "Create job listings with required skills and map them to clients in seconds.",           col: "#1d4ed8" },
//   { n: "02", t: "Source Candidates",   d: "Add resumes, parse PDFs and auto-populate candidate profiles instantly.",                col: "#4f46e5" },
//   { n: "03", t: "Assess & Interview",  d: "Assign AI-graded exams, schedule interviews and capture structured feedback.",           col: "#0d9488" },
//   { n: "04", t: "Onboard & Place",     d: "Trigger the full onboarding checklist — BGV, IT, documents — all automated.",           col: "#d97706" },
// ];

// // ─── Inline Styles ────────────────────────────────────────────────────────────
// const GLOBAL_CSS = `
//   @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
//   *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
//   html { scroll-behavior: smooth; }
//   body { font-family: 'DM Sans', sans-serif; background: #f1f5f9; color: #0f172a; overflow-x: hidden; }

//   @keyframes heroIn { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:none; } }
//   @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
//   @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
//   @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
//   @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(9px)} }
//   @keyframes slideIn{ from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:none} }
//   @keyframes modalIn{ from{opacity:0;transform:scale(.93) translateY(18px)} to{opacity:1;transform:none} }
//   @keyframes spin   { to{transform:rotate(360deg)} }
//   @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }

//   .fade-up { opacity:0; transform:translateY(22px); transition:opacity .65s ease,transform .65s ease; }
//   .fade-up.vis { opacity:1; transform:none; }
//   .d1{transition-delay:.05s}.d2{transition-delay:.12s}.d3{transition-delay:.19s}
//   .d4{transition-delay:.26s}.d5{transition-delay:.33s}.d6{transition-delay:.40s}

//   .card-hover { transition:transform .28s,box-shadow .28s; }
//   .card-hover:hover { transform:translateY(-6px); box-shadow:0 20px 56px rgba(15,23,42,.1)!important; }

//   .nav-link { background:none; border:none; font-size:14px; font-weight:500; cursor:pointer;
//     font-family:'DM Sans',sans-serif; padding:4px; transition:color .2s; }
//   .btn-signin { background:linear-gradient(135deg,#1d4ed8,#4f46e5); color:#fff; border:none;
//     border-radius:10px; padding:9px 22px; font-size:13px; font-weight:700; cursor:pointer;
//     transition:all .2s; font-family:'DM Sans',sans-serif; }
//   .btn-signin:hover { opacity:.9; transform:translateY(-1px); box-shadow:0 8px 24px rgba(29,78,216,.45); }
//   .btn-primary { background:linear-gradient(135deg,#1d4ed8,#4f46e5); color:#fff; border:none;
//     border-radius:11px; padding:14px 36px; font-size:15px; font-weight:700; cursor:pointer;
//     transition:all .22s; font-family:'DM Sans',sans-serif; }
//   .btn-primary:hover { opacity:.92; transform:translateY(-2px); box-shadow:0 14px 36px rgba(29,78,216,.5); }
//   .btn-ghost { background:transparent; border:1.5px solid rgba(255,255,255,.3); color:#fff;
//     border-radius:11px; padding:14px 30px; font-size:14px; font-weight:600; cursor:pointer;
//     transition:all .2s; font-family:'DM Sans',sans-serif; }
//   .btn-ghost:hover { background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.55); }
//   .btn-demo { background:transparent; border:1.5px solid rgba(255,255,255,.28); color:#fff;
//     border-radius:11px; padding:14px 36px; font-size:14px; font-weight:600; cursor:pointer;
//     transition:all .2s; font-family:'DM Sans',sans-serif; }
//   .btn-demo:hover { background:rgba(255,255,255,.08); }
//   .btn-login-modal { width:100%; background:linear-gradient(135deg,#1d4ed8,#4f46e5); color:#fff;
//     border:none; border-radius:11px; padding:14px; font-size:14px; font-weight:700;
//     cursor:pointer; transition:all .22s; font-family:'DM Sans',sans-serif;
//     display:flex; align-items:center; justify-content:center; gap:10px; }
//   .btn-login-modal:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); box-shadow:0 10px 28px rgba(29,78,216,.45); }
//   .btn-login-modal:disabled { opacity:.7; cursor:not-allowed; }

//   .input-field { width:100%; padding:12px 14px 12px 42px; border:1.5px solid #e2e8f0;
//     border-radius:11px; font-size:14px; font-family:'DM Sans',sans-serif; color:#0f172a;
//     background:#fafafa; outline:none; transition:all .2s; }
//   .input-field:focus { border-color:#1d4ed8; background:#fff; box-shadow:0 0 0 3px rgba(29,78,216,.12); }

//   .modal-overlay { position:fixed; inset:0; z-index:2000; background:rgba(0,0,0,.75);
//     backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center;
//     padding:20px; opacity:0; pointer-events:none; transition:opacity .25s; }
//   .modal-overlay.open { opacity:1; pointer-events:all; }
//   .modal-box { background:#fff; border-radius:22px; width:100%; max-width:476px;
//     box-shadow:0 48px 100px rgba(0,0,0,.55); border:1px solid #e2e8f0; overflow:hidden;
//     transform:scale(.94) translateY(16px); transition:transform .28s cubic-bezier(.34,1.56,.64,1),opacity .25s;
//     opacity:0; }
//   .modal-overlay.open .modal-box { transform:scale(1) translateY(0); opacity:1; }

//   .hiw-step { display:flex; gap:16px; padding:15px 16px; border-radius:13px; cursor:pointer; transition:all .22s; }
//   .hiw-step:hover { background:#f1f5f9; transform:translateX(6px); }
//   .footer-link { font-size:13px; margin-bottom:11px; cursor:pointer; transition:color .2s; font-weight:300; color:rgba(255,255,255,.35); }
//   .footer-link:hover { color:rgba(255,255,255,.7); }
//   .role-pick-btn { padding:10px 4px; border-radius:10px; text-align:center; cursor:pointer;
//     border:1.5px solid #e2e8f0; background:#f8fafc; transition:all .18s; font-family:'DM Sans',sans-serif; }
//   .role-pick-btn:hover,.role-pick-btn.active { border-color:#1d4ed8; background:rgba(29,78,216,.06); }
//   .spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff;
//     border-radius:50%; animation:spin .7s linear infinite; }

//   ::-webkit-scrollbar { width:5px; }
//   ::-webkit-scrollbar-track { background:transparent; }
//   ::-webkit-scrollbar-thumb { background:rgba(29,78,216,.25); border-radius:4px; }
// `;

// // ─── Hooks ────────────────────────────────────────────────────────────────────
// const useInView = (threshold = 0.12) => {
//   const ref = useRef(null);
//   const [vis, setVis] = useState(false);
//   useEffect(() => {
//     const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
//     if (ref.current) obs.observe(ref.current);
//     return () => obs.disconnect();
//   }, [threshold]);
//   return [ref, vis];
// };

// const useCounter = (end, trigger) => {
//   const [count, setCount] = useState(0);
//   useEffect(() => {
//     if (!trigger) return;
//     let v = 0;
//     const step = end / 60;
//     const t = setInterval(() => {
//       v += step;
//       if (v >= end) { setCount(end); clearInterval(t); }
//       else setCount(Math.floor(v));
//     }, 20);
//     return () => clearInterval(t);
//   }, [trigger, end]);
//   return count;
// };

// // ─── AnimatedBar ──────────────────────────────────────────────────────────────
// const AnimatedBar = ({ value, max, color, delay = 0 }) => {
//   const [ref, vis] = useInView(0.1);
//   return (
//     <div ref={ref} style={{ height: 5, background: `${color}22`, borderRadius: 5, overflow: "hidden" }}>
//       <div style={{
//         height: "100%", background: color, borderRadius: 5,
//         width: vis ? `${(value / max) * 100}%` : "0%",
//         transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
//       }} />
//     </div>
//   );
// };

// // ─── Navbar ───────────────────────────────────────────────────────────────────
// const Navbar = ({ onSignIn }) => {
//   const [scrolled, setScrolled] = useState(false);
//   useEffect(() => {
//     const fn = () => setScrolled(window.scrollY > 60);
//     window.addEventListener("scroll", fn);
//     return () => window.removeEventListener("scroll", fn);
//   }, []);
//   const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
//   const navStyle = {
//     position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
//     height: 62, display: "flex", alignItems: "center", justifyContent: "space-between",
//     padding: "0 52px", transition: "all .3s",
//     background: scrolled ? "rgba(255,255,255,.97)" : "transparent",
//     backdropFilter: scrolled ? "blur(20px)" : "none",
//     borderBottom: scrolled ? "1px solid #e2e8f0" : "none",
//     boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,.06)" : "none",
//   };
//   return (
//     <nav style={navStyle}>
//       <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//         <img src={LOGO_URL} alt="ZentreeLabs" style={{ height: 32, filter: scrolled ? "none" : "brightness(0) invert(1)", transition: "filter .3s" }} onError={e => e.target.style.display = "none"} />
//         <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 800, color: scrolled ? "#0f172a" : "#fff", letterSpacing: "-.5px", transition: "color .3s" }}>
//           ZentreeLabs<span style={{ color: scrolled ? "#1d4ed8" : "#93c5fd" }}>Portal</span>
//         </span>
//       </div>
//       <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
//         {[["Features","features"],["Analytics","analytics"],["Roles","roles"],["How it Works","how-it-works"]].map(([label, id]) => (
//           <button key={id} className="nav-link" onClick={() => go(id)}
//             style={{ color: scrolled ? "#475569" : "rgba(255,255,255,.8)" }}>{label}</button>
//         ))}
//         <button className="btn-signin" onClick={onSignIn}>Sign In →</button>
//       </div>
//     </nav>
//   );
// };

// // ─── Hero ─────────────────────────────────────────────────────────────────────
// const Hero = ({ onSignIn }) => {
//   const [ref, vis] = useInView(0.1);
//   const count1 = useCounter(500, vis);
//   const count2 = useCounter(10000, vis);

//   return (
//     <section ref={ref} style={{ minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
//       {/* Background */}
//       <div style={{ position: "absolute", inset: 0 }}>
//         <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=90" alt="hero" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//         <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(5,14,31,.97) 0%,rgba(15,30,72,.9) 45%,rgba(8,15,26,.75) 100%)" }} />
//         <div style={{ position: "absolute", top: "10%", right: "6%", width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle,rgba(29,78,216,.18) 0%,transparent 70%)", pointerEvents: "none" }} />
//         <div style={{ position: "absolute", bottom: "15%", right: "25%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,.14) 0%,transparent 70%)", pointerEvents: "none" }} />
//       </div>

//       {/* Content */}
//       <div style={{ position: "relative", zIndex: 2, padding: "0 80px", maxWidth: 840, animation: "heroIn .9s ease forwards" }}>
//         <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
//           <span style={{ background: "rgba(29,78,216,.18)", border: "1px solid rgba(29,78,216,.4)", color: "#93c5fd", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, letterSpacing: ".06em" }}>🇮🇳 BUILT FOR INDIA</span>
//           <span style={{ background: "rgba(79,70,229,.15)", border: "1px solid rgba(79,70,229,.35)", color: "#c4b5fd", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, letterSpacing: ".06em" }}>✦ AI-POWERED</span>
//         </div>
//         <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(42px,5.5vw,68px)", lineHeight: 1.06, color: "#fff", letterSpacing: "-2.5px", marginBottom: 18, fontWeight: 800 }}>
//           India's Smartest<br />
//           <span style={{ background: "linear-gradient(90deg,#60a5fa,#818cf8,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Recruitment</span> Platform
//         </h1>
//         <p style={{ fontSize: 17, color: "rgba(255,255,255,.62)", lineHeight: 1.8, marginBottom: 36, maxWidth: 540, fontWeight: 300 }}>
//           From sourcing talent across India to onboarding new joiners — ZentreeLabs Portal automates your entire hiring pipeline with AI-powered intelligence.
//         </p>
//         <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 56 }}>
//           <button className="btn-primary" onClick={onSignIn}>Get Started Free →</button>
//           <button className="btn-ghost" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Explore Features</button>
//         </div>
//         {/* <div style={{ display: "flex", gap: 44, flexWrap: "wrap" }}>
//           {[{ n: count1, s: "+", l: "Companies" }, { n: count2, s: "+", l: "Hires Made" }, { n: 4, s: " Roles", l: "Supported" }, { n: 99, s: "%", l: "Uptime" }].map(({ n, s, l }) => (
//             <div key={l}>
//               <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 38, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-1.5px" }}>{n.toLocaleString()}{s}</div>
//               <div style={{ fontSize: 10, color: "rgba(255,255,255,.42)", marginTop: 4, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" }}>{l}</div>
//             </div>
//           ))}
//         </div> */}
//       </div>

//       {/* Floating dashboard card */}
//       <div style={{ position: "absolute", right: "4%", top: "50%", transform: "translateY(-50%)", width: 340, zIndex: 3, display: "flex", flexDirection: "column", gap: 14, animation: "floatA 5.5s ease-in-out infinite" }}>
//         <div style={{ background: "rgba(10,18,40,.88)", backdropFilter: "blur(24px)", borderRadius: 18, border: "1px solid rgba(255,255,255,.1)", padding: 20, boxShadow: "0 24px 64px rgba(0,0,0,.5)" }}>
//           <div style={{ height: 3, background: "linear-gradient(90deg,#1d4ed8,#4f46e5)", margin: "-20px -20px 16px", borderRadius: "18px 18px 0 0" }} />
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
//             {[{ n: "47", l: "Open Roles", c: "#60a5fa" }, { n: "1,284", l: "Candidates", c: "#818cf8" }, { n: "23", l: "Placed MTD", c: "#4ade80" }].map(s => (
//               <div key={s.l} style={{ textAlign: "center", padding: "10px 4px", background: "rgba(255,255,255,.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,.06)" }}>
//                 <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 800, color: s.c }}>{s.n}</div>
//                 <div style={{ fontSize: 9, color: "rgba(255,255,255,.42)", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", marginTop: 3 }}>{s.l}</div>
//               </div>
//             ))}
//           </div>
//           {PIPELINE_STAGES.slice(0, 4).map(p => (
//             <div key={p.stage} style={{ marginBottom: 8 }}>
//               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
//                 <span style={{ fontSize: 9, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>{p.stage}</span>
//                 <span style={{ fontSize: 9, fontWeight: 800, color: p.color }}>{p.count}</span>
//               </div>
//               <div style={{ height: 4, background: "rgba(255,255,255,.07)", borderRadius: 4 }}>
//                 <div style={{ height: "100%", width: `${(p.count / 48) * 100}%`, background: p.color, borderRadius: 4 }} />
//               </div>
//             </div>
//           ))}
//         </div>
//         <div style={{ background: "rgba(10,18,40,.88)", backdropFilter: "blur(24px)", borderRadius: 13, border: "1px solid rgba(21,128,61,.35)", padding: "13px 16px", display: "flex", gap: 10, alignItems: "center", boxShadow: "0 12px 40px rgba(0,0,0,.4)", animation: "floatB 4.5s 1.2s ease-in-out infinite" }}>
//           <div style={{ width: 34, height: 34, background: "rgba(21,128,61,.15)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✅</div>
//           <div>
//             <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Placement Confirmed</div>
//             <div style={{ fontSize: 10, color: "rgba(255,255,255,.42)", marginTop: 1 }}>Priya Sharma → TechCorp India · just now</div>
//           </div>
//           <div style={{ width: 8, height: 8, background: "#22c55e", borderRadius: "50%", flexShrink: 0, animation: "pulse 2s infinite", marginLeft: "auto" }} />
//         </div>
//       </div>
//       <div style={{ position: "absolute", bottom: 28, left: "50%", animation: "bounce 2.2s infinite", fontSize: 22, color: "rgba(255,255,255,.28)", zIndex: 2 }}>⌄</div>
//     </section>
//   );
// };

// // ─── Trust Bar ────────────────────────────────────────────────────────────────
// // const TrustBar = () => (
// //   <div style={{ background: "linear-gradient(90deg,#050e1f,#1e3a8a 50%,#050e1f)", padding: "11px 52px", display: "flex", gap: 20, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
// //     <span style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: ".15em", textTransform: "uppercase", fontWeight: 700 }}>Trusted Across India</span>
// //     {["Bangalore", "Hyderabad", "Mumbai", "Chennai", "Pune", "Delhi NCR"].map(c => (
// //       <span key={c} style={{ fontSize: 12, color: "rgba(255,255,255,.55)", fontWeight: 500 }}>📍 {c}</span>
// //     ))}
// //     {["SOC2", "GDPR", "ISO 27001"].map(c => <span key={c} style={{ fontSize: 10, color: "rgba(255,255,255,.28)" }}>· {c}</span>)}
// //   </div>
// // );

// // ─── Metrics Strip ────────────────────────────────────────────────────────────
// // const MetricsStrip = () => (
// //   <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "22px 60px" }}>
// //     <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", maxWidth: 880, margin: "0 auto" }}>
// //       {[{ icon: "💰", n: "₹12.4Cr", l: "Revenue Generated", col: "#4f46e5" },
// //         { icon: "⚡", n: "40%",     l: "Faster Time-to-Hire",  col: "#1d4ed8" },
// //         { icon: "🎯", n: "94%",     l: "Client Satisfaction",  col: "#0d9488" },
// //         { icon: "📈", n: "3.2×",    l: "ROI vs Manual Hiring", col: "#d97706" }].map((m, i) => (
// //         <div key={m.l} style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 28px", borderRight: i < 3 ? "1px solid #e2e8f0" : "none" }}>
// //           <div style={{ width: 42, height: 42, background: `${m.col}18`, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{m.icon}</div>
// //           <div>
// //             <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-.5px" }}>{m.n}</div>
// //             <div style={{ fontSize: 11, color: "#475569", fontWeight: 500, marginTop: 1 }}>{m.l}</div>
// //           </div>
// //         </div>
// //       ))}
// //     </div>
// //   </div>
// // );

// // ─── Section Header ───────────────────────────────────────────────────────────
// const SectionHeader = ({ badge, title, sub, dark }) => {
//   const [ref, vis] = useInView();
//   return (
//     <div ref={ref} className={`fade-up ${vis ? "vis" : ""}`} style={{ textAlign: "center", marginBottom: 56 }}>
//       <span style={{ display: "inline-block", background: dark ? "rgba(148,197,251,.1)" : "rgba(29,78,216,.08)", border: `1px solid ${dark ? "rgba(148,197,251,.2)" : "rgba(29,78,216,.2)"}`, color: dark ? "#93c5fd" : "#1d4ed8", borderRadius: 20, padding: "4px 16px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 14 }}>{badge}</span>
//       <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-1.5px", margin: "0 0 12px", color: dark ? "#fff" : "#0f172a", fontWeight: 800, lineHeight: 1.1 }}>{title}</h2>
//       <p style={{ fontSize: 15, color: dark ? "rgba(255,255,255,.5)" : "#475569", maxWidth: 450, margin: "0 auto", lineHeight: 1.8, fontWeight: 300 }}>{sub}</p>
//     </div>
//   );
// };

// // ─── Features ─────────────────────────────────────────────────────────────────
// const Features = () => {
//   const [ref, vis] = useInView();
//   return (
//     <section style={{ padding: "88px 60px", background: "#f1f5f9" }} id="features">
//       <SectionHeader badge="Platform Features" title={<>Everything your team needs,<br/>nothing they don't</>} sub="A complete recruitment ecosystem purpose-built for fast-growing Indian enterprises." />
//       <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
//         {FEATURES.map((f, i) => (
//           <div key={f.title} className={`card-hover fade-up d${i + 1} ${vis ? "vis" : ""}`}
//             style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, overflow: "hidden" }}>
//             <div style={{ height: 3, background: f.accent }} />
//             <div style={{ padding: "22px 20px" }}>
//               <div style={{ width: 44, height: 44, background: `${f.accent}18`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{f.icon}</div>
//               <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 7, color: "#0f172a", letterSpacing: "-.3px" }}>{f.title}</div>
//               <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, fontWeight: 300 }}>{f.desc}</div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// };

// // ─── Analytics ────────────────────────────────────────────────────────────────
// const Analytics = () => {
//   const maxP = Math.max(...MONTHLY_DATA.map(m => m.p));
//   const maxR = Math.max(...CLIENT_REVENUE.map(c => c.rev));
//   return (
//     <section style={{ padding: "88px 60px", background: "#050e1f" }} id="analytics">
//       <SectionHeader dark badge="Real-Time Analytics" title={<>Data-driven hiring,<br/>visible at a glance</>} sub="Dashboards that give every team member exactly the insight they need." />
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>

//         {/* Chart */}
//         <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 22 }}>
//           <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>📊 Monthly Placements vs Target</div>
//           <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 120, padding: "0 4px 8px" }}>
//             {MONTHLY_DATA.map(m => (
//               <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
//                 <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", position: "relative" }}>
//                   <div style={{ width: "100%", background: "#1d4ed8", opacity: .85, borderRadius: "4px 4px 0 0", height: `${(m.p / maxP) * 100}%`, minHeight: 4 }} />
//                   <div style={{ position: "absolute", left: 0, right: 0, bottom: `${(m.t / maxP) * 100}%`, height: 1.5, background: "rgba(251,191,36,.55)", borderTop: "1.5px dashed rgba(251,191,36,.55)" }} />
//                 </div>
//                 <span style={{ fontSize: 9, color: "rgba(255,255,255,.38)", fontWeight: 700 }}>{m.month}</span>
//               </div>
//             ))}
//           </div>
//           <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, background: "#1d4ed8", borderRadius: 2 }} /><span style={{ fontSize: 10, color: "rgba(255,255,255,.45)" }}>Placements</span></div>
//             <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 2, borderTop: "2px dashed rgba(251,191,36,.7)" }} /><span style={{ fontSize: 10, color: "rgba(255,255,255,.45)" }}>Target</span></div>
//           </div>
//         </div>

//         {/* Pipeline */}
//         <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 22 }}>
//           <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>🔄 Active Pipeline Stages</div>
//           {PIPELINE_STAGES.map((p, i) => (
//             <div key={p.stage} style={{ marginBottom: 10 }}>
//               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
//                 <span style={{ fontSize: 11, color: "rgba(255,255,255,.55)", fontWeight: 500 }}>{p.stage}</span>
//                 <span style={{ fontSize: 11, fontWeight: 800, color: p.color }}>{p.count}</span>
//               </div>
//               <AnimatedBar value={p.count} max={48} color={p.color} delay={i * 80} />
//             </div>
//           ))}
//         </div>

//         {/* Client Revenue */}
//         <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 22 }}>
//           <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>💰 Revenue by Client</div>
//           {CLIENT_REVENUE.map((c, i) => (
//             <div key={c.c} style={{ marginBottom: 12 }}>
//               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
//                 <span style={{ fontSize: 11, color: "rgba(255,255,255,.55)", fontWeight: 500 }}>{c.c}</span>
//                 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//                   <span style={{ fontSize: 9, color: "rgba(255,255,255,.3)" }}>{c.p} placed</span>
//                   <span style={{ fontSize: 11, fontWeight: 800, color: c.col }}>₹{(c.rev / 100000).toFixed(1)}L</span>
//                 </div>
//               </div>
//               <AnimatedBar value={c.rev} max={maxR} color={c.col} delay={i * 80} />
//             </div>
//           ))}
//         </div>

//         {/* Recruiter Perf */}
//         <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 22 }}>
//           <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>🏆 Recruiter Performance</div>
//           {RECRUITERS.map((r, i) => {
//             const init = r.name.split(" ").map(w => w[0]).join("");
//             return (
//               <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
//                 <div style={{ width: 30, height: 30, borderRadius: 8, background: r.col, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{init}</div>
//                 <div style={{ flex: 1 }}>
//                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
//                     <span style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600 }}>{r.name}</span>
//                     <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>{r.p} · {r.rev}</span>
//                   </div>
//                   <AnimatedBar value={r.rate} max={100} color={r.col} delay={i * 70} />
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Activity Feed */}
//       <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: "22px 26px" }}>
//         <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
//           ⚡ Live Activity Feed
//           <div style={{ width: 7, height: 7, background: "#22c55e", borderRadius: "50%", animation: "pulse 2s infinite", marginLeft: 4 }} />
//         </div>
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 9 }}>
//           {ACTIVITY_FEED.map((a, i) => (
//             <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,255,255,.03)", borderRadius: 11, padding: "10px 14px", border: "1px solid rgba(255,255,255,.05)", animation: `slideIn .4s ease ${i * 0.08}s both` }}>
//               <div style={{ width: 30, height: 30, background: a.bg, border: `1px solid ${a.border}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{a.e}</div>
//               <div>
//                 <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)", lineHeight: 1.5 }}>{a.t}</div>
//                 <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", marginTop: 2 }}>{a.time}</div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// // ─── Roles ────────────────────────────────────────────────────────────────────
// const Roles = () => {
//   const [ref, vis] = useInView();
//   return (
//     <section style={{ padding: "88px 60px", background: "#f1f5f9" }} id="roles">
//       <SectionHeader badge="Role-Based Access" title={<>Built for every person<br/>in your organisation</>} sub="Four tailored experiences, one unified platform." />
//       <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
//         {ROLES.map((r, i) => (
//           <div key={r.title} className={`card-hover fade-up d${i + 1} ${vis ? "vis" : ""}`}
//             style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, overflow: "hidden" }}>
//             <div style={{ height: 3, background: r.accent }} />
//             <div style={{ padding: "24px 20px" }}>
//               <div style={{ fontSize: 30, marginBottom: 14 }}>{r.icon}</div>
//               <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8, letterSpacing: "-.3px" }}>{r.title}</div>
//               <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, fontWeight: 300 }}>{r.desc}</div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// };

// // ─── How It Works ─────────────────────────────────────────────────────────────
// const HowItWorks = () => {
//   const [ref, vis] = useInView();
//   return (
//     <section style={{ padding: "88px 60px", background: "#fff" }} id="how-it-works">
//       <div ref={ref} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
//         <div style={{ position: "relative" }}>
//           <div style={{ borderRadius: 22, overflow: "hidden", height: 440 }}>
//             <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=85" alt="team" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
//             <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 60%,rgba(5,14,31,.25) 100%)", borderRadius: 22 }} />
//           </div>
//           <div style={{ position: "absolute", bottom: -20, left: 20, background: "#fff", borderRadius: 15, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", boxShadow: "0 20px 50px rgba(15,23,42,.14)", border: "1px solid #e2e8f0" }}>
//             <div style={{ width: 48, height: 48, background: "rgba(29,78,216,.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎯</div>
//             <div>
//               <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 800, color: "#0f172a", lineHeight: 1, letterSpacing: "-1px" }}>40%</div>
//               <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>Faster time-to-hire</div>
//             </div>
//           </div>
//         </div>
//         <div className={`fade-up ${vis ? "vis" : ""}`} style={{ transitionDelay: ".18s" }}>
//           <span style={{ display: "inline-block", background: "rgba(29,78,216,.08)", border: "1px solid rgba(29,78,216,.2)", color: "#1d4ed8", borderRadius: 20, padding: "4px 16px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 16 }}>How it works</span>
//           <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(28px,3.2vw,42px)", letterSpacing: "-1.2px", marginBottom: 8, color: "#0f172a", fontWeight: 800, lineHeight: 1.15 }}>From job posting<br/>to employee onboarding</h2>
//           <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.8, marginBottom: 28, fontWeight: 300 }}>ZentreeLabs Portal manages every step — no switching between tools, no missed follow-ups.</p>
//           <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
//             {STEPS.map(s => (
//               <div key={s.n} className="hiw-step">
//                 <div style={{ width: 40, height: 40, background: s.col, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0, fontFamily: "'Sora',sans-serif" }}>{s.n}</div>
//                 <div>
//                   <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4, fontFamily: "'Sora',sans-serif" }}>{s.t}</div>
//                   <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65, fontWeight: 300 }}>{s.d}</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// // ─── CTA ─────────────────────────────────────────────────────────────────────
// const CTA = ({ onSignIn }) => (
//   <section style={{ padding: "88px 60px", background: "#050e1f", textAlign: "center", position: "relative", overflow: "hidden" }}>
//     <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(29,78,216,.14) 0%,transparent 65%)", pointerEvents: "none" }} />
//     <div style={{ position: "relative", zIndex: 1 }}>
//       <span style={{ display: "inline-block", background: "rgba(29,78,216,.15)", border: "1px solid rgba(29,78,216,.3)", color: "#93c5fd", borderRadius: 20, padding: "4px 16px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 20 }}>Get Started Today</span>
//       <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(32px,4.2vw,54px)", letterSpacing: "-2px", marginBottom: 14, color: "#fff", fontWeight: 800, lineHeight: 1.08 }}>
//         Transform your recruitment<br />
//         <span style={{ background: "linear-gradient(90deg,#60a5fa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>process today.</span>
//       </h2>
//       <p style={{ fontSize: 16, color: "rgba(255,255,255,.48)", marginBottom: 40, fontWeight: 300, maxWidth: 400, margin: "0 auto 40px", lineHeight: 1.7 }}>
//       Hire smarter, faster, and better with the ZentreeLabs Recruitment Portal.
//       </p>
//       <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
//         <button className="btn-primary" style={{ padding: "15px 40px", fontSize: 15 }} onClick={onSignIn}>Start Free →</button>
//         {/* <button className="btn-demo">Book a Demo</button> */}
//       </div>
//     </div>
//   </section>
// );

// // ─── Footer ───────────────────────────────────────────────────────────────────
// const Footer = () => (
//   <footer style={{ background: "#030810", padding: "60px 60px 24px", color: "rgba(255,255,255,.35)" }}>
//     <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
//       <div>
//         <img src={LOGO_URL} alt="ZentreeLabs" style={{ height: 36, filter: "brightness(0) invert(1)", marginBottom: 10, opacity: .75 }} onError={e => e.target.style.display = "none"} />
//         <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,.8)", marginBottom: 10, letterSpacing: "-.5px" }}>ZentreeLabs<span style={{ color: "#1d4ed8" }}>Portal</span></div>
//         <p style={{ fontSize: 13, lineHeight: 1.8, maxWidth: 230, fontWeight: 300 }}>India's most complete recruitment management platform — built for speed, built to scale.</p>
//         <p style={{ fontSize: 12, marginTop: 14, color: "rgba(255,255,255,.22)" }}>📍 Gachibowli, Hyderabad, Telangana</p>
//       </div>
//       {[
//         { title: "Product",  links: ["Features", "Analytics", "Roles", "Pricing", "Changelog"] },
//         { title: "Company",  links: ["About Us", "Careers", "Blog", "Press", "Contact"] },
//         { title: "Support",  links: ["Help Centre", "Privacy Policy", "Terms", "Security", "Status"] },
//       ].map(col => (
//         <div key={col.title}>
//           <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,.65)", marginBottom: 18, letterSpacing: ".12em", textTransform: "uppercase" }}>{col.title}</div>
//           {col.links.map(l => <div key={l} className="footer-link">{l}</div>)}
//         </div>
//       ))}
//     </div>
//     <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 22, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
//       <span>© 2026 ZentreeLabs Pvt Ltd. All rights reserved.</span>
//       <span>🇮🇳 Proudly built in India</span>
//     </div>
//   </footer>
// );

// // ─── Login Modal ──────────────────────────────────────────────────────────────
// const LoginModal = ({ open, onClose }) => {
//   const [role, setRole]     = useState("Recruiter");
//   const [email, setEmail]   = useState("");
//   const [pass, setPass]     = useState("");
//   const [loading, setLoad]  = useState(false);
//   const [success, setOk]    = useState(false);
//   const [error, setErr]     = useState("");
//   const [showPass, setShowP] = useState(false);
//   const navigate = useNavigate();

//   const ROLE_ICONS = { Admin: "🛡️", Manager: "📈", Recruiter: "🔍", HR: "🤝" };

//   const handleLogin = async (e) => {
//     e?.preventDefault();
//     if (!email || !pass) { setErr("Email and password are required."); return; }
//     setErr(""); setLoad(true);
//     try {
//       const res  = await fetch(process.env.REACT_APP_API_LOGIN_URL || "/api/auth/login", {
//         method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
//         body: JSON.stringify({ email, password: pass }),
//       });
//       const data = await res.json();
//       if (data.success) {
//         localStorage.setItem("access_token",  data.access_token);
//         localStorage.setItem("refresh_token", data.refresh_token);
//         localStorage.setItem("user",          JSON.stringify(data.user));
//         setOk(true);
//         const r = data.user?.role;
//         setTimeout(() => {
//           const dest = r === "admin" ? "/admin/dashboard" : r === "manager" ? "/manager/dashboard" : r === "hr" ? "/hr/dashboard" : "/recruiter/dashboard";
//           navigate(dest);
//         }, 1400);
//       } else {
//         setErr(data.message || "Invalid credentials.");
//       }
//     } catch {
//       setErr("Network error. Please check your connection.");
//     } finally {
//       setLoad(false);
//     }
//   };

//   return (
//     <div className={`modal-overlay ${open ? "open" : ""}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//       <div className="modal-box">
//         <div style={{ height: 3, background: "linear-gradient(90deg,#1d4ed8,#4f46e5)" }} />
//         <div style={{ padding: "36px 38px 38px" }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
//             <div>
//               <img src={LOGO_URL} alt="ZentreeLabs" style={{ height: 28, marginBottom: 10 }} onError={e => e.target.style.display = "none"} />
//               <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-.5px" }}>Welcome back 👋</div>
//               <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>Sign in to your ZentreeLabs Portal account</div>
//             </div>
//             <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6 }}>✕</button>
//           </div>

//           {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "11px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✅ Login successful! Redirecting…</div>}
//           {error  && <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10, padding: "11px 14px", marginBottom: 14, fontSize: 13, color: "#dc2626" }}>⚠ {error}</div>}

//           <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>Select Your Role</div>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
//             {Object.keys(ROLE_ICONS).map(r => (
//               <button key={r} className={`role-pick-btn ${role === r ? "active" : ""}`} onClick={() => setRole(r)}>
//                 <div style={{ fontSize: 18, marginBottom: 4 }}>{ROLE_ICONS[r]}</div>
//                 <div style={{ fontSize: 11, fontWeight: 700, color: role === r ? "#1d4ed8" : "#475569" }}>{r}</div>
//               </button>
//             ))}
//           </div>

//           <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
//             <div style={{ position: "relative" }}>
//               <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#475569", pointerEvents: "none" }}>✉</span>
//               <input type="email" className="input-field" placeholder="you@zentreelabs.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
//             </div>
//             <div style={{ position: "relative" }}>
//               <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#475569", pointerEvents: "none" }}>🔒</span>
//               <input type={showPass ? "text" : "password"} className="input-field" placeholder="Enter your password" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" style={{ paddingRight: 46 }} />
//               <button type="button" onClick={() => setShowP(!showPass)} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 15 }}>{showPass ? "🙈" : "👁"}</button>
//             </div>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//               <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", cursor: "pointer" }}>
//                 <input type="checkbox" style={{ accentColor: "#1d4ed8" }} /> Remember me
//               </label>
//               <a href="#" style={{ fontSize: 13, color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}>Forgot password?</a>
//             </div>
//             <button type="submit" className="btn-login-modal" disabled={loading} style={{ marginTop: 4 }}>
//               {loading ? <><div className="spinner" />Signing in…</> : "Sign In to Dashboard →"}
//             </button>
//           </form>
//           <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#475569" }}>
//             Don't have an account? <a href="/register" style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}>Create Account</a>
//           </div>
//           <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(29,78,216,.05)", border: "1px dashed #bfdbfe", borderRadius: 10, fontSize: 11, color: "#475569" }}>
//             <strong>🔑 Password requirements:</strong> 8+ chars, 1 uppercase, 1 number
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─── Main Export ──────────────────────────────────────────────────────────────
// const LandingPage = () => {
//   const [loginOpen, setLoginOpen] = useState(false);
//   return (
//     <>
//       <style>{GLOBAL_CSS}</style>
//       <Navbar onSignIn={() => setLoginOpen(true)} />
//       <Hero onSignIn={() => setLoginOpen(true)} />
//       {/* <TrustBar />
//       <MetricsStrip /> */}
//       <Features />
//       <Analytics />
//       <Roles />
//       <HowItWorks />
//       <CTA onSignIn={() => setLoginOpen(true)} />
//       <Footer />
//       <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
//     </>
//   );
// };

// export default LandingPage;









import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  People, Assignment, BarChart, Work, Quiz, Notifications,
  Shield, TrendingUp, ManageSearch, Handshake,
  CheckCircle, CalendarToday, Person, Business, Bolt,
  MonetizationOn, Autorenew, EmojiEvents, TrackChanges,
  KeyboardArrowDown, GpsFixed, SmartToy, Flag,
  ArrowForward,
} from "@mui/icons-material";

// ─── Logo ─────────────────────────────────────────────────────────────────────
const LOGO_URL = "https://media.glassdoor.com/sqll/2558186/zentree-labs-squarelogo-1666871706420.png";

// ─── Data ─────────────────────────────────────────────────────────────────────
const PIPELINE_STAGES = [
  { stage: "Screening",         count: 48, color: "#64748b" },
  { stage: "Technical Round 1", count: 31, color: "#0369a1" },
  { stage: "HR Round",          count: 19, color: "#c2410c" },
  { stage: "Offer Stage",       count: 12, color: "#1d4ed8" },
  { stage: "Offer Accepted",    count:  8, color: "#15803d" },
  { stage: "Joined",            count:  5, color: "#14532d" },
];

const MONTHLY_DATA = [
  { month: "Aug", p: 18, t: 25 }, { month: "Sep", p: 22, t: 25 },
  { month: "Oct", p: 20, t: 25 }, { month: "Nov", p: 28, t: 25 },
  { month: "Dec", p: 24, t: 25 }, { month: "Jan", p: 31, t: 30 },
  { month: "Feb", p: 27, t: 30 }, { month: "Mar", p: 35, t: 30 },
  { month: "Apr", p: 38, t: 35 },
];

const RECRUITERS = [
  { name: "Priya Sharma", p: 24, rev: "₹18.2L", rate: 78, col: "#4f46e5" },
  { name: "Rahul Nair",   p: 19, rev: "₹14.1L", rate: 65, col: "#0d9488" },
  { name: "Ananya Iyer",  p: 17, rev: "₹12.8L", rate: 61, col: "#d97706" },
  { name: "Kiran Reddy",  p: 14, rev: "₹10.5L", rate: 54, col: "#dc2626" },
];

const CLIENT_REVENUE = [
  { c: "TechCorp India",  rev: 4200000, p: 14, col: "#4f46e5" },
  { c: "FinServ Pvt Ltd", rev: 3100000, p: 11, col: "#1d4ed8" },
  { c: "InfoSys Partner", rev: 2800000, p:  9, col: "#0d9488" },
  { c: "StartupHub",      rev: 1900000, p:  7, col: "#d97706" },
];

const ACTIVITY_FEED = [
  { Icon: CheckCircle,   iconCol: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", t: "Placement confirmed — Ananya → TechCorp India",   time: "2m ago"  },
  { Icon: CalendarToday, iconCol: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", t: "Interview scheduled — Rahul K for HR Round",       time: "14m ago" },
  { Icon: Work,          iconCol: "#d97706", bg: "#fff7ed", border: "#fed7aa", t: "New job posted — Senior SDE at FinServ Pvt Ltd",   time: "1h ago"  },
  { Icon: Person,        iconCol: "#475569", bg: "#f8fafc", border: "#e2e8f0", t: "Resume parsed — Vikram Malhotra added to pool",    time: "2h ago"  },
  { Icon: Business,      iconCol: "#6b21a8", bg: "#faf5ff", border: "#e9d5ff", t: "New client onboarded — StartupHub, Bangalore",     time: "3h ago"  },
];

const FEATURES = [
  { Icon: People,      title: "Candidate Tracking",  desc: "Track every candidate through your pipeline with stage-wise visibility and real-time status updates.",  accent: "#4f46e5" },
  { Icon: Assignment,  title: "Smart Onboarding",    desc: "Paperless onboarding — BGV, documents, IT assets, bank details — all in one automated workflow.",        accent: "#0d9488" },
  { Icon: BarChart,    title: "Analytics & Reports", desc: "Real-time hiring metrics, recruiter performance and placement trends at a glance.",                      accent: "#1d4ed8" },
  { Icon: Work,        title: "Job Management",      desc: "Post positions, map to clients and track fulfillment status — all without spreadsheets.",                accent: "#d97706" },
  { Icon: SmartToy,    title: "AI-Graded Exams",     desc: "Auto-generate assessments, send exam links and receive AI-graded results with detailed scorecards.",     accent: "#7c3aed" },
  { Icon: Notifications,title:"Smart Notifications", desc: "Role-specific, targeted alerts keep every team member updated without inbox overload.",                  accent: "#dc2626" },
];

const ROLES = [
  { Icon: Shield,       title: "Admin",     desc: "Full control over users, roles and system-wide settings.",           accent: "#4f46e5" },
  { Icon: TrendingUp,   title: "Manager",   desc: "Approve decisions, review pipelines and track team KPIs.",           accent: "#d97706" },
  { Icon: ManageSearch, title: "Recruiter", desc: "Source, screen and move candidates through every hiring stage.",     accent: "#0d9488" },
  { Icon: Handshake,    title: "HR",        desc: "Onboard employees, manage docs and run BGV end-to-end.",             accent: "#dc2626" },
];

const STEPS = [
  { n: "01", t: "Post a Job",         d: "Create job listings with required skills and map them to clients in seconds.",         col: "#1d4ed8" },
  { n: "02", t: "Source Candidates",  d: "Add resumes, parse PDFs and auto-populate candidate profiles instantly.",              col: "#4f46e5" },
  { n: "03", t: "Assess & Interview", d: "Assign AI-graded exams, schedule interviews and capture structured feedback.",         col: "#0d9488" },
  { n: "04", t: "Onboard & Place",    d: "Trigger the full onboarding checklist — BGV, IT, documents — all automated.",         col: "#d97706" },
];

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'DM Sans', sans-serif; background: #f1f5f9; color: #0f172a; overflow-x: hidden; }

  @keyframes heroIn { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:none; } }
  @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes floatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.55} }
  @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(9px)} }
  @keyframes slideIn{ from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:none} }
  @keyframes spin   { to{transform:rotate(360deg)} }

  .fade-up { opacity:0; transform:translateY(22px); transition:opacity .65s ease,transform .65s ease; }
  .fade-up.vis { opacity:1; transform:none; }
  .d1{transition-delay:.05s}.d2{transition-delay:.12s}.d3{transition-delay:.19s}
  .d4{transition-delay:.26s}.d5{transition-delay:.33s}.d6{transition-delay:.40s}

  .card-hover { transition:transform .28s,box-shadow .28s; cursor:pointer; }
  .card-hover:hover { transform:translateY(-6px); box-shadow:0 20px 56px rgba(15,23,42,.1)!important; }

  .nav-link { background:none; border:none; font-size:14px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; padding:4px; transition:color .2s; }
  .btn-signin { background:linear-gradient(135deg,#1d4ed8,#4f46e5); color:#fff; border:none; border-radius:10px; padding:9px 22px; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; font-family:'DM Sans',sans-serif; }
  .btn-signin:hover { opacity:.9; transform:translateY(-1px); box-shadow:0 8px 24px rgba(29,78,216,.45); }
  .btn-primary { background:linear-gradient(135deg,#1d4ed8,#4f46e5); color:#fff; border:none; border-radius:11px; padding:14px 36px; font-size:15px; font-weight:700; cursor:pointer; transition:all .22s; font-family:'DM Sans',sans-serif; }
  .btn-primary:hover { opacity:.92; transform:translateY(-2px); box-shadow:0 14px 36px rgba(29,78,216,.5); }
  .btn-ghost { background:transparent; border:1.5px solid rgba(255,255,255,.3); color:#fff; border-radius:11px; padding:14px 30px; font-size:14px; font-weight:600; cursor:pointer; transition:all .2s; font-family:'DM Sans',sans-serif; }
  .btn-ghost:hover { background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.6); }
  .hiw-step { display:flex; gap:16px; padding:15px 16px; border-radius:13px; cursor:pointer; transition:all .22s; }
  .hiw-step:hover { background:#f1f5f9; transform:translateX(6px); }
  .footer-link { font-size:13px; margin-bottom:11px; cursor:pointer; transition:color .2s; font-weight:300; color:rgba(255,255,255,.35); }
  .footer-link:hover { color:rgba(255,255,255,.7); }
  .role-pick-btn { padding:10px 4px; border-radius:10px; text-align:center; cursor:pointer; border:1.5px solid #e2e8f0; background:#f8fafc; transition:all .18s; font-family:'DM Sans',sans-serif; }
  .role-pick-btn:hover,.role-pick-btn.active { border-color:#1d4ed8; background:rgba(29,78,216,.06); }
  .input-field { width:100%; padding:12px 14px 12px 42px; border:1.5px solid #e2e8f0; border-radius:11px; font-size:14px; font-family:'DM Sans',sans-serif; color:#0f172a; background:#fafafa; outline:none; transition:all .2s; }
  .input-field:focus { border-color:#1d4ed8; background:#fff; box-shadow:0 0 0 3px rgba(29,78,216,.12); }
  .spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
  .modal-overlay { position:fixed; inset:0; z-index:2000; background:rgba(0,0,0,.75); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:20px; opacity:0; pointer-events:none; transition:opacity .25s; }
  .modal-overlay.open { opacity:1; pointer-events:all; }
  .modal-box { background:#fff; border-radius:22px; width:100%; max-width:476px; box-shadow:0 48px 100px rgba(0,0,0,.55); border:1px solid #e2e8f0; overflow:hidden; transform:scale(.94) translateY(16px); transition:transform .28s cubic-bezier(.34,1.56,.64,1),opacity .25s; opacity:0; max-height:92vh; overflow-y:auto; }
  .modal-overlay.open .modal-box { transform:scale(1) translateY(0); opacity:1; }
  .btn-login-modal { width:100%; background:linear-gradient(135deg,#1d4ed8,#4f46e5); color:#fff; border:none; border-radius:11px; padding:14px; font-size:14px; font-weight:700; cursor:pointer; transition:all .22s; font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:10px; }
  .btn-login-modal:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); box-shadow:0 10px 28px rgba(29,78,216,.45); }
  .btn-login-modal:disabled { opacity:.7; cursor:not-allowed; }
  ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(29,78,216,.25); border-radius:4px; }
`;

// ─── Hooks ────────────────────────────────────────────────────────────────────
const useInView = (threshold = 0.12) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
};

const useCounter = (end, trigger) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let v = 0; const step = end / 60;
    const t = setInterval(() => { v += step; if (v >= end) { setCount(end); clearInterval(t); } else setCount(Math.floor(v)); }, 20);
    return () => clearInterval(t);
  }, [trigger, end]);
  return count;
};

const AnimatedBar = ({ value, max, color, delay = 0 }) => {
  const [ref, vis] = useInView(0.1);
  return (
    <div ref={ref} style={{ height: 5, background: `${color}22`, borderRadius: 5, overflow: "hidden" }}>
      <div style={{ height: "100%", background: color, borderRadius: 5, width: vis ? `${(value / max) * 100}%` : "0%", transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${delay}ms` }} />
    </div>
  );
};

// ─── Logo Component — always visible ─────────────────────────────────────────
const Logo = ({ scrolled }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <img
      src={LOGO_URL}
      alt="ZentreeLabs"
      style={{ height: 36, width: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0, boxShadow: scrolled ? "none" : "0 2px 12px rgba(0,0,0,.3)" }}
      onError={e => e.target.style.display = "none"}
    />
    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 800, color: scrolled ? "#0f172a" : "#fff", letterSpacing: "-.5px", transition: "color .3s" }}>
      ZentreeLabs<span style={{ color: scrolled ? "#1d4ed8" : "#93c5fd" }}>Portal</span>
    </span>
  </div>
);

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ onSignIn }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, height: 62,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 52px", transition: "all .3s",
      background: scrolled ? "rgba(255,255,255,.97)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid #e2e8f0" : "none",
      boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,.06)" : "none",
    }}>
      <Logo scrolled={scrolled} />
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        {[["Features","features"],["Analytics","analytics"],["Roles","roles"],["How it Works","how-it-works"]].map(([label, id]) => (
          <button key={id} className="nav-link" onClick={() => go(id)}
            style={{ color: scrolled ? "#475569" : "rgba(255,255,255,.82)" }}>{label}</button>
        ))}
        <button className="btn-signin" onClick={onSignIn}>Sign In</button>
      </div>
    </nav>
  );
};

// ─── Hero ─────────────────────────────────────────────────────────────────────
const Hero = ({ onSignIn }) => {
  const [ref, vis] = useInView(0.1);
  const count1 = useCounter(500, vis);
  const count2 = useCounter(10000, vis);

  return (
    <section ref={ref} style={{ minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=90" alt="hero" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(5,14,31,.97) 0%,rgba(15,30,72,.9) 45%,rgba(8,15,26,.75) 100%)" }} />
        <div style={{ position: "absolute", top: "10%", right: "6%", width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle,rgba(29,78,216,.18) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "25%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,.14) 0%,transparent 70%)", pointerEvents: "none" }} />
      </div>

      <div style={{ position: "relative", zIndex: 2, padding: "0 80px", maxWidth: 840, animation: "heroIn .9s ease forwards" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
          <span style={{ background: "rgba(29,78,216,.18)", border: "1px solid rgba(29,78,216,.4)", color: "#93c5fd", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 5 }}>
            <Flag sx={{ fontSize: 13 }} /> BUILT FOR INDIA
          </span>
          <span style={{ background: "rgba(79,70,229,.15)", border: "1px solid rgba(79,70,229,.35)", color: "#c4b5fd", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 5 }}>
            <SmartToy sx={{ fontSize: 13 }} /> AI-POWERED
          </span>
        </div>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(42px,5.5vw,68px)", lineHeight: 1.06, color: "#fff", letterSpacing: "-2.5px", marginBottom: 18, fontWeight: 800 }}>
          India's Smartest<br />
          <span style={{ background: "linear-gradient(90deg,#60a5fa,#818cf8,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Recruitment</span> Platform
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,.62)", lineHeight: 1.8, marginBottom: 36, maxWidth: 540, fontWeight: 300 }}>
          From sourcing talent across India to onboarding new joiners — ZentreeLabs Portal automates your entire hiring pipeline with AI-powered intelligence.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 56 }}>
          <button className="btn-primary" onClick={onSignIn} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Get Started Free <ArrowForward sx={{ fontSize: 18 }} />
          </button>
          <button className="btn-ghost" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
            Explore Features
          </button>
        </div>
        {/* <div style={{ display: "flex", gap: 44, flexWrap: "wrap" }}>
          {[{ n: count1, s: "+", l: "Companies" }, { n: count2, s: "+", l: "Hires Made" }, { n: 4, s: " Roles", l: "Supported" }, { n: 99, s: "%", l: "Uptime" }].map(({ n, s, l }) => (
            <div key={l}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 38, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-1.5px" }}>{n.toLocaleString()}{s}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.42)", marginTop: 4, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" }}>{l}</div>
            </div>
          ))}
        </div> */}
      </div>

      {/* Floating Dashboard Card */}
      <div style={{ position: "absolute", right: "4%", top: "50%", transform: "translateY(-50%)", width: 340, zIndex: 3, display: "flex", flexDirection: "column", gap: 14, animation: "floatA 5.5s ease-in-out infinite" }}>
        <div style={{ background: "rgba(10,18,40,.88)", backdropFilter: "blur(24px)", borderRadius: 18, border: "1px solid rgba(255,255,255,.1)", padding: 20, boxShadow: "0 24px 64px rgba(0,0,0,.5)" }}>
          <div style={{ height: 3, background: "linear-gradient(90deg,#1d4ed8,#4f46e5)", margin: "-20px -20px 16px", borderRadius: "18px 18px 0 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {[{ n: "47", l: "Open Roles", c: "#60a5fa" }, { n: "1,284", l: "Candidates", c: "#818cf8" }, { n: "23", l: "Placed MTD", c: "#4ade80" }].map(s => (
              <div key={s.l} style={{ textAlign: "center", padding: "10px 4px", background: "rgba(255,255,255,.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 800, color: s.c }}>{s.n}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.42)", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>
          {PIPELINE_STAGES.slice(0, 4).map(p => (
            <div key={p.stage} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>{p.stage}</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: p.color }}>{p.count}</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,.07)", borderRadius: 4 }}>
                <div style={{ height: "100%", width: `${(p.count / 48) * 100}%`, background: p.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(10,18,40,.88)", backdropFilter: "blur(24px)", borderRadius: 13, border: "1px solid rgba(21,128,61,.35)", padding: "13px 16px", display: "flex", gap: 10, alignItems: "center", boxShadow: "0 12px 40px rgba(0,0,0,.4)", animation: "floatB 4.5s 1.2s ease-in-out infinite" }}>
          <div style={{ width: 32, height: 32, background: "rgba(21,128,61,.15)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle sx={{ fontSize: 18, color: "#4ade80" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Placement Confirmed</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.42)", marginTop: 1 }}>Priya Sharma → TechCorp India · just now</div>
          </div>
          <div style={{ width: 8, height: 8, background: "#22c55e", borderRadius: "50%", flexShrink: 0, animation: "pulse 2s infinite", marginLeft: "auto" }} />
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 28, left: "50%", animation: "bounce 2.2s infinite", zIndex: 2, color: "rgba(255,255,255,.28)" }}>
        <KeyboardArrowDown sx={{ fontSize: 32 }} />
      </div>
    </section>
  );
};

// ─── Trust Bar ────────────────────────────────────────────────────────────────
const TrustBar = () => (
  <div style={{ background: "linear-gradient(90deg,#050e1f,#1e3a8a 50%,#050e1f)", padding: "11px 52px", display: "flex", gap: 20, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
    <span style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: ".15em", textTransform: "uppercase", fontWeight: 700 }}>Trusted Across India</span>
    {["Bangalore", "Hyderabad", "Mumbai", "Chennai", "Pune", "Delhi NCR"].map(c => (
      <span key={c} style={{ fontSize: 12, color: "rgba(255,255,255,.55)", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
        <GpsFixed sx={{ fontSize: 11, color: "#60a5fa" }} /> {c}
      </span>
    ))}
    {["SOC2", "GDPR", "ISO 27001"].map(c => <span key={c} style={{ fontSize: 10, color: "rgba(255,255,255,.28)" }}>· {c}</span>)}
  </div>
);

// ─── Metrics Strip ────────────────────────────────────────────────────────────
const MetricsStrip = () => (
  <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "22px 60px" }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", maxWidth: 880, margin: "0 auto" }}>
      {[
        { Icon: MonetizationOn, n: "₹12.4Cr", l: "Revenue Generated", col: "#4f46e5" },
        { Icon: Bolt,           n: "40%",     l: "Faster Time-to-Hire",  col: "#1d4ed8" },
        { Icon: GpsFixed,       n: "94%",     l: "Client Satisfaction",  col: "#0d9488" },
        { Icon: TrendingUp,     n: "3.2×",    l: "ROI vs Manual Hiring", col: "#d97706" },
      ].map(({ Icon, n, l, col }, i) => (
        <div key={l} style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 28px", borderRight: i < 3 ? "1px solid #e2e8f0" : "none" }}>
          <div style={{ width: 42, height: 42, background: `${col}18`, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon sx={{ fontSize: 20, color: col }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-.5px" }}>{n}</div>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 500, marginTop: 1 }}>{l}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ badge, title, sub, dark }) => {
  const [ref, vis] = useInView();
  return (
    <div ref={ref} className={`fade-up ${vis ? "vis" : ""}`} style={{ textAlign: "center", marginBottom: 56 }}>
      <span style={{ display: "inline-block", background: dark ? "rgba(148,197,251,.1)" : "rgba(29,78,216,.08)", border: `1px solid ${dark ? "rgba(148,197,251,.2)" : "rgba(29,78,216,.2)"}`, color: dark ? "#93c5fd" : "#1d4ed8", borderRadius: 20, padding: "4px 16px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 14 }}>{badge}</span>
      <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(30px,4vw,46px)", letterSpacing: "-1.5px", margin: "0 0 12px", color: dark ? "#fff" : "#0f172a", fontWeight: 800, lineHeight: 1.1 }}>{title}</h2>
      <p style={{ fontSize: 15, color: dark ? "rgba(255,255,255,.5)" : "#475569", maxWidth: 450, margin: "0 auto", lineHeight: 1.8, fontWeight: 300 }}>{sub}</p>
    </div>
  );
};

// ─── Features ─────────────────────────────────────────────────────────────────
const Features = () => {
  const [ref, vis] = useInView();
  return (
    <section style={{ padding: "88px 60px", background: "#f1f5f9" }} id="features">
      <SectionHeader badge="Platform Features" title={<>Everything your team needs,<br />nothing they don't</>} sub="A complete recruitment ecosystem purpose-built for fast-growing Indian enterprises." />
      <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
        {FEATURES.map(({ Icon, title, desc, accent }, i) => (
          <div key={title} className={`card-hover fade-up d${i + 1} ${vis ? "vis" : ""}`}
            style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, overflow: "hidden" }}>
            <div style={{ height: 3, background: accent }} />
            <div style={{ padding: "22px 20px" }}>
              <div style={{ width: 44, height: 44, background: `${accent}18`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Icon sx={{ fontSize: 22, color: accent }} />
              </div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 7, color: "#0f172a", letterSpacing: "-.3px" }}>{title}</div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, fontWeight: 300 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ─── Analytics ────────────────────────────────────────────────────────────────
const Analytics = () => {
  const maxP = Math.max(...MONTHLY_DATA.map(m => m.p));
  const maxR = Math.max(...CLIENT_REVENUE.map(c => c.rev));
  return (
    <section style={{ padding: "88px 60px", background: "#050e1f" }} id="analytics">
      <SectionHeader dark badge="Real-Time Analytics" title={<>Data-driven hiring,<br />visible at a glance</>} sub="Dashboards that give every team member exactly the insight they need." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>

        {/* Chart */}
        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 22 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <BarChart sx={{ fontSize: 16, color: "#60a5fa" }} /> Monthly Placements vs Target
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 120, padding: "0 4px 8px" }}>
            {MONTHLY_DATA.map(m => (
              <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", position: "relative" }}>
                  <div style={{ width: "100%", background: "#1d4ed8", opacity: .85, borderRadius: "4px 4px 0 0", height: `${(m.p / maxP) * 100}%`, minHeight: 4 }} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: `${(m.t / maxP) * 100}%`, height: 1.5, background: "rgba(251,191,36,.55)", borderTop: "1.5px dashed rgba(251,191,36,.55)" }} />
                </div>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,.38)", fontWeight: 700 }}>{m.month}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, background: "#1d4ed8", borderRadius: 2 }} /><span style={{ fontSize: 10, color: "rgba(255,255,255,.45)" }}>Placements</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 2, borderTop: "2px dashed rgba(251,191,36,.7)" }} /><span style={{ fontSize: 10, color: "rgba(255,255,255,.45)" }}>Target</span></div>
          </div>
        </div>

        {/* Pipeline */}
        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 22 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Autorenew sx={{ fontSize: 16, color: "#60a5fa" }} /> Active Pipeline Stages
          </div>
          {PIPELINE_STAGES.map((p, i) => (
            <div key={p.stage} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.55)", fontWeight: 500 }}>{p.stage}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: p.color }}>{p.count}</span>
              </div>
              <AnimatedBar value={p.count} max={48} color={p.color} delay={i * 80} />
            </div>
          ))}
        </div>

        {/* Revenue */}
        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 22 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <MonetizationOn sx={{ fontSize: 16, color: "#60a5fa" }} /> Revenue by Client
          </div>
          {CLIENT_REVENUE.map((c, i) => (
            <div key={c.c} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.55)", fontWeight: 500 }}>{c.c}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,.3)" }}>{c.p} placed</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: c.col }}>₹{(c.rev / 100000).toFixed(1)}L</span>
                </div>
              </div>
              <AnimatedBar value={c.rev} max={maxR} color={c.col} delay={i * 80} />
            </div>
          ))}
        </div>

        {/* Recruiter Perf */}
        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 22 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <EmojiEvents sx={{ fontSize: 16, color: "#fbbf24" }} /> Recruiter Performance
          </div>
          {RECRUITERS.map((r, i) => {
            const init = r.name.split(" ").map(w => w[0]).join("");
            return (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: r.col, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{init}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600 }}>{r.name}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>{r.p} · {r.rev}</span>
                  </div>
                  <AnimatedBar value={r.rate} max={100} color={r.col} delay={i * 70} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Feed */}
      <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: "22px 26px" }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Bolt sx={{ fontSize: 18, color: "#fbbf24" }} /> Live Activity Feed
          <div style={{ width: 7, height: 7, background: "#22c55e", borderRadius: "50%", animation: "pulse 2s infinite", marginLeft: 4 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 9 }}>
          {ACTIVITY_FEED.map(({ Icon, iconCol, bg, border, t, time }, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,255,255,.03)", borderRadius: 11, padding: "10px 14px", border: "1px solid rgba(255,255,255,.05)", animation: `slideIn .4s ease ${i * 0.08}s both` }}>
              <div style={{ width: 30, height: 30, background: bg, border: `1px solid ${border}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon sx={{ fontSize: 15, color: iconCol }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)", lineHeight: 1.5 }}>{t}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", marginTop: 2 }}>{time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Roles ────────────────────────────────────────────────────────────────────
const Roles = () => {
  const [ref, vis] = useInView();
  return (
    <section style={{ padding: "88px 60px", background: "#f1f5f9" }} id="roles">
      <SectionHeader badge="Role-Based Access" title={<>Built for every person<br />in your organisation</>} sub="Four tailored experiences, one unified platform." />
      <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
        {ROLES.map(({ Icon, title, desc, accent }, i) => (
          <div key={title} className={`card-hover fade-up d${i + 1} ${vis ? "vis" : ""}`}
            style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, overflow: "hidden" }}>
            <div style={{ height: 3, background: accent }} />
            <div style={{ padding: "24px 20px" }}>
              <div style={{ width: 48, height: 48, background: `${accent}15`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Icon sx={{ fontSize: 26, color: accent }} />
              </div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8, letterSpacing: "-.3px" }}>{title}</div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, fontWeight: 300 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ─── How It Works ─────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const [ref, vis] = useInView();
  return (
    <section style={{ padding: "88px 60px", background: "#fff" }} id="how-it-works">
      <div ref={ref} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <div style={{ borderRadius: 22, overflow: "hidden", height: 440 }}>
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=85" alt="team" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 60%,rgba(5,14,31,.25) 100%)", borderRadius: 22 }} />
          </div>
          <div style={{ position: "absolute", bottom: -20, left: 20, background: "#fff", borderRadius: 15, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", boxShadow: "0 20px 50px rgba(15,23,42,.14)", border: "1px solid #e2e8f0" }}>
            <div style={{ width: 48, height: 48, background: "rgba(29,78,216,.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrackChanges sx={{ fontSize: 26, color: "#1d4ed8" }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 800, color: "#0f172a", lineHeight: 1, letterSpacing: "-1px" }}>40%</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>Faster time-to-hire</div>
            </div>
          </div>
        </div>
        <div className={`fade-up ${vis ? "vis" : ""}`} style={{ transitionDelay: ".18s" }}>
          <span style={{ display: "inline-block", background: "rgba(29,78,216,.08)", border: "1px solid rgba(29,78,216,.2)", color: "#1d4ed8", borderRadius: 20, padding: "4px 16px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 16 }}>How it works</span>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(28px,3.2vw,42px)", letterSpacing: "-1.2px", marginBottom: 8, color: "#0f172a", fontWeight: 800, lineHeight: 1.15 }}>From job posting<br />to employee onboarding</h2>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.8, marginBottom: 28, fontWeight: 300 }}>ZentreeLabs Portal manages every step — no switching between tools, no missed follow-ups.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {STEPS.map(s => (
              <div key={s.n} className="hiw-step">
                <div style={{ width: 40, height: 40, background: s.col, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0, fontFamily: "'Sora',sans-serif" }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4, fontFamily: "'Sora',sans-serif" }}>{s.t}</div>
                  <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65, fontWeight: 300 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── CTA ─────────────────────────────────────────────────────────────────────
const CTA = ({ onSignIn }) => (
  <section style={{ padding: "88px 60px", background: "#050e1f", textAlign: "center", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(29,78,216,.14) 0%,transparent 65%)", pointerEvents: "none" }} />
    <div style={{ position: "relative", zIndex: 1 }}>
      <span style={{ display: "inline-block", background: "rgba(29,78,216,.15)", border: "1px solid rgba(29,78,216,.3)", color: "#93c5fd", borderRadius: 20, padding: "4px 16px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 20 }}>Get Started Today</span>
      <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(32px,4.2vw,54px)", letterSpacing: "-2px", marginBottom: 14, color: "#fff", fontWeight: 800, lineHeight: 1.08 }}>
        Transform your recruitment<br />
        <span style={{ background: "linear-gradient(90deg,#60a5fa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>process today.</span>
      </h2>
      <p style={{ fontSize: 16, color: "rgba(255,255,255,.48)", fontWeight: 300, maxWidth: 400, margin: "0 auto 40px", lineHeight: 1.7 }}>
        Hire smarter, faster, and better with the ZentreeLabs Recruitment Portal.
      </p>
      <button className="btn-primary" style={{ padding: "15px 40px", fontSize: 15, display: "inline-flex", alignItems: "center", gap: 8 }} onClick={onSignIn}>
        Start Free <ArrowForward sx={{ fontSize: 18 }} />
      </button>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer style={{ background: "#030810", padding: "60px 60px 24px", color: "rgba(255,255,255,.35)" }}>
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <img src={LOGO_URL} alt="ZentreeLabs" style={{ height: 36, width: 36, borderRadius: 8, objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,.8)", letterSpacing: "-.5px" }}>
            ZentreeLabs<span style={{ color: "#1d4ed8" }}>Portal</span>
          </div>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.8, maxWidth: 230, fontWeight: 300 }}>India's most complete recruitment management platform — built for speed, built to scale.</p>
        <p style={{ fontSize: 12, marginTop: 14, color: "rgba(255,255,255,.22)", display: "flex", alignItems: "center", gap: 4 }}>
          <GpsFixed sx={{ fontSize: 13, color: "#60a5fa" }} /> Gachibowli, Hyderabad, Telangana
        </p>
      </div>
      {[
        { title: "Product",  links: ["Features", "Analytics", "Roles", "Pricing", "Changelog"] },
        { title: "Company",  links: ["About Us", "Careers", "Blog", "Press", "Contact"] },
        { title: "Support",  links: ["Help Centre", "Privacy Policy", "Terms", "Security", "Status"] },
      ].map(col => (
        <div key={col.title}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,.65)", marginBottom: 18, letterSpacing: ".12em", textTransform: "uppercase" }}>{col.title}</div>
          {col.links.map(l => <div key={l} className="footer-link">{l}</div>)}
        </div>
      ))}
    </div>
    <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 22, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
      <span>© 2026 ZentreeLabs Pvt Ltd. All rights reserved.</span>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Flag sx={{ fontSize: 14, color: "#60a5fa" }} /> Proudly built in India</span>
    </div>
  </footer>
);

// ─── Login Modal ──────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { key: "Admin",     Icon: Shield,       col: "#4f46e5" },
  { key: "Manager",   Icon: TrendingUp,   col: "#d97706" },
  { key: "Recruiter", Icon: ManageSearch, col: "#0d9488" },
  { key: "HR",        Icon: Handshake,    col: "#dc2626" },
];

const LoginModal = ({ open, onClose }) => {
  const [role, setRole]      = useState("Recruiter");
  const [email, setEmail]    = useState("");
  const [pass, setPass]      = useState("");
  const [loading, setLoad]   = useState(false);
  const [success, setOk]     = useState(false);
  const [error, setErr]      = useState("");
  const [showPass, setShowP] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !pass) { setErr("Email and password are required."); return; }
    setErr(""); setLoad(true);
    try {
      const res  = await fetch(process.env.REACT_APP_API_LOGIN_URL || "/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("access_token",  data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("user",          JSON.stringify(data.user));
        setOk(true);
        const r = data.user?.role;
        setTimeout(() => {
          navigate(r === "admin" ? "/admin/dashboard" : r === "manager" ? "/manager/dashboard" : r === "hr" ? "/hr/dashboard" : "/recruiter/dashboard");
        }, 1400);
      } else { setErr(data.message || "Invalid credentials."); }
    } catch { setErr("Network error. Please check your connection."); }
    finally { setLoad(false); }
  };

  return (
    <div className={`modal-overlay ${open ? "open" : ""}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div style={{ height: 3, background: "linear-gradient(90deg,#1d4ed8,#4f46e5)" }} />
        <div style={{ padding: "36px 38px 38px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <img src={LOGO_URL} alt="ZentreeLabs" style={{ height: 28, width: 28, borderRadius: 6, objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: "#0f172a" }}>ZentreeLabs<span style={{ color: "#1d4ed8" }}>Portal</span></span>
              </div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-.5px" }}>Welcome back</div>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>Sign in to your ZentreeLabs Portal account</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6 }}>✕</button>
          </div>

          {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "11px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#16a34a", fontWeight: 600 }}><CheckCircle sx={{ fontSize: 16 }} /> Login successful! Redirecting…</div>}
          {error  && <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 10, padding: "11px 14px", marginBottom: 14, fontSize: 13, color: "#dc2626" }}>⚠ {error}</div>}

          <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>Select Your Role</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
            {ROLE_OPTIONS.map(({ key, Icon: RIcon, col }) => (
              <button key={key} className={`role-pick-btn ${role === key ? "active" : ""}`} onClick={() => setRole(key)}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>
                  <RIcon sx={{ fontSize: 20, color: role === key ? col : "#94a3b8" }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: role === key ? col : "#475569" }}>{key}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                <Person sx={{ fontSize: 17 }} />
              </span>
              <input type="email" className="input-field" placeholder="you@zentreelabs.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                <Shield sx={{ fontSize: 17 }} />
              </span>
              <input type={showPass ? "text" : "password"} className="input-field" placeholder="Enter your password" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" style={{ paddingRight: 46 }} />
              <button type="button" onClick={() => setShowP(!showPass)} style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}>
                {showPass
                  ? <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", cursor: "pointer" }}>
                <input type="checkbox" style={{ accentColor: "#1d4ed8" }} /> Remember me
              </label>
              <a href="#" style={{ fontSize: 13, color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}>Forgot password?</a>
            </div>
            <button type="submit" className="btn-login-modal" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="spinner" /> Signing in…</> : <>Sign In to Dashboard <ArrowForward sx={{ fontSize: 16 }} /></>}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#475569" }}>
            Don't have an account?{" "}
            <a href="/register" style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}>Create Account</a>
          </div>
          <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(29,78,216,.05)", border: "1px dashed #bfdbfe", borderRadius: 10, fontSize: 11, color: "#475569" }}>
            <strong>Password requirements:</strong> 8+ chars, 1 uppercase, 1 number
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
const LandingPage = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Navbar onSignIn={() => setLoginOpen(true)} />
      <Hero onSignIn={() => setLoginOpen(true)} />
      {/* <TrustBar />
      <MetricsStrip /> */}
      <Features />
      <Analytics />
      <Roles />
      <HowItWorks />
      <CTA onSignIn={() => setLoginOpen(true)} />
      <Footer />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
};

export default LandingPage;