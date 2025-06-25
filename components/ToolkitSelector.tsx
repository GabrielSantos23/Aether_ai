import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { clientToolkits, toolkitIds } from "@/lib/toolkits-registry";
import { HardDrive, Plus, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useGoogleDrive } from "@/app/hooks";

interface ToolkitSelectorProps {
  className?: string;
  onToolkitsChange?: (toolkits: string[]) => void;
}

export default function ToolkitSelector({
  className,
  onToolkitsChange,
}: ToolkitSelectorProps) {
  const [selectedToolkits, setSelectedToolkits] = useState<string[]>([]);
  const { isConnected: isGoogleDriveConnected, connect: connectGoogleDrive } =
    useGoogleDrive();
  const router = useRouter();

  const handleToggleToolkit = (toolkitId: string) => {
    setSelectedToolkits((prev) => {
      const newToolkits = prev.includes(toolkitId)
        ? prev.filter((id) => id !== toolkitId)
        : [...prev, toolkitId];

      // Notify parent component of changes
      if (onToolkitsChange) {
        onToolkitsChange(newToolkits);
      }

      return newToolkits;
    });
  };

  // When Google Drive gets connected, automatically select it
  useEffect(() => {
    if (
      isGoogleDriveConnected &&
      !selectedToolkits.includes(toolkitIds.googleDrive)
    ) {
      const newToolkits = [...selectedToolkits, toolkitIds.googleDrive];
      setSelectedToolkits(newToolkits);

      if (onToolkitsChange) {
        onToolkitsChange(newToolkits);
      }
    }
  }, [isGoogleDriveConnected, selectedToolkits, onToolkitsChange]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Google Drive Toolkit */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              if (isGoogleDriveConnected) {
                handleToggleToolkit(toolkitIds.googleDrive);
              } else {
                connectGoogleDrive();
              }
            }}
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center transition-all",
              isGoogleDriveConnected
                ? selectedToolkits.includes(toolkitIds.googleDrive)
                  ? "bg-primary/20 text-primary"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                : "bg-muted/30 text-muted-foreground/50 hover:bg-muted/50"
            )}
          >
            {isGoogleDriveConnected ? (
              <HardDrive className="w-4 h-4" />
            ) : (
              <div className="flex items-center">
                <HardDrive className="w-4 h-4" />
                <Plus className="w-3 h-3 absolute -right-0.5 -top-0.5" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isGoogleDriveConnected
            ? selectedToolkits.includes(toolkitIds.googleDrive)
              ? "Google Drive (Active)"
              : "Google Drive"
            : "Connect Google Drive"}
        </TooltipContent>
      </Tooltip>

      {/* Add more toolkits here as they become available */}
    </div>
  );
}
