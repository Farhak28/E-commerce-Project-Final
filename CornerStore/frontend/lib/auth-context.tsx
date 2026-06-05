"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@/lib/services/api-client";
import * as authService from "@/lib/services/auth";
import { getAuthToken } from "@/lib/services/api-client";
import type {
  AddressDTO,
  LoginDTO,
  RegisterDTO,
  SavedAddressDTO,
  UpsertSavedAddressDTO,
  UserDTO,
} from "@/lib/types";

export type Role = "customer" | "admin";

export type Session = {
  email: string;
  displayName: string;
  role: Role;
  roles: string[];
};

type AuthContextValue = {
  session: Session | null;
  user: UserDTO | null;
  isLoading: boolean;
  error: string | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: true; isAdmin: boolean } | { ok: false; error?: string }>;
  register: (data: RegisterDTO) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
  getAddress: () => Promise<AddressDTO | null>;
  updateAddress: (address: AddressDTO) => Promise<{ ok: boolean; error?: string }>;
  getAddresses: () => Promise<SavedAddressDTO[]>;
  upsertAddress: (address: UpsertSavedAddressDTO) => Promise<{ ok: boolean; error?: string; data?: SavedAddressDTO }>;
  deleteAddress: (addressId: number) => Promise<{ ok: boolean; error?: string }>;
  isSignedIn: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toSession(user: UserDTO): Session {
  const isAdmin = user.roles.some(
    (r) => r.toLowerCase() === "admin" || r.toLowerCase() === "superadmin",
  );
  return {
    email: user.email,
    displayName: user.displayName,
    role: isAdmin ? "admin" : "customer",
    roles: user.roles,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const current = await authService.getCurrentUser();
      setUser(current);
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        authService.logoutLocal();
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    })();
  }, [refreshUser]);

  useEffect(() => {
    const onUnauthorized = () => {
      authService.logoutLocal();
      setUser(null);
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const credentials: LoginDTO = { email: email.trim(), password };
      const result = await authService.login(credentials);
      setUser(result);
      setError(null);
      return { ok: true as const, isAdmin: toSession(result).role === "admin" };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Login failed. Please try again.";
      setError(msg);
      return { ok: false as const, error: msg };
    }
  }, []);

  const register = useCallback(async (data: RegisterDTO) => {
    try {
      const result = await authService.register(data);
      setUser(result);
      setError(null);
      return { ok: true as const };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Registration failed. Please try again.";
      setError(msg);
      return { ok: false as const, error: msg };
    }
  }, []);

  const signOut = useCallback(() => {
    authService.logoutLocal();
    setUser(null);
    setError(null);
  }, []);

  const checkEmailExists = useCallback(async (email: string) => {
    try {
      return await authService.checkEmailExists(email);
    } catch {
      throw new Error("EMAIL_CHECK_FAILED");
    }
  }, []);

  const getAddress = useCallback(async () => {
    try {
      return await authService.getAddress();
    } catch {
      return null;
    }
  }, []);

  const updateAddress = useCallback(async (address: AddressDTO) => {
    try {
      await authService.updateAddress(address);
      return { ok: true as const };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to update address.";
      return { ok: false as const, error: msg };
    }
  }, []);

  const getAddresses = useCallback(async () => {
    try {
      return await authService.getAddresses();
    } catch {
      return [];
    }
  }, []);

  const upsertAddress = useCallback(async (address: UpsertSavedAddressDTO) => {
    try {
      const data = await authService.upsertAddress(address);
      return { ok: true as const, data };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to save address.";
      return { ok: false as const, error: msg };
    }
  }, []);

  const deleteAddress = useCallback(async (addressId: number) => {
    try {
      await authService.deleteAddress(addressId);
      return { ok: true as const };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to delete address.";
      return { ok: false as const, error: msg };
    }
  }, []);

  const session = useMemo(() => (user ? toSession(user) : null), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isLoading,
      error,
      signIn,
      register,
      signOut,
      refreshUser,
      checkEmailExists,
      getAddress,
      updateAddress,
      getAddresses,
      upsertAddress,
      deleteAddress,
      isSignedIn: !!session,
      isAdmin: session?.role === "admin",
    }),
    [
      session,
      user,
      isLoading,
      error,
      signIn,
      register,
      signOut,
      refreshUser,
      checkEmailExists,
      getAddress,
      updateAddress,
      getAddresses,
      upsertAddress,
      deleteAddress,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
