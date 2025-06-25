import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function useGoogleDrive() {
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const session = useSession();

  // Query to check if Google Drive is connected
  const connectionStatus = useQuery(
    api.googledrive.queries.isGoogleDriveConnected
  );

  // Mutations for connecting/disconnecting
  const saveGoogleDriveTokens = useMutation(
    api.googledrive.mutations.saveGoogleDriveTokens
  );
  const disconnectGoogleDrive = useMutation(
    api.googledrive.mutations.disconnectGoogleDrive
  );

  // Connect to Google Drive
  const connect = () => {
    setIsConnecting(true);
    router.push("/settings?tab=integrations");
  };

  // Disconnect from Google Drive
  const disconnect = async () => {
    await disconnectGoogleDrive();
  };

  // Check if we have tokens in the session that need to be saved
  useEffect(() => {
    const saveTokensToConvex = async () => {
      if (
        session.data?.accessToken &&
        session.data?.refreshToken &&
        connectionStatus?.connected === false
      ) {
        setIsConnecting(true);

        try {
          // Calculate expiration time (typically 1 hour from now)
          const expiresAt = Date.now() + 3600 * 1000;

          // Save the tokens to Convex
          await saveGoogleDriveTokens({
            accessToken: session.data.accessToken,
            refreshToken: session.data.refreshToken,
            expiresAt,
            scope: "https://www.googleapis.com/auth/drive.readonly",
          });

          // Connection complete
          setIsConnecting(false);
        } catch (error) {
          console.error("Failed to save Google Drive tokens:", error);
          setIsConnecting(false);
        }
      }
    };

    saveTokensToConvex();
  }, [session.data, connectionStatus?.connected, saveGoogleDriveTokens]);

  return {
    isConnected: connectionStatus?.connected || false,
    isConnecting,
    connect,
    disconnect,
  };
}
