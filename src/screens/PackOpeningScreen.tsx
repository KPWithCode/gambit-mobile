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
        <Text className="text-slate-400">Tap each card or Reveal All</Text>
        {!revealAll && (
          <TouchableOpacity 
            onPress={() => setRevealAll(true)}
            className="bg-primary/20 border border-primary px-4 py-2 rounded-lg"
          >
            <Text className="text-primary font-bold">Reveal All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 10 }}>
        {cards.map((card, index) => (
          <CardFlip key={`${card.id}-${index}`} card={card} isParentFlipped={revealAll} />
        ))}
      </ScrollView>

      <View className="p-8">
        <TouchableOpacity 
          onPress={() => navigation.navigate('Collection')}
          className="bg-primary py-4 rounded-2xl shadow-lg"
        >
          <Text className="text-white text-center font-bold text-lg">
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};