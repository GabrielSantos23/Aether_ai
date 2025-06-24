import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/app/ConvexClientProvider";
import { auth } from "@/auth";
import { ThemeProvider } from "@/app/context/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My App Title",
  description: "My app description",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ConvexClientProvider session={session}>
            <Toaster richColors />
            {children}
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
