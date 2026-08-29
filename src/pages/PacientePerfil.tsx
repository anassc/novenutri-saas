import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { getPacienteDetails, updatePaciente, deletePaciente, createConsulta, deleteConsulta } from '../lib/api';
import { Paciente, Consulta, PlanoAlimentar } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  Loader2,
  User,
  Calendar,
  AlertCircle,
  Clock,
  Activity,
  Edit3,
  Save,
  Trash2,
  CheckCircle2,
  Scale,
  Ruler,
  Droplet,
  Utensils,
  Moon,
  Sun,
  Dumbbell,
  ShieldAlert,
  Pill,
  Target,
  Phone,
  Mail,
  Plus,
  X,
  Stethoscope,
  FileText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Eye,
} from 'lucide-react';

const OBJETIVOS_OPTIONS = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const NIVEIS_ATIVIDADE = [
  { value: 'sedentario', label: 'Sedentário', desc: 'Pouco ou nenhum exercício' },
  { value: 'leve', label: 'Levemente ativo', desc: 'Exercício leve 1 a 3 dias/sem' },
  { value: 'moderado', label: 'Moderadamente ativo', desc: 'Exercício moderado 3 a 5 dias/sem' },
  { value: 'muito', label: 'Muito ativo', desc: 'Exercício pesado 6 a 7 dias/sem' },
  { value: 'extremo', label: 'Extremamente ativo', desc: 'Treino muito pesado / atleta' },
];

const PATOLOGIAS_PRESET = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
];

const RESTRICOES_PRESET = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
];

const ALERGIAS_PRESET = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
];

export const PacientePerfil: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sessionToken } = useAuth();

  // Navigation sections: 1. Dados do Paciente | 2. Consultas | 3. Planos Alimentares
  const [mainSection, setMainSection] = useState<'dados' | 'consultas' | 'planos'>('dados');
  // Sub-tabs for Dados do Paciente: Pessoal | Clínico | Hábitos
  const [subTab, setSubTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConsultaModal, setShowConsultaModal] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<PlanoAlimentar | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Edit State for Paciente
  const [formData, setFormData] = useState<Partial<Paciente>>({});
  const [customPatologia, setCustomPatologia] = useState('');
  const [customRestricao, setCustomRestricao] = useState('');
  const [customAlergia, setCustomAlergia] = useState('');

  // Form State for New Consulta
  const [consultaData, setConsultaData] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['pacienteDetails', id, sessionToken],
    queryFn: () => getPacienteDetails(id || '', sessionToken || undefined),
    enabled: !!id,
  });

  const paciente = data?.paciente;
  const consultas = data?.consultas || [];
  const planos = data?.planos || [];

  useEffect(() => {
    if (paciente) {
      setFormData({
        ...paciente,
      });
    }
  }, [paciente]);

  // Live Age Calculation
  const idadeCalculada = useMemo(() => {
    const birthDateStr = isEditing ? formData.data_nascimento : paciente?.data_nascimento;
    if (!birthDateStr) return null;
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [isEditing, formData.data_nascimento, paciente?.data_nascimento]);

  // Live IMC Calculation
  const imcInfo = useMemo(() => {
    const p = parseFloat(String(isEditing ? formData.peso_inicial : paciente?.peso_inicial || '').replace(',', '.'));
    const a = parseFloat(String(isEditing ? formData.altura : paciente?.altura || '').replace(',', '.'));
    if (!p || !a || p <= 0 || a <= 0) return null;

    const heightInMeters = a > 3 ? a / 100 : a;
    const imc = p / (heightInMeters * heightInMeters);

    let classificacao = '';
    let cor = '';

    if (imc < 18.5) {
      classificacao = 'Abaixo do peso';
      cor = 'text-sky-600 bg-sky-50 border-sky-200';
    } else if (imc < 25) {
      classificacao = 'Peso normal (Eutrofia)';
      cor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    } else if (imc < 30) {
      classificacao = 'Sobrepeso';
      cor = 'text-amber-700 bg-amber-50 border-amber-200';
    } else if (imc < 35) {
      classificacao = 'Obesidade Grau I';
      cor = 'text-orange-700 bg-orange-50 border-orange-200';
    } else if (imc < 40) {
      classificacao = 'Obesidade Grau II';
      cor = 'text-red-700 bg-red-50 border-red-200';
    } else {
      classificacao = 'Obesidade Grau III';
      cor = 'text-rose-900 bg-rose-100 border-rose-300';
    }

    return {
      valor: imc.toFixed(1),
      classificacao,
      cor,
    };
  }, [isEditing, formData.peso_inicial, formData.altura, paciente?.peso_inicial, paciente?.altura]);

  // Chart Data Preparation: chronologically ascending for line graph
  const chartData = useMemo(() => {
    const points: { data: string; peso: number; rawDate: string }[] = [];

    if (paciente?.created_at && paciente?.peso_inicial) {
      points.push({
        data: `Inicial (${new Date(paciente.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})`,
        peso: Number(paciente.peso_inicial),
        rawDate: paciente.created_at,
      });
    }

    const sortedConsultas = [...consultas]
      .filter((c) => c.peso !== null && c.peso !== undefined && Number(c.peso) > 0)
      .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime());

    sortedConsultas.forEach((c) => {
      points.push({
        data: new Date(c.data_consulta).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        peso: Number(c.peso),
        rawDate: c.data_consulta,
      });
    });

    return points;
  }, [paciente, consultas]);

  // Weight Trend Analysis
  const pesoTrend = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].peso;
    const last = chartData[chartData.length - 1].peso;
    const diff = last - first;
    return {
      diff: Math.abs(diff).toFixed(1),
      isLoss: diff < 0,
      isGain: diff > 0,
      isEqual: diff === 0,
      latest: last,
    };
  }, [chartData]);

  // Helpers
  const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const formatSmartTime = (input: string) => {
    const clean = input.replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 1 || clean.length === 2) {
      const num = parseInt(clean, 10);
      if (num >= 0 && num <= 23) return `${clean.padStart(2, '0')}:00`;
    }
    if (clean.length === 3) {
      const h = clean.slice(0, 1).padStart(2, '0');
      const m = clean.slice(1, 3);
      return `${h}:${m}`;
    }
    if (clean.length >= 4) {
      const h = clean.slice(0, 2);
      const m = clean.slice(2, 4);
      return `${h}:${m}`;
    }
    return input;
  };

  // Tag helper
  const toggleArrayItem = (field: 'objetivos' | 'patologias' | 'restricoes_alimentares' | 'alergias', item: string) => {
    const current = (formData[field] as string[]) || [];
    if (item === 'Nenhum') {
      setFormData({
        ...formData,
        [field]: current.includes('Nenhum') ? [] : ['Nenhum'],
      });
      return;
    }
    const withoutNenhum = current.filter((i) => i !== 'Nenhum');
    if (withoutNenhum.includes(item)) {
      setFormData({
        ...formData,
        [field]: withoutNenhum.filter((i) => i !== item),
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...withoutNenhum, item],
      });
    }
  };

  const addCustomTag = (
    field: 'patologias' | 'restricoes_alimentares' | 'alergias',
    val: string,
    setVal: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const current = (formData[field] as string[]) || [];
    const withoutNenhum = current.filter((i) => i !== 'Nenhum');
    if (!withoutNenhum.includes(trimmed)) {
      setFormData({
        ...formData,
        [field]: [...withoutNenhum, trimmed],
      });
    }
    setVal('');
  };

  // Update Paciente Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('ID do paciente inválido.');
      let a = formData.altura ? parseFloat(String(formData.altura).replace(',', '.')) : null;
      if (a && a > 3) a = a / 100;
      const p = formData.peso_inicial ? parseFloat(String(formData.peso_inicial).replace(',', '.')) : null;

      const payload = {
        ...formData,
        peso_inicial: p,
        altura: a,
      };
      return await updatePaciente(id, payload, sessionToken || undefined);
    },
    onSuccess: () => {
      setFeedbackMessage({ type: 'success', text: 'Dados do paciente atualizados com sucesso!' });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['pacienteDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['pacientesList'] });
      setTimeout(() => setFeedbackMessage(null), 4000);
    },
    onError: (err: any) => {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Erro ao atualizar dados do paciente.' });
    },
  });

  // Delete Paciente Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('ID inválido');
      await deletePaciente(id, sessionToken || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientesList'] });
      navigate('/pacientes');
    },
    onError: (err: any) => {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Erro ao excluir paciente.' });
      setShowDeleteModal(false);
    },
  });

  // Create Consulta Mutation
  const createConsultaMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Paciente não identificado');
      if (!consultaData.data_consulta) throw new Error('Data da consulta é obrigatória');

      const payload: Partial<Consulta> = {
        paciente_id: id,
        data_consulta: consultaData.data_consulta,
        peso: consultaData.peso ? parseFloat(consultaData.peso.replace(',', '.')) : null,
        cintura: consultaData.cintura ? parseFloat(consultaData.cintura.replace(',', '.')) : null,
        quadril: consultaData.quadril ? parseFloat(consultaData.quadril.replace(',', '.')) : null,
        percentual_gordura: consultaData.percentual_gordura ? parseFloat(consultaData.percentual_gordura.replace(',', '.')) : null,
        observacoes: consultaData.observacoes.trim() || null,
        proximo_retorno: consultaData.proximo_retorno || null,
      };

      return await createConsulta(payload, sessionToken || undefined);
    },
    onSuccess: () => {
      setFeedbackMessage({ type: 'success', text: 'Consulta registrada com sucesso!' });
      setShowConsultaModal(false);
      setConsultaData({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: '',
      });
      queryClient.invalidateQueries({ queryKey: ['pacienteDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['pacientesList'] });
      setTimeout(() => setFeedbackMessage(null), 4000);
    },
    onError: (err: any) => {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Erro ao registrar consulta.' });
    },
  });

  // Delete Consulta Mutation
  const deleteConsultaMutation = useMutation({
    mutationFn: async (consultaId: string) => {
      await deleteConsulta(consultaId, sessionToken || undefined);
    },
    onSuccess: () => {
      setFeedbackMessage({ type: 'success', text: 'Consulta removida com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['pacienteDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['pacientesList'] });
      setTimeout(() => setFeedbackMessage(null), 4000);
    },
    onError: (err: any) => {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Erro ao excluir consulta.' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-emerald-600" />
        <span className="text-sm font-medium">Carregando prontuário do paciente...</span>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-10">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Paciente não encontrado</h2>
        <p className="text-sm text-slate-500">
          O registro solicitado não foi localizado ou não pertence à sua conta.
        </p>
        <button
          onClick={() => navigate('/pacientes')}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Pacientes</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/pacientes')}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Pacientes</span>
        </button>

        <div className="flex items-center space-x-2">
          {mainSection === 'consultas' && (
            <button
              type="button"
              onClick={() => setShowConsultaModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Consulta</span>
            </button>
          )}

          {mainSection === 'planos' && (
            <button
              type="button"
              onClick={() => alert('O Gerador com IA de Planos Alimentares será ativado no próximo módulo!')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Gerar Plano Alimentar</span>
            </button>
          )}

          {mainSection === 'dados' && (
            isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ ...paciente });
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm transition-colors disabled:opacity-60"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar alterações</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:border-emerald-300 hover:text-emerald-700 transition-colors shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Editar Dados</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50/50 text-red-600 text-xs font-semibold hover:bg-red-100/70 transition-colors"
            title="Excluir paciente"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 text-sm font-medium ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Patient Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-2xs">
            {(isEditing ? formData.nome : paciente.nome)?.charAt(0).toUpperCase() || 'P'}
          </div>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo do paciente"
                className="text-xl font-bold text-slate-900 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            ) : (
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{paciente.nome}</h1>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              {idadeCalculada !== null && (
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  {idadeCalculada} {idadeCalculada === 1 ? 'ano' : 'anos'}
                </span>
              )}
              {paciente.sexo && <span className="capitalize">• {paciente.sexo}</span>}
              <span>• Cadastrado em {new Date(paciente.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* Quick Highlights / IMC Pill */}
        {imcInfo && (
          <div className={`p-3.5 rounded-xl border text-center ${imcInfo.cor} shrink-0`}>
            <span className="text-xs font-bold block uppercase tracking-wider">IMC Atual</span>
            <span className="text-xl font-black block">{imcInfo.valor}</span>
            <span className="text-2xs font-semibold">{imcInfo.classificacao}</span>
          </div>
        )}
      </div>

      {/* 3 Main Sections Tabs Bar (Prompt 5) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMainSection('dados')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            mainSection === 'dados'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Dados do Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => setMainSection('consultas')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            mainSection === 'consultas'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Consultas ({consultas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMainSection('planos')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            mainSection === 'planos'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Planos Alimentares ({planos.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1: DADOS DO PACIENTE (3 Abas: Pessoal, Clínico, Hábitos) */}
      {/* ========================================================================= */}
      {mainSection === 'dados' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub-tabs selector */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex max-w-md gap-1">
            <button
              type="button"
              onClick={() => setSubTab('pessoal')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                subTab === 'pessoal' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pessoal
            </button>
            <button
              type="button"
              onClick={() => setSubTab('clinico')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                subTab === 'clinico' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clínico
            </button>
            <button
              type="button"
              onClick={() => setSubTab('habitos')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                subTab === 'habitos' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hábitos
            </button>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            {/* Sub-aba 1: Pessoal */}
            {subTab === 'pessoal' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">Informações Pessoais & Contato</h3>
                  <p className="text-xs text-slate-500">Dados cadastrais do paciente</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Data de Nascimento
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formData.data_nascimento || ''}
                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-800 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        {paciente.data_nascimento
                          ? new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')
                          : 'Não informado'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Sexo
                    </label>
                    {isEditing ? (
                      <div className="grid grid-cols-3 gap-2">
                        {(['feminino', 'masculino', 'outro'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFormData({ ...formData, sexo: s })}
                            className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all capitalize ${
                              formData.sexo === s
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-slate-800 p-3 bg-slate-50 rounded-xl border border-slate-100 capitalize">
                        {paciente.sexo || 'Não informado'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Telefone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.telefone || ''}
                        onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                        placeholder="(11) 3456-7890"
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-800 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{paciente.telefone || 'Não informado'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      WhatsApp
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.whatsapp || ''}
                        onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                        placeholder="(11) 98765-4321"
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-800 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span>{paciente.whatsapp || 'Não informado'}</span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      E-mail
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@paciente.com"
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-slate-800 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{paciente.email || 'Não informado'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-aba 2: Clínico */}
            {subTab === 'clinico' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">Avaliação Antropométrica e Clínica</h3>
                  <p className="text-xs text-slate-500">Metas nutricionais, saúde e histórico de restrições</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/70">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                      <Scale className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Peso Inicial</span>
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.peso_inicial || ''}
                          onChange={(e) => setFormData({ ...formData, peso_inicial: Number(e.target.value) || null })}
                          className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                        />
                        <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">kg</span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-slate-800">
                        {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '—'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                      <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Altura</span>
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.altura ? (formData.altura > 3 ? formData.altura : (formData.altura * 100).toFixed(0)) : ''}
                          onChange={(e) => setFormData({ ...formData, altura: Number(e.target.value) || null })}
                          className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-xl"
                        />
                        <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">cm</span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-slate-800">
                        {paciente.altura ? (paciente.altura > 3 ? `${paciente.altura} cm` : `${(paciente.altura * 100).toFixed(0)} cm (${paciente.altura}m)`) : '—'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      IMC
                    </label>
                    {imcInfo ? (
                      <div className={`p-2 rounded-xl border text-center ${imcInfo.cor}`}>
                        <span className="text-base font-extrabold block leading-tight">{imcInfo.valor}</span>
                        <span className="text-2xs font-semibold">{imcInfo.classificacao}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Informe peso e altura</span>
                    )}
                  </div>
                </div>

                {/* Objetivos */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Objetivos Nutricionais
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {OBJETIVOS_OPTIONS.map((opt) => {
                          const selected = (formData.objetivos || []).includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleArrayItem('objetivos', opt)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                                selected
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      <textarea
                        rows={2}
                        value={formData.objetivo_texto || ''}
                        onChange={(e) => setFormData({ ...formData, objetivo_texto: e.target.value })}
                        placeholder="Detalhes sobre metas do paciente..."
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {paciente.objetivos && paciente.objetivos.length > 0 ? (
                          paciente.objetivos.map((obj, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100"
                            >
                              <Target className="w-3 h-3 mr-1 text-emerald-600" />
                              {obj}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">Nenhum objetivo listado</span>
                        )}
                      </div>
                      {paciente.objetivo_texto && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {paciente.objetivo_texto}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Nível de Atividade */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nível de Atividade Física
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.nivel_atividade || ''}
                      onChange={(e) => setFormData({ ...formData, nivel_atividade: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="">Selecione...</option>
                      {NIVEIS_ATIVIDADE.map((n) => (
                        <option key={n.value} value={n.value}>
                          {n.label} ({n.desc})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs font-semibold text-slate-800 capitalize p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {NIVEIS_ATIVIDADE.find((n) => n.value === paciente.nivel_atividade)?.label || paciente.nivel_atividade || 'Não informado'}
                    </div>
                  )}
                </div>

                {/* Patologias, Restrições e Alergias */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Patologias</span>
                    </span>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => toggleArrayItem('patologias', 'Nenhum')}
                            className={`text-2xs font-semibold px-2 py-0.5 rounded-lg border ${
                              (formData.patologias || []).includes('Nenhum')
                                ? 'bg-slate-800 text-white'
                                : 'bg-white text-slate-700'
                            }`}
                          >
                            Nenhum
                          </button>
                          {PATOLOGIAS_PRESET.map((p) => {
                            const sel = (formData.patologias || []).includes(p);
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => toggleArrayItem('patologias', p)}
                                className={`text-2xs font-semibold px-2 py-0.5 rounded-lg border ${
                                  sel ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                                }`}
                              >
                                {p}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={customPatologia}
                            onChange={(e) => setCustomPatologia(e.target.value)}
                            placeholder="Outra..."
                            className="flex-1 text-2xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => addCustomTag('patologias', customPatologia, setCustomPatologia)}
                            className="p-1 bg-slate-200 rounded-lg text-slate-700 hover:bg-slate-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {paciente.patologias?.length ? (
                          paciente.patologias.map((p, i) => (
                            <span key={i} className="text-2xs font-semibold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-2xs text-slate-400 italic">Nenhuma</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Restrições Alimentares
                    </span>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => toggleArrayItem('restricoes_alimentares', 'Nenhum')}
                            className={`text-2xs font-semibold px-2 py-0.5 rounded-lg border ${
                              (formData.restricoes_alimentares || []).includes('Nenhum')
                                ? 'bg-slate-800 text-white'
                                : 'bg-white text-slate-700'
                            }`}
                          >
                            Nenhum
                          </button>
                          {RESTRICOES_PRESET.map((r) => {
                            const sel = (formData.restricoes_alimentares || []).includes(r);
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => toggleArrayItem('restricoes_alimentares', r)}
                                className={`text-2xs font-semibold px-2 py-0.5 rounded-lg border ${
                                  sel ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                                }`}
                              >
                                {r}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={customRestricao}
                            onChange={(e) => setCustomRestricao(e.target.value)}
                            placeholder="Outra..."
                            className="flex-1 text-2xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => addCustomTag('restricoes_alimentares', customRestricao, setCustomRestricao)}
                            className="p-1 bg-slate-200 rounded-lg text-slate-700 hover:bg-slate-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {paciente.restricoes_alimentares?.length ? (
                          paciente.restricoes_alimentares.map((r, i) => (
                            <span key={i} className="text-2xs font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="text-2xs text-slate-400 italic">Nenhuma</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Alergias Alimentares
                    </span>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => toggleArrayItem('alergias', 'Nenhum')}
                            className={`text-2xs font-semibold px-2 py-0.5 rounded-lg border ${
                              (formData.alergias || []).includes('Nenhum')
                                ? 'bg-slate-800 text-white'
                                : 'bg-white text-slate-700'
                            }`}
                          >
                            Nenhum
                          </button>
                          {ALERGIAS_PRESET.map((a) => {
                            const sel = (formData.alergias || []).includes(a);
                            return (
                              <button
                                key={a}
                                type="button"
                                onClick={() => toggleArrayItem('alergias', a)}
                                className={`text-2xs font-semibold px-2 py-0.5 rounded-lg border ${
                                  sel ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                                }`}
                              >
                                {a}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={customAlergia}
                            onChange={(e) => setCustomAlergia(e.target.value)}
                            placeholder="Outra..."
                            className="flex-1 text-2xs px-2 py-1 bg-white border border-slate-200 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => addCustomTag('alergias', customAlergia, setCustomAlergia)}
                            className="p-1 bg-slate-200 rounded-lg text-slate-700 hover:bg-slate-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {paciente.alergias?.length ? (
                          paciente.alergias.map((a, i) => (
                            <span key={i} className="text-2xs font-semibold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                              {a}
                            </span>
                          ))
                        ) : (
                          <span className="text-2xs text-slate-400 italic">Nenhuma</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Medicamentos & Suplementos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                      <Pill className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Medicamentos Contínuos</span>
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={formData.medicamentos || ''}
                        onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    ) : (
                      <div className="text-xs text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        {paciente.medicamentos || 'Nenhum medicamento informado'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                      <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Suplementos em Uso</span>
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={formData.suplementos || ''}
                        onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    ) : (
                      <div className="text-xs text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        {paciente.suplementos || 'Nenhum suplemento informado'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-aba 3: Hábitos */}
            {subTab === 'habitos' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">Rotina e Hábitos de Vida</h3>
                  <p className="text-xs text-slate-500">Horários, hidratação diária e atividades físicas</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-2xs font-bold uppercase text-slate-400 block mb-1 flex items-center space-x-1">
                      <Utensils className="w-3 h-3 text-emerald-600" />
                      <span>Refeições / dia</span>
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.refeicoes_por_dia || ''}
                        onChange={(e) => setFormData({ ...formData, refeicoes_por_dia: parseInt(e.target.value, 10) || null })}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-800">
                        {paciente.refeicoes_por_dia ? `${paciente.refeicoes_por_dia} refeições` : 'Não informado'}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-2xs font-bold uppercase text-slate-400 block mb-1 flex items-center space-x-1">
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>Horário Acorda</span>
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.horario_acorda || ''}
                        onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                        onBlur={(e) => setFormData({ ...formData, horario_acorda: formatSmartTime(e.target.value) })}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-800">
                        {paciente.horario_acorda || 'Não informado'}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-2xs font-bold uppercase text-slate-400 block mb-1 flex items-center space-x-1">
                      <Moon className="w-3 h-3 text-indigo-500" />
                      <span>Horário Dorme</span>
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.horario_dorme || ''}
                        onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                        onBlur={(e) => setFormData({ ...formData, horario_dorme: formatSmartTime(e.target.value) })}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-800">
                        {paciente.horario_dorme || 'Não informado'}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-2xs font-bold uppercase text-slate-400 block mb-1 flex items-center space-x-1">
                      <Droplet className="w-3 h-3 text-sky-500" />
                      <span>Água / dia</span>
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.litros_agua || ''}
                        onChange={(e) => setFormData({ ...formData, litros_agua: Number(e.target.value) || null })}
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-800">
                        {paciente.litros_agua ? `${paciente.litros_agua} L` : 'Não informado'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Atividade Física */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-700 block flex items-center space-x-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Prática de Atividade Física</span>
                  </span>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, atividade_fisica: true })}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                            formData.atividade_fisica === true ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, atividade_fisica: false, atividade_fisica_descricao: '' })}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                            formData.atividade_fisica === false ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                      {formData.atividade_fisica && (
                        <input
                          type="text"
                          value={formData.atividade_fisica_descricao || ''}
                          onChange={(e) => setFormData({ ...formData, atividade_fisica_descricao: e.target.value })}
                          placeholder="Qual atividade e frequência semanal?"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-700">
                      {paciente.atividade_fisica ? (
                        <strong className="text-emerald-700">Sim</strong>
                      ) : (
                        <strong className="text-slate-500">Não pratica</strong>
                      )}
                      {paciente.atividade_fisica_descricao && ` — ${paciente.atividade_fisica_descricao}`}
                    </p>
                  )}
                </div>

                {/* Observações Gerais */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Observações Gerais
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={formData.observacoes || ''}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  ) : (
                    <div className="text-xs text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {paciente.observacoes || 'Nenhuma observação registrada'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 2: CONSULTAS (Gráfico de Evolução de Peso + Histórico + Modal) */}
      {/* ========================================================================= */}
      {mainSection === 'consultas' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Card: Gráfico de Evolução de Peso Sempre Visível (Prompt 5) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Evolução de Peso ao Longo do Tempo</span>
                </h3>
                <p className="text-xs text-slate-500">Acompanhamento do peso registrado em cada atendimento</p>
              </div>

              {pesoTrend && (
                <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  {pesoTrend.isLoss ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">-{pesoTrend.diff} kg desde o início</span>
                    </>
                  ) : pesoTrend.isGain ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span className="text-indigo-700 font-bold">+{pesoTrend.diff} kg desde o início</span>
                    </>
                  ) : (
                    <span className="text-slate-600 font-bold">Peso estável</span>
                  )}
                </div>
              )}
            </div>

            {chartData.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Scale className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">Nenhuma consulta registrada ainda</p>
                <p className="text-xs text-slate-400">O gráfico exibirá a curva de evolução assim que as consultas forem salvas.</p>
              </div>
            ) : (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="data"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      domain={['dataMin - 2', 'dataMax + 2']}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      unit="kg"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1">
                              <span className="text-slate-400 block">{p.data}</span>
                              <span className="text-emerald-400 font-bold text-sm">{p.peso} kg</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 7, fill: '#10b981', stroke: '#065f46', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

            {/* Bottom Card: Lista de Consultas em Ordem Cronológica Decrescente (Prompt 5) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Histórico Completo de Consultas</h3>
                <p className="text-xs text-slate-500">Registros em ordem cronológica decrescente</p>
              </div>

              <button
                type="button"
                onClick={() => setShowConsultaModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Consulta</span>
              </button>
            </div>

            {consultas.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 space-y-3">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Nenhuma consulta registrada para este paciente ainda</p>
                  <p className="text-xs text-slate-400 mt-0.5">Clique em "Nova Consulta" para registrar o primeiro atendimento.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConsultaModal(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Primeira Consulta</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {consultas.map((consulta) => (
                  <div
                    key={consulta.id}
                    className="p-5 rounded-2xl border border-slate-200/70 bg-slate-50/50 space-y-3 relative group hover:border-emerald-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>Consulta de {new Date(consulta.data_consulta).toLocaleDateString('pt-BR')}</span>
                      </span>

                      <div className="flex items-center space-x-3">
                        {consulta.proximo_retorno && (
                          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                            Próximo retorno: {new Date(consulta.proximo_retorno).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja excluir esta consulta?')) {
                              deleteConsultaMutation.mutate(consulta.id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors opacity-0 group-hover:opacity-100"
                          title="Excluir consulta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-slate-400 block">Peso</span>
                        <span className="font-bold text-slate-800">
                          {consulta.peso ? `${consulta.peso} kg` : '—'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-slate-400 block">Cintura</span>
                        <span className="font-bold text-slate-800">
                          {consulta.cintura ? `${consulta.cintura} cm` : '—'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-slate-400 block">Quadril</span>
                        <span className="font-bold text-slate-800">
                          {consulta.quadril ? `${consulta.quadril} cm` : '—'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-slate-400 block">% Gordura</span>
                        <span className="font-bold text-slate-800">
                          {consulta.percentual_gordura ? `${consulta.percentual_gordura}%` : '—'}
                        </span>
                      </div>
                    </div>

                    {consulta.observacoes && (
                      <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                        {consulta.observacoes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 3: PLANOS ALIMENTARES (Prompt 5) */}
      {/* ========================================================================= */}
      {mainSection === 'planos' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Planos Alimentares Personalizados</h3>
              <p className="text-xs text-slate-500">Histórico de dietas e prescrições nutricionais do paciente</p>
            </div>

            <button
              type="button"
              onClick={() => alert('O Gerador com IA de Planos Alimentares será ativado no próximo módulo!')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Gerar Plano Alimentar</span>
            </button>
          </div>

          {planos.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Nenhum plano alimentar gerado ainda</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Crie planos alimentares com cardápios, metas de macronutrientes e orientações específicas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert('O Gerador com IA de Planos Alimentares será ativado no próximo módulo!')}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Gerar Plano Alimentar</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planos.map((plano) => (
                <div
                  key={plano.id}
                  onClick={() => setSelectedPlano(plano)}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        Plano Alimentar
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(plano.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      Prescrição de {new Date(plano.created_at).toLocaleDateString('pt-BR')}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {typeof plano.conteudo === 'string'
                        ? plano.conteudo
                        : JSON.stringify(plano.conteudo)}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                    <span>Ver conteúdo completo</span>
                    <Eye className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Visualizar Conteúdo do Plano Alimentar */}
      {selectedPlano && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Plano Alimentar de {new Date(selectedPlano.created_at).toLocaleDateString('pt-BR')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlano(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <pre className="text-xs text-slate-700 font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto whitespace-pre-wrap">
                {typeof selectedPlano.conteudo === 'string'
                  ? selectedPlano.conteudo
                  : JSON.stringify(selectedPlano.conteudo, null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPlano(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nova Consulta (Prompt 5) */}
      {showConsultaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nova Consulta</h3>
                  <p className="text-xs text-slate-500">Paciente: {paciente.nome}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConsultaModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createConsultaMutation.mutate();
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data da Consulta */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Data da Consulta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={consultaData.data_consulta}
                    onChange={(e) => setConsultaData({ ...consultaData, data_consulta: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Próximo Retorno */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Próximo Retorno
                  </label>
                  <input
                    type="date"
                    value={consultaData.proximo_retorno}
                    onChange={(e) => setConsultaData({ ...consultaData, proximo_retorno: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Peso */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Peso Atual
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 74.2"
                      value={consultaData.peso}
                      onChange={(e) => setConsultaData({ ...consultaData, peso: e.target.value })}
                      className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">kg</span>
                  </div>
                </div>

                {/* % Gordura */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    % de Gordura
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 18.5"
                      value={consultaData.percentual_gordura}
                      onChange={(e) => setConsultaData({ ...consultaData, percentual_gordura: e.target.value })}
                      className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                {/* Cintura */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Cintura
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 82"
                      value={consultaData.cintura}
                      onChange={(e) => setConsultaData({ ...consultaData, cintura: e.target.value })}
                      className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">cm</span>
                  </div>
                </div>

                {/* Quadril */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Quadril
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 98"
                      value={consultaData.quadril}
                      onChange={(e) => setConsultaData({ ...consultaData, quadril: e.target.value })}
                      className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">cm</span>
                  </div>
                </div>
              </div>

              {/* Observações da Consulta */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Observações e Evolução Clínica
                </label>
                <textarea
                  rows={3}
                  value={consultaData.observacoes}
                  onChange={(e) => setConsultaData({ ...consultaData, observacoes: e.target.value })}
                  placeholder="Relato do paciente, ajustes no plano alimentar, sintomas..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConsultaModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createConsultaMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-60 flex items-center justify-center space-x-1.5"
                >
                  {createConsultaMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar consulta</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Exclusão de Paciente */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Excluir Paciente?</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja remover <strong>{paciente.nome}</strong>? Esta ação não pode ser desfeita e removerá o registro do paciente.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700 shadow-sm disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
