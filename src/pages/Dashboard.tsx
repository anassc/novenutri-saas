import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import {
  getPacientesTotal,
  getConsultasSemanaCount,
  getPacientesSemRetornoList,
} from '../lib/api';
import {
  Users,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { nutricionista, sessionToken } = useAuth();

  // Card 1 Query: Total de pacientes ativos
  const {
    data: totalPacientes = 0,
    isLoading: isLoadingPacientes,
    refetch: refetchPacientes,
  } = useQuery({
    queryKey: ['totalPacientes', sessionToken],
    queryFn: () => getPacientesTotal(sessionToken || undefined),
    refetchInterval: 30000,
  });

  // Card 2 Query: Consultas da semana
  const {
    data: consultasSemana = 0,
    isLoading: isLoadingConsultas,
    refetch: refetchConsultas,
  } = useQuery({
    queryKey: ['consultasSemana', sessionToken],
    queryFn: () => getConsultasSemanaCount(sessionToken || undefined),
    refetchInterval: 30000,
  });

  // Card 3 Query: Pacientes sem retorno
  const {
    data: pacientesSemRetorno = [],
    isLoading: isLoadingSemRetorno,
    refetch: refetchSemRetorno,
  } = useQuery({
    queryKey: ['pacientesSemRetorno', sessionToken],
    queryFn: () => getPacientesSemRetornoList(sessionToken || undefined),
    refetchInterval: 30000,
  });

  const handleRefreshAll = () => {
    refetchPacientes();
    refetchConsultas();
    refetchSemRetorno();
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Olá, {nutricionista?.nome || 'Nutricionista'}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aqui está o resumo atualizado do seu consultório hoje.
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-emerald-600" />
          <span>Atualizar dados</span>
        </button>
      </div>

      {/* Grid of 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 — Total de pacientes ativos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-600">Total de pacientes ativos</span>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            {isLoadingPacientes ? (
              <div className="flex items-center space-x-2 text-slate-400 py-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : (
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {totalPacientes}
                </span>
                <span className="text-xs font-medium text-slate-500">pacientes</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Cadastrados no sistema</span>
            <button
              onClick={() => navigate('/pacientes')}
              className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center"
            >
              Ver todos <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Card 2 — Consultas da semana */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-600">Consultas da semana</span>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            {isLoadingConsultas ? (
              <div className="flex items-center space-x-2 text-slate-400 py-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            ) : (
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {consultasSemana}
                </span>
                <span className="text-xs font-medium text-slate-500">atendimentos</span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>Registrados na semana atual</span>
          </div>
        </div>

        {/* Card 3 — Pacientes sem retorno */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-all md:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-slate-600">Pacientes sem retorno</span>
                {pacientesSemRetorno.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    {pacientesSemRetorno.length}
                  </span>
                )}
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* List of Pacientes sem retorno */}
            {isLoadingSemRetorno ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Buscando registros...</span>
              </div>
            ) : pacientesSemRetorno.length === 0 ? (
              <div className="py-8 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  Nenhum paciente sem retorno no momento
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {pacientesSemRetorno.map((paciente) => (
                  <div
                    key={paciente.id}
                    onClick={() => navigate(`/pacientes/${paciente.id}`)}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {paciente.nome}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Última consulta: {new Date(paciente.ultima_consulta).toLocaleDateString('pt-BR')} ({paciente.dias_sem_consulta} dias atrás)
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>Última consulta há &gt; 30 dias sem retorno agendado</span>
          </div>
        </div>
      </div>
    </div>
  );
};
