import React from "react";
import type { ClientToolConfig } from "../../../../lib/types";
import type { baseReadFileTool } from "./base";
import { FileText } from "lucide-react";

export const readFileConfigClient: ClientToolConfig<
  typeof baseReadFileTool.inputSchema.shape,
  typeof baseReadFileTool.outputSchema.shape
> = {
  CallComponent: ({ args, isPartial }) => (
    <div className="flex items-center gap-2 text-sm">
      <FileText className="w-4 h-4 text-blue-500" />
      <span>
        Reading file with ID {args.fileId}
        {isPartial && <span className="animate-pulse">...</span>}
      </span>
    </div>
  ),
  ResultComponent: ({ args, result }) => {
    // Determine if content should be rendered as code
    const isCode = [
      "text/javascript",
      "text/typescript",
      "text/css",
      "application/json",
      "application/xml",
      "text/html",
    ].includes(result.mimeType);

    return (
      <div className="border rounded-md p-3 bg-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-medium">{result.name}</h3>
          </div>
          {result.webViewLink && (
            <a
              href={result.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              Open in Google Drive
            </a>
          )}
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          {result.mimeType}
          {result.size && ` • ${formatBytes(result.size)}`}
        </div>
        <div
          className={`mt-2 text-sm max-h-80 overflow-y-auto ${
            isCode ? "bg-muted p-2 rounded font-mono" : ""
          }`}
        >
          {result.content.split("\n").map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line || " "}
            </div>
          ))}
        </div>
      </div>
    );
  },
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
