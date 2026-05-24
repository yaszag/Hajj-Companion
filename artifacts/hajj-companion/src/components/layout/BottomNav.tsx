import React from "react";
import { Link, useLocation } from "wouter";
import { Home, List, MapPin, Users, BookOpen, Sun } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/duas", label: "أدعية", icon: BookOpen },
    { href: "/manasik", label: "مناسكي", icon: List },
    { href: "/arafah", label: "عرفة", icon: Sun },
    { href: "/places", label: "مواقعي", icon: MapPin },
    { href: "/group", label: "مجموعتي", icon: Users },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive =
            location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors cursor-pointer ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`relative p-1.5 rounded-xl transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                  <Icon className="w-5 h-5" />
                  {item.href === "/duas" && isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "font-bold" : ""}`}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
