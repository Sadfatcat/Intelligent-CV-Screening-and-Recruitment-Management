import { getAuthSession } from "./authSession";

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

    return "/login";
}
