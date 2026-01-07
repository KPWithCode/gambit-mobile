// API Response Types
export interface Card {
  id: string;
  player_id: number;
  player_name: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  team: string;
  edition: 'BASE' | 'PLAYOFF' | 'MOMENT' | 'ALLSTAR' | 'CHAMPIONSHIP';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
  offense: number;
  defense: number;
  speed: number;
  rebounding: number;
  three_point: number;
  abilities: Ability[];
  image_url: string;
  season_year: string;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  type: 'PASSIVE' | 'ACTIVE';
}

export interface User {
  id: string;
  username: string;
  display_name: string;
  gems: number;
  wins: number;
  losses: number;
  avatar_url?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface PackOpenResponse {
  cards: Card[];
  rarity_breakdown: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
    mythic: number;
  };
  remaining_gems: number;
}

export interface Battle {
  battle_id: string;
  player1: BattlePlayer;
  player2: BattlePlayer;
  player1_score: number;
  player2_score: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  current_turn: string;
  quarter: number;
}

export interface BattlePlayer {
  user_id: string;
  username: string;
  deck: Card[];
}

export interface CollectionCard {
  id: string;
  user_id: string;
  card_id: string;
  acquired_at: string;
  is_in_deck: boolean;
  deck_position?: number;
  // Full card details embedded
  player_id: number;
  player_name: string;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  team: string;
  edition: 'BASE' | 'PLAYOFF' | 'MOMENT' | 'ALLSTAR' | 'CHAMPIONSHIP';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
  offense: number;
  defense: number;
  speed: number;
  rebounding: number;
  three_point: number;
  abilities: Ability[];
  image_url: string;
  season_year: string;
}

