import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// 1. DEFINE THE TYPES FOR THE GOOGLE DRIVE API RESPONSE
// This describes a single file object from Google Drive
interface GoogleDriveFile {
  kind: string;
  id: string;
  name: string;
  mimeType: string;
}

// This describes the overall structure of the file list API response
interface GoogleDriveApiResponse {
  kind: string;
  nextPageToken?: string; // The token might not always be present
  incompleteSearch: boolean;
  files: GoogleDriveFile[];
}

// Helper query to get the user's account information
// It's 'internal' so it can only be called by other backend functions (like our action)
export const getGoogleAccount = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Your 'accounts' table has an index on 'userId'
    return await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("provider"), "google"))
      .unique();
  },
});


// The action that calls the Google Drive API
export const listGoogleDriveFiles = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to use this feature.");
    }

    const userId = identity.subject as Id<"users">; 

    const googleAccount = await ctx.runQuery(internal.files.getGoogleAccount, { userId });

    if (!googleAccount) {
      throw new Error("Google account not connected.");
    }
    
    const scopes = googleAccount.scope?.split(" ") ?? [];
    if (!scopes.some(scope => scope.includes("https://www.googleapis.com/auth/drive"))) {
        throw new Error("Google Drive permission has not been granted.");
    }

    const accessToken = googleAccount.access_token;

    if (!accessToken) {
      throw new Error("No access token found.");
    }

    const response = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=10", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Google Drive API Error:", errorData);
        throw new Error(`Failed to fetch files from Google Drive. Status: ${response.status}`);
    }

    // 2. APPLY THE TYPE TO THE PARSED JSON
    // We tell TypeScript that the result of response.json() will match our interface.
    const filesData: GoogleDriveApiResponse = await response.json();

    // Now, TypeScript knows that `filesData` has a `files` property which is an array.
    return filesData.files;
  },
});