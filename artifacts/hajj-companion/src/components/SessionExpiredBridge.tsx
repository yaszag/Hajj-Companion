import { useEffect } from "react";
import { useLocation } from "wouter";
import { setSessionExpiredHandler } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Registers the API client session-expired handler (logout, toast, redirect to /login).
 * Must render inside WouterRouter and AuthProvider.
 */
export function SessionExpiredBridge() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setSessionExpiredHandler(() => {
      logout();
      toast({
        title: "Session expired",
        description: "Please log in again.",
        variant: "destructive",
      });
      setLocation("/login");
    });
    return () => setSessionExpiredHandler(null);
  }, [logout, setLocation, toast]);

  return null;
}
