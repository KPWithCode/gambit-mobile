import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useProfile } from '../hooks/useProfile';

export const BattleResultsScreen = ({ route, navigation }: any) => {
  const { 
    isWinner, 
    player1Score, 
    player2Score, 
    gemsEarned, 
    winStreak,
    streakBonus 
  } = route.params;
  
  const { refreshProfile } = useProfile(); // Refresh profile to show new gems

  const handleContinue = () => {
    refreshProfile(); // Update gems/streak in UI
    navigation.navigate('Home');
  };

  return (
    <View className="flex-1 bg-gray-900 items-center justify-center px-6">
      {/* Result */}
      <Text className="text-6xl mb-4">{isWinner ? '🏆' : '😔'}</Text>
      <Text className={`text-4xl font-black mb-2 ${isWinner ? 'text-green-500' : 'text-red-500'}`}>
        {isWinner ? 'VICTORY!' : 'DEFEAT'}
      </Text>
      
      {/* Score */}
      <View className="bg-gray-800 rounded-xl p-6 mb-6 w-full">
        <Text className="text-white text-center text-2xl font-bold">
          {player1Score} - {player2Score}
        </Text>
      </View>

      {/* Rewards */}
      {isWinner && (
        <View className="bg-green-900/30 border border-green-500 rounded-xl p-6 mb-6 w-full">
          <Text className="text-green-400 text-lg font-bold text-center mb-3">
            💎 Rewards Earned
          </Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-300">Base Reward:</Text>
            <Text className="text-white font-bold">+2 gems</Text>
          </View>

          {streakBonus > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-yellow-400">🔥 Streak Bonus:</Text>
              <Text className="text-yellow-400 font-bold">+{streakBonus} gems</Text>
            </View>
          )}

          <View className="border-t border-green-700 mt-3 pt-3 flex-row justify-between">
            <Text className="text-white font-bold text-lg">Total:</Text>
            <Text className="text-green-400 font-black text-xl">+{gemsEarned} gems</Text>
          </View>
        </View>
      )}

      {/* Win Streak */}
      {isWinner && winStreak > 0 && (
  <View className="bg-orange-900/30 border border-orange-500 rounded-xl p-4 mb-6 w-full">
    <Text className="text-orange-400 text-center font-bold">
      🔥 {winStreak} Win Streak!
    </Text>
    
    {/* Milestone hints */}
    {winStreak === 1 && (
      <Text className="text-gray-400 text-center text-xs mt-1">
        2 more wins to unlock streak bonus!
      </Text>
    )}
    {winStreak === 2 && (
      <Text className="text-gray-400 text-center text-xs mt-1">
        1 more win for +2 bonus! 🔥
      </Text>
    )}
    {winStreak === 3 && (
      <Text className="text-yellow-400 text-center text-xs mt-1">
        Streak bonus active! 2 more for next tier 🔥🔥
      </Text>
    )}
    {winStreak === 4 && (
      <Text className="text-gray-400 text-center text-xs mt-1">
        1 more win for +4 bonus! 🔥🔥
      </Text>
    )}
    {winStreak >= 5 && winStreak < 10 && (
      <Text className="text-yellow-400 text-center text-xs mt-1">
        {10 - winStreak} more wins for +10 bonus! 🔥🔥🔥
      </Text>
    )}
    {winStreak >= 10 && winStreak < 20 && (
      <Text className="text-yellow-400 text-center text-xs mt-1">
        {20 - winStreak} more wins for +25 bonus! 🔥🔥🔥🔥
      </Text>
    )}
    {winStreak >= 20 && (
      <Text className="text-orange-400 text-center text-xs mt-1 font-bold">
        MAXIMUM STREAK! You're unstoppable! 🔥🔥🔥🔥
      </Text>
    )}
  </View>
)}

      {/* Loss Message */}
      {!isWinner && (
        <View className="bg-red-900/30 border border-red-500 rounded-xl p-4 mb-6 w-full">
          <Text className="text-red-400 text-center">
            Your win streak was reset. Try again!
          </Text>
        </View>
      )}

      {/* Continue Button */}
      <TouchableOpacity
        onPress={handleContinue}
        className="bg-blue-600 px-12 py-4 rounded-xl active:bg-blue-700 w-full"
      >
        <Text className="text-white font-bold text-center text-lg">
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
};