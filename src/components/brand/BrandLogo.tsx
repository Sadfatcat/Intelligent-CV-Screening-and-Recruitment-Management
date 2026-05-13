import type { CSSProperties } from "react";

type BrandLogoProps = {
    title?: string;
    subtitle?: string;
    compact?: boolean;
    inverted?: boolean;
    style?: CSSProperties;
};

// Brand Logo: biểu tượng CV thông minh dùng chung cho navbar/sidebar.
export default function BrandLogo({
    title = "Intelligent CV",
    subtitle = "Screening & Recruitment",
    compact = false,
    inverted = false,
    style,
}: BrandLogoProps) {
    const ink = inverted ? "#ffffff" : "#12161d";
    const muted = inverted ? "rgba(255,255,255,0.74)" : "#4a4a4a";
    const teal = "#229c99";

    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: compact ? 10 : 14, minWidth: 0, ...style }}>
            <svg
                width={compact ? 42 : 54}
                height={compact ? 42 : 54}
                viewBox="0 0 64 64"
                role="img"
                aria-label="Intelligent CV logo"
                style={{ flex: "0 0 auto" }}
            >
                <path
                    d="M17 6h26l11 11v39a7 7 0 0 1-7 7H17a7 7 0 0 1-7-7V13a7 7 0 0 1 7-7Z"
                    fill="none"
                    stroke={ink}
                    strokeWidth="5"
                    strokeLinejoin="round"
                />
                <path
                    d="M43 7v13a5 5 0 0 0 5 5h6"
                    fill="none"
                    stroke={ink}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M18 50V16h25"
                    fill="none"
                    stroke={ink}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path d="M3 34h58" stroke={teal} strokeWidth="5" strokeLinecap="round" />
                <path d="M8 24l12 12L8 48" fill="none" stroke={teal} strokeWidth="4" strokeLinecap="round" />
                <path d="M56 24L44 36l12 12" fill="none" stroke={teal} strokeWidth="4" strokeLinecap="round" />
                <circle cx="8" cy="24" r="4" fill={teal} />
                <circle cx="8" cy="48" r="4" fill={teal} />
                <circle cx="56" cy="24" r="4" fill={teal} />
                <circle cx="56" cy="48" r="4" fill={teal} />
            </svg>

            <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.02, minWidth: 0 }}>
                <span
                    style={{
                        color: ink,
                        fontFamily: '"Newsreader", serif',
                        fontSize: compact ? 22 : 30,
                        fontWeight: 600,
                        letterSpacing: 0,
                        whiteSpace: "nowrap",
                    }}
                >
                    {title}
                </span>
                {!compact && (
                    <span
                        style={{
                            color: muted,
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            marginTop: 5,
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {subtitle}
                    </span>
                )}
            </span>
        </div>
    );
}
