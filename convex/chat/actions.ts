import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { generateText, CoreMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateAIResponse, getOrCreateUserId } from "./shared";
import { MutationCtx, QueryCtx } from "../_generated/server";

export const retryMessage = action({
  args: {
    chatId: v.id("chats"),
    fromMessageId: v.id("messages"),
    modelId: v.string(),
    webSearch: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { chatId, fromMessageId, modelId, webSearch }
  ): Promise<{
    success: boolean;
    assistantMessageId: Id<"messages">;
  }> => {
    // Verify authentication and chat ownership first
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Authentication required");
    }
    const chat = await ctx.runQuery(api.chat.queries.getChat, { chatId });
    if (!chat) {
      throw new Error("Chat not found or access denied");
    }

    try {
      // Delete messages from the retry point onwards
      await ctx.runMutation(api.chat.mutations.deleteMessagesFromIndex, {
        chatId,
        fromMessageId,
      });

      // Get remaining chat history for context
      const messages = await ctx.runQuery(api.chat.queries.getChatMessages, {
        chatId,
      });

      // Convert to AI SDK format
      const chatMessages: CoreMessage[] = messages
        .filter((msg: any) => msg.isComplete !== false)
        .map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      // Create new assistant message placeholder
      const assistantMessageId: Id<"messages"> = await ctx.runMutation(
        api.chat.mutations.addMessage,
        {
          chatId,
          role: "assistant",
          content: "",
          modelId,
          isComplete: false,
        }
      );

      // Generate the AI response
      await generateAIResponse(
        ctx,
        chatMessages,
        modelId,
        assistantMessageId,
        webSearch
      );

      return {
        success: true,
        assistantMessageId,
      };
    } catch (error) {
      console.error("Error in retryMessage action:", error);

      // Add error message to chat
      await ctx.runMutation(api.chat.mutations.addMessage, {
        chatId,
        role: "assistant",
        content:
          "I apologize, but I encountered an error while retrying the message. Please try again.",
        modelId,
      });

      throw error;
    }
  },
});

export const editMessageAndRegenerate = action({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    modelId: v.string(),
    webSearch: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { messageId, content, modelId, webSearch }
  ): Promise<{
    success: boolean;
    assistantMessageId: Id<"messages">;
  }> => {
    // Verify authentication and chat ownership first
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Get the message to validate and get chat info
    const message = await ctx.runQuery(api.chat.queries.getMessage, {
      messageId,
    });
    if (!message) {
      throw new Error("Message not found");
    }

    const chat = await ctx.runQuery(api.chat.queries.getChat, {
      chatId: message.chatId,
    });
    if (!chat) {
      throw new Error("Chat not found or access denied");
    }

    // Only allow editing user messages
    if (message.role !== "user") {
      throw new Error("Only user messages can be edited");
    }

    try {
      // First, update the user message content
      await ctx.runMutation(api.chat.mutations.updateMessage, {
        messageId,
        content,
      });

      // Get all messages in the chat to find what comes after the edited message
      const allMessages = await ctx.runQuery(api.chat.queries.getChatMessages, {
        chatId: message.chatId,
      });

      // Find the index of the edited message
      const editedMessageIndex = allMessages.findIndex(
        (msg: any) => msg._id === messageId
      );
      if (editedMessageIndex === -1) {
        throw new Error("Message not found in chat");
      }

      // Find the next assistant message after the edited user message
      let nextAssistantMessageIndex = -1;
      for (let i = editedMessageIndex + 1; i < allMessages.length; i++) {
        if (allMessages[i].role === "assistant") {
          nextAssistantMessageIndex = i;
          break;
        }
      }

      // If there's an assistant message after the edited user message, delete it and all subsequent messages
      if (nextAssistantMessageIndex !== -1) {
        const fromMessageId = allMessages[nextAssistantMessageIndex]._id;
        await ctx.runMutation(api.chat.mutations.deleteMessagesFromIndex, {
          chatId: message.chatId,
          fromMessageId,
        });
      }

      // Get remaining chat history for context (including the updated user message)
      const messages = await ctx.runQuery(api.chat.queries.getChatMessages, {
        chatId: message.chatId,
      });

      // Convert to AI SDK format
      const chatMessages: CoreMessage[] = messages
        .filter((msg: any) => msg.isComplete !== false)
        .map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      // Create new assistant message placeholder
      const assistantMessageId: Id<"messages"> = await ctx.runMutation(
        api.chat.mutations.addMessage,
        {
          chatId: message.chatId,
          role: "assistant",
          content: "",
          modelId,
          isComplete: false,
        }
      );

      // Generate the AI response
      await generateAIResponse(
        ctx,
        chatMessages,
        modelId,
        assistantMessageId,
        webSearch
      );

      return {
        success: true,
        assistantMessageId,
      };
    } catch (error) {
      console.error("Error in editMessageAndRegenerate action:", error);

      // Add error message to chat
      await ctx.runMutation(api.chat.mutations.addMessage, {
        chatId: message.chatId,
        role: "assistant",
        content:
          "I apologize, but I encountered an error while processing your edited message. Please try again.",
        modelId,
      });

      throw error;
    }
  },
});

// ACTIONS - for external API calls
export const sendMessage = action({
  args: {
    chatId: v.id("chats"),
    message: v.string(),
    modelId: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          type: v.string(),
          size: v.number(),
          url: v.string(),
        })
      )
    ),
    webSearch: v.optional(v.boolean()),
    imageGen: v.optional(v.boolean()),
    research: v.optional(v.boolean()), // <-- Add this line
  },
  handler: async (
    ctx,
    { chatId, message, modelId, attachments, webSearch, imageGen, research } // <-- Add research here
  ): Promise<{
    success: boolean;
    userMessageId: Id<"messages">;
    assistantMessageId: Id<"messages">;
  }> => {
    try {
      // Verify authentication and chat ownership first
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Authentication required");
      }

      const chat = await ctx.runQuery(api.chat.queries.getChat, { chatId });
      if (!chat) {
        throw new Error("Chat not found or access denied");
      }

      // Get chat history for context
      const messages = await ctx.runQuery(api.chat.queries.getChatMessages, {
        chatId,
      });

      // Log if this is the first message in the chat
      const isFirstMessage = messages.length === 0;

      // Add user message to the database
      const userMessageId: Id<"messages"> = await ctx.runMutation(
        api.chat.mutations.addMessage,
        {
          chatId,
          role: "user",
          content: message,
          attachments,
        }
      );

      // Convert to AI SDK format
      const chatMessages: CoreMessage[] = messages
        .filter((msg: any) => msg.isComplete !== false)
        .map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      // Create assistant message placeholder
      const assistantMessageId: Id<"messages"> = await ctx.runMutation(
        api.chat.mutations.addMessage,
        {
          chatId,
          role: "assistant",
          content: "",
          modelId,
          isComplete: false,
        }
      );

      // Add the new user message to chat history for context
      chatMessages.push({
        role: "user" as const,
        content: [
          {
            type: "text",
            text: message,
          },
        ],
      });

      // Handle attachments or image generation
      if ((attachments && attachments.length > 0) || imageGen) {
        return await ctx.runAction(api.chat.node.sendMessage, {
          chatMessages,
          modelId,
          attachments: attachments ?? [],
          message,
          assistantMessageId,
          webSearch,
          userMessageId,
          imageGen,
          // research, // REMOVE this line, only pass if node.sendMessage supports it
        });
      }

      try {
        await generateAIResponse(
          ctx,
          chatMessages,
          modelId,
          assistantMessageId,
          webSearch,
          undefined, // isNode
          research // Pass research as 7th argument
        );

        return {
          success: true,
          userMessageId,
          assistantMessageId,
        };
      } catch (error: any) {
        console.error(
          `Error generating response with model ${modelId}:`,
          error
        );

        // Update the existing message with error information
        await ctx.runMutation(api.chat.mutations.updateMessage, {
          messageId: assistantMessageId,
          content: `I apologize, but I couldn't generate a response. ${
            error.message
              ? `Error: ${error.message}`
              : "Please check your API keys in settings or try a different model."
          }`,
          isComplete: true,
        });

        throw error;
      }
    } catch (error: any) {
      console.error("Error in sendMessage action:", error);

      // Only add a new error message if we didn't already update the existing one
      if (!error.message?.includes("API key")) {
        await ctx.runMutation(api.chat.mutations.addMessage, {
          chatId,
          role: "assistant",
          content:
            "I apologize, but I encountered an error while processing your message. Please try again.",
          modelId,
        });
      }

      throw error;
    }
  },
});

export const generateTitle = action({
  args: {
    chatId: v.id("chats"),
    messageContent: v.string(),
    modelId: v.string(),
  },
  handler: async (ctx, { chatId, messageContent, modelId }) => {
    try {
      // Get the API key from environment or use the fallback
      const envApiKey = process.env.GEMINI_API_KEY || "";

      if (!envApiKey) {
        console.error("No Gemini API key available for title generation");
        await ctx.runMutation(api.chat.mutations.updateChatTitle, {
          chatId,
          title: "New Chat",
        });
        return;
      }

      const google = createGoogleGenerativeAI({ apiKey: envApiKey });
      const aiModel = google("gemini-2.0-flash-lite");

      let titlePrompt = `Based on the following user message, generate a short, concise title for the chat (4-5 words max) No Markdown Allowed:\n\nUser: "${messageContent}"\n\nTitle:`;

      const { text } = await generateText({
        model: aiModel,
        prompt: titlePrompt,
        maxTokens: 20,
      });

      let finalTitle = text || "New Chat";

      // Clean up the title
      finalTitle = finalTitle.replace(/"/g, "").trim();
      if (!finalTitle || finalTitle.length < 2) {
        finalTitle = "New Chat";
      }

      await ctx.runMutation(api.chat.mutations.updateChatTitle, {
        chatId,
        title: finalTitle,
      });
    } catch (error) {
      console.error("Error generating title:", error);
      // If title generation fails, just set a generic title
      await ctx.runMutation(api.chat.mutations.updateChatTitle, {
        chatId,
        title: "New Chat",
      });
    }
  },
});

export const searchChats = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx: QueryCtx, { searchQuery }) => {
    // Ensure the user is authenticated before allowing them to search.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // If no user is authenticated, return an empty array.
      return [];
    }

    // Retrieve all chats from the database.
    // For a larger application, you might want to paginate this.
    const allChats = await ctx.db.query("chats").collect();

    // Filter the chats to only include those belonging to the current user.
    const userChats = allChats.filter(
      (chat) => chat.userId === identity.subject
    );

    // If the search query is empty, return all of the user's chats.
    if (searchQuery.trim() === "") {
      return userChats;
    }

    // Filter the user's chats based on the search query.
    // This is a case-insensitive search.
    const filteredChats = userChats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filteredChats;
  },
});
