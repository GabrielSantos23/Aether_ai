"use client";

import { ProgressSection } from "@/components/progress-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { deepResearchOrchestrator } from "@/trigger/deepResearch";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRealtimeTaskTrigger } from "@trigger.dev/react-hooks";
import { Search, Telescope } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ModelSelectDropdown from "@/components/_components/_chat/ModelSelectDropdown";
import { models, ModelInfo } from "@/lib/models";
import { z } from "zod";

export const ProgressMetadataSchema = z.object({
  status: z.object({
    progress: z.number(),
    label: z.string(),
  }),
  pdfName: z.string().optional(),
});

export type ProgressMetadata = z.infer<typeof ProgressMetadataSchema>;

export function parseStatus(data: unknown): ProgressMetadata {
  return ProgressMetadataSchema.parse(data);
}

export function DeepResearchAgent({ triggerToken }: { triggerToken: string }) {
  const [prompt, setPrompt] = useState("");
  // Default to first research-capable model
  const researchModels: ModelInfo[] = models.filter(
    (m) => m.canResearch || m.features.includes("web")
  );

  const [selectedModel, setSelectedModel] = useState<ModelInfo>(
    researchModels[0]
  );
  const [promptError, setPromptError] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<string[]>([]);

  const triggerInstance = useRealtimeTaskTrigger<
    typeof deepResearchOrchestrator
  >("deep-research", {
    accessToken: triggerToken,
    baseURL: process.env.NEXT_PUBLIC_TRIGGER_API_URL,
  });

  const run = triggerInstance.run;

  const saveResearchReport = useMutation(api.research.saveResearchReport);

  const CDN_BASE =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "https://cu4tu2si8y.ufs.sh/f"; // default UploadThing CDN

  const { progress, label, pdfTitle } = (() => {
    if (run?.metadata) {
      const { status, pdfName } = parseStatus(run.metadata);
      return {
        progress: status.progress,
        label: status.label,
        pdfTitle: pdfName || "",
      };
    }
    return { progress: 0, label: " ", pdfTitle: "" };
  })();

  useEffect(() => {
    if (!run?.metadata) return;
    const { status } = parseStatus(run.metadata);
    setActivityLog((prev) => {
      if (prev[prev.length - 1] !== status.label) {
        return [...prev, status.label].slice(-50);
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.metadata]);

  // Save completed research to Convex once per run
  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (run && run.status === "COMPLETED" && pdfTitle && !hasSavedRef.current) {
      hasSavedRef.current = true;
      saveResearchReport({
        prompt,
        pdfKey: pdfTitle,
        pdfUrl: `${CDN_BASE}/${pdfTitle}`,
      }).catch((err) => {
        console.error("Failed to save research report:", err);
      });
    }
  }, [run?.status, pdfTitle, prompt, CDN_BASE, saveResearchReport]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (prompt.length < 30) {
      setPromptError("Research prompt must be at least 30 characters.");
      return;
    }

    setPromptError(null);
    triggerInstance.submit({ prompt, modelId: selectedModel.id });
  };

  const isSubmitDisabled = prompt.length < 30 || prompt.length > 1000;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 flex place-items-center justify-center">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Telescope className="w-8 h-8" />
          <h1 className="text-4xl font-bold">Deep Research Agent</h1>
        </div>

        <Card className="pt-6">
          <CardContent className="space-y-6">
            {!run && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="prompt"
                    className="text-lg font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    What would you like to research?
                  </label>
                  <Textarea
                    id="prompt"
                    placeholder="Enter your research question or topic here..."
                    className="min-h-[120px] resize-none"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Describe what you'd like to research. Your prompt must be at
                    least 30 characters long.
                  </p>
                  {promptError && (
                    <p className="text-sm font-medium text-destructive">
                      {promptError}
                    </p>
                  )}
                </div>
                <div className="pt-2">
                  <ModelSelectDropdown
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    isSignedIn={true}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full max-w-56"
                >
                  <Search className="w-4 h-4" />
                  Start Deep Research
                </Button>
              </form>
            )}

            {run && run.status !== "COMPLETED" && (
              <>
                <ProgressSection
                  prompt={prompt}
                  status={run?.status || " "}
                  progress={progress}
                  message={label}
                />

                {/* Transparency activity log */}
                {activityLog.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border border-border rounded-lg p-3 space-y-1 text-xs mt-4 bg-muted/30">
                    {activityLog.map((log, idx) => (
                      <div key={idx} className="break-words">
                        {log.match(/https?:\/\/[\w./?=#%-]+/g)
                          ? log
                              .split(/(https?:\/\/[\w./?=#%-]+)/g)
                              .map((part, i) =>
                                /https?:\/\/[\w./?=#%-]+/.test(part) ? (
                                  <a
                                    key={i}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline"
                                  >
                                    {part}
                                  </a>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )
                          : log}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {run && run.status === "COMPLETED" && (
              <div className="space-y-4 text-center">
                <h3 className="text-2xl font-bold">Research Complete!</h3>
                <p className="font-semibold"> "{prompt}"</p>
                <p>
                  Your detailed research report is ready. You can view and
                  download it now.
                </p>

                <Button asChild>
                  <a
                    href={`${CDN_BASE}/${pdfTitle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Final Report
                  </a>
                </Button>
              </div>
            )}

            {run?.status === "FAILED" && (
              <div className="space-y-4 text-center">
                <h3 className="text-2xl font-bold text-destructive">
                  Research Failed
                </h3>
                <p>Unfortunately, the research could not be completed.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
