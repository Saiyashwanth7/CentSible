import { getDashboard } from "../../api/expenses";
import { useState, useEffect } from "react";
import { Box, Typography, TextField, MenuItem, Button } from "@mui/material";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  // useEffect(() => {
  //   getDashboard()
  //     .then((result) => setData(result))
  //     .catch(() => setErr("Error occured while generating the dashboard"))
  //     .finally(() => setLoading(false));
  // }, []);
  async function loadDashboard() {
    try {
      const result = await getDashboard();
      setData(result);
      setErr("");
    } catch (error) {
      setErr("Error occurred while generating the dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }
  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Dashboard
      </Typography>

      {err && <Typography color="error">{err}</Typography>}
      <Button onClick={loadDashboard}>Refresh</Button>
      {data && (
        <>
          <Box sx={{ display: "flex", gap: 4, mb: 4 }}>
            <Box>
              <Typography variant="body2">Total spent</Typography>
              <Typography variant="h5">{data.total_spent}</Typography>
            </Box>
            <Box>
              <Typography variant="body2">This month</Typography>
              <Typography variant="h5">{data.total_this_month}</Typography>
            </Box>
            <Box>
              <Typography variant="body2">Expenses</Typography>
              <Typography variant="h5">{data.total_expenses}</Typography>
            </Box>
          </Box>

          <Typography variant="h6">By category</Typography>
          {data.category_breakdown.map((c) => (
            <Typography key={c.category_id}>
              {c.category}: {c.total} ({c.count} expenses)
            </Typography>
          ))}
        </>
      )}
    </Box>
  );
}

export default Dashboard;
