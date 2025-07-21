import React, { useState } from "react";
import { Loader2, NotebookPen } from "lucide-react";
import { motion } from "framer-motion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ChatSearchResults } from "./ChatSearchResults";
import { ChatImageResult } from "./ChatImageResult";
import { ChatResearchResults } from "./ChatResearchResults";

const ToolCallDisplay = ({ toolCalls }: { toolCalls: any[] }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  const hasResults = toolCalls.some(
    (call) =>
      call.result && call.result.results && call.result.results.length > 0
  );

  // Determine if any tool call is currently loading (i.e., result is undefined or null)
  const isAnyToolCallLoading = toolCalls.some((call) => !call.result);

  return (
    <div className="mt-6 space-y-6">
      {/* Enhanced loading overlay with pulsing effect */}
      {isAnyToolCallLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center py-12 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/5 animate-pulse rounded-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="relative">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <div className="absolute inset-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-ping" />
            </div>
            <div className="space-y-1">
              <span className="text-base font-medium text-muted-foreground">
                Processing request...
              </span>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-muted-foreground/40 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {toolCalls.map((call, index) => (
        <motion.div
          key={call.toolCallId}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={
            call.toolName !== "search" &&
            call.toolName !== "generateImage" &&
            call.toolName !== "updateUserSettings"
              ? "relative overflow-hidden rounded-3xl bg-gradient-to-br from-black/5 via-black/3 to-transparent dark:from-white/5 dark:via-white/3 border border-black/10 dark:border-white/10 backdrop-blur-sm"
              : ""
          }
        >
          {/* Subtle animated background gradient */}
          {call.toolName !== "search" &&
            call.toolName !== "generateImage" &&
            call.toolName !== "updateUserSettings" && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-pink-400/5 animate-pulse opacity-50" />
            )}

          {call.toolName === "search" && (
            <div className="relative py-3">
              <ChatSearchResults
                result={[
                  {
                    query: call.args.query,
                    results: call.result?.results || [],
                  },
                ]}
                queries={[call.args.query]}
                annotations={[]}
              />
            </div>
          )}

          {call.toolName === "generateImage" && (
            <div className="space-y-6">
              <ChatImageResult
                annotations={[]}
                result={call.result}
                prompt={call.args.prompt}
              />
            </div>
          )}

          {(call.toolName === "startDeepResearch" ||
            call.toolName === "research") && (
            <div className="relative p-6">
              <ChatResearchResults
                id={call.toolCallId}
                request={call.result}
                done={call.result !== null}
              />
            </div>
          )}

          {/* Keep updateUserSettings unchanged */}
          {call.toolName === "updateUserSettings" && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/50 cursor-help">
                  {call.result ? (
                    <NotebookPen className="w-4 h-4" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>
                    {call.result
                      ? "Updated saved memory."
                      : "Updating user info..."}
                  </span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent
                className="w-80 bg-sidebar/80 backdrop-blur-sm rounded-2xl"
                side="top"
                align="start"
              >
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Memory Details</h4>
                  {call.args && Object.keys(call.args).length > 0 ? (
                    <div className="space-y-1 flex flex-col justify-start items-start">
                      {Object.entries(call.args).map(([key, value]) => (
                        <div
                          key={key}
                          className="text-xs text-muted-foreground"
                        >
                          <strong>{key}:</strong>{" "}
                          {Array.isArray(value)
                            ? value.join(", ")
                            : String(value)}
                        </div>
                      ))}
                      <div className="flex justify-end ">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition"
                          title="Edit memory details"
                        >
                          <NotebookPen className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No memory details provided.
                    </div>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default ToolCallDisplay;
