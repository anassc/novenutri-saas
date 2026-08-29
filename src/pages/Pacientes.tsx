import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { getPacientesList } from '../lib/api';
import {
  Users,
  Loader2,
  ChevronRight,
  Search,
  Plus,
  Calendar,
  Target,
  X,
  Phone,
  Mail,
} from 'lucide-react';

export const Pacientes: React.FC = () => {
  const navigate = useNavigate();
  const { sessionToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientesList', sessionToken],
    queryFn: () => getPacientesList(sessionToken || undefined),
  });

  // Filter patients by search term in real-time
  const filteredPacientes = useMemo(() => {
    if (!searchTerm.trim()) return pacientes;
    const term = searchTerm.toLowerCase().trim();
    return pacientes.filter((p) =>
      p.nome.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.objetivos && p.objetivos.some((o) => o.toLowerCase().includes(term)))
    );
  }, [pacientes, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pacientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie e acompanhe todos os pacientes cadastrados
          </p>
        </div>

        <button
          onClick={() => navigate('/pacientes/novo')}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/10 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Paciente</span>
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar paciente por nome ou objetivo..."
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-slate-500 shrink-0">
          Total: <span className="text-slate-900 font-bold">{filteredPacientes.length}</span> {filteredPacientes.length === 1 ? 'paciente' : 'pacientes'}
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-emerald-600" />
          <span className="text-sm font-medium">Carregando lista de pacientes...</span>
        </div>
      ) : pacientes.length === 0 ? (
        /* Empty State: No Patients */
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Nenhum paciente cadastrado ainda</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Comece cadastrando o primeiro paciente para gerenciar consultas, planos alimentares e evolução clínica.
            </p>
          </div>
          <button
            onClick={() => navigate('/pacientes/novo')}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Paciente</span>
          </button>
        </div>
      ) : filteredPacientes.length === 0 ? (
        /* Empty Search State */
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <Search className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Nenhum paciente encontrado para "{searchTerm}"</h3>
          <p className="text-xs text-slate-500">Tente buscar por outro termo ou limpe o campo de busca.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            Limpar busca
          </button>
        </div>
      ) : (
        /* Patient Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPacientes.map((paciente) => {
            const displayObjectives = paciente.objetivos && paciente.objetivos.length > 0
              ? paciente.objetivos
              : paciente.objetivo_texto
              ? [paciente.objetivo_texto]
              : null;

            return (
              <div
                key={paciente.id}
                onClick={() => navigate(`/pacientes/${paciente.id}`)}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top Avatar & Name */}
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold text-lg flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      {paciente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {paciente.nome}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                        {paciente.sexo && <span className="capitalize">{paciente.sexo}</span>}
                        {paciente.sexo && <span>•</span>}
                        <span>Cadastrado em {new Date(paciente.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Objective (Objetivo) */}
                  <div className="mb-3.5">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Objetivo
                    </span>
                    {displayObjectives && displayObjectives.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {displayObjectives.slice(0, 2).map((obj, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100/60"
                          >
                            <Target className="w-3 h-3 mr-1 text-emerald-600" />
                            {obj}
                          </span>
                        ))}
                        {displayObjectives.length > 2 && (
                          <span className="text-xs font-bold text-slate-400 self-center">
                            +{displayObjectives.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Não especificado</span>
                    )}
                  </div>

                  {/* Contact info snippet */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    {paciente.whatsapp && (
                      <div className="flex items-center space-x-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{paciente.whatsapp}</span>
                      </div>
                    )}
                    {paciente.email && (
                      <div className="flex items-center space-x-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{paciente.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Footer: Data da última consulta */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Última consulta:{' '}
                      <strong className="text-slate-700">
                        {paciente.ultima_consulta
                          ? new Date(paciente.ultima_consulta).toLocaleDateString('pt-BR')
                          : 'Sem consulta'}
                      </strong>
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
