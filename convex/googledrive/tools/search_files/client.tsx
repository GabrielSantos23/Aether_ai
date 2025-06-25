import React from "react";
import type { ClientToolConfig } from "../../../../lib/types";
import type { baseSearchFilesTool } from "./base";
import { Search, File, Folder } from "lucide-react";

export const searchFilesConfigClient: ClientToolConfig<
  typeof baseSearchFilesTool.inputSchema.shape,
  typeof baseSearchFilesTool.outputSchema.shape
> = {
  CallComponent: ({ args, isPartial }) => (
    <div className="flex items-center gap-2 text-sm">
      <Search className="w-4 h-4 text-blue-500" />
      <span>
        Searching Google Drive for "{args.query}"
        {isPartial && <span className="animate-pulse">...</span>}
      </span>
    </div>
  ),
  ResultComponent: ({ args, result }) => (
    <div className="border rounded-md p-3 bg-card">
      <div className="text-sm font-medium mb-2">
        {result.files.length} files found for "{args.query}"
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
            <div className="flex-1 overflow-hidden">
              <div className="truncate">{file.name}</div>
              {file.snippet && (
                <div className="text-xs text-muted-foreground truncate">
                  {file.snippet}
                </div>
              )}
            </div>
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
