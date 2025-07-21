import React from "react";
import { Loader2, NotebookPen } from "lucide-react";
import { motion } from "framer-motion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ChatSearchResults } from "./ChatSearchResults";
import { ChatResearchResults } from "./ChatResearchResults";
import { Fragment } from "react/jsx-runtime";
import { match } from "ts-pattern";
import { ChatImageResult } from "./chat-image-result";

interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: any;
  result?: any;
}

function ToolCallWrapper({
  children,
  toolCall,
  index,
}: {
  children: React.ReactNode;
  toolCall: ToolCall;
  index: number;
}) {
  const shouldWrap = ![
    "search",
    "generateImage",
    "updateUserSettings",
  ].includes(toolCall.toolName);

  const content = (
    <motion.div
      key={toolCall.toolCallId}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={
        shouldWrap
          ? "relative overflow-hidden rounded-3xl bg-gradient-to-br from-black/5 via-black/3 to-transparent dark:from-white/5 dark:via-white/3 border border-black/10 dark:border-white/10 backdrop-blur-sm"
          : ""
      }
    >
      {shouldWrap && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-pink-400/5 animate-pulse opacity-50" />
      )}
      {children}
    </motion.div>
  );

  return content;
}

function UpdateUserSettingsCall({ toolCall }: { toolCall: ToolCall }) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/50 cursor-help">
          {toolCall.result ? (
            <NotebookPen className="w-4 h-4" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          <span>
            {toolCall.result
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
          {toolCall.args && Object.keys(toolCall.args).length > 0 ? (
            <div className="space-y-1 flex flex-col justify-start items-start">
              {Object.entries(toolCall.args).map(([key, value]) => (
                <div key={key} className="text-xs text-muted-foreground">
                  <strong>{key}:</strong>{" "}
                  {Array.isArray(value) ? value.join(", ") : String(value)}
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
  );
}

function ToolCallPart({
  toolCall,
  index,
}: {
  toolCall: ToolCall;
  index: number;
}) {
  return (
    <ToolCallWrapper toolCall={toolCall} index={index}>
      {match(toolCall)
        .with({ toolName: "search" }, (call) => (
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
        ))
        .with({ toolName: "generateImage" }, (call) => (
          <div className="space-y-6">
            <ChatImageResult result={call.result} prompt={call.args.prompt} />
          </div>
        ))
        .with({ toolName: "startDeepResearch" }, (call) => (
          <div className="relative p-6">
            <ChatResearchResults
              id={call.toolCallId}
              request={call.result}
              done={call.result !== null}
            />
          </div>
        ))
        .with({ toolName: "research" }, (call) => (
          <div className="relative p-6">
            <ChatResearchResults
              id={call.toolCallId}
              request={call.result}
              done={call.result !== null}
            />
          </div>
        ))
        .with({ toolName: "updateUserSettings" }, (call) => (
          <UpdateUserSettingsCall toolCall={call} />
        ))
        .otherwise(() => null)}
    </ToolCallWrapper>
  );
}

const ToolCallDisplay = ({ toolCalls }: { toolCalls: ToolCall[] }) => {
  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  // Determine if any tool call is currently loading
  const isAnyToolCallLoading = toolCalls.some((call) => !call.result);

  return (
    <div className="mt-6 space-y-6">
      {/* Render tool calls using pattern matching */}
      {toolCalls.map((toolCall, index) => (
        <Fragment key={toolCall.toolCallId}>
          <ToolCallPart toolCall={toolCall} index={index} />
        </Fragment>
      ))}
    </div>
  );
};

export default ToolCallDisplay;
