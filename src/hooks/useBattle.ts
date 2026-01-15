// src/hooks/useBattle.ts
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { getToken } from '../lib/storage'; // You need this helper

interface WSMessage {
  type: string;
  payload: any;
  timestamp: string;
}

interface BattleState {
  battle_id: string;
  player1: {
    user_id: string;
    username: string;
    deck: any[];
    hand: any[];
  };
  player2: {
    user_id: string;
    username: string;
    deck: any[];
    hand: any[];
  };
  player1_score: number;
  player2_score: number;
  status: string;
  current_turn: string;
  quarter: number;
  recent_moves: any[];
}

export const useBattle = (battleId: string) => {
  const { user } = useAuth();
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!battleId || !user) return;


    const connectWebSocket = async () => {
        // Get token from storage
        const token = await getToken();
        if (!token) {
          setError('Not authenticated');
          return;
        }

    // Connect to WebSocket
    const ws = new WebSocket(
      `ws://localhost:8080/ws/battle/${battleId}?token=${token}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to battle:', battleId);
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const message: WSMessage = JSON.parse(event.data);
      console.log('Received:', message.type, message.payload);

      switch (message.type) {
        case 'connect':
          console.log('Connection confirmed');
          break;
        
        case 'battle_state':
          setBattleState(message.payload);
          break;
        
        case 'battle_start':
          console.log('Battle starting!');
          break;
        
        case 'action_result':
          // Update state with new action result
          setBattleState(message.payload.new_state);
          break;
        
        case 'turn_change':
          setBattleState(prev => prev ? {
            ...prev,
            current_turn: message.payload.current_turn,
            quarter: message.payload.quarter
          } : null);
          break;
        
        case 'battle_end':
          console.log('Battle ended!', message.payload);
          setBattleState(message.payload.new_state);
          break;
        
        case 'error':
          setError(message.payload.message);
          break;
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('Connection error');
    };

    ws.onclose = () => {
      console.log('Disconnected from battle');
      setConnected(false);
    };
};
connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, [battleId, user]);

  const submitAction = (action: string, cardId: string, position: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to battle');
      return;
    }

    const message = {
      type: 'action',
      payload: {
        action,
        card_id: cardId,
        position
      },
      timestamp: new Date().toISOString()
    };

    wsRef.current.send(JSON.stringify(message));
  };

  return {
    battleState,
    connected,
    error,
    submitAction,
    isMyTurn: battleState?.current_turn === user?.id
  };
};