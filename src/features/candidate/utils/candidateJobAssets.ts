import { apiUrl } from "@/utils/api";

export function normalizeJobImageUrl(value: string | null | undefined) {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return apiUrl(value);
}
