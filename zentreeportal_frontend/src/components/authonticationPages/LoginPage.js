


import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL =process.env.REACT_APP_API_BASE_URL;

const getDashboardByRole = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "recruiter") return "/recruiter/dashboard";
  if (role === "manager") return "/manager/dashboard";
  return "/login";
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "Invalid email or password");
        return;
      }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(getDashboardByRole(data.user.role), { replace: true });
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* ── Left Side – Branding ── */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className="logo-text">
                <span className="logo-name">ZentreeLabs</span>
                <span className="logo-tagline">Portal</span>
              </div>
            </div>

            <div className="branding-hero">
              <h1>Streamline Your Recruitment Process</h1>
              <p>Manage clients, track candidates, and close positions faster with our comprehensive recruitment management platform.</p>
            </div>

            <div className="feature-list">
              {[
                "End-to-end recruitment tracking",
                "Real-time analytics & reports",
                "Client & candidate management",
                "Automated billing & invoicing",
              ].map((feat) => (
                <div className="feature-item" key={feat}>
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="branding-footer">
            <p>© 2026 ZentreeLabs Pvt Ltd. All rights reserved.</p>
          </div>
        </div>

        {/* ── Right Side – Login Form ── */}
        <div className="login-form-container">
          <div className="login-form-wrapper">
            <div className="form-header">
              <div className="form-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="30" height="30">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              </div>
              <h2>Welcome Back</h2>
              <p>Sign in to continue to your dashboard</p>
            </div>

            {error && (
              <div className="error-alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
                <button className="alert-close" onClick={() => setError("")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type={showPass ? "text" : "password"}
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex="-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Options row */}
              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me for 30 days</span>
                </label>
              </div>

              {/* Submit */}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider + Register */}
            <div className="divider">
              <span>Don't have an account?</span>
            </div>
            <Link to="/register" className="btn-outline">Create Account</Link>

            {/* Password hint */}
            <div className="hint-box">
              <p><strong>🔑 Register with any role</strong></p>
              <p>Password: 8+ chars, 1 uppercase, 1 number</p>
            </div>

            <div className="login-footer">
              <p>Need help? <a href="mailto:support@zentreelabs.com">Contact Support</a></p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ─── Reset & Base ─── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-page {
          min-height: 100vh;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        /* ─── Container ─── */
        .login-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 1100px;
          min-height: 680px;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.14);
        }

        /* ─── Left / Branding ─── */
        .login-branding {
          background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #fff;
          position: relative;
          overflow: hidden;
        }

        .login-branding::before {
          content: '';
          position: absolute;
          top: -40%;
          right: -30%;
          width: 80%;
          height: 80%;
          background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .branding-content { position: relative; z-index: 1; }

        /* Logo */
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 52px;
        }

        .logo-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(59,130,246,0.45);
          flex-shrink: 0;
        }

        .logo-text { display: flex; flex-direction: column; }

        .logo-name {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .logo-tagline {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: -2px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* Hero text */
        .branding-hero { margin-bottom: 44px; }

        .branding-hero h1 {
          font-size: 2.1rem;
          font-weight: 700;
          line-height: 1.22;
          margin-bottom: 14px;
          letter-spacing: -0.025em;
        }

        .branding-hero p {
          font-size: 0.9375rem;
          color: #94a3b8;
          line-height: 1.7;
        }

        /* Feature list */
        .feature-list { display: flex; flex-direction: column; gap: 14px; }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          color: #cbd5e1;
        }

        .feature-icon {
          width: 32px;
          height: 32px;
          background: rgba(16,185,129,0.18);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #34d399;
          flex-shrink: 0;
        }

        /* Footer */
        .branding-footer {
          position: relative;
          z-index: 1;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .branding-footer p { font-size: 0.8rem; color: #64748b; }

        /* ─── Right / Form ─── */
        .login-form-container {
          padding: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
        }

        .login-form-wrapper { width: 100%; max-width: 400px; }

        /* Form header */
        .form-header { text-align: center; margin-bottom: 28px; }

        .form-avatar {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #1e3a5f, #2563eb);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #fff;
          box-shadow: 0 8px 24px rgba(37,99,235,0.35);
        }

        .form-header h2 {
          font-size: 1.7rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .form-header p { color: #64748b; font-size: 0.9rem; }

        /* Error alert */
        .error-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 18px;
          color: #b91c1c;
          font-size: 0.875rem;
        }

        .error-alert svg { flex-shrink: 0; color: #ef4444; }

        .error-alert span { flex: 1; }

        .alert-close {
          background: none;
          border: none;
          color: #b91c1c;
          cursor: pointer;
          padding: 0;
          display: flex;
        }

        /* Form groups */
        .login-form { display: flex; flex-direction: column; gap: 18px; }

        .form-group { display: flex; flex-direction: column; gap: 6px; }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .input-with-icon { position: relative; }

        .input-with-icon > svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }

        .input-with-icon input {
          width: 100%;
          padding: 11px 46px;
          font-size: 0.9375rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          font-family: inherit;
        }

        .input-with-icon input:focus {
          border-color: #3b82f6;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }

        .input-with-icon input::placeholder { color: #94a3b8; }

        /* Password toggle */
        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .password-toggle:hover { color: #475569; }

        /* Remember me */
        .form-options { display: flex; align-items: center; }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          color: #4b5563;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input {
          width: 16px;
          height: 16px;
          accent-color: #2563eb;
          cursor: pointer;
        }

        /* Submit button */
        .btn-primary {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 24px;
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(37,99,235,0.35);
          margin-top: 4px;
          font-family: inherit;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.4);
        }

        .btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0 14px;
          color: #94a3b8;
          font-size: 0.8125rem;
        }

        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        /* Outline button */
        .btn-outline {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 12px 24px;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1e40af;
          border: 1.5px solid #bfdbfe;
          border-radius: 12px;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s;
          font-family: inherit;
        }

        .btn-outline:hover {
          background: #eff6ff;
          border-color: #93c5fd;
        }

        /* Hint box */
        .hint-box {
          margin-top: 20px;
          padding: 14px 16px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          font-size: 0.8125rem;
          color: #475569;
        }

        .hint-box p { margin-bottom: 4px; }
        .hint-box p:last-child { margin-bottom: 0; }

        /* Footer */
        .login-footer {
          margin-top: 18px;
          text-align: center;
          font-size: 0.875rem;
          color: #64748b;
        }

        .login-footer a { color: #2563eb; text-decoration: none; }
        .login-footer a:hover { text-decoration: underline; }

        /* ─── Responsive ─── */
        @media (max-width: 860px) {
          .login-container {
            grid-template-columns: 1fr;
            max-width: 480px;
          }

          .login-branding { display: none; }

          .login-form-container { padding: 32px 24px; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;