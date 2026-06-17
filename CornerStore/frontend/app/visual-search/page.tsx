"use client";

import { useCallback, useState } from "react";
import { useCameraCapture } from "@/components/camera-capture";
import { Button, Card, Input, Skeleton } from "@/components/ui";
import { VisualSearchImagePreview, VisualSearchResultCards } from "@/components/visual-search-cards";
import { searchByImage } from "@/lib/services/visual-search";
import { fileToBase64, validateImageFile } from "@/lib/utils/image-upload";
import { useI18n } from "@/lib/use-i18n";

export default function VisualSearchPage() {
  const { t } = useI18n();
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
      setError(t("visualSearchFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
        <h1 className="section-title text-3xl font-bold" suppressHydrationWarning>{t("visualSearchTitle")}</h1>
        <p className="mt-2 text-sm text-text-muted" suppressHydrationWarning>{t("visualSearchDesc")}</p>
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
          <p className="text-sm font-semibold" suppressHydrationWarning>{t("dropImageHere")}</p>
          <p className="mt-1 text-xs text-text-muted" suppressHydrationWarning>{t("imageFormats")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="secondary" onClick={openGallery}>
              <span suppressHydrationWarning>{t("uploadImage")}</span>
            </Button>
            <Button type="button" variant="ghost" onClick={openCamera}>
              <span suppressHydrationWarning>{t("useCamera")}</span>
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("describePlaceholder")}
            suppressHydrationWarning
            className="max-w-md flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            disabled={!query.trim()}
            onClick={() => {
              setMessage(t("textSearchHint", { query: query.trim() }));
              setResult(null);
            }}
          >
            <span suppressHydrationWarning>{t("textHint")}</span>
          </Button>
        </div>
        {preview ? <div className="mt-4"><VisualSearchImagePreview src={preview} /></div> : null}
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
        {message ? (
          <p
            className={`mt-3 text-sm ${result?.isPersonDetected ? "rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-200" : "text-text-muted"}`}
          >
            {message}
          </p>
        ) : null}
      </section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : result && !result.isPersonDetected && (result.exactMatches.length > 0 || result.similarProducts.length > 0 || result.alternatives.length > 0) ? (
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
