-- ==========================================================================
-- NoveNutri (Feriani Nutri SBM) — Script de Povoamento Inicial para Neon PostgreSQL
-- Execute este script no SQL Editor do seu Neon Console para preencher as tabelas!
-- ==========================================================================

-- 1. Inserir Nutricionista Principal
INSERT INTO nutricionistas (id, nome, email, created_at)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Ana Carolina',
  'anacarolina-costa1999@outlook.com',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 2. Inserir Pacientes
INSERT INTO pacientes (id, nutricionista_id, nome, email, whatsapp, data_nascimento, sexo, peso_inicial, altura, objetivo_texto, nivel_atividade, medicamentos, suplementos, refeicoes_por_dia, litros_agua, atividade_fisica, atividade_fisica_descricao, observacoes, created_at)
VALUES 
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Juliana Fernandes',
  'juliana.f@gmail.com',
  '(11) 98765-4321',
  '1992-05-14',
  'Feminino',
  68.5,
  1.65,
  'Perder 5kg de gordura e ganhar massa magra',
  'Moderado',
  'Nenhum',
  'Whey Protein, Creatina',
  4,
  2.5,
  TRUE,
  'Musculação 4x na semana',
  'Paciente motivada, sem queixas gastrointestinais.',
  NOW() - INTERVAL '60 days'
),
(
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Carlos Eduardo Santos',
  'carlos.santos@hotmail.com',
  '(11) 97123-8899',
  '1985-11-20',
  'Masculino',
  84.0,
  1.78,
  'Melhorar perfil lipídico e controlar ansiedade',
  'Leve',
  'Sinvastatina',
  'Omega 3',
  5,
  3.0,
  TRUE,
  'Caminhada 3x na semana',
  'Dificuldade em manter rotina nos finais de semana.',
  NOW() - INTERVAL '45 days'
),
(
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Beatriz Lima Ribeiro',
  'beatriz.ribeiro@outlook.com',
  '(11) 96543-2100',
  '1998-03-08',
  'Feminino',
  61.0,
  1.60,
  'Manutenção de peso e rotina saudável',
  'Sedentário',
  'Nenhum',
  'Multivitamínico',
  3,
  1.5,
  FALSE,
  '',
  'Não retornou para a consulta de acompanhamento agendada no mês passado.',
  NOW() - INTERVAL '90 days'
),
(
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Lucas Gabriel Rocha',
  'lucas.rocha@gmail.com',
  '(11) 95555-4433',
  '1990-09-12',
  'Masculino',
  92.0,
  1.82,
  'Ganho de massa muscular com dieta normocalórica',
  'Intenso',
  'Nenhum',
  'Whey, Creatina, Beta-Alanina',
  6,
  4.0,
  TRUE,
  'Crossfit 5x na semana',
  'Última consulta realizada há 42 dias. Sem retorno agendado.',
  NOW() - INTERVAL '100 days'
) ON CONFLICT DO NOTHING;

-- 3. Inserir Consultas
INSERT INTO consultas (id, paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno, created_at)
VALUES
(
  gen_random_uuid(),
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  CURRENT_DATE - INTERVAL '1 day',
  67.2,
  72.0,
  96.0,
  21.5,
  'Perdeu 1.3kg de gordura. Excelente evolução!',
  CURRENT_DATE + INTERVAL '25 days',
  NOW()
),
(
  gen_random_uuid(),
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  CURRENT_DATE - INTERVAL '3 days',
  82.5,
  89.0,
  102.0,
  24.0,
  'Melhora nos exames laboratoriais. Manter o plano alimentar.',
  CURRENT_DATE + INTERVAL '30 days',
  NOW()
),
(
  gen_random_uuid(),
  'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  CURRENT_DATE - INTERVAL '35 days',
  61.0,
  70.0,
  94.0,
  23.0,
  'Consulta inicial de avaliação.',
  NULL,
  NOW() - INTERVAL '35 days'
),
(
  gen_random_uuid(),
  'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
  CURRENT_DATE - INTERVAL '42 days',
  92.0,
  86.0,
  104.0,
  16.5,
  'Avaliação física inicial.',
  NULL,
  NOW() - INTERVAL '42 days'
) ON CONFLICT DO NOTHING;

-- 4. Inserir Plano Alimentar de Exemplo
INSERT INTO planos_alimentares (id, paciente_id, conteudo, created_at)
VALUES
(
  gen_random_uuid(),
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '{"refeicoes": [{"nome": "Café da Manhã", "horario": "07:00", "itens": ["2 ovos mexidos", "1 fatia de pão integral", "100ml de café sem açúcar"]}]}'::jsonb,
  NOW()
) ON CONFLICT DO NOTHING;
