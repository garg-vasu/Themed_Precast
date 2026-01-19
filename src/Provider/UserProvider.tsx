import axios, { AxiosError } from "axios";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { apiClient } from "@/utils/apiClient";

export interface User {
  id: number;
  employee_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  first_access: string;
  last_access: string;
  profile_picture: string;
  is_admin: boolean;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  phone_no: string;
  role: string;
  role_name: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  loading: false,
  error: null,
});

interface UserProviderProps {
  children: ReactNode;
}

// utility function to handle the error
const getErrorMessage = (error: AxiosError | unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Unauthorized. Please log in.";
    }
    if (error.response?.status === 403) {
      return "Access denied. Please contact your administrator.";
    }
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again later.";
    }
    return error.response?.data?.message || "Failed to fetch user data.";
  }
  return "An unexpected error occurred. Please try again later.";
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleUnauthorized = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/get_user", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setUser(response.data);
          setError(null);
        } else {
          const message =
            (response.data as any)?.message ||
            "Failed to fetch user data. Please log in again.";
          setError(message);
          handleUnauthorized();
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          setError(getErrorMessage(err));
          handleUnauthorized();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    return () => {
      source.cancel();
    };
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <UserContext.Provider value={{ user, loading, error }}>
      {children}
    </UserContext.Provider>
  );
};
