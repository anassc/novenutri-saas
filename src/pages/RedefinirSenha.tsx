import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Leaf, Loader2, Lock, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Por favor, confirme sua nova senha.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export const RedefinirSenha: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetFormValues) => {
    setFormError(null);
    setSuccessMessage(null);

    if (!token) {
      setFormError('Token de recuperação ausente ou inválido na URL.');
      return;
    }

    try {
      const response = await fetch('/api/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          newPassword: data.password,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setFormError(resData.error || 'Não foi possível redefinir sua senha.');
      } else {
        setSuccessMessage(resData.message || 'Senha redefinida com sucesso!');
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setFormError('Erro ao se comunicar com o servidor. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo Header */}
        <div className="inline-flex items-center justify-center space-x-2 mb-3">
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-md shadow-emerald-600/20">
            <Leaf className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">NoveNutri</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Criar Nova Senha</h2>
        <p className="mt-1 text-sm text-slate-500">
          {email ? `Redefinição para ${email}` : 'Insira sua nova senha de acesso'}
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

          {successMessage ? (
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">Senha Alterada com Sucesso!</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{successMessage}</p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md shadow-emerald-600/20 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
                >
                  Fazer Login com a Nova Senha
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Nova Senha
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    {...register('password')}
                    className={`block w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      errors.password
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                    }`}
                  />
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repita a nova senha"
                    {...register('confirmPassword')}
                    className={`block w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      errors.confirmPassword
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword.message}</p>
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
                      Redefinindo...
                    </>
                  ) : (
                    'Salvar Nova Senha'
                  )}
                </button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Cancelar
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
