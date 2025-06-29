"use client";

import { SidebarInset, SidebarProvider as SidebarProviderCmp } from "@/components/ui/sidebar";
import ChatSidebar from "./ChatSidebar";
import { RightSidebar } from "./RightSidebar";
import { SidebarButtons, SidebarButtonsRight } from "./sidebar-buttons";
import { useState, useContext } from "react";
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

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.myFunctions.getUser);

  if (user === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <ChatHeader />
      <main className="flex-1 overflow-hidden z-20 border-chat-border bg-chat-background transition-[margin-top,height] mt-3.5 h-full border rounded-tl-xl duration-100 ease-snappy has-[.sidebar-check:checked]:mt-0 has-[.sidebar-check:checked]:h-screen has-[.sidebar-check:checked]:rounded-none">
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

      <div className="pointer-events-auto t3-header-search fixed h-fit left-2 top-2 z-50 flex flex-row gap-0.5 p-1 inset-0 right-auto text-muted-foreground rounded-md backdrop-blur-sm transition-[width] delay-125 duration-100 bg-sidebar blur-fallback:bg-sidebar max-sm:delay-125 max-sm:duration-100 max-sm:w-[6.75rem] max-sm:bg-sidebar">
        <div className="transition-[opacity, translate-x] has-[.sidebar-check:not(:checked)]:pointer-events-none flex flex-nowrap duration-200 ease-snappy gap-0.5 has-[.sidebar-check:not(:checked)]:-translate-x-[20px] has-[.sidebar-check:not(:checked)]:opacity-0 has-[.sidebar-check:not(:checked)]:w-0 has-[.sidebar-check:not(:checked)]:-z-50 has-[.sidebar-check:not(:checked)]:h-0">
          <input
            className="hidden sidebar-check"
            type="checkbox"
            name="sidebar-check"
          />
          <Button variant="ghost" className="p-0" size="icon">
            <NavLink to="/" className="w-full h-full grid place-items-center">
              <FiPlus />
            </NavLink>
          </Button>
        </div>
      </div>
      <div className="fixed pointer-events-auto right-2 top-2 z-50 flex flex-row p-1 items-center justify-center rounded-md duration-100 transition-[translate-x] ease-snappy max-sm:w-[6.75rem] gap-2 text-muted-foreground has-[.sidebar-check:checked]:bg-sidebar has-[.sidebar-check:checked]:backdrop-blur-sm has-[.sidebar-check:not(:checked)]:bg-transparent">
        <input
          className="hidden sidebar-check"
          type="checkbox"
          name="sidebar-check"
        />
        <NavLink to="/settings/subscription">
          <Button variant="ghost" size="icon">
            <LuSettings2 />
          </Button>
        </NavLink>
        <ThemeToggler />
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

export default function SidebarProvider({ children }: { children?: React.ReactNode }) {
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
        <SidebarButtons />
        <ChatSidebar />
        <SidebarInset className="overflow-hidden">
          <ChatLayoutContent>{children}</ChatLayoutContent>
        </SidebarInset>
      </SidebarProviderCmp>
    </SourcesContext.Provider>
  );
}
