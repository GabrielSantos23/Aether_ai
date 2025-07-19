import { useMemo, useEffect } from "react";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const useConvexChat = (chatId?: Id<"chats">) => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  const chats = useQuery(
    api.chat.queries.getUserChats,
    isAuthenticated ? {} : "skip"
  );

  const chatExists = useMemo(() => {
    if (!chatId || !chats) return false;
    return chats.some((chat) => chat._id === chatId);
  }, [chatId, chats]);

  const messages = useQuery(
    api.chat.queries.getChatMessages,
    chatId && isAuthenticated && chatExists ? { chatId } : "skip"
  );

  const createChat = useMutation(api.chat.mutations.createChat);
  const sendMessage = useAction(api.chat.actions.sendMessage);
  const retryMessage = useAction(api.chat.actions.retryMessage);
  const editMessageAndRegenerate = useAction(
    api.chat.actions.editMessageAndRegenerate
  );
  const deleteChat = useMutation(api.chat.mutations.deleteChat);
  const updateChatTitle = useMutation(api.chat.mutations.updateChatTitle);
  const deleteMessagesFromIndex = useMutation(
    api.chat.mutations.deleteMessagesFromIndex
  );
  const cancelMessage = useMutation(api.chat.mutations.cancelMessage);
  const editMessage = useMutation(api.chat.mutations.editMessage);

  const isStreaming = useMemo(() => {
    if (!messages) return false;
    const lastMessage = messages[messages.length - 1];
    return lastMessage
      ? lastMessage.role === "assistant" && !lastMessage.isComplete
      : false;
  }, [messages]);

  return {
    isAuthenticated,
    isLoading,
    isStreaming,
    chatExists,

    messages,
    chats,

    createChat,
    sendMessage,
    retryMessage,
    editMessageAndRegenerate,
    deleteChat,
    updateChatTitle,
    deleteMessagesFromIndex,
    cancelMessage,
    editMessage,
  };
};
