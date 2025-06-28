"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { signIn } from "next-auth/react";
import { CheckCircle2, XCircle, FileText, Edit, PlusCircle } from "lucide-react";

// Human-friendly mapping of Notion scopes
const ALL_NOTION_SCOPES = [
  {
    scope: "databases:read",
    name: "Read Databases",
    description: "View database structure & content.",
    icon: <FileText className="w-6 h-6 text-blue-500" />,
  },
  {
    scope: "databases:write",
    name: "Edit Databases",
    description: "Create & modify databases.",
    icon: <Edit className="w-6 h-6 text-green-500" />,
  },
  {
    scope: "pages:read",
    name: "Read Pages",
    description: "View pages content.",
    icon: <FileText className="w-6 h-6 text-blue-500" />,
  },
  {
    scope: "pages:write",
    name: "Create & Edit Pages",
    description: "Create or update pages.",
    icon: <PlusCircle className="w-6 h-6 text-green-500" />,
  },
  {
    scope: "blocks:read",
    name: "Read Blocks",
    description: "View blocks inside pages.",
    icon: <FileText className="w-6 h-6 text-purple-500" />,
  },
  {
    scope: "blocks:write",
    name: "Edit Blocks",
    description: "Add or edit blocks inside pages.",
    icon: <Edit className="w-6 h-6 text-purple-500" />,
  },
  {
    scope: "users:read",
    name: "Read Users",
    description: "View workspace user info.",
    icon: <FileText className="w-6 h-6 text-yellow-500" />,
  },
];

export function NotionScopeChecker() {
  const notionAccount = useQuery(api.accounts.getNotionAccount);
  const deleteNotionAccount = useMutation(api.accounts.deleteNotionAccount);

  const grantedScopes = new Set(notionAccount?.scope?.split(" ") ?? []);
  const hasAll = ALL_NOTION_SCOPES.every((s) => grantedScopes.has(s.scope));

  const requestScopes = async () => {
    const scopesToRequest = ALL_NOTION_SCOPES.map((s) => s.scope).join(" ");
    await signIn("notion", {}, { scope: scopesToRequest });
  };

  if (notionAccount === undefined) {
    return <div className="p-4 text-center">Loading permissions…</div>;
  }

  if (!notionAccount) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md my-8 p-8 border">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect to Notion</h2>
        <p className="text-gray-600 mb-6">Connect your Notion workspace to use this app.</p>
        <button
          onClick={requestScopes}
          className="w-full bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 px-5 py-3"
        >
          Connect Notion Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md my-8">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Notion Permissions</h2>
        <p className="text-gray-600 mb-6">Check the permissions granted to this application.</p>

        <ul className="space-y-4">
          {ALL_NOTION_SCOPES.map((info) => {
            const granted = grantedScopes.has(info.scope);
            return (
              <li key={info.scope} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 border">
                <div className="flex-shrink-0 mt-1">{info.icon}</div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-800">{info.name}</p>
                  <p className="text-sm text-gray-500">{info.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {granted ? (
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

        {!hasAll && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-800">Grant Missing Permissions</h3>
            <p className="text-gray-600 mt-2 mb-4">Click below to grant any missing scopes.</p>
            <button
              onClick={requestScopes}
              className="w-full bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 px-5 py-3"
            >
              Grant Permissions
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-800">Remove Notion Access</h3>
          <p className="text-gray-600 mt-2 mb-4">Delete stored credentials and revoke access.</p>
          <button
            onClick={async () => {
              await deleteNotionAccount();
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