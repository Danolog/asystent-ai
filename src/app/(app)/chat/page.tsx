"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/organisms/Sidebar";
import { ChatArea } from "@/components/organisms/ChatArea";

const STORAGE_KEY = "luna-last-conversation";

export default function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [key, setKey] = useState(0);
  const [restored, setRestored] = useState(false);

  // Restore last conversation from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setRestored(true);
      return;
    }
    // Verify conversation still exists
    fetch(`/api/conversations/${saved}`)
      .then((res) => {
        if (res.ok) {
          setActiveConversationId(saved);
          setKey((k) => k + 1);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setRestored(true));
  }, []);

  // Persist active conversation to localStorage
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem(STORAGE_KEY, activeConversationId);
    }
  }, [activeConversationId]);

  const handleNewConversation = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConversationId(data.id);
        setKey((k) => k + 1);
      }
    } catch {
      // silently fail
    }
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setKey((k) => k + 1);
  }, []);

  if (!restored) {
    return null;
  }

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <Sidebar
        activeConversationId={activeConversationId || undefined}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
      <main className="flex flex-1 flex-col min-w-0">
        {activeConversationId ? (
          <ChatArea key={key} conversationId={activeConversationId} />
        ) : (
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200">
                🌙 Witaj! Jestem Luna.
              </h2>
              <p className="mt-2 text-sm md:text-base text-gray-500">
                Kliknij &quot;Nowa rozmowa&quot; aby rozpocząć.
              </p>
              <button
                onClick={handleNewConversation}
                className="mt-4 rounded-lg bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
              >
                Rozpocznij rozmowę →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
