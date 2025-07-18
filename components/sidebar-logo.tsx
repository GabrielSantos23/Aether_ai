import React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const SidebarLogo = ({ className }: { className?: string }) => {
  const { resolvedTheme } = useTheme();

  return (
    <img
      src={"/logo.png"}
      alt="Aether logo"
      className={cn(
        "w-6 h-6 opacity-50 hover:opacity-100 transition-opacity duration-200",
        resolvedTheme === "dark" ? "invert" : "",
        className
      )}
      style={{ transition: "filter 0.2s" }}
    />
  );
};

export default SidebarLogo;
