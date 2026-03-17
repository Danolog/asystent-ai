import { googleApiFetch } from "./google.service";

const DRIVE_BASE = "https://www.googleapis.com/drive/v3";
const DOCS_BASE = "https://docs.googleapis.com/v1";

// In-memory cache — lives as long as the serverless instance (~5–15 min on Vercel)
const cache = new Map<string, { data: unknown; expiry: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttlMs: number): void {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
}

interface DocSearchResult {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
}

export async function listGoogleDocs(
  userId: string,
  options: { query?: string; maxResults?: number } = {}
): Promise<DocSearchResult[]> {
  const cacheKey = `search:${userId}:${options.query ?? ""}:${options.maxResults ?? 10}`;
  const cached = getCached<DocSearchResult[]>(cacheKey);
  if (cached) return cached;

  let q = "mimeType='application/vnd.google-apps.document' and trashed=false";
  if (options.query) {
    q += ` and fullText contains '${options.query.replace(/'/g, "\\'")}'`;
  }

  const params = new URLSearchParams({
    q,
    fields: "files(id,name,modifiedTime,webViewLink)",
    orderBy: "modifiedTime desc",
    pageSize: String(options.maxResults || 10),
  });

  const response = await googleApiFetch(
    userId,
    `${DRIVE_BASE}/files?${params}`
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Drive API error: ${err}`);
  }

  const data = await response.json();
  const results = ((data.files || []) as DriveFile[]).map((f) => ({
    id: f.id,
    name: f.name,
    modifiedTime: f.modifiedTime,
    webViewLink: f.webViewLink,
  }));

  setCache(cacheKey, results, 5 * 60 * 1000); // 5 min TTL
  return results;
}

export async function readGoogleDoc(
  userId: string,
  documentId: string
): Promise<{ title: string; text: string }> {
  const cacheKey = `read:${userId}:${documentId}`;
  const cached = getCached<{ title: string; text: string }>(cacheKey);
  if (cached) return cached;

  // Fast path: export as plain text (much smaller than full JSON structure)
  try {
    const [exportResponse, metaResponse] = await Promise.all([
      googleApiFetch(userId, `${DRIVE_BASE}/files/${documentId}/export?mimeType=text/plain`),
      googleApiFetch(userId, `${DRIVE_BASE}/files/${documentId}?fields=name`),
    ]);

    if (exportResponse.ok) {
      const text = await exportResponse.text();
      const meta = metaResponse.ok ? await metaResponse.json() : { name: "Dokument" };
      const result = { title: meta.name || "Dokument", text: text.trim() };
      setCache(cacheKey, result, 10 * 60 * 1000); // 10 min TTL
      return result;
    }
  } catch {
    // Fall through to Docs API
  }

  // Fallback: full Docs API (slower, bigger response)
  const response = await googleApiFetch(
    userId,
    `${DOCS_BASE}/documents/${documentId}`
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Docs API error: ${err}`);
  }

  const doc = await response.json();
  const title: string = doc.title || "Bez tytułu";
  const text = extractTextFromDoc(doc);
  const result = { title, text };

  setCache(cacheKey, result, 10 * 60 * 1000); // 10 min TTL
  return result;
}

// Extract plain text from Google Docs JSON structure
function extractTextFromDoc(doc: Record<string, unknown>): string {
  const parts: string[] = [];
  const body = doc.body as { content?: Array<Record<string, unknown>> } | undefined;

  if (!body?.content) return "";

  for (const element of body.content) {
    if (element.paragraph) {
      const paragraph = element.paragraph as {
        elements?: Array<{ textRun?: { content?: string } }>;
      };
      const paraText = (paragraph.elements || [])
        .map((e) => e.textRun?.content || "")
        .join("");
      parts.push(paraText);
    } else if (element.table) {
      const table = element.table as {
        tableRows?: Array<{
          tableCells?: Array<{
            content?: Array<{
              paragraph?: {
                elements?: Array<{ textRun?: { content?: string } }>;
              };
            }>;
          }>;
        }>;
      };
      for (const row of table.tableRows || []) {
        const cells = (row.tableCells || []).map((cell) =>
          (cell.content || [])
            .map((c) =>
              (c.paragraph?.elements || [])
                .map((e) => e.textRun?.content || "")
                .join("")
            )
            .join("")
            .trim()
        );
        parts.push(`| ${cells.join(" | ")} |`);
      }
    }
  }

  return parts.join("\n").trim();
}
