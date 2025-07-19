"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  FileText,
  ExternalLink,
  FolderOpen,
  RefreshCw,
} from "lucide-react";

export default function GoogleDriveDebug() {
  const googleAccount = useQuery(api.accounts.getGoogleAccount);
  const tokenStatus = useQuery(api.accounts.checkGoogleTokenStatus);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // File read state
  const [fileId, setFileId] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [fileContent, setFileContent] = useState<any>(null);
  const [readError, setReadError] = useState<string | null>(null);

  // Raw response state for debugging
  const [rawResponse, setRawResponse] = useState<string | null>(null);

  // Actions for Google Drive operations
  const searchFiles = useAction(api.files.listGoogleDriveFiles);
  const readFile = useAction(api.files.readGoogleDriveFile);

  const handleReconnectGoogle = async () => {
    setIsReconnecting(true);
    try {
      // Request all needed scopes
      const scopesToRequest = [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive",
      ].join(" ");

      // Trigger the sign-in flow with all scopes
      await signIn(
        "google",
        {},
        {
          prompt: "consent",
          access_type: "offline",
          scope: scopesToRequest,
        }
      );
    } catch (error) {
      console.error("Error reconnecting Google:", error);
    } finally {
      setIsReconnecting(false);
    }
  };

  // Handle file search
  const handleSearch = async () => {
    setIsSearching(true);
    setSearchError(null);
    setRawResponse(null);
    try {
      const results = await searchFiles({
        query: searchQuery,
        limit: 20,
      });
      setSearchResults(results || []);
      setRawResponse(JSON.stringify(results, null, 2));
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(
        error instanceof Error ? error.message : "Failed to search files"
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle file read
  const handleReadFile = async () => {
    if (!fileId.trim()) {
      setReadError("Please enter a file ID");
      return;
    }

    setIsReading(true);
    setReadError(null);
    setRawResponse(null);
    try {
      const content = await readFile({ fileId });
      setFileContent(content);
      setRawResponse(JSON.stringify(content, null, 2));
    } catch (error) {
      console.error("Read error:", error);
      setReadError(
        error instanceof Error ? error.message : "Failed to read file"
      );
      setFileContent(null);
    } finally {
      setIsReading(false);
    }
  };

  // Handle reading a file from search results
  const handleReadFromSearch = (id: string) => {
    setFileId(id);
    handleReadFile();
  };

  const isFolder = (mimeType: string) =>
    mimeType === "application/vnd.google-apps.folder";

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Google Drive Debug Page</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Google Account Status</h2>

        {googleAccount === undefined ? (
          <p>Loading account information...</p>
        ) : googleAccount === null ? (
          <div>
            <p className="text-red-500 mb-4">No Google account connected</p>
            <Button onClick={handleReconnectGoogle} disabled={isReconnecting}>
              {isReconnecting ? "Connecting..." : "Connect Google Account"}
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-green-500 mb-2">Google account connected</p>
            <p>
              <strong>Provider:</strong> {googleAccount.provider}
            </p>
            <p>
              <strong>Type:</strong> {googleAccount.type}
            </p>
            <p>
              <strong>Provider Account ID:</strong>{" "}
              {googleAccount.providerAccountId}
            </p>
            {googleAccount.refresh_token ? (
              <p className="text-green-500">✓ Has refresh token</p>
            ) : (
              <p className="text-red-500">✗ No refresh token</p>
            )}
          </div>
        )}
      </div>

      {tokenStatus && tokenStatus.status === "success" && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Token Status</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Token Expired:</strong>{" "}
                {tokenStatus.isExpired ? (
                  <span className="text-red-500">Yes</span>
                ) : (
                  <span className="text-green-500">No</span>
                )}
              </p>
              <p>
                <strong>Expires In:</strong>{" "}
                {typeof tokenStatus.expiresIn === "number"
                  ? `${Math.floor(tokenStatus.expiresIn / 60)} minutes`
                  : tokenStatus.expiresIn}
              </p>
              <p>
                <strong>Has Refresh Token:</strong>{" "}
                {tokenStatus.hasRefreshToken ? (
                  <span className="text-green-500">Yes</span>
                ) : (
                  <span className="text-red-500">No</span>
                )}
              </p>
            </div>

            <div>
              <p>
                <strong>Has Drive Scope:</strong>{" "}
                {tokenStatus.hasDriveScope ? (
                  <span className="text-green-500">Yes</span>
                ) : (
                  <span className="text-red-500">No</span>
                )}
              </p>
              <p>
                <strong>Access Token Length:</strong> {tokenStatus.tokenLength}{" "}
                characters
              </p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Granted Scopes:</h3>
            <ul className="list-disc pl-5">
              {(tokenStatus.scopes || []).map(
                (scope: string, index: number) => (
                  <li key={index} className="text-sm">
                    {scope.includes("drive") ? (
                      <span className="text-green-500">{scope}</span>
                    ) : (
                      scope
                    )}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      )}

      {/* File Search Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Search Google Drive Files
        </h2>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter search query (folder name, file name, etc.)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !googleAccount}
          >
            {isSearching ? "Searching..." : "Search"}
            <Search className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {searchError && (
          <div className="text-red-500 mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200">
            <p className="font-semibold">Error:</p>
            <p className="whitespace-pre-wrap">{searchError}</p>
          </div>
        )}

        {searchResults.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((file) => (
                  <tr key={file.id} className="border-t">
                    <td className="p-2 flex items-center">
                      {isFolder(file.mimeType) ? (
                        <FolderOpen className="h-4 w-4 mr-2 text-yellow-500" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      )}
                      {file.name}
                    </td>
                    <td className="p-2 text-xs">{file.mimeType}</td>
                    <td className="p-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReadFromSearch(file.id)}
                      >
                        {isFolder(file.mimeType) ? (
                          <>
                            <FolderOpen className="h-4 w-4 mr-1" />
                            Open
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-1" />
                            Read
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          window.open(
                            `https://drive.google.com/file/d/${file.id}/view`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : searchResults.length === 0 &&
          !searchError &&
          !isSearching &&
          searchQuery ? (
          <p className="text-gray-500">No files found matching your search.</p>
        ) : null}
      </div>

      {/* File Read Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Read File/Folder Content</h2>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter file or folder ID"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={handleReadFile}
            disabled={isReading || !googleAccount || !fileId.trim()}
          >
            {isReading ? "Reading..." : "Read Content"}
            <FileText className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {readError && (
          <div className="text-red-500 mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200">
            <p className="font-semibold">Error:</p>
            <p className="whitespace-pre-wrap">{readError}</p>
          </div>
        )}

        {fileContent && (
          <div>
            <div className="flex justify-between items-center mb-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
              <div>
                <strong>{fileContent.name}</strong>
                <span className="ml-2 text-sm text-gray-500">
                  {fileContent.mimeType}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  window.open(
                    `https://drive.google.com/file/d/${fileId}/view`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900 overflow-auto max-h-[400px]">
              <pre className="whitespace-pre-wrap text-sm">
                {fileContent.content}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Raw Response Section */}
      {rawResponse && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Raw API Response</h2>
          <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900 overflow-auto max-h-[400px]">
            <pre className="whitespace-pre-wrap text-xs">{rawResponse}</pre>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>

        <div className="flex flex-col gap-4">
          <Button
            onClick={handleReconnectGoogle}
            disabled={isReconnecting}
            variant="outline"
          >
            {isReconnecting ? "Reconnecting..." : "Reconnect Google Account"}
            <RefreshCw className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-sm text-gray-500 mt-2">
            Reconnecting will request a new access token and refresh token with
            all required scopes. This is the recommended solution if you're
            experiencing authentication issues.
          </p>
        </div>
      </div>
    </div>
  );
}
