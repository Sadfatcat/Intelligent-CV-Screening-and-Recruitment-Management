import type { CSSProperties } from "react";

type BrandLogoProps = {
    title?: string;
    subtitle?: string;
    compact?: boolean;
    inverted?: boolean;
    style?: CSSProperties;
};

// Brand Logo: dùng asset PNG chính thức của dự án cho navbar/sidebar.
export default function BrandLogo({
    title,
    subtitle,
    compact = false,
    inverted = false,
    style,
}: BrandLogoProps) {
    const isSidebarLogo = inverted;
    const width = isSidebarLogo ? (compact ? 74 : 132) : (compact ? 128 : 178);
    const height = isSidebarLogo ? width : Math.round(width / 2);

    return (
        <img
            src={isSidebarLogo ? "/brand/cvai-icon.png" : "/brand/cvai-logo.png"}
            alt={title || subtitle || "CV AI"}
            width={width}
            height={height}
            style={{
                display: "block",
                height: "auto",
                maxWidth: "100%",
                marginInline: isSidebarLogo ? "auto" : undefined,
                ...style,
            }}
        />
    );
}
