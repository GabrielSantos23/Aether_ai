"use client";

import React, { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Lightbulb, Plus } from "lucide-react";
import Link from "next/link";
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
    const checkbox = document.querySelector(
      'input[name="sidebar-check"]'
    ) as HTMLInputElement | null;

    if (!checkbox) return;
    setIsSidebarOpen(checkbox.checked);

    const onChange = () => setIsSidebarOpen(checkbox.checked);
    checkbox.addEventListener("change", onChange);
    return () => checkbox.removeEventListener("change", onChange);
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

    if (model.supportsThinking)
      tags.push(
        <Badge key="thinking" variant="secondary">
          Thinking
        </Badge>
      );
    if (model.features.includes("vision"))
      tags.push(
        <Badge key="vision" variant="secondary">
          Vision
        </Badge>
      );
    if (model.toolCalls)
      tags.push(
        <Badge key="tools" variant="secondary">
          Tools
        </Badge>
      );
    if (model.isPro)
      tags.push(
        <Badge
          key="pro"
          className="bg-orange-500 text-white"
          variant="secondary"
        >
          Pro
        </Badge>
      );

    return (
      <div className="p-4 max-w-sm space-y-2">
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
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-10 px-2.5 text-xs transition-all duration-200 bg-sidebar border rounded-2xl",
            "flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-accent",
            isSidebarOpen && "ml-32"
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

      <DropdownMenuContent className="w-72">
        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-popover-foreground">
              Select Model
            </h3>
            <Link
              href="/settings?tab=models"
              className="flex items-center gap-1 text-primary text-xs"
            >
              BYOK <Plus className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-3">
          {/* Thinking toggle */}
          <div className="flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs">Thinking</span>
            <button
              onClick={() => setThinkingEnabled((p) => !p)}
              className={cn(
                "relative w-8 h-4 rounded-full transition-colors duration-200",
                thinkingEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200",
                  thinkingEnabled ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Group by */}
          <div className="flex items-center gap-2">
            <span className="text-xs">Group by</span>
            <button
              onClick={() =>
                setGroupBy(groupBy === "provider" ? "vendor" : "provider")
              }
              className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 w-16 text-center"
            >
              {groupBy === "provider" ? "Provider" : "Vendor"}
            </button>
          </div>
        </div>

        {/* Model list */}
        <div
          className="max-h-[300px] overflow-y-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "hsl(var(--primary)) transparent",
          }}
        >
          {Object.entries(sortedGroupedModels).map(
            ([groupKey, groupModels]) => (
              <div
                key={groupKey}
                className="p-2 border-b border-border last:border-b-0"
              >
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
                    .map((model) => (
                      <DropdownMenuSub key={model.id}>
                        <DropdownMenuSubTrigger
                          disabled={!isModelAvailable(model)}
                          className={cn(
                            "group w-full p-1.5 text-left relative overflow-hidden text-sm truncate",
                            selectedModel.id === model.id
                              ? "text-primary"
                              : "text-muted-foreground hover:text-primary",
                            !isModelAvailable(model) &&
                              "opacity-40 cursor-not-allowed"
                          )}
                          onClick={(e) => {
                            // Prevent menu close when just opening the submenu on hover
                            if (!isModelAvailable(model)) return;
                            // If user actively clicks, select model & close menu
                            setSelectedModel(model);
                            setOpen(false);
                            e.stopPropagation();
                          }}
                        >
                          {model.name}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {renderModelInfo(model)}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    ))}
                </div>
              </div>
            )
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
