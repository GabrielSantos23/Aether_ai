"use client";

import { useQuery, useMutation } from "convex/react";
// Assuming component is in a subdirectory like /components, adjusting path alias.
import { api } from "@/convex/_generated/api"; 
import { signIn } from "next-auth/react";
import { CheckCircle2, XCircle, File, Search, FileUp } from "lucide-react";

// --- 1. DEFINE THE GOOGLE DRIVE SCOPES YOU CARE ABOUT ---
// We map the technical scope string to a user-friendly name, description, and icon.
const ALL_DRIVE_SCOPES = [
  {
    scope: "https://www.googleapis.com/auth/drive.readonly",
    name: "View Files & Metadata",
    description: "Allows the app to see your files, folders, and their properties.",
    icon: <Search className="w-6 h-6 text-blue-500" />,
  },
  {
    scope: "https://www.googleapis.com/auth/drive.file",
    name: "Manage App-Created Files",
    description: "Create, view, and manage files created specifically by this application.",
    icon: <File className="w-6 h-6 text-green-500" />,
  },
  {
    scope: "https://www.googleapis.com/auth/drive",
    name: "Full File Access",
    description: "Grants full permission to view, edit, create, and delete all of your Drive files.",
    icon: <FileUp className="w-6 h-6 text-red-500" />,
  },
  // You can add more scopes here, like 'drive.metadata.readonly', etc.
];

// --- 2. THE MAIN COMPONENT ---
export function GoogleDriveScopeChecker() {
  // Fetch the user's Google account details from our Convex query
  const googleAccount = useQuery(api.accounts.getGoogleAccount);
  const deleteGoogleAccount = useMutation(api.accounts.deleteGoogleAccount);

  // --- 3. PARSE GRANTED SCOPES ---
  // If the account exists, split the scope string into an array for easy checking.
  const grantedScopes = new Set(googleAccount?.scope?.split(" ") ?? []);
  const hasAllScopes = ALL_DRIVE_SCOPES.every(s => grantedScopes.has(s.scope));

  const handleGrantPermissions = async () => {
    // --- 4. REQUEST ALL DEFINED SCOPES ---
    // This list includes the essential OIDC scopes plus all the Drive scopes we defined.
    const scopesToRequest = [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      ...ALL_DRIVE_SCOPES.map(s => s.scope)
    ].join(" ");

    // Trigger the sign-in flow, which will now ask for all scopes.
    // The account linking logic in `auth.ts` will handle the rest.
    await signIn("google", {}, { scope: scopesToRequest });
  };
  
  // --- RENDER LOGIC ---
  if (googleAccount === undefined) {
    // Loading state while the query runs
    return <div className="p-4 text-center">Loading permissions...</div>;
  }
  
  if (!googleAccount) {
    // State for a user who hasn't connected Google at all
    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl my-8 p-8 border">
             <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect to Google Drive</h2>
             <p className="text-gray-600 mb-6">Connect your Google account to check your file access permissions.</p>
             <button
                onClick={handleGrantPermissions}
                className="w-full bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 px-5 py-3"
              >
                Connect Google Account
             </button>
        </div>
    );
  }

  // --- 5. THE MAIN UI DISPLAY ---
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl my-8">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Google Drive Permissions</h2>
        <p className="text-gray-600 mb-6">
          Check the permissions you have granted to this application.
        </p>
        
        <ul className="space-y-4">
          {ALL_DRIVE_SCOPES.map((scopeInfo) => {
            const isGranted = grantedScopes.has(scopeInfo.scope);
            return (
              <li key={scopeInfo.scope} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 border">
                <div className="flex-shrink-0 mt-1">{scopeInfo.icon}</div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-800">{scopeInfo.name}</p>
                  <p className="text-sm text-gray-500">{scopeInfo.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {isGranted ? (
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
        
        {!hasAllScopes && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800">Grant Missing Permissions</h3>
              <p className="text-gray-600 mt-2 mb-4">Click the button below to grant access to the features that are not yet enabled.</p>
              <button
                onClick={handleGrantPermissions}
                className="w-full bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 px-5 py-3"
              >
                Grant All Permissions
              </button>
            </div>
        )}

        {/* --- 6. REMOVE ACCESS BUTTON --- */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-800">Remove Google Drive Access</h3>
          <p className="text-gray-600 mt-2 mb-4">Clicking the button below will revoke the app's access to your Google Drive by deleting the stored credentials. You can reconnect later if you change your mind.</p>
          <button
            onClick={async () => {
              await deleteGoogleAccount();
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

export default GoogleDriveScopeChecker;
