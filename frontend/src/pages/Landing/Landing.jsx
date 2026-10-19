import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../../api/user";

function Landing() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser()
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

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
