import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useProfile } from '../hooks/useProfile';
import { useDeck } from '../hooks/useCards'; // Updated import
import { Card } from '../components/cards/Card';

export const BattleScreen = ({ navigation }: any) => {
  const { profile } = useProfile();
  const [selectedSport, setSelectedSport] = useState('basketball');
  const { deck, isLoading: deckLoading, refetch } = useDeck();

  // Calculate total deck size
  const totalCards = deck 
    ? (deck.starters?.length || 0) + (deck.bench?.length || 0) + (deck.strategy?.length || 0)
    : 0;

  const starterCount = deck?.starters?.length || 0;
  const isDeckValid = starterCount === 5 && totalCards >= 15 && totalCards <= 20;

  // Refetch deck when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refetch();
    });
    return unsubscribe;
  }, [navigation, refetch]);

  const handlePlayPress = () => {
    if (!isDeckValid) {
      if (starterCount !== 5) {
        Alert.alert(
          'Incomplete Deck',
          `You need exactly 5 starters. You have ${starterCount}. Go to Deck Builder to complete your lineup.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Build Deck', onPress: () => navigation.navigate('Deck') }
          ]
        );
      } else if (totalCards < 15) {
        Alert.alert(
          'Incomplete Deck',
          `You need at least 15 total cards. You have ${totalCards}. Add more bench or strategy cards.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Build Deck', onPress: () => navigation.navigate('Deck') }
          ]
        );
      } else {
        Alert.alert(
          'Deck Too Large',
          `Your deck has ${totalCards} cards. Maximum is 20. Remove some cards.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Edit Deck', onPress: () => navigation.navigate('Deck') }
          ]
        );
      }
      return;
    }

    // Deck is valid, start matchmaking
    navigation.navigate('Matchmaking', { sport: selectedSport });
  };

  return (
    <View className="flex-1 bg-background">
      {/* TOP BAR - Resources */}
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-slate-500 text-xs font-bold uppercase">Your Stats</Text>
          <Text className="text-white text-2xl font-black">{profile?.wins || 0}W - {profile?.losses || 0}L</Text>
        </View>
        <View className="flex-row gap-4">
          <View className="bg-slate-800 px-4 py-2 rounded-full flex-row items-center gap-2">
            <Text className="text-2xl">💎</Text>
            <Text className="text-white font-bold">{profile?.gems || 0}</Text>
          </View>
        </View>
      </View>

      {/* HERO SECTION - Play Button */}
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full aspect-square items-center justify-center">
          <View className="absolute w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

          <TouchableOpacity
            onPress={handlePlayPress}
            disabled={deckLoading}
            className={`w-48 h-48 rounded-full items-center justify-center shadow-2xl border-8 ${
              isDeckValid ? 'bg-primary border-white/10' : 'bg-slate-700 border-slate-600'
            }`}
            style={{ elevation: 20 }}
          >
            <Text className={`text-5xl font-black italic tracking-tighter ${
              isDeckValid ? 'text-white' : 'text-slate-500'
            }`}>
              {deckLoading ? '...' : 'PLAY'}
            </Text>
            <Text className={`text-xs font-bold uppercase tracking-widest ${
              isDeckValid ? 'text-white/30' : 'text-slate-600'
            }`}>
              {selectedSport}
            </Text>
          </TouchableOpacity>

          {/* Deck Status Indicator */}
          <View className="mt-6 bg-slate-800/80 px-6 py-3 rounded-full">
            <Text className={`text-center font-bold ${
              isDeckValid ? 'text-green-500' : 'text-yellow-500'
            }`}>
              {deckLoading ? 'Loading deck...' : isDeckValid 
                ? `✓ Deck Ready (${totalCards} cards)` 
                : `⚠ Deck Incomplete (${totalCards}/15 cards)`
              }
            </Text>
          </View>

          {/* Sport Switcher */}
          <View className="flex-row mt-8 bg-slate-800 rounded-full p-1">
            {['basketball', 'football'].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSelectedSport(s)}
                className={`px-4 py-2 rounded-full ${selectedSport === s ? 'bg-primary' : ''}`}
              >
                <Text className="text-white text-xs font-bold uppercase">{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* LINEUP TRAY - Current Deck */}
      <View className="bg-slate-900/80 pt-6 pb-12 border-t border-slate-800">
        <View className="px-6 flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px]">
              {selectedSport} Lineup
            </Text>
            <Text className="text-white text-2xl font-black italic">STARTING FIVE</Text>
            {deck && (
              <Text className="text-slate-500 text-xs mt-1">
                Bench: {deck.bench?.length || 0}/3 • Strategy: {deck.strategy?.length || 0}/12
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Deck')}
            className="bg-primary/20 px-4 py-2 rounded-full border border-primary/40"
          >
            <Text className="text-primary text-xs font-black uppercase">Edit Deck</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {deckLoading ? (
            <Text className="text-white opacity-50">Fetching lineup...</Text>
          ) : (
            <>
              {/* Show starters */}
              {deck?.starters?.map((userCard: any, index: number) => (
                <View key={`starter-${index}`} className="w-32 aspect-[0.7]">
                  <Card card={userCard.CardDetails} />
                  <View className="absolute top-2 left-2 bg-primary px-2 py-1 rounded">
                    <Text className="text-white text-[10px] font-bold">
                      {userCard.LineupPosition || userCard.CardDetails?.position}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 5 - starterCount) }).map((_, i) => (
                <TouchableOpacity
                  key={`empty-${i}`}
                  onPress={() => navigation.navigate('Deck')}
                  className="w-32 aspect-[0.7] rounded-2xl border-2 border-dashed border-slate-800 items-center justify-center bg-slate-950/50"
                >
                  <Text className="text-slate-800 text-3xl">+</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
// import { useAuth } from '../hooks/useAuth';
// import { useProfile } from '../hooks/useProfile';
// import { useDeck } from '../hooks/useDeck'; // Assuming you have a hook to fetch the active deck
// import { Card } from '../components/cards/Card';
// import { Card as CardType } from '../types/api';

// export const BattleScreen = ({ navigation }: any) => {
//     const { profile } = useProfile();
//     const [selectedSport, setSelectedSport] = useState('basketball');
//     const { deck, loading: deckLoading } = useDeck(selectedSport); // This should fetch the 5-card active lineup

//     return (
//         <View className="flex-1 bg-background">
//             {/* 1. TOP BAR - Resources (Keep as is) */}

//             {/* 2. HERO SECTION - Play Button */}
//             <View className="flex-1 items-center justify-center px-6">
//                 <View className="w-full aspect-square items-center justify-center">
//                     <View className="absolute w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

//                     <TouchableOpacity
//                         // 3. Pass the sport to Matchmaking so the POST body is correct
//                         onPress={() => navigation.navigate('Matchmaking', { sport: selectedSport })}
//                         className="bg-primary w-48 h-48 rounded-full items-center justify-center shadow-2xl border-8 border-white/10"
//                         style={{ elevation: 20 }}
//                     >
//                         <Text className="text-white text-5xl font-black italic tracking-tighter">PLAY</Text>
//                         <Text className="text-white/30 text-xs font-bold uppercase tracking-widest">{selectedSport}</Text>
//                     </TouchableOpacity>

//                     {/* OPTIONAL: Sport Switcher for testing */}
//                     <View className="flex-row mt-8 bg-slate-800 rounded-full p-1">
//                         {['basketball', 'football'].map((s) => (
//                             <TouchableOpacity
//                                 key={s}
//                                 onPress={() => setSelectedSport(s)}
//                                 className={`px-4 py-2 rounded-full ${selectedSport === s ? 'bg-primary' : ''}`}
//                             >
//                                 <Text className="text-white text-xs font-bold uppercase">{s}</Text>
//                             </TouchableOpacity>
//                         ))}
//                     </View>
//                 </View>
//             </View>

//             {/* 3. LINEUP TRAY - Current Deck */}
//             <View className="bg-slate-900/80 pt-6 pb-12 border-t border-slate-800">
//                 <View className="px-6 flex-row justify-between items-center mb-6">
//                     <View>
//                         <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px]">
//                             {selectedSport} Lineup
//                         </Text>
//                         <Text className="text-white text-2xl font-black italic">STARTING FIVE</Text>
//                     </View>
//                     <TouchableOpacity
//                         onPress={() => navigation.navigate('Deck', { sport: selectedSport })}
//                         className="bg-primary/20 px-4 py-2 rounded-full border border-primary/40"
//                     >
//                         <Text className="text-primary text-xs font-black uppercase">Edit Deck</Text>
//                     </TouchableOpacity>
//                 </View>

//                 <ScrollView
//                     horizontal
//                     showsHorizontalScrollIndicator={false}
//                     // Changed gap to 8 for tighter spacing and increased padding
//                     contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
//                 >
//                     {deckLoading ? (
//                         <Text className="text-white opacity-50">Fetching lineup...</Text>
//                     ) : (
//                         <>
//                             {deck?.cards?.map((item: any, index: number) => {
//                                 if (!item.cards) return null;
//                                 return (
//                                     <View
//                                         key={`${item.id}-${index}`}
//                                         // INCREASED SIZE: w-32 (128px) makes them significantly taller and wider
//                                         className="w-32 aspect-[0.7]"
//                                     >
//                                         <Card card={item.cards} />
//                                     </View>
//                                 );
//                             })}

//                             {/* Fill remaining empty slots with the same w-32 size */}
//                             {Array.from({ length: Math.max(0, 5 - (deck?.cards?.length || 0)) }).map((_, i) => (
//                                 <TouchableOpacity
//                                     key={`empty-${i}`}
//                                     onPress={() => navigation.navigate('Deck', { sport: selectedSport })}
//                                     className="w-32 aspect-[0.7] rounded-2xl border-2 border-dashed border-slate-800 items-center justify-center bg-slate-950/50"
//                                 >
//                                     <Text className="text-slate-800 text-3xl">+</Text>
//                                 </TouchableOpacity>
//                             ))}
//                         </>
//                     )}
//                 </ScrollView>
//             </View>
//         </View>
//     );
// };