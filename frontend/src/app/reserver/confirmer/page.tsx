"use client";

import styles from "./page.module.css";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUser } from "@/components/UserContext";

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
  busId?: string;
  busCapacity?: number;
  busClass?: string;
  busOccupied?: number;
  warning?: string;
  isNight?: boolean;
}

interface SeatIconProps {
  id: string;
  isSelected: boolean;
  isOccupied: boolean;
  isVip: boolean;
  onClick: () => void;
}

function SeatIcon({ id, isSelected, isOccupied, isVip, onClick }: SeatIconProps) {
  let strokeColor = "rgba(0, 192, 112, 0.4)";
  let fillColor = "rgba(0, 192, 112, 0.08)";
  let textColor = "#00673C";
  let armrestColor = "rgba(0, 192, 112, 0.15)";
  let headrestColor = "rgba(0, 192, 112, 0.12)";
  
  if (isOccupied) {
    strokeColor = "rgba(0, 0, 0, 0.15)";
    fillColor = "rgba(0, 0, 0, 0.04)";
    textColor = "rgba(0, 0, 0, 0.3)";
    armrestColor = "rgba(0, 0, 0, 0.06)";
    headrestColor = "rgba(0, 0, 0, 0.05)";
  } else if (isSelected) {
    strokeColor = "#d4a000";
    fillColor = "rgba(252, 209, 22, 0.35)";
    textColor = "#b28000";
    armrestColor = "rgba(252, 209, 22, 0.5)";
    headrestColor = "rgba(252, 209, 22, 0.4)";
  } else if (isVip) {
    strokeColor = "rgba(0, 103, 60, 0.6)";
    fillColor = "rgba(0, 103, 60, 0.15)";
    textColor = "#00673C";
    armrestColor = "rgba(0, 103, 60, 0.3)";
    headrestColor = "rgba(0, 103, 60, 0.25)";
  }

  return (
    <div 
      className={`${styles.seatWrapper} ${isSelected ? styles.seatWrapperSelected : ""} ${isOccupied ? styles.seatWrapperOccupied : ""}`}
      onClick={onClick}
      title={isOccupied ? "Occupé" : isVip ? `VIP ${id}` : id}
    >
      <svg 
        viewBox="0 0 100 100" 
        className={styles.seatSvg} 
      >
        {/* Seat Headrest */}
        <rect x="28" y="4" width="44" height="14" rx="6" fill={headrestColor} stroke={strokeColor} strokeWidth="3" />
        
        {/* Seat Backrest */}
        <rect x="18" y="16" width="64" height="50" rx="10" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
        
        {/* Backrest detailing line */}
        <path d="M 30,38 H 70" stroke={strokeColor} strokeWidth="2" strokeDasharray="4,4" fill="none" />
        
        {/* Left Armrest */}
        <rect x="7" y="28" width="10" height="46" rx="4" fill={armrestColor} stroke={strokeColor} strokeWidth="2" />
        
        {/* Right Armrest */}
        <rect x="83" y="28" width="10" height="46" rx="4" fill={armrestColor} stroke={strokeColor} strokeWidth="2" />
        
        {/* Seat Cushion */}
        <rect x="18" y="60" width="64" height="30" rx="8" fill={fillColor} stroke={strokeColor} strokeWidth="3" />
      </svg>
      <span className={styles.seatLabel} style={{ color: textColor }}>{id}</span>
    </div>
  );
}

export default function ConfirmerReservation() {
  const { user } = useUser();
  const [step, setStep] = useState(1); // 1=seat, 2=payment, 3=ticket
  const [journey, setJourney] = useState<Journey | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"om" | "momo" | "carte" | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "collecting" | "pending_ussd" | "success" | "failed">("idle");
  const [payunitRef, setPayunitRef] = useState("");
  const [qrToken, setQrToken] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastSuccess, setIsToastSuccess] = useState(true);

  // Voucher / Discount states
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; percentage: number } | null>(null);
  const [voucherError, setVoucherError] = useState("");

  const showToast = (message: string, isSuccess = true) => {
    setToastMessage(message);
    setIsToastSuccess(isSuccess);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const isVipBus = useMemo(() => {
    if (!journey) return false;
    const op = journey.operator.toLowerCase();
    return op.includes("vip") || op.includes("executive") || op.includes("exclusive");
  }, [journey]);

  const seatsList = useMemo(() => {
    const seats: { id: string; row: number; col: number; isVip: boolean; isOccupied: boolean }[] = [];
    const capacity = Math.max(1, journey?.busCapacity || 40);
    const totalRows = Math.ceil(capacity / 4);
    const cols = ["A", "B", "C", "D"];
    let seatNumber = 0;

    for (let row = 1; row <= totalRows; row++) {
      for (let colIdx = 0; colIdx < cols.length; colIdx++) {
        if (seatNumber >= capacity) break;
        const id = `${row}${cols[colIdx]}`;
        seatNumber++;
        const matchesOccupied = occupiedSeats.some(s => {
          const cleanSeat = s.split(" ")[0]?.trim();
          return cleanSeat === id;
        });

        seats.push({
          id,
          row,
          col: colIdx,
          isVip: isVipBus, // If the bus is VIP, all seats are VIP!
          isOccupied: matchesOccupied,
        });
      }
    }
    return seats;
  }, [occupiedSeats, isVipBus, journey?.busCapacity]);

  useEffect(() => {
    // Read booked journey from sessionStorage
    const saved = sessionStorage.getItem("safetrip_booking_journey");
    let journeyId = 0;
    if (saved) {
      const parsedJourney = JSON.parse(saved);
      setJourney(parsedJourney);
      journeyId = parsedJourney.id;
    }

    // Fetch occupied seats for this journey from the backend
    if (journeyId) {
      const fetchOccupiedSeats = async () => {
        const apiBase = ((typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) ? 'https://safe-trip-backend.vercel.app' : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://${window.location.hostname}:5000` : 'https://safe-trip-backend.vercel.app')));
        try {
          const res = await fetch(`${apiBase}/api/agency/journeys/${journeyId}/occupied-seats`);
          if (res.ok) {
            const data = await res.json();
            setOccupiedSeats(data || []);
          }
        } catch (err) {
          console.error("⚠️ Error fetching occupied seats:", err);
        }
      };
      fetchOccupiedSeats();
    }
  }, []);

  useEffect(() => {
    if (user) {
      setClientEmail(user.email || "");
      setClientName(user.fullName || user.email.split("@")[0] || "Voyageur SafeTrip");
      setClientPhone("+237 600 00 00 00");
    } else {
      setClientEmail("");
      setClientName("Voyageur SafeTrip");
      setClientPhone("+237 600 00 00 00");
    }
    // Generate ticket ID
    setTicketId(`ST-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`);
  }, [user]);

  // Compute final price after voucher discount
  const finalPrice = journey
    ? appliedVoucher
      ? Math.round(journey.price * (1 - appliedVoucher.percentage / 100))
      : journey.price
    : 0;

  const handleApplyVoucher = () => {
    setVoucherError("");
    if (!voucherCode.trim()) {
      setVoucherError("Veuillez saisir un code de bon de réduction.");
      return;
    }
    try {
      const vouchers: any[] = JSON.parse(sessionStorage.getItem("safetrip_vouchers") || "[]");
      const voucher = vouchers.find(
        (v: any) => v.code.toUpperCase() === voucherCode.trim().toUpperCase()
      );
      if (!voucher) {
        setVoucherError("Code invalide. Ce bon de réduction n'existe pas.");
        return;
      }
      if (voucher.status !== "published") {
        setVoucherError("Ce bon de réduction n'est pas encore disponible.");
        return;
      }
      if (voucher.currentUses >= voucher.maxUses) {
        setVoucherError("Ce bon de réduction a atteint sa limite d'utilisation.");
        return;
      }
      setAppliedVoucher({ code: voucher.code, percentage: voucher.percentage });
      showToast(`Bon de réduction appliqué ! −${voucher.percentage}% sur votre billet.`);
    } catch {
      setVoucherError("Erreur lors de la vérification du bon de réduction.");
    }
  };

  const consumeVoucher = () => {
    if (!appliedVoucher) return;
    try {
      const vouchers: any[] = JSON.parse(sessionStorage.getItem("safetrip_vouchers") || "[]");
      const updated = vouchers.map((v: any) =>
        v.code === appliedVoucher.code ? { ...v, currentUses: v.currentUses + 1 } : v
      );
      sessionStorage.setItem("safetrip_vouchers", JSON.stringify(updated));
    } catch { /* silent */ }
  };

  const awardLoyaltyPoints = (points: number) => {
    try {
      const current = parseInt(sessionStorage.getItem("safetrip_loyalty_points") || "0", 10);
      sessionStorage.setItem("safetrip_loyalty_points", String(current + points));
    } catch { /* silent */ }
  };

  const handleSeatClick = (seatId: string, isOccupied: boolean) => {
    if (isOccupied) return;
    setSelectedSeat(selectedSeat === seatId ? null : seatId);
  };

  const handlePay = async () => {
    if (!paymentMethod || !journey) return;
    if ((paymentMethod === "om" || paymentMethod === "momo") && !phoneNumber) {
      showToast("Veuillez renseigner votre numéro de téléphone payeur.", false);
      return;
    }
    if (paymentMethod === "carte" && !cardNumber) {
      showToast("Veuillez renseigner votre numéro de carte bancaire.", false);
      return;
    }

    setIsProcessing(true);
    const clientId = user?.id || null;
    const name = user?.fullName || clientName || "Jean Client";
    const phone = phoneNumber || clientPhone;
    const apiBase = ((typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) ? 'https://safe-trip-backend.vercel.app' : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://${window.location.hostname}:5000` : 'https://safe-trip-backend.vercel.app')));

    // Handle Card payment directly (Mock)
    if (paymentMethod === "carte") {
      try {
        const response = await fetch(`${apiBase}/api/client/reserver`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            journey_id: journey.id,
            client_id: clientId,
            name,
            phone,
            seat: selectedSeat,
            luggage_count: 1,
            payment_reference: cardNumber || transactionRef,
            price_paid: finalPrice,
            voucher_code: appliedVoucher?.code || null
          })
        });

        const data = await response.json();
        if (response.ok && data.ticketId) {
          consumeVoucher();
          awardLoyaltyPoints(Math.floor(finalPrice / 100));
          setTicketId(data.ticketId);
          if (data.qrToken) setQrToken(data.qrToken);
          showToast("Paiement par carte validé avec succès ! Votre billet a été généré. 🎉");
          setStep(3);
        } else {
          showToast(data.error || "Erreur de traitement du paiement.", false);
        }
      } catch (err) {
        console.error("⚠️ Error reserving ticket:", err);
        showToast("Erreur lors de la validation du paiement. Veuillez réessayer.", false);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Handle Mobile Money via PayUnit
    try {
      setPaymentStatus("collecting");
      
      // 1. Request PayUnit payment push (Collect)
      const collectRes = await fetch(`${apiBase}/api/payment/collect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: finalPrice,
          phone: phone,
          description: `Réservation SafeTrip - Siège ${selectedSeat} - Trajet ${journey.depStation.split(" - ")[0]} vers ${journey.arrStation.split(" - ")[0]}`
        })
      });

      const collectData = await collectRes.json();

      if (!collectRes.ok || !collectData.reference) {
        throw new Error(collectData.error || "Impossible d'initier la demande de paiement mobile.");
      }

      const txReference = collectData.reference;
      setPayunitRef(txReference);
      setPaymentStatus("pending_ussd");
      showToast("Demande de paiement envoyée sur votre téléphone ! Saisissez votre code PIN.", true);

      // 2. Poll transaction status
      let pollCount = 0;
      const maxPolls = 30; // 30 polls * 3s = 90 seconds timeout
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        if (pollCount > maxPolls) {
          clearInterval(pollInterval);
          setPaymentStatus("failed");
          setIsProcessing(false);
          showToast("Le délai de validation du paiement a expiré (90 secondes). Veuillez réessayer.", false);
          return;
        }

        try {
          const statusRes = await fetch(`${apiBase}/api/payment/status/${txReference}`);
          const statusData = await statusRes.json();

          if (statusRes.ok) {
            if (statusData.status === "SUCCESSFUL") {
              clearInterval(pollInterval);
              setPaymentStatus("success");
              
              // 3. Complete the reservation in database
              const reserveRes = await fetch(`${apiBase}/api/client/reserver`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                  journey_id: journey.id,
                  client_id: clientId,
                  name,
                  phone,
                  seat: selectedSeat,
                  luggage_count: 1,
                  payment_reference: txReference,
                  price_paid: finalPrice,
                  voucher_code: appliedVoucher?.code || null
                })
              });

              const reserveData = await reserveRes.json();

              if (reserveRes.ok && reserveData.ticketId) {
                consumeVoucher();
                awardLoyaltyPoints(Math.floor(finalPrice / 100));
                setTicketId(reserveData.ticketId);
                if (reserveData.qrToken) setQrToken(reserveData.qrToken);
                showToast("Paiement validé avec succès ! Votre billet a été généré. 🎉", true);
                setStep(3);
              } else {
                showToast(reserveData.error || "Paiement réussi mais erreur de création du billet. Veuillez contacter le support.", false);
              }
              setIsProcessing(false);
            } else if (statusData.status === "FAILED") {
              clearInterval(pollInterval);
              setPaymentStatus("failed");
              setIsProcessing(false);
              showToast(`Paiement échoué ou annulé par l'utilisateur. Raison: ${statusData.reason || 'Non spécifiée'}`, false);
            }
            // If "PENDING", do nothing and wait for next interval poll
          }
        } catch (pollErr) {
          console.error("Error polling PayUnit transaction status:", pollErr);
        }
      }, 3000);

    } catch (err: any) {
      console.error("⚠️ Mobile Money Payment error:", err);
      setPaymentStatus("failed");
      setIsProcessing(false);
      showToast(err.message || "Erreur d'initialisation du paiement Mobile Money.", false);
    }
  };


  const handleDownload = async () => {
    if (!journey) return;
    showToast("Génération du billet PDF en cours...");
    try {
      const { default: jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;
      const depCity = journey.depStation.split(" - ")[0]?.trim() || "Départ";
      const arrCity = journey.arrStation.split(" - ")[0]?.trim() || "Arrivée";
      const isVipSeat = seatsList.find((s: { id: string; isVip: boolean }) => s.id === selectedSeat)?.isVip ? "VIP" : "Standard";

      const ticketQrPayload = qrToken
        ? `STP|v1|${qrToken}`
        : [
          `SAFETRIP - BILLET DE VOYAGE`,
          `Réf: ${ticketId}`,
          `Agence: ${journey.operator}`,
          `-------------------------`,
          `PASSAGER:`,
          `Nom: ${clientName.toUpperCase()}`,
          `Tél: ${clientPhone}`,
          `-------------------------`,
          `VOYAGE:`,
          `De: ${depCity}`,
          `Vers: ${arrCity}`,
          `Date: ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`,
          `Départ: ${journey.depTime}`,
          `Siège: ${selectedSeat} (${isVipSeat})`
        ].join('\n');

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const safetripLogoUrl = `${origin}/images/logo-removebg-preview (2).png`;
      const agencyLogoUrl = journey.logo.startsWith('http') ? journey.logo : `${origin}${journey.logo}`;

      const pdfDiv = document.createElement("div");
      pdfDiv.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:794px;background:#EDE9DF;padding:0;margin:0;";
      pdfDiv.innerHTML = `
        <div style="width:794px;height:380px;background:#ffffff;border:2px solid rgba(230, 225, 214, 0.8);border-radius:24px;overflow:hidden;position:relative;display:flex;flex-direction:row;font-family:'Arial',sans-serif;box-shadow: 0 15px 30px rgba(0,0,0,0.04);">
          <!-- Left Side: Main Ticket (580px wide) -->
          <div style="width:580px;display:flex;flex-direction:column;border-right:2px dashed rgba(230, 225, 214, 0.8);padding:24px 32px;box-sizing:border-box;justify-content:space-between;">
             <!-- Header -->
             <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:12px;">
                   <img src="${safetripLogoUrl}" style="height:36px;width:auto;object-fit:contain;" crossOrigin="anonymous" />
                   <div>
                      <div style="color:#0B6B41;font-weight:900;font-size:18px;letter-spacing:-0.5px;line-height:1.1;">SafeTrip</div>
                      <div style="color:#718096;font-size:9px;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">Billet Officiel de Voyage</div>
                   </div>
                </div>
                <div style="display:flex;align-items:center;">
                   <img src="${agencyLogoUrl}" style="height:38px;width:auto;object-fit:contain;background:#ffffff;border-radius:8px;padding:4px 10px;border:1px solid #e2e8f0;" crossOrigin="anonymous" />
                </div>
             </div>
             
             <!-- Route -->
             <div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0;">
                <div>
                   <div style="font-size:9px;color:#a0aec0;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Départ</div>
                   <div style="font-size:28px;font-weight:900;color:#071A0E;line-height:1;">${depCity}</div>
                </div>
                <div style="text-align:center;flex:1;padding:0 20px;display:flex;flex-direction:column;align-items:center;gap:4px;">
                   <div style="font-size:11px;font-weight:800;color:#0B6B41;">${journey.operator}</div>
                   <div style="width:100%;height:2px;background:#00c070;position:relative;">
                      <div style="width:8px;height:8px;border-radius:50%;background:#0B6B41;position:absolute;top:-3px;left:calc(50% - 4px);"></div>
                   </div>
                   <div style="font-size:9px;color:#718096;font-weight:700;background:#f7fafc;padding:2px 8px;border-radius:10px;border:1px solid #edf2f7;">${journey.duration}</div>
                </div>
                <div style="text-align:right;">
                   <div style="font-size:9px;color:#a0aec0;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Arrivée</div>
                   <div style="font-size:28px;font-weight:900;color:#071A0E;line-height:1;">${arrCity}</div>
                </div>
             </div>
             
             <!-- Grid Info -->
             <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:10px;">
                <div style="background:#f7fffa;border:1px solid rgba(11,107,65,0.06);border-radius:12px;padding:10px 14px;">
                   <div style="font-size:8px;color:#718096;text-transform:uppercase;letter-spacing:0.8px;font-weight:800;">Passager</div>
                   <div style="font-size:14px;font-weight:800;color:#071A0E;margin-top:2px;">${clientName.toUpperCase()}</div>
                   <div style="font-size:9px;color:#718096;margin-top:1px;">${clientEmail}</div>
                </div>
                <div style="background:#f7fffa;border:1px solid rgba(11,107,65,0.06);border-radius:12px;padding:10px 14px;">
                   <div style="font-size:8px;color:#718096;text-transform:uppercase;letter-spacing:0.8px;font-weight:800;">Date &amp; Heure</div>
                   <div style="font-size:13px;font-weight:800;color:#071A0E;margin-top:2px;">${new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}</div>
                   <div style="font-size:10px;color:#0B6B41;font-weight:700;margin-top:1px;">${journey.depTime} → ${journey.arrTime}</div>
                </div>
             </div>
             
             <!-- Footer Details -->
             <div style="display:flex;justify-content:space-between;align-items:center;background:#fafafa;padding:10px 18px;border-radius:10px;">
                <div style="font-size:9px;color:#718096;font-weight:700;">Siège: <strong style="color:#0B6B41;font-size:11px;">${selectedSeat}</strong></div>
                <div style="font-size:9px;color:#718096;font-weight:700;">Classe: <strong style="color:#071A0E;font-size:11px;">${isVipSeat}</strong></div>
                <div style="font-size:9px;color:#718096;font-weight:700;">Tarif: <strong style="color:#c49000;font-size:11px;">${finalPrice.toLocaleString("fr-CM")} FCFA</strong></div>
             </div>
          </div>
          
          <!-- Right Side: Tear-off Stub (214px wide) -->
          <div style="width:214px;background:#f7fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box;text-align:center;position:relative;">
             <!-- Top and Bottom cutout notches overlay -->
             <div style="position:absolute;top:-12px;left:-12px;width:24px;height:24px;background:#EDE9DF;border-radius:50%;border:1px solid rgba(230, 225, 214, 0.8);"></div>
             <div style="position:absolute;bottom:-12px;left:-12px;width:24px;height:24px;background:#EDE9DF;border-radius:50%;border:1px solid rgba(230, 225, 214, 0.8);"></div>
             
             <div style="font-size:9px;font-weight:800;color:#718096;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Billet Unique</div>
             <div style="background:#ffffff;border:2px solid rgba(11, 107, 65, 0.15);border-radius:16px;padding:8px;box-shadow:0 8px 20px rgba(0,0,0,0.03);margin-bottom:12px;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=10&data=${encodeURIComponent(ticketQrPayload)}&color=071A0E" style="width:115px;height:115px;display:block;" crossOrigin="anonymous" />
             </div>
             <div style="font-family:monospace;font-size:11px;font-weight:800;color:#0B6B41;letter-spacing:0.5px;margin-bottom:4px;">${ticketId}</div>
             <div style="font-size:9px;font-weight:700;color:#2d3748;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${clientName.toUpperCase()}</div>
             <div style="font-size:8px;color:#a0aec0;margin-top:10px;">Scannez pour valider l'accès 🇨🇲</div>
          </div>
        </div>
      `;
      document.body.appendChild(pdfDiv);
      const canvas = await html2canvas(pdfDiv, { scale: 2, useCORS: true, backgroundColor: "#EDE9DF" });
      document.body.removeChild(pdfDiv);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`billet-safetrip-${ticketId}.pdf`);
      showToast(`Billet ${ticketId} téléchargé avec succès ! ✅`);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du téléchargement.", false);
    }
  };

  if (!journey) {
    return (
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Link href="/" className={styles.logoContainer}>
              <img src="/images/logo-removebg-preview (2).png" alt="SafeTrip Logo" className={styles.logoImage} />
            </Link>
          </div>
        </header>
        <div className={styles.stepperContainer}>
          <div style={{ textAlign: "center", paddingTop: "80px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2d3748", marginBottom: "12px" }}>Aucun voyage sélectionné</h2>
            <p style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.5)", marginBottom: "20px" }}>Veuillez d&apos;abord sélectionner un trajet sur la page de réservation.</p>
            <Link href="/reserver" style={{ background: "#00c070", color: "#ffffff", padding: "10px 24px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 800, textDecoration: "none" }}>
              ← Retour aux réservations
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const depCity = journey.depStation.split(" - ")[0]?.trim() || "Départ";
  const arrCity = journey.arrStation.split(" - ")[0]?.trim() || "Arrivée";
  const depCode = depCity.substring(0, 3).toUpperCase();
  const arrCode = arrCity.substring(0, 3).toUpperCase();

  return (
    <main className={styles.main}>
      {toastMessage && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          background: isToastSuccess ? "#00673C" : "#ef4444",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontWeight: "700",
          fontSize: "0.82rem",
          fontFamily: "'Poppins', sans-serif"
        }}>
          <span>{toastMessage}</span>
          <button 
            style={{ background: "none", border: "none", color: "#ffffff", fontSize: "1.1rem", cursor: "pointer", fontWeight: "900", padding: 0 }} 
            onClick={() => setToastMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logoContainer}>
            <img src="/images/logo-removebg-preview (2).png" alt="SafeTrip Logo" className={styles.logoImage} />
          </Link>
        </div>
      </header>

      <div className={styles.stepperContainer}>
        {/* Stepper Progress */}
        <div className={styles.stepper}>
          <div className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${step === 1 ? styles.stepCircleActive : step > 1 ? styles.stepCircleDone : ""}`}>
              {step > 1 ? "✓" : "1"}
            </div>
            <span className={`${styles.stepLabel} ${step === 1 ? styles.stepLabelActive : step > 1 ? styles.stepLabelDone : ""}`}>Choix du siège</span>
          </div>
          <div className={`${styles.stepLine} ${step > 1 ? styles.stepLineDone : ""}`}></div>
          <div className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${step === 2 ? styles.stepCircleActive : step > 2 ? styles.stepCircleDone : ""}`}>
              {step > 2 ? "✓" : "2"}
            </div>
            <span className={`${styles.stepLabel} ${step === 2 ? styles.stepLabelActive : step > 2 ? styles.stepLabelDone : ""}`}>Paiement</span>
          </div>
          <div className={`${styles.stepLine} ${step > 2 ? styles.stepLineDone : ""}`}></div>
          <div className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${step === 3 ? styles.stepCircleActive : ""}`}>3</div>
            <span className={`${styles.stepLabel} ${step === 3 ? styles.stepLabelActive : ""}`}>Billet</span>
          </div>
        </div>

        {/* ===== STEP 1: SEAT SELECTION ===== */}
        {step === 1 && (
          <div className={styles.seatSection}>
            <div className={styles.busContainer}>
              {/* Bus Cabin Header with windshield & driver compartment */}
              <div className={styles.cabinFront}>
                <div className={styles.windshield}>
                  <div className={styles.wiperLeft}></div>
                  <div className={styles.wiperRight}></div>
                </div>
                <div className={styles.driverSection}>
                  <div className={styles.driverSeatWrapper}>
                    <svg className={styles.steeringWheel} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v7M2 12h7M15 12h7" />
                    </svg>
                    <span className={styles.driverText}>Chauffeur</span>
                  </div>
                  
                  <div className={styles.entranceDoor}>
                    <span className={styles.doorIndicator}>🚪 Entrée</span>
                  </div>
                </div>
              </div>

              <div className={styles.seatGrid}>
                {seatsList.map((seat) => {
                  const isSelected = selectedSeat === seat.id;

                  // Insert aisle spacer between col B(1) and C(2)
                  const elements = [];
                  if (seat.col === 2) {
                    elements.push(<div key={`aisle-${seat.row}`} className={styles.aisle}></div>);
                  }
                  elements.push(
                    <SeatIcon
                      key={seat.id}
                      id={seat.id}
                      isSelected={isSelected}
                      isOccupied={seat.isOccupied}
                      isVip={seat.isVip}
                      onClick={() => handleSeatClick(seat.id, seat.isOccupied)}
                    />
                  );
                  return elements;
                })}
              </div>

              <div className={styles.seatLegend}>
                {!isVipBus ? (
                  <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: "rgba(0,192,112,0.12)", border: "2px solid rgba(0,192,112,0.2)" }}></div>
                    Disponible (Classique)
                  </div>
                ) : (
                  <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: "rgba(0,103,60,0.2)", border: "2px solid rgba(0,192,112,0.3)" }}></div>
                    Siège VIP Disponible
                  </div>
                )}
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: "rgba(252,209,22,0.2)", border: "2px solid #d4a000" }}></div>
                  Sélectionné
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: "rgba(0,0,0,0.04)", border: "2px solid rgba(0,0,0,0.06)" }}></div>
                  Occupé
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Récapitulatif du voyage</h3>
              <div className={styles.summaryDivider}></div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Trajet</span>
                <span className={styles.summaryValue}>{depCity} → {arrCity}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Compagnie</span>
                <span className={styles.summaryValue}>{journey.operator}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Heure</span>
                <span className={styles.summaryValue}>{journey.depTime} — {journey.arrTime}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Durée</span>
                <span className={styles.summaryValue}>{journey.duration}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Siège choisi</span>
                <span className={styles.summaryValue} style={{ color: selectedSeat ? "#d4a000" : "rgba(0,0,0,0.3)" }}>
                  {selectedSeat || "Aucun"}
                </span>
              </div>
              <div className={styles.summaryDivider}></div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Prix indicatif</span>
                <span className={styles.summaryTotal}>CFA {journey.price.toLocaleString()}</span>
              </div>
              <button
                className={styles.continueBtn}
                disabled={!selectedSeat}
                onClick={() => setStep(2)}
              >
                Continuer vers le paiement →
              </button>
              <Link href="/reserver" className={styles.backLink} style={{ textAlign: "center" }}>
                ← Retour aux trajets
              </Link>
            </div>
          </div>
        )}

        {/* ===== STEP 2: PAYMENT ===== */}
        {step === 2 && (
          <div className={styles.paymentSection}>
            <div className={styles.paymentMethods}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#2d3748", margin: "0 0 6px" }}>Choisissez votre mode de paiement</h3>
              <p style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.4)", margin: "0 0 16px" }}>Paiement sécurisé via nos partenaires certifiés</p>

              {/* Orange Money */}
              {/* Orange Money */}
              <div
                className={`${styles.paymentMethodCard} ${paymentMethod === "om" ? styles.paymentMethodCardActive : ""}`}
                onClick={() => setPaymentMethod("om")}
              >
                <div className={styles.paymentIcon}>
                  <img 
                    src="/images/orange money.png" 
                    alt="Orange Money Logo" 
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} 
                  />
                </div>
                <div className={styles.paymentMethodInfo}>
                  <div className={styles.paymentMethodName}>Orange Money</div>
                  <div className={styles.paymentMethodDesc}>Payez avec votre compte Orange Money</div>
                </div>
                <div className={`${styles.paymentRadio} ${paymentMethod === "om" ? styles.paymentRadioActive : ""}`}>
                  {paymentMethod === "om" && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffffff" }}></div>}
                </div>
              </div>

              {/* MTN MoMo */}
              <div
                className={`${styles.paymentMethodCard} ${paymentMethod === "momo" ? styles.paymentMethodCardActive : ""}`}
                onClick={() => setPaymentMethod("momo")}
              >
                <div className={styles.paymentIcon}>
                  <img 
                    src="/images/mtn mobile money.png" 
                    alt="MTN Mobile Money Logo" 
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} 
                  />
                </div>
                <div className={styles.paymentMethodInfo}>
                  <div className={styles.paymentMethodName}>MTN Mobile Money</div>
                  <div className={styles.paymentMethodDesc}>Payez avec votre compte MTN MoMo</div>
                </div>
                <div className={`${styles.paymentRadio} ${paymentMethod === "momo" ? styles.paymentRadioActive : ""}`}>
                  {paymentMethod === "momo" && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffffff" }}></div>}
                </div>
              </div>

              {/* Carte Bancaire */}
              <div
                className={`${styles.paymentMethodCard} ${paymentMethod === "carte" ? styles.paymentMethodCardActive : ""}`}
                onClick={() => setPaymentMethod("carte")}
              >
                <div className={styles.paymentIcon} style={{ background: "rgba(0, 102, 204, 0.15)", color: "#0066CC" }}>
                  💳
                </div>
                <div className={styles.paymentMethodInfo}>
                  <div className={styles.paymentMethodName}>Carte Bancaire</div>
                  <div className={styles.paymentMethodDesc}>Visa, Mastercard, ou carte locale</div>
                </div>
                <div className={`${styles.paymentRadio} ${paymentMethod === "carte" ? styles.paymentRadioActive : ""}`}>
                  {paymentMethod === "carte" && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffffff" }}></div>}
                </div>
              </div>

              {/* Payment Form */}
              {paymentMethod && (
                <div className={styles.paymentFormArea} style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #edf2f7", marginTop: "15px" }}>
                  {paymentStatus === "idle" || paymentMethod === "carte" ? (
                    <>
                      <div className={styles.paymentFormTitle} style={{ fontWeight: 800, color: "#1a202c", marginBottom: "12px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {paymentMethod === "om" ? "Paiement par Orange Money" : paymentMethod === "momo" ? "Paiement par MTN Mobile Money" : "Informations de Carte Bancaire"}
                      </div>

                      {(paymentMethod === "om" || paymentMethod === "momo") ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                          <div className={styles.inputGroup} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <label style={{ fontSize: "0.7rem", fontWeight: "800", color: "#718096" }}>VOTRE NUMÉRO DE TÉLÉPHONE PAYEUR</label>
                            <input
                              type="text"
                              className={styles.paymentInput}
                              placeholder={paymentMethod === "om" ? "ex: 699 01 22 33" : "ex: 677 44 55 66"}
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            className={styles.paymentInput}
                            placeholder="ex: 4242 4242 4242 4242"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                          />
                          <div style={{ display: "flex", gap: "10px" }}>
                            <input type="text" className={styles.paymentInput} placeholder="MM/AA" style={{ flex: 1 }} />
                            <input type="text" className={styles.paymentInput} placeholder="CVV" style={{ flex: 1 }} />
                          </div>
                        </>
                      )}

                      <button
                        className={styles.payBtn}
                        onClick={handlePay}
                        disabled={isProcessing || ((paymentMethod === "om" || paymentMethod === "momo") && !phoneNumber) || (paymentMethod === "carte" && !cardNumber)}
                        style={{ marginTop: "15px", width: "100%", height: "45px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: isProcessing ? "#cbd5e0" : "#00c070", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: "800", cursor: "pointer" }}
                      >
                        {isProcessing ? (
                          <>
                            <div className={styles.spinner}></div>
                            Traitement de la transaction...
                          </>
                        ) : (
                          `Valider le paiement • CFA ${finalPrice.toLocaleString()}`
                        )}
                      </button>
                    </>
                  ) : paymentStatus === "collecting" ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 10px", textAlign: "center" }}>
                      <div className={styles.spinner} style={{ width: "40px", height: "40px", marginBottom: "15px" }}></div>
                      <h4 style={{ fontWeight: 800, margin: "0 0 8px", fontSize: "0.95rem", color: "#2d3748" }}>Initialisation du paiement sécurisé...</h4>
                      <p style={{ fontSize: "0.75rem", color: "#718096", margin: 0 }}>Nous contactons la passerelle PayUnit. Veuillez patienter.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 0", textAlign: "center" }}>
                      <div className={styles.spinner} style={{ width: "45px", height: "45px", marginBottom: "15px" }}></div>
                      <h4 style={{ fontWeight: 800, margin: "0 0 8px", fontSize: "0.95rem", color: "#0B6B41" }}>📱 Popup d'autorisation envoyé !</h4>
                      <p style={{ fontSize: "0.78rem", color: "#2d3748", fontWeight: 700, margin: "0 0 12px" }}>
                        Vérifiez l'écran du téléphone <span style={{ fontFamily: "monospace", color: "#00c070", fontSize: "0.85rem" }}>{phoneNumber}</span>
                      </p>
                      
                      <div style={{ background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", width: "100%", textAlign: "left", marginBottom: "15px" }}>
                        <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "0.72rem", color: "#4a5568", display: "flex", flexDirection: "column", gap: "6px" }}>
                          <li>Un message de confirmation s'affiche sur votre téléphone portable.</li>
                          <li>Saisissez votre <strong>code secret PIN</strong> Orange Money ou MTN Mobile Money.</li>
                          <li>Validez l'opération. Votre billet sera généré automatiquement ici dans quelques instants.</li>
                        </ol>
                      </div>
                      
                      <p style={{ fontSize: "0.68rem", color: "#a0aec0", margin: 0 }}>
                        ID Transaction : <span style={{ fontFamily: "monospace" }}>{payunitRef}</span>
                      </p>
                      <button 
                        onClick={() => { setPaymentStatus("idle"); setIsProcessing(false); }} 
                        style={{ marginTop: "12px", background: "none", border: "none", color: "#e53e3e", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                      >
                        Annuler et réessayer
                      </button>
                    </div>
                  )}
                </div>
              )}


              <button onClick={() => setStep(1)} className={styles.backLink} style={{ marginTop: "8px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                ← Retour au choix du siège
              </button>
            </div>

            {/* Summary Card */}
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Votre réservation</h3>
              <div className={styles.summaryDivider}></div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Trajet</span>
                <span className={styles.summaryValue}>{depCity} → {arrCity}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Compagnie</span>
                <span className={styles.summaryValue}>{journey.operator}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Heure</span>
                <span className={styles.summaryValue}>{journey.depTime} — {journey.arrTime}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Siège</span>
                <span className={styles.summaryValue} style={{ color: "#d4a000" }}>{selectedSeat}</span>
              </div>

              {/* Voucher input */}
              <div className={styles.summaryDivider}></div>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "0.65rem", fontWeight: 800, color: "#718096", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
                  Bon de réduction
                </label>
                {appliedVoucher ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(11,107,65,0.06)", border: "1px solid rgba(11,107,65,0.2)", borderRadius: "8px", padding: "8px 12px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0B6B41", flex: 1 }}>
                      ✓ {appliedVoucher.code} — −{appliedVoucher.percentage}%
                    </span>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#718096", fontSize: "0.85rem", cursor: "pointer", padding: 0 }}
                      onClick={() => { setAppliedVoucher(null); setVoucherCode(""); }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        type="text"
                        placeholder="ex: PROMO15"
                        value={voucherCode}
                        onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(""); }}
                        style={{ flex: 1, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, outline: "none", fontFamily: "monospace" }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        style={{ background: "#0B6B41", color: "#fff", border: "none", borderRadius: "8px", padding: "7px 12px", fontSize: "0.72rem", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Appliquer
                      </button>
                    </div>
                    {voucherError && (
                      <p style={{ fontSize: "0.67rem", color: "#e53e3e", marginTop: "4px", fontWeight: 600 }}>{voucherError}</p>
                    )}
                  </>
                )}
              </div>

              <div className={styles.summaryDivider}></div>
              {appliedVoucher && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel} style={{ color: "#718096", textDecoration: "line-through" }}>Prix original</span>
                  <span className={styles.summaryValue} style={{ color: "#718096", textDecoration: "line-through" }}>CFA {journey.price.toLocaleString()}</span>
                </div>
              )}
              {appliedVoucher && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel} style={{ color: "#0B6B41" }}>Réduction ({appliedVoucher.percentage}%)</span>
                  <span className={styles.summaryValue} style={{ color: "#0B6B41", fontWeight: 800 }}>−CFA {(journey.price - finalPrice).toLocaleString()}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Total à payer</span>
                <span className={styles.summaryTotal}>CFA {finalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 3: TICKET GENERATED ===== */}
        {step === 3 && (
          <div className={styles.ticketSection}>
            <div className={styles.ticketSuccessMsg}>
              <h2>✅ Paiement effectué avec succès !</h2>
              <p>Votre billet a été généré. Téléchargez-le ci-dessous.</p>
            </div>

            <div className={styles.ticketCard}>
              {/* Ticket Header with logos */}
              <div className={styles.ticketHeader}>
                <div className={styles.ticketHeaderLeft}>
                  <img src="/images/logo-removebg-preview (2).png" alt="SafeTrip" className={styles.ticketLogo} />
                  <div>
                    <div className={styles.ticketHeaderTitle}>SafeTrip Cameroun</div>
                    <div className={styles.ticketHeaderSub}>E-Billet de Voyage</div>
                  </div>
                </div>
                <img src={journey.logo} alt={journey.operator} className={styles.ticketAgencyLogo} />
              </div>

              {/* Ticket Body */}
              <div className={styles.ticketBody}>
                {/* Route */}
                <div className={styles.ticketRoute}>
                  <div className={styles.ticketCity}>
                    <div className={styles.ticketCityCode}>{depCode}</div>
                    <div className={styles.ticketCityName}>{depCity}</div>
                  </div>
                  <div className={styles.ticketRouteMiddle}>
                    <span className={styles.ticketOperator}>{journey.operator}</span>
                    <div className={styles.ticketRouteLine}>
                      <div className={styles.ticketRouteDot}></div>
                    </div>
                    <span className={styles.ticketDuration}>{journey.duration}</span>
                  </div>
                  <div className={styles.ticketCity}>
                    <div className={styles.ticketCityCode}>{arrCode}</div>
                    <div className={styles.ticketCityName}>{arrCity}</div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className={styles.ticketDetailsGrid}>
                  <div className={styles.ticketDetail}>
                    <span className={styles.ticketDetailLabel}>Date</span>
                    <span className={styles.ticketDetailValue}>
                      {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div className={styles.ticketDetail}>
                    <span className={styles.ticketDetailLabel}>Heure de départ</span>
                    <span className={styles.ticketDetailValue}>{journey.depTime}</span>
                  </div>
                  <div className={styles.ticketDetail}>
                    <span className={styles.ticketDetailLabel}>Heure d&apos;arrivée</span>
                    <span className={styles.ticketDetailValue}>{journey.arrTime}</span>
                  </div>
                  <div className={styles.ticketDetail}>
                    <span className={styles.ticketDetailLabel}>Siège</span>
                    <span className={`${styles.ticketDetailValue} ${styles.ticketDetailValueGreen}`}>{selectedSeat}</span>
                  </div>
                  <div className={styles.ticketDetail}>
                    <span className={styles.ticketDetailLabel}>Classe</span>
                    <span className={styles.ticketDetailValue}>{seatsList.find((s: { id: string; isVip: boolean }) => s.id === selectedSeat)?.isVip ? "VIP" : "Standard"}</span>
                  </div>
                  <div className={styles.ticketDetail}>
                    <span className={styles.ticketDetailLabel}>Tarif payé</span>
                    <span className={`${styles.ticketDetailValue} ${styles.ticketDetailValueGold}`}>
                      CFA {finalPrice.toLocaleString()}
                      {appliedVoucher && <span style={{ fontSize: "0.65rem", color: "#0B6B41", marginLeft: "4px" }}>(-{appliedVoucher.percentage}%)</span>}
                    </span>
                  </div>
                </div>

                {/* Passenger Info */}
                <div className={styles.ticketPassengerRow}>
                  <div className={styles.ticketPassengerInfo}>
                    <span className={styles.ticketPassengerName}>{clientName.toUpperCase()}</span>
                    <span className={styles.ticketPassengerContact}>{clientEmail} • {clientPhone}</span>
                  </div>
                  <div className={styles.ticketQr}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=10&data=${encodeURIComponent(qrToken ? `STP|v1|${qrToken}` : [
                        `SAFETRIP - BILLET DE VOYAGE`,
                        `Réf: ${ticketId}`,
                        `Agence: ${journey?.operator || ''}`,
                        `-------------------------`,
                        `PASSAGER:`,
                        `Nom: ${clientName.toUpperCase()}`,
                        `Tél: ${clientPhone}`,
                        `-------------------------`,
                        `VOYAGE:`,
                        `De: ${journey?.depStation.split(" - ")[0]?.trim() || ''}`,
                        `Vers: ${journey?.arrStation.split(" - ")[0]?.trim() || "Arrivée"}`,
                        `Date: ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`,
                        `Départ: ${journey?.depTime || ''}`,
                        `Siège: ${selectedSeat}`
                      ].join('\n'))}&color=071A0E`} 
                      alt="Code QR unique du billet" 
                      className={styles.qrImage}
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              </div>

              {/* Ticket Footer */}
              <div className={styles.ticketFooter}>
                <span className={styles.ticketFooterText}>SafeTrip Cameroun — Rapprochons nos régions en toute sécurité 🇨🇲</span>
                <span className={styles.ticketId}>{ticketId}</span>
              </div>
            </div>

            <button className={styles.downloadBtn} onClick={handleDownload}>
              📥 Télécharger le billet (PDF)
            </button>

            <Link href="/reserver" className={styles.backLink}>
              ← Retour à la page de réservation
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
