import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import LoginPage from "@/components/routes/Login";
import Chat from "@/components/routes/Chat";
import ProtectedRoute from "@/components/routes/ProtectedRoute";

import { Spinner } from "@/components/ui/spinner";
import Test from "@/components/routes/test";
import SidebarProvider from "@/components/_components/_sidebar";
import SettingsPage from "@/components/routes/Settings";
import DebugGoogle from "@/components/routes/debug";
import TestDeepResearch from "@/components/routes/testDeepResearch";
import GalleryPage from "@/components/routes/Gallery";
import ResearchPage from "@/components/routes/Research";

const SharedChatPage = () => <div>Shared Chat Page (to be implemented)</div>;
const NotFoundPage = () => <p>Not found</p>;
const TestPage = () => <Test />;

function SidebarLayout() {
  return (
    <SidebarProvider>
      <Outlet />
    </SidebarProvider>
  );
}

function AppRoutes() {
  const user = useQuery(api.myFunctions.getUser);

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={!user ? <LoginPage /> : <Navigate to="/chat" replace />}
        />
        <Route path="/shared/:shareId" element={<SharedChatPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<SidebarLayout />}>
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/debug/google" element={<DebugGoogle />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/research" element={<ResearchPage />} />
          </Route>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/chat" replace />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route path="/test" element={<TestPage />} />
        <Route path="/test-deep-research" element={<TestDeepResearch />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function Root() {
  return (
    <>
      <AppRoutes />
    </>
  );
}
