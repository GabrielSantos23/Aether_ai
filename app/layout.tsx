import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import { auth } from "@/auth";
import Provider from "./providers/providers";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aether AI - advanced AI chat",
  description: "Aether AI is a advanced AI chat with a lot of features",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <head>
        {/* Script to apply boring theme before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Check if boring theme is enabled
                  const boringTheme = localStorage.getItem("boring-theme") === "true";
                  if (boringTheme) {
                    // Check if dark mode is active
                    const isDarkMode = document.documentElement.classList.contains("dark") || 
                                      window.matchMedia("(prefers-color-scheme: dark)").matches;
                    
                    // Apply the appropriate boring theme class
                    document.documentElement.classList.add(isDarkMode ? "boring-dark" : "boring-light");
                  }
                } catch (e) {
                  console.error("Error applying boring theme:", e);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={
          geist.className +
          "antialiased selection:bg-primary selection:text-white  overflow-hidden"
        }
      >
        <Provider>
          <ConvexClientProvider session={session}>
            {children}
          </ConvexClientProvider>
        </Provider>
      </body>
    </html>
  );
}
