import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  User,
  Sparkles,
  Palette,
  Zap,
  SendHorizonal,
  ArrowUp,
  MessageCircle,
  ChevronRight,
  Plus,
  ChevronDown,
  ChevronUp,
  Tag,
  RefreshCw,
} from "lucide-react";
import { useFont } from "@/app/hooks/useFont";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PREDEFINED_TAGS, POPULAR_TAGS, type TagCategory } from "@/lib/tags";

// Define Customization type
export type CustomizationState = {
  userName: string;
  userRole: string;
  userTraits: string[];
  userAdditionalInfo: string;
  promptTemplate: string;
  mainFont: "inter" | "system" | "serif" | "mono" | "roboto-slab";
  codeFont: "fira-code" | "mono" | "consolas" | "jetbrains" | "source-code-pro";
  sendBehavior: "enter" | "shiftEnter" | "button";
  autoSave: boolean;
  showTimestamps: boolean;
};

const CustomizationInput = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  isTextArea = false,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: any) => void;
  placeholder: string;
  isTextArea?: boolean;
  rows?: number;
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-muted-foreground mb-2"
    >
      {label}
    </label>
    {isTextArea ? (
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none resize-y transition-all duration-200 backdrop-blur-sm"
      />
    ) : (
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none transition-all duration-200 backdrop-blur-sm"
      />
    )}
  </div>
);

const CustomizationSelect = ({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: any) => void;
  children: React.ReactNode;
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-muted-foreground mb-2"
    >
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full appearance-none bg-muted/30 border border-border rounded-lg pl-3 pr-10 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none transition-all duration-200 backdrop-blur-sm"
      >
        {children}
      </select>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none rotate-90" />
    </div>
  </div>
);

const CustomizationRadio = ({
  name,
  value,
  checked,
  onChange,
  label,
  icon: Icon,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (e: any) => void;
  label: string;
  icon: React.ElementType;
}) => (
  <label
    className={cn(
      "flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all duration-200 backdrop-blur-sm group",
      checked
        ? "bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/10"
        : "bg-muted/30 border-border hover:bg-muted/50 hover:border-border hover:shadow-md"
    )}
  >
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <div className="relative">
      <Icon
        className={cn(
          "w-4 h-4 transition-all duration-200",
          checked
            ? "text-purple-600 dark:text-purple-400 drop-shadow-sm"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {checked && (
        <div className="absolute inset-0 bg-purple-500/20 blur-sm rounded-full scale-150 -z-10" />
      )}
    </div>
    <span
      className={cn(
        "text-sm font-medium transition-all duration-200",
        checked
          ? "text-purple-600 dark:text-purple-400 font-semibold"
          : "text-foreground"
      )}
    >
      {label}
    </span>
  </label>
);

const CustomizationFontRadio = ({
  name,
  value,
  checked,
  onChange,
  label,
  fontClass,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (e: any) => void;
  label: string;
  fontClass: string;
}) => (
  <label
    className={cn(
      "flex items-center justify-center p-3 rounded-lg cursor-pointer border transition-all duration-200 text-center backdrop-blur-sm group relative overflow-hidden",
      checked
        ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300 shadow-lg shadow-purple-500/10"
        : "bg-muted/30 border-border hover:bg-muted/50 hover:border-border hover:shadow-md text-foreground"
    )}
  >
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    {checked && (
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-purple-500/10 to-purple-500/5" />
    )}
    <span
      className={cn(
        "text-sm font-semibold relative z-10 transition-all duration-200",
        fontClass
      )}
    >
      {label}
    </span>
  </label>
);

const TagButton = ({
  tag,
  isSelected,
  onClick,
  variant = "default",
}: {
  tag: string;
  isSelected?: boolean;
  onClick: () => void;
  variant?: "default" | "popular";
}) => (
  <button
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95",
      isSelected
        ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-sm"
        : variant === "popular"
          ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30"
          : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted/70 hover:text-foreground hover:border-border/70"
    )}
  >
    {variant === "popular" && <Sparkles className="w-3 h-3" />}
    {isSelected && <Tag className="w-3 h-3" />}
    <span>{tag}</span>
    {!isSelected && <Plus className="w-3 h-3" />}
  </button>
);

const TagCategory = ({
  category,
  selectedTags,
  onTagClick,
  isExpanded,
  onToggleExpanded,
}: {
  category: TagCategory;
  selectedTags: Set<string>;
  onTagClick: (tag: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}) => (
  <div className="border border-border/50 rounded-lg bg-muted/20 backdrop-blur-sm overflow-hidden">
    <button
      onClick={onToggleExpanded}
      className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{category.icon}</span>
        <span className="text-sm font-medium text-foreground">
          {category.name}
        </span>
        <span className="text-xs text-muted-foreground">
          ({category.tags.length})
        </span>
      </div>
      {isExpanded ? (
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
    {isExpanded && (
      <div className="px-3 pb-3">
        <div className="flex flex-wrap gap-2">
          {category.tags.map((tag) => (
            <TagButton
              key={tag}
              tag={tag}
              isSelected={selectedTags.has(tag)}
              onClick={() => onTagClick(tag)}
            />
          ))}
        </div>
      </div>
    )}
  </div>
);

export function CustomizeSettings({
  customization,
}: {
  customization: CustomizationState;
}) {
  const { mainFont, setMainFont, codeFont, setCodeFont } = useFont();
  const [localCustomization, setLocalCustomization] =
    useState<CustomizationState>(customization);
  const [traitInput, setTraitInput] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["personality", "communication"])
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [randomTags, setRandomTags] = useState<string[]>([]);
  const updateSettings = useMutation(api.users.updateUserSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Function to get random tags
  const getRandomTags = useCallback(() => {
    const allTags: string[] = [];
    PREDEFINED_TAGS.forEach((category) => {
      category.tags.forEach((tag) => {
        allTags.push(tag);
      });
    });

    // Shuffle and get 10 random tags
    const shuffled = [...allTags].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  }, []);

  // Initialize random tags
  useEffect(() => {
    setRandomTags(getRandomTags());
  }, [getRandomTags]);

  useEffect(() => {
    setLocalCustomization({
      ...customization,
      mainFont: mainFont as
        | "inter"
        | "system"
        | "serif"
        | "mono"
        | "roboto-slab",
      codeFont,
    });
    // Reset dirty state when initial props change
    setIsDirty(false);
  }, [customization, mainFont, codeFont]);

  useEffect(() => {
    if (
      mainFont !== localCustomization.mainFont ||
      codeFont !== localCustomization.codeFont
    ) {
      setLocalCustomization((prev: CustomizationState) => ({
        ...prev,
        mainFont: mainFont as
          | "inter"
          | "system"
          | "serif"
          | "mono"
          | "roboto-slab",
        codeFont,
      }));
      setIsDirty(true);
    }
  }, [
    mainFont,
    codeFont,
    localCustomization.mainFont,
    localCustomization.codeFont,
  ]);

  // Initialize selected tags from existing additional info
  useEffect(() => {
    const infoTags = new Set<string>();
    const additionalInfo = localCustomization.userAdditionalInfo.toLowerCase();

    PREDEFINED_TAGS.forEach((category) => {
      category.tags.forEach((tag) => {
        if (additionalInfo.includes(tag.toLowerCase())) {
          infoTags.add(tag);
        }
      });
    });

    POPULAR_TAGS.forEach((tag) => {
      if (additionalInfo.includes(tag.toLowerCase())) {
        infoTags.add(tag);
      }
    });

    setSelectedTags(infoTags);
  }, [localCustomization.userAdditionalInfo]);

  const handleChange = (field: keyof CustomizationState, value: any) => {
    setLocalCustomization((prev: CustomizationState) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        ...localCustomization,
        mainFont: localCustomization.mainFont as
          | "inter"
          | "system"
          | "serif"
          | "mono"
          | "roboto-slab"
          | undefined,
      });
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to save settings", error);
      // Here you could add a toast notification for the error
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTrait = () => {
    if (traitInput && !localCustomization.userTraits.includes(traitInput)) {
      const newTraits = [...localCustomization.userTraits, traitInput];
      handleChange("userTraits", newTraits);
      setTraitInput("");
    }
  };

  const handleTraitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTrait();
    }
  };

  const handleRemoveTrait = (index: number) => {
    const newTraits = localCustomization.userTraits.filter(
      (_, i) => i !== index
    );
    handleChange("userTraits", newTraits);
  };

  const handleTagClick = (tag: string) => {
    const newSelectedTags = new Set(selectedTags);
    const currentInfo = localCustomization.userAdditionalInfo;

    if (selectedTags.has(tag)) {
      // Remove tag
      newSelectedTags.delete(tag);
      // Remove from additional info if it exists
      const tagRegex = new RegExp(`\\b${tag}\\b`, "gi");
      const newInfo = currentInfo
        .replace(tagRegex, "")
        .replace(/\s+/g, " ")
        .trim();
      handleChange("userAdditionalInfo", newInfo);
    } else {
      // Add tag
      newSelectedTags.add(tag);
      // Add to additional info
      const newInfo = currentInfo ? `${currentInfo} ${tag}` : tag;
      handleChange("userAdditionalInfo", newInfo);
    }

    setSelectedTags(newSelectedTags);
  };

  const handleToggleCategoryExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleMainFontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFont = e.target.value as
      | "inter"
      | "system"
      | "serif"
      | "mono"
      | "roboto-slab";
    setMainFont(newFont);
  };

  const handleCodeFontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFont = e.target.value as
      | "fira-code"
      | "mono"
      | "consolas"
      | "jetbrains"
      | "source-code-pro";
    setCodeFont(newFont);
  };

  const getMainFontPreviewClass = (
    font: "inter" | "system" | "serif" | "mono" | "roboto-slab"
  ) => {
    if (font === "inter" || font === "system") return "font-sans";
    return `font-${font}`;
  };

  const handleRefreshRandomTags = () => {
    setRandomTags(getRandomTags());
  };

  return (
    <div className="space-y-6">
      {isDirty && (
        <div className="sticky top-0 z-20 py-4 px-6 bg-purple-500/10 border border-purple-500/20 rounded-xl backdrop-blur-sm mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-purple-700 dark:text-purple-200">
              You have unsaved changes.
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:bg-purple-400 dark:disabled:bg-purple-700 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          User Personalization
        </h3>
        <div className="space-y-6 p-4 rounded-xl bg-muted/20 backdrop-blur-sm border border-border/50">
          <CustomizationInput
            id="userName"
            label="Your Name"
            value={localCustomization.userName}
            onChange={(e) => handleChange("userName", e.target.value)}
            placeholder="e.g., Jane Doe"
          />
          <CustomizationInput
            id="userRole"
            label="Your Role/Profession"
            value={localCustomization.userRole}
            onChange={(e) => handleChange("userRole", e.target.value)}
            placeholder="e.g., Software Engineer, Student, etc."
          />
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Your Interests/Traits
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {localCustomization.userTraits.map((trait, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-full pl-3 pr-2 py-1.5 text-sm font-medium border border-purple-500/20 backdrop-blur-sm"
                >
                  <span>{trait}</span>
                  <button
                    onClick={() => handleRemoveTrait(index)}
                    className="text-purple-600/70 dark:text-purple-300/70 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={traitInput}
                onChange={(e) => setTraitInput(e.target.value)}
                onKeyDown={handleTraitKeyDown}
                placeholder="Add a trait and press Enter..."
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none transition-all duration-200 backdrop-blur-sm"
              />
              <button
                onClick={handleAddTrait}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50 transition-colors"
                disabled={!traitInput}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          <CustomizationInput
            id="userAdditionalInfo"
            label="Additional Information"
            value={localCustomization.userAdditionalInfo}
            onChange={(e) => handleChange("userAdditionalInfo", e.target.value)}
            placeholder="Anything else you want the AI to know about you?"
            isTextArea
          />
          <div className="px-3 pb-3">
            <div className="flex flex-wrap gap-2">
              {randomTags.map((tag) => (
                <TagButton
                  key={tag}
                  tag={tag}
                  isSelected={selectedTags.has(tag)}
                  onClick={() => handleTagClick(tag)}
                />
              ))}
              <button
                onClick={handleRefreshRandomTags}
                className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                title="Refresh random tags"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Template Section */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Prompt Template
        </h3>
        <div className="p-4 rounded-xl bg-muted/20 backdrop-blur-sm border border-border/50">
          <CustomizationInput
            id="promptTemplate"
            label="System Prompt"
            value={localCustomization.promptTemplate}
            onChange={(e) => handleChange("promptTemplate", e.target.value)}
            placeholder="e.g., You are a helpful assistant that is an expert in..."
            isTextArea
            rows={5}
          />
        </div>
      </div>

      {/* Visual Options Section */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Visual Appearance
        </h3>
        <div className="space-y-6 p-4 rounded-xl bg-muted/20 backdrop-blur-sm border border-border/50">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Main Font
            </label>
            <div className="grid grid-cols-2 gap-2">
              <CustomizationFontRadio
                name="mainFont"
                value="inter"
                checked={localCustomization.mainFont === "inter"}
                onChange={handleMainFontChange}
                label="Inter"
                fontClass="font-sans"
              />
              <CustomizationFontRadio
                name="mainFont"
                value="system"
                checked={localCustomization.mainFont === "system"}
                onChange={handleMainFontChange}
                label="System"
                fontClass="font-sans"
              />
              <CustomizationFontRadio
                name="mainFont"
                value="serif"
                checked={localCustomization.mainFont === "serif"}
                onChange={handleMainFontChange}
                label="Serif"
                fontClass="font-serif"
              />
              <CustomizationFontRadio
                name="mainFont"
                value="mono"
                checked={localCustomization.mainFont === "mono"}
                onChange={handleMainFontChange}
                label="Mono"
                fontClass="font-mono"
              />
              <CustomizationFontRadio
                name="mainFont"
                value="roboto-slab"
                checked={localCustomization.mainFont === "roboto-slab"}
                onChange={handleMainFontChange}
                label="Roboto Slab"
                fontClass="font-roboto-slab"
              />
            </div>
            <div className="mt-3 p-4 rounded-lg bg-muted/40 border border-border/60 backdrop-blur-sm">
              <p
                className={cn(
                  "text-base text-foreground",
                  getMainFontPreviewClass(localCustomization.mainFont)
                )}
              >
                The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Code Font
            </label>
            <div className="grid grid-cols-2 gap-2">
              <CustomizationFontRadio
                name="codeFont"
                value="fira-code"
                checked={localCustomization.codeFont === "fira-code"}
                onChange={handleCodeFontChange}
                label="Fira Code"
                fontClass="font-fira-code"
              />
              <CustomizationFontRadio
                name="codeFont"
                value="mono"
                checked={localCustomization.codeFont === "mono"}
                onChange={handleCodeFontChange}
                label="Monospace"
                fontClass="font-mono"
              />
              <CustomizationFontRadio
                name="codeFont"
                value="consolas"
                checked={localCustomization.codeFont === "consolas"}
                onChange={handleCodeFontChange}
                label="Consolas"
                fontClass="font-consolas"
              />
              <CustomizationFontRadio
                name="codeFont"
                value="jetbrains"
                checked={localCustomization.codeFont === "jetbrains"}
                onChange={handleCodeFontChange}
                label="JetBrains"
                fontClass="font-jetbrains"
              />
              <CustomizationFontRadio
                name="codeFont"
                value="source-code-pro"
                checked={localCustomization.codeFont === "source-code-pro"}
                onChange={handleCodeFontChange}
                label="Source Code"
                fontClass="font-source-code-pro"
              />
            </div>
            <div className="mt-3 p-4 rounded-lg bg-muted/40 border border-border/60 backdrop-blur-sm">
              <pre className="whitespace-pre-wrap">
                <code
                  className={cn(
                    "text-sm text-foreground",
                    `font-${localCustomization.codeFont}`
                  )}
                >
                  {`function greet(name) {
  return \`Hello, \${name}!\`;
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Section */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Behavior</h3>
        <div className="space-y-6 p-4 rounded-xl bg-muted/20 backdrop-blur-sm border border-border/50">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Send Message on Enter
            </label>
            <div className="flex flex-wrap gap-2">
              <CustomizationRadio
                name="sendBehavior"
                value="enter"
                checked={localCustomization.sendBehavior === "enter"}
                onChange={(e) => handleChange("sendBehavior", e.target.value)}
                label="Enter"
                icon={SendHorizonal}
              />
              <CustomizationRadio
                name="sendBehavior"
                value="shiftEnter"
                checked={localCustomization.sendBehavior === "shiftEnter"}
                onChange={(e) => handleChange("sendBehavior", e.target.value)}
                label="Shift + Enter"
                icon={ArrowUp}
              />
              <CustomizationRadio
                name="sendBehavior"
                value="button"
                checked={localCustomization.sendBehavior === "button"}
                onChange={(e) => handleChange("sendBehavior", e.target.value)}
                label="Button Only"
                icon={MessageCircle}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/60">
            <div>
              <label
                htmlFor="autoSave"
                className="block text-sm font-medium text-foreground"
              >
                Auto-save conversations
              </label>
              <p className="text-xs text-muted-foreground">
                Automatically save chat history.
              </p>
            </div>
            <input
              type="checkbox"
              id="autoSave"
              checked={localCustomization.autoSave}
              onChange={(e) => handleChange("autoSave", e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/60">
            <div>
              <label
                htmlFor="showTimestamps"
                className="block text-sm font-medium text-foreground"
              >
                Show message timestamps
              </label>
              <p className="text-xs text-muted-foreground">
                Display the time for each message.
              </p>
            </div>
            <input
              type="checkbox"
              id="showTimestamps"
              checked={localCustomization.showTimestamps}
              onChange={(e) => handleChange("showTimestamps", e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
