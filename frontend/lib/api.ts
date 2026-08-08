import { API_BASE } from "@/lib/config";


let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    if (refreshPromise) return refreshPromise; // dedupe concurrent refreshes

    refreshPromise = (async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/refresh`, {
                method: "POST",
                credentials: "include", // sends the httpOnly refreshToken cookie
            });
            if (!res.ok) return null;
            const data = await res.json();
            localStorage.setItem("accessToken", data.accessToken);
            return data.accessToken as string;
        } catch {
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

export async function apiFetch(path: string, options: RequestInit = {}, _retried = false): Promise<any> {
    const token = localStorage.getItem("accessToken");
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: "include",   // ← was missing, add this back
        headers: {
            ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });


    if (res.status === 401 && !_retried) {
        const newToken = await refreshAccessToken();
        if (newToken) return apiFetch(path, options, true); // retry once with the fresh token

        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        throw new Error("Session expired. Please log in again.");
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed: ${res.status}`);
    }

    return res.json();
}