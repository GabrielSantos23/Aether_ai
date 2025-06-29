import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import { auth } from "@/auth";
import Provider from "./providers/providers";

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
    <html lang="en">
      <body className={inter.className + " overflow-hidden"}>
        <Provider>

        <ConvexClientProvider session={session}>
          {children}
        </ConvexClientProvider>
        </Provider>
      </body>
    </html>
  );
}
