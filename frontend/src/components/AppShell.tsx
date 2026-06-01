"use client";

import { useState, useEffect, useCallback } from "react";
import SplashScreen from "./SplashScreen";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const shown = sessionStorage.getItem("safetrip_splash_shown");
      if (shown) {
        setSplashDone(true);
      }
      setHasChecked(true);
    }
  }, []);

  const handleSplashFinish = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("safetrip_splash_shown", "true");
    }
    setSplashDone(true);
  }, []);

  if (!hasChecked) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <>
      {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
      <div style={{ visibility: splashDone ? "visible" : "hidden" }}>
        {children}
      </div>
    </>
  );
}
