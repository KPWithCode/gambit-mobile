import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Join matchmaking queue
export const joinQueue = mutation({
  args: {
    userId: v.string(),
    username: v.string(),
    sport: v.string(),
    deck: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 30000; // 30 second timeout

    // Check if user already in queue
    const existingEntry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingEntry) {
      // Update existing entry
      await ctx.db.patch(existingEntry._id, {
        sport: args.sport,
        deck: args.deck,
        status: "WAITING",
        createdAt: now,
        expiresAt: expiresAt,
      });
      return { queueId: existingEntry._id, status: "UPDATED" };
    }

    // Create new queue entry
    const queueId = await ctx.db.insert("matchmakingQueue", {
      userId: args.userId,
      username: args.username,
      sport: args.sport,
      deck: args.deck,
      status: "WAITING",
      createdAt: now,
      expiresAt: expiresAt,
    });

    // Try to find a match immediately
    const opponent = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_status_sport", (q) =>
        q.eq("status", "WAITING").eq("sport", args.sport)
      )
      .filter((q) =>
        q.and(
          q.neq(q.field("userId"), args.userId), // Not same user
          q.gt(q.field("expiresAt"), now) // Not expired
        )
      )
      .first();

    if (opponent) {
      // Match found! Create battle
      const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create battle
      // Flat structure matching schema
        await ctx.db.insert("battles", {
            battleId,
            player1Id: args.userId,
            player2Id: opponent.userId,
            player1Username: args.username,
            player2Username: opponent.username,
            player1Deck: args.deck,
            player2Deck: opponent.deck,
            player1Score: 0,
            player2Score: 0,
            quarter: 1,
            currentTurn: args.userId,
            status: "IN_PROGRESS",
            createdAt: now,
            updatedAt: now,
        });

      // Update both queue entries
      await ctx.db.patch(queueId, {
        status: "MATCHED",
        matchedWith: opponent.userId,
        battleId,
      });

      await ctx.db.patch(opponent._id, {
        status: "MATCHED",
        matchedWith: args.userId,
        battleId,
      });

      return {
        queueId,
        status: "MATCHED",
        battleId,
        opponentUsername: opponent.username,
      };
    }

    return { queueId, status: "WAITING" };
  },
});
// Subscribe to queue status (real-time) - READ ONLY
export const getQueueStatus = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
      const entry = await ctx.db
        .query("matchmakingQueue")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();
  
      if (!entry) {
        return { status: "NOT_IN_QUEUE" };
      }
  
      // Check if expired (just check, don't modify)
      const isExpired = entry.expiresAt < Date.now() && entry.status === "WAITING";
  
      return {
        status: isExpired ? "EXPIRED" : entry.status,
        battleId: entry.battleId,
        matchedWith: entry.matchedWith,
        expiresAt: entry.expiresAt,
      };
    },
  });
  
  // Separate mutation to mark as expired
  export const markExpired = mutation({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
      const entry = await ctx.db
        .query("matchmakingQueue")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();
  
      if (entry && entry.expiresAt < Date.now() && entry.status === "WAITING") {
        await ctx.db.patch(entry._id, { status: "EXPIRED" });
        return { status: "EXPIRED" };
      }
  
      return { status: entry?.status || "NOT_IN_QUEUE" };
    },
  });

// Leave queue
export const leaveQueue = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (entry) {
      await ctx.db.delete(entry._id);
    }

    return { success: true };
  },
});

// Cleanup expired entries (called periodically)
export const cleanupExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("matchmakingQueue")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .filter((q) => q.eq(q.field("status"), "WAITING"))
      .collect();

    for (const entry of expired) {
      await ctx.db.patch(entry._id, { status: "EXPIRED" });
    }

    return { cleaned: expired.length };
  },
});