"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "../page.module.css";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useUser } from "@/components/UserContext";
import { useTranslations } from "next-intl";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "sending" | "success" | "error"; text?: string }>({ type: "idle" });

  // Header UX parity with home
  const tc = useTranslations("Common");
  const { user } = useUser();
  const isLoggedIn = !!user;
  const userRole = user?.role || null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      window.location.href = "/login";
    } else if (userRole === "admin") {
      window.location.href = "/admin/dashboard";
    } else if (userRole === "agency") {
      window.location.href = "/agence/dashboard";
    } else {
      window.location.href = "/client/dashboard";
    }
  };

  const apiBase = ((typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app'))
    ? 'https://safe-trip-backend.vercel.app'
    : ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.')))
      ? `http://${window.location.hostname}:5000`
      : (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') : 'https://safe-trip-backend.vercel.app')));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      setStatus({ type: "error", text: "Veuillez saisir au minimum votre email et votre message." });
      return;
    }
    setStatus({ type: "sending", text: "Envoi en cours..." });
    try {
      const res = await fetch(`${apiBase}/api/client/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ type: "success", text: data?.message || "Message envoyé. Merci !" });
        setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage("");
      } else {
        setStatus({ type: "error", text: data?.error || "Échec de l'envoi. Réessayez plus tard." });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Erreur réseau. Réessayez plus tard." });
    }
  };

  const contactPhone = "+237 651529402";
  const whatsappLink = `https://wa.me/237651529402`;
  const supportEmail = "support@safetrip.cm";
  const contactEmail = "contact@safetrip.cm";

  return (
    <main className={styles.main} style={{ background: "linear-gradient(160deg,#F7F4EE 0%,#EDE9DF 100%)" }}>
      {/* Header (same as Home) */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logoContainer} id="tour-logo">
            <img src="/images/logo-removebg-preview (2).png" alt="SafeTrip Logo" className={styles.logoImage} />
          </Link>
          <nav className={styles.nav}>
            <Link href="/reserver">{tc("reserve")}</Link>
            <Link href="/agences">{tc("agencies")}</Link>
            <Link href="/tracabilite">{tc("traceability")}</Link>
            <Link href="/location">{tc("rental")}</Link>
            <Link href="/contact" style={{ fontWeight: 800 }}>Contact</Link>
            {isLoggedIn && userRole === "admin" && <Link href="/admin/dashboard" style={{ color: "var(--accent-gold)", fontWeight: 800 }}>{tc("admin")}</Link>}
            {isLoggedIn && userRole === "agency" && <Link href="/agence/dashboard" style={{ color: "var(--accent-gold)", fontWeight: 800 }}>{tc("myAgency")}</Link>}
            {isLoggedIn && userRole === "client" && <Link href="/client/dashboard" style={{ color: "var(--accent-gold)", fontWeight: 800 }}>{tc("travelerSpace")}</Link>}
          </nav>
          <LanguageToggle />
          <button onClick={toggleConnection} className={styles.headerBtn}>
            {!isLoggedIn ? tc("login") : userRole === "admin" ? tc("admin") : userRole === "agency" ? tc("myAgency") : tc("mySpace")}
          </button>
          <button
            className={styles.hamburgerBtn}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(o => !o); }}
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 24, height: 24, pointerEvents: 'none' }}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <>
            <div className={styles.mobileMenuBackdrop} onClick={() => setMobileMenuOpen(false)} />
            <div className={styles.mobileMenu} role="menu">
              <Link href="/reserver" onClick={() => setMobileMenuOpen(false)}>{tc("reserve")}</Link>
              <Link href="/agences" onClick={() => setMobileMenuOpen(false)}>{tc("agencies")}</Link>
              <Link href="/tracabilite" onClick={() => setMobileMenuOpen(false)}>{tc("traceability")}</Link>
              <Link href="/location" onClick={() => setMobileMenuOpen(false)}>{tc("rental")}</Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
              {isLoggedIn && userRole === "admin" && <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>{tc("admin")}</Link>}
              {isLoggedIn && userRole === "agency" && <Link href="/agence/dashboard" onClick={() => setMobileMenuOpen(false)}>{tc("myAgency")}</Link>}
              {isLoggedIn && userRole === "client" && <Link href="/client/dashboard" onClick={() => setMobileMenuOpen(false)}>{tc("mySpace")}</Link>}
              <button onClick={(e) => { toggleConnection(e); setMobileMenuOpen(false); }} style={{ background: "#00673C", color: "#fff", fontWeight: 700, padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                {!isLoggedIn ? tc("login") : tc("myAccount")}
              </button>
            </div>
          </>
        )}
      </header>

      {/* Content */}
      <section className="container" style={{ padding: "92px 20px 90px" }}>
        <h1 className={styles.sectionTitle} style={{ marginBottom: 6 }}>Contactez-nous</h1>
        <p style={{ color: "#4A5568", marginBottom: 28 }}>Écrivez-nous via le formulaire, par email, WhatsApp ou venez nous voir à Douala — Yassa.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 28 }}>
          {/* Form */}
          <div style={{ background: "#fff", border: "1px solid #E6E1D6", borderRadius: 18, padding: 22, boxShadow: "0 8px 24px rgba(7,26,14,0.06)" }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: "#2D3748", marginBottom: 6 }}>Nom</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: "#2D3748", marginBottom: 6 }}>Téléphone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: +237 6xx xx xx xx" style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px" }} />
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: "#2D3748", marginBottom: 6 }}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" required style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px" }} />
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: "#2D3748", marginBottom: 6 }}>Objet</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Sujet de votre demande" style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px" }} />
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: 13, color: "#2D3748", marginBottom: 6 }}>Message *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Décrivez votre demande" required rows={6} style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", resize: "vertical" }} />
              </div>
              <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14 }}>
                <button type="submit" disabled={status.type === "sending"} style={{ background: "#00673C", color: "#fff", fontWeight: 800, padding: "12px 20px", borderRadius: 12, border: "none", cursor: "pointer" }}>
                  {status.type === "sending" ? "Envoi..." : "Envoyer"}
                </button>
                {status.type === "error" && <span style={{ color: "#C53030", fontWeight: 700 }}>{status.text}</span>}
                {status.type === "success" && <span style={{ color: "#2F855A", fontWeight: 700 }}>{status.text}</span>}
              </div>
            </form>
          </div>

          {/* Infos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "#fff", border: "1px solid #E6E1D6", borderRadius: 18, padding: 20, boxShadow: "0 8px 24px rgba(7,26,14,0.06)" }}>
              <h3 style={{ margin: 0, color: "#0A2F1D" }}>Coordonnées SafeTrip</h3>
              <p style={{ margin: "10px 0", color: "#4A5568" }}>Adresse: Douala — Yassa</p>
              <p style={{ margin: "8px 0", color: "#4A5568" }}>Téléphone: <a href={`tel:${contactPhone.replace(/\s+/g,'')}`} style={{ color: "#00673C", fontWeight: 800 }}>{contactPhone}</a></p>
              <p style={{ margin: "8px 0", color: "#4A5568" }}>WhatsApp: <a href={whatsappLink} target="_blank" rel="noreferrer" style={{ color: "#00673C", fontWeight: 800 }}>Discuter</a></p>
              <p style={{ margin: "8px 0", color: "#4A5568" }}>Email: <a href={`mailto:${supportEmail}`} style={{ color: "#00673C", fontWeight: 800 }}>{supportEmail}</a> • <a href={`mailto:${contactEmail}`} style={{ color: "#00673C", fontWeight: 800 }}>{contactEmail}</a></p>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <a href="https://instagram.com/safetripcm" target="_blank" rel="noreferrer" aria-label="Instagram"
                   style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #E6E1D6", display: "flex", alignItems: "center", justifyContent: "center", color: "#1A202C", background: "#fff", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="https://facebook.com/safetripcm" target="_blank" rel="noreferrer" aria-label="Facebook"
                   style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #E6E1D6", display: "flex", alignItems: "center", justifyContent: "center", color: "#1A202C", background: "#fff", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a href="https://tiktok.com/@safetripcm" target="_blank" rel="noreferrer" aria-label="TikTok"
                   style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #E6E1D6", display: "flex", alignItems: "center", justifyContent: "center", color: "#1A202C", background: "#fff", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                    <path d="M9 7v8a3 3 0 1 1-3-3"></path>
                    <path d="M15 3c0 3.5 2.5 6 6 6"></path>
                    <path d="M15 3v12a5 5 0 1 1-5-5"></path>
                  </svg>
                </a>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #E6E1D6", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 24px rgba(7,26,14,0.06)" }}>
              <iframe
                title="Localisation SafeTrip"
                src="https://www.google.com/maps?q=Douala%20Yassa&output=embed"
                width="100%"
                height="340"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* Mobile layout fallback */}
        <style jsx>{`
          @media (max-width: 920px) {
            section.container > div { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* Floating WhatsApp Quick Access */}
      <a href={whatsappLink} target="_blank" rel="noreferrer" aria-label="Discuter sur WhatsApp"
         style={{ position: "fixed", right: 18, bottom: 26, width: 56, height: 56, borderRadius: "50%", background: "#25D366", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 25px rgba(37,211,102,0.45)", zIndex: 10000, transition: "transform .15s ease, box-shadow .2s ease" }}
         onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 16px 28px rgba(37,211,102,0.55)"; }}
         onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 25px rgba(37,211,102,0.45)"; }}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26" aria-hidden="true">
          <path d="M20.52 3.48A11.77 11.77 0 0012.04 0C5.46 0 .12 5.35.12 11.94c0 2.1.55 4.09 1.52 5.82L0 24l6.4-1.67a11.86 11.86 0 005.64 1.44h.01c6.58 0 11.93-5.35 11.93-11.94 0-3.19-1.25-6.19-3.46-8.35zM12.04 21.3h-.01a9.39 9.39 0 01-4.79-1.31l-.34-.2-3.8 1 1.02-3.7-.22-.38a9.4 9.4 0 01-1.45-5.07c0-5.19 4.23-9.42 9.44-9.42 2.52 0 4.88.98 6.66 2.75a9.32 9.32 0 012.76 6.66c0 5.2-4.23 9.43-9.47 9.43zm5.37-7.05c-.29-.15-1.72-.85-1.98-.95-.26-.1-.46-.15-.66.15-.2.29-.75.95-.92 1.14-.17.2-.34.22-.63.07-.29-.15-1.23-.45-2.33-1.45a8.71 8.71 0 01-1.61-1.98c-.17-.29 0-.45.13-.6.14-.14.29-.35.44-.52.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.2-.23-.56-.47-.48-.66-.49h-.56c-.2 0-.52.07-.8.37-.29.3-1.05 1.03-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.14 3.27 5.19 4.58.73.32 1.3.5 1.75.64.73.23 1.38.2 1.9.12.58-.09 1.72-.7 1.96-1.37.24-.67.24-1.24.17-1.37-.07-.12-.26-.2-.55-.35z" />
        </svg>
      </a>

      {/* Footer (same as Home) */}
      <footer className={styles.footer}>
        <div className={`container ${styles.footerGrid}`}>
          <div className={styles.footerBrandCol}>
            <div className={styles.footerLogoContainer}>
              <img src="/images/logo-removebg-preview (2).png" alt="SafeTrip Logo" className={styles.footerLogo} />
            </div>
            <p className={styles.footerDesc}>La plateforme qui modernise vos voyages et vos envois au Cameroun.</p>
            <div className={styles.socialLinks}>
              <a href="#social" className={styles.socialIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#social" className={styles.socialIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
              <a href="#social" className={styles.socialIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>
          <div className={styles.footerLinkCol}>
            <h4>Services</h4>
            <ul>
              <li><Link href="/reserver">Réserver un billet</Link></li>
              <li><Link href="/agences">Agences de transport</Link></li>
              <li><Link href="/tracabilite">Suivre un colis</Link></li>
              <li><Link href="/location">Location de bus</Link></li>
              <li><a href="#qui-sommes-nous">À propos</a></li>
            </ul>
          </div>
          <div className={styles.footerLinkCol}>
            <h4>Sécurité & Légal</h4>
            <ul>
              <li><a href="#legal">Mentions légales</a></li>
              <li><a href="#privacy">Confidentialité</a></li>
              <li><a href="#terms">Conditions</a></li>
              <li><a href="#rgpd">RGPD</a></li>
            </ul>
          </div>
          <div className={styles.footerLinkCol}>
            <h4>Contact</h4>
            <ul className={styles.footerContactList}>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>support@safetrip.cm</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>+237 677 889 900</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>Douala & Yaoundé, Cameroun</span>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <div className={`container ${styles.footerBottomContent}`}>
            <p className={styles.copyright}>© SafeTrip. Tous droits réservés.</p>
            <p className={styles.footerCredits}>Conçu avec passion au Cameroun.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
