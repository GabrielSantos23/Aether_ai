"use client";

import { useEffect, useState } from "react";
import { DeepResearchAgent } from "@/components/deepSearchComponents/DeepResearchAgent";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TestDeepResearch() {
  const createToken = useAction(api.triggerTokens.createPublicToken);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await createToken({ taskId: "deep-research" });
        if (!cancelled) setToken(t);
      } catch (err) {
        console.error(err);
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to get access token"
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [createToken]);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!token) return <div>Loading…</div>;

  return <DeepResearchAgent triggerToken={token} />;
}
