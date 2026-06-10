"use client";

import { useCallback, useState } from "react";
import { useCameraCapture } from "@/components/camera-capture";
import { Button, Card, Input, Skeleton } from "@/components/ui";
import { VisualSearchImagePreview, VisualSearchResultCards } from "@/components/visual-search-cards";
import { searchByImage } from "@/lib/services/visual-search";
import { fileToBase64, validateImageFile } from "@/lib/utils/image-upload";

export default function VisualSearchPage() {
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof searchByImage>> | null>(null);

  const runVisualSearch = useCallback(async (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);
    setMessage(null);
    setResult(null);
    setPreview(URL.createObjectURL(file));

    try {
      const { base64, mimeType } = await fileToBase64(file);
      const response = await searchByImage(base64, mimeType);
      setResult(response);
      setMessage(response.text.replace(/\*\*/g, ""));
    } catch {
      setError("Visual search failed. Ensure GEMINI_API_KEY is set and try a clearer image.");
    } finally {
      setLoading(false);
    }
  }, []);

  const { openGallery, openCamera, inputs: cameraInputs } = useCameraCapture((file) => {
    void runVisualSearch(file);
  });

  const onFileChange = (file: File | undefined) => {
    if (!file) return;
    void runVisualSearch(file);
  };

  return (
    <div className="space-y-6">
      {cameraInputs}
      <section className="glass animate-float rounded-3xl p-6 md:p-8">
        <h1 className="section-title text-3xl font-bold">Visual Search</h1>
        <p className="mt-2 text-sm text-text-muted">
          Upload a product photo. Gemini Vision analyzes it and matches against the live Corner Store catalog.
        </p>
        <div
          className={`mt-4 rounded-2xl border-2 border-dashed p-6 text-center transition ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onFileChange(e.dataTransfer.files?.[0]);
          }}
        >
          <p className="text-sm font-semibold">Drop an image here</p>
          <p className="mt-1 text-xs text-text-muted">JPG, PNG, WEBP · max 10 MB</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="secondary" onClick={openGallery}>
              Upload image
            </Button>
            <Button type="button" variant="ghost" onClick={openCamera}>
              Use camera
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Or describe: gaming headset, Samsung phone…"
            className="max-w-md flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            disabled={!query.trim()}
            onClick={() => {
              setMessage(`Text search: use the AI chat assistant for “${query.trim()}”.`);
              setResult(null);
            }}
          >
            Text hint
          </Button>
        </div>
        {preview ? <div className="mt-4"><VisualSearchImagePreview src={preview} /></div> : null}
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-text-muted">{message}</p> : null}
      </section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : result ? (
        <Card>
          <VisualSearchResultCards
            exactMatches={result.exactMatches}
            similarProducts={result.similarProducts}
            alternatives={result.alternatives}
          />
        </Card>
      ) : null}
    </div>
  );
}
