"use client";

import {
  SidebarInset,
  SidebarProvider as SidebarProviderCmp,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import ChatSidebar from "./ChatSidebar";
import { useState, useContext, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
// Define the Source type
export type Source = {
  id: string;
  title: string;
  content: string;
  url?: string;
};
import React from "react";
import ChatHeader from "@/components/_components/_chat/chat-header";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { LuSettings2 } from "react-icons/lu";
import ThemeToggler from "@/components/theme-toggle";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import SearchThreads from "../_chat/search-threads";
import SidebarLogo from "@/components/sidebar-logo";

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.myFunctions.getUser);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  if (user === undefined) {
    return <div>Loading...</div>;
  }

  useEffect(() => {
    const checkSidebarState = () => {
      const sidebarCheckbox = document.querySelector(
        'input[name="sidebar-check"]'
      ) as HTMLInputElement;
      if (sidebarCheckbox) {
        setIsSidebarOpen(sidebarCheckbox.checked);
      }
    };

    checkSidebarState();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "checked"
        ) {
          checkSidebarState();
        }
      });
    });

    const sidebarCheckbox = document.querySelector(
      'input[name="sidebar-check"]'
    ) as HTMLInputElement;
    if (sidebarCheckbox) {
      observer.observe(sidebarCheckbox, { attributes: true });
    }

    const handleClick = () => {
      setTimeout(checkSidebarState, 50);
    };

    document.addEventListener("click", handleClick);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-sidebar">
      <ChatHeader />
      <main className="flex-1 overflow-hidden z-20  bg-background transition-[margin-top,height] mt-3.5 h-full border rounded-tl-xl duration-100 ease-snappy has-[.sidebar-check:checked]:mt-0 has-[.sidebar-check:checked]:h-screen has-[.sidebar-check:checked]:rounded-none">
        <input
          className="hidden sidebar-check"
          type="checkbox"
          name="sidebar-check"
        />
        <div className="h-full overflow-y-auto">{children}</div>
        <div className="max-w-3xl relative mx-auto w-full">
          {/* <ChatInput /> */}
        </div>
      </main>

      <div
        className={`pointer-events-auto t3-header-search fixed h-fit left-2 top-4 z-50 flex flex-row gap-0.5 p-1 inset-0 right-auto text-muted-foreground ${
          isSidebarOpen
            ? "rounded-2xl border bg-sidebar justify-end "
            : "rounded-md "
        } backdrop-blur-sm transition-[width] delay-125 duration-100 blur-fallback:bg-sidebar max-sm:delay-125 max-sm:duration-100 max-sm:w-[6.75rem] max-sm:bg-sidebar`}
      >
        <SidebarTrigger className="rounded-xl hover:bg-muted" />
        <div
          className={`transition-[opacity, translate-x] has-[.sidebar-check:not(:checked)]:pointer-events-none  flex flex-nowrap duration-200 ease-snappy gap-0.5 has-[.sidebar-check:not(:checked)]:-translate-x-[20px] has-[.sidebar-check:not(:checked)]:opacity-0 has-[.sidebar-check:not(:checked)]:w-0 has-[.sidebar-check:not(:checked)]:-z-50 has-[.sidebar-check:not(:checked)]:h-0 `}
        >
          <input
            className="hidden sidebar-check"
            type="checkbox"
            name="sidebar-check"
          />

          <SearchThreads />
          <NavLink
            to="/"
            className="w-full h-full grid place-items-center rounded-xl hover:bg-muted p-2"
          >
            <FiPlus />
          </NavLink>
          <div id="model-select-container" className="ml-1" />
        </div>
      </div>

      <div
        className={`fixed pointer-events-auto right-2 top-2 z-50 flex flex-row p-1 items-center justify-center ${isSidebarOpen ? "rounded-2xl border bg-sidebar" : "rounded-md"} duration-100 transition-[translate-x] ease-snappy max-sm:w-[6.75rem] gap-2 text-muted-foreground has-[.sidebar-check:checked]:backdrop-blur-sm has-[.sidebar-check:not(:checked)]:bg-transparent`}
      >
        <NavLink to="/settings">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-muted "
          >
            <LuSettings2 />
          </Button>
        </NavLink>
        <ThemeToggler className="rounded-xl hover:bg-muted" />
      </div>
    </div>
  );
}

function getLocalStorageItem(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage:`, error);
    return defaultValue;
  }
}

const SIDEBAR_STORAGE_KEY = "sidebar_state";

export const SourcesContext = React.createContext<{
  sources: Source[];
  setActiveSources: (sources: Source[]) => void;
}>({
  sources: [],
  setActiveSources: () => {},
});

export const useSources = () => useContext(SourcesContext);

export default function SidebarProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [defaultOpen] = useState(() =>
    getLocalStorageItem(`${SIDEBAR_STORAGE_KEY}_left`, true)
  );

  const [sources, setSources] = useState<Source[]>([]);

  return (
    <SourcesContext.Provider
      value={{
        sources,
        setActiveSources: setSources,
      }}
    >
      <SidebarProviderCmp defaultOpen={defaultOpen}>
        <ChatSidebar />
        <SidebarInset className="overflow-hidden">
          <ChatLayoutContent>{children}</ChatLayoutContent>
        </SidebarInset>
      </SidebarProviderCmp>
    </SourcesContext.Provider>
  );
}
