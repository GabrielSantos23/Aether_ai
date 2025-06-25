import React from "react";
import { HardDrive } from "lucide-react";
import { createClientToolkit } from "../../lib/create-toolkit";
import { ToolkitGroups } from "../../lib/types";
import { baseGoogleDriveConfig } from "./base";
import { GoogleDriveTools } from "./tools/tools";
import { listFilesConfigClient } from "./tools/list_files/client";
import { searchFilesConfigClient } from "./tools/search_files/client";
import { readFileConfigClient } from "./tools/read_file/client";

export const googleDriveClientToolkit = createClientToolkit(
  baseGoogleDriveConfig,
  {
    name: "Google Drive",
    description: "Access and search files in your Google Drive",
    icon: HardDrive,
    form: null, // No additional parameters needed
    type: ToolkitGroups.DataSource,
    addToolkitWrapper: ({ children }) => (
      <div>
        {/* This wrapper can be used to check if the user has connected Google Drive */}
        {children}
      </div>
    ),
  },
  {
    [GoogleDriveTools.ListFiles]: listFilesConfigClient,
    [GoogleDriveTools.SearchFiles]: searchFilesConfigClient,
    [GoogleDriveTools.ReadFile]: readFileConfigClient,
  }
);
