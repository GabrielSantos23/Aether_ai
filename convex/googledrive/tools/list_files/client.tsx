import React from "react";
import type { ClientToolConfig } from "../../../../lib/types";
import type { baseListFilesTool } from "./base";
import { HardDrive, File, Folder } from "lucide-react";

export const listFilesConfigClient: ClientToolConfig<
  typeof baseListFilesTool.inputSchema.shape,
  typeof baseListFilesTool.outputSchema.shape
> = {
  CallComponent: ({ args, isPartial }) => (
    <div className="flex items-center gap-2 text-sm">
      <HardDrive className="w-4 h-4 text-blue-500" />
      <span>
        Listing files{args.folderId ? ` in folder ${args.folderId}` : ""}
        {isPartial && <span className="animate-pulse">...</span>}
      </span>
    </div>
  ),
  ResultComponent: ({ args, result }) => (
    <div className="border rounded-md p-3 bg-card">
      <div className="text-sm font-medium mb-2">
        {result.files.length} files found in Google Drive
        {args.folderId ? ` (folder: ${args.folderId})` : ""}
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {result.files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-2 p-1 hover:bg-muted/50 rounded text-sm"
          >
            {file.isFolder ? (
              <Folder className="w-4 h-4 text-blue-400" />
            ) : (
              <File className="w-4 h-4 text-gray-400" />
            )}
            <span className="truncate flex-1">
              {file.name}
              {file.size && (
                <span className="text-xs text-muted-foreground ml-2">
                  {formatBytes(file.size)}
                </span>
              )}
            </span>
            {file.webViewLink && (
              <a
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline"
              >
                Open
              </a>
            )}
          </div>
        ))}
      </div>
      {result.nextPageToken && (
        <div className="text-xs text-muted-foreground mt-2">
          More files available. Please refine your search.
        </div>
      )}
    </div>
  ),
};

// Helper function to format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
