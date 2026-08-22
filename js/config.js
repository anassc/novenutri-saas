/* ==========================================================================
   NoveNutri - Configuration & Neon Database Parameters
   ========================================================================== */

const CONFIG = {
  APP_NAME: 'NoveNutri',
  NEON_PROJECT_NAME: 'NoveNutri',
  SESSION_STORAGE_KEY: 'novenutri_active_session',
  USERS_STORAGE_KEY: 'novenutri_db_nutricionistas',
  PATIENTS_STORAGE_KEY: 'novenutri_db_pacientes',
  CONSULTATIONS_STORAGE_KEY: 'novenutri_db_consultas',
  MEAL_PLANS_STORAGE_KEY: 'novenutri_db_planos',

  // Pre-seeded Demo Data for immediate out-of-the-box experience
  DEMO_NUTRICIONISTA: {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    nome: 'Ana Carolina',
    email: 'anacarolina-costa1999@outlook.com',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
};
