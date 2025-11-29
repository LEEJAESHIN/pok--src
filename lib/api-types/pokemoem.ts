// Pokemoem API 배틀 통계 데이터 타입 정의

export interface PokemoemStatItem {
  id: string;
  val: string;
  previous?: number;
}

export interface PokemoemTeammate {
  id: number;
  form: number;
  previous: number;
}

export interface PokemoemBattleStats {
  id: string;
  form: string;
  moves: PokemoemStatItem[];
  abilities: PokemoemStatItem[];
  natures: PokemoemStatItem[];
  items: PokemoemStatItem[];
  terastal: PokemoemStatItem[];
  teammates: PokemoemTeammate[];
  "lost moves": PokemoemStatItem[];
  "lost pokemon": PokemoemTeammate[];
  "won moves": PokemoemStatItem[];
  "won pokemon": PokemoemTeammate[];
}

export interface CompetitiveRecommendations {
  abilities: Array<{ name: string; usage: number }>;
  natures: Array<{ name: string; usage: number }>;
  items: Array<{ name: string; usage: number }>;
  moves: Array<{ name: string; usage: number; type: string }>;
}
