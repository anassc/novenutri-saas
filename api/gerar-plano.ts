import { GoogleGenerativeAI } from '@google/generative-ai';

function gerarPlanoAlimentarManualBackend(paciente: any) {
  const restricoes = Array.isArray(paciente.restricoes_alimentares) ? paciente.restricoes_alimentares : [];
  const alergias = Array.isArray(paciente.alergias) ? paciente.alergias : [];

  const isZeroLactose =
    restricoes.some((r: string) => r.toLowerCase().includes('lactose')) ||
    alergias.some((a: string) => a.toLowerCase().includes('leite'));
  const isSemGluten =
    restricoes.some((r: string) => r.toLowerCase().includes('glúten') || r.toLowerCase().includes('gluten')) ||
    alergias.some((a: string) => a.toLowerCase().includes('trigo'));

  const milkOption = isZeroLactose ? 'Bebida vegetal de aveia ou amêndoa (200ml)' : 'Leite desnatado ou semidesnatado (200ml)';
  const breadOption = isSemGluten ? 'Pão sem glúten tostado com azeite' : 'Pão integral tostado com queijo cottage';
  const tapiocaOption = 'Tapioca recheada com ovos mexidos e orégano';

  const dias = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

  const plano_semanal = dias.map((dia) => ({
    dia,
    refeicoes: {
      cafe_da_manha: [
        `${milkOption} com café sem açúcar`,
        `${breadOption}`,
        `${tapiocaOption}`,
        'Ovos mexidos (2 unidades) com pitada de açafrão',
        'Mamão papaia (1/2 unidade) com aveia em flocos',
      ],
      lanche_manha: [
        'Maçã verde com punhado de castanha-do-pará (2 un)',
        'Iogurte natural (zero lactose se necessário) com chia',
        'Banana prata polvilhada com canela em pó',
        'Mix de nozes e amêndoas (30g)',
        'Suco verde funcional (couve, limão, gengibre e maçã)',
      ],
      almoco: [
        'Arroz integral (4 col de sopa) e Feijão carioca (1 concha)',
        'Peito de frango grelhado (130g) temperado com ervas',
        'Salada de folhas verdes, tomate e cenoura ralada à vontade',
        'Legumes no vapor (brócolis, abobrinha e chuchu)',
        'Azeite de oliva extra virgem (1 col de sobremesa) para temperar',
      ],
      lanche_tarde: [
        'Vitamina de banana com morango e farelo de aveia',
        'Crepioca recheada com frango desfiado e ricota',
        'Panqueca de banana rápida (1 ovo + 1 banana + aveia)',
        'Cuscuz nordestino temperado com queijo branco (ou tofu)',
        'Castanha de caju (20g) + chá verde gelado',
      ],
      jantar: [
        'Filé de tilápia assado com limão e alecrim (140g)',
        'Purê de mandioca ou batata-doce (3 col de sopa)',
        'Salada colorida de alface roxa, pepino e palmito',
        'Sopa cremosa de legumes com carne magra desfiada',
        'Omelete de 2 ovos com espinafre e tomate picado',
      ],
    },
  }));

  return { plano_semanal };
}

export async function handleGerarPlano(
  body: any,
  customEnv?: Record<string, string>
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { paciente } = body || {};
  if (!paciente) {
    return {
      success: false,
      error: 'Dados do paciente são obrigatórios.',
    };
  }

  try {
    const rawApiKey =
      customEnv?.GOOGLE_API_KEY ||
      customEnv?.GEMINI_API_KEY ||
      customEnv?.VITE_GOOGLE_API_KEY ||
      customEnv?.VITE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GOOGLE_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      '';

    const apiKey = rawApiKey.trim();

    if (!apiKey || !apiKey.startsWith('AIza')) {
      console.warn('Google Gemini API Key invalid or missing. Using automated meal plan generator fallback.');
      return {
        success: true,
        data: gerarPlanoAlimentarManualBackend(paciente),
      };
    }

    // Format patient details into descriptive text
    const dadosPacienteFormatados = `
- Nome: ${paciente.nome || 'Não informado'}
- Idade / Sexo: ${paciente.data_nascimento ? paciente.data_nascimento : 'Não informada'} | ${paciente.sexo || 'Não informado'}
- Altura: ${paciente.altura ? paciente.altura + ' cm' : 'Não informada'}
- Peso Inicial: ${paciente.peso_inicial ? paciente.peso_inicial + ' kg' : 'Não informado'}
- Objetivos: ${Array.isArray(paciente.objetivos) ? paciente.objetivos.join(', ') : paciente.objetivo_texto || 'Melhorar alimentação'}
- Nível de Atividade Física: ${paciente.nivel_atividade || 'Não informado'}
- Refeições por Dia desejadas: ${paciente.refeicoes_por_dia || 5}
- Restrições Alimentares: ${Array.isArray(paciente.restricoes_alimentares) && paciente.restricoes_alimentares.length > 0 ? paciente.restricoes_alimentares.join(', ') : 'Nenhuma'}
- Alergias: ${Array.isArray(paciente.alergias) && paciente.alergias.length > 0 ? paciente.alergias.join(', ') : 'Nenhuma'}
- Patologias / Condições de Saúde: ${Array.isArray(paciente.patologias) && paciente.patologias.length > 0 ? paciente.patologias.join(', ') : 'Nenhuma'}
- Medicamentos / Suplementos: ${paciente.medicamentos || 'Nenhum'} / ${paciente.suplementos || 'Nenhum'}
- Observações adicionais: ${paciente.observacoes || 'Sem observações'}
`.trim();

    const promptText = `
Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosPacienteFormatados}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}
`.trim();

    const genAI = new GoogleGenerativeAI(apiKey);
    let responseText = '';

    // Model fallback list
    const candidateModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });
        const result = await model.generateContent(promptText);
        responseText = result.response.text();
        if (responseText) break;
      } catch (err: any) {
        console.warn(`Model ${modelName} failed, trying next...`);
      }
    }

    if (!responseText) {
      return {
        success: true,
        data: gerarPlanoAlimentarManualBackend(paciente),
      };
    }

    // Sanitize in case markdown ticks sneaked in
    const cleanedText = responseText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsedData = JSON.parse(cleanedText);

    if (!parsedData.plano_semanal || !Array.isArray(parsedData.plano_semanal)) {
      return {
        success: true,
        data: gerarPlanoAlimentarManualBackend(paciente),
      };
    }

    return {
      success: true,
      data: parsedData,
    };
  } catch (error: any) {
    console.warn('Gemini API call failed, using fallback plan generator:', error);
    return {
      success: true,
      data: gerarPlanoAlimentarManualBackend(paciente),
    };
  }
}

