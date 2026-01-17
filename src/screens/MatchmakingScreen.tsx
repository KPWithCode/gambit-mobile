import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../hooks/useAuth';
import { useDeck } from '../hooks/useCards';


export const MatchmakingScreen = ({ route, navigation }: any) => {
  const { sport } = route.params;
  const { user } = useAuth();
  const { deck } = useDeck();
  
  const [status, setStatus] = useState<'searching' | 'matched' | 'expired' | 'error'>('searching');
  const [battleId, setBattleId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [opponentName, setOpponentName] = useState<string>('');
  const pulseAnim = new Animated.Value(1);

  // Convex mutations/queries
  const joinQueueMutation = useMutation(api.matchmaking.joinQueue);
  const leaveQueueMutation = useMutation(api.matchmaking.leaveQueue);
  const markExpiredMutation = useMutation(api.matchmaking.markExpired);
  const createAIBattleMutation = useMutation(api.battles.createBattle);
  
  // Real-time queue status subscription
  const queueStatus = useQuery(
    api.matchmaking.getQueueStatus,
    user?.id ? { userId: user.id } : "skip"
  );

  // ANIMATION useEffect
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // MATCHMAKING useEffect - REMOVE THE DUPLICATE ON LINE 72-89!
  useEffect(() => {
    if (!user?.id || !deck) {
      console.log('⏳ Waiting for user or deck...', { userId: user?.id, hasDeck: !!deck });
      return;
    }

    console.log('🚀 Starting matchmaking for user:', user.id);
    joinMatchmaking();

    // Cleanup on unmount
    return () => {
      if (user?.id) {
        leaveQueueMutation({ userId: user.id });
      }
    };
  }, [user?.id, deck]);

// Watch queue status changes
useEffect(() => {
  console.log('👀 Queue status changed:', JSON.stringify(queueStatus, null, 2));
  
  if (!queueStatus || !user?.id) {
    console.log('⏳ No queue status or user');
    return;
  }

  console.log('🎯 Queue status:', queueStatus.status);

  if (queueStatus.status === "MATCHED" && queueStatus.battleId) {
    console.log('🎉 MATCHED! Battle ID:', queueStatus.battleId);
    setStatus('matched');
    setBattleId(queueStatus.battleId);
    
    setTimeout(() => {
      navigation.replace('Arena', { battleId: queueStatus.battleId });
    }, 1500);
  } else if (queueStatus.status === "EXPIRED") {
    console.log('⏰ EXPIRED - Creating AI battle');
    markExpiredMutation({ userId: user.id });
    setStatus('expired');
    createAIBattle();
  } else {
    console.log('⏳ Still waiting...');
  }
}, [queueStatus]);
  const joinMatchmaking = async () => {
    try {
      if (!user?.id) {
        console.log('❌ No user ID');
        setStatus('error');
        setErrorMessage('Not authenticated');
        return;
      }
  
      if (!deck) {
        console.log('❌ No deck');
        return;
      }
  
      console.log('✅ Starting matchmaking with user ID:', user.id);
      console.log('📦 Raw deck:', JSON.stringify(deck, null, 2));
  
      // Build deck array with better error handling
      const playerDeck = [
        ...(deck.starters || []).map((uc: any) => {
          const cardDetails = uc.CardDetails || uc;
          return {
            ...cardDetails,
            id: cardDetails.id || uc.id,
            type: 'PLAYER'
          };
        }),
        ...(deck.bench || []).map((uc: any) => {
          const cardDetails = uc.CardDetails || uc;
          return {
            ...cardDetails,
            id: cardDetails.id || uc.id,
            type: 'PLAYER'
          };
        }),
        ...(deck.strategy || []).map((uc: any) => {
          const cardDetails = uc.CardDetails || uc;
          return {
            ...cardDetails,
            id: cardDetails.id || uc.id,
            type: cardDetails.type || uc.type || 'STRATEGY'
          };
        })
      ];
  
      console.log('📦 Player deck prepared:', playerDeck.length, 'cards');
      console.log('📦 Sample card:', JSON.stringify(playerDeck[0], null, 2));
  
      const result = await joinQueueMutation({
        userId: user.id,
        username: user.username || user.display_name || 'Player',
        sport,
        deck: playerDeck,
      });
  
      console.log('✅ Matchmaking result:', result);
  
      if (result.status === "MATCHED") {
        setStatus('matched');
        setBattleId(result.battleId!);
        setOpponentName(result.opponentUsername!);
        
        setTimeout(() => {
          navigation.replace('Arena', { battleId: result.battleId });
        }, 1500);
      }
  
    } catch (error: any) {
      console.error('❌ Matchmaking error:', error);
      console.error('❌ Error stack:', error.stack);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to join matchmaking');
    }
  };


  const createAIBattle = async () => {
    try {
      if (!user?.id || !deck) return;
  
      const newBattleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
      const playerDeck = [
        ...(deck.starters || []).map((uc: any) => {
          const cardDetails = uc.CardDetails || uc;
          return {
            ...cardDetails,
            id: cardDetails.id || uc.id,
            type: 'PLAYER'
          };
        }),
        ...(deck.bench || []).map((uc: any) => {
          const cardDetails = uc.CardDetails || uc;
          return {
            ...cardDetails,
            id: cardDetails.id || uc.id,
            type: 'PLAYER'
          };
        }),
        ...(deck.strategy || []).map((uc: any) => {
          const cardDetails = uc.CardDetails || uc;
          return {
            ...cardDetails,
            id: cardDetails.id || uc.id,
            type: cardDetails.type || uc.type || 'STRATEGY'
          };
        })
      ];
  
      const opponentDeck = playerDeck.map(card => ({
        ...card,
        id: `opponent_${card.id}`
      }));
  
      await createAIBattleMutation({
        battleId: newBattleId,
        player1Id: user.id,
        player2Id: 'ai_opponent',
        player1Username: user.username || user.display_name || 'Player 1',
        player2Username: 'AI Opponent',
        player1Deck: playerDeck,
        player2Deck: opponentDeck,
      });
  
      setStatus('matched');
      setBattleId(newBattleId);
      setOpponentName('AI Opponent');
  
      setTimeout(() => {
        navigation.replace('Arena', { battleId: newBattleId });
      }, 1500);
  
    } catch (error: any) {
      console.error('AI battle creation error:', error);
      setStatus('error');
      setErrorMessage('Failed to create AI battle');
    }
  };
  const handleCancel = async () => {
    if (user?.id) {
      await leaveQueueMutation({ userId: user.id });
    }
    navigation.goBack();
  };

  // NOW check loading - AFTER all hooks
  if (!user || !deck) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-400 mt-4">Loading...</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center px-6">
        <Text className="text-6xl mb-4">😞</Text>
        <Text className="text-red-500 text-2xl font-bold mb-2">Matchmaking Failed</Text>
        <Text className="text-gray-400 text-center mb-8">{errorMessage}</Text>
        
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-blue-600 px-8 py-4 rounded-xl active:bg-blue-700"
        >
          <Text className="text-white font-bold text-lg">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'matched') {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <Text className="text-6xl mb-4">🎉</Text>
        <Text className="text-green-500 text-3xl font-black mb-2">MATCH FOUND!</Text>
        <Text className="text-gray-400 text-lg mb-2">
          vs {opponentName || 'Opponent'}
        </Text>
        <Text className="text-gray-500 text-sm">Entering arena...</Text>
        {battleId && (
          <Text className="text-gray-600 text-xs mt-4">Battle ID: {battleId}</Text>
        )}
        <ActivityIndicator size="large" color="#10b981" className="mt-6" />
      </View>
    );
  }

  // Searching state
  return (
    <View className="flex-1 bg-gray-900 items-center justify-center px-6">
      <Animated.View 
        style={{ transform: [{ scale: pulseAnim }] }}
        className="mb-8"
      >
        <View className="w-32 h-32 bg-blue-600 rounded-full items-center justify-center">
          <Text className="text-6xl">🔍</Text>
        </View>
      </Animated.View>

      <Text className="text-white text-3xl font-black mb-2">Finding Opponent</Text>
      <Text className="text-gray-400 text-lg mb-8 text-center">
        Searching for {sport} players...
      </Text>

      <View className="flex-row gap-2 mb-8">
        <View className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
        <View className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-100" />
        <View className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200" />
      </View>

      <TouchableOpacity
        onPress={handleCancel}
        className="bg-gray-800 px-8 py-3 rounded-xl border border-gray-700 active:bg-gray-700"
      >
        <Text className="text-gray-400 font-semibold">Cancel</Text>
      </TouchableOpacity>

      <View className="mt-12 px-8">
        <Text className="text-gray-500 text-sm text-center italic">
          💡 No opponent found in 30s? You'll play against AI!
        </Text>
      </View>
    </View>
  );
};

// export const MatchmakingScreen = ({ route, navigation }: any) => {
//   const { sport } = route.params;
//   const { user } = useAuth();
//   const { deck } = useDeck();
  
//   const [status, setStatus] = useState<'searching' | 'matched' | 'expired' | 'error'>('searching');
//   const [battleId, setBattleId] = useState<string | null>(null);
//   const [errorMessage, setErrorMessage] = useState<string>('');
//   const [opponentName, setOpponentName] = useState<string>('');
//   const pulseAnim = new Animated.Value(1);

//   // Convex mutations/queries
//   const joinQueueMutation = useMutation(api.matchmaking.joinQueue);
//   const leaveQueueMutation = useMutation(api.matchmaking.leaveQueue);
//   const markExpiredMutation = useMutation(api.matchmaking.markExpired);
//   const createAIBattleMutation = useMutation(api.battles.createBattle);
  
  
//   // Real-time queue status subscription
//   const queueStatus = useQuery(
//     api.matchmaking.getQueueStatus,
//     user?.id ? { userId: user.id } : "skip"
//   );


//   useEffect(() => {
//     // Pulse animation
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulseAnim, {
//           toValue: 1.2,
//           duration: 1000,
//           useNativeDriver: true,
//         }),
//         Animated.timing(pulseAnim, {
//           toValue: 1,
//           duration: 1000,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();

//     // Start matchmaking
//     if (user?.id && deck) {
//       joinMatchmaking();
//     }

//     // Cleanup on unmount
//     return () => {
//       if (user?.id) {
//         leaveQueueMutation({ userId: user.id });
//       }
//     };
//   }, [user?.id, deck]);


//     // Separate useEffect for matchmaking - only runs when user AND deck are ready
//     useEffect(() => {
//       if (!user?.id || !deck) {
//         console.log('Waiting for user or deck...', { userId: user?.id, hasDeck: !!deck });
//         return;
//       }
  
//       console.log('Starting matchmaking for user:', user.id);
//       joinMatchmaking();
  
//       // Cleanup on unmount
//       return () => {
//         if (user?.id) {
//           leaveQueueMutation({ userId: user.id });
//         }
//       };
//     }, [user?.id, deck]);

//   // Watch queue status changes
//   useEffect(() => {
//     if (!queueStatus || !user?.id) return;

//     if (queueStatus.status === "MATCHED" && queueStatus.battleId) {
//       setStatus('matched');
//       setBattleId(queueStatus.battleId);
      
//       // Navigate to Arena
//       setTimeout(() => {
//         navigation.replace('Arena', { battleId: queueStatus.battleId });
//       }, 1500);
//     } else if (queueStatus.status === "EXPIRED") {
//       markExpiredMutation({ userId: user.id });

//       // Timeout - create AI battle
//       setStatus('expired');
//       createAIBattle();
//     }
//   }, [queueStatus]);

//   const joinMatchmaking = async () => {
//     try {
//       if (!user?.id) {
//         console.log('❌ No user ID');
//         setStatus('error');
//         setErrorMessage('User not authenticated');
//         return;
//       }
  
//       if (!deck) {
//         console.log('❌ No deck');
//         return;
//       }
  
//       console.log('✅ Starting matchmaking with user ID:', user.id);
  
//       // Build deck array
//       const playerDeck = [
//         ...(deck.starters || []).map((uc: any) => ({
//           ...uc.CardDetails,
//           id: uc.CardDetails.id || uc.id,
//           type: 'PLAYER'
//         })),
//         ...(deck.bench || []).map((uc: any) => ({
//           ...uc.CardDetails,
//           id: uc.CardDetails.id || uc.id,
//           type: 'PLAYER'
//         })),
//         ...(deck.strategy || []).map((uc: any) => ({
//           ...uc.CardDetails,
//           id: uc.CardDetails.id || uc.id,
//           type: uc.CardDetails.type
//         }))
//       ];

//       console.log('Joining matchmaking with deck:', playerDeck.length, 'cards');

//       // Join matchmaking queue
//       const result = await joinQueueMutation({
//         userId: user.id,
//         username: user.username || user.display_name || 'Player',
//         sport,
//         deck: playerDeck,
//       });

//       console.log('✅ Joined matchmaking:', result);

//       if (result.status === "MATCHED") {
//         // Instant match!
//         setStatus('matched');
//         setBattleId(result.battleId!);
//         setOpponentName(result.opponentUsername!);
        
//         setTimeout(() => {
//           navigation.replace('Arena', { battleId: result.battleId });
//         }, 1500);
//       }

//     } catch (error: any) {
//       console.error('Matchmaking error:', error);
//       setStatus('error');
//       setErrorMessage(error.message || 'Failed to join matchmaking');
//     }
//   };

//   const createAIBattle = async () => {
//     try {
//       if (!user || !deck) return;

//       const newBattleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

//       const playerDeck = [
//         ...(deck.starters || []).map((uc: any) => ({
//           ...uc.CardDetails,
//           id: uc.CardDetails.id || uc.id,
//           type: 'PLAYER'
//         })),
//         ...(deck.bench || []).map((uc: any) => ({
//           ...uc.CardDetails,
//           id: uc.CardDetails.id || uc.id,
//           type: 'PLAYER'
//         })),
//         ...(deck.strategy || []).map((uc: any) => ({
//           ...uc.CardDetails,
//           id: uc.CardDetails.id || uc.id,
//           type: uc.CardDetails.type
//         }))
//       ];

//       const opponentDeck = playerDeck.map(card => ({
//         ...card,
//         id: `opponent_${card.id}`
//       }));

//       await createAIBattleMutation({
//         battleId: newBattleId,
//         player1Id: user.id,
//         player2Id: 'ai_opponent',
//         player1Username: user.username || user.display_name || 'Player 1',
//         player2Username: 'AI Opponent',
//         player1Deck: playerDeck,
//         player2Deck: opponentDeck,
//       });

//       setStatus('matched');
//       setBattleId(newBattleId);
//       setOpponentName('AI Opponent');

//       setTimeout(() => {
//         navigation.replace('Arena', { battleId: newBattleId });
//       }, 1500);

//     } catch (error: any) {
//       console.error('AI battle creation error:', error);
//       setStatus('error');
//       setErrorMessage('Failed to create AI battle');
//     }
//   };

//   const handleCancel = async () => {
//     if (user) {
//       await leaveQueueMutation({ userId: user.id });
//     }
//     navigation.goBack();
//   };

//   if (status === 'error') {
//     return (
//       <View className="flex-1 bg-gray-900 items-center justify-center px-6">
//         <Text className="text-6xl mb-4">😞</Text>
//         <Text className="text-red-500 text-2xl font-bold mb-2">Matchmaking Failed</Text>
//         <Text className="text-gray-400 text-center mb-8">{errorMessage}</Text>
        
//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           className="bg-blue-600 px-8 py-4 rounded-xl active:bg-blue-700"
//         >
//           <Text className="text-white font-bold text-lg">Try Again</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   if (status === 'matched') {
//     return (
//       <View className="flex-1 bg-gray-900 items-center justify-center">
//         <Text className="text-6xl mb-4">🎉</Text>
//         <Text className="text-green-500 text-3xl font-black mb-2">MATCH FOUND!</Text>
//         <Text className="text-gray-400 text-lg mb-2">
//           vs {opponentName || 'Opponent'}
//         </Text>
//         <Text className="text-gray-500 text-sm">Entering arena...</Text>
//         {battleId && (
//           <Text className="text-gray-600 text-xs mt-4">Battle ID: {battleId}</Text>
//         )}
//         <ActivityIndicator size="large" color="#10b981" className="mt-6" />
//       </View>
//     );
//   }
//   if (!user || !deck) {
//     return (
//       <View className="flex-1 bg-gray-900 items-center justify-center">
//         <ActivityIndicator size="large" color="#3b82f6" />
//         <Text className="text-gray-400 mt-4">Loading your deck...</Text>
//       </View>
//     );
//   }
//   // Searching state
//   return (
//     <View className="flex-1 bg-gray-900 items-center justify-center px-6">
//       <Animated.View 
//         style={{ transform: [{ scale: pulseAnim }] }}
//         className="mb-8"
//       >
//         <View className="w-32 h-32 bg-blue-600 rounded-full items-center justify-center">
//           <Text className="text-6xl">🔍</Text>
//         </View>
//       </Animated.View>

//       <Text className="text-white text-3xl font-black mb-2">Finding Opponent</Text>
//       <Text className="text-gray-400 text-lg mb-8 text-center">
//         Searching for {sport} players...
//       </Text>

//       <View className="flex-row gap-2 mb-8">
//         <View className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
//         <View className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-100" />
//         <View className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200" />
//       </View>

//       <TouchableOpacity
//         onPress={handleCancel}
//         className="bg-gray-800 px-8 py-3 rounded-xl border border-gray-700 active:bg-gray-700"
//       >
//         <Text className="text-gray-400 font-semibold">Cancel</Text>
//       </TouchableOpacity>

//       <View className="mt-12 px-8">
//         <Text className="text-gray-500 text-sm text-center italic">
//           💡 No opponent found in 30s? You'll play against AI!
//         </Text>
//       </View>
//     </View>
//   );
// };


