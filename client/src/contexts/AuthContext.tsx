import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '@/services/api';
import { User as FirebaseUser } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';

interface User {
  id?: number;
  email: string;
  name: string;
  firebaseUid?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithFirebase: (firebaseUser: FirebaseUser) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    // Listen for Firebase authentication state changes
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user exists in our backend
          const backendUser = await api.get('user');
          setUser(backendUser);
        } catch {
          // If not, attempt to register/login with Firebase user
          try {
            await loginWithFirebase(firebaseUser);
          } catch (err) {
            console.error("Error syncing Firebase user:", err);
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await api.post('login', { email, password });
      setUser(response);
    } catch (error: any) {
      setError(error?.message || 'Failed to login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithFirebase = async (firebaseUser: FirebaseUser) => {
    setLoading(true);
    clearError();
    
    try {
      // Fetch ID token with additional options
      const idToken = await firebaseUser.getIdToken(/* forceRefresh */ true);
      
      // Log additional user information
      console.log('Firebase User:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      });
      
      // Send Firebase token to backend for authentication
      const response = await api.post('login/firebase', { 
        idToken,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        firebaseUid: firebaseUser.uid
      });
      
      setUser({
        id: response.id,
        email: response.email,
        name: response.name || firebaseUser.displayName || '',
        firebaseUid: firebaseUser.uid
      });
      
      return response;
    } catch (error: any) {
      // More detailed error logging
      console.error('Firebase Login Error:', {
        message: error.message,
        response: error.response,
        status: error.response?.status
      });
      
      setError(error?.message || 'Failed to login with Firebase');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    setLoading(true);
    clearError();
    
    try {
      await api.post('register', { email, password, name });
      // Auto login after registration
      await login(email, password);
    } catch (error: any) {
      setError(error?.message || 'Failed to register');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    clearError();
    
    try {
      // Logout from backend
      await api.post('logout', {});
      
      // Logout from Firebase
      await firebaseAuth.signOut();
      
      setUser(null);
    } catch (error: any) {
      setError(error?.message || 'Failed to logout');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Add a loading state to prevent white screen
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      loginWithFirebase, 
      register, 
      logout, 
      error, 
      clearError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};