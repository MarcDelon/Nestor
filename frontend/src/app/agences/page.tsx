"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { openSmartsuppWithMessage } from "@/components/SmartsuppChat";
import { Icon } from "@/components/Icons";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useUser } from "@/components/UserContext";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://${window.location.hostname}:5000` : 'https://safe-trip-backend.vercel.app'));

interface Agency {
  id: number;
  name: string;
  logo: string;
  certification: string;
  phone?: string;
  address?: string;
  description?: string;
}

const FALLBACK_AGENCIES: Agency[] = [
  { id: 1, name: "Finexs Voyage", logo: "/images/finexs.png", certification: "Partenaire Platine", phone: "+237 699 90 90 90", address: "Douala – Rue Akwa", description: "Pionnier du transport VIP interurbain sécurisé au Cameroun. Voyages quotidiens Douala–Yaoundé." },
  { id: 2, name: "Buca Voyage", logo: "/images/bucavoyage.png", certification: "Partenaire Or", phone: "+237 677 80 80 80", address: "Douala – Bessengue", description: "Agence confort et classique au service de la population camerounaise." },
  { id: 3, name: "General Express", logo: "/images/General.png", certification: "Partenaire Certifié", phone: "+237 655 70 70 70", address: "Douala – Bessengue", description: "Transport interurbain accessible et fiable pour tous les camerounais." },
  { id: 4, name: "Touristique Express", logo: "/images/Touristique.png", certification: "Partenaire National", phone: "+237 691 60 60 60", address: "Douala – Akwa", description: "Leader du transport VIP touristique. Destinations : Kribi, Limbé, Bamenda." },
  { id: 5, name: "Men Travel", logo: "/images/mentravel.png", certification: "Partenaire Premium", phone: "+237 670 50 50 50", address: "Douala – Carrefour Akwa", description: "Transport Executive Class haut de gamme avec restauration à bord." },
];

const CERT_COLORS: Record<string, { bg: string; color: string }> = {
  "Partenaire Platine": { bg: "#f0f4ff", color: "#3730a3" },
  "Partenaire Or":      { bg: "#fffbeb", color: "#92400e" },
  "Partenaire Certifié":{ bg: "#f0fdf4", color: "#166534" },
  "Partenaire National":{ bg: "#fff7ed", color: "#9a3412" },
  "Partenaire Premium": { bg: "#fdf4ff", color: "#7e22ce" },
};

interface RequestForm {
  // Expéditeur
  collectionMode: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  pickupAddress: string;
  originCity: string;
  // Destinataire
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  destinationCity: string;
  // Colis
  parcelType: string;
  parcelWeight: string;
  parcelValue: string;
  parcelFragile: boolean;
  parcelContent: string;
  // Logistique
  preferredDate: string;
  instructions: string;
}

const EMPTY_FORM: RequestForm = {
  collectionMode: "domicile",
  senderName: "",
  senderPhone: "",
  senderEmail: "",
  pickupAddress: "",
  originCity: "",
  recipientName: "",
  recipientPhone: "",
  deliveryAddress: "",
  destinationCity: "",
  parcelType: "small",
  parcelWeight: "",
  parcelValue: "",
  parcelFragile: false,
  parcelContent: "",
  preferredDate: "",
  instructions: "",
};

export default function AgencesPage() {
  const t = useTranslations("Agences");
  const tc = useTranslations("Common");
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAgency, setModalAgency] = useState<Agency | null>(null);
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useUser();
  const isLoggedIn = !!user;
  const userRole = user?.role || null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Pre-fill sender info from profile if logged in
    if (user) {
      setForm(f => ({
        ...f,
        senderName: user.fullName || "",
        senderEmail: user.email || "",
        senderPhone: ""
      }));
    }

    fetch(`${API_BASE}/api/agency/agencies`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setAgencies(Array.isArray(data) && data.length > 0 ? data : FALLBACK_AGENCIES);
        setLoading(false);
      })
      .catch(() => { setAgencies(FALLBACK_AGENCIES); setLoading(false); });
  }, [user]);

  const openModal = (agency: Agency) => {
    setModalAgency(agency);
    setSubmitted(false);
    setForm(f => ({ ...EMPTY_FORM, senderName: f.senderName, senderEmail: f.senderEmail, senderPhone: f.senderPhone }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.senderName.trim() ||
      !form.senderPhone.trim() ||
      (form.collectionMode === "domicile" && !form.pickupAddress.trim()) ||
      !form.originCity.trim() ||
      !form.recipientName.trim() ||
      !form.recipientPhone.trim() ||
      !form.deliveryAddress.trim() ||
      !form.destinationCity.trim() ||
      !form.parcelContent.trim()
    ) return;
    setSubmitting(true);

    const typeLabels: Record<string, string> = {
      document: "Document / enveloppe",
      small: "Petit colis (< 5 kg)",
      medium: "Colis moyen (5-20 kg)",
      large: "Gros colis (> 20 kg)",
      fragile: "Objet fragile",
      other: "Autre",
    };

    const msg = [
      `📦 NOUVELLE DEMANDE D'ENVOI DE COLIS`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Agence : ${modalAgency?.name}`,
      ``,
      `📤 EXPÉDITEUR`,
      `  Nom : ${form.senderName}`,
      `  Téléphone : ${form.senderPhone}`,
      form.senderEmail ? `  Email : ${form.senderEmail}` : "",
      `  Mode de dépôt : ${form.collectionMode === "domicile" ? "Collecte à domicile" : "Dépôt en agence"}`,
      form.collectionMode === "domicile" ? `  Adresse d'enlèvement : ${form.pickupAddress}` : "",
      `  Ville : ${form.originCity}`,
      ``,
      `� DESTINATAIRE`,
      `  Nom : ${form.recipientName}`,
      `  Téléphone : ${form.recipientPhone}`,
      `  Adresse de livraison : ${form.deliveryAddress}`,
      `  Ville : ${form.destinationCity}`,
      ``,
      `📦 COLIS`,
      `  Type : ${typeLabels[form.parcelType] || form.parcelType}`,
      form.parcelWeight ? `  Poids estimé : ${form.parcelWeight} kg` : "",
      form.parcelValue ? `  Valeur déclarée : ${form.parcelValue} FCFA` : "",
      form.parcelFragile ? `  ⚠️ Fragile : OUI` : "",
      `  Contenu : ${form.parcelContent}`,
      ``,
      form.preferredDate ? `📅 Date d'enlèvement : ${form.preferredDate}` : "",
      form.instructions ? `📝 Instructions : ${form.instructions}` : "",
    ].filter(Boolean).join("\n");

    // Save to sessionStorage as fallback
    try {
      const reqs = JSON.parse(sessionStorage.getItem("safetrip_service_requests") || "[]");
      reqs.unshift({
        id: Date.now(),
        agencyName: modalAgency?.name,
        kind: "envoi_colis",
        ...form,
        createdAt: new Date().toLocaleDateString("fr-FR"),
        status: "nouveau",
      });
      sessionStorage.setItem("safetrip_service_requests", JSON.stringify(reqs));
    } catch { /* ignore */ }

    // Persist into the colis table so it appears in:
    //   - the agency dashboard "Colis et courrier" tab
    //   - the client dashboard "Colis" tab (if logged in)
    const clientId = user?.id || null;
    const payload = {
      agency_name: modalAgency?.name,
      client_id: clientId,
      sender_name: form.senderName,
      sender_phone: form.senderPhone,
      sender_email: form.senderEmail,
      pickup_address: form.collectionMode === "domicile" ? form.pickupAddress : "Dépôt en agence",
      origin_city: form.originCity,
      recipient_name: form.recipientName,
      recipient_phone: form.recipientPhone,
      delivery_address: form.deliveryAddress,
      destination_city: form.destinationCity,
      parcel_type: form.parcelType,
      parcel_weight: form.parcelWeight,
      parcel_value: form.parcelValue,
      parcel_fragile: form.parcelFragile,
      parcel_content: form.parcelContent,
      preferred_date: form.preferredDate,
      instructions: form.instructions,
    };

    fetch(`${API_BASE}/api/client/colis-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .catch(err => console.warn("⚠️ Colis request API non joignable:", err))
      .finally(() => {
        // Open Smartsupp with the pre-filled message regardless of API result
        openSmartsuppWithMessage(msg, form.senderName, form.senderEmail || undefined);
        setSubmitting(false);
        setSubmitted(true);
      });
  };

  const certStyle = (cert: string) => CERT_COLORS[cert] || { bg: "#f7fafc", color: "#4a5568" };

  const inputStyle: React.CSSProperties = { background: "#f7fafc", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: "0.88rem", outline: "none", fontFamily: "inherit", color: "#2d3748" };
  const labelStyle: React.CSSProperties = { fontSize: "0.72rem", fontWeight: 700, color: "#4a5568", textTransform: "uppercase", letterSpacing: 0.5 };
  const fieldWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 };
  const sectionTitleStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem", fontWeight: 800, color: "#0A2F1D", margin: "4px 0 14px", paddingBottom: 8, borderBottom: "2px solid #eef8f3" };
  const sectionBadge: React.CSSProperties = { width: 22, height: 22, background: "#00673C", color: "#FCD116", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800 };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #F7F4EE 0%, #EDE9DF 100%)", fontFamily: "var(--font-body, 'DM Sans', sans-serif)" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .agences-nav { display: flex; gap: 28px; align-items: center; }
        .agences-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 6px; color: #1C2B22; }
        .agences-header-btn { }
        .agences-mobile-menu { display: none; flex-direction: column; background: #fff; border-top: 1px solid rgba(230,225,214,0.7); }
        .agences-mobile-menu.open { display: flex; }
        .agences-mobile-menu a { display: block; padding: 14px 24px; font-weight: 700; font-size: 1rem; color: #1C2B22; text-decoration: none; border-bottom: 1px solid #f7fafc; }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .agency-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
        @media (max-width: 767px) {
          .agences-nav { display: none !important; }
          .agences-hamburger { display: flex !important; align-items: center; }
          .agences-header-btn { display: none; }
          .form-grid-2 { grid-template-columns: 1fr !important; }
          .agency-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .agency-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(247,244,238,0.93)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(230,225,214,0.7)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/">
            <img src="/images/logo-removebg-preview (2).png" alt="SafeTrip" style={{ height: 44, objectFit: "contain" }} />
          </Link>
          <nav className="agences-nav">
            <Link href="/reserver" style={{ fontWeight: 650, color: "#1C2B22", fontSize: "0.92rem", textDecoration: "none" }}>{tc("reserve")}</Link>
            <Link href="/agences" style={{ fontWeight: 800, color: "#00673C", fontSize: "0.92rem", textDecoration: "none" }}>{tc("agencies")}</Link>
            <Link href="/tracabilite" style={{ fontWeight: 650, color: "#1C2B22", fontSize: "0.92rem", textDecoration: "none" }}>{tc("traceability")}</Link>
            <Link href="/location" style={{ fontWeight: 650, color: "#1C2B22", fontSize: "0.92rem", textDecoration: "none" }}>{tc("rental")}</Link>
            {isLoggedIn && userRole === "client" && <Link href="/client/dashboard" style={{ fontWeight: 650, color: "#C8941E", fontSize: "0.92rem", textDecoration: "none" }}>{tc("travelerSpace")}</Link>}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LanguageToggle />
            <Link href="/login" className="agences-header-btn" style={{ background: "#00673C", color: "#fff", fontWeight: 700, fontSize: "0.88rem", padding: "9px 22px", borderRadius: 30, textDecoration: "none" }}>
              {isLoggedIn ? tc("myAccount") : tc("login")}
            </Link>
            <button className="agences-hamburger" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {mobileMenuOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        <div className={`agences-mobile-menu${mobileMenuOpen ? " open" : ""}`}>
          <Link href="/reserver" onClick={() => setMobileMenuOpen(false)}>{tc("reserve")}</Link>
          <Link href="/agences" onClick={() => setMobileMenuOpen(false)} style={{ color: "#00673C" }}>{tc("agencies")}</Link>
          <Link href="/tracabilite" onClick={() => setMobileMenuOpen(false)}>{tc("traceability")}</Link>
          <Link href="/location" onClick={() => setMobileMenuOpen(false)}>{tc("rental")}</Link>
          {isLoggedIn && <Link href="/client/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: "#C8941E" }}>{tc("travelerSpace")}</Link>}
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ background: "#00673C", color: "#fff", margin: "8px 16px", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
            {isLoggedIn ? tc("myAccount") : tc("login")}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ background: "linear-gradient(90deg,#FCD116,#CE1126,#007A5E)", height: 3, width: 40, borderRadius: 99, display: "inline-block" }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#718096", textTransform: "uppercase", letterSpacing: 2 }}>{t("partnerNetwork")}</span>
        </div>
        <h1 style={{ fontSize: "2.4rem", fontWeight: 900, color: "#0A2F1D", margin: "0 0 12px 0", lineHeight: 1.15 }}>
          {t("title")}
        </h1>
        <p style={{ color: "#718096", fontSize: "1.05rem", maxWidth: 560, lineHeight: 1.6, margin: "0 0 8px 0" }}>
          {t("desc")} <strong style={{ color: "#00673C" }}>{t("noDisplacementBtn")}</strong>.
        </p>
      </section>

      {/* Agency grid */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #eef8f3", borderTopColor: "#00673C", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#718096", fontWeight: 600 }}>{t("loadingAgencies")}</p>
          </div>
        ) : (
          <div className="agency-grid">
            {agencies.map(agency => {
              const cs = certStyle(agency.certification);
              return (
                <div key={agency.id} style={{ background: "#ffffff", borderRadius: 20, border: "1px solid #E6E1D6", boxShadow: "0 8px 28px rgba(7,26,14,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 18px 48px rgba(7,26,14,0.12)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(7,26,14,0.06)"; }}
                >
                  {/* Card top stripe — Cameroonian flag colors */}
                  <div style={{ height: 4, background: "linear-gradient(90deg,#FCD116 0%,#CE1126 50%,#007A5E 100%)" }} />

                  <div style={{ padding: "22px 24px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                      <div style={{ width: 64, height: 64, background: "#f7fafc", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: 10, border: "1px solid #edf2f7", flexShrink: 0 }}>
                        <img src={agency.logo} alt={agency.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0A2F1D", margin: "0 0 4px 0" }}>{agency.name}</h2>
                        <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: cs.bg, color: cs.color }}>
                          {agency.certification}
                        </span>
                      </div>
                    </div>

                    {agency.description && (
                      <p style={{ fontSize: "0.85rem", color: "#718096", lineHeight: 1.55, margin: "0 0 14px 0" }}>{agency.description}</p>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.8rem", color: "#4a5568", marginBottom: 20 }}>
                      {agency.phone && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.21 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          <span style={{ fontWeight: 600 }}>{agency.phone}</span>
                        </div>
                      )}
                      {agency.address && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span>{agency.address}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <Link href="/reserver" style={{ flex: 1, textAlign: "center", background: "#eef8f3", color: "#00673C", fontWeight: 700, fontSize: "0.82rem", padding: "9px 14px", borderRadius: 10, textDecoration: "none", border: "1px solid rgba(0,103,60,0.15)", transition: "all 0.2s ease" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#00673C"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#eef8f3"; (e.currentTarget as HTMLAnchorElement).style.color = "#00673C"; }}
                      >
                        {t("seeTrips")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => openModal(agency)}
                        style={{ flex: 1, background: "#0A2F1D", color: "#FCD116", fontWeight: 700, fontSize: "0.82rem", padding: "9px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s ease" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#C8941E"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#0A2F1D"; (e.currentTarget as HTMLButtonElement).style.color = "#FCD116"; }}
                      >
                        <Icon name="package" size={14} /> {t("noDisplacementBtn")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Request Modal */}
      {modalAgency && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setModalAgency(null)}
        >
          <div
            style={{ background: "#ffffff", borderRadius: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.25)", animation: "slideUp 0.3s cubic-bezier(0.16,1,0.3,1)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ background: "linear-gradient(135deg,#0A2F1D,#1a5c38)", padding: "22px 28px", borderRadius: "24px 24px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.12)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", padding: 8, border: "1px solid rgba(255,255,255,0.15)" }}>
                  <img src={modalAgency.logo} alt={modalAgency.name} style={{ maxWidth: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>{t("requestModal_title")}</p>
                  <h3 style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>{modalAgency.name}</h3>
                </div>
              </div>
              <button onClick={() => setModalAgency(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", width: 34, height: 34, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="x" size={18} />
              </button>
            </div>

            {submitted ? (
              <div style={{ padding: "48px 32px", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, background: "#eef8f3", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0A2F1D", marginBottom: 8 }}>{t("successTitle")}</h3>
                <p style={{ color: "#718096", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 24 }}>
                  {t("successDesc")}
                </p>
                <button onClick={() => setModalAgency(null)} style={{ background: "#00673C", color: "#fff", border: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem" }}>
                  {tc("close")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding: "28px" }}>
                <p style={{ color: "#718096", fontSize: "0.85rem", lineHeight: 1.5, marginTop: 0, marginBottom: 20 }}>
                  {t("requestModal_desc")}
                </p>

                {/* === EXPÉDITEUR === */}
                <div style={sectionTitleStyle}><span style={sectionBadge}>1</span> {t("senderSection")}</div>
                <div className="form-grid-2">
                  <div style={{ ...fieldWrap, marginBottom: 0 }}>
                    <label style={labelStyle}>{t("yourName")}</label>
                    <input required value={form.senderName} onChange={e => setForm(f => ({ ...f, senderName: e.target.value }))} placeholder="Jean Dupont" style={inputStyle} />
                  </div>
                  <div style={{ ...fieldWrap, marginBottom: 0 }}>
                    <label style={labelStyle}>{t("phone")}</label>
                    <input required value={form.senderPhone} onChange={e => setForm(f => ({ ...f, senderPhone: e.target.value }))} placeholder="+237 6XX XX XX XX" style={inputStyle} />
                  </div>
                </div>
                <div style={{ ...fieldWrap, marginTop: 14 }}>
                  <label style={labelStyle}>{t("email")}</label>
                  <input type="email" value={form.senderEmail} onChange={e => setForm(f => ({ ...f, senderEmail: e.target.value }))} placeholder="vous@exemple.cm" style={inputStyle} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Mode de dépôt / collecte *</label>
                  <select value={form.collectionMode} onChange={e => setForm(f => ({ ...f, collectionMode: e.target.value }))} style={inputStyle}>
                    <option value="domicile">Collecte à domicile (on vient chercher le colis)</option>
                    <option value="agence">Dépôt en agence (vous l'apportez à l'agence)</option>
                  </select>
                </div>
                
                {form.collectionMode === "domicile" && (
                  <div style={fieldWrap}>
                    <label style={labelStyle}>{t("pickupAddress")}</label>
                    <input required value={form.pickupAddress} onChange={e => setForm(f => ({ ...f, pickupAddress: e.target.value }))} placeholder={t("pickupAddressPlaceholder")} style={inputStyle} />
                  </div>
                )}
                <div style={{ ...fieldWrap, marginBottom: 22 }}>
                  <label style={labelStyle}>{t("originCity")}</label>
                  <input required value={form.originCity} onChange={e => setForm(f => ({ ...f, originCity: e.target.value }))} placeholder="Douala" style={inputStyle} />
                </div>

                {/* === DESTINATAIRE === */}
                <div style={sectionTitleStyle}><span style={sectionBadge}>2</span> {t("recipientSection")}</div>
                <div className="form-grid-2">
                  <div style={{ ...fieldWrap, marginBottom: 0 }}>
                    <label style={labelStyle}>{t("recipientName")}</label>
                    <input required value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} placeholder="Marie Kamga" style={inputStyle} />
                  </div>
                  <div style={{ ...fieldWrap, marginBottom: 0 }}>
                    <label style={labelStyle}>{t("recipientPhone")}</label>
                    <input required value={form.recipientPhone} onChange={e => setForm(f => ({ ...f, recipientPhone: e.target.value }))} placeholder="+237 6XX XX XX XX" style={inputStyle} />
                  </div>
                </div>
                <div style={{ ...fieldWrap, marginTop: 14 }}>
                  <label style={labelStyle}>{t("deliveryAddress")}</label>
                  <input required value={form.deliveryAddress} onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))} placeholder={t("deliveryAddressPlaceholder")} style={inputStyle} />
                </div>
                <div style={{ ...fieldWrap, marginBottom: 22 }}>
                  <label style={labelStyle}>{t("destCity")}</label>
                  <input required value={form.destinationCity} onChange={e => setForm(f => ({ ...f, destinationCity: e.target.value }))} placeholder="Yaoundé" style={inputStyle} />
                </div>

                {/* === COLIS === */}
                <div style={sectionTitleStyle}><span style={sectionBadge}>3</span> {t("parcelSection")}</div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>{t("parcelType")}</label>
                  <select value={form.parcelType} onChange={e => setForm(f => ({ ...f, parcelType: e.target.value }))} style={inputStyle}>
                    <option value="document">{t("parcel_document")}</option>
                    <option value="small">{t("parcel_small")}</option>
                    <option value="medium">{t("parcel_medium")}</option>
                    <option value="large">{t("parcel_large")}</option>
                    <option value="fragile">{t("parcel_fragile")}</option>
                    <option value="other">{t("parcel_other")}</option>
                  </select>
                </div>
                <div className="form-grid-2">
                  <div style={{ ...fieldWrap, marginBottom: 0 }}>
                    <label style={labelStyle}>{t("parcelWeight")}</label>
                    <input type="number" min="0" step="0.1" value={form.parcelWeight} onChange={e => setForm(f => ({ ...f, parcelWeight: e.target.value }))} placeholder="2.5" style={inputStyle} />
                  </div>
                  <div style={{ ...fieldWrap, marginBottom: 0 }}>
                    <label style={labelStyle}>{t("parcelValue")}</label>
                    <input type="number" min="0" value={form.parcelValue} onChange={e => setForm(f => ({ ...f, parcelValue: e.target.value }))} placeholder="50000" style={inputStyle} />
                  </div>
                </div>
                <div style={{ ...fieldWrap, marginTop: 14 }}>
                  <label style={labelStyle}>{t("parcelContent")}</label>
                  <textarea required rows={3} value={form.parcelContent} onChange={e => setForm(f => ({ ...f, parcelContent: e.target.value }))} placeholder={t("parcelContentPlaceholder")} style={{ ...inputStyle, resize: "vertical" }} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#fff8e1", border: "1.5px solid #FCD116", borderRadius: 10, cursor: "pointer", marginBottom: 22 }}>
                  <input type="checkbox" checked={form.parcelFragile} onChange={e => setForm(f => ({ ...f, parcelFragile: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#C8941E" }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#5a4500" }}>⚠️ {t("parcelFragile")}</span>
                </label>

                {/* === LOGISTIQUE === */}
                <div style={sectionTitleStyle}><span style={sectionBadge}>4</span> {t("logisticsSection")}</div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>{t("preferredDate")}</label>
                  <input type="date" value={form.preferredDate} onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ ...fieldWrap, marginBottom: 24 }}>
                  <label style={labelStyle}>{t("instructions")}</label>
                  <textarea rows={3} value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder={t("instructionsPlaceholder")} style={{ ...inputStyle, resize: "vertical" }} />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ width: "100%", background: submitting ? "#a0aec0" : "#0A2F1D", color: "#FCD116", fontWeight: 800, fontSize: "0.95rem", padding: "14px", borderRadius: 12, border: "none", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s ease" }}
                >
                  {submitting ? (
                    <>
                      <div style={{ width: 18, height: 18, border: "2px solid rgba(252,209,22,0.3)", borderTopColor: "#FCD116", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      {tc("sendingQuote")}
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      {t("sendBtn")}
                    </>
                  )}
                </button>

                <p style={{ fontSize: "0.72rem", color: "#a0aec0", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
                  {t("smartsuppNote")}
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
