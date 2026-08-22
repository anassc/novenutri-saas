/* ==========================================================================
   NoveNutri - Dashboard Controller (Prompt 3 Implementation)
   ========================================================================== */

class DashboardController {
  constructor() {
    this.containerId = 'dashboard-view';
  }

  render() {
    const user = auth.getCurrentUser();
    if (!user) {
      app.renderView('login');
      return;
    }

    // Load real-time metrics from Neon database
    const totalPacientes = neonDB.getTotalPacientesAtivos(user.id);
    const consultasSemana = neonDB.getConsultasDaSemana(user.id);
    const pacientesSemRetorno = neonDB.getPacientesSemRetorno(user.id);

    // Update greeting
    const welcomeEl = document.getElementById('dash-user-name');
    if (welcomeEl) {
      welcomeEl.textContent = user.nome;
    }

    // Update Card 1: Total de Pacientes Ativos
    const card1Value = document.getElementById('metric-total-pacientes');
    if (card1Value) {
      card1Value.textContent = totalPacientes;
    }

    // Update Card 2: Consultas da Semana
    const card2Value = document.getElementById('metric-consultas-semana');
    if (card2Value) {
      card2Value.textContent = consultasSemana;
    }

    // Update Card 3: Pacientes Sem Retorno
    const listContainer = document.getElementById('list-pacientes-sem-retorno');
    if (listContainer) {
      if (pacientesSemRetorno.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 8px; color: var(--primary-500);">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <p>Nenhum paciente sem retorno no momento</p>
          </div>
        `;
      } else {
        listContainer.innerHTML = pacientesSemRetorno.map(item => `
          <a href="#pacientes" onclick="app.showPatientDetails('${item.paciente.id}')" class="patient-return-item">
            <div class="patient-item-info">
              <div class="patient-avatar">
                ${item.paciente.nome.charAt(0)}
              </div>
              <div>
                <span class="patient-name-link">${item.paciente.nome}</span>
                <div style="font-size: 0.78rem; color: var(--neutral-500);">
                  Última consulta: ${this.formatDate(item.ultimaConsulta.data_consulta)}
                </div>
              </div>
            </div>
            <span class="last-consultation-tag">
              Há ${item.diasSemConsulta} dias sem retorno
            </span>
          </a>
        `).join('');
      }
    }
  }

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }
}

const dashboardCtrl = new DashboardController();
