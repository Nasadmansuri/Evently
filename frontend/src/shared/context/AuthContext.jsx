import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function handleAuthExpired() {
      setUser(null);
    }
    window.addEventListener('evently:auth_expired', handleAuthExpired);

    const token = localStorage.getItem('evently_token');
    if (!token) {
      setLoading(false);
      return () => window.removeEventListener('evently:auth_expired', handleAuthExpired);
    }
    api.get('/users/me')
      .then((res) => setUser(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('evently_token');
          setUser(null);
        }
        // Any other error (network blip, backend restarting, CORS hiccup)
        // leaves the token intact so the user isn't logged out over a transient failure.
      })
      .finally(() => setLoading(false));

    return () => window.removeEventListener('evently:auth_expired', handleAuthExpired);
  }, []);

  function login(userData, token) {
    if (token) {
      localStorage.setItem('evently_token', token);
    }
    setUser(userData);
  }

  function updateUser(userData) {
    setUser((prev) => ({ ...(prev || {}), ...userData }));
  }

  function logout() {
    localStorage.removeItem('evently_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}