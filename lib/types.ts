import type { CoreMessage, DeepPartial, CreateMessage } from "ai";
import type { Id } from "../convex/_generated/dataModel";
import { z, ZodObject, ZodRawShape } from "zod";

export interface UserMetadata {
  name?: string;
  email?: string;
  image?: string;
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface ClientMessage {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
  thinking?: string;
  thinkingDuration?: number;
  toolCalls?: any[];
  createdAt: Date;
}

// Server-side Convex types
export interface ConvexChat {
  _id: Id<"chats">;
  title: string;
  createdAt: number;
  updatedAt: number;
  userId: Id<"users">;
  shareId?: string;
  isShared?: boolean;
  isGeneratingTitle?: boolean;
  isBranch?: boolean;
}

export interface ConvexMessage {
  _id: Id<"messages">;
  chatId: Id<"chats">;
  role: "user" | "assistant";
  content: string;
  modelId?: string;
  thinking?: string;
  thinkingDuration?: number;
  isComplete?: boolean;
  isCancelled?: boolean;
  attachments?: Attachment[];
  createdAt: number;
}

export type ToolInvocation = {
  toolName: string;
  args: any;
};

export type Message = ClientMessage;

export type ToolkitConfig<
  ToolNames extends string,
  Parameters extends ZodRawShape = ZodRawShape,
  Tool extends BaseTool = BaseTool,
> = {
  tools: Record<ToolNames, Tool>;
  parameters: z.ZodObject<Parameters>;
};

export type ClientToolkitConifg<Parameters extends ZodRawShape = ZodRawShape> =
  {
    name: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    form: React.ComponentType<{
      parameters: z.infer<ZodObject<Parameters>>;
      setParameters: (parameters: z.infer<ZodObject<Parameters>>) => void;
    }> | null;
    addToolkitWrapper?: React.ComponentType<{
      children: React.ReactNode;
    }>;
    type: ToolkitGroups;
  };

export type ClientToolkit<
  ToolNames extends string = string,
  Parameters extends ZodRawShape = ZodRawShape,
> = ToolkitConfig<ToolNames, Parameters, ClientTool> &
  ClientToolkitConifg<Parameters>;

export type ServerToolkit<
  ToolNames extends string = string,
  Parameters extends ZodRawShape = ZodRawShape,
> = {
  systemPrompt: string;
  tools: (
    params: z.infer<ZodObject<Parameters>>
  ) => Promise<Record<ToolNames, ServerTool>>;
};

// ------------------------------------------------------------
// Tool Types
// ------------------------------------------------------------

export type BaseTool<
  Args extends ZodRawShape = ZodRawShape,
  Result extends ZodRawShape = ZodRawShape,
> = {
  description: string;
  inputSchema: ZodObject<Args>;
  outputSchema: ZodObject<Result>;
};

export type ServerToolConfig<
  Args extends ZodRawShape = ZodRawShape,
  Result extends ZodRawShape = ZodRawShape,
> = {
  callback: (
    args: z.infer<ZodObject<Args>>,
    context: any
  ) => Promise<z.infer<ZodObject<Result>>>;
  message?: string | ((result: z.infer<ZodObject<Result>>) => string);
};

export type ServerTool<
  Args extends ZodRawShape = ZodRawShape,
  Result extends ZodRawShape = ZodRawShape,
> = ServerToolConfig<Args, Result> & BaseTool<Args, Result>;

export type ClientToolConfig<
  Args extends ZodRawShape = ZodRawShape,
  Result extends ZodRawShape = ZodRawShape,
> = {
  CallComponent: React.ComponentType<{
    args: DeepPartial<z.infer<ZodObject<Args>>>;
    isPartial: boolean;
  }>;
  ResultComponent: React.ComponentType<{
    args: z.infer<ZodObject<Args>>;
    result: z.infer<ZodObject<Result>>;
    append: (message: CreateMessage) => void;
  }>;
};

export type ClientTool<
  Args extends ZodRawShape = ZodRawShape,
  Result extends ZodRawShape = ZodRawShape,
> = ClientToolConfig<Args, Result> & BaseTool<Args, Result>;

// ------------------------------------------------------------
// UI Types
// ------------------------------------------------------------

export type SelectedToolkit = {
  id: string;
  toolkit: ClientToolkit;
  parameters: z.infer<ClientToolkit["parameters"]>;
};

export type ToolkitGroup = {
  id: ToolkitGroups;
  name: string;
  icon: React.FC<{ className?: string }>;
};

export enum ToolkitGroups {
  Native = "native",
  KnowledgeBase = "knowledge-base",
  DataSource = "data-source",
}
