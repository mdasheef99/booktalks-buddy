import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

type ConnectionStatus = 'online' | 'offline' | 'reconnecting';

/**
 * Hook to monitor connection status and provide reconnection functionality
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(navigator.onLine ? 'online' : 'offline');
  const [lastOnline, setLastOnline] = useState<Date | null>(navigator.onLine ? new Date() : null);
  
  // Handle online status changes
  const handleOnline = useCallback(() => {
    const wasOffline = status !== 'online';
    setStatus('online');
    setLastOnline(new Date());
    
    if (wasOffline) {
      toast.success('Connection restored', {
        description: 'You are back online',
        duration: 3000,
      });
    }
  }, [status]);
  
  // Handle offline status changes
  const handleOffline = useCallback(() => {
    setStatus('offline');
    
    toast.error('Connection lost', {
      description: 'Check your internet connection',
      duration: 5000,
      id: 'connection-lost',
    });
  }, []);
  
  // Set up event listeners for online/offline events
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);
  
  // Function to manually check connection and attempt reconnection
  const checkConnection = useCallback(async () => {
    if (navigator.onLine) {
      // Browser thinks we're online, but let's verify with a network request
      try {
        setStatus('reconnecting');
        
        // Make a lightweight request to verify connection
        const response = await fetch('/api/ping', { 
          method: 'HEAD',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
          handleOnline();
          return true;
        } else {
          setStatus('offline');
          return false;
        }
      } catch (error) {
        console.error('Connection check failed:', error);
        setStatus('offline');
        return false;
      }
    } else {
      setStatus('offline');
      return false;
    }
  }, [handleOnline]);
  
  return {
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isReconnecting: status === 'reconnecting',
    status,
    lastOnline,
    checkConnection
  };
}
