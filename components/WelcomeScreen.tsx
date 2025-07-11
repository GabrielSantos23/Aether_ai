"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import { Book, Code, Globe, Sparkle, Sparkles } from "lucide-react";
import { Separator } from "./ui/separator";

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
}

// Updated prompts organized by category
const promptsByCategory = {
  Create: [
    "Create three images of a blonde haired black moustached man that get progressively more unhinged",
    "Generate an image of someone generating an image of a cat",
    "Design a futuristic cityscape with flying cars",
    "Create a logo for a sustainable coffee shop",
    "Write a short story about time travel",
    "Design a minimalist poster for a music festival",
    "Create a character design for a sci-fi game",
    "Write a poem about artificial intelligence",
  ],
  Explore: [
    "How does AI work?",
    "What would happen if you fell into a black hole?",
    "Explain quantum physics simply",
    "What is consciousness?",
    "How big is the universe?",
    "What causes the northern lights?",
    "Are we alone in the universe?",
    "How do dreams work?",
  ],
  Code: [
    "Help me debug this React component",
    "Explain APIs in simple terms",
    "What programming language should I learn first?",
    "How do you optimize website performance?",
    "Create a simple Python script for data analysis",
    "Explain the difference between SQL and NoSQL",
    "How do you implement authentication in a web app?",
    "What are the best practices for clean code?",
  ],
  Learn: [
    "How do you learn a new language effectively?",
    "What makes a good password?",
    "How do you overcome procrastination?",
    "What are some healthy meal prep ideas?",
    "How do you build good habits?",
    "What makes a great leader?",
    "How do you manage your time effectively?",
    "What are the best study techniques?",
  ],
};

// Navigation items with icons
const NAV_ITEMS = [
  { name: "Create", icon: <Sparkles className="w-4 h-4" /> },
  { name: "Explore", icon: <Globe className="w-4 h-4" /> },
  { name: "Code", icon: <Code className="w-4 h-4" /> },
  { name: "Learn", icon: <Book className="w-4 h-4" /> },
] as const;

function PromptItem({
  prompt,
  onClick,
}: {
  prompt: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group p-4 cursor-pointer transition-all duration-200 ease-out relative overflow-hidden"
      )}
    >
      <div className="flex flex-col items-start text-left relative z-10 text-sm leading-relaxed border-b gap-2 group-hover:text-foreground text-muted-foreground transition-colors duration-200">
        {prompt}
        <Separator
          className="w-full opacity-10"
          style={{ height: "0.5px", minHeight: "0.5px" }}
        />
      </div>

      {/* Subtle hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
    </div>
  );
}

export default function WelcomeScreen({ onPromptClick }: WelcomeScreenProps) {
  // Track active navigation tab (default to Create)
  const [activeTab, setActiveTab] =
    useState<keyof typeof promptsByCategory>("Create");

  // Get prompts for active tab
  const [displayPrompts, setDisplayPrompts] = useState<string[]>([]);

  // Update prompts when tab changes
  useEffect(() => {
    const categoryPrompts = promptsByCategory[activeTab];
    const shuffled = [...categoryPrompts].sort(() => 0.5 - Math.random());
    setDisplayPrompts(shuffled.slice(0, 4));
  }, [activeTab]);

  // Initialize prompts on mount
  useEffect(() => {
    const categoryPrompts = promptsByCategory[activeTab];
    const shuffled = [...categoryPrompts].sort(() => 0.5 - Math.random());
    setDisplayPrompts(shuffled.slice(0, 4));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: -20,
        scale: 0.9,
        transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] },
      }}
      transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className="absolute inset-0 flex flex-col items-center justify-start p-6 pt-14 pb-24 "
    >
      {/* Navigation Tabs */}
      <div className="flex items-center justify-center gap-2 mb-12  p-1 ">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.name}
            onClick={() =>
              setActiveTab(item.name as keyof typeof promptsByCategory)
            }
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 relative",
              activeTab === item.name
                ? "bg-primary text-secondary "
                : "bg-background border hover:bg-"
            )}
          >
            <span className="text-xs">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="max-w-2xl w-full">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-3"
        >
          {displayPrompts.map((prompt, i) => (
            <motion.div
              key={`${prompt}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <PromptItem
                prompt={prompt}
                onClick={() => onPromptClick(prompt)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
