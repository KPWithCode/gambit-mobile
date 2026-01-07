import React from 'react';
import { View, Text, Modal, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Card as CardType } from '../../types/api';

interface CardDetailModalProps {
  card: CardType | null;
  isVisible: boolean;
  onClose: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, isVisible, onClose }) => {
  if (!card) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/80">
        <View className="bg-card rounded-t-3xl p-6 h-[80%] border-t border-primary/30">
          {/* Close Button */}
          <TouchableOpacity onPress={onClose} className="absolute right-6 top-6 z-10 bg-black/40 p-2 rounded-full">
            <Text className="text-white font-bold">✕</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Card Large Art */}
            <View className="items-center mb-6">
               <View className="w-64 aspect-[0.7] rounded-2xl overflow-hidden border-4 border-primary shadow-lg shadow-primary">
                  <Image source={{ uri: card.image_url }} className="w-full h-full" resizeMode="cover" />
               </View>
            </View>

            {/* Header Info */}
            <View className="items-center mb-6">
              <Text className="text-white text-3xl font-bold text-center">{card.player_name}</Text>
              <View className="flex-row items-center mt-2">
                <Text className="text-primary font-bold mr-2">{card.rarity}</Text>
                <Text className="text-slate-400">•</Text>
                <Text className="text-slate-400 ml-2">{card.team} | {card.position}</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View className="flex-row flex-wrap justify-between bg-background p-4 rounded-xl border border-slate-800">
              <DetailStat label="OFFENSE" value={card.offense} />
              <DetailStat label="DEFENSE" value={card.defense} />
              <DetailStat label="SPEED" value={card.speed} />
              <DetailStat label="REBOUND" value={card.rebounding} />
              <DetailStat label="3PT" value={card.three_point} />
              <DetailStat label="YEAR" value={card.season_year?.split('-')[0]} />
            </View>
            
            <View className="h-20" /> 
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const DetailStat = ({ label, value }: { label: string; value: string | number }) => (
  <View className="w-[30%] mb-4 items-center">
    <Text className="text-slate-500 text-[10px] mb-1">{label}</Text>
    <Text className="text-white text-lg font-bold">{value}</Text>
  </View>
);