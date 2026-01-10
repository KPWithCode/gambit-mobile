import React from 'react';
import { FlatList, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { Card } from './Card';
import { Card as CardType } from '../../types/api';

interface CardGridProps {
  cards: CardType[];
  onCardPress?: (card: CardType) => void;
  selectedIds?: string[];
  loading?: boolean;
  onRefresh: () => void; // New Prop
  emptyMessage?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  cards,
  onCardPress,
  selectedIds,
  loading = false,
  onRefresh,
  emptyMessage = 'No cards found',
}) => {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-slate-400">Loading cards...</Text>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-6xl mb-4">🎴</Text>
        <Text className="text-slate-400 text-center text-lg">
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={cards}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }}
      renderItem={({ item }) => (
        <View className='flex-1 px-1'>

          <Card card={item} onPress={onCardPress} isSelected={selectedIds?.includes(item.id)} />
        </View>
      )}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor="#3b82f6" // Primary Blue
          colors={["#3b82f6"]}
        />
      }
      ListEmptyComponent={
        <View className="items-center mt-20 px-10">
          <Text className="text-slate-400 text-center">{emptyMessage}</Text>
        </View>
      }
    />
  );
  // return (
  //   <FlatList
  //     data={cards}
  //     keyExtractor={(item) => item.id}
  //     numColumns={2}
  //     columnWrapperStyle={{ gap: 12 }}
  //     contentContainerStyle={{ padding: 16, gap: 12 }}
  //     renderItem={({ item }) => (
  //       <TouchableOpacity
  //         onPress={() => onCardPress?.(item)}
  //         activeOpacity={0.8}
  //         className="flex-1"
  //       >
  //         <Card card={item} size="medium" />
  //       </TouchableOpacity>
  //     )}
  //   />
  // );
};