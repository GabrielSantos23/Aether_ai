"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function UserSync() {
  const { data: session } = useSession();
  const storeUser = useMutation(api.myFunctions.storeUser);
  const updateUserToken = useMutation(
    api.myFunctions.updateUserTokenIdentifier
  );
  const user = useQuery(api.myFunctions.getUser);

  useEffect(() => {
    // Only run when we have a session with a user
    if (session?.user?.id && session?.user?.email) {
      const tokenIdentifier = session.user.id;

      // First, try to store the user (this will create a new user or update an existing one)
      storeUser({
        tokenIdentifier,
        name: session.user.name || "",
        email: session.user.email,
        image: session.user.image || "",
      }).catch((error) => {
        console.error("Failed to store user in Convex:", error);
      });

      // If we have a user from the query and their tokenIdentifier doesn't match,
      // update it to ensure consistency
      if (user && user.tokenIdentifier !== tokenIdentifier) {
        updateUserToken({
          email: session.user.email,
          tokenIdentifier,
        }).catch((error) => {
          console.error("Failed to update user token:", error);
        });
      }
    }
  }, [session, storeUser, updateUserToken, user]);

  // This is a utility component, it doesn't render anything
  return null;
}
