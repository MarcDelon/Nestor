"use client";

import { useState, useCallback } from "react";
import SplashScreen from "./SplashScreen";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <>
      {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
      <div style={{ visibility: splashDone ? "visible" : "hidden" }}>
        {children}
      </div>
    </>
  );
}
