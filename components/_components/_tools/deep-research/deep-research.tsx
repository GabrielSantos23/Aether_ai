"use client";

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ExternalLink, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeepResearchRequest {
  type: "deep-research";
  query: string;
  depth: number;
}

export function DeepResearch({ request }: { request: DeepResearchRequest }) {
  const startResearch = useAction(api.deepResearch.startDeepResearch);
  const getStatus = useAction(api.deepResearch.getResearchStatus);

  const [status, setStatus] = useState<
    "idle" | "starting" | "pending" | "in_progress" | "completed" | "failed"
  >("idle");
  const [eventId, setEventId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Kick off the research job on mount
  useEffect(() => {
    let polling: NodeJS.Timeout;

    const initiate = async () => {
      try {
        setStatus("starting");
        const { eventId: evId } = await startResearch({
          query: request.query,
          depth: request.depth,
        });
        setEventId(evId);
        setStatus("pending");

        // Poll for status every 5s
        polling = setInterval(async () => {
          try {
            const res = await getStatus({ eventId: evId });
            setStatus(res.status);
            if (res.status === "completed" && res.result?.pdfUrl) {
              setPdfUrl(res.result.pdfUrl);
              clearInterval(polling);
            }
            if (res.status === "failed") {
              setError(res.lastError ?? "Research failed");
              clearInterval(polling);
            }
          } catch (err) {
            console.error(err);
          }
        }, 5000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to start research"
        );
        setStatus("failed");
      }
    };

    initiate();

    return () => {
      if (polling) clearInterval(polling);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-6 bg-red-50 dark:bg-red-900 max-w-[600px]">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-300">
          <XCircle className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Deep Research Error</h3>
        </div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (status === "completed" && pdfUrl) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-6 bg-gray-100 dark:bg-gray-800 max-w-[600px]">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-green-500" />
          <h3 className="text-lg font-semibold">Research Completed</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Your deep research report is ready. Click the link below to download
          the PDF.
        </p>
        <Button asChild className="mt-2 w-fit">
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" /> View PDF
          </a>
        </Button>
      </div>
    );
  }

  // Pending / in progress states
  return (
    <div className="flex flex-col gap-4 rounded-2xl p-6 bg-gray-100 dark:bg-gray-800 max-w-[600px] animate-pulse">
      <div className="flex items-center gap-3">
        <Loader2
          className={cn("w-6 h-6", status === "in_progress" && "animate-spin")}
        />
        <h3 className="text-lg font-semibold">Deep Research In Progress</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-300">
        Gathering information and generating your report… This may take a few
        minutes.
      </p>
    </div>
  );
}
