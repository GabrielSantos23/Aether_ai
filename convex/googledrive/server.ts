import { createServerToolkit } from "../../lib/create-toolkit";
import { baseGoogleDriveConfig } from "./base";
import { GoogleDriveTools } from "./tools/tools";
import { listFilesConfigServer } from "./tools/list_files/server";
import { searchFilesConfigServer } from "./tools/search_files/server";
import { readFileConfigServer } from "./tools/read_file/server";

export const googleDriveServerToolkit = createServerToolkit(
  baseGoogleDriveConfig,
  `You have access to the user's Google Drive through this toolkit.
  
  Use these tools to help the user find and read files from their Google Drive:
  
  - Use list_files to browse files in a folder (or root if no folder is specified)
  - Use search_files to find files by name or content
  - Use read_file to read the content of a specific file
  
  Best practices:
  - When listing files, start from the root if the user doesn't specify a folder
  - For search, use specific keywords from the user's request
  - When reading files, make sure to specify the correct file ID
  - Only read files that the user has explicitly asked for
  - Respect user privacy and only access files that are relevant to the current request`,

  async (params) => {
    return {
      [GoogleDriveTools.ListFiles]: listFilesConfigServer,
      [GoogleDriveTools.SearchFiles]: searchFilesConfigServer,
      [GoogleDriveTools.ReadFile]: readFileConfigServer,
    };
  }
);
