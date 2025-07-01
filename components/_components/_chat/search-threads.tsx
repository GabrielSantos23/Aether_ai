"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/search-dialog";
import { Input } from "@/components/ui/input";
import { Search, Slash, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DialogOverlay,
  DialogPortal,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import { RxSlash } from "react-icons/rx";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import DevInput from "@/components/global-cmp/dev-input";
import { IoMdClose } from "react-icons/io";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/app/hooks/use-debounce";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface Chat {
  _id: Id<"chats">;
  title: string;
  isPinned?: boolean;
  userId: Id<"users">;
  createdAt: number;
  updatedAt: number;
}

export default function SearchThreads({
  isSidebar = false,
}: {
  isSidebar?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const createChat = useMutation(api.chat.mutations.createChat);

  // Query for searching chats using Convex
  const searchResults = useQuery(api.chat.actions.searchChats, {
    searchQuery: debouncedSearchQuery,
  });

  const handleChatSelect = (chatId: Id<"chats">) => {
    router.push(`/chat/${chatId}`);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleNewChat = async () => {
    try {
      // Create a new chat with a default title
      const chatId = await createChat({ title: "New chat" });
      
      if (chatId) {
        // Navigate to the new chat
        router.push(`/chat/${chatId}`);
        setIsOpen(false);
        setSearchQuery("");
      } else {
        toast.error("Failed to create new chat");
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create new chat");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !searchQuery.trim()) {
      handleNewChat();
    }
  };

  // Reset search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Add keyboard shortcut listener (Ctrl+K or Command+K)
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev); // Toggle the dialog state
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, []);

  const filteredResults = searchResults || [];
  const hasResults = filteredResults.length > 0;
  const isLoading = searchResults === undefined;
  const showRecent = !searchQuery.trim() && !isLoading;
  const showSearchResults = searchQuery.trim() && !isLoading;
  const showNoResults = searchQuery.trim() && !isLoading && !hasResults;

  if (isSidebar) {
    return (
      <DevInput
        className="!w-full gap-3"
        icon2={
          searchQuery.length > 0 ? (
            <IoMdClose 
              className="cursor-pointer"
              onClick={() => setSearchQuery("")} 
            />
          ) : null
        }
        placeholder="Search your threads..."
        variant="underline"
        role="searchbox"
        aria-label="Search your threads..."
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        icon={
          isLoading ? (
            <Spinner className="w-3.5 h-3.5 text-muted-foreground ml-1 animate-spin" />
          ) : (
            <FiSearch className="w-3.5 h-3.5 text-muted-foreground ml-1" />
          )
        }
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <FiSearch />
          {/* <kbd className="ml-2 hidden text-xs text-muted-foreground sm:inline-flex items-center gap-1">
            <span className="text-[10px]">{navigator.platform.indexOf("Mac") === 0 ? "⌘" : "Ctrl"}</span>K
          </kbd> */}
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "pointer-events-auto w-full max-w-md rounded-xl bg-popover p-2.5 pt-2 text-secondary-foreground shadow-2xl outline gap-1 outline-border/20 backdrop-blur-md sm:max-w-xl"
        )}
      >
        <DialogHeader className="relative border-b border-chat-border">
          <div className="w-full rounded-t-lg bg-popover">
            <div className="mr-px flex items-center text-[15px] text-muted-foreground justify-between gap-2 pb-2 w-full">
              <div className="w-fit flex items-center">
                <FiSearch />
                <RxSlash className="opacity-20 text-lg" />
                <FiPlus />
              </div>
              <input
                className="outline-none !border-none !bg-transparent flex-1 px-1 pr-12"
                role="searchbox"
                aria-label="Search threads and messages"
                placeholder="Search or press Enter to start new chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {isLoading && (
                <Spinner className="size-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2.5 max-h-[50vh] space-y-2 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4 animate-spin" />
                Searching...
              </div>
            </div>
          )}

          {/* Search Results */}
          {showSearchResults && hasResults && (
            <div className="flex flex-col gap-1">
              <div className="flex w-full items-center justify-start gap-1.5 pl-[3px] text-color-heading text-sm">
                <FiSearch className="size-3" />
                Search Results ({filteredResults.length})
              </div>
              <ul className="flex flex-col gap-0 text-sm text-muted-foreground">
                {filteredResults.map((chat: Chat) => (
                  <li key={chat._id}>
                    <button
                      onClick={() => handleChatSelect(chat._id)}
                      className="w-full text-left block rounded-md px-2.5 py-2 hover:bg-accent/30 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    >
                      <div className="flex items-center gap-2">
                        {chat.isPinned && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                        <span className="truncate">{chat.title}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No Results */}
          {showNoResults && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-sm text-muted-foreground mb-2">
                No threads found for "{searchQuery}"
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="flex items-center gap-2"
              >
                <FiPlus className="size-3" />
                Start new chat
              </Button>
            </div>
          )}

          {/* Recent Chats (when no search query) */}
          {showRecent && (
            <div className="flex flex-col gap-1">
              <div className="flex w-full items-center justify-start gap-1.5 pl-[3px] text-color-heading text-sm">
                <Clock className="size-3" />
                Recent Chats
              </div>
              <ul className="flex flex-col gap-0 text-sm text-muted-foreground">
                {filteredResults.slice(0, 10).map((chat: Chat) => (
                  <li key={chat._id}>
                    <button
                      onClick={() => handleChatSelect(chat._id)}
                      className="w-full text-left block rounded-md px-2.5 py-2 hover:bg-accent/30 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    >
                      <div className="flex items-center gap-2">
                        {chat.isPinned && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                        <span className="truncate">{chat.title}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              
              {/* Add New Chat Button */}
              <div className="mt-2 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewChat}
                  className="flex items-center gap-2 w-full"
                >
                  <FiPlus className="size-3" />
                  Start new chat
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
