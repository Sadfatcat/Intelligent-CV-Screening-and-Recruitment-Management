"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogoFull from "@/components/brand/BrandLogoFull";
import { getStoredHomeHref } from "@/utils/homeRoute";

const navItems = [
    { label: "About Us", href: "https://usth.edu.vn/gioi-thieu/gioi-thieu-chung-ve-usth/" },
    { label: "Jobs", href: "/candidate" },
    { label: "Contact", href: "https://usth.edu.vn/" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [homeHref, setHomeHref] = useState("/candidate");

    useEffect(() => {
        setHomeHref(getStoredHomeHref());
    }, []);

    return (
        <nav style={styles.navbar}>
            <div style={styles.container}>
                <Link href={homeHref} style={styles.logo} aria-label="Go to home">
                    <BrandLogoFull iconSize={46} color="#ffffff" textColor="#ffffff" accentColor="#25A2E8" style={{ gap: 4 }} />
                </Link>

                <div style={styles.rightArea}>
                    <div style={styles.links}>
                        {navItems.map((item) => {
                            const isActive = item.href.startsWith("/") && pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={{
                                        ...styles.link,
                                        ...(isActive ? styles.activeLink : {}),
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
        height: "78px",
        position: "fixed",
        top: 0,
        zIndex: 1000,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        background: "#151C62",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 12px 30px rgba(6, 11, 33, 0.38)",
    },
    container: {
        width: "100%",
        height: "100%",
        padding: "10px 18px 10px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        borderRadius: "0",
        marginTop: "0",
        background: "transparent",
        border: "none",
    },
    logo: {
        textDecoration: "none",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
    },
    rightArea: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "12px",
        minWidth: 0,
        flexWrap: "wrap",
    },
    links: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
    },
    link: {
        color: "#f8fafc",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: 700,
        padding: "9px 12px",
        borderRadius: "8px",
        transition: "0.2s ease",
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
    },
    activeLink: {
        background: "#FDF9F0",
        color: "#0F172A",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 6px 14px rgba(15, 23, 42, 0.18)",
    },
};
