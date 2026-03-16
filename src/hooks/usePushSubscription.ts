"use client";

import { useState, useEffect, useCallback } from "react";

type PermissionState = "prompt" | "granted" | "denied" | "unsupported";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const [permission, setPermission] = useState<PermissionState>("prompt");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      setLoading(false);
      return;
    }

    setPermission(Notification.permission as PermissionState);

    // Check existing subscription
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
        setLoading(false);
      });
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) return;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);

      if (result !== "granted") {
        setLoading(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      setIsSubscribed(true);
    } catch {
      // Permission denied or subscription failed
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch {
      // Unsubscribe failed
    } finally {
      setLoading(false);
    }
  }, []);

  return { permission, isSubscribed, loading, subscribe, unsubscribe };
}
