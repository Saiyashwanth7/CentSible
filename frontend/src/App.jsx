// // we store all the api urls here and use them from here

// import { useEffect, useState } from "react";
// import { getCurrentUser } from "./api/user";

// function App() {
//   const [result, setResult] = useState("loading...");

//   useEffect(() => {
//     getCurrentUser()
//       .then((data) => setResult(JSON.stringify(data)))
//       .catch((err) => setResult("Error: " + err.message));
//   }, []);

//   return <p>{result}</p>;
// }

// export default App;

import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing/Landing";
import Login from "./pages/Auth/Login";
import NotFound from "./pages/NotFound/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
