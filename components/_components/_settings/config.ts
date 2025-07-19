import {
  User,
  Database,
  Brain,
  Sparkles,
  Mic,
  CreditCard,
  Zap,
  Cpu,
} from "lucide-react";

export const settingsSections = [
  { id: "account", label: "My Account", icon: User },
  { id: "models", label: "Models & Keys", icon: Brain },
  { id: "customize", label: "Customization", icon: Sparkles },
  { id: "speech", label: "Speech", icon: Mic },
  { id: "data", label: "Manage Data", icon: Database },
  { id: "mem0", label: "Mem0 Memory", icon: Cpu },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "integrations", label: "Integrations", icon: Zap },
] as const;

export type SettingsSection = (typeof settingsSections)[number]["id"];
