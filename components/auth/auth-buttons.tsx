"use client";

import { AuthProviderIcon } from "@/components/icons/provider-icon";
import { Button } from "@/components/ui/button";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { useState } from "react";
import { CircularLoader } from "../ui/spinner";

interface AuthButtonsProps {
  providers: {
    name: string;
    id: string;
  }[];
  redirect?: string;
}

export const AuthButtons = ({ providers, redirect }: AuthButtonsProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          className="w-full"
          disabled={isLoading !== null}
          onClick={async () => {
            setIsLoading(provider.id);
            try {
              const result = await nextAuthSignIn(provider.id, {
                redirect: false,
                callbackUrl: "/",
              });

              if (result?.ok) {
                window.location.href = "/";
              } else {
                console.error("Authentication failed:", result?.error);
              }
            } catch (error) {
              console.error("Authentication error:", error);
            } finally {
              setIsLoading(null);
            }
          }}
        >
          {isLoading === provider.id ? (
            <CircularLoader size="sm" />
          ) : (
            <AuthProviderIcon provider={provider.name} />
          )}
          Sign in with {provider.name}
        </Button>
      ))}
    </div>
  );
};
