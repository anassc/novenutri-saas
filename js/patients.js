/* ==========================================================================
   NoveNutri - Patient Management Controller
   ========================================================================== */

class PatientsController {
  render() {
    const user = auth.getCurrentUser();
    if (!user) {
      app.renderView('login');
      return;
    }

    const pacientes = neonDB.getPacientesByNutricionista(user.id);
    const tbody = document.getElementById('patients-table-body');
    
    if (!tbody) return;

    if (pacientes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            Nenhum paciente cadastrado ainda. Clique em "+ Novo Paciente" para começar.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pacientes.map(p => {
      const consultas = neonDB.getConsultasByPaciente(p.id);
      const ultimaConsulta = consultas.length > 0 ? consultas[0].data_consulta : 'Sem registros';

      return `
        <tr onclick="app.showPatientDetails('${p.id}')">
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="patient-avatar">${p.nome.charAt(0)}</div>
              <div>
                <strong style="color: var(--neutral-900);">${p.nome}</strong>
                <div style="font-size: 0.78rem; color: var(--neutral-500);">${p.email || '-'}</div>
              </div>
            </div>
          </td>
          <td>${p.whatsapp || '-'}</td>
          <td>${p.peso_inicial ? p.peso_inicial + ' kg' : '-'}</td>
          <td>${p.altura ? p.altura + ' m' : '-'}</td>
          <td>${this.formatDate(ultimaConsulta)}</td>
          <td>
            <button class="btn btn-ghost" style="padding: 4px 8px; font-size: 0.8rem;" onclick="event.stopPropagation(); app.showPatientDetails('${p.id}')">
              Ver Perfil
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  formatDate(dateStr) {
    if (!dateStr || dateStr === 'Sem registros') return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  saveNewPatient(formData) {
    const user = auth.getCurrentUser();
    if (!user) return;

    const pacienteData = {
      nutricionista_id: user.id,
      nome: formData.get('nome'),
      email: formData.get('email'),
      whatsapp: formData.get('whatsapp'),
      data_nascimento: formData.get('data_nascimento'),
      sexo: formData.get('sexo'),
      peso_inicial: parseFloat(formData.get('peso_inicial')) || 0,
      altura: parseFloat(formData.get('altura')) || 0,
      objetivo_texto: formData.get('objetivo_texto'),
      nivel_atividade: formData.get('nivel_atividade'),
      medicamentos: formData.get('medicamentos'),
      suplementos: formData.get('suplementos'),
      litros_agua: parseFloat(formData.get('litros_agua')) || 2.0,
      observacoes: formData.get('observacoes')
    };

    neonDB.addPaciente(pacienteData);
    app.closeModal('modal-new-patient');
    app.showToast('Paciente cadastrado com sucesso!', 'success');
    this.render();
    dashboardCtrl.render();
  }
}

const patientsCtrl = new PatientsController();
