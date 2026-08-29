import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createPaciente } from '../lib/api';
import { Paciente } from '../types';
import {
  User,
  Activity,
  Heart,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Scale,
  Ruler,
  Droplet,
  Utensils,
  Moon,
  Sun,
  Dumbbell,
  ShieldAlert,
  Pill,
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

export const NovoPaciente: React.FC = () => {
  const navigate = useNavigate();
  const { nutricionista, user, sessionToken } = useAuth();

  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  // Aba 1 - Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState<'feminino' | 'masculino' | 'outro' | ''>('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Aba 2 - Clínico
  const [pesoAtual, setPesoAtual] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [patologias, setPatologias] = useState<string[]>([]);
  const [customPatologia, setCustomPatologia] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [customRestricao, setCustomRestricao] = useState('');
  const [alergias, setAlergias] = useState<string[]>([]);
  const [customAlergia, setCustomAlergia] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Aba 3 - Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState<string>('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState<string>('');
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState<boolean | null>(null);
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

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

  // Live Age Calculation
  const idadeCalculada = useMemo(() => {
    if (!dataNascimento) return null;
    const birthDate = new Date(dataNascimento);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [dataNascimento]);

  // Live IMC Calculation
  const imcInfo = useMemo(() => {
    const p = parseFloat(pesoAtual.replace(',', '.'));
    const a = parseFloat(altura.replace(',', '.'));
    if (!p || !a || p <= 0 || a <= 0) return null;

    // Normalize height in meters
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
  }, [pesoAtual, altura]);

  // Tag helper handlers
  const toggleArrayItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (item === 'Nenhum') {
      if (list.includes('Nenhum')) {
        setList([]);
      } else {
        setList(['Nenhum']);
      }
      return;
    }

    const withoutNenhum = list.filter((i) => i !== 'Nenhum');
    if (withoutNenhum.includes(item)) {
      setList(withoutNenhum.filter((i) => i !== item));
    } else {
      setList([...withoutNenhum, item]);
    }
  };

  const addCustomTag = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    val: string,
    setVal: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const withoutNenhum = list.filter((i) => i !== 'Nenhum');
    if (!withoutNenhum.includes(trimmed)) {
      setList([...withoutNenhum, trimmed]);
    }
    setVal('');
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nome.trim()) {
      setActiveTab('pessoal');
      setErrorMessage('O nome completo é obrigatório.');
      return;
    }

    const nutId = nutricionista?.id || user?.id;
    if (!nutId) {
      setErrorMessage('Sessão expirada. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);

    try {
      const p = pesoAtual ? parseFloat(pesoAtual.replace(',', '.')) : null;
      let a = altura ? parseFloat(altura.replace(',', '.')) : null;
      if (a && a > 3) a = a / 100; // normalize to meters in DB if > 3

      const payload: Partial<Paciente> = {
        nutricionista_id: nutId,
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        telefone: telefone || null,
        whatsapp: whatsapp || null,
        email: email.trim() || null,
        peso_inicial: p,
        altura: a,
        objetivos: objetivos.length > 0 ? objetivos : null,
        objetivo_texto: objetivoTexto.trim() || null,
        nivel_atividade: nivelAtividade || null,
        patologias: patologias.length > 0 ? patologias : null,
        restricoes_alimentares: restricoes.length > 0 ? restricoes : null,
        alergias: alergias.length > 0 ? alergias : null,
        medicamentos: medicamentos.trim() || null,
        suplementos: suplementos.trim() || null,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null,
        horario_acorda: horarioAcorda.trim() || null,
        horario_dorme: horarioDorme.trim() || null,
        litros_agua: litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : null,
        atividade_fisica: praticaAtividadeFisica,
        atividade_fisica_descricao: praticaAtividadeFisica ? atividadeFisicaDescricao.trim() : null,
        observacoes: observacoes.trim() || null,
      };

      const savedPaciente = await createPaciente(payload, sessionToken || undefined);

      setSuccessMessage('Paciente cadastrado com sucesso!');
      setTimeout(() => {
        navigate(`/pacientes/${savedPaciente.id || ''}`);
      }, 1000);
    } catch (err: any) {
      console.error('Error saving paciente:', err);
      setErrorMessage(err?.message || 'Erro ao salvar paciente. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/pacientes')}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
            title="Voltar para lista de pacientes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Novo Paciente</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Preencha os dados cadastrais, clínicos e hábitos do paciente
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Paciente</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <span>{successMessage} Redirecionando para o perfil...</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('pessoal')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'pessoal'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Dados Pessoais</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'clinico'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Dados Clínicos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'habitos'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>3. Hábitos de Vida</span>
        </button>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        {/* ======================= ABA 1 — PESSOAL ======================= */}
        {activeTab === 'pessoal' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Informações Pessoais e Contato</h2>
              <p className="text-xs text-slate-500 mt-0.5">Identificação principal do paciente</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome Completo */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nome"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Data de Nascimento & Idade */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Data de Nascimento
                  </label>
                  {idadeCalculada !== null && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {idadeCalculada} {idadeCalculada === 1 ? 'ano' : 'anos'}
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Sexo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Sexo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['feminino', 'masculino', 'outro'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSexo(s)}
                      className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all capitalize ${
                        sexo === s
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  placeholder="(11) 3456-7890"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  placeholder="(11) 98765-4321"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* E-mail */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paciente@exemplo.com"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('clinico')}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
              >
                <span>Avançar para Clínico</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================= ABA 2 — CLÍNICO ======================= */}
        {activeTab === 'clinico' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Avaliação Clínica & Objetivos</h2>
              <p className="text-xs text-slate-500 mt-0.5">Antropometria, metas nutricionais e histórico de saúde</p>
            </div>

            {/* Medidas & IMC */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
              {/* Peso */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Peso Atual</span>
                </label>
                <div className="relative rounded-xl">
                  <input
                    type="text"
                    value={pesoAtual}
                    onChange={(e) => setPesoAtual(e.target.value)}
                    placeholder="75.5"
                    className="w-full pl-4 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">kg</span>
                </div>
              </div>

              {/* Altura */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <Ruler className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Altura</span>
                </label>
                <div className="relative rounded-xl">
                  <input
                    type="text"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    placeholder="175"
                    className="w-full pl-4 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">cm</span>
                </div>
              </div>

              {/* IMC Calculado */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  IMC (Automático)
                </label>
                {imcInfo ? (
                  <div className={`p-2.5 rounded-xl border text-center ${imcInfo.cor}`}>
                    <span className="text-lg font-extrabold block leading-tight">{imcInfo.valor}</span>
                    <span className="text-2xs font-semibold block">{imcInfo.classificacao}</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-white">
                    Informe peso e altura
                  </div>
                )}
              </div>
            </div>

            {/* Objetivos */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Objetivo Nutricional
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {OBJETIVOS_OPTIONS.map((opt) => {
                  const selected = objetivos.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleArrayItem(objetivos, setObjetivos, opt)}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        selected
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <textarea
                rows={2}
                value={objetivoTexto}
                onChange={(e) => setObjetivoTexto(e.target.value)}
                placeholder="Detalhes adicionais sobre as metas e objetivos do paciente..."
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Nível de Atividade Física */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Nível de Atividade Física
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {NIVEIS_ATIVIDADE.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setNivelAtividade(item.value)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      nivelAtividade === item.value
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold block">{item.label}</span>
                    <span className="text-2xs text-slate-500 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Patologias */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <span>Patologias ou Condições de Saúde</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => toggleArrayItem(patologias, setPatologias, 'Nenhum')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    patologias.includes('Nenhum')
                      ? 'bg-slate-800 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  Nenhum
                </button>
                {PATOLOGIAS_PRESET.map((p) => {
                  const selected = patologias.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleArrayItem(patologias, setPatologias, p)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                        selected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                {patologias
                  .filter((p) => !PATOLOGIAS_PRESET.includes(p) && p !== 'Nenhum')
                  .map((custom) => (
                    <span
                      key={custom}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white space-x-1.5"
                    >
                      <span>{custom}</span>
                      <X
                        className="w-3.5 h-3.5 cursor-pointer hover:opacity-80"
                        onClick={() => toggleArrayItem(patologias, setPatologias, custom)}
                      />
                    </span>
                  ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPatologia}
                  onChange={(e) => setCustomPatologia(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag(patologias, setPatologias, customPatologia, setCustomPatologia);
                    }
                  }}
                  placeholder="Adicionar outra patologia..."
                  className="flex-1 px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => addCustomTag(patologias, setPatologias, customPatologia, setCustomPatologia)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Restrições Alimentares */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Restrições Alimentares
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => toggleArrayItem(restricoes, setRestricoes, 'Nenhum')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    restricoes.includes('Nenhum')
                      ? 'bg-slate-800 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  Nenhum
                </button>
                {RESTRICOES_PRESET.map((r) => {
                  const selected = restricoes.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleArrayItem(restricoes, setRestricoes, r)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                        selected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
                {restricoes
                  .filter((r) => !RESTRICOES_PRESET.includes(r) && r !== 'Nenhum')
                  .map((custom) => (
                    <span
                      key={custom}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white space-x-1.5"
                    >
                      <span>{custom}</span>
                      <X
                        className="w-3.5 h-3.5 cursor-pointer hover:opacity-80"
                        onClick={() => toggleArrayItem(restricoes, setRestricoes, custom)}
                      />
                    </span>
                  ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRestricao}
                  onChange={(e) => setCustomRestricao(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag(restricoes, setRestricoes, customRestricao, setCustomRestricao);
                    }
                  }}
                  placeholder="Adicionar outra restrição..."
                  className="flex-1 px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => addCustomTag(restricoes, setRestricoes, customRestricao, setCustomRestricao)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Alergias Alimentares */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Alergias Alimentares
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => toggleArrayItem(alergias, setAlergias, 'Nenhum')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    alergias.includes('Nenhum')
                      ? 'bg-slate-800 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  Nenhum
                </button>
                {ALERGIAS_PRESET.map((a) => {
                  const selected = alergias.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleArrayItem(alergias, setAlergias, a)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                        selected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {a}
                    </button>
                  );
                })}
                {alergias
                  .filter((a) => !ALERGIAS_PRESET.includes(a) && a !== 'Nenhum')
                  .map((custom) => (
                    <span
                      key={custom}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white space-x-1.5"
                    >
                      <span>{custom}</span>
                      <X
                        className="w-3.5 h-3.5 cursor-pointer hover:opacity-80"
                        onClick={() => toggleArrayItem(alergias, setAlergias, custom)}
                      />
                    </span>
                  ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customAlergia}
                  onChange={(e) => setCustomAlergia(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag(alergias, setAlergias, customAlergia, setCustomAlergia);
                    }
                  }}
                  placeholder="Adicionar outra alergia..."
                  className="flex-1 px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => addCustomTag(alergias, setAlergias, customAlergia, setCustomAlergia)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Medicamentos & Suplementos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Medicamentos Contínuos</span>
                </label>
                <textarea
                  rows={2}
                  value={medicamentos}
                  onChange={(e) => setMedicamentos(e.target.value)}
                  placeholder="Ex: Losartana 50mg, Levotiroxina 25mcg..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Suplementos em Uso</span>
                </label>
                <textarea
                  rows={2}
                  value={suplementos}
                  onChange={(e) => setSuplementos(e.target.value)}
                  placeholder="Ex: Creatina 5g, Vitamina D3 2000UI..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('pessoal')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('habitos')}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800"
              >
                <span>Avançar para Hábitos</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================= ABA 3 — HÁBITOS ======================= */}
        {activeTab === 'habitos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Rotina e Hábitos de Vida</h2>
              <p className="text-xs text-slate-500 mt-0.5">Rotina diária, hidratação e prática de exercícios</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Refeições por dia */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Refeições / dia</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={refeicoesPorDia}
                  onChange={(e) => setRefeicoesPorDia(e.target.value)}
                  placeholder="Ex: 4"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Horário que Acorda */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Horário Acorda</span>
                </label>
                <input
                  type="text"
                  value={horarioAcorda}
                  onChange={(e) => setHorarioAcorda(e.target.value)}
                  onBlur={(e) => setHorarioAcorda(formatSmartTime(e.target.value))}
                  placeholder="Ex: 06:30 ou 6"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Horário que Dorme */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Horário Dorme</span>
                </label>
                <input
                  type="text"
                  value={horarioDorme}
                  onChange={(e) => setHorarioDorme(e.target.value)}
                  onBlur={(e) => setHorarioDorme(formatSmartTime(e.target.value))}
                  placeholder="Ex: 22:30 ou 22"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Água por dia */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <Droplet className="w-3.5 h-3.5 text-sky-500" />
                  <span>Água / dia</span>
                </label>
                <div className="relative rounded-xl">
                  <input
                    type="text"
                    value={litrosAgua}
                    onChange={(e) => setLitrosAgua(e.target.value)}
                    placeholder="2.5"
                    className="w-full pl-4 pr-12 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">litros</span>
                </div>
              </div>
            </div>

            {/* Atividade Física */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Dumbbell className="w-4 h-4 text-emerald-600" />
                <span>Pratica atividade física regularmente?</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPraticaAtividadeFisica(true)}
                  className={`px-5 py-2 text-xs font-bold rounded-xl border transition-all ${
                    praticaAtividadeFisica === true
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPraticaAtividadeFisica(false);
                    setAtividadeFisicaDescricao('');
                  }}
                  className={`px-5 py-2 text-xs font-bold rounded-xl border transition-all ${
                    praticaAtividadeFisica === false
                      ? 'bg-slate-800 border-slate-800 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Não
                </button>
              </div>

              {praticaAtividadeFisica === true && (
                <div className="pt-2 animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Qual atividade e frequência semanal?
                  </label>
                  <input
                    type="text"
                    value={atividadeFisicaDescricao}
                    onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                    placeholder="Ex: Musculação 4x/semana + Corrida 2x/semana"
                    className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Observações Gerais */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Observações Gerais
              </label>
              <textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Anotações adicionais, preferências de alimentos, rotina de trabalho..."
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('clinico')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/10 transition-all disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Paciente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
