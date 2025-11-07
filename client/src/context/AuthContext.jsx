import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, register, getProfile } from '../services/authApi';

const AuthContext = createContext();

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Basic check: we could call getProfile here for full validation
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const userData = await login(email, password);
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      const userData = await register(username, email, password);
      // Automatically log in after registration
      await handleLogin(email, password);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login: handleLogin, register: handleRegister, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };