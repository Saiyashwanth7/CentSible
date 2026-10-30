// this tells the whole frontend if the user has been logged in or not

import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "../api/user";
import { setUnauthorizedHandler } from "../api/index";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    setUnauthorizedHandler(() => setUser(null)); //setUnauthorized is calling this setUser,  onUnauthorized will use this funciton now and automatically logs out the user if api response is 401 and path not in NO_REFRESH_PATHS
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
