import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type User = {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
};

type AuthCtx = {
    token: string | null;
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (body: {
        username: string; email: string; first_name: string; last_name: string; password: string;
    }) => Promise<void>;
    logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem("access_token"));
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(!!token);

    useEffect(() => {
    let alive = true;

    (async () => {
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const me = await apiFetch<User>("/users/me", {}, token);
            if (alive) setUser(me);
        } catch {
            if (alive) {
                localStorage.removeItem("access_token");
                setToken(null);
                setUser(null);
            }
        } finally {
            if (alive) setLoading(false);
        }
    })();

    return () => { alive = false };
}, [token]);

    async function login(username: string, password: string) {
        // /auth/token → form-encoded olmalı
        const body = new URLSearchParams();
        body.set("username", username);
        body.set("password", password);
        const data = await apiFetch<{ access_token: string; token_type: string }>(
            "/auth/token",
            { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        localStorage.setItem("access_token", data.access_token);
        setToken(data.access_token);
        // user hydrate: useEffect tetiklenir
    }

    async function register(payload: {
        username: string; email: string; first_name: string; last_name: string; password: string;
    }) {
        // Basit olsun diye role göndermiyoruz; backend'de default 'user' olması ideal.
        await apiFetch("/auth/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, role: "user" }),
        });
        // Kayıttan sonra login sayfasına yönlendireceğiz (sayfa içinde).
    }

    function logout() {
        localStorage.removeItem("access_token");
        setToken(null);
        setUser(null);
    }

    return (
        <Ctx.Provider value={{ token, user, loading, login, register, logout }}>
            {children}
        </Ctx.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
