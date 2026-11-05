import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboard } from "../../api/expenses";
import Mascot from "../../components/Mascot/Mascot";
import DemoButton from "../../components/DemoButton/DemoButton";

const GITHUB_URL = "https://github.com/Saiyashwanth7/CentSible";

// After deploying, put screenshots in frontend/public and list them here,
// e.g. [{ src: "/dashboard.png", alt: "CentSible dashboard" }].
// The screenshots section only shows when this list is not empty.
const screenshots = [];

const features = [
  {
    title: "Track every expense",
    text: "Add expenses with a category, date and notes. Filter them by category and edit them any time.",
  },
  {
    title: "Recurring expenses on autopilot",
    text: "Set up rent, subscriptions or bills once. They are added for you on schedule, and you can pause or resume them whenever you like.",
  },
  {
    title: "See where your money goes",
    text: "The dashboard shows your total spending, this month's spending and a breakdown by category.",
  },
];

const steps = [
  {
    title: "Create an account",
    text: "Sign up with your email or continue with Google.",
  },
  {
    title: "Add your expenses",
    text: "Log what you spend and set up the bills that repeat.",
  },
  {
    title: "Check your dashboard",
    text: "See your totals and categories at a glance.",
  },
];

const techStack = [
  "React",
  "Material UI",
  "FastAPI",
  "PostgreSQL",
  "Redis",
  "Celery",
  "RabbitMQ",
];

const sampleRows = [
  { label: "Rent", pct: 62, value: "62%" },
  { label: "Food", pct: 41, value: "41%" },
  { label: "Travel", pct: 23, value: "23%" },
  { label: "Subscriptions", pct: 12, value: "12%" },
];

// Top 4 categories by spend, with each one's share of the total.
function buildRows(stats) {
  const all = stats.category_breakdown;
  const sum = all.reduce((acc, c) => acc + Number(c.total), 0);
  return [...all]
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 4)
    .map((c) => {
      const pct = sum > 0 ? Math.round((Number(c.total) / sum) * 100) : 0;
      return {
        label: c.category,
        pct: pct,
        value:
          "₹" + Number(c.total).toLocaleString("en-IN") + " (" + pct + "%)",
      };
    });
}

const cardSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
  bgcolor: "background.paper",
  p: 3,
  boxShadow: 1,
};

// Bars for spending by category. Used with real data for logged-in
// users and with sample data for visitors.
function SpendingCard({ title, rows, footer, to }) {
  return (
    <Box
      component={to ? Link : "div"}
      to={to}
      sx={{
        ...cardSx,
        display: "block",
        color: "inherit",
        textDecoration: "none",
        ...(to && {
          transition: "border-color 0.15s",
          "&:hover, &:focus-visible": { borderColor: "primary.main" },
        }),
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      <Stack sx={{ gap: 2, mt: 2 }}>
        {rows.map((row) => (
          <Box key={row.label}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">{row.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {row.value}
              </Typography>
            </Stack>
            <Box
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "action.hover",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: row.pct + "%",
                  height: "100%",
                  bgcolor: "primary.main",
                  borderRadius: 4,
                }}
              />
            </Box>
          </Box>
        ))}
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 2 }}
      >
        {footer}
      </Typography>
      {to && (
        <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
          Open dashboard
        </Typography>
      )}
    </Box>
  );
}

// Right side of the hero: real data for logged-in users, sample for visitors.
function HeroCard({ user, loading, stats, statsError }) {
  if (loading) return null;

  if (!user) {
    return (
      <SpendingCard
        title="Spending by category"
        rows={sampleRows}
        footer="Sample data. Create an account to see your own."
      />
    );
  }

  if (statsError) {
    return (
      <Box sx={cardSx}>
        <Typography color="text.secondary">
          Could not load your spending right now. Open the dashboard to try
          again.
        </Typography>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={cardSx}>
        <Typography color="text.secondary">Loading your spending...</Typography>
      </Box>
    );
  }

  if (stats.category_breakdown.length === 0) {
    return (
      <Box sx={cardSx}>
        <Typography sx={{ mb: 2 }}>
          You have not added any expenses yet.
        </Typography>
        <Button variant="contained" component={Link} to="/expenses">
          Add your first expense
        </Button>
      </Box>
    );
  }

  return (
    <SpendingCard
      title="Your spending by category"
      rows={buildRows(stats)}
      to="/dashboard"
      footer={
        "This month: ₹" + Number(stats.total_this_month).toLocaleString("en-IN")
      }
    />
  );
}

function Landing() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(false);
  const firstName = user?.name?.split(" ")[0];

  // Load the user's real numbers. Reset when the user changes so one
  // person's data is never shown to the next person on the same browser.
  useEffect(() => {
    setStats(null);
    setStatsError(false);
    if (!user) return;

    let ignore = false;
    getDashboard()
      .then((data) => {
        if (!ignore) setStats(data);
      })
      .catch(() => {
        if (!ignore) setStatsError(true);
      });
    return () => {
      ignore = true;
    };
  }, [user]);

  return (
    <Box>
      {/* Hero: same headline for everyone, actions depend on login state */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box
          sx={{
            display: "grid",
            gap: 6,
            alignItems: "center",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
          }}
        >
          <Box>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                fontSize: { xs: "2.4rem", md: "3.5rem" },
              }}
            >
              Know where your money goes
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mt: 2, mb: 4, maxWidth: "52ch", fontWeight: 400 }}
            >
              Log your expenses, schedule the ones that repeat, and see your
              spending by category on one dashboard.
            </Typography>

            {!loading &&
              (user ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Mascot
                      mood="happy"
                      size={56}
                      message={"Welcome back, " + firstName + "!"}
                    />
                  </Box>
                  <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap" }}>
                    <Button
                      variant="contained"
                      size="large"
                      component={Link}
                      to="/dashboard"
                    >
                      Open dashboard
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      component={Link}
                      to="/expenses"
                    >
                      Add an expense
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      component={Link}
                      to="/recurring"
                    >
                      Recurring
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ mb: 3 }}>
                    <Mascot
                      mood="happy"
                      size={56}
                      message="Hi! I'll keep an eye on your money."
                    />
                  </Box>
                  <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap" }}>
                    <Button
                      variant="contained"
                      size="large"
                      component={Link}
                      to="/register"
                    >
                      Create free account
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      component={Link}
                      to="/login"
                    >
                      Log in
                    </Button>
                    <DemoButton size="large" />
                  </Stack>
                </Box>
              ))}
          </Box>

          <HeroCard
            user={user}
            loading={loading}
            stats={stats}
            statsError={statsError}
          />
        </Box>
      </Container>

      {/* Visitor-only sections */}
      {!loading && !user && (
        <>
          <Container maxWidth="lg" sx={{ py: 6 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
              What you can do
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 4,
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              }}
            >
              {features.map((f) => (
                <Box
                  key={f.title}
                  sx={{ borderTop: 2, borderColor: "primary.main", pt: 2 }}
                >
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {f.title}
                  </Typography>
                  <Typography color="text.secondary">{f.text}</Typography>
                </Box>
              ))}
            </Box>
          </Container>

          <Container maxWidth="lg" sx={{ py: 6 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
              How it works
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 4,
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              }}
            >
              {steps.map((s, i) => (
                <Stack key={s.title} direction="row" sx={{ gap: 2 }}>
                  <Typography
                    variant="h4"
                    color="primary"
                    sx={{ fontWeight: 700, lineHeight: 1 }}
                  >
                    {i + 1}
                  </Typography>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {s.title}
                    </Typography>
                    <Typography color="text.secondary">{s.text}</Typography>
                  </Box>
                </Stack>
              ))}
            </Box>
          </Container>
        </>
      )}

      {/* Screenshots: shown for everyone once you add images above */}
      {screenshots.length > 0 && (
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
            A look inside
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            }}
          >
            {screenshots.map((shot) => (
              <Box
                key={shot.src}
                component="img"
                src={shot.src}
                alt={shot.alt}
                sx={{
                  width: "100%",
                  borderRadius: 2,
                  border: 1,
                  borderColor: "divider",
                }}
              />
            ))}
          </Box>
        </Container>
      )}

      {/* Closing call to action, visitors only */}
      {!loading && !user && (
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              borderRadius: 2,
              p: { xs: 4, md: 6 },
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Start tracking your spending today
            </Typography>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/register"
              sx={{
                bgcolor: "background.paper",
                color: "text.primary",
                "&:hover": { bgcolor: "grey.200" },
              }}
            >
              Create free account
            </Button>
          </Box>
        </Container>
      )}

      {/* Tech stack: for everyone */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          Built with
        </Typography>
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
          {techStack.map((t) => (
            <Chip key={t} label={t} variant="outlined" />
          ))}
        </Stack>
      </Container>

      {/* Footer */}
      <Box sx={{ borderTop: 1, borderColor: "divider", py: 3 }}>
        <Container
          maxWidth="lg"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            CentSible {new Date().getFullYear()}
          </Typography>
          <Button
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
          >
            Source on GitHub
          </Button>
        </Container>
      </Box>
    </Box>
  );
}

export default Landing;
