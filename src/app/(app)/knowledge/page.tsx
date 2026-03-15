"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, FileText, AlertCircle } from "lucide-react";
import type { DocumentListItem } from "@/types";

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [usage, setUsage] = useState({ usedBytes: 0, maxBytes: 0, documentCount: 0 });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
        setUsage(data.usage);
      }
    } catch { /* silently fail */ }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Upload failed");
      }
      await fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten dokument?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    await fetchDocuments();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
          📄 Baza Wiedzy
        </h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Przesyłanie..." : "Dodaj dokument"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="mb-4 text-sm text-gray-500">
        Wykorzystano: {formatBytes(usage.usedBytes)} / {formatBytes(usage.maxBytes)} ({usage.documentCount} dokumentów)
      </div>

      {documents.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
            Twoja baza wiedzy jest pusta
          </h3>
          <p className="mt-2 text-gray-500">
            Wrzuć dokumenty (PDF, DOCX, TXT), a asystent będzie mógł odpowiadać na pytania o ich treść.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 rounded-lg bg-indigo-500 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-600"
          >
            Dodaj swój pierwszy dokument
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatBytes(doc.sizeBytes)} · {new Date(doc.createdAt).toLocaleDateString("pl")} ·{" "}
                    {doc.status === "ready" ? (
                      <span className="text-green-600">✓ Gotowy ({doc.chunkCount} chunków)</span>
                    ) : doc.status === "processing" ? (
                      <span className="text-yellow-600">⏳ Przetwarzanie...</span>
                    ) : (
                      <span className="text-red-600">✗ Błąd</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
