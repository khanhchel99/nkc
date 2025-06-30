"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

interface WholesaleUser {
  id: string;
  email: string;
  name: string;
  companyId: string;
  role: string;
  permissions: string[];
  userType: 'wholesale';
}

interface WholesaleAuthContextType {
  user: WholesaleUser | null;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const WholesaleAuthContext = createContext<WholesaleAuthContextType | undefined>(undefined);

export function useWholesaleAuth() {
  const context = useContext(WholesaleAuthContext);
  if (context === undefined) {
    throw new Error("useWholesaleAuth must be used within a WholesaleAuthProvider");
  }
  return context;
}

export function WholesaleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WholesaleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include", // Include session cookie
      });

      if (!response.ok) {
        throw new Error("Not authenticated");
      }

      const userData = await response.json();
      
      // Check if user is wholesale type
      if (userData.userType === 'wholesale') {
        setUser(userData);
      } else {
        // User is not wholesale, redirect to main login
        router.push("/auth/signin");
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      // Not authenticated, redirect to main login
      router.push("/auth/signin");
    }
  };

  useEffect(() => {
    fetchCurrentUser().finally(() => setIsLoading(false));
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    setUser(null);
    router.push("/auth/signin");
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <WholesaleAuthContext.Provider value={{ user, isLoading, logout, refreshUser }}>
      {children}
    </WholesaleAuthContext.Provider>
  );
}
