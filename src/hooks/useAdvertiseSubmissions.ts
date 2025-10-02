import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AdvertiseSubmission {
  id: string;
  user_id: string;
  platform: string;
  url: string;
  views: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  rate_per_1000: number;
  review_note?: string | null;
  reviewed_by?: string | null;
  payout_week?: string | null; // date string
  created_at: string;
  updated_at: string;
}

export function useAdvertiseSubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<AdvertiseSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id || null;

  const fetchMine = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('advertise_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
      setSubmissions([]);
    } else {
      setSubmissions((data as AdvertiseSubmission[]) || []);
    }
    setLoading(false);
  }, [userId]);

  const create = useCallback(async (payload: { platform: string; url: string; views: number }) => {
    if (!userId) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('advertise_submissions')
      .insert([{ user_id: userId, platform: payload.platform, url: payload.url, views: Math.max(0, Math.floor(payload.views)) }])
      .select('*')
      .single();
    if (error) throw error;
    setSubmissions((prev) => [data as AdvertiseSubmission, ...prev]);
    return data as AdvertiseSubmission;
  }, [userId]);

  // Update own views (allowed while pending per policy)
  const updateViews = useCallback(async (id: string, views: number) => {
    const { data, error } = await supabase
      .from('advertise_submissions')
      .update({ views: Math.max(0, Math.floor(views)) })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    setSubmissions((prev) => prev.map((s) => (s.id === id ? (data as AdvertiseSubmission) : s)));
    return data as AdvertiseSubmission;
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('rt-advertise-submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'advertise_submissions', filter: `user_id=eq.${userId}` }, fetchMine)
      .subscribe();
    fetchMine();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [userId, fetchMine]);

  return { submissions, loading, error, fetchMine, create, updateViews };
}

export function useAdminAdvertiseSubmissions() {
  const [rows, setRows] = useState<AdvertiseSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (status?: AdvertiseSubmission['status']) => {
    setLoading(true);
    setError(null);
    let query = supabase.from('advertise_submissions').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data as AdvertiseSubmission[]) || []);
    }
    setLoading(false);
  }, []);

  const setStatus = useCallback(async (id: string, status: AdvertiseSubmission['status'], review_note?: string) => {
    const { data, error } = await supabase
      .from('advertise_submissions')
      .update({ status, review_note })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    setRows((prev) => prev.map((r) => (r.id === id ? (data as AdvertiseSubmission) : r)));
    return data as AdvertiseSubmission;
  }, []);

  const updateViews = useCallback(async (id: string, views: number) => {
    const { data, error } = await supabase
      .from('advertise_submissions')
      .update({ views: Math.max(0, Math.floor(views)) })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    setRows((prev) => prev.map((r) => (r.id === id ? (data as AdvertiseSubmission) : r)));
    return data as AdvertiseSubmission;
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel('rt-admin-advertise')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'advertise_submissions' }, () => fetchAll())
      .subscribe();
    fetchAll();
    return () => { try { supabase.removeChannel(ch); } catch {} };
  }, [fetchAll]);

  return { rows, loading, error, fetchAll, setStatus, updateViews };
}