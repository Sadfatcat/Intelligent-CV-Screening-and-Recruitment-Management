import type { CSSProperties } from "react";
import BrandLogoIcon from "./BrandLogoIcon";

type BrandLogoFullProps = {
    className?: string;
    iconSize?: number;
    color?: string;
    accentColor?: string;
    textColor?: string;
    style?: CSSProperties;
};

export default function BrandLogoFull({
    className,
    iconSize = 48,
    color = "#12161d",
    accentColor = "#1f9a9a",
    textColor = "#12161d",
    style,
}: BrandLogoFullProps) {
    return (
        <div
            className={className}
            aria-label="intelliCV"
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: Math.max(8, Math.round(iconSize * 0.22)),
                lineHeight: 1,
                background: "transparent",
                maxWidth: "100%",
                ...style,
            }}
        >
            <BrandLogoIcon
                size={iconSize}
                color={color}
                accentColor={accentColor}
                title="intelliCV icon"
                decorative
            />
            <span
                style={{
                    fontFamily: "'Newsreader', Georgia, serif",
                    fontSize: Math.round(iconSize * 0.68),
                    fontWeight: 800,
                    letterSpacing: 0,
                    color: textColor,
                    whiteSpace: "nowrap",
                }}
            >
                intelliCV
            </span>
        </div>
    );
}
