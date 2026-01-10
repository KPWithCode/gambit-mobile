import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useDeck } from '../hooks/useDeck'; // Assuming you have a hook to fetch the active deck
import { Card } from '../components/cards/Card';
import { Card as CardType } from '../types/api';

export const BattleScreen = ({ navigation }: any) => {
    const { profile } = useProfile();
    const [selectedSport, setSelectedSport] = useState('basketball');
    const { deck, loading: deckLoading } = useDeck(selectedSport); // This should fetch the 5-card active lineup

    return (
        <View className="flex-1 bg-background">
            {/* 1. TOP BAR - Resources (Keep as is) */}

            {/* 2. HERO SECTION - Play Button */}
            <View className="flex-1 items-center justify-center px-6">
                <View className="w-full aspect-square items-center justify-center">
                    <View className="absolute w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

                    <TouchableOpacity
                        // 3. Pass the sport to Matchmaking so the POST body is correct
                        onPress={() => navigation.navigate('Matchmaking', { sport: selectedSport })}
                        className="bg-primary w-48 h-48 rounded-full items-center justify-center shadow-2xl border-8 border-white/10"
                        style={{ elevation: 20 }}
                    >
                        <Text className="text-white text-5xl font-black italic tracking-tighter">PLAY</Text>
                        <Text className="text-white/30 text-xs font-bold uppercase tracking-widest">{selectedSport}</Text>
                    </TouchableOpacity>

                    {/* OPTIONAL: Sport Switcher for testing */}
                    <View className="flex-row mt-8 bg-slate-800 rounded-full p-1">
                        {['basketball', 'football'].map((s) => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => setSelectedSport(s)}
                                className={`px-4 py-2 rounded-full ${selectedSport === s ? 'bg-primary' : ''}`}
                            >
                                <Text className="text-white text-xs font-bold uppercase">{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* 3. LINEUP TRAY - Current Deck */}
<View className="bg-slate-900/80 pt-6 pb-12 border-t border-slate-800">
    <View className="px-6 flex-row justify-between items-center mb-6">
        <View>
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px]">
                {selectedSport} Lineup
            </Text>
            <Text className="text-white text-2xl font-black italic">STARTING FIVE</Text>
        </View>
        <TouchableOpacity
            onPress={() => navigation.navigate('Deck', { sport: selectedSport })}
            className="bg-primary/20 px-4 py-2 rounded-full border border-primary/40"
        >
            <Text className="text-primary text-xs font-black uppercase">Edit Deck</Text>
        </TouchableOpacity>
    </View>

    <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        // Changed gap to 8 for tighter spacing and increased padding
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
    >
        {deckLoading ? (
            <Text className="text-white opacity-50">Fetching lineup...</Text>
        ) : (
            <>
                {deck?.cards?.map((item: any, index: number) => {
                    if (!item.cards) return null;
                    return (
                        <View 
                            key={`${item.id}-${index}`} 
                            // INCREASED SIZE: w-32 (128px) makes them significantly taller and wider
                            className="w-32 aspect-[0.7]"
                        >
                            <Card card={item.cards} /> 
                        </View>
                    );
                })}

                {/* Fill remaining empty slots with the same w-32 size */}
                {Array.from({ length: Math.max(0, 5 - (deck?.cards?.length || 0)) }).map((_, i) => (
                    <TouchableOpacity
                        key={`empty-${i}`}
                        onPress={() => navigation.navigate('Deck', { sport: selectedSport })}
                        className="w-32 aspect-[0.7] rounded-2xl border-2 border-dashed border-slate-800 items-center justify-center bg-slate-950/50"
                    >
                        <Text className="text-slate-800 text-3xl">+</Text>
                    </TouchableOpacity>
                ))}
            </>
        )}
    </ScrollView>
</View>
        </View>
    );
};