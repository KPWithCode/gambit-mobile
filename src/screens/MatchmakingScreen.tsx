// src/screens/MatchmakingScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import api from '../lib/api';

export const MatchmakingScreen = ({ route, navigation }: any) => {
  const { sport } = route.params;
  const [status, setStatus] = useState<'searching' | 'matched' | 'error'>('searching');
  const [battleId, setBattleId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Pulse animation
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

    // Start matchmaking
    findMatch();
  }, []);

  const findMatch = async () => {
    try {
      const response = await api.post('/battles/matchmaking', { sport });
      const { battle_id, status: matchStatus, message } = response.data;

      if (matchStatus === 'MATCHED') {
        // Opponent found immediately
        setStatus('matched');
        setBattleId(battle_id);
        
        // Navigate to Arena after 1.5 seconds
        setTimeout(() => {
          navigation.replace('Arena', { battleId: battle_id });
        }, 1500);
      } else if (matchStatus === 'WAITING') {
        // No opponent yet, poll for updates
        setBattleId(battle_id);
        pollForOpponent(battle_id);
      }
    } catch (error: any) {
      console.error('Matchmaking error:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.error || 'Failed to find match');
    }
  };

  const pollForOpponent = async (battleId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get(`/battles/${battleId}`);
        const battle = response.data;

        // Check if battle has started (player2 joined)
        if (battle.status === 'IN_PROGRESS') {
          clearInterval(pollInterval);
          setStatus('matched');
          
          // Navigate to Arena
          setTimeout(() => {
            navigation.replace('Arena', { battleId });
          }, 1500);
        }
      } catch (error) {
        console.error('Poll error:', error);
        clearInterval(pollInterval);
        setStatus('error');
        setErrorMessage('Lost connection to matchmaking');
      }
    }, 2000); // Poll every 2 seconds

    // Timeout after 60 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
      if (status === 'searching') {
        setStatus('error');
        setErrorMessage('No opponent found. Try again!');
      }
    }, 60000);
  };

  const handleCancel = () => {
    // TODO: Call API to cancel matchmaking and delete waiting battle
    navigation.goBack();
  };

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
        <Text className="text-gray-400 text-lg">Entering arena...</Text>
        <ActivityIndicator size="large" color="#10b981" className="mt-6" />
      </View>
    );
  }

  // Searching state
  return (
    <View className="flex-1 bg-gray-900 items-center justify-center px-6">
      {/* Animated Pulse Circle */}
      <Animated.View 
        style={{ transform: [{ scale: pulseAnim }] }}
        className="mb-8"
      >
        <View className="w-32 h-32 bg-blue-600 rounded-full items-center justify-center">
          <Text className="text-6xl">🔍</Text>
        </View>
      </Animated.View>

      {/* Status Text */}
      <Text className="text-white text-3xl font-black mb-2">Finding Opponent</Text>
      <Text className="text-gray-400 text-lg mb-8 text-center">
        Searching for a {sport} player...
      </Text>

      {/* Loading Dots */}
      <View className="flex-row gap-2 mb-8">
        <View className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
        <View className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-100" />
        <View className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200" />
      </View>

      {/* Battle ID (for debugging) */}
      {battleId && (
        <Text className="text-gray-600 text-xs mb-8">Battle ID: {battleId}</Text>
      )}

      {/* Cancel Button */}
      <TouchableOpacity
        onPress={handleCancel}
        className="bg-gray-800 px-8 py-3 rounded-xl border border-gray-700 active:bg-gray-700"
      >
        <Text className="text-gray-400 font-semibold">Cancel</Text>
      </TouchableOpacity>

      {/* Tips */}
      <View className="mt-12 px-8">
        <Text className="text-gray-500 text-sm text-center italic">
          💡 Tip: Make sure your deck has 5 cards before battling!
        </Text>
      </View>
    </View>
  );
};