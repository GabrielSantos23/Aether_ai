import { v } from "convex/values";
import { action } from "./_generated/server";
import { auth } from "@trigger.dev/sdk/v3";

export const createPublicToken = action({
  args: {
    taskId: v.string(),
  },
  handler: async (_ctx, args) => {
    // Generate a short-lived public access token for the given task
    const token = await auth.createTriggerPublicToken(args.taskId);
    return token;
  },
});
