import { GoogleDriveTools } from "./tools/tools";

// Add Google Drive to the toolkit enum
export enum Toolkits {
  GoogleDrive = "google-drive",
}

// Map toolkit names to their tool names
export type ServerToolkitNames = {
  [Toolkits.GoogleDrive]: GoogleDriveTools;
};

// Map toolkit names to their parameter shapes
export type ServerToolkitParameters = {
  [Toolkits.GoogleDrive]: Record<string, never>; // No parameters needed
};
