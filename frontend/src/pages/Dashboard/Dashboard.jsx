import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import { getDashboard } from "../../api/expenses";
import { getTrends } from "../../api/insights";
import Mascot from "../../components/Mascot/Mascot";
import { useAuth } from "../../contexts/AuthContext";

function formatMoney(value) {
  // Number(value || 0) turns null/undefined into 0 so nothing crashes
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

// change_pct is a number (20.0 means +20%) or null when last month had no spending.
// Spending going up is red, going down is green.
function formatChange(pct) {
  if (pct === null || pct === undefined) {
    return { text: "No data for last month", color: "text.secondary" };
  }
  if (pct > 0) {
    return { text: "+" + pct + "% vs last month", color: "error.main" };
  }
  if (pct < 0) {
    return { text: pct + "% vs last month", color: "success.main" };
  }
  return { text: "No change vs last month", color: "text.secondary" };
}

// YOUR TASK: decide the cat's mood from the data.
// Rules, in this order:
//   1. no expenses yet (data.total_expenses is 0)  -> "sleepy"
//   2. trendsData is null                          -> "happy", neutral message
//   3. change_pct is null                          -> "happy", fresh start message
//   4. change_pct > 0                              -> "worried"
//   5. otherwise                                   -> "happy"
// For now it always returns happy, so the page works while you write it.
function pick(lines) {
  return lines[new Date().getDate() % lines.length];
}

function getCatState(data, trendsData, firstName) {
  const name = firstName ? ", " + firstName : "";

  // the category you spend the most on
  const top = [...(data.category_breakdown || [])].sort(
    (a, b) => Number(b.total) - Number(a.total),
  )[0]?.category;

  // 1. no expenses at all
  if (data.total_expenses === 0) {
    return {
      mood: "sleepy",
      message: pick([
        `Wake me up with your first expense${name}!`,
        "Nothing here yet. I'm napping.",
        `Add an expense${name} and I'll get to work.`,
      ]),
    };
  }

  // 2. expenses exist, but nothing spent this month yet
  if (Number(data.total_this_month) === 0) {
    return {
      mood: "happy",
      message: pick([
        `Nothing spent this month so far${name}!`,
        "A clean month so far. Keep it up!",
      ]),
    };
  }

  // 3. trends didn't load
  if (!trendsData) {
    return {
      mood: "happy",
      message: top
        ? `Most of your money goes to ${top}.`
        : "I'm keeping an eye on your wallet.",
    };
  }

  const raw = trendsData.change_pct;

  // 4. no spending last month, so there is nothing to compare with
  if (raw === null || raw === undefined) {
    return {
      mood: "happy",
      message: pick([
        `Your first month on the books${name}!`,
        top
          ? `Let's see where it goes. ${top} leads so far.`
          : "Let's see where this month goes.",
      ]),
    };
  }

  const pct = Math.round(raw);
  const projected = formatMoney(trendsData.projected_month_total);

  // 5. spending is up (the bigger the jump, the bigger the reaction)
  if (pct >= 100) {
    return {
      mood: "surprised",
      message: `Whoa${name}! That's double last month.`,
    };
  }
  if (pct >= 50) {
    return {
      mood: "worried",
      message: `Up ${pct}% from last month. At this pace: ${projected}.`,
    };
  }
  if (pct >= 10) {
    return {
      mood: "worried",
      message: pick([
        `Spending is up ${pct}% from last month.`,
        `A bit more than last month (+${pct}%)${name}.`,
      ]),
    };
  }
  if (pct > 0) {
    return {
      mood: "happy",
      message: `Only ${pct}% above last month. Steady!`,
    };
  }

  // 6. same as last month
  if (pct === 0) {
    return {
      mood: "happy",
      message: `Same as last month. Very consistent${name}!`,
    };
  }

  // 7. spending is down
  const down = Math.abs(pct);
  if (down >= 50) {
    return {
      mood: "playing",
      message: `Down ${down}% from last month! Zoomies!`,
    };
  }
  return {
    mood: "happy",
    message: `Down ${down}% from last month. Nice work${name}!`,
  };
}

function StatCard({ label, value, note }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4">{value}</Typography>
        {note && (
          <Typography variant="caption" color="text.secondary">
            {note}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// One chunky bar: label and note on top, the bar below.
// value / max decides how full the bar is.
function MoneyBar({ label, note, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          mb: 0.5,
        }}
      >
        <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          {note}
        </Typography>
      </Box>
      <Box
        sx={{
          height: 12,
          borderRadius: 999,
          bgcolor: "action.hover",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: pct + "%",
            height: "100%",
            borderRadius: 999,
            bgcolor: color,
          }}
        />
      </Box>
    </Box>
  );
}

// Top spending categories as bars. The bar width is the category's share of the total.
function CategoryBars({ categories }) {
  const sorted = [...categories].sort(
    (a, b) => Number(b.total) - Number(a.total),
  );
  const grandTotal = sorted.reduce((sum, c) => sum + Number(c.total), 0);

  return (
    <Card>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Typography variant="h5">Where your money went</Typography>
        {sorted.map((c) => {
          const pct =
            grandTotal > 0
              ? Math.round((Number(c.total) / grandTotal) * 100)
              : 0;
          return (
            <MoneyBar
              key={c.category_id}
              label={c.category}
              note={formatMoney(c.total) + " · " + pct + "%"}
              value={Number(c.total)}
              max={grandTotal}
              color="primary.main"
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

// Last month vs this month vs projected, as three bars on the same scale
function MonthBars({ thisMonth, changePct, projected }) {
  // last month isn't sent by the API, so we work it out from change_pct:
  // change_pct = (this - last) / last * 100  =>  last = this / (1 + pct/100)
  const hasLastMonth =
    changePct !== null && changePct !== undefined && changePct > -100;
  const lastMonth = hasLastMonth
    ? Math.round(Number(thisMonth) / (1 + changePct / 100))
    : null;

  const rows = [
    ...(hasLastMonth
      ? [{ label: "Last month", value: lastMonth, color: "text.secondary" }]
      : []),
    { label: "This month", value: Number(thisMonth), color: "primary.main" },
    {
      label: "Projected",
      value: Number(projected),
      color: "rgba(30, 215, 96, 0.45)",
    },
  ];
  const max = Math.max(...rows.map((r) => r.value));

  return (
    <Card>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Typography variant="h5">Month by month</Typography>
        {rows.map((r) => (
          <MoneyBar
            key={r.label}
            label={r.label}
            note={formatMoney(r.value)}
            value={r.value}
            max={max}
            color={r.color}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true); // first load
  const [refreshing, setRefreshing] = useState(false); // refresh button
  const [data, setData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [errors, setErrors] = useState([]);
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0];

  async function loadDashboard() {
    setRefreshing(true);

    // allSettled: if one request fails, the other one still gives us its data
    const [statsResult, trendsResult] = await Promise.allSettled([
      getDashboard(),
      getTrends(),
    ]);

    const newErrors = [];

    if (statsResult.status === "fulfilled") {
      setData(statsResult.value);
    } else {
      newErrors.push("Could not load expense stats");
    }

    if (trendsResult.status === "fulfilled") {
      setTrendsData(trendsResult.value);
    } else {
      newErrors.push("Could not load trends");
    }

    setErrors(newErrors);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const change = trendsData ? formatChange(trendsData.change_pct) : null;
  // const cat = data
  //   ? getCatState(data, trendsData)
  //   : { mood: "happy", message: "" };
  const cat = data
    ? getCatState(data, trendsData, firstName)
    : { mood: "happy", message: "" };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4, px: 2, pb: 6 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h3">Dashboard</Typography>
        <Button
          variant="outlined"
          onClick={loadDashboard}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </Box>

      {errors.map((msg) => (
        <Alert key={msg} severity="error" sx={{ mb: 2 }}>
          {msg}
        </Alert>
      ))}

      {data && (
        <>
          {/* Hero: the one number you care about, with the cat */}
          <Card
            sx={{
              mb: 3,
              p: { xs: 3, md: 4 },
              background:
                "linear-gradient(155deg, rgba(30,215,96,0.16), #181818 62%)",
              borderColor: "rgba(30,215,96,0.4)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Spent this month
            </Typography>
            <Typography variant="h2" sx={{ lineHeight: 1.1 }}>
              {formatMoney(data.total_this_month)}
            </Typography>
            {change && (
              <Typography sx={{ color: change.color, mb: 3 }}>
                {change.text}
              </Typography>
            )}
            <Mascot mood={cat.mood} size={64} message={cat.message} />
          </Card>

          {/* Smaller numbers */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              mb: 3,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            }}
          >
            <StatCard
              label="Total spent"
              value={formatMoney(data.total_spent)}
              note="All time"
            />
            {trendsData && (
              <StatCard
                label="Projected this month"
                value={formatMoney(trendsData.projected_month_total)}
                note="Based on this month so far"
              />
            )}
            <StatCard
              label="Expenses"
              value={data.total_expenses}
              note="Logged so far"
            />
          </Box>

          {data.category_breakdown.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 5 }}>
                <Typography>No expenses yet.</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Add your first one and this page comes alive.
                </Typography>
                <Button variant="contained" component={Link} to="/expenses">
                  Add your first expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: 3,
                gridTemplateColumns: { xs: "1fr", md: "3fr 2fr" },
                alignItems: "start",
              }}
            >
              <CategoryBars categories={data.category_breakdown} />
              {trendsData && (
                <MonthBars
                  thisMonth={data.total_this_month}
                  changePct={trendsData.change_pct}
                  projected={trendsData.projected_month_total}
                />
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export default Dashboard;
