import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

const sanitizeText = (text: string) => {
  let sanitizedText = text.replace(
    /```[\s\S]*?```/g,
    "a code block is shown here."
  );
  sanitizedText = sanitizedText.replace(/`[^`]+`/g, "");
  sanitizedText = sanitizedText.replace(/!\[.*?\]\(.*?\)/g, "");
  sanitizedText = sanitizedText.replace(/\[(.*?)\]\(.*?\)/g, "$1");
  sanitizedText = sanitizedText.replace(/(\*\*|__|\*|_)(.*?)\1/g, "$2");
  sanitizedText = sanitizedText.replace(/^#+\s/gm, "");
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
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      if (availableVoices.length > 0) {
        const googleUSVoice = availableVoices.find(
          (v) =>
            v.name.includes("Google") &&
            (v.lang === "en-US" || v.lang.startsWith("en-US"))
        );

        const googleEnglishVoice = availableVoices.find(
          (v) => v.name.includes("Google") && v.lang.startsWith("en")
        );

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

    loadVoices();

    const voicesChangedHandler = () => loadVoices();
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      voicesChangedHandler
    );

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

      isStopped.current = false;

      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        onEnd();
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
