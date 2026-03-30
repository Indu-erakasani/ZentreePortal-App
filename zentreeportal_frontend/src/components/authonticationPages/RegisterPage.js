import React, { useState } from "react";
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  MenuItem, Select, FormControl, InputLabel, InputAdornment,
  IconButton, Grid, CircularProgress, Divider, FormHelperText
} from "@mui/material";
import {
  Person, Email, Lock, Phone, Visibility, VisibilityOff,
  HowToReg, AdminPanelSettings, Work, ManageAccounts
} from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

const ROLES = [
  { value: "admin",     label: "Admin",     icon: <AdminPanelSettings />, color: "#7b1fa2", desc: "Full system access" },
  { value: "recruiter", label: "Recruiter", icon: <Work />,               color: "#0277bd", desc: "Manage jobs & candidates" },
  { value: "manager",   label: "Manager",   icon: <ManageAccounts />,     color: "#2e7d32", desc: "Approve hires & manage team" },
];

const validate = (form) => {
  const errs = {};
  if (!form.first_name.trim()) errs.first_name = "First name is required";
  if (!form.last_name.trim())  errs.last_name  = "Last name is required";

  if (!form.email.trim())      errs.email = "Email is required";
  else if (!/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(form.email)) errs.email = "Invalid email format";

  if (!form.password)                          errs.password = "Password is required";
  else if (form.password.length < 8)           errs.password = "At least 8 characters";
  else if (!/[A-Z]/.test(form.password))       errs.password = "Must include an uppercase letter";
  else if (!/[0-9]/.test(form.password))       errs.password = "Must include a number";

  if (!form.confirm_password)                            errs.confirm_password = "Please confirm your password";
  else if (form.password !== form.confirm_password)      errs.confirm_password = "Passwords do not match";

  if (!form.role) errs.role = "Please select a role";

  // ── phone is optional — only validate format if provided ─────────────────
  if (form.phone.trim() && !/^\+?[1-9]\d{6,14}$/.test(form.phone.trim())) {
    errs.phone = "Invalid phone number (e.g. +919876543210)";
  }

  return errs;
};

const RegisterPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "",
    phone: "",              // ← new
  });

  const [errors, setErrors]         = useState({});
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [apiError, setApiError]     = useState("");
  const [success, setSuccess]       = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError("");

    try {
      // Strip confirm_password; send phone as null if empty
      const { confirm_password, phone, ...rest } = form;
      const payload = {
        ...rest,
        phone: phone.trim() || null,    // ← send null if blank
      };

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setApiError(data.message || "Registration failed");
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setApiError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e8eaf6 0%, #fce4ec 50%, #e0f2f1 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        px: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 560, borderRadius: 4, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <Box textAlign="center" mb={4}>
            <Box
              sx={{
                width: 70, height: 70, borderRadius: "50%", mx: "auto", mb: 2,
                background: "linear-gradient(135deg, #1a237e, #283593)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(26,35,126,0.35)",
              }}
            >
              <HowToReg sx={{ color: "white", fontSize: 36 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="primary.dark">Create Account</Typography>
            <Typography color="text.secondary" mt={0.5}>Join ZentreeLabs Portalwith your role</Typography>
          </Box>

          {/* ── Alerts ───────────────────────────────────────────────────── */}
          {success  && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Account created! Redirecting to login…</Alert>}
          {apiError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setApiError("")}>{apiError}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>

            {/* ── Name row ─────────────────────────────────────────────── */}
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="First Name" name="first_name"
                  value={form.first_name} onChange={handleChange}
                  error={!!errors.first_name} helperText={errors.first_name}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Last Name" name="last_name"
                  value={form.last_name} onChange={handleChange}
                  error={!!errors.last_name} helperText={errors.last_name}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }}
                />
              </Grid>
            </Grid>

            {/* ── Email ────────────────────────────────────────────────── */}
            <TextField
              fullWidth label="Email Address" name="email" type="email"
              value={form.email} onChange={handleChange}
              error={!!errors.email} helperText={errors.email}
              sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
            />

            {/* ── Phone (optional) ─────────────────────────────────────── */}
            <TextField
              fullWidth
              label="Phone Number (optional)"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone || "E.g. +919876543210"}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* ── Role selector ─────────────────────────────────────────── */}
            <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.role}>
              <InputLabel>Select Role</InputLabel>
              <Select
                name="role" value={form.role}
                label="Select Role" onChange={handleChange}
                sx={{ borderRadius: 2.5 }}
              >
                {ROLES.map(r => (
                  <MenuItem key={r.value} value={r.value}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box sx={{ color: r.color, display: "flex" }}>{r.icon}</Box>
                      <Box>
                        <Typography fontWeight={700} fontSize={14}>{r.label}</Typography>
                        <Typography fontSize={11} color="text.secondary">{r.desc}</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
            </FormControl>

            {/* ── Password ─────────────────────────────────────────────── */}
            <TextField
              fullWidth label="Password" name="password"
              type={showPass ? "text" : "password"}
              value={form.password} onChange={handleChange}
              error={!!errors.password} helperText={errors.password}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(p => !p)} edge="end">
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* ── Confirm Password ─────────────────────────────────────── */}
            <TextField
              fullWidth label="Confirm Password" name="confirm_password"
              type={showConfirm ? "text" : "password"}
              value={form.confirm_password} onChange={handleChange}
              error={!!errors.confirm_password} helperText={errors.confirm_password}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirm(p => !p)} edge="end">
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* ── Submit ───────────────────────────────────────────────── */}
            <Button
              type="submit" fullWidth variant="contained" size="large"
              disabled={loading || success}
              sx={{ py: 1.5, mb: 2, fontSize: "1rem", borderRadius: 3 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography color="text.secondary" fontSize={13}>Already have an account?</Typography>
            </Divider>

            <Button fullWidth variant="outlined" size="large" component={Link} to="/login" sx={{ borderRadius: 3, py: 1.5 }}>
              Sign In
            </Button>

          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;