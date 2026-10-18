// import { Link } from "react-router-dom";

// function Login() {
//   return (
//     <div>
//       <h1>Login page</h1>
//       <Link to="/">Landing ki vellu</Link>
//     </div>
//   );
// }

// export default Login;

import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  function handleLogin() {
    // asalu lo ikkada backend login call untundi
    navigate("/");
  }

  return (
    <div>
      <h1>Login page</h1>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
