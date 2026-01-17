import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Battles table
  battles: defineTable({
    battleId: v.string(),
    player1Id: v.string(),
    player2Id: v.string(),
    player1Username: v.string(),
    player2Username: v.string(),
    player1Score: v.number(),
    player2Score: v.number(),
    player1Deck: v.array(v.any()),
    player2Deck: v.array(v.any()),
    quarter: v.number(),
    currentTurn: v.string(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_battle_id", ["battleId"])
    .index("by_status", ["status"]),

  // Battle moves
  battleMoves: defineTable({
    battleId: v.string(),
    turn: v.number(),
    playerId: v.string(),
    playerUsername: v.string(),
    action: v.string(),
    cardId: v.string(),
    cardName: v.string(),
    success: v.boolean(),
    pointsScored: v.number(),
    description: v.string(),
    timestamp: v.number(),
  })
    .index("by_battle", ["battleId"])
    .index("by_battle_turn", ["battleId", "turn"]),

  // Active effects (spells)
  activeEffects: defineTable({
    battleId: v.string(),
    effectId: v.string(),
    cardId: v.string(),
    cardName: v.string(),
    playerId: v.string(),
    targetPlayer: v.string(),
    statBoosts: v.object({
      offense: v.optional(v.number()),
      defense: v.optional(v.number()),
      speed: v.optional(v.number()),
      threePoint: v.optional(v.number()),
    }),
    duration: v.string(),
    turnsLeft: v.number(),
    createdTurn: v.number(),
  }).index("by_battle", ["battleId"]),

  // Set traps
  setTraps: defineTable({
    battleId: v.string(),
    trapId: v.string(),
    cardId: v.string(),
    cardName: v.string(),
    playerId: v.string(),
    trigger: v.string(),
    effect: v.object({
      statReduction: v.optional(v.object({
        offense: v.optional(v.number()),
        defense: v.optional(v.number()),
        speed: v.optional(v.number()),
      })),
      instantPoints: v.optional(v.number()),
    }),
    setOnTurn: v.number(),
    triggered: v.boolean(),
  }).index("by_battle", ["battleId"]),

  // ✅ Matchmaking queue
  matchmakingQueue: defineTable({
    userId: v.string(),
    username: v.string(),
    sport: v.string(),
    deck: v.array(v.any()),
    status: v.string(), // "WAITING" | "MATCHED" | "EXPIRED"
    matchedWith: v.optional(v.string()),
    battleId: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status_sport", ["status", "sport"])
    .index("by_expires", ["expiresAt"]),

    battleResults: defineTable({
        battleId: v.string(),
        winnerId: v.string(),
        loserId: v.string(),
        player1Id: v.string(),
        player2Id: v.string(),
        player1Score: v.number(),
        player2Score: v.number(),
        sport: v.string(),
        finishedAt: v.number(),
        syncedToSupabase: v.boolean(), // Track if synced
      })
        .index("by_battle", ["battleId"])
        .index("by_synced", ["syncedToSupabase"]),
});


// import { defineSchema, defineTable } from "convex/server";
// import { v } from "convex/values";

// export default defineSchema({
//   // Real-time battle state
//   battles: defineTable({
//     battleId: v.string(),
//     player1Id: v.string(),
//     player2Id: v.string(),
//     player1Username: v.string(),
//     player2Username: v.string(),
//     player1Score: v.number(),
//     player2Score: v.number(),
//     quarter: v.number(),
//     currentTurn: v.string(), // user_id
//     status: v.string(), // "WAITING", "IN_PROGRESS", "COMPLETED"
    
//     // Deck snapshots for this battle
//     player1Deck: v.array(v.any()),
//     player2Deck: v.array(v.any()),
    
//     createdAt: v.number(),
//     updatedAt: v.number(),
//   })
//     .index("by_battle_id", ["battleId"])
//     .index("by_status", ["status"]),

//   // Real-time battle log
//   battleMoves: defineTable({
//     battleId: v.string(),
//     turn: v.number(),
//     playerId: v.string(),
//     playerUsername: v.string(),
//     action: v.string(),
//     cardId: v.string(),
//     cardName: v.string(),
//     success: v.boolean(),
//     pointsScored: v.number(),
//     description: v.string(),
//     timestamp: v.number(),
//   })
//     .index("by_battle", ["battleId"])
//     .index("by_battle_turn", ["battleId", "turn"]),

//   // Active spell effects
//   activeEffects: defineTable({
//     battleId: v.string(),
//     effectId: v.string(),
//     cardId: v.string(),
//     cardName: v.string(),
//     playerId: v.string(),
//     targetPlayer: v.string(),
//     statBoosts: v.object({
//       offense: v.optional(v.number()),
//       defense: v.optional(v.number()),
//       speed: v.optional(v.number()),
//       threePoint: v.optional(v.number()),
//     }),
//     duration: v.string(), // "INSTANT", "TURN", "QUARTER"
//     turnsLeft: v.number(),
//     createdTurn: v.number(),
//   }).index("by_battle", ["battleId"]),

//   // Set traps
//   setTraps: defineTable({
//     battleId: v.string(),
//     trapId: v.string(),
//     cardId: v.string(),
//     cardName: v.string(),
//     playerId: v.string(),
//     trigger: v.string(), // "ON_ATTACK", "ON_OPPONENT_SCORE", "ON_TURN_START"
//     effect: v.object({
//       statReduction: v.optional(v.object({
//         offense: v.optional(v.number()),
//         defense: v.optional(v.number()),
//         speed: v.optional(v.number()),
//       })),
//       instantPoints: v.optional(v.number()),
//     }),
//     setOnTurn: v.number(),
//     triggered: v.boolean(),
//   }).index("by_battle", ["battleId"]),
// });