import { googleApiFetch } from "./google.service";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessagePart {
  mimeType: string;
  body?: { data?: string; size?: number };
  parts?: GmailMessagePart[];
  headers?: GmailMessageHeader[];
}

interface GmailMessageRaw {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload: GmailMessagePart & { headers: GmailMessageHeader[] };
  internalDate: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  body: string;
  labels: string[];
}

interface GmailComposeInput {
  to: string;
  subject: string;
  body: string;
  cc?: string;
}

// --- Helpers ---

function base64UrlDecode(data: string): string {
  const padded = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf-8");
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function getHeader(headers: GmailMessageHeader[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function extractBody(payload: GmailMessagePart): string {
  // Direct body (simple messages)
  if (payload.body?.data) {
    return base64UrlDecode(payload.body.data);
  }

  // Multipart messages — prefer text/plain, fallback to text/html
  if (payload.parts) {
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return base64UrlDecode(textPart.body.data);
    }

    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      const html = base64UrlDecode(htmlPart.body.data);
      return stripHtml(html);
    }

    // Nested multipart (e.g. multipart/alternative inside multipart/mixed)
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }

  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildMimeMessage(input: GmailComposeInput): string {
  const lines = [
    `To: ${input.to}`,
    ...(input.cc ? [`Cc: ${input.cc}`] : []),
    `Subject: =?UTF-8?B?${Buffer.from(input.subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(input.body).toString("base64"),
  ];
  return lines.join("\r\n");
}

function parseMessage(raw: GmailMessageRaw): GmailMessage {
  const headers = raw.payload.headers;
  return {
    id: raw.id,
    threadId: raw.threadId,
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    subject: getHeader(headers, "Subject"),
    date: getHeader(headers, "Date"),
    snippet: raw.snippet,
    body: extractBody(raw.payload),
    labels: raw.labelIds || [],
  };
}

// --- Exported API functions ---

export async function listGmailMessages(
  userId: string,
  options: { q?: string; maxResults?: number } = {}
): Promise<GmailMessage[]> {
  const params = new URLSearchParams({
    maxResults: String(options.maxResults || 10),
  });
  if (options.q) params.set("q", options.q);

  const listResponse = await googleApiFetch(
    userId,
    `${GMAIL_BASE}/messages?${params}`
  );

  if (!listResponse.ok) {
    const err = await listResponse.text();
    throw new Error(`Gmail API error: ${err}`);
  }

  const listData = await listResponse.json();
  const messageIds: { id: string }[] = listData.messages || [];

  if (messageIds.length === 0) return [];

  // Fetch metadata for each message (in parallel, limited batch)
  const messages = await Promise.all(
    messageIds.slice(0, options.maxResults || 10).map(async (m) => {
      const res = await googleApiFetch(
        userId,
        `${GMAIL_BASE}/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`
      );
      if (!res.ok) return null;
      const raw: GmailMessageRaw = await res.json();
      const headers = raw.payload.headers;
      return {
        id: raw.id,
        threadId: raw.threadId,
        from: getHeader(headers, "From"),
        to: getHeader(headers, "To"),
        subject: getHeader(headers, "Subject"),
        date: getHeader(headers, "Date"),
        snippet: raw.snippet,
        body: "",
        labels: raw.labelIds || [],
      } satisfies GmailMessage;
    })
  );

  return messages.filter((m): m is GmailMessage => m !== null);
}

export async function readGmailMessage(
  userId: string,
  messageId: string
): Promise<GmailMessage> {
  const response = await googleApiFetch(
    userId,
    `${GMAIL_BASE}/messages/${messageId}?format=full`
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gmail API error: ${err}`);
  }

  const raw: GmailMessageRaw = await response.json();
  return parseMessage(raw);
}

export async function createGmailDraft(
  userId: string,
  input: GmailComposeInput
): Promise<{ id: string; messageId: string }> {
  const mime = buildMimeMessage(input);
  const raw = base64UrlEncode(mime);

  const response = await googleApiFetch(userId, `${GMAIL_BASE}/drafts`, {
    method: "POST",
    body: JSON.stringify({ message: { raw } }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gmail API error: ${err}`);
  }

  const data = await response.json();
  return { id: data.id, messageId: data.message.id };
}

export async function sendGmailMessage(
  userId: string,
  input: GmailComposeInput
): Promise<{ id: string; threadId: string }> {
  const mime = buildMimeMessage(input);
  const raw = base64UrlEncode(mime);

  const response = await googleApiFetch(
    userId,
    `${GMAIL_BASE}/messages/send`,
    {
      method: "POST",
      body: JSON.stringify({ raw }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gmail API error: ${err}`);
  }

  const data = await response.json();
  return { id: data.id, threadId: data.threadId };
}
