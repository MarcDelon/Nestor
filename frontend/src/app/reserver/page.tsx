"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
import Link from "next/link";

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
  warning?: string;
  isNight?: boolean;
}

const amenitiesList = [
  { key: "maxBack", label: "Max. 2 à l'arrière", icon: "users" },
  { key: "instant", label: "Réservation instantanée", icon: "zap" },
  { key: "smoking", label: "Cigarette autorisée", icon: "cigarette" },
  { key: "pets", label: "Animaux de compagnie autorisés", icon: "paw" },
  { key: "reclining", label: "Sièges inclinables", icon: "reclining" },
  { key: "plug", label: "Prises électriques", icon: "plug" },
  { key: "wifi", label: "Wi-Fi", icon: "wifi" },
  { key: "toilet", label: "Toilettes", icon: "toilet" },
  { key: "ac", label: "Climatisation", icon: "wind" },
  { key: "ebillet", label: "E-billets", icon: "ticket" },
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

const journeys: Journey[] = [
  {
    id: 1,
    type: "bus",
    operator: "Finexs Voyage VIP",
    logo: "/images/finexs.png",
    depTime: "06:15",
    arrTime: "10:30",
    duration: "4h15",
    depStation: "Douala - Agence Finexs Douala",
    arrStation: "Yaoundé - Agence Finexs Mvan",
    price: 6000,
    amenities: ["USB", "AC", "Sièges VIP"],
    amenityKeys: ["instant", "reclining", "plug", "ac", "ebillet", "toilet"]
  },
  {
    id: 2,
    type: "bus",
    operator: "Finexs Voyage VIP",
    logo: "/images/finexs.png",
    depTime: "08:00",
    arrTime: "12:15",
    duration: "4h15",
    depStation: "Douala - Agence Finexs Douala",
    arrStation: "Yaoundé - Agence Finexs Mvan",
    price: 4000,
    amenities: ["USB", "AC", "Sièges VIP"],
    amenityKeys: ["instant", "reclining", "plug", "ac", "ebillet"]
  },
  {
    id: 3,
    type: "bus",
    operator: "Buca Voyage Confort",
    logo: "/images/bucavoyage.png",
    depTime: "10:30",
    arrTime: "14:45",
    duration: "4h15",
    depStation: "Douala - Agence Buca Bessengue",
    arrStation: "Yaoundé - Agence Buca Mvan",
    price: 6000,
    amenities: ["Prises", "Sièges VIP"],
    amenityKeys: ["instant", "reclining", "plug", "ac", "ebillet", "smoking"],
    warning: "Bientôt complet",
  },
  {
    id: 4,
    type: "bus",
    operator: "General Express Confort",
    logo: "/images/General.png",
    depTime: "13:00",
    arrTime: "17:15",
    duration: "4h15",
    depStation: "Douala - Bessengue",
    arrStation: "Yaoundé - Mvan",
    price: 5000,
    amenities: ["AC", "Prises"],
    amenityKeys: ["ac", "ebillet", "pets", "instant"]
  },
  {
    id: 5,
    type: "bus",
    operator: "Touristique Express VIP",
    logo: "/images/Touristique.png",
    depTime: "15:00",
    arrTime: "19:15",
    duration: "4h15",
    depStation: "Douala - Agence Touristique Akwa",
    arrStation: "Yaoundé - Agence Touristique Mvan",
    price: 5000,
    amenities: ["AC", "Prises", "Sièges VIP"],
    amenityKeys: ["instant", "reclining", "plug", "ac", "ebillet", "toilet"]
  },
  {
    id: 6,
    type: "bus",
    operator: "Men Travel Executive Class",
    logo: "/images/mentravel.png",
    depTime: "16:30",
    arrTime: "20:45",
    duration: "4h15",
    depStation: "Douala - Carrefour Akwa",
    arrStation: "Yaoundé - Mvan",
    price: 8000,
    amenities: ["Wi-Fi", "AC", "Restauration", "Prises", "Boisson offerte"],
    amenityKeys: ["instant", "reclining", "plug", "ac", "ebillet", "toilet", "wifi", "catering", "pmr"]
  },
  {
    id: 7,
    type: "bus",
    operator: "Finexs Voyage Classique",
    logo: "/images/finexs.png",
    depTime: "18:30",
    arrTime: "22:45",
    duration: "4h15",
    depStation: "Douala - Agence Finexs Douala",
    arrStation: "Yaoundé - Agence Finexs Mvan",
    price: 3000,
    amenities: ["AC"],
    amenityKeys: ["instant", "reclining", "plug", "ac", "ebillet"]
  },
  {
    id: 8,
    type: "bus",
    operator: "Buca Voyage Classique",
    logo: "/images/bucavoyage.png",
    depTime: "19:00",
    arrTime: "23:15",
    duration: "4h15",
    depStation: "Douala - Bessengue",
    arrStation: "Yaoundé - Mvan",
    price: 3000,
    amenities: ["AC"],
    amenityKeys: ["smoking", "reclining", "plug"],
    isNight: true,
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
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [activeSort, setActiveSort] = useState<"time" | "price" | "duration">("price");
  const [selectedJourney, setSelectedJourney] = useState<number | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const [isAgencyLoggedIn, setIsAgencyLoggedIn] = useState(false);
  const [journeysState, setJourneysState] = useState<Journey[]>([]);

  useEffect(() => {
    // 1. Sync connection status
    const loginStatus = localStorage.getItem("safetrip_agency_logged_in") === "true";
    setIsAgencyLoggedIn(loginStatus);

    // 2. Fetch journeys list from the actual database API
    const fetchJourneys = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/agency/journeys/all");
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
            warning: j.warning,
            isNight: j.is_night
          }));
          setJourneysState(formatted);
          localStorage.setItem("safetrip_journeys", JSON.stringify(formatted));
        } else {
          setJourneysState([]);
        }
      } catch (err) {
        console.warn("⚠️ API non joignable pour les trajets, utilisation du stockage local.", err);
        const saved = localStorage.getItem("safetrip_journeys");
        if (saved) {
          setJourneysState(JSON.parse(saved));
        } else {
          setJourneysState([]);
        }
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

    return true;
  });

  // Sorting
  const sortedJourneys = [...filteredJourneys].sort((a, b) => {
    if (activeSort === "price") return a.price - b.price;
    if (activeSort === "time") return a.depTime.localeCompare(b.depTime);
    if (activeSort === "duration") return a.duration.localeCompare(b.duration);
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
            <Link href="/#reserver">Réserver</Link>
            <Link href="/#agences">Agences</Link>
            <Link href="/#tracabilite">Traçabilité</Link>
            {isAgencyLoggedIn && <Link href="/agence/dashboard" style={{ color: "var(--accent-gold)", fontWeight: 800 }}>Admin</Link>}
          </nav>
          <button onClick={toggleConnection} className={styles.headerBtn}>
            Connexion
          </button>
        </div>
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
          
          {/* Left Column: Map & Sorting Filters */}
          <aside className={styles.sidebarCol}>
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
                <button className={styles.clearBtn} onClick={() => setActiveSort("price")}>Tout effacer</button>
              </div>

              <div className={styles.filterOptionsList}>
                <div 
                  className={`${styles.filterItem} ${activeSort === "time" ? styles.filterItemActive : ""}`}
                  onClick={() => setActiveSort("time")}
                >
                  <span className={styles.radioDot}></span>
                  <span className={styles.filterLabel}>Départ le plus tôt</span>
                  <svg className={styles.filterIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>

                <div 
                  className={`${styles.filterItem} ${activeSort === "price" ? styles.filterItemActive : ""}`}
                  onClick={() => setActiveSort("price")}
                >
                  <span className={styles.radioDot}></span>
                  <span className={styles.filterLabel}>Prix le plus bas</span>
                  <svg className={styles.filterIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                    <line x1="12" y1="4" x2="12" y2="20"></line>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                </div>

                <div 
                  className={`${styles.filterItem} ${activeSort === "duration" ? styles.filterItemActive : ""}`}
                  onClick={() => setActiveSort("duration")}
                >
                  <span className={styles.radioDot}></span>
                  <span className={styles.filterLabel}>Trajet le plus court</span>
                  <svg className={styles.filterIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 14 14"></polyline>
                  </svg>
                </div>
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
                  const count = journeys.filter(j => j.amenityKeys?.includes(amenity.key)).length;

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
            {journeysState.length === 0 ? (
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
                          <button className={styles.bookBtn}>
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
                              localStorage.setItem("safetrip_booking_journey", JSON.stringify(j));
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
