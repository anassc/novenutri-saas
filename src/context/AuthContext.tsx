import React, { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from '../lib/auth';
import { Nutricionista } from '../types';
import { getNutricionistaProfile, createNutricionistaProfile } from '../lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  nutricionista: Nutricionista | null;
  sessionToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (nome: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [nutricionista, setNutricionista] = useState<Nutricionista | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true);
        // Call authClient to get current session
        const sessionRes = await (authClient as any).getSession?.();
        if (sessionRes?.data?.session) {
          const sessionUser = sessionRes.data.user;
          const token = sessionRes.data.session.token || sessionRes.data.session.id;
          
          setUser({
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name,
          });
          setSessionToken(token);

          // Fetch nutricionista profile
          const profile = await getNutricionistaProfile(sessionUser.id, token);
          setNutricionista(
            profile || {
              id: sessionUser.id,
              nome: sessionUser.name || 'Nutricionista',
              email: sessionUser.email,
              created_at: new Date().toISOString(),
            }
          );
        } else {
          // Check local storage fallback for demo/persistent session state if needed
          const storedUser = localStorage.getItem('novenutri_user');
          const storedToken = localStorage.getItem('novenutri_token');
          if (storedUser && storedToken) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setSessionToken(storedToken);
            const profile = await getNutricionistaProfile(parsedUser.id, storedToken);
            setNutricionista(
              profile || {
                id: parsedUser.id,
                nome: parsedUser.name || 'Nutricionista',
                email: parsedUser.email,
                created_at: new Date().toISOString(),
              }
            );
          }
        }
      } catch (err) {
        console.warn('Session init check failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await (authClient as any).signIn?.email({
        email,
        password,
      });

      if (res?.error) {
        return {
          success: false,
          error: res.error.message || 'Email ou senha incorretos.',
        };
      }

      const userData = res?.data?.user || { id: res?.data?.session?.userId || 'usr_' + Date.now(), email };
      const token = res?.data?.session?.token || res?.data?.session?.id || 'token_' + Date.now();

      const userObj = {
        id: userData.id,
        email: userData.email,
        name: userData.name || email.split('@')[0],
      };

      setUser(userObj);
      setSessionToken(token);

      localStorage.setItem('novenutri_user', JSON.stringify(userObj));
      localStorage.setItem('novenutri_token', token);

      const profile = await getNutricionistaProfile(userData.id, token);
      setNutricionista(
        profile || {
          id: userData.id,
          nome: userObj.name,
          email: userObj.email,
          created_at: new Date().toISOString(),
        }
      );

      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      return {
        success: false,
        error: 'Email ou senha incorretos.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (nome: string, email: string, password: string) => {
    try {
      setIsLoading(true);

      // 1. Neon Auth signup
      const res = await (authClient as any).signUp?.email({
        email,
        password,
        name: nome,
      });

      if (res?.error) {
        if (res.error.message?.includes('already exists') || res.error.status === 422) {
          return { success: false, error: 'Este email já está cadastrado.' };
        }
        return { success: false, error: res.error.message || 'Não foi possível criar sua conta. Tente novamente.' };
      }

      const userId = res?.data?.user?.id || 'usr_' + Date.now();
      const token = res?.data?.session?.token || res?.data?.session?.id || 'token_' + Date.now();

      const userObj = { id: userId, email, name: nome };
      setUser(userObj);
      setSessionToken(token);

      localStorage.setItem('novenutri_user', JSON.stringify(userObj));
      localStorage.setItem('novenutri_token', token);

      // 2. Create profile in `nutricionistas` table (without password!)
      try {
        const profile = await createNutricionistaProfile({ id: userId, nome, email }, token);
        setNutricionista(profile);
      } catch (dbErr) {
        console.warn('Profile creation in DB warn:', dbErr);
        setNutricionista({
          id: userId,
          nome,
          email,
          created_at: new Date().toISOString(),
        });
      }

      return { success: true };
    } catch (err: any) {
      console.error('Signup error:', err);
      return {
        success: false,
        error: 'Não foi possível criar sua conta. Tente novamente.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await (authClient as any).signOut?.();
    } catch (err) {
      console.warn('Signout warn:', err);
    } finally {
      setUser(null);
      setNutricionista(null);
      setSessionToken(null);
      localStorage.removeItem('novenutri_user');
      localStorage.removeItem('novenutri_token');
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        nutricionista,
        sessionToken,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
