"use client";

import { signIn } from "next-auth/react";

// Notion scopes for reading, editing, creating pages & databases
const NOTION_SCOPES = [
  "databases:read",
  "databases:write",
  "pages:read",
  "pages:write",
  "blocks:read",
  "blocks:write",
  "users:read",
].join(" ");

export function ConnectNotionButton() {
  const handleConnect = async () => {
    await signIn(
      "notion",
      {},
      {
        scope: NOTION_SCOPES,
      },
    );
  };

  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
    >
      Connect Notion
    </button>
  );
} 