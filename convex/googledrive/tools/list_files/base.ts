import { z } from "zod";
import { createBaseTool } from "../../../../lib/create-tool";

export const baseListFilesTool = createBaseTool({
  description: "List files and folders in a Google Drive directory",
  inputSchema: z.object({
    folderId: z
      .string()
      .optional()
      .describe(
        "Optional folder ID to list files from. If not provided, lists from root."
      ),
    pageSize: z
      .number()
      .min(1)
      .max(100)
      .default(30)
      .describe("Number of files to return"),
  }),
  outputSchema: z.object({
    files: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        mimeType: z.string(),
        webViewLink: z.string().optional(),
        iconLink: z.string().optional(),
        size: z.number().optional(),
        createdTime: z.string().optional(),
        modifiedTime: z.string().optional(),
        isFolder: z.boolean(),
      })
    ),
    nextPageToken: z.string().optional(),
  }),
});
