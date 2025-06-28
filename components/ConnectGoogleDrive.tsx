"use client";

import { signIn } from "next-auth/react";

export function ConnectGoogleDriveButton() {
  const handleConnect = async () => {
    
    // 1. DEFINE ALL THE SCOPES YOU NEED
    // Combine the original OIDC scopes with the new Drive scope.
    const allScopes = [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/drive.readonly"
    ].join(" "); // Scopes must be a space-separated string

    // 2. PASS THE COMPLETE SCOPE STRING TO THE SIGNIN FUNCTION
    await signIn("google", 
      {}, // You can specify a callbackUrl here if needed
      { 
        scope: allScopes
      }
    );
  };

  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
    >
      Connect to Google Drive
    </button>
  );
}