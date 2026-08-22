/* ==========================================================================
   NoveNutri - Neon Database & Storage Layer Client
   Manages nutricionistas, pacientes, e consultas according to Neon Schema
   Supports real-time direct SQL execution to Neon PostgreSQL cloud!
   ========================================================================== */

class NeonClient {
  constructor() {
    this.initDatabase();
  }

  initDatabase() {
    if (!localStorage.getItem(CONFIG.USERS_STORAGE_KEY)) {
      localStorage.setItem(CONFIG.USERS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(CONFIG.PATIENTS_STORAGE_KEY)) {
      localStorage.setItem(CONFIG.PATIENTS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(CONFIG.CONSULTATIONS_STORAGE_KEY)) {
      localStorage.setItem(CONFIG.CONSULTATIONS_STORAGE_KEY, JSON.stringify([]));
    }
  }

  // --- NEON REAL-TIME DIRECT HTTP SQL EXECUTION ---
  async executeNeonSQL(query, params = []) {
    const connStr = localStorage.getItem('novenutri_neon_conn_str') || CONFIG.NEON_CONNECTION_STRING;
    if (!connStr) return null;

    try {
      let endpoint = connStr;
      if (!endpoint.startsWith('http')) {
        const match = connStr.match(/@([^/]+)\/([^?]+)/);
        if (match) {
          endpoint = `https://${match[1]}/sql`;
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${connStr}`
        },
        body: JSON.stringify({ query, params })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Neon Cloud API sync:', e);
    }
    return null;
  }

  // --- NUTRICIONISTAS (AUTH) OPERATIONS ---
  getNutricionistas() {
    return JSON.parse(localStorage.getItem(CONFIG.USERS_STORAGE_KEY) || '[]');
  }

  findNutricionistaByEmail(email) {
    const list = this.getNutricionistas();
    return list.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  addNutricionista(nome, email) {
    const list = this.getNutricionistas();
    const newNutri = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'n-' + Date.now(),
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      created_at: new Date().toISOString()
    };
    list.push(newNutri);
    localStorage.setItem(CONFIG.USERS_STORAGE_KEY, JSON.stringify(list));

    // Try Real-Time Insert to Neon Database
    this.executeNeonSQL(
      `INSERT INTO nutricionistas (id, nome, email, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING;`,
      [newNutri.id, newNutri.nome, newNutri.email, newNutri.created_at]
    );

    return newNutri;
  }

  // --- PACIENTES OPERATIONS ---
  getPacientesByNutricionista(nutricionistaId) {
    const allPacientes = JSON.parse(localStorage.getItem(CONFIG.PATIENTS_STORAGE_KEY) || '[]');
    return allPacientes.filter(p => p.nutricionista_id === nutricionistaId);
  }

  getPacienteById(pacienteId) {
    const allPacientes = JSON.parse(localStorage.getItem(CONFIG.PATIENTS_STORAGE_KEY) || '[]');
    return allPacientes.find(p => p.id === pacienteId);
  }

  addPaciente(pacienteData) {
    const allPacientes = JSON.parse(localStorage.getItem(CONFIG.PATIENTS_STORAGE_KEY) || '[]');
    const newPaciente = {
      ...pacienteData,
      id: crypto.randomUUID ? crypto.randomUUID() : 'p-' + Date.now(),
      created_at: new Date().toISOString()
    };
    allPacientes.push(newPaciente);
    localStorage.setItem(CONFIG.PATIENTS_STORAGE_KEY, JSON.stringify(allPacientes));

    // Try Real-Time Insert to Neon Database
    this.executeNeonSQL(
      `INSERT INTO pacientes (id, nutricionista_id, nome, email, whatsapp, sexo, peso_inicial, altura, objetivo_texto, nivel_atividade, observacoes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
      [newPaciente.id, newPaciente.nutricionista_id, newPaciente.nome, newPaciente.email, newPaciente.whatsapp, newPaciente.sexo, newPaciente.peso_inicial, newPaciente.altura, newPaciente.objetivo_texto, newPaciente.nivel_atividade, newPaciente.observacoes, newPaciente.created_at]
    );

    return newPaciente;
  }

  // --- CONSULTAS OPERATIONS ---
  getConsultasByPaciente(pacienteId) {
    const allConsultas = JSON.parse(localStorage.getItem(CONFIG.CONSULTATIONS_STORAGE_KEY) || '[]');
    return allConsultas.filter(c => c.paciente_id === pacienteId)
                       .sort((a, b) => new Date(b.data_consulta) - new Date(a.data_consulta));
  }

  getAllConsultasByNutricionista(nutricionistaId) {
    const pacientes = this.getPacientesByNutricionista(nutricionistaId);
    const pacienteIds = new Set(pacientes.map(p => p.id));
    const allConsultas = JSON.parse(localStorage.getItem(CONFIG.CONSULTATIONS_STORAGE_KEY) || '[]');
    return allConsultas.filter(c => pacienteIds.has(c.paciente_id));
  }

  addConsulta(consultaData) {
    const allConsultas = JSON.parse(localStorage.getItem(CONFIG.CONSULTATIONS_STORAGE_KEY) || '[]');
    const newConsulta = {
      ...consultaData,
      id: crypto.randomUUID ? crypto.randomUUID() : 'c-' + Date.now(),
      created_at: new Date().toISOString()
    };
    allConsultas.push(newConsulta);
    localStorage.setItem(CONFIG.CONSULTATIONS_STORAGE_KEY, JSON.stringify(allConsultas));

    // Try Real-Time Insert to Neon Database
    this.executeNeonSQL(
      `INSERT INTO consultas (id, paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [newConsulta.id, newConsulta.paciente_id, newConsulta.data_consulta, newConsulta.peso, newConsulta.cintura, newConsulta.quadril, newConsulta.percentual_gordura, newConsulta.observacoes, newConsulta.proximo_retorno, newConsulta.created_at]
    );

    return newConsulta;
  }

  // --- DASHBOARD REAL-TIME METRICS CALCULATIONS ---
  getTotalPacientesAtivos(nutricionistaId) {
    const pacientes = this.getPacientesByNutricionista(nutricionistaId);
    return pacientes.length;
  }

  getConsultasDaSemana(nutricionistaId) {
    const consultas = this.getAllConsultasByNutricionista(nutricionistaId);
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + distanceToMonday, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

    return consultas.filter(c => {
      const consultationDate = new Date(c.data_consulta + 'T00:00:00');
      return consultationDate >= startOfWeek && consultationDate <= endOfWeek;
    }).length;
  }

  getPacientesSemRetorno(nutricionistaId) {
    const pacientes = this.getPacientesByNutricionista(nutricionistaId);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const pacientesSemRetorno = [];

    pacientes.forEach(paciente => {
      const consultas = this.getConsultasByPaciente(paciente.id);
      if (consultas.length === 0) return;
      
      const ultimaConsulta = consultas[0];
      const dataUltima = new Date(ultimaConsulta.data_consulta + 'T00:00:00');
      const sePassaram30Dias = dataUltima < thirtyDaysAgo;

      let temProximoRetornoNoFuturo = false;
      if (ultimaConsulta.proximo_retorno) {
        const dataRetorno = new Date(ultimaConsulta.proximo_retorno + 'T00:00:00');
        if (dataRetorno >= now) {
          temProximoRetornoNoFuturo = true;
        }
      }

      if (sePassaram30Dias && !temProximoRetornoNoFuturo) {
        const diasSemConsulta = Math.floor((now - dataUltima) / (1000 * 60 * 60 * 24));
        pacientesSemRetorno.push({
          paciente: paciente,
          ultimaConsulta: ultimaConsulta,
          diasSemConsulta: diasSemConsulta
        });
      }
    });

    return pacientesSemRetorno;
  }
}

const neonDB = new NeonClient();
