
"use client";

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
       <div className="flex items-center gap-2 bg-muted text-muted-foreground p-3 rounded-lg shadow-lg border animate-in fade-in duration-300">
            <WifiOff className="h-5 w-5" />
            <p className="text-sm font-medium">You're offline. Changes will sync when you reconnect.</p>
        </div>
    </div>
  );
}
