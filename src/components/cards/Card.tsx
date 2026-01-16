import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Card as CardType } from '../../types/api';

interface CardProps {
  card: CardType;
  onPress?: (card: CardType) => void;
  size?: 'sm' | 'md' | 'lg';
  isSelected?: boolean;
}

const RARITY_COLORS = {
  COMMON: 'border-slate-400 bg-slate-800',
  RARE: 'border-blue-400 bg-blue-900',
  EPIC: 'border-purple-500 bg-purple-900',
  LEGENDARY: 'border-amber-400 bg-amber-900',
  MYTHIC: 'border-red-500 bg-red-900',
};

// Card type colors
const CARD_TYPE_COLORS = {
  PLAYER: 'bg-blue-900/20',
  SPELL: 'bg-purple-900/20',
  TRAP: 'bg-red-900/20',
};

export const Card: React.FC<CardProps> = ({ card, onPress, isSelected }) => {
  if (!card) return <View className="w-full h-full bg-slate-800 rounded-xl" />;

  // Check if card is a spell/trap
  const isSpellOrTrap = card.type === 'SPELL' || card.type === 'TRAP';

  return (
    <TouchableOpacity 
      onPress={() => onPress?.(card)}
      className={`flex-1 rounded-xl border-2 p-1 ${RARITY_COLORS[card.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.COMMON}`}
      style={{ width: '100%', aspectRatio: 0.8 }}
    >
      <View className={`flex-1 rounded-lg overflow-hidden relative ${CARD_TYPE_COLORS[card.type as keyof typeof CARD_TYPE_COLORS] || 'bg-black/20'}`}>
        {isSelected && (
          <View className="absolute inset-0 bg-primary/20 z-20 items-center justify-center">
            <View className="bg-primary rounded-full px-4 py-2">
              <Text className="text-white font-bold">✓</Text>
            </View>
          </View>
        )}

        {/* Card Image */}
        {card.image_url ? (
          <Image 
            source={{ uri: card.image_url }} 
            className="w-full h-full absolute"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white opacity-20 text-xs">No Art</Text>
          </View>
        )}

        {/* Card Type Badge */}
        <View className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60">
          <Text className={`text-xs font-bold ${
            card.type === 'SPELL' ? 'text-purple-400' : 
            card.type === 'TRAP' ? 'text-red-400' : 
            'text-blue-400'
          }`}>
            {card.type === 'SPELL' ? '✨' : card.type === 'TRAP' ? '🛡️' : '👤'}
          </Text>
        </View>

        {/* Top Info Bar - Only for Player Cards */}
        {!isSpellOrTrap && (
          <View className="absolute top-0 left-0 right-0 p-2 bg-black/40 flex-row justify-between items-center">
            <Text className="text-white font-bold text-[10px]">{card.position}</Text>
            <Text className="text-white font-bold text-[10px]">{card.team}</Text>
          </View>
        )}

        {/* Bottom Info */}
        <View className="absolute bottom-0 left-0 right-0 p-2 bg-black/60">
          {isSpellOrTrap ? (
            // Spell/Trap Card Bottom
            <>
              <Text className="text-white font-bold text-xs" numberOfLines={1}>
                {card.name}
              </Text>
              <Text className="text-slate-300 text-[9px] mt-1" numberOfLines={2}>
                {card.description}
              </Text>
            </>
          ) : (
            // Player Card Bottom
            <>
              <Text className="text-white font-bold text-xs" numberOfLines={1}>
                {card.player_name}
              </Text>
              <View className="flex-row justify-between mt-1">
                <StatLabel label="OFF" value={card.offense} />
                <StatLabel label="DEF" value={card.defense} />
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const StatLabel = ({ label, value }: { label: string; value: number }) => (
  <View>
    <Text className="text-slate-400 text-[8px]">{label}</Text>
    <Text className="text-white font-bold text-[10px]">{value}</Text>
  </View>
);

// import React from 'react';
// import { View, Text, Image, TouchableOpacity } from 'react-native';
// import { Card as CardType } from '../../types/api';

// interface CardProps {
//   card: CardType;
//   onPress?: (card: CardType) => void;
//   size?: 'sm' | 'md' | 'lg';
//   isSelected?: boolean;
// }

// const RARITY_COLORS = {
//   COMMON: 'border-slate-400 bg-slate-800',
//   RARE: 'border-blue-400 bg-blue-900',
//   EPIC: 'border-purple-500 bg-purple-900',
//   LEGENDARY: 'border-amber-400 bg-amber-900',
//   MYTHIC: 'border-red-500 bg-red-900',
// };

// export const Card: React.FC<CardProps> = ({ card, onPress, isSelected }) => {
//   if (!card) return <View className="w-full h-full bg-slate-800 rounded-xl" />;
//   return (
//     <TouchableOpacity 
//       onPress={() => onPress?.(card)}
//       className={`flex-1 rounded-xl border-2 p-1 ${RARITY_COLORS[card.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.COMMON}`}
//       // className={`rounded-xl border-2 p-1 ${RARITY_COLORS[card.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.COMMON}`}
//       style={{ width: '100%', aspectRatio: 0.8 }}
//     >
//       <View className="flex-1 bg-black/20 rounded-lg overflow-hidden relative">
//       {isSelected && (
//           <View className="absolute inset-0 bg-primary/20 z-20 items-center justify-center">
//             <View className="bg-primary rounded-full px-4 py-2">
//               <Text className="text-white font-bold">✓</Text>
//             </View>
//           </View>
//         )}
//         {/* Player Image */}
//         {card.image_url ? (
//           <Image 
//             source={{ uri: card.image_url }} 
//             className="w-full h-full absolute"
//             resizeMode="cover"
//           />
//         ) : (
//           <View className="flex-1 items-center justify-center">
//             <Text className="text-white opacity-20 text-xs">No Art</Text>
//           </View>
//         )}

//         {/* Top Info Bar */}
//         <View className="absolute top-0 left-0 right-0 p-2 bg-black/40 flex-row justify-between items-center">
//           <Text className="text-white font-bold text-[10px]">{card.position}</Text>
//           <Text className="text-white font-bold text-[10px]">{card.team}</Text>
//         </View>

//         {/* Bottom Stats Tray */}
//         <View className="absolute bottom-0 left-0 right-0 p-2 bg-black/60">
//           <Text className="text-white font-bold text-xs" numberOfLines={1}>
//             {card.player_name}
//           </Text>
//           <View className="flex-row justify-between mt-1">
//             <StatLabel label="OFF" value={card.offense} />
//             <StatLabel label="DEF" value={card.defense} />
//           </View>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// const StatLabel = ({ label, value }: { label: string; value: number }) => (
//   <View>
//     <Text className="text-slate-400 text-[8px]">{label}</Text>
//     <Text className="text-white font-bold text-[10px]">{value}</Text>
//   </View>
// );