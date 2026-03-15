"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { ChatBubble } from "@/components/molecules/ChatBubble";
import { Send } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatAreaProps {
  conversationId: string;
  initialMessages?: ChatMessage[];
}

export function ChatArea({ conversationId, initialMessages }: ChatAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages || []
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch existing messages when loading a conversation
  useEffect(() => {
    async function loadMessages() {
      if (!conversationId) return;
      try {
        const res = await fetch(`/api/conversations/${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(
            data.messages.map((m: { id: string; role: string; content: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
        }
      } catch {
        // silently fail
      }
    }
    if (!initialMessages?.length) {
      loadMessages();
    }
  }, [conversationId, initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsStreaming(true);

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, content: content.trim() }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: fullText } : m
            )
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Wystąpił błąd. Spróbuj ponownie.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [conversationId, isStreaming]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                👋 Cześć! W czym mogę Ci pomóc?
              </h2>
              <p className="mt-2 text-gray-500">
                Zadaj pytanie, wrzuć dokument lub poproś o wyszukanie w
                internecie.
              </p>
            </div>
          </div>
        )}
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            role={message.role}
            content={message.content}
            isStreaming={
              isStreaming &&
              message.id === messages[messages.length - 1]?.id &&
              message.role === "assistant"
            }
          />
        ))}
        {error && (
          <div className="mx-auto max-w-md rounded-lg bg-red-50 p-4 text-center text-red-600">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <TextareaAutosize
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Wpisz wiadomość..."
            className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            maxRows={6}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-500 text-white transition-colors hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
