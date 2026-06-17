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
  DELIVERY_TYPE_API,
  isOfflinePayment,
  usesStripe,
  type CheckoutPaymentMethod,
  type DeliveryType,
} from "@/lib/payment-methods";
import { ApiError } from "@/lib/services/api-client";
import { applyAccountCoupon } from "@/lib/services/account";
import * as deliveryService from "@/lib/services/delivery";
import * as ordersService from "@/lib/services/orders";
import * as paymentsService from "@/lib/services/payments";
import { isStripeConfigured, loadStripeConfig, type StripeConfigDTO } from "@/lib/stripe-config";
import { DeliveryCalendar } from "@/components/delivery-calendar";
import type {
  AddressDTO,
  AvailableDeliveryDateDTO,
  DeliveryQuoteDTO,
  DeliveryTimeSlotDTO,
  SavedAddressDTO,
} from "@/lib/types";
import { defaultSaveAsName, emptyAddress, isAddressComplete, savedToAddressDTO } from "@/lib/utils/address";
import { clearStripeReturnParams, readStripeReturnStatus } from "@/lib/stripe-checkout-return";
import { formatScheduledDelivery } from "@/lib/utils/order-status";

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
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("Standard");
  const [schedulingEnabled, setSchedulingEnabled] = useState(true);
  const [availableDates, setAvailableDates] = useState<AvailableDeliveryDateDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<DeliveryTimeSlotDTO[]>([]);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<number | null>(null);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuoteDTO | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [datesLoading, setDatesLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
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
        if (cancelled) return;
        setSelectedDeliveryId((prev) => {
          if (prev !== null) return prev;
          if (basket?.deliveryMethodId) return basket.deliveryMethodId;
          return methods[0]?.id ?? null;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [basket?.deliveryMethodId]);

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

  const scheduledIso = useMemo(() => {
    if (deliveryType !== "Scheduled") return null;
    return deliveryQuote?.scheduledDeliveryAt ?? null;
  }, [deliveryType, deliveryQuote?.scheduledDeliveryAt]);

  const basketScheduledAt = useMemo(() => {
    if (deliveryType !== "Scheduled") return null;
    return scheduledIso ?? deliveryQuote?.scheduledDeliveryAt ?? null;
  }, [deliveryType, scheduledIso, deliveryQuote?.scheduledDeliveryAt]);

  useEffect(() => {
    let cancelled = false;
    void deliveryService.getDeliverySettings().then((settings) => {
      if (!cancelled) setSchedulingEnabled(settings.schedulingEnabled);
    }).catch(() => {
      if (!cancelled) setSchedulingEnabled(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDeliveryId || deliveryType !== "Scheduled") {
      setAvailableDates([]);
      return;
    }

    let cancelled = false;
    setDatesLoading(true);
    void deliveryService
      .getAvailableDeliveryDates(selectedDeliveryId)
      .then((dates) => {
        if (!cancelled) setAvailableDates(dates);
      })
      .catch(() => {
        if (!cancelled) setAvailableDates([]);
      })
      .finally(() => {
        if (!cancelled) setDatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDeliveryId, deliveryType]);

  useEffect(() => {
    if (!selectedDeliveryId || deliveryType !== "Scheduled" || !selectedDate) {
      setTimeSlots([]);
      setSelectedTimeSlotId(null);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    void deliveryService
      .getDeliveryTimeSlots(selectedDeliveryId, selectedDate)
      .then((slots) => {
        if (!cancelled) {
          setTimeSlots(slots);
          setSelectedTimeSlotId(null);
        }
      })
      .catch(() => {
        if (!cancelled) setTimeSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDeliveryId, deliveryType, selectedDate]);

  useEffect(() => {
    if (!selectedDeliveryId) {
      setDeliveryQuote(null);
      return;
    }

    if (deliveryType === "Scheduled" && (!selectedDate || !selectedTimeSlotId)) {
      setDeliveryQuote(null);
      return;
    }

    let cancelled = false;
    setQuoteLoading(true);
    setQuoteError(null);
    void deliveryService
      .getDeliveryQuote(selectedDeliveryId, {
        deliveryType,
        ...(deliveryType === "Scheduled"
          ? { scheduledDate: selectedDate, deliveryTimeSlotId: selectedTimeSlotId }
          : {}),
      })
      .then((quote) => {
        if (!cancelled) {
          setDeliveryQuote(quote);
          setQuoteError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDeliveryQuote(null);
          const message =
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Could not calculate delivery cost.";
          setQuoteError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDeliveryId, deliveryType, selectedDate, selectedTimeSlotId]);

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
    if (deliveryType === "Scheduled") {
      if (!selectedDate || !selectedTimeSlotId) {
        setError(ready ? t("selectScheduleSlot", language) : "Select a delivery date and time slot.");
        return;
      }
      if (!deliveryQuote) {
        setError(ready ? t("deliveryQuoteLoading", language) : "Waiting for delivery quote. Try again.");
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      await setDeliveryMethod(
        selectedDeliveryId,
        basketScheduledAt,
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
      await syncBasket(selectedDeliveryId, basketScheduledAt, deliveryQuote?.totalPrice ?? null);
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
    basketScheduledAt,
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
        await syncBasket(selectedDeliveryId, basketScheduledAt, deliveryQuote?.totalPrice ?? null);
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
    basketScheduledAt,
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
    if (usesStripe(paymentMethod) && !paymentReady) {
      setError(ready ? t("completePaymentFirst", language) : "Complete payment before placing order.");
      setStep(2);
      return;
    }
    if (isOfflinePayment(paymentMethod) && !paymentReady) {
      setError(ready ? t("continueToReview", language) : "Continue to review to confirm your payment choice.");
      setStep(2);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await syncBasket(deliveryId, basketScheduledAt, deliveryQuote?.totalPrice ?? null);
      await ordersService.createOrder({
        basketId: basket.id,
        deliveryMethodId: deliveryId,
        shipToAddress: address,
        paymentMethod: PAYMENT_METHOD_API[paymentMethod],
        deliveryType: DELIVERY_TYPE_API[deliveryType],
        ...(deliveryType === "Scheduled" && selectedDate && selectedTimeSlotId
          ? {
              scheduledDate: selectedDate,
              deliveryTimeSlotId: selectedTimeSlotId,
              scheduledDeliveryAt: scheduledIso ?? deliveryQuote?.scheduledDeliveryAt ?? undefined,
            }
          : {}),
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
    paymentReady,
    ready,
    router,
    basketScheduledAt,
    deliveryQuote?.totalPrice,
    selectedDeliveryId,
    syncBasket,
    deliveryType,
    selectedDate,
    selectedTimeSlotId,
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
            <div className="mt-3 space-y-4">
              {!selectedDeliveryId ? (
                <p className="text-sm text-text-muted">
                  {ready ? t("loadingDelivery", language) : "Loading delivery options…"}
                </p>
              ) : null}

              {schedulingEnabled ? (
                <div className="space-y-2 rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-sm font-medium">
                    {ready ? t("deliveryTypeLabel", language) : "Delivery type"}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(["Standard", "Scheduled"] as const).map((type) => (
                      <label
                        key={type}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${
                          deliveryType === type ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryType"
                          checked={deliveryType === type}
                          onChange={() => {
                            setDeliveryType(type);
                            if (type === "Standard") {
                              setSelectedDate(null);
                              setSelectedTimeSlotId(null);
                            }
                          }}
                        />
                        <span>
                          {type === "Standard"
                            ? ready
                              ? t("standardDelivery", language)
                              : "Standard delivery"
                            : ready
                              ? t("scheduledDelivery", language)
                              : "Scheduled delivery"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {deliveryType === "Standard" && deliveryQuote && !quoteLoading ? (
                <div className="space-y-1 rounded-xl border border-border bg-surface-2 p-4 text-sm">
                  <p className="font-medium">
                    {ready ? t("standardDelivery", language) : "Standard delivery"}
                  </p>
                  {deliveryQuote.deliveryTime ? (
                    <p className="text-text-muted">
                      {ready
                        ? t("usuallyArrivesIn", language, { window: deliveryQuote.deliveryTime })
                        : `Usually arrives in ${deliveryQuote.deliveryTime}`}
                    </p>
                  ) : null}
                  {deliveryQuote.estimatedDeliveryDate ? (
                    <p className="text-foreground">
                      {ready ? t("estimatedDeliveryBy", language) : "Estimated by"}:{" "}
                      <span className="font-semibold">
                        {formatScheduledDelivery(deliveryQuote.estimatedDeliveryDate, language)}
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              {deliveryType === "Scheduled" && selectedDeliveryId ? (
                <div className="space-y-4 rounded-xl border border-border bg-surface-2 p-4">
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      {ready ? t("selectDeliveryDate", language) : "Select delivery date"}
                    </p>
                    {datesLoading ? (
                      <Skeleton className="h-56 w-full" />
                    ) : (
                      <DeliveryCalendar
                        availableDates={availableDates}
                        selectedDate={selectedDate}
                        onSelect={setSelectedDate}
                        language={language}
                      />
                    )}
                  </div>

                  {selectedDate ? (
                    <div>
                      <p className="mb-2 text-sm font-medium">
                        {ready ? t("selectTimeSlot", language) : "Select time slot"}
                      </p>
                      {slotsLoading ? (
                        <Skeleton className="h-20 w-full" />
                      ) : timeSlots.length === 0 ? (
                        <p className="text-sm text-text-muted">
                          {ready ? t("noTimeSlots", language) : "No time slots available for this date."}
                        </p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {timeSlots.map((slot) => (
                            <label
                              key={slot.id}
                              className={`flex cursor-pointer flex-col rounded-lg border p-3 text-sm ${
                                selectedTimeSlotId === slot.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border"
                              } ${!slot.isAvailable ? "cursor-not-allowed opacity-50" : ""}`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="timeSlot"
                                  disabled={!slot.isAvailable}
                                  checked={selectedTimeSlotId === slot.id}
                                  onChange={() => setSelectedTimeSlotId(slot.id)}
                                />
                                <span className="font-medium">{slot.label}</span>
                              </div>
                              <span className="mt-1 text-xs text-text-muted">
                                {slot.startTime} – {slot.endTime}
                                {slot.isAvailable
                                  ? ` · ${slot.remainingCapacity} ${ready ? t("slotsLeft", language) : "left"}`
                                  : ` · ${ready ? t("slotFull", language) : "Full"}`}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {quoteError ? (
                <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">{quoteError}</p>
              ) : null}

              {quoteLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : deliveryQuote &&
                (deliveryType === "Standard" ||
                  (deliveryType === "Scheduled" && selectedDate && selectedTimeSlotId)) ? (
                <div className="space-y-1 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                  <p className="font-semibold">
                    {ready ? t("calculatedShipping", language) : "Calculated delivery cost"}
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
                    <span>{ready ? t("shipping", language) : "Total shipping"}</span>
                    <span>${deliveryQuote.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              ) : null}
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
                        pendingAutoPlace.current = true;
                        void refreshCart();
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
                  ? isOfflinePayment(paymentMethod)
                    ? paymentMethod === "cod"
                      ? ready
                        ? t("codInstructions", language)
                        : "Pay cash when your order arrives."
                      : ready
                        ? t("instaPayInstructions", language)
                        : "Complete InstaPay after placing your order."
                    : ready
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
            {deliveryType === "Standard" && deliveryQuote?.deliveryTime ? (
              <p className="text-xs text-text-muted">
                {ready
                  ? t("usuallyArrivesIn", language, { window: deliveryQuote.deliveryTime })
                  : `Usually arrives in ${deliveryQuote.deliveryTime}`}
                {deliveryQuote.estimatedDeliveryDate
                  ? ` · ${ready ? t("estimatedDeliveryBy", language) : "Estimated by"} ${formatScheduledDelivery(deliveryQuote.estimatedDeliveryDate, language)}`
                  : ""}
              </p>
            ) : null}
            {deliveryType === "Scheduled" &&
            deliveryQuote &&
            deliveryQuote.totalPrice !== deliveryQuote.basePrice ? (
              <p className="text-xs text-text-muted">
                {ready ? t("scheduledShippingNote", language) : "Includes scheduling adjustments for your selected window."}
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
