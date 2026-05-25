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
  const [cardNumber, setCardNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  useEffect(() => {
    // Read booked journey from localStorage
    const saved = localStorage.getItem("safetrip_booking_journey");
    if (saved) {
      setJourney(JSON.parse(saved));
    }

    // Read client info
    const savedAdmins = localStorage.getItem("safetrip_registered_admins");
    const activeEmail = localStorage.getItem("safetrip_active_email") || "";
    setClientEmail(activeEmail);

    if (savedAdmins) {
      const users = JSON.parse(savedAdmins);
      const user = users.find((u: any) => u.email?.toLowerCase() === activeEmail.toLowerCase());
      if (user) {
        setClientName(user.adminName || activeEmail.split("@")[0]);
        setClientPhone(user.phone || "+237 6XX XX XX XX");
      } else {
        setClientName(activeEmail.split("@")[0]);
      }
    } else {
      setClientName(activeEmail.split("@")[0]);
    }

    // Generate ticket ID
    setTicketId(`ST-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`);
  }, []);

  const handleSeatClick = (seatId: string, isOccupied: boolean) => {
    if (isOccupied) return;
    setSelectedSeat(selectedSeat === seatId ? null : seatId);
  };

  const handlePay = () => {
    if (!paymentMethod) return;
    if ((paymentMethod === "om" || paymentMethod === "momo") && !phoneNumber) return;
    if (paymentMethod === "carte" && !cardNumber) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
    }, 2500);
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
                <div className={styles.paymentFormArea}>
                  <div className={styles.paymentFormTitle}>
                    {paymentMethod === "om" ? "Numéro Orange Money" : paymentMethod === "momo" ? "Numéro MTN MoMo" : "Numéro de carte bancaire"}
                  </div>
                  {(paymentMethod === "om" || paymentMethod === "momo") ? (
                    <input
                      type="text"
                      className={styles.paymentInput}
                      placeholder={paymentMethod === "om" ? "ex: 699 01 22 33" : "ex: 677 44 55 66"}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
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
                    disabled={isProcessing || (!phoneNumber && paymentMethod !== "carte") || (!cardNumber && paymentMethod === "carte")}
                  >
                    {isProcessing ? (
                      <>
                        <div className={styles.spinner}></div>
                        Traitement en cours...
                      </>
                    ) : (
                      `Payer CFA ${journey.price.toLocaleString()}`
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
