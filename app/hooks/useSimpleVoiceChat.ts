import { useState, useEffect, useRef, useCallback } from "react";
import { useSpeechSynthesis } from "./useSpeechSynthesis";

export function useSimpleVoiceChat(
  onSendMessage?: (
    message: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
  ) => Promise<string>
) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  const {
    speak,
    stop: stopSpeech,
    isSpeaking: synthesisSpeaking,
  } = useSpeechSynthesis();
  const recognitionRef = useRef<any>(null);
  const isWaitingForResponse = useRef(false);
  const currentHistoryRef = useRef<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  useEffect(() => {
    currentHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      if (isActive) {
        setIsListening(true);
      }
    };

    recognition.onresult = async (event: any) => {
      if (!isActive) return;

      const transcript = event.results[0][0].transcript;
      setTranscript((prev) => prev + transcript + " ");

      setIsListening(false);
      isWaitingForResponse.current = true;

      try {
        if (!isActive) {
          isWaitingForResponse.current = false;
          return;
        }

        const currentHistory = currentHistoryRef.current;
        const newUserMessage = { role: "user" as const, content: transcript };

        const historyWithUser = [...currentHistory, newUserMessage];
        setConversationHistory(historyWithUser);

        if (onSendMessage && isActive) {
          const aiResponse = await onSendMessage(transcript, currentHistory);

          if (!isActive) {
            isWaitingForResponse.current = false;
            return;
          }

          const aiMessage = { role: "assistant" as const, content: aiResponse };

          setConversationHistory([...historyWithUser, aiMessage]);

          if (isActive) {
            speak(aiResponse, () => {
              isWaitingForResponse.current = false;
              if (isActive) {
                setTimeout(() => {
                  if (recognitionRef.current && isActive) {
                    try {
                      recognitionRef.current.start();
                    } catch (error) {}
                  }
                }, 500);
              }
            });
          } else {
            isWaitingForResponse.current = false;
          }
        } else if (isActive) {
          setTimeout(() => {
            if (!isActive) return;

            const aiResponse = `I heard you say: "${transcript}". This is a mock response.`;
            const aiMessage = {
              role: "assistant" as const,
              content: aiResponse,
            };

            setConversationHistory([...historyWithUser, aiMessage]);

            if (isActive) {
              speak(aiResponse, () => {
                isWaitingForResponse.current = false;
                if (isActive) {
                  setTimeout(() => {
                    if (recognitionRef.current && isActive) {
                      try {
                        recognitionRef.current.start();
                      } catch (error) {}
                    }
                  }, 500);
                }
              });
            } else {
              isWaitingForResponse.current = false;
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Error getting AI response:", error);
        isWaitingForResponse.current = false;
        if (isActive) {
          setTimeout(() => {
            if (recognitionRef.current && isActive) {
              try {
                recognitionRef.current.start();
              } catch (error) {}
            }
          }, 1000);
        }
      }
    };

    recognition.onerror = () => {
      if (isActive) {
        setIsListening(false);
        if (isActive && !isWaitingForResponse.current) {
          setTimeout(() => {
            if (recognitionRef.current && isActive) {
              try {
                recognitionRef.current.start();
              } catch (error) {}
            }
          }, 1000);
        }
      }
    };

    recognition.onend = () => {
      if (isActive) {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
  }, [isActive, speak, onSendMessage]);

  useEffect(() => {
    setIsSpeaking(synthesisSpeaking);
  }, [synthesisSpeaking]);

  useEffect(() => {
    if (!isActive) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {}
      }

      stopSpeech();

      setIsListening(false);
      isWaitingForResponse.current = false;
    }
  }, [isActive, stopSpeech]);

  const startVoiceChat = useCallback(() => {
    setIsActive(true);
    setTranscript("");
    setConversationHistory([]);
    currentHistoryRef.current = [];

    setTimeout(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {}
      }
    }, 100);
  }, []);

  const endVoiceChat = useCallback(() => {
    setIsActive(false);
    setIsListening(false);
    isWaitingForResponse.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {}
    }

    stopSpeech();

    return transcript;
  }, [transcript, stopSpeech]);

  return {
    isActive,
    isListening,
    isSpeaking,
    transcript,
    conversationHistory,
    startVoiceChat,
    endVoiceChat,
    isSupported: !!recognitionRef.current,
  };
}
