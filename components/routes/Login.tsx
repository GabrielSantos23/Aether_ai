import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import ThemeToggler from "../_components/theme-toggle";
import { LoginForm } from "../_components/auth/login-form";
import ProviderList from "../_components/auth/provider-list";
import { useTheme } from "next-themes";
import { Brain } from "lucide-react";
import { Badge } from "../ui/badge";
import { useAuthContext } from "@/app/context/AuthContext";

const LoginPage = () => {
  const { theme, systemTheme } = useTheme();
  const [email, setEmail] = useState("");
  const { signIn, loading } = useAuthContext();

  let effectiveTheme = theme;
  if (theme === "system") {
    if (typeof window !== "undefined") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      effectiveTheme = "light";
    }
  }
  const imageUrl =
    effectiveTheme === "dark" ? "/welcome_night.png" : "/welcome_day.png";

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      await signIn({ email });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/3 bg-background flex flex-col justify-center items-center p-4 sm:p-8 relative">
        {/* Header */}
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center">
          {/* logo */}
        </div>

        {/* Sign Up Button */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
          <ThemeToggler />
        </div>

        {/* Main Content */}
        <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8 mt-16 sm:mt-0">
          <div className="text-center">
            <div className="flex flex-col items-center mb-10">
              <div className="flex justify-center items-center mb-2">
                <Brain className="size-10 mb-2 text-muted-foreground" />
              </div>
              <div className="flex justify-center items-center mb-2">
                <Badge
                  variant="outline"
                  className="bg-purple-800/20 text-purple-400"
                >
                  Sign up
                </Badge>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold  mb-3 sm:mb-4">
              Welcome!
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm px-4 sm:px-0">
              Welcome to Aether AI, the AI-powered platform for your Ideas.
              <br />
              Sign up with your email to get started.
            </p>
          </div>

          {/* Email Input */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border placeholder-muted-foreground h-10 sm:h-12"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email}
            >
              {loading ? "Loading..." : "Continue with Email"}
            </Button>

            <div className="text-center">
              <span className="text-muted-foreground text-xs sm:text-sm">
                OR
              </span>
            </div>

            {/* Wallet Options */}
            <div>
              <ProviderList />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 w-[90%] sm:bottom-6 left-4 sm:left-6 flex justify-center space-x-3 sm:space-x-6 text-xs sm:text-sm text-muted-foreground">
          <a href="#" className="hover:text-muted-primary">
            Privacy
          </a>
          <a href="#" className="hover:text-muted-primary">
            Terms
          </a>
          <a href="#" className="hover:text-muted-primary">
            aether.ai
          </a>
          <a href="#" className="hover:text-muted-primary">
            X
          </a>
          <a href="#" className="hover:text-muted-primary">
            Discord
          </a>
        </div>
      </div>

      {/* Right Panel - Anime Background (Hidden on mobile) */}
      <div className="hidden lg:block lg:w-2/3 relative overflow-hidden">
        <img
          src={imageUrl}
          alt="Scenic landscape background"
          className="w-full h-full object-cover"
        />
        {/* Overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-black/40"></div>
      </div>
    </div>
  );
};

export default LoginPage;
