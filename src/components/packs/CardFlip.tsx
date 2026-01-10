import React, {useEffect} from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withRepeat,
  withSequence,
  interpolate,
  interpolateColor,
  Extrapolate
} from 'react-native-reanimated';
import { Card } from '../cards/Card';
import { Card as CardType } from '../../types/api';
import * as Haptics from 'expo-haptics';

const GLOW_COLORS: Record<string, string> = {
    COMMON: '#94a3b8',
    RARE: '#3b82f6',
    EPIC: '#a855f7',
    LEGENDARY: '#eab308',
    MYTHIC: '#ef4444', 
  };

interface CardFlipProps {
  card: CardType;
  isParentFlipped?: boolean;
}

export const CardFlip: React.FC<CardFlipProps> = ({ card, isParentFlipped }) => {
  const isFlipped = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  

  const handleFlip = React.useCallback(() => {
    // Only flip if it hasn't been flipped yet
    if (isFlipped.value === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      isFlipped.value = withTiming(1, { duration: 600 }, () => {
        // Start the rarity glow after the flip completes
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: 1000 }),
            withTiming(0.2, { duration: 1000 })
          ),
          -1,
          true
        );
      });
    }
  }, []);

  useEffect(() => {
    if (isParentFlipped) {
      handleFlip();
    }
  }, [isParentFlipped, handleFlip]);

  const frontStyle = useAnimatedStyle(() => {
    const spin = interpolate(isFlipped.value, [0, 1], [0, 180]);
    return { 
      transform: [{ rotateY: `${spin}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const spin = interpolate(isFlipped.value, [0, 1], [180, 360]);
    return { 
      transform: [{ rotateY: `${spin}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0.2, 0.6], [1, 1.2]) }],
    shadowColor: GLOW_COLORS[card.rarity] || GLOW_COLORS.COMMON,
    shadowRadius: 20,
    shadowOpacity: 1,
  }))
  
  const zIndexStyle = useAnimatedStyle(() => {
    return {
      // When isFlipped is less than 0.5 (Gambit side), zIndex is 1. 
      // When it passes 0.5 (Player side), zIndex is 2.
      zIndex: isFlipped.value > 0.5 ? 2 : 1,
    };
  });;

  return (
    <Pressable onPress={handleFlip} className="w-full h-full bg-red-500/20">
      {/* CARD BACK (Initial State) */}
      <Animated.View 
      style={[glowStyle, { backgroundColor: GLOW_COLORS[card.rarity] || GLOW_COLORS.COMMON }]} 
      className="absolute inset-2 rounded-xl" // This creates the 'blur' effect behind the card
    />

      <Animated.View 
      style={[frontStyle, zIndexStyle]}
      className="absolute inset-0 bg-slate-900 rounded-xl border-2 border-primary items-center justify-center shadow-xl"
    >
       <Text className="text-primary font-black text-xl italic">GAMBIT</Text>
       {/* You can keep your little line here if you like the look! */}
       <View className="h-[1px] w-12 bg-primary/40 mt-1" />
    </Animated.View>

      {/* CARD FRONT (The Reveal) */}
      <Animated.View 
        style={[backStyle, zIndexStyle]}
        pointerEvents={isParentFlipped ? "auto" : "none"}
        className="absolute inset-0"
      >
        {/* Pass custom dimensions to Card if needed, 
            or ensure Card component handles its own container */}
        <Card card={card} />
      </Animated.View>
    </Pressable>
  );
};