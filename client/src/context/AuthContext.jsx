import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Register a new account
  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  };

  // Log in an existing user
  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);

    const {
      token: accessToken,
      user: authenticatedUser,
    } = response.data.data;

    setToken(accessToken);
    setUser(authenticatedUser);

    api.defaults.headers.common.Authorization =
      `Bearer ${accessToken}`;

    return authenticatedUser;
  };

  // Log out the current user
  const logout = () => {
    setUser(null);
    setToken(null);

    delete api.defaults.headers.common.Authorization;
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom authentication hook
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
};