import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * This Convex module contains the minimal backend glue required for the new
 * Deep-Research agent. We intentionally keep the business logic inside
 * Trigger.dev jobs. The Convex layer is only responsible for:
 * 1. Emitting an event to Trigger.dev to start a research job.
 * 2. Polling the job status so the front-end can update progress.
 *
 * NOTE: Replace `process.env.TRIGGER_API_KEY` and `process.env.TRIGGER_PROJECT_ID`
 * with the correct environment variables in your deployment.
 */

// ----------------------------------------------------------------------------------
// 1️⃣  Start a new deep-research job
// ----------------------------------------------------------------------------------
export const startDeepResearch = action({
  args: {
    /** The user-supplied research prompt */
    query: v.string(),
    /** Optional maximum depth of recursive research. */
    depth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authenticate the current user (Convex built-in auth)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must be logged in to start research");

    // Prepare the call to Trigger.dev
    const apiKey = process.env.TRIGGER_SECRET_KEY;
    const projectId = process.env.TRIGGER_PROJECT_ID;

    if (!apiKey || !projectId) {
      throw new Error(
        "Missing Trigger.dev environment variables. Please set `TRIGGER_SECRET_KEY` and `TRIGGER_PROJECT_ID`."
      );
    }

    // Emit a custom event that the Trigger.dev job listens to
    const res = await fetch("https://api.trigger.dev/v1/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        id: crypto.randomUUID(), // deterministic event id
        name: "deep.research.requested",
        payload: {
          query: args.query,
          depth: args.depth ?? 3,
          userId: identity.subject,
          geminiKey: await (async () => {
            const userKey = await ctx.db
              .query("apiKeys")
              .withIndex("by_user_and_service", (q) =>
                q.eq("userId", identity.subject as any).eq("service", "gemini")
              )
              .filter((q) => q.eq(q.field("is_default"), true))
              .unique();

            if (userKey?.key) return userKey.key as string;

            const fallback = process.env.GEMINI_API_KEY;
            if (!fallback) {
              throw new Error("No Gemini API key configured for research");
            }
            return fallback;
          })(),
        },
        context: { projectId },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to start research job → ${txt}`);
    }

    const { eventId } = (await res.json()) as { eventId: string };

    // Return the id so the frontend can poll for status
    return { eventId };
  },
});

// ----------------------------------------------------------------------------------
// 2️⃣  Simple helper query to get the latest status of a research job.
//     In a real implementation you would persist status updates in Convex
//     (using a table + mutation). For the first iteration we just forward the
//     call to Trigger.dev's REST API.
// ----------------------------------------------------------------------------------
export const getResearchStatus = action({
  args: { eventId: v.string() },
  handler: async (_ctx, args) => {
    const apiKey = process.env.TRIGGER_SECRET_KEY;
    if (!apiKey) throw new Error("Missing TRIGGER_SECRET_KEY env var");

    const res = await fetch(
      `https://api.trigger.dev/v1/events/${args.eventId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to fetch research status → ${txt}`);
    }

    const data = (await res.json()) as {
      status: "pending" | "in_progress" | "completed" | "failed";
      result?: { pdfUrl: string };
      lastError?: string;
    };

    return data;
  },
});
