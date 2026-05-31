"use client";

import styles from "./page.module.css";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useUser } from "@/components/UserContext";

import { Joyride } from "react-joyride";

const agencies = [
  { name: 'Finexs', image: '/images/finexs.png' },
  { name: 'Buca Voyage', image: '/images/bucavoyage.png' },
  { name: 'General', image: '/images/General.png' },
  { name: 'Touristique', image: '/images/Touristique.png' },
  { name: 'Men Travel', image: '/images/mentravel.png' },
];

const teamSlides = [
  { src: "/images/about_us_team.png", name: "L'Équipe Fondatrice", role: "6 experts passionnés" },
  { src: "/images/member1.jpg", name: "NZENANG MARC DELON", role: "Fondateur & CEO" },
  { src: "/images/member2.png", name: "NGONO ALIMA", role: "Co-fondatrice & CTO" },
  { src: "/images/member3.jpg", name: "YOUP YOUP AUTON", role: "Directeur des Opérations (COO)" },
  { src: "/images/member4.png", name: "NKOTH CECILIA", role: "Directrice Logistique" },
  { src: "/images/member5.jpg", name: "BOGNIE NESTOR", role: "Product Manager" },
  { src: "/images/member6.png", name: "TA'A NINI GERARDO", role: "Lead Fullstack Dev" },
];

export default function Home() {
  const router = useRouter();
  const t = useTranslations("Home");
  const tc = useTranslations("Common");
  const [scrolled, setScrolled] = useState(false);
  const [searchDep, setSearchDep] = useState("");
  const [searchArr, setSearchArr] = useState("");
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [passengers, setPassengers] = useState(1);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // Manage active dropdown key: 'hero-dep' | 'hero-ret' | 'hero-pass' | 'header-dep' | 'header-ret' | 'header-pass' | null
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [runTour, setRunTour] = useState(false);
  
  useEffect(() => {
    // Automatically start tour for new visitors
    const hasSeenTour = localStorage.getItem("hasSeenTourV3");
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, []);

  const tourSteps = [
    {
      target: "#tour-logo",
      content: "Bienvenue sur SafeTrip ! C'est la page d'accueil.",
      skipBeacon: true,
    },
    {
      target: "#tour-reserve",
      content: "Cliquez ici pour réserver vos billets de bus en ligne en toute simplicité.",
      skipBeacon: true,
    },
    {
      target: "#tour-agences",
      content: "Découvrez toutes les agences de voyage partenaires et leurs offres.",
      skipBeacon: true,
    },
    {
      target: "#tour-traceability",
      content: "Suivez vos bagages et colis en temps réel avec notre outil de traçabilité.",
      skipBeacon: true,
    },
    {
      target: "#tour-rental",
      content: "Besoin d'un véhicule ? Louez-le dans cette section.",
      skipBeacon: true,
    }
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    if (["finished", "skipped"].includes(status)) {
      setRunTour(false);
      localStorage.setItem("hasSeenTourV3", "true");
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useUser();
  const isLoggedIn = !!user;
  const userRole = user?.role || null;

  const toggleConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      window.location.href = "/login";
    } else if (userRole === "admin") {
      window.location.href = "/admin/dashboard";
    } else if (userRole === "agency") {
      window.location.href = "/agence/dashboard";
    } else {
      window.location.href = "/client/dashboard";
    }
  };

  const todayDate = new Date();
  const [depCalMonth, setDepCalMonth] = useState(todayDate.getMonth());
  const [depCalYear, setDepCalYear] = useState(todayDate.getFullYear());
  const [retCalMonth, setRetCalMonth] = useState(todayDate.getMonth());
  const [retCalYear, setRetCalYear] = useState(todayDate.getFullYear());

  // Localized Time & Cameroonian Weather states
  const [currentTime, setCurrentTime] = useState("");
  const [showWeather, setShowWeather] = useState(false);
  const [cityIdx, setCityIdx] = useState(0);

  const [citiesWeather, setCitiesWeather] = useState([
    { city: "Yaoundé", temp: "24°", desc: "Nuageux ☁️", lat: 3.8480, lon: 11.5021 },
    { city: "Douala", temp: "28°", desc: "Humide 🌧️", lat: 4.0511, lon: 9.7679 },
    { city: "Bafoussam", temp: "21°", desc: "Brumeux 🌫️", lat: 5.4771, lon: 10.4176 },
    { city: "Garoua", temp: "35°", desc: "Ensoleillé ☀️", lat: 9.3003, lon: 13.3932 },
    { city: "Kribi", temp: "29°", desc: "Orageux ⛈️", lat: 2.9506, lon: 9.9079 }
  ]);

  // Asynchronously fetch live Cameroonian hub weather from free Open-Meteo API
  useEffect(() => {
    const fetchLiveWeather = async () => {
      try {
        const liveData = await Promise.all(
          citiesWeather.map(async (c) => {
            try {
              const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weather_code&timezone=auto`;
              const res = await fetch(url);
              if (!res.ok) return c;
              const data = await res.json();
              if (data && data.current) {
                const liveTemp = Math.round(data.current.temperature_2m);
                const code = data.current.weather_code;

                // WMO Weather interpretation codes
                let desc = "Doux 🌤️";
                if (code === 0) desc = "Ensoleillé ☀️";
                else if (code >= 1 && code <= 3) desc = "Nuageux ☁️";
                else if (code === 45 || code === 48) desc = "Brumeux 🌫️";
                else if (code >= 51 && code <= 65) desc = "Pluvieux 🌧️";
                else if (code >= 80 && code <= 82) desc = "Averses 🌧️";
                else if (code >= 95) desc = "Orageux ⛈️";
                else desc = "Couvert ☁️";

                return { ...c, temp: `${liveTemp}°`, desc };
              }
            } catch (cityErr) {
              console.warn(`Impossible de récupérer la météo en temps réel pour ${c.city} (utilisation des valeurs par défaut).`);
            }
            return c;
          })
        );
        setCitiesWeather(liveData);
      } catch (err) {
        console.error("Erreur lors de la synchronisation de la météo en temps réel:", err);
      }
    };

    fetchLiveWeather();
    const weatherCacheTimer = setInterval(fetchLiveWeather, 600000); // Live sync weather caching interval of 10 minutes
    return () => clearInterval(weatherCacheTimer);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}`);
    };
    updateClock();
    const clockTimer = setInterval(updateClock, 1000);

    const toggleTimer = setInterval(() => {
      setShowWeather(prev => {
        const next = !prev;
        if (next) {
          setCityIdx(i => (i + 1) % 5); // Rotate through the 5 cities when transitioning to weather
        }
        return next;
      });
    }, 5000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(toggleTimer);
    };
  }, []);

  useEffect(() => {
    const handleClose = () => {
      setActiveDropdown(null);
    };
    window.addEventListener("click", handleClose);
    return () => {
      window.removeEventListener("click", handleClose);
    };
  }, []);

  const nextMonth = (isDep: boolean) => {
    if (isDep) {
      if (depCalMonth === 11) {
        setDepCalMonth(0);
        setDepCalYear(prev => prev + 1);
      } else {
        setDepCalMonth(prev => prev + 1);
      }
    } else {
      if (retCalMonth === 11) {
        setRetCalMonth(0);
        setRetCalYear(prev => prev + 1);
      } else {
        setRetCalMonth(prev => prev + 1);
      }
    }
  };

  const prevMonth = (isDep: boolean) => {
    if (isDep) {
      if (depCalMonth === 0) {
        setDepCalMonth(11);
        setDepCalYear(prev => prev - 1);
      } else {
        setDepCalMonth(prev => prev - 1);
      }
    } else {
      if (retCalMonth === 0) {
        setRetCalMonth(11);
        setRetCalYear(prev => prev - 1);
      } else {
        setRetCalMonth(prev => prev - 1);
      }
    }
  };

  const selectDate = (isDep: boolean, year: number, month: number, day: number) => {
    const yyyy = year;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    if (isDep) {
      setDepartureDate(dateStr);
    } else {
      setReturnDate(dateStr);
    }
    setActiveDropdown(null);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return t("clear");
    const [year, month, day] = dateString.split("-");
    const monthNamesShort = ["Janv.", "Févr.", "Mars", "Avril", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
    return `${day} ${monthNamesShort[parseInt(month, 10) - 1]} ${year}`;
  };

  const renderCalendar = (isDep: boolean, dropdownKey: string) => {
    const month = isDep ? depCalMonth : retCalMonth;
    const year = isDep ? depCalYear : retCalYear;
    const selectedDate = isDep ? departureDate : returnDate;

    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const daysCount = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysCount; d++) {
      cells.push(d);
    }

    const todayObj = new Date();
    const todayDay = todayObj.getDate();
    const todayMonth = todayObj.getMonth();
    const todayYear = todayObj.getFullYear();

    return (
      <div className={styles.calendarPopover} onClick={(e) => e.stopPropagation()}>
        <div className={styles.calendarHeader}>
          <span className={styles.calendarMonthYear}>
            {monthNames[month]} {year}
          </span>
          <div className={styles.calendarNavBtns}>
            <button type="button" className={styles.calendarNavBtn} onClick={(e) => { e.stopPropagation(); prevMonth(isDep); }}>
              ‹
            </button>
            <button type="button" className={styles.calendarNavBtn} onClick={(e) => { e.stopPropagation(); nextMonth(isDep); }}>
              ›
            </button>
          </div>
        </div>
        <div className={styles.calendarGrid}>
          {["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"].map(d => (
            <div key={d} className={styles.calendarDayHeader}>{d}</div>
          ))}
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className={styles.calendarDayEmpty} />;
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const isToday = todayDay === day && todayMonth === month && todayYear === year;

            return (
              <button
                key={day}
                type="button"
                className={`${styles.calendarDayCell} ${isSelected ? styles.calendarDaySelected : ""} ${isToday ? styles.calendarDayToday : ""}`}
                onClick={(e) => { e.stopPropagation(); selectDate(isDep, year, month, day); }}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className={styles.calendarFooter}>
          <button
            type="button"
            className={styles.calendarFooterBtn}
            onClick={(e) => {
              e.stopPropagation();
              if (isDep) { setDepartureDate(""); }
              else { setReturnDate(""); }
              setActiveDropdown(null);
            }}
          >
            {t("clear")}
          </button>
          <button
            type="button"
            className={styles.calendarFooterBtn}
            onClick={(e) => {
              e.stopPropagation();
              selectDate(isDep, todayYear, todayMonth, todayDay);
            }}
          >
            {t("today")}
          </button>
        </div>
      </div>
    );
  };

  const renderSearchCapsule = (isHeader: boolean) => {
    const depKey = isHeader ? 'header-dep' : 'hero-dep';
    const retKey = isHeader ? 'header-ret' : 'hero-ret';
    const passKey = isHeader ? 'header-pass' : 'hero-pass';

    return (
      <div className={`${styles.searchCapsuleContainer} ${isHeader ? styles.headerSearchVersion : ""}`}>
        {/* Trip Type Selector */}
        <div className={styles.tripTypeSelector}>
          <button
            type="button"
            className={`${styles.tripTypeTab} ${!isRoundTrip ? styles.tripTypeTabActive : ""}`}
            onClick={(e) => { e.stopPropagation(); setIsRoundTrip(false); }}
          >
            {t("oneWay")}
          </button>
          <button
            type="button"
            className={`${styles.tripTypeTab} ${isRoundTrip ? styles.tripTypeTabActive : ""}`}
            onClick={(e) => { e.stopPropagation(); setIsRoundTrip(true); }}
          >
            {t("roundTrip")}
          </button>
        </div>

        {/* Capsule Bar */}
        <div className={styles.searchCapsuleBar}>
          {/* Departure */}
          <div className={styles.capsuleItem}>
            <svg className={styles.capsuleIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="8"></circle>
            </svg>
            <input
              type="text"
              placeholder={t("departure")}
              className={styles.capsuleInput}
              value={searchDep}
              onChange={e => setSearchDep(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Destination */}
          <div className={styles.capsuleItem}>
            <svg className={styles.capsuleIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="8"></circle>
            </svg>
            <input
              type="text"
              placeholder={t("destination")}
              className={styles.capsuleInput}
              value={searchArr}
              onChange={e => setSearchArr(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Date Départ */}
          <div className={styles.capsuleItem} onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === depKey ? null : depKey); }}>
            <svg className={styles.capsuleIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div className={styles.capsuleValueDisplay}>
              {departureDate ? formatDateDisplay(departureDate) : t("today")}
            </div>
            {activeDropdown === depKey && renderCalendar(true, depKey)}
          </div>

          {/* Date Retour (Conditional) */}
          <div className={`${styles.capsuleItem} ${!isRoundTrip ? styles.capsuleDisabled : ""}`} onClick={(e) => { e.stopPropagation(); if (isRoundTrip) { setActiveDropdown(activeDropdown === retKey ? null : retKey); } }}>
            <svg className={styles.capsuleIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div className={styles.capsuleValueDisplay}>
              {returnDate ? formatDateDisplay(returnDate) : t("returnDate")}
            </div>
            {activeDropdown === retKey && renderCalendar(false, retKey)}
          </div>

          {/* Seats/Passengers Selection */}
          <div className={styles.capsuleItem} onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === passKey ? null : passKey); }}>
            <svg className={styles.capsuleIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <div className={styles.capsulePassengerInfo}>
              <div className={styles.capsulePassengerTitle}>
                {passengers} {passengers > 1 ? t("passengers") : t("passenger")}
              </div>
              <div className={styles.capsulePassengerSubtitle}>
                {t("noDiscount")}
              </div>
            </div>

            {activeDropdown === passKey && (
              <div className={styles.passengerPopover} onClick={(e) => e.stopPropagation()}>
                <div className={styles.popoverTitle}>{t("seatCount")}</div>
                <div className={styles.popoverCounterRow}>
                  <button
                    type="button"
                    className={styles.counterBtn}
                    disabled={passengers <= 1}
                    onClick={(e) => { e.stopPropagation(); setPassengers(Math.max(1, passengers - 1)); }}
                  >
                    -
                  </button>
                  <span className={styles.counterValue}>{passengers}</span>
                  <button
                    type="button"
                    className={styles.counterBtn}
                    disabled={passengers >= 10}
                    onClick={(e) => { e.stopPropagation(); setPassengers(Math.min(10, passengers + 1)); }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            className={styles.capsuleSubmitBtn}
            onClick={(e) => {
              e.stopPropagation();
              const params = new URLSearchParams();
              if (searchDep.trim()) params.set("dep", searchDep.trim());
              if (searchArr.trim()) params.set("arr", searchArr.trim());
              router.push(`/reserver${params.toString() ? `?${params.toString()}` : ""}`);
            }}
          >
            {tc("search")}
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % teamSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fades out the scroll down indicator and triggers header search
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      if (window.scrollY > 450) {
        setShowStickySearch(true);
      } else {
        setShowStickySearch(false);
      }
    };
    window.addEventListener("scroll", handleScroll);

    // Intersection Observer for professional scroll reveal animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealVisible);
          }
        });
      },
      { threshold: 0, rootMargin: "0px" }
    );

    const revealElements = document.querySelectorAll(
      `.${styles.reveal}, .${styles.revealLeft}, .${styles.revealRight}`
    );
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <main className={styles.main}>
      {runTour && (
        <Joyride
          steps={tourSteps}
          run={runTour}
          continuous={true}
          onEvent={handleJoyrideCallback}
          styles={{
            floater: {
              zIndex: 10000,
            },
            buttonPrimary: {
              backgroundColor: '#00673C',
            }
          }}
          locale={{
            last: 'Terminer',
            next: 'Suivant',
            skip: 'Passer',
            back: 'Précédent'
          }}
        />
      )}
      {/* Header */}
      <header className={`${styles.header} ${showStickySearch ? styles.headerExpanded : ""}`}>
        <div className={styles.headerContent}>
          <div className={styles.logoContainer} id="tour-logo">
            <img
              src="/images/logo-removebg-preview (2).png"
              alt="SafeTrip Logo"
              className={styles.logoImage}
            />
          </div>
          <nav className={styles.nav}>
            <Link href="/reserver" id="tour-reserve">{tc("reserve")}</Link>
            <Link href="/agences" id="tour-agences">{tc("agencies")}</Link>
            <Link href="/tracabilite" id="tour-traceability">{tc("traceability")}</Link>
            <Link href="/location" id="tour-rental">{tc("rental")}</Link>
            {isLoggedIn && userRole === "admin" && <Link href="/admin/dashboard" style={{ color: "var(--accent-gold)", fontWeight: 800 }}>{tc("admin")}</Link>}
            {isLoggedIn && userRole === "agency" && <Link href="/agence/dashboard" style={{ color: "var(--accent-gold)", fontWeight: 800 }}>{tc("myAgency")}</Link>}
            {isLoggedIn && userRole === "client" && <Link href="/client/dashboard" style={{ color: "var(--accent-gold)", fontWeight: 800 }}>{tc("travelerSpace")}</Link>}
          </nav>
          <LanguageToggle />
          <button onClick={toggleConnection} className={styles.headerBtn}>
            {!isLoggedIn ? tc("login") : userRole === "admin" ? tc("admin") : userRole === "agency" ? tc("myAgency") : tc("mySpace")}
          </button>
          <button
            className={styles.hamburgerBtn}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(o => !o); }}
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 24, height: 24, pointerEvents: 'none' }}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <>
            <div className={styles.mobileMenuBackdrop} onClick={() => setMobileMenuOpen(false)} />
            <div className={styles.mobileMenu} role="menu">
              <Link href="/reserver" onClick={() => setMobileMenuOpen(false)}>{tc("reserve")}</Link>
              <Link href="/agences" onClick={() => setMobileMenuOpen(false)}>{tc("agencies")}</Link>
              <Link href="/tracabilite" onClick={() => setMobileMenuOpen(false)}>{tc("traceability")}</Link>
              <Link href="/location" onClick={() => setMobileMenuOpen(false)}>{tc("rental")}</Link>
              {isLoggedIn && userRole === "admin" && <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>{tc("admin")}</Link>}
              {isLoggedIn && userRole === "agency" && <Link href="/agence/dashboard" onClick={() => setMobileMenuOpen(false)}>{tc("myAgency")}</Link>}
              {isLoggedIn && userRole === "client" && <Link href="/client/dashboard" onClick={() => setMobileMenuOpen(false)}>{tc("mySpace")}</Link>}
              <button onClick={() => { toggleConnection(new MouseEvent('click') as any); setMobileMenuOpen(false); }} style={{ background: "#00673C", color: "#fff", fontWeight: 700, padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                {!isLoggedIn ? tc("login") : tc("myAccount")}
              </button>
            </div>
          </>
        )}

        {/* Sticky Search Bar (BlaBlaCar style) */}
        {showStickySearch && (
          <div className={`${styles.headerSearchContainer} ${styles.headerSearchVisible}`}>
            <div className={styles.headerSearchInner}>
              {renderSearchCapsule(true)}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContentGrid}>
          {/* Left Column: Bold Tagline and Subtitle */}
          <div className={styles.heroTextColumn}>
            <h1 className={styles.heroTitle}>
              {t("heroTitle")}<img
                src="/images/logo-removebg-preview (2).png"
                alt="SafeTrip Logo"
                className={styles.heroTitleLogo}
              />
            </h1>
            <p className={styles.heroSubtitle}>
              {t("heroSubtitle")}
            </p>
          </div>

          {/* Right Column: High-performance Rounded Video Card */}
          <div className={styles.heroVideoColumn}>
            <div className={styles.heroVideoWrapper}>
              <video
                autoPlay
                loop
                muted
                playsInline
                className={styles.heroVideo}
                poster="/bus.png"
              >
                <source src="/bus-video.mp4" type="video/mp4" />
                {t("videoFallback")}
              </video>
            </div>

            {/* Dynamic Time & Weather Premium Card Widget */}
            <div className={styles.heroWeatherWidgetCard}>
              {!showWeather ? (
                /* Time Card View */
                <div className={styles.widgetCardContent} key="time">
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardTitleBox}>
                      <svg className={styles.cardHeaderIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span className={styles.cardHeaderTitle}>{t("timeLabel")} {citiesWeather[cityIdx].city.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className={styles.cardMainValue}>
                    {currentTime}
                  </div>

                  <div className={styles.cardFooterRow}>
                    <span className={styles.cardFooterText}>{t("cameroonLabel")}</span>
                    <div className={styles.cardIndicators}>
                      <span className={`${styles.cardIndicatorDot} ${styles.cardIndicatorActive}`}></span>
                      <span className={styles.cardIndicatorDot}></span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Weather Card View */
                <div className={styles.widgetCardContent} key="weather">
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.cardTitleBox}>
                      <svg className={styles.cardHeaderIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span className={styles.cardHeaderTitle}>{t("weatherLabel")} {citiesWeather[cityIdx].city.toUpperCase()}</span>
                    </div>
                    {/* Render cloud or sun based on description */}
                    <div className={styles.cardWeatherIconBox}>
                      {citiesWeather[cityIdx].city === "Garoua" ? (
                        <svg className={styles.weatherConditionIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="5"></circle>
                          <line x1="12" y1="1" x2="12" y2="3"></line>
                          <line x1="12" y1="21" x2="12" y2="23"></line>
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                          <line x1="1" y1="12" x2="3" y2="12"></line>
                          <line x1="21" y1="12" x2="23" y2="12"></line>
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                      ) : (
                        <svg className={styles.weatherConditionIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardMainValueWeather}>
                    {citiesWeather[cityIdx].temp}
                  </div>

                  <div className={styles.cardFooterRow}>
                    <span className={styles.cardFooterWeatherDesc}>{citiesWeather[cityIdx].desc.split(" ")[0]}</span>
                    <div className={styles.cardIndicators}>
                      <span className={styles.cardIndicatorDot}></span>
                      <span className={`${styles.cardIndicatorDot} ${styles.cardIndicatorActive}`}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Search Widget Container */}
        <div className={`container ${styles.searchCapsuleSection}`}>
          {renderSearchCapsule(false)}
        </div>

        {/* Scroll Down Indicator */}
        <div className={`${styles.scrollDown} ${scrolled ? styles.hidden : ""}`} onClick={() => document.getElementById('agences')?.scrollIntoView({ behavior: 'smooth' })}>
          <span className={styles.scrollText}>{t("scrollDown")}</span>
          <div className={styles.mouse}>
            <div className={styles.wheel}></div>
          </div>
        </div>
      </section>

      {/* Agencies Section */}
      <section id="agences" className={`${styles.agenciesSection} ${styles.reveal}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>{t("partnerAgencies")}</h2>
          <div className={styles.marqueeContainer}>
            <div className={styles.marqueeTrack}>
              {[...agencies, ...agencies].map((agency, index) => (
                <div key={`${agency.name}-${index}`} className={styles.agencyCard}>
                  {agency.image && (
                    <Image src={agency.image} alt={`Logo ${agency.name}`} width={50} height={50} className={styles.agencyLogo} />
                  )}
                  <h3>{agency.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Qui Sommes-Nous Section */}
      <section id="qui-sommes-nous" className={`${styles.aboutSection} ${styles.reveal}`}>
        <div className={`container ${styles.aboutGrid}`}>
          {/* Left Column: Interactive Slider */}
          <div className={`${styles.aboutImageColumn} ${styles.revealLeft}`}>
            <div className={styles.aboutImageWrapper}>
              <div className={styles.sliderContainer}>
                {teamSlides.map((slide, idx) => (
                  <div
                    key={idx}
                    className={`${styles.slide} ${idx === currentSlide ? styles.activeSlide : ""}`}
                  >
                    <img
                      src={slide.src}
                      alt={slide.name}
                      className={styles.aboutImage}
                    />
                    <div className={styles.imageOverlayBadge}>
                      <span className={styles.badgeNumber}>{slide.name}</span>
                      <span className={styles.badgeText}>{slide.role}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Slider Navigation Controls */}
              <button
                className={styles.slideArrowLeft}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((prev) => (prev - 1 + teamSlides.length) % teamSlides.length);
                }}
              >
                ‹
              </button>
              <button
                className={styles.slideArrowRight}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((prev) => (prev + 1) % teamSlides.length);
                }}
              >
                ›
              </button>
            </div>
          </div>

          {/* Right Column: Text & Stats */}
          <div className={`${styles.aboutTextColumn} ${styles.revealRight}`}>
            <span className={styles.aboutSectionBadge}>{t("aboutBadge")}</span>
            <h2 className={styles.aboutTitle}>{t("aboutTitle")}</h2>
            <p className={styles.aboutDescription}>{t("aboutDesc1")}</p>
            <p className={styles.aboutDescription}>{t("aboutDesc2")}</p>

            <div className={styles.aboutStatsGrid}>
              <div className={styles.statCard}>
                <h4 className={styles.statVal}>50k+</h4>
                <p className={styles.statLbl}>{t("statSatisfied")}</p>
              </div>
              <div className={styles.statCard}>
                <h4 className={styles.statVal}>15+</h4>
                <p className={styles.statLbl}>{t("statPartners")}</p>
              </div>
              <div className={styles.statCard}>
                <h4 className={styles.statVal}>24/7</h4>
                <p className={styles.statLbl}>{t("statSupport")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Traceability Section */}
      <section id="tracabilite" className={styles.traceabilitySection}>
        <div className={`container ${styles.traceabilityContent}`}>
          {/* Left Column: Premium Feature Cards */}
          <div className={`${styles.traceabilityText} ${styles.revealLeft}`}>
            <span className={styles.traceabilityBadge}>{t("tracBadge")}</span>
            <h2 className={styles.traceabilityTitle}>{t("tracTitle")}</h2>
            <p className={styles.traceabilityDescription}>{t("tracDesc")}</p>

            <div className={styles.traceabilityFeatureList}>
              <div className={styles.traceabilityFeatureItem}>
                <div className={styles.featureIconBox}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <h4>{t("tracFeature1Title")}</h4>
                  <p>{t("tracFeature1Desc")}</p>
                </div>
              </div>

              <div className={styles.traceabilityFeatureItem}>
                <div className={styles.featureIconBox}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <h4>{t("tracFeature2Title")}</h4>
                  <p>{t("tracFeature2Desc")}</p>
                </div>
              </div>

              <div className={styles.traceabilityFeatureItem}>
                <div className={styles.featureIconBox}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <h4>{t("tracFeature3Title")}</h4>
                  <p>{t("tracFeature3Desc")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-tech 3D Interactive Card */}
          <div className={`${styles.traceabilityImageWrapper} ${styles.revealRight}`}>
            <div className={styles.card3d}>
              <div className={styles.cardInner}>
                {/* Front: Scanning QR Code UI */}
                <div className={styles.cardFront}>
                  <div className={styles.scanLine}></div>
                  <span className={styles.cardFrontLabel}>{t("scanQr")}</span>

                  <svg className={styles.qrCodeSvg} viewBox="0 0 100 100" fill="currentColor">
                    <path d="M0 0h30v30H0zm10 10h10v10H10zM70 0h30v30H70zm10 10h10v10H80zM0 70h30v30H0zm10 10h10v10H10z" />
                    <path d="M75 75h10v10H75z" />
                    <path d="M40 0h5v10h-5zm0 15h10v5H40zm15-15h5v5h-5zm0 10h10v5H55zM35 35h10v5H35zm15 5h5v10h-5zm10-5h5v5h-5zm15 10h5v5h-5zM35 50h5v5h-5zm5 10h10v5H40zm15-5h5v10h-5zm10-10h5v5h-5z" />
                  </svg>

                  <p className={styles.cardFrontFooter}>{t("hoverStatus")}</p>
                </div>

                {/* Back: Tracking Timeline Dashboard */}
                <div className={styles.cardBack}>
                  <div className={styles.cardBackHeader}>
                    <span className={styles.trackingBadge}>{t("inTransit")}</span>
                    <span className={styles.trackingId}>#ST-9842-CM</span>
                  </div>

                  <div className={styles.cardBackCheck}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>

                  <h3>{t("securedPackage")}</h3>

                  <div className={styles.trackingSteps}>
                    <div className={styles.stepItemActive}>
                      <span className={styles.stepDot}></span>
                      <span className={styles.stepText}>{t("step1")}</span>
                    </div>
                    <div className={styles.stepItemActive}>
                      <span className={styles.stepDot}></span>
                      <span className={styles.stepText}>{t("step2")}</span>
                    </div>
                    <div className={styles.stepItemPending}>
                      <span className={styles.stepDot}></span>
                      <span className={styles.stepText}>{t("step3")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className={styles.footer}>
        <div className={`container ${styles.footerGrid}`}>
          {/* Column 1: Brand details */}
          <div className={styles.footerBrandCol}>
            <div className={styles.footerLogoContainer}>
              <img
                src="/images/logo-removebg-preview (2).png"
                alt="SafeTrip Logo"
                className={styles.footerLogo}
              />
            </div>
            <p className={styles.footerDesc}>{t("footerDesc")}</p>
            <div className={styles.socialLinks}>
              <a href="#social" className={styles.socialIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#social" className={styles.socialIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
              <a href="#social" className={styles.socialIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className={styles.footerLinkCol}>
            <h4>{t("footerServices")}</h4>
            <ul>
              <li><Link href="/reserver">{t("footerBookTicket")}</Link></li>
              <li><Link href="/agences">{t("footerTransportAgencies")}</Link></li>
              <li><Link href="/tracabilite">{t("footerTrackPackage")}</Link></li>
              <li><Link href="/location">{t("footerBusRental")}</Link></li>
              <li><a href="#qui-sommes-nous">{t("footerAboutUs")}</a></li>
            </ul>
          </div>

          {/* Column 3: Legal & Security */}
          <div className={styles.footerLinkCol}>
            <h4>{t("footerSecurity")}</h4>
            <ul>
              <li><a href="#legal">{t("footerLegal")}</a></li>
              <li><a href="#privacy">{t("footerPrivacy")}</a></li>
              <li><a href="#terms">{t("footerTerms")}</a></li>
              <li><a href="#rgpd">{t("footerRgpd")}</a></li>
            </ul>
          </div>

          {/* Column 4: Contact details */}
          <div className={styles.footerLinkCol}>
            <h4>{t("footerContact")}</h4>
            <ul className={styles.footerContactList}>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>support@safetrip.cm</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>+237 677 889 900</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>Douala & Yaoundé, Cameroun</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row */}
        <div className={styles.footerBottom}>
          <div className={`container ${styles.footerBottomContent}`}>
            <p className={styles.copyright}>{tc("copyright")}</p>
            <p className={styles.footerCredits}>{t("footerMadeWith")}</p>
          </div>
        </div>
      </footer>

    </main>
  );
}
