// src/screens/ArenaScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { useBattle } from '../hooks/useBattle';

type AnimationType = 'slash' | 'fireball' | 'lightning' | 'rocket' | 'bomb' | 'threearrowdown' | 'exclamation' | 'thumbsup' | null;

export const ArenaScreen = ({ route, navigation }: any) => {
  const { battleId } = route.params;
  const { battleState, connected, error, submitAction, isMyTurn } = useBattle(battleId);
  
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // Animation refs
  const attackerScale = useRef(new Animated.Value(1)).current;
  const defenderShake = useRef(new Animated.Value(0)).current;
  const impactOpacity = useRef(new Animated.Value(0)).current;
  const scoreFlash = useRef(new Animated.Value(1)).current;

  // Watch for battle state changes to trigger animations
  useEffect(() => {
    if (battleState?.recent_moves && battleState.recent_moves.length > 0) {
      const lastMove = battleState.recent_moves[battleState.recent_moves.length - 1];
      
      // Only animate if it's a new move
      if (lastMove && !isAnimating) {
        triggerMoveAnimation(lastMove);
      }
    }
  }, [battleState?.recent_moves]);

  const triggerMoveAnimation = (move: any) => {
    setIsAnimating(true);
    
    // Step 1: Scale up attacker card
    Animated.sequence([
      Animated.timing(attackerScale, {
        toValue: 1.15,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(attackerScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Step 2: Show impact animation
    setTimeout(() => {
      const animation = getAnimationForAction(move.action, move.success, move.points_scored);
      setCurrentAnimation(animation);
      
      Animated.timing(impactOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // Hide animation after duration
        setTimeout(() => {
          Animated.timing(impactOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            setCurrentAnimation(null);
          });
        }, 600);
      });
    }, 300);

    // Step 3: Shake defender if successful hit
    if (move.success) {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(defenderShake, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(defenderShake, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(defenderShake, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(defenderShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      }, 400);
    }

    // Step 4: Flash score if points scored
    if (move.points_scored > 0) {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(scoreFlash, {
            toValue: 1.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scoreFlash, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }, 600);
    }

    // Reset animation state
    setTimeout(() => {
      setIsAnimating(false);
    }, 1200);
  };

  const getAnimationForAction = (action: string, success: boolean, pointsScored: number): AnimationType => {
    // Big score (bomb)
    if (pointsScored >= 3) {
      return 'bomb';
    }

    // Miss/Fail
    if (!success) {
      return 'exclamation';
    }

    // Map actions to animations
    const actionMap: Record<string, AnimationType> = {
      'FAST_BREAK': 'slash',
      'POST_UP': 'fireball',
      'THREE_POINT': 'rocket',
      'ISOLATION': 'lightning',
      'PICK_AND_ROLL': 'slash',
      'BLOCK': 'exclamation',
    };

    return actionMap[action] || 'slash';
  };

  const getAnimationSource = (animation: AnimationType) => {
    if (!animation) return null;

    const sources: Record<string, any> = {
      'slash': require('../../assets/animations/slash.json'),
      'fireball': require('../../assets/animations/fireball.json'),
      'lightning': require('../../assets/animations/lightning.json'),
      'rocket': require('../../assets/animations/rocket.json'),
      'bomb': require('../../assets/animations/bomb.json'),
      'threearrowdown': require('../../assets/animations/threearrowdown.json'),
      'exclamation': require('../../assets/animations/exclamation.json'),
      'thumbsup': require('../../assets/animations/thumbsup.json'),
    };

    return sources[animation];
  };

  const handleCardSelect = (cardId: string) => {
    if (!isMyTurn || isAnimating) return;
    setSelectedCardId(cardId);
  };

  const handleActionSubmit = (action: string) => {
    if (!isMyTurn || !selectedCardId || isAnimating) {
      alert('Please select a card first!');
      return;
    }
    
    submitAction(action, selectedCardId, 'PG');
    setSelectedCardId(null); // Reset selection
  };

  // Loading state
  if (!connected) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-white text-xl mt-4">Connecting to battle...</Text>
        <Text className="text-gray-400 text-sm mt-2">Battle ID: {battleId}</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center px-6">
        <Text className="text-6xl mb-4">⚠️</Text>
        <Text className="text-red-500 text-xl font-bold text-center mb-2">Connection Error</Text>
        <Text className="text-gray-400 text-center mb-6">{error}</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="bg-green-600 px-8 py-4 rounded-xl active:bg-green-700"
        >
          <Text className="text-white font-bold text-lg">Return to Lobby</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Battle state not loaded yet
  if (!battleState) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-white text-xl mt-4">Loading battle state...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      {/* HEADER - Scoreboard */}
      <View className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 border-b-2 border-gray-700">
        <View className="flex-row justify-between items-center">
          {/* Player 1 Score (with flash animation) */}
          <Animated.View 
            style={{ transform: [{ scale: scoreFlash }] }}
            className="flex-1 items-start"
          >
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider">You</Text>
            <Text className="text-white text-4xl font-black">{battleState.player1_score}</Text>
          </Animated.View>

          {/* Quarter Badge */}
          <View className="bg-yellow-500 px-6 py-3 rounded-full shadow-lg">
            <Text className="text-gray-900 text-2xl font-black">Q{battleState.quarter}</Text>
          </View>

          {/* Player 2 Score (with shake animation) */}
          <Animated.View 
            style={{ transform: [{ translateX: defenderShake }] }}
            className="flex-1 items-end"
          >
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Opponent</Text>
            <Text className="text-white text-4xl font-black">{battleState.player2_score}</Text>
          </Animated.View>
        </View>

        {/* Turn Indicator */}
        <View className="mt-4 items-center">
          <View className={`px-6 py-2 rounded-full ${isMyTurn ? 'bg-green-600' : 'bg-gray-700'}`}>
            <Text className={`font-bold text-sm uppercase tracking-wider ${isMyTurn ? 'text-white' : 'text-gray-400'}`}>
              {isMyTurn ? '🎯 YOUR TURN' : "⏳ OPPONENT'S TURN"}
            </Text>
          </View>
        </View>
      </View>

      {/* OPPONENT DECK (Face Down Cards) */}
      <Animated.View 
        style={{ transform: [{ scale: attackerScale }] }}
        className="px-4 py-4 bg-gray-800/50"
      >
        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
          Opponent's Deck
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {battleState.player2.deck?.map((card: any, i: number) => (
              <View 
                key={i} 
                className="w-16 h-24 bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl items-center justify-center border-2 border-gray-600 shadow-lg"
              >
                <Text className="text-gray-500 text-4xl">🃏</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {/* IMPACT ANIMATION LAYER */}
      {currentAnimation && (
        <Animated.View
          style={{ opacity: impactOpacity }}
          className="absolute inset-0 items-center justify-center pointer-events-none z-50"
        >
          <LottieView
            source={getAnimationSource(currentAnimation)}
            autoPlay
            loop={false}
            style={{ width: 300, height: 300 }}
          />
        </Animated.View>
      )}

      {/* BATTLE LOG */}
      <View className="flex-1 mx-4 my-3 bg-gray-800 rounded-xl p-4 border border-gray-700">
        <View className="flex-row items-center mb-3">
          <Text className="text-white font-bold text-lg">📜 Battle Log</Text>
          <View className="ml-2 bg-gray-700 px-2 py-1 rounded-full">
            <Text className="text-gray-400 text-xs font-semibold">
              {battleState.recent_moves?.length || 0} moves
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {battleState.recent_moves && battleState.recent_moves.length > 0 ? (
            battleState.recent_moves.map((move: any, i: number) => (
              <View 
                key={i} 
                className={`mb-2 p-3 rounded-lg border-l-4 ${
                  move.success ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'
                }`}
              >
                <Text className="text-gray-200 text-sm font-medium">{move.description}</Text>
                <View className="flex-row justify-between mt-2">
                  <Text className="text-gray-500 text-xs">
                    Turn {move.turn}
                  </Text>
                  <Text className={`text-xs font-bold ${move.points_scored > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                    {move.points_scored > 0 ? `+${move.points_scored} pts` : 'Miss'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className="flex-1 items-center justify-center py-8">
              <Text className="text-gray-500 text-sm">No moves yet. Game starting...</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* YOUR HAND */}
      <View className="bg-gray-800 pt-4 pb-6 border-t-2 border-gray-700">
        <View className="px-4 mb-3">
          <Text className="text-white font-bold text-sm uppercase tracking-wider">
            Your Hand {selectedCardId && '(Card Selected ✓)'}
          </Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {battleState.player1.deck && battleState.player1.deck.length > 0 ? (
            battleState.player1.deck.map((card: any) => (
              <TouchableOpacity
                key={card.id}
                className={`w-32 h-44 rounded-xl p-3 shadow-xl ${
                  selectedCardId === card.id
                    ? 'bg-gradient-to-b from-green-500 to-green-700 border-4 border-yellow-400'
                    : isMyTurn 
                      ? 'bg-gradient-to-b from-blue-600 to-blue-800 border-2 border-blue-400' 
                      : 'bg-gradient-to-b from-gray-600 to-gray-800 border-2 border-gray-600 opacity-60'
                }`}
                onPress={() => handleCardSelect(card.id)}
                disabled={!isMyTurn || isAnimating}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-xs mb-2" numberOfLines={2}>
                  {card.player_name}
                </Text>

                <View className="flex-1 justify-center space-y-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-300 text-xs">OFF</Text>
                    <Text className="text-yellow-400 font-bold text-sm">{card.offense}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-300 text-xs">DEF</Text>
                    <Text className="text-blue-400 font-bold text-sm">{card.defense}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-300 text-xs">SPD</Text>
                    <Text className="text-green-400 font-bold text-sm">{card.speed}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-300 text-xs">3PT</Text>
                    <Text className="text-purple-400 font-bold text-sm">{card.three_point}</Text>
                  </View>
                </View>

                <View className="mt-2 bg-gray-900/50 py-1 rounded-md">
                  <Text className="text-gray-300 text-xs text-center font-bold">
                    {card.position}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text className="text-gray-500 px-4">No cards in hand</Text>
          )}
        </ScrollView>
      </View>

      {/* ACTION BUTTONS */}
      {isMyTurn && (
        <View className="bg-gray-900 px-4 py-4 border-t-2 border-gray-800">
          <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 text-center">
            {selectedCardId ? 'Choose Your Action' : 'Select a Card First'}
          </Text>
          <View className="flex-row justify-between gap-2">
            <TouchableOpacity 
              className={`flex-1 py-4 rounded-xl shadow-lg ${
                selectedCardId && !isAnimating ? 'bg-purple-600 active:bg-purple-700' : 'bg-gray-700'
              }`}
              onPress={() => handleActionSubmit('FAST_BREAK')}
              disabled={!selectedCardId || isAnimating}
            >
              <Text className={`font-bold text-center text-sm ${
                selectedCardId && !isAnimating ? 'text-white' : 'text-gray-500'
              }`}>
                ⚡ Fast Break
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-1 py-4 rounded-xl shadow-lg ${
                selectedCardId && !isAnimating ? 'bg-orange-600 active:bg-orange-700' : 'bg-gray-700'
              }`}
              onPress={() => handleActionSubmit('POST_UP')}
              disabled={!selectedCardId || isAnimating}
            >
              <Text className={`font-bold text-center text-sm ${
                selectedCardId && !isAnimating ? 'text-white' : 'text-gray-500'
              }`}>
                💪 Post Up
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-1 py-4 rounded-xl shadow-lg ${
                selectedCardId && !isAnimating ? 'bg-green-600 active:bg-green-700' : 'bg-gray-700'
              }`}
              onPress={() => handleActionSubmit('THREE_POINT')}
              disabled={!selectedCardId || isAnimating}
            >
              <Text className={`font-bold text-center text-sm ${
                selectedCardId && !isAnimating ? 'text-white' : 'text-gray-500'
              }`}>
                🎯 3-Pointer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// import React from 'react';
// import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
// import { useBattle } from '../hooks/useBattle';

// export const ArenaScreen = ({ route, navigation }: any) => {
//   const { battleId } = route.params;
//   const { battleState, connected, error, submitAction, isMyTurn } = useBattle(battleId);

//   // Loading state
//   if (!connected) {
//     return (
//       <View className="flex-1 bg-gray-900 items-center justify-center">
//         <ActivityIndicator size="large" color="#10b981" />
//         <Text className="text-white text-xl mt-4">Connecting to battle...</Text>
//         <Text className="text-gray-400 text-sm mt-2">Battle ID: {battleId}</Text>
//       </View>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <View className="flex-1 bg-gray-900 items-center justify-center px-6">
//         <Text className="text-6xl mb-4">⚠️</Text>
//         <Text className="text-red-500 text-xl font-bold text-center mb-2">Connection Error</Text>
//         <Text className="text-gray-400 text-center mb-6">{error}</Text>
//         <TouchableOpacity 
//           onPress={() => navigation.goBack()}
//           className="bg-green-600 px-8 py-4 rounded-xl active:bg-green-700"
//         >
//           <Text className="text-white font-bold text-lg">Return to Lobby</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   // Battle state not loaded yet
//   if (!battleState) {
//     return (
//       <View className="flex-1 bg-gray-900 items-center justify-center">
//         <ActivityIndicator size="large" color="#10b981" />
//         <Text className="text-white text-xl mt-4">Loading battle state...</Text>
//       </View>
//     );
//   }

//   const handleCardPlay = (cardId: string, action: string) => {
//     if (!isMyTurn) {
//       alert('Not your turn!');
//       return;
//     }
//     submitAction(action, cardId, 'PG');
//   };

//   return (
//     <View className="flex-1 bg-gray-900">
//       {/* HEADER - Scoreboard */}
//       <View className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 border-b-2 border-gray-700">
//         <View className="flex-row justify-between items-center">
//           {/* Player 1 Score */}
//           <View className="flex-1 items-start">
//             <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider">You</Text>
//             <Text className="text-white text-4xl font-black">{battleState.player1_score}</Text>
//           </View>

//           {/* Quarter Badge */}
//           <View className="bg-yellow-500 px-6 py-3 rounded-full shadow-lg">
//             <Text className="text-gray-900 text-2xl font-black">Q{battleState.quarter}</Text>
//           </View>

//           {/* Player 2 Score */}
//           <View className="flex-1 items-end">
//             <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Opponent</Text>
//             <Text className="text-white text-4xl font-black">{battleState.player2_score}</Text>
//           </View>
//         </View>

//         {/* Turn Indicator */}
//         <View className="mt-4 items-center">
//           <View className={`px-6 py-2 rounded-full ${isMyTurn ? 'bg-green-600' : 'bg-gray-700'}`}>
//             <Text className={`font-bold text-sm uppercase tracking-wider ${isMyTurn ? 'text-white' : 'text-gray-400'}`}>
//               {isMyTurn ? '🎯 YOUR TURN' : "⏳ OPPONENT'S TURN"}
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* OPPONENT DECK (Face Down Cards) */}
//       <View className="px-4 py-4 bg-gray-800/50">
//         <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
//           Opponent's Deck
//         </Text>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//           <View className="flex-row gap-2">
//             {battleState.player2.deck.map((card, i) => (
//               <View 
//                 key={i} 
//                 className="w-16 h-24 bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl items-center justify-center border-2 border-gray-600 shadow-lg"
//               >
//                 <Text className="text-gray-500 text-4xl">🃏</Text>
//               </View>
//             ))}
//           </View>
//         </ScrollView>
//       </View>

//       {/* BATTLE LOG */}
//       <View className="flex-1 mx-4 my-3 bg-gray-800 rounded-xl p-4 border border-gray-700">
//         <View className="flex-row items-center mb-3">
//           <Text className="text-white font-bold text-lg">📜 Battle Log</Text>
//           <View className="ml-2 bg-gray-700 px-2 py-1 rounded-full">
//             <Text className="text-gray-400 text-xs font-semibold">
//               {battleState.recent_moves?.length || 0} moves
//             </Text>
//           </View>
//         </View>

//         <ScrollView showsVerticalScrollIndicator={false}>
//           {battleState.recent_moves && battleState.recent_moves.length > 0 ? (
//             battleState.recent_moves.map((move, i) => (
//               <View 
//                 key={i} 
//                 className="mb-2 p-3 bg-gray-700 rounded-lg border-l-4 border-blue-500"
//               >
//                 <Text className="text-gray-200 text-sm font-medium">{move.description}</Text>
//                 <View className="flex-row justify-between mt-2">
//                   <Text className="text-gray-500 text-xs">
//                     Turn {move.turn}
//                   </Text>
//                   <Text className={`text-xs font-bold ${move.points_scored > 0 ? 'text-green-400' : 'text-gray-500'}`}>
//                     {move.points_scored > 0 ? `+${move.points_scored} pts` : 'No score'}
//                   </Text>
//                 </View>
//               </View>
//             ))
//           ) : (
//             <View className="flex-1 items-center justify-center py-8">
//               <Text className="text-gray-500 text-sm">No moves yet. Game starting...</Text>
//             </View>
//           )}
//         </ScrollView>
//       </View>

//       {/* YOUR HAND */}
//       <View className="bg-gray-800 pt-4 pb-6 border-t-2 border-gray-700">
//         <View className="px-4 mb-3">
//           <Text className="text-white font-bold text-sm uppercase tracking-wider">
//             Your Hand
//           </Text>
//         </View>

//         <ScrollView 
//           horizontal 
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
//         >
//           {battleState.player1.deck && battleState.player1.deck.length > 0 ? (
//             battleState.player1.deck.map((card) => (
//               <TouchableOpacity
//                 key={card.id}
//                 className={`w-32 h-44 rounded-xl p-3 shadow-xl ${
//                   isMyTurn 
//                     ? 'bg-gradient-to-b from-blue-600 to-blue-800 border-2 border-green-400' 
//                     : 'bg-gradient-to-b from-gray-600 to-gray-800 border-2 border-gray-600 opacity-60'
//                 }`}
//                 onPress={() => handleCardPlay(card.id, 'THREE_POINT')}
//                 disabled={!isMyTurn}
//                 activeOpacity={0.8}
//               >
//                 {/* Card Name */}
//                 <Text className="text-white font-bold text-xs mb-2" numberOfLines={2}>
//                   {card.player_name}
//                 </Text>

//                 {/* Card Stats */}
//                 <View className="flex-1 justify-center space-y-1">
//                   <View className="flex-row justify-between items-center">
//                     <Text className="text-gray-300 text-xs">OFF</Text>
//                     <Text className="text-yellow-400 font-bold text-sm">{card.offense}</Text>
//                   </View>
//                   <View className="flex-row justify-between items-center">
//                     <Text className="text-gray-300 text-xs">DEF</Text>
//                     <Text className="text-blue-400 font-bold text-sm">{card.defense}</Text>
//                   </View>
//                   <View className="flex-row justify-between items-center">
//                     <Text className="text-gray-300 text-xs">SPD</Text>
//                     <Text className="text-green-400 font-bold text-sm">{card.speed}</Text>
//                   </View>
//                   <View className="flex-row justify-between items-center">
//                     <Text className="text-gray-300 text-xs">3PT</Text>
//                     <Text className="text-purple-400 font-bold text-sm">{card.three_point}</Text>
//                   </View>
//                 </View>

//                 {/* Position Badge */}
//                 <View className="mt-2 bg-gray-900/50 py-1 rounded-md">
//                   <Text className="text-gray-300 text-xs text-center font-bold">
//                     {card.position}
//                   </Text>
//                 </View>
//               </TouchableOpacity>
//             ))
//           ) : (
//             <Text className="text-gray-500 px-4">No cards in hand</Text>
//           )}
//         </ScrollView>
//       </View>

//       {/* ACTION BUTTONS (Only show when it's your turn) */}
//       {isMyTurn && (
//         <View className="bg-gray-900 px-4 py-4 border-t-2 border-gray-800">
//           <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 text-center">
//             Choose Your Action
//           </Text>
//           <View className="flex-row justify-between gap-2">
//             <TouchableOpacity 
//               className="flex-1 bg-purple-600 py-4 rounded-xl active:bg-purple-700 shadow-lg"
//               onPress={() => alert('Select a card, then choose Fast Break')}
//             >
//               <Text className="text-white font-bold text-center text-sm">⚡ Fast Break</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               className="flex-1 bg-orange-600 py-4 rounded-xl active:bg-orange-700 shadow-lg"
//               onPress={() => alert('Select a card, then choose Post Up')}
//             >
//               <Text className="text-white font-bold text-center text-sm">💪 Post Up</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity 
//               className="flex-1 bg-green-600 py-4 rounded-xl active:bg-green-700 shadow-lg"
//               onPress={() => alert('Select a card, then choose 3-Pointer')}
//             >
//               <Text className="text-white font-bold text-center text-sm">🎯 3-Pointer</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// };