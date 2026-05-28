"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/agency`;

interface DBError extends Error {
  message: string;
}

interface Agency {
  id: number;
  name: string;
  logo: string;
  certification: string;
}

interface Bus {
  id: string;
  agency_id: number;
  capacity: number;
  occupied: number;
  status: string;
}

interface Journey {
  id: number;
  agency_id: number;
  price: number;
}

interface Passenger {
  id: number;
  journey_id: number;
  status: string;
  luggage_count: number;
  luggage_scanned: boolean;
}

interface Voucher {
  code: string;
  percentage: number;
  maxUses: number;
  currentUses: number;
  status: "draft" | "published";
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dynamic state loaded from DB
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [passengersMap, setPassengersMap] = useState<{ [journeyId: number]: Passenger[] }>({});

  // Voucher states
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [newVoucherCode, setNewVoucherCode] = useState("");
  const [newVoucherPct, setNewVoucherPct] = useState("10");
  const [newVoucherMaxUses, setNewVoucherMaxUses] = useState("100");
  const [voucherFormError, setVoucherFormError] = useState("");

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("safetrip_logged_in") === "true";
    const role = localStorage.getItem("safetrip_user_role");
    
    if (!isLoggedIn || role !== "admin") {
      router.push("/login");
      return;
    }

    const storedEmail = localStorage.getItem("safetrip_user_email") || "";
    setEmail(storedEmail);

    const fetchData = async () => {
      const token = localStorage.getItem("safetrip_token") || "";
      const authHeaders = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        // 1. Fetch Agencies
        const agenciesRes = await fetch(`${API_BASE}/agencies`, { headers: authHeaders });
        let agenciesData: Agency[] = [];
        if (agenciesRes.ok) {
          agenciesData = await agenciesRes.json();
          setAgencies(agenciesData);
        }

        // 2. Fetch Buses
        const busesRes = await fetch(`${API_BASE}/buses`, { headers: authHeaders });
        let busesData: Bus[] = [];
        if (busesRes.ok) {
          busesData = await busesRes.json();
          setBuses(busesData);
        }

        // 3. Fetch Journeys
        const journeysRes = await fetch(`${API_BASE}/journeys/all`, { headers: authHeaders });
        let journeysData: Journey[] = [];
        if (journeysRes.ok) {
          const raw = await journeysRes.json();
          journeysData = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.value) ? raw.value : []);
          setJourneys(journeysData);
        }

        // 4. Fetch Passengers for each journey to compute sales & scan rates
        if (journeysData.length > 0) {
          const tempMap: { [journeyId: number]: Passenger[] } = {};
          await Promise.all(
            journeysData.map(async (j) => {
              try {
                const pRes = await fetch(`${API_BASE}/passengers/${j.id}`, { headers: authHeaders });
                if (pRes.ok) {
                  tempMap[j.id] = await pRes.json();
                }
              } catch (e) {
                console.error("Error fetching passengers for journey " + j.id, e);
              }
            })
          );
          setPassengersMap(tempMap);
        }

        setIsMounted(true);
      } catch (err: unknown) {
        const error = err as DBError;
        console.error("⚠️ Error hydrating Admin Dashboard:", error.message);
        setIsMounted(true);
      }
    };

    fetchData();

    // Load vouchers from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("safetrip_vouchers") || "[]");
      setVouchers(stored);
    } catch { setVouchers([]); }
  }, [router]);

  const handleLogout = () => {
    localStorage.setItem("safetrip_logged_in", "false");
    localStorage.removeItem("safetrip_user_role");
    localStorage.removeItem("safetrip_token");
    localStorage.removeItem("safetrip_user_email");
    localStorage.removeItem("safetrip_user_name");
    router.push("/login");
  };

  const saveVouchers = (updated: Voucher[]) => {
    setVouchers(updated);
    localStorage.setItem("safetrip_vouchers", JSON.stringify(updated));
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherFormError("");
    const code = newVoucherCode.trim().toUpperCase();
    if (!code || code.length < 3) {
      setVoucherFormError("Le code doit contenir au moins 3 caractères.");
      return;
    }
    if (vouchers.some(v => v.code === code)) {
      setVoucherFormError("Ce code existe déjà.");
      return;
    }
    const pct = parseInt(newVoucherPct, 10);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      setVoucherFormError("Le pourcentage doit être entre 1 et 100.");
      return;
    }
    const maxUses = parseInt(newVoucherMaxUses, 10);
    if (isNaN(maxUses) || maxUses <= 0) {
      setVoucherFormError("Le nombre d'utilisations doit être supérieur à 0.");
      return;
    }
    const newVoucher: Voucher = {
      code,
      percentage: pct,
      maxUses,
      currentUses: 0,
      status: "draft",
      createdAt: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    };
    saveVouchers([...vouchers, newVoucher]);
    setNewVoucherCode("");
    setNewVoucherPct("10");
    setNewVoucherMaxUses("100");
  };

  const toggleVoucherStatus = (code: string) => {
    const updated = vouchers.map(v =>
      v.code === code
        ? { ...v, status: (v.status === "published" ? "draft" : "published") as "draft" | "published" }
        : v
    );
    saveVouchers(updated);
  };

  const deleteVoucher = (code: string) => {
    saveVouchers(vouchers.filter(v => v.code !== code));
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

  // Calculate Global KPIs dynamically
  const totalSales = journeys.reduce((sum, j) => {
    const passengersList = passengersMap[j.id] || [];
    return sum + (j.price * passengersList.length);
  }, 0);

  const totalPassengers = journeys.reduce((sum, j) => {
    return sum + (passengersMap[j.id]?.length || 0);
  }, 0);

  // Checked-in / Registered compliance rate
  const totalCheckedIn = journeys.reduce((sum, j) => {
    const list = passengersMap[j.id] || [];
    return sum + list.filter(p => p.status === "Enregistré").length;
  }, 0);

  const qrCompliance = totalPassengers > 0
    ? (totalCheckedIn / totalPassengers) * 100
    : 100.0;

  return (
    <div className={styles.clientDashboardLayout}>
      <div className={styles.mobileTopBar}>
        <button type="button" onClick={() => setSidebarOpen(o => !o)} className={styles.mobileMenuBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:22,height:22}}>
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <img src="/images/logo-removebg-preview (2).png" alt="SafeTrip" style={{height:36,objectFit:"contain"}} />
        <div style={{width:34}} />
      </div>
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      {/* 1. VERTICAL SIDEBAR */}
      <aside className={sidebarOpen ? `${styles.clientSidebar} ${styles.sidebarOpen}` : styles.clientSidebar}>
        <div className={styles.sidebarBrand}>
          <img src="/images/logo-removebg-preview (2).png" alt="Logo" className={styles.sidebarLogoImg} />
        </div>
        <nav className={styles.sidebarNav}>
          <button
            type="button"
            onClick={() => setAdminActiveTab("dashboard")}
            className={`${styles.sidebarNavItem} ${adminActiveTab === "dashboard" ? styles.sidebarNavItemActive : ""}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            Console Admin
          </button>
          <button
            type="button"
            onClick={() => setAdminActiveTab("vouchers")}
            className={`${styles.sidebarNavItem} ${adminActiveTab === "vouchers" ? styles.sidebarNavItemActive : ""}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <path d="M20 12V22H4V12" />
              <path d="M22 7H2v5h20V7z" />
              <path d="M12 22V7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
            Bons de Réduction
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
        {/* ── DASHBOARD TAB ── */}
        {adminActiveTab === "dashboard" && (
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
                <span className={styles.statValue}>{totalSales.toLocaleString()} FCFA</span>
                <span className={styles.statTrend} style={{ color: "#2f855a" }}>● {totalPassengers} billet{totalPassengers !== 1 ? "s" : ""} vendu{totalPassengers !== 1 ? "s" : ""}</span>
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
                <span className={styles.statValue}>{agencies.length} Compagnies</span>
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
                <span className={styles.statValue}>{journeys.length} Horaires</span>
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
                <span className={styles.statValue}>{qrCompliance.toFixed(1)}%</span>
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
                      <th>Bus Actifs</th>
                      <th>Taux de Remplissage</th>
                      <th>Statut Ligne</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agencies.map((agency) => {
                      // Filter buses for this agency
                      const agencyBuses = buses.filter(b => b.agency_id === agency.id);
                      const activeBusesCount = agencyBuses.filter(b => b.status !== "En maintenance").length;

                      // Compute average occupancy rate for this agency's buses
                      const totalOccupied = agencyBuses.reduce((sum, b) => sum + b.occupied, 0);
                      const totalCapacity = agencyBuses.reduce((sum, b) => sum + b.capacity, 0);
                      const occupancyRate = totalCapacity > 0
                        ? Math.round((totalOccupied / totalCapacity) * 100)
                        : 0;

                      // Ligne Active if there is at least one journey
                      const hasJourneys = journeys.some(j => j.agency_id === agency.id);

                      return (
                        <tr key={agency.id}>
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
                              {agency.certification}
                            </span>
                          </td>
                          <td>
                            <strong>{activeBusesCount} / {agencyBuses.length} bus actifs</strong>
                          </td>
                          <td>
                            <strong>{occupancyRate}%</strong>
                          </td>
                          <td>
                            <span className={`${styles.statusPill} ${hasJourneys ? styles.statusChecked : styles.statusPending}`}>
                              {hasJourneys ? "Actif" : "Inactif"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        )} {/* end dashboard tab */}

        {/* ── VOUCHERS TAB ── */}
        {adminActiveTab === "vouchers" && (
        <div className={styles.tabContentFadeIn}>
          {/* Banner */}
          <div className={styles.agencyBanner} style={{ background: "linear-gradient(135deg, #0A2F1D 0%, #6b3a00 100%)" }}>
            <div className={styles.agencyInfo}>
              <div className={styles.agencyLogoCircle} style={{ background: "#ffffff", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" style={{ width: "32px", height: "32px" }}>
                  <path d="M20 12V22H4V12" />
                  <path d="M22 7H2v5h20V7z" />
                  <path d="M12 22V7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
              </div>
              <div className={styles.agencyText}>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff" }}>Bons de Réduction</h1>
                <span className={styles.agencyBadge}>Gestion des codes promo SafeTrip</span>
              </div>
            </div>
            <div className={styles.bannerControls}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                {vouchers.filter(v => v.status === "published").length} code{vouchers.filter(v => v.status === "published").length !== 1 ? "s" : ""} actif{vouchers.filter(v => v.status === "published").length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "24px" }}>
            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#fffaf0", color: "#b7791f" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>Total Codes</span>
                <span className={styles.statValue}>{vouchers.length}</span>
                <span className={styles.statTrend} style={{ color: "#718096" }}>Créés</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#eef8f3", color: "#2f855a" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>Publiés</span>
                <span className={styles.statValue}>{vouchers.filter(v => v.status === "published").length}</span>
                <span className={styles.statTrend} style={{ color: "#2f855a" }}>Utilisables</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#ebf8ff", color: "#3182ce" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>Utilisations</span>
                <span className={styles.statValue}>{vouchers.reduce((s, v) => s + v.currentUses, 0)}</span>
                <span className={styles.statTrend} style={{ color: "#3182ce" }}>Total réductions</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px", alignItems: "start" }}>
            {/* Create form */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Créer un bon
                </h2>
              </div>
              <div className={styles.panelBody}>
                <form onSubmit={handleCreateVoucher} className={styles.scheduleForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Code promo *</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      placeholder="ex: NOEL25"
                      value={newVoucherCode}
                      onChange={e => setNewVoucherCode(e.target.value.toUpperCase())}
                      maxLength={20}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Réduction (%)</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      min={1}
                      max={100}
                      value={newVoucherPct}
                      onChange={e => setNewVoucherPct(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nb. utilisations max *</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      min={1}
                      value={newVoucherMaxUses}
                      onChange={e => setNewVoucherMaxUses(e.target.value)}
                    />
                  </div>
                  {voucherFormError && (
                    <p style={{ color: "#e53e3e", fontSize: "0.8rem", fontWeight: 700, margin: 0 }}>{voucherFormError}</p>
                  )}
                  <button type="submit" className={styles.submitFormBtn}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></svg>
                    Créer en brouillon
                  </button>
                </form>
                <p style={{ fontSize: "0.75rem", color: "#a0aec0", marginTop: "14px", lineHeight: 1.5 }}>
                  Les bons créés sont en <strong>brouillon</strong> par défaut. Publiez-les pour les rendre utilisables par les voyageurs.
                </p>
              </div>
            </div>

            {/* Vouchers list */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  Codes existants ({vouchers.length})
                </h2>
              </div>
              <div className={styles.panelBody} style={{ padding: 0 }}>
                {vouchers.length === 0 ? (
                  <div className={styles.emptyState}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 40, height: 40, margin: "0 auto 12px auto", display: "block", color: "#cbd5e0" }}>
                      <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                    </svg>
                    <p>Aucun bon de réduction créé.</p>
                    <p style={{ fontSize: "0.75rem", marginTop: 4 }}>Créez votre premier code promo dans le formulaire ci-contre.</p>
                  </div>
                ) : (
                  <div className={styles.rosterTableContainer} style={{ border: "none", borderRadius: 0 }}>
                    <table className={styles.rosterTable}>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Réduction</th>
                          <th>Utilisations</th>
                          <th>Statut</th>
                          <th>Créé le</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vouchers.map(v => (
                          <tr key={v.code}>
                            <td>
                              <code style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.92rem", background: "#f7fafc", padding: "2px 8px", borderRadius: 6, border: "1px solid #edf2f7" }}>
                                {v.code}
                              </code>
                            </td>
                            <td>
                              <span style={{ fontWeight: 800, color: "#b7791f", fontSize: "1rem" }}>{v.percentage}%</span>
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span style={{ fontWeight: 700 }}>{v.currentUses} / {v.maxUses}</span>
                                <div style={{ height: 4, background: "#edf2f7", borderRadius: 99, overflow: "hidden", width: 80 }}>
                                  <div style={{ height: "100%", width: `${Math.min(100, (v.currentUses / v.maxUses) * 100)}%`, background: v.currentUses >= v.maxUses ? "#e53e3e" : "#00673C", borderRadius: 99, transition: "width 0.3s ease" }} />
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={styles.statusPill} style={
                                v.status === "published"
                                  ? { background: "#eef8f3", color: "#276749" }
                                  : { background: "#fffaf0", color: "#744210" }
                              }>
                                {v.status === "published" ? "Publié" : "Brouillon"}
                              </span>
                            </td>
                            <td style={{ color: "#718096", fontSize: "0.78rem" }}>{v.createdAt}</td>
                            <td>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => toggleVoucherStatus(v.code)}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: 6,
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: 700,
                                    fontSize: "0.72rem",
                                    fontFamily: "inherit",
                                    background: v.status === "published" ? "#fff5f5" : "#eef8f3",
                                    color: v.status === "published" ? "#c53030" : "#276749",
                                    transition: "all 0.2s ease"
                                  }}
                                >
                                  {v.status === "published" ? "Retirer" : "Publier"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteVoucher(v.code)}
                                  style={{
                                    padding: "5px 8px",
                                    borderRadius: 6,
                                    border: "1px solid #fed7d7",
                                    background: "#fff5f5",
                                    color: "#c53030",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    transition: "all 0.2s ease"
                                  }}
                                  title="Supprimer"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}>
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )} {/* end vouchers tab */}
      </main>
    </div>
  );
}
