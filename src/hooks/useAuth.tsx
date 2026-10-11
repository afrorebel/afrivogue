import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { api } from "@/integrations/api/client";
import type { User, Session } from "@/integrations/api/client";

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
    const { data } = await api.rpc("has_role", { _user_id: userId, _role: "admin" });
    setIsAdmin(!!data);
  };

  const checkSubscription = useCallback(async (userId?: string) => {
    try {
      setSubscriptionLoading(true);
      // Check Stripe subscription
      const { data, error } = await api.functions.invoke("check-subscription");
      if (!error && data?.subscribed) {
        setSubscribed(true);
        return;
      }
      // Check manual premium grant
      if (userId) {
        const { data: setting } = await api
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
    // Admin status is known before `loading` clears, so admin pages never bounce a real admin.
    const apply = async (session: Session | null) => {
      setLoading(true);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkAdmin(session.user.id);
        checkSubscription(session.user.id);
      } else {
        setIsAdmin(false);
        setSubscribed(false);
      }
      setLoading(false);
    };

    const { data: { subscription } } = api.auth.onAuthStateChange((_event, session) => {
      apply(session);
    });
    api.auth.getSession().then(({ data: { session } }) => apply(session));

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  const signIn = async (email: string, password: string) => {
    const { error } = await api.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await api.auth.signOut();
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
