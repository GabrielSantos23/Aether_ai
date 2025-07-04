"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useConversations } from "@/app/hooks/useConversations";
import { useIsMobile } from "@/app/hooks/use-mobile";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Conversation, db } from "@/lib/dexie";
import { AnimatePresence, motion } from "framer-motion";
import {
  AccountSettings,
  CustomizeSettings,
  DataSettings,
  ModelsKeysSettings,
  SettingsSidebar,
  Integrations,
} from "@/components/_components/_settings";
import { cn } from "@/lib/utils";
import { Settings, X, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SpeechSettings from "@/components/_components/_settings/SpeechSettings";
import {
  settingsSections,
  type SettingsSection,
} from "@/components/_components/_settings/config";
import { toast } from "sonner";
import { NavLink } from "react-router-dom";
import { useAuthContext } from "@/app/hooks";
import { signOut } from "@/auth";

export default function SettingsPage() {
  const { userMetadata, loading, isAuthenticated } = useAuthContext();

  const { unmigratedLocalChats } = useConversations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const memoizedUser = useMemo(
    () => ({
      name: userMetadata?.name || "",
      email: userMetadata?.email || "",
      image: userMetadata?.image || "",
    }),
    [userMetadata]
  );

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("account");
  const userSettings = useQuery(api.users.getMySettings);
  const apiKeys = useQuery(api.api_keys.getApiKeys);

  // Update active section based on URL query params
  useEffect(() => {
    const tab = searchParams.get("tab") as SettingsSection;
    if (tab && settingsSections.some((section) => section.id === tab)) {
      setActiveSection(tab);
    }
  }, [searchParams]);

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", section);
    router.replace(url.pathname + url.search);
  };

  const handleClose = () => {
    router.back();
  };

  if (!loading && !isAuthenticated) {
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        {" "}
        <Loader2 className="w-5 h-5 animate-spin" />{" "}
      </div>
    );
  }

  const clearAllLocalData = async () => {
    try {
      // First try to clear Dexie databases
      try {
        await db.conversations.clear();
        await db.messages.clear();
      } catch (dexieError) {
        console.warn("Failed to clear Dexie databases:", dexieError);
      }

      // Clear all IndexedDB databases completely
      try {
        if ("indexedDB" in window) {
          // Get all database names
          const databases = await indexedDB.databases();

          // Delete each database
          for (const dbInfo of databases) {
            if (dbInfo.name) {
              console.log(`Deleting IndexedDB database: ${dbInfo.name}`);
              await new Promise((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(dbInfo.name!);
                deleteReq.onsuccess = () => {
                  console.log(`Successfully deleted database: ${dbInfo.name}`);
                  resolve(undefined);
                };
                deleteReq.onerror = () => {
                  console.warn(`Failed to delete database: ${dbInfo.name}`);
                  resolve(undefined); // Don't reject, just continue
                };
                deleteReq.onblocked = () => {
                  console.warn(`Database deletion blocked: ${dbInfo.name}`);
                  resolve(undefined); // Don't reject, just continue
                };
              });
            }
          }
        }
      } catch (indexedDbError) {
        console.warn("Failed to clear IndexedDB:", indexedDbError);
      }

      // Clear all localStorage
      try {
        // Clear specific known keys first
        const localStorageKeys = [
          "lastUsedModelId", // Last selected model
          "t2chat-sidebar-open", // Sidebar state
          "mainFont", // Font preferences
          "codeFont", // Code font preferences
          "selectedVoiceURI", // Speech synthesis voice
          "thinkingEnabled", // AI thinking mode
          "webSearchEnabled", // Web search toggle
          "groupBy", // Model grouping preference
        ];

        localStorageKeys.forEach((key) => {
          localStorage.removeItem(key);
        });

        // Clear any other t2chat related localStorage items
        const allKeys = Object.keys(localStorage);
        allKeys.forEach((key) => {
          if (key.startsWith("t2chat-") || key.startsWith("t2Chat")) {
            localStorage.removeItem(key);
          }
        });

        console.log("Cleared localStorage");
      } catch (localStorageError) {
        console.warn("Failed to clear localStorage:", localStorageError);
      }

      // Clear sessionStorage as well
      try {
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach((key) => {
          if (key.startsWith("t2chat-") || key.startsWith("t2Chat")) {
            sessionStorage.removeItem(key);
          }
        });
        console.log("Cleared sessionStorage");
      } catch (sessionStorageError) {
        console.warn("Failed to clear sessionStorage:", sessionStorageError);
      }

      console.log("All local data cleared successfully");
      toast.success("Local data cleared successfully");
    } catch (error) {
      console.error("Error clearing local data:", error);
      toast.error("Failed to clear local data");
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return <AccountSettings user={memoizedUser} />;
      case "models":
        return (
          <ModelsKeysSettings
            apiKeys={apiKeys || []}
            userSettings={userSettings}
          />
        );
      case "customize":
        return (
          <CustomizeSettings
            customization={{
              userName: userSettings?.userName ?? "",
              userRole: userSettings?.userRole ?? "",
              userTraits: userSettings?.userTraits ?? [],
              userAdditionalInfo: userSettings?.userAdditionalInfo ?? "",
              promptTemplate: userSettings?.promptTemplate ?? "",
              mainFont:
                (userSettings?.mainFont as
                  | "inter"
                  | "system"
                  | "serif"
                  | "mono"
                  | "roboto-slab") ?? "inter",
              codeFont: userSettings?.codeFont ?? "fira-code",
              sendBehavior: userSettings?.sendBehavior ?? "enter",
              autoSave: userSettings?.autoSave ?? true,
              showTimestamps: userSettings?.showTimestamps ?? true,
            }}
          />
        );
      case "data":
        return (
          <DataSettings
            unmigratedLocalChats={unmigratedLocalChats as Conversation[]}
          />
        );
      case "speech":
        return <SpeechSettings />;
      case "integrations":
        return <Integrations />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative h-full">
      {/* Logout & Close buttons - merged container positioned where settings icon appears */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <div className="group relative p-2 rounded-lg bg-card/70 backdrop-blur-xl border border-border hover:border-accent shadow-lg hover:shadow-xl flex items-center gap-1.5">
          {/* Gradient overlays for premium look */}
          <div className="absolute inset-0 bg-gradient-to-br from-muted/5 via-transparent to-muted/10 pointer-events-none rounded-lg"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-card/20 pointer-events-none rounded-lg"></div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  handleSignOut();
                  handleClose();
                }}
                className="relative z-10 text-muted-foreground hover:text-foreground h-5.5 w-5.5 p-0 hover:bg-transparent flex items-center justify-center"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Sign Out</TooltipContent>
          </Tooltip>

          {/* Vertical divider */}
          <div className="relative z-10 w-px h-4.5 bg-border"></div>

          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/"
                className="relative z-10 text-muted-foreground hover:text-foreground h-5.5 w-5.5 p-0 hover:bg-transparent flex items-center justify-center"
              >
                <X className="w-4.5 h-4.5" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close Settings</TooltipContent>
          </Tooltip>

          {/* Premium glow effect */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-muted/0 via-muted/5 to-muted/0 rounded-lg blur-xl opacity-20 pointer-events-none"></div>
        </div>
      </div>

      <header className="flex items-center justify-between pt-2 pl-2.5 pr-4 pb-3 border-b border-border flex-shrink-0 bg-card/50 backdrop-blur-sm relative">
        {/* Settings text centered over sidebar */}
        <div
          className={cn(
            "absolute left-0 flex items-center justify-center h-full",
            isMobile ? "w-full" : "w-64"
          )}
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent tracking-tight leading-tight">
            Settings
          </h1>
        </div>

        {/* Invisible content to maintain header height */}
        <div className="invisible">
          <h1 className="text-2xl font-bold leading-tight">Settings</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Placeholders to maintain header layout */}
          <div className="w-10 h-10"></div>
          <div className="w-10 h-10"></div>
        </div>
      </header>
      <div className={cn("flex flex-1 min-h-0", isMobile && "flex-col")}>
        <SettingsSidebar
          settingsSections={settingsSections}
          activeSection={activeSection}
          setActiveSection={handleSectionChange}
          isMobile={isMobile}
        />
        <main
          className={cn(
            "flex-1 overflow-y-auto bg-background",
            isMobile ? "p-4" : "p-6"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="max-w-4xl mx-auto"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
