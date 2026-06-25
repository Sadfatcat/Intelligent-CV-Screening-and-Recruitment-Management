"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogoFull from "@/components/brand/BrandLogoFull";
import { getStoredHomeHref } from "@/utils/homeRoute";

const navItems = [
  { label: "About Us", href: "https://usth.edu.vn/gioi-thieu/gioi-thieu-chung-ve-usth/" },
  { label: "Login", href: "/login" },
  { label: "Register", href: "/register/candidate" },
  // { label: "Admin", href: "/admin" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [homeHref, setHomeHref] = useState("/login");

  useEffect(() => {
    setHomeHref(getStoredHomeHref());
  }, []);

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <Link href={homeHref} style={styles.logo} aria-label="Go to home">
          <BrandLogoFull iconSize={46} />
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
    background: "rgba(251, 250, 247, 0.94)",
    borderBottom: "1px solid rgba(18, 22, 29, 0.12)",
    boxShadow: "none",
  },
  container: {
    width: "100%",
    height: "100%",
    padding: "10px 28px",
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
    color: "#12161d",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
    padding: "9px 12px",
    borderRadius: "12px",
    transition: "0.2s ease",
    background: "#ffffff",
    border: "1px solid rgba(18, 22, 29, 0.12)",
  },
  activeLink: {
    background: "#12161d",
    color: "#ffffff",
    border: "1px solid transparent",
    boxShadow: "none",
  },
};
