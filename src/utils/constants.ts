// API Configuration
export const API_URL = __DEV__ 
  ? 'http://localhost:8080/api/v1'  // Development
  : 'https://gambit-api-ej5z.onrender.com/api/v1';  // Production

export const WS_URL = __DEV__
  ? 'ws://localhost:8080/ws'
  : 'wss://https://gambit-api-ej5z.onrender.com.com/ws';

// Pack prices
export const PACK_PRICES = {
  BRONZE: 100,
  SILVER: 250,
  GOLD: 500,
  PLATINUM: 1000,
  TEAM: 300,
  PLAYOFF: 400,
} as const;

// Rarity colors (matching Tailwind config)
export const RARITY_COLORS = {
  COMMON: '#9ca3af',
  RARE: '#3b82f6',
  EPIC: '#a855f7',
  LEGENDARY: '#f59e0b',
  MYTHIC: '#ef4444',
} as const;