import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePlatformSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [feePercentage, setFeePercentage] = useState<number>(5);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('platform_settings')
        .select('fee_percentage, maintenance_mode, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);
      if (data && data.length) {
        setFeePercentage(data[0].fee_percentage ?? 5);
        setMaintenanceMode(!!data[0].maintenance_mode);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    const channel = supabase
      .channel('platform_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, () => {
        fetchSettings();
      })
      .subscribe();
    return () => {
      try { channel.unsubscribe(); } catch {}
    };
  }, []);

  return { maintenanceMode, feePercentage, loading, refetch: fetchSettings };
}
