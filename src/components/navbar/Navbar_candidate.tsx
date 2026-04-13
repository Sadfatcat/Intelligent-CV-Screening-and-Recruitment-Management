"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const navItems = [
    { label: "About Us", href: "https://usth.edu.vn/gioi-thieu/gioi-thieu-chung-ve-usth/" },
    { label: "Jobs", href:"/candidate_UI" },
    { label: "Contact", href: "https://usth.edu.vn/" },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const themeParam = searchParams.get("theme");
    const currentTheme = themeParam === "bright" ? "bright" : "dark";
    const isDark = currentTheme === "dark";

    const switchTheme = (theme: "dark" | "bright") => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("theme", theme);
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <nav style={{ ...styles.navbar, ...(isDark ? styles.navbarDark : styles.navbarBright) }}>
            <div style={{ ...styles.container, ...(isDark ? styles.containerDark : styles.containerBright) }}>
                <a style={{ ...styles.logo, ...(isDark ? styles.logoDark : styles.logoBright) }}>
                    <img src="/usthvector.webp" alt="USTH Logo" style={{ height: "30px", width: "auto", objectFit: "contain" }} />
                    CV Screening
                </a>

                <div style={styles.rightArea}>
                    <div style={{ ...styles.themeSwitch, ...(isDark ? styles.themeSwitchDark : styles.themeSwitchBright) }}>
                        <button
                            type="button"
                            onClick={() => switchTheme("dark")}
                            style={{
                                ...styles.themeButton,
                                ...(isDark ? styles.themeButtonDark : {}),
                                ...(currentTheme === "dark" ? styles.themeButtonActive : {}),
                                ...(currentTheme === "dark" && isDark ? styles.themeButtonActiveDark : {}),
                            }}
                        >
                            Dark
                        </button>
                        <button
                            type="button"
                            onClick={() => switchTheme("bright")}
                            style={{
                                ...styles.themeButton,
                                ...(isDark ? styles.themeButtonDark : {}),
                                ...(currentTheme === "bright" ? styles.themeButtonActive : {}),
                            }}
                        >
                            Bright
                        </button>
                    </div>

                    <div style={styles.links}>
                        {navItems.map((item) => {
                            const isActive = item.href.startsWith("/") && pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={{
                                        ...styles.link,
                                        ...(isDark ? styles.linkDark : {}),
                                        ...(isActive ? styles.activeLink : {}),
                                        ...(isActive && isDark ? styles.activeLinkDark : {}),
                                    }}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}

const styles: Record<string, React.CSSProperties> = {
    navbar: {
        width: "100%",
        height: "76px",
        position: "fixed",
        top: 0,
        zIndex: 1000,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
    },
    navbarBright: {
        background: "linear-gradient(120deg, rgba(223, 246, 255, 0.6), rgba(239, 250, 255, 0.58))",
        borderBottom: "1px solid rgba(46, 120, 155, 0.22)",
        boxShadow: "0 10px 28px rgba(16, 89, 122, 0.16)",
    },
    navbarDark: {
        background: "linear-gradient(120deg, rgba(6, 16, 28, 0.68), rgba(10, 25, 40, 0.64))",
        borderBottom: "1px solid rgba(115, 165, 204, 0.24)",
        boxShadow: "0 12px 30px rgba(2, 7, 13, 0.5)",
    },
    container: {
        width: "100%",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        borderRadius: "0",
        marginTop: "0",
    },
    containerBright: {
        background: "linear-gradient(130deg, rgba(255, 255, 255, 0.5), rgba(235, 248, 255, 0.36))",
        border: "1px solid rgba(82, 150, 186, 0.2)",
    },
    containerDark: {
        color: "#dfe8ef",
        background: "linear-gradient(140deg, rgba(8, 20, 33, 0.66), rgba(11, 27, 42, 0.54))",
        border: "1px solid rgba(115, 165, 204, 0.24)",
    },
    logo: {
        color: "#1d3648",
        fontSize: "21px",
        fontWeight: 800,
        textDecoration: "none",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: "9px",
        letterSpacing: "0.01em",
    },
    logoBright: {
        color: "#134f6c",
        textShadow: "0 1px 0 rgba(255,255,255,0.45)",
    },
    logoDark: {
        color: "#e2eff9",
    },
    rightArea: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "12px",
        minWidth: 0,
        flexWrap: "wrap",
    },
    themeSwitch: {
        display: "inline-flex",
        alignItems: "center",
        padding: "4px",
        background: "rgba(230, 240, 245, 0.75)",
        border: "1px solid rgba(40, 70, 92, 0.14)",
        borderRadius: "999px",
    },
    themeSwitchBright: {
        background: "rgba(232, 247, 255, 0.7)",
        border: "1px solid rgba(62, 138, 176, 0.24)",
    },
    themeSwitchDark: {
        background: "rgba(9, 22, 35, 0.78)",
        border: "1px solid rgba(121, 170, 207, 0.22)",
    },
    themeButton: {
        border: "none",
        background: "transparent",
        color: "#456276",
        fontSize: "13px",
        fontWeight: 700,
        padding: "7px 12px",
        borderRadius: "999px",
        cursor: "pointer",
    },
    themeButtonDark: {
        color: "#9fb4c7",
    },
    themeButtonActive: {
        background: "linear-gradient(135deg, #1f7293 0%, #345f7f 100%)",
        color: "#ffffff",
        boxShadow: "0 8px 16px rgba(31, 114, 147, 0.28)",
    },
    themeButtonActiveDark: {
        background: "linear-gradient(135deg, #152a3f 0%, #1f3d5b 100%)",
        border: "1px solid rgba(151, 188, 216, 0.28)",
        boxShadow: "0 10px 20px rgba(6, 14, 25, 0.48)",
    },
    links: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
    },
    link: {
        color: "#2b4658",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: 700,
        padding: "9px 12px",
        borderRadius: "999px",
        transition: "0.2s ease",
        background: "rgba(255, 255, 255, 0.5)",
        border: "1px solid rgba(40, 70, 92, 0.09)",
    },
    linkDark: {
        color: "#d9e7f3",
        background: "linear-gradient(145deg, rgba(10, 24, 39, 0.86), rgba(15, 34, 52, 0.82))",
        border: "1px solid rgba(121, 160, 191, 0.2)",
    },
    activeLink: {
        background: "linear-gradient(135deg, #cc3a3a 0%, #ad2837 100%)",
        color: "#ffffff",
        border: "1px solid transparent",
        boxShadow: "0 8px 16px rgba(173, 40, 55, 0.24)",
    },
    activeLinkDark: {
        background: "linear-gradient(135deg, #1f4c72 0%, #295f8d 100%)",
        border: "1px solid rgba(156, 197, 228, 0.3)",
        boxShadow: "0 10px 18px rgba(6, 14, 25, 0.5)",
    },
};
