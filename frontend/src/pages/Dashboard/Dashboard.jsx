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
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboard } from "../../api/expenses";
import { getTrends } from "../../api/insights";
import Mascot from "../../components/Mascot/Mascot";

// Chart colors. Category index ki oka color vasthundi, list aipothe malli modatlo nundi.
const COLORS = [
  "#1976d2",
  "#9c27b0",
  "#ed6c02",
  "#2e7d32",
  "#d32f2f",
  "#0288d1",
  "#6d4c41",
];

function formatMoney(value) {
  // Number(value || 0): value null/undefined aithe crash avvakunda 0 avthundi
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

function StatCard({ label, value, note, noteColor }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5">{value}</Typography>
        {note && (
          <Typography variant="caption" color={noteColor || "text.secondary"}>
            {note}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// Category donut chart + pakkana legend list
function CategoryChart({ categories }) {
  // Recharts ki { name, value } format lo data kavali, so map chestham
  const chartData = categories.map((c) => ({
    name: c.category,
    value: Number(c.total),
  }));
  const grandTotal = chartData.reduce((sum, c) => sum + c.value, 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          By category
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            gap: 2,
          }}
        >
          {/* ResponsiveContainer: parent width ki thaggattu chart size automatic ga marthundi */}
          <Box sx={{ width: { xs: "100%", md: "50%" }, height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* innerRadius pettaam kabatti pie donut avthundi */}
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          <Box sx={{ flex: 1, width: "100%" }}>
            {categories.map((c, i) => {
              const pct =
                grandTotal > 0
                  ? Math.round((Number(c.total) / grandTotal) * 100)
                  : 0;
              return (
                <Box
                  key={c.category_id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 0.5,
                  }}
                >
                  {/* Chinna colored dot, chart color tho match avthundi */}
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: COLORS[i % COLORS.length],
                    }}
                  />
                  <Typography sx={{ flex: 1 }}>{c.category}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {c.count} expenses
                  </Typography>
                  <Typography sx={{ minWidth: 90, textAlign: "right" }}>
                    {formatMoney(c.total)} ({pct}%)
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Last month vs this month vs projected bar chart
function MonthComparison({ thisMonth, changePct, projected }) {
  // Last month direct ga API nundi radhu. change_pct nundi lekka vestham:
  // change_pct = (this - last) / last * 100  =>  last = this / (1 + pct/100)
  const hasLastMonth =
    changePct !== null && changePct !== undefined && changePct > -100;
  const lastMonth = hasLastMonth ? thisMonth / (1 + changePct / 100) : null;

  const barData = [
    ...(hasLastMonth
      ? [{ name: "Last month", amount: Math.round(lastMonth) }]
      : []),
    { name: "This month", amount: Number(thisMonth) },
    { name: "Projected", amount: Number(projected) },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Month comparison
        </Typography>
        <Box sx={{ width: "100%", height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(v) => "₹" + v.toLocaleString("en-IN")}
                width={80}
              />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true); // first load kosam
  const [refreshing, setRefreshing] = useState(false); // refresh button kosam
  const [data, setData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [errors, setErrors] = useState([]);

  async function loadDashboard() {
    setRefreshing(true);

    // Promise.allSettled: Promise.all la kaadu, okati fail aina migilinavi vasthay.
    // Prathi result { status: "fulfilled", value } leda { status: "rejected", reason }
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

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4, px: 2 }}>
      {/* Title left, refresh button right */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Dashboard</Typography>
        <Button
          variant="outlined"
          onClick={loadDashboard}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </Box>
      <Mascot mood="happy" message="Hi! I'm keeping an eye on your wallet." />
      {errors.map((msg) => (
        <Alert key={msg} severity="error" sx={{ mb: 2 }}>
          {msg}
        </Alert>
      ))}

      {/* Stat cards: data unte matrame chupistham. Trends fail aina Total spent kanipisthundi */}
      {data && (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            mb: 3,
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          }}
        >
          <StatCard label="Total spent" value={formatMoney(data.total_spent)} />
          <StatCard
            label="This month"
            value={formatMoney(data.total_this_month)}
            note={change?.text}
            noteColor={change?.color}
          />
          {trendsData && (
            <StatCard
              label="Projected this month"
              value={formatMoney(trendsData.projected_month_total)}
              note="Based on this month so far"
            />
          )}
          <StatCard label="Expenses" value={data.total_expenses} />
        </Box>
      )}

      {data && data.category_breakdown.length === 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography sx={{ mb: 1 }}>No expenses yet.</Typography>
          <Button variant="contained" component={Link} to="/expenses">
            Add your first expense
          </Button>
        </Box>
      )}

      {data && data.category_breakdown.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr" },
          }}
        >
          <CategoryChart categories={data.category_breakdown} />
          {trendsData && (
            <MonthComparison
              thisMonth={data.total_this_month}
              changePct={trendsData.change_pct}
              projected={trendsData.projected_month_total}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

export default Dashboard;
