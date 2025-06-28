"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { signIn } from "next-auth/react";
import { CheckCircle2, XCircle, Code, ShieldAlert, BookOpen } from "lucide-react";

const ALL_GITHUB_SCOPES = [
  {
    scope: "repo",
    name: "Repository Access",
    description: "Read, write and administer private & public repositories.",
    icon: <Code className="w-6 h-6 text-green-500" />,
  },
  {
    scope: "read:org",
    name: "Organization Read",
    description: "View organization, team, and repository membership info.",
    icon: <BookOpen className="w-6 h-6 text-blue-500" />,
  },
  {
    scope: "gist",
    name: "Gists",
    description: "Create and update gists.",
    icon: <Code className="w-6 h-6 text-purple-500" />,
  },
  {
    scope: "workflow",
    name: "GitHub Actions",
    description: "Update and re-run workflows.",
    icon: <ShieldAlert className="w-6 h-6 text-yellow-500" />,
  },
];

export function GitHubScopeChecker() {
  const ghAccount = useQuery(api.accounts.getGitHubAccount);
  const deleteGhAccount = useMutation(api.accounts.deleteGitHubAccount);

  const granted = new Set(ghAccount?.scope?.split(" ") ?? []);
  const allGranted = ALL_GITHUB_SCOPES.every((s) => granted.has(s.scope));

  const requestScopes = async () => {
    const scopes = ALL_GITHUB_SCOPES.map((s) => s.scope).join(" ");
    await signIn("github", {}, { scope: scopes });
  };

  if (ghAccount === undefined) return <div className="p-4 text-center">Loading…</div>;

  if (!ghAccount) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md my-8 p-8 border">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect GitHub</h2>
        <p className="text-gray-600 mb-6">Connect your GitHub account for repository access.</p>
        <button
          onClick={requestScopes}
          className="w-full bg-gray-900 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 px-5 py-3"
        >
          Connect GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md my-8">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">GitHub Permissions</h2>
        <p className="text-gray-600 mb-6">Below are the permissions granted to this application.</p>

        <ul className="space-y-4">
          {ALL_GITHUB_SCOPES.map((info) => {
            const ok = granted.has(info.scope);
            return (
              <li key={info.scope} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 border">
                <div className="flex-shrink-0 mt-1">{info.icon}</div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-800">{info.name}</p>
                  <p className="text-sm text-gray-500">{info.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {ok ? (
                    <>
                      <span className="text-sm font-medium text-green-600">Granted</span>
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-red-600">Not Granted</span>
                      <XCircle className="w-6 h-6 text-red-500" />
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {!allGranted && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-800">Grant Missing Permissions</h3>
            <p className="text-gray-600 mt-2 mb-4">Grant additional scopes needed for full functionality.</p>
            <button
              onClick={requestScopes}
              className="w-full bg-gray-900 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 px-5 py-3"
            >
              Grant Permissions
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-800">Remove GitHub Access</h3>
          <p className="text-gray-600 mt-2 mb-4">Delete stored credentials and revoke access.</p>
          <button
            onClick={async () => {
              await deleteGhAccount();
            }}
            className="w-full bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 px-5 py-3"
          >
            Remove Access
          </button>
        </div>
      </div>
    </div>
  );
} 