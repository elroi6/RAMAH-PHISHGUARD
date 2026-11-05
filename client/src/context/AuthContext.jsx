import { useState } from "react";
import AuthContext from "./authContext";
import api from "../services/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  };

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
