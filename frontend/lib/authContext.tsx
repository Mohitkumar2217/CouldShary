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
    login: (accessToken: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");
        if (stored && storedUser) {
            setAccessToken(stored);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (token: string, u: User) => {
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
        <AuthContext.Provider value={{ user, accessToken, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be wihtin AuthProvider");
    return ctx;
}