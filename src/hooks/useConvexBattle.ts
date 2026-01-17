// src/hooks/useConvexBattle.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export const useConvexBattle = (battleId: string) => {
  const { user } = useAuth();

  
  // Real-time subscription to battle state
  const battleState = useQuery(api.battles.getBattle, { battleId });

  // Mutations
  const submitActionMutation = useMutation(api.battles.submitAction);
  const castSpellMutation = useMutation(api.battles.castSpell);
  const setTrapMutation = useMutation(api.battles.setTrap);


  const isMyTurn = battleState?.current_turn === user?.id;

  useEffect(() => {
    if (!battleState || isMyTurn) return;
    
    // If it's AI's turn and they haven't moved recently
    const lastMove = battleState.recent_moves?.[battleState.recent_moves.length - 1];
    const lastMoveTime = lastMove?.timestamp;
    const now = Date.now();
    
    if (!lastMoveTime || (now - lastMoveTime > 2000)) {
      // Trigger AI move - you need to implement this in Convex
      console.log('AI should move now');
    }
  }, [battleState?.current_turn, isMyTurn]);

  const submitAction = async (action: string, cardId: string, position: string) => {
    if (!user || !battleState) return;

    // Find card in deck
    const deck = battleState.player1.user_id === user.id 
      ? battleState.player1.deck 
      : battleState.player2.deck;
    
    const card = deck.find((c: any) => c.id === cardId);
    if (!card) {
      console.error("Card not found");
      return;
    }

    try {
      await submitActionMutation({
        battleId,
        playerId: user.id,
        action,
        cardId,
        cardName: card.player_name || card.name,
        position,
      });
    } catch (error) {
      console.error("Failed to submit action:", error);
      throw error;
    }
  };

  const castSpell = async (cardId: string) => {
    if (!user || !battleState) return;

    // Find spell card in deck
    const deck = battleState.player1.user_id === user.id 
      ? battleState.player1.deck 
      : battleState.player2.deck;
    
    const card = deck.find((c: any) => c.id === cardId);
    if (!card || card.type !== 'SPELL') {
      console.error("Spell card not found");
      return;
    }

    try {
      // Parse effect from card
      const effect = typeof card.effect === 'string' 
        ? JSON.parse(card.effect) 
        : card.effect;

      await castSpellMutation({
        battleId,
        playerId: user.id,
        cardId,
        cardName: card.name,
        statBoosts: effect.stat_boost || {},
        duration: effect.duration || "TURN",
        turnsLeft: effect.duration === "QUARTER" ? 4 : 1,
        instantPoints: effect.instant_points,
      });
    } catch (error) {
      console.error("Failed to cast spell:", error);
      throw error;
    }
  };

  const setTrap = async (cardId: string) => {
    if (!user || !battleState) return;

    // Find trap card in deck
    const deck = battleState.player1.user_id === user.id 
      ? battleState.player1.deck 
      : battleState.player2.deck;
    
    const card = deck.find((c: any) => c.id === cardId);
    if (!card || card.type !== 'TRAP') {
      console.error("Trap card not found");
      return;
    }

    try {
      // Parse effect from card
      const effect = typeof card.effect === 'string' 
        ? JSON.parse(card.effect) 
        : card.effect;

      await setTrapMutation({
        battleId,
        playerId: user.id,
        cardId,
        cardName: card.name,
        trigger: card.trigger,
        effect: {
          statReduction: effect.stat_reduction,
          instantPoints: effect.instant_points,
        },
      });
    } catch (error) {
      console.error("Failed to set trap:", error);
      throw error;
    }
  };

  return {
    battleState,
    submitAction,
    castSpell,
    setTrap,
    isMyTurn: battleState?.current_turn === user?.id,
    connected: battleState !== undefined,
    error: null,
  };
};

