import { z } from "zod";
import { tool } from "ai";
import { addMemory, getRelevantMemories } from "@/modules/memory/memory.service";
import { searchDocumentChunks } from "@/modules/rag/rag.service";
import { createNotification } from "@/modules/notifications/notifications.service";
import { isGoogleConnected } from "@/modules/google/google.service";
import {
  createCalendarEvent,
  listCalendarEvents,
} from "@/modules/google/calendar.service";
import {
  listGoogleDocs,
  readGoogleDoc,
} from "@/modules/google/docs.service";
import {
  listGmailMessages,
  readGmailMessage,
  createGmailDraft,
  sendGmailMessage,
} from "@/modules/google/gmail.service";
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

    createCalendarEvent: tool({
      description:
        "Utwórz wydarzenie w Google Calendar użytkownika. Używaj gdy użytkownik mówi o spotkaniu, terminie, wydarzeniu z konkretną datą/godziną.",
      inputSchema: z.object({
        summary: z.string().describe("Tytuł wydarzenia"),
        description: z.string().optional().describe("Opis wydarzenia"),
        startDateTime: z
          .string()
          .describe("Data i godzina rozpoczęcia w formacie ISO 8601 (np. 2026-03-20T14:00:00)"),
        endDateTime: z
          .string()
          .describe("Data i godzina zakończenia w formacie ISO 8601 (np. 2026-03-20T15:00:00)"),
        location: z.string().optional().describe("Miejsce wydarzenia"),
      }),
      execute: async (input) => {
        try {
          const connected = await isGoogleConnected(userId);
          if (!connected) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          const event = await createCalendarEvent(userId, input);
          return `Utworzyłem wydarzenie "${event.summary}" w kalendarzu.\nLink: ${event.htmlLink}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Nieznany błąd";
          if (msg.includes("not connected") || msg.includes("GOOGLE_NOT_CONNECTED")) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          return `Nie udało się utworzyć wydarzenia: ${msg}`;
        }
      },
    }),

    listCalendarEvents: tool({
      description:
        "Pokaż nadchodzące wydarzenia z Google Calendar. Używaj gdy użytkownik pyta co ma w kalendarzu, jakie ma spotkania, co jest zaplanowane.",
      inputSchema: z.object({
        timeMin: z
          .string()
          .optional()
          .describe("Od kiedy szukać (ISO 8601). Domyślnie: teraz."),
        timeMax: z
          .string()
          .optional()
          .describe("Do kiedy szukać (ISO 8601). Domyślnie: 7 dni do przodu."),
        maxResults: z
          .number()
          .optional()
          .describe("Maksymalna liczba wyników (domyślnie 10)"),
        q: z
          .string()
          .optional()
          .describe("Szukaj wydarzeń zawierających ten tekst"),
      }),
      execute: async (input) => {
        try {
          const connected = await isGoogleConnected(userId);
          if (!connected) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }

          const now = new Date();
          const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

          const events = await listCalendarEvents(userId, {
            timeMin: input.timeMin || now.toISOString(),
            timeMax: input.timeMax || weekLater.toISOString(),
            maxResults: input.maxResults,
            q: input.q,
          });

          if (events.length === 0) {
            return "Brak wydarzeń w tym okresie.";
          }

          return events
            .map((e, i) => {
              const start = e.start.dateTime || e.start.date || "?";
              const end = e.end.dateTime || e.end.date || "";
              const loc = e.location ? ` | ${e.location}` : "";
              return `${i + 1}. **${e.summary}**\n   ${start} → ${end}${loc}`;
            })
            .join("\n\n");
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Nieznany błąd";
          if (msg.includes("not connected") || msg.includes("GOOGLE_NOT_CONNECTED")) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          return `Nie udało się pobrać kalendarza: ${msg}`;
        }
      },
    }),

    searchGoogleDocs: tool({
      description:
        "Przeszukaj dokumenty Google Docs użytkownika. Zwraca listę dokumentów (bez treści). Aby odczytać treść, użyj readGoogleDoc z ID dokumentu.",
      inputSchema: z.object({
        query: z.string().describe("Szukaj dokumentów zawierających ten tekst"),
      }),
      execute: async (input) => {
        try {
          const connected = await isGoogleConnected(userId);
          if (!connected) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }

          const docs = await listGoogleDocs(userId, {
            query: input.query,
            maxResults: 5,
          });

          if (docs.length === 0) {
            return "Nie znalazłem dokumentów pasujących do zapytania.";
          }

          return docs
            .map((d, i) => `${i + 1}. **${d.name}**\n   ID: \`${d.id}\`\n   Link: ${d.webViewLink}`)
            .join("\n\n") + "\n\nAby odczytać treść, użyj readGoogleDoc z ID dokumentu.";
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Nieznany błąd";
          if (msg.includes("not connected") || msg.includes("GOOGLE_NOT_CONNECTED")) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          return `Nie udało się przeszukać dokumentów: ${msg}`;
        }
      },
    }),

    readGoogleDoc: tool({
      description:
        "Odczytaj pełną treść konkretnego dokumentu Google Docs po jego ID. Używaj po searchGoogleDocs.",
      inputSchema: z.object({
        documentId: z.string().describe("ID dokumentu Google Docs (uzyskane z searchGoogleDocs)"),
      }),
      execute: async (input) => {
        try {
          const connected = await isGoogleConnected(userId);
          if (!connected) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }

          const doc = await readGoogleDoc(userId, input.documentId);
          const truncated =
            doc.text.length > 3000
              ? doc.text.slice(0, 3000) + "\n...(skrócono)"
              : doc.text;
          return `**${doc.title}**\n\n${truncated}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Nieznany błąd";
          if (msg.includes("not connected") || msg.includes("GOOGLE_NOT_CONNECTED")) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          return `Nie udało się odczytać dokumentu: ${msg}`;
        }
      },
    }),

    searchGmail: tool({
      description:
        "Przeszukaj emaile w Gmail użytkownika. Używaj gdy użytkownik pyta o maile, wiadomości email, korespondencję.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            "Zapytanie w składni Gmail (np. 'from:jan@example.com', 'subject:faktura', 'is:unread', lub dowolny tekst)"
          ),
        maxResults: z
          .number()
          .optional()
          .describe("Maksymalna liczba wyników (domyślnie 10)"),
      }),
      execute: async (input) => {
        try {
          const connected = await isGoogleConnected(userId);
          if (!connected) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          const messages = await listGmailMessages(userId, {
            q: input.query,
            maxResults: input.maxResults,
          });
          if (messages.length === 0) {
            return "Nie znaleziono wiadomości pasujących do zapytania.";
          }
          return messages
            .map((m, i) => {
              return `${i + 1}. **${m.subject || "(brak tematu)"}**\n   Od: ${m.from}\n   Data: ${m.date}\n   ${m.snippet}\n   _ID: ${m.id}_`;
            })
            .join("\n\n");
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Nieznany błąd";
          if (msg.includes("not connected") || msg.includes("GOOGLE_NOT_CONNECTED")) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          return `Nie udało się przeszukać maili: ${msg}`;
        }
      },
    }),

    readGmail: tool({
      description:
        "Odczytaj pełną treść konkretnego emaila z Gmail po jego ID. Używaj po searchGmail aby zobaczyć pełną treść wiadomości.",
      inputSchema: z.object({
        messageId: z.string().describe("ID wiadomości Gmail (uzyskane z searchGmail)"),
      }),
      execute: async (input) => {
        try {
          const connected = await isGoogleConnected(userId);
          if (!connected) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          const message = await readGmailMessage(userId, input.messageId);
          const bodyTruncated =
            message.body.length > 3000
              ? message.body.slice(0, 3000) + "\n...(skrócono)"
              : message.body;
          return `**${message.subject || "(brak tematu)"}**\nOd: ${message.from}\nDo: ${message.to}\nData: ${message.date}\n\n${bodyTruncated}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Nieznany błąd";
          if (msg.includes("not connected") || msg.includes("GOOGLE_NOT_CONNECTED")) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          return `Nie udało się odczytać wiadomości: ${msg}`;
        }
      },
    }),

    createGmailDraft: tool({
      description:
        "Utwórz szkic emaila w Gmail. Używaj gdy użytkownik prosi o przygotowanie/napisanie maila bez wysyłania.",
      inputSchema: z.object({
        to: z.string().describe("Adres email odbiorcy"),
        subject: z.string().describe("Temat wiadomości"),
        body: z.string().describe("Treść wiadomości"),
        cc: z.string().optional().describe("Adresy CC (opcjonalne)"),
      }),
      execute: async (input) => {
        try {
          const connected = await isGoogleConnected(userId);
          if (!connected) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          const draft = await createGmailDraft(userId, input);
          return `Utworzyłem szkic wiadomości do ${input.to} z tematem "${input.subject}".\nID szkicu: ${draft.id}\nMożesz go znaleźć w folderze Szkice w Gmail.`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Nieznany błąd";
          if (msg.includes("not connected") || msg.includes("GOOGLE_NOT_CONNECTED")) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          return `Nie udało się utworzyć szkicu: ${msg}`;
        }
      },
    }),

    sendGmail: tool({
      description:
        "Wyślij email z Gmail użytkownika. WAŻNE: Zawsze potwierdź treść, temat i odbiorcę z użytkownikiem PRZED wysłaniem. Używaj tylko gdy użytkownik wyraźnie potwierdzi że chce wysłać.",
      inputSchema: z.object({
        to: z.string().describe("Adres email odbiorcy"),
        subject: z.string().describe("Temat wiadomości"),
        body: z.string().describe("Treść wiadomości"),
        cc: z.string().optional().describe("Adresy CC (opcjonalne)"),
      }),
      execute: async (input) => {
        try {
          const connected = await isGoogleConnected(userId);
          if (!connected) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          const result = await sendGmailMessage(userId, input);
          return `Wiadomość wysłana pomyślnie do ${input.to}.\nTemat: "${input.subject}"\nID: ${result.id}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Nieznany błąd";
          if (msg.includes("not connected") || msg.includes("GOOGLE_NOT_CONNECTED")) {
            return "Nie masz połączonego konta Google. Przejdź do Ustawienia → Integracje, aby połączyć konto Google.";
          }
          return `Nie udało się wysłać wiadomości: ${msg}`;
        }
      },
    }),

    createReminder: tool({
      description:
        "Utwórz przypomnienie/powiadomienie push dla użytkownika. Używaj gdy użytkownik mówi 'przypomnij mi', 'ustaw przypomnienie', 'powiadom mnie o...', lub wspomina o terminie płatności/spotkaniu.",
      inputSchema: z.object({
        content: z.string().describe("Treść przypomnienia"),
        scheduledAt: z
          .string()
          .describe("Data i godzina wysyłki w formacie ISO 8601 z timezone Europe/Warsaw. ZAWSZE dodawaj offset +01:00 (zima) lub +02:00 (lato). Np. 2026-03-20T09:00:00+01:00"),
        recurrence: z
          .enum(["once", "daily", "weekly", "monthly"])
          .optional()
          .describe("Powtarzalność: once (domyślnie), daily, weekly, monthly"),
      }),
      execute: async (input) => {
        try {
          const date = new Date(input.scheduledAt);
          if (isNaN(date.getTime())) {
            return "Nieprawidłowa data. Podaj datę w formacie ISO 8601.";
          }
          if (date <= new Date()) {
            return "Data musi być w przyszłości.";
          }

          const notification = await createNotification(
            userId,
            input.content,
            date,
            input.recurrence || "once"
          );

          const dateStr = date.toLocaleString("pl-PL", {
            timeZone: "Europe/Warsaw",
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          });

          const recurrenceLabel =
            input.recurrence === "daily" ? " (codziennie)" :
            input.recurrence === "weekly" ? " (co tydzień)" :
            input.recurrence === "monthly" ? " (co miesiąc)" : "";

          return `Przypomnienie ustawione: "${input.content}"\nTermin: ${dateStr}${recurrenceLabel}\n\nZnajdziesz je w zakładce Powiadomienia.`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Nieznany błąd";
          return `Nie udało się utworzyć przypomnienia: ${msg}`;
        }
      },
    }),
  };
}
