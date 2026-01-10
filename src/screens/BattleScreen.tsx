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
            <View className="bg-slate-900/80 pt-4 pb-8 border-t border-slate-800">
                <View className="px-6 flex-row justify-between items-end mb-4">
                    <View>
                        <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">{selectedSport} Lineup</Text>
                        <Text className="text-white text-xl font-black italic">STARTING FIVE</Text>
                    </View>
                    <TouchableOpacity
                        // 4. Pass sport to Deck Edit so it knows which sport collection to show
                        onPress={() => navigation.navigate('Deck', { sport: selectedSport })}
                    >
                        <Text className="text-primary font-bold">EDIT DECK</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
    {deckLoading ? (
        <Text className="text-white">Loading Lineup...</Text>
    ) : (
        <>
            {deck?.cards?.map((item: any, index: number) => {
                console.log(`Position ${item.deck_position} nested card:`, item.cards);
                // Only render the Card if item.cards actually exists
                if (!item.cards) return null;

                return (
                    <View key={`${item.id}-${index}`} className="w-24 aspect-[0.7] opacity-90 scale-95">
                        <Card card={item.cards} /> 
                    </View>
                );
            })}

            {/* Fill remaining empty slots */}
            {Array.from({ length: Math.max(0, 5 - (deck?.cards?.length || 0)) }).map((_, i) => (
                <TouchableOpacity
                    key={`empty-${i}`}
                    onPress={() => navigation.navigate('Deck', { sport: selectedSport })}
                    className="w-24 aspect-[0.7] rounded-lg border-2 border-dashed border-slate-700 items-center justify-center"
                >
                    <Text className="text-slate-700 text-2xl">+</Text>
                </TouchableOpacity>
            ))}
        </>
    )}
</ScrollView>
            </View>
        </View>
    );
    // return (
    //     <View className="flex-1 bg-background">
    //         {/* 1. TOP BAR - Resources */}
    //         <View className="flex-row justify-between items-center px-6 pt-12 pb-4 bg-slate-900/50">
    //             <TouchableOpacity className="flex-row items-center bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
    //                 <View className="w-6 h-6 rounded-full bg-blue-500 mr-2 items-center justify-center">
    //                     <Text className="text-[10px] text-white">LVL</Text>
    //                 </View>
    //                 <Text className="text-white font-bold">4,012</Text>
    //             </TouchableOpacity>

    //             <View className="flex-row gap-3">
    //                 <View className="flex-row items-center bg-slate-800 px-3 py-1.5 rounded-full border border-amber-500/30">
    //                     <Text className="text-amber-400 mr-1">💎</Text>
    //                     <Text className="text-white font-bold">{profile?.gems || 0}</Text>
    //                 </View>
    //             </View>
    //         </View>

    //         {/* 2. HERO SECTION - Play Button */}
    //         <View className="flex-1 items-center justify-center px-6">
    //             {/* Future: This background image can change based on the sport */}
    //             <View className="w-full aspect-square items-center justify-center">
    //                 {/* Visual Flare */}
    //                 <View className="absolute w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

    //                 <TouchableOpacity
    //                     onPress={() => navigation.navigate('Matchmaking')}
    //                     className="bg-primary w-48 h-48 rounded-full items-center justify-center shadow-2xl border-8 border-white/10"
    //                     style={{ elevation: 20 }}
    //                 >
    //                     <Text className="text-white text-5xl font-black italic tracking-tighter">PLAY</Text>
    //                     <Text className="text-white/60 font-bold mt-1">RANKED</Text>
    //                 </TouchableOpacity>
    //             </View>
    //         </View>

    //         {/* 3. LINEUP TRAY - Current Deck */}
    //         <View className="bg-slate-900/80 pt-4 pb-8 border-t border-slate-800">
    //             <View className="px-6 flex-row justify-between items-end mb-4">
    //                 <View>
    //                     <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest">Current Lineup</Text>
    //                     <Text className="text-white text-xl font-black italic">STARTING FIVE</Text>
    //                 </View>
    //                 <TouchableOpacity onPress={() => navigation.navigate('Deck')}>
    //                     <Text className="text-primary font-bold">EDIT DECK</Text>
    //                 </TouchableOpacity>
    //             </View>

    //             <ScrollView
    //                 horizontal
    //                 showsHorizontalScrollIndicator={false}
    //                 contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
    //             >
    //                 {deck?.cards?.map((card: CardType, index: number) => ( // Added types here
    //                     <View key={`${card.id}-${index}`} className="w-24 aspect-[0.7] opacity-90 scale-95">
    //                         <Card card={card} />
    //                     </View>
    //                 ))}
    //                 {/* Fill empty slots if deck isn't full */}
    //                 {Array.from({ length: Math.max(0, 5 - (deck?.cards?.length || 0)) }).map((_, i) => (
    //                     <TouchableOpacity
    //                         key={`empty-${i}`}
    //                         onPress={() => navigation.navigate('Deck')}
    //                         className="w-24 aspect-[0.7] rounded-lg border-2 border-dashed border-slate-700 items-center justify-center"
    //                     >
    //                         <Text className="text-slate-700 text-2xl">+</Text>
    //                     </TouchableOpacity>
    //                 ))}
    //             </ScrollView>
    //         </View>
    //     </View>
    // );
};