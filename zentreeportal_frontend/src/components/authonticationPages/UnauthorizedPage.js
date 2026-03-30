import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Lock } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const getDashboard = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "recruiter") return "/recruiter/dashboard";
  if (role === "manager") return "/manager/dashboard";
  return "/login";
};

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return (
    <Box sx={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg, #e8eaf6, #fce4ec)", textAlign:"center", px:3 }}>
      <Box sx={{ width:90, height:90, borderRadius:"50%", mb:3, bgcolor:"#c6282818", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Lock sx={{ fontSize:48, color:"#c62828" }} />
      </Box>
      <Typography variant="h3" fontWeight={800} color="error.dark" mb={1}>403</Typography>
      <Typography variant="h5" fontWeight={700} mb={1}>Access Denied</Typography>
      <Typography color="text.secondary" mb={4}>You don't have permission to view this page.</Typography>
      <Button variant="contained" size="large" onClick={() => navigate(getDashboard(user?.role))} sx={{ borderRadius:3, px:4 }}>
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default UnauthorizedPage;
