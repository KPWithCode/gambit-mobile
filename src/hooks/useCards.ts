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

export const scrapCard = async (userCardId: string) => {
  const response = await api.post(`/cards/${userCardId}/scrap`);
  return response.data;
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
            user_card_id: cc.id,
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
  // Use SWR for automatic caching and refetching
  const { data, error, isLoading, mutate } = useSWR(
    '/users/me/deck?sport=basketball',
    fetcher,
    {
      revalidateOnFocus: true, // Refetch when window gains focus
      revalidateOnReconnect: true, // Refetch on reconnect
      dedupingInterval: 2000, // Prevent duplicate requests within 2s
    }
  );

  // Transform the data
  const deck = useMemo(() => {
    if (!data) {
      return {
        starters: [],
        bench: [],
        strategy: [],
      };
    }

    console.log('📦 Raw deck response:', JSON.stringify(data, null, 2));

    const mapDeckCard = (item: any): Card => {
      if (item.CardDetails || item.cards) {
        const details = item.CardDetails || item.cards;
        return {
          id: item.card_id || details.id,
          player_id: details.player_id || 0,
          player_name: details.player_name || '',
          name: details.name || '',
          position: details.position || '',
          team: details.team || '',
          edition: details.edition || '',
          rarity: details.rarity || '',
          type: details.type || '',
          offense: details.offense || 0,
          defense: details.defense || 0,
          sport: details.sport || '',
          speed: details.speed || 0,
          rebounding: details.rebounding || 0,
          three_point: details.three_point || 0,
          abilities: details.abilities || [],
          image_url: details.image_url || '',
          season_year: details.season_year || '',
          trigger: details.trigger || '',
          effect_value: details.effect_value || 0,
          lineup_position: item.lineup_position || '',
          card_role: item.card_role || '',
        } as Card;
      }
      
      return {
        id: item.card_id || item.id,
        player_id: item.player_id || 0,
        player_name: item.player_name || '',
        name: item.name || '',
        position: item.position || '',
        team: item.team || '',
        edition: item.edition || '',
        rarity: item.rarity || '',
        type: item.type || '',
        offense: item.offense || 0,
        defense: item.defense || 0,
        sport: item.sport || '',
        speed: item.speed || 0,
        rebounding: item.rebounding || 0,
        three_point: item.three_point || 0,
        abilities: item.abilities || [],
        image_url: item.image_url || '',
        season_year: item.season_year || '',
        trigger: item.trigger || '',
        effect_value: item.effect_value || 0,
        lineup_position: item.lineup_position || '',
        card_role: item.card_role || '',
      } as Card;
    };

    const result = {
      starters: (data.starters || []).map(mapDeckCard),
      bench: (data.bench || []).map(mapDeckCard),
      strategy: (data.strategy || []).map(mapDeckCard),
    };

    console.log('✅ Deck loaded successfully:', {
      starters: result.starters.length,
      bench: result.bench.length,
      strategy: result.strategy.length,
    });

    return result;
  }, [data]);

  return { 
    deck, 
    isLoading, 
    error: error ? 'Failed to load deck' : null,
    refetch: mutate // SWR's mutate function
  };
};


// export const useDeck = () => {
//   const [deck, setDeck] = useState<{
//     starters: Card[];
//     bench: Card[];
//     strategy: Card[];
//   }>({
//     starters: [],
//     bench: [],
//     strategy: [],
//   });  // ✅ Start with empty deck, not null
  
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchDeck = async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const response = await api.get(`/users/me/deck?sport=basketball&t=${Date.now()}`);
//       const deckData = response.data;
      
//       console.log('📦 Raw deck response:', JSON.stringify(deckData, null, 2));

//       // ✅ Handle both formats (with/without CardDetails)
//       const mapDeckCard = (item: any): Card => {
//         // Check if CardDetails exists (nested format)
//         if (item.CardDetails || item.cards) {
//           const details = item.CardDetails || item.cards;
//           return {
//             id: item.card_id || details.id,
//             player_id: details.player_id || 0,
//             player_name: details.player_name || '',
//             name: details.name || '',
//             position: details.position || '',
//             team: details.team || '',
//             edition: details.edition || '',
//             rarity: details.rarity || '',
//             type: details.type || '',
//             offense: details.offense || 0,
//             defense: details.defense || 0,
//             sport: details.sport || '',
//             speed: details.speed || 0,
//             rebounding: details.rebounding || 0,
//             three_point: details.three_point || 0,
//             abilities: details.abilities || [],
//             image_url: details.image_url || '',
//             season_year: details.season_year || '',
//             trigger: details.trigger || '',
//             effect_value: details.effect_value || 0,
//             lineup_position: item.lineup_position || '',
//             card_role: item.card_role || '',
//           } as Card;
//         }
        
//         // Fallback: card data is at root level
//         return {
//           id: item.card_id || item.id,
//           player_id: item.player_id || 0,
//           player_name: item.player_name || '',
//           name: item.name || '',
//           position: item.position || '',
//           team: item.team || '',
//           edition: item.edition || '',
//           rarity: item.rarity || '',
//           type: item.type || '',
//           offense: item.offense || 0,
//           defense: item.defense || 0,
//           sport: item.sport || '',
//           speed: item.speed || 0,
//           rebounding: item.rebounding || 0,
//           three_point: item.three_point || 0,
//           abilities: item.abilities || [],
//           image_url: item.image_url || '',
//           season_year: item.season_year || '',
//           trigger: item.trigger || '',
//           effect_value: item.effect_value || 0,
//           lineup_position: item.lineup_position || '',
//           card_role: item.card_role || '',
//         } as Card;
//       };

//       // ✅ Set deck (empty arrays are valid)
//       setDeck({
//         starters: (deckData.starters || []).map(mapDeckCard),
//         bench: (deckData.bench || []).map(mapDeckCard),
//         strategy: (deckData.strategy || []).map(mapDeckCard),
//       });
      
//       console.log('✅ Deck loaded successfully:', {
//         starters: deckData.starters?.length || 0,
//         bench: deckData.bench?.length || 0,
//         strategy: deckData.strategy?.length || 0,
//       });
      
//     } catch (error: any) {
//       console.error('❌ Failed to fetch deck:', error);
//       console.error('Response data:', error.response?.data);
//       console.error('Response status:', error.response?.status);
      
//       // ✅ Only set error for actual server errors (not 404 or empty decks)
//       if (error.response?.status === 500 || error.response?.status === 503) {
//         setError('Failed to load deck. Please try again.');
//       } else if (error.response?.status === 401) {
//         setError('Authentication expired. Please sign in again.');
//       } else {
//         // ✅ For 404 or any other case, just set empty deck (no error)
//         console.log('No deck found or empty deck - this is fine');
//       }
      
//       // ✅ Always set empty deck on error
//       setDeck({
//         starters: [],
//         bench: [],
//         strategy: [],
//       });
      
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDeck();
//   }, []);

//   return { 
//     deck, 
//     isLoading, 
//     error,
//     refetch: fetchDeck 
//   };
// };
