"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Save, Trash2, Brain, Fingerprint, Plus, Shield, Link, Unlink, Calendar, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import type { MemoryListItem } from "@/types";

type TabId = "profile" | "memory" | "preferences" | "security" | "integrations";

interface PasskeyItem {
  id: string;
  name?: string;
  createdAt: string;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Ładowanie...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) || "profile";

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [memories, setMemories] = useState<MemoryListItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeySuccess, setPasskeySuccess] = useState<string | null>(null);

  // Google integration state
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "memory") return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/memory");
        if (res.ok && !cancelled) setMemories(await res.json());
      } catch { /* silently fail */ }
    }
    load();
    return () => { cancelled = true; };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "security") return;
    let cancelled = false;
    async function loadPasskeys() {
      try {
        const res = await authClient.passkey.listUserPasskeys();
        if (!cancelled && res?.data) {
          setPasskeys(
            res.data.map((p) => ({
              id: p.id,
              name: p.name,
              createdAt: new Date(p.createdAt).toISOString(),
            }))
          );
        }
      } catch { /* silently fail */ }
    }
    loadPasskeys();
    return () => { cancelled = true; };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "integrations") return;
    let cancelled = false;
    async function loadGoogleStatus() {
      try {
        const res = await fetch("/api/google/status");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setGoogleConnected(data.connected);
        }
      } catch { /* silently fail */ }
    }
    loadGoogleStatus();
    return () => { cancelled = true; };
  }, [activeTab]);

  const handleDeleteMemory = async (id: string) => {
    await fetch(`/api/memory/${id}`, { method: "DELETE" });
    const res = await fetch("/api/memory");
    if (res.ok) setMemories(await res.json());
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* silently fail */ }
  };

  const handleAddPasskey = async () => {
    setPasskeyError(null);
    setPasskeySuccess(null);
    setPasskeyLoading(true);
    try {
      const res = await authClient.passkey.addPasskey({
        name: `Passkey ${new Date().toLocaleDateString("pl")}`,
      });
      if (res?.error) {
        setPasskeyError(res.error.message || "Nie udało się dodać passkey");
      } else {
        setPasskeySuccess("Passkey dodany pomyślnie!");
        setTimeout(() => setPasskeySuccess(null), 3000);
        // Reload passkeys list
        const listRes = await authClient.passkey.listUserPasskeys();
        if (listRes?.data) {
          setPasskeys(
            listRes.data.map((p) => ({
              id: p.id,
              name: p.name,
              createdAt: new Date(p.createdAt).toISOString(),
            }))
          );
        }
      }
    } catch {
      setPasskeyError("Urządzenie nie obsługuje passkeys lub operacja została anulowana");
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    setPasskeyError(null);
    try {
      await authClient.passkey.deletePasskey({ id });
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setPasskeyError("Nie udało się usunąć passkey");
    }
  };

  const handleConnectGoogle = async () => {
    setGoogleLoading(true);
    try {
      await authClient.linkSocial({
        provider: "google",
        callbackURL: "/settings?tab=integrations",
      });
    } catch {
      setGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setGoogleLoading(true);
    try {
      await authClient.unlinkAccount({ providerId: "google" });
      setGoogleConnected(false);
    } catch { /* silently fail */ }
    setGoogleLoading(false);
  };

  const tabs = [
    { id: "profile" as const, label: "Profil" },
    { id: "memory" as const, label: "Pamięć" },
    { id: "security" as const, label: "Bezpieczeństwo" },
    { id: "integrations" as const, label: "Integracje" },
    { id: "preferences" as const, label: "Preferencje" },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6 overflow-y-auto">
      <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
        Ustawienia
      </h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imię</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Twoje imię"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numer WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+48 123 456 789"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">Numer na który będą wysyłane powiadomienia.</p>
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
          >
            <Save className="h-4 w-4" />
            Zapisz zmiany
          </button>
          {saved && <p className="text-sm text-green-600">Zapisano!</p>}
        </form>
      )}

      {activeTab === "memory" && (
        <div>
          <p className="mb-4 text-sm text-gray-500">
            Rzeczy które asystent o Tobie zapamiętał. Możesz usunąć dowolne wspomnienie.
          </p>
          {memories.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <Brain className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-3 text-gray-500">Asystent jeszcze nic o Tobie nie zapamiętał.</p>
              <p className="text-sm text-gray-400">Powiedz mu &quot;zapamiętaj, że...&quot; w czacie.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{m.content}</p>
                    <p className="text-xs text-gray-400">
                      {m.category} · {new Date(m.createdAt).toLocaleDateString("pl")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteMemory(m.id)}
                    className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "security" && (
        <div className="max-w-md">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Passkeys (biometria)
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Loguj się odciskiem palca, Face ID lub Windows Hello.
              </p>
            </div>
          </div>

          <button
            onClick={handleAddPasskey}
            disabled={passkeyLoading}
            className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {passkeyLoading ? "Rejestrowanie..." : "Dodaj Passkey"}
          </button>

          {passkeyError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {passkeyError}
            </div>
          )}

          {passkeySuccess && (
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
              {passkeySuccess}
            </div>
          )}

          {passkeys.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
              <Shield className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-3 text-gray-500">Brak zarejestrowanych passkeys.</p>
              <p className="text-sm text-gray-400">Dodaj passkey, aby logować się biometrycznie.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <Fingerprint className="h-5 w-5 text-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {pk.name || "Passkey"}
                      </p>
                      <p className="text-xs text-gray-400">
                        Dodano {new Date(pk.createdAt).toLocaleDateString("pl")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePasskey(pk.id)}
                    className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="max-w-md">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Google
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kalendarz, Dokumenty Google
                </p>
              </div>
              <div className="flex items-center">
                {googleConnected === null ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : googleConnected ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Połączone
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <XCircle className="h-4 w-4" />
                    Niepodłączone
                  </span>
                )}
              </div>
            </div>

            <div className="mb-4 space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Tworzenie i odczyt wydarzeń z Google Calendar</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                <span>Odczyt dokumentów z Google Docs</span>
              </div>
            </div>

            {googleConnected ? (
              <button
                onClick={handleDisconnectGoogle}
                disabled={googleLoading}
                className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
                Odłącz Google
              </button>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={googleLoading || googleConnected === null}
                className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link className="h-4 w-4" />
                )}
                Połącz Google
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === "preferences" && (
        <div className="max-w-md space-y-4">
          <p className="text-sm text-gray-500">Preferencje będą dostępne w przyszłych aktualizacjach.</p>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Planowane: język interfejsu, ciemny motyw, domyślny tryb TTS.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
