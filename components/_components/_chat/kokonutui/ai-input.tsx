"use client";

import type React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/app/hooks/resize-textarea";
import {
  Paperclip,
  Globe,
  ChevronDown,
  Sparkles,
  Lightbulb,
  Plus,
  Square,
  X,
  FileText,
  Image,
  Upload,
  Send,
  FlaskConical,
  Mic,
  Eye,
  Code,
  MountainIcon,
  Phone,
  AudioLines,
  Book,
  Loader2Icon,
  ArrowUp,
  Telescope,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  getProviderColor,
  getVendorColor,
  ModelInfo,
  models,
} from "@/lib/models";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface Attachment {
  name: string;
  type: string;
  size: number;
  url: string;
}

interface AIInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSend?: (
    message: string,
    model: string,
    options: { webSearch?: boolean; imageGen?: boolean; research?: boolean }
  ) => void;
  isTyping?: boolean;
  onStop?: () => void;
  messagesLength: number;
  isStreaming?: boolean;
  selectedModel: ModelInfo;
  setSelectedModel: (model: ModelInfo) => void;
  isSignedIn: boolean;
  uploadButton?: React.ReactNode;
  attachments?: Attachment[];
  onRemoveAttachment?: (index: number) => void;
  uploadProgress?: { [key: string]: number };
  isUploading?: boolean;
  mounted?: boolean;
  sendBehavior?: "enter" | "shiftEnter" | "button";
  onVoiceChatToggle?: () => void;
  displayModelSelect?: boolean;
}

export default function AIInput({
  value,
  onValueChange,
  onSend,
  isStreaming,
  isTyping,
  onStop,
  messagesLength,
  selectedModel,
  setSelectedModel,
  isSignedIn,
  uploadButton,
  attachments = [],
  onRemoveAttachment,
  uploadProgress = {},
  isUploading = false,
  mounted = true,
  sendBehavior = "enter",
  onVoiceChatToggle,
  displayModelSelect = true,
}: AIInputProps) {
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [thinkingEnabled, setThinkingEnabled] = useState(true);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [imageGenEnabled, setImageGenEnabled] = useState(false);
  const [researchEnabled, setResearchEnabled] = useState(false);
  const [groupBy, setGroupBy] = useState<"provider" | "vendor">("provider");
  const [isDragOver, setIsDragOver] = useState(false);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 240,
  });
  const uploadButtonRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const originalTextRef = useRef("");

  const disabledModels = useQuery(api.api_keys.getDisabledModels) || [];

  const hasGeminiKey =
    useQuery(api.api_keys.hasApiKeyForProvider, { provider: "gemini" }) ??
    false;
  const hasGroqKey =
    useQuery(api.api_keys.hasApiKeyForProvider, { provider: "groq" }) ?? false;
  const hasOpenRouterKey =
    useQuery(api.api_keys.hasApiKeyForProvider, { provider: "openrouter" }) ??
    false;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let final_transcript = "";
      let interim_transcript = "";

      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }

      onValueChange(
        originalTextRef.current + final_transcript + interim_transcript
      );
      adjustHeight();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onValueChange, adjustHeight]);

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      originalTextRef.current = value ? value + " " : "";
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const isModelAvailable = (model: ModelInfo) => {
    if (disabledModels.includes(model.id)) {
      return false;
    }

    if (!isSignedIn && !model.isFree) {
      return false;
    }

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

  const availableModels = models.filter(isModelAvailable);

  const supportsAttachments =
    selectedModel.attachmentsSuppport.image ||
    selectedModel.attachmentsSuppport.pdf;
  const maxFiles = 2;

  useEffect(() => {
    const savedThinkingEnabled = localStorage.getItem("thinkingEnabled");
    if (savedThinkingEnabled !== null) {
      setThinkingEnabled(savedThinkingEnabled === "true");
    }

    const savedWebSearchEnabled = localStorage.getItem("webSearchEnabled");
    if (savedWebSearchEnabled !== null) {
      setWebSearchEnabled(savedWebSearchEnabled === "true");
    }

    const savedImageGenEnabled = localStorage.getItem("imageGenEnabled");
    if (savedImageGenEnabled !== null) {
      setImageGenEnabled(savedImageGenEnabled === "true");
    }

    const savedResearchEnabled = localStorage.getItem("researchEnabled");
    if (savedResearchEnabled !== null) {
      setResearchEnabled(savedResearchEnabled === "true");
    }

    const savedGroupBy = localStorage.getItem("groupBy");
    if (savedGroupBy === "provider" || savedGroupBy === "vendor") {
      setGroupBy(savedGroupBy);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("thinkingEnabled", thinkingEnabled.toString());
  }, [thinkingEnabled]);

  useEffect(() => {
    localStorage.setItem("webSearchEnabled", webSearchEnabled.toString());
  }, [webSearchEnabled]);

  useEffect(() => {
    localStorage.setItem("imageGenEnabled", imageGenEnabled.toString());
  }, [imageGenEnabled]);

  useEffect(() => {
    localStorage.setItem("researchEnabled", researchEnabled.toString());
  }, [researchEnabled]);

  useEffect(() => {
    localStorage.setItem("groupBy", groupBy);
  }, [groupBy]);

  useEffect(() => {
    if (!isModelAvailable(selectedModel) && availableModels.length > 0) {
      setSelectedModel(availableModels[0]);
    }
  }, [selectedModel, availableModels, setSelectedModel]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (supportsAttachments && attachments.length < maxFiles) {
        setIsDragOver(true);
      }
    },
    [supportsAttachments, attachments.length, maxFiles]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!supportsAttachments || attachments.length >= maxFiles) return;

      const files = Array.from(e.dataTransfer.files);
      const remainingSlots = maxFiles - attachments.length;
      const filesToAdd = files.slice(0, remainingSlots);

      const supportedFiles = filesToAdd.filter((file) => {
        const isImage =
          selectedModel.attachmentsSuppport.image &&
          file.type.startsWith("image/");
        const isPdf =
          selectedModel.attachmentsSuppport.pdf &&
          file.type === "application/pdf";
        return isImage || isPdf;
      });

      if (uploadButtonRef.current && supportedFiles.length > 0) {
        const button =
          uploadButtonRef.current.querySelector('input[type="file"]');

        if (button) {
          const dt = new DataTransfer();
          supportedFiles.forEach((file) => dt.items.add(file));
          (button as HTMLInputElement).files = dt.files;
          button.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    },
    [supportsAttachments, attachments.length, maxFiles, selectedModel]
  );

  const handleSend = () => {
    if (value.trim() && onSend && !isTyping) {
      onSend(value.trim(), selectedModel.id, {
        webSearch: webSearchEnabled,
        imageGen: imageGenEnabled,
        research: researchEnabled,
      });
      if (messagesLength === 0) {
        setTimeout(() => {
          onValueChange("");
          adjustHeight(true);
        }, 750);
      } else {
        onValueChange("");
        adjustHeight(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (sendBehavior === "enter" && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (
      sendBehavior === "shiftEnter" &&
      e.key === "Enter" &&
      e.shiftKey
    ) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleThinkingToggle = (enabled: boolean) => {
    setThinkingEnabled(enabled);

    if (!enabled && selectedModel.supportsThinking) {
      const nonThinkingModel = availableModels.find((m) => !m.supportsThinking);
      if (nonThinkingModel) {
        setSelectedModel(nonThinkingModel);
      }
    }
  };

  const groupedModels = models.reduce(
    (acc, model) => {
      const groupKey = groupBy === "provider" ? model.provider : model.vendor;
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(model);
      return acc;
    },
    {} as Record<string, ModelInfo[]>
  );

  const sortedGroupedModels = Object.entries(groupedModels)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce(
      (acc, [groupKey, groupModels]) => {
        const sortedModels = groupModels.sort((a, b) => {
          if (groupBy === "provider") {
            if (a.vendor !== b.vendor) {
              return a.vendor.localeCompare(b.vendor);
            }
          }
          return a.name.localeCompare(b.name);
        });
        acc[groupKey] = sortedModels;
        return acc;
      },
      {} as Record<string, ModelInfo[]>
    );

  return (
    <TooltipProvider>
      <div
        className={cn(
          "relative w-full max-w-4xl mx-auto p-2 bg-background md:bg-muted/90 backdrop-blur-sm rounded-3xl shadow-xs border border-border",
          isDragOver && "border-primary/30 bg-primary/5"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm rounded-2xl border-2 border-dashed border-primary/50">
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium text-primary">
                Drop files here ({maxFiles - attachments.length} remaining)
              </p>
            </div>
          </div>
        )}

        {(attachments.length > 0 || isUploading) && (
          <div className="flex flex-wrap gap-2 p-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center relative group/attachment"
              >
                <div className="relative size-16 rounded-sm overflow-hidden">
                  {attachment.type.startsWith("image/") ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="size-16 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="size-16 rounded-sm bg-card flex items-center justify-center">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {onRemoveAttachment && (
                  <Button
                    onClick={() => onRemoveAttachment(index)}
                    size="icon"
                    className="rounded-full size-5 absolute -top-2 -right-2"
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
            ))}

            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div
                key={`uploading-${fileName}`}
                className="flex items-center relative group/attachment"
              >
                <div className="relative size-16 rounded-sm overflow-hidden bg-card/80 flex items-center justify-center">
                  <Loader2Icon className="size-6 animate-spin text-primary" />
                  <div className="absolute bottom-1 left-1 right-1 h-1 bg-primary/20 rounded-full">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          disabled={isTyping}
          className="text-primary min-h-[44px] w-full resize-none border-none bg-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 p-2"
          rows={1}
        />

        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-1 md:gap-2">
            <div className={cn("relative", !displayModelSelect && "hidden")}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowModelSelect(!showModelSelect)}
                    className={cn(
                      "h-8 px-3 text-xs md:text-sm transition-all duration-200 rounded-full border",
                      "bg-background",
                      "flex items-center gap-1.5",
                      "text-muted-foreground",
                      "hover:text-foreground",
                      "hover:bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full bg-gradient-to-r",
                        getVendorColor(
                          mounted ? selectedModel.vendor : models[0].vendor
                        )
                      )}
                    />
                    <span className="truncate max-w-[80px] md:max-w-[120px]">
                      {mounted ? selectedModel.name : models[0].name}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        showModelSelect && "transform rotate-180"
                      )}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Select Model</TooltipContent>
              </Tooltip>

              <AnimatePresence>
                {showModelSelect && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute z-50 bottom-full mb-2 left-0 bg-popover rounded-lg border border-border shadow-2xl overflow-hidden w-[280px]"
                  >
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-popover-foreground">
                          Select Model
                        </h3>
                        <Link href="/settings?tab=models">
                          <Button variant="outline" size="sm">
                            BYOK
                            <Plus className="w-3 h-3 text-primary ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="px-3 py-2 border-b border-border">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-popover-foreground">
                            Thinking
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleThinkingToggle(!thinkingEnabled);
                            }}
                            className={cn(
                              "relative w-8 h-4 rounded-full transition-colors duration-200",
                              thinkingEnabled ? "bg-primary" : "bg-muted"
                            )}
                          >
                            <div
                              className={cn(
                                "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200",
                                thinkingEnabled
                                  ? "translate-x-4"
                                  : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-popover-foreground">
                            Group by
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setGroupBy(
                                groupBy === "provider" ? "vendor" : "provider"
                              );
                            }}
                            className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-muted/80 transition-colors duration-200 w-16 text-center"
                          >
                            {groupBy === "provider" ? "Provider" : "Vendor"}
                          </button>
                        </div>
                      </div>
                    </div>

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
                            <div className="flex items-center gap-1.5 mb-1.5 px-1.5">
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
                                {groupKey === "openrouter"
                                  ? "OpenRouter"
                                  : groupKey}
                              </span>
                              <span className="text-xs text-muted-foreground/80">
                                ({groupModels.length})
                              </span>
                            </div>
                            <div className="space-y-1">
                              {groupModels
                                .filter(
                                  (model) => !disabledModels.includes(model.id)
                                )
                                .map((model) => (
                                  <button
                                    key={model.id}
                                    onClick={() => {
                                      if (isModelAvailable(model)) {
                                        setSelectedModel(model);
                                        setShowModelSelect(false);
                                      }
                                    }}
                                    className={cn(
                                      "group w-full p-1.5 rounded-md transition-all duration-150 text-left",
                                      selectedModel.id === model.id
                                        ? "text-primary bg-primary/10"
                                        : "hover:text-primary hover:bg-muted text-muted-foreground",
                                      !thinkingEnabled &&
                                        model.supportsThinking &&
                                        "opacity-40 cursor-not-allowed",
                                      !isModelAvailable(model) &&
                                        "opacity-40 cursor-not-allowed"
                                    )}
                                    disabled={
                                      (!thinkingEnabled &&
                                        model.supportsThinking) ||
                                      !isModelAvailable(model)
                                    }
                                    title={
                                      !isModelAvailable(model)
                                        ? model.isApiKeyOnly
                                          ? `Requires ${model.provider} API key`
                                          : !isSignedIn && !model.isFree
                                            ? "Sign in required"
                                            : "Not available"
                                        : !thinkingEnabled &&
                                            model.supportsThinking
                                          ? "Enable thinking mode to use this model"
                                          : undefined
                                    }
                                  >
                                    <div className="flex items-center justify-between relative z-10">
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <span className="text-sm truncate">
                                          {model.name}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        {model.features.includes("web") && (
                                          <Tooltip>
                                            <TooltipTrigger
                                              asChild
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              <Globe className="w-3.5 h-3.5" />
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                              Web search
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                        {model.features.includes("vision") && (
                                          <Tooltip>
                                            <TooltipTrigger
                                              asChild
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                              Vision
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                        {model.attachmentsSuppport.image && (
                                          <Tooltip>
                                            <TooltipTrigger
                                              asChild
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              <Paperclip className="w-3.5 h-3.5" />
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                              Image attachments
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isSignedIn &&
              (selectedModel.attachmentsSuppport.image ||
                selectedModel.attachmentsSuppport.pdf) && (
                <div ref={uploadButtonRef}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>{uploadButton}</div>
                    </TooltipTrigger>
                    <TooltipContent side="top">Attach files</TooltipContent>
                  </Tooltip>
                </div>
              )}

            {isSignedIn && selectedModel.features.includes("web") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={cn(
                      "h-8 rounded-full",
                      webSearchEnabled &&
                        "text-primary hover:text-primary border-primary"
                    )}
                  >
                    <Globe className="size-4 mr-1" />
                    <span className="text-sm">Search</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {webSearchEnabled
                    ? "Disable web search"
                    : "Enable web search"}
                </TooltipContent>
              </Tooltip>
            )}

            {isSignedIn && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResearchEnabled(!researchEnabled)}
                    className={cn(
                      "h-8 rounded-full",
                      researchEnabled &&
                        "text-primary hover:text-primary border-primary"
                    )}
                  >
                    <Telescope className="size-4 mr-1" />
                    <span className="text-sm">Research</span>
                    <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-1 hidden md:block">
                      BETA
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {researchEnabled ? "Disable research" : "Enable research"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleListening}
                  className={cn(
                    "h-8 w-8 rounded-full",
                    isListening &&
                      "text-primary hover:text-primary border-primary"
                  )}
                >
                  <Mic className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isListening ? "Stop voice input" : "Start voice input"}
              </TooltipContent>
            </Tooltip>

            {isStreaming ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={onStop}
                    className="h-8 w-8 rounded-full"
                  >
                    <Square className="size-4 fill-current" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Stop generation</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handleSend}
                    disabled={isStreaming || !value.trim()}
                    className="h-8 w-8 rounded-full"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Send message</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

interface WelcomeScreenProps extends AIInputProps {
  onPromptClick: (prompt: string) => void;
}

const promptsByCategory = {
  Create: [
    "Create three images of a blonde haired black moustached man that get progressively more unhinged",
    "Generate an image of someone generating an image of a cat",
    "Design a futuristic cityscape with flying cars",
    "Create a logo for a sustainable coffee shop",
    "Write a short story about time travel",
    "Design a minimalist poster for a music festival",
    "Create a character design for a sci-fi game",
    "Write a poem about artificial intelligence",
  ],
  Explore: [
    "How does AI work?",
    "What would happen if you fell into a black hole?",
    "Explain quantum physics simply",
    "What is consciousness?",
    "How big is the universe?",
    "What causes the northern lights?",
    "Are we alone in the universe?",
    "How do dreams work?",
  ],
  Code: [
    "Help me debug this React component",
    "Explain APIs in simple terms",
    "What programming language should I learn first?",
    "How do you optimize website performance?",
    "Create a simple Python script for data analysis",
    "Explain the difference between SQL and NoSQL",
    "How do you implement authentication in a web app?",
    "What are the best practices for clean code?",
  ],
  Learn: [
    "How do you learn a new language effectively?",
    "What makes a good password?",
    "How do you overcome procrastination?",
    "What are some healthy meal prep ideas?",
    "How do you build good habits?",
    "What makes a great leader?",
    "How do you manage your time effectively?",
    "What are the best study techniques?",
  ],
} as const;

const NAV_ITEMS = [
  { name: "Create", icon: <Sparkles className="w-4 h-4" /> },
  { name: "Explore", icon: <Globe className="w-4 h-4" /> },
  { name: "Code", icon: <Code className="w-4 h-4" /> },
  { name: "Learn", icon: <Book className="w-4 h-4" /> },
] as const;

function PromptItem({
  prompt,
  onClick,
}: {
  prompt: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group p-4 cursor-pointer transition-all duration-200 ease-out relative overflow-hidden",
        "bg-background md:bg-transparent hover:bg-muted rounded-lg border"
      )}
    >
      <div className="flex flex-col items-start text-left relative z-10 text-sm leading-relaxed group-hover:text-foreground text-muted-foreground transition-colors duration-200">
        {prompt}
      </div>
    </div>
  );
}

export function WelcomeScreen({
  onPromptClick,
  ...inputProps
}: WelcomeScreenProps) {
  const [activeTab, setActiveTab] =
    useState<keyof typeof promptsByCategory>("Create");

  const [displayPrompts, setDisplayPrompts] = useState<string[]>([]);

  const isTyping = (inputProps.value || "").trim().length > 0;

  useEffect(() => {
    const categoryPrompts = promptsByCategory[activeTab];
    const shuffled = [...categoryPrompts].sort(() => 0.5 - Math.random());
    setDisplayPrompts(shuffled.slice(0, 4));
  }, [activeTab]);

  useEffect(() => {
    const categoryPrompts = promptsByCategory[activeTab];
    const shuffled = [...categoryPrompts].sort(() => 0.5 - Math.random());
    setDisplayPrompts(shuffled.slice(0, 4));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: -20,
        scale: 0.9,
        transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] },
      }}
      transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className="absolute inset-0 z-0 flex flex-col items-center justify-start p-6 pt-32 md:pt-40 pb-24"
    >
      <h2 className="text-lg md:text-2xl font-semibold mb-6 text-center">
        What's on your mind?
      </h2>

      <div className="w-full max-w-3xl mb-10">
        {
          <AIInput
            {...(inputProps as AIInputProps)}
            displayModelSelect={false}
          />
        }
      </div>

      {!isTyping && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.name}
              onClick={() =>
                setActiveTab(item.name as keyof typeof promptsByCategory)
              }
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 relative",
                activeTab === item.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border hover:bg-muted"
              )}
            >
              <span className="text-xs">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>
      )}

      {!isTyping && (
        <div className="max-w-2xl w-full">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col gap-2"
          >
            {displayPrompts.map((prompt, i) => (
              <motion.div
                key={`${prompt}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <PromptItem
                  prompt={prompt}
                  onClick={() => onPromptClick(prompt)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
