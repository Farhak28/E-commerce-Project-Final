"use client";

import { useEffect, useMemo, useState } from "react";
import type { Appearance, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripePaymentElementOptions } from "@stripe/stripe-js";
import { Button, Skeleton } from "@/components/ui";
import { useAppPreferences } from "@/components/theme-provider";
import { t, type Language } from "@/lib/i18n";
import type { CheckoutPaymentMethod } from "@/lib/payment-methods";
import { getStripePromise } from "@/lib/stripe-loader";

function stripeAppearance(theme: "light" | "dark"): Appearance {
  if (theme === "dark") {
    return {
      theme: "night",
      variables: {
        colorBackground: "#182038",
        colorText: "#e8ecff",
        colorPrimary: "#5b8cff",
      },
    };
  }
  return { theme: "stripe" };
}

function paymentElementOptions(method: CheckoutPaymentMethod): StripePaymentElementOptions {
  if (method === "apple_pay") {
    return {
      layout: "tabs",
      paymentMethodOrder: ["apple_pay", "google_pay", "card"],
      wallets: { applePay: "auto", googlePay: "auto" },
    };
  }
  return {
    layout: "tabs",
    paymentMethodOrder: ["card"],
  };
}

function PaymentFormInner({
  onSuccess,
  onError,
  language,
  ready,
  paymentMethod,
  returnUrl,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
  language: Language;
  ready: boolean;
  paymentMethod: CheckoutPaymentMethod;
  returnUrl: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [elementReady, setElementReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !elementReady) {
      onError(ready ? t("paymentElementNotReady", language) : "Payment form is still loading.");
      return;
    }
    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: returnUrl,
      },
    });
    setProcessing(false);

    if (error) {
      const msg = error.message ?? "Payment failed";
      onError(
        /terminal state|succeeded|already been confirmed/i.test(msg)
          ? `${msg} Refresh payment setup and try again.`
          : msg,
      );
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="min-h-[220px] rounded-lg bg-surface p-3">
        <PaymentElement
          options={paymentElementOptions(paymentMethod)}
          onReady={() => {
            setElementReady(true);
            setLoadError(null);
          }}
          onLoadError={(e) => {
            const msg = e.error.message ?? "Payment form failed to load";
            setLoadError(msg);
            onError(msg);
          }}
        />
        {!elementReady && !loadError ? (
          <p className="mt-2 text-xs text-text-muted">
            {ready ? t("preparingPayment", language) : "Loading card fields…"}
          </p>
        ) : null}
        {loadError ? <p className="mt-2 text-sm text-accent">{loadError}</p> : null}
      </div>
      <Button type="submit" disabled={!stripe || !elementReady || processing} className="w-full">
        {processing
          ? ready
            ? t("processingPayment", language)
            : "Processing…"
          : ready
            ? t("payNow", language)
            : "Pay now"}
      </Button>
    </form>
  );
}

export function StripePaymentForm({
  clientSecret,
  onSuccess,
  onError,
  language = "en",
  ready = true,
  paymentMethod,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  language?: Language;
  ready?: boolean;
  paymentMethod: CheckoutPaymentMethod;
}) {
  const { theme } = useAppPreferences();
  const [stripe, setStripe] = useState<Stripe | null | undefined>(undefined);
  const [stripeLoadError, setStripeLoadError] = useState<string | null>(null);

  const returnUrl = useMemo(() => {
    if (typeof window === "undefined") return "http://localhost:3848/checkout";
    return `${window.location.origin}/checkout?stripe_return=1`;
  }, []);

  const appearance = useMemo(() => stripeAppearance(theme), [theme]);

  useEffect(() => {
    let cancelled = false;
    void getStripePromise().then((instance) => {
      if (cancelled) return;
      if (!instance) {
        setStripeLoadError(
          ready
            ? t("stripeNotConfigured", language)
            : "Stripe could not load. Check your publishable key and network connection.",
        );
      }
      setStripe(instance);
    });
    return () => {
      cancelled = true;
    };
  }, [language, ready]);

  if (stripe === undefined) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-[220px] w-full" />
        <p className="text-xs text-text-muted">
          {ready ? t("preparingPayment", language) : "Loading Stripe…"}
        </p>
      </div>
    );
  }

  if (!stripe) {
    return (
      <p className="text-sm text-accent">
        {stripeLoadError ?? (ready ? t("stripeNotConfigured", language) : "Stripe is not configured.")}
      </p>
    );
  }

  return (
    <Elements
      key={`${clientSecret}-${theme}`}
      stripe={stripe}
      options={{
        clientSecret,
        appearance,
      }}
    >
      <PaymentFormInner
        onSuccess={onSuccess}
        onError={onError}
        language={language}
        ready={ready}
        paymentMethod={paymentMethod}
        returnUrl={returnUrl}
      />
    </Elements>
  );
}
