import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, getAuthToken, setAuthToken } from "./api";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (cpf: string, password: string) => Promise<void>;
  register: (cpf: string, name: string, password: string, planType?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: User }>("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setAuthToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (cpf: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>("/auth/login", {
      cpf,
      password,
    });
    setAuthToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (cpf: string, name: string, password: string, planType?: string) => {
      const data = await api.post<{ token: string; user: User }>(
        "/auth/register",
        { cpf, name, password, planType }
      );
      setAuthToken(data.token);
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

export { ApiError };
