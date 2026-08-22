/* ==========================================================================
   NoveNutri - Authentication Manager (Prompt 2 Implementation)
   ========================================================================== */

class AuthManager {
  constructor() {
    this.sessionKey = CONFIG.SESSION_STORAGE_KEY;
  }

  /**
   * Get active logged in user session
   */
  getCurrentUser() {
    const raw = localStorage.getItem(this.sessionKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  /**
   * Login user with email & password
   */
  login(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Rule: Password minimum 6 characters
        if (!password || password.length < 6) {
          return reject('A senha deve ter no mínimo 6 caracteres.');
        }

        const user = neonDB.findNutricionistaByEmail(email);

        if (!user) {
          return reject('E-mail ou senha incorretos. Caso ainda não tenha uma conta, clique em Cadastre-se.');
        }

        // Save session to local storage for persistence
        this.setSession(user);
        resolve(user);
      }, 400); // Realistic small network simulation
    });
  }

  /**
   * Register new nutritionist
   * Rule: Save name and email to `nutricionistas` table in Neon
   */
  register(nomeCompleto, email, password, confirmPassword) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Validations
        if (!nomeCompleto || nomeCompleto.trim().length < 3) {
          return reject('Por favor, informe seu nome completo.');
        }
        if (!email || !email.includes('@')) {
          return reject('Por favor, insira um e-mail válido.');
        }
        if (!password || password.length < 6) {
          return reject('A senha deve ter no mínimo 6 caracteres.');
        }
        if (password !== confirmPassword) {
          return reject('As senhas não coincidem. Digite novamente.');
        }

        // Check if email already registered
        const existing = neonDB.findNutricionistaByEmail(email);
        if (existing) {
          return reject('Este e-mail já está cadastrado. Faça login para continuar.');
        }

        // Save user to Neon database
        const newUser = neonDB.addNutricionista(nomeCompleto, email);

        // Auto-login and create persistent session
        this.setSession(newUser);
        resolve(newUser);
      }, 400);
    });
  }

  /**
   * Save session
   */
  setSession(user) {
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
  }

  /**
   * Logout user and clear session
   */
  logout() {
    localStorage.removeItem(this.sessionKey);
    window.location.hash = '#login';
    app.renderView('login');
    app.showToast('Sessão encerrada com sucesso.', 'success');
  }
}

const auth = new AuthManager();
