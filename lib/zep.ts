// Dynamic import of Zep client happens inside factory

const ZEP_API_KEY = process.env.ZEP_API_KEY || "";
const ZEP_BASE_URL = process.env.ZEP_BASE_URL || "";

let _client: any | null = null;

export async function getZepClient(): Promise<any> {
  if (_client) return _client;
  console.log("[ZEP] Initializing Zep client...");
  const mod: any = await import("@getzep/zep-js");
  // Possible export variations
  const Candidate = mod.ZepClient || mod.default?.ZepClient || mod.default;

  if (!Candidate) {
    throw new Error(
      "Unable to locate Zep client constructor in @getzep/zep-js module"
    );
  }

  if (typeof Candidate.init === "function") {
    // Preferred static factory
    _client = await Candidate.init(ZEP_BASE_URL || undefined, ZEP_API_KEY);
  } else {
    // Fallback to standard constructor
    _client = new Candidate({
      api_key: ZEP_API_KEY,
      ...(ZEP_BASE_URL ? { baseURL: ZEP_BASE_URL } : {}),
    });
  }
  console.log("[ZEP] Client initialized");
  return _client;
}
