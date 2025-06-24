import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

// Corrigindo: forçar a chave ser extractable
const keys = await generateKeyPair("RS256", {
  modulusLength: 2048,
  extractable: true,
});

const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

process.stdout.write(
  `CONVEX_AUTH_PRIVATE_KEY="${privateKey.replace(/\n/g, "\\n")}"`
);
process.stdout.write("\n\n");
process.stdout.write(`JWKS=${jwks}`);
process.stdout.write("\n");
