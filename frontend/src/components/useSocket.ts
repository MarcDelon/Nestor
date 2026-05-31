"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  typeof window !== "undefined" && !window.location.hostname.includes("loca.lt")
    ? `http://${window.location.hostname}:5000`
    : process.env.NEXT_PUBLIC_API_URL || "http://192.168.100.107:5000";

interface Notification {
  type: string;
  title: string;
  body: string;
  [key: string]: any;
}

export function useSocket(onNotification?: (n: Notification) => void) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("notification", (data: Notification) => {
      onNotification?.(data);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", () => {
      setConnected(false);
    });

    socketRef.current = socket;
  }, [onNotification]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
  }, []);

  const markRead = useCallback((notificationId: number) => {
    socketRef.current?.emit("mark_read", { notificationId });
  }, []);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return { connect, disconnect, markRead, connected };
}
