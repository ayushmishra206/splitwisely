import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface SupabaseContextValue {
  supabase: typeof supabase;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      setIsLoading(true);
      const {
        data: { session: activeSession }
      } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(activeSession ?? null);
      setIsLoading(false);
    };

    const subscription = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setIsLoading(false);
    });

    void syncSession();

    return () => {
      isMounted = false;
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const syncProfile = async () => {
      if (!session?.user) {
        return;
      }

      try {
        const { id, email, user_metadata } = session.user;
        const fullName =
          user_metadata?.full_name ?? user_metadata?.name ?? user_metadata?.fullName ?? email ?? 'SplitWisely user';
        const avatarUrl = user_metadata?.avatar_url ?? user_metadata?.picture ?? null;

        const { error } = await supabase.from('profiles').upsert(
          {
            id,
            full_name: fullName,
            avatar_url: avatarUrl
          },
          { onConflict: 'id' }
        );

        if (error) {
          console.error('Failed to sync profile', error);
        }
      } catch (error) {
        console.error('Failed to sync profile', error);
      }
    };

    void syncProfile();
  }, [session]);

  const value = useMemo(
    () => ({
      supabase,
      session,
      user: session?.user ?? null,
      isLoading
    }),
    [session, isLoading]
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
