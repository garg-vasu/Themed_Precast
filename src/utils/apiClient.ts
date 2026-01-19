import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_API_URL;

interface RetriableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL,
});

const handleUnauthorized = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.replace("/login");
};

export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  const response = await axios.post(`${baseURL}/refresh-token`, {
    refresh_token: refreshToken,
  });

  const newAccessToken = response.data?.access_token;

  if (!newAccessToken) {
    throw new Error("Failed to obtain new access token");
  }

  localStorage.setItem("accessToken", newAccessToken);

  return newAccessToken;
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    // send raw token (no Bearer prefix as per requirements)
    config.headers.Authorization = token;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    const isUnauthorized =
      axios.isAxiosError(error) && error.response?.status === 401;

    if (isUnauthorized && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        if (!originalRequest.headers) {
          originalRequest.headers = {};
        }
        // use refreshed token without Bearer prefix
        originalRequest.headers.Authorization = newAccessToken;

        return apiClient(originalRequest);
      } catch (refreshError: unknown) {
        const isRefreshUnauthorized =
          axios.isAxiosError(refreshError) &&
          (refreshError as AxiosError).response?.status === 401;

        if (isRefreshUnauthorized) {
          handleUnauthorized();
          return Promise.reject(refreshError);
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
