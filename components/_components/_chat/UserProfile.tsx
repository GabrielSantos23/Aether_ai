"use client";

import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { UserMetadata } from "@/lib/types";
import React, { memo, useMemo, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Settings,
  LogOut,
  Github,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserProfileProps {
  isSignedIn: boolean;
  userMetadata: UserMetadata;
  onSettingsClick: () => void;
}

// Memoized components to prevent unnecessary rerenders
const ProfileAvatar = memo(
  ({ userMetadata }: { userMetadata: UserMetadata }) => {
    const avatarContent = useMemo(() => {
      if (userMetadata.image) {
        return (
          <img
            src={userMetadata.image}
            alt="User profile"
            className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
          />
        );
      }

      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/20 flex items-center justify-center flex-shrink-0">
          <div className="text-primary font-medium text-sm">
            {userMetadata.name?.[0] || userMetadata.email?.[0] || "?"}
          </div>
        </div>
      );
    }, [userMetadata.image, userMetadata.name, userMetadata.email]);

    return avatarContent;
  }
);

ProfileAvatar.displayName = "ProfileAvatar";

const ProfileDropdown = memo(
  ({
    isOpen,
    onSettingsClick,
    onSignOut,
  }: {
    isOpen: boolean;
    onSettingsClick: () => void;
    onSignOut: () => void;
  }) => {
    if (!isOpen) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="absolute bottom-full left-0 right-0 mb-2 bg-background/90 backdrop-blur-2xl border border-border shadow-2xl shadow-primary/10 rounded-2xl z-50 overflow-hidden"
      >
        {/* Premium gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none rounded-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 dark:to-white/5 pointer-events-none rounded-2xl"></div>

        <div className="relative p-2 space-y-1">
          <button
            onClick={onSettingsClick}
            className="w-full group px-3 py-2.5 cursor-pointer transition-all duration-150 ease-[0.25,1,0.5,1] relative overflow-hidden text-left hover:text-primary text-foreground/80 rounded-xl flex items-center gap-3 text-sm font-medium"
          >
            {/* Chat history style hover effect */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-[0.25,1,0.5,1]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/8 to-transparent"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-gradient-to-r from-transparent via-primary/5 to-transparent blur-sm"></div>
            </div>
            <Settings className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Settings</span>
          </button>

          <Link
            href="https://github.com/nyaughh/t2chat"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full group px-3 py-2.5 cursor-pointer transition-all duration-150 ease-[0.25,1,0.5,1] relative overflow-hidden hover:text-primary text-foreground/80 rounded-xl flex items-center gap-3 text-sm font-medium"
          >
            {/* Chat history style hover effect */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-[0.25,1,0.5,1]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/8 to-transparent"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-gradient-to-r from-transparent via-primary/5 to-transparent blur-sm"></div>
            </div>
            <Github className="w-4 h-4 relative z-10" />
            <span className="relative z-10">GitHub</span>
          </Link>

          <Link
            href="https://discord.gg/7VEznftRPZ"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full group px-3 py-2.5 cursor-pointer transition-all duration-150 ease-[0.25,1,0.5,1] relative overflow-hidden hover:text-primary text-foreground/80 rounded-xl flex items-center gap-3 text-sm font-medium"
          >
            {/* Chat history style hover effect */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-[0.25,1,0.5,1]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/8 to-transparent"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-gradient-to-r from-transparent via-primary/5 to-transparent blur-sm"></div>
            </div>
            <MessageCircle className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Discord</span>
          </Link>

          <div className="my-2 mx-2 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent border-0" />

          <button
            onClick={onSignOut}
            className="w-full group px-3 py-2.5 cursor-pointer transition-all duration-150 ease-[0.25,1,0.5,1] relative overflow-hidden text-left hover:text-destructive text-foreground/80 rounded-xl flex items-center gap-3 text-sm font-medium"
          >
            {/* Chat history style hover effect with red colors */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-[0.25,1,0.5,1]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-destructive/8 to-transparent"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/30 to-transparent"></div>
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-gradient-to-r from-transparent via-destructive/5 to-transparent blur-sm"></div>
            </div>
            <LogOut className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Sign Out</span>
          </button>
        </div>
      </motion.div>
    );
  }
);

ProfileDropdown.displayName = "ProfileDropdown";

const SignedInProfile = memo(
  ({
    userMetadata,
    onSettingsClick,
  }: {
    userMetadata: UserMetadata;
    onSettingsClick: () => void;
  }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Privacy settings
    const [showName, setShowName] = useState(true);
    const [showEmail, setShowEmail] = useState(true);

    useEffect(() => {
      if (typeof window === "undefined") return;

      const namePref = localStorage.getItem("privacy-show-name");
      setShowName(namePref !== null ? namePref === "true" : true);

      const emailPref = localStorage.getItem("privacy-show-email");
      setShowEmail(emailPref !== null ? emailPref === "true" : true);

      const handleStorage = (e: StorageEvent) => {
        if (e.key === "privacy-show-name" && e.newValue !== null) {
          setShowName(e.newValue === "true");
        }
        if (e.key === "privacy-show-email" && e.newValue !== null) {
          setShowEmail(e.newValue === "true");
        }
      };

      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const router = useRouter();

    const handleToggleDropdown = useCallback(() => {
      setIsDropdownOpen((prev) => !prev);
    }, []);

    const handleSettingsClick = useCallback(() => {
      setIsDropdownOpen(false);
      onSettingsClick();
    }, [onSettingsClick]);

    const handleSignOut = useCallback(async () => {
      setIsDropdownOpen(false);
      await signOut({ redirect: false });
      router.push("/auth");
    }, [router]);

    return (
      <div className="relative">
        <div
          onClick={handleToggleDropdown}
          className="flex items-center gap-2 p-2 rounded-xl border border-border bg-gradient-to-r from-primary/8 via-background/90 to-primary/8 backdrop-blur-sm cursor-pointer hover:from-primary/12 hover:via-background/95 hover:to-primary/12 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 ease-[0.25,1,0.5,1] group"
        >
          <div className="relative">
            <ProfileAvatar userMetadata={userMetadata} />
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div
              className={cn(
                "text-sm font-semibold truncate text-foreground/90 group-hover:text-primary transition-colors duration-200",
                !(userMetadata.name ? showName : showEmail) &&
                  "blur-sm select-none"
              )}
            >
              {userMetadata.name || userMetadata.email}
            </div>
            <div className="text-[10px] text-muted-foreground/50 truncate">
              Free
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
          />
        </div>

        <AnimatePresence>
          <ProfileDropdown
            isOpen={isDropdownOpen}
            onSettingsClick={handleSettingsClick}
            onSignOut={handleSignOut}
          />
        </AnimatePresence>
      </div>
    );
  }
);

SignedInProfile.displayName = "SignedInProfile";

const SignInButton = memo(() => (
  <Link href="/auth">
    <Button
      variant="ghost"
      className="group w-full justify-start h-auto px-2.5 py-1.5 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 hover:from-primary/10 hover:to-primary/10 border border-primary/10 hover:border-primary/20 transition-all duration-200 ease-[0.25,1,0.5,1] rounded-lg backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key="sign-in"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center gap-3 w-full"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/20 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 rounded-full bg-primary/30"></div>
            </div>
            <div className="flex-1 text-center min-w-0">
              <div className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors duration-150 ease-[0.25,1,0.5,1]">
                Sign in
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="w-4 h-4 text-foreground/40 group-hover:text-primary transition-colors duration-150 ease-[0.25,1,0.5,1] flex-shrink-0">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Button>
  </Link>
));

SignInButton.displayName = "SignInButton";

export const UserProfile = memo(function UserProfile({
  isSignedIn,
  userMetadata,
  onSettingsClick,
}: UserProfileProps) {
  return (
    <div className="p-4 flex-shrink-0">
      <AnimatePresence mode="wait">
        {isSignedIn ? (
          <motion.div
            key="signed-in"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          >
            <SignedInProfile
              userMetadata={userMetadata}
              onSettingsClick={onSettingsClick}
            />
          </motion.div>
        ) : (
          <motion.div
            key="sign-in"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          >
            <SignInButton />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
