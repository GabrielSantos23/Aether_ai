# Google Drive AI Tools

This directory contains tools for integrating Google Drive with AI features in the application. These tools allow the AI to search, read, and list files from a user's Google Drive account.

## Available Tools

1. **Search Google Drive** (`google_drive_search.ts`)

   - Search for files and folders in Google Drive based on a query
   - Filter by file type (document, spreadsheet, presentation, PDF, folder)
   - Limit the number of results

2. **Read Google Drive File** (`google_drive_read.ts`)

   - Read the contents of a file from Google Drive
   - Works with text files, documents, spreadsheets, and PDFs
   - Limit the content length to avoid large responses

3. **List Google Drive Folder** (`google_drive_list.ts`)
   - List files and subfolders in a Google Drive folder
   - List from the root folder or a specific folder ID
   - Sort by name, modified time, or created time
   - Limit the number of results

## Usage Example

```typescript
import { googleDriveTools } from "./_components/_tools/google_drive_tools";

// In your AI chat handler:
const tools = {
  ...googleDriveTools({ session, dataStream }),
  // Other tools...
};

// Then pass these tools to your AI provider
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: messages,
  tools: Object.values(tools).map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  })),
  stream: true,
});
```

## Implementation Notes

The current implementation uses mock data for demonstration purposes. In a production environment, you would:

1. Implement proper Google Drive API authentication
2. Create Convex functions to handle Google Drive API calls
3. Update the tools to use these Convex functions
4. Add proper error handling and rate limiting

## Required Setup

To use these tools in production:

1. Set up Google OAuth credentials in your project
2. Implement the Google Drive API integration
3. Create a connection flow for users to authorize access to their Google Drive
4. Store and manage refresh tokens securely

## Security Considerations

- Always validate user permissions before accessing Google Drive files
- Implement proper token refresh and error handling
- Consider implementing rate limiting to prevent abuse
- Never expose Google API keys or tokens in client-side code
