"use client";

import { signIn } from "next-auth/react";

// Comprehensive GitHub scopes for repo read/write, search, etc.
const GITHUB_SCOPES = [
  "repo",            // Full control of private repositories
  "read:org",        // Read org membership, team & repo info
  "gist",            // Create gists
  "workflow"         // Update Actions workflows
].join(" ");

export function ConnectGitHubButton() {
  const handleConnect = async () => {
    await signIn(
      "github",
      {},
      {
        scope: GITHUB_SCOPES,
      },
    );
  };

  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
    >
      Connect GitHub (Full Access)
    </button>
  );
} 