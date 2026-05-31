"use client";

import styles from "./page.module.css";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/UserContext";

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
  qrToken?: string | null;
  ticketScanned?: boolean;
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
  senderName?: string | null;
  senderPhone?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
}


export default function ClientDashboard() {
interface Voucher {
  id?: number;
  code: string;
  percentage: number;
  max_uses: number;
  current_uses: number;
  status: "draft" | "published";
  assigned_to?: string | null;
  expires_at?: string | null;
  created_at?: string;
}
  const router = useRouter();
  const { user, loading: userLoading, logout: contextLogout, refresh: contextRefresh } = useUser();
  const [email, setEmail] = useState("");
  const [clientActiveTab, setClientActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Active Billets and Colis Database states
  const [billetsState, setBilletsState] = useState<Billet[]>([]);
  const [colisState, setColisState] = useState<Colis[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

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
  const [pointsPerTrip, setPointsPerTrip] = useState(20);
  const [freeTripThreshold, setFreeTripThreshold] = useState(1000);
  const [freeTripEligible, setFreeTripEligible] = useState(false);

  // Notifications (voyageur)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const lastUnreadRef = useRef(0);

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
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; msg: any | null }>({ visible: false, x: 0, y: 0, msg: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; msg: any | null }>({ open: false, msg: null });
  const [hiddenMessages, setHiddenMessages] = useState<Set<number>>(new Set());
  const [replyToMsg, setReplyToMsg] = useState<any | null>(null);

  const fetchMessagesForActiveThread = async (agencyIdStr: string) => {
    const apiBase = (typeof window !== 'undefined' && !window.location.hostname.includes('loca.lt') ? `http://${window.location.hostname}:5000` : (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.107:5000'));
    const passengerThreadId = email.split("@")[0] || "voyageur";

    const targetThreadId = agencyIdStr === "support" ? "support" : passengerThreadId;
    const targetAgencyId = agencyIdStr === "support" ? 1 : parseInt(agencyIdStr, 10) || 1;

    try {
      const res = await fetch(`${apiBase}/api/agency/messages/${targetThreadId}?agency_id=${targetAgencyId}`, { credentials: "include" });
      if (res.ok) {
        const rawMsgs = await res.json();
        const mapped = rawMsgs.map((m: any) => ({
          id: m.id,
          sender: m.sender as "agency" | "contact",
          text: m.text,
          time: m.time,
          isRead: m.is_read,
          reply_to_id: m.reply_to_id ?? null,
          reply_to_text: m.reply_to_text ?? null
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

  const fetchClientVouchers = async () => {
    const apiBase = (typeof window !== 'undefined' && !window.location.hostname.includes('loca.lt') ? `http://${window.location.hostname}:5000` : (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.107:5000'));
    try {
      const res = await fetch(`${apiBase}/api/client/vouchers`, { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setVouchers(Array.isArray(data) ? data : []);
      }
    } catch {
      setVouchers([]);
    }
  };

  const playChime = () => {
    try {
      const Ctor: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.connect(g); g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.26);
    } catch {}
  };

  const fetchNotifications = async () => {
    const apiBase = (typeof window !== 'undefined' && !window.location.hostname.includes('loca.lt') ? `http://${window.location.hostname}:5000` : (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.107:5000'));
    try {
      const res = await fetch(`${apiBase}/api/client/notifications`, { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const list = await res.json();
        setNotifications(list);
        const unread = (list || []).filter((n: any) => !n.read).length;
        setUnreadCount(unread);
        if (unread > lastUnreadRef.current) {
          playChime();
        }
        lastUnreadRef.current = unread;
      }
    } catch {}
  };

  const markAllNotificationsRead = async () => {
    const apiBase = (typeof window !== 'undefined' && !window.location.hostname.includes('loca.lt') ? `http://${window.location.hostname}:5000` : (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.107:5000'));
    try {
      const unread = (notifications || []).filter((n: any) => !n.read);
      await Promise.all(unread.map((n: any) => fetch(`${apiBase}/api/client/notifications/${n.id}/read`, { method: 'PUT', credentials: 'include' })));
      setNotifications((prev) => prev.map((n: any) => ({ ...n, read: true })));
      setUnreadCount(0);
      lastUnreadRef.current = 0;
    } catch {}
  };

  const handleToggleNotifications = async () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) {
      await markAllNotificationsRead();
    }
  };

  const handleRedeemPoints = async () => {
    if (loyaltyPoints < freeTripThreshold) return;
    const apiBase = (typeof window !== 'undefined' && !window.location.hostname.includes('loca.lt') ? `http://${window.location.hostname}:5000` : (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.107:5000'));
    try {
      const res = await fetch(`${apiBase}/api/client/loyalty/redeem`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const code = data?.voucher?.code;
        showToast(code ? `Bon généré: ${code}` : 'Points échangés avec succès !');
        setLoyaltyPoints(Math.max(0, loyaltyPoints - freeTripThreshold));
        setFreeTripEligible(false);
        try { await fetchClientVouchers(); } catch {}
      } else {
        const err = await res.json().catch(() => ({} as any));
        showToast(err?.error || "Échec de l'échange des points.", false);
      }
    } catch (e) {
      showToast("Impossible d'échanger les points.", false);
    }
  };

  const handleOpenContextMenu = (e: React.MouseEvent, msg: any) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, msg });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, msg: null });
  };

  const handleContextEdit = () => {
    if (!contextMenu.msg) return;
    handleStartEditMessage(contextMenu.msg);
    handleCloseContextMenu();
  };

  const handleContextReply = () => {
    if (!contextMenu.msg) return;
    setReplyToMsg(contextMenu.msg);
    // Optionally prefill input with a small quote arrow
    if (!chatInputText) setChatInputText(`↪ ${String(contextMenu.msg.text).slice(0, 40)} `);
    handleCloseContextMenu();
  };

  const handleContextDelete = () => {
    if (!contextMenu.msg) return;
    setDeleteDialog({ open: true, msg: contextMenu.msg });
    handleCloseContextMenu();
  };

  const handleDeleteForMe = () => {
    if (!deleteDialog.msg) return;
    setHiddenMessages(prev => new Set([...prev, deleteDialog.msg.id]));
    setDeleteDialog({ open: false, msg: null });
    showToast("Message supprimé pour vous ✔");
  };

  const handleDeleteForAll = async () => {
    if (!deleteDialog.msg) return;
    await handleDeleteMessage(deleteDialog.msg.id);
    setDeleteDialog({ open: false, msg: null });
  };

  const handleStartEditMessage = (msg: any) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.text || "");
  };

  const handleCancelEditMessage = () => {
    setEditingMsgId(null);
    setEditingText("");
  };

  const handleSaveEditMessage = async () => {
    if (editingMsgId == null) return;
    const apiBase = (typeof window !== 'undefined' && !window.location.hostname.includes('loca.lt') ? `http://${window.location.hostname}:5000` : (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.107:5000'));
    const passengerThreadId = email.split("@")[0] || "voyageur";
    const targetThreadId = activeThreadId === "support" ? "support" : passengerThreadId;
    const targetAgencyId = activeThreadId === "support" ? 1 : parseInt(activeThreadId, 10) || 1;
    try {
      const res = await fetch(`${apiBase}/api/agency/messages/${targetThreadId}/${editingMsgId}?agency_id=${targetAgencyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: editingText })
      });
      if (res.ok) {
        setChatThreads(prev => ({
          ...prev,
          [activeThreadId]: (prev[activeThreadId] || []).map((m: any) => m.id === editingMsgId ? { ...m, text: editingText } : m)
        }));
        showToast("Message modifié ✔");
        setEditingMsgId(null);
        setEditingText("");
      } else {
        showToast("Échec de la modification.", false);
      }
    } catch (err) {
      console.warn("⚠️ Impossible de modifier le message.", err);
      showToast("Erreur réseau lors de la modification.", false);
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    const apiBase = (typeof window !== 'undefined' && !window.location.hostname.includes('loca.lt') ? `http://${window.location.hostname}:5000` : (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.107:5000'));
    const passengerThreadId = email.split("@")[0] || "voyageur";
    const targetThreadId = activeThreadId === "support" ? "support" : passengerThreadId;
    const targetAgencyId = activeThreadId === "support" ? 1 : parseInt(activeThreadId, 10) || 1;
    try {
      const res = await fetch(`${apiBase}/api/agency/messages/${targetThreadId}/${msgId}?agency_id=${targetAgencyId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        setChatThreads(prev => ({
          ...prev,
          [activeThreadId]: (prev[activeThreadId] || []).filter((m: any) => m.id !== msgId)
        }));
        showToast("Message supprimé ✔");
      } else {
        showToast("Échec de la suppression.", false);
      }
    } catch (err) {
      console.warn("⚠️ Impossible de supprimer le message.", err);
      showToast("Erreur réseau lors de la suppression.", false);
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
      time: timeStr,
      reply_to_id: replyToMsg?.id || null,
      reply_to_text: replyToMsg?.text || null
    };

    setChatThreads(prev => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), newMsg]
    }));
    setChatInputText("");
    setReplyToMsg(null);

    const apiBase = (typeof window !== 'undefined' && !window.location.hostname.includes('loca.lt') ? `http://${window.location.hostname}:5000` : (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.107:5000'));
    try {
      await fetch(`${apiBase}/api/agency/messages/${targetThreadId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          sender: "contact",
          text: newMsg.text,
          time: timeStr,
          agency_id: targetAgencyId,
          reply_to_id: newMsg.reply_to_id,
          reply_to_text: newMsg.reply_to_text
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
      const apiBase = (typeof window !== 'undefined' && !window.location.hostname.includes('loca.lt') ? `http://${window.location.hostname}:5000` : (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.107:5000'));
      const passengerThreadId = email.split("@")[0] || "voyageur";
      const targetThreadId = activeThreadId === "support" ? "support" : passengerThreadId;
      const targetAgencyId = activeThreadId === "support" ? 1 : parseInt(activeThreadId, 10) || 1;
      
      try {
        await fetch(`${apiBase}/api/agency/messages/${targetThreadId}/read?agency_id=${targetAgencyId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ role: "contact" })
        });
      } catch (err) {
        console.warn("⚠️ Error marking messages as read:", err);
      }
    };
    
    markAsRead();
  }, [clientActiveTab, activeThreadId, email, chatThreads[activeThreadId]?.length]);

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && (!user || user.role !== "client")) {
      router.push("/login");
    }
  }, [user, userLoading]);

  // Set email when user is loaded
  useEffect(() => {
    if (user) {
      setEmail(user.email);
    }
  }, [user]);

  const fetchProfile = async () => {
    const apiBase = (typeof window !== 'undefined' && !window.location.hostname.includes('loca.lt') ? `http://${window.location.hostname}:5000` : (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.107:5000'));
    try {
      const res = await fetch(`${apiBase}/api/client/profile`, { credentials: "include", cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProfileFullName(data.full_name || (user ? user.fullName : ""));
        setProfilePhone(data.phone || "");
        setProfileAddress(data.address || "");
        setProfileCity(data.city || "");
        setProfilePhoto(data.photo || (user ? user.photo : null) || "/images/default_avatar.png");
        setLoyaltyPoints(data.loyalty_points || 0);
        setPointsPerTrip(data.points_per_trip || 20);
        setFreeTripThreshold(data.free_trip_threshold || 1000);
        setFreeTripEligible(Boolean(data.free_trip_eligible));
      }
    } catch (err) {
      console.warn("⚠️ Impossible de charger le profil depuis le backend.", err);
    }
  };

  // Load profile from API and hydrate data
  useEffect(() => {
    if (!user) return;

    const hydrateClientData = async () => {
      const apiBase = (typeof window !== 'undefined' && !window.location.hostname.includes('loca.lt') ? `http://${window.location.hostname}:5000` : (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.107:5000'));
      
      // 1. Fetch billets from API
      try {
        const billetsRes = await fetch(`${apiBase}/api/client/billets?client_id=${user.id}`, { credentials: "include" });
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
        const colisRes = await fetch(`${apiBase}/api/client/colis?client_id=${user.id}`, { credentials: "include" });
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

    fetchProfile();
    hydrateClientData();
    fetchNotifications();
    fetchClientVouchers();

    const iv = setInterval(fetchNotifications, 25000);
    return () => clearInterval(iv);
  }, [user]);

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

  const resolveContactValue = (value?: string | null, fallback = "Non renseigné") => {
    if (!value) return fallback;
    const trimmed = `${value}`.trim();
    return trimmed.length ? trimmed : fallback;
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
    const senderName = resolveContactValue(colis.senderName, profileFullName || email.split("@")[0] || "Voyageur SafeTrip");
    const senderPhone = resolveContactValue(colis.senderPhone, profilePhone || "");
    const recipientName = resolveContactValue(colis.recipientName, "Destinataire non renseigné");
    const recipientPhone = resolveContactValue(colis.recipientPhone, "Téléphone indisponible");

    return [
      `SAFETRIP - ÉTIQUETTE BAGAGE/COLIS`,
      `Réf: ${colis.id}`,
      `Agence: ${colis.agency}`,
      `-------------------------`,
      `EXPÉDITEUR:`,
      `Nom: ${senderName}`,
      `Tél: ${senderPhone}`,
      `-------------------------`,
      `DESTINATAIRE:`,
      `Nom: ${recipientName}`,
      `Tél: ${recipientPhone}`
    ].join('\n');
  };

  const getLuggageQrUrl = (colis: Colis, size = 180) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(getLuggageQrPayload(colis))}`;
  };

  const getBilletQrPayload = (billet: Billet) => {
    if (billet.qrToken) return `STP|v1|${billet.qrToken}`;
    return [
      `BILLET DE VOYAGE SAFETRIP`,
      `Réf: ${billet.id}`,
      `Compagnie: ${billet.company}`,
      `-------------------------`,
      `PASSAGER: ${billet.passenger}`,
      `Tél: ${billet.phone}`,
      `-------------------------`,
      `TRAJET: ${billet.from} → ${billet.to}`,
      `Départ: ${billet.date} à ${billet.depTime}`,
      `Siège: ${billet.seat} (${billet.busClass})`,
      `Bagages: ${billet.luggageCount} pièce(s)`
    ].join('\n');
  };

  const getBilletQrUrl = (billet: Billet, size = 180) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(getBilletQrPayload(billet))}`;
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
      const senderName = resolveContactValue(colis.senderName, profileFullName || email.split("@")[0] || "Voyageur SafeTrip");
      const senderPhone = resolveContactValue(colis.senderPhone, profilePhone || "Non renseigné");
      const recipientName = resolveContactValue(colis.recipientName, "Destinataire non renseigné");
      const recipientPhone = resolveContactValue(colis.recipientPhone, "Téléphone indisponible");

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
                <td style="padding: 7px 0; color: #64748B; width: 50%; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">EXPÉDITEUR</td>
                <td style="padding: 7px 0; font-weight: 800; color: #0F172A; text-align: right;">${senderName}</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #64748B; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">CONTACT EXPÉD.</td>
                <td style="padding: 7px 0; font-weight: 800; color: #0F172A; text-align: right;">${senderPhone}</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #64748B; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">DESTINATAIRE</td>
                <td style="padding: 7px 0; font-weight: 800; color: #0F172A; text-align: right;">${recipientName}</td>
              </tr>
              <tr>
                <td style="padding: 7px 0; color: #64748B; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">CONTACT DEST.</td>
                <td style="padding: 7px 0; font-weight: 800; color: #0F172A; text-align: right;">${recipientPhone}</td>
              </tr>
            </table>
            </div>
          </div>
          <div style="border-bottom: 2px dashed #CBD5E0; margin: 12px 22px;"></div>
          <div style="padding: 8px 22px 24px 22px; display: flex; flex-direction: column; align-items: center; gap: 9px;">
            <div style="font-size: 8px; color: #64748B; text-transform: uppercase; letter-spacing: 1.3px; font-weight: 900;">Scan perte / restitution</div>
            <div style="background: #ffffff; border: 3px solid #0A2F1D; border-radius: 18px; padding: 13px; box-shadow: 0 10px 22px rgba(10,47,29,0.12);">
              <img src="${qrUrl}" alt="QR Code bagage SafeTrip" style="width: 164px; height: 164px; display: block;" />
            </div>
            <div style="font-size: 9px; color: #64748B; max-width: 280px; line-height: 1.45; background: #F8FBF9; border-radius: 999px; padding: 7px 12px;">
              À scanner en cas de perte pour retrouver l'identité du voyageur.
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

  const handleProfileSave = async () => {
    const apiBase = (typeof window !== 'undefined' && !window.location.hostname.includes('loca.lt') ? `http://${window.location.hostname}:5000` : (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.107:5000'));
    try {
      const res = await fetch(`${apiBase}/api/client/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profileFullName,
          phone: profilePhone,
          address: profileAddress,
          city: profileCity,
          photo: profilePhoto
        }),
        credentials: "include"
      });
      if (res.ok) {
        await contextRefresh();
        setProfileEditing(false);
        showToast("Profil mis à jour avec succès ! ✅");
      } else {
        showToast("Erreur lors de la mise à jour du profil.", false);
      }
    } catch (err) {
      showToast("Impossible de sauvegarder le profil.", false);
    }
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

  const handleProfileCancelEdit = async () => {
    await fetchProfile();
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
  const pointsUntilFreeTrip = Math.max(0, freeTripThreshold - loyaltyPoints);
  const loyaltyProgressPct = Math.min(100, Math.round((loyaltyPoints / Math.max(1, freeTripThreshold)) * 100));
  const loyaltyStatus = freeTripEligible ? "Voyage gratuit disponible" : `+${pointsPerTrip} pts / voyage`;
  const loyaltySubtext = freeTripEligible
    ? "Réclamez votre trajet offert !"
    : `${pointsUntilFreeTrip} pts avant le voyage gratuit (${freeTripThreshold} pts)`;

  // Bagages et colis (distinguer valises/sacs des colis expédiés)
  const BAGGAGE_TYPES = ["Valise", "Sac", "Sac à dos"];
  const PARCEL_TYPES = ["Colis", "Carton"];

  const baggageList = colisState.filter(c => BAGGAGE_TYPES.includes(c.type));
  const parcelList = colisState.filter(c => PARCEL_TYPES.includes(c.type));

  const baggagesTransit = baggageList.filter(c => c.status !== "Livré" && c.status !== "En attente de scan").length;
  const parcelsTransit = parcelList.filter(c => c.status !== "Livré" && c.status !== "En attente de scan").length;

  const baggageSubtext = baggageList.length > 0 ? `${baggagesTransit} bagage(s) en transit` : "Aucun bagage enregistré";
  const parcelSummary = parcelList.length > 0 ? `${parcelList.length} colis suivi${parcelList.length > 1 ? "s" : ""}${parcelsTransit > 0 ? ` · ${parcelsTransit} en transit` : ""}` : "Aucun colis expédié";

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
            className={`${styles.sidebarNavItem} ${clientActiveTab === "bons" ? styles.sidebarNavItemActive : ""}`}
            onClick={() => setClientActiveTab("bons")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.sidebarNavIcon}>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M7 5v14M17 5v14" />
              <path d="M9 12h6" />
            </svg>
            Mes bons
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
                <div className={styles.agencyLogoCircle} style={{ background: "#ffffff", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt="Profil" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="2.5" style={{ width: "26px", height: "26px" }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>
                <div className={styles.agencyText}>
                  <h1 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Mon Espace Voyageur</h1>
                  <span className={styles.agencyBadge}>Voyageur Certifié</span>
                </div>
              </div>
              <div className={styles.bannerControls}>
                <button
                  type="button"
                  onClick={async () => { await fetchNotifications(); await handleToggleNotifications(); }}
                  style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 9999, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.15)', color: '#fff', marginRight: 10 }}
                  title="Notifications"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: 18, height: 18 }}>
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 5-3 7h18c0-2-3 0-3-7" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', borderRadius: 9999, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div style={{ position: 'absolute', right: 24, top: '100%', marginTop: 8, width: 340, maxWidth: '92vw', background: '#fff', color: '#0f172a', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 14px 40px rgba(0,0,0,0.18)', overflow: 'hidden', zIndex: 50 }}>
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Notifications</span>
                      <button onClick={() => setShowNotifications(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>×</button>
                    </div>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {(notifications || []).slice(0, 20).map((n: any) => (
                        <div key={n.id} style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', background: n.read ? '#fff' : '#f8fafc' }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{n.title || n.type}</div>
                          {n.body && <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>{n.body}</div>}
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{new Date(n.created_at).toLocaleString('fr-FR')}</div>
                        </div>
                      ))}
                      {(!notifications || notifications.length === 0) && (
                        <div style={{ padding: '16px 12px', color: '#64748b', fontSize: 12 }}>Aucune notification.</div>
                      )}
                    </div>
                  </div>
                )}
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
                    {" · "}
                    {loyaltySubtext}
                  </span>
                  <div style={{ width: "100%", height: "4px", background: "rgba(200,148,30,0.15)", borderRadius: "4px", marginTop: "6px" }}>
                    <div style={{ width: `${loyaltyProgressPct}%`, height: "100%", background: freeTripEligible ? "#0F9D58" : "var(--accent-gold, #C8941E)", borderRadius: "4px", transition: "width 0.6s ease" }} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={handleRedeemPoints}
                      disabled={loyaltyPoints < freeTripThreshold}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        background: loyaltyPoints >= freeTripThreshold ? '#0F9D58' : '#f1f5f9',
                        color: loyaltyPoints >= freeTripThreshold ? '#fff' : '#64748b',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: loyaltyPoints >= freeTripThreshold ? 'pointer' : 'not-allowed'
                      }}
                      title={loyaltyPoints >= freeTripThreshold ? 'Échanger mes points contre un bon' : `Atteignez ${freeTripThreshold} pts pour échanger`}
                    >
                      Échanger mes points
                    </button>
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
                  <span className={styles.statValue}>{baggageList.length} bagage{baggageList.length !== 1 ? "s" : ""}</span>
                  <span className={styles.statTrend} style={{ color: "#3182ce" }}>
                    {baggageSubtext}
                    {" · "}
                    {parcelSummary}
                  </span>
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
                    {(() => {
                      const depCity = (selectedBillet.depStation || selectedBillet.from).split(' - ')[0]?.trim() || selectedBillet.from;
                      const arrCity = (selectedBillet.arrStation || selectedBillet.to).split(' - ')[0]?.trim() || selectedBillet.to;
                      const depCode = depCity.substring(0,3).toUpperCase();
                      const arrCode = arrCity.substring(0,3).toUpperCase();
                      const qrUrl = getBilletQrUrl(selectedBillet, 150);
                      return (
                        <div style={{width:"794px", maxWidth:"100%", background:"#ffffff", border:"2px solid rgba(230, 225, 214, 0.8)", borderRadius:24, overflow:"hidden", display:"flex", flexDirection:"row", fontFamily:"Arial, sans-serif", boxShadow:"0 15px 30px rgba(0,0,0,0.04)"}}>
                          <div style={{width:"580px", display:"flex", flexDirection:"column", borderRight:"2px dashed rgba(230, 225, 214, 0.8)", padding:"24px 32px", boxSizing:"border-box", justifyContent:"space-between"}}>
                            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                              <div style={{display:"flex", alignItems:"center", gap:12}}>
                                <img src="/images/logo-removebg-preview (2).png" style={{height:36, objectFit:"contain"}} alt="SafeTrip" />
                                <div>
                                  <div style={{color:"#0B6B41", fontWeight:900, fontSize:18, letterSpacing:-0.5, lineHeight:1.1}}>SafeTrip</div>
                                  <div style={{color:"#718096", fontSize:9, textTransform:"uppercase", letterSpacing:"0.8px", fontWeight:700}}>Billet Officiel de Voyage</div>
                                </div>
                              </div>
                              <div style={{display:"flex", alignItems:"center"}}>
                                <img src={selectedBillet.companyLogo} style={{height:38, objectFit:"contain", background:"#fff", borderRadius:8, padding:"4px 10px", border:"1px solid #e2e8f0"}} alt={selectedBillet.company} />
                              </div>
                            </div>

                            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", margin:"20px 0"}}>
                              <div>
                                <div style={{fontSize:9, color:"#a0aec0", textTransform:"uppercase", letterSpacing:"1px", fontWeight:700}}>Départ</div>
                                <div style={{fontSize:28, fontWeight:900, color:"#071A0E", lineHeight:1}}>{depCity}</div>
                              </div>
                              <div style={{textAlign:"center", flex:1, padding:"0 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:4}}>
                                <div style={{fontSize:11, fontWeight:800, color:"#0B6B41"}}>{selectedBillet.company}</div>
                                <div style={{width:"100%", height:2, background:"#00c070", position:"relative"}}>
                                  <div style={{width:8, height:8, borderRadius:"50%", background:"#0B6B41", position:"absolute", top:-3, left:"calc(50% - 4px)"}}></div>
                                </div>
                                <div style={{fontSize:9, color:"#718096", fontWeight:700, background:"#f7fafc", padding:"2px 8px", borderRadius:10, border:"1px solid #edf2f7"}}>{selectedBillet.duration}</div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div style={{fontSize:9, color:"#a0aec0", textTransform:"uppercase", letterSpacing:"1px", fontWeight:700}}>Arrivée</div>
                                <div style={{fontSize:28, fontWeight:900, color:"#071A0E", lineHeight:1}}>{arrCity}</div>
                              </div>
                            </div>

                            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:15, marginBottom:10}}>
                              <div style={{background:"#f7fffa", border:"1px solid rgba(11,107,65,0.06)", borderRadius:12, padding:"10px 14px"}}>
                                <div style={{fontSize:8, color:"#718096", textTransform:"uppercase", letterSpacing:"0.8px", fontWeight:800}}>Passager</div>
                                <div style={{fontSize:14, fontWeight:800, color:"#071A0E", marginTop:2}}>{selectedBillet.passenger.toUpperCase()}</div>
                                <div style={{fontSize:9, color:"#718096", marginTop:1}}>{selectedBillet.phone}</div>
                              </div>
                              <div style={{background:"#f7fffa", border:"1px solid rgba(11,107,65,0.06)", borderRadius:12, padding:"10px 14px"}}>
                                <div style={{fontSize:8, color:"#718096", textTransform:"uppercase", letterSpacing:"0.8px", fontWeight:800}}>Date & Heure</div>
                                <div style={{fontSize:13, fontWeight:800, color:"#071A0E", marginTop:2}}>{selectedBillet.date}</div>
                                <div style={{fontSize:10, color:"#0B6B41", fontWeight:700, marginTop:1}}>{selectedBillet.depTime} → {selectedBillet.arrTime}</div>
                              </div>
                            </div>

                            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", background:"#fafafa", padding:"10px 18px", borderRadius:10}}>
                              <div style={{fontSize:9, color:"#718096", fontWeight:700}}>Siège: <strong style={{color:"#0B6B41", fontSize:11}}>{selectedBillet.seat}</strong></div>
                              <div style={{fontSize:9, color:"#718096", fontWeight:700}}>Classe: <strong style={{color:"#071A0E", fontSize:11}}>{selectedBillet.busClass}</strong></div>
                              <div style={{fontSize:9, color:"#718096", fontWeight:700}}>Tarif: <strong style={{color:"#c49000", fontSize:11}}>{selectedBillet.price.toLocaleString("fr-CM")} FCFA</strong></div>
                            </div>
                          </div>
                          <div style={{width:214, background:"#f7fafc", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px", boxSizing:"border-box", textAlign:"center", position:"relative"}}>
                            <div style={{position:"absolute", top:-12, left:-12, width:24, height:24, background:"#EDE9DF", borderRadius:"50%", border:"1px solid rgba(230, 225, 214, 0.8)"}}></div>
                            <div style={{position:"absolute", bottom:-12, left:-12, width:24, height:24, background:"#EDE9DF", borderRadius:"50%", border:"1px solid rgba(230, 225, 214, 0.8)"}}></div>
                            <div style={{fontSize:9, fontWeight:800, color:"#718096", textTransform:"uppercase", letterSpacing:1, marginBottom:8}}>Billet Unique</div>
                            <div style={{background:"#ffffff", border:"2px solid rgba(11, 107, 65, 0.15)", borderRadius:16, padding:8, boxShadow:"0 8px 20px rgba(0,0,0,0.03)", marginBottom:12}}>
                              <img src={qrUrl} alt={`QR ${selectedBillet.id}`} style={{width:115, height:115, display:"block"}} />
                            </div>
                            <div style={{fontFamily:"monospace", fontSize:11, fontWeight:800, color:"#0B6B41", letterSpacing:0.5, marginBottom:4}}>{selectedBillet.id}</div>
                            <div style={{fontSize:9, fontWeight:700, color:"#2d3748", maxWidth:180, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{selectedBillet.passenger.toUpperCase()}</div>
                            <div style={{fontSize:8, color:"#a0aec0", marginTop:10}}>Scannez pour valider l'accès 🇨🇲</div>
                            {selectedBillet.ticketScanned && (
                              <div style={{marginTop:10, fontSize:10, color:"#b91c1c", fontWeight:800}}>Déjà scanné</div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {clientActiveTab === "bons" && (
          <div className={styles.tabContentFadeIn}>
            <div className={styles.billetPageHeader}>
              <div>
                <h2 className={styles.billetPageTitle} style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"18px",height:"18px",color:"#00673C"}}>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M7 5v14M17 5v14" />
                    <path d="M9 12h6" />
                  </svg>
                  Mes bons de réduction
                </h2>
                <p className={styles.billetPageSub}>{vouchers.length} bon{vouchers.length > 1 ? 's' : ''} disponible{vouchers.length > 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className={styles.billetList}>
              {vouchers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(0,0,0,0.4)", fontSize: "0.85rem", background: "rgba(0,0,0,0.02)", borderRadius: "12px", border: "1px dashed rgba(0,0,0,0.05)" }}>
                  Aucun bon disponible pour le moment.
                </div>
              ) : (
                vouchers.map(v => (
                  <div key={v.id || v.code} className={styles.billetCard}>
                    <div className={`${styles.billetStripe} ${v.status === 'published' ? styles.billetStripeActive : styles.billetStripeCompleted}`} />

                    <div className={styles.billetCardBody}>
                      <div className={styles.billetRoute} style={{alignItems:'center'}}>
                        <div className={styles.billetCity} style={{fontFamily:'monospace'}}>{v.code}</div>
                        <div className={styles.billetArrow}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.billetArrowIcon}>
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                          <span className={styles.billetDuration}>{v.percentage}%</span>
                        </div>
                        <div className={styles.billetCity}>{v.status === 'published' ? 'Actif' : 'Brouillon'}</div>
                      </div>

                      <div className={styles.billetMeta}>
                        <span className={styles.billetMetaItem}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"13px",height:"13px"}}>
                            <rect x="2" y="7" width="20" height="14" rx="2"/>
                          </svg>
                          {v.current_uses}/{v.max_uses} utilisation{(v.max_uses || 0) > 1 ? 's' : ''}
                        </span>
                        <span className={styles.billetMetaItem}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"13px",height:"13px"}}>
                            <path d="M3 12h18M12 3v18"/>
                          </svg>
                          Expire: {v.expires_at ? new Date(v.expires_at).toLocaleDateString('fr-FR') : '—'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.billetCardRight}>
                      <button
                        className={styles.voirBilletBtn}
                        onClick={async () => { try { await navigator.clipboard.writeText(v.code); showToast('Code copié ! ✅'); } catch { showToast('Impossible de copier', false); } }}
                      >
                        Copier le code
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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
                          {isActive ? "En cours" : "Livré"}
                        </span>
                        <button
                          className={styles.voirBilletBtn}
                          onClick={() => setSelectedColis(colis)}
                        >
                          Voir mon ticket
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
                          {isActive ? "En cours" : "Livré"}
                        </span>
                        <button
                          className={styles.voirBilletBtn}
                          onClick={() => setSelectedColis(colis)}
                        >
                          Voir mon ticket
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

                     <div className={styles.dlMainBody}>
                      <div className={styles.dlDetailsGrid}>
                        <div className={styles.dlDetailItem}>
                          <span className={styles.dlDetailLabel}>Expéditeur</span>
                          <span className={styles.dlDetailValue}>{resolveContactValue(selectedColis.senderName, profileFullName || email.split("@")[0] || "Voyageur SafeTrip")}</span>
                          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#ffffff", marginTop: "2px", display: "block" }}>
                            {resolveContactValue(selectedColis.senderPhone, profilePhone || "Téléphone indisponible")}
                          </span>
                        </div>
                        <div className={styles.dlDetailItem}>
                          <span className={styles.dlDetailLabel}>Destinataire</span>
                          <span className={styles.dlDetailValue}>{resolveContactValue(selectedColis.recipientName, "Destinataire non renseigné")}</span>
                          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#ffffff", marginTop: "2px", display: "block", textAlign: "right" }}>
                            {resolveContactValue(selectedColis.recipientPhone, "Téléphone indisponible")}
                          </span>
                        </div>
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
                        {selectedColis.status !== "En attente de scan" && (
                          <span className={
                            selectedColis.status === "Livré" ? styles.dlStatusLabelBadgeDelivered :
                            styles.dlStatusLabelBadge
                          }>
                            {selectedColis.status}
                          </span>
                        )}
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
                    (chatThreads[activeThreadId] || []).filter(m => !hiddenMessages.has(m.id)).map(msg => {
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
                            position: "relative",
                            cursor: "context-menu"
                          }}
                          onContextMenu={(e) => handleOpenContextMenu(e, msg)}
                        >
                          {editingMsgId === msg.id ? (
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <input
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                style={{ flex: 1, fontSize: "0.8rem", padding: "6px 8px", borderRadius: 8, border: "1px solid #e2e8f0", color: "#1a202c" }}
                              />
                              <button onClick={handleSaveEditMessage} style={{ background: "#22c55e", color: "#fff", border: 0, borderRadius: 8, padding: "6px 10px", fontSize: "0.75rem", fontWeight: 800 }}>Sauver</button>
                              <button onClick={handleCancelEditMessage} style={{ background: "#ef4444", color: "#fff", border: 0, borderRadius: 8, padding: "6px 10px", fontSize: "0.75rem", fontWeight: 800 }}>Annuler</button>
                            </div>
                          ) : (
                            <div>
                              {msg.reply_to_id && (
                                <div style={{ fontSize: "0.68rem", background: isSent ? "rgba(255,255,255,0.15)" : "#e2e8f0", color: isSent ? "#f1f5f9" : "#4a5568", borderLeft: `3px solid ${isSent ? '#FCD116' : '#00673C'}`, padding: "6px 8px", borderRadius: 6, marginBottom: 6 }}>
                                  <span style={{ fontWeight: 800, marginRight: 6 }}>Réponse à</span>
                                  <span style={{ opacity: 0.9 }}>{(msg.reply_to_text || (chatThreads[activeThreadId] || []).find((m:any)=>m.id===msg.reply_to_id)?.text || 'Message inconnu').slice(0, 120)}</span>
                                </div>
                              )}
                              <div style={{ fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.45 }}>{msg.text}</div>
                            </div>
                          )}
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

                {/* Context Menu for messages */}
                {contextMenu.visible && contextMenu.msg && (
                  <div
                    onMouseLeave={handleCloseContextMenu}
                    style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 10px 22px rgba(0,0,0,0.12)", zIndex: 9999, minWidth: 180 }}
                  >
                    {contextMenu.msg.sender === "contact" ? (
                      <div>
                        <button onClick={handleContextEdit} style={{ width: "100%", padding: "10px 12px", textAlign: "left", background: "transparent", border: 0, cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>Modifier</button>
                        <button onClick={handleContextDelete} style={{ width: "100%", padding: "10px 12px", textAlign: "left", background: "transparent", border: 0, cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, color: "#c53030" }}>Supprimer…</button>
                      </div>
                    ) : (
                      <div>
                        <button onClick={handleContextReply} style={{ width: "100%", padding: "10px 12px", textAlign: "left", background: "transparent", border: 0, cursor: "pointer", fontSize: "0.8rem", fontWeight: 800 }}>Répondre</button>
                        <button onClick={handleContextDelete} style={{ width: "100%", padding: "10px 12px", textAlign: "left", background: "transparent", border: 0, cursor: "pointer", fontSize: "0.8rem", fontWeight: 800, color: "#c53030" }}>Supprimer…</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Reply banner */}
                {replyToMsg && (
                  <div style={{ padding: "6px 20px", borderTop: "1px solid #edf2f7", background: "#f8fafc", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#4a5568" }}>Réponse à:</span>
                    <span style={{ fontSize: "0.72rem", color: "#718096", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(replyToMsg.text).slice(0, 90)}</span>
                    <button onClick={() => setReplyToMsg(null)} style={{ marginLeft: "auto", background: "transparent", border: 0, cursor: "pointer", color: "#a0aec0", fontWeight: 900 }}>×</button>
                  </div>
                )}

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

                {/* Delete dialog */}
                {deleteDialog.open && (
                  <div className={styles.billetModalOverlay} onClick={() => setDeleteDialog({ open: false, msg: null })}>
                    <div className={styles.billetModalWrapper} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "360px" }}>
                      <div className={styles.billetModalTopBar}>
                        <span className={styles.billetModalTopLabel}>Supprimer le message</span>
                      </div>
                      <div className={styles.billetModalBody} style={{ padding: 18 }}>
                        <p style={{ fontSize: "0.9rem", color: "#4a5568", marginBottom: 14 }}>Choisissez l'action de suppression.</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <button className={styles.downloadPdfBtn} onClick={handleDeleteForMe}>Supprimer pour moi</button>
                          <button className={styles.deleteBtn || styles.downloadPdfBtn} onClick={handleDeleteForAll} style={{ background: "#ef4444" }}>Supprimer pour nous</button>
                          <button className={styles.voirBilletBtn} onClick={() => setDeleteDialog({ open: false, msg: null })}>Annuler</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
