// src/screens/PackOpeningScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CardFlip } from '../components/packs/CardFlip';
import { Card as CardType } from '../types/api';

export const PackOpeningScreen = ({ route, navigation }: any) => {
  // result comes from the successful api.post('/packs/open') call
  const { result } = route.params;
  const cards: CardType[] = result.cards || [];
  const [revealAll, setRevealAll] = useState(false);
  
  return (
    <View className="flex-1 bg-background">
      <View className="p-6 items-center">
        <Text className="text-white text-2xl font-black italic mb-2">
          PACK OPENED!
        </Text>
        <Text className="text-slate-400 pb-3">Tap each card or Reveal All</Text>
        {!revealAll && (
          <TouchableOpacity 
            onPress={() => setRevealAll(true)}
            className="bg-primary/20 border border-primary px-4 py-2 rounded-lg"
          >
            <Text className="text-primary font-bold">Reveal All</Text>
          </TouchableOpacity>
        )}
      </View>

     {/* Replace your ScrollView with this patterned layout */}
<View className="flex-1 justify-center px-4">
  {/* ROW 1: Top 2 Cards */}
  <View className="flex-row justify-center mb-2" style={{ gap: 10 }}>
    {cards.slice(0, 2).map((card, index) => (
      <View key={`${card.id}-top-${index}`} className="w-[33%] aspect-[0.7]">
        <CardFlip card={card} isParentFlipped={revealAll} />
      </View>
    ))}
  </View>

  {/* ROW 2: Center 1 Card */}
  <View className="flex-row justify-center mb-2">
    {cards.slice(2, 3).map((card, index) => (
      <View key={`${card.id}-mid-${index}`} className="w-[33%] aspect-[0.7]">
        <CardFlip card={card} isParentFlipped={revealAll} />
      </View>
    ))}
  </View>

  {/* ROW 3: Bottom 2 Cards */}
  <View className="flex-row justify-center" style={{ gap: 10 }}>
    {cards.slice(3, 5).map((card, index) => (
      <View key={`${card.id}-bot-${index}`} className="w-[33%] aspect-[0.7]">
        <CardFlip card={card} isParentFlipped={revealAll} />
      </View>
    ))}
  </View>
</View>
      <View className="p-8">
        <TouchableOpacity 
onPress={() => navigation.goBack()}          className="bg-primary py-4 rounded-2xl shadow-lg"
        >
          <Text className="text-white text-center font-bold text-lg">
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};