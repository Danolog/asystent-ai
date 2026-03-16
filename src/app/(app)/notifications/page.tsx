"use client";

import { useState, useEffect } from "react";
import { Bell, Plus, Trash2, Pause, Play, AlertCircle } from "lucide-react";
import type { NotificationListItem, NotificationRecurrence } from "@/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [recurrence, setRecurrence] = useState<NotificationRecurrence>("once");
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch { /* silently fail */ }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, scheduledAt: new Date(scheduledAt).toISOString(), recurrence }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed");
      }
      setContent("");
      setScheduledAt("");
      setRecurrence("once");
      setShowForm(false);
      await fetchNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    await fetchNotifications();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć to powiadomienie?")) return;
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    await fetchNotifications();
  };

  const recurrenceLabels: Record<NotificationRecurrence, string> = {
    once: "Jednorazowe",
    daily: "Codziennie",
    weekly: "Co tydzień",
    monthly: "Co miesiąc",
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200">
          🔔 Powiadomienia
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
        >
          <Plus className="h-4 w-4" />
          Nowe powiadomienie
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Treść</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Np. Zapłać fakturę za internet"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                rows={2}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data i godzina</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Powtarzalność</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as NotificationRecurrence)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="once">Jednorazowe</option>
                  <option value="daily">Codziennie</option>
                  <option value="weekly">Co tydzień</option>
                  <option value="monthly">Co miesiąc</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600">
                Zapisz
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300">
                Anuluj
              </button>
            </div>
          </div>
        </form>
      )}

      {notifications.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
            Nie masz jeszcze żadnych powiadomień
          </h3>
          <p className="mt-2 text-gray-500">
            Ustaw przypomnienie, a wyślemy je na Twój WhatsApp.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-center justify-between rounded-lg border p-4 ${
                n.isActive ? "border-gray-200 dark:border-gray-700" : "border-gray-100 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-800/50"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{n.content}</p>
                <p className="text-xs text-gray-500">
                  {new Date(n.scheduledAt).toLocaleString("pl")} · {recurrenceLabels[n.recurrence]}
                  {n.isActive ? " · 🟢 Aktywne" : " · ⏸ Wstrzymane"}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleToggle(n.id, n.isActive)}
                  className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                  title={n.isActive ? "Wstrzymaj" : "Wznów"}
                >
                  {n.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
