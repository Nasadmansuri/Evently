import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('evently_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/users/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('evently_token'))
      .finally(() => setLoading(false));
  }, []);

  function login(userData, token) {
    localStorage.setItem('evently_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('evently_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}