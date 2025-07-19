import React, { useEffect, useState } from "react";
import {
  Loader2,
  Search,
  Link as LinkIcon,
  ChevronDown,
  Image as ImageIcon,
  Download,
  ExternalLink,
  BookOpen,
  Save,
  NotebookPen,
  Sparkles,
  Globe,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DeepResearch } from "@/components/_components/_tools/deep-research/deep-research";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ChatSearchResults } from "./ChatSearchResults";

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
        >
          {/* Subtle animated background gradient */}
          {call.toolName !== "generateImage" &&
            call.toolName !== "updateUserSettings" && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-pink-400/5 animate-pulse opacity-50" />
            )}

          {call.toolName === "search" && (
            <div className="relative py-3">
              {/* Using our new ChatSearchResults component */}
              <ChatSearchResults
                result={[
                  {
                    query: call.args.query,
                    results: call.result.results || [],
                  },
                ]}
                queries={[call.args.query]}
                annotations={[]}
              />
            </div>
          )}

          {call.toolName === "generateImage" && (
            <div className="space-y-6">
              {/* Loading state for generateImage */}
              {!call.result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 space-y-6"
                >
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <motion.div
                      className="absolute inset-0 w-20 h-20 rounded-3xl border-4 border-purple-500/30"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-black/80 dark:text-white/80">
                      Creating Your Image
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Bringing your vision to life with AI artistry...
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Success: Display image with enhanced styling */}
              {call.result && call.result.success && call.result.imageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative group w-fit mx-auto"
                >
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10">
                    {call.result.isHtmlWrapper ? (
                      <iframe
                        src={call.result.imageUrl}
                        title={call.args.prompt}
                        className="w-auto h-auto max-h-96 max-w-full"
                      />
                    ) : (
                      <img
                        src={call.result.imageUrl}
                        alt={call.args.prompt}
                        className="w-auto h-auto max-h-96 max-w-full object-contain"
                      />
                    )}

                    {/* Enhanced overlay with better positioning */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </div>

                  {/* Floating action buttons */}
                  <motion.div
                    className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                  >
                    <motion.button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = call.result.imageUrl;
                        link.download = `generated-image-${Date.now()}.${
                          call.result.isHtmlWrapper ? "html" : "png"
                        }`;
                        link.click();
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-2xl bg-black/80 hover:bg-black/90 transition-all duration-200 backdrop-blur-sm"
                      title="Download"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        window.open(call.result.imageUrl, "_blank");
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-2xl bg-black/80 hover:bg-black/90 transition-all duration-200 backdrop-blur-sm"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-5 h-5 text-white" />
                    </motion.button>
                  </motion.div>

                  {/* Image caption */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-black/5 to-transparent dark:from-white/5 border border-black/5 dark:border-white/5"
                  >
                    <p className="text-sm text-black/70 dark:text-white/70 italic text-center">
                      "{call.args.prompt}"
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* Enhanced error state */}
              {call.result && !call.result.success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-3xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/50 dark:border-red-800/50"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-red-500/20">
                      <Zap className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
                        Generation Failed
                      </h3>
                      <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
                        {call.result.error}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {call.toolName === "startDeepResearch" && (
            <div className="relative p-6">
              <motion.div
                className="flex items-center gap-4 mb-6"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative">
                  {call.result ? (
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                      <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                  {call.result && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <span className="text-lg font-semibold text-black/80 dark:text-white/80">
                    {call.result
                      ? "Deep Research Initiated"
                      : "Starting Deep Research"}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      Topic:{" "}
                      <em className="font-medium text-black/80 dark:text-white/80">
                        "{call.args.topic || call.args.query || "topic"}"
                      </em>
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* When result is available render progress component */}
              {call.result && call.result.type === "deep-research" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <DeepResearch request={call.result} />
                </motion.div>
              )}
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
