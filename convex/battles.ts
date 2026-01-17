// convex/battles.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ========================================
// MUTATIONS (Write Operations)
// ========================================

// Create a new battle
export const createBattle = mutation({
  args: {
    battleId: v.string(),
    player1Id: v.string(),
    player2Id: v.string(),
    player1Username: v.string(),
    player2Username: v.string(),
    player1Deck: v.array(v.any()),
    player2Deck: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("battles", {
      battleId: args.battleId,
      player1Id: args.player1Id,
      player2Id: args.player2Id,
      player1Username: args.player1Username,
      player2Username: args.player2Username,
      player1Score: 0,
      player2Score: 0,
      quarter: 1,
      currentTurn: args.player1Id, // Player 1 starts
      status: "IN_PROGRESS",
      player1Deck: args.player1Deck,
      player2Deck: args.player2Deck,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, battleId: args.battleId };
  },
});

// Submit a player action
export const submitAction = mutation({
  args: {
    battleId: v.string(),
    playerId: v.string(),
    action: v.string(),
    cardId: v.string(),
    cardName: v.string(),
    position: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get current battle
    const battle = await ctx.db
      .query("battles")
      .withIndex("by_battle_id", (q) => q.eq("battleId", args.battleId))
      .first();

    if (!battle) throw new Error("Battle not found");
    if (battle.currentTurn !== args.playerId) {
      throw new Error("Not your turn");
    }

    // 2. Get active effects for this player
    const effects = await ctx.db
      .query("activeEffects")
      .withIndex("by_battle", (q) => q.eq("battleId", args.battleId))
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .collect();

    // 3. Calculate stat boosts
    let offenseBoost = 0;
    let threePointBoost = 0;
    for (const effect of effects) {
      if (effect.turnsLeft > 0) {
        offenseBoost += effect.statBoosts.offense || 0;
        threePointBoost += effect.statBoosts.threePoint || 0;
      }
    }

    // 4. Get card stats from deck
    const deck = args.playerId === battle.player1Id 
      ? battle.player1Deck 
      : battle.player2Deck;
    
    const card = deck.find((c: any) => c.id === args.cardId);
    if (!card) throw new Error("Card not found in deck");

    // 5. Calculate success (simplified - you can make this more complex)
    const baseOffense = card.offense + offenseBoost;
    const baseThreePoint = card.three_point + threePointBoost;
    
    let successChance = 0.5;
    if (args.action === "THREE_POINT") {
      successChance = baseThreePoint / 100;
    } else if (args.action === "FAST_BREAK") {
      successChance = card.speed / 100;
    } else if (args.action === "POST_UP") {
      successChance = baseOffense / 100;
    }

    const success = Math.random() < successChance;
    let pointsScored = 0;

    if (success) {
      if (args.action === "THREE_POINT") pointsScored = 3;
      else if (args.action === "FAST_BREAK") pointsScored = 2;
      else if (args.action === "POST_UP") pointsScored = 2;
    }

    // 6. Check for opponent traps
    const traps = await ctx.db
      .query("setTraps")
      .withIndex("by_battle", (q) => q.eq("battleId", args.battleId))
      .filter((q) => 
        q.and(
          q.neq(q.field("playerId"), args.playerId),
          q.eq(q.field("triggered"), false)
        )
      )
      .collect();

    for (const trap of traps) {
      if (trap.trigger === "ON_ATTACK" && success) {
        // Reduce points scored
        const reduction = trap.effect.statReduction?.offense || 0;
        pointsScored = Math.max(0, pointsScored - Math.floor(reduction / 10));
        
        // Mark trap as triggered
        await ctx.db.patch(trap._id, { triggered: true });

        // Log trap trigger
        await ctx.db.insert("battleMoves", {
          battleId: args.battleId,
          turn: battle.quarter,
          playerId: trap.playerId,
          playerUsername: trap.playerId === battle.player1Id 
            ? battle.player1Username 
            : battle.player2Username,
          action: "TRAP_TRIGGERED",
          cardId: trap.cardId,
          cardName: trap.cardName,
          success: true,
          pointsScored: 0,
          description: `${trap.cardName} was triggered!`,
          timestamp: Date.now(),
        });
      }
    }

    // 7. Update battle state
    const newScore = args.playerId === battle.player1Id
      ? battle.player1Score + pointsScored
      : battle.player2Score + pointsScored;

    const nextTurn = args.playerId === battle.player1Id 
      ? battle.player2Id 
      : battle.player1Id;


     // Calculate final scores
     const player1FinalScore = args.playerId === battle.player1Id ? newScore : battle.player1Score;
     const player2FinalScore = args.playerId === battle.player2Id ? newScore : battle.player2Score;
     
     // Check if battle should end (score >= 100 OR quarter >= 4)
     const shouldEndBattle = player1FinalScore >= 100 || player2FinalScore >= 100 || battle.quarter >= 4;
     const newStatus = shouldEndBattle ? "FINISHED" : battle.status;

     await ctx.db.patch(battle._id, {
        player1Score: player1FinalScore,
        player2Score: player2FinalScore,
        currentTurn: nextTurn,
        status: newStatus,
        updatedAt: Date.now(),
      });

      if (shouldEndBattle && battle.status !== "FINISHED") {
        const winnerId = player1FinalScore > player2FinalScore 
          ? battle.player1Id 
          : battle.player2Id;
        
        const loserId = winnerId === battle.player1Id 
          ? battle.player2Id 
          : battle.player1Id;
  
        // Store result for syncing to Supabase
        await ctx.db.insert("battleResults", {
          battleId: args.battleId,
          winnerId,
          loserId,
          player1Id: battle.player1Id,
          player2Id: battle.player2Id,
          player1Score: player1FinalScore,
          player2Score: player2FinalScore,
          sport: "basketball", // TODO: Get from battle data when you add sport field
          finishedAt: Date.now(),
          syncedToSupabase: false,
        });
      }


    // 8. Log the move
    await ctx.db.insert("battleMoves", {
      battleId: args.battleId,
      turn: battle.quarter,
      playerId: args.playerId,
      playerUsername: args.playerId === battle.player1Id 
        ? battle.player1Username 
        : battle.player2Username,
      action: args.action,
      cardId: args.cardId,
      cardName: args.cardName,
      success,
      pointsScored,
      description: success 
        ? `${args.cardName} scored ${pointsScored} points!`
        : `${args.cardName} missed the shot`,
      timestamp: Date.now(),
    });

    // 9. Decrement effect turns
    for (const effect of effects) {
      if (effect.turnsLeft > 0) {
        await ctx.db.patch(effect._id, {
          turnsLeft: effect.turnsLeft - 1,
        });
      }
    }

    return { 
      success: true, 
      pointsScored,
      actionSuccess: success 
    };
  },
});

// Query to get unsynced battle results
export const getUnsyncedResults = query({
    args: {},
    handler: async (ctx) => {
      return await ctx.db
        .query("battleResults")
        .withIndex("by_synced", (q) => q.eq("syncedToSupabase", false))
        .collect();
    },
  });

  export const markResultSynced = mutation({
    args: { battleId: v.string() },
    handler: async (ctx, args) => {
      const result = await ctx.db
        .query("battleResults")
        .withIndex("by_battle", (q) => q.eq("battleId", args.battleId))
        .first();
  
      if (result) {
        await ctx.db.patch(result._id, { syncedToSupabase: true });
      }
  
      return { success: true };
    },
  });

// Cast a spell
export const castSpell = mutation({
  args: {
    battleId: v.string(),
    playerId: v.string(),
    cardId: v.string(),
    cardName: v.string(),
    statBoosts: v.object({
      offense: v.optional(v.number()),
      defense: v.optional(v.number()),
      speed: v.optional(v.number()),
      threePoint: v.optional(v.number()),
    }),
    duration: v.string(),
    turnsLeft: v.number(),
    instantPoints: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Get battle
    const battle = await ctx.db
      .query("battles")
      .withIndex("by_battle_id", (q) => q.eq("battleId", args.battleId))
      .first();

    if (!battle) throw new Error("Battle not found");
    if (battle.currentTurn !== args.playerId) {
      throw new Error("Not your turn");
    }

    // 2. Handle instant points
    let pointsScored = 0;
    if (args.instantPoints) {
      pointsScored = args.instantPoints;
      
      const newScore = args.playerId === battle.player1Id
        ? battle.player1Score + pointsScored
        : battle.player2Score + pointsScored;

      await ctx.db.patch(battle._id, {
        player1Score: args.playerId === battle.player1Id 
          ? newScore 
          : battle.player1Score,
        player2Score: args.playerId === battle.player2Id 
          ? newScore 
          : battle.player2Score,
        updatedAt: Date.now(),
      });
    }

    // 3. Add active effect (if not instant)
    if (args.duration !== "INSTANT") {
      await ctx.db.insert("activeEffects", {
        battleId: args.battleId,
        effectId: `effect_${Date.now()}`,
        cardId: args.cardId,
        cardName: args.cardName,
        playerId: args.playerId,
        targetPlayer: args.playerId,
        statBoosts: args.statBoosts,
        duration: args.duration,
        turnsLeft: args.turnsLeft,
        createdTurn: battle.quarter,
      });
    }

    // 4. Log spell cast
    await ctx.db.insert("battleMoves", {
      battleId: args.battleId,
      turn: battle.quarter,
      playerId: args.playerId,
      playerUsername: args.playerId === battle.player1Id 
        ? battle.player1Username 
        : battle.player2Username,
      action: "SPELL_CAST",
      cardId: args.cardId,
      cardName: args.cardName,
      success: true,
      pointsScored,
      description: `${args.cardName} was cast!`,
      timestamp: Date.now(),
    });

    return { success: true, pointsScored };
  },
});

// Set a trap
export const setTrap = mutation({
  args: {
    battleId: v.string(),
    playerId: v.string(),
    cardId: v.string(),
    cardName: v.string(),
    trigger: v.string(),
    effect: v.object({
      statReduction: v.optional(v.object({
        offense: v.optional(v.number()),
        defense: v.optional(v.number()),
        speed: v.optional(v.number()),
      })),
      instantPoints: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    // 1. Get battle
    const battle = await ctx.db
      .query("battles")
      .withIndex("by_battle_id", (q) => q.eq("battleId", args.battleId))
      .first();

    if (!battle) throw new Error("Battle not found");
    if (battle.currentTurn !== args.playerId) {
      throw new Error("Not your turn");
    }

    // 2. Set trap
    await ctx.db.insert("setTraps", {
      battleId: args.battleId,
      trapId: `trap_${Date.now()}`,
      cardId: args.cardId,
      cardName: args.cardName,
      playerId: args.playerId,
      trigger: args.trigger,
      effect: args.effect,
      setOnTurn: battle.quarter,
      triggered: false,
    });

    // 3. Log trap set
    await ctx.db.insert("battleMoves", {
      battleId: args.battleId,
      turn: battle.quarter,
      playerId: args.playerId,
      playerUsername: args.playerId === battle.player1Id 
        ? battle.player1Username 
        : battle.player2Username,
      action: "TRAP_SET",
      cardId: args.cardId,
      cardName: args.cardName,
      success: true,
      pointsScored: 0,
      description: `${args.cardName} was set!`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// ========================================
// QUERIES (Read Operations - Real-time!)
// ========================================
// Get battle state (auto-updates!)
export const getBattle = query({
    args: { battleId: v.string() },
    handler: async (ctx, args) => {
      // 1. Get battle
      const battle = await ctx.db
        .query("battles")
        .withIndex("by_battle_id", (q) => q.eq("battleId", args.battleId))
        .first();
  
      if (!battle) return null;
  
      // 2. Get recent moves
      const moves = await ctx.db
        .query("battleMoves")
        .withIndex("by_battle", (q) => q.eq("battleId", args.battleId))
        .order("desc")
        .take(20);
  
      // 3. Get active effects
      const effects = await ctx.db
        .query("activeEffects")
        .withIndex("by_battle", (q) => q.eq("battleId", args.battleId))
        .filter((q) => q.gt(q.field("turnsLeft"), 0))
        .collect();
  
      // 4. Get active traps
      const traps = await ctx.db
        .query("setTraps")
        .withIndex("by_battle", (q) => q.eq("battleId", args.battleId))
        .filter((q) => q.eq(q.field("triggered"), false))
        .collect();
  
      // 5. Return complete state (matching ArenaScreen expectations)
      return {
        battle_id: battle.battleId,
        player1: {
          user_id: battle.player1Id,
          username: battle.player1Username,
          deck: battle.player1Deck,
        },
        player2: {
          user_id: battle.player2Id,
          username: battle.player2Username,
          deck: battle.player2Deck,
        },
        player1_score: battle.player1Score,
        player2_score: battle.player2Score,
        quarter: battle.quarter,
        current_turn: battle.currentTurn,
        status: battle.status,
        recent_moves: moves,
        active_effects: effects,
        set_traps: traps,
      };
    },
  });