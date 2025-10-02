import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Creator {
  id: string;
  name: string;
  title: string | null;
  bio: string;
  profile_image_url: string;
  cover_image_url: string | null;
  social_links: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
    facebook?: string;
    twitch?: string;
    discord?: string;
  };
  stats: {
    followers?: number;
    total_views?: number;
    videos_created?: number;
  };
  featured_from: string;
  featured_until: string;
  is_active: boolean;
  sort_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export function useCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_featured_creators');
      
      if (error) throw error;
      
      setCreators((data as Creator[]) || []);
    } catch (err: any) {
      console.error('Error fetching creators:', err);
      setError(err.message || 'Failed to fetch creators');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  return {
    creators,
    loading,
    error,
    refetch: fetchCreators
  };
}

export function useAdminCreators() {
  const { user } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCreators = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('creators_of_week')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCreators((data as Creator[]) || []);
    } catch (err: any) {
      console.error('Error fetching creators:', err);
      setError(err.message || 'Failed to fetch creators');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCreator = useCallback(async (creatorData: Omit<Creator, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('creators_of_week')
      .insert([{ ...creatorData, created_by: user.id }])
      .select('*')
      .single();

    if (error) throw error;

    setCreators(prev => [data as Creator, ...prev]);
    return data as Creator;
  }, [user?.id]);

  const updateCreator = useCallback(async (id: string, updates: Partial<Creator>) => {
    const { data, error } = await supabase
      .from('creators_of_week')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    setCreators(prev => prev.map(c => c.id === id ? (data as Creator) : c));
    return data as Creator;
  }, []);

  const deleteCreator = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('creators_of_week')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setCreators(prev => prev.filter(c => c.id !== id));
  }, []);

  const toggleCreatorStatus = useCallback(async (id: string, isActive: boolean) => {
    return updateCreator(id, { is_active: isActive });
  }, [updateCreator]);

  useEffect(() => {
    fetchAllCreators();
  }, [fetchAllCreators]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-creators-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'creators_of_week'
      }, fetchAllCreators)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllCreators]);

  return {
    creators,
    loading,
    error,
    fetchAllCreators,
    createCreator,
    updateCreator,
    deleteCreator,
    toggleCreatorStatus
  };
}