import React from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { CheckCircle, Cancel, HourglassEmpty, Replay } from "@mui/icons-material";

export default function ScreeningResponseDone() {
  const [params] = useSearchParams();
  const status  = params.get("status") || "";
  const job     = params.get("job")    || "";
  const already = params.get("already") === "true";

  const isInterested    = status === "Interested";
  const isNotInterested = status === "Not+Interested" || status === "Not Interested";
  const isExpired       = status === "Expired";

  const config = isInterested ? {
    icon:   <CheckCircle sx={{ fontSize: 72, color: "#15803d" }} />,
    title:  already ? "You already confirmed your interest!" : "Thank you for your interest!",
    msg:    "Our recruitment team will be in touch with you shortly regarding the next steps.",
    bg:     "#f0fdf4",
    border: "#86efac",
    color:  "#15803d",
  } : isNotInterested ? {
    icon:   <Cancel sx={{ fontSize: 72, color: "#dc2626" }} />,
    title:  already ? "You already declined this opportunity." : "Thank you for letting us know!",
    msg:    "No worries at all. We appreciate you taking the time to respond. We'll keep your profile on file for future opportunities that may be a better fit.",
    bg:     "#fef2f2",
    border: "#fca5a5",
    color:  "#dc2626",
  } : isExpired ? {
    icon:   <HourglassEmpty sx={{ fontSize: 72, color: "#d97706" }} />,
    title:  "This link has expired",
    msg:    "The screening link is no longer valid. Please contact the recruiter directly if you're still interested.",
    bg:     "#fffbeb",
    border: "#fcd34d",
    color:  "#d97706",
  } : {
    icon:   <Replay sx={{ fontSize: 72, color: "#6366f1" }} />,
    title:  "Something went wrong",
    msg:    "This link may be invalid. Please contact the recruiter directly.",
    bg:     "#f5f3ff",
    border: "#c4b5fd",
    color:  "#6366f1",
  };

  return (
    <Box
      display="flex" alignItems="center" justifyContent="center"
      minHeight="100vh" bgcolor="#f8fafc" p={3}
    >
      <Card sx={{
        maxWidth: 500, width: "100%", borderRadius: 3,
        border: `2px solid ${config.border}`,
        bgcolor: config.bg,
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
      }}>
        <CardContent sx={{ p: 4, textAlign: "center" }}>

          {/* Brand */}
          <Typography fontSize={12} color="text.disabled" mb={3}
            fontWeight={600} textTransform="uppercase" letterSpacing={1.2}>
            Zentree Labs · Recruitment
          </Typography>

          {/* Icon */}
          <Box mb={2}>{config.icon}</Box>

          {/* Title */}
          <Typography variant="h5" fontWeight={800} color={config.color} mb={1.5}>
            {config.title}
          </Typography>

          {/* Job pill */}
          {job && (
            <Box mb={2.5} display="inline-block" px={2.5} py={1}
              bgcolor="white" borderRadius={2}
              border={`1.5px solid ${config.border}`}>
              <Typography fontSize={14} fontWeight={700} color="text.primary">
                {decodeURIComponent(job)}
              </Typography>
            </Box>
          )}

          {/* Message */}
          <Typography fontSize={14} color="text.secondary" lineHeight={1.8} mt={0.5}>
            {config.msg}
          </Typography>

          {/* Already responded notice */}
          {already && (
            <Box mt={2} px={2} py={1} bgcolor="white" borderRadius={2}
              border={`1px solid ${config.border}`}>
              <Typography fontSize={12} color="text.disabled">
                You have already responded to this invitation.
              </Typography>
            </Box>
          )}

          <Typography fontSize={11} color="text.disabled" mt={3}>
            You can safely close this window.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}