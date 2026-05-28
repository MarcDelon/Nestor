"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    smartsupp: ((...args: unknown[]) => void) & { _: unknown[] };
    _smartsupp: { key: string };
  }
}

export default function SmartsuppChat() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = process.env.NEXT_PUBLIC_SMARTSUPP_KEY || "";
    if (!key) return; // don't inject if no key configured

    window._smartsupp = { key };
    window.smartsupp =
      window.smartsupp ||
      Object.assign(function (...args: unknown[]) {
        (window.smartsupp._ = window.smartsupp._ || []).push(args);
      }, { _: [] as unknown[] });

    const s = document.getElementsByTagName("script")[0];
    const c = document.createElement("script");
    c.type = "text/javascript";
    c.charset = "utf-8";
    c.async = true;
    c.src = `https://www.smartsupp.com/loader.js?key=${key}`;
    if (s?.parentNode) s.parentNode.insertBefore(c, s);
  }, []);

  return null;
}

/**
 * Utility: open Smartsupp chat and pre-fill with a message.
 * Call from any client component after the widget is loaded.
 */
export function openSmartsuppWithMessage(message: string, visitorName?: string, visitorEmail?: string) {
  if (typeof window === "undefined" || typeof window.smartsupp !== "function") return;
  if (visitorName) window.smartsupp("name", visitorName);
  if (visitorEmail) window.smartsupp("email", visitorEmail);
  window.smartsupp("chat:open");
  // Smartsupp v5+ supports pre-filling the message box
  window.smartsupp("chat:message", message);
}
