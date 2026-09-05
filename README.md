# NoveNutri — Intelligent Clinical Nutrition Management & AI Meal Planning

[![Live Demo](https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://novenutri-saas.vercel.app/login)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)

Live Application: [https://novenutri-saas.vercel.app/login](https://novenutri-saas.vercel.app/login)

---

### Navigation / Navegação
- [Português](#português)
- [English](#english)

---

<a name="português"></a>
## Português

### Sobre o Projeto

O **NoveNutri** é um sistema web pensado para facilitar a rotina de atendimento de nutricionistas clínicas. Ele centraliza o cadastro de pacientes, o acompanhamento de consultas, o histórico antropométrico e a criação de cardápios semanais personalizados.

O diferencial do projeto está na geração automatizada de cardápios com inteligência artificial, utilizando a API do **Google Gemini**, integrada de forma segura no lado do servidor para evitar exposição de chaves no cliente.

🔗 **Acesse o projeto publicado na Vercel:** [https://novenutri-saas.vercel.app/login](https://novenutri-saas.vercel.app/login)

---

### Funcionalidades

- **Autenticação de Usuárias**:
  - Cadastro e login para nutricionistas via Neon Auth.
  - Controle de rotas protegidas e restauração automática de sessão.
  - Módulo de recuperação de senha estruturado. O código inclui integração com Nodemailer preparada para envio via SMTP (para envio real de e-mails em produção, basta preencher as variáveis do servidor SMTP no `.env`).

- **Dashboard de Acompanhamento**:
  - Indicadores rápidos de total de pacientes, consultas marcadas na semana e alertas de pacientes sem retorno há mais de 30 dias.

- **Prontuário do Paciente**:
  - Organização de dados pessoais, histórico clínico, sintomas e hábitos de vida.
  - Cálculo dinâmico de IMC e idade.
  - Edição rápida das informações diretamente no perfil do paciente.

- **Evolução Antropométrica**:
  - Gráfico de acompanhamento de peso ao longo do tempo (Recharts).
  - Histórico de consultas com registro de medidas (peso, cintura, quadril, % de gordura) e observações clínicas.

- **Gerador de Plano Alimentar com IA (Google Gemini)**:
  - Geração de cardápio semanal completo (7 dias, 5 refeições por dia) ajustado às metas, alergias e restrições cadastradas.
  - Respostas padronizadas via JSON estruturado (`responseMimeType: "application/json"`).
  - Editor visual interativo em abas (Segunda a Domingo) para a nutricionista revisar e alterar qualquer refeição antes de salvar.
  - Fallback automático com cardápio nutricional para garantir que o sistema continue funcional mesmo em oscilações da API de IA.
  - Histórico de planos salvos no Neon PostgreSQL.

---

### Tecnologias Utilizadas

**Frontend:**
- React 18
- TypeScript (Strict Mode)
- Vite
- Tailwind CSS
- React Router v6
- TanStack Query (React Query)
- React Hook Form + Zod
- Recharts
- Lucide React

**Backend & Banco de Dados:**
- Neon PostgreSQL
- Neon Auth (Better Auth)
- Serverless Functions / Vite API Middleware
- Google Generative AI SDK (`@google/generative-ai`)
- Nodemailer (Módulo SMTP)

---

### Desenvolvimento com Assistência de IA

Este projeto foi construído por mim utilizando assistência de IA como ferramenta de apoio ao desenvolvimento (Pair Programming com Google DeepMind Antigravity AI).

A IA atuou como um co-piloto técnico durante o processo, auxiliando em:
- Estruturação dos esquemas de banco de dados e consultas SQL.
- Engenharia de prompt para a API do Gemini retornar o cardápio em formato JSON estrito.
- Tipagem estrita com TypeScript e refatoração de componentes.
- Validações de formulário e tratamento de cenários de erro.

Essa abordagem permitiu focar nas regras de negócio e na experiência final da usuária, mantendo a qualidade de código de um projeto real.

---

### Como Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/anassc/novenutri-saas.git
   cd novenutri-saas
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o arquivo `.env`:**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   VITE_NEON_AUTH_URL=https://sua-instancia.neonauth.region.aws.neon.tech/neondb/auth
   VITE_NEON_DATA_API_URL=https://sua-instancia.apirest.region.aws.neon.tech/neondb/rest/v1
   GOOGLE_API_KEY=sua_chave_do_google_gemini
   DATABASE_URL=postgresql://usuario:senha@sua-instancia.aws.neon.tech/neondb?sslmode=require

   # Opcional - Para envio real de e-mails via SMTP:
   # SMTP_HOST=smtp.gmail.com
   # SMTP_PORT=587
   # SMTP_USER=seu_email@gmail.com
   # SMTP_PASS=sua_senha_de_app
   ```

4. **Execute a aplicação:**
   ```bash
   npm run dev
   ```
   Acesse em `http://localhost:3000`.

---

<hr />

<a name="english"></a>
## English

### About the Project

**NoveNutri** is a web application designed to streamline the daily workflow of clinical nutritionists. It centralizes patient records, appointment history, anthropometric tracking, and weekly meal plan creation.

A key highlight of the application is the automated meal plan generator powered by the **Google Gemini API**, integrated on the server side to ensure API keys are never exposed on the client.

🔗 **Live Application on Vercel:** [https://novenutri-saas.vercel.app/login](https://novenutri-saas.vercel.app/login)

---

### Features

- **User Authentication**:
  - Nutritionist signup and login powered by Neon Auth.
  - Protected route handling and session persistence.
  - Structured password recovery flow. Includes Nodemailer integration prepared for SMTP dispatch (to send real emails in production, simply fill in the SMTP variables in `.env`).

- **Dashboard**:
  - Overview metrics for total patients, weekly appointments, and overdue patient follow-up alerts (>30 days without visits).

- **Patient Records (EHR)**:
  - Organized tabs for personal information, clinical history, and lifestyle habits.
  - Live BMI and age calculations.
  - Inline editing directly from the patient profile page.

- **Anthropometric Progress**:
  - Weight tracking line chart (Recharts).
  - Consultation history logging measurements (weight, waist, hips, body fat %) and clinical notes.

- **AI Meal Plan Generator (Google Gemini)**:
  - Generates full 7-day weekly meal plans (5 meals per day) tailored to patient goals and dietary restrictions.
  - Standardized JSON responses via structured outputs (`responseMimeType: "application/json"`).
  - Interactive 7-day tabbed editor allowing nutritionists to review and adjust meals before saving.
  - Automated nutritional fallback to keep the application functional during AI API service disruptions.
  - Historical plan storage in Neon PostgreSQL.

---

### Tech Stack

**Frontend:**
- React 18
- TypeScript (Strict Mode)
- Vite
- Tailwind CSS
- React Router v6
- TanStack Query (React Query)
- React Hook Form + Zod
- Recharts
- Lucide React

**Backend & Database:**
- Neon PostgreSQL
- Neon Auth (Better Auth)
- Serverless Functions / Vite API Middleware
- Google Generative AI SDK (`@google/generative-ai`)
- Nodemailer (SMTP Module)

---

### AI-Assisted Development

This project was built with the assistance of AI development tools (Pair Programming with Google DeepMind Antigravity AI).

AI served as a technical co-pilot during the build process, assisting with:
- Relational database schema design and SQL query formulation.
- Prompt engineering to enforce strict JSON output formatting from the Gemini API.
- Strict TypeScript typing and component refactoring.
- Form validation schemas and error handling edge cases.

This workflow allowed the development process to focus heavily on domain logic and user experience while maintaining clean, maintainable code standards.

---

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/anassc/novenutri-saas.git
   cd novenutri-saas
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_NEON_AUTH_URL=https://your-instance.neonauth.region.aws.neon.tech/neondb/auth
   VITE_NEON_DATA_API_URL=https://your-instance.apirest.region.aws.neon.tech/neondb/rest/v1
   GOOGLE_API_KEY=your_google_gemini_api_key
   DATABASE_URL=postgresql://user:password@your-instance.aws.neon.tech/neondb?sslmode=require

   # Optional - For real SMTP email sending:
   # SMTP_HOST=smtp.gmail.com
   # SMTP_PORT=587
   # SMTP_USER=your_email@gmail.com
   # SMTP_PASS=your_app_password
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---
