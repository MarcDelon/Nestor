"use client";

import styles from "./page.module.css";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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

interface Passenger {
  id: number;
  name: string;
  phone: string;
  seat: string;
  status: "Payé" | "Enregistré" | "En attente";
  luggageCount: number;
  luggageScanned: boolean;
}

const PARTNER_AGENCIES = [
  { name: "Finexs Voyage", logo: "/images/finexs.png", cert: "Partenaire Platine" },
  { name: "Buca Voyage", logo: "/images/bucavoyage.png", cert: "Partenaire Or" },
  { name: "General Express", logo: "/images/General.png", cert: "Partenaire Certifié" },
  { name: "Touristique Express", logo: "/images/Touristique.png", cert: "Partenaire National" },
  { name: "Men Travel", logo: "/images/mentravel.png", cert: "Partenaire Premium" }
];

export default function AgencyDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [selectedAgencyName, setSelectedAgencyName] = useState("Finexs Voyage");

  // Dashboard Core States
  const [journeysState, setJourneysState] = useState<Journey[]>([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
  const [passengersMap, setPassengersMap] = useState<{ [journeyId: number]: Passenger[] }>({});
  
  // Form States for planning a new trip
  const [depCity, setDepCity] = useState("");
  const [arrCity, setArrCity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [depTime, setDepTime] = useState("08:00");
  const [busClass, setBusClass] = useState("VIP");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
  // UI Interactions
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastSuccess, setIsToastSuccess] = useState(true);
  const [scanningPassenger, setScanningPassenger] = useState<Passenger | null>(null);
  const [activeScanJourneyId, setActiveScanJourneyId] = useState<number | null>(null);

  // Security Check and state loading
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("safetrip_logged_in") === "true";
    const role = localStorage.getItem("safetrip_user_role");
    
    if (!isLoggedIn || role !== "agency") {
      router.push("/login");
      return;
    }

    const storedEmail = localStorage.getItem("safetrip_user_email") || "";
    setEmail(storedEmail);

    const storedAgency = localStorage.getItem("safetrip_active_agency");
    if (storedAgency) {
      setSelectedAgencyName(storedAgency);
    } else {
      localStorage.setItem("safetrip_active_agency", "Finexs Voyage");
    }

    // Load journeys database from localStorage
    const saved = localStorage.getItem("safetrip_journeys");
    if (saved) {
      setJourneysState(JSON.parse(saved));
    } else {
      const defaultJourneys: Journey[] = [
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
          warning: "Bientôt complet"
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
          isNight: true
        }
      ];
      localStorage.setItem("safetrip_journeys", JSON.stringify(defaultJourneys));
      setJourneysState(defaultJourneys);
    }
    
    setIsMounted(true);
  }, []);

  // Filter journeys list to only display operations of the selected agency
  const agencyJourneys = journeysState.filter(j => 
    j.operator.toLowerCase().includes(selectedAgencyName.split(" ")[0].toLowerCase())
  );

  // Auto-set the first journey as default selected if none is active
  useEffect(() => {
    if (agencyJourneys.length > 0 && selectedJourneyId === null) {
      setSelectedJourneyId(agencyJourneys[0].id);
    }
  }, [agencyJourneys, selectedJourneyId]);

  // Generate simulated passenger lists for each trip
  useEffect(() => {
    if (journeysState.length === 0) return;
    
    const passengerTemplates = [
      { name: "Marc Ndip", phone: "+237 699 01 22 33", seat: "1A (VIP)", status: "Enregistré", luggageCount: 2, luggageScanned: true },
      { name: "Syntyche Toukam", phone: "+237 677 44 55 66", seat: "2B (VIP)", status: "Payé", luggageCount: 1, luggageScanned: false },
      { name: "Jean-Pierre Talla", phone: "+237 655 77 88 99", seat: "4C", status: "Payé", luggageCount: 3, luggageScanned: true },
      { name: "Carine Bella", phone: "+237 691 12 34 56", seat: "5D", status: "En attente", luggageCount: 0, luggageScanned: false },
      { name: "Patrick Fotso", phone: "+237 670 98 76 54", seat: "8A", status: "Payé", luggageCount: 2, luggageScanned: false },
      { name: "Sandra Kamdem", phone: "+237 650 11 22 33", seat: "9B", status: "Enregistré", luggageCount: 1, luggageScanned: true },
      { name: "Aboubakar Siddiki", phone: "+237 699 77 66 55", seat: "12C", status: "Payé", luggageCount: 2, luggageScanned: false },
      { name: "Chantal Ngo Ndom", phone: "+237 671 23 45 67", seat: "14D", status: "Payé", luggageCount: 3, luggageScanned: true }
    ];

    const newPassengersMap: { [journeyId: number]: Passenger[] } = {};
    
    journeysState.forEach(j => {
      const seedCount = 4 + (j.id % 4);
      const tripPassengers: Passenger[] = [];
      
      for (let i = 0; i < seedCount; i++) {
        const templateIdx = (j.id + i) % passengerTemplates.length;
        const temp = passengerTemplates[templateIdx];
        tripPassengers.push({
          id: i + 1,
          name: temp.name,
          phone: temp.phone,
          seat: temp.seat.includes("VIP") && !j.operator.toLowerCase().includes("vip") && !j.operator.toLowerCase().includes("executive") ? `${i + 3}A` : temp.seat,
          status: temp.status as any,
          luggageCount: temp.luggageCount,
          luggageScanned: temp.luggageScanned
        });
      }
      
      newPassengersMap[j.id] = tripPassengers;
    });

    setPassengersMap(newPassengersMap);
  }, [journeysState]);

  const showToast = (message: string, isSuccess = true) => {
    setToastMessage(message);
    setIsToastSuccess(isSuccess);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleLogout = () => {
    localStorage.setItem("safetrip_logged_in", "false");
    localStorage.removeItem("safetrip_user_role");
    localStorage.removeItem("safetrip_token");
    localStorage.removeItem("safetrip_user_email");
    localStorage.removeItem("safetrip_user_name");
    router.push("/login");
  };

  const handleAgencySwitch = (name: string) => {
    setSelectedAgencyName(name);
    localStorage.setItem("safetrip_active_agency", name);
    const firstJ = journeysState.find(j => 
      j.operator.toLowerCase().includes(name.split(" ")[0].toLowerCase())
    );
    if (firstJ) {
      setSelectedJourneyId(firstJ.id);
    } else {
      setSelectedJourneyId(null);
    }
    showToast(`Espace d'administration basculé sur ${name}.`);
  };

  const toggleFormAmenity = (key: string) => {
    if (selectedAmenities.includes(key)) {
      setSelectedAmenities(prev => prev.filter(k => k !== key));
    } else {
      setSelectedAmenities(prev => [...prev, key]);
    }
  };

  const handlePlanTrip = (e: React.FormEvent) => {
    e.preventDefault();

    if (!depCity || !arrCity || !ticketPrice) {
      showToast("Veuillez renseigner tous les champs obligatoires.", false);
      return;
    }

    const priceNum = parseInt(ticketPrice.replace(/\s/g, ""), 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("Veuillez saisir un prix valide supérieur à 0.", false);
      return;
    }

    const activeAgencyObj = PARTNER_AGENCIES.find(a => a.name === selectedAgencyName) || PARTNER_AGENCIES[0];
    
    const finalDepStation = `${depCity.trim()} - Agence ${activeAgencyObj.name} ${depCity.trim()}`;
    const finalArrStation = `${arrCity.trim()} - Agence ${activeAgencyObj.name} ${arrCity.trim()}`;
    
    const [hStr, mStr] = depTime.split(":");
    let h = parseInt(hStr, 10);
    let m = parseInt(mStr, 10);
    h += 4;
    m += 15;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
    if (h >= 24) {
      h -= 24;
    }
    const arrTimeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    const labelMapping: { [key: string]: string } = {
      wifi: "Wi-Fi",
      ac: "Climatisation",
      plug: "Prises électriques",
      toilet: "Toilettes",
      catering: "Restauration",
      pmr: "Accès PMR",
      instant: "Réservation instantanée",
      ebillet: "E-billets"
    };
    
    const labelAmenities = selectedAmenities.map(k => labelMapping[k] || k);
    if (busClass === "VIP") {
      labelAmenities.push("Sièges VIP");
    }

    const newJourney: Journey = {
      id: Date.now(),
      type: "bus",
      operator: `${activeAgencyObj.name} ${busClass}`,
      logo: activeAgencyObj.logo,
      depTime: depTime,
      arrTime: arrTimeStr,
      duration: "4h15",
      depStation: finalDepStation,
      arrStation: finalArrStation,
      price: priceNum,
      amenities: labelAmenities,
      amenityKeys: selectedAmenities
    };

    const updatedJourneys = [...journeysState, newJourney];
    localStorage.setItem("safetrip_journeys", JSON.stringify(updatedJourneys));
    setJourneysState(updatedJourneys);
    setSelectedJourneyId(newJourney.id);

    const defaultNewPassengers: Passenger[] = [
      { id: 1, name: "Albert Eyidi", phone: "+237 699 90 90 90", seat: "1A (VIP)", status: "Payé", luggageCount: 2, luggageScanned: false },
      { id: 2, name: "Marie-Louise Atangana", phone: "+237 671 80 80 80", seat: "2B (VIP)", status: "Payé", luggageCount: 1, luggageScanned: false }
    ];
    setPassengersMap(prev => ({
      ...prev,
      [newJourney.id]: defaultNewPassengers
    }));

    setDepCity("");
    setArrCity("");
    setTicketPrice("");
    setDepTime("08:00");
    setSelectedAmenities([]);
    
    showToast(`Super ! Le trajet ${depCity} → ${arrCity} (${depTime}) est planifié et publié sur SafeTrip.`);
  };

  const togglePassengerCheckIn = (passengerId: number) => {
    if (selectedJourneyId === null) return;
    
    setPassengersMap(prev => {
      const currentList = prev[selectedJourneyId] || [];
      const updatedList = currentList.map(p => {
        if (p.id === passengerId) {
          const nextStatus = (p.status === "Enregistré" ? "Payé" : "Enregistré") as "Payé" | "Enregistré" | "En attente";
          return { ...p, status: nextStatus };
        }
        return p;
      });
      return { ...prev, [selectedJourneyId]: updatedList };
    });
    
    showToast("Statut d'enregistrement du passager mis à jour.");
  };

  const handleOpenScanner = (passenger: Passenger) => {
    setScanningPassenger(passenger);
    setActiveScanJourneyId(selectedJourneyId);
  };

  const handleSimulateScanSuccess = () => {
    if (scanningPassenger === null || activeScanJourneyId === null) return;

    setPassengersMap(prev => {
      const currentList = prev[activeScanJourneyId] || [];
      const updatedList = currentList.map(p => {
        if (p.id === scanningPassenger.id) {
          return { ...p, status: "Enregistré" as const, luggageScanned: true };
        }
        return p;
      });
      return { ...prev, [activeScanJourneyId]: updatedList };
    });

    showToast(`QR Code validé ! Passager ${scanningPassenger.name} enregistré et bagages scannés.`);
    setScanningPassenger(null);
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
          <p style={{ color: "#718096", fontSize: "0.85rem", margin: 0, fontWeight: 500 }}>Chargement de l&apos;espace agence...</p>
        </div>
      </div>
    );
  }

  const activeAgencyObj = PARTNER_AGENCIES.find(a => a.name === selectedAgencyName) || PARTNER_AGENCIES[0];
  const activePassengers = selectedJourneyId !== null ? (passengersMap[selectedJourneyId] || []) : [];

  const totalSales = agencyJourneys.reduce((sum, j) => {
    const passCount = passengersMap[j.id]?.length || 4;
    return sum + (j.price * passCount);
  }, 0);
  
  const totalLuggage = agencyJourneys.reduce((sum, j) => {
    const list = passengersMap[j.id] || [];
    return sum + list.reduce((lSum, p) => lSum + p.luggageCount, 0);
  }, 0);

  const scannedLuggage = agencyJourneys.reduce((sum, j) => {
    const list = passengersMap[j.id] || [];
    return sum + list.filter(p => p.luggageScanned).reduce((lSum, p) => lSum + p.luggageCount, 0);
  }, 0);

  return (
    <main className={styles.main}>
      <div className={styles.fullscreenWorkspace}>
        {toastMessage && (
          <div className={`${styles.toast} ${isToastSuccess ? styles.toastSuccess : ""}`}>
            <span>{toastMessage}</span>
            <button className={styles.toastClose} onClick={() => setToastMessage(null)}>×</button>
          </div>
        )}

        {/* Agency Banner Info */}
        <div className={styles.agencyBanner} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className={styles.agencyInfo}>
            <div className={styles.agencyLogoCircle}>
              <img src={activeAgencyObj.logo} alt={activeAgencyObj.name} />
            </div>
            <div className={styles.agencyText}>
              <h1 style={{ color: "#ffffff" }}>{activeAgencyObj.name}</h1>
              <span className={styles.agencyBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {activeAgencyObj.cert}
              </span>
            </div>
          </div>

          <div className={styles.bannerControls} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>BASCULER D&apos;AGENCE :</span>
            <select 
              className={styles.agencySelector}
              value={selectedAgencyName}
              onChange={(e) => handleAgencySwitch(e.target.value)}
            >
              {PARTNER_AGENCIES.map(agency => (
                <option key={agency.name} value={agency.name}>
                  {agency.name}
                </option>
              ))}
            </select>

            <button 
              type="button" 
              onClick={handleLogout} 
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginLeft: "12px",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "var(--accent-red)"}
              onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "13px", height: "13px" }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Déconnexion
            </button>
          </div>
        </div>

        {/* KPI Cards section */}
        <div className={styles.statsGrid}>
          {/* Sales Card */}
          <div className={styles.statCard}>
            <div className={styles.statIconBox} style={{ background: "#eef8f3", color: "var(--secondary-blue)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className={styles.statValueContainer}>
              <span className={styles.statLabel}>Chiffre d&apos;Affaires</span>
              <span className={styles.statValue}>{totalSales.toLocaleString()} FCFA</span>
              <span className={`${styles.statTrend} ${styles.trendUp}`}>
                ▲ +14% aujourd&apos;hui
              </span>
            </div>
          </div>

          {/* Trajets Actifs */}
          <div className={styles.statCard}>
            <div className={styles.statIconBox} style={{ background: "#fffaf0", color: "var(--accent-gold)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className={styles.statValueContainer}>
              <span className={styles.statLabel}>Trajets Actifs</span>
              <span className={styles.statValue}>{agencyJourneys.length} Horaires</span>
              <span className={styles.statTrend} style={{ color: "#718096" }}>
                ● 100% opérationnels
              </span>
            </div>
          </div>

          {/* Taux de Remplissage */}
          <div className={styles.statCard}>
            <div className={styles.statIconBox} style={{ background: "#ebf8ff", color: "#3182ce" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className={styles.statValueContainer}>
              <span className={styles.statLabel}>Taux Moyen</span>
              <span className={styles.statValue}>84.5%</span>
              <span className={`${styles.statTrend} ${styles.trendUp}`}>
                ▲ +3.2% vs hier
              </span>
            </div>
          </div>

          {/* Bagages Scannés */}
          <div className={styles.statCard}>
            <div className={styles.statIconBox} style={{ background: "#fff5f5", color: "var(--accent-red)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className={styles.statValueContainer}>
              <span className={styles.statLabel}>Colis & Bagages</span>
              <span className={styles.statValue}>{scannedLuggage} / {totalLuggage}</span>
              <span className={styles.statTrend} style={{ color: "#718096" }}>
                ● {totalLuggage > 0 ? Math.round((scannedLuggage / totalLuggage) * 100) : 0}% QR-scannés
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Dual Grid Workspace */}
        <div className={styles.dashboardGrid}>
          {/* Left Column: Form Section */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "16px", height: "16px", marginRight: "6px" }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Planifier un nouveau trajet
              </h2>
            </div>

            <div className={styles.panelBody}>
              <form onSubmit={handlePlanTrip} className={styles.scheduleForm}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ville de Départ *</label>
                    <select 
                      className={styles.formSelect}
                      value={depCity}
                      onChange={(e) => setDepCity(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="Douala">Douala</option>
                      <option value="Yaoundé">Yaoundé</option>
                      <option value="Bafoussam">Bafoussam</option>
                      <option value="Garoua">Garoua</option>
                      <option value="Kribi">Kribi</option>
                      <option value="Ngaoundéré">Ngaoundéré</option>
                      <option value="Maroua">Maroua</option>
                      <option value="Bamenda">Bamenda</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ville d&apos;Arrivée *</label>
                    <select 
                      className={styles.formSelect}
                      value={arrCity}
                      onChange={(e) => setArrCity(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="Douala">Douala</option>
                      <option value="Yaoundé">Yaoundé</option>
                      <option value="Bafoussam">Bafoussam</option>
                      <option value="Garoua">Garoua</option>
                      <option value="Kribi">Kribi</option>
                      <option value="Ngaoundéré">Ngaoundéré</option>
                      <option value="Maroua">Maroua</option>
                      <option value="Bamenda">Bamenda</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Prix du billet (FCFA) *</label>
                    <input 
                      type="text"
                      placeholder="ex: 6000"
                      className={styles.formInput}
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Heure de Départ *</label>
                    <input 
                      type="time"
                      className={styles.formInput}
                      value={depTime}
                      onChange={(e) => setDepTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Classe du Bus</label>
                    <select 
                      className={styles.formSelect}
                      value={busClass}
                      onChange={(e) => setBusClass(e.target.value)}
                    >
                      <option value="VIP">VIP Bus (Premium Confort)</option>
                      <option value="Confort">Confort (Standard climatisé)</option>
                      <option value="Classique">Classique (Standard)</option>
                      <option value="Executive Class">Executive Class (Luxe)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Durée estimée</label>
                    <input 
                      type="text"
                      className={styles.formInput}
                      value="4h15 (Axe principal)"
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <h4 className={styles.amenitiesHeading}>Équipements & Services à Bord</h4>
                  <div className={styles.amenitiesGrid}>
                    <label className={`${styles.amenityCheckLabel} ${selectedAmenities.includes("wifi") ? styles.amenityChecked : ""}`}>
                      <input 
                        type="checkbox"
                        className={styles.amenityCheckInput}
                        checked={selectedAmenities.includes("wifi")}
                        onChange={() => toggleFormAmenity("wifi")}
                      />
                      Wi-Fi
                    </label>
                    <label className={`${styles.amenityCheckLabel} ${selectedAmenities.includes("ac") ? styles.amenityChecked : ""}`}>
                      <input 
                        type="checkbox"
                        className={styles.amenityCheckInput}
                        checked={selectedAmenities.includes("ac")}
                        onChange={() => toggleFormAmenity("ac")}
                      />
                      Climatisation
                    </label>
                    <label className={`${styles.amenityCheckLabel} ${selectedAmenities.includes("plug") ? styles.amenityChecked : ""}`}>
                      <input 
                        type="checkbox"
                        className={styles.amenityCheckInput}
                        checked={selectedAmenities.includes("plug")}
                        onChange={() => toggleFormAmenity("plug")}
                      />
                      Prises USB/élec
                    </label>
                    <label className={`${styles.amenityCheckLabel} ${selectedAmenities.includes("toilet") ? styles.amenityChecked : ""}`}>
                      <input 
                        type="checkbox"
                        className={styles.amenityCheckInput}
                        checked={selectedAmenities.includes("toilet")}
                        onChange={() => toggleFormAmenity("toilet")}
                      />
                      Toilettes
                    </label>
                    <label className={`${styles.amenityCheckLabel} ${selectedAmenities.includes("catering") ? styles.amenityChecked : ""}`}>
                      <input 
                        type="checkbox"
                        className={styles.amenityCheckInput}
                        checked={selectedAmenities.includes("catering")}
                        onChange={() => toggleFormAmenity("catering")}
                      />
                      Collation
                    </label>
                    <label className={`${styles.amenityCheckLabel} ${selectedAmenities.includes("pmr") ? styles.amenityChecked : ""}`}>
                      <input 
                        type="checkbox"
                        className={styles.amenityCheckInput}
                        checked={selectedAmenities.includes("pmr")}
                        onChange={() => toggleFormAmenity("pmr")}
                      />
                      Accès PMR
                    </label>
                    <label className={`${styles.amenityCheckLabel} ${selectedAmenities.includes("instant") ? styles.amenityChecked : ""}`}>
                      <input 
                        type="checkbox"
                        className={styles.amenityCheckInput}
                        checked={selectedAmenities.includes("instant")}
                        onChange={() => toggleFormAmenity("instant")}
                      />
                      Instantané
                    </label>
                    <label className={`${styles.amenityCheckLabel} ${selectedAmenities.includes("ebillet") ? styles.amenityChecked : ""}`}>
                      <input 
                        type="checkbox"
                        className={styles.amenityCheckInput}
                        checked={selectedAmenities.includes("ebillet")}
                        onChange={() => toggleFormAmenity("ebillet")}
                      />
                      E-billet
                    </label>
                  </div>
                </div>

                <button type="submit" className={styles.submitFormBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "6px" }}>
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Publier le Trajet
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Active Trajets & Passenger Roster */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "16px", height: "16px", marginRight: "6px" }}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Horaires actifs de l&apos;agence
              </h2>
            </div>

            <div className={styles.panelBody}>
              {agencyJourneys.length === 0 ? (
                <div className={styles.emptyState}>
                  Aucun trajet planifié pour le moment pour cette agence. Utilisez le planificateur à gauche.
                </div>
              ) : (
                agencyJourneys.map(j => (
                  <div 
                    key={j.id} 
                    className={`${styles.tripItem} ${selectedJourneyId === j.id ? styles.tripItemActive : ""}`}
                    onClick={() => setSelectedJourneyId(j.id)}
                  >
                    <div className={styles.tripHeader}>
                      <span className={styles.tripRoute}>
                        {j.depStation.split(" - ")[0]} → {j.arrStation.split(" - ")[0]}
                      </span>
                      <span className={styles.tripPriceBadge}>
                        {j.price.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className={styles.tripMeta}>
                      <div className={styles.tripMetaItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "13px", height: "13px", marginRight: "4px" }}>
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {j.depTime} ({j.duration})
                      </div>
                      <div className={styles.tripMetaItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "13px", height: "13px", marginRight: "4px" }}>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        {passengersMap[j.id]?.length || 0} Passagers
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Active Passenger list Roster */}
              {selectedJourneyId !== null && (
                <div className={styles.passengerSection}>
                  <h3 className={styles.sectionSubHeading}>
                    <span>Liste de Passagers & Enregistrement</span>
                    <span style={{ fontSize: "0.75rem", background: "var(--secondary-blue)", color: "#ffffff", padding: "3px 10px", borderRadius: "10px" }}>
                      Bus Actif #{selectedJourneyId.toString().slice(-4)}
                    </span>
                  </h3>
                  
                  {activePassengers.length === 0 ? (
                    <div className={styles.emptyState} style={{ padding: "20px" }}>
                      Aucun passager enregistré sur ce bus.
                    </div>
                  ) : (
                    <div className={styles.rosterTableContainer}>
                      <table className={styles.rosterTable}>
                        <thead>
                          <tr>
                            <th>Passager</th>
                            <th>Siège</th>
                            <th>Statut</th>
                            <th>Bagages</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activePassengers.map(p => (
                            <tr key={p.id}>
                              <td>
                                <div className={styles.passengerNameCell}>
                                  <strong>{p.name}</strong>
                                  <span className={styles.passengerPhone}>{p.phone}</span>
                                </div>
                              </td>
                              <td>
                                <span className={styles.seatBadge}>{p.seat}</span>
                              </td>
                              <td>
                                <span 
                                  className={`${styles.statusPill} ${
                                    p.status === "Enregistré" ? styles.statusChecked : 
                                    p.status === "Payé" ? styles.statusPaid : styles.statusPending
                                  }`}
                                  onClick={() => togglePassengerCheckIn(p.id)}
                                  style={{ cursor: "pointer" }}
                                  title="Cliquez pour changer d'enregistrement"
                                >
                                  {p.status}
                                </span>
                              </td>
                              <td>
                                <div className={styles.luggageCell}>
                                  {p.luggageCount > 0 ? (
                                    p.luggageScanned ? (
                                      <span className={styles.luggageScannedText}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="#2f855a" strokeWidth="3" style={{width:"12px",height:"12px",marginRight:"4.5px",display:"inline-block",verticalAlign:"middle"}}><polyline points="20 6 9 17 4 12"/></svg>{p.luggageCount} Colis
                                      </span>
                                    ) : (
                                      <button 
                                        className={styles.scanLuggageBtn}
                                        onClick={() => handleOpenScanner(p)}
                                      >
                                        Scanner ({p.luggageCount})
                                      </button>
                                    )
                                  ) : (
                                    <span style={{ color: "#cbd5e0" }}>Aucun</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simulated QR Code Luggage Scanner Overlay Modal */}
      {scanningPassenger && (
        <div className={styles.scannerModalOverlay} onClick={() => setScanningPassenger(null)}>
          <div className={styles.scannerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.scannerHeader}>
              <h3>Lecteur de Billets & Bagages SafeTrip</h3>
              <button className={styles.closeModalBtn} onClick={() => setScanningPassenger(null)}>×</button>
            </div>
            
            <div className={styles.scannerBody}>
              <div className={styles.scanBoxFrame}>
                <div className={styles.scanLaser}></div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M7 7h2v2H7zm0 8h2v2H7zm8-8h2v2h-2zm3 11a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1zm-4-3v2m3-2v2" />
                </svg>
              </div>
              
              <div className={styles.scannerInstructions}>
                <strong style={{ display: "block", color: "#1a202c", marginBottom: "5px" }}>
                  Passager: {scanningPassenger.name}
                </strong>
                Siège: {scanningPassenger.seat} • Téléphone: {scanningPassenger.phone} <br />
                Veuillez pointer le QR code du billet ou du tag bagage ({scanningPassenger.luggageCount} colis) devant l&apos;appareil.
              </div>

              <button 
                className={styles.simulateSuccessBtn}
                onClick={handleSimulateScanSuccess}
              >
                Simuler un scan réussi
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
