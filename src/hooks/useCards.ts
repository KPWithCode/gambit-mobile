import useSWR from 'swr';
import api from '../lib/api';
import { Card, CollectionCard } from '../types/api';
import { useMemo } from 'react';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export const useCards = () => {
    const { data, error, isLoading, mutate } = useSWR<Card[]>('/cards', fetcher);

    return {
        cards: data || [],
        isLoading,
        isError: error,
        refetch: mutate,
    };
};

export const useMyCollection = () => {
    const { data, error, isLoading, mutate } = useSWR<CollectionCard[]>(        
        '/users/me/collection',
        fetcher
    );
    // Ensure we always return an array
    // const collection = Array.isArray(data) ? data : [];

    // Convert CollectionCard to Card format for display
    const collection: Card[] = useMemo(() => {
        // data is the array returned by your Go 'return collection, nil'
        if (!data || !Array.isArray(data)) return [];

        return data.map((cc) => ({
            id: cc.card_id,
            player_id: cc.player_id,
            player_name: cc.player_name,
            position: cc.position,
            team: cc.team,
            edition: cc.edition,
            rarity: cc.rarity,
            offense: cc.offense,
            defense: cc.defense,
            speed: cc.speed,
            rebounding: cc.rebounding,
            three_point: cc.three_point,
            abilities: cc.abilities,
            image_url: cc.image_url,
            season_year: cc.season_year,
        }));
    }, [data]);

    return {
        // collection: data || [],
        collection,
        isLoading,
        isError: error,
        refetch: mutate,
    };
};