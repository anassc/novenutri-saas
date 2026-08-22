/* ==========================================================================
   NoveNutri - Application Router & Main Coordinator
   ========================================================================== */

class App {
  constructor() {
    this.currentView = 'login';
  }

  init() {
    this.setupEventListeners();
    this.handleRouting();

    // Check if user is already logged in
    // Rule: Se já estiver logada e tentar acessar a tela de login, redirecionar direto para o dashboard
    if (auth.isLoggedIn()) {
      if (window.location.hash === '' || window.location.hash === '#login' || window.location.hash === '#register') {
        window.location.hash = '#dashboard';
      }
    } else {
      window.location.hash = '#login';
    }
  }

  setupEventListeners() {
    // Hash change routing
    window.addEventListener('hashchange', () => this.handleRouting());

    // Password toggle buttons
    document.querySelectorAll('.toggle-password').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = btn.previousElementSibling;
        if (input && input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          `;
        } else if (input) {
          input.type = 'password';
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          `;
        }
      });
    });

    // Login Form Submit
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const alertBox = document.getElementById('login-error-alert');

        alertBox.classList.add('hidden');
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Entrando...';

        try {
          await auth.login(email, password);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Entrar';
          window.location.hash = '#dashboard';
          this.showToast('Login realizado com sucesso!', 'success');
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Entrar';
          alertBox.textContent = err;
          alertBox.classList.remove('hidden');
        }
      });
    }

    // Register Form Submit
    const registerForm = document.getElementById('form-register');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('register-nome').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const alertBox = document.getElementById('register-error-alert');

        alertBox.classList.add('hidden');
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Criando conta...';

        try {
          await auth.register(nome, email, password, confirmPassword);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Criar conta';
          window.location.hash = '#dashboard';
          this.showToast('Conta criada e registrada com sucesso!', 'success');
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Criar conta';
          alertBox.textContent = err;
          alertBox.classList.remove('hidden');
        }
      });
    }

    // New Patient Form Submit
    const patientForm = document.getElementById('form-new-patient');
    if (patientForm) {
      patientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(patientForm);
        patientsCtrl.saveNewPatient(formData);
        patientForm.reset();
      });
    }
  }

  handleRouting() {
    const hash = window.location.hash.replace('#', '') || 'login';
    const user = auth.getCurrentUser();

    // Route Protection
    if (!user && (hash === 'dashboard' || hash === 'pacientes')) {
      window.location.hash = '#login';
      this.renderView('login');
      return;
    }

    if (user && (hash === 'login' || hash === 'register')) {
      window.location.hash = '#dashboard';
      this.renderView('dashboard');
      return;
    }

    this.renderView(hash);
  }

  renderView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.app-view').forEach(view => {
      view.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.classList.add('active');
    }

    // Update active nav item in sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === `#${viewName}`) {
        item.classList.add('active');
      }
    });

    const user = auth.getCurrentUser();
    if (user) {
      document.querySelectorAll('.user-name-display').forEach(el => {
        el.textContent = user.nome;
      });
      document.querySelectorAll('.user-avatar-display').forEach(el => {
        el.textContent = user.nome.charAt(0);
      });
    }

    // Trigger View Specific Controllers
    if (viewName === 'dashboard') {
      dashboardCtrl.render();
    } else if (viewName === 'pacientes') {
      patientsCtrl.render();
    }
  }

  showPatientDetails(pacienteId) {
    const paciente = neonDB.getPacienteById(pacienteId);
    if (!paciente) return;

    const consultas = neonDB.getConsultasByPaciente(pacienteId);

    const detailContent = document.getElementById('patient-detail-content');
    if (detailContent) {
      detailContent.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
          <div class="patient-avatar" style="width: 54px; height: 54px; font-size: 1.4rem;">${paciente.nome.charAt(0)}</div>
          <div>
            <h3 style="font-size: 1.3rem; color: var(--neutral-900);">${paciente.nome}</h3>
            <p style="font-size: 0.85rem; color: var(--neutral-500);">${paciente.email || 'Sem e-mail'} | WhatsApp: ${paciente.whatsapp || '-'}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; background: var(--neutral-50); padding: 16px; border-radius: 12px;">
          <div><span style="font-size: 0.75rem; color: var(--neutral-500);">Peso Inicial</span><br><strong>${paciente.peso_inicial} kg</strong></div>
          <div><span style="font-size: 0.75rem; color: var(--neutral-500);">Altura</span><br><strong>${paciente.altura} m</strong></div>
          <div><span style="font-size: 0.75rem; color: var(--neutral-500);">Nível Atividade</span><br><strong>${paciente.nivel_atividade || '-'}</strong></div>
        </div>

        <h4 style="margin-bottom: 12px; font-size: 1rem; color: var(--neutral-800);">Histórico de Consultas (${consultas.length})</h4>
        ${consultas.length === 0 ? '<p style="color: var(--neutral-500); font-size: 0.9rem;">Nenhuma consulta registrada ainda.</p>' : `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${consultas.map(c => `
              <div style="padding: 12px; border: 1px solid var(--neutral-200); border-radius: 8px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <strong>Data: ${patientsCtrl.formatDate(c.data_consulta)}</strong>
                  <span style="color: var(--primary-700); font-weight: 600;">Peso: ${c.peso} kg | Gordura: ${c.percentual_gordura}%</span>
                </div>
                <p style="font-size: 0.85rem; color: var(--neutral-600);">${c.observacoes || 'Sem observações'}</p>
              </div>
            `).join('')}
          </div>
        `}
      `;
      this.openModal('modal-patient-details');
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
