import { Nutricionista, Paciente, Consulta, PacienteSemRetorno } from '../types';

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
    throw new Error(`Data API request failed: ${response.statusText}`);
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
    const data = await dataApiFetch<Paciente[]>('/pacientes?select=*&order=created_at.desc', { method: 'GET' }, token);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching pacientes list:', error);
    return [];
  }
}

export async function getPacienteDetails(id: string, token?: string): Promise<{ paciente: Paciente | null; consultas: Consulta[] }> {
  try {
    const [pacientes, consultas] = await Promise.all([
      dataApiFetch<Paciente[]>(`/pacientes?id=eq.${id}&select=*`, { method: 'GET' }, token),
      dataApiFetch<Consulta[]>(`/consultas?paciente_id=eq.${id}&select=*&order=data_consulta.desc`, { method: 'GET' }, token),
    ]);

    const paciente = Array.isArray(pacientes) && pacientes.length > 0 ? pacientes[0] : null;
    return {
      paciente,
      consultas: Array.isArray(consultas) ? consultas : [],
    };
  } catch (error) {
    console.error('Error fetching paciente details:', error);
    return { paciente: null, consultas: [] };
  }
}
