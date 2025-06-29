import { ThemeProvider } from "./ThemeProvider";
import { Toaster } from "sonner";

export default function Provider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
        <Toaster richColors/>
        {children}
    </ThemeProvider>
  );
}
