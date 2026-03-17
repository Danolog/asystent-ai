"use client";

import { useState, useEffect } from "react";
import { Plus, MessageSquare, Trash2, Menu, X } from "lucide-react";
import type { ConversationListItem } from "@/types";

interface SidebarProps {
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function Sidebar({
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: SidebarProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    []
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok && !cancelled) {
          setConversations(await res.json());
        }
      } catch {
        // silently fail
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeConversationId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Czy na pewno chcesz usunąć tę rozmowę?")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    const res = await fetch("/api/conversations");
    if (res.ok) setConversations(await res.json());
    if (activeConversationId === id) {
      localStorage.removeItem("luna-last-conversation");
      onNewConversation();
    }
  };

  const sidebarContent = (
    <>
      <div className="p-4">
        <button
          onClick={() => {
            onNewConversation();
            setIsOpen(false);
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Nowa rozmowa
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {conversations.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            Brak rozmów. Rozpocznij nową!
          </p>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => {
              onSelectConversation(conv.id);
              setIsOpen(false);
            }}
            className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              activeConversationId === conv.id
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <MessageSquare className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">{conv.title}</span>
            <button
              onClick={(e) => handleDelete(conv.id, e)}
              className="hidden rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500 group-hover:block dark:hover:bg-gray-700"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-3 top-3 z-50 rounded-lg bg-white p-2 shadow-md md:hidden dark:bg-gray-800"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - mobile drawer / desktop fixed */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-white pt-14 transition-transform md:relative md:pt-0 md:translate-x-0 dark:border-gray-700 dark:bg-gray-900 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
