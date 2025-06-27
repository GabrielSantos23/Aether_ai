"use client";

import { AuthProviderIcon } from "@/components/icons/provider-icon";
import { Button } from "@/components/ui/button";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";

interface AuthButtonsProps {
  providers: {
    name: string;
    id: string;
  }[];
  redirect?: string;
  customScopes?: Record<string, string>;
}

export const AuthButtons = ({
  providers,
  redirect,
  customScopes,
}: AuthButtonsProps) => {
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
              console.log(`Signing in with provider: ${provider.id}`);

              // Check if we have custom scopes for this provider
              const options: any = {
                redirect: false,
                callbackUrl: redirect || "/",
              };

              // Add custom scope if specified for this provider
              if (customScopes && customScopes[provider.id]) {
                options.scope = customScopes[provider.id];
              }

              // Use NextAuth's signIn directly
              const result = await nextAuthSignIn(provider.id, options);

              console.log("Sign in result:", result);

              // If authentication was successful, manually navigate
              if (result?.ok) {
                console.log("Authentication successful, navigating to /");
                window.location.href = redirect || "/";
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
            <LoadingSpinner size={16} />
          ) : (
            <AuthProviderIcon provider={provider.name} />
          )}
          Sign in with {provider.name}
        </Button>
      ))}
    </div>
  );
};
