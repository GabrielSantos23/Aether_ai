import type { ServerToolConfig } from "../../../../lib/types";
import type { baseListFilesTool } from "./base";
import { getAccessToken, makeGoogleDriveRequest } from "../../utils";
import { ConvexError } from "convex/values";
import { DatabaseReader, MutationCtx } from "../../../_generated/server";

type ToolContext = {
  db: DatabaseReader;
  auth: MutationCtx["auth"];
};

export const listFilesConfigServer: ServerToolConfig<
  typeof baseListFilesTool.inputSchema.shape,
  typeof baseListFilesTool.outputSchema.shape
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

    // Set up query parameters
    const params: Record<string, string> = {
      fields:
        "files(id,name,mimeType,webViewLink,iconLink,size,createdTime,modifiedTime),nextPageToken",
      pageSize: args.pageSize.toString(),
    };

    if (args.folderId) {
      params.q = `'${args.folderId}' in parents`;
    }

    // Make the request to Google Drive API
    const response = await makeGoogleDriveRequest(
      accessToken,
      "/files",
      "GET",
      params
    );

    // Transform the response to match our schema
    const files = response.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      webViewLink: file.webViewLink,
      iconLink: file.iconLink,
      size: file.size ? parseInt(file.size) : undefined,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      isFolder: file.mimeType === "application/vnd.google-apps.folder",
    }));

    return {
      files,
      nextPageToken: response.nextPageToken,
    };
  },
  message: (result) => `Found ${result.files.length} files in Google Drive`,
};
