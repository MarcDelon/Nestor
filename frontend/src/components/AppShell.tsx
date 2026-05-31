"use client";

import { useState, useCallback } from "react";
import SplashScreen from "./SplashScreen";
import OnboardingDemo from "./OnboardingDemo";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <>
      {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
      {splashDone && <OnboardingDemo />}
      <div style={{ visibility: splashDone ? "visible" : "hidden" }}>
        {children}
      </div>
    </>
  );
}
