"use client";

import { Code } from "@/components/typography/code";
import { Link } from "@/components/typography/link";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { ConnectGoogleDriveButton } from "@/components/ConnectGoogleDrive";
import { GoogleDriveScopeChecker } from "@/components/GoogleDriveScopeChecker";
import { ConnectNotionButton } from "@/components/ConnectNotion";
import { ConnectGitHubButton } from "@/components/ConnectGitHub";

export default function LoggedInHome() {
  const user = useQuery(api.myFunctions.getUser);
  const storeUser = useMutation(api.myFunctions.storeUser);
  const session = useSession();

  console.log(user, session, storeUser);

  useEffect(() => {
    if (session.data?.user?.email && session.status === "authenticated") {
      storeUser({
        tokenIdentifier: session.data.user.email,
        name: session.data.user.name || "",
        email: session.data.user.email,
        image: session.data.user.image || "",
      });
    }
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
      <p></p>

      <p>
        <Link href="/loggedin/preloaded">
          Same example, but with preloading on the server
        </Link>
      </p>
      <p>
        Edit <Code>convex/myFunctions.ts</Code> to change your backend
      </p>
      <p>
        Edit <Code>app/(fullstack)/page.tsx</Code> to change your frontend
      </p>
      <p>
        Check out{" "}
        <Link target="_blank" href="https://docs.convex.dev/home">
          Convex docs
        </Link>
      </p>
      <p>
        To build a full page layout copy one of the included{" "}
        <Link target="_blank" href="/layouts">
          layouts
        </Link>
      </p>
        <ConnectGoogleDriveButton />
        <ConnectNotionButton />
        <ConnectGitHubButton />
        <GoogleDriveScopeChecker />
    </>
  );
}
