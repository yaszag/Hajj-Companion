import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, getMe } from "@workspace/api-client-react";
import { setupApiClient } from "../lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (accessToken: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function migrateLegacyAccessToken(): void {
  try {
    const legacy = localStorage.getItem("hajj_access_token");
    if (legacy && !localStorage.getItem("accessToken")) {
      localStorage.setItem("accessToken", legacy);
      localStorage.removeItem("hajj_access_token");
    }
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("hajj_user");
      localStorage.removeItem("hajj_access_token");
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((newAccessToken: string, newUser: User, newRefreshToken?: string) => {
    try {
      localStorage.setItem("accessToken", newAccessToken);
      if (newRefreshToken !== undefined) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }
      localStorage.setItem("hajj_user", JSON.stringify(newUser));
    } catch {
      /* ignore */
    }
    setToken(newAccessToken);
    setUser(newUser);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await getMe();
      setUser(fresh);
      localStorage.setItem("hajj_user", JSON.stringify(fresh));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    migrateLegacyAccessToken();
    let storedToken: string | null = null;
    let storedUser: string | null = null;
    try {
      storedToken = localStorage.getItem("accessToken");
      storedUser = localStorage.getItem("hajj_user");
    } catch {
      /* ignore */
    }

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }

    setupApiClient((newAccess) => {
      setToken(newAccess);
    });

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
