"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useUser } from "@/components/UserContext";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("Login");
  const tc = useTranslations("Common");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Inscription states
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastSuccess, setIsToastSuccess] = useState(true);

  const { user, login: contextLogin } = useUser();

  // Check if already logged in and redirect accordingly
  useEffect(() => {
    if (user) {
      redirectBasedOnRole(user.role);
    }
  }, [user]);

  const showToast = (message: string, isSuccess = true) => {
    setToastMessage(message);
    setIsToastSuccess(isSuccess);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const redirectBasedOnRole = (role: string) => {
    if (role === "admin") {
      router.push("/admin/dashboard");
    } else if (role === "agency") {
      router.push("/agence/dashboard");
    } else {
      router.push("/client/dashboard");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast(t("errorEmptyFields"), false);
      return;
    }

    const API_BASE = ((typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) ? 'https://safe-trip-backend.vercel.app' : (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://${window.location.hostname}:5000` : 'https://safe-trip-backend.vercel.app')));
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok && data.user) {
        contextLogin(data.user);
        showToast(data.message || "Connexion réussie !");
        
        setTimeout(() => {
          redirectBasedOnRole(data.user.role);
        }, 1000);
      } else {
        showToast(data.error || "Adresse email ou mot de passe incorrect.", false);
      }
    } catch (err) {
      console.warn("⚠️ Mode local actif: Impossible de joindre le serveur backend.", err);
      
      // Fallback simulation locale pour faciliter les tests et la démo !
      const lowerEmail = email.toLowerCase();
      let simulatedRole = "client";
      let simulatedName = "Jean Client";
      let simulatedAgencyId = "";

      if (lowerEmail === "admin@safetrip.cm" || lowerEmail === "admin@safetrip.net") {
        simulatedRole = "admin";
        simulatedName = "Administrateur Principal";
      } else if (lowerEmail === "finexs@safetrip.cm") {
        simulatedRole = "agency";
        simulatedName = "Finexs Voyage";
        simulatedAgencyId = "1";
      } else if (lowerEmail === "buca@safetrip.cm") {
        simulatedRole = "agency";
        simulatedName = "Buca Voyage";
        simulatedAgencyId = "2";
      } else if (lowerEmail === "general@safetrip.cm") {
        simulatedRole = "agency";
        simulatedName = "General Express";
        simulatedAgencyId = "3";
      } else if (lowerEmail === "touristique@safetrip.cm") {
        simulatedRole = "agency";
        simulatedName = "Touristique Express";
        simulatedAgencyId = "4";
      } else if (lowerEmail === "men@safetrip.cm") {
        simulatedRole = "agency";
        simulatedName = "Men Travel";
        simulatedAgencyId = "5";
      }
      
      contextLogin({
        id: "simulated-id-999",
        email: lowerEmail,
        fullName: simulatedName,
        role: simulatedRole as any,
        photo: simulatedRole === "agency" ? "/images/finexs.png" : simulatedRole === "admin" ? "/images/default_admin.png" : "/images/default_avatar.png",
        agencyId: simulatedRole === "agency" ? Number(simulatedAgencyId) : undefined
      });
      
      showToast(`Connexion réussie ! (Simulation Locale - ${simulatedRole})`);
      setTimeout(() => {
        redirectBasedOnRole(simulatedRole);
      }, 1000);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone || !regEmail || !regPassword) {
      showToast(t("errorAllFields"), false);
      return;
    }

    const API_BASE = ((typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')) ? 'https://safe-trip-backend.vercel.app' : (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) ? `http://${window.location.hostname}:5000` : 'https://safe-trip-backend.vercel.app')));
    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          fullName: regName,
          phone: regPhone
        })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        showToast(data.message || `Compte créé avec succès !`);
        setTimeout(() => {
          setIsLoginMode(true);
        }, 1500);
      } else {
        showToast(data.error || "Erreur d'inscription.", false);
      }
    } catch (err) {
      console.warn("⚠️ Mode local actif: Impossible de joindre le serveur backend.", err);
      showToast(`Compte Voyageur créé avec succès pour ${regName} ! (Simulation Locale)`);
      setTimeout(() => {
        setIsLoginMode(true);
      }, 1500);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f4f7f5" }}>
      {/* Frosted Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logoContainer}>
            <img 
              src="/images/logo-removebg-preview (2).png" 
              alt="SafeTrip Logo" 
              className={styles.logoImage}
            />
          </Link>
          <nav className={styles.nav}>
            <Link href="/reserver">{t("navReserve")}</Link>
            <Link href="/#agences">{t("navAgencies")}</Link>
            <Link href="/#tracabilite">{t("navTraceability")}</Link>
          </nav>
          <LanguageToggle />
          <Link href="/" className={styles.headerBtn}>
            {tc("back")}
          </Link>
        </div>
      </header>

      {toastMessage && (
        <div className={`${styles.toast} ${isToastSuccess ? styles.toastSuccess : ""}`}>
          <span>{toastMessage}</span>
          <button className={styles.toastClose} onClick={() => setToastMessage(null)}>×</button>
        </div>
      )}

      <div className={styles.loginGateContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <img 
              src="/images/logo-removebg-preview (2).png" 
              alt="SafeTrip Logo" 
              className={styles.loginLogo}
            />
            <p className={styles.loginSubtitle}>{t("subtitle")}</p>

            <div className={styles.tabLinks}>
              <span
                className={`${styles.tabLink} ${isLoginMode ? styles.tabLinkActive : ""}`}
                onClick={() => setIsLoginMode(true)}
              >
                {t("loginTab")}
              </span>
              <span className={styles.tabSeparator}>/</span>
              <span
                className={`${styles.tabLink} ${!isLoginMode ? styles.tabLinkActive : ""}`}
                onClick={() => setIsLoginMode(false)}
              >
                {t("registerTab")}
              </span>
            </div>
          </div>

          <div className={styles.formSliderContainer}>
            <div 
              className={styles.formSlider} 
              style={{ transform: isLoginMode ? 'translateX(0%)' : 'translateX(-50%)' }}
            >
              {/* FORM 1: CONNEXION UNIFIEE */}
              <form onSubmit={handleLogin} className={styles.loginForm}>
                <h3 className={styles.formInsideTitle}>{t("loginTitle")}</h3>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>{t("emailLabel")}</label>
                  <input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    className={styles.loginInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={isLoginMode}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>{t("passwordLabel")}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={styles.loginInput}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={isLoginMode}
                  />
                </div>

                <button type="submit" className={styles.loginBtn}>
                  {t("loginBtn")}
                </button>
              </form>

              {/* FORM 2: INSCRIPTION VOYAGEUR */}
              <form onSubmit={handleRegister} className={styles.loginForm}>
                <h3 className={styles.formInsideTitle}>{t("registerTitle")}</h3>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>{t("fullNameLabel")}</label>
                  <input
                    type="text"
                    placeholder={t("fullNamePlaceholder")}
                    className={styles.loginInput}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required={!isLoginMode}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>{t("phoneLabel")}</label>
                  <input
                    type="tel"
                    placeholder={t("phonePlaceholder")}
                    className={styles.loginInput}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required={!isLoginMode}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>{t("emailLabel")}</label>
                  <input
                    type="email"
                    placeholder="jp.talla@email.com"
                    className={styles.loginInput}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required={!isLoginMode}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>{t("createPasswordLabel")}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={styles.loginInput}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required={!isLoginMode}
                  />
                </div>

                <button type="submit" className={styles.loginBtn}>
                  {t("registerBtn")}
                </button>
              </form>
            </div>
          </div>

          <div className={styles.loginFooter}>
            <span>SafeTrip © 2026</span>
            <span style={{ margin: "0 6px" }}>·</span>
            <span>{t("footer")}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
