"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/UserContext";

interface Journey {
  id: number;
  type: "bus";
  operator: string;
  logo: string;
  depTime: string;
  arrTime: string;
  duration: string;
  depStation: string;
  arrStation: string;
  price: number;
  amenities: string[];
  amenityKeys: string[];
  busId?: string;
  busCapacity?: number;
  busClass?: string;
  busOccupied?: number;
  warning?: string;
  isNight?: boolean;
}

const amenitiesList = [
  { key: "reclining", label: "Sièges inclinables", icon: "reclining" },
  { key: "plug", label: "Prises électriques", icon: "plug" },
  { key: "wifi", label: "Wi-Fi", icon: "wifi" },
  { key: "toilet", label: "Toilettes", icon: "toilet" },
  { key: "ac", label: "Climatisation", icon: "wind" },
  { key: "pmr", label: "Personne à mobilité réduite", icon: "accessibility" },
  { key: "catering", label: "Service de restauration disponible", icon: "utensils" }
];

const popularRoutes = [
  {
    id: 1,
    dep: "Douala",
    arr: "Yaoundé",
    price: "3 000",
    operators: "Finexs Voyage, Buca Voyage, General Express...",
    iconColor: "#00673C"
  },
  {
    id: 2,
    dep: "Yaoundé",
    arr: "Garoua",
    price: "8 000",
    operators: "Touristique Express...",
    iconColor: "#DC0004"
  },
  {
    id: 3,
    dep: "Douala",
    arr: "Bafoussam",
    price: "4 000",
    operators: "General Express, Men Travel...",
    iconColor: "#FBA600"
  },
  {
    id: 4,
    dep: "Douala",
    arr: "Kribi",
    price: "3 500",
    operators: "Finexs Voyage, Buca Voyage, Men Travel...",
    iconColor: "#0A2F1D"
  }
];



function renderAmenityIcon(iconName: string) {
  switch (iconName) {
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "zap":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "cigarette":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="10" width="16" height="5" rx="1" />
          <line x1="18" y1="10" x2="22" y2="10" />
          <line x1="18" y1="15" x2="22" y2="15" />
          <path d="M22 6c0-2-2-2-2-2m2 4c0-2-2-2-2-2" />
        </svg>
      );
    case "paw":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="13" r="5" />
          <circle cx="6" cy="7" r="2.5" />
          <circle cx="18" cy="7" r="2.5" />
          <circle cx="9" cy="4" r="2" />
          <circle cx="15" cy="4" r="2" />
        </svg>
      );
    case "reclining":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9h-2c-1.1 0-2 .9-2 2v7H5V5" />
          <circle cx="17" cy="5" r="2" />
          <path d="M5 18H3M15 18h2" />
        </svg>
      );
    case "plug":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 10V8a2 2 0 0 0-2-2h-3V2h-2v4H8a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4z" />
          <line x1="12" y1="14" x2="12" y2="22" />
        </svg>
      );
    case "wifi":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
        </svg>
      );
    case "toilet":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 22h4m-7-5h10M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M6 8h12v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z" />
        </svg>
      );
    case "wind":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
          <path d="M10 4L12 2L14 4M20 10L22 12L20 14M14 20L12 22L10 20M4 14L2 12L4 10" />
        </svg>
      );
    case "ticket":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M6 5v4a2 2 0 0 0 4 0V5M6 19v-4a2 2 0 0 1 4 0v4M14 9h4M14 15h4" />
        </svg>
      );
    case "accessibility":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="4" r="2" />
          <path d="M8 12h6l2 5M12 8v5M16 20a4 4 0 1 1-8 0" />
        </svg>
      );
    case "utensils":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 3v7a6 6 0 0 0 4 5.65V21M17 3v18M13 3v7M20 3v4a3 3 0 0 1-3 3h-1" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Reserver() {
  const searchParams = useSearchParams();
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [activeSorts, setActiveSorts] = useState<string[]>(["price"]);
  const [selectedJourney, setSelectedJourney] = useState<number | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const { user } = useUser();
  const isAgencyLoggedIn = !!user && (user.role === "agency" || user.role === "admin");
  const [journeysState, setJourneysState] = useState<Journey[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    // 2. Pre-fill search from URL params (from homepage search capsule)
    const depParam = searchParams.get("dep");
    const arrParam = searchParams.get("arr");
    if (depParam && arrParam) {
      setDeparture(depParam);
      setDestination(arrParam);
      setHasSearched(true);
    }

    // 3. Fetch journeys list from the actual database API (public route — no auth needed)
    const fetchJourneys = async () => {
      const apiBase = ((typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) ? 'https://safe-trip-backend.vercel.app' : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://:5000` : 'https://safe-trip-backend.vercel.app')));
      try {
        const response = await fetch(`${apiBase}/api/agency/journeys/all`);
        if (response.ok) {
          const data = await response.json();
          // Database columns to camelCase matching the frontend's Journey interface
          const formatted = (data || []).map((j: any) => ({
            id: j.id,
            type: "bus",
            operator: j.operator,
            logo: j.logo,
            depTime: j.dep_time,
            arrTime: j.arr_time,
            duration: j.duration,
            depStation: j.dep_station,
            arrStation: j.arr_station,
            price: j.price,
            amenities: j.amenities || [],
            amenityKeys: j.amenity_keys || [],
            busId: j.bus_id,
            busCapacity: j.buses?.capacity || j.bus_capacity || 40,
            busClass: j.buses?.bus_class || j.bus_class,
            busOccupied: j.buses?.occupied || j.bus_occupied || 0,
            warning: j.warning,
            isNight: j.is_night
          }));
          setJourneysState(formatted);
        } else {
          setJourneysState([]);
        }
      } catch (err) {
        console.error("⚠️ Error fetching journeys from Supabase:", err);
        setJourneysState([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJourneys();
  }, []);

  const toggleConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = "/agence/dashboard";
  };

  // Filtering based on active search terms and selected amenities
  const filteredJourneys = journeysState.filter(j => {
    // 1. Search query filter (only active if hasSearched is true)
    if (hasSearched) {
      const depQuery = departure.toLowerCase().split(",")[0].trim();
      const destQuery = destination.toLowerCase().split(",")[0].trim();
      
      const matchDep = j.depStation.toLowerCase().includes(depQuery);
      const matchDest = j.arrStation.toLowerCase().includes(destQuery);
      
      if (!matchDep || !matchDest) return false;
    }

    // 2. Amenities filter
    for (const key of selectedAmenities) {
      if (!j.amenityKeys?.includes(key)) return false;
    }

    // 3. Class filter
    if (selectedClasses.length > 0) {
      const isVip = j.operator.toLowerCase().includes("vip") && !j.operator.toLowerCase().includes("executive");
      const isExecutive = j.operator.toLowerCase().includes("executive") || j.operator.toLowerCase().includes("exclusive");
      const isClassic = j.operator.toLowerCase().includes("classique");
      
      const matchesVip = selectedClasses.includes("vip") && isVip;
      const matchesExecutive = selectedClasses.includes("executive") && isExecutive;
      const matchesClassic = selectedClasses.includes("classic") && isClassic;
      
      if (!matchesVip && !matchesExecutive && !matchesClassic) return false;
    }

    // 4. Time slot filter
    if (selectedTimeSlots.length > 0) {
      const hour = parseInt(j.depTime.split(":")[0], 10);
      let slot = "";
      if (hour >= 6 && hour < 12) slot = "morning";
      else if (hour >= 12 && hour < 18) slot = "afternoon";
      else if (hour >= 18 && hour < 24) slot = "evening";
      else slot = "night";
      
      if (!selectedTimeSlots.includes(slot)) return false;
    }

    return true;
  });

  const toggleSort = (sort: string) => {
    setActiveSorts(prev => {
      if (prev.includes(sort)) return prev.filter(s => s !== sort);
      if (prev.length >= 3) return [...prev.slice(1), sort]; // drop oldest when max reached
      return [...prev, sort];
    });
  };

  // Multi-sort: apply each active sort in priority order (index 0 = highest priority)
  const sortedJourneys = [...filteredJourneys].sort((a, b) => {
    for (const sort of activeSorts) {
      let cmp = 0;
      if (sort === "price") cmp = a.price - b.price;
      else if (sort === "time") cmp = a.depTime.localeCompare(b.depTime);
      else if (sort === "duration") cmp = a.duration.localeCompare(b.duration);
      else if (sort === "vip") {
        const isVipA = a.operator.toLowerCase().includes("vip") || a.operator.toLowerCase().includes("executive");
        const isVipB = b.operator.toLowerCase().includes("vip") || b.operator.toLowerCase().includes("executive");
        if (isVipA && !isVipB) cmp = -1;
        else if (!isVipA && isVipB) cmp = 1;
      }
      else if (sort === "classic") {
        const isClsA = a.operator.toLowerCase().includes("classique");
        const isClsB = b.operator.toLowerCase().includes("classique");
        if (isClsA && !isClsB) cmp = -1;
        else if (!isClsA && isClsB) cmp = 1;
      }
      if (cmp !== 0) return cmp;
    }
    return 0;
  });

  return (
    <main className={styles.main}>
      {/* Frosted Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logoContainer}>
            <img 
              src="/images/logo-removebg-preview (2).png" 
              alt="SafeTrip Logo" 
              className={styles.logoImage}
            />
          </Link>
          <nav className={styles.nav}>
            <Link href="/reserver">Réserver</Link>
            <Link href="/agences">Agences</Link>
            <Link href="/tracabilite">Traçabilité</Link>
            <Link href="/location">Location</Link>
            {isAgencyLoggedIn && <Link href="/agence/dashboard" style={{ color: "var(--accent-gold)", fontWeight: 800 }}>Admin</Link>}
          </nav>
          <button onClick={toggleConnection} className={styles.headerBtn}>
            Connexion
          </button>
          <button
            className={styles.hamburgerBtn}
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(o => !o)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:24,height:24}}>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <Link href="/reserver" onClick={() => setMobileMenuOpen(false)}>Réserver</Link>
            <Link href="/agences" onClick={() => setMobileMenuOpen(false)}>Agences</Link>
            <Link href="/tracabilite" onClick={() => setMobileMenuOpen(false)}>Traçabilité</Link>
            <Link href="/location" onClick={() => setMobileMenuOpen(false)}>Location</Link>
            {isAgencyLoggedIn && <Link href="/agence/dashboard" onClick={() => setMobileMenuOpen(false)}>Admin</Link>}
          </div>
        )}
      </header>

      {/* Booking Layout Area */}
      <div className={styles.bookingContainer}>
        {/* Top Horizontal Search Capsule Container */}
        <div className={styles.searchCapsuleContainer}>
          {/* Trip Type Selector */}
          <div className={styles.tripTypeSelector}>
            <button 
              type="button"
              className={`${styles.tripTypeTab} ${!isRoundTrip ? styles.tripTypeTabActive : ""}`}
              onClick={(e) => { e.stopPropagation(); setIsRoundTrip(false); }}
            >
              Aller simple
            </button>
            <button 
              type="button"
              className={`${styles.tripTypeTab} ${isRoundTrip ? styles.tripTypeTabActive : ""}`}
              onClick={(e) => { e.stopPropagation(); setIsRoundTrip(true); }}
            >
              Aller-retour
            </button>
          </div>

          {/* Capsule Bar */}
          <div className={styles.searchCapsuleBar}>
            <div className={styles.capsuleItem}>
              <svg className={styles.capsuleIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8"></circle>
              </svg>
              <input 
                type="text" 
                placeholder="Ville de départ"
                value={departure} 
                onChange={(e) => {
                  setDeparture(e.target.value);
                  if (e.target.value === "") setHasSearched(false);
                }} 
                className={styles.capsuleInput} 
              />
            </div>

            <div className={styles.swapBtnBox}>
              <button className={styles.swapBtn} onClick={() => {
                const temp = departure;
                setDeparture(destination);
                setDestination(temp);
              }}>
                ⇄
              </button>
            </div>

            <div className={styles.capsuleItem}>
              <svg className={styles.capsuleIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8"></circle>
              </svg>
              <input 
                type="text" 
                placeholder="Ville de destination"
                value={destination} 
                onChange={(e) => {
                  setDestination(e.target.value);
                  if (e.target.value === "") setHasSearched(false);
                }} 
                className={styles.capsuleInput} 
              />
            </div>

            <div className={styles.capsuleItem}>
              <svg className={styles.capsuleIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <div className={styles.capsuleValueDisplay}>Aujourd'hui</div>
            </div>

            <div className={`${styles.capsuleItem} ${!isRoundTrip ? styles.capsuleDisabled : ""}`}>
              <svg className={styles.capsuleIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <div className={styles.capsuleValueDisplay} style={{ color: !isRoundTrip ? "#a0aec0" : "var(--primary-navy)" }}>
                {isRoundTrip ? "Date de retour" : "Aller simple"}
              </div>
            </div>

            <div className={styles.capsuleItem}>
              <svg className={styles.capsuleIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <div className={styles.capsuleValueDisplay}>1 passager</div>
            </div>

            <button 
              className={styles.capsuleSubmitBtn}
              onClick={() => {
                if (departure.trim() !== "" && destination.trim() !== "") {
                  setHasSearched(true);
                } else {
                  alert("Veuillez renseigner une ville de départ et de destination.");
                }
              }}
            >
              Rechercher
            </button>
          </div>
        </div>

        {/* Content Layout Split Grid */}
        <div className={styles.resultsGrid}>

          {/* Filter toggle for mobile */}
          <button
            className={styles.filterToggleBtn}
            onClick={() => setShowFilters(f => !f)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:16,height:16}}>
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          </button>

          {/* Left Column: Map & Sorting Filters */}
          <aside className={showFilters ? `${styles.sidebarCol} ${styles.sidebarColVisible}` : styles.sidebarCol}>
            {/* Interactive Map Card */}
            <div className={styles.mapCard}>
              <div className={styles.mapVisualOverlay}>
                {/* Micro SVG grid representing map streets */}
                <svg className={styles.mapStreetsSvg} viewBox="0 0 200 120" fill="none" stroke="rgba(10, 47, 29, 0.08)" strokeWidth="1.5">
                  <line x1="10" y1="0" x2="10" y2="120"></line>
                  <line x1="50" y1="0" x2="50" y2="120"></line>
                  <line x1="120" y1="0" x2="120" y2="120"></line>
                  <line x1="170" y1="0" x2="170" y2="120"></line>
                  <line x1="0" y1="30" x2="200" y2="30"></line>
                  <line x1="0" y1="80" x2="200" y2="80"></line>
                  <path d="M-10 50 Q 80 20, 210 90" stroke="rgba(0, 103, 60, 0.12)" strokeWidth="4"></path> {/* Main highway axis */}
                </svg>
                <button className={styles.mapBtn}>
                  <svg className={styles.mapBtnIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>Afficher sur la carte</span>
                </button>
              </div>
            </div>

            {/* Sorting Panel */}
            <div className={styles.filterCard}>
              <div className={styles.filterHeaderRow}>
                <h3>Trier par</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {activeSorts.length > 0 && (
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#00673C", background: "#eef8f3", padding: "2px 7px", borderRadius: 99 }}>
                      {activeSorts.length}/3
                    </span>
                  )}
                  <button className={styles.clearBtn} onClick={() => setActiveSorts([])}>Tout effacer</button>
                </div>
              </div>
              <p style={{ fontSize: "0.7rem", color: "#a0aec0", margin: "0 0 10px 0", fontWeight: 600 }}>
                Activez jusqu&apos;à 3 tris simultanément — le premier a la priorité
              </p>

              <div className={styles.filterOptionsList}>
                {[
                  { key: "time", label: "Départ le plus tôt", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.filterIcon}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  )},
                  { key: "price", label: "Prix le plus bas", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.filterIcon}><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  )},
                  { key: "duration", label: "Trajet le plus court", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.filterIcon}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                  )},
                ].map(({ key, label, icon }) => {
                  const isActive = activeSorts.includes(key);
                  const priority = activeSorts.indexOf(key) + 1;
                  return (
                    <div
                      key={key}
                      className={`${styles.filterItem} ${isActive ? styles.filterItemActive : ""}`}
                      onClick={() => toggleSort(key)}
                      style={{ position: "relative" }}
                    >
                      <span className={styles.radioDot} style={isActive ? { background: "#00673C", borderColor: "#00673C" } : {}}></span>
                      <span className={styles.filterLabel}>{label}</span>
                      {isActive && (
                        <span style={{ fontSize: "0.6rem", fontWeight: 900, background: "#00673C", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: "auto", flexShrink: 0 }}>
                          {priority}
                        </span>
                      )}
                      {icon}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Classe de voyage Panel */}
            <div className={styles.filterCard} style={{ marginTop: '10px' }}>
              <div className={styles.filterHeaderRow}>
                <h3>Classe de voyage</h3>
                <button 
                  className={styles.clearBtn} 
                  onClick={() => setSelectedClasses([])}
                  style={{ opacity: selectedClasses.length > 0 ? 1 : 0, pointerEvents: selectedClasses.length > 0 ? 'auto' : 'none' }}
                >
                  Tout effacer
                </button>
              </div>
              <div className={styles.amenitiesList}>
                {[
                  { key: "vip", label: "Classe VIP", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.filterIcon}><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>
                  )},
                  { key: "executive", label: "Executive Class", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.filterIcon}><polygon points="12 2 22 12 12 22 2 12 12 2"/></svg>
                  )},
                  { key: "classic", label: "Classe Classique", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.filterIcon}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 12l2 2 4-4"/></svg>
                  )}
                ].map((cls) => {
                  const isChecked = selectedClasses.includes(cls.key);
                  return (
                    <label 
                      key={cls.key} 
                      className={`${styles.amenityItem} ${isChecked ? styles.amenityItemActive : ""}`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedClasses(prev => prev.filter(k => k !== cls.key));
                          } else {
                            setSelectedClasses(prev => [...prev, cls.key]);
                          }
                        }}
                        className={styles.hiddenCheckbox}
                      />
                      <span className={styles.customCheckbox}>
                        {isChecked && (
                          <svg className={styles.checkMarkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className={styles.amenityLabel}>{cls.label}</span>
                      <span className={styles.amenityIconWrapper}>
                        {cls.icon}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Horaires de départ Panel */}
            <div className={styles.filterCard} style={{ marginTop: '10px' }}>
              <div className={styles.filterHeaderRow}>
                <h3>Horaires de départ</h3>
                <button 
                  className={styles.clearBtn} 
                  onClick={() => setSelectedTimeSlots([])}
                  style={{ opacity: selectedTimeSlots.length > 0 ? 1 : 0, pointerEvents: selectedTimeSlots.length > 0 ? 'auto' : 'none' }}
                >
                  Tout effacer
                </button>
              </div>
              <div className={styles.amenitiesList}>
                {[
                  { key: "morning", label: "Matin (06:00 - 12:00)", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.filterIcon}><path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M6.34 17.66l-1.41 1.41M12 20v2M17.66 17.66l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41"/><circle cx="12" cy="12" r="4"/></svg>
                  )},
                  { key: "afternoon", label: "Après-midi (12:00 - 18:00)", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.filterIcon}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  )},
                  { key: "evening", label: "Soir (18:00 - 00:00)", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.filterIcon}><path d="M12 3a9 9 0 1 0 9 9 9.75 9.75 0 0 0-6.74-9.47M22 3l-5 5M22 3v5M22 3h-5"/></svg>
                  )},
                  { key: "night", label: "Nuit (00:00 - 06:00)", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.filterIcon}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  )}
                ].map((slot) => {
                  const isChecked = selectedTimeSlots.includes(slot.key);
                  return (
                    <label 
                      key={slot.key} 
                      className={`${styles.amenityItem} ${isChecked ? styles.amenityItemActive : ""}`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedTimeSlots(prev => prev.filter(k => k !== slot.key));
                          } else {
                            setSelectedTimeSlots(prev => [...prev, slot.key]);
                          }
                        }}
                        className={styles.hiddenCheckbox}
                      />
                      <span className={styles.customCheckbox}>
                        {isChecked && (
                          <svg className={styles.checkMarkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className={styles.amenityLabel}>{slot.label}</span>
                      <span className={styles.amenityIconWrapper}>
                        {slot.icon}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Services et équipements Panel */}
            <div className={styles.filterCard} style={{ marginTop: '10px' }}>
              <div className={styles.filterHeaderRow}>
                <h3>Services et équipements</h3>
                <button 
                  className={styles.clearBtn} 
                  onClick={() => setSelectedAmenities([])}
                  style={{ opacity: selectedAmenities.length > 0 ? 1 : 0, pointerEvents: selectedAmenities.length > 0 ? 'auto' : 'none' }}
                >
                  Tout effacer
                </button>
              </div>

              <div className={styles.amenitiesList}>
                {amenitiesList.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity.key);
                  const count = journeysState.filter(j => j.amenityKeys?.includes(amenity.key)).length;

                  return (
                    <label 
                      key={amenity.key} 
                      className={`${styles.amenityItem} ${isChecked ? styles.amenityItemActive : ""}`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedAmenities(prev => prev.filter(k => k !== amenity.key));
                          } else {
                            setSelectedAmenities(prev => [...prev, amenity.key]);
                          }
                        }}
                        className={styles.hiddenCheckbox}
                      />
                      <span className={styles.customCheckbox}>
                        {isChecked && (
                          <svg className={styles.checkMarkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className={styles.amenityLabel}>{amenity.label}</span>
                      <span className={styles.amenityCount}>{count}</span>
                      <span className={styles.amenityIconWrapper}>
                        {renderAmenityIcon(amenity.icon)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right Column: Dynamic Ticket Listings */}
          <section className={styles.ticketsCol}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 0, padding: '64px 32px', background: '#ffffff', borderRadius: '20px', border: '1px solid rgba(0, 0, 0, 0.03)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid rgba(0, 103, 60, 0.1)', borderTop: '4px solid #00673C', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-navy)', marginTop: '20px', marginBottom: '8px' }}>Récupération des trajets</h3>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: '420px', margin: '0 auto', textAlign: 'center' }}>Connexion en cours avec votre base de données Supabase...</p>
              </div>
            ) : journeysState.length === 0 ? (
              <div className={styles.noResults} style={{ margin: 0, padding: '48px 32px', background: '#ffffff', borderRadius: '20px', border: '1px solid rgba(0, 0, 0, 0.03)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🚌</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '8px' }}>Aucun voyage programmé</h3>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.92rem', lineHeight: 1.5, maxWidth: '480px', margin: '0 auto' }}>Aucune agence de transport partenaire n'a encore publié de bus, de trajet ni d'horaire dans la base de données.</p>
                <p style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '16px' }}>SafeTrip © 2026 — Base de données en temps réel connectée 🇨🇲</p>
              </div>
            ) : !hasSearched ? (
              <div className={styles.popularContainer}>
                <div className={styles.popularIntro}>
                  <h2>Trajets les plus populaires 🔥</h2>
                  <p>Sélectionnez l'une des liaisons les plus fréquentées au Cameroun pour planifier instantanément votre trajet en bus, train ou covoiturage.</p>
                </div>

                <div className={styles.popularGrid}>
                  {popularRoutes.map((route) => (
                    <div 
                      key={route.id} 
                      className={styles.popularCard}
                      onClick={() => {
                        setDeparture(route.dep + ", Cameroun");
                        setDestination(route.arr + ", Cameroun");
                        setHasSearched(true);
                      }}
                    >
                      <div className={styles.popularCardRouteRow}>
                        <span className={styles.popularCity}>{route.dep}</span>
                        <span className={styles.popularArrow} style={{ color: route.iconColor }}>→</span>
                        <span className={styles.popularCity}>{route.arr}</span>
                      </div>

                      <div className={styles.popularCardOperators}>
                        <strong>Opérateurs :</strong> {route.operators}
                      </div>

                      <div className={styles.popularCardFooter}>
                        <span className={styles.popularPriceLabel}>À partir de</span>
                        <span className={styles.popularPriceVal}>{route.price} <span className={styles.popularCurrency}>FCFA</span></span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.popularHelpBox}>
                  <svg className={styles.helpIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Vous pouvez également saisir manuellement votre trajet en tapant les villes de départ et d'arrivée dans la barre de recherche ci-dessus puis en cliquant sur <strong>Rechercher</strong>.</span>
                </div>
              </div>
            ) : (
              <>
                {/* List Meta Header */}
                <div className={styles.resultsMetaHeader}>
                  <div className={styles.resultsHeaderTitleCol}>
                    <h2 className={styles.resultsRouteLabel}>Aujourd'hui <span>{departure.split(",")[0]} → {destination.split(",")[0]}</span></h2>
                    <button 
                      className={styles.backToPopularBtn} 
                      onClick={() => {
                        setDeparture("");
                        setDestination("");
                        setHasSearched(false);
                      }}
                    >
                      ← Retour aux trajets populaires
                    </button>
                  </div>
                  <span className={styles.resultsCountLabel}>{sortedJourneys.length} {sortedJourneys.length > 1 ? "trajets disponibles" : "trajet disponible"}</span>
                </div>

                {/* Rendered Journey Cards */}
                <div className={styles.journeyCardsList}>
                  {sortedJourneys.length > 0 ? (
                    sortedJourneys.map((j) => (
                      <div 
                        key={j.id} 
                        className={`${styles.journeyCard} ${selectedJourney === j.id ? styles.journeyCardSelected : ""}`}
                        onClick={() => setSelectedJourney(selectedJourney === j.id ? null : j.id)}
                      >
                        {/* Top Row: Times, Duration slider line, and Price column */}
                        <div className={styles.cardMainRow}>
                          <div className={styles.timeScheduleContainer}>
                            <div className={styles.timeCol}>
                              <span className={styles.timeValue}>{j.depTime}</span>
                              <span className={styles.stationLabel}>{j.depStation.split(" - ")[1] || j.depStation}</span>
                            </div>

                            {/* Slider Progress Bar */}
                            <div className={styles.durationSlider}>
                              <span className={styles.sliderDot}></span>
                              <div className={styles.sliderLine}>
                                <span className={styles.sliderDurationText}>{j.duration}</span>
                                {j.isNight && <span className={styles.nightIndicator}>🌙</span>}
                              </div>
                              <span className={styles.sliderDot}></span>
                            </div>

                            <div className={styles.timeCol}>
                              <span className={styles.timeValue}>{j.arrTime}</span>
                              <span className={styles.stationLabel}>{j.arrStation.split(" - ")[1] || j.arrStation}</span>
                            </div>
                          </div>

                          {/* Price Section */}
                          <div className={styles.priceColumn}>
                            <span className={styles.priceIntro}>À partir de</span>
                            <span className={styles.priceValue}>{j.price.toLocaleString()} <span className={styles.currency}>FCFA</span></span>
                            {j.warning && <span className={styles.warningLabel}>{j.warning}</span>}
                          </div>
                        </div>

                        {/* Bottom Row: Amenities, operator logo, booking button */}
                        <div className={styles.cardFooterRow}>
                          <div className={styles.operatorRow}>
                            <div className={styles.operatorLogoContainer}>
                              <img src={j.logo} alt={j.operator} className={styles.operatorLogoImage} />
                            </div>
                            <span className={styles.operatorName}>{j.operator}</span>
                          </div>

                          {/* Amenities Icons Row */}
                          <div className={styles.amenitiesRow}>
                            {j.amenities.slice(0, 3).map((a, idx) => (
                              <span key={idx} className={styles.amenityTag}>{a}</span>
                            ))}
                          </div>

                          {/* Action Button */}
                          <button
                            className={styles.bookBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJourney(j.id);
                            }}
                          >
                            Réserver
                          </button>
                        </div>

                        {/* Interactive confirmation panel when selected */}
                        {selectedJourney === j.id && (
                          <div className={styles.selectedPanel} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.selectedInfo}>
                              <h4>Voyage sélectionné avec succès !</h4>
                              <p>Départ de <strong>{j.depStation}</strong> à <strong>{j.depTime}</strong></p>
                            </div>
                            <button className={styles.confirmSelectionBtn} onClick={() => {
                              sessionStorage.setItem("safetrip_booking_journey", JSON.stringify(j));
                              window.location.href = "/reserver/confirmer";
                            }}>
                              Confirmer la réservation
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={styles.noResults}>
                      <h3>Aucun trajet disponible</h3>
                      <p>Essayez de modifier vos filtres ou de changer les agences de transport.</p>
                      <button 
                        className={styles.confirmSelectionBtn} 
                        style={{ marginTop: '12px' }}
                        onClick={() => {
                          setDeparture("");
                          setDestination("");
                          setHasSearched(false);
                        }}
                      >
                        Voir les trajets populaires
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}
