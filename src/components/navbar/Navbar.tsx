"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "About Us", href: "https://fint.vn/vi/ve-chung-toi" },
  { label: "Login", href: "/login" },
  { label: "Register", href: "/register/recruiter" },
  // { label: "Admin", href: "/admin" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <Link href="https://fint.vn/vi" style={styles.logo}>
          FINT VietNam
        </Link>

        <div style={styles.links}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;

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
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    width: "100%",
    position: "absolute",
    top: 0,
    zIndex: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.6)",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    backgroundColor: "transparent",
  },
  logo: {
    color: "#333333",
    fontSize: "22px",
    fontWeight: 700,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
  },
  link: {
    color: "#333333",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: 500,
    padding: "8px 12px",
    borderRadius: "8px",
    transition: "0.2s ease",
  },
  activeLink: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
  },
};
