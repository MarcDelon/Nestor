"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import type { IconName } from "@/components/Icons";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useUser } from "@/components/UserContext";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://$($window.location.hostname):5000` : 'https://safe-trip-backend.vercel.app'));

interface ColisItem {
  id: string;
  label: string;
  type: string;
  weight?: number;
  color?: string;
  status: string;
  trip: string;
  tripDate?: string;
  qr_ref?: string;
  qrRef?: string;
  fragile?: boolean;
  senderName?: string;
  sender_name?: string;
  receiverName?: string;
  receiver_name?: string;
  agencyName?: string;
  agency?: string;
  createdAt?: string;
}

const STATUS_STEP_KEYS: { key: string; tKey: string; icon: IconName }[] = [
  { key: "En attente de scan", tKey: "step_register", icon: "clipboard" },
  { key: "Scanné en gare",    tKey: "step_scan",      icon: "scan" },
  { key: "À bord du bus",     tKey: "step_onboard",   icon: "bus" },
  { key: "En transit",        tKey: "step_scan",      icon: "route" },
  { key: "Livré",             tKey: "step_delivery",  icon: "check-circle" },
];

function getStepIndex(status: string): number {
  const idx = STATUS_STEP_KEYS.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function TracabilitePage() {
  const t = useTranslations("Tracabilite");
  const tc = useTranslations("Common");
  const STATUS_STEPS = STATUS_STEP_KEYS.map(s => ({ ...s, label: t(s.tKey as Parameters<typeof t>[0]) }));
  const [searchRef, setSearchRef] = useState("");
  const [result, setResult] = useState<ColisItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [recentColis, setRecentColis] = useState<ColisItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user } = useUser();
  const isLoggedIn = !!user;
  const userRole = user?.role || null;

  useEffect(() => {
    // Load recent colis from sessionStorage
    try {
      const stored = JSON.parse(sessionStorage.getItem("safetrip_colis_db") || "[]");
      setRecentColis(stored.slice(0, 3));
    } catch { /* ignore */ }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchRef.trim();
    if (!q) return;

    setSearching(true);
    setResult(null);
    setNotFound(false);

    // 1. Search sessionStorage first (fast)
    try {
      const stored: ColisItem[] = JSON.parse(sessionStorage.getItem("safetrip_colis_db") || "[]");
      const local = stored.find(c =>
        c.id?.toLowerCase().includes(q.toLowerCase()) ||
        (c.qr_ref || c.qrRef || "").toLowerCase().includes(q.toLowerCase()) ||
        c.label?.toLowerCase().includes(q.toLowerCase())
      );
      if (local) { setResult(local); setSearching(false); return; }
    } catch { /* ignore */ }

    // 2. Fallback to API
    try {
      const res = await fetch(`${API_BASE}/api/client/colis`, {
        credentials: "include",
      });
      if (res.ok) {
        const data: ColisItem[] = await res.json();
        const found = data.find(c =>
          c.id?.toLowerCase().includes(q.toLowerCase()) ||
          (c.qr_ref || c.qrRef || "").toLowerCase().includes(q.toLowerCase()) ||
          c.label?.toLowerCase().includes(q.toLowerCase())
        );
        if (found) {
          setResult(found);
          setSearching(false);
          // Save found colis to recent colis in sessionStorage
          try {
            const stored: ColisItem[] = JSON.parse(sessionStorage.getItem("safetrip_colis_db") || "[]");
            if (!stored.some(c => c.id === found.id)) {
              const updated = [found, ...stored].slice(0, 5);
              sessionStorage.setItem("safetrip_colis_db", JSON.stringify(updated));
              setRecentColis(updated.slice(0, 3));
            }
          } catch { /* ignore */ }
          return;
        }
      }
    } catch { /* ignore */ }

    setNotFound(true);
    setSearching(false);
  };

  const stepIdx = result ? getStepIndex(result.status) : -1;
  const qrRef = result ? (result.qr_ref || result.qrRef || result.id || "ST-???") : "";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#F7F4EE 0%,#EDE9DF 100%)", fontFamily: "var(--font-body,'DM Sans',sans-serif)" }}>

      {/* ── HEADER ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(247,244,238,0.93)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(230,225,214,0.7)", padding: "14px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/"><img src="/images/logo-removebg-preview (2).png" alt="SafeTrip" style={{ height: 44, objectFit: "contain" }} /></Link>

          {/* Desktop nav */}
          <nav style={{ display: "flex", gap: 28, alignItems: "center" }} className="desktop-nav">
            <Link href="/reserver" style={{ fontWeight: 650, color: "#1C2B22", fontSize: "0.92rem", textDecoration: "none" }}>{tc("reserve")}</Link>
            <Link href="/agences" style={{ fontWeight: 650, color: "#1C2B22", fontSize: "0.92rem", textDecoration: "none" }}>{tc("agencies")}</Link>
            <Link href="/tracabilite" style={{ fontWeight: 800, color: "#00673C", fontSize: "0.92rem", textDecoration: "none" }}>{tc("traceability")}</Link>
            <Link href="/location" style={{ fontWeight: 650, color: "#1C2B22", fontSize: "0.92rem", textDecoration: "none" }}>{tc("rental")}</Link>
            {isLoggedIn && userRole === "client" && <Link href="/client/dashboard" style={{ fontWeight: 650, color: "#C8941E", fontSize: "0.92rem", textDecoration: "none" }}>{tc("travelerSpace")}</Link>}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LanguageToggle />
            <Link href="/login" style={{ background: "#00673C", color: "#fff", fontWeight: 700, fontSize: "0.88rem", padding: "9px 22px", borderRadius: 30, textDecoration: "none" }}>
              {isLoggedIn ? tc("myAccount") : tc("login")}
            </Link>
            {/* Hamburger */}
            <button onClick={() => setMobileMenuOpen(o => !o)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 6 }} className="hamburger-btn" aria-label="Menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0A2F1D" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div style={{ background: "#fff", borderTop: "1px solid #E6E1D6", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <Link href="/reserver" style={{ fontWeight: 700, color: "#0A2F1D", textDecoration: "none", fontSize: "0.95rem" }} onClick={() => setMobileMenuOpen(false)}>{tc("reserve")}</Link>
            <Link href="/agences" style={{ fontWeight: 700, color: "#0A2F1D", textDecoration: "none", fontSize: "0.95rem" }} onClick={() => setMobileMenuOpen(false)}>{tc("agencies")}</Link>
            <Link href="/tracabilite" style={{ fontWeight: 700, color: "#00673C", textDecoration: "none", fontSize: "0.95rem" }} onClick={() => setMobileMenuOpen(false)}>{tc("traceability")}</Link>
            <Link href="/location" style={{ fontWeight: 700, color: "#0A2F1D", textDecoration: "none", fontSize: "0.95rem" }} onClick={() => setMobileMenuOpen(false)}>{tc("rental")}</Link>
            {isLoggedIn && <Link href="/client/dashboard" style={{ fontWeight: 700, color: "#C8941E", textDecoration: "none", fontSize: "0.95rem" }} onClick={() => setMobileMenuOpen(false)}>{tc("travelerSpace")}</Link>}
          </div>
        )}
      </header>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; align-items: center; }
          .tracab-section-pad { padding-left: 14px !important; padding-right: 14px !important; }
          .tracab-search-form { padding: 20px 18px !important; }
          .tracab-result-header { padding: 16px 18px !important; }
          .tracab-result-details { padding: 18px 18px !important; }
          .tracab-stepper-labels { display: none !important; }
        }
        @media (max-width: 480px) {
          .tracab-hero { padding-top: 36px !important; padding-bottom: 24px !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="tracab-hero tracab-section-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "52px 24px 36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ background: "linear-gradient(90deg,#FCD116,#CE1126,#007A5E)", height: 3, width: 40, borderRadius: 99, display: "inline-block" }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#718096", textTransform: "uppercase", letterSpacing: 2 }}>{t("realTimeTracking")}</span>
        </div>
        <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 900, color: "#0A2F1D", margin: "0 0 12px 0", lineHeight: 1.15 }}>
          {t("title")}
        </h1>
        <p style={{ color: "#718096", fontSize: "1rem", maxWidth: 520, lineHeight: 1.6, margin: 0 }}>
          {t("desc")}
        </p>
      </section>

      {/* ── SEARCH BOX ── */}
      <section className="tracab-section-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 48px" }}>
        <form onSubmit={handleSearch} className="tracab-search-form" style={{ background: "#fff", borderRadius: 20, border: "1px solid #E6E1D6", boxShadow: "0 8px 32px rgba(7,26,14,0.08)", padding: "28px 32px", marginBottom: 36 }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "#4a5568", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 10 }}>
            {t("searchLabel")}
          </label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              value={searchRef}
              onChange={e => setSearchRef(e.target.value)}
              placeholder={t("searchPlaceholder")}
              style={{ flex: "1 1 260px", background: "#f7fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", fontSize: "0.95rem", outline: "none", fontFamily: "inherit", color: "#2d3748", minWidth: 0 }}
            />
            <button type="submit" disabled={searching || !searchRef.trim()} style={{ background: searching ? "#a0aec0" : "#0A2F1D", color: "#FCD116", fontWeight: 800, fontSize: "0.92rem", padding: "12px 28px", borderRadius: 12, border: "none", cursor: searching ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
              {searching ? (
                <><div style={{ width: 16, height: 16, border: "2px solid rgba(252,209,22,0.3)", borderTopColor: "#FCD116", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> {t("searching")}</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> {t("trackBtn")}</>
              )}
            </button>
          </div>
        </form>

        {/* Not found */}
        {notFound && (
          <div style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 16, padding: "24px 28px", marginBottom: 36, display: "flex", alignItems: "flex-start", gap: 16 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c53030" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <div>
              <p style={{ fontWeight: 800, color: "#c53030", margin: "0 0 4px 0" }}>{t("notFound")}</p>
              <p style={{ color: "#718096", fontSize: "0.85rem", margin: 0 }}>{t("notFoundDesc")} &laquo;&nbsp;<strong>{searchRef}</strong>&nbsp;&raquo;. {t("notFoundSuffix")}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E6E1D6", boxShadow: "0 12px 40px rgba(7,26,14,0.10)", overflow: "hidden", marginBottom: 36 }}>
            {/* Result header */}
            <div className="tracab-result-header" style={{ background: "linear-gradient(135deg,#0A2F1D,#1a5c38)", padding: "22px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon
                    name={result.fragile ? "alert" : result.type === "Valise" ? "luggage" : result.type === "Carton" ? "package" : "package"}
                    size={26} color={result.fragile ? "#F59E0B" : "rgba(255,255,255,0.85)"}
                  />
                </div>
                <div>
                  <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>{t("parcelIdentified")}</p>
                  <h3 style={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>{result.label}</h3>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", margin: 0 }}>{t("ref")} : {qrRef}</p>
                </div>
              </div>
              <span style={{ background: stepIdx >= 4 ? "rgba(74,222,128,0.15)" : "rgba(252,209,22,0.15)", border: `1px solid ${stepIdx >= 4 ? "rgba(74,222,128,0.3)" : "rgba(252,209,22,0.3)"}`, color: stepIdx >= 4 ? "#4ade80" : "#FCD116", fontSize: "0.72rem", fontWeight: 800, padding: "5px 14px", borderRadius: 99, textTransform: "uppercase" }}>
                {result.status}
              </span>
            </div>

            {/* Progress stepper */}
            <div style={{ padding: "28px 28px 20px", borderBottom: "1px solid #edf2f7" }}>
              <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                {STATUS_STEPS.map((step, idx) => {
                  const done = idx < stepIdx;
                  const current = idx === stepIdx;
                  return (
                    <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                      {/* Connector line */}
                      {idx > 0 && (
                        <div style={{ position: "absolute", left: "-50%", top: 15, width: "100%", height: 3, background: done || current ? "#00673C" : "#edf2f7", transition: "background 0.4s ease", zIndex: 0 }} />
                      )}
                      {/* Dot */}
                      <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#00673C" : current ? "#0A2F1D" : "#f7fafc", border: `2px solid ${done ? "#00673C" : current ? "#C8941E" : "#e2e8f0"}`, boxShadow: current ? "0 0 0 4px rgba(200,148,30,0.15)" : "none", zIndex: 1, position: "relative", transition: "all 0.3s ease" }}>
                        {done
                          ? <Icon name="check" size={14} color="#fff" strokeWidth={3} />
                          : <Icon name={step.icon} size={14} color={current ? "#FCD116" : "#a0aec0"} strokeWidth={2} />}
                      </div>
                      <p style={{ fontSize: "0.6rem", fontWeight: 700, color: done || current ? "#0A2F1D" : "#a0aec0", marginTop: 6, textAlign: "center", lineHeight: 1.3, maxWidth: 60 }}>{step.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details grid */}
            <div className="tracab-result-details" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 18, padding: "24px 28px" }}>
              {[
                { label: t("detailRoute"), value: result.trip },
                { label: t("detailType"), value: result.type },
                { label: t("detailWeight"), value: result.weight ? `${result.weight} kg` : "—" },
                { label: t("detailColor"), value: result.color || "—" },
                { label: t("detailSender"), value: result.senderName || result.sender_name || "—" },
                { label: t("detailReceiver"), value: result.receiverName || result.receiver_name || "—" },
                { label: t("detailAgency"), value: result.agencyName || result.agency || "SafeTrip" },
                { label: t("detailFragile"), value: result.fragile ? t("fragileYes") : t("fragileNo") },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: "0.62rem", color: "#a0aec0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
                  <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1a202c" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HOW IT WORKS ── */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2F1D", marginBottom: 20 }}>{t("howItWorks")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 18 }}>
            {([
              { icon: "clipboard" as IconName, title: t("step_register"), desc: t("step_registerDesc") },
              { icon: "scan"      as IconName, title: t("step_scan"),     desc: t("step_scanDesc") },
              { icon: "bus"       as IconName, title: t("step_onboard"),  desc: t("step_onboardDesc") },
              { icon: "check-circle" as IconName, title: t("step_delivery"), desc: t("step_deliveryDesc") },
            ] as { icon: IconName; title: string; desc: string }[]).map(item => (
              <div key={item.title} style={{ background: "#fff", borderRadius: 16, padding: "22px 20px", border: "1px solid #E6E1D6", boxShadow: "0 4px 16px rgba(7,26,14,0.05)" }}>
                <div style={{ marginBottom: 14 }}>
                  <Icon name={item.icon} size={32} color="#00673C" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0A2F1D", marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: "0.82rem", color: "#718096", lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RECENT COLIS (if logged in & has local data) ── */}
        {recentColis.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0A2F1D", marginBottom: 16 }}>{t("recentParcels")}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentColis.map(c => (
                <div key={c.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #E6E1D6", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", cursor: "pointer", transition: "box-shadow 0.2s ease" }}
                  onClick={() => { setSearchRef(c.qr_ref || c.qrRef || c.id); setResult(c); setNotFound(false); }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 24px rgba(0,103,60,0.08)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ display:"flex", alignItems:"center" }}>
                      <Icon name={c.type === "Valise" ? "luggage" : "package"} size={24} color="#718096" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, color: "#0A2F1D", margin: 0, fontSize: "0.92rem" }}>{c.label}</p>
                      <p style={{ color: "#718096", fontSize: "0.75rem", margin: 0 }}>{c.trip}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: c.status === "Livré" ? "#eef8f3" : "#fffbeb", color: c.status === "Livré" ? "#276749" : "#92400e" }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ background: "#0A2F1D", color: "rgba(255,255,255,0.6)", textAlign: "center", padding: "28px 24px", fontSize: "0.82rem" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#FCD116,#CE1126,#007A5E)", marginBottom: 18, borderRadius: 99 }} />
        <p style={{ margin: "0 0 6px 0", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{t("footerTitle")}</p>
        <p style={{ margin: 0 }}>{t("footerCopyright")}</p>
      </footer>
    </div>
  );
}
