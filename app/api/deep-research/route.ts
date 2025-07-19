import { NextResponse } from "next/server";
import { deepResearchOrchestrator } from "@/trigger/deepResearch";
import { tasks } from "@trigger.dev/sdk/v3";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, depth = 2, breadth = 2 } = body ?? {};

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "'prompt' (string) is required" },
        { status: 400 }
      );
    }

    const handle = await tasks.trigger<typeof deepResearchOrchestrator>(
      "deep-research",
      {
        prompt,
        depth,
        breadth,
      }
    );

    return NextResponse.json(handle);
  } catch (error) {
    console.error("Failed to trigger deep-research task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
