"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { useAppPreferences } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth-context";
import {
  getAssistantSessionId,
  restoreAssistantMessages,
  saveAssistantState,
  sendAssistantMessage,
  startNewAssistantSession,
  toChatHistory,
} from "@/lib/chatbot/assistant-client";
import { setAssistantUsage, type AssistantMessage } from "@/lib/chatbot/assistant-logic";
import { useCart } from "@/lib/cart-context";
import { useCompare } from "@/lib/compare-context";
import { getRecentlyViewedIds } from "@/lib/utils/recently-viewed";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";

export default function HelpPage() {
  const { language } = useAppPreferences();
  const { isSignedIn } = useAuth();
  const { lineItems } = useCart();
  const { compareIds } = useCompare();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const welcomeText =
    language === "ar"
      ? "أهلاً بك في Corner Store! اسأل عن الطلبات، الإرجاع، التوصيات، أو المنتجات."
      : "Welcome to Corner Store! Ask about orders, returns, recommendations, or products.";

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
    saveAssistantState({ sessionId: getAssistantSessionId(), messages });
  }, [messages, hydrated]);

  const startNewChat = () => {
    startNewAssistantSession();
    setMessages([]);
  };

  const suggestions = useMemo(
    () =>
      language === "ar"
        ? ["تتبع طلبي", "سياسة الإرجاع", "منتجات رائجة", "أقل من 5000"]
        : ["Track my order", "Return policy", "Trending products", "Under 5000"],
    [language],
  );

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    const userMsg: AssistantMessage = { role: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);
    setAssistantUsage();
    try {
      const history = toChatHistory([...messages, userMsg]);
      const reply = await sendAssistantMessage(history, {
        isSignedIn,
        compareIds,
        cartProductIds: lineItems.map((l) => l.product.id),
        recentProductIds: getRecentlyViewedIds(),
      });
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            language === "ar"
              ? "حدث خطأ. تأكد أن الـ API يعمل."
              : "Something went wrong. Make sure the API is running.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <section className="animate-float sheen-hover glass rounded-3xl p-6 md:p-8">
        <h1 className="section-title text-3xl font-bold">{t("helpTitle", language)}</h1>
        <p className="mt-2 text-sm text-text-muted">
          {language === "ar"
            ? "نفس مساعد التسوق الذكي — بحث منتجات، طلبات، وسياسات."
            : "Same smart shopping assistant — products, orders, and policies."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {messages.length > 0 ? (
            <button
              type="button"
              className="rounded-full border border-primary/30 px-3 py-1 text-sm font-semibold text-primary transition hover:bg-primary/10"
              onClick={startNewChat}
            >
              {language === "ar" ? "محادثة جديدة" : "New chat"}
            </button>
          ) : null}
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="rounded-full bg-surface-2 px-3 py-1 text-sm transition hover:bg-primary/10"
              onClick={() => setInput(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <Card>
        <div className="space-y-3">
          <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-2xl bg-surface-2 p-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl bg-surface px-3 py-2 text-sm text-text-muted">{welcomeText}</div>
            ) : null}
            {messages.map((m, idx) => (
              <div key={idx}>
                <div
                  className={`w-fit max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user" ? "ml-auto bg-primary text-white" : "bg-surface text-text"
                  }`}
                >
                  {m.text}
                </div>
                {m.products?.length ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {m.products.slice(0, 4).map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === "ar" ? "اكتب سؤالك…" : "Type your question…"}
              suppressHydrationWarning
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              disabled={busy}
            />
            <Button type="button" onClick={() => void send()} suppressHydrationWarning disabled={busy}>
              {busy ? "…" : language === "ar" ? "إرسال" : "Send"}
            </Button>
          </div>
          {!isSignedIn ? (
            <p className="text-xs text-text-muted">
              <Link href="/login" className="text-primary">
                Sign in
              </Link>{" "}
              {language === "ar" ? "لتتبع الطلبات." : "to track orders."}
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
