import type { ServerToolConfig } from "../../../../lib/types";
import type { baseReadFileTool } from "./base";
import {
  getAccessToken,
  makeGoogleDriveRequest,
  downloadFile,
} from "../../utils";
import { ConvexError } from "convex/values";
import { DatabaseReader, MutationCtx } from "../../../_generated/server";

type ToolContext = {
  db: DatabaseReader;
  auth: MutationCtx["auth"];
};

export const readFileConfigServer: ServerToolConfig<
  typeof baseReadFileTool.inputSchema.shape,
  typeof baseReadFileTool.outputSchema.shape
> = {
  callback: async (args, context: ToolContext) => {
    const { db, auth } = context;
    const identity = await auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get the user ID from the token identifier
    const user = await db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get a valid access token
    const accessToken = await getAccessToken(db, user._id);

    // First get the file metadata
    const fileMetadata = await makeGoogleDriveRequest(
      accessToken,
      `/files/${args.fileId}`,
      "GET",
      {
        fields: "id,name,mimeType,size,webViewLink",
      }
    );

    // Check if we can read this file type
    const supportedMimeTypes = [
      "text/plain",
      "text/csv",
      "text/html",
      "text/javascript",
      "text/css",
      "application/json",
      "application/xml",
      "application/vnd.google-apps.document",
      "application/vnd.google-apps.spreadsheet",
      "application/vnd.google-apps.presentation",
    ];

    // If it's a Google Doc, we need to export it
    let content = "";
    if (fileMetadata.mimeType.startsWith("application/vnd.google-apps")) {
      // For Google Docs, we need to export them in a readable format
      const exportMimeType = "text/plain";
      const exportResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${args.fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!exportResponse.ok) {
        throw new ConvexError("Failed to export Google Docs file");
      }

      content = await exportResponse.text();
    } else if (
      supportedMimeTypes.includes(fileMetadata.mimeType) ||
      fileMetadata.mimeType.startsWith("text/")
    ) {
      // For regular text files, download the content
      content = await downloadFile(accessToken, String(args.fileId));
    } else {
      // For other files, we can't read the content
      content = `[This file type (${fileMetadata.mimeType}) cannot be read directly. Please export it to a readable format first.]`;
    }

    return {
      content,
      name: fileMetadata.name,
      mimeType: fileMetadata.mimeType,
      size: fileMetadata.size ? parseInt(fileMetadata.size) : undefined,
      webViewLink: fileMetadata.webViewLink,
    };
  },
  message: (result) => `Read file "${result.name}" (${result.mimeType})`,
};
