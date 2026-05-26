"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
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

// Generate bus seats (40 seats, rows of 4 with aisle)
function generateSeats() {
  const seats: { id: string; row: number; col: number; isVip: boolean; isOccupied: boolean }[] = [];
  const occupiedIds = new Set(["1A", "1B", "2D", "3A", "4C", "5B", "6D", "7A", "8C", "9B", "10D"]);
  const totalRows = 10;
  const cols = ["A", "B", "C", "D"];

  for (let row = 1; row <= totalRows; row++) {
    for (let colIdx = 0; colIdx < cols.length; colIdx++) {
      const id = `${row}${cols[colIdx]}`;
      seats.push({
        id,
        row,
        col: colIdx,
        isVip: row <= 3,
        isOccupied: occupiedIds.has(id),
      });
    }
  }
  return seats;
}

const ALL_SEATS = generateSeats();

export default function ConfirmerReservation() {
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

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastSuccess, setIsToastSuccess] = useState(true);

  const showToast = (message: string, isSuccess = true) => {
    setToastMessage(message);
    setIsToastSuccess(isSuccess);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  useEffect(() => {
    // Read booked journey from localStorage
    const saved = localStorage.getItem("safetrip_booking_journey");
    if (saved) {
      setJourney(JSON.parse(saved));
    }

    // Read client info
    const activeEmail = localStorage.getItem("safetrip_user_email") || "";
    setClientEmail(activeEmail);
    setClientName(localStorage.getItem("safetrip_user_name") || activeEmail.split("@")[0] || "Voyageur SafeTrip");
    setClientPhone(localStorage.getItem("safetrip_user_phone") || "+237 600 00 00 00");

    // Generate ticket ID
    setTicketId(`ST-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`);
  }, []);

  const handleSeatClick = (seatId: string, isOccupied: boolean) => {
    if (isOccupied) return;
    setSelectedSeat(selectedSeat === seatId ? null : seatId);
  };

  const handlePay = async () => {
    if (!paymentMethod || !journey) return;
    if ((paymentMethod === "om" || paymentMethod === "momo") && (!phoneNumber || !transactionRef)) {
      showToast("Veuillez renseigner votre numéro de téléphone et la référence de transaction SMS.", false);
      return;
    }
    if (paymentMethod === "carte" && !cardNumber) {
      showToast("Veuillez renseigner votre numéro de carte bancaire.", false);
      return;
    }

    setIsProcessing(true);

    const clientId = localStorage.getItem("safetrip_user_id");
    const name = localStorage.getItem("safetrip_user_name") || clientName || "Jean Client";
    const phone = phoneNumber || clientPhone;

    try {
      const response = await fetch("http://localhost:5000/api/client/reserver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journey_id: journey.id,
          client_id: clientId,
          name,
          phone,
          seat: selectedSeat,
          luggage_count: 1, // Bagage par défaut pour la démo
          payment_reference: transactionRef || cardNumber
        })
      });

      const data = await response.json();

      if (response.ok && data.ticketId) {
        setTicketId(data.ticketId);
        showToast("Paiement validé avec succès ! Votre billet a été généré. 🎉");
        
        // Stockage dans l'historique local pour enrichir le dashboard voyageur
        const newTicket = {
          id: data.ticketId,
          from: journey.depStation.split(" - ")[0]?.trim(),
          to: journey.arrStation.split(" - ")[0]?.trim(),
          company: journey.operator,
          companyLogo: journey.logo,
          date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
          depTime: journey.depTime,
          arrTime: journey.arrTime,
          duration: journey.duration,
          seat: selectedSeat,
          luggageCount: 1,
          status: "Actif",
          price: journey.price,
          depStation: journey.depStation,
          arrStation: journey.arrStation,
          passenger: name,
          phone: phone,
          busClass: journey.operator?.split(' ').slice(-1)[0] || 'Confort'
        };
        const currentHist = JSON.parse(localStorage.getItem("safetrip_journeys") || "[]");
        localStorage.setItem("safetrip_journeys", JSON.stringify([newTicket, ...currentHist]));
        
        // Stockage également du colis bagage lié
        const newColis = {
          id: `BAG-2026-FX${journey.id.toString().slice(-2)}-${Math.floor(Math.random() * 100)}`,
          label: `Bagage principal de ${name}`,
          type: "Sac",
          weight: 15,
          color: "Noir",
          status: "En attente de scan",
          trip: `${journey.depStation.split(" - ")[0]?.trim()} → ${journey.arrStation.split(" - ")[0]?.trim()}`,
          tripDate: `${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })} · ${journey.depTime}`,
          agency: journey.operator.split(" VIP")[0].split(" Confort")[0].split(" Classique")[0],
          agencyLogo: journey.logo,
          qrRef: `QR-FX${journey.id.toString().slice(-2)}-LUGGAGE`,
          fragile: false
        };
        const currentColisHist = JSON.parse(localStorage.getItem("safetrip_colis_db") || "[]");
        localStorage.setItem("safetrip_colis_db", JSON.stringify([newColis, ...currentColisHist]));

        setStep(3);
      } else {
        showToast(data.error || "Erreur de traitement du paiement.", false);
      }
    } catch (err) {
      console.warn("⚠️ API hors ligne. Validation en mode simulation locale...", err);
      
      const mockTicketId = `ST-2026-FX${Math.floor(Math.random() * 1000) + 200}`;
      setTicketId(mockTicketId);
      
      const newTicket = {
        id: mockTicketId,
        from: journey.depStation.split(" - ")[0]?.trim(),
        to: journey.arrStation.split(" - ")[0]?.trim(),
        company: journey.operator,
        companyLogo: journey.logo,
        date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
        depTime: journey.depTime,
        arrTime: journey.arrTime,
        duration: journey.duration,
        seat: selectedSeat,
        luggageCount: 1,
        status: "Actif",
        price: journey.price,
        depStation: journey.depStation,
        arrStation: journey.arrStation,
        passenger: name,
        phone: phone,
        busClass: journey.operator?.split(' ').slice(-1)[0] || 'Confort'
      };
      const currentHist = JSON.parse(localStorage.getItem("safetrip_journeys") || "[]");
      localStorage.setItem("safetrip_journeys", JSON.stringify([newTicket, ...currentHist]));

      const newColis = {
        id: `BAG-2026-FX${journey.id.toString().slice(-2)}-${Math.floor(Math.random() * 100)}`,
        label: `Bagage principal de ${name}`,
        type: "Sac",
        weight: 15,
        color: "Noir",
        status: "En attente de scan",
        trip: `${journey.depStation.split(" - ")[0]?.trim()} → ${journey.arrStation.split(" - ")[0]?.trim()}`,
        tripDate: `${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })} · ${journey.depTime}`,
        agency: journey.operator.split(" VIP")[0].split(" Confort")[0].split(" Classique")[0],
        agencyLogo: journey.logo,
        qrRef: `QR-FX${journey.id.toString().slice(-2)}-LUGGAGE`,
        fragile: false
      };
      const currentColisHist = JSON.parse(localStorage.getItem("safetrip_colis_db") || "[]");
      localStorage.setItem("safetrip_colis_db", JSON.stringify([newColis, ...currentColisHist]));

      showToast("Paiement validé avec succès ! Billet généré (Simulation). 🎉");
      setStep(3);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    window.print();
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
              <div className={styles.busFront}>
                <svg className={styles.busFrontIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4l2 2" />
                </svg>
                Avant du bus — {journey.operator}
              </div>

              <div className={styles.seatGrid}>
                {ALL_SEATS.map((seat) => {
                  const isSelected = selectedSeat === seat.id;
                  const seatClass = seat.isOccupied
                    ? styles.seatOccupied
                    : isSelected
                    ? styles.seatSelected
                    : seat.isVip
                    ? styles.seatVip
                    : styles.seatAvailable;

                  // Insert aisle spacer between col B(1) and C(2)
                  const elements = [];
                  if (seat.col === 2) {
                    elements.push(<div key={`aisle-${seat.row}`} className={styles.aisle}></div>);
                  }
                  elements.push(
                    <div
                      key={seat.id}
                      className={`${styles.seat} ${seatClass}`}
                      onClick={() => handleSeatClick(seat.id, seat.isOccupied)}
                      title={seat.isOccupied ? "Occupé" : seat.isVip ? `VIP ${seat.id}` : seat.id}
                    >
                      {seat.id}
                    </div>
                  );
                  return elements;
                })}
              </div>

              <div className={styles.seatLegend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: "rgba(0,192,112,0.12)", border: "2px solid rgba(0,192,112,0.2)" }}></div>
                  Disponible
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: "rgba(0,103,60,0.2)", border: "2px solid rgba(0,192,112,0.3)" }}></div>
                  VIP
                </div>
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
                <span className={styles.summaryLabel}>Total à payer</span>
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
              <div
                className={`${styles.paymentMethodCard} ${paymentMethod === "om" ? styles.paymentMethodCardActive : ""}`}
                onClick={() => setPaymentMethod("om")}
              >
                <div className={styles.paymentIcon} style={{ background: "rgba(255, 102, 0, 0.15)", color: "#FF6600" }}>
                  OM
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
                <div className={styles.paymentIcon} style={{ background: "rgba(255, 204, 0, 0.15)", color: "#FFCC00" }}>
                  MT
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
                  <div className={styles.paymentFormTitle} style={{ fontWeight: 800, color: "#1a202c", marginBottom: "12px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {paymentMethod === "om" ? "Paiement par Orange Money" : paymentMethod === "momo" ? "Paiement par MTN Mobile Money" : "Informations de Carte Bancaire"}
                  </div>

                  {(paymentMethod === "om" || paymentMethod === "momo") ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                      {/* USSD Instruction premium Box */}
                      <div style={{ background: "rgba(0,103,60,0.04)", border: "1px solid rgba(0,103,60,0.1)", padding: "15px", borderRadius: "10px", fontSize: "0.76rem", lineHeight: "1.4", color: "#0A2F1D" }}>
                        <span style={{ display: "block", fontWeight: "800", marginBottom: "6px" }}>👉 CONSIGNES DE PAIEMENT MANUEL :</span>
                        Composez le code USSD ci-dessous sur votre téléphone portable avec votre compte {paymentMethod === "om" ? "Orange" : "MTN"} pour effectuer le dépôt de <strong>{journey.price.toLocaleString()} FCFA</strong> vers le compte de l'agence SafeTrip :
                        
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "12px", background: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: "900", fontSize: "0.95rem", color: "#00673C", flex: 1 }}>
                            {paymentMethod === "om" ? "#150*11*655462642#" : "*126*1*1*655462642#"}
                          </span>
                          <button
                            type="button"
                            style={{ background: "#e2e8f0", color: "#4a5568", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "800", cursor: "pointer" }}
                            onClick={() => {
                              navigator.clipboard.writeText(paymentMethod === "om" ? "#150*11*655462642#" : "*126*1*1*655462642#");
                              showToast("Code USSD copié dans le presse-papiers !");
                            }}
                          >
                            Copier
                          </button>
                        </div>

                        {/* Dial shortcut */}
                        <a 
                          href={paymentMethod === "om" ? "tel:%23150*11*655462642%23" : "tel:*126*1*1*655462642%23"}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#00673C", color: "#ffffff", padding: "8px 14px", borderRadius: "8px", textDecoration: "none", fontWeight: "800", fontSize: "0.72rem", marginTop: "12px", transition: "transform 0.2s" }}
                          onClick={() => showToast("Ouverture de votre composeur téléphonique...")}
                        >
                          📞 Lancer l'appel USSD sur mobile
                        </a>
                      </div>

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

                      <div className={styles.inputGroup} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "0.7rem", fontWeight: "800", color: "#718096" }}>RÉFÉRENCE DE TRANSACTION (SMS REÇU)</label>
                        <input
                          type="text"
                          className={styles.paymentInput}
                          placeholder="ex: CO260526.1432.A12345"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
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
                    disabled={isProcessing || ((paymentMethod === "om" || paymentMethod === "momo") && (!phoneNumber || !transactionRef)) || (paymentMethod === "carte" && !cardNumber)}
                    style={{ marginTop: "15px", width: "100%", height: "45px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: isProcessing ? "#cbd5e0" : "#00c070", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: "800", cursor: "pointer" }}
                  >
                    {isProcessing ? (
                      <>
                        <div className={styles.spinner}></div>
                        Traitement de la transaction...
                      </>
                    ) : (
                      `Valider le paiement • CFA ${journey.price.toLocaleString()}`
                    )}
                  </button>
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
              <div className={styles.summaryDivider}></div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Total</span>
                <span className={styles.summaryTotal}>CFA {journey.price.toLocaleString()}</span>
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
                    <span className={styles.ticketDetailValue}>{ALL_SEATS.find(s => s.id === selectedSeat)?.isVip ? "VIP" : "Standard"}</span>
                  </div>
                  <div className={styles.ticketDetail}>
                    <span className={styles.ticketDetailLabel}>Tarif payé</span>
                    <span className={`${styles.ticketDetailValue} ${styles.ticketDetailValueGold}`}>CFA {journey.price.toLocaleString()}</span>
                  </div>
                </div>

                {/* Passenger Info */}
                <div className={styles.ticketPassengerRow}>
                  <div className={styles.ticketPassengerInfo}>
                    <span className={styles.ticketPassengerName}>{clientName.toUpperCase()}</span>
                    <span className={styles.ticketPassengerContact}>{clientEmail} • {clientPhone}</span>
                  </div>
                  <div className={styles.ticketQr}>
                    <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2">
                      <rect x="3" y="3" width="6" height="6" />
                      <rect x="15" y="3" width="6" height="6" />
                      <rect x="3" y="15" width="6" height="6" />
                      <path d="M15 15h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zm0 4h2v2h-2zm-4 2h2v2h-2zm4 0h2v2h-2zm-6-6h2v2h-2zm0 4h2v2h-2zm4-8h2v2h-2z" />
                    </svg>
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
