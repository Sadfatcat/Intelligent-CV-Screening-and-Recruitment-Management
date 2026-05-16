"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";

type BackButtonProps = {
    className?: string;
    label?: string;
    fallbackHref: string;
    style?: CSSProperties;
};

export default function BackButton({
    className,
    label = "Back",
    fallbackHref,
    style,
}: BackButtonProps) {
    const router = useRouter();

    function handleBack() {
        if (typeof window === "undefined") {
            router.push(fallbackHref);
            return;
        }

        const referrer = document.referrer;
        const hasExternalReferrer = Boolean(referrer) && new URL(referrer).origin !== window.location.origin;

        if (window.history.length > 1 && !hasExternalReferrer) {
            router.back();
            return;
        }

        router.push(fallbackHref);
    }

    return (
        <button
        className={className}
        type="button"
        onClick={handleBack}
            style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                font: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: 0,
                ...style,
            }}
        >
            <span aria-hidden="true">{"<"}</span> {label}
        </button>
    );
}
