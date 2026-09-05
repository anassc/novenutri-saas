import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Leaf, Loader2, Lock, Mail, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'O email é obrigatório.' })
    .email({ message: 'Por favor, insira um email válido.' }),
  password: z
    .string()
    .min(1, { message: 'A senha é obrigatória.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setFormError(null);
    const result = await login(data.email, data.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setFormError(result.error || 'Email ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-max-w-md text-center">
        {/* Brand Logo Header */}
        <div className="inline-flex items-center justify-center space-x-2 mb-3">
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-md shadow-emerald-600/20">
            <Leaf className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">NoveNutri</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Acesse sua conta</h2>
        <p className="mt-1 text-sm text-slate-500">
          Plataforma de gestão inteligente para nutricionistas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 sm:rounded-2xl sm:px-10">
          {formError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/70 flex items-start space-x-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                E-mail
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu.email@exemplo.com"
                  {...register('email')}
                  className={`block w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Senha
                </label>
                <Link
                  to="/recuperar-senha"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`block w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md shadow-emerald-600/10 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">Não tem conta? </span>
            <Link to="/cadastro" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Cadastre-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
