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
    // Initialize Nutricionistas Table
    if (!localStorage.getItem(CONFIG.USERS_STORAGE_KEY)) {
      const defaultUsers = [
        CONFIG.DEMO_NUTRICIONISTA,
        {
          id: 'e11aa20c-48bb-4271-b456-0e02b2c3d999',
          nome: 'Dra. Mariana Silva',
          email: 'mariana.nutri@exemplo.com',
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem(CONFIG.USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    }

    // Initialize Pacientes Table
    if (!localStorage.getItem(CONFIG.PATIENTS_STORAGE_KEY)) {
      this.seedDefaultPatients(CONFIG.DEMO_NUTRICIONISTA.id);
    }

    // Initialize Consultas Table
    if (!localStorage.getItem(CONFIG.CONSULTATIONS_STORAGE_KEY)) {
      this.seedDefaultConsultations();
    }
  }

  seedDefaultPatients(nutricionistaId) {
    const allPacientes = JSON.parse(localStorage.getItem(CONFIG.PATIENTS_STORAGE_KEY) || '[]');
    
    // Check if this nutritionist already has patients
    const existing = allPacientes.filter(p => p.nutricionista_id === nutricionistaId);
    if (existing.length > 0) return allPacientes;

    const samplePatients = [
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        nutricionista_id: nutricionistaId,
        nome: 'Juliana Fernandes',
        email: 'juliana.f@gmail.com',
        whatsapp: '(11) 98765-4321',
        data_nascimento: '1992-05-14',
        sexo: 'Feminino',
        peso_inicial: 68.5,
        altura: 1.65,
        objetivos: ['Emagrecimento', 'Hipertrofia'],
        objetivo_texto: 'Perder 5kg de gordura e ganhar massa magra',
        nivel_atividade: 'Moderado',
        patologias: [],
        restricoes_alimentares: ['Lactose'],
        alergias: ['Amendoim'],
        medicamentos: 'Nenhum',
        suplementos: 'Whey Protein, Creatina',
        refeicoes_por_dia: 4,
        horario_acorda: '06:30',
        horario_dorme: '22:30',
        litros_agua: 2.5,
        atividade_fisica: true,
        atividade_fisica_descricao: 'Musculação 4x na semana',
        observacoes: 'Paciente motivada, sem queixas gastrointestinais.',
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        nutricionista_id: nutricionistaId,
        nome: 'Carlos Eduardo Santos',
        email: 'carlos.santos@hotmail.com',
        whatsapp: '(11) 97123-8899',
        data_nascimento: '1985-11-20',
        sexo: 'Masculino',
        peso_inicial: 84.0,
        altura: 1.78,
        objetivos: ['Reeducação Alimentar', 'Saúde Cardiovascular'],
        objetivo_texto: 'Melhorar perfil lipídico e controlar ansiedade',
        nivel_atividade: 'Leve',
        patologias: ['Dislipidemia'],
        restricoes_alimentares: [],
        alergias: [],
        medicamentos: 'Sinvastatina',
        suplementos: 'Omega 3',
        refeicoes_por_dia: 5,
        horario_acorda: '07:00',
        horario_dorme: '23:00',
        litros_agua: 3.0,
        atividade_fisica: true,
        atividade_fisica_descricao: 'Caminhada 3x na semana',
        observacoes: 'Dificuldade em manter rotina nos finais de semana.',
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        nutricionista_id: nutricionistaId,
        nome: 'Beatriz Lima Ribeiro',
        email: 'beatriz.ribeiro@outlook.com',
        whatsapp: '(11) 96543-2100',
        data_nascimento: '1998-03-08',
        sexo: 'Feminino',
        peso_inicial: 61.0,
        altura: 1.60,
        objetivos: ['Emagrecimento'],
        objetivo_texto: 'Manutenção de peso e rotina saudável',
        nivel_atividade: 'Sedentário',
        patologias: [],
        restricoes_alimentares: ['Glúten'],
        alergias: [],
        medicamentos: 'Nenhum',
        suplementos: 'Multivitamínico',
        refeicoes_por_dia: 3,
        horario_acorda: '08:00',
        horario_dorme: '00:00',
        litros_agua: 1.5,
        atividade_fisica: false,
        atividade_fisica_descricao: '',
        observacoes: 'Não retornou para a consulta de acompanhamento agendada no mês passado.',
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        nutricionista_id: nutricionistaId,
        nome: 'Lucas Gabriel Rocha',
        email: 'lucas.rocha@gmail.com',
        whatsapp: '(11) 95555-4433',
        data_nascimento: '1990-09-12',
        sexo: 'Masculino',
        peso_inicial: 92.0,
        altura: 1.82,
        objetivos: ['Hipertrofia'],
        objetivo_texto: 'Ganho de massa muscular com dieta normocalórica',
        nivel_atividade: 'Intenso',
        patologias: [],
        restricoes_alimentares: [],
        alergias: [],
        medicamentos: 'Nenhum',
        suplementos: 'Whey, Creatina, Beta-Alanina',
        refeicoes_por_dia: 6,
        horario_acorda: '05:30',
        horario_dorme: '22:00',
        litros_agua: 4.0,
        atividade_fisica: true,
        atividade_fisica_descricao: 'Crossfit 5x na semana',
        observacoes: 'Última consulta realizada há 42 dias. Sem retorno agendado.',
        created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    allPacientes.push(...samplePatients);
    localStorage.setItem(CONFIG.PATIENTS_STORAGE_KEY, JSON.stringify(allPacientes));
    return allPacientes;
  }

  seedDefaultConsultations() {
    const now = new Date();
    const thisWeekDate1 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0];
    const thisWeekDate2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3).toISOString().split('T')[0];
    const past35Days = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const past42Days = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const sampleConsultations = [
      {
        id: 'c2001',
        paciente_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        data_consulta: thisWeekDate1,
        peso: 67.2,
        cintura: 72,
        quadril: 96,
        percentual_gordura: 21.5,
        observacoes: 'Perdeu 1.3kg de gordura. Excelente evolução!',
        proximo_retorno: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date().toISOString()
      },
      {
        id: 'c2002',
        paciente_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        data_consulta: thisWeekDate2,
        peso: 82.5,
        cintura: 89,
        quadril: 102,
        percentual_gordura: 24.0,
        observacoes: 'Melhora nos exames laboratoriais. Manter o plano alimentar.',
        proximo_retorno: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date().toISOString()
      },
      {
        id: 'c2003',
        paciente_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        data_consulta: past35Days,
        peso: 61.0,
        cintura: 70,
        quadril: 94,
        percentual_gordura: 23.0,
        observacoes: 'Consulta inicial de avaliação.',
        proximo_retorno: null,
        created_at: past35Days
      },
      {
        id: 'c2004',
        paciente_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
        data_consulta: past42Days,
        peso: 92.0,
        cintura: 86,
        quadril: 104,
        percentual_gordura: 16.5,
        observacoes: 'Avaliação física inicial.',
        proximo_retorno: null,
        created_at: past42Days
      }
    ];
    localStorage.setItem(CONFIG.CONSULTATIONS_STORAGE_KEY, JSON.stringify(sampleConsultations));
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

    // Ensure nutritionist gets sample patients so dashboard is never empty
    this.seedDefaultPatients(newNutri.id);

    // Try Real-Time Insert to Neon Database
    this.executeNeonSQL(
      `INSERT INTO nutricionistas (id, nome, email, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING;`,
      [newNutri.id, newNutri.nome, newNutri.email, newNutri.created_at]
    );

    return newNutri;
  }

  // --- PACIENTES OPERATIONS ---
  getPacientesByNutricionista(nutricionistaId) {
    let allPacientes = JSON.parse(localStorage.getItem(CONFIG.PATIENTS_STORAGE_KEY) || '[]');
    let userPacientes = allPacientes.filter(p => p.nutricionista_id === nutricionistaId);

    // Auto-seed if user has no patients yet
    if (userPacientes.length === 0) {
      allPacientes = this.seedDefaultPatients(nutricionistaId);
      userPacientes = allPacientes.filter(p => p.nutricionista_id === nutricionistaId);
    }

    return userPacientes;
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
