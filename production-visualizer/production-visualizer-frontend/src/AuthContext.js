// AuthContext.js
import React, { createContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      toast.success('Logged in successfully!');
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Failed to log in.');
    }
  };

  const register = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/register`, { username, password });
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      toast.success('Registered successfully!');
    } catch (error) {
      console.error('Error registering:', error);
      toast.error('Failed to register.');
    }
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
  };

  return (
    <AuthContext.Provider value={{ token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
