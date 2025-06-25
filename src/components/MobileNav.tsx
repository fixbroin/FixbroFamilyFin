
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, Settings, CreditCard, Landmark, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { href: "/dashboard", label: "Shopping", icon: List },
    { href: "/expenses", label: "Expenses", icon: CreditCard },
    { href: "/earnings", label: "Earnings", icon: Landmark },
    { href: "/notifications", label: "Activity", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-10">
      <nav className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-sm font-medium",
                isActive ? "text-accent" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
