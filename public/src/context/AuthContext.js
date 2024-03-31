import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { loginRoute, registerRoute, logoutRoute } from '../utils/APIRoutes';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const { data } = await axios.post(loginRoute, { username, password });
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setCurrentUser(data.user);
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const register = async (username, email, password) => {
    try {
      const { data } = await axios.post(registerRoute, { username, email, password });
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setCurrentUser(data.user);
        navigate("/");
      }
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
    axios.get(logoutRoute + "/" + currentUser._id);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
