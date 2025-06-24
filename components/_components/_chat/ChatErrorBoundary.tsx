"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

function ChatErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const router = useRouter();

  useEffect(() => {
    if (error.message.includes("ArgumentValidationError")) {
      router.push("/");
    }
  }, [error, router]);

  if (error.message.includes("ArgumentValidationError")) {
    return <div>Invalid chat. Redirecting...</div>;
  }

  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export function ChatErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ChatErrorFallback}
      onReset={() => {
        // colocar redirecionamento para a home
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
