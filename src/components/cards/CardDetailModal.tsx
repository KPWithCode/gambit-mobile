import React from 'react';
import { View, Text, Modal, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Card as CardType } from '../../types/api';
import { SCRAP_VALUES } from './Card';
import api from '@/lib/api';

interface CardDetailModalProps {
  card: CardType | null;
  isVisible: boolean;
  onClose: () => void;
  onScrap?: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, isVisible, onClose, onScrap }) => {
  if (!card) return null;
  const handleScrapCard = () => {
    // Debug the card object
    console.log('=== SCRAP DEBUG ===');
    console.log('Full card object:', JSON.stringify(card, null, 2));
    console.log('card.id:', card.id);
    console.log('card.user_card_id:', (card as any).user_card_id);
    
    const userCardId = (card as any).user_card_id;
    
    // Make sure we have a user_card_id
    if (!userCardId) {
      Alert.alert('Error', 'Missing user card ID. Please try refreshing your collection.');
      console.error('❌ No user_card_id found on card:', card);
      return;
    }
    
    const gemsValue = SCRAP_VALUES[card.rarity as keyof typeof SCRAP_VALUES] || 10;
  
    Alert.alert(
      'Scrap Card?',
      `Scrap ${card.player_name || card.name} for 💎 ${gemsValue} gems?`,
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: `Scrap for ${gemsValue} gems`,
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Scrapping card with user_card_id:', userCardId);
              const response = await api.post(`/cards/${userCardId}/scrap`);
              
              Alert.alert(
                '✅ Success!',
                `Card scrapped! You earned 💎 ${response.data.gems_earned} gems.`
              );
              
              onClose();
              onScrap?.();
            } catch (error: any) {
              console.error('❌ Scrap error:', error);
              console.error('Error response:', error.response?.data);
              Alert.alert('Error', error.response?.data?.error || 'Failed to scrap card');
            }
          },
        },
      ]
    );
  };

  // const handleScrapCard = () => {
  //   const userCardId = (card as any).user_card_id || card.id;
  //   const gemsValue = SCRAP_VALUES[card.rarity as keyof typeof SCRAP_VALUES] || 10;
  
  //   Alert.alert(
  //     'Scrap Card?',
  //     `Scrap for 💎 ${gemsValue} gems?`,
  //     [
  //       { text: 'Go Back', style: 'cancel' },
  //       {
  //         text: `Scrap for ${gemsValue} gems`,
  //         style: 'destructive',
  //         onPress: async () => {
  //           try {
  //             const response = await api.post(`/cards/${userCardId}/scrap`);
              
  //             Alert.alert(
  //               '✅ Success!',
  //               `Card scrapped! You earned 💎 ${response.data.gems_earned} gems.`
  //             );
              
  //             onClose();
  //             onScrap?.();
  //           } catch (error: any) {
  //             console.error('Scrap error:', error);
  //             Alert.alert('Error', error.response?.data?.error || 'Failed to scrap card');
  //           }
  //         },
  //       },
  //     ]
  //   );
  // };
  
  const renderEffectData = () => {
    if (!card.effect) return <Text className="text-white text-base">{card.description}</Text>;

    const effectData = typeof card.effect === 'string' ? JSON.parse(card.effect) : card.effect;
    const statBoosts = effectData.stat_boost || {};

    return (
      <View>
        <Text className="text-white text-base mb-2">{card.description}</Text>
        
        {/* Dynamic Stat Boosts Mapping */}
        {Object.entries(statBoosts).map(([stat, value]) => (
          <View key={stat} className="flex-row justify-between bg-black/20 p-2 rounded-lg mb-1">
            <Text className="text-slate-300 capitalize">{stat} Boost</Text>
            <Text className="text-green-400 font-bold">+{value as number}</Text>
          </View>
        ))}

        {effectData.duration && (
          <View className="flex-row justify-between mt-1 px-2">
            <Text className="text-slate-400 text-xs">Duration</Text>
            <Text className="text-blue-400 text-xs font-bold">{effectData.duration}</Text>
          </View>
        )}
      </View>
    );
  };

  //Check card type
  const isSpellOrTrap = card.type === 'SPELL' || card.type === 'TRAP';


  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/80">
        <View className="bg-card rounded-t-3xl p-6 h-[80%] border-t border-primary/30">
          {/* Close Button */}
         
          <View className="flex-row justify-between items-center mb-4 gap-3">
        {/* Close Button */}
        <TouchableOpacity onPress={onClose} className="bg-black/40 rounded-full w-10 h-10 items-center justify-center">
          <Text className="text-white font-bold text-lg">Close</Text>
        </TouchableOpacity>
        {/* Scrap Button */}
        <TouchableOpacity
          onPress={handleScrapCard}
          className="rounded-full w-10 h-10 items-center justify-center"
        >
          <Text className="text-red-500 font-black text-xl">X</Text>
        </TouchableOpacity>

      </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Card Large Art */}
            <View className="items-center mb-6">
              <View className="w-64 aspect-[0.7] rounded-2xl overflow-hidden border-4 border-primary shadow-lg shadow-primary">
                <Image source={{ uri: card.image_url }} className="w-full h-full" resizeMode="cover" />
              </View>
            </View>

            {/* Header Info */}
            <View className="items-center mb-6">
              <Text className="text-white text-3xl font-bold text-center">
                {isSpellOrTrap ? card.name : card.player_name}
              </Text>
              <View className="flex-row items-center mt-2">
                <Text className={`font-bold mr-2 ${
                  card.type === 'SPELL' ? 'text-purple-400' :
                  card.type === 'TRAP' ? 'text-red-400' :
                  'text-primary'
                }`}>
                  {card.type}
                </Text>
                <Text className="text-slate-400">•</Text>
                <Text className="text-slate-400 ml-2">{card.rarity}</Text>
                {!isSpellOrTrap && (
                  <>
                    <Text className="text-slate-400 mx-1">•</Text>
                    <Text className="text-slate-400">{card.team} | {card.position}</Text>
                  </>
                )}
              </View>
            </View>

            {/*Spell/Trap Description */}
            {isSpellOrTrap && (
              <View className="bg-background p-4 rounded-xl border border-slate-800 mb-4">
                <Text className="text-slate-400 text-sm mb-2">Effect:</Text>
                <Text className="text-white text-base">{card.description}</Text>
                {renderEffectData()}
                {card.trigger && (
                  <View className="mt-3">
                    <Text className="text-slate-400 text-sm mb-1">Trigger:</Text>
                    <Text className="text-yellow-400 text-sm font-bold">{card.trigger}</Text>
                  </View>
                )}

                {card.effect_value && (
                  <View className="mt-3">
                    <Text className="text-slate-400 text-sm mb-1">Power:</Text>
                    <Text className="text-green-400 text-xl font-bold">{card.effect_value > 0 ? '+' : ''}{card.effect_value}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Stats Grid - Only for Player Cards */}
            {!isSpellOrTrap && (
              <View className="flex-row flex-wrap justify-between bg-background p-4 rounded-xl border border-slate-800">
                <DetailStat label="OFFENSE" value={card.offense} />
                <DetailStat label="DEFENSE" value={card.defense} />
                <DetailStat label="SPEED" value={card.speed} />
                <DetailStat label="REBOUND" value={card.rebounding} />
                <DetailStat label="3PT" value={card.three_point} />
                <DetailStat label="YEAR" value={card.season_year?.split('-')[0]} />
              </View>
            )}
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


// import React from 'react';
// import { View, Text, Modal, Image, TouchableOpacity, ScrollView } from 'react-native';
// import { Card as CardType } from '../../types/api';

// interface CardDetailModalProps {
//   card: CardType | null;
//   isVisible: boolean;
//   onClose: () => void;
// }

// export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, isVisible, onClose }) => {
//   if (!card) return null;

//   return (
//     <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
//       <View className="flex-1 justify-end bg-black/80">
//         <View className="bg-card rounded-t-3xl p-6 h-[80%] border-t border-primary/30">
//           {/* Close Button */}
//           <TouchableOpacity onPress={onClose} className="absolute right-6 top-6 z-10 bg-black/40 p-2 rounded-full">
//             <Text className="text-white font-bold">✕</Text>
//           </TouchableOpacity>

//           <ScrollView showsVerticalScrollIndicator={false}>
//             {/* Card Large Art */}
//             <View className="items-center mb-6">
//                <View className="w-64 aspect-[0.7] rounded-2xl overflow-hidden border-4 border-primary shadow-lg shadow-primary">
//                   <Image source={{ uri: card.image_url }} className="w-full h-full" resizeMode="cover" />
//                </View>
//             </View>

//             {/* Header Info */}
//             <View className="items-center mb-6">
//               <Text className="text-white text-3xl font-bold text-center">{card.player_name}</Text>
//               <View className="flex-row items-center mt-2">
//                 <Text className="text-primary font-bold mr-2">{card.rarity}</Text>
//                 <Text className="text-slate-400">•</Text>
//                 <Text className="text-slate-400 ml-2">{card.team} | {card.position}</Text>
//               </View>
//             </View>

//             {/* Stats Grid */}
//             <View className="flex-row flex-wrap justify-between bg-background p-4 rounded-xl border border-slate-800">
//               <DetailStat label="OFFENSE" value={card.offense} />
//               <DetailStat label="DEFENSE" value={card.defense} />
//               <DetailStat label="SPEED" value={card.speed} />
//               <DetailStat label="REBOUND" value={card.rebounding} />
//               <DetailStat label="3PT" value={card.three_point} />
//               <DetailStat label="YEAR" value={card.season_year?.split('-')[0]} />
//             </View>
            
//             <View className="h-20" /> 
//           </ScrollView>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// const DetailStat = ({ label, value }: { label: string; value: string | number }) => (
//   <View className="w-[30%] mb-4 items-center">
//     <Text className="text-slate-500 text-[10px] mb-1">{label}</Text>
//     <Text className="text-white text-lg font-bold">{value}</Text>
//   </View>
// );