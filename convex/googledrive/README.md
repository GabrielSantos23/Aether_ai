# Google Drive Toolkit

This toolkit provides integration with Google Drive, allowing the AI to search, list, and read files from the user's Google Drive.

## Features

- **List Files**: Browse files and folders in Google Drive
- **Search Files**: Find files by name or content
- **Read File**: Read the content of text files, documents, and spreadsheets

## Setup

1. Configure Google OAuth in your project:

   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Go to "APIs & Services" > "Credentials"
   - Create an OAuth 2.0 Client ID
   - Add the following scopes:
     - `https://www.googleapis.com/auth/drive.readonly`
   - Add your redirect URIs (e.g., `http://localhost:3000/api/auth/callback/google`)

2. Add your Google OAuth credentials to your environment variables:

   ```
   AUTH_GOOGLE_ID=your_client_id
   AUTH_GOOGLE_SECRET=your_client_secret
   ```

3. Make sure your NextAuth configuration includes the Google provider with the Drive scope.

## Usage

1. Users can connect their Google Drive account through the Integrations settings page.
2. Once connected, the AI can use the toolkit to access the user's Google Drive files.

## Tools

### List Files

Lists files and folders in a specified Google Drive folder (or root if not specified).

### Search Files

Searches for files in Google Drive by name or content.

### Read File

Reads the content of a specified file from Google Drive.

## Implementation Details

- Authentication is handled through NextAuth with Google OAuth
- Tokens are stored securely in the Convex database
- Access is limited to read-only operations
- File content is fetched directly from Google Drive API

## Security Considerations

- Only read-only access is requested
- Tokens are stored securely in the database
- Users can disconnect their Google Drive account at any time
- The AI only accesses files when explicitly requested by the user
