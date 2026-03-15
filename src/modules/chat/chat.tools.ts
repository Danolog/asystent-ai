import { z } from "zod";
import { tool } from "ai";
import { addMemory, getRelevantMemories } from "@/modules/memory/memory.service";
import { searchDocumentChunks } from "@/modules/rag/rag.service";
import type { UUID, MemoryCategory } from "@/types";

async function searchWeb(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return "Wyszukiwanie niedostępne — brak klucza API.";

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 5,
        include_answer: true,
      }),
    });

    if (!response.ok) return "Wyszukiwanie nie powiodło się.";

    const data = await response.json();
    const results = (data.results || [])
      .slice(0, 3)
      .map(
        (r: { title: string; url: string; content: string }, i: number) =>
          `${i + 1}. [${r.title}](${r.url})\n   ${r.content.slice(0, 200)}`
      )
      .join("\n\n");

    return data.answer
      ? `Odpowiedź: ${data.answer}\n\nŹródła:\n${results}`
      : `Wyniki:\n${results}`;
  } catch {
    return "Błąd wyszukiwania.";
  }
}

export function createChatTools(userId: UUID, conversationId: UUID) {
  return {
    webSearch: tool({
      description:
        "Wyszukaj aktualne informacje w internecie. Używaj gdy pytanie wymaga aktualnych danych.",
      inputSchema: z.object({
        query: z.string().describe("Zapytanie do wyszukiwarki"),
      }),
      execute: async ({ query }) => {
        return await searchWeb(query);
      },
    }),

    searchDocuments: tool({
      description:
        "Przeszukaj bazę dokumentów użytkownika (RAG). Używaj gdy pytanie może dotyczyć przesłanych dokumentów.",
      inputSchema: z.object({
        query: z.string().describe("Zapytanie do bazy dokumentów"),
      }),
      execute: async ({ query }) => {
        const results = await searchDocumentChunks(userId, query);
        if (results.length === 0)
          return "Nie znalazłem odpowiedzi w dokumentach użytkownika.";
        return results
          .map(
            (r, i) =>
              `[${i + 1}] 📄 ${r.documentName}${r.pageNumber ? ` (s. ${r.pageNumber})` : ""}:\n${r.content.slice(0, 500)}`
          )
          .join("\n\n");
      },
    }),

    saveMemory: tool({
      description:
        "Zapisz ważną informację o użytkowniku do pamięci długoterminowej.",
      inputSchema: z.object({
        content: z.string().describe("Treść do zapamiętania"),
        category: z
          .enum(["preference", "fact", "context", "general"])
          .describe("Kategoria wspomnienia"),
      }),
      execute: async ({ content, category }) => {
        await addMemory(
          userId,
          content,
          category as MemoryCategory,
          conversationId
        );
        return `Zapamiętałem: "${content}"`;
      },
    }),

    recallMemories: tool({
      description:
        "Przywołaj zapamiętane informacje o użytkowniku.",
      inputSchema: z.object({
        reason: z.string().describe("Dlaczego przywołujesz wspomnienia"),
      }),
      execute: async () => {
        const mems = await getRelevantMemories(userId);
        if (mems.length === 0)
          return "Nie mam jeszcze żadnych wspomnień o Tobie.";
        return `Oto co pamiętam:\n${mems.join("\n")}`;
      },
    }),
  };
}
