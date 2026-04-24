import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { loginRequest } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const cookieOptions = { expires: 7, sameSite: 'strict' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ams2_user') || sessionStorage.getItem('ams2_user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (user) {
      const storage = user.rememberMe ? localStorage : sessionStorage;
      storage.setItem('ams2_user', JSON.stringify(user));
      if (user.rememberMe) {
        Cookies.set('ams2_token', user.token, cookieOptions);
      } else {
        Cookies.set('ams2_token', user.token);
      }
    } else {
      localStorage.removeItem('ams2_user');
      sessionStorage.removeItem('ams2_user');
      Cookies.remove('ams2_token');
    }
  }, [user]);

  const login = async (payload) => {
    const data = await loginRequest(payload);
    const nextUser = {
      token: data.token,
      refreshToken: data.refreshToken,
      role: data.role,
      userId: data.userId,
      email: payload.email,
      rememberMe: payload.rememberMe,
    };
    setUser(nextUser);
    toast.success('Welcome back');
    return nextUser;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
