import type { Article } from '../types'


export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-acordo-ampliacao',
    title: 'Acordo internacional garante ampliação do Bolsa Família: entenda quem tem direito e como solicitar o benefício',
    subtitle: 'Novo pacto governamental viabiliza aporte financeiro para incluir mais 3,2 milhões de famílias vulneráveis e elevar o valor médio do repasse.',
    category: 'Bolsa Família',
    date: '27 de outubro de 2026',
    updatedTime: 'Atualizado há 2 horas',
    author: 'Ministério do Desenvolvimento e Assistência Social (MDS)',
    readTime: '4 min de leitura',
    imageUrl: '/article-hero.jpg',
    imageCaption: 'Reunião interministerial e organismos internacionais para consolidação do plano social. Foto: Agência Brasil / Divulgação.',
    featured: true,
    highlightBadge: 'COMUNICADO OFICIAL',
    views: 48920,
    price: 15.00,
    content: [
      'O governo federal oficializou a ampliação do programa Bolsa Família após a pactuação de novos acordos bilaterais de cooperação técnica e financeira internacional. A iniciativa garantirá o ingresso prioritário de mais de 3,2 milhões de novas famílias que aguardavam a liberação de vagas no Cadastro Único (CadÚnico).',
      'Com os novos recursos assegurados, o valor médio mensal pode alcançar até R$ 800 por grupo familiar, considerando a parcela base acrescida dos benefícios complementares para gestantes, lactantes e crianças de 0 a 6 anos de idade.',
      'Para garantir agilidade e evitar deslocamentos desnecessários a postos de atendimento, o Ministério do Desenvolvimento e Assistência Social (MDS) estruturou a consulta prévia digital de elegibilidade. O procedimento é 100% online, gratuito e valida as informações cadastrais diretamente junto à base de dados nacional.',
      'Representantes do governo reforçaram que o cadastramento deste ciclo possui prazo limite determinado para fins de processamento da folha de pagamento. Famílias elegíveis que realizarem a validação dentro do período garantem a inclusão imediata no cronograma de repasses.',
      'O MDS adverte ainda que nenhum intermediário está autorizado a cobrar qualquer taxa para realização do cadastro ou liberação do benefício. O procedimento deve ser realizado exclusivamente pelos canais oficiais.',
    ],
  },
  {
    id: 'art-cadunico-atualizacao',
    title: 'Atualização obrigatória do Cadastro Único: veja quem precisa atualizar para não perder os pagamentos',
    subtitle: 'Famílias com cadastros desatualizados há mais de 24 meses devem confirmar dados de renda e endereço para manter o benefício ativo.',
    category: 'CadÚnico',
    date: '26 de outubro de 2026',
    updatedTime: 'Atualizado há 1 dia',
    author: 'Coordenação Nacional do Cadastro Único',
    readTime: '3 min de leitura',
    imageUrl: '/cadunico-card.jpg',
    imageCaption: 'Cartão e registro ativo no CadÚnico são os únicos pré-requisitos para recebimento do Bolsa Família. Foto: MDS / Divulgação.',
    featured: false,
    highlightBadge: 'ATUALIZAÇÃO OBRIGATÓRIA',
    views: 31405,
    price: 19.90,
    content: [
      'A Secretaria Nacional de Renda de Cidadania emitiu comunicado convocando os beneficiários que realizaram a última atualização do Cadastro Único antes de 2024 para regularização dos dados socioeconômicos.',
      'A revisão é exigência legal e busca certificar que os recursos públicos cheguem prioritariamente às famílias que realmente se enquadram nas faixas de pobreza e extrema pobreza estipuladas pela legislação.',
      'Caso a composição familiar tenha sofrido alterações — como nascimento, casamento, mudança de residência ou oscilação de renda per capita —, a atualização imediata previne o bloqueio preventivo do repasse mensal.',
      'O responsável familiar pode verificar a situação de seu cadastro e confirmar se há pendências por meio do formulário oficial de verificação disponibilizado neste portal.',
    ],
  },
  {
    id: 'art-atendimento-digital',
    title: 'Atendimento digital sem filas: como verificar sua situação cadastral em menos de 2 minutos',
    subtitle: 'Novo fluxo digital integrado reduz burocracia e evita que cidadãos precisem enfrentar filas em unidades do CRAS.',
    category: 'Guias & Cidadania',
    date: '25 de outubro de 2026',
    updatedTime: 'Atualizado há 2 dias',
    author: 'Secretaria de Governo Digital',
    readTime: '3 min de leitura',
    imageUrl: '/atendimento-social.jpg',
    imageCaption: 'Atendimento digital integrado elimina a necessidade de comparecimento presencial às unidades do CRAS. Foto: Ascom / MDS.',
    featured: false,
    highlightBadge: 'GUIA PRÁTICO',
    views: 22180,
    price: 14.90,
    content: [
      'Com a digitalização dos serviços da assistência social, o processo de consulta e solicitação de inclusão no Bolsa Família tornou-se totalmente remoto e acessível por celular ou computador.',
      'Basta informar dados básicos de identificação — nome completo, CPF, data de nascimento e estado de residência — para que o sistema execute a verificação parametrizada no banco de dados federal.',
      'A medida visa dar dignidade e comodidade às famílias brasileiras, evitando longas esperas sob o sol e despesas com transporte até as unidades municipais de assistência social.',
      'Os resultados preliminares da verificação são disponibilizados rapidamente, e os candidatos aprovados recebem a confirmação da data do primeiro depósito.',
    ],
  },
  {
    id: 'art-primeira-infancia',
    title: 'Benefício Primeira Infância: famílias com crianças de até 6 anos recebem adicional de R$ 150 por filho',
    subtitle: 'Regra visa fortalecer a nutrição e o desenvolvimento infantil; confira as condições de saúde e vacinação exigidas.',
    category: 'Bolsa Família',
    date: '24 de outubro de 2026',
    updatedTime: 'Atualizado há 3 dias',
    author: 'Ministério da Saúde e MDS',
    readTime: '4 min de leitura',
    imageUrl: '/family-hero.jpg',
    imageCaption: 'Apoio a mães e crianças na primeira infância é o principal eixo da política de combate à vulnerabilidade social. Foto: MDS / Divulgação.',
    featured: false,
    highlightBadge: 'BENEFÍCIO EXTRA',
    views: 18450,
    price: 18.00,
    content: [
      'O Benefício Primeira Infância (BPI) assegura um acréscimo direto de R$ 150 ao valor padrão do Bolsa Família para cada criança entre zero e seis anos de idade presente no núcleo familiar.',
      'Além disso, gestantes e nutrizes têm direito a um adicional complementar de R$ 50 para auxílio nos custos com alimentação balanceada e pré-natal.',
      'Para a manutenção destes adicionais, as famílias devem cumprir os compromissos básicos de acompanhamento de peso e estatura nos postos de saúde, bem como manter em dia o calendário nacional de vacinação infantil.',
      'Famílias que atendem aos requisitos mas ainda não recebem a cota extra podem solicitar a reavaliação cadastral através da consulta de elegibilidade neste portal.',
    ],
  },
]

const STORAGE_KEY = 'govbr_articles_list_v1'

export function loadArticles(): Article[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((a: Article) => ({
          ...a,
          price: typeof a.price === 'number' && a.price > 0 ? a.price : 15.00,
        }))
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar artigos do localStorage:', err)
  }
  return INITIAL_ARTICLES
}

export function saveArticles(articles: Article[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
  } catch (err) {
    console.error('Erro ao salvar artigos no localStorage:', err)
  }
}
