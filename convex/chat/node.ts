"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { generateAIResponse } from "./shared";
import { CoreMessage } from "ai";
import { api } from "../_generated/api";
import { Modality } from "@google/genai";
import { getOrCreateUserId } from "./shared";

export const sendMessage = action({
  args: {
    chatMessages: v.array(v.any()),
    modelId: v.string(),
    assistantMessageId: v.id("messages"),
    attachments: v.array(
      v.object({
        name: v.string(),
        type: v.string(),
        size: v.number(),
        url: v.string(),
      })
    ),
    userMessageId: v.id("messages"),
    webSearch: v.optional(v.boolean()),
    imageGen: v.optional(v.boolean()),
    message: v.string(),
  },
  handler: async (
    ctx,
    {
      chatMessages,
      modelId,
      assistantMessageId,
      webSearch,
      userMessageId,
      attachments,
      message,
      imageGen,
    }
  ): Promise<{
    success: boolean;
    userMessageId: Id<"messages">;
    assistantMessageId: Id<"messages">;
  }> => {
    console.log("attachments", attachments);

    const getFileType = (file: { type: string }) => {
      if (file.type.startsWith("image")) {
        return "image";
      }
      return "file";
    };

    chatMessages.push({
      role: "user" as const,
      content: [
        {
          type: "text",
          text: message,
        },
        ...attachments.map((file) => ({
          type: getFileType(file),
          [getFileType(file)]: new URL(file.url.replace("blob:", "")),
        })),
      ],
    });

    await generateAIResponse(
      ctx,
      chatMessages as CoreMessage[],
      modelId,
      assistantMessageId,
      webSearch,
      true
    );

    return {
      success: true,
      userMessageId,
      assistantMessageId,
    };
  },
});

// Function to generate an image using Google's Gemini API
export async function generateImage(
  ctx: any,
  prompt: string,
  userGeminiKey: string | null
) {
  try {
    // Use user's key if available, otherwise use system key
    const apiKey = userGeminiKey || process.env.GEMINI_API_KEY;

    // Use Google Gen AI SDK for image generation
    const { GoogleGenAI } = await import("@google/genai");
    const genAI = new GoogleGenAI({ apiKey });

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const parts = result.candidates?.[0]?.content?.parts || [];
    let imageData = null;
    let description = "";

    for (const part of parts) {
      if (part.text) {
        description += part.text;
      } else if (part.inlineData) {
        imageData = part.inlineData.data;
      }
    }

    if (imageData) {
      let storageId;
      let imageUrl;

      try {
        // Direct approach - store the image as a data URL
        const dataUrl = `data:image/png;base64,${imageData}`;

        // Create a simple HTML file with the embedded image
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Generated Image</title>
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5; }
    img { max-width: 100%; max-height: 100vh; object-fit: contain; }
  </style>
</head>
<body>
  <img src="${dataUrl}" alt="Generated image">
</body>
</html>`;

        // Store the HTML file
        storageId = await ctx.storage.store(
          new Blob([htmlContent], { type: "text/html" })
        );

        // Get the URL
        imageUrl = await ctx.storage.getUrl(storageId);

        return {
          success: true,
          prompt: prompt,
          description: description,
          // Store only the lightweight public URL to avoid exceeding the 1 MB Convex document limit
          url: imageUrl, // alias for convenience
          imageUrl: imageUrl, // keep original for compatibility
          storageId: storageId,
          timestamp: new Date().toISOString(),
          usedUserKey: !!userGeminiKey,
          isHtmlWrapper: true,
        };
      } catch (error) {
        console.error("Error storing image data:", error);

        // Return a meaningful error
        return {
          success: false,
          error: "Failed to process image data. Please try again.",
          prompt: prompt,
          timestamp: new Date().toISOString(),
        };
      }

      // This code is unreachable now as we return directly in the try/catch block above
    } else {
      return {
        success: false,
        error: "No image was generated",
        prompt: prompt,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error: any) {
    console.error("Image generation error:", error);

    // Provide more specific error message for common issues
    let errorMessage = error?.message || String(error);
    if (errorMessage.includes("Buffer is not defined")) {
      errorMessage =
        "Buffer processing error. Please check server configuration.";
    }

    return {
      success: false,
      error: `Failed to generate image: ${errorMessage}`,
      prompt: prompt,
      timestamp: new Date().toISOString(),
    };
  }
}
