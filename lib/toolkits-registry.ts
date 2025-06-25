import { TOOLKITS } from "./constants";
import { googleDriveClientToolkit } from "../convex/googledrive/client";
import { googleDriveServerToolkit } from "../convex/googledrive/server";
import { ClientToolkit, ServerToolkit } from "./types";

// Register all client toolkits here
export const clientToolkits: Record<string, ClientToolkit> = {
  [TOOLKITS.GOOGLE_DRIVE]: googleDriveClientToolkit,
};

// Register all server toolkits here
export const serverToolkits: Record<string, ServerToolkit> = {
  [TOOLKITS.GOOGLE_DRIVE]: googleDriveServerToolkit,
};

// Export toolkit IDs for easy access
export const toolkitIds = {
  googleDrive: TOOLKITS.GOOGLE_DRIVE,
};
