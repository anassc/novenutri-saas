import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { getPacienteDetails } from '../lib/api';
import {
  ArrowLeft,
  Loader2,
  User,
  Calendar,
  AlertCircle,
  Clock,
  Activity,
} from 'lucide-react';

export const PacientePerfil: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessionToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['pacienteDetails', id, sessionToken],
    queryFn: () => getPacienteDetails(id || '', sessionToken || undefined),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-emerald-600" />
        <span>Carregando prontuário do paciente...</span>
      </div>
    );
  }

  const paciente = data?.paciente;
  const consultas = data?.consultas || [];

  if (!paciente) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Paciente não encontrado</h2>
        <p className="text-sm text-slate-500">
          O registro do paciente solicitado não foi localizado ou não pertence à sua conta.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar</span>
      </button>

      {/* Patient Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-200 text-emerald-700 font-extrabold text-2xl flex items-center justify-center shrink-0">
            {paciente.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{paciente.nome}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              {paciente.sexo && <span className="capitalize">{paciente.sexo}</span>}
              {paciente.data_nascimento && (
                <span>
                  • Nascido(a) em {new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}
                </span>
              )}
              <span>• Cadastrado em {new Date(paciente.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal info & Biometrics */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Contato & Dados Gerais</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">WhatsApp</span>
                <span className="font-medium text-slate-700">{paciente.whatsapp || 'Não informado'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">E-mail</span>
                <span className="font-medium text-slate-700">{paciente.email || 'Não informado'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Nível de Atividade</span>
                <span className="font-medium text-slate-700 capitalize">
                  {paciente.nivel_atividade || 'Não informado'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Medidas Iniciais</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 block">Peso Inicial</span>
                <span className="text-lg font-bold text-slate-800">
                  {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '—'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 block">Altura</span>
                <span className="text-lg font-bold text-slate-800">
                  {paciente.altura ? `${paciente.altura} m` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Consultas History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 pb-4 border-b border-slate-100 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Histórico de Consultas</span>
            </h3>

            {consultas.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm">Nenhuma consulta registrada para este paciente.</p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {consultas.map((consulta) => (
                  <div
                    key={consulta.id}
                    className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        Consulta de {new Date(consulta.data_consulta).toLocaleDateString('pt-BR')}
                      </span>
                      {consulta.proximo_retorno && (
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                          Próximo retorno: {new Date(consulta.proximo_retorno).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Peso</span>
                        <span className="font-semibold text-slate-700">
                          {consulta.peso ? `${consulta.peso} kg` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Cintura</span>
                        <span className="font-semibold text-slate-700">
                          {consulta.cintura ? `${consulta.cintura} cm` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">% Gordura</span>
                        <span className="font-semibold text-slate-700">
                          {consulta.percentual_gordura ? `${consulta.percentual_gordura}%` : '—'}
                        </span>
                      </div>
                    </div>

                    {consulta.observacoes && (
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                        {consulta.observacoes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
