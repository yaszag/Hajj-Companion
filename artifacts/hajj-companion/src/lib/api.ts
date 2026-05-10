import { setAuthTokenGetter } from "@workspace/api-client-react";

// The custom fetch wrapper configuration
// We just need to register the token getter with the API client's custom fetch implementation.

export function setupApiClient() {
  setAuthTokenGetter(() => {
    return localStorage.getItem("hajj_access_token");
  });
}
