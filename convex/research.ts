import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Mutation to save a deep-research report for the authenticated user
export const saveResearchReport = mutation({
  args: {
    prompt: v.string(),
    pdfKey: v.string(),
    pdfUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be authenticated to save research reports.");
    }

    const userId = identity.subject as any as Id<"users">;

    await ctx.db.insert("researchReports", {
      userId,
      prompt: args.prompt,
      pdfKey: args.pdfKey,
      pdfUrl: args.pdfUrl,
      createdAt: Date.now(),
    });
  },
});
