import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CardGrid } from '../components/cards/CardGrid';
import { CardFilter } from '../components/cards/CardFilter';
import { useMyCollection } from '../hooks/useCards';
import { Card as CardType } from '../types/api';
import { useAuth } from '../hooks/useAuth'; 
import { CardDetailModal } from '@/components/cards/CardDetailModal';

type Rarity = 'ALL' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
type Position = 'ALL' | 'PG' | 'SG' | 'SF' | 'PF' | 'C';

export const CollectionScreen = () => {
  const { collection, isLoading, refetch } = useMyCollection();
  const [showFilter, setShowFilter] = useState(false);
  const { signOut } = useAuth(); 
  const [selectedRarity, setSelectedRarity] = useState<Rarity>('ALL');
  const [selectedPosition, setSelectedPosition] = useState<Position>('ALL');
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const safeCollection = Array.isArray(collection) ? collection : [];

  const filteredCards = useMemo(() => {
    if (!Array.isArray(safeCollection)) return [];
    
    return safeCollection.filter((card) => {
      const matchesRarity = selectedRarity === 'ALL' || card.rarity === selectedRarity;
      const matchesPosition = selectedPosition === 'ALL' || card.position === selectedPosition;
      return matchesRarity && matchesPosition;
    });
  }, [safeCollection, selectedRarity, selectedPosition]);

//   const filteredCards = useMemo(() => {
//     return collection.filter((card) => {
//       const matchesRarity = selectedRarity === 'ALL' || card.rarity === selectedRarity;
//       const matchesPosition = selectedPosition === 'ALL' || card.position === selectedPosition;
//       return matchesRarity && matchesPosition;
//     });
//   }, [collection, selectedRarity, selectedPosition]);

const handleCardPress = (card: CardType) => {
  setSelectedCard(card);
  setIsModalVisible(true);
};

  // Temporarily add this to CollectionScreen
React.useEffect(() => {
    console.log('Collection type:', typeof collection);
    console.log('Collection is array?', Array.isArray(collection));
    console.log('Collection value:', collection);
  }, [collection]);
// React.useEffect(() => {
//   if (collection && collection.length > 0) {
//     console.log('FIRST CARD KEYS:', Object.keys(collection[0]));
//   }
// }, [collection]);
  
  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="p-4 bg-card flex-row justify-between items-center">
        <View>
          <Text className="text-white text-2xl font-bold">My Collection</Text>
          <Text className="text-slate-400">
            {filteredCards.length} / {collection.length} cards
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilter(!showFilter)}
          className="bg-primary px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">
            {showFilter ? 'Hide' : 'Filter'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter */}
      {showFilter && (
        <CardFilter
          selectedRarity={selectedRarity}
          selectedPosition={selectedPosition}
          onRarityChange={setSelectedRarity}
          onPositionChange={setSelectedPosition}
        />
      )}

      {/* Card Grid */}
      <CardGrid
        cards={filteredCards}
        onCardPress={handleCardPress}
        loading={isLoading}
        onRefresh={refetch}
        emptyMessage="No cards in your collection yet. Open some packs!"
      />
      <CardDetailModal 
        card={selectedCard}
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
};