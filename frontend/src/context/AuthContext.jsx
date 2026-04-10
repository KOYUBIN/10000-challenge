import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const t = await u.getIdToken();
        setToken(t);
      } else {
        setToken(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  const getToken = async () => {
    if (!user) return null;
    const t = await user.getIdToken(true);
    setToken(t);
    return t;
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, loginWithGoogle, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
