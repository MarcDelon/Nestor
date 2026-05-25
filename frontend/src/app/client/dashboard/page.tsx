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

export default function ClientDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clientActiveTab, setClientActiveTab] = useState("dashboard");
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
          <div style="display: flex; height: 6px;">
            <div style="flex: 1; background: #007A5E;"></div>
            <div style="flex: 1; background: #CE1126;"></div>
            <div style="flex: 1; background: #FCD116;"></div>
          </div>
          <div style="display: flex; justify-content: center; padding: 15px 0 10px 0;">
            <div style="width: 16px; height: 16px; border-radius: 50%; border: 3px double #a0aec0; background: #ffffff;"></div>
          </div>
          <div style="background: #0A2F1D; color: #ffffff; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: 900; font-size: 14px; letter-spacing: -0.5px;">SafeTrip</div>
            <div style="background: rgba(255,255,255,0.15); border-radius: 6px; padding: 3px 8px; font-size: 10px; font-weight: bold;">
              \${colis.agency}
            </div>
          </div>
          <div style="padding: 15px 20px 5px 20px; text-align: left;">
            <span style="font-size: 8px; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 2px;">Document Officiel</span>
            <span style="font-size: 16px; font-weight: 900; color: #0A2F1D; text-transform: uppercase; letter-spacing: 0.5px;">ÉTIQUETTE BAGAGE</span>
          </div>
          <div style="border-bottom: 2px dashed #cbd5e0; margin: 10px 20px;"></div>
          <div style="padding: 5px 20px; text-align: left;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="padding: 6px 0; color: #718096; width: 45%;">RÉFÉRENCE</td>
                <td style="padding: 6px 0; font-weight: bold; color: #00673C; text-align: right;">\${colis.id}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">VOYAGEUR</td>
                <td style="padding: 6px 0; font-weight: bold; color: #1a202c; text-align: right;">Marc Nzenang</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">TRAJET</td>
                <td style="padding: 6px 0; font-weight: bold; color: #1a202c; text-align: right;">\${colis.trip}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">DATE DE DÉPART</td>
                <td style="padding: 6px 0; font-weight: bold; color: #1a202c; text-align: right;">\${colis.tripDate.split(" · ")[0]}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">TYPE D'OBJET</td>
                <td style="padding: 6px 0; font-weight: bold; color: #1a202c; text-align: right;">\${colis.type} (\${colis.color})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;">POIDS ENREGISTRÉ</td>
                <td style="padding: 6px 0; font-weight: 800; color: #00673C; text-align: right; font-size: 12px;">\${colis.weight} KG</td>
              </tr>
              \${dimensionsRow}
              \${fragileRow}
            </table>
          </div>
          <div style="border-bottom: 2px dashed #cbd5e0; margin: 15px 20px;"></div>
          <div style="padding: 10px 20px 25px 20px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div style="display: flex; height: 35px; justify-content: center; width: 100%;">
              \${barcodeHtml}
            </div>
            <div style="font-family: monospace; font-size: 10px; font-weight: bold; color: #4a5568; letter-spacing: 3px;">
              \${colis.qrRef}
            </div>
          </div>
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
            <div className={styles.billetPageHeader}>
              <div>
                <h2 className={styles.billetPageTitle} style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"18px",height:"18px",color:"#00673C"}}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                  Mes Billets de Voyage
                </h2>
                <p className={styles.billetPageSub}>{MOCK_BILLETS.length} billet{MOCK_BILLETS.length > 1 ? "s" : ""} trouvé{MOCK_BILLETS.length > 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className={styles.billetList}>
              {MOCK_BILLETS.map((billet) => (
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:"18px",height:"18px",color:"#00673C"}}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  Suivi de mes Colis &amp; Bagages
                </h2>
                <p className={styles.billetPageSub}>{MOCK_COLIS.length} article{MOCK_COLIS.length > 1 ? "s" : ""} enregistré{MOCK_COLIS.length > 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className={styles.billetList}>
              {MOCK_COLIS.map((colis) => {
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
              })}
            </div>

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
                        PDF
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

                    <div className={styles.dlPerforated}>
                      <div className={styles.dlCircleLeft}></div>
                      <div className={styles.dlDots}></div>
                      <div className={styles.dlCircleRight}></div>
                    </div>

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
