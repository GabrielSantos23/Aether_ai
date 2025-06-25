import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/app/context/AuthContext";
import LoginPage from "@/components/routes/Login";
import { SessionProvider, useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/spinner";

// import Auth from "@/components/routes/Auth";
import Chat from "@/components/routes/Chat";
import SettingsPage from "@/components/routes/Settings";
import Sidebar from "@/components/_components/_sidebar";
// import SharedChatPage from "@/components/routes/Shared";

function AppRoutes() {
  const { loading, isAuthenticated, session } = useAuthContext();
  const nextAuthSession = useSession();

  // Debug logs
  console.log("Auth Context:", { loading, isAuthenticated, session });
  console.log("NextAuth Session:", nextAuthSession);

  // Show loading spinner until auth is loaded
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          {/* Route components will be implemented later */}
          <Route
            path="/shared/:shareId"
            element={<div>Shared Chat Page (to be implemented)</div>}
          />
          <Route
            path="/chat"
            element={
              isAuthenticated ? (
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
              isAuthenticated ? (
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
              !isAuthenticated ? <LoginPage /> : <Navigate to="/chat" replace />
            }
          />
          <Route
            path="/settings"
            element={
              isAuthenticated ? (
                <SettingsPage />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route path="*" element={<p>Not found</p>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
