// Constants and static data

import type { Mission, Benefit, CityOccupancy } from './types';

export const INITIAL_VAGAS = 47;

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Iniciante',
  2: 'Verificado',
  3: 'Aprendiz Digital',
  4: 'Cidadao Elite',
};

export const XP_LEVELS: Record<number, number> = {
  1: 500,
  2: 1200,
  3: 2200,
  4: 4000,
};

export const INITIAL_MISSIONS: Mission[] = [
  { id: 0, label: 'Realizar Cadastro',    points: 150, completed: false, progress: 0, locked: false },
  { id: 1, label: 'Verificar Identidade', points: 200, completed: false, progress: 0, locked: true  },
  { id: 2, label: 'Iniciar Capacitacao',  points: 300, completed: false, progress: 0, locked: true  },
  { id: 3, label: 'Indicar uma Familia',  points: 500, completed: false, progress: 0, locked: true  },
];

export const INITIAL_BENEFITS: Benefit[] = [
  { id: 0, icon: 'currency',    title: 'Beneficio Ampliado',    description: 'Aumento do valor para cadastrados',        unlocked: true,  requiredLevel: 1 },
  { id: 1, icon: 'education',   title: '87 Cursos Certificados', description: 'Tecnologia, saude, administracao',         unlocked: false, requiredLevel: 2 },
  { id: 2, icon: 'briefcase',   title: 'Vagas Especiais',        description: 'Oportunidades com carteira assinada',      unlocked: false, requiredLevel: 3 },
  { id: 3, icon: 'badge',       title: 'Cidadao Elite',          description: 'Prioridade em todos os programas',         unlocked: false, requiredLevel: 4 },
];

export const CITY_OCCUPANCY: CityOccupancy[] = [
  { name: 'Sao Paulo',       state: 'SP', percentage: 94 },
  { name: 'Rio de Janeiro',  state: 'RJ', percentage: 89 },
  { name: 'Belo Horizonte',  state: 'MG', percentage: 91 },
  { name: 'Salvador',        state: 'BA', percentage: 86 },
  { name: 'Fortaleza',       state: 'CE', percentage: 78 },
  { name: 'Manaus',          state: 'AM', percentage: 61 },
];

export const NEWS_FEED: Array<{ tag: string; headline: string; time: string }> = [
  { tag: 'ECONOMIA',  headline: 'Acordo historico amplia investimento em programas sociais',      time: 'Ha 6 horas'  },
  { tag: 'EDUCACAO',  headline: 'MEC libera 2.400 novas vagas em cursos tecnicos gratuitos',     time: 'Ha 9 horas'  },
  { tag: 'EMPREGO',   headline: 'Taxa de emprego entre beneficiarios sobe 34% apos capacitacao', time: 'Ontem'       },
  { tag: 'SOCIAL',    headline: 'Programa de indicacao beneficia familias com bonus adicional',   time: 'Ontem'       },
];

export const LIVE_NAMES = [
  { name: 'Mariana',  city: 'Campinas, SP'       },
  { name: 'Joao',     city: 'Natal, RN'          },
  { name: 'Beatriz',  city: 'Porto Alegre, RS'   },
  { name: 'Lucas',    city: 'Brasilia, DF'        },
  { name: 'Isabela',  city: 'Belo Horizonte, MG' },
  { name: 'Rafael',   city: 'Manaus, AM'          },
  { name: 'Larissa',  city: 'Fortaleza, CE'       },
  { name: 'Gabriel',  city: 'Salvador, BA'        },
  { name: 'Camila',   city: 'Recife, PE'          },
  { name: 'Pedro',    city: 'Curitiba, PR'        },
  { name: 'Amanda',   city: 'Goiania, GO'         },
  { name: 'Thiago',   city: 'Sao Paulo, SP'       },
  { name: 'Renata',   city: 'Belem, PA'           },
  { name: 'Felipe',   city: 'Maceio, AL'          },
  { name: 'Juliana',  city: 'Natal, RN'           },
];

export const LIVE_ACTIONS = [
  'acabou de se inscrever no Bolsa Família',
  'concluiu o pré-cadastro do benefício',
  'enviou os dados para solicitação do benefício',
  'garantiu uma vaga na pré-inscrição do Bolsa Família',
  'completou a solicitação de entrada no programa',
  'concluiu a inscrição no ciclo vigente do benefício',
  'verificou a elegibilidade e solicitou o benefício',
  'teve a solicitação de inscrição registrada no sistema',
];


export const STATES = [
  'Acre', 'Alagoas', 'Amapa', 'Amazonas', 'Bahia', 'Ceara',
  'Distrito Federal', 'Espirito Santo', 'Goias', 'Maranhao',
  'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Para',
  'Paraiba', 'Parana', 'Pernambuco', 'Piaui', 'Rio de Janeiro',
  'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondonia', 'Roraima',
  'Santa Catarina', 'Sao Paulo', 'Sergipe', 'Tocantins',
];
