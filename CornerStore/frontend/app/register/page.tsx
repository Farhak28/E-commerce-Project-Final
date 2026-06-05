"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AddressFormFields } from "@/components/address-form-fields";
import { AddressNameField } from "@/components/address-name-field";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useAppPreferences } from "@/components/theme-provider";
import { t } from "@/lib/i18n";
import type { UpsertSavedAddressDTO } from "@/lib/types";
import { emptyUpsertAddress, isPopulatedUpsertAddress } from "@/lib/utils/address";
import { buildUserNameFromEmail, validatePassword } from "@/lib/utils/username";

export default function RegisterPage() {
  const router = useRouter();
  const { register, checkEmailExists } = useAuth();
  const { language, ready } = useAppPreferences();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  const [addresses, setAddresses] = useState<UpsertSavedAddressDTO[]>([
    emptyUpsertAddress("Home"),
  ]);

  const passwordHint =
    language === "ar"
      ? "6 أحرف على الأقل، رقم، حرف كبير، ورمز خاص (مثل Test1!)."
      : "At least 6 characters with a digit, uppercase letter, and special character (e.g. Test1!).";

  const updateSlot = (index: number, next: UpsertSavedAddressDTO) => {
    setAddresses((prev) => prev.map((slot, i) => (i === index ? next : slot)));
  };

  const addAddressSlot = () => {
    setAddresses((prev) => [...prev, emptyUpsertAddress("")]);
  };

  const removeAddressSlot = (index: number) => {
    setAddresses((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const displayName = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (!displayName || !email) {
      setError(language === "ar" ? "أدخل الاسم والبريد الإلكتروني." : "Enter your name and email.");
      return;
    }

    if (password !== confirm) {
      setError(t("passwordMismatch", language));
      return;
    }

    const passwordCheck = validatePassword(password, language);
    if (!passwordCheck.ok) {
      setError(passwordCheck.message);
      return;
    }

    setSubmitting(true);

    let emailTaken = false;
    try {
      emailTaken = await checkEmailExists(email);
    } catch {
      setSubmitting(false);
      setError(
        language === "ar"
          ? "تعذر التحقق من البريد. تأكد أن الـ API يعمل على المنفذ 5141."
          : "Could not verify email. Make sure the API is running on port 5141.",
      );
      return;
    }

    if (emailTaken) {
      setSubmitting(false);
      setError(t("accountExists", language));
      return;
    }

    const populatedAddresses = showAddresses
      ? addresses.filter(isPopulatedUpsertAddress)
      : undefined;

    const res = await register({
      email,
      displayName,
      userName: buildUserNameFromEmail(email),
      password,
      phoneNumber: "+10000000000",
      addresses: populatedAddresses?.length ? populatedAddresses : undefined,
    });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error ?? "Registration failed.");
      return;
    }
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="section-title text-3xl font-bold">
        {ready ? t("registerTitle", language) : "Create account"}
      </h1>
      <Card>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            name="name"
            placeholder={ready ? t("name", language) : "Full name"}
            autoComplete="name"
            required
          />
          <Input
            name="email"
            placeholder={ready ? t("email", language) : "Email address"}
            type="email"
            autoComplete="email"
            required
          />
          <Input
            name="password"
            placeholder={ready ? t("password", language) : "Password"}
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
          />
          <p className="text-xs text-text-muted">{passwordHint}</p>
          <Input
            name="confirm"
            placeholder={ready ? t("confirmPassword", language) : "Confirm password"}
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
          />

          <div className="rounded-xl border border-border bg-surface-2 p-3">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left text-sm font-semibold"
              onClick={() => setShowAddresses((open) => !open)}
            >
              <span>{ready ? t("optionalAddresses", language) : "Delivery addresses (optional)"}</span>
              <span className="text-text-muted">{showAddresses ? "−" : "+"}</span>
            </button>
            {showAddresses ? (
              <div className="mt-3 space-y-4">
                <p className="text-xs text-text-muted">
                  {ready ? t("optionalAddressesHint", language) : "Add as many addresses as you like with custom names."}
                </p>
                {addresses.map((slot, index) => (
                  <div key={index} className="space-y-2 rounded-xl border border-border bg-surface p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {ready ? t("addressNameLabel", language) : "Address name"}
                      </p>
                      {addresses.length > 1 ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-accent"
                          onClick={() => removeAddressSlot(index)}
                        >
                          {ready ? t("remove", language) : "Remove"}
                        </button>
                      ) : null}
                    </div>
                    <AddressNameField
                      value={slot.name}
                      onChange={(name) => updateSlot(index, { ...slot, name })}
                      language={language}
                      ready={ready}
                      id={`register-name-${index}`}
                    />
                    <AddressFormFields
                      value={slot}
                      onChange={(next) => updateSlot(index, { ...next, name: slot.name })}
                      language={language}
                      ready={ready}
                      idPrefix={`register-${index}`}
                    />
                  </div>
                ))}
                <Button type="button" variant="ghost" onClick={addAddressSlot}>
                  {ready ? t("addAnotherAddress", language) : "+ Add another address"}
                </Button>
              </div>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? language === "ar"
                ? "جاري إنشاء الحساب…"
                : "Creating account…"
              : ready
                ? t("register", language)
                : "Register"}
          </Button>
          {error ? <p className="text-sm text-accent">{error}</p> : null}
        </form>
        <p className="mt-4 text-sm text-text-muted">
          {ready ? t("alreadyHave", language) : "Already have an account?"}{" "}
          <Link href="/login" className="font-semibold text-primary">
            {ready ? t("signin", language) : "Sign in"}
          </Link>
        </p>
      </Card>
    </div>
  );
}
