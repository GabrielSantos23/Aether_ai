// shared.ts
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
  streamText,
  wrapLanguageModel,
  extractReasoningMiddleware,
  tool,
  CoreMessage,
  smoothStream,
} from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import {
  basePersonality,
  getBasePersonality,
} from "../../components/prompts/base";
import { models } from "../../lib/models";
import { getZepClient } from "../../lib/zep";
let _zepClient: any | null = null;

async function getZep() {
  if (_zepClient) return _zepClient;
  _zepClient = await getZepClient();
  return _zepClient;
}
import { generateImage } from "./node";

export const mapModel = (modelId: string) => {
  const model = models.find((m: any) => m.id === modelId);

  if (!model) {
    console.warn(
      `Model not found in models list: ${modelId}, falling back to gemini`
    );
    return {
      model: null,
      thinking: false,
      provider: "gemini" as const,
    };
  }

  // Special handling for OpenRouter models
  if (model.provider === "openrouter") {
    // Make sure the model ID format is correct for OpenRouter
    // Some OpenRouter models need the format "org/model" or "org/model:tag"
  }

  return {
    model: model,
    thinking: model.supportsThinking || false,
    provider: model.provider,
  };
};

// Helper function to generate AI response
export const generateAIResponse = async (
  ctx: any,
  chatMessages: CoreMessage[],
  modelId: string,
  assistantMessageId: Id<"messages">,
  webSearch?: boolean,
  isNode = false
) => {
  try {
    // If this is the first message, add a system message to help the AI understand context
    if (chatMessages.length === 1) {
      const systemMessage: CoreMessage = {
        role: "system",
        content:
          "You are a helpful AI assistant. This is the first message in this conversation.",
      };
      // Insert system message at the beginning
      chatMessages.unshift(systemMessage);
    }

    const { model, thinking, provider } = mapModel(modelId);

    if (!model) {
      console.error(`Model not found in models list: ${modelId}`);
      throw new Error(`Invalid model selected: ${modelId}`);
    }

    // Get user's API keys for different providers
    const userGeminiKey = await ctx.runQuery(
      api.api_keys.getUserDefaultApiKey,
      {
        service: "gemini",
      }
    );
    const userGroqKey = await ctx.runQuery(api.api_keys.getUserDefaultApiKey, {
      service: "groq",
    });
    const userOpenRouterKey = await ctx.runQuery(
      api.api_keys.getUserDefaultApiKey,
      { service: "openrouter" }
    );
    const userMoonshotKey = await ctx.runQuery(
      api.api_keys.getUserDefaultApiKey,
      { service: "moonshot" }
    );

    // Get environment API keys
    const envGeminiKey = process.env.GEMINI_API_KEY;
    const envGroqKey = process.env.GROQ_API_KEY;
    const envOpenRouterKey = process.env.OPENROUTER_API_KEY;
    const envMoonshotKey = process.env.MOONSHOT_KEY;

    let activeGeminiKey = userGeminiKey || envGeminiKey;
    let activeGroqKey = userGroqKey || envGroqKey;
    let activeOpenRouterKey = userOpenRouterKey || envOpenRouterKey;
    let activeMoonshotKey = userMoonshotKey || envMoonshotKey;

    if (provider === "gemini") {
      if (userGeminiKey) {
        console.log("Using user's Gemini API key");
      } else if (envGeminiKey) {
        console.log("Using environment Gemini API key");
      } else {
        console.error("No Gemini API key available - request will fail");
      }

      if (!activeGeminiKey) {
        throw new Error(
          "No Gemini API key available. Please add a Gemini API key in settings."
        );
      }
    } else if (provider === "groq") {
      if (userGroqKey) {
        console.log("Using user's Groq API key");
      } else if (envGroqKey) {
        console.log("Using environment Groq API key");
      } else {
        console.error("No Groq API key available - request will fail");
      }

      if (!activeGroqKey) {
        throw new Error(
          "No valid Groq API key available. Please add a Groq API key in settings."
        );
      }
    } else if (provider === "openrouter") {
      if (userOpenRouterKey) {
        console.log("Using user's OpenRouter API key");
      } else if (envOpenRouterKey) {
        console.log("Using environment OpenRouter API key");
      } else {
        console.error("No OpenRouter API key available - request will fail");
      }

      if (!activeOpenRouterKey) {
        throw new Error(
          "No valid OpenRouter API key available. Please add an OpenRouter API key in settings."
        );
      }
    } else if (provider === "moonshot") {
      if (userMoonshotKey) {
        console.log("Using user's Moonshot API key");
      } else if (envMoonshotKey) {
        console.log("Using environment Moonshot API key");
      } else {
        console.error("No Moonshot API key available - request will fail");
      }

      if (!activeMoonshotKey) {
        throw new Error(
          "No valid Moonshot API key available. Please add a Moonshot API key in settings."
        );
      }
    }

    // Initialize AI clients with the active API keys
    const google = createGoogleGenerativeAI({
      apiKey: activeGeminiKey,
    });

    const openrouter = activeOpenRouterKey
      ? createOpenRouter({
          apiKey: activeOpenRouterKey,
        })
      : null;

    const groq = activeGroqKey
      ? createGroq({
          apiKey: activeGroqKey,
        })
      : null;

    const moonshot = activeMoonshotKey
      ? createOpenAICompatible({
          apiKey: activeMoonshotKey,
          baseURL: "https://api.moonshot.ai/v1",
          name: "moonshot",
        })
      : null;

    let aiModel;
    try {
      if (provider === "gemini") {
        aiModel = google(model.id);
      } else if (provider === "openrouter") {
        if (!openrouter) {
          throw new Error(
            "OpenRouter client not initialized due to missing API key"
          );
        }
        aiModel = openrouter(model.id);
      } else if (provider === "groq") {
        if (!groq) {
          throw new Error("Groq client not initialized due to missing API key");
        }
        aiModel = groq(model.id);
      } else if (provider === "moonshot") {
        if (!moonshot) {
          throw new Error(
            "Moonshot client not initialized due to missing API key"
          );
        }
        aiModel = moonshot.chatModel
          ? moonshot.chatModel(model.id)
          : moonshot(model.id);
      } else {
        aiModel = google("gemini-2.0-flash");
      }
    } catch (error: any) {
      console.error(`Error initializing AI model ${model.id}:`, error);
      throw new Error(
        `Failed to initialize AI model: ${error.message || String(error)}`
      );
    }

    // Fetch user settings
    const userSettings = await ctx.runQuery(api.users.getMySettings);
    let personalizedSystemPrompt = getBasePersonality();

    if (userSettings) {
      let personalization = "### User Personalization\n";
      if (userSettings.userName)
        personalization += `The user's name is ${userSettings.userName}.\n`;
      if (userSettings.userRole)
        personalization += `The user is a ${userSettings.userRole}.\n`;
      if (userSettings.userTraits && userSettings.userTraits.length > 0) {
        personalization += `The user has the following traits/interests: ${userSettings.userTraits.join(", ")}.\n`;
      }
      if (userSettings.userAdditionalInfo) {
        personalization += `Here is some additional information about the user: ${userSettings.userAdditionalInfo}\n`;
      }

      if (userSettings.promptTemplate) {
        personalizedSystemPrompt = `${userSettings.promptTemplate}\n\n${personalization}`;
      } else {
        personalizedSystemPrompt = `${getBasePersonality()}\n\n${personalization}`;
      }
    }

    // ---- Zep integration: retrieve relevant memories ----
    const zepEnabled = !!process.env.ZEP_API_KEY;
    const userIdentity = await ctx.auth.getUserIdentity();
    const zepUserId =
      userIdentity?.tokenIdentifier ||
      userIdentity?.subject ||
      userIdentity?.email;

    if (zepEnabled && zepUserId) {
      try {
        const lastUserMsg = [...chatMessages]
          .reverse()
          .find((m) => m.role === "user");

        if (lastUserMsg) {
          const queryContent =
            typeof lastUserMsg.content === "string"
              ? lastUserMsg.content
              : JSON.stringify(lastUserMsg.content ?? "");

          console.log("[ZEP] Searching memories", { queryContent });
          const zep = await getZep();
          const searchRes: any[] = await zep.memory.search(zepUserId, {
            text: queryContent,
            limit: 5,
          });
          console.log("[ZEP] Search result count", searchRes?.length);

          if (Array.isArray(searchRes) && searchRes.length > 0) {
            const context = searchRes
              .map((m) => {
                if (m.text) return `- ${m.text}`;
                if (m.fact) return `- ${m.fact}`;
                return `- ${JSON.stringify(m)}`;
              })
              .join("\n");
            personalizedSystemPrompt = `### Relevant Memories\n${context}\n\n${personalizedSystemPrompt}`;
          }
        }
      } catch (err) {
        console.error("Zep search error:", err);
      }
    }

    // Determine which key to use for image generation
    const shouldUseUserGeminiKey = !!userGeminiKey;

    // Prepare tools
    const tools: any = {};

    // Add weather tool - always available
    tools.getWeather = tool({
      description:
        "Get the current weather at a location specified by latitude and longitude. Use this when the user asks about weather conditions. For user's current location, set useCurrentLocation to true.",
      parameters: z.object({
        // Use a single object structure with optional fields to maintain compatibility
        latitude: z
          .number()
          .optional()
          .describe(
            "The latitude coordinate of the location (not needed if useCurrentLocation is true)"
          ),
        longitude: z
          .number()
          .optional()
          .describe(
            "The longitude coordinate of the location (not needed if useCurrentLocation is true)"
          ),
        useCurrentLocation: z
          .boolean()
          .optional()
          .describe(
            "Set to true to use the user's current location instead of providing coordinates"
          ),
      }),
      execute: async (args) => {
        try {
          // Handle current location request
          if (args.useCurrentLocation) {
            return {
              needsLocation: true,
              message: "Requesting user location permission...",
            };
          }

          // Use provided coordinates
          const { latitude, longitude } = args;

          if (latitude === undefined || longitude === undefined) {
            throw new Error(
              "Latitude and longitude are required when not using current location"
            );
          }

          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
          );

          if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
          }

          const weatherData = await response.json();
          return weatherData;
        } catch (error) {
          console.error("Weather API error:", error);
          return {
            error: "Failed to fetch weather data",
            message: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    });

    // Add Google Drive tools if the model supports it
    if (model.features && model.features.includes("googledrive")) {
      // Add Google Drive search tool
      tools.searchGoogleDrive = tool({
        description:
          "Search for files in Google Drive with optional query terms.",
        parameters: z.object({
          query: z
            .string()
            .optional()
            .describe("Search query to find specific files (optional)"),
          limit: z
            .number()
            .optional()
            .describe("Maximum number of files to return (default: 10)"),
        }),
        execute: async (args) => {
          try {
            // Perform the search using the Convex action so that the AI can immediately
            // receive and reason over the real results instead of a placeholder.
            const files = await ctx.runAction(api.files.listGoogleDriveFiles, {
              query: args.query || "",
              limit: args.limit || 10,
            });

            return {
              type: "search",
              query: args.query || "",
              limit: args.limit || 10,
              results: files,
            };
          } catch (error) {
            console.error("Google Drive search error:", error);
            return {
              error: "Failed to search Google Drive",
              message: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      });

      // Add Google Drive file read tool
      tools.readGoogleDriveFile = tool({
        description:
          "Read the contents of a file from Google Drive by file ID.",
        parameters: z.object({
          fileId: z.string().describe("The Google Drive file ID to read"),
        }),
        execute: async (args) => {
          try {
            // Fetch the file content via Convex action so the AI can use it immediately.
            const content = await ctx.runAction(api.files.readGoogleDriveFile, {
              fileId: args.fileId,
            });

            return {
              type: "read",
              fileId: args.fileId,
              ...content,
            };
          } catch (error) {
            console.error("Google Drive read error:", error);
            return {
              error: "Failed to read Google Drive file",
              message: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      });
    }

    if (webSearch) {
      tools.search = tool({
        description:
          "Search the web for current information. Use this when you need up-to-date information that might not be in your training data. IMPORTANT: Always explain what you're searching for and why before calling this tool.",
        parameters: z.object({
          query: z
            .string()
            .describe("The search query to find relevant information"),
        }),
        execute: async ({ query }) => {
          try {
            // Get Tavily API key with better error handling
            const tavilyApiKey = process.env.TAVILY_API_KEY;

            // Log key presence (but not the actual key)
            console.log(`Tavily API key available: ${!!tavilyApiKey}`);

            if (!tavilyApiKey) {
              throw new Error("Tavily API key is missing");
            }

            const response = await fetch("https://api.tavily.com/search", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tavilyApiKey}`,
              },
              body: JSON.stringify({
                query,
                search_depth: "basic",
                include_answer: true,
                include_raw_content: false,
                max_results: 5,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(
                `Search API error: ${response.status}, ${errorText}`
              );
              throw new Error(`Search API error: ${response.status}`);
            }

            const data = await response.json();

            return {
              query,
              answer: data.answer || "",
              results: data.results || [],
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            console.error("Web search error:", error);
            return {
              query,
              error: "Failed to perform web search",
              results: [],
              timestamp: new Date().toISOString(),
            };
          }
        },
      });
    }

    //Add image generation tool
    if (model.features.includes("imagegen")) {
      tools.generateImage = tool({
        description:
          "Generate an image based on a text description. Use this when the user asks you to create, generate, or make an image. IMPORTANT: Always explain what you're going to generate and why before calling this tool.",
        parameters: z.object({
          prompt: z
            .string()
            .describe("The detailed description of the image to generate"),
        }),
        execute: async ({ prompt }) => {
          // Call the Node.js function from node.ts
          return generateImage(ctx, prompt, userGeminiKey);
        },
      });
    }

    // Add deep research tool - always available
    tools.startDeepResearch = tool({
      description:
        "Perform an in-depth multi-layered web research on a given topic and deliver a structured PDF report. Use this when the user explicitly requests a comprehensive research report.",
      parameters: z.object({
        topic: z
          .string()
          .describe("The research topic the user wants to investigate"),
        depth: z
          .number()
          .min(1)
          .max(5)
          .optional()
          .describe("Number of recursive research layers (default 3)"),
      }),
      execute: async ({ topic, depth }) => {
        // The actual Trigger.dev workflow will be started client-side.
        // We simply return a payload the UI can use to kick it off.
        return {
          type: "deep-research",
          query: topic,
          depth: depth ?? 3,
        };
      },
    });

    // Configure provider-specific options
    const providerOptions: any = {
      google: {
        thinkingConfig: thinking
          ? {
              thinkingBudget: 2048,
            }
          : {},
        // Add Google-specific options to encourage text generation
        candidateCount: 1,
        safetySettings: [],
      },
    };

    // Only add OpenRouter options if we're using that provider
    if (provider === "openrouter") {
      providerOptions.openrouter = {
        // OpenRouter specific options
        transforms: ["middle-out"],
      };
    }

    // Configure stream options based on the provider
    const streamOptions: any = {
      system: personalizedSystemPrompt,
      model: thinking
        ? wrapLanguageModel({
            model: aiModel,
            middleware: extractReasoningMiddleware({
              tagName: "think",
              startWithReasoning: true,
            }),
          })
        : aiModel,
      messages: chatMessages,
      maxSteps: 20,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      toolChoice: Object.keys(tools).length > 0 ? "auto" : undefined,
      temperature: 0.7,
      providerOptions,
      experimental_transform: smoothStream({
        chunking: isNode ? "line" : "word",
      }),
    };

    // Add provider-specific parameters
    if (provider === "openrouter") {
      streamOptions.maxTokens = 4000;
    }

    let fullStream;
    try {
      const result = streamText(streamOptions);
      fullStream = result.fullStream;
    } catch (error: any) {
      console.error(
        `Failed to initialize stream with ${provider}/${model.id}:`,
        error
      );
      throw new Error(
        `Failed to initialize AI stream: ${error.message || String(error)}`
      );
    }

    let accumulatedContent = "";
    let accumulatedThinking = "";
    let thinkingStartTime: number | null = null;
    let thinkingEndTime: number | null = null;
    let accumulatedToolCalls: any[] = [];
    let hasGeneratedTextBeforeTools = false;

    // Batching mechanism for performance optimization
    let lastUpdateTime = Date.now();
    let pendingContentUpdate = false;
    let pendingThinkingUpdate = false;
    const UPDATE_INTERVAL = 150; // Update every 150ms max

    // Debounced update function
    const scheduleUpdate = async (force = false) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime;

      if (!force && timeSinceLastUpdate < UPDATE_INTERVAL) {
        // Schedule an update if one isn't already pending
        if (!pendingContentUpdate && !pendingThinkingUpdate) {
          setTimeout(
            () => scheduleUpdate(true),
            UPDATE_INTERVAL - timeSinceLastUpdate
          );
        }
        return;
      }

      try {
        if (pendingContentUpdate || pendingThinkingUpdate) {
          await ctx.runMutation(api.chat.mutations.updateMessage, {
            messageId: assistantMessageId,
            content: accumulatedContent,
            thinking: accumulatedThinking || undefined,
            isComplete: false,
          });
          lastUpdateTime = now;
          pendingContentUpdate = false;
          pendingThinkingUpdate = false;
        }
      } catch (updateError) {
        console.warn(
          "Failed to update message during batched update:",
          updateError
        );
      }
    };

    for await (const chunk of fullStream) {
      try {
        // Check if the message has been cancelled
        const message = await ctx.runQuery(api.chat.queries.getMessage, {
          messageId: assistantMessageId,
        });
        if (message?.isCancelled) {
          break;
        }

        // Handle different chunk types with proper type checking
        if (chunk.type === "text-delta") {
          accumulatedContent += chunk.textDelta;
          hasGeneratedTextBeforeTools = true;
          pendingContentUpdate = true;

          // Schedule batched update
          await scheduleUpdate();
        } else if (chunk.type === "reasoning") {
          // Track thinking start time
          if (!thinkingStartTime) {
            thinkingStartTime = Date.now();
          }

          if (provider === "gemini") {
            // Handle Google's reasoning differently
            if (
              typeof chunk.textDelta === "string" &&
              chunk.textDelta.startsWith("**")
            ) {
              // This is reasoning content - accumulate it
              accumulatedThinking += chunk.textDelta;
              pendingThinkingUpdate = true;

              // Schedule batched update for thinking
              await scheduleUpdate();
            } else {
              // This is regular content mixed with reasoning
              accumulatedContent += chunk.textDelta;
              pendingContentUpdate = true;

              // Schedule batched update
              await scheduleUpdate();
            }
          } else {
            // For other providers, reasoning is separate
            accumulatedThinking += chunk.textDelta;
            pendingThinkingUpdate = true;

            // For thinking models, also add reasoning to content
            // This fixes the issue with models that only output reasoning chunks
            if (model.supportsThinking) {
              accumulatedContent += chunk.textDelta;
              pendingContentUpdate = true;
            }

            // Schedule batched update for thinking
            await scheduleUpdate();
          }
        } else if (chunk.type === "tool-call") {
          // Cast to the expected tool call type
          const toolCallChunk = chunk as {
            type: "tool-call";
            toolName: string;
            toolCallId: string;
            args: any;
          };

          // If no text was generated before this tool call, add some explanatory text
          if (
            !hasGeneratedTextBeforeTools &&
            accumulatedContent.trim() === ""
          ) {
            let explanatoryText = "";
            if (toolCallChunk.toolName === "generateImage") {
              explanatoryText = `I'll generate an image for you based on your request. `;
            } else if (toolCallChunk.toolName === "search") {
              explanatoryText = `Let me search for current information about that. `;
            } else {
              explanatoryText = `I'll use a tool to help with your request. `;
            }
            accumulatedContent += explanatoryText;
          }

          const placeholder = `\n[TOOL_CALL:${toolCallChunk.toolCallId}]\n`;
          accumulatedContent += placeholder;
          accumulatedToolCalls.push({
            toolCallId: toolCallChunk.toolCallId,
            toolName: toolCallChunk.toolName,
            args: toolCallChunk.args,
          });

          try {
            await ctx.runMutation(api.chat.mutations.updateMessage, {
              messageId: assistantMessageId,
              content: accumulatedContent,
              toolCalls: accumulatedToolCalls,
            });
          } catch (toolCallError) {
            console.warn(
              "Failed to update message with tool call:",
              toolCallError
            );
          }
        } else if ("toolCallId" in chunk && "result" in chunk) {
          // Handle tool result chunks safely by checking for required properties
          const toolCallId = (chunk as any).toolCallId;
          const result = (chunk as any).result;

          const toolCall = accumulatedToolCalls.find(
            (tc) => tc.toolCallId === toolCallId
          );
          if (toolCall) {
            toolCall.result = result;
          }

          try {
            await ctx.runMutation(api.chat.mutations.updateMessage, {
              messageId: assistantMessageId,
              toolCalls: accumulatedToolCalls,
            });
          } catch (toolResultError) {
            console.warn(
              "Failed to update message with tool result:",
              toolResultError
            );
          }
        } else if (chunk.type === "finish") {
          // Track thinking end time
          if (thinkingStartTime && !thinkingEndTime) {
            thinkingEndTime = Date.now();
          }

          // Calculate thinking duration in seconds
          const duration =
            thinkingStartTime && thinkingEndTime
              ? Math.round((thinkingEndTime - thinkingStartTime) / 1000)
              : undefined;

          // Force final update to ensure all content is saved
          await scheduleUpdate(true);

          // Mark the message as complete with final thinking data
          await ctx.runMutation(api.chat.mutations.updateMessage, {
            messageId: assistantMessageId,
            content: accumulatedContent,
            thinking: accumulatedThinking || undefined,
            thinkingDuration: duration,
            isComplete: true,
            toolCalls: accumulatedToolCalls,
          });

          // ---- Zep integration: store conversation ----
          if (zepEnabled && zepUserId) {
            try {
              const userContent =
                chatMessages[chatMessages.length - 1]?.content || "";
              const assistantContent = accumulatedContent;

              const zep = await getZep();
              console.log("[ZEP] Adding conversation turn to memory");

              await zep.memory.add(zepUserId, {
                messages: [
                  { role_type: "user", content: String(userContent) },
                  { role_type: "assistant", content: String(assistantContent) },
                ],
              });
              console.log("[ZEP] Memory add complete");
            } catch (err) {
              console.error("Zep memory add error:", err);
            }
          }

          break;
        } else if (chunk.type === "error") {
          // Force final update before handling error
          await scheduleUpdate(true);

          // Handle error
          await ctx.runMutation(api.chat.mutations.updateMessage, {
            messageId: assistantMessageId,
            content:
              accumulatedContent +
              "\n\n*Error occurred while generating response.*",
            thinking: accumulatedThinking || undefined,
            isComplete: true,
          });
          break;
        } else if (
          chunk.type === "step-start" ||
          chunk.type === "step-finish"
        ) {
          // These are normal chunks from the AI SDK, just log them
          // No need to break or update for these chunks
        }
      } catch (updateError) {
        // If we can't update the message (e.g., due to conflicts), continue streaming
        // but don't fail the entire operation
        console.warn("Failed to update message during streaming:", updateError);

        // Try to continue processing chunks, don't break the loop
      }
    }

    // Ensure the message is marked as complete even if the loop exits unexpectedly
    try {
      // Force final update to ensure all content is saved
      await scheduleUpdate(true);

      // If no content was generated at all, provide a fallback message
      if (!accumulatedContent || accumulatedContent.trim() === "") {
        // Check if we have thinking content but no regular content
        // This is likely happening with models that only output reasoning chunks
        if (accumulatedThinking && accumulatedThinking.trim() !== "") {
          // Use the thinking content as the main content
          accumulatedContent = accumulatedThinking;
        } else {
          accumulatedContent =
            "I apologize, but I couldn't generate a response. Please try again.";
        }
      }

      await ctx.runMutation(api.chat.mutations.updateMessage, {
        messageId: assistantMessageId,
        content: accumulatedContent,
        thinking: accumulatedThinking || undefined,
        isComplete: true,
        toolCalls: accumulatedToolCalls,
      });
    } catch (finalUpdateError) {
      console.warn("Failed to mark message as complete:", finalUpdateError);

      // One more attempt with simplified content
      try {
        await ctx.runMutation(api.chat.mutations.updateMessage, {
          messageId: assistantMessageId,
          content:
            "I apologize, but I couldn't generate a complete response. Please try again.",
          isComplete: true,
        });
      } catch (lastAttemptError) {
        console.error(
          "Final attempt to update message failed:",
          lastAttemptError
        );
      }
    }
  } catch (error) {
    console.error("Error in generateAIResponse:", error);
    // Ensure the message is marked as complete even if the function fails
    try {
      await ctx.runMutation(api.chat.mutations.updateMessage, {
        messageId: assistantMessageId,
        content: "Generation failed.",
        thinking: undefined,
        isComplete: true,
        toolCalls: [],
      });
    } catch (finalUpdateError) {
      console.warn("Failed to mark message as complete:", finalUpdateError);
    }
  }
};

// Helper function to get or create a user record
export async function getOrCreateUserId(
  ctx: any,
  tokenIdentifier: string,
  email?: string
) {
  // First, try to find the user by tokenIdentifier
  let user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", tokenIdentifier))
    .first();

  // If not found by tokenIdentifier, try to find by email
  if (!user && email) {
    user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", email))
      .first();
    // If found by email but missing tokenIdentifier, patch it
    if (user && !user.tokenIdentifier) {
      await ctx.db.patch(user._id, { tokenIdentifier });
    }
  }

  // If still not found, create a minimal user record
  if (!user) {
    const userId = await ctx.db.insert("users", {
      name: "User",
      email: email || "user@example.com",
      image: "",
      tokenIdentifier: tokenIdentifier,
    });

    return userId;
  }

  return user._id;
}
