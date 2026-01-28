// src/screens/ArenaScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Dimensions,
  StyleSheet,
} from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import ReanimatedAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { useMutation } from 'convex/react';
import { api as convexApi } from '../../convex/_generated/api';
import { useConvexBattle } from '../hooks/useConvexBattle';
import api from '../lib/api';
import { useAuth } from '@/hooks/useAuth';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Canvas, Circle, vec, RadialGradient } from '@shopify/react-native-skia';

type AnimationType = 'slash' | 'fireball' | 'lightning' | 'rocket' | 'bomb' | 'threearrowdown' | 'exclamation' | 'thumbsup' | null;
type CardType = 'PLAYER' | 'SPELL' | 'TRAP';

const COLORS = {
  bg: '#1a0e0a',
  battlefield: '#3d2215',
  fieldZone: '#2a1a10',
  divider: '#b8860b',
  dividerLight: '#d4a44c',
  endTurnActive: '#b8860b',
  endTurnInactive: '#333',
  handArea: '#1c1210',
  hud: '#0d0806',
  text: '#e8d5b0',
  gold: '#f5c542',
  playerCard: '#1a3a5c',
  spellCard: '#3a1a5c',
  trapCard: '#5c1a1a',
  cardBorder: '#b8860b',
  dropZoneGlow: 'rgba(184,134,11,0.3)',
};

const FIELD_DROP_THRESHOLD_Y = -80;

interface PlayedCard {
  card: any;
  cardType: CardType;
  action?: string;
}

const CANDLE_POSITIONS = [
  { x: 40, y: 60 },    // top-left
  { x: -40, y: 60 },   // top-right (negative = offset from right)
  { x: 40, y: -40 },   // bottom-left (negative = offset from bottom)
  { x: -40, y: -40 },  // bottom-right
];

function CandleEffects() {
  const { width, height } = Dimensions.get('window');

  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.5);
  const opacity3 = useSharedValue(0.4);
  const opacity4 = useSharedValue(0.6);

  useEffect(() => {
    opacity1.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
    opacity2.value = withRepeat(withTiming(0.7, { duration: 1100 }), -1, true);
    opacity3.value = withRepeat(withTiming(0.7, { duration: 950 }), -1, true);
    opacity4.value = withRepeat(withTiming(0.7, { duration: 1250 }), -1, true);
  }, []);

  const resolvedPositions = [
    { x: 40, y: 60 },
    { x: width - 40, y: 60 },
    { x: 40, y: height - 40 },
    { x: width - 40, y: height - 40 },
  ];

  const o1 = useDerivedValue(() => opacity1.value);
  const o2 = useDerivedValue(() => opacity2.value);
  const o3 = useDerivedValue(() => opacity3.value);
  const o4 = useDerivedValue(() => opacity4.value);

  const opacities = [o1, o2, o3, o4];

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {resolvedPositions.map((pos, i) => (
        <Circle key={i} cx={pos.x} cy={pos.y} r={60} opacity={opacities[i]}>
          <RadialGradient
            c={vec(pos.x, pos.y)}
            r={60}
            colors={['#ff8c00cc', '#ff6a0066', '#ff450022', '#00000000']}
          />
        </Circle>
      ))}
    </Canvas>
  );
}

export const ArenaScreen = ({ route, navigation }: any) => {
  const { battleId } = route.params;
  const { battleState, connected, error, submitAction, castSpell, setTrap, isMyTurn } = useConvexBattle(battleId);
  const { user } = useAuth();
  const markResultSyncedMutation = useMutation(convexApi.battles.markResultSynced);

  // Game state
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCardType, setSelectedCardType] = useState<CardType | null>(null);
  const [turnTimeLeft, setTurnTimeLeft] = useState(30);
  const hasFinished = useRef(false);

  // Played cards tracking
  const [playedCards, setPlayedCards] = useState<PlayedCard[]>([]);
  const [opponentPlayedCards, setOpponentPlayedCards] = useState<PlayedCard[]>([]);

  // Draw deck + hand management
  const [hand, setHand] = useState<any[]>([]);
  const [drawPile, setDrawPile] = useState<any[]>([]);
  const hasDealt = useRef(false);

  // Drag state
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [draggingCardType, setDraggingCardType] = useState<CardType | null>(null);
  const [isDraggingOverField, setIsDraggingOverField] = useState(false);
  const [showActionOverlay, setShowActionOverlay] = useState(false);
  const [pendingDropCard, setPendingDropCard] = useState<any>(null);
  const [pendingDropCardType, setPendingDropCardType] = useState<CardType | null>(null);

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType>(null);
  const [lastActionCard, setLastActionCard] = useState<any>(null);
  const [showActionFeedback, setShowActionFeedback] = useState(false);
  const [lastActionText, setLastActionText] = useState('');

  // Animation refs
  const attackerScale = useRef(new Animated.Value(1)).current;
  const defenderShake = useRef(new Animated.Value(0)).current;
  const impactOpacity = useRef(new Animated.Value(0)).current;
  const scoreFlash = useRef(new Animated.Value(1)).current;

  // Lock to landscape on mount
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  // Deal initial hand: 3 starters (PLAYER) + 1 spell/trap, rest go to draw pile
  useEffect(() => {
    if (!battleState?.player1?.deck || hasDealt.current) return;
    hasDealt.current = true;

    const deck = [...battleState.player1.deck];
    const players = deck.filter((c: any) => c.type === 'PLAYER');
    const spellsTraps = deck.filter((c: any) => c.type === 'SPELL' || c.type === 'TRAP');

    // Pick 3 random starters
    const shuffledPlayers = players.sort(() => Math.random() - 0.5);
    const starters = shuffledPlayers.slice(0, 3);
    const remainingPlayers = shuffledPlayers.slice(3);

    // Pick 1 random spell/trap
    const shuffledST = spellsTraps.sort(() => Math.random() - 0.5);
    const starterST = shuffledST.slice(0, 1);
    const remainingST = shuffledST.slice(1);

    const startingHand = [...starters, ...starterST];
    const pile = [...remainingPlayers, ...remainingST].sort(() => Math.random() - 0.5);

    setHand(startingHand);
    setDrawPile(pile);
  }, [battleState?.player1?.deck]);

  // Draw 1 card at the start of your turn
  const prevTurn = useRef<string | null>(null);
  useEffect(() => {
    if (!battleState?.current_turn || !isMyTurn) return;
    if (prevTurn.current === battleState.current_turn) return;
    prevTurn.current = battleState.current_turn;

    // Don't draw on the very first turn (already dealt)
  const turnNumber = parseInt(battleState.current_turn, 10);  // Parse to number
  if (turnNumber <= 1) return;
  
    setDrawPile(prev => {
      if (prev.length === 0) return prev;
      const [drawn, ...rest] = prev;
      setHand(h => [...h, drawn]);
      return rest;
    });
  }, [battleState?.current_turn, isMyTurn]);

  // Turn timer
  useEffect(() => {
    if (!isMyTurn || !battleState) return;

    setTurnTimeLeft(30);
    const timer = setInterval(() => {
      setTurnTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const handPlayers = hand.filter((c: any) => c.type === 'PLAYER');
          if (handPlayers.length > 0 && !selectedCardId) {
            const randomCard = handPlayers[Math.floor(Math.random() * handPlayers.length)];
            submitAction('FAST_BREAK', randomCard.id, 'PG');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMyTurn, battleState?.current_turn]);

  // Watch for battle moves and trigger animations
  useEffect(() => {
    if (!battleState?.recent_moves || battleState.recent_moves.length === 0) return;

    const lastMove = battleState.recent_moves[battleState.recent_moves.length - 1];

    if (lastMove && !isAnimating) {
      triggerMoveAnimation(lastMove);

      // Track opponent played cards from moves
      if (lastMove.playerId !== user?.id) {
        const oppDeck = battleState?.player2?.deck || [];
        const card = oppDeck.find((c: any) => c.id === lastMove.cardId);
        if (card) {
          const cardType: CardType = card.type || 'PLAYER';
          setOpponentPlayedCards(prev => [...prev, { card, cardType, action: lastMove.action }]);
        }
      }
    }
  }, [battleState?.recent_moves?.length]);

  // Watch for battle finish
  useEffect(() => {
    if (!battleState || !user) return;

    if (battleState.status === "FINISHED" && !hasFinished.current) {
      hasFinished.current = true;
      syncBattleResult();
    }
  }, [battleState?.status]);

  const syncBattleResult = async () => {
    if (!battleState || !user) return;

    try {
      const winnerId = battleState.player1_score > battleState.player2_score
        ? battleState.player1.user_id
        : battleState.player2.user_id;

      const loserId = winnerId === battleState.player1.user_id
        ? battleState.player2.user_id
        : battleState.player1.user_id;

      await api.post('/battles/finish', {
        battle_id: battleState.battle_id,
        winner_id: winnerId,
        loser_id: loserId,
        player1_score: battleState.player1_score,
        player2_score: battleState.player2_score,
      });

      await markResultSyncedMutation({ battleId: battleState.battle_id });

      setTimeout(() => {
        navigation.replace('BattleResults', {
          winnerId,
          isWinner: winnerId === user.id,
          player1Score: battleState.player1_score,
          player2Score: battleState.player2_score,
          gemsEarned: winnerId === user.id ? 2 : 0,
        });
      }, 2000);

    } catch (err) {
      console.error('Failed to sync battle result:', err);
      setTimeout(() => navigation.goBack(), 2000);
    }
  };

  const triggerMoveAnimation = (move: any) => {
    setIsAnimating(true);

    const playerDeck = battleState?.player1?.deck || [];
    const card = playerDeck.find((c: any) => c.id === move.cardId);

    setLastActionCard(card);
    setShowActionFeedback(true);
    setLastActionText(move.description || '');

    Animated.sequence([
      Animated.timing(attackerScale, {
        toValue: 1.15,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(attackerScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      const animation = getAnimationForAction(move.action, move.success, move.pointsScored);
      setCurrentAnimation(animation);

      Animated.timing(impactOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(impactOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            setCurrentAnimation(null);
            setShowActionFeedback(false);
          });
        }, 800);
      });
    }, 300);

    if (move.success) {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(defenderShake, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(defenderShake, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(defenderShake, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(defenderShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      }, 400);
    }

    if (move.pointsScored > 0) {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(scoreFlash, { toValue: 1.3, duration: 150, useNativeDriver: true }),
          Animated.timing(scoreFlash, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }, 600);
    }

    setTimeout(() => {
      setIsAnimating(false);
      setLastActionCard(null);
    }, 1500);
  };

  const getAnimationForAction = (action: string, success: boolean, pointsScored: number): AnimationType => {
    if (pointsScored >= 3) return 'bomb';
    if (!success) return 'exclamation';
    if (action === 'SPELL_CAST') return 'fireball';
    if (action === 'TRAP_TRIGGERED') return 'threearrowdown';

    const actionMap: Record<string, AnimationType> = {
      'FAST_BREAK': 'lightning',
      'POST_UP': 'fireball',
      'THREE_POINT': 'rocket',
      'ISOLATION': 'slash',
    };

    return actionMap[action] || 'slash';
  };

  const getAnimationSource = (animation: AnimationType) => {
    if (!animation) return null;

    const sources: Record<string, any> = {
      'slash': require('../../assets/animations/slash.json'),
      'fireball': require('../../assets/animations/fireball.json'),
      'lightning': require('../../assets/animations/lightning.json'),
      'rocket': require('../../assets/animations/rocket.json'),
      'bomb': require('../../assets/animations/bomb.json'),
      'threearrowdown': require('../../assets/animations/threearrowdown.json'),
      'exclamation': require('../../assets/animations/exclamation.json'),
      'thumbsup': require('../../assets/animations/thumbsup.json'),
    };

    return sources[animation];
  };

  const handleActionSubmit = (action: string) => {
    if (!pendingDropCard || isAnimating) return;

    if (pendingDropCardType === 'PLAYER') {
      submitAction(action, pendingDropCard.id, 'PG');
    } else if (pendingDropCardType === 'SPELL') {
      castSpell(pendingDropCard.id);
    } else if (pendingDropCardType === 'TRAP') {
      setTrap(pendingDropCard.id);
    }

    setPlayedCards(prev => [...prev, { card: pendingDropCard, cardType: pendingDropCardType!, action }]);
    removeFromHand(pendingDropCard.id);
    setShowActionOverlay(false);
    setPendingDropCard(null);
    setPendingDropCardType(null);
    setSelectedCardId(null);
    setSelectedCardType(null);
  };

  const handleEndTurn = () => {
    if (!isMyTurn || isAnimating) return;

    const handPlayers = hand.filter((c: any) => c.type === 'PLAYER');
    if (handPlayers.length > 0) {
      const randomCard = handPlayers[Math.floor(Math.random() * handPlayers.length)];
      submitAction('FAST_BREAK', randomCard.id, 'PG');
    }
  };

  const removeFromHand = useCallback((cardId: string) => {
    setHand(prev => prev.filter(c => c.id !== cardId));
  }, []);

  const handleCardDrop = useCallback((card: any, cardType: CardType) => {
    if (cardType === 'SPELL') {
      castSpell(card.id);
      setPlayedCards(prev => [...prev, { card, cardType, action: 'CAST_SPELL' }]);
      removeFromHand(card.id);
    } else if (cardType === 'TRAP') {
      setTrap(card.id);
      setPlayedCards(prev => [...prev, { card, cardType, action: 'SET_TRAP' }]);
      removeFromHand(card.id);
    } else {
      setPendingDropCard(card);
      setPendingDropCardType(cardType);
      setShowActionOverlay(true);
    }
    setDraggingCardId(null);
    setDraggingCardType(null);
    setIsDraggingOverField(false);
  }, [castSpell, setTrap, removeFromHand]);

  // Draw a card manually (tap deck)
  const handleDrawCard = useCallback(() => {
    if (!isMyTurn || drawPile.length === 0) return;
    setDrawPile(prev => {
      if (prev.length === 0) return prev;
      const [drawn, ...rest] = prev;
      setHand(h => [...h, drawn]);
      return rest;
    });
  }, [isMyTurn, drawPile]);

  // Loading states
  if (!connected) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.bg }]}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={[styles.loadingText, { color: COLORS.text }]}>Connecting to battle...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.bg }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>!</Text>
        <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Connection Error</Text>
        <Text style={{ color: COLORS.text, textAlign: 'center', marginBottom: 24 }}>{error}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: COLORS.endTurnActive, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 }}
        >
          <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 16 }}>Return to Lobby</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!battleState) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.bg }]}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={[styles.loadingText, { color: COLORS.text }]}>Loading battle...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/images/battlearena2.png')}
        style={styles.root}
        resizeMode="cover"
      >
        {/* Candle flicker overlay */}
        <CandleEffects />

        {/* ===== TOP HUD BAR ===== */}
        <View style={styles.hudBar}>
          <View style={styles.hudInner}>
            {/* Opponent side */}
            <Animated.View style={[styles.hudSide, { transform: [{ translateX: defenderShake }] }]}>
              <View style={styles.heroPortrait}>
                <Text style={styles.heroPortraitText}>OPP</Text>
              </View>
              <Text style={styles.hudScore}>{battleState.player2_score}</Text>
            </Animated.View>

            {/* Center: Quarter + Turn */}
            <View style={styles.hudCenter}>
              <View style={styles.quarterBadge}>
                <Text style={styles.quarterText}>Q{battleState.quarter}</Text>
              </View>
              <Text style={[styles.turnText, { color: isMyTurn ? COLORS.gold : '#887766' }]}>
                {isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN"}
              </Text>
            </View>

            {/* Your side */}
            <Animated.View style={[styles.hudSide, styles.hudRight, { transform: [{ scale: scoreFlash }] }]}>
              <Text style={[styles.hudScore, { color: COLORS.gold }]}>{battleState.player1_score}</Text>
              <View style={[styles.heroPortrait, { borderColor: COLORS.gold }]}>
                <Text style={styles.heroPortraitText}>YOU</Text>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* ===== MAIN BATTLEFIELD ===== */}
        <View style={styles.battlefieldOuter}>

          {/* Center battlefield — transparent so BG shows through */}
          <View style={styles.battleSurface}>

            {/* Opponent's Field */}
            <Animated.View style={[styles.fieldHalf, { transform: [{ scale: attackerScale }] }]}>
              <View style={styles.fieldInner}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fieldCardsRow}>
                  {opponentPlayedCards.length > 0 ? (
                    opponentPlayedCards.map((played, i) => {
                      const isTrap = played.cardType === 'TRAP';
                      return (
                        <View key={`opp_${i}`} style={[styles.fieldCard, {
                          backgroundColor: isTrap ? '#2a1010ee' : (played.cardType === 'SPELL' ? COLORS.spellCard + 'ee' : COLORS.playerCard + 'ee'),
                          borderColor: isTrap ? '#5c1a1a' : COLORS.cardBorder,
                        }]}>
                          {isTrap ? (
                            <Text style={{ color: '#8b3030', fontSize: 24, fontWeight: '900' }}>?</Text>
                          ) : (
                            <>
                              {played.card.image_url && (
                                <Image source={{ uri: played.card.image_url }} style={styles.fieldCardImage} resizeMode="cover" />
                              )}
                              <View style={styles.fieldCardOverlay}>
                                <Text style={styles.fieldCardName} numberOfLines={1}>
                                  {played.card.player_name || played.card.name}
                                </Text>
                              </View>
                              {played.card.offense != null && (
                                <>
                                  <View style={styles.fieldStatLeft}>
                                    <Text style={styles.fieldStatText}>{played.card.offense}</Text>
                                  </View>
                                  <View style={styles.fieldStatRight}>
                                    <Text style={styles.fieldStatText}>{played.card.defense}</Text>
                                  </View>
                                </>
                              )}
                            </>
                          )}
                        </View>
                      );
                    })
                  ) : (
                    null
                    // null <Text style={styles.fieldEmptyText}>Opponent's field</Text>
                  )}
                </ScrollView>
              </View>
            </Animated.View>

            {/* ═══ ORNAMENTAL DIVIDER ═══ */}
            {/* <View style={styles.dividerRow}>
              <View style={styles.dividerWing} />
              <View style={styles.dividerCenter}>
                <View style={styles.dividerGem} />
              </View>
              <View style={styles.dividerWing} />
            </View> */}

            {/* Your Field */}
            <View style={[styles.fieldHalf, {
              backgroundColor: isDraggingOverField ? 'rgba(184,134,11,0.12)' : 'transparent',
            }]}>
              {isDraggingOverField && <View style={styles.dropGlowBorder} />}
              <View style={styles.fieldInner}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fieldCardsRow}>
                  {playedCards.length > 0 ? (
                    playedCards.map((played, i) => (
                      <View key={`my_${i}`} style={[styles.fieldCard, {
                        backgroundColor: played.cardType === 'TRAP' ? COLORS.trapCard + 'ee' :
                          played.cardType === 'SPELL' ? COLORS.spellCard + 'ee' : COLORS.playerCard + 'ee',
                        borderColor: COLORS.cardBorder,
                      }]}>
                        {played.card.image_url && (
                          <Image source={{ uri: played.card.image_url }} style={styles.fieldCardImage} resizeMode="cover" />
                        )}
                        <View style={styles.fieldCardOverlay}>
                          <Text style={styles.fieldCardName} numberOfLines={1}>
                            {played.card.player_name || played.card.name}
                          </Text>
                        </View>
                        {played.card.offense != null && (
                          <>
                            <View style={styles.fieldStatLeft}>
                              <Text style={styles.fieldStatText}>{played.card.offense}</Text>
                            </View>
                            <View style={styles.fieldStatRight}>
                              <Text style={styles.fieldStatText}>{played.card.defense}</Text>
                            </View>
                          </>
                        )}
                      </View>
                    ))
                  ) : (
                    null
                    // <Text style={styles.fieldEmptyText}>
                    //   {isDraggingOverField ? 'Drop here!' : 'Drag cards here'}
                    // </Text>
                  )}
                </ScrollView>
              </View>
            </View>

            {/* Action Feedback */}
            {showActionFeedback && lastActionText ? (
              <View style={styles.actionFeedbackOverlay}>
                <Text style={styles.actionFeedbackText}>{lastActionText}</Text>
              </View>
            ) : null}

            {/* Battle Log */}
            {battleState.recent_moves && battleState.recent_moves.length > 0 && (
              <View style={styles.battleLog}>
                {battleState.recent_moves.slice(-2).map((move: any, i: number) => (
                  <Text key={i} style={{ color: move.success ? '#7cb86a' : '#b86a6a', fontSize: 10 }} numberOfLines={1}>
                    {move.description}
                  </Text>
                ))}
              </View>
            )}

            {/* Lottie Animation Overlay */}
            {currentAnimation && (
              <Animated.View style={[styles.lottieOverlay, { opacity: impactOpacity }]} pointerEvents="none">
                <LottieView
                  source={getAnimationSource(currentAnimation)}
                  autoPlay
                  loop={false}
                  style={{ width: 220, height: 220 }}
                />
              </Animated.View>
            )}
          </View>

          {/* Right: End Turn */}
          <View style={styles.boardEdgeRight}>
            <TouchableOpacity
              style={[styles.endTurnButton, {
                backgroundColor: isMyTurn ? 'rgba(61,42,21,0.9)' : 'rgba(26,21,16,0.9)',
                borderColor: isMyTurn ? COLORS.gold : '#443322',
              }]}
              onPress={handleEndTurn}
              disabled={!isMyTurn || isAnimating}
              activeOpacity={0.7}
            >
              <Text style={[styles.endTurnLabel, { color: isMyTurn ? COLORS.gold : '#554433' }]}>
                END{'\n'}TURN
              </Text>
            </TouchableOpacity>

            {isMyTurn && (
              <View style={[styles.timerBubble, {
                borderColor: turnTimeLeft <= 10 ? '#cc3333' : COLORS.divider,
                backgroundColor: turnTimeLeft <= 10 ? 'rgba(74,21,21,0.9)' : 'rgba(42,26,16,0.9)',
              }]}>
                <Text style={[styles.timerText, { color: turnTimeLeft <= 10 ? '#ff5555' : COLORS.gold }]}>
                  {turnTimeLeft}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ===== BOTTOM: YOUR HAND ===== */}
        <View style={styles.handTray}>
          {/* Draw pile on the left */}
          <TouchableOpacity
            style={[styles.drawPile, {
              borderColor: isMyTurn && drawPile.length > 0 ? COLORS.gold : '#443322',
              opacity: drawPile.length > 0 ? 1 : 0.4,
            }]}
            onPress={handleDrawCard}
            disabled={!isMyTurn || drawPile.length === 0}
            activeOpacity={0.7}
          >
            <Text style={styles.drawPileIcon}>?</Text>
            <Text style={styles.drawPileCount}>{drawPile.length}</Text>
            {isMyTurn && drawPile.length > 0 && (
              <View style={styles.drawPileGlow} />
            )}
          </TouchableOpacity>

          {/* Hand cards — fanned from center */}
          <View style={styles.handCardsArea}>
            {hand.map((card: any, index: number) => {
              const cardType: CardType = card.type || 'PLAYER';
              const totalCards = hand.length;
              // Fan angle: spread cards in an arch
              const midIndex = (totalCards - 1) / 2;
              const angle = (index - midIndex) * 4; // degrees per card
              const yOffset = Math.abs(index - midIndex) * 6; // arch curve

              return (
                <DraggableCard
                  key={`${card.id}_${index}`}
                  card={card}
                  cardType={cardType}
                  isMyTurn={isMyTurn}
                  isAnimating={isAnimating}
                  fanAngle={angle}
                  fanYOffset={yOffset}
                  onDragStart={() => {
                    setDraggingCardId(card.id);
                    setDraggingCardType(cardType);
                  }}
                  onDragOverField={(over: boolean) => setIsDraggingOverField(over)}
                  onDrop={() => handleCardDrop(card, cardType)}
                  onDragEnd={() => {
                    setDraggingCardId(null);
                    setDraggingCardType(null);
                    setIsDraggingOverField(false);
                  }}
                />
              );
            })}
            {hand.length === 0 && (
              <Text style={{ color: '#554433', fontSize: 12 }}>No cards in hand</Text>
            )}
          </View>
        </View>

        {/* ===== ACTION SELECTION OVERLAY ===== */}
        {showActionOverlay && pendingDropCard && (
          <View style={styles.actionOverlay}>
            <View style={styles.actionOverlayInner}>
              <Text style={styles.actionOverlayTitle}>
                {pendingDropCard.player_name || pendingDropCard.name}
              </Text>
              <Text style={styles.actionOverlaySubtitle}>Choose an action</Text>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4a2080' }]} onPress={() => handleActionSubmit('FAST_BREAK')}>
                  <Text style={styles.actionBtnText}>Fast Break</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#804020' }]} onPress={() => handleActionSubmit('POST_UP')}>
                  <Text style={styles.actionBtnText}>Post Up</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#206030' }]} onPress={() => handleActionSubmit('THREE_POINT')}>
                  <Text style={styles.actionBtnText}>3-PT</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={{ marginTop: 10 }} onPress={() => { setShowActionOverlay(false); setPendingDropCard(null); setPendingDropCardType(null); }}>
                <Text style={{ color: '#886644', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ImageBackground>
    </GestureHandlerRootView>
  );
};

// Draggable card component
interface DraggableCardProps {
  card: any;
  cardType: CardType;
  isMyTurn: boolean;
  isAnimating: boolean;
  fanAngle?: number;
  fanYOffset?: number;
  onDragStart: () => void;
  onDragOverField: (over: boolean) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

const RARITY_BORDER_COLORS: Record<string, string> = {
  COMMON: '#9ca3af',
  RARE: '#3b82f6',
  EPIC: '#a855f7',
  LEGENDARY: '#f59e0b',
  MYTHIC: '#ef4444',
};

const RARITY_BG_COLORS: Record<string, string> = {
  COMMON: '#374151',
  RARE: '#1e3a5f',
  EPIC: '#3b1860',
  LEGENDARY: '#5c3d0e',
  MYTHIC: '#5c1a1a',
};

function DraggableCard({ card, cardType, isMyTurn, isAnimating, fanAngle = 0, fanYOffset = 0, onDragStart, onDragOverField, onDrop, onDragEnd }: DraggableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isOverField = useSharedValue(false);

  const rarity = card.rarity || 'COMMON';
  const borderColor = RARITY_BORDER_COLORS[rarity] || RARITY_BORDER_COLORS.COMMON;
  const bgColor = RARITY_BG_COLORS[rarity] || RARITY_BG_COLORS.COMMON;

  const gesture = Gesture.Pan()
    .enabled(isMyTurn && !isAnimating)
    .onStart(() => {
      scale.value = withSpring(1.1);
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      const over = event.translationY < FIELD_DROP_THRESHOLD_Y;
      if (over !== isOverField.value) {
        isOverField.value = over;
        runOnJS(onDragOverField)(over);
      }
    })
    .onEnd((event) => {
      const droppedOnField = event.translationY < FIELD_DROP_THRESHOLD_Y;
      if (droppedOnField) {
        runOnJS(onDrop)();
      } else {
        runOnJS(onDragEnd)();
      }
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const isDragging = scale.value > 1.05;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: isDragging ? translateY.value : translateY.value + fanYOffset },
        { rotate: isDragging ? '0deg' : `${fanAngle}deg` },
        { scale: scale.value },
      ],
      zIndex: isDragging ? 100 : 1,
    };
  });

  const cardName = card.player_name || card.name || 'Card';
  const costValue = card.speed || card.effect_value || 3;
  const isSpellOrTrap = cardType === 'SPELL' || cardType === 'TRAP';

  return (
    <GestureDetector gesture={gesture}>
      <ReanimatedAnimated.View
        style={[
          hsStyles.card,
          {
            borderColor: isMyTurn ? borderColor : '#444',
            backgroundColor: bgColor,
            opacity: isMyTurn ? 1 : 0.5,
          },
          animatedStyle,
        ]}
      >
        {/* Cost Crystal - top left */}
        <View style={[hsStyles.costCrystal, { backgroundColor: '#2563eb', borderColor: '#93c5fd' }]}>
          <Text style={hsStyles.costText}>{costValue}</Text>
        </View>

        {/* Card Image Area */}
        <View style={hsStyles.imageFrame}>
          {card.image_url ? (
            <Image
              source={{ uri: card.image_url }}
              style={hsStyles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[hsStyles.cardImagePlaceholder, {
              backgroundColor: cardType === 'PLAYER' ? '#1a3050' : cardType === 'SPELL' ? '#301050' : '#501020',
            }]}>
              <Text style={{ color: '#666', fontSize: 20 }}>
                {cardType === 'PLAYER' ? '?' : cardType === 'SPELL' ? '?' : '?'}
              </Text>
            </View>
          )}
        </View>

        {/* Name Banner */}
        <View style={[hsStyles.nameBanner, { backgroundColor: '#1a0e0aee' }]}>
          <Text style={hsStyles.nameText} numberOfLines={1}>{cardName}</Text>
        </View>

        {/* Description / Info area */}
        <View style={hsStyles.descArea}>
          {isSpellOrTrap ? (
            <Text style={hsStyles.descText} numberOfLines={2}>
              {card.description || (cardType === 'TRAP' ? 'Trap card' : 'Spell card')}
            </Text>
          ) : (
            <Text style={hsStyles.descText} numberOfLines={1}>
              {card.position || ''} {card.team ? `- ${card.team}` : ''}
            </Text>
          )}
        </View>

        {/* Bottom stat badges - Offense left, Defense right */}
        {cardType === 'PLAYER' ? (
          <>
            <View style={[hsStyles.statBadge, hsStyles.statLeft, { backgroundColor: '#b8860b', borderColor: '#d4a44c' }]}>
              <Text style={hsStyles.statValue}>{card.offense || 0}</Text>
            </View>
            <View style={[hsStyles.statBadge, hsStyles.statRight, { backgroundColor: '#7c3aed', borderColor: '#a78bfa' }]}>
              <Text style={hsStyles.statValue}>{card.defense || 0}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={[hsStyles.typeBadgeBottom, {
              backgroundColor: cardType === 'SPELL' ? '#6622aa' : '#aa2222',
            }]}>
              <Text style={hsStyles.typeBadgeText}>{cardType}</Text>
            </View>
          </>
        )}
      </ReanimatedAnimated.View>
    </GestureDetector>
  );
}

const hsStyles = StyleSheet.create({
  card: {
    width: 72,
    height: 100,
    borderRadius: 7,
    borderWidth: 2,
    overflow: 'visible',
    position: 'relative',
    marginHorizontal: -6, // overlap cards in fan
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 6,
  },
  costCrystal: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
  costText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  imageFrame: {
    height: 46,
    marginTop: 2,
    marginHorizontal: 3,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00000066',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBanner: {
    marginHorizontal: 2,
    marginTop: 1,
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 2,
    alignItems: 'center',
    backgroundColor: '#0d0806cc',
  },
  nameText: {
    color: '#e8d5b0',
    fontSize: 7,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  descArea: {
    flex: 1,
    paddingHorizontal: 3,
    paddingTop: 1,
    justifyContent: 'center',
  },
  descText: {
    color: '#a89070',
    fontSize: 6,
    textAlign: 'center',
    lineHeight: 8,
  },
  statBadge: {
    position: 'absolute',
    bottom: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
  },
  statLeft: {
    left: -5,
  },
  statRight: {
    right: -5,
  },
  statValue: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  typeBadgeBottom: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    left: '15%' as any,
    right: '15%' as any,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  typeBadgeText: {
    color: '#e8d5b0',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
  },

  // ============ HUD BAR ============
  hudBar: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  hudInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hudSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hudRight: {
    justifyContent: 'flex-end',
  },
  heroPortrait: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#886644',
    backgroundColor: '#2a1a10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPortraitText: {
    color: '#e8d5b0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hudScore: {
    fontSize: 24,
    fontWeight: '900',
    color: '#e8d5b0',
  },
  hudCenter: {
    alignItems: 'center',
    flex: 1,
  },
  quarterBadge: {
    backgroundColor: '#b8860b',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d4a44c',
    shadowColor: '#f5c542',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  quarterText: {
    color: '#1a0e0a',
    fontWeight: '900',
    fontSize: 15,
  },
  turnText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 1.5,
  },

  // ============ BATTLEFIELD ============
  battlefieldOuter: {
    flex: 1,
    flexDirection: 'row',
  },

  // Center battlefield surface — transparent to show BG image
  battleSurface: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },

  fieldHalf: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  fieldInner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  fieldCardsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  fieldCard: {
    width: 64,
    height: 82,
    borderRadius: 7,
    borderWidth: 2,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 6,
  },
  fieldCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 5,
  },
  fieldCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  fieldCardName: {
    color: '#e8d5b0',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  fieldStatLeft: {
    position: 'absolute',
    bottom: -5,
    left: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#b8860b',
    borderWidth: 1.5,
    borderColor: '#d4a44c',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fieldStatRight: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7c3aed',
    borderWidth: 1.5,
    borderColor: '#a78bfa',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fieldStatText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  fieldEmptyText: {
    color: 'rgba(180,150,110,0.5)',
    fontSize: 13,
    fontStyle: 'italic',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dropGlowBorder: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d4a44c88',
    zIndex: 0,
  },

  // // Ornamental divider
  // dividerRow: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   height: 12,
  //   zIndex: 2,
  //   paddingHorizontal: 12,
  // },
  // dividerWing: {
  //   flex: 1,
  //   height: 2,
  //   backgroundColor: '#b8860b',
  //   shadowColor: '#f5c542',
  //   shadowOffset: { width: 0, height: 0 },
  //   shadowOpacity: 0.6,
  //   shadowRadius: 3,
  // },
  // dividerCenter: {
  //   width: 20,
  //   height: 20,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   marginHorizontal: 6,
  // },
  // dividerGem: {
  //   width: 10,
  //   height: 10,
  //   backgroundColor: '#d4a44c',
  //   borderRadius: 2,
  //   transform: [{ rotate: '45deg' }],
  //   shadowColor: '#f5c542',
  //   shadowOffset: { width: 0, height: 0 },
  //   shadowOpacity: 0.8,
  //   shadowRadius: 5,
  // },

  // Feedback & log
  actionFeedbackOverlay: {
    position: 'absolute',
    top: '38%' as any,
    alignSelf: 'center',
    backgroundColor: 'rgba(26,14,10,0.92)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#b8860b',
    zIndex: 40,
    shadowColor: '#f5c542',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  actionFeedbackText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    color: '#f5c542',
  },
  battleLog: {
    position: 'absolute',
    bottom: 6,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(13,8,6,0.8)',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#3d221544',
  },
  lottieOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },

  // Right edge (end turn)
  boardEdgeRight: {
    width: 70,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  endTurnButton: {
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f5c542',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  endTurnLabel: {
    fontWeight: '900',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  timerBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontWeight: '900',
    fontSize: 14,
  },

  // ============ HAND TRAY ============
  handTray: {
    height: 110,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'visible',
    position: 'relative',
  },
  drawPile: {
    width: 52,
    height: 72,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: 'rgba(26,14,10,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 12,
    bottom: 10,
    zIndex: 10,
  },
  drawPileIcon: {
    color: '#886644',
    fontSize: 20,
    fontWeight: '900',
  },
  drawPileCount: {
    color: '#e8d5b0',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  drawPileGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c54255',
  },
  handCardsArea: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 4,
    overflow: 'visible',
  },

  // ============ ACTION OVERLAY ============
  actionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  actionOverlayInner: {
    backgroundColor: '#2a1a10',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#b8860b',
    alignItems: 'center',
    minWidth: 300,
    shadowColor: '#f5c542',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  actionOverlayTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
    color: '#e8d5b0',
  },
  actionOverlaySubtitle: {
    color: '#886644',
    fontSize: 12,
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  actionBtnText: {
    color: '#e8d5b0',
    fontWeight: '800',
    fontSize: 14,
  },
});
