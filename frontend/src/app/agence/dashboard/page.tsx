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

interface Bus {
  id: string;
  plaque: string;
  busClass: "VIP" | "Confort" | "Classique" | "Executive Class";
  capacity: number;
  occupied: number;
  status: "En route" | "En maintenance" | "Disponible";
  amenities: string[];
}

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
  qrRef: string;
  fragile: boolean;
}

interface ChatMessage {
  id: number;
  sender: "agency" | "contact";
  text: string;
  time: string;
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

  // Premium Sidebar Navigation Active Tab
  const [agencyActiveTab, setAgencyActiveTab] = useState("dashboard");

  // Core Databases (State-backed for instant UI reactivity)
  const [journeysState, setJourneysState] = useState<Journey[]>([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
  const [passengersMap, setPassengersMap] = useState<{ [journeyId: number]: Passenger[] }>({});
  
  // Simulated Bus Fleet Database
  const [busesState, setBusesState] = useState<Bus[]>([]);
  const [selectedBusForPlan, setSelectedBusForPlan] = useState<Bus | null>(null);

  // Simulated Colis/Baggage Database
  const [colisState, setColisState] = useState<Colis[]>([]);

  // Interactive Messenger States
  const [activeContactId, setActiveContactId] = useState("support");
  const [chatThreads, setChatThreads] = useState<{ [contactId: string]: ChatMessage[] }>({
    support: [
      { id: 1, sender: "contact", text: "Bonjour, l'équipe d'assistance SafeTrip est disponible. Comment pouvons-nous vous aider aujourd'hui ?", time: "09:15" },
      { id: 2, sender: "agency", text: "Bonjour, nous aimerions certifier une nouvelle ligne de bus Douala-Kribi.", time: "09:30" },
      { id: 3, sender: "contact", text: "Parfait ! Veuillez nous transmettre la plaque d'immatriculation et l'agrément ministériel du bus dans l'onglet Profil.", time: "09:32" }
    ],
    marc: [
      { id: 1, sender: "contact", text: "Bonjour Finexs, mon colis de référence BAG-2026-FX58-A est bien enregistré à bord ?", time: "11:05" },
      { id: 2, sender: "agency", text: "Bonjour Marc, oui ! Votre sac de voyage noir de 15 kg a été scanné avec succès et est à bord.", time: "11:20" }
    ],
    syntyche: [
      { id: 1, sender: "contact", text: "Merci pour le voyage VIP de ce matin, le bus était très confortable et le Wi-Fi super rapide !", time: "12:00" },
      { id: 2, sender: "agency", text: "Merci Syntyche ! Nous mettons tout en oeuvre pour vous offrir le meilleur service possible. Bon séjour !", time: "12:15" }
    ]
  });
  const [chatInputText, setChatInputText] = useState("");

  // Simulated Custom Agency Profile fields
  const [profileEmail, setProfileEmail] = useState("contact@finexs.cm");
  const [profilePhone, setProfilePhone] = useState("+237 699 90 90 90");
  const [profileAddress, setProfileAddress] = useState("Douala - Rue Akwa, Cameroun");
  const [profileDescription, setProfileDescription] = useState("Pionnier du transport VIP interurbain sécurisé au Cameroun. Voyages quotidiens Douala - Yaoundé.");
  const [profileEditing, setProfileEditing] = useState(false);

  // Form States for planning a new trip
  const [depCity, setDepCity] = useState("");
  const [arrCity, setArrCity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [depTime, setDepTime] = useState("08:00");
  const [busClass, setBusClass] = useState<"VIP" | "Confort" | "Classique" | "Executive Class">("VIP");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
  // UI Toast Alerts & QR scanner modal variables
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastSuccess, setIsToastSuccess] = useState(true);
  const [scanningPassenger, setScanningPassenger] = useState<Passenger | null>(null);
  const [activeScanJourneyId, setActiveScanJourneyId] = useState<number | null>(null);

  // Security Check & initial DB hydration
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

    // Hydrate journeys
    const saved = localStorage.getItem("safetrip_journeys");
    let initialJourneys: Journey[] = [];
    if (saved) {
      initialJourneys = JSON.parse(saved);
      setJourneysState(initialJourneys);
    } else {
      initialJourneys = [
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
      localStorage.setItem("safetrip_journeys", JSON.stringify(initialJourneys));
      setJourneysState(initialJourneys);
    }

    // Hydrate bus fleet
    const savedBuses = localStorage.getItem("safetrip_buses");
    if (savedBuses) {
      setBusesState(JSON.parse(savedBuses));
    } else {
      const defaultBuses: Bus[] = [
        { id: "BUS-01", plaque: "LT-8812-G", busClass: "VIP", capacity: 30, occupied: 24, status: "Disponible", amenities: ["wifi", "ac", "toilet", "plug"] },
        { id: "BUS-02", plaque: "LT-4491-A", busClass: "Confort", capacity: 50, occupied: 42, status: "En route", amenities: ["ac", "plug"] },
        { id: "BUS-03", plaque: "LT-1102-K", busClass: "Classique", capacity: 70, occupied: 0, status: "En maintenance", amenities: ["ac"] },
        { id: "BUS-04", plaque: "LT-9921-X", busClass: "Executive Class", capacity: 24, occupied: 20, status: "Disponible", amenities: ["wifi", "ac", "toilet", "catering", "plug"] }
      ];
      localStorage.setItem("safetrip_buses", JSON.stringify(defaultBuses));
      setBusesState(defaultBuses);
    }

    // Hydrate colis
    const savedColis = localStorage.getItem("safetrip_colis_db");
    if (savedColis) {
      setColisState(JSON.parse(savedColis));
    } else {
      const defaultColis: Colis[] = [
        { id: "BAG-2026-FX58-A", label: "Sac de Voyage principal", type: "Sac", weight: 15, color: "Noir", status: "À bord du bus", trip: "Douala → Yaoundé", tripDate: "25 Mai 2026 · 06:15", agency: "Finexs Voyage", qrRef: "QR-FX58-A", fragile: false },
        { id: "BAG-2026-FX58-B", label: "Carton scellé (Alimentation)", type: "Carton", weight: 8, color: "Brun", status: "Scanné en gare", trip: "Douala → Yaoundé", tripDate: "25 Mai 2026 · 06:15", agency: "Finexs Voyage", qrRef: "QR-FX58-B", fragile: true },
        { id: "BAG-2026-BV33-A", label: "Valise cabine", type: "Valise", weight: 12, color: "Bordeaux", status: "Livré", trip: "Yaoundé → Bafoussam", tripDate: "18 Avril 2026 · 08:00", agency: "Buca Voyage", qrRef: "QR-BV33-A", fragile: false },
        { id: "BAG-2026-GE21-A", label: "Sac à dos randonnée", type: "Sac à dos", weight: 5, color: "Bleu", status: "En attente de scan", trip: "Douala → Yaoundé", tripDate: "25 Mai 2026 · 18:30", agency: "General Express", qrRef: "QR-GE21-A", fragile: false }
      ];
      localStorage.setItem("safetrip_colis_db", JSON.stringify(defaultColis));
      setColisState(defaultColis);
    }

    // Hydrate profile custom settings
    const savedProfile = localStorage.getItem("safetrip_agency_profile_custom");
    if (savedProfile) {
      try {
        const p = JSON.parse(savedProfile);
        if (p.email) setProfileEmail(p.email);
        if (p.phone) setProfilePhone(p.phone);
        if (p.address) setProfileAddress(p.address);
        if (p.description) setProfileDescription(p.description);
      } catch { /* ignore */ }
    }

    setIsMounted(true);
  }, []);

  // Filter journeys list to only display operations of the selected agency
  const agencyJourneys = journeysState.filter(j => 
    j.operator.toLowerCase().includes(selectedAgencyName.split(" ")[0].toLowerCase())
  );

  // Filter colis list to only display operations of the selected agency
  const agencyColis = colisState.filter(c => 
    c.agency.toLowerCase().includes(selectedAgencyName.split(" ")[0].toLowerCase())
  );

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

    // 1. Update passenger scan status
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

    // 2. Generate or update colis registered under this passenger's simulation in colisState
    const newColis: Colis = {
      id: `BAG-2026-FX${activeScanJourneyId.toString().slice(-2)}-${scanningPassenger.id}`,
      label: `Bagage de ${scanningPassenger.name}`,
      type: "Valise",
      weight: 12 + scanningPassenger.id * 2,
      color: scanningPassenger.id % 2 === 0 ? "Noir" : "Rouge",
      status: "Scanné en gare",
      trip: "Douala → Yaoundé",
      tripDate: "25 Mai 2026 · 06:15",
      agency: selectedAgencyName,
      qrRef: `QR-FX${activeScanJourneyId.toString().slice(-2)}-${scanningPassenger.id}`,
      fragile: scanningPassenger.id % 3 === 0
    };

    setColisState(prev => {
      const filtered = prev.filter(c => c.id !== newColis.id);
      const updated = [newColis, ...filtered];
      localStorage.setItem("safetrip_colis_db", JSON.stringify(updated));
      return updated;
    });

    showToast(`QR Code validé ! Passager ${scanningPassenger.name} enregistré et bagages scannés.`);
    setScanningPassenger(null);
  };

  // Send a custom chat message and trigger instant simulated reply
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now(),
      sender: "agency",
      text: chatInputText,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };

    setChatThreads(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), newMsg]
    }));
    setChatInputText("");

    // Simulate smart dynamic reply in 1.5 seconds
    setTimeout(() => {
      let replyText = "Entendu, notre équipe prend en charge votre demande.";
      if (activeContactId === "support") {
        replyText = "Nous avons bien reçu vos documents d'immatriculation. La nouvelle ligne sera active d'ici 30 minutes après vérification administrative. Merci !";
      } else if (activeContactId === "marc") {
        replyText = "Super, merci beaucoup pour la confirmation rapide ! SafeTrip est vraiment top.";
      } else if (activeContactId === "syntyche") {
        replyText = "C'est noté, je réserverai à nouveau chez vous pour mon prochain déplacement.";
      }

      const replyMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: "contact",
        text: replyText,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      };

      setChatThreads(prev => ({
        ...prev,
        [activeContactId]: [...(prev[activeContactId] || []), replyMsg]
      }));
    }, 1500);
  };

  // Save profile administrative changes
  const handleSaveAgencyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const customProfile = {
      email: profileEmail,
      phone: profilePhone,
      address: profileAddress,
      description: profileDescription
    };
    localStorage.setItem("safetrip_agency_profile_custom", JSON.stringify(customProfile));
    setProfileEditing(false);
    showToast("Profil de l'agence sauvegardé avec succès ! ✅");
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

  // Chat contacts summary
  const chatContacts = [
    { id: "support", name: "Support SafeTrip", short: "ST", online: true, lastMsg: chatThreads.support[chatThreads.support.length - 1]?.text || "" },
    { id: "marc", name: "Marc Nzenang", short: "MN", online: false, lastMsg: chatThreads.marc[chatThreads.marc.length - 1]?.text || "" },
    { id: "syntyche", name: "Syntyche Toukam", short: "ST", online: true, lastMsg: chatThreads.syntyche[chatThreads.syntyche.length - 1]?.text || "" }
  ];

  return (
    <div className={styles.clientDashboardLayout}>
      {toastMessage && (
        <div className={`${styles.toast} ${isToastSuccess ? styles.toastSuccess : ""}`}>
          <span>{toastMessage}</span>
          <button className={styles.toastClose} onClick={() => setToastMessage(null)}>×</button>
        </div>
      )}

      {/* 1. VERTICAL SIDEBAR */}
      <aside className={styles.clientSidebar}>
        <div className={styles.sidebarBrand}>
          <img src="/images/logo-removebg-preview (2).png" alt="Logo" className={styles.sidebarLogoImg} />
        </div>
        
        {/* Connected Agency Identity Capsule */}
        <div style={{ padding: "0 20px 15px 20px", borderBottom: "1px solid #edf2f7", marginBottom: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,103,60,0.06)", padding: "10px", borderRadius: "12px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#ffffff", padding: "5px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={activeAgencyObj.logo} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: "0.8rem", color: "#0A2F1D", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeAgencyObj.name}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--accent-gold)", fontWeight: 700 }}>{activeAgencyObj.cert}</div>
            </div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            type="button"
            className={`${styles.sidebarNavItem} ${agencyActiveTab === "dashboard" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => setAgencyActiveTab("dashboard")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            Dashboard
          </button>

          <button
            type="button"
            className={`${styles.sidebarNavItem} ${agencyActiveTab === "bus" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => setAgencyActiveTab("bus")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2M5 8H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
              <rect x="5" y="4" width="14" height="15" rx="2" />
              <circle cx="9" cy="15" r="1.5" />
              <circle cx="15" cy="15" r="1.5" />
            </svg>
            Bus
          </button>

          <button
            type="button"
            className={`${styles.sidebarNavItem} ${agencyActiveTab === "courier" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => setAgencyActiveTab("courier")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            Courrier &amp; Colis
          </button>

          <button
            type="button"
            className={`${styles.sidebarNavItem} ${agencyActiveTab === "horaire" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => setAgencyActiveTab("horaire")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Horaires &amp; Trajets
          </button>

          <button
            type="button"
            className={`${styles.sidebarNavItem} ${agencyActiveTab === "messagerie" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => setAgencyActiveTab("messagerie")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Messagerie
          </button>

          <button
            type="button"
            className={`${styles.sidebarNavItem} ${agencyActiveTab === "profil" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => setAgencyActiveTab("profil")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profil
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
        
        {/* Banner with basculer context at the top of content pane */}
        <div className={styles.agencyBanner} style={{ marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className={styles.agencyInfo}>
            <div className={styles.agencyLogoCircle} style={{ background: "#ffffff", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={activeAgencyObj.logo} alt={activeAgencyObj.name} style={{ width: "32px", height: "32px", objectFit: "contain" }} />
            </div>
            <div className={styles.agencyText}>
              <h1 style={{ color: "#ffffff", fontSize: "1.4rem", fontWeight: 800 }}>Tableau de Bord Agence</h1>
              <span className={styles.agencyBadge}>{selectedAgencyName} — {activeAgencyObj.cert}</span>
            </div>
          </div>

          <div className={styles.bannerControls} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>SIMULATION CONTEXTE :</span>
            <select 
              className={styles.agencySelector}
              value={selectedAgencyName}
              onChange={(e) => handleAgencySwitch(e.target.value)}
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff", padding: "6px 12px", borderRadius: "8px", fontWeight: "700" }}
            >
              {PARTNER_AGENCIES.map(agency => (
                <option key={agency.name} value={agency.name} style={{ color: "#000000" }}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TAB 1: DASHBOARD VIEW */}
        {agencyActiveTab === "dashboard" && (
          <div className={styles.tabContentFadeIn}>
            {/* KPIs Grid */}
            <div className={styles.statsGrid}>
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
                  <span className={`${styles.statTrend} ${styles.trendUp}`}>▲ +14% aujourd&apos;hui</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconBox} style={{ background: "#fffaf0", color: "var(--accent-gold)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className={styles.statValueContainer}>
                  <span className={styles.statLabel}>Trajets Actifs</span>
                  <span className={styles.statValue}>{agencyJourneys.length} Horaires</span>
                  <span className={styles.statTrend} style={{ color: "#718096" }}>● 100% opérationnels</span>
                </div>
              </div>

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
                  <span className={styles.statLabel}>Taux Moyen de Remplissage</span>
                  <span className={styles.statValue}>84.5%</span>
                  <span className={`${styles.statTrend} ${styles.trendUp}`}>▲ +3.2% vs hier</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIconBox} style={{ background: "#fff5f5", color: "var(--accent-red)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <div className={styles.statValueContainer}>
                  <span className={styles.statLabel}>Colis &amp; Bagages</span>
                  <span className={styles.statValue}>{scannedLuggage} / {totalLuggage}</span>
                  <span className={styles.statTrend} style={{ color: "#718096" }}>● {totalLuggage > 0 ? Math.round((scannedLuggage / totalLuggage) * 100) : 0}% QR-scannés</span>
                </div>
              </div>
            </div>

            {/* Quick Operations summary panels */}
            <div className={styles.dashboardGrid} style={{ marginTop: "25px" }}>
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>Activités Récentes de l&apos;Agence</h2>
                </div>
                <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #f7fafc", paddingBottom: "12px" }}>
                    <div style={{ background: "rgba(0,103,60,0.1)", color: "#00673C", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "normal", fontSize: "0.8rem", fontWeight: "800", flexShrink: 0 }}>✓</div>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a202c" }}>Trajet Douala → Yaoundé planifié</div>
                      <div style={{ fontSize: "0.7rem", color: "#a0aec0" }}>Il y a 5 minutes · Bus VIP</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #f7fafc", paddingBottom: "12px" }}>
                    <div style={{ background: "rgba(251,166,0,0.1)", color: "#b7791f", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "normal", fontSize: "0.8rem", fontWeight: "800", flexShrink: 0 }}>▣</div>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a202c" }}>Bagage BAG-2026-FX58-A scanné</div>
                      <div style={{ fontSize: "0.7rem", color: "#a0aec0" }}>Il y a 12 minutes · Passager Marc Ndip</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #f7fafc", paddingBottom: "12px" }}>
                    <div style={{ background: "rgba(49,130,206,0.1)", color: "#2b6cb0", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "normal", fontSize: "0.8rem", fontWeight: "800", flexShrink: 0 }}>✉</div>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a202c" }}>Nouveau message reçu du Support SafeTrip</div>
                      <div style={{ fontSize: "0.7rem", color: "#a0aec0" }}>Il y a 25 minutes · Assistance administrative</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>Horaires imminents de départ</h2>
                </div>
                <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {agencyJourneys.slice(0, 3).map(j => (
                    <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px 15px", borderRadius: "10px" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0A2F1D" }}>{j.depTime} · {j.depStation.split(" - ")[0]} → {j.arrStation.split(" - ")[0]}</div>
                        <div style={{ fontSize: "0.72rem", color: "#718096" }}>Bus {j.operator.split(" ").slice(-1)[0]} • {passengersMap[j.id]?.length || 0} voyageurs</div>
                      </div>
                      <span className={styles.statusPill} style={{ background: "#eef8f3", color: "#2f855a" }}>Prêt</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUS FLEET MANAGEMENT */}
        {agencyActiveTab === "bus" && (
          <div className={styles.tabContentFadeIn}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0A2F1D" }}>Gestion de la Flotte de Bus</h2>
                <p style={{ fontSize: "0.8rem", color: "#718096" }}>{busesState.length} bus actifs répertoriés</p>
              </div>
            </div>

            <div className={styles.busGrid}>
              {busesState.map(bus => (
                <div key={bus.id} className={styles.busCard}>
                  {/* Status Pill top-right */}
                  <span className={`${styles.busStatusBadge} ${
                    bus.status === "En route" ? styles.busStatusEnRoute :
                    bus.status === "Disponible" ? styles.busStatusDisponible :
                    styles.busStatusMaintenance
                  }`}>
                    {bus.status}
                  </span>

                  <div className={styles.busCardHeader}>
                    <span className={styles.busPlaque}>{bus.plaque}</span>
                    <span className={`${styles.busClassBadge} ${
                      bus.busClass === "VIP" ? styles.busClassVIP :
                      bus.busClass === "Confort" ? styles.busClassConfort :
                      bus.busClass === "Executive Class" ? styles.busClassExecutive :
                      styles.busClassClassique
                    }`}>
                      {bus.busClass}
                    </span>
                  </div>

                  <div className={styles.busCardBody}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "5px 0 0 0" }}>Bus #{bus.id.split("-")[1]}</h3>
                    
                    <div>
                      <div className={styles.busCapacityLabel}>
                        <span>Taux de remplissage</span>
                        <span>{bus.occupied} / {bus.capacity} places</span>
                      </div>
                      <div className={styles.busCapacityBar} style={{ marginTop: "6px" }}>
                        <div 
                          className={styles.busCapacityFill} 
                          style={{ 
                            width: `${(bus.occupied / bus.capacity) * 100}%`,
                            background: bus.status === "En route" ? "#48bb78" : bus.status === "Disponible" ? "#3182ce" : "#a0aec0"
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.busCardFooter}>
                    <div className={styles.busAmenityList}>
                      {bus.amenities.map(am => (
                        <span key={am} className={styles.busAmenityIcon} title={am.toUpperCase()}>
                          {am === "wifi" ? "📶" : am === "ac" ? "❄️" : am === "toilet" ? "🚽" : am === "catering" ? "🍔" : "🔌"}
                        </span>
                      ))}
                    </div>
                    
                    <button 
                      className={styles.busPlanBtn}
                      onClick={() => {
                        setSelectedBusForPlan(bus);
                        setBusClass(bus.busClass);
                        setAgencyActiveTab("horaire");
                        showToast(`Bus ${bus.plaque} sélectionné pour planifier un trajet.`);
                      }}
                    >
                      Planifier trajet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: COURIER & LUGGAGE MANAGEMENT */}
        {agencyActiveTab === "courier" && (
          <div className={styles.tabContentFadeIn}>
            <div className={styles.panelCard}>
              <div className={styles.panelHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 className={styles.panelTitle}>Enregistrement et Suivi des Bagages &amp; Colis</h2>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    className={styles.voirBilletBtn} 
                    onClick={() => {
                      if (agencyJourneys.length > 0) {
                        const defaultP: Passenger = { id: 99, name: "Nouveau Client", phone: "+237 600 00 00 00", seat: "15C", status: "Payé", luggageCount: 1, luggageScanned: false };
                        handleOpenScanner(defaultP);
                      } else {
                        showToast("Planifiez d'abord un trajet pour pouvoir y scanner des bagages !", false);
                      }
                    }}
                    style={{ background: "#00673C", color: "#ffffff", padding: "6px 12px", border: "none", fontSize: "0.8rem", borderRadius: "8px" }}
                  >
                    Scanner Nouveau Bagage
                  </button>
                </div>
              </div>

              <div className={styles.panelBody} style={{ padding: "0" }}>
                <div className={styles.rosterTableContainer} style={{ border: "none", borderRadius: "0" }}>
                  <table className={styles.rosterTable}>
                    <thead>
                      <tr>
                        <th>Référence Colis</th>
                        <th>Description Bagage</th>
                        <th>Poids &amp; Type</th>
                        <th>Trajet &amp; Compagnie</th>
                        <th>Statut Enregistrement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agencyColis.map(colis => (
                        <tr key={colis.id}>
                          <td><strong style={{ color: "#00673C", fontFamily: "monospace" }}>{colis.id}</strong></td>
                          <td>
                            <div>
                              <strong>{colis.label}</strong>
                              {colis.fragile && <span style={{ background: "#fff5f5", color: "#e53e3e", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", marginLeft: "6px", fontWeight: "800" }}>⚠️ FRAGILE</span>}
                            </div>
                          </td>
                          <td>{colis.weight} KG • {colis.type} ({colis.color})</td>
                          <td>
                            <div>
                              <strong>{colis.trip}</strong>
                              <span style={{ display: "block", fontSize: "0.7rem", color: "#a0aec0" }}>{colis.tripDate}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`${styles.statusPill} ${
                              colis.status === "Livré" || colis.status === "À bord du bus" ? styles.statusChecked :
                              colis.status === "Scanné en gare" ? styles.statusPaid : styles.statusPending
                            }`}>
                              {colis.status}
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
        )}

        {/* TAB 4: HORAIRES & TRAJETS (PLANNER + SCHEDULER + PASSENGERS ROSTER) */}
        {agencyActiveTab === "horaire" && (
          <div className={styles.tabContentFadeIn}>
            {/* Dashboard Dual Grid Workspace */}
            <div className={styles.dashboardGrid}>
              
              {/* Left Column: Form Section */}
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "16px", height: "16px", marginRight: "6px", display: "inline-block", verticalAlign: "middle" }}>
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
                          onChange={(e) => setBusClass(e.target.value as any)}
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
                      <h4 className={styles.amenitiesHeading}>Équipements &amp; Services à Bord</h4>
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "16px", height: "16px", marginRight: "6px", display: "inline-block", verticalAlign: "middle" }}>
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
                        <span>Liste de Passagers &amp; Enregistrement</span>
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
                                            type="button"
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
        )}

        {/* TAB 5: MESSAGERIE INTERACTIVE */}
        {agencyActiveTab === "messagerie" && (
          <div className={styles.tabContentFadeIn}>
            <div className={styles.chatLayout}>
              {/* Chat Sidebar */}
              <div className={styles.chatSidebar}>
                <div className={styles.chatSidebarHeader}>
                  Discussions de l&apos;Agence
                </div>
                <div className={styles.contactList}>
                  {chatContacts.map(contact => (
                    <div 
                      key={contact.id} 
                      className={`${styles.contactItem} ${activeContactId === contact.id ? styles.contactItemActive : ""}`}
                      onClick={() => setActiveContactId(contact.id)}
                    >
                      <div className={`${styles.contactAvatar} ${contact.online ? styles.contactAvatarOnline : ""}`}>
                        {contact.short}
                      </div>
                      <div className={styles.contactInfo}>
                        <div className={styles.contactHeaderRow}>
                          <span className={styles.contactName}>{contact.name}</span>
                          <span className={styles.contactTime}>12:35</span>
                        </div>
                        <div className={styles.contactLastMsg}>{contact.lastMsg}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Main Area */}
              <div className={styles.chatMain}>
                <div className={styles.chatMainHeader}>
                  <div className={styles.chatActiveName}>
                    <span>{chatContacts.find(c => c.id === activeContactId)?.name}</span>
                    <span className={styles.chatActiveStatus}>
                      {chatContacts.find(c => c.id === activeContactId)?.online ? "● En ligne" : "Hors ligne"}
                    </span>
                  </div>
                </div>

                <div className={styles.chatMessages}>
                  {(chatThreads[activeContactId] || []).map(msg => (
                    <div 
                      key={msg.id} 
                      className={`${styles.chatBubble} ${msg.sender === "agency" ? styles.chatBubbleSent : styles.chatBubbleRecv}`}
                    >
                      <div>{msg.text}</div>
                      <div className={styles.chatBubbleTime}>{msg.time}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChatMessage} className={styles.chatInputArea}>
                  <input 
                    type="text" 
                    placeholder="Écrivez votre message ici..." 
                    className={styles.chatInput}
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                  />
                  <button type="submit" className={styles.chatSendBtn}>
                    ➤
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AGENCY PROFILE SETTINGS */}
        {agencyActiveTab === "profil" && (
          <div className={styles.tabContentFadeIn}>
            <div className={styles.profileGrid}>
              <div className={styles.profileSidebar}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#f7fafc", border: "1px solid #edf2f7", display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", margin: "0 auto 15px auto" }}>
                  <img src={activeAgencyObj.logo} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: "0" }}>{selectedAgencyName}</h3>
                <span className={styles.agencyBadge} style={{ display: "inline-block", marginTop: "5px" }}>{activeAgencyObj.cert}</span>
                
                <div style={{ marginTop: "20px", borderTop: "1px solid #edf2f7", paddingTop: "15px", textAlign: "left", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "0.7rem", color: "#a0aec0", textTransform: "uppercase", fontWeight: 700 }}>Statut plateforme</span>
                    <span style={{ fontSize: "0.8rem", color: "#48bb78", fontWeight: "700" }}>✓ Certifiée Actif</span>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.7rem", color: "#a0aec0", textTransform: "uppercase", fontWeight: 700 }}>Intégration QR Code</span>
                    <span style={{ fontSize: "0.8rem", color: "#48bb78", fontWeight: "700" }}>✓ Opérationnel</span>
                  </div>
                </div>
              </div>

              <div className={styles.panelCard}>
                <div className={styles.panelHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 className={styles.panelTitle}>Informations Administratives de l&apos;Agence</h2>
                  <button 
                    type="button"
                    className={styles.voirBilletBtn} 
                    onClick={() => {
                      if (profileEditing) {
                        const fakeEvent = { preventDefault: () => {} };
                        handleSaveAgencyProfile(fakeEvent as any);
                      } else {
                        setProfileEditing(true);
                      }
                    }}
                    style={{ background: "#00673C", color: "#ffffff", padding: "6px 12px", border: "none", fontSize: "0.8rem", borderRadius: "8px" }}
                  >
                    {profileEditing ? "Sauvegarder" : "Modifier"}
                  </button>
                </div>

                <div className={styles.panelBody}>
                  <form onSubmit={handleSaveAgencyProfile} className={styles.profileFormMain}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Adresse Email de Contact</label>
                        <input 
                          type="email" 
                          className={styles.formInput}
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          disabled={!profileEditing}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Numéro de Téléphone (Support)</label>
                        <input 
                          type="text" 
                          className={styles.formInput}
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          disabled={!profileEditing}
                        />
                      </div>

                      <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                        <label className={styles.formLabel}>Gare Principale / Siège social</label>
                        <input 
                          type="text" 
                          className={styles.formInput}
                          value={profileAddress}
                          onChange={(e) => setProfileAddress(e.target.value)}
                          disabled={!profileEditing}
                        />
                      </div>

                      <div className={styles.formGroup} style={{ gridColumn: "span 2" }}>
                        <label className={styles.formLabel}>Description de la Compagnie</label>
                        <textarea 
                          className={styles.formInput}
                          value={profileDescription}
                          onChange={(e) => setProfileDescription(e.target.value)}
                          disabled={!profileEditing}
                          rows={4}
                          style={{ fontFamily: "inherit", padding: "10px", resize: "none" }}
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Simulated QR Code Luggage Scanner Overlay Modal */}
      {scanningPassenger && (
        <div className={styles.scannerModalOverlay} onClick={() => setScanningPassenger(null)}>
          <div className={styles.scannerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.scannerHeader}>
              <h3>Lecteur de Billets &amp; Bagages SafeTrip</h3>
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
                type="button"
                className={styles.simulateSuccessBtn}
                onClick={handleSimulateScanSuccess}
              >
                Simuler un scan réussi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
