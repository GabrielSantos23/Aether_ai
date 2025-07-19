import MemoryClient from "mem0ai";

const MEM0_API_KEY = process.env.MEM0_API_KEY;

if (!MEM0_API_KEY) {
  console.warn(
    "MEM0_API_KEY environment variable is not set. The MemoryClient might not function correctly."
  );
}

export const memoryClient = new MemoryClient({
  apiKey: MEM0_API_KEY || "",
  // Explicitly disable graph features to stay within the free Mem0 plan
  enableGraph: false,
} as any);
