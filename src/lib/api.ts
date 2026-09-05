import { Nutricionista, Paciente, Consulta, PacienteSemRetorno, PlanoAlimentar, PlanoSemanalData } from '../types';

const DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL || '';

async function dataApiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${DATA_API_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Data API error (${response.status}):`, errorText);
    let msg = errorText;
    try {
      const parsed = JSON.parse(errorText);
      msg = parsed.message || parsed.hint || parsed.details || errorText;
    } catch {}
    throw new Error(msg || `Data API request failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  
  return {} as T;
}

// 1. Nutricionista Profile
export async function getNutricionistaProfile(id: string, token?: string): Promise<Nutricionista | null> {
  try {
    const data = await dataApiFetch<Nutricionista[]>(`/nutricionistas?id=eq.${id}&select=*`, { method: 'GET' }, token);
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.warn('Could not fetch nutricionista profile directly:', error);
    return null;
  }
}

export async function createNutricionistaProfile(
  nutricionista: { id: string; nome: string; email: string },
  token?: string
): Promise<Nutricionista> {
  const data = await dataApiFetch<Nutricionista[]>(
    '/nutricionistas',
    {
      method: 'POST',
      body: JSON.stringify(nutricionista),
    },
    token
  );
  return Array.isArray(data) ? data[0] : (data as unknown as Nutricionista);
}

// 2. Dashboard Metrics
export async function getPacientesTotal(token?: string): Promise<number> {
  try {
    const data = await dataApiFetch<Paciente[]>('/pacientes?select=id', { method: 'GET' }, token);
    return Array.isArray(data) ? data.length : 0;
  } catch (error) {
    console.error('Error fetching total pacientes:', error);
    return 0;
  }
}

export async function getConsultasSemanaCount(token?: string): Promise<number> {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startIso = startOfWeek.toISOString().split('T')[0];
    const endIso = endOfWeek.toISOString().split('T')[0];

    const data = await dataApiFetch<Consulta[]>(
      `/consultas?data_consulta=gte.${startIso}&data_consulta=lte.${endIso}&select=id`,
      { method: 'GET' },
      token
    );

    return Array.isArray(data) ? data.length : 0;
  } catch (error) {
    console.error('Error fetching consultas da semana:', error);
    return 0;
  }
}

export async function getPacientesSemRetornoList(token?: string): Promise<PacienteSemRetorno[]> {
  try {
    // 1. Fetch all pacientes
    const pacientes = await dataApiFetch<Paciente[]>('/pacientes?select=id,nome', { method: 'GET' }, token);
    if (!Array.isArray(pacientes) || pacientes.length === 0) {
      return [];
    }

    // 2. Fetch all consultas
    const consultas = await dataApiFetch<Consulta[]>(
      '/consultas?select=paciente_id,data_consulta,proximo_retorno&order=data_consulta.desc',
      { method: 'GET' },
      token
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const todayIso = new Date().toISOString().split('T')[0];

    const result: PacienteSemRetorno[] = [];

    for (const paciente of pacientes) {
      // Find consultations for this paciente ordered by data_consulta desc
      const pacienteConsultas = consultas.filter((c) => c.paciente_id === paciente.id);

      if (pacienteConsultas.length > 0) {
        const ultimaConsulta = pacienteConsultas[0];
        const dataUltima = new Date(ultimaConsulta.data_consulta);

        // Check if last consultation was > 30 days ago
        if (dataUltima < thirtyDaysAgo) {
          // Check if there is NO upcoming proximo_retorno agendado (>= today)
          const temRetornoAgendado = pacienteConsultas.some(
            (c) => c.proximo_retorno && c.proximo_retorno >= todayIso
          );

          if (!temRetornoAgendado) {
            const diffTime = Math.abs(new Date().getTime() - dataUltima.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            result.push({
              id: paciente.id,
              nome: paciente.nome,
              ultima_consulta: ultimaConsulta.data_consulta,
              dias_sem_consulta: diffDays,
            });
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching pacientes sem retorno:', error);
    return [];
  }
}

// 3. Pacientes Management
export async function getPacientesList(token?: string): Promise<Paciente[]> {
  try {
    const [pacientes, consultas] = await Promise.all([
      dataApiFetch<Paciente[]>('/pacientes?select=*&order=created_at.desc', { method: 'GET' }, token),
      dataApiFetch<Consulta[]>('/consultas?select=paciente_id,data_consulta&order=data_consulta.desc', { method: 'GET' }, token).catch(() => [] as Consulta[]),
    ]);

    if (!Array.isArray(pacientes)) return [];

    const consultasMap = new Map<string, string>();
    if (Array.isArray(consultas)) {
      for (const c of consultas) {
        if (!consultasMap.has(c.paciente_id)) {
          consultasMap.set(c.paciente_id, c.data_consulta);
        }
      }
    }

    return pacientes.map((p) => ({
      ...p,
      ultima_consulta: consultasMap.get(p.id) || null,
    }));
  } catch (error) {
    console.error('Error fetching pacientes list:', error);
    return [];
  }
}

export async function createPaciente(paciente: Partial<Paciente>, token?: string): Promise<Paciente> {
  try {
    const data = await dataApiFetch<Paciente[]>(
      '/pacientes',
      {
        method: 'POST',
        body: JSON.stringify(paciente),
      },
      token
    );
    return Array.isArray(data) ? data[0] : (data as unknown as Paciente);
  } catch (error: any) {
    if (error?.message?.includes('telefone') && 'telefone' in paciente) {
      const { telefone, ...rest } = paciente;
      const data = await dataApiFetch<Paciente[]>(
        '/pacientes',
        {
          method: 'POST',
          body: JSON.stringify(rest),
        },
        token
      );
      return Array.isArray(data) ? data[0] : (data as unknown as Paciente);
    }
    throw error;
  }
}

export async function updatePaciente(id: string, paciente: Partial<Paciente>, token?: string): Promise<Paciente> {
  try {
    const data = await dataApiFetch<Paciente[]>(
      `/pacientes?id=eq.${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(paciente),
      },
      token
    );
    return Array.isArray(data) ? data[0] : (data as unknown as Paciente);
  } catch (error: any) {
    if (error?.message?.includes('telefone') && 'telefone' in paciente) {
      const { telefone, ...rest } = paciente;
      const data = await dataApiFetch<Paciente[]>(
        `/pacientes?id=eq.${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(rest),
        },
        token
      );
      return Array.isArray(data) ? data[0] : (data as unknown as Paciente);
    }
    throw error;
  }
}

export async function deletePaciente(id: string, token?: string): Promise<void> {
  await dataApiFetch<void>(
    `/pacientes?id=eq.${id}`,
    {
      method: 'DELETE',
    },
    token
  );
}

export async function getPacienteDetails(
  id: string,
  token?: string
): Promise<{ paciente: Paciente | null; consultas: Consulta[]; planos: PlanoAlimentar[] }> {
  try {
    const [pacientes, consultas, planos] = await Promise.all([
      dataApiFetch<Paciente[]>(`/pacientes?id=eq.${id}&select=*`, { method: 'GET' }, token),
      dataApiFetch<Consulta[]>(`/consultas?paciente_id=eq.${id}&select=*&order=data_consulta.desc`, { method: 'GET' }, token),
      dataApiFetch<PlanoAlimentar[]>(`/planos_alimentares?paciente_id=eq.${id}&select=*&order=created_at.desc`, { method: 'GET' }, token).catch(() => [] as PlanoAlimentar[]),
    ]);

    const paciente = Array.isArray(pacientes) && pacientes.length > 0 ? pacientes[0] : null;
    return {
      paciente,
      consultas: Array.isArray(consultas) ? consultas : [],
      planos: Array.isArray(planos) ? planos : [],
    };
  } catch (error) {
    console.error('Error fetching paciente details:', error);
    return { paciente: null, consultas: [], planos: [] };
  }
}

// 4. Consultas Management
export async function createConsulta(consulta: Partial<Consulta>, token?: string): Promise<Consulta> {
  const data = await dataApiFetch<Consulta[]>(
    '/consultas',
    {
      method: 'POST',
      body: JSON.stringify(consulta),
    },
    token
  );
  return Array.isArray(data) ? data[0] : (data as unknown as Consulta);
}

export async function deleteConsulta(id: string, token?: string): Promise<void> {
  await dataApiFetch<void>(
    `/consultas?id=eq.${id}`,
    {
      method: 'DELETE',
    },
    token
  );
}

// 5. Planos Alimentares Management & IA Generation
export async function gerarPlanoAlimentarIA(
  paciente: Paciente
): Promise<{ success: boolean; data?: PlanoSemanalData; error?: string }> {
  try {
    const response = await fetch('/api/gerar-plano', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paciente }),
    });

    const resData = await response.json();

    if (!response.ok || resData.error) {
      return {
        success: false,
        error: resData.error || 'Erro ao gerar plano alimentar com IA.',
      };
    }

    return {
      success: true,
      data: resData as PlanoSemanalData,
    };
  } catch (err: any) {
    console.error('API /api/gerar-plano call failed:', err);
    return {
      success: false,
      error: err?.message || 'Falha na conexão com o serviço de IA.',
    };
  }
}

export function gerarPlanoAlimentarManual(paciente: Paciente): PlanoSemanalData {
  const isZeroLactose =
    paciente.restricoes_alimentares?.some((r) => r.toLowerCase().includes('lactose')) ||
    paciente.alergias?.some((a) => a.toLowerCase().includes('leite'));
  const isSemGluten =
    paciente.restricoes_alimentares?.some((r) => r.toLowerCase().includes('glúten') || r.toLowerCase().includes('gluten')) ||
    paciente.alergias?.some((a) => a.toLowerCase().includes('trigo'));

  const milkOption = isZeroLactose ? 'Bebida vegetal de aveia ou amêndoa (200ml)' : 'Leite desnatado ou semidesnatado (200ml)';
  const breadOption = isSemGluten ? 'Pão sem glúten tostado com azeite' : 'Pão integral tostado com queijo cottage';
  const tapiocaOption = 'Tapioca recheada com ovos mexidos e orégano';

  const dias = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

  const plano_semanal = dias.map((dia) => ({
    dia,
    refeicoes: {
      cafe_da_manha: [
        `${milkOption} com café sem açúcar`,
        `${breadOption}`,
        `${tapiocaOption}`,
        'Ovos mexidos (2 unidades) com pitada de açafrão',
        'Mamão papaia (1/2 unidade) com aveia em flocos',
      ],
      lanche_manha: [
        'Maçã verde com punhado de castanha-do-pará (2 un)',
        'Iogurte natural (zero lactose se necessário) com chia',
        'Banana prata polvilhada com canela em pó',
        'Mix de nozes e amêndoas (30g)',
        'Suco verde funcional (couve, limão, gengibre e maçã)',
      ],
      almoco: [
        'Arroz integral (4 col de sopa) e Feijão carioca (1 concha)',
        'Peito de frango grelhado (130g) temperado com ervas',
        'Salada de folhas verdes, tomate e cenoura ralada à vontade',
        'Legumes no vapor (brócolis, abobrinha e chuchu)',
        'Azeite de oliva extra virgem (1 col de sobremesa) para temperar',
      ],
      lanche_tarde: [
        'Vitamina de banana com morango e farelo de aveia',
        'Crepioca recheada com frango desfiado e ricota',
        'Panqueca de banana rápida (1 ovo + 1 banana + aveia)',
        'Cuscuz nordestino temperado com queijo branco (ou tofu)',
        'Castanha de caju (20g) + chá verde gelado',
      ],
      jantar: [
        'Filé de tilápia assado com limão e alecrim (140g)',
        'Purê de mandioca ou batata-doce (3 col de sopa)',
        'Salada colorida de alface roxa, pepino e palmito',
        'Sopa cremosa de legumes com carne magra desfiada',
        'Omelete de 2 ovos com espinafre e tomate picado',
      ],
    },
  }));

  return { plano_semanal };
}

export async function salvarPlanoAlimentar(
  paciente_id: string,
  conteudo: PlanoSemanalData,
  token?: string
): Promise<PlanoAlimentar> {
  const data = await dataApiFetch<PlanoAlimentar[]>(
    '/planos_alimentares',
    {
      method: 'POST',
      body: JSON.stringify({
        paciente_id,
        conteudo,
      }),
    },
    token
  );
  return Array.isArray(data) ? data[0] : (data as unknown as PlanoAlimentar);
}


