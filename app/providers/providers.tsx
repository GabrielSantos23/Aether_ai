"use client";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "@/components/_components/_chat/useAuth";
import { useEffect } from "react";

// Client component to handle boring theme initialization
function BoringThemeInitializer() {
  useEffect(() => {
    // Simple function to apply boring theme based on current state
    const applyBoringTheme = () => {
      try {
        // Check if boring theme is enabled in localStorage
        const boringTheme = localStorage.getItem("boring-theme") === "true";
        
        if (boringTheme) {
          // Determine if dark mode is active
          const isDarkMode = document.documentElement.classList.contains("dark");
          
          // Remove any existing boring theme classes first
          document.documentElement.classList.remove("boring-light", "boring-dark");
          
          // Apply the appropriate boring theme class
          document.documentElement.classList.add(isDarkMode ? "boring-dark" : "boring-light");
        } else {
          // Remove any boring theme classes if not enabled
          document.documentElement.classList.remove("boring-light", "boring-dark");
        }
      } catch (error) {
        console.error("Error applying boring theme:", error);
      }
    };
    
    // Apply theme on initial load
    applyBoringTheme();
    
    // Set up a listener for theme changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "boring-theme") {
        applyBoringTheme();
      }
    };
    
    // Listen for changes to localStorage
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  
  return null;
}

export default function Provider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <BoringThemeInitializer />
      <Toaster richColors />
      {children}
    </ThemeProvider>
  );
}
