import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  subscribed: boolean;
  subscriptionLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    setIsAdmin(!!data);
  };

  const checkSubscription = useCallback(async (userId?: string) => {
    try {
      setSubscriptionLoading(true);
      // Check Stripe subscription
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data?.subscribed) {
        setSubscribed(true);
        return;
      }
      // Check manual premium grant
      if (userId) {
        const { data: setting } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "manual_premium_users")
          .maybeSingle();
        const manualUsers = (setting?.value as string[]) || [];
        if (manualUsers.includes(userId)) {
          setSubscribed(true);
          return;
        }
      }
      setSubscribed(false);
    } catch {
      setSubscribed(false);
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    await checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => checkAdmin(session.user.id), 0);
        setTimeout(() => checkSubscription(session.user.id), 0);
      } else {
        setIsAdmin(false);
        setSubscribed(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
        checkSubscription(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, subscribed, subscriptionLoading, signIn, signOut, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
