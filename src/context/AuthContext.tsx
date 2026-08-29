import React, { createContext, useEffect, useState } from 'react';
import { authClient, getJWTToken } from '../lib/auth';
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

  // Helper to fetch JWT token
  const fetchValidJWT = async (): Promise<string | null> => {
    try {
      const sessionRes = await (authClient as any).getSession?.();
      if (sessionRes?.data?.session?.token) {
        return sessionRes.data.session.token;
      }
      const token = await getJWTToken();
      return token;
    } catch {
      return null;
    }
  };

  // Restore session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true);
        // Call authClient to get current session
        const sessionRes = await (authClient as any).getSession?.();
        if (sessionRes?.data?.session && sessionRes?.data?.user) {
          const sessionUser = sessionRes.data.user;
          const token = sessionRes.data.session.token || (await fetchValidJWT());

          const userObj: User = {
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name || sessionUser.email.split('@')[0],
          };

          setUser(userObj);
          setSessionToken(token);
          localStorage.setItem('novenutri_user', JSON.stringify(userObj));
          if (token) localStorage.setItem('novenutri_token', token);

          // Fetch nutricionista profile from DB
          const profile = await getNutricionistaProfile(sessionUser.id, token || undefined);
          setNutricionista(
            profile || {
              id: sessionUser.id,
              nome: userObj.name || 'Nutricionista',
              email: sessionUser.email,
              created_at: new Date().toISOString(),
            }
          );
        } else {
          // Check local storage fallback
          const storedUser = localStorage.getItem('novenutri_user');
          const storedToken = localStorage.getItem('novenutri_token');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setSessionToken(storedToken);
            const profile = await getNutricionistaProfile(parsedUser.id, storedToken || undefined);
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

      const sessionRes = await (authClient as any).getSession?.();
      const jwtToken = sessionRes?.data?.session?.token || (await fetchValidJWT()) || res?.data?.token;
      const userData = res?.data?.user || sessionRes?.data?.user || { id: 'usr_' + Date.now(), email };

      const userObj = {
        id: userData.id,
        email: userData.email,
        name: userData.name || email.split('@')[0],
      };

      setUser(userObj);
      setSessionToken(jwtToken);

      localStorage.setItem('novenutri_user', JSON.stringify(userObj));
      if (jwtToken) localStorage.setItem('novenutri_token', jwtToken);

      const profile = await getNutricionistaProfile(userData.id, jwtToken || undefined);
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
      const msg = err?.message || '';
      let userFriendlyError = 'Email ou senha incorretos.';
      if (msg.includes('Invalid') || msg.includes('password') || msg.includes('credential')) {
        userFriendlyError = 'Email ou senha incorretos.';
      } else if (msg.includes('User not found')) {
        userFriendlyError = 'Conta não encontrada. Cadastre-se primeiro.';
      }
      return {
        success: false,
        error: userFriendlyError,
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
        const errorMsg = res.error.message || '';
        if (errorMsg.includes('already exists') || res.error.status === 422) {
          return { success: false, error: 'Este email já está cadastrado. Faça login ou use outro email.' };
        }
        return { success: false, error: res.error.message || 'Não foi possível criar sua conta. Tente novamente.' };
      }

      // 2. Fetch session and JWT
      const sessionRes = await (authClient as any).getSession?.();
      const jwtToken = sessionRes?.data?.session?.token || (await fetchValidJWT()) || res?.data?.token;
      const userId = res?.data?.user?.id || sessionRes?.data?.user?.id || 'usr_' + Date.now();

      const userObj = { id: userId, email, name: nome };
      setUser(userObj);
      setSessionToken(jwtToken);

      localStorage.setItem('novenutri_user', JSON.stringify(userObj));
      if (jwtToken) localStorage.setItem('novenutri_token', jwtToken);

      // 3. Create profile in `nutricionistas` table in database
      try {
        const profile = await createNutricionistaProfile({ id: userId, nome, email }, jwtToken || undefined);
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
      const msg = err?.message || '';
      let userFriendlyError = 'Não foi possível criar sua conta. Tente novamente.';
      if (msg.includes('already exists') || err?.status === 422) {
        userFriendlyError = 'Este email já está cadastrado. Faça login ou use outro email.';
      } else if (msg.includes('Password') || msg.includes('password')) {
        userFriendlyError = 'A senha precisa ter pelo menos 6 caracteres.';
      } else if (msg) {
        userFriendlyError = msg;
      }
      return {
        success: false,
        error: userFriendlyError,
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

export { AuthContext };

