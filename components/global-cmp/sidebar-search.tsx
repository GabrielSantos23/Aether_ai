'use client'
import React, { useState, useRef, useEffect } from "react";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { FiSearch, FiClock } from "react-icons/fi";
import DevInput from "./dev-input";
import { useDebounce } from "@/app/hooks/use-debounce";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useNavigate } from "react-router";

interface Chat {
  _id: Id<"chats">;
  userId: Id<"users">;
  title: string;
  createdAt: number;
  updatedAt: number;
  isShared?: boolean;
  shareId?: string;
  isGeneratingTitle?: boolean;
  isBranch?: boolean;
}

const SidebarSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const navigate = useNavigate();
  const searchResults = useQuery(api.chat.actions.searchChats, {
    searchQuery: debouncedSearchQuery,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isDropdownOpen || !searchResults) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0 && searchResults[selectedIndex]) {
            handleChatSelect(searchResults[selectedIndex]);
          }
          break;
        case "Escape":
          setIsDropdownOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isDropdownOpen, searchResults, selectedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsDropdownOpen(value.length > 0);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    if (searchQuery.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    navigate(`/chat/${chat._id}`);
    setSearchQuery("");
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const shouldShowDropdown = isDropdownOpen && searchQuery.length > 0;

  return (
    <SidebarMenuItem>
      <div className="relative w-full" ref={dropdownRef}>
        <DevInput
          ref={inputRef}
          className="!w-full gap-3"
          placeholder="Search your chats..."
          variant="underline"
          icon={<FiSearch className="w-3.5 h-3.5 text-muted-foreground ml-1" />}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          autoComplete="off"
        />
        
        {shouldShowDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-64 overflow-y-auto">
            {searchResults === undefined && (
              <div className="flex items-center justify-center gap-2 py-4 px-3">
                <div className="w-4 h-4 border-2 border-input border-t-primary rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Searching...</span>
              </div>
            )}
            
            {searchResults && searchResults.length === 0 && (
              <div className="py-4 px-3 text-center">
                <span className="text-sm text-gray-500">No chats found</span>
              </div>
            )}
            
            {searchResults && searchResults.length > 0 && (
              <div className="py-1">
                {searchResults.map((chat: Chat, index: number) => (
                  <div
                    key={chat._id}
                    className={`px-3 py-2 cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? "bg-input "
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => handleChatSelect(chat)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {chat.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <FiClock className="w-3 h-3" />
                          <span>{formatDate(chat.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarMenuItem>
  );
};

export default SidebarSearch;