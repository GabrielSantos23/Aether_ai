import { z } from "zod";
import { createBaseTool } from "../../../../lib/create-tool";

export const baseSearchFilesTool = createBaseTool({
  description:
    "Search for files and folders in Google Drive by name or content",
  inputSchema: z.object({
    query: z.string().min(1).describe("Search query to find files"),
    mimeType: z
      .string()
      .optional()
      .describe("Filter by MIME type (e.g., 'application/pdf')"),
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
        snippet: z.string().optional(),
      })
    ),
    nextPageToken: z.string().optional(),
  }),
});
