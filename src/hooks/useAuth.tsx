import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { api, getStoredUser, getToken } from "@/integrations/api/client";

// ─── Types (compatible with existing component usage) ─────────────────────────
export interface AppUser {
  id: string;
  email: string;
  roles: string[];
  profile?: {
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
  };
}

interface AuthContextType {
  user: AppUser | null;
  session: { user: AppUser; access_token: string } | null;
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
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<{ user: AppUser; access_token: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const resolveAdmin = (u: AppUser | null) => {
    setIsAdmin(!!u && Array.isArray(u.roles) && u.roles.includes("admin"));
  };

  const checkSubscription = useCallback(async (userId?: string) => {
    try {
      setSubscriptionLoading(true);
      // Check manual premium grant via site settings
      if (userId) {
        const { data: setting } = await api
          .from("site_settings")
          .select("value")
          .eq("setting_key", "manual_premium_users")
          .maybeSingle();
        const manualUsers: string[] = Array.isArray(setting?.value)
          ? setting.value
          : [];
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
    if (user) await checkSubscription(user.id);
  }, [checkSubscription, user]);

  // Initialize from stored token on mount
  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (token && storedUser) {
      const appUser: AppUser = {
        id: storedUser.id || storedUser.userId,
        email: storedUser.email,
        roles: storedUser.roles || [],
      };
      setUser(appUser);
      setSession({ user: appUser, access_token: token });
      resolveAdmin(appUser);
      checkSubscription(appUser.id);
    }

    setLoading(false);

    // Listen for auth state changes (login / logout events)
    const { data: { subscription } } = api.auth.onAuthStateChange((_event, sess) => {
      if (sess?.user) {
        const appUser: AppUser = {
          id: sess.user.id || sess.user.userId,
          email: sess.user.email,
          roles: sess.user.roles || [],
        };
        setUser(appUser);
        setSession({ user: appUser, access_token: sess.access_token });
        resolveAdmin(appUser);
        checkSubscription(appUser.id);
      } else {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setSubscribed(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await api.auth.signInWithPassword({ email, password });
    if (error) return { error: new Error(error.message) };
    if (data?.user) {
      const appUser: AppUser = {
        id: data.user.id || data.user.userId,
        email: data.user.email,
        roles: data.user.roles || [],
      };
      setUser(appUser);
      setSession({ user: appUser, access_token: data.token });
      resolveAdmin(appUser);
    }
    return { error: null };
  };

  const signOut = async () => {
    await api.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setSubscribed(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        loading,
        subscribed,
        subscriptionLoading,
        signIn,
        signOut,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
