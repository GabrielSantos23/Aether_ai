"use client";

import React from "react";
import { createContext, ReactNode, useContext } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Session } from "next-auth";

// Define UserMetadata type locally since it can't be imported
interface UserMetadata {
  name?: string;
  email?: string;
  image?: string;
}

interface AuthContextType {
  session: Session | null | undefined;
  loading: boolean;
  isAuthenticated: boolean;
  user: Session["user"] | undefined;
  signIn: typeof signIn;
  signOut: typeof signOut;
  userMetadata: UserMetadata;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use the existing SessionProvider from ConvexClientProvider
  // This component should be used inside the SessionProvider
  const { data: session, status } = useSession();

  const loading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session;

  const userMetadata: UserMetadata = {
    name: session?.user?.name ?? undefined,
    email: session?.user?.email ?? undefined,
    image: session?.user?.image ?? undefined,
  };

  const value = {
    session,
    loading,
    isAuthenticated,
    user: session?.user,
    signIn,
    signOut,
    userMetadata,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
} 