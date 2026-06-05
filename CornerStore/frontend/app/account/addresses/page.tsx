"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AddressFormFields } from "@/components/address-form-fields";
import { AddressNameField } from "@/components/address-name-field";
import { Button, Card } from "@/components/ui";
import { useAppPreferences } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth-context";
import { t } from "@/lib/i18n";
import type { SavedAddressDTO, UpsertSavedAddressDTO } from "@/lib/types";
import {
  emptyUpsertAddress,
  isPopulatedUpsertAddress,
  savedToAddressDTO,
} from "@/lib/utils/address";

export default function AccountAddressesPage() {
  const { isSignedIn, getAddresses, upsertAddress, deleteAddress } = useAuth();
  const { language, ready } = useAppPreferences();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressDTO[]>([]);
  const [drafts, setDrafts] = useState<UpsertSavedAddressDTO[]>([]);
  const [newDraft, setNewDraft] = useState<UpsertSavedAddressDTO>(() => emptyUpsertAddress(""));
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    const addresses = await getAddresses();
    setSavedAddresses(addresses);
    setDrafts(
      addresses.map((saved) => ({
        id: saved.id,
        name: saved.name,
        ...savedToAddressDTO(saved),
      })),
    );
    setLoading(false);
  }, [getAddresses]);

  useEffect(() => {
    if (!isSignedIn) return;
    void loadAddresses();
  }, [isSignedIn, loadAddresses]);

  const updateDraft = (id: number, next: UpsertSavedAddressDTO) => {
    setDrafts((prev) => prev.map((draft) => (draft.id === id ? next : draft)));
  };

  const handleSave = async (draft: UpsertSavedAddressDTO, key: number | "new") => {
    if (!isPopulatedUpsertAddress(draft)) {
      setError(ready ? t("fillAddress", language) : "Please fill in all address fields.");
      return;
    }
    setSavingId(key);
    setError(null);
    setMessage(null);
    const result = await upsertAddress(draft);
    setSavingId(null);
    if (!result.ok) {
      setError(result.error ?? "Failed to save address.");
      return;
    }
    setMessage(ready ? t("addressSaved", language) : "Address saved.");
    setShowNewForm(false);
    setNewDraft(emptyUpsertAddress(""));
    await loadAddresses();
  };

  const handleDelete = async (addressId: number) => {
    setError(null);
    setMessage(null);
    const result = await deleteAddress(addressId);
    if (!result.ok) {
      setError(result.error ?? "Failed to delete address.");
      return;
    }
    setMessage(ready ? t("addressDeleted", language) : "Address removed.");
    await loadAddresses();
  };

  if (!isSignedIn) {
    return (
      <Card>
        <p className="text-sm text-text-muted">
          {language === "ar" ? "سجّل الدخول لإدارة العناوين." : "Sign in to manage your addresses."}
        </p>
        <Link href="/login" className="mt-3 inline-flex text-sm font-semibold text-primary">
          {ready ? t("signin", language) : "Sign in"}
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="animate-rise rounded-3xl border border-border p-6" style={{ background: "var(--hero-gradient)" }}>
        <h1 className="section-title text-3xl font-bold text-white">
          {ready ? t("savedAddresses", language) : "Saved addresses"}
        </h1>
        <p className="mt-1 text-sm text-white/90">
          {ready ? t("optionalAddressesHint", language) : "Add as many addresses as you like with custom names."}
        </p>
      </section>

      {message ? <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">{error}</p> : null}

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <p className="text-sm text-text-muted">{ready ? t("loading", language) : "Loading…"}</p>
          </Card>
        ) : (
          <>
            {drafts.map((draft) => (
              <Card key={draft.id}>
                <AddressNameField
                  value={draft.name}
                  onChange={(name) => updateDraft(draft.id!, { ...draft, name })}
                  language={language}
                  ready={ready}
                  id={`account-name-${draft.id}`}
                />
                <div className="mt-3">
                  <AddressFormFields
                    value={draft}
                    onChange={(next) => updateDraft(draft.id!, { ...next, id: draft.id, name: draft.name })}
                    language={language}
                    ready={ready}
                    idPrefix={`account-${draft.id}`}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void handleSave(draft, draft.id!)}
                    disabled={savingId === draft.id}
                  >
                    {savingId === draft.id
                      ? ready
                        ? t("loading", language)
                        : "Saving…"
                      : ready
                        ? t("saveAddress", language)
                        : "Save address"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => void handleDelete(draft.id!)}>
                    {ready ? t("deleteAddress", language) : "Delete"}
                  </Button>
                </div>
              </Card>
            ))}

            {showNewForm ? (
              <Card>
                <h2 className="section-title text-lg font-semibold">
                  {ready ? t("addNewAddress", language) : "New address"}
                </h2>
                <div className="mt-3 space-y-3">
                  <AddressNameField
                    value={newDraft.name}
                    onChange={(name) => setNewDraft((prev) => ({ ...prev, name }))}
                    language={language}
                    ready={ready}
                    id="account-new-name"
                  />
                  <AddressFormFields
                    value={newDraft}
                    onChange={(next) => setNewDraft((prev) => ({ ...next, name: prev.name }))}
                    language={language}
                    ready={ready}
                    idPrefix="account-new"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void handleSave(newDraft, "new")}
                    disabled={savingId === "new"}
                  >
                    {savingId === "new"
                      ? ready
                        ? t("loading", language)
                        : "Saving…"
                      : ready
                        ? t("saveAddress", language)
                        : "Save address"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowNewForm(false)}>
                    {ready ? t("back", language) : "Cancel"}
                  </Button>
                </div>
              </Card>
            ) : (
              <Button type="button" variant="secondary" onClick={() => setShowNewForm(true)}>
                {ready ? t("addAnotherAddress", language) : "+ Add another address"}
              </Button>
            )}
          </>
        )}
      </div>

      <Link href="/account" className="inline-flex text-sm font-semibold text-primary">
        {language === "ar" ? "← العودة للحساب" : "← Back to account"}
      </Link>
    </div>
  );
}
