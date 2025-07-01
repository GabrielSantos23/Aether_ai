'use client';

import { cn } from '@/lib/utils';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useEffect } from 'react';
import { File, FileText, Folder, Search, FileX, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define the interface for a Google Drive file
interface GoogleDriveFile {
  kind: string;
  id: string;
  name: string;
  mimeType: string;
}

// Define the interface for file content
interface FileContent {
  name: string;
  mimeType: string;
  content: string;
}

export function GoogleDrive({
  searchRequest,
  readRequest,
}: {
  searchRequest?: { type: 'search'; query: string; limit: number };
  readRequest?: { type: 'read'; fileId: string };
}) {
  // State for search results and file content
  const [searchResults, setSearchResults] = useState<GoogleDriveFile[]>([]);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the Google account to check permissions
  const googleAccount = useQuery(api.accounts.getGoogleAccount);
  
  // Actions for Google Drive operations
  const searchFiles = useAction(api.files.listGoogleDriveFiles);
  const readFile = useAction(api.files.readGoogleDriveFile);

  // Check if the user has the required Google Drive permissions
  const hasRequiredPermissions = !!googleAccount?.scope?.split(" ").some(
    scope => scope.includes("https://www.googleapis.com/auth/drive")
  );

  // Function to get a file icon based on MIME type
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-6 h-6 text-blue-500" />;
    } else if (mimeType.startsWith('text/')) {
      return <FileText className="w-6 h-6 text-green-500" />;
    } else {
      return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  // Handle search request
  useEffect(() => {
    if (searchRequest && hasRequiredPermissions) {
      const performSearch = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const results = await searchFiles({
            query: searchRequest.query,
            limit: searchRequest.limit,
          });
          setSearchResults(results);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to search Google Drive');
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      performSearch();
    }
  }, [searchRequest, hasRequiredPermissions, searchFiles]);

  // Handle read request
  useEffect(() => {
    if (readRequest && hasRequiredPermissions) {
      const performRead = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const content = await readFile({
            fileId: readRequest.fileId,
          });
          setFileContent(content);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to read file from Google Drive');
          setFileContent(null);
        } finally {
          setIsLoading(false);
        }
      };
      
      performRead();
    }
  }, [readRequest, hasRequiredPermissions, readFile]);

  // If permissions are not granted, show a message
  if (!hasRequiredPermissions) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-6 bg-gray-100 dark:bg-gray-800 max-w-[600px]">
        <div className="flex items-center gap-3">
          <FileX className="w-8 h-8 text-red-500" />
          <h3 className="text-xl font-semibold">Google Drive Access Required</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          This feature requires Google Drive permissions. Please connect your Google account with the appropriate permissions.
        </p>
        <div className="flex justify-end mt-2">
          <Button asChild>
            <a href="/settings">Go to Settings</a>
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-6 bg-gray-100 dark:bg-gray-800 max-w-[600px]">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p>Loading Google Drive data...</p>
        </div>
      </div>
    );
  }

  // Show error if any
  if (error) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-6 bg-gray-100 dark:bg-gray-800 max-w-[600px]">
        <div className="flex items-center gap-3 text-red-500">
          <FileX className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Error</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300">{error}</p>
      </div>
    );
  }

  // Display file content if reading a file
  if (fileContent) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-6 bg-gray-100 dark:bg-gray-800 max-w-[800px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getFileIcon(fileContent.mimeType)}
            <h3 className="text-lg font-semibold">{fileContent.name}</h3>
          </div>
          <div className="text-sm text-gray-500">{fileContent.mimeType}</div>
        </div>
        
        <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg overflow-auto max-h-[400px] border">
          {fileContent.mimeType.startsWith('text/') || 
           fileContent.mimeType === 'application/json' || 
           fileContent.mimeType.includes('javascript') || 
           fileContent.mimeType.includes('xml') ? (
            <pre className="whitespace-pre-wrap text-sm">{fileContent.content}</pre>
          ) : (
            <div className="flex items-center justify-center p-6 text-gray-500">
              {fileContent.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Display search results
  if (searchResults.length > 0) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-6 bg-gray-100 dark:bg-gray-800 max-w-[600px]">
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold">Google Drive Search Results</h3>
        </div>
        
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {searchResults.map((file) => (
            <li key={file.id} className="py-3 flex items-center gap-3">
              {getFileIcon(file.mimeType)}
              <span className="flex-1 truncate">{file.name}</span>
              <Button 
                size="sm" 
                variant="ghost"
                className="flex items-center gap-1"
                onClick={() => {
                  window.open(`https://drive.google.com/file/d/${file.id}/view`, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4" />
                <span className="sr-only">Open</span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Default state - no search results or file content
  return (
    <div className="flex flex-col gap-4 rounded-2xl p-6 bg-gray-100 dark:bg-gray-800 max-w-[600px]">
      <div className="flex items-center gap-3">
        <Search className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-semibold">Google Drive</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-300">
        {searchRequest ? "No files found matching your search criteria." : "Ready to search or view files from Google Drive."}
      </p>
    </div>
  );
} 