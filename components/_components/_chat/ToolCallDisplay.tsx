import React, { useState } from "react";
import {
  Loader2,
  Search,
  Link as LinkIcon,
  ChevronDown,
  Image as ImageIcon,
  Download,
  ExternalLink,
  File,
  FileText,
  Image,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Weather } from "../_tools/weather";

const ToolCallDisplay = ({ toolCalls }: { toolCalls: any[] }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  const hasResults = toolCalls.some(
    (call) =>
      call.result && call.result.results && call.result.results.length > 0
  );

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

          {call.toolName === "getWeather" && (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60 mb-2">
                  {call.result ? <Weather /> : <LoadingSpinner size={16} />}
                  <span>
                    {call.result ? "Got weather for:" : "Getting weather for:"}{" "}
                    <em>
                      {call.args.latitude}, {call.args.longitude}
                    </em>
                  </span>
                </div>
              </div>
            </div>
          )}

          {call.toolName === "generateImage" && (
            <div className="my-4">
              {!call.result && (
                <div className="flex items-center gap-2 mb-3 text-black/60 dark:text-white/60">
                  <LoadingSpinner size={16} />
                  <span>Generating image: "{call.args.prompt}"</span>
                </div>
              )}

              {call.result && call.result.image && (
                <div>
                  <div className="overflow-hidden rounded-lg relative group">
                    <img
                      src={call.result.image}
                      alt={call.args.prompt || "Generated image"}
                      className="w-full h-auto object-cover rounded-lg"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={call.result.image}
                        download="generated-image.png"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                      >
                        <Download className="w-4 h-4 text-white" />
                      </a>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-black/50 dark:text-white/50 italic">
                    {call.args.prompt}
                  </div>
                </div>
              )}
            </div>
          )}

          {call.toolName === "createDocument" && (
            <div>
              <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60 mb-2">
                {call.result ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <LoadingSpinner size={16} />
                )}
                <span>
                  {call.result ? "Created document:" : "Creating document..."}{" "}
                  <em>{call.args.title || "Untitled Document"}</em>
                </span>
              </div>

              {call.result && call.result.url && (
                <div className="mt-2">
                  <a
                    href={call.result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Document</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ToolCallDisplay;
