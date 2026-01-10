// src/hooks/useDeck.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { Card as CardType } from '../types/api';

interface DeckData {
  cards: CardType[];
  sport: string;
}

export const useDeck = (sport: string = 'basketball') => {
  const [deck, setDeck] = useState<DeckData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDeck = useCallback(async () => {
    try {
      setLoading(true);
      // Fetches the specific lineup for the logged-in user
      const response = await api.get(`/users/me/deck`, {
        params: { sport } 
      });      
      console.log("RAW DECK DATA FROM BACKEND:", response.data);
      setDeck({
        cards: response.data,
        sport: sport
      });
    } catch (error) {
      console.error('Failed to fetch deck:', error);
      setDeck(null); // Clear deck on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeck();
  }, [fetchDeck]);

  return { deck, loading, refreshDeck: fetchDeck };
};