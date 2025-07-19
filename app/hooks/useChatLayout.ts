"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "./useSidebar";
import { useConversations } from "./useConversations";
import { useTouch } from "./useTouch";
import { useChatSearch } from "./useChatSearch";
import { useChatGroups } from "./useChatGroups";
import { ConvexChat } from "@/lib/types";

export function useChatLayout(initialChats?: ConvexChat[] | null) {
  const [mounted, setMounted] = useState(false);
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const {
    chats: activeChats,
    currentChatId,
    deleteConversation,
    unmigratedLocalChats,
  } = useConversations(undefined, undefined, initialChats);
  const router = useRouter();

  const { onTouchStart, onTouchMove, onTouchEnd } = useTouch({
    onSwipeLeft: () => sidebarOpen && toggleSidebar(),
  });

  const { searchQuery, setSearchQuery, filteredChats } = useChatSearch(
    activeChats || []
  );
  const { groupedChats } = useChatGroups(filteredChats);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConversationSelect = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const createNewChat = () => {
    router.push(`/`);
    if (
      typeof window !== "undefined" &&
      window.innerWidth < 768 &&
      sidebarOpen
    ) {
      toggleSidebar();
    }
  };

  const effectiveSidebarOpen = mounted
    ? sidebarOpen
    : typeof window !== "undefined"
      ? window.innerWidth >= 768
      : false;
  const isOnHomePage = !currentChatId;

  return {
    mounted,
    sidebarOpen,
    toggleSidebar,
    effectiveSidebarOpen,
    activeChats,
    currentChatId,
    deleteConversation,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    searchQuery,
    setSearchQuery,
    groupedChats,
    handleConversationSelect,
    createNewChat,
    isOnHomePage,
    unmigratedLocalChats,
  };
}
