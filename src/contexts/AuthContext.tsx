import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { hasLocalData, transferLocalDataToFirebase } from '../lib/data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  transferData: () => Promise<void>;
  hasLocal: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  transferData: async () => {},
  hasLocal: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLocal, setHasLocal] = useState(false);

  useEffect(() => {
    const checkLocal = async () => {
      const has = await hasLocalData();
      setHasLocal(has);
    };
    checkLocal();

    window.addEventListener('localDataChanged', checkLocal);
    return () => window.removeEventListener('localDataChanged', checkLocal);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!user && hasLocal) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, hasLocal]);

  const logout = async () => {
    await signOut(auth);
  };

  const transferData = async () => {
    if (user) {
      await transferLocalDataToFirebase(user.uid);
      setHasLocal(false);
      // Force reload to fetch from Firebase
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, transferData, hasLocal }}>
      {children}
    </AuthContext.Provider>
  );
};
