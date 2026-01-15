import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useMyCollection } from '../hooks/useCards';
import { useDeck } from '../hooks/useCards'; // Import the deck hook
import { CardGrid } from '../components/cards/CardGrid';
import { Card as CardType } from '../types/api';
import api from '../lib/api';

type DeckSection = 'starters' | 'bench' | 'strategy';

export const DeckBuilderScreen = () => {
  const { collection, isLoading: collectionLoading, refetch } = useMyCollection();
  const { deck: savedDeck, isLoading: deckLoading } = useDeck(); // Fetch existing deck
  
  const [activeSection, setActiveSection] = useState<DeckSection>('starters');
  const [starters, setStarters] = useState<(CardType | null)[]>([null, null, null, null, null]);
  const [bench, setBench] = useState<CardType[]>([]);
  const [strategy, setStrategy] = useState<CardType[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

  // Load existing deck when it's fetched
  useEffect(() => {
    if (savedDeck) {
      // Load starters (preserve position order)
      const loadedStarters: (CardType | null)[] = [null, null, null, null, null];
      savedDeck.starters.forEach((card: any) => {
        const posIndex = POSITIONS.indexOf(card.lineup_position || card.CardDetails?.position);
        if (posIndex >= 0 && posIndex < 5) {
          // Map UserCard to Card type
          loadedStarters[posIndex] = {
            id: card.card_id,
            player_name: card.CardDetails?.player_name || '',
            position: card.CardDetails?.position || 'PG',
            ...card.CardDetails, // Spread all card details
          } as CardType;
        }
      });
      setStarters(loadedStarters);

      // Load bench
      const loadedBench = savedDeck.bench.map((card: any) => ({
        id: card.card_id,
        player_name: card.CardDetails?.player_name || '',
        position: card.CardDetails?.position || 'PG',
        ...card.CardDetails,
      } as CardType));
      setBench(loadedBench);

      // Load strategy
      const loadedStrategy = savedDeck.strategy.map((card: any) => ({
        id: card.card_id,
        name: card.CardDetails?.name || card.CardDetails?.player_name || '',
        ...card.CardDetails,
      } as CardType));
      setStrategy(loadedStrategy);
    }
  }, [savedDeck]);

  // Filter cards by type
  const playerCards = useMemo(() => 
    collection.filter(c => c.type === 'PLAYER' || !c.type),
    [collection]
  );

  const spellTrapCards = useMemo(() => 
    collection.filter(c => c.type === 'SPELL' || c.type === 'TRAP'),
    [collection]
  );

  // Get all selected card IDs
  const selectedIds = useMemo(() => {
    const starterIds = starters.filter(Boolean).map(c => c!.id);
    const benchIds = bench.map(c => c.id);
    const strategyIds = strategy.map(c => c.id);
    return [...starterIds, ...benchIds, ...strategyIds];
  }, [starters, bench, strategy]);

  // Total deck count
  const totalCards = useMemo(() => {
    const starterCount = starters.filter(Boolean).length;
    return starterCount + bench.length + strategy.length;
  }, [starters, bench, strategy]);

  // Handle card selection
  const handleToggleCard = (card: CardType) => {
    const isSelected = selectedIds.includes(card.id);

    if (isSelected) {
      setStarters(starters.map(c => c?.id === card.id ? null : c));
      setBench(bench.filter(c => c.id !== card.id));
      setStrategy(strategy.filter(c => c.id !== card.id));
      return;
    }

    if (activeSection === 'starters') {
      const cardPosition = card.position;
    const positionIndex = POSITIONS.indexOf(cardPosition);
    
    if (positionIndex === -1) {
      Alert.alert('Invalid Position', `This card's position (${cardPosition}) is not valid for starting lineup.`);
      return;
    }
    if (starters[positionIndex] !== null) {
      Alert.alert(
        'Position Occupied',
        `${POSITIONS[positionIndex]} position is already filled by ${starters[positionIndex]?.player_name}. Remove that card first.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            onPress: () => {
              const newStarters = [...starters];
              newStarters[positionIndex] = card;
              setStarters(newStarters);
            },
          },
        ]
      );
      return;
    }

      const newStarters = [...starters];
      newStarters[positionIndex] = card;
      setStarters(newStarters);
    } else if (activeSection === 'bench') {
      if (bench.length >= 3) {
        Alert.alert('Bench Full', 'You can only have 3 bench players.');
        return;
      }
      setBench([...bench, card]);
    } else if (activeSection === 'strategy') {
      if (strategy.length >= 12) {
        Alert.alert('Strategy Full', 'You can only have 12 strategy cards.');
        return;
      }
      setStrategy([...strategy, card]);
    }
  };

  const handleSaveDeck = async () => {
    const starterCount = starters.filter(Boolean).length;
    
    if (starterCount !== 5) {
      Alert.alert('Invalid Deck', 'You must select exactly 5 starters.');
      return;
    }
    
    if (strategy.length < 7) {
      Alert.alert('Invalid Deck', 'You need at least 7 strategy cards.');
      return;
    }

    if (totalCards < 15 || totalCards > 20) {
      Alert.alert('Invalid Deck', 'Total deck must be 15-20 cards.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        sport: "basketball",
        cards: [
          ...starters.filter(Boolean).map((card, index) => ({
            card_id: card!.id,
            deck_position: index + 1,
            card_role: 'STARTER',
            lineup_position: POSITIONS[index],
          })),
          ...bench.map((card, index) => ({
            card_id: card.id,
            deck_position: 5 + index + 1,
            card_role: 'BENCH',
            lineup_position: '',
          })),
          ...strategy.map((card, index) => ({
            card_id: card.id,
            deck_position: 5 + bench.length + index + 1,
            card_role: 'STRATEGY',
            lineup_position: '',
          })),
        ],
      };

      await api.put('/users/me/deck', payload);
      Alert.alert('Success', 'Deck saved successfully!');
      refetch();
    } catch (err: any) {
      console.error("Save deck error:", err.response?.data);
      const errorMessage = err.response?.data?.error || 'Failed to save deck';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = collectionLoading || deckLoading;

  return (
    <View className="flex-1 bg-background">
      {/* Header with Section Tabs */}
      <View className="p-4 bg-card">
        <Text className="text-white text-2xl font-bold mb-4">Build Your Deck</Text>
        
        <View className="flex-row gap-2 mb-2">
          <TouchableOpacity
            onPress={() => setActiveSection('starters')}
            className={`flex-1 py-3 rounded-lg ${activeSection === 'starters' ? 'bg-primary' : 'bg-slate-800'}`}
          >
            <Text className={`text-center font-bold ${activeSection === 'starters' ? 'text-white' : 'text-slate-400'}`}>
              Starters ({starters.filter(Boolean).length}/5)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveSection('bench')}
            className={`flex-1 py-3 rounded-lg ${activeSection === 'bench' ? 'bg-primary' : 'bg-slate-800'}`}
          >
            <Text className={`text-center font-bold ${activeSection === 'bench' ? 'text-white' : 'text-slate-400'}`}>
              Bench ({bench.length}/3)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveSection('strategy')}
            className={`flex-1 py-3 rounded-lg ${activeSection === 'strategy' ? 'bg-primary' : 'bg-slate-800'}`}
          >
            <Text className={`text-center font-bold ${activeSection === 'strategy' ? 'text-white' : 'text-slate-400'}`}>
              Strategy ({strategy.length}/12)
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-slate-400 text-sm text-center">
          Total: {totalCards}/20 cards
        </Text>
        {activeSection === 'starters' && (
          <View className="mt-3 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <Text className="text-blue-400 text-xs text-center">
              💡 Each card fills its designated position (PG/SG/SF/PF/C). No duplicates allowed.
            </Text>
          </View>
        )}

        {activeSection === 'bench' && (
          <View className="mt-3 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/30">
            <Text className="text-green-400 text-xs text-center">
              💡 Bench players can be any position. Use them for substitutions (future feature).
            </Text>
          </View>
        )}

        {activeSection === 'strategy' && (
          <View className="mt-3 px-3 py-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
            <Text className="text-purple-400 text-xs text-center">
              💡 Strategy cards are spells and traps. You need 7-12 to build a complete deck.
            </Text>
          </View>
        )}
      </View>

      {/* Collection Grid */}
      <View className="flex-1">
        <CardGrid
          cards={activeSection === 'strategy' ? spellTrapCards : playerCards}
          onCardPress={handleToggleCard}
          selectedIds={selectedIds}
          loading={isLoading}
          onRefresh={refetch}
          emptyMessage={
            activeSection === 'strategy' 
              ? "No spell/trap cards yet. (Coming soon!)" 
              : "No player cards found."
          }
        />
      </View>

      {/* Deck Preview Tray */}
      <View className="bg-card p-4 border-t border-primary/30">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white font-bold">
            Deck Preview ({totalCards}/20)
          </Text>
          <TouchableOpacity
            onPress={handleSaveDeck}
            disabled={isSaving || totalCards < 15 || totalCards > 20}
            className={`px-6 py-3 rounded-full ${
              totalCards >= 15 && totalCards <= 20 ? 'bg-primary' : 'bg-slate-700'
            }`}
          >
            <Text className="text-white font-bold">
              {isSaving ? 'Saving...' : 'Save Deck'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Starter Slots */}
        {activeSection === 'starters' && (
          <View className="flex-row justify-between mb-2">
            {starters.map((card, index) => (
              <View key={index} className="w-[18%] aspect-[2/3]">
                <Text className={`text-[10px] text-center mb-1 font-bold ${
          card ? 'text-primary' : 'text-slate-500'
        }`}>
                  {POSITIONS[index]}
                </Text>
                <TouchableOpacity
                  onPress={() => card && handleToggleCard(card)}
                  className={`w-full h-full rounded-lg border-2 items-center justify-center ${
                    card ? 'border-primary bg-primary/20' : 'border-dashed border-slate-700 bg-slate-800/50'
                  }`}
                >
                  {card ? (
                    <Text className="text-white text-[10px] text-center font-bold" numberOfLines={2}>
                      {card.player_name.split(' ').pop()}
                    </Text>
                  ) : (
                    <Text className="text-slate-700 text-lg">+</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Bench Preview */}
        {activeSection === 'bench' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {bench.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  onPress={() => handleToggleCard(card)}
                  className="w-16 h-20 bg-primary/20 border border-primary rounded-lg items-center justify-center"
                >
                  <Text className="text-white text-[9px] text-center font-bold" numberOfLines={2}>
                    {card.player_name.split(' ').pop()}
                  </Text>
                </TouchableOpacity>
              ))}
              {bench.length < 3 && (
                <View className="w-16 h-20 bg-slate-800/50 border border-dashed border-slate-700 rounded-lg items-center justify-center">
                  <Text className="text-slate-700 text-sm">+</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Strategy Preview */}
        {activeSection === 'strategy' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {strategy.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  onPress={() => handleToggleCard(card)}
                  className="w-16 h-20 bg-purple-600/20 border border-purple-500 rounded-lg items-center justify-center"
                >
                  <Text className="text-white text-[9px] text-center font-bold" numberOfLines={2}>
                    {card.name || card.player_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

// import React, { useState, useMemo } from 'react';
// import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
// import { useMyCollection } from '../hooks/useCards';
// import { CardGrid } from '../components/cards/CardGrid';
// import { Card as CardType } from '../types/api';
// import api from '../lib/api';

// type DeckSection = 'starters' | 'bench' | 'strategy';

// interface DeckCard {
//   card: CardType;
//   section: DeckSection;
//   position?: string; // For starters: PG, SG, SF, PF, C
// }

// export const DeckBuilderScreen = () => {
//   const { collection, isLoading, refetch } = useMyCollection();
//   const [activeSection, setActiveSection] = useState<DeckSection>('starters');
  
//   // Separate state for each deck section
//   const [starters, setStarters] = useState<(CardType | null)[]>([null, null, null, null, null]);
//   const [bench, setBench] = useState<CardType[]>([]);
//   const [strategy, setStrategy] = useState<CardType[]>([]);
//   const [isSaving, setIsSaving] = useState(false);

//   const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

//   // Filter cards by type (for now, all cards are player cards until we add spells/traps)
//   const playerCards = useMemo(() => 
//     collection.filter(c => c.type === 'PLAYER' || !c.type), // Fallback for cards without type
//     [collection]
//   );

//   const spellTrapCards = useMemo(() => 
//     collection.filter(c => c.type === 'SPELL' || c.type === 'TRAP'),
//     [collection]
//   );

//   // Get all selected card IDs
//   const selectedIds = useMemo(() => {
//     const starterIds = starters.filter(Boolean).map(c => c!.id);
//     const benchIds = bench.map(c => c.id);
//     const strategyIds = strategy.map(c => c.id);
//     return [...starterIds, ...benchIds, ...strategyIds];
//   }, [starters, bench, strategy]);

//   // Total deck count
//   const totalCards = useMemo(() => {
//     const starterCount = starters.filter(Boolean).length;
//     return starterCount + bench.length + strategy.length;
//   }, [starters, bench, strategy]);

//   // Handle card selection based on active section
//   const handleToggleCard = (card: CardType) => {
//     const isSelected = selectedIds.includes(card.id);

//     if (isSelected) {
//       // Remove card from wherever it is
//       setStarters(starters.map(c => c?.id === card.id ? null : c));
//       setBench(bench.filter(c => c.id !== card.id));
//       setStrategy(strategy.filter(c => c.id !== card.id));
//       return;
//     }

//     // Add card to active section
//     if (activeSection === 'starters') {
//       const emptyIndex = starters.findIndex(c => c === null);
//       if (emptyIndex === -1) {
//         Alert.alert('Starters Full', 'Remove a starter before adding a new one.');
//         return;
//       }
//       const newStarters = [...starters];
//       newStarters[emptyIndex] = card;
//       setStarters(newStarters);
//     } else if (activeSection === 'bench') {
//       if (bench.length >= 3) {
//         Alert.alert('Bench Full', 'You can only have 3 bench players.');
//         return;
//       }
//       setBench([...bench, card]);
//     } else if (activeSection === 'strategy') {
//       if (strategy.length >= 12) {
//         Alert.alert('Strategy Full', 'You can only have 12 strategy cards.');
//         return;
//       }
//       setStrategy([...strategy, card]);
//     }
//   };

//   const handleSaveDeck = async () => {
//     const starterCount = starters.filter(Boolean).length;
    
//     // Validation
//     if (starterCount !== 5) {
//       Alert.alert('Invalid Deck', 'You must select exactly 5 starters.');
//       return;
//     }
    
//     if (strategy.length < 7) {
//       Alert.alert('Invalid Deck', 'You need at least 7 strategy cards.');
//       return;
//     }

//     if (totalCards < 15 || totalCards > 20) {
//       Alert.alert('Invalid Deck', 'Total deck must be 15-20 cards.');
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const payload = {
//         sport: "basketball",
//         cards: [
//           // Starters
//           ...starters.filter(Boolean).map((card, index) => ({
//             card_id: card!.id,
//             deck_position: index + 1,
//             card_role: 'STARTER',
//             lineup_position: POSITIONS[index],
//           })),
//           // Bench
//           ...bench.map((card, index) => ({
//             card_id: card.id,
//             deck_position: 5 + index + 1,
//             card_role: 'BENCH',
//             lineup_position: '',
//           })),
//           // Strategy
//           ...strategy.map((card, index) => ({
//             card_id: card.id,
//             deck_position: 5 + bench.length + index + 1,
//             card_role: 'STRATEGY',
//             lineup_position: '',
//           })),
//         ],
//       };

//       await api.put('/users/me/deck', payload);
//       Alert.alert('Success', 'Deck saved successfully!');
//       refetch();
//     } catch (err: any) {
//       console.error("Save deck error:", err.response?.data);
//       const errorMessage = err.response?.data?.error || 'Failed to save deck';
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <View className="flex-1 bg-background">
//       {/* Header with Section Tabs */}
//       <View className="p-4 bg-card">
//         <Text className="text-white text-2xl font-bold mb-4">Build Your Deck</Text>
        
//         {/* Section Tabs */}
//         <View className="flex-row gap-2 mb-2">
//           <TouchableOpacity
//             onPress={() => setActiveSection('starters')}
//             className={`flex-1 py-3 rounded-lg ${activeSection === 'starters' ? 'bg-primary' : 'bg-slate-800'}`}
//           >
//             <Text className={`text-center font-bold ${activeSection === 'starters' ? 'text-white' : 'text-slate-400'}`}>
//               Starters ({starters.filter(Boolean).length}/5)
//             </Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity
//             onPress={() => setActiveSection('bench')}
//             className={`flex-1 py-3 rounded-lg ${activeSection === 'bench' ? 'bg-primary' : 'bg-slate-800'}`}
//           >
//             <Text className={`text-center font-bold ${activeSection === 'bench' ? 'text-white' : 'text-slate-400'}`}>
//               Bench ({bench.length}/3)
//             </Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity
//             onPress={() => setActiveSection('strategy')}
//             className={`flex-1 py-3 rounded-lg ${activeSection === 'strategy' ? 'bg-primary' : 'bg-slate-800'}`}
//           >
//             <Text className={`text-center font-bold ${activeSection === 'strategy' ? 'text-white' : 'text-slate-400'}`}>
//               Strategy ({strategy.length}/12)
//             </Text>
//           </TouchableOpacity>
//         </View>

//         <Text className="text-slate-400 text-sm text-center">
//           Total: {totalCards}/20 cards
//         </Text>
//       </View>

//       {/* Collection Grid */}
//       <View className="flex-1">
//         <CardGrid
//           cards={activeSection === 'strategy' ? spellTrapCards : playerCards}
//           onCardPress={handleToggleCard}
//           selectedIds={selectedIds}
//           loading={isLoading}
//           onRefresh={refetch}
//           emptyMessage={
//             activeSection === 'strategy' 
//               ? "No spell/trap cards yet. (Coming soon!)" 
//               : "No player cards found."
//           }
//         />
//       </View>

//       {/* Deck Preview Tray */}
//       <View className="bg-card p-4 border-t border-primary/30">
//         <View className="flex-row justify-between items-center mb-4">
//           <Text className="text-white font-bold">
//             Deck Preview ({totalCards}/20)
//           </Text>
//           <TouchableOpacity
//             onPress={handleSaveDeck}
//             disabled={isSaving || totalCards < 15 || totalCards > 20}
//             className={`px-6 py-3 rounded-full ${
//               totalCards >= 15 && totalCards <= 20 ? 'bg-primary' : 'bg-slate-700'
//             }`}
//           >
//             <Text className="text-white font-bold">
//               {isSaving ? 'Saving...' : 'Save Deck'}
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {/* Starter Slots */}
//         {activeSection === 'starters' && (
//           <View className="flex-row justify-between mb-2">
//             {starters.map((card, index) => (
//               <View key={index} className="w-[18%] aspect-[2/3]">
//                 <Text className="text-slate-500 text-[10px] text-center mb-1 font-bold">
//                   {POSITIONS[index]}
//                 </Text>
//                 <TouchableOpacity
//                   onPress={() => card && handleToggleCard(card)}
//                   className={`w-full h-full rounded-lg border-2 items-center justify-center ${
//                     card ? 'border-primary bg-primary/20' : 'border-dashed border-slate-700 bg-slate-800/50'
//                   }`}
//                 >
//                   {card ? (
//                     <Text className="text-white text-[10px] text-center font-bold" numberOfLines={2}>
//                       {card.player_name.split(' ').pop()}
//                     </Text>
//                   ) : (
//                     <Text className="text-slate-700 text-lg">+</Text>
//                   )}
//                 </TouchableOpacity>
//               </View>
//             ))}
//           </View>
//         )}

//         {/* Bench Preview */}
//         {activeSection === 'bench' && (
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             <View className="flex-row gap-2">
//               {bench.map((card) => (
//                 <TouchableOpacity
//                   key={card.id}
//                   onPress={() => handleToggleCard(card)}
//                   className="w-16 h-20 bg-primary/20 border border-primary rounded-lg items-center justify-center"
//                 >
//                   <Text className="text-white text-[9px] text-center font-bold" numberOfLines={2}>
//                     {card.player_name.split(' ').pop()}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//               {bench.length < 3 && (
//                 <View className="w-16 h-20 bg-slate-800/50 border border-dashed border-slate-700 rounded-lg items-center justify-center">
//                   <Text className="text-slate-700 text-sm">+</Text>
//                 </View>
//               )}
//             </View>
//           </ScrollView>
//         )}

//         {/* Strategy Preview */}
//         {activeSection === 'strategy' && (
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             <View className="flex-row gap-2">
//               {strategy.map((card) => (
//                 <TouchableOpacity
//                   key={card.id}
//                   onPress={() => handleToggleCard(card)}
//                   className="w-16 h-20 bg-purple-600/20 border border-purple-500 rounded-lg items-center justify-center"
//                 >
//                   <Text className="text-white text-[9px] text-center font-bold" numberOfLines={2}>
//                     {card.player_name || card.name}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </ScrollView>
//         )}
//       </View>
//     </View>
//   );
// };

// import React, { useState, useMemo } from 'react';
// import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
// import { useMyCollection } from '../hooks/useCards';
// import { CardGrid } from '../components/cards/CardGrid';
// import { Card as CardType } from '../types/api';
// import api from '../lib/api';

// export const DeckBuilderScreen = () => {
//     const { collection, isLoading, refetch } = useMyCollection();
//     const [pendingDeck, setPendingDeck] = useState<CardType[]>([]);
//     const [isSaving, setIsSaving] = useState(false);

//     // Filter out cards already in the pending deck from the grid if you want, 
//     // or just dim them. For now, let's just allow tapping.

//     const handleToggleCard = (card: CardType) => {
//         const isAlreadyInDeck = pendingDeck.find((c) => c.id === card.id);

//         if (isAlreadyInDeck) {
//             setPendingDeck(pendingDeck.filter((c) => c.id !== card.id));
//         } else {
//             if (pendingDeck.length >= 5) {
//                 Alert.alert('Deck Full', 'Remove a card before adding a new one.');
//                 return;
//             }
//             setPendingDeck([...pendingDeck, card]);
//         }
//     };

//     const handleSaveDeck = async () => {
//         if (pendingDeck.length !== 5) {
//             Alert.alert('Invalid Deck', 'You must select exactly 5 cards.');
//             return;
//         }

//         setIsSaving(true);
//         try {
//             const payload = {
//                 sport: "basketball", // Matches: Sport string `json:"sport"`
//                 cards: pendingDeck.map((card, index) => ({
//                     // Each object here matches: type DeckCard struct
//                     card_id: card.id,               // Matches `json:"card_id"`
//                     deck_position: index + 1,       // Matches `json:"deck_position"`
//                 })),
//             };

//             await api.put('/users/me/deck', payload);
//             Alert.alert('Success', 'Deck saved successfully!');
//             refetch(); // Refresh collection data to update 'is_in_deck' flags
//         } catch (err: any) {
//             console.error("DEBUG BACKEND REJECTION:", err.response?.data);
//             const errorMessage = err.response?.data?.error || 'Failed to save deck';
//             Alert.alert('Error', errorMessage);
//         } finally {
//             setIsSaving(false);
//         }
//     };
//     const selectedIds = useMemo(() => pendingDeck.map(c => c.id), [pendingDeck]);
//     const POSITIONS = ['', 'PG', 'SG', 'SF', 'PF', 'C'];
//     return (
//         <View className="flex-1 bg-background">
//             {/* 1. Collection Area */}
//             <View className="flex-1">
//                 <View className="p-4 border-b border-slate-800">
//                     <Text className="text-white text-xl font-bold">Select 5 Cards</Text>
//                 </View>
//                 <CardGrid
//                     cards={collection}
//                     onCardPress={handleToggleCard}
//                     selectedIds={selectedIds}
//                     loading={isLoading}
//                     onRefresh={refetch}
//                     emptyMessage="No cards found."
//                 />
//             </View>

//             {/* 2. Fixed Deck Tray */}
//             <View className="bg-card p-4 border-t border-primary/30 shadow-2xl">
//                 <View className="flex-row justify-between items-center mb-4">
//                     <Text className="text-white font-bold">Your Deck ({pendingDeck.length}/5)</Text>
//                     <TouchableOpacity
//                         onPress={handleSaveDeck}
//                         disabled={isSaving || pendingDeck.length !== 5}
//                         className={`px-6 py-2 rounded-full ${pendingDeck.length === 5 ? 'bg-primary' : 'bg-slate-700'}`}
//                     >
//                         <Text className="text-white font-bold">{isSaving ? 'Saving...' : 'Save Deck'}</Text>
//                     </TouchableOpacity>
//                 </View>

//                 {/* Deck Slots */}
//                 <View className="flex-row justify-between">
//                     {[1, 2, 3, 4, 5].map((posIndex) => {
//                         const card = pendingDeck[posIndex - 1];
//                         return (
//                             <View key={posIndex} className="w-[18%] aspect-[2/3] relative">
//                                 <Text className="text-slate-500 text-[10px] text-center mb-1 font-bold">
//                                     {POSITIONS[posIndex]}
//                                 </Text>
//                                 <TouchableOpacity
//                                     // key={index}
//                                     onPress={() => card && handleToggleCard(card)}
//                                     className={`w-full h-full rounded-lg border-2 border-dashed items-center justify-center overflow-hidden ${card ? 'border-primary bg-primary/20' : 'border-slate-700 bg-slate-800/50'
//                                         }`}
//                                 >
//                                     {card ? (
//                                         <Text className="text-white text-[10px] text-center font-bold" numberOfLines={2}
//                                             adjustsFontSizeToFit>
//                                             {card.player_name.split(' ').pop()}
//                                         </Text>
//                                     ) : (
//                                         <Text className="text-slate-700 text-lg">+</Text>
//                                     )}
//                                 </TouchableOpacity>
//                                 {card && (
//                                     <TouchableOpacity
//                                         onPress={() => handleToggleCard(card)}
//                                         className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center z-30"
//                                     >
//                                         <Text className="text-white text-[8px] font-bold">✕</Text>
//                                     </TouchableOpacity>
//                                 )}
//                             </View>
//                         );
//                     })}
//                 </View>
//             </View>
//         </View>
//     );
// };