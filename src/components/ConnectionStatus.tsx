import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Check database connectivity
  const checkDbConnection = async () => {
    try {
      const { error } = await supabase
        .from('platform_settings')
        .select('id')
        .limit(1);
      
      setDbConnected(!error);
      setLastCheck(new Date());
    } catch (e) {
      setDbConnected(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    // Check network connectivity
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial database check
    checkDbConnection();
    
    // Check database connection every 30 seconds
    const interval = setInterval(checkDbConnection, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Don't show anything if everything is working
  if (isOnline && dbConnected) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="h-3 w-3" />,
        text: 'Offline',
        variant: 'destructive' as const,
        description: 'No internet connection'
      };
    }
    
    if (dbConnected === false) {
      return {
        icon: <AlertCircle className="h-3 w-3" />,
        text: 'Database Offline',
        variant: 'destructive' as const,
        description: 'Cannot connect to database'
      };
    }
    
    if (dbConnected === null) {
      return {
        icon: <Wifi className="h-3 w-3" />,
        text: 'Checking...',
        variant: 'secondary' as const,
        description: 'Checking database connection'
      };
    }

    return {
      icon: <Wifi className="h-3 w-3" />,
      text: 'Connected',
      variant: 'success' as const,
      description: 'All systems operational'
    };
  };

  const status = getStatusInfo();

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge
        variant={status.variant}
        className="flex items-center gap-2 px-3 py-2 text-xs"
        title={`${status.description}${lastCheck ? ` (Last checked: ${lastCheck.toLocaleTimeString()})` : ''}`}
      >
        {status.icon}
        {status.text}
      </Badge>
    </div>
  );
}