import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
// import LoginPage from "@/components/routes/Login";
import { SessionProvider, useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Test from "@/components/routes/test";
import Sidebar from "@/components/_components/_sidebar";
import { ThemeProvider } from "./providers/ThemeProvider";
import { Toaster } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import LoginPage from "@/components/routes/Login";
import Chat from "@/components/routes/Chat";
// import SettingsPage from "@/components/routes/Settings";

// import Auth from "@/components/routes/Auth";
// import Chat from "@/components/routes/Chat";
// import SettingsPage from "@/components/routes/Settings";
// import Sidebar from "@/components/_components/_sidebar";
// import SharedChatPage from "@/components/routes/Shared";

function AppRoutes() {

  const user = useQuery(api.myFunctions.getUser);
  const storeUser = useMutation(api.myFunctions.storeUser);
  const session = useSession();

  console.log("NextAuth Session:", session);


  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span><Spinner  /></span>
      </div>
    );
  }

  // Only redirect to /chat if there is a user, otherwise redirect to /auth
  return (
    <BrowserRouter>
      <div className="flex flex-col h-full">
        <Routes>
          <Route
            path="/"
            element={
              user
                ? <Navigate to="/chat" replace />
                : <Navigate to="/auth" replace />
            }
          />
          {/* Route components will be implemented later */}
          <Route
            path="/shared/:shareId"
            element={<div>Shared Chat Page (to be implemented)</div>}
          />
          <Route
            path="/chat"
            element={
              user ? (
                <Sidebar>               
                  <Chat />
                </Sidebar>
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/chat/:id"
            element={
              user ? (
                <Sidebar>
                  <Chat />
                </Sidebar>
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/auth"
            element={
              !user ? <LoginPage /> : <Navigate to="/chat" replace />
            }
          />
          <Route
            path="/settings"
            element={
              user ? (
                <div>Settings Page (to be implemented)</div>
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route path="*" element={<p>Not found</p>} />
          <Route path="/test" element={<Test />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default function Root() {
  return (
    <ThemeProvider>
        
    <SessionProvider>
    <Toaster richColors />
      <AppRoutes />
    </SessionProvider>
    </ThemeProvider>
  );
}
