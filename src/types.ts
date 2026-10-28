// Types for the Programa Cidadão Digital application

export interface Notification {
  id: string;
  name: string;
  city: string;
  action: string;
  timestamp: Date;
}

export interface Mission {
  id: number;
  label: string;
  points: number;
  completed: boolean;
  progress: number; // 0-100
  locked: boolean;
}

export interface Benefit {
  id: number;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  requiredLevel: number;
}

export interface CityOccupancy {
  name: string;
  state: string;
  percentage: number;
}

export type ModalStep = 1 | 2 | 3 | 4;

export interface FormData {
  nome: string;
  cpf: string;
  nascimento: string;
  phone: string;
  estado: string;
  lgpd: boolean;
}

export interface AppState {
  xp: number;
  level: number;
  citizenPoints: number;
  missions: Mission[];
  vagas: number;
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  date: string;
  updatedTime?: string;
  author: string;
  readTime: string;
  imageUrl: string;
  imageCaption: string;
  content: string[];
  featured?: boolean;
  highlightBadge?: string;
  views?: number;
  price?: number; // Preço/taxa da cobrança Pix configurada para este artigo (ex: 15.00, 19.90)
}

