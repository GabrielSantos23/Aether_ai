"use client";
import { memo, useState } from "react";
import { X, Edit, Share2, GitFork, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
interface ChatItemProps {
  chat: {
    id: string;
    title: string;
    isBranch?: boolean;
  };
  currentChatId: string | null;
  totalChats: number;
  isSignedIn: boolean;
  onSelect: (chatId: string) => void;
  onDelete: (chatId: string) => void;
  onRename: (chatId: string, currentTitle: string) => void;
  onShare: (chatId: string) => void;
}
export const ChatItem = memo(function ChatItem({
  chat,
  currentChatId,
  totalChats,
  isSignedIn,
  onSelect,
  onDelete,
  onRename,
  onShare,
}: ChatItemProps) {
  const isActive = chat.id === currentChatId;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onClick={() => onSelect(chat.id)}
            className={cn(
              "group px-3 py-2.5 cursor-pointer transition-all duration-150 ease-[0.25,1,0.5,1] relative overflow-hidden",
              isActive
                ? "text-foreground"
                : "hover:text-foreground text-muted-foreground"
            )}
          >
            {/* Premium background for active state */}
            {isActive && (
              <>
                {/* Main gradient background with sharp edges */}
                <div className="absolute inset-0 bg-accent"></div>
                {/* Top shadow lighting */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                {/* Bottom shadow lighting */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                {/* Premium inner glow */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-gradient-to-r from-transparent via-accent/50 to-transparent blur-sm"></div>
              </>
            )}
            {/* Hover effect for non-active items */}
            {!isActive && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-[0.25,1,0.5,1]">
                {/* Main gradient background with sharp edges */}
                <div className="absolute inset-0 bg-accent/50"></div>
                {/* Top shadow lighting */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                {/* Bottom shadow lighting */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                {/* Premium inner glow */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-gradient-to-r from-transparent via-accent/30 to-transparent blur-sm"></div>
              </div>
            )}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {chat.isBranch && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <GitFork className="w-3 h-3 flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Branched conversation
                    </TooltipContent>
                  </Tooltip>
                )}
                <div className="text-sm max-w-[100px] truncate text-ellipsis">
                  {chat.title}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* More options dropdown - visible on mobile, hover on desktop */}
                <DropdownMenu
                  open={dropdownOpen}
                  onOpenChange={setDropdownOpen}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 -m-1 text-muted-foreground hover:text-foreground transition-all duration-150 ease-[0.25,1,0.5,1] hover:scale-110 outline-none focus:outline-none"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">More options</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    className={cn(
                      // Glass morphism background
                      "bg-card/90 backdrop-blur-2xl",
                      // Border and shadow
                      "border border-border shadow-2xl shadow-black/10",
                      // Rounded corners
                      "rounded-2xl",
                      // Padding and sizing
                      "p-2 min-w-[180px]",
                      // Premium effects
                      "relative overflow-hidden"
                    )}
                  >
                    {/* Premium gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent/30 pointer-events-none rounded-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-card/10 pointer-events-none rounded-2xl" />
                    <div className="relative z-10 space-y-1">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onRename(chat.id, chat.title);
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          "text-card-foreground hover:text-foreground",
                          "hover:bg-accent focus:bg-accent",
                          "focus:text-foreground",
                          "transition-all duration-150 cursor-pointer",
                          "px-3 py-2.5 text-sm font-medium flex items-center gap-3",
                          "rounded-xl outline-none ring-0 border-0",
                          // Remove any focus rings or blue colors
                          "focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
                        )}
                      >
                        <Edit className="w-4 h-4" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      {isSignedIn && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onShare(chat.id);
                            setDropdownOpen(false);
                          }}
                          className={cn(
                            "text-card-foreground hover:text-foreground",
                            "hover:bg-accent focus:bg-accent",
                            "focus:text-foreground",
                            "transition-all duration-150 cursor-pointer",
                            "px-3 py-2.5 text-sm font-medium flex items-center gap-3",
                            "rounded-xl outline-none ring-0 border-0",
                            // Remove any focus rings or blue colors
                            "focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
                          )}
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="my-2 mx-2 h-px bg-gradient-to-r from-transparent via-border to-transparent border-0" />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(chat.id);
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          "text-destructive hover:text-destructive",
                          "hover:bg-destructive/10 focus:bg-destructive/10",
                          "focus:text-destructive",
                          "transition-all duration-150 cursor-pointer",
                          "px-3 py-2.5 text-sm font-medium flex items-center gap-3",
                          "rounded-xl outline-none ring-0 border-0",
                          // Remove any focus rings or blue colors
                          "focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
                        )}
                      >
                        <X className="w-4 h-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </div>
                    {/* Premium glow effect */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-accent/0 via-accent/15 to-accent/0 rounded-2xl blur-2xl opacity-30 pointer-events-none" />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent
          className={cn(
            // Glass morphism background
            "bg-card/90 backdrop-blur-2xl",
            // Border and shadow
            "border border-border shadow-2xl shadow-black/10",
            // Rounded corners
            "rounded-2xl",
            // Padding and sizing
            "p-2 min-w-[200px]",
            // Animation override
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            // Premium effects
            "relative overflow-hidden"
          )}
        >
          {/* Premium gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent/30 pointer-events-none rounded-2xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-card/10 pointer-events-none rounded-2xl" />
          <div className="relative z-10 space-y-1">
            <ContextMenuItem
              onClick={() => onRename(chat.id, chat.title)}
              className={cn(
                "text-card-foreground hover:text-foreground",
                "hover:bg-accent focus:bg-accent",
                "focus:text-foreground",
                "transition-all duration-150 cursor-pointer",
                "px-3 py-2.5 text-sm font-medium flex items-center gap-3",
                "rounded-xl outline-none ring-0 border-0",
                // Remove any focus rings or blue colors
                "focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
              )}
            >
              <Edit className="w-4 h-4" />
              <span>Rename</span>
            </ContextMenuItem>
            {isSignedIn && (
              <ContextMenuItem
                onClick={() => onShare(chat.id)}
                className={cn(
                  "text-card-foreground hover:text-foreground",
                  "hover:bg-accent focus:bg-accent",
                  "focus:text-foreground",
                  "transition-all duration-150 cursor-pointer",
                  "px-3 py-2.5 text-sm font-medium flex items-center gap-3",
                  "rounded-xl outline-none ring-0 border-0",
                  // Remove any focus rings or blue colors
                  "focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
                )}
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </ContextMenuItem>
            )}
            <ContextMenuSeparator className="my-2 mx-2 h-px bg-gradient-to-r from-transparent via-border to-transparent border-0" />
            <ContextMenuItem
              onClick={() => onDelete(chat.id)}
              className={cn(
                "text-destructive hover:text-destructive",
                "hover:bg-destructive/10 focus:bg-destructive/10",
                "focus:text-destructive",
                "transition-all duration-150 cursor-pointer",
                "px-3 py-2.5 text-sm font-medium flex items-center gap-3",
                "rounded-xl outline-none ring-0 border-0",
                // Remove any focus rings or blue colors
                "focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
              )}
            >
              <X className="w-4 h-4" />
              <span>Delete</span>
            </ContextMenuItem>
          </div>
          {/* Premium glow effect */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-accent/0 via-accent/15 to-accent/0 rounded-2xl blur-2xl opacity-30 pointer-events-none" />
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
});
