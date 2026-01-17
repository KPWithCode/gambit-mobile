import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { CardGrid } from '../components/cards/CardGrid';
import { CardFilter } from '../components/cards/CardFilter';
import { useMyCollection } from '../hooks/useCards';
import { Card as CardType } from '../types/api';
import { useAuth } from '../hooks/useAuth';
import { CardDetailModal } from '@/components/cards/CardDetailModal';


type Rarity = 'ALL' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
type Position = 'ALL' | 'PG' | 'SG' | 'SF' | 'PF' | 'C';
type CardTypeFilter = 'ALL' | 'PLAYER' | 'SPELL' | 'TRAP';


export const CollectionScreen = () => {
  const { collection, isLoading, refetch } = useMyCollection();
  const [showFilter, setShowFilter] = useState(false);
  const { signOut } = useAuth();
  const [selectedRarity, setSelectedRarity] = useState<Rarity>('ALL');
  const [selectedPosition, setSelectedPosition] = useState<Position>('ALL');
  const [selectedType, setSelectedType] = useState<CardTypeFilter>('ALL');

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const safeCollection = Array.isArray(collection) ? collection : [];

  const filteredCards = useMemo(() => {
    if (!Array.isArray(safeCollection)) return [];

    return safeCollection.filter((card) => {
      const matchesRarity = selectedRarity === 'ALL' || card.rarity === selectedRarity;
      const matchesPosition = selectedPosition === 'ALL' || card.position === selectedPosition;
      const matchesType = selectedType === 'ALL' || card.type === selectedType || (selectedType === 'PLAYER' && !card.type); // ← NEW
      return matchesRarity && matchesPosition;
    });
  }, [safeCollection, selectedRarity, selectedPosition]);

  const handleCardPress = (card: CardType) => {
    setSelectedCard(card);
    setIsModalVisible(true);
  };

  //   const filteredCards = useMemo(() => {
  //     return collection.filter((card) => {
  //       const matchesRarity = selectedRarity === 'ALL' || card.rarity === selectedRarity;
  //       const matchesPosition = selectedPosition === 'ALL' || card.position === selectedPosition;
  //       return matchesRarity && matchesPosition;
  //     });
  //   }, [collection, selectedRarity, selectedPosition]);


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
        <View>
          <CardFilter
            selectedRarity={selectedRarity}
            selectedPosition={selectedPosition}
            onRarityChange={setSelectedRarity}
            onPositionChange={setSelectedPosition}
          />
          <View className="px-4 pb-2">
            <Text className="text-slate-400 text-sm mb-2">Card Type</Text>
            <View className="flex-row gap-2">
              {(['ALL', 'PLAYER', 'SPELL', 'TRAP']as CardTypeFilter[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type as CardTypeFilter)}
                  className={`px-4 py-2 rounded-lg ${selectedType === type ? 'bg-primary' : 'bg-slate-800'
                    }`}
                >
                  <Text className={`font-semibold ${selectedType === type ? 'text-white' : 'text-slate-400'
                    }`}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
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
        onScrap={refetch}
      />
    </View>
  );
};