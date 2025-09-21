import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Tournament = Database['public']['Tables']['tournaments']['Row'] & {
  games?: Database['public']['Tables']['games']['Row'];
  game_modes?: Database['public']['Tables']['game_modes']['Row'];
  is_registered?: boolean;
};

export function useTournaments() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip tournament loading if feature is disabled
    if (import.meta.env.VITE_DISABLE_TOURNAMENTS === 'true') {
      setLoading(false);
      return;
    }
    fetchTournaments();
  }, [user]);

  const fetchTournaments = async () => {
    // Skip if tournaments are disabled
    if (import.meta.env.VITE_DISABLE_TOURNAMENTS === 'true') {
      setTournaments([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select(`
          *,
          games(*),
          game_modes(*)
        `)
        .order('start_date', { ascending: true });

      if (tournamentsError) {
        // Handle missing tournaments table gracefully
        if (tournamentsError.code === 'PGRST205') {
          console.log('Tournaments table not found, tournaments feature not yet implemented');
          setTournaments([]);
          setError(null);
          return;
        }
        throw tournamentsError;
      }

      // Check registration status for each tournament if user is logged in
      let tournamentsWithRegistration = tournamentsData || [];
      
      if (user && tournamentsData) {
        try {
          tournamentsWithRegistration = await Promise.all(
            tournamentsData.map(async (tournament) => {
              const { count } = await supabase
                .from('tournament_participants')
                .select('*', { count: 'exact', head: true })
                .eq('tournament_id', tournament.id)
                .eq('user_id', user.id);

              return {
                ...tournament,
                is_registered: (count || 0) > 0
              };
            })
          );
        } catch (participantError: any) {
          // Handle missing tournament_participants table
          if (participantError.code === 'PGRST205') {
            console.log('Tournament participants table not found, skipping registration status');
            // Return tournaments without registration status
            tournamentsWithRegistration = tournamentsData;
          } else {
            throw participantError;
          }
        }
      }

      setTournaments(tournamentsWithRegistration);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  const registerForTournament = async (tournamentId: string) => {
    if (!user) {
      toast.error('Please log in to register for tournaments');
      return;
    }

    try {
      const { error } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id
        });

      if (error) throw error;
      
      toast.success('Successfully registered for tournament!');
      fetchTournaments();
    } catch (err: any) {
      toast.error(err.message);
      console.error('Error registering for tournament:', err);
    }
  };

  return {
    tournaments,
    loading,
    error,
    registerForTournament,
    refetch: fetchTournaments
  };
}

export function useUserTournaments() {
  const { user } = useAuth();
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [availableTournaments, setAvailableTournaments] = useState<Tournament[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip tournament loading if feature is disabled
    if (import.meta.env.VITE_DISABLE_TOURNAMENTS === 'true') {
      setLoading(false);
      return;
    }
    if (user) {
      fetchUserTournaments();
    }
  }, [user]);

  const fetchUserTournaments = async () => {
    if (!user) return;
    
    // Skip if tournaments are disabled
    if (import.meta.env.VITE_DISABLE_TOURNAMENTS === 'true') {
      setMyTournaments([]);
      setCompletedTournaments([]);
      setAvailableTournaments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch tournaments user is registered for
      const { data: participantData, error: participantError } = await supabase
        .from('tournament_participants')
        .select(`
          tournaments(
            *,
            games(*),
            game_modes(*)
          )
        `)
        .eq('user_id', user.id);

      if (participantError) {
        // Handle missing tournament_participants table gracefully
        if (participantError.code === 'PGRST205') {
          console.log('Tournament participants table not found, tournaments feature not yet implemented');
          setMyTournaments([]);
          setCompletedTournaments([]);
          setAvailableTournaments([]);
          return;
        }
        throw participantError;
      }

      const registeredTournaments = participantData?.map(p => p.tournaments).filter(Boolean) || [];

      // Separate by status
      const ongoing = registeredTournaments.filter(t => 
        t && ['registration', 'in_progress'].includes(t.status)
      );
      
      const completed = registeredTournaments.filter(t => 
        t && t.status === 'completed'
      );

      // Fetch available tournaments (not registered)
      const registeredIds = registeredTournaments.map(t => t?.id).filter(Boolean);
      
      let availableQuery = supabase
        .from('tournaments')
        .select(`
          *,
          games(*),
          game_modes(*)
        `)
        .eq('status', 'registration');

      if (registeredIds.length > 0) {
        const inList = `(${registeredIds.map((id) => `"${id}"`).join(',')})`;
        availableQuery = availableQuery.not('id', 'in', inList);
      }

      const { data: availableData, error: availableError } = await availableQuery;
      
      if (availableError) {
        // Handle missing tournaments table gracefully
        if (availableError.code === 'PGRST205') {
          console.log('Tournaments table not found, tournaments feature not yet implemented');
          setMyTournaments(ongoing as Tournament[]);
          setCompletedTournaments(completed as Tournament[]);
          setAvailableTournaments([]);
          return;
        }
        throw availableError;
      }

      setMyTournaments(ongoing as Tournament[]);
      setCompletedTournaments(completed as Tournament[]);
      setAvailableTournaments(availableData || []);
    } catch (err: any) {
      console.error('Error fetching user tournaments:', err);
      // Set empty arrays on error to prevent UI crashes
      setMyTournaments([]);
      setCompletedTournaments([]);
      setAvailableTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    myTournaments,
    availableTournaments,
    completedTournaments,
    loading,
    refetch: fetchUserTournaments
  };
}