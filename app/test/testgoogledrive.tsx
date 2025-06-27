"use client";

import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface GoogleFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
}

interface FileContent {
  content: string;
  mimeType: string;
}

export default function GoogleDriveTest() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Google Drive state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GoogleFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GoogleFile | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Use the Convex database as the single source of truth for permissions.
  // The 'signIn' event in `auth.ts` is responsible for updating this value.
  const hasDriveAccess = useQuery(
    api.users.hasGoogleDriveAccess,
    session?.user?.email ? { email: session.user.email } : "skip"
  );

  // Update session debug info whenever the session changes.
  useEffect(() => {
    if (session) {
      setDebugInfo({
        hasAccessToken: !!session.accessToken,
        accessTokenLength: session.accessToken?.length,
        hasRefreshToken: !!session.refreshToken,
        scope: session.scope,
        hasGoogleDriveScopeInSession: session.scope?.includes(
          "https://www.googleapis.com/auth/drive"
        ),
        user: session.user,
      });
    }
  }, [session]);

  // This function initiates the re-authentication flow to request new scopes.
  // In testgoogledrive.tsx

  const handleGrantAccess = useCallback(async () => {
    console.log("Initiating Google sign-in with Drive scope");

    // The second argument is for NextAuth options (like callbackUrl)
    const nextAuthOptions = {
      callbackUrl: window.location.href,
    };

    // The THIRD argument is for the provider's OAuth parameters
    const authorizationParams = {
      scope:
        "openid email profile https://www.googleapis.com/auth/drive.readonly",
      prompt: "consent",
      access_type: "offline",
    };

    await signIn("google", nextAuthOptions, authorizationParams);
  }, []);

  // Google Drive API functions (no changes needed here)
  const searchFiles = async () => {
    if (!session?.accessToken || !searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setError(null);

      const response = await fetch(
        "https://www.googleapis.com/drive/v3/files?" +
          new URLSearchParams({
            q: `name contains '${searchQuery}' and trashed = false`,
            fields:
              "files(id, name, mimeType, webViewLink, thumbnailLink, size, modifiedTime)",
            pageSize: "10",
          }),
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Google Drive API error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      setSearchResults(data.files || []);
    } catch (err) {
      console.error("Error searching files:", err);
      setError(err instanceof Error ? err.message : String(err));
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getFileContent = async (file: GoogleFile) => {
    if (!session?.accessToken) return;

    try {
      setIsLoadingContent(true);
      setError(null);
      setSelectedFile(file);
      setFileContent(null);

      if (file.mimeType.includes("application/vnd.google-apps")) {
        setFileContent({
          content: `This is a Google Workspace file (${file.mimeType}). Direct content viewing is not supported here.`,
          mimeType: file.mimeType,
        });
        return;
      }

      if (
        file.mimeType.startsWith("text/") ||
        file.mimeType === "application/json"
      ) {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch file content: ${response.statusText}`
          );
        }
        const content = await response.text();
        setFileContent({
          content: content.substring(0, 100000), // Truncate large files
          mimeType: file.mimeType,
        });
      } else {
        setFileContent({
          content: `Preview for this file type (${file.mimeType}) is not available. Please use the "Open in Drive" button.`,
          mimeType: file.mimeType,
        });
      }
    } catch (err) {
      console.error("Error getting file content:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingContent(false);
    }
  };

  const openInGoogleDrive = (file: GoogleFile) => {
    if (file.webViewLink) {
      window.open(file.webViewLink, "_blank");
    } else {
      window.open(`https://drive.google.com/file/d/${file.id}/view`, "_blank");
    }
  };

  const downloadFile = async (file: GoogleFile) => {
    if (!session?.accessToken) return;

    try {
      setError(null);
      const a = document.createElement("a");
      a.style.display = "none";
      document.body.appendChild(a);

      let downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      let fileName = file.name;

      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // Robust loading state to prevent UI flicker.
  if (
    status === "loading" ||
    (session?.user?.email && hasDriveAccess === undefined)
  ) {
    return <div className="p-4">Loading user permissions...</div>;
  }

  return (
    <div className="p-4 flex flex-col gap-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold">Google Drive Integration Test</h1>

      <div>
        {session ? (
          <div>
            <div className="text-sm text-gray-600">
              Signed in as: {session.user?.email}
            </div>
            <div className="text-sm text-gray-600">
              Drive Access Persisted in DB: {hasDriveAccess ? "Yes" : "No"}
            </div>

            {error && (
              <div className="p-2 mt-4 bg-red-100 border border-red-400 text-red-700 rounded">
                Error: {error}
              </div>
            )}

            {/* Display logic now solely depends on the persistent value from the Convex database. */}
            {hasDriveAccess === false && (
              <>
                <div className="p-4 my-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="font-medium text-yellow-800">
                    Additional Permissions Required
                  </h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    To search and view your Google Drive files, you need to
                    grant this application additional permissions.
                  </div>
                </div>
                <Button onClick={handleGrantAccess} className="mt-2">
                  Grant Drive Access
                </Button>
              </>
            )}

            {hasDriveAccess === true && (
              <div className="mt-6">
                <div className="text-green-600 mb-4 font-semibold">
                  ✓ Google Drive access is enabled.
                </div>

                <Tabs defaultValue="search" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="search">Search Files</TabsTrigger>
                    <TabsTrigger value="view" disabled={!selectedFile}>
                      View File
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="search">
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="Search files in your Drive..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={searchFiles}
                        disabled={isSearching || !searchQuery.trim()}
                      >
                        {isSearching ? "Searching..." : "Search"}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {searchResults.map((file) => (
                        <Card
                          key={file.id}
                          className="p-3 flex justify-between items-center"
                        >
                          <div
                            className="cursor-pointer flex-grow"
                            onClick={() => getFileContent(file)}
                          >
                            <div className="font-medium">{file.name}</div>
                            <div className="text-sm text-gray-500">
                              {file.mimeType}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(file)}
                            >
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openInGoogleDrive(file)}
                            >
                              Open in Drive
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="view">
                    {selectedFile && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-medium">
                            {selectedFile.name}
                          </h2>
                        </div>

                        <Separator className="my-4" />

                        {isLoadingContent ? (
                          <div className="h-64 flex items-center justify-center">
                            <span>Loading file content...</span>
                          </div>
                        ) : fileContent ? (
                          <div className="p-4 rounded border overflow-auto max-h-96 bg-gray-50">
                            <pre className="whitespace-pre-wrap text-sm">
                              {fileContent.content}
                            </pre>
                          </div>
                        ) : (
                          <div>Select a file to view its content.</div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Debug info remains useful for checking live session state */}
            <div className="mt-8 p-4 rounded-md border border-gray-200 bg-gray-50">
              <h2 className="font-bold text-sm">
                Debug Info (Live Session State)
              </h2>
              <pre className="whitespace-pre-wrap text-xs mt-2 overflow-auto max-h-60">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div>
            <div className="font-semibold">Not signed in</div>
            <p className="text-sm text-gray-600 my-2">
              Sign in to get started and connect your Google Drive.
            </p>
            <Button onClick={() => signIn("google")} className="mt-4">
              Sign in with Google
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
