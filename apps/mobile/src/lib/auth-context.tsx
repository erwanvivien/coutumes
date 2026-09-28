import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { fetchCurrentUser, type AuthUser } from '@/lib/auth';

type AuthContextValue = {
  user: AuthUser | null;
  /** True until the first fetch (success or failure) has resolved. */
  hasLoadedOnce: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** One shared "who is signed in" fetch for the whole app — every screen that needs the current
 * user reads from here instead of each calling fetchCurrentUser() on its own. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const refresh = useCallback(async () => {
    const fetchedUser = await fetchCurrentUser();
    setUser(fetchedUser);
    setHasLoadedOnce(true);
  }, []);

  useEffect(() => {
    void (async () => {
      const fetchedUser = await fetchCurrentUser();
      setUser(fetchedUser);
      setHasLoadedOnce(true);
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, hasLoadedOnce, refresh }}>{children}</AuthContext.Provider>
  );
}

export function useAuthUser(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuthUser must be used within an AuthProvider');
  }
  return value;
}
