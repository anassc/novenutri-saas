import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { getPacientesList } from '../lib/api';
import { Users, Loader2, ChevronRight, Phone, Mail, Calendar } from 'lucide-react';

export const Pacientes: React.FC = () => {
  const navigate = useNavigate();
  const { sessionToken } = useAuth();

  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientesList', sessionToken],
    queryFn: () => getPacientesList(sessionToken || undefined),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pacientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Lista completa de pacientes sob seus cuidados
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Carregando lista de pacientes...</span>
        </div>
      ) : pacientes.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Nenhum paciente cadastrado</h3>
          <p className="text-sm text-slate-500 mt-1">
            Seus pacientes cadastrados aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pacientes.map((paciente) => (
            <div
              key={paciente.id}
              onClick={() => navigate(`/pacientes/${paciente.id}`)}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {paciente.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {paciente.nome}
                    </h3>
                    {paciente.sexo && (
                      <span className="text-xs text-slate-500 capitalize">{paciente.sexo}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {paciente.whatsapp && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{paciente.whatsapp}</span>
                    </div>
                  )}
                  {paciente.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{paciente.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cadastrado em {new Date(paciente.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                <span>Ver perfil completo</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
