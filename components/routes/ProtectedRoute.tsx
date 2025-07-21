import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CircularLoader } from "../ui/spinner";

const ProtectedRoute = () => {
  const user = useQuery(api.myFunctions.getUser);

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularLoader />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
