"use client";

import styles from "./page.module.css";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/UserContext";
import { useSocket } from "@/components/useSocket";

const API_BASE = `${((typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) ? 'https://safe-trip-backend.vercel.app' : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://${window.location.hostname}:5000` : 'https://safe-trip-backend.vercel.app')))}/api/agency`;
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
});

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
  busClass?: string;
  warning?: string;
  isNight?: boolean;
  busId?: string;
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
  agencyId: number;
  plaque: string;
  busClass: "VIP" | "Confort" | "Classique" | "Executive Class";
  capacity: number;
  occupied: number;
  status: "En route" | "En maintenance" | "Disponible";
  amenities: string[];
}

interface Colis {
  id: string;
  agencyId: number;
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
  senderName?: string | null;
  senderPhone?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
}

interface ChatMessage {
  id: number;
  sender: "agency" | "contact";
  text: string;
  time: string;
  isRead?: boolean;
}

const PARTNER_AGENCIES = [
  { name: "Finexs Voyage", logo: "/images/finexs.png", cert: "Partenaire Platine" },
  { name: "Buca Voyage", logo: "/images/bucavoyage.png", cert: "Partenaire Or" },
  { name: "General Express", logo: "/images/General.png", cert: "Partenaire Certifié" },
  { name: "Touristique Express", logo: "/images/Touristique.png", cert: "Partenaire National" },
  { name: "Men Travel", logo: "/images/mentravel.png", cert: "Partenaire Premium" }
];

const RESERVATION_AMENITIES = [
  { key: "reclining", label: "Sièges inclinables" },
  { key: "plug", label: "Prises électriques" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "toilet", label: "Toilettes" },
  { key: "ac", label: "Climatisation" },
  { key: "pmr", label: "Personne à mobilité réduite" },
  { key: "catering", label: "Service de restauration disponible" }
];

export default function AgencyDashboard() {
  const router = useRouter();
  const { user, loading: userLoading, logout: contextLogout } = useUser();
  const [email, setEmail] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [selectedAgencyName, setSelectedAgencyName] = useState("Finexs Voyage");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper to resolve the active agency ID (must be before first usage)
  const currentAgencyId = PARTNER_AGENCIES.findIndex(a => a.name === selectedAgencyName) + 1;

  // Premium Sidebar Navigation Active Tab
  const [agencyActiveTab, setAgencyActiveTab] = useState("dashboard");

  // Core Databases (State-backed for instant UI reactivity)
  const [journeysState, setJourneysState] = useState<Journey[]>([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
  const [passengersMap, setPassengersMap] = useState<{ [journeyId: number]: Passenger[] }>({});
  
  // Simulated Bus Fleet Database
  const [busesState, setBusesState] = useState<Bus[]>([]);

  // Simulated Colis/Baggage Database
  const [colisState, setColisState] = useState<Colis[]>([]);

  // Interactive Messenger States
  const [activeContactId, setActiveContactId] = useState("support");
  const [chatThreads, setChatThreads] = useState<{ [contactId: string]: ChatMessage[] }>({});
  const [chatInputText, setChatInputText] = useState("");

  // Simulated Custom Agency Profile fields
  const [profileEmail, setProfileEmail] = useState("contact@finexs.cm");
  const [profilePhone, setProfilePhone] = useState("+237 699 90 90 90");
  const [profileAddress, setProfileAddress] = useState("Douala - Rue Akwa, Cameroun");
  const [profileDescription, setProfileDescription] = useState("Pionnier du transport VIP interurbain sécurisé au Cameroun. Voyages quotidiens Douala - Yaoundé.");
  const [profileEditing, setProfileEditing] = useState(false);

  // Bus CRUD modal state
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [busFormPlaque, setBusFormPlaque] = useState("");
  const [busFormClass, setBusFormClass] = useState<"VIP" | "Confort" | "Classique" | "Executive Class">("Classique");
  const [busFormCapacity, setBusFormCapacity] = useState(50);
  const [busFormStatus, setBusFormStatus] = useState<"En route" | "En maintenance" | "Disponible">("Disponible");
  const [busFormAmenities, setBusFormAmenities] = useState<string[]>([]);
  const [busSearchQuery, setBusSearchQuery] = useState("");


  // Form States for planning a new trip
  const [depCity, setDepCity] = useState("");
  const [arrCity, setArrCity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [depTime, setDepTime] = useState("08:00");
  const [selectedBusId, setSelectedBusId] = useState("");
  const [expandedRouteKey, setExpandedRouteKey] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [departureRouteSearch, setDepartureRouteSearch] = useState("");
  const [departureDayFilter, setDepartureDayFilter] = useState("all");
  const [departureTimeFilter, setDepartureTimeFilter] = useState("");
  const [departureClassFilter, setDepartureClassFilter] = useState("");
  const [routeDropdownOpen, setRouteDropdownOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(false);
  const isFirstMsgLoad = useRef(true);
  const prevUnreadCount = useRef<number | null>(null);
  
  // UI Toast Alerts & QR scanner modal variables
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastSuccess, setIsToastSuccess] = useState(true);
  const [scanningPassenger, setScanningPassenger] = useState<Passenger | null>(null);
  const [activeScanJourneyId, setActiveScanJourneyId] = useState<number | null>(null);

  // Colis selection & search states
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [luggageSearchText, setLuggageSearchText] = useState("");
  const [courierSearchText, setCourierSearchText] = useState("");

  // QR Scanner section states
  const [qrInputValue, setQrInputValue] = useState("");
  const [scanResult, setScanResult] = useState<{
    type: "billet" | "colis";
    data: Record<string, string>;
    rawText: string;
  } | null>(null);
  const [scanNotifStatus, setScanNotifStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanLinePos, setScanLinePos] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const scanLineAnimRef = useRef<number>(0);

  // Animate the scan line up and down
  useEffect(() => {
    if (!cameraOpen) return;
    let direction = 1;
    let pos = 0;
    const animate = () => {
      pos += direction * 1.2;
      if (pos >= 100) direction = -1;
      if (pos <= 0) direction = 1;
      setScanLinePos(pos);
      scanLineAnimRef.current = requestAnimationFrame(animate);
    };
    scanLineAnimRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(scanLineAnimRef.current);
  }, [cameraOpen]);

  useEffect(() => {
    let iv: any;
    fetchAgencyNotifications();
    // Slower fallback polling since Socket.IO handles real-time
    iv = setInterval(fetchAgencyNotifications, 60000);
    return () => { if (iv) clearInterval(iv); };
  }, [currentAgencyId]);

  // Socket.IO real-time notifications for agency
  const { connect: socketConnect, disconnect: socketDisconnect } = useSocket((notification) => {
    setAgencyNotifications((prev: any[]) => [{ ...notification, id: Date.now(), read: false, created_at: new Date().toISOString() }, ...prev]);
    setAgencyUnread((prev: number) => prev + 1);
  });

  useEffect(() => {
    if (user) socketConnect();
    return () => socketDisconnect();
  }, [user]);

  const parseQrText = (text: string) => {
    // New compact token format: STP|v1|<token>
    if (text.startsWith('STP|v1|')) {
      const token = text.split('|')[2] || '';
      return { type: 'billet' as const, data: { Token: token }, rawText: text };
    }
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const data: Record<string, string> = {};
    lines.forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > -1) {
        const key = line.slice(0, colonIdx).trim();
        const val = line.slice(colonIdx + 1).trim();
        if (key && val) data[key] = val;
      }
    });
    const isTicket = lines[0]?.includes('BILLET DE VOYAGE');
    const isColis = lines[0]?.includes('BAGAGE') || lines[0]?.includes('COLIS');
    if (!isTicket && !isColis) return null;
    return { type: (isTicket ? "billet" : "colis") as "billet" | "colis", data, rawText: text };
  };

  const openCamera = async () => {
    setCameraOpen(true);
    setCameraError(null);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanFrames();
      }
    } catch (err: any) {
      setCameraError("Impossible d'accéder à la caméra. Autorisez l'accès dans votre navigateur.");
    }
  };

  const closeCamera = () => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCameraError(null);
  };

  const scanFrames = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanFrames);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    import('jsqr').then(({ default: jsQR }) => {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        const parsed = parseQrText(code.data);
        if (parsed) {
          closeCamera();
          setScanResult(parsed);
          setScanNotifStatus("idle");
          showToast("✅ QR Code détecté et analysé !");
          return;
        }
      }
      animFrameRef.current = requestAnimationFrame(scanFrames);
    });
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && (!user || user.role !== "agency")) {
      router.push("/login");
    }
  }, [user, userLoading]);

  // Security Check & initial DB hydration from API
  useEffect(() => {
    if (userLoading || !user) return;

    setEmail(user.email);
    setSelectedAgencyName(user.fullName || "Agence SafeTrip");

    // Helper to map DB row to frontend Journey interface
    const mapDbJourney = (j: any): Journey => ({
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
      busClass: j.buses?.bus_class || j.bus_class || undefined,
      warning: j.warning || undefined,
      isNight: j.is_night || false,
      busId: j.bus_id || undefined
    });

    // Helper to map DB row to frontend Bus interface
    const mapDbBus = (b: any): Bus => {
      const amenities = [...(b.amenities || [])];
      if (b.has_wifi && !amenities.includes("wifi")) amenities.push("wifi");
      if (b.has_ac && !amenities.includes("ac")) amenities.push("ac");
      if (b.has_toilet && !amenities.includes("toilet")) amenities.push("toilet");
      if (b.has_catering && !amenities.includes("catering")) amenities.push("catering");
      
      return {
        id: b.id,
        agencyId: b.agency_id || 1,
        plaque: b.plaque,
        busClass: b.bus_class,
        capacity: b.capacity,
        occupied: b.occupied,
        status: b.status,
        amenities
      };
    };

    // Helper to map DB row to frontend Colis interface
    const mapDbColis = (c: any): Colis => ({
      id: c.id,
      agencyId: c.agency_id || 1,
      label: c.label,
      type: c.type,
      weight: c.weight,
      color: c.color,
      status: c.status,
      trip: c.trip,
      tripDate: c.trip_date,
      agency: c.agency || "",
      qrRef: c.qr_ref,
      fragile: c.fragile,
      senderName: c.sender_name || c.senderName || c.client_name || null,
      senderPhone: c.sender_phone || c.senderPhone || c.client_phone || null,
      recipientName: c.receiver_name || c.recipient_name || c.recipientName || c.client_name || null,
      recipientPhone: c.receiver_phone || c.recipient_phone || c.recipientPhone || c.client_phone || null,
      clientName: c.client_name || null,
      clientPhone: c.client_phone || null
    });

    // Hydrate ALL data from backend API with localStorage fallback
    const hydrateFromApi = async () => {
      const storedAgencyId = user ? (user.agencyId || 1) : 1;
      const headers = getAuthHeaders();

      // 1. Fetch ALL journeys (not filtered — we filter client-side)
      try {
        const journeysRes = await fetch(`${API_BASE}/journeys/all`, { headers, credentials: "include" });
        if (journeysRes.ok) {
          const rawJourneys = await journeysRes.json();
          const journeysArr = Array.isArray(rawJourneys) ? rawJourneys : (rawJourneys && Array.isArray(rawJourneys.value) ? rawJourneys.value : []);
          const mapped = journeysArr.map(mapDbJourney);
          setJourneysState(mapped);
        } else { throw new Error("journeys API failed"); }
      } catch (err) {
        console.warn("⚠️ API trajets non joignable.", err);
        setJourneysState([]);
      }

      // 2. Fetch buses
      try {
        const busesRes = await fetch(`${API_BASE}/buses`, { headers, credentials: "include" });
        if (busesRes.ok) {
          const rawBuses = await busesRes.json();
          const busesArr = Array.isArray(rawBuses) ? rawBuses : (rawBuses && Array.isArray(rawBuses.value) ? rawBuses.value : []);
          setBusesState(busesArr.map(mapDbBus));
        }
      } catch (err) {
        console.warn("⚠️ API bus non joignable.", err);
        setBusesState([]);
      }

      // 3. Fetch colis
      try {
        const colisRes = await fetch(`${API_BASE}/colis`, { headers, credentials: "include" });
        if (colisRes.ok) {
          const rawColis = await colisRes.json();
          const colisArr = Array.isArray(rawColis) ? rawColis : (rawColis && Array.isArray(rawColis.value) ? rawColis.value : []);
          setColisState(colisArr.map(mapDbColis));
        }
      } catch (err) {
        console.warn("⚠️ API colis non joignable.", err);
        setColisState([]);
      }

      // 4. Fetch all messages
      try {
        const msgRes = await fetch(`${API_BASE}/all-messages?agency_id=${storedAgencyId}`, { headers, credentials: "include" });
        if (msgRes.ok) {
          const rawThreads = await msgRes.json();
          const mapped: { [contactId: string]: ChatMessage[] } = {};
          Object.keys(rawThreads).forEach(threadId => {
            mapped[threadId] = rawThreads[threadId].map((m: any) => ({
              id: m.id,
              sender: m.sender as "agency" | "contact",
              text: m.text,
              time: m.time,
              isRead: m.is_read
            }));
          });
          setChatThreads(mapped);
        }
      } catch (err) {
        console.warn("⚠️ API messages non joignable.", err);
      }

      // 5. Fetch agency profile
      try {
        const profileRes = await fetch(`${API_BASE}/profile?agency_id=${storedAgencyId}`, { headers, credentials: "include" });
        if (profileRes.ok) {
          const p = await profileRes.json();
          if (p.email) setProfileEmail(p.email);
          if (p.phone) setProfilePhone(p.phone);
          if (p.address) setProfileAddress(p.address);
          if (p.description) setProfileDescription(p.description);
        }
      } catch (err) {
        console.warn("⚠️ API profil non joignable.", err);
      }

      setIsMounted(true);
    };

    hydrateFromApi();
  }, [user, userLoading]);

  // Notifications (Agence)
  const [agencyNotifications, setAgencyNotifications] = useState<any[]>([]);
  const [agencyUnread, setAgencyUnread] = useState(0);
  const [showAgencyNotifs, setShowAgencyNotifs] = useState(false);
  const agencyLastUnreadRef = useRef(0);

  const fetchAgencyNotifications = async () => {
    const API_BASE = ((typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) ? 'https://safe-trip-backend.vercel.app' : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://${window.location.hostname}:5000` : 'https://safe-trip-backend.vercel.app')));
    try {
      const res = await fetch(`${API_BASE}/notifications?agency_id=${currentAgencyId}`, { credentials: 'include' });
      if (res.ok) {
        const list = await res.json();
        setAgencyNotifications(list);
        const unread = (list || []).filter((n: any) => !n.read).length;
        setAgencyUnread(unread);
        if (unread > agencyLastUnreadRef.current) {
          try { const audio = new Audio(); /* silent fallback */ } catch {}
        }
        agencyLastUnreadRef.current = unread;
      }
    } catch {}
  };

  const markAgencyNotificationsRead = async () => {
    const API_BASE = ((typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) ? 'https://safe-trip-backend.vercel.app' : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://${window.location.hostname}:5000` : 'https://safe-trip-backend.vercel.app')));
    try {
      const unread = (agencyNotifications || []).filter((n: any) => !n.read);
      await Promise.all(unread.map((n: any) => fetch(`${API_BASE}/notifications/${n.id}/read?agency_id=${currentAgencyId}`, { method: 'PUT', credentials: 'include' })));
      setAgencyNotifications((prev) => prev.map((n: any) => ({ ...n, read: true })));
      setAgencyUnread(0);
      agencyLastUnreadRef.current = 0;
    } catch {}
  };

  const formatContactValue = (value?: string | null, fallback = "—") => {
    if (!value) return fallback;
    const trimmed = `${value}`.trim();
    return trimmed.length ? trimmed : fallback;
  };

  // Filter journeys list to only display operations of the selected agency
  const agencyJourneys = journeysState.filter(j => 
    j.operator.toLowerCase().includes(selectedAgencyName.split(" ")[0].toLowerCase())
  );

  const agencyJourneyGroups = agencyJourneys.reduce((groups, journey) => {
    const dep = journey.depStation.split(" - ")[0];
    const arr = journey.arrStation.split(" - ")[0];
    const key = `${dep} → ${arr}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(journey);
    return groups;
  }, {} as Record<string, Journey[]>);

  const agencyRouteEntries = Object.entries(agencyJourneyGroups).map(([route, journeys]) => ({
    route,
    journeys: [...journeys].sort((a, b) => a.depTime.localeCompare(b.depTime))
  }));

  // Filter colis list to only display operations of the selected agency
  const agencyColis = colisState.filter(c => 
    c.agencyId === currentAgencyId || c.agency.toLowerCase().includes(selectedAgencyName.split(" ")[0].toLowerCase())
  );

  // Filter out buses that are already assigned to another journey at the exact same departure time
  const assignedBusIdsAtTime = new Set(
    agencyJourneys.filter(j => j.depTime === depTime).map(j => j.busId).filter(Boolean)
  );

  const agencyAvailableBuses = busesState.filter(b =>
    b.agencyId === currentAgencyId &&
    b.status !== "En maintenance" &&
    !b.id.includes("-LOC-") &&
    !assignedBusIdsAtTime.has(b.id)
  );

  const selectedBusForJourney = busesState.find(b => b.id === selectedBusId) || null;

  // Fetch passenger lists from API for each journey
  useEffect(() => {
    if (journeysState.length === 0) return;

    const fetchAllPassengers = async () => {
      const newPassengersMap: { [journeyId: number]: Passenger[] } = {};
      const headers = getAuthHeaders();
      try {
        await Promise.all(journeysState.map(async (j) => {
          const res = await fetch(`${API_BASE}/passengers/${j.id}`, { headers, credentials: "include" });
          if (res.ok) {
            const rawPassengers = await res.json();
            newPassengersMap[j.id] = rawPassengers.map((p: any) => ({
              id: p.id,
              name: p.name,
              phone: p.phone,
              seat: p.seat,
              status: p.status,
              luggageCount: p.luggage_count,
              luggageScanned: p.luggage_scanned
            }));
          }
        }));
        setPassengersMap(newPassengersMap);
      } catch (err) {
        console.error("⚠️ Error fetching passengers from Supabase:", err);
      }
    };

    fetchAllPassengers();
  }, [journeysState]);

  // Effect to re-hydrate messages and profile when selected agency changes
  useEffect(() => {
    if (!selectedAgencyName || !isMounted) return;
    
    const refetchForAgency = async () => {
      const headers = getAuthHeaders();
      try {
        const msgRes = await fetch(`${API_BASE}/all-messages?agency_id=${currentAgencyId}`, { headers, credentials: "include" });
        if (msgRes.ok) {
          const rawThreads = await msgRes.json();
          const mapped: { [contactId: string]: ChatMessage[] } = {};
          Object.keys(rawThreads).forEach(threadId => {
            mapped[threadId] = rawThreads[threadId].map((m: any) => ({
              id: m.id,
              sender: m.sender as "agency" | "contact",
              text: m.text,
              time: m.time,
              isRead: m.is_read
            }));
          });
          setChatThreads(mapped);
        }
      } catch (err) {
        console.error("⚠️ Error refetching messages:", err);
      }

      try {
        const profileRes = await fetch(`${API_BASE}/profile?agency_id=${currentAgencyId}`, { headers, credentials: "include" });
        if (profileRes.ok) {
          const p = await profileRes.json();
          setProfileEmail(p.email || "");
          setProfilePhone(p.phone || "");
          setProfileAddress(p.address || "");
          setProfileDescription(p.description || "");
        }
      } catch (err) {
        console.error("⚠️ Error refetching profile:", err);
      }
    };

    refetchForAgency();
  }, [selectedAgencyName, isMounted, currentAgencyId]);

  // Real-time message polling for the agency dashboard (with new message notifications)
  useEffect(() => {
    if (!isMounted || !selectedAgencyName) return;

    const pollMessages = async () => {
      const headers = getAuthHeaders();
      try {
        const msgRes = await fetch(`${API_BASE}/all-messages?agency_id=${currentAgencyId}`, { headers, credentials: "include" });
        if (msgRes.ok) {
          const rawThreads = await msgRes.json();
          const mapped: { [contactId: string]: ChatMessage[] } = {};
          let unreadCount = 0;

          Object.keys(rawThreads).forEach(threadId => {
            const list = rawThreads[threadId] || [];
            
            // Count unread passenger messages
            const unreadPassengerMsgs = list.filter((m: any) => m.sender === "contact" && !m.is_read);
            unreadCount += unreadPassengerMsgs.length;

            mapped[threadId] = list.map((m: any) => ({
              id: m.id,
              sender: m.sender as "agency" | "contact",
              text: m.text,
              time: m.time,
              isRead: m.is_read
            }));
          });

          // Show/hide yellow notification dot
          if (unreadCount > 0) {
            setUnreadMessages(true);
          } else {
            setUnreadMessages(false);
          }

          // Show Toast notification if unread messages count increased
          if (prevUnreadCount.current !== null && unreadCount > prevUnreadCount.current) {
            showToast("🔔 Nouveau message reçu d'un voyageur !", true);
          } else if (prevUnreadCount.current === null && unreadCount > 0) {
            showToast("💬 Vous avez des messages voyageurs en attente de réponse !", true);
          }

          prevUnreadCount.current = unreadCount;
          setChatThreads(mapped);
        }
      } catch (err) {
        console.warn("⚠️ Echec de la mise à jour des messages.", err);
      }
    };

    pollMessages();
    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [isMounted, selectedAgencyName, currentAgencyId]);

  // Sync mark messages as read for the active contact thread
  useEffect(() => {
    if (!isMounted || !activeContactId) return;
    
    const markAsRead = async () => {
      try {
        const storedAgencyId = user ? (user.agencyId || 1) : 1;
        await fetch(`${API_BASE}/messages/${activeContactId}/read?agency_id=${storedAgencyId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ role: "agency" })
        });
      } catch (err) {
        console.warn("⚠️ Error marking messages as read:", err);
      }
    };
    
    markAsRead();
  }, [activeContactId, isMounted, chatThreads[activeContactId]?.length]);

  const showToast = (message: string, isSuccess = true) => {
    setToastMessage(message);
    setIsToastSuccess(isSuccess);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleLogout = () => {
    contextLogout();
  };

  const handleAgencySwitch = (name: string) => {
    setSelectedAgencyName(name);
    // localStorage removed
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

    if (!depCity || !arrCity || !ticketPrice || !selectedBusForJourney) {
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
      reclining: "Sièges inclinables",
      wifi: "Wi-Fi",
      ac: "Climatisation",
      plug: "Prises électriques",
      toilet: "Toilettes",
      catering: "Service de restauration disponible",
      pmr: "Personne à mobilité réduite"
    };
    
    const labelAmenities = selectedAmenities.map(k => labelMapping[k] || k);
    if (selectedBusForJourney.busClass === "VIP" || selectedBusForJourney.busClass === "Executive Class") {
      labelAmenities.push("Sièges VIP");
    }

    // POST new journey to backend API
    const createJourneyApi = async () => {
      try {
        const res = await fetch(`${API_BASE}/journeys`, {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            bus_id: selectedBusForJourney.id,
            operator: `${activeAgencyObj.name} ${selectedBusForJourney.busClass}`,
            logo: activeAgencyObj.logo,
            dep_time: depTime,
            arr_time: arrTimeStr,
            duration: "4h15",
            dep_station: finalDepStation,
            arr_station: finalArrStation,
            price: priceNum,
            amenities: labelAmenities,
            amenity_keys: selectedAmenities,
            agency_name: activeAgencyObj.name
          })
        });
        if (res.ok) {
          const created = await res.json();
          const newJourney: Journey = {
            id: created.id,
            type: "bus",
            operator: created.operator,
            logo: created.logo,
            depTime: created.dep_time,
            arrTime: created.arr_time,
            duration: created.duration,
            depStation: created.dep_station,
            arrStation: created.arr_station,
            price: created.price,
            amenities: created.amenities || [],
            amenityKeys: created.amenity_keys || []
          };
          setJourneysState(prev => [...prev, newJourney]);
          setSelectedJourneyId(newJourney.id);
          showToast(`Super ! Le trajet ${depCity} → ${arrCity} (${depTime}) est planifié et publié sur SafeTrip.`);
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erreur serveur ${res.status}`);
        }
      } catch (err: any) {
        console.error("❌ Erreur de création de trajet dans la BD:", err);
        // Fallback to localStorage
        const newJourney: Journey = {
          id: Date.now(),
          type: "bus",
          operator: `${activeAgencyObj.name} ${selectedBusForJourney ? selectedBusForJourney.busClass : ""}`,
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
        sessionStorage.setItem("safetrip_journeys", JSON.stringify(updatedJourneys));
        setJourneysState(updatedJourneys);
        showToast(`Trajet planifié en local (hors-ligne). Erreur BD : ${err?.message || "Inconnue"}`, false);
      }

      setDepCity("");
      setArrCity("");
      setTicketPrice("");
      setDepTime("08:00");
      setSelectedBusId("");
      setSelectedAmenities([]);
    };

    createJourneyApi();
  };

  const handleDeleteJourney = async (journeyId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet horaire ? Tous les passagers associés seront également supprimés.")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/journeys/${journeyId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include"
      });

      if (res.ok) {
        setJourneysState(prev => prev.filter(j => j.id !== journeyId));
        if (selectedJourneyId === journeyId) {
          setSelectedJourneyId(null);
        }
        showToast("Horaire supprimé avec succès ! ✅");
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Impossible de supprimer le trajet.");
      }
    } catch (err: any) {
      console.error("❌ Erreur lors de la suppression du trajet:", err);
      // Local fallback
      setJourneysState(prev => prev.filter(j => j.id !== journeyId));
      if (selectedJourneyId === journeyId) {
        setSelectedJourneyId(null);
      }
      showToast(`Horaire retiré. Erreur BD : ${err?.message || "Inconnue"}`, false);
    }
  };

  const openAddBusModal = () => {
    setEditingBus(null);
    setBusFormPlaque("");
    setBusFormClass("Classique");
    setBusFormCapacity(50);
    setBusFormStatus("Disponible");
    setBusFormAmenities([]);
    setIsBusModalOpen(true);
  };

  const openEditBusModal = (bus: Bus) => {
    setEditingBus(bus);
    setBusFormPlaque(bus.plaque);
    setBusFormClass(bus.busClass);
    setBusFormCapacity(bus.capacity);
    setBusFormStatus(bus.status);
    setBusFormAmenities(bus.amenities);
    setIsBusModalOpen(true);
  };

  const toggleFormBusAmenity = (key: string) => {
    if (busFormAmenities.includes(key)) {
      setBusFormAmenities(prev => prev.filter(k => k !== key));
    } else {
      setBusFormAmenities(prev => [...prev, key]);
    }
  };

  const handleBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busFormPlaque.trim()) {
      showToast("La plaque d'immatriculation est requise.", false);
      return;
    }

    const payload = {
      id: editingBus ? editingBus.id : `BUS-${Date.now()}`,
      plaque: busFormPlaque.trim(),
      bus_class: busFormClass,
      capacity: busFormCapacity,
      status: busFormStatus,
      amenities: busFormAmenities,
      agency_name: selectedAgencyName
    };

    try {
      const headers = getAuthHeaders();
      if (editingBus) {
        // UPDATE
        const res = await fetch(`${API_BASE}/buses/${editingBus.id}`, {
          method: "PUT",
          headers,
          credentials: "include",
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          const mapped: Bus = {
            id: updated.id,
            agencyId: updated.agency_id || currentAgencyId,
            plaque: updated.plaque,
            busClass: updated.bus_class,
            capacity: updated.capacity,
            occupied: updated.occupied || 0,
            status: updated.status,
            amenities: updated.amenities || []
          };
          setBusesState(prev => prev.map(b => b.id === editingBus.id ? mapped : b));
          showToast("🚌 Le bus a été mis à jour avec succès !");
          setIsBusModalOpen(false);
        } else {
          throw new Error("Erreur de mise à jour");
        }
      } else {
        // CREATE
        const res = await fetch(`${API_BASE}/buses`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          const mapped: Bus = {
            id: created.id,
            agencyId: created.agency_id || currentAgencyId,
            plaque: created.plaque,
            busClass: created.bus_class,
            capacity: created.capacity,
            occupied: created.occupied || 0,
            status: created.status,
            amenities: created.amenities || []
          };
          setBusesState(prev => [...prev, mapped]);
          showToast("🚌 Nouveau bus ajouté à votre flotte !");
          setIsBusModalOpen(false);
        } else {
          throw new Error("Erreur d'ajout");
        }
      }
    } catch (err: any) {
      showToast(`Une erreur est survenue: ${err.message}`, false);
    }
  };

  const handleDeleteBus = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce bus de votre flotte ? Cette action est irréversible.")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/buses/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (res.ok) {
        setBusesState(prev => prev.filter(b => b.id !== id));
        showToast("🗑️ Bus supprimé avec succès.");
      } else {
        throw new Error("Erreur de suppression");
      }
    } catch (err: any) {
      showToast(`Impossible de supprimer le bus: ${err.message}`, false);
    }
  };

  const togglePassengerCheckIn = async (passengerId: number) => {
    if (selectedJourneyId === null) return;
    
    // Optimistic UI update
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

    // Persist to backend
    try {
      await fetch(`${API_BASE}/passengers/${selectedJourneyId}/checkin/${passengerId}`, { method: "PUT", headers: getAuthHeaders(),
        credentials: "include" });
    } catch { /* silent fallback */ }
    
    showToast("Statut d'enregistrement du passager mis à jour.");
  };

  const handleOpenScanner = (passenger: Passenger) => {
    setScanningPassenger(passenger);
    setActiveScanJourneyId(selectedJourneyId);
  };

  const handleSimulateScanSuccess = async () => {
    if (scanningPassenger === null || activeScanJourneyId === null) return;

    // 1. Update passenger scan status (optimistic)
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

    // Persist scan to backend
    try {
      await fetch(`${API_BASE}/passengers/${activeScanJourneyId}/scan/${scanningPassenger.id}`, { method: "PUT", headers: getAuthHeaders(),
        credentials: "include" });
    } catch { /* silent fallback */ }

    // 2. Generate or update colis
    const newColis: Colis = {
      id: `BAG-2026-FX${activeScanJourneyId.toString().slice(-2)}-${scanningPassenger.id}`,
      agencyId: currentAgencyId,
      label: `Bagage de ${scanningPassenger.name}`,
      type: "Valise",
      weight: 12 + scanningPassenger.id * 2,
      color: scanningPassenger.id % 2 === 0 ? "Noir" : "Rouge",
      status: "Scanné en gare",
      trip: "Douala → Yaoundé",
      tripDate: "25 Mai 2026 · 06:15",
      agency: selectedAgencyName,
      qrRef: `QR-FX${activeScanJourneyId.toString().slice(-2)}-${scanningPassenger.id}`,
      fragile: scanningPassenger.id % 3 === 0,
      senderName: scanningPassenger.name,
      senderPhone: scanningPassenger.phone,
      recipientName: scanningPassenger.name,
      recipientPhone: scanningPassenger.phone
    };

    setColisState(prev => {
      const filtered = prev.filter(c => c.id !== newColis.id);
      return [newColis, ...filtered];
    });

    showToast(`QR Code validé ! Passager ${scanningPassenger.name} enregistré et bagages scannés.`);
    setScanningPassenger(null);
  };

  // Send a custom chat message and trigger instant simulated reply
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    const timeStr = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const newMsg: ChatMessage = {
      id: Date.now(),
      sender: "agency",
      text: chatInputText,
      time: timeStr
    };

    setChatThreads(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), newMsg]
    }));
    setChatInputText("");

    // Persist to backend
    try {
      await fetch(`${API_BASE}/messages/${activeContactId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ sender: "agency", text: chatInputText, time: timeStr, agency_id: currentAgencyId })
      });
    } catch { /* silent fallback */ }
  };

  // Save profile administrative changes
  const handleSaveAgencyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const customProfile = {
      agency_id: currentAgencyId,
      email: profileEmail,
      phone: profilePhone,
      address: profileAddress,
      description: profileDescription
    };

    try {
      await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customProfile),
        credentials: "include"
      });
    } catch (err) {
      console.error("⚠️ Error saving profile to Supabase:", err);
      showToast("Erreur lors de la sauvegarde du profil. Veuillez réessayer.", false);
      return;
    }

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
    const passCount = passengersMap[j.id]?.length || 0;
    return sum + (j.price * passCount);
  }, 0);

  const totalReservations = agencyJourneys.reduce((sum, j) => {
    return sum + (passengersMap[j.id]?.length || 0);
  }, 0);
  
  const totalLuggage = agencyJourneys.reduce((sum, j) => {
    const list = passengersMap[j.id] || [];
    return sum + list.reduce((lSum, p) => lSum + p.luggageCount, 0);
  }, 0);

  const scannedLuggage = agencyJourneys.reduce((sum, j) => {
    const list = passengersMap[j.id] || [];
    return sum + list.filter(p => p.luggageScanned).reduce((lSum, p) => lSum + p.luggageCount, 0);
  }, 0);

  // Compute average occupancy rate from active buses
  const agencyBuses = busesState.filter(b => b.agencyId === currentAgencyId);
  const activeBuses = agencyBuses.filter(b => b.status !== "En maintenance");
  const avgOccupancy = activeBuses.length > 0
    ? (activeBuses.reduce((sum, b) => sum + (b.occupied / b.capacity), 0) / activeBuses.length) * 100
    : 84.5; // fallback to default

  const getJourneyDepartureState = (journey: Journey) => {
    const now = new Date();
    const [h, m] = journey.depTime.split(":").map(Number);
    const depDate = new Date();
    depDate.setHours(h || 0, m || 0, 0, 0);
    return depDate.getTime() <= now.getTime() ? "departed" : "upcoming";
  };

  // Get all unique trips (trajets) registered in the DB
  const dbTrips = Array.from(new Set(
    journeysState.map(j => {
      const dep = j.depStation.split(" - ")[0].trim();
      const arr = j.arrStation.split(" - ")[0].trim();
      return `${dep} → ${arr}`;
    })
  )).sort();

  // Get all unique bus classes from the DB buses
  const uniqueBusClasses = Array.from(new Set(
    busesState.map(b => b.busClass).filter(Boolean)
  )).sort();

  const filteredDepartureJourneys = [...agencyJourneys]
    .filter(j => {
      const depCityName = j.depStation.split(" - ")[0].trim().toLowerCase();
      const arrCityName = j.arrStation.split(" - ")[0].trim().toLowerCase();
      const searchClean = departureRouteSearch.replace("→", " ").replace("-", " ").toLowerCase();
      
      const routeMatches = !departureRouteSearch.trim() || 
        searchClean.split(/\s+/).filter(Boolean).every(word => 
          depCityName.includes(word) || arrCityName.includes(word)
        );
      const dayMatches = departureDayFilter === "all" || getJourneyDepartureState(j) === departureDayFilter;
      const timeMatches = !departureTimeFilter || j.depTime.startsWith(departureTimeFilter);
      const classText = (j.busClass || j.operator).toLowerCase();
      const classMatches = !departureClassFilter || classText.includes(departureClassFilter.toLowerCase());
      return routeMatches && dayMatches && timeMatches && classMatches;
    })
    .sort((a, b) => a.depTime.localeCompare(b.depTime));

  // Dynamically build chatContacts from actual database chatThreads keys
  const chatContacts = Object.keys(chatThreads).map(threadId => {
    let name = "Client SafeTrip";
    let short = "CL";
    if (threadId === "support") {
      name = "Support SafeTrip";
      short = "ST";
    } else if (threadId === "marc" || threadId.toLowerCase().includes("marc")) {
      name = "Marc Nzenang";
      short = "MN";
    } else if (threadId === "syntyche" || threadId.toLowerCase().includes("syntyche")) {
      name = "Syntyche Toukam";
      short = "ST";
    } else if (threadId === "jean-client") {
      name = "Jean Client";
      short = "JC";
    } else {
      name = threadId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      short = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    }

    const threadMsgs = chatThreads[threadId] || [];
    const lastMsgObj = threadMsgs[threadMsgs.length - 1];
    
    return {
      id: threadId,
      name,
      short,
      online: threadId === "support" || threadId.includes("syntyche"),
      lastMsg: lastMsgObj ? lastMsgObj.text : "Aucun message",
      time: lastMsgObj ? lastMsgObj.time : "12:00"
    };
  });

  // Construct recent activities dynamically from DB
  const recentActivities: any[] = [];

  // 1. Latest planned journeys
  const sortedJourneysForActivities = [...agencyJourneys].sort((a, b) => b.id - a.id);
  sortedJourneysForActivities.slice(0, 2).forEach(j => {
    recentActivities.push({
      id: `journey-${j.id}`,
      title: `Trajet ${j.depStation.split(" - ")[0]} → ${j.arrStation.split(" - ")[0]} planifié`,
      meta: `Départ : ${j.depTime} · ${j.price.toLocaleString()} FCFA · ${passengersMap[j.id]?.length || 0} voyageurs`,
      icon: "✓",
      bg: "rgba(0,103,60,0.1)",
      color: "#00673C"
    });
  });

  // 2. Latest scanned colis/baggages
  const sortedColisForActivities = [...agencyColis].sort((a, b) => b.id.localeCompare(a.id));
  sortedColisForActivities.slice(0, 2).forEach(c => {
    recentActivities.push({
      id: `colis-${c.id}`,
      title: `Bagage ${c.id} (${c.label}) enregistré`,
      meta: `Statut : ${c.status} · Poids : ${c.weight} kg`,
      icon: "▣",
      bg: "rgba(251,166,0,0.1)",
      color: "#b7791f"
    });
  });

  // 3. Latest messages in threads
  Object.keys(chatThreads).slice(0, 2).forEach(threadId => {
    const threadMsgs = chatThreads[threadId] || [];
    if (threadMsgs.length > 0) {
      const lastMsg = threadMsgs[threadMsgs.length - 1];
      let senderName = "Support SafeTrip";
      if (threadId === "jean-client") senderName = "Jean Client";
      else if (threadId === "marc") senderName = "Marc Nzenang";
      else if (threadId === "syntyche") senderName = "Syntyche Toukam";
      else if (threadId !== "support") senderName = threadId.replace("-", " ");
      
      recentActivities.push({
        id: `msg-${threadId}`,
        title: `Message dans discussion : ${senderName}`,
        meta: lastMsg.text.length > 60 ? `${lastMsg.text.slice(0, 60)}...` : lastMsg.text,
        icon: "✉",
        bg: "rgba(49,130,206,0.1)",
        color: "#2b6cb0"
      });
    }
  });

  // If empty list, put a nice dynamic placeholder
  if (recentActivities.length === 0) {
    recentActivities.push({
      id: "empty",
      title: "Aucune activité récente",
      meta: "Planifiez un trajet ou scannez des bagages pour voir l'historique en temps réel.",
      icon: "ℹ",
      bg: "rgba(113,128,150,0.1)",
      color: "#4a5568"
    });
  }

  if (userLoading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#071A0E', color: '#fcd116', fontSize: '1.2rem', fontWeight: 'bold' }}>
        Chargement du Tableau de Bord Agence... 🚌
      </div>
    );
  }

  return (
    <div className={styles.clientDashboardLayout}>
      {toastMessage && (
        <div className={`${styles.toast} ${isToastSuccess ? styles.toastSuccess : ""}`}>
          <span>{toastMessage}</span>
          <button className={styles.toastClose} onClick={() => setToastMessage(null)}>×</button>
        </div>
      )}

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
            className={`${styles.sidebarNavItem} ${agencyActiveTab === "luggage" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => setAgencyActiveTab("luggage")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            Bagages Voyageurs
          </button>

          <button
            type="button"
            className={`${styles.sidebarNavItem} ${agencyActiveTab === "courier" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => setAgencyActiveTab("courier")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Courriers &amp; Colis
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
            className={`${styles.sidebarNavItem} ${agencyActiveTab === "departs" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => setAgencyActiveTab("departs")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <path d="M3 17h18" />
              <path d="M6 17V7h12v10" />
              <circle cx="8" cy="19" r="1.5" />
              <circle cx="16" cy="19" r="1.5" />
            </svg>
            Départs &amp; Passagers
          </button>

          <button
            type="button"
            className={`${styles.sidebarNavItem} ${agencyActiveTab === "messagerie" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => {
              setAgencyActiveTab("messagerie");
              setUnreadMessages(false);
            }}
            style={{ position: "relative" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Messagerie
            {unreadMessages && (
              <span style={{
                position: "absolute",
                top: "10px",
                left: "32px",
                width: "9px",
                height: "9px",
                background: "#fccd05",
                borderRadius: "50%",
                boxShadow: "0 0 0 2px #0A2F1D",
                animation: "pulse 1.5s infinite"
              }}></span>
            )}
            <style>{`
              @keyframes pulse {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(252, 205, 5, 0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(252, 205, 5, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(252, 205, 5, 0); }
              }
            `}</style>
          </button>

          <button
            type="button"
            className={`${styles.sidebarNavItem} ${agencyActiveTab === "scanner" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => setAgencyActiveTab("scanner")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <rect x="3" y="3" width="5" height="5" rx="1"/>
              <rect x="16" y="3" width="5" height="5" rx="1"/>
              <rect x="3" y="16" width="5" height="5" rx="1"/>
              <path d="M21 16h-3v3"/>
              <path d="M21 21h-5"/>
              <path d="M12 3v5"/>
              <path d="M12 12v3"/>
              <path d="M3 12h5"/>
              <path d="M12 12h5"/>
            </svg>
            Scanner QR
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

          <div className={styles.bannerControls} style={{ display: "flex", alignItems: "center", gap: "10px", position: 'relative' }}>
            <button
              type="button"
              onClick={async () => { await fetchAgencyNotifications(); setShowAgencyNotifs(s => !s); if (!showAgencyNotifs) await markAgencyNotificationsRead(); }}
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 9999, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.15)', color: '#fff' }}
              title="Notifications agence"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 18, height: 18 }}>
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 5-3 7h18c0-2-3 0-3-7" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {agencyUnread > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', borderRadius: 9999, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>
                  {agencyUnread}
                </span>
              )}
            </button>
            {showAgencyNotifs && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 360, maxWidth: '92vw', background: '#fff', color: '#0f172a', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 14px 40px rgba(0,0,0,0.18)', overflow: 'hidden', zIndex: 50 }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Notifications Agence</span>
                  <button onClick={() => setShowAgencyNotifs(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {(agencyNotifications || []).slice(0, 25).map((n: any) => (
                    <div key={n.id} style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', background: n.read ? '#fff' : '#f8fafc' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{n.title || n.type}</div>
                      {n.body && <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>{n.body}</div>}
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{new Date(n.created_at).toLocaleString('fr-FR')}</div>
                    </div>
                  ))}
                  {(!agencyNotifications || agencyNotifications.length === 0) && (
                    <div style={{ padding: '16px 12px', color: '#64748b', fontSize: 12 }}>Aucune notification.</div>
                  )}
                </div>
              </div>
            )}
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.5px" }}>CONNECTÉ EN TANT QUE :</span>
            <span style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff", padding: "6px 14px", borderRadius: "8px", fontWeight: "700", fontSize: "0.82rem", fontFamily: "monospace" }}>
              {email}
            </span>
          </div>
        </div>

        {agencyActiveTab === "departs" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.25fr 1fr 1fr 1fr 1.05fr",
            alignItems: "stretch",
            background: "#ffffff",
            border: "2px solid #00673C",
            borderRadius: "999px",
            overflow: "visible",
            margin: "-16px 0 24px 0",
            boxShadow: "0 18px 45px rgba(0, 103, 60, 0.10)",
            position: "relative"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "10px", 
              padding: "13px 22px", 
              borderRight: "1px solid #e2e8f0",
              borderTopLeftRadius: "999px",
              borderBottomLeftRadius: "999px",
              position: "relative"
            }}>
              <span style={{ width: "11px", height: "11px", border: "3px solid #00673C", borderRadius: "50%", flexShrink: 0 }}></span>
              <input 
                type="text" 
                value={departureRouteSearch} 
                onChange={(e) => {
                  setDepartureRouteSearch(e.target.value);
                  setRouteDropdownOpen(true);
                }} 
                onFocus={() => setRouteDropdownOpen(true)}
                onBlur={() => setTimeout(() => setRouteDropdownOpen(false), 200)}
                placeholder="Trajet" 
                style={{ border: "none", outline: "none", width: "100%", fontWeight: 800, color: "#071A0E", background: "transparent", fontFamily: "inherit" }} 
              />
              {routeDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: "15px",
                  right: "15px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #edf2f7",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                  zIndex: 1000,
                  maxHeight: "220px",
                  overflowY: "auto",
                  marginTop: "8px",
                  padding: "6px"
                }}>
                  {dbTrips.filter(t => t.toLowerCase().includes(departureRouteSearch.toLowerCase())).length === 0 ? (
                    <div style={{ padding: "10px 14px", fontSize: "0.8rem", color: "#a0aec0", fontStyle: "italic" }}>
                      Aucun trajet trouvé
                    </div>
                  ) : (
                    dbTrips
                      .filter(t => t.toLowerCase().includes(departureRouteSearch.toLowerCase()))
                      .map(trip => (
                        <div
                          key={trip}
                          onMouseDown={() => {
                            setDepartureRouteSearch(trip);
                            setRouteDropdownOpen(false);
                          }}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "#071A0E",
                            transition: "all 0.2s ease",
                            background: departureRouteSearch.toLowerCase() === trip.toLowerCase() ? "rgba(0,103,60,0.08)" : "transparent"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(0, 103, 60, 0.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = departureRouteSearch.toLowerCase() === trip.toLowerCase() ? "rgba(0,103,60,0.08)" : "transparent";
                          }}
                        >
                          {trip}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "13px 22px", borderRight: "1px solid #e2e8f0" }}>
              <span style={{ width: "11px", height: "11px", border: "3px solid #00673C", borderRadius: "50%", flexShrink: 0 }}></span>
              <select value={departureDayFilter} onChange={(e) => setDepartureDayFilter(e.target.value)} style={{ border: "none", outline: "none", width: "100%", fontWeight: 800, color: "#071A0E", background: "transparent", fontFamily: "inherit" }}>
                <option value="all">Tous les départs</option>
                <option value="departed">Bus déjà partis</option>
                <option value="upcoming">Bus à venir</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "13px 22px", borderRight: "1px solid #e2e8f0" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="2.5" style={{ width: "18px", height: "18px", flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <input type="time" value={departureTimeFilter} onChange={(e) => setDepartureTimeFilter(e.target.value)} style={{ border: "none", outline: "none", width: "100%", fontWeight: 800, color: "#071A0E", background: "transparent", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "13px 22px", borderRight: "1px solid #e2e8f0" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="2.5" style={{ width: "18px", height: "18px", flexShrink: 0 }}><path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2M5 8H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><rect x="5" y="4" width="14" height="15" rx="2" /></svg>
              <select value={departureClassFilter} onChange={(e) => setDepartureClassFilter(e.target.value)} style={{ border: "none", outline: "none", width: "100%", fontWeight: 800, color: "#071A0E", background: "transparent", fontFamily: "inherit" }}>
                <option value="">Classe du bus</option>
                {uniqueBusClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <button type="button" style={{ border: "none", background: "#c99a05", color: "#071A0E", fontWeight: 900, fontFamily: "inherit", fontSize: "0.9rem", cursor: "pointer", borderTopRightRadius: "999px", borderBottomRightRadius: "999px" }}>
              Rechercher
            </button>
          </div>
        )}

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
                  <span className={styles.statTrend} style={{ color: "#2f855a" }}>● {totalReservations} billet{totalReservations !== 1 ? "s" : ""} payé{totalReservations !== 1 ? "s" : ""}</span>
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
                  <span className={styles.statTrend} style={{ color: "#744210" }}>● {agencyJourneys.filter(j => j.isNight).length} horaire{agencyJourneys.filter(j => j.isNight).length !== 1 ? "s" : ""} nocturne{agencyJourneys.filter(j => j.isNight).length !== 1 ? "s" : ""}</span>
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
                  <span className={styles.statValue}>{avgOccupancy.toFixed(1)}%</span>
                  <span className={styles.statTrend} style={{ color: "#3182ce" }}>● {activeBuses.length} bus opérationnel{activeBuses.length !== 1 ? "s" : ""}</span>
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
                  {recentActivities.map(activity => (
                    <div key={activity.id} style={{ display: "flex", gap: "12px", borderBottom: "1px solid #f7fafc", paddingBottom: "12px" }}>
                      <div style={{ background: activity.bg, color: activity.color, width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "normal", fontSize: "0.8rem", fontWeight: "800", flexShrink: 0 }}>
                        {activity.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a202c" }}>{activity.title}</div>
                        <div style={{ fontSize: "0.7rem", color: "#a0aec0" }}>{activity.meta}</div>
                      </div>
                    </div>
                  ))}
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
                <p style={{ fontSize: "0.8rem", color: "#718096" }}>{busesState.filter(bus => bus.agencyId === currentAgencyId).length} bus actifs répertoriés</p>
              </div>
              <button 
                onClick={openAddBusModal}
                style={{
                  background: "#00673C",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.85rem",
                  fontFamily: "inherit"
                }}
              >
                ➕ Ajouter un Bus
              </button>
            </div>

            {/* Smart Search Bar */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: "500px" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }}>
                  🔍
                </span>
                <input 
                  type="text"
                  placeholder="Rechercher plaque, classe (VIP...), statut, équipement (wifi, clim...)"
                  value={busSearchQuery}
                  onChange={(e) => setBusSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px 12px 42px",
                    borderRadius: "12px",
                    border: "1px solid #edf2f7",
                    outline: "none",
                    fontSize: "0.85rem",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                    background: "white",
                    color: "#2d3748"
                  }}
                />
                {busSearchQuery && (
                  <button 
                    onClick={() => setBusSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      color: "#a0aec0"
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className={styles.busGrid}>
              {busesState
                .filter(bus => bus.agencyId === currentAgencyId)
                .filter(bus => {
                  if (!busSearchQuery) return true;
                  const query = busSearchQuery.toLowerCase();
                  
                  // Match plaque
                  const matchesPlaque = bus.plaque.toLowerCase().includes(query);
                  
                  // Match class
                  const matchesClass = bus.busClass.toLowerCase().includes(query);
                  
                  // Match status
                  const matchesStatus = bus.status.toLowerCase().includes(query);
                  
                  // Match amenities (friendly labels)
                  const matchesAmenities = bus.amenities.some(am => {
                    const amLabel = am === "wifi" ? "wi-fi" : am === "ac" ? "climatisation" : am === "toilet" ? "toilettes" : am === "catering" ? "restauration" : "prises";
                    return am.toLowerCase().includes(query) || amLabel.includes(query);
                  });

                  return matchesPlaque || matchesClass || matchesStatus || matchesAmenities;
                })
                .map(bus => (
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
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <button 
                        onClick={() => openEditBusModal(bus)} 
                        title="Modifier" 
                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1rem", padding: "2px" }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteBus(bus.id)} 
                        title="Supprimer" 
                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1rem", padding: "2px" }}
                      >
                        🗑️
                      </button>
                      <span className={`${styles.busClassBadge} ${
                        bus.busClass === "VIP" ? styles.busClassVIP :
                        bus.busClass === "Confort" ? styles.busClassConfort :
                        bus.busClass === "Executive Class" ? styles.busClassExecutive :
                        styles.busClassClassique
                      }`}>
                        {bus.busClass}
                      </span>
                    </div>
                  </div>

                  <div className={styles.busCardBody}>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "5px 0 0 0" }}>
                      Bus {selectedAgencyName}
                    </h3>
                    
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
                        setSelectedBusId(bus.id);
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

            {/* Bus CRUD Modal */}
            {isBusModalOpen && (
              <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                backdropFilter: "blur(4px)"
              }}>
                <div style={{
                  background: "white",
                  borderRadius: "16px",
                  width: "100%",
                  maxWidth: "480px",
                  padding: "24px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  color: "#2d3748"
                }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0A2F1D", marginBottom: "16px" }}>
                    {editingBus ? "Modifier le Bus" : "Ajouter un Nouveau Bus"}
                  </h3>
                  <form onSubmit={handleBusSubmit}>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#4a5568", marginBottom: "4px" }}>
                        Plaque d&apos;immatriculation *
                      </label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: LT-2100-B" 
                        value={busFormPlaque}
                        onChange={(e) => setBusFormPlaque(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          outline: "none",
                          fontSize: "0.9rem"
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#4a5568", marginBottom: "4px" }}>
                          Classe
                        </label>
                        <select 
                          value={busFormClass}
                          onChange={(e) => setBusFormClass(e.target.value as any)}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            outline: "none",
                            fontSize: "0.9rem"
                          }}
                        >
                          <option value="Classique">Classique</option>
                          <option value="Confort">Confort</option>
                          <option value="VIP">VIP</option>
                          <option value="Executive Class">Executive Class</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#4a5568", marginBottom: "4px" }}>
                          Capacité (places)
                        </label>
                        <input 
                          type="number" 
                          required 
                          min={1}
                          value={busFormCapacity}
                          onChange={(e) => setBusFormCapacity(parseInt(e.target.value) || 50)}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            outline: "none",
                            fontSize: "0.9rem"
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#4a5568", marginBottom: "4px" }}>
                        Statut opérationnel
                      </label>
                      <select 
                        value={busFormStatus}
                        onChange={(e) => setBusFormStatus(e.target.value as any)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          outline: "none",
                          fontSize: "0.9rem"
                        }}
                      >
                        <option value="Disponible">Disponible</option>
                        <option value="En route">En route</option>
                        <option value="En maintenance">En maintenance</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#4a5568", marginBottom: "6px" }}>
                        Équipements à bord (Amenities)
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {[
                          { key: "wifi", label: "📶 Wi-Fi" },
                          { key: "ac", label: "❄️ Climatisation" },
                          { key: "toilet", label: "🚽 Toilettes" },
                          { key: "catering", label: "🍔 Restauration" },
                          { key: "plug", label: "🔌 Prises" }
                        ].map(am => {
                          const isSelected = busFormAmenities.includes(am.key);
                          return (
                            <button
                              type="button"
                              key={am.key}
                              onClick={() => toggleFormBusAmenity(am.key)}
                              style={{
                                border: isSelected ? "1px solid #00673C" : "1px solid #e2e8f0",
                                background: isSelected ? "#eef8f3" : "transparent",
                                color: isSelected ? "#00673C" : "#718096",
                                padding: "6px 12px",
                                borderRadius: "20px",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: "bold"
                              }}
                            >
                              {am.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setIsBusModalOpen(false)}
                        style={{
                          border: "none",
                          background: "#e2e8f0",
                          color: "#4a5568",
                          padding: "10px 18px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "0.85rem"
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        style={{
                          border: "none",
                          background: "#00673C",
                          color: "white",
                          padding: "10px 18px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "0.85rem"
                        }}
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LUGGAGE MANAGEMENT */}
        {agencyActiveTab === "luggage" && (() => {
          const luggageList = agencyColis.filter(c => c.type === "Valise" || c.type === "Sac" || c.type === "Sac à dos");
          const filteredLuggage = luggageList.filter(c => 
            c.label.toLowerCase().includes(luggageSearchText.toLowerCase()) || 
            c.id.toLowerCase().includes(luggageSearchText.toLowerCase()) ||
            (c.trip && c.trip.toLowerCase().includes(luggageSearchText.toLowerCase()))
          );
          
          return (
            <div className={styles.tabContentFadeIn}>
              <div className={styles.panelCard}>
                <div className={styles.panelHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 className={styles.panelTitle}>Enregistrement et Suivi des Bagages Voyageurs</h2>
                </div>

                <div className={styles.panelBody} style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#0A2F1D", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    🎒 Bagages Voyageurs en cours
                    <span style={{ fontSize: "0.75rem", background: "rgba(0,103,60,0.1)", color: "#00673C", padding: "2px 8px", borderRadius: "20px", fontWeight: "800" }}>
                      {filteredLuggage.length} bagage{filteredLuggage.length > 1 ? "s" : ""}
                    </span>
                  </h3>

                  {/* Smart Search Bar */}
                  <div style={{ marginBottom: "15px" }}>
                    <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
                      <input 
                        type="text"
                        placeholder="Rechercher par nom de voyageur ou référence..."
                        value={luggageSearchText}
                        onChange={(e) => setLuggageSearchText(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 16px 10px 38px",
                          borderRadius: "10px",
                          border: "1px solid #edf2f7",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          outline: "none",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                          transition: "all 0.2s ease"
                        }}
                      />
                      <svg viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2.5" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px" }}>
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                  </div>
                  
                  {filteredLuggage.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "rgba(0,0,0,0.4)", fontSize: "0.85rem", background: "rgba(0,0,0,0.01)", borderRadius: "12px", border: "1px dashed rgba(0,0,0,0.08)" }}>
                      {luggageSearchText ? "Aucun bagage ne correspond à votre recherche." : "Aucun bagage de voyageur enregistré pour le moment."}
                    </div>
                  ) : (
                    <div className={styles.rosterTableContainer} style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #edf2f7", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                      <table className={styles.rosterTable}>
                        <thead>
                          <tr>
                            <th>Référence Colis</th>
                            <th>Description Bagage</th>
                            <th>Poids &amp; Type</th>
                            <th>Trajet &amp; Compagnie</th>
                            <th style={{ textAlign: "center" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLuggage.map(colis => (
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
                              <td style={{ textAlign: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedColis(colis)}
                                  style={{
                                    padding: "6px 14px",
                                    fontSize: "0.75rem",
                                    fontWeight: "800",
                                    background: "rgba(0,103,60,0.08)",
                                    color: "#00673C",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#00673C";
                                    e.currentTarget.style.color = "#ffffff";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(0,103,60,0.08)";
                                    e.currentTarget.style.color = "#00673C";
                                  }}
                                >
                                  Voir le ticket
                                </button>
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
          );
        })()}

        {/* TAB 3.5: COURIER MANAGEMENT */}
        {agencyActiveTab === "courier" && (() => {
          const courierList = agencyColis.filter(c => c.type === "Carton" || c.type === "Colis");
          const filteredCourier = courierList.filter(c => 
            c.label.toLowerCase().includes(courierSearchText.toLowerCase()) || 
            c.id.toLowerCase().includes(courierSearchText.toLowerCase()) ||
            (c.trip && c.trip.toLowerCase().includes(courierSearchText.toLowerCase()))
          );

          return (
            <div className={styles.tabContentFadeIn}>
              <div className={styles.panelCard}>
                <div className={styles.panelHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 className={styles.panelTitle}>Enregistrement et Expédition des Colis &amp; Courriers</h2>
                </div>

                <div className={styles.panelBody} style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#0A2F1D", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    📦 Colis &amp; Expéditions (Courriers) enregistrés
                    <span style={{ fontSize: "0.75rem", background: "rgba(0,103,60,0.1)", color: "#00673C", padding: "2px 8px", borderRadius: "20px", fontWeight: "800" }}>
                      {filteredCourier.length} colis
                    </span>
                  </h3>

                  {/* Smart Search Bar */}
                  <div style={{ marginBottom: "15px" }}>
                    <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
                      <input 
                        type="text"
                        placeholder="Rechercher par nom ou référence..."
                        value={courierSearchText}
                        onChange={(e) => setCourierSearchText(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 16px 10px 38px",
                          borderRadius: "10px",
                          border: "1px solid #edf2f7",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          outline: "none",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                          transition: "all 0.2s ease"
                        }}
                      />
                      <svg viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2.5" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px" }}>
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                  </div>

                  {filteredCourier.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "rgba(0,0,0,0.4)", fontSize: "0.85rem", background: "rgba(0,0,0,0.01)", borderRadius: "12px", border: "1px dashed rgba(0,0,0,0.08)" }}>
                      {courierSearchText ? "Aucun colis ne correspond à votre recherche." : "Aucun colis d&apos;expédition enregistré pour le moment."}
                    </div>
                  ) : (
                    <div className={styles.rosterTableContainer} style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #edf2f7", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                      <table className={styles.rosterTable}>
                        <thead>
                          <tr>
                            <th>Référence Colis</th>
                            <th>Description Colis</th>
                            <th>Poids &amp; Type</th>
                            <th>Trajet &amp; Compagnie</th>
                            <th style={{ textAlign: "center" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCourier.map(colis => (
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
                              <td style={{ textAlign: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedColis(colis)}
                                  style={{
                                    padding: "6px 14px",
                                    fontSize: "0.75rem",
                                    fontWeight: "800",
                                    background: "rgba(0,103,60,0.08)",
                                    color: "#00673C",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#00673C";
                                    e.currentTarget.style.color = "#ffffff";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(0,103,60,0.08)";
                                    e.currentTarget.style.color = "#00673C";
                                  }}
                                >
                                  Voir le ticket
                                </button>
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
          );
        })()}

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
                        <label className={styles.formLabel}>Bus disponible *</label>
                        <select 
                          className={styles.formSelect}
                          value={selectedBusId}
                          onChange={(e) => setSelectedBusId(e.target.value)}
                          required
                        >
                          <option value="">Sélectionner un bus réel</option>
                          {agencyAvailableBuses.map(bus => (
                            <option key={bus.id} value={bus.id}>
                              {bus.plaque} — {bus.busClass} — {bus.occupied}/{bus.capacity} places
                            </option>
                          ))}
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
                        {RESERVATION_AMENITIES.map((amenity) => (
                          <label key={amenity.key} className={`${styles.amenityCheckLabel} ${selectedAmenities.includes(amenity.key) ? styles.amenityChecked : ""}`}>
                            <input
                              type="checkbox"
                              className={styles.amenityCheckInput}
                              checked={selectedAmenities.includes(amenity.key)}
                              onChange={() => toggleFormAmenity(amenity.key)}
                            />
                            {amenity.label}
                          </label>
                        ))}
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
                    agencyRouteEntries.map(({ route, journeys }) => {
                      const isExpanded = expandedRouteKey === route;
                      const totalPassengers = journeys.reduce((sum, j) => sum + (passengersMap[j.id]?.length || 0), 0);
                      const minPrice = Math.min(...journeys.map(j => j.price));
                      return (
                        <div key={route} className={styles.tripItem}>
                          <div className={styles.tripHeader} onClick={() => setExpandedRouteKey(isExpanded ? null : route)} style={{ cursor: "pointer" }}>
                            <span className={styles.tripRoute}>{route}</span>
                            <span className={styles.tripPriceBadge}>dès {minPrice.toLocaleString()} FCFA</span>
                          </div>
                          <div className={styles.tripMeta} onClick={() => setExpandedRouteKey(isExpanded ? null : route)} style={{ cursor: "pointer" }}>
                            <div className={styles.tripMetaItem}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "13px", height: "13px", marginRight: "4px" }}>
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {journeys.length} horaire{journeys.length > 1 ? "s" : ""}
                            </div>
                            <div className={styles.tripMetaItem}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "13px", height: "13px", marginRight: "4px" }}>
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              {totalPassengers} Passagers
                            </div>
                          </div>
                          {isExpanded && (
                            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                              {journeys.map(j => (
                                <div key={j.id} className={`${styles.tripItem} ${selectedJourneyId === j.id ? styles.tripItemActive : ""}`} onClick={() => setSelectedJourneyId(j.id)} style={{ marginBottom: 0, boxShadow: "none" }}>
                                  <div className={styles.tripHeader}>
                                    <span className={styles.tripRoute}>{j.depTime} — {j.arrTime}</span>
                                    <span className={styles.tripPriceBadge}>{j.price.toLocaleString()} FCFA</span>
                                  </div>
                                  <div className={styles.tripMeta} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                      <div className={styles.tripMetaItem}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "13px", height: "13px", marginRight: "4px" }}>
                                          <circle cx="12" cy="12" r="10" />
                                          <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        {j.duration}
                                      </div>
                                      <div className={styles.tripMetaItem}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "13px", height: "13px", marginRight: "4px" }}>
                                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                          <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        {passengersMap[j.id]?.length || 0} Passagers
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteJourney(j.id);
                                      }}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "#e53e3e",
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontWeight: 800,
                                        fontSize: "0.72rem",
                                        fontFamily: "inherit",
                                        transition: "all 0.2s ease"
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(229,62,62,0.08)"}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "12px", height: "12px" }}>
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                      Supprimer
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {agencyActiveTab === "departs" && (
          <div className={styles.tabContentFadeIn}>
            <div className={styles.dashboardGrid}>
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>Départs du jour</h2>
                </div>
                <div className={styles.panelBody}>
                  {agencyJourneys.length === 0 ? (
                    <div className={styles.emptyState}>Aucun horaire disponible pour cette agence.</div>
                  ) : filteredDepartureJourneys.length === 0 ? (
                    <div className={styles.emptyState}>Aucun départ ne correspond aux filtres sélectionnés.</div>
                  ) : (
                    filteredDepartureJourneys.map(j => {
                      const isDeparted = getJourneyDepartureState(j) === "departed";
                      return (
                        <div
                          key={j.id}
                          className={`${styles.tripItem} ${selectedJourneyId === j.id ? styles.tripItemActive : ""}`}
                          onClick={() => setSelectedJourneyId(j.id)}
                        >
                          <div className={styles.tripHeader}>
                            <span className={styles.tripRoute}>{j.depStation.split(" - ")[0]} → {j.arrStation.split(" - ")[0]}</span>
                            <span className={styles.tripPriceBadge}>{isDeparted ? "Parti" : "À venir"}</span>
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
                          <div className={styles.tripMeta} style={{ marginTop: "6px" }}>
                            <div className={styles.tripMetaItem}>{j.busClass || "Classe non renseignée"}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>Liste des passagers</h2>
                </div>
                <div className={styles.panelBody}>
                  {selectedJourneyId === null ? (
                    <div className={styles.emptyState}>Choisissez un horaire à gauche pour afficher les passagers.</div>
                  ) : activePassengers.length === 0 ? (
                    <div className={styles.emptyState}>Aucun passager enregistré sur cet horaire.</div>
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
                              <td><span className={styles.seatBadge}>{p.seat}</span></td>
                              <td>
                                <span
                                  className={`${styles.statusPill} ${p.status === "Enregistré" ? styles.statusChecked : p.status === "Payé" ? styles.statusPaid : styles.statusPending}`}
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
                                      <button type="button" className={styles.scanLuggageBtn} onClick={() => handleOpenScanner(p)}>
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
                  {(chatThreads[activeContactId] || []).map(msg => {
                    const isSent = msg.sender === "agency";
                    return (
                      <div 
                        key={msg.id} 
                        className={`${styles.chatBubble} ${isSent ? styles.chatBubbleSent : styles.chatBubbleRecv}`}
                      >
                        <div>{msg.text}</div>
                        <div className={styles.chatBubbleTime} style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                          <span>{msg.time}</span>
                          {isSent && (
                            <span 
                              style={{ 
                                color: msg.isRead ? "#fccd05" : "#a0aec0", 
                                fontSize: "0.85rem", 
                                fontWeight: "bold",
                                lineHeight: "1",
                                marginLeft: "2px"
                              }}
                              title={msg.isRead ? "Lu" : "Distribué"}
                            >
                              ✓✓
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
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

      {/* 2. LUGGAGE/PACKAGE DIGITAL TICKET MODAL OVERLAY */}
      {selectedColis && (() => {
        const getLuggageQrPayload = (colis: any) => {
          return [
            `SAFETRIP - ÉTIQUETTE BAGAGE/COLIS`,
            `Réf: ${colis.qrRef || colis.id}`,
            `Agence: ${colis.agency}`,
            `-------------------------`,
            `EXPÉDITEUR:`,
            `Nom: ${colis.senderName || colis.client_name || 'N/A'}`,
            `Tél: ${colis.senderPhone || colis.client_phone || 'N/A'}`,
            `-------------------------`,
            `DESTINATAIRE:`,
            `Nom: ${colis.recipientName || 'N/A'}`,
            `Tél: ${colis.recipientPhone || 'N/A'}`
          ].join('\n');
        };

        const getLuggageQrUrl = (c: any, size = 180) => 
          `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(getLuggageQrPayload(c))}`;
        
        return (
          <div 
            onClick={() => setSelectedColis(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
              padding: "20px"
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "380px",
                backgroundColor: "#0A2F1D",
                borderRadius: "20px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                fontFamily: "inherit"
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px dashed rgba(255,255,255,0.1)" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#fcd116", letterSpacing: "1px" }}>TICKET NUMÉRIQUE</span>
                <button 
                  onClick={() => setSelectedColis(null)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "bold"
                  }}
                >
                  ×
                </button>
              </div>

              {/* Ticket Body */}
              <div style={{ padding: "20px 24px" }}>
                {/* Branding row */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <img src="/images/logo-removebg-preview (2).png" alt="SafeTrip" style={{ height: "26px", objectFit: "contain" }} />
                  <span style={{ width: "4px", height: "4px", background: "rgba(255,255,255,0.3)", borderRadius: "50%" }}></span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {PARTNER_AGENCIES.find(a => a.name.toLowerCase().includes((selectedColis.agency || "").split(" ")[0].toLowerCase()))?.logo ? (
                      <img src={PARTNER_AGENCIES.find(a => a.name.toLowerCase().includes((selectedColis.agency || "").split(" ")[0].toLowerCase()))?.logo} alt={selectedColis.agency} style={{ height: "20px", objectFit: "contain" }} />
                    ) : (
                      <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "rgba(255,255,255,0.7)" }}>{selectedColis.agency || selectedAgencyName}</span>
                    )}
                  </div>
                </div>

                {/* Reference */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "rgba(255,255,255,0.04)", padding: "10px 14px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", fontWeight: "800" }}>RÉFÉRENCE</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#fcd116", fontFamily: "monospace" }}>{selectedColis.id}</span>
                </div>

                {/* Route Section */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", fontWeight: "800", textTransform: "uppercase" }}>TRAJET</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "900", color: "#ffffff", marginTop: "4px" }}>{selectedColis.trip.split(" → ")[0]}</span>
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 15px" }}>
                    <div style={{ height: "2px", background: "rgba(252,209,22,0.3)", flex: 1, position: "relative" }}>
                      <span style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: "6px", height: "6px", background: "#fcd116", borderRadius: "50%" }}></span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", fontWeight: "800", textTransform: "uppercase" }}>DESTINATION</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "900", color: "#ffffff", marginTop: "4px" }}>{selectedColis.trip.split(" → ")[1] || selectedColis.trip}</span>
                  </div>
                </div>

                {/* Sender & Recipient */}
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ paddingRight: "6px" }}>
                    <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.6px" }}>EXPÉDITEUR</span>
                    <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 900, color: "#ffffff", marginTop: "5px" }}>
                      {formatContactValue(selectedColis.senderName || selectedColis.clientName, "Non renseigné")}
                    </span>
                    <span style={{ display: "block", fontSize: "0.7rem", color: "rgba(255,255,255,0.65)", marginTop: "2px" }}>
                      {formatContactValue(selectedColis.senderPhone || selectedColis.clientPhone, "Téléphone indisponible")}
                    </span>
                  </div>
                  <div style={{ paddingLeft: "6px", textAlign: "right" }}>
                    <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.6px" }}>DESTINATAIRE</span>
                    <span style={{ display: "block", fontSize: "0.9rem", fontWeight: 900, color: "#ffffff", marginTop: "5px" }}>
                      {formatContactValue(selectedColis.recipientName || selectedColis.clientName, "Non renseigné")}
                    </span>
                    <span style={{ display: "block", fontSize: "0.7rem", color: "rgba(255,255,255,0.65)", marginTop: "2px" }}>
                      {formatContactValue(selectedColis.recipientPhone || selectedColis.clientPhone, "Téléphone indisponible")}
                    </span>
                  </div>
                </div>

                {/* Perforation */}
                <div style={{ display: "flex", alignItems: "center", margin: "20px -24px", position: "relative" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "0 8px 8px 0", background: "rgba(0,0,0,0.5)", left: 0, position: "absolute" }}></div>
                  <div style={{ flex: 1, borderTop: "2px dashed rgba(255,255,255,0.12)", margin: "0 16px" }}></div>
                  <div style={{ width: "16px", height: "16px", borderRadius: "8px 0 0 8px", background: "rgba(0,0,0,0.5)", right: 0, position: "absolute" }}></div>
                </div>

                {/* Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", fontWeight: "800" }}>PROPRIÉTAIRE</span>
                    <span style={{ display: "block", fontSize: "0.82rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>
                      {selectedColis.label.replace("Bagage de ", "").replace("Colis de ", "")}
                    </span>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", fontWeight: "800" }}>DATE DÉPART</span>
                    <span style={{ display: "block", fontSize: "0.82rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>
                      {selectedColis.tripDate.split(" · ")[0]}
                    </span>
                  </div>
                  {selectedColis.fragile && (
                    <div style={{ gridColumn: "span 2" }}>
                      <span style={{ display: "inline-block", background: "rgba(229,62,62,0.15)", color: "#feb2b2", fontSize: "0.65rem", padding: "4px 8px", borderRadius: "4px", fontWeight: "900" }}>
                        ⚠️ FRAGILE
                      </span>
                    </div>
                  )}
                </div>

                {/* Perforation 2 */}
                <div style={{ display: "flex", alignItems: "center", margin: "20px -24px", position: "relative" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "0 8px 8px 0", background: "rgba(0,0,0,0.5)", left: 0, position: "absolute" }}></div>
                  <div style={{ flex: 1, borderTop: "2px dashed rgba(255,255,255,0.12)", margin: "0 16px" }}></div>
                  <div style={{ width: "16px", height: "16px", borderRadius: "8px 0 0 8px", background: "rgba(0,0,0,0.5)", right: 0, position: "absolute" }}></div>
                </div>

                {/* Footer QR code */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                  <img
                    src={getLuggageQrUrl(selectedColis, 180)}
                    alt="QR Code"
                    style={{
                      width: "110px",
                      height: "110px",
                      background: "#ffffff",
                      padding: "8px",
                      borderRadius: "12px"
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", fontFamily: "monospace", color: "#fcd116", letterSpacing: "1px" }}>{selectedColis.qrRef}</span>
                  <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: "220px", lineHeight: 1.3 }}>
                    Scanner ce QR code en cas de perte pour retrouver le propriétaire
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========== SCANNER QR SECTION =========== */}
      {agencyActiveTab === "scanner" && (
        <div className={styles.tabContentFadeIn} style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 60 }}>
          <style>{`
            @keyframes glowPulse {
              0%,100% { box-shadow: 0 0 18px 4px rgba(0,200,100,0.35), 0 0 50px 10px rgba(0,200,100,0.12); }
              50% { box-shadow: 0 0 32px 8px rgba(0,220,120,0.6), 0 0 80px 20px rgba(0,220,120,0.2); }
            }
            @keyframes cornerFlash {
              0%,100% { opacity:1; } 50% { opacity:0.5; }
            }
            @keyframes fadeSlideUp {
              from { opacity:0; transform:translateY(22px); }
              to { opacity:1; transform:translateY(0); }
            }
            @keyframes scanBeam {
              0% { opacity:1; box-shadow: 0 0 12px 5px #00ffaa; }
              50% { opacity:0.7; box-shadow: 0 0 22px 10px #00ffaa; }
              100% { opacity:1; box-shadow: 0 0 12px 5px #00ffaa; }
            }
            @keyframes particleFloat {
              0% { transform: translateY(0) scale(1); opacity:0.7; }
              100% { transform: translateY(-60px) scale(0.3); opacity:0; }
            }

            /* Responsive helpers for scanner */
            .scanVideoBox { width: 300px; height: 300px; }
            @media (max-width: 640px) {
              .scanVideoBox { width: min(360px, 90vw); height: min(360px, 90vw); }
              .mobileScanBar { position: fixed; left: 0; right: 0; bottom: 12px; display: flex; justify-content: center; z-index: 10000; }
              .mobileScanBtn { width: calc(100% - 24px); max-width: 520px; padding: 14px 18px; border-radius: 14px; border: none; background: linear-gradient(135deg, #00c070, #00a060); color: #071A0E; font-weight: 900; font-size: 1rem; box-shadow: 0 8px 28px rgba(0,192,112,0.4); }
            }
          `}</style>

          {/* Header */}
          <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "linear-gradient(135deg, #00c070, #0A2F1D)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(0,192,112,0.35)"
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#FCD116" strokeWidth="2" style={{ width: 28, height: 28 }}>
                <rect x="3" y="3" width="5" height="5" rx="1"/>
                <rect x="16" y="3" width="5" height="5" rx="1"/>
                <rect x="3" y="16" width="5" height="5" rx="1"/>
                <path d="M21 16h-3v3"/><path d="M21 21h-5"/>
                <path d="M12 3v5"/><path d="M12 12v3"/>
                <path d="M3 12h5"/><path d="M12 12h5"/>
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0A2F1D", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
                Scanner QR SafeTrip
              </h2>
              <p style={{ color: "#718096", fontSize: "0.85rem", margin: 0 }}>
                Scannez billets de voyage et étiquettes de colis via la caméra
              </p>
            </div>
          </div>

          {/* Camera Modal Overlay */}
          {cameraOpen && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.97)", zIndex: 99999,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(6px)"
            }}>
              {/* Hidden canvas for jsQR (Video uses the preview element) */}
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {/* Top label */}
              <div style={{ marginBottom: 24, textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "#00c070", fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
                  ● SYSTÈME ACTIF
                </div>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff", letterSpacing: -0.5 }}>
                  Pointez vers un QR Code SafeTrip
                </div>
              </div>

              {cameraError ? (
                <div style={{ textAlign: "center", color: "#ff6b6b", padding: "20px 30px", background: "rgba(255,100,100,0.1)", borderRadius: 16, border: "1px solid rgba(255,100,100,0.25)", maxWidth: 360 }}>
                  <div style={{ fontSize: "2rem", marginBottom: 12 }}>📷</div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{cameraError}</div>
                </div>
              ) : (
                <div className="scanVideoBox" style={{ position: "relative" }}>
                  {/* Outer glow ring */}
                  <div style={{
                    position: "absolute", inset: -12, borderRadius: 28,
                    animation: "glowPulse 2s ease-in-out infinite",
                    background: "transparent"
                  }} />

                  {/* Video preview area (dark placeholder if no camera) */}
                  <div style={{
                    width: "100%", height: "100%", borderRadius: 18,
                    background: "#0a0a0a", overflow: "hidden", position: "relative",
                    border: "1px solid rgba(0,200,100,0.2)"
                  }}>
                    <video
                      ref={videoRef}
                      playsInline muted autoPlay
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    {/* Scanning laser beam */}
                    <div style={{
                      position: "absolute", left: 0, right: 0,
                      top: `${scanLinePos}%`,
                      height: 3, borderRadius: 3,
                      background: "linear-gradient(90deg, transparent, #00ffaa, #FCD116, #00ffaa, transparent)",
                      animation: "scanBeam 1.2s ease-in-out infinite",
                      zIndex: 10
                    }} />
                    {/* Dark overlay gradient sides */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.35) 100%)" }} />
                  </div>

                  {/* Corner brackets */}
                  {[
                    { top: 0, left: 0, borderRadius: "10px 0 0 0", borderTop: "3px solid #00ffaa", borderLeft: "3px solid #00ffaa" },
                    { top: 0, right: 0, borderRadius: "0 10px 0 0", borderTop: "3px solid #00ffaa", borderRight: "3px solid #00ffaa" },
                    { bottom: 0, left: 0, borderRadius: "0 0 0 10px", borderBottom: "3px solid #00ffaa", borderLeft: "3px solid #00ffaa" },
                    { bottom: 0, right: 0, borderRadius: "0 0 10px 0", borderBottom: "3px solid #00ffaa", borderRight: "3px solid #00ffaa" },
                  ].map((s, i) => (
                    <div key={i} style={{
                      position: "absolute", width: 32, height: 32,
                      animation: "cornerFlash 1.8s ease-in-out infinite",
                      animationDelay: `${i * 0.2}s`,
                      ...s
                    }} />
                  ))}

                  {/* Particle dots */}
                  {[10, 40, 70, 90].map((left, i) => (
                    <div key={i} style={{
                      position: "absolute", bottom: 0, left: `${left}%`,
                      width: 4, height: 4, borderRadius: "50%",
                      background: "#00ffaa",
                      animation: `particleFloat ${1.5 + i * 0.4}s ease-out infinite`,
                      animationDelay: `${i * 0.3}s`,
                      opacity: 0.8
                    }} />
                  ))}
                </div>
              )}

              {/* Bottom controls */}
              <div style={{ marginTop: 32, display: "flex", gap: 12, alignItems: "center", justifyContent: "center" }}>
                <button
                  onClick={closeCamera}
                  style={{
                    background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12, padding: "12px 24px", fontWeight: 700, fontSize: "0.9rem",
                    cursor: "pointer", fontFamily: "inherit"
                  }}
                >
                  ✕ Fermer
                </button>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", maxWidth: 260, textAlign: "center", lineHeight: 1.4 }}>
                  La détection est automatique — maintenez le QR code dans le cadre
                </div>
              </div>
            </div>
          )}

          {/* Main Scan Card */}
          {!scanResult && (
            <div style={{
              background: "linear-gradient(145deg, #071A0E 0%, #0A2F1D 50%, #0d3825 100%)",
              borderRadius: 24, padding: 40, border: "1px solid rgba(0,200,100,0.2)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
              marginBottom: 24, textAlign: "center", position: "relative", overflow: "hidden"
            }}>
              {/* Background grid */}
              <div style={{
                position: "absolute", inset: 0, opacity: 0.04,
                backgroundImage: "linear-gradient(rgba(0,200,100,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,100,1) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
              }} />

              {/* QR Icon large */}
              <div style={{ position: "relative", display: "inline-block", marginBottom: 28 }}>
                <div style={{
                  width: 120, height: 120, borderRadius: 28, margin: "0 auto",
                  background: "rgba(0,200,100,0.08)", border: "2px solid rgba(0,200,100,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 40px rgba(0,200,100,0.15)"
                }}>
                  <svg viewBox="0 0 100 100" fill="none" style={{ width: 64, height: 64 }}>
                    <rect x="8" y="8" width="30" height="30" rx="4" stroke="#00c070" strokeWidth="5"/>
                    <rect x="16" y="16" width="14" height="14" rx="2" fill="#FCD116"/>
                    <rect x="62" y="8" width="30" height="30" rx="4" stroke="#00c070" strokeWidth="5"/>
                    <rect x="70" y="16" width="14" height="14" rx="2" fill="#FCD116"/>
                    <rect x="8" y="62" width="30" height="30" rx="4" stroke="#00c070" strokeWidth="5"/>
                    <rect x="16" y="70" width="14" height="14" rx="2" fill="#FCD116"/>
                    <line x1="62" y1="62" x2="100" y2="62" stroke="#00c070" strokeWidth="5"/>
                    <line x1="62" y1="62" x2="62" y2="100" stroke="#00c070" strokeWidth="5"/>
                    <line x1="80" y1="80" x2="100" y2="80" stroke="#FCD116" strokeWidth="5"/>
                    <line x1="80" y1="80" x2="80" y2="100" stroke="#FCD116" strokeWidth="5"/>
                  </svg>
                </div>
                {/* Pulse rings */}
                <div style={{ position: "absolute", inset: -16, borderRadius: 44, border: "1.5px solid rgba(0,200,100,0.15)", animation: "glowPulse 2.5s ease-in-out infinite" }} />
                <div style={{ position: "absolute", inset: -32, borderRadius: 60, border: "1px solid rgba(0,200,100,0.07)", animation: "glowPulse 2.5s ease-in-out infinite", animationDelay: "0.4s" }} />
              </div>

              <h3 style={{ color: "#ffffff", fontWeight: 900, fontSize: "1.25rem", margin: "0 0 8px 0" }}>
                Scanner un Code QR
              </h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", margin: "0 0 32px 0", lineHeight: 1.6, maxWidth: 380, display: "inline-block" }}>
                Billets de voyage, étiquettes de colis et de bagages — détection instantanée par caméra
              </p>

              {/* Main camera scan button */}
              <button
                type="button"
                onClick={openCamera}
                style={{
                  display: "block", width: "100%", maxWidth: 360, margin: "0 auto 16px",
                  padding: "18px 28px", borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg, #00c070, #00a060)",
                  color: "#071A0E", fontWeight: 900, fontSize: "1.05rem",
                  cursor: "pointer", fontFamily: "inherit", letterSpacing: -0.3,
                  boxShadow: "0 8px 28px rgba(0,192,112,0.4)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  position: "relative"
                }}
                onMouseEnter={e => { (e.target as any).style.transform = "translateY(-2px)"; (e.target as any).style.boxShadow = "0 12px 36px rgba(0,192,112,0.55)"; }}
                onMouseLeave={e => { (e.target as any).style.transform = "translateY(0)"; (e.target as any).style.boxShadow = "0 8px 28px rgba(0,192,112,0.4)"; }}
              >
                <span style={{ marginRight: 10, fontSize: "1.1rem" }}>📷</span>
                Scanner le Code QR
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 360, margin: "0 auto 16px" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>ou coller</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              </div>

              {/* Manual paste */}
              <div style={{ maxWidth: 360, margin: "0 auto" }}>
                <textarea
                  ref={qrInputRef as any}
                  value={qrInputValue}
                  onChange={e => setQrInputValue(e.target.value)}
                  placeholder={"Collez le texte du QR code ici...\nEx: SAFETRIP - BILLET DE VOYAGE\nRéf: TCK-..."}
                  rows={4}
                  style={{
                    width: "100%", borderRadius: 14, border: "1.5px solid rgba(0,200,100,0.2)", padding: "14px",
                    fontSize: "0.82rem", fontFamily: "monospace", resize: "none", outline: "none",
                    color: "#e2e8f0", background: "rgba(255,255,255,0.04)", boxSizing: "border-box",
                    lineHeight: 1.5
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const text = qrInputValue.trim();
                    if (!text) return;
                    const parsed = parseQrText(text);
                    if (!parsed) { showToast("QR code non reconnu. Assurez-vous qu'il provient de SafeTrip.", false); return; }
                    setScanResult(parsed);
                    setScanNotifStatus("idle");
                  }}
                  style={{
                    marginTop: 10, width: "100%", padding: "13px", borderRadius: 12, border: "1.5px solid rgba(0,200,100,0.35)",
                    background: "transparent", color: "#00c070", fontWeight: 800, fontSize: "0.9rem",
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s"
                  }}
                >
                  Analyser le contenu collé
                </button>
              </div>
            </div>
          )}

          {/* Mobile floating scan button for quick access */}
          {!cameraOpen && (
            <div className="mobileScanBar" aria-hidden>
              <button className="mobileScanBtn" onClick={openCamera}>
                📷 Scanner le Code QR
              </button>
            </div>
          )}

          {/* Result Display */}
          {scanResult && (
            <div style={{ animation: "fadeSlideUp 0.4s ease-out" }}>
              {/* Result header badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", background: "#22c55e",
                    boxShadow: "0 0 10px #22c55e"
                  }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#22c55e", textTransform: "uppercase", letterSpacing: 1 }}>
                    QR Code Déchiffré — {scanResult.type === "colis" ? "Étiquette Colis" : "Billet de Voyage"}
                  </span>
                </div>
                <button
                  onClick={() => { setScanResult(null); setQrInputValue(""); setScanNotifStatus("idle"); }}
                  style={{ background: "none", border: "none", color: "#718096", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
                >
                  Nouveau scan ↩
                </button>
              </div>

              {/* Main result card */}
              <div style={{
                background: scanResult.type === "colis"
                  ? "linear-gradient(145deg, #071A0E, #0A2F1D, #004d2e)"
                  : "linear-gradient(145deg, #0a0f2e, #101a50, #0d2260)",
                borderRadius: 24, overflow: "hidden",
                border: `1px solid ${scanResult.type === "colis" ? "rgba(0,200,100,0.25)" : "rgba(100,150,255,0.25)"}`,
                boxShadow: `0 20px 60px ${scanResult.type === "colis" ? "rgba(0,100,60,0.35)" : "rgba(30,50,150,0.35)"}`,
                marginBottom: 20
              }}>
                {/* Card top stripe */}
                <div style={{
                  height: 4,
                  background: scanResult.type === "colis"
                    ? "linear-gradient(90deg, #00c070, #FCD116, #00c070)"
                    : "linear-gradient(90deg, #4169e1, #FCD116, #4169e1)"
                }} />

                <div style={{ padding: "28px 28px 24px" }}>
                  {/* Type + ref */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem",
                      flexShrink: 0
                    }}>
                      {scanResult.type === "colis" ? "📦" : "🎫"}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 3 }}>
                        {scanResult.type === "colis" ? "ÉTIQUETTE COLIS / BAGAGE" : "BILLET DE VOYAGE"}
                      </div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#FCD116", fontFamily: "monospace", letterSpacing: 0.5 }}>
                        {scanResult.data["Réf"] || scanResult.data["Ref"] || "Réf. inconnue"}
                      </div>
                    </div>
                  </div>

                  {/* Data grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                    {scanResult.type === "colis" ? (<>
                      {/* Sender */}
                      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>📤 Expéditeur</div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>
                          {(() => {
                            const lines = scanResult.rawText.split('\n');
                            const idx = lines.findIndex(l => l.trim() === 'EXPÉDITEUR:');
                            return idx > -1 ? lines.slice(idx + 1).find(l => l.startsWith('Nom:'))?.replace('Nom:', '').trim() : (scanResult.data["Nom"] || "N/A");
                          })()}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#00c070", marginTop: 5, fontFamily: "monospace" }}>
                          {(() => {
                            const lines = scanResult.rawText.split('\n');
                            const idx = lines.findIndex(l => l.trim() === 'EXPÉDITEUR:');
                            return idx > -1 ? lines.slice(idx + 1).find(l => l.startsWith('Tél:'))?.replace('Tél:', '').trim() : "";
                          })()}
                        </div>
                      </div>
                      {/* Recipient */}
                      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>📥 Destinataire</div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>
                          {(() => {
                            const lines = scanResult.rawText.split('\n');
                            const idx = lines.findIndex(l => l.trim() === 'DESTINATAIRE:');
                            return idx > -1 ? lines.slice(idx + 1).find(l => l.startsWith('Nom:'))?.replace('Nom:', '').trim() : "N/A";
                          })()}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#00c070", marginTop: 5, fontFamily: "monospace" }}>
                          {(() => {
                            const lines = scanResult.rawText.split('\n');
                            const idx = lines.findIndex(l => l.trim() === 'DESTINATAIRE:');
                            return idx > -1 ? lines.slice(idx + 1).find(l => l.startsWith('Tél:'))?.replace('Tél:', '').trim() : "";
                          })()}
                        </div>
                      </div>
                      {/* Agency */}
                      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)", gridColumn: "span 2" }}>
                        <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>🏢 Agence</div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#FCD116" }}>{scanResult.data["Agence"] || selectedAgencyName}</div>
                      </div>
                    </>) : (<>
                      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>👤 Passager</div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>{scanResult.data["Nom"] || "N/A"}</div>
                        <div style={{ fontSize: "0.78rem", color: "#00c070", marginTop: 5, fontFamily: "monospace" }}>{scanResult.data["Tél"] || ""}</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                        <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>💺 Siège</div>
                        <div style={{ fontWeight: 900, fontSize: "2rem", color: "#FCD116", letterSpacing: -1 }}>{scanResult.data["Siège"] || "—"}</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)", gridColumn: "span 2" }}>
                        <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🗺️ Trajet</div>
                        <div style={{ fontWeight: 900, fontSize: "1.05rem", color: "#fff" }}>{scanResult.data["De"] || "?"} → {scanResult.data["Vers"] || "?"}</div>
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{scanResult.data["Date"] || ""} • Départ {scanResult.data["Départ"] || ""}</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)", gridColumn: "span 2" }}>
                        <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>🏢 Agence</div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#FCD116" }}>{scanResult.data["Agence"] || selectedAgencyName}</div>
                      </div>
                    </>)}
                  </div>

                  {/* Action */}
                  {scanResult.type === "colis" && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
                      <p style={{ margin: "0 0 14px 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                        En confirmant, un <strong style={{ color: "rgba(255,255,255,0.8)" }}>email de livraison</strong> sera automatiquement envoyé à l'expéditeur et au destinataire.
                      </p>
                      <button
                        type="button"
                        disabled={scanNotifStatus === "sending" || scanNotifStatus === "sent"}
                        onClick={async () => {
                          setScanNotifStatus("sending");
                          try {
                            const lines = scanResult.rawText.split('\n');
                            const destIdx = lines.findIndex(l => l.trim() === 'DESTINATAIRE:');
                            const senderIdx = lines.findIndex(l => l.trim() === 'EXPÉDITEUR:');
                            const destNom = destIdx > -1 ? lines.slice(destIdx + 1).find(l => l.startsWith('Nom:'))?.replace('Nom:', '').trim() : null;
                            const destTel = destIdx > -1 ? lines.slice(destIdx + 1).find(l => l.startsWith('Tél:'))?.replace('Tél:', '').trim() : null;
                            const senderNom = senderIdx > -1 ? lines.slice(senderIdx + 1).find(l => l.startsWith('Nom:'))?.replace('Nom:', '').trim() : null;
                            const senderTel = senderIdx > -1 ? lines.slice(senderIdx + 1).find(l => l.startsWith('Tél:'))?.replace('Tél:', '').trim() : null;
                            const colisRef = scanResult.data["Réf"] || scanResult.data["Ref"] || "N/A";
                            const agenceName = scanResult.data["Agence"] || selectedAgencyName;
                            const res = await fetch(`${((typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) ? 'https://safe-trip-backend.vercel.app' : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://${window.location.hostname}:5000` : 'https://safe-trip-backend.vercel.app')))}/api/agency/notify-delivery`, {
                              method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
                              body: JSON.stringify({ colisRef, agenceName, senderName: senderNom, senderPhone: senderTel, recipientName: destNom, recipientPhone: destTel })
                            });
                            if (res.ok) {
                              setScanNotifStatus("sent");
                              showToast("✅ Livraison confirmée ! Notifications envoyées.");
                              setColisState(prev => prev.map(c => c.id === colisRef || c.qrRef === colisRef ? { ...c, status: "Livré" as const } : c));
                            } else { setScanNotifStatus("error"); showToast("Erreur lors des notifications.", false); }
                          } catch { setScanNotifStatus("error"); showToast("Impossible de joindre le serveur.", false); }
                        }}
                        style={{
                          width: "100%", padding: "16px", borderRadius: 14, border: "none",
                          fontWeight: 900, fontSize: "1rem", cursor: scanNotifStatus === "sent" ? "default" : "pointer",
                          fontFamily: "inherit", transition: "all 0.3s ease", letterSpacing: -0.3,
                          background: scanNotifStatus === "sent" ? "linear-gradient(135deg, #22c55e, #16a34a)" : scanNotifStatus === "sending" ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #FCD116, #e6b800)",
                          color: scanNotifStatus === "sent" ? "#fff" : "#071A0E",
                          boxShadow: scanNotifStatus === "sent" ? "0 8px 28px rgba(34,197,94,0.35)" : scanNotifStatus === "idle" ? "0 8px 28px rgba(252,209,22,0.35)" : "none"
                        }}
                      >
                        {scanNotifStatus === "idle" && "✅ Confirmer l'arrivée — Notifier l'expéditeur & destinataire"}
                        {scanNotifStatus === "sending" && "⏳ Envoi des notifications en cours..."}
                        {scanNotifStatus === "sent" && "✔️ Livraison confirmée — Notifications envoyées !"}
                        {scanNotifStatus === "error" && "⚠️ Erreur — Cliquer pour réessayer"}
                      </button>
                    </div>
                  )}

                  {scanResult.type === "billet" && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const token = scanResult.data["Token"]; // New format preferred
                            if (token) {
                              setScanNotifStatus("sending");
                              const res = await fetch(`${((typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) ? 'https://safe-trip-backend.vercel.app' : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://${window.location.hostname}:5000` : 'https://safe-trip-backend.vercel.app')))}/api/agency/tickets/scan`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ token })
                              });
                              const data = await res.json();
                              if (res.ok && data.status === 'validated') {
                                showToast(`✅ Billet validé. Passager ${data.passenger?.name || ''} embarqué !`);
                                setScanResult(null);
                                setQrInputValue("");
                                setScanNotifStatus("sent");
                              } else if (res.status === 409) {
                                showToast(`⚠️ Ce billet a déjà été utilisé${data.scannedAt ? ` le ${new Date(data.scannedAt).toLocaleString('fr-FR')}` : ''}.`, false);
                                setScanNotifStatus("error");
                              } else {
                                showToast(data.error || 'Validation du billet impossible.', false);
                                setScanNotifStatus("error");
                              }
                            } else {
                              // Backward compatibility: no token in QR
                              showToast(`✅ Passager ${scanResult.data["Nom"] || ""} enregistré à bord !`);
                              setScanResult(null);
                              setQrInputValue("");
                            }
                          } catch (e) {
                            showToast('Erreur réseau lors de la validation du billet.', false);
                            setScanNotifStatus("error");
                          }
                        }}
                        style={{
                          width: "100%", padding: "16px", borderRadius: 14, border: "none",
                          fontWeight: 900, fontSize: "1rem", cursor: "pointer", fontFamily: "inherit",
                          background: "linear-gradient(135deg, #FCD116, #e6b800)", color: "#071A0E",
                          boxShadow: "0 8px 28px rgba(252,209,22,0.35)", letterSpacing: -0.3
                        }}
                      >
        ✅ Valider l'embarquement du passager (scan unique)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
