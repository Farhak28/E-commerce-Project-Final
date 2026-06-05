"use client";

import { AddressFormFields } from "@/components/address-form-fields";
import { AddressNameField } from "@/components/address-name-field";
import { Input } from "@/components/ui";
import { t } from "@/lib/i18n";
import type { AddressDTO, SavedAddressDTO } from "@/lib/types";
import {
  emptyAddress,
  formatAddressLine,
  savedToAddressDTO,
} from "@/lib/utils/address";

export type AddressSelection =
  | { mode: "saved"; savedId: number }
  | { mode: "new" };

type SavedAddressPickerProps = {
  savedAddresses: SavedAddressDTO[];
  selection: AddressSelection;
  onSelectionChange: (selection: AddressSelection) => void;
  newAddress: AddressDTO;
  onNewAddressChange: (address: AddressDTO) => void;
  saveNewAddress: boolean;
  onSaveNewAddressChange: (save: boolean) => void;
  saveAsName: string;
  onSaveAsNameChange: (name: string) => void;
  language: "en" | "ar";
  ready: boolean;
};

export function SavedAddressPicker({
  savedAddresses,
  selection,
  onSelectionChange,
  newAddress,
  onNewAddressChange,
  saveNewAddress,
  onSaveNewAddressChange,
  saveAsName,
  onSaveAsNameChange,
  language,
  ready,
}: SavedAddressPickerProps) {
  return (
    <div className="space-y-3">
      {savedAddresses.length > 0 ? (
        <div className="space-y-2">
          {savedAddresses.map((saved) => (
            <label
              key={saved.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                selection.mode === "saved" && selection.savedId === saved.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <input
                type="radio"
                name="savedAddress"
                className="mt-1"
                checked={selection.mode === "saved" && selection.savedId === saved.id}
                onChange={() => onSelectionChange({ mode: "saved", savedId: saved.id })}
              />
              <div>
                <p className="font-semibold">{saved.name}</p>
                <p className="text-sm text-text-muted">
                  {saved.firstName} {saved.lastName}
                </p>
                <p className="text-xs text-text-muted">{formatAddressLine(savedToAddressDTO(saved))}</p>
              </div>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          {ready ? t("noSavedAddresses", language) : "No saved addresses yet."}
        </p>
      )}

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
          selection.mode === "new" ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <input
          type="radio"
          name="savedAddress"
          className="mt-1"
          checked={selection.mode === "new"}
          onChange={() => onSelectionChange({ mode: "new" })}
        />
        <div className="w-full">
          <p className="font-semibold">
            {ready ? t("useNewAddress", language) : "Use a different address"}
          </p>
          {selection.mode === "new" ? (
            <div className="mt-3 space-y-3">
              <AddressFormFields
                value={newAddress}
                onChange={onNewAddressChange}
                language={language}
                ready={ready}
                idPrefix="checkout-new"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={saveNewAddress}
                  onChange={(e) => onSaveNewAddressChange(e.target.checked)}
                />
                {ready ? t("saveAddressForLater", language) : "Save this address to my account"}
              </label>
              {saveNewAddress ? (
                <div className="space-y-2">
                  <p className="text-sm text-text-muted">
                    {ready ? t("addressNameLabel", language) : "Name this address"}
                  </p>
                  <AddressNameField
                    value={saveAsName}
                    onChange={onSaveAsNameChange}
                    language={language}
                    ready={ready}
                    id="checkout-save-name"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </label>
    </div>
  );
}

export function resolveCheckoutAddress(
  selection: AddressSelection,
  savedAddresses: SavedAddressDTO[],
  newAddress: AddressDTO,
): AddressDTO {
  if (selection.mode === "saved") {
    const saved = savedAddresses.find((a) => a.id === selection.savedId);
    return saved ? savedToAddressDTO(saved) : emptyAddress();
  }
  return newAddress;
}
