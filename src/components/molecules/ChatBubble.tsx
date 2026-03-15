"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SourceType } from "@/types";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  sourceType?: SourceType | null;
  isStreaming?: boolean;
}

const sourceBadges: Record<string, { label: string; icon: string }> = {
  rag: { label: "RAG", icon: "📄" },
  web: { label: "Web", icon: "🌐" },
  ai: { label: "AI", icon: "🤖" },
  memory: { label: "Memory", icon: "🧠" },
  tool: { label: "Tool", icon: "🔧" },
};

export function ChatBubble({
  role,
  content,
  sourceType,
  isStreaming,
}: ChatBubbleProps) {
  const isUser = role === "user";
  const badge = sourceType ? sourceBadges[sourceType] : null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-indigo-500 text-white"
            : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}
        {isStreaming && (
          <span className="inline-block animate-pulse ml-1">▊</span>
        )}
        {badge && !isUser && (
          <div className="mt-2 flex items-center gap-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {badge.icon} {badge.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
