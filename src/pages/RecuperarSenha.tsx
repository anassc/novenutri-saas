import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Leaf, Loader2, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const recoverySchema = z.object({
  email: z
    .string()
    .min(1, { message: 'O email é obrigatório.' })
    .email({ message: 'Por favor, insira um email válido.' }),
});

type RecoveryFormValues = z.infer<typeof recoverySchema>;

export const RecuperarSenha: React.FC = () => {
  const [formError, setFormError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; link?: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryFormValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: RecoveryFormValues) => {
    setFormError(null);
    setSuccessInfo(null);

    try {
      const response = await fetch('/api/solicitar-recuperacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setFormError(resData.error || 'Não foi possível solicitar a recuperação de senha.');
      } else {
        setSuccessInfo({
          message: resData.message || 'Link de recuperação enviado com sucesso!',
          link: resData.link,
        });
      }
    } catch (err: any) {
      console.error('Error requesting password recovery:', err);
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
        <h2 className="text-xl font-semibold text-slate-800">Recuperação de Senha</h2>
        <p className="mt-1 text-sm text-slate-500">
          Informe seu e-mail para receber um link seguro de redefinição
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

          {successInfo ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-900">Solicitação Enviada!</p>
                  <p className="text-xs text-emerald-700">{successInfo.message}</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o Login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  E-mail cadastrado
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
                {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
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
                      Enviando...
                    </>
                  ) : (
                    'Enviar Link de Recuperação'
                  )}
                </button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Voltar ao Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
