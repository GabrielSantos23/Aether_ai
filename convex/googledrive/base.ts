import { z } from "zod";
import type { ToolkitConfig } from "../../lib/types";
import { baseListFilesTool } from "./tools/list_files/base";
import { baseSearchFilesTool } from "./tools/search_files/base";
import { baseReadFileTool } from "./tools/read_file/base";
import { GoogleDriveTools } from "./tools/tools";

export const googleDriveParameters = z.object({
  // No additional parameters needed for Google Drive toolkit
});

export const baseGoogleDriveConfig: ToolkitConfig<
  GoogleDriveTools,
  typeof googleDriveParameters.shape
> = {
  tools: {
    [GoogleDriveTools.ListFiles]: baseListFilesTool,
    [GoogleDriveTools.SearchFiles]: baseSearchFilesTool,
    [GoogleDriveTools.ReadFile]: baseReadFileTool,
  },
  parameters: googleDriveParameters,
};
