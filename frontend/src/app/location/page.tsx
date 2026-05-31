"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { openSmartsuppWithMessage } from "@/components/SmartsuppChat";
import { Icon, AMENITY_ICONS, USAGE_ICONS, BUS_TYPE_ICONS } from "@/components/Icons";
import type { IconName } from "@/components/Icons";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useUser } from "@/components/UserContext";

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
const AMENITIES_TKEYS: Record<string, string> = {
  ac:        "amenity_ac",
  wifi:      "amenity_wifi",
  toilet:    "amenity_toilet",
  tv:        "amenity_tv",
  usb:       "amenity_usb",
  mini_bar:  "amenity_mini_bar",
  leather:   "amenity_leather",
  gps:       "amenity_gps",
  sono:      "amenity_sono",
  reclining: "amenity_reclining",
  luggage:   "amenity_luggage",
  guide:     "amenity_guide",
  catering:  "amenity_catering",
  deco:      "amenity_deco",
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

const FALLBACK_BUSES: Bus[] = [
  {
    id: 1,
    name: "Sprinter Executive VIP",
    type: "vip",
    capacity: 14,
    agency: "Finexs Voyage",
    agencyLogo: "/images/finexs.png",
    pricePerDay: 120000,
    pricePerJourney: 75000,
    pricePerWeek: 700000,
    amenities: ["ac", "wifi", "usb", "tv", "leather", "mini_bar", "gps"],
    usage: ["corporate", "mariage", "excursion"],
    zones: ["Douala", "Yaoundé", "Kribi", "Limbé"],
    description: "Bus Executive Class haut de gamme avec sièges cuir, mini-bar et Wi-Fi haut débit. Idéal pour les cadres et les cérémonies de prestige.",
    rating: 4.9, reviews: 48,
    withDriverDefault: true,
    badge: "Premium",
    accentColor: "#C8941E",
  },
  {
    id: 2,
    name: "Coaster Confort 22 places",
    type: "confort",
    capacity: 22,
    agency: "Buca Voyage",
    agencyLogo: "/images/bucavoyage.png",
    pricePerDay: 75000,
    pricePerJourney: 50000,
    pricePerWeek: 420000,
    amenities: ["ac", "usb", "reclining", "luggage", "gps"],
    usage: ["excursion", "corporate", "scolaire", "mariage"],
    zones: ["Douala", "Yaoundé", "Bafoussam", "Dschang"],
    description: "Bus confort idéal pour les groupes moyens. Sièges inclinables, climatisation puissante et grand coffre à bagages.",
    rating: 4.7, reviews: 63,
    withDriverDefault: true,
    badge: "Populaire",
    accentColor: "#00673C",
  },
  {
    id: 3,
    name: "Toyota HiAce Luxe 8P",
    type: "minibus",
    capacity: 8,
    agency: "Men Travel",
    agencyLogo: "/images/mentravel.png",
    pricePerDay: 35000,
    pricePerJourney: 25000,
    pricePerWeek: 200000,
    amenities: ["ac", "usb", "gps", "leather"],
    usage: ["corporate", "excursion", "mariage"],
    zones: ["Douala", "Kribi", "Limbé", "Edéa"],
    description: "Minibus agile parfait pour les petits groupes et transferts aéroport. Idéal pour les sorties d'entreprise et excursions en bord de mer.",
    rating: 4.6, reviews: 81,
    withDriverDefault: true,
    accentColor: "#3B82F6",
  },
  {
    id: 4,
    name: "Bus Classique 45 places",
    type: "classique",
    capacity: 45,
    agency: "General Express",
    agencyLogo: "/images/General.png",
    pricePerDay: 90000,
    pricePerJourney: 65000,
    pricePerWeek: 500000,
    amenities: ["ac", "luggage", "gps", "toilet"],
    usage: ["scolaire", "pelerinage", "humanitaire", "excursion"],
    zones: ["Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua"],
    description: "Grand bus classique pour mouvements de masse. Parfait pour les pèlerinages, voyages scolaires et missions humanitaires.",
    rating: 4.4, reviews: 112,
    withDriverDefault: true,
    badge: "Grand groupe",
    accentColor: "#DC2626",
  },
  {
    id: 5,
    name: "Bus VIP Mariage Prestige",
    type: "vip",
    capacity: 18,
    agency: "Touristique Express",
    agencyLogo: "/images/Touristique.png",
    pricePerDay: 100000,
    pricePerJourney: 70000,
    pricePerWeek: 580000,
    amenities: ["ac", "wifi", "sono", "deco", "leather", "tv", "catering"],
    usage: ["mariage", "excursion", "corporate"],
    zones: ["Douala", "Yaoundé", "Bafoussam", "Kribi"],
    description: "Bus VIP spécialement aménagé pour les mariages : décoration florale, sonorisation professionnelle, service traiteur en option. La touche royale pour votre grand jour.",
    rating: 4.8, reviews: 27,
    badge: "Mariage",
    accentColor: "#9333EA",
    withDriverDefault: true,
  },
  {
    id: 6,
    name: "Autocar Grande Capacité 70P",
    type: "grande",
    capacity: 70,
    agency: "General Express",
    agencyLogo: "/images/General.png",
    pricePerDay: 140000,
    pricePerJourney: 95000,
    pricePerWeek: 800000,
    amenities: ["ac", "tv", "luggage", "toilet", "gps"],
    usage: ["pelerinage", "scolaire", "humanitaire"],
    zones: ["Douala", "Yaoundé", "Bafoussam", "Ngaoundéré", "Maroua"],
    description: "Autocar grande capacité idéal pour les longs trajets. Toilettes à bord, TV, GPS. Parfait pour pèlerinages Nord-Cameroun.",
    rating: 4.3, reviews: 88,
    badge: "Long trajet",
    accentColor: "#0891B2",
    withDriverDefault: true,
  },
  {
    id: 7,
    name: "Minibus Luxe 14 places Wi-Fi",
    type: "minibus",
    capacity: 14,
    agency: "Men Travel",
    agencyLogo: "/images/mentravel.png",
    pricePerDay: 55000,
    pricePerJourney: 40000,
    pricePerWeek: 310000,
    amenities: ["ac", "wifi", "usb", "reclining", "gps"],
    usage: ["corporate", "excursion", "mariage"],
    zones: ["Douala", "Yaoundé", "Kribi", "Limbé", "Buéa"],
    description: "Minibus luxe 14 places avec Wi-Fi, climatisation et sièges inclinables. L'option premium pour groupes restreints.",
    rating: 4.7, reviews: 55,
    accentColor: "#059669",
    withDriverDefault: true,
  },
  {
    id: 8,
    name: "Bus Confort Bilingue 30P",
    type: "confort",
    capacity: 30,
    agency: "Buca Voyage",
    agencyLogo: "/images/bucavoyage.png",
    pricePerDay: 80000,
    pricePerJourney: 55000,
    pricePerWeek: 450000,
    amenities: ["ac", "usb", "reclining", "luggage", "gps", "wifi"],
    usage: ["excursion", "corporate", "scolaire"],
    zones: ["Douala", "Bamenda", "Bafoussam", "Buéa", "Limbé"],
    description: "Bus confort pour régions anglophones. Fiable, climatisé, Wi-Fi. Parfait pour trajets vers le Nord-Ouest et le Sud-Ouest.",
    rating: 4.5, reviews: 41,
    accentColor: "#D97706",
    withDriverDefault: true,
  },
  {
    id: 9,
    name: "Bus Pèlerinage 55 places",
    type: "grande",
    capacity: 55,
    agency: "Touristique Express",
    agencyLogo: "/images/Touristique.png",
    pricePerDay: 110000,
    pricePerJourney: 80000,
    pricePerWeek: 620000,
    amenities: ["ac", "toilet", "luggage", "gps", "tv", "usb"],
    usage: ["pelerinage", "scolaire", "humanitaire"],
    zones: ["Douala", "Yaoundé", "Ngaoundéré", "Maroua", "Garoua"],
    description: "Autocar 55 places avec toilettes et TV. Idéal pour les longs pèlerinages vers le Nord. Confort maximal sur les routes nationales.",
    rating: 4.5, reviews: 67,
    badge: "Pèlerinage",
    accentColor: "#10B981",
    withDriverDefault: true,
  },
  {
    id: 10,
    name: "Minibus Corporate 8P AC",
    type: "minibus",
    capacity: 8,
    agency: "Finexs Voyage",
    agencyLogo: "/images/finexs.png",
    pricePerDay: 30000,
    pricePerJourney: 20000,
    pricePerWeek: 170000,
    amenities: ["ac", "usb", "gps"],
    usage: ["corporate", "excursion"],
    zones: ["Douala", "Yaoundé", "Edéa", "Kribi"],
    description: "Petit minibus climatisé pour transferts rapides en ville et courtes distances. Économique et ponctuel.",
    rating: 4.4, reviews: 92,
    accentColor: "#6366F1",
    withDriverDefault: false,
  },
];

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
  const t = useTranslations("Location");
  const tc = useTranslations("Common");

  // Build translated amenities meta inside component
  const AMENITIES_META: Record<string, { label: string }> = Object.fromEntries(
    Object.entries(AMENITIES_TKEYS).map(([key, tKey]) => [key, { label: t(tKey as Parameters<typeof t>[0]) }])
  );

  const BUS_TYPES = [
    { key: "tous",      label: t("allTypes"),     cap: "" },
    { key: "minibus",   label: t("typeMinibus"),   cap: "8–14 places" },
    { key: "confort",   label: t("typeConfort"),   cap: "22–35 places" },
    { key: "classique", label: t("typeClassique"), cap: "30–45 places" },
    { key: "vip",       label: t("typeVip"),       cap: "10–20 places" },
    { key: "grande",    label: t("typeGrande"),    cap: "55–90 places" },
  ];

  const USAGE_TYPES = [
    { key: "tous",        label: t("allUsage") },
    { key: "mariage",     label: t("usageWedding") },
    { key: "excursion",   label: t("usageExcursion") },
    { key: "corporate",   label: t("usageCorporate") },
    { key: "scolaire",    label: t("usageSchool") },
    { key: "pelerinage",  label: t("usagePilgrimage") },
    { key: "humanitaire", label: t("usageHumanitarian") },
  ];

  const CITIES = [
    t("allCities"),
    "Douala", "Yaoundé", "Bafoussam", "Bamenda",
    "Kribi", "Limbé", "Buéa", "Garoua", "Ngaoundéré",
    "Maroua", "Edéa", "Dschang", "Nkongsamba",
  ];

  const [buses] = useState<Bus[]>(FALLBACK_BUSES);
  const [activeType, setActiveType] = useState("tous");
  const [activeUsage, setActiveUsage] = useState("tous");
  const [activeCity, setActiveCity] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minCapacity, setMinCapacity] = useState(0);
  const [pricingMode, setPricingMode] = useState<"jour" | "trajet" | "semaine">("jour");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useUser();
  const isLoggedIn = !!user;
  const userRole = user?.role || null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        clientName: user.fullName || "",
        clientEmail: user.email || "",
      }));
    }
  }, [user]);

  /* ── filtering ── */
  const filtered = useMemo(() => {
    return buses.filter(b => {
      if (activeType !== "tous" && b.type !== activeType) return false;
      if (activeUsage !== "tous" && !b.usage.includes(activeUsage)) return false;
      if (activeCity && !b.zones.includes(activeCity)) return false;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.clientPhone.trim()) return;
    setSubmitting(true);

    try {
      // 1. Sauvegarder dans la DB via l'API (en arrière-plan)
      fetch("http://192.168.100.107:5000/api/agency/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          busName: selectedBus?.name,
          agency: selectedBus?.agency,
          capacity: selectedBus?.capacity,
          clientName: form.clientName,
          clientPhone: form.clientPhone,
          clientEmail: form.clientEmail,
          departCity: form.departCity,
          destination: form.destination,
          startDate: form.startDate,
          endDate: form.endDate,
          passengers: form.passengers,
          durationType: form.durationType,
          withDriver: form.withDriver,
          extras: form.extras,
          message: form.message,
        }),
      }).catch(err => console.error("Could not save quote to DB:", err));

      // 2. Format du message WhatsApp amélioré
      const usageLabel: Record<string, string> = {
        jour: "Location à la journée", trajet: "Par trajet", semaine: "À la semaine",
      };

      const msg = [
        `🌟 *NOUVELLE DEMANDE DE DEVIS (SAFETRIP)* 🌟`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `*🏢 AGENCE :* ${selectedBus?.agency}`,
        `*🚌 VÉHICULE :* ${selectedBus?.name} (${selectedBus?.capacity} places)`,
        ``,
        `👤 *INFORMATIONS CLIENT*`,
        `▪️ *Nom :* ${form.clientName}`,
        `▪️ *Tél :* ${form.clientPhone}`,
        form.clientEmail ? `▪️ *Email :* ${form.clientEmail}` : "",
        ``,
        `📍 *DÉTAILS DU TRAJET*`,
        `▪️ *De :* ${form.departCity || "—"}`,
        `▪️ *Vers :* ${form.destination || "—"}`,
        form.startDate ? `▪️ *Dates :* ${form.startDate}${form.endDate ? ` au ${form.endDate}` : ""}` : "",
        `▪️ *Type de location :* ${usageLabel[form.durationType] || form.durationType}`,
        `▪️ *Passagers :* ${form.passengers || "—"}`,
        ``,
        `⚙️ *OPTIONS SOUHAITÉES*`,
        `▪️ *Chauffeur :* ${form.withDriver ? "✅ Inclus" : "❌ Non"}`,
        form.extras.length > 0 ? `▪️ *Extras :* ${form.extras.join(", ")}` : "",
        form.message ? `\n💬 *MESSAGE PARTICULIER :*\n"${form.message}"` : "",
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `*SafeTrip - Le partenaire de vos voyages !*`
      ].filter(Boolean).join("\n");
      
      const whatsappUrl = `https://wa.me/237651529402?text=${encodeURIComponent(msg)}`;
      window.open(whatsappUrl, "_blank");

      setSubmitting(false);
      setSubmitted(true);
    } catch (err) {
      console.error("Quote submission error:", err);
      setSubmitting(false);
    }
  };

  /* ── price display for a bus ── */
  const displayPrice = (bus: Bus) => {
    if (pricingMode === "trajet" && bus.pricePerJourney) return fmtPrice(bus.pricePerJourney);
    if (pricingMode === "semaine" && bus.pricePerWeek)  return fmtPrice(bus.pricePerWeek);
    return fmtPrice(bus.pricePerDay);
  };
  const priceLabel = `/ ${pricingMode === "jour" ? t("perDay") : pricingMode === "trajet" ? t("perTrip") : t("perWeek")}`;

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
              { href:"/reserver",    label: tc("reserve") },
              { href:"/agences",     label: tc("agencies") },
              { href:"/tracabilite", label: tc("traceability") },
              { href:"/location",    label: tc("rental") },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{ fontWeight: href === "/location" ? 800 : 650, color: href === "/location" ? "#00673C" : "#1C2B22", fontSize:"0.92rem", textDecoration:"none" }}>{label}</Link>
            ))}
            {isLoggedIn && userRole === "admin"   && <Link href="/admin/dashboard"  style={{ fontWeight:700, color:"#C8941E", fontSize:"0.92rem", textDecoration:"none" }}>{tc("admin")}</Link>}
            {isLoggedIn && userRole === "agency"  && <Link href="/agence/dashboard" style={{ fontWeight:700, color:"#C8941E", fontSize:"0.92rem", textDecoration:"none" }}>{tc("myAgency")}</Link>}
            {isLoggedIn && userRole === "client"  && <Link href="/client/dashboard" style={{ fontWeight:700, color:"#C8941E", fontSize:"0.92rem", textDecoration:"none" }}>{tc("mySpace")}</Link>}
          </nav>

          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <LanguageToggle />
            <Link href="/login" className="loc-header-cta" style={{ background:"#00673C", color:"#fff", fontWeight:700, fontSize:"0.88rem", padding:"9px 22px", borderRadius:30, textDecoration:"none" }}>
              {isLoggedIn ? tc("myAccount") : tc("login")}
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
          {[
            ["/reserver", tc("reserve")],
            ["/agences", tc("agencies")],
            ["/tracabilite", tc("traceability")],
            ["/location", tc("rental")],
          ].map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)} style={href === "/location" ? { color:"#00673C" } : {}}>{label}</Link>
          ))}
          {isLoggedIn && <Link href="/client/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color:"#C8941E" }}>{tc("travelerSpace")}</Link>}
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ background:"#00673C", color:"#fff", margin:"8px 16px", borderRadius:8, padding:"12px 16px", textAlign:"center" }}>
            {isLoggedIn ? tc("myAccount") : tc("login")}
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ maxWidth:1280, margin:"0 auto", padding:"56px 24px 40px" }}>
        {/* Flag stripe */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18 }}>
          <span style={{ background:"linear-gradient(90deg,#FCD116,#CE1126,#007A5E)", height:3, width:44, borderRadius:99, display:"inline-block" }} />
          <span style={{ fontSize:"0.72rem", fontWeight:800, color:"#718096", textTransform:"uppercase", letterSpacing:2 }}>{t("vehicleRental")}</span>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:20, marginBottom:32 }}>
          <div>
            <h1 style={{ fontSize:"clamp(1.8rem,4vw,2.6rem)", fontWeight:900, color:"#0A2F1D", margin:"0 0 12px 0", lineHeight:1.12, letterSpacing:"-0.5px" }}>
              {t("title1")}<br />
              <span style={{ color:"#00673C" }}>{t("title2")}</span>
            </h1>
            <p style={{ color:"#718096", fontSize:"1rem", maxWidth:540, lineHeight:1.6, margin:0 }}>
              {t("subtitle")}
            </p>
          </div>
          {/* Quick stats */}
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {[
              { val: `${buses.length}`, label: t("busesAvailable") },
              { val: "5+",   label: t("partnerAgencies") },
              { val: "13+",  label: t("citiesCovered") },
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
          <span style={{ fontSize:"0.82rem", fontWeight:700, color:"#4a5568" }}>{t("displayedRate")}</span>
          <div className="loc-pricing-tabs">
            {(["jour","trajet","semaine"] as const).map(m => (
              <button key={m} className={`loc-pricing-tab${pricingMode === m ? " active" : ""}`} onClick={() => setPricingMode(m)}>
                {m === "jour" ? t("perDay") : m === "trajet" ? t("perTrip") : t("perWeek")}
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
          {t("advancedFilters")} {selectedAmenities.length > 0 && `(${selectedAmenities.length})`}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft:"auto", transform: showFilters ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        {/* ── ADVANCED FILTERS PANEL ── */}
        <div className={`loc-filters-panel${showFilters ? " open" : ""}`}>
          <div style={{ background:"#fff", borderRadius:18, border:"1.5px solid #E6E1D6", padding:"20px 24px", marginBottom:20, display:"flex", gap:24, flexWrap:"wrap", alignItems:"flex-start" }}>
            {/* City */}
            <div style={{ display:"flex", flexDirection:"column", gap:6, minWidth:180 }}>
              <label style={{ fontSize:"0.68rem", fontWeight:800, color:"#718096", textTransform:"uppercase", letterSpacing:0.8 }}>{t("departureCity")}</label>
              <select value={activeCity} onChange={e => setActiveCity(e.target.value)}
                style={{ background:"#f7fafc", border:"1.5px solid #E6E1D6", borderRadius:10, padding:"9px 12px", fontSize:"0.88rem", fontFamily:"inherit", color:"#2d3748", outline:"none" }}>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Capacity */}
            <div style={{ display:"flex", flexDirection:"column", gap:6, minWidth:160 }}>
              <label style={{ fontSize:"0.68rem", fontWeight:800, color:"#718096", textTransform:"uppercase", letterSpacing:0.8 }}>{t("minCapacity")}</label>
              <select value={minCapacity} onChange={e => setMinCapacity(Number(e.target.value))}
                style={{ background:"#f7fafc", border:"1.5px solid #E6E1D6", borderRadius:10, padding:"9px 12px", fontSize:"0.88rem", fontFamily:"inherit", color:"#2d3748", outline:"none" }}>
                <option value={0}>{t("allCapacities")}</option>
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
              <label style={{ fontSize:"0.68rem", fontWeight:800, color:"#718096", textTransform:"uppercase", letterSpacing:0.8, display:"block", marginBottom:8 }}>{t("requiredEquipment")}</label>
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
            {filtered.length} {filtered.length > 1 ? t("busesAvailableCount") : t("busAvailable")}
            {activeType !== "tous" && ` · ${BUS_TYPES.find(bt => bt.key === activeType)?.label}`}
            {activeUsage !== "tous" && ` · ${USAGE_TYPES.find(u => u.key === activeUsage)?.label}`}
          </p>
          {(activeType !== "tous" || activeUsage !== "tous" || selectedAmenities.length > 0 || minCapacity > 0 || activeCity !== "") && (
            <button onClick={() => { setActiveType("tous"); setActiveUsage("tous"); setSelectedAmenities([]); setMinCapacity(0); setActiveCity(""); }}
              style={{ background:"none", border:"1.5px solid #E6E1D6", color:"#718096", fontWeight:700, fontSize:"0.78rem", borderRadius:20, padding:"5px 14px", cursor:"pointer", fontFamily:"inherit" }}>
              {t("resetFilters")} <Icon name="x" size={12} />
            </button>
          )}
        </div>

        {/* ── BUS GRID ── */}
        {filtered.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:20, border:"1px solid #E6E1D6", padding:"48px 32px", textAlign:"center" }}>
            <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}>
              <Icon name="bus" size={52} color="#a0aec0" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontWeight:800, color:"#0A2F1D", marginBottom:8 }}>{t("noBusFound")}</h3>
            <p style={{ color:"#718096", fontSize:"0.88rem" }}>{t("noBusDesc")}</p>
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
                        <Icon name="car" size={12} /> {t("driverIncluded")}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p style={{ color:"#718096", fontSize:"0.83rem", lineHeight:1.55, margin:0 }}>{bus.description}</p>

                  {/* Zones */}
                  <div>
                    <p style={{ fontSize:"0.65rem", fontWeight:800, color:"#a0aec0", textTransform:"uppercase", letterSpacing:0.8, margin:"0 0 6px 0" }}>{t("servedZones")}</p>
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
                    <p style={{ fontSize:"0.65rem", fontWeight:800, color:"#a0aec0", textTransform:"uppercase", letterSpacing:0.8, margin:"0 0 6px 0" }}>{t("equipment")}</p>
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
                      <p style={{ fontSize:"0.65rem", color:"#a0aec0", fontWeight:700, textTransform:"uppercase", margin:"0 0 2px 0" }}>{t("from")}</p>
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
                      <Icon name="bus" size={15} /> {t("requestQuote")}
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
          <h2 style={{ fontSize:"clamp(1.5rem,3vw,2rem)", fontWeight:900, color:"#fff", marginBottom:8 }}>{t("howRent")}</h2>
          <p style={{ color:"rgba(255,255,255,0.55)", fontSize:"0.92rem", marginBottom:48, maxWidth:480 }}>{t("howRentSubtitle")}</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:24 }}>
            {([
              { step:"01", icon:"search" as IconName, title: t("step01Title"), desc: t("step01Desc") },
              { step:"02", icon:"clipboard" as IconName, title: t("step02Title"), desc: t("step02Desc") },
              { step:"03", icon:"send" as IconName, title: t("step03Title"), desc: t("step03Desc") },
              { step:"04", icon:"bus" as IconName, title: t("step04Title"), desc: t("step04Desc") },
            ] as { step:string; icon:IconName; title:string; desc:string }[]).map(({ step, icon, title, desc }) => (
              <div key={step} style={{ background:"rgba(255,255,255,0.05)", borderRadius:18, border:"1px solid rgba(255,255,255,0.08)", padding:"24px 20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <span style={{ fontSize:"0.65rem", fontWeight:900, color:"rgba(252,209,22,0.7)", letterSpacing:1 }}>{t("step")} {step}</span>
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
        <h2 style={{ fontSize:"clamp(1.4rem,3vw,1.8rem)", fontWeight:900, color:"#0A2F1D", marginBottom:32 }}>{t("faqTitle")}</h2>
        {[
          { q: t("faq1q"), a: t("faq1a") },
          { q: t("faq2q"), a: t("faq2a") },
          { q: t("faq3q"), a: t("faq3a") },
          { q: t("faq4q"), a: t("faq4a") },
          { q: t("faq5q"), a: t("faq5a") },
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
        <p style={{ margin:"0 0 6px 0", fontWeight:700, color:"rgba(255,255,255,0.85)" }}>{t("footerTitle")}</p>
        <p style={{ margin:0 }}>{t("footerCopyright")}</p>
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
                <p style={{ fontSize:"0.62rem", color:"rgba(255,255,255,0.45)", fontWeight:700, margin:0, textTransform:"uppercase", letterSpacing:1 }}>{t("modalTitle")}</p>
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
                <h3 style={{ fontSize:"1.2rem", fontWeight:900, color:"#0A2F1D", marginBottom:8 }}>{t("quoteSent")}</h3>
                <p style={{ color:"#718096", fontSize:"0.88rem", lineHeight:1.6, marginBottom:28, maxWidth:380, margin:"0 auto 28px" }}>
                  Votre demande de devis a été envoyée via <strong style={{ color:"#25D366" }}>WhatsApp</strong>. L'agence vous répondra sous 2h.
                </p>
                <button onClick={() => setSelectedBus(null)} style={{ background:"#00673C", color:"#fff", border:"none", borderRadius:12, padding:"12px 32px", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:"0.9rem" }}>
                  {tc("close")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding:"24px 26px" }}>
                <p style={{ color:"#718096", fontSize:"0.83rem", lineHeight:1.5, margin:"0 0 22px 0" }}>
                  Remplissez ce formulaire. Notre équipe vous contacte sous <strong>2 heures</strong> pour confirmer la disponibilité et le tarif final.
                </p>

                {/* Personal info */}
                <p style={{ fontSize:"0.65rem", fontWeight:800, color:"#a0aec0", textTransform:"uppercase", letterSpacing:0.8, margin:"0 0 10px 0" }}>{t("yourCoords")}</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  {[
                    { label: t("yourName"), field:"clientName", placeholder:"Jean Dupont", type:"text" },
                    { label: t("yourPhone"), field:"clientPhone", placeholder:"+237 6XX XX XX XX", type:"tel" },
                  ].map(({ label, field, placeholder, type }) => (
                    <div key={field} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>{label}</label>
                      <input required={field.startsWith("client") && !field.includes("Email")} type={type} value={(form as unknown as Record<string, string>)[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
                        style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:18 }}>
                  <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>{t("emailOptional")}</label>
                  <input type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="vous@exemple.cm"
                    style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748" }} />
                </div>

                {/* Trip details */}
                <p style={{ fontSize:"0.65rem", fontWeight:800, color:"#a0aec0", textTransform:"uppercase", letterSpacing:0.8, margin:"0 0 10px 0" }}>{t("tripDetails")}</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  {[
                    { label: t("departCity"), field:"departCity", placeholder:"Douala" },
                    { label: t("destination"), field:"destination", placeholder:"Yaoundé / Kribi..." },
                  ].map(({ label, field, placeholder }) => (
                    <div key={field} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>{label}</label>
                      <input type="text" value={(form as unknown as Record<string, string>)[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
                        style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  {[
                    { label: t("startDate"), field:"startDate", type:"date" },
                    { label: t("endDate"), field:"endDate", type:"date" },
                  ].map(({ label, field, type }) => (
                    <div key={field} style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>{label}</label>
                      <input type={type} value={(form as unknown as Record<string, string>)[field]}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>{t("passengerCount")}</label>
                    <input type="number" min={1} max={selectedBus.capacity} value={form.passengers}
                      onChange={e => setForm(f => ({ ...f, passengers: e.target.value }))} placeholder={`Max. ${selectedBus.capacity}`}
                      style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748" }} />
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>{t("rentalType")}</label>
                    <select value={form.durationType} onChange={e => setForm(f => ({ ...f, durationType: e.target.value }))}
                      style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748" }}>
                      <option value="jour">{t("perDay")}</option>
                      <option value="trajet">{t("perTrip")}</option>
                      <option value="semaine">{t("perWeek")}</option>
                    </select>
                  </div>
                </div>

                {/* Driver + Extras */}
                <div style={{ background:"#f7fafc", borderRadius:12, padding:"14px 16px", marginBottom:18 }}>
                  <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                    <input type="checkbox" checked={form.withDriver} onChange={e => setForm(f => ({ ...f, withDriver: e.target.checked }))} style={{ width:16, height:16, accentColor:"#00673C" }} />
                    <span style={{ fontSize:"0.88rem", fontWeight:700, color:"#0A2F1D", display:"inline-flex", alignItems:"center", gap:6 }}>
                      <Icon name="car" size={16} style={{ flexShrink:0 }} /> {t("includeDriver")}
                    </span>
                  </label>
                </div>

                {/* Optional extras */}
                <p style={{ fontSize:"0.65rem", fontWeight:800, color:"#a0aec0", textTransform:"uppercase", letterSpacing:0.8, margin:"0 0 8px 0" }}>{t("extraOptions")}</p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
                  {[t("extra_guide"), t("extra_sono"), t("extra_deco"), t("extra_catering"), t("extra_gps")].map(opt => (
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
                  <label style={{ fontSize:"0.68rem", fontWeight:700, color:"#4a5568", textTransform:"uppercase", letterSpacing:0.5 }}>{t("messageLabel")}</label>
                  <textarea rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder={t("messagePlaceholder")}
                    style={{ background:"#f7fafc", border:"1.5px solid #e2e8f0", borderRadius:10, padding:"10px 12px", fontSize:"0.88rem", outline:"none", fontFamily:"inherit", color:"#2d3748", resize:"vertical" }} />
                </div>

                <button type="submit" disabled={submitting}
                  style={{ width:"100%", background: submitting ? "#a0aec0" : "#25D366", color:"#fff", fontWeight:900, fontSize:"0.95rem", padding:"14px", borderRadius:14, border:"none", cursor: submitting ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all 0.2s ease" }}>
                  {submitting
                    ? <><div style={{ width:18, height:18, border:"2px solid rgba(252,209,22,0.3)", borderTopColor:"#FCD116", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} /> {tc("sendingQuote")}</>
                    : <><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> {t("sendQuote")} via WhatsApp</>}
                </button>
                <p style={{ fontSize:"0.7rem", color:"#a0aec0", textAlign:"center", marginTop:10, lineHeight:1.5 }}>
                  {t("quoteNote")}
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
