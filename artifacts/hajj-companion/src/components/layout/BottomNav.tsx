import React from "react";
import { Link, useLocation } from "wouter";
import { Home, List, MapPin, Users, AlertTriangle, User as UserIcon } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/manasik", label: "مناسكي", icon: List },
    { href: "/places", label: "مواقعي", icon: MapPin },
    { href: "/group", label: "مجموعتي", icon: Users },
    { href: "/emergency", label: "الطوارئ", icon: AlertTriangle, danger: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={`flex flex-col items-center justify-center w-16 h-full space-y-1 ${
                  item.danger 
                    ? isActive ? "text-destructive" : "text-destructive/70"
                    : isActive ? "text-primary" : "text-muted-foreground"
                } transition-colors cursor-pointer`}
              >
                <Icon className={`w-6 h-6 ${isActive ? "fill-current/10" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
