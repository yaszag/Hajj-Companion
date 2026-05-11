import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

// The custom fetch wrapper configuration
// Set up both the base API URL and auth token getter for the API client.

export function setupApiClient() {
  // Set the API base URL from environment variable
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl) {
    setBaseUrl(apiBaseUrl);
  }

  // Register the token getter for authentication
  setAuthTokenGetter(() => {
    return localStorage.getItem("hajj_access_token");
  });
}
