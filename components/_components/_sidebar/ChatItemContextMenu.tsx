import { memo } from "react";
import { X, Edit, Share2, MoreVertical } from "lucide-react";
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
import { useState } from "react";

interface ChatItemContextMenuProps {
  children: React.ReactNode;
  chatId: string;
  chatTitle: string;
  isSignedIn: boolean;
  onRename: (chatId: string, currentTitle: string) => void;
  onDelete: (chatId: string) => void;
  onShare?: (chatId: string) => void;
}

export const ChatItemContextMenu = memo(function ChatItemContextMenu({
  children,
  chatId,
  chatTitle,
  isSignedIn,
  onRename,
  onDelete,
  onShare,
}: ChatItemContextMenuProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="relative group/thread">
          {children}

          {/* More options dropdown - visible on hover */}
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/thread:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all duration-150 ease-in-out hover:scale-110 outline-none focus:outline-none"
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
                "border border-border shadow-2xl",
                // Rounded corners
                "rounded-2xl",
                // Padding and sizing
                "p-2 min-w-[180px]",
                // Premium effects
                "relative overflow-hidden"
              )}
            >
              {/* Premium gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-br from-muted/5 via-transparent to-muted/10 pointer-events-none rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-card/10 pointer-events-none rounded-2xl" />

              <div className="relative z-10 space-y-1">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(chatId, chatTitle);
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    "text-foreground hover:text-accent-foreground",
                    "hover:bg-accent focus:bg-accent",
                    "focus:text-accent-foreground",
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

                {isSignedIn && onShare && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(chatId);
                      setDropdownOpen(false);
                    }}
                    className={cn(
                      "text-foreground hover:text-accent-foreground",
                      "hover:bg-accent focus:bg-accent",
                      "focus:text-accent-foreground",
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
                    onDelete(chatId);
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
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-muted/0 via-muted/15 to-muted/0 rounded-2xl blur-2xl opacity-30 pointer-events-none" />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent
        className={cn(
          // Glass morphism background
          "bg-card/90 backdrop-blur-2xl",
          // Border and shadow
          "border border-border shadow-2xl",
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
        <div className="absolute inset-0 bg-gradient-to-br from-muted/5 via-transparent to-muted/10 pointer-events-none rounded-2xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-card/10 pointer-events-none rounded-2xl" />

        <div className="relative z-10 space-y-1">
          <ContextMenuItem
            onClick={() => onRename(chatId, chatTitle)}
            className={cn(
              "text-foreground hover:text-accent-foreground",
              "hover:bg-accent focus:bg-accent",
              "focus:text-accent-foreground",
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

          {isSignedIn && onShare && (
            <ContextMenuItem
              onClick={() => onShare(chatId)}
              className={cn(
                "text-foreground hover:text-accent-foreground",
                "hover:bg-accent focus:bg-accent",
                "focus:text-accent-foreground",
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
            onClick={() => onDelete(chatId)}
            className={cn(
              "text-destructive hover:text-destructive",
              "hover:bg-destructive/10 focus:bg-destructive/10",
              "focus:text-destructive",
              "transition-all duration-150 cursor-pointer",
              "px-3 py-2.5 text-sm font-medium flex items-center gap-3",
              "rounded-xl outline-none ring-0 border-0",
              "focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
            )}
          >
            <X className="w-4 h-4" />
            <span>Delete</span>
          </ContextMenuItem>
        </div>

        {/* Premium glow effect */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-muted/0 via-muted/15 to-muted/0 rounded-2xl blur-2xl opacity-30 pointer-events-none" />
      </ContextMenuContent>
    </ContextMenu>
  );
});
