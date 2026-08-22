/* ==========================================================================
   NoveNutri (Feriani Nutri SBM) - Configuration & Environment Parameters
   ========================================================================== */

const CONFIG = {
  APP_NAME: 'NoveNutri',
  NEON_PROJECT_NAME: 'NoveNutri',

  // String de Conexão do Neon PostgreSQL (ex: postgresql://user:pass@ep-xyz.neon.tech/neondb)
  NEON_CONNECTION_STRING: (typeof process !== 'undefined' && process.env?.VITE_NEON_AUTH_URL) || 
                          (typeof window !== 'undefined' && window.env?.VITE_NEON_AUTH_URL) || 
                          localStorage.getItem('novenutri_neon_conn_str') || '',

  SESSION_STORAGE_KEY: 'novenutri_active_session',
  USERS_STORAGE_KEY: 'novenutri_db_nutricionistas',
  PATIENTS_STORAGE_KEY: 'novenutri_db_pacientes',
  CONSULTATIONS_STORAGE_KEY: 'novenutri_db_consultas',
  MEAL_PLANS_STORAGE_KEY: 'novenutri_db_planos',

  // Conta padrão para acesso inicial de desenvolvimento
  DEMO_NUTRICIONISTA: {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    nome: 'Ana Carolina',
    email: 'anacarolina-costa1999@outlook.com',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
};
