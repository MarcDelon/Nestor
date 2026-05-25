"use client";

import styles from "./page.module.css";
import { useState, useEffect, useRef } from "react";
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

// Initial partner agencies data
const PARTNER_AGENCIES = [
  { name: "Finexs Voyage", logo: "/images/finexs.png", cert: "Partenaire Platine" },
  { name: "Buca Voyage", logo: "/images/bucavoyage.png", cert: "Partenaire Or" },
  { name: "General Express", logo: "/images/General.png", cert: "Partenaire Certifié" },
  { name: "Touristique Express", logo: "/images/Touristique.png", cert: "Partenaire National" },
  { name: "Men Travel", logo: "/images/mentravel.png", cert: "Partenaire Premium" }
];

interface Billet {
  id: string;
  from: string;
  to: string;
  company: string;
  companyLogo: string;
  date: string;
  depTime: string;
  arrTime: string;
  duration: string;
  seat: string;
  luggageCount: number;
  status: "Actif" | "Complété" | "Annulé";
  price: number;
  depStation: string;
  arrStation: string;
  passenger: string;
  phone: string;
  busClass: string;
}

const MOCK_BILLETS: Billet[] = [
  {
    id: "ST-2026-FX58",
    from: "Douala",
    to: "Yaoundé",
    company: "Finexs Voyage VIP",
    companyLogo: "/images/finexs.png",
    date: "25 Mai 2026",
    depTime: "06:15",
    arrTime: "10:30",
    duration: "4h15",
    seat: "2B (VIP)",
    luggageCount: 2,
    status: "Actif",
    price: 6000,
    depStation: "Agence Finexs Douala-Akwa",
    arrStation: "Agence Finexs Mvan Yaoundé",
    passenger: "Marc Nzenang",
    phone: "+237 655 46 26 42",
    busClass: "VIP"
  },
  {
    id: "ST-2026-BV33",
    from: "Yaoundé",
    to: "Bafoussam",
    company: "Buca Voyage Confort",
    companyLogo: "/images/bucavoyage.png",
    date: "18 Avril 2026",
    depTime: "08:00",
    arrTime: "12:30",
    duration: "4h30",
    seat: "5A",
    luggageCount: 1,
    status: "Complété",
    price: 4500,
    depStation: "Agence Buca Mvan Yaoundé",
    arrStation: "Agence Buca Bafoussam Centre",
    passenger: "Marc Nzenang",
    phone: "+237 655 46 26 42",
    busClass: "Confort"
  },
  {
    id: "ST-2026-GE21",
    from: "Douala",
    to: "Limbé",
    company: "General Express",
    companyLogo: "/images/General.png",
    date: "05 Mars 2026",
    depTime: "11:00",
    arrTime: "13:15",
    duration: "2h15",
    seat: "8C",
    luggageCount: 0,
    status: "Complété",
    price: 2500,
    depStation: "Agence General Express Bessengue",
    arrStation: "Terminus Limbé",
    passenger: "Marc Nzenang",
    phone: "+237 655 46 26 42",
    busClass: "Classique"
  }
];

interface Colis {
  id: string;
  label: string;
  type: "Valise" | "Sac" | "Carton" | "Sac à dos" | "Colis";
  weight: number;
  color: string;
  status: "À bord du bus" | "En transit" | "Livré" | "En attente de scan" | "Scanné en gare";
  trip: string;
  tripDate: string;
  agency: string;
  agencyLogo: string;
  qrRef: string;
  scannedAt?: string;
  dimensions?: string;
  fragile: boolean;
  notes?: string;
}

const MOCK_COLIS: Colis[] = [
  {
    id: "BAG-2026-FX58-A",
    label: "Sac de Voyage principal",
    type: "Sac",
    weight: 15,
    color: "Noir",
    status: "À bord du bus",
    trip: "Douala → Yaoundé",
    tripDate: "25 Mai 2026 · 06:15",
    agency: "Finexs Voyage VIP",
    agencyLogo: "/images/finexs.png",
    qrRef: "QR-FX58-A",
    scannedAt: "25 Mai 2026 à 05:58",
    dimensions: "55 × 35 × 20 cm",
    fragile: false,
    notes: "Étiquette verte fixée"
  },
  {
    id: "BAG-2026-FX58-B",
    label: "Carton scellé (Restauration)",
    type: "Carton",
    weight: 8,
    color: "Brun",
    status: "À bord du bus",
    trip: "Douala → Yaoundé",
    tripDate: "25 Mai 2026 · 06:15",
    agency: "Finexs Voyage VIP",
    agencyLogo: "/images/finexs.png",
    qrRef: "QR-FX58-B",
    scannedAt: "25 Mai 2026 à 06:02",
    dimensions: "40 × 30 × 30 cm",
    fragile: true,
    notes: "FRAGILE — Contenu alimentaire"
  },
  {
    id: "BAG-2026-BV33-A",
    label: "Valise cabine",
    type: "Valise",
    weight: 12,
    color: "Bordeaux",
    status: "Livré",
    trip: "Yaoundé → Bafoussam",
    tripDate: "18 Avril 2026 · 08:00",
    agency: "Buca Voyage Confort",
    agencyLogo: "/images/bucavoyage.png",
    qrRef: "QR-BV33-A",
    scannedAt: "18 Avril 2026 à 12:28",
    dimensions: "50 × 40 × 25 cm",
    fragile: false
  }
];

export default function AgencyDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [userRole, setUserRole] = useState<"client" | "agency" | "admin">("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAgencyName, setSelectedAgencyName] = useState("Finexs Voyage");

  // Traveler registration states
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [clientActiveTab, setClientActiveTab] = useState("dashboard");
  const [selectedBillet, setSelectedBillet] = useState<Billet | null>(null);
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const digitalTicketRef = useRef<HTMLDivElement>(null);
  
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

  // Profile States
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileFullName, setProfileFullName] = useState("");
  const [profilePhone, setProfilePhone] = useState("+237 655 46 26 42");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  
  // Load initial states
  useEffect(() => {
    // 1. Check if logged in
    const loginStatus = localStorage.getItem("safetrip_logged_in") === "true";
    setIsLoggedIn(loginStatus);
    const role = (localStorage.getItem("safetrip_user_role") || "client") as "client" | "agency" | "admin";
    setUserRole(role);
    
    // Read or initialize selected agency name
    const storedAgency = localStorage.getItem("safetrip_active_agency");
    if (storedAgency) {
      setSelectedAgencyName(storedAgency);
    } else {
      localStorage.setItem("safetrip_active_agency", "Finexs Voyage");
    }

    // 2. Read journeys database from localStorage
    const saved = localStorage.getItem("safetrip_journeys");
    if (saved) {
      setJourneysState(JSON.parse(saved));
    } else {
      // If none, we define the default 8 items
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

    // 3. Load profile data from localStorage
    const savedProfile = localStorage.getItem("safetrip_profile");
    if (savedProfile) {
      try {
        const p = JSON.parse(savedProfile);
        if (p.fullName) setProfileFullName(p.fullName);
        if (p.phone) setProfilePhone(p.phone);
        if (p.address) setProfileAddress(p.address);
        if (p.city) setProfileCity(p.city);
        if (p.photo) setProfilePhoto(p.photo);
      } catch { /* ignore parse errors */ }
    }
    // If no saved name, derive from localStorage user name or email
    const storedUserName = localStorage.getItem("safetrip_user_name");
    const storedEmail = localStorage.getItem("safetrip_user_email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
    if (!savedProfile || !JSON.parse(savedProfile || "{}").fullName) {
      if (storedUserName) {
        setProfileFullName(storedUserName);
      } else if (storedEmail) {
        setProfileFullName(storedEmail.split("@")[0]);
      }
    }
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
      // Seed passengers based on journey ID
      const seedCount = 4 + (j.id % 4); // 4 to 7 passengers
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

  // Handle Toast popups
  const showToast = (message: string, isSuccess = true) => {
    setToastMessage(message);
    setIsToastSuccess(isSuccess);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Perform Simulated or Real Backend Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Veuillez renseigner votre email et mot de passe.", false);
      return;
    }

    try {
      // 1. Attempt actual backend API call
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        localStorage.setItem("safetrip_logged_in", "true");
        localStorage.setItem("safetrip_token", data.token);
        localStorage.setItem("safetrip_user_role", data.user.role);
        localStorage.setItem("safetrip_user_email", data.user.email);
        localStorage.setItem("safetrip_user_name", data.user.fullName);

        setUserRole(data.user.role);
        setIsLoggedIn(true);
        showToast(data.message || `Bienvenue ! Rôle: ${data.user.role}`);
        return;
      } else {
        showToast(data.error || "Erreur de connexion.", false);
        return;
      }
    } catch (err) {
      console.warn("⚠️ Mode local actif: Impossible de joindre le serveur backend.", err);
      // 2. Resilient local fallback if backend is offline
      const lowerEmail = email.toLowerCase();
      let role: "client" | "agency" | "admin" = "client";
      let activeAgency = "Finexs Voyage";
      let welcomeMessage = "Bienvenue dans votre Espace Voyageur SafeTrip ! (Simulation Locale)";

      if (lowerEmail.includes("admin")) {
        role = "admin";
        welcomeMessage = "Bienvenue dans l'espace Administration (Simulation Locale) !";
      } else if (lowerEmail.includes("agence") || lowerEmail.includes("finexs") || lowerEmail.includes("buca") || lowerEmail.includes("general") || lowerEmail.includes("touristique") || lowerEmail.includes("men")) {
        role = "agency";
        if (lowerEmail.includes("buca")) {
          activeAgency = "Buca Voyage";
        } else if (lowerEmail.includes("general")) {
          activeAgency = "General Express";
        } else if (lowerEmail.includes("touristique")) {
          activeAgency = "Touristique Express";
        } else if (lowerEmail.includes("men")) {
          activeAgency = "Men Travel";
        }
        setSelectedAgencyName(activeAgency);
        localStorage.setItem("safetrip_active_agency", activeAgency);
        welcomeMessage = `Bienvenue dans l'administration de ${activeAgency} ! (Simulation Locale)`;
      }

      localStorage.setItem("safetrip_logged_in", "true");
      localStorage.setItem("safetrip_user_role", role);
      localStorage.setItem("safetrip_user_email", email);
      localStorage.setItem("safetrip_user_name", email.split("@")[0]);
      setUserRole(role);
      setIsLoggedIn(true);
      showToast(welcomeMessage);
    }
  };

  // Logout session
  const handleLogout = () => {
    localStorage.setItem("safetrip_logged_in", "false");
    localStorage.removeItem("safetrip_user_role");
    localStorage.removeItem("safetrip_token");
    localStorage.removeItem("safetrip_user_email");
    localStorage.removeItem("safetrip_user_name");
    setIsLoggedIn(false);
    showToast("Session déconnectée avec succès.");
  };

  // Download PDF ticket directly (no print dialog)
  const handleDownloadPDF = async (billet: Billet) => {
    showToast("Génération du billet PDF en cours...");
    try {
      const { default: jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // Create a hidden off-screen div with the PDF ticket design
      const pdfDiv = document.createElement("div");
      pdfDiv.style.cssText = `
        position: fixed; top: -9999px; left: -9999px;
        width: 794px; background: #ffffff;
        font-family: 'Montserrat', Arial, sans-serif;
        color: #1a202c; padding: 0; margin: 0;
      `;
      pdfDiv.innerHTML = `
        <div style="width:794px; min-height:420px; background:#fff; padding:0; margin:0; font-family:Arial,sans-serif;">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#0A2F1D 0%,#00673C 100%); padding:24px 36px; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:16px;">
              <div style="background:#fff; border-radius:12px; padding:8px; width:80px; height:40px; display:flex; align-items:center; justify-content:center;">
                <span style="color:#00673C; font-weight:900; font-size:14px; letter-spacing:-0.5px;">SafeTrip</span>
              </div>
              <div style="color:rgba(255,255,255,0.5); font-size:20px;">|</div>
              <div style="background:rgba(255,255,255,0.12); border-radius:8px; padding:6px 12px;">
                <span style="color:#ffffff; font-weight:700; font-size:12px;">${billet.company}</span>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="color:rgba(255,255,255,0.7); font-size:10px; text-transform:uppercase; letter-spacing:1px;">Billet Officiel</div>
              <div style="color:#ffffff; font-weight:900; font-size:16px; letter-spacing:1px;">${billet.id}</div>
            </div>
          </div>
          <!-- Route banner -->
          <div style="background:#f8fffe; border-bottom:2px dashed #e2e8f0; padding:28px 36px; display:flex; align-items:center; justify-content:space-between;">
            <div>
              <div style="font-size:11px; color:#718096; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Départ</div>
              <div style="font-size:32px; font-weight:900; color:#0A2F1D; line-height:1;">${billet.from}</div>
              <div style="font-size:12px; color:#718096; margin-top:4px;">${billet.depStation}</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:28px; color:#00673C; margin-bottom:4px;">✈</div>
              <div style="background:#00673C; color:#fff; font-size:10px; padding:2px 10px; border-radius:20px; font-weight:700;">${billet.duration}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:11px; color:#718096; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Arrivée</div>
              <div style="font-size:32px; font-weight:900; color:#0A2F1D; line-height:1;">${billet.to}</div>
              <div style="font-size:12px; color:#718096; margin-top:4px;">${billet.arrStation}</div>
            </div>
          </div>
          <!-- Details grid -->
          <div style="padding:24px 36px; display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:20px; border-bottom:1px solid #edf2f7;">
            <div>
              <div style="font-size:9px; color:#a0aec0; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Passager</div>
              <div style="font-size:13px; font-weight:800; color:#1a202c;">${billet.passenger}</div>
              <div style="font-size:10px; color:#718096;">${billet.phone}</div>
            </div>
            <div>
              <div style="font-size:9px; color:#a0aec0; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Date & Heure</div>
              <div style="font-size:13px; font-weight:800; color:#1a202c;">${billet.date}</div>
              <div style="font-size:11px; color:#00673C; font-weight:700;">${billet.depTime} → ${billet.arrTime}</div>
            </div>
            <div>
              <div style="font-size:9px; color:#a0aec0; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Siège</div>
              <div style="font-size:13px; font-weight:800; color:#1a202c;">${billet.seat}</div>
              <div style="font-size:10px; color:#718096;">Classe ${billet.busClass}</div>
            </div>
            <div>
              <div style="font-size:9px; color:#a0aec0; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Bagages</div>
              <div style="font-size:13px; font-weight:800; color:#1a202c;">${billet.luggageCount} bagage${billet.luggageCount > 1 ? "s" : ""}</div>
              <div style="font-size:10px; color:#718096;">Enregistrés</div>
            </div>
          </div>
          <!-- Footer -->
          <div style="padding:16px 36px; display:flex; justify-content:space-between; align-items:center; background:#fafafa;">
            <div>
              <div style="font-size:9px; color:#a0aec0; text-transform:uppercase; letter-spacing:1px;">Tarif</div>
              <div style="font-size:18px; font-weight:900; color:#00673C;">${billet.price.toLocaleString("fr-CM")} FCFA</div>
            </div>
            <div style="text-align:center; border:2px solid #edf2f7; border-radius:10px; padding:10px 16px;">
              <div style="font-size:9px; color:#a0aec0; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">QR Code</div>
              <div style="width:60px; height:60px; border:2px solid #00673C; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:24px;">▣</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:9px; color:#a0aec0; text-transform:uppercase; letter-spacing:1px;">Statut</div>
              <div style="background:${billet.status === "Actif" ? "#eef8f3" : "#f7fafc"}; color:${billet.status === "Actif" ? "#2f855a" : "#4a5568"}; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:800; display:inline-block;">${billet.status.toUpperCase()}</div>
              <div style="font-size:9px; color:#a0aec0; margin-top:8px;">SafeTrip © 2026 — Voyagez l'esprit tranquille 🇨🇲</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(pdfDiv);

      const canvas = await html2canvas(pdfDiv, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      document.body.removeChild(pdfDiv);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`billet-safetrip-${billet.id}.pdf`);

      showToast(`Billet ${billet.id} téléchargé avec succès ! ✅`);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du téléchargement.", false);
    }
  };

  // Helper to render customized barcode graphic on-screen
  const renderBarcode = (refId: string) => {
    const bars = [];
    let seed = 0;
    for (let i = 0; i < refId.length; i++) {
      seed += refId.charCodeAt(i);
    }
    
    for (let i = 0; i < 35; i++) {
      const width = ((seed + i) % 4) + 1;
      const isGap = (seed * i + 7) % 3 === 0;
      bars.push(
        <div
          key={i}
          style={{
            width: `${width}px`,
            marginRight: isGap ? `${((seed + i) % 2) + 2}px` : "1px",
            background: "#000000",
            flexShrink: 0
          }}
        />
      );
    }
    return (
      <div className={styles.dlBarcodeGraphic} style={{ display: "flex", justifyContent: "center", alignItems: "stretch", height: "35px" }}>
        {bars}
      </div>
    );
  };

  // Download Colis / Luggage Tag PDF directly
  const handleDownloadColisPDF = async (colis: Colis) => {
    showToast("Génération de l'étiquette de bagage PDF...");
    try {
      const { default: jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // Create a hidden off-screen div with a beautiful vertical luggage tag design
      const pdfDiv = document.createElement("div");
      pdfDiv.style.cssText = "position: fixed; top: -9999px; left: -9999px; width: 380px; min-height: 600px; background: #ffffff; font-family: Arial, sans-serif; color: #1a202c; padding: 0; margin: 0; border: 2px solid #1a202c;";
      
      let seed = 0;
      for (let i = 0; i < colis.id.length; i++) {
        seed += colis.id.charCodeAt(i);
      }
      let barcodeHtml = "";
      for (let i = 0; i < 40; i++) {
        const width = ((seed + i) % 4) + 1.5;
        const isGap = (seed * i + 7) % 3 === 0;
        const marginRight = isGap ? (((seed + i) % 2) + 2) + "px" : "1px";
        barcodeHtml += '<div style="width:' + width + 'px; background:#000000; margin-right:' + marginRight + '; flex-shrink:0;"></div>';
      }

      const dimensionsRow = colis.dimensions ? '<tr><td style="padding: 6px 0; color: #718096;">DIMENSIONS</td><td style="padding: 6px 0; font-weight: bold; color: #1a202c; text-align: right;">' + colis.dimensions + '</td></tr>' : '';
      const fragileRow = colis.fragile ? '<tr><td style="padding: 6px 0; color: #ef4444; font-weight: 900;">ATTENTION</td><td style="padding: 6px 0; font-weight: 900; color: #ef4444; text-align: right; letter-spacing: 0.5px;">⚠️ BAGAGE FRAGILE</td></tr>' : '';

      pdfDiv.innerHTML = `
        <div style="width: 380px; padding: 0; margin: 0; box-sizing: border-box; background: #ffffff; text-align: center; border-radius: 12px; overflow: hidden; position: relative;">
          <!-- Top Flag Strip -->
          <div style="display: flex; height: 6px;">
            <div style="flex: 1; background: #007A5E;"></div>
            <div style="flex: 1; background: #CE1126;"></div>
            <div style="flex: 1; background: #FCD116;"></div>
          </div>
          
          <!-- Punch hole decoration for tag -->
          <div style="display: flex; justify-content: center; padding: 15px 0 10px 0;">
            <div style="width: 16px; height: 16px; border-radius: 50%; border: 3px double #a0aec0; background: #ffffff;"></div>
          </div>

          <!-- Header -->
          <div style="background: #0A2F1D; color: #ffffff; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: 900; font-size: 14px; letter-spacing: -0.5px;">SafeTrip</div>
            <div style="background: rgba(255,255,255,0.15); border-radius: 6px; padding: 3px 8px; font-size: 10px; font-weight: bold;">
              ${colis.agency}
            </div>
          </div>

          <!-- Title -->
          <div style="padding: 15px 20px 5px 20px; text-align: left;">
            <span style="font-size: 8px; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 2px;">Document Officiel</span>
            <span style="font-size: 16px; font-weight: 900; color: #0A2F1D; text-transform: uppercase; letter-spacing: 0.5px;">ÉTIQUETTE BAGAGE</span>
          </div>

          <!-- Dashed perforation -->
          <div style="border-bottom: 2px dashed #cbd5e0; margin: 10px 20px;"></div>

          <!-- Main Details -->
          <div style="padding: 5px 20px; text-align: left;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="padding: 6px 0; color: #718096; width: 45%;">RÉFÉRENCE</td>
                <td style="padding: 6px 0; font-weight: bold; color: #00673C; text-align: right;">${colis.id}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">VOYAGEUR</td>
                <td style="padding: 6px 0; font-weight: bold; color: #1a202c; text-align: right;">Marc Nzenang</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">TRAJET</td>
                <td style="padding: 6px 0; font-weight: bold; color: #1a202c; text-align: right;">${colis.trip}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">DATE DE DÉPART</td>
                <td style="padding: 6px 0; font-weight: bold; color: #1a202c; text-align: right;">${colis.tripDate.split(" · ")[0]}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">TYPE D'OBJET</td>
                <td style="padding: 6px 0; font-weight: bold; color: #1a202c; text-align: right;">${colis.type} (${colis.color})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">POIDS ENREGISTRÉ</td>
                <td style="padding: 6px 0; font-weight: 800; color: #00673C; text-align: right; font-size: 12px;">${colis.weight} KG</td>
              </tr>
              ${dimensionsRow}
              ${fragileRow}
            </table>
          </div>

          <!-- Dashed perforation -->
          <div style="border-bottom: 2px dashed #cbd5e0; margin: 15px 20px;"></div>

          <!-- Barcode Area -->
          <div style="padding: 10px 20px 25px 20px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div style="display: flex; height: 35px; justify-content: center; width: 100%;">
              ${barcodeHtml}
            </div>
            <div style="font-family: monospace; font-size: 10px; font-weight: bold; color: #4a5568; letter-spacing: 3px;">
              ${colis.qrRef}
            </div>
          </div>

          <!-- Bottom Footer Info -->
          <div style="background: #fafafa; padding: 12px 20px; font-size: 8px; color: #a0aec0; border-top: 1px solid #edf2f7; text-align: center;">
            SafeTrip © 2026 — Bagage Enregistré Officiel.<br/>
            Scannez ce code-barres lors de la dépose et de la livraison.
          </div>
        </div>
      `;
      
      document.body.appendChild(pdfDiv);

      const canvas = await html2canvas(pdfDiv, { scale: 2.5, useCORS: true, backgroundColor: "#ffffff" });
      document.body.removeChild(pdfDiv);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "px", 
        format: [canvas.width / 2.5, canvas.height / 2.5] 
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2.5, canvas.height / 2.5);
      pdf.save("etiquette-bagage-safetrip-" + colis.id + ".pdf");

      showToast("Étiquette de bagage " + colis.id + " téléchargée avec succès ! ✅");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du téléchargement.", false);
    }
  };

    // Traveler Inscription Form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone || !regEmail || !regPassword) {
      showToast("Veuillez remplir tous les champs obligatoires.", false);
      return;
    }

    try {
      // 1. Attempt actual backend API call
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          fullName: regName,
          phone: regPhone
        })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        showToast(data.message || `Compte créé avec succès !`);
        setTimeout(() => {
          setIsLoginMode(true);
        }, 1500);
        return;
      } else {
        showToast(data.error || "Erreur d'inscription.", false);
        return;
      }
    } catch (err) {
      console.warn("⚠️ Mode local actif: Impossible de joindre le serveur backend.", err);
      // 2. Resilient local fallback if backend is offline
      showToast(`Compte Voyageur créé avec succès pour ${regName} ! (Simulation Locale)`);
      setTimeout(() => {
        setIsLoginMode(true);
      }, 1500);
    }
  };

  // Switch agency context dynamically
  const handleAgencySwitch = (name: string) => {
    setSelectedAgencyName(name);
    localStorage.setItem("safetrip_active_agency", name);
    // Reset selection to the first journey of the newly selected agency
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

  // Profile handlers
  const handleProfileSave = () => {
    const profileData = {
      fullName: profileFullName,
      phone: profilePhone,
      address: profileAddress,
      city: profileCity,
      photo: profilePhoto
    };
    localStorage.setItem("safetrip_profile", JSON.stringify(profileData));
    setProfileEditing(false);
    showToast("Profil mis à jour avec succès ! ✅");
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("La photo ne doit pas dépasser 2 Mo.", false);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileCancelEdit = () => {
    // Reload from localStorage to discard changes
    const savedProfile = localStorage.getItem("safetrip_profile");
    if (savedProfile) {
      try {
        const p = JSON.parse(savedProfile);
        if (p.fullName) setProfileFullName(p.fullName);
        if (p.phone) setProfilePhone(p.phone);
        if (p.address) setProfileAddress(p.address);
        if (p.city) setProfileCity(p.city);
        if (p.photo) setProfilePhoto(p.photo);
      } catch { /* ignore */ }
    }
    setProfileEditing(false);
  };

  // Handle trip amenities toggle in form
  const toggleFormAmenity = (key: string) => {
    if (selectedAmenities.includes(key)) {
      setSelectedAmenities(prev => prev.filter(k => k !== key));
    } else {
      setSelectedAmenities(prev => [...prev, key]);
    }
  };

  // Submit trip planner form to database
  const handlePlanTrip = (e: React.FormEvent) => {
    e.preventDefault();

    if (!depCity || !arrCity || !ticketPrice) {
      showToast("Veuillez remplir tous les champs obligatoires (Départ, Arrivée, Prix).", false);
      return;
    }

    const priceNum = parseInt(ticketPrice.replace(/\s/g, ""), 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("Veuillez saisir un prix valide supérieur à 0.", false);
      return;
    }

    // Determine current agency's full name & brand logo
    const activeAgencyObj = PARTNER_AGENCIES.find(a => a.name === selectedAgencyName) || PARTNER_AGENCIES[0];
    
    // Construct nice dynamic station texts
    const finalDepStation = `${depCity.trim()} - Agence ${activeAgencyObj.name} ${depCity.trim()}`;
    const finalArrStation = `${arrCity.trim()} - Agence ${activeAgencyObj.name} ${arrCity.trim()}`;
    
    // Automatically calculate arrival time based on 4h15 average duration
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
    const arrTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    // Map selected keys to label texts for display
    const labelMapping: { [key: string]: string } = {
      wifi: "Wi-Fi",
      ac: "Climatisation",
      plug: "Prises électriques",
      reclining: "Sièges inclinables",
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
      arrTime: arrTime,
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

    // Initialize mock passengers for this newly scheduled trip
    const defaultNewPassengers: Passenger[] = [
      { id: 1, name: "Albert Eyidi", phone: "+237 699 90 90 90", seat: "1A (VIP)", status: "Payé", luggageCount: 2, luggageScanned: false },
      { id: 2, name: "Marie-Louise Atangana", phone: "+237 671 80 80 80", seat: "2B (VIP)", status: "Payé", luggageCount: 1, luggageScanned: false }
    ];
    setPassengersMap(prev => ({
      ...prev,
      [newJourney.id]: defaultNewPassengers
    }));

    // Clear form inputs
    setDepCity("");
    setArrCity("");
    setTicketPrice("");
    setDepTime("08:00");
    setSelectedAmenities([]);
    
    showToast(`Super ! Le trajet ${depCity} → ${arrCity} (${depTime}) est planifié et publié sur SafeTrip.`);
  };

  // Simulate passenger status change
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

  // Trigger scanning simulation modal
  const handleOpenScanner = (passenger: Passenger) => {
    setScanningPassenger(passenger);
    setActiveScanJourneyId(selectedJourneyId);
  };

  // Complete Simulated Scan
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

  const activeAgencyObj = PARTNER_AGENCIES.find(a => a.name === selectedAgencyName) || PARTNER_AGENCIES[0];
  const activePassengers = selectedJourneyId !== null ? (passengersMap[selectedJourneyId] || []) : [];

  // Compute calculated metrics
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
      {/* No header — sidebar handles all navigation */}

      {/* Main Container */}
      <div className={(!isLoggedIn) ? styles.authPageContainer : (userRole === "client" || userRole === "agency") ? styles.fullscreenWorkspace : styles.dashboardContainer}>
        
        {/* Toast Popup Notification */}
        {toastMessage && (
          <div className={`${styles.toast} ${isToastSuccess ? styles.toastSuccess : ""}`}>
            <span>{toastMessage}</span>
            <button className={styles.toastClose} onClick={() => setToastMessage(null)}>×</button>
          </div>
        )}

        {/* 1. UNIVERSAL LOGIN PORTAL */}
        {!isLoggedIn ? (
          <div className={styles.loginGateContainer}>
            <div className={styles.loginCard}>
              <div className={styles.loginHeader}>
                <img 
                  src="/images/logo-removebg-preview (2).png" 
                  alt="SafeTrip Logo" 
                  className={styles.loginLogo}
                />
                <p className={styles.loginSubtitle}>Votre portail SafeTrip — Voyageurs, Agences &amp; Administration</p>
                
                <div className={styles.tabLinks}>
                  <span
                    className={`${styles.tabLink} ${isLoginMode ? styles.tabLinkActive : ""}`}
                    onClick={() => setIsLoginMode(true)}
                  >
                    Connexion
                  </span>
                  <span className={styles.tabSeparator}>/</span>
                  <span
                    className={`${styles.tabLink} ${!isLoginMode ? styles.tabLinkActive : ""}`}
                    onClick={() => setIsLoginMode(false)}
                  >
                    Inscription
                  </span>
                </div>
              </div>

              <div className={styles.formSliderContainer}>
                <div 
                  className={styles.formSlider} 
                  style={{ transform: isLoginMode ? 'translateX(0%)' : 'translateX(-50%)' }}
                >
                  {/* FORM 1: CONNEXION UNIFIEE */}
                  <form onSubmit={handleLogin} className={styles.loginForm}>
                    <h3 className={styles.formInsideTitle}>Se connecter</h3>
                    
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Adresse Email</label>
                      <input 
                        type="email" 
                        placeholder="nom@exemple.com" 
                        className={styles.loginInput}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required={isLoginMode}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Mot de passe</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className={styles.loginInput}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={isLoginMode}
                      />
                    </div>

                    <button type="submit" className={styles.loginBtn}>
                      Se connecter
                    </button>
                  </form>

                  {/* FORM 2: INSCRIPTION VOYAGEUR */}
                  <form onSubmit={handleRegister} className={styles.loginForm}>
                    <h3 className={styles.formInsideTitle}>Espace Voyageur</h3>
                    
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Nom complet</label>
                      <input 
                        type="text" 
                        placeholder="Jean-Pierre Talla" 
                        className={styles.loginInput}
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required={!isLoginMode}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Numéro de Téléphone</label>
                      <input 
                        type="tel" 
                        placeholder="+237 6xx xx xx xx" 
                        className={styles.loginInput}
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        required={!isLoginMode}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Adresse Email</label>
                      <input 
                        type="email" 
                        placeholder="jp.talla@email.com" 
                        className={styles.loginInput}
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required={!isLoginMode}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Créer un mot de passe</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className={styles.loginInput}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required={!isLoginMode}
                      />
                    </div>

                    <button type="submit" className={styles.loginBtn}>
                      Créer mon compte
                    </button>
                  </form>
                </div>
              </div>

              <div className={styles.loginFooter}>
                <span>SafeTrip © 2026</span>
                <span style={{ margin: "0 6px" }}>·</span>
                <span>Voyagez l&apos;esprit tranquille 🇨🇲</span>
              </div>
            </div>
          </div>
        ) : (
          /* 2. DYNAMIC PREMIUM WORKSPACE DASHBOARD */
          <>
            {userRole === "client" && (
              <div className={styles.clientDashboardLayout}>
                {/* 1. VERTICAL SIDEBAR */}
                <aside className={styles.clientSidebar}>
                  <div className={styles.sidebarBrand}>
                    <img src="/images/logo-removebg-preview (2).png" alt="Logo" className={styles.sidebarLogoImg} />
                  </div>
                  <nav className={styles.sidebarNav}>
                    <button
                      type="button"
                      className={`${styles.sidebarNavItem} ${clientActiveTab === "dashboard" ? styles.sidebarNavItemActive : ""}`}
                      onClick={() => setClientActiveTab("dashboard")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
                        <rect x="3" y="3" width="7" height="9" rx="1" />
                        <rect x="14" y="3" width="7" height="5" rx="1" />
                        <rect x="14" y="12" width="7" height="9" rx="1" />
                        <rect x="3" y="16" width="7" height="5" rx="1" />
                      </svg>
                      Tableau de bord
                    </button>

                    <button
                      type="button"
                      className={`${styles.sidebarNavItem} ${clientActiveTab === "billet" ? styles.sidebarNavItemActive : ""}`}
                      onClick={() => setClientActiveTab("billet")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <line x1="8" y1="14" x2="8" y2="16" />
                        <line x1="16" y1="14" x2="16" y2="16" />
                      </svg>
                      Billets
                    </button>

                    <button
                      type="button"
                      className={`${styles.sidebarNavItem} ${clientActiveTab === "colis" ? styles.sidebarNavItemActive : ""}`}
                      onClick={() => setClientActiveTab("colis")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
                        <rect x="2" y="7" width="20" height="14" rx="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      Colis
                    </button>

                    <button
                      type="button"
                      className={`${styles.sidebarNavItem} ${clientActiveTab === "messageries" ? styles.sidebarNavItemActive : ""}`}
                      onClick={() => setClientActiveTab("messageries")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Messageries
                    </button>

                    <button
                      type="button"
                      className={`${styles.sidebarNavItem} ${clientActiveTab === "profils" ? styles.sidebarNavItemActive : ""}`}
                      onClick={() => setClientActiveTab("profils")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Profils
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
                  {clientActiveTab === "dashboard" && (
                    <div className={styles.tabContentFadeIn}>
                      {/* Banner */}
                      <div className={styles.agencyBanner} style={{ background: "linear-gradient(135deg, #00673C 0%, #1a3a2a 100%)" }}>
                        <div className={styles.agencyInfo}>
                          <div className={styles.agencyLogoCircle} style={{ background: "#ffffff", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="2.5" style={{ width: "26px", height: "26px" }}>
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <div className={styles.agencyText}>
                            <h1 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Mon Espace Voyageur</h1>
                            <span className={styles.agencyBadge}>Voyageur Certifié</span>
                          </div>
                        </div>
                        <div className={styles.bannerControls}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Propriétaire : {profileFullName || email || "Voyageur"}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                          <div className={styles.statIconBox} style={{ background: "#eef8f3", color: "#00673C" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                          </div>
                          <div className={styles.statValueContainer}>
                            <span className={styles.statLabel}>Voyages Programmés</span>
                            <span className={styles.statValue}>1 Actif</span>
                            <span className={styles.statTrend} style={{ color: "#2f855a" }}>Départ le 25 Mai 2026</span>
                          </div>
                        </div>

                        <div className={styles.statCard}>
                          <div className={styles.statIconBox} style={{ background: "#fffaf0", color: "var(--accent-gold)" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </div>
                          <div className={styles.statValueContainer}>
                            <span className={styles.statLabel}>Points Fidélité</span>
                            <span className={styles.statValue}>350 pts</span>
                            <span className={styles.statTrend} style={{ color: "#744210" }}>Statut Bronze</span>
                          </div>
                        </div>

                        <div className={styles.statCard}>
                          <div className={styles.statIconBox} style={{ background: "#ebf8ff", color: "#3182ce" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                          </div>
                          <div className={styles.statValueContainer}>
                            <span className={styles.statLabel}>Bagages Enregistrés</span>
                            <span className={styles.statValue}>2 étiquetés</span>
                            <span className={styles.statTrend} style={{ color: "#3182ce" }}>Scannés par l'agence</span>
                          </div>
                        </div>

                        <div className={styles.statCard}>
                          <div className={styles.statIconBox} style={{ background: "#fff5f5", color: "var(--accent-red)" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="1" x2="12" y2="23" />
                              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                          </div>
                          <div className={styles.statValueContainer}>
                            <span className={styles.statLabel}>Total Dépensé</span>
                            <span className={styles.statValue}>9 000 FCFA</span>
                            <span className={styles.statTrend} style={{ color: "#9b2c2c" }}>3 réservations complétées</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {clientActiveTab === "billet" && (
                    <div className={styles.tabContentFadeIn}>
                      {/* Page title */}
                      <div className={styles.billetPageHeader}>
                        <div>
                          <h2 className={styles.billetPageTitle} style={{display:"flex",alignItems:"center",gap:"8px"}}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"18px",height:"18px",color:"#00673C"}}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                            Mes Billets de Voyage
                          </h2>
                          <p className={styles.billetPageSub}>{MOCK_BILLETS.length} billet{MOCK_BILLETS.length > 1 ? "s" : ""} trouvé{MOCK_BILLETS.length > 1 ? "s" : ""}</p>
                        </div>
                      </div>

                      {/* Ticket list */}
                      <div className={styles.billetList}>
                        {MOCK_BILLETS.map((billet) => (
                          <div key={billet.id} className={styles.billetCard}>
                            {/* Left: status stripe */}
                            <div className={`${styles.billetStripe} ${billet.status === "Actif" ? styles.billetStripeActive : billet.status === "Annulé" ? styles.billetStripeCancelled : styles.billetStripeCompleted}`} />
                            
                            {/* Main content */}
                            <div className={styles.billetCardBody}>
                              {/* Route */}
                              <div className={styles.billetRoute}>
                                <div className={styles.billetCity}>{billet.from}</div>
                                <div className={styles.billetArrow}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.billetArrowIcon}>
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                  </svg>
                                  <span className={styles.billetDuration}>{billet.duration}</span>
                                </div>
                                <div className={styles.billetCity}>{billet.to}</div>
                              </div>

                              {/* Meta row */}
                              <div className={styles.billetMeta}>
                                <span className={styles.billetMetaItem}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"13px",height:"13px"}}>
                                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                  </svg>
                                  {billet.date} · {billet.depTime}
                                </span>
                                <span className={styles.billetMetaItem}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"13px",height:"13px"}}>
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                                  </svg>
                                  {billet.company}
                                </span>
                                <span className={styles.billetMetaItem}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:"13px",height:"13px",marginRight:"4px",display:"inline-block",verticalAlign:"middle"}}><path d="M19 18V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v13" /><path d="M3 18h18" /><path d="M5 21h14" /></svg>Siège {billet.seat}
                                </span>
                                <span className={styles.billetMetaItem}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:"13px",height:"13px",marginRight:"4px",display:"inline-block",verticalAlign:"middle"}}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>{billet.luggageCount} bagage{billet.luggageCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>

                            {/* Right: price + status + action */}
                            <div className={styles.billetCardRight}>
                              <div className={styles.billetPrice}>{billet.price.toLocaleString("fr-CM")} <span>FCFA</span></div>
                              <span className={`${styles.billetStatus} ${billet.status === "Actif" ? styles.billetStatusActive : billet.status === "Annulé" ? styles.billetStatusCancelled : styles.billetStatusCompleted}`}>
                                {billet.status === "Actif" ? "● Actif" : billet.status === "Annulé" ? "✕ Annulé" : "✓ Complété"}
                              </span>
                              <button
                                className={styles.voirBilletBtn}
                                onClick={() => setSelectedBillet(billet)}
                              >
                                Voir le billet
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* ===== DIGITAL TICKET MODAL ===== */}
                      {selectedBillet && (
                        <div className={styles.billetModalOverlay} onClick={() => setSelectedBillet(null)}>
                          <div className={styles.billetModalWrapper} onClick={(e) => e.stopPropagation()}>
                            {/* Modal top bar */}
                            <div className={styles.billetModalTopBar}>
                              <span className={styles.billetModalTopLabel}>Billet Numérique</span>
                              <div className={styles.billetModalTopActions}>
                                <button
                                  className={styles.downloadPdfBtn}
                                  onClick={() => handleDownloadPDF(selectedBillet)}
                                  title="Télécharger le billet PDF"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                  </svg>
                                  PDF
                                </button>
                                <button className={styles.billetModalClose} onClick={() => setSelectedBillet(null)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* ===== THE DIGITAL TICKET CARD ===== */}
                            <div ref={digitalTicketRef} className={styles.digitalTicket}>
                              {/* Ticket header: logos */}
                              <div className={styles.dtHeader}>
                                <div className={styles.dtLogoSafe}>
                                  <img src="/images/logo-removebg-preview (2).png" alt="SafeTrip" style={{height:"32px", objectFit:"contain"}}/>
                                </div>
                                <div className={styles.dtSeparatorDot} />
                                <div className={styles.dtCompanyBadge}>
                                  <img src={selectedBillet.companyLogo} alt={selectedBillet.company} style={{height:"26px", objectFit:"contain"}}/>
                                  <span>{selectedBillet.company}</span>
                                </div>
                                <div style={{flex:1}}/>
                                <div className={styles.dtRef}>
                                  <span className={styles.dtRefLabel}>Référence</span>
                                  <span className={styles.dtRefValue}>{selectedBillet.id}</span>
                                </div>
                              </div>

                              {/* Route section */}
                              <div className={styles.dtRouteSection}>
                                <div className={styles.dtStation}>
                                  <span className={styles.dtTime}>{selectedBillet.depTime}</span>
                                  <span className={styles.dtCityBig}>{selectedBillet.from}</span>
                                  <span className={styles.dtStationSmall}>{selectedBillet.depStation}</span>
                                </div>
                                <div className={styles.dtMiddle}>
                                  <div className={styles.dtDot}/>
                                  <div className={styles.dtLine}>
                                    <svg viewBox="0 0 60 14" className={styles.dtBusIcon}>
                                      <rect x="2" y="3" width="56" height="8" rx="2" fill="currentColor"/>
                                      <circle cx="10" cy="12" r="2.5" fill="currentColor"/>
                                      <circle cx="50" cy="12" r="2.5" fill="currentColor"/>
                                      <rect x="8" y="3" width="8" height="4" rx="1" fill="rgba(255,255,255,0.4)"/>
                                      <rect x="20" y="3" width="8" height="4" rx="1" fill="rgba(255,255,255,0.4)"/>
                                      <rect x="32" y="3" width="8" height="4" rx="1" fill="rgba(255,255,255,0.4)"/>
                                      <rect x="44" y="3" width="8" height="4" rx="1" fill="rgba(255,255,255,0.4)"/>
                                    </svg>
                                  </div>
                                  <div className={styles.dtDot}/>
                                  <div className={styles.dtDurationBadge}>{selectedBillet.duration}</div>
                                </div>
                                <div className={styles.dtStation} style={{textAlign:"right",alignItems:"flex-end"}}>
                                  <span className={styles.dtTime}>{selectedBillet.arrTime}</span>
                                  <span className={styles.dtCityBig}>{selectedBillet.to}</span>
                                  <span className={styles.dtStationSmall}>{selectedBillet.arrStation}</span>
                                </div>
                              </div>

                              {/* Perforated separator */}
                              <div className={styles.dtPerforated}>
                                <div className={styles.dtCircleLeft}/>
                                <div className={styles.dtDots}/>
                                <div className={styles.dtCircleRight}/>
                              </div>

                              {/* Details + QR section */}
                              <div className={styles.dtDetails}>
                                <div className={styles.dtDetailsGrid}>
                                  <div className={styles.dtDetailItem}>
                                    <span className={styles.dtDetailLabel}>Passager</span>
                                    <span className={styles.dtDetailValue}>{selectedBillet.passenger}</span>
                                  </div>
                                  <div className={styles.dtDetailItem}>
                                    <span className={styles.dtDetailLabel}>Date</span>
                                    <span className={styles.dtDetailValue}>{selectedBillet.date}</span>
                                  </div>
                                  <div className={styles.dtDetailItem}>
                                    <span className={styles.dtDetailLabel}>Siège</span>
                                    <span className={styles.dtDetailValue}>{selectedBillet.seat}</span>
                                  </div>
                                  <div className={styles.dtDetailItem}>
                                    <span className={styles.dtDetailLabel}>Classe</span>
                                    <span className={styles.dtDetailValue}>{selectedBillet.busClass}</span>
                                  </div>
                                  <div className={styles.dtDetailItem}>
                                    <span className={styles.dtDetailLabel}>Bagages</span>
                                    <span className={styles.dtDetailValue}>{selectedBillet.luggageCount} pièce{selectedBillet.luggageCount !== 1 ? "s" : ""}</span>
                                  </div>
                                  <div className={styles.dtDetailItem}>
                                    <span className={styles.dtDetailLabel}>Tarif</span>
                                    <span className={styles.dtDetailValue} style={{color:"#4ade80",fontWeight:800}}>{selectedBillet.price.toLocaleString("fr-CM")} FCFA</span>
                                  </div>
                                </div>
                                {/* QR Code */}
                                <div className={styles.dtQRSection}>
                                  <div className={styles.dtQRBox}>
                                    <svg viewBox="0 0 100 100" className={styles.dtQRSvg}>
                                      <rect x="5" y="5" width="35" height="35" rx="3" fill="none" stroke="currentColor" strokeWidth="4"/>
                                      <rect x="14" y="14" width="18" height="18" rx="1" fill="currentColor"/>
                                      <rect x="60" y="5" width="35" height="35" rx="3" fill="none" stroke="currentColor" strokeWidth="4"/>
                                      <rect x="69" y="14" width="18" height="18" rx="1" fill="currentColor"/>
                                      <rect x="5" y="60" width="35" height="35" rx="3" fill="none" stroke="currentColor" strokeWidth="4"/>
                                      <rect x="14" y="69" width="18" height="18" rx="1" fill="currentColor"/>
                                      <rect x="60" y="60" width="10" height="10" rx="1" fill="currentColor"/>
                                      <rect x="75" y="60" width="10" height="10" rx="1" fill="currentColor"/>
                                      <rect x="60" y="75" width="10" height="10" rx="1" fill="currentColor"/>
                                      <rect x="75" y="75" width="10" height="10" rx="1" fill="currentColor"/>
                                      <rect x="85" y="60" width="10" height="25" rx="1" fill="currentColor"/>
                                      <rect x="45" y="5" width="8" height="8" rx="1" fill="currentColor"/>
                                      <rect x="45" y="18" width="8" height="8" rx="1" fill="currentColor"/>
                                      <rect x="45" y="31" width="8" height="8" rx="1" fill="currentColor"/>
                                    </svg>
                                  </div>
                                  <span className={styles.dtQRLabel}>Scanner pour valider</span>
                                  <span className={`${styles.dtStatusBadge} ${selectedBillet.status === "Actif" ? styles.dtStatusActive : styles.dtStatusDone}`}>
                                    {selectedBillet.status === "Actif" ? "● ACTIF" : "✓ COMPLÉTÉ"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {clientActiveTab === "colis" && (
                    <div className={styles.tabContentFadeIn}>
                      {/* Page title */}
                      <div className={styles.billetPageHeader}>
                        <div>
                          <h2 className={styles.billetPageTitle} style={{display:"flex",alignItems:"center",gap:"8px"}}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"18px",height:"18px",color:"#00673C"}}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            Suivi de mes Colis &amp; Bagages
                          </h2>
                          <p className={styles.billetPageSub}>{MOCK_COLIS.length} article{MOCK_COLIS.length > 1 ? "s" : ""} enregistré{MOCK_COLIS.length > 1 ? "s" : ""}</p>
                        </div>
                      </div>

                      {/* Colis list */}
                      <div className={styles.billetList}>
                        {MOCK_COLIS.map((colis) => {
                          const isActive = colis.status === "À bord du bus" || colis.status === "En transit" || colis.status === "Scanné en gare";
                          const isDelivered = colis.status === "Livré";
                          const isPending = colis.status === "En attente de scan";
                          return (
                            <div key={colis.id} className={styles.billetCard}>
                              {/* Color stripe */}
                              <div className={`${styles.billetStripe} ${isActive ? styles.billetStripeActive : isDelivered ? styles.colisStripeDelivered : isPending ? styles.colisStripePending : styles.billetStripeCompleted}`} />

                              {/* Main content */}
                              <div className={styles.billetCardBody}>
                                {/* Top row: icon + label + fragile badge */}
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <div className={styles.colisTypeIcon}>
                                    {colis.type === "Valise" ? (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="1.8" style={{width:"20px",height:"20px"}}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                                    ) : colis.type === "Sac" ? (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="1.8" style={{width:"20px",height:"20px"}}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                                    ) : colis.type === "Carton" ? (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="1.8" style={{width:"20px",height:"20px"}}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                                    ) : (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="1.8" style={{width:"20px",height:"20px"}}><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M19 8V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2"/></svg>
                                    )}
                                  </div>
                                  <div>
                                    <div className={styles.colisLabel}>{colis.label}</div>
                                    <div className={styles.colisType}>{colis.type} · {colis.color}</div>
                                  </div>
                                  {colis.fragile && (
                                    <span className={styles.fragileBadge}>
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:"10px",height:"10px"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                      FRAGILE
                                    </span>
                                  )}
                                </div>

                                {/* Meta info */}
                                <div className={styles.billetMeta}>
                                  <span className={styles.billetMetaItem}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"13px",height:"13px"}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    {colis.weight} kg
                                  </span>
                                  {colis.dimensions && (
                                    <span className={styles.billetMetaItem}>
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"13px",height:"13px"}}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                                      {colis.dimensions}
                                    </span>
                                  )}
                                  <span className={styles.billetMetaItem}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"13px",height:"13px"}}><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                                    Voyage : {colis.trip}
                                  </span>
                                  <span className={styles.billetMetaItem}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"13px",height:"13px"}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    Départ : {colis.tripDate.split(" · ")[0]}
                                  </span>
                                </div>
                              </div>

                              {/* Right: id + status + action */}
                              <div className={styles.billetCardRight}>
                                <div className={styles.colisRef}>{colis.id}</div>
                                <span className={`${styles.billetStatus} ${isActive ? styles.billetStatusActive : isDelivered ? styles.colisStatusDelivered : styles.billetStatusCompleted}`}>
                                  {isActive ? "En cours" : isDelivered ? "Livré" : "En attente"}
                                </span>
                                <button
                                  className={styles.voirBilletBtn}
                                  onClick={() => setSelectedColis(colis)}
                                >
                                  Suivre le bagage
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ===== COLIS DETAIL MODAL ===== */}
                      {selectedColis && (
                        <div className={styles.billetModalOverlay} onClick={() => setSelectedColis(null)}>
                          <div className={styles.billetModalWrapper} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
                            {/* Top bar */}
                            <div className={styles.billetModalTopBar}>
                              <span className={styles.billetModalTopLabel} style={{display:"flex",alignItems:"center",gap:"6px"}}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"14px",height:"14px",color:"#00673C"}}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                Étiquette de Bagage
                              </span>
                              <div className={styles.billetModalTopActions}>
                                <button
                                  className={styles.downloadPdfBtn}
                                  onClick={() => handleDownloadColisPDF(selectedColis)}
                                  title="Télécharger l'étiquette PDF"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:"13px",height:"13px"}}>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                  </svg>
                                  PDF
                                </button>
                                <button className={styles.billetModalClose} onClick={() => setSelectedColis(null)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Digital Luggage Tag */}
                            <div className={styles.digitalLuggage}>
                              {/* Punch hole */}
                              <div className={styles.dlPunchHoleContainer}>
                                <div className={styles.dlPunchHole}></div>
                              </div>
                              
                              {/* Header */}
                              <div className={styles.dlHeader}>
                                <div className={styles.dlLogoSection}>
                                  <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px" }}>SafeTrip</span>
                                </div>
                                <div className={styles.dlAgencyBadge}>
                                  <img src={selectedColis.agencyLogo} alt={selectedColis.agency} />
                                  <span>{selectedColis.agency}</span>
                                </div>
                                <div className={styles.dlRef}>
                                  <span className={styles.dlRefLabel}>RÉF BAGAGE</span>
                                  <span className={styles.dlRefValue}>{selectedColis.id}</span>
                                </div>
                              </div>

                              {/* Route Banner */}
                              <div className={styles.dlRouteBanner}>
                                <div>
                                  <div className={styles.dlRouteLabel}>Trajet</div>
                                  <div className={styles.dlRouteCities}>{selectedColis.trip.split(" → ")[0]}</div>
                                </div>
                                <div className={styles.dlRouteArrow}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                  </svg>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div className={styles.dlRouteLabel}>Destination</div>
                                  <div className={styles.dlRouteCities}>{selectedColis.trip.split(" → ")[1]}</div>
                                </div>
                              </div>

                              {/* Main details body */}
                              <div className={styles.dlMainBody}>
                                <div className={styles.dlDetailsGrid}>
                                  <div className={styles.dlDetailItem}>
                                    <span className={styles.dlDetailLabel}>Voyageur</span>
                                    <span className={styles.dlDetailValue}>Marc Nzenang</span>
                                  </div>
                                  <div className={styles.dlDetailItem}>
                                    <span className={styles.dlDetailLabel}>Date départ</span>
                                    <span className={styles.dlDetailValue}>{selectedColis.tripDate.split(" · ")[0]}</span>
                                  </div>
                                  <div className={styles.dlDetailItem}>
                                    <span className={styles.dlDetailLabel}>Type d'objet</span>
                                    <span className={styles.dlDetailValue}>{selectedColis.type} ({selectedColis.color})</span>
                                  </div>
                                  <div className={styles.dlDetailItem}>
                                    <span className={styles.dlDetailLabel}>Poids enregistré</span>
                                    <span className={styles.dlDetailValueHigh}>{selectedColis.weight} kg</span>
                                  </div>
                                  {selectedColis.dimensions && (
                                    <div className={styles.dlDetailItem}>
                                      <span className={styles.dlDetailLabel}>Dimensions</span>
                                      <span className={styles.dlDetailValue}>{selectedColis.dimensions}</span>
                                    </div>
                                  )}
                                  {selectedColis.fragile && (
                                    <div className={styles.dlDetailItem} style={{ display:"flex", justifyContent: "center" }}>
                                      <span className={styles.dlFragileBadge}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{width:"10px",height:"10px"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                        FRAGILE
                                      </span>
                                    </div>
                                  )}
                                  {selectedColis.notes && (
                                    <div className={styles.dlDetailItemFull}>
                                      <span className={styles.dlDetailLabel}>Notes de l'agent</span>
                                      <span className={styles.dlDetailValue} style={{ fontSize: "0.75rem", fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>
                                        {selectedColis.notes}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Perforated lines */}
                              <div className={styles.dlPerforated}>
                                <div className={styles.dlCircleLeft}></div>
                                <div className={styles.dlDots}></div>
                                <div className={styles.dlCircleRight}></div>
                              </div>

                              {/* Barcode Footer */}
                              <div className={styles.dlFooter}>
                                <div className={styles.dlBarcodeContainer}>
                                  {renderBarcode(selectedColis.id)}
                                  <span className={styles.dlBarcodeText}>{selectedColis.qrRef}</span>
                                </div>
                                
                                <div className={styles.dlStatusRow}>
                                  <span className={styles.dlLogoBranding}>SafeTrip LUGGAGE</span>
                                  <span className={
                                    selectedColis.status === "Livré" ? styles.dlStatusLabelBadgeDelivered :
                                    selectedColis.status === "En attente de scan" ? styles.dlStatusLabelBadgePending :
                                    styles.dlStatusLabelBadge
                                  }>
                                    {selectedColis.status}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Tracking Timeline */}
                            <div className={styles.colisTimeline} style={{ background: "rgba(255,255,255,0.02)", padding: "18px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div className={styles.colisTimelineTitle} style={{ color: "#ffffff", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "12px" }}>
                                Historique des Scans de Sécurité
                              </div>
                              {["En attente de scan", "Scanné en gare", "En transit", "À bord du bus", "Livré"].map((step, i) => {
                                const steps = ["En attente de scan", "Scanné en gare", "En transit", "À bord du bus", "Livré"];
                                const currentIdx = steps.indexOf(selectedColis.status);
                                const isDone = i <= currentIdx;
                                const isCurrent = i === currentIdx;
                                return (
                                  <div key={step} className={styles.colisTimelineStep}>
                                    <div className={styles.colisTimelineLeft}>
                                      <div className={`${styles.colisTimelineDot} ${isDone ? styles.colisTimelineDotDone : ""} ${isCurrent ? styles.colisTimelineDotCurrent : ""}`} style={{ fontSize: "10px" }}>
                                        {isDone && !isCurrent ? (
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{width:"8px",height:"8px"}}><polyline points="20 6 9 17 4 12"/></svg>
                                        ) : isCurrent ? (
                                          <div style={{width:"4px",height:"4px",borderRadius:"50%",background:"#ffffff"}}/>
                                        ) : ""}
                                      </div>
                                      {i < 4 && <div className={`${styles.colisTimelineConnector} ${i < currentIdx ? styles.colisTimelineConnectorDone : ""}`} />}
                                    </div>
                                    <div className={`${styles.colisTimelineContent} ${!isDone ? styles.colisTimelineContentPending : ""}`}>
                                      <span className={styles.colisTimelineStepName} style={{ color: isDone ? "#ffffff" : "rgba(255,255,255,0.4)", fontWeight: isCurrent ? "700" : "500" }}>{step}</span>
                                      {isCurrent && selectedColis.scannedAt && (
                                        <span className={styles.colisTimelineTime} style={{ color: "#34d399" }}>Dernière mise à jour : {selectedColis.scannedAt}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {clientActiveTab === "messageries" && (
                    <div className={styles.tabContentFadeIn}>
                      <div className={styles.panelCard}>
                        <div className={styles.panelHeader} style={{ background: "rgba(0,103,60,0.02)" }}>
                          <h2 className={styles.panelTitle}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:"18px",height:"18px",color:"#00673C",marginRight:"8px",display:"inline-block",verticalAlign:"middle"}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Centre d'Assistance & Messagerie</h2>
                        </div>
                        <div className={styles.panelBody} style={{ textAlign: "center", padding: "50px 20px" }}>
                          <div style={{ marginBottom: "15px", display: "flex", justifyContent: "center" }}><svg viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="1.8" style={{width:"48px",height:"48px"}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                          <h3>Aucun message</h3>
                          <p style={{ color: "#718096", maxWidth: "400px", margin: "10px auto" }}>
                            Vous n'avez pas de message en cours. Notre service client est disponible 24/7 pour toute assistance sur vos trajets.
                          </p>
                          <button type="button" className={styles.loginBtn} style={{ maxWidth: "250px", margin: "15px auto 0 auto" }}>
                            Démarrer une conversation
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {clientActiveTab === "profils" && (
                    <div className={styles.tabContentFadeIn}>
                      {/* Profile Header Card */}
                      <div className={styles.profileHeaderCard}>
                        <div className={styles.profileHeaderContent}>
                          <div className={styles.profileAvatarSection}>
                            <div 
                              className={styles.profileAvatarWrapper}
                              onClick={() => profileEditing && profileFileInputRef.current?.click()}
                              style={{ cursor: profileEditing ? "pointer" : "default" }}
                            >
                              {profilePhoto ? (
                                <img src={profilePhoto} alt="Photo de profil" className={styles.profileAvatarImg} />
                              ) : (
                                <div className={styles.profileAvatarPlaceholder}>
                                  {(profileFullName || email.split("@")[0]).charAt(0).toUpperCase()}
                                </div>
                              )}
                              {profileEditing && (
                                <div className={styles.profileAvatarOverlay}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                  </svg>
                                  <span>Modifier</span>
                                </div>
                              )}
                              <input
                                ref={profileFileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleProfilePhotoChange}
                              />
                            </div>
                            <div className={styles.profileHeaderInfo}>
                              <h2 className={styles.profileHeaderName}>{profileFullName || email.split("@")[0]}</h2>
                              <span className={styles.profileHeaderEmail}>{email}</span>
                              <div className={styles.profileBadgesRow}>
                                <span className={styles.profileBadge}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                  Compte Vérifié
                                </span>
                                <span className={styles.profileBadgeMember}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                  Membre depuis Mai 2026
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.profileHeaderActions}>
                            {!profileEditing ? (
                              <button className={styles.profileEditBtn} onClick={() => setProfileEditing(true)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Modifier le profil
                              </button>
                            ) : (
                              <div className={styles.profileActionGroup}>
                                <button className={styles.profileSaveBtn} onClick={handleProfileSave}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12" /></svg>
                                  Enregistrer
                                </button>
                                <button className={styles.profileCancelBtn} onClick={handleProfileCancelEdit}>
                                  Annuler
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Profile Details Grid */}
                      <div className={styles.profileDetailsGrid}>
                        {/* Personal Info Card */}
                        <div className={styles.profileDetailCard}>
                          <div className={styles.profileDetailCardHeader}>
                            <div className={styles.profileDetailIcon}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </div>
                            <h3>Informations Personnelles</h3>
                          </div>
                          <div className={styles.profileFieldsGroup}>
                            <div className={styles.profileField}>
                              <label className={styles.profileFieldLabel}>Nom complet</label>
                              {profileEditing ? (
                                <input
                                  type="text"
                                  className={styles.profileFieldInput}
                                  value={profileFullName}
                                  onChange={(e) => setProfileFullName(e.target.value)}
                                  placeholder="Entrez votre nom complet"
                                />
                              ) : (
                                <div className={styles.profileFieldValue}>{profileFullName || "—"}</div>
                              )}
                            </div>
                            <div className={styles.profileField}>
                              <label className={styles.profileFieldLabel}>Adresse email</label>
                              <div className={styles.profileFieldValue} style={{ opacity: 0.7 }}>
                                {email}
                                <span className={styles.profileFieldLock}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </span>
                              </div>
                            </div>
                            <div className={styles.profileField}>
                              <label className={styles.profileFieldLabel}>Numéro de téléphone</label>
                              {profileEditing ? (
                                <input
                                  type="tel"
                                  className={styles.profileFieldInput}
                                  value={profilePhone}
                                  onChange={(e) => setProfilePhone(e.target.value)}
                                  placeholder="+237 6XX XX XX XX"
                                />
                              ) : (
                                <div className={styles.profileFieldValue}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0, color: "#00673C" }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                  {profilePhone || "—"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Location Info Card */}
                        <div className={styles.profileDetailCard}>
                          <div className={styles.profileDetailCardHeader}>
                            <div className={styles.profileDetailIcon}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            </div>
                            <h3>Adresse & Localisation</h3>
                          </div>
                          <div className={styles.profileFieldsGroup}>
                            <div className={styles.profileField}>
                              <label className={styles.profileFieldLabel}>Ville</label>
                              {profileEditing ? (
                                <select
                                  className={styles.profileFieldInput}
                                  value={profileCity}
                                  onChange={(e) => setProfileCity(e.target.value)}
                                >
                                  <option value="">Sélectionnez votre ville</option>
                                  <option value="Douala">Douala</option>
                                  <option value="Yaoundé">Yaoundé</option>
                                  <option value="Bafoussam">Bafoussam</option>
                                  <option value="Garoua">Garoua</option>
                                  <option value="Bamenda">Bamenda</option>
                                  <option value="Maroua">Maroua</option>
                                  <option value="Kribi">Kribi</option>
                                  <option value="Limbé">Limbé</option>
                                  <option value="Bertoua">Bertoua</option>
                                  <option value="Ebolowa">Ebolowa</option>
                                  <option value="Ngaoundéré">Ngaoundéré</option>
                                  <option value="Buea">Buea</option>
                                </select>
                              ) : (
                                <div className={styles.profileFieldValue}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0, color: "#00673C" }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                  {profileCity || <span style={{ color: "#a0aec0", fontStyle: "italic", fontWeight: 500 }}>Non renseignée</span>}
                                </div>
                              )}
                            </div>
                            <div className={styles.profileField}>
                              <label className={styles.profileFieldLabel}>Adresse complète</label>
                              {profileEditing ? (
                                <textarea
                                  className={`${styles.profileFieldInput} ${styles.profileTextarea}`}
                                  value={profileAddress}
                                  onChange={(e) => setProfileAddress(e.target.value)}
                                  placeholder="Ex: Quartier Akwa, Rue 123, Immeuble XYZ..."
                                  rows={3}
                                />
                              ) : (
                                <div className={styles.profileFieldValue}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0, color: "#00673C" }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                  {profileAddress || <span style={{ color: "#a0aec0", fontStyle: "italic", fontWeight: 500 }}>Non renseignée</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Account Security Card */}
                      <div className={styles.profileSecurityCard}>
                        <div className={styles.profileDetailCardHeader}>
                          <div className={styles.profileDetailIcon} style={{ background: "rgba(251, 166, 0, 0.1)", color: "#b7791f" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                          </div>
                          <h3>Sécurité du Compte</h3>
                        </div>
                        <div className={styles.profileSecurityItems}>
                          <div className={styles.profileSecurityItem}>
                            <div className={styles.profileSecurityLeft}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                              <div>
                                <div className={styles.profileSecurityLabel}>Mot de passe</div>
                                <div className={styles.profileSecurityDesc}>Dernière modification : il y a 30 jours</div>
                              </div>
                            </div>
                            <button className={styles.profileSecurityBtn}>Modifier</button>
                          </div>
                          <div className={styles.profileSecurityItem}>
                            <div className={styles.profileSecurityLeft}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" /></svg>
                              <div>
                                <div className={styles.profileSecurityLabel}>Vérification par téléphone</div>
                                <div className={styles.profileSecurityDesc}>Numéro vérifié : {profilePhone || "+237 6XX XX XX XX"}</div>
                              </div>
                            </div>
                            <span className={styles.profileSecurityVerified}>✓ Vérifié</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </main>
              </div>
            )}

            {userRole === "admin" && (
              <div className={styles.adminSpace}>
                {/* Banner */}
                <div className={styles.agencyBanner} style={{ background: "linear-gradient(135deg, #0A2F1D 0%, #a27a00 100%)" }}>
                  <div className={styles.agencyInfo}>
                    <div className={styles.agencyLogoCircle} style={{ background: "#ffffff", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" style={{ width: "35px", height: "35px" }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 17v-5m3 5v-3m3 5V9" />
                      </svg>
                    </div>
                    <div className={styles.agencyText}>
                      <h1 style={{ fontSize: "1.6rem", fontWeight: 900 }}>Console Administration</h1>
                      <span className={styles.agencyBadge}>Super Admin SafeTrip</span>
                    </div>
                  </div>
                  <div className={styles.bannerControls}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Compte Admin : {email}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIconBox} style={{ background: "#eef8f3", color: "#2f855a" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div className={styles.statValueContainer}>
                      <span className={styles.statLabel}>Chiffre d'Affaires Global</span>
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
                      <span className={styles.statTrend} style={{ color: "#718096" }}>Tous certifiées SafeTrip</span>
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
                      <span className={styles.statTrend} style={{ color: "#2f855a" }}>Conformité bagages optimale</span>
                    </div>
                  </div>
                </div>

                {/* Platform overview */}
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
                            <th>Chiffre d'Affaires</th>
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
                              <td><span className={styles.agencyBadge} style={{ background: "#fffaf0", color: "#b7791f", border: "none" }}>{agency.cert}</span></td>
                              <td><strong>{(2800000 + i * 450000).toLocaleString()} FCFA</strong></td>
                              <td><strong>{82 + i * 2}%</strong></td>
                              <td><span className={`${styles.statusPill} ${styles.statusChecked}`}>Actif</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {userRole === "agency" && (
              <>
                {/* Agency Banner Info */}
                <div className={styles.agencyBanner}>
                  <div className={styles.agencyInfo}>
                    <div className={styles.agencyLogoCircle}>
                  <img src={activeAgencyObj.logo} alt={activeAgencyObj.name} />
                </div>
                <div className={styles.agencyText}>
                  <h1>{activeAgencyObj.name}</h1>
                  <span className={styles.agencyBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {activeAgencyObj.cert}
                  </span>
                </div>
              </div>

              <div className={styles.bannerControls}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>BASCULER D'AGENCE :</span>
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
              </div>
            </div>

            {/* KPI Cards section */}
            <div className={styles.statsGrid}>
              
              {/* Sales Card */}
              <div className={styles.statCard}>
                <div className={`${styles.statIconBox}`} style={{ background: "#eef8f3", color: "var(--secondary-blue)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className={styles.statValueContainer}>
                  <span className={styles.statLabel}>Chiffre d'Affaires</span>
                  <span className={styles.statValue}>{totalSales.toLocaleString()} FCFA</span>
                  <span className={`${styles.statTrend} ${styles.trendUp}`}>
                    ▲ +14% aujourd'hui
                  </span>
                </div>
              </div>

              {/* Trajets Actifs */}
              <div className={styles.statCard}>
                <div className={`${styles.statIconBox}`} style={{ background: "#fffaf0", color: "var(--accent-gold)" }}>
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
                <div className={`${styles.statIconBox}`} style={{ background: "#ebf8ff", color: "#3182ce" }}>
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
                <div className={`${styles.statIconBox}`} style={{ background: "#fff5f5", color: "var(--accent-red)" }}>
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                        <label className={styles.formLabel}>Ville d'Arrivée *</label>
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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Horaires actifs de l'agence
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
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {j.depTime} ({j.duration})
                          </div>
                          <div className={styles.tripMetaItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              </>
            )}
          </>
        )}

      </div>

      {/* 3. SIMULATED QR CODE LUGGAGE SCANNER OVERLAY MODAL */}
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
                Veuillez pointer le QR code du billet ou du tag bagage ({scanningPassenger.luggageCount} colis) devant l'appareil.
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
