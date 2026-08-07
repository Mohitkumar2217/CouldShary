"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthContextValue {
    user: User | null;
    accessToken: string | null,
    isLoading: boolean,
    login: (accessToken: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");

        if (stored && storedUser) {
            setAccessToken(stored);
            setUser(JSON.parse(storedUser));
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");
        if (stored && storedUser) {
            try {
                setAccessToken(stored);
                setUser(JSON.parse(storedUser));
            } catch {
                // Corrupted data (e.g. from a past bug) — clear it and fall back to logged-out state
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
            }
        }
    }, []);

    const login = (token: string, u: User) => {
        if (!token || !u) {
            console.error("login() called with invalid token or user:", { token, u });
            return; // refuse to write bad data
        }
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(u));
        setAccessToken(token);
        setUser(u);
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setAccessToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be wihtin AuthProvider");
    return ctx;
}