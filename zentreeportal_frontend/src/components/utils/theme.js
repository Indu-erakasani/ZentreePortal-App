import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1a237e",
      light: "#534bae",
      dark: "#000051",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#ff6f00",
      light: "#ffa000",
      dark: "#c43e00",
      contrastText: "#ffffff",
    },
    success: { main: "#2e7d32" },
    error: { main: "#c62828" },
    warning: { main: "#f57f17" },
    info: { main: "#01579b" },
    background: {
      default: "#f0f2f5",
      paper: "#ffffff",
    },
    role: {
      admin: "#7b1fa2",
      recruiter: "#0277bd",
      manager: "#2e7d32",
    },
  },
  typography: {
    fontFamily: "'Nunito', 'Roboto', sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 700, letterSpacing: "0.5px" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
          padding: "10px 24px",
          fontSize: "1rem",
          boxShadow: "none",
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            "&:hover fieldset": { borderColor: "#1a237e" },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
  },
});

export default theme;
