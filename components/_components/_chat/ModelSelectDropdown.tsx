"use client";

import React, { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { models, ModelInfo, getVendorColor } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ModelSelectDropdownProps {
  selectedModel: ModelInfo;
  setSelectedModel: (model: ModelInfo) => void;
  isSignedIn: boolean;
  mounted?: boolean;
}

export default function ModelSelectDropdown({
  selectedModel,
  setSelectedModel,
  isSignedIn,
  mounted = true,
}: ModelSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [thinkingEnabled, setThinkingEnabled] = useState(true);
  const [groupBy, setGroupBy] = useState<"provider" | "vendor">("provider");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewModel, setPreviewModel] = useState<ModelInfo | null>(null);

  // Reset preview when menu closes
  useEffect(() => {
    if (!open) setPreviewModel(null);
  }, [open]);

  /* -------------------------------- Providers -------------------------------- */
  const disabledModels =
    useQuery(api.api_keys.getDisabledModels, isSignedIn ? {} : "skip") || [];
  const hasGeminiKey =
    useQuery(api.api_keys.hasApiKeyForProvider, {
      provider: "gemini",
    }) ?? false;
  const hasGroqKey =
    useQuery(api.api_keys.hasApiKeyForProvider, { provider: "groq" }) ?? false;
  const hasOpenRouterKey =
    useQuery(api.api_keys.hasApiKeyForProvider, {
      provider: "openrouter",
    }) ?? false;

  /* ----------------------------- Sidebar offset ------------------------------ */
  useEffect(() => {
    const checkSidebarState = () => {
      const sidebarCheckbox = document.querySelector(
        'input[name="sidebar-check"]'
      ) as HTMLInputElement;
      if (sidebarCheckbox) {
        setIsSidebarOpen(sidebarCheckbox.checked);
      }
    };

    // Initial check
    checkSidebarState();

    // Setup mutation observer to watch for checkbox changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "checked"
        ) {
          checkSidebarState();
        }
      });
    });

    const sidebarCheckbox = document.querySelector(
      'input[name="sidebar-check"]'
    ) as HTMLInputElement;
    if (sidebarCheckbox) {
      observer.observe(sidebarCheckbox, { attributes: true });
    }

    // Also listen for click events on the sidebar trigger
    const handleClick = () => {
      setTimeout(checkSidebarState, 50); // Small delay to ensure checkbox state has updated
    };

    document.addEventListener("click", handleClick);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleClick);
    };
  }, []);

  /* ----------------------------- Helper functions ---------------------------- */
  const isModelAvailable = (model: ModelInfo) => {
    if (disabledModels.includes(model.id)) return false;
    if (!isSignedIn && !model.isFree) return false;

    if (model.isApiKeyOnly) {
      switch (model.provider) {
        case "gemini":
          return hasGeminiKey;
        case "groq":
          return hasGroqKey;
        case "openrouter":
          return hasOpenRouterKey;
        default:
          return false;
      }
    }
    return true;
  };

  /* ------------------------------ Grouped models ----------------------------- */
  const groupedModels = models.reduce<Record<string, ModelInfo[]>>((acc, m) => {
    const key = groupBy === "provider" ? m.provider : m.vendor;
    acc[key] = acc[key] ? [...acc[key], m] : [m];
    return acc;
  }, {});

  const sortedGroupedModels = Object.entries(groupedModels)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce<Record<string, ModelInfo[]>>((acc, [k, v]) => {
      const sorted = v.sort((a, b) => {
        if (groupBy === "provider" && a.vendor !== b.vendor) {
          return a.vendor.localeCompare(b.vendor);
        }
        return a.name.localeCompare(b.name);
      });
      acc[k] = sorted;
      return acc;
    }, {});

  /* --------------------------------- Render --------------------------------- */
  const renderModelInfo = (model: ModelInfo) => {
    const tags: React.ReactNode[] = [];
    const styles = "bg-sidebar rounded-2xl border border-border";

    if (model.supportsThinking)
      tags.push(
        <Badge key="thinking" variant="secondary" className={styles}>
          Thinking
        </Badge>
      );
    if (model.features.includes("vision"))
      tags.push(
        <Badge key="vision" variant="secondary" className={styles}>
          Vision
        </Badge>
      );
    if (model.toolCalls)
      tags.push(
        <Badge key="tools" variant="secondary" className={styles}>
          Tools
        </Badge>
      );
    if (model.isPro)
      tags.push(
        <Badge key="pro" className={`${styles} `} variant="secondary">
          Pro
        </Badge>
      );

    return (
      <div className="p-4 max-w-sm space-y-2 ">
        <div className="text-sm font-semibold">{model.name}</div>
        {model.description && (
          <p className="text-xs text-muted-foreground leading-snug">
            {model.description}
          </p>
        )}
        {tags.length > 0 && <div className="flex flex-wrap gap-1">{tags}</div>}
        {!model.isFree && (
          <span className="text-xs text-muted-foreground block pt-1">
            {model.isPro ? "5 credit(s) per message" : "Paid"}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`relative`}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "h-10 px-2.5 text-xs transition-all duration-200 bg-sidebar border rounded-2xl",
              "flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-accent",
              isSidebarOpen && "ml-32 mt-2",
              !isSidebarOpen && "ml-2 mt-5"
            )}
          >
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-2 h-2 rounded-full bg-gradient-to-r",
                  getVendorColor(
                    mounted ? selectedModel.vendor : models[0].vendor
                  )
                )}
              />
              <span className="truncate max-w-[300px]">
                {mounted ? selectedModel.name : models[0].name}
              </span>
            </div>
            <ChevronsUpDown
              className={cn(
                "w-3 h-3 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-72 bg-sidebar rounded-2xl p-0 relative overflow-visible"
          onMouseLeave={() => setPreviewModel(null)}
        >
          {/* Model list */}
          <div
            className="max-h-[300px] overflow-y-auto p-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "hsl(var(--primary)) transparent",
            }}
          >
            {Object.entries(sortedGroupedModels).map(
              ([groupKey, groupModels]) => (
                <div key={groupKey} className="pb-2 last:pb-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full bg-gradient-to-r",
                        getVendorColor(
                          groupBy === "provider"
                            ? groupModels[0]?.provider || groupKey
                            : groupKey
                        )
                      )}
                    />
                    <span className="text-xs font-medium text-muted-foreground capitalize">
                      {groupKey === "openrouter" ? "OpenRouter" : groupKey}
                    </span>
                    <span className="text-xs text-muted-foreground/80">
                      ({groupModels.length})
                    </span>
                  </div>

                  <div className="space-y-1">
                    {groupModels
                      .filter((m) => !disabledModels.includes(m.id))
                      .map((model) => {
                        const disabled = !isModelAvailable(model);
                        return (
                          <button
                            key={model.id}
                            disabled={disabled}
                            onMouseEnter={() => setPreviewModel(model)}
                            onFocus={() => setPreviewModel(model)}
                            onClick={() => {
                              if (disabled) return;
                              setSelectedModel(model);
                              setOpen(false);
                            }}
                            className={cn(
                              "w-full text-left p-1.5 text-sm truncate rounded-2xl transition-colors",
                              selectedModel.id === model.id
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-primary hover:bg-accent/40",
                              disabled && "opacity-40 cursor-not-allowed"
                            )}
                          >
                            {model.name}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Preview panel (absolute, outside dropdown width) */}
          {previewModel && (
            <div className="absolute left-full top-0 ml-2 w-64 z-50 border border-border rounded-2xl bg-sidebar shadow-lg">
              {renderModelInfo(previewModel)}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
