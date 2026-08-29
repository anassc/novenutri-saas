import { Nutricionista, Paciente, Consulta, PacienteSemRetorno, PlanoAlimentar } from '../types';

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

