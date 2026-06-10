"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@/components/ui";
import { useAppPreferences } from "@/components/theme-provider";
import { t } from "@/lib/i18n";
import * as ordersService from "@/lib/services/orders";
import type { DeliveryQuoteDTO, OrderToReturnDTO } from "@/lib/types";
import { formatScheduledDelivery } from "@/lib/utils/order-status";

type Props = {
  order: OrderToReturnDTO;
  onUpdated: (order: OrderToReturnDTO) => void;
};

function minScheduleValue(): string {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function maxScheduleValue(): string {
  const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function OrderActions({ order, onUpdated }: Props) {
  const { language, ready } = useAppPreferences();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(
    order.scheduledDeliveryAt
      ? new Date(order.scheduledDeliveryAt).toISOString().slice(0, 16)
      : minScheduleValue(),
  );
  const [scheduleQuote, setScheduleQuote] = useState<DeliveryQuoteDTO | null>(null);

  const scheduledLabel = formatScheduledDelivery(order.scheduledDeliveryAt);

  useEffect(() => {
    if (!showScheduleForm || !order.deliveryMethodId || !scheduleAt) {
      setScheduleQuote(null);
      return;
    }

    let cancelled = false;
    const iso = new Date(scheduleAt).toISOString();
    void ordersService
      .getDeliveryQuote(order.deliveryMethodId, iso)
      .then((quote) => {
        if (!cancelled) setScheduleQuote(quote);
      })
      .catch(() => {
        if (!cancelled) setScheduleQuote(null);
      });

    return () => {
      cancelled = true;
    };
  }, [showScheduleForm, order.deliveryMethodId, scheduleAt]);

  const runAction = async (key: string, action: () => Promise<OrderToReturnDTO>) => {
    setLoading(key);
    setError(null);
    try {
      const updated = await action();
      onUpdated(updated);
      setShowReturnForm(false);
      setShowScheduleForm(false);
      setReturnReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  const hasActions =
    (order.canCancel ?? false) || (order.canReturn ?? false) || (order.canSchedule ?? false);
  if (!hasActions && !scheduledLabel) return null;

  return (
    <div className="space-y-4">
      {scheduledLabel ? (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
          <span className="font-semibold">
            {ready ? t("scheduledDelivery", language) : "Scheduled delivery"}:{" "}
          </span>
          {scheduledLabel}
        </p>
      ) : null}

      {order.returnReason ? (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-text-muted">
          <span className="font-semibold">
            {ready ? t("returnReason", language) : "Return reason"}:{" "}
          </span>
          {order.returnReason}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {order.canCancel ?? false ? (
          <Button
            type="button"
            variant="ghost"
            disabled={!!loading}
            onClick={() => {
              const msg = ready
                ? t("cancelOrderConfirm", language)
                : "Cancel this order? This cannot be undone.";
              if (!window.confirm(msg)) return;
              void runAction("cancel", () => ordersService.cancelOrder(order.id));
            }}
          >
            {loading === "cancel"
              ? ready
                ? t("cancelling", language)
                : "Cancelling…"
              : ready
                ? t("cancelOrder", language)
                : "Cancel order"}
          </Button>
        ) : null}

        {order.canReturn ?? false ? (
          <Button
            type="button"
            variant="ghost"
            disabled={!!loading}
            onClick={() => {
              setShowReturnForm((v) => !v);
              setShowScheduleForm(false);
            }}
          >
            {ready ? t("requestReturn", language) : "Request return"}
          </Button>
        ) : null}

        {order.canSchedule ?? false ? (
          <Button
            type="button"
            variant="ghost"
            disabled={!!loading}
            onClick={() => {
              setShowScheduleForm((v) => !v);
              setShowReturnForm(false);
            }}
          >
            {scheduledLabel
              ? ready
                ? t("rescheduleDelivery", language)
                : "Reschedule delivery"
              : ready
                ? t("scheduleDelivery", language)
                : "Schedule delivery"}
          </Button>
        ) : null}
      </div>

      {showReturnForm ? (
        <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
          <label className="block text-sm font-medium">
            {ready ? t("returnReasonLabel", language) : "Why are you returning this order?"}
          </label>
          <Input
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder={
              ready ? t("returnReasonPlaceholder", language) : "Wrong size, defective, changed mind…"
            }
          />
          <Button
            type="button"
            disabled={!!loading || returnReason.trim().length < 5}
            onClick={() =>
              void runAction("return", () =>
                ordersService.requestReturn(order.id, returnReason.trim()),
              )
            }
          >
            {loading === "return"
              ? ready
                ? t("submitting", language)
                : "Submitting…"
              : ready
                ? t("submitReturn", language)
                : "Submit return request"}
          </Button>
        </div>
      ) : null}

      {showScheduleForm ? (
        <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
          <label className="block text-sm font-medium">
            {ready ? t("pickDeliveryTime", language) : "Pick a preferred delivery date & time"}
          </label>
          <Input
            type="datetime-local"
            value={scheduleAt}
            min={minScheduleValue()}
            max={maxScheduleValue()}
            onChange={(e) => setScheduleAt(e.target.value)}
          />
          <p className="text-xs text-text-muted">
            {ready ? t("scheduleHint", language) : "Must be at least 2 hours from now, within 14 days."}
          </p>
          {scheduleQuote ? (
            <div className="space-y-1 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <p className="font-semibold">Updated delivery cost</p>
              {scheduleQuote.lines.map((line) => (
                <div key={line.label} className="flex justify-between gap-2 text-text-muted">
                  <span>{line.label}</span>
                  <span>
                    {line.amount < 0 ? "-" : ""}${Math.abs(line.amount).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total shipping</span>
                <span>${scheduleQuote.totalPrice.toFixed(2)}</span>
              </div>
              {typeof order.deliveryPrice === "number" &&
              scheduleQuote.totalPrice !== order.deliveryPrice ? (
                <p className="text-xs text-text-muted">
                  Current shipping: ${order.deliveryPrice.toFixed(2)}
                </p>
              ) : null}
            </div>
          ) : null}
          <Button
            type="button"
            disabled={!!loading || !scheduleAt}
            onClick={() => {
              const iso = new Date(scheduleAt).toISOString();
              void runAction("schedule", () => ordersService.scheduleOrder(order.id, iso));
            }}
          >
            {loading === "schedule"
              ? ready
                ? t("saving", language)
                : "Saving…"
              : ready
                ? t("saveSchedule", language)
                : "Save schedule"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
