import { Loader2 } from "lucide-react";
import { type PropsWithChildren, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { apiClient, refreshAccessToken } from "@/utils/apiClient";

export default function PrivateRoute({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

  const validateToken = async () => {
    let accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      try {
        accessToken = await refreshAccessToken();
      } catch (refreshError) {
        console.error("Access token missing; refresh failed:", refreshError);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login", { replace: true });
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await apiClient.post("/validate-session", {
        SessionData: accessToken,
      });

      if (response.status !== 200) {
        throw new Error("Session invalid");
      }

      setUserRole(response.data.role_name);
      setIsLoading(false);
    } catch (error) {
      console.error("Token validation failed:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login", { replace: true });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    validateToken();
  }, []);

  useEffect(() => {
    if (
      !isLoading &&
      location.pathname === "/tenant" &&
      userRole !== "superadmin"
    ) {
      navigate("/", { replace: true });
    }
  }, [isLoading, location.pathname, userRole, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen ">
        <Loader2 className=" w-8 h-8 animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
