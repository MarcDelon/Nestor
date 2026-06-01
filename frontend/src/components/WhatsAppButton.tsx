"use client";

import { useState } from "react";

export default function WhatsAppButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href="https://wa.me/237651529402"
      target="_blank"
      rel="noreferrer"
      aria-label="Discuter sur WhatsApp"
      style={{
        position: "fixed",
        right: 18,
        bottom: 26,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "#25D366",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: hovered 
          ? "0 16px 28px rgba(37,211,102,0.55)" 
          : "0 12px 25px rgba(37,211,102,0.45)",
        zIndex: 10000,
        transition: "transform .15s ease, box-shadow .2s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26" aria-hidden="true">
        <path d="M20.52 3.48A11.77 11.77 0 0012.04 0C5.46 0 .12 5.35.12 11.94c0 2.1.55 4.09 1.52 5.82L0 24l6.4-1.67a11.86 11.86 0 005.64 1.44h.01c6.58 0 11.93-5.35 11.93-11.94 0-3.19-1.25-6.19-3.46-8.35zM12.04 21.3h-.01a9.39 9.39 0 01-4.79-1.31l-.34-.2-3.8 1 1.02-3.7-.22-.38a9.4 9.4 0 01-1.45-5.07c0-5.19 4.23-9.42 9.44-9.42 2.52 0 4.88.98 6.66 2.75a9.32 9.32 0 012.76 6.66c0 5.2-4.23 9.43-9.47 9.43zm5.37-7.05c-.29-.15-1.72-.85-1.98-.95-.26-.1-.46-.15-.66.15-.2.29-.75.95-.92 1.14-.17.2-.34.22-.63.07-.29-.15-1.23-.45-2.33-1.45a8.71 8.71 0 01-1.61-1.98c-.17-.29 0-.45.13-.6.14-.14.29-.35.44-.52.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.2-.23-.56-.47-.48-.66-.49h-.56c-.2 0-.52.07-.8.37-.29.3-1.05 1.03-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.14 3.27 5.19 4.58.73.32 1.3.5 1.75.64.73.23 1.38.2 1.9.12.58-.09 1.72-.7 1.96-1.37.24-.67.24-1.24.17-1.37-.07-.12-.26-.2-.55-.35z" />
      </svg>
    </a>
  );
}
