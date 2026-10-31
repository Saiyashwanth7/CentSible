import { Box, Typography } from "@mui/material";
import moods from "./moods";

function Mascot({ mood = "happy", message, size = 64 }) {
  // If someone passes a mood that doesn't exist, fall back to "happy"
  // instead of crashing.
  const current = moods[mood] || moods.happy;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      {/* The cat. fontSize controls the emoji size. */}
      <Box
        role="img"
        aria-label={current.label}
        sx={{ fontSize: size, lineHeight: 1, flexShrink: 0 }}
      >
        {current.emoji}
      </Box>

      {/* The bubble only exists when a message is passed in */}
      {message && (
        <Box
          sx={{
            position: "relative",
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 3,
            px: 2,
            py: 1,
            // A small triangle on the left edge, pointing at the cat.
            "&::before": {
              content: '""',
              position: "absolute",
              left: -7,
              top: "50%",
              width: 12,
              height: 12,
              bgcolor: "background.paper",
              borderLeft: 1,
              borderBottom: 1,
              borderColor: "divider",
              transform: "translateY(-50%) rotate(45deg)",
            },
          }}
        >
          <Typography variant="body2">{message}</Typography>
        </Box>
      )}
    </Box>
  );
}

export default Mascot;
