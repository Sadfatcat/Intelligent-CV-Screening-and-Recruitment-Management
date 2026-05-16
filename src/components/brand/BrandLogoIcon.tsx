import type { CSSProperties } from "react";

type BrandLogoIconProps = {
    className?: string;
    size?: number;
    color?: string;
    accentColor?: string;
    title?: string;
    decorative?: boolean;
    style?: CSSProperties;
};

export default function BrandLogoIcon({
    className,
    size = 64,
    color = "#12161d",
    accentColor = "#1f9a9a",
    title = "intelliCV",
    decorative = false,
    style,
}: BrandLogoIconProps) {
    const strokeWidth = 8;

    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 160 160"
            role={decorative ? undefined : "img"}
            aria-hidden={decorative ? true : undefined}
            aria-label={decorative ? undefined : title}
            style={{ display: "block", background: "transparent", ...style }}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M45 18H99L130 49V132C130 141 123 148 114 148H45C36 148 29 141 29 132V34C29 25 36 18 45 18Z"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
            />
            <path
                d="M99 18V45C99 53 105 59 113 59H130"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
            />
            <path
                d="M50 132V40H88V56C88 69 98 79 111 79H118V132H50Z"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth - 2}
                strokeLinejoin="round"
            />
            <path
                d="M11 82H149"
                fill="none"
                stroke={accentColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />
            <path d="M23 59L46 82L23 105" fill="none" stroke={accentColor} strokeWidth={strokeWidth - 1} strokeLinecap="round" />
            <path d="M137 59L114 82L137 105" fill="none" stroke={accentColor} strokeWidth={strokeWidth - 1} strokeLinecap="round" />
            <circle cx="19" cy="56" r="9" fill={accentColor} />
            <circle cx="19" cy="108" r="9" fill={accentColor} />
            <circle cx="141" cy="56" r="9" fill={accentColor} />
            <circle cx="141" cy="108" r="9" fill={accentColor} />
        </svg>
    );
}
