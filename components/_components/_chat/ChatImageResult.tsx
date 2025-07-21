import { Download, ExternalLink, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ImageGenerationAnnotation = {
  type: "image_generation";
  data: {
    status: "completed" | "failed" | "in_progress";
    imageUrl?: string;
    prompt?: string;
    error?: string;
  };
};

type ChatImageResultProps = {
  annotations: ImageGenerationAnnotation[];
  result?: {
    success: boolean;
    imageUrl?: string;
    isHtmlWrapper?: boolean;
    error?: string;
  };
  prompt?: string;
  animate?: boolean;
};

export function ChatImageResult({
  annotations,
  result,
  prompt,
  animate = true,
}: ChatImageResultProps) {
  const annotation =
    annotations.length > 0 ? annotations[annotations.length - 1] : null;
  const [isOpen, setIsOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Determine what to display based on available data
  const imageUrl = result?.imageUrl || annotation?.data.imageUrl;
  const imagePrompt = prompt || annotation?.data.prompt || "Generated image";
  const isHtmlWrapper = result?.isHtmlWrapper || false;
  const hasError =
    (!result?.success && result?.error) || annotation?.data.status === "failed";
  const errorMessage =
    result?.error || annotation?.data.error || "Image generation failed";

  // Loading state when no result or annotation status is in_progress
  const isLoading =
    !result && (!annotation || annotation.data.status === "in_progress");

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `generated-image-${Date.now()}.${isHtmlWrapper ? "html" : "png"}`;
    link.click();
  };

  const handleOpenInNewTab = () => {
    if (!imageUrl) return;
    window.open(imageUrl, "_blank");
  };

  if (isLoading) {
    return (
      <motion.div
        initial={animate ? { opacity: 0 } : false}
        animate={animate ? { opacity: 1 } : false}
        className="flex flex-col items-center justify-center py-16 space-y-6"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-purple-600 dark:text-purple-400 animate-spin" />
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
    );
  }

  if (hasError) {
    return (
      <motion.div
        initial={animate ? { opacity: 0, scale: 0.95 } : false}
        animate={animate ? { opacity: 1, scale: 1 } : false}
        className="p-6 rounded-3xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/50 dark:border-red-800/50"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-red-500/20">
            <X className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
              Generation Failed
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
              {errorMessage}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (imageUrl) {
    return (
      <>
        <motion.div
          initial={animate ? { opacity: 0, scale: 0.9 } : false}
          animate={animate ? { opacity: 1, scale: 1 } : false}
          transition={{ duration: 0.5 }}
          className="relative group w-fit mx-auto"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10">
            {isHtmlWrapper ? (
              <iframe
                src={imageUrl}
                title={imagePrompt}
                className="w-auto h-auto max-h-96 max-w-full"
                onClick={() => setIsOpen(true)}
              />
            ) : (
              <div className="cursor-pointer" onClick={() => setIsOpen(true)}>
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
                <img
                  src={imageUrl}
                  alt={imagePrompt}
                  className={cn(
                    "w-auto h-auto max-h-96 max-w-full object-contain",
                    isImageLoading ? "opacity-0" : "opacity-100"
                  )}
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
              </div>
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
              onClick={handleDownload}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-2xl bg-black/80 hover:bg-black/90 transition-all duration-200 backdrop-blur-sm"
              title="Download"
            >
              <Download className="w-5 h-5 text-white" />
            </motion.button>
            <motion.button
              onClick={handleOpenInNewTab}
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
            initial={animate ? { opacity: 0, y: 20 } : false}
            animate={animate ? { opacity: 1, y: 0 } : false}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-black/5 to-transparent dark:from-white/5 border border-black/5 dark:border-white/5"
          >
            <p className="text-sm text-black/70 dark:text-white/70 italic text-center">
              "{imagePrompt}"
            </p>
          </motion.div>
        </motion.div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent
            className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none"
            showCloseButton={false}
          >
            <div className="relative w-full h-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 bg-background/80 hover:bg-background"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" />
              </Button>
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              <img
                src={imageUrl}
                alt={imagePrompt}
                className="w-full h-full object-contain"
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}

export default ChatImageResult;
