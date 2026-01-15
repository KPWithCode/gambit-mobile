import useSWR from 'swr';
import api from '../lib/api';
import { Card, CollectionCard } from '../types/api';
import { useEffect, useMemo, useState } from 'react';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export const useCards = () => {
    const { data, error, isLoading, mutate } = useSWR<Card[]>('/cards', fetcher);

    return {
        cards: data || [],
        isLoading,
        isError: error,
        refetch: mutate,
    };
};

export const useMyCollection = () => {
    const { data, error, isLoading, mutate } = useSWR<CollectionCard[]>(        
        '/users/me/collection',
        fetcher
    );

    const collection: Card[] = useMemo(() => {
        // data is the array returned by your Go 'return collection, nil'
        if (!data || !Array.isArray(data)) return [];

        return data.map((cc) => ({
            id: cc.card_id,
            player_id: cc.player_id,
            player_name: cc.player_name,
            name: cc.name,
            position: cc.position,
            team: cc.team,
            edition: cc.edition,
            rarity: cc.rarity,
            type: cc.type,
            offense: cc.offense,
            defense: cc.defense,
            sport: cc.sport,
            speed: cc.speed,
            rebounding: cc.rebounding,
            three_point: cc.three_point,
            abilities: cc.abilities,
            image_url: cc.image_url,
            season_year: cc.season_year,
            trigger: cc.trigger, // ← ADDED
            effect_value: cc.effect_value, // ← ADDED
        }));
    }, [data]);

    return {
        collection,
        isLoading,
        isError: error,
        refetch: mutate,
    };
};

export const useDeck = () => {
    const [deck, setDeck] = useState<{
      starters: Card[];
      bench: Card[];
      strategy: Card[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null); // Track errors

    const fetchDeck = async () => {
      setIsLoading(true);
      setError(null)
      try {
        const response = await api.get('/users/me/deck?sport=basketball');
        setDeck(response.data);
      } catch (error: any) {
        console.error('Failed to fetch deck:', error);
        if (error.response?.status === 401) {
          setError('Authentication expired. Please sign in again.');
          // Optionally: You could trigger a sign-out here
          // import { useAuth } from './useAuth';
          // const { signOut } = useAuth();
          // signOut();
        } else if (error.response?.status === 404) {
          setError('No deck found. Build your deck first!');
        } else {
          setError('Failed to load deck. Please try again.');
        }
        
        // Set deck to empty structure so UI doesn't break
        setDeck({
          starters: [],
          bench: [],
          strategy: [],
        });
      } finally {
        setIsLoading(false);
      }
    };
  
    useEffect(() => {
      fetchDeck();
    }, []);
  
    return { deck, isLoading, error, refetch: fetchDeck };
  };