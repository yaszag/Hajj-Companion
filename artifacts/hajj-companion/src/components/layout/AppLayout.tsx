import React from "react";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { Link, Redirect } from "wouter";
import { UserCircle } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  hideNav?: boolean;
  hideHeader?: boolean;
}

export function AppLayout({ children, title, hideNav = false, hideHeader = false }: AppLayoutProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {!hideHeader && (
        <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm h-14 flex items-center justify-between px-4">
          <h1 className="font-semibold text-lg text-primary">{title || "رفيق الحج"}</h1>
          <Link href="/profile">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-primary cursor-pointer hover:bg-muted/80 transition-colors">
              <UserCircle className="w-6 h-6" />
            </div>
          </Link>
        </header>
      )}
      
      <main className={`flex-1 overflow-y-auto ${hideNav ? "" : "pb-20"}`}>
        {children}
      </main>

      {!hideNav && <BottomNav />}
    </div>
  );
}
