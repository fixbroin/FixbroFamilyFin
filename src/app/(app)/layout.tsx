
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader } from "@/components/ui/loader";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useShoppingListNotifications } from "@/hooks/useShoppingListNotifications";
import { OfflineIndicator } from "@/components/OfflineIndicator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading, family } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize notifications hook
  useShoppingListNotifications();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/login?redirect=${pathname}`);
      } else if (user && !userProfile?.familyId) {
        router.push("/join-family");
      }
    }
  }, [user, userProfile, loading, router, pathname]);

  if (loading || !user || (user && userProfile === null) || (userProfile && !userProfile.familyId) || (userProfile?.familyId && family === null)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader className="h-16 w-16" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-y-auto bg-background pb-20 md:pb-0">
        {children}
      </main>
      <OfflineIndicator />
      <MobileNav />
    </div>
  );
}
