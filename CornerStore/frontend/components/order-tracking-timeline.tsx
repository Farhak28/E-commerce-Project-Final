"use client";

import { Button } from "@/components/ui";
import type { OrderTrackingDTO } from "@/lib/types";
import { formatFulfillmentStage, formatTrackingTimestamp } from "@/lib/utils/order-status";

type Props = {
  tracking: OrderTrackingDTO;
  onAdvance?: () => void;
  advancing?: boolean;
};

export function OrderTrackingTimeline({ tracking, onAdvance, advancing }: Props) {
  const delivered = tracking.fulfillmentStage === "Delivered";
  const cancelled =
    tracking.fulfillmentStage === "Cancelled" ||
    tracking.fulfillmentStage === "ReturnRequested" ||
    tracking.fulfillmentStage === "Returned";

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xl font-bold tracking-tight">{tracking.headline}</p>
            <p className="mt-1 text-sm text-text-muted">{tracking.subheadline}</p>
          </div>
          {onAdvance && !delivered && !cancelled ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAdvance}
              disabled={advancing}
            >
              {advancing ? "Updating…" : "Advance step (demo)"}
            </Button>
          ) : null}
        </div>

        {!cancelled ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Shipment progress</span>
              <span>{tracking.progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${tracking.progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-4 text-xs text-text-muted">
          {tracking.trackingNumber ? (
            <span>
              Tracking ID: <span className="font-mono font-semibold text-foreground">{tracking.trackingNumber}</span>
            </span>
          ) : null}
          {tracking.carrierName ? <span>Carrier: {tracking.carrierName}</span> : null}
          {tracking.estimatedDeliveryAt ? (
            <span>Est. delivery: {formatTrackingTimestamp(tracking.estimatedDeliveryAt)}</span>
          ) : null}
        </div>
      </div>

      <ol className="relative space-y-0 border-l-2 border-border pl-6">
        {tracking.steps.map((step, index) => {
          const isLast = index === tracking.steps.length - 1;
          const complete = step.isComplete;
          const current = step.isCurrent;

          return (
            <li key={`${step.stage}-${index}`} className={`relative pb-8 ${isLast ? "pb-0" : ""}`}>
              <span
                className={`absolute -left-[1.65rem] flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors ${
                  complete
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : current
                      ? "border-primary bg-primary text-white shadow-[0_0_0_4px_rgba(var(--primary-rgb,99,102,241),0.15)]"
                      : "border-border bg-surface text-text-muted"
                }`}
                aria-hidden
              >
                {complete ? "✓" : index + 1}
              </span>

              <div
                className={`rounded-xl border px-4 py-3 transition ${
                  current
                    ? "border-primary/30 bg-primary/5 shadow-sm"
                    : complete
                      ? "border-border bg-surface"
                      : "border-border/60 bg-surface/50 opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{step.title}</p>
                  {current ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      Current
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-text-muted">{step.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted">
                  {step.location ? <span>{step.location}</span> : null}
                  {step.occurredAt ? (
                    <span>{formatTrackingTimestamp(step.occurredAt)}</span>
                  ) : !complete && !current ? (
                    <span>{formatFulfillmentStage(step.stage)}</span>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
