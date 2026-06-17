"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notifications";
import type { NotificationDTO } from "@/lib/types";
import Link from "next/link";
import { useI18n, useLocaleCode } from "@/lib/use-i18n";

export default function NotificationsPage() {
  const { isSignedIn } = useAuth();
  const { t, language } = useI18n();
  const locale = useLocaleCode(language);
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      setItems(data);
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch {
      setError(t("notificationsLoadError"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch {
      setError(t("notificationsMarkError"));
    }
  };

  const markOne = async (id: number) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch {
      /* ignore */
    }
  };

  if (!isSignedIn) {
    return (
      <div className="space-y-6">
        <h1 className="section-title text-3xl font-bold" suppressHydrationWarning>
          {t("notifications")}
        </h1>
        <Card>
          <p className="text-sm text-text-muted" suppressHydrationWarning>
            {t("signInForNotifications")}
          </p>
          <Link href="/login" className="mt-3 inline-flex text-sm font-semibold text-primary" suppressHydrationWarning>
            {t("signin")}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title text-3xl font-bold" suppressHydrationWarning>
            {t("notifications")}
          </h1>
          <p className="mt-1 text-sm text-text-muted" suppressHydrationWarning>
            {t("notificationsDesc")}
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-2 text-sm"
          onClick={() => void markAllRead()}
          disabled={!items.some((n) => !n.isRead)}
          suppressHydrationWarning
        >
          {t("markAllRead")}
        </button>
      </div>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <Card>
              <p className="text-sm text-text-muted" suppressHydrationWarning>
                {t("noNotifications")}
              </p>
            </Card>
          ) : (
            items.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer ${item.isRead ? "opacity-80" : ""}`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    if (!item.isRead) void markOne(item.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{item.title}</p>
                    {!item.isRead ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white" suppressHydrationWarning>
                        {t("newBadge")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-text-muted">{item.body}</p>
                  <p className="mt-2 text-xs text-text-muted">
                    {new Date(item.createdAt).toLocaleString(locale)} · {item.category}
                  </p>
                </button>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
