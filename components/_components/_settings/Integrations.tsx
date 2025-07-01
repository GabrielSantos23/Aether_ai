import React, { useState } from "react";
import {
  Search,
  Github,
  Calendar,
  FileText,
  Database,
  Info,
  CheckCircle,
  Edit,
  PlusCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signIn, useSession } from "next-auth/react";
import { Spinner } from "@/components/ui/spinner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ALL_DRIVE_SCOPES } from "@/components/GoogleDriveScopeChecker";

// Define Notion scopes
const NOTION_SCOPES = [
  "databases:read",
  "databases:write",
  "pages:read",
  "pages:write",
  "blocks:read",
  "blocks:write",
  "users:read",
];

type ServiceKey = "github" | "calendar" | "notion" | "drive";
type ServiceInfoKey = "webSearch" | "github" | "calendar" | "notion" | "drive";

interface DataSourceItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonText: string;
  buttonVariant: "primary" | "secondary" | "success" | "outline";
  onAction: () => void;
  isConnected?: boolean;
  infoKey: ServiceInfoKey;
  isLoading?: boolean;
  scopes?: string[];
}

// Define the DriveScope interface to match the structure in GoogleDriveScopeChecker
interface DriveScope {
  scope: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export default function Integrations() {
  const session = useSession();
  const [isLoading, setIsLoading] = useState<Record<ServiceKey, boolean>>({
    github: false,
    calendar: false,
    notion: false,
    drive: false,
  });

  // Fetch Google account data
  const googleAccount = useQuery(api.accounts.getGoogleAccount);
  const deleteGoogleAccount = useMutation(api.accounts.deleteGoogleAccount);
  
  // Fetch Notion account data
  const notionAccount = useQuery(api.accounts.getNotionAccount);
  const deleteNotionAccount = useMutation(api.accounts.deleteNotionAccount);
  
  // Parse granted scopes
  const grantedDriveScopes = new Set(googleAccount?.scope?.split(" ") ?? []);
  const driveConnected = googleAccount !== null && googleAccount !== undefined;
  
  const grantedNotionScopes = new Set(notionAccount?.scope?.split(" ") ?? []);
  const notionConnected = notionAccount !== null && notionAccount !== undefined;

  const handleConnect = async (service: ServiceKey) => {
    if (service === "drive") {
      if (driveConnected) {
        // If already connected, disconnect
        setIsLoading(prev => ({ ...prev, drive: true }));
        try {
          await deleteGoogleAccount();
        } finally {
          setIsLoading(prev => ({ ...prev, drive: false }));
        }
      } else {
        // Connect to Google Drive
        setIsLoading(prev => ({ ...prev, drive: true }));
        try {
          const scopesToRequest = [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            ...ALL_DRIVE_SCOPES.map((s: DriveScope) => s.scope)
          ].join(" ");
          
          await signIn("google", {}, { scope: scopesToRequest });
        } finally {
          setIsLoading(prev => ({ ...prev, drive: false }));
        }
      }
    } else if (service === "notion") {
      if (notionConnected) {
        // If already connected, disconnect
        setIsLoading(prev => ({ ...prev, notion: true }));
        try {
          await deleteNotionAccount();
        } finally {
          setIsLoading(prev => ({ ...prev, notion: false }));
        }
      } else {
        // Connect to Notion
        setIsLoading(prev => ({ ...prev, notion: true }));
        try {
          const scopesToRequest = NOTION_SCOPES.join(" ");
          await signIn("notion", {}, { scope: scopesToRequest });
        } finally {
          setIsLoading(prev => ({ ...prev, notion: false }));
        }
      }
    } else {
      // Handle other services
      // For now, just toggle the state
      setConnectedServices((prev) => ({
        ...prev,
        [service]: !prev[service],
      }));
    }
  };

  const [connectedServices, setConnectedServices] = useState<
    Record<ServiceKey, boolean>
  >({
    github: false,
    calendar: false,
    notion: false,
    drive: false,
  });

  const serviceInfo: Record<ServiceInfoKey, string[]> = {
    webSearch: [
      "Search across the web for articles, research papers, and current information",
      "Get real-time data and recent news from reliable sources",
      "Find specific facts and information that may not be in the knowledge base",
    ],
    github: [
      "Search for GitHub repositories. Returns a concise list with essential information. Use 'get_repository' for detailed information about a specific repository.",
      "Get information about a repository on GitHub",
      "Search for code across GitHub repositories. Returns a concise list with file paths and repositories. Use 'get_file_contents' for full file content.",
      "Search for GitHub users.",
    ],
    calendar: [
      "Access your Google Calendar to check availability",
      "Schedule and manage meetings directly from the chat",
      "View upcoming events and appointments",
      "Create calendar invites and send meeting requests",
    ],
    notion: [
      "Query and search through your Notion workspace",
      "Create new pages and databases",
      "Update existing content and properties",
      "Access notes, documentation, and knowledge bases",
    ],
    drive: [
      "Access and manage your Google Drive files",
      "View and edit documents, spreadsheets, and presentations",
      "Search for files and folders",
    ],
  };

  // Helper function to format scope for display
  const formatScope = (scope: string) => {
    return scope.split("/").pop() || scope;
  };

  const DataSourceItem: React.FC<DataSourceItemProps> = ({
    icon: Icon,
    title,
    description,
    buttonText,
    buttonVariant,
    onAction,
    isConnected,
    isLoading,
    infoKey,
    scopes,
  }) => (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Info className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="w-80 p-3 bg-card border border-border rounded-lg shadow-lg"
                >
                  <div className="text-sm text-muted-foreground space-y-1">
                    {serviceInfo[infoKey].map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>

          {/* Show granted scopes if connected */}
          {isConnected && scopes && scopes.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle className="w-3 h-3" />
                <span>Granted permissions:</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {scopes.map((scope, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-green-900/30 text-green-300 px-2 py-0.5 rounded"
                  >
                    {formatScope(scope)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onAction}
        disabled={isLoading}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          buttonVariant === "primary"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : buttonVariant === "secondary"
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : buttonVariant === "success"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "border border-gray-600 text-gray-300 hover:bg-gray-800"
        } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Spinner className="w-4 h-4 " />
            <span>Connecting...</span>
          </div>
        ) : isConnected ? (
          "Disconnect"
        ) : (
          buttonText
        )}
      </button>
    </div>
  );

  // Loading state while the account queries run
  if (googleAccount === undefined || notionAccount === undefined) {
    return (
      <div className="bg-background text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">Manage Integrations</h1>
            <p className="text-muted-foreground">
              Loading integrations...
            </p>
          </div>
          <Spinner className="w-6 h-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Manage Integrations</h1>
          <p className="text-muted-foreground">
            Add or remove tools to enhance your chat experience
          </p>
        </div>

        {/* Data Sources Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Data Sources</h2>
          </div>

          <div className="space-y-3">
            <DataSourceItem
              icon={Search}
              title="Web Search"
              description="Find articles, research papers, companies, and more"
              buttonText="Add"
              buttonVariant="outline"
              onAction={() => {}}
              infoKey="webSearch"
            />

            <DataSourceItem
              icon={Github}
              title="GitHub"
              description="Find and analyze repositories, users, and organizations"
              buttonText="Connect"
              buttonVariant="outline"
              onAction={() => handleConnect("github")}
              isConnected={connectedServices.github}
              infoKey="github"
            />

            <DataSourceItem
              icon={Calendar}
              title="Google Calendar"
              description="Find availability and schedule meetings"
              buttonText="Private Beta"
              buttonVariant="secondary"
              onAction={() => handleConnect("calendar")}
              isConnected={connectedServices.calendar}
              infoKey="calendar"
            />
            
            <DataSourceItem
              icon={FileText}
              title="Google Drive"
              description="Access and manage your Google Drive files"
              buttonText="Connect"
              buttonVariant={driveConnected ? "success" : "outline"}
              onAction={() => handleConnect("drive")}
              isConnected={driveConnected}
              isLoading={isLoading.drive}
              infoKey="drive"
              scopes={driveConnected ? Array.from(grantedDriveScopes).filter(scope => 
                (scope as string).includes("drive")
              ) : []}
            />
          </div>
        </div>

        {/* Knowledge Base Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Knowledge Base</h2>
          </div>

          <div className="space-y-3">
            <DataSourceItem
              icon={FileText}
              title="Notion"
              description="Query and create pages and databases"
              buttonText="Connect"
              buttonVariant={notionConnected ? "success" : "outline"}
              onAction={() => handleConnect("notion")}
              isConnected={notionConnected}
              isLoading={isLoading.notion}
              infoKey="notion"
              scopes={notionConnected ? Array.from(grantedNotionScopes) : []}
            />
          </div>
        </div>

        {/* Status Messages */}
        {(Object.values(connectedServices).some(Boolean) || driveConnected || notionConnected) && (
          <div className="mt-8 p-4 bg-green-900/20 border border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-400">
                {(Object.values(connectedServices).filter(Boolean).length + 
                  (driveConnected ? 1 : 0) + 
                  (notionConnected ? 1 : 0))}{" "}
                service(s) connected
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
