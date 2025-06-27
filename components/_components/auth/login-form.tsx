"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

import { VStack } from "@/components/ui/stack";
// import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "./auth-buttons";
import { useSearchParams } from "next/navigation";

interface LoginFormProps {
  providers: {
    name: string;
    id: string;
  }[];
  customScopes?: Record<string, string>;
}

export function LoginForm({
  providers,
  className,
  customScopes,
  ...props
}: LoginFormProps & React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <VStack className="w-full max-w-md gap-4">
        <Card className="w-full gap-4 p-4">
          {providers && providers.length > 0 ? (
            <AuthButtons
              providers={providers}
              redirect={redirect ?? undefined}
              customScopes={customScopes}
            />
          ) : (
            <p className="text-center">Loading authentication providers...</p>
          )}
        </Card>
        <p className="text-muted-foreground text-center text-sm">
          Sign in with your preferred account to continue
        </p>
      </VStack>
    </div>
  );
}
