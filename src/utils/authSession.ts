import { RECRUITER_PASSWORD_CHANGE_STORAGE_KEY, RECRUITER_SESSION_STORAGE_KEY } from "@/features/recruiter/constants/recruiterConstants";

export const AUTH_SESSION_STORAGE_KEY = "authSession";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export type AuthUser = {
    user_id: number;
    role: string;
    email?: string;
    full_name?: string | null;
    phone?: string | null;
    address?: string | null;
    company_name?: string | null;
    must_change_password?: boolean;
};

export type AuthSession = {
    access_token?: string;
    expires_at: number;
    user: AuthUser;
};

function parseJson<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function setAuthSession(data: AuthUser & { access_token?: string; expires_in?: number }) {
    const session: AuthSession = {
        access_token: data.access_token,
        expires_at: Date.now() + Math.min((data.expires_in ?? 86400) * 1000, SESSION_TTL_MS),
        user: data,
    };
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession() {
    const session = parseJson<AuthSession>(localStorage.getItem(AUTH_SESSION_STORAGE_KEY));
    if (session?.user?.role && session.expires_at > Date.now()) return session;
    if (session) localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
}

export function getStoredUser(role?: string) {
    const session = getAuthSession();
    if (!role || session?.user.role === role) return session?.user ?? null;
    return null;
}

export function clearAuthSession() {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    localStorage.removeItem("currentUser");
    localStorage.removeItem(RECRUITER_SESSION_STORAGE_KEY);
    localStorage.removeItem(RECRUITER_PASSWORD_CHANGE_STORAGE_KEY);
    localStorage.removeItem("adminUser");
}
