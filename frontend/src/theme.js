import { createTheme } from "@mui/material/styles";

const GREEN = "#1ed760";
const BG = "#121212";
const CARD = "#181818";
const LINE = "rgba(255,255,255,0.1)";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: GREEN, contrastText: "#000000" },
    secondary: { main: "#FFFFFF", contrastText: BG },
    success: { main: GREEN },
    error: { main: "#FF6B6B" }, // "spending went up" warning
    background: { default: BG, paper: CARD },
    text: { primary: "#FFFFFF", secondary: "#B3B3B3" },
    divider: LINE,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 },
    h2: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 },
    h3: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 },
    h4: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 },
    h5: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 },
    h6: { fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: `1px solid ${LINE}`,
          borderRadius: 20,
          boxShadow: "none",
          transition: "border-color 0.25s",
          "&:hover": { borderColor: "rgba(30,215,96,0.38)" },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, boxShadow: "none" },
        containedPrimary: {
          "&:hover": { backgroundColor: "#FFFFFF", color: BG },
        },
        outlined: {
          borderColor: LINE,
          color: "#FFFFFF",
          "&:hover": { borderColor: GREEN, color: GREEN },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 14, border: `1px solid ${LINE}` },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "input[type=number]": { MozAppearance: "textfield" },
        "input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button":
          { WebkitAppearance: "none", margin: 0 },
        html: { colorScheme: "dark" },

        // thin, soft scrollbar everywhere, including inside dialogs
        "*": {
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255, 255, 255, 0.25) transparent",
        },
      },
    },
  },
});

export default theme;
