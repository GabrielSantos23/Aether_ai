import { tool } from "ai";
import { z } from "zod";

/**
 * Deep-Research agent tool
 * ------------------------
 * This tool allows an LLM to autonomously trigger a multi-layered research
 * process powered by Trigger.dev. The agent only needs to supply the
 * high-level `topic` (and optionally a `depth`).
 */
export const startDeepResearch = tool({
  description:
    "Initiate an autonomous, multi-layered web research task. Returns a reference that can be passed to the accompanying <DeepResearch /> React component to visualise progress.",
  parameters: z.object({
    topic: z
      .string()
      .describe("The primary topic or question to research in-depth."),
    depth: z
      .number()
      .min(1)
      .max(5)
      .optional()
      .describe(
        "How many recursive layers of research to perform (default: 3)."
      ),
  }),
  execute: async (args) => {
    // The real heavy-lifting is done on the backend (Convex + Trigger.dev).
    // Here we just call the Convex action and return a tiny request object
    // that will be handled by the <DeepResearch /> UI component.

    try {
      return {
        type: "deep-research",
        query: args.topic,
        depth: args.depth ?? 3,
      };
    } catch (error) {
      console.error("Deep research tool error:", error);
      return {
        error: "Failed to start deep research",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
