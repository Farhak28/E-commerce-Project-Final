"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Skeleton } from "@/components/ui";
import dynamic from "next/dynamic";

const StripePaymentForm = dynamic(
  () => import("@/components/stripe-payment-form").then((m) => m.StripePaymentForm),
  { ssr: false, loading: () => <Skeleton className="h-32 w-full" /> },
);
import { useAppPreferences } from "@/components/theme-provider";
import {
  SavedAddressPicker,
  resolveCheckoutAddress,
  type AddressSelection,
} from "@/components/saved-address-picker";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { t } from "@/lib/i18n";
import {
  PAYMENT_METHOD_API,
  PAYMENT_OPTIONS,
  usesStripe,
  type CheckoutPaymentMethod,
} from "@/lib/payment-methods";
import { applyAccountCoupon } from "@/lib/services/account";
import * as ordersService from "@/lib/services/orders";
import * as paymentsService from "@/lib/services/payments";
import { isStripeConfigured, loadStripeConfig, type StripeConfigDTO } from "@/lib/stripe-config";
import type { AddressDTO, DeliveryMethodDTO, DeliveryQuoteDTO, SavedAddressDTO } from "@/lib/types";
import { defaultSaveAsName, emptyAddress, isAddressComplete, savedToAddressDTO } from "@/lib/utils/address";
import { clearStripeReturnParams, readStripeReturnStatus } from "@/lib/stripe-checkout-return";

function paymentMethodLabel(method: CheckoutPaymentMethod, language: "en" | "ar", ready: boolean) {
  if (!ready) {
    const labels: Record<CheckoutPaymentMethod, string> = {
      card: "Credit / debit card",
      apple_pay: "Apple Pay / Google Pay",
      instapay: "InstaPay",
      cod: "Cash on delivery",
    };
    return labels[method];
  }
  const keys = {
    card: "reviewPaymentCard",
    apple_pay: "payApplePay",
    instapay: "reviewPaymentInstaPay",
    cod: "reviewPaymentCod",
  } as const;
  return t(keys[method], language);
}

export function CheckoutFlow() {
  const router = useRouter();
  const { language, ready } = useAppPreferences();
  const { isSignedIn, getAddresses, upsertAddress } = useAuth();
  const {
    lineItems,
    subtotal,
    shippingPrice,
    discountAmount,
    basket,
    setDeliveryMethod,
    refreshCart,
    syncBasket,
    clearCart,
    isLoading: cartLoading,
  } = useCart();

  const steps = useMemo(
    () =>
      ready
        ? ([
            t("address", language),
            t("delivery", language),
            t("payment", language),
            t("review", language),
          ] as const)
        : (["Address", "Delivery", "Payment", "Review"] as const),
    [language, ready],
  );

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<AddressDTO>(emptyAddress());
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressDTO[]>([]);
  const [addressSelection, setAddressSelection] = useState<AddressSelection>({ mode: "new" });
  const [newAddress, setNewAddress] = useState<AddressDTO>(emptyAddress());
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [saveAsName, setSaveAsName] = useState("Home");
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethodDTO[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [scheduledDeliveryAt, setScheduledDeliveryAt] = useState("");
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuoteDTO | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("cod");
  const [stripeConfig, setStripeConfig] = useState<StripeConfigDTO | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingAutoPlace = useRef(false);

  const stripeReady = isStripeConfigured(stripeConfig);

  useEffect(() => {
    let cancelled = false;
    void loadStripeConfig().then((cfg) => {
      if (cancelled) return;
      setStripeConfig(cfg);
      if (isStripeConfigured(cfg)) {
        setPaymentMethod((current) => (current === "cod" ? "card" : current));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const returnStatus = readStripeReturnStatus();
    if (returnStatus === "succeeded") {
      setPaymentReady(true);
      pendingAutoPlace.current = true;
      setError(null);
      clearStripeReturnParams();
    } else if (returnStatus === "failed") {
      setPaymentReady(false);
      setStep(2);
      setError(
        ready
          ? "Payment authentication failed. Please try again."
          : "Payment authentication failed. Please try again.",
      );
      clearStripeReturnParams();
    }
  }, [ready]);

  useEffect(() => {
    if (basket?.deliveryMethodId && selectedDeliveryId === null) {
      setSelectedDeliveryId(basket.deliveryMethodId);
    }
  }, [basket?.deliveryMethodId, selectedDeliveryId]);

  useEffect(() => {
    if (paymentReady || !basket?.id || !basket.paymentIntentID || !usesStripe(paymentMethod)) {
      return;
    }

    let cancelled = false;
    void paymentsService.isPaymentComplete(basket.id).then((complete) => {
      if (!cancelled && complete) {
        setPaymentReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [basket?.id, basket?.paymentIntentID, paymentMethod, paymentReady]);

  useEffect(() => {
    let cancelled = false;
    void ordersService
      .getDeliveryMethods()
      .then((methods) => {
        if (!cancelled) setDeliveryMethods(methods);
      })
      .catch(() => {
        if (!cancelled) setDeliveryMethods([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    setAddressesLoading(true);
    void getAddresses()
      .then((addresses) => {
        if (cancelled) return;
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          setAddressSelection({ mode: "saved", savedId: addresses[0].id });
          setAddress(savedToAddressDTO(addresses[0]));
          setSaveAsName(defaultSaveAsName(addresses));
        }
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getAddresses]);

  useEffect(() => {
    setAddress(resolveCheckoutAddress(addressSelection, savedAddresses, newAddress));
  }, [addressSelection, savedAddresses, newAddress]);

  const effectiveShipping = deliveryQuote?.totalPrice ?? shippingPrice;
  const effectiveDiscount = basket?.discountAmount ?? discountAmount;
  const total = useMemo(
    () => Math.max(0, subtotal + effectiveShipping - effectiveDiscount),
    [subtotal, effectiveShipping, effectiveDiscount],
  );

  const scheduledIso = useMemo(
    () => (scheduledDeliveryAt ? new Date(scheduledDeliveryAt).toISOString() : null),
    [scheduledDeliveryAt],
  );

  useEffect(() => {
    if (!selectedDeliveryId) {
      setDeliveryQuote(null);
      return;
    }

    let cancelled = false;
    setQuoteLoading(true);
    void ordersService
      .getDeliveryQuote(selectedDeliveryId, scheduledIso)
      .then((quote) => {
        if (!cancelled) setDeliveryQuote(quote);
      })
      .catch(() => {
        if (!cancelled) setDeliveryQuote(null);
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDeliveryId, scheduledIso]);

  useEffect(() => {
    if (!basket?.id || !basket.couponCode || !selectedDeliveryId) return;

    let cancelled = false;
    void applyAccountCoupon(basket.id, basket.couponCode)
      .then(async () => {
        if (!cancelled) await refreshCart();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [basket?.id, basket?.couponCode, selectedDeliveryId, deliveryQuote?.totalPrice, refreshCart]);

  const activeClientSecret = clientSecret ?? paymentsService.readClientSecret(basket ?? {});

  const resetPaymentState = useCallback(() => {
    setClientSecret(null);
    setPaymentReady(false);
    setError(null);
  }, []);

  const handleAddressContinue = async () => {
    const shippingAddress = resolveCheckoutAddress(addressSelection, savedAddresses, newAddress);
    if (!isAddressComplete(shippingAddress)) {
      setError(ready ? t("fillAddress", language) : "Please fill in all address fields.");
      return;
    }
    setAddress(shippingAddress);
    setError(null);

    if (
      addressSelection.mode === "new"
      && saveNewAddress
      && isAddressComplete(newAddress)
    ) {
      if (!saveAsName.trim()) {
        setError(ready ? t("fillAddressName", language) : "Please enter a name for this address.");
        return;
      }
      setLoading(true);
      const result = await upsertAddress({ name: saveAsName.trim(), ...newAddress });
      setLoading(false);
      if (!result.ok) {
        setError(result.error ?? "Failed to save address.");
        return;
      }
      if (result.data) {
        setSavedAddresses((prev) => [...prev, result.data!].sort((a, b) => a.name.localeCompare(b.name)));
      }
    }

    setStep(1);
  };

  const handleDeliveryContinue = async () => {
    if (!selectedDeliveryId) {
      setError(ready ? t("selectDelivery", language) : "Select a delivery method.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await setDeliveryMethod(
        selectedDeliveryId,
        scheduledIso,
        deliveryQuote?.totalPrice ?? null,
      );
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save delivery method");
    } finally {
      setLoading(false);
    }
  };

  const retryPaymentSetup = useCallback(async () => {
    if (!basket?.id) return;
    resetPaymentState();
    setLoading(true);
    try {
      await syncBasket(selectedDeliveryId, scheduledIso, deliveryQuote?.totalPrice ?? null);
      const updated = await paymentsService.createOrUpdatePaymentIntent(basket.id);
      const secret = paymentsService.readClientSecret(updated);
      if (!secret) {
        setError(
          ready
            ? t("paymentSetupFailed", language)
            : "Payment could not be initialized. Complete delivery step and try again.",
        );
        return;
      }
      setClientSecret(secret);
      await refreshCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment initialization failed");
    } finally {
      setLoading(false);
    }
  }, [
    basket?.id,
    resetPaymentState,
    ready,
    language,
    refreshCart,
    syncBasket,
    selectedDeliveryId,
    scheduledIso,
    deliveryQuote?.totalPrice,
  ]);

  useEffect(() => {
    if (step !== 2 || !usesStripe(paymentMethod) || !stripeReady || !basket?.id || clientSecret || paymentReady) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        await syncBasket(selectedDeliveryId, scheduledIso, deliveryQuote?.totalPrice ?? null);
        const updated = await paymentsService.createOrUpdatePaymentIntent(basket.id);
        if (cancelled) return;
        const secret = paymentsService.readClientSecret(updated);
        if (!secret) {
          setError(
            ready
              ? t("paymentSetupFailed", language)
              : "Payment could not be initialized. Complete delivery step and try again.",
          );
          return;
        }
        setClientSecret(secret);
        await refreshCart();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Payment initialization failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    step,
    paymentMethod,
    stripeReady,
    basket?.id,
    clientSecret,
    paymentReady,
    ready,
    language,
    refreshCart,
    syncBasket,
    selectedDeliveryId,
    scheduledIso,
    deliveryQuote?.totalPrice,
  ]);

  const handlePaymentMethodChange = (method: CheckoutPaymentMethod) => {
    setPaymentMethod(method);
    setPaymentReady(false);
    resetPaymentState();
  };

  const confirmOfflinePayment = () => {
    setPaymentReady(true);
    setStep(3);
    setError(null);
  };

  const placeOrder = useCallback(async () => {
    const deliveryId = selectedDeliveryId ?? basket?.deliveryMethodId ?? null;
    if (!basket?.id) {
      setError("Cart not found. Refresh the page and try again.");
      return;
    }
    if (!deliveryId) {
      setError(ready ? t("selectDelivery", language) : "Select a delivery method.");
      setStep(1);
      return;
    }
    if (!isAddressComplete(address)) {
      setError(ready ? t("fillAddress", language) : "Please complete your shipping address.");
      setStep(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await syncBasket(deliveryId, scheduledIso, deliveryQuote?.totalPrice ?? null);
      await ordersService.createOrder({
        basketId: basket.id,
        deliveryMethodId: deliveryId,
        shipToAddress: address,
        paymentMethod: PAYMENT_METHOD_API[paymentMethod],
        ...(scheduledIso ? { scheduledDeliveryAt: scheduledIso } : {}),
        ...(basket.couponCode ? { couponCode: basket.couponCode } : {}),
      });
      await clearCart();
      router.push("/account/orders?placed=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setLoading(false);
    }
  }, [
    address,
    basket?.deliveryMethodId,
    basket?.id,
    clearCart,
    language,
    paymentMethod,
    ready,
    router,
    scheduledIso,
    deliveryQuote?.totalPrice,
    selectedDeliveryId,
    syncBasket,
  ]);

  useEffect(() => {
    if (!pendingAutoPlace.current || !paymentReady || cartLoading) return;
    const deliveryId = selectedDeliveryId ?? basket?.deliveryMethodId ?? null;
    if (!basket?.id || !deliveryId) return;
    if (!isAddressComplete(address)) {
      pendingAutoPlace.current = false;
      setStep(0);
      setError(
        ready
          ? t("fillAddress", language)
          : "Complete your shipping address to finish placing your order.",
      );
      return;
    }

    pendingAutoPlace.current = false;
    void placeOrder();
  }, [
    address,
    basket?.deliveryMethodId,
    basket?.id,
    cartLoading,
    language,
    paymentReady,
    placeOrder,
    ready,
    selectedDeliveryId,
  ]);

  if (!isSignedIn) {
    return (
      <Card>
        <p className="text-sm text-text-muted">{ready ? t("signInToCheckout", language) : "Please sign in to complete checkout."}</p>
        <Link href="/login" className="mt-3 inline-flex text-sm font-semibold text-primary">
          {ready ? t("signin", language) : "Sign in"}
        </Link>
      </Card>
    );
  }

  if (cartLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (lineItems.length === 0) {
    return (
      <Card>
        <p className="text-sm text-text-muted">{ready ? t("emptyCheckout", language) : "Your cart is empty. Add items or return to shop."}</p>
        <div className="mt-4 flex gap-2">
          <Button type="button" onClick={() => router.push("/products")}>
            {ready ? t("browseProducts", language) : "Browse products"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {steps.map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              if (index >= step) return;
              if (index === 2 && paymentReady && usesStripe(paymentMethod)) return;
              setStep(index);
            }}
            className={`rounded-full px-3 py-1 text-sm transition ${step === index ? "bg-primary text-white" : "bg-surface-2 text-text-muted"}`}
          >
            {index + 1}. {item}
          </button>
        ))}
      </div>

      {error ? <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <h2 className="section-title text-xl font-semibold">
            {steps[step]} {ready ? t("details", language) : "details"}
          </h2>

          {step === 0 ? (
            addressesLoading ? (
              <Skeleton className="mt-3 h-40 w-full" />
            ) : (
              <div className="mt-3">
                <SavedAddressPicker
                  savedAddresses={savedAddresses}
                  selection={addressSelection}
                  onSelectionChange={setAddressSelection}
                  newAddress={newAddress}
                  onNewAddressChange={setNewAddress}
                  saveNewAddress={saveNewAddress}
                  onSaveNewAddressChange={setSaveNewAddress}
                  saveAsName={saveAsName}
                  onSaveAsNameChange={setSaveAsName}
                  language={language}
                  ready={ready}
                />
              </div>
            )
          ) : null}

          {step === 1 ? (
            <div className="mt-3 space-y-2">
              {deliveryMethods.length === 0 ? (
                <p className="text-sm text-text-muted">Loading delivery options…</p>
              ) : (
                deliveryMethods.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 ${selectedDeliveryId === m.id ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div>
                      <p className="font-semibold">{m.shortName}</p>
                      <p className="text-xs text-text-muted">{m.description} — {m.deliveryTime}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">${m.price}</span>
                      <input type="radio" name="delivery" checked={selectedDeliveryId === m.id} onChange={() => setSelectedDeliveryId(m.id)} />
                    </div>
                  </label>
                ))
              )}
              <div className="mt-4 space-y-2 rounded-xl border border-border bg-surface-2 p-4">
                <label className="block text-sm font-medium">
                  {ready ? t("preferredDeliveryOptional", language) : "Preferred delivery time (optional)"}
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledDeliveryAt}
                  onChange={(e) => setScheduledDeliveryAt(e.target.value)}
                  min={(() => {
                    const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    return d.toISOString().slice(0, 16);
                  })()}
                  max={(() => {
                    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    return d.toISOString().slice(0, 16);
                  })()}
                />
                <p className="text-xs text-text-muted">
                  {ready ? t("scheduleHint", language) : "Must be at least 2 hours from now, within 14 days."}
                </p>
                {quoteLoading ? (
                  <Skeleton className="mt-2 h-16 w-full" />
                ) : deliveryQuote && scheduledDeliveryAt ? (
                  <div className="mt-3 space-y-1 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                    <p className="font-semibold">
                      {ready ? "Calculated delivery cost" : "Calculated delivery cost"}
                    </p>
                    {deliveryQuote.lines.map((line) => (
                      <div key={line.label} className="flex justify-between gap-2 text-text-muted">
                        <span>{line.label}</span>
                        <span className={line.amount < 0 ? "text-emerald-600" : ""}>
                          {line.amount < 0 ? "-" : ""}${Math.abs(line.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
                      <span>Total shipping</span>
                      <span>${deliveryQuote.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-3 space-y-4">
              <p className="text-sm font-medium text-text-muted">
                {ready ? t("selectPaymentMethod", language) : "Select how you want to pay"}
              </p>

              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((opt) => {
                  const stripeOnly = usesStripe(opt.id);
                  const disabled = stripeOnly && !stripeReady;
                  return (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        paymentMethod === opt.id ? "border-primary bg-primary/5" : "border-border"
                      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="mt-1"
                        checked={paymentMethod === opt.id}
                        disabled={disabled}
                        onChange={() => handlePaymentMethodChange(opt.id)}
                      />
                      <div>
                        <p className="font-semibold">{ready ? t(opt.labelKey, language) : opt.id}</p>
                        <p className="text-xs text-text-muted">{ready ? t(opt.descKey, language) : ""}</p>
                        {disabled ? (
                          <p className="mt-1 text-xs text-accent">
                            {ready ? t("stripeNotConfigured", language) : "Stripe not configured"}
                          </p>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>

              {usesStripe(paymentMethod) && stripeReady ? (
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  {typeof window !== "undefined" && window.location.protocol === "http:" ? (
                    <p className="mb-3 text-xs text-text-muted">
                      {ready
                        ? "Card payments work over HTTP in test mode. Live Stripe requires HTTPS."
                        : "Card payments work over HTTP in test mode. Live Stripe requires HTTPS."}
                    </p>
                  ) : null}
                  {paymentReady ? (
                    <p className="text-sm text-text-muted">
                      {ready ? t("paymentConfirmed", language) : "Payment completed. Continue to review to place your order."}
                    </p>
                  ) : loading && !activeClientSecret ? (
                    <Skeleton className="h-32 w-full" />
                  ) : activeClientSecret ? (
                    <StripePaymentForm
                      clientSecret={activeClientSecret}
                      paymentMethod={paymentMethod}
                      language={language}
                      ready={ready}
                      onSuccess={() => {
                        setPaymentReady(true);
                        setError(null);
                        void placeOrder();
                      }}
                      onError={(msg) => {
                        setError(msg);
                        if (/terminal state/i.test(msg)) {
                          void retryPaymentSetup();
                        }
                      }}
                    />
                  ) : (
                    <p className="text-sm text-text-muted">{ready ? t("preparingPayment", language) : "Preparing payment…"}</p>
                  )}
                  {!paymentReady && !activeClientSecret && !loading ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2"
                      onClick={() => void retryPaymentSetup()}
                    >
                      Retry payment setup
                    </Button>
                  ) : null}
                  {paymentReady ? (
                    <Button type="button" className="mt-3" onClick={() => setStep(3)}>
                      {ready ? t("continueToReview", language) : "Continue to review"}
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {paymentMethod === "instapay" ? (
                <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-muted">
                  <p>{ready ? t("instaPayInstructions", language) : "Complete InstaPay after placing your order."}</p>
                  <Button type="button" className="mt-3" onClick={confirmOfflinePayment}>
                    {ready ? t("continueToReview", language) : "Continue to review"}
                  </Button>
                </div>
              ) : null}

              {paymentMethod === "cod" ? (
                <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-muted">
                  <p>{ready ? t("codInstructions", language) : "Pay cash when your order arrives."}</p>
                  <Button type="button" className="mt-3" onClick={confirmOfflinePayment}>
                    {ready ? t("continueToReview", language) : "Continue to review"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-3 space-y-3 text-sm">
              <p className="rounded-lg bg-surface-2 px-3 py-2">
                <span className="font-semibold">{ready ? t("paymentMethodLabel", language) : "Payment method"}: </span>
                {paymentMethodLabel(paymentMethod, language, ready)}
              </p>
              {lineItems.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-lg">
                    <Image src={product.pictureUrl} alt={product.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-text-muted">
                      {ready ? t("quantity", language) : "Qty"} {qty} — ${product.price * qty}
                    </p>
                  </div>
                </div>
              ))}
              <p className="text-text-muted">
                {paymentReady
                  ? ready
                    ? t("paymentConfirmed", language)
                    : "Payment confirmed. Place your order to finish."
                  : ready
                    ? t("completePaymentFirst", language)
                    : "Complete payment before placing order."}
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => (step === 0 ? router.push("/cart") : setStep((s) => s - 1))}>
              {step === 0 ? (ready ? t("backToCart", language) : "Back to cart") : ready ? t("back", language) : "Back"}
            </Button>
            {step === 0 ? (
              <Button type="button" onClick={() => void handleAddressContinue()} disabled={loading || addressesLoading}>
                {ready ? t("continue", language) : "Continue"}
              </Button>
            ) : null}
            {step === 1 ? (
              <Button type="button" onClick={handleDeliveryContinue} disabled={loading}>
                {ready ? t("continue", language) : "Continue"}
              </Button>
            ) : null}
            {step === 3 ? (
              <Button type="button" onClick={placeOrder} disabled={loading || !paymentReady}>
                {loading ? (ready ? t("placingOrder", language) : "Placing order…") : ready ? t("placeOrder", language) : "Place order"}
              </Button>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="section-title text-lg font-semibold">{ready ? t("summary", language) : "Summary"}</h2>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
            {lineItems.map(({ product, qty }) => (
              <div key={product.id} className="flex justify-between gap-2">
                <span className="line-clamp-1">{product.name}</span>
                <span>${product.price * qty}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
            <p className="flex justify-between">
              <span>{ready ? t("subtotal", language) : "Subtotal"}</span>
              <span>${subtotal.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span>{ready ? t("shipping", language) : "Shipping"}</span>
              <span>${effectiveShipping.toFixed(2)}</span>
            </p>
            {effectiveDiscount > 0 ? (
              <p className="flex justify-between text-emerald-700 dark:text-emerald-300">
                <span>{ready ? "Coupon" : "Coupon"} {basket?.couponCode ? `(${basket.couponCode})` : ""}</span>
                <span>-${effectiveDiscount.toFixed(2)}</span>
              </p>
            ) : null}
            {deliveryQuote && scheduledDeliveryAt && deliveryQuote.totalPrice !== deliveryQuote.basePrice ? (
              <p className="text-xs text-text-muted">
                Includes time-slot adjustments for your selected delivery window.
              </p>
            ) : null}
            <p className="flex justify-between font-bold">
              <span>{ready ? t("total", language) : "Total"}</span>
              <span>${total.toFixed(2)}</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
