"use client";

import { useState, useEffect, useCallback } from "react";

const ONBOARDING_KEY = "safetrip_onboarding_done";

const slides = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, color: "#C8941E" }}>
        <rect x="6" y="14" width="36" height="20" rx="6" />
        <circle cx="14" cy="38" r="4" />
        <circle cx="34" cy="38" r="4" />
        <path d="M6 22h36" />
        <path d="M18 14V8h12v6" />
      </svg>
    ),
    title: "Reservez en quelques clics",
    desc: "Comparez les agences, choisissez votre trajet et reservez vos billets de bus instantanement. Paiement securise et confirmation immediate.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, color: "#00673C" }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" transform="translate(12, 2)" />
        <circle cx="24" cy="14" r="3" />
        <path d="M8 44h32" />
        <path d="M12 44v-8h24v8" />
      </svg>
    ),
    title: "Tracabilite des colis",
    desc: "Suivez vos colis en temps reel grace a notre systeme de QR code unique. Transparence totale du depot a la livraison.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, color: "#C8941E" }}>
        <path d="M12 2L2 7v13c0 11 10 17 10 17s10-6 10-17V7z" transform="translate(12, 4) scale(1.1)" />
        <polyline points="26 18 22 22 18 18" transform="translate(2, 0)" />
      </svg>
    ),
    title: "Securite garantie",
    desc: "Toutes les agences partenaires sont verifiees. Billets authentifies par QR code, donnees protegees et support 24/7.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, color: "#00673C" }}>
        <rect x="8" y="4" width="32" height="40" rx="4" />
        <line x1="16" y1="12" x2="32" y2="12" />
        <line x1="16" y1="20" x2="28" y2="20" />
        <circle cx="24" cy="34" r="4" />
      </svg>
    ),
    title: "Location de bus",
    desc: "Besoin d'un bus pour un evenement ? Parcourez notre flotte de vehicules disponibles et faites votre demande directement en ligne.",
  },
];

export default function OnboardingDemo() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState<"next" | "prev">("next");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const finish = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (animating) return;
      setSlideDir(next > current ? "next" : "prev");
      setAnimating(true);
      setTimeout(() => {
        setCurrent(next);
        setAnimating(false);
      }, 280);
    },
    [animating, current]
  );

  const handleNext = () => {
    if (current === slides.length - 1) {
      finish();
    } else {
      goTo(current + 1);
    }
  };

  if (!visible) return null;

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(7,26,14,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "onbFadeIn 0.4s ease",
        padding: "20px",
      }}
      onClick={(e) => e.target === e.currentTarget && finish()}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(7,26,14,0.25)",
          animation: "onbCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Skip button */}
        <button
          onClick={finish}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 10,
            background: "none",
            border: "none",
            color: "#8A9B90",
            fontFamily: "var(--font-body)",
            fontSize: "0.82rem",
            fontWeight: 500,
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "8px",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#1C2B22")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8A9B90")}
        >
          Passer
        </button>

        {/* Top gradient bar */}
        <div
          style={{
            height: "4px",
            background: "linear-gradient(90deg, #00673C, #C8941E)",
          }}
        />

        {/* Content */}
        <div
          style={{
            padding: "48px 36px 32px",
            textAlign: "center",
            opacity: animating ? 0 : 1,
            transform: animating
              ? slideDir === "next"
                ? "translateX(-30px)"
                : "translateX(30px)"
              : "translateX(0)",
            transition: "opacity 0.28s ease, transform 0.28s ease",
          }}
        >
          {/* Icon circle */}
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(0,103,60,0.08), rgba(200,148,30,0.08))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
            }}
          >
            {slide.icon}
          </div>

          {/* Step indicator */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 12px",
              borderRadius: "20px",
              background: "rgba(0,103,60,0.06)",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#00673C",
              marginBottom: "16px",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.04em",
            }}
          >
            {current + 1} / {slides.length}
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
              fontWeight: 700,
              color: "#1C2B22",
              marginBottom: "12px",
              lineHeight: 1.25,
            }}
          >
            {slide.title}
          </h2>

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              color: "#5A6B61",
              lineHeight: 1.65,
              maxWidth: "340px",
              margin: "0 auto",
            }}
          >
            {slide.desc}
          </p>
        </div>

        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            paddingBottom: "20px",
          }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? "24px" : "8px",
                height: "8px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                background:
                  i === current
                    ? "linear-gradient(90deg, #00673C, #C8941E)"
                    : "#E0D9CC",
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            padding: "0 36px 36px",
          }}
        >
          {current > 0 && (
            <button
              onClick={() => goTo(current - 1)}
              style={{
                flex: "0 0 auto",
                padding: "12px 20px",
                borderRadius: "14px",
                border: "1.5px solid #E0D9CC",
                background: "transparent",
                color: "#5A6B61",
                fontFamily: "var(--font-body)",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#00673C";
                e.currentTarget.style.color = "#00673C";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E0D9CC";
                e.currentTarget.style.color = "#5A6B61";
              }}
            >
              Retour
            </button>
          )}

          <button
            onClick={handleNext}
            style={{
              flex: 1,
              padding: "12px 24px",
              borderRadius: "14px",
              border: "none",
              background: isLast
                ? "linear-gradient(135deg, #C8941E, #E09B1A)"
                : "linear-gradient(135deg, #00673C, #0A2F1D)",
              color: "#fff",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: isLast
                ? "0 4px 16px rgba(200,148,30,0.35)"
                : "0 4px 16px rgba(0,103,60,0.3)",
              transition: "all 0.25s ease",
              transform: "translateY(0)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = isLast
                ? "0 8px 24px rgba(200,148,30,0.45)"
                : "0 8px 24px rgba(0,103,60,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = isLast
                ? "0 4px 16px rgba(200,148,30,0.35)"
                : "0 4px 16px rgba(0,103,60,0.3)";
            }}
          >
            {isLast ? "Commencer" : "Suivant"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes onbFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes onbCardIn {
          from { opacity: 0; transform: scale(0.92) translateY(30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
