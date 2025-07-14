import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

const sanitizeText = (text: string) => {
  // Remove code blocks
  let sanitizedText = text.replace(
    /```[\s\S]*?```/g,
    "a code block is shown here."
  );
  // Remove inline code
  sanitizedText = sanitizedText.replace(/`[^`]+`/g, "");
  // Remove markdown images
  sanitizedText = sanitizedText.replace(/!\[.*?\]\(.*?\)/g, "");
  // Remove markdown links
  sanitizedText = sanitizedText.replace(/\[(.*?)\]\(.*?\)/g, "$1");
  // Remove bold, italics
  sanitizedText = sanitizedText.replace(/(\*\*|__|\*|_)(.*?)\1/g, "$2");
  // Remove headings
  sanitizedText = sanitizedText.replace(/^#+\s/gm, "");
  // Remove horizontal rules
  sanitizedText = sanitizedText.replace(/---/g, "");

  return sanitizedText.trim();
};

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isStopped = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      // Speech synthesis is not supported in this environment.
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Always prioritize Google voices for better quality
      if (availableVoices.length > 0) {
        // First try to find Google US English voices (highest priority)
        const googleUSVoice = availableVoices.find(
          (v) =>
            v.name.includes("Google") &&
            (v.lang === "en-US" || v.lang.startsWith("en-US"))
        );

        // Then try any Google English voice
        const googleEnglishVoice = availableVoices.find(
          (v) => v.name.includes("Google") && v.lang.startsWith("en")
        );

        // Fallback to any English voice
        const englishVoice = availableVoices.find((v) =>
          v.lang.startsWith("en")
        );

        const storedVoiceURI = localStorage.getItem("selectedVoiceURI");
        const storedVoice = storedVoiceURI
          ? availableVoices.find((v) => v.voiceURI === storedVoiceURI)
          : null;
        const isStoredVoiceGoogle =
          storedVoice?.name.includes("Google") ?? false;

        const preferredVoice =
          (isStoredVoiceGoogle && storedVoice) ||
          googleUSVoice ||
          googleEnglishVoice ||
          englishVoice;

        if (preferredVoice) {
          setSelectedVoice(preferredVoice.voiceURI);
          localStorage.setItem("selectedVoiceURI", preferredVoice.voiceURI);
        }
      }
    };

    // Some browsers (especially on Linux) never fire the 'voiceschanged' event.
    // We attempt to load voices immediately and, if none are returned, poll until we get some
    loadVoices();

    const voicesChangedHandler = () => loadVoices();
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      voicesChangedHandler
    );

    // If no voices are available yet, keep polling until they load or we give up after ~5 seconds
    let pollingInterval: NodeJS.Timeout | null = null;
    if (window.speechSynthesis.getVoices().length === 0) {
      let elapsed = 0;
      pollingInterval = setInterval(() => {
        elapsed += 250;
        if (window.speechSynthesis.getVoices().length > 0 || elapsed > 5000) {
          loadVoices();
          if (pollingInterval) clearInterval(pollingInterval);
        }
      }, 250);
    }

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        voicesChangedHandler
      );
      if (pollingInterval) clearInterval(pollingInterval);
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  const stop = useCallback(() => {
    isStopped.current = true;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string, onEnd: () => void) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        console.warn("Speech synthesis is not supported in this environment.");
        toast.error("Speech synthesis is not supported in this environment.");
        onEnd();
        return;
      }

      // Reset stopped flag when starting new speech
      isStopped.current = false;

      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        onEnd(); // Ensure onEnd is called when stopping
        return;
      }

      const sanitizedText = sanitizeText(text);
      const utterance = new SpeechSynthesisUtterance(sanitizedText);

      if (voices.length === 0) {
        toast.error(
          "No speech synthesis voices are available in this browser."
        );
      }

      if (selectedVoice) {
        const voice = voices.find((v) => v.voiceURI === selectedVoice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onstart = () => {
        if (!isStopped.current) {
          setIsSpeaking(true);
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (!isStopped.current) {
          onEnd();
        }
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error", event);
        toast.error(
          "Failed to read the message aloud. Your browser may not support speech synthesis or no voices are installed."
        );
        setIsSpeaking(false);
        if (!isStopped.current) {
          onEnd();
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [selectedVoice, voices, isSpeaking]
  );

  const setVoice = (voiceURI: string) => {
    setSelectedVoice(voiceURI);
    localStorage.setItem("selectedVoiceURI", voiceURI);
  };

  return {
    voices,
    selectedVoice,
    setVoice,
    speak,
    stop,
    isSpeaking,
  };
}
