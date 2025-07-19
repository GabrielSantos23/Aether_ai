"use client";
import { useIsMobile } from "./use-mobile";
import { useState, useEffect, useCallback } from "react";

export function useSidebar() {
  const isMobile = useIsMobile();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isMobile) {
      const saved = localStorage.getItem("t2chat-sidebar-open");
      setSidebarOpen(saved === null || saved === "true");
    } else {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => {
      const newState = !open;
      if (typeof window !== "undefined" && !isMobile) {
        localStorage.setItem("t2chat-sidebar-open", newState.toString());
      }
      return newState;
    });
  }, [isMobile]);

  return { sidebarOpen, toggleSidebar, isDesktop: !isMobile };
}
