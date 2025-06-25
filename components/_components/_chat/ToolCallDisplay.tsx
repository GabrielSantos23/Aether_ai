import React, { useState } from "react";
import {
  Loader2,
  Search,
  Link as LinkIcon,
  ChevronDown,
  Image as ImageIcon,
  Download,
  ExternalLink,
  HardDrive,
  File,
  FileText,
  Folder,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/spinner";
import { clientToolkits } from "@/lib/toolkits-registry";
import { toolkitIds } from "@/lib/toolkits-registry";

const ToolCallDisplay = ({ toolCalls }: { toolCalls: any[] }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  const hasResults = toolCalls.some(
    (call) =>
      call.result && call.result.results && call.result.results.length > 0
  );

  // Helper function to determine if a tool call is from Google Drive toolkit
  const isGoogleDriveTool = (toolName: string) => {
    return (
      toolName === "list_files" ||
      toolName === "search_files" ||
      toolName === "read_file"
    );
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("folder")) return <Folder className="w-4 h-4" />;
    if (mimeType.includes("image")) return <Image className="w-4 h-4" />;
    if (mimeType.includes("pdf") || mimeType.includes("document"))
      return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="mt-4 space-y-4">
      {toolCalls.map((call) => (
        <div
          key={call.toolCallId}
          className={cn(
            call.toolName !== "generateImage" &&
              "p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
          )}
        >
          {call.toolName === "search" && (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60 mb-2">
                  {call.result ? (
                    <Search className="w-4 h-4" />
                  ) : (
                    <LoadingSpinner size={16} />
                  )}
                  <span>
                    {call.result
                      ? "Searched the web for:"
                      : "Searching the web for:"}{" "}
                    <em>"{call.args.query}"</em>
                  </span>
                </div>
                {hasResults && (
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80"
                  >
                    <span>{isCollapsed ? "Show" : "Hide"} Results</span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform",
                        !isCollapsed && "rotate-180"
                      )}
                    />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {!isCollapsed && call.result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {call.result.answer && (
                      <div className="text-sm p-3 mt-2 rounded-md bg-black/5 dark:bg-white/5">
                        <strong>Answer:</strong> {call.result.answer}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {call.result.results.map((item: any, index: number) => (
                        <a
                          key={index}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-black/30 transition-colors shadow-sm border border-black/5 dark:border-white/5"
                        >
                          <div className="font-semibold text-sm text-purple-600 dark:text-purple-400 truncate">
                            {item.title}
                          </div>
                          <p className="text-xs text-black/70 dark:text-white/70 mt-1 line-clamp-2">
                            {item.content}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <LinkIcon className="w-3 h-3 text-black/40 dark:text-white/40" />
                            <span className="text-xs text-black/50 dark:text-white/50 truncate">
                              {item.url}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Google Drive - List Files */}
          {call.toolName === "list_files" && (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60 mb-2">
                  {call.result ? (
                    <HardDrive className="w-4 h-4" />
                  ) : (
                    <LoadingSpinner size={16} />
                  )}
                  <span>
                    {call.result
                      ? "Listed files in Google Drive:"
                      : "Listing files in Google Drive..."}{" "}
                    <em>
                      {call.args.folderId
                        ? `Folder: ${call.args.folderId}`
                        : "Root folder"}
                    </em>
                  </span>
                </div>
                {call.result &&
                  call.result.files &&
                  call.result.files.length > 0 && (
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80"
                    >
                      <span>{isCollapsed ? "Show" : "Hide"} Files</span>
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform",
                          !isCollapsed && "rotate-180"
                        )}
                      />
                    </button>
                  )}
              </div>

              <AnimatePresence>
                {!isCollapsed && call.result && call.result.files && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-1">
                      {call.result.files.map((file: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center p-2 rounded-md bg-white/50 dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-black/30 transition-colors border border-black/5 dark:border-white/5"
                        >
                          <div className="mr-2 text-black/60 dark:text-white/60">
                            {getFileIcon(file.mimeType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {file.name}
                            </div>
                            <div className="text-xs text-black/50 dark:text-white/50">
                              {file.mimeType.includes("folder")
                                ? "Folder"
                                : file.mimeType}
                            </div>
                          </div>
                          <div className="text-xs text-black/40 dark:text-white/40">
                            {file.id.substring(0, 8)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Google Drive - Search Files */}
          {call.toolName === "search_files" && (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60 mb-2">
                  {call.result ? (
                    <HardDrive className="w-4 h-4" />
                  ) : (
                    <LoadingSpinner size={16} />
                  )}
                  <span>
                    {call.result
                      ? "Searched Google Drive for:"
                      : "Searching Google Drive for:"}{" "}
                    <em>"{call.args.query}"</em>
                  </span>
                </div>
                {call.result &&
                  call.result.files &&
                  call.result.files.length > 0 && (
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80"
                    >
                      <span>{isCollapsed ? "Show" : "Hide"} Results</span>
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform",
                          !isCollapsed && "rotate-180"
                        )}
                      />
                    </button>
                  )}
              </div>

              <AnimatePresence>
                {!isCollapsed && call.result && call.result.files && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-1">
                      {call.result.files.map((file: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center p-2 rounded-md bg-white/50 dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-black/30 transition-colors border border-black/5 dark:border-white/5"
                        >
                          <div className="mr-2 text-black/60 dark:text-white/60">
                            {getFileIcon(file.mimeType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {file.name}
                            </div>
                            <div className="text-xs text-black/50 dark:text-white/50">
                              {file.mimeType.includes("folder")
                                ? "Folder"
                                : file.mimeType}
                            </div>
                          </div>
                          <div className="text-xs text-black/40 dark:text-white/40">
                            {file.id.substring(0, 8)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Google Drive - Read File */}
          {call.toolName === "read_file" && (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60 mb-2">
                  {call.result ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <LoadingSpinner size={16} />
                  )}
                  <span>
                    {call.result
                      ? "Read file from Google Drive:"
                      : "Reading file from Google Drive:"}{" "}
                    <em>{call.args.fileId}</em>
                  </span>
                </div>
                {call.result && call.result.content && (
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80"
                  >
                    <span>{isCollapsed ? "Show" : "Hide"} Content</span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform",
                        !isCollapsed && "rotate-180"
                      )}
                    />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {!isCollapsed && call.result && call.result.content && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="p-3 rounded-md bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">
                          {call.result.fileName || "File Content"}
                        </div>
                        <div className="text-xs text-black/50 dark:text-white/50">
                          {call.result.mimeType}
                        </div>
                      </div>
                      <pre className="text-xs whitespace-pre-wrap max-h-96 overflow-y-auto p-2 bg-black/5 dark:bg-white/5 rounded">
                        {call.result.content}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {call.toolName === "generateImage" && (
            <>
              {/* Success: Display image only */}
              {call.result && call.result.success && call.result.imageUrl && (
                <div className="relative group w-fit">
                  {call.result.isHtmlWrapper ? (
                    <iframe
                      src={call.result.imageUrl}
                      title={call.args.prompt}
                      className="w-full h-96 border-0 rounded-lg"
                      sandbox="allow-scripts"
                    />
                  ) : (
                    <img
                      src={call.result.imageUrl}
                      alt={call.args.prompt}
                      className="w-auto h-auto max-h-96 max-w-full object-contain rounded-lg"
                    />
                  )}

                  {/* Action buttons overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = call.result.imageUrl;
                        link.download = `generated-image-${Date.now()}.png`;
                        link.click();
                      }}
                      className="p-1.5 rounded bg-black/70 hover:bg-black/80 transition-colors"
                      title="Download image"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button
                      onClick={() => {
                        window.open(call.result.imageUrl, "_blank");
                      }}
                      className="p-1.5 rounded bg-black/70 hover:bg-black/80 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* Error state - minimal */}
              {call.result && !call.result.success && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                        Failed to generate image
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {call.result.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ToolCallDisplay;
