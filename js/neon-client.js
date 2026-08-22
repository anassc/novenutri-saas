/* ==========================================================================
   NoveNutri - Neon Database & Storage Layer Client
   Manages nutricionistas, pacientes, e consultas according to Neon Schema
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

    // Initialize Pacientes Table with realistic sample data
    if (!localStorage.getItem(CONFIG.PATIENTS_STORAGE_KEY)) {
      const defaultNutriId = CONFIG.DEMO_NUTRICIONISTA.id;
      const samplePatients = [
        {
          id: 'p1001-active-1',
          nutricionista_id: defaultNutriId,
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
          id: 'p1002-active-2',
          nutricionista_id: defaultNutriId,
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
          id: 'p1003-no-return-1',
          nutricionista_id: defaultNutriId,
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
          id: 'p1004-no-return-2',
          nutricionista_id: defaultNutriId,
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
      localStorage.setItem(CONFIG.PATIENTS_STORAGE_KEY, JSON.stringify(samplePatients));
    }

    // Initialize Consultas Table with sample data (including consultations this week and past consultations >30 days ago)
    if (!localStorage.getItem(CONFIG.CONSULTATIONS_STORAGE_KEY)) {
      const now = new Date();
      // Calculate date within current week (e.g. today or yesterday)
      const thisWeekDate1 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0];
      const thisWeekDate2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3).toISOString().split('T')[0];
      
      // Consultations > 30 days ago
      const past35Days = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const past42Days = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const sampleConsultations = [
        {
          id: 'c2001',
          paciente_id: 'p1001-active-1',
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
          paciente_id: 'p1002-active-2',
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
          paciente_id: 'p1003-no-return-1',
          data_consulta: past35Days, // > 30 days ago
          peso: 61.0,
          cintura: 70,
          quadril: 94,
          percentual_gordura: 23.0,
          observacoes: 'Consulta inicial de avaliação.',
          proximo_retorno: null, // Sem retorno agendado
          created_at: past35Days
        },
        {
          id: 'c2004',
          paciente_id: 'p1004-no-return-2',
          data_consulta: past42Days, // > 30 days ago
          peso: 92.0,
          cintura: 86,
          quadril: 104,
          percentual_gordura: 16.5,
          observacoes: 'Avaliação física inicial.',
          proximo_retorno: null, // Sem retorno agendado
          created_at: past42Days
        }
      ];
      localStorage.setItem(CONFIG.CONSULTATIONS_STORAGE_KEY, JSON.stringify(sampleConsultations));
    }
  }

  // --- NUTRICIONISTAS (AUTH) OPERATONS ---
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
    return newConsulta;
  }

  // --- DASHBOARD REAL-TIME METRICS CALCULATIONS ---

  /**
   * Card 1: Total de Pacientes Ativos do Nutricionista Logado
   */
  getTotalPacientesAtivos(nutricionistaId) {
    const pacientes = this.getPacientesByNutricionista(nutricionistaId);
    return pacientes.length;
  }

  /**
   * Card 2: Consultas da semana atual
   */
  getConsultasDaSemana(nutricionistaId) {
    const consultas = this.getAllConsultasByNutricionista(nutricionistaId);
    const now = new Date();

    // Calculate start (Monday 00:00:00) and end (Sunday 23:59:59) of current week
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + distanceToMonday, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

    return consultas.filter(c => {
      const consultationDate = new Date(c.data_consulta + 'T00:00:00');
      return consultationDate >= startOfWeek && consultationDate <= endOfWeek;
    }).length;
  }

  /**
   * Card 3: Pacientes sem retorno
   * Lista dos pacientes cuja última consulta foi há mais de 30 dias E não possuem próximo retorno agendado
   */
  getPacientesSemRetorno(nutricionistaId) {
    const pacientes = this.getPacientesByNutricionista(nutricionistaId);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const pacientesSemRetorno = [];

    pacientes.forEach(paciente => {
      const consultas = this.getConsultasByPaciente(paciente.id);
      
      if (consultas.length === 0) return; // Se não teve nenhuma consulta ainda, não entra como sem retorno
      
      const ultimaConsulta = consultas[0]; // Ordenado pela mais recente
      const dataUltima = new Date(ultimaConsulta.data_consulta + 'T00:00:00');
      
      // Tem mais de 30 dias desde a última consulta?
      const sePassaram30Dias = dataUltima < thirtyDaysAgo;

      // Tem próximo retorno agendado válido no futuro?
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

// Global Neon Client Instance
const neonDB = new NeonClient();
