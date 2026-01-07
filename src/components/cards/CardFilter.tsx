import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

type Rarity = 'ALL' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
type Position = 'ALL' | 'PG' | 'SG' | 'SF' | 'PF' | 'C';

interface CardFilterProps {
  selectedRarity: Rarity;
  selectedPosition: Position;
  onRarityChange: (rarity: Rarity) => void;
  onPositionChange: (position: Position) => void;
}

export const CardFilter: React.FC<CardFilterProps> = ({
  selectedRarity,
  selectedPosition,
  onRarityChange,
  onPositionChange,
}) => {
  const rarities: Rarity[] = ['ALL', 'MYTHIC', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON'];
  const positions: Position[] = ['ALL', 'PG', 'SG', 'SF', 'PF', 'C'];

  return (
    <View className="bg-card">
      {/* Rarity Filter */}
      <View className="p-4 border-b border-slate-700">
        <Text className="text-white font-semibold mb-2">Rarity</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {rarities.map((rarity) => (
              <FilterChip
                key={rarity}
                label={rarity}
                selected={selectedRarity === rarity}
                onPress={() => onRarityChange(rarity)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Position Filter */}
      <View className="p-4">
        <Text className="text-white font-semibold mb-2">Position</Text>
        <View className="flex-row gap-2">
          {positions.map((position) => (
            <FilterChip
              key={position}
              label={position}
              selected={selectedPosition === position}
              onPress={() => onPositionChange(position)}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const FilterChip: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
}> = ({ label, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-4 py-2 rounded-full ${
      selected ? 'bg-primary' : 'bg-background border border-slate-600'
    }`}
  >
    <Text className={`font-semibold ${selected ? 'text-white' : 'text-slate-400'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);