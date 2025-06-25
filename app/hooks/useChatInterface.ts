"use client";

import { useState } from "react";
import { useConversations } from "./useConversations";
import { useMessageActions } from "./useMessageActions";
import { useScrollToBottom } from "./useScrollToBottom";
import { Attachment, ConvexMessage } from "@/lib/types";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useChatInterface(
  chatId?: string,
  initialMessages?: ConvexMessage[] | null
) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isNewChat, setIsNewChat] = useState(false);
  const [isBranching, setIsBranching] = useState(false);
  const router = useRouter();
  const branchChat = useMutation(api.chat.mutations.branchChat);

  const {
    messages: activeMessages,
    isStreaming,
    handleNewMessage,
    handleRetryMessage,
    handleEditMessage,
    handleStopGeneration,
    currentChatId,
    selectedModel,
    setSelectedModel,
    isAuthenticated,
    mounted,
    userSettings,
  } = useConversations(chatId, initialMessages);

  const handleBranch = async (messageId: string) => {
    if (!currentChatId || isBranching) return;

    try {
      setIsBranching(true);
      const newChatId = await branchChat({
        chatId: currentChatId as Id<"chats">,
        messageId: messageId as Id<"messages">,
      });

      if (newChatId) {
        // Show success message first
        toast.success("Chat branched successfully!");

        // Add a small delay before navigation to ensure Convex has time to process
        setTimeout(() => {
          router.push(`/chat/${newChatId}`);
          setIsBranching(false);
        }, 500);
      } else {
        toast.error("Failed to branch chat: No chat ID returned");
        console.error("Branch operation did not return a valid chat ID");
        setIsBranching(false);
      }
    } catch (error) {
      toast.error("Failed to branch chat.");
      console.error(error);
      setIsBranching(false);
    }
  };

  const messageActions = useMessageActions({
    onRetryMessage: handleRetryMessage,
    onEditMessage: handleEditMessage,
    onBranchMessage: handleBranch,
  });
  const scrollToBottom = useScrollToBottom(activeMessages, isStreaming);

  const handleSend = (
    message: string,
    model: string,
    options: { webSearch?: boolean; imageGen?: boolean; toolkits?: string[] }
  ) => {
    if (message.trim() || attachments.length > 0) {
      const mappedAttachments = attachments.map((a) => ({
        name: a.name,
        type: a.type,
        size: a.size,
        url: a.url,
      }));
      if (!currentChatId) {
        setIsNewChat(true);
      }
      handleNewMessage(message, {
        attachments: mappedAttachments,
        modelId: model,
        webSearch: options.webSearch,
        imageGen: options.imageGen,
        toolkits: options.toolkits,
      });
      setInputValue("");
      setAttachments([]);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  const showWelcomeScreen =
    !isNewChat &&
    !currentChatId &&
    activeMessages.length === 0 &&
    inputValue.length === 0;

  const isCurrentlyStreaming = (messageId: string) => {
    return (
      isStreaming && activeMessages[activeMessages.length - 1]?.id === messageId
    );
  };

  return {
    // State
    inputValue,
    setInputValue,
    isTyping,
    setIsTyping,
    activeMessages,
    isStreaming,
    currentChatId,
    selectedModel,
    setSelectedModel,
    showWelcomeScreen,
    isAuthenticated,
    mounted,
    userSettings,
    isBranching,

    // Attachments
    attachments,
    setAttachments,

    // Actions
    handleSend,
    handlePromptClick,
    handleStopGeneration,
    isCurrentlyStreaming,

    // Message actions
    ...messageActions,

    // Scroll
    ...scrollToBottom,
  };
}
