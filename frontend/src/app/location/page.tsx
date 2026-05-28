"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { openSmartsuppWithMessage } from "@/components/SmartsuppChat";
import { Icon, AMENITY_ICONS, USAGE_ICONS, BUS_TYPE_ICONS } from "@/components/Icons";
import type { IconName } from "@/components/Icons";

/* ─────────────────────────────── TYPES ─────────────────────────────── */
interface Bus {
  id: number;
  name: string;
  type: "minibus" | "classique" | "confort" | "vip" | "grande";
  capacity: number;
  agency: string;
  agencyLogo: string;
  pricePerDay: number;
  pricePerJourney?: number;
  pricePerWeek?: number;
  amenities: string[];
  usage: string[];
  zones: string[];
  description: string;
  rating: number;
  reviews: number;
  withDriverDefault: boolean;
  badge?: string;
  accentColor: string;
}

interface BookingForm {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  departCity: string;
  destination: string;
  startDate: string;
  endDate: string;
  passengers: string;
  durationType: string;
  withDriver: boolean;
  extras: string[];
  message: string;
}

/* ─────────────────────────────── CONSTANTS ─────────────────────────────── */
const AMENITIES_META: Record<string, { label: string }> = {
  ac:        { label: "Climatisation" },
  wifi:      { label: "Wi-Fi à bord" },
  toilet:    { label: "Toilettes" },
  tv:        { label: "Écran TV / DVD" },
  usb:       { label: "Prises USB / 220V" },
  mini_bar:  { label: "Mini-bar" },
  leather:   { label: "Sièges en cuir" },
  gps:       { label: "GPS / Suivi en direct" },
  sono:      { label: "Sonorisation / Micro" },
  reclining: { label: "Sièges inclinables" },
  luggage:   { label: "Grand coffre bagages" },
  guide:     { label: "Guide touristique" },
  catering:  { label: "Service traiteur" },
  deco:      { label: "Décoration mariage" },
};

const BUS_TYPES = [
  { key: "tous",      label: "Tous",              cap: "" },
  { key: "minibus",   label: "Minibus",           cap: "8–14 places" },
  { key: "confort",   label: "Confort",           cap: "22–35 places" },
  { key: "classique", label: "Classique",         cap: "30–45 places" },
  { key: "vip",       label: "VIP / Executive",   cap: "10–20 places" },
  { key: "grande",    label: "Grande Capacité",   cap: "55–90 places" },
];

const USAGE_TYPES = [
  { key: "tous",        label: "Tout usage" },
  { key: "mariage",     label: "Mariage / Cérémonie" },
  { key: "excursion",   label: "Excursion / Tourisme" },
  { key: "corporate",   label: "Corporate / Entreprise" },
  { key: "scolaire",    label: "Scolaire / Université" },
  { key: "pelerinage",  label: "Pèlerinage" },
  { key: "humanitaire", label: "Humanitaire / ONG" },
];

const CITIES = [
  "Toutes les villes",
  "Douala", "Yaoundé", "Bafoussam", "Bamenda",
  "Kribi", "Limbé", "Buéa", "Garoua", "Ngaoundéré",
  "Maroua", "Edéa", "Dschang", "Nkongsamba",
];

const EMPTY_FORM: BookingForm = {
  clientName: "", clientPhone: "", clientEmail: "",
  departCity: "", destination: "", startDate: "", endDate: "",
  passengers: "", durationType: "jour", withDriver: true,
  extras: [], message: "",
};

const mapBusesFromDb = (dbBuses: any[]): Bus[] => {
  const classToType = (bc: string): "minibus" | "classique" | "confort" | "vip" | "grande" => {
    const c = (bc || "").toLowerCase();
    if (c.includes("vip") || c.includes("executive")) return "vip";
    if (c.includes("confort")) return "confort";
    if (c.includes("classique")) return "classique";
    return "minibus";
  };

  const getPricePerDay = (bc: string) => {
    const c = (bc || "").toLowerCase();
    if (c.includes("executive")) return 120000;
    if (c.includes("vip")) return 100000;
    if (c.includes("confort")) return 75000;
    return 35000;
  };

  return dbBuses.map((b: any, idx: number) => {
    const typeVal = classToType(b.bus_class);
    const priceVal = getPricePerDay(b.bus_class);
    return {
      id: b.id,
      name: `${b.bus_class} (${b.plaque})`,
      type: typeVal,
      capacity: b.capacity || 30,
      agency: b.agency_id === 1 ? "Finexs Voyage" : b.agency_id === 2 ? "Buca Voyage" : b.agency_id === 3 ? "General Express" : b.agency_id === 4 ? "Touristique Express" : "Men Travel",
      agencyLogo: b.agency_id === 1 ? "/images/finexs.png" : b.agency_id === 2 ? "/images/bucavoyage.png" : b.agency_id === 3 ? "/images/General.png" : b.agency_id === 4 ? "/images/Touristique.png" : "/images/mentravel.png",
      pricePerDay: priceVal,
      pricePerJourney: Math.round(priceVal * 0.65),
      pricePerWeek: priceVal * 6,
      amenities: b.amenities || [],
      usage: ["corporate", "mariage", "excursion"],
      zones: ["Douala", "Yaoundé", "Kribi", "Limbé"],
      description: `Bus de classe ${b.bus_class} opéré par notre agence partenaire, équipé pour des trajets interurbains et urbains confortables. Plaque: ${b.plaque}.`,
      rating: 4.5 + (idx % 5) * 0.1,
      reviews: 30 + idx * 5,
      withDriverDefault: b.has_ac,
      badge: b.status === "Disponible" ? "Disponible" : undefined,
      accentColor: b.bus_class === "VIP" ? "#C8941E" : "#00673C"
    };
  });
};

/* ─────────────────────────────── HELPERS ─────────────────────────────── */
const fmtPrice = (p: number) =>
  p.toLocaleString("fr-CM") + " FCFA";

const StarRating = ({ rating }: { rating: number }) => (
  <span style={{ color: "#F59E0B", fontSize: "0.78rem", letterSpacing: 1 }}>
    {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
  </span>
);

/* ─────────────────────────────── COMPONENT ─────────────────────────────── */
export default function LocationPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [activeType, setActiveType] = useState("tous");
  const [activeUsage, setActiveUsage] = useState("tous");
  const [activeCity, setActiveCity] = useState("Toutes les villes");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minCapacity, setMinCapacity] = useState(0);
  const [pricingMode, setPricingMode] = useState<"jour" | "trajet" | "semaine">("jour");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const ok = localStorage.getItem("safetrip_logged_in") === "true";
    setIsLoggedIn(ok);
    setUserRole(localStorage.getItem("safetrip_user_role"));
    if (ok) {
      setForm(f => ({
        ...f,
        clientName: localStorage.getItem("safetrip_user_name") || "",
        clientEmail: localStorage.getItem("safetrip_user_email") || "",
      }));
    }

    const fetchBuses = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      try {
        const res = await fetch(`${apiBase}/api/agency/buses/all`);
        if (res.ok) {
          const raw = await res.json();
          const mapped = mapBusesFromDb(raw || []);
          setBuses(mapped);
        }
      } catch (err) {
        console.error("⚠️ Error fetching buses from Supabase:", err);
        setBuses([]);
      }
    };
    fetchBuses();
  }, []);

  /* ── filtering ── */
  const filtered = useMemo(() => {
    return buses.filter(b => {
      if (activeType !== "tous" && b.type !== activeType) return false;
      if (activeUsage !== "tous" && !b.usage.includes(activeUsage)) return false;
      if (activeCity !== "Toutes les villes" && !b.zones.includes(activeCity)) return false;
      if (b.capacity < minCapacity) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every(a => b.amenities.includes(a))) return false;
      return true;
    });
  }, [buses, activeType, activeUsage, activeCity, minCapacity, selectedAmenities]);

  const toggleAmenity = (key: string) =>
    setSelectedAmenities(prev =>
      prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]
    );

  /* ── booking submit ── */
  const openModal = (bus: Bus) => {
    setSelectedBus(bus);
    setSubmitted(false);
    setForm(f => ({ ...f, durationType: pricingMode, withDriver: bus.withDriverDefault }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.clientPhone.trim()) return;
    setSubmitting(true);

    const usageLabel: Record<string, string> = {
      jour: "Location à la journée", trajet: "Par trajet", semaine: "À la semaine",
    };

    const msg = [
      `🚌 DEMANDE DE LOCATION DE BUS — SAFETRIP`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Bus demandé : ${selectedBus?.name} (${selectedBus?.agency})`,
      `Capacité    : ${selectedBus?.capacity} places`,
      ``,
      `👤 Client    : ${form.clientName}`,
      `📞 Téléphone : ${form.clientPhone}`,
      form.clientEmail ? `📧 Email     : ${form.clientEmail}` : "",
      ``,
      `📍 Départ    : ${form.departCity || "—"}`,
      `🏁 Destination : ${form.destination || "—"}`,
      form.startDate ? `📅 Date départ : ${form.startDate}` : "",
      form.endDate   ? `📅 Date retour : ${form.endDate}` : "",
      `👥 Passagers : ${form.passengers || "—"}`,
      `⏱️ Type de location : ${usageLabel[form.durationType] || form.durationType}`,
      `🚗 Chauffeur inclus : ${form.withDriver ? "Oui" : "Non"}`,
      form.extras.length > 0 ? `✨ Options : ${form.extras.join(", ")}` : "",
      form.message ? `\n📝 Message :\n${form.message}` : "",
    ].filter(Boolean).join("\n");

    try {
      const reqs = JSON.parse(localStorage.getItem("safetrip_location_requests") || "[]");
      reqs.unshift({ id: Date.now(), busName: selectedBus?.name, ...form, createdAt: new Date().toLocaleDateString("fr-FR"), status: "nouveau" });
      localStorage.setItem("safetrip_location_requests", JSON.stringify(reqs));
    } catch { /* ignore */ }

    setTimeout(() => {
      openSmartsuppWithMessage(msg, form.clientName, form.clientEmail || undefined);
      setSubmitting(false);
      setSubmitted(true);
    }, 700);
  };

  /* ── price display for a bus ── */
  const displayPrice = (bus: Bus) => {
    if (pricingMode === "trajet" && bus.pricePerJourney) return fmtPrice(bus.pricePerJourney);
    if (pricingMode === "semaine" && bus.pricePerWeek)  return fmtPrice(bus.pricePerWeek);
    return fmtPrice(bus.pricePerDay);
  };
  const priceLabel = pricingMode === "jour" ? "/ jour" : pricingMode === "trajet" ? "/ trajet" : "/ semaine";

  /* ─────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#F7F4EE 0%,#EDE9DF 100%)", fontFamily: "var(--font-body,'DM Sans',sans-serif)" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }

        .loc-nav { display:flex; gap:24px; align-items:center; }
        .loc-hamburger { display:none; background:none; border:none; cursor:pointer; padding:6px; color:#0A2F1D; }
        .loc-header-cta { }
        .loc-mobile-menu { display:none; flex-direction:column; background:#fff; border-top:1px solid rgba(230,225,214,0.7); }
        .loc-mobile-menu.open { display:flex; }
        .loc-mobile-menu a, .loc-mobile-menu button { display:block; padding:14px 24px; font-weight:700; font-size:1rem; color:#0A2F1D; text-decoration:none; border-bottom:1px solid #f7fafc; background:none; border-left:none; border-right:none; border-top:none; cursor:pointer; font-family:inherit; text-align:left; width:100%; }
        .loc-mobile-menu a:hover, .loc-mobile-menu button:hover { background:#f7fafc; }

        .loc-type-tabs { display:flex; gap:8px; flex-wrap:wrap; }
        .loc-type-tab { border:1.5px solid #E6E1D6; background:#fff; border-radius:30px; padding:7px 16px; font-size:0.82rem; font-weight:700; color:#4a5568; cursor:pointer; transition:all 0.2s ease; font-family:inherit; white-space:nowrap; }
        .loc-type-tab:hover { border-color:#00673C; color:#00673C; }
        .loc-type-tab.active { background:#0A2F1D; color:#FCD116; border-color:#0A2F1D; }

        .loc-amenity-chip { border:1.5px solid #E6E1D6; background:#fff; border-radius:20px; padding:5px 12px; font-size:0.75rem; font-weight:700; color:#4a5568; cursor:pointer; transition:all 0.18s ease; font-family:inherit; white-space:nowrap; }
        .loc-amenity-chip:hover { border-color:#00673C; }
        .loc-amenity-chip.active { background:#00673C; color:#fff; border-color:#00673C; }

        .loc-bus-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:24px; }
        .loc-bus-card { background:#fff; border-radius:22px; border:1.5px solid #E6E1D6; box-shadow:0 8px 28px rgba(7,26,14,0.05); overflow:hidden; display:flex; flex-direction:column; transition:transform 0.25s ease,box-shadow 0.25s ease; animation:fadeInUp 0.5s ease both; }
        .loc-bus-card:hover { transform:translateY(-5px); box-shadow:0 22px 52px rgba(7,26,14,0.11); }

        .loc-pricing-tabs { display:flex; background:rgba(10,47,29,0.05); border-radius:30px; padding:3px; gap:2px; }
        .loc-pricing-tab { border:none; background:transparent; border-radius:28px; padding:7px 18px; font-size:0.8rem; font-weight:700; color:#718096; cursor:pointer; font-family:inherit; transition:all 0.2s ease; }
        .loc-pricing-tab.active { background:#0A2F1D; color:#FCD116; }

        .loc-filter-toggle { display:none; width:100%; background:#fff; border:1.5px solid #E6E1D6; border-radius:12px; padding:12px 18px; font-weight:700; font-size:0.9rem; color:#0A2F1D; cursor:pointer; font-family:inherit; align-items:center; gap:8px; margin-bottom:16px; }
        .loc-filters-panel { }

        @media (max-width:767px) {
          .loc-nav { display:none !important; }
          .loc-hamburger { display:flex !important; align-items:center; }
          .loc-header-cta { display:none; }
          .loc-bus-grid { grid-template-columns:1fr; }
          .loc-filter-toggle { display:flex; }
          .loc-filters-panel { display:none; }
          .loc-filters-panel.open { display:block; }
        }
        @media (max-width:480px) {
          .loc-bus-grid { grid-template-columns:1fr; }
          .loc-type-tabs { gap:6px; }
          .loc-type-tab { padding:6px 12px; font-size:0.75rem; }
        }
        @media (min-width:768px) and (max-width:1024px) {
          .loc-bus-grid { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ position:"sticky", top:0, zIndex:100, background:"rgba(247,244,238,0.94)", backdropFilter:"blur(22px)", borderBottom:"1px solid rgba(230,225,214,0.7)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"14px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <Link href="/"><img src="/images/logo-removebg-preview (2).png" alt="SafeTrip" style={{ height:42, objectFit:"contain" }} /></Link>

          <nav className="loc-nav">
            {[
              { href:"/reserver",    label:"Réserver" },
              { href:"/agences",     label:"Agences" },
              { href:"/tracabilite", label:"Traçabilité" },
              { href:"/location",    label:"Location" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{ fontWeight: href === "/location" ? 800 : 650, color: href === "/location" ? "#00673C" : "#1C2B22", fontSize:"0.92rem", textDecoration:"none" }}>{label}</Link>
            ))}
            {isLoggedIn && userRole === "admin"   && <Link href="/admin/dashboard"  style={{ fontWeight:700, color:"#C8941E", fontSize:"0.92rem", textDecoration:"none" }}>Admin</Link>}
            {isLoggedIn && userRole === "agency"  && <Link href="/agence/dashboard" style={{ fontWeight:700, color:"#C8941E", fontSize:"0.92rem", textDecoration:"none" }}>Mon Agence</Link>}
            {isLoggedIn && userRole === "client"  && <Link href="/client/dashboard" style={{ fontWeight:700, color:"#C8941E", fontSize:"0.92rem", textDecoration:"none" }}>Mon Espace</Link>}
          </nav>

          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Link href="/login" className="loc-header-cta" style={{ background:"#00673C", color:"#fff", fontWeight:700, fontSize:"0.88rem", padding:"9px 22px", borderRadius:30, textDecoration:"none" }}>
              {isLoggedIn ? "Mon compte" : "Connexion"}
            </Link>
            <button className="loc-hamburger" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {mobileMenuOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
              </svg>
            </button>
          </div>
        </div>

        <div className={`loc-mobile-menu${mobileMenuOpen ? " open" : ""}`}>
          {([["/reserver","Réserver"],["/agences","Agences"],["/tracabilite","Traçabilité"],["/location","Location"]] as [string,string][]).map(([href,label]) => (
            <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} style={href === "/location" ? { color:"#00673C" } : {}}>{label as string}</Link>
          ))}
          {isLoggedIn && <Link href="/client/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color:"#C8941E" }}>Mon espace</Link>}
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ background:"#00673C", color:"#fff", margin:"8px 16px", borderRadius:8, padding:"12px 16px", textAlign:"center" }}>
            {isLoggedIn ? "Mon compte" : "Connexion"}
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ maxWidth:1280, margin:"0 auto", padding:"56px 24px 40px" }}>
        {/* Flag stripe */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18 }}>
          <span style={{ background:"linear-gradient(90deg,#FCD116,#CE1126,#007A5E)", height:3, width:44, borderRadius:99, display:"inline-block" }} />
          <span style={{ fontSize:"0.72rem", fontWeight:800, color:"#718096", textTransform:"uppercase", letterSpacing:2 }}>Location de Véhicules</span>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:20, marginBottom:32 }}>
          <div>
            <h1 style={{ fontSize:"clamp(1.8rem,4vw,2.6rem)", fontWeight:900, color:"#0A2F1D", margin:"0 0 12px 0", lineHeight:1.12, letterSpacing:"-0.5px" }}>
              Louez le bus idéal<br />
              <span style={{ color:"#00673C" }}>pour chaque occasion</span>
            </h1>
            <p style={{ color:"#718096", fontSize:"1rem", maxWidth:540, lineHeight:1.6, margin:0 }}>
              Mariage, excursion, corporate, pèlerinage — trouvez le bus parfait parmi nos partenaires certifiés. Devis en 5 minutes, réponse sous 2h.
            </p>
          </div>
          {/* Quick stats */}
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {[
              { val: `${buses.length}`, label: "Bus disponibles" },
              { val: "5+",   label: "Agences partenaires" },
              { val: "13+",  label: "Villes couvertes" },
            ].map(({ val, label }) => (
              <div key={label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"1.5rem", fontWeight:900, color:"#0A2F1D" }}>{val}</div>
                <div style={{ fontSize:"0.7rem", color:"#718096", fontWeight:600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PRICING MODE TABS ── */}
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24, flexWrap:"wrap" }}>
          <span style={{ fontSize:"0.82rem", fontWeight:700, color:"#4a5568" }}>Tarif affiché :</span>
          <div className="loc-pricing-tabs">
            {(["jour","trajet","semaine"] as const).map(m => (
              <button key={m} className={`loc-pricing-tab${pricingMode === m ? " active" : ""}`} onClick={() => setPricingMode(m)}>
                {m === "jour" ? "À la journée" : m === "trajet" ? "Par trajet" : "À la semaine"}
              </button>
            ))}
          </div>
        </div>

        {/* ── BUS TYPE TABS ── */}
        <div className="loc-type-tabs" style={{ marginBottom:20 }}>
          {BUS_TYPES.map(t => {
            const iconName = (BUS_TYPE_ICONS[t.key] ?? "bus") as IconName;
            return (
              <button key={t.key} className={`loc-type-tab${activeType === t.key ? " active" : ""}`} onClick={() => setActiveType(t.key)}
                style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                <Icon name={iconName} size={14} />
                {t.label}{t.cap ? ` — ${t.cap}` : ""}
              </button>
            );
          })}
        </div>

        {/* ── USAGE FILTER ── */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          {USAGE_TYPES.map(u => {
            const iconName = USAGE_ICONS[u.key] as IconName | undefined;
            return (
              <button key={u.key} onClick={() => setActiveUsage(u.key)}
                style={{ border:"1.5px solid", borderColor: activeUsage === u.key ? "#0A2F1D" : "#E6E1D6", background: activeUsage === u.key ? "#0A2F1D" : "#fff", color: activeUsage === u.key ? "#FCD116" : "#4a5568", borderRadius:30, padding:"6px 14px", fontSize:"0.78rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s ease", display:"inline-flex", alignItems:"center", gap:6 }}>
                {iconName && <Icon name={iconName} size={13} />}
                {u.label}
              </button>
            );
          })}
        </div>

        {/* ── ADVANCED FILTERS TOGGLE ── */}
        <button className="loc-filter-toggle" onClick={() => setShowFilters(v => !v)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Filtres avancés {selectedAmenities.length > 0 && `(${selectedAmenities.length})`}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft:"auto", transform: showFilters ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        {/* ── ADVANCED FILTERS PANEL ── */}
        <div className={`loc-filters-panel${showFilters ? " open" : ""}`}>
          <div style={{ background:"#fff", borderRadius:18, border:"1.5px solid #E6E1D6", padding:"20px 24px", marginBottom:20, display:"flex", gap:24, flexWrap:"wrap", alignItems:"flex-start" }}>
            {/* City */}
            <div style={{ display:"flex", flexDirection:"column", gap:6, minWidth:180 }}>
              <label style={{ fontSize:"0.68rem", fontWeight:800, color:"#718096", textTransform:"uppercase", letterSpacing:0.8 }}>Ville de départ</label>
              <select value={activeCity} onChange={e => setActiveCity(e.target.value)}
                style={{ background:"#f7fafc", border:"1.5px solid #E6E1D6", borderRadius:10, padding:"9px 12px", fontSize:"0.88rem", fontFamily:"inherit", color:"#2d3748", outline:"none" }}>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Capacity */}
            <div style={{ display:"flex", flexDirection:"column", gap:6, minWidth:160 }}>
              <label style={{ fontSize:"0.68rem", fontWeight:800, color:"#718096", textTransform:"uppercase", letterSpacing:0.8 }}>Capacité min.</label>
              <select value={minCapacity} onChange={e => setMinCapacity(Number(e.target.value))}
                style={{ background:"#f7fafc", border:"1.5px solid #E6E1D6", borderRadius:10, padding:"9px 12px", fontSize:"0.88rem", fontFamily:"inherit", color:"#2d3748", outline:"none" }}>
                <option value={0}>Toutes capacités</option>
                <option value={8}>8+ places</option>
                <option value={14}>14+ places</option>
                <option value={22}>22+ places</option>
                <option value={30}>30+ places</option>
                <option value={45}>45+ places</option>
                <option value={55}>55+ places</option>
              </select>
            </div>

            {/* Amenity chips */}
            <div style={{ flex:1, minWidth:240 }}>
              <label style={{ fontSize:"0.68rem", fontWeight:800, color:"#718096", textTransform:"uppercase", letterSpacing:0.8, display:"block", marginBottom:8 }}>Équipements obligatoires</label>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {Object.entries(AMENITIES_META).map(([key, { label }]) => {
                  const iconName = AMENITY_ICONS[key] as IconName | undefined;
                  return (
                    <button key={key} className={`loc-amenity-chip${selectedAmenities.includes(key) ? " active" : ""}`} onClick={() => toggleAmenity(key)}
                      style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
                      {iconName && <Icon name={iconName} size={12} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── RESULTS COUNT ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
          <p style={{ fontWeight:800, color:"#0A2F1D", fontSize:"0.9rem", margin:0 }}>
            {filtered.length} bus{filtered.length > 1 ? " disponibles" : " disponible"}
            {activeType !== "tous" && ` · ${BUS_TYPES.find(t=>t.key===activeType)?.label}`}
            {activeUsage !== "tous" && ` · ${USAGE_TYPES.find(u=>u.key===activeUsage)?.label?.replace(/^[^\s]+ /,"")}`}
          </p>
          {(activeType !== "tous" || activeUsage !== "tous" || selectedAmenities.length > 0 || minCapacity > 0 || activeCity !== "Toutes les villes") && (
            <button onClick={() => { setActiveType("tous"); setActiveUsage("tous"); setSelectedAmenities([]); setMinCapacity(0); setActiveCity("Toutes les villes"); }}
              style={{ background:"none", border:"1.5px solid #E6E1D6", color:"#718096", fontWeight:700, fontSize:"0.78rem", borderRadius:20, padding:"5px 14px", cursor:"pointer", fontFamily:"inherit" }}>
              Réinitialiser les filtres <Icon name="x" size={12} />
            </button>
          )}
        </div>

        {/* ── BUS GRID ── */}
        {filtered.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:20, border:"1px solid #E6E1D6", padding:"48px 32px", textAlign:"center" }}>
            <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}>
              <Icon name="bus" size={52} color="#a0aec0" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontWeight:800, color:"#0A2F1D", marginBottom:8 }}>Aucun bus trouvé</h3>
            <p style={{ color:"#718096", fontSize:"0.88rem" }}>Modifiez vos filtres ou contactez-nous pour un devis personnalisé.</p>
          </div>
        ) : (
          <div className="loc-bus-grid">
            {filtered.map((bus, idx) => (
              <div key={bus.id} className="loc-bus-card" style={{ animationDelay: `${idx * 0.06}s` }}>
                {/* Top accent stripe — Cameroonian flag */}
                <div style={{ height:4, background:`linear-gradient(90deg,${bus.accentColor},#0A2F1D)` }} />

                <div style={{ padding:"20px 22px", flex:1, display:"flex", flexDirection:"column", gap:14 }}>
                  {/* Header row */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                    <div style={{ flex:1 }}>
                      {bus.badge && (
                        <span style={{ fontSize:"0.65rem", fontWeight:800, padding:"3px 10px", borderRadius:99, background: bus.accentColor + "18", color: bus.accentColor, display:"inline-block", marginBottom:6 }}>
                          {bus.badge}
                        </span>
                      )}
                      <h3 style={{ fontWeight:850, color:"#0A2F1D", fontSize:"1rem", margin:0, lineHeight:1.25 }}>{bus.name}</h3>
                    </div>
                    {/* Agency logo */}
                    <div style={{ width:44, height:44, background:"#f7fafc", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #edf2f7", flexShrink:0, padding:6 }}>
                      <img src={bus.agencyLogo} alt={bus.agency} style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
                    </div>
                  </div>

                  {/* Rating + capacity */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <StarRating rating={bus.rating} />
                      <span style={{ fontSize:"0.75rem", fontWeight:700, color:"#718096" }}>{bus.rating} ({bus.reviews} avis)</span>
                    </div>
                    <span style={{ fontSize:"0.72rem", fontWeight:700, background:"rgba(10,47,29,0.06)", color:"#0A2F1D", padding:"3px 10px", borderRadius:99, display:"inline-flex", alignItems:"center", gap:4 }}>
                      <Icon name="users" size={12} /> {bus.capacity} places
                    </span>
                    {bus.withDriverDefault && (
                      <span style={{ fontSize:"0.72rem", fontWeight:700, background:"rgba(0,103,60,0.06)", color:"#00673C", padding:"3px 10px", borderRadius:99, display:"inline-flex", alignItems:"center", gap:4 }}>
                        <Icon name="car" size={12} /> Chauffeur inclus
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p style={{ color:"#718096", fontSize:"0.83rem", lineHeight:1.55, margin:0 }}>{bus.description}</p>

                  {/* Zones */}
                  <div>
                    <p style={{ fontSize:"0.65rem", fontWeight:800, color:"#a0aec0", textTransform:"uppercase", letterSpacing:0.8, margin:"0 0 6px 0" }}>Zones desservies</p>
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                      {bus.zones.map(z => (
                        <span key={z} style={{ fontSize:"0.68rem", fontWeight:700, background:"#f7fafc", color:"#4a5568", padding:"3px 8px", borderRadius:6, border:"1px solid #edf2f7", display:"inline-flex", alignItems:"center", gap:3 }}>
                          <Icon name="map-pin" size={10} /> {z}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <p style={{ fontSize:"0.65rem", fontWeight:800, color:"#a0aec0", textTransform:"uppercase", letterSpacing:0.8, margin:"0 0 6px 0" }}>Équipements</p>
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                      {bus.amenities.slice(0, 6).map(a => {
                        const meta = AMENITIES_META[a];
                        const iconName = AMENITY_ICONS[a] as IconName | undefined;
                        return meta ? (
                          <span key={a} style={{ fontSize:"0.68rem", fontWeight:700, background:"rgba(0,103,60,0.05)", color:"#00673C", padding:"4px 9px", borderRadius:8, border:"1px solid rgba(0,103,60,0.12)", display:"inline-flex", alignItems:"center", gap:4 }}>
                            {iconName && <Icon name={iconName} size={11} />}
                            {meta.label}
                          </span>
                        ) : null;
                      })}
                      {bus.amenities.length > 6 && (
                        <span style={{ fontSize:"0.68rem", fontWeight:700, color:"#718096", padding:"4px 9px" }}>+{bus.amenities.length - 6} autres</span>
                      )}
                    </div>
                  </div>

                  {/* Price + CTA */}
                  <div style={{ borderTop:"1px solid #f7fafc", paddingTop:14, display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, flexWrap:"wrap", marginTop:"auto" }}>
                    <div>
                      <p style={{ fontSize:"0.65rem", color:"#a0aec0", fontWeight:700, textTransform:"uppercase", margin:"0 0 2px 0" }}>À partir de</p>
                      <p style={{ fontSize:"1.2rem", fontWeight:900, color:"#0A2F1D", margin:0, letterSpacing:"-0.3px" }}>
                        {displayPrice(bus)} <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#718096" }}>{priceLabel}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => openModal(bus)}
                      style={{ background:"#0A2F1D", color:"#FCD116", fontWeight:800, fontSize:"0.85rem", padding:"10px 20px", borderRadius:12, border:"none", cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s ease", whiteSpace:"nowrap" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#00673C"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#0A2F1D"; (e.currentTarget as HTMLButtonElement).style.color = "#FCD116"; }}
                    >
                      <Icon name="bus" size={15} /> Demander un devis
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background:"#0A2F1D", padding:"64px 24px", marginTop:40 }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ height:3, background:"linear-gradient(90deg,#FCD116,#CE1126,#007A5E)", marginBottom:32, borderRadius:99, maxWidth:80 }} />
          <h2 style={{ fontSize:"clamp(1.5rem,3vw,2rem)", fontWeight:900, color:"#fff", marginBottom:8 }}>Comment louer un bus ?</h2>
          <p style={{ color:"rgba(255,255,255,0.55)", fontSize:"0.92rem", marginBottom:48, maxWidth:480 }}>Processus 100% en ligne, réponse garantie en moins de 2 heures.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:24 }}>
            {([
              { step:"01", icon:"search" as IconName, title:"Choisissez votre bus", desc:"Filtrez par type, capacité, équipements et usage. Consultez les disponibilités." },
              { step:"02", icon:"clipboard" as IconName, title:"Envoyez un devis", desc:"Remplissez le formulaire en 2 min. Votre demande parvient directement à notre service client." },
              { step:"03", icon:"send" as IconName, title:"Confirmation sous 2h", desc:"Notre équipe vous rappelle pour confirmer le tarif final et les détails logistiques." },
              { step:"04", icon:"bus" as IconName, title:"Profitez du trajet", desc:"Le jour J, votre bus certifié SafeTrip est à l'heure. Chauffeur professionnel inclus." },
            ] as { step:string; icon:IconName; title:string; desc:string }[]).map(({ step, icon, title, desc }) => (
              <div key={step} style={{ background:"rgba(255,255,255,0.05)", borderRadius:18, border:"1px solid rgba(255,255,255,0.08)", padding:"24px 20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <span style={{ fontSize:"0.65rem", fontWeight:900, color:"rgba(252,209,22,0.7)", letterSpacing:1 }}>ÉTAPE {step}</span>
                </div>
                <div style={{ marginBottom:14 }}>
                  <Icon name={icon} size={36} color="#FCD116" strokeWidth={1.5} />
                </div>
                <h3 style={{ color:"#fff", fontWeight:800, fontSize:"1rem", marginBottom:8 }}>{title}</h3>
                <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.82rem", lineHeight:1.6, margin:0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ maxWidth:860, margin:"0 auto", padding:"64px 24px" }}>
        <h2 style={{ fontSize:"clamp(1.4rem,3vw,1.8rem)", fontWeight:900, color:"#0A2F1D", marginBottom:32 }}>Questions fréquentes</h2>
        {[
          {
            q: "Est-ce que le chauffeur est inclus dans le tarif ?",
            a: "Par défaut oui — tous nos bus incluent un chauffeur certifié et expérimenté. Certains bus peuvent être loués sans chauffeur (option disponible dans le formulaire).",
          },
          {
            q: "Peut-on décorer le bus pour un mariage ?",
            a: "Absolument ! Certains de nos bus VIP proposent une option décoration florale, sonorisation et service traiteur. Cochez l'équipement « Décoration mariage » dans les filtres.",
          },
          {
            q: "Quelles sont les distances couvertes ?",
            a: "Nos partenaires couvrent les trajets urbains (dans une même ville), interurbains (entre villes camerounaises) et même des destinations sous-régionales (Gabon, Nigeria, RCA) pour certains opérateurs.",
          },
          {
            q: "Quel délai de réservation est recommandé ?",
            a: "Pour un bus ordinaire, 48h suffisent. Pour un mariage ou pèlerinage, nous recommandons de réserver 2 à 4 semaines à l'avance pour garantir le bus et les options souhaitées.",
          },
          {
            q: "Comment se passe le paiement ?",
            a: "Après confirmation par téléphone, le paiement se fait par Mobile Money (MTN, Orange), virement bancaire ou en espèces à l'agence. Un acompte de 30% est demandé pour sécuriser la réservation.",
          },
        ].map(({ q, a }, i) => (
          <details key={i} style={{ borderBottom:"1px solid #E6E1D6", padding:"16px 0" }}>
            <summary style={{ fontWeight:800, color:"#0A2F1D", fontSize:"0.95rem", cursor:"pointer", listStyle:"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              {q}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </summary>
            <p style={{ color:"#718096", fontSize:"0.88rem", lineHeight:1.65, margin:"12px 0 0 0" }}>{a}</p>
          </details>
        ))}
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:"#071A0E", color:"rgba(255,255,255,0.55)", textAlign:"center", padding:"28px 24px", fontSize:"0.82rem" }}>
        <div style={{ height:3, background:"linear-gradient(90deg,#FCD116,#CE1126,#007A5E)", marginBottom:18, borderRadius:99, maxWidth:120, margin:"0 auto 18px" }} />
        <p style={{ margin:"0 0 6px 0", fontWeight:700, color:"rgba(255,255,255,0.85)" }}>SafeTrip — Location de Bus au Cameroun</p>
        <p style={{ margin:0 }}>© 2026 SafeTrip. Tous droits réservés. — Cameroun</p>
      </footer>

      {/* ── BOOKING MODAL ── */}
      {selectedBus && (
        <div
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:16, overflowY:"auto" }}
          onClick={() => setSelectedBus(null)}
        >
          <div
            style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:600, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 32px 90px rgba(0,0,0,0.3)", animation:"slideUp 0.3s cubic-bezier(0.16,1,0.3,1)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ background:"linear-gradient(135deg,#071A0E,#0A2F1D)", padding:"20px 26px", borderRadius:"24px 24px 0 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ fontSize:"0.62rem", color:"rgba(255,255,255,0.45)", fontWeight:700, margin:0, textTransform:"uppercase", letterSpacing:1 }}>Demande de location</p>
                <h3 style={{ color:"#fff", fontWeight:900, fontSize:"1.05rem", margin:"4px 0 2px 0" }}>{selectedBus.name}</h3>
                <p style={{ color:"#FCD116", fontSize:"0.75rem", fontWeight:700, margin:0 }}>{selectedBus.capacity} places · {selectedBus.agency}</p>
              </div>
              <button onClick={() => setSelectedBus(null)} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"rgba(255,255,255,0.7)", width:34, height:34, borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon name="x" size={18} />
              </button>
            </div>

            {submitted ? (
              <div style={{ padding:"52px 32px", textAlign:"center" }}>
                <div style={{ width:64, height:64, background:"#eef8f3", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00673C" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 style={{ fontSize:"1.2rem", fontWeight:900, color:"#0A2F1D", marginBottom:8 }}>Devis envoyé !</h3>
                <p style={{ color:"#718096", fontSize:"0.88rem", lineHeight:1.6, marginBottom:28, maxWidth:380, margin:"0 auto 28px" }}>
                  Votre demande pour <strong>{selectedBus.name}</strong> a été transmise au service client. Vous serez contacté sous 2h au numéro indiqué.
                </p>
                <button onClick={() => setSelectedBus(null)} style={{ background:"#00673C", color:"#fff", border:"none", borderRadius:12, padding:"12px 32px", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:"0.9rem" }}>
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding:"24px 26px" }}>
                <p style={{ color:"#718096", fontSize:"0.83rem", lineHeight:1.5, margin:"0 0 22px 0" }}>
                  Remplissez ce formulaire. Notre équipe vous contacte sous <strong>2 heures</strong> pour confirmer la disponibilité et le tarif final.
                </p>

                {/* Personal info */}
                <p style={{ fontSize:"0.65rem", fontWeight:800, color:"#a0aec0", textTransform:"uppercase", letterSpacing:0.8, margin:"0 0 10px 0" }}>Vos coordonnées</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  {[
                    { label:"Votre nom *", field:"clientName" as keyof BookingForm, placeholder:"Jean Dupont", type:"text" },
                    { label:"Téléphone *", field:"clientPhone" as keyof BookingForm, placeholder:"+237 6XX XX XX XX", type:"tel" },
                  ].map(({ label, field, placeholder, type }) => (
                    <div key={field} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>{label}</label>
                      <input required={field.startsWith("client") && !field.includes("Email")} type={type} value={form[field] as string}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
                        style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:18 }}>
                  <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>Email (facultatif)</label>
                  <input type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="vous@exemple.cm"
                    style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748" }} />
                </div>

                {/* Trip details */}
                <p style={{ fontSize:"0.65rem", fontWeight:800, color:"#a0aec0", textTransform:"uppercase", letterSpacing:0.8, margin:"0 0 10px 0" }}>Détails du trajet</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  {[
                    { label:"Ville de départ", field:"departCity" as keyof BookingForm, placeholder:"Douala" },
                    { label:"Destination", field:"destination" as keyof BookingForm, placeholder:"Yaoundé / Kribi..." },
                  ].map(({ label, field, placeholder }) => (
                    <div key={field} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>{label}</label>
                      <input type="text" value={form[field] as string}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
                        style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  {[
                    { label:"Date de départ", field:"startDate" as keyof BookingForm, type:"date" },
                    { label:"Date de retour", field:"endDate" as keyof BookingForm, type:"date" },
                  ].map(({ label, field, type }) => (
                    <div key={field} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>{label}</label>
                      <input type={type} value={form[field] as string}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>Nombre de passagers</label>
                    <input type="number" min={1} max={selectedBus.capacity} value={form.passengers}
                      onChange={e => setForm(f => ({ ...f, passengers: e.target.value }))} placeholder={`Max. ${selectedBus.capacity}`}
                      style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748" }} />
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>Type de location</label>
                    <select value={form.durationType} onChange={e => setForm(f => ({ ...f, durationType: e.target.value }))}
                      style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748" }}>
                      <option value="jour">À la journée</option>
                      <option value="trajet">Par trajet</option>
                      <option value="semaine">À la semaine</option>
                    </select>
                  </div>
                </div>

                {/* Driver + Extras */}
                <div style={{ background:"#f7fafc", borderRadius:12, padding:"14px 16px", marginBottom:18 }}>
                  <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                    <input type="checkbox" checked={form.withDriver} onChange={e => setForm(f => ({ ...f, withDriver: e.target.checked }))} style={{ width:16, height:16, accentColor:"#00673C" }} />
                    <span style={{ fontSize:"0.88rem", fontWeight:700, color:"#0A2F1D", display:"inline-flex", alignItems:"center", gap:6 }}>
                      <Icon name="car" size={16} style={{ flexShrink:0 }} /> Inclure un chauffeur professionnel
                    </span>
                  </label>
                </div>

                {/* Optional extras */}
                <p style={{ fontSize:"0.65rem", fontWeight:800, color:"#a0aec0", textTransform:"uppercase", letterSpacing:0.8, margin:"0 0 8px 0" }}>Options supplémentaires</p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
                  {["Guide touristique", "Sonorisation", "Décoration mariage", "Service traiteur", "Suivi GPS partagé"].map(opt => (
                    <label key={opt} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", background:"#f7fafc", border:"1.5px solid", borderColor: form.extras.includes(opt) ? "#00673C" : "#e2e8f0", borderRadius:20, padding:"5px 12px" }}>
                      <input type="checkbox" checked={form.extras.includes(opt)}
                        onChange={e => setForm(f => ({ ...f, extras: e.target.checked ? [...f.extras, opt] : f.extras.filter(x => x !== opt) }))}
                        style={{ width:13, height:13, accentColor:"#00673C" }} />
                      <span style={{ fontSize:"0.75rem", fontWeight:700, color: form.extras.includes(opt) ? "#00673C" : "#4a5568" }}>{opt}</span>
                    </label>
                  ))}
                </div>

                {/* Message */}
                <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:22 }}>
                  <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>Message / Instructions particulières</label>
                  <textarea rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Précisez l'objet du voyage, instructions spéciales, point de rendez-vous exact..."
                    style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748", resize:"vertical" }} />
                </div>

                <button type="submit" disabled={submitting}
                  style={{ width:"100%", background: submitting ? "#a0aec0" : "#0A2F1D", color:"#FCD116", fontWeight:900, fontSize:"0.95rem", padding:"14px", borderRadius:14, border:"none", cursor: submitting ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all 0.2s ease" }}>
                  {submitting
                    ? <><div style={{ width:18, height:18, border:"2px solid rgba(252,209,22,0.3)", borderTopColor:"#FCD116", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} /> Envoi en cours…</>
                    : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Envoyer ma demande de devis</>}
                </button>
                <p style={{ fontSize:"0.7rem", color:"#a0aec0", textAlign:"center", marginTop:10, lineHeight:1.5 }}>
                  Réponse garantie sous 2h · Aucun engagement avant confirmation
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
