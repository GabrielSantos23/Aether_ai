import { ZepClient } from "@getzep/zep-cloud";

// Re-use one singleton client across the backend runtime
export const zep = new ZepClient({
  apiKey: process.env.ZEP_API_KEY!,
  // Default Cloud endpoint is used automatically; override via env vars in future if SDK adds support.
});
