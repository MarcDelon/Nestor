"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PartnerAgency {
  name: string;
  logo: string;
  cert: string;
}

const PARTNER_AGENCIES: PartnerAgency[] = [
  { name: "Finexs Voyage", logo: "/images/finexs.png", cert: "Partenaire Platine" },
  { name: "Buca Voyage", logo: "/images/bucavoyage.png", cert: "Partenaire Or" },
  { name: "General Express", logo: "/images/General.png", cert: "Partenaire Certifié" },
  { name: "Touristique Express", logo: "/images/Touristique.png", cert: "Partenaire National" },
  { name: "Men Travel", logo: "/images/mentravel.png", cert: "Partenaire Premium" }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("safetrip_logged_in") === "true";
    const role = localStorage.getItem("safetrip_user_role");
    
    if (!isLoggedIn || role !== "admin") {
      router.push("/login");
      return;
    }

    const storedEmail = localStorage.getItem("safetrip_user_email") || "";
    setEmail(storedEmail);
    setIsMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.setItem("safetrip_logged_in", "false");
    localStorage.removeItem("safetrip_user_role");
    localStorage.removeItem("safetrip_token");
    localStorage.removeItem("safetrip_user_email");
    localStorage.removeItem("safetrip_user_name");
    router.push("/login");
  };

  if (!isMounted) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f7fafc",
        fontFamily: "'Poppins', sans-serif"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "#ffffff",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
          border: "1px solid #edf2f7",
          maxWidth: "350px",
          textAlign: "center"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "3px solid #eef8f3",
            borderTopColor: "#00673C",
            animation: "spin 1s linear infinite",
            marginBottom: "20px"
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <h3 style={{ color: "#1a202c", margin: "0 0 6px 0", fontSize: "1.1rem", fontWeight: 700 }}>SafeTrip</h3>
          <p style={{ color: "#718096", fontSize: "0.85rem", margin: 0, fontWeight: 500 }}>Chargement de l&apos;administration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.clientDashboardLayout}>
      {/* 1. VERTICAL SIDEBAR */}
      <aside className={styles.clientSidebar}>
        <div className={styles.sidebarBrand}>
          <img src="/images/logo-removebg-preview (2).png" alt="Logo" className={styles.sidebarLogoImg} />
        </div>
        <nav className={styles.sidebarNav}>
          <button
            type="button"
            className={`${styles.sidebarNavItem} ${styles.sidebarNavItemActive}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            Console Admin
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.sidebarFooterLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Retour au site
          </Link>

          <button type="button" onClick={handleLogout} className={styles.sidebarLogoutBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT PANE */}
      <main className={styles.clientContentPane}>
        <div className={styles.tabContentFadeIn}>
          {/* Banner */}
          <div className={styles.agencyBanner} style={{ background: "linear-gradient(135deg, #0A2F1D 0%, #a27a00 100%)" }}>
            <div className={styles.agencyInfo}>
              <div className={styles.agencyLogoCircle} style={{ background: "#ffffff", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" style={{ width: "32px", height: "32px" }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 17v-5m3 5v-3m3 5V9" />
                </svg>
              </div>
              <div className={styles.agencyText}>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff" }}>Console Administration</h1>
                <span className={styles.agencyBadge}>Super Admin SafeTrip</span>
              </div>
            </div>
            <div className={styles.bannerControls}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Compte Admin : {email}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#eef8f3", color: "#2f855a" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>Chiffre d&apos;Affaires Global</span>
                <span className={styles.statValue}>15 420 000 FCFA</span>
                <span className={styles.statTrend} style={{ color: "#2f855a" }}>▲ +18.4% ce mois</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#fffaf0", color: "var(--accent-gold)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>Agences Partenaires</span>
                <span className={styles.statValue}>5 Compagnies</span>
                <span className={styles.statTrend} style={{ color: "#718096" }}>Toutes certifiées SafeTrip</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#ebf8ff", color: "#3182ce" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>Trajets Actifs</span>
                <span className={styles.statValue}>42 Horaires</span>
                <span className={styles.statTrend} style={{ color: "#3182ce" }}>Lignes Nationales</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#fff5f5", color: "var(--accent-red)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>Enregistrements QR</span>
                <span className={styles.statValue}>92.4%</span>
                <span className={styles.statTrend} style={{ color: "#2f855a" }}>Conformité optimale 🇨🇲</span>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className={styles.panelCard} style={{ marginTop: "30px" }}>
            <div className={styles.panelHeader} style={{ background: "rgba(0,103,60,0.02)" }}>
              <h2 className={styles.panelTitle}>Compagnies de Transport Nationales Agréées</h2>
            </div>
            <div className={styles.panelBody} style={{ padding: "0" }}>
              <div className={styles.rosterTableContainer} style={{ border: "none", borderRadius: "0" }}>
                <table className={styles.rosterTable}>
                  <thead>
                    <tr>
                      <th>Compagnie</th>
                      <th>Certificat</th>
                      <th>Chiffre d&apos;Affaires</th>
                      <th>Taux de Remplissage</th>
                      <th>Statut Ligne</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PARTNER_AGENCIES.map((agency, i) => (
                      <tr key={agency.name}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#f7fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "5px", border: "1px solid #edf2f7" }}>
                              <img src={agency.logo} alt={agency.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                            </div>
                            <strong>{agency.name}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={styles.agencyBadge} style={{ background: "#fffaf0", color: "#b7791f", border: "none" }}>
                            {agency.cert}
                          </span>
                        </td>
                        <td>
                          <strong>{(2800000 + i * 450000).toLocaleString()} FCFA</strong>
                        </td>
                        <td>
                          <strong>{82 + i * 2}%</strong>
                        </td>
                        <td>
                          <span className={`${styles.statusPill} ${styles.statusChecked}`}>
                            Actif
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
