import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { PublicRoute } from './components/PublicRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/Layout/AppLayout';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { RecuperarSenha } from './pages/RecuperarSenha';
import { RedefinirSenha } from './pages/RedefinirSenha';
import { Dashboard } from './pages/Dashboard';
import { Pacientes } from './pages/Pacientes';
import { NovoPaciente } from './pages/NovoPaciente';
import { PacientePerfil } from './pages/PacientePerfil';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <PWAInstallPrompt />
          <Routes>
            {/* Public Routes (Redirect to /dashboard if logged in) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            </Route>

            {/* Protected Routes (Redirect to /login if not logged in) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pacientes" element={<Pacientes />} />
                <Route path="/pacientes/novo" element={<NovoPaciente />} />
                <Route path="/pacientes/:id" element={<PacientePerfil />} />
              </Route>
            </Route>

            {/* Catch-all Fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
