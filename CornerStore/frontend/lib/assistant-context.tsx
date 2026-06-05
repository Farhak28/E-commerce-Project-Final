"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Button, Input, TypingIndicator } from "@/components/ui";
import { useAppPreferences } from "@/components/theme-provider";
import { useCompare } from "@/lib/compare-context";
import { useAuth } from "@/lib/auth-context";
import { t } from "@/lib/i18n";
import { useCart } from "@/lib/cart-context";
import { getRecentlyViewedIds } from "@/lib/utils/recently-viewed";
import {
  getAssistantSessionId,
  restoreAssistantMessages,
  saveAssistantState,
  sendAssistantMessage,
  startNewAssistantSession,
  toChatHistory,
} from "@/lib/chatbot/assistant-client";
import type { AssistantMessage } from "@/lib/chatbot/assistant-logic";
import { getAssistantStatus } from "@/lib/services/assistant";
import {
  AssistantProductCards,
  AssistantStructuredCards,
} from "@/components/assistant-cards";
import {
  VisualSearchImagePreview,
  VisualSearchResultCards,
} from "@/components/visual-search-cards";
import { searchByImage } from "@/lib/services/visual-search";
import { fileToBase64, validateImageFile } from "@/lib/utils/image-upload";

const QUICK_PROMPTS = [
  { label: "Find products", prompt: "Show me popular products" },
  { label: "Compare", prompt: "Compare gaming headphones" },
  { label: "Recommendations", prompt: "Recommend something for me" },
  { label: "Track order", prompt: "Where is my order?" },
  { label: "Store help", prompt: "What is your return policy?" },
];

type AssistantContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  messages: AssistantMessage[];
  startNewChat: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used within AssistantProvider");
  return ctx;
}

function WelcomeScreen({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-2xl text-white shadow-lg shadow-indigo-500/30">
        ✦
      </div>
      <h3 className="section-title mt-4 text-lg font-bold">AI Shopping Assistant</h3>
      <p className="mt-2 max-w-xs text-xs text-text-muted">
        Find products, compare options, get recommendations, and track orders — naturally.
      </p>
      <div className="mt-6 grid w-full gap-2">
        {QUICK_PROMPTS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onPrompt(item.prompt)}
            className="rounded-xl border border-border bg-surface-2/80 px-4 py-3 text-left text-sm transition hover:border-primary/30 hover:bg-primary/5"
          >
            <span className="font-semibold">{item.label}</span>
            <span className="mt-0.5 block text-xs text-text-muted">{item.prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AssistantPanelContent({
  onClose,
  messages,
  setMessages,
  onNewChat,
}: {
  onClose: () => void;
  messages: AssistantMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AssistantMessage[]>>;
  onNewChat: () => void;
}) {
  const { language, ready } = useAppPreferences();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [geminiReady, setGeminiReady] = useState<boolean | null>(null);
  const { compareIds, toggleCompare, clearCompare } = useCompare();
  const { isSignedIn } = useAuth();
  const { lineItems } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    void getAssistantStatus()
      .then((s) => { if (mountedRef.current) setGeminiReady(s.configured); })
      .catch(() => { if (mountedRef.current) setGeminiReady(false); });
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const userMessage: AssistantMessage = { role: "user", text: trimmed };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setQuery("");
      setLoading(true);
      try {
        const reply = await sendAssistantMessage(
          toChatHistory(nextMessages),
          {
            isSignedIn,
            compareIds,
            cartProductIds: lineItems.map((l) => l.product.id),
            recentProductIds: getRecentlyViewedIds(),
          },
        );
        if (!mountedRef.current) return;
        setMessages((m) => [...m, reply]);
      } catch {
        if (!mountedRef.current) return;
        setMessages((m) => [...m, { role: "assistant", text: "Something went wrong. Please try again." }]);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [isSignedIn, compareIds, lineItems, messages, setMessages],
  );

  const runVisualSearch = useCallback(
    async (file: File) => {
      const validationError = validateImageFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      setUploadError(null);
      const preview = URL.createObjectURL(file);
      const userMessage: AssistantMessage = {
        role: "user",
        text: "📷 Visual product search",
        imagePreview: preview,
      };
      setMessages((m) => [...m, userMessage]);
      setLoading(true);

      try {
        const { base64, mimeType } = await fileToBase64(file);
        const result = await searchByImage(base64, mimeType);
        if (!mountedRef.current) return;

        const reply: AssistantMessage = {
          role: "assistant",
          text: result.text.replace(/\*\*/g, ""),
          visualSearch: {
            exactMatchFound: result.exactMatchFound,
            attributes: result.attributes,
            exactMatches: result.exactMatches,
            similarProducts: result.similarProducts,
            alternatives: result.alternatives,
          },
        };
        setMessages((m) => [...m, reply]);
      } catch {
        if (!mountedRef.current) return;
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: "Visual search failed. Try a clearer photo or check that Gemini is configured.",
          },
        ]);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [setMessages],
  );

  const onFileSelected = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      void runVisualSearch(file);
    },
    [runVisualSearch],
  );

  const panelTitle = ready ? t("aiAssistant", language) : "AI Shopping Assistant";
  const showWelcome = messages.length === 0 && !loading;
  const sessionId = getAssistantSessionId();

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade md:bg-black/30"
        aria-label="Close assistant"
        onClick={onClose}
      />
      <aside
        id="assistant-panel"
        role="dialog"
        aria-label={panelTitle}
        className="fixed inset-y-0 right-0 z-50 flex w-[min(420px,100vw)] flex-col border-l border-border bg-surface shadow-2xl animate-slide-up md:top-0 md:rounded-l-[var(--radius-xl)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-lg text-white">✦</span>
            <div>
              <p className="section-title text-sm font-bold">{panelTitle}</p>
              <p className="text-[11px] text-text-muted">
                {geminiReady ? "Gemini + RAG · Online" : "Offline helper mode"}
                {sessionId && messages.length > 0 ? " · Saved" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 ? (
              <button
                type="button"
                className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10"
                onClick={onNewChat}
                title="Start a new conversation"
              >
                New chat
              </button>
            ) : null}
            <button type="button" className="rounded-xl p-2 text-xl text-text-muted hover:bg-surface-2" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          {showWelcome ? (
            <WelcomeScreen onPrompt={(p) => void send(p)} />
          ) : (
            <div className="space-y-3 p-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm ${
                      m.role === "user"
                        ? "rounded-br-md bg-primary text-white shadow-md shadow-primary/20"
                        : "rounded-bl-md border border-border bg-surface-2"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    {m.imagePreview ? (
                      <VisualSearchImagePreview src={m.imagePreview} />
                    ) : null}
                    {m.visualSearch ? (
                      <VisualSearchResultCards
                        exactMatches={m.visualSearch.exactMatches}
                        similarProducts={m.visualSearch.similarProducts}
                        alternatives={m.visualSearch.alternatives}
                      />
                    ) : null}
                    {m.products?.length ? (
                      <AssistantProductCards
                        products={m.products}
                        compareIds={compareIds}
                        onToggleCompare={toggleCompare}
                      />
                    ) : null}
                    <AssistantStructuredCards
                      structured={m.structured}
                      compareIds={compareIds}
                      onToggleCompare={toggleCompare}
                    />
                  </div>
                </div>
              ))}
              {loading ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-border bg-surface-2">
                    <TypingIndicator />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {!showWelcome ? (
          <div className="shrink-0 flex flex-wrap gap-1 border-t border-border px-3 py-2">
            {QUICK_PROMPTS.slice(0, 3).map((p) => (
              <button key={p.label} type="button" className="rounded-full bg-surface-2 px-2.5 py-1 text-[10px] hover:bg-primary/10" onClick={() => void send(p.prompt)}>
                {p.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="shrink-0 border-t border-border p-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              onFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div
            className={`mb-3 rounded-xl border border-dashed px-3 py-2 text-center text-[11px] transition ${
              dragOver ? "border-primary bg-primary/5" : "border-border text-text-muted"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onFileSelected(e.dataTransfer.files?.[0]);
            }}
          >
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => fileRef.current?.click()}
            >
              Upload photo
            </button>
            <span> · drag & drop · camera</span>
          </div>
          {uploadError ? <p className="mb-2 text-xs text-red-500">{uploadError}</p> : null}
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ready ? t("searchNaturally", language) : "Ask naturally…"}
              onKeyDown={(e) => { if (e.key === "Enter") void send(query); }}
              aria-label="Message to assistant"
            />
            <Button type="button" className="shrink-0" disabled={loading} onClick={() => void send(query)}>
              Send
            </Button>
          </div>
          {compareIds.length > 0 ? (
            <div className="mt-2 flex items-center justify-between text-xs">
              <Link href={`/compare?ids=${compareIds.join(",")}`} className="font-semibold text-primary">
                Compare {compareIds.length} products →
              </Link>
              <button type="button" className="text-text-muted" onClick={clearCompare}>Clear</button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    let cancelled = false;
    void restoreAssistantMessages().then((restored) => {
      if (!cancelled) {
        setMessages(restored);
        setHydrated(true);
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveAssistantState({
      sessionId: getAssistantSessionId(),
      messages,
    });
  }, [messages, hydrated]);

  const startNewChat = useCallback(() => {
    startNewAssistantSession();
    setMessages([]);
  }, []);

  return (
    <AssistantContext.Provider value={{ open, setOpen, toggle, messages, startNewChat }}>
      {children}
      {open ? (
        <AssistantPanelContent
          onClose={close}
          messages={messages}
          setMessages={setMessages}
          onNewChat={startNewChat}
        />
      ) : null}
    </AssistantContext.Provider>
  );
}
