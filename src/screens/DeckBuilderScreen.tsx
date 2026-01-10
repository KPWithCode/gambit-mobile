import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useMyCollection } from '../hooks/useCards';
import { CardGrid } from '../components/cards/CardGrid';
import { Card as CardType } from '../types/api';
import api from '../lib/api';

export const DeckBuilderScreen = () => {
    const { collection, isLoading, refetch } = useMyCollection();
    const [pendingDeck, setPendingDeck] = useState<CardType[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Filter out cards already in the pending deck from the grid if you want, 
    // or just dim them. For now, let's just allow tapping.

    const handleToggleCard = (card: CardType) => {
        const isAlreadyInDeck = pendingDeck.find((c) => c.id === card.id);

        if (isAlreadyInDeck) {
            setPendingDeck(pendingDeck.filter((c) => c.id !== card.id));
        } else {
            if (pendingDeck.length >= 5) {
                Alert.alert('Deck Full', 'Remove a card before adding a new one.');
                return;
            }
            setPendingDeck([...pendingDeck, card]);
        }
    };

    const handleSaveDeck = async () => {
        if (pendingDeck.length !== 5) {
            Alert.alert('Invalid Deck', 'You must select exactly 5 cards.');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                sport: "basketball", // Matches: Sport string `json:"sport"`
                cards: pendingDeck.map((card, index) => ({
                    // Each object here matches: type DeckCard struct
                    card_id: card.id,               // Matches `json:"card_id"`
                    deck_position: index + 1,       // Matches `json:"deck_position"`
                })),
            };

            await api.put('/users/me/deck', payload);
            Alert.alert('Success', 'Deck saved successfully!');
            refetch(); // Refresh collection data to update 'is_in_deck' flags
        } catch (err: any) {
            console.error("DEBUG BACKEND REJECTION:", err.response?.data);
            const errorMessage = err.response?.data?.error || 'Failed to save deck';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsSaving(false);
        }
    };
    const selectedIds = useMemo(() => pendingDeck.map(c => c.id), [pendingDeck]);
    const POSITIONS = ['', 'PG', 'SG', 'SF', 'PF', 'C'];
    return (
        <View className="flex-1 bg-background">
            {/* 1. Collection Area */}
            <View className="flex-1">
                <View className="p-4 border-b border-slate-800">
                    <Text className="text-white text-xl font-bold">Select 5 Cards</Text>
                </View>
                <CardGrid
                    cards={collection}
                    onCardPress={handleToggleCard}
                    selectedIds={selectedIds}
                    loading={isLoading}
                    onRefresh={refetch}
                    emptyMessage="No cards found."
                />
            </View>

            {/* 2. Fixed Deck Tray */}
            <View className="bg-card p-4 border-t border-primary/30 shadow-2xl">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-white font-bold">Your Deck ({pendingDeck.length}/5)</Text>
                    <TouchableOpacity
                        onPress={handleSaveDeck}
                        disabled={isSaving || pendingDeck.length !== 5}
                        className={`px-6 py-2 rounded-full ${pendingDeck.length === 5 ? 'bg-primary' : 'bg-slate-700'}`}
                    >
                        <Text className="text-white font-bold">{isSaving ? 'Saving...' : 'Save Deck'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Deck Slots */}
                <View className="flex-row justify-between">
                    {[1, 2, 3, 4, 5].map((posIndex) => {
                        const card = pendingDeck[posIndex - 1];
                        return (
                            <View key={posIndex} className="w-[18%] aspect-[2/3] relative">
                                <Text className="text-slate-500 text-[10px] text-center mb-1 font-bold">
                                    {POSITIONS[posIndex]}
                                </Text>
                                <TouchableOpacity
                                    // key={index}
                                    onPress={() => card && handleToggleCard(card)}
                                    className={`w-full h-full rounded-lg border-2 border-dashed items-center justify-center overflow-hidden ${card ? 'border-primary bg-primary/20' : 'border-slate-700 bg-slate-800/50'
                                        }`}
                                >
                                    {card ? (
                                        <Text className="text-white text-[10px] text-center font-bold" numberOfLines={2}
                                            adjustsFontSizeToFit>
                                            {card.player_name.split(' ').pop()}
                                        </Text>
                                    ) : (
                                        <Text className="text-slate-700 text-lg">+</Text>
                                    )}
                                </TouchableOpacity>
                                {card && (
                                    <TouchableOpacity
                                        onPress={() => handleToggleCard(card)}
                                        className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center z-30"
                                    >
                                        <Text className="text-white text-[8px] font-bold">✕</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};