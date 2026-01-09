// src/screens/PackStoreScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useProfile } from '../hooks/useProfile';
import api from '../lib/api';


interface Pack {
    id: string;
    name: string;
    price: number;
    description: string;
    color: string;
  }

export const PackStoreScreen = ({ navigation }: any) => {
    const { profile, loading: profileLoading, refreshProfile } = useProfile();
    const [packs, setPacks] = useState<Pack[]>([]);
    const [loadingPacks, setLoadingPacks] = useState(true);
    
    useEffect(() => {
        const fetchPacks = async () => {
          try {
            const response = await api.get('/packs/available');
            setPacks(response.data.packs);
          } catch (error) {
            console.error('Failed to load packs:', error);
          } finally {
            setLoadingPacks(false);
          }
        };
        fetchPacks();
      }, []);
      
  const handlePurchase = async (packType: string, price: number) => {
    if (profile && profile.gems < price) {
        Alert.alert('Insufficient Gems', "You don't have enough gems for this pack.");
        return;
      }
      try {
        // Calls your OpenPack handler in Go
        const response = await api.post('/packs/open', { pack_type: packType });
        
        // Refresh gems immediately after purchase
        refreshProfile();
        
        // Navigate to a dedicated opening animation screen (to be built next)
        navigation.navigate('PackOpening', { 
          result: response.data // This contains result.cards_received
        });
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.error || 'Failed to open pack');
      }
    };
    if (profileLoading || loadingPacks) {
        return <ActivityIndicator size="large" className="flex-1" color="#3b82f6" />;
      }

  return (
    <View className="flex-1 bg-background p-4">
      {/* Currency Header */}
      {/* <View className="flex-row justify-end items-center mb-6 bg-card p-3 rounded-xl border border-slate-800">
        <Text className="text-amber-400 font-bold mr-2">💎 {gems}</Text>
      </View>

      <Text className="text-white text-2xl font-bold mb-6">Card Shop</Text> */}
      <View className="p-4 flex-row justify-between items-center bg-card border-b border-slate-800">
        <Text className="text-white text-xl font-bold">Pack Store</Text>
        <View className="bg-slate-800 px-3 py-1 rounded-full flex-row items-center border border-amber-500/30">
          <Text className="text-amber-400 font-bold mr-1">💎</Text>
          <Text className="text-amber-400 font-bold">{profile?.gems || 0}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
      {packs.map((pack) => (
          <TouchableOpacity
            key={pack.id}
            onPress={() => handlePurchase(pack.id, pack.price)}
            className="bg-card mb-4 rounded-2xl border border-slate-700 overflow-hidden shadow-lg"
          >
            <View className="p-5 flex-row items-center">
              {/* Pack Icon/Art Placeholder */}
              <View 
                style={{ backgroundColor: pack.color || '#3b82f6' }}
                className="w-20 h-24 rounded-lg items-center justify-center shadow-inner"
              >
                <Text className="text-4xl">📦</Text>
              </View>

              <View className="ml-4 flex-1">
                <Text className="text-white text-lg font-bold">{pack.name}</Text>
                <Text className="text-slate-400 text-xs mb-2 leading-4">
                  {pack.description}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-amber-400 font-bold mr-1">💎</Text>
                  <Text className="text-amber-400 font-bold">{pack.price}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};