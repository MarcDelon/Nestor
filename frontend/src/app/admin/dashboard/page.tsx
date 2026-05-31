"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useUser } from "@/components/UserContext";

const API_BASE = `${(process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://$($window.location.hostname):5000` : 'https://safe-trip-backend.vercel.app'))}/api/agency`;
const CLIENT_API_BASE = `${(process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://$($window.location.hostname):5000` : 'https://safe-trip-backend.vercel.app'))}/api/client`;

interface DBError extends Error {
  message: string;
}

interface Agency {
  id: number;
  name: string;
  logo: string;
  photo?: string;
  certification: string;
  phone?: string;
  address?: string;
  description?: string;
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
  id: number;
  code: string;
  percentage: number;
  max_uses: number;
  current_uses: number;
  status: "draft" | "published";
  assigned_to?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: userLoading, logout: contextLogout } = useUser();
  const t = useTranslations("AdminDashboard");
  const tc = useTranslations("Common");
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
  const [voucherToast, setVoucherToast] = useState("");

  // Agency CRUD states
  const [agencyFormName, setAgencyFormName] = useState("");
  const [agencyFormLogo, setAgencyFormLogo] = useState("");
  const [agencyFormCert, setAgencyFormCert] = useState("Partenaire Certifié");
  const [agencyFormPhone, setAgencyFormPhone] = useState("");
  const [agencyFormAddress, setAgencyFormAddress] = useState("");
  const [agencyFormDesc, setAgencyFormDesc] = useState("");
  const [agencyFormError, setAgencyFormError] = useState("");
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [deletingAgencyId, setDeletingAgencyId] = useState<number | null>(null);
  const [agencyToast, setAgencyToast] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (!user) return;

    setEmail(user.email);

    const fetchData = async () => {
      const authHeaders = {
        "Content-Type": "application/json",
      };

      try {
        // 1. Fetch Agencies
        const agenciesRes = await fetch(`${API_BASE}/agencies`, { headers: authHeaders, credentials: "include" });
        let agenciesData: Agency[] = [];
        if (agenciesRes.ok) {
          agenciesData = await agenciesRes.json();
          setAgencies(agenciesData);
        }

        // 2. Fetch Buses
        const busesRes = await fetch(`${API_BASE}/buses`, { headers: authHeaders, credentials: "include" });
        let busesData: Bus[] = [];
        if (busesRes.ok) {
          busesData = await busesRes.json();
          setBuses(busesData);
        }

        // 3. Fetch Journeys
        const journeysRes = await fetch(`${API_BASE}/journeys/all`, { headers: authHeaders, credentials: "include" });
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
                const pRes = await fetch(`${API_BASE}/passengers/${j.id}`, { headers: authHeaders, credentials: "include" });
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

        // 5. Fetch Vouchers from API
        try {
          const vRes = await fetch(`${CLIENT_API_BASE}/admin/vouchers`, { headers: authHeaders, credentials: "include" });
          if (vRes.ok) {
            const vData = await vRes.json();
            setVouchers(Array.isArray(vData) ? vData : []);
          }
        } catch { /* ignore voucher fetch errors */ }

        setIsMounted(true);
      } catch (err: unknown) {
        const error = err as DBError;
        console.error("Error hydrating Admin Dashboard:", error.message);
        setIsMounted(true);
      }
    };

    fetchData();
  }, [user]);

  const handleLogout = () => {
    contextLogout();
  };

  const showVoucherToast = (msg: string) => {
    setVoucherToast(msg);
    setTimeout(() => setVoucherToast(""), 3500);
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherFormError("");
    const code = newVoucherCode.trim().toUpperCase();
    if (!code || code.length < 3) { setVoucherFormError(t("errCodeTooShort")); return; }
    const pct = parseInt(newVoucherPct, 10);
    if (isNaN(pct) || pct <= 0 || pct > 100) { setVoucherFormError(t("errPctRange")); return; }
    const maxUses = parseInt(newVoucherMaxUses, 10);
    if (isNaN(maxUses) || maxUses <= 0) { setVoucherFormError(t("errMaxUsages")); return; }

    try {
      const res = await fetch(`${CLIENT_API_BASE}/admin/vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, percentage: pct, max_uses: maxUses, status: "draft" }),
      });
      if (!res.ok) { const d = await res.json(); setVoucherFormError(d.error || "Erreur"); return; }
      const created = await res.json();
      setVouchers(prev => [created, ...prev]);
      setNewVoucherCode("");
      setNewVoucherPct("10");
      setNewVoucherMaxUses("100");
      showVoucherToast(t("voucherCreated") || "Bon créé avec succès.");
    } catch (err: any) {
      setVoucherFormError(err.message);
    }
  };

  const toggleVoucherStatus = async (v: Voucher) => {
    const newStatus = v.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`${CLIENT_API_BASE}/admin/vouchers/${v.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setVouchers(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch { /* ignore */ }
  };

  const deleteVoucher = async (v: Voucher) => {
    try {
      const res = await fetch(`${CLIENT_API_BASE}/admin/vouchers/${v.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) return;
      setVouchers(prev => prev.filter(x => x.id !== v.id));
      showVoucherToast(t("voucherDeleted") || "Bon supprimé.");
    } catch { /* ignore */ }
  };

  const resetAgencyForm = () => {
    setAgencyFormName("");
    setAgencyFormLogo("");
    setAgencyFormCert("Partenaire Certifié");
    setAgencyFormPhone("");
    setAgencyFormAddress("");
    setAgencyFormDesc("");
    setAgencyFormError("");
    setEditingAgency(null);
  };

  const startEditAgency = (a: Agency) => {
    setEditingAgency(a);
    setAgencyFormName(a.name);
    setAgencyFormLogo(a.logo || "");
    setAgencyFormCert(a.certification || "Partenaire Certifié");
    setAgencyFormPhone(a.phone || "");
    setAgencyFormAddress(a.address || "");
    setAgencyFormDesc(a.description || "");
    setAgencyFormError("");
  };

  const showAgencyToast = (msg: string) => {
    setAgencyToast(msg);
    setTimeout(() => setAgencyToast(""), 3500);
  };

  const handleCreateOrUpdateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgencyFormError("");
    if (!agencyFormName.trim()) {
      setAgencyFormError(t("errAgencyName"));
      return;
    }

    const body = {
      name: agencyFormName.trim(),
      logo: agencyFormLogo.trim() || "/images/default_agency.png",
      certification: agencyFormCert,
      phone: agencyFormPhone.trim() || null,
      address: agencyFormAddress.trim() || null,
      description: agencyFormDesc.trim() || null,
    };

    try {
      if (editingAgency) {
        const res = await fetch(`${API_BASE}/agencies/${editingAgency.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); setAgencyFormError(d.error || "Erreur"); return; }
        const updated = await res.json();
        setAgencies(prev => prev.map(a => a.id === updated.id ? updated : a));
        showAgencyToast(t("agencyUpdated"));
      } else {
        const res = await fetch(`${API_BASE}/agencies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); setAgencyFormError(d.error || "Erreur"); return; }
        const created = await res.json();
        setAgencies(prev => [...prev, created]);
        showAgencyToast(t("agencyCreated"));
      }
      resetAgencyForm();
    } catch (err: any) {
      setAgencyFormError(err.message);
    }
  };

  const handleDeleteAgency = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/agencies/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) { const d = await res.json(); console.error(d.error); return; }
      setAgencies(prev => prev.filter(a => a.id !== id));
      setDeletingAgencyId(null);
      showAgencyToast(t("agencyDeleted"));
    } catch (err: any) {
      console.error(err.message);
    }
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
          <p style={{ color: "#718096", fontSize: "0.85rem", margin: 0, fontWeight: 500 }}>{t("loading")}</p>
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

  if (userLoading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f7f5', color: '#00673C', fontSize: '1.2rem', fontWeight: 'bold' }}>
        Chargement de la Console Administration... 🚌
      </div>
    );
  }

  if (userLoading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f7f5', color: '#00673C', fontSize: '1.2rem', fontWeight: 'bold' }}>
        Chargement de la Console Administration... 🚌
      </div>
    );
  }

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
            {t("adminConsole")}
          </button>
          <button
            type="button"
            onClick={() => setAdminActiveTab("agencies")}
            className={`${styles.sidebarNavItem} ${adminActiveTab === "agencies" ? styles.sidebarNavItemActive : ""}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {t("agenciesTab")}
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
            {t("vouchers")}
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.sidebarFooterLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {tc("backToSite")}
          </Link>

          <button type="button" onClick={handleLogout} className={styles.sidebarLogoutBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {tc("logout")}
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
                <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff" }}>{t("adminConsole")}</h1>
                <span className={styles.agencyBadge}>{t("superAdmin")}</span>
              </div>
            </div>
            <div className={styles.bannerControls}>
              <LanguageToggle />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{t("adminAccount")} {email}</span>
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
                <span className={styles.statLabel}>{t("globalRevenue")}</span>
                <span className={styles.statValue}>{totalSales.toLocaleString()} FCFA</span>
                <span className={styles.statTrend} style={{ color: "#2f855a" }}>● {totalPassengers} {t("ticketsSold")}</span>
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
                <span className={styles.statLabel}>{t("partnerAgencies")}</span>
                <span className={styles.statValue}>{agencies.length} {t("companies")}</span>
                <span className={styles.statTrend} style={{ color: "#718096" }}>{t("allCertified")}</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#ebf8ff", color: "#3182ce" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>{t("activeTrips")}</span>
                <span className={styles.statValue}>{journeys.length} {t("schedules")}</span>
                <span className={styles.statTrend} style={{ color: "#3182ce" }}>{t("nationalLines")}</span>
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
                <span className={styles.statLabel}>{t("qrRegistrations")}</span>
                <span className={styles.statValue}>{qrCompliance.toFixed(1)}%</span>
                <span className={styles.statTrend} style={{ color: "#2f855a" }}>{t("optimalCompliance")} 🇨🇲</span>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className={styles.panelCard} style={{ marginTop: "30px" }}>
            <div className={styles.panelHeader} style={{ background: "rgba(0,103,60,0.02)" }}>
              <h2 className={styles.panelTitle}>{t("approvedCompanies")}</h2>
            </div>
            <div className={styles.panelBody} style={{ padding: "0" }}>
              <div className={styles.rosterTableContainer} style={{ border: "none", borderRadius: "0" }}>
                <table className={styles.rosterTable}>
                  <thead>
                    <tr>
                      <th>{t("colCompany")}</th>
                      <th>{t("colCertificate")}</th>
                      <th>{t("colActiveBuses")}</th>
                      <th>{t("colOccupancy")}</th>
                      <th>{t("colLineStatus")}</th>
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
                            <strong>{activeBusesCount} / {agencyBuses.length} {t("activeBuses")}</strong>
                          </td>
                          <td>
                            <strong>{occupancyRate}%</strong>
                          </td>
                          <td>
                            <span className={`${styles.statusPill} ${hasJourneys ? styles.statusChecked : styles.statusPending}`}>
                              {hasJourneys ? t("active") : t("inactive")}
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

        {/* ── AGENCIES TAB ── */}
        {adminActiveTab === "agencies" && (
        <div className={styles.tabContentFadeIn}>
          {/* Banner */}
          <div className={styles.agencyBanner} style={{ background: "linear-gradient(135deg, #0A2F1D 0%, #1a5c3a 100%)" }}>
            <div className={styles.agencyInfo}>
              <div className={styles.agencyLogoCircle} style={{ background: "#ffffff", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" style={{ width: "32px", height: "32px" }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className={styles.agencyText}>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff" }}>{t("agenciesTab")}</h1>
                <span className={styles.agencyBadge}>{t("agenciesSubtitle")}</span>
              </div>
            </div>
            <div className={styles.bannerControls}>
              <LanguageToggle />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                {agencies.length} {t("companies")}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "24px" }}>
            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#eef8f3", color: "#2f855a" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>{t("totalAgencies")}</span>
                <span className={styles.statValue}>{agencies.length}</span>
                <span className={styles.statTrend} style={{ color: "#718096" }}>{t("registered")}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#ebf8ff", color: "#3182ce" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8l4 2.5V19a2 2 0 0 1-2 2H5"/></svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>{t("colActiveBuses")}</span>
                <span className={styles.statValue}>{buses.length}</span>
                <span className={styles.statTrend} style={{ color: "#3182ce" }}>{t("nationalLines")}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#fffaf0", color: "#b7791f" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>{t("activeTrips")}</span>
                <span className={styles.statValue}>{journeys.length}</span>
                <span className={styles.statTrend} style={{ color: "#2f855a" }}>{t("schedules")}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "24px", alignItems: "start" }}>
            {/* Create / Edit form */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  {editingAgency ? t("editAgency") : t("addAgency")}
                </h2>
              </div>
              <div className={styles.panelBody}>
                <form onSubmit={handleCreateOrUpdateAgency} className={styles.scheduleForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("agencyName")} *</label>
                    <input className={styles.formInput} type="text" placeholder="ex: Finexs Voyage" value={agencyFormName} onChange={e => setAgencyFormName(e.target.value)} maxLength={80} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("agencyLogo")}</label>
                    <input className={styles.formInput} type="text" placeholder="/images/finexs.png ou URL externe" value={agencyFormLogo} onChange={e => setAgencyFormLogo(e.target.value)} />
                    {agencyFormLogo && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f7fafc", border: "1px solid #edf2f7", display: "flex", alignItems: "center", justifyContent: "center", padding: 5, overflow: "hidden" }}>
                          <img src={agencyFormLogo} alt={t("logoPreview")} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "#718096", fontWeight: 600 }}>{t("logoPreview")}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("agencyCertification")}</label>
                    <select className={styles.formInput} value={agencyFormCert} onChange={e => setAgencyFormCert(e.target.value)} style={{ cursor: "pointer" }}>
                      <option value="Partenaire Certifié">{t("certCertifie")}</option>
                      <option value="Partenaire Platine">{t("certPlatine")}</option>
                      <option value="Partenaire Or">{t("certOr")}</option>
                      <option value="Partenaire National">{t("certNational")}</option>
                      <option value="Partenaire Premium">{t("certPremium")}</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("agencyPhone")}</label>
                    <input className={styles.formInput} type="text" placeholder="+237 6XX XX XX XX" value={agencyFormPhone} onChange={e => setAgencyFormPhone(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("agencyAddress")}</label>
                    <input className={styles.formInput} type="text" placeholder="Douala - Akwa, Cameroun" value={agencyFormAddress} onChange={e => setAgencyFormAddress(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("agencyDescription")}</label>
                    <textarea className={`${styles.formInput} ${styles.profileTextarea}`} placeholder="Description de l'agence..." value={agencyFormDesc} onChange={e => setAgencyFormDesc(e.target.value)} rows={3} style={{ resize: "vertical", minHeight: 70 }} />
                  </div>
                  {agencyFormError && (
                    <p style={{ color: "#e53e3e", fontSize: "0.8rem", fontWeight: 700, margin: 0 }}>{agencyFormError}</p>
                  )}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" className={styles.submitFormBtn} style={{ flex: 1 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      {editingAgency ? t("saveChanges") : t("createAgency")}
                    </button>
                    {editingAgency && (
                      <button type="button" onClick={resetAgencyForm} style={{ padding: "12px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f7fafc", color: "#4a5568", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit" }}>
                        {t("cancelEdit")}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Agency list */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  {t("approvedCompanies")} ({agencies.length})
                </h2>
              </div>
              <div className={styles.panelBody} style={{ padding: 0 }}>
                {agencies.length === 0 ? (
                  <div className={styles.emptyState}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 40, height: 40, margin: "0 auto 12px auto", display: "block", color: "#cbd5e0" }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    </svg>
                    <p>{t("noAgencies")}</p>
                    <p style={{ fontSize: "0.75rem", marginTop: 4 }}>{t("noAgenciesHint")}</p>
                  </div>
                ) : (
                  <div className={styles.rosterTableContainer} style={{ border: "none", borderRadius: 0 }}>
                    <table className={styles.rosterTable}>
                      <thead>
                        <tr>
                          <th>{t("colLogo")}</th>
                          <th>{t("colName")}</th>
                          <th>{t("colCertificate")}</th>
                          <th>{t("colPhone")}</th>
                          <th>{t("colAddress")}</th>
                          <th>{t("colActions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agencies.map(a => (
                          <tr key={a.id}>
                            <td>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f7fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, border: "1px solid #edf2f7", overflow: "hidden" }}>
                                <img src={a.logo} alt={a.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{a.name}</strong>
                                {a.description && <div style={{ fontSize: "0.68rem", color: "#a0aec0", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.description}</div>}
                              </div>
                            </td>
                            <td>
                              <span className={styles.agencyBadge} style={{ background: "#fffaf0", color: "#b7791f", border: "none" }}>{a.certification}</span>
                            </td>
                            <td style={{ color: "#4a5568", fontSize: "0.8rem" }}>{a.phone || "—"}</td>
                            <td style={{ color: "#718096", fontSize: "0.78rem", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.address || "—"}</td>
                            <td>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button type="button" onClick={() => startEditAgency(a)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.72rem", fontFamily: "inherit", background: "#ebf8ff", color: "#2b6cb0", transition: "all 0.2s ease" }}>
                                  {t("editAgency")}
                                </button>
                                <button type="button" onClick={() => setDeletingAgencyId(a.id)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #fed7d7", background: "#fff5f5", color: "#c53030", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.2s ease" }} title={t("deleteAgency")}>
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

          {/* Delete confirmation modal */}
          {deletingAgencyId !== null && (
            <div className={styles.scannerModalOverlay} onClick={() => setDeletingAgencyId(null)}>
              <div className={styles.scannerModal} onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <div className={styles.scannerHeader} style={{ background: "#7f1d1d" }}>
                  <h3>{t("confirmDeleteAgency")}</h3>
                  <button type="button" className={styles.closeModalBtn} onClick={() => setDeletingAgencyId(null)}>x</button>
                </div>
                <div className={styles.scannerBody} style={{ padding: 24 }}>
                  <p style={{ color: "#4a5568", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 20 }}>{t("confirmDeleteAgencyDesc")}</p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button type="button" onClick={() => handleDeleteAgency(deletingAgencyId)} style={{ background: "#c53030", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 800, fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit" }}>
                      {t("confirmDelete")}
                    </button>
                    <button type="button" onClick={() => setDeletingAgencyId(null)} style={{ background: "#f7fafc", color: "#4a5568", border: "1.5px solid #e2e8f0", padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit" }}>
                      {t("cancelEdit")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toast */}
          {agencyToast && (
            <div className={`${styles.toast} ${styles.toastSuccess}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {agencyToast}
              <button type="button" className={styles.toastClose} onClick={() => setAgencyToast("")}>x</button>
            </div>
          )}
        </div>
        )} {/* end agencies tab */}

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
                <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff" }}>{t("vouchers")}</h1>
                <span className={styles.agencyBadge}>{t("voucherSubtitle")}</span>
              </div>
            </div>
            <div className={styles.bannerControls}>
              <LanguageToggle />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                {vouchers.filter(v => v.status === "published").length} {t("activeCodes")}
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
                <span className={styles.statLabel}>{t("totalCodes")}</span>
                <span className={styles.statValue}>{vouchers.length}</span>
                <span className={styles.statTrend} style={{ color: "#718096" }}>{t("created")}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#eef8f3", color: "#2f855a" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>{t("published")}</span>
                <span className={styles.statValue}>{vouchers.filter(v => v.status === "published").length}</span>
                <span className={styles.statTrend} style={{ color: "#2f855a" }}>{t("usable")}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: "#ebf8ff", color: "#3182ce" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div className={styles.statValueContainer}>
                <span className={styles.statLabel}>{t("usages")}</span>
                <span className={styles.statValue}>{vouchers.reduce((s, v) => s + (v.current_uses || 0), 0)}</span>
                <span className={styles.statTrend} style={{ color: "#3182ce" }}>{t("totalDiscounts")}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px", alignItems: "start" }}>
            {/* Create form */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  {t("createVoucher")}
                </h2>
              </div>
              <div className={styles.panelBody}>
                <form onSubmit={handleCreateVoucher} className={styles.scheduleForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>{t("promoCode")} *</label>
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
                    <label className={styles.formLabel}>{t("discount")} (%)</label>
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
                    <label className={styles.formLabel}>{t("maxUsages")} *</label>
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
                    {t("createDraft")}
                  </button>
                </form>
                <p style={{ fontSize: "0.75rem", color: "#a0aec0", marginTop: "14px", lineHeight: 1.5 }}>
                  {t("draftHint")}
                </p>
              </div>
            </div>

            {/* Vouchers list */}
            <div className={styles.panelCard}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  {t("existingCodes")} ({vouchers.length})
                </h2>
              </div>
              <div className={styles.panelBody} style={{ padding: 0 }}>
                {vouchers.length === 0 ? (
                  <div className={styles.emptyState}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 40, height: 40, margin: "0 auto 12px auto", display: "block", color: "#cbd5e0" }}>
                      <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                    </svg>
                    <p>{t("noVouchers")}</p>
                    <p style={{ fontSize: "0.75rem", marginTop: 4 }}>{t("noVouchersHint")}</p>
                  </div>
                ) : (
                  <div className={styles.rosterTableContainer} style={{ border: "none", borderRadius: 0 }}>
                    <table className={styles.rosterTable}>
                      <thead>
                        <tr>
                          <th>{t("colCode")}</th>
                          <th>{t("colDiscount")}</th>
                          <th>{t("colUsages")}</th>
                          <th>{t("colStatus")}</th>
                          <th>{t("colCreatedAt")}</th>
                          <th>{t("colActions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vouchers.map(v => (
                          <tr key={v.id}>
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
                                <span style={{ fontWeight: 700 }}>{v.current_uses || 0} / {v.max_uses}</span>
                                <div style={{ height: 4, background: "#edf2f7", borderRadius: 99, overflow: "hidden", width: 80 }}>
                                  <div style={{ height: "100%", width: `${Math.min(100, ((v.current_uses || 0) / v.max_uses) * 100)}%`, background: (v.current_uses || 0) >= v.max_uses ? "#e53e3e" : "#00673C", borderRadius: 99, transition: "width 0.3s ease" }} />
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={styles.statusPill} style={
                                v.status === "published"
                                  ? { background: "#eef8f3", color: "#276749" }
                                  : { background: "#fffaf0", color: "#744210" }
                              }>
                                {v.status === "published" ? t("statusPublished") : t("statusDraft")}
                              </span>
                            </td>
                            <td style={{ color: "#718096", fontSize: "0.78rem" }}>{v.created_at ? new Date(v.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</td>
                            <td>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => toggleVoucherStatus(v)}
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
                                  {v.status === "published" ? t("btnUnpublish") : t("btnPublish")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteVoucher(v)}
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
          {/* Voucher Toast */}
          {voucherToast && (
            <div className={`${styles.toast} ${styles.toastSuccess}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {voucherToast}
              <button type="button" className={styles.toastClose} onClick={() => setVoucherToast("")}>x</button>
            </div>
          )}
        </div>
        )} {/* end vouchers tab */}
      </main>
    </div>
  );
}
