import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Components & Layouts
import LoginPage from "@/components/routes/Login";
import Chat from "@/components/routes/Chat";
import ProtectedRoute from "@/components/routes/ProtectedRoute";

// UI Components
import { Spinner } from "@/components/ui/spinner";
import Test from "@/components/routes/test";
import SidebarProvider from "@/components/_components/_sidebar";
import SettingsPage from "@/components/routes/Settings";
import DebugGoogle from "@/components/routes/debug";
import TestDeepResearch from "@/components/routes/testDeepResearch";

// Dummy components for illustration
const SharedChatPage = () => <div>Shared Chat Page (to be implemented)</div>;
const NotFoundPage = () => <p>Not found</p>;
const TestPage = () => <Test />;

// ----------------------
// Layouts
// ----------------------

// Wraps the SidebarProvider around an <Outlet /> so that nested routes are
// rendered inside the provider (and thus, inside the sidebar layout).
function SidebarLayout() {
  return (
    <SidebarProvider>
      <Outlet />
    </SidebarProvider>
  );
}

function AppRoutes() {
  // We still need the user here for the initial redirect from "/"
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
        {/* PUBLIC ROUTES
            These routes are accessible to everyone.
          */}
        <Route
          path="/auth"
          element={!user ? <LoginPage /> : <Navigate to="/chat" replace />}
        />
        <Route path="/shared/:shareId" element={<SharedChatPage />} />

        {/* PROTECTED ROUTES
            This group of routes requires an authenticated user.
            The <ProtectedRoute> component handles the auth check.
          */}
        <Route element={<ProtectedRoute />}>
          {/* Routes with the main sidebar layout.
              The <MainLayout> component renders the sidebar and an <Outlet />
              for the nested routes below.
            */}
          <Route element={<SidebarLayout />}>
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/debug/google" element={<DebugGoogle />} />
          </Route>
          <Route path="/settings" element={<SettingsPage />} />

          {/* You could also have protected routes *without* the sidebar here */}
        </Route>

        {/* ROOT & WILDCARD ROUTES
         */}
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
