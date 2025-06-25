import { googleDriveClientToolkit } from "./client";
import { googleDriveServerToolkit } from "./server";
import { Toolkits } from "./shared";
import { ClientToolkit, ServerToolkit } from "../../lib/types";

// Export the client toolkits
export const clientToolkits: Record<string, ClientToolkit> = {
  [Toolkits.GoogleDrive]: googleDriveClientToolkit,
};

// Export the server toolkits
export const serverToolkits: Record<string, ServerToolkit> = {
  [Toolkits.GoogleDrive]: googleDriveServerToolkit,
};

export { Toolkits };
