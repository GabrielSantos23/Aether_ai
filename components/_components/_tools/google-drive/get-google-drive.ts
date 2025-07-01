import { tool } from 'ai';
import { z } from 'zod';

export const searchGoogleDrive = tool({
  description: 'Search for files in Google Drive with optional query terms.',
  parameters: z.object({
    query: z.string().optional().describe("Search query to find specific files (optional)"),
    limit: z.number().optional().describe("Maximum number of files to return (default: 10)")
  }),
  execute: async (args) => {
    try {
      // The actual API call will be handled by the Convex backend
      // This just returns a request that will be handled by the frontend component
      return {
        type: 'search',
        query: args.query || '',
        limit: args.limit || 10,
      };
    } catch (error) {
      console.error('Google Drive search error:', error);
      return {
        error: 'Failed to search Google Drive',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const readGoogleDriveFile = tool({
  description: 'Read the contents of a file from Google Drive by file ID.',
  parameters: z.object({
    fileId: z.string().describe("The Google Drive file ID to read"),
  }),
  execute: async (args) => {
    try {
      // The actual API call will be handled by the Convex backend
      // This just returns a request that will be handled by the frontend component
      return {
        type: 'read',
        fileId: args.fileId,
      };
    } catch (error) {
      console.error('Google Drive read error:', error);
      return {
        error: 'Failed to read Google Drive file',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
}); 