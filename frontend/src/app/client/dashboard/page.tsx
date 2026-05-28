"use client";

import styles from "./page.module.css";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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


export default function ClientDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clientActiveTab, setClientActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Active Billets and Colis Database states
  const [billetsState, setBilletsState] = useState<Billet[]>([]);
  const [colisState, setColisState] = useState<Colis[]>([]);

  const [selectedBillet, setSelectedBillet] = useState<Billet | null>(null);
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const digitalTicketRef = useRef<HTMLDivElement>(null);

  // Profile States
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileFullName, setProfileFullName] = useState("");
  const [profilePhone, setProfilePhone] = useState("+237 655 46 26 42");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastSuccess, setIsToastSuccess] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  // Messenger Database & Interactive States
  const AGENCIES_FOR_CHATS = [
    { id: "support", name: "Support SafeTrip", email: "support@safetrip.cm", logo: "/images/logo-removebg-preview (2).png", isSupport: true },
    { id: "1", name: "Finexs Voyage", email: "finexs@safetrip.cm", logo: "/images/finexs.png" },
    { id: "2", name: "Buca Voyage", email: "buca@safetrip.cm", logo: "/images/bucavoyage.png" },
    { id: "3", name: "General Express", email: "general@safetrip.cm", logo: "/images/General.png" },
    { id: "4", name: "Touristique Express", email: "touristique@safetrip.cm", logo: "/images/Touristique.png" },
    { id: "5", name: "Men Travel", email: "men@safetrip.cm", logo: "/images/mentravel.png" }
  ];

  const [chatThreads, setChatThreads] = useState<{ [agencyId: string]: any[] }>({});
  const [activeThreadId, setActiveThreadId] = useState("support");
  const [chatInputText, setChatInputText] = useState("");
  const [emailSearchInput, setEmailSearchInput] = useState("");
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);

  const fetchMessagesForActiveThread = async (agencyIdStr: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("safetrip_token") || "";
    const authHeaders = { "Authorization": `Bearer ${token}` };
    const passengerThreadId = email.split("@")[0] || "voyageur";

    const targetThreadId = agencyIdStr === "support" ? "support" : passengerThreadId;
    const targetAgencyId = agencyIdStr === "support" ? 1 : parseInt(agencyIdStr, 10) || 1;

    try {
      const res = await fetch(`${apiBase}/api/agency/messages/${targetThreadId}?agency_id=${targetAgencyId}`, { headers: authHeaders });
      if (res.ok) {
        const rawMsgs = await res.json();
        const mapped = rawMsgs.map((m: any) => ({
          id: m.id,
          sender: m.sender as "agency" | "contact",
          text: m.text,
          time: m.time,
          isRead: m.is_read
        }));
        setChatThreads(prev => ({
          ...prev,
          [agencyIdStr]: mapped
        }));
      }
    } catch (err) {
      console.warn("⚠️ Impossible de charger les messages de la base de données.", err);
    }
  };

  const handleSendPassengerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    const timeStr = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const passengerThreadId = email.split("@")[0] || "voyageur";
    const targetThreadId = activeThreadId === "support" ? "support" : passengerThreadId;
    const targetAgencyId = activeThreadId === "support" ? 1 : parseInt(activeThreadId, 10) || 1;

    const newMsg = {
      id: Date.now(),
      sender: "contact" as const,
      text: chatInputText,
      time: timeStr
    };

    setChatThreads(prev => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), newMsg]
    }));
    setChatInputText("");

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("safetrip_token") || "";
    try {
      await fetch(`${apiBase}/api/agency/messages/${targetThreadId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender: "contact",
          text: chatInputText,
          time: timeStr,
          agency_id: targetAgencyId
        })
      });
    } catch (err) {
      console.warn("⚠️ Impossible d'envoyer le message au serveur.", err);
    }
  };

  // Load & poll messages for active chat thread in real-time
  useEffect(() => {
    if (clientActiveTab !== "messageries" || !email) return;

    fetchMessagesForActiveThread(activeThreadId);

    const interval = setInterval(() => {
      fetchMessagesForActiveThread(activeThreadId);
    }, 3000);

    return () => clearInterval(interval);
  }, [clientActiveTab, activeThreadId, email]);

  // Sync marking agency messages as read
  useEffect(() => {
    if (clientActiveTab !== "messageries" || !email || !activeThreadId) return;
    
    const markAsRead = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("safetrip_token") || "";
      const passengerThreadId = email.split("@")[0] || "voyageur";
      const targetThreadId = activeThreadId === "support" ? "support" : passengerThreadId;
      const targetAgencyId = activeThreadId === "support" ? 1 : parseInt(activeThreadId, 10) || 1;
      
      try {
        await fetch(`${apiBase}/api/agency/messages/${targetThreadId}/read?agency_id=${targetAgencyId}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ role: "contact" })
        });
      } catch (err) {
        console.warn("⚠️ Error marking messages as read:", err);
      }
    };
    
    markAsRead();
  }, [clientActiveTab, activeThreadId, email, chatThreads[activeThreadId]?.length]);

  // Load loyalty points on client side to avoid SSR hydration mismatch
  useEffect(() => {
    try {
      const storedPoints = parseInt(localStorage.getItem("safetrip_loyalty_points") || "0", 10);
      const completedTickets = billetsState.filter(b => b.status === "Complété");
      setLoyaltyPoints(Math.max(storedPoints, completedTickets.length * 50));
    } catch { /* ignore */ }
  }, [billetsState]);

  // Security Check and state loading
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("safetrip_logged_in") === "true";
    const role = localStorage.getItem("safetrip_user_role");
    
    if (!isLoggedIn || role !== "client") {
      router.push("/login");
      return;
    }

    const storedEmail = localStorage.getItem("safetrip_user_email") || "";
    setEmail(storedEmail);

    // Load profile
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
    } else {
      const storedUserName = localStorage.getItem("safetrip_user_name");
      if (storedUserName) {
        setProfileFullName(storedUserName);
      } else if (storedEmail) {
        setProfileFullName(storedEmail.split("@")[0]);
      }
    }

    // Hydrate tickets and package tracking from API
    const hydrateClientData = async () => {
      const clientId = localStorage.getItem("safetrip_user_id") || "client-uuid-1";
      const token = localStorage.getItem("safetrip_token") || "";
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const authHeaders = { "Authorization": `Bearer ${token}` };

      // 1. Fetch billets from API
      try {
        const billetsRes = await fetch(`${apiBase}/api/client/billets?client_id=${clientId}`, { headers: authHeaders });
        if (billetsRes.ok) {
          const apiData: Billet[] = await billetsRes.json();
          setBilletsState(apiData);
        } else {
          setBilletsState([]);
        }
      } catch (err) {
        console.error("⚠️ Error fetching billets from Supabase:", err);
        setBilletsState([]);
      }

      // 2. Fetch colis from API
      try {
        const colisRes = await fetch(`${apiBase}/api/client/colis?client_id=${clientId}`, { headers: authHeaders });
        if (colisRes.ok) {
          const apiData: Colis[] = await colisRes.json();
          setColisState(apiData);
        } else {
          setColisState([]);
        }
      } catch (err) {
        console.error("⚠️ Error fetching colis from Supabase:", err);
        setColisState([]);
      }
    };

    hydrateClientData();
  }, []);

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

  const getLuggageQrPayload = (colis: Colis) => {
    return JSON.stringify({
      app: "SafeTrip",
      type: "luggage",
      luggageId: colis.id,
      qrRef: colis.qrRef,
      traveler: profileFullName || email.split("@")[0] || "Voyageur SafeTrip",
      trip: colis.trip,
      status: colis.status
    });
  };

  const getLuggageQrUrl = (colis: Colis, size = 180) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(getLuggageQrPayload(colis))}`;
  };

  const handleDownloadPDF = async (billet: Billet) => {
    showToast("Génération du billet PDF en cours...");
    try {
      const { default: jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const pdfDiv = document.createElement("div");
      pdfDiv.style.cssText = `position: fixed; top: -9999px; left: -9999px; width: 794px; background: #ffffff; font-family: 'Montserrat', Arial, sans-serif; color: #1a202c; padding: 0; margin: 0;`;
      pdfDiv.innerHTML = `
        <div style="width:794px; min-height:420px; background:#fff; padding:0; margin:0; font-family:Arial,sans-serif;">
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

  const handleDownloadColisPDF = async (colis: Colis) => {
    showToast("Génération de l'étiquette de bagage PDF...");
    try {
      const { default: jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const pdfDiv = document.createElement("div");
      pdfDiv.style.cssText = "position: fixed; top: -9999px; left: -9999px; width: 420px; min-height: 640px; background: #F3F7F4; font-family: Arial, sans-serif; color: #1a202c; padding: 0; margin: 0;";
      
      const qrUrl = getLuggageQrUrl(colis, 180);
      const dimensionsRow = colis.dimensions ? '<tr><td style="padding: 6px 0; color: #718096;">DIMENSIONS</td><td style="padding: 6px 0; font-weight: bold; color: #1a202c; text-align: right;">' + colis.dimensions + '</td></tr>' : '';
      const fragileRow = colis.fragile ? '<tr><td style="padding: 6px 0; color: #ef4444; font-weight: 900;">ATTENTION</td><td style="padding: 6px 0; font-weight: 900; color: #ef4444; text-align: right; letter-spacing: 0.5px;">⚠️ BAGAGE FRAGILE</td></tr>' : '';

      pdfDiv.innerHTML = `
        <div style="width: 420px; padding: 14px; margin: 0; box-sizing: border-box; background: #F3F7F4;">
        <div style="background: #ffffff; border: 2px solid #0A2F1D; border-radius: 26px; overflow: hidden; text-align: center; box-shadow: 0 16px 40px rgba(10,47,29,0.14); position: relative;">
          <div style="display: flex; height: 7px;">
            <div style="flex: 1; background: #007A5E;"></div>
            <div style="flex: 1; background: #CE1126;"></div>
            <div style="flex: 1; background: #FCD116;"></div>
          </div>
          <div style="display: flex; justify-content: center; padding: 14px 0 10px 0; background: #F8FBF9;">
            <div style="width: 15px; height: 15px; border-radius: 50%; border: 3px solid #CBD5E0; background: #ffffff; box-shadow: inset 0 0 0 3px #F8FBF9;"></div>
          </div>
          <div style="background: linear-gradient(135deg,#062718 0%,#0A2F1D 45%,#00673C 100%); color: #ffffff; padding: 18px 22px; display: flex; justify-content: space-between; align-items: center;">
            <div style="text-align: left;">
              <div style="font-weight: 900; font-size: 20px; letter-spacing: -1px;">SafeTrip</div>
              <div style="font-size: 8px; color: rgba(255,255,255,0.68); letter-spacing: 1.5px; text-transform: uppercase;">Luggage ID Card</div>
            </div>
            <div style="background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.2); border-radius: 999px; padding: 6px 11px; font-size: 10px; font-weight: bold; max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${colis.agency}
            </div>
          </div>
          <div style="padding: 20px 22px 8px 22px; text-align: left;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
              <div>
                <span style="font-size: 8px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.4px; display: block; margin-bottom: 4px; font-weight: 800;">Document officiel</span>
                <span style="font-size: 21px; font-weight: 950; color: #0A2F1D; text-transform: uppercase; letter-spacing: 0.2px; line-height: 1;">Étiquette Bagage</span>
              </div>
              <div style="background: #EAF7F1; color: #00673C; border: 1px solid #BFE8D4; border-radius: 999px; padding: 6px 9px; font-size: 8px; font-weight: 900; white-space: nowrap;">À COLLER</div>
            </div>
          </div>
          <div style="border-bottom: 2px dashed #CBD5E0; margin: 12px 22px;"></div>
          <div style="padding: 0 22px 8px 22px; text-align: left;">
            <div style="background: #F8FBF9; border: 1px solid #E2E8F0; border-radius: 18px; padding: 10px 14px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="padding: 7px 0; color: #64748B; width: 43%; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">RÉFÉRENCE</td>
                <td style="padding: 7px 0; font-weight: 900; color: #00673C; text-align: right; font-size: 12px;">${colis.id}</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #64748B; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">VOYAGEUR</td>
                <td style="padding: 7px 0; font-weight: 800; color: #0F172A; text-align: right;">${profileFullName || email.split("@")[0] || "Voyageur SafeTrip"}</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #64748B; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">TRAJET</td>
                <td style="padding: 7px 0; font-weight: 900; color: #0A2F1D; text-align: right;">${colis.trip}</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #64748B; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">DATE DE DÉPART</td>
                <td style="padding: 7px 0; font-weight: 800; color: #0F172A; text-align: right;">${colis.tripDate.split(" · ")[0]}</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #64748B; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">TYPE D'OBJET</td>
                <td style="padding: 7px 0; font-weight: 800; color: #0F172A; text-align: right;">${colis.type} (${colis.color})</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #64748B; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">POIDS ENREGISTRÉ</td>
                <td style="padding: 7px 0; font-weight: 950; color: #00673C; text-align: right; font-size: 14px;">${colis.weight} KG</td>
              </tr>
              ${dimensionsRow}
              ${fragileRow}
            </table>
            </div>
          </div>
          <div style="border-bottom: 2px dashed #CBD5E0; margin: 12px 22px;"></div>
          <div style="padding: 8px 22px 24px 22px; display: flex; flex-direction: column; align-items: center; gap: 9px;">
            <div style="font-size: 8px; color: #64748B; text-transform: uppercase; letter-spacing: 1.3px; font-weight: 900;">Scan perte / restitution</div>
            <div style="background: #ffffff; border: 3px solid #0A2F1D; border-radius: 18px; padding: 13px; box-shadow: 0 10px 22px rgba(10,47,29,0.12);">
              <img src="${qrUrl}" alt="QR Code bagage SafeTrip" style="width: 164px; height: 164px; display: block;" />
            </div>
            <div style="font-family: monospace; font-size: 11px; font-weight: 900; color: #0A2F1D; letter-spacing: 3px;">
              ${colis.qrRef}
            </div>
            <div style="font-size: 9px; color: #64748B; max-width: 280px; line-height: 1.45; background: #F8FBF9; border-radius: 999px; padding: 7px 12px;">
              À scanner en cas de perte pour retrouver l'identité du bagage.
            </div>
          </div>
          <div style="background: #0A2F1D; padding: 14px 20px; font-size: 8px; color: rgba(255,255,255,0.72); border-top: 1px solid rgba(255,255,255,0.12); text-align: center; line-height: 1.45;">
            <strong style="color:#FCD116;">SafeTrip © 2026</strong> — Bagage enregistré officiel.<br/>
            Ce ticket doit rester visible et collé au bagage pendant tout le trajet.
          </div>
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

  // Calcul dynamique des statistiques depuis la base de données
  const activeTickets = billetsState.filter(b => b.status === "Actif");
  const activeTicketsCount = activeTickets.length;
  
  // Trouver le prochain voyage prévu
  const nextTrip = activeTickets[0];
  const nextTripText = nextTrip ? `Le ${nextTrip.date} · ${nextTrip.depTime}` : "Aucun voyage prévu";

  const completedTickets = billetsState.filter(b => b.status === "Complété");
  const completedCount = completedTickets.length;
  const loyaltyStatus = loyaltyPoints < 100 ? "Statut Bronze" : loyaltyPoints < 300 ? "Statut Argent" : "Statut Or";
  const nextLevelPoints = loyaltyPoints < 100 ? 100 : loyaltyPoints < 300 ? 300 : null;
  const loyaltyProgressPct = nextLevelPoints
    ? Math.min(100, Math.round((loyaltyPoints / nextLevelPoints) * 100))
    : 100;

  // Bagages et colis
  const totalColisCount = colisState.length;
  const transitColisCount = colisState.filter(c => c.status !== "Livré" && c.status !== "En attente de scan").length;
  const colisSubtext = totalColisCount > 0 ? `${transitColisCount} bagage(s) en transit` : "Aucun bagage enregistré";

  // Total dépensé sur les billets valides (non annulés)
  const totalSpent = billetsState
    .filter(b => b.status !== "Annulé")
    .reduce((sum, b) => sum + (b.price || 0), 0);

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
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            Colis
          </button>

          <button
            type="button"
            className={`${styles.sidebarNavItem} ${clientActiveTab === "bagages" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => setClientActiveTab("bagages")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            Bagages
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
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Compte : {email}</span>
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
                  <span className={styles.statValue}>{activeTicketsCount} Actif{activeTicketsCount !== 1 ? "s" : ""}</span>
                  <span className={styles.statTrend} style={{ color: "#2f855a" }}>{nextTripText}</span>
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
                  <span className={styles.statValue}>{loyaltyPoints} pts</span>
                  <span className={styles.statTrend} style={{ color: "#744210" }}>
                    {loyaltyStatus}
                    {nextLevelPoints && ` · ${nextLevelPoints - loyaltyPoints} pts jusqu'au niveau suivant`}
                  </span>
                  <div style={{ width: "100%", height: "4px", background: "rgba(200,148,30,0.15)", borderRadius: "4px", marginTop: "6px" }}>
                    <div style={{ width: `${loyaltyProgressPct}%`, height: "100%", background: "var(--accent-gold, #C8941E)", borderRadius: "4px", transition: "width 0.6s ease" }} />
                  </div>
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
                  <span className={styles.statValue}>{totalColisCount} étiqueté{totalColisCount !== 1 ? "s" : ""}</span>
                  <span className={styles.statTrend} style={{ color: "#3182ce" }}>{colisSubtext}</span>
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
                  <span className={styles.statValue}>{totalSpent.toLocaleString("fr-CM")} FCFA</span>
                  <span className={styles.statTrend} style={{ color: "#9b2c2c" }}>{completedCount} réservation{completedCount !== 1 ? "s" : ""} complétée{completedCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {clientActiveTab === "billet" && (
          <div className={styles.tabContentFadeIn}>
            <div className={styles.billetPageHeader}>
              <div>
                <h2 className={styles.billetPageTitle} style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"18px",height:"18px",color:"#00673C"}}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                  Mes Billets de Voyage
                </h2>
                <p className={styles.billetPageSub}>{billetsState.length} billet{billetsState.length > 1 ? "s" : ""} trouvé{billetsState.length > 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className={styles.billetList}>
              {billetsState.map((billet) => (
                <div key={billet.id} className={styles.billetCard}>
                  <div className={`${styles.billetStripe} ${billet.status === "Actif" ? styles.billetStripeActive : billet.status === "Annulé" ? styles.billetStripeCancelled : styles.billetStripeCompleted}`} />
                  
                  <div className={styles.billetCardBody}>
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"13px",height:"13px"}}><path d="M19 18V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v13" /><path d="M3 18h18" /><path d="M5 21h14" /></svg>
                        Siège {billet.seat}
                      </span>
                      <span className={styles.billetMetaItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"13px",height:"13px"}}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        {billet.luggageCount} bagage{billet.luggageCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

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

            {selectedBillet && (
              <div className={styles.billetModalOverlay} onClick={() => setSelectedBillet(null)}>
                <div className={styles.billetModalWrapper} onClick={(e) => e.stopPropagation()}>
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

                  <div ref={digitalTicketRef} className={styles.digitalTicket}>
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

                    <div className={styles.dtPerforated}>
                      <div className={styles.dtCircleLeft}/>
                      <div className={styles.dtDots}/>
                      <div className={styles.dtCircleRight}/>
                    </div>

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
            <div className={styles.billetPageHeader}>
              <div>
                <h2 className={styles.billetPageTitle} style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"18px",height:"18px",color:"#00673C"}}>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                  Suivi de mes Colis et Expéditions
                </h2>
                <p className={styles.billetPageSub}>{colisState.filter(c => c.type === "Colis" || c.type === "Carton").length} colis enregistré{colisState.filter(c => c.type === "Colis" || c.type === "Carton").length > 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className={styles.billetList}>
              {colisState.filter(c => c.type === "Colis" || c.type === "Carton").length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(0,0,0,0.4)", fontSize: "0.85rem", background: "rgba(0,0,0,0.02)", borderRadius: "12px", border: "1px dashed rgba(0,0,0,0.05)" }}>
                  Aucun colis enregistré pour le moment.
                </div>
              ) : (
                colisState.filter(c => c.type === "Colis" || c.type === "Carton").map((colis) => {
                  const isActive = colis.status === "À bord du bus" || colis.status === "En transit" || colis.status === "Scanné en gare";
                  const isDelivered = colis.status === "Livré";
                  const isPending = colis.status === "En attente de scan";
                  return (
                    <div key={colis.id} className={styles.billetCard}>
                      <div className={`${styles.billetStripe} ${isActive ? styles.billetStripeActive : isDelivered ? styles.colisStripeDelivered : isPending ? styles.colisStripePending : styles.billetStripeCompleted}`} />

                      <div className={styles.billetCardBody}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className={styles.colisTypeIcon}>
                            {colis.type === "Carton" ? (
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

                      <div className={styles.billetCardRight}>
                        <div className={styles.colisRef}>{colis.id}</div>
                        <span className={`${styles.billetStatus} ${isActive ? styles.billetStatusActive : isDelivered ? styles.colisStatusDelivered : styles.billetStatusCompleted}`}>
                          {isActive ? "En cours" : isDelivered ? "Livré" : "En attente"}
                        </span>
                        <button
                          className={styles.voirBilletBtn}
                          onClick={() => setSelectedColis(colis)}
                        >
                          Suivre le colis
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {clientActiveTab === "bagages" && (
          <div className={styles.tabContentFadeIn}>
            <div className={styles.billetPageHeader}>
              <div>
                <h2 className={styles.billetPageTitle} style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"18px",height:"18px",color:"#00673C"}}>
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  Suivi de mes Bagages de Voyage
                </h2>
                <p className={styles.billetPageSub}>{colisState.filter(c => c.type === "Valise" || c.type === "Sac" || c.type === "Sac à dos").length} bagage{colisState.filter(c => c.type === "Valise" || c.type === "Sac" || c.type === "Sac à dos").length > 1 ? "s" : ""} enregistré{colisState.filter(c => c.type === "Valise" || c.type === "Sac" || c.type === "Sac à dos").length > 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className={styles.billetList}>
              {colisState.filter(c => c.type === "Valise" || c.type === "Sac" || c.type === "Sac à dos").length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(0,0,0,0.4)", fontSize: "0.85rem", background: "rgba(0,0,0,0.02)", borderRadius: "12px", border: "1px dashed rgba(0,0,0,0.05)" }}>
                  Aucun bagage enregistré sur vos trajets en cours.
                </div>
              ) : (
                colisState.filter(c => c.type === "Valise" || c.type === "Sac" || c.type === "Sac à dos").map((colis) => {
                  const isActive = colis.status === "À bord du bus" || colis.status === "En transit" || colis.status === "Scanné en gare";
                  const isDelivered = colis.status === "Livré";
                  const isPending = colis.status === "En attente de scan";
                  return (
                    <div key={colis.id} className={styles.billetCard}>
                      <div className={`${styles.billetStripe} ${isActive ? styles.billetStripeActive : isDelivered ? styles.colisStripeDelivered : isPending ? styles.colisStripePending : styles.billetStripeCompleted}`} />

                      <div className={styles.billetCardBody}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className={styles.colisTypeIcon}>
                            {colis.type === "Valise" ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="1.8" style={{width:"20px",height:"20px"}}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                            ) : colis.type === "Sac" ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="1.8" style={{width:"20px",height:"20px"}}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
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
                })
              )}
            </div>
          </div>
        )}

            {selectedColis && (
              <div className={styles.billetModalOverlay} onClick={() => setSelectedColis(null)}>
                <div className={styles.billetModalWrapper} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
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
                        Télécharger PDF
                      </button>
                      <button className={styles.billetModalClose} onClick={() => setSelectedColis(null)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className={styles.digitalLuggage}>
                    <div className={styles.dlPunchHoleContainer}>
                      <div className={styles.dlPunchHole}></div>
                    </div>
                    
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

                    <div className={styles.dlMainBody}>
                      <div className={styles.dlDetailsGrid}>
                        <div className={styles.dlDetailItem}>
                          <span className={styles.dlDetailLabel}>Voyageur</span>
                          <span className={styles.dlDetailValue}>{profileFullName || email.split("@")[0] || "Voyageur SafeTrip"}</span>
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

                    <div className={styles.dlPerforated}>
                      <div className={styles.dlCircleLeft}></div>
                      <div className={styles.dlDots}></div>
                      <div className={styles.dlCircleRight}></div>
                    </div>

                    <div className={styles.dlFooter}>
                      <div className={styles.dlBarcodeContainer}>
                        <img
                          src={getLuggageQrUrl(selectedColis, 180)}
                          alt={`QR code du bagage ${selectedColis.id}`}
                          style={{
                            width: "96px",
                            height: "96px",
                            background: "#ffffff",
                            padding: "6px",
                            borderRadius: "10px",
                            border: "1px solid rgba(10,47,29,0.18)"
                          }}
                        />
                        <span className={styles.dlBarcodeText}>{selectedColis.qrRef}</span>
                        <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.65)", textAlign: "center", maxWidth: "190px", lineHeight: 1.3 }}>
                          Scanner ce QR code en cas de perte du bagage
                        </span>
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

                </div>
              </div>
            )}

        {clientActiveTab === "messageries" && (
          <div className={styles.tabContentFadeIn}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              background: "#ffffff",
              borderRadius: "20px",
              border: "1px solid #edf2f7",
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
              minHeight: "550px",
              maxHeight: "650px",
              overflow: "hidden"
            }}>
              {/* Left Side: Thread List & Email Search Combobox */}
              <div style={{
                borderRight: "1px solid #edf2f7",
                display: "flex",
                flexDirection: "column",
                background: "#fcfdfe",
                position: "relative"
              }}>
                <div style={{
                  padding: "16px",
                  borderBottom: "1px solid #edf2f7",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  color: "#0A2F1D",
                  background: "rgba(0,103,60,0.03)"
                }}>
                  Discussions SafeTrip
                </div>

                {/* Email Search Combobox */}
                <div style={{ padding: "12px", borderBottom: "1px solid #edf2f7", position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px 12px", position: "relative" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2.5" style={{ width: "14px", height: "14px" }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input 
                      type="text" 
                      placeholder="Contacter une agence..." 
                      value={emailSearchInput}
                      onChange={(e) => {
                        setEmailSearchInput(e.target.value);
                        setShowEmailSuggestions(true);
                      }}
                      onFocus={() => setShowEmailSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
                      style={{ border: "none", outline: "none", width: "100%", fontSize: "0.8rem", fontWeight: 700, color: "#1a202c" }}
                    />
                  </div>

                  {showEmailSuggestions && emailSearchInput.trim() && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: "12px",
                      right: "12px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                      zIndex: 1000,
                      maxHeight: "180px",
                      overflowY: "auto",
                      marginTop: "6px",
                      padding: "4px"
                    }}>
                      {AGENCIES_FOR_CHATS.filter(a => 
                        a.email.toLowerCase().includes(emailSearchInput.toLowerCase()) || 
                        a.name.toLowerCase().includes(emailSearchInput.toLowerCase())
                      ).length === 0 ? (
                        <div style={{ padding: "10px", fontSize: "0.75rem", color: "#a0aec0", fontStyle: "italic" }}>Aucune agence trouvée</div>
                      ) : (
                        AGENCIES_FOR_CHATS
                          .filter(a => 
                            a.email.toLowerCase().includes(emailSearchInput.toLowerCase()) || 
                            a.name.toLowerCase().includes(emailSearchInput.toLowerCase())
                          )
                          .map(agency => (
                            <div
                              key={agency.id}
                              onMouseDown={() => {
                                setActiveThreadId(agency.id);
                                setEmailSearchInput("");
                                setShowEmailSuggestions(false);
                                showToast(`Discussion ouverte avec ${agency.name}`);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 10px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,103,60,0.05)"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f7fafc", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #edf2f7", padding: "3px" }}>
                                <img src={agency.logo} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#1a202c" }}>{agency.name}</div>
                                <div style={{ fontSize: "0.62rem", color: "#718096", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agency.email}</div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>

                {/* Chat Threads list */}
                <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                  {AGENCIES_FOR_CHATS.map(contact => {
                    const isActive = activeThreadId === contact.id;
                    const threadMsgs = chatThreads[contact.id] || [];
                    const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1].text : "Commencez à discuter...";
                    const lastMsgTime = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1].time : "12:00";
                    return (
                      <div
                        key={contact.id}
                        onClick={() => setActiveThreadId(contact.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "12px",
                          cursor: "pointer",
                          marginBottom: "4px",
                          transition: "all 0.2s ease",
                          background: isActive ? "rgba(0,103,60,0.08)" : "transparent"
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = "rgba(0,103,60,0.03)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: isActive ? "2px solid #00673C" : "1px solid #edf2f7",
                          padding: "4px",
                          flexShrink: 0
                        }}>
                          <img src={contact.logo} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: 800, color: isActive ? "#0A2F1D" : "#1a202c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.name}</span>
                            <span style={{ fontSize: "0.6rem", color: "#a0aec0" }}>{lastMsgTime}</span>
                          </div>
                          <div style={{ fontSize: "0.7rem", color: isActive ? "#00673C" : "#718096", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px", fontWeight: isActive ? 600 : 500 }}>
                            {lastMsg}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Active Chat Window */}
              <div style={{ display: "flex", flexDirection: "column", background: "#ffffff" }}>
                {/* Active chat header */}
                <div style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #edf2f7",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(0,103,60,0.01)"
                }}>
                  <div>
                    <h3 style={{ fontSize: "0.92rem", fontWeight: 850, color: "#0A2F1D", margin: 0 }}>
                      {AGENCIES_FOR_CHATS.find(c => c.id === activeThreadId)?.name}
                    </h3>
                    <span style={{ fontSize: "0.68rem", color: "#2f855a", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <span style={{ width: "6px", height: "6px", background: "#48bb78", borderRadius: "50%" }}></span>
                      Service Client Connecté
                    </span>
                  </div>
                </div>

                {/* Messages pane */}
                <div style={{
                  flex: 1,
                  maxHeight: "390px",
                  overflowY: "auto",
                  padding: "20px",
                  background: "#fcfdfe",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  {(chatThreads[activeThreadId] || []).length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#a0aec0", padding: "40px", textAlign: "center" }}>
                      <div style={{ fontSize: "2rem", marginBottom: "10px" }}>✉</div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>Début de la conversation</div>
                      <div style={{ fontSize: "0.7rem", color: "#cbd5e0", marginTop: "4px" }}>Envoyez un message pour démarrer l'assistance en direct.</div>
                    </div>
                  ) : (
                    (chatThreads[activeThreadId] || []).map(msg => {
                      const isSent = msg.sender === "contact";
                      return (
                        <div
                          key={msg.id}
                          style={{
                            maxWidth: "70%",
                            alignSelf: isSent ? "flex-end" : "flex-start",
                            background: isSent ? "#00673C" : "#f1f5f9",
                            color: isSent ? "#ffffff" : "#1a202c",
                            padding: "10px 14px",
                            borderRadius: isSent ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                            position: "relative"
                          }}
                        >
                          <div style={{ fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.45 }}>{msg.text}</div>
                          <div style={{ 
                            fontSize: "0.6rem", 
                            color: isSent ? "rgba(255,255,255,0.7)" : "#a0aec0", 
                            textAlign: "right", 
                            marginTop: "4px", 
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "4px"
                          }}>
                            <span>{msg.time}</span>
                            {isSent && (
                              <span 
                                style={{ 
                                  color: msg.isRead ? "#fccd05" : "rgba(255,255,255,0.5)", 
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
                    })
                  )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendPassengerMessage} style={{
                  padding: "15px 20px",
                  borderTop: "1px solid #edf2f7",
                  display: "flex",
                  gap: "10px",
                  background: "#ffffff"
                }}>
                  <input
                    type="text"
                    placeholder="Écrivez votre message ici..."
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    style={{
                      flex: 1,
                      border: "1px solid #e2e8f0",
                      borderRadius: "999px",
                      padding: "10px 20px",
                      outline: "none",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#1a202c",
                      transition: "all 0.2s ease"
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#00673C"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                  />
                  <button
                    type="submit"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "#00673C",
                      color: "#ffffff",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.9rem",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    ➤
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {clientActiveTab === "profils" && (
          <div className={styles.tabContentFadeIn}>
            <div className={styles.profileHeaderCard}>
              <div className={styles.profileHeaderContent}>
                <div className={styles.profileAvatarSection}>
                  <div 
                    className={styles.profileAvatarWrapper}
                    onClick={() => profileEditing && profileFileInputRef.current?.click()}
                    style={{ cursor: profileEditing ? "pointer" : "default" }}
                  >
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Avatar" className={styles.profileAvatarImg} />
                    ) : (
                      <div className={styles.profileAvatarPlaceholder}>
                        {profileFullName ? profileFullName.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                    {profileEditing && (
                      <div className={styles.profileAvatarOverlay}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "20px", height: "20px" }}>
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={profileFileInputRef} 
                    style={{ display: "none" }} 
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                  />
                  <div>
                    <h3 className={styles.profileNameTitle}>{profileFullName || "Voyageur SafeTrip"}</h3>
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <span className={styles.profileBadge}>Client Certifié</span>
                      <span className={styles.profileSubText}>Membre depuis Mai 2026</span>
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  className={profileEditing ? styles.profileSaveBtn : styles.profileEditBtn}
                  onClick={() => profileEditing ? handleProfileSave() : setProfileEditing(true)}
                >
                  {profileEditing ? "Enregistrer" : "Modifier le profil"}
                </button>
              </div>
            </div>

            <div className={styles.profileDetailsGrid}>
              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h4 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "16px", height: "16px", color: "#00673C" }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Informations Personnelles
                  </h4>
                </div>
                <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>NOM COMPLET</label>
                    <input 
                      type="text" 
                      className={styles.loginInput} 
                      value={profileFullName}
                      onChange={(e) => setProfileFullName(e.target.value)}
                      disabled={!profileEditing}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>ADRESSE EMAIL</label>
                    <input 
                      type="email" 
                      className={styles.loginInput} 
                      value={email}
                      disabled
                      style={{ background: "#f7fafc", cursor: "not-allowed" }}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>NUMÉRO DE TÉLÉPHONE</label>
                    <input 
                      type="tel" 
                      className={styles.loginInput} 
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      disabled={!profileEditing}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.panelCard}>
                <div className={styles.panelHeader}>
                  <h4 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "16px", height: "16px", color: "#00673C" }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Adresse &amp; Localisation
                  </h4>
                </div>
                <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>VILLE</label>
                    <input 
                      type="text" 
                      className={styles.loginInput} 
                      value={profileCity}
                      placeholder="Ex: Douala"
                      onChange={(e) => setProfileCity(e.target.value)}
                      disabled={!profileEditing}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>ADRESSE COMPLÈTE</label>
                    <input 
                      type="text" 
                      className={styles.loginInput} 
                      value={profileAddress}
                      placeholder="Ex: Yassa, Douala"
                      onChange={(e) => setProfileAddress(e.target.value)}
                      disabled={!profileEditing}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
