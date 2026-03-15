"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/organisms/Sidebar";
import { ChatArea } from "@/components/organisms/ChatArea";

export default function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [key, setKey] = useState(0);

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

  return (
    <div className="flex flex-1">
      <Sidebar
        activeConversationId={activeConversationId || undefined}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
      <main className="flex flex-1 flex-col">
        {activeConversationId ? (
          <ChatArea key={key} conversationId={activeConversationId} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                👋 Witaj w Asystencie AI!
              </h2>
              <p className="mt-2 text-gray-500">
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
