"use client";

import { useState, useEffect } from "react";
import { Save, Trash2, Brain } from "lucide-react";
import type { MemoryListItem } from "@/types";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "memory" | "preferences">("profile");
  const [memories, setMemories] = useState<MemoryListItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

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

  const tabs = [
    { id: "profile" as const, label: "Profil" },
    { id: "memory" as const, label: "Pamięć" },
    { id: "preferences" as const, label: "Preferencje" },
  ];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
        ⚙️ Ustawienia
      </h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
