const API_BASE = "http://localhost:7000";

export async function apiFetch(path:string, options: RequestInit = {}) {
    const token = localStorage.getItem("accessTokne");
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers:{
            ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
            ...(token ? {Authorization: `Bearer ${token}`} : {}),
            ...options.headers,
        },
    });
    
    if(!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed: ${res.status}`);
    }

    return res.json();
}