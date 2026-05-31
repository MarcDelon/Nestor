"use client";

import { useState, useEffect } from "react";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<"loading" | "fadeOut">("loading");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("fadeOut"), 2400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase === "fadeOut") {
      const timer = setTimeout(onFinish, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, onFinish]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #071A0E 0%, #0A2F1D 40%, #00673C 100%)",
        opacity: phase === "fadeOut" ? 0 : 1,
        transition: "opacity 0.6s ease-out",
        pointerEvents: phase === "fadeOut" ? "none" : "all",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          width: "340px",
          height: "340px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,148,30,0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "splashPulse 2s ease-in-out infinite",
        }}
      />

      {/* Logo */}
      <div
        style={{
          position: "relative",
          animation: "splashLogoIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          opacity: 0,
        }}
      >
        <img
          src="/images/logo-removebg-preview (2).png"
          alt="SafeTrip"
          style={{
            width: "120px",
            height: "auto",
            filter: "drop-shadow(0 8px 32px rgba(0,103,60,0.4))",
          }}
        />
      </div>

      {/* Brand name */}
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "-0.02em",
          marginTop: "20px",
          opacity: 0,
          animation: "splashTextIn 0.7s 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        Safe<span style={{ color: "#C8941E" }}>Trip</span>
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "clamp(0.8rem, 2vw, 0.95rem)",
          color: "rgba(255,255,255,0.55)",
          marginTop: "8px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0,
          animation: "splashTextIn 0.7s 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        Voyagez en toute confiance
      </p>

      {/* Loading bar */}
      <div
        style={{
          marginTop: "40px",
          width: "160px",
          height: "3px",
          borderRadius: "4px",
          background: "rgba(255,255,255,0.1)",
          overflow: "hidden",
          opacity: 0,
          animation: "splashTextIn 0.5s 0.8s ease forwards",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "4px",
            background: "linear-gradient(90deg, #C8941E, #FCD116)",
            transformOrigin: "left",
            animation: "splashBar 1.8s 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards",
            transform: "scaleX(0)",
          }}
        />
      </div>

      <style>{`
        @keyframes splashPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes splashLogoIn {
          from { opacity: 0; transform: scale(0.7) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splashTextIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashBar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
