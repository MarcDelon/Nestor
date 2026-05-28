/**
 * SafeTrip Icon Library
 * Professional SVG icons replacing emoji throughout the UI.
 * Usage: <Icon name="wifi" size={16} />
 */

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

type IconName =
  | "wifi" | "ac" | "toilet" | "tv" | "usb" | "minibar" | "seat-leather"
  | "gps" | "mic" | "seat-recline" | "luggage" | "guide" | "catering" | "deco"
  | "bus" | "minibus" | "van" | "car" | "users" | "user"
  | "map-pin" | "map" | "route"
  | "star" | "star-filled" | "trending-up" | "heart" | "ring" | "graduation"
  | "briefcase" | "sun" | "building" | "clock" | "calendar" | "check"
  | "check-circle" | "x-circle" | "info" | "alert"
  | "search" | "filter" | "sort" | "chevron-down" | "chevron-right"
  | "arrow-right" | "arrow-left" | "send" | "phone" | "mail" | "globe"
  | "ticket" | "package" | "shield" | "zap" | "flag" | "plus" | "minus"
  | "eye" | "lock" | "menu" | "x" | "refresh" | "download" | "share"
  | "clipboard" | "qr-code" | "scan";

const paths: Record<IconName, React.ReactNode> = {
  /* ── Amenities ── */
  wifi:         <><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></>,
  ac:           <><path d="M8 2v20M16 2v20M2 12h20M2 8h4M18 8h4M2 16h4M18 16h4"/><circle cx="12" cy="12" r="2"/></>,
  toilet:       <><path d="M6 2h12M6 2C5 2 4 3 4 4v4h16V4c0-1-1-2-2-2M4 8v4a8 8 0 0 0 16 0V8"/><path d="M12 16v6M8 22h8"/></>,
  tv:           <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>,
  usb:          <><path d="M12 2v8M7 7l5 3 5-3M5 21h14a1 1 0 0 0 1-1v-6H4v6a1 1 0 0 0 1 1z"/><circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/></>,
  minibar:      <><path d="M8 2h8l1 8H7L8 2z"/><path d="M7 10h10l1 10H6L7 10z"/><path d="M10 14v4M14 14v4"/></>,
  "seat-leather": <><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 1H5a2 2 0 0 1-2-1v-1a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1z"/></>,
  gps:          <><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 0 0-8-8z"/></>,
  mic:          <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
  "seat-recline": <><circle cx="15" cy="4" r="2"/><path d="M10.5 8.5 9 14l4.5 1.5L15 22"/><path d="M9 14H5.5a1.5 1.5 0 0 1 0-3H9"/><path d="M11.5 22H19l-2-5"/></>,
  luggage:      <><rect x="6" y="8" width="12" height="14" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></>,
  guide:        <><path d="M3 12h6M3 6h18M3 18h18M9 12l3 3 3-3"/></>,
  catering:     <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></>,
  deco:         <><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6c0 0-4 4-4 7s1.79 3 4 3 4-.21 4-3-4-7-4-7z"/><path d="M12 6v13"/></>,

  /* ── Vehicles ── */
  bus:          <><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M2 10h20M7 4v14M17 4v14M5 18v2M19 18v2"/></>,
  minibus:      <><path d="M2 14V6a2 2 0 0 1 2-2h14l4 4v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path d="M5 18v2M19 18v2M2 10h20"/><circle cx="6" cy="18" r="1" fill="currentColor"/><circle cx="18" cy="18" r="1" fill="currentColor"/></>,
  van:          <><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-1"/><circle cx="9" cy="17" r="2"/><circle cx="19" cy="17" r="2"/></>,
  car:          <><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2l3.5-2h9l3.5 2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><circle cx="9" cy="17" r="2"/><circle cx="15" cy="17" r="2"/></>,

  /* ── People ── */
  users:        <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  user:         <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,

  /* ── Location ── */
  "map-pin":    <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
  map:          <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
  route:        <><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></>,

  /* ── Status / Rating ── */
  star:         <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  "star-filled": <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/></>,
  "trending-up": <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  heart:        <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
  ring:         <><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></>,
  graduation:   <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>,
  briefcase:    <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 12v4M10 14h4"/></>,
  sun:          <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  building:     <><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 22V12h6v10M3 9h18M3 15h18"/></>,

  /* ── Time/Date ── */
  clock:        <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  calendar:     <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,

  /* ── Feedback ── */
  check:        <><polyline points="20 6 9 17 4 12"/></>,
  "check-circle": <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  "x-circle":   <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
  info:         <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  alert:        <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,

  /* ── UI Controls ── */
  search:       <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  filter:       <><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></>,
  sort:         <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></>,
  "chevron-down": <><polyline points="6 9 12 15 18 9"/></>,
  "chevron-right": <><polyline points="9 18 15 12 9 6"/></>,
  "arrow-right":  <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  "arrow-left":   <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
  send:         <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  phone:        <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.21 12 19.79 19.79 0 0 1 1.14 3.38a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></>,
  mail:         <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  globe:        <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,

  /* ── Content ── */
  ticket:       <><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><line x1="9" y1="9" x2="9" y2="15"/></>,
  package:      <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  shield:       <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  zap:          <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  flag:         <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
  plus:         <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  minus:        <><line x1="5" y1="12" x2="19" y2="12"/></>,
  eye:          <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  lock:         <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  menu:         <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  x:            <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  refresh:      <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>,
  download:     <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  share:        <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
  clipboard:    <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>,
  "qr-code":    <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3" fill="currentColor"/><rect x="16" y="5" width="3" height="3" fill="currentColor"/><rect x="5" y="16" width="3" height="3" fill="currentColor"/><path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 17h3v3"/></>,
  scan:         <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></>,
};

export function Icon({ name, size = 18, color, strokeWidth = 2, className, style }: IconProps & { name: IconName }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

/* Convenience amenity icon mapper */
export const AMENITY_ICONS: Record<string, IconName> = {
  ac:          "ac",
  wifi:        "wifi",
  toilet:      "toilet",
  tv:          "tv",
  usb:         "usb",
  mini_bar:    "minibar",
  leather:     "seat-leather",
  gps:         "gps",
  sono:        "mic",
  reclining:   "seat-recline",
  luggage:     "luggage",
  guide:       "guide",
  catering:    "catering",
  deco:        "deco",
};

export const BUS_TYPE_ICONS: Record<string, IconName> = {
  minibus:   "minibus",
  confort:   "bus",
  classique: "bus",
  vip:       "bus",
  grande:    "bus",
};

export const USAGE_ICONS: Record<string, IconName> = {
  mariage:     "heart",
  excursion:   "sun",
  corporate:   "briefcase",
  scolaire:    "graduation",
  pelerinage:  "building",
  humanitaire: "shield",
};

export type { IconName };
