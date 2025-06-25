import { ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";
import { DatabaseReader } from "../_generated/server";

// Google Drive API base URL
const GOOGLE_DRIVE_API_URL = "https://www.googleapis.com/drive/v3";

// Function to get a valid access token
export async function getAccessToken(
  db: DatabaseReader,
  userId: Id<"users">
): Promise<string> {
  // Fetch the token from the database
  const tokenRecord = await db
    .query("googleDriveTokens")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!tokenRecord) {
    throw new ConvexError(
      "Google Drive not connected. Please connect your Google Drive account first."
    );
  }

  // Check if the token is expired
  const now = Date.now();
  if (tokenRecord.expiresAt <= now) {
    // Token is expired, need to refresh it
    // This would be implemented in a mutation function
    throw new ConvexError(
      "Google Drive token expired. Please reconnect your Google Drive account."
    );
  }

  return tokenRecord.accessToken;
}

// Function to make authenticated requests to Google Drive API
export async function makeGoogleDriveRequest(
  accessToken: string,
  endpoint: string,
  method: "GET" | "POST" = "GET",
  params: Record<string, string> = {},
  body?: any
) {
  // Build URL with query parameters
  const url = new URL(`${GOOGLE_DRIVE_API_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Make the request
  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ConvexError(
      `Google Drive API error: ${response.status} ${errorText}`
    );
  }

  return response.json();
}

// Function to download file content
export async function downloadFile(accessToken: string, fileId: string) {
  const response = await fetch(
    `${GOOGLE_DRIVE_API_URL}/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new ConvexError(
      `Failed to download file: ${response.status} ${errorText}`
    );
  }

  return response.text();
}
