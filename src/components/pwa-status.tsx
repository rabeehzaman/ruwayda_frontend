"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export function PWAStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if app is installed (running in standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInWebAppiOS = 'standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone;
    
    setIsInstalled(isStandalone || (isIOS && Boolean(isInWebAppiOS)));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <Badge variant={isOnline ? "default" : "destructive"}>
        {isOnline ? "Online" : "Offline"}
      </Badge>
      {isInstalled && (
        <Badge variant="secondary">
          PWA Installed
        </Badge>
      )}
    </div>
  );
}