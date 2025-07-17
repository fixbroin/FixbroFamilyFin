
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, Users, Bell } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

export function Header() {
  const { user, userProfile, family, logout } = useAuth();
  const { notificationCount } = useNotifications();
  const pathname = usePathname();

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Fixbro FamilyFin";

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/individual", label: "Individual" },
    { href: "/shopping", label: "Shopping List" },
    { href: "/expenses", label: "Expenses" },
    { href: "/earnings", label: "Earnings" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="bg-card border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-primary-foreground font-headline">
              {appName}
            </Link>
            <nav className="hidden md:flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium",
                    pathname.startsWith(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {family && (
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{family.name}</span>
              </div>
            )}
             <Button variant="ghost" size="icon" asChild className="relative h-8 w-8">
              <Link href="/notifications">
                <Bell className="h-5 w-5" />
                 {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || userProfile?.photoURL || ""} alt={userProfile?.name || ""} />
                    <AvatarFallback>
                      {userProfile?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings"><Settings className="mr-2 h-4 w-4" /><span>Settings</span></Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
