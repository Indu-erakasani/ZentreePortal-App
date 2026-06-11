import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const SKILL_LEVELS = [
  "",
  "Beginner",
  "Elementary",
  "Intermediate",
  "Advanced",
  "Expert",
];

export default function SkillRatingInput({ value = [], onChange }) {
  const [input, setInput] = useState("");


const skills = Array.isArray(value) ? value : [];
  
const addSkill = () => {
  const name = input.trim();
  if (!name || skills.find(s => s.name.toLowerCase() === name.toLowerCase())) {
    setInput(""); return;
  }
  onChange([...skills, { name, rating: 1 }]);
  setInput("");
};

const removeSkill = (idx) => onChange(skills.filter((_, i) => i !== idx));

const updateRating = (idx, rating) =>
  onChange(skills.map((s, i) => i === idx ? { ...s, rating } : s));

const handleKey = (e) => {
  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); }
};

const ratingColor = (r) => {
  if (r <= 1) return "#ef4444";
  if (r === 2) return "#f97316";
  if (r === 3) return "#eab308";
  if (r === 4) return "#22c55e";
  return "#0369a1";
};
  return (
       <Box>
         <Box display="flex" gap={1} mb={1.5}>
           <TextField
             size="small" fullWidth
             placeholder="Type a skill and press Enter…"
             value={input}
             onChange={e => setInput(e.target.value)}
             onKeyDown={handleKey}
             sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px 0 0 8px" } }}
           />

           <Button
            variant="outlined" onClick={addSkill} size="small"
            sx={{minWidth: 90,height: 40,textTransform: "none",fontWeight: 600,borderRadius: 2,boxShadow: "none", "&:hover": {bgcolor: "#075985",boxShadow: "none",},}}
            >
            Add
            </Button>
         </Box>
         {skills.length === 0 && (
           <Typography fontSize={11} color="text.disabled" ml={0.5}>No skills added yet</Typography>
         )}
         <Box display="flex" flexDirection="column" gap={1}>
           {skills.map((s, i) => (
             <Box key={i} display="flex" alignItems="center" gap={1.5}
               sx={{ p: "6px 10px", bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 2 }}>
               <Typography fontSize={13} fontWeight={600} flex={1} noWrap>{s.name}</Typography>
               <Box display="flex" alignItems="center" gap={0.5}>
                 {[1, 2, 3, 4, 5].map(r => (
                   <Box key={r} onClick={() => updateRating(i, r)} sx={{
                     width: 20, height: 20, borderRadius: "50%", cursor: "pointer",
                     bgcolor: r <= s.rating ? ratingColor(s.rating) : "#e2e8f0",
                     border: `2px solid ${r <= s.rating ? ratingColor(s.rating) : "#cbd5e1"}`,
                     transition: "all 0.15s",
                     "&:hover": { transform: "scale(1.2)" },
                   }} />
                 ))}
               </Box>
               <Tooltip title={SKILL_LEVELS[s.rating]}>
                 <Typography fontSize={10} fontWeight={700} sx={{ minWidth: 68, color: ratingColor(s.rating), textAlign: "right" }}>
                   {SKILL_LEVELS[s.rating]}
                 </Typography>
               </Tooltip>
               <IconButton size="small" onClick={() => removeSkill(i)} sx={{ color: "#94a3b8", "&:hover": { color: "#ef4444" } }}>
                 <CloseIcon sx={{ fontSize: 14 }} />
               </IconButton>
             </Box>
           ))}
         </Box>
       </Box>
     );
   };
