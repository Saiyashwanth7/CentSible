import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Landing() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Landing page</h1>
      {user ? <p>Hi, {user.name}</p> : <p>Login avvaledu</p>}
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
    </div>
  );
}

export default Landing;
