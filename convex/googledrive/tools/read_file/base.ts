import { z } from "zod";
import { createBaseTool } from "../../../../lib/create-tool";

export const baseReadFileTool = createBaseTool({
  description: "Read the content of a file from Google Drive",
  inputSchema: z.object({
    fileId: z.string().describe("ID of the file to read"),
    mimeType: z.string().optional().describe("The MIME type of the file"),
  }),
  outputSchema: z.object({
    content: z.string().describe("The content of the file"),
    name: z.string().describe("The name of the file"),
    mimeType: z.string().describe("The MIME type of the file"),
    size: z.number().optional().describe("The size of the file in bytes"),
    webViewLink: z
      .string()
      .optional()
      .describe("Link to view the file in a browser"),
  }),
});
