import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

export default function ResumeScreeningResponse() {
  const { token, response } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !response) return;

    // Call backend directly — no auth header needed
    fetch(`${API_BASE}/resumes/screening/${token}/${response}`, {
      method:   "GET",
      redirect: "manual",   // don't follow redirect, handle manually
    })
      .then(async (res) => {
        // Backend returns 302 redirect to /screening-response-done
        // But fetch with redirect:manual gives opaqueredirect
        // So just navigate to done page directly with the response
        const status = response === "yes" ? "Interested" : "Not+Interested";

        // Also try to get job title from the token via a status check
        try {
          const statusRes = await fetch(
            `${API_BASE}/resumes/screening-token-info/${token}`
          );
          if (statusRes.ok) {
            const data = await statusRes.json();
            const job  = encodeURIComponent(data.job_title || "");
            navigate(`/screening-response-done?status=${status}&job=${job}`, { replace: true });
          } else {
            navigate(`/screening-response-done?status=${status}`, { replace: true });
          }
        } catch {
          navigate(`/screening-response-done?status=${status}`, { replace: true });
        }
      })
      .catch(() => {
        setError("Network error. Please try again.");
      });
  }, [token, response]);

  if (error) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Typography color="error">{error}</Typography>
    </Box>
  );

  return (
    <Box display="flex" flexDirection="column" justifyContent="center"
      alignItems="center" minHeight="100vh" gap={2}>
      <CircularProgress />
      <Typography color="text.secondary" fontSize={14}>
        Recording your response…
      </Typography>
    </Box>
  );
}