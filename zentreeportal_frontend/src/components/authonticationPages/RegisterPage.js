





// import React, { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";

// const API_URL = process.env.REACT_APP_API_REGISTER_URL;

// const ROLES = [
//   { value: "admin",     label: "Admin",     desc: "Full system access" },
//   { value: "recruiter", label: "Recruiter", desc: "Manage jobs & candidates" },
//   { value: "manager",   label: "Manager",   desc: "Approve hires & manage team" },
//   { value: "hr",        label: "HR",        desc: "Onboarding & employee lifecycle" }, 
// ];

// const validate = (form) => {
//   const errs = {};
//   if (!form.first_name.trim()) errs.first_name = "First name is required";
//   if (!form.last_name.trim())  errs.last_name  = "Last name is required";

//   if (!form.email.trim())      errs.email = "Email is required";
//   else if (!/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(form.email)) errs.email = "Invalid email format";

//   if (!form.password)                    errs.password = "Password is required";
//   else if (form.password.length < 8)     errs.password = "At least 8 characters";
//   else if (!/[A-Z]/.test(form.password)) errs.password = "Must include an uppercase letter";
//   else if (!/[0-9]/.test(form.password)) errs.password = "Must include a number";

//   if (!form.confirm_password)                        errs.confirm_password = "Please confirm your password";
//   else if (form.password !== form.confirm_password)  errs.confirm_password = "Passwords do not match";

//   if (!form.role) errs.role = "Please select a role";

//   if (form.phone.trim() && !/^\+?[1-9]\d{6,14}$/.test(form.phone.trim()))
//     errs.phone = "Invalid phone number (e.g. +919876543210)";

//   return errs;
// };

// /* ── tiny SVG icons ─────────────────────────────────────────────────────── */
// const IconPerson = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
//     <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
//     <circle cx="12" cy="7" r="4"/>
//   </svg>
// );
// const IconEmail = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
//     <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
//     <polyline points="22,6 12,13 2,6"/>
//   </svg>
// );
// const IconPhone = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
//     <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.08 4.18 2 2 0 0 1 5.09 2h3a2 2 0 0 1 2 1.72c.13 1 .37 1.97.72 2.91a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.17-1.17a2 2 0 0 1 2.11-.45c.94.35 1.91.59 2.91.72A2 2 0 0 1 22 16.92z"/>
//   </svg>
// );
// const IconLock = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
//     <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
//     <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
//   </svg>
// );
// const IconEye = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
//     <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
//     <circle cx="12" cy="12" r="3"/>
//   </svg>
// );
// const IconEyeOff = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
//     <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
//     <line x1="1" y1="1" x2="23" y2="23"/>
//   </svg>
// );
// const IconCheck = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
//     <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
//     <polyline points="22 4 12 14.01 9 11.01"/>
//   </svg>
// );
// const IconAlert = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
//     <circle cx="12" cy="12" r="10"/>
//     <line x1="12" y1="8" x2="12" y2="12"/>
//     <line x1="12" y1="16" x2="12.01" y2="16"/>
//   </svg>
// );
// const IconClose = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
//     <line x1="18" y1="6" x2="6" y2="18"/>
//     <line x1="6" y1="6" x2="18" y2="18"/>
//   </svg>
// );
// const IconUserPlus = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="30" height="30">
//     <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
//     <circle cx="8.5" cy="7" r="4"/>
//     <line x1="20" y1="8" x2="20" y2="14"/>
//     <line x1="23" y1="11" x2="17" y2="11"/>
//   </svg>
// );

// /* ── Field helper ────────────────────────────────────────────────────────── */
// const Field = ({ label, name, type = "text", value, onChange, error, helperText, icon, end }) => (
//   <div className="form-group">
//     <label htmlFor={name}>{label}</label>
//     <div className="input-with-icon">
//       {icon}
//       <input
//         id={name}
//         name={name}
//         type={type}
//         value={value}
//         onChange={onChange}
//         className={error ? "input-error" : ""}
//         autoComplete={name}
//       />
//       {end}
//     </div>
//     {(error || helperText) && (
//       <span className={error ? "field-error" : "field-hint"}>{error || helperText}</span>
//     )}
//   </div>
// );

// /* ── Component ───────────────────────────────────────────────────────────── */
// const RegisterPage = () => {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     first_name: "", last_name: "", email: "",
//     password: "", confirm_password: "", role: "", phone: "",
//   });

//   const [errors, setErrors]           = useState({});
//   const [showPass, setShowPass]       = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [loading, setLoading]         = useState(false);
//   const [apiError, setApiError]       = useState("");
//   const [success, setSuccess]         = useState(false);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm(p => ({ ...p, [name]: value }));
//     if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
//     setApiError("");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const errs = validate(form);
//     if (Object.keys(errs).length) { setErrors(errs); return; }

//     setLoading(true);
//     setApiError("");
//     try {
//       const { confirm_password, phone, ...rest } = form;
//       const payload = { ...rest, phone: phone.trim() || null };

//       const response = await fetch(`${API_URL}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await response.json();

//       if (!response.ok || !data.success) {
//         setApiError(data.message || "Registration failed");
//         return;
//       }
//       setSuccess(true);
//       setTimeout(() => navigate("/login"), 2000);
//     } catch {
//       setApiError("Network error. Please check your connection.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="register-page">
//       <div className="register-container">

//         {/* ── Left – Branding ── */}
//         <div className="login-branding">
//           <div className="branding-content">
//             <div className="brand-logo">
//               <div className="logo-icon">
//                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
//                   <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
//                   <circle cx="9" cy="7" r="4"/>
//                   <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
//                   <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
//                 </svg>
//               </div>
//               <div className="logo-text">
//                 <span className="logo-name">ZentreeLabs</span>
//                 <span className="logo-tagline">Portal</span>
//               </div>
//             </div>

//             <div className="branding-hero">
//               <h1>Start Managing Recruitment Today</h1>
//               <p>Create your account and get instant access to our end-to-end recruitment management platform.</p>
//             </div>

//             <div className="feature-list">
//               {[
//                 "Role-based access control",
//                 "Candidate pipeline management",
//                 "Client & billing management",
//                 "Real-time reports & analytics",
//               ].map(feat => (
//                 <div className="feature-item" key={feat}>
//                   <div className="feature-icon"><IconCheck /></div>
//                   <span>{feat}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="branding-footer">
//             <p>© 2026 ZentreeLabs Pvt Ltd. All rights reserved.</p>
//           </div>
//         </div>

//         {/* ── Right – Register Form ── */}
//         <div className="login-form-container">
//           <div className="login-form-wrapper">

//             <div className="form-header">
//               <div className="form-avatar"><IconUserPlus /></div>
//               <h2>Create Account</h2>
//               <p>Join ZentreeLabs Portal with your role</p>
//             </div>

//             {success && (
//               <div className="success-alert">
//                 <IconCheck />
//                 <span>Account created! Redirecting to login…</span>
//               </div>
//             )}

//             {apiError && (
//               <div className="error-alert">
//                 <IconAlert />
//                 <span>{apiError}</span>
//                 <button className="alert-close" onClick={() => setApiError("")}><IconClose /></button>
//               </div>
//             )}

//             <form onSubmit={handleSubmit} className="login-form" noValidate>

//               {/* Name row */}
//               <div className="name-row">
//                 <Field
//                   label="First Name" name="first_name" value={form.first_name}
//                   onChange={handleChange} error={errors.first_name}
//                   icon={<IconPerson />}
//                 />
//                 <Field
//                   label="Last Name" name="last_name" value={form.last_name}
//                   onChange={handleChange} error={errors.last_name}
//                   icon={<IconPerson />}
//                 />
//               </div>

//               {/* Email */}
//               <Field
//                 label="Email Address" name="email" type="email" value={form.email}
//                 onChange={handleChange} error={errors.email}
//                 icon={<IconEmail />}
//               />

//               {/* Phone */}
//               <Field
//                 label="Phone Number (optional)" name="phone" value={form.phone}
//                 onChange={handleChange} error={errors.phone}
//                 helperText={!errors.phone ? "E.g. +919876543210" : ""}
//                 icon={<IconPhone />}
//               />

//               {/* Role */}
//               <div className="form-group">
//                 <label htmlFor="role">Select Role</label>
//                 <div className="select-wrapper">
//                   <select
//                     id="role" name="role" value={form.role}
//                     onChange={handleChange}
//                     className={errors.role ? "input-error" : ""}
//                   >
//                     <option value="">-- Choose a role --</option>
//                     {ROLES.map(r => (
//                       <option key={r.value} value={r.value}>
//                         {r.label} — {r.desc}
//                       </option>
//                     ))}
//                   </select>
//                   <svg className="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
//                     <polyline points="6 9 12 15 18 9"/>
//                   </svg>
//                 </div>
//                 {errors.role && <span className="field-error">{errors.role}</span>}
//               </div>

//               {/* Password */}
//               <Field
//                 label="Password" name="password"
//                 type={showPass ? "text" : "password"}
//                 value={form.password} onChange={handleChange} error={errors.password}
//                 icon={<IconLock />}
//                 end={
//                   <button type="button" className="password-toggle"
//                     onClick={() => setShowPass(p => !p)} tabIndex="-1" aria-label="Toggle password">
//                     {showPass ? <IconEyeOff /> : <IconEye />}
//                   </button>
//                 }
//               />

//               {/* Confirm Password */}
//               <Field
//                 label="Confirm Password" name="confirm_password"
//                 type={showConfirm ? "text" : "password"}
//                 value={form.confirm_password} onChange={handleChange} error={errors.confirm_password}
//                 icon={<IconLock />}
//                 end={
//                   <button type="button" className="password-toggle"
//                     onClick={() => setShowConfirm(p => !p)} tabIndex="-1" aria-label="Toggle confirm password">
//                     {showConfirm ? <IconEyeOff /> : <IconEye />}
//                   </button>
//                 }
//               />

//               {/* Submit */}
//               <button type="submit" className="btn-primary" disabled={loading || success}>
//                 {loading ? (
//                   <><span className="btn-spinner" /> Creating account…</>
//                 ) : (
//                   <>
//                     Create Account
//                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
//                       <line x1="5" y1="12" x2="19" y2="12"/>
//                       <polyline points="12 5 19 12 12 19"/>
//                     </svg>
//                   </>
//                 )}
//               </button>
//             </form>

//             <div className="divider"><span>Already have an account?</span></div>
//             <Link to="/login" className="btn-outline">Sign In</Link>

//             <div className="hint-box">
//               <p><strong>🔑 Password requirements</strong></p>
//               <p>8+ characters, 1 uppercase letter, 1 number</p>
//             </div>

//             <div className="login-footer">
//               <p>Need help? <a href="mailto:support@zentreelabs.com">Contact Support</a></p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//         .register-page {
//           min-height: 100vh;
//           background: #f1f5f9;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 20px;
//           font-family: 'Segoe UI', system-ui, sans-serif;
//         }

//         /* ── Container ── */
//         .register-container {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           width: 100%;
//           max-width: 1100px;
//           min-height: 680px;
//           background: #ffffff;
//           border-radius: 24px;
//           overflow: hidden;
//           box-shadow: 0 32px 80px rgba(0,0,0,0.14);
//         }

//         /* ── Left / Branding ── (identical to LoginPage) */
//         .login-branding {
//           background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
//           padding: 48px;
//           display: flex;
//           flex-direction: column;
//           justify-content: space-between;
//           color: #fff;
//           position: relative;
//           overflow: hidden;
//         }

//         .login-branding::before {
//           content: '';
//           position: absolute;
//           top: -40%; right: -30%;
//           width: 80%; height: 80%;
//           background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%);
//           pointer-events: none;
//         }

//         .branding-content { position: relative; z-index: 1; }

//         .brand-logo { display: flex; align-items: center; gap: 14px; margin-bottom: 52px; }

//         .logo-icon {
//           width: 56px; height: 56px;
//           background: linear-gradient(135deg, #3b82f6, #2563eb);
//           border-radius: 16px;
//           display: flex; align-items: center; justify-content: center;
//           box-shadow: 0 8px 24px rgba(59,130,246,0.45);
//           flex-shrink: 0;
//         }

//         .logo-text { display: flex; flex-direction: column; }

//         .logo-name { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }

//         .logo-tagline {
//           font-size: 0.75rem; color: #94a3b8;
//           margin-top: -2px; text-transform: uppercase; letter-spacing: 0.08em;
//         }

//         .branding-hero { margin-bottom: 44px; }

//         .branding-hero h1 {
//           font-size: 2.1rem; font-weight: 700;
//           line-height: 1.22; margin-bottom: 14px; letter-spacing: -0.025em;
//         }

//         .branding-hero p { font-size: 0.9375rem; color: #94a3b8; line-height: 1.7; }

//         .feature-list { display: flex; flex-direction: column; gap: 14px; }

//         .feature-item { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: #cbd5e1; }

//         .feature-icon {
//           width: 32px; height: 32px;
//           background: rgba(16,185,129,0.18);
//           border-radius: 8px;
//           display: flex; align-items: center; justify-content: center;
//           color: #34d399; flex-shrink: 0;
//         }

//         .branding-footer {
//           position: relative; z-index: 1;
//           padding-top: 24px;
//           border-top: 1px solid rgba(255,255,255,0.08);
//         }

//         .branding-footer p { font-size: 0.8rem; color: #64748b; }

//         /* ── Right / Form ── */
//         .login-form-container {
//           padding: 48px;
//           display: flex; align-items: center; justify-content: center;
//           background: #fff;
//           overflow-y: auto;
//         }

//         .login-form-wrapper { width: 100%; max-width: 420px; }

//         .form-header { text-align: center; margin-bottom: 24px; }

//         .form-avatar {
//           width: 64px; height: 64px;
//           background: linear-gradient(135deg, #1e3a5f, #2563eb);
//           border-radius: 50%;
//           display: flex; align-items: center; justify-content: center;
//           margin: 0 auto 16px; color: #fff;
//           box-shadow: 0 8px 24px rgba(37,99,235,0.35);
//         }

//         .form-header h2 {
//           font-size: 1.7rem; font-weight: 700;
//           color: #0f172a; margin-bottom: 6px; letter-spacing: -0.02em;
//         }

//         .form-header p { color: #64748b; font-size: 0.9rem; }

//         /* ── Alerts ── */
//         .error-alert, .success-alert {
//           display: flex; align-items: center; gap: 10px;
//           border-radius: 10px; padding: 12px 14px;
//           margin-bottom: 18px; font-size: 0.875rem;
//         }

//         .error-alert {
//           background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
//         }

//         .success-alert {
//           background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534;
//         }

//         .error-alert svg, .success-alert svg { flex-shrink: 0; }
//         .error-alert span, .success-alert span { flex: 1; }

//         .alert-close {
//           background: none; border: none; color: #b91c1c;
//           cursor: pointer; padding: 0; display: flex;
//         }

//         /* ── Form ── */
//         .login-form { display: flex; flex-direction: column; gap: 16px; }

//         .name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

//         .form-group { display: flex; flex-direction: column; gap: 6px; }

//         .form-group label { font-size: 0.875rem; font-weight: 600; color: #374151; }

//         .input-with-icon { position: relative; }

//         .input-with-icon > svg:first-child {
//           position: absolute; left: 14px; top: 50%;
//           transform: translateY(-50%);
//           color: #9ca3af; pointer-events: none;
//         }

//         .input-with-icon input {
//           width: 100%; padding: 11px 46px;
//           font-size: 0.9375rem;
//           border: 1.5px solid #e2e8f0; border-radius: 10px;
//           color: #0f172a; background: #f8fafc;
//           outline: none;
//           transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
//           font-family: inherit;
//         }

//         .input-with-icon input.input-error { border-color: #fca5a5; }

//         .input-with-icon input:focus {
//           border-color: #3b82f6; background: #fff;
//           box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
//         }

//         .input-with-icon input::placeholder { color: #94a3b8; }

//         .password-toggle {
//           position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
//           background: none; border: none; color: #9ca3af;
//           cursor: pointer; padding: 0; display: flex; align-items: center;
//         }

//         .password-toggle:hover { color: #475569; }

//         /* ── Select ── */
//         .select-wrapper { position: relative; }

//         .select-wrapper select {
//           width: 100%; padding: 11px 40px 11px 14px;
//           font-size: 0.9375rem; appearance: none;
//           border: 1.5px solid #e2e8f0; border-radius: 10px;
//           color: #0f172a; background: #f8fafc;
//           outline: none; cursor: pointer; font-family: inherit;
//           transition: border-color 0.2s, box-shadow 0.2s;
//         }

//         .select-wrapper select.input-error { border-color: #fca5a5; }

//         .select-wrapper select:focus {
//           border-color: #3b82f6; background: #fff;
//           box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
//         }

//         .select-arrow {
//           position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
//           color: #9ca3af; pointer-events: none;
//         }

//         /* ── Field messages ── */
//         .field-error { font-size: 0.78rem; color: #dc2626; }
//         .field-hint  { font-size: 0.78rem; color: #64748b; }

//         /* ── Submit ── */
//         .btn-primary {
//           width: 100%;
//           display: flex; align-items: center; justify-content: center; gap: 8px;
//           padding: 13px 24px; font-size: 1rem; font-weight: 600;
//           color: #fff;
//           background: linear-gradient(135deg, #2563eb, #1d4ed8);
//           border: none; border-radius: 12px; cursor: pointer;
//           transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
//           box-shadow: 0 4px 14px rgba(37,99,235,0.35);
//           margin-top: 4px; font-family: inherit;
//         }

//         .btn-primary:hover:not(:disabled) {
//           opacity: 0.92; transform: translateY(-1px);
//           box-shadow: 0 6px 20px rgba(37,99,235,0.4);
//         }

//         .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

//         .btn-spinner {
//           width: 18px; height: 18px;
//           border: 2px solid rgba(255,255,255,0.35);
//           border-top-color: #fff;
//           border-radius: 50%;
//           animation: spin 0.7s linear infinite;
//         }

//         @keyframes spin { to { transform: rotate(360deg); } }

//         /* ── Divider ── */
//         .divider {
//           display: flex; align-items: center; gap: 12px;
//           margin: 20px 0 14px; color: #94a3b8; font-size: 0.8125rem;
//         }

//         .divider::before, .divider::after {
//           content: ''; flex: 1; height: 1px; background: #e2e8f0;
//         }

//         /* ── Outline button ── */
//         .btn-outline {
//           display: flex; align-items: center; justify-content: center;
//           width: 100%; padding: 12px 24px;
//           font-size: 0.9375rem; font-weight: 600;
//           color: #1e40af; border: 1.5px solid #bfdbfe;
//           border-radius: 12px; text-decoration: none;
//           transition: background 0.2s, border-color 0.2s; font-family: inherit;
//         }

//         .btn-outline:hover { background: #eff6ff; border-color: #93c5fd; }

//         /* ── Hint ── */
//         .hint-box {
//           margin-top: 20px; padding: 14px 16px;
//           background: #f8fafc; border: 1px dashed #cbd5e1;
//           border-radius: 10px; font-size: 0.8125rem; color: #475569;
//         }

//         .hint-box p { margin-bottom: 4px; }
//         .hint-box p:last-child { margin-bottom: 0; }

//         /* ── Footer ── */
//         .login-footer { margin-top: 18px; text-align: center; font-size: 0.875rem; color: #64748b; }
//         .login-footer a { color: #2563eb; text-decoration: none; }
//         .login-footer a:hover { text-decoration: underline; }

//         /* ── Responsive ── */
//         @media (max-width: 860px) {
//           .register-container { grid-template-columns: 1fr; max-width: 480px; }
//           .login-branding { display: none; }
//           .login-form-container { padding: 32px 24px; }
//         }

//         @media (max-width: 400px) {
//           .name-row { grid-template-columns: 1fr; }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default RegisterPage;













import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box, Grid, Typography, TextField, Button, IconButton,
  InputAdornment, MenuItem, Alert, CircularProgress,
} from "@mui/material";
import {
  Visibility, VisibilityOff, ArrowForward,
  People, BarChart, Work, Assignment,
  Shield, TrendingUp, ManageSearch, Handshake,
  CheckCircle, GpsFixed, PersonAdd,
} from "@mui/icons-material";

// ─── Config ──────────────────────────────────────────────────────────────────
const LOGO_URL = "https://media.glassdoor.com/sqll/2558186/zentree-labs-squarelogo-1666871706420.png";
const API_URL  = process.env.REACT_APP_API_REGISTER_URL;

const BRAND_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes heroIn  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.55} }
`;

const ROLES = [
  { value: "admin",     label: "Admin",     desc: "Full system access",              Icon: Shield,       col: "#4f46e5" },
  { value: "recruiter", label: "Recruiter", desc: "Manage jobs & candidates",        Icon: ManageSearch, col: "#0d9488" },
  { value: "manager",   label: "Manager",   desc: "Approve hires & manage team",     Icon: TrendingUp,   col: "#d97706" },
  { value: "hr",        label: "HR",        desc: "Onboarding & employee lifecycle", Icon: Handshake,    col: "#dc2626" },
];

const LEFT_FEATURES = [
  { Icon: Shield,     label: "Role-based access control" },
  { Icon: People,     label: "Candidate pipeline management" },
  { Icon: Work,       label: "Client & billing management" },
  { Icon: BarChart,   label: "Real-time reports & analytics" },
];

const validate = (form) => {
  const e = {};
  if (!form.first_name.trim())  e.first_name = "First name is required";
  if (!form.last_name.trim())   e.last_name  = "Last name is required";
  if (!form.email.trim())       e.email      = "Email is required";
  else if (!/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(form.email)) e.email = "Invalid email format";
  if (!form.password)           e.password   = "Password is required";
  else if (form.password.length < 8)         e.password = "At least 8 characters";
  else if (!/[A-Z]/.test(form.password))     e.password = "Must include an uppercase letter";
  else if (!/[0-9]/.test(form.password))     e.password = "Must include a number";
  if (!form.confirm_password)   e.confirm_password = "Please confirm your password";
  else if (form.password !== form.confirm_password) e.confirm_password = "Passwords do not match";
  if (!form.role)               e.role = "Please select a role";
  if (form.phone.trim() && !/^\+?[1-9]\d{6,14}$/.test(form.phone.trim()))
    e.phone = "Invalid phone (e.g. +919876543210)";
  return e;
};

const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#f8fafc", fontFamily: "'DM Sans',sans-serif", fontSize: 14 } };

// ─── Logo — always visible ────────────────────────────────────────────────────
const LogoBlock = ({ dark = false }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
    <Box
      component="img"
      src={LOGO_URL}
      alt="ZentreeLabs"
      sx={{ height: 34, width: 34, borderRadius: 1.5, objectFit: "cover", flexShrink: 0, boxShadow: dark ? "0 2px 10px rgba(0,0,0,.35)" : "none" }}
      onError={e => e.target.style.display = "none"}
    />
    <Typography sx={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 800, color: dark ? "#fff" : "#0f172a", letterSpacing: "-.5px" }}>
      ZentreeLabs<Box component="span" sx={{ color: dark ? "#60a5fa" : "#1d4ed8" }}>Portal</Box>
    </Typography>
  </Box>
);

// ─── Component ───────────────────────────────────────────────────────────────
const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", confirm_password: "", role: "", phone: "" });
  const [errors,      setErrors]      = useState({});
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [apiError,    setApiError]    = useState("");
  const [success,     setSuccess]     = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setApiError("");
    try {
      const { confirm_password, phone, ...rest } = form;
      const res  = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...rest, phone: phone.trim() || null }) });
      const data = await res.json();
      if (!res.ok || !data.success) { setApiError(data.message || "Registration failed."); return; }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch { setApiError("Network error. Please check your connection."); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{BRAND_CSS}</style>
      <Box sx={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", p: 2.5, fontFamily: "'DM Sans',sans-serif" }}>
        <Box sx={{ width: "100%", maxWidth: 1100, borderRadius: 5, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.16)", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, bgcolor: "#fff" }}>

          {/* ── LEFT PANEL ─────────────────────────────────── */}
          <Box sx={{ background: "linear-gradient(145deg,#050e1f 0%,#0f172a 100%)", p: { xs: 4, md: 6 }, display: { xs: "none", md: "flex" }, flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: "-20%", right: "-20%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(29,78,216,.2) 0%,transparent 70%)", pointerEvents: "none" }} />
            <Box sx={{ position: "absolute", bottom: "5%", left: "-15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,.14) 0%,transparent 70%)", pointerEvents: "none" }} />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Box sx={{ mb: 7 }}><LogoBlock dark /></Box>

              <Box sx={{ mb: 5 }}>
                <Typography sx={{ fontFamily: "'Sora',sans-serif", fontSize: "clamp(26px,2.8vw,34px)", fontWeight: 800, color: "#fff", lineHeight: 1.18, letterSpacing: "-1px", mb: 1.5 }}>
                  Start Managing<br />
                  <Box component="span" sx={{ background: "linear-gradient(90deg,#60a5fa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Recruitment Today</Box>
                </Typography>
                <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,.55)", lineHeight: 1.75, fontWeight: 300, maxWidth: 320 }}>
                  Create your account and get instant access to our end-to-end recruitment management platform.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 4 }}>
                {LEFT_FEATURES.map(({ Icon, label }) => (
                  <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 34, height: 34, bgcolor: "rgba(16,185,129,.16)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon sx={{ fontSize: 18, color: "#34d399" }} />
                    </Box>
                    <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,.65)" }}>{label}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Role preview */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 1 }}>
                {ROLES.map(({ value, label, desc, Icon, col }) => (
                  <Box key={value} sx={{ bgcolor: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 2.5, p: 1.5, display: "flex", gap: 1, alignItems: "center" }}>
                    <Icon sx={{ fontSize: 20, color: col, flexShrink: 0 }} />
                    <Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{label}</Typography>
                      <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ borderTop: "1px solid rgba(255,255,255,.07)", pt: 2.5, mt: 3, position: "relative", zIndex: 1 }}>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", gap: 0.5 }}>
                © 2026 ZentreeLabs Pvt Ltd <GpsFixed sx={{ fontSize: 12, color: "#60a5fa", ml: 1 }} /> Hyderabad
              </Typography>
            </Box>
          </Box>

          {/* ── RIGHT PANEL ─────────────────────────────────── */}
          <Box sx={{ p: { xs: 3, md: 5 }, display: "flex", alignItems: "flex-start", justifyContent: "center", bgcolor: "#fff", overflowY: "auto", maxHeight: { md: "95vh" } }}>
            <Box sx={{ width: "100%", maxWidth: 420, py: 2, animation: "heroIn .7s ease forwards" }}>

              <Box sx={{ display: { xs: "block", md: "none" }, mb: 3 }}><LogoBlock /></Box>

              <Box sx={{ mb: 3.5 }}>
                <Box sx={{ width: 58, height: 58, background: "linear-gradient(135deg,#1e3a5f,#2563eb)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", mb: 2, boxShadow: "0 8px 24px rgba(37,99,235,.35)" }}>
                  <PersonAdd sx={{ fontSize: 28, color: "#fff" }} />
                </Box>
                <Typography sx={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-1px", mb: 0.5 }}>Create Account</Typography>
                <Typography sx={{ fontSize: 14, color: "#64748b" }}>Join ZentreeLabs Portal with your role</Typography>
              </Box>

              {success  && <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>Account created! Redirecting to login…</Alert>}
              {apiError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }} onClose={() => setApiError("")}>{apiError}</Alert>}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <TextField fullWidth label="First Name" name="first_name" value={form.first_name} onChange={handleChange} error={!!errors.first_name} helperText={errors.first_name} sx={inputSx} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} error={!!errors.last_name} helperText={errors.last_name} sx={inputSx} />
                  </Grid>
                </Grid>

                <TextField fullWidth label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} autoComplete="email" sx={inputSx} />

                <TextField fullWidth label="Phone Number (optional)" name="phone" value={form.phone} onChange={handleChange} error={!!errors.phone} helperText={errors.phone || "E.g. +919876543210"} sx={inputSx} />

                <TextField select fullWidth label="Select Role" name="role" value={form.role} onChange={handleChange} error={!!errors.role} helperText={errors.role} sx={inputSx}>
                  <MenuItem value="" disabled><em>-- Choose a role --</em></MenuItem>
                  {ROLES.map(({ value, label, desc, Icon, col }) => (
                    <MenuItem key={value} value={value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Icon sx={{ fontSize: 20, color: col }} />
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{label}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#64748b" }}>{desc}</Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>

                <TextField fullWidth label="Password" name="password" type={showPass ? "text" : "password"} value={form.password} onChange={handleChange} error={!!errors.password} helperText={errors.password} autoComplete="new-password"
                  InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton size="small" onClick={() => setShowPass(p => !p)} tabIndex={-1}>{showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>) }}
                  sx={inputSx} />

                <TextField fullWidth label="Confirm Password" name="confirm_password" type={showConfirm ? "text" : "password"} value={form.confirm_password} onChange={handleChange} error={!!errors.confirm_password} helperText={errors.confirm_password} autoComplete="new-password"
                  InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton size="small" onClick={() => setShowConfirm(p => !p)} tabIndex={-1}>{showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>) }}
                  sx={inputSx} />

                <Button fullWidth type="submit" variant="contained" size="large"
                  disabled={loading || success} endIcon={loading ? null : <ArrowForward />}
                  sx={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)", borderRadius: 2.5, fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, py: 1.6, boxShadow: "0 4px 14px rgba(29,78,216,.35)", textTransform: "none", mt: 0.5, "&:hover": { boxShadow: "0 8px 24px rgba(29,78,216,.45)", transform: "translateY(-1px)" }, "&:disabled": { background: "rgba(29,78,216,.5)", color: "#fff" }, transition: "all .22s" }}>
                  {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Create Account"}
                </Button>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, my: 2.5 }}>
                <Box sx={{ flex: 1, height: 1, bgcolor: "#e2e8f0" }} />
                <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>Already have an account?</Typography>
                <Box sx={{ flex: 1, height: 1, bgcolor: "#e2e8f0" }} />
              </Box>

              <Button fullWidth component={Link} to="/login" variant="outlined"
                sx={{ borderRadius: 2.5, borderColor: "#bfdbfe", color: "#1e40af", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, py: 1.3, textTransform: "none", "&:hover": { bgcolor: "#eff6ff", borderColor: "#93c5fd" } }}>
                Sign In
              </Button>

              <Box sx={{ mt: 2.5, p: 1.8, bgcolor: "rgba(29,78,216,.04)", border: "1px dashed #bfdbfe", borderRadius: 2.5 }}>
                <Typography sx={{ fontSize: 12, color: "#475569" }}>
                  <strong>Password requirements:</strong> 8+ characters, 1 uppercase letter, 1 number
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default RegisterPage;