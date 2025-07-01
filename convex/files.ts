import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalQuery, internalMutation } from "./_generated/server";
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

// Define the account structure
interface GoogleAccount {
  _id: Id<"accounts">;
  userId: Id<"users">;
  provider: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
  [key: string]: any;
}

// Define file metadata response
interface FileMetadata {
  mimeType: string;
  name: string;
  [key: string]: any;
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
      .unique() as GoogleAccount | null;
  },
});

// Helper mutation to update Google account tokens
export const updateGoogleAccountTokens = internalMutation({
  args: { 
    accountId: v.id("accounts"),
    access_token: v.string(),
    expires_at: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.accountId, {
      access_token: args.access_token,
      expires_at: args.expires_at,
    });
  },
});

// Helper function to refresh the Google access token if needed
async function refreshGoogleToken(ctx: any, googleAccount: GoogleAccount): Promise<string> {
  // Check if token is expired or will expire soon (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const isExpired = googleAccount.expires_at && googleAccount.expires_at < now + 300;
  
  if (isExpired && googleAccount.refresh_token) {
    try {
      console.log("Refreshing expired Google access token");
      
      // Get environment variables
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error("Missing Google OAuth credentials in environment variables");
      }
      
      // Make token refresh request
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: googleAccount.refresh_token,
          grant_type: "refresh_token",
        }).toString(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Token refresh error:", errorData);
        throw new Error(`Failed to refresh token: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Calculate new expiration time
      const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
      
      // Update the token in the database
      await ctx.runMutation(internal.files.updateGoogleAccountTokens, {
        accountId: googleAccount._id,
        access_token: data.access_token,
        expires_at: expiresAt,
      });
      
      // Return the new access token
      return data.access_token;
    } catch (error) {
      console.error("Error refreshing token:", error);
      // If refresh fails, fall back to the existing token
      return googleAccount.access_token;
    }
  }
  
  // Token is still valid, return it
  return googleAccount.access_token;
}

// The action that calls the Google Drive API
export const listGoogleDriveFiles = action({
  args: {
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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
    if (!scopes.some((scope: string) => scope.includes("https://www.googleapis.com/auth/drive"))) {
        throw new Error("Google Drive permission has not been granted.");
    }

    // Get a fresh access token (refreshed if needed)
    const accessToken = await refreshGoogleToken(ctx, googleAccount);

    if (!accessToken) {
      throw new Error("No access token found.");
    }

    // Build the query URL
    let url = "https://www.googleapis.com/drive/v3/files";
    const params = new URLSearchParams();
    
    // Add pageSize parameter (default or user-specified)
    params.append("pageSize", String(args.limit || 10));
    
    // Add search query if provided
    if (args.query && args.query.trim() !== '') {
      // For folders, use 'name contains' instead of 'fullText contains'
      // This is more effective for finding folders by name
      params.append("q", `name contains '${args.query.replace(/'/g, "\\'")}'`);
    }
    
    // Always include these fields for better results
    params.append("fields", "files(id,name,mimeType,kind,parents)");
    
    // Append parameters to URL
    url = `${url}?${params.toString()}`;

    console.log(`Google Drive API request URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Google Drive API Error:", errorData);
        console.error(`Request URL was: ${url}`);
        throw new Error(`Failed to fetch files from Google Drive. Status: ${response.status}`);
    }

    // 2. APPLY THE TYPE TO THE PARSED JSON
    // We tell TypeScript that the result of response.json() will match our interface.
    const filesData: GoogleDriveApiResponse = await response.json();

    // Now, TypeScript knows that `filesData` has a `files` property which is an array.
    return filesData.files;
  },
});

// Action to read a file from Google Drive
export const readGoogleDriveFile = action({
  args: {
    fileId: v.string(),
  },
  handler: async (ctx, args): Promise<{name: string; mimeType: string; content: string}> => {
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
    if (!scopes.some((scope: string) => scope.includes("https://www.googleapis.com/auth/drive"))) {
        throw new Error("Google Drive permission has not been granted.");
    }

    // Get a fresh access token (refreshed if needed)
    const accessToken = await refreshGoogleToken(ctx, googleAccount);
    
    if (!accessToken) {
      throw new Error("No access token found.");
    }

    try {
      // First, get file metadata to check the mimeType
      const metadataUrl = `https://www.googleapis.com/drive/v3/files/${args.fileId}?fields=mimeType,name,id,kind,size`;
      console.log(`Fetching metadata for file ID: ${args.fileId}`);
      
      const metadataResponse = await fetch(metadataUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        console.error("Google Drive API Error (metadata):", errorData);
        throw new Error(`Failed to fetch file metadata. Status: ${metadataResponse.status} - ${JSON.stringify(errorData)}`);
      }

      const fileMetadata = await metadataResponse.json() as FileMetadata;
      
      // Handle folders differently
      if (fileMetadata.mimeType === 'application/vnd.google-apps.folder') {
        // For folders, list their contents instead
        const folderContentsUrl = `https://www.googleapis.com/drive/v3/files?q='${args.fileId}' in parents&fields=files(id,name,mimeType)`;
        console.log(`Listing contents of folder: ${fileMetadata.name}`);
        
        const contentsResponse = await fetch(folderContentsUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        if (!contentsResponse.ok) {
          const errorData = await contentsResponse.json();
          console.error("Google Drive API Error (folder contents):", errorData);
          throw new Error(`Failed to fetch folder contents. Status: ${contentsResponse.status}`);
        }
        
        const folderContents = await contentsResponse.json();
        return {
          name: fileMetadata.name,
          mimeType: fileMetadata.mimeType,
          content: JSON.stringify(folderContents, null, 2),
        };
      }
      
      // Get the file content for non-folders
      const contentUrl = `https://www.googleapis.com/drive/v3/files/${args.fileId}?alt=media`;
      console.log(`Fetching content for file: ${fileMetadata.name}`);
      
      const contentResponse = await fetch(contentUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!contentResponse.ok) {
        const errorText = await contentResponse.text();
        console.error("Google Drive API Error (content):", errorText);
        throw new Error(`Failed to fetch file content. Status: ${contentResponse.status} - ${errorText}`);
      }

      // Handle different file types
      let content: string;
      const mimeType = fileMetadata.mimeType;
      
      // For text files, return the text content
      if (mimeType.startsWith('text/') || 
          mimeType === 'application/json' || 
          mimeType.includes('javascript') ||
          mimeType.includes('xml')) {
        content = await contentResponse.text();
      } else {
        // For binary files, just return a message that we can't display the content
        content = `[Binary file: ${fileMetadata.name}]`;
      }

      return {
        name: fileMetadata.name,
        mimeType: fileMetadata.mimeType,
        content,
      };
    } catch (error) {
      console.error("Error reading Google Drive file:", error);
      throw error;
    }
  },
});