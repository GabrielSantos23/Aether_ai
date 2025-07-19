"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ConnectGoogleDriveButton } from "@/components/ConnectGoogleDrive";
import { GoogleDriveScopeChecker } from "@/components/GoogleDriveScopeChecker";
import { ConnectNotionButton } from "@/components/ConnectNotion";
import { ConnectGitHubButton } from "@/components/ConnectGitHub";
import { getBasePersonality } from "@/components/prompts/base";

export default function LoggedInHome() {
  const user = useQuery(api.myFunctions.getUser);
  const storeUser = useMutation(api.myFunctions.storeUser);
  const session = useSession();
  const [basePrompt, setBasePrompt] = useState("");

  useEffect(() => {
    if (session.data?.user?.email && session.status === "authenticated") {
      storeUser({
        tokenIdentifier: session.data.user.email,
        name: session.data.user.name || "",
        email: session.data.user.email,
        image: session.data.user.image || "",
      });
    }

    // Get the current base personality with date
    setBasePrompt(getBasePersonality());
  }, [session.data, session.status, storeUser]);

  if (user === undefined) {
    return (
      <>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
      </>
    );
  }

  return (
    <>
      <p className="mt-8">Welcome {user?.email ?? "N/A"}!</p>
      <p>
        Click the button below and open this page in another window - this data
        is persisted in the Convex cloud database!
      </p>

      <div className="mt-4 p-4 border rounded-md">
        <h3 className="font-bold mb-2">Current AI Prompt with Date:</h3>
        <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm overflow-auto max-h-[400px]">
          {basePrompt.split("\n").slice(0, 5).join("\n")}...
        </pre>
        <Button
          onClick={() => setBasePrompt(getBasePersonality())}
          className="mt-2"
        >
          Refresh Date
        </Button>
      </div>

      <div className="mt-8 flex flex-col space-y-4">
        <ConnectGoogleDriveButton />
        <ConnectNotionButton />
        <ConnectGitHubButton />
        <GoogleDriveScopeChecker />
      </div>
    </>
  );
}
