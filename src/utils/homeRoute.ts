import { RECRUITER_SESSION_STORAGE_KEY } from "@/features/recruiter/constants/recruiterConstants";
import { getAuthSession } from "./authSession";

type StoredUser = {
    role?: string;
};

function parseStoredUser(raw: string | null): StoredUser | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return typeof parsed === "object" && parsed !== null ? parsed : null;
    } catch {
        return null;
    }
}

export function homeHrefForRole(role?: string | null) {
    if (role === "admin") return "/admin/dashboard";
    if (role === "recruiter") return "/recruiter_UI";
    if (role === "candidate") return "/candidate";
    return "/login";
}

export function getStoredHomeHref() {
    if (typeof window === "undefined") return "/login";

    const session = getAuthSession();
    if (session) return homeHrefForRole(session.user.role);

    const admin = parseStoredUser(window.localStorage.getItem("adminUser"));
    if (admin?.role === "admin") return homeHrefForRole("admin");

    const recruiter = parseStoredUser(window.localStorage.getItem(RECRUITER_SESSION_STORAGE_KEY));
    if (recruiter?.role === "recruiter") return homeHrefForRole("recruiter");

    const candidate = parseStoredUser(window.localStorage.getItem("currentUser"));
    if (candidate?.role === "candidate") return homeHrefForRole("candidate");

    return "/login";
}
