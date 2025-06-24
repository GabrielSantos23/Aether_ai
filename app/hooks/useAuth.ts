"use client";

import { useEffect, useMemo, useState } from "react";
import { Session } from "next-auth";
import {
  getSession,
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";
import { UserMetadata } from "@/lib/types";

export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const userMetadata = useMemo((): UserMetadata => {
    if (loading)
      return {
        name: undefined,
        email: undefined,
        image: undefined,
      };

    if (session?.user) {
      return {
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
        image: session.user.image ?? undefined,
      };
    }

    return {
      name: undefined,
      email: undefined,
      image: undefined,
    };
  }, [session?.user, loading]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const s = await getSession();
        setSession(s);
      } catch (error) {
        console.error("Error fetching auth session:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const signIn = async (options?: Parameters<typeof nextAuthSignIn>[0]) => {
    const result = await nextAuthSignIn(options);
    // Refresh the session after sign-in
    const newSession = await getSession();
    setSession(newSession);
    return result;
  };

  const signOut = async (options?: Parameters<typeof nextAuthSignOut>[0]) => {
    await nextAuthSignOut(options);
    setSession(null);
  };

  return {
    session,
    loading,
    isAuthenticated: !!session,
    user: session?.user,
    signIn,
    signOut,
    userMetadata,
  };
}
